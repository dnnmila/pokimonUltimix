
import { useState } from 'react';
import { typeColor } from '../pokemonTypes';
import { attachIconStyle, attachLabel } from '../attachItems';
import PokemonName from './PokemonName';

const PokemonListed = ({pokemon}) => {
    const [showToken, setShowToken] = useState(false);

    const getSpriteUrl = (id) => {
        try { return require(`../images/POKEMON/${id}.png`); } catch { return null; }
    };

    const getTokenUrl = (id) => {
        try { return require(`../images/tokens_ultimix/${id}.png`); } catch {
            try { return require(`../images/tokens/${String(parseInt(id, 10)).padStart(3, '0')}.png`); } catch { return null; }
        }
    };

    const forceToken = pokemon.nextLevel === -1;
    const spriteUrl = getSpriteUrl(pokemon.pokedex);
    const tokenUrl = getTokenUrl(pokemon.pokedex);

    const imageUrl = (showToken || forceToken || !spriteUrl) ? (tokenUrl || spriteUrl) : spriteUrl;

    const isDead = pokemon.state !== 'Alive';
    const hasItem = pokemon.attach && pokemon.attach !== 'None';
    const hasStatus = pokemon.status && pokemon.status !== 'Normal';

    return (
        // Tres bandas: nombre arriba, ilustración en medio y el pie con el
        // objeto adjunto y el nivel. El nombre va arriba y a todo el ancho
        // porque los motes son largos y antes se cortaban al compartir el pie
        // con el nivel; abajo manda el nivel, que es el dato que más se mira.
        <div className={`apl-pkm ${isDead ? 'apl-pkm--dead' : ''} ${hasItem ? 'apl-pkm--item' : ''}`}
             style={{ '--pkm-type': typeColor(pokemon.type1) }}
             onClick={() => setShowToken(v => !v)}
             title={showToken ? 'Ver sprite' : 'Ver token'}>

            <PokemonName pkm={pokemon} as="div" className="apl-pkm-name" />

            <div className="apl-pkm-art" style={{ backgroundImage: `url(${imageUrl})` }}>
                {hasStatus && <div className={`apl-pkm-status ${pokemon.status}`} />}
            </div>

            <div className="apl-pkm-foot">
                {hasItem && (
                    <div className="apl-pkm-attach" title={attachLabel(pokemon.attach, pokemon)}>
                        <i style={attachIconStyle(pokemon.attach, pokemon)} />
                    </div>
                )}
                <span className="apl-pkm-lvl">{pokemon.totalLevel}</span>
            </div>
        </div>
    );
};

export default  PokemonListed;
