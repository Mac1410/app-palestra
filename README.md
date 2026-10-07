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

**Questionario** — al primo avvio l'app non mostra schede d'esempio: chiede
obiettivo, esperienza, giorni e minuti a disposizione, dove ci si allena e con
quale attrezzatura, zone del corpo da trattare con cura, priorità e cardio. Da
quelle risposte nasce il programma. Si rifà quando si vuole da Impostazioni.

**Programma** — le schede costruite su misura, con la spiegazione delle scelte:
quale suddivisione (full body, upper/lower, push-pull-legs, circuito a corpo
libero) e perché, come sono stati scelti serie, ripetizioni e recuperi, cosa è
stato escluso per via delle limitazioni dichiarate. Le schede restano
modificabili come tutte le altre.

**Oggi** — il volume della settimana come numero protagonista dentro l'anello di
brace, con il confronto sulla settimana precedente; sotto, avanzamento verso
l'obiettivo con il calendario dei sette giorni, scheda consigliata (la meno
recente, così la rotazione push/pull/legs viene da sé), avvio di un allenamento
libero e ultimi allenamenti.

**Schede** — i tuoi programmi. Ogni scheda ha nome, note ed esercizi con serie,
ripetizioni obiettivo e recupero. Tocco lungo su una scheda per duplicarla o
eliminarla. Al primo avvio trovi quattro schede di esempio (Full body A, Push,
Pull, Legs) che puoi modificare o cancellare.

**Esercizi** — catalogo di 106 esercizi con ricerca e filtro per gruppo
muscolare, più i tuoi esercizi personalizzati. La scheda di dettaglio mostra
record di carico, 1RM stimato, andamento e storico completo.

**Progressi** — volume totale, giorni attivi, serie, istogramma del volume delle
ultime 8 settimane, ripartizione per gruppo muscolare degli ultimi 30 giorni e
storico di tutti gli allenamenti.

**Impostazioni** — obiettivo settimanale, recupero predefinito, backup dei dati
(esportazione e reimportazione del file JSON) e cancellazione completa.

**Allenamento in corso** — cronometro, volume e serie in tempo reale; per ogni
esercizio una griglia kg × ripetizioni con l'obiettivo della singola serie
accanto, verde se l'hai raggiunto e rosso se sei rimasto sotto (tocca il numero
della serie per marcarla come riscaldamento, esclusa da volume e record).
Completando una serie parte il timer di recupero, con +30s e possibilità di
saltarlo. Carichi e obiettivi non sono una copia dell'ultima volta: li decide la
progressione, che scrive anche perché.

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
    questionario.tsx      domande iniziali, una per schermata
    programma.tsx         il programma generato e le sue motivazioni
    impostazioni.tsx
  components/             UI riutilizzabile (Card, Button, Chip, grafici…)
  constants/theme.ts      palette Ember, spaziature, raggi
  data/exercises.ts       catalogo di base e schede di esempio
  hooks/                  tema e feedback aptico
  lib/                    formattazione italiana, calcoli (volume, 1RM, streak),
                          backup, generatore del programma (plan.ts) e
                          progressione dei carichi (progression.ts)
  store/                  stato globale (reducer) e persistenza AsyncStorage
  types/                  modello dati
scripts/
  build-web.mjs           costruisce la web app installabile
  serve-dist.mjs          la prova in locale come se fosse online
  deploy-pages.mjs        la pubblica su GitHub Pages
  prova-programmi.mjs     genera i programmi di diciannove profili e li controlla
  prova-progressione.mjs  verifica le decisioni su carichi e varianti
