import { SIM_THEMES, DEFAULT_THEME, themeClass, getThemeMascot } from './simThemes';

// Estas pruebas existen por un fallo concreto: el arte se cargaba con
// `require(`../images/pokemon_anim/${id}.gif`)`, webpack armaba con eso un
// context module que salió vacío, el require lanzaba y el catch devolvía null
// sin que nada avisara. La mascota caía al render quieto y desde fuera solo se
// veía "el gif no se anima".
//
// Ahora el arte entra por imports estáticos, así que si un archivo falta el
// build falla. Estas comprobaciones cierran el resto del hueco: que la mascota
// declare las dos piezas y que no vuelvan a ser la misma.

describe.each(['gengar', 'rapidash', 'slowpoke', 'psyduck', 'togekiss'])('mascota de %s', (id) => {
    test('trae render quieto y sprite animado, y son distintos', () => {
        const m = getThemeMascot(id);

        expect(m).not.toBeNull();
        expect(m.still).toBeTruthy();
        expect(m.anim).toBeTruthy();
        // El fallo se veía justo así: anim resolviendo a lo mismo que still
        expect(m.anim).not.toBe(m.still);
        expect(String(m.anim)).toMatch(/\.gif$/);
        expect(String(m.still)).toMatch(/\.png$/);
        expect(m.label).toBeTruthy();
    });
});

test('cada mascota usa su propio arte, sin copiar el de otra', () => {
    const conMascota = SIM_THEMES.filter(t => t.mascot);
    expect(conMascota.length).toBeGreaterThan(1);

    // Copiar y pegar un bloque de tema y olvidar cambiar el import dejaría dos
    // temas con el mismo Pokémon, y en el selector no se notaría a simple vista
    const arte = conMascota.map(t => `${t.mascot.still}|${t.mascot.anim}`);
    expect(new Set(arte).size).toBe(arte.length);
});

test('Ultimix no tiene mascota: es el diseño original sin adornos', () => {
    expect(getThemeMascot('ultimix')).toBeNull();
});

test('un tema desconocido no revienta', () => {
    expect(getThemeMascot('missingno')).toBeNull();
    expect(getThemeMascot(undefined)).toBeNull();
});

test('el tema por defecto no lleva clase y el resto sí', () => {
    expect(themeClass(DEFAULT_THEME)).toBe('');
    expect(themeClass('gengar')).toBe('sim-player--gengar');
    expect(themeClass(undefined)).toBe('');
});

test('cada tema tiene id, nombre y cuatro colores de muestra', () => {
    for (const t of SIM_THEMES) {
        expect(t.id).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.swatch).toHaveLength(4);
    }
    // El id del tema es la clase CSS y la clave de localStorage: si se repite,
    // dos temas se pisarían
    const ids = SIM_THEMES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
});
