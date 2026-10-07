import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useDialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/input';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGym } from '@/store/gym-store';
import { EQUIPMENT, MUSCLE_GROUPS, type Equipment, type MuscleGroup } from '@/types';

export default function NewExerciseScreen() {
  const theme = useTheme();
  const dialog = useDialog();
  const { actions } = useGym();
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>('Petto');
  const [equipment, setEquipment] = useState<Equipment>('Bilanciere');
  const [notes, setNotes] = useState('');

  const save = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      void dialog.notify({
        title: 'Nome mancante',
        message: 'Dai un nome all’esercizio per salvarlo.',
      });
      return;
    }
    const exercise = actions.addExercise({
      name: trimmed,
      muscle,
      equipment,
      notes: notes.trim() || undefined,
    });
    router.replace({ pathname: '/esercizio/[id]', params: { id: exercise.id } });
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Es. Panca inclinata con manubri"
          autoFocus
        />

        <View style={styles.group}>
          <ThemedText type="captionBold" themeColor="textMuted">
            GRUPPO MUSCOLARE
          </ThemedText>
          <View style={styles.chips}>
            {MUSCLE_GROUPS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={muscle === option}
                onPress={() => setMuscle(option)}
              />
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <ThemedText type="captionBold" themeColor="textMuted">
            ATTREZZATURA
          </ThemedText>
          <View style={styles.chips}>
            {EQUIPMENT.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={equipment === option}
                onPress={() => setEquipment(option)}
              />
            ))}
          </View>
        </View>

        <Field
          label="Note"
          value={notes}
          onChangeText={setNotes}
          placeholder="Setup, altezza sedile, presa…"
          multiline
          style={styles.notes}
        />

        <Button label="Salva esercizio" icon="checkmark" full onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  notes: { minHeight: 90, textAlignVertical: 'top' },
});
