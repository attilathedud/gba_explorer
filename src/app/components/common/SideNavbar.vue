<template>
  <aside class="menu">
    <ul class="menu-list">
      <li 
        v-for="item in categories" 
        :key="item.title" 
        @click="itemPicked(item.title)">
        <a :class="{'is-active':item.title == selected}">
          <span class="icon is-small"><i 
            class="fas" 
            :class="item.icon" 
            aria-hidden="true" /></span>
          <span>{{ item.title }}</span>
          <p class="menu-description">{{ item.sub }}</p>
        </a>
      </li>
    </ul>
  </aside>
</template>

<script>
export default {
    name: "SideNavbar",
    props: {
        categories: Array,
        selected: ""
    },
    methods: {
        itemPicked(item) {
            this.$emit("item-picked", item);
        }
    }
};
</script>
