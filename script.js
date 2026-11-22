"use strict";

let candidatos = [];
let intervalo = null;
let inicioAutomatico = null;
let turno = 1;
let estado = "configuracao";
let total = 0;
let tempo = 0;
let titulo = "";
let finalistas = [];
let unidades = [];
let ufSelecionada = null;
let eleitoAntecipado = null;
let avisoSegundoTurno = 0;

const cores = [
    "#38bdf8", "#f97316", "#a855f7",
    "#22c55e", "#eab308", "#ef4444"
];

const el = id => document.getElementById(id);

const INTERVALO_MS = 100;
const PAUSA_SEGUNDO_TURNO_MS = 5000;

function iniciar() {
    if (estado === "apurando") return;

    const nomes = el("participantes").value
        .split("\n")
        .map(nome => nome.trim())
        .filter(Boolean);

    const votos = Number(el("totalVotos").value);
    const segundos = Number(el("tempo").value);

    if (
        nomes.length < 2 ||
        !Number.isSafeInteger(votos) ||
        votos < nomes.length ||
        !Number.isFinite(segundos) ||
        segundos < 1 ||
        !Number.isSafeInteger(Math.ceil(segundos * 2))
    ) {
        alert("Informe pelo menos 2 participantes, votos inteiros e tempo válido.");
        return;
    }

    if (
        new Set(nomes.map(n => n.toLocaleLowerCase("pt-BR"))).size
        !== nomes.length
    ) {
        alert("Os participantes devem ter nomes diferentes.");
        return;
    }

    total = votos;
    tempo = segundos;
    titulo = el("titulo").value.trim() || "Apuração de votos";

    turno = 1;
    finalistas = [];
    unidades = [];
    ufSelecionada = null;
    eleitoAntecipado = null;

    candidatos = nomes.map((nome, i) => ({
        nome,
        cor: cores[i] ||
            `hsl(${(i * 137.508) % 360} 70% 55%)`,
        votos: 0
    }));

    el("configuracao").classList.add("oculto");
    el("apuracao").classList.remove("oculto");

    apurar();
}

// Todos os turnos terminam por maioria absoluta ou seguem as regras de empate e classificação.
function verificarEleicaoAntecipada() {
    if (eleitoAntecipado !== null) return;

    const apurados = candidatos.reduce(
        (soma, c) => soma + c.votos,
        0
    );

    if (apurados === 0 || apurados >= total) return;

    const vencedor = candidatos.find(c => temMaioria(c.votos));

    if (vencedor) {
        eleitoAntecipado = vencedor.nome;
        el("vencedor").textContent =
            `🏆 Eleição matematicamente garantida: ${vencedor.nome}. ` +
            `${percentualApurado(apurados, total)}% dos votos apurados. A contagem continua.`;
    }
}

function verificarSegundoTurnoAntecipado(apurados) {
    if (turno !== 1 || candidatos.length < 3 ||
        eleitoAntecipado !== null || avisoSegundoTurno === 2 ||
        apurados === 0 || apurados >= total) return;

    const restantes = total - apurados;
    const [primeiro, segundo, terceiro] = [...candidatos].sort((a, b) => b.votos - a.votos);

    // O líder também é quem mais pode somar votos no cenário extremo.
    if (temMaioria(primeiro.votos + restantes)) return;

    if (segundo.votos > terceiro.votos + restantes) {
        avisoSegundoTurno = 2;
        el("vencedor").textContent =
            `2º turno garantido entre ${primeiro.nome} e ${segundo.nome}. A contagem continua.`;
    } else if (avisoSegundoTurno === 0) {
        avisoSegundoTurno = 1;
        el("vencedor").textContent =
            "2º turno garantido. As vagas serão confirmadas conforme a apuração avança.";
    }
}

// Controla o tempo e a atualização da apuração.
function apurar() {
    clearInterval(intervalo);

    estado = "apurando";
    eleitoAntecipado = null;
    avisoSegundoTurno = 0;

    ocultarAcao();

    el("vencedor").textContent = "";
    el("tituloApuracao").textContent =
        `${titulo} — ${turno}º turno`;

    candidatos.forEach(c => {
        c.votos = 0;
    });

    prepararEstados();
    criarPainelEstados();

    criarResultadosNacionais();
    atualizar(0);
    atualizarEstados();

    const inicio = performance.now();
    const duracao = tempo * 1000;

    intervalo = setInterval(() => {
        const momento = Math.min(1, (performance.now() - inicio) / duracao);
        apurarEstados(momento);

        const apurados = candidatos.reduce(
            (soma, c) => soma + c.votos,
            0
        );

        atualizar(apurados);
        atualizarEstados();

        verificarEleicaoAntecipada();
        verificarSegundoTurnoAntecipado(apurados);

        if (apurados === total) {
            clearInterval(intervalo);
            intervalo = null;
            finalizar();
        }
    }, INTERVALO_MS);
}

