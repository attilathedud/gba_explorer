<template>
    <div v-if="rom.length == 0">
        <FileSelector v-on:file-picked="onFilePicked"></FileSelector>
    </div>
    <div v-else>
      <Navbar v-on:item-picked="onItemPicked"></Navbar>
      <HeaderInfo v-if="section == 'Header'"></HeaderInfo>
      <HexView v-if="section == 'Hex View'"></HexView>
      <Strings v-if="section == 'Strings'"></Strings>
    </div>
</template>

<script>
import FileSelector from "./components/FileSelector.vue";
import Navbar from "./components/Navbar.vue";

import HeaderInfo from "./components/HeaderInfo.vue";
import HexView from "./components/HexView.vue";
import Strings from "./components/Strings.vue";

import { mapGetters } from 'vuex';
import { mapMutations } from 'vuex';

export default {
    components: {
        FileSelector,
        Navbar,
        HeaderInfo,
        HexView,
        Strings
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
            'SET_ROM'
        ]),
        onFilePicked: function(data) {
            this.SET_ROM(data);
        },
        onItemPicked: function(item) {
            this.section = item;
        }
    }
};
</script>
