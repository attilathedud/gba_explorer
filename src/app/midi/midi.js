export default class Midi {
    constructor(delta) {
        this.delta = delta;
    }

    getMidiFile() {
        let byteStream = Buffer.alloc(18);

        byteStream.write('MThd');
        byteStream.writeInt32LE(0x06000000, 4);
        byteStream.writeInt16LE(0x0000, 8);
        byteStream.writeInt16LE(0x0100, 10);
        byteStream.writeInt16LE((this.delta << 8) | (this.delta >> 8), 12);
		
        byteStream.write('MTrk', 14);

        return byteStream;
    }
}