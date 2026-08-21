// Los 6 colores de los tokens físicos, que son los mismos que usan los nodos de
// captura del tablero. El `id` es lo que guarda la columna TOKEN_COLOR de la DB,
// así que es lo que viaja en `?color=` a /random-pokemon.
// El rosa iba en #e91e63 y el rojo en #e74c3c: dos rojos anaranjados a la misma
// distancia del naranja, indistinguibles en los círculos del selector. Se
// separaron a lo largo del tono: el rosa se va al magenta y el rojo al rojo
// puro, más oscuro. El resto se quedó como estaba.
const TOKEN_COLORS = [
    { id: 'pink',   label: 'Rosa',     hex: '#ff4fa3' },
    { id: 'green',  label: 'Verde',    hex: '#27ae60' },
    { id: 'yellow', label: 'Amarillo', hex: '#f1c40f' },
    { id: 'blue',   label: 'Azul',     hex: '#3498db' },
    { id: 'red',    label: 'Rojo',     hex: '#d62828' },
    { id: 'purple', label: 'Morado',   hex: '#9b59b6' },
];

// Unos pocos Pokémon de la DB no tienen color asignado; para ellos no hay ni
// hex ni etiqueta y quien llame decide qué pintar.
export const tokenColorHex   = (id) => TOKEN_COLORS.find(c => c.id === id)?.hex   || null;
export const tokenColorLabel = (id) => TOKEN_COLORS.find(c => c.id === id)?.label || null;

export default TOKEN_COLORS;
export { TOKEN_COLORS };
