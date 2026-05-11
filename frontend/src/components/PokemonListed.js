
import { useState } from 'react';

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

    return (
        <div className="PokemonListed" onClick={() => setShowToken(v => !v)} title={showToken ? 'Ver sprite' : 'Ver token'}>
                <div className= {pokemon.state === "Alive" ? "img_pokemon_listed"  : "img_pokemon_listed_dead" }style={{ backgroundImage: `url(${imageUrl})`}}> </div>
                <div className={`attached attached-${pokemon.attach}`}></div>
                <div className={`status ${pokemon.status}`}></div>
                <div className="level_pokekon_listed">{pokemon.totalLevel}</div>

        </div>
    );
};

export default  PokemonListed;
