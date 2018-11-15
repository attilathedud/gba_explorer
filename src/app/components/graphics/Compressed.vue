<template>
  <div>
    <div class="columns">
      <div class="column is-one-fifth offset-table">
        <table class="table is-narrow is-hoverable is-fullwidth">
          <thead>
            <tr>
              <td>Offsets</td>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="section in compressedSections" 
              :key="section.id" 
              :class="{'is-selected':section == selected}" 
              @click="uncompress(section)">
              <td>{{ toHexString(section, 8) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="column">
        <div class="centered-horizontal">
          <a 
            v-if="isLoading" 
            class="button is-loading is-large is-text centered-vertical" />
        </div>

        <div 
          class="canvas-holder"
          :style="{'height': canvasHolderHeight + 'px', 'width': canvasHolderWidth + 'px', 'visibility': (isLoading ? 'hidden' : 'visible')}">
          <canvas id="canvas" />
        </div>

        <div class="graphics-shift">
          <span class="icon is-large">
            <i 
              class="fas fa-2x fa-angle-double-left"
              @click="shiftTilesLeft" />
          </span>
          <span class="icon is-large"> 
            <i 
              class="fas fa-2x fa-angle-double-right"
              @click="shiftTilesRight" />
          </span>    
        </div>
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
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { mapMutations } from "vuex";

import sww from "simple-web-worker";

export default {
    name: "Compressed",
    data: function() {
        return {
            pallete: [],
            tileMap: {},
            compressedSections: [],
            worker: {},
            isLoading: false,
            selected: 0,
            tilesPerRow: 32,
            pixelSize: 0,
            pixelSizes: [1, 2, 4, 8],
            tileSize: 8,
            canvas: undefined,
            ctx: undefined,
            canvasHolderHeight: 0,
            canvasHolderWidth: 0
        };
    },
    computed: {
        ...mapGetters(["rom", "lastSelectedCompressedOffset"])
    },
    created: function() {
        for( let i = 0; i < 16; i++ ) {
            this.pallete[i] = "rgb(" + i * 16 + "," + i * 16 + "," + i * 16 + ")";
        }

        this.selected = this.lastSelectedCompressedOffset;

        this.worker = sww.create([
            { 
                message: "uncompress", 
                func: function (rom, offset) {
                    //This entire thing is Nintenlord's code modified to work in JS
                    let byteStream = [];

                    if (rom[offset++] != 0x10)
                        return false;

                    let length = rom[offset++];
                    length += rom[offset++] << 8;
                    length += rom[offset++] << 16;

                    let streamPointer = 0;
                    while (streamPointer < length) {
                        let isCompressed = rom[offset++];

                        for (let i = 0; i < 8 && streamPointer < length; i++) {
                            if (isCompressed & 0x80) {
                                let amountToCopy = 3 + (rom[offset] >> 4);
                                let copyPosition = 1;
                                copyPosition += (rom[offset++] & 0xF) << 8;
                                copyPosition += rom[offset++];

                                if (copyPosition > length)
                                    return false;

                                for (let u = 0; u < amountToCopy; u++) {
                                    byteStream[streamPointer] = byteStream[(streamPointer - u) - copyPosition + (u % copyPosition)];
                                    streamPointer++;
                                }
                            }
                            else {
                                byteStream[streamPointer] = rom[offset++];
                                streamPointer++;
                            }

                            isCompressed <<= 1;
                        }
                    }

                    return byteStream;
                }
            },
            { 
                message: "scan",
                func: function (rom) {
                    //This entire thing is Nintenlord's code modified to work in JS
                    function isValidCompression(offset, length) {
                        offset += 4;

                        let streamPointer = 0;
                        while (streamPointer < length) {
                            let isCompressed = rom[offset++];

                            for (let i = 0; i < 8 && streamPointer < length; i++) {
                                if (isCompressed & 0x80) {
                                    let amountToCopy = 3 + (rom[offset] >> 4);
                                    let copyPosition = 1;
                                    copyPosition += (rom[offset++] & 0xF) << 8;
                                    copyPosition += rom[offset++];

                                    if (copyPosition > streamPointer)
                                        return false;

                                    streamPointer += amountToCopy;
                                }
                                else {
                                    offset++;
                                    streamPointer++;
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
    mounted: function() { 
        if( this.canvas == undefined || this.ctz == undefined ) {
            this.canvas = document.getElementById("canvas");
            this.ctx = this.canvas.getContext("2d"); 
        }

        window.addEventListener("keydown", this.handleKeypress);
    }, 
    destroyed: function () {
        window.removeEventListener("keydown", this.handleKeypress);
    },  
    methods: {
        ...mapMutations(["setSelectedCompressedOffset"]),
        getPalleteColor: function(pixel) {
            return this.pallete[pixel];
        },
        uncompress: function(offset) {
            this.selected = offset;
            this.setSelectedCompressedOffset(this.selected);
            this.isLoading = true;
            this.worker.postMessage("uncompress", [this.rom, offset])
                .then(results => {
                    this.generatePalleteMap(results);
                    this.isLoading = false;
                });
        },
        scan: function() {
            this.isLoading = true;
            this.worker.postMessage("scan", [this.rom])
                .then(results => {
                    this.compressedSections = results;
                    this.isLoading = false;
                    if(this.selected == 0)
                        this.uncompress(this.compressedSections[0]);
                    else
                        this.uncompress(this.selected);
                });
        },
        isValidCompression: function(offset, length) {
            offset += 4;

            let streamPointer = 0;
            while (streamPointer < length) {
                let isCompressed = this.rom[offset++];

                for (let i = 0; i < 8 && streamPointer < length; i++) {
                    if (isCompressed & 0x80)  {
                        let amountToCopy = 3 + (this.rom[offset] >> 4);
                        let copyPosition = 1;
                        copyPosition += (this.rom[offset++] & 0xF) << 8;
                        copyPosition += this.rom[offset++];

                        if (copyPosition > streamPointer)
                            return false;

                        streamPointer += amountToCopy;
                    }
                    else {
                        offset++;
                        streamPointer++;
                    }

                    isCompressed <<= 1;
                }
            }

            return true;
        },
        zoomIn: function() {
            if( this.pixelSize < this.pixelSizes.length - 1 ) {
                this.pixelSize++;

                this.uncompress(this.selected);
            }       
        },        
        zoomOut: function() {
            if( this.pixelSize > 0 ) {
                this.pixelSize--;

                this.uncompress(this.selected);
            } 
        },
        shiftTilesLeft: function() {
            this.tilesPerRow--;
            this.uncompress(this.selected);
        },
        shiftTilesRight: function() {
            this.tilesPerRow++;
            this.uncompress(this.selected);
        },
        handleKeypress: function(event) {
            const KEY_LEFT = 37;
            const KEY_UP = 38;
            const KEY_RIGHT = 39;
            const KEY_DOWN = 40;

            switch( event.which ) {
            case KEY_DOWN:
            case KEY_RIGHT:
                this.tilesPerRow = 32;

                this.selected = this.compressedSections[this.compressedSections.indexOf(this.selected) + 1];
                this.uncompress(this.selected); 
                break;
            case KEY_UP:
            case KEY_LEFT:
                this.tilesPerRow = 32;

                this.selected = this.compressedSections[this.compressedSections.indexOf(this.selected) - 1];
                this.uncompress(this.selected); 
                break;
            }  
        },
        generatePalleteMap: function(section) {
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
            this.canvas.width = pixelSize * this.tileSize * this.tilesPerRow;
            this.canvas.height = pixelSize * this.tileSize * this.tilesPerRow; 

            this.canvasHolderWidth = window.innerWidth - (window.innerWidth / 2);
            this.canvasHolderHeight = window.innerHeight - (window.innerHeight / 4);

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
        }
    } 
};
</script>
