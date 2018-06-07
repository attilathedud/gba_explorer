<template>
    <aside class="menu">
        <ul class="menu-list">
            <li v-for="item in categories" v-bind:key="item.title" v-on:click="itemPicked(item.title)">
                <a :class="{'is-active':item.title == selected}">
                    <span class="icon is-small"><i class="fas" :class="item.icon" aria-hidden="true"></i></span>
                    <span>{{item.title}}</span>
                    <p class="menu-description">{{item.sub}}</p>
                </a>
            </li>
        </ul>
    </aside>
</template>

<script>
export default {
    name: 'Navbar',
    data: function () {
        return {
            categories: [ {title : 'Search', icon: 'fa-search', sub: 'Search for string within the game'} , 
            {title : 'Dictionary', icon: 'fa-clipboard-list', sub: 'The mapped translation file for bytes to letters'}, 
            {title : 'Hex View', icon: 'fa-th-list', sub: 'Hex View with translated bytes'}, 
            {title : 'Dump', icon: 'fa-copy', sub: 'Dump sections of text for easy editing'}],
            selected: 'Search'
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
