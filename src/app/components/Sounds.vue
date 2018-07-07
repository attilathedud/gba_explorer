<template>
    <div>
        <div class="centered-horizontal">
            <a v-if="isSearching" class="button is-loading is-large is-text centered-vertical"></a>
        </div>
        <div v-if="!isSearching">
            <p>Sound engine detected at 0x{{toHexString(sappyTableOffset, 8)}}</p>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import sww from 'simple-web-worker';

export default {
    name: 'Sounds',    
    computed: {
        ...mapGetters([
            'rom'
        ])
    },
    data: function() {
        return {
            sappyTableOffset: 0,
            isSearching: false
        }
    },
    methods: {
        scan: function() {
            this.isSearching = true;
            this.worker.postMessage('scan', [this.rom])
                .then(results => {
                    this.sappyTableOffset = results;
                    this.isSearching = false;
                });
        }
    },
    created: function() {
        this.worker = sww.create([
            { 
                message: 'scan', 
                func: function (rom) {
                    //code is taken from GBA Sappy Engine Detector by Bregalad
                    let sappy_signature_old = [
                        0x00, 0xB5, 0x00, 0x04, 0x07, 0x4A, 0x08, 0x49,
                        0x40, 0x0B, 0x40, 0x18, 0x83, 0x88, 0x59, 0x00,
                        0xC9, 0x18, 0x89, 0x00, 0x89, 0x18, 0x0A, 0x68,
                        0x01, 0x68, 0x10, 0x1C, 0x00, 0xF0
                    ];

                    let sappy_signature_new = [
                        0x00, 0xB5, 0x00, 0x04, 0x07, 0x4B, 0x08, 0x49,
                        0x40, 0x0B, 0x40, 0x18, 0x82, 0x88, 0x51, 0x00,
                        0x89, 0x18, 0x89, 0x00, 0xC9, 0x18, 0x0A, 0x68,
                        0x01, 0x68, 0x10, 0x1C, 0x00, 0xF0
                    ];

                    let selectSongOffset = 0;
                    let matchScore = 0;

                    for( let i = 0; i < rom.byteLength; i++ ) {
                        matchScore = 0;

                        for( let j = 0; j < sappy_signature_old.length; j++ ) {
                            if( sappy_signature_old[j] == rom[i+j] ) {
                                matchScore++;
                            }
                        }

                        if( matchScore == sappy_signature_old.length ) {
                            selectSongOffset = i;
                            break;
                        }

                        matchScore = 0;

                        for( let j = 0; j < sappy_signature_new.length; j++ ) {
                            if( sappy_signature_new[j] == rom[i+j] ) {
                                matchScore++;
                            }
                        }

                        if( matchScore == sappy_signature_new.length ) {
                            selectSongOffset = i;
                            break;
                        }
                    }

                    let sappyTableOffset = selectSongOffset - 1;
                    while( sappyTableOffset > 0 && sappyTableOffset > selectSongOffset - 0x20 ) {
                        if( rom[sappyTableOffset] == 0x00 && rom[sappyTableOffset+1] == 0xB5 ) {
                            break;
                        }
                        sappyTableOffset--;
                    }

                    return sappyTableOffset;
                }
            }
        ]);

        this.scan();
    }
};
</script>
