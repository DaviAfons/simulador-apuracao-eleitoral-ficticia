# Simulador de Apuração Eleitoral Fictícia

Simulador de eleições feito com **HTML, CSS e JavaScript**, com apuração progressiva, dois turnos e mapa interativo do Brasil. Funciona diretamente no navegador, sem instalação de dependências, servidor de aplicação ou banco de dados.

Os votos são calculados por lotes, permitindo simulações com **158.700.000 votos** sem criar um registro para cada voto.

> Este projeto é uma simulação para entretenimento e aprendizado. Os totais por UF, as preferências e os ritmos de apuração são fictícios e aleatórios. Não utiliza pesquisas, dados reais de eleitores ou resultados oficiais e não serve para prever eleições.

## Funcionalidades

- Cadastro de dois ou mais candidatos, com um nome por linha.
- Configuração do título, total de votos e tempo de apuração por turno.
- Resultados nacionais com votos, porcentagens e barras coloridas.
- Apuração nas 27 unidades da federação, incluindo o Distrito Federal.
- Mapa que acompanha a liderança de cada candidato por UF.
- Consulta dos resultados estaduais ao clicar ou tocar no mapa.
- Ampliação do Distrito Federal para facilitar a seleção.
- Primeiro e segundo turnos, com tratamento de empates.
- Botão **Nova votação**, que retorna à configuração sem recarregar a página.
- Layout adaptado para computador e celular.

## Arquivos do projeto

```text
simulador-votos/
├── index.html       # Estrutura e campos da interface
├── style.css        # Aparência e layout
├── mapa-brasil.js   # Contornos das UFs e posições das siglas
├── script.js        # Apuração, regras dos turnos e interação com o mapa
└── README.md        # Documentação
```

Mantenha os arquivos na mesma pasta. No final do `index.html`, antes de `</body>`, carregue os scripts nesta ordem:

```html
<script src="mapa-brasil.js"></script>
<script src="script.js"></script>
```

O arquivo do mapa precisa carregar primeiro. Não adicione `async` a essas chamadas, pois a lógica do simulador depende dos contornos já disponíveis.

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

Se houver segundo turno, clique em **Iniciar 2º Turno** quando o botão aparecer. Para começar outra eleição, use **Nova votação**: os resultados são limpos e os campos permanecem preenchidos para edição.

## Regras da simulação

Todos os votos são considerados válidos; não há votos brancos, nulos ou abstenções.

### Primeiro turno

Um candidato é eleito ao obter **mais de 50% dos votos válidos nacionais**, depois de concluída a apuração. Exatamente 50% não basta. A comparação usa a quantidade inteira de votos, sem depender do arredondamento da porcentagem exibida.

Com três ou mais candidatos, se ninguém alcançar essa maioria, os dois mais votados avançam ao segundo turno.

Se um empate impedir a escolha dos dois finalistas, aparece o botão **Sortear classificação dos empatados**. O sorteio acontece apenas entre os empatados pelas vagas disponíveis. Candidatos com vaga garantida permanecem classificados. Dois candidatos empatados em primeiro avançam diretamente quando não há outro candidato com a mesma votação.

Com apenas dois candidatos, a disputa termina no primeiro turno. Se ambos receberem a mesma quantidade de votos, o simulador informa um empate final.

### Segundo turno

O segundo turno mantém os nomes e as cores dos finalistas, o total de votos de cada UF e o tempo configurado. Os votos apurados são zerados, e novas distribuições e ritmos são sorteados para a disputa entre os dois candidatos.

Ao concluir, quem tiver mais votos é eleito. Em caso de empate, nenhum vencedor é escolhido; é possível iniciar uma nova votação.

O sorteio de classificação é uma convenção deste simulador. O projeto não reproduz todos os critérios e procedimentos de uma eleição oficial.

## Como ler o mapa

| Cor | Significado |
| --- | --- |
| Cor do candidato | Liderança parcial na UF; ao concluir sua apuração, vitória na UF |
| Cinza escuro | Nenhum voto apurado |
| Cinza claro | Empate na maior votação |

Toque ou clique em uma UF para consultar seus votos e porcentagens. Use **Fechar detalhes** para recolher o painel. Também é possível selecionar os estados pelo teclado, usando Tab e Enter ou Espaço.

O resultado nacional é a **soma dos votos de todas as UFs**, e não a quantidade de estados vencidos.

## Apuração e desempenho

O simulador distribui o total informado entre as UFs de forma aleatória. Para cada turno, define os votos de cada candidato em cada UF e os revela progressivamente, em atualizações programadas a cada meio segundo.

Cada UF começa e termina a apuração em momentos diferentes. Assim, a entrada de votos de estados com distribuições distintas pode provocar mudanças na liderança nacional. As viradas são possíveis, mas não garantidas.

O processamento trabalha com totais agregados por candidato e UF. A memória não cresce com um elemento por voto, e a soma final corresponde exatamente ao total configurado. O desempenho depende principalmente da quantidade de candidatos, das atualizações da interface e do dispositivo.

O tempo informado é aproximado: navegadores podem atrasar as atualizações, especialmente quando a aba fica em segundo plano.

## Solução de problemas

- **O mapa não aparece:** confirme que `mapa-brasil.js` está na mesma pasta do HTML e é carregado antes de `script.js`.
- **As alterações não aparecem:** atualize a página sem usar o cache ou teste em uma janela privativa.
- **Nova votação tenta recarregar a página:** confirme que está usando a versão atualizada do `script.js` e o HTML original do projeto.
- **O site publicado não abre:** confira os nomes dos arquivos, incluindo letras maiúsculas e minúsculas, e a pasta selecionada no Pages.

## Créditos

Os contornos geográficos foram obtidos do projeto [br-geojson](https://github.com/henriquemalvar/br-geojson), que disponibiliza dados derivados do IBGE sob **CC0 1.0**. Foram convertidos para caminhos SVG e incorporados ao `mapa-brasil.js`, sem necessidade de baixar o mapa durante a execução.

Essa indicação de licença se refere aos dados geográficos de origem.
