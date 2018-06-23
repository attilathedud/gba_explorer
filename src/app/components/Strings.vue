<template>
    <div class="columns">
        <div class="column is-one-quarter">
            <Navbar v-on:item-picked="onItemPicked"></Navbar>
        </div>
        <div class="column">
            <Search v-if="section == 'Search'" v-bind:rom=rom v-on:search-finished="onSearchFinished"></Search>
            <Dictionary v-if="section == 'Dictionary'" v-bind:rom=rom v-bind:dictionary=dictionaryTextToByte></Dictionary>
            <HexView v-if="section == 'Hex View'" v-bind:rom=rom v-bind:dictionary=dictionaryByteToText v-bind:letterDictionary=dictionaryTextToByte></HexView>
        </div>
    </div>
</template>


<script>
import Search from "./strings/Search.vue";
import Navbar from "./strings/Navbar.vue";
import Dictionary from "./strings/Dictionary.vue";
import HexView from "./HexView.vue";

export default {
    name: 'Strings',
    components: {
        Search,
        Navbar,
        Dictionary,
        HexView
    },
    data: function() {
        return {
            section: 'Search',
            dictionaryTextToByte: {},
            dictionaryByteToText: {}
        }
    },
    props: {
        rom : Buffer
    },
    methods : {
        onSearchFinished: function(match, searchText) {
            this.generateMatchDictionaryFromSearchText(this.rom.slice(match, match + (searchText.length * 2)), searchText);
            this.fillMatchDictionary(searchText);
            for( var key in this.dictionaryTextToByte ) {
                this.dictionaryByteToText[this.dictionaryTextToByte[key]] = key;
            }
        },
        onItemPicked: function(item) {
            this.section = item;
        },
        generateMatchDictionaryFromSearchText: function(bytes, searchText) {
            for(var i = 0; i < searchText.length - 1; i++) {
                this.dictionaryTextToByte[searchText[i]] = [bytes[i*2], bytes[i*2+1]];
            }
        },
        fillMatchDictionary: function(searchText) {
            let lowerCaseMatches = searchText.match(/[a-z]/g);
            if( lowerCaseMatches.length > 0 ) {
                for( var i = 0; i < 26; i++ ) {
                    let letter = String.fromCharCode(97 + i);

                    this.dictionaryTextToByte[letter] = 
                        [this.dictionaryTextToByte[lowerCaseMatches[0]][0] + (letter.codePointAt() - lowerCaseMatches[0].codePointAt()), this.dictionaryTextToByte[lowerCaseMatches[0]][1]];
                }
            }

            let upperCaseMatches = searchText.match(/[A-Z]/g);
            if( upperCaseMatches.length > 0 ) {
                for( var i = 0; i < 26; i++ ) {
                    let letter = String.fromCharCode(65 + i);

                    this.dictionaryTextToByte[letter] = 
                        [this.dictionaryTextToByte[upperCaseMatches[0]][0] + (letter.codePointAt() - upperCaseMatches[0].codePointAt()), this.dictionaryTextToByte[upperCaseMatches[0]][1]];
                }
            }
        }
    }
};
</script>
