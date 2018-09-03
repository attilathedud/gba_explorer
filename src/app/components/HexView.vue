<template>
  <div class="hex-view-holder">
    <div 
      v-if="!showNoResults" 
      class="notification is-danger">
      <button 
        class="delete" 
        @click="showNoResults=true" />
      No matches found.
    </div>
    <div class="field has-addons">
      <p class="control">
        <span class="select">
          <select v-model="searchType">
            <option>Offset</option>
            <option>Bytes</option>
            <option>Text</option>
          </select>
        </span>
      </p>
      <p class="control is-expanded">
        <input 
          v-model="searchText" 
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
    <table class="table is-striped is-narrow is-hoverable">
      <tbody>
        <tr 
          v-for="(address, index) in addresses" 
          :key="address.id">
          <td class="has-text-grey-light is-divider">{{ address }}</td>
          <td 
            v-for="(item, item_index) in romData.slice((index) * 16, ((index) * 16) + 16)" 
            :key="item.id" 
            :class="{'has-background-success':getHex(address)+item_index == selected}" 
            @click="byteClicked(item_index, address)">
            {{ item }}
          </td>
          <td class="is-divider" />
          <td>
            <span 
              v-for="(letter, letter_index) in ascii.slice((index) * 16, ((index) * 16) + 16)" 
              :key="letter.id" 
              :class="{'has-background-success':getHex(address)+letter_index == selected}"
              @click="byteClicked(letter_index, address)">
              {{ letter }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { mapMutations } from "vuex";

export default {
    name: "HexView",
    props: {
        useDictionary: {
            type: Boolean,
            default: false
        }
    },
    data: function() {
        return {
            romData : [],
            addresses : [],
            ascii: [],
            initialEntries: 400,
            selected: -1,
            searchText: "",
            lastSearchText: "",
            searchType: "Offset",
            lastByte: -1,
            showNoResults: true
        };
    },
    computed: {
        ...mapGetters([
            "rom",
            "lastHexPosition",
            "textAsByte",
            "byteAsText"
        ])
    },
    created: function() {
        if( this.useDictionary ) {
            this.searchType = "Text";
        }
        
        this.populateAtOffset(this.lastHexPosition);
    },
    mounted: function() {
        window.addEventListener("wheel", this.handleScroll);
        window.addEventListener("keydown", this.handleKeypress);
    },
    methods: {
        ...mapMutations(["setHexPosition"]),
        translateAscii: function( type, byte ) {
            if( type == "unshift" ) {
                if( !this.useDictionary ) {
                    this.ascii.unshift(String.fromCharCode(byte));
                }
                else {
                    if( this.lastByte !== -1 ) {
                        let translatedByte = this.byteAsText[[byte, this.lastByte]];
                        if( translatedByte == undefined ) {
                            translatedByte = "␣";
                        }
                        this.ascii.unshift(translatedByte);
                        this.lastByte = -1;
                    }
                    else {
                        this.lastByte = byte;
                        this.ascii.unshift("␣");
                    }
                }
            }
            else {
                if( !this.useDictionary ) {
                    this.ascii.push(String.fromCharCode(byte));
                }
                else {
                    if( this.lastByte !== -1 ) {
                        let translatedByte = this.byteAsText[[this.lastByte, byte]];
                        if( translatedByte == undefined ) {
                            translatedByte = "␣";
                        }
                        this.ascii.push(translatedByte);
                        this.lastByte = -1;
                    }
                    else {
                        this.lastByte = byte;
                        this.ascii.push("␣");
                    }
                }
            }
        },
        populateAtOffset: function(offset) {
            this.romData = [];
            this.addresses = [];
            this.ascii = [];

            for( const b of this.rom.slice(offset, this.initialEntries + offset) ) {
                this.romData.push(this.toHexString(b, 2));
                this.translateAscii("push", b);
            }

            for( var i = offset; i < this.initialEntries + offset; i += 16 ) {
                this.addresses.push(this.toHexString(i, 8));
            }

            this.setHexPosition(this.addresses[0]);
        },
        scrollDown: function() {
            if( this.getHex(this.addresses[0]) + 16 > this.rom.byteLength )
                return;

            this.addresses.shift();
            this.addresses.push(this.toHexString(this.getHex(this.addresses[this.addresses.length - 1]) + 16, 8));

            for( const b of this.rom.slice(this.getHex(this.addresses[this.addresses.length - 1]), this.getHex(this.addresses[this.addresses.length - 1]) + 16) ) {
                this.romData.shift();
                this.romData.push(this.toHexString(b, 2));

                this.ascii.shift();
                this.translateAscii("push", b);
            }

            this.setHexPosition(this.addresses[0]);
        },
        scrollUp: function() {
            if( this.getHex(this.addresses[0]) === 0 )
                return;

            this.addresses.pop();
            this.addresses.unshift(this.toHexString(this.getHex(this.addresses[0]) - 16, 8));

            let romBuffer = [];

            for( const b of this.rom.slice(Number(this.getHex(this.addresses[0])), Number(this.getHex(this.addresses[0])) + 16) ) {
                romBuffer.push(b);
            }

            romBuffer.reverse();

            for(var i = 0; i < 16; i++ ) {
                this.romData.pop();
                this.romData.unshift(this.toHexString(romBuffer[i], 2));

                this.ascii.pop();
                this.translateAscii("unshift", romBuffer[i]);
            }

            this.setHexPosition(this.addresses[0]);
        },
        pageDown: function() {
            let offset = this.getHex(this.addresses[0]) + this.initialEntries;
            if( offset + this.initialEntries > this.rom.byteLength) {
                offset = this.rom.byteLength - (this.initialEntries + this.rom.byteLength % 16);
            }
                
            this.populateAtOffset(offset);
        },
        pageUp: function() {
            let offset = this.getHex(this.addresses[0]) - this.initialEntries;
            if( offset < 0 ) 
                offset = 0;
                
            this.populateAtOffset(offset);
        },
        handleKeypress: function(event) {
            const KEY_LEFT = 37;
            const KEY_UP = 38;
            const KEY_RIGHT = 39;
            const KEY_DOWN = 40;

            switch( event.which ) {
            case KEY_DOWN:
                this.scrollDown();
                break;
            case KEY_UP:
                this.scrollUp();
                break;
            case KEY_LEFT:
                this.pageUp();
                break;
            case KEY_RIGHT:
                this.pageDown();
                break;
            }
        },
        handleScroll: function(event) {
            if(event.deltaY > 0) {
                this.scrollDown();
            }
            else {
                this.scrollUp();
            }
        },
        byteClicked: function( index, address ) {
            this.selected = index + this.getHex(address);
        },
        startSearch: function() {
            //todo: fix bug when no text
            //todo keep position unless successful search
            //todo: fix weird logic with shownoresults
            //todo only allow text search on %2 byte boundries
            let offset = -1;
            let fromIndex = 0;

            this.showNoResults = true;

            if( this.lastSearchText === this.searchText ) {
                fromIndex = this.getHex(this.addresses[1]);
            }
            this.lastSearchText = this.searchText;

            if( this.searchType === "Offset") {
                offset = this.getHex(this.searchText, 16);
            }
            else if (this.searchType === "Bytes") {
                let byteArray = [];
                let searchTextParsed = this.searchText.replace(" ", "").match(/.{2}/g);

                for( var byte of searchTextParsed ) {
                    byteArray.push(this.getHex(byte));
                }

                offset = this.rom.indexOf(Buffer.from(byteArray), fromIndex);
            }
            else if (this.searchType === "Text") {
                if( !this.useDictionary ) {
                    offset = this.rom.indexOf(Buffer.from(this.searchText), fromIndex);
                }
                else if( Object.keys(this.byteAsText).length !== 0 ) {
                    let byteArray = [];
                    for( var letter of this.searchText ) {
                        byteArray.push(this.textAsByte[letter][0]);
                        byteArray.push(this.textAsByte[letter][1]);
                    }

                    offset = this.rom.indexOf(Buffer.from(byteArray), fromIndex);
                }
            }

            if( offset == -1 ) {
                this.showNoResults = false;
            }

            offset = offset - (offset % 16);
            if( offset < 0 ) {
                offset = 0;
            }
            else if( offset + this.initialEntries > this.rom.byteLength) {
                offset = this.rom.byteLength - (this.initialEntries + this.rom.byteLength % 16);
            }

            this.populateAtOffset(offset);
        }
    },
    unmounted: function () {
        window.removeEventListener("wheel", this.handleScroll);
        window.removeEventListener("keydown", this.handleKeypress);
    }
};
</script>
