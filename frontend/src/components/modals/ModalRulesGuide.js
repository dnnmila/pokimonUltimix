import React, { useState } from 'react';
import { MAX_MOVE_LIST, maxEffectText } from '../../data/maxMoves';
import { typeColor, typeLabel } from '../../pokemonTypes';

const getImg = (path) => {
    try { return require(`../../images/${path}`); } catch { return null; }
};
const getFieldImg = (name) => {
    try { return require(`../../images/Field Moves/${name}.png`); } catch { return null; }
};
const getStatusImg = (name) => {
    try { return require(`../../images/Status Cards/${name}.png`); } catch { return null; }
};

// ── Iconos Blancos (afectan al usuario) ──────────────────────────────────────
const WHITE_EFFECTS = [
    {
        key: 'Advantage',
        icon: 'Effects/White/2Dice 3.png',
        en: { name: 'ADVANTAGE',          desc: 'User rolls 1 extra attack die and discards the lowest result.' },
        es: { name: 'VENTAJA',            desc: 'Tira 1 dado extra y descarta el resultado más bajo.' },
    },
    {
        key: 'DoubleAdvantage',
        icon: 'Effects/White/3Dice 3.png',
        en: { name: 'DOUBLE ADVANTAGE',   desc: 'User rolls 2 extra attack dice and discards the two lowest results.' },
        es: { name: 'DOBLE VENTAJA',      desc: 'Tira 2 dados extra y descarta los dos resultados más bajos.' },
    },
    {
        key: 'OwnFaint',
        icon: 'Effects/White/KO 3.png',
        en: { name: 'K.O. (SELF)',        desc: 'User faints at the end of the round.' },
        es: { name: 'K.O. (PROPIO)',      desc: 'El usuario se desmaya al final de la ronda.' },
    },
    {
        key: 'OwnSwitchout',
        icon: 'Effects/White/Switch.png',
        en: { name: 'SWITCHOUT (SELF)',   desc: 'After applying opponent\'s effects, user is switched out. The switched-in Pokémon uses this move for this round.' },
        es: { name: 'CAMBIO (PROPIO)',    desc: 'Luego de aplicar los efectos del oponente, el usuario es cambiado. El que entra usa este movimiento en esta ronda.' },
    },
    {
        key: 'OwnConfusion',
        icon: 'Effects/White/Confused 3.png',
        en: { name: 'CONFUSION (SELF)',   desc: 'User gains the Confused status.' },
        es: { name: 'CONFUSIÓN (PROPIO)', desc: 'El usuario gana el estado Confuso.' },
    },
    {
        key: 'Priority',
        icon: 'Effects/White/Priority.png',
        en: { name: 'PRIORITY',           desc: 'Any effects from the opponent that target the user are ignored until end of round. No effect if opponent has Protection.' },
        es: { name: 'PRIORIDAD',          desc: 'Los efectos del oponente que afecten al usuario son ignorados hasta el final de la ronda. Sin efecto si el oponente tiene Protección.' },
    },
    {
        key: 'StatDown',
        icon: 'Effects/White/StatDown.png',
        en: { name: 'STAT DOWN',          desc: 'Beginning next battle round, user gains Disadvantage until the end of the battle (or until switched out).' },
        es: { name: 'BAJA DE STAT',       desc: 'A partir de la siguiente ronda, el usuario tiene Desventaja hasta el final de la batalla (o hasta ser cambiado).' },
    },
    {
        key: 'IgnoreType',
        icon: 'Effects/White/Ignore Type.png',
        en: { name: 'IGNORE TYPE',        desc: 'Do not apply any type effectiveness bonuses/penalties to this move.' },
        es: { name: 'IGNORAR TIPO',       desc: 'No aplica bonificaciones ni penalizaciones de tipo a este movimiento.' },
    },
    {
        key: 'Recharge',
        icon: 'Effects/White/Recharge.png',
        en: { name: 'RECHARGE',           desc: 'Once used, the user cannot select this move for the rest of the battle or until switched out.' },
        es: { name: 'RECARGA',            desc: 'Una vez usado, el usuario no puede seleccionar este movimiento por el resto de la batalla o hasta ser cambiado.' },
    },
    {
        key: 'Protection',
        icon: 'Effects/White/Protection.png',
        en: { name: 'PROTECTION',         desc: 'This round, the Attack Strength of the opponent\'s move becomes 0 and all move effects that target the user are ignored.' },
        es: { name: 'PROTECCIÓN',         desc: 'Esta ronda, la Fuerza de Ataque del oponente se vuelve 0 y todos los efectos que apunten al usuario son ignorados.' },
    },
    {
        key: 'Reversal',
        icon: 'Effects/White/Reversal.png',
        en: { name: 'REVERSAL',           desc: 'User adds the Attack Strength of the opponent\'s selected move to this move.' },
        es: { name: 'CONTRAATAQUE',       desc: 'El usuario suma la Fuerza de Ataque del movimiento del oponente a este movimiento.' },
    },
    {
        key: 'Repeat',
        icon: 'Effects/White/Repeat.png',
        en: { name: 'REPEAT',             desc: 'The Attack Strength of this move increases by 1 for each successive round it has been used this battle, up to 3 times.' },
        es: { name: 'REPETIR',            desc: 'La Fuerza de Ataque aumenta +1 por cada ronda consecutiva que se use, hasta 3 veces.' },
    },
    {
        key: 'Enraged',
        icon: 'Effects/White/Rage.png',
        en: { name: 'ENRAGED',            desc: 'User gains Advantage this round if the opposing Pokémon uses a move with Attack Strength greater than 0.' },
        es: { name: 'ENFURECIDO',         desc: 'El usuario obtiene Ventaja esta ronda si el oponente usa un movimiento con Fuerza mayor a 0.' },
    },
    {
        key: 'AddDie',
        icon: 'Effects/White/AddDice 3.png',
        en: { name: 'ADD DIE',            desc: 'User rolls an extra attack die and the results are added together.' },
        es: { name: 'DADO EXTRA',         desc: 'El usuario tira un dado extra y los resultados se suman.' },
    },
    {
        key: 'D4',
        icon: 'Effects/White/d4.png',
        en: { name: 'D4',                 desc: 'User must roll a 4-sided die for their attack roll.' },
        es: { name: 'D4',                 desc: 'El usuario debe usar un dado de 4 caras para su lanzamiento de ataque.' },
    },
    {
        key: 'HighCrit',
        icon: 'Effects/White/High Crit.png',
        en: { name: 'HIGH CRIT (D8)',     desc: 'User must roll an 8-sided die for the attack roll (treating 7 as a 5 and 8 as a 6).' },
        es: { name: 'CRIT ALTO (D8)',     desc: 'El usuario debe usar un dado de 8 caras (tratando 7 como 5 y 8 como 6).' },
    },
    {
        key: 'HalfLevelSelf',
        icon: null,
        en: { name: '1/2 LEVEL (SELF)',   desc: 'The Attack Strength of this move is equal to half the level of the user (rounded down).' },
        es: { name: '½ NIVEL (PROPIO)',   desc: 'La Fuerza de Ataque es igual a la mitad del nivel del usuario (redondeado hacia abajo).' },
    },
    {
        key: 'LifeRecovery',
        icon: 'Effects/White/Life Drain.png',
        en: { name: 'LIFE RECOVERY',      desc: 'Add 1/3 of the user\'s Attack Roll (rounded down) to the final total.' },
        es: { name: 'RECUPERACIÓN',       desc: 'Suma 1/3 del resultado del dado de ataque del usuario (redondeado hacia abajo) al total final.' },
    },
    {
        key: 'ConditionBoost',
        icon: 'Effects/White/Condition Boost.png',
        en: { name: 'CONDITION BOOST',    desc: 'This move gains 1 Attack Strength this round if the opponent has a status condition during your attack roll.' },
        es: { name: 'IMPULSO X ESTADO',   desc: 'Este movimiento gana +1 Fuerza si el oponente tiene un estado alterado durante tu lanzamiento.' },
    },
    {
        key: 'Revival',
        icon: 'Effects/White/Revival.png',
        en: { name: 'REVIVAL',            desc: 'Revive a Pokémon on the user\'s team immediately after effect die rolls. Only one Pokémon per battle, per team.' },
        es: { name: 'REVIVIR',            desc: 'Revive un Pokémon del equipo del usuario. Solo una vez por batalla, por equipo.' },
    },
    {
        key: 'StatusHeal',
        icon: 'Effects/White/StatusHeal.png',
        en: { name: 'STATUS HEAL',        desc: 'Roll a 4-sided die. Remove that many statuses from the user\'s team immediately after effect die rolls.' },
        es: { name: 'CURAR ESTADOS',      desc: 'Tira un D4. Elimina ese número de estados del equipo del usuario inmediatamente.' },
    },
];

