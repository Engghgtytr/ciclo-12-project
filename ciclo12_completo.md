# CICLO 12 — Sistema com 4 módulos (App, Plataforma, Chatbot, Site)
**ODS 12 · Colégio Progresso, Guarulhos (Vila Galvão)**
Grupo: Enzo Penchel, Bárbara Valentina, Davi Biguetti, Julia Ayumi
Entrega: **quinta, 08/10/2026**. Este arquivo foi escrito na noite de terça, 06/10. Sobra **menos de 2 dias**.

> Esta versão substitui o `ciclo12_4_formatos.md`. Ela é maior, usa os dados reais de Guarulhos que você mandou (conferidos), e tem diagnóstico duro no começo. Você pediu pra esculachar, então esculachei.

---

## PARTE A — Diagnóstico duro (leia antes de abrir o Claude Code)

### A1. O que eu verifiquei dos dados que você colou (a outra IA errou coisas)

| O que a outra IA disse | O que eu achei | Veredito |
|---|---|---|
| Lista de 5 PEVs "mais próximos do colégio" | A lista oficial tem **33 PEVs**. Dois ficam **no próprio bairro da escola (Vila Galvão)**: "Timóteo Penteado" e "Vila Galvão". A outra IA **não citou nenhum dos dois** e listou PEVs de bairros longe | **Errado.** Lista inútil pro seu mapa |
| "Raio de 100 km" | 100 km cobre a Grande São Paulo inteira e mais. Mapa assim não ajuda ninguém | **Escopo sem sentido.** Use 5 a 10 km |
| PEV Gopoúva: "Rua Nadir, 34 (esquina com a Rua Guarulhos)" | A matéria do Agência Mural (10/10/2025) diz "**Rua Guarulhos, 34**, Gopoúva" | **Conflito.** Não use sem confirmar com a prefeitura |
| Paraventi "atende de domingo a domingo" | Mural diz horário ampliado das **7h às 19h** (seg a sáb, pelo menos pro Gopoúva). "Domingo" veio de um post de Facebook, que eu não consegui abrir | **Não confirmado.** Escreva "ligue antes" |
| PEVs recebem "eletrônicos, exceto pilhas e lâmpadas" | A matéria lista: entulho, gesso, solo, móveis, madeira, folhas, **eletrodomésticos**, óleo de cozinha, pneus, papel, plástico, metal, vidro. **Não cita eletrônicos pequenos, pilhas, lâmpadas, roupas, nem comida** | **Parcialmente não confirmado.** Eletrodoméstico sim. Celular e pilha: confirme |
| Cooperativas (Eco Guarulhos/ACRAT, Cooper Guaru), Flacipel (Estrada Dona Ana Diniz, 34, Cabuçu), Sucata Digital | Não verifiquei **nenhuma**. Vieram de Instagram e sites das próprias empresas | **Não verificado.** Ligue/mande mensagem antes de colocar no mapa |

