import { useEffect, useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { Button, Card, EmptyState, PageHeader, Badge, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';

type Profile = {
  id: string;
  email: string | null;
  nome: string | null;
  role: string | null;
};

export default function AdminUsuarios() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, nome, role')
        .order('nome')
        .limit(300);
      if (err) throw err;
      setRows((data as Profile[]) || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar usuários.');
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
      (r.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-6xl space-y-4">
      <PageHeader
        title="Usuários"
        description="Contas cadastradas na plataforma"
        actions={
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={load}>
            Atualizar
          </Button>
        }
      />
      {error && <Card className="p-4 text-sm text-aviso">{error}</Card>}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-color">
          <Input
            placeholder="Buscar usuário..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-text-secondary">Carregando…</p>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Nenhum usuário"
              description="Perfis aparecerão após cadastros."
              icon={<Users className="w-6 h-6" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-text-secondary border-b border-border-color bg-bg-secondary/50">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">E-mail</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border-color last:border-0">
                    <td className="px-4 py-3 font-medium">{r.nome || '—'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-text-secondary">{r.email || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.role === 'admin' ? 'brand' : 'neutral'}>{r.role || 'user'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
