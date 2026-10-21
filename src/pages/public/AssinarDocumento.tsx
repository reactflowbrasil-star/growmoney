import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Card, Input, Badge } from '@/components/ui';
import { SignaturePad } from '@/components/assinatura/SignaturePad';
import { BRAND } from '@/lib/brand';
import {
  getEnvelopeBySignerToken,
  markViewed,
  applySignature,
  listSavedSignatures,
  saveSignature,
} from '@/lib/assinatura-store';
import type { Envelope, Signer, SignatureMode, SavedSignature } from '@/lib/assinatura-types';
import { CheckCircle2, PenLine, Type, Bookmark } from 'lucide-react';

export default function AssinarDocumento() {
  const { token } = useParams();
  const [envelope, setEnvelope] = useState<Envelope | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [mode, setMode] = useState<SignatureMode>('canvas');
  const [canvasData, setCanvasData] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [savedList, setSavedList] = useState<SavedSignature[]>([]);
  const [selectedSaved, setSelectedSaved] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [saveForLater, setSaveForLater] = useState(true);

  useEffect(() => {
    if (!token) return;
    const found = getEnvelopeBySignerToken(token);
    if (!found) {
      setError('Link inválido ou expirado.');
      return;
    }
    markViewed(token);
    const refreshed = getEnvelopeBySignerToken(token);
    if (refreshed) {
      setEnvelope(refreshed.envelope);
      setSigner(refreshed.signer);
      if (refreshed.signer.status === 'signed') setDone(true);
    }
    setSavedList(listSavedSignatures());
  }, [token]);

  const typedToDataUrl = (text: string) => {
    const c = document.createElement('canvas');
    c.width = 600;
    c.height = 160;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic 48px "Segoe Script", "Brush Script MT", cursive';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 24, 80);
    return c.toDataURL('image/png');
  };

  const resolveSignature = (): string | null => {
    if (mode === 'canvas') return canvasData;
    if (mode === 'typed' && typed.trim()) return typedToDataUrl(typed.trim());
    if (mode === 'saved' && selectedSaved) {
      return savedList.find((s) => s.id === selectedSaved)?.dataUrl || null;
    }
    return null;
  };

  const confirmar = () => {
    setError('');
    if (!token || !signer || !envelope) return;
    if (signer.status === 'signed') {
      setDone(true);
      return;
    }
    if (!agree) {
      setError('Confirme que leu e concorda com o documento.');
      return;
    }
    const data = resolveSignature();
    if (!data) {
      setError('Adicione sua assinatura antes de confirmar.');
      return;
    }
    if (saveForLater && mode !== 'saved') {
      saveSignature(signer.nome, data, mode);
    }
    const updated = applySignature(token, data, mode);
    if (updated) {
      setEnvelope(updated);
      setSigner(updated.signers.find((s) => s.token === token) || signer);
      setDone(true);
    }
  };

  if (error && !envelope) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4">
        <Card className="p-8 max-w-md text-center space-y-3">
          <p className="text-erro">{error}</p>
          <Link to="/" className="text-brand text-sm">
            Ir ao início
          </Link>
        </Card>
      </div>
    );
  }

  if (!envelope || !signer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <p className="text-text-secondary text-sm">Carregando documento…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-border-color bg-bg-primary/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <img src={BRAND.logo} alt={BRAND.name} className="h-10 w-auto max-w-[140px] object-contain" />
          <Badge variant="info">Assinatura segura</Badge>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{envelope.titulo}</h1>
          <p className="text-sm text-text-secondary mt-1">
            Olá <strong>{signer.nome}</strong> ({signer.email}) — revise e assine abaixo.
          </p>
          {envelope.messageToSigners && (
            <p className="text-sm mt-2 text-brand bg-brand/10 rounded-xl px-3 py-2">{envelope.messageToSigners}</p>
          )}
        </div>

        <Card className="p-5">
          <h2 className="font-semibold mb-3">Documento</h2>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans max-h-80 overflow-y-auto">
            {envelope.documentoTexto}
          </pre>
        </Card>

        {done || signer.status === 'signed' ? (
          <Card className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-brand mx-auto" />
            <h2 className="text-xl font-bold">Assinatura registrada</h2>
            <p className="text-sm text-text-secondary">Obrigado. As partes envolvidas foram notificadas.</p>
            {signer.signatureDataUrl && (
              <img
                src={signer.signatureDataUrl}
                alt="Sua assinatura"
                className="mx-auto h-16 object-contain bg-white rounded-xl border border-border-color px-4"
              />
            )}
          </Card>
        ) : (
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold">Sua assinatura</h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'canvas' as const, label: 'Desenhar', icon: PenLine },
                  { id: 'typed' as const, label: 'Digitar', icon: Type },
                  { id: 'saved' as const, label: 'Salva', icon: Bookmark },
                ]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    mode === m.id
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border-color text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'canvas' && <SignaturePad onChange={setCanvasData} />}
            {mode === 'typed' && (
              <div className="space-y-2">
                <Input
                  label="Digite seu nome completo"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={signer.nome}
                />
                {typed && (
                  <div className="rounded-xl border border-border-color bg-white p-4">
                    <p className="text-3xl italic text-slate-800" style={{ fontFamily: 'cursive' }}>
                      {typed}
                    </p>
                  </div>
                )}
              </div>
            )}
            {mode === 'saved' && (
              <div className="grid sm:grid-cols-2 gap-2">
                {savedList.length === 0 ? (
                  <p className="text-sm text-text-secondary col-span-2">
                    Nenhuma assinatura salva neste dispositivo. Desenhe ou digite e marque “Salvar para próximas”.
                  </p>
                ) : (
                  savedList.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSaved(s.id)}
                      className={`p-3 rounded-xl border text-left ${
                        selectedSaved === s.id ? 'border-brand ring-2 ring-brand/30' : 'border-border-color'
                      }`}
                    >
                      <img src={s.dataUrl} alt={s.label} className="h-12 object-contain bg-white w-full" />
                      <p className="text-xs text-text-secondary mt-1">{s.label}</p>
                    </button>
                  ))
                )}
              </div>
            )}

            <label className="flex items-start gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={saveForLater} onChange={(e) => setSaveForLater(e.target.checked)} className="mt-1 accent-brand" />
              Salvar esta assinatura neste dispositivo para próximos documentos
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 accent-brand" />
              Li o documento e concordo em assinar eletronicamente com validade entre as partes.
            </label>

            {error && (
              <p className="text-sm text-erro bg-erro/10 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <Button className="w-full" size="lg" onClick={confirmar}>
              Confirmar assinatura
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}