Fontes que eu consegui abrir: [Agência Mural — Ecopontos de Guarulhos (10/10/2025)](https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/). Endereço do colégio: diretório [escol.as](https://www.escol.as/287199-progresso-colegio) (Av. Timóteo Penteado, 4405, Vila Galvão, CEP 07061-003). **Diretório de escolas não é fonte oficial, confirme com a secretaria da escola.**

### A2. O maior buraco do projeto (e ninguém falou)

**Os PEVs de Guarulhos não recebem roupa nem comida.** Dos 5 problemas, só 3 têm ponto de descarte público confirmado (lixo eletrônico em parte, reciclagem geral, óleo). Os problemas de **alimentos** e **roupas** dependem de ponto de doação (ONG, igreja, banco de alimentos, brechó), e **ninguém no grupo achou nenhum ainda**.

Se o professor perguntar "onde exatamente eu levo a camiseta?", e o mapa mostra um PEV que não aceita roupa, o grupo toma uma queda feia. Solução: **ligar ou mandar mensagem para 3 a 5 locais de doação perto da escola** e confirmar o que aceitam. Se não conseguirem até quinta, o mapa mostra esses pontos como **"EXEMPLO — a confirmar"** e vocês assumem isso na fala.

### A3. Os pontos fracos do grupo (sem açúcar)

1. **Escopo.** 4 sistemas em 2 dias, por 4 alunos que, até agora, não construíram nenhum. Se o plano for "perfeito", vai dar errado. O plano certo é **pequeno e funcionando**.
2. **Você acha que "tem que funcionar" significa "tem que ser real".** Não. Significa **ser demonstrável sem travar**. Um bot por regras que responde 40 coisas direito vale mais que um "bot de IA" que cai na hora da demo.
3. **Dependência de uma pessoa só.** Hoje o Enzo constrói tudo. Se o Enzo errar, adoecer ou perder o notebook, acabou. Os outros 3 precisam ter **tarefas reais** (coletar pontos, escrever textos do bot, testar, fazer os slides).
4. **Dados inventados ou "chutados".** Metas como "500 peças" e "50 pontos" são **suposição do grupo**. Em slide, escrever "meta do grupo". Nunca como se fosse dado.
5. **Ainda faltam duas informações do próprio enunciado**: os nomes dos modelos de processo (as palavras em negrito sumiram quando vocês colaram) e a turma. Assumi Scrum. Se o professor mandou outro (Cascata, Kanban, XP), o slide 6 precisa mudar.
6. **Pitch de 5 minutos com 4 produtos é perigoso.** 8 slides em 5 minutos = 37 segundos por slide. Se cada integrante tentar explicar um produto inteiro, estoura o tempo. Vocês vão **mostrar** (demonstração rápida), não **explicar**.
7. **Risco de plágio/identidade.** Não copiem nome, logo ou visual do WhatsApp, de apps reais ou das empresas da tabela da outra IA (EcoPrato, E-Trash, ZapRecicla, WattLess, Repassa...). Alguns nomes da tabela podem ser **marcas reais**. Usem nomes próprios (Ciclo Ponto, Ciclo Prato, Ciclo Bot, Ciclo Consumo).

### A4. Como eu leio o pedido do professor (confirme com ele numa frase)

Você me disse duas coisas diferentes:
- (a) "tem que ser um app, com mapa de descarte, link mostrando os problemas, site HTML, sistema web";
- (b) "app, plataforma, site e chatbot cobrindo os 5 problemas".

Minha leitura: **um sistema só ("Ciclo 12") com 4 módulos**. É o que você confirmou ("faz os 4 com todos os módulos"). Mande para o professor, hoje ou amanhã cedo: *"Podemos entregar o Ciclo 12 como um sistema com 4 módulos (app, plataforma, chatbot e site), todos acessíveis por links, sendo o app instalável no celular?"* Uma resposta dele evita um retrabalho de um dia inteiro.

---

## PARTE B — Dados reais de Guarulhos (com status de verificação)

### B1. Colégio (centro do mapa)
- Colégio Progresso — Av. Timóteo Penteado, 4405, Vila Galvão, Guarulhos/SP (CEP 07061-003). **Confirmar na secretaria.**

### B2. PEVs oficiais (fonte: Agência Mural, 10/10/2025) — 33 pontos
**Horário ampliado (7h às 19h)**
1. Paraventi — Rua Apolônia Vieira de Jesus, 91, Jardim Leila
2. Gopoúva — Rua Guarulhos, 34, Gopoúva (**conflito de endereço**, ver A1)
3. Continental — Rua Valdimiro Laurentino Pêssoa, 655, Parque Continental II
4. Torres Tibagy — Rua Ouvidor, 337, Parque Santo Antonio
5. **Timóteo Penteado — Avenida Faustino Ramalho, 977, Vila Galvão** ⟵ *mesmo bairro da escola*
6. Iporanga — Rua Adélia Sadalla, 166, Jd. Luciara
7. Cabrália — Rua Cabrália, 100, Jd. Bela Vista
8. Santos Dumont — Estrada do Saboó, 795, Santos Dumont
9. Presidente Dutra — Avenida João Bassi, 707, Jd. Presidente Dutra

**Horário regular (seg a sex 8h15–16h; sáb 8h15–15h30)**
10. Bom Clima — Rua João Bernardo de Medeiros, 800
11. Macedo — Rua Soldado Estanislau Wojcik, 26, Vila Sant'Anna
12. Ponte Grande — Alameda Josefina L. Zamataro, 233, Vila Zamataro
13. Vila Barros — Rua Guilherme Lino dos Santos, 349, Jardim Flor do Campo
14. **Vila Galvão — Rua Ipiranga, 543, Vila Galvão** ⟵ *mesmo bairro da escola*
15. Cabuçu — Av. Pedro de Souza Lopes (altura do nº 7800)
16. Vila Rio — Av. Benjamin Harris Hunnicutt, 1509, Vila Rio
17. Rosa de França — Rua Nestor Cabral, 61, Jd. Rosa de França
18. Mikail — Rua Justiniano Salvador dos Santos, 269, Parque Mikail
19. Adriana — Rua Walter Pereira de Lima, 105, Vila Sítio dos Morros
20. Fortaleza — Rua Medeia Escardino Mariano, 311, Jardim Fortaleza
21. Haroldo Veloso — Rua Campos Gerais, 163, Haroldo Veloso
22. Bondança — Rua Ivan Edmundo Scarameli, 62, Jardim Bondança
23. Lavras — Av. José Brumati, 1857, Lavras
24. Cidade Soimco — Rua Bento Gonçalves, s/nº, Cidade Soimco
25. INOCOOP — Av. Francisco Xavier Correia, 489, Residencial Parque Cumbica
26. Jardim Cumbica — Av. Berinepe, 99, Jardim Cumbica
27. Favela 3D — Rua São Martinho, 375, Cidade Satélite
28. Pimentas — Rua Itália, 13, Parque das Nações
29. Leblon — Rua Araci, 188, Jardim Leblon
30. Ponte Alta — Rua Zeferino Alves de Oliveira, 530, Ponte Alta I
31. Nova Bonsucesso — Rua Remanso esquina com Viela Urga, Vila Nova Bonsucesso
32. Álamo — Rua Gentil da Silva Leite Filho, 15, Jd. Álamo
33. Jurema — Rua Jacutinga, 470, Jurema

**Aceitam (segundo a matéria):** entulho, gesso, solo, móveis, madeira, folhas/poda, eletrodomésticos, óleo de cozinha, pneus, papel, plástico, metal, vidro. A matéria manda consultar o site oficial da prefeitura para os limites de quantidade.

**Não confirmado:** celular, pilha, lâmpada, roupa, comida. Marque como "confirmar".
**Coordenadas (latitude/longitude): eu NÃO tenho.** O Claude Code deve geocodificar os endereços e **vocês conferem cada um no Google Maps** antes da demonstração. Ponto no lugar errado é erro visível.

### B3. Destinação final (não verificado, só pode ir como "parceiros possíveis — confirmar")
Cooperativa Eco Guarulhos/ACRAT, Cooper Guaru, Flacipel (Cabuçu), Sucata Digital. **Ligue ou mande mensagem para cada uma** perguntando: aceita pessoa física? Horário? Cobra? Se não responderem até quarta, não aparece como "parceiro confirmado" nos slides.

### B4. O que vocês precisam coletar até quarta (tarefa da Bárbara e da Julia)
| Tarefa | Quem | Resultado |
|---|---|---|
| Ligar/mensagem para os 2 PEVs do bairro (e a Prefeitura) e perguntar: aceita celular, pilha, lâmpada? horário real? | Julia | Tabela "aceita / não aceita / confirmado em dd/mm" |
| Achar 3 a 5 pontos de **doação de roupa** perto da escola e confirmar | Bárbara | Lista com nome, endereço, o que aceita, contato |
| Achar 2 a 3 pontos de **doação de alimento** (banco de alimentos, ONG, igreja) e confirmar | Bárbara | Idem |
| Confirmar endereço da escola e aprovação do nome do projeto | Julia | OK por escrito |
| Pesquisar 3 a 5 dados **de Guarulhos** (coleta seletiva, resíduos por habitante, etc.) com fonte oficial | Davi | Lista "dado + fonte + link + data". **Nada sem fonte** |

---

## PARTE C — Arquitetura do sistema (1 sistema, 4 módulos)

```
                    ┌──────────────────────────┐
                    │  HUB  (index.html)        │  ← "link mostrando os problemas"
                    │  5 problemas + 4 módulos  │
                    └─────────────┬────────────┘
        ┌───────────────┬─────────┴────────┬────────────────┐
┌───────▼──────┐ ┌──────▼───────┐ ┌────────▼─────┐ ┌────────▼─────┐
│ APP (PWA)    │ │ PLATAFORMA   │ │ CHATBOT      │ │ SITE         │
│ Ciclo Ponto  │ │ Ciclo Prato  │ │ Ciclo Bot    │ │ Ciclo Consumo│
│ e-lixo +     │ │ alimentos    │ │ reciclagem   │ │ água/energia │
│ roupas       │ │ (login+banco)│ │ (regras)     │ │ (estático)   │
└───────┬──────┘ └──────────────┘ └──────┬───────┘ └──────────────┘
        └───────── shared/pontos.js ──────┘   ← uma lista de pontos para app, mapa do hub e bot
```

- **Uma fonte de dados de pontos** (`shared/pontos.js`) usada pelo app, pelo mapa do hub e pelo chatbot. Quando o bot responde "o PEV mais perto é...", ele lê o mesmo arquivo do mapa. Isso é o que faz parecer **um sistema**, não 4 trabalhos soltos.
- **Hospedagem:** GitHub Pages (grátis, HTTPS). Em conta gratuita, normalmente o repositório precisa ser público: **não ponha nenhuma senha ou chave secreta no repositório**.
- **Plataforma:** Supabase (login + banco), com a chave pública "anon" no código e segurança por RLS. A chave "service_role" **nunca** vai para o código nem para o chat. Pelo que sei, projetos gratuitos do Supabase podem ser pausados após um período sem uso: **abra o projeto na quarta à noite para garantir que está ativo** e verifique a política atual.

### Definições do professor aplicadas (o que deve existir em cada módulo)

| Módulo | Definição do professor | Requisito **mínimo** para merecer o nome |
|---|---|---|
| App | câmera, GPS, notificações | GPS ordenando pontos + câmera capturando foto do item + lembrete (notificação) + instalável |
| Plataforma | troca/doação/comércio em larga escala, vários perfis, painel de dados | 3 perfis (doador, receptor, admin) + login real + fluxo de doação com status + dashboard |
| Site | conteúdo, informação, mapas estáticos, cadastros simples | Texto com fonte + gráfico + calculadora + cadastro simples (sem login) |
| Chatbot | (conversa de dúvidas, extra da outra IA) | ≥ 40 itens, tolera erro de digitação, fallback, usa a lista de pontos |

---

## PARTE D — Requisitos por módulo (RF = funcional, RNF = não funcional)

### D1. Hub
- RF01 Mostrar os 5 problemas, cada um com 1 dado e fonte visível.
- RF02 Link/aba "Problemas" com gráficos (é o "link mostrando os problemas").
- RF03 Mapa de descarte (Leaflet + OpenStreetMap) com os pontos de `shared/pontos.js`, filtro por categoria e marcador da escola.
- RF04 Botões para os 4 módulos.
- RNF Funcionar em 390 px, modo escuro, abrir em < 3 s em 4G, sem erro de console.

### D2. App — Ciclo Ponto (lixo eletrônico + roupas/objetos)
- RF01 Lista e mapa de pontos; botão "perto de mim" (GPS, ordena por distância).
- RF02 Cadastro de item com **foto da câmera**, nome, categoria, estado, ação (doar, trocar, descartar).
- RF03 "Meus itens" persiste ao recarregar.
- RF04 Lembrete local (notificação) agendado pelo usuário.
- RF05 Dicas de preparo (apagar dados do celular antes de descartar; limpar roupa antes de doar).
- RNF Instalável (manifest + service worker), funciona offline no básico, HTTPS, permissão negada tratada sem quebrar.
- **Limite honesto:** push de verdade (servidor enviando para o celular) não entra. É notificação local. No iPhone, pelo que sei, notificação de web app exige instalar na tela inicial e uma versão recente do iOS: **teste num iPhone real se alguém do grupo tiver; se não, diga que testou só em Android.**

### D3. Plataforma — Ciclo Prato (alimentos)
- RF01 Cadastro/login com perfil (doador, receptor). Admin é criado manualmente por vocês.
- RF02 Doador publica doação (alimento, kg, validade, bairro, horário de retirada).
- RF03 Receptor vê somente doações disponíveis e não vencidas; reserva.
- RF04 Doador confirma retirada; status: disponível → reservada → retirada | expirada.
- RF05 Dashboard: kg doados, doações por status, por semana, ranking de doadores.
- RF06 Admin aprova receptor.
- RNF RLS ativo; validação no front e no banco; dados pessoais mínimos (não coletar CPF, não mostrar endereço completo antes da reserva).
- **Segurança alimentar:** a plataforma não "garante" que o alimento está bom. Texto na tela: "alimentos perecíveis seguem regras sanitárias; combine a retirada e confira a validade". Isso é questão de responsabilidade real, não enfeite. Se o professor perguntar, a resposta é essa.
- **Risco real:** sem receptores verdadeiros (ONG), a plataforma tem só usuários de teste. Diga isso no pitch: "validado com usuários de teste; próximo passo: parceria com banco de alimentos".

### D4. Chatbot — Ciclo Bot (informação sobre reciclagem)
- RF01 Responder ≥ 40 itens com: onde descartar, cor da lixeira (CONAMA 275/2001), dica de redução.
- RF02 Pergunta "onde levo X?" devolve **o PEV mais perto da escola** a partir de `shared/pontos.js` quando o item é aceito, e "confirme" quando não for.
- RF03 Tolerar erro de digitação e sinônimo.
- RF04 Fallback com 3 sugestões; menu de botões.
- RF05 Link do bot no hub e no app.
- RNF Offline, sem API externa, sem chave. Nunca afirmar regra que não esteja confirmada; usar "confirme com a prefeitura".
- **Limite honesto:** é um bot por regras e não "IA". O WhatsApp oficial usa a API da Meta. A documentação diz que o número de teste permite adicionar **até 5 destinatários**, e que para usar número próprio você cria uma conta WhatsApp Business real; **não consegui confirmar todos os requisitos de verificação**. Trate como "próximo passo", não como entrega.

### D5. Site — Ciclo Consumo (água e energia)
- RF01 Dados com fonte: SNIS (154 L/dia/pessoa) vs ONU (110 L). Dado do chuveiro elétrico (Unicamp, ~23% do consumo residencial): **confirme a fonte antes de citar**.
- RF02 Calculadora do banho (min, pessoas, potência, preço do kWh).
- RF03 Gráfico comparativo em SVG.
- RF04 10 dicas práticas.
- RF05 Cadastro simples de "receber dicas" (dados só no navegador, com aviso).
- RNF Estático, 390 px, modo escuro.

---

## PARTE E — Cronograma até quinta (realista, com linha de corte)

Hoje: terça 06/10, 23h. Quinta (08/10): entrega.

| Quando | Entrega | Quem | Se atrasar |
|---|---|---|---|
| **Terça, antes de dormir** | Prompt 0 e Prompt 1 (estrutura + hub + dados). Mandar a pergunta ao professor | Enzo + Davi | Corta nada ainda |
| Quarta 8h–10h | Prompt 2 (site) e Prompt 3 (chatbot) | Enzo (Davi revisa o texto do bot) | O site é o mais fácil: não pode atrasar |
| Quarta 8h–13h | Coleta de pontos reais e confirmação por telefone/mensagem | Bárbara + Julia | Pontos não confirmados viram "EXEMPLO" |
| Quarta 10h–15h | Prompt 4 (app PWA) | Enzo | **Linha de corte 1:** sem a notificação, mas GPS e câmera ficam |
| Quarta 15h–20h | Prompt 5 (plataforma) | Enzo + Davi | **Linha de corte 2:** vira plano B (dados no navegador) com aviso na tela |
| Quarta 18h–22h | Slides no Canva + gráfico + logo | Bárbara + Julia | Slides 1 a 5 primeiro |
| Quarta 22h | Prompt 6 (testes de ponta a ponta) | Todos testam no celular | Corrige só bug que quebra a demo |
| Quinta cedo | Ensaio cronometrado (2×) + backup (vídeo gravado da demo) | Todos | — |

**Regra de ouro:** às 22h de quarta, **congela**. Não se mexe mais em código. Qualquer "só mais uma coisinha" depois disso é a causa nº 1 de demo quebrada.

**Backup obrigatório:** grave um vídeo de 1 a 2 minutos do sistema funcionando (celular gravando a tela). Se o Wi-Fi da escola cair, vocês passam o vídeo. Sem backup, vocês dependem da internet da escola, e isso é irresponsabilidade.

---

## PARTE F — Pitch: 8 slides, 5 minutos (conteúdo pronto)

Estrutura do professor: capa; problema + dado + gráfico; beneficiários; nome/tipo/o que faz; funções (lista/diagrama); modelo de processo + requisitos; metas da ODS 12; impacto + próximos passos + referências. Mais: logo, ao menos 1 gráfico, imagens/ícones.

| # | Slide | Conteúdo concreto | Quem fala | Tempo |
|---|---|---|---|---|
| 1 | **Capa** | "Ciclo 12 — um ciclo para cada problema." Nomes do grupo, Colégio Progresso, turma (**preencher**), ODS 12 | Enzo | 20s |
| 2 | **Problema + dados + gráfico** | 5 problemas, cada um com 1 número com fonte: 1,05 bi t de comida (PNUMA 2024), 62 mi t de lixo eletrônico e 22,3% reciclado (Global E-waste Monitor 2024), 4% de reciclagem no Brasil (Abrema), 154 L vs 110 L de água (SNIS/ONU), 73% das roupas para aterro/incineração (Ellen MacArthur 2017). **Gráfico:** barras horizontais ou rosca (ex.: reciclado × não reciclado) | Enzo | 50s |
| 3 | **Beneficiários** | Moradores de Guarulhos/alunos e famílias da escola; receptores (ONGs, bancos de alimentos); cooperativas de triagem; prefeitura (menos descarte irregular). Sem inventar números de pessoas atendidas | Bárbara | 25s |
| 4 | **Nome, tipo e o que faz** | Ciclo 12 = sistema com 4 módulos: App (Ciclo Ponto), Plataforma (Ciclo Prato), Chatbot (Ciclo Bot), Site (Ciclo Consumo). 1 frase cada | Bárbara | 35s |
| 5 | **Funções (diagrama)** | O diagrama da Parte C simplificado + 3 funções-chave por módulo. **Demonstração ao vivo de 45 s:** abrir o app, "perto de mim", tirar foto, ver o ponto no mapa; perguntar uma coisa ao bot | Davi | 70s |
| 6 | **Modelo de processo + requisitos** | Scrum (**confirmar**), papéis (PO Bárbara, Scrum Master Davi, time: Enzo, Julia), 5 sprints curtos, RF e RNF resumidos (Parte D) | Davi | 35s |
| 7 | **Metas da ODS 12** | 12.2 uso eficiente de recursos naturais, 12.3 reduzir desperdício de alimentos, 12.5 reduzir geração de resíduos (prevenção, reciclagem, reuso), 12.8 informação e conscientização. **Cada meta ligada a um módulo** | Julia | 35s |
| 8 | **Impacto + próximos passos + referências** | Impacto esperado (descrito como "meta do grupo", não como resultado), próximos passos: WhatsApp oficial (Meta), publicar na loja, parceria com banco de alimentos e prefeitura, notificação push, validação de pontos. Referências curtas + QR para o hub | Julia | 30s |

Total ≈ 5 min 00 s. **Se passar de 5 min, corte do slide 3 e do slide 6, nunca da demonstração.**

**Identidade visual:** verde (reciclagem) + um tom de destaque, 1 logo simples de 2 setas formando ciclo (desenhem do zero; não usem o símbolo de reciclagem registrado de nenhuma marca), fonte limpa, ícones próprios. Mesmo visual no sistema e nos slides.

---

## PARTE G — As 12 perguntas que o professor pode fazer (e a resposta honesta)

1. **"Por que isso é um app e não um site?"** Usa GPS, câmera e notificação e é instalável. (Se isso não estiver funcionando na demo, a resposta cai.)
2. **"Isso funciona de verdade?"** Funciona como protótipo: o site, o bot e o app rodam num link; a plataforma roda com banco real e usuários de teste. O que não está feito: WhatsApp oficial e publicação na loja, que dependem de aprovação.
3. **"Esses pontos no mapa são reais?"** Os PEVs vêm da lista pública da prefeitura (matéria de 10/10/2025) e foram conferidos; pontos de doação foram confirmados por contato em [data] / ou estão marcados como exemplo.
4. **"De onde vem esse número?"** Cada dado tem fonte no slide. Metas do grupo estão marcadas como metas.
5. **"Quem usaria a plataforma de alimentos?"** Doadores (mercados, padarias, famílias) e receptores (ONGs, bancos de alimentos). Validamos com usuários de teste; parceria real é o próximo passo.
6. **"E se o alimento estiver estragado?"** A plataforma exige validade, mostra aviso sanitário e a retirada é combinada. Não substitui a vigilância sanitária.
7. **"Isso é IA?"** O chatbot não. É por regras. IA exigiria servidor e custo; está nos próximos passos.
8. **"Que dados pessoais vocês guardam?"** Mínimo: e-mail e nome. Nada de CPF. No site e no app, os dados ficam no navegador do usuário. (LGPD: citem que o próximo passo é política de privacidade.)
9. **"Por que 4 formatos?"** Cada problema pede um tipo de solução diferente (definição do professor): informação → site; dúvidas → chatbot; coleta com localização → app; troca em escala com vários perfis → plataforma.
10. **"Quem fez o quê?"** (Responda com a tabela da Parte E; todos precisam conhecer o sistema inteiro.)
11. **"O que quebra se muita gente usar?"** O plano gratuito do banco tem limites; está no próximo passo escalar e pedir parceria da prefeitura.
12. **"Qual o impacto real?"** Hoje: protótipo e conscientização. Impacto medido só vem após uso real; as metas do grupo são ponto de partida.

---

## PARTE H — Prompts para o Claude Code (cole na ordem)

**Antes de tudo:**
1. Crie a pasta `ciclo12` e abra o terminal nela.
2. Baixe o `index.html` do "Ciclo 12" que eu te mandei antes e salve em `ciclo12/_referencia/ciclo12_antigo.html`. **Meus prompts antigos apontavam para `/home/claude/...`: esse caminho só existe no meu ambiente, não no seu PC. Use o arquivo local.**
3. Salve em `ciclo12/_dados/` uma cópia da Parte B deste arquivo como `pevs_guarulhos.md` (cole o texto).
4. Rode `claude` e cole um prompt por vez. Depois de cada um, **abra o resultado no navegador e no celular** antes de seguir.

### PROMPT 0 — Contexto e estrutura

```
Você vai me ajudar a construir um trabalho escolar de ODS 12 (Consumo e Produção Responsáveis). Grupo: Enzo Penchel, Bárbara Valentina, Davi Biguetti e Julia Ayumi, do Colégio Progresso (Av. Timóteo Penteado, 4405, Vila Galvão, Guarulhos/SP). Entrega: 08/10/2026. Vou apresentar um pitch de 5 minutos, então o sistema precisa FUNCIONAR numa demonstração, via link e no celular.

PROJETO: "Ciclo 12", UM sistema com 4 módulos que, juntos, cobrem 5 problemas:
1) HUB (index.html): mostra os 5 problemas com dados e fonte, mapa de descarte e links para os módulos.
2) APP (PWA instalável) "Ciclo Ponto": lixo eletrônico + roupas/objetos reutilizáveis. DEVE usar GPS e câmera e notificação local (é o que define app para o meu professor).
3) PLATAFORMA "Ciclo Prato": desperdício de alimentos. DEVE ter login real, 3 perfis (doador, receptor, admin), fluxo de doação com status e dashboard.
4) CHATBOT "Ciclo Bot": informação sobre reciclagem, por regras, offline, sem chave de API.
5) SITE "Ciclo Consumo": consumo de água e energia, estático (conteúdo, calculadora, gráfico, cadastro simples).

REGRAS GERAIS (siga sempre):
- Português do Brasil na interface e nos comentários.
- HTML/CSS/JS puro, sem build e sem framework, para GitHub Pages. Única dependência externa permitida: Leaflet (cdnjs) e, só na plataforma, o cliente do Supabase via CDN.
- Estrutura: /index.html (hub), /app/, /plataforma/, /chatbot/, /site/, /shared/ (estilo.css, pontos.js, logo.svg). CSS e dados em comum ficam em /shared/.
- Identidade: verde/reciclagem, logo e ícones SVG próprios (NÃO copie logos ou visual de marcas reais; o chatbot NÃO pode imitar o WhatsApp). Modo claro e escuro (prefers-color-scheme). Mobile-first: teste em 390 px, sem rolagem horizontal.
- Acessibilidade básica: labels, foco visível, contraste, botões com texto.
- Segurança: nunca innerHTML com texto de usuário (use textContent ou escape). Nenhuma chave secreta no código. localStorage sempre dentro de try/catch.
- HONESTIDADE DE DADOS: não invente estatística, endereço, horário, telefone nem coordenadas. Dado sem fonte = TODO visível e me avise. Dado de exemplo = rótulo "EXEMPLO" na tela. Ponto de coleta não confirmado = rótulo "a confirmar".
- Dados verificados que PODEM ser usados, com fonte: PNUMA Food Waste Index 2024 (1,05 bilhão de toneladas/ano; 60% em domicílios); Global E-waste Monitor 2024 (62 milhões de toneladas; 22,3% reciclado); Abrema/Datafolha (4% de reciclagem no Brasil); SNIS (154 L/dia/pessoa) vs 110 L/dia recomendado pela ONU; Ellen MacArthur Foundation 2017 (73% das roupas vão para aterro ou incineração); Abrelpe (cerca de 4 milhões de toneladas de resíduos têxteis, confirme a fonte antes de citar).
- Antes de dizer que terminou qualquer etapa: rode, abra no navegador (Playwright se precisar), clique nas funções principais e me diga o que PASSOU e o que FALHOU. Nunca diga que funciona sem ter testado. Se algo não puder ser testado sem aparelho real (câmera, instalação, notificação no iPhone), diga.
- Eu sou iniciante: explique em português simples o que fez e faça commits pequenos.
- Se uma decisão for ambígua, PERGUNTE antes de chutar.
- Se eu pedir algo que enfraqueça a segurança ou invente dado, avise e proponha alternativa.

TAREFA AGORA (sem escrever funcionalidades ainda):
a) Crie a árvore de pastas.
b) Crie shared/estilo.css com variáveis de cor (claro/escuro), tipografia, botão, cartão, abas, formulário, aviso (caixas "EXEMPLO" e "a confirmar").
c) Crie shared/logo.svg (duas setas formando um ciclo, desenho próprio) e favicon.
d) Crie README.md com descrição, como rodar localmente (python -m http.server), como publicar no GitHub Pages e a lista de módulos.
e) Mostre a árvore e me pergunte se posso seguir.
```

### PROMPT 1 — Dados de pontos + Hub

```
Etapa 1: dados dos pontos e HUB.

PARTE 1: shared/pontos.js
Leia _dados/pevs_guarulhos.md. Crie shared/pontos.js exportando um array "PONTOS" com 1 objeto por PEV (33 no total), com os campos: id, nome, tipo ("pev"), endereco, bairro, horario ("amplo 7h-19h" ou "regular seg-sex 8h15-16h, sáb 8h15-15h30"), aceita (array: "entulho","gesso","solo","moveis","madeira","poda","eletrodomesticos","oleo","pneus","papel","plastico","metal","vidro"), naoConfirmado (array: "celular","pilha","lampada","roupa","comida"), lat, lng, status ("confirmado-fonte" | "conflito" | "exemplo"), fonte, atualizadoEm ("2025-10-10").
- Marque PEV Gopoúva com status "conflito" e nota explicando que duas fontes divergem (Rua Guarulhos, 34 vs Rua Nadir, 34).
- lat/lng: NÃO invente. Faça geocodificação de cada endereço (por exemplo com o Nominatim do OpenStreetMap via script local, com pausa de 1 s entre chamadas e identificando o app no User-Agent) e grave num arquivo _dados/geocodificacao.json com o resultado bruto e o grau de confiança. Se algum endereço não for achado com confiança, deixe lat/lng como null e liste para eu conferir manualmente. Depois me mostre uma tabela: endereço, lat/lng encontrado, confiança.
- Adicione também "ESCOLA" (Colégio Progresso, Av. Timóteo Penteado, 4405, Vila Galvão) como ponto de referência separado (tipo "escola"), com a mesma regra de coordenadas.
- Adicione um segundo array "DOACAO" para locais de doação de roupas e alimentos, mas VAZIO por enquanto com 3 itens de modelo rotulados status "exemplo" (nome fictício e claramente marcado como EXEMPLO, sem endereço real inventado). Eu vou preencher com locais confirmados. Deixe um comentário explicando o formato.
- Crie shared/pontos.js de forma que funcione em <script> comum (window.CICLO_PONTOS = {...}) e também com import em módulo se for preciso.
- Crie _dados/COLETAR.md com a tabela das pendências (pontos de doação, confirmação de pilhas/lâmpadas/celular nos 2 PEVs de Vila Galvão: "Timóteo Penteado" e "Vila Galvão", horário real).

PARTE 2: HUB (index.html)
1) Início: título "Ciclo 12", uma frase de propósito, os 5 problemas em cartões (1 dado + fonte cada, com link) e 4 botões grandes dos módulos (App, Plataforma, Chatbot, Site) dizendo qual problema cada um resolve.
2) Página/aba "Problemas": os 5 problemas com dado, gráfico em SVG sem biblioteca (pelo menos 2 gráficos), explicação em 2 a 3 frases e a meta da ODS 12 relacionada (12.2, 12.3, 12.5, 12.8).
3) Aba "Mapa de descarte": Leaflet + OpenStreetMap centrado na escola, marcador da escola, marcadores dos PEVs de shared/pontos.js, filtro por tipo de material aceito, lista lateral, e botão "pontos perto de mim" (geolocalização com tratamento de recusa). Cada ponto mostra horário, o que aceita, o que "precisa confirmar" e a etiqueta de status (confirmado / conflito / exemplo). Destaque os 2 PEVs de Vila Galvão por serem os mais próximos da escola (calcule a distância por Haversine, não use "perto" sem número).
4) Rodapé: referências (lista de fontes com link), nomes do grupo, aviso "Dados de PEV: Agência Mural, 10/10/2025; confirme horários e materiais com a Prefeitura de Guarulhos".
5) Se o tile do mapa não carregar (sem internet), mostre aviso claro e a lista continua funcionando.

TESTES: Playwright com bloqueio de rede para os tiles, 390 px e 1280 px, conferir: 33 PEVs + escola listados, filtro funciona, ordenar por distância funciona, sem erros de console, sem rolagem horizontal. Mostre os resultados e prints.
```

### PROMPT 2 — Site "Ciclo Consumo"

```
Etapa 2: SITE em /site/index.html. Definição do meu professor: site = conteúdo, informação, mapas estáticos, cadastros simples. Sem login, sem banco.

Seções:
1) Cabeçalho com logo "Ciclo Consumo" e link para o hub.
2) "O problema": consumo médio de água no Brasil 154 L/dia/pessoa (SNIS) vs 110 L/dia (ONU), com link da fonte. Sobre o chuveiro elétrico (cerca de 23% do consumo residencial, estimativa citada de pesquisa da Unicamp): tente confirmar a fonte na web ANTES de usar; se não confirmar, use "estimativa citada em fonte secundária" e me avise.
3) Gráfico em SVG (sem biblioteca) comparando 154 L vs 110 L e, na calculadora, o consumo do usuário.
4) Calculadora do banho: minutos, pessoas na casa, potência do chuveiro (0 gás/solar, 4000 W, 5500 W), preço do kWh (editável; valor inicial marcado "ajuste pela sua conta de luz", sem inventar tarifa), vazão em L/min (padrão 9 L/min editável, com explicação). Saídas: litros/dia, % da meta da ONU, kWh/mês, custo/mês, economia ao reduzir 5 min. Mostre as fórmulas numa seção "Como calculamos".
5) 10 dicas práticas em cartões.
6) Cadastro simples "Receber dicas": nome + e-mail com validação. Aviso fixo: no protótipo os dados ficam só neste navegador (localStorage em try/catch) e não são enviados.
7) Referências.

TESTES: 15 min, 3 pessoas, 4000 W, kWh = 1,00 (valor de teste): confira a conta na mão e me mostre. Teste 390 px, escuro, sem erro de console. Valide e-mail inválido, minutos zero, campos negativos e vazios.
```

### PROMPT 3 — Chatbot "Ciclo Bot"

```
Etapa 3: CHATBOT em /chatbot/index.html. Visual de conversa com identidade própria do Ciclo 12 (NÃO copie o WhatsApp). Por regras, offline, sem API.

CONHECIMENTO (arquivo /chatbot/conhecimento.js):
- Pelo menos 40 itens, cada um com: id, nome, palavras (sinônimos e variações), resposta curta, ondeDescartar, lixeira (cor da coleta seletiva CONAMA 275/2001 quando aplicável: azul papel, vermelho plástico, verde vidro, amarelo metal, preto madeira, laranja resíduos perigosos, branco serviços de saúde, roxo radioativos, marrom orgânicos, cinza não reciclável), dicaReducao, confianca ("confirmado" ou "confirme com a prefeitura"), e "tipoPonto" ligando ao filtro de shared/pontos.js ("pev", "doacao", "varejo", "nenhum").
- Cubra: celular, carregador, notebook, TV, pilha, bateria, lâmpada, eletrodoméstico, fio/cabo, roupa em bom estado, roupa rasgada, calçado, cobertor, brinquedo, livro, móvel, óleo de cozinha, vidro, papelão, papel engordurado, caixa de pizza, plástico, garrafa PET, isopor, lata, alumínio, embalagem longa vida, medicamento vencido, tinta, entulho, restos de poda, resto de comida/compostagem, pneu, esponja, fralda, espelho, cerâmica, etc.
- Onde NÃO houver regra confirmada, escreva "confirme com a Prefeitura de Guarulhos" e NÃO afirme. Em especial: pilha, lâmpada, celular, roupa e comida NÃO estão confirmados como aceitos nos PEVs (a lista de materiais da matéria não cita esses itens); trate como "confirme".

LÓGICA:
1) Normalizar texto (minúsculas, sem acento, sem pontuação) e tolerar erro de digitação com distância de edição pequena. Testar: "bateia de selular", "ola", "pilhaa", "camizeta".
2) Pontuação por palavra-chave; se a melhor pontuação for baixa, perguntar "você quis dizer...?" com 2 opções.
3) Quando o item for aceito em PEV, usar window.CICLO_PONTOS para mostrar o PEV MAIS PRÓXIMO DA ESCOLA que está com status confirmado, com bairro, horário e distância calculada. Se o usuário permitir a localização, usar a posição dele. Se o item é "confirme", não indicar PEV como certo.
4) Fallback com 3 sugestões. Menu de botões (Eletrônicos, Roupas, Cozinha/óleo, Lixeira por cor, Alimentos, ODS 12, Onde fica o ponto mais perto).
5) UX: balões, "digitando..." 400 ms, rolagem automática, Enter envia, botão "Limpar conversa", histórico só na tela.
6) Painel "Como funciona": é um bot por regras; a versão oficial no WhatsApp é próximo passo (depende da Meta).
7) Segurança: textContent sempre.

TESTES (Playwright): 25 perguntas incluindo erros de digitação, pergunta sem sentido, tentativa de injetar <script> e <img onerror>. Mostre a tabela pergunta → resposta → acertou? Corrija os erros. Conte quantos itens têm confianca="confirmado" vs "confirme" e me diga.
```

### PROMPT 4 — App PWA "Ciclo Ponto"

```
Etapa 4: APP "Ciclo Ponto" em /app/. Definição do meu professor: app usa câmera, GPS, notificações. PWA instalável em HTTPS (GitHub Pages).

1) PWA: manifest.json (nome, short_name, ícones 192 e 512 gerados como PNG a partir de um SVG próprio, theme_color, display standalone, start_url relativo ao /app/), service-worker.js com cache do app shell (e dos dados), estratégia que funcione no GitHub Pages em subpasta (cuidado com caminhos absolutos).
2) Navegação inferior: Pontos · Doar/Descartar · Meus itens · Avisos.
3) PONTOS: lista + mapa Leaflet, usando window.CICLO_PONTOS (PEVs) e DOACAO (locais de doação de roupa/objeto; rotular EXEMPLO onde não confirmado). Botão "perto de mim": geolocation, Haversine, ordena por distância, mostra "a X km". Permissão negada: mensagem clara e mapa continua usável. Ponto de referência padrão: a escola.
4) DOAR/DESCARTAR: <input type="file" accept="image/*" capture="environment"> para foto do item; pré-visualização; redimensionar a no máximo 800 px (canvas) antes de salvar; campos nome, categoria (eletrônico, roupa, objeto), estado, ação (doar, trocar, descartar). Para categoria "eletrônico", mostrar checklist de segurança (apagar dados, tirar bateria se for removível, desligar contas). Para "roupa", checklist (lavar, boa condição). Ao salvar, sugerir o ponto adequado mais próximo, mas SÓ com os que aceitam o tipo e estão confirmados; senão mostrar "confirme antes de ir".
5) MEUS ITENS: lista com foto, editar status (pendente, entregue), apagar. Persistir em IndexedDB (fotos) com fallback para localStorage. Tratar falta de espaço e erro. Botão exportar/limpar dados.
6) AVISOS: "Ativar lembretes" (Notification.requestPermission), agendar lembrete local (ex.: escolher data/hora; use service worker showNotification; se o navegador não suportar agendamento, faça lembrete enquanto o app estiver aberto e AVISE a limitação). Explique em texto curto que push remoto com servidor é próximo passo. Esconder/avisar se não houver suporte.
7) Conteúdo: 2 cartões de contexto com fonte: lixo eletrônico (62 mi t; 22,3% reciclado; Global E-waste Monitor 2024) e roupas (73% em aterro/incineração; Ellen MacArthur 2017).
8) Link para o chatbot e para o hub.

TESTES (Playwright, com permissões simuladas): geolocalização falsa perto da escola (ordem muda), upload de foto simulando a câmera (aparece, redimensiona), item persiste após reload, lembrete dispara, funciona offline depois do 1º carregamento, manifest válido, sem erro de console, 390 px. Me liste claramente o que NÃO foi possível testar sem celular real (câmera física, instalação, iPhone) e me passe o passo a passo para testar no Android (Chrome → menu → Instalar app) e no iPhone (Safari → Compartilhar → Adicionar à Tela de Início).
```

### PROMPT 5 — Plataforma "Ciclo Prato"

```
Etapa 5: PLATAFORMA "Ciclo Prato" em /plataforma/. Definição do meu professor: plataforma = troca/doação/comércio em escala, vários perfis, painéis de dados.

ANTES DE CODAR, pergunte-me:
(a) Eu já tenho conta no Supabase (plano gratuito)? Se não, me guie passo a passo em português simples para criar o projeto, sem pedir que eu cole chaves secretas aqui. A chave pública "anon" pode ficar no código; a "service_role" NUNCA.
(b) Quero o plano B local (dados no navegador)?

PERFIS:
- DOADOR (mercado, padaria, restaurante, família): cria doações.
- RECEPTOR (ONG, banco de alimentos, igreja, projeto social): vê doações disponíveis, reserva, confirma retirada. Precisa ser aprovado por um admin antes de reservar.
- ADMIN (criado manualmente por nós no banco): aprova receptores, modera.

FLUXO: disponível → reservada (por receptor) → retirada (confirmada pelo doador) ou expirada (passou a validade; calcular na leitura).
DOAÇÃO: alimento, categoria, quantidade (kg > 0), validade (futura), bairro (não mostrar endereço completo antes da reserva), horário de retirada, observações, foto opcional.

BANCO (escreva o SQL completo e explique cada parte): tabelas profiles(id, perfil, nome, organizacao, aprovado), doacoes(...), reservas(...). Constraints (CHECK em kg e status). Row Level Security ATIVA com políticas: doador só vê/edita as próprias doações; receptor aprovado só lê disponíveis e não vencidas e só reserva disponível; ninguém lê dados privados de outros; admin lê tudo; ninguém altera "perfil" ou "aprovado" do próprio usuário. Explique o que cada política impede em frases simples.

SEGURANÇA: validar no front e no banco; escape de texto em tela; limites de tamanho; sem service_role; avisar sobre e-mail de confirmação do Supabase (explicar como configurar o redirecionamento para o GitHub Pages).

DASHBOARD: por perfil e geral (admin): kg doados, doações por status, doações por semana (gráfico de barras SVG), ranking de doadores (por apelido/organização), tempo médio até a reserva. "Refeições equivalentes": NÃO invente a conversão; deixe constante editável com valor TODO e rótulo "estimativa do grupo, a definir".

AVISO LEGAL NA TELA: "Esta plataforma intermedeia contato. Alimentos perecíveis seguem regras sanitárias; confira validade e condições. Protótipo escolar." Também texto curto de privacidade (que dados são guardados e por quê).

Contexto com fonte: PNUMA Food Waste Index 2024 (1,05 bi t/ano; 60% em domicílios).

PLANO B (só se eu pedir): mesma interface com dados em localStorage e usuários simulados, COM faixa fixa visível "DEMONSTRAÇÃO — dados só neste navegador".

TESTES: crie 3 usuários de teste (1 por perfil) e rode o fluxo completo com Playwright. Tente também burlar as regras: receptor editando doação; doador reservando a própria; usuário comum virando admin; receptor não aprovado reservando; doação vencida sendo reservada. Prove que o BANCO bloqueia. Liste o que não foi possível testar. No fim, me dê um roteiro de demonstração de 60 segundos para o pitch.
```

### PROMPT 6 — Integração, testes e publicação

```
Etapa 6: integração e fechamento.
1) Hub: confira que os 5 problemas e os 4 módulos estão ligados com links que funcionam (relativos, GitHub Pages em subpasta).
2) Consistência: mesmo CSS, logo, favicon, nomes (Ciclo Ponto, Ciclo Prato, Ciclo Bot, Ciclo Consumo) e mesmo rodapé em todos. O chatbot e o app usam shared/pontos.js.
3) Teste de ponta a ponta com Playwright em 390 px e 1280 px, claro e escuro: navegar por todas as páginas, clicar nas ações principais, procurar links quebrados, erros de console, imagens sem alt, formulários sem label.
4) Desempenho: tamanho total, tempo de carga simulando 4G lenta; diga o que está pesado.
5) Gere prints para os slides em /prints/: hub, mapa, app (pontos e foto), chatbot, plataforma (dashboard), site (calculadora), logo.
6) Gere /sobre.html com o diagrama do sistema (SVG), a lista de fontes (links) e "Próximos passos" (WhatsApp oficial via Meta, publicação em loja, push remoto, parceria com banco de alimentos e prefeitura, política de privacidade, validação com usuários reais).
7) Passo a passo (para iniciante, Windows) de publicar no GitHub Pages: criar repositório público, enviar os arquivos, Settings → Pages → branch main. Diga o link final esperado. NÃO coloque nenhuma chave secreta no repositório; confira por varredura se há algo suspeito (chaves, senhas) antes do envio.
8) Gere RELATORIO_FINAL.md com três listas honestas: (a) o que funciona e foi testado, (b) o que é demonstração/exemplo/limitado, (c) o que não pôde ser testado sem aparelho real.
```

### PROMPT 7 — Conteúdo dos slides (para colar no Canva)

```
Com base no sistema Ciclo 12 já construído, escreva o conteúdo dos 8 slides do pitch (5 minutos, 4 pessoas: Enzo slides 1-2, Bárbara 3-4, Davi 5-6, Julia 7-8), seguindo exatamente esta estrutura do meu professor: 1 capa; 2 problema + dados + gráfico; 3 beneficiários; 4 nome, tipo e o que faz; 5 funções (lista ou diagrama); 6 modelo de processo + requisitos principais; 7 metas da ODS 12; 8 impacto + próximos passos + referências.
Regras: cada slide com no máximo 35 palavras visíveis + sugestão de visual (ícone/gráfico/print de /prints/); dados só com fonte (use somente os dados verificados que estão no repositório e no README); metas do grupo rotuladas "meta do grupo"; texto de fala (roteiro) separado por pessoa, com tempo em segundos que some 5 min; marcar onde entra a demonstração ao vivo de 45 s; uma versão de backup caso a internet caia; 10 perguntas difíceis que o professor pode fazer com resposta honesta e curta. Pergunte o modelo de processo (Scrum é suposição) e a turma antes de escrever o slide 6 e a capa.
```

### PROMPT 8 — Auditor crítico (rode no fim; o mais importante)

```
Aja como um auditor cético e duro do meu trabalho escolar. NÃO elogie. Leia todo o repositório e responda:
1) O que está quebrado, ambíguo ou não testado?
2) Quais afirmações na interface ou nos slides NÃO têm fonte, são chute ou podem estar erradas (endereço, horário, o que cada PEV aceita, coordenadas, números)?
3) Onde um professor poderia me pegar numa mentira ou exagero ("funciona de verdade", "IA", "plataforma")?
4) Falhas de segurança: XSS, chaves expostas, RLS frágil, dados pessoais, permissões do navegador.
5) Problemas de acessibilidade e de celular.
6) Qual é o maior risco de a demonstração falhar ao vivo e como evitar?
Entregue uma lista priorizada (crítico, importante, menor), cada item com arquivo/linha e correção. Não corrija nada sem eu aprovar.
```

---

## PARTE I — Checklist final (quinta de manhã)

- [ ] Hub abre pelo link público, no celular e no computador.
- [ ] Mapa mostra a escola e os 33 PEVs; os 2 de Vila Galvão têm distância calculada; coordenadas conferidas no Google Maps.
- [ ] App instala no celular (Android/iPhone testado ou limitação declarada); GPS, câmera e lembrete funcionam.
- [ ] Plataforma: 3 usuários de teste prontos e logados; projeto do Supabase ativo; dashboard com dados.
- [ ] Chatbot: 5 perguntas de demonstração ensaiadas (incluindo uma com erro de digitação).
- [ ] Site: calculadora com exemplo pronto.
- [ ] **Vídeo de backup** gravado.
- [ ] Slides com dados + fontes; gráfico presente; logo; ícones.
- [ ] Ensaio cronometrado 2 vezes; ≤ 5 min.
- [ ] Celulares carregados; dados móveis como plano B (hotspot).
- [ ] Nada de "meta" apresentada como "resultado".
- [ ] Resposta do professor sobre "1 sistema com 4 módulos".

## PARTE J — O que ainda está em aberto (não chutei)

1. **Turma** e **nomes dos modelos de processo** do enunciado (assumi Scrum).
2. **Endereço do colégio**: veio de um diretório de escolas; confirmar na secretaria.
3. **Conflito do PEV Gopoúva** (Rua Guarulhos, 34 × Rua Nadir, 34).
4. **O que cada PEV aceita de eletrônicos, pilhas, lâmpadas** (não está na matéria).
5. **Pontos de doação de roupa e comida** (nenhum confirmado ainda).
6. **Parceiros de destinação** (cooperativas, Flacipel, Sucata Digital): nenhum verificado.
7. **Dado do chuveiro elétrico** (23%, Unicamp): conferir a fonte.
8. **Resposta do professor** sobre o formato.

*Verificado hoje (06/10/2026): lista de PEVs (Agência Mural); documentação do Google Play (conta pessoal criada após 13/11/2023 exige teste fechado com 12 testadores por 14 dias seguidos); documentação da Meta (número de teste com até 5 destinatários). Não verificado: requisitos de verificação da Meta para número próprio; regras do plano gratuito do Supabase; suporte a notificações no iPhone.*
