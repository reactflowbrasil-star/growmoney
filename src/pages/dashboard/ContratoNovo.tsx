import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Check } from 'lucide-react';
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
  type ServicoCatalogo,
} from '@/lib/contratos-store';

const STEPS = ['Cliente', 'Serviços', 'Condições', 'Revisão'] as const;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ContratoNovo() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [clientes, setClientes] = useState<ClienteLocal[]>(() => listClientes());
  const servicos = useMemo(() => listServicosCatalogo(), []);

  const [clientId, setClientId] = useState('');
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [clienteForm, setClienteForm] = useState({
    razao_social: '',
    documento: '',
    email: '',
    telefone: '',
    cidade: '',
    tipo: 'PJ' as 'PF' | 'PJ',
  });

  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [bonusIds, setBonusIds] = useState<string[]>([]);
  const [unidades, setUnidades] = useState(1);

  const [valorNegociado, setValorNegociado] = useState('');
  const [entrada, setEntrada] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [periodicidade, setPeriodicidade] = useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal');
  const [recorrente, setRecorrente] = useState(false);
  const [dataInicio, setDataInicio] = useState(today());
  const [obsPagamento, setObsPagamento] = useState('');
  const [obsInternas, setObsInternas] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cliente = clientes.find((c) => c.id === clientId);

  const calc = useMemo(() => {
    const u = Math.max(1, unidades || 1);
    let cobradoBruto = 0;
    let bonusTotal = 0;
    const itens = servicos
      .filter((s) => selecionados.includes(s.id) || bonusIds.includes(s.id))
      .map((s) => {
        const isBonus = bonusIds.includes(s.id) && !selecionados.includes(s.id);
        const valorUnit = isBonus ? 0 : s.valor;
        const total = valorUnit * u;
        if (isBonus) bonusTotal += s.valor * u;
        else cobradoBruto += total;
        return {
          servico_id: s.id,
          nome: s.nome,
          valor: valorUnit,
          tipo: s.tipo,
          isBonus,
          quantidade: u,
        };
      });

    const valorComercial = cobradoBruto;
    const negociado = valorNegociado.trim()
      ? Number(String(valorNegociado).replace(/\./g, '').replace(',', '.')) || valorComercial
      : valorComercial;
    const descontoValor = Math.max(0, valorComercial - negociado);
    const descontoPercentual = valorComercial > 0 ? (descontoValor / valorComercial) * 100 : 0;
    const entradaVal = Number(String(entrada).replace(/\./g, '').replace(',', '.')) || 0;
    const resto = Math.max(0, negociado - entradaVal);
    const nParc = Math.max(1, Number(parcelas) || 1);
    const valorParcela = resto / nParc;
    const mesesPeriodo =
      periodicidade === 'trimestral' ? 3 : periodicidade === 'semestral' ? 6 : periodicidade === 'anual' ? 12 : 1;
    const termino = addMonths(dataInicio, Math.max(1, nParc) * (recorrente ? mesesPeriodo : 1));

    return {
      itens,
      cobradoBruto,
      valorComercial,
      negociado,
      descontoValor,
      descontoPercentual,
      bonusTotal,
      entradaVal,
      valorParcela,
      nParc,
      termino,
    };
  }, [servicos, selecionados, bonusIds, unidades, valorNegociado, entrada, parcelas, dataInicio, periodicidade, recorrente]);

  const toggleServico = (s: ServicoCatalogo) => {
    setSelecionados((prev) => {
      let next = prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id];
      if (s.exclusaoGrupo && !prev.includes(s.id)) {
        const rivals = servicos.filter((x) => x.exclusaoGrupo === s.exclusaoGrupo && x.id !== s.id).map((x) => x.id);
        next = next.filter((id) => !rivals.includes(id));
      }
      return next;
    });
    setBonusIds((b) => b.filter((id) => id !== s.id));
  };

  const toggleBonus = (s: ServicoCatalogo) => {
    if (selecionados.includes(s.id)) return;
    setBonusIds((prev) => (prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]));
  };

  const salvarCliente = () => {
    if (!clienteForm.razao_social.trim()) return;
    const c = saveCliente({ ...clienteForm, razao_social: clienteForm.razao_social.trim() });
    setClientes(listClientes());
    setClientId(c.id);
    setNovoClienteOpen(false);
    setClienteForm({ razao_social: '', documento: '', email: '', telefone: '', cidade: '', tipo: 'PJ' });
  };

  const canNext = () => {
    if (step === 1) return !!clientId;
    if (step === 2) return selecionados.length > 0;
    return true;
  };

  const salvar = async () => {
    setError('');
    if (!clientId || !cliente) {
      setError('Selecione um cliente.');
      setStep(1);
      return;
    }
    if (!selecionados.length) {
      setError('Selecione ao menos um serviço.');
      setStep(2);
      return;
    }
    setSaving(true);
    try {
      const contrato = saveContrato({
        client_id: clientId,
        cliente_nome: cliente.razao_social,
        cliente_documento: cliente.documento,
        itens: calc.itens,
        unidades: Math.max(1, unidades),
        valor_bruto: calc.cobradoBruto,
        valor: calc.negociado,
        desconto_valor: calc.descontoValor,
        desconto_percentual: calc.descontoPercentual,
        bonus_total: calc.bonusTotal,
        forma_pagamento: calc.entradaVal > 0 ? 'entrada_parcelas' : 'parcelas',
        parcelas: calc.nParc,
        valor_parcela: calc.valorParcela,
        entrada_valor: calc.entradaVal,
        periodicidade: recorrente ? periodicidade : null,
        plano_recorrente: recorrente,
        data_inicio: dataInicio,
        data_termino: calc.termino,
        pagamento_observacao: obsPagamento || undefined,
        observacoes: obsInternas || undefined,
        status: 'rascunho',
      });
      navigate(`/contratos?criado=${contrato.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar o contrato.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <PageHeader
        title="Novo contrato"
        description={`Passo ${step} de 4`}
        actions={
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/contratos')}>
            Voltar
          </Button>
        }
      />

      <div className="flex gap-2 mb-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <button
              key={label}
              type="button"
              onClick={() => n < step && setStep(n)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold sm:text-sm transition-colors',
                active && 'border-brand bg-brand/10 text-brand',
                done && 'border-brand/40 text-brand',
                !active && !done && 'border-border-color text-text-secondary'
              )}
            >
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-[10px]">
                {done ? <Check className="w-3 h-3" /> : n}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-erro/40 bg-erro/10 px-4 py-3 text-sm text-erro" role="alert">
          {error}
        </div>
      )}

      {step === 1 && (
        <Card className="space-y-4 p-6">
          <div>
            <label className="text-sm font-medium text-text-primary">Cliente contratante</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <select
                className="flex-1 rounded-xl border border-border-color bg-bg-primary px-3 py-2.5 text-sm text-text-primary"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razao_social}
                    {c.cidade ? ` · ${c.cidade}` : ''}
                  </option>
                ))}
              </select>
              <Button type="button" variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setNovoClienteOpen(true)}>
                Novo cliente
              </Button>
            </div>
            <p className="mt-2 text-xs text-text-secondary">Não encontrou? Cadastre o cliente na hora.</p>
          </div>

          {cliente && (
            <div className="rounded-lg border border-border-color bg-bg-secondary/50 p-4 text-sm space-y-1">
              <p className="font-medium">{cliente.razao_social}</p>
              <p className="text-text-secondary">{cliente.documento || 'Sem documento'}</p>
              <p className="text-text-secondary">
                {cliente.email || '—'} · {cliente.telefone || '—'}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button disabled={!canNext()} onClick={() => setStep(2)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continuar
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-5 p-6">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Serviços contratados</h3>
            <p className="text-sm text-text-secondary">Selecione apenas os serviços contratados. Somente eles aparecerão no contrato.</p>
          </div>

          <div className="space-y-2">
            {servicos.map((s) => {
              const checked = selecionados.includes(s.id);
              const asBonus = bonusIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                    checked || asBonus ? 'border-brand/50 bg-brand/5' : 'border-border-color hover:bg-bg-tertiary/50'
                  )}
                >
                  <input type="checkbox" className="mt-1 accent-brand" checked={checked} onChange={() => toggleServico(s)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-sm">{s.nome}</span>
                      <span className="text-sm tabular-nums text-text-secondary">
                        {formatBRL(s.valor)}
                        {s.tipo === 'mensal' ? '/mês' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{s.categoria}</p>
                    {s.bonus_permitido !== false && (
                      <label className="mt-2 inline-flex items-center gap-2 text-xs text-text-secondary">
                        <input
                          type="checkbox"
                          className="accent-brand"
                          checked={asBonus}
                          disabled={checked}
                          onChange={() => toggleBonus(s)}
                        />
                        Incluir como bônus (R$ 0,00)
                      </label>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <p className="text-xs text-amber-600 dark:text-amber-400">Escolha Site institucional ou Landing Page, não os dois.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Unidades / empresas atendidas</label>
              <Input
                type="number"
                min={1}
                max={99}
                value={String(unidades)}
                onChange={(e) => setUnidades(Math.max(1, Number(e.target.value) || 1))}
              />
              <p className="mt-1 text-xs text-text-secondary">Todos os valores são multiplicados por esta quantidade.</p>
            </div>
            <div className="rounded-xl border border-border-color p-4">
              <p className="text-xs font-semibold uppercase text-text-secondary">Valor dos serviços</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatBRL(calc.cobradoBruto)}</p>
              <p className="mt-1 text-xs text-text-secondary">Valor comercial antes da negociação</p>
              {calc.bonusTotal > 0 && (
                <p className="mt-2 text-xs text-brand">Bônus (tabela): {formatBRL(calc.bonusTotal)} · cobrado R$ 0,00</p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button disabled={!canNext()} onClick={() => setStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continuar
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4 p-6">
          <h3 className="text-sm font-semibold">Condições comerciais</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Valor comercial (negociado)</label>
              <Input
                placeholder={formatBRL(calc.valorComercial)}
                value={valorNegociado}
                onChange={(e) => setValorNegociado(e.target.value)}
              />
              <p className="mt-1 text-xs text-text-secondary">
                Valor de tabela: {formatBRL(calc.valorComercial)}
                {valorNegociado && (
                  <button type="button" className="ml-2 text-brand hover:underline" onClick={() => setValorNegociado('')}>
                    Voltar ao valor comercial
                  </button>
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Entrada (R$)</label>
              <Input value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label className="text-sm font-medium">{calc.entradaVal > 0 ? 'Cobranças após a entrada' : 'Parcelas'}</label>
              <Input
                type="number"
                min={1}
                max={99}
                value={String(parcelas)}
                onChange={(e) => setParcelas(Math.max(1, Number(e.target.value) || 1))}
              />
              <p className="mt-1 text-xs text-text-secondary">
                {formatBRL(calc.valorParcela)} × {calc.nParc}
                {calc.entradaVal > 0 ? ` + entrada ${formatBRL(calc.entradaVal)}` : ''}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Data de início</label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              <p className="mt-1 text-xs text-text-secondary">Término previsto: {calc.termino}</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />
            Plano recorrente
          </label>

          {recorrente && (
            <div>
              <label className="text-sm font-medium">Periodicidade</label>
              <select
                className="mt-1 w-full rounded-xl border border-border-color bg-bg-primary px-3 py-2.5 text-sm"
                value={periodicidade}
                onChange={(e) => setPeriodicidade(e.target.value as typeof periodicidade)}
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Observação de pagamento</label>
            <Input value={obsPagamento} onChange={(e) => setObsPagamento(e.target.value)} placeholder="Ex.: boleto dia 10" />
          </div>
          <div>
            <label className="text-sm font-medium">Observações internas</label>
            <textarea
              className="mt-1 w-full min-h-[80px] rounded-xl border border-border-color bg-bg-primary px-3 py-2 text-sm"
              value={obsInternas}
              onChange={(e) => setObsInternas(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Total negociado</span>
              <strong className="tabular-nums">{formatBRL(calc.negociado)}</strong>
            </div>
            {calc.descontoValor > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Desconto</span>
                <span>
                  {formatBRL(calc.descontoValor)} ({calc.descontoPercentual.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Revisar contrato
            </Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="space-y-5 p-6">
          <h3 className="text-sm font-semibold">Revisar contrato</h3>

          <div className="rounded-xl border border-border-color p-4 space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-text-secondary">Cliente</p>
              <p className="font-medium">{cliente?.razao_social}</p>
              <p className="text-text-secondary">{cliente?.documento}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-text-secondary">Serviços contratados</p>
              <ul className="mt-1 space-y-1">
                {calc.itens.map((it) => (
                  <li key={it.servico_id + String(it.isBonus)} className="flex justify-between gap-2">
                    <span>
                      {it.nome}
                      {it.isBonus ? ' · bônus' : ''}
                      {it.quantidade > 1 ? ` × ${it.quantidade}` : ''}
                    </span>
                    <span className="tabular-nums text-text-secondary">
                      {it.isBonus ? 'R$ 0,00' : formatBRL(it.valor * it.quantidade)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-border-color pt-3 space-y-1">
              <div className="flex justify-between">
                <span>Valor</span>
                <strong className="tabular-nums">{formatBRL(calc.negociado)}</strong>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Pagamento</span>
                <span>
                  {calc.entradaVal > 0 && `Entrada ${formatBRL(calc.entradaVal)} + `}
                  {calc.nParc}x {formatBRL(calc.valorParcela)}
                  {recorrente ? ` · ${periodicidade}` : ''}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Vigência</span>
                <span>
                  {dataInicio} → {calc.termino}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(3)}>
              Voltar
            </Button>
            <Button loading={saving} disabled={saving} onClick={salvar}>
              {saving ? 'Salvando...' : 'Salvar contrato'}
            </Button>
          </div>
        </Card>
      )}

      <Modal
        open={novoClienteOpen}
        onClose={() => setNovoClienteOpen(false)}
        title="Novo cliente"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setNovoClienteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarCliente}>Salvar</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Razão social / Nome"
              value={clienteForm.razao_social}
              onChange={(e) => setClienteForm({ ...clienteForm, razao_social: e.target.value })}
              required
            />
          </div>
          <Input
            label="CNPJ / CPF"
            value={clienteForm.documento}
            onChange={(e) => setClienteForm({ ...clienteForm, documento: e.target.value })}
          />
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select
              className="mt-1 w-full rounded-xl border border-border-color bg-bg-primary px-3 py-2.5 text-sm"
              value={clienteForm.tipo}
              onChange={(e) => setClienteForm({ ...clienteForm, tipo: e.target.value as 'PF' | 'PJ' })}
            >
              <option value="PJ">PJ</option>
              <option value="PF">PF</option>
            </select>
          </div>
          <Input label="E-mail" type="email" value={clienteForm.email} onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })} />
          <Input label="Telefone" value={clienteForm.telefone} onChange={(e) => setClienteForm({ ...clienteForm, telefone: e.target.value })} />
          <Input label="Cidade" value={clienteForm.cidade} onChange={(e) => setClienteForm({ ...clienteForm, cidade: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