```

## Come nasce il programma

`src/lib/plan.ts` costruisce le schede dalle risposte del questionario. Il
criterio è che una seduta equilibrata nasce dagli *schemi di movimento*
(spingere, tirare, accosciare, piegare l'anca, core), non dai muscoli presi uno
per uno: ogni esercizio del catalogo porta con sé schema, ruolo (fondamentale,
complementare, isolamento), zone che sollecita e attrezzi richiesti.

Le decisioni, in ordine:

1. **Cosa è possibile** — a casa restano solo gli esercizi fattibili con
   l'attrezzatura dichiarata; le zone delicate escludono gli esercizi che le
   caricano, e il generatore ripiega su alternative dello stesso schema.
2. **La suddivisione** — decisa dall'incrocio fra disponibilità e obiettivo.
   L'aritmetica dice che tante sedute brevi vanno divise e poche sedute lunghe
   no; l'obiettivo però pesa quanto quella. Per la **massa** servono carichi
   alti, recuperi pieni e più esercizi sullo stesso gruppo, che in un full body
   di quarantacinque minuti non ci stanno: il programma divide sempre, fino
   alla divisione per gruppo muscolare (petto, dorso, gambe, spalle, braccia)
   quando le sedute sono corte e frequenti. La **forza** fa il contrario, pochi
   movimenti ripetuti spesso, quindi full body finché i giorni lo consentono.
   Restano upper/lower, push-pull-legs e il circuito a corpo libero.
3. **Il tempo** — ogni seduta viene stimata in minuti e fatta rientrare nella
   durata dichiarata. Le rinunce seguono un ordine: prima i complementi, poi le
   serie, poi i recuperi (mai sotto una soglia, o l'allenamento cambia natura),
   e solo alla fine un esercizio. Sotto i tre esercizi non si scende. Se invece
   avanza tempo, la seduta viene completata con lavoro coerente col suo tema.
4. **L'obiettivo** — decide serie, ripetizioni e recuperi, e il cardio si
   prenota il suo tempo prima che se lo mangino i pesi.

I carichi di partenza sono proposti in frazioni del peso corporeo, prudenti e
pensati per essere corretti subito.

Per verificare il generatore dopo una modifica:

```bash
npm run check:plan
```

Stampa le schede di diciannove profili diversi e fallisce se una seduta sfora il
tempo, ripete un esercizio, ne usa uno vietato dalle limitazioni o richiede un
attrezzo che a casa non c'è.

## Come cresce il carico

`src/lib/progression.ts` decide che carico e quante ripetizioni proporre oggi,
guardando **solo le ultime tre settimane**: com'eri tre mesi fa non dice più
niente su che carico reggi adesso.

Il metodo è la doppia progressione. Si resta sullo stesso peso finché non si
chiudono *tutte* le serie in cima all'intervallo di ripetizioni; allora si
aggiunge un gradino di carico (2,5 kg di bilanciere, 1-2 kg di manubrio, 5 kg di
macchina) e si riparte dal fondo dell'intervallo. Se invece l'obiettivo non
viene raggiunto, prima si abbassa l'obiettivo di ripetizioni; se succede due
volte di fila, si toglie il 10% di carico, perché insistere su un peso che non
si muove non allena, logora.

A corpo libero i chili non si possono aggiungere, quindi **il carico si cambia
cambiando esercizio**: gli esercizi appartengono a scale di difficoltà
(piegamenti sulle ginocchia → mani rialzate → a terra → a diamante → ad
arciere; trazioni orizzontali → trazioni; squat a corpo libero → affondi →
bulgaro → su una gamba). Superato l'intervallo si sale di un gradino, restando
troppo sotto si scende. L'ultima serie di questi esercizi è a cedimento: è
l'unico modo di misurare se si è diventati più forti quando il peso non cambia.

Ogni scelta viene scritta in italiano sotto il nome dell'esercizio, tipo *"Hai
chiuso tutte le serie a 8 ripetizioni: si sale a 42,5 kg e si riparte da 6"*.

```bash
npm run check:progressione
```

Verifica dodici situazioni: prima volta, obiettivo raggiunto, obiettivo
mancato una volta e due volte di fila, gradini diversi per manubri e bilancieri,
storico scaduto, salita e discesa di variante a corpo libero, esercizi a tempo.

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
