/**
 * Dialoghi di conferma dell'app.
 *
 * Sostituiscono `Alert` di React Native, che sul web non esiste: nella web app
 * installata sull'iPhone le conferme native non comparirebbero e azioni come
 * "termina allenamento" resterebbero senza risposta. Questi dialoghi sono
 * normali viste, quindi identiche su iOS, Android e web, e seguono la palette
 * Ember invece dell'aspetto di sistema.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DialogOptionStyle = 'default' | 'destructive' | 'cancel';

export type DialogOption = {
  label: string;
  /** Restituito dalla promise quando l'opzione viene scelta. */
  value: string;
  style?: DialogOptionStyle;
};

type Request = {
  title: string;
  message?: string;
  options: DialogOption[];
  resolve: (value: string | null) => void;
};

type DialogApi = {
  /** Domanda sì/no. Risolve true solo se l'utente conferma. */
  confirm: (options: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
  }) => Promise<boolean>;
  /** Messaggio con un solo pulsante. */
  notify: (options: { title: string; message?: string; label?: string }) => Promise<void>;
  /** Menù di azioni; risolve null se l'utente annulla. */
  choose: (options: {
    title: string;
    message?: string;
    options: DialogOption[];
    cancelLabel?: string;
  }) => Promise<string | null>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [request, setRequest] = useState<Request | null>(null);
  // Evita che una risposta tardiva (doppio tocco) risolva due volte.
  const pending = useRef<Request | null>(null);

  const close = useCallback((value: string | null) => {
    const current = pending.current;
    pending.current = null;
    setRequest(null);
    current?.resolve(value);
  }, []);

  const ask = useCallback(
    (title: string, message: string | undefined, options: DialogOption[]) =>
      new Promise<string | null>((resolve) => {
        // Una richiesta in attesa viene considerata annullata.
        pending.current?.resolve(null);
        const next: Request = { title, message, options, resolve };
        pending.current = next;
        setRequest(next);
      }),
    [],
  );

  const api = useMemo<DialogApi>(
    () => ({
      confirm: async ({ title, message, confirmLabel, cancelLabel, destructive }) => {
        const answer = await ask(title, message, [
          {
            label: confirmLabel ?? 'Conferma',
            value: 'confirm',
            style: destructive ? 'destructive' : 'default',
          },
          { label: cancelLabel ?? 'Annulla', value: 'cancel', style: 'cancel' },
        ]);
        return answer === 'confirm';
      },
      notify: async ({ title, message, label }) => {
        await ask(title, message, [{ label: label ?? 'Ho capito', value: 'ok' }]);
      },
      choose: ({ title, message, options, cancelLabel }) =>
        ask(title, message, [
          ...options,
          { label: cancelLabel ?? 'Annulla', value: '__cancel__', style: 'cancel' },
        ]).then((value) => (value === '__cancel__' ? null : value)),
    }),
    [ask],
  );

  const colorFor = (style: DialogOptionStyle | undefined) => {
    if (style === 'destructive') return { bg: theme.dangerSoft, fg: theme.danger };
    if (style === 'cancel') return { bg: 'transparent', fg: theme.textSecondary };
    return { bg: theme.accent, fg: theme.onAccent };
  };

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={request !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => close(null)}>
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="Chiudi"
          onPress={() => close(null)}>
          {/* Il tocco dentro la scheda non deve chiudere il dialogo. */}
          <Pressable
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
            onPress={() => {}}>
            <View style={styles.texts}>
              <ThemedText type="heading">{request?.title}</ThemedText>
              {request?.message ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {request.message}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.actions}>
              {request?.options.map((option) => {
                const colors = colorFor(option.style);
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => close(option.value)}
                    style={({ pressed }) => [
                      styles.action,
                      { backgroundColor: colors.bg },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText style={[styles.actionLabel, { color: colors.fg }]}>
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog deve essere usato dentro <DialogProvider>');
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  texts: { gap: Spacing.two },
  actions: { gap: Spacing.two },
  action: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
