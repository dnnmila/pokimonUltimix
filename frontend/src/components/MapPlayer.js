import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SERVER_IP from '../config.js';
import MapBattleModal from './MapBattleModal';
import VisualDiceHUD from './VisualDiceHUD';
import PokemonName from './PokemonName';
import '../styles/_mapPlayer.scss';

import mapGen1 from '../images/maps/gen1.jpg';
import mapGen2 from '../images/maps/gen2.png';
import mapGen3 from '../images/maps/gen3.png';
import mapGen4 from '../images/maps/gen4.png';

import backPink   from '../images/back tokens/pink.png';
import backGreen  from '../images/back tokens/green.png';
import backYellow from '../images/back tokens/yellow.png';
import backBlue   from '../images/back tokens/blue.png';
import backRed    from '../images/back tokens/red.png';
import backPurple from '../images/back tokens/purple.png';

const MAPS = { 1: mapGen1, 2: mapGen2, 3: mapGen3, 4: mapGen4 };

const PLAYER_COLORS = ['#e74c3c','#3498db','#27ae60','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63'];

const NODE_COLOR = {
    gym: '#f1c40f', start: '#27ae60', catch: '#3498db',
    event: '#e67e22', league: '#8e44ad', city: '#16a085',
    surf: '#00bcd4', medals: '#e91e63',
};
const NODE_ICON = {
    gym: null, start: '▶', catch: '●', event: '!',
    league: '★', city: 'C', surf: '≈', medals: 'M',
};

const STOP_TYPES = new Set(['gym', 'city', 'medals', 'league']);

const getLeaderImgs = (gen, order) => {
    const imgs = [];
    try { imgs.push(require(`../images/Leaders${gen}/gym${order}_1.png`)); } catch {}
    try { imgs.push(require(`../images/Leaders${gen}/gym${order}_2.png`)); } catch {}
    return imgs;
};

const getBadgeImg = (gen, order) => {
    try { return require(`../images/badges/badges${gen}/badge${order}.webp`); } catch {
        try { return require(`../images/badges/badge${order}.png`); } catch { return null; }
    }
};

const getDiceImg = (n) => {
    try { return require(`../images/dices/dice${n}.png`); } catch { return null; }
};

const TOKEN_DIR_OFFSET = {
    'top':          { x:  0,    y: -4.0 },
    'bottom':       { x:  0,    y:  4.0 },
    'left':         { x: -3.5,  y:  0   },
    'right':        { x:  3.5,  y:  0   },
    'top-left':     { x: -2.8,  y: -2.8 },
    'top-right':    { x:  2.8,  y: -2.8 },
    'bottom-left':  { x: -2.8,  y:  2.8 },
    'bottom-right': { x:  2.8,  y:  2.8 },
};

const CATCH_COLOR_NAME = {
    '#e91e63': 'pink',
    '#27ae60': 'green',
    '#f1c40f': 'yellow',
    '#3498db': 'blue',
    '#e74c3c': 'red',
    '#9b59b6': 'purple',
};

const BACK_TOKENS = {
    '#e91e63': backPink,
    '#27ae60': backGreen,
    '#f1c40f': backYellow,
    '#3498db': backBlue,
    '#e74c3c': backRed,
    '#9b59b6': backPurple,
};

