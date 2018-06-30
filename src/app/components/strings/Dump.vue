<template>
    <div>
        <div class="field">
            <label class="label">Start Address</label>
            <div class="control">
                <input class="input" type="text" v-model="startAddress">
            </div>
        </div>
        <div class="field">
            <label class="label">End Address</label>
            <div class="control">
                <input class="input" type="text" v-model="endAddress">
            </div>
        </div>
        <div class="field">
            <div class="control">
                <button class="button" v-on:click="dump" :class="{'is-loading':isDumping}">Dump</button>
            </div>
        </div>
        <div class="field">
            <div class="control">
                <textarea v-model="dumpedStrings" class="textarea"></textarea>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Dump',
    data: function () {
        return {
            startAddress: "",
            endAddress: "",
            dumpedStrings: "",
            isDumping: false
        }
    },
    props: {
        rom : Buffer,
        dictionary: {},
        letterDictionary: {}
    },
    methods: {
        dump: function() {
            let lastByte = -1;
            this.dumpedStrings = "";

            for( const b of this.rom.slice(Number(parseInt(this.startAddress, 16), Number(parseInt(this.endAddress, 16))))) {
                if( lastByte == -1 ) {
                    lastByte = b;
                }
                else {
                    let translated_byte = this.dictionary[[ lastByte, b ]];
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
