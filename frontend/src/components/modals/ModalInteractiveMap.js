import { useState, useEffect, useRef, useMemo } from 'react';
import SERVER_IP from '../../config';
import { getLeaderArt } from '../../data/leaders';
import { getTrainerAvatar } from '../../data/trainers';
import '../../styles/_modalInteractiveMap.scss';

import mapGen1 from '../../images/maps/gen1.jpg';
import mapGen2 from '../../images/maps/gen2.png';
import mapGen3 from '../../images/maps/gen3.png';
import mapGen4 from '../../images/maps/gen4.png';
import mapGen5 from '../../images/maps/gen5.jpg';

const MAPS = { 1: mapGen1, 2: mapGen2, 3: mapGen3, 4: mapGen4, 5: mapGen5 };

// Cuántas casillas de más puede tener la ruta alternativa para que valga la
// pena enseñarla. Por encima deja de ser una opción y solo estorba el mapa.
const ALT_MAX_EXTRA = 10;

const TOTAL_BADGES = 8;

// Umbral de una puerta. `requiredBadges` guarda las medallas marcadas en el
// editor, pero la regla es «esa medalla o cualquiera superior», así que manda
// la más alta: [3] abre con la 3, 4, 5… y [1..8] abre solo con la 8.
const gateThreshold = (badges) =>
    (Array.isArray(badges) && badges.length) ? Math.max(...badges) : null;

// Texto de una puerta: "la medalla 3 o superior", "la medalla 8".
const describeGate = (badges) => {
    const t = gateThreshold(badges);
    if (!t) return '';
    return t >= TOTAL_BADGES ? `la medalla ${TOTAL_BADGES}` : `la medalla ${t} o superior`;
};

// Marca corta para el punto del mapa: el umbral.
const gateMark = (badges) => gateThreshold(badges) ?? '';

// ─── Mapa de referencia ─────────────────────────────────────────────────────
//
// Muestra dónde está cada líder, en qué orden se le gana la medalla y —donde
// hay tablero dibujado— cuántas casillas faltan hasta el siguiente gimnasio.
// El mapa ocupa toda la pantalla y la ficha del líder se abre encima.
//
// Hoy solo Kanto tiene tablero (`Backend/saves/boardNodes/gen1.json`). En las
// demás generaciones el modal se queda en el mapa y los líderes, sin ficha ni
// ruta: no es un fallo, es que sus nodos aún no están colocados en /map-editor.
//
// Del tablero se usa la topología, no las reglas: aquí no hay dado ni turnos,
// solo el camino más corto. Eso sigue siendo cosa de MapPlayer.js.

