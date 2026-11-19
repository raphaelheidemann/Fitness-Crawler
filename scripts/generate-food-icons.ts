/**
 * Generates a 256x192 (8x6 grid of 32x32) retro RPG 8-bit pixel-art food sprite sheet
 * plus 48 individual 32x32 transparent RGBA PNG files (`food_<name>.png`).
 *
 * Palette is strictly capped at 23 colors (22 opaque + transparent) with thick dark outlines.
 * Run: npx tsx scripts/generate-food-icons.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

type RGBA = [number, number, number, number];

// 22 opaque colors + transparent '.' = 23 total colors (< 24 max)
const PALETTE: Record<string, RGBA> = {
  '.': [0, 0, 0, 0], // Transparent
  _: [0, 0, 0, 0], // Transparent (protected: never filled by automatic outline)
  K: [22, 16, 29, 255], // #16101d Deep dark RPG ink outline
  W: [251, 247, 240, 255], // #fbf7f0 Pure cream white / highlight
  C: [232, 220, 200, 255], // #e8dcc8 Warm cream shadow / crumb
  S: [183, 176, 184, 255], // #b7b0b8 Cool silver / ceramic light
  G: [112, 115, 133, 255], // #707385 Slate metal / glass shadow
  D: [61, 60, 77, 255], // #3d3c4d Dark iron / deep shade
  Y: [255, 225, 77, 255], // #ffe14d Bright golden yellow
  A: [242, 167, 41, 255], // #f2a729 Warm amber gold
  O: [224, 102, 35, 255], // #e06623 Vivid orange / coral
  R: [217, 43, 58, 255], // #d92b3a Crimson red
  M: [143, 29, 44, 255], // #8f1d2c Deep burgundy / meat shadow
  P: [242, 136, 155, 255], // #f2889b Ham / berry pink
  N: [217, 159, 108, 255], // #d99f6c Golden tan / crust light
  B: [166, 99, 54, 255], // #a66336 Baked brown / wood
  Z: [92, 49, 32, 255], // #5c3120 Dark cocoa / roasted brown
  L: [158, 224, 67, 255], // #9ee043 Fresh lime green
  E: [72, 173, 58, 255], // #48ad3a Emerald leaf green
  F: [33, 107, 56, 255], // #216b38 Deep forest green
  I: [140, 226, 247, 255], // #8ce2f7 Ice glass / water light
  U: [50, 136, 217, 255], // #3288d9 Cobalt blue
  V: [139, 69, 201, 255], // #8b45c9 Royal grape purple
  T: [82, 35, 128, 255], // #522380 Deep violet shadow
};

interface IconDef {
  name: string;
  rows: string[];
  outline?: 'full' | 'none';
}

// Each icon is defined on an interior grid (~16..24px) that gets a thick dark outline (`K`)
// and is cleanly centered inside a 32x32 logical canvas with balanced padding (>= 3px edges).
// Note: lowercase 'w'/'s' can be placed if needed? Even cleaner: '.' for normal transparent, '_' for forced no-outline hole/steam gap!
const ICONS: IconDef[] = [
  // Row 0: egg, fried_egg, bread_slice, french_roll, ham_slice, cheese_slice, milk_glass, coffee_cup
  {
    name: 'egg',
    outline: 'full',
    rows: [
      '.......NNNN.......',
      '.....NNWWWWNN.....',
      '....NWWWWCCNNN....',
      '...NWWWWWCCCCNN...',
      '..NWWWWWCCCCCCNB..',
      '..NWWWWCCCCCCCCB..',
      '.NWWWWCCCCCCCCCCB.',
      '.NWWWCCCCCCCCCCCB.',
      '.NWWWCCCCCCCCCCBB.',
      '.NCCCCCCCCCCCCBBB.',
      '.NCCCCCCCCCCCCBBB.',
      '..BCCCCCCCCCCBBB..',
      '..BBCCCCCCCCBBBB..',
      '...BBBBCCCCBBBB...',
      '....BBBBBBBBBB....',
      '......BBBBBB......',
    ],
  },
  {
    name: 'fried_egg',
    outline: 'full',
    rows: [
      '......WWWWWW......',
      '....WWWWWWWWWW....',
      '...WWWWWWWWWWWW...',
      '..WWWWWWYYWWWWWW..',
      '.WWWWWWYYYYWWWWWW.',
      '.WWWWWYYWYYYWWWWW.',
      '.WWWWWYYYYYYWWWWW.',
      'WWWWWWYYYYAAWWWWWW',
      'WWWWWWYAAAAWWWWWWC',
      'WWWWWWWAAAAWWWWWCC',
      '.WWWWWWWWWWWWWWCCC',
      '.CWWWWWWWWWWWWCCCC',
      '..CCWWWWWWWWCCCCC.',
      '....CCCCCCCCCCCC..',
      '......CCCCCCCC....',
    ],
  },
  {
    name: 'bread_slice',
    outline: 'full',
    rows: [
      '....BBBBBBBBBB....',
      '..BNNNNNNNNNNNNB..',
      '.BNNWWWWWWWWWWNNB.',
      'BNWWWWWWWWWWWWWWNB',
      'BNWWWCWWWWWWWWCCNB',
      '.BWWWCWWCWWWWCCNB.',
      '..BWWWWWWWCWWWWB..',
      '..BNWWWCWWWWWWCB..',
      '..BNWWWWWWCWWCCB..',
      '..BNWWCWWWWWWCCB..',
      '..BNWWWWCWWWWCCB..',
      '..BNWWWWWWWWCCCB..',
      '..BNCCCCCCCCCCCB..',
      '..BNNNNCCCCCCCCB..',
      '..BBBBBBBBBBBBBB..',
    ],
  },
  {
    name: 'french_roll',
    outline: 'full',
    rows: [
      '......BBBBBBBB......',
      '....BNNNNNNNNNNB....',
      '..BNNNYYANNNYYANNB..',
      '.BNNYYCCCNNNYYCCNNB.',
      'BNNNCCBBBNNNCCCBBBNN',
      'BNNNCCCCNNNNCCCCNNNB',
      'BNNNNNNNNNNNNNNNNNNB',
      'ANNNNNBNNNNNNNNBNNNB',
      '.BNNNNNNNNNNNNNNNNB.',
      '..BBBBBBBBBBBBBBBB..',
      '....BBBBZZZZBBBB....',
    ],
  },
  {
    name: 'ham_slice',
    outline: 'full',
    rows: [
      '.....MMMMMMMM.....',
      '...MMRRRRRRRRMM...',
      '..MRRPPPPPPPPRRM..',
      '.MRPPPPWWWWPPPPRM.',
      '.MRPPPWWCCWWPPPRM.',
      'MRPPPPPPWWWWPPPPRM',
      'MRPPPPWWPPPPPPPRRM',
      'MRPPPPPWWPPPWWPRRM',
      '.MRRPPPPPPPPPRRRM.',
      '..MMRPPPPPPPRRMM..',
      '...MMMRRRRRRMMM...',
      '.....MMMMMMMM.....',
    ],
  },
  {
    name: 'cheese_slice',
    outline: 'full',
    rows: [
      '..........YYYY....',
      '........YYYYYYAA..',
      '......YYYYAAYYYYY.',
      '....YYYYYAAAYYYYA.',
      '..YYYYYYYYAAYYYYO.',
      '.YYYYAAYYYYYYYYOO.',
      'YYYYAAAAYYYYYAAOO.',
      'YYYYYAAYYYYYAAAAO.',
      'YYYYYYYYYYAAAYYOO.',
      'YYYYAAYYYYYYYYOOO.',
      'AAAOOOOAAAAAAOOOO.',
      'OOOOOOOOOOOOOOOO..',
    ],
  },
  {
    name: 'milk_glass',
    outline: 'full',
    rows: [
      '..IIIIIIIIII..',
      '.IWWWWWWWWCCI.',
      '.IWWWWWWWWCCI.',
      '.IWWWWWWWWCCI.',
      '..IWWWWWWCCI..',
      '..IWWWWWWCCI..',
      '..IWWWWWWCCI..',
      '..IWWWWWCCCI..',
      '..IWWWWWCCCI..',
      '...IWWWCCCI...',
      '...ICCCCCCI...',
      '...ICCCCCSS...',
      '...ISSSSSSS...',
    ],
  },
  {
    name: 'coffee_cup',
    outline: 'full',
    rows: [
      '____W____W______',
      '___W____W_______',
      '____W____W______',
      '________________',
      '.SSSSSSSSSS.....',
      'SWZZZZZZZZWS....',
      'SZZZZBBZZZZSSSS.',
      'SWZZZBBBBZZWS_SS',
      '.SWCCCCCCCCCS__S',
      '.SWCCCCCCCCCS__S',
      '.SWCCCCCCCCSSSS.',
      '..SCCCCCCCCS....',
      '..SSSSSSSSSS....',
      '...GGGGGGGG.....',
    ],
  },

  // Row 1: orange_juice, water_bottle, banana, apple, orange, strawberry, grapes, avocado
  {
    name: 'orange_juice',
    outline: 'full',
    rows: [
      '...........RR...',
      '..........WW....',
      '.........RR.....',
      '.IIIIIIIIWWII...',
      '.IYYYYYYYWWAI...',
      '.IYAAAAAAWOAI...',
      '..IAAAAAAAOI....',
      '..IAAAYAAAOI....',
      '..IAAAAAAOOI....',
      '..IAAAAAAOOI....',
      '...IAAAAOOI.....',
      '...IOOOOOOI.....',
      '...ISSSSSSI.....',
    ],
  },
  {
    name: 'water_bottle',
    outline: 'full',
    rows: [
      '...UUUU...',
      '...UUUU...',
      '....II....',
      '..IIIIII..',
      '.IIWWWWII.',
      '.IIUUUUII.',
      '.IIUUUUII.',
      '.IIIIIIII.',
      '.IWWIIIII.',
      '.IWWIIUUI.',
      '.IIIUUUUI.',
      '.IIUUUUII.',
      '.IIUUUUII.',
      '..IIIIII..',
    ],
  },
  {
    name: 'banana',
    outline: 'full',
    rows: [
      '.............ZZ..',
      '............ZZB..',
      '...........YYA...',
      '..........YYYA...',
      '.........YYYYA...',
      '........YYWYYA...',
      '.......YYWYYYA...',
      '......YYWYYYYA...',
      '.....YYWYYYYA....',
      '...YYYYYYYYAA....',
      '.ZYYYYYYYYAA.....',
      'ZZAAYYYYAAA......',
      '..AAAAAAAA.......',
    ],
  },
  {
    name: 'apple',
    outline: 'full',
    rows: [
      '.......BB.LLLE...',
      '.......BBLLEEE...',
      '...RRRRBB.EEE....',
      '..RRWWRRRRRRRR...',
      '.RRWWWRRRRRRRRM..',
      '.RRWWRRRRRRRRRMM.',
      '.RRRRRRRRRRRRRMM.',
      '.RRRRRRRRRRRRRMM.',
      '.RRRRRRRRRRRRMMM.',
      '..RRRRRRRRRRRMM..',
      '..MRRRRRRRRRMMM..',
      '...MRRRRRRMMMM...',
      '....MMM..MMMM....',
    ],
  },
  {
    name: 'orange',
    outline: 'full',
    rows: [
      '.......LLLE......',
      '......EEEE.......',
      '....OOYYYYOO.....',
      '..OOYYOOOOOOOA...',
      '.OOYOOOOOOOOOOA..',
      '.OOOOOOOOOOOOOOA.',
      '.OOOOOOOOOOOOOAA.',
      '.OOOOOOAOOOOOOAA.',
      '.OOOOOOOOOOOOAAA.',
      '..OOOOOOOOOOAAA..',
      '..AAOOOOOOOAAA...',
      '....AAAAAAAA.....',
    ],
  },
  {
    name: 'strawberry',
    outline: 'full',
    rows: [
      '......LLEEE......',
      '...LLEEEEEEELL...',
      '..RRRRLEEEERRRR..',
      '.RRWRRRRRRRRRRRM.',
      '.RRRYRRRRRYRRRRM.',
      '.RRRRRRYRRRRRRRM.',
      '..RRYRRRRRRYRRMM.',
      '..RRRRRYRRRRRRMM.',
      '...RRRRRRRYRRMM..',
      '...MRRYRRRRRMMM..',
      '....MRRRRYRMMM...',
      '.....MRRRRRMM....',
      '......MMMMMM.....',
    ],
  },
  {
    name: 'grapes',
    outline: 'full',
    rows: [
      '......BBB........',
      '...LLLEEELLL.....',
      '...EEEVVVEEE.....',
      '..VVWVVVVWVVV....',
      '.VVVVVVVVVVTVT...',
      '.VVWVVWVVWVVTTT..',
      '..VVVVVVVVVTTT...',
      '..VVWVVWVVTTTT...',
      '...VVVVVVVTTT....',
      '...TTWVVVTTT.....',
      '....TTVVTTT......',
      '.....TTTTT.......',
    ],
  },
  {
    name: 'avocado',
    outline: 'full',
    rows: [
      '.....FFFFF.......',
      '....FEEEEEFF.....',
      '...FELLLLLEEF....',
      '...FELLLLLLLEF...',
      '..FELLLLLLLLEEF..',
      '..FELLBBBBBLLEEF.',
      '.FELLBNNBBBBLEEF.',
      '.FELLBBNBBBBLEEF.',
      '.FELLBBBBZZBLEEF.',
      '.FEELLBZZZZLEEEF.',
      '..FEELLLLLLEEEF..',
      '..FFEELLLLLEEFF..',
      '...FFFFEEEFFFF...',
    ],
  },

  // Row 2: rice_bowl, beans_bowl, chicken_breast, steak, fish, shrimp, pasta, potato
  {
    name: 'rice_bowl',
    outline: 'full',
    rows: [
      '.............BB.N.',
      '...........BBN.N..',
      '....WWWWWWWW......',
      '..WWWWWWWWWWWC....',
      '.WWWCWWWWWWCWCC...',
      'WWWWWWWWCWCCCCCC..',
      'SSSSSSSSSSSSSSSS..',
      'SUUUUUUUUUUUUUUD..',
      '.SUUUUUUUUUUUUD...',
      '.SUUWWUUUUUUUDD...',
      '..SDDDDDDDDDDD....',
      '....DDDDDDDD......',
    ],
  },
  {
    name: 'beans_bowl',
    outline: 'full',
    rows: [
      '....BBBBZZBBB.....',
      '..BBZZBBZZBBZZB...',
      '.BZNNZZBBZZNNZZB..',
      'BZZBBZZNNZZBBZZZB.',
      'CCCCCCCCCCCCCCCC..',
      'CNNNNNNNNNNNNNNB..',
      '.CNNNNNNNNNNNNB...',
      '.CNNWWNNNNNNNBB...',
      '..BBBBBBBBBBBB....',
      '....ZZZZZZZZ......',
    ],
  },
  {
    name: 'chicken_breast',
    outline: 'full',
    rows: [
      '.....CCCCCCCC.....',
      '...CCWWWWCCCCCC...',
      '..CCWWCCCBCCCCCC..',
      '.CCCCCCBBCCCBCCCC.',
      '.CCCCBBCCCBBCCCCCN',
      '..CCCCCCCBBCCCCCNN',
      '...CCCCCCCNNCCNNNB',
      '....CCNNNNNNNNNNB.',
      '.....NNNNNNNNNNB..',
      '.......BBBBBBB....',
    ],
  },
  {
    name: 'steak',
    outline: 'full',
    rows: [
      '.....BBBBBBBBBB....',
      '...BBRRRRRRRRRMMB..',
      '..BRRWWWRRRRRRRMMB.',
      '.BRRWWWWWWWRRRRRMMB',
      'BRRRRWWWWWWMMRRRMMB',
      'BRRMMMMRRMMMMMRRMMB',
      'BRRRRRRRRRRMMMMMMB.',
      '.BMMMMWWMMMMMMBBB..',
      '..BBBBZZZZZZBBBB...',
    ],
  },
  {
    name: 'fish',
    outline: 'full',
    rows: [
      '.......UUU.........',
      '.....UUUUUU........',
      '...IIUUUUUUUU....II',
      '..IWWUUUUUUUUG..IIU',
      '.IWKWWUUUUUUUGGIIUU',
      'IIWWWWUUSSSSGGGIUUU',
      '.ISSSSSSSGGGGGGIIUU',
      '..SSSSSSSSGG....II.',
      '....GGGGGG.........',
      '......GG...........',
    ],
  },
  {
    name: 'shrimp',
    outline: 'full',
    rows: [
      '.....OOOOOO......',
      '...OOWWOOOOOO....',
      '..OOWWOORROOOO...',
      '.OOWOORROOOOOR...',
      '.OOOOORRO..ORRO..',
      '.OOOOOO....PPPR..',
      '..OOOOO...PPPRR..',
      '...OOOO....MPP...',
      '....RRRR.........',
      '.....MM..........',
    ],
  },
  {
    name: 'pasta',
    outline: 'full',
    rows: [
      '......RRRR.......',
      '....RRLLRMRL.....',
      '...YYYYYYYYYY....',
      '..YYAYYYAYYYAA...',
      '.YYYYAYYYAYYYAA..',
      'WWWWWWWWWWWWWWWW.',
      'SWWWWWWWWWWWWWWS.',
      '.SSSSSSSSSSSSSS..',
      '..GGGGGGGGGGGG...',
    ],
  },
  {
    name: 'potato',
    outline: 'full',
    rows: [
      '.....BBBBBBB.....',
      '...BNNNNNNNNNB...',
      '..NNWWNNNNNNNNB..',
      '.NNWNNNNZNNNNNNB.',
      '.NNNNNNNNNNNNZNB.',
      '.NNZNNNNNNNNNNNB.',
      '..NNNNNNNNNZNNB..',
      '...BBBBBBBBBBB...',
      '....ZZZZZZZZZ....',
    ],
  },

  // Row 3: sweet_potato, broccoli, carrot, tomato, lettuce, oats_bowl, yogurt_cup, whey_shaker
  {
    name: 'sweet_potato',
    outline: 'full',
    rows: [
      '..........MMMV...',
      '........MMMVVVT..',
      '......MMMVVVTTT..',
      '....MMMVVVTTT....',
      '...MMVVVTTTT.....',
      '..OOOOAVTTT......',
      '.OOYYOOAT........',
      '.OOOOOA..........',
      '..OOOO...........',
    ],
  },
  {
    name: 'broccoli',
    outline: 'full',
    rows: [
      '....LLLEEELL.....',
      '..LLLLLEEELLLL...',
      '.LLLLEEEEEELLLE..',
      '.LLEEEEEEEEEEFF..',
      '.EEEEEEEEEEFFFF..',
      '..FFEELFFELLFF...',
      '....FFLLLEFF.....',
      '.....LLLEEE......',
      '.....LLLEEF......',
      '.....LLLEEF......',
      '......EEEE.......',
    ],
  },
  {
    name: 'carrot',
    outline: 'full',
    rows: [
      '..........LL.EE..',
      '.........LLLEEE..',
      '........OOOOEE...',
      '.......OYYOOO....',
      '......OOOOOR.....',
      '.....OOYYOO......',
      '....OOOOOR.......',
      '...OOOOOR........',
      '..OOORRR.........',
      '.OOOR............',
      '.OR..............',
    ],
  },
  {
    name: 'tomato',
    outline: 'full',
    rows: [
      '......LL.EE......',
      '....LLLLEEELL....',
      '...RRRRLEERRRR...',
      '..RRWWRRRRRRRRM..',
      '.RRWWWRRRRRRRRMM.',
      '.RRRRRRRRRRRRRMM.',
      '.RRRRRRRRRRRRRMM.',
      '.RRRRRRRRRRRRMMM.',
      '..MRRRRRRRRRRMM..',
      '...MMMMMMMMMMM...',
    ],
  },
  {
    name: 'lettuce',
    outline: 'full',
    rows: [
      '...LLLL..LLLL....',
      '..LLLEELLLEELL...',
      '.LLLLEEEEEELLEEF.',
      '.LLEEELLLEEEEEEF.',
      'LLLEEELEEEEEEEEFF',
      'EEEELLLEEEEEEEFFF',
      '.EEEEEELLEEEFFFF.',
      '..FFFFEEEEEEFFF..',
      '....FFFFFFFFFF...',
    ],
  },
  {
    name: 'oats_bowl',
    outline: 'full',
    rows: [
      '.....CCWWCC......',
      '...CCRRCCYYCC....',
      '..CCNNCCCCCCCNN..',
      '.BCCCCCCCCCCCCCB.',
      'BBBBBBBBBBBBBBBB.',
      'BNNNNNNNNNNNNNNZ.',
      '.BNNNNNNNNNNNNZ..',
      '..BBBBBBBBBBBB...',
      '....ZZZZZZZZ.....',
    ],
  },
  {
    name: 'yogurt_cup',
    outline: 'full',
    rows: [
      '..PPPPPPPPPPPPP.',
      '.SSSSSSSSSSSPP..',
      '.WWWWWWWWWWW....',
      '..WWWWWWWWW.....',
      '..WWUUUUUWW.....',
      '..WWUPPPUWW.....',
      '..WWUUUUUWW.....',
      '...WWWWWWW......',
      '...WCCCCCW......',
      '...CCCCCCSS.....',
    ],
  },
  {
    name: 'whey_shaker',
    outline: 'full',
    rows: [
      '...UU..UUU....',
      '...UU..UUUU...',
      '..UUUUUUUUUU..',
      '.DDDDDDDDDDDD.',
      '.DDDDDDDDDDDD.',
      '..SSIIIIIIIS..',
      '..SSWWWWWWIS..',
      '..SSWUUUUWIS..',
      '..SSWUUUUWIS..',
      '..SSWWWWWWIS..',
      '..SSIIIIIIIS..',
      '..SSGGGGGGGS..',
      '...GGGGGGGG...',
    ],
  },

  // Row 4: protein_bar, peanut_butter_jar, nuts, olive_oil_bottle, honey_jar, chocolate_bar, cookie, ice_cream
  {
    name: 'protein_bar',
    outline: 'full',
    rows: [
      '.........BBBBBB..',
      '.......BBNNNNNNB.',
      '......BNNNZZNNNB.',
      '....SSSSNNNNNNB..',
      '...SUUUUUZZZZB...',
      '..SUUUUUUUZZB....',
      '.SUUUUUUUUUB.....',
      'SUUUUUUUUUB......',
      'SDDDDDDDDB.......',
    ],
  },
  {
    name: 'peanut_butter_jar',
    outline: 'full',
    rows: [
      '..RRRRRRRRR..',
      '..MMMMMMMMM..',
      '.BNNNNNNNNNB.',
      '.BNNNNNNNNNB.',
      '.BCCCCCCCCCB.',
      '.BCCNNNNNCCB.',
      '.BCCCCCCCCCB.',
      '.BNNNNNNNNNB.',
      '.BNNNNABBBBN.',
      '..BBBBBBBBB..',
    ],
  },
  {
    name: 'nuts',
    outline: 'full',
    rows: [
      '....BB....NNN....',
      '..BNNNB..NNWNN...',
      '.BNNWNNB.NNNNNB..',
      '.BNNNNNBKNNNNNB..',
      '..BNNNBKAAANNB...',
      '...BBBKAAAAAAAB..',
      '..ZZZZKAAZZAAAB..',
      '.ZBBBBZKAAZZZAB..',
      '..ZZZZZ..BBBB....',
    ],
  },
  {
    name: 'olive_oil_bottle',
    outline: 'full',
    rows: [
      '....NN....',
      '....BB....',
      '....EE....',
      '....EE....',
      '...LEEF...',
      '..LEEEFF..',
      '.LEEYEEFF.',
      '.LEEYEEFF.',
      '.LEEYAEFF.',
      '.LEEEEEEF.',
      '.LEEEEEEF.',
      '.EFFFFFFF.',
      '..FFFFFF..',
    ],
  },
  {
    name: 'honey_jar',
    outline: 'full',
    rows: [
      '..CCCCCCCC..',
      '..NCCCCCCB..',
      '...YYYYYY...',
      '.YYYYYYYYAA.',
      'YYWWYYYYYYAA',
      'YYWYYYYAAAAO',
      'YYYYYYYYAAAO',
      'YYYYAAAAAOAO',
      '.YYAAAAAAAA.',
      '..OOOOOOOO..',
    ],
  },
  {
    name: 'chocolate_bar',
    outline: 'full',
    rows: [
      '......ZZKZZ..',
      '.....ZBNKZBN.',
      '....ZZZKZZZK.',
      '...ZBNKZBNK..',
      '..SSSSZZZK...',
      '.SWWWSSSS....',
      '.SRRRRRS.....',
      'SRRRRRRS.....',
      'SMMMMMMS.....',
    ],
  },
  {
    name: 'cookie',
    outline: 'full',
    rows: [
      '....NNNNNN....',
      '..NNWWNNNNNB..',
      '.NNZZNNNNZZNB.',
      '.NNNNNNNNNNNB.',
      'NNNZZNNZZNNNNB',
      'NNNNNNNNNNNNBB',
      'NNZZNNNNZZNNBB',
      '.NNNNNNNNNNBB.',
      '..BBBBZZBBBB..',
      '....BBBBBB....',
    ],
  },
  {
    name: 'ice_cream',
    outline: 'full',
    rows: [
      '.....RR.....',
      '...WWWWW....',
      '..WWWWWWCC..',
      '..PPPPPPPP..',
      '.PPPPPPPPMM.',
      '..NNNNNNNN..',
      '..NBNNBNNB..',
      '...NBNBNB...',
      '...BNNNNB...',
      '....NBBN....',
      '....BBBB....',
      '.....BB.....',
    ],
  },

  // Row 5: pizza_slice, burger, soda_can, beer, sandwich, salad_bowl, soup, cake_slice
  {
    name: 'pizza_slice',
    outline: 'full',
    rows: [
      '..BBBBBBBBBB....',
      '..NNNNNNNNNNB...',
      '...YYYYRRYYYY...',
      '...YYYRRYAYYY...',
      '....YYYYYYYY....',
      '....YYYRRAYY....',
      '.....YYRRAY.....',
      '.....YYYYY......',
      '......RRY.......',
      '......YY........',
      '.......A........',
    ],
  },
  {
    name: 'burger',
    outline: 'full',
    rows: [
      '....NNNNNNNN....',
      '..NNWNNWNNWNNB..',
      '.NNNNNNNNNNNNBB.',
      '.LLLLLEEEELLLLL.',
      '..YYYYYYYYYYYY..',
      '.ZZZZZBBBBZZZZZ.',
      '.RRRRRRRRRRRRRR.',
      '..NNNNNNNNNNNN..',
      '...BBBBBBBBBB...',
    ],
  },
  {
    name: 'soda_can',
    outline: 'full',
    rows: [
      '..SSSSSS..',
      '.SWWWWWWS.',
      '.SRRRRRRS.',
      '.SRRWWRRS.',
      '.SRWWRRRS.',
      '.SRRRRWWRS',
      '.SRRRRRRRS',
      '.SRRRRRRMS',
      '.SRRRRRRMS',
      '.SMMMMMMMS',
      '.GGGGGGGG.',
    ],
  },
  {
    name: 'beer',
    outline: 'full',
    rows: [
      '.WWWWWWWW.....',
      'WWWWWWWWWW....',
      'WWWCCCCWWW....',
      '.SYYYYYYYSSSS.',
      '.SYYWWYYYS__SS',
      '.SYAAAAAYS___S',
      '.SYAAAAAYS___S',
      '.SYAAAAAYSS__S',
      '.SAAAAAAASSSS.',
      '.SOOOOOOOS....',
      '..GGGGGGG.....',
    ],
  },
  {
    name: 'sandwich',
    outline: 'full',
    rows: [
      '........BBBB....',
      '......BBCCCCBB..',
      '....BBCCCCCCCCB.',
      '..BBCCCCCCCCCCCB',
      '.LLLLLEEEELLLLLL',
      '.RRRRRRRRRRRRRRR',
      '.YYYYYYYYYYYYYYY',
      '.PPPPPPPPPPPPPPP',
      '..BBBBBBBBBBBBBB',
    ],
  },
  {
    name: 'salad_bowl',
    outline: 'full',
    rows: [
      '...LLLLEELLLL...',
      '..LLRRLLEEOOLL..',
      '.LEELLYYEELRREE.',
      'BBBBBBBBBBBBBBBB',
      'BNNNNNNNNNNNNNNZ',
      '.BNNNNNNNNNNNNZ.',
      '..BBBBBBBBBBBB..',
      '....ZZZZZZZZ....',
    ],
  },
  {
    name: 'soup',
    outline: 'full',
    rows: [
      '____W____W______',
      '___W____W_______',
      '________________',
      '..OOOOOOOOOOOO..',
      '.OOYYAALOOAOWOO.',
      'WWWWWWWWWWWWWWWW',
      'SRRRRRRRRRRRRRRS',
      '.SRRRRRRRRRRRRS.',
      '..MMMMMMMMMMMM..',
      '....GGGGGGGG....',
    ],
  },
  {
    name: 'cake_slice',
    outline: 'full',
    rows: [
      '.......RR.......',
      '......RWRR......',
      '....WWWWWWWW....',
      '..WWWWWWWWWWWW..',
      '.WWWWWWWWWWWWWC.',
      '.NNNNNNNNNNNNNB.',
      '.RRRRRRRRRRRRRM.',
      '.NNNNNNNNNNNNNB.',
      '.ZZZZZZZZZZZZZZ.',
    ],
  },
];

if (ICONS.length !== 48) {
  throw new Error(`Expected 48 icons, got ${ICONS.length}`);
}

type Grid = RGBA[][];

function makeGrid(w: number, h: number): Grid {
  return Array.from({ length: h }, () =>
    Array.from({ length: w }, (): RGBA => [0, 0, 0, 0])
  );
}

/**
 * Renders an ASCII grid into a centered 32x32 RGBA pixel matrix,
 * adding a thick dark outline (`K`) around non-transparent pixels.
 * Pixels marked `_` in source are treated as protected transparent gaps (never overwritten by outline).
 */
