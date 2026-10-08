/* =========================================================
   Ciclo 12 — pontos de coleta (arquivo GERADO, não edite à mão)
   Gerado por _dados/gerar_pontos.mjs em 2026-10-07.
   Para corrigir uma coordenada: preencha _dados/coordenadas_manuais.json e rode
   "node _dados/gerar_pontos.mjs" de novo.

   Como usar:
   - Em <script src="shared/pontos.js"></script>: os dados ficam em window.CICLO_PONTOS
   - Em módulo: import "./shared/pontos.js";  depois use window.CICLO_PONTOS
   - No Node (testes): const dados = require("./shared/pontos.js")

   Campos de cada ponto:
   id, nome, tipo ("pev" | "doacao" | "escola"), endereco, bairro, horario,
   horarioTexto (para mostrar na tela), referencia (ponto de referência dado pela fonte),
   aceita (materiais que a fonte diz que a rede de PEVs recebe),
   naoAceita (materiais que a fonte diz que os PEVs NÃO recebem),
   naoConfirmado (itens que a fonte NÃO cita: mostrar como "confirmar"),
   lat, lng (null = sem posição confiável), coordPrecisao ("numero" | "aproximada" | "manual" | "sem"),
   coordIncertezaKm, coordNota, status ("confirmado-fonte" | "conflito" | "exemplo" | "a-confirmar"),
   fonte, atualizadoEm, distEscolaKm (Haversine até a escola; null se sem posição).
   "confirmado-fonte" = está na lista publicada pela fonte; NÃO quer dizer que alguém ligou e confirmou.
   ========================================================= */
