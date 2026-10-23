import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clock3, LogOut, MapPin, Navigation, Phone, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Button, Card } from '@/components/ui';
import { InstallPwaButton } from '@/components/pwa/InstallPwaButton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { formatAddress, getGoogleMapsDirectionsUrl, visitStatusLabel, type VendorVisit } from '@/lib/vendor-visit-types';
import { VendorVisitRepository } from '@/repositories/vendor-visit-repository';
import { VendorVisitService } from '@/services/vendor-visit-service';

const shortTime = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

export default function VendedorWorkspace() {
  const { user, logout } = useAuth();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [visits, setVisits] = useState<VendorVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyVisit, setBusyVisit] = useState<string | null>(null);
  const gpsWatch = useRef<number | null>(null);
  const gpsVisit = useRef<string | null>(null);
  const lastWrite = useRef<Record<string, number>>({});
  const noticeTimer = useRef<number | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 5000);
  };

  const load = useCallback(async () => {
    if (!user?.id) { setVisits([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error: lookupError } = await supabase.from('vendedores').select('id,nome,empresa_id').eq('usuario_id', user.id).eq('status', 'ativo').maybeSingle();
      if (lookupError) throw lookupError;
      if (!data?.id) { setSellerId(null); setVisits([]); setError('Seu usuário ainda não está vinculado a um cadastro ativo de vendedor. Fale com o administrador.'); return; }
      setSellerId(data.id);
      setVisits(await VendorVisitService.listForSeller(data.id));
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as visitas.'); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => { if (gpsWatch.current !== null) navigator.geolocation?.clearWatch(gpsWatch.current); if (noticeTimer.current) window.clearTimeout(noticeTimer.current); }, []);
  useEffect(() => {
    if (!sellerId || !user?.empresa_id) return;
    const channel = VendorVisitRepository.subscribe(user.empresa_id, () => { void load(); showNotice('Sua lista de visitas foi atualizada.'); });
    return () => { void supabase.removeChannel(channel); };
  }, [sellerId, user?.empresa_id, load]);

  const accept = async (visit: VendorVisit, status: 'aceita' | 'recusada') => {
    setBusyVisit(visit.id); setError('');
    try { await VendorVisitService.updateStatus(visit.id, status); await load(); showNotice(status === 'aceita' ? 'Visita aceita.' : 'Visita recusada.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a visita.'); }
    finally { setBusyVisit(null); }
  };

  const startRoute = (visit: VendorVisit) => {
    if (!navigator.geolocation) { setError('Este navegador não oferece acesso ao GPS.'); return; }
    setBusyVisit(visit.id); setError('');
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await VendorVisitService.updateStatus(visit.id, 'em_deslocamento');
        await VendorVisitService.updateLocation(visit.id, position.coords.latitude, position.coords.longitude);
        setVisits(await VendorVisitService.listForSeller(sellerId!));
        if (gpsWatch.current !== null) navigator.geolocation.clearWatch(gpsWatch.current);
        gpsVisit.current = visit.id;
        gpsWatch.current = navigator.geolocation.watchPosition((current) => {
          const now = Date.now();
          if (now - (lastWrite.current[visit.id] || 0) < 5000) return;
          lastWrite.current[visit.id] = now;
          if (gpsVisit.current !== visit.id) return;
          void VendorVisitService.updateLocation(visit.id, current.coords.latitude, current.coords.longitude).catch((cause) => setError(cause instanceof Error ? cause.message : 'Falha ao atualizar GPS.'));
        }, (cause) => setError(`GPS: ${cause.message}`), { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
        window.open(getGoogleMapsDirectionsUrl(visit.cliente_endereco, { latitude: position.coords.latitude, longitude: position.coords.longitude }), '_blank', 'noopener,noreferrer');
        await load(); showNotice('GPS ativo durante este deslocamento.');
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a rota.'); }
      finally { setBusyVisit(null); }
    }, (cause) => { setBusyVisit(null); setError(`Não foi possível acessar sua localização: ${cause.message}`); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  const complete = async (visit: VendorVisit) => {
    setBusyVisit(visit.id); setError('');
    try {
      await VendorVisitService.updateStatus(visit.id, 'realizada');
      if (gpsWatch.current !== null && gpsVisit.current === visit.id) { navigator.geolocation.clearWatch(gpsWatch.current); gpsWatch.current = null; gpsVisit.current = null; }
      await load(); showNotice('Visita concluída.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a visita.'); }
    finally { setBusyVisit(null); }
  };

  const openRoute = (visit: VendorVisit) => {
    const origin = visit.latitude_atual !== null && visit.longitude_atual !== null ? { latitude: visit.latitude_atual, longitude: visit.longitude_atual } : null;
    window.open(getGoogleMapsDirectionsUrl(visit.cliente_endereco, origin), '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="vendor-shell min-h-dvh bg-bg-secondary text-text-primary">
      <header className="sticky top-0 z-20 border-b border-border-color bg-bg-primary/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4"><BrandLogo linkTo={false} heightClass="h-10" className="max-w-[140px]"/><div className="flex items-center gap-3"><span className="hidden text-sm text-text-secondary sm:block">Olá, {user?.nome}</span><InstallPwaButton className="min-h-9 px-3 py-2 text-xs"/><Button variant="ghost" size="sm" aria-label="Sair" onClick={() => void logout()}><LogOut className="h-4 w-4"/></Button></div></div>
      </header>
      <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 pb-12 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-[#ff6a00] to-[#db4d00] p-5 text-white shadow-lg shadow-brand/20 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-white/80">GROW • VENDEDOR</p><h1 className="mt-1 text-2xl sm:text-3xl">Suas visitas</h1><p className="mt-2 max-w-xl text-sm text-white/85">Receba visitas da sua equipe, confirme sua agenda e abra rotas até o cliente.</p></div><div className="rounded-2xl bg-white/15 p-3"><Navigation className="h-6 w-6"/></div></div><div className="mt-5 flex gap-3 text-sm"><span className="rounded-full bg-white/15 px-3 py-1">{visits.filter((visit) => !['realizada','recusada','cancelada'].includes(visit.status)).length} pendentes</span><span className="rounded-full bg-white/15 px-3 py-1">{visits.filter((visit) => visit.status === 'realizada').length} realizadas</span></div></div>
        {notice && <p role="status" className="rounded-xl border border-brand/30 bg-brand/10 p-3 text-sm font-medium">{notice}</p>}
        {error && <p role="alert" className="rounded-xl border border-erro/30 bg-erro/10 p-3 text-sm text-erro">{error}</p>}
        {loading ? <Card><p className="text-center text-sm text-text-secondary">Carregando suas visitas…</p></Card> : !sellerId ? <Card><div className="py-6 text-center text-sm text-text-secondary">O cadastro precisa ser vinculado pelo administrador.</div></Card> : visits.length === 0 ? <Card><div className="py-10 text-center"><MapPin className="mx-auto mb-3 h-8 w-8 text-brand"/><p className="font-semibold">Você está em dia</p><p className="mt-1 text-sm text-text-secondary">Nenhuma visita foi enviada para você.</p></div></Card> : (
          <div className="space-y-4">{visits.map((visit) => <Card key={visit.id} className="space-y-4 border-l-4 border-l-brand p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-xs font-semibold uppercase tracking-wide text-brand">{visitStatusLabel[visit.status]}</span><h2 className="mt-1 text-xl">{visit.titulo}</h2></div><div className="flex items-center gap-1 text-xs text-text-secondary"><Clock3 className="h-4 w-4"/>{shortTime(visit.data_hora)}</div></div>
            <div className="rounded-2xl bg-bg-secondary p-4"><p className="font-semibold">{visit.cliente_nome}</p><p className="mt-1 text-sm text-text-secondary">{formatAddress(visit.cliente_endereco)}</p>{visit.cliente_telefone && <a className="mt-2 inline-flex items-center gap-2 text-sm text-brand" href={`tel:${visit.cliente_telefone}`}><Phone className="h-4 w-4"/>{visit.cliente_telefone}</a>}{visit.descricao && <p className="mt-3 text-sm">{visit.descricao}</p>}</div>
            {visit.latitude_atual !== null && visit.longitude_atual !== null && <p className="text-xs text-text-secondary">Sua posição sincronizada: {visit.localizacao_atualizada_em ? new Date(visit.localizacao_atualizada_em).toLocaleTimeString('pt-BR') : 'GPS ativo'}</p>}
            <div className="flex flex-wrap gap-2">{visit.status === 'solicitada' && <><Button loading={busyVisit === visit.id} leftIcon={<Check className="h-4 w-4"/>} onClick={() => void accept(visit, 'aceita')}>Aceitar</Button><Button variant="outline" loading={busyVisit === visit.id} leftIcon={<X className="h-4 w-4"/>} onClick={() => void accept(visit, 'recusada')}>Recusar</Button></>}{visit.status === 'aceita' && <Button loading={busyVisit === visit.id} leftIcon={<Navigation className="h-4 w-4"/>} onClick={() => startRoute(visit)}>Iniciar rota com GPS</Button>}{visit.status === 'em_deslocamento' && <><Button leftIcon={<Navigation className="h-4 w-4"/>} onClick={() => openRoute(visit)}>Abrir rota novamente</Button><Button variant="outline" loading={busyVisit === visit.id} leftIcon={<Check className="h-4 w-4"/>} onClick={() => void complete(visit)}>Concluir visita</Button></>}{['solicitada','aceita'].includes(visit.status) && <Button variant="outline" leftIcon={<MapPin className="h-4 w-4"/>} onClick={() => openRoute(visit)}>Ver endereço</Button>}</div>
          </Card>)}</div>
        )}
        <p className="text-center text-xs text-text-secondary">A localização só é acessada após tocar em “Iniciar rota” e enquanto a visita estiver em deslocamento. Mantenha o app aberto para compartilhar a posição.</p>
      </section>
    </main>
  );
}

