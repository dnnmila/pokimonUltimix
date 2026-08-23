import React from 'react';
import { getSimEvent } from '../data/simEvents';
import { typeColor, typeLabel } from '../pokemonTypes';
import { tokenColorHex, tokenColorLabel } from '../data/tokenColors';
import mapaUnderground from '../images/underground/sinnoh-underground.jpg';

// Eventos que además de fichas traen una lámina que mirar. No viaja por el
// espejo: la imagen está en el mismo bundle que esta pantalla, así que basta
// con saber de qué evento se trata. Mandar la URL empaquetada por el socket
// solo serviría para que un cliente sin recargar se quedara con una ruta vieja.
const EVENT_ART = {
    underground: { src: mapaUnderground, alt: 'Mapa del Grand Underground' },
};

// Espejo de eventos para la tabla de /players.
//
// Repite en grande lo que el jugador está haciendo en su tablet dentro del
// modal de un evento: qué color de token eligió, qué tipo, quién le salió y en
// qué paso va. Es SOLO LECTURA y no toca la partida.
//
// Un único panel para los siete eventos, a propósito. La alternativa —repetir
// cada modal tal cual— obligaba a volver controlados siete modales que ya
// funcionan, y encima habría traído a una pantalla que se mira de lejos una
// interfaz pensada para tocarse de cerca. Lo que se ve aquí es lo que importa
// desde la otra punta de la mesa: fichas grandes y una línea de estado.
//
// La foto llega en `game.eventMirror`; el contrato está en data/eventMirror.js.

const tokenSrc = (pokedex) => {
    if (!pokedex) return null;
    try { return require(`../images/tokens_ultimix/${pokedex}.png`); } catch { return null; }
};

// Ficha: el token y debajo nombre, tipos y nivel.
//
// `dim` lo pone la fila cuando alguno de sus miembros va marcado: en el rodaje
// se enseñan los seis Prop del reparto y hay que ver de un golpe cuál sacó el
// dado, así que el elegido se queda encendido y los otros cinco se apagan.
const MirrorToken = ({ pkm, size = 'big', dim = false }) => {
    if (!pkm) return null;
    const src = tokenSrc(pkm.pokedex);
    return (
        <div className={`evmirror-pkm evmirror-pkm--${size}`
                        + (pkm.on ? ' is-on' : '')
                        + (dim ? ' is-off' : '')}
             style={{ '--token-color': tokenColorHex(pkm.tokenColor) || '#5ec8f2' }}>
            {pkm.label && <div className="evmirror-pkm-label">{pkm.label}</div>}
            <div className="evmirror-pkm-art">
                {src
                    ? <img src={src} alt={pkm.name} />
                    : <span className="evmirror-pkm-art-fallback">?</span>}
                {pkm.badge != null && (
                    <span className="evmirror-pkm-badge">{pkm.badge}</span>
                )}
            </div>
            <div className="evmirror-pkm-name">{pkm.name}</div>
            <div className="evmirror-pkm-meta">
                {pkm.type1 && (
                    <span style={{ background: typeColor(pkm.type1) }}>{typeLabel(pkm.type1)}</span>
                )}
                {pkm.type2 && pkm.type2 !== 'NONE' && (
                    <span style={{ background: typeColor(pkm.type2) }}>{typeLabel(pkm.type2)}</span>
                )}
                {pkm.level != null && <span className="evmirror-pkm-lvl">Nv {pkm.level}</span>}
            </div>
        </div>
    );
};

const EventMirrorModal = ({ game }) => {
    const view = game?.eventMirror;
    // El espejo de la batalla manda: cuando arranca el combate, el del montaje
    // ya no pinta nada. El backend además lo borra en startSimMirror; esto es
    // el cinturón por si llegan los dos avisos en distinto orden.
    if (!view || game.battlePublic) return null;

    const ficha = getSimEvent(view.event);
    const accent = ficha?.accent || '#5ec8f2';
    const list = view.list || [];
    // ¿La fila es una tabla de opciones con una ya marcada? Entonces las demás
    // se apagan. Mientras no haya elegido, las seis van por igual.
    const hayElegido = list.some(p => p?.on);
    const art = EVENT_ART[view.event] || null;

    return (
        <div className="evmirror-backdrop">
            <div className="evmirror-panel" style={{ '--ev-accent': accent }}>

                <div className="evmirror-head">
                    {ficha?.img && <img className="evmirror-head-icon" src={ficha.img} alt="" />}
                    <div className="evmirror-head-text">
                        <div className="evmirror-head-title">{ficha?.es || ficha?.title || 'Evento'}</div>
                        {ficha?.title && ficha.es && (
                            <div className="evmirror-head-en">{ficha.title}</div>
                        )}
                    </div>
                    <div className="evmirror-head-host">{view.hostName}</div>
                </div>

                {/* Lo que el jugador ha ido eligiendo. Se pinta aunque todavía no
                    haya Pokémon: es justo el paso que pediste ver. */}
                {(view.color || view.type) && (
                    <div className="evmirror-picks">
                        {view.color && (
                            <div className="evmirror-pick">
                                <span className="evmirror-pick-label">Token</span>
                                <span className="evmirror-pick-dot"
                                      style={{ background: tokenColorHex(view.color) }} />
                                <span className="evmirror-pick-val">{tokenColorLabel(view.color)}</span>
                            </div>
                        )}
                        {view.type && (
                            <div className="evmirror-pick">
                                <span className="evmirror-pick-label">Tipo</span>
                                <span className="evmirror-pick-type"
                                      style={{ background: typeColor(view.type) }}>
                                    {typeLabel(view.type)}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {art && (
                    <div className="evmirror-art">
                        <img src={art.src} alt={art.alt} />
                    </div>
                )}

                {(view.main || view.vs) && (
                    <div className={`evmirror-stage ${view.vs ? 'evmirror-stage--duo' : ''}`}>
                        {view.vs && <MirrorToken pkm={view.vs} />}
                        {view.vs && view.main && <div className="evmirror-vs">VS</div>}
                        {view.main && <MirrorToken pkm={view.main} />}
                    </div>
                )}

                {view.score && (
                    <div className="evmirror-score">
                        <div className="evmirror-score-side">
                            <span className="evmirror-score-label">{view.score.mineLabel || 'Tú'}</span>
                            <strong>{view.score.mine}</strong>
                        </div>
                        <i>—</i>
                        <div className="evmirror-score-side">
                            <span className="evmirror-score-label">{view.score.theirsLabel || 'Rival'}</span>
                            <strong>{view.score.theirs}</strong>
                        </div>
                    </div>
                )}

                {list.length > 0 && (
                    <div className="evmirror-list">
                        {list.map((p, i) => (
                            <MirrorToken key={`${p.pokedex}-${i}`} pkm={p} size="small"
                                         dim={hayElegido && !p.on} />
                        ))}
                    </div>
                )}

                {view.status && <div className="evmirror-status">{view.status}</div>}
            </div>
        </div>
    );
};

export default EventMirrorModal;
