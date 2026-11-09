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

const cores = ["#38bdf8", "#f97316", "#a855f7", "#22c55e", "#eab308", "#ef4444"];
const el = id => document.getElementById(id);

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
    const nomes = el("participantes").value.split("\n")
        .map(nome => nome.trim()).filter(Boolean);
    const votos = Number(el("totalVotos").value);
    const segundos = Number(el("tempo").value);

    if (nomes.length < 2 || !Number.isSafeInteger(votos) ||
        votos < nomes.length || !Number.isFinite(segundos) ||
        segundos < 1 || !Number.isSafeInteger(Math.ceil(segundos * 2))) {
        alert("Informe pelo menos 2 participantes, um total inteiro de votos igual ou maior que o número de participantes e tempo válido (mínimo de 1 segundo).");
        return;
    }
    if (new Set(nomes.map(nome => nome.toLocaleLowerCase("pt-BR"))).size !== nomes.length) {
        alert("Use nomes diferentes para identificar os participantes.");
        return;
    }

    total = votos;
    tempo = segundos;
    titulo = el("titulo").value.trim() || "Apuração de votos";
    turno = 1;
    finalistas = [];
    candidatos = nomes.map((nome, i) => ({ nome, cor: i < cores.length ? cores[i] : `hsl(${(i * 137.508) % 360} 70% 55%)`, votos: 0 }));
    el("configuracao").classList.add("oculto");
    el("apuracao").classList.remove("oculto");
    apurar();
}

function apurar() {
    clearInterval(intervalo);
    estado = "apurando";
    ocultarAcao();
    el("vencedor").textContent = "";
    el("tituloApuracao").textContent = `${titulo} — ${turno}º turno`;
    candidatos.forEach(c => { c.votos = 0; });
    prepararEstados();
    criarPainelEstados();
    let etapa = 0;
    const etapas = Math.ceil(tempo * 2);
    atualizar(0);
    atualizarEstados();

    intervalo = setInterval(() => {
        etapa++;
        const momento = Math.min(1, etapa / etapas);
        apurarEstados(momento);
        const apurados = candidatos.reduce((soma, c) => soma + c.votos, 0);
        atualizar(apurados);
        atualizarEstados();
        if (etapa >= etapas) {
            clearInterval(intervalo);
            intervalo = null;
            finalizar();
        }
    }, 500);
}

// As UFs são reais; totais, preferências e ritmos são inteiramente fictícios.
const UFS = [
    ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"],
    ["AM", "Amazonas"], ["BA", "Bahia"], ["CE", "Ceará"],
    ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
    ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"],
    ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"],
    ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
    ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"],
    ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"],
    ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"],
    ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"]
];

// Reparte inteiros com soma exata e memória proporcional ao número de pesos.
function repartir(quantidade, pesos) {
    let restantes = quantidade;
    let soma = pesos.reduce((a, b) => a + b, 0);
    return pesos.map((peso, i) => {
        const valor = i === pesos.length - 1 ? restantes :
            Math.min(restantes, Math.max(0, Math.floor(restantes * (peso / soma))));
        restantes -= valor;
        soma -= peso;
        return valor;
    });
}

function prepararEstados() {
    if (turno === 1 || unidades.length === 0) {
        const totais = repartir(total, UFS.map(() => 0.2 + Math.random() * 2));
        unidades = UFS.map(([uf, nome], i) => ({ uf, nome, total: totais[i] }));
    }
    // Mantém o total por UF entre turnos, mas sorteia novas distribuições.
    unidades.forEach(u => {
        u.inicio = Math.random() * 0.55;
        u.fim = u.inicio + 0.2 + Math.random() * (0.8 - u.inicio);
        u.curva = 0.6 + Math.random() * 1.8;
        u.finais = repartir(u.total, candidatos.map(() => 0.05 + Math.random() ** 2 * 4));
        u.votos = candidatos.map(() => 0);
        u.apurados = 0;
        u.concluida = false;
    });
}

