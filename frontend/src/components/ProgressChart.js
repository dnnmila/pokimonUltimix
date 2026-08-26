import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import SERVER_IP from '../config';
import { getTrainerAvatar } from '../data/trainers';
import '../styles/_progressChart.scss';

// Línea de tiempo de la partida: un carril por jugador, el eje son las rondas y
// encima se marca lo que le pasó a cada uno. Sustituye a la gráfica de líneas de
// medallas, que solo sabía contar y no decía nada de POR QUÉ alguien se quedó
// atrás.
//
// Los datos salen de los cinco historiales del `game` (ver Backend/models/Game.js).
// Ojo con dos detalles al leerlos:
//   · Solo `badgeHistory` y `gymHistory` traen `playerId`; los otros tres se
//     cruzan por `playerName`.
//   · El 'lost' de `badgeHistory` es el máster QUITANDO una medalla, no un
//     combate perdido. Las derrotas de verdad viven en `gymHistory`.

const PLAYER_COLORS = ['#60a5fa', '#4ade80', '#f472b6', '#facc15', '#f87171', '#c084fc', '#fb923c', '#34d399'];

const ROW_H  = 88;   // alto de cada carril — lo comparte el SCSS vía --pt-row-h
const AXIS_H = 32;   // cabecera de rondas, dentro del propio SVG
const MIN_ROUND_W = 62;
const MAX_ROUND_W = 130;
const MAX_MARKERS = 6; // por ronda y carril; el resto se agrupa en un "+n"

// Tipos de marca. El orden de esta lista es el orden de pintado dentro de una
// misma ronda: primero lo importante.
const KINDS = [
    { id: 'badge',   label: 'Medalla',     color: '#f0d080' },
    { id: 'gymLost', label: 'Derrota gym', color: '#f87171' },
    { id: 'catch',   label: 'Capturó',     color: '#38bdf8' },
    { id: 'faint',   label: 'Debilitado',  color: '#94a3b8' },
    { id: 'levelUp', label: 'Subió nivel', color: '#4ade80' },
    { id: 'shop',    label: 'Tienda',      color: '#fbbf24' },
];
const KIND_ORDER = KINDS.reduce((acc, k, i) => ({ ...acc, [k.id]: i }), {});

const getBadgeImg = (gen, num) => {
    if (num <= 8) {
        try {
            return require(`../images/badges/badges${gen}/badge${num}.webp`);
        } catch (e) {
            try {
                return require(`../images/badges/badge${num}.png`);
            } catch {
                return null;
            }
        }
    }
    if (num === 9) {
        try { return require('../images/badges/elite.png'); } catch { return null; }
    }
    if (num === 10) {
        try { return require('../images/badges/campion.png'); } catch { return null; }
    }
    return null;
};

// El token de siempre. Los pokedex raros (formas nuevas sin arte) devuelven null
// y la marca cae en la Poké Ball genérica.
const getPkmToken = (pokedex) => {
    if (!pokedex) return null;
    try { return require(`../images/tokens_ultimix/${pokedex}.png`); } catch { return null; }
};

