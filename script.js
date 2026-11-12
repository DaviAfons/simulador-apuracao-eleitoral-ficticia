
"use strict";

let candidatos = [];
let intervalo = null;
let turno = 1;
let estado = "configuracao";
let total = 0;
let tempo = 0;
let titulo = "";
let finalistas = [];
let unidades = [];
let ufSelecionada = null;
let eleitoAntecipado = null;

const cores = [
    "#38bdf8", "#f97316", "#a855f7",
    "#22c55e", "#eab308", "#ef4444"
];

const el = id => document.getElementById(id);

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

// Distribui votos inteiros mantendo a soma exata.
function repartir(quantidade, pesos) {
    const soma = pesos.reduce((a, b) => a + b, 0);

    if (soma <= 0) {
        return pesos.map(() => 0);
    }

    const parcelas = pesos.map(p => quantidade * p / soma);
    const resultado = parcelas.map(v => Math.floor(v));

    const faltam = quantidade -
        resultado.reduce((a, b) => a + b, 0);

    const indices = parcelas.map((v, i) => ({
        i,
        resto: v - resultado[i]
    })).sort((a, b) => b.resto - a.resto);

    for (let j = 0; j < faltam; j++) {
        resultado[indices[j].i]++;
    }

    return resultado;
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

    unidades.forEach(u => {
        u.inicio = Math.random() * 0.25;

        u.fim = Math.min(
            1,
            u.inicio + 0.55 + Math.random() * 0.20
        );

        u.curva = 0.85 + Math.random() * 0.30;

        const preferencias = candidatos.map(() =>
            0.5 + Math.random() * 1.5
        );

        const tamanhos = repartir(
            u.total,
            Array(TOTAL_BLOCOS).fill(1)
        );

        u.blocos = tamanhos.map(quantidade => {
            const pesos = preferencias.map(peso => {
                const variacao = 0.65 + Math.random() * 0.70;
                return peso * variacao;
            });

            return {
                total: quantidade,
                finais: repartir(quantidade, pesos)
            };
        });

        u.finais = candidatos.map((_, i) =>
            u.blocos.reduce(
                (soma, bloco) => soma + bloco.finais[i],
                0
            )
        );

        u.votos = candidatos.map(() => 0);
        u.apurados = 0;
        u.concluida = false;
    });
}

// Realiza a apuração progressiva por estado.
function apurarEstados(momento) {
    candidatos.forEach(c => {
        c.votos = 0;
    });

    unidades.forEach(u => {
        const base = momento >= 1
            ? 1
            : Math.min(
                1,
                Math.max(
                    0,
                    (momento - u.inicio) /
                    (u.fim - u.inicio)
                )
            );

        const fracao = base ** u.curva;

        const meta = momento >= 1
            ? u.total
            : Math.floor(u.total * fracao);

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
                : repartir(quantidade, bloco.finais);

            votosBloco.forEach((votos, i) => {
                u.votos[i] += votos;
                candidatos[i].votos += votos;
            });

            u.apurados += quantidade;
        }

        u.concluida = meta === u.total;
    });
}

// NOVO: verifica se já existe um vencedor matemático.
function verificarEleicaoAntecipada() {
    if (eleitoAntecipado !== null) return;

    const apurados = candidatos.reduce(
        (soma, c) => soma + c.votos,
        0
    );

    if (apurados === 0 || apurados >= total) return;

    const restantes = total - apurados;

    const ordenados = [...candidatos].sort(
        (a, b) => b.votos - a.votos
    );

    const primeiro = ordenados[0];
    const segundo = ordenados[1];

    let eleito = false;

    if (turno === 1 && candidatos.length > 2) {
        // Mais da metade de todos os votos previstos.
        eleito = primeiro.votos > total / 2;
    } else {
        // O adversário não consegue alcançar o líder,
        // mesmo recebendo todos os votos restantes.
        eleito = primeiro.votos > segundo.votos + restantes;
    }

    if (eleito) {
        eleitoAntecipado = primeiro.nome;

        const percentual = (
            apurados / total * 100
        ).toFixed(1);

        el("vencedor").textContent =
            `🏆 ELEITO MATEMATICAMENTE: ${primeiro.nome} — ` +
            `${percentual}% dos votos apurados. ` +
            `A contagem continua...`;
    }
}

