/** Persistência local de clientes, serviços e contratos (espelha o fluxo Automattize). */

export type ClienteLocal = {
  id: string;
  razao_social: string;
  documento: string;
  email: string;
  telefone: string;
  whatsapp?: string;
  cidade?: string;
  tipo: 'PF' | 'PJ';
};

export type ServicoCatalogo = {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  texto_contrato?: string;
  valor: number;
  tipo: 'unico' | 'mensal';
  tipo_cobranca?: 'unico' | 'mensal';
  ordem: number;
  ativo: boolean;
  bonus_automatico?: boolean;
  bonus_gatilhos?: string[];
  contratacao_permitida?: boolean;
  bonus_permitido?: boolean;
  exclusaoGrupo?: string;
};

export type ContratoItem = {
  servico_id: string;
  nome: string;
  valor: number;
  tipo: 'unico' | 'mensal';
  isBonus: boolean;
  quantidade: number;
};

export type ContratoLocal = {
  id: string;
  numero: number;
  client_id: string;
  cliente_nome: string;
  cliente_documento?: string;
  itens: ContratoItem[];
  unidades: number;
  valor_bruto: number;
  valor: number;
  desconto_valor: number;
  desconto_percentual: number;
  bonus_total: number;
  forma_pagamento: string;
  parcelas: number;
  valor_parcela: number;
  entrada_valor: number;
  periodicidade: 'mensal' | 'trimestral' | 'semestral' | 'anual' | null;
  plano_recorrente: boolean;
  data_inicio: string;
  data_termino?: string;
  pagamento_observacao?: string;
  observacoes?: string;
  status: 'rascunho' | 'enviado' | 'assinado' | 'cancelado';
  created_at: string;
};

const K_CLIENTES = 'gm_clientes_v1';
const K_CONTRATOS = 'gm_contratos_v1';
const K_SERVICOS = 'gm_servicos_catalogo_v1';

const DEFAULT_SERVICOS: ServicoCatalogo[] = [
  { id: 'svc-site', nome: 'Site institucional', categoria: 'Digital', descricao: 'Site completo com páginas institucionais', texto_contrato: 'Desenvolvimento de site institucional', valor: 2500, tipo: 'unico', tipo_cobranca: 'unico', ordem: 1, ativo: true, exclusaoGrupo: 'web' },
  { id: 'svc-landing', nome: 'Landing Page', categoria: 'Digital', descricao: 'Página de captura focada em conversão', texto_contrato: 'Desenvolvimento de landing page', valor: 1200, tipo: 'unico', tipo_cobranca: 'unico', ordem: 2, ativo: true, exclusaoGrupo: 'web' },
  { id: 'svc-seo', nome: 'SEO mensal', categoria: 'Marketing', descricao: 'Otimização orgânica contínua', valor: 890, tipo: 'mensal', tipo_cobranca: 'mensal', ordem: 3, ativo: true },
  { id: 'svc-trafego', nome: 'Tráfego pago (gestão)', categoria: 'Marketing', descricao: 'Anúncios no Google Ads, Anúncio no Meta Ads', texto_contrato: 'Gestão de mídia paga', valor: 1200, tipo: 'mensal', tipo_cobranca: 'mensal', ordem: 4, ativo: true },
  { id: 'svc-social', nome: 'Social media', categoria: 'Marketing', valor: 1500, tipo: 'mensal', tipo_cobranca: 'mensal', ordem: 5, ativo: true },
  { id: 'svc-crm', nome: 'Implantação CRM', categoria: 'Sistemas', valor: 3500, tipo: 'unico', tipo_cobranca: 'unico', ordem: 6, ativo: true },
  { id: 'svc-suporte', nome: 'Suporte premium', categoria: 'Suporte', valor: 499, tipo: 'mensal', tipo_cobranca: 'mensal', ordem: 7, ativo: true, bonus_permitido: true },
  { id: 'svc-hospedagem', nome: 'Hospedagem anual', categoria: 'Infra', valor: 600, tipo: 'unico', tipo_cobranca: 'unico', ordem: 8, ativo: true, bonus_permitido: true },
  { id: 'svc-consultoria', nome: 'Consultoria estratégica', categoria: 'Consultoria', valor: 2000, tipo: 'unico', tipo_cobranca: 'unico', ordem: 9, ativo: true },
];

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

