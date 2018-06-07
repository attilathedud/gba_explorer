<template>
    <div>
        <p>Search for a string that exists within the game.</p><br>
        <p>Avoid text:</p>
        <div class="tags">
            <span class="tag is-danger is-medium">On the Title Screen</span>
            <span class="tag is-danger is-medium">On the HUD</span>
            <span class="tag is-danger is-medium">That contains numbers or punctuation</span>
        </div>
        <div class="field">
            <div class="control">
                <input class="input" type="text" v-model="searchText">
            </div>
        </div>
        <div class="control">
            <button class="button is-medium" v-on:click="startSearch" :class="{'is-loading':isSearching}">Search</button>
        </div>
    </div>
</template>


<script>
import sww from 'simple-web-worker';

export default {
    name: 'Search',
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

                return {'matches': matches, 'searchText' : searchText};
            }
        }]);
    },
    methods : {
        startSearch: function() {
            this.isSearching = true;

            this.worker.postMessage('search', [this.rom, this.searchText])
                .then(results => {
                    this.$emit('search-finished', results.matches, results.searchText);
                    this.isSearching = false;
                });
        }
    }
};
</script>
