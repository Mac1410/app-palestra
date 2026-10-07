# Palestra — app iPhone (React Native + Expo)

App per tracciare gli allenamenti in palestra: schede, log di serie e carichi,
timer di recupero e statistiche di progresso. Tutti i dati restano sul telefono
(nessun account, nessun server).

## Requisiti

- Node.js 20+ (qui è stato usato Node 24)
- Un iPhone con l'app **Expo Go** installata (App Store), oppure il simulatore iOS su Mac

## Avvio

```bash
npm install
```

```bash
npx expo start
```

Poi inquadra con la fotocamera dell'iPhone il QR code che compare nel terminale:
si apre Expo Go e l'app parte in hot reload. Il telefono deve essere sulla
stessa rete Wi-Fi del computer; in alternativa usa `npx expo start --tunnel`.

Altri comandi utili:

```bash
npm run typecheck
```

- `npm run ios` — apre direttamente il simulatore iOS (solo su macOS)
- `npm run web` — anteprima nel browser, comoda per uno sguardo veloce

## Cosa fa l'app

**Oggi** — il volume della settimana come numero protagonista dentro l'anello di
brace, con il confronto sulla settimana precedente; sotto, avanzamento verso
l'obiettivo con il calendario dei sette giorni, scheda consigliata (la meno
recente, così la rotazione push/pull/legs viene da sé), avvio di un allenamento
libero e ultimi allenamenti.

**Schede** — i tuoi programmi. Ogni scheda ha nome, note ed esercizi con serie,
ripetizioni obiettivo e recupero. Tocco lungo su una scheda per duplicarla o
eliminarla. Al primo avvio trovi quattro schede di esempio (Full body A, Push,
Pull, Legs) che puoi modificare o cancellare.

**Esercizi** — catalogo di 68 esercizi con ricerca e filtro per gruppo
muscolare, più i tuoi esercizi personalizzati. La scheda di dettaglio mostra
record di carico, 1RM stimato, andamento e storico completo.

**Progressi** — volume totale, giorni attivi, serie, istogramma del volume delle
ultime 8 settimane, ripartizione per gruppo muscolare degli ultimi 30 giorni e
storico di tutti gli allenamenti.

**Allenamento in corso** — cronometro, volume e serie in tempo reale; per ogni
esercizio una griglia kg × ripetizioni con spunta di completamento (tocca il
numero della serie per marcarla come riscaldamento, esclusa da volume e record).
Completando una serie parte il timer di recupero, con +30s e possibilità di
saltarlo. I carichi vengono precompilati con quelli dell'ultima volta.

## Direzione visiva

L'app segue la direzione **Ember**: brace su nero, un unico tema scuro per
scelta di identità (`userInterfaceStyle: "dark"`), numero del volume settimanale
come protagonista dentro un anello incandescente, tessere in gradiente arancione.

Il bagliore e l'anello sono disegnati in `src/components/ember-backdrop.tsx` con
`react-native-svg`: niente filtri di sfocatura, il diffuso nasce da archi
sovrapposti a opacità calanti — resa identica su iOS e Android e molto più
leggera da comporre.

Le sei direzioni valutate prima di scegliere stanno in
[`design/direzioni.html`](design/direzioni.html), apribile in un browser.

## Struttura del progetto

```
src/
  app/                    rotte (expo-router, file = schermata)
    (tabs)/               le quattro schermate principali
      index.tsx           Oggi
      schede.tsx
      esercizi.tsx
      progressi.tsx
    scheda/[id].tsx       editor scheda ("nuova" crea e reindirizza)
    esercizio/[id].tsx    dettaglio esercizio con storico
    storico/[id].tsx      dettaglio allenamento concluso
    sessione.tsx          allenamento in corso
    aggiungi-esercizi.tsx selezione multipla (scheda o sessione)
    nuovo-esercizio.tsx   creazione esercizio personalizzato
    impostazioni.tsx
  components/             UI riutilizzabile (Card, Button, Chip, grafici…)
  constants/theme.ts      palette Ember, spaziature, raggi
  data/exercises.ts       catalogo di base e schede di esempio
  hooks/                  tema e feedback aptico
  lib/                    formattazione italiana e calcoli (volume, 1RM, streak)
  store/                  stato globale (reducer) e persistenza AsyncStorage
  types/                  modello dati
```

## Note tecniche

- **Stato**: un solo reducer in `src/store/gym-store.tsx`, esposto con
  `useGym()`. La persistenza su AsyncStorage è in debounce di 400 ms perché
  durante l'allenamento lo stato cambia a ogni tasto.
- **1RM stimato**: formula di Epley (`peso × (1 + rip/30)`), affidabile fino a
  circa 12 ripetizioni.
- **Volume**: solo serie completate e non di riscaldamento.
- **Tema**: unico e scuro, indipendente dall'impostazione di sistema.
- **Icone**: Ionicons via `@expo/vector-icons`, quindi identiche su iOS,
  Android e web.

## Pubblicare l'app

Per un build installabile serve un account Expo e EAS:

```bash
npx eas-cli build --platform ios --profile preview
```

Per l'App Store servono anche un account Apple Developer e il bundle
identifier configurato in `app.json` (`com.palestra.app`).
