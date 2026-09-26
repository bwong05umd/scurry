import type { StageDef } from './level';

// Fox stage. See docs/design/fox-bramble-hollow.md for the zone goals and
// src/levels/level.ts for the legend. Every zone is 80 columns (4 screens) by 12 rows.
// Check it can still be finished after edits: npm run check-level
//
// Flora palettes follow the route-reading colours: no yellow (reserved for the true-route
// daffodils), no purple (brambles) and no red (thorns). Plants only: stumps, logs and
// boulders would read as platforms, and big dark bushes as walls. Bright meadow flowers
// give way to shade plants as the thicket closes in.

export const brambleHollow: StageDef = {
  name: 'Bramble Hollow',
  zones: [
    {
      // 1. Dash is for redirecting. Land moving the wrong way; dash to snap back.
      name: 'Snap-Turn Stretch',
      flora: {
        density: 0.6,
        plants: [
          'peach_lilies', 'orange_lilies', 'orange_lilies_2', 'peach_lilies_2', 'daisy',
          'white_blossoms_low', 'white_blossoms_tall', 'queen_annes_lace', 'pink_rose_bush',
          'orange_berry_bush', 'fern', 'grass', 'cream_heather', 'blue_heather',
          'cyan_flower_bush', 'leafy_bush_white', 'leafy_bush_pink_sparse', 'leaf_scatter_white',
          'leaf_scatter_pink', 'pale_leaves', 'big_leaf',
        ],
      },
      rows: [
        '.................................HHHHHHHH.......................................',
        '.................................HHHHHHHH.......................................',
        '...@...b............b............HHHHHHHH.......................................',
        '##############################...HHHHHHHH.......................................',
        '##########.............................HH.......................................',
        '##########.....................*...~~~~HH.......................................',
        '##########...############################.......................................',
        '##########......................................................................',
        '##########.*................................T........b..HH....~~~~.s.........T..',
        '################################################...###################....######',
        '################################################~~~###################~~~~######',
        '################################################################################',
      ],
    },
    {
      // 2. Air-acceleration curving: arc over hedge corners and hook back to land.
      name: 'Thorn Corridor',
      flora: {
        density: 0.55,
        plants: [
          'fern', 'weeping_fern', 'grass', 'grass_orange', 'grass_orange_2', 'big_leaf',
          'blue_heather', 'white_blossoms_low', 'round_bush', 'cyan_flower_bush', 'cream_heather',
          'leafy_bush', 'leafy_bush_white_sparse', 'leaf_scatter_white', 'pale_leaves',
        ],
      },
      rows: [
        '..........HHH............HH........HHH.............HHHHH..........HHHH..........',
        '..........HHH............HH........HHH.............HHHHH..........HHHH..........',
        '..........HHH............HH........HHH.............HHHHH..........HHHH..........',
        '..........HHH............HH........HHH.............HHHHH..........HHHH..........',
        '..........HHH............HH........HHH.............HHHHH..........HHHH..........',
        '..........HHH......................HHH.............HHHHH........................',
        '..........HHH..................H...HHH.............HHHHH........................',
        '...........................##..H................H.............####....###.......',
        '.......H........b.....##...##..H.........T......H..........b..####~~~~###...s...',
        '######.H.....#######..##...##..H.##...#########.H.......########################',
        '######~H##~~~#######~~##~~~##~~H~##~~~#########~H..~~~~~########################',
        '################################################################################',
      ],
    },
    {
      // 3. Route choice. Low: flat, safe, slow brambles. High: steered gaps plus one dash.
      name: 'The Split',
      flora: {
        density: 0.55,
        plants: [
          'fern', 'weeping_fern', 'big_leaf', 'pink_sprout', 'blue_berry_bush',
          'cyan_flower_bush', 'round_bush', 'blue_heather', 'leafy_bush', 'pale_leaves',
          'leaf_scatter_white', 'grass',
        ],
      },
      rows: [
        '..........HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH.........',
        '....................................................HH..........................',
        '....................................................HH..........................',
        '................................................................................',
        '.....................H................H...*.............*.......................',
        '.........#####...###....###......####....####...###....####.....................',
        '......*....................................................................=....',
        '.....###.....................................................###......==...=....',
        '.....###....~~~~~~~~.......~~~~~~~~~~.........~~~~~~~~~......###..T...==...=....',
        '################################################################################',
        '################################################################################',
        '################################################################################',
      ],
    },
    {
      // 4. Route knowledge. Twin branches; the wrong one costs a few seconds, never the run.
      name: 'False Trails',
      flora: {
        density: 0.35,
        plants: ['grass', 'fern', 'big_leaf', 'round_bush', 'weeping_fern', 'pale_leaves', 'leaf_scatter_white'],
      },
      rows: [
        'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
        'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
        '................................................................................',
        '................................................................................',
        '................................................................................',
        '.......*......*....................~~~~~~~~~~~~~~..........*......*.............',
        '......##################........##################........##################....',
        '......HHHHHHHHHHHHHHHHHH........HHHHHHHHHHHHHHHHHH........HHHHHHHHHHHHHHHHHH....',
        '...#.....~~~~~~~~~~~~~~..b...#.*.*.................b...#.....~~~~~~~~~~~~~~..b..',
        '################################################################################',
        '################################################################################',
        '################################################################################',
      ],
    },
    {
      // 5. Everything at once: dash, a cooldown gap (Scurry or curve), dash again.
      name: 'The Gauntlet',
      flora: {
        density: 0.6,
        plants: ['dark_shrub_white', 'weeping_fern', 'fern', 'grass', 'pale_leaves', 'big_leaf'],
      },
      rows: [
        'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
        'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
        '..............................KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
        '.......................................X................KKKKKKKKKKKKKKKKKKKKKKKK',
        '.......................................X........................................',
        '................................................................................',
        '................................................................................',
        '..................................###.....###...................................',
        '..................................###.....###...............................F...',
        '########......###.....###......######.....######......###.....###......#########',
        '########......###.....###......######.....######......###.....###......#########',
        '########XXXXXX###XXXXX###XXXXXX######XXXXX######XXXXXX###XXXXX###XXXXXX#########',
      ],
    },
  ],
};
