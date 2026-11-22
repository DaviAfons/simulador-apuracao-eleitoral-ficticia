"use strict";

const UFS = [
    ["AC", "Acre"], ["AL", "Alagoas"],
    ["AP", "Amapá"], ["AM", "Amazonas"],
    ["BA", "Bahia"], ["CE", "Ceará"],
    ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
    ["GO", "Goiás"], ["MA", "Maranhão"],
    ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"],
    ["MG", "Minas Gerais"], ["PA", "Pará"],
    ["PB", "Paraíba"], ["PR", "Paraná"],
    ["PE", "Pernambuco"], ["PI", "Piauí"],
    ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
    ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"],
    ["RR", "Roraima"], ["SC", "Santa Catarina"],
    ["SP", "São Paulo"], ["SE", "Sergipe"],
    ["TO", "Tocantins"]
];

// Pesos fictícios aproximados, não oficiais.
const PESOS_UF = {
    AC: 0.4, AL: 1.5, AP: 0.4,
    AM: 2.0, BA: 7.0, CE: 4.5,
    DF: 1.5, ES: 2.0, GO: 3.2,
    MA: 3.0, MT: 1.6, MS: 1.3,
    MG: 10.5, PA: 4.0, PB: 2.1,
    PR: 5.5, PE: 4.5, PI: 1.5,
    RJ: 8.0, RN: 1.7, RS: 5.5,
    RO: 0.9, RR: 0.3, SC: 3.5,
    SP: 22.0, SE: 1.1, TO: 0.8
};

const TOTAL_BLOCOS = 100;
const BLOCOS_POR_GRUPO = 10;

// Distribui votos inteiros mantendo a soma exata.
function repartir(quantidade, pesos) {
    const pesosInteiros = pesos.map(peso => BigInt(Math.round(peso * 1_000_000)));
    const soma = pesosInteiros.reduce((a, b) => a + b, 0n);
    const produtos = pesosInteiros.map(peso => BigInt(quantidade) * peso);
    const resultado = produtos.map(produto => Number(produto / soma));
    const faltam = quantidade - resultado.reduce((a, b) => a + b, 0);

    const indices = produtos.map((produto, i) => ({
        i,
        resto: produto % soma
    })).sort((a, b) => a.resto === b.resto ? 0 : a.resto > b.resto ? -1 : 1);

    for (let j = 0; j < faltam; j++) {
        resultado[indices[j].i]++;
    }

    return resultado;
}

// Escolhe um perfil geral para cada votação, em vez de deixar que as
// preferências aleatórias de cada estado se anulem no resultado nacional.
function gerarApoioNacional(quantidadeCandidatos) {
    if (turno === 2 && finalistas.length === 2) {
        const indiceLider = finalistas[0].votos >= finalistas[1].votos ? 0 : 1;
        const maior = finalistas[indiceLider].votos;
        const menor = finalistas[1 - indiceLider].votos;
        const diferenca = total ? (maior - menor) / total : 0;
        const vantagemInicial = Math.min(0.12, 0.025 + diferenca * 0.45);
        const sorteio = Math.random();

        let variacao;
        if (sorteio < 0.3) {
            variacao = Math.random() * 0.16 - 0.08;
        } else if (sorteio < 0.8) {
            variacao = Math.random() * 0.14 - 0.05;
        } else {
            variacao = Math.random() * 0.16 - 0.02;
        }

        const apoioLider = Math.max(
            0.38,
            Math.min(0.82, 0.5 + vantagemInicial + variacao)
        );

        return indiceLider === 0
            ? [apoioLider, 1 - apoioLider]
            : [1 - apoioLider, apoioLider];
    }

    const sorteio = Math.random();
    const lider = Math.floor(Math.random() * quantidadeCandidatos);
    let apoioLider;

    if (quantidadeCandidatos === 2) {
        if (sorteio < 0.3) {
            apoioLider = 0.51 + Math.random() * 0.04;
        } else if (sorteio < 0.8) {
            apoioLider = 0.56 + Math.random() * 0.08;
        } else {
            apoioLider = 0.66 + Math.random() * 0.10;
        }

        return lider === 0
            ? [apoioLider, 1 - apoioLider]
            : [1 - apoioLider, apoioLider];
    }

    if (sorteio < 0.3) {
        apoioLider = 0.34 + Math.random() * 0.04;
    } else if (sorteio < 0.8) {
        apoioLider = 0.42 + Math.random() * 0.07;
    } else {
        apoioLider = 0.53 + Math.random() * 0.09;
    }

    const pesosRestantes = candidatosRestantes(quantidadeCandidatos, lider);
    const somaPesos = pesosRestantes.reduce((soma, peso) => soma + peso, 0);
    const apoio = Array(quantidadeCandidatos).fill(0);
    apoio[lider] = apoioLider;

    let indicePeso = 0;
    for (let i = 0; i < quantidadeCandidatos; i++) {
        if (i === lider) continue;
        apoio[i] = (1 - apoioLider) * pesosRestantes[indicePeso] / somaPesos;
        indicePeso++;
    }

    return apoio;
}

function candidatosRestantes(quantidade, lider) {
    const indices = Array.from({ length: quantidade }, (_, i) => i)
        .filter(i => i !== lider);
    const segundo = indices[Math.floor(Math.random() * indices.length)];

    return indices.map(i => i === segundo
        ? 0.95 + Math.random() * 0.05
        : 0.95 + Math.random() * 0.1);
}

