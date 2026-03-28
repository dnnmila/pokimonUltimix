import React from 'react';

const Attack = ({ attack,bonus }) => {
   let className = `Attack_${attack.type}`;

    return (
        <div className="Attack"  >
        
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