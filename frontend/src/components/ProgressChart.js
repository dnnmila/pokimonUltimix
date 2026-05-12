import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import SERVER_IP from '../config';
import '../styles/_progressChart.scss';

const PLAYER_COLORS = ['#60a5fa', '#4ade80', '#f472b6', '#facc15', '#f87171', '#c084fc', '#fb923c', '#34d399'];

const SVG_W = 700;
const SVG_H = 380;
const MARGIN = { top: 30, right: 20, bottom: 50, left: 60 };
const PLOT_W = SVG_W - MARGIN.left - MARGIN.right; // 620
const PLOT_H = SVG_H - MARGIN.top - MARGIN.bottom; // 300

const MAX_BADGES = 10;

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
        try {
            return require('../images/badges/elite.png');
        } catch {
            return null;
        }
    }
    if (num === 10) {
        try {
            return require('../images/badges/campion.png');
        } catch {
            return null;
        }
    }
    return null;
};

const buildProgressData = (players, badgeHistory, maxRound) => {
    return players.map((player) => {
        const points = [];
        let count = 0;
        for (let r = 0; r <= maxRound; r++) {
            const events = badgeHistory.filter(e => e.playerId === player.id && e.round === r);
            events.forEach(e => {
                if (e.action === 'won') count++;
                else if (e.action === 'lost') count--;
            });
            points.push({ round: r, badges: Math.max(0, Math.min(MAX_BADGES, count)) });
        }
        return { player, points };
    });
};

const yScale = (badges) => PLOT_H - (badges / MAX_BADGES) * PLOT_H;
const xScale = (round, maxRound) => maxRound === 0 ? 0 : (round / maxRound) * PLOT_W;

const ProgressChart = () => {
    const [game, setGame] = useState({ players: [], round: 0, generation: 1, badgeHistory: [] });

    useEffect(() => {
        const socket = io(SERVER_IP);
        socket.on('gameUpdated', (updatedGame) => {
            setGame(updatedGame);
        });
        return () => {
            socket.off('gameUpdated');
            socket.disconnect();
        };
    }, []);

    const players = game.players || [];
    const badgeHistory = game.badgeHistory || [];
    const maxRound = game.round || 0;
    const generation = game.generation || 1;

    const labelEvery = maxRound > 15 ? 5 : 1;
    const progressData = buildProgressData(players, badgeHistory, maxRound);

    const xTicks = [];
    for (let r = 0; r <= maxRound; r++) {
        xTicks.push(r);
    }

    return (
        <div className="progress-chart-page">
            <div className="progress-chart-title">Progreso del Juego</div>
            <div className="progress-chart-round">Ronda actual: {maxRound}</div>

            {players.length === 0 ? (
                <div className="progress-chart-empty">Esperando jugadores...</div>
            ) : (
                <>
                    <div className="progress-chart-legend">
                        {players.map((player, idx) => (
                            <div key={player.id} className="progress-chart-legend-item">
                                <span
                                    className="progress-chart-legend-dot"
                                    style={{ backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                                />
                                <span className="progress-chart-legend-name">{player.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="progress-chart-svg-wrapper">
                        <svg
                            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                            className="progress-chart-svg"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>

                                {/* Horizontal grid lines + Y axis labels + badge images */}
                                {Array.from({ length: MAX_BADGES + 1 }, (_, i) => i).map((badgeNum) => {
                                    const y = yScale(badgeNum);
                                    const img = badgeNum >= 1 ? getBadgeImg(generation, badgeNum) : null;
                                    return (
                                        <g key={`grid-${badgeNum}`}>
                                            <line
                                                x1={0}
                                                y1={y}
                                                x2={PLOT_W}
                                                y2={y}
                                                stroke="white"
                                                strokeOpacity={0.08}
                                                strokeWidth={1}
                                            />
                                            {img ? (
                                                <image
                                                    href={img}
                                                    x={-50}
                                                    y={y - 12}
                                                    width={24}
                                                    height={24}
                                                />
                                            ) : (
                                                <text
                                                    x={-10}
                                                    y={y + 4}
                                                    fill="rgba(255,255,255,0.5)"
                                                    fontSize={11}
                                                    textAnchor="end"
                                                >
                                                    {badgeNum}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}

                                {/* X axis ticks */}
                                {xTicks.map((r) => {
                                    const x = xScale(r, maxRound);
                                    const showLabel = r % labelEvery === 0;
                                    return (
                                        <g key={`xtick-${r}`}>
                                            <line
                                                x1={x}
                                                y1={PLOT_H}
                                                x2={x}
                                                y2={PLOT_H + 5}
                                                stroke="rgba(255,255,255,0.3)"
                                                strokeWidth={1}
                                            />
                                            {showLabel && (
                                                <text
                                                    x={x}
                                                    y={PLOT_H + 18}
                                                    fill="rgba(255,255,255,0.6)"
                                                    fontSize={10}
                                                    textAnchor="middle"
                                                >
                                                    {`R${r}`}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}

                                {/* X axis baseline */}
                                <line
                                    x1={0}
                                    y1={PLOT_H}
                                    x2={PLOT_W}
                                    y2={PLOT_H}
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth={1}
                                />

                                {/* Y axis baseline */}
                                <line
                                    x1={0}
                                    y1={0}
                                    x2={0}
                                    y2={PLOT_H}
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth={1}
                                />

                                {/* Player lines and dots */}
                                {progressData.map(({ player, points }, idx) => {
                                    const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                                    if (points.length < 2) return null;

                                    const pathD = points
                                        .map((pt, i) => {
                                            const x = xScale(pt.round, maxRound);
                                            const y = yScale(pt.badges);
                                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                        })
                                        .join(' ');

                                    return (
                                        <g key={`line-${player.id}`}>
                                            <path
                                                d={pathD}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth={2.5}
                                                strokeLinejoin="round"
                                                strokeLinecap="round"
                                            />
                                            {points.map((pt) => (
                                                <circle
                                                    key={`dot-${player.id}-${pt.round}`}
                                                    cx={xScale(pt.round, maxRound)}
                                                    cy={yScale(pt.badges)}
                                                    r={3.5}
                                                    fill={color}
                                                    stroke="rgba(0,0,0,0.4)"
                                                    strokeWidth={1}
                                                />
                                            ))}
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProgressChart;
