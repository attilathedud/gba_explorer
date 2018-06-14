<template>
    <table class="table is-striped is-narrow is-hoverable is-fullwidth">
        <thead>
            <tr>
                <td class="has-text-grey-darker">Byte</td>
                <td class="has-text-grey-darker">Letter</td>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(letter,key) in dictionary" v-bind:key="letter.id">
                <td>{{letter}}</td>
                <td>{{key}}</td>
            </tr>
        </tbody>
    </table>        
</template>

<script>
export default {
    name: 'Dictionary',
    data: function() {
        return {
            
        }
    },
    props: {
        rom : Buffer,
        dictionary: {}
    },
    methods : {
        
    }
};
</script>
