import { supabase } from '@/lib/supabase/client';

export type AdminResourceTable = 'empresas' | 'clients' | 'gm_contracts' | 'gm_financial_entries' | 'signature_envelopes';

export type AdminResourceRecord = Record<string, unknown> & { id: string };

export async function requirePlatformAdmin() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Entre com uma conta administrativa para continuar.');
  const { data: isAdmin, error: authorizationError } = await supabase.rpc('is_platform_admin');
  if (authorizationError) throw new Error(`Não foi possível validar a autorização administrativa: ${authorizationError.message}`);
  if (isAdmin !== true) {
    throw new Error('Esta conta não tem permissão de administração da plataforma.');
  }
  return data.user;
}
export class AdminResourceService {
  static async list(table: AdminResourceTable, columns: string, orderColumn: string): Promise<AdminResourceRecord[]> {
    await requirePlatformAdmin();
    const { data, error } = await supabase.from(table).select(columns).order(orderColumn, { ascending: false }).limit(500);
    if (error) throw new Error(`Falha ao listar registros: ${error.message}`);
    return (data || []) as unknown as AdminResourceRecord[];
  }

  static async create(table: AdminResourceTable, values: Record<string, unknown>): Promise<void> {
    const user = await requirePlatformAdmin();
    const payload = { ...values };
    if (table === 'gm_financial_entries' && !payload.criado_por) payload.criado_por = user.id;
    const { data, error } = await supabase.from(table).insert(payload).select('id').single();
    if (error) throw new Error(`Falha ao criar registro: ${error.message}`);
    await this.audit(user.id, 'registro.criado', { tabela: table, registro_id: data.id });
  }

  static async update(table: AdminResourceTable, id: string, values: Record<string, unknown>): Promise<void> {
    const user = await requirePlatformAdmin();
    const { data, error } = await supabase.from(table).update(values).eq('id', id).select('id').maybeSingle();
    if (error) throw new Error(`Falha ao atualizar registro: ${error.message}`);
    if (!data) throw new Error('Registro não encontrado ou sem permissão para alterá-lo.');
    await this.audit(user.id, 'registro.atualizado', { tabela: table, registro_id: id, campos: Object.keys(values) });
  }

  static async delete(table: AdminResourceTable, id: string): Promise<void> {
    const user = await requirePlatformAdmin();
    const { data, error } = await supabase.from(table).delete().eq('id', id).select('id').maybeSingle();
    if (error) throw new Error(`Falha ao excluir registro: ${error.message}`);
    if (!data) throw new Error('Registro não encontrado ou sem permissão para excluí-lo.');
    await this.audit(user.id, 'registro.excluido', { tabela: table, registro_id: id });
  }

  private static async audit(adminUserId: string, action: string, details: Record<string, unknown>) {
    const { error } = await supabase.rpc('admin_log_event', {
      p_action: action,
      p_details: { ...details, admin_user_id: adminUserId },
    });
    if (error) throw new Error(`Operação concluída, mas a auditoria não foi registrada: ${error.message}`);
  }
}
