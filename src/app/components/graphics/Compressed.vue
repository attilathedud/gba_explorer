<template>
    <div>
        <div class="columns">
            <div class="column is-one-quarter offset-table">
                <table class="table is-striped is-narrow is-hoverable">
                    <thead></thead>
                    <tbody>
                        <tr v-for="section in compressedSections" v-bind:key="section.id" v-on:click="uncompress(section)" :class="{'is-selected':section == selected}">
                            <td>{{toHexString(section, 8)}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="column">
                <div class="centered-horizontal">
                    <a v-if="isLoading" class="button is-loading is-large is-text centered-vertical"></a>
                </div>
                <div class="graphics-flex-wrapper">
                    <div class="graphics-grid-wrapper" :class="gridSize">
                        <div v-for="tile in this.tileMap" v-bind:key="tile.id">
                            <div v-for="row in tile" v-bind:key="row.id">
                                <div class="graphics-flex-wrapper">
                                    <div :class="pixelSize" v-for="pixel in row" v-bind:key="pixel.id" :style="{backgroundColor: getPalleteColor(pixel)}">
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from "vuex";
import sww from 'simple-web-worker';

export default {
    name: "Compressed",
    data: function() {
        return {
            pallete: [],
            tileMap: {},
            pixelSize: "pixel-1",
            gridSize: "grid-32",
            compressedSections: [],
            worker: {},
            isLoading: false,
            selected: 0
        };
    },
    computed: {
        ...mapGetters(["rom"])
    },
    created: function() {
        for( let i = 0; i < 16; i++ ) {
            this.pallete[i] = "rgb(" + i * 16 + "," + i * 16 + "," + i * 16 + ")";
        }

        this.worker = sww.create([
            { 
                message: 'uncompress', 
                func: function (rom, offset) {
                    //This entire thing is Nintenlord's code modified to work in JS
                    let byteStream = [];

                    if (rom[offset++] != 0x10)
                        return false;

                    let length = rom[offset++];
                    length += rom[offset++] << 8;
                    length += rom[offset++] << 16;

                    let stream_pointer = 0;
                    while (stream_pointer < length)
                    {
                        let isCompressed = rom[offset++];

                        for (let i = 0; i < 8 && stream_pointer < length; i++)
                        {
                            if (isCompressed & 0x80)
                            {
                                let amountToCopy = 3 + (rom[offset] >> 4);
                                let copyPosition = 1;
                                copyPosition += (rom[offset++] & 0xF) << 8;
                                copyPosition += rom[offset++];

                                if (copyPosition > length)
                                    return false;

                                for (let u = 0; u < amountToCopy; u++)
                                {
                                    byteStream[stream_pointer] = byteStream[(stream_pointer - u) - copyPosition + (u % copyPosition)];
                                    stream_pointer++;
                                }
                            }
                            else
                            {
                                byteStream[stream_pointer] = rom[offset++];
                                stream_pointer++;
                            }

                            isCompressed <<= 1;
                        }
                    }

                    return byteStream;
                }
            },
            { 
                message: 'scan',
                func: function (rom) {
                    //This entire thing is Nintenlord's code modified to work in JS
                    function isValidCompression(offset, length) {
                        offset += 4;

                        let stream_pointer = 0;
                        while (stream_pointer < length)
                        {
                            let isCompressed = rom[offset++];

                            for (let i = 0; i < 8 && stream_pointer < length; i++)
                            {
                                if (isCompressed & 0x80)
                                {
                                    let amountToCopy = 3 + (rom[offset] >> 4);
                                    let copyPosition = 1;
                                    copyPosition += (rom[offset++] & 0xF) << 8;
                                    copyPosition += rom[offset++];

                                    if (copyPosition > stream_pointer)
                                        return false;

                                    stream_pointer += amountToCopy;
                                }
                                else
                                {
                                    offset++;
                                    stream_pointer++;
                                }

                                isCompressed <<= 1;
                            }
                        }

                        return true;
                    }

                    let results = [];

                    for( let i = 0; i < rom.byteLength; i += 4 ) {
                        if( rom[i] == 0x10 ) {
                            let length = rom[i+1];
                            length += rom[i+2] << 8;
                            length += rom[i+3] << 16;

                            if( length % 32 == 0 && length <= 0x8000 && length > 0 ) {
                                if( isValidCompression(i, length) ) {
                                    results.push(i);
                                }
                            }
                        }
                    }

                    return results;
                }
            }
        ]);

        this.scan();
    },
    methods: {
        getPalleteColor: function(pixel) {
            return this.pallete[pixel];
        },
        uncompress: function(offset) {
            this.tileMap = {};
            this.selected = offset;
            this.isLoading = true;
            this.worker.postMessage('uncompress', [this.rom, offset])
                .then(results => {
                    this.generatePalleteMap(results);
                    this.isLoading = false;
                });
        },
        scan: function() {
            this.isLoading = true;
            this.worker.postMessage('scan', [this.rom])
                .then(results => {
                    this.compressedSections = results;
                    this.isLoading = false;
                    this.uncompress(this.compressedSections[0]);
                });
        },
        isValidCompression: function(offset, length) {
            offset += 4;

            let stream_pointer = 0;
            while (stream_pointer < length)
            {
                let isCompressed = this.rom[offset++];

                for (let i = 0; i < 8 && stream_pointer < length; i++)
                {
                    if (isCompressed & 0x80)
                    {
                        let amountToCopy = 3 + (this.rom[offset] >> 4);
                        let copyPosition = 1;
                        copyPosition += (this.rom[offset++] & 0xF) << 8;
                        copyPosition += this.rom[offset++];

                        if (copyPosition > stream_pointer)
                            return false;

                        stream_pointer += amountToCopy;
                    }
                    else
                    {
                        offset++;
                        stream_pointer++;
                    }

                    isCompressed <<= 1;
                }
            }

            return true;
        },
        generatePalleteMap: function(section) {
            this.tileMap = {};

            let binary_stream = "";

            for( const b of section ) {
                binary_stream += Number(b).toString(2).padStart(8, '0');
            }

            let tileIndex = 0;
            let tileOffset = 0;
            
            this.tileMap[tileIndex] = [];
            this.tileMap[tileIndex][tileOffset] = [];

            for( let i = 0, j = 0; i < binary_stream.length; i += 8, j += 2 ) {
                this.tileMap[tileIndex][tileOffset].push(parseInt(binary_stream.substr(i + 4, 4), 2));
                this.tileMap[tileIndex][tileOffset].push(parseInt(binary_stream.substr(i, 4), 2));

                if((j+2) % 8 == 0) {
                    tileOffset++;
                    if( tileOffset != 8 ) {
                        this.tileMap[tileIndex][tileOffset] = [];
                    }
                }
                if( tileOffset == 8 ) {
                    tileIndex++;
                    tileOffset = 0;
                    this.tileMap[tileIndex] = [];
                    this.tileMap[tileIndex][tileOffset] = [];
                }
            }
        }
    }
};
</script>
