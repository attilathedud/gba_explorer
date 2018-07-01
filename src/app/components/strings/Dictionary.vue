<template>
    <div class="dictionary-display">
        <table class="table is-striped is-narrow is-hoverable is-fullwidth">
            <thead>
                <tr>
                    <td class="has-text-grey-darker">Letter</td>
                    <td class="has-text-grey-darker">Byte</td>
                </tr>
            </thead>
            <tbody>
                <tr v-for="letter in sortedDictionary" v-bind:key="letter.id">
                    <td>{{letter[0]}}</td>
                    <td>{{ toHexString(letter[1][0], 2) + "" + toHexString(letter[1][1], 2) }}</td>
                </tr>
            </tbody>
        </table>        
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