// Controla o tempo e a atualização da apuração.
function apurar() {
    clearInterval(intervalo);

    estado = "apurando";
    eleitoAntecipado = null;

    ocultarAcao();

    el("vencedor").textContent = "";
    el("tituloApuracao").textContent =
        `${titulo} — ${turno}º turno`;

    candidatos.forEach(c => {
        c.votos = 0;
    });

    prepararEstados();
    criarPainelEstados();

    let etapa = 0;
    const etapas = Math.ceil(tempo * 2);

    atualizar(0);
    atualizarEstados();

    intervalo = setInterval(() => {
        etapa++;

        apurarEstados(Math.min(1, etapa / etapas));

        const apurados = candidatos.reduce(
            (soma, c) => soma + c.votos,
            0
        );

        atualizar(apurados);
        atualizarEstados();

        // Verifica a eleição matemática a cada atualização.
        verificarEleicaoAntecipada();

        if (etapa >= etapas) {
            clearInterval(intervalo);
            intervalo = null;
            finalizar();
        }
    }, 500);
}

// Cria elementos SVG do mapa.
function svgElemento(tag, atributos = {}) {
    const elemento = document.createElementNS(
        "http://www.w3.org/2000/svg",
        tag
    );

    Object.entries(atributos).forEach(([chave, valor]) => {
        elemento.setAttribute(chave, valor);
    });

    return elemento;
}

