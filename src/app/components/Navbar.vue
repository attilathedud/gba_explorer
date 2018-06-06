<template>
    <div class="tabs is-full-width">
        <ul>
            <li v-for="item in categories" v-bind:key="item" v-on:click="itemPicked(item)" :class="{'is-active':item == selected}">
                <a>{{item}}</a>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'Navbar',
    data: function () {
        return {
            categories: ['Header', 'Hex View', 'Strings'],
            selected: 'Header'
        }
    },
    methods: {
        itemPicked( item ) {
            this.selected = item;
            this.$emit('item-picked', item);
        }
    }
};
</script>
