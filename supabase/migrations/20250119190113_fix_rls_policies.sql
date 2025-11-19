-- Fix RLS policies for all tables

-- kwai_accounts policies
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.kwai_accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.kwai_accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.kwai_accounts;

CREATE POLICY "Users can insert their own accounts" 
  ON public.kwai_accounts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" 
  ON public.kwai_accounts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" 
  ON public.kwai_accounts FOR DELETE 
  USING (auth.uid() = user_id);

-- campaigns policies  
DROP POLICY IF EXISTS "Users can insert their campaigns" ON public.campaigns;
CREATE POLICY "Users can insert their campaigns" 
  ON public.campaigns FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ad_sets policies
DROP POLICY IF EXISTS "Users can insert their ad_sets" ON public.ad_sets;
CREATE POLICY "Users can insert their ad_sets" 
  ON public.ad_sets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- creatives policies
DROP POLICY IF EXISTS "Users can insert their creatives" ON public.creatives;
CREATE POLICY "Users can insert their creatives" 
  ON public.creatives FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- materials policies
DROP POLICY IF EXISTS "Users can insert their materials" ON public.materials;
CREATE POLICY "Users can insert their materials" 
  ON public.materials FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

