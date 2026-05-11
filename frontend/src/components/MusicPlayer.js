import React, { useState, useRef, useEffect } from 'react';

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

const MusicPlayer = () => {
    const [isOpen,        setIsOpen]        = useState(false);
    const [currentIndex,  setCurrentIndex]  = useState(null);
    const [isPlaying,     setIsPlaying]     = useState(false);
    const [volume,        setVolume]        = useState(0.5);
    const audioRef = useRef(null);

    useEffect(() => {
        const audio = new Audio();
        audio.loop   = true;
        audio.volume = 0.5;
        audioRef.current = audio;
        return () => { audio.pause(); audio.src = ''; };
    }, []);

    const loadTrack = (index) => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.src = TRACKS[index].src;
        audioRef.current.load();
        audioRef.current.play().catch(() => {});
        setCurrentIndex(index);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (!audioRef.current || currentIndex === null) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    };

    const stop = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
    };

    const handleVolume = (e) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
    };

    return (
        <div className="music-player">
            <div className="music-player-toggle" onClick={() => setIsOpen(o => !o)}>
                <div className={`music-player-note ${isPlaying ? 'music-player-note--playing' : ''}`}>♪</div>
            </div>

            {isOpen && (
                <div className="music-player-panel">
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
            )}
        </div>
    );
};

export default MusicPlayer;
