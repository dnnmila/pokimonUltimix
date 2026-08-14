import { useState } from 'react';

import { STORE_ITEMS as ITEMS } from './storeItems';

// Tienda del máster: mismo catálogo y misma piel que la del jugador
// (ModalTiendaSim), pero aquí la compra se cierra en el acto — no hay
// solicitud que aprobar, el máster ya es quien aprueba.
const ModalTienda = ({ show, onClose, currentPlayer, onMasterPurchase }) => {
    // Ítem abierto en la vista de detalle. Elegir uno no compra: solo abre la
    // carta, y la compra sale al confirmar.
    const [selected, setSelected] = useState(null);

    if (!show) return null;

    const handleClose = () => {
        setSelected(null);
        onClose();
    };

    const confirmPurchase = () => {
        if (!selected) return;
        if (currentPlayer.coins < selected.price) return;
        onMasterPurchase(currentPlayer.id, selected.name, selected.price);
        setSelected(null);
        onClose();
    };

    if (selected) {
        const canAfford = currentPlayer.coins >= selected.price;
        return (
            <div className="modal-backdrop">
                <div className="modal-store modal-store--shop modal-store--detail">
                    <div className='Title-modal'>{selected.name}</div>

                    <div className={`store-detail-cards ${selected.cards.length > 1 ? 'store-detail-cards--multi' : ''}`}>
                        {selected.cards.length > 0
                            ? selected.cards.map((src) => (
                                <img key={src} className="store-detail-card" src={src} alt={selected.name} />
                            ))
                            : <div className={`store-detail-card-fallback ${selected.img}`}></div>
                        }
                    </div>

                    {selected.cards.length > 1 && (
                        <div className="store-detail-note">
                            El jugador elige una de estas cartas al recibir el ítem
                        </div>
                    )}

                    <div className="store-detail-price">
                        <span className='store-option-cost'>{selected.price}</span>
                        <span className="store-detail-coins">
                            {currentPlayer.name} tiene {currentPlayer.coins}
                        </span>
                    </div>

                    {!canAfford && (
                        <div className="store-detail-warn">Monedas insuficientes</div>
                    )}

                    <div className="store-detail-actions">
                        <button className="store-detail-back" onClick={() => setSelected(null)}>
                            Volver
                        </button>
                        <button
                            className="store-detail-buy"
                            disabled={!canAfford}
                            onClick={confirmPurchase}
                        >
                            Comprar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-store modal-store--shop">
                <div className='Title-modal'>Store</div>
                <div className="store_all_options">
                    {ITEMS.map((item) => {
                        const canAfford = currentPlayer.coins >= item.price;
                        return (
                            <div
                                key={item.name}
                                onClick={() => setSelected(item)}
                                className={`store-option ${!canAfford ? 'store-option--disabled' : ''}`}
                            >
                                <div className={`store-option-img ${item.img}`}></div>
                                <div className='store-option-name'>{item.name}</div>
                                <div className='store-option-cost'>{item.price}</div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={handleClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default ModalTienda;
