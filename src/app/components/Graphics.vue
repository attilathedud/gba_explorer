<template>
  <div class="columns">
    <div class="column is-one-quarter">
      <SideNavbar 
        :categories="categories" 
        :selected="section" 
        @item-picked="onItemPicked" />
    </div>
    <div class="column">
      <Compressed v-if="section == 'Compressed'" />
      <Uncompressed v-if="section == 'Uncompressed'" />
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
                    sub: "LZ77 compressed data",
                    enabled: true
                },
                {
                    title: "Uncompressed",
                    icon: "fa-bars",
                    sub: "Raw view of the graphics data",
                    enabled: true
                }
            ]
        };
    },
    methods: {
        onItemPicked: function(item) {
            this.section = item;
        }
    }
};
</script>