export function listClientes(): ClienteLocal[] {
  return read<ClienteLocal[]>(K_CLIENTES, []);
}

export function saveCliente(c: Omit<ClienteLocal, 'id'> & { id?: string }): ClienteLocal {
  const list = listClientes();
  const item: ClienteLocal = {
    id: c.id || crypto.randomUUID(),
    razao_social: c.razao_social,
    documento: c.documento,
    email: c.email,
    telefone: c.telefone,
    whatsapp: c.whatsapp,
    cidade: c.cidade,
    tipo: c.tipo,
  };
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  write(K_CLIENTES, list);
  return item;
}

function normalizeServico(s: Partial<ServicoCatalogo> & { id: string; nome: string }): ServicoCatalogo {
  const tipo = (s.tipo_cobranca || s.tipo || 'unico') as 'unico' | 'mensal';
  return {
    id: s.id,
    nome: s.nome,
    categoria: s.categoria || '',
    descricao: s.descricao || '',
    texto_contrato: s.texto_contrato || '',
    valor: Number(s.valor) || 0,
    tipo,
    tipo_cobranca: tipo,
    ordem: Number(s.ordem) || 0,
    ativo: s.ativo !== false,
    bonus_automatico: !!s.bonus_automatico,
    bonus_gatilhos: s.bonus_gatilhos || [],
    contratacao_permitida: s.contratacao_permitida !== false,
    bonus_permitido: s.bonus_permitido !== false,
    exclusaoGrupo: s.exclusaoGrupo,
  };
}

export function listServicosCatalogo(): ServicoCatalogo[] {
  const existing = read<ServicoCatalogo[] | null>(K_SERVICOS, null);
  if (existing && existing.length) {
    return existing
      .map((s) => normalizeServico(s))
      .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
  }
  write(K_SERVICOS, DEFAULT_SERVICOS);
  return [...DEFAULT_SERVICOS];
}

export function listServicosAtivos(): ServicoCatalogo[] {
  return listServicosCatalogo().filter((s) => s.ativo);
}

export function saveServico(data: Omit<ServicoCatalogo, 'id'> & { id?: string }): ServicoCatalogo {
  const list = listServicosCatalogo();
  const id = data.id || crypto.randomUUID();
  const item = normalizeServico({ ...data, id });
  const idx = list.findIndex((x) => x.id === id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  write(K_SERVICOS, list);
  return item;
}

export function deleteServico(id: string) {
  write(
    K_SERVICOS,
    listServicosCatalogo().filter((s) => s.id !== id)
  );
}

export function listContratos(): ContratoLocal[] {
  return read<ContratoLocal[]>(K_CONTRATOS, []);
}

export function nextNumeroContrato(): number {
  const list = listContratos();
  return list.reduce((m, c) => Math.max(m, c.numero), 0) + 1;
}

export function saveContrato(
  c: Omit<ContratoLocal, 'id' | 'numero' | 'created_at'> & { id?: string; numero?: number }
): ContratoLocal {
  const list = listContratos();
  const item: ContratoLocal = {
    ...c,
    id: c.id || crypto.randomUUID(),
    numero: c.numero || nextNumeroContrato(),
    created_at: new Date().toISOString(),
  };
  list.unshift(item);
  write(K_CONTRATOS, list);
  return item;
}

export function updateContratoStatus(id: string, status: ContratoLocal['status']) {
  const list = listContratos().map((c) => (c.id === id ? { ...c, status } : c));
  write(K_CONTRATOS, list);
}

export function deleteContrato(id: string) {
  write(
    K_CONTRATOS,
    listContratos().filter((c) => c.id !== id)
  );
}

export function formatBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatValorCobranca(n: number, tipo: 'unico' | 'mensal') {
  const base = formatBRL(n);
  return tipo === 'mensal' ? `${base}/mês` : base;
}

export function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
