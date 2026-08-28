import { useState, useEffect, useRef } from 'react';
import SERVER_IP from '../config';
import '../styles/_mapEditor.scss';

import mapGen1 from '../images/maps/gen1.jpg';
import mapGen2 from '../images/maps/gen2.png';
import mapGen3 from '../images/maps/gen3.png';
import mapGen4 from '../images/maps/gen4.png';
import mapGen5 from '../images/maps/gen5.jpg';

const MAPS = { 1: mapGen1, 2: mapGen2, 3: mapGen3, 4: mapGen4, 5: mapGen5 };

// Solo son los valores por defecto al colocar un gimnasio NUEVO: al pinchar en
// uno existente el formulario se rellena desde el fichero, no desde aquí.
// Aun así deben coincidir con `saves/mapCoords/`, porque un nombre distinto
// rompe la búsqueda del retrato (Surge → surge.webp, no "Lt. Surge").
const GYM_LEADERS = {
    1: ['Brock', 'Misty', 'Surge', 'Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni'],
    2: ['Falkner', 'Bugsy', 'Whitney', 'Morty', 'Chuck', 'Jasmine', 'Pryce', 'Clair'],
    3: ['Roxanne', 'Brawly', 'Wattson', 'Flannery', 'Norman', 'Winona', 'Tate & Liza', 'Wallace'],
    4: ['Roark', 'Gardenia', 'Maylene', 'Crasher Wake', 'Fantina', 'Byron', 'Candice', 'Volkner'],
    5: ['Cheren', 'Roxie', 'Burgh', 'Elesa', 'Clay', 'Skyla', 'Drayden', 'Marlon'],
};

const CITIES = {
    1: ['Ciudad Plateada', 'Ciudad Celeste', 'Ciudad Carmín', 'Ciudad Azulona', 'Ciudad Fucsia', 'Ciudad Azafran', 'Isla Canela', 'Ciudad Verde'],
    2: ['Ciudad Malva', 'Ciudad Ázalea', 'Ciudad Goldenrod', 'Ciudad Escarcha', 'Ciudad Olivina', 'Ciudad Acero', 'Ciudad Mahogany', 'Ciudad Blackthorn'],
    3: ['Ciudad Rocavelo', 'Ciudad Dorsalia', 'Ciudad Mauville', 'Ciudad Lavaridge', 'Petalburg City', 'Ciudad Fortree', 'Mossdeep City', 'Ciudad Sootópolis'],
    4: ['Oreburgh City', 'Ciudad Eterna', 'Ciudad Mauville', 'Ciudad Pastoria', 'Ciudad Hearthome', 'Ciudad Canalave', 'Ciudad Snowpoint', 'Ciudad Sunyshore'],
    5: ['Ciudad Angora', 'Ciudad Loza', 'Ciudad Porcelana', 'Ciudad Mayólica', 'Ciudad Esmalte', 'Ciudad Fayenza', 'Ciudad Teja', 'Ciudad Nacarada'],
};

// ── Catch node colors ──────────────────────────────────────────
const CATCH_COLORS = [
    { value: '#e91e63', label: 'Rosa'     },
    { value: '#27ae60', label: 'Verde'    },
    { value: '#f1c40f', label: 'Amarillo' },
    { value: '#3498db', label: 'Azul'     },
    { value: '#e74c3c', label: 'Rojo'     },
    { value: '#9b59b6', label: 'Morado'   },
];

const TOKEN_DIR_GRID = [
    ['top-left',    'top',    'top-right'   ],
    ['left',         null,    'right'       ],
    ['bottom-left', 'bottom', 'bottom-right'],
];
const TOKEN_DIR_ICONS = {
    'top-left': '↖', 'top': '↑', 'top-right': '↗',
    'left': '←',                  'right': '→',
    'bottom-left': '↙', 'bottom': '↓', 'bottom-right': '↘',
};