// ── Iconos Negros (afectan al oponente) ──────────────────────────────────────
const BLACK_EFFECTS = [
    {
        key: 'Disadvantage',
        icon: 'Effects/Black/2Dice 3.png',
        en: { name: 'DISADVANTAGE',           desc: 'Opponent rolls 1 extra attack die and discards the highest result.' },
        es: { name: 'DESVENTAJA',             desc: 'El oponente tira 1 dado extra y descarta el resultado más alto.' },
    },
    {
        key: 'DoubleDisadv',
        icon: 'Effects/Black/3Dice 3.png',
        en: { name: 'DOUBLE DISADVANTAGE',    desc: 'Opponent rolls 2 extra attack dice and discards the 2 highest results.' },
        es: { name: 'DOBLE DESVENTAJA',       desc: 'El oponente tira 2 dados extra y descarta los dos resultados más altos.' },
    },
    {
        key: 'KOOpponent',
        icon: 'Effects/Black/KO 3.png',
        en: { name: 'K.O. (OPPONENT)',        desc: 'Opponent Pokémon faints at the end of the round.' },
        es: { name: 'K.O. (OPONENTE)',        desc: 'El Pokémon oponente se desmaya al final de la ronda.' },
    },
    {
        key: 'SwitchOpponent',
        icon: 'Effects/Black/Switch.png',
        en: { name: 'SWITCHOUT (OPPONENT)',   desc: 'Before applying effects, the opponent is switched out at random. Does not apply to wild Pokémon, Gym Leaders, or Pokémon with Priority or Protection.' },
        es: { name: 'CAMBIO (OPONENTE)',      desc: 'Antes de aplicar sus efectos, el oponente es cambiado al azar. No aplica a salvajes, Líderes, ni Pokémon con Prioridad o Protección.' },
    },
    {
        key: 'BlockItem',
        icon: 'Effects/Black/Block Item.png',
        en: { name: 'BLOCK ITEM',             desc: 'Opponent Pokémon cannot make use of their attach card for the remainder of the battle or until switched out.' },
        es: { name: 'BLOQUEAR OBJETO',        desc: 'El oponente no puede usar su carta de objeto durante el resto de la batalla o hasta ser cambiado.' },
    },
    {
        key: 'EscapePrev',
        icon: 'Effects/Black/Esc Prevention.png',
        en: { name: 'ESCAPE PREVENTION',      desc: 'For the rest of the battle, the opponent Pokémon cannot be switched out.' },
        es: { name: 'EVITAR HUÍDA',           desc: 'Por el resto de la batalla, el Pokémon oponente no puede ser cambiado.' },
    },
    {
        key: 'ConfusionOpp',
        icon: 'Effects/Black/Confused 3.png',
        en: { name: 'CONFUSION (OPPONENT)',   desc: 'Opponent gains the Confused status.' },
        es: { name: 'CONFUSIÓN (OPP)',        desc: 'El oponente gana el estado Confuso.' },
    },
    {
        key: 'Burn',
        icon: 'Effects/Black/Burned 3.png',
        en: { name: 'BURN',                   desc: 'Opponent gains the Burned status.' },
        es: { name: 'QUEMADO',                desc: 'El oponente gana el estado Quemado.' },
    },
    {
        key: 'Freeze',
        icon: 'Effects/Black/Frozen 3.png',
        en: { name: 'FREEZE',                 desc: 'Opponent gains the Frozen status.' },
        es: { name: 'CONGELADO',              desc: 'El oponente gana el estado Congelado.' },
    },
    {
        key: 'Poison',
        icon: 'Effects/Black/Poison 3.png',
        en: { name: 'POISON',                 desc: 'Opponent gains the Poisoned status.' },
        es: { name: 'ENVENENADO',             desc: 'El oponente gana el estado Envenenado.' },
    },
    {
        key: 'Sleep',
        icon: 'Effects/Black/Sleep 3.png',
        en: { name: 'SLEEP',                  desc: 'Opponent gains the Sleep status.' },
        es: { name: 'DORMIDO',                desc: 'El oponente gana el estado Dormido.' },
    },
    {
        key: 'Curse',
        icon: 'Effects/Black/Curse.png',
        en: { name: 'CURSE',                  desc: 'Opponent gains the Cursed status.' },
        es: { name: 'MALDITO',                desc: 'El oponente gana el estado Maldito.' },
    },
    {
        key: 'Paralyze',
        icon: 'Effects/Black/Paralyse 3.png',
        en: { name: 'PARALYZE',               desc: 'Opponent gains the Paralyzed status.' },
        es: { name: 'PARALIZADO',             desc: 'El oponente gana el estado Paralizado.' },
    },
    {
        key: 'HalfLevelOpp',
        icon: null,
        en: { name: '1/2 LEVEL (OPPONENT)',   desc: 'The Attack Strength of this move is equal to half the level of the opponent (rounded down).' },
        es: { name: '½ NIVEL (OPP)',          desc: 'La Fuerza de Ataque es igual a la mitad del nivel del oponente (redondeado hacia abajo).' },
    },
];

