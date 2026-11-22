"use strict";

let linhasNacionais = [];

function botaoAcao(texto, acao) {
    let botao = el("acaoTurno");

    if (!botao) {
        botao = document.createElement("button");
        botao.id = "acaoTurno";
        botao.type = "button";
        el("vencedor").insertAdjacentElement("afterend", botao);
    }

    botao.textContent = texto;
    botao.onclick = acao;
    botao.hidden = false;
}

function ocultarAcao() {
    const botao = el("acaoTurno");

    if (botao) {
        botao.hidden = true;
        botao.onclick = null;
    }
}

function percentualApurado(apurados, previstos) {
    return apurados === previstos ? '100' : Math.min(99.9, apurados / previstos * 100).toFixed(1);
}

function criarResultadosNacionais() {
    reiniciarEvolucao();
    el("resultados").replaceChildren();
    linhasNacionais = candidatos.map(c => {
        const linha = document.createElement("div");
        linha.className = "candidato";

        const info = document.createElement("div");
        info.className = "candidato-info";
        const nome = document.createElement("strong");
        nome.textContent = c.nome;
        const valor = document.createElement("strong");
        info.append(nome, valor);

        const barra = document.createElement("div");
        barra.className = "barra-votos";
        const preenchimento = document.createElement("div");
        preenchimento.style.background = c.cor;
        barra.append(preenchimento);

        const quantidade = document.createElement("div");
        quantidade.className = "quantidade";
        linha.append(info, barra, quantidade);

        return { candidato: c, linha, valor, preenchimento, quantidade };
    });
}

// Preserva os elementos entre atualizações para manter as transições das barras.
function atualizar(apurados) {
    el("porcentagemApurada").textContent = percentualApurado(apurados, total) + "% apurado";
    el("progresso").style.width = apurados / total * 100 + "%";

    const resultados = el("resultados");
    const ranking = [...linhasNacionais].sort((a, b) => b.candidato.votos - a.candidato.votos);
    ranking.forEach(({ candidato, linha, valor, preenchimento, quantidade }, indice) => {
        const porcentagem = apurados ? candidato.votos / apurados * 100 : 0;
        valor.textContent = porcentagem.toFixed(2) + "%";
        preenchimento.style.width = porcentagem + "%";
        quantidade.textContent = candidato.votos.toLocaleString("pt-BR") + " votos";

        const atual = resultados.children[indice];
        if (atual !== linha) resultados.insertBefore(linha, atual || null);
    });
    registrarEvolucao(apurados, ranking[0].candidato, ranking[1].candidato);
}