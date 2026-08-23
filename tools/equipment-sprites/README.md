# Recorte de los objetos de las cartas Equipment

Saca el objeto de cada carta `Attach Card` y lo deja en PNG con fondo
transparente, que es lo que se dibuja pegado al Pokémon y en el catálogo
(`frontend/src/data/equipment.js`).

```sh
node tools/equipment-sprites/extract.js \
  "frontend/src/images/Equipment " \
  frontend/src/images/Equipment_items
```

El primer argumento es la carpeta de cartas (762x1068; ojo al espacio final del
nombre, así llegó) y el segundo dónde dejar los sprites. Escribe además un
`_fondo.png` con el fondo que ha reconstruido: si algún recorte sale raro, esa
imagen es lo primero que hay que mirar.

No necesita instalar nada — lee y escribe PNG con `zlib`, que ya viene en Node.

## Por qué funciona

Las cartas comparten exactamente la misma foto de escena detrás del objeto,
píxel a píxel. El script reconstruye ese fondo común por votación —para cada
píxel, el valor que más se repite entre todas las cartas— y lo resta: lo que no
coincide es el objeto. Por eso hacen falta **todas las cartas a la vez** y no se
puede recortar una suelta: con pocas cartas la votación no distingue el fondo
del dibujo.

Si un día llegan cartas nuevas con OTRA foto de fondo, hay que pasarlas en una
tanda aparte de las viejas, no mezcladas.

Los umbrales de arriba del fichero están puestos para cartas PNG sin pérdida,
donde el fondo repetido es idéntico bit a bit. Si las cartas llegan en JPG habrá
que subir `DIFF_LO` y `DIFF_HI`, porque la compresión mete ruido en el fondo.
