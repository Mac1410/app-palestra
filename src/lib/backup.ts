/**
 * Backup dei dati in un file JSON.
 *
 * Nella web app gli allenamenti vivono nella memoria del browser: se un giorno
 * cancelli i dati del sito o cambi telefono, senza un backup si perdono. Qui
 * stanno l'esportazione (condivisione o download del file) e la lettura di un
 * file salvato in precedenza.
 */

import { Platform, Share } from 'react-native';

import { DEFAULT_SETTINGS, type GymState } from '@/types';

const FORMAT = 'palestra-backup';
const FORMAT_VERSION = 1;

/** Parte dello stato che vale la pena conservare (la sessione in corso no). */
export type BackupData = Pick<
  GymState,
  'customExercises' | 'routines' | 'sessions' | 'settings' | 'profile' | 'program'
>;

type BackupFile = {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  data: BackupData;
};

export function buildBackup(state: GymState): string {
  const file: BackupFile = {
    format: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      profile: state.profile,
      program: state.program,
      customExercises: state.customExercises,
      routines: state.routines,
      sessions: state.sessions,
      settings: state.settings,
    },
  };
  return JSON.stringify(file, null, 2);
}

export function backupFileName(date = new Date()): string {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  return `palestra-${stamp}.json`;
}

export type ExportOutcome = 'shared' | 'downloaded' | 'copied' | 'failed';

/**
 * Consegna il backup all'utente con il mezzo migliore disponibile:
 * il foglio di condivisione dell'iPhone, altrimenti il download del file,
 * altrimenti il testo negli appunti.
 */
export async function exportBackup(json: string): Promise<ExportOutcome> {
  const name = backupFileName();

  if (Platform.OS !== 'web') {
    try {
      await Share.share({ title: name, message: json });
      return 'shared';
    } catch {
      return 'failed';
    }
  }

  const file = new File([json], name, { type: 'application/json' });

  // Su iPhone il foglio di condivisione è la via più affidabile: permette
  // "Salva su File", l'invio via mail o il salvataggio su iCloud Drive.
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (error) {
      // L'utente può aver chiuso il foglio: in quel caso non si insiste.
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
    }
  }

  try {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Il revoke immediato annullerebbe il download su alcuni browser.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return 'downloaded';
  } catch {
    /* si prova con gli appunti */
  }

  try {
    await navigator.clipboard.writeText(json);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Apre il selettore di file del sistema e restituisce il testo scelto. */
export function pickBackupFile(): Promise<string | null> {
  if (Platform.OS !== 'web') return Promise.resolve(null);

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        resolve(null);
        return;
      }
      file
        .text()
        .then(resolve)
        .catch(() => resolve(null));
    });

    // Se l'utente annulla, il campo non emette eventi: si libera comunque.
    input.addEventListener('cancel', () => {
      input.remove();
      resolve(null);
    });

    document.body.appendChild(input);
    input.click();
  });
}

export class BackupError extends Error {}

/** Legge un file di backup, con controlli espliciti per non importare spazzatura. */
export function parseBackup(text: string): BackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError('Il file non è leggibile: non sembra un backup di Palestra.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new BackupError('Il file non contiene dati di Palestra.');
  }

  const file = parsed as Partial<BackupFile>;
  if (file.format !== FORMAT) {
    throw new BackupError('Questo file è di un’altra app.');
  }
  if (typeof file.version !== 'number' || file.version > FORMAT_VERSION) {
    throw new BackupError(
      'Il backup è stato creato con una versione più recente dell’app: aggiornala prima di importarlo.',
    );
  }

  const data = file.data;
  if (
    !data ||
    !Array.isArray(data.routines) ||
    !Array.isArray(data.sessions) ||
    !Array.isArray(data.customExercises)
  ) {
    throw new BackupError('Il backup è incompleto e non può essere importato.');
  }

  return {
    // I backup creati prima del questionario non hanno profilo né programma.
    profile: data.profile ?? null,
    program: data.program ?? null,
    customExercises: data.customExercises,
    routines: data.routines,
    sessions: data.sessions,
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
  };
}

/** Riassunto da mostrare prima di sovrascrivere i dati esistenti. */
export function describeBackup(data: BackupData): string {
  const parts = [
    `${data.sessions.length} ${data.sessions.length === 1 ? 'allenamento' : 'allenamenti'}`,
    `${data.routines.length} ${data.routines.length === 1 ? 'scheda' : 'schede'}`,
  ];
  if (data.customExercises.length > 0) {
    parts.push(
      `${data.customExercises.length} ${
        data.customExercises.length === 1 ? 'esercizio personalizzato' : 'esercizi personalizzati'
      }`,
    );
  }
  return parts.join(', ');
}
