import { useState, useEffect } from 'react';
import SERVER_IP from '../../config.js';
import { getTrainerImage } from '../../data/trainers';
import { getLeaderArt, rivalColorOf } from '../../data/leaders';
import { typeColor, typeLabel } from '../../pokemonTypes';

// Token de la carta de cada Pokémon del equipo (el mismo arte que la vista
// previa del SimPlayer): los del líder viven en Leaders<gen>, el resto en
// tokens_ultimix. Devuelve null si falta el archivo, para no tumbar el modal.
const LEADER_PREFIXES = ['gym', 'Riv'];
const getTeamImg = (img, generation) => {
    if (!img) return null;
    try {
        if (LEADER_PREFIXES.some(p => img.startsWith(p)))
            return require(`../../images/Leaders${generation}/${img}.png`);
        return require(`../../images/tokens_ultimix/${img}.png`);
    } catch { return null; }
};

// Grupos en el orden en que se juegan
const GROUPS = [
    { key: 'gym',     label: 'Líderes de gimnasio',  match: (c) => c === 'gym' },
    { key: 'elite',   label: 'Alto Mando',           match: (c) => c === 'elite' },
    { key: 'special', label: 'Campeón / Especial',   match: (c) => c === 'champion' || c === 'rocket' },
    { key: 'rival',   label: 'Rival — por color de casilla', match: (c) => c === 'rival' },
];

