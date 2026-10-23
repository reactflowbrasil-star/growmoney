import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type RequestBody =
  | { action: 'create'; empresaId: string; email: string; password: string; nome: string }
  | { action: 'delete'; empresaId: string; userId: string };

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'Método não permitido.' });

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json(401, { error: 'Autenticação necessária.' });

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceRoleKey) {
    return json(500, { error: 'Configuração segura do serviço indisponível.' });
  }

  const token = authorization.slice('Bearer '.length);
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const serviceClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user: actor }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !actor) return json(401, { error: 'Sessão inválida ou expirada.' });

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Corpo JSON inválido.' });
  }

  if (!body || typeof body !== 'object' || !body.empresaId || (body.action !== 'create' && body.action !== 'delete')) {
    return json(400, { error: 'Ação ou empresa inválida.' });
  }

  const { data: platformAdminRecord, error: platformAdminError } = await serviceClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', actor.id)
    .maybeSingle();
  if (platformAdminError) return json(500, { error: 'Falha ao verificar permissões administrativas.' });
  if (!platformAdminRecord) return json(403, { error: 'Apenas administradores da plataforma podem gerenciar contas.' });

  if (body.action === 'create') {
    if (typeof body.email !== 'string' || typeof body.nome !== 'string' || typeof body.password !== 'string') {
      return json(400, { error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    const email = body.email.trim().toLowerCase();
    const nome = body.nome.trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || !nome || nome.length > 120 || body.password.length < 8) {
      return json(400, { error: 'Informe nome, e-mail válido e senha com pelo menos 8 caracteres.' });
    }

    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: { nome, full_name: nome },
    });
    if (createError || !created.user) {
      return json(400, { error: createError?.message || 'Não foi possível criar a conta.' });
    }

    const { error: profileError } = await serviceClient.from('profiles').upsert({
      id: created.user.id,
      email,
      nome,
      role: 'vendedor',
    });
    const { error: memberError } = profileError
      ? { error: profileError }
      : await serviceClient.from('empresa_members').insert({
          empresa_id: body.empresaId,
          usuario_id: created.user.id,
          role: 'vendedor',
          status: 'aceito',
          aceito_em: new Date().toISOString(),
        });

    if (profileError || memberError) {
      await serviceClient.auth.admin.deleteUser(created.user.id);
      return json(500, { error: 'Não foi possível concluir a vinculação; a conta criada foi revertida.' });
    }

    const { error: auditError } = await serviceClient.from('gm_admin_audit').insert({
      admin_user_id: actor.id,
      action: 'usuario.criado',
      details: { email, role: 'vendedor', empresa_id: body.empresaId },
    });
    if (auditError) {
      await serviceClient.auth.admin.deleteUser(created.user.id);
      return json(500, { error: 'Não foi possível registrar auditoria; a conta criada foi revertida.' });
    }
    return json(201, { userId: created.user.id, email, nome, role: 'vendedor' });
  }

  if (typeof body.userId !== 'string' || !body.userId || body.userId === actor.id) return json(400, { error: 'Usuário de destino inválido.' });
  const { data: target, error: targetError } = await serviceClient.auth.admin.getUserById(body.userId);
  if (targetError || !target.user) return json(404, { error: 'Usuário não encontrado.' });
  const { data: targetPlatformAdmin, error: targetPlatformAdminError } = await serviceClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', body.userId)
    .maybeSingle();
  if (targetPlatformAdminError) return json(500, { error: 'Falha ao verificar conta de destino.' });
  if (targetPlatformAdmin) {
    return json(403, { error: 'Contas de administração da plataforma não podem ser removidas por esta operação.' });
  }

  const { data: targetMembership, error: targetMembershipError } = await serviceClient
    .from('empresa_members')
    .select('role')
    .eq('empresa_id', body.empresaId)
    .eq('usuario_id', body.userId)
    .eq('status', 'aceito')
    .maybeSingle();
  if (targetMembershipError) return json(500, { error: 'Falha ao verificar usuário.' });
  if (targetMembership?.role !== 'vendedor') return json(403, { error: 'Somente contas de vendedor vinculadas podem ser removidas.' });

  const { data: otherMemberships, error: otherMembershipsError } = await serviceClient
    .from('empresa_members')
    .select('id')
    .eq('usuario_id', body.userId)
    .neq('empresa_id', body.empresaId);
  if (otherMembershipsError) return json(500, { error: 'Falha ao verificar os vínculos do usuário.' });
  if (otherMemberships?.length) {
    return json(409, { error: 'Esta conta também pertence a outra empresa. Remova os outros vínculos antes de excluir a conta.' });
  }

  const { data: ownedCompanies, error: ownedCompaniesError } = await serviceClient
    .from('empresas')
    .select('id')
    .eq('responsavel_id', body.userId)
    .limit(1);
  if (ownedCompaniesError) return json(500, { error: 'Falha ao verificar titularidade.' });
  if (ownedCompanies?.length) return json(409, { error: 'Esta conta é responsável por uma empresa e não pode ser excluída.' });

  const { error: auditError } = await serviceClient.from('gm_admin_audit').insert({
    admin_user_id: actor.id,
    action: 'usuario.exclusao_solicitada',
    details: { email: target.user.email, role: 'vendedor', empresa_id: body.empresaId },
  });
  if (auditError) return json(500, { error: 'Não foi possível registrar a auditoria da exclusão.' });

  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(body.userId);
  if (deleteError) {
    await serviceClient.from('gm_admin_audit').insert({
      admin_user_id: actor.id,
      action: 'usuario.exclusao_falhou',
      details: { email: target.user.email, role: 'vendedor', empresa_id: body.empresaId },
    });
    return json(500, { error: 'Não foi possível excluir a conta. Verifique dependências de armazenamento ou vínculos.' });
  }

  await serviceClient.from('gm_admin_audit').insert({
    admin_user_id: actor.id,
    action: 'usuario.excluido',
    details: { email: target.user.email, role: 'vendedor', empresa_id: body.empresaId },
  });
  return json(200, { userId: body.userId, deleted: true });
});
