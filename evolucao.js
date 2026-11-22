"use strict";

const FAIXAS_EVOLUCAO = 200;
const formatarVantagem = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

let historicoEvolucao;
let ultimoLider;
let ultimoTotalApurado;
let totalViradas;

function reiniciarEvolucao() {
    historicoEvolucao = [];
    ultimoLider = null;
    ultimoTotalApurado = -1;
    totalViradas = 0;
    el("resumoViradas").textContent = "";
}

function registrarEvolucao(apurados, primeiro, segundo) {
    if (apurados === ultimoTotalApurado) return;
    ultimoTotalApurado = apurados;

    if (apurados === 0) {
        el("vantagemAtual").textContent = "Aguardando os primeiros votos.";
        desenharEvolucao();
        return;
    }

    const progresso = apurados / total;
    const vantagem = (primeiro.votos - segundo.votos) / apurados * 100;
    const ponto = { progresso, vantagem };
    const faixa = Math.min(FAIXAS_EVOLUCAO, Math.floor(progresso * FAIXAS_EVOLUCAO));
    const amostra = historicoEvolucao[faixa] || {};

    amostra.ponto = ponto;
    historicoEvolucao[faixa] = amostra;

    if (vantagem === 0) {
        el("vantagemAtual").textContent = "Empate na liderança.";
    } else {
        const diferenca = formatarVantagem.format(vantagem);
        el("vantagemAtual").textContent =
            `${primeiro.nome} lidera sobre ${segundo.nome} por ${diferenca} p.p.`;

        if (ultimoLider && ultimoLider !== primeiro) {
            totalViradas++;
            amostra.virada = ponto;
            const rotulo = totalViradas === 1 ? "1 virada" : `${totalViradas} viradas`;
            el("resumoViradas").textContent =
                `${rotulo}. Última: ${primeiro.nome} assumiu a liderança com ` +
                `${percentualApurado(apurados, total)}% dos votos apurados.`;
        }

        ultimoLider = primeiro;
    }

    desenharEvolucao();
}

function desenharEvolucao() {
    const canvas = el("graficoEvolucao");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const esquerda = 42;
    const direita = canvas.width - 25;
    const topo = 18;
    const base = canvas.height - 48;
    const amostras = historicoEvolucao.filter(Boolean);
    const maior = amostras.reduce((maximo, { ponto, virada }) =>
        Math.max(maximo, ponto.vantagem, virada?.vantagem ?? 0), 0);
    const escala = Math.max(5, Math.ceil(maior / 5) * 5);

    const x = progresso => esquerda + (direita - esquerda) * progresso;
    const y = vantagem => base - (base - topo) * vantagem / escala;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "15px Arial";
    ctx.fillStyle = "#cbd5e1";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;

    for (const valor of [0, escala / 2, escala]) {
        ctx.beginPath();
        ctx.moveTo(esquerda, y(valor));
        ctx.lineTo(direita, y(valor));
        ctx.stroke();
        ctx.textAlign = "right";
        ctx.fillText(valor.toLocaleString("pt-BR"), esquerda - 6, y(valor) + 5);
    }

    ctx.textAlign = "left";
    ctx.fillText("p.p.", esquerda + 5, topo - 4);
    ctx.textAlign = "center";
    for (const percentual of [0, 25, 50, 75, 100]) {
        ctx.fillText(`${percentual}%`, x(percentual / 100), base + 20);
    }
    ctx.fillText("Votos apurados", (esquerda + direita) / 2, base + 40);

    if (amostras.length === 0) return;

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    amostras.forEach(({ ponto }, indice) => {
        const px = x(ponto.progresso);
        const py = y(ponto.vantagem);
        if (indice === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();

    const atual = amostras[amostras.length - 1].ponto;
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(x(atual.progresso), y(atual.vantagem), 3.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "#fcd34d";
    for (const { virada } of amostras) {
        if (!virada) continue;
        ctx.beginPath();
        ctx.arc(x(virada.progresso), y(virada.vantagem), 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}