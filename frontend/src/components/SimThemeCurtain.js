import { useState, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// Cortina de transición del tema.
//
// Tapa el salto del setup a la pantalla de batalla: dos hojas se cierran, la
// mascota del tema aparece mientras la petición está en vuelo, y las hojas se
// abren ya sobre la pantalla nueva. Lo que antes era un cambio seco ahora tiene
// un momento propio.
//
// Solo actúa si el tema tiene mascota. Sin ella —Ultimix y los demás— el hook
// se limita a ejecutar la función, sin cortina y sin esperas añadidas: el
// comportamiento es exactamente el de antes.
// ═══════════════════════════════════════════════════════════════════════════

// Duraciones en ms. Están aquí arriba para poder ajustar el ritmo de un vistazo;
// si se tocan, hay que tocar también las de _simCurtain.scss.
const CLOSE_MS = 280;
const OPEN_MS = 300;
// Suelo del tramo con las hojas cerradas: en red local la petición vuelve casi
// al instante y sin esto la cortina daría un parpadeo en vez de una transición.
const HOLD_MIN_MS = 320;

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const prefersReducedMotion = () => {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
};

export const useSimCurtain = (mascot) => {
    const [phase, setPhase] = useState('idle');
    const busy = useRef(false);

    // Nada de un ref "sigo montado" para condicionar los setPhase: con
    // React.StrictMode el efecto que lo apagaba se ejecutaba al montar (monta →
    // limpia → vuelve a montar) y lo dejaba en false para siempre, así que la
    // cortina se cerraba y ya no volvía a abrirse nunca. En React 18 un
    // setState sobre un componente desmontado es un no-op silencioso, así que
    // esa guardia no protegía de nada y solo podía dejar la pantalla atrapada.
    const run = async (fn) => {
        if (!mascot || prefersReducedMotion()) return fn();
        // Doble toque en una tarjeta de líder: la segunda pulsación se ignora
        // en vez de lanzar una segunda batalla por debajo de la cortina.
        if (busy.current) return undefined;
        busy.current = true;

        let heldAt = 0;
        try {
            setPhase('in');
            await wait(CLOSE_MS);
            setPhase('hold');
            heldAt = Date.now();
            return await fn();
        } finally {
            // Todo el cierre va en un finally que abarca también el tramo de
            // cerrado: pase lo que pase —la petición falla, el usuario navega
            // fuera— la cortina se abre y `busy` se suelta. La pantalla nunca
            // se puede quedar atrapada detrás.
            if (heldAt) await wait(Math.max(0, HOLD_MIN_MS - (Date.now() - heldAt)));
            setPhase('out');
            await wait(OPEN_MS);
            setPhase('idle');
            busy.current = false;
        }
    };

    return { phase, run };
};

// Se queda montada mientras el tema tenga mascota: en reposo las hojas están
// fuera de pantalla, así que no pinta nada, pero las transiciones CSS pueden
// arrancar sin el salto que daría montar el nodo ya en su posición final.
const SimThemeCurtain = ({ mascot, phase }) => {
    if (!mascot) return null;

    return (
        <div className={`sim-curtain sim-curtain--${phase}`} aria-hidden="true">
            <div className="sim-curtain-panel sim-curtain-panel--top" />
            <div className="sim-curtain-panel sim-curtain-panel--bottom" />
            <div className="sim-curtain-center">
                {/* El sprite animado si lo hay; si no, el render quieto */}
                <img className={`sim-curtain-mascot ${mascot.anim ? 'sim-curtain-mascot--pixel' : ''}`}
                     src={mascot.anim || mascot.still}
                     alt="" />
                <div className="sim-curtain-label">{mascot.label}</div>
            </div>
        </div>
    );
};

export default SimThemeCurtain;
