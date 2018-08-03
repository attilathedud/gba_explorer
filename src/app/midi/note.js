export default class Note {
    constructor(midi, chn, len, key, vel, lfoDelay, lfoDelayCtr, lfoFlag, lfoType) {
        this.midi = midi;
        this.chn = chn;
        this.counter = len;
        this.key = key;
        this.vel = vel;
        this.lfoDelay = lfoDelay;
        this.lfoDelayCtr = lfoDelayCtr;
        this.lfoFlag = lfoFlag;
        this.lfoType = lfoType;

        this.eventMade = false;

        this.startLfo(chn);
    }

    tick()
    {
        if (this.counter > 0 && --this.counter == 0)
        {
            this.midi.addNoteOff(this.chn, this.key, this.vel);
            this.stopLfo(this.chn);
            return true;
        }
        else {
            return false;
        }
    }

    countdownIsOver() {
        return this.tick() || this.counter < 0;
    }

    MakeNoteOnEvent()
    {
        if (!this.eventMade)
        {
            this.midi.addNoteOn(this.chn, this.key, this.vel);
            this.eventMade = true;
        }
    }

    startLfo(track) {
        // Reset down delay counter to its initial value
        if (this.lfoDelay[track] != 0)
            this.lfoDelayCtr[track] = this.lfoDelay[track];
    }

    stopLfo(track) {
        // Cancel a LFO if it was playing,
        if (this.lfoFlag[track])
        {
            if (this.lfoType[track] == 0) {
                this.midi.addController(track, 1, 0);
            }
            else {
                this.midi.addChanAft(track, 0);
            }
            this.lfoFlag[track] = false;
        }
        else {
            this.lfoDelayCtr[track] = 0;			// cancel delay counter if it wasn't playing
        }
    }
}