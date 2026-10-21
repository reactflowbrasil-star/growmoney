import { supabase } from '@/lib/supabase/client';

export type ArquivoCategoria = 'fotos' | 'arquivos' | 'contratos' | 'auto';

export interface ArquivoEnviado {
  id: string;
  nome: string;
  caminho: string;
  url: string;
  tamanho: number;
  tipo: string;
}

const BUCKET = 'growmoney-files';

export async function criarLinkArquivo(caminho: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 60 * 60);
  if (error || !data?.signedUrl) throw new Error(`Não foi possível abrir o arquivo: ${error?.message || 'erro desconhecido'}`);
  return data.signedUrl;
}

function nomeSeguro(nome: string) {
  return nome
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-120) || 'arquivo';
}

export async function uploadArquivo(file: File, categoria: ArquivoCategoria): Promise<ArquivoEnviado> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Entre na sua conta para salvar arquivos.');

  const pasta = categoria === 'auto' ? (file.type.startsWith('image/') ? 'fotos' : 'arquivos') : categoria;
  const caminho = `${user.id}/${pasta}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${nomeSeguro(file.name)}`;
  const tipo = file.type || 'application/octet-stream';
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(caminho, file, {
    contentType: tipo,
    upsert: false,
  });

  if (uploadError) throw new Error(`Não foi possível enviar ${file.name}: ${uploadError.message}`);

  const { data: registro, error: registroError } = await supabase
    .from('gm_files')
    .insert({
      user_id: user.id,
      categoria: pasta,
      bucket_id: BUCKET,
      object_path: caminho,
      original_name: file.name,
      content_type: tipo,
      size_bytes: file.size,
    })
    .select('id')
    .single();

  if (registroError) {
    await supabase.storage.from(BUCKET).remove([caminho]);
    throw new Error(`O arquivo foi enviado, mas não foi possível registrar seus dados: ${registroError.message}`);
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, 60 * 60);

  if (signedError || !signed?.signedUrl) {
    throw new Error(`Arquivo salvo, mas não foi possível gerar o link de acesso: ${signedError?.message || 'erro desconhecido'}`);
  }

  return { id: registro.id, nome: file.name, caminho, url: signed.signedUrl, tamanho: file.size, tipo };
}