// ─── Historiales → eventos por jugador ───────────────────────────────────────
const buildEvents = (game) => {
    const players = game.players || [];
    const byName  = new Map(players.map(p => [p.name, p]));
    const out     = new Map(players.map(p => [p.id, []]));

    const push = (playerId, ev) => {
        const arr = out.get(playerId);
        if (arr) arr.push(ev);
    };

    (game.badgeHistory || []).forEach(e => {
        if (e.action !== 'won') return;
        push(e.playerId, {
            kind: 'badge', round: e.round, timestamp: e.timestamp, badge: e.badge,
            title: e.badge === 10 ? 'Campeón' : e.badge === 9 ? 'Alto Mando' : `Medalla ${e.badge}`,
            detail: '',
        });
    });

    (game.gymHistory || []).forEach(e => {
        push(e.playerId, {
            kind: 'gymLost', round: e.round, timestamp: e.timestamp, badge: e.badge,
            title: e.gymName ? `Perdió contra ${e.gymName}` : 'Reto de gimnasio fallado',
            detail: e.badge ? `Gimnasio ${e.badge} · medalla no conseguida` : '',
        });
    });

    (game.catchHistory || []).forEach(e => {
        push(e.playerId, {
            kind: 'catch', round: e.round, timestamp: e.timestamp, pokedex: e.pokedex,
            title: `Consiguió a ${e.pokemonName}`, detail: '',
        });
    });

    (game.stateHistory || []).forEach(e => {
        // `changeState` alterna: los registros con newState 'Alive' son
        // reanimaciones del máster y no son un KO. Los que vienen de abandonar
        // una batalla no traen el campo y siempre son KO.
        if (e.newState && e.newState !== 'Dead') return;
        const p = byName.get(e.playerName);
        if (!p) return;
        const vs = e.rivalPokemonName
            ? `contra ${e.rivalPokemonName}${e.rivalName ? ` · ${e.rivalName}` : ''}`
            : (e.rivalName ? `contra ${e.rivalName}` : '');
        push(p.id, {
            kind: 'faint', round: e.round, timestamp: e.timestamp,
            title: `${e.pokemonName} debilitado`, detail: vs,
        });
    });

    (game.levelHistory || []).forEach(e => {
        const p = byName.get(e.playerName);
        if (!p) return;
        push(p.id, {
            kind: 'levelUp', round: e.round, timestamp: e.timestamp,
            title: `${e.pokemonName} Nv ${e.previousLevel} → ${e.newLevel}`,
            detail: e.rivalPokemonName ? `contra ${e.rivalPokemonName}` : '',
        });
    });

    (game.purchaseHistory || []).forEach(e => {
        const p = byName.get(e.playerName);
        if (!p) return;
        const sell = e.kind === 'sell';
        push(p.id, {
            kind: 'shop', round: e.round, timestamp: e.timestamp,
            title: `${sell ? 'Vendió' : 'Compró'} ${e.item}`,
            detail: `${sell ? '+' : '−'}${e.price} monedas · quedan ${e.coinsAfter}`,
        });
    });

    out.forEach(arr => arr.sort((a, b) =>
        (a.round - b.round) || (KIND_ORDER[a.kind] - KIND_ORDER[b.kind])));
    return out;
};

// Reparto de n marcas dentro del ancho de una ronda. Hasta dos van en línea;
// de tres en adelante se escalonan en dos alturas en vez de encogerse o
// pisarse — para eso el carril es alto. Devuelve desplazamientos respecto al
// centro de la ronda.
const spread = (n, roundW) => {
    if (n <= 1) return [{ dx: 0, dy: 0 }];
    const rows  = n > 2 ? 2 : 1;
    const upper = Math.ceil(n / rows);          // marcas en la fila de arriba
    const gap   = Math.min(30, (roundW - 8) / upper);
    return Array.from({ length: n }, (_, i) => {
        const row   = rows === 1 ? 0 : i % 2;   // alternas: par arriba, impar abajo
        const col   = rows === 1 ? i : Math.floor(i / 2);
        const inRow = rows === 1 ? n : (row === 0 ? upper : n - upper);
        return {
            dx: -((inRow - 1) * gap) / 2 + col * gap,
            dy: rows === 1 ? 0 : (row === 0 ? -17 : 17),
        };
    });
};

