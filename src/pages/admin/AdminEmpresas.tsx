import { useEffect, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Badge,
  Input,
} from "@/components/ui";
import { supabase } from "@/lib/supabase/client";

type EmpresaRow = {
  id: string;
  nome: string;
  cnpj: string | null;
  created_at?: string;
};

export default function AdminEmpresas() {
  const [rows, setRows] = useState<EmpresaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase.rpc("admin_list_empresas");
      if (err) throw err;
      setRows((data as EmpresaRow[]) || []);
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Falha ao carregar empresas (RLS pode bloquear anon).",
      );
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
      r.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (r.cnpj || "").includes(busca),
  );

  return (
    <div className="max-w-6xl space-y-4">
      <PageHeader
        title="Empresas"
        description="Todos os tenants da plataforma"
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

      {error && (
        <Card className="p-4 text-sm text-aviso border-aviso/30">
          {error}
          <p className="text-xs mt-1 text-text-secondary">
            Com RLS restritiva, o admin anônimo pode não listar tudo. Use
            service role no backend em produção.
          </p>
        </Card>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-color">
          <Input
            placeholder="Buscar empresa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="min-h-11 w-full sm:max-w-sm"
          />
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-text-secondary">
            Carregando…
          </p>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Nenhuma empresa"
              description="Empresas cadastradas aparecerão aqui."
              icon={<Building2 className="w-6 h-6" />}
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-border-color md:hidden">
              {filtered.map((r) => (
                <article key={r.id} className="p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <h2 className="min-w-0 break-words text-sm font-semibold text-text-primary">
                      {r.nome}
                    </h2>
                    <Badge variant="success">ativa</Badge>
                  </div>
                  <details className="group mt-3">
                    <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-medium text-brand [&::-webkit-details-marker]:hidden">
                      Ver dados da empresa
                    </summary>
                    <dl className="grid gap-3 rounded-xl bg-bg-secondary p-3 text-sm">
                      <div>
                        <dt className="text-xs text-text-secondary">CNPJ</dt>
                        <dd className="mt-1 break-words text-text-primary">
                          {r.cnpj || "Não informado"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-secondary">ID</dt>
                        <dd className="mt-1 break-all font-mono text-xs text-text-primary">
                          {r.id}
                        </dd>
                      </div>
                    </dl>
                  </details>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <thead>
                  <tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50">
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">CNPJ</th>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40"
                    >
                      <td className="px-4 py-3 font-medium">{r.nome}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        {r.cnpj || "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {r.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="success">ativa</Badge>
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
