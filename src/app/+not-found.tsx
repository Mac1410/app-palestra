import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Pagina non trovata' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText type="heading">Questa schermata non esiste</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
          Il collegamento che hai aperto non corrisponde a nessuna sezione dell’app.
        </ThemedText>
        <Button label="Torna alla home" onPress={() => router.replace('/')} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  text: { textAlign: 'center' },
});
