# O que falta coletar e conferir (Ciclo 12)

Atualizado em 07/10/2026. Quando confirmar algo, anote **a data e com quem falou**. Sem isso, não vale como "confirmado".

## 1. Locais de DOAÇÃO de roupas e alimentos (Bárbara) — URGENTE

Os PEVs **não** recebem comida (a matéria da Mural diz isso) e a matéria **não cita roupa**. Hoje o mapa só tem 3 modelos marcados como EXEMPLO.

| Tipo | Nome do local | Endereço completo | O que aceita | Horário | Contato | Confirmado em (data) / com quem |
|---|---|---|---|---|---|---|
| Roupa | | | | | | |
| Roupa | | | | | | |
| Roupa | | | | | | |
| Alimento | | | | | | |
| Alimento | | | | | | |

## 2. Os 2 PEVs de Vila Galvão (Julia) — ligar ou mandar mensagem

| Pergunta | PEV Timóteo Penteado (Av. Faustino Ramalho, 977) | PEV Vila Galvão (R. Ipiranga, 543) |
|---|---|---|
| Aceita **celular** e eletrônicos pequenos? | | |
| Aceita **roupa**? | | |
| Confirma que **não** aceita pilha e lâmpada fluorescente? (a matéria diz que não) | | |
| Horário real hoje | | |
| Confirmado em (data) / com quem | | |

Telefone e site da Prefeitura de Guarulhos: **TODO** (procurar no site oficial, não em blog).

## 3. Coordenadas para conferir no Google Maps (todos)

Como conferir: abra o Google Maps, procure o endereço, clique com o botão direito no lugar exato do PEV e clique nos números (latitude, longitude) para copiar. Cole em `_dados/coordenadas_manuais.json` (modelo em `coordenadas_manuais.exemplo.json`) e rode `node _dados/gerar_pontos.mjs`.

### 3a. 9 PEVs SEM posição no mapa (prioridade)
| PEV | Endereço (referência da fonte) | Posição atual | Situação | Conferido |
|---|---|---|---|---|
| Continental | Rua Valdimiro Laurentino Pêssoa, 655, Parque Continental II (atrás do CEU Continental) | — | sem posição | ☐ |
| Santos Dumont | Estrada do Saboó, 795, Santos Dumont | — | sem posição | ☐ |
| Bom Clima | Rua João Bernardo de Medeiros, 800 (ao lado do Thomeuzão) | — | sem posição | ☐ |
| Cabuçu | Av. Pedro de Souza Lopes (altura do nº 7800) (em frente ao número 7800, Escola Maria Helena Faria Lima e Cunha) | — | sem posição | ☐ |
| Fortaleza | Rua Medeia Escardino Mariano, 311, Jardim Fortaleza (ao lado do reservatório do SAAE) | — | sem posição | ☐ |
| Bondança | Rua Ivan Edmundo Scarameli, 62, Jardim Bondança | — | sem posição | ☐ |
| Lavras | Av. José Brumati, 1857, Lavras | — | sem posição | ☐ |
| Leblon | Rua Araci, 188, Jardim Leblon | — | sem posição | ☐ |
| Nova Bonsucesso | Rua Remanso esquina com Viela Urga, Vila Nova Bonsucesso | — | sem posição | ☐ |

