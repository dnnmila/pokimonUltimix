import PokemonListed from "./PokemonListed";

const FRONTIERS = [
    { key: 'frontierPink',   color: '#f472b6', label: 'Rosa' },
    { key: 'frontierGreen',  color: '#4ade80', label: 'Verde' },
    { key: 'frontierBlue',   color: '#60a5fa', label: 'Azul' },
    { key: 'frontierYellow', color: '#facc15', label: 'Amarilla' },
    { key: 'frontierRed',    color: '#f87171', label: 'Roja' },
    { key: 'frontierGolden', color: '#c084fc', label: 'Legendaria' },
];

const getBadgeImg = (gen, num) => {
    try {
        return require(`../images/badges/badges${gen}/badge${num}.webp`);
    } catch (e) {
        try { return require(`../images/badges/badge${num}.png`); } catch { return null; }
    }
};

const formatTurnTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const PlayerListed = ({player, totalPLayers, generation, turnElapsed = 0}) => {
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
            
                {generation === 2 && (
                    <div className="PlayerFrontiers">
                        {FRONTIERS.map(({ key, color, label }) => (
                            <div
                                key={key}
                                className={`PlayerFrontierDot ${player[key] ? 'PlayerFrontierDot--used' : ''}`}
                                style={{ '--fc': color }}
                                title={label}
                            />
                        ))}
                    </div>
                )}
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
                <div className="PlayerTime">{player.hours} : {player.minutes} : {player.seconds}</div>
                {player.isMyTurn && (
                    <div className="PlayerTurnTimer">{formatTurnTime(turnElapsed)}</div>
                )}
            </div>
           
        </div>
    );
};

export default PlayerListed;
