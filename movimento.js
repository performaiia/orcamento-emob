// Movimento da frente A (S1 logo, S2 leque e balanço, S4 troca, recuo atrás da ficha).
// Tempos de .pagina/movimento/ritmo.json (via src/ritmo.js); trajetórias de transicoes.json. Sem laço de quadro próprio: Web Animations.
import { observarPreferencia } from './pagina-kit/capacidade.js';

const valor = (lista, nome) => lista.find((x) => x.nome === nome || x.id === nome);

export function tempos(ritmo) {
  const { duracoes_ms: d, easings: e } = ritmo.escala;
  return {
    troca: valor(d, 'troca').valor,
    painel: valor(d, 'painel').valor,
    logo: valor(d, 'logo').valor,
    flutua: valor(d, 'flutua').valor,
    logoSegura: valor(ritmo.pausas, 'logo-segura').ms,
    assentam: valor(ritmo.pausas, 'aparelhos-assentam').ms,
    leque: valor(ritmo.stagger, 'aparelhos-leque').intervalo_ms,
    balanco: valor(ritmo.stagger, 'aparelhos-balanco').intervalo_ms,
    easingTroca: valor(e, 'troca').valor,
    easingCor: valor(e, 'cor').valor,
  };
}

/** Atraso de cada aparelho: o(s) do centro primeiro, um passo por anel até as bordas. */
export function atrasosLeque(n, passo) {
  const meio = (n - 1) / 2;
  return Array.from({ length: n }, (_, i) => Math.floor(Math.abs(i - meio)) * passo);
}

/** Opacidade da camada colorida (e verde + mob): segura, passa, segura o e escuro, volta pelo mesmo caminho. */
export function cicloLogo(passagem, segura) {
  const duracao = 2 * (passagem + segura);
  const t = [0, segura, segura + passagem, 2 * segura + passagem, duracao];
  const op = [1, 1, 0, 0, 1];
  return { duracao, quadros: t.map((x, i) => ({ offset: x / duracao, opacity: op[i] })) };
}

export function destinoTeclado(tecla, atual, total) {
  const passo = { ArrowRight: 1, ArrowLeft: -1 }[tecla];
  if (!passo) return null;
  const alvo = atual + passo;
  return alvo >= 0 && alvo < total ? alvo : null;
}

// Distância mínima de arrasto para contar como swipe (px). Gesto, não aparência: não vem do ritmo.
const LIMIAR_SWIPE = 50;

export function destinoSwipe(dx, atual, total) {
  if (Math.abs(dx) < LIMIAR_SWIPE) return null;
  return destinoTeclado(dx < 0 ? 'ArrowRight' : 'ArrowLeft', atual, total);
}

// Trajetórias do roteiro (transicoes.json): leque nasce do centro e menor; balanço ±1,5% da altura (R04#24); recuo 95% e desfoque 12 px (R16#17).
const ESCALA_ENTRADA = 0.85;
const BALANCO = '1.5%';
const RECUO = { escala: 0.95, desfoque: '12px' };

/** Liga o movimento na página. Devolve o dispose. */
export function ligarMovimento(doc, ritmo) {
  const t = tempos(ritmo);
  let reduzido = false;
  const vivas = new Set();
  const animar = (el, quadros, opcoes) => {
    if (reduzido) return null;
    const a = el.animate(quadros, opcoes);
    vivas.add(a);
    a.finished.then(() => vivas.delete(a), () => vivas.delete(a));
    return a;
  };
  const pararTudo = () => { for (const a of vivas) a.cancel(); vivas.clear(); };

  const raiz = doc.documentElement;
  raiz.style.setProperty('--dur-painel', `${t.painel}ms`);
  raiz.style.setProperty('--easing-troca', t.easingTroca);

  function logo() {
    const c = cicloLogo(t.logo, t.logoSegura);
    const opcoes = { duration: c.duracao, iterations: Infinity, easing: t.easingCor };
    const corApaga = doc.getElementById('e-cor');
    const mobAcende = doc.getElementById('mob-claro');
    if (corApaga) animar(corApaga, c.quadros, opcoes);
    // mob: escuro (8/9.svg) embaixo sempre opaco; o branco do 8.svg acende por cima no mesmo tempo
    if (mobAcende) animar(mobAcende, c.quadros.map((q) => ({ ...q, opacity: 1 - q.opacity })), opcoes);
  }

  function leque(artigo) {
    const caixa = artigo.querySelector('.leque');
    if (!caixa) return;
    const centro = caixa.getBoundingClientRect();
    const meioX = centro.left + centro.width / 2;
    const aparelhos = [...caixa.querySelectorAll('.aparelho')];
    const atrasos = atrasosLeque(aparelhos.length, t.leque);
    aparelhos.forEach((img, i) => {
      const r = img.getBoundingClientRect();
      const dx = meioX - (r.left + r.width / 2);
      const entrada = animar(img, [
        { translate: `${dx}px 0`, scale: ESCALA_ENTRADA },
        { translate: '0 0', scale: 1 },
      ], { duration: t.troca, delay: atrasos[i], easing: t.easingTroca, fill: 'backwards' });
      const fimEntrada = Math.max(...atrasos) + t.troca + t.assentam;
      animar(img, [{ translate: `0 -${BALANCO}` }, { translate: `0 ${BALANCO}` }], {
        duration: t.flutua, easing: t.easingTroca, direction: 'alternate', iterations: Infinity,
        // começa no meio do curso (posição de repouso) para não saltar
        delay: fimEntrada + i * t.balanco - t.flutua / 2, fill: 'none',
      });
      return entrada;
    });
  }

  function troca(antigo, novo, direcao) {
    leque(novo);
    if (!antigo || reduzido) { antigo?.remove(); return; }
    antigo.classList.add('orcamento--saindo');
    const ida = { duration: t.troca, easing: t.easingTroca };
    animar(antigo, [{ translate: '0 0', opacity: 1 }, { translate: `${-direcao * 100}% 0`, opacity: 0 }], ida)
      ?.finished.finally(() => antigo.remove());
    animar(novo, [{ translate: `${direcao * 100}% 0` }, { translate: '0 0' }], ida);
    // valores saem antes de o novo entrar (R05#8)
    const precoAntigo = antigo.querySelector('.orcamento__preco');
    const precoNovo = novo.querySelector('.orcamento__preco');
    if (precoAntigo) animar(precoAntigo, [{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], ida);
    if (precoNovo) animar(precoNovo, [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], ida);
  }

  const palco = doc.querySelector('[data-palco]');
  let recuo = null;
  const abrir = () => {
    recuo = animar(palco, [
      { scale: 1, filter: 'blur(0px)' },
      { scale: RECUO.escala, filter: `blur(${RECUO.desfoque})` },
    ], { duration: t.painel, easing: t.easingTroca, fill: 'forwards' });
  };
  const fechar = () => {
    if (!recuo) return;
    recuo.reverse();
    recuo.finished.then(() => { recuo?.cancel(); recuo = null; }, () => {});
  };
  doc.addEventListener('ficha:abrir', abrir);
  doc.addEventListener('ficha:fechada', fechar);

  const pararPreferencia = observarPreferencia(doc.defaultView, (r) => {
    reduzido = r;
    raiz.toggleAttribute('data-reduzido', r);
    if (r) pararTudo();
    else logo();
  });

  return {
    tempos: t,
    leque,
    troca,
    get reduzido() { return reduzido; },
    desmontar() {
      pararTudo();
      pararPreferencia();
      doc.removeEventListener('ficha:abrir', abrir);
      doc.removeEventListener('ficha:fechada', fechar);
    },
  };
}
