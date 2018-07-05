<template>
    <div id="graphics-view">
        <div class="field has-addons">
            <p class="control">
                <a class="button is-static">
                    Offset
                </a>
            </p>
            <p class="control is-expanded">
                <input class="input" type="text" v-model="offsetText" v-on:keyup.enter="startSearch">
            </p>
            <p class="control">
                <a class="button" v-on:click="startSearch">Search</a>
            </p>
        </div>
        
        <div class="graphics-flex-wrapper">
            <div class="graphics-grid-wrapper">
                <div v-for="tile in this.tileMap" v-bind:key="tile.id">
                    <div v-for="row in tile" v-bind:key="row.id">
                        <div class="graphics-flex-wrapper">
                            <div class="pixel" v-for="pixel in row" v-bind:key="pixel.id" :style="{backgroundColor: getPalleteColor(pixel)}">
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'Uncompressed',
    data: function () {
        return {
           pallete: [],
           offsetText: '00000000',
           offset: 0,
           tileMap: {},
           entries: 96,
           linesPerRow: 12
        }
    },
    computed: {
        ...mapGetters([
            'rom'
        ])
    },
    created: function() {
        for( let i = 0; i < 16; i++ ) {
            this.pallete[i] = "rgb(" + Math.floor(256 * Math.random()) + "," + Math.floor(256 * Math.random()) + "," + Math.floor(256 * Math.random()) + ")";
        }

        this.generatePalleteMap();
    },
    methods: {
        getPalleteColor: function(pixel) {
            return this.pallete[pixel];
        },
        startSearch: function() {
            this.offset = this.getHex(this.offsetText);
            this.generatePalleteMap();
        },
        generatePalleteMap: function() {
            this.tileMap = {};

            let section = this.rom.slice(this.offset, this.offset + (this.entries * 32));
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
        },
        handleScroll: function(event) {
            if(event.deltaY > 0) {
                //todo: don't allow scroll past end of byte buffer (this.rom.byteLength)
                this.offset+= this.linesPerRow * 32;
            }
            else {
                if( this.offset === 0 )
                    return;

                this.offset -= this.linesPerRow * 32;
            }

            this.offsetText = this.toHexString(this.offset, 8);
            this.generatePalleteMap();
        }
    },
    mounted: function() {
        document.getElementById('graphics-view').addEventListener('wheel', this.handleScroll);
    },
    unmounted: function () {
        document.getElementById('graphics-view').removeEventListener('wheel', this.handleScroll);
    }
};
</script>
