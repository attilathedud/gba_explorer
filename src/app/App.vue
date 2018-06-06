<template>
    <div v-if="romData.length == 0">
        <FileSelector v-on:file-picked="onFilePicked"></FileSelector>
    </div>
    <div v-else>
      <Navbar v-on:item-picked="onItemPicked"></Navbar>
      <HeaderInfo v-if="section == 'Header'" v-bind:rom=romData></HeaderInfo>
      <HexView v-if="section == 'Hex View'" v-bind:rom=romData></HexView>
      <Strings v-if="section == 'Strings'" v-bind:rom=romData></Strings>
    </div>
</template>

<script>
import FileSelector from "./components/FileSelector.vue";
import Navbar from "./components/Navbar.vue";

import HeaderInfo from "./components/HeaderInfo.vue";
import HexView from "./components/HexView.vue";
import Strings from "./components/Strings.vue";

export default {
  components: {
    FileSelector,
    Navbar,
    HeaderInfo,
    HexView,
    Strings
  },
  data: {
    romData: Buffer.alloc(0),
    section: 'Header'
  },
  methods: {
    onFilePicked: function(data) {
      this.romData = data;
    },
    onItemPicked: function(item) {
      this.section = item;
    }
  }
};
</script>
