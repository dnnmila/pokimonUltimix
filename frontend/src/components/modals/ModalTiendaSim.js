const ITEMS = [
    { name: 'Pokeball',      price: 4,  img: 'img-pokeball'    },
    { name: 'X Attack(1)',   price: 4,  img: 'img-XAttk'       },
    { name: 'Great Ball',    price: 8,  img: 'img-greatBall'   },
    { name: 'X Attack(2)',   price: 8,  img: 'img-XAttk'       },
    { name: 'Ultra Ball',    price: 12, img: 'img-ultraBall'   },
    { name: 'X Attack(3)',   price: 16, img: 'img-XAttk'       },
    { name: 'Potion',        price: 4,  img: 'img-potion'      },
    { name: 'X Defense',     price: 4,  img: 'img-XDef'        },
    { name: 'Revive',        price: 8,  img: 'img-Revive'      },
    { name: 'X Accuracy',    price: 4,  img: 'img-XAcc'        },
    { name: 'Max Revive',    price: 16, img: 'img-MaxRevive'   },
    { name: 'Guard Spec.',   price: 6,  img: 'img-GuardSpec'   },
    { name: 'Full Heal',     price: 6,  img: 'img-FullHeal'    },
    { name: 'TM',            price: 16, img: 'img-TM'          },
    { name: 'Escape Rope',   price: 2,  img: 'img-EscapeRope'  },
    { name: 'Mega Bracelet', price: 16, img: 'img-MegaBracelet'},
    { name: 'Bicycle',       price: 16, img: 'img-Bicycle'     },
    { name: 'Mega Stone',    price: 8,  img: 'img-MegaStone'   },
    { name: 'Poke Doll',     price: 16, img: 'img-PokeDoll'    },
    { name: 'Dynamax',       price: 16, img: 'img-Dynamax'     },
];

const ModalTiendaSim = ({ show, onClose, player, pendingRequest, onRequestPurchase }) => {
    if (!show) return null;

    const handleRequest = (item, price) => {
        if (pendingRequest) return;
        if (player.coins < price) return;
        onRequestPurchase(item, price);
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
                    <button onClick={onClose}>Cerrar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-store">
                <div className='Title-modal'>Store</div>
                <div className="store_all_options">
                    {ITEMS.map(({ name, price, img }) => {
                        const canAfford = player.coins >= price;
                        return (
                            <div
                                key={name}
                                onClick={() => handleRequest(name, price)}
                                className={`store-option ${!canAfford ? 'store-option--disabled' : ''}`}
                            >
                                <div className={`store-option-img ${img}`}></div>
                                <div className='store-option-name'>{name}</div>
                                <div className='store-option-cost'>{price}</div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default ModalTiendaSim;
