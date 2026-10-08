/* =========================================================
   Ciclo Ponto — lógica do app (PWA)
   Abas: Pontos · Doar · Meus itens · Avisos
   Segurança: textContent sempre; armazenamento sempre com tratamento de erro.
   ========================================================= */
(function () {
  "use strict";

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

  var DADOS = window.CICLO_PONTOS;
  var fmt1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function haversineKm(a, b, c, d) {
    var R = 6371, r = Math.PI / 180;
    var x = Math.sin((c - a) * r / 2) * Math.sin((c - a) * r / 2) +
      Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) * Math.sin((d - b) * r / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  var referencia = DADOS ? { lat: DADOS.ESCOLA.lat, lng: DADOS.ESCOLA.lng, nome: "da escola" } : null;
  function textoKm(p, km) {
    if (km == null) { return "sem posição"; }
    return "a " + (p.coordPrecisao === "aproximada" ? "≈ " : "") + fmt1.format(km) + " km";
  }

  /* =========================================================
     1. SERVICE WORKER (funcionar offline) e aviso de "sem internet"
     ========================================================= */
  if ("serviceWorker" in navigator && window.isSecureContext) {
    navigator.serviceWorker.register("service-worker.js").catch(function () { /* sem offline: o app continua funcionando */ });
  }
  function atualizarOnline() { $("faixa-offline").hidden = navigator.onLine; }
  window.addEventListener("online", atualizarOnline);
  window.addEventListener("offline", atualizarOnline);
  atualizarOnline();

  /* =========================================================
     2. ABAS (pelo endereço: #pontos, #doar, #itens, #avisos)
     ========================================================= */
  var ABAS = ["pontos", "doar", "itens", "avisos"];
  function abrir(aba, inicial) {
    if (ABAS.indexOf(aba) < 0) { aba = "pontos"; }
    ABAS.forEach(function (a) { $(a).hidden = (a !== aba); });
    document.querySelectorAll(".nav-inferior a").forEach(function (l) {
      if (l.getAttribute("data-aba") === aba) { l.setAttribute("aria-current", "page"); } else { l.removeAttribute("aria-current"); }
    });
    if (!inicial) {
      try { history.replaceState(null, "", "#" + aba); } catch (e) { /* sem histórico */ }
      window.scrollTo(0, 0);
    }
    if (aba === "pontos") { iniciarMapa(); }
    if (aba === "itens") { mostrarItens(); }
    if (aba === "avisos") { mostrarSuporteAvisos(); mostrarLembretes(); }
  }
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest("[data-aba]");
    if (!a) { return; }
    ev.preventDefault();
    abrir(a.getAttribute("data-aba"));
  });
  window.addEventListener("hashchange", function () { abrir((location.hash || "").replace("#", ""), true); });

  /* =========================================================
     3. PONTOS: lista + mapa (Leaflet só é baixado quando precisa)
     ========================================================= */
  var LEAFLET = {
    css: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
    cssHash: "sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw==",
    js: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
    jsHash: "sha512-puJW3E/qXDqYp9IfhAI54BJEaWIfloJ7JWs7OeD5i6ruC9JZL1gERT1wjtwXFlh7CjE7ZJ+/vcRZRkIYIb6p4g=="
  };
  var estadoLeaflet = window.L ? "pronto" : "nao-iniciado";
  function carregarLeaflet(depois) {
    if (estadoLeaflet === "pronto" || estadoLeaflet === "falhou") { depois(); return; }
    if (estadoLeaflet === "carregando") { return; }
    estadoLeaflet = "carregando";
    var faltam = 2, erro = false;
    function um(ok) { if (!ok) { erro = true; } faltam -= 1; if (!faltam) { estadoLeaflet = (!erro && window.L) ? "pronto" : "falhou"; depois(); } }
    var css = document.createElement("link");
    css.rel = "stylesheet"; css.href = LEAFLET.css; css.integrity = LEAFLET.cssHash; css.crossOrigin = "anonymous";
    css.onload = function () { um(true); }; css.onerror = function () { um(false); };
    document.head.appendChild(css);
    var js = document.createElement("script");
    js.src = LEAFLET.js; js.integrity = LEAFLET.jsHash; js.crossOrigin = "anonymous";
    js.onload = function () { um(true); }; js.onerror = function () { um(false); };
    document.body.appendChild(js);
  }

  var mapa = null, camada = null, marcadores = {}, marcadorVoce = null;
  function iniciarMapa() {
    var area = $("mapa-app");
    desenharPontos();
    if (mapa) { setTimeout(function () { mapa.invalidateSize(); }, 50); return; }
    if (!DADOS) { return; }
    if (estadoLeaflet !== "pronto" && estadoLeaflet !== "falhou") {
      if (estadoLeaflet === "nao-iniciado") { area.classList.add("sem-mapa"); area.textContent = "Carregando o mapa..."; }
      carregarLeaflet(iniciarMapa);
      return;
    }
    if (!window.L) {
      area.classList.add("sem-mapa");
      area.textContent = "O mapa não carregou (sem internet?). A lista abaixo continua funcionando.";
      return;
    }
    area.classList.remove("sem-mapa");
    area.textContent = "";
    mapa = L.map(area, { scrollWheelZoom: false }).setView([DADOS.ESCOLA.lat, DADOS.ESCOLA.lng], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; colaboradores do OpenStreetMap" }).addTo(mapa);
    camada = L.layerGroup().addTo(mapa);
    L.marker([DADOS.ESCOLA.lat, DADOS.ESCOLA.lng], {
      icon: L.divIcon({ className: "", html: '<span class="pino-escola"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
      title: "Colégio Progresso (escola)", zIndexOffset: 1000
    }).bindPopup(el("div", null, [el("p", null, [el("b", { text: DADOS.ESCOLA.nome })]), el("p", { text: DADOS.ESCOLA.nota })])).addTo(mapa);
    desenharPontos();
    setTimeout(function () { mapa.invalidateSize(); }, 50);
  }

  function etiquetasPonto(p) {
    var box = el("span", { className: "etiquetas" });
    function add(c, t) { box.appendChild(el("span", { className: "etiqueta " + c, text: t })); }
    if (p.status === "exemplo") { add("etiqueta-exemplo", "EXEMPLO"); }
    else if (p.status === "conflito") { add("etiqueta-conflito", "Endereço em conflito"); }
    else { add("etiqueta-ok", "Listado na fonte"); }
    if (p.coordPrecisao === "aproximada") { add("etiqueta-confirmar", "Posição aproximada"); }
    if (p.coordPrecisao === "sem" && p.tipo === "pev") { add("etiqueta-confirmar", "Sem posição no mapa"); }
    return box;
  }

  function desenharPontos() {
    if (!DADOS) { $("resumo-pontos").textContent = "Os dados dos pontos não carregaram."; return; }
    var tipo = $("filtro-tipo").value;
    var lista = $("lista-pontos");
    lista.textContent = "";
    if (camada) { camada.clearLayers(); marcadores = {}; }

    if (tipo === "doacao") {
      $("resumo-pontos").textContent = "Ainda não temos nenhum local de doação confirmado. Os itens abaixo são modelos fictícios, sem endereço.";
      DADOS.DOACAO.forEach(function (d) {
        lista.appendChild(el("li", { className: "ponto-item" }, [
          el("span", { className: "nome", text: d.nome }),
          el("span", { className: "km", text: "sem posição" }),
          el("span", { className: "det", text: d.nota }),
          etiquetasPonto(d)
        ]));
      });
      return;
    }

    var vis = DADOS.PONTOS.map(function (p) {
      return { p: p, km: p.lat != null ? haversineKm(referencia.lat, referencia.lng, p.lat, p.lng) : null };
    }).sort(function (a, b) {
      if (a.km == null) { return b.km == null ? 0 : 1; }
      if (b.km == null) { return -1; }
      return a.km - b.km;
    });
    var noMapa = vis.filter(function (o) { return o.km != null; }).length;
    $("resumo-pontos").textContent = vis.length + " Ecopontos (" + noMapa + " no mapa), do mais perto ao mais longe " + referencia.nome + ". Não recebem pilhas, lâmpadas fluorescentes nem restos de comida.";
    vis.forEach(function (o) {
      var p = o.p;
      if (camada && p.lat != null) {
        marcadores[p.id] = L.marker([p.lat, p.lng], {
          icon: L.divIcon({ className: "", html: '<span class="pino' + (p.coordPrecisao === "aproximada" ? " pino-aprox" : "") + '"></span>', iconSize: [18, 18], iconAnchor: [9, 9] }),
          title: p.nome
        }).bindPopup(el("div", null, [
          el("p", null, [el("b", { text: p.nome })]),
          el("p", { text: p.endereco }),
          el("p", { text: "Horário: " + p.horarioTexto }),
          el("p", { text: textoKm(p, o.km) + " " + referencia.nome })
        ]), { maxWidth: 240 }).addTo(camada);
      }
      lista.appendChild(el("li", { className: "ponto-item" }, [
        el("span", { className: "nome", text: p.nome }),
        el("span", { className: "km", text: textoKm(p, o.km) }),
        el("span", { className: "det", text: p.endereco.replace(", Guarulhos/SP", "") + ". " + p.horarioTexto + "." }),
        etiquetasPonto(p)
      ]));
    });
  }
  $("filtro-tipo").addEventListener("change", desenharPontos);

  $("btn-perto").addEventListener("click", function () {
    var msg = $("msg-perto");
    function falhou(t) { msg.textContent = t + " A lista continua ordenada a partir da escola, e o mapa continua funcionando."; }
    if (!navigator.geolocation) { falhou("Este aparelho não informa a localização."); return; }
    msg.textContent = "Procurando sua localização...";
    navigator.geolocation.getCurrentPosition(function (pos) {
      referencia = { lat: pos.coords.latitude, lng: pos.coords.longitude, nome: "de você" };
      msg.textContent = "Lista ordenada a partir de onde você está. A localização não é salva nem enviada.";
      if (mapa) {
        var ic = L.divIcon({ className: "", html: '<span class="pino-voce"></span>', iconSize: [16, 16], iconAnchor: [8, 8] });
        if (marcadorVoce) { marcadorVoce.setLatLng([referencia.lat, referencia.lng]); }
        else { marcadorVoce = L.marker([referencia.lat, referencia.lng], { icon: ic, title: "Você está aqui" }).addTo(mapa); }
        mapa.setView([referencia.lat, referencia.lng], 14);
      }
      $("filtro-tipo").value = "pev";
      desenharPontos();
    }, function (erro) {
      falhou(erro && erro.code === 1 ? "Você não permitiu o acesso à localização." : "Não foi possível pegar sua localização.");
    }, { timeout: 10000, maximumAge: 60000 });
  });

  /* =========================================================
     4. ARMAZENAMENTO dos itens (IndexedDB; reserva: localStorage)
     ========================================================= */
  var armazem = (function () {
    var CHAVE = "ciclo-ponto-itens";
    var modo = "indexeddb";
    var dbPromessa = new Promise(function (ok, falha) {
      try {
        var req = indexedDB.open("ciclo-ponto", 1);
        req.onupgradeneeded = function () { req.result.createObjectStore("itens", { keyPath: "id" }); };
        req.onsuccess = function () { ok(req.result); };
        req.onerror = function () { falha(req.error); };
        req.onblocked = function () { falha(new Error("bloqueado")); };
      } catch (e) { falha(e); }
    }).catch(function () { modo = "localstorage"; return null; });

    function blobParaTexto(blob) {
      return new Promise(function (ok, falha) {
        var r = new FileReader();
        r.onload = function () { ok(r.result); };
        r.onerror = function () { falha(r.error); };
        r.readAsDataURL(blob);
      });
    }
    function lerLocal() {
      try { var s = localStorage.getItem(CHAVE); var l = s ? JSON.parse(s) : []; return Array.isArray(l) ? l : []; }
      catch (e) { return []; }
    }
    function gravarLocal(l) {
      try { localStorage.setItem(CHAVE, JSON.stringify(l)); }
      catch (e) { throw new Error(e && e.name === "QuotaExceededError" ? "sem-espaco" : "bloqueado"); }
    }
    function transacao(db, tipo, fazer) {
      return new Promise(function (ok, falha) {
        var tx = db.transaction("itens", tipo);
        var resultado = fazer(tx.objectStore("itens"));
        tx.oncomplete = function () { ok(resultado && resultado.result !== undefined ? resultado.result : undefined); };
        tx.onerror = function () { falha(new Error(tx.error && tx.error.name === "QuotaExceededError" ? "sem-espaco" : "erro")); };
        tx.onabort = function () { falha(new Error(tx.error && tx.error.name === "QuotaExceededError" ? "sem-espaco" : "erro")); };
      });
    }
    return {
      modo: function () { return dbPromessa.then(function () { return modo; }); },
      listar: function () {
        return dbPromessa.then(function (db) {
          if (!db) { return lerLocal(); }
          return transacao(db, "readonly", function (s) { return s.getAll(); });
        });
      },
      salvar: function (item) {
        return dbPromessa.then(function (db) {
          if (db) { return transacao(db, "readwrite", function (s) { s.put(item); }); }
          var copia = Object.assign({}, item);
          var passo = copia.foto instanceof Blob ? blobParaTexto(copia.foto).then(function (t) { copia.foto = t; }) : Promise.resolve();
          return passo.then(function () {
            var l = lerLocal().filter(function (x) { return x.id !== copia.id; });
            l.push(copia);
            gravarLocal(l);
          });
        });
      },
      apagar: function (id) {
        return dbPromessa.then(function (db) {
          if (db) { return transacao(db, "readwrite", function (s) { s.delete(id); }); }
          gravarLocal(lerLocal().filter(function (x) { return x.id !== id; }));
        });
      },
      limpar: function () {
        return dbPromessa.then(function (db) {
          if (db) { return transacao(db, "readwrite", function (s) { s.clear(); }); }
          try { localStorage.removeItem(CHAVE); } catch (e) { throw new Error("bloqueado"); }
        });
      },
      paraTexto: blobParaTexto
    };
  })();

  function mensagemErroArmazem(e) {
    if (e && e.message === "sem-espaco") { return "Sem espaço no aparelho. Apague itens antigos ou salve sem foto."; }
    return "Não foi possível salvar neste navegador (modo anônimo ou armazenamento bloqueado).";
  }

  /* =========================================================
     5. DOAR / DESCARTAR
     ========================================================= */
  var TIPOS = {
    eletronico: [["eletrodomestico", "Eletrodoméstico (geladeira, fogão...)"], ["pequeno", "Celular ou eletrônico pequeno"], ["pilha", "Pilha ou bateria"]],
    roupa: [["roupa", "Roupa"], ["calcado", "Calçado"], ["cama", "Cobertor, lençol ou toalha"]],
    objeto: [["movel", "Móvel ou colchão"], ["brinquedo", "Brinquedo"], ["livro", "Livro"], ["outro", "Outro objeto"]]
  };
  var CHECKLISTS = {
    eletronico: ["Apaguei meus dados (fotos, mensagens, arquivos)", "Saí das minhas contas e tirei o chip e o cartão de memória", "Tirei a bateria, se ela for removível", "Juntei carregador e cabos"],
    roupa: ["Lavei a peça", "Está em boas condições (sem furos ou manchas grandes)", "Juntei os pares (meias, sapatos)"],
    objeto: ["Limpei o objeto", "Conferi se não faltam peças", "Tirei as pilhas, se tiver"]
  };
  var NOMES = {
    categoria: { eletronico: "Eletrônico", roupa: "Roupa", objeto: "Objeto" },
    acao: { doar: "Doar", trocar: "Trocar", descartar: "Descartar" },
    estado: { bom: "Bom, funciona", usado: "Usado", estragado: "Quebrado ou rasgado" }
  };
  // material aceito pelos Ecopontos (segundo a fonte) para cada tipo; o resto não tem regra confirmada
  var MATERIAL_PEV = { eletrodomestico: "eletrodomesticos", movel: "moveis" };

  function montarTipos() {
    var cat = $("i-categoria").value;
    var sel = $("i-tipo");
    sel.textContent = "";
    TIPOS[cat].forEach(function (t) { sel.appendChild(el("option", { value: t[0], text: t[1] })); });
    var box = $("checklist-itens");
    box.textContent = "";
    $("checklist-titulo").textContent = cat === "eletronico" ? "Segurança antes de entregar" : "Antes de entregar";
    CHECKLISTS[cat].forEach(function (texto, i) {
      var id = "chk-" + i;
      box.appendChild(el("label", { className: "campo-opcao", "for": id }, [el("input", { type: "checkbox", id: id }), " " + texto]));
    });
  }
  $("i-categoria").addEventListener("change", montarTipos);
  montarTipos();

  /* Foto: lê, diminui para no máximo 800 px (canvas) e guarda como JPEG */
  var fotoAtual = null;
  var URLS_TEMP = [];
  function urlTemporaria(blob) { var u = URL.createObjectURL(blob); URLS_TEMP.push(u); return u; }
  function erroFoto(msg) { var e = $("e-foto"); e.textContent = msg || ""; e.hidden = !msg; }

  function reduzirImagem(arquivo, ladoMax) {
    return new Promise(function (ok, falha) {
      var img = new Image();
      var u = URL.createObjectURL(arquivo);
      img.onload = function () {
        var escala = Math.min(1, ladoMax / Math.max(img.naturalWidth, img.naturalHeight));
        var w = Math.max(1, Math.round(img.naturalWidth * escala));
        var h = Math.max(1, Math.round(img.naturalHeight * escala));
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(u);
        canvas.toBlob(function (blob) {
          if (!blob) { falha(new Error("canvas")); return; }
          ok({ blob: blob, largura: w, altura: h, original: [img.naturalWidth, img.naturalHeight] });
        }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); falha(new Error("imagem")); };
      img.src = u;
    });
  }

  $("foto").addEventListener("change", function () {
    var arq = this.files && this.files[0];
    var caixa = $("previa-caixa");
    caixa.textContent = "";
    fotoAtual = null;
    erroFoto("");
    if (!arq) { return; }
    if (!/^image\//.test(arq.type)) { erroFoto("Esse arquivo não é uma imagem."); return; }
    reduzirImagem(arq, 800).then(function (r) {
      fotoAtual = r;
      var img = el("img", { alt: "Prévia da foto do item", src: urlTemporaria(r.blob), "data-largura": String(r.largura), "data-altura": String(r.altura) });
      caixa.appendChild(img);
    }).catch(function () { erroFoto("Não foi possível abrir essa foto. Tente outra."); });
  });

  function pontoMaisPerto(material) {
    if (!DADOS || !material) { return null; }
    var lista = DADOS.PONTOS.filter(function (p) { return p.status === "confirmado-fonte" && p.lat != null && p.aceita.indexOf(material) >= 0; })
      .map(function (p) { return { p: p, km: haversineKm(referencia.lat, referencia.lng, p.lat, p.lng) }; })
      .sort(function (a, b) { return a.km - b.km; });
    return lista[0] || null;
  }

  /* Sugestão: só indica um ponto quando ele aceita o tipo (segundo a fonte) e está confirmado */
  function sugerir(item) {
    if (item.acao === "descartar") {
      var material = MATERIAL_PEV[item.tipo];
      var perto = pontoMaisPerto(material);
      if (perto) {
        return { confirmado: true, texto: "Ecoponto mais perto que recebe este tipo de item (segundo a Agência Mural):", ponto: perto };
      }
      if (item.tipo === "pilha") {
        return { confirmado: false, texto: "Os Ecopontos NÃO recebem pilhas e baterias (Agência Mural). Pela Lei 12.305/2010, lojas e fabricantes devem receber de volta. Confirme antes de ir." };
      }
      if (item.tipo === "pequeno") {
        return { confirmado: false, texto: "A fonte não confirma que os Ecopontos recebem celular e eletrônicos pequenos. Pela Lei 12.305/2010, lojas e fabricantes devem receber de volta. Confirme antes de ir." };
      }
      return { confirmado: false, texto: "Não temos um ponto confirmado para descartar este tipo de item. Confirme antes de ir (Prefeitura de Guarulhos)." };
    }
    return { confirmado: false, texto: "Ainda não temos locais de " + (item.acao === "trocar" ? "troca" : "doação") + " confirmados (os da lista são EXEMPLO). Confirme antes de ir." };
  }

  function blocoSugestao(s) {
    var partes = [el("p", { text: s.texto })];
    if (s.ponto) {
      var p = s.ponto.p;
      partes.push(el("div", { className: "bloco-ponto" }, [
        el("p", null, [el("b", { text: p.nome }), p.bairro ? " (" + p.bairro + ")" : ""]),
        el("p", { text: p.endereco }),
        el("p", { text: "Horário: " + p.horarioTexto }),
        el("p", { text: textoKm(p, s.ponto.km) + " " + referencia.nome + (p.coordPrecisao === "aproximada" ? " (posição aproximada)" : "") })
      ]));
    }
    partes.push(el("span", { className: "etiquetas" }, [el("span", {
      className: "etiqueta " + (s.confirmado ? "etiqueta-ok" : "etiqueta-confirmar"),
      text: s.confirmado ? "Confirmado na fonte" : "Confirme antes de ir"
    })]));
    return partes;
  }

  $("form-item").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var nome = $("i-nome").value.trim();
    var eNome = $("e-nome");
    if (nome.length < 2) {
      eNome.textContent = "Escreva o nome do item (pelo menos 2 letras).";
      eNome.hidden = false;
      $("i-nome").setAttribute("aria-invalid", "true");
      $("i-nome").focus();
      return;
    }
    eNome.hidden = true; $("i-nome").removeAttribute("aria-invalid");
    var item = {
      id: "i" + Date.now() + Math.random().toString(36).slice(2, 6),
      nome: nome,
      categoria: $("i-categoria").value,
      tipo: $("i-tipo").value,
      tipoTexto: $("i-tipo").selectedOptions[0].textContent,
      estado: $("i-estado").value,
      acao: document.querySelector("input[name=acao]:checked").value,
      status: "pendente",
      criadoEm: new Date().toISOString(),
      foto: fotoAtual ? fotoAtual.blob : null
    };
    var s = sugerir(item);
    item.sugestao = s.texto + (s.ponto ? " " + s.ponto.p.nome + ", " + textoKm(s.ponto.p, s.ponto.km) + " " + referencia.nome + "." : "");
    var res = $("resultado-item");
    res.textContent = "";
    armazem.salvar(item).then(function () {
      res.appendChild(el("div", { className: "cartao sugestao" }, [
        el("h2", { text: "Item salvo: " + nome })
      ].concat(blocoSugestao(s)).concat([
        el("p", { className: "texto-pequeno" }, ["Ele está em ", el("a", { href: "#itens", "data-aba": "itens", text: "Meus itens" }), ". Dúvida sobre outro objeto? Pergunte ao ", el("a", { href: "../chatbot/", text: "Ciclo Bot" }), "."])
      ])));
      $("form-item").reset();
      $("previa-caixa").textContent = "";
      fotoAtual = null;
      montarTipos();
      res.scrollIntoView({ block: "start" });
    }).catch(function (e) {
      res.appendChild(el("div", { className: "aviso aviso-conflito", role: "alert" }, [
        el("span", { className: "aviso-titulo", text: "Não salvou" }), el("span", { text: mensagemErroArmazem(e) })
      ]));
    });
  });

  /* =========================================================
     6. MEUS ITENS
     ========================================================= */
  function mostrarItens() {
    armazem.modo().then(function (m) {
      $("modo-armazenamento").textContent = "Seus itens e fotos ficam guardados só neste aparelho" +
        (m === "indexeddb" ? "." : " (modo de reserva: localStorage, com pouco espaço para fotos).") + " Nada é enviado para a internet.";
    });
    armazem.listar().then(function (itens) {
      URLS_TEMP.forEach(function (u) { URL.revokeObjectURL(u); });
      URLS_TEMP = [];
      var lista = $("lista-itens");
      lista.textContent = "";
      itens.sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; });
      if (!itens.length) {
        lista.appendChild(el("li", { className: "vazio" }, [
          "Você ainda não salvou nenhum item. ",
          el("a", { href: "#doar", "data-aba": "doar", text: "Cadastrar o primeiro item" })
        ]));
        return;
      }
      itens.forEach(function (it) {
        var foto = it.foto
          ? el("img", { className: "miniatura", alt: "Foto de " + it.nome, src: it.foto instanceof Blob ? urlTemporaria(it.foto) : String(it.foto) })
          : el("div", { className: "miniatura sem-foto", text: "sem foto" });
        var sel = el("select", { "aria-label": "Situação de " + it.nome });
        [["pendente", "Pendente"], ["entregue", "Entregue"]].forEach(function (o) {
          var op = el("option", { value: o[0], text: o[1] });
          if (it.status === o[0]) { op.selected = true; }
          sel.appendChild(op);
        });
        sel.addEventListener("change", function () {
          it.status = sel.value;
          armazem.salvar(it).then(function () { $("msg-itens").textContent = "Situação de \"" + it.nome + "\" atualizada."; })
            .catch(function (e) { $("msg-itens").textContent = mensagemErroArmazem(e); });
        });
        var apagar = el("button", { className: "botao botao-secundario botao-pequeno", type: "button", text: "Apagar" });
        apagar.addEventListener("click", function () {
          if (apagar.getAttribute("data-confirmar") !== "1") { apagar.setAttribute("data-confirmar", "1"); apagar.textContent = "Clique de novo para apagar"; return; }
          armazem.apagar(it.id).then(mostrarItens).catch(function (e) { $("msg-itens").textContent = mensagemErroArmazem(e); });
        });
        lista.appendChild(el("li", { className: "item-salvo" }, [
          foto,
          el("div", null, [
            el("p", { className: "nome", text: it.nome }),
            el("p", { className: "det", text: NOMES.categoria[it.categoria] + " · " + NOMES.acao[it.acao] + " · " + NOMES.estado[it.estado] }),
            it.sugestao ? el("p", { className: "det", text: it.sugestao }) : null,
            el("div", { className: "acoes" }, [sel, apagar])
          ])
        ]));
      });
    }).catch(function () {
      $("lista-itens").textContent = "";
      $("lista-itens").appendChild(el("li", { className: "vazio", text: "Não foi possível ler os itens guardados neste navegador." }));
    });
  }

  $("btn-exportar").addEventListener("click", function () {
    var msg = $("msg-itens");
    armazem.listar().then(function (itens) {
      return Promise.all(itens.map(function (it) {
        var c = Object.assign({}, it);
        return (c.foto instanceof Blob ? armazem.paraTexto(c.foto).then(function (t) { c.foto = t; }) : Promise.resolve()).then(function () { return c; });
      }));
    }).then(function (itens) {
      var blob = new Blob([JSON.stringify({ app: "Ciclo Ponto", exportadoEm: new Date().toISOString(), itens: itens }, null, 2)], { type: "application/json" });
      var a = el("a", { href: URL.createObjectURL(blob), download: "ciclo-ponto-meus-itens.json" });
      document.body.appendChild(a); a.click(); a.remove();
      msg.textContent = itens.length + (itens.length === 1 ? " item exportado" : " itens exportados") + " para o arquivo ciclo-ponto-meus-itens.json.";
    }).catch(function () { msg.textContent = "Não foi possível exportar."; });
  });

  $("btn-limpar").addEventListener("click", function () {
    var b = $("btn-limpar");
    if (b.getAttribute("data-confirmar") !== "1") { b.setAttribute("data-confirmar", "1"); b.textContent = "Clique de novo para apagar tudo"; return; }
    b.removeAttribute("data-confirmar"); b.textContent = "Apagar todos os itens";
    armazem.limpar().then(function () { $("msg-itens").textContent = "Todos os itens foram apagados deste aparelho."; mostrarItens(); })
      .catch(function (e) { $("msg-itens").textContent = mensagemErroArmazem(e); });
  });

  /* =========================================================
     7. AVISOS: lembretes por notificação local
     ========================================================= */
  var CHAVE_LEMBRETES = "ciclo-ponto-lembretes";
  var temNotificacao = "Notification" in window;
  function lerLembretes() {
    try { var s = localStorage.getItem(CHAVE_LEMBRETES); var l = s ? JSON.parse(s) : []; return Array.isArray(l) ? l : []; } catch (e) { return []; }
  }
  function gravarLembretes(l) {
    try { localStorage.setItem(CHAVE_LEMBRETES, JSON.stringify(l)); return true; } catch (e) { return false; }
  }

  function mostrarSuporteAvisos() {
    var box = $("suporte-avisos");
    box.textContent = "";
    var btn = $("btn-ativar");
    var t, titulo;
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    var instalado = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    if (!temNotificacao) {
      titulo = "Sem notificações neste navegador";
      t = ios && !instalado ? "No iPhone, instale o app na tela de início (Safari, Compartilhar, \"Adicionar à Tela de Início\") para poder receber notificações. Enquanto isso, o lembrete aparece aqui dentro do app." : "Este navegador não mostra notificações. O lembrete aparece aqui dentro do app quando chegar a hora.";
      btn.hidden = true;
    } else if (Notification.permission === "granted") {
      titulo = "Lembretes ativados"; t = "A notificação aparece na hora marcada se o app estiver aberto. Se estiver fechado, ela aparece assim que você abrir o app.";
      btn.hidden = true;
    } else if (Notification.permission === "denied") {
      titulo = "Notificações bloqueadas"; t = "Você bloqueou as notificações. Para ativar, mude a permissão nas configurações do navegador. O lembrete ainda aparece aqui dentro do app.";
      btn.hidden = true;
    } else {
      titulo = "Lembretes desativados"; t = "Toque em \"Ativar lembretes\" e permita as notificações.";
      btn.hidden = false;
    }
    box.className = "aviso " + (temNotificacao && Notification.permission === "granted" ? "aviso-ok" : temNotificacao && Notification.permission === "denied" ? "aviso-conflito" : "aviso-confirmar");
    box.appendChild(el("span", { className: "aviso-titulo", text: titulo }));
    box.appendChild(el("span", { text: t }));
  }

  $("btn-ativar").addEventListener("click", function () {
    if (!temNotificacao) { return; }
    try {
      var r = Notification.requestPermission(mostrarSuporteAvisos);
      if (r && r.then) { r.then(mostrarSuporteAvisos); }
    } catch (e) { mostrarSuporteAvisos(); }
  });

  function quandoTexto(ms) {
    return new Date(ms).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function mostrarLembretes() {
    var lista = $("lista-lembretes");
    lista.textContent = "";
    lerLembretes().sort(function (a, b) { return a.quando - b.quando; }).forEach(function (l) {
      var b = el("button", { className: "botao botao-secundario botao-pequeno", type: "button", text: "Remover" });
      b.addEventListener("click", function () {
        gravarLembretes(lerLembretes().filter(function (x) { return x.id !== l.id; }));
        mostrarLembretes();
      });
      lista.appendChild(el("li", { className: "lembrete" + (l.disparado ? " disparado" : "") }, [
        el("span", null, [el("b", { text: l.texto }), el("br"), el("span", { className: "texto-pequeno", text: (l.disparado ? "Mostrado em " : "Agendado para ") + quandoTexto(l.quando) })]),
        b
      ]));
    });
  }

  $("form-lembrete").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var texto = $("l-texto").value.trim() || "Levar meus itens ao ponto de coleta";
    var valor = $("l-quando").value;
    var e = $("e-quando");
    var quando = valor ? new Date(valor).getTime() : NaN;
    if (!valor || !isFinite(quando)) { e.textContent = "Escolha a data e a hora."; e.hidden = false; return; }
    if (quando < Date.now() - 60000) { e.textContent = "Escolha um horário no futuro."; e.hidden = false; return; }
    e.hidden = true;
    var l = lerLembretes();
    l.push({ id: "l" + Date.now(), texto: texto.slice(0, 80), quando: quando, disparado: false });
    if (!gravarLembretes(l)) { e.textContent = "Não foi possível guardar o lembrete neste navegador."; e.hidden = false; return; }
    $("form-lembrete").reset();
    $("l-texto").value = "Levar meus itens ao ponto de coleta";
    mostrarLembretes();
    agendarProximo();
  });

  function notificar(l) {
    // 1) sempre avisa dentro do app
    var aviso = el("div", { className: "aviso aviso-ok", role: "alert" }, [el("span", { className: "aviso-titulo", text: "Lembrete" }), el("span", { text: l.texto })]);
    var main = $("conteudo");
    main.insertBefore(aviso, main.firstChild);
    setTimeout(function () { aviso.remove(); }, 15000);
    // 2) notificação do sistema, se permitida
    if (!temNotificacao || Notification.permission !== "granted") { return; }
    var opcoes = { body: l.texto, icon: "icones/icone-192.png", badge: "icones/icone-192.png", tag: l.id };
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(function (reg) { return reg.showNotification("Ciclo Ponto", opcoes); })
        .catch(function () { try { new Notification("Ciclo Ponto", opcoes); } catch (e) { /* sem notificação */ } });
    } else {
      try { new Notification("Ciclo Ponto", opcoes); } catch (e) { /* alguns celulares só aceitam via service worker */ }
    }
  }

  function verificarLembretes() {
    var agora = Date.now();
    var l = lerLembretes();
    var mudou = false;
    l.forEach(function (x) {
      if (!x.disparado && x.quando <= agora) { x.disparado = true; mudou = true; notificar(x); }
    });
    if (mudou) { gravarLembretes(l); if (!$("avisos").hidden) { mostrarLembretes(); } }
  }

  var temporizador = null;
  function agendarProximo() {
    clearTimeout(temporizador);
    var prox = lerLembretes().filter(function (x) { return !x.disparado; }).sort(function (a, b) { return a.quando - b.quando; })[0];
    if (!prox) { return; }
    var espera = Math.max(0, Math.min(prox.quando - Date.now(), 2147483000));
    temporizador = setTimeout(function () { verificarLembretes(); agendarProximo(); }, espera);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { verificarLembretes(); agendarProximo(); } });

  /* =========================================================
     8. COMEÇAR
     ========================================================= */
  var inicial = (location.hash || "").replace("#", "");
  abrir(inicial || "pontos", true);
  verificarLembretes();
  agendarProximo();
})();
