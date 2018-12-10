<template>
  <div class="columns">
    <div class="column is-one-quarter">
      <SideNavbar 
        :categories="categories" 
        :selected="section" 
        @item-picked="onItemPicked"
      />
    </div>
    <div class="column">
      <Search 
        v-if="section == 'Search'" 
        @search-finished="onSearchFinished"
      />
      <Dictionary 
        v-if="section == 'Dictionary'"
        @item-added="onItemAdded"
      />
      <HexView 
        v-if="section == 'Hex View'"
        :use-dictionary="true"
      />
      <Dump v-if="section == 'Dump'" />
    </div>
  </div>
</template>


<script>
import Search from "./strings/Search.vue";
import SideNavbar from "./common/SideNavbar.vue";
import Dictionary from "./strings/Dictionary.vue";
import Dump from "./strings/Dump.vue";
import HexView from "./HexView.vue";

import { mapGetters } from "vuex";
import { mapMutations } from "vuex";

export default {
    name: "Strings",
    components: {
        Search,
        SideNavbar,
        Dictionary,
        HexView,
        Dump
    },
    data: function() {
        return {
            section: "Search",
            categories: [
                {
                    title: "Search",
                    icon: "fa-search",
                    sub: "Search for string within the game",
                    enabled: true
                },
                {
                    title: "Dictionary",
                    icon: "fa-clipboard-list",
                    sub: "The mapped translation file for bytes to letters",
                    enabled: true
                },
                {
                    title: "Hex View",
                    icon: "fa-th-list",
                    sub: "Hex View with translated bytes",
                    enabled: false
                },
                {
                    title: "Dump",
                    icon: "fa-copy",
                    sub: "Dump sections of text for easy editing",
                    enabled: false
                }
            ]
        };
    },
    computed: {
        ...mapGetters(["rom", "textAsByte", "byteAsText"])
    },
    mounted: function() {
        if( Object.keys(this.textAsByte).length > 0 ) {
            this.categories.forEach(x=>x.enabled = true);
        }
    },
    methods: {
        ...mapMutations(["addTextBytePair"]),
        onSearchFinished: function(match, searchText) {
            this.generateMatchDictionaryFromSearchText(
                this.rom.slice(match, match + searchText.length * 2),
                searchText
            );
            this.fillMatchDictionary(searchText);
            this.categories.forEach(x=>x.enabled = true);
        },
        onItemPicked: function(item) {
            this.section = item;
        },
        onItemAdded: function() {
            this.categories.forEach(x=>x.enabled = true);
        },
        generateMatchDictionaryFromSearchText: function(bytes, searchText) {
            for (var i = 0; i < searchText.length - 1; i++) {
                this.addTextBytePair({
                    text: searchText[i],
                    byte: [bytes[i * 2], bytes[i * 2 + 1]]
                });
            }
        },
        fillMatchDictionary: function(searchText) {
            let lowerCaseMatches = searchText.match(/[a-z]/g);
            if (lowerCaseMatches.length > 0) {
                for (let i = 0; i < 26; i++) {
                    let letter = String.fromCharCode(97 + i);

                    this.addTextBytePair({
                        text: letter,
                        byte: [
                            this.textAsByte[lowerCaseMatches[0]][0] +
                (letter.codePointAt() - lowerCaseMatches[0].codePointAt()),
                            this.textAsByte[lowerCaseMatches[0]][1]
                        ]
                    });
                }
            }

            let upperCaseMatches = searchText.match(/[A-Z]/g);
            if (upperCaseMatches.length > 0) {
                for (let i = 0; i < 26; i++) {
                    let letter = String.fromCharCode(65 + i);

                    this.addTextBytePair({
                        text: letter,
                        byte: [
                            this.textAsByte[upperCaseMatches[0]][0] +
                (letter.codePointAt() - upperCaseMatches[0].codePointAt()),
                            this.textAsByte[upperCaseMatches[0]][1]
                        ]
                    });
                }
            }
        }
    }
};
</script>
