/* =========================================================
   Ciclo 12 — animação de entrada e ao rolar (compartilhada)
   - Entrada: logo dá uma volta; itens de ".anim-entrada" aparecem em sequência.
   - Ao rolar: elementos da lista REVELAR surgem quando entram na tela.
   Regras:
   - Quem pede "reduzir movimento" no sistema não vê animação nenhuma.
   - Sem JavaScript (ou sem IntersectionObserver) tudo aparece normalmente:
     o CSS só esconde algo quando a linha no <head> coloca a classe "anim-js" no <html>.
   - Este arquivo é carregado ANTES do Leaflet (que vem da internet), para não
     esperar o download do mapa.
   ========================================================= */
(function () {
  "use strict";

  var raiz = document.documentElement;
  // A linha no <head> de cada página já decidiu (reduzir movimento / navegador antigo).
  if (!raiz.classList.contains("anim-js")) { return; }

  var REVELAR = [
    ".perto", ".titulo-secao", ".problema-cartao", ".modulos > li", ".problema",   // hub
    ".secao > h2", ".numero-site", ".meta-site", ".calc-form",           // site
    ".calc-resultado > *", ".como-calculamos", ".dica", ".cadastro", "#receber .aviso"
  ].join(",");


  /* Entrada: numera os filhos para o atraso em sequência (CSS usa --i) */
  document.querySelectorAll(".anim-entrada").forEach(function (grupo) {
    Array.prototype.forEach.call(grupo.children, function (filho, i) { filho.style.setProperty("--i", i); });
  });

  /* Ao rolar */
  var alvos = document.querySelectorAll(REVELAR);
  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) { return; }
      e.target.classList.add("visivel");
      observador.unobserve(e.target); // anima só uma vez
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  alvos.forEach(function (el) {
    // atraso pequeno entre irmãos da mesma grade (máximo de 5 passos)
    var irmaos = Array.prototype.filter.call(el.parentNode.children, function (x) { return x.matches(REVELAR); });
    var pos = irmaos.indexOf(el);
    el.style.setProperty("--atraso", Math.min(pos, 5) * 70 + "ms");
    el.classList.add("revelar");
    observador.observe(el);
  });

  /* Na hora de imprimir ou salvar em PDF, mostra tudo */
  window.addEventListener("beforeprint", function () {
    alvos.forEach(function (el) { el.classList.add("visivel"); });
  });
})();
