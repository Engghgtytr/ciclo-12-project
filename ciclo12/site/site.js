/* =========================================================
   Ciclo Consumo — calculadora do banho, gráfico e cadastro
   Segurança: textContent sempre; localStorage sempre em try/catch.
   ========================================================= */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  var fmt0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var fmt1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  var ONU_L = 110;      // L/pessoa/dia (ONU, via SNIS/Agência Brasil)
  var BRASIL_L = 154;   // L/pessoa/dia (SNIS, via Agência Brasil)
  var DIAS_MES = 30;
  var REDUCAO_MIN = 5;

  /* ---------- leitura e validação dos campos ---------- */
  function lerNumero(id) {
    var bruto = String($(id).value).trim().replace(",", ".");
    if (bruto === "") { return { vazio: true, valor: NaN }; }
    return { vazio: false, valor: Number(bruto) };
  }
  function marcarErro(campo, msgId, msg) {
    var c = $(campo), m = $(msgId);
    if (msg) {
      c.setAttribute("aria-invalid", "true");
      m.textContent = msg;
      m.hidden = false;
    } else {
      c.removeAttribute("aria-invalid");
      m.textContent = "";
      m.hidden = true;
    }
    return !msg;
  }
  /* regra: { obrigatorio, min, max, inteiro, nome } */
  function validar(id, msgId, regra) {
    var n = lerNumero(id);
    var erro = "";
    if (n.vazio) { erro = regra.obrigatorio ? "Preencha " + regra.nome + "." : ""; }
    else if (!isFinite(n.valor)) { erro = "Use só números."; }
    else if (regra.inteiro && Math.floor(n.valor) !== n.valor) { erro = "Use um número inteiro."; }
    else if (n.valor < regra.min) { erro = "Use um valor de pelo menos " + String(regra.min).replace(".", ",") + "."; }
    else if (n.valor > regra.max) { erro = "Use um valor de no máximo " + String(regra.max).replace(".", ",") + "."; }
    marcarErro(id, msgId, erro);
    return { ok: !erro, vazio: n.vazio, valor: n.valor };
  }

  /* ---------- contas (as mesmas fórmulas de "Como calculamos") ---------- */
  function calcular(e) {
    var litrosPessoa = e.minutos * e.vazao;
    var litrosCasa = e.pessoas * litrosPessoa;
    var pct = litrosPessoa / ONU_L * 100;
    var kwhMes = e.pessoas * (e.minutos / 60) * (e.potencia / 1000) * DIAS_MES;
    var custo = e.preco != null ? kwhMes * e.preco : null;
    var menos = Math.min(REDUCAO_MIN, e.minutos);
    var ecoLitrosMes = e.pessoas * menos * e.vazao * DIAS_MES;
    var ecoKwhMes = e.pessoas * (menos / 60) * (e.potencia / 1000) * DIAS_MES;
    var ecoReais = e.preco != null ? ecoKwhMes * e.preco : null;
    return { litrosPessoa: litrosPessoa, litrosCasa: litrosCasa, pct: pct, kwhMes: kwhMes, custo: custo,
      menos: menos, ecoLitrosMes: ecoLitrosMes, ecoKwhMes: ecoKwhMes, ecoReais: ecoReais };
  }

  /* ---------- gráfico SVG (criado no código, sem biblioteca) ---------- */
  var SVG = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, texto) {
    var e = document.createElementNS(SVG, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (texto != null) { e.textContent = texto; }
    return e;
  }
  function desenharGrafico(litrosPessoa) {
    var svg = $("grafico-agua");
    while (svg.lastChild && svg.lastChild.tagName !== "desc") { svg.removeChild(svg.lastChild); }
    var barras = [
      { nome: "Média no Brasil (dia todo)", valor: BRASIL_L, classe: "viz-1" },
      { nome: "Recomendado pela ONU (dia todo)", valor: ONU_L, classe: "viz-2" },
      { nome: "Banho de cada pessoa da sua casa", valor: litrosPessoa, classe: "viz-destaque" }
    ];
    var larguraMax = 250, inicioX = 0;
    var maior = Math.max.apply(null, barras.map(function (b) { return b.valor || 0; })) || 1;
    barras.forEach(function (b, i) {
      var y = i * 50;
      var w = b.valor == null ? 0 : Math.max(2, (b.valor / maior) * larguraMax);
      svg.appendChild(svgEl("text", { x: inicioX, y: y + 12 }, b.nome));
      var r = svgEl("rect", { x: inicioX, y: y + 18, width: w.toFixed(1), height: 22, rx: 4, "class": b.classe });
      r.appendChild(svgEl("title", {}, b.nome + ": " + (b.valor == null ? "sem valor" : fmt0.format(b.valor) + " L")));
      svg.appendChild(r);
      svg.appendChild(svgEl("text", { x: (inicioX + w + 6).toFixed(1), y: y + 34, "class": "rotulo-valor" },
        b.valor == null ? "-" : fmt0.format(b.valor) + " L"));
    });
  }

  /* ---------- mostrar resultado ---------- */
  function limparSaidas() {
    ["o-litros", "o-pct", "o-kwh", "o-custo"].forEach(function (id) { $(id).textContent = "-"; });
    $("o-economia").textContent = "-";
    desenharGrafico(null);
  }

  function atualizar() {
    var p = validar("c-pessoas", "e-pessoas", { obrigatorio: true, min: 1, max: 20, inteiro: true, nome: "o número de pessoas" });
    var m = validar("c-minutos", "e-minutos", { obrigatorio: true, min: 0.5, max: 60, nome: "os minutos de banho" });
    var v = validar("c-vazao", "e-vazao", { obrigatorio: true, min: 1, max: 30, nome: "a vazão" });
    var pr = validar("c-preco", "e-preco", { obrigatorio: false, min: 0.01, max: 10, nome: "o preço do kWh" });
    var potencia = Number($("c-potencia").value);

    var tudoOk = p.ok && m.ok && v.ok && pr.ok;
    $("calc-erro").hidden = tudoOk;
    if (!tudoOk) { limparSaidas(); return null; }

    var r = calcular({ pessoas: p.valor, minutos: m.valor, vazao: v.valor, potencia: potencia, preco: pr.vazio ? null : pr.valor });
    $("o-litros").textContent = fmt0.format(r.litrosCasa) + " L";
    $("o-pct").textContent = fmt1.format(r.pct) + "%";
    if (potencia === 0) {
      $("o-kwh").textContent = "0 kWh";
      $("o-custo").textContent = "Não se aplica";
      $("o-custo-texto").textContent = "o chuveiro não é elétrico, então ele não pesa na conta de luz";
    } else {
      $("o-kwh").textContent = fmt0.format(r.kwhMes) + " kWh";
      if (r.custo == null) {
        $("o-custo").textContent = "R$ ?";
        $("o-custo-texto").textContent = "preencha o preço do kWh da sua conta para ver o custo";
      } else {
        $("o-custo").textContent = reais.format(r.custo);
        $("o-custo-texto").textContent = "por mês na conta de luz, só do chuveiro";
      }
    }
    var frase = "Economia de " + fmt0.format(r.ecoLitrosMes) + " litros de água por mês";
    if (potencia > 0) {
      frase += " e " + fmt0.format(r.ecoKwhMes) + " kWh";
      frase += r.ecoReais == null ? " (preencha o preço do kWh para ver em reais)" : ", ou " + reais.format(r.ecoReais) + " na conta de luz";
    }
    frase += ".";
    if (r.menos < REDUCAO_MIN) { frase += " Como o banho já tem menos de 5 minutos, a conta usa o banho inteiro."; }
    $("o-economia").textContent = frase;
    desenharGrafico(r.litrosPessoa);
    return r;
  }

  ["c-pessoas", "c-minutos", "c-potencia", "c-preco", "c-vazao"].forEach(function (id) {
    $(id).addEventListener("input", atualizar);
    $(id).addEventListener("change", atualizar);
  });
  $("form-calc").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!atualizar()) {
      var primeiro = document.querySelector("#form-calc [aria-invalid=true]");
      if (primeiro) { primeiro.focus(); }
    }
  });

  /* ---------- cadastro "Receber dicas" (só neste navegador) ---------- */
  var CHAVE = "ciclo-consumo-cadastros";
  function lerCadastros() {
    try { var s = localStorage.getItem(CHAVE); var l = s ? JSON.parse(s) : []; return Array.isArray(l) ? l : []; }
    catch (e) { return []; }
  }
  function salvarCadastros(lista) {
    try { localStorage.setItem(CHAVE, JSON.stringify(lista)); return true; } catch (e) { return false; }
  }
  var EMAIL_OK = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

  $("form-cadastro").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var msg = $("msg-cadastro");
    var nome = $("r-nome").value.trim();
    var email = $("r-email").value.trim();
    var okNome = marcarErro("r-nome", "e-nome",
      nome.length < 2 ? "Escreva seu nome (pelo menos 2 letras)." : nome.length > 60 ? "Nome muito longo." : "");
    var okEmail = marcarErro("r-email", "e-email",
      !email ? "Preencha o e-mail." : !EMAIL_OK.test(email) ? "E-mail inválido. Exemplo do formato: nome@provedor.com" : "");
    if (!okNome || !okEmail) {
      msg.className = "mensagem-form erro";
      msg.textContent = "Corrija os campos marcados.";
      (okNome ? $("r-email") : $("r-nome")).focus();
      return;
    }
    var lista = lerCadastros().filter(function (c) { return c.email.toLowerCase() !== email.toLowerCase(); });
    lista.push({ nome: nome, email: email, em: new Date().toISOString() });
    if (salvarCadastros(lista)) {
      msg.className = "mensagem-form ok";
      msg.textContent = "Pronto, " + nome + "! Seu cadastro ficou salvo só neste navegador. Nenhum e-mail foi enviado.";
      $("form-cadastro").reset();
    } else {
      msg.className = "mensagem-form erro";
      msg.textContent = "Este navegador não deixou salvar (modo anônimo ou armazenamento bloqueado). Nada foi guardado.";
    }
  });

  $("btn-apagar").addEventListener("click", function () {
    var msg = $("msg-cadastro");
    try { localStorage.removeItem(CHAVE); msg.className = "mensagem-form ok"; msg.textContent = "Dados apagados deste navegador."; }
    catch (e) { msg.className = "mensagem-form erro"; msg.textContent = "Não foi possível acessar o armazenamento deste navegador."; }
  });

  /* ---------- começar ---------- */
  atualizar();
})();
