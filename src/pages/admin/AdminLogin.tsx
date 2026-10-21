import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Card } from "@/components/ui";
import { Lock, User } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { BRAND } from "@/lib/brand";

export default function AdminLogin() {
  const [email, setEmail] = useState("sac.canal360@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAdmin) navigate("/admin", { replace: true });
  }, [isAdmin, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha no login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100svh] w-full flex items-start sm:items-center justify-center bg-transparent overflow-x-clip px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
      <Card className="w-full max-w-md !border-transparent !bg-transparent !shadow-none p-4 sm:p-6 md:p-8">
        <div className="text-center mb-6 sm:mb-8 space-y-3">
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className="mx-auto h-auto max-h-[min(15svh,104px)] w-full max-w-[min(100%,280px)] object-contain"
          />
          <div>
            <p className="text-xs uppercase tracking-widest text-brand font-semibold">
              Painel Admin
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Acesso restrito à administração da plataforma
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail administrativo"
            type="email"
            className="min-h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            className="min-h-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="current-password"
          />
          {error && (
            <p
              className="text-sm text-erro bg-erro/10 rounded-lg px-3 py-2"
              role="alert"
            >
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            Entrar no admin
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-text-secondary">
          <Link to="/" className="text-brand hover:underline">
            ← Voltar ao site
          </Link>
        </p>
      </Card>
    </main>
  );
}
