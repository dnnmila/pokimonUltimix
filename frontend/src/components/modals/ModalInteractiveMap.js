import { useState, useEffect } from 'react';
import SERVER_IP from '../../config';
import '../../styles/_modalInteractiveMap.scss';

import mapGen1 from '../../images/maps/gen1.jpg';
import mapGen2 from '../../images/maps/gen2.png';
import mapGen3 from '../../images/maps/gen3.png';
import mapGen4 from '../../images/maps/gen4.png';

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

const TOKEN_DIR_OFFSET = {
    'top':          { x: 0,    y: -1.6 },
    'bottom':       { x: 0,    y:  1.6 },
    'left':         { x: -1.4, y:  0   },
    'right':        { x:  1.4, y:  0   },
    'top-left':     { x: -1.1, y: -1.1 },
    'top-right':    { x:  1.1, y: -1.1 },
    'bottom-left':  { x: -1.1, y:  1.1 },
    'bottom-right': { x:  1.1, y:  1.1 },
};

const getLeaderImgs = (gen, order) => {
    const imgs = [];
    try { imgs.push(require(`../../images/Leaders${gen}/gym${order}_1.png`)); } catch {}
    try { imgs.push(require(`../../images/Leaders${gen}/gym${order}_2.png`)); } catch {}
    return imgs;
};

const getBadgeImg = (gen, order) => {
    try { return require(`../../images/badges/badges${gen}/badge${order}.webp`); } catch {
        try { return require(`../../images/badges/badge${order}.png`); } catch { return null; }
    }
};

// Tipos de nodo donde el jugador puede detenerse antes de agotar el dado
const STOP_TYPES = new Set(['gym', 'city', 'medals', 'league']);

// BFS con dos reglas:
//   1. Sin retroceso inmediato (no volver al nodo anterior en el mismo paso)
//   2. visitedStates evita ciclos/oscilaciones
//   3. Ciudades/gyms en pasos intermedios son paradas opcionales válidas
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
    const visitedStates = new Set([`${startId}|null`]); // evita ciclos
    let frontier = [[startId, null]]; // [currentId, prevId]

    for (let step = 1; step <= steps; step++) {
        const next = [];
        for (const [cur, prev] of frontier) {
            const neighbors = adj[cur] || [];
            const forward   = neighbors.filter(n => n !== prev);
            const moveable  = forward.length > 0 ? forward : neighbors; // dead-end: forzado a volver

            for (const n of moveable) {
                const key = `${n}|${cur}`;
                if (visitedStates.has(key)) continue; // no repetir el mismo arco direccional
                visitedStates.add(key);
                next.push([n, cur]);

                // Ciudad/gym a paso intermedio → parada opcional
                if (step < steps && STOP_TYPES.has(typeOf[n])) {
                    reachable.add(n);
                }
            }
        }
        frontier = next;
        if (frontier.length === 0) break;
    }

    // Todos los nodos al paso exacto N siempre son destinos válidos
    frontier.forEach(([id]) => reachable.add(id));

    return reachable;
}

