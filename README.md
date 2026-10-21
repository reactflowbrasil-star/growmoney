# GrowMoney Softwares

## Status: EM DESENVOLVIMENTO

### Estrutura Atual
```
src/
├── components/
│   ├── auth/          # ProtectedRoute.tsx
│   ├── dashboard/     # KPICard, ChartContainer, charts
│   ├── empresas/      # EmpresaSelector
│   ├── forms/         # ClientForm, ServicoForm, VendedorForm, EmpresaForm, ConviteForm
│   ├── layout/        # Sidebar, Header, AppLayout
│   └── ui/            # Button, Card, EmptyState, Input, Loading
├── config/            # nav.ts
├── contexts/          # AuthContext, ThemeContext
├── design-system/     # tokens.css
├── lib/               # Types, permissions, utils, supabase client
├── pages/
│   ├── auth/          # Login, Cadastro, RecuperaçãoSenha, TermosUso, Privacidade
│   ├── dashboard/     # Dashboard, DashboardExecutivo, Clientes, Contratos, etc.
│   ├── public/        # LandingPage
│   └── empresas/      # Empresas
├── repositories/      # client, servico, vendedor, agenda, empresa
├── routes/            # index, ProtectedRoute
└── services/          # client, servico, vendedor, empresa
```

### Tecnologias
- React 18 + TypeScript + Vite
- Tailwind CSS + Radix UI
- TanStack Query + React Hook Form
- Supabase (Auth + PostgreSQL)
- Recharts para graficos
- Lucide React para icones

### proximos Passos
1. Configurar Supabase com credenciais reais
2. Executar migrações no banco de dados
3. Conectar dados reais (substituir mock data)
4. Configurar ambiente de testes
5. Executar build e deploy
