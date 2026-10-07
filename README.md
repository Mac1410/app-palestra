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

## Web app sull'iPhone (icona sulla schermata Home)

L'app è pubblicata come web app installabile:

**https://mac1410.github.io/app-palestra/**

Per metterla sulla schermata Home: aprire l'indirizzo **in Safari** (non in
Chrome né dentro un'altra app), toccare **Condividi** e poi **Aggiungi alla
schermata Home**. Da quel momento si apre a schermo intero con la sua icona, e
funziona anche senza rete: il service worker tiene in cache tutti i file.

I dati restano nella memoria del telefono e l'app installata ha un archivio
tutto suo, separato da quello di Safari: gli allenamenti registrati nella
scheda di Safari non si vedono nell'app installata. Conviene quindi aggiungerla
alla Home **prima** di cominciare a usarla sul serio, e di tanto in tanto
esportare un backup da Impostazioni.

### Pubblicare una nuova versione

```bash
npm run deploy:web
```

Costruisce la web app e aggiorna il ramo `gh-pages`, da cui GitHub Pages serve
il sito (un paio di minuti perché l'aggiornamento compaia). Sui telefoni che
l'hanno già installata la versione nuova arriva alla riapertura successiva.

Comandi collegati:

- `npm run build:web` — costruisce in `dist/` senza pubblicare
- `npm run serve:web` — serve `dist/` su `http://localhost:8088/app-palestra/`
  per provarla com'è online, service worker compreso

Dettagli tecnici della web app:

- `scripts/build-web.mjs` — esegue `expo export`, poi aggiunge manifest, icona,
  service worker (con l'elenco esatto dei file da tenere offline) e i file che
  servono a GitHub Pages (`.nojekyll`, `404.html`)
- `app.config.js` — imposta il percorso di base `/app-palestra` solo durante la
  build web, così lo sviluppo con Expo Go resta identico
- `src/components/ui/dialog.tsx` — le conferme dell'app; `Alert` di React Native
  sul web non esiste, quindi i dialoghi sono viste normali
- `src/lib/backup.ts` — esportazione e importazione del file di backup

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

**Impostazioni** — obiettivo settimanale, recupero predefinito, backup dei dati
(esportazione e reimportazione del file JSON) e cancellazione completa.

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
  lib/                    formattazione italiana, calcoli (volume, 1RM, streak), backup
  store/                  stato globale (reducer) e persistenza AsyncStorage
  types/                  modello dati
scripts/
  build-web.mjs           costruisce la web app installabile
  serve-dist.mjs          la prova in locale come se fosse online
  deploy-pages.mjs        la pubblica su GitHub Pages
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
