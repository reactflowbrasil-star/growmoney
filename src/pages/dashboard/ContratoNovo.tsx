import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react';
import { Button, Input, Card, PageHeader, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  listClientes,
  saveCliente,
  listServicosCatalogo,
  saveContrato,
  formatBRL,
  addMonths,
  type ClienteLocal,
  type ContratoLocal,
} from '@/lib/contratos-store';
import { exportPdf } from '@/lib/export';
import { gerarContratoHtml } from '@/lib/contrato-template';

const STEPS = ['Cliente', 'Serviços', 'Condições', 'Revisão'] as const;
const emptyClient = (): Omit<ClienteLocal, 'id'> => ({
  razao_social: '',
  documento: '',
  email: '',
  telefone: '',
  cidade: '',
  endereco: '',
  numero_endereco: '',
  bairro: '',
  complemento: '',
  cep: '',
  estado: '',
  tipo: 'PJ',
});
const money = (raw: string) => {
  const value = raw.trim().replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.');
  return value ? Number(value) || 0 : 0;
};
const today = () => new Date().toISOString().slice(0, 10);

export default function ContratoNovo() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [clientes, setClientes] = useState<ClienteLocal[]>(() => listClientes());
  const [servicos] = useState(() => listServicosCatalogo().filter((s) => s.ativo));
  const [clientId, setClientId] = useState('');
  const [clienteDraft, setClienteDraft] = useState<Omit<ClienteLocal, 'id'>>(emptyClient);
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [novoCliente, setNovoCliente] = useState<Omit<ClienteLocal, 'id'>>(emptyClient);
  const [vendedor, setVendedor] = useState('Renato Arantes');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [bonusIds, setBonusIds] = useState<string[]>([]);
  const [unidades, setUnidades] = useState(1);
  const [prazoMeses, setPrazoMeses] = useState(12);
  const [valorNegociado, setValorNegociado] = useState('');
  const [entrada, setEntrada] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [recorrente, setRecorrente] = useState(false);
  const [dataInicio, setDataInicio] = useState(today());
  const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState(today());
  const [obsPagamento, setObsPagamento] = useState('');
  const [obsInternas, setObsInternas] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const contrataveis = useMemo(() => servicos.filter((s) => s.contratacao_permitida !== false), [servicos]);
  const bonificaveis = useMemo(() => servicos.filter((s) => s.bonus_permitido !== false), [servicos]);

  const calc = useMemo(() => {
    const quantidade = Math.max(1, Number(unidades) || 1);
    const prazo = Math.max(1, Number(prazoMeses) || 1);
    let totalServicos = 0;
    let totalBonus = 0;
    const items = [...selecionados, ...bonusIds]
      .map((id) => servicos.find((service) => service.id === id))
      .filter((service): service is (typeof servicos)[number] => Boolean(service))
      .map((service) => {
        const isBonus = bonusIds.includes(service.id) && !selecionados.includes(service.id);
        const periodos = service.tipo === 'mensal' ? prazo : 1;
        const comercial = service.valor * quantidade * periodos;
        const charged = isBonus ? 0 : comercial;
        if (isBonus) totalBonus += comercial;
        else totalServicos += charged;
        return {
          servico_id: service.id,
          nome: service.nome,
          valor: isBonus ? 0 : service.valor,
          valor_total: charged,
          valor_comercial_total: comercial,
          prazo_meses: periodos,
          tipo: service.tipo,
          isBonus,
          quantidade,
        };
      });
    const finalTyped = valorNegociado.trim() ? money(valorNegociado) : totalServicos;
    const finalValue = Math.max(0, finalTyped);
    const discount = Math.max(0, totalServicos - finalValue);
    const discountPercent = totalServicos ? discount / totalServicos * 100 : 0;
    const downPayment = money(entrada);
    const remaining = Math.max(0, finalValue - downPayment);
    const count = Math.max(1, Number(parcelas) || 1);
    return {
      items,
      totalServicos,
      totalBonus,
      finalValue,
      discount,
      discountPercent,
      downPayment,
      parcela: remaining / count,
      count,
      economia: discount + totalBonus,
      endDate: addMonths(dataInicio, prazo),
    };
  }, [servicos, selecionados, bonusIds, unidades, prazoMeses, valorNegociado, entrada, parcelas, dataInicio]);

  const validationErrors = [
    !clienteDraft.razao_social.trim() && 'Cliente não informado.',
    !clienteDraft.documento.trim() && 'CPF/CNPJ do cliente não informado.',
    !clienteDraft.cidade?.trim() && 'Cidade do cliente não informada.',
    !selecionados.length && 'Nenhum serviço selecionado.',
    !(calc.finalValue > 0) && 'Valor do contrato inválido.',
    calc.downPayment > calc.finalValue && 'A entrada não pode ser maior que o valor do contrato.',
    !vendedor.trim() && 'Informe o vendedor responsável.',
  ].filter(Boolean) as string[];

  const escolherCliente = (id: string) => {
    setClientId(id);
    const selected = clientes.find((c) => c.id === id);
    if (selected) {
      const { id: _id, ...details } = selected;
      setClienteDraft({ ...emptyClient(), ...details });
    } else {
      setClienteDraft(emptyClient());
    }
  };

  const salvarClienteNovo = () => {
    if (!novoCliente.razao_social.trim()) return;
    const saved = saveCliente({ ...novoCliente, razao_social: novoCliente.razao_social.trim() });
    setClientes(listClientes());
    const { id: _id, ...details } = saved;
    setClientId(saved.id);
    setClienteDraft({ ...emptyClient(), ...details });
    setNovoCliente(emptyClient());
    setNovoClienteOpen(false);
  };

  const toggleServico = (id: string) => {
    const selected = contrataveis.find((s) => s.id === id);
    setSelecionados((previous) => {
      let next = previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id];
      if (selected?.exclusaoGrupo && !previous.includes(id)) {
        const rivalIds = contrataveis.filter((s) => s.exclusaoGrupo === selected.exclusaoGrupo && s.id !== id).map((s) => s.id);
        next = next.filter((value) => !rivalIds.includes(value));
      }
      return next;
    });
    setBonusIds((previous) => previous.filter((value) => value !== id));
  };

  const toggleBonus = (id: string) => {
    if (selecionados.includes(id)) return;
    setBonusIds((previous) => previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]);
  };

  const payload = (status: ContratoLocal['status'] = 'rascunho') => ({
    client_id: clientId,
    cliente_nome: clienteDraft.razao_social,
    cliente_documento: clienteDraft.documento,
    cliente_email: clienteDraft.email,
    cliente_telefone: clienteDraft.telefone,
    cliente_endereco: clienteDraft.endereco,
    cliente_numero_endereco: clienteDraft.numero_endereco,
    cliente_bairro: clienteDraft.bairro,
    cliente_complemento: clienteDraft.complemento,
    cliente_cep: clienteDraft.cep,
    cliente_cidade: clienteDraft.cidade,
    cliente_estado: clienteDraft.estado,
    vendedor: vendedor.trim(),
    itens: calc.items,
    unidades: Math.max(1, unidades),
    valor_bruto: calc.totalServicos,
    valor: calc.finalValue,
    desconto_valor: calc.discount,
    desconto_percentual: calc.discountPercent,
    bonus_total: calc.totalBonus,
    economia_total: calc.economia,
    prazo_meses: Math.max(1, prazoMeses),
    modalidade: recorrente ? 'Pagamento recorrente' : calc.count > 1 ? 'Pagamento parcelado' : 'Pagamento único',
    forma_pagamento: formaPagamento,
    parcelas: calc.count,
    valor_parcela: calc.parcela,
    entrada_valor: calc.downPayment,
    periodicidade: recorrente ? 'mensal' as const : null,
    plano_recorrente: recorrente,
    data_inicio: dataInicio,
    data_primeira_parcela: dataPrimeiraParcela,
    data_termino: calc.endDate,
    pagamento_observacao: obsPagamento || undefined,
    observacoes: obsInternas || undefined,
    status,
  });

  const salvar = async () => {
    setError('');
    if (validationErrors.length) {
      setError('Corrija os itens indicados antes de salvar.');
      setStep(validationErrors.some((e) => e.includes('Cliente') || e.includes('CPF/CNPJ') || e.includes('Cidade') || e.includes('vendedor')) ? 1 : 2);
      return;
    }
    setSaving(true);
    try {
      saveCliente({ ...clienteDraft, id: clientId });
      setClientes(listClientes());
      const contrato = await saveContrato(payload());
      navigate(`/contratos?criado=${contrato.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar o contrato.');
    } finally {
      setSaving(false);
    }
  };

  const visualizar = () => {
    if (validationErrors.length) {
      setError('Preencha os dados obrigatórios para visualizar o contrato.');
      return;
    }
    const draft = { ...payload(), id: 'preview', numero: 0, created_at: new Date().toISOString() } as ContratoLocal;
    exportPdf('Contrato de serviço publicitário', gerarContratoHtml(draft));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <PageHeader title="Novo contrato" description={`Passo ${step} de 4`} actions={
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/contratos')}>Voltar</Button>
      } />
      <div className="flex gap-2">
        {STEPS.map((label, index) => {
          const number = index + 1;
          const active = step === number;
          const done = step > number;
          return <button key={label} type="button" onClick={() => number < step && setStep(number)} className={cn('flex-1 rounded-lg border px-3 py-2 text-xs font-semibold sm:text-sm', active && 'border-brand bg-brand/10 text-brand', done && 'border-brand/40 text-brand', !active && !done && 'border-border-color text-text-secondary')}>
            <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-[10px]">{done ? <Check className="h-3 w-3" /> : number}</span>{label}
          </button>;
        })}
      </div>
      {error && <div className="rounded-lg border border-erro/40 bg-erro/10 px-4 py-3 text-sm text-erro" role="alert">{error}</div>}

      {step === 1 && <Card className="space-y-5 p-6">
        <div>
          <label className="text-sm font-medium">Cliente contratante</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <select className="flex-1 rounded-xl border border-border-color bg-bg-primary px-3 py-2.5 text-sm" value={clientId} onChange={(event) => escolherCliente(event.target.value)}>
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.razao_social}{c.cidade ? ` • ${c.cidade}` : ''}</option>)}
            </select>
            <Button type="button" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setNovoClienteOpen(true)}>Novo cliente</Button>
          </div>
          <p className="mt-2 text-xs text-text-secondary">Não encontrou o cliente? Cadastre agora mesmo sem sair desta tela.</p>
        </div>
        {clientId && <div className="space-y-3 rounded-xl border border-border-color p-4">
          <h3 className="text-sm font-semibold">Dados que serão impressos no contrato</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Razão social / Nome" value={clienteDraft.razao_social} onChange={(e) => setClienteDraft({ ...clienteDraft, razao_social: e.target.value })} />
            <Input label="CNPJ / CPF" value={clienteDraft.documento} onChange={(e) => setClienteDraft({ ...clienteDraft, documento: e.target.value })} />
            <Input label="E-mail" type="email" value={clienteDraft.email} onChange={(e) => setClienteDraft({ ...clienteDraft, email: e.target.value })} />
            <Input label="Telefone" value={clienteDraft.telefone} onChange={(e) => setClienteDraft({ ...clienteDraft, telefone: e.target.value })} />
            <Input label="Endereço" value={clienteDraft.endereco} onChange={(e) => setClienteDraft({ ...clienteDraft, endereco: e.target.value })} />
            <Input label="Número" value={clienteDraft.numero_endereco} onChange={(e) => setClienteDraft({ ...clienteDraft, numero_endereco: e.target.value })} />
            <Input label="Bairro" value={clienteDraft.bairro} onChange={(e) => setClienteDraft({ ...clienteDraft, bairro: e.target.value })} />
            <Input label="Complemento" value={clienteDraft.complemento} onChange={(e) => setClienteDraft({ ...clienteDraft, complemento: e.target.value })} />
            <Input label="CEP" value={clienteDraft.cep} onChange={(e) => setClienteDraft({ ...clienteDraft, cep: e.target.value })} />
            <Input label="Cidade" value={clienteDraft.cidade} onChange={(e) => setClienteDraft({ ...clienteDraft, cidade: e.target.value })} />
            <Input label="Estado" value={clienteDraft.estado} onChange={(e) => setClienteDraft({ ...clienteDraft, estado: e.target.value })} />
            <Input label="Vendedor responsável pela venda" value={vendedor} onChange={(e) => setVendedor(e.target.value)} />
          </div>
          <p className="text-xs text-text-secondary">O vendedor selecionado será identificado no contrato e associado à venda.</p>
        </div>}
        <div className="flex justify-end"><Button disabled={!clientId} onClick={() => setStep(2)} rightIcon={<ArrowRight className="h-4 w-4" />}>Continuar</Button></div>
      </Card>}

      {step === 2 && <Card className="space-y-6 p-6">
        <div><h3 className="text-sm font-semibold">Serviços contratados</h3><p className="text-sm text-text-secondary">Selecione apenas os serviços contratados. Somente eles aparecerão no contrato.</p></div>
        <div className="space-y-2">
          {contrataveis.map((service) => <label key={service.id} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3', selecionados.includes(service.id) ? 'border-brand/50 bg-brand/5' : 'border-border-color hover:bg-bg-tertiary/50')}>
            <input type="checkbox" className="mt-1 accent-brand" checked={selecionados.includes(service.id)} onChange={() => toggleServico(service.id)} />
            <span className="min-w-0 flex-1"><span className="flex flex-wrap justify-between gap-2 text-sm font-medium"><span>{service.nome}</span><span className="tabular-nums text-text-secondary">{formatBRL(service.valor)}{service.tipo === 'mensal' ? '/mês' : ''}</span></span><span className="text-xs text-text-secondary">{service.categoria}</span></span>
          </label>)}
        </div>
        <div className="rounded-xl border border-border-color p-4">
          <h3 className="text-sm font-semibold">Bônus (opcional)</h3>
          <p className="mb-3 text-xs text-text-secondary">Marque apenas os serviços que deseja conceder como bônus. Eles entram no contrato por R$ 0,00 e nada é adicionado automaticamente.</p>
          <div className="space-y-2">{bonificaveis.map((service) => {
            const eligible = !service.bonus_gatilhos?.length || service.bonus_gatilhos.some((id) => selecionados.includes(id));
            return <label key={service.id} className={cn('flex items-start gap-3 rounded-xl border p-3', bonusIds.includes(service.id) ? 'border-brand/50 bg-brand/5' : 'border-border-color', !eligible && 'opacity-50')}>
              <input type="checkbox" className="mt-1 accent-brand" checked={bonusIds.includes(service.id)} disabled={!eligible} onChange={() => toggleBonus(service.id)} />
              <span className="min-w-0 flex-1"><span className="flex flex-wrap justify-between gap-2 text-sm font-medium"><span>{service.nome}</span><span className="text-text-secondary">{formatBRL(service.valor)}{service.tipo === 'mensal' ? '/mês' : ''}</span></span><span className="text-xs text-text-secondary">{eligible ? `Valor de tabela: ${formatBRL(service.valor)} — como bônus: R$ 0,00` : 'Disponível apenas com site ou Landing Page contratado.'}</span></span>
            </label>;
          })}</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Unidades / empresas atendidas" type="number" min={1} max={99} value={String(unidades)} onChange={(e) => setUnidades(Math.max(1, Number(e.target.value) || 1))} />
          <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm"><div className="flex justify-between"><span>Valor total do contrato</span><strong>{formatBRL(calc.totalServicos)}</strong></div><p className="mt-1 text-xs text-text-secondary">Inclui os serviços mensais pelo prazo integral de {prazoMeses} meses.</p><p className="mt-1 text-xs text-brand">Valor comercial incluindo bônus: {formatBRL(calc.totalServicos + calc.totalBonus)}</p></div>
        </div>
        <div className="flex justify-between"><Button variant="outline" onClick={() => setStep(1)}>Voltar</Button><Button disabled={!selecionados.length} onClick={() => setStep(3)} rightIcon={<ArrowRight className="h-4 w-4" />}>Continuar</Button></div>
      </Card>}

      {step === 3 && <Card className="space-y-4 p-6">
        <h3 className="text-sm font-semibold">Condições comerciais</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Valor comercial (negociado)" placeholder={formatBRL(calc.totalServicos)} value={valorNegociado} onChange={(e) => setValorNegociado(e.target.value)} />
          <Input label="Prazo contratual (meses)" type="number" min={1} max={120} value={String(prazoMeses)} onChange={(e) => setPrazoMeses(Math.max(1, Number(e.target.value) || 1))} />
          <Input label="Início da vigência" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <Input label="Término previsto" type="date" value={calc.endDate} readOnly />
          <div><label className="text-sm font-medium">Forma de pagamento</label><select className="mt-1 w-full rounded-xl border border-border-color bg-bg-primary px-3 py-2.5 text-sm" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}><option>Pix</option><option>Boleto</option><option>Cartão de crédito</option><option>Transferência bancária</option><option>Dinheiro</option><option>Outro</option></select></div>
          <Input label="Entrada (opcional)" value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="0,00" />
          <Input label="Parcelas" type="number" min={1} max={99} value={String(parcelas)} onChange={(e) => setParcelas(Math.max(1, Number(e.target.value) || 1))} />
          <Input label="Vencimento da 1ª parcela" type="date" value={dataPrimeiraParcela} onChange={(e) => setDataPrimeiraParcela(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />Plano recorrente</label>
        <Input label="Observação de pagamento" value={obsPagamento} onChange={(e) => setObsPagamento(e.target.value)} placeholder="Ex.: vencimento todo dia 10" />
        <div><label className="text-sm font-medium">Observações internas</label><textarea className="mt-1 min-h-[80px] w-full rounded-xl border border-border-color bg-bg-primary px-3 py-2 text-sm" value={obsInternas} onChange={(e) => setObsInternas(e.target.value)} /></div>
        <div className="space-y-1 rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm">
          <div className="flex justify-between"><span>Valor total antes do desconto</span><strong>{formatBRL(calc.totalServicos)}</strong></div>
          <div className="flex justify-between"><span>Desconto negociado ({calc.discountPercent.toFixed(1)}%)</span><span>- {formatBRL(calc.discount)}</span></div>
          <div className="flex justify-between"><span>Valor comercial dos bônus</span><span>{formatBRL(calc.totalBonus)}</span></div>
          <div className="flex justify-between font-semibold"><span>Economia total do cliente</span><span>{formatBRL(calc.economia)}</span></div>
          <div className="flex justify-between border-t border-brand/20 pt-2"><strong>Valor final do contrato</strong><strong>{formatBRL(calc.finalValue)}</strong></div>
        </div>
        <p className="text-xs text-text-secondary">O investimento em mídia do Google Ads e Meta Ads é pago separadamente pela contratante e não integra o valor do contrato.</p>
        <div className="flex justify-between"><Button variant="outline" onClick={() => setStep(2)}>Voltar</Button><Button onClick={() => { setError(''); setStep(4); }} rightIcon={<ArrowRight className="h-4 w-4" />}>Revisar contrato</Button></div>
      </Card>}

      {step === 4 && <Card className="space-y-5 p-6">
        <h3 className="text-sm font-semibold">Revisar contrato</h3>
        {validationErrors.length > 0 && <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm" role="alert"><p className="font-semibold">Corrija antes de salvar:</p><ul className="mt-2 list-disc space-y-1 pl-5">{validationErrors.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        <div className="rounded-xl border border-border-color p-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-text-secondary">Cliente</p><p className="font-medium">{clienteDraft.razao_social || '—'}</p><p>{clienteDraft.documento || 'CPF/CNPJ não informado'}</p><p>{[clienteDraft.cidade, clienteDraft.estado].filter(Boolean).join(' / ') || 'Cidade não informada'}</p></div><div><p className="text-xs font-semibold uppercase text-text-secondary">Vendedor responsável</p><p>{vendedor || '—'}</p></div></div>
          <h4 className="mt-4 border-t border-border-color pt-3 text-xs font-semibold uppercase">Serviços contratados</h4>
          <ul className="mt-2 space-y-1">{calc.items.map((item) => <li key={item.servico_id} className="flex justify-between gap-2"><span>{item.nome}{item.isBonus ? ' — bônus' : ''}{item.quantidade > 1 ? ` × ${item.quantidade}` : ''}{item.tipo === 'mensal' ? ` × ${item.prazo_meses} mês(es)` : ''}</span><span className="tabular-nums">{formatBRL(item.isBonus ? 0 : item.valor_total || 0)}</span></li>)}</ul>
          <div className="mt-3 space-y-1 border-t border-border-color pt-3"><div className="flex justify-between"><span>Prazo</span><strong>{prazoMeses} meses</strong></div><div className="flex justify-between"><span>Valor antes do desconto</span><span>{formatBRL(calc.totalServicos)}</span></div><div className="flex justify-between"><span>Desconto</span><span>- {formatBRL(calc.discount)} ({calc.discountPercent.toFixed(1)}%)</span></div><div className="flex justify-between"><span>Valor comercial dos bônus</span><span>{formatBRL(calc.totalBonus)}</span></div><div className="flex justify-between"><span>Economia total</span><span>{formatBRL(calc.economia)}</span></div><div className="flex justify-between font-semibold"><span>Valor final</span><span>{formatBRL(calc.finalValue)}</span></div><div className="flex justify-between text-text-secondary"><span>Pagamento</span><span>{formaPagamento} · {recorrente ? 'recorrente' : calc.count > 1 ? `${calc.count} parcelas` : 'único'}{calc.downPayment ? ` · entrada ${formatBRL(calc.downPayment)}` : ''}</span></div><div className="flex justify-between text-text-secondary"><span>Vigência</span><span>{dataInicio} → {calc.endDate}</span></div><div className="flex justify-between text-text-secondary"><span>1º vencimento</span><span>{dataPrimeiraParcela}</span></div></div>
        </div>
        <div className="flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={() => setStep(3)}>Voltar</Button><div className="flex gap-2"><Button variant="outline" onClick={visualizar}>Pré-visualizar contrato</Button><Button loading={saving} disabled={saving || validationErrors.length > 0} onClick={salvar}>{saving ? 'Salvando...' : 'Salvar contrato'}</Button></div></div>
      </Card>}

      <Modal open={novoClienteOpen} onClose={() => setNovoClienteOpen(false)} title="Novo cliente" size="lg" footer={<><Button variant="outline" onClick={() => setNovoClienteOpen(false)}>Cancelar</Button><Button onClick={salvarClienteNovo}>Salvar</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Razão social / Nome" value={novoCliente.razao_social} onChange={(e) => setNovoCliente({ ...novoCliente, razao_social: e.target.value })} />
          <Input label="CNPJ / CPF" value={novoCliente.documento} onChange={(e) => setNovoCliente({ ...novoCliente, documento: e.target.value })} />
          <Input label="E-mail" type="email" value={novoCliente.email} onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })} />
          <Input label="Telefone" value={novoCliente.telefone} onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })} />
          <Input label="Endereço" value={novoCliente.endereco} onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })} />
          <Input label="Número" value={novoCliente.numero_endereco} onChange={(e) => setNovoCliente({ ...novoCliente, numero_endereco: e.target.value })} />
          <Input label="Bairro" value={novoCliente.bairro} onChange={(e) => setNovoCliente({ ...novoCliente, bairro: e.target.value })} />
          <Input label="Complemento" value={novoCliente.complemento} onChange={(e) => setNovoCliente({ ...novoCliente, complemento: e.target.value })} />
          <Input label="CEP" value={novoCliente.cep} onChange={(e) => setNovoCliente({ ...novoCliente, cep: e.target.value })} />
          <Input label="Cidade" value={novoCliente.cidade} onChange={(e) => setNovoCliente({ ...novoCliente, cidade: e.target.value })} />
          <Input label="Estado" value={novoCliente.estado} onChange={(e) => setNovoCliente({ ...novoCliente, estado: e.target.value })} />
          <div><label className="text-sm font-medium">Tipo</label><select className="mt-1 w-full rounded-xl border border-border-color bg-bg-primary px-3 py-2.5 text-sm" value={novoCliente.tipo} onChange={(e) => setNovoCliente({ ...novoCliente, tipo: e.target.value as 'PF' | 'PJ' })}><option value="PJ">PJ</option><option value="PF">PF</option></select></div>
        </div>
      </Modal>
    </div>
  );
}
