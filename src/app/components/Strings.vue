<template>
    <div class="columns">
        <div class="column is-one-quarter">
            <Navbar v-on:item-picked="onItemPicked"></Navbar>
        </div>
        <div class="column">
            <Search v-if="section == 'Search'" v-on:search-finished="onSearchFinished"></Search>
            <Dictionary v-if="section == 'Dictionary'"></Dictionary>
            <HexView v-if="section == 'Hex View'"></HexView>
            <Dump v-if="section == 'Dump'"></Dump>
        </div>
    </div>
</template>


<script>
import Search from "./strings/Search.vue";
import Navbar from "./strings/Navbar.vue";
import Dictionary from "./strings/Dictionary.vue";
import Dump from "./strings/Dump.vue";
import HexView from "./HexView.vue";

import { mapGetters } from 'vuex';
import { mapMutations } from 'vuex';

export default {
    name: 'Strings',
    components: {
        Search,
        Navbar,
        Dictionary,
        HexView,
        Dump
    },
    data: function() {
        return {
            section: 'Search'
        }
    },
    computed: {
        ...mapGetters([
            'rom',
            'textAsByte',
            'byteAsText'
        ])
    },
    methods : {
        ...mapMutations([
            'addTextBytePair'
        ]),
        onSearchFinished: function(match, searchText) {
            this.generateMatchDictionaryFromSearchText(this.rom.slice(match, match + (searchText.length * 2)), searchText);
            this.fillMatchDictionary(searchText);
        },
        onItemPicked: function(item) {
            this.section = item;
        },
        generateMatchDictionaryFromSearchText: function(bytes, searchText) {
            for(var i = 0; i < searchText.length - 1; i++) {
                this.addTextBytePair({'text' : searchText[i], 'byte' : [bytes[i*2], bytes[i*2+1]]});
            }
        },
        fillMatchDictionary: function(searchText) {
            let lowerCaseMatches = searchText.match(/[a-z]/g);
            if( lowerCaseMatches.length > 0 ) {
                for( let i = 0; i < 26; i++ ) {
                    let letter = String.fromCharCode(97 + i);

                    this.addTextBytePair({'text' : letter, 'byte' :
                        [
                            this.textAsByte[lowerCaseMatches[0]][0] + (letter.codePointAt() - lowerCaseMatches[0].codePointAt()), 
                            this.textAsByte[lowerCaseMatches[0]][1]
                        ]});
                }
            }

            let upperCaseMatches = searchText.match(/[A-Z]/g);
            if( upperCaseMatches.length > 0 ) {
                for( let i = 0; i < 26; i++ ) {
                    let letter = String.fromCharCode(65 + i);

                    this.addTextBytePair({'text' : letter, 'byte' : 
                        [
                            this.textAsByte[upperCaseMatches[0]][0] + (letter.codePointAt() - upperCaseMatches[0].codePointAt()), 
                            this.textAsByte[upperCaseMatches[0]][1]
                        ]});
                }
            }
        }
    }
};
</script>