(function (raiz) {
  "use strict";

  var CATEGORIAS = {
    entulho: "Entulho", gesso: "Gesso", solo: "Terra (solo)", moveis: "Móveis", madeira: "Madeira",
    poda: "Folhas e poda", eletrodomesticos: "Eletrodomésticos", oleo: "Óleo de cozinha", pneus: "Pneus",
    papel: "Papel", plastico: "Plástico", metal: "Metal", vidro: "Vidro",
    celular: "Celular", pilha: "Pilhas e baterias", lampada: "Lâmpada fluorescente", roupa: "Roupa", comida: "Restos de comida"
  };

  var ESCOLA = {
    "id": "escola",
    "nome": "Colégio Progresso",
    "tipo": "escola",
    "endereco": "Av. Timóteo Penteado, 4405, Vila Galvão, Guarulhos/SP, CEP 07061-003",
    "bairro": "Vila Galvão",
    "lat": -23.45889,
    "lng": -46.56392,
    "coordPrecisao": "numero",
    "coordIncertezaKm": 0,
    "coordNota": "Número encontrado no OpenStreetMap.",
    "status": "a-confirmar",
    "nota": "Endereço tirado de um diretório de escolas (escol.as), não de fonte oficial. Confirmar na secretaria.",
    "fonte": "https://www.escol.as/287199-progresso-colegio"
  };

  var PONTOS = [
    {
      "id": "pev-01",
      "nome": "Paraventi",
      "tipo": "pev",
      "endereco": "Rua Apolônia Vieira de Jesus, 91, Jardim Leila, Guarulhos/SP",
      "bairro": "Jardim Leila",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Todos os dias, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.4581,
      "lng": -46.52336,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "próximo ao CIESP",
      "distEscolaKm": 4.14
    },
    {
      "id": "pev-02",
      "nome": "Gopoúva",
      "tipo": "pev",
      "endereco": "Rua Guarulhos, 34, Gopoúva, Guarulhos/SP",
      "bairro": "Gopoúva",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Seg a sáb, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.46869,
      "lng": -46.54244,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.2,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,2 km.",
      "status": "conflito",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "nota": "Duas fontes divergem: a Agência Mural diz 'Rua Guarulhos, 34' e outra fonte diz 'Rua Nadir, 34 (esquina com a Rua Guarulhos)'. Confirme com a Prefeitura antes de ir.",
      "distEscolaKm": 2.45
    },
    {
      "id": "pev-03",
      "nome": "Continental",
      "tipo": "pev",
      "endereco": "Rua Valdimiro Laurentino Pêssoa, 655, Parque Continental II, Guarulhos/SP",
      "bairro": "Parque Continental II",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Todos os dias, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": null,
      "lng": null,
      "coordPrecisao": "sem",
      "coordIncertezaKm": null,
      "coordNota": "Endereço não encontrado no OpenStreetMap. Conferir no Google Maps.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "atrás do CEU Continental",
      "distEscolaKm": null
    },
    {
      "id": "pev-04",
      "nome": "Torres Tibagy",
      "tipo": "pev",
      "endereco": "Rua Ouvidor, 337, Parque Santo Antonio, Guarulhos/SP",
      "bairro": "Parque Santo Antonio",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Todos os dias, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.45722,
      "lng": -46.55683,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 0.75
    },
    {
      "id": "pev-05",
      "nome": "Timóteo Penteado",
      "tipo": "pev",
      "endereco": "Avenida Faustino Ramalho, 977, Vila Galvão, Guarulhos/SP",
      "bairro": "Vila Galvão",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Todos os dias, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.46299,
      "lng": -46.56562,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.5,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,5 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 0.49
    },
    {
      "id": "pev-06",
      "nome": "Iporanga",
      "tipo": "pev",
      "endereco": "Rua Adélia Sadalla, 166, Jd. Luciara, Guarulhos/SP",
      "bairro": "Jd. Luciara",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Todos os dias, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.44037,
      "lng": -46.53201,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 3.85
    },
    {
      "id": "pev-07",
      "nome": "Cabrália",
      "tipo": "pev",
      "endereco": "Rua Cabrália, 100, Jd. Bela Vista, Guarulhos/SP",
      "bairro": "Jd. Bela Vista",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Todos os dias, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.43458,
      "lng": -46.51352,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 5.81
    },
    {
      "id": "pev-08",
      "nome": "Santos Dumont",
      "tipo": "pev",
      "endereco": "Estrada do Saboó, 795, Santos Dumont, Guarulhos/SP",
      "bairro": "Santos Dumont",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Todos os dias, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": null,
      "lng": null,
      "coordPrecisao": "sem",
      "coordIncertezaKm": null,
      "coordNota": "Rua encontrada, mas os trechos dela se espalham por 9,3 km. Conferir no Google Maps.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": null
    },
    {
      "id": "pev-09",
      "nome": "Presidente Dutra",
      "tipo": "pev",
      "endereco": "Avenida João Bassi, 707, Jd. Presidente Dutra, Guarulhos/SP",
      "bairro": "Jd. Presidente Dutra",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Todos os dias, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.42021,
      "lng": -46.42554,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.5,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,5 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "esquina com Rua Maria Paula Mota",
      "distEscolaKm": 14.76
    },
    {
      "id": "pev-10",
      "nome": "Bom Clima",
      "tipo": "pev",
      "endereco": "Rua João Bernardo de Medeiros, 800, Guarulhos/SP",
      "bairro": null,
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": null,
      "lng": null,
      "coordPrecisao": "sem",
      "coordIncertezaKm": null,
      "coordNota": "Endereço não encontrado no OpenStreetMap. Conferir no Google Maps.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "ao lado do Thomeuzão",
      "bairroNota": "A fonte não informa o bairro.",
      "distEscolaKm": null
    },
    {
      "id": "pev-11",
      "nome": "Macedo",
      "tipo": "pev",
      "endereco": "Rua Soldado Estanislau Wojcik, 26, Vila Sant'Anna, Guarulhos/SP",
      "bairro": "Vila Sant'Anna",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.47117,
      "lng": -46.52115,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "atrás do Corpo de Bombeiros",
      "distEscolaKm": 4.57
    },
    {
      "id": "pev-12",
      "nome": "Ponte Grande",
      "tipo": "pev",
      "endereco": "Alameda Josefina L. Zamataro, 233, Vila Zamataro, Guarulhos/SP",
      "bairro": "Vila Zamataro",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.50758,
      "lng": -46.55531,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.1,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,1 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 5.48
    },
    {
      "id": "pev-13",
      "nome": "Vila Barros",
      "tipo": "pev",
      "endereco": "Rua Guilherme Lino dos Santos, 349, Jardim Flor do Campo, Guarulhos/SP",
      "bairro": "Jardim Flor do Campo",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.45097,
      "lng": -46.50405,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 6.17
    },
    {
      "id": "pev-14",
      "nome": "Vila Galvão",
      "tipo": "pev",
      "endereco": "Rua Ipiranga, 543, Vila Galvão, Guarulhos/SP",
      "bairro": "Vila Galvão",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.44898,
      "lng": -46.56541,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.2,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,2 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "altura do número 615 da Avenida Pedro de Souza Lopes",
      "distEscolaKm": 1.11
    },
    {
      "id": "pev-15",
      "nome": "Cabuçu",
      "tipo": "pev",
      "endereco": "Av. Pedro de Souza Lopes (altura do nº 7800), Guarulhos/SP",
      "bairro": null,
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": null,
      "lng": null,
      "coordPrecisao": "sem",
      "coordIncertezaKm": null,
      "coordNota": "Rua encontrada, mas os trechos dela se espalham por 4,8 km. Conferir no Google Maps.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "em frente ao número 7800, Escola Maria Helena Faria Lima e Cunha",
      "bairroNota": "A fonte não informa o bairro.",
      "distEscolaKm": null
    },
    {
      "id": "pev-16",
      "nome": "Vila Rio",
      "tipo": "pev",
      "endereco": "Av. Benjamin Harris Hunnicutt, 1509, Vila Rio, Guarulhos/SP",
      "bairro": "Vila Rio",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.43094,
      "lng": -46.53764,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.3,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,3 km. No OpenStreetMap a avenida aparece como 'Benjamim Harris Hunnicutt', no mesmo bairro (Vila Rio).",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 4.1
    },
    {
      "id": "pev-17",
      "nome": "Rosa de França",
      "tipo": "pev",
      "endereco": "Rua Nestor Cabral, 61, Jd. Rosa de França, Guarulhos/SP",
      "bairro": "Jd. Rosa de França",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.44402,
      "lng": -46.55307,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.1,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,1 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 1.99
    },
    {
      "id": "pev-18",
      "nome": "Mikail",
      "tipo": "pev",
      "endereco": "Rua Justiniano Salvador dos Santos, 269, Parque Mikail, Guarulhos/SP",
      "bairro": "Parque Mikail",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.40891,
      "lng": -46.49436,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 9.01
    },
    {
      "id": "pev-19",
      "nome": "Adriana",
      "tipo": "pev",
      "endereco": "Rua Walter Pereira de Lima, 105, Vila Sítio dos Morros, Guarulhos/SP",
      "bairro": "Vila Sítio dos Morros",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.41998,
      "lng": -46.52041,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.1,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,1 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 6.2
    },
    {
      "id": "pev-20",
      "nome": "Fortaleza",
      "tipo": "pev",
      "endereco": "Rua Medeia Escardino Mariano, 311, Jardim Fortaleza, Guarulhos/SP",
      "bairro": "Jardim Fortaleza",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": null,
      "lng": null,
      "coordPrecisao": "sem",
      "coordIncertezaKm": null,
      "coordNota": "Endereço não encontrado no OpenStreetMap. Conferir no Google Maps.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "ao lado do reservatório do SAAE",
      "distEscolaKm": null
    },
    {
      "id": "pev-21",
      "nome": "Haroldo Veloso",
      "tipo": "pev",
      "endereco": "Rua Campos Gerais, 163, Haroldo Veloso, Guarulhos/SP",
      "bairro": "Haroldo Veloso",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.41684,
      "lng": -46.46819,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "esquina com Rua Dalva de Oliveira",
      "distEscolaKm": 10.83
    },
    {
      "id": "pev-22",
      "nome": "Bondança",
      "tipo": "pev",
      "endereco": "Rua Ivan Edmundo Scarameli, 62, Jardim Bondança, Guarulhos/SP",
      "bairro": "Jardim Bondança",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": null,
      "lng": null,
      "coordPrecisao": "sem",
      "coordIncertezaKm": null,
      "coordNota": "Endereço não encontrado no OpenStreetMap. Conferir no Google Maps.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": null
    },
    {
      "id": "pev-23",
      "nome": "Lavras",
      "tipo": "pev",
      "endereco": "Av. José Brumati, 1857, Lavras, Guarulhos/SP",
      "bairro": "Lavras",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": null,
      "lng": null,
      "coordPrecisao": "sem",
      "coordIncertezaKm": null,
      "coordNota": "Endereço não encontrado no OpenStreetMap. Conferir no Google Maps.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": null
    },
    {
      "id": "pev-24",
      "nome": "Cidade Soimco",
      "tipo": "pev",
      "endereco": "Rua Bento Gonçalves, s/nº, Cidade Soimco, Guarulhos/SP",
      "bairro": "Cidade Soimco",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.44526,
      "lng": -46.46627,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.1,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,1 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "altura do número 119",
      "distEscolaKm": 10.08
    },
    {
      "id": "pev-25",
      "nome": "INOCOOP",
      "tipo": "pev",
      "endereco": "Av. Francisco Xavier Correia, 489, Residencial Parque Cumbica, Guarulhos/SP",
      "bairro": "Residencial Parque Cumbica",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.41977,
      "lng": -46.42401,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.1,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,1 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 14.92
    },
    {
      "id": "pev-26",
      "nome": "Jardim Cumbica",
      "tipo": "pev",
      "endereco": "Av. Berinepe, 99, Jardim Cumbica, Guarulhos/SP",
      "bairro": "Jardim Cumbica",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.44827,
      "lng": -46.442,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.4,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,4 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 12.49
    },
    {
      "id": "pev-27",
      "nome": "Favela 3D",
      "tipo": "pev",
      "endereco": "Rua São Martinho, 375, Cidade Satélite, Guarulhos/SP",
      "bairro": "Cidade Satélite",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.4536,
      "lng": -46.46785,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.1,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,1 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 9.82
    },
    {
      "id": "pev-28",
      "nome": "Pimentas",
      "tipo": "pev",
      "endereco": "Rua Itália, 13, Parque das Nações, Guarulhos/SP",
      "bairro": "Parque das Nações",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.43701,
      "lng": -46.40845,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 16.05
    },
    {
      "id": "pev-29",
      "nome": "Leblon",
      "tipo": "pev",
      "endereco": "Rua Araci, 188, Jardim Leblon, Guarulhos/SP",
      "bairro": "Jardim Leblon",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": null,
      "lng": null,
      "coordPrecisao": "sem",
      "coordIncertezaKm": null,
      "coordNota": "O OpenStreetMap só achou ruas com nome parecido (ex.: Rua Araci Ubirajara e Silva). Conferir no Google Maps.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": null
    },
    {
      "id": "pev-30",
      "nome": "Ponte Alta",
      "tipo": "pev",
      "endereco": "Rua Zeferino Alves de Oliveira, 530, Ponte Alta I, Guarulhos/SP",
      "bairro": "Ponte Alta I",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.40218,
      "lng": -46.41924,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 16.05
    },
    {
      "id": "pev-31",
      "nome": "Nova Bonsucesso",
      "tipo": "pev",
      "endereco": "Rua Remanso esquina com Viela Urga, Vila Nova Bonsucesso, Guarulhos/SP",
      "bairro": "Vila Nova Bonsucesso",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": null,
      "lng": null,
      "coordPrecisao": "sem",
      "coordIncertezaKm": null,
      "coordNota": "Rua encontrada, mas os trechos dela se espalham por 1,2 km. Conferir no Google Maps.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": null
    },
    {
      "id": "pev-32",
      "nome": "Álamo",
      "tipo": "pev",
      "endereco": "Rua Gentil da Silva Leite Filho, 15, Jd. Álamo, Guarulhos/SP",
      "bairro": "Jd. Álamo",
      "horario": "regular seg-sex 8h15-16h, sáb 8h15-15h30",
      "horarioTexto": "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.41066,
      "lng": -46.37417,
      "coordPrecisao": "aproximada",
      "coordIncertezaKm": 0.1,
      "coordNota": "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até 0,1 km.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "distEscolaKm": 20.09
    },
    {
      "id": "pev-33",
      "nome": "Jurema",
      "tipo": "pev",
      "endereco": "Rua Jacutinga, 470, Jurema, Guarulhos/SP",
      "bairro": "Jurema",
      "horario": "amplo 7h-19h",
      "horarioTexto": "Todos os dias, 7h às 19h",
      "aceita": [
        "entulho",
        "gesso",
        "solo",
        "moveis",
        "madeira",
        "poda",
        "eletrodomesticos",
        "oleo",
        "pneus",
        "papel",
        "plastico",
        "metal",
        "vidro"
      ],
      "naoAceita": [
        "pilha",
        "lampada",
        "comida"
      ],
      "naoConfirmado": [
        "celular",
        "roupa"
      ],
      "lat": -23.44986,
      "lng": -46.41752,
      "coordPrecisao": "numero",
      "coordIncertezaKm": 0,
      "coordNota": "Número encontrado no OpenStreetMap.",
      "status": "confirmado-fonte",
      "fonte": "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
      "atualizadoEm": "2025-10-10",
      "referencia": "esquina com Rua Guarapiranga",
      "distEscolaKm": 14.97
    }
  ];

  /* Locais de DOAÇÃO de roupas e alimentos.
     Ainda NÃO temos nenhum confirmado. Os 3 itens abaixo são MODELOS (status "exemplo"):
     nome fictício, sem endereço e sem coordenada. Substitua por locais confirmados por
     telefone/mensagem, no mesmo formato, trocando status para "confirmado-contato" e
     preenchendo "confirmadoEm" (data do contato) e "fonte" (com quem falaram). */
  var DOACAO = [
    { id: "doacao-exemplo-1", nome: "EXEMPLO: ponto de doação de roupas", tipo: "doacao", endereco: null, bairro: null, horario: null,
      aceita: ["roupa"], naoAceita: [], naoConfirmado: [], lat: null, lng: null, coordPrecisao: "sem", status: "exemplo",
      fonte: null, confirmadoEm: null, nota: "Modelo fictício. Não é um local real." },
    { id: "doacao-exemplo-2", nome: "EXEMPLO: banco de alimentos", tipo: "doacao", endereco: null, bairro: null, horario: null,
      aceita: ["comida"], naoAceita: [], naoConfirmado: [], lat: null, lng: null, coordPrecisao: "sem", status: "exemplo",
      fonte: null, confirmadoEm: null, nota: "Modelo fictício. Não é um local real." },
    { id: "doacao-exemplo-3", nome: "EXEMPLO: bazar beneficente", tipo: "doacao", endereco: null, bairro: null, horario: null,
      aceita: ["roupa"], naoAceita: [], naoConfirmado: [], lat: null, lng: null, coordPrecisao: "sem", status: "exemplo",
      fonte: null, confirmadoEm: null, nota: "Modelo fictício. Não é um local real." }
  ];

  var dados = {
    ESCOLA: ESCOLA,
    PONTOS: PONTOS,
    DOACAO: DOACAO,
    CATEGORIAS: CATEGORIAS,
    FONTE_PEV: "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/",
    AVISO: "Dados de PEV: Agência Mural, 10/10/2025; confirme horários e materiais com a Prefeitura de Guarulhos."
  };

  if (typeof module !== "undefined" && module.exports) { module.exports = dados; }
  if (raiz) { raiz.CICLO_PONTOS = dados; }
})(typeof window !== "undefined" ? window : null);
