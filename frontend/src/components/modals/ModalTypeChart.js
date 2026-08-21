import React, { useState, useRef, useEffect, useCallback } from 'react';

// Tabla de tipos.
//
// NO es un modal: es un panel flotante. La tabla se consulta MIENTRAS se miran
// los tokens, así que no lleva velo ni desenfoque detrás y no captura los
// clics — el resto de la pantalla se sigue usando con el panel abierto. Por eso
// tampoco se cierra al tocar fuera: la única salida es su ✕.
//
// Se arrastra por la cabecera (pointer events, así vale igual con dedo que con
// ratón) y tiene tres tamaños. Las dos mitades de la tabla se ponen una al lado
// de otra: son verticales, y apiladas obligaban a hacer scroll para ver la
// segunda. Posición y tamaño se guardan por dispositivo, como el tema.

// Si algún día se unen en un solo archivo (typesTable.JPG) se usa ese; mientras,
// se apilan las dos mitades.
// El nombre va en template literal a propósito: así webpack arma un contexto y un
// archivo faltante falla en runtime (lo atrapa el catch) en vez de romper el build,
// como pasaría con un require de string literal.
const loadChartImg = (name) => {
    try { return require(`../../images/${name}.JPG`); } catch { return null; }
};

export const getTypeChartImgs = () => {
    const full = loadChartImg('typesTable');
    if (full) return [full];
    return ['typesTable1', 'typesTable2'].map(n => loadChartImg(n)).filter(Boolean);
};

// Ancho de CADA mitad de la tabla. La mediana entra entera en un iPad sin
// scroll; la grande es para leerla de lejos, y para el detalle está el zoom.
const SIZES = [
    { id: 'S', label: 'S', px: 200 },
    { id: 'M', label: 'M', px: 290 },
    { id: 'L', label: 'L', px: 400 },
];

const POS_KEY  = 'ultimix.typeChart.pos';
const SIZE_KEY = 'ultimix.typeChart.size';

const readPos = () => {
    try {
        const raw = localStorage.getItem(POS_KEY);
        const p = raw ? JSON.parse(raw) : null;
        return (p && Number.isFinite(p.x) && Number.isFinite(p.y)) ? p : null;
    } catch { return null; }
};

const readSize = () => {
    try {
        const id = localStorage.getItem(SIZE_KEY);
        return SIZES.some(s => s.id === id) ? id : 'M';
    } catch { return 'M'; }
};

const ModalTypeChart = ({ show, onClose }) => {
    const [zoom, setZoom] = useState(null);
    const [sizeId, setSizeId] = useState(readSize);
    // null = sin arrastrar todavía: manda la posición por defecto del CSS
    // (esquina superior derecha, debajo del botón).
    const [pos, setPos] = useState(readPos);
    const panelRef = useRef(null);
    const dragRef = useRef(null);

    // Deja el panel dentro de la pantalla. Hace falta al soltar y al girar la
    // tablet: una posición guardada en horizontal puede caer fuera en vertical
    // y el panel quedaría inalcanzable.
    const clamp = useCallback((x, y) => {
        const el = panelRef.current;
        const w = el?.offsetWidth || 320;
        const h = el?.offsetHeight || 320;
        return {
            x: Math.round(Math.min(Math.max(8, x), Math.max(8, window.innerWidth - w - 8))),
            y: Math.round(Math.min(Math.max(8, y), Math.max(8, window.innerHeight - h - 8))),
        };
    }, []);

    useEffect(() => {
        if (!show) return undefined;
        const recolocar = () => setPos(p => (p ? clamp(p.x, p.y) : p));
        window.addEventListener('resize', recolocar);
        window.addEventListener('orientationchange', recolocar);
        return () => {
            window.removeEventListener('resize', recolocar);
            window.removeEventListener('orientationchange', recolocar);
        };
    }, [show, clamp]);

    if (!show) return null;

    const imgs = getTypeChartImgs();
    const size = SIZES.find(s => s.id === sizeId) || SIZES[1];

    const pickSize = (id) => {
        setSizeId(id);
        try { localStorage.setItem(SIZE_KEY, id); } catch { /* modo privado */ }
    };

    // Los botones de la cabecera son suyos: no arrastran el panel.
    const handlePointerDown = (e) => {
        if (e.target.closest('.type-chart-tools')) return;
        const el = panelRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!dragRef.current) return;
        e.preventDefault();
        setPos(clamp(e.clientX - dragRef.current.dx, e.clientY - dragRef.current.dy));
    };

    const handlePointerUp = (e) => {
        if (!dragRef.current) return;
        dragRef.current = null;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        setPos(p => {
            if (p) { try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch { /* modo privado */ } }
            return p;
        });
    };

    return (
        <>
            <div
                ref={panelRef}
                className="type-chart-panel"
                style={pos ? { left: pos.x, top: pos.y, right: 'auto' } : undefined}
            >
                <div
                    className="type-chart-title"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    <span className="type-chart-grip" aria-hidden="true">⠿</span>
                    Tabla de tipos
                    <div className="type-chart-tools">
                        {SIZES.map(s => (
                            <button key={s.id}
                                    className={`type-chart-size ${s.id === sizeId ? 'is-on' : ''}`}
                                    title={`Tamaño ${s.label}`}
                                    onClick={() => pickSize(s.id)}>{s.label}</button>
                        ))}
                        <button className="type-chart-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                {imgs.length > 0 ? (
                    <div className="type-chart-body">
                        {imgs.map((src, i) => (
                            <img key={i}
                                 className="type-chart-img"
                                 style={{ width: size.px }}
                                 src={src}
                                 alt="Tabla de tipos"
                                 onClick={() => setZoom(src)} />
                        ))}
                    </div>
                ) : (
                    <div className="type-chart-empty">
                        No se encontraron las imágenes. Se esperan
                        {' '}<code>frontend/src/images/typesTable1.JPG</code> y
                        {' '}<code>typesTable2.JPG</code>.
                    </div>
                )}

                <div className="type-chart-note">Arrastra la cabecera para moverla · toca la tabla para verla en grande</div>
            </div>

            {zoom && (
                <div className="type-chart-zoom" onClick={() => setZoom(null)}>
                    <img className="type-chart-zoom-img" src={zoom} alt="Tabla de tipos" />
                    <div className="type-chart-zoom-hint">Toca para cerrar</div>
                </div>
            )}
        </>
    );
};

export default ModalTypeChart;
