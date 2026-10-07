/**
 * Mappa muscolare: corpo visto davanti e di dietro, con i muscoli coinvolti
 * nell'esercizio accesi e tutti gli altri in grigio.
 *
 * Disegnata a mano in SVG: nessuna immagine di terzi finisce nell'app, il peso
 * è di pochi kilobyte, resta nitida a ogni dimensione e funziona senza rete.
 * La logica di lettura è quella delle tavole anatomiche — tutto il corpo è
 * reso a muscoli, il bersaglio è l'unico acceso.
 *
 * Il corpo sta in una tela 120×300 con l'asse di simmetria a x=60: ogni
 * muscolo del lato destro è il riflesso del sinistro, calcolato da `mirror`.
 */

import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import type { MuscleGroup } from '@/types';

/** Grigi del corpo a riposo e verde del muscolo che lavora. */
const SKIN = '#3F4D45';
const MUSCLE_OFF = '#586B5F';
const MUSCLE_OFF_DEEP = '#4A5B51';
const EDGE = '#232C27';

const PRIMARY = Colors.accent;
const SECONDARY = '#4C8C63';

type Props = {
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  height?: number;
};

/** `null` significa "non è un muscolo": testa, mani, piedi, articolazioni. */
type Region = { muscle: MuscleGroup | null; d: string; deep?: boolean };

function mirror(d: string): string {
  let index = -1;
  return d.replace(/-?\d+(\.\d+)?/g, (value) => {
    index += 1;
    // Le coordinate si alternano x, y: si specchia solo la x.
    return index % 2 === 0 ? String(Number((120 - Number(value)).toFixed(1))) : value;
  });
}

// ---------------------------------------------------------------------------
// Vista frontale — metà sinistra, il resto è speculare
// ---------------------------------------------------------------------------

const FRONT_LEFT: Region[] = [
  // collo
  { muscle: 'Collo', d: 'M54 31 C53 38 51 42 47 45 L58 45 L58 31 Z' },
  // trapezio che scende verso la spalla
  { muscle: 'Collo', d: 'M47 45 C42 47 37 50 33 55 L58 50 L58 45 Z' },
  // deltoide anteriore
  { muscle: 'Spalle', d: 'M34 54 C27 58 23 68 23 80 C30 82 36 76 38 67 C40 60 38 55 34 54 Z' },
  // grande pettorale
  { muscle: 'Petto', d: 'M58 53 C50 53 43 56 39 62 C36 67 36 74 39 80 C44 86 51 88 58 88 Z' },
  // bicipite brachiale
  { muscle: 'Bicipiti', d: 'M22 84 C19 93 18 103 19 113 C25 115 30 109 31 100 C32 92 30 86 27 84 Z' },
  // avambraccio
  { muscle: null, d: 'M19 116 C17 126 17 138 18 148 C22 150 26 146 27 137 C28 128 27 120 26 116 Z' },
  // mano
  { muscle: null, d: 'M18 151 C16 158 16 166 19 170 C23 172 26 168 26 160 C26 155 25 152 24 151 Z' },
  // dentato anteriore, sotto il pettorale
  { muscle: null, d: 'M40 86 C38 94 38 102 40 110 L46 106 C44 98 44 92 46 86 Z', deep: true },
  // obliquo
  { muscle: 'Addome', d: 'M44 92 C41 104 41 118 44 132 L49 128 C47 116 47 104 49 92 Z' },
  // retto addominale, tre coppie di ventri
  { muscle: 'Addome', d: 'M49 91 C53 91 56 92 58 93 L58 105 L49 105 C48 100 48 95 49 91 Z' },
  { muscle: 'Addome', d: 'M49 108 L58 108 L58 120 L49 120 C48 116 48 112 49 108 Z' },
  { muscle: 'Addome', d: 'M49 123 L58 123 L58 141 C54 140 51 137 49 133 C48 130 48 126 49 123 Z' },
  // inguine
  { muscle: null, d: 'M44 136 C47 146 52 152 58 154 L58 142 C53 141 49 139 46 135 Z', deep: true },
  // tensore della fascia lata
  { muscle: 'Gambe', d: 'M38 150 C34 160 33 172 35 182 L42 178 C41 168 42 158 44 150 Z' },
  // vasto laterale
  { muscle: 'Gambe', d: 'M36 184 C34 198 34 212 36 224 L45 224 C44 210 44 196 45 184 Z' },
  // retto femorale e vasto mediale
  { muscle: 'Gambe', d: 'M47 152 C45 172 45 196 47 226 L57 226 C57 196 57 172 57 152 Z' },
  // ginocchio
  { muscle: null, d: 'M38 228 C37 234 38 240 41 243 L56 243 L56 228 Z' },
  // tibiale anteriore
  { muscle: 'Polpacci', d: 'M44 246 C42 256 42 266 43 274 L50 274 C50 264 51 254 53 246 Z' },
  // gemello che si vede di lato
  { muscle: 'Polpacci', d: 'M40 246 C38 254 38 262 39 268 L43 268 C43 260 43 252 44 246 Z', deep: true },
  // piede
  { muscle: null, d: 'M42 277 C40 283 40 289 44 290 L54 290 C56 288 56 282 54 277 Z' },
];

// ---------------------------------------------------------------------------
// Vista posteriore
// ---------------------------------------------------------------------------

