# Kwai Marketing Dashboard

Dashboard de Gerenciamento de Campanhas do Kwai Marketing API desenvolvido com Next.js 14+ e App Router.

**Repositório:** https://github.com/andresholmo/kwai

## 🚀 Tecnologias

- **Next.js 14+** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **Supabase** - Banco de dados e autenticação
- **React Hook Form + Zod** - Formulários e validação
- **TanStack Query** - Gerenciamento de estado e cache
- **Recharts** - Gráficos e visualizações
- **Axios** - Cliente HTTP

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Credenciais da Kwai Marketing API

## 🛠️ Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/andresholmo/kwai.git
cd kwai
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

Copie o arquivo `env.local.example` para `.env.local`:

```bash
cp env.local.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kwai API
KWAI_CLIENT_ID=your_app_id
KWAI_CLIENT_SECRET=your_secret_id
KWAI_REDIRECT_URI=http://localhost:3000/api/auth/callback
KWAI_API_BASE_URL=https://developers.kwai.com
KWAI_AUTH_URL=https://business.kwai.com/oauth/authorize
KWAI_TOKEN_URL=https://business.kwai.com/oauth/token
```

4. **Configure o Supabase**

Execute as migrations no seu projeto Supabase:

```bash
# Via Supabase CLI (recomendado)
supabase db push

# Ou copie o conteúdo de supabase/migrations/001_initial_schema.sql
# e execute no SQL Editor do Supabase Dashboard
```

5. **Execute o projeto**

```bash
npm run dev
```

O projeto estará disponível em [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
/
├── src/
│   ├── app/                    # App Router do Next.js
│   │   ├── (auth)/            # Rotas de autenticação
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── (dashboard)/       # Rotas do dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── campaigns/
│   │   │   ├── ad-sets/
│   │   │   ├── creatives/
│   │   │   ├── materials/
│   │   │   └── reports/
│   │   └── api/               # API Routes
│   │       ├── auth/callback/
│   │       └── kwai/
│   ├── components/
│   │   ├── ui/                # Componentes Shadcn/ui
│   │   ├── dashboard/         # Componentes do dashboard
│   │   ├── forms/             # Formulários
│   │   └── charts/            # Gráficos
│   ├── lib/
│   │   ├── kwai/              # Cliente Kwai API
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   └── types.ts
│   │   ├── supabase/          # Cliente Supabase
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   └── utils.ts
│   ├── types/                 # TypeScript types
│   └── hooks/                 # Custom React hooks
├── supabase/
│   └── migrations/            # Database migrations
└── README.md
```

## 🔐 Autenticação

O projeto utiliza OAuth 2.0 do Kwai para autenticação:

1. Usuário acessa `/login`
2. É redirecionado para a página de autorização do Kwai
3. Após autorizar, retorna para `/api/auth/callback`
4. Tokens são salvos no Supabase
5. Usuário é redirecionado para `/dashboard`

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o ESLint
- `npm run format` - Formata o código com Prettier
- `npm run format:check` - Verifica formatação do código

## 🚀 Deploy na Vercel

1. **Conecte seu repositório GitHub à Vercel**

2. **Configure as variáveis de ambiente** na Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `KWAI_CLIENT_ID`
   - `KWAI_CLIENT_SECRET`
   - `KWAI_REDIRECT_URI` (use a URL da Vercel)
   - `KWAI_API_BASE_URL`
   - `KWAI_AUTH_URL`
   - `KWAI_TOKEN_URL`

3. **Deploy automático**

A Vercel fará deploy automaticamente a cada push na branch principal.

## 🔧 Configuração do Shadcn/ui

Para adicionar novos componentes do Shadcn/ui:

```bash
npx shadcn-ui@latest add [component-name]
```

Componentes já instalados:
- button
- input
- label
- card
- table
- dropdown-menu
- dialog
- select
- textarea
- switch
- badge
- calendar
- date-picker
- tabs

## ✅ Status do Projeto - Janeiro 2025

### Funcionalidades Implementadas

- ✅ Autenticação com Supabase
- ✅ OAuth do Kwai Business Center
- ✅ Sincronização de contas (2 contas ativas: KUP-01, KUP-02)
- ✅ Dashboard com overview
- ✅ Módulo de Reports básico
- ✅ Conexão de emergência (bypass OAuth)
- ✅ RLS policies configuradas

### Próximos Passos

- ⏳ Aguardando aprovação de permissões completas do Kwai (Ads Delivery, Material Management)
- 🔜 Implementar criação de campanhas
- 🔜 Implementar upload de materiais
- 🔜 Analytics avançados

### Notas Técnicas

- Tipo de desenvolvedor: Agency Developer (agentId: 76407091)
- Permissões atuais: `ad_mapi_report`
- RLS policies corrigidas para todas as tabelas
- Sistema de conexão de emergência disponível em `/dashboard/emergency-connect`

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.
