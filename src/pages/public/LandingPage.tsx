import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, Calendar, Wallet, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui';
import { BRAND } from '@/lib/brand';

const features = [
  { icon: FileText, title: 'Contratos digitais', desc: 'Crie, envie e acompanhe assinaturas em um só lugar.' },
  { icon: Wallet, title: 'Parcelas e inadimplência', desc: 'Controle financeiro com alertas e comprovantes.' },
  { icon: Calendar, title: 'Agenda comercial', desc: 'Reuniões, visitas e follow-ups organizados.' },
  { icon: BarChart3, title: 'Dashboard em tempo real', desc: 'KPIs e gráficos para decisões rápidas.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <header className="sticky top-0 z-50 border-b border-border-color/80 glass">
        <div className="max-w-6xl mx-auto px-4 h-28 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={BRAND.logo}
              alt={BRAND.name}
              className="h-[72px] md:h-[84px] w-auto max-w-[330px] object-contain"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm" className="gap-1">
                Começar grátis <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="gradient-hero relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32 text-center">
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className="h-[96px] md:h-[120px] w-auto max-w-[480px] mx-auto object-contain mb-8"
          />
          <p className="text-sm font-medium text-brand mb-4">SaaS de gestão financeira</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Sua gestão mais inteligente.
            <br />
            <span className="text-brand">Seu negócio em crescimento.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-text-secondary max-w-2xl mx-auto">
            Contratos, agenda e financeiro num único sistema — feito para empresas que querem
            escalar sem perder o controle.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/cadastro">
              <Button size="lg" className="gap-2">
                Criar conta grátis <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Já tenho conta
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-secondary">
            {['Contratos digitais', 'Parcelas e inadimplência', 'Agenda comercial', 'Dashboard em tempo real'].map(
              (t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand" /> {t}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">Tudo que você precisa</h2>
          <p className="text-text-secondary mt-2">Módulos integrados para operar e crescer.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-2xl border border-border-color bg-bg-primary card-premium"
            >
              <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-text-secondary mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border-color">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <img
            src={BRAND.logo}
            alt=""
            className="h-[84px] w-auto max-w-[360px] mx-auto object-contain mb-6 opacity-95"
          />
          <h2 className="text-2xl md:text-3xl font-bold">Pronto para crescer com o GROW?</h2>
          <p className="text-text-secondary mt-2 mb-6">{BRAND.tagline}</p>
          <Link to="/cadastro">
            <Button size="lg" className="gap-2">
              Começar agora <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-color py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-3">
            <img
              src={BRAND.logo}
              alt=""
              className="h-[60px] w-auto max-w-[240px] object-contain opacity-90"
            />
            <span>
              © {new Date().getFullYear()} {BRAND.name}
            </span>
          </div>
          <div className="flex gap-4">
            <Link to="/termos" className="hover:text-text-primary">
              Termos
            </Link>
            <Link to="/privacidade" className="hover:text-text-primary">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