// Reserva algumas UFs de menor peso para candidatos que não lideram no país.
function gerarEstadosFavoraveis(apoioNacional) {
    const liderNacional = apoioNacional.indexOf(Math.max(...apoioNacional));
    const desafiantes = candidatos
        .map((_, indice) => indice)
        .filter(indice => indice !== liderNacional);
    const estadosMenores = unidades
        .filter(unidade => unidade.total > 0)
        .sort((a, b) => a.total - b.total);
    const quantidade = Math.min(
        estadosMenores.length,
        6,
        Math.max(2, Math.ceil(estadosMenores.length * 0.18))
    );
    const favoritos = {};

    for (let i = 0; i < quantidade; i++) {
        const desafiante = desafiantes[Math.floor(Math.random() * desafiantes.length)];
        favoritos[estadosMenores[i].uf] = desafiante;
    }

    return favoritos;
}

// Revela o prefixo de uma ordem fixa, dividindo o lote ao meio a cada passo.
function prefixoBloco(finais, tamanho, quantidade) {
    const votos = finais.map(() => 0);
    let pendentes = finais;

    while (quantidade > 0 && quantidade < tamanho) {
        const metade = Math.floor(tamanho / 2);
        const esquerda = pendentes.map(v => Math.floor(v / 2));
        let sobras = metade - esquerda.reduce((a, b) => a + b, 0);

        for (let i = 0; sobras > 0; i++) {
            if (pendentes[i] % 2) {
                esquerda[i]++;
                sobras--;
            }
        }

        if (quantidade <= metade) {
            pendentes = esquerda;
            tamanho = metade;
        } else {
            esquerda.forEach((v, i) => {
                votos[i] += v;
            });
            pendentes = pendentes.map((v, i) => v - esquerda[i]);
            quantidade -= metade;
            tamanho -= metade;
        }
    }

    return votos.map((v, i) => v + (quantidade > 0 ? pendentes[i] : 0));
}

// Prepara os estados e seus blocos eleitorais.
function prepararEstados() {
    if (turno === 1 || unidades.length === 0) {
        const totais = repartir(
            total,
            UFS.map(([uf]) => PESOS_UF[uf])
        );

        unidades = UFS.map(([uf, nome], i) => ({
            uf,
            nome,
            total: totais[i]
        }));
    }

    const apoioNacional = gerarApoioNacional(candidatos.length);
    const estadosFavoraveis = gerarEstadosFavoraveis(apoioNacional);

    const ultimaUF = unidades.filter(u => u.total > 0).reduce(
        (ultima, u) => {
            u.inicio = Math.random() * 0.28;
            u.fim = u.inicio + 0.48 + Math.random() * 0.24;
            return !ultima || u.fim > ultima.fim ? u : ultima;
        },
        null
    );

    const fimApuracao = ultimaUF.fim;

    unidades.forEach(u => {
        u.votos = candidatos.map(() => 0);
        u.apurados = 0;
        u.concluida = u.total === 0;
        if (u.concluida) return;

        u.inicio /= fimApuracao;
        u.fim /= fimApuracao;
        u.curva = 1.1 + Math.random() * 0.65;

        // O apoio nacional define o cenário; os fatores por UF mantêm
        // diferenças regionais sem eliminar a vantagem sorteada.
        const perfis = candidatos.map((_, indice) => ({
            preferencia: apoioNacional[indice] *
                (0.65 + Math.random() * 0.9) *
                (estadosFavoraveis[u.uf] === indice ? 5.5 : 1),
            tendencia: Math.random() * 1.4 - 0.7,
            fase: Math.random() * 2 * Math.PI
        }));

        const tamanhos = repartir(u.total, Array(TOTAL_BLOCOS).fill(1));
        const grupos = TOTAL_BLOCOS / BLOCOS_POR_GRUPO;
        const pesosPorGrupo = Array.from({ length: grupos }, (_, grupo) => {
            const posicao = grupo / (grupos - 1);
            return perfis.map(({ preferencia, tendencia, fase }) =>
                preferencia * Math.exp(
                    tendencia * (2 * posicao - 1) +
                    0.32 * Math.sin(fase + 2 * Math.PI * posicao)
                )
            );
        });

        u.blocos = tamanhos.map((quantidade, i) => ({
            total: quantidade,
            finais: repartir(quantidade, pesosPorGrupo[Math.floor(i / BLOCOS_POR_GRUPO)])
        }));
    });
}

// Realiza a apuração progressiva por estado.
function apurarEstados(momento) {
    candidatos.forEach(c => {
        c.votos = 0;
    });

    unidades.forEach(u => {
        if (u.total === 0) return;

        const base = Math.min(1, Math.max(0, (momento - u.inicio) / (u.fim - u.inicio)));
        // Acelera após o início e desacelera na reta final.
        const fracao = (base * base * (3 - 2 * base)) ** u.curva;
        const meta = base === 1
            ? u.total
            : Math.max(u.apurados, Math.min(u.total - 1, Math.floor(u.total * fracao)));

        u.votos = candidatos.map(() => 0);
        u.apurados = 0;

        let restantes = meta;

        for (const bloco of u.blocos) {
            const quantidade = Math.min(
                restantes,
                bloco.total
            );

            restantes -= quantidade;

            if (quantidade <= 0) break;

            const votosBloco = quantidade === bloco.total
                ? bloco.finais
                : prefixoBloco(bloco.finais, bloco.total, quantidade);

            votosBloco.forEach((votos, i) => {
                u.votos[i] += votos;
                candidatos[i].votos += votos;
            });

            u.apurados += quantidade;
        }

        u.concluida = meta === u.total;
    });
}

function temMaioria(votos) {
    return votos > Math.floor(total / 2);
}
