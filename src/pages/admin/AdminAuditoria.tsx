import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui";
import { supabase } from "@/lib/supabase/client";

type AuditEvent = {
  id: string;
  email: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

export default function AdminAuditoria() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase
      .rpc("admin_list_audit", { p_limit: 200 })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        else setLogs((data || []) as AuditEvent[]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader
        title="Auditoria"
        description="Eventos administrativos da plataforma"
      />
      {error && (
        <Card className="p-4 text-sm text-aviso">
          Falha ao carregar a auditoria: {error}
        </Card>
      )}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-text-secondary">
            Carregando eventos.
          </p>
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Sem eventos"
              description="A��es do admin aparecer�o aqui."
              icon={<Shield className="w-6 h-6" />}
            />
          </div>
        ) : (
          <ul className="divide-y divide-border-color">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex min-w-0 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-4"
              >
                <Badge variant="info" className="max-w-full break-words">
                  {log.action}
                </Badge>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="break-words">{log.email || "Administrador"}</p>
                  {Object.keys(log.details || {}).length > 0 && (
                    <details className="group mt-1">
                      <summary className="min-h-11 cursor-pointer list-none py-2 text-xs font-medium text-brand [&::-webkit-details-marker]:hidden">
                        Ver detalhes do evento
                      </summary>
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-bg-secondary p-3 text-xs text-text-secondary">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <time
                  className="text-xs text-text-secondary sm:whitespace-nowrap"
                  dateTime={log.created_at}
                >
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

