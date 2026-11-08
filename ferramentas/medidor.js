#!/usr/bin/env node
// O medidor: roda as tabelas e cospe os numeros que vao para o README.
//
//   node ferramentas/medidor.js            todas
//   node ferramentas/medidor.js resultado  so uma

import {
  TABULEIROS, TABULEIROS_JUIZ, TABULEIROS_PODA, TABULEIROS_ALINHAMENTO,
  linhaResultado, linhaPoda, linhaJuiz, linhaAlinhamento, linhaAberturas, linhaEspelho,
} from '../js/medidas.js';

const n = (x) => x.toLocaleString('pt-BR');
const vezes = (x) => x.toFixed(1).replace('.', ',') + 'x';
const sinal = (x) => (x > 0 ? '+' : '') + x;

function titulo(t) {
  console.log('');
  console.log(t);
  console.log('-'.repeat(t.length));
}

function resultado() {
  titulo('O valor exato de cada tabuleiro');
  console.log('tabuleiro  casas  nota  quem ganha  nos visitados');
  for (const [c, l] of TABULEIROS) {
    const r = linhaResultado(c, l);
    console.log(
      r.tabuleiro.padEnd(11)
      + String(r.casas).padStart(5) + '  '
      + sinal(r.nota).padStart(4) + '  '
      + r.quemGanha.padStart(10) + '  '
      + n(r.nos).padStart(13),
    );
  }
  console.log('');
  console.log('O 7x6 do jogo de caixinha NAO esta aqui: sao 4,5 trilhoes de posicoes.');
}

function poda() {
  titulo('O que a poda corta, e o que a ordem das colunas corta depois dela');
  console.log('tabuleiro  busca completa  com poda      com ordem     poda    ordem   mesma nota');
  for (const [c, l] of TABULEIROS_PODA) {
    const r = linhaPoda(c, l);
    console.log(
      r.tabuleiro.padEnd(11)
      + n(r.completa).padStart(14) + '  '
      + n(r.poda).padStart(12) + '  '
      + n(r.ordenada).padStart(12) + '  '
      + vezes(r.ganhoDaPoda).padStart(6) + '  '
      + vezes(r.ganhoDaOrdem).padStart(6) + '  '
      + (r.mesmaNota ? 'sim' : 'NAO'),
    );
  }
}

function juiz() {
  titulo('Conferencia: o bitboard contra a grade');
  console.log('tabuleiro  bitboard  grade  bate');
  for (const [c, l] of TABULEIROS_JUIZ) {
    const r = linhaJuiz(c, l);
    console.log(
      r.tabuleiro.padEnd(11)
      + sinal(r.peloBitboard).padStart(8) + '  '
      + sinal(r.pelaGrade).padStart(5) + '  '
      + (r.bate ? 'sim' : 'NAO'),
    );
  }
}

function alinhamento() {
  titulo('Os dois testes de quatro em linha, em todas as posicoes alcancaveis');
  console.log('tabuleiro  posicoes      divergencias');
  for (const [c, l] of TABULEIROS_ALINHAMENTO) {
    const r = linhaAlinhamento(c, l);
    console.log(r.tabuleiro.padEnd(11) + n(r.posicoes).padStart(12) + '  ' + String(r.divergencias).padStart(12));
  }
}

function abertura() {
  titulo('A nota de cada coluna de abertura');
  console.log('tabuleiro  notas por coluna            aberturas que nao perdem');
  for (const [c, l] of TABULEIROS) {
    const r = linhaAberturas(c, l);
    console.log(
      r.tabuleiro.padEnd(11)
      + r.notas.map((x) => sinal(x).padStart(3)).join(' ').padEnd(28)
      + String(r.naoPerdem) + ' de ' + r.notas.length,
    );
  }
}

function espelho() {
  titulo('O tabuleiro espelhado vale o mesmo');
  console.log('tabuleiro  simetrico');
  for (const [c, l] of TABULEIROS) {
    const r = linhaEspelho(c, l);
    console.log(r.tabuleiro.padEnd(11) + (r.simetrico ? 'sim' : 'NAO'));
  }
}

const tabelas = { alinhamento, juiz, poda, espelho, resultado, abertura };
const pedido = process.argv[2];
if (pedido) {
  if (!tabelas[pedido]) {
    console.error('tabela desconhecida: ' + pedido);
    console.error('as que existem: ' + Object.keys(tabelas).join(', '));
    process.exit(1);
  }
  tabelas[pedido]();
} else {
  for (const t of Object.values(tabelas)) t();
}
console.log('');