### 3b. 13 PEVs com posição APROXIMADA (só a rua foi achada)
| PEV | Endereço (referência da fonte) | Posição atual | Situação | Conferido |
|---|---|---|---|---|
| Gopoúva | Rua Guarulhos, 34, Gopoúva | -23.46869, -46.54244 | aproximada ±0,2 km | ☐ |
| Timóteo Penteado | Avenida Faustino Ramalho, 977, Vila Galvão | -23.46299, -46.56562 | aproximada ±0,5 km | ☐ |
| Presidente Dutra | Avenida João Bassi, 707, Jd. Presidente Dutra (esquina com Rua Maria Paula Mota) | -23.42021, -46.42554 | aproximada ±0,5 km | ☐ |
| Ponte Grande | Alameda Josefina L. Zamataro, 233, Vila Zamataro | -23.50758, -46.55531 | aproximada ±0,1 km | ☐ |
| Vila Galvão | Rua Ipiranga, 543, Vila Galvão (altura do número 615 da Avenida Pedro de Souza Lopes) | -23.44898, -46.56541 | aproximada ±0,2 km | ☐ |
| Vila Rio | Av. Benjamin Harris Hunnicutt, 1509, Vila Rio | -23.43094, -46.53764 | aproximada ±0,3 km | ☐ |
| Rosa de França | Rua Nestor Cabral, 61, Jd. Rosa de França | -23.44402, -46.55307 | aproximada ±0,1 km | ☐ |
| Adriana | Rua Walter Pereira de Lima, 105, Vila Sítio dos Morros | -23.41998, -46.52041 | aproximada ±0,1 km | ☐ |
| Cidade Soimco | Rua Bento Gonçalves, s/nº, Cidade Soimco (altura do número 119) | -23.44526, -46.46627 | aproximada ±0,1 km | ☐ |
| INOCOOP | Av. Francisco Xavier Correia, 489, Residencial Parque Cumbica | -23.41977, -46.42401 | aproximada ±0,1 km | ☐ |
| Jardim Cumbica | Av. Berinepe, 99, Jardim Cumbica | -23.44827, -46.442 | aproximada ±0,4 km | ☐ |
| Favela 3D | Rua São Martinho, 375, Cidade Satélite | -23.4536, -46.46785 | aproximada ±0,1 km | ☐ |
| Álamo | Rua Gentil da Silva Leite Filho, 15, Jd. Álamo | -23.41066, -46.37417 | aproximada ±0,1 km | ☐ |

### 3c. 11 PEVs com o número achado (dar só uma olhada rápida)
- Paraventi — Rua Apolônia Vieira de Jesus, 91, Jardim Leila → -23.4581, -46.52336
- Torres Tibagy — Rua Ouvidor, 337, Parque Santo Antonio → -23.45722, -46.55683
- Iporanga — Rua Adélia Sadalla, 166, Jd. Luciara → -23.44037, -46.53201
- Cabrália — Rua Cabrália, 100, Jd. Bela Vista → -23.43458, -46.51352
- Macedo — Rua Soldado Estanislau Wojcik, 26, Vila Sant'Anna → -23.47117, -46.52115
- Vila Barros — Rua Guilherme Lino dos Santos, 349, Jardim Flor do Campo → -23.45097, -46.50405
- Mikail — Rua Justiniano Salvador dos Santos, 269, Parque Mikail → -23.40891, -46.49436
- Haroldo Veloso — Rua Campos Gerais, 163, Haroldo Veloso → -23.41684, -46.46819
- Pimentas — Rua Itália, 13, Parque das Nações → -23.43701, -46.40845
- Ponte Alta — Rua Zeferino Alves de Oliveira, 530, Ponte Alta I → -23.40218, -46.41924
- Jurema — Rua Jacutinga, 470, Jurema → -23.44986, -46.41752

### 3d. Escola
- Colégio Progresso — Av. Timóteo Penteado, 4405, Vila Galvão, Guarulhos/SP, CEP 07061-003 → -23.45889, -46.56392 (número achado). **Confirmar o endereço na secretaria** (veio de um diretório de escolas).

## 4. Outras pendências
| Pendência | Quem | Situação |
|---|---|---|
| Conflito de endereço do PEV Gopoúva (Rua Guarulhos, 34 × Rua Nadir, 34) | Julia | aberto |
| Dados de Guarulhos com fonte oficial (coleta seletiva, resíduos por habitante) | Davi | aberto |
| Parceiros de destinação (Eco Guarulhos/ACRAT, Cooper Guaru, Flacipel, Sucata Digital): aceita pessoa física? horário? cobra? | Bárbara/Julia | nenhum verificado |
| Turma e modelo de processo (Scrum é suposição) | Enzo | aberto |
| Resposta do professor sobre "1 sistema com 4 módulos" | Enzo | aberto |