// ── Board node config ──────────────────────────────────────────
const NODE_TYPES = [
    { value: 'start',  label: 'Inicio',           color: '#27ae60', icon: '▶' },
    { value: 'catch',  label: 'Captura',           color: '#3498db', icon: '●' },
    { value: 'event',  label: 'Evento',            color: '#e67e22', icon: '!' },
    { value: 'league', label: 'Liga Pokémon',      color: '#8e44ad', icon: '★' },
    { value: 'city',   label: 'Ciudad (Centro/Tienda)', color: '#16a085', icon: 'C' },
    { value: 'surf',   label: 'Surf',              color: '#00bcd4', icon: '≈' },
    { value: 'medals', label: 'Medallas',          color: '#e91e63', icon: 'M' },
];

const NODE_COLOR = { gym: '#f1c40f', start: '#27ae60', catch: '#3498db', event: '#e67e22', league: '#8e44ad', city: '#16a085', surf: '#00bcd4', medals: '#e91e63' };
const NODE_ICON  = { gym: null, start: '▶', catch: '●', event: '!', league: '★', city: 'C', surf: '≈', medals: 'M' };

const EMPTY_FORM = { order: 1, city: '', leader: '', type: 'gym' };

// ──────────────────────────────────────────────────────────────
const MapEditor = () => {
    const [editorMode, setEditorMode] = useState('gyms');
    const [gen, setGen] = useState(1);

    // ── Gym mode ──────────────────────────────────────────────
    const [markers, setMarkers]       = useState([]);
    const [pending, setPending]       = useState(null);
    const [form, setForm]             = useState(EMPTY_FORM);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [saved, setSaved]           = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        fetch(`${SERVER_IP}/map-coords/${gen}`)
            .then(r => r.json())
            .then(data => setMarkers(Array.isArray(data) ? data : []))
            .catch(() => setMarkers([]));
        setPending(null); setSelectedIdx(null); setForm(EMPTY_FORM);
    }, [gen]);

    const handleMapClick = (e) => {
        if (e.target.closest('.map-editor-marker')) return;
        const rect = imgRef.current.getBoundingClientRect();
        const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
        const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));
        const nextOrder = markers.length + 1;
        setPending({ x, y });
        setSelectedIdx(null);
        setForm({
            order: nextOrder,
            city: CITIES[gen]?.[nextOrder - 1] || '',
            leader: GYM_LEADERS[gen]?.[nextOrder - 1] || '',
            type: 'gym',
        });
    };

    const handleMarkerClick = (e, idx) => {
        e.stopPropagation(); setSelectedIdx(idx); setPending(null); setForm({ ...markers[idx] });
    };

    const handleConfirm = () => {
        if (pending) {
            setMarkers(prev => [...prev, { ...form, order: parseInt(form.order), ...pending }]);
            setPending(null);
        } else if (selectedIdx !== null) {
            setMarkers(prev => prev.map((m, i) => i === selectedIdx ? { ...form, order: parseInt(form.order) } : m));
            setSelectedIdx(null);
        }
        setForm(EMPTY_FORM); setSaved(false);
    };

    const handleDelete = (idx) => {
        setMarkers(prev => prev.filter((_, i) => i !== idx));
        setSelectedIdx(null); setForm(EMPTY_FORM); setSaved(false);
    };

    const handleSave = async () => {
        await fetch(`${SERVER_IP}/map-coords/${gen}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(markers),
        });
        setSaved(true);
    };

    const isEditing = pending !== null || selectedIdx !== null;

    // ── Board mode ────────────────────────────────────────────
    const [boardNodes, setBoardNodes]           = useState([]);
    const [gymNodes, setGymNodes]               = useState([]);
    const [edges, setEdges]                     = useState([]);
    const [connectMode, setConnectMode]         = useState(false);
    const [connectStart, setConnectStart]       = useState(null);
    const [selNodeId, setSelNodeId]             = useState(null);
    const [newNodeType, setNewNodeType]         = useState('catch');
    const [newCatchColor, setNewCatchColor]     = useState('#3498db');
    const [newTokenDir, setNewTokenDir]         = useState('top');
    const [newNodeLabel, setNewNodeLabel]       = useState('');
    const [boardSaved, setBoardSaved]           = useState(false);
    const boardImgRef = useRef(null);

    // Gym nodes as read-only board nodes
    const gymNodesMapped = gymNodes.map(g => ({
        id: `gym-${g.order}`, type: 'gym', x: g.x, y: g.y,
        label: `${g.leader} — ${g.city}`, gymOrder: g.order, readonly: true,
    }));
    const allNodes = [...gymNodesMapped, ...boardNodes];
    const selNode  = allNodes.find(n => n.id === selNodeId);

    useEffect(() => {
        if (editorMode !== 'board') return;
        fetch(`${SERVER_IP}/map-coords/${gen}`)
            .then(r => r.json()).then(d => setGymNodes(Array.isArray(d) ? d : []));
        fetch(`${SERVER_IP}/board-nodes/${gen}`)
            .then(r => r.json())
            .then(d => { setBoardNodes(d.nodes || []); setEdges(d.edges || []); })
            .catch(() => { setBoardNodes([]); setEdges([]); });
        setConnectMode(false); setConnectStart(null); setSelNodeId(null); setBoardSaved(false);
    }, [editorMode, gen]);

    const handleBoardMapClick = (e) => {
        if (connectMode) return;
        if (e.target.closest('.map-board-node')) return;
        const rect = boardImgRef.current.getBoundingClientRect();
        const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
        const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));
        const defaults = { start: 'Inicio', league: 'Liga Pokémon', catch: '', event: '', city: '', surf: 'Surf', medals: 'Entrega de Medallas' };
        setBoardNodes(prev => [...prev, {
            id: `node-${Date.now()}`, type: newNodeType, x, y,
            label: newNodeLabel || defaults[newNodeType] || '',
            ...(newNodeType === 'catch' ? { catchColor: newCatchColor, tokenDir: newTokenDir } : {}),
        }]);
        setBoardSaved(false);
    };

    const handleBoardNodeClick = (e, nodeId) => {
        e.stopPropagation();
        if (connectMode) {
            if (!connectStart) { setConnectStart(nodeId); return; }
            if (connectStart === nodeId) { setConnectStart(null); return; }
            const exists = edges.some(
                ed => (ed.from === connectStart && ed.to === nodeId) ||
                      (ed.from === nodeId && ed.to === connectStart)
            );
            if (!exists) { setEdges(prev => [...prev, { from: connectStart, to: nodeId }]); setBoardSaved(false); }
            setConnectStart(null);
        } else {
            setSelNodeId(prev => prev === nodeId ? null : nodeId);
        }
    };

    const handleDeleteBoardNode = (nodeId) => {
        setBoardNodes(prev => prev.filter(n => n.id !== nodeId));
        setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId));
        setSelNodeId(null); setBoardSaved(false);
    };

    const handleDeleteEdge = (idx) => { setEdges(prev => prev.filter((_, i) => i !== idx)); setBoardSaved(false); };

    const handleUpdateCatchColor = (color) => {
        setBoardNodes(prev => prev.map(n => n.id === selNodeId ? { ...n, catchColor: color } : n));
        setBoardSaved(false);
    };

    const handleUpdateTokenDir = (dir) => {
        setBoardNodes(prev => prev.map(n => n.id === selNodeId ? { ...n, tokenDir: dir } : n));
        setBoardSaved(false);
    };

    // Puerta por medallas concretas: `requiredBadges: [3]` pide LA medalla 3,
    // no tres medallas. Se exigen todas las de la lista, así que la puerta de
    // la Liga lleva las ocho. Lista vacía = sin puerta, y entonces se borra el
    // campo en vez de dejar un array vacío, para no ensuciar el JSON.
    const setRequiredBadges = (badges) => {
        setBoardNodes(prev => prev.map(n => {
            if (n.id !== selNodeId) return n;
            const { requiredBadges, ...rest } = n;
            return badges.length
                ? { ...rest, requiredBadges: badges.slice().sort((a, b) => a - b) }
                : rest;
        }));
        setBoardSaved(false);
    };

    // Renombrar un nodo ya colocado. Hace falta para las ciudades: el mapa las
    // ofrece como destino y sin etiqueta todas se llamarían "Ciudad".
    const handleUpdateLabel = (texto) => {
        setBoardNodes(prev => prev.map(n => n.id === selNodeId ? { ...n, label: texto } : n));
        setBoardSaved(false);
    };

    const handleToggleBadge = (num) => {
        const actuales = selNode?.requiredBadges || [];
        setRequiredBadges(actuales.includes(num)
            ? actuales.filter(b => b !== num)
            : [...actuales, num]);
    };

    const handleSaveBoard = async () => {
        await fetch(`${SERVER_IP}/board-nodes/${gen}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodes: boardNodes, edges }),
        });
        setBoardSaved(true);
    };

    const selNodeEdges = edges
        .filter(e => e.from === selNodeId || e.to === selNodeId)
        .map((e) => {
            const otherId = e.from === selNodeId ? e.to : e.from;
            const other = allNodes.find(n => n.id === otherId);
            return { ...e, _idx: edges.indexOf(e), otherLabel: other?.label || other?.type || otherId };
        });

    // ──────────────────────────────────────────────────────────
    return (
        <div className="map-editor">
            {/* ── Header ── */}
            <div className="map-editor-header">
                <div className="map-editor-mode-tabs">
                    <button className={`map-editor-mode-tab ${editorMode === 'gyms' ? 'active' : ''}`} onClick={() => setEditorMode('gyms')}>Medallas</button>
                    <button className={`map-editor-mode-tab ${editorMode === 'board' ? 'active' : ''}`} onClick={() => setEditorMode('board')}>Tablero</button>
                </div>
                <div className="map-editor-gens">
                    {[1, 2, 3, 4, 5].map(g => (
                        <button key={g} className={`map-editor-gen-btn ${gen === g ? 'active' : ''}`} onClick={() => setGen(g)}>Gen {g}</button>
                    ))}
                </div>
                <button
                    className={`map-editor-save-btn ${(editorMode === 'gyms' ? saved : boardSaved) ? 'saved' : ''}`}
                    onClick={editorMode === 'gyms' ? handleSave : handleSaveBoard}
                >
                    {(editorMode === 'gyms' ? saved : boardSaved) ? 'Guardado ✓' : 'Guardar'}
                </button>
            </div>

            <div className="map-editor-body">
                {/* ══════════════ GYM MODE ══════════════ */}
                {editorMode === 'gyms' && (<>
                    <div className="map-editor-map-wrap">
                        <div className="map-editor-map-container" onClick={handleMapClick}>
                            <img ref={imgRef} src={MAPS[gen]} alt={`Mapa Gen ${gen}`} className="map-editor-img" draggable={false} />
                            {markers.map((m, i) => (
                                <div key={i} className={`map-editor-marker ${selectedIdx === i ? 'selected' : ''}`}
                                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                                    onClick={(e) => handleMarkerClick(e, i)}
                                    title={`#${m.order} ${m.leader} — ${m.city}`}>
                                    {m.order}
                                </div>
                            ))}
                            {pending && (
                                <div className="map-editor-marker pending" style={{ left: `${pending.x}%`, top: `${pending.y}%` }}>?</div>
                            )}
                        </div>
                        <p className="map-editor-hint">Haz click en el mapa para agregar una ciudad</p>
                    </div>

                    <div className="map-editor-panel">
                        {isEditing ? (<>
                            <h3>{pending ? 'Nuevo marcador' : `Editando #${markers[selectedIdx]?.order}`}</h3>
                            <label>Número de medalla</label>
                            <input type="number" min={1} max={8} value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} />
                            <label>Ciudad</label>
                            <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                            <label>Líder</label>
                            <input type="text" value={form.leader} onChange={e => setForm(f => ({ ...f, leader: e.target.value }))} />
                            <div className="map-editor-panel-actions">
                                <button className="map-editor-confirm-btn" onClick={handleConfirm}>{pending ? 'Agregar' : 'Actualizar'}</button>
                                {selectedIdx !== null && <button className="map-editor-delete-btn" onClick={() => handleDelete(selectedIdx)}>Eliminar</button>}
                                <button className="map-editor-cancel-btn" onClick={() => { setPending(null); setSelectedIdx(null); }}>Cancelar</button>
                            </div>
                        </>) : (
                            <p className="map-editor-panel-idle">Haz click en el mapa para colocar un marcador, o en uno existente para editarlo.</p>
                        )}
                        <div className="map-editor-list">
                            <h4>Marcadores ({markers.length})</h4>
                            {markers.slice().sort((a, b) => a.order - b.order).map((m, i) => {
                                const origIdx = markers.indexOf(m);
                                return (
                                    <div key={i} className={`map-editor-list-item ${selectedIdx === origIdx ? 'selected' : ''}`} onClick={(e) => handleMarkerClick(e, origIdx)}>
                                        <span className="map-editor-list-num">#{m.order}</span>
                                        <span className="map-editor-list-leader">{m.leader}</span>
                                        <span className="map-editor-list-city">{m.city}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>)}

                {/* ══════════════ BOARD MODE ══════════════ */}
                {editorMode === 'board' && (<>
                    <div className="map-editor-map-wrap">
                        <div
                            className={`map-editor-map-container ${connectMode ? 'cursor-connect' : 'cursor-place'}`}
                            onClick={handleBoardMapClick}
                        >
                            <img ref={boardImgRef} src={MAPS[gen]} alt={`Mapa Gen ${gen}`} className="map-editor-img" draggable={false} />

                            {/* SVG overlay for edges */}
                            <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                className="map-board-svg"
                            >
                                {edges.map((edge, i) => {
                                    const from = allNodes.find(n => n.id === edge.from);
                                    const to   = allNodes.find(n => n.id === edge.to);
                                    if (!from || !to) return null;
                                    const isHighlighted = edge.from === selNodeId || edge.to === selNodeId;
                                    return (
                                        <line key={i}
                                            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                            stroke={isHighlighted ? '#f39c12' : 'rgba(255,255,255,0.45)'}
                                            strokeWidth={isHighlighted ? 0.45 : 0.25}
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    );
                                })}
                                {/* Pulse ring on connect-start node */}
                                {connectStart && (() => {
                                    const n = allNodes.find(nd => nd.id === connectStart);
                                    return n ? <circle cx={n.x} cy={n.y} r="2" fill="none" stroke="#3498db" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2 1" /> : null;
                                })()}
                            </svg>

                            {/* Board nodes */}
                            {allNodes.map(node => (
                                <div
                                    key={node.id}
                                    className={[
                                        'map-board-node',
                                        `map-board-node--${node.type}`,
                                        selNodeId === node.id   ? 'selected'      : '',
                                        connectStart === node.id ? 'connect-start' : '',
                                        node.requiredBadges?.length ? 'has-gate' : '',
                                    ].join(' ')}
                                    style={{ left: `${node.x}%`, top: `${node.y}%`, '--node-color': node.catchColor || NODE_COLOR[node.type] }}
                                    onClick={e => handleBoardNodeClick(e, node.id)}
                                    title={node.requiredBadges?.length
                                        ? `${node.label || node.type} — pide ${node.requiredBadges.length >= 8 ? 'las 8 medallas' : 'la medalla ' + node.requiredBadges.join(', ')}`
                                        : (node.label || node.type)}
                                >
                                    {node.type === 'gym' ? node.gymOrder : NODE_ICON[node.type]}
                                    {/* Marca la puerta sin abrir el panel */}
                                    {node.requiredBadges?.length > 0 && (
                                        <span className="map-board-node-gate">
                                            {node.requiredBadges.length >= 8 ? '★'
                                                : node.requiredBadges.length === 1 ? node.requiredBadges[0]
                                                : node.requiredBadges.length + '·'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="map-editor-hint">
                            {connectMode
                                ? connectStart
                                    ? '🔗 Ahora click en el segundo nodo para conectar'
                                    : '🔗 Modo conexión — click en el primer nodo'
                                : '📍 Click en el mapa para colocar un nodo'}
                        </p>
                    </div>

                    {/* Board side panel */}
                    <div className="map-editor-panel">
                        {/* Mode toggle */}
                        <div className="map-board-mode-toggle">
                            <button className={`map-board-toggle-btn ${!connectMode ? 'active' : ''}`} onClick={() => { setConnectMode(false); setConnectStart(null); }}>
                                📍 Colocar
                            </button>
                            <button className={`map-board-toggle-btn ${connectMode ? 'active' : ''}`} onClick={() => { setConnectMode(true); setSelNodeId(null); }}>
                                🔗 Conectar
                            </button>
                        </div>

                        {/* Place mode: type selector */}
                        {!connectMode && (<>
                            <label>Tipo de nodo</label>
                            <div className="map-board-type-grid">
                                {NODE_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        className={`map-board-type-btn ${newNodeType === t.value ? 'active' : ''}`}
                                        style={{ '--type-color': t.color }}
                                        onClick={() => setNewNodeType(t.value)}
                                    >
                                        <span className="map-board-type-icon">{t.icon}</span>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            {newNodeType === 'catch' && (<>
                                <label>Color de captura</label>
                                <div className="map-board-catch-colors">
                                    {CATCH_COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            className={`map-board-catch-color-btn ${newCatchColor === c.value ? 'active' : ''}`}
                                            style={{ '--cc': c.value }}
                                            title={c.label}
                                            onClick={() => setNewCatchColor(c.value)}
                                        />
                                    ))}
                                </div>
                                <label>Posición del token</label>
                                <div className="map-board-dir-grid">
                                    {TOKEN_DIR_GRID.map((row, r) => (
                                        <div key={r} className="map-board-dir-row">
                                            {row.map((dir, c) => dir
                                                ? <button key={c}
                                                    className={`map-board-dir-btn ${newTokenDir === dir ? 'active' : ''}`}
                                                    onClick={() => setNewTokenDir(dir)}
                                                  >{TOKEN_DIR_ICONS[dir]}</button>
                                                : <div key={c} className="map-board-dir-center">●</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>)}
                            <label>Etiqueta (opcional)</label>
                            <input type="text" value={newNodeLabel} placeholder="ej. Inicio del juego" onChange={e => setNewNodeLabel(e.target.value)} />
                        </>)}

                        {/* Connect mode: instructions */}
                        {connectMode && (
                            <p className="map-board-connect-hint">
                                {connectStart
                                    ? <>Nodo origen seleccionado.<br />Haz click en otro nodo para conectar.</>
                                    : 'Haz click en un nodo para iniciar una conexión.'}
                            </p>
                        )}

                        {/* Selected node info */}
                        {selNode && !connectMode && (
                            <div className="map-board-sel-node">
                                <div className="map-board-sel-header">
                                    <span className="map-board-sel-badge" style={{ background: selNode.catchColor || NODE_COLOR[selNode.type] }}>
                                        {selNode.type === 'gym' ? selNode.gymOrder : NODE_ICON[selNode.type]}
                                    </span>
                                    <span className="map-board-sel-label">{selNode.label || selNode.type}</span>
                                    {!selNode.readonly && (
                                        <button className="map-board-sel-delete" onClick={() => handleDeleteBoardNode(selNode.id)}>✕</button>
                                    )}
                                </div>
                                {selNode.type === 'catch' && !selNode.readonly && (
                                    <>
                                        <div className="map-board-catch-colors" style={{ marginBottom: '6px' }}>
                                            {CATCH_COLORS.map(c => (
                                                <button
                                                    key={c.value}
                                                    className={`map-board-catch-color-btn ${selNode.catchColor === c.value ? 'active' : ''}`}
                                                    style={{ '--cc': c.value }}
                                                    title={c.label}
                                                    onClick={() => handleUpdateCatchColor(c.value)}
                                                />
                                            ))}
                                        </div>
                                        <span className="map-board-connections-title" style={{ padding: '4px 10px 2px', display: 'block' }}>Posición del token</span>
                                        <div className="map-board-dir-grid" style={{ padding: '0 10px 6px' }}>
                                            {TOKEN_DIR_GRID.map((row, r) => (
                                                <div key={r} className="map-board-dir-row">
                                                    {row.map((dir, c) => dir
                                                        ? <button key={c}
                                                            className={`map-board-dir-btn ${selNode.tokenDir === dir ? 'active' : ''}`}
                                                            onClick={() => handleUpdateTokenDir(dir)}
                                                          >{TOKEN_DIR_ICONS[dir]}</button>
                                                        : <div key={c} className="map-board-dir-center">●</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                                {/* Nombre del nodo. Las ciudades se pueden elegir
                                    como destino en el mapa, así que conviene
                                    ponerles el nombre real. */}
                                {!selNode.readonly && (
                                    <div className="map-board-label-edit">
                                        <span className="map-board-connections-title">Nombre</span>
                                        <input
                                            type="text"
                                            value={selNode.label || ''}
                                            placeholder={selNode.type === 'city' ? 'ej. Ciudad Lavanda' : 'sin nombre'}
                                            onChange={e => handleUpdateLabel(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Puerta por medallas concretas. Vale para cualquier
                                    tipo de nodo, no solo los de medallas: una puerta
                                    puede estar en mitad de una ruta. */}
                                {!selNode.readonly && (() => {
                                    const sel = selNode.requiredBadges || [];
                                    return (
                                        <>
                                            <span className="map-board-connections-title" style={{ padding: '6px 10px 2px', display: 'block' }}>
                                                Puerta — ¿qué medallas pide?
                                            </span>
                                            <div className="map-board-badge-grid">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                                    <button
                                                        key={n}
                                                        className={`map-board-badge-btn ${sel.includes(n) ? 'active' : ''}`}
                                                        onClick={() => handleToggleBadge(n)}
                                                        title={`Exigir la medalla ${n}`}
                                                    >{n}</button>
                                                ))}
                                            </div>
                                            <div className="map-board-badge-actions">
                                                <button onClick={() => setRequiredBadges([1, 2, 3, 4, 5, 6, 7, 8])}>Las 8</button>
                                                <button onClick={() => setRequiredBadges([])}>Sin puerta</button>
                                            </div>
                                            <p className="map-board-badge-hint">
                                                {sel.length === 0
                                                    ? (selNode.type === 'surf'
                                                        ? 'Sin puerta (las casillas de agua ya piden Surf aparte)'
                                                        : 'Sin puerta: se puede pasar siempre')
                                                    : sel.length >= 8
                                                        ? 'Cerrada hasta tener las 8 medallas'
                                                        : sel.length === 1
                                                            ? `Cerrada hasta tener la medalla ${sel[0]}`
                                                            : `Cerrada hasta tener las medallas ${sel.slice().sort((a, b) => a - b).join(', ')}`}
                                            </p>
                                        </>
                                    );
                                })()}

                                {selNodeEdges.length > 0 && (
                                    <div className="map-board-connections">
                                        <span className="map-board-connections-title">Conexiones ({selNodeEdges.length})</span>
                                        {selNodeEdges.map(e => (
                                            <div key={e._idx} className="map-board-connection-item">
                                                <span>{e.otherLabel}</span>
                                                <button onClick={() => handleDeleteEdge(e._idx)}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="map-board-stats">
                            <span>{allNodes.length} nodos</span>
                            <span>{edges.length} conexiones</span>
                        </div>
                    </div>
                </>)}
            </div>
        </div>
    );
};

export default MapEditor;