// ─── Dibujo de una marca ─────────────────────────────────────────────────────
const Marker = ({ ev, generation }) => {
    switch (ev.kind) {
        case 'badge': {
            const img = getBadgeImg(generation, ev.badge);
            if (img) return (
                <>
                    <circle r={13} className="pt-marker-halo" />
                    <image href={img} x={-11} y={-11} width={22} height={22} />
                </>
            );
            return (
                <>
                    <circle r={11} fill="#f0d080" />
                    <text y={4} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#1a1a2e">
                        {ev.badge}
                    </text>
                </>
            );
        }
        // La derrota enseña la medalla que se escapó, apagada y en gris, con un
        // aspa roja de pega en la esquina: así se ve DE QUÉ gimnasio fue sin
        // tener que pasar el ratón, y hace pareja con la marca de victoria.
        case 'gymLost': {
            const img = ev.badge ? getBadgeImg(generation, ev.badge) : null;
            return (
                <>
                    <circle r={12} fill="#2a0d10" stroke="#f87171" strokeWidth={1.8} strokeOpacity={0.75} />
                    {img ? (
                        <image href={img} x={-9} y={-9} width={18} height={18}
                               opacity={0.5} filter="url(#pt-desat)" />
                    ) : (
                        <text y={4} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#f87171">
                            {ev.badge || '?'}
                        </text>
                    )}
                    <circle cx={9} cy={8} r={6} fill="#f87171" stroke="#2a0d10" strokeWidth={1.5} />
                    <path d="M6.9 5.9 L11.1 10.1 M11.1 5.9 L6.9 10.1"
                          stroke="#2a0d10" strokeWidth={1.8} strokeLinecap="round" />
                </>
            );
        }
        // La captura enseña al Pokémon: es lo que se quiere ver de un vistazo al
        // repasar la partida. Sin token, una Poké Ball dibujada a mano.
        case 'catch': {
            const img = getPkmToken(ev.pokedex);
            return (
                <>
                    <circle r={15} fill="#0b2b3d" stroke="#38bdf8" strokeWidth={1.6} strokeOpacity={0.8} />
                    {img ? (
                        <image href={img} x={-13} y={-13} width={26} height={26} />
                    ) : (
                        <>
                            <circle r={8} fill="#e5e7eb" />
                            <path d="M-8 0 A8 8 0 0 1 8 0 Z" fill="#ef4444" />
                            <path d="M-8 0 H8" stroke="#1f2937" strokeWidth={1.6} />
                            <circle r={2.6} fill="#f9fafb" stroke="#1f2937" strokeWidth={1.4} />
                        </>
                    )}
                </>
            );
        }
        case 'faint':
            return (
                <>
                    <circle r={7} fill="#1e293b" stroke="#94a3b8" strokeWidth={1.6} />
                    <path d="M-3.2 0 H3.2" stroke="#94a3b8" strokeWidth={2} strokeLinecap="round" />
                </>
            );
        case 'levelUp':
            return <path d="M0-7 L6 4 H-6 Z" fill="#4ade80" opacity={0.9} />;
        case 'shop':
            return (
                <>
                    <circle r={6} fill="#fbbf24" opacity={0.85} />
                    <circle r={2.4} fill="#1a1a2e" />
                </>
            );
        default:
            return null;
    }
};

