import { useState } from 'react';
import { Button, Input, Card, PageHeader } from '@/components/ui';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminSeguranca() {
  const { updatePassword, updateUsername, credentialsUsername } = useAdminAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [newUser, setNewUser] = useState(credentialsUsername);
  const [userPass, setUserPass] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (next !== confirm) {
      setErr('A confirmação não confere com a nova senha.');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(current, next);
      setMsg('Senha alterada com sucesso.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  const onChangeUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setLoading(true);
    try {
      await updateUsername(newUser, userPass);
      setMsg('Usuário admin atualizado.');
      setUserPass('');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao alterar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Segurança" description="Altere o usuário e a senha do painel admin" />

      {(msg || err) && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            err ? 'text-erro bg-erro/10' : 'text-brand bg-brand/10'
          }`}
          role="status"
        >
          {err || msg}
        </p>
      )}

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Alterar senha</h2>
        <p className="text-xs text-text-secondary">
          Padrão inicial: usuário <strong>admin</strong> · senha <strong>123</strong>
        </p>
        <form onSubmit={onChangePassword} className="space-y-3">
          <Input label="Senha atual" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
          <Input label="Nova senha" type="password" value={next} onChange={(e) => setNext(e.target.value)} required autoComplete="new-password" />
          <Input label="Confirmar nova senha" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          <Button type="submit" loading={loading}>
            Salvar nova senha
          </Button>
        </form>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Alterar usuário admin</h2>
        <form onSubmit={onChangeUser} className="space-y-3">
          <Input label="Novo usuário" value={newUser} onChange={(e) => setNewUser(e.target.value)} required />
          <Input label="Confirme com a senha atual" type="password" value={userPass} onChange={(e) => setUserPass(e.target.value)} required />
          <Button type="submit" variant="outline" loading={loading}>
            Atualizar usuário
          </Button>
        </form>
      </Card>
    </div>
  );
}
