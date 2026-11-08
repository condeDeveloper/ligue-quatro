import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TABULEIROS, TABULEIROS_JUIZ, TABULEIROS_PODA, TABULEIROS_ALINHAMENTO,
  linhaResultado, linhaPoda, linhaJuiz, linhaAlinhamento, linhaAberturas, linhaEspelho,
} from '../js/medidas.js';

// Os numeros do README, presos.

const RESULTADOS = {
  '4x3': { casas: 12, nota: 0, nos: 2057 },
  '5x3': { casas: 15, nota: 0, nos: 35879 },
  '6x3': { casas: 18, nota: 0, nos: 500134 },
  '7x3': { casas: 21, nota: 0, nos: 7560392 },
  '4x4': { casas: 16, nota: 0, nos: 53149 },
  '5x4': { casas: 20, nota: 0, nos: 1043567 },
  '6x4': { casas: 24, nota: -1, nos: 40812590 },
  '4x5': { casas: 20, nota: 0, nos: 323796 },
  '5x5': { casas: 25, nota: 0, nos: 46552869 },
  '4x6': { casas: 24, nota: 0, nos: 8208678 },
};

test('o valor exato de cada tabuleiro', { timeout: 900000 }, () => {
  for (const [nome, alvo] of Object.entries(RESULTADOS)) {
    const [c, l] = nome.split('x').map(Number);
    const r = linhaResultado(c, l);
    assert.equal(r.casas, alvo.casas, nome + ' casas');
    assert.equal(r.nota, alvo.nota, nome + ' nota');
    assert.equal(r.nos, alvo.nos, nome + ' nos');
  }
});

test('nove dos dez tabuleiros empatam, e so o 6x4 tem vencedor', { timeout: 900000 }, () => {
  const empates = TABULEIROS.filter(([c, l]) => linhaResultado(c, l).nota === 0);
  assert.equal(empates.length, 9);
  assert.equal(linhaResultado(6, 4).quemGanha, 'segundo');
});

const PODA = {
  '4x3': { completa: 22601, poda: 2057, ordenada: 2057 },
  '5x3': { completa: 340782, poda: 87337, ordenada: 35879 },
  '6x3': { completa: 4871045, poda: 1734430, ordenada: 500134 },
  '4x4': { completa: 236995, poda: 16377, ordenada: 53149 },
  '5x4': { completa: 5556135, poda: 3530493, ordenada: 1043567 },
  '4x5': { completa: 2121731, poda: 192651, ordenada: 323796 },
};

test('quantos nos cada busca visita', { timeout: 900000 }, () => {
  for (const [nome, alvo] of Object.entries(PODA)) {
    const [c, l] = nome.split('x').map(Number);
    const r = linhaPoda(c, l);
    assert.equal(r.completa, alvo.completa, nome + ' completa');
    assert.equal(r.poda, alvo.poda, nome + ' poda');
    assert.equal(r.ordenada, alvo.ordenada, nome + ' ordenada');
    assert.equal(r.mesmaNota, true, nome + ' as tres dao a mesma nota');
  }
});

test('a ordem do centro para fora PIORA os tabuleiros de quatro colunas', { timeout: 900000 }, () => {
  // em todo tabuleiro de cinco colunas ou mais ela corta; nos dois de quatro
  // ela aumenta o trabalho. A nota nunca muda.
  const quatro = [linhaPoda(4, 4), linhaPoda(4, 5)];
  for (const r of quatro) assert.ok(r.ordenada > r.poda, r.tabuleiro + ' deveria piorar');
  assert.equal((linhaPoda(4, 4).ordenada / linhaPoda(4, 4).poda).toFixed(1), '3.2');
  assert.equal((linhaPoda(4, 5).ordenada / linhaPoda(4, 5).poda).toFixed(1), '1.7');

  const largos = [linhaPoda(5, 3), linhaPoda(6, 3), linhaPoda(5, 4)];
  for (const r of largos) assert.ok(r.ordenada < r.poda, r.tabuleiro + ' deveria cortar');
  assert.equal((linhaPoda(6, 3).poda / linhaPoda(6, 3).ordenada).toFixed(1), '3.5');
});

test('o bitboard e a grade dao a mesma nota nos tabuleiros que a grade alcanca', { timeout: 900000 }, () => {
  for (const [c, l] of TABULEIROS_JUIZ) {
    assert.equal(linhaJuiz(c, l).bate, true, c + 'x' + l);
  }
  // o juiz em grade nao alcanca 24 casas: o Map do JavaScript enche antes
  assert.equal(TABULEIROS_JUIZ.every(([c, l]) => c * l <= 20), true);
});

const ALINHAMENTO = {
  '4x3': 12031,
  '5x3': 158911,
  '4x4': 161029,
  '6x3': 2087325,
  '5x4': 3945711,
};

test('os dois testes de quatro em linha nunca discordam', { timeout: 900000 }, () => {
  let total = 0;
  for (const [c, l] of TABULEIROS_ALINHAMENTO) {
    const r = linhaAlinhamento(c, l);
    assert.equal(r.divergencias, 0, c + 'x' + l);
    assert.equal(r.posicoes, ALINHAMENTO[c + 'x' + l], c + 'x' + l + ' posicoes');
    total += r.posicoes;
  }
  assert.equal(total, 6365007);
});

const ABERTURAS = {
  '4x3': [0, 0, 0, 0],
  '5x3': [0, 0, 0, 0, 0],
  '6x3': [0, 0, 0, 0, 0, 0],
  '7x3': [0, 0, 0, 0, 0, 0, 0],
  '4x4': [0, 0, 0, 0],
  '5x4': [-1, 0, 0, 0, -1],
  '6x4': [-1, -1, -1, -1, -1, -1],
  '4x5': [0, 0, 0, 0],
  '5x5': [0, 0, 0, 0, 0],
  '4x6': [0, 0, 0, 0],
};

test('a nota de cada coluna de abertura', { timeout: 900000 }, () => {
  for (const [nome, alvo] of Object.entries(ABERTURAS)) {
    const [c, l] = nome.split('x').map(Number);
    assert.deepEqual(linhaAberturas(c, l).notas, alvo, nome);
  }
});

test('no 5x4 as duas colunas de borda perdem e as tres do meio empatam', { timeout: 900000 }, () => {
  const r = linhaAberturas(5, 4);
  assert.equal(r.naoPerdem, 3);
  assert.equal(r.ganham, 0, 'nenhuma abertura ganha');
});

test('no 6x4 toda abertura perde', { timeout: 900000 }, () => {
  const r = linhaAberturas(6, 4);
  assert.equal(r.naoPerdem, 0);
  assert.deepEqual(r.notas, [-1, -1, -1, -1, -1, -1]);
});

test('o tabuleiro espelhado vale o mesmo em todos os dez', { timeout: 900000 }, () => {
  for (const [c, l] of TABULEIROS) {
    assert.equal(linhaEspelho(c, l).simetrico, true, c + 'x' + l);
  }
});
