# Ciclo 12

Trabalho escolar sobre a **ODS 12: Consumo e Produção Responsáveis**.

- **Grupo:** Enzo Penchel, Bárbara Valentina, Davi Biguetti e Julia Ayumi
- **Escola:** Colégio Progresso, Av. Timóteo Penteado, 4405, Vila Galvão, Guarulhos/SP (endereço ainda a confirmar com a secretaria)
- **Entrega:** 08/10/2026

O Ciclo 12 é **um sistema só, com 4 módulos**. Cada módulo ataca um ou mais dos 5 problemas
(lixo eletrônico, roupas, desperdício de alimentos, reciclagem e consumo de água/energia).

## Módulos

| Pasta | Módulo | Problema que resolve | Situação |
|---|---|---|---|
| `/` (`index.html`) | **Hub** | Mostra os 5 problemas com dados e fonte, o mapa de descarte e os links para os módulos | pronto (Etapa 1) |
| `/site/` | **Ciclo Consumo** (site) | Consumo de água e energia: conteúdo, calculadora, gráfico e cadastro simples | pronto (Etapa 2) |
| `/chatbot/` | **Ciclo Bot** (chatbot) | Dúvidas sobre reciclagem, funciona por regras, offline e sem chave de API | pronto (Etapa 3) |
| `/app/` | **Ciclo Ponto** (app PWA) | Lixo eletrônico e roupas/objetos: GPS, câmera e lembretes, instalável no celular | pronto (Etapa 4) |
| `/plataforma/` | **Ciclo Prato** (plataforma) | Desperdício de alimentos: login, 3 perfis (doador, receptor, admin), doações com status e painel | pronto (Etapa 5) |

## Estrutura de pastas

```
ciclo12/
├── index.html          hub: 5 problemas, gráficos e mapa de descarte
├── sobre.html          diagrama do sistema, fontes e próximos passos
├── app/                Ciclo Ponto (app PWA: manifesto, service worker, ícones)
├── plataforma/         Ciclo Prato (banco.sql, config.js, telas)
├── chatbot/            Ciclo Bot (conhecimento.js com 47 itens)
├── site/               Ciclo Consumo
├── shared/             arquivos usados por todos os módulos
│   ├── estilo.css      cores claro/escuro, componentes, rodapé, animação
│   ├── animacao.js     animação de entrada e ao rolar
│   ├── logo.svg / favicon.svg
│   └── pontos.js       33 Ecopontos + escola (gerado por _dados/gerar_pontos.mjs)
├── prints/             imagens para os slides
├── _dados/             dados brutos, scripts e pendências (COLETAR.md)
├── _testes/            testes automáticos (Playwright + Edge, PGlite, Supabase)
├── _referencia/        versão antiga do Ciclo 12 (só consulta)
└── RELATORIO_FINAL.md  o que funciona, o que é exemplo e o que não foi testado
```

## Como rodar no seu computador

Abrir o `index.html` com dois cliques não basta. Alguns recursos (mapa, app instalável, câmera,
GPS) só funcionam quando a página vem de um servidor. O Python já traz um servidor simples:

1. Abra o terminal (PowerShell) **dentro da pasta `ciclo12`**.
2. Rode:
   ```
   python -m http.server 8000
   ```
   (se o comando `python` não existir, tente `py -m http.server 8000`)
3. Abra no navegador: <http://localhost:8000>
4. Para parar o servidor, volte ao terminal e aperte `Ctrl + C`.

**Para testar no celular:** o celular precisa estar no mesmo Wi-Fi. Mesmo assim, GPS, câmera e
instalação do app exigem HTTPS, então teste esses recursos no link do GitHub Pages (abaixo).

## Como publicar no GitHub Pages (grátis, com HTTPS)

O projeto já é um repositório git com o histórico de commits. O jeito mais fácil é mandar esse histórico para o GitHub.

**1. Criar o repositório vazio no GitHub**
1. Entre em <https://github.com> (crie a conta se não tiver).
2. Clique no **+** (canto de cima, à direita) e depois em **New repository**.
3. Em *Repository name*, escreva `ciclo12`. Marque **Public**.
4. **Não** marque "Add a README", nem .gitignore, nem licença (o repositório precisa nascer vazio).
5. Clique em **Create repository**.

**2. Enviar os arquivos (PowerShell, dentro da pasta `ciclo12`)**
```
git remote add origin https://github.com/SEU-USUARIO/ciclo12.git
git push -u origin main
```
Na primeira vez, o Windows abre uma janela do navegador para você entrar no GitHub (é o Git Credential Manager). Depois disso o envio continua sozinho.

*Sem terminal:* na página do repositório vazio, clique em **uploading an existing file**, arraste **o conteúdo** da pasta `ciclo12` (não a pasta em si) e clique em **Commit changes**. Assim o histórico de commits não vai junto.

**3. Ligar o GitHub Pages**
1. No repositório, vá em **Settings** e depois em **Pages** (menu da esquerda).
2. Em *Build and deployment*, escolha **Deploy from a branch**.
3. Branch **main**, pasta **/ (root)**, e clique em **Save**.
4. Espere 1 a 2 minutos e recarregue a página: aparece o link.

**Link esperado:** `https://SEU-USUARIO.github.io/ciclo12/`
(app: `.../ciclo12/app/` · plataforma: `.../ciclo12/plataforma/` · chatbot: `.../ciclo12/chatbot/` · site: `.../ciclo12/site/`)

**4. Depois de publicar**
- Abra o link no celular e teste o app (instalar, GPS, câmera, lembrete): veja o RELATORIO_FINAL.md.
- No Supabase, em **Authentication → URL Configuration**, coloque o link do GitHub Pages em *Site URL* (só importa se um dia ligarem o "Confirm email").

**Atenção:** o repositório é público, então qualquer pessoa vê os arquivos.
**Nunca** coloque senha ou chave secreta nele. A chave `service_role`/`secret` do Supabase nunca entra no código;
a chave `publishable` em `plataforma/config.js` é pública de propósito (quem protege os dados é o RLS do `banco.sql`).
As senhas das contas de teste ficam em `CONTAS_TESTE_NAO_PUBLICAR.json`, **fora** desta pasta.

## Regras de dados do projeto

- Nenhum dado inventado. Dado sem fonte aparece como **TODO** na tela.
- Dado de exemplo aparece com o rótulo **EXEMPLO**.
- Ponto de coleta não confirmado aparece com o rótulo **a confirmar**.
- Os PEVs vêm da matéria da Agência Mural (10/10/2025). Confirme horários e materiais com a
  Prefeitura de Guarulhos.

## Tecnologia

HTML, CSS e JavaScript puros, sem framework e sem etapa de build. Dependências externas:
Leaflet (mapa, via cdnjs, carregado só quando o mapa é aberto) e, só na plataforma, o cliente do Supabase via jsDelivr.
As duas têm hash de integridade (SRI), então o navegador recusa qualquer arquivo alterado.
