// Capacidade e movimento reduzido. decidirRota/rotaAposSonda copiados de zera-web capability.js (lógica pura, sem estética).
// observarPreferencia: matchMedia AO VIVO (a pessoa liga "reduzir movimento" com a página aberta).

export const LIMIARES = Object.freeze({ memoriaGB: 4, nucleos: 4, frameMs: 24, quadrosSonda: 60 });
const ROTAS = ['video', 'live3d'];
const numero = (v) => typeof v === 'number' && Number.isFinite(v);

/** Leituras do navegador num objeto só; passe o resultado para decidirRota. */
export function lerSinais(janela, temWebGL) {
  const mm = (q) => janela.matchMedia?.(q)?.matches === true;
  return {
    reducedMotion: mm('(prefers-reduced-motion: reduce)'),
    coarsePointer: mm('(pointer: coarse)'),
    saveData: janela.navigator?.connection?.saveData === true,
    webgl: typeof temWebGL === 'function' ? temWebGL() : undefined,
    deviceMemory: janela.navigator?.deviceMemory,
    hardwareConcurrency: janela.navigator?.hardwareConcurrency,
  };
}

/** Rota final ('video' | 'live3d' | 'still') e os motivos do still. Sem WebGL só derruba o 3D vivo. */
export function decidirRota(sinais, { desejada } = {}) {
  const s = sinais ?? {};
  const motivos = [];
  if (!ROTAS.includes(desejada)) motivos.push(`rota pedida desconhecida (${String(desejada)})`);
  if (s.reducedMotion) motivos.push('movimento reduzido');
  if (s.saveData) motivos.push('economia de dados');
  if (desejada === 'live3d' && s.webgl === false) motivos.push('WebGL indisponível');
  if (numero(s.deviceMemory) && s.deviceMemory <= LIMIARES.memoriaGB) motivos.push(`memória ${s.deviceMemory} GB`);
  if (s.coarsePointer && numero(s.hardwareConcurrency) && s.hardwareConcurrency <= LIMIARES.nucleos) motivos.push(`ponteiro grosso e ${s.hardwareConcurrency} núcleos`);
  return { rota: motivos.length ? 'still' : desejada, motivos };
}

export function mediana(valores) {
  const v = (valores ?? []).filter(numero).sort((a, b) => a - b);
  if (!v.length) return 0;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** Com os primeiros quadros medidos, mediana acima do limiar rebaixa para still. Still nunca sobe. */
export function rotaAposSonda(rota, temposMs) {
  if (rota === 'still') return 'still';
  if (!Array.isArray(temposMs) || temposMs.length < LIMIARES.quadrosSonda) return rota;
  return mediana(temposMs.slice(0, LIMIARES.quadrosSonda)) > LIMIARES.frameMs ? 'still' : rota;
}

/** Chama aoMudar(reduzido) agora e a cada mudança; devolve o dispose. */
export function observarPreferencia(janela, aoMudar) {
  const mq = janela.matchMedia('(prefers-reduced-motion: reduce)');
  const f = (e) => aoMudar(e.matches);
  aoMudar(mq.matches);
  mq.addEventListener('change', f);
  return () => mq.removeEventListener('change', f);
}
