export default class Note {
    constructor(midi, chn, len, key, vel, lfo_delay, lfo_delay_ctr, lfo_flag, lfo_type) {
        this.midi = midi;
        this.chn = chn;
        this.counter = len;
        this.key = key;
        this.vel = vel;
        this.lfo_delay = lfo_delay;
        this.lfo_delay_ctr = lfo_delay_ctr;
        this.lfo_flag = lfo_flag;
        this.lfo_type = lfo_type;

        this.event_made = false;

        this.start_lfo(chn);
    }

    tick()
    {
        if (this.counter > 0 && --this.counter == 0)
        {
            this.midi.add_note_off(this.chn, this.key, this.vel);
            this.stop_lfo(this.chn);
            return true;
        }
        else {
            return false;
        }
    }

    countdown_is_over() {
        return this.tick() || this.counter < 0;
    }

    make_note_on_event()
    {
        if (!this.event_made)
        {
            this.midi.add_note_on(this.chn, this.key, this.vel);
            this.event_made = true;
        }
    }

    start_lfo(track) {
        // Reset down delay counter to its initial value
        if (this.lfo_delay[track] != 0)
            this.lfo_delay_ctr[track] = this.lfo_delay[track];
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
}