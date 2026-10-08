# Relatório final do Ciclo 12

Atualizado em 07/10/2026. Os testes automáticos rodam com Playwright no Microsoft Edge (sem celular de verdade), com um PostgreSQL local (PGlite) imitando o Supabase e com o Supabase real do projeto. Os scripts estão em `_testes/`.

## (a) O que funciona e foi testado

| Parte | O que foi testado | Resultado |
|---|---|---|
| **Hub** | 33 Ecopontos na lista (24 no mapa + escola), filtro por material (recebe / não recebe / confirmar), ordem por distância, GPS falso, localização negada, mapa sem internet, Leaflet fora do ar, 390 e 1280 px, claro e escuro, teclado | 59 de 59 |
| **Site Ciclo Consumo** | Conta conferida à mão (15 min, 3 pessoas, 4.000 W, R$ 1,00/kWh: 405 L, 122,7%, 90 kWh, R$ 90,00, economia de 4.050 L e R$ 30,00), validação de campos, e-mail inválido, tentativa de código malicioso no nome, armazenamento bloqueado | 52 de 52 |
| **Chatbot Ciclo Bot** | 28 perguntas digitadas (com erros de digitação, pergunta sem sentido, `<script>` e `<img onerror>`): 28 certas; menu, respostas rápidas, "você quis dizer?", GPS, funciona sem internet depois de aberto | 58 de 58 |
| **App Ciclo Ponto** | Manifesto e ícones válidos, GPS falso muda a ordem, foto de 2000×1500 reduzida para 800×600, itens continuam depois de recarregar, exportar e apagar, reserva em localStorage sem IndexedDB, falta de espaço, lembrete dispara (relógio adiantado) com notificação do service worker, funciona offline depois do 1º acesso | 61 de 61 |
| **Plataforma Ciclo Prato (tela)** | Fluxo completo no modo demonstração, validação, código malicioso, painel, Supabase fora do ar liga o modo demonstração sozinho, senha da demo guardada só como hash | 34 de 34 |
| **Banco da plataforma (local)** | `banco.sql` num PostgreSQL local imitando o Supabase: todas as tentativas de burla do plano (receptor editando doação, doador reservando a própria, usuário virando admin, receptor não aprovado reservando, doação vencida sendo reservada) e outras | 49 de 49 |
| **Banco da plataforma (Supabase real)** | Cadastros, admin aprova receptor, reserva, endereço só depois da reserva, confirmação de retirada e burlas, tudo com a chave pública, como um usuário comum | 35 de 35 |
| **Animação** | Entrada e "aparecer ao rolar" no hub e no site; "reduzir movimento" e sem JavaScript mostram tudo; mapa sem animação | 20 de 20 |
| **Integração** | 6 páginas × 390/1280 px × claro/escuro: mesmo estilo, logo, favicon, nome e rodapé; sem rolagem lateral, sem imagem sem `alt`, sem campo sem rótulo, sem erro de console; hub abre os 4 módulos; 7 links internos e 14 externos funcionam (o do OpenStreetMap às vezes responde 429 "muitas requisições" ao robô; aberto à mão responde 200) | 35 de 35 |

**Desempenho (4G lenta simulada: 1,6 Mbps e 150 ms, sem cache):** toda página fica pronta em menos de 1 s e carrega por completo em até 3 s (a plataforma, por causa do cliente do Supabase). A página mais pesada tem 155 KB. O arquivo mais pesado do site é o `shared/pontos.js` (43 KB). O GitHub Pages compacta os arquivos, então no ar deve ser ainda mais leve.

**Correção de fuso horário (07/10/2026):** o servidor do Supabase usa o horário UTC, então entre 21h e meia-noite o banco achava que já era o dia seguinte (uma doação com validade "hoje" era recusada ou sumia). Agora o banco usa o dia de Guarulhos (`public.hoje_sp()`). Para quem já tinha rodado o `banco.sql` antigo existe `plataforma/atualizacao-fuso.sql`, que não apaga nada (testado em `_testes/teste_migracao.mjs`).

