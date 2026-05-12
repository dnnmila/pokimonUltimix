import coronaImg from '../../images/corona.png';
import campionImg from '../../images/badges/campion.png';

const CONFETTI_COLORS = ['#f0d080', '#f472b6', '#60a5fa', '#4ade80', '#f87171', '#c084fc', '#ffffff'];

const CONFETTI = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 2.5 + Math.random() * 3,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
}));

const getPkmImg = (pokedex) => {
    try { return require(`../../images/POKEMON/${pokedex}.png`); } catch {
        try { return require(`../../images/tokens_ultimix/${pokedex}.png`); } catch { return null; }
    }
};

const ModalVictory = ({ player }) => {
    if (!player) return null;

    return (
        <div className="victory-overlay">
            <div className="victory-confetti-container">
                {CONFETTI.map(c => (
                    <div
                        key={c.id}
                        className="victory-confetti-piece"
                        style={{
                            left: `${c.x}vw`,
                            animationDelay: `${c.delay}s`,
                            animationDuration: `${c.duration}s`,
                            background: c.color,
                            width: `${c.size}px`,
                            height: `${c.size * 0.5}px`,
                            '--rotate': `${c.rotate}deg`,
                        }}
                    />
                ))}
            </div>

            <div className="victory-content">
                <img src={coronaImg} alt="corona" className="victory-crown" />
                <div className="victory-title">¡CAMPEÓN!</div>
                <div className="victory-name">{player.name}</div>
                <img src={campionImg} alt="campion" className="victory-badge" />

                <div className="victory-pokemons">
                    {player.pokemons?.filter(p => p.state === 'Alive').map(p => {
                        const img = getPkmImg(p.pokedex);
                        return img ? (
                            <div
                                key={p.id}
                                className="victory-pkm"
                                style={{ backgroundImage: `url(${img})` }}
                                title={p.name}
                            />
                        ) : null;
                    })}
                </div>

                <div className="victory-stats">
                    <span>{player.points} pts</span>
                    <span>${player.coins}</span>
                </div>
            </div>
        </div>
    );
};

export default ModalVictory;
