import { useState } from 'react';

import { STORE_ITEMS as ITEMS, discountedPrice } from './storeItems';

// Tienda del máster: mismo catálogo y misma piel que la del jugador
// (ModalTiendaSim), pero aquí la compra se cierra en el acto — no hay
// solicitud que aprobar, el máster ya es quien aprueba.
const ModalTienda = ({ show, onClose, currentPlayer, onMasterPurchase, discount = null }) => {
    // Ítem abierto en la vista de detalle. Elegir uno no compra: solo abre la
    // carta, y la compra sale al confirmar.
    const [selected, setSelected] = useState(null);

    if (!show) return null;

    // El mismo descuento que ve el jugador (`game.storeDiscount`), para que el
    // máster cobre lo que la tablet le está enseñando al otro lado de la mesa.
    const pct = discount?.percent || 0;
    const priceOf = (item) => discountedPrice(item.price, pct);

    const discountBanner = pct > 0 && (
        <div className="store-discount-banner">
            <span className="store-discount-tag">-{pct}%</span>
            <span>
                Rebaja activa
                {discount?.turnsLeft > 0 && (
                    <em> · {discount.turnsLeft} {discount.turnsLeft === 1 ? 'turno' : 'turnos'}</em>
                )}
            </span>
        </div>
    );

    const handleClose = () => {
        setSelected(null);
        onClose();
    };

    const confirmPurchase = () => {
        if (!selected) return;
        if (currentPlayer.coins < priceOf(selected)) return;
        onMasterPurchase(currentPlayer.id, selected.name, priceOf(selected));
        setSelected(null);
        onClose();
    };

    if (selected) {
        const price = priceOf(selected);
        const canAfford = currentPlayer.coins >= price;
        return (
            <div className="modal-backdrop">
                <div className="modal-store modal-store--shop modal-store--detail">
                    <div className='Title-modal'>{selected.name}</div>
                    {discountBanner}

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
                        {pct > 0 && <span className='store-option-cost store-option-cost--old'>{selected.price}</span>}
                        <span className={`store-option-cost ${pct > 0 ? 'store-option-cost--off' : ''}`}>{price}</span>
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
                {discountBanner}
                <div className="store_all_options">
                    {ITEMS.map((item) => {
                        const price = priceOf(item);
                        const canAfford = currentPlayer.coins >= price;
                        return (
                            <div
                                key={item.name}
                                onClick={() => setSelected(item)}
                                className={`store-option ${!canAfford ? 'store-option--disabled' : ''}`}
                            >
                                <div className={`store-option-img ${item.img}`}></div>
                                <div className='store-option-name'>{item.name}</div>
                                <div className={`store-option-cost ${pct > 0 ? 'store-option-cost--off' : ''}`}>
                                    {price}
                                    {pct > 0 && <em className='store-option-cost-old'>{item.price}</em>}
                                </div>
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
