/**
 * Questionario iniziale.
 *
 * Una domanda per schermata: si risponde con un tocco e si va avanti da soli,
 * così anche dodici domande si compilano in un minuto. Le risposte diventano
 * il profilo (`Profile`), da cui `buildProgram` ricava le schede.
 */

import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Field } from '@/components/ui/input';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { useGym } from '@/store/gym-store';
import {
  BODY_AREA_LABELS,
  BODY_AREAS,
  CARDIO_PREFERENCES,
  EXPERIENCE_LEVELS,
  GOALS,
  GOAL_LABELS,
  HOME_EQUIPMENT,
  MUSCLE_GROUPS,
  TRAINING_PLACES,
  type BodyArea,
  type CardioPreference,
  type ExperienceLevel,
  type Goal,
  type HomeEquipmentItem,
  type MuscleGroup,
  type Profile,
  type TrainingPlace,
} from '@/types';

type Answers = {
  goal: Goal | null;
  experience: ExperienceLevel | null;
  daysPerWeek: number | null;
  sessionMinutes: number | null;
  place: TrainingPlace | null;
  equipment: HomeEquipmentItem[];
  age: string;
  weightKg: string;
  heightCm: string;
  cautions: BodyArea[];
  focus: MuscleGroup[];
  cardio: CardioPreference | null;
};

