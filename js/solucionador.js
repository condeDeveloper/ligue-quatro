// O valor exato da posicao, por busca completa com poda alfa-beta.
//
// A nota e contada em pecas: se quem joga agora ganha, a nota e quantas pecas
// ele AINDA teria para jogar depois da vitoria. Ganhar cedo vale mais do que
// ganhar tarde, empate vale zero, e perder vale o negativo. Assim a nota diz
// quem ganha E em quanto tempo, com um numero so.

import { cabe, jogar, ganhaJogando, jogadas, alinhou } from './tabuleiro.js';

/** A nota de uma vitoria imediata para quem esta jogando agora. */
export function notaDeVitoria(t, mascara) {
  return Math.floor((t.casas + 1 - jogadas(t, mascara)) / 2);
}

function criar(t) {
  return { nos: 0, tabela: new Map(), limite: 1 << 22 };
}

/**
 * Negamax com poda alfa-beta e tabela de transposicao.
 *
 * `ordenar` liga ou desliga a ordem do centro para fora; `podar` liga ou
 * desliga a poda. Os dois existem para medir o que cada um corta — com os dois
 * desligados isto vira a busca ingenua, e as duas tem que dar a MESMA nota.
 */
function buscar(t, posicao, mascara, alfa, beta, est, opcoes) {
  est.nos++;

  // empate: acabou o tabuleiro
  if (jogadas(t, mascara) === t.casas) return 0;

  // vitoria em um lance
  for (const c of opcoes.ordenar ? t.ordem : [...Array(t.colunas).keys()]) {
    if (cabe(t, mascara, c) && ganhaJogando(t, posicao, mascara, c)) {
      return notaDeVitoria(t, mascara);
    }
  }

  const chave = posicao + mascara;
  if (opcoes.tabela) {
    const guardado = est.tabela.get(chave);
    if (guardado !== undefined) return guardado;
  }

  // o melhor que ainda e possivel: ninguem ganha antes do proximo lance
  const tetoReal = Math.floor((t.casas - 1 - jogadas(t, mascara)) / 2);
  let teto = tetoReal;
  if (opcoes.podar && beta > teto) {
    beta = teto;
    if (alfa >= beta) return beta;
  }

  let melhor = -1000;
  for (const c of opcoes.ordenar ? t.ordem : [...Array(t.colunas).keys()]) {
    if (!cabe(t, mascara, c)) continue;
    const [p2, m2] = jogar(t, posicao, mascara, c);
    const nota = -buscar(t, p2, m2, -beta, -alfa, est, opcoes);
    if (nota > melhor) melhor = nota;
    if (nota > alfa) alfa = nota;
    if (opcoes.podar && alfa >= beta) break;
  }

  if (opcoes.tabela && !opcoes.podar && est.tabela.size < est.limite) {
    est.tabela.set(chave, melhor);
  }
  // `| 0` troca -0 por 0. A negacao de um empate da -0, que e igual a 0 para o
  // `===` da linguagem e diferente para um teste estrito — e ai a mesma
  // posicao responde duas coisas conforme o caminho por onde ela foi achada.
  return melhor | 0;
}

/**
 * A nota da posicao vazia, com o numero de nos visitados.
 *
 * `modo` escolhe o que esta ligado:
 *   'completa'  sem poda e sem ordem: a busca ingenua
 *   'poda'      poda alfa-beta, colunas da esquerda para a direita
 *   'ordenada'  poda alfa-beta com as colunas do centro para fora
 */
export function resolver(t, posicao = 0, mascara = 0, modo = 'ordenada') {
  const opcoes = {
    completa: { podar: false, ordenar: false, tabela: true },
    poda: { podar: true, ordenar: false, tabela: false },
    ordenada: { podar: true, ordenar: true, tabela: false },
  }[modo];
  if (!opcoes) throw new Error('modo desconhecido: ' + modo);
  const est = criar(t);
  const nota = buscar(t, posicao, mascara, -1000, 1000, est, opcoes);
  return { nota, nos: est.nos };
}

/** A nota de cada coluna de abertura, da esquerda para a direita. */
export function aberturas(t) {
  const saida = [];
  for (let c = 0; c < t.colunas; c++) {
    const [p, m] = jogar(t, 0, 0, c);
    // a nota devolvida e do adversario; a de quem abriu e o negativo.
    // O `| 0` e de novo contra o -0: negar um empate nao pode virar outro numero.
    saida.push(-resolver(t, p, m, 'ordenada').nota | 0);
  }
  return saida;
}

/** O melhor lance de uma posicao e a nota dele, para a pagina. */
export function melhorLance(t, posicao, mascara) {
  let melhor = -1000;
  let escolha = -1;
  for (const c of t.ordem) {
    if (!cabe(t, mascara, c)) continue;
    if (ganhaJogando(t, posicao, mascara, c)) return { coluna: c, nota: notaDeVitoria(t, mascara) };
    const [p2, m2] = jogar(t, posicao, mascara, c);
    const nota = -resolver(t, p2, m2, 'ordenada').nota | 0;
    if (nota > melhor) { melhor = nota; escolha = c; }
  }
  return { coluna: escolha, nota: melhor };
}

/** Quem esta jogando ja ganhou? Serve para a pagina e para os testes. */
export function jaGanhou(t, posicao, mascara) {
  return alinhou(t, posicao ^ mascara);
}