// Finaliza a eleição após 100% da apuração.
function finalizar() {
    estado = "concluido";

    const ordenados = [...candidatos].sort(
        (a, b) => b.votos - a.votos
    );

    const lideres = ordenados.filter(
        c => c.votos === ordenados[0].votos
    );

    const mensagem = el("vencedor");

    if (temMaioria(ordenados[0].votos)) {
        mensagem.textContent =
            `🏆 Eleito no ${turno}º turno: ${ordenados[0].nome}`;
        return;
    }

    if (turno === 2 || candidatos.length === 2) {
        mensagem.textContent =
            "Empate final entre: " +
            lideres.map(c => c.nome).join(", ") +
            ". Nenhum vencedor definido. " +
            "Use Nova votação para simular novamente.";
        return;
    }

    const corte = ordenados[1].votos;

    const garantidos = ordenados.filter(
        c => c.votos > corte
    );

    const empatados = ordenados.filter(
        c => c.votos === corte
    );

    const vagas = 2 - garantidos.length;

    if (empatados.length > vagas) {
        estado = "desempate";

        mensagem.textContent =
            "Empate na classificação entre: " +
            empatados.map(c => c.nome).join(", ") +
            `. Há ${vagas} vaga(s). ` +
            "O simulador permite um sorteio entre os empatados.";

        botaoAcao(
            "Sortear classificação dos empatados",
            () => {
                if (estado !== "desempate") return;

                const sorteados = [...empatados];

                for (let i = sorteados.length - 1; i > 0; i--) {
                    const j = Math.floor(
                        Math.random() * (i + 1)
                    );

                    [sorteados[i], sorteados[j]] =
                        [sorteados[j], sorteados[i]];
                }

                prepararSegundoTurno(
                    [...garantidos, ...sorteados.slice(0, vagas)],
                    true
                );
            }
        );
    } else {
        prepararSegundoTurno(
            ordenados.slice(0, 2),
            false
        );
    }
}

function prepararSegundoTurno(selecionados, houveSorteio) {
    finalistas = selecionados.map(c => ({ ...c }));

    estado = "aguardandoSegundoTurno";

    el("vencedor").textContent =
        (
            houveSorteio
                ? "Desempate por sorteio concluído. "
                : "Ninguém obteve mais de 50% dos votos válidos. "
        ) +
        "Finalistas: " +
        finalistas.map(c => c.nome).join(" e ") +
        ". O 2º turno começa automaticamente em 5 segundos.";

    botaoAcao(
        "Iniciar 2º turno agora",
        iniciarSegundoTurno
    );
    inicioAutomatico = setTimeout(iniciarSegundoTurno, PAUSA_SEGUNDO_TURNO_MS);
}

function iniciarSegundoTurno() {
    if (estado !== "aguardandoSegundoTurno") return;

    clearTimeout(inicioAutomatico);
    inicioAutomatico = null;
    turno = 2;
    eleitoAntecipado = null;

    candidatos = finalistas.map(c => ({
        ...c,
        votos: 0
    }));

    apurar();
}

function novaVotacao() {
    clearInterval(intervalo);
    intervalo = null;
    clearTimeout(inicioAutomatico);
    inicioAutomatico = null;

    candidatos = [];
    linhasNacionais = [];
    finalistas = [];
    unidades = [];
    ufSelecionada = null;
    eleitoAntecipado = null;
    avisoSegundoTurno = 0;

    const painel = el("painelEstados");

    if (painel) {
        painel.replaceChildren();
    }

    turno = 1;
    estado = "configuracao";
    total = 0;
    tempo = 0;
    titulo = "";

    ocultarAcao();

    el("vencedor").textContent = "";
    el("tituloApuracao").textContent = "";
    el("resultados").replaceChildren();
    el("porcentagemApurada").textContent = "0% apurado";
    el("progresso").style.width = "0%";

    el("apuracao").classList.add("oculto");
    el("configuracao").classList.remove("oculto");

    el("titulo").focus();
}

function conectarNovaVotacao() {
    const botao = document.querySelector(
        '#apuracao button[onclick*="location.reload"]'
    );

    if (botao) {
        botao.removeAttribute("onclick");
        botao.type = "button";
        botao.onclick = novaVotacao;
    }
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        conectarNovaVotacao,
        { once: true }
    );
} else {
    conectarNovaVotacao();
}
