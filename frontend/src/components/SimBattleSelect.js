import React, { useMemo, useState } from 'react';
import { getTrainerImage } from '../data/trainers';
import { getLeaderPortrait, getLeaderCardImg } from '../data/leaders';
import { typeColor, typeLabel } from '../pokemonTypes';
import PokemonName from './PokemonName';
import { applyTera, hasTeraOrb, TERA_BY_ID } from '../data/teraTypes';
import { applyDynamax, canDynamax, previewMaxMoves, maxEffectText } from '../data/maxMoves';
import imgTeraOrb from '../images/store/chart/TeraOrb.png';
import imgDynamax from '../images/dinamax.png';
import { displayName, nameTitle } from '../moteName';
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

// Un POKEDEX así no es un Pokémon del catálogo, es la carta de un entrenador
const LEADER_PREFIXES = ['gym', 'Riv'];

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
    // Gen 5
    patrat:    '0504',
    lillipup:  '0506',
    stoutland: '0508',
    simisage:  '0512',
    musharna:  '0518',
    swoobat:   '0528',
    leavanny:  '0542',
    dwebble:   '0557',
    sigilyph:  '0561',
    minccino:  '0572',
    swanna:    '0581',
    emolga:    '0587',
    jellicent: '0593',
    mienshao:  '0620',
};

