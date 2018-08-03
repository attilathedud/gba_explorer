<template>
  <div>
    <div class="field">
      <label class="label">Start Address</label>
      <div class="control">
        <input 
          v-model="startAddress" 
          class="input" 
          type="text">
      </div>
    </div>
    <div class="field">
      <label class="label">End Address</label>
      <div class="control">
        <input 
          v-model="endAddress" 
          class="input" 
          type="text">
      </div>
    </div>
    <div class="field">
      <div class="control">
        <button 
          class="button" 
          :class="{'is-loading':isDumping}" 
          @click="dump">Dump</button>
      </div>
    </div>
    <div class="field">
      <div class="control">
        <textarea 
          v-model="dumpedStrings" 
          class="textarea" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
    name: "Dump",
    data: function () {
        return {
            startAddress: "",
            endAddress: "",
            dumpedStrings: "",
            isDumping: false
        };
    },
    computed: {
        ...mapGetters([
            "rom",
            "byteAsText"
        ])
    },
    methods: {
        dump: function() {
            let lastByte = -1;
            this.dumpedStrings = "";

            for( const b of this.rom.slice(this.getHex(this.startAddress), this.getHex(this.endAddress))) {
                if( lastByte == -1 ) {
                    lastByte = b;
                }
                else {
                    let translated_byte = this.byteAsText[[ lastByte, b ]];
                    if( translated_byte == undefined ) {
                        translated_byte = "";
                    }
                    
                    this.dumpedStrings += translated_byte;
                    lastByte = -1;
                }
            }
        }
    }
};
</script>