const getTokenImg = (pokedex) => {
    try { return require(`../images/tokens_ultimix/${pokedex}.png`); } catch { return null; }
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function findReachable(startId, steps, edges, allNodes) {
    if (!startId || steps < 1) return new Set();

    const adj = {};
    const typeOf = {};
    allNodes.forEach(n => { adj[n.id] = []; typeOf[n.id] = n.type; });
    edges.forEach(e => {
        if (adj[e.from] !== undefined) adj[e.from].push(e.to);
        if (adj[e.to]   !== undefined) adj[e.to].push(e.from);
    });

    const reachable     = new Set();
    const visitedStates = new Set([`${startId}|null`]);
    let frontier = [[startId, null]];

    for (let step = 1; step <= steps; step++) {
        const next = [];
        for (const [cur, prev] of frontier) {
            const neighbors = adj[cur] || [];
            const forward   = neighbors.filter(n => n !== prev);
            const moveable  = forward.length > 0 ? forward : neighbors;

            for (const n of moveable) {
                const key = `${n}|${cur}`;
                if (visitedStates.has(key)) continue;
                visitedStates.add(key);
                next.push([n, cur]);
                if (step < steps && STOP_TYPES.has(typeOf[n])) reachable.add(n);
            }
        }
        frontier = next;
        if (frontier.length === 0) break;
    }

    frontier.forEach(([id]) => reachable.add(id));
    return reachable;
}

// ─────────────────────────────────────────────────────────────
const MapPlayer = ({ game }) => {
    const { playerId } = useParams();
    const navigate     = useNavigate();

    const player     = game?.players?.find(p => p.id === playerId);
    const generation = game?.generation || 1;
    const allPlayers = useMemo(() => game?.players || [], [game?.players]); // eslint-disable-line

    const [gymCoords,        setGymCoords]        = useState([]);
    const [boardGraph,       setBoardGraph]       = useState({ nodes: [], edges: [] });
    const [pokemonsByColor,  setPokemonsByColor]  = useState({});
    const [revealedNodes,    setRevealedNodes]    = useState(new Set());
    const [activeGym,        setActiveGym]        = useState(null);
    const [dice,             setDice]             = useState(null);
    const [rolling,          setRolling]          = useState(false);
    const [reachable,        setReachable]        = useState(new Set());
    const [showCatchModal,   setShowCatchModal]   = useState(false);
    const [catchPokedex,     setCatchPokedex]     = useState(null);
    const [catchChain,       setCatchChain]       = useState(null);
    const [catchNodeId,      setCatchNodeId]      = useState(null);
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [pendingCapture,   setPendingCapture]   = useState(null);
    const [showBattleModal,  setShowBattleModal]  = useState(false);
    const [replacedTokens,   setReplacedTokens]   = useState({});
    const [leaders,          setLeaders]          = useState([]);
    const [showLeaderBattle, setShowLeaderBattle] = useState(false);
    const [leaderBattleGymNum, setLeaderBattleGymNum] = useState(null);
    const prevNodeIdsRef = useRef({});

    const gymNodesMapped = gymCoords.map(g => ({
        id: `gym-${g.order}`, type: 'gym', x: g.x, y: g.y,
        label: `${g.leader} — ${g.city}`, gymOrder: g.order,
    }));
    const allNodes = [...gymNodesMapped, ...boardGraph.nodes];

    useEffect(() => {
        fetch(`${SERVER_IP}/map-coords/${generation}`)
            .then(r => r.json()).then(d => setGymCoords(Array.isArray(d) ? d : []));
        fetch(`${SERVER_IP}/board-nodes/${generation}`)
            .then(r => r.json())
            .then(d => setBoardGraph({ nodes: d.nodes || [], edges: d.edges || [] }))
            .catch(() => setBoardGraph({ nodes: [], edges: [] }));
        fetch(`${SERVER_IP}/pokemons-by-color`)
            .then(r => r.json())
            .then(d => setPokemonsByColor(d))
            .catch(() => {});
        fetch(`${SERVER_IP}/get-leaders?generation=${generation}`)
            .then(r => r.json())
            .then(d => setLeaders(Array.isArray(d) ? d.filter(l => l.category === 'gym') : []))
            .catch(() => {});
    }, [generation]);

    // Revelar nodo solo cuando el jugador SE MUEVE a él (prev ≠ curr)
    useEffect(() => {
        const catchIds = new Set(boardGraph.nodes.filter(n => n.type === 'catch').map(n => n.id));
        allPlayers.forEach(p => {
            const prev = prevNodeIdsRef.current[p.id];
            const curr = p.mapNodeId;
            if (curr && curr !== prev && catchIds.has(curr)) {
                setRevealedNodes(prevSet => { const next = new Set(prevSet); next.add(curr); return next; });
            }
            prevNodeIdsRef.current[p.id] = curr;
        });
    }, [allPlayers, boardGraph.nodes]); // eslint-disable-line

    // Asignación aleatoria estable por sesión: un Pokémon por nodo de captura
    const baseTokens = useMemo(() => {
        const map = {};
        boardGraph.nodes.forEach(node => {
            if (node.type !== 'catch' || !node.catchColor) return;
            const colorName = CATCH_COLOR_NAME[node.catchColor];
            const pool = pokemonsByColor[colorName];
            if (!pool || pool.length === 0) return;
            map[node.id] = pickRandom(pool);
        });
        return map;
    }, [boardGraph.nodes, pokemonsByColor]); // eslint-disable-line
    // replacedTokens overrides baseTokens after a resolution (capture/level-up)
    const nodeTokens = { ...baseTokens, ...replacedTokens };

    useEffect(() => {
        if (dice === null || !player?.mapNodeId) { setReachable(new Set()); return; }
        setReachable(findReachable(player.mapNodeId, dice, boardGraph.edges, allNodes));
    }, [dice, player?.mapNodeId, boardGraph, gymCoords]); // eslint-disable-line

    if (!player) return null;

    const currentNode    = allNodes.find(n => n.id === player.mapNodeId);
    const earned         = gymCoords.filter(g => player[`badge${g.order}`]).length;
    const myColor        = PLAYER_COLORS[allPlayers.indexOf(player) % PLAYER_COLORS.length];
    const canRechallenge = currentNode?.type === 'catch'
        && revealedNodes.has(player.mapNodeId)
        && !!nodeTokens[player.mapNodeId];

    const openCatchModal = (pokedex, nodeId) => {
        setCatchPokedex(pokedex);
        setCatchNodeId(nodeId || null);
        setCatchChain(null);
        setShowCatchModal(true);
        fetch(`${SERVER_IP}/get-evolution-chain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pokedexId: pokedex }),
        })
            .then(r => r.json())
            .then(data => setCatchChain(data))
            .catch(() => {});
    };

    const handleNodeResolved = (nodeId) => {
        // Remove from revealed so token flips back to hidden
        setRevealedNodes(prev => { const next = new Set(prev); next.delete(nodeId); return next; });
        // Assign a new (different) Pokémon to this node
        const node = boardGraph.nodes.find(n => n.id === nodeId);
        if (!node?.catchColor) return;
        const colorName = CATCH_COLOR_NAME[node.catchColor];
        const pool = pokemonsByColor[colorName];
        if (!pool?.length) return;
        const current = nodeTokens[nodeId];
        const filtered = pool.filter(p => p !== current);
        setReplacedTokens(prev => ({ ...prev, [nodeId]: pickRandom(filtered.length > 0 ? filtered : pool) }));
    };

    const closeCatchModal = () => {
        setShowCatchModal(false);
        setCatchPokedex(null);
        setCatchChain(null);
    };

    const handleChallengeLeader = async (gym) => {
        const leader = leaders.find(l => l.sortKey === gym.order);
        if (!leader) return;
        await fetch(`${SERVER_IP}/sim-leader-battle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, LeaderID: leader.leaderKey, pokemonId1: leader.uid1, pokemonId2: leader.uid2 }),
        });
        setLeaderBattleGymNum(gym.order);
        setShowLeaderBattle(true);
    };

    const handleCatchCapture = async () => {
        if (!catchPokedex) return;
        if ((player.pokemons?.length || 0) >= 6) {
            setPendingCapture(catchPokedex);
            setShowCatchModal(false);
            setShowReplaceModal(true);
            return;
        }
        await fetch(`${SERVER_IP}/add-pokemon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, pokemonId: catchPokedex }),
        });
        if (catchNodeId) handleNodeResolved(catchNodeId);
        closeCatchModal();
    };

    const handleCatchFight = async () => {
        if (!catchPokedex) return;
        await fetch(`${SERVER_IP}/sim-wild-battle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, pokemonId: catchPokedex }),
        });
        closeCatchModal();
        setShowBattleModal(true);
    };

    const handleReplaceConfirm = async (removePokemonId) => {
        setShowReplaceModal(false);
        await fetch(`${SERVER_IP}/remove-pokemon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, pokemonId: removePokemonId }),
        });
        await fetch(`${SERVER_IP}/add-pokemon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, pokemonId: pendingCapture }),
        });
        if (catchNodeId) handleNodeResolved(catchNodeId);
        setPendingCapture(null);
    };

    const movePlayer = async (nodeId) => {
        await fetch(`${SERVER_IP}/update-map-position`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, nodeId }),
        });
        setDice(null);
        setReachable(new Set());
        const landedNode = boardGraph.nodes.find(n => n.id === nodeId);
        if (landedNode?.type === 'catch') {
            const pokedex = nodeTokens[nodeId];
            if (pokedex) openCatchModal(pokedex, nodeId);
        }
    };

    const handleBoardNodeClick = (e, nodeId) => {
        e.stopPropagation();
        setActiveGym(null);
        if (!player.mapNodeId || reachable.has(nodeId)) movePlayer(nodeId);
    };

    const handleGymClick = (e, gym) => {
        e.stopPropagation();
        const gymId = `gym-${gym.order}`;
        if (player.mapNodeId && reachable.has(gymId)) {
            movePlayer(gymId);
            return;
        }
        setActiveGym(prev => prev?.order === gym.order ? null : gym);
    };

    const handleRoll = () => {
        setActiveGym(null);
        setDice(null);
        setReachable(new Set());
        setRolling(true);
        setTimeout(() => {
            const result = Math.floor(Math.random() * 6) + 1;
            setDice(result);
            setRolling(false);
        }, 500);
    };

    return (
        <div className="mp-page">
            {/* ── Header ── */}
            <div className="mp-header">
                <button className="mp-back-btn" onClick={() => navigate(`/pokedex/${playerId}`)}>
                    ← Volver
                </button>
                <div className="mp-header-player" style={{ '--pc': myColor }}>
                    <div className="mp-header-dot">{player.name?.[0]?.toUpperCase()}</div>
                    <span className="mp-header-name">{player.name}</span>
                    <span className="mp-header-coins">${player.coins}</span>
                </div>
                <div className="mp-header-info">
                    <span>Gen {generation}</span>
                    <span className="mp-header-badges">🏅 {earned}/{gymCoords.length}</span>
                    {currentNode && <span className="mp-header-loc">{currentNode.label || currentNode.type}</span>}
                </div>
            </div>

            <div className="mp-body">
                {/* ── Mapa ── */}
                <div className="mp-map-container" onClick={() => setActiveGym(null)}>
                    <div className="mp-img-wrapper">
                        <img src={MAPS[generation]} alt={`Mapa Gen ${generation}`} className="mp-img" draggable={false} />

                        {/* Board nodes */}
                        {boardGraph.nodes.map(node => {
                            const isReachable = reachable.has(node.id);
                            const isCurrent   = player.mapNodeId === node.id;
                            return (
                                <div key={node.id}
                                    className={['mp-node', `mp-node--${node.type}`, isReachable ? 'reachable' : '', isCurrent ? 'current' : ''].join(' ')}
                                    style={{ left: `${node.x}%`, top: `${node.y}%`, '--nc': node.catchColor || NODE_COLOR[node.type] }}
                                    onClick={e => handleBoardNodeClick(e, node.id)}
                                    title={node.label || node.type}
                                >
                                    {!isCurrent && !isReachable && NODE_ICON[node.type]}
                                </div>
                            );
                        })}

                        {/* Tokens de Pokémon en nodos de captura */}
                        {boardGraph.nodes.filter(n => n.type === 'catch' && n.tokenDir).map(node => {
                            const off      = TOKEN_DIR_OFFSET[node.tokenDir];
                            const pokedex  = nodeTokens[node.id];
                            const frontImg = pokedex ? getTokenImg(pokedex) : null;
                            const backImg  = BACK_TOKENS[node.catchColor];
                            if (!off || !backImg) return null;
                            const revealed = revealedNodes.has(node.id);
                            return (
                                <div
                                    key={`token-${node.id}`}
                                    className={`mp-token-wrapper ${revealed ? 'revealed' : ''}`}
                                    style={{ left: `${node.x + off.x}%`, top: `${node.y + off.y}%` }}
                                >
                                    <img src={backImg}  alt="token" className="mp-token-face mp-token-back" />
                                    {frontImg && <img src={frontImg} alt={pokedex} className="mp-token-face mp-token-front" />}
                                </div>
                            );
                        })}

                        {/* Gym markers */}
                        {gymCoords.map(g => {
                            const hasBadge  = player[`badge${g.order}`];
                            const badgeImg  = getBadgeImg(generation, g.order);
                            const gymId     = `gym-${g.order}`;
                            const isReachable = reachable.has(gymId);
                            const isCurrent   = player.mapNodeId === gymId;
                            return (
                                <div key={g.order}
                                    className={['mp-gym', hasBadge ? 'earned' : 'missing', activeGym?.order === g.order ? 'active' : '', isReachable ? 'reachable' : '', isCurrent ? 'current' : ''].join(' ')}
                                    style={{ left: `${g.x}%`, top: `${g.y}%` }}
                                    onClick={e => handleGymClick(e, g)}
                                    title={`#${g.order} ${g.leader}`}
                                >
                                    {hasBadge && badgeImg
                                        ? <img src={badgeImg} alt={g.leader} className="mp-gym-badge" />
                                        : <span>{g.order}</span>}
                                </div>
                            );
                        })}

                        {/* Pins de otros jugadores */}
                        {allPlayers.filter(p => p.id !== playerId && p.mapNodeId).map((p, i) => {
                            const node  = allNodes.find(n => n.id === p.mapNodeId);
                            if (!node) return null;
                            const color = PLAYER_COLORS[allPlayers.indexOf(p) % PLAYER_COLORS.length];
                            return (
                                <div key={p.id} className="mp-pin mp-pin--other"
                                    style={{ left: `${node.x}%`, top: `${node.y}%`, '--pc': color }}
                                    title={p.name}>
                                    {p.name?.[0]?.toUpperCase()}
                                </div>
                            );
                        })}

                        {/* Pin del jugador actual */}
                        {player.mapNodeId && currentNode && (
                            <div className="mp-pin mp-pin--me"
                                style={{ left: `${currentNode.x}%`, top: `${currentNode.y}%`, '--pc': myColor }}
                                title={player.name}>
                                {player.name?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Panel lateral ── */}
                <div className="mp-panel">

                    {/* Dados */}
                    <div className="mp-dice-section">
                        <span className="mp-dice-label">
                            {!player.mapNodeId ? 'Toca el tablero para colocarte' : 'Tirada del dado'}
                        </span>
                        {canRechallenge && (
                            <button className="mp-rechallenge-btn" onClick={() => openCatchModal(nodeTokens[player.mapNodeId], player.mapNodeId)}>
                                ⚔ Volver a enfrentar
                            </button>
                        )}
                        {player.mapNodeId && (
                            <>
                                {rolling && <div className="mp-dice-rolling">🎲</div>}
                                {!rolling && dice && (
                                    <div className="mp-dice-result">
                                        <img
                                            key={dice}
                                            src={getDiceImg(dice)}
                                            alt={`Dado ${dice}`}
                                            className="mp-dice-img mp-dice-anim"
                                        />
                                        <button className="mp-dice-reroll" onClick={handleRoll}>🎲 Volver a tirar</button>
                                    </div>
                                )}
                                {!rolling && !dice && (
                                    <button className="mp-dice-roll-btn" onClick={handleRoll}>🎲 Tirar dado</button>
                                )}
                                {dice && !rolling && <span className="mp-dice-hint">{reachable.size} casillas — toca una</span>}
                            </>
                        )}
                    </div>

                    {/* Info del gym seleccionado */}
                    {activeGym && (
                        <div className="mp-gym-info">
                            <div className="mp-gym-info-imgs">
                                {getLeaderImgs(generation, activeGym.order).map(src => (
                                    <img key={src} src={src} alt={activeGym.leader} className="mp-gym-info-img" />
                                ))}
                            </div>
                            <div className="mp-gym-info-details">
                                <div className="mp-gym-info-badge-row">
                                    {getBadgeImg(generation, activeGym.order) && (
                                        <img src={getBadgeImg(generation, activeGym.order)} alt="badge" className="mp-gym-info-badge" />
                                    )}
                                    <span>Medalla #{activeGym.order}</span>
                                </div>
                                <div className="mp-gym-info-name">{activeGym.leader}</div>
                                <div className="mp-gym-info-city">{activeGym.city}</div>
                                <div className={`mp-gym-info-status ${player[`badge${activeGym.order}`] ? 'earned' : 'missing'}`}>
                                    {player[`badge${activeGym.order}`] ? '✓ Obtenida' : '✗ Pendiente'}
                                </div>
                                {!player[`badge${activeGym.order}`] && (
                                    <button className="mp-challenge-btn" onClick={() => handleChallengeLeader(activeGym)}>
                                        ⚔ Retar al Líder
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Resumen medallas */}
                    {!activeGym && (
                        <div className="mp-badges-summary">
                            {gymCoords.slice().sort((a,b) => a.order - b.order).map(g => {
                                const has      = player[`badge${g.order}`];
                                const badgeImg = getBadgeImg(generation, g.order);
                                return (
                                    <div key={g.order} className={`mp-badge-item ${has ? 'earned' : 'missing'}`} onClick={() => setActiveGym(g)}>
                                        {badgeImg
                                            ? <img src={badgeImg} alt={g.leader} className="mp-badge-img" />
                                            : <div className="mp-badge-placeholder">{g.order}</div>}
                                        <span>{g.leader}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Lista de jugadores */}
                    {allPlayers.length > 1 && (
                        <div className="mp-players">
                            <span className="mp-players-title">Jugadores</span>
                            {allPlayers.map((p, i) => {
                                const node  = allNodes.find(n => n.id === p.mapNodeId);
                                const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
                                const isMe  = p.id === playerId;
                                return (
                                    <div key={p.id} className={`mp-player-row ${isMe ? 'me' : ''}`}>
                                        <div className="mp-player-dot" style={{ background: color }}>
                                            {p.name?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="mp-player-name">{p.name}{isMe ? ' (tú)' : ''}</span>
                                        <span className="mp-player-loc">{node?.label || (p.mapNodeId ? node?.type : '—')}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal de batalla salvaje ── */}
            <MapBattleModal
                open={showBattleModal}
                onClose={() => setShowBattleModal(false)}
                player={player}
                generation={generation}
                nodeId={catchNodeId}
                onResolved={handleNodeResolved}
            />

            {/* ── Modal de batalla líder ── */}
            <MapBattleModal
                open={showLeaderBattle}
                onClose={() => setShowLeaderBattle(false)}
                player={player}
                generation={generation}
                badgeNum={leaderBattleGymNum}
            />

            {/* ── Modal captura Pokémon ── */}
            {showCatchModal && (
                <div className="modal-backdrop" style={{ zIndex: 100 }} onClick={closeCatchModal}>
                    <div className="sim-wild-modal" onClick={e => e.stopPropagation()}>
                        <button className="sim-wild-modal-close" onClick={closeCatchModal}>✕</button>
                        <div className="sim-wild-modal-chain">
                            {catchChain ? catchChain.map((node, i) => {
                                const nodeImg = getTokenImg(node.pokedex);
                                if (!nodeImg) return null;
                                return (
                                    <div key={node.pokedex} className="pokedex-step">
                                        {i > 0 && <div className="pokedex-arrow">▶</div>}
                                        <div className="pokedex-token-wrapper">
                                            <div className="pokedex-token" style={{ backgroundImage: `url(${nodeImg})` }} />
                                        </div>
                                        {node.gmax && (() => {
                                            const img = getTokenImg(node.gmax);
                                            return img ? (<><div className="pokedex-arrow pokedex-arrow--gmax" /><div className="pokedex-token-wrapper"><div className="pokedex-token" style={{ backgroundImage: `url(${img})` }} /></div></>) : null;
                                        })()}
                                        {node.megas?.length > 0 && (
                                            <><div className="pokedex-arrow pokedex-arrow--mega" /><div className="pokedex-branches">{node.megas.map(mp => { const img = getTokenImg(mp); return img ? <div key={mp} className="pokedex-branch-group"><div className="pokedex-token-wrapper"><div className="pokedex-token pokedex-token--mega" style={{ backgroundImage: `url(${img})` }} /></div></div> : null; })}</div></>
                                        )}
                                        {node.branches?.length > 0 && (
                                            <><div className="pokedex-arrow">▶</div><div className="pokedex-branches">{node.branches.map(branch => {
                                                const bImg = getTokenImg(branch.pokedex);
                                                if (!bImg) return null;
                                                return (
                                                    <div key={branch.pokedex} className="pokedex-branch-group">
                                                        <div className="pokedex-token-wrapper"><div className="pokedex-token" style={{ backgroundImage: `url(${bImg})` }} /></div>
                                                        {branch.gmax && (() => { const img = getTokenImg(branch.gmax); return img ? (<><div className="pokedex-arrow pokedex-arrow--gmax" /><div className="pokedex-token-wrapper"><div className="pokedex-token" style={{ backgroundImage: `url(${img})` }} /></div></>) : null; })()}
                                                        {branch.megas?.length > 0 && (<><div className="pokedex-arrow pokedex-arrow--mega" /><div className="pokedex-branches">{branch.megas.map(mp => { const img = getTokenImg(mp); return img ? <div key={mp} className="pokedex-branch-group"><div className="pokedex-token-wrapper"><div className="pokedex-token pokedex-token--mega" style={{ backgroundImage: `url(${img})` }} /></div></div> : null; })}</div></>)}
                                                        {branch.nextEvolution && (() => { const img = getTokenImg(branch.nextEvolution); return img ? (<><div className="pokedex-arrow">▶</div><div className="pokedex-token-wrapper"><div className="pokedex-token" style={{ backgroundImage: `url(${img})` }} /></div></>) : null; })()}
                                                    </div>
                                                );
                                            })}</div></>
                                        )}
                                    </div>
                                );
                            }) : <div style={{ color: '#aaa', fontSize: '0.85rem', padding: '1rem' }}>Cargando...</div>}
                        </div>
                        <div className="sim-wild-modal-actions">
                            <button className="sim-wild-modal-fight" onClick={handleCatchFight}>⚔</button>
                            <div className="sim-wild-modal-capture-wrapper" onClick={handleCatchCapture}>
                                <button className="sim-wild-modal-capture" />
                                <span className="sim-wild-modal-capture-label">Capturar</span>
                            </div>
                            <button className="sim-wild-modal-flee" onClick={async () => {
                                await fetch(`${SERVER_IP}/update-coins`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ playerId: player.id, coins: (player.coins || 0) + 1 }),
                                });
                                closeCatchModal();
                            }}>$1</button>
                        </div>
                    </div>
                </div>
            )}

            <VisualDiceHUD allPlayers={allPlayers} myPlayerId={playerId} currentTurnIdx={game?.currentTurn ?? 0} />

            {/* ── Modal equipo lleno ── */}
            {showReplaceModal && (
                <div className="modal-backdrop" style={{ zIndex: 100 }}>
                    <div className="sim-replace-modal" onClick={e => e.stopPropagation()}>
                        <div className="sim-replace-modal-title">Equipo lleno</div>
                        <div className="sim-replace-modal-subtitle">
                            Elige qué Pokémon liberar para capturar a <strong>{pendingCapture}</strong>
                        </div>
                        <div className="sim-replace-modal-grid">
                            {player.pokemons?.map(pkm => {
                                const pkmImg = getTokenImg(pkm.pokedex);
                                return (
                                    <div key={pkm.id} className="sim-replace-pkm-card" onClick={() => handleReplaceConfirm(pkm.id)}>
                                        <div className="sim-replace-pkm-img" style={pkmImg ? { backgroundImage: `url(${pkmImg})` } : {}} />
                                        <PokemonName pkm={pkm} as="div" className="sim-replace-pkm-name" />
                                        <div className="sim-replace-pkm-level">Lv {pkm.level}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="sim-replace-modal-cancel" onClick={() => { setShowReplaceModal(false); setPendingCapture(null); }}>Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPlayer;
