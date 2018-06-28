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
                    <td>{{ Number(letter[1][0]).toString(16).toUpperCase().padStart(2, '0') + "" + Number(letter[1][1]).toString(16).toUpperCase().padStart(2, '0') }}</td>
                </tr>
            </tbody>
        </table>        
    </div>
</template>

<script>
export default {
    name: 'Dictionary',
    data: function() {
        return {
            sortedDictionary: []
        }
    },
    props: {
        rom : Buffer,
        dictionary: {}
    },
    created: function() {
        //todo: flag if selection is invalid dictionary
        for( var key in this.dictionary ) {
            this.sortedDictionary.push([key , this.dictionary[key]]);
        }
        
        this.sortedDictionary.sort();
    },
    methods : {

    }
};
</script>
