import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Copy, CheckCircle2, Ban, ExternalLink } from 'lucide-react';
import { Button, Card, Badge, PageHeader } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getEnvelope, sendEnvelope, cancelEnvelope, signingUrl } from '@/lib/assinatura-store';
import { criarLinkArquivo } from '@/services/file-storage';
import type { Envelope, EnvelopeStatus } from '@/lib/assinatura-types';

const statusMap: Record<
  EnvelopeStatus,
  { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' | 'warning' }
> = {
  rascunho: { label: 'Rascunho', variant: 'neutral' },
  enviado: { label: 'Enviado', variant: 'info' },
  parcial: { label: 'Parcial', variant: 'warning' },
  concluido: { label: 'Conclu�do', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
  expirado: { label: 'Expirado', variant: 'danger' },
};

export default function AssinaturaDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [env, setEnv] = useState<Envelope | null>(null);
  const [arquivoUrl, setArquivoUrl] = useState('');
  const [copied, setCopied] = useState('');

  const reload = async () => {
    if (id) setEnv(await getEnvelope(id));
  };

  useEffect(() => {
    reload();
  }, [id]);

  useEffect(() => {
    if (!env?.arquivoStoragePath) return;
    void criarLinkArquivo(env.arquivoStoragePath).then(setArquivoUrl).catch((error) => console.warn(error));
  }, [env?.arquivoStoragePath]);

  if (!env) {
    return (
      <div className="max-w-3xl space-y-4">
        <p className="text-text-secondary">Envelope n�o encontrado.</p>
        <Link to="/assinaturas" className="text-brand text-sm">
           Voltar
        </Link>
      </div>
    );
  }

  const st = statusMap[env.status];

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(signingUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/assinaturas')}>
        Voltar
      </Button>

      <PageHeader
        title={env.titulo}
        description={env.descricao || 'Envelope de assinatura digital'}
        actions={
          <>
            <Badge variant={st.variant}>{st.label}</Badge>
            {env.status === 'rascunho' && (
              <Button
                size="sm"
                leftIcon={<Send className="w-4 h-4" />}
                onClick={() => {
                  void sendEnvelope(env.id, user?.email || 'sistema').then(reload).catch((error) => window.alert(error.message));
                }}
              >
                Enviar para assinatura
              </Button>
            )}
            {env.status !== 'concluido' && env.status !== 'cancelado' && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Ban className="w-4 h-4" />}
                onClick={() => {
                  void cancelEnvelope(env.id, user?.email || 'sistema').then(reload).catch((error) => window.alert(error.message));
                }}
              >
                Cancelar
              </Button>
            )}
          </>
        }
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Signat�rios</h2>
          <ul className="space-y-3">
            {env.signers.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-2 border-b border-border-color pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.nome}</p>
                  <p className="text-xs text-text-secondary">{s.email}</p>
                  <p className="text-xs mt-1 capitalize text-text-secondary">
                    {s.role === 'sign' ? 'Assinar' : 'C�pia'} � {s.status}
                    {s.signedAt && ` � ${new Date(s.signedAt).toLocaleString('pt-BR')}`}
                  </p>
                  {s.signatureDataUrl && (
                    <img src={s.signatureDataUrl} alt="Assinatura" className="mt-2 h-12 object-contain bg-white rounded border border-border-color px-2" />
                  )}
                </div>
                {s.role === 'sign' && s.status !== 'signed' && env.status !== 'rascunho' && env.status !== 'cancelado' && (
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={() => copy(s.token)}>
                      {copied === s.token ? 'Copiado' : 'Link'}
                    </Button>
                    <a href={signingUrl(s.token)} target="_blank" rel="noreferrer" className="text-[10px] text-brand inline-flex items-center gap-0.5 justify-center">
                      Abrir <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Linha do tempo</h2>
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {[...env.events].reverse().map((ev) => (
              <li key={ev.id} className="text-sm border-l-2 border-brand/40 pl-3 py-1">
                <p className="font-medium">{ev.message}</p>
                <p className="text-xs text-text-secondary">
                  {new Date(ev.at).toLocaleString('pt-BR')}
                  {ev.actor ? ` � ${ev.actor}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Documento</h2>
        {env.messageToSigners && (
          <p className="text-sm text-text-secondary italic">"{env.messageToSigners}"</p>
        )}
        <pre className="whitespace-pre-wrap text-sm bg-bg-secondary rounded-xl p-4 border border-border-color font-sans leading-relaxed max-h-96 overflow-y-auto">
          {env.documentoTexto}
        </pre>
        {env.arquivoNome && (
              <p className="text-xs text-text-secondary">
                Anexo: {arquivoUrl ? <a href={arquivoUrl} target="_blank" rel="noreferrer" className="text-brand underline">{env.arquivoNome}</a> : env.arquivoNome}
              </p>
            )}
        {env.status === 'concluido' && (
          <div className="flex items-center gap-2 text-brand text-sm">
            <CheckCircle2 className="w-4 h-4" /> Documento totalmente assinado
          </div>
        )}
      </Card>
    </div>
  );
}


