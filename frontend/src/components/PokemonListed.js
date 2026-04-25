


const PokemonListed = ({pokemon}) => {
    const getImageUrl = (id, forceToken = false) => {
        if (forceToken) {
            try { return require(`../images/tokens_ultimix/${id}.png`); } catch { return null; }
        }
        try {
            return require(`../images/POKEMON/${id}.png`);
        } catch {
            try { return require(`../images/tokens_ultimix/${id}.png`); } catch { return null; }
        }
    };
    const imageUrl = getImageUrl(pokemon.pokedex, pokemon.nextLevel === -1);



    return (
        <div className="PokemonListed" >
                <div className= {pokemon.state === "Alive" ? "img_pokemon_listed"  : "img_pokemon_listed_dead" }style={{ backgroundImage: `url(${imageUrl})`}}> </div>
                <div className={`attached attached-${pokemon.attach}`}></div>
                <div className={`status ${pokemon.status}`}></div>
                <div className="level_pokekon_listed">{pokemon.totalLevel}</div>
      
        </div>
    );
};

export default  PokemonListed;