// ─── Componente ──────────────────────────────────────────────────────────────
const ProgressChart = () => {
    const [game, setGame] = useState({ players: [], round: 0, generation: 1 });
    const [active, setActive] = useState(() => new Set(KINDS.map(k => k.id)));
    const [hover, setHover] = useState(null);

    const scrollRef = useRef(null);
    const [viewW, setViewW] = useState(900);

    useEffect(() => {
        const socket = io(SERVER_IP);
        socket.on('gameUpdated', (updatedGame) => setGame(updatedGame));
        return () => {
            socket.off('gameUpdated');
            socket.disconnect();
        };
    }, []);

    // El carril se estira para llenar el hueco cuando hay pocas rondas y pasa a
    // desplazarse cuando ya no caben. Sin medir el contenedor no hay forma de
    // saber cuál de las dos toca.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(([entry]) => setViewW(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const players    = game.players || [];
    const maxRound   = game.round || 0;
    const generation = game.generation || 1;
    const rounds     = maxRound + 1; // la ronda 0 también cuenta

    const eventsByPlayer = useMemo(() => buildEvents(game), [game]);

    const roundW = Math.max(MIN_ROUND_W, Math.min(MAX_ROUND_W, viewW / rounds));
    const laneW  = roundW * rounds;
    const svgH   = AXIS_H + players.length * ROW_H;
    const x      = (r) => roundW / 2 + r * roundW;

    const toggle = (id) => setActive(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const showTip = (e, payload) => {
        const box = scrollRef.current?.getBoundingClientRect();
        if (!box) return;
        setHover({
            ...payload,
            left: e.clientX - box.left + scrollRef.current.scrollLeft,
            top:  e.clientY - box.top,
        });
    };

    return (
        <div className="progress-chart-page">
            <div className="pt-header">
                <div className="progress-chart-title">Historial de la partida</div>
                <div className="progress-chart-round">Ronda actual: {maxRound}</div>
            </div>

            {players.length === 0 ? (
                <div className="progress-chart-empty">Esperando jugadores...</div>
            ) : (
                <>
                    <div className="pt-filters">
                        {KINDS.map(k => (
                            <button
                                key={k.id}
                                type="button"
                                className={`pt-filter ${active.has(k.id) ? 'is-on' : ''}`}
                                style={{ '--pt-filter-color': k.color }}
                                onClick={() => toggle(k.id)}
                            >
                                <span className="pt-filter-dot" />
                                {k.label}
                            </button>
                        ))}
                    </div>

                    <div className="pt-board" style={{ '--pt-row-h': `${ROW_H}px`, '--pt-axis-h': `${AXIS_H}px` }}>
                        <div className="pt-names">
                            <div className="pt-names-spacer" />
                            {players.map((player, idx) => {
                                const evs    = eventsByPlayer.get(player.id) || [];
                                const count  = (kind) => evs.filter(e => e.kind === kind).length;
                                const color  = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                                return (
                                    <div key={player.id} className="pt-name-row" style={{ '--pt-color': color }}>
                                        <div
                                            className="pt-name-avatar"
                                            style={{ backgroundImage: `url(${getTrainerAvatar(player.name)})` }}
                                        />
                                        <div className="pt-name-text">
                                            <div className="pt-name-label">{player.name}</div>
                                            <div className="pt-name-stats">
                                                <span className="pt-stat pt-stat--badge" title="Medallas">{count('badge')}</span>
                                                <span className="pt-stat pt-stat--lost"  title="Derrotas de gimnasio">{count('gymLost')}</span>
                                                <span className="pt-stat pt-stat--catch" title="Pokémon conseguidos">{count('catch')}</span>
                                                <span className="pt-stat pt-stat--faint" title="Pokémon debilitados">{count('faint')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-scroll" ref={scrollRef}>
                            <svg
                                width={laneW}
                                height={svgH}
                                className="pt-svg"
                                xmlns="http://www.w3.org/2000/svg"
                                onMouseLeave={() => setHover(null)}
                            >
                                <defs>
                                    {/* Apaga el color de la medalla que se escapó */}
                                    <filter id="pt-desat">
                                        <feColorMatrix type="saturate" values="0" />
                                    </filter>
                                </defs>

                                {/* Rejilla de rondas + cabecera */}
                                {Array.from({ length: rounds }, (_, r) => (
                                    <g key={`r-${r}`}>
                                        <line
                                            x1={x(r)} y1={AXIS_H} x2={x(r)} y2={svgH}
                                            stroke="white"
                                            strokeOpacity={r === maxRound ? 0.22 : 0.07}
                                            strokeWidth={1}
                                        />
                                        <text
                                            x={x(r)} y={AXIS_H - 11}
                                            textAnchor="middle"
                                            fontSize={11}
                                            fill={r === maxRound ? '#f0d080' : 'rgba(255,255,255,0.45)'}
                                            fontWeight={r === maxRound ? 'bold' : 'normal'}
                                        >
                                            {`R${r}`}
                                        </text>
                                    </g>
                                ))}

                                {/* Carriles */}
                                {players.map((player, idx) => {
                                    const color   = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                                    const evs     = (eventsByPlayer.get(player.id) || [])
                                        .filter(e => active.has(e.kind));
                                    const lastRnd = evs.length ? evs[evs.length - 1].round : 0;
                                    const top     = AXIS_H + idx * ROW_H;
                                    const mid     = ROW_H / 2;

                                    // Agrupar por ronda para repartir las marcas
                                    const byRound = new Map();
                                    evs.forEach(e => {
                                        if (!byRound.has(e.round)) byRound.set(e.round, []);
                                        byRound.get(e.round).push(e);
                                    });

                                    return (
                                        <g key={player.id} transform={`translate(0, ${top})`}>
                                            {idx % 2 === 1 && (
                                                <rect x={0} y={0} width={laneW} height={ROW_H} fill="white" fillOpacity={0.02} />
                                            )}
                                            {/* Pista de fondo + tramo recorrido */}
                                            <line x1={x(0)} y1={mid} x2={x(maxRound)} y2={mid}
                                                  stroke="white" strokeOpacity={0.08} strokeWidth={2} strokeLinecap="round" />
                                            {lastRnd > 0 && (
                                                <line x1={x(0)} y1={mid} x2={x(lastRnd)} y2={mid}
                                                      stroke={color} strokeOpacity={0.55} strokeWidth={2.5} strokeLinecap="round" />
                                            )}

                                            {[...byRound.entries()].map(([round, list]) => {
                                                const extra   = list.length > MAX_MARKERS ? list.length - (MAX_MARKERS - 1) : 0;
                                                const shown   = extra ? list.slice(0, MAX_MARKERS - 1) : list;
                                                const slots   = spread(shown.length + (extra ? 1 : 0), roundW);
                                                const baseX   = x(round);
                                                return (
                                                    <g key={`${player.id}-${round}`}>
                                                        {shown.map((ev, i) => (
                                                            <g
                                                                key={i}
                                                                transform={`translate(${baseX + slots[i].dx}, ${mid + slots[i].dy})`}
                                                                className="pt-marker"
                                                                onMouseEnter={(e) => showTip(e, {
                                                                    playerName: player.name, round, events: [ev], color,
                                                                })}
                                                            >
                                                                <circle r={15} fill="transparent" />
                                                                <Marker ev={ev} generation={generation} />
                                                            </g>
                                                        ))}
                                                        {extra > 0 && (
                                                            <g
                                                                transform={`translate(${baseX + slots[slots.length - 1].dx}, ${mid + slots[slots.length - 1].dy})`}
                                                                className="pt-marker"
                                                                onMouseEnter={(e) => showTip(e, {
                                                                    playerName: player.name, round,
                                                                    events: list.slice(MAX_MARKERS - 1), color,
                                                                })}
                                                            >
                                                                <circle r={9} fill="rgba(255,255,255,0.12)" />
                                                                <text y={3.5} textAnchor="middle" fontSize={9}
                                                                      fill="rgba(255,255,255,0.75)">
                                                                    {`+${extra}`}
                                                                </text>
                                                            </g>
                                                        )}
                                                    </g>
                                                );
                                            })}
                                        </g>
                                    );
                                })}
                            </svg>

                            {hover && (
                                <div
                                    className="pt-tip"
                                    style={{ left: hover.left, top: hover.top, '--pt-color': hover.color }}
                                >
                                    <div className="pt-tip-head">
                                        {hover.playerName} · Ronda {hover.round}
                                    </div>
                                    {hover.events.map((ev, i) => (
                                        <div key={i} className="pt-tip-row">
                                            <span
                                                className="pt-tip-dot"
                                                style={{ background: KINDS.find(k => k.id === ev.kind)?.color }}
                                            />
                                            <span className="pt-tip-title">{ev.title}</span>
                                            {ev.detail && <span className="pt-tip-detail">{ev.detail}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProgressChart;
