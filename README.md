# Simulador de Apuração Eleitoral Fictícia

Simulador de eleições feito com **HTML, CSS e JavaScript**, com apuração progressiva, dois turnos e mapa interativo do Brasil. Funciona diretamente no navegador, sem instalação de dependências, servidor de aplicação ou banco de dados.

Os votos são calculados por lotes, permitindo simulações com **158.700.000 votos** sem criar um registro para cada voto.

> Este projeto é uma simulação para entretenimento e aprendizado. Os totais por UF, as preferências e os ritmos de apuração são fictícios e aleatórios. Não utiliza pesquisas, dados reais de eleitores ou resultados oficiais e não serve para prever eleições.

## Funcionalidades

- Cadastro de dois ou mais candidatos, com um nome por linha.
- Configuração do título, total de votos e tempo de apuração por turno.
- Resultados nacionais com votos, porcentagens, barras coloridas e gráfico de evolução da liderança.
- Apuração nas 27 unidades da federação, incluindo o Distrito Federal.
- Mapa que acompanha a liderança de cada candidato por UF.
- Consulta dos resultados estaduais ao clicar ou tocar no mapa.
- Ampliação do Distrito Federal para facilitar a seleção.
- Segundo turno automático e anúncio antecipado quando matematicamente garantido.
- Botão **Nova votação**, que retorna à configuração sem recarregar a página.
- Layout adaptado para computador e celular.

## Arquivos do projeto

```text
simulador-votos/
├── index.html       # Estrutura e campos da interface
├── style.css        # Aparência e layout
├── mapa_brasil.js   # Contornos das UFs e posições das siglas
├── apuracao.js      # Distribuição e contagem dos votos por UF
├── mapa.js          # Mapa interativo e detalhes por UF
├── evolucao.js      # Gráfico da vantagem nacional e marcadores de viradas
├── resultados.js    # Painel nacional e botões de ação
├── script.js        # Configuração, cronômetro e regras dos turnos
└── README.md        # Documentação
```

Mantenha os arquivos na mesma pasta. No final do `index.html`, antes de `</body>`, carregue os scripts nesta ordem:

```html
<script src="mapa_brasil.js"></script>
<script src="apuracao.js"></script>
<script src="mapa.js"></script>
<script src="evolucao.js"></script>
<script src="resultados.js"></script>
<script src="script.js"></script>
```

Carregue os scripts clássicos na ordem indicada, com `script.js` por último. Essa organização permite abrir o HTML diretamente pelo navegador, sem servidor.

## Como executar

1. Baixe ou clone o repositório.
2. Abra o arquivo `index.html` em um navegador atualizado.
3. Preencha o nome da votação e os candidatos, um por linha.
4. Informe o total de votos e o tempo da apuração em segundos.
5. Clique em **Iniciar apuração**.

Exemplo de configuração:

| Campo | Valor |
| --- | --- |
| Nome da votação | Eleição fictícia |
| Candidatos | Candidato A, Candidato B e Candidato C, um por linha |
| Total de votos | `158700000` |
| Tempo por turno | `60` segundos |

Use nomes diferentes para os candidatos. O total deve ser um número inteiro positivo, pelo menos igual à quantidade de candidatos. O tempo mínimo é de um segundo.

Se houver segundo turno, ele começa automaticamente cinco segundos depois que os finalistas são definidos. Use **Iniciar 2º turno agora** para avançar de imediato. Se houver empate por uma vaga, use o botão de sorteio antes de avançar. **Nova votação** cancela a transição, limpa os resultados e mantém os campos preenchidos para edição.

## Regras da simulação

Todos os votos são considerados válidos; não há votos brancos, nulos ou abstenções.

### Primeiro turno

Um candidato é eleito ao obter **mais de 50% dos votos válidos nacionais**, ao fim da apuração. Durante a contagem, o simulador anuncia que a eleição está matematicamente garantida assim que um candidato supera metade de todos os votos válidos previstos para o turno. A contagem continua até 100%. O mesmo critério vale no segundo turno, em que há somente dois candidatos. Exatamente 50% não basta. A comparação usa a quantidade inteira de votos, sem depender do arredondamento da porcentagem exibida.

Com três ou mais candidatos, se ninguém alcançar essa maioria, os dois mais votados avançam ao segundo turno.