**Segurança conferida:** nenhum texto digitado vai para a tela como HTML (sempre `textContent`); Leaflet e Supabase têm hash de integridade (SRI); nenhuma chave secreta ou senha no repositório (varredura feita antes da publicação); RLS testado nos dois bancos.

## (b) O que é demonstração, exemplo ou limitado

**Dados**
- **Locais de doação de roupa e comida:** nenhum confirmado. Os 3 que aparecem são **EXEMPLO**, sem endereço.
- **Ecopontos:** a lista vem da matéria da Agência Mural (10/10/2025). Na tela aparecem como "Listado na fonte": **ninguém ligou para confirmar**. O Gopoúva tem conflito de endereço (Rua Guarulhos, 34 × Rua Nadir, 34).
- **Coordenadas:** 11 Ecopontos com o número achado, 13 com **posição aproximada** (só a rua, até 0,6 km de erro) e 9 **sem posição** (aparecem só na lista). Ainda não foram conferidas no Google Maps (`_dados/COLETAR.md`).
- **Celular e roupa nos Ecopontos:** a matéria não cita, então tudo aparece como "confirme". Pilha, lâmpada fluorescente e restos de comida **não** são aceitos, segundo a matéria.
- **Endereço da escola:** veio de um diretório de escolas; falta confirmar na secretaria.
- **Site:** os 9 L/min de vazão do chuveiro são um **valor de partida do grupo**, sem fonte (a tela diz isso e ensina a medir). O dado de 154 L/dia é de 2018.

**Módulos**
- **Chatbot:** funciona **por regras, não é inteligência artificial**. Dos 47 itens, 19 têm destino confirmado pela fonte e 28 dizem "confirme com a Prefeitura de Guarulhos". Não existe versão no WhatsApp.
- **App:** o lembrete é **notificação local** e só aparece na hora certa com o app aberto; se estiver fechado, aparece quando o app for aberto. Push com o app fechado não foi feito. Sem internet, o mapa de ruas não aparece (a lista funciona). Ainda não está em loja de aplicativos.
- **Plataforma:** só tem **contas de teste** (nenhuma ONG ou comércio real). O modo demonstração usa dados fictícios. "Refeições equivalentes" aparece como **TODO** até o grupo definir a conversão com fonte. A foto da doação (opcional no plano) não foi feita. O plano grátis do Supabase pode pausar se ficar sem uso.
- **Site, cadastro "Receber dicas":** fica só no navegador; nenhum e-mail é enviado.

**Pendências do grupo (não são código)**
- Turma e modelo de processo (Scrum é suposição); resposta do professor sobre "1 sistema com 4 módulos"; parceiros de destinação (cooperativas) não verificados. Ver `_dados/COLETAR.md`.

## (c) O que não pôde ser testado sem aparelho real

1. **Câmera física do celular:** a foto foi simulada com um arquivo.
2. **Instalar o app** na tela inicial (Android e iPhone): exige o link do GitHub Pages (HTTPS).
3. **Notificações num celular de verdade**, principalmente no iPhone (só funcionam com o app instalado na tela de início, no iOS 16.4 ou mais novo).
4. **GPS real:** foram usadas coordenadas falsas.
5. **Desempenho num celular real e na internet da escola:** a 4G lenta foi simulada no computador.
6. **Leitor de tela de verdade** (TalkBack, VoiceOver): só as checagens automáticas (rótulos, `alt`, foco, teclado).
7. **Lembrete com o app fechado:** não funciona por limitação técnica (precisaria de push com servidor).

### Como testar no celular depois de publicar
- **Android (Chrome):** abra `https://SEU-USUARIO.github.io/ciclo12/app/`, toque em **⋮** e depois em **Instalar app**. Abra pelo ícone e teste "Perto de mim", a foto e um lembrete para daqui a 2 minutos, com o app aberto.
- **iPhone (Safari):** abra o mesmo link no **Safari**, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**. Abra pelo ícone. Se ninguém do grupo tiver iPhone, digam no pitch que testaram só no Android.
