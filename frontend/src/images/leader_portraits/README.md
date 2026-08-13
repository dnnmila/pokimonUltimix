# Retratos de líderes

Ilustración suelta de cada líder (solo el personaje, sin el marco de la carta).
Mientras un retrato no exista, `SimPlayer` cae automáticamente al token de carta
de `images/Leaders<numero>/` — el que ya trae al líder junto a su Pokémon.

## Una carpeta por generación

```
leader_portraits/gen1/    ← Kanto
leader_portraits/gen2/    ← Johto
leader_portraits/gen3/    ← Hoenn
leader_portraits/gen4/    ← Sinnoh
```

Hace falta separarlas porque el identificador del gimnasio se repite en todas:
`gym1_1` es Brock en la generación 1 y Falkner en la 2.

## Cómo nombrar el archivo

Se aceptan **dos nomenclaturas**, la que resulte más cómoda. Se prueba primero
el nombre del líder.

### 1. Por nombre del líder (recomendada)

En minúsculas, sin espacios, sin acentos y sin signos:

| Líder          | Archivo            |
|----------------|--------------------|
| Brock          | `brock.png`        |
| Misty          | `misty.png`        |
| Surge          | `surge.png`        |
| Tate & Liza    | `tateliza.png`     |
| Crasher Wake   | `crasherwake.png`  |

Los nombres no se repiten dentro de una misma generación, así que no hay choques.

Ojo con los que la base de datos guarda distinto de como suenan: el tercer
gimnasio de Kanto es **`Surge`**, no "Lt. Surge".

### 2. Por posición del gimnasio

`gym1.png` … `gym8.png`, según el orden en que aparecen (el mismo orden que las
medallas). Es el `POKEDEX` sin el sufijo `_1` / `_2` — ese sufijo indica cuál de
los dos Pokémon del líder es, y no aplica a un retrato.

## Nombres actuales

**Generación 1** — brock, misty, surge, erika, koga, sabrina, blaine, giovanni
**Generación 2** — falkner, bugsy, whitney, morty, chuck, jasmine, pryce, clair
**Generación 3** — roxanne, brawly, wattson, flannery, norman, winona, tateliza, wallace
**Generación 4** — roark, gardenia, maylene, crasherwake, fantina, byron, candice, volkner

Si cambias un `RIVAL_NAME` en la base de datos, renombra también su retrato.

## Formato

- `.png`, `.webp` o `.jpg` — los tres funcionan, no hace falta convertir nada.
- Preferible PNG con fondo transparente.
- Vertical, alrededor de 400×520 px. La tarjeta recorta con `object-fit: cover`
  anclado arriba, así que deja la cara en el tercio superior.

No hace falta tocar código: en cuanto el archivo está en su carpeta, la tarjeta
lo usa. Eso sí, hay que reconstruir el frontend (`npm run build` dentro de
`frontend/`) porque el backend sirve `frontend/build`.