const ModalBattle = ({ show, onClose, game, playerBattle, LeaderBattle }) => {
    const [leaders, setLeaders] = useState([]);
    // Líder abierto: elegirlo no pelea, primero enseña su equipo
    const [selected, setSelected] = useState(null);
    const generation = game?.generation || 1;

    useEffect(() => {
        if (!show) return;
        fetch(`${SERVER_IP}/get-leaders?generation=${generation}`)
            .then(r => r.json())
            .then(data => setLeaders(data))
            .catch(console.error);
    }, [show, generation]);

    if (!show) return null;

    const handleClose = () => { setSelected(null); onClose(); };
    const handlePlayerBattle = (idPlayer) => { playerBattle(idPlayer); handleClose(); };
    const handleLeaderBattle = (leader) => {
        LeaderBattle(leader.leaderKey, leader.uid1, leader.uid2);
        handleClose();
    };

    // El Campeón aparece tres veces con el mismo nombre y el mismo retrato (un
    // equipo por inicial): sin numerarlos no hay forma de saber cuál se está
    // eligiendo. Solo se numera cuando el nombre se repite dentro del grupo.
    // Los rivales también repiten nombre, pero ahí el color de la casilla ya
    // dice cuál es: numerarlos sobraría.
    const labelsFor = (list) => {
        const seen = {};
        list.forEach(l => { seen[l.name] = (seen[l.name] || 0) + 1; });
        const used = {};
        return new Map(list.map(l => {
            if (seen[l.name] === 1 || rivalColorOf(l.img)) return [l.leaderKey, l.name];
            used[l.name] = (used[l.name] || 0) + 1;
            return [l.leaderKey, `${l.name} ${used[l.name]}`];
        }));
    };

    // Tarjeta del líder: retrato si lo hay, si no el token de su carta
    const LeaderCard = ({ leader, label }) => {
        const { src, isPortrait } = getLeaderArt(leader.img, leader.name, generation);
        const color = rivalColorOf(leader.img);
        const type = leader.team?.[0]?.type1;
        const level = Math.max(...(leader.team || []).map(p => Number(p.level) || 0), 0);
        const isSelected = selected?.leaderKey === leader.leaderKey;
        return (
            <div
                className={`mb-leader-card ${isSelected ? 'mb-leader-card--selected' : ''}`}
                title={`Ver el equipo de ${label}`}
                style={color ? { borderColor: color.hex } : {}}
                onClick={() => setSelected(isSelected ? null : leader)}
            >
                <div className={`mb-leader-art ${isPortrait ? '' : 'mb-leader-art--token'}`}
                     style={src ? { backgroundImage: `url(${src})` } : {}} />
                <div className="mb-leader-body">
                    <div className="mb-leader-name">{label}</div>
                    <div className="mb-leader-meta">
                        {color && (
                            <span className="mb-leader-chip" style={{ backgroundColor: color.hex, color: '#fff' }}>
                                {color.label}
                            </span>
                        )}
                        {type && (
                            <span className="mb-leader-chip" style={{ backgroundColor: typeColor(type) }}>
                                {typeLabel(type)}
                            </span>
                        )}
                        {level > 0 && <span className="mb-leader-lvl">Nv {level}</span>}
                    </div>
                </div>
            </div>
        );
    };

    // Vista previa del equipo + botón de reto, debajo del grupo del elegido
    const LeaderPreview = ({ leader, label }) => {
        const color = rivalColorOf(leader.img);
        return (
            <div className="mb-preview" style={color ? { borderColor: color.hex } : {}}>
                <div className="mb-preview-title">
                    {label}
                    {color && <span style={{ color: color.hex }}> · {color.label}</span>}
                </div>
                <div className="mb-preview-team">
                    {(leader.team || []).map(pkm => {
                        const img = getTeamImg(pkm.img, generation);
                        return (
                            <div key={pkm.uid} className="mb-preview-pkm">
                                <div className="mb-preview-img"
                                     style={img ? { backgroundImage: `url(${img})` } : {}} />
                                <div className="mb-preview-name">{pkm.name}</div>
                                <div className="mb-preview-level">Lv.{pkm.level}</div>
                                <div className="mb-preview-types">
                                    <div className={`mb-preview-type Attack_${pkm.type1}`} />
                                    {pkm.type2 && pkm.type2 !== 'NONE' && (
                                        <div className={`mb-preview-type Attack_${pkm.type2}`} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button className="mb-challenge-btn" onClick={() => handleLeaderBattle(leader)}>
                    Retar a {label}
                </button>
            </div>
        );
    };

    const renderGroup = ({ key, label, match }) => {
        const list = leaders.filter(l => match(l.category));
        if (list.length === 0) return null;
        const selectedHere = selected && list.some(l => l.leaderKey === selected.leaderKey);
        const names = labelsFor(list);
        return (
            <div key={key} className="mb-group">
                <div className="mb-group-label">{label}</div>
                <div className="mb-group-row">
                    {list.map(l => <LeaderCard key={l.leaderKey} leader={l} label={names.get(l.leaderKey)} />)}
                </div>
                {selectedHere && <LeaderPreview leader={selected} label={names.get(selected.leaderKey)} />}
            </div>
        );
    };

    const rivals = game.players.filter((_, index) => index !== game.currentTurn);

    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div className="Modal-battles" onClick={e => e.stopPropagation()}>
                <div className="mb-title">
                    Iniciar batalla — Gen {generation}
                    <button className="mb-close" onClick={handleClose}>✕</button>
                </div>

                <div className="mb-scroll">
                    {rivals.length > 0 && (
                        <div className="mb-group">
                            <div className="mb-group-label">Jugadores</div>
                            <div className="mb-group-row">
                                {rivals.map(player => (
                                    <div key={player.id} className="mb-player-card"
                                         title={`Retar a ${player.name}`}
                                         onClick={() => handlePlayerBattle(player.id)}>
                                        <div className="mb-player-img"
                                             style={{ backgroundImage: `url(${getTrainerImage(player.name)})` }} />
                                        <div className="mb-player-name">{player.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {GROUPS.map(renderGroup)}

                    {leaders.length === 0 && (
                        <div className="mb-empty">Cargando entrenadores…</div>
                    )}
                </div>

                <div className="close-blattle-modal" onClick={handleClose}>Cerrar</div>
            </div>
        </div>
    );
};

export default ModalBattle;
