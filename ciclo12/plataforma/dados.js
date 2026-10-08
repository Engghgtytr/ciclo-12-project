/* =========================================================
   Ciclo Prato — acesso aos dados
   Dois "adaptadores" com as MESMAS funções:
   - supabase: banco real, login real, regras garantidas pelo RLS (banco.sql)
   - demo (plano B): tudo no localStorage deste navegador, usuários simulados.
     Repete as regras em JavaScript só para a demonstração parecer real; NÃO é seguro.
   ========================================================= */
(function (raiz) {
  "use strict";

  var SUPABASE_JS = {
    url: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js",
    hash: "sha384-BWcjm9OdFth9TbhCxZPdm+gAOUMAzQy9nmTs12ioXdCcbVnJaPMn+fMUoQCLt60R"
  };

  function hojeISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function erro(msg) { var e = new Error(msg); e.amigavel = true; return e; }

  /* Traduz erros do Supabase para português simples */
  function traduzir(e) {
    var m = (e && (e.message || e.error_description)) || String(e);
    if (/Invalid login credentials/i.test(m)) { return erro("E-mail ou senha errados."); }
    if (/Email not confirmed/i.test(m)) { return erro("Confirme seu e-mail primeiro: abra o link que o Supabase mandou para você."); }
    if (/already registered|already been registered|User already/i.test(m)) { return erro("Este e-mail já tem cadastro. Use \"Entrar\"."); }
    if (/Password should be|weak password/i.test(m)) { return erro("Senha fraca: use pelo menos 8 caracteres, misturando letras e números."); }
    if (/rate limit|too many/i.test(m)) { return erro("Muitas tentativas seguidas. Espere alguns minutos e tente de novo."); }
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) { return erro("Sem conexão com o servidor. Confira a internet."); }
    if (/permission denied|row-level security/i.test(m)) { return erro("O banco recusou: você não tem permissão para isso."); }
    if (/check constraint/i.test(m)) { return erro("O banco recusou: algum campo está fora do permitido (por exemplo, kg ou tamanho do texto)."); }
    return erro(m); // as mensagens das funções do banco já são em português
  }

  /* ---------------------------------------------------------
     ADAPTADOR SUPABASE
     --------------------------------------------------------- */
  function carregarSupabase() {
    return new Promise(function (ok, falha) {
      if (raiz.supabase && raiz.supabase.createClient) { ok(); return; }
      var s = document.createElement("script");
      s.src = SUPABASE_JS.url; s.integrity = SUPABASE_JS.hash; s.crossOrigin = "anonymous";
      s.onload = function () { ok(); };
      s.onerror = function () { falha(erro("Não foi possível carregar o cliente do Supabase.")); };
      document.head.appendChild(s);
    });
  }
  function comTempo(promessa, ms) {
    return Promise.race([promessa, new Promise(function (_, falha) { setTimeout(function () { falha(erro("O servidor demorou demais para responder.")); }, ms); })]);
  }

  function criarSupabase(cfg) {
    var sb = null;
    function r(resp) { if (resp.error) { throw traduzir(resp.error); } return resp.data; }
    return {
      modo: "supabase",
      iniciar: function () {
        return comTempo(carregarSupabase().then(function () {
          sb = raiz.supabase.createClient(cfg.supabaseUrl, cfg.supabaseChave);
          // teste rápido: o servidor de login responde? (rota oficial de saúde do Supabase)
          return fetch(cfg.supabaseUrl.replace(/\/+$/, "") + "/auth/v1/health", { headers: { apikey: cfg.supabaseChave } });
        }).then(function (resp) {
          if (!resp.ok) { throw erro("O Supabase respondeu com erro " + resp.status + " (projeto pausado?)."); }
        }), 8000);
      },
      sessao: function () {
        return sb.auth.getSession().then(function (resp) {
          var s = r(resp).session;
          if (!s) { return null; }
          return sb.from("profiles").select("*").eq("id", s.user.id).maybeSingle().then(function (p) {
            var perfil = r(p);
            if (!perfil) { return null; }
            return { id: s.user.id, email: s.user.email, perfil: perfil };
          });
        });
      },
      entrar: function (email, senha) {
        return sb.auth.signInWithPassword({ email: email, password: senha }).then(r);
      },
      cadastrar: function (d) {
        return sb.auth.signUp({
          email: d.email, password: d.senha,
          options: { data: { nome: d.nome, organizacao: d.organizacao || "", perfil: d.perfil }, emailRedirectTo: location.href.split("#")[0] }
        }).then(function (resp) { var x = r(resp); return { precisaConfirmar: !x.session }; });
      },
      sair: function () { return sb.auth.signOut().then(function () {}); },
      doacoes: function () { return sb.from("doacoes").select("*").order("criado_em", { ascending: false }).then(r); },
      endereco: function (id) {
        return sb.from("doacao_endereco").select("endereco").eq("doacao_id", id).maybeSingle().then(function (resp) { var x = r(resp); return x ? x.endereco : null; });
      },
      reservas: function () { return sb.from("reservas").select("*").then(r); },
      perfis: function () { return sb.from("profiles").select("*").order("criado_em").then(r); },
      criarDoacao: function (d) {
        return sb.rpc("criar_doacao", {
          p_alimento: d.alimento, p_categoria: d.categoria, p_quantidade_kg: d.quantidade_kg, p_validade: d.validade,
          p_bairro: d.bairro, p_endereco: d.endereco, p_horario: d.horario_retirada, p_observacoes: d.observacoes || null
        }).then(r);
      },
      reservar: function (id) { return sb.rpc("reservar_doacao", { p_doacao: id }).then(r); },
      confirmarRetirada: function (id) { return sb.rpc("confirmar_retirada", { p_doacao: id }).then(r); },
      apagarDoacao: function (id) {
        return sb.from("doacoes").delete().eq("id", id).select("id").then(function (resp) {
          if (!r(resp).length) { throw erro("Não foi possível apagar (só dá para apagar doações ainda disponíveis)."); }
        });
      },
      aprovar: function (uid, sim) { return sb.rpc("aprovar_receptor", { p_usuario: uid, p_aprovado: sim }).then(r); }
    };
  }

  /* ---------------------------------------------------------
     ADAPTADOR DEMO (plano B) — localStorage
     --------------------------------------------------------- */
  function criarDemo() {
    var CHAVE = "ciclo-prato-demo", CHAVE_SESSAO = "ciclo-prato-demo-sessao";
    var memoria = null; // se o navegador bloquear o armazenamento, funciona só enquanto a página estiver aberta
    function semente() {
      var agora = Date.now();
      function diasISO(n) { var d = new Date(agora + n * 86400e3); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
      function ts(diasAtras, horas) { return new Date(agora - diasAtras * 86400e3 + (horas || 0) * 3600e3).toISOString(); }
      return {
        seq: 10,
        usuarios: [
          { id: "u-doador", email: "doador.demo@exemplo.com", senhaDemo: "demo1234", perfil: "doador", nome: "Padaria Exemplo", organizacao: "Padaria Exemplo (fictícia)", aprovado: true, criado_em: ts(30) },
          { id: "u-receptor", email: "receptor.demo@exemplo.com", senhaDemo: "demo1234", perfil: "receptor", nome: "ONG Exemplo", organizacao: "ONG Exemplo (fictícia)", aprovado: true, criado_em: ts(29) },
          { id: "u-admin", email: "admin.demo@exemplo.com", senhaDemo: "demo1234", perfil: "admin", nome: "Admin do grupo", organizacao: null, aprovado: true, criado_em: ts(31) },
          { id: "u-pendente", email: "pendente.demo@exemplo.com", senhaDemo: "demo1234", perfil: "receptor", nome: "Projeto Exemplo", organizacao: "Projeto Exemplo (fictício)", aprovado: false, criado_em: ts(2) }
        ],
        doacoes: [
          { id: 1, doador_id: "u-doador", alimento: "Pães do dia (EXEMPLO)", categoria: "padaria", quantidade_kg: 4, validade: diasISO(1), bairro: "Vila Galvão", horario_retirada: "Hoje, 18h às 19h", observacoes: "Dado fictício da demonstração.", status: "disponivel", criado_em: ts(0, -3), reservada_em: null, retirada_em: null },
          { id: 2, doador_id: "u-doador", alimento: "Frutas e legumes (EXEMPLO)", categoria: "hortifruti", quantidade_kg: 12.5, validade: diasISO(2), bairro: "Vila Galvão", horario_retirada: "Amanhã, 9h às 11h", observacoes: null, status: "retirada", criado_em: ts(9), reservada_em: ts(9, 5), retirada_em: ts(8) },
          { id: 3, doador_id: "u-doador", alimento: "Marmitas (EXEMPLO)", categoria: "refeicao", quantidade_kg: 6, validade: diasISO(3), bairro: "Centro", horario_retirada: "Hoje, 14h", observacoes: null, status: "reservada", criado_em: ts(1), reservada_em: ts(1, 3), retirada_em: null }
        ],
        enderecos: { 1: "Rua Fictícia, 100 (EXEMPLO)", 2: "Rua Fictícia, 100 (EXEMPLO)", 3: "Av. Fictícia, 50 (EXEMPLO)" },
        reservas: [
          { id: 1, doacao_id: 2, receptor_id: "u-receptor", criado_em: ts(9, 5) },
          { id: 2, doacao_id: 3, receptor_id: "u-receptor", criado_em: ts(1, 3) }
        ]
      };
    }
    function ler() {
      if (memoria) { return memoria; }
      try {
        var s = localStorage.getItem(CHAVE);
        if (s) {
          var d0 = JSON.parse(s);
          // versões antigas guardavam a senha em texto: apaga (as contas fictícias continuam com demo1234)
          var mudou = false;
          d0.usuarios.forEach(function (u) {
            if (u.senha !== undefined) { if (u.id.indexOf("u-") === 0) { u.senhaDemo = "demo1234"; } delete u.senha; mudou = true; }
          });
          if (mudou) { gravar(d0); }
          return d0;
        }
      } catch (e) { /* bloqueado */ }
      var d = semente(); gravar(d); return d;
    }
    /* Senha de conta criada no modo demonstração: guarda só o hash SHA-256 com "sal", nunca a senha.
       (As 4 contas fictícias usam a senha pública "demo1234", escrita na própria tela.) */
    function hashSenha(sal, senha) {
      if (!(raiz.crypto && raiz.crypto.subtle && raiz.TextEncoder)) {
        return Promise.reject(erro("Este navegador não permite criar conta no modo demonstração. Use uma das contas de demonstração."));
      }
      return raiz.crypto.subtle.digest("SHA-256", new TextEncoder().encode(sal + ":" + senha)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      });
    }
    function novoSal() {
      var a = new Uint8Array(16);
      if (raiz.crypto && raiz.crypto.getRandomValues) { raiz.crypto.getRandomValues(a); } else { for (var i = 0; i < 16; i++) { a[i] = Math.floor(Math.random() * 256); } }
      return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    }
    function gravar(d) { try { localStorage.setItem(CHAVE, JSON.stringify(d)); memoria = null; } catch (e) { memoria = d; } }
    function idSessao() { try { return localStorage.getItem(CHAVE_SESSAO); } catch (e) { return memoria && memoria._sessao; } }
    function setSessao(id) {
      try { if (id) { localStorage.setItem(CHAVE_SESSAO, id); } else { localStorage.removeItem(CHAVE_SESSAO); } }
      catch (e) { var d = ler(); d._sessao = id; memoria = d; }
    }
    function eu(d) { var id = idSessao(); return d.usuarios.filter(function (u) { return u.id === id; })[0] || null; }
    function precisa(cond, msg) { if (!cond) { throw erro(msg); } }
    function perfilPublico(u) { return { id: u.id, perfil: u.perfil, nome: u.nome, organizacao: u.organizacao, aprovado: u.aprovado, criado_em: u.criado_em }; }
    function reservou(d, uid, did) { return d.reservas.some(function (r) { return r.doacao_id === did && r.receptor_id === uid; }); }
    function vazio() { return Promise.resolve(); }
    function tentar(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }

    return {
      modo: "demo",
      iniciar: vazio,
      contasDemo: function () { return ler().usuarios.map(function (u) { return { email: u.email, perfil: u.perfil, nome: u.nome, aprovado: u.aprovado }; }); },
      reiniciar: function () { gravar(semente()); setSessao(null); return vazio(); },
      sessao: function () { return tentar(function () { var u = eu(ler()); return u ? { id: u.id, email: u.email, perfil: perfilPublico(u) } : null; }); },
      entrar: function (email, senha) {
        var u = ler().usuarios.filter(function (x) { return x.email.toLowerCase() === String(email).toLowerCase(); })[0];
        if (!u) { return Promise.reject(erro("E-mail ou senha errados.")); }
        var conferir = u.senhaDemo !== undefined ? Promise.resolve(u.senhaDemo === senha)
          : u.hash ? hashSenha(u.sal, senha).then(function (h) { return h === u.hash; }) : Promise.resolve(false);
        return conferir.then(function (certo) {
          if (!certo) { throw erro("E-mail ou senha errados."); }
          setSessao(u.id);
        });
      },
      cadastrar: function (dd) {
        var d = ler();
        if (d.usuarios.some(function (x) { return x.email.toLowerCase() === dd.email.toLowerCase(); })) {
          return Promise.reject(erro("Este e-mail já tem cadastro. Use \"Entrar\"."));
        }
        var sal = novoSal();
        return hashSenha(sal, dd.senha).then(function (h) {
          var d2 = ler();
          var perfil = dd.perfil === "receptor" ? "receptor" : "doador"; // ninguém vira admin pelo cadastro
          var u = { id: "u" + (++d2.seq), email: dd.email, sal: sal, hash: h, perfil: perfil, nome: dd.nome, organizacao: dd.organizacao || null, aprovado: perfil === "doador", criado_em: new Date().toISOString() };
          d2.usuarios.push(u); gravar(d2); setSessao(u.id);
          return { precisaConfirmar: false };
        });
      },
      sair: function () { setSessao(null); return vazio(); },
      doacoes: function () {
        return tentar(function () {
          var d = ler(), u = eu(d); if (!u) { return []; }
          var hoje = hojeISO();
          return d.doacoes.filter(function (x) {
            if (u.perfil === "admin") { return true; }
            if (u.perfil === "doador") { return x.doador_id === u.id; }
            return (u.aprovado && x.status === "disponivel" && x.validade >= hoje) || reservou(d, u.id, x.id);
          }).sort(function (a, b) { return a.criado_em < b.criado_em ? 1 : -1; }).map(function (x) { return Object.assign({}, x); });
        });
      },
      endereco: function (id) {
        return tentar(function () {
          var d = ler(), u = eu(d), x = d.doacoes.filter(function (y) { return y.id === id; })[0];
          if (!u || !x) { return null; }
          var pode = u.perfil === "admin" || x.doador_id === u.id || reservou(d, u.id, id);
          return pode ? d.enderecos[id] || null : null;
        });
      },
      reservas: function () {
        return tentar(function () {
          var d = ler(), u = eu(d); if (!u) { return []; }
          return d.reservas.filter(function (r) {
            if (u.perfil === "admin" || r.receptor_id === u.id) { return true; }
            return d.doacoes.some(function (x) { return x.id === r.doacao_id && x.doador_id === u.id; });
          });
        });
      },
      perfis: function () {
        return tentar(function () {
          var d = ler(), u = eu(d); if (!u) { return []; }
          return d.usuarios.filter(function (x) { return u.perfil === "admin" || x.id === u.id; }).map(perfilPublico);
        });
      },
      criarDoacao: function (dd) {
        return tentar(function () {
          var d = ler(), u = eu(d);
          precisa(u && u.perfil === "doador", "Só doadores podem criar doações.");
          precisa(dd.validade >= hojeISO(), "A validade precisa ser hoje ou depois.");
          precisa(dd.quantidade_kg > 0 && dd.quantidade_kg <= 1000, "Quantidade fora do permitido.");
          var id = ++d.seq;
          d.doacoes.push({ id: id, doador_id: u.id, alimento: dd.alimento, categoria: dd.categoria, quantidade_kg: dd.quantidade_kg, validade: dd.validade, bairro: dd.bairro, horario_retirada: dd.horario_retirada, observacoes: dd.observacoes || null, status: "disponivel", criado_em: new Date().toISOString(), reservada_em: null, retirada_em: null });
          d.enderecos[id] = dd.endereco;
          gravar(d);
          return id;
        });
      },
      reservar: function (id) {
        return tentar(function () {
          var d = ler(), u = eu(d), x = d.doacoes.filter(function (y) { return y.id === id; })[0];
          precisa(u && u.perfil === "receptor" && u.aprovado, "Só receptores aprovados podem reservar.");
          precisa(x, "Doação não encontrada.");
          precisa(x.status === "disponivel", "Esta doação não está mais disponível.");
          precisa(x.validade >= hojeISO(), "Esta doação passou da validade.");
          x.status = "reservada"; x.reservada_em = new Date().toISOString();
          d.reservas.push({ id: ++d.seq, doacao_id: id, receptor_id: u.id, criado_em: x.reservada_em });
          gravar(d);
        });
      },
      confirmarRetirada: function (id) {
        return tentar(function () {
          var d = ler(), u = eu(d), x = d.doacoes.filter(function (y) { return y.id === id; })[0];
          precisa(u && x && x.doador_id === u.id, "Só o doador desta doação pode confirmar a retirada.");
          precisa(x.status === "reservada", "A doação precisa estar reservada.");
          x.status = "retirada"; x.retirada_em = new Date().toISOString();
          gravar(d);
        });
      },
      apagarDoacao: function (id) {
        return tentar(function () {
          var d = ler(), u = eu(d), x = d.doacoes.filter(function (y) { return y.id === id; })[0];
          precisa(u && x && (u.perfil === "admin" || (x.doador_id === u.id && x.status === "disponivel")), "Não foi possível apagar (só dá para apagar doações ainda disponíveis).");
          d.doacoes = d.doacoes.filter(function (y) { return y.id !== id; });
          d.reservas = d.reservas.filter(function (r) { return r.doacao_id !== id; });
          delete d.enderecos[id];
          gravar(d);
        });
      },
      aprovar: function (uid, sim) {
        return tentar(function () {
          var d = ler(), u = eu(d);
          precisa(u && u.perfil === "admin", "Só o admin pode aprovar receptores.");
          var alvo = d.usuarios.filter(function (x) { return x.id === uid && x.perfil === "receptor"; })[0];
          precisa(alvo, "Receptor não encontrado.");
          alvo.aprovado = !!sim; gravar(d);
        });
      }
    };
  }

  raiz.CicloPratoDados = { criarSupabase: criarSupabase, criarDemo: criarDemo, hojeISO: hojeISO };
})(window);
