<template>
    <article class="media box">
    <figure class="media-left">
        <span class="icon is-large">
            <i class="fas fa-3x fa-gamepad"></i>
        </span>
    </figure>
    <div class="media-content">
        <div class="content">
            <h3 class="is-size-3 has-text-dark">Start Exploring!</h3>
            <p class="has-text-dark">Please choose a .gba file to explore.</p>
            <div class="centered-horizontal">
                <button class="button is-primary is-medium choose-file-button" v-on:click="chooseFile">Choose</button>
            </div>
        </div>
    </div>
    </article>
</template>

<script>
const dialog = require('electron').remote.dialog;
const fs = require('fs');

export default {
    name: 'FileSelector',
    methods: {
        chooseFile() {
            dialog.showOpenDialog((files) => {
                if( files === undefined ) {
                    return;
                }

                fs.readFile(files[0], (err, data) => {
                    if(err){
                        console.log(err);
                        return;
                    }

                    this.$emit('file-picked', data);
                });
            });
        }
    },
    created: function() {
        //todo: if we are in a dev env, hardcode the opening
        fs.readFile(process.cwd() + "/roms/zelda.gba", (err, data) => {
            if(err){
                console.log(err);
                return;
            }

            this.$emit('file-picked', data);
        });
    }
};
</script>
