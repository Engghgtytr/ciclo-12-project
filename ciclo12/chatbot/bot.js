/* =========================================================
   Ciclo Bot — lógica da conversa (por regras, offline, sem API)
   1) normaliza o texto (minúsculas, sem acento, sem pontuação)
   2) compara com as palavras de cada item, aceitando pequenos erros de digitação
   3) responde com o item de maior pontuação; se houver dúvida, pergunta "você quis dizer?"
   Segurança: TODO texto vai para a tela com textContent (nunca innerHTML).
   ========================================================= */
(function () {
  "use strict";

  var BOT = window.CICLO_BOT;
  var PONTOS = window.CICLO_PONTOS;
  function $(id) { return document.getElementById(id); }

  function el(tag, props, filhos) {
    var e = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === "className") { e.className = props[k]; }
        else if (k === "text") { e.textContent = props[k]; }
        else { e.setAttribute(k, props[k]); }
      });
    }
    (filhos || []).forEach(function (f) {
      if (f == null) { return; }
      e.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return e;
  }

  var conversa = $("conversa");
  if (!BOT) {
    conversa.appendChild(el("p", { className: "aviso aviso-conflito", text: "A base de conhecimento não carregou. Recarregue a página." }));
    return;
  }
  var ITENS = BOT.ITENS;
  var POR_ID = {};
  ITENS.forEach(function (i) { POR_ID[i.id] = i; });

  /* =========================================================
     1. TEXTO: normalizar, separar palavras, tolerar erros
     ========================================================= */
  var PARADAS = ("de da do das dos o a os as um uma uns umas e ou no na nos nas em para pra pro com sem por " +
    "que qual quais onde como quando eu meu minha meus minhas voce vc levo levar jogo jogar joga fora " +
    "descarto descartar descarte coloco colocar ponho posso pode faco fazer se isso esse essa este esta " +
    "tenho la aqui mim me ser vai vou tem sobre quero devo deve botar boto lugar coisa jogado").split(" ");
  var PARADA = {};
  PARADAS.forEach(function (p) { PARADA[p] = true; });

  function normalizar(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function palavras(s) {
    return normalizar(s).split(" ").filter(function (w) { return w && !PARADA[w]; });
  }
  function singular(w) { return w.length > 4 && w.charAt(w.length - 1) === "s" ? w.slice(0, -1) : w; }

  /* distância de edição (Levenshtein): quantas letras trocar/inserir/apagar para virar a outra */
  function distancia(a, b) {
    if (a === b) { return 0; }
    var linha = [], i, j;
    for (j = 0; j <= b.length; j++) { linha[j] = j; }
    for (i = 1; i <= a.length; i++) {
      var anterior = linha[0];
      linha[0] = i;
      for (j = 1; j <= b.length; j++) {
        var guardado = linha[j];
        linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        anterior = guardado;
      }
    }
    return linha[b.length];
  }
  /* 2 = igual; 1 = parecida (erro de digitação); 0 = diferente.
     Palavras curtas (até 3 letras) só valem se forem iguais. */
  function parecida(a, b) {
    a = singular(a); b = singular(b);
    if (a === b) { return 2; }
    if (a.length < 4 || b.length < 4) { return 0; }
    var tolerancia = Math.max(a.length, b.length) >= 7 ? 2 : 1;
    return distancia(a, b) <= tolerancia ? 1 : 0;
  }

  /* Pontuação de um item/intenção: frase inteira encontrada = 10 por palavra (+1 se sem erro);
     frase só em parte = 3 por palavra (vira sugestão "você quis dizer?"). */
  function pontuar(pergunta, lista) {
    var melhor = 0, comErro = false, parcial = 0;
    lista.forEach(function (frase) {
      var pf = palavras(frase);
      if (!pf.length) { return; }
      var achadas = 0, exata = true;
      pf.forEach(function (w) {
        var r = 0;
        pergunta.forEach(function (q) { r = Math.max(r, parecida(w, q)); });
        if (r > 0) { achadas += 1; if (r === 1) { exata = false; } }
      });
      if (achadas === pf.length) {
        var s = 10 * pf.length + (exata ? 1 : 0);
        if (s > melhor) { melhor = s; comErro = !exata; }
      } else if (achadas > 0) {
        parcial = Math.max(parcial, 3 * achadas);
      }
    });
    return { total: melhor, comErro: comErro, parcial: parcial };
  }

  function entender(texto) {
    var q = palavras(texto);
    if (!q.length) { return { tipo: "nada" }; }
    var ranking = ITENS.map(function (item) { return { item: item, p: pontuar(q, item.palavras) }; })
      .sort(function (a, b) { return (b.p.total - a.p.total) || (b.p.parcial - a.p.parcial); });
    var primeiro = ranking[0], segundo = ranking[1];
    if (primeiro.p.total > 0) {
      // empate entre dois itens encontrados só com erro de digitação: pergunta
      if (primeiro.p.comErro && segundo.p.total === primeiro.p.total) {
        return { tipo: "duvida", opcoes: [primeiro.item, segundo.item] };
      }
      return { tipo: "item", item: primeiro.item, comErro: primeiro.p.comErro };
    }
    // nenhum item: tenta as intenções (oi, obrigado, cores, ODS, ponto mais perto...)
    var melhorIntencao = null, notaIntencao = 0;
    BOT.INTENCOES.forEach(function (it) {
      var p = pontuar(q, it.palavras);
      if (p.total > notaIntencao) { notaIntencao = p.total; melhorIntencao = it.id; }
    });
    if (melhorIntencao) { return { tipo: "intencao", id: melhorIntencao }; }
    var parciais = ranking.filter(function (r) { return r.p.parcial > 0; }).slice(0, 2);
    if (parciais.length) { return { tipo: "duvida", opcoes: parciais.map(function (r) { return r.item; }) }; }
    return { tipo: "nada" };
  }

  /* =========================================================
     2. PONTOS: Ecoponto mais perto (mesma lista do mapa)
     ========================================================= */
  var fmt1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var referencia = PONTOS ? { lat: PONTOS.ESCOLA.lat, lng: PONTOS.ESCOLA.lng, nome: "da escola" } : null;
  function haversineKm(a, b, c, d) {
    var R = 6371, r = Math.PI / 180;
    var x = Math.sin((c - a) * r / 2) * Math.sin((c - a) * r / 2) +
      Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) * Math.sin((d - b) * r / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function maisPertos(qtd) {
    if (!PONTOS || !referencia) { return []; }
    return PONTOS.PONTOS
      .filter(function (p) { return p.status === "confirmado-fonte" && p.lat != null; })
      .map(function (p) { return { p: p, km: haversineKm(referencia.lat, referencia.lng, p.lat, p.lng) }; })
      .sort(function (a, b) { return a.km - b.km; })
      .slice(0, qtd);
  }
  function textoKm(o) { return (o.p.coordPrecisao === "aproximada" ? "≈ " : "") + fmt1.format(o.km) + " km"; }
  function blocoPev(o, titulo) {
    var p = o.p;
    return el("div", { className: "bloco-pev" }, [
      el("p", null, [el("b", { text: titulo + ": " }), p.nome + (p.bairro ? " (" + p.bairro + ")" : "")]),
      el("p", { text: p.endereco }),
      el("p", { text: "Horário: " + p.horarioTexto }),
      el("p", { text: "Distância " + referencia.nome + ": " + textoKm(o) + (p.coordPrecisao === "aproximada" ? " (posição aproximada)" : "") })
    ]);
  }

  /* =========================================================
     3. MENSAGENS NA TELA
     ========================================================= */
  function rolarParaBaixo() { conversa.scrollTop = conversa.scrollHeight; }

  function msgUsuario(texto) {
    var m = el("div", { className: "msg msg-usuario" }, [
      el("span", { className: "so-leitor", text: "Você disse: " }),
      el("div", { className: "balao", text: texto })
    ]);
    conversa.appendChild(m);
    rolarParaBaixo();
  }

  function msgBot(conteudo, rapidas) {
    var balao = el("div", { className: "balao" }, conteudo);
    if (rapidas && rapidas.length) {
      var box = el("div", { className: "respostas-rapidas" });
      rapidas.forEach(function (r) {
        var b = el("button", { type: "button", text: r.rotulo });
        b.addEventListener("click", function () { msgUsuario(r.rotulo); responderDepois(r.acao); });
        box.appendChild(b);
      });
      balao.appendChild(box);
    }
    var m = el("div", { className: "msg msg-bot" }, [
      el("img", { className: "msg-avatar", src: "../shared/logo.svg", alt: "" }),
      el("span", { className: "so-leitor", text: "Ciclo Bot disse: " }),
      balao
    ]);
    conversa.appendChild(m);
    rolarParaBaixo();
  }

  /* "digitando..." por 400 ms antes de responder */
  var ocupado = false;
  function responderDepois(acao) {
    var dig = el("div", { className: "msg msg-bot digitando", "aria-hidden": "true" }, [
      el("img", { className: "msg-avatar", src: "../shared/logo.svg", alt: "" }),
      el("div", { className: "balao" }, [el("span", { className: "ponto-dig" }), el("span", { className: "ponto-dig" }), el("span", { className: "ponto-dig" })])
    ]);
    conversa.appendChild(dig);
    rolarParaBaixo();
    ocupado = true;
    setTimeout(function () {
      dig.remove();
      ocupado = false;
      acao();
    }, 400);
  }

  /* =========================================================
     4. RESPOSTAS
     ========================================================= */
  var RAPIDAS_PADRAO = [
    { rotulo: "Ponto mais perto", acao: function () { responderPerto(); } },
    { rotulo: "Lixeira por cor", acao: function () { responderCores(); } },
    { rotulo: "Menu", acao: function () { responderMenu(); } }
  ];
  function rapidaItem(id) {
    var it = POR_ID[id];
    return { rotulo: it.nome, acao: function () { responderItem(it, false); } };
  }

  function responderItem(item, comErro) {
    var partes = [];
    if (comErro) { partes.push(el("p", { className: "texto-pequeno", text: "Entendi como: " + item.nome + "." })); }
    partes.push(el("p", { className: "balao-titulo", text: item.nome }));
    partes.push(el("p", { text: item.resposta }));
    partes.push(el("div", { className: "linha-info" }, [el("b", { text: "Onde:" }), el("span", { text: item.ondeDescartar })]));
    if (item.lixeira) {
      partes.push(el("div", { className: "linha-info" }, [
        el("b", { text: "Lixeira:" }),
        el("span", null, [el("span", { className: "amostra-lixeira cor-" + item.lixeira, "aria-hidden": "true" }),
          BOT.LIXEIRAS[item.lixeira] + ", na cor padrão da coleta seletiva (CONAMA 275/2001)."])
      ]));
    }
    partes.push(el("div", { className: "linha-info" }, [el("b", { text: "Dica:" }), el("span", { text: item.dicaReducao })]));

    // Ecoponto: só indica como certo quando a regra é confirmada
    if (item.tipoPonto === "pev" && item.confianca === BOT.CONFIRMADO) {
      var perto = maisPertos(1)[0];
      if (perto) { partes.push(blocoPev(perto, "Ecoponto mais perto " + referencia.nome)); }
    } else if (item.tipoPonto === "pev") {
      partes.push(el("p", { className: "texto-pequeno", text: "Não indico um Ecoponto como certo para este item porque a fonte não confirma que ele é aceito." }));
    } else if (item.tipoPonto === "doacao") {
      partes.push(el("p", { className: "texto-pequeno", text: "Pontos de doação: o grupo ainda não confirmou nenhum local. Quando confirmar, eles aparecem aqui e no mapa." }));
    }

    var conf = item.confianca === BOT.CONFIRMADO
      ? el("span", { className: "etiqueta etiqueta-ok", text: "Confirmado na fonte" })
      : el("span", { className: "etiqueta etiqueta-confirmar", text: "Confirme com a Prefeitura de Guarulhos" });
    partes.push(el("div", { className: "etiquetas-msg" }, [conf]));
    msgBot(partes, RAPIDAS_PADRAO);
  }

  function responderPerto() {
    var lista = maisPertos(3);
    if (!lista.length) { msgBot([el("p", { text: "Não consegui carregar a lista de Ecopontos." })]); return; }
    var partes = [el("p", { className: "balao-titulo", text: "Ecopontos mais perto " + referencia.nome })];
    lista.forEach(function (o, i) { partes.push(blocoPev(o, (i + 1) + "º")); });
    partes.push(el("p", { className: "texto-pequeno", text: "Distância em linha reta. Os Ecopontos recebem entulho, móveis, eletrodomésticos, óleo de cozinha, pneus e recicláveis, mas NÃO recebem pilhas, lâmpadas fluorescentes nem restos de comida (Agência Mural, 10/10/2025). Confirme horários com a Prefeitura de Guarulhos." }));
    var rapidas = [];
    if (referencia.nome === "da escola") { rapidas.push({ rotulo: "Usar minha localização", acao: pedirLocalizacao }); }
    rapidas.push({ rotulo: "Menu", acao: responderMenu });
    msgBot(partes, rapidas);
  }

  function pedirLocalizacao() {
    if (!navigator.geolocation) { msgBot([el("p", { text: "Este navegador não informa a localização. Continuo usando a escola como referência." })]); return; }
    navigator.geolocation.getCurrentPosition(function (pos) {
      referencia = { lat: pos.coords.latitude, lng: pos.coords.longitude, nome: "de você" };
      msgBot([el("p", { text: "Pronto! Agora calculo as distâncias a partir de onde você está. A localização não é salva nem enviada." })]);
      responderPerto();
    }, function (erro) {
      msgBot([el("p", { text: (erro && erro.code === 1 ? "Você não permitiu a localização." : "Não consegui pegar sua localização.") + " Continuo usando a escola como referência." })]);
    }, { timeout: 10000, maximumAge: 60000 });
  }

  function responderCores() {
    var lista = el("ul", { className: "lista-cores" });
    Object.keys(BOT.LIXEIRAS).forEach(function (cor) {
      lista.appendChild(el("li", null, [el("span", { className: "amostra-lixeira cor-" + cor, "aria-hidden": "true" }), "Lixeira " + BOT.LIXEIRAS[cor]]));
    });
    msgBot([
      el("p", { className: "balao-titulo", text: "Cores da coleta seletiva" }),
      el("p", { text: "Padrão nacional da Resolução CONAMA nº 275/2001:" }),
      lista,
      el("span", { className: "etiqueta etiqueta-ok", text: "Confirmado na fonte" })
    ], RAPIDAS_PADRAO.slice(0, 1).concat([{ rotulo: "Menu", acao: responderMenu }]));
  }

  function responderOds() {
    msgBot([
      el("p", { className: "balao-titulo", text: "ODS 12: consumo e produção responsáveis" }),
      el("p", { text: "É um dos 17 Objetivos de Desenvolvimento Sustentável da ONU. O Ciclo 12 trabalha com estas metas:" }),
      el("ul", null, [
        el("li", { text: "12.2: gestão sustentável e uso eficiente dos recursos naturais (água e energia)." }),
        el("li", { text: "12.3: reduzir pela metade o desperdício de alimentos per capita até 2030." }),
        el("li", { text: "12.5: reduzir a geração de resíduos com prevenção, redução, reciclagem e reuso." }),
        el("li", { text: "12.8: garantir informação e conscientização para todos (é aqui que este bot entra)." })
      ]),
      el("p", { className: "texto-pequeno", text: "Fonte: IPEA, metas da ODS 12." })
    ], [{ rotulo: "Menu", acao: responderMenu }]);
  }

  var MENUS = {
    eletronicos: { titulo: "Eletrônicos", itens: ["celular", "pilha", "bateria", "lampada", "computador", "eletrodomestico", "tv"] },
    roupas: { titulo: "Roupas e objetos", itens: ["roupa", "roupa-rasgada", "calcado", "cobertor", "brinquedo", "movel"] },
    cozinha: { titulo: "Cozinha e óleo", itens: ["oleo", "vidro", "plastico", "lata", "longa-vida", "pizza"] },
    alimentos: { titulo: "Alimentos", itens: ["alimento-bom", "resto-comida"] }
  };
  function responderSubmenu(nome) {
    var m = MENUS[nome];
    msgBot([el("p", { className: "balao-titulo", text: m.titulo }), el("p", { text: "Escolha um item ou digite o nome dele:" })],
      m.itens.map(rapidaItem));
  }
  function responderMenu() {
    msgBot([el("p", { text: "Digite o que você quer descartar (por exemplo: pilha, óleo, camiseta) ou escolha um assunto:" })], [
      { rotulo: "Eletrônicos", acao: function () { responderSubmenu("eletronicos"); } },
      { rotulo: "Roupas", acao: function () { responderSubmenu("roupas"); } },
      { rotulo: "Cozinha e óleo", acao: function () { responderSubmenu("cozinha"); } },
      { rotulo: "Lixeira por cor", acao: responderCores },
      { rotulo: "Alimentos", acao: function () { responderSubmenu("alimentos"); } },
      { rotulo: "ODS 12", acao: responderOds },
      { rotulo: "Ponto mais perto", acao: responderPerto }
    ]);
  }

  function responderNaoEntendi() {
    msgBot([el("p", { text: "Não entendi. Tente escrever só o nome do objeto, ou escolha uma destas:" })],
      [rapidaItem("pilha"), rapidaItem("oleo"), rapidaItem("roupa"), { rotulo: "Menu", acao: responderMenu }]);
  }

  function responder(texto) {
    var r = entender(texto);
    if (r.tipo === "item") { responderItem(r.item, r.comErro); return; }
    if (r.tipo === "duvida") {
      msgBot([el("p", { text: "Você quis dizer...?" })],
        r.opcoes.map(function (i) { return rapidaItem(i.id); }).concat([{ rotulo: "Nenhum desses", acao: responderNaoEntendi }]));
      return;
    }
    if (r.tipo === "intencao") {
      if (r.id === "saudacao") { msgBot([el("p", { text: "Oi! Eu sou o Ciclo Bot. Me diga o que você quer descartar e eu digo onde levar em Guarulhos." })], RAPIDAS_PADRAO); return; }
      if (r.id === "agradecimento") { msgBot([el("p", { text: "De nada! Se tiver outra dúvida, é só perguntar." })], RAPIDAS_PADRAO); return; }
      if (r.id === "cores") { responderCores(); return; }
      if (r.id === "ods") { responderOds(); return; }
      if (r.id === "perto") { responderPerto(); return; }
      responderMenu();
      return;
    }
    responderNaoEntendi();
  }

  /* =========================================================
     5. EVENTOS
     ========================================================= */
  $("form-pergunta").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var campo = $("pergunta");
    var texto = campo.value.trim().slice(0, 200);
    if (!texto || ocupado) { return; }
    campo.value = "";
    msgUsuario(texto);
    responderDepois(function () { responder(texto); });
  });

  $("menu-rapido").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-menu]");
    if (!b || ocupado) { return; }
    var nome = b.getAttribute("data-menu");
    msgUsuario(b.textContent);
    responderDepois(function () {
      if (MENUS[nome]) { responderSubmenu(nome); }
      else if (nome === "cores") { responderCores(); }
      else if (nome === "ods") { responderOds(); }
      else if (nome === "perto") { responderPerto(); }
    });
  });

  function boasVindas() {
    msgBot([
      el("p", { text: "Oi! Eu sou o Ciclo Bot. Digite o que você quer descartar e eu digo onde levar em Guarulhos e qual a cor da lixeira." }),
      el("p", { className: "texto-pequeno", text: "Sou um bot por regras: quando não tenho regra confirmada, eu aviso." })
    ]);
  }
  $("btn-limpar").addEventListener("click", function () {
    conversa.textContent = "";
    boasVindas();
    $("pergunta").focus();
  });

  var nItens = $("n-itens");
  if (nItens) { nItens.textContent = String(ITENS.length); }

  // para os testes automáticos (não muda nada na tela)
  window.CICLO_BOT_ENTENDER = entender;

  boasVindas();
})();
