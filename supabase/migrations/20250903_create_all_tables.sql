-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  user_type TEXT CHECK (user_type IN ('campaign', 'donor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaigns table if not exists
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  wallet_address TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Setup wizard fields
  user_full_name TEXT,
  fec_committee_id TEXT,
  committee_name TEXT,
  committee_confirmed BOOLEAN DEFAULT false,
  bank_account_verified BOOLEAN DEFAULT false,
  bank_account_name TEXT,
  bank_last_four TEXT,
  plaid_account_id TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  terms_ip_address TEXT,
  setup_step INTEGER DEFAULT 1,
  setup_completed BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,
  website_analyzed TEXT,
  style_analysis JSONB,
  applied_styles JSONB,
  styles_applied BOOLEAN DEFAULT false,
  embed_code TEXT,
  embed_generated_at TIMESTAMPTZ
);

-- Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  donor_email TEXT,
  donor_name TEXT,
  amount DECIMAL(10,2) NOT NULL,
  transaction_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create error_log table (already exists based on error message)
CREATE TABLE IF NOT EXISTS public.error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Anyone can view active campaigns" 
  ON public.campaigns FOR SELECT 
  USING (status = 'active');

CREATE POLICY "Campaign owners can update their campaigns" 
  ON public.campaigns FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create campaigns" 
  ON public.campaigns FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Donations policies
CREATE POLICY "Anyone can view donations" 
  ON public.donations FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create donations" 
  ON public.donations FOR INSERT 
  WITH CHECK (true);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, user_type, created_at)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'user_type', 'donor'),
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();