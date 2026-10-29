# nlw-esports

![preview](./.github/preview.png)

> Trilha Ignite

## 💻 Projeto

Este é um projeto desenvolvido durante a **[Next Level Week](https://nextlevelweek.com/)**, realizada pela **[@Rocketseat](https://github.com/Rocketseat)** durante os dias 11 a 18 de Setembro de 2022.

Aplicação full stack (API, web e mobile) para encontrar parceiros (duo) de jogos. Veja o [README geral](../README.md) para a visão completa do repositório.

## 📄 Layout

Você pode visualizar o layout do projeto através dos links abaixo:

[🔗 Clique aqui para acessar](https://www.figma.com/community/file/1150897317533332617)

Lembrando que você precisa ter uma conta no [Figma](http://figma.com/) para acessá-lo.

## 📚 Tecnologias

- Node.js, Express, Prisma e SQLite (server)
- React, Vite e Tailwind CSS (web)
- React Native e Expo (mobile)
- TypeScript

## 🚀 Como executar

Requisito: Node.js 22.12+ (recomendado 24).

```bash
# API (http://localhost:3333)
cd ignite/server
cp .env.example .env      # ajuste CORS_ORIGIN, PORT etc.
npm ci
npm run db:deploy         # cria o banco SQLite local
npm run db:seed           # cadastra os jogos
npm run dev

# Web (http://localhost:5173)
cd ignite/web && npm ci && npm run dev

# Mobile
cd ignite/mobile && npm ci && npm start
```

Nunca versione o arquivo `.env` nem o banco (`*.db`): ambos estão no `.gitignore`.

## 📇 Contato

[![Gmail Badge](https://img.shields.io/badge/Gmail-D14836?style=flat-square&logo=gmail&logoColor=white&link=https://github.com/lucasllimati)](mailto:lucasllimati@gmail.com)
[![Github Badge](https://img.shields.io/badge/-Github-181717?style=flat-square&logo=Github&logoColor=white&link=https://github.com/lucasllimati)](https://github.com/lucasllimati)
[![Linkedin Badge](https://img.shields.io/badge/-LinkedIn-0A66C2?style=flat-square&logo=Linkedin&logoColor=white&link=https://www.linkedin.com/in/lucasllimati/)](https://www.linkedin.com/in/lucasllimati/)
[![Instagram Badge](https://img.shields.io/badge/-Instagram-E4405F?style=flat-square&labelColor=E4405F&logo=Instagram&logoColor=white&link=https://www.instagram.com/olukaslima_)](https://www.instagram.com/olukaslima_)
[![Linktree Badge](https://img.shields.io/badge/-Linktree-39E09B?style=flat-square&labelColor=39E09B&logo=Linktree&logoColor=white&link=https://linktr.ee/lucasllimati)](https://linktr.ee/lucasllimati)
[![Notion Badge](https://img.shields.io/badge/-Notion-000000?style=flat-square&labelColor=000000&logo=Notion&logoColor=white&link=https://www.notion.so/Lucas-Louren-o-de-Lima-9b861c29195143f0a522968c03baddc0)](https://www.notion.so/Lucas-Louren-o-de-Lima-9b861c29195143f0a522968c03baddc0)

## 📝 Licença

Esse projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👏 Agradecimento

Agradeço a Rocketseat por esse primeiro passo na jornada como futuro desenvolvedor e espero os novos desafios.

---
<p align="center">Desenvolvido com ❤️ por Lucas Lima</p>
