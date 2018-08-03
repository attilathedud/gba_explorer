<template>
  <div>
    <div class="field">
      <label class="label">ROM Entry Point</label>
      <div class="control">
        <input 
          v-model="romEntryPoint" 
          class="input" 
          type="text">
      </div>
    </div>
    <div class="field">
      <label class="label">Debugging Enabled</label>
      <div class="control">
        <div class="select">
          <select v-model="debuggingEnabled">
            <option value="21">21 (Disabled)</option>
            <option value="A5">A5 (Enabled)</option>
          </select>
        </div>
      </div>
    </div>
    <div class="field">
      <label class="label">Game Title</label>
      <div class="control">
        <input 
          v-model="gameTitle" 
          class="input" 
          type="text">
        <p class="help">{{ gameTitleBytes }}</p>
      </div>
    </div>
    <div class="field">
      <label class="label">Game Code</label>
      <div class="control">
        <input 
          v-model="gameCode" 
          class="input" 
          type="text">
        <p class="help">{{ gameCodeBytes }}</p>
      </div>
    </div>
    <div class="field">
      <label class="label">Maker Code</label>
      <div class="control">
        <input 
          v-model="makerCode" 
          class="input" 
          type="text">
        <p class="help">{{ makerCodeBytes }}</p>
      </div>
    </div>
    <div class="field">
      <label class="label">Software Version</label>
      <div class="control">
        <input 
          v-model="softwareVersion" 
          class="input" 
          type="text">
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
    name: "HeaderInfo",
    data: function () {
        return {
            romEntryPoint : "",
            debuggingEnabled : "",
            gameTitleBytes : "",
            gameTitle : "",
            gameCodeBytes : "",
            gameCode : "",
            makerCodeBytes : "",
            makerCode : "",
            softwareVersion : ""
        };
    },
    computed: {
        ...mapGetters([
            "rom"
        ])
    },
    created: function() {
        for( var i = 0; i < 4; i++ ) {
            this.romEntryPoint += this.toHexString(this.rom[i], 2);
        }

        this.debuggingEnabled = this.toHexString(this.rom[0x9c], 2);

        for( var i = 0xa0; i < (0xa0 + 12); i++ ) {
            this.gameTitleBytes += this.toHexString(this.rom[i], 2) + " ";
            if(this.rom[i] !== 0) {
                this.gameTitle += String.fromCharCode(this.rom[i]);
            }
        }

        for( var i = 0xac; i < (0xac + 4); i++ ) {
            this.gameCodeBytes += this.toHexString(this.rom[i], 2) + " ";
            if(this.rom[i] !== 0) {
                this.gameCode += String.fromCharCode(this.rom[i]);
            }
        }

        for( var i = 0xb0; i < (0xb0 + 2); i++ ) {
            this.makerCodeBytes += this.toHexString(this.rom[i], 2) + " ";
            if(this.rom[i] !== 0) {
                this.makerCode += String.fromCharCode(this.rom[i]);
            }
        }

        this.softwareVersion = this.toHexString(this.rom[0xbc], 2);
    }
};
</script>
