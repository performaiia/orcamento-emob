// S2 orçamento e S4 navegação: montagem, troca por seta, swipe e teclado, pré-carga do vizinho.
import { dados, SIZES } from './dados.js';
import { ritmo } from './ritmo.js';
import { ligarMovimento, destinoTeclado, destinoSwipe } from './movimento.js';

const PRECO_PENDENTE = '0.000';

export { SIZES };

const srcset = (c, ext) => c.larguras.map((w) => `${c.base}-${w}.${ext} ${w}w`).join(', ');

function fotoHtml(d, c, i) {
  // a foto da frente do 1º orçamento é o LCP: mesma prioridade da pré-carga do <head>
  const prioridade = d.id === dados[0].id && i === d.cores.length - 1 ? ' fetchpriority="high"' : '';
  return `<picture>
      <source type="image/avif" srcset="${srcset(c, 'avif')}" sizes="${SIZES}">
      <img class="aparelho" style="--i:${i}" src="${c.base}-${c.larguras[0]}.webp" srcset="${srcset(c, 'webp')}" sizes="${SIZES}" width="${c.largura}" height="${c.altura}" alt="${d.modelo} ${c.nome}" decoding="async"${prioridade}>
    </picture>`;
}

// Quebra do esboço: "iPhone 17" / "Pro Max" (marca e número, depois a linha).
const linhasModelo = (modelo) => {
  const [, marca, linha] = modelo.match(/^(\S+ \d+)\s*(.*)$/) ?? [null, modelo, ''];
  return `<span class="modelo__linha">${marca}</span>${linha ? ` <span class="modelo__linha">${linha}</span>` : ''}`;
};

// cores escuras ganham contorno mais forte (--borda-bolinha-escura, ag-ux)
const ESCURAS = new Set(['burgundy', 'deepblue', 'black']);

const bolinhas = (d) => (d.bolinhas
  ? `<span class="bolinhas">${d.cores.map((c) => `<span class="bolinha${ESCURAS.has(c.slug) ? ' bolinha--escura' : ''}" style="--cor: var(--cor-${c.slug})" role="img" aria-label="${c.nome}" title="${c.nome}"></span>`).join('')}</span>`
  : '');

export function orcamentoHtml(d) {
  const preco = d.preco ?? PRECO_PENDENTE;
  const aparelhos = d.cores.map((c, i) => fotoHtml(d, c, i)).join('');
  return `<article class="orcamento" aria-label="${d.modelo} ${d.capacidade}">
  <div class="orcamento__texto">
    <h1 class="orcamento__modelo">${linhasModelo(d.modelo)}</h1>
    <p class="orcamento__capacidade">${d.capacidade.replace(/\s+/g, '')}</p>
  </div>
  <div class="orcamento__aparelhos"><div class="leque" style="--n:${d.cores.length}">${aparelhos}</div></div>
  <div class="orcamento__preco"${d.preco ? '' : ' data-pendente'}>
    <p class="preco"><span class="moeda">R$</span> <strong>${preco}</strong> <span class="destaque">à vista</span>${bolinhas(d)}</p>

  </div>
  <button class="botao-ficha" type="button" data-abre="${d.id}">ver ficha técnica</button>
</article>`;
}

function preCarregar(doc, d) {
  for (const c of d.cores) {
    const link = Object.assign(doc.createElement('link'), { rel: 'preload', as: 'image', type: 'image/avif' });
    link.setAttribute('imagesrcset', srcset(c, 'avif'));
    link.setAttribute('imagesizes', SIZES);
    doc.head.append(link);
  }
}

function montar(doc) {
  const palco = doc.querySelector('[data-palco]');
  const anterior = doc.querySelector('[data-anterior]');
  const proximo = doc.querySelector('[data-proximo]');
  const movimento = ligarMovimento(doc, ritmo);
  const carregados = new Set();
  let atual = -1;
  let fichaAberta = false;

  const vitrine = palco.closest('.vitrine');
  // setas no meio da altura dos aparelhos do orçamento atual
  const alinharSetas = () => {
    const leque = palco.querySelector('.orcamento:not(.orcamento--saindo) .leque');
    if (!leque) return;
    const l = leque.getBoundingClientRect();
    vitrine.style.setProperty('--topo-setas', `${l.top + l.height / 2 - vitrine.getBoundingClientRect().top}px`);
  };
  // realinha quando a coluna muda de tamanho, quando as fontes chegam e na carga completa
  new ResizeObserver(alinharSetas).observe(vitrine);
  doc.fonts?.ready.then(alinharSetas);
  doc.defaultView.addEventListener('load', alinharSetas, { once: true });

  const criar = (i) => {
    const t = doc.createElement('template');
    t.innerHTML = orcamentoHtml(dados[i]);
    return t.content.firstElementChild;
  };

  const mostrar = (i) => {
    if (i === atual || i < 0 || i >= dados.length) return;
    const direcao = i > atual ? 1 : -1;
    const antigo = palco.querySelector('.orcamento:not(.orcamento--saindo)');
    const novo = criar(i);
    palco.append(novo);
    atual = i;
    anterior.classList.toggle('seta--oculta', i === 0);
    proximo.classList.toggle('seta--oculta', i === dados.length - 1);
    anterior.disabled = i === 0;
    proximo.disabled = i === dados.length - 1;
    alinharSetas();
    movimento.troca(antigo, novo, direcao);
    for (const v of [i - 1, i + 1]) if (dados[v] && !carregados.has(v)) { carregados.add(v); preCarregar(doc, dados[v]); }
  };

  anterior.addEventListener('click', () => mostrar(atual - 1));
  proximo.addEventListener('click', () => mostrar(atual + 1));
  doc.addEventListener('keydown', (e) => {
    if (fichaAberta) return;
    const alvo = destinoTeclado(e.key, atual, dados.length);
    if (alvo !== null) mostrar(alvo);
  });
  let inicioX = null;
  palco.addEventListener('pointerdown', (e) => { inicioX = e.clientX; });
  palco.addEventListener('pointerup', (e) => {
    if (inicioX === null) return;
    const alvo = destinoSwipe(e.clientX - inicioX, atual, dados.length);
    inicioX = null;
    if (alvo !== null) mostrar(alvo);
  });
  palco.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-abre]');
    if (botao) doc.dispatchEvent(new CustomEvent('ficha:abrir', { detail: { produtoId: botao.dataset.abre } }));
  });
  doc.addEventListener('ficha:abrir', () => { fichaAberta = true; });
  doc.addEventListener('ficha:fechada', () => {
    fichaAberta = false;
    palco.querySelector('.orcamento:not(.orcamento--saindo) [data-abre]')?.focus();
  });

  const pedido = Number(new URLSearchParams(doc.defaultView.location.search).get('o'));
  const inicial = pedido >= 1 && pedido <= dados.length ? pedido - 1 : 0;
  // U3: o 1º orçamento já vem no HTML estático; o JS adota em vez de recriar
  const estatico = palco.querySelector('.orcamento');
  if (estatico && inicial === 0) {
    atual = 0;
    alinharSetas();
    movimento.troca(null, estatico);
    for (const v of [1]) if (dados[v]) { carregados.add(v); preCarregar(doc, dados[v]); }
  } else {
    estatico?.remove();
    mostrar(inicial);
  }
}

if (typeof document !== 'undefined') montar(document);
