import { supabase } from '@/lib/supabase/client';
import { requirePlatformAdmin } from '@/services/admin-resource-service';

export const ADMIN_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const ADMIN_FILE_BUCKET = 'growmoney-files';

export type AdminFile = {
  id: string;
  user_id: string;
  categoria: string;
  bucket_id: string;
  object_path: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

export class AdminFileService {
  static async list(): Promise<AdminFile[]> {
    await requirePlatformAdmin();
    const { data, error } = await supabase.from('gm_files')
      .select('id,user_id,categoria,bucket_id,object_path,original_name,content_type,size_bytes,created_at')
      .order('created_at', { ascending: false }).limit(500);
    if (error) throw new Error(`Falha ao listar arquivos: ${error.message}`);
    return (data || []) as AdminFile[];
  }

  static async upload(file: File, categoria: string): Promise<void> {
    const user = await requirePlatformAdmin();
    if (file.size > ADMIN_FILE_MAX_BYTES) throw new Error('O arquivo excede o limite de 10 MB.');
    if (!categoria.trim()) throw new Error('Informe a categoria do arquivo.');
    const safeName = file.name.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(-120) || 'arquivo';
    const objectPath = `admin/${user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(ADMIN_FILE_BUCKET).upload(objectPath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
    if (uploadError) throw new Error(`Falha ao enviar arquivo: ${uploadError.message}`);
    const { error: metadataError } = await supabase.from('gm_files').insert({
      user_id: user.id,
      categoria: categoria.trim(),
      bucket_id: ADMIN_FILE_BUCKET,
      object_path: objectPath,
      original_name: file.name,
      content_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
    });
    if (metadataError) {
      await supabase.storage.from(ADMIN_FILE_BUCKET).remove([objectPath]);
      throw new Error(`Falha ao registrar arquivo: ${metadataError.message}`);
    }
    await this.audit(user.id, 'arquivo.criado', { object_path: objectPath });
  }

  static async update(fileId: string, values: Pick<AdminFile, 'categoria' | 'original_name'>): Promise<void> {
    const user = await requirePlatformAdmin();
    const { data, error } = await supabase.from('gm_files').update({
      categoria: values.categoria.trim(), original_name: values.original_name.trim(),
    }).eq('id', fileId).select('id').maybeSingle();
    if (error) throw new Error(`Falha ao atualizar arquivo: ${error.message}`);
    if (!data) throw new Error('Arquivo não encontrado ou sem permissão para alterá-lo.');
    await this.audit(user.id, 'arquivo.atualizado', { arquivo_id: fileId });
  }

  static async delete(file: AdminFile): Promise<void> {
    const user = await requirePlatformAdmin();
    const { error: storageError } = await supabase.storage.from(file.bucket_id).remove([file.object_path]);
    if (storageError) throw new Error(`Não foi possível remover o objeto do armazenamento: ${storageError.message}`);
    const { data, error } = await supabase.from('gm_files').delete().eq('id', file.id).select('id').maybeSingle();
    if (error) throw new Error(`Arquivo removido do armazenamento, mas falhou ao excluir o cadastro: ${error.message}`);
    if (!data) throw new Error('Objeto removido, mas o cadastro não foi encontrado. Atualize a lista.');
    await this.audit(user.id, 'arquivo.excluido', { arquivo_id: file.id, object_path: file.object_path });
  }

  static async getDownloadUrl(file: AdminFile): Promise<string> {
    await requirePlatformAdmin();
    const { data, error } = await supabase.storage.from(file.bucket_id).createSignedUrl(file.object_path, 60);
    if (error || !data?.signedUrl) throw new Error(`Falha ao abrir arquivo: ${error?.message || 'URL indisponível'}`);
    return data.signedUrl;
  }

  private static async audit(adminUserId: string, action: string, details: Record<string, unknown>) {
    const { error } = await supabase.rpc('admin_log_event', {
      p_action: action,
      p_details: { ...details, admin_user_id: adminUserId },
    });
    if (error) throw new Error(`Operação concluída, mas a auditoria não foi registrada: ${error.message}`);
  }
}
