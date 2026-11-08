// O juiz: o mesmo jogo escrito do jeito ingenuo, numa grade de verdade.
//
// Nada aqui sabe o que e um bitboard. A grade e um vetor de vetores, o quatro
// em linha e procurado andando casa por casa nas quatro direcoes, e a busca e
// um negamax sem poda, sem ordem e sem tabela. E lento de proposito: o que ele
// tem de bom e nao compartilhar uma linha de codigo com o solucionador.
//
// Se os dois discordam numa posicao, um dos dois esta errado — e a grade e
// facil de conferir no olho, o bitboard nao.

const DIRECOES = [[1, 0], [0, 1], [1, 1], [1, -1]];

/** Uma grade vazia de `colunas` x `linhas`. */
export function grade(colunas, linhas) {
  return { colunas, linhas, casas: Array.from({ length: colunas }, () => []) };
}

export function copiar(g) {
  return { colunas: g.colunas, linhas: g.linhas, casas: g.casas.map((c) => [...c]) };
}

export function cabeNaGrade(g, c) {
  return g.casas[c].length < g.linhas;
}

export function jogarNaGrade(g, c, jogador) {
  const novo = copiar(g);
  novo.casas[c].push(jogador);
  return novo;
}

/** Tem quatro em linha do jogador `jogador`? Procurado casa por casa. */
export function quatroEmLinha(g, jogador) {
  const dentro = (c, r) => c >= 0 && c < g.colunas && r >= 0 && r < g.linhas;
  const quem = (c, r) => (r < g.casas[c].length ? g.casas[c][r] : null);
  for (let c = 0; c < g.colunas; c++) {
    for (let r = 0; r < g.linhas; r++) {
      if (quem(c, r) !== jogador) continue;
      for (const [dc, dr] of DIRECOES) {
        let n = 1;
        let cc = c + dc;
        let rr = r + dr;
        while (dentro(cc, rr) && quem(cc, rr) === jogador) { n++; cc += dc; rr += dr; }
        if (n >= 4) return true;
      }
    }
  }
  return false;
}

export function cheia(g) {
  return g.casas.every((c) => c.length === g.linhas);
}

export function pecas(g) {
  return g.casas.reduce((a, c) => a + c.length, 0);
}

/** A grade serializada: as colunas de baixo para cima, separadas por barra. */
export function chaveDaGrade(g) {
  return g.casas.map((c) => c.join('')).join('/');
}

/**
 * A nota da posicao para `jogador`, por negamax na grade.
 *
 * Sem poda, sem ordem de coluna e sem bitboard: ele abre TODO lance legal de
 * toda posicao. A unica concessao e guardar o que ja calculou, porque sem isso
 * nem o 4x3 termina — e o que importa para o juiz nao e ser lento, e nao
 * compartilhar representacao com o solucionador.
 *
 * A nota e a mesma do solucionador — pecas que sobram para quem ganha — para
 * os dois numeros poderem ser comparados direto.
 *
 * LIMITE: o `Map` do JavaScript para em 2^24 entradas, e e ai que este juiz
 * para tambem. Na pratica ele alcanca tabuleiros de ate 20 casas. Acima disso
 * ele falha com uma mensagem, em vez de devolver meia resposta.
 */
export function notaNaGrade(g, jogador, memo = new Map()) {
  const casas = g.colunas * g.linhas;
  const chave = chaveDaGrade(g);
  const guardado = memo.get(chave);
  if (guardado !== undefined) return guardado;

  let resposta = null;
  for (let c = 0; c < g.colunas && resposta === null; c++) {
    if (!cabeNaGrade(g, c)) continue;
    if (quatroEmLinha(jogarNaGrade(g, c, jogador), jogador)) {
      resposta = Math.floor((casas + 1 - pecas(g)) / 2);
    }
  }
  if (resposta === null && cheia(g)) resposta = 0;
  if (resposta === null) {
    let melhor = -1000;
    for (let c = 0; c < g.colunas; c++) {
      if (!cabeNaGrade(g, c)) continue;
      // a peca que entra e de QUEM ESTA JOGANDO; quem troca de lado e a
      // chamada de dentro. Trocar nos dois lugares da um jogo em que cada um
      // joga pelo outro, e ele responde com a maior cara de certo.
      const nota = -notaNaGrade(jogarNaGrade(g, c, jogador), 1 - jogador, memo);
      if (nota > melhor) melhor = nota;
    }
    resposta = melhor | 0;  // -0 vira 0, pelo mesmo motivo do solucionador
  }
  if (memo.size >= 16000000) {
    throw new Error('o juiz em grade nao alcanca este tabuleiro: o Map encheu');
  }
  memo.set(chave, resposta);
  return resposta;
}

/**
 * O teste de alinhamento do bitboard conferido contra o da grade, em TODAS as
 * posicoes alcancaveis de um tabuleiro.
 *
 * E a conferencia que pega o erro classico do bitboard: um alinhamento que
 * atravessa a borda de uma coluna e continua na seguinte como se o tabuleiro
 * desse a volta. As duas representacoes andam juntas, lance a lance: a grade
 * de um lado, os dois bitboards do outro.
 */
export function conferirAlinhamento(t, alinhou) {
  let divergencias = 0;
  const vistas = new Set();

  const visitar = (g, pedras, vez) => {
    const chave = chaveDaGrade(g);
    if (vistas.has(chave)) return;
    vistas.add(chave);

    for (const j of [0, 1]) {
      if (alinhou(t, pedras[j]) !== quatroEmLinha(g, j)) divergencias++;
    }
    if (quatroEmLinha(g, 0) || quatroEmLinha(g, 1) || cheia(g)) return;
    for (let c = 0; c < g.colunas; c++) {
      if (!cabeNaGrade(g, c)) continue;
      const bit = 1 << (c * t.altura + g.casas[c].length);
      const novas = [...pedras];
      novas[vez] |= bit;
      visitar(jogarNaGrade(g, c, vez), novas, 1 - vez);
    }
  };

  visitar(grade(t.colunas, t.linhas), [0, 0], 0);
  return { posicoes: vistas.size, divergencias };
}
