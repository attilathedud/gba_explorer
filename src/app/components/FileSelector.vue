<template>
  <article class="media box">
    <figure class="media-left">
      <span class="icon is-large">
        <i class="fas fa-3x fa-gamepad" />
      </span>
    </figure>
    <div class="media-content">
      <div class="content">
        <h3 class="is-size-3 has-text-dark">
          Start Exploring!
        </h3>
        <p class="has-text-dark">
          Please choose a .gba file to explore.
        </p>
        <div class="centered-horizontal">
          <button 
            class="button is-primary is-medium choose-file-button" 
            @click="chooseFile"
          >
            Choose
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script>
const dialog = require("electron").remote.dialog;
const fs = require("fs");

const debugMode = false;

export default {
    name: "FileSelector",
    created: function() {
        if( debugMode ) {
            fs.readFile(process.cwd() + "/roms/metroid.gba", (err, data) => {
                if(err){
                    alert("Cannot find the file specified");
                    return;
                }

                this.$emit("file-picked", data);
            });
        } 
    },
    methods: {
        chooseFile() {
            dialog.showOpenDialog({ filters: [
                { name: "rom", extensions: ["gba", "rom"] }
            ] }, (files) => {
                if( files === undefined ) {
                    alert("Please select a rom file");
                    return;
                }

                fs.readFile(files[0], (err, data) => {
                    if(err){
                        alert("Cannot find the file specified");
                        return;
                    }

                    let calculatedChecksum = 0;
                    for( let n = 0xA0; n <= 0xBC; n++ ) {
                        calculatedChecksum -= data[n];
                    }

                    calculatedChecksum = (calculatedChecksum - 0x19) & 0xFF;

                    if( calculatedChecksum != data[0xBD] ) {
                        alert("This rom does not have a valid checksum. Some information will be displayed incorrectly.");
                    }

                    this.$emit("file-picked", data);
                });
            });
        }
    },
};
</script>
