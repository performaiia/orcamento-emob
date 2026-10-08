// Contrato do ponteiro (agente-pages, ativos-interacao-17.09 §3): entrada → alvo → amplitude → suavização → limites → repouso → alternativa.
// Matemática de zera-3d mapa.js (suavizar independente de fps). Amplitude e k vêm do ritmo.json do projeto; o kit não tem padrão.

export const CAMPOS_DO_CONTRATO = Object.freeze(['entrada', 'alvo', 'amplitude', 'suavizacao', 'limites', 'repouso', 'alternativa']);

const limitar = (v, min, max) => Math.min(max, Math.max(min, v));

/** Campos do contrato do ponteiro vazios ou ausentes. */
export function faltasDoContratoPonteiro(c) {
  return CAMPOS_DO_CONTRATO.filter((k) => !(typeof c?.[k] === 'string' && c[k].trim()));
}

/** Aproxima atual de alvo com a mesma cauda a 30, 60 ou 120 qps; k = fração por quadro a 60 qps. */
export const suavizar = (atual, alvo, k, dtMs) => atual + (alvo - atual) * (1 - Math.pow(1 - k, (dtMs / 1000) * 60));

/** Pixel → -1..1 pelo retângulo atual do ELEMENTO (recalcular após resize), y para cima, preso nas bordas. */
export function normalizar(x, y, rect) {
  if (!(rect?.width > 0 && rect?.height > 0)) return { x: 0, y: 0 };
  const nx = limitar(((x - rect.left) / rect.width) * 2 - 1, -1, 1);
  const ny = limitar(-(((y - rect.top) / rect.height) * 2 - 1), -1, 1);
  return { x: nx + 0, y: ny + 0 };
}

export const limitarAmplitude = (v, max) => limitar(v, -Math.abs(max), Math.abs(max));

/**
 * Controlador do ponteiro, separado do progresso da rolagem e do movimento por tempo.
 * alvo(x, y) recebe -1..1; soltar() volta ao repouso (ponteiro saiu, perdeu foco); passo(dtMs) roda no ticker do motor.
 */
export function criarPonteiro({ amplitude, k, repouso = { x: 0, y: 0 } } = {}) {
  if (!(typeof k === 'number' && k > 0 && k <= 1)) throw new Error('criarPonteiro: k (0..1] vem do ritmo.json do projeto');
  if (!(typeof amplitude === 'number' && amplitude > 0)) throw new Error('criarPonteiro: amplitude > 0 vem do contrato do ponteiro');
  let alvo = { ...repouso };
  const atual = { ...repouso };
  return {
    alvo(x, y) { alvo = { x: limitarAmplitude(x * amplitude, amplitude), y: limitarAmplitude(y * amplitude, amplitude) }; },
    soltar() { alvo = { ...repouso }; },
    passo(dtMs) {
      atual.x = suavizar(atual.x, alvo.x, k, dtMs);
      atual.y = suavizar(atual.y, alvo.y, k, dtMs);
      return { x: atual.x, y: atual.y };
    },
  };
}
