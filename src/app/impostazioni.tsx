import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDialog } from '@/components/ui/dialog';
import { Divider, SectionHeader } from '@/components/ui/feedback';
import { Stepper, Toggle } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import {
  BackupError,
  buildBackup,
  describeBackup,
  exportBackup,
  parseBackup,
  pickBackupFile,
} from '@/lib/backup';
import { formatVolume } from '@/lib/format';
import { sessionVolume } from '@/lib/stats';
import { useGym } from '@/store/gym-store';
import { GOAL_LABELS, SPLIT_LABELS } from '@/types';

export default function SettingsScreen() {
  const { state, actions } = useGym();
  const dialog = useDialog();
  const { settings, sessions, routines, customExercises, profile, program } = state;
  const [busy, setBusy] = useState(false);

  const confirmReset = async () => {
    const ok = await dialog.confirm({
      title: 'Cancellare tutti i dati?',
      message:
        'Schede, allenamenti ed esercizi personalizzati verranno eliminati da questo dispositivo. Se non hai un backup, non si possono recuperare.',
      confirmLabel: 'Cancella tutto',
      destructive: true,
    });
    if (ok) await actions.resetAllData();
  };

  const runExport = async () => {
    setBusy(true);
    try {
      const outcome = await exportBackup(buildBackup(state));
      const messages = {
        shared: 'Scegli dove salvarlo: "Salva su File" lo mette nei tuoi documenti.',
        downloaded: 'Il file è stato scaricato tra i download del browser.',
        copied: 'Il file non si è potuto salvare, quindi il backup è stato copiato negli appunti: incollalo in una nota e conservalo.',
        failed: 'Non è stato possibile esportare i dati su questo dispositivo.',
      } as const;
      await dialog.notify({
        title: outcome === 'failed' ? 'Esportazione non riuscita' : 'Backup pronto',
        message: messages[outcome],
      });
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    const text = await pickBackupFile();
    if (text === null) return;

    setBusy(true);
    try {
      const data = parseBackup(text);
      const ok = await dialog.confirm({
        title: 'Sostituire i dati con il backup?',
        message: `Il backup contiene ${describeBackup(data)}. I dati attuali su questo dispositivo verranno sostituiti.`,
        confirmLabel: 'Importa',
        destructive: true,
      });
      if (!ok) return;
      actions.importData(data);
      await dialog.notify({
        title: 'Backup importato',
        message: 'I tuoi allenamenti sono tornati al loro posto.',
      });
    } catch (error) {
      await dialog.notify({
        title: 'Backup non valido',
        message:
          error instanceof BackupError
            ? error.message
            : 'Il file non è stato riconosciuto come backup di Palestra.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <SectionHeader title="Il tuo programma" />
      <Card>
        {profile ? (
          <>
            <View style={styles.statRow}>
              <ThemedText type="small">Obiettivo</ThemedText>
              <ThemedText type="smallBold">{GOAL_LABELS[profile.goal].title}</ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText type="small">Suddivisione</ThemedText>
              <ThemedText type="smallBold">
                {program ? SPLIT_LABELS[program.split] : '—'}
              </ThemedText>
            </View>
            <View style={styles.statRow}>
              <ThemedText type="small">Disponibilità</ThemedText>
              <ThemedText type="smallBold">
                {profile.daysPerWeek}× {profile.sessionMinutes} min
              </ThemedText>
            </View>
            <Button
              label="Vedi il programma"
              icon="sparkles-outline"
              variant="secondary"
              full
              style={styles.secondAction}
              onPress={() => router.push('/programma')}
            />
            <Button
              label="Rifai il questionario"
              variant="ghost"
              full
              onPress={() => router.push('/questionario')}
            />
          </>
        ) : (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Non hai ancora un programma: rispondi a qualche domanda e lo costruisco io.
            </ThemedText>
            <Button
              label="Compila il questionario"
              icon="sparkles"
              full
              style={styles.secondAction}
              onPress={() => router.push('/questionario')}
            />
          </>
        )}
      </Card>

      <SectionHeader title="Allenamento" />
      <Card>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <ThemedText type="bodyBold">Obiettivo settimanale</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Allenamenti da completare ogni settimana
            </ThemedText>
          </View>
          <Stepper
            value={settings.weeklyGoal}
            min={1}
            max={14}
            onChange={(value) => actions.updateSettings({ weeklyGoal: value })}
          />
        </View>

        <Divider />

        <View style={styles.row}>
          <View style={styles.rowText}>
            <ThemedText type="bodyBold">Recupero predefinito</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Usato per i nuovi esercizi
            </ThemedText>
          </View>
          <Stepper
            value={settings.defaultRestSec}
            step={15}
            min={15}
            max={600}
            format={(value) => `${value}s`}
            onChange={(value) => actions.updateSettings({ defaultRestSec: value })}
          />
        </View>

        <Divider />

        <Toggle
          label="Timer automatico"
          description="Avvia il recupero quando completi una serie"
          value={settings.autoRest}
          onChange={(value) => actions.updateSettings({ autoRest: value })}
        />

        <Toggle
          label="Stretching finale"
          description="Aggiunge in coda 5 minuti di allungamento: i muscoli allenati più collo e spalle, contro la postura curva"
          value={settings.stretching}
          onChange={(value) => actions.updateSettings({ stretching: value })}
        />

        {Platform.OS !== 'web' ? (
          <Toggle
            label="Vibrazione"
            description="Feedback aptico su serie e timer"
            value={settings.haptics}
            onChange={(value) => actions.updateSettings({ haptics: value })}
          />
        ) : null}
      </Card>

      <SectionHeader title="I tuoi dati" subtitle="Tutto resta salvato su questo dispositivo" />
      <Card>
        <View style={styles.statRow}>
          <ThemedText type="small">Allenamenti</ThemedText>
          <ThemedText type="smallBold">{sessions.length}</ThemedText>
        </View>
        <View style={styles.statRow}>
          <ThemedText type="small">Schede</ThemedText>
          <ThemedText type="smallBold">{routines.length}</ThemedText>
        </View>
        <View style={styles.statRow}>
          <ThemedText type="small">Esercizi personalizzati</ThemedText>
          <ThemedText type="smallBold">{customExercises.length}</ThemedText>
        </View>
        <View style={styles.statRow}>
          <ThemedText type="small">Volume complessivo</ThemedText>
          <ThemedText type="smallBold">
            {formatVolume(sessions.reduce((sum, s) => sum + sessionVolume(s), 0))}
          </ThemedText>
        </View>
      </Card>

      <SectionHeader
        title="Backup"
        subtitle="Un file con schede, allenamenti e impostazioni, da conservare o portare su un altro telefono"
      />
      <Card>
        <Button
          label="Esporta backup"
          icon="download-outline"
          variant="secondary"
          full
          disabled={busy}
          onPress={() => void runExport()}
        />
        {Platform.OS === 'web' ? (
          <Button
            label="Importa backup"
            icon="document-attach-outline"
            variant="secondary"
            full
            disabled={busy}
            onPress={() => void runImport()}
            style={styles.secondAction}
          />
        ) : null}
        <ThemedText type="caption" themeColor="textMuted" style={styles.hint}>
          Conviene esportare ogni tanto: i dati vivono solo in questo dispositivo e nessuno li
          conserva al posto tuo.
        </ThemedText>
      </Card>

      <Button
        label="Cancella tutti i dati"
        variant="danger"
        full
        onPress={() => void confirmReset()}
      />

      <ThemedText type="caption" themeColor="textMuted" style={styles.footer}>
        Palestra · versione 1.0.0
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  rowText: { flex: 1, gap: 2 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  secondAction: { marginTop: Spacing.two },
  hint: { marginTop: Spacing.one },
  footer: { textAlign: 'center', marginTop: Spacing.two },
});
