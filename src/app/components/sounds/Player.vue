<template>
  <div>
    <div class="centered-container">
      <div class="progress-bar">
        <div 
          :style="{'width': percentBar + '%'}"
          class="progress-bar-percent"
        />
      </div>
    </div>
    <div class="centered-container">
      <div class="sound-icons">
        <span class="icon is-large">
          <i 
            :class="{'fa-play': !isPlaying, 'fa-pause': isPlaying}"
            class="fas fa-2x"
            @click="playOrPauseTrack"
          />
        </span>
        <span class="icon is-large"> 
          <i 
            class="fas fa-2x fa-stop"
            @click="stopTrack"
          />
        </span> 
      </div>
    </div>
  </div>
</template>

<script>
import Soundfont from "soundfont-player";
let MidiPlayer = require("midi-player-js");

export default {
    name: "Player",
    props: {
        songData: {
            type: Uint8Array,
            required: true
        }
    },
    data: function () {
        return {
            player: undefined,
            ac: new AudioContext(),
            percentBar: 0,
            isPlaying: false
        };
    },
    watch: {
        songData: function(newSongData) {
            this.createAndPlay(newSongData); 
        }
    },
    created: function() {
        this.createAndPlay(this.songData);
    },
    destroyed: function () {
        this.stopTrack();
    }, 
    methods: {
        playOrPauseTrack: function() {
            if( this.isPlaying ) {
                this.player.pause();
            }
            else {
                this.player.play();
            }

            this.isPlaying = !this.isPlaying;
        }, 
        stopTrack: function() {
            this.player.stop();
            this.isPlaying = false;
            
            this.percentBar = 0;
        },
        createAndPlay: function(songDataContext) {
            if( this.player ) {
                this.stopTrack();  
            }
           
            let context = this;

            Soundfont.instrument(this.ac, "pad_3_polysynth").then(function (instrument) {
                context.player = new MidiPlayer.Player(function(event) {
                    if (event.name == "Note on") {
                        instrument.play(event.noteName, context.ac.currentTime);
                    }

                    context.percentBar = 100 - context.player.getSongPercentRemaining();
                });

                context.player.loadArrayBuffer(songDataContext);
                context.player.play();
                context.isPlaying = true;
            });  
        }
    } 
};
</script>
