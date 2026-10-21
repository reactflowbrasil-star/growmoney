import { Link } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Zap, FileText, Calendar, DollarSign, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: 'Contratos em minutos',
      desc: 'Crie, envie e assine contratos digitais sem dor de cabeca.',
      icon: FileText,
    },
    {
      title: 'Agenda integrada',
      desc: 'Organize a equipe e os clientes em um so lugar.',
      icon: Calendar,
    },
    {
      title: 'Financeiro no controle',
      desc: 'Recebimentos, parcelas e relatorios em tempo real.',
      icon: DollarSign,
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border-color">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-xl text-verde-discreto">GrowMoney</span>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm">Comecar gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">
          Sua gestao mais inteligente.
          <br />
          <span className="text-verde-discreto">Seu negocio em crescimento.</span>
        </h1>
        <p className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto">
          Sistema completo de contratos, agenda e financeiro para pequenas empresas
          que querem parar de perder tempo e dinheiro.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link to="/cadastro">
            <Button size="lg" className="gap-2">
              Criar conta <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="lg">
              Ja tenho conta
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-12 px-4 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((f) => (
          <Card key={f.title} className={cn('p-6 text-center')}>
            <f.icon className="w-10 h-10 text-verde-discreto mx-auto mb-4" />
            <h3 className="font-semibold text-text-primary text-lg">{f.title}</h3>
            <p className="mt-2 text-sm text-text-secondary">{f.desc}</p>
          </Card>
        ))}
      </section>

      <section className="py-16 px-4 text-center bg-bg-secondary">
        <Zap className="w-12 h-12 text-verde-discreto mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary">Pronto para crescer?</h2>
        <p className="mt-2 text-text-secondary">Comece agora — leva menos de 2 minutos.</p>
        <div className="mt-6">
          <Link to="/cadastro">
            <Button size="lg">Criar conta gratuita</Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t border-border-color text-center text-sm text-text-secondary flex flex-wrap justify-center gap-6">
        <Link to="/termos" className="hover:text-text-primary">
          Termos de uso
        </Link>
        <Link to="/privacidade" className="hover:text-text-primary">
          Privacidade
        </Link>
        <span>© {new Date().getFullYear()} GrowMoney</span>
      </footer>
    </div>
  );
}
