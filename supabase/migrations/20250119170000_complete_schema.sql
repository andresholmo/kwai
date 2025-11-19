-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- Tabela de perfis de usuários (estende auth.users do Supabase)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- =============================================
-- KWAI OAUTH TOKENS
-- =============================================

CREATE TABLE public.kwai_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'bearer',
  expires_in INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.kwai_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens" 
  ON public.kwai_tokens 
  USING (auth.uid() = user_id);

-- Index para busca rápida
CREATE INDEX idx_kwai_tokens_user_id ON public.kwai_tokens(user_id);
CREATE INDEX idx_kwai_tokens_expires_at ON public.kwai_tokens(expires_at);

-- =============================================
-- KWAI ACCOUNTS
-- =============================================

CREATE TABLE public.kwai_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id BIGINT NOT NULL UNIQUE, -- ID da conta no Kwai
  account_name TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('advertiser', 'agency')),
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.kwai_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accounts" 
  ON public.kwai_accounts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE INDEX idx_kwai_accounts_user_id ON public.kwai_accounts(user_id);
CREATE INDEX idx_kwai_accounts_account_id ON public.kwai_accounts(account_id);

-- =============================================
-- CAMPAIGNS
-- =============================================

CREATE TABLE public.campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.kwai_accounts(id) ON DELETE CASCADE NOT NULL,
  kwai_campaign_id BIGINT UNIQUE, -- ID da campanha no Kwai
  name TEXT NOT NULL,
  objective TEXT NOT NULL, -- 'APP', 'WEBSITE'
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'deleted', 'pending_review')),
  budget_type TEXT CHECK (budget_type IN ('daily', 'lifetime')),
  budget DECIMAL(15, 2),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  kwai_data JSONB, -- Dados completos retornados pela API do Kwai
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage campaigns in their accounts" 
  ON public.campaigns 
  USING (auth.uid() = user_id);

CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_account_id ON public.campaigns(account_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_kwai_id ON public.campaigns(kwai_campaign_id);

-- =============================================
-- AD SETS (Grupos de Anúncios)
-- =============================================

CREATE TABLE public.ad_sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  kwai_ad_set_id BIGINT UNIQUE, -- ID do ad set no Kwai (unit_id)
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'deleted', 'pending_review')),
  
  -- Targeting
  countries JSONB, -- Array de códigos de país
  age_groups JSONB, -- Array de faixas etárias
  genders JSONB, -- Array de gêneros
  languages JSONB, -- Array de idiomas
  device_prices JSONB, -- Array de faixas de preço
  operating_systems JSONB, -- Array de OS
  interests JSONB, -- Array de interesses
  
  -- Budget & Bidding
  budget_type TEXT CHECK (budget_type IN ('daily', 'lifetime')),
  budget DECIMAL(15, 2),
  bid_strategy TEXT CHECK (bid_strategy IN ('TARGET_COST', 'LOWEST_COST', 'COST_CAP')),
  bid_amount DECIMAL(15, 2),
  optimization_goal TEXT, -- 'ACTIVATION', 'PURCHASE', etc
  
  -- Placement
  placement JSONB, -- 'IN_FEED', 'REWARD'
  
  -- Schedule
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  
  kwai_data JSONB, -- Dados completos da API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ad sets in their campaigns" 
  ON public.ad_sets 
  USING (auth.uid() = user_id);

CREATE INDEX idx_ad_sets_user_id ON public.ad_sets(user_id);
CREATE INDEX idx_ad_sets_campaign_id ON public.ad_sets(campaign_id);
CREATE INDEX idx_ad_sets_status ON public.ad_sets(status);

-- =============================================
-- CREATIVES (Criativos)
-- =============================================

CREATE TABLE public.creatives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad_set_id UUID REFERENCES public.ad_sets(id) ON DELETE CASCADE NOT NULL,
  kwai_creative_id BIGINT UNIQUE, -- ID do criativo no Kwai
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'deleted', 'pending_review', 'rejected')),
  
  -- Creative Content
  title TEXT,
  description TEXT,
  call_to_action TEXT, -- 'INSTALL_NOW', 'DOWNLOAD', etc
  
  -- Assets (referências aos materiais)
  video_id UUID,
  thumbnail_url TEXT,
  
  -- Landing
  landing_page_url TEXT,
  app_id TEXT,
  
  -- Review
  review_status TEXT,
  review_message TEXT,
  
  kwai_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage creatives in their ad sets" 
  ON public.creatives 
  USING (auth.uid() = user_id);

CREATE INDEX idx_creatives_user_id ON public.creatives(user_id);
CREATE INDEX idx_creatives_ad_set_id ON public.creatives(ad_set_id);
CREATE INDEX idx_creatives_status ON public.creatives(status);

-- =============================================
-- MATERIALS (Vídeos, Imagens, Apps)
-- =============================================

CREATE TABLE public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.kwai_accounts(id) ON DELETE CASCADE NOT NULL,
  kwai_material_id BIGINT UNIQUE, -- ID do material no Kwai
  
  material_type TEXT NOT NULL CHECK (material_type IN ('video', 'image', 'app', 'avatar', 'playable')),
  name TEXT NOT NULL,
  url TEXT,
  thumbnail_url TEXT,
  
  -- Video/Image specific
  duration INTEGER, -- segundos
  width INTEGER,
  height INTEGER,
  file_size BIGINT, -- bytes
  format TEXT, -- 'mp4', 'jpg', etc
  
  -- App specific
  app_name TEXT,
  package_name TEXT,
  platform TEXT, -- 'android', 'ios'
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'processing', 'failed', 'deleted')),
  
  kwai_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage materials in their accounts" 
  ON public.materials 
  USING (auth.uid() = user_id);

CREATE INDEX idx_materials_user_id ON public.materials(user_id);
CREATE INDEX idx_materials_account_id ON public.materials(account_id);
CREATE INDEX idx_materials_type ON public.materials(material_type);

-- =============================================
-- CAMPAIGN STATS (Cache de métricas)
-- =============================================

CREATE TABLE public.campaign_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  
  -- Métricas principais
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  cost DECIMAL(15, 2) DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  
  -- Métricas calculadas
  ctr DECIMAL(10, 4), -- Click-through rate
  cpc DECIMAL(15, 4), -- Cost per click
  cpa DECIMAL(15, 4), -- Cost per acquisition
  
  -- Breakdown por país (opcional)
  country_code TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(campaign_id, date, country_code)
);

ALTER TABLE public.campaign_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view stats of their campaigns" 
  ON public.campaign_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_stats.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE INDEX idx_campaign_stats_campaign_id ON public.campaign_stats(campaign_id);
CREATE INDEX idx_campaign_stats_date ON public.campaign_stats(date);

-- =============================================
-- API LOGS (Auditoria)
-- =============================================

CREATE TABLE public.api_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs" 
  ON public.api_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX idx_api_logs_user_id ON public.api_logs(user_id);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at);
CREATE INDEX idx_api_logs_endpoint ON public.api_logs(endpoint);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kwai_tokens_updated_at BEFORE UPDATE ON public.kwai_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kwai_accounts_updated_at BEFORE UPDATE ON public.kwai_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_sets_updated_at BEFORE UPDATE ON public.ad_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creatives_updated_at BEFORE UPDATE ON public.creatives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

