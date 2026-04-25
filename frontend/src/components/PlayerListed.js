import PokemonListed from "./PokemonListed";

const getBadgeImg = (gen, num) => {
    try {
        return require(`../images/badges/badges${gen}/badge${num}.webp`);
    } catch (e) {
        try { return require(`../images/badges/badge${num}.png`); } catch { return null; }
    }
};

const PlayerListed = ({player, totalPLayers, generation}) => {
    const badges = [player.badge1, player.badge2, player.badge3, player.badge4 , player.badge5 , player.badge6,player.badge7,player.badge8,player.badge9,player.badge10];

    const playerHeight = 100 / totalPLayers;

    const playerStyle = {
        height: `${playerHeight}vh`
    };


    return (
        <div className={`PlayerListedClass ${player.isMyTurn ? 'PlayerListedClass--active' : ''}`} style={playerStyle} >
           
            <div className="Titles">
                <div className="NamesAndPosition">
                {player.isMyTurn && <div className="isMyturn"> </div>}
                    <div className="PlayerPosition">{player.position}.</div>
                    <div className="PlayerName">{player.name}</div>
                    <div className="PlayerPoints">{player.points} points</div>
                </div>
            
                <div className="PlayerBadges">
                    {badges.map((badge, index) => {
                        if (!badge) return null;
                        const num = index + 1;
                        if (num <= 8) {
                            const img = getBadgeImg(generation || 1, num);
                            return (
                                <div
                                    key={player.name + "badge" + num}
                                    className={`PlayerBagde${num}`}
                                    id={`badge${num}Won`}
                                    style={img ? { backgroundImage: `url(${img})` } : {}}
                                />
                            );
                        }
                        return (
                            <div key={player.name + "badge" + num} className={`PlayerBagde${num}`} id={`badge${num}Won`} />
                        );
                    })}
                </div>
              

            </div>
            <div className="AllPokemons"> 
                    {player.pokemons && player.pokemons.map((pokemon, index) => (
                       <PokemonListed key = {player.name + pokemon.id} pokemon={pokemon}  />
                ))}
            </div>
            <div className="CoinsAndTime">
                <div className="PlayerCoins">${player.coins}</div>
                <div className="PlayerTime">{player.hours} : {player.minutes} : {player.seconds}   </div>
            </div>
           
        </div>
    );
};

export default PlayerListed;
