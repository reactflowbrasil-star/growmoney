import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { FileText, Calendar, DollarSign, ArrowRight, Shield, Zap, BarChart3, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const features = [
    { title: 'Contratos em minutos', desc: 'Crie, envie e assine contratos digitais com rastreio completo.', icon: FileText },
    { title: 'Agenda integrada', desc: 'Organize equipe e clientes num calendário inteligente.', icon: Calendar },
    { title: 'Financeiro no controle', desc: 'Recebimentos, parcelas e fluxo de caixa em tempo real.', icon: DollarSign },
    { title: 'Relatórios executivos', desc: 'KPIs e gráficos animados para decisões rápidas.', icon: BarChart3 },
    { title: 'Segurança multiempresa', desc: 'RLS, papéis e isolamento por empresa.', icon: Shield },
    { title: 'Operação ágil', desc: 'Menos planilha, mais resultado. Tudo num só lugar.', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <header className="sticky top-0 z-50 border-b border-border-color/80 glass">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-grow-dark.svg" alt="Grow Money Digital" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/auth"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="sm" className="gap-1">Começar grátis <ArrowRight className="w-3.5 h-3.5" /></Button></Link>
          </div>
        </div>
      </header>

      <section className="gradient-hero relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand-dark text-xs font-semibold mb-6 animate-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            SaaS de gestão financeira
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] animate-in">
            Sua gestão mais inteligente.<br />
            <span className="text-gradient">Seu negócio em crescimento.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto animate-in">
            Contratos, agenda e financeiro num único sistema — feito para empresas que querem escalar sem perder o controle.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center animate-in">
            <Link to="/cadastro"><Button size="lg" className="gap-2 shadow-glow">Criar conta grátis <ArrowRight className="w-4 h-4" /></Button></Link>
            <Link to="/auth"><Button variant="outline" size="lg">Já tenho conta</Button></Link>
          </div>
          <ul className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-text-secondary">
            {['Contratos digitais', 'Parcelas e inadimplência', 'Agenda comercial', 'Dashboard em tempo real'].map((b) => (
              <li key={b} className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-brand" />{b}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tudo que você precisa</h2>
          <p className="mt-2 text-text-secondary">Módulos integrados para operar e crescer.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={f.title} className="card-premium p-6 group animate-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1.5">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto rounded-2xl gradient-brand p-8 md:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold">Pronto para crescer com o GROW?</h2>
            <p className="mt-3 text-white/85 max-w-lg mx-auto">Comece grátis. Configure sua empresa em minutos.</p>
            <Link to="/cadastro" className="inline-block mt-8">
              <Button size="lg" className="bg-white text-brand-dark hover:bg-white/95 shadow-lg gap-2">Começar agora <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border-color py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <img src="/logo-grow-dark.svg" alt="" className="h-6 w-auto opacity-80" />
            <span>© {new Date().getFullYear()} Grow Money Digital</span>
          </div>
          <div className="flex gap-4">
            <Link to="/privacidade" className="hover:text-text-primary">Privacidade</Link>
            <Link to="/termos" className="hover:text-text-primary">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
