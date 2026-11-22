"use strict";

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
        el("evolucao").insertAdjacentElement("afterend", painel);
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

    return percentualApurado(u.apurados, u.total) + "% apurado";
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
    if (!u) return;

    if (!detalhe.firstElementChild) {
        const cabecalho = document.createElement("h4");
        const linhas = candidatos.map(() => document.createElement("p"));
        const fechar = document.createElement("button");

        fechar.type = "button";
        fechar.textContent = "Fechar detalhes";
        fechar.onclick = () => {
            const anterior = ufSelecionada;
            ufSelecionada = null;
            atualizarEstados();
            el(`mapa-${anterior}`).focus();
        };

        detalhe.append(cabecalho, ...linhas, fechar);
    }

    detalhe.firstElementChild.textContent = `${u.nome} — ${situacaoUF(u)}`;
    candidatos
        .map((c, i) => ({ nome: c.nome, votos: u.votos[i] }))
        .sort((a, b) => b.votos - a.votos)
        .forEach((c, i) => {
            const percentual = u.apurados ? c.votos / u.apurados * 100 : 0;
            detalhe.children[i + 1].textContent =
                `${c.nome}: ${c.votos.toLocaleString("pt-BR")} votos (${percentual.toFixed(2)}%)`;
        });
}