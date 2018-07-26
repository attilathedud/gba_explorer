<template>
    <div>

    </div>
</template>

<script>
import Soundfont from 'soundfont-player';
let MidiPlayer = require('midi-player-js');

let ac = new AudioContext();
var Player;

export default {
    name: 'Player',
    data: function () {
        return {
        }
    },
    props: {
        songData: Uint8Array
    },
    created: function() {
        
    },
    watch: {
        songData: function(newSongData) {
            if( Player )
                Player.stop();

            Soundfont.instrument(ac, 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/acoustic_guitar_nylon-mp3.js').then(function (instrument) {
                Player = new MidiPlayer.Player(function(event) {
                    if (event.name == 'Note on') {
                        instrument.play(event.noteName, ac.currentTime);
                    }
                });

                Player.loadArrayBuffer(newSongData);
                Player.play();
            });
        }
    }
};
</script>