// Los dos Pokémon de la carta física del líder (gym3_1, gym3_2).
const getLeaderPokemon = (gen, order) => {
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

// Camino más corto entre dos nodos. BFS a secas: las aristas no tienen peso,
// así que el primero que llega es el mínimo. Devuelve la lista de nodos
// incluyendo origen y destino, o null si no hay ruta.
//
// `canEnter` deja fuera las casillas bloqueadas por medalla: la ruta las
// rodea en vez de atravesarlas. El origen se acepta siempre —si la ficha ya
// está ahí, da igual lo que pida la casilla— y el destino también, para poder
// enseñar la ruta hasta un gimnasio aunque su puerta esté cerrada.
function shortestPath(fromId, toId, adjacency, canEnter = () => true, blockedEdges = null) {
    if (!fromId || !toId || !adjacency[fromId] || !adjacency[toId]) return null;
    if (fromId === toId) return [fromId];

    const prev = { [fromId]: null };
    let frontier = [fromId];

    while (frontier.length) {
        const next = [];
        for (const current of frontier) {
            for (const neighbour of adjacency[current]) {
                if (neighbour in prev) continue;
                if (neighbour !== toId && !canEnter(neighbour)) continue;
                if (blockedEdges?.has(`${current}|${neighbour}`)) continue;
                prev[neighbour] = current;
                if (neighbour === toId) {
                    const path = [];
                    let step = toId;
                    while (step !== null) { path.push(step); step = prev[step]; }
                    return path.reverse();
                }
                next.push(neighbour);
            }
        }
        frontier = next;
    }
    return null;
}

const ModalInteractiveMap = ({ show, onClose, generation = 1, player, onMovePlayer, onToggleSurf }) => {
    const [gyms, setGyms]           = useState([]);
    const [board, setBoard]         = useState({ nodes: [], edges: [] });
    const [active, setActive]       = useState(null);   // líder abierto en el popup
    const [destId, setDestId]       = useState(null);   // destino elegido a mano
    const [dragging, setDragging]   = useState(false);
    const [dropTarget, setDropTarget] = useState(null); // nodo bajo el dedo
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!show) return;
        setActive(null);
        setDestId(null);
        fetch(`${SERVER_IP}/map-coords/${generation}`)
            .then(r => r.json())
            .then(d => setGyms(Array.isArray(d) ? d : []))
            .catch(() => setGyms([]));
        fetch(`${SERVER_IP}/board-nodes/${generation}`)
            .then(r => r.json())
            .then(d => setBoard({ nodes: d.nodes || [], edges: d.edges || [] }))
            .catch(() => setBoard({ nodes: [], edges: [] }));
    }, [show, generation]);

    // Esc cierra primero la ficha del líder y solo después el mapa.
    useEffect(() => {
        if (!show) return;
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (active) { e.stopPropagation(); setActive(null); }
            else onClose?.();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [show, active, onClose]);

    const ordered  = useMemo(() => gyms.slice().sort((a, b) => a.order - b.order), [gyms]);
    const hasBadge = (order) => !!player?.[`badge${order}`];

    // Los gimnasios son nodos del grafo como cualquier otro: las aristas del
    // tablero apuntan a `gym-1`…`gym-8`, así que se mezclan con los del tablero.
    const allNodes = useMemo(() => ([
        ...ordered.map(g => ({ id: `gym-${g.order}`, type: 'gym', x: g.x, y: g.y, label: g.leader })),
        ...board.nodes,
    ]), [ordered, board.nodes]);

    const nodeById = useMemo(() => {
        const map = {};
        allNodes.forEach(n => { map[n.id] = n; });
        return map;
    }, [allNodes]);

    const adjacency = useMemo(() => {
        const adj = {};
        allNodes.forEach(n => { adj[n.id] = []; });
        board.edges.forEach(e => {
            if (adj[e.from] && adj[e.to]) { adj[e.from].push(e.to); adj[e.to].push(e.from); }
        });
        return adj;
    }, [allNodes, board.edges]);

    const hasBoard = board.nodes.length > 0;
    const startNode = board.nodes.find(n => n.type === 'start');

    // Sin posición guardada se parte de la casilla de salida: siempre hay algo
    // que arrastrar, y la salida es donde de verdad empieza todo el mundo.
    const posId = player?.mapNodeId && nodeById[player.mapNodeId]
        ? player.mapNodeId
        : startNode?.id || null;

    const total   = ordered.length;
    const nextGym = ordered.find(m => !hasBadge(m.order));

    // Destino de la ruta: por defecto el siguiente gimnasio pendiente, pero al
    // abrir la ficha de otra ciudad pasa a ser esa. No siempre se va al
    // siguiente, así que el automático es solo el punto de partida.
    // Destino: por defecto el siguiente gimnasio pendiente, pero se puede
    // elegir cualquier gimnasio, ciudad o la Liga tocándolo en el mapa.
    const defaultDestId = nextGym ? `gym-${nextGym.order}` : null;
    const destNodeId = (destId && nodeById[destId]) ? destId : defaultDestId;
    const isCustomDest = !!destNodeId && destNodeId !== defaultDestId;

    // Nombre legible del destino para la cabecera.
    const destLabel = (() => {
        if (!destNodeId) return '';
        const gym = ordered.find(g => `gym-${g.order}` === destNodeId);
        if (gym) return gym.city;
        const node = nodeById[destNodeId];
        if (!node) return '';
        if (node.label?.trim()) return node.label.trim();
        return node.type === 'league' ? 'Liga Pokémon' : 'Ciudad';
    })();

    // Motivo por el que una casilla está cerrada, o null si se puede pisar.
    //
    // La puerta abre con la medalla marcada **o cualquiera superior**: [3] la
    // abren la 3, la 4… hasta la 8. No es un contador —tener tres medallas
    // cualesquiera no basta— sino un umbral por número de medalla.
    //
    // Cuando hay varias marcadas manda la más alta, que es la más restrictiva:
    // por eso la puerta de la Liga con [1..8] solo abre con la medalla 8.
    //
    // Las casillas `surf` van por la habilidad, no por medallas.
    const lockReason = useMemo(() => (id) => {
        const node = nodeById[id];
        if (!node) return null;
        if (node.type === 'surf' && !player?.surf) return { kind: 'surf' };
        const threshold = gateThreshold(node.requiredBadges);
        if (threshold) {
            let abierta = false;
            for (let n = threshold; n <= TOTAL_BADGES; n++) if (hasBadge(n)) { abierta = true; break; }
            if (!abierta) return { kind: 'badge', need: node.requiredBadges, threshold };
        }
        return null;
    }, [nodeById, player]); // eslint-disable-line react-hooks/exhaustive-deps

    const canEnter = useMemo(() => (id) => !lockReason(id), [lockReason]);

    // Ruta mínima respetando las puertas.
    const route = useMemo(() => {
        if (!hasBoard || !posId || !destNodeId) return null;
        return shortestPath(posId, destNodeId, adjacency, canEnter);
    }, [hasBoard, posId, destNodeId, adjacency, canEnter]);

    // Si no hay ruta, ¿es por una puerta o es que el tablero está partido? Se
    // recalcula ignorando los bloqueos para poder decir qué falta exactamente.
    const blockReason = useMemo(() => {
        if (route || !hasBoard || !posId || !destNodeId) return null;
        const open = shortestPath(posId, destNodeId, adjacency);
        if (!open) return null;
        const gate = open.find(id => lockReason(id));
        return gate ? lockReason(gate) : null;
    }, [route, hasBoard, posId, destNodeId, adjacency, lockReason]);

    // Segunda ruta: la mejor alternativa que no repita el camino principal. Se
    // busca cortando de una en una las aristas de la ruta buena y quedándose
    // con el mejor resultado (segundo camino más corto, a lo bruto pero exacto
    // con 115 nodos). Solo se enseña si no es mucho más larga: un rodeo de 30
    // casillas no es una opción, es ruido.
    const altRoute = useMemo(() => {
        if (!route || route.length < 2 || !destNodeId) return null;
        let best = null;
        for (let i = 0; i < route.length - 1; i++) {
            const blocked = new Set([`${route[i]}|${route[i + 1]}`, `${route[i + 1]}|${route[i]}`]);
            const cand = shortestPath(posId, destNodeId, adjacency, canEnter, blocked);
            if (!cand) continue;
            if (cand.length === route.length && cand.every((id, j) => id === route[j])) continue;
            if (!best || cand.length < best.length) best = cand;
        }
        if (!best) return null;
        const extra = best.length - route.length;
        return extra >= 0 && extra <= ALT_MAX_EXTRA ? best : null;
    }, [route, posId, destNodeId, adjacency, canEnter]);

    const routeIds  = useMemo(() => new Set(route || []), [route]);
    const altIds    = useMemo(() => new Set(altRoute || []), [altRoute]);
    const stepsLeft = route ? route.length - 1 : null;
    const altSteps  = altRoute ? altRoute.length - 1 : null;

    // ── Arrastre de la ficha ────────────────────────────────────────────────
    // Pointer events, no drag-and-drop de HTML5: el nativo no dispara en
    // iPad. Se busca el nodo más cercano al dedo en píxeles reales, porque los
    // % de x e y van contra dimensiones distintas y comparar en % deforma.
    const nearestNode = (clientX, clientY) => {
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (!rect) return null;
        let best = null, bestDist = Infinity;
        for (const n of allNodes) {
            const dx = rect.left + (n.x / 100) * rect.width  - clientX;
            const dy = rect.top  + (n.y / 100) * rect.height - clientY;
            const dist = Math.hypot(dx, dy);
            if (dist < bestDist) { bestDist = dist; best = n; }
        }
        return bestDist <= 60 ? best : null;   // 60px: radio de imantado
    };

    const handleTokenDown = (e) => {
        if (!hasBoard) return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setDragging(true);
        setActive(null);
    };

    const handleTokenMove = (e) => {
        if (!dragging) return;
        e.stopPropagation();
        setDropTarget(nearestNode(e.clientX, e.clientY));
    };

    const handleTokenUp = (e) => {
        if (!dragging) return;
        e.stopPropagation();
        const target = nearestNode(e.clientX, e.clientY);
        setDragging(false);
        setDropTarget(null);
        // Una casilla cerrada por medalla no acepta la ficha: es justo lo que
        // significa que no esté disponible todavía.
        if (target && canEnter(target.id) && target.id !== player?.mapNodeId) {
            onMovePlayer?.(target.id);
        }
    };

    if (!show) return null;

    const activeArt   = active ? getLeaderArt(`gym${active.order}_1`, active.leader, generation) : null;
    const activeBadge = active ? getBadgeImg(generation, active.order) : null;
    const activeCards = active ? getLeaderPokemon(generation, active.order) : [];
    const tokenNode   = posId ? nodeById[posId] : null;
    // El avatar se resuelve por nombre, igual que en el HUD de SimPlayer.
    const avatarUrl   = player?.name ? getTrainerAvatar(player.name) : null;

    return (
        <div className="imap-overlay" onClick={onClose}>
            <div className="imap-modal" onClick={e => e.stopPropagation()}>

                {/* El contador de medallas no va aquí: ya se ve en el HUD de
                    SimPlayer, en el home y en los iconos de los entrenadores. */}
                <div className="imap-header">
                    {/* Destino de la ruta y cuántas casillas faltan */}
                    {destNodeId && (
                        <div className={`imap-next ${isCustomDest ? 'custom' : ''}`}>
                            <span className="imap-next-label">{isCustomDest ? 'Destino' : 'Siguiente'}</span>
                            <span className="imap-next-leader">{destLabel}</span>
                            {hasBoard && (
                                <span className="imap-next-steps">
                                    {stepsLeft === 0 ? '¡ya estás aquí!'
                                        : stepsLeft !== null ? `faltan ${stepsLeft} ${stepsLeft === 1 ? 'casilla' : 'casillas'}`
                                        : blockReason?.kind === 'surf' ? 'bloqueado: necesitas Surf'
                                        : blockReason?.kind === 'badge' ? `bloqueado: necesitas ${describeGate(blockReason.need)}`
                                        : 'sin ruta'}
                                </span>
                            )}
                            {altSteps !== null && (
                                <span className="imap-next-alt" title="Segunda ruta">
                                    o {altSteps}
                                </span>
                            )}
                            {isCustomDest && (
                                <span className="imap-next-reset"
                                      onClick={() => setDestId(null)}
                                      title="Volver al siguiente gimnasio">✕</span>
                            )}
                        </div>
                    )}
                    {!destNodeId && total > 0 && (
                        <div className="imap-next"><span className="imap-next-leader">¡Todas las medallas!</span></div>
                    )}

                    {/* Empuja Surf y la ✕ a la derecha ahora que la barra de
                        progreso, que era quien ocupaba el hueco, ya no está */}
                    <div className="imap-header-spacer" />

                    {/* Surf abre las casillas de agua. Se activa aquí a mano
                        mientras no haya un objeto o evento que la conceda. */}
                    {hasBoard && onToggleSurf && (
                        <div className={`imap-surf ${player?.surf ? 'on' : ''}`}
                             onClick={() => onToggleSurf(!player?.surf)}
                             title={player?.surf ? 'Surf activo — clic para quitarlo' : 'Sin Surf — clic para activarlo'}>
                            <span className="imap-surf-icon">≈</span>
                            <span>Surf</span>
                        </div>
                    )}

                    <div className="imap-close" onClick={onClose}>✕</div>
                </div>

                <div className="imap-body">
                    <div className="imap-map-container" onClick={() => setActive(null)}>
                        <div className="imap-img-wrapper" ref={wrapperRef}>
                            <img src={MAPS[generation]} alt={`Mapa Gen ${generation}`} className="imap-img" draggable={false} />

                            {/* Trazo de la ruta mínima. viewBox 0-100 + preserveAspectRatio
                                none hace que los % de los nodos sean las coordenadas. */}
                            {route && route.length > 1 && (
                                <svg className="imap-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {/* La alternativa va debajo para que la principal mande */}
                                    {altRoute && altRoute.slice(0, -1).map((id, i) => {
                                        const a = nodeById[id], b = nodeById[altRoute[i + 1]];
                                        if (!a || !b) return null;
                                        return (
                                            <line key={`alt-${id}`} className="alt"
                                                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                                  vectorEffect="non-scaling-stroke" />
                                        );
                                    })}
                                    {route.slice(0, -1).map((id, i) => {
                                        const a = nodeById[id], b = nodeById[route[i + 1]];
                                        if (!a || !b) return null;
                                        return (
                                            <line key={id} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                                  vectorEffect="non-scaling-stroke" />
                                        );
                                    })}
                                </svg>
                            )}

                            {/* Casillas del tablero: discretas de fondo, todas visibles
                                mientras se arrastra para poder apuntar. */}
                            {hasBoard && board.nodes.map(n => {
                                const inRoute = routeIds.has(n.id);
                                const inAlt   = altIds.has(n.id);
                                const lock    = lockReason(n.id);
                                // Ciudades y Liga se ven siempre: son los sitios a
                                // los que uno quiere ir, así que hacen de destino.
                                const landmark = n.type === 'city' || n.type === 'league';
                                // Las cerradas también: saber dónde está el muro
                                // importa más que tener el mapa limpio.
                                if (!inRoute && !inAlt && !lock && !landmark && !dragging) return null;
                                const name = n.label?.trim() || (n.type === 'league' ? 'Liga Pokémon' : 'Ciudad');
                                return (
                                    <div key={n.id}
                                        className={[
                                            'imap-node',
                                            landmark ? 'landmark' : '',
                                            `imap-node--${n.type}`,
                                            inRoute ? 'in-route' : (inAlt ? 'in-alt' : ''),
                                            lock ? 'locked' : '',
                                            !lock && dropTarget?.id === n.id ? 'drop' : '',
                                            n.id === posId ? 'is-pos' : '',
                                            destNodeId === n.id ? 'is-dest' : '',
                                        ].join(' ')}
                                        style={{ left: `${n.x}%`, top: `${n.y}%` }}
                                        onClick={landmark ? (e) => {
                                            e.stopPropagation();
                                            setActive(null);
                                            setDestId(prev => prev === n.id ? null : n.id);
                                        } : undefined}
                                        title={!lock
                                            ? (landmark ? `${name} — tocar para ir aquí` : (n.label || n.type))
                                            : lock.kind === 'surf'
                                                ? 'Bloqueado — necesitas Surf'
                                                : `Bloqueado — necesitas ${describeGate(lock.need)}`}
                                    >
                                        {lock && (
                                            <span className="imap-node-lock">
                                                {lock.kind === 'surf' ? '≈' : gateMark(lock.need)}
                                            </span>
                                        )}
                                        {landmark && !lock && (
                                            <span className="imap-node-icon">{n.type === 'league' ? '★' : 'C'}</span>
                                        )}
                                    </div>
                                );
                            })}

                            {ordered.map(m => {
                                const won   = hasBadge(m.order);
                                const art   = getLeaderArt(`gym${m.order}_1`, m.leader, generation);
                                const badge = getBadgeImg(generation, m.order);
                                return (
                                    <div
                                        key={m.order}
                                        className={[
                                            'imap-marker',
                                            won ? 'earned' : 'missing',
                                            active?.order === m.order ? 'active' : '',
                                            nextGym?.order === m.order ? 'next' : '',
                                            destNodeId === `gym-${m.order}` ? 'is-dest' : '',
                                            dropTarget?.id === `gym-${m.order}` ? 'drop' : '',
                                        ].join(' ')}
                                        style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                        onClick={e => {
                                            e.stopPropagation();
                                            // Abrir una ciudad la fija como destino de la ruta
                                            const closing = active?.order === m.order;
                                            setActive(closing ? null : m);
                                            if (!closing) setDestId(`gym-${m.order}`);
                                        }}
                                        title={`#${m.order} · ${m.leader} — ${m.city}`}
                                    >
                                        {art.src
                                            ? <img src={art.src} alt={m.leader} className="imap-marker-face" />
                                            : <span className="imap-marker-initial">{m.leader?.[0]}</span>}

                                        <span className="imap-marker-order">{m.order}</span>

                                        {won && badge && <img src={badge} alt="" className="imap-marker-badge" />}

                                        <span className="imap-marker-name">{m.leader}</span>
                                    </div>
                                );
                            })}

                            {/* Ficha del jugador: se arrastra a cualquier casilla */}
                            {hasBoard && tokenNode && (
                                <div
                                    className={`imap-player-token ${dragging ? 'dragging' : ''} ${player?.mapNodeId ? '' : 'unset'}`}
                                    style={{ left: `${tokenNode.x}%`, top: `${tokenNode.y}%` }}
                                    onPointerDown={handleTokenDown}
                                    onPointerMove={handleTokenMove}
                                    onPointerUp={handleTokenUp}
                                    onPointerCancel={handleTokenUp}
                                    onClick={e => e.stopPropagation()}
                                    title={`${player?.name || 'Tu ficha'} — arrástrala a otra casilla`}
                                >
                                    {/* Tarjeta con pico, no círculo: los redondos con
                                        foto ya son los líderes de gimnasio, y las
                                        casillas del tablero repiten los mismos
                                        colores. La forma distingue mejor que el tono. */}
                                    {avatarUrl
                                        ? <img src={avatarUrl} alt={player?.name || ''} className="imap-player-token-face" />
                                        : <span className="imap-player-token-initial">{player?.name?.[0]?.toUpperCase() || '?'}</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Aviso cuando la región aún no tiene tablero dibujado */}
                    {!hasBoard && (
                        <div className="imap-noboard">Esta región aún no tiene tablero: solo mapa y líderes</div>
                    )}

                    {/* ── Ficha del líder: modal dentro del modal ── */}
                    {active && (
                        <div className="imap-leader-backdrop" onClick={() => setActive(null)}>
                            <div className="imap-leader-card" onClick={e => e.stopPropagation()}>

                                <div className="imap-leader-head">
                                    {activeArt?.src && (
                                        <img src={activeArt.src} alt={active.leader} className="imap-leader-face" />
                                    )}
                                    <div className="imap-leader-id">
                                        <span className="imap-leader-name">{active.leader}</span>
                                        <span className="imap-leader-city">{active.city}</span>
                                    </div>
                                    <div className="imap-leader-close" onClick={() => setActive(null)}>✕</div>
                                </div>

                                <div className="imap-leader-meta">
                                    {activeBadge && <img src={activeBadge} alt="" className="imap-leader-badge" />}
                                    <span className="imap-leader-order">Medalla #{active.order}</span>
                                    <span className={`imap-leader-status ${hasBadge(active.order) ? 'earned' : 'missing'}`}>
                                        {hasBadge(active.order) ? '✓ Obtenida' : '✗ Pendiente'}
                                    </span>
                                </div>

                                <div className="imap-leader-cards">
                                    {activeCards.length > 0
                                        ? activeCards.map(src => (
                                            <img key={src} src={src} alt={active.leader} className="imap-leader-card-img" />
                                        ))
                                        : <span className="imap-leader-nocards">Sin cartas para este líder</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalInteractiveMap;
