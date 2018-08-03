import Midi from "../midi/midi.js";
import Note from "../midi/note.js";

export default class Track {
    constructor(rom) {
        this.rom = rom;
        this.midi = {};
        this.trackAmount = 0;
        this.trackPtr = [];
        this.loopAdr = 0;
        this.loopFlag = true;
        this.notesPlaying = [];
        this.counter = [];
        this.trackCompleted = [];
        this.lfoDepth = [];
        this.lfoDelay = [];
        this.lfoFlag = [];
        this.lfoType = [];
        this.lfoDelayCtr = [];
        this.lfoHack = [];
        this.returnFlag = [];
        this.lastCmd = [];
        this.returnPtr = [];
        this.lastKey = [];
        this.lastVel = [];
        this.keyShift = [];
    }

    stopLfo(track) {
        // Cancel a LFO if it was playing,
        if (this.lfoFlag[track]) {
            if (this.lfoType[track] == 0) {
                this.midi.addController(track, 1, 0);
            } else {
                this.midi.addChanAft(track, 0);
            }

            this.lfoFlag[track] = false;
        } else {
            this.lfoDelayCtr[track] = 0; // cancel delay counter if it wasn't playing
        }
    }

    processLfo(track) {
        if (this.lfoDelayCtr[track] != 0) {
            // Decrease counter if it's value was nonzero
            if (--this.lfoDelayCtr[track] == 0) {
                // If 1->0 transition we need to add a signal to start the LFO
                if (this.lfoType[track] == 0) {
                    // Send a controller 1 if pitch LFO
                    this.midi.addController(track, 1, (this.lfoDepth[track] < 16) ? this.lfoDepth[track] * 8 : 127);
                } else {
                    // Send a channel aftertouch otherwise
                    this.midi.addChanAft(track, (this.lfoDepth[track] < 16) ? this.lfoDepth[track] * 8 : 127);
                }

                this.lfoFlag[track] = true;
            }
        }
    }

