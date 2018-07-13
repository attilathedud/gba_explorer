<template>
    <div>
        <div class="centered-horizontal">
            <a v-if="isSearching" class="button is-loading is-large is-text centered-vertical"></a>
        </div>
        <div v-if="!isSearching">
            <div v-if="sappyTableOffset == -1">
                <p>No sound engine found</p>
            </div>
            <div v-else>
                <p>Sound engine detected at 0x{{toHexString(sappyTableOffset, 8)}}</p>
                <p>Song table detected at 0x{{toHexString(songTableOffset, 8)}}</p>
                <p>Song levels {{songLevels}}</p>
                <p>Polyphony: {{polyphony}}, Main Volume: {{mainVolume}}, Sampling Rate Index: {{samplingRateLookup[samplingRateIndex]}}, dac: {{dacBits}} bits</p>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import sww from 'simple-web-worker';
const fs = require('fs');

import Midi from '../midi/midi.js';
import Note from '../midi/note.js';

export default {
    name: 'Sounds',    
    computed: {
        ...mapGetters([
            'rom'
        ])
    },
    data: function() {
        return {
            isSearching: false,
            sappyTableOffset: 0,
            songTableOffset: 0,
            songLevels: 0,
            polyphony : 0,
            mainVolume : 0,
            samplingRateIndex : 0,
            dacBits : 0,
            songList : [],
            samplingRateLookup: [
                "invalid", "5734 Hz", "7884 Hz", "10512 Hz", "13379 Hz", "15768 Hz", "18157 Hz",
                "21024 Hz", "26758 Hz", "31536 Hz", "36314 Hz", "40137 Hz", "42048 Hz", "invalid", "invalid", "invalid"
            ],
            notes_playing: [],
            tracks: 0,
            midi: {},
            track_ptr: [],
            counter: [],
            track_completed: [],
            lfo_depth: [],
            lfo_delay: [],
            lfo_flag: [],
            lfo_type: [],
            lfo_delay_ctr: [],
            loop_adr: 0,
            loop_flag: true,
            return_flag: [],
            last_cmd: [],
            return_ptr: [],
            last_key: [],
            last_vel: [],
            key_shift: []
        }
    },
    methods: {
        scan: function() {
            this.isSearching = true;
            this.worker.postMessage('scan', [this.rom])
                .then(results => {
                    this.sappyTableOffset = results.sappyTableOffset;
                    this.songTableOffset = results.songTableOffset;
                    this.songLevels = results.songLevels;
                    this.polyphony = results.polyphony;
                    this.mainVolume = results.mainVolume;
                    this.samplingRateIndex = results.samplingRateIndex;
                    this.dacBits = results.dacBits;

                    this.isSearching = false;
                });
        },
        start_lfo: function(track) {
            // Reset down delay counter to its initial value
            if (this.lfo_delay[track] != 0)
                this.lfo_delay_ctr[track] = this.lfo_delay[track];
        },
        stop_lfo(track) {
        // Cancel a LFO if it was playing,
        if (this.lfo_flag[track])
            {
                if (this.lfo_type[track] == 0) {
                    this.midi.add_controller(track, 1, 0);
                }
                else {
                    this.midi.add_chanaft(track, 0);
                }
                this.lfo_flag[track] = false;
            }
            else {
                this.lfo_delay_ctr[track] = 0;			// cancel delay counter if it wasn't playing
            }
        },
        process_event: function(track) {
            // Length table for notes and rests
            let lenTbl =
            [
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
                16, 17, 18, 19, 20, 21, 22, 23, 24, 28, 30, 32, 36,
                40, 42, 44, 48, 52, 54, 56, 60, 64, 66, 68, 72, 76, 78,
                80, 84, 88, 90, 92, 96
            ];

            let command = this.rom.readUInt8(this.track_ptr[track]);

            this.track_ptr[track]++;
            let arg1 = 0;
            // Repeat last command, the byte read was in fact the first argument
            if (command < 0x80)
            {
                arg1 = command;
                command = this.last_cmd[track];
            }

            // Delta time command
            else if (command <= 0xb0)
            {
                this.counter[track] = lenTbl[command - 0x80];
                return;
            }

            // End track command
            else if (command == 0xb1)
            {
                // Null pointer
                this.track_ptr[track] = 0;
                this.track_completed[track] = true;
                return;
            }

            // Jump command
            else if (command == 0xb2)
            {
                this.track_ptr[track] = this.rom.readInt32LE(this.track_ptr[track]) & 0x3FFFFFF;

                // detect the end track
                this.track_completed[track] = true;
                return;
            }

            // Call command
            else if (command == 0xb3)
            {
                let addr = this.rom.readInt32LE(this.track_ptr[track]) & 0x3FFFFFF;

                // Return address for the track
                this.return_ptr[track] = this.track_ptr[track] + 4;
                // Now points to called address
                this.track_ptr[track] = addr;
                this.return_flag[track] = true;
                return;
            }

            // Return command
            else if (command == 0xb4)
            {
                if (this.return_flag[track])
                {
                    this.track_ptr[track] = this.return_ptr[track];
                    this.return_flag[track] = false;
                }
                return;
            }

            // Tempo change
            else if (command == 0xbb)
            {
                let tempo = 2 * this.rom.readUInt8(this.track_ptr[track]);
                this.track_ptr[track]++;
                this.midi.add_tempo(tempo);
                return;
            }

            else
            {
                // Normal command
                this.last_cmd[track] = command;
                // Need argument
                arg1 = this.rom.readUInt8(this.track_ptr[track]);
                this.track_ptr[track]++;
            }

            // Note on with specified length command
            if (command >= 0xd0)
            {
                let key = 0;
                let vel = 0;
                let len_ofs = 0;
                // Is arg1 a key value ?
                if (arg1 < 0x80)
                {	// Yes -> use new key value
                    key = arg1;
                    this.last_key[track] = key;

                    let arg2 = this.rom.readUInt8(this.track_ptr[track]);
                    // Is arg2 a velocity ?
                    if (arg2 < 0x80)
                    {	// Yes -> use new velocity value
                        vel = arg2;
                        this.last_vel[track] = vel;
                        this.track_ptr[track]++;

                        let arg3 = this.rom.readUInt8(this.track_ptr[track]);

                        // Is there a length offset ?
                        if (arg3 < 0x80)
                        {	// Yes -> read it and increment pointer
                            len_ofs = arg3;
                            this.track_ptr[track]++;
                        }
                    }
                    else
                    {	// No -> use previous velocity value
                        vel = this.last_vel[track];
                    }
                }
                else
                {
                    // No -> use last value
                    key = this.last_key[track];
                    vel = this.last_vel[track];
                    this.track_ptr[track]--;		// Seek back, as arg 1 is unused and belong to next event !
                }

                // Linearise velocity if needed
                //if (lv) vel = sqrt(127.0 * vel);

                this.notes_playing.unshift( new Note(this.midi, track, lenTbl[command - 0xd0 + 1] + len_ofs, key + this.key_shift[track], vel, this.lfo_delay, this.lfo_delay_ctr, this.lfo_flag, this.lfo_flag) );
                return;
            }

            // Other commands
            switch (command)
            {
                // Key shift
                case 0xbc:
                    this.key_shift[track] = arg1;
                    return;

                // Set instrument
                case 0xbd:
                    this.midi.add_pchange(track, arg1);
                    return;

                // Set volume
                case 0xbe:
                	// Linearise volume if needed
                    let volume = arg1;
                    this.midi.add_controller(track, 7, volume);
                	return;

                // Set panning
                case 0xbf:
                    this.midi.add_controller(track, 10, arg1);
                    return;

                // Pitch bend
                case 0xc0:
                    this.midi.add_pitch_bend(track, arg1);
                    return;

                // Pitch bend range
                case 0xc1:
                    this.midi.add_controller(track, 20, arg1);
                    return;

                // LFO Speed
                case 0xc2:
                    this.midi.add_controller(track, 21, arg1);
                    return;

                // LFO delay
                case 0xc3:
                    this.midi.add_controller(track, 26, arg1);
                    return;

                // LFO depth
                case 0xc4:
                    this.midi.add_controller(track, 1, arg1);
                    return;

                // LFO type
                case 0xc5:
                    this.midi.add_controller(track, 22, arg1);
                    return;

                // Detune
                case 0xc8:
                    this.midi.add_controller(track, 24, arg1);
                    return;

                // Key off
                case 0xce:
                {
                    let key = 0;
                    let vel = 0;

                    // Is arg1 a key value ?
                    if (arg1 < 0x80)
                    {	// Yes -> use new key value
                        key = arg1;
                        this.last_key[track] = key;
                    }
                    else
                    {	// No -> use last value
                        key = this.last_key[track];
                        vel = this.last_vel[track];
                        this.track_ptr[track]--;		// Seek back, as arg 1 is unused and belong to next event !
                    }

                    this.midi.add_note_off(track, key + this.key_shift[track], vel);
                    this.stop_lfo(track);
                }	return;

                // Key on
                case 0xcf:
                {
                    let key = 0;
                    let vel = 0;
                    // Is arg1 a key value ?
                    if (arg1 < 0x80)
                    {
                        // Yes -> use new key value
                        key = arg1;
                        this.last_key[track] = key;

                        let arg2 = this.rom.readUInt8(this.track_ptr[track]);
                        // Is arg2 a velocity ?
                        if (arg2 < 0x80)
                        {
                            // Yes -> use new velocity value
                            vel = arg2;
                            this.last_vel[track] = vel;
                            this.track_ptr[track]++;
                        }
                        else	// No -> use previous velocity value
                            vel = this.last_vel[track];
                    }
                    else
                    {
                        // No -> use last value
                        key = this.last_key[track];
                        vel = this.last_vel[track];
                        this.track_ptr[track]--;		// Seek back, as arg 1 is unused and belong to next event !
                    }

                    // Make note of infinite length
                    this.notes_playing.unshift(new Note(this.midi, track, -1, key + this.key_shift[track], vel, this.lfo_delay, this.lfo_delay_ctr, this.lfo_flag, this.lfo_flag));
                }	return;

                default :
                    break;
            }
        },
        process_lfo: function(track) {
            if (this.lfo_delay_ctr[track] != 0)
            {
                // Decrease counter if it's value was nonzero
                if (--this.lfo_delay_ctr[track] == 0)
                {
                    // If 1->0 transition we need to add a signal to start the LFO
                    if (this.lfo_type[track] == 0)
                        // Send a controller 1 if pitch LFO
                        this.midi.add_controller(track, 1, (this.lfo_depth[track] < 16) ? this.lfo_depth[track] * 8 : 127);
                    else
                        // Send a channel aftertouch otherwise
                        this.midi.add_chanaft(track, (this.lfo_depth[track] < 16) ? this.lfo_depth[track] * 8 : 127);
                    this.lfo_flag[track] = true;
                }
            }
        },
        tick: function() {
            //notes_playing.remove_if (countdown_is_over);
            this.notes_playing = this.notes_playing.filter(el => !el.countdown_is_over());

            // Process all tracks
            for (let track = 0; track < this.tracks; track++)
            {
                this.counter[track]--;
                // Process events until counter non-null or pointer null
                // This might not be executed if counter both are non null.
                while (this.track_ptr[track] != 0 && this.counter[track] <= 0)
                {
                    // Check if we're at loop start point
                    if (track == 0 && this.loop_flag && !this.return_flag[0] && !this.track_completed[0] && this.track_ptr[0] == this.loop_adr)
                        this.midi.add_marker("loopStart");

                    this.process_event(track);
                }
            }

            for (let track = 0; track < this.tracks; track++)
            {
                this.process_lfo(track);
            }

            // Compute if all still active channels are completely decoded
            let all_completed_flag = true;
            for (let i = 0; i < this.tracks; i++) {
                all_completed_flag &= this.track_completed[i];
            }

            // If everything is completed, the main program should quit its loop
            if (all_completed_flag) {
                return false;
            }

            // Make note on events for this tick
            //(it's important they are made after all other events)
            this.notes_playing.forEach(function(note){
                note.make_note_on_event();
            });

            // Increment MIDI time
            this.midi.clock();
            
            return true;
        },
        dumpTrack: function() {
            this.midi = new Midi(24);

            let offset = 0xdcc6cc;
            //let offset = 0xdcf734;

            this.tracks = this.rom[offset];
            let reverb = this.rom.readInt8(offset + 3);

            this.track_ptr = [];

            for (let i = 0; i < this.tracks; i++)
            {
                this.track_ptr[i] = this.rom.readInt32LE(offset + (4 * i) + 8) & 0x3FFFFFF;
                //todo: fix location

                this.lfo_depth[i] = 0;
                this.lfo_delay[i] = 0;
                this.lfo_flag[i] = false;

                if (reverb < 0) {
                    this.midi.add_controller(i, 91, reverb & 0x7f);
                }
            }
            this.loop_adr = 0;

            let loop_offset = 0;

            if (this.tracks > 1)	{
                loop_offset = this.track_ptr[1] - 9;
            }
            else {
                loop_offset = offset - 9;
            }

            for (let i = 0; i < 5; i++) {
                if(this.rom[loop_offset + i] == 0xb2) {
                    this.loop_flag = true;
                    this.loop_adr = this.rom.readInt32LE(loop_offset + i + 1) & 0x3FFFFFF;
                    break;
                }
            }

            for( let i = 0; i < 16; i++ ) {
                this.counter[i] = 0;
            }

            let i = 100000;
            while (this.tick(this.tracks))
            {
                if( i-- == 0 )
                    break;
            }            

            if (this.loop_flag) {
                this.midi.add_marker("loopEnd");
            }

            console.log(this.midi.data.map(d => Number(d).toString(16)));

            fs.writeFile(process.cwd() + '/midis/test.mid', this.midi.getMidiFile(), (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
    },
    created: function() {
        this.worker = sww.create([
            { 
                message: 'scan', 
                func: function (rom) {
                    function toHexString(number, padding) {
                        return Number(number).toString(16).toUpperCase().padStart(padding, '0')
                    }

                    function reverseIndianness(offset) {
                        //use Buffer read functions
                        return parseInt(toHexString(rom[offset+3],2) + toHexString(rom[offset+2],2) + toHexString(rom[offset+1],2) + toHexString(rom[offset],2), 16);
                    }

                    //code is taken from GBA Sappy Engine Detector by Bregalad
                    let sappy_signature_old = [
                        0x00, 0xB5, 0x00, 0x04, 0x07, 0x4A, 0x08, 0x49,
                        0x40, 0x0B, 0x40, 0x18, 0x83, 0x88, 0x59, 0x00,
                        0xC9, 0x18, 0x89, 0x00, 0x89, 0x18, 0x0A, 0x68,
                        0x01, 0x68, 0x10, 0x1C, 0x00, 0xF0
                    ];

                    let sappy_signature_new = [
                        0x00, 0xB5, 0x00, 0x04, 0x07, 0x4B, 0x08, 0x49,
                        0x40, 0x0B, 0x40, 0x18, 0x82, 0x88, 0x51, 0x00,
                        0x89, 0x18, 0x89, 0x00, 0xC9, 0x18, 0x0A, 0x68,
                        0x01, 0x68, 0x10, 0x1C, 0x00, 0xF0
                    ];

                    let selectSongOffset = 0;
                    let matchScore = 0;

                    for( let i = 0; i < rom.byteLength; i++ ) {
                        matchScore = 0;

                        for( let j = 0; j < sappy_signature_old.length; j++ ) {
                            if( sappy_signature_old[j] == rom[i+j] ) {
                                matchScore++;
                            }
                        }

                        if( matchScore == sappy_signature_old.length ) {
                            selectSongOffset = i;
                            break;
                        }

                        matchScore = 0;

                        for( let j = 0; j < sappy_signature_new.length; j++ ) {
                            if( sappy_signature_new[j] == rom[i+j] ) {
                                matchScore++;
                            }
                        }

                        if( matchScore == sappy_signature_new.length ) {
                            selectSongOffset = i;
                            break;
                        }
                    }

                    if( selectSongOffset === 0 ) {
                        return {'sappyTableOffset' : -1};
                    }

                    let sappyTableOffset = selectSongOffset - 1;
                    while( sappyTableOffset > 0 && sappyTableOffset > selectSongOffset - 0x20 ) {
                        if( rom[sappyTableOffset] == 0x00 && rom[sappyTableOffset+1] == 0xB5 ) {
                            break;
                        }
                        sappyTableOffset--;
                    }

                    let offset = sappyTableOffset - 16;

                    let data0 = reverseIndianness(offset);
                    let data1 = reverseIndianness(offset + 4);
                    let data2 = reverseIndianness(offset + 8);

                    let songTableOffset = (data2 & 0x3FFFFFF) + 12 * data1;

                    let polyphony = (data0 & 0x000F00) >> 8;
                    let mainVolume = (data0 & 0x00F000) >> 12;
                    let samplingRateIndex = (data0 & 0x0F0000) >> 16;
                    let dacBits = ((data0 & 0xF00000) >> 20);

                    let songList = [];
                    let streamPointer = songTableOffset;

                    let songPointer = 0;
                    do {
                        songPointer = reverseIndianness(streamPointer) - 0x8000000;
                        songList.push(songPointer);
                        streamPointer += 4;
                        streamPointer += 4;
                    } while( songPointer != 0 && songPointer < rom.byteLength );

                    return {
                        'sappyTableOffset' : sappyTableOffset, 
                        'songLevels' : data1, 
                        'songTableOffset' : songTableOffset,
                        'polyphony' : polyphony,
                        'mainVolume' : mainVolume,
                        'samplingRateIndex' : samplingRateIndex,
                        'dacBits' : dacBits,
                        'songList' : songList
                    };
                }
            }
        ]);

        this.scan();
        this.dumpTrack();
    }
};
</script>
