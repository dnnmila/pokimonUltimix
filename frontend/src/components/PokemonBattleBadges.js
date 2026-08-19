import { Z_CRYSTALS } from "../data/zmoves";
import { findTMByAttack } from "../data/tms";
import { attachIconStyle, attachLabel, getAttachItem } from "../attachItems";
import { displayName } from "../moteName";
import imgTMIcon from "../images/tm.png";

// Insignias del item adjuntado, junto al nombre del Pokémon en batalla.
//
// Viven aquí y no en SimPlayer porque el espejo del marcador tiene que enseñar
// exactamente lo mismo que la tablet: si las dos pantallas no comparten el
// código, la mesa acaba viendo un item en una y ninguno en la otra.
//
// `onOpen` es opcional a propósito: en la tablet se toca la insignia para ver la
// carta grande, pero el espejo es una pantalla que nadie toca. Sin handler la
// insignia se pinta igual, solo que no responde.

// MT y cristal Z: el backend marca el hueco con attach === 'MT' o 'Z' y guarda
// el ataque en attack3. Se pinta la miniatura de la carta cuando se puede
// identificar; si no, el icono genérico.
export const TMBadge = ({ pokemon, onOpen }) => {
    if (!pokemon || (pokemon.attach !== 'MT' && pokemon.attach !== 'Z')) return null;

    const esZ = pokemon.attach === 'Z';
    // El cristal se identifica por el nombre que guardó el ataque; el genérico
    // "Z" de un adjuntado a mano no casa con ninguno y cae al icono.
    const carta = esZ
        ? Z_CRYSTALS.find(z => z.cristal === pokemon.attack3?.z?.cristal) || null
        : findTMByAttack(pokemon.attack3);

    const titulo = esZ
        ? (carta ? `${carta.cristal} — ${pokemon.attack3.name}` : 'Cristal Z adjuntado')
        : (carta ? `${carta.tm} — ${carta.nombre}` : 'MT adjuntada');

    return (
        <div
            className={`sim-tm-badge${onOpen ? '' : ' sim-tm-badge--static'}`}
            title={titulo}
            onClick={onOpen
                ? () => onOpen({ attack: pokemon.attack3, pokemonName: displayName(pokemon), esZ })
                : undefined}
        >
            <img src={carta?.thumb || imgTMIcon} alt={titulo} />
        </div>
    );
};

// El resto de items (Proteína, Restos, Orbe Tera…). TMBadge solo cubre MT y
// cristal Z porque su carta se deduce de `attack3`; estos no tienen ataque
// asociado y se identifican por el id que guarda `attach`.
export const ItemBadge = ({ pokemon, onOpen }) => {
    const id = pokemon?.attach;
    if (!id || id === 'None' || id === 'MT' || id === 'Z') return null;

    // Un id que ya no esté en el catálogo (partida vieja) no se pinta: sin
    // sprite la insignia saldría como un hueco gris sin significado.
    if (!getAttachItem(id)) return null;

    return (
        <div
            className={`sim-item-badge${onOpen ? '' : ' sim-tm-badge--static'}`}
            title={attachLabel(id, pokemon)}
            onClick={onOpen
                ? () => onOpen({ itemId: id, pokemon, pokemonName: displayName(pokemon) })
                : undefined}
        >
            <i style={attachIconStyle(id, pokemon)} />
        </div>
    );
};
