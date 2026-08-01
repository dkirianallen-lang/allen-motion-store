import { redirect } from "next/navigation";


import { createClient } from "@/lib/supabase/server";
import { login } from "./actions";


type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};


export default async function AdminLoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;


  const supabase = await createClient();


  const {
    data: { user },
  } = await supabase.auth.getUser();


  const adminEmail =
    process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();


  const signedInEmail =
    user?.email?.trim().toLowerCase();


  if (
    signedInEmail &&
    adminEmail &&
    signedInEmail === adminEmail
  ) {
    redirect("/admin/orders");
  }


  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#f5eadf",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        action={login}
        style={{
          width: "100%",
          maxWidth: "430px",
          border: "1px solid #5a4632",
          background: "#171717",
          padding: "36px",
        }}
      >
        <p
          style={{
            color: "#c79a55",
            letterSpacing: "0.18em",
            fontWeight: 700,
            marginTop: 0,
          }}
        >
          ALLEN MOTION CO.
        </p>


        <h1
          style={{
            marginBottom: "8px",
          }}
        >
          Owner Login
        </h1>


        <p
          style={{
            color: "#cfc4b8",
            marginBottom: "28px",
          }}
        >
          Sign in to view customer orders.
        </p>


        <label
          htmlFor="email"
          style={{
            display: "block",
            marginBottom: "8px",
          }}
        >
          Email
        </label>


        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px",
            marginBottom: "20px",
            background: "#0f0f0f",
            color: "#fff",
            border: "1px solid #5a4632",
          }}
        />


        <label
          htmlFor="password"
          style={{
            display: "block",
            marginBottom: "8px",
          }}
        >
          Password
        </label>


        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px",
            marginBottom: "20px",
            background: "#0f0f0f",
            color: "#fff",
            border: "1px solid #5a4632",
          }}
        />


        {error && (
          <p
            style={{
              padding: "12px",
              border: "1px solid #9c4d4d",
              color: "#ffd6d6",
              marginBottom: "20px",
            }}
          >
            {error}
          </p>
        )}


        <button
          type="submit"
          style={{
            width: "100%",
            padding: "15px",
            background: "#c79a55",
            color: "#111",
            border: 0,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          SIGN IN
        </button>
      </form>
    </main>
  );
}
