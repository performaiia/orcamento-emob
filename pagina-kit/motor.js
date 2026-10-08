// Ticker único: um Lenis, ligado ao ScrollTrigger, rodando no ticker do GSAP, com lagSmoothing(0) (zera-3d main.js).
// Toda animação por quadro da página entra por motor.adicionar; nenhum requestAnimationFrame ou setAnimationLoop próprio.
// Movimento reduzido: sem Lenis e sem callbacks (a cena desenha uma vez, parada). Toque: rolagem nativa, sem Lenis;
// callback com { tambemNoToque: true } ainda roda (ex.: cena viva no celular capaz).
// rolagem é obrigatório e vem de ritmo.json.rolagem do projeto (pagina-ritmo), não do kit: { lerp | duration, easing?, touch }.
// null = sem rolagem suave decidida (sem Lenis). easing é nome; a função vem em `easings` (ex.: { 'expo.out': fn }).
// touch true = Lenis também no toque (syncTouch); false = rolagem nativa no toque.
import { descartavel } from './contrato.js';

export function opcoesDaRolagem(rolagem, easings = {}) {
  const o = rolagem.lerp !== undefined ? { lerp: rolagem.lerp } : { duration: rolagem.duration };
  if (rolagem.easing !== undefined) {
    if (typeof easings[rolagem.easing] !== 'function') throw new Error(`ligarMotor: easing ${rolagem.easing} sem função em easings`);
    o.easing = easings[rolagem.easing];
  }
  if (rolagem.touch) o.syncTouch = true;
  return o;
}

export function ligarMotor({ gsap, ScrollTrigger, Lenis, rolagem, easings, reduzido = false, toque = false } = {}) {
  if (!gsap?.ticker) throw new Error('ligarMotor: gsap é obrigatório');
  if (rolagem === undefined) throw new Error('ligarMotor: rolagem vem do ritmo.json do projeto (null = sem rolagem suave)');
  const opcoesLenis = rolagem && opcoesDaRolagem(rolagem, easings);
  const callbacks = new Set();
  let ultimo = null;
  let lenis = null;
  let ligado = false;

  const quadro = (tempoS, deltaMs) => {
    const dt = typeof deltaMs === 'number' ? deltaMs : ultimo === null ? 0 : (tempoS - ultimo) * 1000;
    ultimo = tempoS;
    lenis?.raf(tempoS * 1000); // ticker em s, Lenis em ms
    for (const c of callbacks) if (!toque || c.tambemNoToque) c.fn(tempoS, dt);
  };
  const ligar = () => { if (!ligado) { gsap.ticker.add(quadro); ligado = true; } };
  const desligarSeVazio = () => { if (ligado && !lenis && callbacks.size === 0) { gsap.ticker.remove(quadro); ligado = false; } };

  if (!reduzido) {
    gsap.ticker.lagSmoothing(0);
    if (opcoesLenis && Lenis && (!toque || rolagem.touch)) {
      lenis = new Lenis(opcoesLenis);
      if (ScrollTrigger?.update) lenis.on('scroll', ScrollTrigger.update);
      ligar();
    }
  }

  return {
    lenis,
    adicionar(fn, { tambemNoToque = false } = {}) {
      if (reduzido || (toque && !tambemNoToque)) return () => {};
      const c = { fn, tambemNoToque };
      callbacks.add(c);
      ligar();
      return () => { callbacks.delete(c); desligarSeVazio(); };
    },
    desmontar: descartavel(() => {
      callbacks.clear();
      if (ligado) gsap.ticker.remove(quadro);
      ligado = false;
      lenis?.destroy();
    }),
  };
}
