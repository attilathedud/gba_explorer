<template>
    <div>
        <div class="centered-horizontal">
            <a v-if="isSearching" class="button is-loading is-large is-text centered-vertical"></a>
        </div>
        <div v-if="!isSearching">
            <div v-if="sappyTableOffset == -1">
                <p>No sound engine found</p>
            </div>
            <div v-else>
                <p>Sound engine detected at 0x{{toHexString(sappyTableOffset, 8)}}</p>
                <p>Song table detected at 0x{{toHexString(songTableOffset, 8)}}</p>
                <p>Song levels {{songLevels}}</p>
                <p>Polyphony: {{polyphony}}, Main Volume: {{mainVolume}}, Sampling Rate Index: {{samplingRateLookup[samplingRateIndex]}}, 
                    dac: {{dacBits}} bits</p>
                <br>

                <div class="columns">
                    <div class="column is-one-quarter offset-table">
                        <table class="table is-striped is-narrow is-hoverable">
                            <thead></thead>
                            <tbody>
                                <tr v-for="song in songList" v-bind:key="song.id" v-on:click="dumpTrack(song)" :class="{'is-selected':song == songSelected}">
                                    <td>{{toHexString(song, 8)}}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="column">
                        <Player v-bind:songData="songSelectedData"></Player>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Track from '../midi/track.js';
import Player from './sounds/Player.vue';

import { mapGetters } from 'vuex';
import sww from 'simple-web-worker';

export default {
    name: 'Sounds',
    components: {
        Player
    },
    computed: {
        ...mapGetters([
            'rom'
        ])
    },
    data: function() {
        return {
            isSearching: false,
            songSelected: 0,
            songSelectedData: new Uint8Array(),
            sappyTableOffset: 0,
            songTableOffset: 0,
            songLevels: 0,
            polyphony : 0,
            mainVolume : 0,
            samplingRateIndex : 0,
            dacBits : 0,
            songList : [],
            samplingRateLookup: [
                "invalid", "5734 Hz", "7884 Hz", "10512 Hz", "13379 Hz", "15768 Hz", "18157 Hz",
                "21024 Hz", "26758 Hz", "31536 Hz", "36314 Hz", "40137 Hz", "42048 Hz", "invalid", "invalid", "invalid"
            ],
            track: {}
        }
    },
    methods: {
        scan: function() {
            this.isSearching = true;
            this.worker.postMessage('scan', [this.rom])
                .then(results => {
                    this.sappyTableOffset = results.sappyTableOffset;
                    this.songTableOffset = results.songTableOffset;
                    this.songLevels = results.songLevels;
                    this.polyphony = results.polyphony;
                    this.mainVolume = results.mainVolume;
                    this.samplingRateIndex = results.samplingRateIndex;
                    this.dacBits = results.dacBits;
                    this.songList = results.songList;

                    this.isSearching = false;
                });
        },
        dumpTrack: function(offset) {
            this.songSelected = offset;
            this.songSelectedData = this.track.dumpTrack(offset);
        }
    },
    created: function() {
        this.worker = sww.create([
            { 
                message: 'scan', 
                func: function (rom) {
                    function toHexString(number, padding) {
                        return Number(number).toString(16).toUpperCase().padStart(padding, '0')
                    }

                    function reverseIndianness(offset) {
                        //use Buffer read functions
                        return parseInt(toHexString(rom[offset+3],2) + toHexString(rom[offset+2],2) + toHexString(rom[offset+1],2) + toHexString(rom[offset],2), 16);
                    }

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

                    if( selectSongOffset === 0 ) {
                        return {'sappyTableOffset' : -1};
                    }

                    let sappyTableOffset = selectSongOffset - 1;
                    while( sappyTableOffset > 0 && sappyTableOffset > selectSongOffset - 0x20 ) {
                        if( rom[sappyTableOffset] == 0x00 && rom[sappyTableOffset+1] == 0xB5 ) {
                            break;
                        }
                        sappyTableOffset--;
                    }

                    let offset = sappyTableOffset - 16;

                    let data0 = reverseIndianness(offset);
                    let data1 = reverseIndianness(offset + 4);
                    let data2 = reverseIndianness(offset + 8);

                    let songTableOffset = (data2 & 0x3FFFFFF) + 12 * data1;

                    let polyphony = (data0 & 0x000F00) >> 8;
                    let mainVolume = (data0 & 0x00F000) >> 12;
                    let samplingRateIndex = (data0 & 0x0F0000) >> 16;
                    let dacBits = ((data0 & 0xF00000) >> 20);

                    let songList = [];
                    let streamPointer = songTableOffset;

                    let songPointer = 0;
                    do {
                        songPointer = reverseIndianness(streamPointer) - 0x8000000;
                        songList.push(songPointer);
                        streamPointer += 4;
                        streamPointer += 4;
                    } while( songPointer != 0 && songPointer < rom.byteLength );

                    return {
                        'sappyTableOffset' : sappyTableOffset, 
                        'songLevels' : data1, 
                        'songTableOffset' : songTableOffset,
                        'polyphony' : polyphony,
                        'mainVolume' : mainVolume,
                        'samplingRateIndex' : samplingRateIndex,
                        'dacBits' : dacBits,
                        'songList' : songList
                    };
                }
            }
        ]);

        this.track = new Track(this.rom);
        this.scan();
    }
};
</script>
