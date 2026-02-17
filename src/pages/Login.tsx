import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STADSTHEATER_DOMAIN = "stadstheater.nl";

const Login = () => {
  const { session, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  const emailIsAllowed = email.toLowerCase().endsWith(`@${STADSTHEATER_DOMAIN}`);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!emailIsAllowed) {
      setError(`Alleen e-mailadressen met @${STADSTHEATER_DOMAIN} zijn toegestaan.`);
      return;
    }

    setIsSubmitting(true);

    if (mode === "magic") {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setMessage("Magic link verzonden. Controleer je inbox.");
      }
    } else if (mode === "password") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setMessage("Succesvol ingelogd.");
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Inloggen</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Gebruik je <strong>@{STADSTHEATER_DOMAIN}</strong>-account om toegang te krijgen.
        </p>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("magic")}
            className={`rounded px-3 py-2 text-sm border ${
              mode === "magic" ? "bg-primary text-primary-foreground" : "bg-background"
            }`}
          >
            Magic link
          </button>
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`rounded px-3 py-2 text-sm border ${
              mode === "password" ? "bg-primary text-primary-foreground" : "bg-background"
            }`}
          >
            Wachtwoord
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 bg-background"
              placeholder="naam@stadstheater.nl"
            />
          </div>

          {mode === "password" && (
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 bg-background"
              />
            </div>
          )}

          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-primary text-primary-foreground py-2 font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Bezig..." : mode === "magic" ? "Stuur magic link" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
