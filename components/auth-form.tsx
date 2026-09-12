"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!hasSupabaseEnv()) {
      router.push("/dashboard");
      return;
    }

    try {
      const supabase = createClient();
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { data: { full_name: fullName } },
            });

      setLoading(false);

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (mode === "signup" && !result.data.session) {
        setMessage(
          "Account created! Please check your email for a confirmation link before signing in (or disable 'Confirm email' in Supabase Auth settings).",
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setLoading(false);
      setMessage(err?.message || "An unexpected error occurred.");
    }
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-7">
      {mode === "signup" && (
        <label className="block">
          <span className="micro-label">FULL NAME</span>
          <input
            className="field mt-2"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>
      )}
      <label className="block">
        <span className="micro-label">EMAIL</span>
        <input
          className="field mt-2"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="micro-label">PASSWORD</span>
        <input
          className="field mt-2"
          type="password"
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {message && <p className="text-sm text-[#7a4d27]">{message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "PLEASE WAIT"
            : mode === "signin"
              ? "SIGN IN"
              : "CREATE ACCOUNT"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "CREATE ACCOUNT" : "I HAVE AN ACCOUNT"}
        </Button>
      </div>
      {!hasSupabaseEnv() && (
        <p className="text-xs leading-5 text-[#746d64]">
          Supabase env vars are not configured, so sign in opens the local demo
          workspace.
        </p>
      )}
    </form>
  );
}
