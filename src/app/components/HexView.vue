<template>
  <div class="hex-view-holder">
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
    <table 
      id="hex-view" 
      class="table is-striped is-narrow is-hoverable">
      <tbody>
        <tr 
          v-for="(address, index) in addresses" 
          :key="address.id">
          <td class="has-text-grey-light">{{ address }}</td>
          <td 
            v-for="(item, item_index) in romData.slice((index) * 16, ((index) * 16) + 16)" 
            :key="item.id" 
            :class="{'has-background-success':getHex(address)+item_index == selected}" 
            @click="byteClicked(item_index, address)">
            {{ item }}
          </td>
          <td>
            <span 
              v-for="(letter, letter_index) in ascii.slice((index) * 16, ((index) * 16) + 16)" 
              :key="letter.id" 
              :class="{'has-background-success':getHex(address)+letter_index == selected}">
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

export default {
    name: "HexView",
    data: function() {
        return {
            romData : [],
            addresses : [],
            ascii: [],
            initialEntries: 400,
            selected: -1,
            searchText: "",
            searchType: "Offset",
            lastByte: -1
        };
    },
    computed: {
        ...mapGetters([
            "rom",
            "textAsByte",
            "byteAsText"
        ])
    },
    created: function() {
        for( const b of this.rom.slice(0, this.initialEntries) ) {
            this.romData.push(this.toHexString(b, 2));
            this.translateAscii("push", b);
        }

        for( var i = 0; i < this.initialEntries; i += 16 ) {
            this.addresses.push(this.toHexString(i, 8));
        }
    },
    mounted: function() {
        document.getElementById("hex-view").addEventListener("wheel", this.handleScroll);
    },
    methods: {
        translateAscii: function( type, byte ) {
            if( type == "unshift" ) {
                if( !this.byteAsText || Object.keys(this.byteAsText).length === 0 ) {
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
                if( !this.byteAsText || Object.keys(this.byteAsText).length === 0 ) {
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
        handleScroll: function(event) {
            if(event.deltaY > 0) {
                //todo: don't allow scroll past end of byte buffer (this.rom.byteLength)
                this.addresses.shift();
                this.addresses.push(this.toHexString(this.getHex(this.addresses[this.addresses.length - 1]) + 16, 8));

                for( const b of this.rom.slice(this.getHex(this.addresses[this.addresses.length - 1]), this.getHex(this.addresses[this.addresses.length - 1]) + 16) ) {
                    this.romData.shift();
                    this.romData.push(this.toHexString(b, 2));

                    this.ascii.shift();
                    this.translateAscii("push", b);
                }
            }
            else {
                if( this.addresses[ 0 ] === this.toHexString(0, 8) )
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
            }
        },
        byteClicked: function( index, address ) {
            this.selected = index + this.getHex(address);
        },
        startSearch: function() {
            //todo: add in search for next element
            this.addresses = [];
            this.romData = [];
            this.ascii = [];

            let offset = 0;

            if( this.searchType === "Offset") {
                offset = this.getHex(this.searchText, 16);
            }
            else if (this.searchType === "Bytes") {
                //todo: parse byte array passed
                let byteArray = [];
                let searchTextParsed = this.searchText.match(/.{2}/g);

                for( var byte of searchTextParsed ) {
                    byteArray.push(this.getHex(byte));
                }

                offset = this.rom.indexOf(Buffer.from(byteArray));
            }
            else if (this.searchType === "Text") {
                if( !this.byteAsText || Object.keys(this.byteAsText).length === 0 ) {
                    offset = this.rom.indexOf(Buffer.from(this.searchText));
                }
                else {
                    let byteArray = [];
                    for( var letter of this.searchText ) {
                        byteArray.push(this.textAsByte[letter][0]);
                        byteArray.push(this.textAsByte[letter][1]);
                    }

                    offset = this.rom.indexOf(Buffer.from(byteArray));
                }
            }

            offset = offset - (offset % 16);
            if( offset < 0 ) {
                offset = 0;
            }

            for( const b of this.rom.slice(offset, this.initialEntries + offset) ) {
                this.romData.push(this.toHexString(b, 2));
                this.translateAscii("push", b);
            }

            for( var i = offset; i < this.initialEntries + offset; i += 16 ) {
                this.addresses.push(this.toHexString(i, 8));
            }
        }
    },
    unmounted: function () {
        document.getElementById("hex-view").removeEventListener("wheel", this.handleScroll);
    }
};
</script>