Durante a apuração, o segundo turno é anunciado quando nenhum candidato conseguiria ultrapassar 50% dos votos previstos, mesmo recebendo todos os votos restantes. Os dois nomes só aparecem no anúncio quando o terceiro colocado já não consegue sequer empatar com o segundo. O primeiro turno continua até 100%.

Se um empate impedir a escolha dos dois finalistas, aparece o botão **Sortear classificação dos empatados**. O sorteio acontece apenas entre os empatados pelas vagas disponíveis. Candidatos com vaga garantida permanecem classificados. Dois candidatos empatados em primeiro avançam diretamente quando não há outro candidato com a mesma votação.

Com apenas dois candidatos, a disputa termina no primeiro turno. Se ambos receberem a mesma quantidade de votos, o simulador informa um empate final.

### Segundo turno

O segundo turno mantém os nomes e as cores dos finalistas, o total de votos de cada UF e o tempo configurado. Os votos apurados são zerados, e novas distribuições e ritmos são sorteados para a disputa entre os dois candidatos.

Ao concluir, quem tiver mais votos é eleito. Em caso de empate, nenhum vencedor é escolhido; é possível iniciar uma nova votação.

O sorteio de classificação é uma convenção deste simulador. O projeto não reproduz todos os critérios e procedimentos de uma eleição oficial.

## Como ler o gráfico da liderança

O eixo horizontal mostra a porcentagem de votos nacionais apurados. No eixo vertical, a linha azul mostra a diferença entre os dois primeiros colocados em pontos percentuais. Os pontos amarelos marcam trocas de liderança observadas nas atualizações do painel. Um empate deixa a diferença em zero. Se o mesmo candidato retomar a liderança após um empate, isso não conta como virada.

A legenda informa a vantagem atual e, quando há viradas, o total registrado e o momento da última. Para manter o gráfico leve, cada faixa de meio ponto percentual guarda a amostra mais recente e, quando houver, a última virada daquela faixa. O histórico recomeça a cada turno.

## Como ler o mapa

| Cor | Significado |
| --- | --- |
| Cor do candidato | Liderança parcial na UF; ao concluir sua apuração, vitória na UF |
| Cinza escuro | Nenhum voto apurado |
| Cinza claro | Empate na maior votação |

Toque ou clique em uma UF para consultar seus votos e porcentagens. Use **Fechar detalhes** para recolher o painel. Também é possível selecionar os estados pelo teclado, usando Tab e Enter ou Espaço.

O resultado nacional é a **soma dos votos de todas as UFs**, e não a quantidade de estados vencidos.

## Apuração e desempenho

O simulador distribui o total informado entre as UFs usando pesos fictícios. A contagem avança pelo tempo decorrido e a interface é atualizada cerca de dez vezes por segundo enquanto a aba está ativa. Cada atualização exibe somente os votos já apurados no modelo. Os totais de cada candidato na UF nunca retrocedem.

As UFs começam e terminam em momentos diferentes. Os lotes consecutivos de uma mesma UF representam grupos de áreas com preferências semelhantes, que podem favorecer candidatos diferentes ao longo da apuração. A combinação dos ritmos e das preferências pode produzir viradas estaduais e nacionais.

O processamento trabalha com totais agregados por candidato e UF. A memória não cresce com um elemento por voto, e a soma final corresponde exatamente ao total configurado. O desempenho depende principalmente da quantidade de candidatos, das atualizações da interface e do dispositivo.

O tempo informado é aproximado: navegadores podem atrasar as atualizações, especialmente quando a aba fica em segundo plano.

## Solução de problemas

- **O mapa não aparece:** confirme que `mapa_brasil.js` está na mesma pasta do HTML e é carregado antes de `mapa.js`.
- **As alterações não aparecem:** atualize a página sem usar o cache ou teste em uma janela privativa.
- **Nova votação tenta recarregar a página:** confirme que está usando a versão atualizada do `script.js` e o HTML original do projeto.
- **O site publicado não abre:** confira os nomes dos arquivos, incluindo letras maiúsculas e minúsculas, e a pasta selecionada no Pages.

## Créditos

Os contornos geográficos foram obtidos do projeto [br-geojson](https://github.com/henriquemalvar/br-geojson), que disponibiliza dados derivados do IBGE sob **CC0 1.0**. Foram convertidos para caminhos SVG e incorporados ao `mapa_brasil.js`, sem necessidade de baixar o mapa durante a execução.

Essa indicação de licença se refere aos dados geográficos de origem.