// Cria o mapa interativo e sua legenda.
function criarPainelEstados() {
    let painel = el("painelEstados");

    if (!painel) {
        painel = document.createElement("div");
        painel.id = "painelEstados";
        el("resultados").insertAdjacentElement("afterend", painel);
    }

    if (!el("estiloMapa")) {
        const estilo = document.createElement("style");
        estilo.id = "estiloMapa";

        estilo.textContent = `
            #painelEstados{margin-top:28px}
            #mapaBrasil{display:block;width:100%;height:auto;max-height:580px}
            #mapaBrasil .uf{cursor:pointer;stroke:#0f172a;stroke-width:1.2;stroke-linejoin:round;transition:fill .35s}
            #mapaBrasil .uf:hover,#mapaBrasil .uf:focus{stroke:#fff;stroke-width:2.5;outline:none}
            #mapaBrasil .selecionada{stroke:#fff;stroke-width:2.5}
            #mapaBrasil text{font:bold 10px Arial;fill:white;paint-order:stroke;stroke:#0f172a;stroke-width:2.5px;pointer-events:none}
            #legendaMapa{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:13px;margin:12px 0}
            .item-legenda{display:inline-flex;align-items:center;gap:6px;overflow-wrap:anywhere}
            .cor-legenda{width:12px;height:12px;border-radius:3px;flex-shrink:0;display:inline-block}
            #detalheUF{background:#0f172a;border-radius:10px;padding:14px;margin-top:12px}
            #detalheUF h4{margin:0 0 10px}
            #detalheUF p{margin:7px 0;font-size:14px}
            #detalheUF button{margin-top:10px;padding:8px;font-size:13px;width:auto}
            #resumoEstados,.nota-mapa{color:#94a3b8;font-size:13px}
        `;

        document.head.append(estilo);
    }

    painel.replaceChildren();

    const tituloMapa = document.createElement("h3");
    tituloMapa.textContent = "Brasil • apuração por UF";

    const resumo = document.createElement("p");
    resumo.id = "resumoEstados";

    const mapa = svgElemento("svg", {
        id: "mapaBrasil",
        viewBox: "0 0 640 625",
        role: "group",
        "aria-label": "Mapa da apuração por UF. Selecione um estado para ver os votos."
    });

    UFS.forEach(([uf, nome]) => {
        const grupo = svgElemento("g");

        const path = svgElemento("path", {
            id: `mapa-${uf}`,
            d: CONTORNOS_UF[uf].d,
            class: "uf",
            fill: "#334155",
            tabindex: "0",
            role: "button",
            "aria-label": nome,
            "aria-pressed": "false"
        });

        const dica = svgElemento("title");
        path.append(dica);

        const selecionar = () => {
            ufSelecionada = uf;
            atualizarEstados();
        };

        path.onclick = selecionar;

        path.onkeydown = evento => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                selecionar();
            }
        };

        grupo.append(path);

        if (uf !== "DF") {
            const [x, y] = CONTORNOS_UF[uf].rotulo;

            const rotulo = svgElemento("text", {
                x,
                y,
                "text-anchor": "middle",
                "dominant-baseline": "middle"
            });

            rotulo.textContent = uf;
            grupo.append(rotulo);
        }

        mapa.append(grupo);
    });

    // Ampliação do Distrito Federal.
    const [dx, dy] = CONTORNOS_UF.DF.rotulo;

    mapa.append(svgElemento("line", {
        x1: dx,
        y1: dy,
        x2: 568,
        y2: 410,
        stroke: "#94a3b8",
        "stroke-dasharray": "3 3"
    }));

    const df = svgElemento("circle", {
        id: "mapa-DF-ampliado",
        cx: 582,
        cy: 410,
        r: 17,
        class: "uf",
        fill: "#334155",
        tabindex: "0",
        role: "button",
        "aria-label": "Distrito Federal (ampliado)"
    });

    df.onclick = () => {
        ufSelecionada = "DF";
        atualizarEstados();
    };

    df.onkeydown = evento => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            df.onclick();
        }
    };

    const dfTexto = svgElemento("text", {
        x: 582,
        y: 414,
        "text-anchor": "middle"
    });

    dfTexto.textContent = "DF";
    mapa.append(df, dfTexto);

    const legenda = document.createElement("div");
    legenda.id = "legendaMapa";

    [
        ...candidatos,
        { nome: "Sem votos apurados", cor: "#334155" },
        { nome: "Empate", cor: "#94a3b8" }
    ].forEach(c => {
        const item = document.createElement("span");
        item.className = "item-legenda";

        const cor = document.createElement("span");
        cor.className = "cor-legenda";
        cor.style.background = c.cor;
        cor.setAttribute("aria-hidden", "true");

        const nome = document.createElement("span");
        nome.textContent = c.nome;

        item.append(cor, nome);
        legenda.append(item);
    });

    const detalhe = document.createElement("div");
    detalhe.id = "detalheUF";
    detalhe.hidden = true;

    const nota = document.createElement("p");
    nota.className = "nota-mapa";
    nota.textContent =
        "Toque em uma UF para ver os votos. " +
        "As cores indicam a liderança parcial. Simulação fictícia.";

    const fonte = document.createElement("a");
    fonte.href = "https://github.com/henriquemalvar/br-geojson";
    fonte.textContent = "Contornos: IBGE / br-geojson (CC0)";
    fonte.style.cssText = "color:#94a3b8;font-size:11px";

    painel.append(
        tituloMapa,
        resumo,
        mapa,
        legenda,
        detalhe,
        nota,
        fonte
    );
}

function situacaoUF(u) {
    if (!u.total) return "Sem votos nesta simulação";
    if (u.concluida) return "100% apurado";
    if (!u.apurados) return "Aguardando apuração";

    return Math.min(
        99.9,
        u.apurados / u.total * 100
    ).toFixed(1) + "% apurado";
}

function corResultadoUF(u) {
    if (!u.apurados) {
        return {
            cor: "#334155",
            texto: "Sem votos apurados"
        };
    }

    const maior = Math.max(...u.votos);

    const indices = u.votos
        .map((v, i) => v === maior ? i : -1)
        .filter(i => i >= 0);

    if (indices.length > 1) {
        return {
            cor: "#94a3b8",
            texto: "Empate"
        };
    }

    const c = candidatos[indices[0]];

    return {
        cor: c.cor,
        texto: `${u.concluida ? "Venceu" : "Lidera"}: ${c.nome}`
    };
}

