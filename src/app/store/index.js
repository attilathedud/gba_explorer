import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const state = {
    rom: Buffer.alloc(0)
};

const mutations = {
    SET_ROM(state, romData) {
        state.rom = romData;
    }
};

const getters =  {
    rom: state => state.rom
};

export default new Vuex.Store({
    state,
    getters,
    mutations
});
