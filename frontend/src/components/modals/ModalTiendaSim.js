import { useState } from 'react';

import cardPokeBall     from '../../images/Nuevos items/itesm shop updated/Shop_-_Poke__Ball.png';
import cardGreatBall    from '../../images/Nuevos items/itesm shop updated/Shop_-_Great_Ball.png';
import cardUltraBall    from '../../images/Nuevos items/itesm shop updated/Shop_-_Ultra_Ball.png';
import cardApricorn     from '../../images/Nuevos items/itesm shop updated/base_gold_cart.png';
import cardPotion       from '../../images/Nuevos items/itesm shop updated/Shop_-_Potion.png';
import cardMaxPotion    from '../../images/Nuevos items/itesm shop updated/Shop_-_Max_Potion.png';
import cardRevive       from '../../images/Nuevos items/itesm shop updated/Shop_-_Revive.png';
import cardMaxRevive    from '../../images/Nuevos items/itesm shop updated/Shop_-_Max_Revive.png';
import cardFullHeal     from '../../images/Nuevos items/itesm shop updated/Shop_-_Full_Heal.png';
import cardEscapeRope   from '../../images/Nuevos items/itesm shop updated/Shop_-_Escape_Rope.png';
import cardBicycle      from '../../images/Nuevos items/itesm shop updated/Shop_-_Bicycle.png';
import cardPokeDoll     from '../../images/Nuevos items/itesm shop updated/Shop_-_Poke__Doll.png';
import cardBerry        from '../../images/Nuevos items/itesm shop updated/Shop_-_Berry.png';
import cardVitamin      from '../../images/Nuevos items/itesm shop updated/Shop_-_Vitamin.png';
import cardTMCase       from '../../images/Nuevos items/itesm shop updated/Shop_-_TM_Case.png';
import cardTypeEnhancer from '../../images/Nuevos items/itesm shop updated/Shop_-_Type-Enhancer.png';
import cardMegaBracelet from '../../images/Nuevos items/itesm shop updated/Mega_Bracelet.png';
import cardMegaStone    from '../../images/Nuevos items/itesm shop updated/Mega_Stone.png';
import cardZRing        from '../../images/Nuevos items/itesm shop updated/Shop_-_Z-Ring.png';
import cardDynamaxBand  from '../../images/Nuevos items/itesm shop updated/Dynamax_Band.png';
import cardTeraOrb      from '../../images/Nuevos items/itesm shop updated/Shop_-_Tera_Orb.png';
import cardRunningShoes from '../../images/Nuevos items/itesm shop updated/Shop_-_Running_Shoes.png';
import cardRepel        from '../../images/Nuevos items/itesm shop updated/Shop_-_Repel.png';
import cardBlackFlute   from '../../images/Nuevos items/itesm shop updated/Shop_-_Black_Flute.png';
import cardXAttack      from '../../images/Nuevos items/itesm shop updated/Shop_-_X_Attack.png';
import cardXDefense     from '../../images/Nuevos items/itesm shop updated/Shop_-_X_Defense.png';
import cardXAccuracy    from '../../images/Nuevos items/itesm shop updated/Shop_-_X_Accuracy.png';
import cardGuardSpec    from '../../images/Nuevos items/itesm shop updated/Shop_-_Guard_Spec_.png';
import cardDireHit      from '../../images/Nuevos items/itesm shop updated/Shop_-_Dire_Hit.png';

// "Boost Item" es una sola línea en la tabla de precios, pero en físico son
// estas cinco cartas. Se muestran todas para que el jugador vea qué elige.
const BOOST_CARDS = [cardXAttack, cardXDefense, cardXAccuracy, cardGuardSpec, cardDireHit];

