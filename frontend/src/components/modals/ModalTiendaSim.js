import { useState } from 'react';

import { STORE_ITEMS as ITEMS, discountedPrice } from './storeItems';

// Lo que paga vender una carta. Va aquí y no en el catálogo de la tienda
// porque no es un artículo: es la operación inversa, y no se compra.
const SELL_PRICE = 2;

// `discount` es `game.storeDiscount`: { percent, turnsLeft } o null. Lo pone el
// máster desde su barra y dura una ronda; aquí solo se pinta y se cobra.
const ModalTiendaSim = ({ show, onClose, player, pendingRequest, onRequestPurchase, discount = null }) => {
    // Ítem abierto en la vista de detalle. Elegir uno ya no compra: solo abre
    // la carta, y la solicitud sale al confirmar.
    const [selected, setSelected] = useState(null);

    if (!show) return null;

    const pct = discount?.percent || 0;
    const priceOf = (item) => discountedPrice(item.price, pct);

    // Cartel del descuento, arriba de la rejilla y de la ficha: lo que cambia el
    // precio tiene que verse antes de mirar el precio.
    const discountBanner = pct > 0 && (
        <div className="store-discount-banner">
            <span className="store-discount-tag">-{pct}%</span>
            <span>
                Rebaja del máster
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
        if (!selected || pendingRequest) return;
        if (player.coins < priceOf(selected)) return;
        onRequestPurchase(selected.name, priceOf(selected));
        setSelected(null);
    };

    // Vender no abre vista de detalle: no hay carta que enseñar, la carta la
    // pone el jugador sobre la mesa. Sale derecho como solicitud al máster.
    const confirmSell = () => {
        if (pendingRequest) return;
        onRequestPurchase('Venta de carta', SELL_PRICE, 'sell');
    };

    if (pendingRequest) {
        return (
            <div className="modal-backdrop">
                <div className="modal-store modal-store--shop">
                    <div className='Title-modal'>Store</div>
                    <div className="sim-store-pending">
                        <div className="sim-store-pending-text">
                            Solicitud enviada
                        </div>
                        {/* El signo evita la duda de si te van a cobrar o a pagar */}
                        <div className="sim-store-pending-item">
                            {pendingRequest.item} — {pendingRequest.kind === 'sell' ? '+' : '-'}${pendingRequest.price}
                        </div>
                        <div className="sim-store-pending-wait">
                            Esperando aprobación ...
                        </div>
                    </div>
                    <button onClick={handleClose}>Cerrar</button>
                </div>
            </div>
        );
    }

    if (selected) {
        const price = priceOf(selected);
        const canAfford = player.coins >= price;
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
                            Elegís una de estas cartas al recibir el ítem
                        </div>
                    )}

                    <div className="store-detail-price">
                        {pct > 0 && <span className='store-option-cost store-option-cost--old'>{selected.price}</span>}
                        <span className={`store-option-cost ${pct > 0 ? 'store-option-cost--off' : ''}`}>{price}</span>
                        <span className="store-detail-coins">
                            Tienes {player.coins}
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
                        const canAfford = player.coins >= price;
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

                {/* Vender una carta: la operación inversa de la tienda, así que
                    va separada de la rejilla de artículos y no dentro de ella. */}
                <div className="store-sell">
                   
                    <button className="store-sell-btn" onClick={confirmSell}>
                        Vender carta <span className="store-sell-amount">+${SELL_PRICE}</span>
                    </button>
                </div>

                <button onClick={handleClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default ModalTiendaSim;
