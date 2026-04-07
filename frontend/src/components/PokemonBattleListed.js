


import imgRivPink1   from '../images/Leaders2/RivPink1.png';
import imgRivPink2   from '../images/Leaders2/RivPink2.png';
import imgRivGreen1  from '../images/Leaders2/RivGreen1.png';
import imgRivGreen2  from '../images/Leaders2/RivGreen2.png';
import imgRivBlue1   from '../images/Leaders2/RivBlue1.png';
import imgRivBlue2   from '../images/Leaders2/RivBlue2.png';
import imgRivYellow1 from '../images/Leaders2/RivYellow1.png';
import imgRivYellow2 from '../images/Leaders2/RivYellow2.png';
import imgRivRed1    from '../images/Leaders2/RivRed1.png';
import imgRivRed2    from '../images/Leaders2/RivRed2.png';

const RIV_IMAGES = {
    RivPink1: imgRivPink1, RivPink2: imgRivPink2,
    RivGreen1: imgRivGreen1, RivGreen2: imgRivGreen2,
    RivBlue1: imgRivBlue1, RivBlue2: imgRivBlue2,
    RivYellow1: imgRivYellow1, RivYellow2: imgRivYellow2,
    RivRed1: imgRivRed1, RivRed2: imgRivRed2,
};

const PokemonBattleListed = ({pokemon,SelectPokemon}) => {
    let imageUrl;

    if (RIV_IMAGES[pokemon.pokedex]) {
        imageUrl = RIV_IMAGES[pokemon.pokedex];
    } else if (pokemon.pokedex.startsWith('gym')) {
        imageUrl = require(`../images/Leaders2/${pokemon.pokedex}.png`);
    } else if (pokemon.pokedex.startsWith('M') || pokemon.pokedex.startsWith('GM') || pokemon.pokedex.startsWith('A')) {
        imageUrl = require(`../images/tokens_ultimix/${pokemon.pokedex}.png`);
    } else {
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
