import {createClient} from '@supabase/supabase-js';
export function getPublicSupabase(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new Error('Supabase 환경변수 누락');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
