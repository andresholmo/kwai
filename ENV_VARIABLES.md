# Variáveis de Ambiente

## Variáveis Necessárias

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase

### Kwai API
- `KWAI_CLIENT_ID` - ID do cliente da aplicação Kwai
- `KWAI_CLIENT_SECRET` - Secret do cliente da aplicação Kwai
- `KWAI_REDIRECT_URI` - URI de redirecionamento do OAuth (deve ser: `https://kwai.grupoupmidia.com.br/api/auth/callback`)
- `KWAI_API_BASE_URL` - URL base da API do Kwai (geralmente: `https://developers.kwai.com`)
- `KWAI_AUTH_URL` - URL de autorização OAuth (geralmente: `https://business.kwai.com/oauth/authorize`)
- `KWAI_TOKEN_URL` - URL para trocar code por token (geralmente: `https://business.kwai.com/oauth/token`)
- `KWAI_CORP_ID` - ID da corporação (obrigatório para anunciantes diretos buscar contas) - Exemplo: `76407091`

### Next.js
- `NEXT_PUBLIC_APP_URL` - URL da aplicação (exemplo: `https://kwai.grupoupmidia.com.br`)

## Configuração Local

Crie um arquivo `.env.local` na raiz do projeto com todas as variáveis acima.

## Configuração na Vercel

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Adicione todas as variáveis acima
3. Certifique-se de que `KWAI_AGENT_ID` está configurado
4. Faça um redeploy após adicionar novas variáveis

## Nota Importante

O `KWAI_CORP_ID` é obrigatório para anunciantes diretos (Direct Sale Advertiser) buscar contas através da API `crmAccountQueryByAgentOrCorp`. 
- Para **anunciantes diretos**: use `KWAI_CORP_ID`
- Para **agências**: use `KWAI_AGENT_ID` (não implementado no momento)
- Você pode encontrar o Corp ID na URL do Kwai Business Center: `corpId=76407091`

