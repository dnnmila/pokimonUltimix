import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SERVER_IP from '../config';
import { getGeneration } from '../data/generations';
import pokeball from '../images/Poke_Ball.png';

// Arte de fondo de la portada. Cambiar solo esta línea cuando esté lista la
// ilustración definitiva.
import startArt from '../images/newSeasonBG.jpg';

const formatTime = (seconds) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    if (h > 0) return `${h} h ${m} min`;
    if (m > 0) return `${m} min`;
    return `${total} s`;
};

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) +
        ' · ' + date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const Game = ({ onStartGame, onLoadGame }) => {
    const navigate = useNavigate();
    const [saveInfo, setSaveInfo] = useState(null);
    const [loadingSave, setLoadingSave] = useState(true);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`${SERVER_IP}/save-info`)
            .then(res => res.json())
            .then(data => { if (!cancelled) setSaveInfo(data); })
            .catch(() => { if (!cancelled) setSaveInfo({ exists: false }); })
            .finally(() => { if (!cancelled) setLoadingSave(false); });
        return () => { cancelled = true; };
    }, []);

    const handleStartGame = async () => {
        if (busy) return;
        setBusy(true);
        await onStartGame();
        navigate('/selectGeneration');
    };

    const handleLoadGame = async () => {
        if (busy) return;
        setBusy(true);
        await onLoadGame();
        navigate('/game');
    };

    const hasSave = saveInfo && saveInfo.exists;
    const region = hasSave ? getGeneration(saveInfo.generation) : null;
    const savedAt = hasSave ? formatDate(saveInfo.savedAt) : null;

    return (
        <div className='start-screen' style={{ backgroundImage: `url(${startArt})` }}>
            <div className='start-screen__veil' />

            <div className='start-screen__content'>
                <div className='start-title'>
                    <h1 className='start-title__main'>Pokimon Master Trainer</h1>
                    <span className='start-title__sub'>V2.0</span>
                </div>

                <div className='start-panel'>
                    <button className='start-new' onClick={handleStartGame} disabled={busy}>
                        <img className='start-new__ball' src={pokeball} alt='' />
                        <span>Nueva partida</span>
                    </button>

                    {(loadingSave || hasSave) && (
                        <div className='start-panel__divider'><span>o continúa</span></div>
                    )}

                    {loadingSave && (
                        <div className='start-save start-save--empty'>Buscando partida guardada…</div>
                    )}

                    {!loadingSave && hasSave && (
                        <div
                            className='start-save'
                            style={{ '--save-color': region.color, '--save-tint': region.tint }}
                            onClick={handleLoadGame}
                        >
                            <div
                                className='start-save__map'
                                style={region.map ? { backgroundImage: `url(${region.map})` } : {}}
                            />
                            <div className='start-save__info'>
                                <div className='start-save__title'>Cargar partida</div>
                                <div className='start-save__meta'>
                                    <span>{region.region}</span>
                                    <span>{saveInfo.players.length} jugadores</span>
                                    <span>Ronda {saveInfo.round}</span>
                                    <span>{formatTime(saveInfo.timePlayed)}</span>
                                </div>
                                <div className='start-save__players'>
                                    {saveInfo.players.map(p => (
                                        <span key={p.id} className='start-save__player'>
                                            {p.name}
                                            <b>{p.badges}</b>
                                        </span>
                                    ))}
                                </div>
                                {savedAt && <div className='start-save__date'>Guardada el {savedAt}</div>}
                            </div>
                            <button className='start-save__open' disabled={busy}>Abrir</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Game;