    processEvent(track) {
        // Length table for notes and rests
        let lenTbl = [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
            16, 17, 18, 19, 20, 21, 22, 23, 24, 28, 30, 32, 36,
            40, 42, 44, 48, 52, 54, 56, 60, 64, 66, 68, 72, 76, 78,
            80, 84, 88, 90, 92, 96
        ];

        let command = this.rom.readUInt8(this.trackPtr[track]);

        this.trackPtr[track]++;

        let arg1 = 0;
        // Repeat last command, the byte read was in fact the first argument
        if (command < 0x80) {
            arg1 = command;
            command = this.lastCmd[track];
        }
        // Delta time command
        else if (command <= 0xb0) {
            this.counter[track] = lenTbl[command - 0x80];
            return;
        } else {
            switch (command) {
            // End track command
            case 0xb1:
                // Null pointer
                this.trackPtr[track] = 0;
                this.trackCompleted[track] = true;
                return;
                // Jump command
            case 0xb2:
                this.trackPtr[track] = this.rom.readInt32LE(this.trackPtr[track]) & 0x3FFFFFF;

                // detect the end track
                this.trackCompleted[track] = true;
                return;
                // Call command
            case 0xb3:
                // Return address for the track
                this.returnPtr[track] = this.trackPtr[track] + 4;
                // Now points to called address
                this.trackPtr[track] = this.rom.readInt32LE(this.trackPtr[track]) & 0x3FFFFFF;
                this.returnFlag[track] = true;
                return;
                // Return command
            case 0xb4:
                if (this.returnFlag[track]) {
                    this.trackPtr[track] = this.returnPtr[track];
                    this.returnFlag[track] = false;
                }
                return;
                // Tempo change
            case 0xbb:
                this.midi.addTempo(2 * this.rom.readUInt8(this.trackPtr[track]));
                this.trackPtr[track]++;
                return;
            default:
                // Normal command
                this.lastCmd[track] = command;
                // Need argument
                arg1 = this.rom.readUInt8(this.trackPtr[track]);
                this.trackPtr[track]++;
                break;
            }
        }

        // Note on with specified length command
        if (command >= 0xd0) {
            let key = 0;
            let vel = 0;
            let lenOfs = 0;
            // Is arg1 a key value ?
            if (arg1 < 0x80) {
                // Yes -> use new key value
                key = arg1;
                this.lastKey[track] = key;

                let arg2 = this.rom.readUInt8(this.trackPtr[track]);
                // Is arg2 a velocity ?
                if (arg2 < 0x80) {
                    // Yes -> use new velocity value
                    vel = arg2;
                    this.lastVel[track] = vel;
                    this.trackPtr[track]++;

                    let arg3 = this.rom.readUInt8(this.trackPtr[track]);

                    // Is there a length offset ?
                    if (arg3 < 0x80) {
                        // Yes -> read it and increment pointer
                        lenOfs = arg3;
                        this.trackPtr[track]++;
                    }
                } else {
                    // No -> use previous velocity value
                    vel = this.lastVel[track];
                }
            } else {
                // No -> use last value
                key = this.lastKey[track];
                vel = this.lastVel[track];
                this.trackPtr[track]--; // Seek back, as arg 1 is unused and belong to next event !
            }

            // Linearise velocity if needed
            vel = Math.trunc(Math.sqrt(127.0 * vel));

            this.notesPlaying.unshift(new Note(this.midi, track, lenTbl[command - 0xd0 + 1] + lenOfs, key + this.keyShift[track], vel, this.lfoDelay, this.lfoDelayCtr, this.lfoFlag, this.lfoType));
            return;
        }

        // Other commands
        switch (command) {
        // Key shift
        case 0xbc:
            this.keyShift[track] = arg1;
            return;
            // Set instrument
        case 0xbd:
            this.midi.addPchange(track, arg1);
            return;
            // Set volume
        case 0xbe:
            // Linearise volume if needed
            this.midi.addController(track, 7, Math.trunc(Math.sqrt(127.0 * arg1)));
            return;
            // Set panning
        case 0xbf:
            this.midi.addController(track, 10, arg1);
            return;
            // Pitch bend
        case 0xc0:
            this.midi.addPitchBend(track, arg1);
            return;
            // Pitch bend range
        case 0xc1:
        {
            let arg1Bits = arg1.toString(2);
            this.midi.addRPN(track, 0, parseInt(arg1Bits.substr(arg1Bits.length - 8), 2));
            return;
        }
        // LFO Speed
        case 0xc2:
            this.midi.addNRPN(track, 136, arg1);
            return;
            // LFO delay
        case 0xc3:
            this.lfoDelay[track] = arg1;
            return;
            // LFO depth
        case 0xc4:
            if (this.lfoDelay[track] == 0 && this.lfoHack[track]) {
                if (this.lfoType[track] == 0) {
                    this.midi.addController(track, 1, arg1 > 12 ? 127 : 10 * arg1);
                } else {
                    this.midi.addChanAft(track, arg1 > 12 ? 127 : 10 * arg1);
                }

                this.lfoFlag[track] = true;
            }
            this.lfoDepth[track] = arg1;
            // I had a stupid bug with LFO inserting controllers I didn't want at the start of files
            // So I made a terrible quick fix for it, in the mean time I can find something better to prevent it.
            this.lfoHack[track] = true;
            return;
            // LFO type
        case 0xc5:
            this.lfoType[track] = arg1;
            return;
            // Detune
        case 0xc8:
        {
            let arg1Bits = arg1.toString(2);
            this.midi.addRPN(track, 1, parseInt(arg1Bits.substr(arg1Bits.length - 8), 2));
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
                this.lastKey[track] = key;
            } else {
                // No -> use last value
                key = this.lastKey[track];
                vel = this.lastVel[track];
                this.trackPtr[track]--; // Seek back, as arg 1 is unused and belong to next event !
            }

            this.midi.addNoteOff(track, key + this.keyShift[track], vel);
            this.stopLfo(track);
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
                this.lastKey[track] = key;

                let arg2 = this.rom.readUInt8(this.trackPtr[track]);
                // Is arg2 a velocity ?
                if (arg2 < 0x80) {
                    // Yes -> use new velocity value
                    vel = arg2;
                    this.lastVel[track] = vel;
                    this.trackPtr[track]++;
                } else {
                    // No -> use previous velocity value
                    vel = this.lastVel[track];
                }
            } else {
                // No -> use last value
                key = this.lastKey[track];
                vel = this.lastVel[track];
                this.trackPtr[track]--; // Seek back, as arg 1 is unused and belong to next event !
            }

            vel = Math.trunc(Math.sqrt(127.0 * vel));

            // Make note of infinite length
            this.notesPlaying.unshift(new Note(this.midi, track, -1, key + this.keyShift[track], vel, this.lfoDelay, this.lfoDelayCtr, this.lfoFlag, this.lfoType));
            return;
        }

