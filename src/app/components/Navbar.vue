<template>
    <div>
        <aside class="menu">
            <ul class="menu-list">
                <li v-for="item in categories" v-bind:key="item" v-on:click="itemPicked(item)">
                    <a :class="{'is-active':item == selected}">{{item}}</a>
                </li>
            </ul>
        </aside>
    </div>
</template>

<script>
export default {
    name: 'Navbar',
    data: function () {
        return {
            categories: ['Header', 'Hex View'],
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
