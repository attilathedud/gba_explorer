<template>
  <div v-if="rom.length == 0">
    <FileSelector @file-picked="onFilePicked" />
  </div>
  <div v-else>
    <Navbar @item-picked="onItemPicked" />
    <HeaderInfo v-if="section == 'Header'" />
    <HexView v-if="section == 'Hex View'" />
    <Strings v-if="section == 'Strings'" />
    <Graphics v-if="section == 'Graphics'" />
    <Sounds v-if="section == 'Sounds'" />
    <About v-if="section == 'About'" />
  </div>
</template>

<script>
import FileSelector from "./components/FileSelector.vue";
import Navbar from "./components/Navbar.vue";

import HeaderInfo from "./components/HeaderInfo.vue";
import HexView from "./components/HexView.vue";
import Strings from "./components/Strings.vue";
import Graphics from "./components/Graphics.vue";
import Sounds from "./components/Sounds.vue";
import About from "./components/About.vue";

import { mapGetters } from "vuex";
import { mapMutations } from "vuex";

export default {
    components: {
        FileSelector,
        Navbar,
        HeaderInfo,
        HexView,
        Strings,
        Graphics,
        Sounds,
        About
    },
    data: function() {
        return {
            section: "Header"
        };
    },
    computed: {
        ...mapGetters([
            "rom"
        ])
    },
    methods: {
        ...mapMutations([
            "setRom"
        ]),
        onFilePicked: function(data) {
            this.setRom(data);
        },
        onItemPicked: function(item) {
            this.section = item;
        }
    }
};
</script>
