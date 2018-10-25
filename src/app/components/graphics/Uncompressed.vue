<template>
  <div id="graphics-view">
    <div class="field has-addons">
      <p class="control">
        <a class="button is-static">
          Offset
        </a>
      </p>
      <p class="control is-expanded">
        <input 
          v-model="offsetText" 
          class="input" 
          type="text" 
          @keyup.enter="startSearch">
      </p>
      <p class="control">
        <a 
          class="button" 
          @click="startSearch">Search</a>
      </p>
    </div>
        
    <div class="graphics-flex-wrapper">
      <div 
        class="graphics-grid-wrapper" 
        :class="gridSize">
        <div 
          v-for="tile in tileMap" 
          :key="tile.id">
          <div 
            v-for="row in tile" 
            :key="row.id">
            <div class="graphics-flex-wrapper">
              <div 
                v-for="pixel in row" 
                :key="pixel.id"  
                :style="{backgroundColor: getPalleteColor(pixel), width: pixelSizes[pixelSize] + 'px', height: pixelSizes[pixelSize] + 'px'}" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="graphics-zoom">
      <span class="icon is-large">
        <i 
          class="fas fa-2x fa-minus-circle"
          @click="zoomOut" />
      </span>
      <span class="icon is-large"> 
        <i 
          class="fas fa-2x fa-plus-circle"
          @click="zoomIn" />
      </span> 
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
    name: "Uncompressed",
    data: function () {
        return {
            pallete: [],
            offsetText: "00000000",
            offset: 0,
            tileMap: {},
            entries: 96,
            linesPerRow: 12,
            pixelSize: 3,
            pixelSizes: [1, 2, 4, 8],
            gridSize: "grid-12"
        };
    },
    computed: {
        ...mapGetters([
            "rom"
        ])
    },
    created: function() {
        for( let i = 0; i < 16; i++ ) {
            this.pallete[i] = "rgb(" + i * 16 + "," + i * 16 + "," + i * 16 + ")";
        }

        this.generatePalleteMap();
    },
    mounted: function() {
        window.addEventListener("wheel", this.handleScroll);
        window.addEventListener("keydown", this.handleKeypress);
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
            let binaryStream = "";

            for( const b of section ) {
                binaryStream += Number(b).toString(2).padStart(8, "0");
            }

            let tileIndex = 0;
            let tileOffset = 0;
            
            this.tileMap[tileIndex] = [];
            this.tileMap[tileIndex][tileOffset] = [];

            for( let i = 0, j = 0; i < binaryStream.length; i += 8, j += 2 ) {
                this.tileMap[tileIndex][tileOffset].push(parseInt(binaryStream.substr(i + 4, 4), 2));
                this.tileMap[tileIndex][tileOffset].push(parseInt(binaryStream.substr(i, 4), 2));

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
        scrollDown: function() {
            if( this.offset + this.linesPerRow * 32 > this.rom.byteLength )
                return;

            this.offset += this.linesPerRow * 32;

            this.offsetText = this.toHexString(this.offset, 8);
            this.generatePalleteMap();
        },
        scrollUp: function() {
            if( this.offset === 0 )
                return;

            this.offset -= this.linesPerRow * 32;

            this.offsetText = this.toHexString(this.offset, 8);
            this.generatePalleteMap(); 
        },
        handleScroll: function(event) {
            if(event.deltaY > 0) {
                this.scrollDown();
            }
            else {
                this.scrollUp();
            }
        },
        handleKeypress: function(event) {
            const KEY_LEFT = 37;
            const KEY_UP = 38;
            const KEY_RIGHT = 39;
            const KEY_DOWN = 40;

            if( document.getElementById("search-input") == document.activeElement )
                return;

            switch( event.which ) {
            case KEY_DOWN:
            case KEY_RIGHT:
                this.scrollDown();
                break;
            case KEY_UP:
            case KEY_LEFT:
                this.scrollUp();
                break;
            } 
        },
        zoomIn: function() {
            /*
            this.gridSize = "grid-32";
            this.entries = 768;
            this.linesPerRow = 32;
            this.generatePalleteMap();
            */
            if( this.pixelSize < 3 )
                this.pixelSize++;
        },
        zoomOut: function() {
            if( this.pixelSize > 0 )
                this.pixelSize--;
        }
    },
    unmounted: function () {
        window.removeEventListener("wheel", this.handleScroll);
        window.removeEventListener("keydown", this.handleKeypress);
    }
};
</script>
