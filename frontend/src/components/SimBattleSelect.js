import React, { useMemo, useState } from 'react';
import { getTrainerImage } from '../data/trainers';
import { getLeaderPortrait, getLeaderCardImg } from '../data/leaders';
import { typeColor, typeLabel } from '../pokemonTypes';
import pokeBall from '../images/Poke_Ball.png';

// Los require dinámicos lanzan cuando el archivo no está y esta pantalla se
// repinta con cada evento del socket, así que todos pasan por aquí.
const tryRequire = (fn) => { try { return fn(); } catch { return null; } };

const pokemonArt = (pokedex) => (pokedex ? tryRequire(() => require(`../images/POKEMON/${pokedex}.png`)) : null);
const tokenArt   = (pokedex) => (pokedex ? tryRequire(() => require(`../images/tokens_ultimix/${pokedex}.png`)) : null);
const leaderArt  = (pokedex, gen) => (pokedex ? tryRequire(() => require(`../images/Leaders${gen}/${pokedex}.png`)) : null);

const badgeArt = (gen, num) => tryRequire(() => require(`../images/badges/badges${gen}/badge${num}.webp`))
    || tryRequire(() => require(`../images/badges/badge${num}.png`));

const getTypeIcon = (type) => tryRequire(() => require(`../images/Types/${type}.png`));

// Rejilla 2x2 de tipos del botón de la tabla, igual que en el setup
const TYPE_FAB = ['FIRE', 'WATER', 'GRASS', 'ELECTRIC'];

// Especies de líder que no se pueden resolver por nombre contra el catálogo de
// `/pokemon-list`: o vienen mal escritas en `pokemonsLeaders` (Mr.Mine) o
// sencillamente no están en la tabla `pokemons` (no tienen carta propia en el
// juego). El sprite sí existe en images/POKEMON con su número nacional, así que
// basta con apuntarlo aquí. La clave va normalizada por `nameKey`.
const DEX_FIX = {
    mrmine:    '0122',  // "Mr.Mine" en la DB de líderes; el catálogo dice "Mr. Mime"
    // Gen 3
    torkoal:   '0324',
    spinda:    '0327',
    pelipper:  '0279',
    lunatone:  '0337',
    solrock:   '0338',
    whiscash:  '0340',
    claydol:   '0344',
    wailmer:   '0320',
    beautifly: '0267',
    skitty:    '0300',
    tropius:   '0357',
    // Gen 4
    cherubi:   '0420',
    quagsire:  '0195',
    drifblim:  '0426',
};

/**
 * Selección de combatientes en una sola pantalla: arriba el rival con su
 * retrato y su equipo en círculos, abajo el equipo del jugador. Antes eran dos
 * pantallas encadenadas (mi Pokémon → Pokémon del rival) y nada se veía junto,
 * que es justo lo que hace falta para decidir el emparejamiento.
 *
 * Con `readOnly` el mismo componente sirve de espejo en el marcador del máster:
 * no se toca nada, las elecciones llegan por props y se pintan marcadas. Se
 * reutiliza a propósito en vez de copiar el diseño, para que retocarlo aquí lo
 * arregle en los dos sitios.
 */
