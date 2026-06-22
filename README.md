# HUB EMV BtgPay

Bem-vindo ao hub de estudo EMV para o time mobile Flutter. Aqui você encontra trilhas guiadas, material técnico em português e quizzes por nível para consolidar o que aprendeu. O conteúdo nasce de fontes oficiais (EMVCo, PDFs e referências do ecossistema) e é organizado para leitura no celular ou no desktop.

## Índice

- [O que é este projeto](#o-que-e-este-projeto)
- [Pré-requisitos](#pre-requisitos)
- [Estrutura do repositório](#estrutura-do-repositorio)
- [Setup no Windows](#setup-no-windows)
- [Setup no macOS](#setup-no-macos)
- [Pipeline de conteúdo](#pipeline-de-conteudo)
- [Hub (interface)](#hub-interface)
- [Como o conteúdo é organizado](#como-o-conteudo-e-organizado)
- [Progresso e quiz](#progresso-e-quiz)
- [Testes](#testes)
- [Deploy na Vercel](#deploy-na-vercel)
- [Agentes Cursor](#agentes-cursor)
- [Fontes e disclaimer](#fontes-e-disclaimer)

## O que é este projeto

O HUB EMV BtgPay é uma aplicação estática (Next.js 15) que entrega capacitação interna sobre pagamentos EMV, contactless, Tap to Mobile, certificação e segurança de terminal, com foco na prática Flutter.

Cinco trilhas de aprendizado reúnem 15 módulos. Cada módulo aponta para trechos específicos do material (`sectionAnchorIds`), para que a leitura seja direta e sem ruído. Quizzes em três níveis (júnior, pleno, sênior) reforçam conceitos com perguntas geradas a partir do mesmo conteúdo.

O repositório separa três partes: **pipeline** (coleta e síntese de conteúdo), **content** (JSON consumido em build time) e **hub** (interface que o aluno usa).

## Pré-requisitos

- **Node.js** 20 ou superior ([nodejs.org](https://nodejs.org))
- **npm** (incluído com o Node)
- **Git**
- Para rodar o pipeline completo de crawl: **Chromium** via Playwright (`npx playwright install chromium`)

O seed de conteúdo já vem no repositório. Você só precisa do pipeline se for atualizar scrapes, PDFs ou re-sintetizar chunks.

## Estrutura do repositório

```
emv-for-btgpay/
├── hub/                    # Next.js 15, export estático (pasta out/)
├── pipeline/               # Crawl, ingestão PDF, síntese, audit, quizzes
├── content/
│   ├── chunks/             # Material por tema (seções com bodyMd)
│   ├── tracks/             # Trilhas e módulos (sectionAnchorIds)
│   ├── quizzes/            # junior.json, pleno.json, senior.json
│   ├── raw/                # Texto bruto de scrapes e PDFs
│   └── _meta/              # Relatórios (audit, synthesis, enrichments)
├── pdfs/                   # Documentos EMVCo oficiais
└── landingpage-Template/   # Referência visual (não alterar no fluxo do hub)
```

## Setup no Windows

Abra o **PowerShell** na pasta do repositório clonado.

```powershell
# Hub (interface)
cd hub
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Build de produção:

```powershell
cd hub
npm run build
```

A saída estática fica em `hub/out/`.

Pipeline opcional (atualizar conteúdo):

```powershell
cd pipeline
npm install
npx playwright install chromium
npm run ingest-pdfs
npm run synthesize-tracks
npm run audit-tracks
npm run verify-claims
npm run generate-quizzes
```

Depois de alterar `content/`, volte ao hub e rode `npm run build` antes do deploy.

## Setup no macOS

No **Terminal** (bash ou zsh), a partir da raiz do repo:

```bash
# Hub (interface)
cd hub
npm install
npm run dev
```

Build:

```bash
cd hub
npm run build
```

Pipeline opcional:

```bash
cd pipeline
npm install
npx playwright install chromium
npm run ingest-pdfs
npm run synthesize-tracks
npm run audit-tracks
npm run verify-claims
npm run generate-quizzes
```

## Pipeline de conteúdo

Fluxo principal (coleta até material publicável):

```
crawl → ingest-pdfs → normalize → filter → enrich → synthesize-chunks
  → verify-chunk-claims → generate-quizzes-from-content
```

| Etapa | Script | Função |
|-------|--------|--------|
| Crawl | `npm run crawl` | BFS em sites permitidos (EMVCo, Stripe, etc.) |
| PDFs | `npm run ingest-pdfs` | Extrai texto de `pdfs/` para `content/raw/` |
| Normalize | `npm run normalize` | Padroniza raw em JSON |
| Filter | `npm run filter` | Mantém trechos relevantes ao BtgPay |
| Enrich | (interno ao synthesize) | Mescla `content/_meta/track-section-enrichments.json` |
| Synthesize | `npm run synthesize` | Gera `bodyMd` em PT-BR por seção (todos os chunks) |
| Trilhas | `npm run synthesize-tracks` | Atalho: reprocessa só os 8 chunks das trilhas |
| Todos | `npm run synthesize-all` | Síntese completa + audit + enrich + verify + quizzes |
| Audit trilhas | `npm run audit-tracks` | Profundidade das seções usadas nos módulos |
| Audit chunks | `npm run audit-chunks` | Idioma e profundidade de **todas** as seções (109 chunks) |
| Verify | `npm run verify-claims` | Evidências fonte vs. texto |
| Quizzes | `npm run generate-quizzes` | 50 perguntas/nível a partir dos chunks |

**Regra editorial:** todo o material de estudo (`bodyMd`) está em **português**. Siglas e termos EMV padrão permanecem em inglês quando é o uso do setor (AID, CDCVM, L1, L2, NFC, etc.). Parágrafos detectados como inglês são descartados ou reescritos por heurística; páginas com scrape pobre usam enrichments curados em `section-enrichments.json` e `curated-sections.mjs`.

**Gate pré-deploy:** `npm run audit-chunks` deve reportar 0 seções `english` e 0 `thin` nos 109 chunks. Para trilhas, `npm run audit-tracks` complementa com cobertura de termos por módulo.

Relatórios úteis:

- `content/_meta/chunk-audit-report.json` (todos os chunks)
- `content/_meta/track-audit-report.json` (módulos das trilhas)
- `content/_meta/synthesis-report.json`

## Hub (interface)

Stack: Next.js 15, React 19, Tailwind CSS, export estático (`output: "export"`).

O hub lê `../content` em **build time** (`JsonContentRepository`). Não há API em runtime: tudo é JSON pré-gerado.

Rotas principais:

| Rota | Descrição |
|------|-----------|
| `/` | Home e trilhas |
| `/trilhas/[slug]` | Módulos da trilha com progresso |
| `/material/[chunkId]` | Leitor (filtro por `sections=` na URL) |
| `/quiz` | Sessões por nível |
| `/sobre` | Fontes, glossário e árvore de verificação |

Validações técnicas (`verification`: evidência, fonte, status OK/GAP) aparecem na página **Sobre**, não no corpo da leitura. Notas de produto ficam em `btgpayNote` por seção.

## Como o conteúdo é organizado

### Chunks (`content/chunks/*.json`)

Cada chunk é um tema (ex.: `fundamentos-emv-chip`). Campos principais:

- `sections[]`: `anchorId`, `heading`, `bodyMd`, `btgpayNote`, `verification`
- `bodyMd`: prosa de estudo em PT-BR (Markdown)
- `btgpayNote`: ligação com o app Flutter / BtgPay
- `verification`: rastreio da afirmação até o raw (exibido em `/sobre`)

### Trilhas (`content/tracks/*.json`)

Cinco trilhas, 15 módulos no total. Cada módulo define:

- `chunkIds`: quais chunks abrir
- `sectionAnchorIds`: quais seções mostrar (filtro no leitor)
- `estimatedMinutes`: tempo sugerido

O hub expõe **109 chunks** de material complementar além das trilhas. Todos são acessíveis em `/material/[chunkId]` e passam pelo mesmo pipeline de síntese PT-BR.

Os 8 chunks centrais das trilhas:

`fundamentos-emv-chip`, `fundamentos-cnp-cp`, `contactless-tap-mobile`, `tap-to-mobile-guidelines`, `certificacao-l1-l2`, `certificacao-niveis-payfelix`, `seguranca-terminal`, `btgpay-flutter-pratica`

### Quizzes (`content/quizzes/`)

Três arquivos: `junior.json`, `pleno.json`, `senior.json`. Cada pergunta referencia `sourceChunkId` e `anchorId` para rastreio.

## Progresso e quiz

### Progresso por trilha

Armazenado no `localStorage` do navegador:

| Chave | Conteúdo |
|-------|----------|
| `emv-hub-track-{slug}` | `moduleProgress` por módulo (chunks visitados, conclusão) |
| `emv-hub-deck-{nivel}` | Fila do quiz (júnior, pleno, sênior) |

Ao abrir material com `?track=` e `&module=`, o hub registra visita ao chunk e mostra barra de progresso do módulo. O botão **Concluir módulo** marca conclusão explícita (`completed: true`).

Percentual do módulo: chunks visitados ÷ `chunkIds.length` do módulo.

### Quiz

- 3 níveis: júnior, pleno, sênior
- 50 perguntas por nível, 10 por sessão
- Sem repetir pergunta até completar o ciclo de 50 (estado em `emv-hub-deck-*`)

## Testes

Na pasta `hub/`:

```bash
# Unitários (Vitest)
npm test

# E2E (Playwright, inclui viewport mobile 375x667)
npx playwright install
npm run test:e2e
```

`test:e2e` faz build antes de rodar os testes. Há checagem de overflow horizontal no quiz em mobile.

Lint:

```bash
npm run lint
```

## Deploy na Vercel

Repositório: [github.com/souzajv/emv-for-btgpay](https://github.com/souzajv/emv-for-btgpay)

1. No [dashboard Vercel](https://vercel.com/new), importe o repositório.
2. **Root Directory:** `hub`
3. Framework: Next.js (detectado automaticamente)
4. Build command: `npm run build`
5. Output directory: `out`
6. Deploy. Não há variáveis de ambiente obrigatórias.

`metadataBase` usa `VERCEL_URL` em produção.

Após mudar arquivos em `content/`, rode `npm run build` no hub e dispare um novo deploy.

CLI opcional (a partir de `hub/`):

```bash
npx vercel deploy --prod
```

## Agentes Cursor

No workspace freelancer, use o comando `/emv-hub` para orquestrar o pipeline de conteúdo e curadoria. Subagentes relacionados:

- `emv-content-scraper`: crawl e ingestão
- `emv-content-enricher`: chunks ricos a partir do raw
- `emv-content-synthesizer`: síntese PT-BR com verificação
- `emv-curriculum-builder`: trilhas e módulos
- `emv-quiz-author`: geração de quizzes
- `emv-design-system`: tokens e componentes do hub

## Fontes e disclaimer

Material derivado de documentação pública EMVCo, guias da indústria, PayFelix, Stripe (artigos EMV/contactless) e PDFs em `pdfs/`. O hub é ferramenta interna de estudo, não substitui certificação oficial nem documentação contratual com adquirentes.

Consulte a página `/sobre` no hub para lista de fontes, glossário e status de verificação por seção.
