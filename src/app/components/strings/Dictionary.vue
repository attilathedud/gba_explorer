<template>
  <div class="dictionary-container">
    <div 
      v-for="letter in sortedDictionary" 
      :key="letter.id" 
      class="box letter-box has-text-dark" 
      @click="editDictionaryItem(letter[0], toHexString(letter[1][0], 2) + '' + toHexString(letter[1][1], 2))">
      <span>{{ letter[0] }}</span><br>
      <span>{{ toHexString(letter[1][0], 2) + "" + toHexString(letter[1][1], 2) }}</span>
    </div>
    <div 
      class="box letter-box has-text-dark" 
      @click="isAddingEntry = true">
      <span class="icon is-large">
        <i class="fas fa-3x fa-plus" />
      </span>
    </div>
    <div 
      class="modal" 
      :class="{'is-active':isAddingEntry}">
      <div class="modal-background" />
      <div class="modal-content">
        <div class="box">
          <div class="field">
            <label class="label has-text-dark">Letter</label>
            <div class="control">
              <input 
                v-model="addedLetter" 
                class="input" 
                type="text">
            </div>
          </div>
          <div class="field">
            <label class="label has-text-dark">Byte Pair</label>
            <div class="control">
              <input 
                v-model="addedBytePair" 
                class="input" 
                type="text">
            </div>
          </div>
          <div class="field is-grouped">
            <div class="control">
              <button 
                class="button is-primary is-medium" 
                @click="addDictionaryItem">Add</button>
            </div>
            <div class="control">
              <button 
                class="button is-medium" 
                @click="isAddingEntry=false">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <button 
        class="modal-close is-large" 
        aria-label="close" 
        @click="isAddingEntry=false" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { mapMutations } from "vuex";

export default {
    name: "Dictionary",
    data: function() {
        return {
            sortedDictionary: [],
            isAddingEntry: false,
            addedLetter: "",
            addedBytePair: ""
        };
    },
    computed: {
        ...mapGetters([
            "rom",
            "textAsByte",
            "byteAsText"
        ])
    },
    created: function() {
        //todo: flag if selection is invalid dictionary
        this.createSortedList();
    },
    methods : {
        ...mapMutations([
            "addTextBytePair"
        ]),
        createSortedList: function() {
            this.sortedDictionary = [];

            for( var key in this.textAsByte ) {
                this.sortedDictionary.push([key , this.textAsByte[key]]);
            }
            
            this.sortedDictionary.sort();
        },
        editDictionaryItem: function(letter, byte) {
            this.addedLetter = letter;
            this.addedBytePair = byte;
            this.isAddingEntry = true;
        },
        addDictionaryItem: function() {
            //todo remove whitespace
            //todo toggle enabled items when item added
            //todo display error if not correct length
            if( this.addedLetter.length > 1 || this.addedBytePair.length != 4 )
                return;

            this.addTextBytePair({"text" : this.addedLetter, 
                "byte" : [this.getHex(this.addedBytePair.substr(0, 2)), this.getHex(this.addedBytePair.substr(2, 2))]});

            this.isAddingEntry = false;

            this.createSortedList();
        }
    }
};
</script>
