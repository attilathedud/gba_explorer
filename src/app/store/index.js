import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const state = {
    rom: Buffer.alloc(0),
    textAsByte : {},
    byteAsText : {},
    lastSearchText: "",
    lastSearchMatches: [],
    lastSearchSelectedMatch: {}
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
    },
    setSearchMatches(state, matches) {
        state.lastSearchMatches = matches;
    },
    setSelectedMatch(state, match) {
        state.lastSearchSelectedMatch = match;
    }
};

const getters =  {
    rom: state => state.rom,
    textAsByte: state => state.textAsByte,
    byteAsText: state => state.byteAsText,
    lastSearchText: state => state.lastSearchText,
    lastSearchMatches: state => state.lastSearchMatches,
    lastSearchSelectedMatch: state => state.lastSearchSelectedMatch
};

export default new Vuex.Store({
    state,
    getters,
    mutations
});