        default:
            break;
        }
    }

    tick() {
        this.notesPlaying = this.notesPlaying.filter(el => !el.countdownIsOver());

        // Process all tracks
        for (let track = 0; track < this.trackAmount; track++) {
            this.counter[track]--;
            // Process events until counter non-null or pointer null
            // This might not be executed if counter both are non null.
            while (this.trackPtr[track] != 0 && this.counter[track] <= 0) {
                // Check if we're at loop start point
                if (track == 0 && this.loopFlag && !this.returnFlag[0] && !this.trackCompleted[0] && this.trackPtr[0] == this.loopAdr)
                    this.midi.addMarker("loopStart");

                this.processEvent(track);
            }
        }

        for (let track = 0; track < this.trackAmount; track++) {
            this.processLfo(track);
        }

        // Compute if all still active channels are completely decoded
        let allCompletedFlag = true;
        for (let i = 0; i < this.trackAmount; i++) {
            allCompletedFlag &= this.trackCompleted[i];
        }

        // If everything is completed, the main program should quit its loop
        if (allCompletedFlag) {
            return false;
        }

        // Make note on events for this tick
        //(it's important they are made after all other events)
        this.notesPlaying.forEach(function (note) {
            note.MakeNoteOnEvent();
        });

        // Increment MIDI time
        this.midi.clock();

        return true;
    }

    dumpTrack(offset) {
        this.lfoDepth.length = 16;
        this.lfoDepth.fill(0);
        this.lfoDelay.length = 16;
        this.lfoDelay.fill(0);
        this.lfoType.length = 16;
        this.lfoType.fill(0);
        this.lfoDelayCtr.length = 16;
        this.lfoDelayCtr.fill(0);
        this.counter.length = 16;
        this.counter.fill(0);
        this.lastCmd.length = 16;
        this.lastCmd.fill(0);
        this.returnPtr.length = 16;
        this.returnPtr.fill(0);
        this.lastKey.length = 16;
        this.lastKey.fill(0);
        this.lastVel.length = 16;
        this.lastVel.fill(0);
        this.keyShift.length = 16;
        this.keyShift.fill(0);

        this.lfoFlag.length = 16;
        this.lfoFlag.fill(false);
        this.trackCompleted.length = 16;
        this.trackCompleted.fill(false);
        this.returnFlag.length = 16;
        this.returnFlag.fill(false);
        this.lfoHack.length = 16;
        this.lfoHack.fill(false);

        this.midi = new Midi(24);

        //gs stuff
        let gsResetSysex = [0x41, 0x10, 0x42, 0x12, 0x40, 0x00, 0x7f, 0x00, 0x41];
        this.midi.addSysex(gsResetSysex, gsResetSysex.length);
        // Part 10 to normal
        let part10NormalSysex = [0x41, 0x10, 0x42, 0x12, 0x40, 0x10, 0x15, 0x00, 0x1b];
        this.midi.addSysex(part10NormalSysex, part10NormalSysex.length);

        this.trackAmount = this.rom[offset];
        let reverb = this.rom.readInt8(offset + 3);

        this.trackPtr = [];

        for (let i = 0; i < this.trackAmount; i++) {
            this.trackPtr[i] = this.rom.readInt32LE(offset + (4 * i) + 8) & 0x3FFFFFF;

            if (reverb < 0) {
                this.midi.addController(i, 91, Math.trunc(Math.sqrt((reverb & 0x7f) * 127.0)));
            }
        }

        this.loopAdr = 0;

        let loopOffset = 0;

        if (this.trackAmount > 1) {
            loopOffset = this.trackPtr[1] - 9;
        } else {
            loopOffset = offset - 9;
        }

        for (let i = 0; i < 5; i++) {
            if (this.rom[loopOffset + i] == 0xb2) {
                this.loopFlag = true;
                this.loopAdr = this.rom.readInt32LE(loopOffset + i + 1) & 0x3FFFFFF;
                break;
            }
        }

        let i = 100000;

        while (this.tick()) {
            if (i-- == 0)
                break;
        }

        if (this.loopFlag) {
            this.midi.addMarker("loopEnd");
        }

        return this.midi.getMidiFile();
    }
}