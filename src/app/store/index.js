import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const state = {
    rom: Buffer.alloc(0),
    textAsByte : {},
    byteAsText : {},
    lastSearchText: ""
};

const mutations = {
    setRom(state, rom) {
        state.rom = rom;
    },
    addTextBytePair(state, payload) {
        state.textAsByte[payload.text] = payload.byte;
        state.byteAsText[payload.byte] = payload.text;
    },
    setSearchText(state, text) {
        state.lastSearchText = text;
    }
};

const getters =  {
    rom: state => state.rom,
    textAsByte: state => state.textAsByte,
    byteAsText: state => state.byteAsText,
    lastSearchText: state => state.lastSearchText
};

export default new Vuex.Store({
    state,
    getters,
    mutations
});
