<template>
    <div>
        <div 
        v-if="showErrorInvalidDictionary" 
        class="notification is-danger">
        <button 
            class="delete" 
            @click="showErrorInvalidDictionary=false" />
        This appears to be an invalid mapping. Try another match.
        </div>
  <div class="dictionary-container">
    <h1 v-if="uppercaseMappings.length > 0">UPPER</h1>
    <div 
      v-for="letter in uppercaseMappings" 
      :key="letter.id" 
      class="box letter-box has-text-dark" 
      @click="editDictionaryItem(letter[0], toHexString(letter[1][0], 2) + '' + toHexString(letter[1][1], 2))">
      <span>{{ letter[0] }}</span><br>
      <span>{{ toHexString(letter[1][0], 2) + "" + toHexString(letter[1][1], 2) }}</span>
    </div>
    <h1 v-if="lowercaseMappings.length > 0">LOWER</h1>
    <div 
      v-for="letter in lowercaseMappings" 
      :key="letter.id" 
      class="box letter-box has-text-dark" 
      @click="editDictionaryItem(letter[0], toHexString(letter[1][0], 2) + '' + toHexString(letter[1][1], 2))">
      <span>{{ letter[0] }}</span><br>
      <span>{{ toHexString(letter[1][0], 2) + "" + toHexString(letter[1][1], 2) }}</span>
    </div>
    <h1 v-if="symbolMappings.length > 0">SYMBOLS</h1>
    <div 
      v-for="letter in symbolMappings" 
      :key="letter.id" 
      class="box letter-box has-text-dark" 
      @click="editDictionaryItem(letter[0], toHexString(letter[1][0], 2) + '' + toHexString(letter[1][1], 2))">
      <span>{{ letter[0] }}</span><br>
      <span>{{ toHexString(letter[1][0], 2) + "" + toHexString(letter[1][1], 2) }}</span>
    </div>
    <h1>&nbsp;</h1>
    <div 
      class="box letter-box has-text-dark" 
      @click="toggleDictionaryPanel()">
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
          <div 
            v-if="showErrorOnAdd" 
            class="notification is-danger">
            <button 
              class="delete" 
              @click="showErrorOnAdd=false" />
            Error adding the mapping. Ensure there is only one letter and two hex bytes.
          </div>
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
                @click="toggleDictionaryPanel()">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <button 
        class="modal-close is-large" 
        aria-label="close" 
        @click="toggleDictionaryPanel()" />
    </div>
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
            uppercaseMappings: [],
            lowercaseMappings: [],
            symbolMappings: [],
            isAddingEntry: false,
            addedLetter: "",
            addedBytePair: "",
            showErrorOnAdd: false,
            showErrorInvalidDictionary: false
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
        this.createSortedMappings();
    },
    methods : {
        ...mapMutations([
            "addTextBytePair"
        ]),
        createSortedMappings: function() {
            let previousMatches = [];

            this.showErrorInvalidDictionary = false;

            this.uppercaseMappings = [];
            this.lowercaseMappings = [];
            this.symbolMappings = [];

            for( var key in this.textAsByte ) {
                previousMatches.forEach(m => (m[0] == this.textAsByte[key][0] && m[1] == this.textAsByte[key][1]) ? this.showErrorInvalidDictionary = true : 0);
                previousMatches.push(this.textAsByte[key]);

                if( key == key.toUpperCase() && key != key.toLowerCase() ) {
                    this.uppercaseMappings.push([key , this.textAsByte[key]]);
                }
                else if( key == key.toLowerCase() && key != key.toUpperCase() ) {
                    this.lowercaseMappings.push([key , this.textAsByte[key]]);
                }
                else {
                    this.symbolMappings.push([key , this.textAsByte[key]]);
                }
            }

            this.uppercaseMappings.sort();
            this.lowercaseMappings.sort();
            this.symbolMappings.sort();
        },
        toggleDictionaryPanel: function() {
            this.addedLetter = "";
            this.addedBytePair = "";

            this.isAddingEntry = !this.isAddingEntry;
        },
        editDictionaryItem: function(letter, byte) {
            this.toggleDictionaryPanel();
            this.addedLetter = letter;
            this.addedBytePair = byte;
        },
        addDictionaryItem: function() {
            let possibleBytePair = this.addedBytePair.replace(/ /g, "");

            this.showErrorOnAdd = false;

            if( this.addedLetter.length != 1 || possibleBytePair.length != 4 ) {
                this.showErrorOnAdd = true;
                return;
            }

            this.addTextBytePair({"text" : this.addedLetter, 
                "byte" : [this.getHex(possibleBytePair.substr(0, 2)), this.getHex(possibleBytePair.substr(2, 2))]});

            this.toggleDictionaryPanel();

            this.createSortedMappings();
            this.$emit("item-added");
        }
    }
};
</script>