const BACK_LEFT: Region[] = [
  // trapezio: dal collo alla spalla e giù fra le scapole
  { muscle: 'Collo', d: 'M58 30 L58 92 L44 58 C47 44 52 34 58 30 Z' },
  // deltoide posteriore
  { muscle: 'Spalle', d: 'M33 55 C26 59 22 70 22 82 C29 84 36 78 39 68 C41 61 38 56 33 55 Z' },
  // scapola
  { muscle: null, d: 'M40 58 C36 66 35 76 37 84 L50 78 C48 70 48 62 50 56 Z', deep: true },
  // gran dorsale
  { muscle: 'Dorso', d: 'M37 86 C33 98 33 112 37 124 L54 114 C52 104 53 94 57 86 Z' },
  // erettori della colonna
  { muscle: 'Dorso', d: 'M52 94 C50 110 50 126 52 140 L58 140 L58 92 Z' },
  // tricipite
  { muscle: 'Tricipiti', d: 'M22 82 C19 92 18 102 19 113 C25 115 30 109 31 100 C32 92 30 85 27 82 Z' },
  // avambraccio
  { muscle: null, d: 'M19 116 C17 126 17 138 18 148 C22 150 26 146 27 137 C28 128 27 120 26 116 Z' },
  // mano
  { muscle: null, d: 'M18 151 C16 158 16 166 19 170 C23 172 26 168 26 160 C26 155 25 152 24 151 Z' },
  // grande gluteo
  { muscle: 'Glutei', d: 'M38 146 C32 157 33 172 42 178 C51 183 58 176 58 164 L58 144 Z' },
  // bicipite femorale
  { muscle: 'Gambe', d: 'M37 184 C35 198 35 212 37 226 L46 226 C45 212 45 198 46 184 Z' },
  // semitendinoso e semimembranoso
  { muscle: 'Gambe', d: 'M48 182 C47 198 47 212 48 226 L57 226 C57 212 57 198 57 182 Z' },
  // cavo popliteo
  { muscle: null, d: 'M39 228 C38 234 39 240 42 243 L56 243 L56 228 Z' },
  // gemello laterale e mediale
  { muscle: 'Polpacci', d: 'M40 246 C38 256 38 266 40 272 L48 272 C47 262 47 252 48 246 Z' },
  { muscle: 'Polpacci', d: 'M50 246 C50 256 50 264 50 270 L57 270 C57 260 56 252 55 246 Z' },
  // tendine d'Achille e piede
  { muscle: null, d: 'M44 274 C42 282 42 288 45 290 L55 290 C57 288 57 282 55 274 Z' },
];

function expand(regions: Region[]): Region[] {
  return [...regions, ...regions.map((region) => ({ ...region, d: mirror(region.d) }))];
}

const FRONT = expand(FRONT_LEFT);
const BACK = expand(BACK_LEFT);

/** Testa e tronco di fondo: evitano che fra un muscolo e l'altro si veda il vuoto. */
const BASE = [
  'M60 44 C71 44 79 48 84 56 L89 76 C92 90 92 104 90 118 L87 136 C85 148 83 158 82 168 L38 168 C37 158 35 148 33 136 L30 118 C28 104 28 90 31 76 L36 56 C41 48 49 44 60 44 Z',
  'M34 54 C27 58 23 70 22 84 L19 112 C18 124 17 136 18 150 L27 150 C28 136 30 124 32 112 L41 80 Z',
  'M38 166 L58 166 L57 214 C57 228 56 238 54 248 L52 278 L41 278 L40 248 C39 238 38 228 38 214 Z',
];

const BASE_FULL = [...BASE, mirror(BASE[1]), mirror(BASE[2])];

function Body({
  regions,
  primary,
  secondary,
  height,
}: {
  regions: Region[];
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  height: number;
}) {
  const colorFor = (region: Region) => {
    if (region.muscle === null) return region.deep ? MUSCLE_OFF_DEEP : SKIN;
    if (region.muscle === primary) return PRIMARY;
    if (secondary.includes(region.muscle)) return SECONDARY;
    return region.deep ? MUSCLE_OFF_DEEP : MUSCLE_OFF;
  };

  return (
    <Svg width={(height * 120) / 300} height={height} viewBox="0 0 120 300">
      {/* testa e collo */}
      <Ellipse cx={60} cy={18} rx={11} ry={14} fill={SKIN} stroke={EDGE} strokeWidth={1} />
      <Path d="M52 28 L68 28 L68 46 L52 46 Z" fill={SKIN} />

      <G>
        {BASE_FULL.map((d, index) => (
          <Path key={index} d={d} fill={SKIN} stroke={EDGE} strokeWidth={1} />
        ))}
      </G>

      <G>
        {regions.map((region, index) => (
          <Path
            key={index}
            d={region.d}
            fill={colorFor(region)}
            stroke={EDGE}
            strokeWidth={0.6}
            strokeLinejoin="round"
          />
        ))}
      </G>
    </Svg>
  );
}

export function MuscleMap({ primary, secondary = [], height = 250 }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        <Body regions={FRONT} primary={primary} secondary={secondary} height={height} />
        <ThemedText type="caption" themeColor="textMuted">
          davanti
        </ThemedText>
      </View>
      <View style={styles.side}>
        <Body regions={BACK} primary={primary} secondary={secondary} height={height} />
        <ThemedText type="caption" themeColor="textMuted">
          dietro
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.three },
  side: { alignItems: 'center', gap: Spacing.one },
});
