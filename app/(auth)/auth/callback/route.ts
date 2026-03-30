import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const user = data.user

      if (user) {

        const { error: profileError } = await supabase
          .from("user_profile")
          .upsert({
            auth_user: user.id,
            email: user.email ?? null,
            fullname: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
            username: user.email?.split("@")[0], 
            image: user.user_metadata.avatar_url ?? user.user_metadata.picture,
          })

        if (profileError) {
          console.error("Profile insert error:", profileError)
        }
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
