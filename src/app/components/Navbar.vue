<template>
    <div class="tabs is-right is-full-width">
        <ul>
            <li v-for="item in categories" v-bind:key="item.title" v-on:click="itemPicked(item.title)" :class="{'is-active':item.title == selected}">
                <a>
                    <span class="icon is-small"><i class="fas" :class="item.icon" aria-hidden="true"></i></span>
                    <span>{{item.title}}</span>
                </a>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
  name: "Navbar",
  data: function() {
    return {
      categories: [
        { title: "Header", icon: "fa-file-alt" },
        { title: "Hex View", icon: "fa-columns" },
        { title: "Strings", icon: "fa-font" },
        { title: "Graphics", icon: "fa-image" },
        { title: "Sounds", icon: "fa-music" },
      ],
      selected: "Header"
    };
  },
  methods: {
    itemPicked(item) {
      this.selected = item;
      this.$emit("item-picked", item);
    }
  }
};
</script>
