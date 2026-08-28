import React, { useState, useEffect } from 'react';

import trackDynamax       from '../tones/Dynamax.mp3';
import trackEliteKanto    from '../tones/Elite Kanto.mp3';
import trackChampionKanto from '../tones/chmapion Kanto.mp3';
import trackCynthia       from '../tones/cynthia.mp3';

const TRACKS = [
    { id: 'dynamax',   name: 'Dynamax',        src: trackDynamax },
    { id: 'elite',     name: 'Elite Kanto',    src: trackEliteKanto },
    { id: 'champion',  name: 'Campeón Kanto',  src: trackChampionKanto },
    { id: 'cynthia',   name: 'Cynthia',        src: trackCynthia },
];

// Un único Audio para toda la app, fuera del componente a propósito. El botón se
// dibuja en tres sitios distintos (home, selección de combatientes y batalla) y
// al pasar de una pantalla a otra —Change Pokemon, Re-Match— el componente se
// desmonta y se vuelve a montar. Si el Audio viviera dentro, la música se
// cortaría en cada uno de esos saltos; así suena hasta que el jugador la pare o
// pase el turno.
let sharedAudio = null;
// La pista elegida vive al lado del audio por lo mismo: es lo que el componente
// lee al volver a montarse para pintar cuál está sonando.
let sharedIndex = null;

const getAudio = () => {
    if (!sharedAudio) {
        sharedAudio = new Audio();
        sharedAudio.loop   = true;
        sharedAudio.volume = 0.5;
    }
    return sharedAudio;
};

// La usa SimPlayer al pasar turno: la música de un jugador no sigue sonando
// sobre el turno del siguiente.
export const stopMusic = () => {
    if (!sharedAudio) return;
    sharedAudio.pause();
    sharedAudio.currentTime = 0;
};

// `variant` decide solo la forma del botón; el panel y el audio son los mismos:
//   float  → burbuja flotante de la pantalla de batalla
//   tool   → pastilla de la barra de herramientas del home
//   square → botón cuadrado de la barra de la selección de combatientes
const MusicPlayer = ({ variant = 'float' }) => {
    const [isOpen,       setIsOpen]       = useState(false);
    const [currentIndex, setCurrentIndex] = useState(sharedIndex);
    const [isPlaying,    setIsPlaying]    = useState(() => !getAudio().paused);
    const [volume,       setVolume]       = useState(() => getAudio().volume);

    // Al montar, el botón se pone al día con lo que ya estuviera sonando: el
    // estado real es el elemento de audio, no una copia dentro del componente.
    useEffect(() => {
        const audio = getAudio();
        const sync = () => {
            setIsPlaying(!audio.paused);
            setVolume(audio.volume);
            setCurrentIndex(sharedIndex);
        };
        sync();
        audio.addEventListener('play', sync);
        audio.addEventListener('pause', sync);
        audio.addEventListener('volumechange', sync);
        return () => {
            audio.removeEventListener('play', sync);
            audio.removeEventListener('pause', sync);
            audio.removeEventListener('volumechange', sync);
        };
    }, []);

    const loadTrack = (index) => {
        const audio = getAudio();
        audio.pause();
        audio.src = TRACKS[index].src;
        audio.load();
        audio.play().catch(() => {});
        sharedIndex = index;
        setCurrentIndex(index);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        const audio = getAudio();
        if (currentIndex === null) return;
        if (isPlaying) audio.pause();
        else           audio.play().catch(() => {});
    };

    const stop = () => {
        stopMusic();
        setIsPlaying(false);
    };

    const handleVolume = (e) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        getAudio().volume = v;
    };

    const note = (
        <span className={`music-player-note ${isPlaying ? 'music-player-note--playing' : ''}`}>♪</span>
    );

    // stopPropagation: en las variantes de barra el panel se dibuja dentro del
    // propio botón, y sin esto cada toque en la lista lo cerraría.
    const panel = isOpen && (
        <div className={`music-player-panel music-player-panel--${variant}`}
             onClick={e => e.stopPropagation()}>
            <div className="music-player-now">
                {currentIndex !== null ? TRACKS[currentIndex].name : 'Selecciona una pista'}
            </div>

            <div className="music-player-controls">
                <button className="music-player-btn" onClick={togglePlay}>
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <button className="music-player-btn" onClick={stop}>⏹</button>
                <input
                    type="range"
                    className="music-player-volume"
                    min="0" max="1" step="0.05"
                    value={volume}
                    onChange={handleVolume}
                />
                <span className="music-player-vol-icon">🔊</span>
            </div>

            <div className="music-player-tracklist">
                {TRACKS.map((t, i) => (
                    <div
                        key={t.id}
                        className={`music-player-track ${currentIndex === i ? 'music-player-track--active' : ''}`}
                        onClick={() => loadTrack(i)}
                    >
                        <span className="music-player-track-indicator">
                            {currentIndex === i && isPlaying ? '♪' : '◆'}
                        </span>
                        {t.name}
                    </div>
                ))}
            </div>
        </div>
    );

    if (variant === 'tool') {
        // El mismo círculo dorado de la batalla y sin etiqueta: ocupa mucho
        // menos de la barra del home que una pastilla, y la nota ya se entiende.
        return (
            <div className={`music-player-toggle music-player-toggle--bar music-player-anchor ${isOpen ? 'is-on' : ''}`}
                 title="Música"
                 onClick={() => setIsOpen(o => !o)}>
                {note}
                {panel}
            </div>
        );
    }

    if (variant === 'square') {
        return (
            <div className={`sbs-tool music-player-anchor ${isOpen ? 'is-on' : ''}`}
                 title="Música"
                 onClick={() => setIsOpen(o => !o)}>
                {note}
                {panel}
            </div>
        );
    }

    return (
        <div className="music-player">
            <div className="music-player-toggle" onClick={() => setIsOpen(o => !o)}>
                {note}
            </div>
            {panel}
        </div>
    );
};

export default MusicPlayer;
