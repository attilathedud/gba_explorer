WIP

checksum:

0BDh - Complement check, 1 Byte
Header checksum, cartridge won't work if incorrect. 

int n;
char c = 0;
unsigned char p[30] = {0x4D,0x45,0x54,0x52,0x4F,0x49,0x44,0x34,0x55,0x53,0x41,0x00,0x41,0x4D,0x54,0x45,0x30,0x31,0x96,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00};

for (n=0; n<0xBc-0xA0; n++)
{
    c += p[n];
}

return -(0x19+c);
