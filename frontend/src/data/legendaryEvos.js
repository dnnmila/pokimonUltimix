// ─────────────────────────────────────────────────────────────────────────────
//  Formas legendarias del «Legendary Evo. Item» de la tienda.
//
//  Es otra cosa que una mega: la piedra mega crea una carta APARTE en
//  `player.megas` y en batalla eliges con cuál subes; este objeto TRANSFORMA al
//  Pokémon en sitio —Zacian pasa a ser Crown Sword Zacian— y solo mientras lo
//  lleve adjunto. Al quitárselo (o al ponerle una MT, un cristal Z o un orbe,
//  que ocupan el mismo hueco) vuelve a su forma base.
//
//  Aquí solo hace falta saber QUÉ formas ofrece cada base y cómo llamarlas en
//  el selector: los tipos, el nivel y los ataques los monta el backend desde la
//  base de datos, que es donde viven.
//
//  Gemela de Backend/data/legendaryEvos.js, que es quien valida la petición y
//  arma la forma. Si se toca una, se toca la otra.
// ─────────────────────────────────────────────────────────────────────────────

// Las fusiones (Reshiram, Zekrom, Solgaleo, Lunala) llevan a formas que también
// salen de Kyurem y de Necrozma. Que la misma forma aparezca dos veces aquí no
// las mezcla: cada Pokémon transformado recuerda de cuál salió, así que un
// Reshiram convertido en White Kyurem vuelve a ser Reshiram.
export const LEGENDARY_EVOS = {
    '0382': [{ pokedex: 'M0382',  name: 'Primal-Blue Kyogre' }],
    '0383': [{ pokedex: 'M0383',  name: 'Primal-Red Groudon' }],
    '0643': [{ pokedex: 'W0646',  name: 'White Kyurem' }],
    '0644': [{ pokedex: 'B0646',  name: 'Black Kyurem' }],
    '0646': [{ pokedex: 'B0646',  name: 'Black Kyurem' },
             { pokedex: 'W0646',  name: 'White Kyurem' }],
    '0720': [{ pokedex: 'U0720',  name: 'Hoopa Unbound' }],
    '0791': [{ pokedex: 'DM0800', name: 'Dusk Mane Necrozma' }],
    '0792': [{ pokedex: 'DW0800', name: 'Dawn Wings Necrozma' }],
    '0800': [{ pokedex: 'DM0800', name: 'Dusk Mane Necrozma' },
             { pokedex: 'DW0800', name: 'Dawn Wings Necrozma' },
             { pokedex: 'U0800',  name: 'Ultra Necrozma' }],
    '0888': [{ pokedex: 'C0888',  name: 'Crown Sword Zacian' }],
    '0889': [{ pokedex: 'C0889',  name: 'Crown Shiled Zamazenta' }],
};

// Formas que puede tomar el Pokémon que se está mirando. Vacío = el objeto no
// le sirve, así que la carta ni se ofrece.
//
// Un Pokémon YA transformado sigue devolviendo las de su base: es lo que deja
// cambiar de Black a White Kyurem sin pasar por quitarle el objeto antes.
export const legendaryFormsFor = (pkm) => {
    if (!pkm) return [];
    return LEGENDARY_EVOS[pkm.legendaryBase || pkm.pokedex] || [];
};

// Un Pokémon está transformado si lleva el marcador que estampa el backend.
export const isLegendaryForm = (pkm) => Boolean(pkm?.legendaryBase);

// Para qué le sirve el objeto a este Pokémon. Son dos usos distintos y conviene
// no confundirlos, porque el objeto se comporta al revés en cada uno:
//
//   'form'   → lo transforma mientras lo lleve puesto, y al quitárselo vuelve
//              atrás. Es el caso de las once especies de la tabla de arriba.
//   'evolve' → no lo transforma: le habilita la evolución que por nivel no
//              tiene (Zygarde 10% → 50% → Complete, fichas con MEGA='evo'), y
//              se GASTA al evolucionar. Antes lo hacía la piedra mega.
//   null     → no le sirve, y su carta ni se ofrece.
export const legendaryUse = (pkm) => {
    if (!pkm) return null;
    if (legendaryFormsFor(pkm).length > 0) return 'form';
    if (pkm.mega === 'evo') return 'evolve';
    return null;
};

export default LEGENDARY_EVOS;
