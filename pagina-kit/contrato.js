// Contrato de cena do pipeline de páginas: a página só conhece montar, progresso, ponteiro e desmontar.
// Base: zera-web contrato.js (descartavel/semEfeito) e zera-3d cena.js (as quatro funções). Sem estética.
// desmontar desfaz TUDO o que montar criou: ouvintes, observadores, callbacks do motor, geometria, textura, contexto.

export const FUNCOES_DA_CENA = Object.freeze(['montar', 'progresso', 'ponteiro', 'desmontar']);

/** dispose que só executa uma vez (pagehide + troca de seção não desfazem duas vezes). */
export function descartavel(fn) {
  let feito = false;
  return () => {
    if (feito) return;
    feito = true;
    fn();
  };
}

/** init de módulo desligado (movimento reduzido, toque, limite): não criou nada. */
export const semEfeito = () => {};

/** O que falta no módulo de cena para cumprir o contrato. Lista vazia = cumpre. */
export function faltasDaCena(modulo) {
  return FUNCOES_DA_CENA.filter((f) => typeof modulo?.[f] !== 'function');
}
