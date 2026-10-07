let counter = 0;

/** Id univoco locale: non serve un uuid crittografico, i dati restano sul telefono. */
export function createId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
