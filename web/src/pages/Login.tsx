import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button, Card, CardBody, Input } from "@/components/ui";

export function LoginPage() {
  const { identity, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (identity) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/assets/asla-full-white.png" alt="ASLA" className="h-10 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white tracking-wide uppercase">Business Council</h1>
          <p className="mt-2 text-sm text-white/60">Sign in to access your council portal</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                error={error}
              />
              <Button type="submit" disabled={submitting} className="w-full mt-2">
                {submitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
