# r2pde-ai — Manual de Publicação e Desenvolvimento

> Registro completo de tudo que foi feito para criar, estruturar e publicar o pacote `r2pde-ai` no npm.

---

## Índice

1. [Conceito e Arquitetura](#1-conceito-e-arquitetura)
2. [Stack e Decisões Técnicas](#2-stack-e-decisões-técnicas)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Comandos Implementados](#4-comandos-implementados)
5. [Padrão AI Adapter](#5-padrão-ai-adapter)
6. [Testes Automatizados](#6-testes-automatizados)
7. [Preparação para Publicação](#7-preparação-para-publicação)
8. [GitHub — Repositório e CI](#8-github--repositório-e-ci)
9. [Publicação no npm](#9-publicação-no-npm)
10. [Próximos Passos](#10-próximos-passos)

---

## 1. Conceito e Arquitetura

### O que é o r2pde-ai

`r2pde-ai` é um framework CLI para desenvolvedores solo que trabalham com AI copilots (GitHub Copilot, Claude etc) dentro do VS Code. Ele estrutura as decisões arquiteturais do projeto — manifests, contratos e especificações — em artefatos markdown versionados que guiam a IA com precisão.

### Dois atores distintos

| Ator | Papel |
|---|---|
| **GitHub Copilot** | Sempre gera o código |
| **AI API externa** | Gera prompts otimizados para o Copilot quando configurada |

A API de IA nunca gera código diretamente. Ela melhora a qualidade dos prompts que o dev usa com o Copilot.

### Dois modos de operação

**Modo offline (padrão)**
- CLI gera prompts estruturados para copy/paste no Copilot
- Não requer API externa
- Funcional para qualquer dev

**Modo API**
- CLI envia o contexto do projeto para a IA configurada
- IA retorna um prompt otimizado e mais preciso para o Copilot
- Dev ainda faz copy/paste — mas o prompt é significativamente melhor

### Princípio de UX do CLI

> *Todo comportamento tem um default. Todo default é configurável. Toda configuração tem um command.*

---

## 2. Stack e Decisões Técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Linguagem | TypeScript strict | Segurança de tipos, melhor suporte do Copilot |
| Runtime | Node.js 20 LTS | Estável, amplamente usado, fetch nativo |
| Package manager | npm | Ecossistema natural do público alvo |
| CLI framework | Commander.js | Maduro, simples, bem documentado |
| Prompts interativos | @inquirer/prompts | API moderna, compatível com ESM |
| Filesystem | fs-extra | Utilitários além do fs nativo |
| Terminal output | chalk + ora | Cores e spinners |
| Testes | Vitest | Nativo ESM, rápido, zero config |
| Linguagem CLI | Rust considerado | Descartado — público alvo é Node, Copilot menos preciso em Rust |

### Decisão sobre inquirer

O projeto iniciou com `inquirer@13` (API legada). Durante desenvolvimento foi identificado que a versão 13 quebrou a API legada em ESM. Migração completa para `@inquirer/prompts` resolveu todos os problemas de seleção de lista.

---

## 3. Estrutura do Projeto

### Estrutura do pacote

```
r2pde-ai/
├── src/
│   ├── cli.ts                    # Entry point, registra todos os comandos
│   ├── index.ts                  # Exports do pacote
│   ├── commands/                 # Um arquivo por comando
│   │   ├── init.ts
│   │   ├── doctor.ts
│   │   ├── manifest-create.ts
│   │   ├── manifest-delete.ts
│   │   ├── contract-create.ts
│   │   ├── contract-delete.ts
│   │   ├── requirement-create.ts
│   │   ├── requirement-delete.ts
│   │   ├── score.ts
│   │   ├── score-config.ts
│   │   ├── wave-prompt.ts
│   │   ├── config-set.ts
│   │   ├── config-lang.ts
│   │   ├── reset.ts
│   │   └── logs.ts
│   ├── core/                     # Lógica compartilhada
│   │   ├── config.ts
│   │   ├── paths.ts
│   │   ├── logger.ts
│   │   ├── git.ts
│   │   ├── scorer.ts
│   │   └── ai/
│   │       ├── ai-adapter.ts
│   │       ├── mock-adapter.ts
│   │       ├── api-adapter.ts
│   │       └── adapter-factory.ts
│   └── templates/                # Templates markdown embarcados no pacote
│       ├── manifest.template.md
│       ├── contract.template.md
│       └── requirement.template.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── dist/                         # Compilado (gerado pelo build)
├── README.md
├── LICENSE
├── CHANGELOG.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
└── .npmignore
```

### Estrutura gerada no projeto do usuário

```
.r2pde-ai/
├── pde.index.md              # Índice mestre — colar no Copilot antes de qualquer prompt
├── pde.config.json           # Configuração central
├── GUIDE.md                  # Guia de referência para o dev
├── templates/                # Templates customizáveis por projeto
│   ├── manifest.template.md
│   ├── contract.template.md
│   └── requirement.template.md
├── manifests/               # Princípios orientadores
├── contracts/                # Regras rígidas
├── requirements/             # Especificação da aplicação
├── waves/                    # Ondas de implementação
├── prompts/                  # Prompts gerados para o Copilot
└── logs/                     # Log de auditoria (pde.log.md)
```

---

## 4. Comandos Implementados

| Comando | Descrição |
|---|---|
| `r2pde-ai init` | Inicializa o framework no projeto atual |
| `r2pde-ai doctor` | Verifica a saúde do ambiente |
| `r2pde-ai manifest:create` | Cria um novo manifest |
| `r2pde-ai manifest:delete` | Deleta um manifest existente |
| `r2pde-ai contract:create` | Cria um novo contrato |
| `r2pde-ai contract:delete` | Deleta um contrato existente |
| `r2pde-ai requirement:create` | Cria um novo requisito |
| `r2pde-ai requirement:delete` | Deleta um requisito existente |
| `r2pde-ai score` | Avalia o score de qualidade |
| `r2pde-ai score:config` | Configura os thresholds do score |
| `r2pde-ai wave:prompt` | Gera prompt consolidado para a onda atual |
| `r2pde-ai config:set <key> <value>` | Atualiza um valor de configuração |
| `r2pde-ai config:lang` | Define idioma de mensagens e artefatos |
| `r2pde-ai reset` | Limpa a pasta de prompts |
| `r2pde-ai logs` | Exibe o log de auditoria |
| `r2pde-ai logs --clear` | Limpa o log de auditoria |

### Sistema de Score — Semáforo

| Nível | Emoji | Significado |
|---|---|---|
| Verde | 🟢 | Ambiente consistente, pode avançar |
| Amarelo | 🟡 | Lacunas detectadas, avançar com consciência |
| Vermelho | 🔴 | Conflitos críticos, recomendado resolver antes |

Thresholds configuráveis via `score:config` ou `pde.config.json`.

---

## 5. Padrão AI Adapter

### Arquitetura

```
createAiAdapter(config)
       ↓
┌─────────────────────────────┐
│ apiUrl && apiKey definidos? │
└─────────────────────────────┘
       ↓ sim              ↓ não
  ApiAdapter         MockAdapter
       ↓                   ↓
  Chama API real     Gera prompt
  retorna prompt     estruturado
  otimizado          funcional
```

### Interface

```typescript
interface IAiAdapter {
  generate(prompt: string): Promise<string>;
  isReal(): boolean;
}
```

### Configurar API

```bash
r2pde-ai config:set ai.apiUrl https://api.anthropic.com
r2pde-ai config:set ai.apiKey sua-chave
r2pde-ai config:set ai.model claude-sonnet-4-20250514
```

---

## 6. Testes Automatizados

### Stack

- **Vitest** — runner de testes com suporte nativo a ESM
- **@vitest/coverage-v8** — cobertura de código

### Arquivos de teste

| Arquivo | Testes | Cobertura |
|---|---|---|
| `src/core/paths.test.ts` | 3 | getPaths, paths absolutos |
| `src/core/config.test.ts` | 4 | loadConfig, saveConfig, defaults |
| `src/core/scorer.test.ts` | 7 | score engine, thresholds, warnings |
| `src/core/ai/adapter-factory.test.ts` | 3 | factory, MockAdapter, ApiAdapter |

**Total: 17 testes, 100% passando**

### Comandos

```bash
npm test              # roda todos os testes
npm run test:watch    # modo watch
npm run test:coverage # com relatório de cobertura
```

---

## 7. Preparação para Publicação

### Arquivos de publicação

| Arquivo | Conteúdo |
|---|---|
| `README.md` | Documentação completa do pacote |
| `LICENSE` | MIT — Copyright 2026 r2pde-ai contributors |
| `CHANGELOG.md` | Histórico de versões |
| `.npmignore` | Exclusão de src/, testes, configs de dev |

### package.json — campos essenciais

```json
{
  "name": "r2pde-ai",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": { "r2pde-ai": "dist/cli.js" },
  "files": ["dist", "README.md", "LICENSE", "CHANGELOG.md"],
  "engines": { "node": ">=20.0.0" },
  "keywords": ["cli", "ai", "copilot", "engineering", "pde", "pilot-driven", "scaffold", "typescript"],
  "repository": { "type": "git", "url": "git+https://github.com/rodneyrinaldi/r2pde-ai.git" },
  "bugs": { "url": "https://github.com/rodneyrinaldi/r2pde-ai/issues" },
  "homepage": "https://r2pde-ai.rrs.net.br"
}
```

### Pacote final

- **Arquivos**: 33
- **Tamanho comprimido**: 20.6 kB
- **Tamanho descomprimido**: 81.8 kB

---

## 8. GitHub — Repositório e CI

### Repositório

- **URL**: https://github.com/rodneyrinaldi/r2pde-ai
- **Branch principal**: `main`
- **Convenção de branches**:
  - `main` — código estável, released
  - `dev` — desenvolvimento ativo
  - `feature/descricao` — novas funcionalidades
  - `fix/descricao` — correções
  - `docs/descricao` — documentação

### GitHub Actions CI

Arquivo: `.github/workflows/ci.yml`

- Roda em todo push para `main` e `dev`
- Roda em todo pull request para `main` e `dev`
- Testa em Node.js 20.x e 22.x
- Executa `npm ci`, `npm run build`, `npm test`

### Convenção de commits

Seguindo [Conventional Commits](https://www.conventionalcommits.org):

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
chore: manutenção
refactor: refatoração
test: testes
ci: integração contínua
```

---

## 9. Publicação no npm

### Pré-requisitos

- Conta no npmjs.com com 2FA ativo
- Node.js >= 20 instalado
- Acesso ao terminal com login npm ativo

### Processo realizado

```bash
# Login no npm
npm login

# Verificar login
npm whoami
# output: rodneyrinaldi

# Verificar pacote antes de publicar
npm pack --dry-run

# Corrigir package.json se necessário
npm pkg fix

# Publicar
npm publish --access public
```

### Resultado

```
+ r2pde-ai@0.1.0
```

Pacote disponível em: https://www.npmjs.com/package/r2pde-ai

### Como instalar

```bash
npm install -g r2pde-ai
```

### Como usar após instalação


```bash
mkdir meu-projeto && cd meu-projeto

# Inicialize o npm (cria package.json)
npm init -y

# Inicialize o git
git init

# Inicialize o r2pde-ai
r2pde-ai init
r2pde-ai doctor
```

### Publicar nova versão no futuro

```bash
# Patch (bug fix) — 0.1.0 → 0.1.1
npm version patch

# Minor (nova feature) — 0.1.0 → 0.2.0
npm version minor

# Major (breaking change) — 0.1.0 → 1.0.0
npm version major

# Publicar
npm publish --access public

# Push da tag gerada
git push --follow-tags
```

---

## 10. Próximos Passos

### Pendente

- [ ] Landing page em `r2pde-ai.rrs.net.br` via GitHub Pages + Vercel
- [ ] Demo GIF no README mostrando o fluxo completo
- [ ] Logo do projeto
- [ ] Social preview no GitHub (1280x640)
- [ ] Badges no README (CI, npm version, node version)
- [ ] Documentação completa em site dedicado (VitePress ou Docusaurus)
- [ ] Suporte a OpenAI API no ApiAdapter
- [ ] Internacionalização completa (pt-BR)
- [ ] Plugin system para contratos e manifests customizados
- [ ] VS Code extension para execução inline dos comandos

### Roadmap de versões

| Versão | Objetivo |
|---|---|
| 0.1.0 | ✅ MVP publicado — core commands, score, wave:prompt, AI adapter |
| 0.2.0 | Landing page, badges, OpenAI support, i18n pt-BR |
| 0.3.0 | Plugin system, VS Code extension |
| 1.0.0 | API estável, documentação completa, cobertura 80%+ |

---

*Documento gerado em 13/05/2026*
*r2pde-ai@0.1.0 — MIT License*
