# Pokelike (còpia local)

Joc roguelike de Pokémon descarregat de https://pokelike.xyz/ per jugar-hi i modificar-lo en local.

## Com jugar

Cal un servidor estàtic (no s'obre amb `file://` per restriccions del navegador):

```bash
python3 -m http.server 8000
```

Obre http://127.0.0.1:8000/ al navegador.

## Estructura

- `index.html` — punt d'entrada, tota la maquetació de pantalles
- `css/style.css` — estils
- `js/` — lògica del joc:
  - `data.js` — dades de Pokémon, moviments, items
  - `map.js` — generació del mapa / nodes
  - `battle.js` — sistema de combat
  - `endless.js` — mode Battle Tower
  - `ui.js` — interfície i pantalles
  - `game.js` — bucle i estat principal
  - `cloud-save.js` — desat al núvol (opcional, apunta a save.pokelike.xyz)
- `ui/`, `sprites/` — imatges locals (fons, botons, etc.)

## Notes

- Els sprites dels Pokémon i entrenadors es carreguen en temps d'execució des de
  CDNs externs (PokeAPI i Pokémon Showdown), així que cal connexió a internet.
- El desat de partida usa `localStorage` del navegador.
- `cloud-save.js` parla amb un servidor extern; el joc funciona sense ell.

## Modificar

Edita qualsevol fitxer de `js/` o `css/` i recarrega la pàgina (Cmd+Shift+R per
saltar la memòria cau). Per exemple, valors de combat a `js/battle.js` o dades de
Pokémon a `js/data.js`.
