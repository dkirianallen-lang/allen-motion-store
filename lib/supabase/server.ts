import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";


type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    path?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
    priority?: "low" | "medium" | "high";
  };
};


export async function createClient() {
  const cookieStore = await cookies();


  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },


        setAll(
          cookiesToSet: CookieToSet[]
        ) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set({
                  name,
                  value,
                  ...options,
                });
              }
            );
          } catch {
            // Server Components may not be able
            // to write cookies directly.
          }
        },
      },
    }
  );
}
