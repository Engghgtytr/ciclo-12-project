/* =========================================================
   Ciclo Prato — interface da plataforma
   Fala com window.CicloPratoDados (Supabase ou modo demonstração).
   Segurança: textContent sempre (nunca innerHTML com dado de usuário).
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
        else if (k.indexOf("on") === 0 && typeof props[k] === "function") { e.addEventListener(k.slice(2), props[k]); }
        else { e.setAttribute(k, props[k]); }
      });
    }
    (filhos || []).forEach(function (f) {
      if (f == null || f === false) { return; }
      e.appendChild(typeof f === "string" ? document.createTextNode(f) : f);
    });
    return e;
  }
  var SVG = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, texto) {
    var e = document.createElementNS(SVG, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (texto != null) { e.textContent = texto; }
    return e;
  }

  var D = window.CicloPratoDados;
  var cfg = window.CICLO_PRATO_CONFIG || {};
  var dados = null;          // adaptador em uso
  var abaAtual = null;
  var area = $("area");

  var fmtKg = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  var fmt1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  var CATEGORIAS = { hortifruti: "Frutas, legumes e verduras", padaria: "Padaria", refeicao: "Refeição pronta", nao_perecivel: "Não perecível", laticinios: "Laticínios", outros: "Outros" };
  var PERFIS = { doador: "Doador", receptor: "Receptor", admin: "Admin" };

  function dataBR(iso) { if (!iso) { return ""; } var p = String(iso).slice(0, 10).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function situacao(d) {
    if (d.status === "disponivel" && d.validade < D.hojeISO()) { return "expirada"; }
    return d.status;
  }
  var SITUACAO = {
    disponivel: ["etiqueta-ok", "Disponível"],
    reservada: ["etiqueta-confirmar", "Reservada"],
    retirada: ["etiqueta-ok", "Retirada"],
    expirada: ["etiqueta-conflito", "Expirada"]
  };

  function mensagem(tipo, texto) {
    var m = $("mensagem");
    m.textContent = "";
    if (!texto) { return; }
    m.appendChild(el("div", { className: "aviso " + (tipo === "erro" ? "aviso-conflito" : "aviso-ok"), role: tipo === "erro" ? "alert" : "status" }, [
      el("span", { className: "aviso-titulo", text: tipo === "erro" ? "Não deu certo" : "Pronto" }),
      el("span", { text: texto })
    ]));
  }
  function falhou(e) { mensagem("erro", (e && e.amigavel) ? e.message : "Erro inesperado: " + ((e && e.message) || e)); }

  /* ---------- validação dos formulários ---------- */
  function erroCampo(id, msg) {
    var c = $(id), m = $("e-" + id);
    if (m) { m.textContent = msg || ""; m.hidden = !msg; }
    if (msg) { c.setAttribute("aria-invalid", "true"); } else { c.removeAttribute("aria-invalid"); }
    return !msg;
  }
  function campo(id, rotulo, input, ajuda) {
    input.id = id;
    input.setAttribute("aria-describedby", "e-" + id + (ajuda ? " a-" + id : ""));
    return el("div", { className: "campo" }, [
      el("label", { "for": id, text: rotulo }),
      input,
      ajuda ? el("span", { className: "ajuda", id: "a-" + id, text: ajuda }) : null,
      el("span", { className: "mensagem-erro", id: "e-" + id, hidden: "hidden" })
    ]);
  }
  var EMAIL_OK = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

  /* =========================================================
     TELA DE ENTRADA (entrar / criar conta)
     ========================================================= */
  function telaEntrada(modoInicial) {
    area.textContent = "";
    var modo = modoInicial || "entrar";
    var abas = el("div", { className: "abas", role: "tablist" });
    var corpo = el("div", { className: "painel" });
    function aba(id, texto) {
      return el("button", { className: "aba", role: "tab", type: "button", "aria-selected": String(modo === id), text: texto, onclick: function () { telaEntrada(id); } });
    }
    abas.appendChild(aba("entrar", "Entrar"));
    abas.appendChild(aba("cadastro", "Criar conta"));
    area.appendChild(el("section", { className: "cartao entrada", "aria-labelledby": "t-entrada" }, [
      el("h2", { id: "t-entrada", text: modo === "entrar" ? "Entrar na plataforma" : "Criar conta" }),
      dados.modo === "demo" ? el("div", { className: "aviso aviso-exemplo", role: "note" }, [
        el("span", { className: "aviso-titulo", text: "Modo demonstração" }),
        el("span", { text: "Nada aqui vai para o banco de dados: fica só neste navegador. Não use uma senha que você usa em outros sites." })
      ]) : null,
      abas, corpo
    ]));

    if (modo === "entrar") {
      var email = el("input", { type: "email", autocomplete: "email", maxlength: "120" });
      var senha = el("input", { type: "password", autocomplete: "current-password", maxlength: "72" });
      var form = el("form", { novalidate: "novalidate" }, [
        campo("l-email", "E-mail", email),
        campo("l-senha", "Senha", senha),
        el("button", { className: "botao", type: "submit", text: "Entrar" })
      ]);
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var okE = erroCampo("l-email", EMAIL_OK.test(email.value.trim()) ? "" : "Digite um e-mail válido.");
        var okS = erroCampo("l-senha", senha.value ? "" : "Digite a senha.");
        if (!okE || !okS) { return; }
        mensagem();
        dados.entrar(email.value.trim(), senha.value).then(function () { abaAtual = null; mostrar(); }).catch(falhou);
      });
      corpo.appendChild(form);
      if (dados.modo === "demo") {
        var lista = el("div", { className: "contas-demo" }, [el("p", { className: "texto-pequeno", text: "Contas de demonstração (senha de todas: demo1234):" })]);
        dados.contasDemo().forEach(function (c) {
          lista.appendChild(el("button", {
            className: "botao botao-secundario botao-pequeno", type: "button",
            text: "Entrar como " + PERFIS[c.perfil].toLowerCase() + (c.aprovado ? "" : " (não aprovado)") + ": " + c.nome,
            onclick: function () { dados.entrar(c.email, "demo1234").then(function () { abaAtual = null; mensagem(); mostrar(); }).catch(falhou); }
          }));
        });
        lista.appendChild(el("button", { className: "botao botao-secundario botao-pequeno", type: "button", text: "Reiniciar a demonstração (apaga tudo deste navegador)", onclick: function () { dados.reiniciar().then(function () { mensagem("ok", "Demonstração reiniciada."); mostrar(); }); } }));
        corpo.appendChild(lista);
      }
      return;
    }

    // Criar conta
    var nome = el("input", { type: "text", autocomplete: "name", maxlength: "60" });
    var org = el("input", { type: "text", autocomplete: "organization", maxlength: "80" });
    var email2 = el("input", { type: "email", autocomplete: "email", maxlength: "120" });
    var senha2 = el("input", { type: "password", autocomplete: "new-password", maxlength: "72" });
    var perfis = el("fieldset", { className: "campo grupo-perfil" }, [
      el("legend", { text: "Eu sou" }),
      el("label", { className: "campo-opcao" }, [el("input", { type: "radio", name: "perfil", value: "doador", checked: "checked" }), " Doador (mercado, padaria, restaurante, família)"]),
      el("label", { className: "campo-opcao" }, [el("input", { type: "radio", name: "perfil", value: "receptor" }), " Receptor (ONG, banco de alimentos, igreja, projeto social)"]),
      el("span", { className: "ajuda", text: "Receptores só podem reservar depois que o admin aprovar o cadastro." })
    ]);
    var form2 = el("form", { novalidate: "novalidate" }, [
      campo("c-nome", "Nome", nome),
      campo("c-org", "Organização (opcional)", org),
      perfis,
      campo("c-email", "E-mail", email2),
      campo("c-senha", "Senha", senha2, "Pelo menos 8 caracteres."),
      el("p", { className: "texto-pequeno", text: "Guardamos só nome, organização, e-mail e o tipo de perfil. Não pedimos CPF nem telefone." }),
      el("button", { className: "botao", type: "submit", text: "Criar conta" })
    ]);
    form2.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = {
        nome: nome.value.trim(), organizacao: org.value.trim(), email: email2.value.trim(), senha: senha2.value,
        perfil: form2.querySelector("input[name=perfil]:checked").value
      };
      var ok1 = erroCampo("c-nome", v.nome.length >= 2 ? "" : "Escreva seu nome (pelo menos 2 letras).");
      var ok2 = erroCampo("c-email", EMAIL_OK.test(v.email) ? "" : "Digite um e-mail válido.");
      var ok3 = erroCampo("c-senha", v.senha.length >= 8 ? "" : "A senha precisa ter pelo menos 8 caracteres.");
      erroCampo("c-org", "");
      if (!ok1 || !ok2 || !ok3) { return; }
      mensagem();
      dados.cadastrar(v).then(function (r) {
        if (r.precisaConfirmar) {
          telaEntrada("entrar");
          mensagem("ok", "Conta criada! Abra o e-mail de confirmação que o Supabase mandou para " + v.email + " e depois entre aqui.");
        } else { abaAtual = null; mensagem("ok", "Conta criada!"); mostrar(); }
      }).catch(falhou);
    });
    corpo.appendChild(form2);
  }

  /* =========================================================
     CARTÃO DE DOAÇÃO
     ========================================================= */
  function cartaoDoacao(d, acoes, mostrarEndereco) {
    var s = situacao(d);
    var linhaEnd = mostrarEndereco ? el("p", { className: "linha-endereco", text: "Endereço: carregando..." }) : null;
    var c = el("article", { className: "doacao" }, [
      el("div", { className: "doacao-topo" }, [
        el("h3", { text: d.alimento }),
        el("span", { className: "etiqueta " + SITUACAO[s][0], text: SITUACAO[s][1] })
      ]),
      el("p", { className: "doacao-numeros" }, [
        el("b", { text: fmtKg.format(Number(d.quantidade_kg)) + " kg" }), " · ", CATEGORIAS[d.categoria] || d.categoria,
        " · validade " + dataBR(d.validade)
      ]),
      el("p", { text: "Bairro: " + d.bairro }),
      el("p", { text: "Retirada: " + d.horario_retirada }),
      d.observacoes ? el("p", { className: "texto-pequeno", text: "Observações: " + d.observacoes }) : null,
      linhaEnd,
      acoes && acoes.length ? el("div", { className: "doacao-acoes" }, acoes) : null
    ]);
    if (linhaEnd) {
      dados.endereco(d.id).then(function (e) { linhaEnd.textContent = e ? "Endereço: " + e : "Endereço: só aparece para quem reservou."; })
        .catch(function () { linhaEnd.textContent = "Endereço: não foi possível carregar."; });
    }
    return c;
  }
  function botaoAcao(texto, fn, secundario) {
    return el("button", { className: "botao botao-pequeno" + (secundario ? " botao-secundario" : ""), type: "button", text: texto, onclick: fn });
  }
  function confirmarDuasVezes(botao, textoConfirma, fn) {
    if (botao.getAttribute("data-confirmar") !== "1") { botao.setAttribute("data-confirmar", "1"); botao.textContent = textoConfirma; return; }
    fn();
  }
  function listaVazia(texto) { return el("p", { className: "vazio", text: texto }); }

  /* =========================================================
     DOADOR
     ========================================================= */
  function formNovaDoacao(box) {
    var alimento = el("input", { type: "text", maxlength: "80", placeholder: "Ex.: pães do dia, marmitas, frutas" });
    var categoria = el("select");
    Object.keys(CATEGORIAS).forEach(function (k) { categoria.appendChild(el("option", { value: k, text: CATEGORIAS[k] })); });
    var kg = el("input", { type: "number", min: "0.1", max: "1000", step: "0.1", inputmode: "decimal" });
    var validade = el("input", { type: "date", min: D.hojeISO() });
    var bairro = el("input", { type: "text", maxlength: "60", placeholder: "Ex.: Vila Galvão" });
    var endereco = el("input", { type: "text", maxlength: "160", placeholder: "Rua e número" });
    var horario = el("input", { type: "text", maxlength: "80", placeholder: "Ex.: hoje, das 17h às 18h" });
    var obs = el("textarea", { maxlength: "300", rows: "3" });
    var form = el("form", { className: "cartao", novalidate: "novalidate" }, [
      campo("d-alimento", "Alimento", alimento),
      campo("d-categoria", "Categoria", categoria),
      campo("d-kg", "Quantidade (kg)", kg),
      campo("d-validade", "Validade", validade, "Precisa ser hoje ou depois."),
      campo("d-bairro", "Bairro", bairro, "É o que todos os receptores aprovados veem."),
      campo("d-endereco", "Endereço de retirada", endereco, "Fica escondido: só aparece para quem reservar."),
      campo("d-horario", "Horário de retirada", horario),
      campo("d-obs", "Observações (opcional)", obs),
      el("button", { className: "botao", type: "submit", text: "Publicar doação" })
    ]);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = {
        alimento: alimento.value.trim(), categoria: categoria.value, quantidade_kg: Number(String(kg.value).replace(",", ".")),
        validade: validade.value, bairro: bairro.value.trim(), endereco: endereco.value.trim(), horario_retirada: horario.value.trim(), observacoes: obs.value.trim()
      };
      var oks = [
        erroCampo("d-alimento", v.alimento.length >= 2 ? "" : "Escreva o alimento (pelo menos 2 letras)."),
        erroCampo("d-kg", isFinite(v.quantidade_kg) && v.quantidade_kg > 0 && v.quantidade_kg <= 1000 ? "" : "Use um número maior que 0 e até 1000."),
        erroCampo("d-validade", v.validade && v.validade >= D.hojeISO() ? "" : "Escolha uma data de hoje em diante."),
        erroCampo("d-bairro", v.bairro.length >= 2 ? "" : "Escreva o bairro."),
        erroCampo("d-endereco", v.endereco.length >= 5 ? "" : "Escreva o endereço (pelo menos 5 caracteres)."),
        erroCampo("d-horario", v.horario_retirada.length >= 2 ? "" : "Escreva o horário de retirada.")
      ];
      if (oks.indexOf(false) >= 0) { var primeiro = form.querySelector("[aria-invalid=true]"); if (primeiro) { primeiro.focus(); } return; }
      dados.criarDoacao(v).then(function () { mensagem("ok", "Doação publicada: " + v.alimento + "."); abaAtual = "minhas"; mostrar(); }).catch(falhou);
    });
    box.appendChild(el("div", { className: "aviso aviso-confirmar" }, [
      el("span", { className: "aviso-titulo", text: "Segurança dos alimentos" }),
      el("span", { text: "Publique só alimentos dentro da validade e bem guardados. Alimentos perecíveis seguem regras sanitárias; combine a retirada e confira a validade." })
    ]));
    box.appendChild(form);
  }

  function minhasDoacoes(box, lista) {
    if (!lista.length) { box.appendChild(listaVazia("Você ainda não publicou doações.")); return; }
    lista.forEach(function (d) {
      var acoes = [];
      var s = situacao(d);
      if (s === "reservada") {
        acoes.push(botaoAcao("Confirmar retirada", function () {
          dados.confirmarRetirada(d.id).then(function () { mensagem("ok", "Retirada confirmada."); mostrar(); }).catch(falhou);
        }));
      }
      if (d.status === "disponivel") {
        var b = botaoAcao("Apagar", function () {
          confirmarDuasVezes(b, "Clique de novo para apagar", function () {
            dados.apagarDoacao(d.id).then(function () { mensagem("ok", "Doação apagada."); mostrar(); }).catch(falhou);
          });
        }, true);
        acoes.push(b);
      }
      box.appendChild(cartaoDoacao(d, acoes, true));
    });
  }

  /* =========================================================
     RECEPTOR
     ========================================================= */
  function disponiveis(box, lista) {
    var hoje = D.hojeISO();
    var disp = lista.filter(function (d) { return d.status === "disponivel" && d.validade >= hoje; });
    if (!disp.length) { box.appendChild(listaVazia("Nenhuma doação disponível agora.")); return; }
    disp.forEach(function (d) {
      box.appendChild(cartaoDoacao(d, [botaoAcao("Reservar", function () {
        dados.reservar(d.id).then(function () { mensagem("ok", "Reservado! O endereço de retirada está em \"Minhas reservas\"."); abaAtual = "reservas"; mostrar(); }).catch(falhou);
      })], false));
    });
  }
  function minhasReservas(box, lista, reservas, eu) {
    var minhas = reservas.filter(function (r) { return r.receptor_id === eu; }).map(function (r) { return r.doacao_id; });
    var docs = lista.filter(function (d) { return minhas.indexOf(d.id) >= 0; });
    if (!docs.length) { box.appendChild(listaVazia("Você ainda não reservou nenhuma doação.")); return; }
    docs.forEach(function (d) { box.appendChild(cartaoDoacao(d, [], true)); });
  }

  /* =========================================================
     ADMIN
     ========================================================= */
  function receptores(box, perfis) {
    var rec = perfis.filter(function (p) { return p.perfil === "receptor"; });
    if (!rec.length) { box.appendChild(listaVazia("Nenhum receptor cadastrado ainda.")); return; }
    var ul = el("ul", { className: "lista-receptores" });
    rec.forEach(function (p) {
      ul.appendChild(el("li", { className: "receptor" }, [
        el("div", null, [
          el("p", { className: "receptor-nome", text: p.organizacao || p.nome }),
          el("p", { className: "texto-pequeno", text: "Responsável: " + p.nome + " · cadastrado em " + dataBR(p.criado_em) }),
          el("span", { className: "etiqueta " + (p.aprovado ? "etiqueta-ok" : "etiqueta-confirmar"), text: p.aprovado ? "Aprovado" : "Aguardando aprovação" })
        ]),
        botaoAcao(p.aprovado ? "Remover aprovação" : "Aprovar", function () {
          dados.aprovar(p.id, !p.aprovado).then(function () { mensagem("ok", (p.aprovado ? "Aprovação removida: " : "Receptor aprovado: ") + (p.organizacao || p.nome) + "."); mostrar(); }).catch(falhou);
        }, p.aprovado)
      ]));
    });
    box.appendChild(ul);
  }
  function todas(box, lista) {
    if (!lista.length) { box.appendChild(listaVazia("Nenhuma doação cadastrada.")); return; }
    lista.forEach(function (d) {
      var b = botaoAcao("Apagar (moderação)", function () {
        confirmarDuasVezes(b, "Clique de novo para apagar", function () {
          dados.apagarDoacao(d.id).then(function () { mensagem("ok", "Doação apagada pela moderação."); mostrar(); }).catch(falhou);
        });
      }, true);
      box.appendChild(cartaoDoacao(d, [b], true));
    });
  }

  /* =========================================================
     PAINEL (dashboard)
     ========================================================= */
  var CHAVE_REFEICAO = "ciclo-prato-kg-por-refeicao";
  function painel(box, lista, reservas, perfis, s) {
    var meus = lista;
    if (s.perfil.perfil === "receptor") {
      var ids = reservas.filter(function (r) { return r.receptor_id === s.id; }).map(function (r) { return r.doacao_id; });
      meus = lista.filter(function (d) { return ids.indexOf(d.id) >= 0; });
    }
    var titulo = { doador: "Painel das minhas doações", receptor: "Painel das minhas reservas", admin: "Painel geral da plataforma" }[s.perfil.perfil];
    var totalKg = meus.reduce(function (t, d) { return t + Number(d.quantidade_kg); }, 0);
    var kgRetirado = meus.filter(function (d) { return d.status === "retirada"; }).reduce(function (t, d) { return t + Number(d.quantidade_kg); }, 0);
    var cont = { disponivel: 0, reservada: 0, retirada: 0, expirada: 0 };
    meus.forEach(function (d) { cont[situacao(d)] += 1; });
    var tempos = meus.filter(function (d) { return d.reservada_em; }).map(function (d) { return Math.max(0, (new Date(d.reservada_em) - new Date(d.criado_em)) / 3600e3); });
    var tempoMedio = tempos.length ? tempos.reduce(function (a, b) { return a + b; }, 0) / tempos.length : null;

    box.appendChild(el("h2", { className: "titulo-painel", text: titulo }));
    var tiles = el("div", { className: "tiles" }, [
      tile(fmtKg.format(totalKg) + " kg", s.perfil.perfil === "receptor" ? "reservados" : "doados (cadastrados)"),
      tile(fmtKg.format(kgRetirado) + " kg", "já retirados"),
      tile(String(meus.length), meus.length === 1 ? "doação" : "doações"),
      tile(tempoMedio == null ? "-" : fmt1.format(tempoMedio) + " h", "tempo médio até a reserva")
    ]);
    box.appendChild(tiles);

    box.appendChild(el("h3", { text: "Doações por situação" }));
    box.appendChild(el("ul", { className: "por-situacao" }, Object.keys(cont).map(function (k) {
      return el("li", null, [el("span", { className: "etiqueta " + SITUACAO[k][0], text: SITUACAO[k][1] }), " " + cont[k]]);
    })));

    box.appendChild(el("h3", { text: "Doações por semana (últimas 6)" }));
    box.appendChild(graficoSemanas(meus));

    if (s.perfil.perfil === "admin") {
      box.appendChild(el("h3", { text: "Ranking de doadores (por kg)" }));
      var porDoador = {};
      lista.forEach(function (d) { porDoador[d.doador_id] = (porDoador[d.doador_id] || 0) + Number(d.quantidade_kg); });
      var nomes = {};
      perfis.forEach(function (p) { nomes[p.id] = p.organizacao || p.nome; });
      var rank = Object.keys(porDoador).sort(function (a, b) { return porDoador[b] - porDoador[a]; }).slice(0, 5);
      box.appendChild(rank.length ? el("ol", { className: "ranking" }, rank.map(function (id) {
        return el("li", null, [el("span", { text: nomes[id] || "Doador" }), el("b", { text: fmtKg.format(porDoador[id]) + " kg" })]);
      })) : listaVazia("Sem doações ainda."));
    }

    // Refeições equivalentes: NÃO inventamos a conversão
    var guardado = "";
    try { guardado = localStorage.getItem(CHAVE_REFEICAO) || ""; } catch (e) { guardado = ""; }
    var entrada = el("input", { type: "number", min: "0.1", step: "0.05", inputmode: "decimal", value: guardado });
    var saida = el("p", { className: "refeicoes-saida", "aria-live": "polite" });
    function atualizarRefeicoes() {
      var kgPorRefeicao = Number(String(entrada.value).replace(",", "."));
      saida.textContent = "";
      if (!entrada.value || !isFinite(kgPorRefeicao) || kgPorRefeicao <= 0) {
        saida.appendChild(el("span", { className: "todo", text: "TODO" }));
        saida.appendChild(document.createTextNode(" Refeições equivalentes: estimativa do grupo, a definir. Preencha quantos kg o grupo considera uma refeição, com a fonte."));
      } else {
        saida.textContent = "≈ " + fmt1.format(kgRetirado / kgPorRefeicao) + " refeições equivalentes (estimativa do grupo, usando " + fmtKg.format(kgPorRefeicao) + " kg por refeição).";
      }
      try { localStorage.setItem(CHAVE_REFEICAO, entrada.value); } catch (e) { /* sem armazenamento */ }
    }
    entrada.addEventListener("input", atualizarRefeicoes);
    box.appendChild(el("div", { className: "cartao refeicoes" }, [
      campo("p-refeicao", "kg por refeição (estimativa do grupo)", entrada, "Sem número com fonte, o painel mostra TODO."),
      saida
    ]));
    atualizarRefeicoes();
  }
  function tile(valor, texto) {
    return el("div", { className: "tile" }, [el("span", { className: "tile-valor", text: valor }), el("span", { text: texto })]);
  }
  function graficoSemanas(lista) {
    var semanas = [], agora = new Date();
    var segunda = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - ((agora.getDay() + 6) % 7));
    for (var i = 5; i >= 0; i--) {
      var ini = new Date(segunda.getTime() - i * 7 * 86400e3);
      semanas.push({ ini: ini, fim: new Date(ini.getTime() + 7 * 86400e3), n: 0 });
    }
    lista.forEach(function (d) {
      var t = new Date(d.criado_em);
      semanas.forEach(function (s) { if (t >= s.ini && t < s.fim) { s.n += 1; } });
    });
    var maior = Math.max.apply(null, semanas.map(function (s) { return s.n; })) || 1;
    var svg = svgEl("svg", { viewBox: "0 0 330 150", role: "img", "class": "grafico-semanas", "aria-label": "Doações por semana: " + semanas.map(function (s) { return dataBR(s.ini.toISOString()).slice(0, 5) + " " + s.n; }).join(", ") });
    semanas.forEach(function (s, i) {
      var x = 8 + i * 54, h = (s.n / maior) * 86, y = 112 - h;
      var r = svgEl("rect", { x: x, y: s.n ? y : 110, width: 40, height: s.n ? Math.max(h, 2) : 2, rx: 4, "class": "viz-destaque" });
      r.appendChild(svgEl("title", {}, "Semana de " + dataBR(s.ini.toISOString()) + ": " + s.n));
      svg.appendChild(r);
      svg.appendChild(svgEl("text", { x: x + 20, y: (s.n ? y : 110) - 6, "text-anchor": "middle", "class": "rotulo-valor" }, String(s.n)));
      svg.appendChild(svgEl("text", { x: x + 20, y: 132, "text-anchor": "middle" }, dataBR(s.ini.toISOString()).slice(0, 5)));
    });
    return el("figure", { className: "grafico" }, [svg, el("figcaption", { className: "texto-pequeno", text: "Cada barra é uma semana (começando na segunda-feira indicada)." })]);
  }

  /* =========================================================
     PAINEL DO USUÁRIO (abas por perfil)
     ========================================================= */
  var ABAS = {
    doador: [["nova", "Nova doação"], ["minhas", "Minhas doações"], ["painel", "Painel"]],
    receptor: [["disponiveis", "Doações disponíveis"], ["reservas", "Minhas reservas"], ["painel", "Painel"]],
    admin: [["receptores", "Receptores"], ["todas", "Todas as doações"], ["painel", "Painel"]]
  };

  function telaUsuario(s) {
    var p = s.perfil;
    var abas = ABAS[p.perfil];
    if (!abaAtual || !abas.some(function (a) { return a[0] === abaAtual; })) { abaAtual = abas[0][0]; }
    area.textContent = "";
    area.appendChild(el("div", { className: "ola" }, [
      el("p", null, ["Olá, ", el("b", { text: p.nome }), " · ", PERFIS[p.perfil], p.organizacao ? " · " + p.organizacao : ""]),
      el("button", { className: "botao botao-secundario botao-pequeno", type: "button", text: "Sair", onclick: function () { dados.sair().then(function () { abaAtual = null; mensagem(); mostrar(); }); } })
    ]));
    if (p.perfil === "receptor" && !p.aprovado) {
      area.appendChild(el("div", { className: "aviso aviso-confirmar", role: "status" }, [
        el("span", { className: "aviso-titulo", text: "Aguardando aprovação" }),
        el("span", { text: "Seu cadastro de receptor precisa ser aprovado pelo admin antes de ver e reservar doações." })
      ]));
      return;
    }
    var barra = el("div", { className: "abas", role: "tablist" });
    abas.forEach(function (a) {
      barra.appendChild(el("button", { className: "aba", role: "tab", type: "button", "aria-selected": String(abaAtual === a[0]), text: a[1], onclick: function () { abaAtual = a[0]; mensagem(); mostrar(); } }));
    });
    var box = el("div", { className: "painel", role: "tabpanel", "aria-live": "polite" }, [el("p", { className: "texto-pequeno", text: "Carregando..." })]);
    area.appendChild(barra);
    area.appendChild(box);

    if (abaAtual === "nova") { box.textContent = ""; formNovaDoacao(box); return; }
    Promise.all([dados.doacoes(), dados.reservas(), p.perfil === "admin" ? dados.perfis() : Promise.resolve([])]).then(function (r) {
      box.textContent = "";
      var lista = r[0], reservas = r[1], perfis = r[2];
      if (abaAtual === "minhas") { minhasDoacoes(box, lista); }
      else if (abaAtual === "disponiveis") { disponiveis(box, lista); }
      else if (abaAtual === "reservas") { minhasReservas(box, lista, reservas, s.id); }
      else if (abaAtual === "receptores") { receptores(box, perfis); }
      else if (abaAtual === "todas") { todas(box, lista); }
      else if (abaAtual === "painel") { painel(box, lista, reservas, perfis, s); }
    }).catch(function (e) { box.textContent = ""; falhou(e); });
  }

  function mostrar() {
    dados.sessao().then(function (s) { if (s) { telaUsuario(s); } else { telaEntrada(); } }).catch(function (e) { falhou(e); telaEntrada(); });
  }

  /* =========================================================
     COMEÇAR: tenta o Supabase; se não der, liga o modo demonstração
     ========================================================= */
  function ligarDemo(motivo) {
    dados = D.criarDemo();
    $("faixa-demo").hidden = false;
    $("modo-info").textContent = motivo;
    mostrar();
  }
  var forcarDemo = /[?&]modo=demo\b/.test(location.search);
  if (forcarDemo || !cfg.supabaseUrl || !cfg.supabaseChave) {
    ligarDemo(forcarDemo ? "Modo demonstração escolhido pelo endereço (?modo=demo)." : "O Supabase ainda não foi configurado (plataforma/config.js), então a plataforma está no modo demonstração.");
  } else {
    var sb = D.criarSupabase(cfg);
    area.textContent = "Conectando ao banco de dados...";
    sb.iniciar().then(function () {
      dados = sb;
      $("modo-info").textContent = "Conectado ao banco de dados (Supabase). Login real.";
      mostrar();
    }).catch(function (e) {
      ligarDemo("Não foi possível falar com o Supabase (" + ((e && e.message) || "erro") + "). Para a demonstração não travar, a plataforma entrou no modo demonstração.");
    });
  }
})();
