// Catálogo único de la tienda: lo consumen la tienda del máster (ModalTienda)
// y la del jugador (ModalTiendaSim), para que precios y orden no se separen.

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
export const BOOST_CARDS = [cardXAttack, cardXDefense, cardXAccuracy, cardGuardSpec, cardDireHit];

// Se recorre fila a fila la tabla física "Item Costs" (columna izquierda,
// columna derecha) para que buscar un ítem en pantalla siga el mismo orden que
// en el papel.
// `cards` son las cartas reales que recibe el jugador; si falta, la vista de
// detalle cae al icono de la tabla.
export const STORE_ITEMS = [
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

// ── Descuentos del máster ───────────────────────────────────────────────────
//
// El descuento vive en la partida (`game.storeDiscount`) y lo aplican las dos
// tiendas al pintar el precio; lo que viaja en la solicitud de compra es ya el
// precio rebajado, igual que antes viajaba el normal.
//
// Se redondea HACIA ABAJO y nunca baja de 1: un descuento tiene que notarse, y
// nada de la tienda puede acabar saliendo gratis.
export const discountedPrice = (price, percent) => {
    const pct = Number(percent) || 0;
    if (!pct) return price;
    return Math.max(1, Math.floor(price * (1 - pct / 100)));
};

export default STORE_ITEMS;
