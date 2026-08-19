import { displayName, hasMote, nameTitle } from '../moteName';

// Nombre de un Pokémon en cualquier pantalla: pinta el mote si lo tiene y le
// añade la clase `pkm-mote`, que es la que lo tiñe (ver styles/_mote.scss).
//
// `as` existe porque las tarjetas no coinciden en etiqueta —unas usan span y
// otras div— y el layout de cada una depende de eso. Lo que va en `rest` (un
// onClick, un title propio) pisa a lo de aquí, que es lo que se quiere: el
// nombre de SimPlayer, por ejemplo, es el botón que abre el modal del mote.
const PokemonName = ({ pkm, as: Tag = 'span', className = '', ...rest }) => (
    <Tag className={`${className}${hasMote(pkm) ? ' pkm-mote' : ''}`}
         title={nameTitle(pkm)}
         {...rest}>
        {displayName(pkm)}
    </Tag>
);

export default PokemonName;
