# ligue-quatro

**Dez tabuleiros de Ligue 4 resolvidos até o último lance.** Nove empatam. Um não: o 6 × 4,
em que quem responde ganha — e ganha contra **todas as seis aberturas**.

O achado que eu não esperava é outro: a primeira coisa que se ensina sobre Ligue 4 é tentar as
colunas do centro para fora, e nos dois tabuleiros de quatro colunas essa ordem **aumenta** o
trabalho da busca — 3,2 vezes no 4 × 4.

**[Abrir a página](https://condedeveloper.github.io/ligue-quatro/)** — dá para jogar contra a
varredura e pedir a nota exata de cada coluna.

JavaScript puro: sem dependência, sem build, e o mesmo núcleo roda no navegador e nos testes.

---

## O valor exato de cada tabuleiro

A nota é contada em peças: se quem joga ganha, ela diz quantas peças ele ainda teria para jogar
depois da vitória. Ganhar cedo vale mais, empate vale zero.

| tabuleiro | casas | nota | quem ganha | nós visitados | conferido na grade |
|---|---:|---:|---|---:|---|
| 4 × 3 | 12 | 0 | empate | 2.057 | sim |
| 5 × 3 | 15 | 0 | empate | 35.879 | sim |
| 6 × 3 | 18 | 0 | empate | 500.134 | — |
| 7 × 3 | 21 | 0 | empate | 7.560.392 | — |
| 4 × 4 | 16 | 0 | empate | 53.149 | sim |
| 5 × 4 | 20 | 0 | empate | 1.043.567 | sim |
| 6 × 4 | 24 | **−1** | **o segundo** | 40.812.590 | — |
| 4 × 5 | 20 | 0 | empate | 323.796 | sim |
| 5 × 5 | 25 | 0 | empate | 46.552.869 | — |
| 4 × 6 | 24 | 0 | empate | 8.208.678 | — |

**O 7 × 6 do jogo de caixinha não está aqui**, e nem vai estar: são 4,5 trilhões de posições. A
tabela diz o que foi varrido.

A última coluna é honesta de propósito. O juiz independente — uma segunda implementação que
trabalha numa grade de verdade, sem bitboard — para em 20 casas, porque o `Map` do JavaScript
enche. Os quatro tabuleiros maiores foram medidos só pelo solucionador.

Para o 6 × 4, que é o único com um vencedor, isso não bastava. Ele foi resolvido **duas vezes
com ordens de coluna diferentes**: a busca ordenada pelo centro visitou 40.812.590 nós, e a
busca sem ordem nenhuma visitou 1.247.639.979. As duas devolveram −1.

## O centro nem sempre ajuda

Três versões da mesma busca: sem poda, com poda alfa-beta, e com poda mais a ordem do centro
para fora. A nota é a mesma nas três, sempre.

| tabuleiro | busca completa | com poda | com ordem do centro | o que a poda faz | o que a ordem faz |
|---|---:|---:|---:|---:|---|
| 4 × 3 | 22.601 | 2.057 | 2.057 | corta 11,0× | nada |
| 5 × 3 | 340.782 | 87.337 | 35.879 | corta 3,9× | corta 2,4× |
| 6 × 3 | 4.871.045 | 1.734.430 | 500.134 | corta 2,8× | corta 3,5× |
| 4 × 4 | 236.995 | 16.377 | 53.149 | corta 14,5× | **piora 3,2×** |
| 5 × 4 | 5.556.135 | 3.530.493 | 1.043.567 | corta 1,6× | corta 3,4× |
| 4 × 5 | 2.121.731 | 192.651 | 323.796 | corta 11,0× | **piora 1,7×** |

Nos quatro tabuleiros de cinco colunas ou mais, a ordem do centro corta entre 2,4 e 3,5 vezes.
Nos dois de quatro colunas, ela piora. Com quatro colunas não existe uma coluna central: a
ordem `1, 2, 0, 3` troca a ordem natural por uma que, nesses tabuleiros, encontra o refutador
mais tarde.

## A nota de cada abertura

| tabuleiro | nota por coluna | aberturas que não perdem |
|---|---|---:|
| 4 × 3 | 0 0 0 0 | 4 de 4 |
| 5 × 3 | 0 0 0 0 0 | 5 de 5 |
| 6 × 3 | 0 0 0 0 0 0 | 6 de 6 |
| 7 × 3 | 0 0 0 0 0 0 0 | 7 de 7 |
| 4 × 4 | 0 0 0 0 | 4 de 4 |
| 5 × 4 | −1 0 0 0 −1 | 3 de 5 |
| 6 × 4 | −1 −1 −1 −1 −1 −1 | **0 de 6** |
| 4 × 5 | 0 0 0 0 | 4 de 4 |
| 5 × 5 | 0 0 0 0 0 | 5 de 5 |
| 4 × 6 | 0 0 0 0 | 4 de 4 |

No 5 × 4 as duas colunas de borda perdem e as três do meio empatam: é o único tabuleiro da
lista em que a escolha da abertura muda o resultado sem decidir a partida. No 6 × 4 não há
escolha: as seis perdem.

Toda linha desta tabela é simétrica — a nota da coluna *i* é igual à da coluna espelhada. É uma
conferência de graça, e seria a primeira a quebrar se a numeração das colunas estivesse torta.

## Os quatro achados

1. **Nove dos dez tabuleiros varridos empatam.** O único com vencedor é o 6 × 4, e quem ganha
   é quem responde, contra as seis aberturas.
2. **A ordem do centro para fora piora a busca nos dois tabuleiros de quatro colunas**: 3,2×
   mais nós no 4 × 4 e 1,7× no 4 × 5. Nos outros quatro ela corta entre 2,4 e 3,5 vezes.
3. **No 5 × 4, abrir numa borda perde e abrir no meio empata.** Três aberturas de cinco não
   perdem; é o único tabuleiro em que a escolha importa sem já estar decidida.
4. **Os dois testes de quatro em linha — bitboard e varredura na grade — concordam em
   6.365.007 posições**, sem uma divergência. É a conferência que pega o erro clássico do
   bitboard, o alinhamento que atravessa a borda de uma coluna.

## O que as medidas me corrigiram

**Eu entregava a peça recém-jogada ao adversário.** Em `jogar`, a troca de lado tem que usar a
máscara **velha**: `posicao ^ mascara`. Eu usei a nova, e a peça que acabou de cair passou a
contar para o outro. O tabuleiro continuava válido, a busca continuava rodando, e o resultado
saía com a maior cara de certo: o segundo jogador "ganhava" quase todos os tabuleiros. Só
apareceu quando a busca na grade discordou.

**E o juiz tinha o erro espelhado.** No negamax da grade eu escrevia `1 - jogador` nos dois
lugares — na peça que entra e na chamada de dentro —, o que dá um jogo em que cada um joga pelo
outro. Os dois bugs eram independentes e cada um pegou o outro. Se eu tivesse escrito só um dos
dois, teria publicado a tabela errada.

**Negar um empate não dá zero.** `-0` é igual a `0` para o `===` da linguagem e diferente para
um teste estrito, então a mesma posição respondia uma coisa ou outra conforme o caminho por onde
ela era alcançada. Apareceu em três lugares — no valor da posição, na nota da abertura e no
juiz — e em nenhum deles mudava uma conclusão. Mesmo assim, uma função que dá duas respostas
para a mesma pergunta não serve de base para medida.

**Achei que a ordem do centro só pudesse ajudar.** É uma heurística de ordenação: ela não muda
a resposta, só a hora em que a poda corta. Eu tinha escrito "corta sempre" no rascunho. Nos dois
tabuleiros de quatro colunas ela multiplica o trabalho, e isso só apareceu porque a tabela mede
as três buscas lado a lado em vez de medir só a mais rápida.

## Como está feito

```
js/tabuleiro.js     o bitboard com sentinela, e o teste de quatro em linha
js/solucionador.js  negamax com poda alfa-beta, nas três versões
js/juiz.js          o mesmo jogo numa grade de verdade, sem bitboard
js/medidas.js       as tabelas deste README, uma função por linha
js/app.js           a página
ferramentas/medidor.js
```

**A sentinela.** Cada coluna ocupa `linhas + 1` bits, e o bit extra fica sempre em zero. É o que
faz o teste de alinhamento funcionar sem conferir borda: um "quatro" que fosse atravessar de uma
coluna para a seguinte bate na sentinela e morre. O limite de 31 bits dos operadores do
JavaScript é o que define quais tabuleiros cabem — e o 7 × 6 precisaria de 49.

**Dois juízes.** O primeiro é a busca na grade: colunas são listas, o quatro em linha é
procurado andando casa por casa nas quatro direções, e nada ali sabe o que é um bitboard. O
segundo anda com o solucionador lance a lance e compara **os dois testes de alinhamento** em
todas as posições alcançáveis de cinco tabuleiros.

## Rodar

```bash
node --test testes/*.test.js     # 26 testes
node ferramentas/medidor.js      # todas as tabelas
node ferramentas/medidor.js poda
```

A página é estática: abrir o `index.html` basta, não tem build nem servidor.

## Licença

MIT.