function renderIcon32(def: IconDef): Grid {
  const srcH = def.rows.length;
  const srcW = Math.max(...def.rows.map((r) => r.length));

  const base = makeGrid(srcW + 4, srcH + 4);
  const protectedEmpty: boolean[][] = Array.from({ length: srcH + 4 }, () =>
    Array(srcW + 4).fill(false)
  );

  for (let y = 0; y < srcH; y++) {
    const row = def.rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '_') {
        protectedEmpty[y + 2][x + 2] = true;
        continue;
      }
      const rgba = PALETTE[ch];
      if (!rgba) {
        throw new Error(`Unknown palette key '${ch}' in icon '${def.name}'`);
      }
      base[y + 2][x + 2] = [...rgba];
    }
  }

  // Apply thick dark outline (8-connected so outlines look bold and chunky like SNES RPG inventory icons)
  const outlined = makeGrid(srcW + 4, srcH + 4);
  const dark = PALETTE.K;
  for (let y = 0; y < base.length; y++) {
    for (let x = 0; x < base[0].length; x++) {
      if (base[y][x][3] > 0) {
        outlined[y][x] = base[y][x];
        continue;
      }
      if (protectedEmpty[y][x]) {
        continue;
      }
      if (def.outline !== 'none') {
        let nearOpaque = false;
        for (let dy = -1; dy <= 1 && !nearOpaque; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < base.length && nx >= 0 && nx < base[0].length) {
              if (base[ny][nx][3] > 0 && !protectedEmpty[ny][nx]) {
                nearOpaque = true;
                break;
              }
            }
          }
        }
        if (nearOpaque) {
          outlined[y][x] = [...dark];
        }
      }
    }
  }

  // Find tight bounding box
  let minX = outlined[0].length;
  let minY = outlined.length;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < outlined.length; y++) {
    for (let x = 0; x < outlined[0].length; x++) {
      if (outlined[y][x][3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const contentW = maxX - minX + 1;
  const contentH = maxY - minY + 1;
  if (contentW > 28 || contentH > 28) {
    throw new Error(
      `Icon '${def.name}' (${contentW}x${contentH}) is too large to keep >= 2px padding in 32x32`
    );
  }

  const out = makeGrid(32, 32);
  const offsetX = Math.floor((32 - contentW) / 2);
  const offsetY = Math.floor((32 - contentH) / 2);

  for (let y = 0; y < contentH; y++) {
    for (let x = 0; x < contentW; x++) {
      out[offsetY + y][offsetX + x] = [...outlined[minY + y][minX + x]];
    }
  }
  return out;
}

// --- Zero-dependency PNG encoder (RGBA color type 6) ---
const CRC_TABLE = (() => {
  const tbl = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tbl[n] = c >>> 0;
  }
  return tbl;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(grid: Grid): Buffer {
  const height = grid.length;
  const width = grid[0].length;
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = grid[y][x];
      const idx = rowStart + 1 + x * 4;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function main() {
  const outDir = path.resolve(process.cwd(), 'src/assets/foods');
  fs.mkdirSync(outDir, { recursive: true });

  const cols = 8;
  const rows = 6;
  const cell = 32;
  const sheet = makeGrid(cols * cell, rows * cell);

  const uniqueColors = new Set<string>();

  ICONS.forEach((def, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const iconGrid = renderIcon32(def);

    // Track colors & copy into sprite sheet
    for (let y = 0; y < cell; y++) {
      for (let x = 0; x < cell; x++) {
        const px = iconGrid[y][x];
        uniqueColors.add(px.join(','));
        sheet[row * cell + y][col * cell + x] = px;
      }
    }

    const individualPath = path.join(outDir, `food_${def.name}.png`);
    fs.writeFileSync(individualPath, encodePng(iconGrid));
  });

  const sheetPath = path.join(outDir, 'foods_spritesheet.png');
  fs.writeFileSync(sheetPath, encodePng(sheet));

  // Optional crisp 6x zoomed inspection preview with subtle checkerboard & cell guides
  const scale = 6;
  const inspectGrid = makeGrid(cols * cell * scale, rows * cell * scale);
  for (let sy = 0; sy < rows * cell; sy++) {
    for (let sx = 0; sx < cols * cell; sx++) {
      const px = sheet[sy][sx];
      const cellBorder = sx % cell === 0 || sy % cell === 0;
      const checker = (Math.floor(sx / 4) + Math.floor(sy / 4)) % 2 === 0;
      const bg: RGBA = cellBorder
        ? [52, 65, 85, 255]
        : checker
          ? [24, 31, 42, 255]
          : [30, 39, 52, 255];
      const finalPx: RGBA = px[3] > 0 ? px : bg;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          inspectGrid[sy * scale + dy][sx * scale + dx] = finalPx;
        }
      }
    }
  }
  fs.writeFileSync(path.resolve(process.cwd(), 'foods_preview_tmp.png'), encodePng(inspectGrid));

  console.log(
    `Generated ${ICONS.length} icons (32x32) + sprite sheet (${cols * cell}x${rows * cell}). Total unique RGBA values: ${uniqueColors.size}`
  );
}

main();