function apurarEstados(momento) {
    candidatos.forEach(c => { c.votos = 0; });
    unidades.forEach(u => {
        const fracao = momento >= 1 ? 1 :
            Math.min(1, Math.max(0, (momento - u.inicio) / (u.fim - u.inicio))) ** u.curva;
        u.concluida = fracao >= 1;
        u.votos = u.finais.map(v => fracao >= 1 ? v : Math.floor(v * fracao));
        u.apurados = u.votos.reduce((a, b) => a + b, 0);
        u.votos.forEach((v, i) => { candidatos[i].votos += v; });
    });
}

function svgElemento(tag, atributos = {}) {
    const elemento = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(atributos).forEach(([chave, valor]) => elemento.setAttribute(chave, valor));
    return elemento;
}

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
            #painelEstados {margin-top:28px}
            #mapaBrasil {display:block;width:100%;height:auto;max-height:580px}
            #mapaBrasil .uf {cursor:pointer;stroke:#0f172a;stroke-width:1.2;stroke-linejoin:round;transition:fill .35s}
            #mapaBrasil .uf:hover,#mapaBrasil .uf:focus {stroke:#fff;stroke-width:2.5;outline:none}
            #mapaBrasil .selecionada {stroke:#fff;stroke-width:2.5}
            #mapaBrasil text {font: bold 10px Arial;fill:white;paint-order:stroke;stroke:#0f172a;stroke-width:2.5px;pointer-events:none}
            #legendaMapa {display:flex;flex-wrap:wrap;gap:8px 16px;font-size:13px;margin:12px 0}
            .item-legenda {display:inline-flex;align-items:center;gap:6px;overflow-wrap:anywhere}
            .cor-legenda {width:12px;height:12px;border-radius:3px;flex-shrink:0;display:inline-block}
            #detalheUF {background:#0f172a;border-radius:10px;padding:14px;margin-top:12px}
            #detalheUF h4 {margin:0 0 10px} #detalheUF p {margin:7px 0;font-size:14px}
            #detalheUF button {margin-top:10px;padding:8px;font-size:13px;width:auto}
            #resumoEstados,.nota-mapa {color:#94a3b8;font-size:13px}
        `;
        document.head.append(estilo);
    }
    painel.replaceChildren();
    const tituloMapa = document.createElement("h3");
    tituloMapa.textContent = "Brasil • apuração por UF";
    const resumo = document.createElement("p");
    resumo.id = "resumoEstados";
    const mapa = svgElemento("svg", {id:"mapaBrasil",viewBox:"0 0 640 625",role:"group","aria-label":"Mapa da apuração por UF. Selecione um estado para ver os votos."});
    UFS.forEach(([uf, nome]) => {
        const grupo = svgElemento("g");
        const path = svgElemento("path", {id:`mapa-${uf}`,d:CONTORNOS_UF[uf].d,class:"uf",fill:"#334155",tabindex:"0",role:"button","aria-label":nome,"aria-pressed":"false"});
        const dica = svgElemento("title");
        path.append(dica);
        const selecionar = () => { ufSelecionada = uf; atualizarEstados(); };
        path.onclick = selecionar;
        path.onkeydown = evento => {
            if (evento.key === "Enter" || evento.key === " ") {evento.preventDefault();selecionar();}
        };
        grupo.append(path);
        if (uf !== "DF") {
            const [x,y] = CONTORNOS_UF[uf].rotulo;
            const rotulo = svgElemento("text", {x,y,"text-anchor":"middle","dominant-baseline":"middle"});
            rotulo.textContent = uf;
            grupo.append(rotulo);
        }
        mapa.append(grupo);
    });
    // Ampliação do DF para facilitar o toque no celular.
    const [dx,dy] = CONTORNOS_UF.DF.rotulo;
    mapa.append(svgElemento("line", {x1:dx,y1:dy,x2:568,y2:410,stroke:"#94a3b8","stroke-dasharray":"3 3"}));
    const df = svgElemento("circle", {id:"mapa-DF-ampliado",cx:582,cy:410,r:17,class:"uf",fill:"#334155",tabindex:"0",role:"button","aria-label":"Distrito Federal (ampliado)"});
    df.onclick = () => {ufSelecionada = "DF";atualizarEstados();};
    df.onkeydown = evento => {if(evento.key === "Enter" || evento.key === " "){evento.preventDefault();df.onclick();}};
    const dfTexto = svgElemento("text", {x:582,y:414,"text-anchor":"middle"});
    dfTexto.textContent = "DF";
    mapa.append(df,dfTexto);
    const legenda = document.createElement("div");
    legenda.id = "legendaMapa";
    [...candidatos, {nome:"Sem votos apurados",cor:"#334155"}, {nome:"Empate",cor:"#94a3b8"}].forEach(c => {
        const item = document.createElement("span");
        item.className = "item-legenda";
        const cor = document.createElement("span");
        cor.className = "cor-legenda";
        cor.style.background = c.cor;
        cor.setAttribute("aria-hidden", "true");
        const nome = document.createElement("span");
        nome.textContent = c.nome;
        item.append(cor,nome);
        legenda.append(item);
    });
    const detalhe = document.createElement("div");
    detalhe.id = "detalheUF";
    detalhe.hidden = true;
    const nota = document.createElement("p");
    nota.className = "nota-mapa";
    nota.textContent = "Toque em uma UF para ver os votos. Cores indicam a liderança parcial; ao concluir, o resultado. Simulação fictícia.";
    const fonte = document.createElement("a");
    fonte.href = "https://github.com/henriquemalvar/br-geojson";
    fonte.textContent = "Contornos: IBGE / br-geojson (CC0)";
    fonte.style.cssText = "color:#94a3b8;font-size:11px";
    painel.append(tituloMapa,resumo,mapa,legenda,detalhe,nota,fonte);
}

function situacaoUF(u) {
    if (!u.total) return "Sem votos nesta simulação";
    if (u.concluida) return "100% apurado";
    if (!u.apurados) return "Aguardando apuração";
    // Evita mostrar 100% por arredondamento antes de concluir.
    return Math.min(99.9, u.apurados / u.total * 100).toFixed(1) + "% apurado";
}

function corResultadoUF(u) {
    if (!u.apurados) return {cor:"#334155",texto:"Sem votos apurados"};
    const maior = Math.max(...u.votos);
    const indices = u.votos.map((v,i) => v === maior ? i : -1).filter(i => i >= 0);
    if (indices.length > 1) return {cor:"#94a3b8",texto:"Empate"};
    const c = candidatos[indices[0]];
    return {cor:c.cor,texto:`${u.concluida ? "Venceu" : "Lidera"}: ${c.nome}`};
}

function atualizarEstados() {
    const concluidas = unidades.filter(u => u.concluida && u.total > 0).length;
    el("resumoEstados").textContent = `${concluidas}/${unidades.filter(u => u.total > 0).length} UFs com votos concluídas`;
    unidades.forEach(u => {
        const resultado = corResultadoUF(u);
        const path = el(`mapa-${u.uf}`);
        const descricao = `${u.nome}: ${situacaoUF(u)}. ${resultado.texto}.`;
        path.setAttribute("fill", resultado.cor);
        path.setAttribute("aria-label", descricao);
        path.setAttribute("aria-pressed", String(ufSelecionada === u.uf));
        path.classList.toggle("selecionada", ufSelecionada === u.uf);
        path.firstChild.textContent = descricao;
        if (u.uf === "DF") {
            const df = el("mapa-DF-ampliado");
            df.setAttribute("fill",resultado.cor);
            df.setAttribute("aria-label",descricao + " Distrito Federal ampliado.");
            df.setAttribute("aria-pressed",String(ufSelecionada === "DF"));
            df.classList.toggle("selecionada",ufSelecionada === "DF");
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
    candidatos.map((c, i) => ({ ...c, votos: u.votos[i] }))
        .sort((a, b) => b.votos - a.votos).forEach(c => {
            const linha = document.createElement("p");
            const percentual = u.apurados ? c.votos / u.apurados * 100 : 0;
            linha.textContent = `${c.nome}: ${c.votos.toLocaleString("pt-BR")} votos (${percentual.toFixed(2)}%)`;
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

function atualizar(apurados) {
    const percentual = apurados / total * 100;
    el("porcentagemApurada").textContent = percentual.toFixed(1) + "% apurado";
    el("progresso").style.width = percentual + "%";
    const resultados = el("resultados");
    resultados.replaceChildren();
    [...candidatos].sort((a, b) => b.votos - a.votos).forEach(c => {
        const porcentagem = apurados ? c.votos / apurados * 100 : 0;
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
        quantidade.textContent = c.votos.toLocaleString("pt-BR") + " votos";
        linha.append(info, barra, quantidade);
        resultados.append(linha);
    });
}

function finalizar() {
    estado = "concluido";
    const ordenados = [...candidatos].sort((a, b) => b.votos - a.votos);
    const lideres = ordenados.filter(c => c.votos === ordenados[0].votos);
    const mensagem = el("vencedor");

    // Todos os votos são válidos. Exatamente 50% não é maioria absoluta.
    if (ordenados[0].votos > Math.floor(total / 2)) {
        mensagem.textContent = `🏆 Eleito no ${turno}º turno: ${ordenados[0].nome}`;
        return;
    }
    if (turno === 2 || candidatos.length === 2) {
        mensagem.textContent = "Empate final entre: " + lideres.map(c => c.nome).join(", ") +
            ". Nenhum vencedor definido. Use Nova votação para simular novamente.";
        return;
    }

    const corte = ordenados[1].votos;
    const garantidos = ordenados.filter(c => c.votos > corte);
    const empatados = ordenados.filter(c => c.votos === corte);
    const vagas = 2 - garantidos.length;
    if (empatados.length > vagas) {
        estado = "desempate";
        mensagem.textContent = "Empate na classificação entre: " +
            empatados.map(c => c.nome).join(", ") +
            `. Há ${vagas} vaga(s). O simulador permite um sorteio entre os empatados.`;
        botaoAcao("Sortear classificação dos empatados", () => {
            if (estado !== "desempate") return;
            const sorteados = [...empatados];
            for (let i = sorteados.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [sorteados[i], sorteados[j]] = [sorteados[j], sorteados[i]];
            }
            prepararSegundoTurno([...garantidos, ...sorteados.slice(0, vagas)], true);
        });
    } else {
        prepararSegundoTurno(ordenados.slice(0, 2), false);
    }
}

function prepararSegundoTurno(selecionados, houveSorteio) {
    finalistas = selecionados.map(c => ({ ...c }));
    estado = "aguardandoSegundoTurno";
    el("vencedor").textContent = (houveSorteio ? "Desempate por sorteio concluído. " :
        "Ninguém obteve mais de 50% dos votos válidos. ") +
        "Finalistas: " + finalistas.map(c => c.nome).join(" e ") + ".";
    botaoAcao("Iniciar 2º Turno", iniciarSegundoTurno);
}

function iniciarSegundoTurno() {
    if (estado !== "aguardandoSegundoTurno") return;
    turno = 2;
    candidatos = finalistas.map(c => ({ ...c, votos: 0 }));
    apurar();
}

function novaVotacao() {
    clearInterval(intervalo);
    intervalo = null;
    candidatos = [];
    finalistas = [];
    unidades = [];
    ufSelecionada = null;
    const painel = el("painelEstados");
    if (painel) painel.replaceChildren();
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
    document.addEventListener("DOMContentLoaded", conectarNovaVotacao, { once: true });
} else {
    conectarNovaVotacao();
}
