import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TRAINERS, MIN_PLAYERS, MAX_PLAYERS } from '../data/trainers';
import { getGeneration } from '../data/generations';

const MenuPlayers = ({ addPlayer, generation }) => {
    const navigate = useNavigate();
    // Orden de turno elegido. Los jugadores se envían al servidor al empezar,
    // así el turno que recibe cada uno es su posición final en esta lista.
    const [order, setOrder] = useState([]);
    const [search, setSearch] = useState('');
    const [starting, setStarting] = useState(false);

    const region = getGeneration(generation);

    const positionOf = (name) => order.indexOf(name);

    const toggleTrainer = (name) => {
        setOrder(prev => {
            if (prev.includes(name)) return prev.filter(n => n !== name);
            if (prev.length >= MAX_PLAYERS) return prev;
            return [...prev, name];
        });
    };

    const move = (index, delta) => {
        setOrder(prev => {
            const target = index + delta;
            if (target < 0 || target >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const handleStartGame = async () => {
        if (starting || order.length < MIN_PLAYERS) return;
        setStarting(true);
        try {
            for (let i = 0; i < order.length; i++) {
                await addPlayer(`P${i + 1}`, order[i], i + 1);
            }
            navigate('/game');
        } catch (error) {
            console.error('Error al crear los jugadores:', error);
            setStarting(false);
        }
    };

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return TRAINERS;
        return TRAINERS.filter(t => t.name.toLowerCase().includes(query));
    }, [search]);

    // Huecos vacíos hasta el máximo, para que se vea cuántos caben
    const emptySlots = Array.from(
        { length: Math.max(0, MAX_PLAYERS - order.length) },
        (_, i) => order.length + i + 1
    );

    const canStart = order.length >= MIN_PLAYERS;

    return (
        <div className='players-screen'>
            <div className='players-topbar'>
                <button className='players-topbar__back' onClick={() => navigate('/selectGeneration')}>←</button>
                <h2 className='players-topbar__title'>Orden de juego</h2>
                <span className='players-topbar__region' style={{ '--gen-color': region.color }}>
                    {region.region}
                </span>
                <span className='players-topbar__hint'>Toca para añadir · flechas para reordenar</span>
            </div>

            {/* ── Zona 1: orden de turno ── */}
            <div className='players-order'>
                <div className='players-order__head'>
                    <span className='players-section-label'>Turnos</span>
                    <span className='players-order__count'>
                        {order.length} de {MAX_PLAYERS} · mínimo {MIN_PLAYERS}
                    </span>
                </div>

                <div className='players-order__slots'>
                    {order.map((name, index) => {
                        const trainer = TRAINERS.find(t => t.name === name);
                        return (
                            <div key={name} className='order-slot'>
                                <span className='order-slot__number'>{index + 1}</span>
                                <div
                                    className='order-slot__avatar'
                                    style={{ backgroundImage: `url(${trainer.image})` }}
                                    onClick={() => toggleTrainer(name)}
                                    title='Quitar del orden'
                                />
                                <span className='order-slot__name'>{name}</span>
                                <div className='order-slot__arrows'>
                                    <button
                                        onClick={() => move(index, -1)}
                                        disabled={index === 0}
                                    >◀</button>
                                    <button
                                        onClick={() => move(index, 1)}
                                        disabled={index === order.length - 1}
                                    >▶</button>
                                </div>
                            </div>
                        );
                    })}

                    {emptySlots.map(number => (
                        <div key={`empty-${number}`} className='order-slot order-slot--empty'>
                            <span className='order-slot__number'>{number}</span>
                            <span className='order-slot__placeholder'>
                                {number <= MIN_PLAYERS ? 'Requerido' : 'Opcional'}
                            </span>
                        </div>
                    ))}

                    <button
                        className={`players-start ${canStart ? '' : 'players-start--off'}`}
                        onClick={handleStartGame}
                        disabled={!canStart || starting}
                    >
                        <span className='players-start__icon'>▶</span>
                        <span className='players-start__label'>{starting ? 'Creando…' : 'Empezar'}</span>
                        <span className='players-start__sub'>
                            {canStart
                                ? `${order.length} jugadores`
                                : `Faltan ${MIN_PLAYERS - order.length}`}
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Zona 2: catálogo de entrenadores ── */}
            <div className='players-catalog'>
                <div className='players-catalog__head'>
                    <span className='players-section-label'>Entrenadores</span>
                    <input
                        className='players-catalog__search'
                        type='text'
                        placeholder='Buscar entrenador'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className='players-catalog__grid'>
                    {filtered.map(({ name, image }) => {
                        const position = positionOf(name);
                        const selected = position >= 0;
                        const full = !selected && order.length >= MAX_PLAYERS;
                        return (
                            <div
                                key={name}
                                className={`trainer-card ${selected ? 'trainer-card--selected' : ''} ${full ? 'trainer-card--full' : ''}`}
                                onClick={() => !full && toggleTrainer(name)}
                            >
                                {selected && <span className='trainer-card__number'>{position + 1}</span>}
                                <div
                                    className='trainer-card__image'
                                    style={{ backgroundImage: `url(${image})` }}
                                />
                                <span className='trainer-card__name'>{name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MenuPlayers;
