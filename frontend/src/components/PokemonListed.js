
import { useState } from 'react';
import { typeColor } from '../pokemonTypes';

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
        // El objeto adjunto no necesita leyenda: se dibuja el item sobre la
        // ilustración y la tarjeta se marca con el aro dorado del atributo.
        <div className={`apl-pkm ${isDead ? 'apl-pkm--dead' : ''} ${hasItem ? 'apl-pkm--item' : ''}`}
             style={{ '--pkm-type': typeColor(pokemon.type1) }}
             onClick={() => setShowToken(v => !v)}
             title={showToken ? 'Ver sprite' : 'Ver token'}>

            <div className="apl-pkm-art" style={{ backgroundImage: `url(${imageUrl})` }}>
                {hasStatus && <div className={`apl-pkm-status ${pokemon.status}`} />}
                {hasItem && (
                    <div className="apl-pkm-attach" title={pokemon.attach}>
                        <i className={`attached-${pokemon.attach}`} />
                    </div>
                )}
            </div>

            <div className="apl-pkm-foot">
                <span className="apl-pkm-name">{pokemon.name}</span>
                <span className="apl-pkm-lvl">{pokemon.totalLevel}</span>
            </div>
        </div>
    );
};

export default  PokemonListed;
