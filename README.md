# Bloch-gömb szimulátor

Interaktív, háromdimenziós Bloch-gömb szimulátor egykvantumbites kvantumállapotok és kvantumkapuk hatásának szemléltetésére.

A projekt a BME VIK *Kvantuminformatikai alkalmazások* tantárgy házi feladataként készült.

## Funkciók

- Legfeljebb 4 állapotvektor egyidejű megjelenítése
- Tetszőleges kezdőállapot megadása Bloch-szögekkel (θ, φ) vagy komplex amplitúdókkal (α, β)
- 12 kvantumkapu: X, Y, Z, H, S, S†, T, T†, P, Rx, Ry és Rz
- Közös és egyéni kvantumkapusorok, drag-and-drop szerkesztéssel
- Lépésenkénti és automatikus végrehajtás, animált állapotváltozásokkal és pályagörbékkel
- Állapotinformációk, mérési valószínűségek, Bloch-koordináták és kapumátrixok megjelenítése

## Technológiák

React, TypeScript, Three.js, React Three Fiber, React Three Drei és Vite.

## Fejlesztői futtatás

Szükséges: Node.js és pnpm.

```bash
git clone https://github.com/TEKI2004/bloch-simulator.git
cd bloch-simulator
pnpm install
pnpm dev
```

Az alkalmazás ezután a terminálban megjelenő helyi címen érhető el.

## Offline build

Az önálló, offline használható változat elkészítése:

```bash
pnpm build
```

A Vite a `vite-plugin-singlefile` segítségével a JavaScript- és CSS-kódot egyetlen HTML-fájlba építi.

A `dist` mappában található `index.html` Windows rendszeren, Chrome vagy Edge böngészővel, internetkapcsolat és fejlesztőkörnyezet nélkül megnyitható. A `dist` mappa további szükséges fájljait is meg kell őrizni.

## Dokumentáció

A projekt részletesebb működését, matematikai hátterét és megvalósítását a házi feladathoz készített dokumentáció ismerteti.
