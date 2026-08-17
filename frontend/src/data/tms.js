// Catálogo de MTs (TMs).
//
// Fuente de datos: el Excel/JSON de TMs. Las imágenes viven en
// `src/images/TMs/<Tipo>/TM <num> <Nombre>.png`.
//
// El match imagen↔dato NO se hace con imports literales (son 291 archivos y
// basta una mayúscula distinta para romperlo: en disco hay "TM 89 U-turn.png"
// mientras el Excel dice "U-Turn"). En su lugar webpack indexa la carpeta
// entera con require.context y se busca por clave normalizada
// `tipo|tm nombre` — insensible a mayúsculas, acentos y guiones.

//
// Hay dos juegos de imágenes con la MISMA estructura de carpetas y nombres:
//   TMs/       cartas a 762x1068 (~590 KB) — para ver la carta a tamaño real
//   TMs_thumb/ miniaturas a 240 px (~66 KB) — para los grids y los iconos
// El iPad no aguanta 171 MB de cartas en un grid, de ahí las miniaturas
// (generadas con `sips -Z 240`). Siguen en PNG porque las esquinas
// redondeadas de la carta usan canal alfa.

const ctx = require.context("../images/TMs", true, /\.png$/);
const ctxThumb = require.context("../images/TMs_thumb", true, /\.png$/);

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const indexFrom = (context) =>
  context.keys().reduce((acc, key) => {
    const m = key.match(/^\.\/([^/]+)\/(.+)\.png$/);
    if (m) acc[`${norm(m[1])}|${norm(m[2])}`] = context(key);
    return acc;
  }, {});

const IMAGES = indexFrom(ctx);
const THUMBS = indexFrom(ctxThumb);

