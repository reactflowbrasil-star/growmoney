import { Card, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Rocket, Zap, Calendar, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const features = ['Contratos em minutos', 'Assinatura digital', 'Agenda e financeiro integrados'];
  return (
    <div className="min-h-screen bg-branco">
      <section className="py-20 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-preto">Sua gestao mais inteligente. Seu negocio em crescimento.</h1>
        <div className="mt-8">
          <Button className="bg-verde-discreto text-branco">Comecar</Button>
        </div>
      </section>
      <section className="py-12 px-4 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((f) => (
          <Card key={f} className={cn('p-6 text-center')}>
            <Zap className="w-8 h-8 text-verde-discreto mx-auto mb-3" />
            <h3 className="font-semibold text-preto">{f}</h3>
          </Card>
        ))}
      </section>
      <section className="py-12 text-center">
        <Button className="bg-verde-discreto text-branco">Criar conta</Button>
      </section>
      <footer className="py-8 border-t border-grafite/10 text-center text-grafite flex justify-center gap-6">
        <Link to="/termos" className="hover:text-preto">Termos</Link>
        <Link to="/privacidade" className="hover:text-preto">Privacidade</Link>
      </footer>
    </div>
  );
}