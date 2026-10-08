// Ficha técnica: painel <dialog> montado em #ficha. Abre com 'ficha:abrir' {produtoId}; fecha com movimento e dispara 'ficha:fechada'.
// Tempo e easing do movimento ficam em ficha.css (ritmo "painel"); aqui só se troca o estado.
import { fichas } from './produtos.js';

export const ROTULOS = {
  tela_polegadas: 'Tela',
  estrutura: 'Estrutura',
  botoes: 'Botões',
  chip: 'Chip',
  bateria: 'Bateria',
  camera_frontal: 'Câmera frontal',
  camera_traseira: 'Câmeras traseiras',
  zoom: 'Zoom',
  peso: 'Peso',
  dimensoes: 'Dimensões',
};

const escapa = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function htmlFicha(produtoId) {
  const ficha = fichas[produtoId];
  if (!ficha) return '';
  const linhas = Object.keys(ROTULOS)
    .filter((id) => id in ficha.campos)
    .map((id) => `<div class="ficha__linha"><dt>${ROTULOS[id]}</dt><dd>${escapa(ficha.campos[id])}</dd></div>`)
    .join('');
  return `<header class="ficha__topo"><h2 id="ficha-titulo" class="ficha__titulo" tabindex="-1">${escapa(ficha.modelo)}</h2>`
    + `<button type="button" class="ficha__fechar" data-fechar aria-label="Fechar ficha técnica">×</button></header>`
    + `<dl class="ficha__lista">${linhas}</dl>`;
}

const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function montar(raiz) {
  const dialogo = document.createElement('dialog');
  dialogo.className = 'ficha';
  dialogo.setAttribute('aria-labelledby', 'ficha-titulo');
  raiz.append(dialogo);
  let aberto = null;

  const fechar = () => {
    if (!dialogo.open || !dialogo.classList.contains('ficha--aberta')) return;
    dialogo.classList.remove('ficha--aberta');
    if (semMovimento()) return dialogo.close();
    dialogo.addEventListener('transitionend', function fim(e) {
      if (e.target !== dialogo || e.propertyName !== 'transform') return;
      dialogo.removeEventListener('transitionend', fim);
      dialogo.close();
    });
  };

  dialogo.addEventListener('cancel', (e) => { e.preventDefault(); fechar(); });
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo || e.target.closest('[data-fechar]')) fechar();
  });
  dialogo.addEventListener('close', () => {
    document.dispatchEvent(new CustomEvent('ficha:fechada', { detail: { produtoId: aberto } }));
    aberto = null;
  });
  document.addEventListener('ficha:abrir', (e) => {
    const html = htmlFicha(e.detail?.produtoId);
    if (!html || dialogo.open) return;
    aberto = e.detail.produtoId;
    dialogo.innerHTML = html;
    dialogo.showModal();
    dialogo.querySelector('#ficha-titulo').focus();
    dialogo.getBoundingClientRect(); // fixa o estado fechado para a transição partir dele
    dialogo.classList.add('ficha--aberta');
  });
}

if (typeof document !== 'undefined') {
  const raiz = document.getElementById('ficha');
  if (raiz) montar(raiz);
}
