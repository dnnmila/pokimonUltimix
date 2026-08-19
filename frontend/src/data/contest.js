// ─────────────────────────────────────────────────────────────────────────────
//  Concurso Pokémon: cómo se puntúa.
//
//  Es la mecánica más simple del juego y por eso no pasa por el motor de
//  batalla: no se elige ataque, no hay tipos, ni bonos, ni nivel. Solo esto:
//
//    poder del concurso = suma del poder de sus movimientos
//    total             = poder del concurso + los dados que se tiren
//
//  con dos reglas de la carta:
//
//    · Un movimiento de poder 0 (los `0`, `*` y `0*` de las cartas físicas)
//      vale 2. En la DB todos ellos son POWER <= 0.
//    · Los objetos adjuntos NO cuentan. En este proyecto adjuntar un objeto ya
//      tapa el tercer movimiento (`addAttach` lo deja en 'NONE'), salvo la MT y
//      el Cristal Z, que dejan un ataque de verdad en ese hueco: ese es el que
//      hay que descartar aquí.
//
//  Gana el total más alto. El empate no lo cubre la carta, así que se queda en
//  empate: ni premio ni castigo.
// ─────────────────────────────────────────────────────────────────────────────

/** Poder con el que entra un movimiento de poder 0 (`0`, `*`, `0*`). */
export const ZERO_MOVE_VALUE = 2;

/** Hueco sin movimiento: el que nunca tuvo, o el que tapó un objeto. */
export const isEmptyMove = (attack) =>
    !attack || !attack.name || attack.name === 'NONE' || attack.id === '000';

/** Los objetos que dejan un ataque en el tercer hueco en vez de vaciarlo. */
const ATTACH_AS_MOVE = ['MT', 'Z'];

/**
 * El desglose de los tres movimientos, para poder enseñar la cuenta y no solo
 * el resultado. Cada renglón dice cuánto suma y por qué.
 *
 *   { slot, attack, value, boosted, skipped }
 *     boosted → era de poder 0 y entra con ZERO_MOVE_VALUE
 *     skipped → no cuenta: hueco vacío ('empty') u objeto adjunto ('attach')
 */
export const contestRows = (pkm) => {
    if (!pkm) return [];
    return [1, 2, 3].map(slot => {
        const attack = pkm[`attack${slot}`];
        if (slot === 3 && ATTACH_AS_MOVE.includes(pkm.attach)) {
            return { slot, attack, value: 0, boosted: false, skipped: 'attach' };
        }
        if (isEmptyMove(attack)) {
            return { slot, attack, value: 0, boosted: false, skipped: 'empty' };
        }
        const power = Number(attack.strength) || 0;
        return {
            slot,
            attack,
            value: power <= 0 ? ZERO_MOVE_VALUE : power,
            boosted: power <= 0,
            skipped: null,
        };
    });
};

/** El poder de concurso de un Pokémon: la suma del desglose. */
export const contestPower = (pkm) =>
    contestRows(pkm).reduce((total, row) => total + row.value, 0);

/** Suma de los dados tirados (los huecos sin tirar valen 0). */
export const diceSum = (rows) => (rows || []).reduce((a, v) => a + (v || 0), 0);

/** 'win' | 'lose' | 'tie' comparando los dos totales. */
export const contestVerdict = (mine, theirs) =>
    mine > theirs ? 'win' : mine < theirs ? 'lose' : 'tie';