// ── Movimientos de Campo ──────────────────────────────────────────────────────
const FIELD_MOVES = [
    { key: 'Electric Terrain', en: 'Electric Terrain', es: 'Terreno Eléctrico' },
    { key: 'Grassy Terrain',   en: 'Grassy Terrain',   es: 'Terreno Herboso'   },
    { key: 'Hail',             en: 'Hail',             es: 'Granizo'           },
    { key: 'Harsh Sunlight',   en: 'Harsh Sunlight',   es: 'Luz Solar Intensa' },
    { key: 'Mist',             en: 'Mist',             es: 'Niebla'            },
    { key: 'Misty Terrain',    en: 'Misty Terrain',    es: 'Terreno Neblinoso' },
    { key: 'Psychic Terrain',  en: 'Psychic Terrain',  es: 'Terreno Psíquico'  },
    { key: 'Rain',             en: 'Rain',             es: 'Lluvia'            },
    { key: 'Renewal',          en: 'Renewal',          es: 'Renovación'        },
    { key: 'Safeguard',        en: 'Safeguard',        es: 'Salvaguarda'       },
    { key: 'Sandstorm',        en: 'Sandstorm',        es: 'Tormenta de Arena' },
    { key: 'Spikes',           en: 'Spikes',           es: 'Trampa Rocas'      },
    { key: 'Stealth Rock',     en: 'Stealth Rock',     es: 'Roca Sigilo'       },
    { key: 'Toxic Spikes',     en: 'Toxic Spikes',     es: 'Tóxico Trampa'     },
];

// ── Estados ───────────────────────────────────────────────────────────────────
const STATUS_CARDS = [
    { key: 'Burned',      en: 'Burned',       es: 'Quemado'       },
    { key: 'Confused',    en: 'Confused',     es: 'Confuso'        },
    { key: 'Cursed',      en: 'Cursed',       es: 'Maldito'        },
    { key: 'Frozen',      en: 'Frozen',       es: 'Congelado'      },
    { key: 'Paralyzed 1', en: 'Paralyzed (1)',es: 'Paralizado (1)' },
    { key: 'Paralyzed 2', en: 'Paralyzed (2)',es: 'Paralizado (2)' },
    { key: 'Poisoned',    en: 'Poisoned',     es: 'Envenenado'     },
    { key: 'Sleep 1',     en: 'Sleep (1)',    es: 'Dormido (1)'    },
    { key: 'Sleep 2',     en: 'Sleep (2)',    es: 'Dormido (2)'    },
];

