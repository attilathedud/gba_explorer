<template>
    <div class="centered-horizontal centered-vertical">
        <div class="box">
            <h3 class="is-size-3 has-text-dark">Search</h3>
            <p class="has-text-dark">Please search for a string that exists within the game.</p>
            <input class="input" type="text" v-model="searchText">
            <div class="centered-horizontal">
                <button class="button is-medium" v-on:click="startSearch" :class="{'is-loading':isSearching}">Search</button>
            </div>
        </div>
    </div>
</template>


<script>
import sww from 'simple-web-worker';

export default {
    name: 'Strings',
    data: function() {
        return {
            searchText: '',
            isSearching: false,
            worker : {}
        }
    },
    props: {
        rom : Buffer
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

                    if( match_score >= searchText.length - 1 - 1) {
                        matches.push(i);
                    }
                }

                return {'matches': matches, 'rom' : rom, 'searchText' : searchText};
            }
        }]);
    },
    methods : {
        startSearch: function() {
            this.isSearching = true;

            this.worker.postMessage('search', [this.rom, this.searchText])
                .then(results => {
                    results.matches.forEach(function(address) {
                        console.log( address + " :: " + results.rom.slice(address, address+results.searchText.length));
                    });
                    this.isSearching = false;
                });
        }
    }
};
</script>
