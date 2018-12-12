# GBA Explorer

Explore GameBoy Advanced ROMs and see and hear all their data, text, graphics, and sounds. 
![Hero screenshot](/promos/hero.png?raw=true "Compressed image viewing")

## Header
View the ROM entry point, debugging information, game title, code, and version. This can be used to see what particular version of a game you have.
![Header screenshot](/promos/header.png?raw=true "Header section")

## Hexview
View the raw data of the ROM. Search by offset, byte sequence, and ascii text supported.
![Hexview screenshot](/promos/hexview.png?raw=true "Hexview section")

## Strings
By searching for known text strings, you can generate an alphabetic map to dump large sections of undecoded text from the game. 
![Strings screenshot](/promos/strings.png?raw=true "Strings section")

## Graphics
View the compressed and uncompressed graphics on the rom to see backgrounds and sprite maps. Supports zoom and tile shifting.
![Graphics screenshot](/promos/graphics.png?raw=true "Graphics section")

## Sounds
On games that implement the sappy soundengine, you can listen to their tracks and sounds.

## Development
This is an electron application built with Vue and Bulma. It functions as an SPA. The decompression code for graphics uses a large amount of code from Nintenlord's work modified to work in Javascript. The decompression code for sound is strongly based on the GBA Sappy Engine Detector by Bregalad.

