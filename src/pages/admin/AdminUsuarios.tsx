import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, Modal, PageHeader } from '@/components/ui';
import { AdminUserService, type AdminCompanyOption, type AdminUser } from '@/services/admin-user-service';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminAccordionList } from '@/components/admin/AdminAccordionList';

type UserForm = { nome: string; telefone: string; email: string; password: string; empresaId: string };
const blankForm: UserForm = { nome: '', telefone: '', email: '', password: '', empresaId: '' };

export default function AdminUsuarios() {
  const { isAdmin } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompanyOption[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await AdminUserService.list();
      setUsers(result.users); setCompanies(result.companies);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar usuários.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => !term || `${user.nome} ${user.email} ${user.role} ${user.memberships.map((item) => item.empresa_nome).join(' ')}`.toLowerCase().includes(term));
  }, [users, search]);

  const newUser = () => { setEditing(null); setForm({ ...blankForm, empresaId: companies[0]?.id || '' }); setError(''); setOpen(true); };
  const editUser = (user: AdminUser) => { setEditing(user); setForm({ ...blankForm, nome: user.nome, telefone: user.telefone || '' }); setError(''); setOpen(true); };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      if (editing) await AdminUserService.update(editing.id, form.nome, form.telefone);
      else await AdminUserService.create(form.empresaId, form.email, form.password, form.nome);
      setOpen(false); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao salvar usuário.'); }
    finally { setSaving(false); }
  };

  const deleteUser = async (user: AdminUser) => {
    const membership = user.memberships.find((item) => item.role === 'vendedor');
    if (!membership || user.memberships.length !== 1 || !window.confirm(`Excluir a conta de ${user.nome} (${user.email})? Esta ação não pode ser desfeita.`)) return;
    setError('');
    try { await AdminUserService.delete(membership.empresa_id, user.id); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao excluir usuário.'); }
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader title="Usuários" description="Contas, dados de perfil e vínculos empresariais" actions={<div className="flex gap-2"><Button size="sm" variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>Atualizar</Button>{isAdmin && <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} disabled={!companies.length} onClick={newUser}>Novo vendedor</Button>}</div>} />
      {error && !open && <div className="rounded-xl border border-erro/30 bg-erro/10 p-4 text-sm text-erro" role="alert">{error}</div>}
      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-border-color p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" /><Input aria-label="Buscar usuários" placeholder="Buscar nome, e-mail ou empresa..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" /></div></div>
        {loading ? <p className="p-8 text-center text-sm text-text-secondary">Carregando usuários…</p> : filtered.length === 0 ? <div className="p-8"><EmptyState title="Nenhum usuário" description="As contas disponíveis aparecerão aqui." icon={<Users className="h-6 w-6" />} /></div> : (
          <>
          <AdminAccordionList items={filtered.map((user) => ({
            id: user.id,
            title: user.nome || 'Usuário sem nome',
            subtitle: user.email,
            details: [
              { label: 'Papel', value: user.role },
              { label: 'Empresas', value: user.memberships.map((membership) => membership.empresa_nome).join(', ') || 'Sem vínculo' },
              ...(user.telefone ? [{ label: 'Telefone', value: user.telefone }] : []),
            ],
            actions: isAdmin ? <UserActions user={user} canDelete={user.role === 'vendedor' && user.memberships.length === 1 && user.memberships[0]?.role === 'vendedor'} onEdit={editUser} onDelete={(selected) => void deleteUser(selected)} /> : undefined,
          }))} />
          <div className="hidden overflow-x-hidden lg:block"><table className="w-full table-fixed text-left text-sm"><thead><tr className="border-b border-border-color bg-bg-secondary/50 text-text-secondary"><th className="w-[28%] px-4 py-3 font-medium">Usuário</th><th className="w-[16%] px-4 py-3 font-medium">Papel</th><th className="px-4 py-3 font-medium">Empresas</th>{isAdmin && <th className="w-28 px-4 py-3 text-right font-medium">Ações</th>}</tr></thead><tbody>
            {filtered.map((user) => { const canDelete = user.role === 'vendedor' && user.memberships.length === 1 && user.memberships[0]?.role === 'vendedor'; return <tr key={user.id} className="border-b border-border-color last:border-0 hover:bg-bg-secondary/40"><td className="px-4 py-3"><p className="font-medium">{user.nome || '—'}</p><p className="text-xs text-text-secondary">{user.email}</p>{user.telefone && <p className="text-xs text-text-secondary">{user.telefone}</p>}</td><td className="px-4 py-3"><Badge variant={user.role === 'admin' ? 'brand' : 'neutral'}>{user.role}</Badge></td><td className="max-w-64 px-4 py-3 text-text-secondary">{user.memberships.map((membership) => membership.empresa_nome).join(', ') || 'Sem vínculo'}</td>{isAdmin && <td className="whitespace-nowrap px-4 py-3 text-right"><Button variant="ghost" size="sm" aria-label={`Editar ${user.nome}`} onClick={() => editUser(user)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" aria-label={`Excluir ${user.nome}`} disabled={!canDelete} title={canDelete ? 'Excluir conta' : 'Apenas contas de vendedor vinculadas a uma única empresa podem ser excluídas por este fluxo'} onClick={() => void deleteUser(user)}><Trash2 className="h-4 w-4 text-erro" /></Button></td>}</tr>; })}
          </tbody></table></div>
          </>
        )}
      </Card>
      {isAdmin && <Modal open={open} onClose={() => !saving && setOpen(false)} title={editing ? 'Editar usuário' : 'Criar usuário vendedor'} footer={<><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button form="admin-user-form" type="submit" loading={saving}>{editing ? 'Salvar alterações' : 'Criar usuário'}</Button></>}>
        <form id="admin-user-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">{error && <div className="sm:col-span-2 rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{error}</div>}
          <Input label="Nome" required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} />
          {editing ? <Input label="Telefone" type="tel" value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /> : <>
            <Input label="E-mail" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <Input label="Senha inicial" type="password" minLength={8} required hint="Mínimo de 8 caracteres." value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <div className="sm:col-span-2"><label htmlFor="new-user-company" className="mb-1.5 block text-sm font-medium">Empresa</label><select id="new-user-company" className="w-full rounded-xl border border-border-color bg-bg-secondary px-3 py-2.5 text-sm" required value={form.empresaId} onChange={(event) => setForm({ ...form, empresaId: event.target.value })}><option value="">Selecione a empresa…</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.nome}</option>)}</select><p className="mt-1 text-xs text-text-secondary">A conta criada terá papel de vendedor na empresa selecionada.</p></div>
          </>}
        </form>
      </Modal>}
    </div>
  );
}

function UserActions({ user, canDelete, onEdit, onDelete }: { user: AdminUser; canDelete: boolean; onEdit: (user: AdminUser) => void; onDelete: (user: AdminUser) => void }) {
  return <>
    <Button variant="outline" size="sm" leftIcon={<Pencil className="h-4 w-4" />} aria-label={`Editar ${user.nome}`} onClick={() => onEdit(user)}>Editar</Button>
    <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4 text-erro" />} aria-label={`Excluir ${user.nome}`} disabled={!canDelete} title={canDelete ? 'Excluir conta' : 'Apenas contas de vendedor vinculadas a uma única empresa podem ser excluídas por este fluxo'} onClick={() => onDelete(user)}>Excluir</Button>
  </>;
}