// ─────────────────────────────────────────────────────────────
const ModalInteractiveMap = ({ show, onClose, generation = 1, player, allPlayers = [], onMovePlayer }) => {
    const [gymCoords, setGymCoords]   = useState([]);
    const [boardGraph, setBoardGraph] = useState({ nodes: [], edges: [] });
    const [active, setActive]         = useState(null);   // gym marker clicked
    const [dice, setDice]             = useState(null);
    const [reachable, setReachable]   = useState(new Set());

    // All nodes merged (gym + board) — misma lógica que el editor
    const gymNodesMapped = gymCoords.map(g => ({
        id: `gym-${g.order}`, type: 'gym', x: g.x, y: g.y,
        label: `${g.leader} — ${g.city}`, gymOrder: g.order,
    }));
    const allNodes = [...gymNodesMapped, ...boardGraph.nodes];

    useEffect(() => {
        if (!show) return;
        setActive(null); setDice(null); setReachable(new Set());
        fetch(`${SERVER_IP}/map-coords/${generation}`)
            .then(r => r.json()).then(d => setGymCoords(Array.isArray(d) ? d : []));
        fetch(`${SERVER_IP}/board-nodes/${generation}`)
            .then(r => r.json())
            .then(d => setBoardGraph({ nodes: d.nodes || [], edges: d.edges || [] }))
            .catch(() => setBoardGraph({ nodes: [], edges: [] }));
    }, [show, generation]);

    // Recalcular alcanzables cuando cambia el dado o la posición
    useEffect(() => {
        if (dice === null || !player?.mapNodeId) { setReachable(new Set()); return; }
        setReachable(findReachable(player.mapNodeId, dice, boardGraph.edges, allNodes));
    }, [dice, player?.mapNodeId, boardGraph, gymCoords]); // eslint-disable-line

    if (!show) return null;

    const earned = gymCoords.filter(m => player?.[`badge${m.order}`]).length;
    const total  = gymCoords.length;
    const currentNode = allNodes.find(n => n.id === player?.mapNodeId);

    const handleBoardNodeClick = (e, nodeId) => {
        e.stopPropagation();
        setActive(null);

        // Sin posición inicial → colocarse aquí
        if (!player?.mapNodeId) {
            onMovePlayer?.(nodeId);
            return;
        }
        // Nodo alcanzable → moverse
        if (reachable.has(nodeId)) {
            onMovePlayer?.(nodeId);
            setDice(null);
            setReachable(new Set());
        }
    };

    const handleGymClick = (e, gymCoord) => {
        e.stopPropagation();
        // Si es alcanzable → mover
        const gymNodeId = `gym-${gymCoord.order}`;
        if (player?.mapNodeId && reachable.has(gymNodeId)) {
            onMovePlayer?.(gymNodeId);
            setDice(null); setReachable(new Set());
            return;
        }
        setActive(prev => prev?.order === gymCoord.order ? null : gymCoord);
    };

    const handleDice = (n) => {
        setActive(null);
        setDice(prev => prev === n ? null : n);
    };

    return (
        <div className="imap-overlay" onClick={onClose}>
            <div className="imap-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="imap-header">
                    <div className="imap-progress">
                        <span className="imap-progress-label">Medallas: {earned}/{total}</span>
                        <div className="imap-progress-bar">
                            <div className="imap-progress-fill" style={{ width: total ? `${(earned/total)*100}%` : '0%' }} />
                        </div>
                    </div>
                    <div className="imap-close" onClick={onClose}>✕</div>
                </div>

                <div className="imap-body">
                    {/* ── Mapa ── */}
                    <div className="imap-map-container" onClick={() => { setActive(null); }}>
                        <div className="imap-img-wrapper">
                            <img src={MAPS[generation]} alt={`Mapa Gen ${generation}`} className="imap-img" draggable={false} />

                            {/* Board nodes (pequeños) */}
                            {boardGraph.nodes.map(node => {
                                const isReachable = reachable.has(node.id);
                                const isCurrent   = player?.mapNodeId === node.id;
                                return (
                                    <div
                                        key={node.id}
                                        className={[
                                            'imap-board-node',
                                            `imap-board-node--${node.type}`,
                                            isReachable ? 'reachable' : '',
                                            isCurrent   ? 'current-pos' : '',
                                        ].join(' ')}
                                        style={{ left: `${node.x}%`, top: `${node.y}%`, '--nc': node.catchColor || NODE_COLOR[node.type] }}
                                        onClick={e => handleBoardNodeClick(e, node.id)}
                                        title={node.label || node.type}
                                    >
                                        {isCurrent ? null : (isReachable ? '' : NODE_ICON[node.type])}
                                    </div>
                                );
                            })}

                            {/* Token placeholders para nodos de captura */}
                            {boardGraph.nodes.filter(n => n.type === 'catch' && n.tokenDir).map(node => {
                                const off = TOKEN_DIR_OFFSET[node.tokenDir];
                                if (!off) return null;
                                return (
                                    <div key={`token-${node.id}`}
                                        className="imap-token"
                                        style={{
                                            left: `${node.x + off.x}%`,
                                            top:  `${node.y + off.y}%`,
                                            '--tc': node.catchColor || '#888',
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    />
                                );
                            })}

                            {/* Gym markers (grandes, con estado de medalla) */}
                            {gymCoords.map(m => {
                                const hasBadge  = player?.[`badge${m.order}`];
                                const badgeImg  = getBadgeImg(generation, m.order);
                                const gymId     = `gym-${m.order}`;
                                const isReachable = reachable.has(gymId);
                                const isCurrent   = player?.mapNodeId === gymId;
                                return (
                                    <div
                                        key={m.order}
                                        className={[
                                            'imap-marker',
                                            hasBadge ? 'earned' : 'missing',
                                            active?.order === m.order ? 'active' : '',
                                            isReachable ? 'reachable' : '',
                                            isCurrent   ? 'current-pos' : '',
                                        ].join(' ')}
                                        style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                        onClick={e => handleGymClick(e, m)}
                                        title={`#${m.order} ${m.leader}`}
                                    >
                                        {hasBadge && badgeImg
                                            ? <img src={badgeImg} alt={m.leader} className="imap-marker-badge" />
                                            : <span>{m.order}</span>
                                        }
                                    </div>
                                );
                            })}

                            {/* Pins de otros jugadores */}
                            {allPlayers.filter(p => p.id !== player?.id && p.mapNodeId).map((p) => {
                                const node = allNodes.find(n => n.id === p.mapNodeId);
                                if (!node) return null;
                                const color = PLAYER_COLORS[allPlayers.indexOf(p) % PLAYER_COLORS.length];
                                return (
                                    <div key={p.id} className="imap-player-pin imap-player-pin--other"
                                        style={{ left: `${node.x}%`, top: `${node.y}%`, '--pc': color }}
                                        title={p.name}>
                                        {p.name?.[0]?.toUpperCase()}
                                    </div>
                                );
                            })}

                            {/* Pin del jugador actual */}
                            {player?.mapNodeId && currentNode && (() => {
                                const myColor = PLAYER_COLORS[allPlayers.indexOf(player) % PLAYER_COLORS.length] || '#e74c3c';
                                return (
                                    <div className="imap-player-pin imap-player-pin--me"
                                        style={{ left: `${currentNode.x}%`, top: `${currentNode.y}%`, '--pc': myColor }}
                                        title={player.name}>
                                        {player.name?.[0]?.toUpperCase()}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* ── Panel lateral ── */}
                    <div className={`imap-panel ${active || true ? 'open' : ''}`}>

                        {/* Dados */}
                        <div className="imap-dice-section">
                            <span className="imap-dice-label">
                                {!player?.mapNodeId ? 'Toca un nodo para colocarte' : 'Tirada del dado'}
                            </span>
                            {player?.mapNodeId && (
                                <div className="imap-dice-grid">
                                    {[1,2,3,4,5,6].map(n => (
                                        <button
                                            key={n}
                                            className={`imap-dice-btn ${dice === n ? 'active' : ''}`}
                                            onClick={() => handleDice(n)}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {dice && <span className="imap-dice-hint">{reachable.size} casillas alcanzables — toca una</span>}
                        </div>

                        {/* Info de gym seleccionado */}
                        {active ? (
                            <>
                                <div className="imap-panel-leader-imgs">
                                    {getLeaderImgs(generation, active.order).map((src) => (
                                        <img key={src} src={src} alt={active.leader} className="imap-panel-leader-img" />
                                    ))}
                                </div>
                                <div className="imap-panel-info">
                                    <div className="imap-panel-badge-row">
                                        {getBadgeImg(generation, active.order) && (
                                            <img src={getBadgeImg(generation, active.order)} alt="badge" className="imap-panel-badge-img" />
                                        )}
                                        <span className="imap-panel-order">Medalla #{active.order}</span>
                                    </div>
                                    <div className="imap-panel-leader">{active.leader}</div>
                                    <div className="imap-panel-city">{active.city}</div>
                                    <div className={`imap-panel-status ${player?.[`badge${active.order}`] ? 'earned' : 'missing'}`}>
                                        {player?.[`badge${active.order}`] ? '✓ Medalla obtenida' : '✗ Pendiente'}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Resumen de medallas */
                            <div className="imap-panel-badges-summary">
                                {gymCoords.slice().sort((a,b) => a.order - b.order).map(m => {
                                    const hasBadge = player?.[`badge${m.order}`];
                                    const badgeImg = getBadgeImg(generation, m.order);
                                    return (
                                        <div key={m.order}
                                            className={`imap-summary-item ${hasBadge ? 'earned' : 'missing'}`}
                                            onClick={() => setActive(m)}>
                                            {badgeImg
                                                ? <img src={badgeImg} alt={m.leader} className="imap-summary-badge" />
                                                : <div className="imap-summary-badge-placeholder">{m.order}</div>}
                                            <span>{m.leader}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Posiciones de todos los jugadores */}
                        {allPlayers.length > 1 && (
                            <div className="imap-players-list">
                                <span className="imap-players-title">Jugadores</span>
                                {allPlayers.map((p, i) => {
                                    const node = allNodes.find(n => n.id === p.mapNodeId);
                                    const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
                                    const isMe  = p.id === player?.id;
                                    return (
                                        <div key={p.id} className={`imap-player-row ${isMe ? 'me' : ''}`}>
                                            <div className="imap-player-dot" style={{ background: color }}>
                                                {p.name?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="imap-player-name">{p.name}{isMe ? ' (tú)' : ''}</span>
                                            <span className="imap-player-loc">{node?.label || (p.mapNodeId ? node?.type : '—')}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalInteractiveMap;
