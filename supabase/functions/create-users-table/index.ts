// Edge Function to create users table with elevated permissions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a supabase client with service role key
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SQL to create users table
    const createUsersTableSQL = `
      -- Create users table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          full_name TEXT NOT NULL,
          phone TEXT,
          company TEXT,
          job_title TEXT,
          email_confirmed BOOLEAN DEFAULT false,
          email_confirmed_at TIMESTAMPTZ,
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
          permissions TEXT[] DEFAULT ARRAY['view'],
          last_login_at TIMESTAMPTZ,
          login_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

      -- Enable RLS
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
      CREATE POLICY "Users can view own profile" ON public.users
          FOR SELECT USING (auth.uid()::text = id::text);

      DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
      CREATE POLICY "Users can create own profile" ON public.users
          FOR INSERT WITH CHECK (auth.uid()::text = id::text);

      DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
      CREATE POLICY "Users can update own profile" ON public.users
          FOR UPDATE USING (auth.uid()::text = id::text);

      -- Create update trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger for users table
      DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
      CREATE TRIGGER update_users_updated_at 
          BEFORE UPDATE ON public.users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- Function to handle auth user creation
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO public.users (id, email, full_name, email_confirmed, email_confirmed_at)
          VALUES (
              NEW.id,
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
              NEW.email_confirmed_at IS NOT NULL,
              NEW.email_confirmed_at
          );
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create trigger on auth.users
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    // Execute the SQL with service role permissions
    const { data, error } = await supabaseServiceRole.rpc('exec', {
      query: createUsersTableSQL,
    });

    if (error) {
      throw error;
    }

    // Test that the table was created
    const { data: testData, error: testError } = await supabaseServiceRole
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (testError) {
      throw new Error(`Table creation failed: ${testError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Users table created successfully',
        tableExists: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
