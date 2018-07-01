<template>
    <div class="dictionary-container">
        <div class="box letter-box has-text-dark" v-for="letter in sortedDictionary" v-bind:key="letter.id">
            <span>{{letter[0]}}</span><br>
            <span>{{ toHexString(letter[1][0], 2) + "" + toHexString(letter[1][1], 2) }}</span>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'Dictionary',
    data: function() {
        return {
            sortedDictionary: []
        }
    },
    computed: {
        ...mapGetters([
            'rom',
            'textAsByte',
            'byteAsText'
        ])
    },
    created: function() {
        //todo: flag if selection is invalid dictionary
        //todo: change display to squares filled with data
        for( var key in this.textAsByte ) {
            this.sortedDictionary.push([key , this.textAsByte[key]]);
        }
        
        this.sortedDictionary.sort();
    },
    methods : {

    }
};
</script>
