<template>
    <div>
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
        
        <div style="display: flex; flex-wrap: wrap;">
            <div v-for="pixel in bpp4_parts" v-bind:key="pixel.id" :style="{backgroundColor: getPalleteColor(pixel)}" style="height: 64px; width: 12.5%;" v-on:click="moo(pixel);">
                    
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'Graphics',
    data: function () {
        return {
           bpp4_parts: [],
           pallete: [],
           offsetText: '',
           offset: 0
        }
    },
    computed: {
        ...mapGetters([
            'rom'
        ])
    },
    created: function() {
        this.generatePalleteMap();

        for( let i = 0; i < 16; i++ ) {
            this.pallete[i] = "rgb(" + Math.floor(256 * Math.random()) + "," + Math.floor(256 * Math.random()) + "," + Math.floor(256 * Math.random()) + ")";
        }
    },
    methods: {
        getPalleteColor: function(pixel) {
            return this.pallete[pixel];
        },
        moo: function(pixel) {
            console.log(pixel);
        },
        startSearch: function() {
            this.offset = this.getHex(this.offsetText);
            this.generatePalleteMap();
        },
        generatePalleteMap: function() {
            this.bpp4_parts = [];
            let section = this.rom.slice(this.offset, this.offset + 200);
            let binary_stream = "";

            for( const b of section ) {
                binary_stream += Number(b).toString(2).padStart(8, '0');
            }

            for( let i = 0, j = 0; i < binary_stream.length; i += 8, j += 2 ) {
                this.bpp4_parts[j] = parseInt(binary_stream.substr(i + 4, 4), 2);
                this.bpp4_parts[j+1] = parseInt(binary_stream.substr(i, 4), 2);
            }
        }
    }
};
</script>
