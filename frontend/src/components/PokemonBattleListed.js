


const PokemonBattleListed = ({pokemon,SelectPokemon}) => {
    let imageUrl;

   
    if (pokemon.pokedex.startsWith('gym')) {
        imageUrl = require(`../images/Leaders2/${pokemon.pokedex}.png`);
      } 
      else if (pokemon.pokedex.startsWith('M') || pokemon.pokedex.startsWith('GM') || pokemon.pokedex.startsWith('A')){
        imageUrl = require(`../images/tokens_ultimix/${pokemon.pokedex}.png`);
      } else{
        imageUrl = require(`../images/POKEMON/${pokemon.pokedex}.png`);
      }

   



    return (
        <div className="PokemonBattleListed" onClick={()=> SelectPokemon(pokemon)} >
                <div className= {pokemon.state === "Alive" ? "img_pokemon_listed"  : "img_pokemon_listed_dead" }style={{ backgroundImage: `url(${imageUrl})`}}> </div>
                <div className="level_pokekon_listed">{pokemon.totalLevel}</div>
                <div className={`status ${pokemon.status}`}></div>
                
      
        </div>
    );
};

export default  PokemonBattleListed;
