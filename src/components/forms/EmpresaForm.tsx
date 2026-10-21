import { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface EmpresaFormProps {
  onSubmit?: (data: { nome: string; cnpj: string }) => void;
  loading?: boolean;
  defaultValues?: { nome: string; cnpj: string };
  className?: string;
}

export function EmpresaForm({ onSubmit, loading = false, defaultValues = { nome: '', cnpj: '' }, className }: EmpresaFormProps) {
  const [nome, setNome] = useState(defaultValues.nome);
  const [cnpj, setCnpj] = useState(defaultValues.cnpj);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ nome, cnpj });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <Input
        label="Nome da empresa"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
        aria-label="Nome da empresa"
      />
      <Input
        label="CNPJ"
        value={cnpj}
        onChange={(e) => setCnpj(e.target.value)}
        aria-label="CNPJ da empresa"
      />
      <Button type="submit" loading={loading} className="w-full sm:w-auto">
        Salvar
      </Button>
    </form>
  );
}