// Catálogo alineado con la tabla física "Item Costs": se recorre fila a fila
// de la tabla (columna izquierda, columna derecha) para que buscar un ítem
// en pantalla siga el mismo orden que en el papel.
// `cards` son las cartas reales que recibe el jugador; si falta, la vista de
// detalle cae al icono de la tabla.
const ITEMS = [
    { name: 'Pokeball',            price: 4,  img: 'img-pokeball',     cards: [cardPokeBall]     },
    { name: 'Boost Item',          price: 4,  img: 'img-boostItem',    cards: BOOST_CARDS        },
    { name: 'Great Ball',          price: 8,  img: 'img-greatBall',    cards: [cardGreatBall]    },
    { name: 'Vitamin',             price: 30, img: 'img-vitamin',      cards: [cardVitamin]      },
    { name: 'Ultra Ball',          price: 12, img: 'img-ultraBall',    cards: [cardUltraBall]    },
    { name: 'Legendary Evo. Item', price: 12, img: 'img-legendaryEvo', cards: []                 },
    { name: 'Apricorn',            price: 8,  img: 'img-apricorn',     cards: [cardApricorn]     },
    { name: 'TM Case',             price: 16, img: 'img-TM',           cards: [cardTMCase]       },
    { name: 'Potion',              price: 4,  img: 'img-potion',       cards: [cardPotion]       },
    { name: 'Type Enhancer',       price: 12, img: 'img-typeEnhancer', cards: [cardTypeEnhancer] },
    { name: 'Max Potion',          price: 8,  img: 'img-maxPotion',    cards: [cardMaxPotion]    },
    { name: 'Mega Bracelet',       price: 10, img: 'img-MegaBracelet', cards: [cardMegaBracelet] },
    { name: 'Revive',              price: 6,  img: 'img-Revive',       cards: [cardRevive]       },
    { name: 'Mega Stone',          price: 4,  img: 'img-MegaStone',    cards: [cardMegaStone]    },
    { name: 'Max Revive',          price: 16, img: 'img-MaxRevive',    cards: [cardMaxRevive]    },
    { name: 'Z-Ring',              price: 12, img: 'img-zRing',        cards: [cardZRing]        },
    // La tabla impresa marca 2; el precio de la partida es 6
    { name: 'Full Heal',           price: 6,  img: 'img-FullHeal',     cards: [cardFullHeal]     },
    { name: 'Dynamax Band',        price: 20, img: 'img-Dynamax',      cards: [cardDynamaxBand]  },
    { name: 'Escape Rope',         price: 2,  img: 'img-EscapeRope',   cards: [cardEscapeRope]   },
    { name: 'Tera Orb',            price: 18, img: 'img-teraOrb',      cards: [cardTeraOrb]      },
    { name: 'Bicycle',             price: 18, img: 'img-Bicycle',      cards: [cardBicycle]      },
    { name: 'Running Shoes',       price: 4,  img: 'img-runningShoes', cards: [cardRunningShoes] },
    // La tabla impresa marca 4; el precio de la partida es 12
    { name: 'Poke Doll',           price: 12, img: 'img-PokeDoll',     cards: [cardPokeDoll]     },
    { name: 'Repel',               price: 4,  img: 'img-repel',        cards: [cardRepel]        },
    { name: 'Berry',               price: 8,  img: 'img-berry',        cards: [cardBerry]        },
    { name: 'Black Flute',         price: 8,  img: 'img-blackFlute',   cards: [cardBlackFlute]   },
];

const ModalTiendaSim = ({ show, onClose, player, pendingRequest, onRequestPurchase }) => {
    // Ítem abierto en la vista de detalle. Elegir uno ya no compra: solo abre
    // la carta, y la solicitud sale al confirmar.
    const [selected, setSelected] = useState(null);

    if (!show) return null;

    const handleClose = () => {
        setSelected(null);
        onClose();
    };

    const confirmPurchase = () => {
        if (!selected || pendingRequest) return;
        if (player.coins < selected.price) return;
        onRequestPurchase(selected.name, selected.price);
        setSelected(null);
    };

    if (pendingRequest) {
        return (
            <div className="modal-backdrop">
                <div className="modal-store">
                    <div className='Title-modal'>Store</div>
                    <div className="sim-store-pending">
                        <div className="sim-store-pending-text">
                            Solicitud enviada
                        </div>
                        <div className="sim-store-pending-item">
                            {pendingRequest.item} — ${pendingRequest.price}
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
        const canAfford = player.coins >= selected.price;
        return (
            <div className="modal-backdrop">
                <div className="modal-store modal-store--detail">
                    <div className='Title-modal'>{selected.name}</div>

                    <div className={`sim-store-cards ${selected.cards.length > 1 ? 'sim-store-cards--multi' : ''}`}>
                        {selected.cards.length > 0
                            ? selected.cards.map((src) => (
                                <img key={src} className="sim-store-card" src={src} alt={selected.name} />
                            ))
                            : <div className={`sim-store-card-fallback ${selected.img}`}></div>
                        }
                    </div>

                    {selected.cards.length > 1 && (
                        <div className="sim-store-detail-note">
                            Elegís una de estas cartas al recibir el ítem
                        </div>
                    )}

                    <div className="sim-store-detail-price">
                        <span className='store-option-cost'>{selected.price}</span>
                        <span className="sim-store-detail-coins">
                            Tienes {player.coins}
                        </span>
                    </div>

                    {!canAfford && (
                        <div className="sim-store-detail-warn">Monedas insuficientes</div>
                    )}

                    <div className="sim-store-detail-actions">
                        <button className="sim-store-back" onClick={() => setSelected(null)}>
                            Volver
                        </button>
                        <button
                            className="sim-store-buy"
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
            <div className="modal-store">
                <div className='Title-modal'>Store</div>
                <div className="store_all_options">
                    {ITEMS.map((item) => {
                        const canAfford = player.coins >= item.price;
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

export default ModalTiendaSim;