// Atualiza as cores e os detalhes do mapa.
function atualizarEstados() {
    const concluidas = unidades.filter(
        u => u.concluida && u.total > 0
    ).length;

    const comVotos = unidades.filter(
        u => u.total > 0
    ).length;

    el("resumoEstados").textContent =
        `${concluidas}/${comVotos} UFs com votos concluídas`;

    unidades.forEach(u => {
        const resultado = corResultadoUF(u);
        const path = el(`mapa-${u.uf}`);

        const descricao =
            `${u.nome}: ${situacaoUF(u)}. ${resultado.texto}.`;

        path.setAttribute("fill", resultado.cor);
        path.setAttribute("aria-label", descricao);
        path.setAttribute(
            "aria-pressed",
            String(ufSelecionada === u.uf)
        );

        path.classList.toggle(
            "selecionada",
            ufSelecionada === u.uf
        );

        path.firstChild.textContent = descricao;

        if (u.uf === "DF") {
            const df = el("mapa-DF-ampliado");

            df.setAttribute("fill", resultado.cor);
            df.setAttribute(
                "aria-label",
                descricao + " Distrito Federal ampliado."
            );

            df.setAttribute(
                "aria-pressed",
                String(ufSelecionada === "DF")
            );

            df.classList.toggle(
                "selecionada",
                ufSelecionada === "DF"
            );
        }
    });

    const detalhe = el("detalheUF");
    const u = unidades.find(item => item.uf === ufSelecionada);

    detalhe.hidden = !u;
    detalhe.replaceChildren();

    if (!u) return;

    const cabecalho = document.createElement("h4");
    cabecalho.textContent = `${u.nome} — ${situacaoUF(u)}`;
    detalhe.append(cabecalho);

    candidatos
        .map((c, i) => ({
            ...c,
            votos: u.votos[i]
        }))
        .sort((a, b) => b.votos - a.votos)
        .forEach(c => {
            const linha = document.createElement("p");

            const percentual = u.apurados
                ? c.votos / u.apurados * 100
                : 0;

            linha.textContent =
                `${c.nome}: ` +
                `${c.votos.toLocaleString("pt-BR")} votos ` +
                `(${percentual.toFixed(2)}%)`;

            detalhe.append(linha);
        });

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.textContent = "Fechar detalhes";

    fechar.onclick = () => {
        const anterior = ufSelecionada;
        ufSelecionada = null;
        atualizarEstados();
        el(`mapa-${anterior}`).focus();
    };

    detalhe.append(fechar);
}

// Atualiza os resultados nacionais.
function atualizar(apurados) {
    const percentual = apurados / total * 100;

    el("porcentagemApurada").textContent =
        percentual.toFixed(1) + "% apurado";

    el("progresso").style.width = percentual + "%";

    const resultados = el("resultados");
    resultados.replaceChildren();

    [...candidatos]
        .sort((a, b) => b.votos - a.votos)
        .forEach(c => {
            const porcentagem = apurados
                ? c.votos / apurados * 100
                : 0;

            const linha = document.createElement("div");
            linha.className = "candidato";

            const info = document.createElement("div");
            info.className = "candidato-info";

            const nome = document.createElement("strong");
            nome.textContent = c.nome;

            const valor = document.createElement("strong");
            valor.textContent = porcentagem.toFixed(2) + "%";

            info.append(nome, valor);

            const barra = document.createElement("div");
            barra.className = "barra-votos";

            const preenchimento = document.createElement("div");
            preenchimento.style.width = porcentagem + "%";
            preenchimento.style.background = c.cor;

            barra.append(preenchimento);

            const quantidade = document.createElement("div");
            quantidade.className = "quantidade";

            quantidade.textContent =
                c.votos.toLocaleString("pt-BR") + " votos";

            linha.append(info, barra, quantidade);
            resultados.append(linha);
        });
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

    if (ordenados[0].votos > Math.floor(total / 2)) {
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
        ".";

    botaoAcao(
        "Iniciar 2º Turno",
        iniciarSegundoTurno
    );
}

function iniciarSegundoTurno() {
    if (estado !== "aguardandoSegundoTurno") return;

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

    candidatos = [];
    finalistas = [];
    unidades = [];
    ufSelecionada = null;
    eleitoAntecipado = null;

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
