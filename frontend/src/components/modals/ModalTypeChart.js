import React, { useState } from 'react';

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

const ModalTypeChart = ({ show, onClose }) => {
    const [zoom, setZoom] = useState(null);

    if (!show) return null;

    const imgs = getTypeChartImgs();

    const handleClose = () => {
        setZoom(null);
        onClose();
    };

    return (
        <div className="modal-backdrop type-chart-backdrop" onClick={handleClose}>
            <div className="type-chart-modal" onClick={e => e.stopPropagation()}>
                <div className="type-chart-title">
                    Tabla de tipos
                    <button className="type-chart-close" onClick={handleClose}>✕</button>
                </div>

                {imgs.length > 0 ? (
                    <div className="type-chart-body">
                        <div className="type-chart-note">Toca la tabla para verla en grande.</div>
                        {imgs.map((src, i) => (
                            <img key={i}
                                 className="type-chart-img"
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
            </div>

            {zoom && (
                <div className="type-chart-zoom" onClick={(e) => { e.stopPropagation(); setZoom(null); }}>
                    <img className="type-chart-zoom-img" src={zoom} alt="Tabla de tipos" />
                    <div className="type-chart-zoom-hint">Toca para cerrar</div>
                </div>
            )}
        </div>
    );
};

export default ModalTypeChart;
