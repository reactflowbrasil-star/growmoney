import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  FileSignature,
  FileText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { BRAND } from '@/lib/brand';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { InstallPwaButton } from '@/components/pwa/InstallPwaButton';

const heroPhrases = [
  'Cresça com controle.',
  'Organize cada oportunidade.',
  'Assine com mais agilidade.',
];

const features = [
  {
    icon: FileSignature,
    title: 'Contratos e assinaturas',
    desc: 'Crie documentos, envie para assinatura e acompanhe cada etapa em um só lugar.',
  },
  {
    icon: Wallet,
    title: 'Financeiro organizado',
    desc: 'Acompanhe parcelas, recebimentos e pendências com uma visão clara da operação.',
  },
  {
    icon: Calendar,
    title: 'Agenda comercial',
    desc: 'Mantenha compromissos, visitas e próximos contatos no ritmo da sua equipe.',
  },
  {
    icon: BarChart3,
    title: 'Visão do negócio',
    desc: 'Transforme os dados da operação em indicadores simples para decidir melhor.',
  },
];

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] lg:ml-auto" aria-hidden="true">
      <div aria-hidden="true" className="absolute -inset-7 rounded-[2.5rem] bg-brand/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border-color/80 bg-bg-primary/95 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-border-color pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/12 text-brand">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-text-secondary">EXEMPLO ILUSTRATIVO</p>
              <p className="text-sm font-semibold text-text-primary">Sua operação</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Dados de exemplo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 py-4 sm:gap-4">
          <div className="rounded-2xl bg-bg-secondary p-3.5 sm:p-4">
            <p className="text-xs text-text-secondary">A receber</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">R$ 42.380</p>
            <p className="mt-1 text-[11px] font-medium text-brand-dark dark:text-brand-light">Visão financeira clara</p>
          </div>
          <div className="rounded-2xl bg-bg-secondary p-3.5 sm:p-4">
            <p className="text-xs text-text-secondary">Contratos ativos</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">24</p>
            <p className="mt-1 text-[11px] font-medium text-text-secondary">Acompanhamento simples</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border-color p-3.5 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Fluxo da operação</p>
              <p className="text-xs text-text-secondary">Um panorama para decidir</p>
            </div>
            <span className="rounded-lg bg-bg-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary">Este mês</span>
          </div>
          <svg aria-hidden="true" viewBox="0 0 420 116" className="h-24 w-full overflow-visible">
            <defs>
              <linearGradient id="landing-chart-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.24" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 94H420M0 58H420M0 22H420" stroke="var(--border-color)" strokeDasharray="4 6" />
            <path d="M0 91 C42 85 55 73 84 78 S137 67 168 70 S212 42 252 51 S301 35 334 42 S382 15 420 17 L420 116 L0 116Z" fill="url(#landing-chart-fill)" />
            <path d="M0 91 C42 85 55 73 84 78 S137 67 168 70 S212 42 252 51 S301 35 334 42 S382 15 420 17" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="334" cy="42" r="5" fill="var(--brand)" stroke="var(--bg-primary)" strokeWidth="3" />
          </svg>
          <div className="flex justify-between pt-1 text-[10px] text-text-secondary"><span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span></div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-bg-secondary/80 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand"><Check className="h-4 w-4" /></span>
            <span className="truncate text-xs font-medium text-text-primary">Assinaturas acompanhadas</span>
          </div>
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-bg-secondary/80 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand"><ShieldCheck className="h-4 w-4" /></span>
            <span className="truncate text-xs font-medium text-text-primary">Dados em um só ambiente</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 hidden items-center gap-2.5 rounded-2xl border border-border-color bg-bg-primary px-4 py-3 shadow-xl sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/12 text-brand"><Sparkles className="h-4 w-4" /></span>
        <span><span className="block text-xs font-semibold text-text-primary">Mais clareza</span><span className="block text-[11px] text-text-secondary">em cada etapa do negócio</span></span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [typedPhrase, setTypedPhrase] = useState('');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedPhrase(heroPhrases[0]);
      return;
    }

    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const phrase = heroPhrases[phraseIndex];
      if (!phrase) return;
      characterIndex += deleting ? -1 : 1;
      setTypedPhrase(phrase.slice(0, characterIndex));

      if (!deleting && characterIndex >= phrase.length) {
        deleting = true;
        timer = window.setTimeout(tick, 1700);
        return;
      }
      if (deleting && characterIndex <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % heroPhrases.length;
        timer = window.setTimeout(tick, 380);
        return;
      }
      timer = window.setTimeout(tick, deleting ? 32 : 72);
    };
    timer = window.setTimeout(tick, 220);
    return () => window.clearTimeout(timer);
  }, []);

  const phraseParts = typedPhrase.split(/(\s+)/);
  let wordIndex = -1;

  return (
    <div className="min-h-screen overflow-x-clip bg-transparent text-text-primary">
      <header className="sticky top-0 z-50 border-b border-border-color/70 bg-bg-primary/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center" aria-label={`${BRAND.name} — início`}>
            <BrandLogo linkTo={false} heightClass="h-11 sm:h-14" className="max-w-[min(44vw,210px)] object-left sm:max-w-[250px]" />
          </Link>
          <nav aria-label="Acesso" className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link to="/auth"><Button variant="ghost" size="sm" className="px-3 sm:px-4">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="sm" className="gap-1.5 px-3 sm:px-4">Começar grátis <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Button></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="gradient-hero relative isolate overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_42%_50%_at_85%_42%,rgba(255,106,0,0.12),transparent_75%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 lg:px-8 lg:py-24">
            <div className="mx-auto w-full max-w-2xl text-center lg:mx-0 lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand-dark dark:text-brand-light">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> GESTÃO COMERCIAL E FINANCEIRA
              </div>
              <h1 className="font-display text-[clamp(2.65rem,7.6vw,5.6rem)] font-light leading-[0.98] tracking-[-0.065em] text-text-primary">
                Mais clareza.
                <br />
                <span className="sr-only">{typedPhrase || heroPhrases[0]}</span>
                <span aria-hidden="true" className="text-gradient">
                  {phraseParts.map((part, index) => {
                    if (/^\s+$/.test(part)) return <span key={index}>{part}</span>;
                    wordIndex += 1;
                    return <span key={index} className={wordIndex % 2 === 1 ? 'font-bold' : 'font-light'}>{part}</span>;
                  })}
                  <span className="ml-0.5 inline-block h-[0.76em] w-[2px] translate-y-1 bg-brand align-baseline motion-safe:animate-pulse" />
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8 lg:mx-0">
                Contratos, agenda e financeiro conectados para você cuidar do crescimento com mais organização e tranquilidade.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/cadastro" className="w-full sm:w-auto"><Button size="lg" className="w-full gap-2 sm:w-auto">Criar conta grátis <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button></Link>
                <Link to="/auth" className="w-full sm:w-auto"><Button size="lg" variant="outline" className="w-full sm:w-auto">Já tenho conta</Button></Link>
              </div>
              <div className="mt-4 flex justify-center lg:justify-start"><InstallPwaButton className="w-full sm:w-auto" /></div>
              <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2.5 text-xs font-medium text-text-secondary sm:text-sm lg:justify-start">
                {['Contratos e assinaturas', 'Agenda comercial', 'Financeiro integrado'].map((label) => (
                  <span key={label} className="inline-flex items-center gap-1.5"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-brand" />{label}</span>
                ))}
              </div>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand">Tudo conectado</p>
            <h2 className="font-display text-3xl font-light leading-tight tracking-[-0.045em] text-text-primary sm:text-4xl">Uma rotina mais simples, <span className="font-bold">do contrato ao recebimento.</span></h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">Menos informação espalhada. Mais visibilidade sobre o que acontece no seu negócio.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {features.map((feature, index) => (
              <article key={feature.title} className="card-premium group relative overflow-hidden p-5 sm:p-6">
                <div aria-hidden="true" className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand/5 blur-2xl transition-colors group-hover:bg-brand/15" />
                <span className="relative mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/12 text-brand transition-transform duration-200 group-hover:scale-105"><feature.icon aria-hidden="true" className="h-5 w-5" /></span>
                <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-brand">0{index + 1}</p>
                <h3 className="relative text-base font-semibold tracking-tight text-text-primary">{feature.title}</h3>
                <p className="relative mt-2 text-sm leading-6 text-text-secondary">{feature.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-brand/20 bg-bg-primary px-6 py-12 text-center shadow-lg sm:px-10 sm:py-16">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_50%_100%,rgba(255,106,0,0.16),transparent_80%)]" />
            <div className="relative mx-auto max-w-2xl">
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/12 text-brand"><FileText aria-hidden="true" className="h-5 w-5" /></span>
              <h2 className="font-display text-3xl font-light leading-tight tracking-[-0.045em] text-text-primary sm:text-4xl">Pronto para ter <span className="font-bold">mais clareza?</span></h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{BRAND.tagline}</p>
              <Link to="/cadastro" className="mt-7 inline-flex"><Button size="lg" className="gap-2">Começar agora <ArrowRight aria-hidden="true" className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-color/80 bg-bg-primary/50 py-7">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-text-secondary sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo linkTo={false} heightClass="h-9" className="max-w-[170px] object-left opacity-90" />
            <span className="text-xs sm:text-sm">© {new Date().getFullYear()} {BRAND.name}</span>
          </div>
          <nav aria-label="Informações legais" className="flex items-center gap-5 text-xs sm:text-sm">
            <Link to="/termos" className="transition-colors hover:text-text-primary">Termos</Link>
            <Link to="/privacidade" className="transition-colors hover:text-text-primary">Privacidade</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
