# NLW eSports

[![CI](https://github.com/lucasllimati/nlw-esports/actions/workflows/ci.yml/badge.svg)](https://github.com/lucasllimati/nlw-esports/actions/workflows/ci.yml)
[![CodeQL](https://github.com/lucasllimati/nlw-esports/actions/workflows/codeql.yml/badge.svg)](https://github.com/lucasllimati/nlw-esports/actions/workflows/codeql.yml)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)](LICENSE)

Projetos desenvolvidos na **[Next Level Week eSports](https://nextlevelweek.com/)** da **[@Rocketseat](https://github.com/Rocketseat)** (11 a 18 de setembro de 2022), mantidos e atualizados desde então.

O repositório reúne as duas trilhas do evento:

| Trilha | Pasta | O que é | Acesso |
|---|---|---|---|
| **Explorer** | [`explorer/`](explorer) | Página estática com meus jogos e canais favoritos da Twitch | [🔗 Ver online](https://lucasllimati.github.io/nlw-esports/explorer/) |
| **Ignite** | [`ignite/`](ignite) | Aplicação full stack para encontrar um *duo* (parceiro de jogo): API, web e mobile | Executar localmente |

Layout no Figma: [NLW eSports (Community)](https://www.figma.com/community/file/1150897317533332617)

![Preview da trilha Ignite](ignite/.github/preview.png)

## 📁 Estrutura

```
nlw-esports/
├── explorer/            # Trilha Explorer: HTML + CSS puro
│   ├── index.html
│   ├── styles.css
│   └── assets/
├── ignite/              # Trilha Ignite: aplicação full stack
│   ├── server/          # API REST (Node.js + Express + Prisma + SQLite)
│   ├── web/             # Front-end web (React + Vite + Tailwind CSS)
│   └── mobile/          # App mobile (React Native + Expo)
├── .github/
│   ├── workflows/       # CI, CodeQL e auto-merge do Dependabot
│   └── dependabot.yml
└── SECURITY.md          # Política de segurança
```

## 📚 Tecnologias

| Parte | Stack |
|---|---|
| **explorer** | HTML5, CSS3 (layout responsivo, sem dependências) |
| **ignite/server** | Node.js 24, TypeScript 7, Express 5, Prisma 7 (SQLite via `better-sqlite3`), Zod 4, Helmet, express-rate-limit |
| **ignite/web** | React 19, Vite 8, Tailwind CSS 4, TypeScript 7, Phosphor Icons |
| **ignite/mobile** | Expo SDK 58, React Native 0.88, React 19, TypeScript 6 |

## 🚀 Como executar

**Requisitos:** [Node.js](https://nodejs.org/) 22.12 ou superior (recomendado 24) e npm 11.

### Explorer

Não precisa de build: abra `explorer/index.html` no navegador ou acesse a [versão online](https://lucasllimati.github.io/nlw-esports/explorer/).

### Ignite: API (`ignite/server`)

```bash
cd ignite/server
cp .env.example .env      # ajuste as variáveis se precisar
npm ci                    # instala e gera o Prisma Client
npm run db:deploy         # cria o banco SQLite local (prisma/dev.db)
npm run db:seed           # cadastra os jogos
npm run dev               # http://localhost:3333
```

Variáveis de ambiente (`.env`):

| Variável | Padrão | Descrição |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `production` ou `test` |
| `PORT` | `3333` | Porta HTTP da API |
| `DATABASE_URL` | `file:./prisma/dev.db` | Caminho do banco SQLite |
| `CORS_ORIGIN` | `http://localhost:5173` | Origens liberadas no CORS, separadas por vírgula |
| `TRUST_PROXY` | `0` | Número de proxies reversos na frente da API (afeta o rate limit por IP) |

### Ignite: Web (`ignite/web`)

```bash
cd ignite/web
npm ci
npm run dev               # http://localhost:5173
```

### Ignite: Mobile (`ignite/mobile`)

```bash
cd ignite/mobile
npm ci
npm start                 # abra no app Expo Go ou em um emulador
```

## 🔌 API

Base: `http://localhost:3333`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/games` | Lista os jogos com a quantidade de anúncios (`_count.ads`) |
| `GET` | `/games/:id/ads` | Lista os anúncios de um jogo, do mais recente ao mais antigo (sem o Discord) |
| `POST` | `/games/:id/ads` | Cria um anúncio para o jogo e retorna `{ id }` |
| `GET` | `/ads/:id/discord` | Retorna o usuário do Discord de um anúncio |

Exemplo de corpo do `POST /games/:id/ads`:

```json
{
  "name": "Lucas",
  "yearsPlaying": 3,
  "discord": "lucas.dev",
  "weekDays": [0, 5, 6],
  "hourStart": "18:00",
  "hourEnd": "23:30",
  "useVoiceChannel": true
}
```

Regras de validação:

- `:id` precisa ser um UUID.
- `name`: de 1 a 50 caracteres.
- `yearsPlaying`: inteiro de 0 a 100.
- `discord`: formato novo (`nome.usuario`) ou legado (`nome#1234`).
- `weekDays`: de 1 a 7 dias, de `0` (domingo) a `6` (sábado).
- `hourStart` e `hourEnd`: formato `HH:mm`.

Respostas de erro:

- `400` para dados inválidos, com a lista de `issues`.
- `404` para jogo ou anúncio inexistente.
- `413` para corpo acima de 10 kb.
- `429` quando passa do limite de requisições.

## 🛡️ Segurança

**API**
- Toda entrada é validada com Zod.
- O CORS só libera as origens configuradas, e o Helmet adiciona os headers de segurança.
- Os erros nunca mostram stack trace nem detalhes do banco.
- O banco não registra as queries no log, porque elas teriam os usuários do Discord.

Limites de requisições por IP:

| Escopo | Limite |
|---|---|
| Geral | 300 a cada 15 min |
| Criar anúncio | 10 por hora |
| Consultar o Discord | 30 a cada 15 min, para dificultar a coleta de contatos |

**Repositório**
- **Merge na `main`:** só entra com o check **CI OK** aprovado (`npm audit`, typecheck, testes e build). Ninguém consegue pular essa regra.
- **CodeQL:** roda em todo PR e uma vez por semana.
- **Dependabot:** cada versão nova espera 7 dias antes de virar PR, o que reduz o risco de pacote comprometido. O auto-merge só aceita patch e minor, depois do CI. Majors e os pacotes travados pelo Expo SDK são atualizados manualmente.
- **GitHub Actions:** estão fixadas por SHA de commit e usam permissões mínimas.
- **Arquivos locais:** `.env` e bancos SQLite não são versionados.

Para reportar uma vulnerabilidade, veja o [SECURITY.md](SECURITY.md).

## 🧪 Scripts úteis

| Pasta | Comando | O que faz |
|---|---|---|
| `ignite/server` | `npm test` | Testes HTTP da API (`node:test`) |
| `ignite/server` | `npm run typecheck` / `npm run build` | Checagem de tipos / compila para `build/` |
| `ignite/server` | `npm run db:migrate` | Cria uma nova migration em desenvolvimento |
| `ignite/web` | `npm run build` | Checa tipos e gera o build de produção em `dist/` |
| `ignite/mobile` | `npm run typecheck` / `npm run doctor` | Checagem de tipos / diagnóstico do Expo |

## 🚧 Status

- **explorer:** concluído e publicado no GitHub Pages.
- **ignite/server:** API completa, com testes.
- **ignite/web:** a tela inicial lista os jogos com dados de exemplo e ainda não consome a API.
- **ignite/mobile:** só a base do app (tema, fundo e status bar); as telas ainda não foram implementadas.

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).

## 📇 Contato

[![Gmail Badge](https://img.shields.io/badge/Gmail-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:lucasllimati@gmail.com)
[![Github Badge](https://img.shields.io/badge/-Github-181717?style=flat-square&logo=Github&logoColor=white)](https://github.com/lucasllimati)
[![Linkedin Badge](https://img.shields.io/badge/-LinkedIn-0A66C2?style=flat-square&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/lucasllimati/)
[![Instagram Badge](https://img.shields.io/badge/-Instagram-E4405F?style=flat-square&logo=Instagram&logoColor=white)](https://www.instagram.com/olukaslima_)
[![Linktree Badge](https://img.shields.io/badge/-Linktree-39E09B?style=flat-square&logo=Linktree&logoColor=white)](https://linktr.ee/lucasllimati)
[![Notion Badge](https://img.shields.io/badge/-Notion-000000?style=flat-square&logo=Notion&logoColor=white)](https://www.notion.so/Lucas-Louren-o-de-Lima-9b861c29195143f0a522968c03baddc0)

---

<p align="center">Desenvolvido com ❤️ por Lucas Lima, com o agradecimento à Rocketseat por esse primeiro passo na jornada como desenvolvedor.</p>
