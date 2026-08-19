import React from 'react';

const Attack = ({ attack,bonus }) => {
   let className = `Attack_${attack.type}`;

    return (
        // La carta lleva la MISMA clase de tipo que las fichas bajo el Pokémon
        // (`type_GRASS`, `type_FIRE`…), y de ahí saca su color. Así no hay una
        // segunda paleta que mantener: si un tipo cambia de tono en
        // _types.scss, la carta del ataque cambia con él. Ver _attacks.scss.
        <div className={`Attack type_${attack.type}`}  >
        
            <div className={`attack_type ${className}`}></div>
            <div className='attack_name'>{attack.name}</div>
            <div className='attack_strenght'>{attack.strength}</div>
            {bonus !== 0 && (
            <div className={bonus > 0 ? 'positive_bonus' :
                            bonus < 0 ? 'negative_bonus' : ''
                            }>
                            {bonus > 0 ? `+${bonus}` : bonus}
             </div>
  )
}
    
        </div>
    )
};

export default Attack;