<template>
    <div v-if="rom.length == 0">
        <FileSelector v-on:file-picked="onFilePicked"></FileSelector>
    </div>
    <div v-else>
      <Navbar v-on:item-picked="onItemPicked"></Navbar>
      <HeaderInfo v-if="section == 'Header'"></HeaderInfo>
      <HexView v-if="section == 'Hex View'"></HexView>
      <Strings v-if="section == 'Strings'"></Strings>
      <Graphics v-if="section == 'Graphics'"></Graphics>
      <Sounds v-if="section == 'Sounds'"></Sounds>
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

import { mapGetters } from 'vuex';
import { mapMutations } from 'vuex';

export default {
    components: {
        FileSelector,
        Navbar,
        HeaderInfo,
        HexView,
        Strings,
        Graphics,
        Sounds
    },
    computed: {
        ...mapGetters([
            'rom'
        ])
    },
    data: function() {
        return {
            section: 'Header'
        }
    },
    methods: {
        ...mapMutations([
            'setRom'
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
