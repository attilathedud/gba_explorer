import Midi from "../midi/midi.js";
import Note from "../midi/note.js";

export default class Track {
    constructor(rom) {
        this.rom = rom;
        this.midi = {};
        this.track_amount= 0;
        this.track_ptr= [];
        this.loop_adr= 0;
        this.loop_flag= true;
        this.notes_playing= [];
        this.counter= [];
        this.track_completed= [];
        this.lfo_depth= [];
        this.lfo_delay= [];
        this.lfo_flag= [];
        this.lfo_type= [];
        this.lfo_delay_ctr= [];
        this.lfo_hack= [];
        this.return_flag= [];
        this.last_cmd= [];
        this.return_ptr= [];
        this.last_key= [];
        this.last_vel= [];
        this.key_shift= [];
    }

    start_lfo(track) {
        // Reset down delay counter to its initial value
        if (this.lfo_delay[track] != 0) {
            this.lfo_delay_ctr[track] = this.lfo_delay[track];
        }
    }

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
    }

    process_lfo(track) {
        if (this.lfo_delay_ctr[track] != 0)
        {
            // Decrease counter if it's value was nonzero
            if (--this.lfo_delay_ctr[track] == 0) {
                // If 1->0 transition we need to add a signal to start the LFO
                if (this.lfo_type[track] == 0) {
                    // Send a controller 1 if pitch LFO
                    this.midi.add_controller(track, 1, (this.lfo_depth[track] < 16) ? this.lfo_depth[track] * 8 : 127);
                }
                else {
                    // Send a channel aftertouch otherwise
                    this.midi.add_chanaft(track, (this.lfo_depth[track] < 16) ? this.lfo_depth[track] * 8 : 127);
                }

                this.lfo_flag[track] = true;
            }
        }
    }

    process_event(track) {
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
        if (command < 0x80) {
            arg1 = command;
            command = this.last_cmd[track];
        }
        // Delta time command
        else if (command <= 0xb0) {
            this.counter[track] = lenTbl[command - 0x80];
            return;
        }
        else {
            switch( command ) {
            // End track command
            case 0xb1:
                // Null pointer
                this.track_ptr[track] = 0;
                this.track_completed[track] = true;
                return;
                // Jump command
            case 0xb2:
                this.track_ptr[track] = this.rom.readInt32LE(this.track_ptr[track]) & 0x3FFFFFF;

                // detect the end track
                this.track_completed[track] = true;
                return;
                // Call command
            case 0xb3:
                let addr = this.rom.readInt32LE(this.track_ptr[track]) & 0x3FFFFFF;

                // Return address for the track
                this.return_ptr[track] = this.track_ptr[track] + 4;
                // Now points to called address
                this.track_ptr[track] = addr;
                this.return_flag[track] = true;
                return;
                // Return command
            case 0xb4:
                if (this.return_flag[track])
                {
                    this.track_ptr[track] = this.return_ptr[track];
                    this.return_flag[track] = false;
                }
                return;
                // Tempo change
            case 0xbb:
                let tempo = 2 * this.rom.readUInt8(this.track_ptr[track]);
                this.track_ptr[track]++;
                this.midi.add_tempo(tempo);
                return;
            default:
                // Normal command
                this.last_cmd[track] = command;
                // Need argument
                arg1 = this.rom.readUInt8(this.track_ptr[track]);
                this.track_ptr[track]++;
                break;
            }
        }

        // Note on with specified length command
        if (command >= 0xd0) {
            let key = 0;
            let vel = 0;
            let len_ofs = 0;
            // Is arg1 a key value ?
            if (arg1 < 0x80) {	
                // Yes -> use new key value
                key = arg1;
                this.last_key[track] = key;

                let arg2 = this.rom.readUInt8(this.track_ptr[track]);
                // Is arg2 a velocity ?
                if (arg2 < 0x80) {	
                    // Yes -> use new velocity value
                    vel = arg2;
                    this.last_vel[track] = vel;
                    this.track_ptr[track]++;

                    let arg3 = this.rom.readUInt8(this.track_ptr[track]);

                    // Is there a length offset ?
                    if (arg3 < 0x80) {
                        // Yes -> read it and increment pointer
                        len_ofs = arg3;
                        this.track_ptr[track]++;
                    }
                }
                else {	
                    // No -> use previous velocity value
                    vel = this.last_vel[track];
                }
            }
            else {
                // No -> use last value
                key = this.last_key[track];
                vel = this.last_vel[track];
                this.track_ptr[track]--;		// Seek back, as arg 1 is unused and belong to next event !
            }

            // Linearise velocity if needed
            vel = Math.trunc(Math.sqrt(127.0 * vel));

            this.notes_playing.unshift( new Note(this.midi, track, lenTbl[command - 0xd0 + 1] + len_ofs, key + this.key_shift[track], vel, this.lfo_delay, this.lfo_delay_ctr, this.lfo_flag, this.lfo_type) );
            return;
        }

        // Other commands
        switch (command) {
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
            let volume = Math.trunc(Math.sqrt(127.0 * arg1));
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
        {
            let arg1_bits = arg1.toString(2);
            this.midi.add_RPN(track, 0, parseInt(arg1_bits.substr(arg1_bits.length - 8), 2));
            return;
        }
        // LFO Speed
        case 0xc2:
            this.midi.add_NRPN(track, 136, arg1);
            return;
            // LFO delay
        case 0xc3:
            this.lfo_delay[track] = arg1;
            return;
            // LFO depth
        case 0xc4:
            if (this.lfo_delay[track] == 0 && this.lfo_hack[track]) {
                if (this.lfo_type[track]==0) {
                    this.midi.add_controller(track, 1, arg1>12 ? 127 : 10 * arg1);
                }
                else {
                    this.midi.add_chanaft(track, arg1>12 ? 127 : 10 * arg1);
                }

                this.lfo_flag[track] = true;
            }
            this.lfo_depth[track] = arg1;
            // I had a stupid bug with LFO inserting controllers I didn't want at the start of files
            // So I made a terrible quick fix for it, in the mean time I can find something better to prevent it.
            this.lfo_hack[track] = true;
            return;
            // LFO type
        case 0xc5:
            this.lfo_type[track] = arg1;
            return;
            // Detune
        case 0xc8:
        {
            let arg1_bits = arg1.toString(2);
            this.midi.add_RPN(track, 1, parseInt(arg1_bits.substr(arg1_bits.length - 8), 2));
            return;
        }
        // Key off
        case 0xce:
        {
            let key = 0;
            let vel = 0;

            // Is arg1 a key value ?
            if (arg1 < 0x80) {	
                // Yes -> use new key value
                key = arg1;
                this.last_key[track] = key;
            }
            else {	
                // No -> use last value
                key = this.last_key[track];
                vel = this.last_vel[track];
                this.track_ptr[track]--;		// Seek back, as arg 1 is unused and belong to next event !
            }

            this.midi.add_note_off(track, key + this.key_shift[track], vel);
            this.stop_lfo(track);
            return;
        }
        // Key on
        case 0xcf:
        {
            let key = 0;
            let vel = 0;
            // Is arg1 a key value ?
            if (arg1 < 0x80) {
                // Yes -> use new key value
                key = arg1;
                this.last_key[track] = key;

                let arg2 = this.rom.readUInt8(this.track_ptr[track]);
                // Is arg2 a velocity ?
                if (arg2 < 0x80) {
                    // Yes -> use new velocity value
                    vel = arg2;
                    this.last_vel[track] = vel;
                    this.track_ptr[track]++;
                }
                else {
                    	// No -> use previous velocity value
                    vel = this.last_vel[track];
                }
            }
            else {
                // No -> use last value
                key = this.last_key[track];
                vel = this.last_vel[track];
                this.track_ptr[track]--;		// Seek back, as arg 1 is unused and belong to next event !
            }

            vel = Math.trunc(Math.sqrt(127.0 * vel));

            // Make note of infinite length
            this.notes_playing.unshift(new Note(this.midi, track, -1, key + this.key_shift[track], vel, this.lfo_delay, this.lfo_delay_ctr, this.lfo_flag, this.lfo_type));
            return;
        }

        default :
            break;
        }
    }

    tick() {
        this.notes_playing = this.notes_playing.filter(el => !el.countdown_is_over());

        // Process all tracks
        for (let track = 0; track < this.track_amount; track++) {
            this.counter[track]--;
            // Process events until counter non-null or pointer null
            // This might not be executed if counter both are non null.
            while (this.track_ptr[track] != 0 && this.counter[track] <= 0) {
                // Check if we're at loop start point
                if (track == 0 && this.loop_flag && !this.return_flag[0] && !this.track_completed[0] && this.track_ptr[0] == this.loop_adr)
                    this.midi.add_marker("loopStart");

                this.process_event(track);
            }
        }

        for (let track = 0; track < this.track_amount; track++) {
            this.process_lfo(track);
        }

        // Compute if all still active channels are completely decoded
        let all_completed_flag = true;
        for (let i = 0; i < this.track_amount; i++) {
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
    }

    dumpTrack(offset) {
        this.lfo_depth.length = 16;
        this.lfo_depth.fill(0);
        this.lfo_delay.length = 16;
        this.lfo_delay.fill(0);
        this.lfo_type.length = 16;
        this.lfo_type.fill(0);
        this.lfo_delay_ctr.length = 16;
        this.lfo_delay_ctr.fill(0);
        this.counter.length = 16;
        this.counter.fill(0);
        this.last_cmd.length = 16;
        this.last_cmd.fill(0);
        this.return_ptr.length = 16;
        this.return_ptr.fill(0);
        this.last_key.length = 16;
        this.last_key.fill(0);
        this.last_vel.length = 16;
        this.last_vel.fill(0);
        this.key_shift.length = 16;
        this.key_shift.fill(0);

        this.lfo_flag.length = 16;
        this.lfo_flag.fill(false);
        this.track_completed.length = 16;
        this.track_completed.fill(false);
        this.return_flag.length = 16;
        this.return_flag.fill(false);
        this.lfo_hack.length = 16;
        this.lfo_hack.fill(false);

        this.midi = new Midi(24);

        //gs stuff
        let gs_reset_sysex = [0x41, 0x10, 0x42, 0x12, 0x40, 0x00, 0x7f, 0x00, 0x41];
        this.midi.add_sysex(gs_reset_sysex, gs_reset_sysex.length);
        // Part 10 to normal
        let part_10_normal_sysex = [0x41, 0x10, 0x42, 0x12, 0x40, 0x10, 0x15, 0x00, 0x1b];
        this.midi.add_sysex(part_10_normal_sysex, part_10_normal_sysex.length);

        this.track_amount = this.rom[offset];
        let reverb = this.rom.readInt8(offset + 3);

        this.track_ptr = [];

        for (let i = 0; i < this.track_amount; i++) {
            this.track_ptr[i] = this.rom.readInt32LE(offset + (4 * i) + 8) & 0x3FFFFFF;

            if (reverb < 0) {
                this.midi.add_controller(i, 91, Math.trunc(Math.sqrt((reverb & 0x7f) * 127.0)));
            }
        }

        this.loop_adr = 0;

        let loop_offset = 0;

        if (this.track_amount > 1)	{
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

        let i = 100000;

        while (this.tick()) {
            if( i-- == 0 )
                break;
        }

        if (this.loop_flag) {
            this.midi.add_marker("loopEnd");
        }

        return this.midi.getMidiFile();
    }
}