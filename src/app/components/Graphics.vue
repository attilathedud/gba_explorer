<template>
    <div class="columns">
        <div class="column is-one-quarter">
            <SideNavbar v-bind:categories="categories" v-bind:selected="section" v-on:item-picked="onItemPicked"></SideNavbar>
        </div>
        <div class="column">
            <Compressed v-if="section == 'Compressed'"></Compressed>
            <Uncompressed v-if="section == 'Uncompressed'"></Uncompressed>
        </div>
    </div>
</template>


<script>
import SideNavbar from "./common/SideNavbar.vue";
import Compressed from "./graphics/Compressed.vue";
import Uncompressed from "./graphics/Uncompressed.vue";

export default {
  name: "Graphics",
  components: {
      SideNavbar,
      Compressed,
      Uncompressed
  },
  data: function() {
    return {
      section: "Compressed",
      categories: [
        {
          title: "Compressed",
          icon: "fa-file-archive",
          sub: "LZ77 compressed data"
        },
        {
          title: "Uncompressed",
          icon: "fa-bars",
          sub: "Raw view of the graphics data"
        }
      ]
    }
  },
  methods: {
    onItemPicked: function(item) {
      this.section = item;
    }
  }
};
</script>
