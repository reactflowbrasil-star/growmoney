import { Card, Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function Perfil() {
  return (
    <div className="p-4 md:p-8 space-y-6 bg-branco min-h-screen">
      <h1 className="text-2xl font-bold text-preto">Perfil</h1>
      <Card className={cn('p-4 max-w-2xl')}>
        <div className="space-y-4">
          <Input placeholder="Nome" />
          <Input placeholder="Email" />
          <Button className="bg-verde-discreto text-branco"> Salvar</Button>
        </div>
      </Card>
    </div>
  );
}