/**
 * Genera l'icona dell'app.
 *
 *   node scripts/genera-icona.mjs
 *
 * Disegna la direzione "Ember" — brace su nero, anello incandescente, bilanciere
 * al centro — e scrive assets/images/icon.png (1024) e favicon.png (196).
 *
 * Il disegno è fatto a mano, pixel per pixel, invece che con una libreria
 * grafica: l'immagine è di sole forme geometriche e così il progetto non si
 * porta dietro una dipendenza solo per fare un'icona. Il risultato si rigenera
 * identico a ogni esecuzione, quindi l'icona resta modificabile da qui.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = path.resolve(import.meta.dirname, '..');

// --- palette (la stessa di src/constants/theme.ts) -------------------------

const SFONDO = [11, 10, 10];
const BRACE_CALDA = [255, 92, 26];
const ANELLO = [
  [255, 181, 122],
  [255, 122, 50],
  [214, 40, 15],
];
const METALLO = [255, 255, 255];

// --- disegno ---------------------------------------------------------------

const mix = (sotto, sopra, alpha) => [
  sotto[0] + (sopra[0] - sotto[0]) * alpha,
  sotto[1] + (sopra[1] - sotto[1]) * alpha,
  sotto[2] + (sopra[2] - sotto[2]) * alpha,
];

/** Sfumatura fra i tre colori dell'anello, con t da 0 a 1. */
function coloreAnello(t) {
  const scala = Math.min(0.999, Math.max(0, t)) * (ANELLO.length - 1);
  const i = Math.floor(scala);
  return mix(ANELLO[i], ANELLO[i + 1], scala - i);
}

/** Quanto un punto sta dentro un rettangolo con angoli arrotondati (0 o 1). */
function dentroRettangolo(x, y, cx, cy, larghezza, altezza, raggio) {
  const dx = Math.abs(x - cx) - (larghezza / 2 - raggio);
  const dy = Math.abs(y - cy) - (altezza / 2 - raggio);
  if (dx <= 0 && dy <= 0) return true;
  if (dx > 0 && dy > 0) return dx * dx + dy * dy <= raggio * raggio;
  return dx <= raggio && dy <= raggio;
}

/**
 * Colore di un singolo punto dell'icona, in coordinate 0-1024.
 * Il campionamento multiplo (vedi sotto) smussa i bordi.
 */
function colorePunto(x, y) {
  const cx = 512;
  const cy = 512;

  // 1. Sfondo con il bagliore della brace, più intenso in alto.
  const dxGlow = x - 512;
  const dyGlow = y - 300;
  const distanzaGlow = Math.hypot(dxGlow, dyGlow * 1.15);
  const intensita = Math.exp(-(distanzaGlow * distanzaGlow) / (2 * 330 * 330));
  let colore = mix(SFONDO, BRACE_CALDA, intensita * 0.55);

  // 2. Anello incandescente, aperto in alto a destra.
  const distanza = Math.hypot(x - cx, y - cy);
  const spessore = 46;
  const raggio = 368;
  const scostamento = Math.abs(distanza - raggio);

  if (scostamento <= spessore / 2) {
    // Angolo in gradi, 0 a destra, in senso orario (y cresce verso il basso).
    let angolo = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
    if (angolo < 0) angolo += 360;

    // L'anello corre da 110° fino a 55° passando dal basso: l'apertura in alto
    // a destra è il respiro che tiene viva la forma.
    const percorso = (angolo - 110 + 360) % 360;
    const lunghezza = 305;

    if (percorso <= lunghezza) {
      const t = percorso / lunghezza;
      // Sfuma agli estremi, così l'anello non sembra tagliato di netto.
      const sfumatura = Math.min(1, Math.min(t, 1 - t) * 14);
      // Bordo morbido anche sullo spessore.
      const bordo = Math.min(1, (spessore / 2 - scostamento) / 2.5);
      colore = mix(colore, coloreAnello(t), sfumatura * bordo);
    }
  }

  // 3. Bilanciere: barra, dischi interni e dischi esterni.
  const barra = dentroRettangolo(x, y, cx, cy, 540, 30, 15);
  const discoInternoSx = dentroRettangolo(x, 0 + y, 362, cy, 62, 250, 24);
  const discoInternoDx = dentroRettangolo(x, y, 662, cy, 62, 250, 24);
  const discoEsternoSx = dentroRettangolo(x, y, 286, cy, 48, 160, 20);
  const discoEsternoDx = dentroRettangolo(x, y, 738, cy, 48, 160, 20);

  if (barra || discoInternoSx || discoInternoDx || discoEsternoSx || discoEsternoDx) {
    // Un filo di calore sul metallo, più acceso verso il basso.
    const calore = Math.min(0.22, Math.max(0, (y - 380) / 900));
    colore = mix(METALLO, BRACE_CALDA, calore);
  }

  return colore;
}

/** Disegna l'icona a una certa dimensione, con 3×3 campioni per pixel. */
function disegna(dimensione) {
  const campioni = 3;
  const pixel = Buffer.alloc(dimensione * dimensione * 3);
  const scala = 1024 / dimensione;

  for (let y = 0; y < dimensione; y++) {
    for (let x = 0; x < dimensione; x++) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let sy = 0; sy < campioni; sy++) {
        for (let sx = 0; sx < campioni; sx++) {
          const px = (x + (sx + 0.5) / campioni) * scala;
          const py = (y + (sy + 0.5) / campioni) * scala;
          const c = colorePunto(px, py);
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }

      const totale = campioni * campioni;
      const i = (y * dimensione + x) * 3;
      pixel[i] = Math.round(r / totale);
      pixel[i + 1] = Math.round(g / totale);
      pixel[i + 2] = Math.round(b / totale);
    }
  }

  return pixel;
}

// --- scrittura del PNG -----------------------------------------------------

const TABELLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = TABELLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function blocco(tipo, dati) {
  const lunghezza = Buffer.alloc(4);
  lunghezza.writeUInt32BE(dati.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dati]);
  const controllo = Buffer.alloc(4);
  controllo.writeUInt32BE(crc32(corpo));
  return Buffer.concat([lunghezza, corpo, controllo]);
}

function scrivePng(file, pixel, dimensione) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(dimensione, 0);
  ihdr.writeUInt32BE(dimensione, 4);
  ihdr[8] = 8; // bit per canale
  ihdr[9] = 2; // colore RGB senza trasparenza
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Ogni riga va preceduta dal byte del filtro (0 = nessuno).
  const righe = Buffer.alloc(dimensione * (dimensione * 3 + 1));
  for (let y = 0; y < dimensione; y++) {
    const inizio = y * (dimensione * 3 + 1);
    righe[inizio] = 0;
    pixel.copy(righe, inizio + 1, y * dimensione * 3, (y + 1) * dimensione * 3);
  }

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    blocco('IHDR', ihdr),
    blocco('IDAT', zlib.deflateSync(righe, { level: 9 })),
    blocco('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(file, png);
  return png.length;
}

for (const [file, dimensione] of [
  ['assets/images/icon.png', 1024],
  ['assets/images/favicon.png', 196],
]) {
  const destinazione = path.join(ROOT, file);
  const peso = scrivePng(destinazione, disegna(dimensione), dimensione);
  console.log(`✓ ${file} — ${dimensione}×${dimensione}, ${(peso / 1024).toFixed(0)} KB`);
}
