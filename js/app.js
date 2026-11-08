// A pagina. O adversario resolve o tabuleiro inteiro a cada lance: ele nao
// tem profundidade limitada nem funcao de avaliacao. Por isso os tamanhos
// oferecidos aqui param no 5x4 — acima disso cada lance levaria segundos.

import { tabuleiro, cabe, jogar, jogadas, alinhou } from './tabuleiro.js';
import { resolver, melhorLance, notaDeVitoria } from './solucionador.js';

const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const estado = document.getElementById('estado');

let t = null;
let posicao = 0;
let mascara = 0;
let vez = 0;        // 0 = pessoa, 1 = computador
let humano = 0;
let acabou = false;
let notasVisiveis = null;

const RAIO = 26;
const PASSO = 64;
const MARGEM = 38;

function novo() {
  const [c, l] = document.getElementById('tamanho').value.split(',').map(Number);
  humano = 0;
  vez = Number(document.getElementById('quem').value);
  t = tabuleiro(c, l);
  posicao = 0;
  mascara = 0;
  acabou = false;
  notasVisiveis = null;
  tela.width = MARGEM * 2 + c * PASSO;
  tela.height = MARGEM * 2 + l * PASSO;
  const nota = resolver(t, 0, 0, 'ordenada').nota;
  estado.innerHTML = 'Com os dois jogando perfeito este tabuleiro '
    + (nota > 0 ? 'é <span class="forte">vitória de quem começa</span>.'
      : nota < 0 ? 'é <span class="forte">vitória de quem responde</span>.'
        : 'termina <span class="forte">empatado</span>.');
  desenhar();
  if (vez === 1) setTimeout(jogarComputador, 350);
}

function pecasDe(jogador) {
  // jogador 0 e quem comecou
  const comecou = jogadas(t, mascara) % 2 === 0;
  const daVez = posicao;
  const doOutro = posicao ^ mascara;
  return (jogador === 0) === comecou ? daVez : doOutro;
}

function desenhar() {
  ctx.fillStyle = '#0f0b17';
  ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.fillStyle = '#1d1729';
  ctx.fillRect(MARGEM - 10, MARGEM - 10, t.colunas * PASSO + 20, t.linhas * PASSO + 20);

  const deX = pecasDe(0);
  const deO = pecasDe(1);
  for (let c = 0; c < t.colunas; c++) {
    for (let r = 0; r < t.linhas; r++) {
      const bit = 1 << (c * t.altura + r);
      const x = MARGEM + c * PASSO + PASSO / 2;
      const y = MARGEM + (t.linhas - 1 - r) * PASSO + PASSO / 2;
      ctx.beginPath();
      ctx.arc(x, y, RAIO, 0, Math.PI * 2);
      ctx.fillStyle = (deX & bit) ? '#d4536f' : ((deO & bit) ? '#4ec9a8' : '#14101c');
      ctx.fill();
    }
  }

  if (notasVisiveis) {
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let c = 0; c < t.colunas; c++) {
      const v = notasVisiveis[c];
      ctx.fillStyle = v === null ? '#5b5270' : (v > 0 ? '#4ec9a8' : (v < 0 ? '#d4536f' : '#a79cbe'));
      ctx.fillText(v === null ? '—' : (v > 0 ? '+' + v : String(v)),
        MARGEM + c * PASSO + PASSO / 2, MARGEM / 2);
    }
  }
}

function terminou() {
  // quem acabou de jogar e o complemento da posicao atual
  if (alinhou(t, posicao ^ mascara)) return 'vitoria';
  if (jogadas(t, mascara) === t.casas) return 'empate';
  return null;
}

function soltar(c) {
  if (!cabe(t, mascara, c)) return;
  const quemJogou = vez;
  [posicao, mascara] = jogar(t, posicao, mascara, c);
  vez = 1 - vez;
  notasVisiveis = null;
  desenhar();
  const fim = terminou();
  if (fim) {
    acabou = true;
    estado.innerHTML = fim === 'empate'
      ? 'Empate — como a tabela prometia.'
      : (quemJogou === humano
        ? '<span class="ok">Você ganhou.</span>'
        : 'Ele ganhou. Estava escrito na nota do tabuleiro.');
    return;
  }
  if (vez === 1) setTimeout(jogarComputador, 300);
}

function jogarComputador() {
  if (acabou) return;
  soltar(melhorLance(t, posicao, mascara).coluna);
}

tela.addEventListener('click', (ev) => {
  if (acabou || vez !== humano) return;
  const r = tela.getBoundingClientRect();
  const x = (ev.clientX - r.left) * (tela.width / r.width) - MARGEM;
  const c = Math.floor(x / PASSO);
  if (c >= 0 && c < t.colunas) soltar(c);
});

document.getElementById('novo').addEventListener('click', novo);
document.getElementById('tamanho').addEventListener('change', novo);
document.getElementById('quem').addEventListener('change', novo);

document.getElementById('notas').addEventListener('click', () => {
  if (acabou) return;
  notasVisiveis = [];
  for (let c = 0; c < t.colunas; c++) {
    if (!cabe(t, mascara, c)) { notasVisiveis.push(null); continue; }
    const [p2, m2] = jogar(t, posicao, mascara, c);
    if (alinhou(t, p2 ^ m2)) { notasVisiveis.push(notaDeVitoria(t, mascara)); continue; }
    notasVisiveis.push(-resolver(t, p2, m2, 'ordenada').nota);
  }
  desenhar();
  estado.innerHTML = 'A nota de cada coluna para quem joga agora. '
    + 'Verde ganha, vermelho perde, cinza empata — e não é opinião, é a varredura inteira.';
});

novo();
