import test from 'node:test';
import assert from 'node:assert/strict';

import { tabuleiro, cabe, jogar, alinhou, ganhaJogando, jogadas, desenhar } from '../js/tabuleiro.js';
import { resolver, melhorLance, notaDeVitoria } from '../js/solucionador.js';
import { grade, jogarNaGrade, quatroEmLinha, notaNaGrade, conferirAlinhamento } from '../js/juiz.js';

test('cada coluna ocupa linhas+1 bits, e a sentinela fica vazia', () => {
  const t = tabuleiro(5, 4);
  assert.equal(t.altura, 5);
  assert.equal(t.bits, 25);
  assert.equal(t.casas, 20);
  // a sentinela de cada coluna nunca entra no `tudo`
  for (let c = 0; c < 5; c++) {
    assert.equal((t.tudo >> (c * t.altura + 4)) & 1, 0, 'sentinela da coluna ' + c);
  }
});

test('a ordem das colunas vai do centro para fora', () => {
  assert.deepEqual(tabuleiro(7, 3).ordem, [3, 2, 4, 1, 5, 0, 6]);
  assert.deepEqual(tabuleiro(4, 4).ordem, [1, 2, 0, 3]);
});

test('jogar troca o lado usando a mascara VELHA', () => {
  // o erro de usar a mascara nova entrega a peca recem-jogada ao adversario.
  // O tabuleiro continua valido e as respostas saem todas trocadas.
  const t = tabuleiro(4, 4);
  const [p1, m1] = jogar(t, 0, 0, 0);
  assert.equal(p1, 0, 'quem vai jogar agora e o outro, e ele nao tem peca');
  assert.equal(m1, 1, 'a peca esta no tabuleiro');
  assert.equal(p1 ^ m1, 1, 'e ela e de quem acabou de jogar');
});

test('a coluna enche e para de aceitar peca', () => {
  const t = tabuleiro(4, 3);
  let p = 0;
  let m = 0;
  for (let i = 0; i < 3; i++) {
    assert.equal(cabe(t, m, 0), true, 'ainda cabe na jogada ' + i);
    [p, m] = jogar(t, p, m, 0);
  }
  assert.equal(cabe(t, m, 0), false);
  assert.equal(cabe(t, m, 1), true);
});

test('quatro na vertical, na horizontal e nas duas diagonais', () => {
  const t = tabuleiro(4, 4);
  const bit = (c, r) => 1 << (c * t.altura + r);
  const vertical = bit(0, 0) | bit(0, 1) | bit(0, 2) | bit(0, 3);
  const horizontal = bit(0, 0) | bit(1, 0) | bit(2, 0) | bit(3, 0);
  const subindo = bit(0, 0) | bit(1, 1) | bit(2, 2) | bit(3, 3);
  const descendo = bit(0, 3) | bit(1, 2) | bit(2, 1) | bit(3, 0);
  for (const [nome, p] of [['vertical', vertical], ['horizontal', horizontal],
    ['subindo', subindo], ['descendo', descendo]]) {
    assert.equal(alinhou(t, p), true, nome);
  }
  assert.equal(alinhou(t, bit(0, 0) | bit(1, 0) | bit(2, 0)), false, 'tres nao bastam');
});

test('o alinhamento nao atravessa a borda de uma coluna', () => {
  // tres no topo da coluna 0 e um na base da coluna 1 ficam vizinhos nos bits,
  // e seriam um "quatro" para quem esquecesse a sentinela.
  const t = tabuleiro(4, 3);
  const bit = (c, r) => 1 << (c * t.altura + r);
  assert.equal(alinhou(t, bit(0, 0) | bit(0, 1) | bit(0, 2) | bit(1, 0)), false);
});

test('os dois testes de quatro em linha concordam em toda posicao de tres tabuleiros', () => {
  for (const [c, l] of [[4, 3], [5, 3], [4, 4]]) {
    const t = tabuleiro(c, l);
    const r = conferirAlinhamento(t, alinhou);
    assert.equal(r.divergencias, 0, c + 'x' + l);
    assert.ok(r.posicoes > 10000, c + 'x' + l + ' visitou posicoes de verdade');
  }
});

test('ganhaJogando ve a vitoria que o lance cria, nao a que ja existe', () => {
  const t = tabuleiro(4, 3);
  let p = 0;
  let m = 0;
  // tres pecas na coluna 0 de quem comeca, intercaladas com a coluna 1
  for (const c of [0, 1, 0, 1]) [p, m] = jogar(t, p, m, c);
  // agora e a vez de quem tem duas na coluna 0; a terceira nao fecha nada em 3 linhas
  assert.equal(ganhaJogando(t, p, m, 0), false);
});

test('a nota de vitoria cai conforme o tabuleiro enche', () => {
  const t = tabuleiro(4, 4);
  assert.equal(notaDeVitoria(t, 0), Math.floor((16 + 1) / 2));
  let p = 0;
  let m = 0;
  for (const c of [0, 1, 2, 3]) [p, m] = jogar(t, p, m, c);
  assert.equal(jogadas(t, m), 4);
  assert.equal(notaDeVitoria(t, m), Math.floor((16 + 1 - 4) / 2));
});

test('as tres buscas dao a mesma nota', () => {
  for (const [c, l] of [[4, 3], [5, 3], [4, 4]]) {
    const t = tabuleiro(c, l);
    const a = resolver(t, 0, 0, 'completa').nota;
    const b = resolver(t, 0, 0, 'poda').nota;
    const d = resolver(t, 0, 0, 'ordenada').nota;
    assert.equal(a, b, c + 'x' + l + ' completa x poda');
    assert.equal(b, d, c + 'x' + l + ' poda x ordem');
  }
});

test('a busca no bitboard e a busca na grade dao a mesma nota', () => {
  for (const [c, l] of [[4, 3], [5, 3], [4, 4]]) {
    const t = tabuleiro(c, l);
    assert.equal(resolver(t, 0, 0, 'ordenada').nota, notaNaGrade(grade(c, l), 0), c + 'x' + l);
  }
});

test('um modo de busca desconhecido e recusado', () => {
  assert.throws(() => resolver(tabuleiro(4, 3), 0, 0, 'chute'), /modo desconhecido/);
});

test('tabuleiro que nao cabe em 31 bits e recusado', () => {
  // o 7x6 de caixinha daria 7 x 7 = 49 bits
  assert.throws(() => tabuleiro(7, 6), /nao cabe em 31/);
});

test('o melhor lance e sempre uma coluna que ainda aceita peca', () => {
  const t = tabuleiro(4, 3);
  let p = 0;
  let m = 0;
  for (const c of [0, 0, 0]) [p, m] = jogar(t, p, m, c);
  const r = melhorLance(t, p, m);
  assert.notEqual(r.coluna, 0, 'a coluna cheia nao pode ser escolhida');
  assert.equal(cabe(t, m, r.coluna), true);
});

test('a grade do juiz detecta as mesmas quatro direcoes', () => {
  let g = grade(4, 4);
  for (const c of [0, 1, 2]) g = jogarNaGrade(g, c, 0);
  assert.equal(quatroEmLinha(g, 0), false);
  g = jogarNaGrade(g, 3, 0);
  assert.equal(quatroEmLinha(g, 0), true);
  assert.equal(quatroEmLinha(g, 1), false);
});

test('o desenho mostra quem jogou primeiro como x', () => {
  const t = tabuleiro(4, 3);
  const [p, m] = jogar(t, 0, 0, 0);
  assert.equal(desenhar(t, p, m).split('\n').pop(), 'x...');
});
