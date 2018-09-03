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
      <label class="label">Break Bytes (optional)</label>
      <div class="control">
        <input 
          v-model="breakBytes" 
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
    <div
      v-if="dumpedStrings.length > 0"
      class="field">
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
import { mapMutations } from "vuex";

export default {
    name: "Dump",
    data: function () {
        return {
            startAddress: "",
            endAddress: "",
            breakBytes: "",
            dumpedStrings: "",
            isDumping: false
        };
    },
    computed: {
        ...mapGetters([
            "rom",
            "byteAsText",
            "lastDumpStartAddress",
            "lastDumpEndAddress",
            "lastDumpBreakBytes",
            "lastDumpStrings"
        ])
    },
    created: function() {
        this.startAddress = this.lastDumpStartAddress;
        this.endAddress = this.lastDumpEndAddress;
        this.breakBytes = this.lastDumpBreakBytes;
        this.dumpedStrings = this.lastDumpStrings;
    },
    methods: {
        ...mapMutations(["setDumpInfo"]),
        dump: function() {
            let lastByte = -1;
            this.dumpedStrings = "";

            for( const b of this.rom.slice(this.getHex(this.startAddress), this.getHex(this.endAddress))) {
                if( lastByte == -1 ) {
                    lastByte = b;
                }
                else {
                    let translatedByte = this.byteAsText[[ lastByte, b ]];
                    if( translatedByte == undefined ) {
                        translatedByte = "";
                    }
                    
                    if( (this.toHexString(lastByte, 2) + this.toHexString(b, 2)).toLowerCase() == this.breakBytes.replace(/ /g, "").toLowerCase() ) {
                        this.dumpedStrings += "\n\n";
                    }
                    this.dumpedStrings += translatedByte;
                    lastByte = -1;
                }
            }

            this.setDumpInfo({
                startAddress: this.startAddress,
                endAddress: this.endAddress,
                breakBytes: this.breakBytes,
                dumpStrings: this.dumpedStrings
            });
        }
    }
};
</script>
