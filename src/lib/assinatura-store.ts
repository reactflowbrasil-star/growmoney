import type { Envelope, EnvelopeEvent, SavedSignature, Signer } from './assinatura-types';

const ENVELOPES_KEY = 'grow_envelopes_v1';
const SIGNATURES_KEY = 'grow_saved_signatures_v1';
const ALERTS_KEY = 'grow_signature_alerts_v1';

export type SignatureAlert = {
  id: string;
  envelopeId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  email?: string;
};

function uid() {
  return crypto.randomUUID();
}

function token() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function listEnvelopes(): Envelope[] {
  return read<Envelope[]>(ENVELOPES_KEY, []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getEnvelope(id: string): Envelope | null {
  return listEnvelopes().find((e) => e.id === id) ?? null;
}

export function getEnvelopeBySignerToken(t: string): { envelope: Envelope; signer: Signer } | null {
  for (const e of listEnvelopes()) {
    const s = e.signers.find((x) => x.token === t);
    if (s) return { envelope: e, signer: s };
  }
  return null;
}

function pushEvent(_e: Envelope, type: string, message: string, actor?: string): EnvelopeEvent {
  return {
    id: uid(),
    at: new Date().toISOString(),
    type,
    message,
    actor,
  };
}

export function saveEnvelope(envelope: Envelope) {
  const all = listEnvelopes();
  const idx = all.findIndex((x) => x.id === envelope.id);
  if (idx >= 0) all[idx] = envelope;
  else all.unshift(envelope);
  write(ENVELOPES_KEY, all);
  return envelope;
}

export function createEnvelope(input: {
  titulo: string;
  descricao?: string;
  documentoTexto: string;
  createdBy: string;
  messageToSigners?: string;
  arquivoNome?: string;
  arquivoStoragePath?: string;
  signers: Array<{ nome: string; email: string; role?: 'sign' | 'cc' }>;
}): Envelope {
  const now = new Date().toISOString();
  const envelope: Envelope = {
    id: uid(),
    titulo: input.titulo,
    descricao: input.descricao || '',
    documentoTexto: input.documentoTexto,
    arquivoNome: input.arquivoNome,
    arquivoStoragePath: input.arquivoStoragePath,
    status: 'rascunho',
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
    messageToSigners: input.messageToSigners,
    signers: input.signers.map((s, i) => ({
      id: uid(),
      nome: s.nome,
      email: s.email,
      role: s.role || 'sign',
      status: 'pending',
      token: token(),
      order: i + 1,
    })),
    events: [],
  };
  envelope.events = [pushEvent(envelope, 'created', 'Envelope criado', input.createdBy)];
  return saveEnvelope(envelope);
}

export function sendEnvelope(id: string, actor: string): Envelope | null {
  const e = getEnvelope(id);
  if (!e) return null;
  e.status = 'enviado';
  e.sentAt = new Date().toISOString();
  e.updatedAt = e.sentAt;
  e.events.push(pushEvent(e, 'sent', 'Documento enviado para assinatura', actor));
  saveEnvelope(e);

  e.signers
    .filter((s) => s.role === 'sign')
    .forEach((s) => {
      addAlert({
        envelopeId: e.id,
        title: `Assinatura pendente: ${e.titulo}`,
        body: `Olá ${s.nome}, você foi convidado a assinar "${e.titulo}".`,
        email: s.email,
      });
    });

  addAlert({
    envelopeId: e.id,
    title: `Enviado: ${e.titulo}`,
    body: `Documento enviado para ${e.signers.filter((s) => s.role === 'sign').length} signatário(s).`,
    email: actor,
  });

  return e;
}

export function markViewed(tokenStr: string): Envelope | null {
  const found = getEnvelopeBySignerToken(tokenStr);
  if (!found) return null;
  const { envelope, signer } = found;
  if (signer.status === 'pending') {
    signer.status = 'viewed';
    signer.viewedAt = new Date().toISOString();
    envelope.updatedAt = signer.viewedAt;
    envelope.events.push(
      pushEvent(envelope, 'viewed', `${signer.nome} visualizou o documento`, signer.email)
    );
    saveEnvelope(envelope);
    addAlert({
      envelopeId: envelope.id,
      title: `Visualizado: ${envelope.titulo}`,
      body: `${signer.nome} abriu o documento para assinatura.`,
      email: envelope.createdBy,
    });
  }
  return envelope;
}

export function applySignature(
  tokenStr: string,
  signatureDataUrl: string,
  mode: 'canvas' | 'typed' | 'saved'
): Envelope | null {
  const found = getEnvelopeBySignerToken(tokenStr);
  if (!found) return null;
  const { envelope, signer } = found;
  if (signer.role !== 'sign') return envelope;
  if (signer.status === 'signed') return envelope;

  signer.status = 'signed';
  signer.signedAt = new Date().toISOString();
  signer.signatureDataUrl = signatureDataUrl;
  signer.signatureMode = mode;
  envelope.updatedAt = signer.signedAt;
  envelope.events.push(
    pushEvent(envelope, 'signed', `${signer.nome} assinou o documento`, signer.email)
  );

  const needSign = envelope.signers.filter((s) => s.role === 'sign');
  const allSigned = needSign.every((s) => s.status === 'signed');
  if (allSigned) {
    envelope.status = 'concluido';
    envelope.completedAt = signer.signedAt;
    envelope.events.push(pushEvent(envelope, 'completed', 'Todas as assinaturas coletadas'));
    needSign.forEach((s) => {
      addAlert({
        envelopeId: envelope.id,
        title: `Concluído: ${envelope.titulo}`,
        body: `O documento foi assinado por todas as partes.`,
        email: s.email,
      });
    });
    addAlert({
      envelopeId: envelope.id,
      title: `Concluído: ${envelope.titulo}`,
      body: `Envelope finalizado com sucesso.`,
      email: envelope.createdBy,
    });
  } else {
    envelope.status = 'parcial';
    addAlert({
      envelopeId: envelope.id,
      title: `Assinatura recebida: ${envelope.titulo}`,
      body: `${signer.nome} assinou. Aguardando demais partes.`,
      email: envelope.createdBy,
    });
  }

  saveEnvelope(envelope);
  return envelope;
}

export function cancelEnvelope(id: string, actor: string): Envelope | null {
  const e = getEnvelope(id);
  if (!e) return null;
  e.status = 'cancelado';
  e.updatedAt = new Date().toISOString();
  e.events.push(pushEvent(e, 'cancelled', 'Envelope cancelado', actor));
  saveEnvelope(e);
  return e;
}

export function deleteEnvelope(id: string) {
  write(
    ENVELOPES_KEY,
    listEnvelopes().filter((e) => e.id !== id)
  );
}

export function listSavedSignatures(): SavedSignature[] {
  return read<SavedSignature[]>(SIGNATURES_KEY, []);
}

export function saveSignature(label: string, dataUrl: string, mode: SavedSignature['mode']) {
  const list = listSavedSignatures();
  const item: SavedSignature = {
    id: uid(),
    label,
    dataUrl,
    mode,
    createdAt: new Date().toISOString(),
  };
  list.unshift(item);
  write(SIGNATURES_KEY, list.slice(0, 20));
  return item;
}

export function deleteSavedSignature(id: string) {
  write(
    SIGNATURES_KEY,
    listSavedSignatures().filter((s) => s.id !== id)
  );
}

export function listAlerts(): SignatureAlert[] {
  return read<SignatureAlert[]>(ALERTS_KEY, []).sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
}

export function addAlert(input: Omit<SignatureAlert, 'id' | 'at' | 'read'>) {
  const list = listAlerts();
  list.unshift({
    id: uid(),
    at: new Date().toISOString(),
    read: false,
    ...input,
  });
  write(ALERTS_KEY, list.slice(0, 100));
}

export function markAlertRead(id: string) {
  const list = listAlerts().map((a) => (a.id === id ? { ...a, read: true } : a));
  write(ALERTS_KEY, list);
}

export function markAllAlertsRead() {
  write(
    ALERTS_KEY,
    listAlerts().map((a) => ({ ...a, read: true }))
  );
}

export function signingUrl(tokenStr: string) {
  if (typeof window === 'undefined') return `/assinar/${tokenStr}`;
  return `${window.location.origin}/assinar/${tokenStr}`;
}

