<template>
    <div>
        {{gameTitle}}
        {{gameCode}}
        {{makerCode}}
    </div>
</template>

<script>
export default {
    name: 'HeaderInfo',
    data: function () {
        return {
            gameTitle : '',
            gameCode : '',
            makerCode : ''
        }
    },
    props: {
        rom : Buffer
    },
    created: function() {
        for( var i = 0xA0; i <= 0xAB; i++ ) {
            if(this.rom[i] !== 0) {
                this.gameTitle += String.fromCharCode(this.rom[i]);
            }
        }
        this.gameCode = this.rom[0xAC];
        this.makerCode = this.rom[0xB0];
    }
};
</script>
