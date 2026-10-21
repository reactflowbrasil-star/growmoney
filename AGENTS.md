# AGENTS.md — GrowMoney Softwares

## Project Overview
**GrowMoney** é um sistema de gestão financeira para pequenas empresas, construído sobre a base técnica do **ContratosAutomattize** (https://contratosautomattize.lovable.app/).

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Deploy**: Cloudflare Workers + Nitro SSR
- **UI**: Radix UI + shadcn/ui patterns
- **State**: TanStack Query + React Hook Form
- **Imagens**: @img/sharp

## Architecture Principles
- Módulos de domínio com separação de responsabilidades
- Camadas: Componentes → Serviços → Repositórios → Banco de dados
- Contratos explícitos entre camadas
- Tratamento de erros consistente
- Testes automatizados por camada

## Code Conventions
- TypeScript estrito
- Nomenclatura em português para domínio de negócios, inglês para código técnico
- Componentes function com hooks
- Estilos: Tailwind CSS com tokens de design system
- Imports agrupados: terceiros → internos → relativos

## Domain Modules
- `auth` — Autenticação e autorização
- `contratos` — Gestão de contratos comerciais
- `uos` — Unidades operacionais
- `vendedores` — Equipe comercial
- `agendamentos` — Agenda da equipe
- `financeiro` — Parcelas, entradas e relatórios
- `configuracoes` — Configurações do sistema

## Data Access Pattern
```
Componentes → Serviços de domínio → Repositórios → Supabase Client
```
Nunca acessar Supabase diretamente dos componentes.

## Error Handling
- Erros de API: `ApiError` com código e mensagem
- Erros de validação: `ValidationError` com detalhes por campo
- Erros de autorização: `ForbiddenError`
- Erros de não encontrado: `NotFoundError`
- Todos os erros capturados em Error Boundary ou try/catch

## Testing Strategy
- Unit: Jest + Testing Library (componentes e serviços)
- Integration: Testes de fluxo completo com Supabase mock
- E2E: Playwright (fluxos críticos de negócios)

## Design System
- Ver `src/design-system/tokens.css` para tokens
- Cores: grafite, preto, branco, verde discreto (positivo)
- Temas: claro e escuro
- Acessibilidade: WCAG AA

## Documentação
- `docs/ARCHITECTURE.md` — Arquitetura completa
- `docs/DATA_MODEL.md` — Modelo de dados
- `docs/API.md` — Contratos de API
- `docs/DECISIONS.md` — Decisões arquiteturais
- `docs/DEVELOPMENT_STATUS.md` — Status de desenvolvimento

## Pre-commit Hooks
- `npm run lint` — ESLint + Prettier
- `npm run typecheck` — TypeScript strict
- `npm run test` — Testes unitários

## Environment Variables
Ver `.env.example` para variáveis necessárias. Nunca commitar `.env`.