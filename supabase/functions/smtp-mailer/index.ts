import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

type Settings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password_ciphertext: string;
  password_nonce: string;
  from_email: string;
  from_name: string;
  enabled: boolean;
};

type Action = "get_settings" | "save_settings" | "test_connection" | "test_email" | "send_signature";

const corsHeaders = (origin: string | null) => {
  const configured = Deno.env.get("APP_ORIGIN") || "https://canal360.run.place";
  const allowed = origin === configured || (Deno.env.get("ENVIRONMENT") !== "production" && !!origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : configured,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  };
};

function respond(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" },
  });
}

function getClients(request: Request): { userClient: SupabaseClient; serviceClient: SupabaseClient } {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !anonKey || !serviceKey || !authorization) throw new Error("Serviço ou sessão indisponível.");
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const serviceClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return { userClient, serviceClient };
}

async function isPlatformAdmin(client: SupabaseClient): Promise<boolean> {
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return false;
  const { data, error } = await client.rpc("is_platform_admin");
  return !error && data === true;
}

function emailIsValid(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function encodeBase64(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function encryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("SMTP_ENCRYPTION_KEY");
  if (!secret || secret.length < 32) throw new Error("SMTP_ENCRYPTION_KEY ausente ou menor que 32 caracteres.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptPassword(password: string) {
  const key = await encryptionKey();
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, new TextEncoder().encode(password));
  return { password_nonce: encodeBase64(nonce), password_ciphertext: encodeBase64(new Uint8Array(ciphertext)) };
}

async function decryptPassword(settings: Settings): Promise<string> {
  const key = await encryptionKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(settings.password_nonce) },
    key,
    decodeBase64(settings.password_ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

async function loadSettings(client: SupabaseClient): Promise<Settings | null> {
  const { data, error } = await client.from("gm_smtp_settings").select("*").eq("id", true).maybeSingle();
  if (error) throw new Error("Não foi possível carregar a configuração de e-mail.");
  return data as Settings | null;
}

function makeTransport(settings: Settings, password: string) {
  if (settings.port !== 465 || settings.secure !== true) {
    throw new Error("SMTP neste ambiente requer porta 465 com TLS seguro.");
  }
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.username, pass: password },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  });
}

function escapeHtml(value: string) {
  const replacements: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (char) => replacements[char] || char);
}

function safeHeader(value: unknown, fallback: string) {
  return (typeof value === "string" ? value : fallback).replace(/[\r\n\u0000-\u001f]/g, " ").trim().slice(0, 160) || fallback;
}

function safeSmtpFailure(error: unknown) {
  const originalMessage = error instanceof Error ? error.message : "";
  if (originalMessage.includes("SMTP_ENCRYPTION_KEY")) {
    return { message: "Configure o segredo SMTP_ENCRYPTION_KEY nas Edge Function Secrets.", code: "ENCRYPTION_KEY_MISSING" };
  }
  if (originalMessage.includes("SMTP neste ambiente requer")) {
    return { message: originalMessage, code: "SMTP_PORT_UNSUPPORTED" };
  }
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code.replace(/[^A-Z0-9_]/gi, "").slice(0, 32)
    : "";
  return {
    message: code
      ? `Falha na comunicação SMTP (${code}). Verifique servidor, porta 465 com TLS e credenciais.`
      : "Falha na comunicação SMTP. Verifique servidor, porta 465 com TLS e credenciais.",
    code: code || "SMTP_ERROR",
  };
}

function brandedEmail(title: string, intro: string, body: string, appUrl: string) {
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br>");
  const logoUrl = `${appUrl.replace(/\/$/, "")}/assets/grow-logo-black.png`;
  return `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Arial,sans-serif;color:#17202a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e6e8eb;border-radius:14px;overflow:hidden"><tr><td style="padding:24px 32px;border-bottom:3px solid #ff6a00"><img src="${logoUrl}" width="132" alt="GrowMoney" style="display:block;max-width:132px;height:auto"></td></tr><tr><td style="padding:32px"><h1 style="font-size:22px;margin:0 0 16px">${safeTitle}</h1><p style="font-size:15px;line-height:1.6;margin:0 0 16px">${safeIntro}</p><div style="font-size:15px;line-height:1.7">${safeBody}</div><p style="font-size:12px;color:#68717d;margin:28px 0 0">Mensagem enviada pelo sistema GrowMoney.</p></td></tr></table></td></tr></table></body></html>`;
}

