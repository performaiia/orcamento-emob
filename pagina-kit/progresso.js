// p único: uma fonte de progresso normalizado governa a cena (agente-pages, producao-16.09; zera-web progress.js).
// p = clamp((rolagem - inicio) / (fim - inicio), 0, 1). Câmera, objeto e textos derivam de p; ida e volta dão o mesmo estado.

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/** Progresso em [0, 1]. Trecho nulo, negativo ou entrada inválida devolve 0. */
export function progresso(posicao, inicio, fim) {
  if (!finito(posicao) || !finito(inicio) || !finito(fim)) return 0;
  const total = fim - inicio;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (posicao - inicio) / total));
}

/** Seção presa: começa com o topo da seção no topo da tela e termina com o fim da seção no fim da tela. */
export function progressoDoTrecho({ scrollY, topoSecao, alturaSecao, viewport }) {
  return progresso(scrollY, topoSecao, topoSecao + alturaSecao - viewport);
}

/** Índice do passo (0..n-1) para p em [0, 1]; p = 1 é o último passo. */
export function passoDoProgresso(p, n) {
  if (!Number.isInteger(n) || n <= 0 || !finito(p)) return 0;
  return Math.min(n - 1, Math.max(0, Math.floor(p * n)));
}
