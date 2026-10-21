import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, FileText, Activity, ArrowRight } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { supabase } from "@/lib/supabase/client";

type Counts = { companies: number; users: number; contracts: number };

export default function AdminDashboard() {
  const { session } = useAdminAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase
      .rpc("admin_dashboard_counts")
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        else setCounts(data as Counts);
      });
    return () => {
      active = false;
    };
  }, []);

  const kpis = [
    {
      label: "Empresas",
      value: counts?.companies ?? "-",
      icon: Building2,
      hint: "Contas na plataforma",
    },
    {
      label: "Usu�rios",
      value: counts?.users ?? "-",
      icon: Users,
      hint: "Perfis cadastrados",
    },
    {
      label: "Contratos",
      value: counts?.contracts ?? "-",
      icon: FileText,
      hint: "Volume global",
    },
    {
      label: "Sa�de",
      value: error ? "Falha" : counts ? "OK" : ".",
      icon: Activity,
      hint: "Conex�o com o banco",
    },
  ];

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <PageHeader
        title="Visao geral"
        description={`Bem-vindo, ${session?.username}. Acesso administrativo autorizado.`}
      />

      {error && (
        <Card className="p-4 text-sm text-aviso">
          N�o foi poss�vel carregar os indicadores: {error}
        </Card>
      )}

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="min-w-0 p-3 card-premium sm:p-4">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-secondary">
                  {k.label}
                </p>
                <p className="text-2xl font-bold mt-1">{k.value}</p>
                <p className="mt-1 break-words text-xs text-text-secondary">
                  {k.hint}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand sm:h-10 sm:w-10">
                <k.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 space-y-3 p-4 sm:p-5">
          <h2 className="font-semibold">A��es r�pidas</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              { to: "/admin/empresas", label: "Gerenciar empresas" },
              { to: "/admin/usuarios", label: "Ver usu�rios" },
              { to: "/admin/seguranca", label: "Alterar senha" },
              { to: "/admin/auditoria", label: "Abrir auditoria" },
            ].map((action) => (
              <li key={action.to}>
                <Link
                  to={action.to}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border-color px-3 py-2 text-sm font-medium text-text-primary hover:border-brand/40 hover:bg-bg-secondary"
                >
                  <span>{action.label}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-brand"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="min-w-0 space-y-3 p-4 sm:p-5">
          <h2 className="font-semibold">Status da sessao</h2>
          <div className="flex items-center gap-2">
            <Badge variant="success">Admin autenticado</Badge>
          </div>
          <details className="group">
            <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-medium text-brand [&::-webkit-details-marker]:hidden">
              Ver informa��es da sess�o
            </summary>
            <div className="space-y-2 rounded-xl bg-bg-secondary p-3">
              <p className="break-words text-sm text-text-secondary">
                Login em{" "}
                {session?.loggedAt
                  ? new Date(session.loggedAt).toLocaleString("pt-BR")
                  : "-"}
              </p>
              <p className="text-xs text-text-secondary">
                A conta administrativa � autenticada pelo Supabase e autorizada
                pela lista de administradores da plataforma.
              </p>
            </div>
          </details>
        </Card>
      </div>
    </div>
  );
}

