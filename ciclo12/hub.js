/* =========================================================
   Ciclo 12 — lógica do hub (index.html)
   - Abas (Início, Problemas, Mapa) pelo endereço (#inicio, #mapa...)
   - Lista "mais perto da escola"
   - Mapa Leaflet + lista + filtro por material + "perto de mim"
   Segurança: todo texto vai para a tela com textContent (nunca innerHTML).
   ========================================================= */
(function () {
  "use strict";

  var DADOS = window.CICLO_PONTOS;
  function $(id) { return document.getElementById(id); }

  /* Cria um elemento com texto seguro. el("p", {className:"x"}, ["texto", outroEl]) */
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

  if (!DADOS) {
    var falha = el("div", { className: "aviso aviso-conflito", role: "alert" }, [
      el("span", { className: "aviso-titulo", text: "Erro" }),
      el("p", { text: "Os dados dos pontos (shared/pontos.js) não carregaram. Recarregue a página." })
    ]);
    $("conteudo").prepend(falha);
    return;
  }

  var ESCOLA = DADOS.ESCOLA;
  var PONTOS = DADOS.PONTOS;
  var CAT = DADOS.CATEGORIAS;

  /* ---------- números e distâncias ---------- */
  var fmt1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function haversineKm(lat1, lng1, lat2, lng2) {
    var R = 6371, r = Math.PI / 180;
    var dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function temPosicao(p) { return p.lat != null && p.lng != null; }
  function textoKm(p, km) {
    if (km == null) { return "sem posição"; }
    return (p.coordPrecisao === "aproximada" ? "≈ " : "") + fmt1.format(km) + " km";
  }
  var VIZINHO = "Vila Galvão"; // bairro da escola

  /* ---------- etiquetas de status ---------- */
  function etiquetas(p) {
    var lista = [];
    if (p.status === "conflito") { lista.push(["etiqueta-conflito", "Endereço em conflito"]); }
    else if (p.status === "exemplo") { lista.push(["etiqueta-exemplo", "EXEMPLO"]); }
    else { lista.push(["etiqueta-ok", "Listado na fonte"]); }
    if (p.coordPrecisao === "aproximada") {
      lista.push(["etiqueta-confirmar", "Posição aproximada (até " + fmt1.format(p.coordIncertezaKm) + " km)"]);
    }
    if (p.coordPrecisao === "sem" && p.tipo === "pev") { lista.push(["etiqueta-confirmar", "Sem posição no mapa"]); }
    if (p.bairro === VIZINHO) { lista.push(["etiqueta-ok", "Mesmo bairro da escola"]); }
    var box = el("span", { className: "etiquetas" });
    lista.forEach(function (t) { box.appendChild(el("span", { className: "etiqueta " + t[0], text: t[1] })); });
    return box;
  }
  function nomesCat(chaves) { return chaves.map(function (k) { return CAT[k] || k; }).join(", "); }

  /* =========================================================
     ABAS
     ========================================================= */
  var ABAS = ["inicio", "problemas", "mapa"];
  /* inicial = true quando a página acabou de abrir: não mexe no endereço nem na rolagem
     (mexer no endereço faria o Tab do teclado pular o cabeçalho). */
  function abrir(aba, alvo, inicial) {
    if (ABAS.indexOf(aba) < 0) { aba = "inicio"; }
    ABAS.forEach(function (a) { $(a).hidden = (a !== aba); });
    document.querySelectorAll(".navegacao a").forEach(function (l) {
      if (l.getAttribute("data-aba") === aba) { l.setAttribute("aria-current", "page"); }
      else { l.removeAttribute("aria-current"); }
    });
    if (!inicial) {
      try { history.replaceState(null, "", "#" + (alvo || aba)); } catch (e) { /* sem histórico */ }
    }
    if (aba === "mapa") { iniciarMapa(); }
    if (alvo && $(alvo)) { $(alvo).scrollIntoView({ block: "start" }); }
    else if (!inicial) { window.scrollTo(0, 0); }
  }
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest("[data-aba]");
    if (!a) { return; }
    ev.preventDefault();
    abrir(a.getAttribute("data-aba"), a.getAttribute("data-alvo"));
  });
  function lerEndereco() {
    var h = (location.hash || "").replace("#", "");
    if (h.indexOf("p-") === 0) { abrir("problemas", h, true); } else { abrir(h || "inicio", null, true); }
  }

  /* =========================================================
     INÍCIO: ecopontos mais perto da escola
     ========================================================= */
  (function () {
    var lista = $("perto-lista");
    var comPos = PONTOS.filter(function (p) { return p.distEscolaKm != null; })
      .sort(function (a, b) { return a.distEscolaKm - b.distEscolaKm; }).slice(0, 3);
    comPos.forEach(function (p) {
      lista.appendChild(el("li", null, [
        el("span", { className: "nome", text: p.nome }),
        el("span", { className: "km", text: textoKm(p, p.distEscolaKm) }),
        el("span", { className: "det", text: p.endereco.replace(", Guarulhos/SP", "") + ". " + p.horarioTexto + "." })
      ]));
    });
  })();

  /* =========================================================
     MAPA
     ========================================================= */
  var mapa = null, camada = null, marcadores = {}, marcadorVoce = null;
  var referencia = { lat: ESCOLA.lat, lng: ESCOLA.lng, nome: "a escola" };
  var materialEscolhido = "";

  /* Filtro "O que você quer descartar?" */
  (function () {
    var sel = $("filtro-material");
    sel.appendChild(el("option", { value: "", text: "Mostrar todos os ecopontos" }));
    var grupos = [
      ["Os ecopontos recebem (segundo a fonte)", PONTOS[0].aceita],
      ["Os ecopontos NÃO recebem (segundo a fonte)", PONTOS[0].naoAceita],
      ["Sem informação na fonte", PONTOS[0].naoConfirmado]
    ];
    grupos.forEach(function (g) {
      var og = el("optgroup", { label: g[0] });
      g[1].forEach(function (k) { og.appendChild(el("option", { value: k, text: CAT[k] || k })); });
      sel.appendChild(og);
    });
    sel.addEventListener("change", function () { materialEscolhido = sel.value; desenhar(); });
  })();

  function pontosVisiveis() {
    if (!materialEscolhido) { return PONTOS.slice(); }
    return PONTOS.filter(function (p) {
      return p.aceita.indexOf(materialEscolhido) >= 0 || p.naoConfirmado.indexOf(materialEscolhido) >= 0;
    });
  }

  function respostaFiltro() {
    var r = $("resposta-filtro");
    r.textContent = "";
    r.className = "resposta-filtro";
    var m = materialEscolhido;
    if (!m) { return; }
    var nome = CAT[m] || m;
    var naoAceita = PONTOS[0].naoAceita.indexOf(m) >= 0;
    var semInfo = PONTOS[0].naoConfirmado.indexOf(m) >= 0;
    var caixa, titulo, texto;
    if (naoAceita) {
      caixa = "aviso aviso-conflito"; titulo = "Não leve ao ecoponto";
      texto = "Segundo a matéria da Agência Mural, os ecopontos não recebem " + nome.toLowerCase() +
        ". Onde levar: a confirmar com a Prefeitura de Guarulhos.";
    } else if (semInfo) {
      caixa = "aviso aviso-confirmar"; titulo = "A confirmar";
      texto = "A fonte não diz se os ecopontos recebem " + nome.toLowerCase() +
        ". Os pontos aparecem abaixo, mas ligue antes de ir.";
    } else {
      caixa = "aviso aviso-ok"; titulo = "Recebe";
      texto = nome + " está na lista de materiais que a matéria diz que os ecopontos recebem. Limites de quantidade: site da prefeitura.";
    }
    r.className = "resposta-filtro " + caixa;
    r.appendChild(el("span", { className: "aviso-titulo", text: titulo }));
    r.appendChild(el("span", { text: texto }));
  }

  function conteudoPopup(p, km) {
    var box = el("div", null, [
      el("p", { className: "popup-nome", text: p.nome }),
      el("p", { text: p.endereco }),
      p.referencia ? el("p", { text: "Referência: " + p.referencia }) : null,
      el("p", { text: "Horário: " + p.horarioTexto }),
      el("p", { text: "Distância até " + referencia.nome + ": " + textoKm(p, km) }),
      el("p", { text: "Recebe: " + nomesCat(p.aceita) }),
      el("p", { text: "Não recebe: " + nomesCat(p.naoAceita) }),
      el("p", { text: "Confirmar: " + nomesCat(p.naoConfirmado) }),
      p.nota ? el("p", { text: p.nota }) : null,
      p.coordPrecisao === "aproximada" ? el("p", { text: p.coordNota }) : null,
      etiquetas(p)
    ]);
    return box;
  }

  /* Leaflet (biblioteca do mapa) só é baixado quando alguém abre a aba do mapa.
     Assim a página inicial não depende de internet externa nem fica em branco esperando o CDN.
     Os hashes "integrity" garantem que o arquivo baixado é exatamente o Leaflet 1.9.4. */
  var LEAFLET = {
    css: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
    cssHash: "sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw==",
    js: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
    jsHash: "sha512-puJW3E/qXDqYp9IfhAI54BJEaWIfloJ7JWs7OeD5i6ruC9JZL1gERT1wjtwXFlh7CjE7ZJ+/vcRZRkIYIb6p4g=="
  };
  var estadoLeaflet = window.L ? "pronto" : "nao-iniciado"; // nao-iniciado | carregando | pronto | falhou
  function carregarLeaflet(depois) {
    if (estadoLeaflet === "pronto" || estadoLeaflet === "falhou") { depois(); return; }
    if (estadoLeaflet === "carregando") { return; }
    estadoLeaflet = "carregando";
    var faltam = 2, deuErro = false; // espera o CSS e o JS
    function umPronto(ok) {
      if (!ok) { deuErro = true; }
      faltam -= 1;
      if (faltam === 0) { estadoLeaflet = (!deuErro && window.L) ? "pronto" : "falhou"; depois(); }
    }
    var css = document.createElement("link");
    css.onload = function () { umPronto(true); };
    css.onerror = function () { umPronto(false); };
    css.rel = "stylesheet"; css.href = LEAFLET.css; css.integrity = LEAFLET.cssHash;
    css.crossOrigin = "anonymous"; css.referrerPolicy = "no-referrer";
    document.head.appendChild(css);
    var js = document.createElement("script");
    js.src = LEAFLET.js; js.integrity = LEAFLET.jsHash;
    js.crossOrigin = "anonymous"; js.referrerPolicy = "no-referrer";
    js.onload = function () { umPronto(true); };
    js.onerror = function () { umPronto(false); };
    document.body.appendChild(js);
  }

  function iniciarMapa() {
    var area = $("mapa-area");
    if (mapa) { setTimeout(function () { mapa.invalidateSize(); }, 50); return; }
    if (estadoLeaflet !== "pronto" && estadoLeaflet !== "falhou") {
      if (estadoLeaflet === "nao-iniciado") {
        area.classList.add("mapa-sem-leaflet");
        area.textContent = "Carregando o mapa...";
        desenhar(); // a lista já aparece enquanto o mapa baixa
      }
      carregarLeaflet(iniciarMapa);
      return;
    }
    if (!window.L) {
      area.classList.add("mapa-sem-leaflet");
      area.textContent = "O mapa não carregou (sem internet?). A lista de ecopontos continua funcionando.";
      desenhar();
      return;
    }
    area.classList.remove("mapa-sem-leaflet");
    area.textContent = "";
    mapa = L.map(area, { scrollWheelZoom: false }).setView([ESCOLA.lat, ESCOLA.lng], 13);
    var ruas = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; colaboradores do OpenStreetMap"
    }).addTo(mapa);
    var erros = 0, carregou = false;
    ruas.on("tileload", function () {
      carregou = true;
      area.classList.remove("sem-ruas");
      var n = $("mapa-aviso"); if (n) { n.remove(); }
    });
    ruas.on("tileerror", function () {
      erros += 1;
      if (erros >= 3 && !carregou && !$("mapa-aviso")) {
        area.classList.add("sem-ruas");
        var n = el("div", { id: "mapa-aviso", className: "aviso aviso-confirmar mapa-aviso", role: "status" }, [
          el("span", { className: "aviso-titulo", text: "Ruas não carregaram" }),
          el("span", { text: "Sem internet ou servidor de mapas fora do ar. Os pontos continuam nas posições certas e a lista funciona." })
        ]);
        area.appendChild(n);
      }
    });
    camada = L.layerGroup().addTo(mapa);
    var iconeEscola = L.divIcon({ className: "", html: '<span class="pino-escola-marcador"></span>', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] });
    L.marker([ESCOLA.lat, ESCOLA.lng], { icon: iconeEscola, title: "Colégio Progresso (escola)", keyboard: true, zIndexOffset: 1000 })
      .bindPopup(el("div", null, [
        el("p", { className: "popup-nome", text: ESCOLA.nome }),
        el("p", { text: ESCOLA.endereco }),
        el("p", { text: ESCOLA.nota }),
        el("span", { className: "etiquetas" }, [el("span", { className: "etiqueta etiqueta-confirmar", text: "Endereço a confirmar" })])
      ]))
      .addTo(mapa);
    desenhar();
    setTimeout(function () { mapa.invalidateSize(); }, 50);
  }

  function desenhar() {
    respostaFiltro();
    var vis = pontosVisiveis().map(function (p) {
      return { p: p, km: temPosicao(p) ? haversineKm(referencia.lat, referencia.lng, p.lat, p.lng) : null };
    });
    vis.sort(function (a, b) {
      if (a.km == null && b.km == null) { return a.p.nome.localeCompare(b.p.nome, "pt-BR"); }
      if (a.km == null) { return 1; }
      if (b.km == null) { return -1; }
      return a.km - b.km;
    });

    /* marcadores */
    if (mapa && camada) {
      camada.clearLayers();
      marcadores = {};
      vis.forEach(function (o) {
        var p = o.p;
        if (!temPosicao(p)) { return; }
        var classe = "pino" + (p.coordPrecisao === "aproximada" ? " pino-aprox" : "");
        var icone = L.divIcon({ className: "", html: '<span class="' + classe + '"></span>', iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10] });
        marcadores[p.id] = L.marker([p.lat, p.lng], { icon: icone, title: p.nome, keyboard: true })
          .bindPopup(conteudoPopup(p, o.km), { maxWidth: Math.max(200, Math.min(280, $("mapa-area").clientWidth - 90)), maxHeight: 260, autoPanPaddingTopLeft: [56, 16], autoPanPaddingBottomRight: [12, 12] })
          .addTo(camada);
      });
    }

    /* resumo */
    var noMapa = vis.filter(function (o) { return o.km != null; }).length;
    $("lista-resumo").textContent = vis.length + (vis.length === 1 ? " ecoponto" : " ecopontos") +
      " (" + noMapa + " no mapa, " + (vis.length - noMapa) + " sem posição)";
    $("lista-referencia").textContent = "Ordenados pela distância em linha reta até " + referencia.nome + ".";

    /* lista */
    var lista = $("lista-pontos");
    lista.textContent = "";
    if (!vis.length) {
      lista.appendChild(el("li", { className: "texto-pequeno", text: "Nenhum ecoponto para este material, segundo a fonte." }));
    }
    vis.forEach(function (o) {
      var p = o.p;
      var acao = null;
      if (temPosicao(p)) {
        var b = el("button", { className: "botao botao-secundario botao-pequeno", type: "button", text: "Ver no mapa" });
        b.addEventListener("click", function () {
          if (mapa && marcadores[p.id]) {
            $("mapa-area").scrollIntoView({ block: "center" });
            mapa.setView([p.lat, p.lng], 16, { animate: false });
            marcadores[p.id].openPopup();
          }
        });
        acao = el("span", { className: "acao" }, [b]);
      } else {
        acao = el("span", { className: "acao texto-pequeno", text: p.coordNota });
      }
      lista.appendChild(el("li", { className: "item-ponto" + (p.bairro === VIZINHO ? " vizinho" : "") }, [
        el("span", { className: "nome", text: p.nome }),
        el("span", { className: "km", text: textoKm(p, o.km) }),
        el("span", { className: "det", text: p.endereco.replace(", Guarulhos/SP", "") + ". " + p.horarioTexto + "." }),
        etiquetas(p),
        acao
      ]));
    });

    /* locais de doação (por enquanto só modelos EXEMPLO) */
    var doa = $("lista-doacao");
    doa.textContent = "";
    var m = materialEscolhido;
    var exemplos = DADOS.DOACAO.filter(function (d) { return !m || d.aceita.indexOf(m) >= 0; });
    if (exemplos.length && (!m || m === "roupa" || m === "comida")) {
      doa.appendChild(el("h2", { className: "lista-doacao-titulo", text: "Locais de doação de roupas e alimentos" }));
      doa.appendChild(el("div", { className: "aviso aviso-exemplo" }, [
        el("span", { className: "aviso-titulo", text: "EXEMPLO" }),
        el("span", { text: "Ainda não temos nenhum local de doação confirmado. Os itens abaixo são modelos fictícios, sem endereço." })
      ]));
      var ul = el("ul", { className: "lista-pontos" });
      exemplos.forEach(function (d) {
        ul.appendChild(el("li", { className: "item-ponto" }, [
          el("span", { className: "nome", text: d.nome }),
          el("span", { className: "km", text: "sem posição" }),
          el("span", { className: "det", text: "Recebe: " + nomesCat(d.aceita) + ". " + d.nota }),
          etiquetas(d)
        ]));
      });
      doa.appendChild(ul);
    }
  }

  /* "Pontos perto de mim" */
  $("btn-perto").addEventListener("click", function () {
    var r = $("lista-referencia");
    function falhou(msg) {
      r.textContent = msg + " A lista continua ordenada a partir da escola.";
    }
    if (!navigator.geolocation) { falhou("Este navegador não informa a localização."); return; }
    r.textContent = "Procurando sua localização...";
    navigator.geolocation.getCurrentPosition(function (pos) {
      referencia = { lat: pos.coords.latitude, lng: pos.coords.longitude, nome: "você" };
      if (mapa) {
        var icone = L.divIcon({ className: "", html: '<span class="pino-voce"></span>', iconSize: [16, 16], iconAnchor: [8, 8] });
        if (marcadorVoce) { marcadorVoce.setLatLng([referencia.lat, referencia.lng]); }
        else { marcadorVoce = L.marker([referencia.lat, referencia.lng], { icon: icone, title: "Você está aqui" }).addTo(mapa); }
        mapa.setView([referencia.lat, referencia.lng], 14);
      }
      desenhar();
    }, function (erro) {
      if (erro && erro.code === 1) { falhou("Você não permitiu o acesso à localização."); }
      else { falhou("Não foi possível pegar sua localização."); }
    }, { timeout: 10000, maximumAge: 60000 });
  });

  /* ---------- começar ---------- */
  window.addEventListener("hashchange", lerEndereco);
  lerEndereco();
})();
