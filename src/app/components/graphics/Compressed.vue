<template>
    <div>
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

export default {
    name: "Compressed",
    data: function() {
        return {
            pallete: [],
            byteStream: [],
            tileMap: {},
            pixelSize: "pixel-2",
            gridSize: "grid-32"
        };
    },
    computed: {
        ...mapGetters(["rom"])
    },
    created: function() {
        for( let i = 0; i < 16; i++ ) {
            this.pallete[i] = "rgb(" + i * 16 + "," + i * 16 + "," + i * 16 + ")";
        }

        this.uncompress();
        this.generatePalleteMap();
    },
    methods: {
        getPalleteColor: function(pixel) {
            return this.pallete[pixel];
        },
        uncompress: function() {
            //This entire thing is Nintenlord's code modified to work in JS
            let source = 0x577024;

            if (this.rom[source++] != 0x10)
                return false;

            let stream_pointer = 0;
            let length = this.rom[source++] + (this.rom[source++] << 8) + (this.rom[source++] << 16);

            while (stream_pointer < length)
            {
                let isCompressed = this.rom[source++];
                for (let i = 0; i < 8; i++)
                {
                    if ((isCompressed & 0x80) != 0)
                    {
                        let amountToCopy = 3 + (this.rom[source] >> 4);
                        let copyPosition = 1;
                        copyPosition += (this.rom[source++] & 0xF) << 8;
                        copyPosition += this.rom[source++];

                        if (copyPosition > length)
                            return false;

                        for (let u = 0; u < amountToCopy; u++)
                        {
                            this.byteStream[stream_pointer] = this.byteStream[(stream_pointer - u) - copyPosition + (u % copyPosition)];
                            stream_pointer++;
                        }
                    }
                    else
                    {
                        this.byteStream[stream_pointer++] = this.rom[source++];
                    }
                    if (!(stream_pointer < length))
                        break;

                    isCompressed <<= 1;
                }
            }
        },
        generatePalleteMap: function() {
            this.tileMap = {};

            let section = this.byteStream;
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
