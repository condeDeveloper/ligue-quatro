// As tabelas do README, uma funcao por linha.

import { tabuleiro, alinhou } from './tabuleiro.js';
import { resolver, aberturas } from './solucionador.js';
import { grade, notaNaGrade, conferirAlinhamento } from './juiz.js';

// Todo tabuleiro em que `colunas * (linhas + 1)` cabe em 31 bits e a varredura
// termina. O 7x6 do jogo de caixinha nao entra em nenhuma das duas contas: sao
// 4,5 trilhoes de posicoes, e esta tabela nao vai fingir que sabe o valor dele.
export const TABULEIROS = [
  [4, 3], [5, 3], [6, 3], [7, 3],
  [4, 4], [5, 4], [6, 4],
  [4, 5], [5, 5],
  [4, 6],
];

export const TABULEIROS_JUIZ = [[4, 3], [5, 3], [4, 4], [5, 4], [4, 5]];
export const TABULEIROS_PODA = [[4, 3], [5, 3], [6, 3], [4, 4], [5, 4], [4, 5]];
export const TABULEIROS_ALINHAMENTO = [[4, 3], [5, 3], [4, 4], [6, 3], [5, 4]];

const nome = (c, l) => c + 'x' + l;

/** Uma linha do resultado: quem ganha o tabuleiro vazio, e em quantos nos. */
export function linhaResultado(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const r = resolver(t, 0, 0, 'ordenada');
  return {
    tabuleiro: nome(colunas, linhas),
    casas: t.casas,
    nota: r.nota,
    nos: r.nos,
    quemGanha: r.nota > 0 ? 'primeiro' : (r.nota < 0 ? 'segundo' : 'empate'),
  };
}

/** Uma linha da poda: quantos nos cada versao da busca visita. */
export function linhaPoda(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const completa = resolver(t, 0, 0, 'completa');
  const poda = resolver(t, 0, 0, 'poda');
  const ordenada = resolver(t, 0, 0, 'ordenada');
  return {
    tabuleiro: nome(colunas, linhas),
    completa: completa.nos,
    poda: poda.nos,
    ordenada: ordenada.nos,
    ganhoDaPoda: completa.nos / poda.nos,
    ganhoDaOrdem: poda.nos / ordenada.nos,
    mesmaNota: completa.nota === poda.nota && poda.nota === ordenada.nota,
  };
}

/** Uma linha da conferencia: o bitboard contra a grade. */
export function linhaJuiz(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const peloBitboard = resolver(t, 0, 0, 'ordenada').nota;
  const pelaGrade = notaNaGrade(grade(colunas, linhas), 0);
  return { tabuleiro: nome(colunas, linhas), peloBitboard, pelaGrade, bate: peloBitboard === pelaGrade };
}

/** Uma linha do alinhamento: as duas deteccoes de quatro em linha, em todas as posicoes. */
export function linhaAlinhamento(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const r = conferirAlinhamento(t, alinhou);
  return { tabuleiro: nome(colunas, linhas), ...r };
}

/** A nota de cada coluna de abertura. */
export function linhaAberturas(colunas, linhas) {
  const t = tabuleiro(colunas, linhas);
  const notas = aberturas(t);
  return {
    tabuleiro: nome(colunas, linhas),
    notas,
    naoPerdem: notas.filter((n) => n >= 0).length,
    ganham: notas.filter((n) => n > 0).length,
  };
}

/** O tabuleiro espelhado tem que valer o mesmo. */
export function linhaEspelho(colunas, linhas) {
  const notas = aberturas(tabuleiro(colunas, linhas));
  const espelhadas = [...notas].reverse();
  return {
    tabuleiro: nome(colunas, linhas),
    notas,
    simetrico: notas.every((n, i) => n === espelhadas[i]),
  };
}
