import AllPlayers from './AllPlayers';

// Marcador de solo lectura para dejar puesto en una pantalla aparte: la misma
// tabla de /players, pero sin nada que la tape — ni el espejo de la batalla, ni
// el aviso de compra en la tienda, ni el modal de victoria.
// Comparte implementación a propósito: cualquier cambio de diseño en la tabla
// llega a las dos rutas sin tener que tocarlo dos veces.
const Score = () => <AllPlayers showOverlays={false} />;

export default Score;
