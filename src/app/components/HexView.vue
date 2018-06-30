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
                <input class="input" type="text" v-model="searchText" v-on:keyup.enter="startSearch">
            </p>
            <p class="control">
                <a class="button" v-on:click="startSearch">Search</a>
            </p>
        </div>
        <table id="hex-view" class="table is-striped is-narrow is-hoverable">
            <tbody>
                <tr v-for="(address, index) in addresses" v-bind:key="address.id">
                    <td class="has-text-grey-light">{{address}}</td>
                    <td v-for="item in romData.slice((index) * 16, ((index) * 16) + 16)" v-bind:key="item.id" v-on:click="byteClicked(item, address)" :class="{'has-background-success':item+address == selected}">
                        {{item}}
                    </td>
                    <td>
                        <span v-for="letter in ascii.slice((index) * 16, ((index) * 16) + 16)" v-bind:key="letter.id">
                            {{letter}}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
export default {
    name: 'HexView',
    data: function() {
        return {
            romData : [],
            addresses : [],
            ascii: [],
            initialEntries: 400,
            selected: '',
            searchText: '',
            searchType: 'Offset',
            lastByte: -1
        }
    },
    props: {
        rom : Buffer,
        dictionary: {},
        letterDictionary: {}
    },
    methods: {
        translateAscii: function( type, byte ) {
            if( type == "unshift" ) {
                if( !this.dictionary || Object.keys(this.dictionary).length === 0 ) {
                    this.ascii.unshift(String.fromCharCode(byte));
                }
                else {
                    if( this.lastByte !== -1 ) {
                        let translated_byte = this.dictionary[[byte, this.lastByte]];
                        if( translated_byte == undefined ) {
                            translated_byte = "";
                        }
                        this.ascii.unshift(translated_byte);
                        this.lastByte = -1;
                    }
                    else {
                        this.lastByte = byte;
                        this.ascii.unshift(" ");
                    }
                }
            }
            else {
                if( !this.dictionary || Object.keys(this.dictionary).length === 0 ) {
                    this.ascii.push(String.fromCharCode(byte));
                }
                else {
                    if( this.lastByte !== -1 ) {
                        let translated_byte = this.dictionary[[this.lastByte, byte]];
                        if( translated_byte == undefined ) {
                            translated_byte = "";
                        }
                        this.ascii.push(translated_byte);
                        this.lastByte = -1;
                    }
                    else {
                        this.lastByte = byte;
                        this.ascii.push(" ");
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

                let rom_buffer = [];

                for( const b of this.rom.slice(Number(this.getHex(this.addresses[0])), Number(this.getHex(this.addresses[0])) + 16) ) {
                    rom_buffer.push(b);
                }

                rom_buffer.reverse();

                for(var i = 0; i < 16; i++ ) {
                    this.romData.pop();
                    this.romData.unshift(this.toHexString(rom_buffer[i], 2));

                    this.ascii.pop();
                    this.translateAscii("unshift", rom_buffer[i]);
                }
            }
        },
        byteClicked: function( byte, address ) {
            this.selected = byte + address;
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
                let byte_array = [];
                let searchTextParsed = this.searchText.match(/.{2}/g);

                for( var byte of searchTextParsed ) {
                    byte_array.push(this.getHex(byte));
                }

                offset = this.rom.indexOf(Buffer.from(byte_array));
            }
            else if (this.searchType === "Text") {
                if( !this.dictionary || Object.keys(this.dictionary).length === 0 ) {
                    offset = this.rom.indexOf(Buffer.from(this.searchText));
                }
                else {
                    let byte_array = [];
                    for( var letter of this.searchText ) {
                        byte_array.push(this.letterDictionary[letter][0]);
                        byte_array.push(this.letterDictionary[letter][1]);
                    }

                    offset = this.rom.indexOf(Buffer.from(byte_array));
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
        document.getElementById('hex-view').addEventListener('wheel', this.handleScroll);
    },
    unmounted: function () {
        document.getElementById('hex-view').removeEventListener('wheel', this.handleScroll);
    }
};
</script>
