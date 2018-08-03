//This is Bregalad's code again
export default class Midi {
    constructor(delta_time) {
        this.delta_time_per_beat = delta_time;

        this.last_rpn_type = [];
        this.last_nrpn_type = [];
        this.last_type = [];
        this.chn_reorder = [];

        for (let i = 15; i >= 0; --i )
        {
            this.last_rpn_type[i] = -1;
            this.last_nrpn_type[i] = -1;
            this.last_type[i] = -1;
            this.chn_reorder[i] = i;
        }
        this.last_chanel = -1;
        this.time_ctr = 0;

        this.data = [];
        this.last_event_type = 0;
    }

    clock() {
        this.time_ctr += 1;
    }

    getMidiFile() {
        let byteStream = Buffer.alloc(14 + 8 + this.data.length + 4);

        byteStream.write("MThd");
        byteStream.writeInt32LE(0x06000000, 4);
        byteStream.writeInt16LE(0x0000, 8);
        byteStream.writeInt16LE(0x0100, 10);
        byteStream.writeInt16LE((this.delta_time_per_beat << 8) | (this.delta_time_per_beat >> 8), 12);
		
        byteStream.write("MTrk", 14);
        let s = this.data.length + 4;
        byteStream.writeInt32LE((s << 24) | ((s & 0x0000ff00) << 8) | ((s & 0x00ff0000) >> 8) | (s >> 24), 18);

        Buffer.from(this.data).copy(byteStream, 22);

        byteStream.writeUInt8(0, this.data.length + 22);
        byteStream.writeUInt8(0xff, this.data.length + 22 + 1);
        byteStream.writeUInt8(0x2f, this.data.length + 22 + 2);
        byteStream.writeUInt8(0, this.data.length + 22 + 3);
        
        return byteStream;
    }

    add_vlength_code(code) {
        let word1 = code & 0x7f;
        let word2 = (code >> 7) & 0x7f;
        let word3 = (code >> 14) & 0x7f;
        let word4 = (code >> 21) & 0x7f;
    
        if (word4 != 0)
        {
            this.data.push(word4 | 0x80);
            this.data.push(word3 | 0x80);
            this.data.push(word2 | 0x80);
        }
        else if (word3 != 0)
        {
            this.data.push(word3 | 0x80);
            this.data.push(word2 | 0x80);
        }
        else if (word2 != 0)
        {
            this.data.push(word2 | 0x80);
        }
        this.data.push(word1);
    }

    add_delta_time() {
        this.add_vlength_code(this.time_ctr);

        this.time_ctr = 0;
    }

    add_event_type_2(type, chn, param1, param2) {
        this.add_delta_time();
        if (chn != this.last_chanel || type != this.last_event_type)
        {
            this.last_chanel = chn;
            this.last_event_type = type;
            this.data.push((type << 4) | this.chn_reorder[chn]);
        }
        this.data.push(param1);
        this.data.push(param2);
    }

    add_event(type, chn, param) {
        this.add_delta_time();
        if (chn != this.last_chanel || type != this.last_event_type)
        {
            this.last_chanel = chn;
            this.last_event_type = type;
            this.data.push((type << 4) | this.chn_reorder[chn]);
        }
        this.data.push(param);
    }

    add_note_on(chn, key, vel) {
        this.add_event_type_2(9, chn, key, vel);
    }

    add_note_off(chn, key, vel) {
        this.add_event_type_2(8, chn, key, vel);
    }

    add_controller(chn, ctrl, value) {
        this.add_event_type_2(11, chn, ctrl, value);
    }

    add_chanaft(chn, value) {
        this.add_event(13, chn, value);
    }

    add_pchange(chn, number) {
        this.add_event(12, chn, number);
    }

    add_pitch_bend(chn, value) {
        this.add_event_type_2(14, chn, 0, value);
    }

    add_RPN(chn, type, value) {
        if (this.last_rpn_type[chn] != type || this.last_type[chn] != 0)
        {
            this.last_rpn_type[chn] = type;
            this.last_type[chn] = 0;
            this.add_event_type_2(11, chn, 101, type>>7);
            this.add_event_type_2(11, chn, 100, type&0x7f);
        }
        this.add_event_type_2(11, chn, 6, value >> 7);

        if ((value & 0x7f) != 0)
            this.add_event_type_2(11, chn, 38, value & 0x7f);
    }

    add_NRPN(chn, type, value) {
        if (this.last_nrpn_type[chn] != type || this.last_type[chn] != 1)
        {
            this.last_nrpn_type[chn] = type;
            this.last_type[chn] = 1;
            this.add_event_type_2(11, chn, 99, type>>7);
            this.add_event_type_2(11, chn, 98, type&0x7f);
        }
        this.add_event_type_2(11, chn, 6, value >> 7);
        if ((value & 0x7f) != 0)
            this.add_event_type_2(11, chn, 38, value & 0x7f);
    }

    add_marker(text) {
        this.add_delta_time();
        this.data.push(-1);
        //Add text meta event if marker is false, marker meta even if true
        this.data.push(6);
        let len = text.length;
        this.add_vlength_code(len);
        //Add text itself
        for( let i = 0; i < len; i++ ) {
            this.data.push(text[i].charCodeAt());
        }
    }

    add_sysex(sysex_data, len) {
        this.add_delta_time();
        this.data.push(0xf0);
        //Actually variable length code
        this.add_vlength_code(len + 1);

        for( let i = 0; i < len; i++ ) {
            this.data.push(sysex_data[i]);
        }
        this.data.push(0xf7);
    }

    add_tempo(tempo) {
        let t = Math.trunc(60000000.0 / tempo);
        
        let t_bits = t.toString(2);
        let t1 = parseInt(t_bits.substr(t_bits.length - 8), 2);
        
        t_bits = (t>>8).toString(2);
        let t2 = parseInt(t_bits.substr(t_bits.length - 8), 2);

        t_bits = (t>>16).toString(2);
        let t3 = parseInt(t_bits.substr(t_bits.length - 8), 2);

        this.add_delta_time();
        this.data.push(0xff);
        this.data.push(0x51);
        this.data.push(0x03);
        this.data.push(t3);
        this.data.push(t2);
        this.data.push(t1);
    }
}