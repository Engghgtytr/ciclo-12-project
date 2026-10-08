/* =========================================================
   Ciclo Ponto — service worker
   - Guarda o "esqueleto" do app e os dados (pontos) para funcionar sem internet.
   - Caminhos RELATIVOS a este arquivo: funciona no GitHub Pages dentro de subpasta
     (ex.: https://usuario.github.io/ciclo12/app/).
   - Estratégia: arquivos do próprio site = rede primeiro, cópia guardada se estiver offline
     (assim, com internet, sempre pega a versão nova). Leaflet do cdnjs = cópia guardada primeiro.
     Mapas de ruas (tiles) não são guardados: são muitos.
   Ao mudar arquivos do app, aumente o número da VERSAO.
   ========================================================= */
var VERSAO = "ciclo-ponto-v4";
var ARQUIVOS = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./manifest.json",
  "./icones/icone-192.png",
  "./icones/icone-512.png",
  "./icones/icone-maskable-512.png",
  "./icones/apple-touch-icon.png",
  "../shared/estilo.css",
  "../shared/pontos.js",
  "../shared/logo.svg",
  "../shared/favicon.svg",
  "../shared/animacao.js"
].map(function (c) { return new URL(c, self.location).href; });

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(VERSAO).then(function (cache) { return cache.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(nomes.filter(function (n) { return n.indexOf("ciclo-ponto-") === 0 && n !== VERSAO; })
        .map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") { return; }
  var url = new URL(req.url);

  // Leaflet (cdnjs): cópia guardada primeiro; se não tiver, baixa e guarda
  if (url.hostname === "cdnjs.cloudflare.com") {
    ev.respondWith(caches.match(req).then(function (guardado) {
      return guardado || fetch(req).then(function (resp) {
        if (resp && resp.ok) { var copia = resp.clone(); caches.open(VERSAO).then(function (c) { c.put(req, copia); }); }
        return resp;
      });
    }));
    return;
  }

  // Só o próprio site daqui em diante (tiles e outros sites passam direto)
  if (url.origin !== self.location.origin) { return; }

  ev.respondWith(
    fetch(req).then(function (resp) {
      if (resp && resp.ok) { var copia = resp.clone(); caches.open(VERSAO).then(function (c) { c.put(req, copia); }); }
      return resp;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (guardado) {
        if (guardado) { return guardado; }
        if (req.mode === "navigate") { return caches.match(new URL("./index.html", self.location).href); }
        return new Response("Sem internet e sem cópia guardada deste arquivo.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      });
    })
  );
});

// Clique numa notificação de lembrete: abre (ou mostra) o app na aba "Meus itens"
self.addEventListener("notificationclick", function (ev) {
  ev.notification.close();
  var alvo = new URL("./#itens", self.location).href;
  ev.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (janelas) {
      for (var i = 0; i < janelas.length; i++) {
        if (janelas[i].url.indexOf(new URL("./", self.location).href) === 0) { return janelas[i].focus(); }
      }
      return self.clients.openWindow(alvo);
    })
  );
});
