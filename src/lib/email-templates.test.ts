import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_KEYS,
  ensureEmailLink,
  mergeEmailTemplates,
  renderEmailTemplate,
  validateEmailTemplate,
} from './email-templates';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);

describe('modelos de e-mail', () => {
  it('fornece modelos padrão com logo no cabeçalho e dados empresariais no rodapé', () => {
    expect(EMAIL_TEMPLATE_KEYS).toHaveLength(4);
    for (const template of Object.values(DEFAULT_EMAIL_TEMPLATES)) {
      expect(template.html).toContain('{{logoUrl}}');
      expect(template.html).toContain('GROWMONEY DIGITAL LTDA');
      expect(template.html).toContain('10.949.897/0001-58');
      expect(template.html).toContain('class="email-shell" width="100%"');
      expect(template.html).toContain('@media screen and (max-width:620px)');
      expect(template.html).toContain('display:block;width:132px');
    }
  });

  it('orienta o vendedor a ativar o cadastro e definir a própria senha', () => {
    const activation = DEFAULT_EMAIL_TEMPLATES.vendor_activation.html;
    expect(activation).toContain('Confirme seu e-mail e defina sua senha');
    expect(activation).toContain('href="{{link}}"');
    expect(activation).toContain('Ativar e definir senha');
  });

  it('mantém o link de ativação visível mesmo se o modelo editável não tiver o botão', () => {
    const link = 'https://project.supabase.co/auth/v1/verify?token=abc&redirect_to=https%3A%2F%2Fcanal360.run.place';
    const html = ensureEmailLink('<html><body><p>Convite</p></body></html>', link, escapeHtml, 'Ativar cadastro');

    expect(html).toContain(`href="${link.replace(/&/g, '&amp;')}"`);
    expect(html).toContain('Ativar cadastro');
    expect(html).toContain('Se o botão não abrir, copie este endereço');
    expect(html.indexOf('href=')).toBeLessThan(html.indexOf('</body>'));
  });

  it('não duplica o link quando o modelo já o inclui', () => {
    const link = 'https://project.supabase.co/auth/v1/verify?token=abc';
    const html = ensureEmailLink(`<a href="${link}">${link}</a>`, link, escapeHtml);
    expect(html.match(/Abrir link/g)).toBeNull();
  });

  it('substitui variáveis escapando valores fornecidos pelo usuário', () => {
    expect(renderEmailTemplate('<p>{{nome}}</p>', { nome: '<script>alert(1)</script>' }, escapeHtml))
      .toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('rejeita HTML executável e assuntos ou corpos fora do limite', () => {
    expect(validateEmailTemplate({ subject: 'Seguro', html: '<img src=x onerror=alert(1)>' })).toContain('executáveis');
    expect(validateEmailTemplate({ subject: '', html: '<p>Olá</p>' })).toContain('assunto');
    expect(validateEmailTemplate({ subject: 'Teste', html: 'x'.repeat(50001) })).toContain('50.000');
  });

  it('mescla valores armazenados aos padrões e ignora modelos inválidos', () => {
    const templates = mergeEmailTemplates({ vendor_activation: { subject: 'Boas-vindas', html: '<p>Olá {{nome}}</p>' }, signature: { subject: '', html: '' } });
    expect(templates.vendor_activation.subject).toBe('Boas-vindas');
    expect(templates.signature).toEqual(DEFAULT_EMAIL_TEMPLATES.signature);
    expect(templates.test_email).toEqual(DEFAULT_EMAIL_TEMPLATES.test_email);
  });
});

