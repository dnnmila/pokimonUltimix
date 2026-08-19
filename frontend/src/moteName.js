// ─────────────────────────────────────────────────────────────────────────────
//  Mote: el nombre que le pone el jugador a su Pokémon.
//
//  Es SOLO presentación. `pokemon.name` no se toca nunca porque de él dependen
//  cosas que sí son lógica: el movimiento especial de los cristales Z (se busca
//  por nombre exacto de especie), los sprites que se resuelven por nombre en la
//  pantalla de selección, y el historial de estados que alimenta ProgressChart.
//  Por eso todo pasa por aquí: `displayName` para pintar, `pkm.name` para todo
//  lo demás.
//
//  En el historial se deja el nombre real a propósito: si alguien renombra a
//  medio juego, las entradas viejas quedarían hablando de un Pokémon que ya no
//  se llama así.
// ─────────────────────────────────────────────────────────────────────────────

// Mismo tope que el backend (Backend/models/Pokemons.js).
export const MOTE_MAX_LENGTH = 18;

export const moteOf = (pkm) => (pkm?.mote || '').trim();

export const hasMote = (pkm) => moteOf(pkm).length > 0;

// Lo que se pinta en pantalla: el mote si lo hay, si no el nombre de siempre.
export const displayName = (pkm) => hasMote(pkm) ? moteOf(pkm) : (pkm?.name || '');

// El nombre real nunca se pierde de vista: vive en el tooltip.
export const nameTitle = (pkm) =>
    hasMote(pkm) ? `${moteOf(pkm)} — ${pkm.name}` : (pkm?.name || '');
