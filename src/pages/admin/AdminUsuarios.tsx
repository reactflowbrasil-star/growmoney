import { useEffect, useState } from "react";
import { Users, RefreshCw } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Badge,
  Input,
} from "@/components/ui";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string | null;
  nome: string | null;
  role: string | null;
};

export default function AdminUsuarios() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase.rpc("admin_list_profiles");
      if (err) throw err;
      setRows((data as Profile[]) || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Falha ao carregar usu�rios.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter(
    (r) =>
      (r.nome || "").toLowerCase().includes(busca.toLowerCase()) ||
      (r.email || "").toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="max-w-6xl space-y-4">
      <PageHeader
        title="Usu�rios"
        description="Contas cadastradas na plataforma"
        actions={
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={load}
          >
            Atualizar
          </Button>
        }
      />
      {error && <Card className="p-4 text-sm text-aviso">{error}</Card>}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-color">
          <Input
            placeholder="Buscar usu�rio..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="min-h-11 w-full sm:max-w-sm"
          />
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-text-secondary">
            Carregando.
          </p>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Nenhum usu�rio"
              description="Perfis aparecer�o ap�s cadastros."
              icon={<Users className="w-6 h-6" />}
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-border-color md:hidden">
              {filtered.map((r) => (
                <article key={r.id} className="p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-sm font-semibold text-text-primary">
                        {r.nome || "Sem nome"}
                      </h2>
                      <p className="mt-1 break-all text-xs text-text-secondary">
                        {r.email || "E-mail n�o informado"}
                      </p>
                    </div>
                    <Badge variant={r.role === "admin" ? "brand" : "neutral"}>
                      {r.role || "user"}
                    </Badge>
                  </div>
                  <details className="group mt-2">
                    <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-medium text-brand [&::-webkit-details-marker]:hidden">
                      Ver identificador
                    </summary>
                    <p className="break-all rounded-xl bg-bg-secondary p-3 font-mono text-xs text-text-secondary">
                      {r.id}
                    </p>
                  </details>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50">
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">E-mail</th>
                    <th className="px-4 py-3 font-medium">Papel</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border-color last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">{r.nome || "-"}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {r.email || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={r.role === "admin" ? "brand" : "neutral"}
                        >
                          {r.role || "user"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

