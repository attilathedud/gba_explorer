<template>
    <div>
        <div v-for="item in categories" v-bind:key="item" v-on:click="$emit('item-picked', item)">{{item}}</div>
    </div>
</template>

<script>
export default {
    name: 'Navbar',
    data: function () {
        return {
            categories: ['Header']
        }
    }
};
</script>