/** Datos crudos, tal cual salen del Excel (más `id` y `numero` derivados). */
const RAW = [
  { id: "bug-tm-07-pin-missile", tm: "TM 07", numero: 7, nombre: "Pin Missile", tipo: "Bug", poder: 1, bono: "Si" },
  { id: "bug-tm-021-pounce", tm: "TM 021", numero: 21, nombre: "Pounce", tipo: "Bug", poder: 1, bono: "Si" },
  { id: "bug-tm-28-leech-life", tm: "TM 28", numero: 28, nombre: "Leech Life", tipo: "Bug", poder: 2, bono: "Si" },
  { id: "bug-tm-49-fury-cutter", tm: "TM 49", numero: 49, nombre: "Fury Cutter", tipo: "Bug", poder: 1, bono: "Si" },
  { id: "bug-tm-62-silver-wind", tm: "TM 62", numero: 62, nombre: "Silver Wind", tipo: "Bug", poder: 2, bono: "Si" },
  { id: "bug-tm-76-struggle-bug", tm: "TM 76", numero: 76, nombre: "Struggle Bug", tipo: "Bug", poder: 1, bono: "Si" },
  { id: "bug-tm-81-x-scissor", tm: "TM 81", numero: 81, nombre: "X-Scissor", tipo: "Bug", poder: 2, bono: "Si" },
  { id: "bug-tm-83-infestation", tm: "TM 83", numero: 83, nombre: "Infestation", tipo: "Bug", poder: 1, bono: "Si" },
  { id: "bug-tm-89-u-turn", tm: "TM 89", numero: 89, nombre: "U-Turn", tipo: "Bug", poder: 2, bono: "Si" },
  { id: "bug-tm-131-pollen-puff", tm: "TM 131", numero: 131, nombre: "Pollen Puff", tipo: "Bug", poder: 2, bono: "Si" },
  { id: "bug-tm-162-bug-buzz", tm: "TM 162", numero: 162, nombre: "Bug Buzz", tipo: "Bug", poder: 2, bono: "Si" },
  { id: "bug-tm-182-bug-bite", tm: "TM 182", numero: 182, nombre: "Bug Bite", tipo: "Bug", poder: 2, bono: "Si" },
  { id: "bug-tm-185-lunge", tm: "TM 185", numero: 185, nombre: "Lunge", tipo: "Bug", poder: 2, bono: "Si" },
  { id: "bug-tm-219-skitter-smack", tm: "TM 219", numero: 219, nombre: "Skitter Smack", tipo: "Bug", poder: 2, bono: "Si" },
  { id: "dark-tm-01-hone-claws", tm: "TM 01", numero: 1, nombre: "Hone Claws", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-12-taunt", tm: "TM 12", numero: 12, nombre: "Taunt", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-37-beat-up", tm: "TM 37", numero: 37, nombre: "Beat Up", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-41-torment", tm: "TM 41", numero: 41, nombre: "Torment", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-46-thief", tm: "TM 46", numero: 46, nombre: "Thief", tipo: "Dark", poder: 2, bono: "Si" },
  { id: "dark-tm-47-fake-tears", tm: "TM 47", numero: 47, nombre: "Fake Tears", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-49-snatch", tm: "TM 49", numero: 49, nombre: "Snatch", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-58-assurance", tm: "TM 58", numero: 58, nombre: "Assurance", tipo: "Dark", poder: 2, bono: "Si" },
  { id: "dark-tm-59-brutal-swing", tm: "TM 59", numero: 59, nombre: "Brutal Swing", tipo: "Dark", poder: 2, bono: "Si" },
  { id: "dark-tm-60-quash", tm: "TM 60", numero: 60, nombre: "Quash", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-062-foul-play", tm: "TM 062", numero: 62, nombre: "Foul Play", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-63-embargo", tm: "TM 63", numero: 63, nombre: "Embargo", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-66-payback", tm: "TM 66", numero: 66, nombre: "Payback", tipo: "Dark", poder: 1, bono: "Si" },
  { id: "dark-tm-79-dark-pulse", tm: "TM 79", numero: 79, nombre: "Dark Pulse", tipo: "Dark", poder: 2, bono: "Si" },
  { id: "dark-tm-95-snarl", tm: "TM 95", numero: 95, nombre: "Snarl", tipo: "Dark", poder: 2, bono: "Si" },
  { id: "dark-tm-108-crunch", tm: "TM 108", numero: 108, nombre: "Crunch", tipo: "Dark", poder: 2, bono: "Si" },
  { id: "dark-tm-140-nasty-plot", tm: "TM 140", numero: 140, nombre: "Nasty Plot", tipo: "Dark", poder: 0, bono: "No" },
  { id: "dark-tm-181-knock-off", tm: "TM 181", numero: 181, nombre: "Knock Off", tipo: "Dark", poder: 2, bono: "Si" },
  { id: "dark-tm-199-lash-out", tm: "TM 199", numero: 199, nombre: "Lash Out", tipo: "Dark", poder: 2, bono: "Si" },
  { id: "dark-tm-221-throat-chop", tm: "TM 221", numero: 221, nombre: "Throat Chop", tipo: "Dark", poder: 2, bono: "Si" },
  { id: "dragon-tm-02-dragon-claw", tm: "TM 02", numero: 2, nombre: "Dragon Claw", tipo: "Dragon", poder: 2, bono: "Si" },
  { id: "dragon-tm-23-dragon-rage", tm: "TM 23", numero: 23, nombre: "Dragon Rage", tipo: "Dragon", poder: 4, bono: "No" },
  { id: "dragon-tm-24-dragon-breath", tm: "TM 24", numero: 24, nombre: "Dragon Breath", tipo: "Dragon", poder: 2, bono: "Si" },
  { id: "dragon-tm-59-dragon-pulse", tm: "TM 59", numero: 59, nombre: "Dragon Pulse", tipo: "Dragon", poder: 2, bono: "Si" },
  { id: "dragon-tm-82-dragon-tail", tm: "TM 82", numero: 82, nombre: "Dragon Tail", tipo: "Dragon", poder: 2, bono: "Si" },
  { id: "dragon-tm-99-breaking-swipe", tm: "TM 99", numero: 99, nombre: "Breaking Swipe", tipo: "Dragon", poder: 2, bono: "Si" },
  { id: "dragon-tm-100-dragon-dance", tm: "TM 100", numero: 100, nombre: "Dragon Dance", tipo: "Dragon", poder: 0, bono: "No" },
  { id: "dragon-tm-156-outrage", tm: "TM 156", numero: 156, nombre: "Outrage", tipo: "Dragon", poder: 3, bono: "Si" },
  { id: "dragon-tm-169-draco-meteor", tm: "TM 169", numero: 169, nombre: "Draco Meteor", tipo: "Dragon", poder: 3, bono: "Si" },
  { id: "dragon-tm-200-scale-shot", tm: "TM 200", numero: 200, nombre: "Scale Shot", tipo: "Dragon", poder: 1, bono: "Si" },
  { id: "electric-tm-07-zap-cannon", tm: "TM 07", numero: 7, nombre: "Zap Cannon", tipo: "Electric", poder: 3, bono: "Si" },
  { id: "electric-tm-24-thunderbolt", tm: "TM 24", numero: 24, nombre: "Thunderbolt", tipo: "Electric", poder: 2, bono: "Si" },
  { id: "electric-tm-25-thunder", tm: "TM 25", numero: 25, nombre: "Thunder", tipo: "Electric", poder: 3, bono: "Si" },
  { id: "electric-tm-34-shock-wave", tm: "TM 34", numero: 34, nombre: "Shock Wave", tipo: "Electric", poder: 2, bono: "Si" },
  { id: "electric-tm-41-thunder-punch", tm: "TM 41", numero: 41, nombre: "Thunder Punch", tipo: "Electric", poder: 2, bono: "Si" },
  { id: "electric-tm-45-thunder-wave", tm: "TM 45", numero: 45, nombre: "Thunder Wave", tipo: "Electric", poder: 0, bono: "No" },
  { id: "electric-tm-57-charge-beam", tm: "TM 57", numero: 57, nombre: "Charge Beam", tipo: "Electric", poder: 1, bono: "Si" },
  { id: "electric-tm-66-thunder-fang", tm: "TM 66", numero: 66, nombre: "Thunder Fang", tipo: "Electric", poder: 2, bono: "Si" },
  { id: "electric-tm-072-electro-ball", tm: "TM 072", numero: 72, nombre: "Electro Ball", tipo: "Electric", poder: 0, bono: "No" },
  { id: "electric-tm-72-volt-switch", tm: "TM 72", numero: 72, nombre: "Volt Switch", tipo: "Electric", poder: 2, bono: "Si" },
  { id: "electric-tm-82-electroweb", tm: "TM 82", numero: 82, nombre: "Electroweb", tipo: "Electric", poder: 2, bono: "Si" },
  { id: "electric-tm-90-electric-terrain", tm: "TM 90", numero: 90, nombre: "Electric Terrain", tipo: "Electric", poder: 0, bono: "No" },
  { id: "electric-tm-93-eerie-impulse", tm: "TM 93", numero: 93, nombre: "Eerie Impulse", tipo: "Electric", poder: 0, bono: "No" },
  { id: "electric-tm-93-wild-charge", tm: "TM 93", numero: 93, nombre: "Wild Charge", tipo: "Electric", poder: 2, bono: "Si" },
  { id: "electric-tm-210-supercell-slam", tm: "TM 210", numero: 210, nombre: "Supercell Slam", tipo: "Electric", poder: 2, bono: "Si" },
  { id: "fairy-tm-019-disarming-voice", tm: "TM 019", numero: 19, nombre: "Disarming Voice", tipo: "Fairy", poder: 1, bono: "Si" },
  { id: "fairy-tm-29-charm", tm: "TM 29", numero: 29, nombre: "Charm", tipo: "Fairy", poder: 0, bono: "No" },
  { id: "fairy-tm-87-draining-kiss", tm: "TM 87", numero: 87, nombre: "Draining Kiss", tipo: "Fairy", poder: 1, bono: "Si" },
  { id: "fairy-tm-89-misty-terrain", tm: "TM 89", numero: 89, nombre: "Misty Terrain", tipo: "Fairy", poder: 0, bono: "No" },
  { id: "fairy-tm-99-dazzling-gleam", tm: "TM 99", numero: 99, nombre: "Dazzling Gleam", tipo: "Fairy", poder: 2, bono: "Si" },
  { id: "fairy-tm-127-play-rough", tm: "TM 127", numero: 127, nombre: "Play Rough", tipo: "Fairy", poder: 2, bono: "Si" },
  { id: "fairy-tm-201-misty-explosion", tm: "TM 201", numero: 201, nombre: "Misty Explosion", tipo: "Fairy", poder: 2, bono: "Si" },
  { id: "fairy-tm-227-alluring-voice", tm: "TM 227", numero: 227, nombre: "Alluring Voice", tipo: "Fairy", poder: 2, bono: "Si" },
  { id: "fighting-tm-01-dynamic-punch", tm: "TM 01", numero: 1, nombre: "Dynamic Punch", tipo: "Fighting", poder: 2, bono: "Si" },
  { id: "fighting-tm-08-bulk-up", tm: "TM 08", numero: 8, nombre: "Bulk Up", tipo: "Fighting", poder: 0, bono: "No" },
  { id: "fighting-tm-08-rock-smash", tm: "TM 08", numero: 8, nombre: "Rock Smash", tipo: "Fighting", poder: 1, bono: "Si" },
  { id: "fighting-tm-012-low-kick", tm: "TM 012", numero: 12, nombre: "Low Kick", tipo: "Fighting", poder: 1, bono: "Si" },
  { id: "fighting-tm-17-submission", tm: "TM 17", numero: 17, nombre: "Submission", tipo: "Fighting", poder: 2, bono: "Si" },
  { id: "fighting-tm-18-counter", tm: "TM 18", numero: 18, nombre: "Counter", tipo: "Fighting", poder: 0, bono: "No" },
  { id: "fighting-tm-19-seismic-toss", tm: "TM 19", numero: 19, nombre: "Seismic Toss", tipo: "Fighting", poder: 0, bono: "No" },
  { id: "fighting-tm-31-brick-break", tm: "TM 31", numero: 31, nombre: "Brick Break", tipo: "Fighting", poder: 2, bono: "Si" },
  { id: "fighting-tm-42-revenge", tm: "TM 42", numero: 42, nombre: "Revenge", tipo: "Fighting", poder: 2, bono: "Si" },
  { id: "fighting-tm-43-detect", tm: "TM 43", numero: 43, nombre: "Detect", tipo: "Fighting", poder: 0, bono: "No" },
  { id: "fighting-tm-52-focus-blast", tm: "TM 52", numero: 52, nombre: "Focus Blast", tipo: "Fighting", poder: 3, bono: "Si" },
  { id: "fighting-tm-60-drain-punch", tm: "TM 60", numero: 60, nombre: "Drain Punch", tipo: "Fighting", poder: 2, bono: "Si" },
  { id: "fighting-tm-089-body-press", tm: "TM 089", numero: 89, nombre: "Body Press", tipo: "Fighting", poder: 2, bono: "Si" },
  { id: "fighting-tm-98-power-up-punch", tm: "TM 98", numero: 98, nombre: "Power-Up Punch", tipo: "Fighting", poder: 1, bono: "Si" },
  { id: "fighting-tm-112-aura-sphere", tm: "TM 112", numero: 112, nombre: "Aura Sphere", tipo: "Fighting", poder: 2, bono: "Si" },
  { id: "fighting-tm-134-reversal", tm: "TM 134", numero: 134, nombre: "Reversal", tipo: "Fighting", poder: 0, bono: "No" },
  { id: "fighting-tm-167-close-combat", tm: "TM 167", numero: 167, nombre: "Close Combat", tipo: "Fighting", poder: 3, bono: "Si" },
  { id: "fighting-tm-184-vacuum-wave", tm: "TM 184", numero: 184, nombre: "Vacuum Wave", tipo: "Fighting", poder: 1, bono: "Si" },
  { id: "fighting-tm-229-upper-hand", tm: "TM 229", numero: 229, nombre: "Upper Hand", tipo: "Fighting", poder: 2, bono: "Si" },
  { id: "flying-tm-40-aerial-ace", tm: "TM 40", numero: 40, nombre: "Aerial Ace", tipo: "Flying", poder: 2, bono: "Si" },
  { id: "flying-tm-040-air-cutter", tm: "TM 040", numero: 40, nombre: "Air Cutter", tipo: "Flying", poder: 2, bono: "Si" },
  { id: "flying-tm-43-sky-attack", tm: "TM 43", numero: 43, nombre: "Sky Attack", tipo: "Flying", poder: 3, bono: "Si" },
  { id: "flying-tm-51-roost", tm: "TM 51", numero: 51, nombre: "Roost", tipo: "Flying", poder: 0, bono: "No" },
  { id: "flying-tm-52-bounce", tm: "TM 52", numero: 52, nombre: "Bounce", tipo: "Flying", poder: 2, bono: "Si" },
  { id: "flying-tm-62-acrobatics", tm: "TM 62", numero: 62, nombre: "Acrobatics", tipo: "Flying", poder: 2, bono: "Si" },
  { id: "flying-tm-76-fly", tm: "TM 76", numero: 76, nombre: "Fly", tipo: "Flying", poder: 2, bono: "Si" },
  { id: "flying-tm-88-pluck", tm: "TM 88", numero: 88, nombre: "Pluck", tipo: "Flying", poder: 2, bono: "Si" },
  { id: "flying-tm-95-air-slash", tm: "TM 95", numero: 95, nombre: "Air Slash", tipo: "Flying", poder: 2, bono: "Si" },
  { id: "flying-tm-160-hurricane", tm: "TM 160", numero: 160, nombre: "Hurricane", tipo: "Flying", poder: 3, bono: "Si" },
  { id: "flying-tm-164-brave-bird", tm: "TM 164", numero: 164, nombre: "Brave Bird", tipo: "Flying", poder: 3, bono: "Si" },
  { id: "flying-tm-197-dual-wingbeat", tm: "TM 197", numero: 197, nombre: "Dual Wingbeat", tipo: "Flying", poder: 1, bono: "Si" },
  { id: "flying-tm-216-feather-dance", tm: "TM 216", numero: 216, nombre: "Feather Dance", tipo: "Flying", poder: 0, bono: "No" },
  { id: "fire-tm-11-sunny-day", tm: "TM 11", numero: 11, nombre: "Sunny Day", tipo: "Fire", poder: 0, bono: "No" },
  { id: "fire-tm-13-fire-spin", tm: "TM 13", numero: 13, nombre: "Fire Spin", tipo: "Fire", poder: 1, bono: "Si" },
  { id: "fire-tm-35-flamethrower", tm: "TM 35", numero: 35, nombre: "Flamethrower", tipo: "Fire", poder: 2, bono: "Si" },
  { id: "fire-tm-38-fire-blast", tm: "TM 38", numero: 38, nombre: "Fire Blast", tipo: "Fire", poder: 3, bono: "Si" },
  { id: "fire-tm-43-flame-charge", tm: "TM 43", numero: 43, nombre: "Flame Charge", tipo: "Fire", poder: 1, bono: "Si" },
  { id: "fire-tm-48-fire-punch", tm: "TM 48", numero: 48, nombre: "Fire Punch", tipo: "Fire", poder: 2, bono: "Si" },
  { id: "fire-tm-50-overheat", tm: "TM 50", numero: 50, nombre: "Overheat", tipo: "Fire", poder: 3, bono: "Si" },
  { id: "fire-tm-59-incinerate", tm: "TM 59", numero: 59, nombre: "Incinerate", tipo: "Fire", poder: 2, bono: "Si" },
  { id: "fire-tm-61-will-o-wisp", tm: "TM 61", numero: 61, nombre: "Will-O-Wisp", tipo: "Fire", poder: 0, bono: "No" },
  { id: "fire-tm-68-fire-fang", tm: "TM 68", numero: 68, nombre: "Fire Fang", tipo: "Fire", poder: 2, bono: "Si" },
  { id: "fire-tm-92-mystical-fire", tm: "TM 92", numero: 92, nombre: "Mystical Fire", tipo: "Fire", poder: 2, bono: "Si" },
  { id: "fire-tm-118-heat-wave", tm: "TM 118", numero: 118, nombre: "Heat Wave", tipo: "Fire", poder: 2, bono: "Si" },
  { id: "fire-tm-144-fire-pledge", tm: "TM 144", numero: 144, nombre: "Fire Pledge", tipo: "Fire", poder: 2, bono: "Si" },
  { id: "fire-tm-153-blast-burn", tm: "TM 153", numero: 153, nombre: "Blast Burn", tipo: "Fire", poder: 3, bono: "Si" },
  { id: "fire-tm-165-flare-blitz", tm: "TM 165", numero: 165, nombre: "Flare Blitz", tipo: "Fire", poder: 3, bono: "Si" },
  { id: "fire-tm-195-burning-jealousy", tm: "TM 195", numero: 195, nombre: "Burning Jealousy", tipo: "Fire", poder: 2, bono: "Si" },
  { id: "ground-tm-215-scorching-sands", tm: "TM 215", numero: 215, nombre: "Scorching Sands", tipo: "Ground", poder: 2, bono: "Si" },
  { id: "ghost-tm-03-curse", tm: "TM 03", numero: 3, nombre: "Curse", tipo: "Ghost", poder: 0, bono: "No" },
  { id: "ghost-tm-017-confuse-ray", tm: "TM 017", numero: 17, nombre: "Confuse Ray", tipo: "Ghost", poder: 0, bono: "No" },
  { id: "ghost-tm-30-shadow-ball", tm: "TM 30", numero: 30, nombre: "Shadow Ball", tipo: "Ghost", poder: 2, bono: "Si" },
  { id: "ghost-tm-042-night-shade", tm: "TM 042", numero: 42, nombre: "Night Shade", tipo: "Ghost", poder: 0, bono: "No" },
  { id: "ghost-tm-65-shadow-claw", tm: "TM 65", numero: 65, nombre: "Shadow Claw", tipo: "Ghost", poder: 2, bono: "Si" },
  { id: "ghost-tm-77-hex", tm: "TM 77", numero: 77, nombre: "Hex", tipo: "Ghost", poder: 2, bono: "Si" },
  { id: "ghost-tm-86-phantom-force", tm: "TM 86", numero: 86, nombre: "Phantom Force", tipo: "Ghost", poder: 2, bono: "Si" },
  { id: "ghost-tm-198-poltergeist", tm: "TM 198", numero: 198, nombre: "Poltergeist", tipo: "Ghost", poder: 0, bono: "No" },
  { id: "grass-tm-09-bullet-seed", tm: "TM 09", numero: 9, nombre: "Bullet Seed", tipo: "Grass", poder: 1, bono: "Si" },
  { id: "grass-tm-10-magical-leaf", tm: "TM 10", numero: 10, nombre: "Magical Leaf", tipo: "Grass", poder: 2, bono: "Si" },
  { id: "grass-tm-12-solar-blade", tm: "TM 12", numero: 12, nombre: "Solar Blade", tipo: "Grass", poder: 3, bono: "Si" },
  { id: "grass-tm-19-giga-drain", tm: "TM 19", numero: 19, nombre: "Giga Drain", tipo: "Grass", poder: 2, bono: "Si" },
  { id: "grass-tm-020-trailblaze", tm: "TM 020", numero: 20, nombre: "Trailblaze", tipo: "Grass", poder: 1, bono: "Si" },
  { id: "grass-tm-21-mega-drain", tm: "TM 21", numero: 21, nombre: "Mega Drain", tipo: "Grass", poder: 1, bono: "Si" },
  { id: "grass-tm-22-solar-beam", tm: "TM 22", numero: 22, nombre: "Solar Beam", tipo: "Grass", poder: 3, bono: "Si" },
  { id: "grass-tm-53-energy-ball", tm: "TM 53", numero: 53, nombre: "Energy Ball", tipo: "Grass", poder: 2, bono: "Si" },
  { id: "grass-tm-071-seed-bomb", tm: "TM 071", numero: 71, nombre: "Seed Bomb", tipo: "Grass", poder: 2, bono: "Si" },
  { id: "grass-tm-86-grass-knot", tm: "TM 86", numero: 86, nombre: "Grass Knot", tipo: "Grass", poder: 0, bono: "No" },
  { id: "grass-tm-88-grassy-terrain", tm: "TM 88", numero: 88, nombre: "Grassy Terrain", tipo: "Grass", poder: 0, bono: "No" },
  { id: "grass-tm-146-grass-pledge", tm: "TM 146", numero: 146, nombre: "Grass Pledge", tipo: "Grass", poder: 2, bono: "Si" },
  { id: "grass-tm-155-frenzy-plant", tm: "TM 155", numero: 155, nombre: "Frenzy Plant", tipo: "Grass", poder: 3, bono: "Si" },
  { id: "grass-tm-159-leaf-storm", tm: "TM 159", numero: 159, nombre: "Leaf Storm", tipo: "Grass", poder: 3, bono: "Si" },
  { id: "grass-tm-194-grassy-glide", tm: "TM 194", numero: 194, nombre: "Grassy Glide", tipo: "Grass", poder: 2, bono: "No" },
  { id: "grass-tm-206-petal-blizzard", tm: "TM 206", numero: 206, nombre: "Petal Blizzard", tipo: "Grass", poder: 2, bono: "No" },
  { id: "ground-tm-26-earthquake", tm: "TM 26", numero: 26, nombre: "Earthquake", tipo: "Ground", poder: 2, bono: "Si" },
  { id: "ground-tm-27-fissure", tm: "TM 27", numero: 27, nombre: "Fissure", tipo: "Ground", poder: 0, bono: "No" },
  { id: "ground-tm-28-dig", tm: "TM 28", numero: 28, nombre: "Dig", tipo: "Ground", poder: 2, bono: "Si" },
  { id: "ground-tm-31-mud-slap", tm: "TM 31", numero: 31, nombre: "Mud-Slap", tipo: "Ground", poder: 1, bono: "No" },
  { id: "ground-tm-49-sand-tomb", tm: "TM 49", numero: 49, nombre: "Sand Tomb", tipo: "Ground", poder: 1, bono: "Si" },
  { id: "ground-tm-53-mud-shot", tm: "TM 53", numero: 53, nombre: "Mud Shot", tipo: "Ground", poder: 2, bono: "Si" },
  { id: "ground-tm-78-bulldoze", tm: "TM 78", numero: 78, nombre: "Bulldoze", tipo: "Ground", poder: 2, bono: "Si" },
  { id: "ground-tm-090-spikes", tm: "TM 090", numero: 90, nombre: "Spikes", tipo: "Ground", poder: 0, bono: "No" },
  { id: "ground-tm-98-stomping-tantrum", tm: "TM 98", numero: 98, nombre: "Stomping Tantrum", tipo: "Ground", poder: 2, bono: "Si" },
  { id: "ground-tm-106-drill-run", tm: "TM 106", numero: 106, nombre: "Drill Run", tipo: "Ground", poder: 2, bono: "Si" },
  { id: "ground-tm-133-earth-power", tm: "TM 133", numero: 133, nombre: "Earth Power", tipo: "Ground", poder: 2, bono: "Si" },
  { id: "ground-tm-186-high-horsepower", tm: "TM 186", numero: 186, nombre: "High Horsepower", tipo: "Ground", poder: 2, bono: "Si" },
  { id: "ice-tm-07-hail", tm: "TM 07", numero: 7, nombre: "Hail", tipo: "Ice", poder: 0, bono: "No" },
  { id: "ice-tm-13-ice-beam", tm: "TM 13", numero: 13, nombre: "Ice Beam", tipo: "Ice", poder: 2, bono: "Si" },
  { id: "ice-tm-14-blizzard", tm: "TM 14", numero: 14, nombre: "Blizzard", tipo: "Ice", poder: 3, bono: "Si" },
  { id: "ice-tm-16-icy-wind", tm: "TM 16", numero: 16, nombre: "Icy Wind", tipo: "Ice", poder: 2, bono: "Si" },
  { id: "ice-tm-33-ice-punch", tm: "TM 33", numero: 33, nombre: "Ice Punch", tipo: "Ice", poder: 2, bono: "Si" },
  { id: "ice-tm-51-icicle-spear", tm: "TM 51", numero: 51, nombre: "Icicle Spear", tipo: "Ice", poder: 1, bono: "Si" },
  { id: "ice-tm-052-snowscape", tm: "TM 052", numero: 52, nombre: "Snowscape", tipo: "Ice", poder: 0, bono: "No" },
  { id: "ice-tm-67-ice-fang", tm: "TM 67", numero: 67, nombre: "Ice Fang", tipo: "Ice", poder: 2, bono: "Si" },
  { id: "ice-tm-70-aurora-veil", tm: "TM 70", numero: 70, nombre: "Aurora Veil", tipo: "Ice", poder: 0, bono: "No" },
  { id: "ice-tm-72-avalanche", tm: "TM 72", numero: 72, nombre: "Avalanche", tipo: "Ice", poder: 2, bono: "Si" },
  { id: "ice-tm-79-frost-breath", tm: "TM 79", numero: 79, nombre: "Frost Breath", tipo: "Ice", poder: 2, bono: "Si" },
  { id: "ice-tm-124-ice-spinner", tm: "TM 124", numero: 124, nombre: "Ice Spinner", tipo: "Ice", poder: 2, bono: "Si" },
  { id: "ice-tm-174-haze", tm: "TM 174", numero: 174, nombre: "Haze", tipo: "Ice", poder: 0, bono: "No" },
  { id: "ice-tm-212-triple-axel", tm: "TM 212", numero: 212, nombre: "Triple Axel", tipo: "Ice", poder: 1, bono: "Si" },
  { id: "normal-tm-01-mega-punch", tm: "TM 01", numero: 1, nombre: "Mega Punch", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-02-headbutt", tm: "TM 02", numero: 2, nombre: "Headbutt", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-02-razor-wind", tm: "TM 02", numero: 2, nombre: "Razor Wind", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-03-swords-dance", tm: "TM 03", numero: 3, nombre: "Swords Dance", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-04-whirlwind", tm: "TM 04", numero: 4, nombre: "Whirlwind", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-05-mega-kick", tm: "TM 05", numero: 5, nombre: "Mega Kick", tipo: "Normal", poder: 3, bono: "Si" },
  { id: "normal-tm-05-roar", tm: "TM 05", numero: 5, nombre: "Roar", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-07-horn-drill", tm: "TM 07", numero: 7, nombre: "Horn Drill", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-08-body-slam", tm: "TM 08", numero: 8, nombre: "Body Slam", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-09-take-down", tm: "TM 09", numero: 9, nombre: "Take Down", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-10-double-edge", tm: "TM 10", numero: 10, nombre: "Double-Edge", tipo: "Normal", poder: 3, bono: "Si" },
  { id: "normal-tm-10-hidden-power", tm: "TM 10", numero: 10, nombre: "Hidden Power", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-12-sweet-scent", tm: "TM 12", numero: 12, nombre: "Sweet Scent", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-13-snore", tm: "TM 13", numero: 13, nombre: "Snore", tipo: "Normal", poder: 1, bono: "Si" },
  { id: "normal-tm-15-hyper-beam", tm: "TM 15", numero: 15, nombre: "Hyper Beam", tipo: "Normal", poder: 3, bono: "Si" },
  { id: "normal-tm-16-pay-day", tm: "TM 16", numero: 16, nombre: "Pay Day", tipo: "Normal", poder: 1, bono: "Si" },
  { id: "normal-tm-16-screech", tm: "TM 16", numero: 16, nombre: "Screech", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-17-protect", tm: "TM 17", numero: 17, nombre: "Protect", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-20-rage", tm: "TM 20", numero: 20, nombre: "Rage", tipo: "Normal", poder: 1, bono: "Si" },
  { id: "normal-tm-20-safeguard", tm: "TM 20", numero: 20, nombre: "Safeguard", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-21-frustration", tm: "TM 21", numero: 21, nombre: "Frustration", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-27-return", tm: "TM 27", numero: 27, nombre: "Return", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-31-mimic", tm: "TM 31", numero: 31, nombre: "Mimic", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-32-double-team", tm: "TM 32", numero: 32, nombre: "Double Team", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-34-bide", tm: "TM 34", numero: 34, nombre: "Bide", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-34-swagger", tm: "TM 34", numero: 34, nombre: "Swagger", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-35-metronome", tm: "TM 35", numero: 35, nombre: "Metronome", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-35-sleep-talk", tm: "TM 35", numero: 35, nombre: "Sleep Talk", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-36-self-destruct", tm: "TM 36", numero: 36, nombre: "Self-Destruct", tipo: "Normal", poder: 4, bono: "Si" },
  { id: "normal-tm-37-egg-bomb", tm: "TM 37", numero: 37, nombre: "Egg Bomb", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-39-swift", tm: "TM 39", numero: 39, nombre: "Swift", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-40-defense-curl", tm: "TM 40", numero: 40, nombre: "Defense Curl", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-40-skull-bash", tm: "TM 40", numero: 40, nombre: "Skull Bash", tipo: "Normal", poder: 3, bono: "Si" },
  { id: "normal-tm-41-soft-boiled", tm: "TM 41", numero: 41, nombre: "Soft-Boiled", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-42-facade", tm: "TM 42", numero: 42, nombre: "Facade", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-43-secret-power", tm: "TM 43", numero: 43, nombre: "Secret Power", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-45-attract", tm: "TM 45", numero: 45, nombre: "Attract", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-47-explosion", tm: "TM 47", numero: 47, nombre: "Explosion", tipo: "Normal", poder: 5, bono: "Si" },
  { id: "normal-tm-49-echoed-voice", tm: "TM 49", numero: 49, nombre: "Echoed Voice", tipo: "Normal", poder: 1, bono: "Si" },
  { id: "normal-tm-49-tri-attack", tm: "TM 49", numero: 49, nombre: "Tri Attack", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-54-false-swipe", tm: "TM 54", numero: 54, nombre: "False Swipe", tipo: "Normal", poder: 1, bono: "Si" },
  { id: "normal-tm-67-retaliate", tm: "TM 67", numero: 67, nombre: "Retaliate", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-68-giga-impact", tm: "TM 68", numero: 68, nombre: "Giga Impact", tipo: "Normal", poder: 3, bono: "Si" },
  { id: "normal-tm-70-flash", tm: "TM 70", numero: 70, nombre: "Flash", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-78-captivate", tm: "TM 78", numero: 78, nombre: "Captivate", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-83-work-up", tm: "TM 83", numero: 83, nombre: "Work Up", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-84-tail-slap", tm: "TM 84", numero: 84, nombre: "Tail Slap", tipo: "Normal", poder: 1, bono: "Si" },
  { id: "normal-tm-96-nature-power", tm: "TM 96", numero: 96, nombre: "Nature Power", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-100-confide", tm: "TM 100", numero: 100, nombre: "Confide", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-117-hyper-voice", tm: "TM 117", numero: 117, nombre: "Hyper Voice", tipo: "Normal", poder: 2, bono: "Si" },
  { id: "normal-tm-122-encore", tm: "TM 122", numero: 122, nombre: "Encore", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-171-tera-blast", tm: "TM 171", numero: 171, nombre: "Tera Blast", tipo: "Normal", poder: 2, bono: "No" },
  { id: "normal-tm-183-super-fang", tm: "TM 183", numero: 183, nombre: "Super Fang", tipo: "Normal", poder: 0, bono: "No" },
  { id: "normal-tm-205-endeavor", tm: "TM 205", numero: 205, nombre: "Endeavor", tipo: "Normal", poder: 0, bono: "No" },
  { id: "poison-tm-06-toxic", tm: "TM 06", numero: 6, nombre: "Toxic", tipo: "Poison", poder: 0, bono: "No" },
  { id: "poison-tm-09-venoshock", tm: "TM 09", numero: 9, nombre: "Venoshock", tipo: "Poison", poder: 2, bono: "Si" },
  { id: "poison-tm-013-acid-spray", tm: "TM 013", numero: 13, nombre: "Acid Spray", tipo: "Poison", poder: 1, bono: "Si" },
  { id: "poison-tm-026-poison-tail", tm: "TM 026", numero: 26, nombre: "Poison Tail", tipo: "Poison", poder: 1, bono: "Si" },
  { id: "poison-tm-34-sludge-wave", tm: "TM 34", numero: 34, nombre: "Sludge Wave", tipo: "Poison", poder: 2, bono: "Si" },
  { id: "poison-tm-36-sludge-bomb", tm: "TM 36", numero: 36, nombre: "Sludge Bomb", tipo: "Poison", poder: 2, bono: "Si" },
  { id: "poison-tm-73-cross-poison", tm: "TM 73", numero: 73, nombre: "Cross Poison", tipo: "Poison", poder: 2, bono: "Si" },
  { id: "poison-tm-84-poison-jab", tm: "TM 84", numero: 84, nombre: "Poison Jab", tipo: "Poison", poder: 2, bono: "Si" },
  { id: "poison-tm-091-toxic-spikes", tm: "TM 091", numero: 91, nombre: "Toxic Spikes", tipo: "Poison", poder: 0, bono: "No" },
  { id: "poison-tm-102-gunk-shot", tm: "TM 102", numero: 102, nombre: "Gunk Shot", tipo: "Poison", poder: 3, bono: "Si" },
  { id: "psychic-tm-03-psyshock", tm: "TM 03", numero: 3, nombre: "Psyshock", tipo: "Psychic", poder: 2, bono: "Si" },
  { id: "psychic-tm-004-agility", tm: "TM 004", numero: 4, nombre: "Agility", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-04-calm-mind", tm: "TM 04", numero: 4, nombre: "Calm Mind", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-16-light-screen", tm: "TM 16", numero: 16, nombre: "Light Screen", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-016-psybeam", tm: "TM 016", numero: 16, nombre: "Psybeam", tipo: "Psychic", poder: 2, bono: "Si" },
  { id: "psychic-tm-29-psychic", tm: "TM 29", numero: 29, nombre: "Psychic", tipo: "Psychic", poder: 2, bono: "Si" },
  { id: "psychic-tm-30-teleport", tm: "TM 30", numero: 30, nombre: "Teleport", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-33-reflect", tm: "TM 33", numero: 33, nombre: "Reflect", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-42-dream-eater", tm: "TM 42", numero: 42, nombre: "Dream Eater", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-44-rest", tm: "TM 44", numero: 44, nombre: "Rest", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-46-psywave", tm: "TM 46", numero: 46, nombre: "Psywave", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-059-zen-headbutt", tm: "TM 059", numero: 59, nombre: "Zen Headbutt", tipo: "Psychic", poder: 2, bono: "Si" },
  { id: "psychic-tm-063-psychic-fangs", tm: "TM 063", numero: 63, nombre: "Psychic Fangs", tipo: "Psychic", poder: 2, bono: "Si" },
  { id: "psychic-tm-69-psycho-cut", tm: "TM 69", numero: 69, nombre: "Psycho Cut", tipo: "Psychic", poder: 2, bono: "Si" },
  { id: "psychic-tm-72-magic-room", tm: "TM 72", numero: 72, nombre: "Magic Room", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-91-psychic-terrain", tm: "TM 91", numero: 91, nombre: "Psychic Terrain", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-109-trick", tm: "TM 109", numero: 109, nombre: "Trick", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-128-amnesia", tm: "TM 128", numero: 128, nombre: "Amnesia", tipo: "Psychic", poder: 0, bono: "No" },
  { id: "psychic-tm-217-future-sight", tm: "TM 217", numero: 217, nombre: "Future Sight", tipo: "Psychic", poder: 3, bono: "Si" },
  { id: "psychic-tm-218-expanding-force", tm: "TM 218", numero: 218, nombre: "Expanding Force", tipo: "Psychic", poder: 2, bono: "Si" },
  { id: "psychic-tm-228-psychic-noise", tm: "TM 228", numero: 228, nombre: "Psychic Noise", tipo: "Psychic", poder: 2, bono: "Si" },
  { id: "rock-tm-04-rollout", tm: "TM 04", numero: 4, nombre: "Rollout", tipo: "Rock", poder: 1, bono: "Si" },
  { id: "rock-tm-37-sandstorm", tm: "TM 37", numero: 37, nombre: "Sandstorm", tipo: "Rock", poder: 0, bono: "No" },
  { id: "rock-tm-39-rock-tomb", tm: "TM 39", numero: 39, nombre: "Rock Tomb", tipo: "Rock", poder: 2, bono: "Si" },
  { id: "rock-tm-48-rock-slide", tm: "TM 48", numero: 48, nombre: "Rock Slide", tipo: "Rock", poder: 2, bono: "Si" },
  { id: "rock-tm-54-rock-blast", tm: "TM 54", numero: 54, nombre: "Rock Blast", tipo: "Rock", poder: 1, bono: "Si" },
  { id: "rock-tm-69-rock-polish", tm: "TM 69", numero: 69, nombre: "Rock Polish", tipo: "Rock", poder: 0, bono: "No" },
  { id: "rock-tm-71-stone-edge", tm: "TM 71", numero: 71, nombre: "Stone Edge", tipo: "Rock", poder: 2, bono: "Si" },
  { id: "rock-tm-76-stealth-rock", tm: "TM 76", numero: 76, nombre: "Stealth Rock", tipo: "Rock", poder: 0, bono: "No" },
  { id: "rock-tm-101-power-gem", tm: "TM 101", numero: 101, nombre: "Power Gem", tipo: "Rock", poder: 2, bono: "Si" },
  { id: "rock-tm-220-meteor-beam", tm: "TM 220", numero: 220, nombre: "Meteor Beam", tipo: "Rock", poder: 3, bono: "Si" },
  { id: "steel-tm-23-iron-tail", tm: "TM 23", numero: 23, nombre: "Iron Tail", tipo: "Steel", poder: 2, bono: "Si" },
  { id: "steel-tm-031-metal-claw", tm: "TM 031", numero: 31, nombre: "Metal Claw", tipo: "Steel", poder: 1, bono: "Si" },
  { id: "steel-tm-47-steel-wing", tm: "TM 47", numero: 47, nombre: "Steel Wing", tipo: "Steel", poder: 2, bono: "Si" },
  { id: "steel-tm-67-smart-strike", tm: "TM 67", numero: 67, nombre: "Smart Strike", tipo: "Steel", poder: 2, bono: "Si" },
  { id: "steel-tm-74-gyro-ball", tm: "TM 74", numero: 74, nombre: "Gyro Ball", tipo: "Steel", poder: 0, bono: "No" },
  { id: "steel-tm-91-flash-cannon", tm: "TM 91", numero: 91, nombre: "Flash Cannon", tipo: "Steel", poder: 2, bono: "Si" },
  { id: "steel-tm-099-iron-head", tm: "TM 099", numero: 99, nombre: "Iron Head", tipo: "Steel", poder: 2, bono: "Si" },
  { id: "steel-tm-104-iron-defense", tm: "TM 104", numero: 104, nombre: "Iron Defense", tipo: "Steel", poder: 0, bono: "No" },
  { id: "steel-tm-121-heavy-slam", tm: "TM 121", numero: 121, nombre: "Heavy Slam", tipo: "Steel", poder: 0, bono: "No" },
  { id: "steel-tm-170-steel-beam", tm: "TM 170", numero: 170, nombre: "Steel Beam", tipo: "Steel", poder: 3, bono: "Si" },
  { id: "steel-tm-223-metal-sound", tm: "TM 223", numero: 223, nombre: "Metal Sound", tipo: "Steel", poder: 0, bono: "No" },
  { id: "steel-tm-225-hard-press", tm: "TM 225", numero: 225, nombre: "Hard Press", tipo: "Steel", poder: 0, bono: "No" },
  { id: "water-tm-03-water-pulse", tm: "TM 03", numero: 3, nombre: "Water Pulse", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-11-bubble-beam", tm: "TM 11", numero: 11, nombre: "Bubble Beam", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-12-water-gun", tm: "TM 12", numero: 12, nombre: "Water Gun", tipo: "Water", poder: 1, bono: "Si" },
  { id: "water-tm-18-rain-dance", tm: "TM 18", numero: 18, nombre: "Rain Dance", tipo: "Water", poder: 0, bono: "No" },
  { id: "water-tm-022-chilling-water", tm: "TM 022", numero: 22, nombre: "Chilling Water", tipo: "Water", poder: 1, bono: "Si" },
  { id: "water-tm-36-whirlpool", tm: "TM 36", numero: 36, nombre: "Whirlpool", tipo: "Water", poder: 1, bono: "Si" },
  { id: "water-tm-45-dive", tm: "TM 45", numero: 45, nombre: "Dive", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-55-brine", tm: "TM 55", numero: 55, nombre: "Brine", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-55-scald", tm: "TM 55", numero: 55, nombre: "Scald", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-83-razor-shell", tm: "TM 83", numero: 83, nombre: "Razor Shell", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-94-surf", tm: "TM 94", numero: 94, nombre: "Surf", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-98-waterfall", tm: "TM 98", numero: 98, nombre: "Waterfall", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-110-liquidation", tm: "TM 110", numero: 110, nombre: "Liquidation", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-142-hydro-pump", tm: "TM 142", numero: 142, nombre: "Hydro Pump", tipo: "Water", poder: 3, bono: "Si" },
  { id: "water-tm-145-water-pledge", tm: "TM 145", numero: 145, nombre: "Water Pledge", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-154-hydro-cannon", tm: "TM 154", numero: 154, nombre: "Hydro Cannon", tipo: "Water", poder: 3, bono: "Si" },
  { id: "water-tm-196-flip-turn", tm: "TM 196", numero: 196, nombre: "Flip Turn", tipo: "Water", poder: 2, bono: "Si" },
  { id: "water-tm-209-muddy-water", tm: "TM 209", numero: 209, nombre: "Muddy Water", tipo: "Water", poder: 2, bono: "Si" },
];

/**
 * Catálogo listo para usar: cada MT con su carta (`img`) y su miniatura
 * (`thumb`). Ambas son null si falta el png; se avisa por consola en
 * desarrollo. `thumb` cae a `img` si la miniatura no se generó.
 */
export const TMS = RAW.map((t) => {
  const key = `${norm(t.tipo)}|${norm(`${t.tm} ${t.nombre}`)}`;
  const img = IMAGES[key] || null;
  if (!img && process.env.NODE_ENV === "development") {
    console.warn(`[tms] sin imagen: ${t.tipo}/${t.tm} ${t.nombre}`);
  }
  return { ...t, img, thumb: THUMBS[key] || img, stab: t.bono === "Si" };
});

/** Los 18 tipos presentes, en orden alfabético. */
export const TM_TYPES = [...new Set(TMS.map((t) => t.tipo))].sort();

/** Índice por id, para lookups O(1) desde saves/inventario. */
export const TMS_BY_ID = TMS.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});

/** MTs de un tipo, ordenados por número de MT. */
export const tmsByType = (tipo) =>
  TMS.filter((t) => t.tipo === tipo).sort((a, b) => a.numero - b.numero);

/** Búsqueda laxa por nombre o número de MT. */
export const searchTMs = (query) => {
  const q = norm(query);
  if (!q) return TMS;
  return TMS.filter(
    (t) => norm(t.nombre).includes(q) || norm(t.tm).includes(q)
  );
};

/**
 * ¿Le toca el +1 por tipo (STAB) a esta MT en este Pokémon?
 *
 * Dos condiciones, y hacen falta las dos:
 *   - la MT lleva el bono activo (`bono: "Si"` en el Excel). Las que no, nunca
 *     lo reciben aunque el tipo coincida: Dragon Rage, Mud-Slap, Tera Blast,
 *     Grassy Glide y Petal Blizzard son de daño fijo o especial.
 *   - alguno de los dos tipos del Pokémon coincide con el de la MT.
 *
 * Ejemplo: Dazzling Gleam (Hada, poder 2, con bono) va a 2 en un Chikorita
 * (Planta) y a 3 en un Togekiss (Hada/Volador).
 */
export const tmAppliesStab = (tm, pokemon) => {
  if (!tm || !tm.stab || !pokemon) return false;
  const tipo = norm(tm.tipo);
  return norm(pokemon.type1 || "") === tipo || norm(pokemon.type2 || "") === tipo;
};

/**
 * Poder con el que la MT debe adjuntarse a ese Pokémon: el de la carta, +1 si
 * le corresponde el bono de tipo.
 *
 * Se resuelve AQUÍ, al adjuntar, y no en el cálculo de la batalla, porque es
 * como ya funciona el resto del juego: la tabla `attacks` guarda las dos
 * variantes de cada ataque (`Dazzling Gleam` poder 2 y `Dazzling Gleam (S)`
 * poder 3) y quien asigna el ataque elige fila. El bonus que sí se calcula en
 * batalla (`checkBonusType`) es otra cosa: la efectividad contra el rival,
 * que depende de con quién combates y por eso no puede fijarse antes.
 */
export const tmPowerFor = (tm, pokemon) =>
  tm.poder + (tmAppliesStab(tm, pokemon) ? 1 : 0);

/** Índice por nombre de movimiento. Los 291 nombres son únicos entre tipos. */
const TMS_BY_NAME = TMS.reduce((acc, t) => {
  acc[norm(t.nombre)] = t;
  return acc;
}, {});

/**
 * Localiza la carta de una MT ya adjuntada a un Pokémon.
 *
 * El backend guarda la MT en `pokemon.attack3` como {name, type, strength}.
 * Desde que el catálogo alimenta el attach, `name` es el nombre real del
 * movimiento y basta para encontrar la carta. Las MTs adjuntadas antes de eso
 * llevan el genérico "TM": ahí no hay carta que mostrar y se devuelve null,
 * para que la UI caiga al icono sin ficha.
 *
 * @param {{name?: string, type?: string}} attack el `attack3` del Pokémon
 * @returns {object|null} la MT del catálogo, o null si no es identificable
 */
export const findTMByAttack = (attack) => {
  if (!attack || !attack.name) return null;
  const tm = TMS_BY_NAME[norm(attack.name)];
  if (!tm) return null;
  // El tipo confirma el acierto: si no cuadra, el ataque no es esta carta.
  if (attack.type && norm(attack.type) !== norm(tm.tipo)) return null;
  return tm;
};

export default TMS;
