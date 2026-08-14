import React from 'react';
import { render, screen, act } from '@testing-library/react';
import SimThemeCurtain, { useSimCurtain } from './SimThemeCurtain';

// El bug que motivó estas pruebas: un ref "sigo montado" que StrictMode dejaba
// apagado para siempre (monta → limpia → vuelve a montar), de modo que la
// cortina se cerraba y no volvía a abrirse nunca. Todo se monta dentro de
// <React.StrictMode> a propósito, que es como corre la app de verdad.
const mascot = { still: 'gengar.png', anim: 'gengar.gif', label: 'Entrando en la sombra…' };

const Harness = ({ mascot: m, onReady }) => {
    const { phase, run } = useSimCurtain(m);
    onReady(run);
    return (
        <div>
            <span data-testid="phase">{phase}</span>
            <SimThemeCurtain mascot={m} phase={phase} />
        </div>
    );
};

const setup = (m = mascot) => {
    let run;
    render(
        <React.StrictMode>
            <Harness mascot={m} onReady={(r) => { run = r; }} />
        </React.StrictMode>
    );
    return { getRun: () => run, phase: () => screen.getByTestId('phase').textContent };
};

const flush = async (ms) => {
    await act(async () => {
        jest.advanceTimersByTime(ms);
        // Deja correr las promesas encadenadas entre timers
        await Promise.resolve();
        await Promise.resolve();
    });
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('la cortina cierra, aguanta y vuelve a abrir bajo StrictMode', async () => {
    const h = setup();
    expect(h.phase()).toBe('idle');

    let done;
    await act(async () => { done = h.getRun()(async () => 'ok'); });
    expect(h.phase()).toBe('in');

    await flush(300);            // CLOSE_MS
    expect(h.phase()).toBe('hold');

    await flush(400);            // HOLD_MIN_MS
    expect(h.phase()).toBe('out');

    await flush(320);            // OPEN_MS
    expect(h.phase()).toBe('idle');
    await expect(done).resolves.toBe('ok');
});

test('si la petición falla, la cortina se abre igual', async () => {
    const h = setup();

    let done;
    await act(async () => {
        done = h.getRun()(async () => { throw new Error('red caída'); });
        done.catch(() => {});
    });

    await flush(300);
    await flush(400);
    await flush(320);

    expect(h.phase()).toBe('idle');
    await expect(done).rejects.toThrow('red caída');
});

// Sin matchers de jest-dom: el proyecto no tiene setupTests, así que se
// comprueba contra el DOM a pelo
test('la cortina lleva la clase de su fase y monta la mascota', async () => {
    const h = setup();
    const curtain = () => document.querySelector('.sim-curtain');

    expect(curtain().className).toContain('sim-curtain--idle');

    await act(async () => { h.getRun()(async () => 'ok'); });
    await flush(300);

    expect(curtain().className).toContain('sim-curtain--hold');
    expect(document.querySelector('.sim-curtain-center')).not.toBeNull();
    expect(document.querySelector('.sim-curtain-label').textContent).toBe(mascot.label);

    // Con sprite animado gana el gif, y se marca para ampliarlo sin suavizado
    const img = document.querySelector('.sim-curtain-mascot');
    expect(img.getAttribute('src')).toBe('gengar.gif');
    expect(img.className).toContain('sim-curtain-mascot--pixel');
});

test('sin sprite animado la cortina cae al render quieto', async () => {
    const h = setup({ still: 'gengar.png', anim: null, label: 'Sin gif' });

    await act(async () => { h.getRun()(async () => 'ok'); });
    await flush(300);

    const img = document.querySelector('.sim-curtain-mascot');
    expect(img.getAttribute('src')).toBe('gengar.png');
    expect(img.className).not.toContain('sim-curtain-mascot--pixel');
});

test('un tema sin mascota ejecuta la acción sin cortina ni esperas', async () => {
    const h = setup(null);
    expect(document.querySelector('.sim-curtain')).toBeNull();

    const fn = jest.fn(async () => 'directo');
    let done;
    await act(async () => { done = h.getRun()(fn); });

    await expect(done).resolves.toBe('directo');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(h.phase()).toBe('idle');
});

test('el doble toque no lanza la acción dos veces', async () => {
    const h = setup();
    const fn = jest.fn(async () => 'ok');

    await act(async () => {
        h.getRun()(fn);
        h.getRun()(fn);   // segundo toque mientras la cortina está en marcha
    });
    await flush(300);
    await flush(400);
    await flush(320);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(h.phase()).toBe('idle');
});
