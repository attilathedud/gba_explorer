import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const state = {
    rom: Buffer.alloc(0),
    textAsByte : {},
    byteAsText : {}
};

const mutations = {
    setRom(state, rom) {
        state.rom = rom;
    },
    addTextBytePair(state, payload) {
        state.textAsByte[payload.text] = payload.byte;
        state.byteAsText[payload.byte] = payload.text;
    }
};

const getters =  {
    rom: state => state.rom,
    textAsByte: state => state.textAsByte,
    byteAsText: state => state.byteAsText,
};

export default new Vuex.Store({
    state,
    getters,
    mutations
});
