import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DialogProvider } from '@/components/ui/dialog';
import { Colors } from '@/constants/theme';
import { GymProvider } from '@/store/gym-store';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.accent,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function RootLayout() {
  return (
    <GymProvider>
      <ThemeProvider value={navigationTheme}>
        <DialogProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerTintColor: Colors.accent,
              headerTitleStyle: { color: Colors.text },
              headerStyle: { backgroundColor: Colors.background },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: Colors.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="scheda/[id]" options={{ title: 'Scheda' }} />
            <Stack.Screen name="esercizio/[id]" options={{ title: 'Esercizio' }} />
            <Stack.Screen name="storico/[id]" options={{ title: 'Allenamento' }} />
            <Stack.Screen
              name="sessione"
              options={{ title: 'Allenamento in corso', headerBackTitle: 'Chiudi' }}
            />
            <Stack.Screen
              name="aggiungi-esercizi"
              options={{ title: 'Aggiungi esercizi', presentation: 'modal' }}
            />
            <Stack.Screen
              name="nuovo-esercizio"
              options={{ title: 'Nuovo esercizio', presentation: 'modal' }}
            />
            <Stack.Screen name="impostazioni" options={{ title: 'Impostazioni' }} />
            <Stack.Screen name="questionario" options={{ headerShown: false }} />
            <Stack.Screen name="programma" options={{ title: 'Programma' }} />
          </Stack>
        </DialogProvider>
      </ThemeProvider>
    </GymProvider>
  );
}
