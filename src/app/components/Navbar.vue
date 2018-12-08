<template>
  <div class="tabs is-full-width">
    <ul>
      <li
        @click="selectNewFile">
        <a>
          <span class="icon is-small"><i
            class="fas fa-gamepad"
            aria-hidden="true" /></span>
          <span>Choose</span>
        </a>
      </li>
    </ul>
    <ul class="is-right">
      <li 
        v-for="item in categories" 
        :key="item.title" 
        :class="{'is-active':item.title == selected}" 
        @click="itemPicked(item.title)">
        <a>
          <span class="icon is-small"><i 
            :class="item.icon" 
            aria-hidden="true" /></span>
          <span>{{ item.title }}</span>
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
                { title: "Header", icon: "fas fa-file-alt" },
                { title: "Hex View", icon: "fas fa-columns" },
                { title: "Strings", icon: "fas fa-font" },
                { title: "Graphics", icon: "far fa-image" },
                { title: "Sounds", icon: "fas fa-music" },
                { title: "About", icon: "fas fa-info" }
            ],
            selected: "Header"
        };
    },
    methods: {
        itemPicked(item) {
            this.selected = item;
            this.$emit("item-picked", item);
        },
        selectNewFile() {
            this.itemPicked("Choose"); 
        }
    }
};
</script>
