"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseEnv()) {
      setMessage("Connect Supabase to send password reset emails.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });

    setMessage(error ? error.message : "Reset email sent.");
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-7">
      <label className="block">
        <span className="micro-label">EMAIL</span>
        <input className="field mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      {message && <p className="text-sm text-[#746d64]">{message}</p>}
      <Button type="submit">SEND RESET LINK</Button>
    </form>
  );
}
