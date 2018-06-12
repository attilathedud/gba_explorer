<template>
    <div class="columns">
        <div class="column is-one-quarter">
            <Navbar v-on:item-picked="onItemPicked"></Navbar>
        </div>
        <div class="column">
            <Search v-if="section == 'Search'" v-bind:rom=rom v-on:search-finished="onSearchFinished"></Search>
            <Dictionary v-if="section == 'Dictionary'" v-bind:rom=rom></Dictionary>
        </div>
    </div>
</template>


<script>
import Search from "./strings/Search.vue";
import Navbar from "./strings/Navbar.vue";
import Dictionary from "./strings/Dictionary.vue";

export default {
    name: 'Strings',
    components: {
        Search,
        Navbar,
        Dictionary
    },
    data: function() {
        return {
            section: 'Search'
        }
    },
    props: {
        rom : Buffer
    },
    methods : {
        onSearchFinished: function(match, searchText) {
            const rom = this.rom;

            console.log(match);

            /*matches.forEach(function(address) {
                console.log( address + " :: " + rom.slice(address, address+searchText.length)); 
            });*/
        },
        onItemPicked: function(item) {
            this.section = item;
        }
    }
};
</script>
