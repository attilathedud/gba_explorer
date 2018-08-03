//This is Bregalad's code again
export default class Midi {
    constructor(deltaTime) {
        this.deltaTimePerBeat = deltaTime;

        this.lastRpnType = [];
        this.lastNrpnType = [];
        this.lastType = [];
        this.chnReorder = [];

        for (let i = 15; i >= 0; --i )
        {
            this.lastRpnType[i] = -1;
            this.lastNrpnType[i] = -1;
            this.lastType[i] = -1;
            this.chnReorder[i] = i;
        }
        this.lastChanel = -1;
        this.timeCtr = 0;

        this.data = [];
        this.lastEventType = 0;
    }

    clock() {
        this.timeCtr += 1;
    }

    getMidiFile() {
        let byteStream = Buffer.alloc(14 + 8 + this.data.length + 4);

        byteStream.write("MThd");
        byteStream.writeInt32LE(0x06000000, 4);
        byteStream.writeInt16LE(0x0000, 8);
        byteStream.writeInt16LE(0x0100, 10);
        byteStream.writeInt16LE((this.deltaTimePerBeat << 8) | (this.deltaTimePerBeat >> 8), 12);
		
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

    addVlengthCode(code) {
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

    addDeltaTime() {
        this.addVlengthCode(this.timeCtr);

        this.timeCtr = 0;
    }

    addEventTypeMulti(type, chn, param1, param2) {
        this.addDeltaTime();
        if (chn != this.lastChanel || type != this.lastEventType)
        {
            this.lastChanel = chn;
            this.lastEventType = type;
            this.data.push((type << 4) | this.chnReorder[chn]);
        }
        this.data.push(param1);
        this.data.push(param2);
    }

    addEventTypeSingle(type, chn, param) {
        this.addDeltaTime();
        if (chn != this.lastChanel || type != this.lastEventType)
        {
            this.lastChanel = chn;
            this.lastEventType = type;
            this.data.push((type << 4) | this.chnReorder[chn]);
        }
        this.data.push(param);
    }

    addNoteOn(chn, key, vel) {
        this.addEventTypeMulti(9, chn, key, vel);
    }

    addNoteOff(chn, key, vel) {
        this.addEventTypeMulti(8, chn, key, vel);
    }

    addController(chn, ctrl, value) {
        this.addEventTypeMulti(11, chn, ctrl, value);
    }

    addChanAft(chn, value) {
        this.addEventTypeSingle(13, chn, value);
    }

    addPchange(chn, number) {
        this.addEventTypeSingle(12, chn, number);
    }

    addPitchBend(chn, value) {
        this.addEventTypeMulti(14, chn, 0, value);
    }

    addRPN(chn, type, value) {
        if (this.lastRpnType[chn] != type || this.lastType[chn] != 0)
        {
            this.lastRpnType[chn] = type;
            this.lastType[chn] = 0;
            this.addEventTypeMulti(11, chn, 101, type>>7);
            this.addEventTypeMulti(11, chn, 100, type&0x7f);
        }
        this.addEventTypeMulti(11, chn, 6, value >> 7);

        if ((value & 0x7f) != 0)
            this.addEventTypeMulti(11, chn, 38, value & 0x7f);
    }

    addNRPN(chn, type, value) {
        if (this.lastNrpnType[chn] != type || this.lastType[chn] != 1)
        {
            this.lastNrpnType[chn] = type;
            this.lastType[chn] = 1;
            this.addEventTypeMulti(11, chn, 99, type>>7);
            this.addEventTypeMulti(11, chn, 98, type&0x7f);
        }
        this.addEventTypeMulti(11, chn, 6, value >> 7);
        if ((value & 0x7f) != 0)
            this.addEventTypeMulti(11, chn, 38, value & 0x7f);
    }

    addMarker(text) {
        this.addDeltaTime();
        this.data.push(-1);
        //Add text meta event if marker is false, marker meta even if true
        this.data.push(6);
        let len = text.length;
        this.addVlengthCode(len);
        //Add text itself
        for( let i = 0; i < len; i++ ) {
            this.data.push(text[i].charCodeAt());
        }
    }

    addSysex(sysexData, len) {
        this.addDeltaTime();
        this.data.push(0xf0);
        //Actually variable length code
        this.addVlengthCode(len + 1);

        for( let i = 0; i < len; i++ ) {
            this.data.push(sysexData[i]);
        }
        this.data.push(0xf7);
    }

    addTempo(tempo) {
        let t = Math.trunc(60000000.0 / tempo);
        
        let tBits = t.toString(2);
        let t1 = parseInt(tBits.substr(tBits.length - 8), 2);
        
        tBits = (t>>8).toString(2);
        let t2 = parseInt(tBits.substr(tBits.length - 8), 2);

        tBits = (t>>16).toString(2);
        let t3 = parseInt(tBits.substr(tBits.length - 8), 2);

        this.addDeltaTime();
        this.data.push(0xff);
        this.data.push(0x51);
        this.data.push(0x03);
        this.data.push(t3);
        this.data.push(t2);
        this.data.push(t1);
    }
}