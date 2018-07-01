<template>
    <div v-on:keyup.esc="isPickingMatch=false">
        <p>Search for a string that exists within the game.</p><br>
        <div class="field">
            <div class="control">
                <input class="input" type="text" v-model="searchText" v-on:keyup.enter="startSearch">
            </div>
        </div>
        <div class="control">
            <button class="button is-medium" v-on:click="startSearch" :class="{'is-loading':isSearching}">Search</button>
        </div>
        <br>
        <div class="field" v-if="matches.length > 0">
            <label class="label">Selected Match for {{matchSelectedText}}</label>
            <div class="control">
                <div class="select">
                    <select v-model="matchSelected" v-on:change="selectMatch(matchSelected)">
                        <option v-for="match in matches" v-bind:key="match.id" v-bind:value="match.address">
                            0x{{Number(match.address).toString(16).toUpperCase().padStart(8, '0')}} | {{match.bytes}}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div class="modal" :class="{'is-active':isPickingMatch}">
            <div class="modal-background"></div>
            <div class="modal-content">
                <div class="box">
                    <p class="has-text-grey-dark">There were multiple matches for the search. Please choose one to use.</p>
                    <table class="table is-striped is-narrow is-hoverable is-fullwidth">
                        <tbody>
                            <tr class="search-selector" v-for="match in matches" v-bind:key="match.id" v-on:click="selectMatch(match)">
                                <td>0x{{Number(match.address).toString(16).toUpperCase().padStart(8, '0')}}</td>
                                <td>{{match.bytes}}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <button class="modal-close is-large" aria-label="close" v-on:click="isPickingMatch=false"></button>
        </div>
    </div>
</template>


<script>
import sww from 'simple-web-worker';
import { mapGetters } from 'vuex';

export default {
    name: 'Search',
    data: function() {
        return {
            searchText: '',
            isSearching: false,
            isPickingMatch: false,
            worker : {},
            matches : [],
            matchSelected : "",
            matchSelectedText : ""
        }
    },
    computed: {
        ...mapGetters([
            'rom'
        ])
    },
    created: function() {
        this.worker = sww.create([{ message: 'search', 
            func: function (rom, searchText) {
                let matches = [];

                for(let i = 0; i < rom.byteLength - searchText.length; i++ ) {
                    let match_score = 0;

                    for( let c = 0; c < searchText.length - 1; c++ ) {
                        if( rom[ i + ( c * 2 ) ] + ( searchText[ c + 1 ].charCodeAt() - searchText[ c ].charCodeAt() ) == rom[ i + ( c * 2 ) + 2 ] ) {
                            match_score++;
                        }
                    }

                    //match_score >= searchText.length - fuzz - 1
                    if( match_score >= searchText.length - 1 - 1) {
                        matches.push(i);
                    }
                }

                return {'matches': matches, 'searchText' : searchText};
            }
        }]);
    },
    methods : {
        startSearch: function() {
            //todo: fix bug if no result
            this.isSearching = true;
            this.matches = [];

            let context = this;

            this.worker.postMessage('search', [this.rom, this.searchText])
                .then(results => {
                    const matches = this.matches;
                    const rom = this.rom;

                    if( results.matches.length == 1 ) {
                        this.selectMatch();
                    }
                    else {
                        this.isPickingMatch = true;

                        results.matches.forEach(function(address) {
                            let match_section = rom.slice(address, address+results.searchText.length * 2);
                            let byte_buffer = [];
    
                            for( var i = 0; i < results.searchText.length * 2; i++ ) {
                                byte_buffer.push(context.toHexString(match_section[i], 2));                                
                            }
    
                            matches.push({'address' : address, 'bytes' : byte_buffer.join('')});
                        });
                    }

                    this.isSearching = false;
                });
        },
        selectMatch: function(match) {
            this.isPickingMatch = false;
            this.$emit('search-finished', match.address, this.searchText);
            this.matchSelected = match.address;
            this.matchSelectedText = this.searchText; 
        }
    }
};
</script>
