import { supabase } from '@/lib/supabase/client';
import type { CreateClienteData, UpdateClienteData, Cliente, PaginatedResult, ClientType, ClientStatus } from '@/lib/client-types';

interface FiltrosEmpresa {
  empresaId: string;
  status?: ClientStatus;
  tipo?: ClientType;
  responsavel?: string;
  busca?: string;
  page?: number;
  limit?: number;
  order_by?: 'nome' | 'criado_em' | 'atualizado_em';
  order_dir?: 'asc' | 'desc';
}

export class ClientRepository {
  static async create(data: CreateClienteData, userId: string): Promise<Cliente> {
    const { data: cliente, error } = await supabase
      .from('clients')
      .insert({
        ...data,
        criado_por: userId,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Falha ao criar cliente: ${error.message}`);
    return cliente as unknown as Cliente;
  }

  static async findById(id: string, empresaId: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Falha ao buscar cliente: ${error.message}`);
    return (data as unknown as Cliente) || null;
  }

  static async findByDocumento(documento: string, empresaId: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('documento', documento)
      .eq('empresa_id', empresaId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Falha ao buscar cliente: ${error.message}`);
    return (data as unknown as Cliente) || null;
  }

  static async findMany(filtros: FiltrosEmpresa): Promise<PaginatedResult<Cliente>> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase.from('clients').select('*', { count: 'exact' }).eq('empresa_id', filtros.empresaId);

    if (filtros.status) query = query.eq('status', filtros.status);
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.responsavel) query = query.eq('responsavel', filtros.responsavel);

    if (filtros.busca) {
      query = query.or(`nome.ilike.%${filtros.busca}%,documento.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%`);
    }

    const orderColumn = filtros.order_by === 'nome' ? 'nome'
      : filtros.order_by === 'atualizado_em' ? 'atualizado_em'
      : 'criado_em';
    const orderDir = filtros.order_dir || 'desc';

    query = query.order(orderColumn, { ascending: orderDir === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw new Error(`Falha ao buscar clientes: ${error.message}`);

    return {
      data: (data as unknown as Cliente[]) || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    };
  }

  static async update(id: string, empresaId: string, data: UpdateClienteData, userId: string): Promise<Cliente> {
    const { data: cliente, error } = await supabase
      .from('clients')
      .update({
        ...data,
        atualizado_por: userId,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select()
      .single();

    if (error) throw new Error(`Falha ao atualizar cliente: ${error.message}`);
    return cliente as unknown as Cliente;
  }

  static async delete(id: string, empresaId: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Falha ao excluir cliente: ${error.message}`);
  }

  static async archive(id: string, empresaId: string, userId: string): Promise<Cliente> {
    return this.update(id, empresaId, { status: 'arquivado' }, userId);
  }

  static async getHistorico(clienteId: string, empresaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('client_historico')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false });

    if (error) throw new Error(`Falha ao buscar historico: ${error.message}`);
    return (data as unknown as any[]) || [];
  }

  static async addHistorico(clienteId: string, empresaId: string, acao: string, detalhes: string, userId: string): Promise<void> {
    const { error } = await supabase.from('client_historico').insert({
      cliente_id: clienteId,
      empresa_id: empresaId,
      acao,
      detalhes,
      usuario_id: userId,
      criado_em: new Date().toISOString(),
    });

    if (error) throw new Error(`Falha ao registrar historico: ${error.message}`);
  }
}
