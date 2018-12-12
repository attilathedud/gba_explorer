<template>
  <div>
    <h2 class="title">
      General
    </h2>
    <p>
      GBA Explorer allows you to view the hex data, strings, graphics, and sound files of GBA roms. No modifications are made to the file provided. 
    </p>
    <br>
    <h2 class="title">
      Navigation
    </h2>
    <p>
      Sections with scrolling can be navigated using either scrolling or via the arrow keys. 
    </p>
    <br>
    <h2 class="title">
      Code
    </h2>
    <p>
      The source code for this program is available <a href="https://www.github.com/attilathedud/gba_explorer">
        here.
      </a> It is an Electron application that uses Vue. It is written by attilathedud and licensed under the Apache License. 
    </p>
    <br>
    <p>
      The decompression code for graphics uses a large amount of code from Nintenlord's work modified to work in Javascript. 
    </p>
    <br>
    <p>
      The decompression code for sound is strongly based on the GBA Sappy Engine Detector by Bregalad. 
    </p>
    <br>
    <p>
      Icons made by <a 
        href="https://www.freepik.com/" 
        title="Freepik"
      >
        Freepik
      </a> from <a
        href="https://www.flaticon.com/" 
        title="Flaticon"
      >
        www.flaticon.com
      </a> is licensed by <a 
        href="http://creativecommons.org/licenses/by/3.0/" 
        title="Creative Commons BY 3.0" 
        target="_blank"
      >
        CC 3.0 BY
      </a>
    </p>
  </div>
</template>

<script>
export default {
    name: "About"
};
</script>
