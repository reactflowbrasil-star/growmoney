import { useState } from "react";
import { Button, Input, Card, PageHeader } from "@/components/ui";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { ChevronDown } from "lucide-react";

export default function AdminSeguranca() {
  const { updatePassword, updateEmail, accountEmail } = useAdminAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [newEmail, setNewEmail] = useState(accountEmail);
  const [emailPassword, setEmailPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    if (next !== confirm) {
      setErr("A confirmacao nao confere com a nova senha.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(current, next);
      setMsg("Senha alterada com sucesso.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  };

  const onChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);
    try {
      await updateEmail(newEmail, emailPassword);
      setMsg("Solicitacao enviada. Confirme o novo e-mail pelo link recebido.");
      setEmailPassword("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao atualizar e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title="Seguran�a"
        description="Gerencie a conta administrativa do Supabase"
      />

      {(msg || err) && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            err ? "text-erro bg-erro/10" : "text-brand bg-brand/10"
          }`}
          role="status"
        >
          {err || msg}
        </p>
      )}

      <Card padding="none" className="overflow-hidden">
        <details open className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-text-primary sm:px-5 [&::-webkit-details-marker]:hidden">
            <span>Alterar senha</span>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="space-y-4 border-t border-border-color p-4 sm:p-5">
            <p className="text-xs text-text-secondary">
              Use uma senha com pelo menos 12 caracteres.
            </p>
            <form onSubmit={onChangePassword} className="space-y-3">
              <Input
                className="min-h-11"
                label="Senha atual"
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Input
                className="min-h-11"
                label="Nova senha"
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
              />
              <Input
                className="min-h-11"
                label="Confirmar nova senha"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={12}
                autoComplete="new-password"
              />
              <Button
                className="min-h-11 w-full sm:w-auto"
                type="submit"
                loading={loading}
              >
                Salvar nova senha
              </Button>
            </form>
          </div>
        </details>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-text-primary sm:px-5 [&::-webkit-details-marker]:hidden">
            <span>Alterar e-mail administrativo</span>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="space-y-4 border-t border-border-color p-4 sm:p-5">
            <p className="break-all text-xs text-text-secondary">
              Conta atual: {accountEmail || "-"}
            </p>
            <form onSubmit={onChangeEmail} className="space-y-3">
              <Input
                className="min-h-11"
                label="Novo e-mail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                className="min-h-11"
                label="Confirme com a senha atual"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Button
                className="min-h-11 w-full sm:w-auto"
                type="submit"
                variant="outline"
                loading={loading}
              >
                Atualizar e-mail
              </Button>
            </form>
          </div>
        </details>
      </Card>
    </div>
  );
}

