<template>
    <div>
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
            pixelSize: "pixel-2",
            gridSize: "grid-32",
            compressedSections: [],
            worker: {},
            isLoading: false
        };
    },
    computed: {
        ...mapGetters(["rom"])
    },
    created: function() {
        for( let i = 0; i < 16; i++ ) {
            this.pallete[i] = "rgb(" + i * 16 + "," + i * 16 + "," + i * 16 + ")";
        }

        this.worker = sww.create([{ message: 'uncompress', 
            func: function (rom) {
                //This entire thing is Nintenlord's code modified to work in JS
                let offset = 0x577024;

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
        }]);

        this.uncompress();
    },
    methods: {
        getPalleteColor: function(pixel) {
            return this.pallete[pixel];
        },
        uncompress: function() {
            this.isLoading = true;
            this.worker.postMessage('uncompress', [this.rom])
                .then(results => {
                    this.generatePalleteMap(results);
                    this.isLoading = false;
                });
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