async function logMail(client: SupabaseClient, actorId: string, action: string, recipient: string | null, success: boolean, details: Record<string, unknown> = {}) {
  await client.from("gm_smtp_mail_log").insert({
    actor_id: actorId,
    action,
    recipient,
    status: success ? "success" : "failure",
    details,
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return respond({ error: "Método não permitido." }, 405, origin);

  let clients: ReturnType<typeof getClients>;
  let actorId: string;
  try {
    clients = getClients(request);
    const { data: { user }, error } = await clients.userClient.auth.getUser();
    if (error || !user) return respond({ error: "Sessão inválida ou expirada." }, 401, origin);
    actorId = user.id;
  } catch {
    return respond({ error: "Serviço ou sessão indisponível." }, 503, origin);
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return respond({ error: "Corpo da solicitação inválido." }, 400, origin);
  }
  const action = input.action as Action;
  if (!["get_settings", "save_settings", "test_connection", "test_email", "send_signature"].includes(action)) {
    return respond({ error: "Ação inválida." }, 400, origin);
  }

  const adminAction = action !== "send_signature";
  if (adminAction && !(await isPlatformAdmin(clients.userClient))) {
    return respond({ error: "Acesso restrito ao administrador da plataforma." }, 403, origin);
  }

  if (action === "get_settings") {
    try {
      const settings = await loadSettings(clients.serviceClient);
      return respond({ settings: settings ? {
        host: settings.host, port: settings.port, secure: settings.secure,
        username: settings.username, fromEmail: settings.from_email,
        fromName: settings.from_name, enabled: settings.enabled,
        passwordConfigured: Boolean(settings.password_ciphertext),
      } : null }, 200, origin);
    } catch (error) {
      return respond({ error: error instanceof Error ? error.message : "Falha ao consultar SMTP." }, 500, origin);
    }
  }

  if (action === "save_settings") {
    const host = typeof input.host === "string" ? input.host.trim().toLowerCase() : "";
    const port = Number(input.port);
    const username = typeof input.username === "string" ? input.username.trim() : "";
    const fromEmail = typeof input.fromEmail === "string" ? input.fromEmail.trim().toLowerCase() : "";
    const fromName = typeof input.fromName === "string" ? input.fromName.trim() : "";
    const password = typeof input.password === "string" ? input.password : "";
    const secure = input.secure === true;
    const enabled = input.enabled !== false;
    if (port !== 465 || secure !== true) {
      return respond({ error: "Use a porta 465 com TLS seguro. As portas SMTP 25 e 587 são bloqueadas neste ambiente." }, 400, origin);
    }
    if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)
      || !username || username.length > 254 || !emailIsValid(fromEmail) || !fromName || fromName.length > 120
      || password.length > 1024) {
      return respond({ error: "Revise host, porta, usuário, remetente e nome do remetente." }, 400, origin);
    }
    try {
      const previous = await loadSettings(clients.serviceClient);
      let encrypted = previous ? {
        password_nonce: previous.password_nonce,
        password_ciphertext: previous.password_ciphertext,
      } : null;
      if (password) encrypted = await encryptPassword(password);
      if (!encrypted) return respond({ error: "Informe uma senha SMTP para configurar o envio." }, 400, origin);
      const { error } = await clients.serviceClient.from("gm_smtp_settings").upsert({
        id: true, host, port, secure, username,
        ...encrypted,
        from_email: fromEmail, from_name: fromName, enabled,
        updated_by: actorId, updated_at: new Date().toISOString(),
      });
      if (error) throw new Error("Não foi possível salvar a configuração SMTP.");
      const { error: auditError } = await clients.userClient.rpc("admin_log_event", {
        p_action: "smtp_settings_updated",
        p_details: { changedFields: ["host", "port", "secure", "username", "from_email", "from_name", "enabled", ...(password ? ["password"] : [])], host, port, fromEmail, fromName, enabled },
      });
      if (auditError) throw new Error("Configuração salva, mas o evento de auditoria não foi registrado.");
      return respond({ saved: true, passwordConfigured: true }, 200, origin);
    } catch (error) {
      const message = error instanceof Error && error.message.includes("SMTP_ENCRYPTION_KEY")
        ? error.message
        : error instanceof Error ? error.message : "Falha ao salvar configuração SMTP.";
      return respond({ error: message }, 500, origin);
    }
  }

  if (action === "send_signature") {
    const envelopeId = typeof input.envelopeId === "string" ? input.envelopeId : "";
    if (!/^[0-9a-f-]{36}$/i.test(envelopeId)) return respond({ error: "Envelope inválido." }, 400, origin);
    const { data: row, error: envelopeError } = await clients.userClient
      .from("signature_envelopes").select("id, owner_id, payload").eq("id", envelopeId).maybeSingle();
    if (envelopeError || !row || (row.owner_id !== actorId && !(await isPlatformAdmin(clients.userClient)))) {
      return respond({ error: "Envelope não encontrado ou sem permissão para envio." }, 404, origin);
    }
    const envelope = row.payload as Record<string, unknown>;
    if (["cancelado", "expirado", "concluido"].includes(String(envelope.status))) {
      return respond({ error: "Este envelope não pode mais ser enviado." }, 409, origin);
    }
    const signers = Array.isArray(envelope.signers) ? envelope.signers as Array<Record<string, unknown>> : [];
    const recipients = signers.filter((signer) => signer.role === "sign" && signer.status !== "signed" && signer.emailSentAt == null);
    if (recipients.length > 20) return respond({ error: "O envelope excede o limite de 20 signatários por envio." }, 400, origin);
    if (recipients.some((signer) => !emailIsValid(signer.email) || typeof signer.token !== "string" || !/^[a-f0-9]{48}$/i.test(signer.token))) {
      return respond({ error: "Há signatário pendente com e-mail ou link inválido. Revise o envelope antes do envio." }, 400, origin);
    }
    if (!recipients.length && envelope.status === "rascunho") return respond({ error: "Não há signatários pendentes para envio." }, 400, origin);
    const accepted: string[] = [];
    let totalRecipients = recipients.length;
    try {
      const settings = await loadSettings(clients.serviceClient);
      if (!settings?.enabled) throw new Error("O serviço SMTP não está configurado ou está desativado.");
      const password = await decryptPassword(settings);
      const transport = makeTransport(settings, password);
      await transport.verify();
      const appUrl = Deno.env.get("APP_BASE_URL") || "https://canal360.run.place/grow";
      for (const signer of recipients) {
        if (!emailIsValid(signer.email)) continue;
        const signingUrl = `${appUrl.replace(/\/$/, "")}/assinar/${encodeURIComponent(String(signer.token || ""))}`;
        const message = typeof envelope.messageToSigners === "string" ? envelope.messageToSigners : "";
        const signerName = safeHeader(signer.nome, "");
        const title = safeHeader(envelope.titulo, "Documento");
        const text = `Olá ${signerName},\n\nVocê recebeu o documento “${title}” para revisar e assinar.\n\n${message}\n\nAcesse seu link pessoal: ${signingUrl}\n\nSe você não esperava este e-mail, entre em contato com quem enviou o documento.`;
        await transport.sendMail({
          from: { name: settings.from_name, address: settings.from_email },
          to: String(signer.email),
          subject: `Assinatura: ${title}`,
          text,
          html: brandedEmail("Documento para assinatura", `Olá ${signerName}, você recebeu um documento para revisar e assinar.`, `${title}\n\n${message}\n\nAcesse seu link pessoal: ${signingUrl}`, appUrl),
        });
        signer.emailSentAt = new Date().toISOString();
        accepted.push(String(signer.email));
        envelope.signers = signers;
        envelope.updatedAt = new Date().toISOString();
        const { error: persistError } = await clients.userClient.from("signature_envelopes")
          .update({ payload: envelope, updated_at: envelope.updatedAt }).eq("id", envelopeId);
        if (persistError) throw new Error("E-mail enviado, mas não foi possível registrar o envio no envelope. Confira a auditoria antes de reenviar.");
      }
      envelope.status = "enviado";
      envelope.sentAt = envelope.sentAt || new Date().toISOString();
      envelope.updatedAt = new Date().toISOString();
      const events = Array.isArray(envelope.events) ? envelope.events as Array<Record<string, unknown>> : [];
      events.push({ id: crypto.randomUUID(), at: envelope.updatedAt, type: "sent", message: `Convites enviados por SMTP para ${accepted.length} signatário(s)`, actor: actorId });
      envelope.events = events;
      const { error: finalPersistError } = await clients.userClient.from("signature_envelopes")
        .update({ payload: envelope, updated_at: envelope.updatedAt }).eq("id", envelopeId);
      if (finalPersistError) throw new Error("Convites enviados, mas não foi possível finalizar o registro do envelope.");
      await logMail(clients.serviceClient, actorId, "signature_email", accepted.join(", "), true, { envelopeId, sentCount: accepted.length });
      return respond({ sent: true, sentCount: accepted.length, envelope }, 200, origin);
    } catch (error) {
      const failure = safeSmtpFailure(error);
      const errorMessage = accepted.length
        ? `${accepted.length} de ${totalRecipients} convite(s) foram enviados. Os envios confirmados foram registrados; verifique o envelope antes de tentar novamente.`
        : failure.message;
      const persistenceFailure = error instanceof Error && error.message.includes("E-mail enviado, mas não foi possível registrar");
      await logMail(clients.serviceClient, actorId, "signature_email", null, false, {
        envelopeId, errorCode: persistenceFailure ? "DELIVERY_STATE_PERSISTENCE_FAILED" : failure.code,
        sentCount: accepted.length, totalCount: totalRecipients,
      });
      return respond({ error: persistenceFailure
        ? "O servidor SMTP aceitou um convite, mas o sistema não confirmou o registro. Não repita o envio sem conferir primeiro a caixa do destinatário."
        : errorMessage, sentCount: accepted.length, totalCount: totalRecipients }, 502, origin);
    }
  }

  try {
    const settings = await loadSettings(clients.serviceClient);
    if (!settings?.enabled) return respond({ error: "Configure e ative o SMTP antes de testar o envio." }, 409, origin);
    const password = await decryptPassword(settings);
    const transport = makeTransport(settings, password);
    if (action === "test_connection") {
      await transport.verify();
      await logMail(clients.serviceClient, actorId, "connection_test", null, true, { host: settings.host, port: settings.port });
      return respond({ valid: true, message: "Conexão e autenticação SMTP validadas." }, 200, origin);
    }
    if (action === "test_email") {
      const to = input.to;
      if (!emailIsValid(to)) return respond({ error: "Informe um endereço de e-mail válido para o teste." }, 400, origin);
      await transport.verify();
      const appUrl = Deno.env.get("APP_BASE_URL") || "https://canal360.run.place/grow";
      await transport.sendMail({
        from: { name: settings.from_name, address: settings.from_email }, to,
        subject: "Teste de envio — GrowMoney",
        text: "O envio de e-mails do GrowMoney está configurado e funcionando.",
        html: brandedEmail("Teste de envio realizado", "Este é um e-mail de validação do sistema.", "O servidor SMTP está conectado e o envio de mensagens foi confirmado.", appUrl),
      });
      await logMail(clients.serviceClient, actorId, "test_email", to, true, {});
      return respond({ sent: true, message: `E-mail de teste enviado para ${to}.` }, 200, origin);
    }
    return respond({ error: "Ação não suportada." }, 400, origin);
  } catch (error) {
    const failure = safeSmtpFailure(error);
    await logMail(clients.serviceClient, actorId, action === "test_email" ? "test_email" : "connection_test", null, false, { errorCode: failure.code });
    return respond({ error: failure.message }, 502, origin);
  }
});
