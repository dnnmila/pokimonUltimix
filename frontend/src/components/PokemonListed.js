


const PokemonListed = ({pokemon}) => {
    //Ajuste de pokedes quitando un 0 ultimixdnn
    const imageUrl = require(`../images/POKEMON/0${pokemon.pokedex}.png`);



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
