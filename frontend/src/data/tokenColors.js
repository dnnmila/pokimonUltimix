// Los 6 colores de los tokens físicos, que son los mismos que usan los nodos de
// captura del tablero. El `id` es lo que guarda la columna TOKEN_COLOR de la DB,
// así que es lo que viaja en `?color=` a /random-pokemon.
const TOKEN_COLORS = [
    { id: 'pink',   label: 'Rosa',     hex: '#e91e63' },
    { id: 'green',  label: 'Verde',    hex: '#27ae60' },
    { id: 'yellow', label: 'Amarillo', hex: '#f1c40f' },
    { id: 'blue',   label: 'Azul',     hex: '#3498db' },
    { id: 'red',    label: 'Rojo',     hex: '#e74c3c' },
    { id: 'purple', label: 'Morado',   hex: '#9b59b6' },
];

// Unos pocos Pokémon de la DB no tienen color asignado; para ellos no hay ni
// hex ni etiqueta y quien llame decide qué pintar.
export const tokenColorHex   = (id) => TOKEN_COLORS.find(c => c.id === id)?.hex   || null;
export const tokenColorLabel = (id) => TOKEN_COLORS.find(c => c.id === id)?.label || null;

export default TOKEN_COLORS;
export { TOKEN_COLORS };
