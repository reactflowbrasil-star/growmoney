import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileSignature, Send, Eye, Trash2, Bell, Copy, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card, EmptyState, Modal, Badge, PageHeader, FileUpload } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  listEnvelopes,
  createEnvelope,
  sendEnvelope,
  deleteEnvelope,
  listAlerts,
  markAlertRead,
  markAllAlertsRead,
  signingUrl,
  type SignatureAlert,
} from '@/lib/assinatura-store';
import type { Envelope, EnvelopeStatus } from '@/lib/assinatura-types';

const statusMap: Record<
  EnvelopeStatus,
  { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' | 'warning' }
> = {
  rascunho: { label: 'Rascunho', variant: 'neutral' },
  enviado: { label: 'Enviado', variant: 'info' },
  parcial: { label: 'Parcial', variant: 'warning' },
  concluido: { label: 'Concluído', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
  expirado: { label: 'Expirado', variant: 'danger' },
};

export default function Assinaturas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Envelope[]>([]);
  const [alerts, setAlerts] = useState<SignatureAlert[]>([]);
  const [busca, setBusca] = useState('');
  const [open, setOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [documento, setDocumento] = useState(
    'CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nPelo presente instrumento, as partes acordam os termos...\n\nCláusula 1 — Objeto\nCláusula 2 — Valor\nCláusula 3 — Prazo\nCláusula 4 — Foro'
  );
  const [msg, setMsg] = useState('Por favor, revise e assine o documento.');
  const [signers, setSigners] = useState([
    { nome: '', email: '' },
    { nome: '', email: '' },
  ]);
  const [arquivoNome, setArquivoNome] = useState<string>();
  const [arquivoStoragePath, setArquivoStoragePath] = useState<string>();

  const reload = async () => {
    setAlerts(listAlerts());
    try {
      setRows(await listEnvelopes());
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Não foi possível carregar os envelopes.');
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.titulo.toLowerCase().includes(busca.toLowerCase()) ||
          r.signers.some((s) => s.email.toLowerCase().includes(busca.toLowerCase()))
      ),
    [rows, busca]
  );

  const unread = alerts.filter((a) => !a.read).length;

  const criar = async () => {
    if (!titulo.trim() || !documento.trim()) return;
    const validSigners = signers.filter((s) => s.nome.trim() && s.email.trim());
    if (validSigners.length === 0) return;
    try {
    const env = await createEnvelope({
      titulo: titulo.trim(),
      descricao,
      documentoTexto: documento,
      createdBy: user?.email || user?.nome || 'sistema',
      messageToSigners: msg,
      arquivoNome,
      arquivoStoragePath,
      signers: validSigners,
    });
    setOpen(false);
    setTitulo('');
    await reload();
    navigate(`/assinaturas/${env.id}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Não foi possível salvar o envelope.');
    }
  };

  const enviar = async (id: string) => {
    try {
      await sendEnvelope(id, user?.email || 'sistema');
      await reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Não foi possível enviar o envelope.');
    }
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(signingUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader
        title="Assinatura digital"
        description="Envie documentos, colete assinaturas e acompanhe alertas — fluxo tipo DocuSign"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Bell className="w-4 h-4" />} onClick={() => setAlertsOpen(true)}>
              Alertas {unread > 0 ? `(${unread})` : ''}
            </Button>
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>
              Novo envelope
            </Button>
          </>
        }
      />

      <Card className="p-3">
        <Input placeholder="Buscar por título ou e-mail…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum envelope"
          description="Crie um documento, adicione signatários e envie para assinatura."
          icon={<FileSignature className="w-6 h-6" />}
          action={
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>
              Criar envelope
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const st = statusMap[e.status];
            const pending = e.signers.filter((s) => s.role === 'sign' && s.status !== 'signed');
            return (
              <Card key={e.id} className="p-4 card-premium">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/assinaturas/${e.id}`} className="font-semibold hover:text-brand truncate">
                        {e.titulo}
                      </Link>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="text-xs text-text-secondary">
                      {e.signers.length} parte(s) · {new Date(e.updatedAt).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {e.signers.map((s) => (
                        <span key={s.id} className="text-[11px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">
                          {s.nome}: {s.status}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {e.status === 'rascunho' && (
                      <Button size="sm" leftIcon={<Send className="w-3.5 h-3.5" />} onClick={() => enviar(e.id)}>
                        Enviar
                      </Button>
                    )}
                    {pending[0] && e.status !== 'rascunho' && e.status !== 'cancelado' && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={
                          copied === pending[0].token ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )
                        }
                        onClick={() => copyLink(pending[0].token)}
                      >
                        {copied === pending[0].token ? 'Link copiado' : 'Link signatário'}
                      </Button>
                    )}
                    <Link to={`/assinaturas/${e.id}`}>
                      <Button size="sm" variant="ghost" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        Detalhe
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => {
                        void deleteEnvelope(e.id).then(reload).catch((error) => window.alert(error.message));
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo envelope de assinatura" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Título do documento" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
          <Input label="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <div>
            <label className="text-sm font-medium mb-1 block">Texto do documento</label>
            <textarea
              className="w-full min-h-[140px] rounded-xl border border-border-color bg-bg-secondary px-3 py-2 text-sm"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
            />
          </div>
          <FileUpload
            label="Anexo (PDF/imagem opcional)"
            accept="application/pdf,image/*"
            categoria="contratos"
            onUploaded={(files) => {
              const file = files[0];
              if (!file) return;
              setArquivoNome(file.nome);
              setArquivoStoragePath(file.caminho);
            }}
          />
          <Input label="Mensagem aos signatários" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="space-y-2">
            <p className="text-sm font-medium">Signatários</p>
            {signers.map((s, i) => (
              <div key={i} className="grid sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Nome"
                  value={s.nome}
                  onChange={(e) => {
                    const next = [...signers];
                    next[i] = { ...next[i], nome: e.target.value };
                    setSigners(next);
                  }}
                />
                <Input
                  placeholder="E-mail"
                  type="email"
                  value={s.email}
                  onChange={(e) => {
                    const next = [...signers];
                    next[i] = { ...next[i], email: e.target.value };
                    setSigners(next);
                  }}
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setSigners((p) => [...p, { nome: '', email: '' }])}>
              + Signatário
            </Button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={criar}>Criar envelope</Button>
          </div>
        </div>
      </Modal>

      <Modal open={alertsOpen} onClose={() => setAlertsOpen(false)} title="Alertas de assinatura">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">Nenhum alerta</p>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  markAllAlertsRead();
                  reload();
                }}
              >
                Marcar todos como lidos
              </Button>
              {alerts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    markAlertRead(a.id);
                    reload();
                    navigate(`/assinaturas/${a.envelopeId}`);
                    setAlertsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border border-border-color ${
                    a.read ? 'opacity-70' : 'bg-brand/5 border-brand/20'
                  }`}
                >
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{a.body}</p>
                  <p className="text-[10px] text-text-secondary mt-1">
                    {new Date(a.at).toLocaleString('pt-BR')}
                    {a.email ? ` · ${a.email}` : ''}
                  </p>
                </button>
              ))}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

