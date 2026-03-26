import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-stadstheater-wit.png";

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
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Stadstheater Zoetermeer" className="h-8 opacity-80" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-serif tracking-tight text-card-foreground">
              Welkom bij ShowReady
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Log in met je <strong className="text-card-foreground">@{STADSTHEATER_DOMAIN}</strong>-account
            </p>
          </div>

          {/* Auth mode toggle */}
          <div className="mb-6 flex gap-1 p-1 rounded-lg bg-accent/30">
            <button
              type="button"
              onClick={() => setMode("magic")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                mode === "magic"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              Magic link
            </button>
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                mode === "password"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              Wachtwoord
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-card-foreground">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
                placeholder="naam@stadstheater.nl"
              />
            </div>

            {mode === "password" && (
              <div className="space-y-1.5 animate-fade-in">
                <label htmlFor="password" className="text-sm font-medium text-card-foreground">
                  Wachtwoord
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
                />
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 rounded-lg bg-status-done/10 border border-status-done/20 px-4 py-3 animate-fade-in">
                <p className="text-sm text-status-done">{message}</p>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 animate-fade-in">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-semibold transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Bezig...
                </span>
              ) : mode === "magic" ? (
                "Stuur magic link"
              ) : (
                "Inloggen"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Stadstheater Zoetermeer &middot; ShowReady
        </p>
      </div>
    </div>
  );
};

export default Login;
