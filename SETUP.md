# Guia Rápido de Setup

## Passos Rápidos

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `env.local.example` para `.env.local`:

```bash
cp env.local.example .env.local
```

Edite `.env.local` com suas credenciais reais.

### 3. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute a migration em `supabase/migrations/001_initial_schema.sql` no SQL Editor do Supabase Dashboard
3. Copie a URL e a chave anônima para `.env.local`

### 4. Configurar Kwai API

1. Obtenha suas credenciais da Kwai Marketing API
2. Adicione as credenciais em `.env.local`
3. Configure o `KWAI_REDIRECT_URI` para apontar para `http://localhost:3000/api/auth/callback` (desenvolvimento)

### 5. Executar o Projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Próximos Passos

- Configure autenticação completa com Supabase
- Teste o fluxo de OAuth do Kwai
- Comece a implementar as funcionalidades do dashboard