// ── Efectos Especiales ────────────────────────────────────────────────────────
const SPECIAL_EFFECTS = [
    { name: 'Aura Wheel',              en: 'If Morpeko uses this move, it must change to its alternate form at the end of this battle round.',                                                                                 es: 'Si Morpeko usa este movimiento, debe cambiar a su forma alternativa al final de la ronda.' },
    { name: 'Acrobatics',              en: 'Increase the Attack Strength of this move by 1 if the user does not have an Attach Item equipped.',                                                                               es: '+1 Fuerza si el usuario no tiene un objeto equipado.' },
    { name: 'Behemoth Bash/Blade',     en: 'Add 1 to the Attack Strength of this move if the opponent is Dynamaxed/Gigantamaxed.',                                                                                           es: '+1 Fuerza si el oponente está Dynamaxeado/Gigantamaxeado.' },
    { name: 'Beat Up',                 en: 'Attack Strength = number of non-fainted Pokémon in the user\'s party (not including the user, max 4). Wild/NPC: Attack Strength is 2.',                                          es: 'Fuerza = Pokémon no debilitados en el equipo (sin el usuario, máx. 4). Salvaje/NPC: Fuerza 2.' },
    { name: 'Brick Break',             en: 'User is immune to opponent move effects that cause Disadvantage.',                                                                                                                es: 'El usuario es inmune a los efectos de Desventaja del oponente.' },
    { name: 'Burning Jealousy',        en: 'If the opponent receives Advantage this round, they immediately gain the Burned status.',                                                                                         es: 'Si el oponente recibe Ventaja esta ronda, gana el estado Quemado.' },
    { name: 'Camouflage',              en: 'Roll the Type Die (or select a type at random) to determine the type of this move for the round.',                                                                               es: 'Lanza el Dado de Tipo (o elige al azar) para determinar el tipo de este movimiento.' },
    { name: 'Conversion',              en: 'Select one of the opponent Pokémon\'s moves. The type of your Pokémon becomes that type until the end of the battle.',                                                           es: 'Elige un movimiento del oponente. Tu Pokémon adopta ese tipo hasta el final de la batalla.' },
    { name: 'Conversion 2',            en: 'Select one of the opponent Pokémon\'s moves. Your Pokémon becomes a type of your choice that resists that type.',                                                                es: 'Elige un movimiento del oponente. Tu Pokémon adopta un tipo de tu elección que resista ese tipo.' },
    { name: 'Covet / Thief',           en: 'Steals the opponent\'s Attach Card until end of battle. You can use it, they cannot. Return at end of battle.',                                                                  es: 'Roba la carta de objeto del oponente. Puedes usarla, él no. Se devuelven al final.' },
    { name: 'Dark Void',               en: 'If the opponent has the Sleep status, this move gains 2 Attack Strength. Otherwise, the Attack Strength is 0.',                                                                  es: 'Si el oponente está Dormido: Fuerza 2. De lo contrario Fuerza 0.' },
    { name: 'Dire Claw',               en: 'Roll the Effect Die again. Odd = opponent gains Poisoned. Even = opponent gains Paralyzed.',                                                                                     es: 'Tira el dado de efecto de nuevo. Impar = Envenenado; Par = Paralizado.' },
    { name: 'Disable',                 en: 'Select one of the opponent Pokémon\'s moves. They cannot use that move for the rest of the battle. Takes effect before opponent selects a move.',                                es: 'Elige un movimiento del oponente. No puede usarlo por el resto de la batalla.' },
    { name: 'Dream Eater',             en: 'If the opponent has the Sleep status: Attack Strength 1 + Life Recovery. Otherwise, Attack Strength is 0.',                                                                      es: 'Si el oponente está Dormido: Fuerza 1 + Recuperación. De lo contrario Fuerza 0.' },
    { name: 'Dynamax Cannon',          en: 'Add 1 to the Attack Strength of this move if the opponent is Dynamaxed/Gigantamaxed.',                                                                                           es: '+1 Fuerza si el oponente está Dynamaxeado/Gigantamaxeado.' },
    { name: 'Encore',                  en: 'For the rest of the battle, opponent Pokémon can only select the move they selected this battle round.',                                                                          es: 'El oponente solo puede seleccionar el movimiento que usó esta ronda por el resto de la batalla.' },
    { name: 'Facade',                  en: 'This move gains 1 Attack Strength if the user has a status condition.',                                                                                                          es: '+1 Fuerza si el usuario tiene un estado alterado.' },
    { name: 'Fake Out',                en: 'The opponent has Disadvantage this round if this move is used on the user\'s first round in battle.',                                                                            es: 'El oponente tiene Desventaja si se usa en el primer turno del usuario en batalla.' },
    { name: 'False Swipe',             en: 'Add 1 to your Catch Roll if you defeated a wild Pokémon using this move.',                                                                                                       es: '+1 a tu Tirada de Captura si derrota a un Pokémon salvaje.' },
    { name: 'Fell Stinger',            en: 'If the user wins this battle round, they gain Double Advantage in the next battle round of this battle.',                                                                        es: 'Si el usuario gana esta ronda, obtiene Doble Ventaja en la siguiente.' },
    { name: 'Fire Fang',               en: 'Roll the Effect Die again. Odd = opponent gains Burned. Even = opponent has Disadvantage this battle round.',                                                                    es: 'Tira de nuevo. Impar = Quemado; Par = el oponente tiene Desventaja.' },
    { name: 'Fire/Grass/Water Pledge', en: 'Double the Attack Strength of this move if this team has used another Pledge this battle.',                                                                                      es: 'Dobla la Fuerza si el equipo ya usó otro Pledge esta batalla.' },
    { name: 'Flying Press',            en: 'User may treat this attack as Flying-type instead of Fighting-type.',                                                                                                            es: 'El usuario puede tratar este ataque como tipo Volador en lugar de Lucha.' },
    { name: 'Haze',                    en: 'Any move effects used by the opponent Pokémon that affect itself are ignored.',                                                                                                   es: 'Los efectos del oponente que le afecten a sí mismo son ignorados.' },
    { name: 'Heal Block',              en: 'Ignore all Life Recovery, Status Heal, and Revival effects that benefit the opponent for the rest of the battle.',                                                               es: 'Ignora Recuperación, Curar Estado y Revivir del oponente por el resto de la batalla.' },
    { name: 'Hidden Power',            en: 'The first time this move is used, roll the Type Die. This move becomes that type for the rest of the game.',                                                                     es: 'La primera vez que se usa, lanza el Dado de Tipo. Adopta ese tipo hasta el final.' },
    { name: 'Hydro Steam',             en: 'If the Harsh Sunlight field move card is in play, this move receives +1 Attack Strength instead of -1.',                                                                        es: 'Si Luz Solar Intensa está en juego, recibe +1 Fuerza en lugar de -1.' },
    { name: 'Ice Fang',                en: 'Roll the Effect Die again. Odd = opponent gains Frozen. Even = opponent has Disadvantage this battle round.',                                                                    es: 'Tira de nuevo. Impar = Congelado; Par = el oponente tiene Desventaja.' },
    { name: 'Judgement',               en: 'The type of this move is the same as the Type Booster card equipped. If none, roll the Type Die or choose Normal.',                                                             es: 'El tipo es el del Potenciador de Tipo equipado. Si ninguno, lanza el Dado de Tipo o elige Normal.' },
    { name: 'Lash Out',                en: 'If the user receives Disadvantage this round, increase the Attack Strength of this move by 1.',                                                                                 es: '+1 Fuerza si el usuario recibe Desventaja esta ronda.' },
    { name: 'Last Respects',           en: 'Attack Strength = number of fainted Pokémon in the user\'s party. Wild/NPC or no fainted: Attack Strength is 2.',                                                               es: 'Fuerza = Pokémon debilitados en el equipo. Salvaje/NPC o sin debilitados: Fuerza 2.' },
    { name: 'Magic Coat',              en: 'If the opponent\'s move effect(s) target the user, target them with the same effect(s). Does not prevent the effect from affecting the user.',                                   es: 'Si los efectos del oponente apuntan al usuario, también afectan al oponente.' },
    { name: 'Make It Rain / Pay Day',  en: 'User draws a card from the Item Deck or collects 3 PokéCoins at the end of the battle (once per battle, player-owned only).',                                                   es: 'Toma una carta de objetos o recibe 3 PokéMonedas al final de la batalla (solo una vez).' },
    { name: 'Metronome',               en: 'Draw a Pokémon token matching the color of this token. This Pokémon uses the first move on that token. Return the drawn token.',                                                 es: 'Saca un token del mismo color. El Pokémon usa el primer movimiento de ese token. Devuélvelo.' },
    { name: 'Mighty Cleave',           en: 'If the opponent uses a move with Protection, ignore the Protection effect and their Attack Strength is 0.',                                                                      es: 'Si el oponente tiene Protección, ignórala y su Fuerza es 0.' },
    { name: 'Mimic',                   en: 'Mimic becomes the move used by the opponent in the previous round for the rest of this battle (if first round: Attack Strength 0).',                                            es: 'Se convierte en el movimiento del oponente de la ronda anterior (si es la primera: Fuerza 0).' },
    { name: 'Multi-Attack',            en: 'Roll the Type Die (or select a type at random). This move becomes that type for the rest of this battle.',                                                                       es: 'Lanza el Dado de Tipo (o elige). Este movimiento adopta ese tipo por el resto de la batalla.' },
    { name: 'Nature Power',            en: 'Roll the Nature Power die. This move becomes that move for this battle round.',                                                                                                  es: 'Lanza el dado de Poder Natural. Este movimiento se convierte en ese movimiento esta ronda.' },
    { name: 'Nihil Light',             en: 'Ignore type effectiveness of this move when used against Fairy-type Pokémon.',                                                                                                   es: 'Ignora la efectividad de tipo cuando se usa contra Pokémon tipo Hada.' },
    { name: 'No Retreat',              en: 'User cannot be switched out for the rest of the battle.',                                                                                                                        es: 'El usuario no puede ser cambiado por el resto de la batalla.' },
    { name: 'Octolock',                en: 'The opponent Pokémon has Disadvantage for the rest of the battle.',                                                                                                              es: 'El Pokémon oponente tiene Desventaja por el resto de la batalla.' },
    { name: 'Odor Sleuth',             en: 'User ignores both Disadvantage caused by and type effectiveness against Ghost-type Pokémon for the rest of the battle.',                                                        es: 'El usuario ignora Desventaja y efectividad de tipo contra Pokémon tipo Fantasma.' },
    { name: 'Order Up',                en: 'Increase the Attack Strength of this move by 2 if Tatsugiri is in the user\'s party.',                                                                                          es: '+2 Fuerza si Tatsugiri está en el equipo del usuario.' },
    { name: 'Payback',                 en: 'This move\'s Attack Strength is increased by 1 if the opponent uses a Battle Card or makes use of their Attach Card.',                                                           es: '+1 Fuerza si el oponente usa una Carta de Batalla o su carta de objeto.' },
    { name: 'Perish Song',             en: 'User gains the Cursed status.',                                                                                                                                                  es: 'El usuario gana el estado Maldito.' },
    { name: 'Plasma Fists',            en: 'All Normal-type moves become Electric-type for this battle.',                                                                                                                    es: 'Todos los movimientos tipo Normal se convierten en tipo Eléctrico para esta batalla.' },
    { name: 'Poltergeist',             en: 'If the opponent has an Attach Card: Attack Strength 3. If they do not: Attack Strength 0.',                                                                                     es: 'Si el oponente tiene objeto: Fuerza 3. Si no: Fuerza 0.' },
    { name: 'Psyblade',                en: 'If the Electric Terrain field move card is in play, this move receives +1 Attack Strength.',                                                                                     es: '+1 Fuerza si la carta Terreno Eléctrico está en juego.' },
    { name: 'Psychic Fangs',           en: 'User is immune to opponent move effects that cause Disadvantage.',                                                                                                               es: 'El usuario es inmune a los efectos de Desventaja del oponente.' },
    { name: 'Psycho Shift',            en: 'Take a Status Condition from a Pokémon on your team and attach it to the opponent Pokémon.',                                                                                    es: 'Toma un estado de tu equipo y asígnalo al oponente.' },
    { name: 'Rest',                    en: 'After the battle round, user discards any attached status and gains the Sleep status with a counter of 2.',                                                                      es: 'Después de la ronda, el usuario descarta su estado y gana el estado Dormido con contador 2.' },
    { name: 'Retaliate',               en: 'Increase the Attack Strength of this attack by 1 if any Pokémon on the user\'s team have fainted in this battle.',                                                              es: '+1 Fuerza si algún Pokémon del equipo se debilitó en esta batalla.' },
    { name: 'Salt Cure',               en: 'This move is considered Effective against Steel and Water types.',                                                                                                               es: 'Este movimiento se considera Efectivo contra tipos Acero y Agua.' },
    { name: 'Secret Power',            en: 'Roll the Effect Die again: 1=Paralyzed, 2=Disadvantage, 3=Confused, 4=Poisoned, 5=Sleep, 6=User gains Advantage.',                                                             es: 'Tira de nuevo: 1=Paralizado, 2=Desventaja, 3=Confuso, 4=Envenenado, 5=Dormido, 6=Ventaja al usuario.' },
    { name: 'Sketch',                  en: 'Select one of the opponent Pokémon\'s moves. This move becomes that move until the end of the game.',                                                                            es: 'Elige un movimiento del oponente. Este movimiento se convierte en ese hasta el final.' },
    { name: 'Sleep Talk',              en: 'Randomly select one of this Pokémon\'s other moves to use this round. Can only be selected if the user has the Sleep status.',                                                  es: 'Selecciona aleatoriamente otro movimiento. Solo usable si el usuario está Dormido.' },
    { name: 'Smelling Salts',          en: 'After this round, the opponent discards their Status Condition (if applicable).',                                                                                                es: 'Después de la ronda, el oponente descarta su estado alterado (si aplica).' },
    { name: 'Snatch',                  en: 'If the opponent Pokémon\'s chosen move would give it Advantage, the user gains Advantage instead of the opponent.',                                                             es: 'Si el movimiento del oponente le daría Ventaja, el usuario la gana en su lugar.' },
    { name: 'Snore',                   en: 'This move can be selected even if the user has the Sleep status.',                                                                                                               es: 'Este movimiento puede seleccionarse incluso si el usuario tiene el estado Dormido.' },
    { name: 'Spectral Thief',          en: 'If opponent\'s move would give it Advantage/Double Advantage, user gains same effect. If it would give user Disadvantage, opponent receives it instead.',                       es: 'Roba Ventaja/Doble Ventaja del oponente. Si iba a darte Desventaja, la recibe él en cambio.' },
    { name: 'Spit Up',                 en: 'Roll a D4. Attack Strength = result. If user has no Attach Card: Attack Strength 0. User cannot use their attach card for this battle.',                                        es: 'Tira D4. Fuerza = resultado. Sin objeto: Fuerza 0. El usuario no puede usar su objeto este turno.' },
    { name: 'Steel Roller',            en: 'If no Field Move Card was in play at the beginning of this round: Attack Strength 2. If there was one: Attack Strength 4.',                                                     es: 'Sin carta de Campo al inicio: Fuerza 2. Con carta de Campo: Fuerza 4.' },
    { name: 'Switcheroo / Trick',      en: 'Switch user\'s Attach Card with the opponent\'s Attach Card for the rest of the battle. Return at end of battle.',                                                              es: 'Intercambia la carta de objeto del usuario con la del oponente por el resto de la batalla.' },
    { name: 'Taunt',                   en: 'If possible, the opponent cannot select a move with Attack Strength 0 until end of battle. Takes effect before opponent selects a move.',                                        es: 'El oponente no puede seleccionar un movimiento con Fuerza 0. Ocurre antes de que seleccione.' },
    { name: 'Techno Blast',            en: 'Roll the Effect Die again: 1-2=Normal, 3=Fire, 4=Ice, 5=Water, 6=Electric.',                                                                                                    es: 'Tira de nuevo: 1-2=Normal, 3=Fuego, 4=Hielo, 5=Agua, 6=Eléctrico.' },
    { name: 'Tera Blast',              en: 'The type of this move is the same type as the user.',                                                                                                                            es: 'El tipo de este movimiento es el mismo tipo que el usuario.' },
    { name: 'Tera Starstorm',          en: 'Add 2 to the Attack Strength of this move for the battle round if the opponent is Terrastalized.',                                                                              es: '+2 Fuerza si el oponente está Terrastalizado.' },
    { name: 'Terrain Pulse',           en: 'No Field Move = Normal; Grassy Terrain = Grass; Electric Terrain = Electric; Misty Terrain = Fairy; Psychic Terrain = Psychic.',                                               es: 'Sin carta=Normal; Herboso=Planta; Eléctrico=Eléctrico; Neblinoso=Hada; Psíquico=Psíquico.' },
    { name: 'Thunder Fang',            en: 'Roll the Effect Die again. Odd = opponent gains Paralyzed. Even = opponent has Disadvantage this battle round.',                                                                es: 'Tira de nuevo. Impar = Paralizado; Par = el oponente tiene Desventaja.' },
    { name: 'Torment',                 en: 'Opponent Pokémon cannot choose the same move in consecutive rounds until the end of the battle.',                                                                               es: 'El oponente no puede elegir el mismo movimiento en rondas consecutivas.' },
    { name: 'Transform',               en: 'Select any of the opponent Pokémon\'s moves. This move becomes that move and the user becomes that type for the rest of this battle.',                                          es: 'Elige un movimiento del oponente. Este movimiento adopta ese movimiento y el usuario ese tipo.' },
    { name: 'Tri Attack',              en: 'Roll the Effect Die again: 1-2=Paralyzed, 3-4=Burned, 5-6=Frozen.',                                                                                                            es: 'Tira de nuevo: 1-2=Paralizado, 3-4=Quemado, 5-6=Congelado.' },
    { name: 'Uproar',                  en: 'Discard the Sleep status from all Pokémon on both teams. No Pokémon can gain the Sleep status this battle.',                                                                    es: 'Descarta el estado Dormido de todos. Nadie puede dormir en esta batalla.' },
    { name: 'Wake-Up Slap',            en: 'After this round, the opponent discards their Sleep Status Condition (if applicable).',                                                                                         es: 'Después de la ronda, el oponente descarta su estado Dormido (si aplica).' },
    { name: 'Yawn',                    en: 'Opponent Pokémon gains the Sleep status at the beginning of the next battle round.',                                                                                            es: 'El Pokémon oponente gana el estado Dormido al comienzo de la siguiente ronda.' },
];