const EMPTY_ANSWERS: Answers = {
  goal: null,
  experience: null,
  daysPerWeek: null,
  sessionMinutes: null,
  place: null,
  equipment: [],
  age: '',
  weightKg: '',
  heightCm: '',
  cautions: [],
  focus: [],
  cardio: null,
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, { title: string; description: string }> = {
  principiante: {
    title: 'Comincio adesso',
    description: 'Meno di sei mesi, o riparto dopo una lunga pausa',
  },
  intermedio: {
    title: 'Me la cavo',
    description: 'Mi alleno con continuità da un anno o più',
  },
  avanzato: {
    title: 'Esperto',
    description: 'Anni di allenamento, conosco bene i fondamentali',
  },
};

const PLACE_LABELS: Record<TrainingPlace, { title: string; description: string }> = {
  palestra: { title: 'In palestra', description: 'Bilancieri, macchine, cavi: tutto disponibile' },
  casa: { title: 'A casa', description: 'Con quello che ho a disposizione' },
  misto: { title: 'Un po’ e un po’', description: 'In palestra quando posso, altrimenti a casa' },
};

const EQUIPMENT_LABELS: Record<HomeEquipmentItem, string> = {
  manubri: 'Manubri',
  bilanciere: 'Bilanciere',
  kettlebell: 'Kettlebell',
  elastici: 'Elastici',
  sbarra: 'Sbarra per trazioni',
  panca: 'Panca',
  parallele: 'Parallele',
};

const AREA_LABELS: Record<BodyArea, string> = Object.fromEntries(
  BODY_AREAS.map((area) => [
    area,
    BODY_AREA_LABELS[area].charAt(0).toUpperCase() + BODY_AREA_LABELS[area].slice(1),
  ]),
) as Record<BodyArea, string>;

const CARDIO_LABELS: Record<CardioPreference, { title: string; description: string }> = {
  no: { title: 'Niente cardio', description: 'Solo pesi' },
  poco: { title: 'Un po’', description: 'Dieci minuti a fine allenamento, ogni tanto' },
  molto: { title: 'Volentieri', description: 'Cardio in chiusura di ogni seduta' },
};

const DURATIONS = [30, 45, 60, 75, 90];

export default function QuestionnaireScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const { state, actions } = useGym();
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [index, setIndex] = useState(0);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((current) => ({ ...current, [key]: value }));

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  /** Scelta singola: seleziona e passa avanti, senza chiedere conferma. */
  const choose = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    haptics.tap();
    set(key, value);
    setTimeout(() => setIndex((current) => current + 1), 140);
  };

  const needsEquipment = answers.place === 'casa' || answers.place === 'misto';

  const steps = useMemo(() => {
    const list: {
      key: string;
      title: string;
      subtitle?: string;
      optional?: boolean;
      done: boolean;
      content: React.ReactNode;
    }[] = [
      {
        key: 'goal',
        title: 'Che cosa vuoi ottenere?',
        subtitle: 'Decide serie, ripetizioni e recuperi di tutto il programma.',
        done: answers.goal !== null,
        content: (
          <View style={styles.options}>
            {GOALS.map((goal) => (
              <OptionCard
                key={goal}
                title={GOAL_LABELS[goal].title}
                description={GOAL_LABELS[goal].description}
                selected={answers.goal === goal}
                onPress={() => choose('goal', goal)}
              />
            ))}
          </View>
        ),
      },
      {
        key: 'experience',
        title: 'Quanta esperienza hai?',
        subtitle: 'Serve a scegliere gli esercizi e quanto volume reggi.',
        done: answers.experience !== null,
        content: (
          <View style={styles.options}>
            {EXPERIENCE_LEVELS.map((level) => (
              <OptionCard
                key={level}
                title={EXPERIENCE_LABELS[level].title}
                description={EXPERIENCE_LABELS[level].description}
                selected={answers.experience === level}
                onPress={() => choose('experience', level)}
              />
            ))}
          </View>
        ),
      },
      {
        key: 'days',
        title: 'Quante volte a settimana?',
        subtitle: 'Sii realistico: meglio tre sedute fatte che cinque saltate.',
        done: answers.daysPerWeek !== null,
        content: (
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
              <BigChoice
                key={days}
                label={String(days)}
                caption={days === 1 ? 'volta' : 'volte'}
                selected={answers.daysPerWeek === days}
                onPress={() => choose('daysPerWeek', days)}
              />
            ))}
          </View>
        ),
      },
      {
        key: 'minutes',
        title: 'Quanto dura un allenamento?',
        subtitle: 'Il programma riempie il tempo che hai, senza sforare.',
        done: answers.sessionMinutes !== null,
        content: (
          <View style={styles.grid}>
            {DURATIONS.map((minutes) => (
              <BigChoice
                key={minutes}
                label={String(minutes)}
                caption="minuti"
                selected={answers.sessionMinutes === minutes}
                onPress={() => choose('sessionMinutes', minutes)}
              />
            ))}
          </View>
        ),
      },
      {
        key: 'place',
        title: 'Dove ti alleni?',
        done: answers.place !== null,
        content: (
          <View style={styles.options}>
            {TRAINING_PLACES.map((place) => (
              <OptionCard
                key={place}
                title={PLACE_LABELS[place].title}
                description={PLACE_LABELS[place].description}
                selected={answers.place === place}
                onPress={() => choose('place', place)}
              />
            ))}
          </View>
        ),
      },
    ];

    if (needsEquipment) {
      list.push({
        key: 'equipment',
        title: 'Che attrezzatura hai a casa?',
        subtitle: 'Tocca tutto quello che possiedi. Se non hai nulla, vai avanti.',
        optional: true,
        done: true,
        content: (
          <View style={styles.chips}>
            {HOME_EQUIPMENT.map((item) => (
              <Chip
                key={item}
                label={EQUIPMENT_LABELS[item]}
                selected={answers.equipment.includes(item)}
                onPress={() => set('equipment', toggle(answers.equipment, item))}
              />
            ))}
          </View>
        ),
      });
    }

    list.push(
      {
        key: 'body',
        title: 'Qualche dato su di te',
        subtitle:
          'Il peso serve a proporre i carichi di partenza. Puoi lasciare vuoto e scriverli tu.',
        optional: true,
        done: true,
        content: (
          <View style={styles.form}>
            <Field
              label="Età"
              value={answers.age}
              onChangeText={(text) => set('age', text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="anni"
              maxLength={2}
            />
            <Field
              label="Peso"
              value={answers.weightKg}
              onChangeText={(text) => set('weightKg', text.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="kg"
              maxLength={5}
            />
            <Field
              label="Altezza"
              value={answers.heightCm}
              onChangeText={(text) => set('heightCm', text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="cm"
              maxLength={3}
            />
          </View>
        ),
      },
      {
        key: 'cautions',
        title: 'Qualcosa a cui stare attenti?',
        subtitle:
          'Gli esercizi che caricano queste zone vengono esclusi e sostituiti con alternative.',
        optional: true,
        done: true,
        content: (
          <View style={styles.chips}>
            {BODY_AREAS.map((area) => (
              <Chip
                key={area}
                label={AREA_LABELS[area]}
                tone="danger"
                selected={answers.cautions.includes(area)}
                onPress={() => set('cautions', toggle(answers.cautions, area))}
              />
            ))}
          </View>
        ),
      },
      {
        key: 'focus',
        title: 'C’è qualcosa a cui tieni di più?',
        subtitle: 'Scegline al massimo tre: riceveranno più lavoro delle altre.',
        optional: true,
        done: true,
        content: (
          <View style={styles.chips}>
            {MUSCLE_GROUPS.filter(
              (muscle) => muscle !== 'Cardio' && muscle !== 'Collo',
            ).map((muscle) => (
              <Chip
                key={muscle}
                label={muscle}
                tone="accent"
                selected={answers.focus.includes(muscle)}
                onPress={() => {
                  if (!answers.focus.includes(muscle) && answers.focus.length >= 3) return;
                  set('focus', toggle(answers.focus, muscle));
                }}
              />
            ))}
          </View>
        ),
      },
      {
        key: 'cardio',
        title: 'Vuoi del cardio?',
        done: answers.cardio !== null,
        content: (
          <View style={styles.options}>
            {CARDIO_PREFERENCES.map((preference) => (
              <OptionCard
                key={preference}
                title={CARDIO_LABELS[preference].title}
                description={CARDIO_LABELS[preference].description}
                selected={answers.cardio === preference}
                onPress={() => choose('cardio', preference)}
              />
            ))}
          </View>
        ),
      },
    );

    return list;
  }, [answers, needsEquipment]);

  const isSummary = index >= steps.length;
  const step = steps[Math.min(index, steps.length - 1)];
  const progress = (Math.min(index, steps.length) / steps.length) * 100;

  const complete = () => {
    const number = (text: string) => {
      const value = Number.parseFloat(text.replace(',', '.'));
      return Number.isFinite(value) && value > 0 ? value : undefined;
    };

    const now = Date.now();
    const profile: Profile = {
      createdAt: state.profile?.createdAt ?? now,
      updatedAt: now,
      goal: answers.goal ?? 'mantenimento',
      experience: answers.experience ?? 'principiante',
      daysPerWeek: answers.daysPerWeek ?? 3,
      sessionMinutes: answers.sessionMinutes ?? 60,
      place: answers.place ?? 'palestra',
      equipment: answers.place === 'palestra' ? [] : answers.equipment,
      age: number(answers.age),
      weightKg: number(answers.weightKg),
      heightCm: number(answers.heightCm),
      cautions: answers.cautions,
      focus: answers.focus,
      cardio: answers.cardio ?? 'no',
    };

    haptics.success();
    actions.saveProfile(profile);
    router.replace('/programma');
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[styles.fill, { width: `${progress}%`, backgroundColor: theme.accent }]}
          />
        </View>
        <ThemedText type="caption" themeColor="textMuted">
          {isSummary ? 'Ci siamo' : `Domanda ${index + 1} di ${steps.length}`}
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {isSummary ? (
          <Summary answers={answers} />
        ) : (
          <>
            <View style={styles.titles}>
              <ThemedText type="title">{step.title}</ThemedText>
              {step.subtitle ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {step.subtitle}
                </ThemedText>
              ) : null}
            </View>
            {step.content}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        {index > 0 ? (
          <Button
            label="Indietro"
            variant="ghost"
            onPress={() => setIndex((current) => current - 1)}
          />
        ) : (
          <View />
        )}

        {isSummary ? (
          <Button label="Crea il mio programma" icon="sparkles" onPress={complete} />
        ) : (
          <Button
            label={step.optional && !step.done ? 'Salta' : 'Avanti'}
            variant={step.done ? 'primary' : 'secondary'}
            disabled={!step.done && !step.optional}
            onPress={() => setIndex((current) => current + 1)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function OptionCard({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="subtitle" themeColor={selected ? 'accent' : 'text'}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {description}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

function BigChoice({
  label,
  caption,
  selected,
  onPress,
}: {
  label: string;
  caption: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.big,
        {
          backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="heading" themeColor={selected ? 'accent' : 'text'}>
        {label}
      </ThemedText>
      <ThemedText type="caption" themeColor="textMuted">
        {caption}
      </ThemedText>
    </Pressable>
  );
}

function Summary({ answers }: { answers: Answers }) {
  const rows: [string, string][] = [
    ['Obiettivo', answers.goal ? GOAL_LABELS[answers.goal].title : '—'],
    ['Esperienza', answers.experience ? EXPERIENCE_LABELS[answers.experience].title : '—'],
    [
      'Disponibilità',
      `${answers.daysPerWeek ?? '—'} volte a settimana · ${answers.sessionMinutes ?? '—'} minuti`,
    ],
    ['Dove', answers.place ? PLACE_LABELS[answers.place].title : '—'],
  ];

  if (answers.equipment.length > 0) {
    rows.push(['Attrezzatura', answers.equipment.map((i) => EQUIPMENT_LABELS[i]).join(', ')]);
  }
  if (answers.cautions.length > 0) {
    rows.push(['Attenzione a', answers.cautions.map((a) => AREA_LABELS[a]).join(', ')]);
  }
  if (answers.focus.length > 0) {
    rows.push(['Priorità', answers.focus.join(', ')]);
  }
  rows.push(['Cardio', answers.cardio ? CARDIO_LABELS[answers.cardio].title : '—']);

  return (
    <>
      <View style={styles.titles}>
        <ThemedText type="title">Ecco cosa ho capito</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Controlla, poi costruisco le schede. Potrai modificare tutto in qualsiasi momento.
        </ThemedText>
      </View>

      <View style={styles.summary}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.summaryRow}>
            <ThemedText type="caption" themeColor="textMuted">
              {label.toUpperCase()}
            </ThemedText>
            <ThemedText type="bodyBold">{value}</ThemedText>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  track: { height: 4, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  titles: { gap: Spacing.two },
  options: { gap: Spacing.two },
  option: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  big: {
    minWidth: 92,
    flexGrow: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  form: { gap: Spacing.three },
  summary: { gap: Spacing.three },
  summaryRow: { gap: 2 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  pressed: { opacity: 0.75 },
});
