// O tabuleiro do Ligue 4, em dois numeros.
//
// Cada coluna ocupa `linhas + 1` bits: as `linhas` casas e um bit extra de
// sentinela, que fica sempre em zero. A sentinela e o truque que faz o teste
// de quatro em linha funcionar sem conferir borda: um alinhamento que fosse
// "passar" de uma coluna para a outra bate na sentinela e morre.
//
//   posicao   as pecas de quem joga agora
//   mascara   as pecas dos dois
//
// A posicao do adversario e `posicao ^ mascara`. `posicao + mascara` identifica
// a posicao inteira num numero so, e e essa a chave da tabela de transposicao.

/** Prepara as constantes de um tabuleiro de `colunas` x `linhas`. */
export function tabuleiro(colunas, linhas) {
  const altura = linhas + 1;
  const bits = colunas * altura;
  // Um bitboard de mais de 31 bits nao cabe nos operadores de bit do
  // JavaScript, que trabalham em 32 bits com sinal. Falhar aqui e melhor do
  // que calcular em silencio com o bit de cima estourado.
  if (bits > 31) throw new Error('tabuleiro de ' + bits + ' bits nao cabe em 31');

  // a base de cada coluna e a coluna cheia, para o teste de coluna lotada
  const baseDaColuna = [];
  const topoDaColuna = [];
  for (let c = 0; c < colunas; c++) {
    baseDaColuna.push(1 << (c * altura));
    topoDaColuna.push(1 << (c * altura + linhas - 1));
  }
  let tudo = 0;
  for (let c = 0; c < colunas; c++) {
    for (let r = 0; r < linhas; r++) tudo |= 1 << (c * altura + r);
  }

  // a ordem em que as colunas sao tentadas: do centro para fora. Nao muda
  // nenhuma resposta; muda quantos nos a poda visita, e muito.
  const ordem = [...Array(colunas).keys()].sort(
    (a, b) => Math.abs(a - (colunas - 1) / 2) - Math.abs(b - (colunas - 1) / 2),
  );

  return { colunas, linhas, altura, bits, casas: colunas * linhas, baseDaColuna, topoDaColuna, tudo, ordem };
}

/** A coluna aceita mais uma peca? */
export function cabe(t, mascara, c) {
  return (mascara & t.topoDaColuna[c]) === 0;
}

/**
 * Jogar na coluna c. Devolve [posicaoNova, mascaraNova], ja na vez do outro.
 *
 * A troca de lado usa a mascara VELHA: `posicao ^ mascara` sao as pecas do
 * adversario antes do lance, e e isso que vira a posicao dele. Usar a mascara
 * nova entregaria a peca recem-jogada ao adversario — o tabuleiro continua
 * valido, a busca continua rodando, e as respostas saem todas trocadas.
 */
export function jogar(t, posicao, mascara, c) {
  const nova = mascara | (mascara + t.baseDaColuna[c]);
  return [posicao ^ mascara, nova];
}

/** O bitboard tem quatro em linha? */
export function alinhou(t, p) {
  const h = t.altura;
  // vertical
  let m = p & (p >> 1);
  if (m & (m >> 2)) return true;
  // horizontal
  m = p & (p >> h);
  if (m & (m >> (2 * h))) return true;
  // diagonal \
  m = p & (p >> (h - 1));
  if (m & (m >> (2 * (h - 1)))) return true;
  // diagonal /
  m = p & (p >> (h + 1));
  if (m & (m >> (2 * (h + 1)))) return true;
  return false;
}

/** Jogar em c faz quatro em linha agora? */
export function ganhaJogando(t, posicao, mascara, c) {
  const [nova, mascaraNova] = jogar(t, posicao, mascara, c);
  // `nova` ja e a posicao do OUTRO; quem acabou de jogar e o complemento
  return alinhou(t, nova ^ mascaraNova);
}

/** Quantas pecas ja estao no tabuleiro. */
export function jogadas(t, mascara) {
  let n = 0;
  let m = mascara;
  while (m) { m &= m - 1; n++; }
  return n;
}

/** As colunas que ainda aceitam peca, na ordem do centro para fora. */
export function colunasLivres(t, mascara) {
  return t.ordem.filter((c) => cabe(t, mascara, c));
}

/** O tabuleiro em texto: 'x' de quem jogou primeiro, 'o' do outro, '.' vazio. */
export function desenhar(t, posicao, mascara) {
  const vezDeX = jogadas(t, mascara) % 2 === 0;
  const x = vezDeX ? posicao : (posicao ^ mascara);
  const o = vezDeX ? (posicao ^ mascara) : posicao;
  const linhas = [];
  for (let r = t.linhas - 1; r >= 0; r--) {
    let s = '';
    for (let c = 0; c < t.colunas; c++) {
      const bit = 1 << (c * t.altura + r);
      s += (x & bit) ? 'x' : ((o & bit) ? 'o' : '.');
    }
    linhas.push(s);
  }
  return linhas.join('\n');
}