/**
 * Selección de combatientes en una sola pantalla: arriba el rival y abajo tú,
 * y cada banda con la misma forma — el entrenador de cuerpo entero a la
 * izquierda y su equipo a la derecha. Antes eran dos pantallas encadenadas
 * (mi Pokémon → Pokémon del rival) y nada se veía junto, que es justo lo que
 * hace falta para decidir el emparejamiento.
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

    // ¿Sube teracristalizado? Solo aplica al Pokémon elegido, y solo si lleva
    // orbe. Se guarda como bandera y no como objeto ya transformado porque al
    // cambiar de Pokémon hay que olvidarla (ver pickMine).
    const [teraOn, setTeraOn] = useState(false);
    // ¿Sube dinamaxizado? Misma idea que el orbe, pero la ficha no es del
    // Pokémon sino del jugador (`player.dynamax`, que se enciende y se apaga a
    // mano desde la vista de Player). Las dos transformaciones son
    // EXCLUYENTES: se sube teracristalizado o dinamaxizado, nunca las dos.
    const [dynaOn, setDynaOn] = useState(false);
    // Y el mismo interruptor del lado del rival. En esta pantalla el jugador del
    // turno elige LOS DOS Pokémon (así se juega en la mesa), así que si el rival
    // no tuviera botón su ficha Dynamax sería inservible en un duelo. Solo puede
    // encenderse si `rival.dynamax` está activa, que únicamente pasa cuando el
    // rival es otro entrenador (los líderes y los salvajes no la tienen).
    const [rivalDynaOn, setRivalDynaOn] = useState(false);

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
        // Cada Pokémon trae su propio orbe (o ninguno) y no todos pueden
        // dinamaxizarse: la elección del anterior no puede arrastrarse.
        setTeraOn(false);
        setDynaOn(false);
        if (onPreview) onPreview('MyPlayer', pkm);
    };

    // Los dos interruptores se apagan entre sí: encender uno apaga el otro.
    const toggleTera = () => { setDynaOn(false); setTeraOn(!teraOn); };
    const toggleDyna = () => { setTeraOn(false); setDynaOn(!dynaOn); };

    // El Pokémon tal y como sube a la batalla, ya transformado. Es lo único que
    // sale de esta pantalla: a partir de aquí la batalla no sabe (ni necesita
    // saber) si venía de un orbe o de una ficha Dynamax.
    const fighterOf = (pkm) => {
        if (!pkm) return pkm;
        if (dynaOn) return applyDynamax(pkm);
        if (teraOn) return applyTera(pkm);
        return pkm;
    };

    // La ficha Dynamax es del jugador y se gasta a mano: aquí solo se ofrece
    // mientras esté encendida y el Pokémon elegido pueda usarla (los que tienen
    // forma G-Max suben con su token, no con ataques Max — ver canDynamax).
    const canOfferDyna = Boolean(player.dynamax) && canDynamax(mine);
    const maxPreview   = dynaOn && mine ? previewMaxMoves(mine) : [];

    const canOfferRivalDyna = Boolean(rival.dynamax) && canDynamax(theirs);
    const rivalMaxPreview   = rivalDynaOn && theirs ? previewMaxMoves(theirs) : [];

    const pickTheirs = (pkm) => {
        if (readOnly || isWild) return;
        setTheirsLocal(pkm);
        setRivalDynaOn(false);
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
        // `tokens_ultimix` no está separado por generación y guarda las cartas de
        // líder de Kanto con el mismo nombre (gym1_1 es Brock/Geodude). Para un
        // Pokémon de líder hay que ir a Leaders<gen>, o cualquier generación que
        // no sea la 1 acabaría enseñando a Brock.
        if (!LEADER_PREFIXES.some(p => (pkm.pokedex || '').startsWith(p))) {
            const token = tokenArt(pkm.pokedex);
            if (token) return { src: token, isCard: false };
        }
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
                 title={readOnly ? nameTitle(pkm) : `Elegir a ${displayName(pkm)}`}
                 onClick={() => pickTheirs(pkm)}>
                <div className={`sbs-orb-disc ${art.isCard ? 'sbs-orb-disc--card' : ''}`}
                     style={art.src ? { backgroundImage: `url(${art.src})` } : {}}>
                    <span className="sbs-orb-lvl">{pkm.totalLevel}</span>
                    {pkm.status !== 'Normal' && (
                        <span className={`status_pokemon sbs-orb-status ${pkm.status}`} />
                    )}
                    {chosen && <span className="sbs-orb-tag">Elegido</span>}
                </div>
                <PokemonName pkm={pkm} as="div" className="sbs-orb-name" />
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
                 title={isDead ? `${displayName(pkm)} está debilitado`
                              : readOnly ? nameTitle(pkm) : `Elegir a ${displayName(pkm)}`}
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
                <PokemonName pkm={pkm} as="div" className="sbs-card-name" />
                <div className="sbs-card-types">
                    <i style={{ backgroundColor: typeColor(pkm.type1) }} />
                    {pkm.type2 && pkm.type2 !== 'NONE' && (
                        <i style={{ backgroundColor: typeColor(pkm.type2) }} />
                    )}
                </div>
                {/* Marca del orbe: hay que verla ANTES de elegir, porque es
                    parte de con qué cuenta ese Pokémon */}
                {hasTeraOrb(pkm) && (
                    <span className="sbs-card-tera"
                          style={{ backgroundColor: typeColor(pkm.teraType) }}
                          title={`Orbe Tera ${TERA_BY_ID[pkm.teraType]?.tipo || pkm.teraType}`} />
                )}
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
                                {isWild ? (displayName(rivalTeam[0]) || rival.name) : rival.name}
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

            {/* ── Lado del jugador ──────────────────────────────────────────
                Misma forma que la banda del rival, en espejo: tu entrenador de
                cuerpo entero a la izquierda y tu equipo a la derecha. Antes tu
                lado era un círculo pequeño en una cabecera y una fila de
                tarjetas debajo, lo que dejaba la pantalla descompensada — el
                rival tenía figura de arcade y tú un avatar de lista. */}
            <section className="sbs-side sbs-side--mine">
                <div className="sbs-figure sbs-figure--me">
                    {/* La figura entera, no el recorte de avatar: aquí se pinta
                        con `contain` y hay sitio de sobra para la escena */}
                    <div className="sbs-figure-art"
                         style={{ backgroundImage: `url(${getTrainerImage(player.name)})` }} />
                    <div className="sbs-plate sbs-plate--me">
                        <span className="sbs-plate-name">{player.name}</span>
                        <span className="sbs-plate-role">
                            {showForms ? 'Megas y G-Max' : 'Tu equipo'}
                        </span>
                    </div>
                </div>

                <div className="sbs-mine-team">
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

                    <div className="sbs-cards">
                        {(showForms ? myForms : myTeam).map((pkm, i) => renderCard(pkm, i))}
                    </div>
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
                        {mine
                            ? <PokemonName pkm={mine} className="sbs-pick-name" />
                            : <span className="sbs-pick-name">—</span>}

                        {/* Las transformaciones se declaran al subir, como las
                            megas: aquí, y no a media batalla. Un botón por cada
                            una, y son excluyentes —encender una apaga la otra—.
                            Apagados, el Pokémon sube tal cual; el texto de al
                            lado canta con qué sube, para que el estado del botón
                            no se lea al revés. */}
                        {(hasTeraOrb(mine) || canOfferDyna) && (
                            <div className="sbs-forms">
                                {hasTeraOrb(mine) && (
                                    <div className="sbs-tera">
                                        <div className={`sbs-tera-orb ${teraOn ? 'is-on' : ''}`}
                                             title={teraOn
                                                ? `Sube teracristalizado — ${TERA_BY_ID[mine.teraType]?.tipo || mine.teraType}`
                                                : `Toca para teracristalizar — ${TERA_BY_ID[mine.teraType]?.tipo || mine.teraType}`}
                                             onClick={toggleTera}>
                                            <img src={imgTeraOrb} alt="Orbe Tera" />
                                        </div>
                                        <span className={`sbs-tera-label ${teraOn ? 'is-on' : ''}`}>
                                            {teraOn
                                                ? `Tera ${typeLabel(mine.teraType)}`
                                                : `${typeLabel(mine.type1)}${mine.type2 && mine.type2 !== 'NONE' ? ` / ${typeLabel(mine.type2)}` : ''}`}
                                        </span>
                                    </div>
                                )}

                                {canOfferDyna && (
                                    <div className="sbs-tera sbs-dyna">
                                        <div className={`sbs-tera-orb ${dynaOn ? 'is-on' : ''}`}
                                             title={dynaOn
                                                ? 'Sube en forma Dynamax — sus ataques se vuelven Movimientos Max'
                                                : 'Toca para dinamaxizar — sus ataques se vuelven Movimientos Max'}
                                             onClick={toggleDyna}>
                                            <img src={imgDynamax} alt="Dynamax" />
                                        </div>
                                        <span className={`sbs-tera-label ${dynaOn ? 'is-on' : ''}`}>
                                            {dynaOn ? 'Dynamax' : 'Forma normal'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Qué movimientos le quedan y qué hace cada uno: es lo
                            que hay que saber ANTES de confirmar, porque un Max
                            de tipo campo obliga a jugar una carta de la mesa. */}
                        {maxPreview.length > 0 && (
                            <div className="sbs-dyna-moves">
                                {maxPreview.map((atk, i) => (
                                    <div key={atk.id || i} className="sbs-dyna-move">
                                        <i className="sbs-dyna-move-type"
                                           style={{ backgroundColor: typeColor(atk.type) }} />
                                        <b className="sbs-dyna-move-name">{atk.name}</b>
                                        <span className="sbs-dyna-move-str">{atk.strength}</span>
                                        <span className="sbs-dyna-move-eff">{maxEffectText(atk.maxMove, 'es')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sbs-vs">VS</div>

                <div className="sbs-pick sbs-pick--rival">
                    <div className="sbs-pick-meta">
                        <span className="sbs-pick-label">
                            {isWild ? 'Salvaje' : `${rival.name} elige`}
                        </span>
                        {theirs
                            ? <PokemonName pkm={theirs} className="sbs-pick-name" />
                            : <span className="sbs-pick-name">—</span>}

                        {/* El rival también declara su forma aquí: en la mesa el
                            jugador del turno mueve los dos lados. Sin orbe:
                            el orbe es del Pokémon y el rival elige el suyo en su
                            propia tablet cuando le toca. */}
                        {canOfferRivalDyna && (
                            <div className="sbs-forms sbs-forms--rival">
                                <div className="sbs-tera sbs-dyna">
                                    <span className={`sbs-tera-label ${rivalDynaOn ? 'is-on' : ''}`}>
                                        {rivalDynaOn ? 'Dynamax' : 'Forma normal'}
                                    </span>
                                    <div className={`sbs-tera-orb ${rivalDynaOn ? 'is-on' : ''}`}
                                         title={rivalDynaOn
                                            ? 'Sube en forma Dynamax — sus ataques se vuelven Movimientos Max'
                                            : 'Toca para dinamaxizar — sus ataques se vuelven Movimientos Max'}
                                         onClick={() => setRivalDynaOn(!rivalDynaOn)}>
                                        <img src={imgDynamax} alt="Dynamax" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {rivalMaxPreview.length > 0 && (
                            <div className="sbs-dyna-moves sbs-dyna-moves--rival">
                                {rivalMaxPreview.map((atk, i) => (
                                    <div key={atk.id || i} className="sbs-dyna-move">
                                        <i className="sbs-dyna-move-type"
                                           style={{ backgroundColor: typeColor(atk.type) }} />
                                        <b className="sbs-dyna-move-name">{atk.name}</b>
                                        <span className="sbs-dyna-move-str">{atk.strength}</span>
                                        <span className="sbs-dyna-move-eff">{maxEffectText(atk.maxMove, 'es')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="sbs-pick-art"
                         style={theirs && artOf(theirs) ? { backgroundImage: `url(${artOf(theirs)})` } : {}} />
                </div>

                <div className={`sbs-fight ${ready ? '' : 'sbs-fight--off'}`}
                     onClick={() => ready && onConfirm(
                        fighterOf(mine),
                        rivalDynaOn ? applyDynamax(theirs) : theirs)}>
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
