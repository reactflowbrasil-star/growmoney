import { useCallback, useEffect, useState } from 'react';
import { Download, FileJson, Mail, RefreshCw, Server, Upload } from 'lucide-react';
import { Button, Card, Input, PageHeader, Badge } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { AdminSystemBackupService, type ImportPreview } from '@/services/admin-system-backup-service';
import { AdminSmtpService, type SmtpSettings } from '@/services/admin-smtp-service';

type SmtpForm = Omit<SmtpSettings, 'passwordConfigured'> & { password: string };
const emptySmtp: SmtpForm = { host: '', port: 465, secure: true, username: '', password: '', fromEmail: '', fromName: 'GrowMoney', enabled: false };

export default function AdminSistema() {
  const envOk = Boolean(import.meta.env.VITE_SUPABASE_URL);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<{ name: string; result: ImportPreview; input: unknown } | null>(null);
  const [transferError, setTransferError] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  const [smtp, setSmtp] = useState<SmtpForm>(emptySmtp);
  const [passwordConfigured, setPasswordConfigured] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [smtpError, setSmtpError] = useState('');
  const [smtpNotice, setSmtpNotice] = useState('');

  const loadSmtp = useCallback(async () => {
    setSmtpLoading(true);
    setSmtpError('');
    try {
      const settings = await AdminSmtpService.getSettings();
      if (settings) {
        setSmtp({ host: settings.host, port: settings.port, secure: settings.secure, username: settings.username, password: '', fromEmail: settings.fromEmail, fromName: settings.fromName, enabled: settings.enabled });
        setPasswordConfigured(settings.passwordConfigured);
      } else {
        setSmtp(emptySmtp);
        setPasswordConfigured(false);
      }
    } catch (error) {
      setSmtpError(error instanceof Error ? error.message : 'Não foi possível carregar a configuração SMTP.');
    } finally {
      setSmtpLoading(false);
    }
  }, []);

  useEffect(() => { void loadSmtp(); }, [loadSmtp]);

  const updateSmtp = <K extends keyof SmtpForm>(key: K, value: SmtpForm[K]) => setSmtp((current) => ({ ...current, [key]: value }));

  const saveSmtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setSmtpSaving(true); setSmtpError(''); setSmtpNotice('');
    try {
      await AdminSmtpService.saveSettings({ ...smtp, clearPassword: false });
      setPasswordConfigured(true);
      setSmtp((current) => ({ ...current, password: '' }));
      setSmtpNotice('Configuração SMTP salva. A senha foi armazenada com proteção no servidor.');
    } catch (error) {
      setSmtpError(error instanceof Error ? error.message : 'Não foi possível salvar a configuração SMTP.');
    } finally {
      setSmtpSaving(false);
    }
  };

  const testSmtp = async () => {
    setSmtpTesting(true); setSmtpError(''); setSmtpNotice('');
    try { setSmtpNotice(await AdminSmtpService.testConnection()); }
    catch (error) { setSmtpError(error instanceof Error ? error.message : 'Falha ao validar o servidor SMTP.'); }
    finally { setSmtpTesting(false); }
  };

  const sendTestEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setTestSending(true); setSmtpError(''); setSmtpNotice('');
    try { setSmtpNotice(await AdminSmtpService.sendTestEmail(testRecipient.trim())); }
    catch (error) { setSmtpError(error instanceof Error ? error.message : 'Falha ao enviar e-mail de teste.'); }
    finally { setTestSending(false); }
  };

  const downloadBackup = async () => {
    setExporting(true);
    setTransferError('');
    try {
      const backup = await AdminSystemBackupService.exportFullSystemBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `growmoney-backup-${backup.createdAt.slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Não foi possível exportar os dados.');
    } finally {
      setExporting(false);
    }
  };

  const validateBackup = async (file?: File) => {
    setPreview(null);
    setTransferError('');
    if (!file) return;
    try {
      const input: unknown = JSON.parse(await file.text());
      setPreview({ name: file.name, result: AdminSystemBackupService.validateSystemBackup(input), input });
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Não foi possível ler o arquivo selecionado.');
    }
  };

  const restoreBackup = async () => {
    if (!preview?.result.valid || !preview.result.canApply || transferBusy) return;
    const confirmed = window.confirm('Atenção: a restauração substituirá em uma única transação os dados operacionais atuais. Esta ação não pode ser desfeita. Usuários, permissões administrativas, auditoria e configuração SMTP serão preservados.');
    if (!confirmed) return;
    const phrase = window.prompt('Para autorizar, digite exatamente: RESTAURAR E SUBSTITUIR DADOS');
    if (phrase === null) return;
    setTransferBusy(true); setTransferError('');
    try {
      const result = await AdminSystemBackupService.restoreSystemBackup(preview.input, phrase);
      setPreview(null);
      window.alert(`Restauração concluída: ${result.recordCount.toLocaleString('pt-BR')} registros importados.`);
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Não foi possível restaurar o backup. Nenhuma alteração parcial foi mantida.');
    } finally { setTransferBusy(false); }
  };

  const clearAllSystemData = async () => {
    if (transferBusy) return;
    const confirmed = window.confirm('ATENÇÃO: esta ação é irreversível. Todos os cadastros e dados operacionais serão apagados. Usuários, logins, permissões administrativas, auditoria e SMTP serão preservados. Os binários de arquivos já armazenados também serão preservados.');
    if (!confirmed) return;
    const phrase = window.prompt('Para confirmar a exclusão, digite exatamente: APAGAR TODOS OS DADOS');
    if (phrase === null) return;
    setTransferBusy(true); setTransferError('');
    try {
      const result = await AdminSystemBackupService.clearSystemData(phrase);
      setPreview(null);
      window.alert(`Limpeza concluída. ${Object.values(result.deleted).reduce((sum, count) => sum + count, 0).toLocaleString('pt-BR')} registros operacionais removidos.`);
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Não foi possível apagar os dados do sistema.');
    } finally { setTransferBusy(false); }
  };

  return (
    <div className="max-w-3xl space-y-4 sm:space-y-5">
      <PageHeader title="Sistema" description="Configuração e saúde da plataforma" />
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Identidade</h2>
        <div className="flex flex-col xs:flex-row xs:items-center gap-3 sm:gap-4">
          <BrandLogo linkTo={false} heightClass="h-14" className="max-w-[180px] self-start" />
          <div className="text-sm min-w-0 break-words">
            <p className="font-medium">{BRAND.name}</p>
            <p className="text-text-secondary">{BRAND.product}</p>
            <p className="text-text-secondary text-xs mt-1">{BRAND.site}</p>
          </div>
        </div>
      </Card>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><Mail className="h-5 w-5 text-brand" /><h2 className="font-semibold">Envio de e-mails (SMTP)</h2></div>
            <p className="mt-1 text-sm text-text-secondary">Configure o servidor usado pelos convites de assinatura e teste a conexão antes de enviar.</p>
          </div>
          <Button type="button" size="sm" variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} loading={smtpLoading} onClick={() => void loadSmtp()}>Atualizar</Button>
        </div>
        {smtpLoading ? <p className="py-5 text-center text-sm text-text-secondary">Carregando configuração segura…</p> : <>
          <form onSubmit={saveSmtp} className="grid gap-4 sm:grid-cols-2">
            <Input label="Servidor SMTP" placeholder="smtp.exemplo.com" autoComplete="off" required value={smtp.host} onChange={(event) => updateSmtp('host', event.target.value)} />
            <Input label="Porta" type="number" min={1} max={65535} required hint="Na hospedagem Supabase, use 465 com TLS direto. As portas 25 e 587 são bloqueadas para conexões de saída das Edge Functions." value={smtp.port} onChange={(event) => updateSmtp('port', Number(event.target.value))} />
            <Input label="Usuário SMTP" autoComplete="username" required value={smtp.username} onChange={(event) => updateSmtp('username', event.target.value)} />
            <Input label={passwordConfigured ? 'Nova senha SMTP (opcional)' : 'Senha SMTP'} type="password" autoComplete="new-password" required={!passwordConfigured} hint={passwordConfigured ? 'Deixe em branco para manter a senha armazenada.' : 'A senha será transmitida somente ao serviço seguro.'} value={smtp.password} onChange={(event) => updateSmtp('password', event.target.value)} />
            <Input label="E-mail remetente" type="email" required value={smtp.fromEmail} onChange={(event) => updateSmtp('fromEmail', event.target.value)} />
            <Input label="Nome remetente" required value={smtp.fromName} onChange={(event) => updateSmtp('fromName', event.target.value)} />
            <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={smtp.secure} onChange={(event) => updateSmtp('secure', event.target.checked)} className="h-4 w-4 accent-brand" /><span><span className="block font-medium">TLS direto (SSL)</span><span className="text-xs text-text-secondary">Ative para servidores que usam TLS desde a conexão inicial, normalmente porta 465.</span></span></label>
            <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={smtp.enabled} onChange={(event) => updateSmtp('enabled', event.target.checked)} className="h-4 w-4 accent-brand" /><span><span className="block font-medium">SMTP ativo</span><span className="text-xs text-text-secondary">Desative para interromper novos envios do sistema.</span></span></label>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <Button type="submit" loading={smtpSaving}>Salvar configuração</Button>
              <Button type="button" variant="outline" leftIcon={<Server className="h-4 w-4" />} loading={smtpTesting} disabled={!passwordConfigured && !smtp.password} onClick={() => void testSmtp()}>Validar servidor SMTP</Button>
              <Badge variant={smtp.enabled && passwordConfigured ? 'success' : 'neutral'}>{smtp.enabled && passwordConfigured ? 'Ativo e configurado' : passwordConfigured ? 'Configurado, desativado' : 'Não configurado'}</Badge>
            </div>
          </form>
          <form onSubmit={sendTestEmail} className="grid gap-3 rounded-xl border border-border-color bg-bg-secondary/40 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div><h3 className="text-sm font-semibold">Teste ao vivo de envio</h3><p className="mb-3 mt-1 text-xs text-text-secondary">Envia uma mensagem de teste real usando o servidor e o remetente configurados.</p><Input label="Enviar teste para" type="email" placeholder="voce@exemplo.com" required value={testRecipient} onChange={(event) => setTestRecipient(event.target.value)} /></div>
            <Button type="submit" leftIcon={<Mail className="h-4 w-4" />} loading={testSending} disabled={!smtp.enabled || !passwordConfigured}>Enviar e-mail de teste</Button>
          </form>
        </>}
        {smtpError && <p className="rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{smtpError}</p>}
        {smtpNotice && <p className="rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm" role="status">{smtpNotice}</p>}
        <p className="text-xs text-text-secondary">A senha SMTP não é carregada de volta ao navegador. O fluxo transacional de convites de assinatura usa este serviço quando habilitado; mensagens de autenticação do Supabase Auth dependem da configuração própria de SMTP do Supabase.</p>
      </Card>
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Integrações</h2>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>Supabase</span>
          <Badge variant={envOk ? 'success' : 'danger'}>{envOk ? 'Configurado' : 'Ausente'}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>Ambiente</span>
          <Badge variant="info">{import.meta.env.MODE}</Badge>
        </div>
      </Card>
      <Card className="space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Backup e importação</h2>
          <p className="mt-1 text-sm text-text-secondary">Exporte dados operacionais ou valide um backup e revise o conteúdo antes de qualquer importação.</p>
        </div>
        <Button leftIcon={<Download className="h-4 w-4" />} loading={exporting} onClick={() => void downloadBackup()}>Exportar backup do sistema</Button>
        <div className="space-y-3 rounded-xl border border-border-color bg-bg-secondary/40 p-4">
          <div className="flex items-center gap-2"><FileJson className="h-4 w-4 text-brand" /><h3 className="text-sm font-semibold">Validar arquivo de backup</h3></div>
          <label className="block text-sm font-medium" htmlFor="admin-backup-file">Arquivo JSON</label>
          <input id="admin-backup-file" type="file" accept="application/json,.json" onChange={(event) => void validateBackup(event.target.files?.[0])} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:font-medium file:text-brand" />
          {preview && <div className="space-y-3 rounded-lg border border-border-color bg-bg-primary p-3" role="status">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold"><Upload className="h-4 w-4" />{preview.name}<Badge variant={preview.result.valid ? 'success' : 'danger'}>{preview.result.valid ? 'Válido' : 'Com erros'}</Badge></div>
            <p className="text-sm">{preview.result.recordCount.toLocaleString('pt-BR')} registros no total</p>
            <ul className="grid gap-1 text-sm sm:grid-cols-2">{Object.entries(preview.result.tableCounts).map(([table, count]) => <li key={table} className="flex justify-between gap-3"><span className="break-all">{table}</span><span className="font-mono tabular-nums">{(count || 0).toLocaleString('pt-BR')}</span></li>)}</ul>
            {preview.result.errors.length > 0 && <div><p className="text-sm font-semibold text-erro">Erros de validação</p><ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-erro">{preview.result.errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul></div>}
            {preview.result.warnings.length > 0 && <div><p className="text-sm font-semibold">Avisos</p><ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-text-secondary">{preview.result.warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul></div>}
            <p className="rounded-lg bg-aviso/10 p-3 text-xs text-text-secondary">{preview.result.blockedReason}</p>
            <Button disabled={!preview.result.canApply || transferBusy} loading={transferBusy} onClick={() => void restoreBackup()} title={preview.result.blockedReason}>{preview.result.canApply ? 'Importar e substituir dados' : 'Importação indisponível'}</Button>
          </div>}
        </div>
        {transferError && <p className="rounded-lg border border-erro/30 bg-erro/10 p-3 text-sm text-erro" role="alert">{transferError}</p>}
        <p className="text-xs text-text-secondary">O backup exclui identidades, memberships, convites, autorização administrativa, auditoria e históricos. Envelopes de assinatura e tokens privados também são excluídos. Os binários do Storage não são exportados; eles permanecem no mesmo ambiente durante a restauração. A prévia não grava dados.</p>
      </Card>
      <Card className="space-y-4 border border-erro/40 bg-erro/5 p-5">
        <div>
          <h2 className="font-semibold text-erro">Apagar dados operacionais</h2>
          <p className="mt-1 text-sm text-text-secondary">Remove empresas, clientes, serviços, contratos, assinaturas, agenda e lançamentos financeiros. A limpeza é irreversível e exige confirmação em duas etapas.</p>
        </div>
        <Button variant="danger" disabled={transferBusy} loading={transferBusy} onClick={() => void clearAllSystemData()}>Apagar todos os dados do sistema</Button>
        <p className="text-xs text-text-secondary">Logins, perfis, permissões administrativas, auditoria, configuração SMTP e arquivos binários são preservados. Para remover logins ou arquivos, use seus módulos próprios.</p>
      </Card>
      <Card className="p-5 space-y-2 text-sm text-text-secondary">
        <h2 className="font-semibold text-text-primary">Notas</h2>
        <p>
          As telas administrativas validam a sessão com a função de autorização da plataforma e dependem das políticas de acesso do banco.
        </p>
      </Card>
    </div>
  );
}
