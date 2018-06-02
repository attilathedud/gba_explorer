<template>
    <div>
        <button v-on:click="chooseFile">Choose</button>
    </div>
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
    }
};
</script>
