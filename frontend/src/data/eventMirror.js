// ─────────────────────────────────────────────────────────────────────────────
//  Espejo de eventos: el contrato entre la tablet y la tabla de /players.
//
//  El modal de cada evento publica una FOTO de lo que está enseñando y
//  EventMirrorModal la repinta. La foto es deliberadamente pobre —lo que se ve
//  de lejos y poco más— por dos motivos: que los 7 eventos quepan en el MISMO
//  panel (si cada uno trajera su forma, el espejo serían 7 maquetaciones), y
//  que por el socket no viaje la partida entera cada vez que alguien toca un
//  color.
//
//  Nada de esto es estado de juego. El espejo se puede perder, llegar tarde o
//  quedarse corto sin que la partida se entere.
//
//  La foto:
//    {
//      event,   // id de SIM_EVENTS: de ahí saca el espejo el nombre y el color
//      closed,  // true = quitar el espejo (ver setEventMirror en el backend)
//      status,  // una línea en español: en qué paso va la cosa
//      color,   // id de color de token elegido, o null
//      type,    // tipo elegido (solo el subsuelo), o null
//      main,    // el protagonista: jefe, salvaje, rival… o null
//      vs,      // el otro lado, cuando hay dos (el concurso), o null
//      list,    // fila de acompañantes: equipo de la incursión, orden de la
//               // horda, los dos rivales del entrenador… o []
//      score,   // marcador { mine, theirs, mineLabel, theirsLabel } o null
//    }
// ─────────────────────────────────────────────────────────────────────────────

// Un Pokémon reducido a lo que el espejo pinta. `label` es el cartelito de
// encima (Jefe, Salvaje, Rival 1…), que lo pone quien publica porque depende
// del evento, no del Pokémon.
//
// Las entradas de `list` admiten además dos campos sueltos, que se añaden a
// mano sobre lo que devuelve esta función:
//   badge → una marca redonda encima del token. Hoy la usa el rodaje para la
//           cara del D6 que saca a cada Prop.
//   on    → cuál de la fila es el elegido. Si alguna lo trae, el espejo apaga
//           las demás, que es como se lee de un vistazo qué salió.
export const mirrorPkm = (p, label = null) => {
    if (!p) return null;
    return {
        pokedex: p.pokedex || null,
        name: p.name || '',
        type1: p.type1 || null,
        type2: p.type2 || null,
        // La incursión y la horda trabajan con fichas ya montadas, que traen el
        // nivel en `totalLevel`; los sorteos crudos de /random-pokemon solo
        // traen `level`.
        level: p.totalLevel ?? p.level ?? null,
        tokenColor: p.tokenColor || null,
        label,
    };
};

// Azúcar para no repetir el objeto entero en los siete modales.
export const mirrorView = (event, status, extra = {}) => ({
    event,
    status,
    color: null,
    type: null,
    main: null,
    vs: null,
    list: [],
    score: null,
    ...extra,
});

// Lo que se manda al cerrar. Va con el `event` a propósito: el backend compara
// el id antes de borrar, para que al saltar de un evento a otro el «cerré
// aquel» no se lleve por delante el que se acaba de abrir.
export const mirrorClosed = (event) => ({ event, closed: true });