// La tabla de tipos vive en ModalTypeChart, que se abre con su propio botón
// flotante junto al de música.
const TABS = ['Icons', 'Field', 'Status', 'Max Moves', 'Special'];

// Encabezado de la pestaña Max: la regla completa, que es lo que hay que tener a
// mano cuando alguien pregunta "¿y este ataque en qué se convierte?".
const MAX_INTRO = {
    en: 'When Pokémon Dynamax, their moves become the Max Move that corresponds to the same type as their base state move, keeping the Attack Strength of the original moves. When a Dynamaxed/G-Maxed Pokémon is switched out, it reverts back to its base form. Base state moves with 0 or lower Attack Strength become Max Guard (Normal Type) regardless of type.',
    es: 'Al dinamaxizarse, cada movimiento se convierte en el Movimiento Max de su mismo tipo, conservando la Fuerza de Ataque del movimiento original. Al cambiar a un Pokémon Dynamax/G-Max, vuelve a su forma base. Los movimientos con Fuerza 0 o menos se convierten en Max Guard (tipo Normal), sea cual sea su tipo.',
};

const ModalRulesGuide = ({ show, onClose }) => {
    const [tab, setTab] = useState(0);
    const [lang, setLang] = useState('en');
    const [search, setSearch] = useState('');

    if (!show) return null;

    const L = (item) => item[lang];

    const filteredSpecial = SPECIAL_EFFECTS.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e[lang].toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="modal-backdrop rules-guide-backdrop" onClick={onClose}>
            <div className="rules-guide-modal" onClick={e => e.stopPropagation()}>

                <button className="rules-guide-close" onClick={onClose}>✕</button>

                <div className="rules-guide-header">
                    <div className="rules-guide-title">Move Effects Guide</div>
                    <div className="rules-guide-lang-toggle">
                        <button className={`rules-guide-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
                        <button className={`rules-guide-lang-btn${lang === 'es' ? ' active' : ''}`} onClick={() => setLang('es')}>ES</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="rules-guide-tabs">
                    {TABS.map((t, i) => (
                        <button
                            key={t}
                            className={`rules-guide-tab${tab === i ? ' active' : ''}`}
                            onClick={() => { setTab(i); setSearch(''); }}
                        >{t}</button>
                    ))}
                </div>

                <div className="rules-guide-content">

                    {/* ── Tab 0: Icons ── */}
                    {tab === 0 && (
                        <div className="rules-guide-icons">
                            <div className="rules-guide-section-title rules-guide-white-title">
                                ⬜ {lang === 'en' ? 'WHITE ICONS — Affect the user' : 'ICONOS BLANCOS — Afectan al usuario'}
                            </div>
                            {WHITE_EFFECTS.map(e => {
                                const img = e.icon ? getImg(e.icon) : null;
                                return (
                                    <div key={e.key} className="rules-guide-effect-row rules-guide-effect-white">
                                        <div className="rules-guide-effect-icon-wrap">
                                            {img
                                                ? <img src={img} alt={e.en.name} className="rules-guide-effect-icon" />
                                                : <div className="rules-guide-effect-icon-placeholder" />
                                            }
                                        </div>
                                        <span className="rules-guide-effect-name">{L(e).name}</span>
                                        <span className="rules-guide-effect-desc">{L(e).desc}</span>
                                    </div>
                                );
                            })}
                            <div className="rules-guide-section-title rules-guide-black-title">
                                ⬛ {lang === 'en' ? 'BLACK ICONS — Affect the opponent' : 'ICONOS NEGROS — Afectan al oponente'}
                            </div>
                            {BLACK_EFFECTS.map(e => {
                                const img = e.icon ? getImg(e.icon) : null;
                                return (
                                    <div key={e.key} className="rules-guide-effect-row rules-guide-effect-black">
                                        <div className="rules-guide-effect-icon-wrap">
                                            {img
                                                ? <img src={img} alt={e.en.name} className="rules-guide-effect-icon" />
                                                : <div className="rules-guide-effect-icon-placeholder" />
                                            }
                                        </div>
                                        <span className="rules-guide-effect-name">{L(e).name}</span>
                                        <span className="rules-guide-effect-desc">{L(e).desc}</span>
                                    </div>
                                );
                            })}
                            <div className="rules-guide-note">
                                * {lang === 'en'
                                    ? 'A RED number next to the icon means you must roll equal or higher on your Effect Roll to activate it.'
                                    : 'El número en rojo junto al ícono indica el valor mínimo que debes sacar en el dado de efecto para activarlo.'}
                            </div>
                        </div>
                    )}

                    {/* ── Tab 1: Field Moves ── */}
                    {tab === 1 && (
                        <div className="rules-guide-field">
                            <div className="rules-guide-field-note">
                                {lang === 'en'
                                    ? 'There are 2 Field Move Card slots per battle. If a slot is occupied, discard the old card to play the new one. Field Move effects do not stack.'
                                    : 'Hay 2 espacios de carta de campo por batalla. Si ya hay una, debe descartarse para jugar la nueva. Los efectos de campo no se acumulan.'}
                            </div>
                            <div className="rules-guide-field-grid">
                                {FIELD_MOVES.map(fm => {
                                    const img = getFieldImg(fm.key);
                                    return (
                                        <div key={fm.key} className="rules-guide-field-card">
                                            {img
                                                ? <img src={img} alt={fm.en} className="rules-guide-field-img" />
                                                : <div className="rules-guide-field-placeholder">{fm.key}</div>
                                            }
                                            <span className="rules-guide-field-name">{fm[lang]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Tab 2: Status ── */}
                    {tab === 2 && (
                        <div className="rules-guide-status">
                            <div className="rules-guide-field-grid">
                                {STATUS_CARDS.map(sc => {
                                    const img = getStatusImg(sc.key);
                                    return (
                                        <div key={sc.key} className="rules-guide-field-card">
                                            {img
                                                ? <img src={img} alt={sc.en} className="rules-guide-status-img" />
                                                : <div className="rules-guide-field-placeholder">{sc.key}</div>
                                            }
                                            <span className="rules-guide-field-name">{sc[lang]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Tab 3: Movimientos Max (Dynamax) ──
                        A dos columnas como la carta física, para que quepan los
                        19 sin scroll: es una tabla de CONSULTA y se abre a media
                        batalla, con el ataque a medio elegir. */}
                    {tab === 3 && (
                        <div className="rules-guide-max">
                            <div className="rules-guide-section-title rules-guide-max-title">
                                💥 {lang === 'en' ? 'MAX MOVE EFFECTS' : 'EFECTOS DE LOS MOVIMIENTOS MAX'}
                            </div>
                            <div className="rules-guide-field-note">{MAX_INTRO[lang]}</div>

                            <div className="rules-guide-max-grid">
                                {MAX_MOVE_LIST.map(max => {
                                    const icon = max.type ? getImg(`Types/${max.type}.png`) : null;
                                    const color = max.type ? typeColor(max.type) : '#9aa0b5';
                                    const isField = max.kind === 'field';
                                    return (
                                        <div key={max.name}
                                             className={`rules-guide-max-card rules-guide-max-card--${max.kind}`}
                                             style={{ '--max-type': color }}>
                                            <div className="rules-guide-max-orb">
                                                {icon
                                                    ? <img src={icon} alt={max.type || ''} />
                                                    : <span className="rules-guide-max-orb-fallback">🛡️</span>}
                                            </div>
                                            <div className="rules-guide-max-body">
                                                <div className="rules-guide-max-name">
                                                    {max.name}
                                                    <em className="rules-guide-max-type">
                                                        {/* typeLabel solo habla español; en EN vale el tipo tal cual */}
                                                        {max.type
                                                            ? (lang === 'es' ? typeLabel(max.type) : max.type)
                                                            : (lang === 'es' ? 'Fuerza 0 o menos' : 'Attack Strength 0 or lower')}
                                                    </em>
                                                </div>
                                                <div className="rules-guide-max-desc">
                                                    {maxEffectText(max, lang)}
                                                </div>
                                                {/* Los de campo obligan a una acción física en la
                                                    mesa: sacar la carta. Se marca aparte porque es
                                                    lo único de esta tabla que hay que RECORDAR hacer. */}
                                                {isField && (
                                                    <span className="rules-guide-max-tag">
                                                        {lang === 'en' ? 'play a card' : 'juega una carta'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Tab 4: Special Moves ── */}
                    {tab === 4 && (
                        <div className="rules-guide-special">
                            <input
                                className="rules-guide-search"
                                type="text"
                                placeholder={lang === 'en' ? 'Search move...' : 'Buscar movimiento...'}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {filteredSpecial.map(e => (
                                <div key={e.name} className="rules-guide-effect-row rules-guide-effect-special">
                                    <span className="rules-guide-effect-name">{e.name}</span>
                                    <span className="rules-guide-effect-desc">{e[lang]}</span>
                                </div>
                            ))}
                            {filteredSpecial.length === 0 && (
                                <div className="rules-guide-empty">
                                    {lang === 'en' ? 'No moves found.' : 'No se encontró ningún movimiento.'}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ModalRulesGuide;
