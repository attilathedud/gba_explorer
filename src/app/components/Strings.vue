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
export default {
    name: 'Strings',
    data: function() {
        return {
            searchText: '',
            isSearching: false
        }
    },
    props: {
        rom : Buffer
    },
    methods : {
        startSearch: function() {
            this.isSearching = true;

            
        }
    }
};
</script>
