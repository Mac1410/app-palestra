/**
 * Configurazione dinamica: parte da app.json e aggiunge il percorso di base
 * del sito solo quando si costruisce la web app (vedi scripts/build-web.mjs).
 *
 * In sviluppo la variabile non è impostata, così il server resta su "/" e
 * Expo Go continua a funzionare come sempre.
 */
module.exports = ({ config }) => {
  const baseUrl = process.env.PALESTRA_BASE_URL;

  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};