const SimBattleSelect = ({
    player,
    rival,
    generation = 1,
    pokemonList = [],
    badgeNum = null,
    isMyTurn = false,
    readOnly = false,
    selectedMine = null,
    selectedTheirs = null,
    formsView = false,
    onConfirm,
    onBack,
    onOpenTypeChart,
    onOpenRules,
    onNextTurn,
    onPreview,
    onToggleForms,
}) => {
    const isWild   = rival.name === 'Wild Pokemon';
    const isPlayer = (rival.id || '').startsWith('SimPlayer-');
    const isLeader = (rival.id || '').startsWith('SimLeader-');

    const rivalTeam = useMemo(() => [
        ...(rival.pokemons || []),
        ...(rival.megas || []),
        ...(rival.dynamax ? (rival.gmaxes || []) : []),
    ], [rival]);

    const myTeam  = player.pokemons || [];
    const myForms = useMemo(() => [
        ...(player.megas || []),
        ...(player.dynamax ? (player.gmaxes || []) : []),
    ], [player]);

    const [mineLocal, setMineLocal] = useState(null);
    // Contra un salvaje solo hay un rival posible: se da por elegido y la
    // pantalla se reduce a escoger con quién le respondes.
    const [theirsLocal, setTheirsLocal] = useState(isWild ? (rivalTeam[0] || null) : null);
    // Megas y G-Max no salen de entrada: saturaban la fila del equipo. Se
    // alternan con un botón, y solo se ve un grupo a la vez. En el espejo la
    // pestaña no se pulsa: llega desde la partida para reflejar lo de la tablet.
    const [showFormsLocal, setShowFormsLocal] = useState(false);
    // Sin megas ni G-Max no hay pestaña que valga: si no, un `formsView` heredado
    // de otra batalla dejaría la fila vacía
    const showForms = (readOnly ? formsView : showFormsLocal) && myForms.length > 0;

    const toggleForms = (value) => {
        if (readOnly) return;
        setShowFormsLocal(value);
        if (onToggleForms) onToggleForms(value);
    };
    // Carta ampliada a pantalla completa, para leerle bien los ataques
    const [zoomCard, setZoomCard] = useState(null);

    // En el espejo las elecciones no son del componente: vienen de la partida.
    // El salvaje es la excepción: no se elige, así que se da por puesto igual
    // que en la tablet en vez de quedarse en "todavía no ha elegido".
    const mine   = readOnly ? selectedMine : mineLocal;
    const theirs = readOnly
        ? (selectedTheirs || (isWild ? rivalTeam[0] : null) || null)
        : theirsLocal;

    const pickMine = (pkm) => {
        if (readOnly) return;
        setMineLocal(pkm);
        if (onPreview) onPreview('MyPlayer', pkm);
    };

    const pickTheirs = (pkm) => {
        if (readOnly || isWild) return;
        setTheirsLocal(pkm);
        if (onPreview) onPreview('Rival', pkm);
    };

    // Los Pokémon del líder llegan con POKEDEX de carta (gym1_1), no con el del
    // Pokémon, así que el sprite real se busca por nombre en el catálogo.
    // Se compara sin puntos ni espacios: "Mr. Mime" y "Mr.Mime" son el mismo.
    // Un nombre puede tener varios POKEDEX en el catálogo: hay especies con
    // variante sufijada que comparte nombre (Spiritomb sale como 0442 y 0442s,
    // reservado para el shiny). Se guardan todos y se pone delante el POKEDEX
    // sin sufijo, que es la forma que le toca a un Pokémon de líder: buscando
    // solo por nombre no hay manera de saber si el suyo era una variante.
    const nameKey = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const plainDex = (dex) => /^\d+$/.test(dex || '');

    const dexByName = useMemo(() => {
        const map = {};
        pokemonList.forEach(p => {
            const k = nameKey(p.name);
            (map[k] || (map[k] = [])).push(p.pokedex);
        });
        Object.values(map).forEach(list =>
            list.sort((a, b) => (plainDex(b) ? 1 : 0) - (plainDex(a) ? 1 : 0)));
        return map;
    }, [pokemonList]);

    const spriteByName = (name) => {
        for (const dex of dexByName[nameKey(name)] || []) {
            const img = pokemonArt(dex);
            if (img) return img;
        }
        return null;
    };

    // Devuelve además de dónde salió la imagen: unas pocas especies de líder no
    // están en el catálogo de Pokémon (no tienen carta propia en el juego) y ahí
    // se cae a la carta del líder, que se encuadra distinto por ser vertical.
    const artInfo = (pkm) => {
        const key = nameKey(pkm.name);
        const sprite = pokemonArt(pkm.pokedex)
            || spriteByName(pkm.name)
            || pokemonArt(DEX_FIX[key]);
        if (sprite) return { src: sprite, isCard: false };
        const token = tokenArt(pkm.pokedex);
        if (token) return { src: token, isCard: false };
        return { src: leaderArt(pkm.pokedex, generation), isCard: true };
    };

    const artOf = (pkm) => artInfo(pkm).src;

    // La carta física, que es donde se leen los ataques: rectangular para los
    // Pokémon de líder, y el token redondo de siempre para el resto.
    const cardOf = (pkm) => (pkm ? leaderArt(pkm.pokedex, generation) || tokenArt(pkm.pokedex) : null);

    // Figura grande del rival, estilo arcade: el líder de cuerpo entero. Contra un
    // salvaje no hay entrenador, así que la figura es el propio Pokémon.
    const firstRivalDex = rival.pokemons?.[0]?.pokedex;
    const rivalFigure = isWild
        ? (rivalTeam[0] ? artOf(rivalTeam[0]) : pokeBall)
        : isPlayer
            ? getTrainerImage(rival.name)
            : (getLeaderPortrait(firstRivalDex, rival.name, generation)
                || getLeaderCardImg(firstRivalDex, generation));

    // El número de medalla se queda puesto hasta volver al menú, así que solo
    // vale si el rival de ahora es de verdad un líder; si no, un salvaje escaneado
    // justo después de un gimnasio saldría anunciado como reto de gimnasio.
    const gymBadge = isLeader && badgeNum !== null ? badgeNum : null;

    const title = gymBadge !== null ? 'Reto de gimnasio'
        : isPlayer ? 'Duelo de entrenadores'
        : isWild   ? 'Encuentro salvaje'
        : 'Batalla';

    const rivalRole = gymBadge !== null ? `Líder · Gimnasio ${gymBadge}`
        : isPlayer ? 'Entrenador'
        : isWild   ? 'Pokémon salvaje'
        : 'Rival';

    const badgeImg = gymBadge !== null ? badgeArt(generation, gymBadge) : null;
    const ready = Boolean(mine && theirs);

    // ── Círculo del equipo rival ────────────────────────────────────────────
    const renderOrb = (pkm, i) => {
        const art = artInfo(pkm);
        const chosen = theirs?.id === pkm.id;
        const isDead = pkm.state === 'Dead';
        return (
            <div key={pkm.id || `${pkm.name}-${i}`}
                 className={`sbs-orb ${chosen ? 'sbs-orb--chosen' : ''} ${isDead ? 'sbs-orb--dead' : ''}`}
                 style={{ '--pkm-type': typeColor(pkm.type1) }}
                 title={readOnly ? pkm.name : `Elegir a ${pkm.name}`}
                 onClick={() => pickTheirs(pkm)}>
                <div className={`sbs-orb-disc ${art.isCard ? 'sbs-orb-disc--card' : ''}`}
                     style={art.src ? { backgroundImage: `url(${art.src})` } : {}}>
                    <span className="sbs-orb-lvl">{pkm.totalLevel}</span>
                    {pkm.status !== 'Normal' && (
                        <span className={`status_pokemon sbs-orb-status ${pkm.status}`} />
                    )}
                    {chosen && <span className="sbs-orb-tag">Elegido</span>}
                </div>
                <div className="sbs-orb-name">{pkm.name}</div>
                <div className="sbs-orb-types">
                    <span style={{ backgroundColor: typeColor(pkm.type1) }}>{typeLabel(pkm.type1)}</span>
                    {pkm.type2 && pkm.type2 !== 'NONE' && (
                        <span style={{ backgroundColor: typeColor(pkm.type2) }}>{typeLabel(pkm.type2)}</span>
                    )}
                </div>
            </div>
        );
    };

    // ── Tarjeta del equipo propio ───────────────────────────────────────────
    const renderCard = (pkm, i) => {
        const art = artOf(pkm);
        const chosen = mine?.id === pkm.id;
        const isDead = pkm.state === 'Dead';
        return (
            <div key={pkm.id || `${pkm.name}-${i}`}
                 className={`sbs-card ${chosen ? 'sbs-card--chosen' : ''} ${isDead ? 'sbs-card--dead' : ''}`}
                 style={{ '--pkm-type': typeColor(pkm.type1) }}
                 title={isDead ? `${pkm.name} está debilitado`
                              : readOnly ? pkm.name : `Elegir a ${pkm.name}`}
                 onClick={() => pickMine(pkm)}>
                <div className="sbs-card-top">
                    <span className="sbs-card-lvl">{pkm.totalLevel}</span>
                    {pkm.status !== 'Normal' && (
                        <span className={`status_pokemon sbs-card-status ${pkm.status}`} />
                    )}
                </div>
                <div className="sbs-card-art" style={art ? { backgroundImage: `url(${art})` } : {}}>
                    {isDead && <span className="sbs-card-ko">KO</span>}
                </div>
                <div className="sbs-card-name">{pkm.name}</div>
                <div className="sbs-card-types">
                    <i style={{ backgroundColor: typeColor(pkm.type1) }} />
                    {pkm.type2 && pkm.type2 !== 'NONE' && (
                        <i style={{ backgroundColor: typeColor(pkm.type2) }} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`sbs ${readOnly ? 'sbs--mirror' : ''}`}>
            {/* ── Barra superior: volver + título + herramientas ─────────────
                En el espejo no hay nada que pulsar, así que solo queda el rótulo */}
            <header className="sbs-topbar">
                {!readOnly && (
                    <div className="sbs-back" title="Volver al menú" onClick={onBack}>←</div>
                )}
                <div className="sbs-title">
                    <span className="sbs-title-main">{title}</span>
                    <span className="sbs-title-sub">
                        {readOnly ? 'Eligiendo combatientes'
                            : isWild ? 'Elige tu Pokémon' : 'Elige de ambos lados'}
                    </span>
                </div>

                {!readOnly && (
                <div className="sbs-tools">
                    <div className="sbs-tool sbs-tool--types" title="Tabla de tipos" onClick={onOpenTypeChart}>
                        {/* Mismas clases que el botón flotante: la rejilla 2x2 ya está resuelta */}
                        <div className="type-chart-fab-grid">
                            {TYPE_FAB.map(t => {
                                const img = getTypeIcon(t);
                                return <div key={t} className="type-chart-fab-type"
                                            style={img ? { backgroundImage: `url(${img})` } : {}} />;
                            })}
                        </div>
                    </div>
                    <div className="sbs-tool sbs-tool--help" title="Guía de efectos" onClick={onOpenRules}>?</div>
                    {isMyTurn && (
                        <div className="sbs-tool sbs-tool--turn" title="Siguiente turno" onClick={onNextTurn}>→|</div>
                    )}
                </div>
                )}
            </header>

            {/* ── Lado del rival ────────────────────────────────────────────
                A la izquierda la carta del Pokémon elegido (ahí se leen sus
                ataques, que es lo que hay que mirar para planear); a la derecha
                el líder y, a su derecha, su equipo. */}
            <section className="sbs-side sbs-side--rival">
                <div className="sbs-cardview">
                    {theirs && cardOf(theirs) ? (
                        <img className="sbs-cardview-img"
                             src={cardOf(theirs)}
                             alt={theirs.name}
                             title="Toca para ver la carta en grande"
                             onClick={() => setZoomCard(cardOf(theirs))} />
                    ) : (
                        <div className="sbs-cardview-empty">
                            {readOnly
                                ? <>{rival.name} todavía<br />no ha elegido</>
                                : <>Toca un Pokémon de {rival.name}<br />para ver su carta</>}
                        </div>
                    )}
                </div>

                <div className="sbs-lineup">
                    <div className={`sbs-figure ${isWild ? 'sbs-figure--wild' : ''}`}>
                        <div className="sbs-figure-art"
                             style={rivalFigure ? { backgroundImage: `url(${rivalFigure})` } : {}} />
                        {badgeImg && (
                            <div className="sbs-badge" title={`Medalla ${gymBadge}`}
                                 style={{ backgroundImage: `url(${badgeImg})` }} />
                        )}
                        <div className="sbs-plate">
                            {/* En un salvaje "Wild Pokemon" no dice nada que no
                                diga ya el rótulo de abajo: mejor su nombre */}
                            <span className="sbs-plate-name">
                                {isWild ? (rivalTeam[0]?.name || rival.name) : rival.name}
                            </span>
                            <span className="sbs-plate-role">{rivalRole}</span>
                        </div>
                    </div>

                    {/* Contra un salvaje el círculo sobra: es un solo Pokémon, ya
                        viene elegido, y entre la figura grande y su carta se ve
                        de sobra. Solo se pintan los círculos cuando hay que elegir. */}
                    {!isWild && (
                        <div className={`sbs-orbs ${rivalTeam.length > 4 ? 'sbs-orbs--dense' : ''}`}
                             style={{ '--orb-cols': Math.min(rivalTeam.length || 1, 4) }}>
                            {rivalTeam.length > 0
                                ? rivalTeam.map((pkm, i) => renderOrb(pkm, i))
                                : <div className="sbs-empty">Este rival no tiene Pokémon</div>}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Lado del jugador ─────────────────────────────────────────── */}
            <section className="sbs-side sbs-side--mine">
                <div className="sbs-side-head">
                    <div className="sbs-portrait sbs-portrait--me"
                         style={{ backgroundImage: `url(${getTrainerImage(player.name)})` }} />
                    <div className="sbs-side-meta">
                        <div className="sbs-side-name">{player.name}</div>
                        <div className="sbs-side-role">
                            {showForms ? 'Megas y G-Max' : 'Tu equipo'}
                        </div>
                    </div>

                    {/* Un grupo u otro, nunca los dos: mezclados saturaban la fila.
                        En el espejo se pinta igual pero sin poder pulsarlo, para que
                        se vea qué pestaña está mirando el jugador. */}
                    {myForms.length > 0 && (
                        <div className="sbs-switch">
                            <div className={`sbs-switch-btn ${showForms ? '' : 'is-on'}`}
                                 onClick={() => toggleForms(false)}>
                                Equipo <b>{myTeam.length}</b>
                            </div>
                            <div className={`sbs-switch-btn ${showForms ? 'is-on' : ''}`}
                                 onClick={() => toggleForms(true)}>
                                Especiales <b>{myForms.length}</b>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sbs-cards">
                    {(showForms ? myForms : myTeam).map((pkm, i) => renderCard(pkm, i))}
                </div>
            </section>

            {/* ── Barra inferior: resumen + combatir ─────────────────────────
                Fuera en el espejo: ahí las marcas de las tarjetas ya lo cuentan */}
            {!readOnly && (
            <footer className="sbs-footer">
                <div className="sbs-pick">
                    <div className="sbs-pick-art"
                         style={mine && artOf(mine) ? { backgroundImage: `url(${artOf(mine)})` } : {}} />
                    <div className="sbs-pick-meta">
                        <span className="sbs-pick-label">Tu elección</span>
                        <span className="sbs-pick-name">{mine ? mine.name : '—'}</span>
                    </div>
                </div>

                <div className="sbs-vs">VS</div>

                <div className="sbs-pick sbs-pick--rival">
                    <div className="sbs-pick-meta">
                        <span className="sbs-pick-label">
                            {isWild ? 'Salvaje' : `${rival.name} elige`}
                        </span>
                        <span className="sbs-pick-name">{theirs ? theirs.name : '—'}</span>
                    </div>
                    <div className="sbs-pick-art"
                         style={theirs && artOf(theirs) ? { backgroundImage: `url(${artOf(theirs)})` } : {}} />
                </div>

                <div className={`sbs-fight ${ready ? '' : 'sbs-fight--off'}`}
                     onClick={() => ready && onConfirm(mine, theirs)}>
                    ¡Combatir! ▶
                </div>
            </footer>
            )}

            {/* Carta a pantalla completa: en la banda se lee, pero los efectos
                en letra chica piden zoom */}
            {zoomCard && (
                <div className="sbs-zoom" onClick={() => setZoomCard(null)}>
                    <img className="sbs-zoom-img" src={zoomCard} alt="" />
                    <div className="sbs-zoom-hint">Toca para cerrar</div>
                </div>
            )}
        </div>
    );
};

export default SimBattleSelect;
