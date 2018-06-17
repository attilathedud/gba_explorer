<template>
    <!-- Wire up search box -->
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
            searchType: 'Offset'
        }
    },
    props: {
        rom : Buffer
    },
    methods: {
        handleScroll: function(event) {
            if(event.deltaY > 0) {
                //todo: don't allow scroll past end of byte buffer (this.rom.byteLength)
                this.addresses.shift();
                this.addresses.push(Number(parseInt(this.addresses[this.addresses.length - 1],16) + 16).toString(16).toUpperCase().padStart(8, '0'));

                for( const b of this.rom.slice(Number(parseInt(this.addresses[this.addresses.length - 1],16)), Number(parseInt(this.addresses[this.addresses.length - 1],16) + 16)) ) {
                    this.romData.shift();
                    this.romData.push(Number(b).toString(16).toUpperCase().padStart(2, '0'));

                    this.ascii.shift();
                    this.ascii.push(String.fromCharCode(b));
                }
            }
            else {
                if( this.addresses[ 0 ] === Number(0).toString(16).toUpperCase().padStart(8, '0') )
                    return;

                this.addresses.pop();
                this.addresses.unshift(Number(parseInt(this.addresses[0],16) - 16).toString(16).toUpperCase().padStart(8, '0'));

                let rom_buffer = [];

                for( const b of this.rom.slice(Number(parseInt(this.addresses[0],16)), Number(parseInt(this.addresses[0],16)) + 16) ) {
                    rom_buffer.push(b);
                }

                rom_buffer.reverse();
                for(var i = 0; i < 16; i++ ) {
                    this.romData.pop();
                    this.romData.unshift(Number(rom_buffer[i]).toString(16).toUpperCase().padStart(2, '0'));

                    this.ascii.pop();
                    this.ascii.unshift(String.fromCharCode(rom_buffer[i]));
                }
            }
        },
        byteClicked: function( byte, address ) {
            this.selected = byte + address;
        },
        startSearch: function() {
            this.addresses = [];
            this.romData = [];
            this.ascii = [];

            let offset = 0;

            if( this.searchType === "Offset") {
                offset = Number(parseInt(this.searchText, 16));
            }
            else if (this.searchType === "Bytes") {
                let byte_array = [];
                let searchTextParsed = this.searchText.match(/.{2}/g);

                for( var byte of searchTextParsed ) {
                    byte_array.push(Number(parseInt(byte, 16)));
                }

                offset = this.rom.indexOf(Buffer.from(byte_array));
            }
            else if (this.searchType === "Text") {
                offset = this.rom.indexOf(Buffer.from(this.searchText));
            }

            offset = offset - (offset % 16);

            for( const b of this.rom.slice(offset, this.initialEntries + offset) ) {
                this.romData.push(Number(b).toString(16).toUpperCase().padStart(2, '0'));
                this.ascii.push(String.fromCharCode(b));
            }

            for( var i = offset; i < this.initialEntries + offset; i += 16 ) {
                this.addresses.push(Number(i).toString(16).toUpperCase().padStart(8, '0'));
            }
        }
    },
    created: function() {
        for( const b of this.rom.slice(0, this.initialEntries) ) {
            this.romData.push(Number(b).toString(16).toUpperCase().padStart(2, '0'));
            this.ascii.push(String.fromCharCode(b));
        }

        for( var i = 0; i < this.initialEntries; i += 16 ) {
            this.addresses.push(Number(i).toString(16).toUpperCase().padStart(8, '0'));
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
