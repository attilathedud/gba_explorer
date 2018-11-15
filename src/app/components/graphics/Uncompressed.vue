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
          id="search-input"
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
    
    <canvas 
      id="canvas"
      class="canvas-stretch" />

    <div class="graphics-zoom">
      <span class="icon is-large">
        <i 
          :class="{'zoom-disabled': pixelSize == 0}"
          class="fas fa-2x fa-minus-circle"
          @click="zoomOut" />
      </span>
      <span class="icon is-large"> 
        <i 
          :class="{'zoom-disabled': pixelSize == pixelSizes.length - 1}"
          class="fas fa-2x fa-plus-circle"
          @click="zoomIn" />
      </span> 
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { mapMutations } from "vuex";

export default {
    name: "Uncompressed",
    data: function () {
        return {
            pallete: [],
            offsetText: "00000000",
            offset: 0,
            tileMap: {},
            tilesPerRow: 32,
            pixelSize: 0,
            pixelSizes: [1, 2, 4, 8],
            sectionLength: 128,
            tileSize: 8,
            canvas: undefined,
            ctx: undefined
        };
    },
    computed: {
        ...mapGetters([
            "rom",
            "lastUncompressedSearchOffset"
        ])
    },
    created: function() {
        for( let i = 0; i < 16; i++ ) {
            this.pallete[i] = "rgb(" + i * 16 + "," + i * 16 + "," + i * 16 + ")";
        }
    },
    mounted: function() {
        window.addEventListener("wheel", this.handleScroll);
        window.addEventListener("keydown", this.handleKeypress);

        if( this.canvas == undefined || this.ctz == undefined ) {
            this.canvas = document.getElementById("canvas");
            this.ctx = this.canvas.getContext("2d"); 
        }
        
        this.tilesPerRow = Math.floor(this.canvas.width / (this.pixelSizes[this.pixelSize] * this.tileSize)); 
          
        this.offsetText = this.lastUncompressedSearchOffset;
        this.startSearch();
    },
    methods: {
        ...mapMutations(["setUncompressedSearchOffset"]),
        getPalleteColor: function(pixel) {
            return this.pallete[pixel];
        },
        startSearch: function() {
            this.offset = this.getHex(this.offsetText);
            this.generatePalleteMap();
        },
        generatePalleteMap: function() {
            let section = this.rom.slice(this.offset, this.offset + (this.tilesPerRow * this.tileSize * this.sectionLength));
            
            this.tileMap = {};
            
            let blockIndex = 0;
            let rowIndex = 0;
            
            this.tileMap[blockIndex] = [];
            this.tileMap[blockIndex][rowIndex] = [];

            for( let i = 0; i < section.length; i++ ) {
                this.tileMap[blockIndex][rowIndex].push(section[i] & 0b00001111);
                this.tileMap[blockIndex][rowIndex].push((section[i] & 0b11110000) >> 4);

                if(((i*2)+2) % this.tileSize == 0) {
                    rowIndex++;
                    if( rowIndex != this.tileSize ) {
                        this.tileMap[blockIndex][rowIndex] = [];
                    }
                }
                if( rowIndex == this.tileSize ) {
                    blockIndex++;
                    rowIndex = 0;
                    this.tileMap[blockIndex] = [];
                    this.tileMap[blockIndex][rowIndex] = [];
                }
            }

            let pixelIndex = 0;
            let tileIndex = 0;
            rowIndex = 0;
            let tileRowIndex = 0;

            let pixelSize = this.pixelSizes[this.pixelSize];

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            for( const tile in this.tileMap ) {
                for( const row in this.tileMap[tile] ) {
                    for( const pixel in this.tileMap[tile][row] ) {
                        let pixelData = this.tileMap[tile][row][pixel];

                        this.ctx.fillStyle = this.getPalleteColor(pixelData); 
                        this.ctx.fillRect(
                            pixelIndex * pixelSize + (tileIndex * pixelSize * this.tileSize), 
                            rowIndex * pixelSize + (tileRowIndex * pixelSize * this.tileSize), 
                            pixelSize, pixelSize);
                        pixelIndex++;
                    }
                    pixelIndex = 0;
                    rowIndex++;
                }
                rowIndex = 0;
                tileIndex++;
                if( tileIndex >= this.tilesPerRow ) {
                    tileRowIndex++;
                    tileIndex = 0;
                }
            }

            this.setUncompressedSearchOffset(this.offsetText);
        },
        scrollDown: function() {
            if( this.offset + this.tilesPerRow * this.sectionLength > this.rom.byteLength )
                return;

            this.offset += this.tilesPerRow * this.sectionLength;

            this.offsetText = this.toHexString(this.offset, 8);
            this.generatePalleteMap(); 
        },
        scrollUp: function() {
            if( this.offset === 0 )
                return;

            this.offset -= this.tilesPerRow * this.sectionLength;

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

            if( document.getElementById("search-input") == document.activeElement && (event.which == KEY_RIGHT || event.which == KEY_LEFT))
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
            if( this.pixelSize < this.pixelSizes.length - 1 ) {
                this.pixelSize++;

                this.tilesPerRow = Math.floor(this.canvas.width / (this.pixelSizes[this.pixelSize] * this.tileSize)); 
 
                this.generatePalleteMap();
            }
        },
        zoomOut: function() {
            if( this.pixelSize > 0 ) {
                this.pixelSize--;
               
                this.tilesPerRow = Math.floor(this.canvas.width / (this.pixelSizes[this.pixelSize] * this.tileSize));  
                
                this.generatePalleteMap();
            }
        }
    },
    unmounted: function () {
        window.removeEventListener("wheel", this.handleScroll);
        window.removeEventListener("keydown", this.handleKeypress);
    }
};
</script>
