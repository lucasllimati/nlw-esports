# Política de segurança

## Como reportar uma vulnerabilidade

Não abra uma issue pública. Use o [reporte privado do GitHub](https://github.com/lucasllimati/nlw-esports/security/advisories/new)
(aba **Security → Report a vulnerability**).

Inclua, se possível: a parte afetada (`ignite/server`, `ignite/web`, `ignite/mobile` ou `explorer`),
os passos para reproduzir e o impacto esperado.

## Versões suportadas

Apenas a branch `main` recebe correções.

## Como o projeto se protege

- Dependabot com espera de 7 dias para versões novas e auto-merge só de patch/minor, depois do CI
- CI com `npm audit`, testes e build obrigatórios para merge na `main`
- CodeQL (code scanning) em todo PR e semanalmente
- GitHub Actions fixadas por SHA de commit e com permissões mínimas
