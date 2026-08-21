import PokemonListed from "./PokemonListed";
import { getTrainerAvatar } from "../data/trainers";

// El catálogo es el mismo que usa el modal de fronteras del SimPlayer: los
// puntos de aquí y las tarjetas de allí tienen que pintar el mismo color, que
// además es el del token del que sale el rival del reto.
import { FRONTIERS } from "../data/frontiers";

const TEAM_SLOTS = 6;

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

const PlayerListed = ({player, generation, turnElapsed = 0}) => {
    const badges = [player.badge1, player.badge2, player.badge3, player.badge4 , player.badge5 , player.badge6,player.badge7,player.badge8,player.badge9,player.badge10];
    const gymBadges = badges.slice(0, 8);
    const eliteWon = badges[8];
    const championWon = badges[9];

    const pokemons = player.pokemons || [];
    const emptySlots = Math.max(0, TEAM_SLOTS - pokemons.length);

    return (
        <div className={`apl-row ${player.isMyTurn ? 'apl-row--active' : ''}`}>

            {/* ── Entrenador y medallas ─────────────────────────────────── */}
            {/* Dos líneas: retrato + nombre arriba, y las medallas abajo a todo
                el ancho de la columna, que es lo que les deja tamaño de verdad */}
            <div className="apl-trainer">
                <div className="apl-trainer-top">
                    <div className="apl-rank">{player.position}</div>
                    <div className="apl-avatar" style={{ backgroundImage: `url(${getTrainerAvatar(player.name)})` }} />
                    <div className="apl-name">{player.name}</div>
                </div>

                <div className="apl-identity">
                    {/* Sin contador: las medallas encendidas ya dicen cuántas lleva */}
                    <div className="apl-badges">
                        {gymBadges.map((won, index) => {
                            const num = index + 1;
                            const img = getBadgeImg(generation || 1, num);
                            return (
                                <div key={player.name + 'badge' + num}
                                     className={`apl-badge ${won ? 'apl-badge--won' : ''}`}
                                     style={img ? { backgroundImage: `url(${img})` } : {}} />
                            );
                        })}
                        {eliteWon && <div className="apl-badge apl-badge--won apl-badge--elite" title="Alto Mando" />}
                        {championWon && <div className="apl-badge apl-badge--won apl-badge--champion" title="Campeón" />}
                    </div>

                    {generation === 2 && (
                        <div className="apl-frontiers">
                            {FRONTIERS.map(({ key, color, label }) => (
                                <div
                                    key={key}
                                    className={`apl-frontier ${player[key] ? 'apl-frontier--used' : ''}`}
                                    style={{ '--fc': color }}
                                    title={label}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Equipo ────────────────────────────────────────────────── */}
            <div className="apl-team">
                {pokemons.map(pokemon => (
                    <PokemonListed key={player.name + pokemon.id} pokemon={pokemon} />
                ))}
                {Array.from({ length: emptySlots }, (_, i) => (
                    <div key={`empty-${i}`} className="apl-pkm apl-pkm--empty" />
                ))}
            </div>

            {/* ── Totales ───────────────────────────────────────────────── */}
            <div className="apl-totals">
                <div className="apl-points">{player.points}<span>pts</span></div>
                <div className="apl-coins">${player.coins}</div>
                {/* Reloj acumulado y cronómetro del turno en la misma línea: con
                    ocho jugadores la fila no da para una cuarta */}
                <div className="apl-clock">
                    <span className="apl-time">{player.hours}:{player.minutes}:{player.seconds}</span>
                    {player.isMyTurn && (
                        <span className="apl-turn-timer">{formatTurnTime(turnElapsed)}</span>
                    )}
                </div>
            </div>

        </div>
    );
};

export default PlayerListed;
