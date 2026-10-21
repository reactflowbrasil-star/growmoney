import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui';
import { Eraser, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  onChange: (dataUrl: string | null) => void;
  className?: string;
  height?: number;
};

export function SignaturePad({ onChange, className, height = 180 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  const getCtx = () => {
    const c = canvasRef.current;
    if (!c) return null;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    return { c, ctx };
  };

  const resize = useCallback(() => {
    const pair = getCtx();
    if (!pair) return;
    const { c, ctx } = pair;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#0f172a';
  }, [height]);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent) => {
    const pair = getCtx();
    if (!pair) return;
    drawing.current = true;
    const p = pos(e);
    pair.ctx.beginPath();
    pair.ctx.moveTo(p.x, p.y);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const pair = getCtx();
    if (!pair) return;
    const p = pos(e);
    pair.ctx.lineTo(p.x, p.y);
    pair.ctx.stroke();
    setEmpty(false);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const c = canvasRef.current;
    if (c && !empty) onChange(c.toDataURL('image/png'));
  };

  const clear = () => {
    const pair = getCtx();
    if (!pair) return;
    pair.ctx.clearRect(0, 0, pair.c.width, pair.c.height);
    setEmpty(true);
    onChange(null);
    resize();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative rounded-xl border-2 border-dashed border-border-color bg-white overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair block"
          style={{ height }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
        {empty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Assine aqui com o mouse ou o dedo
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" leftIcon={<Eraser className="w-3.5 h-3.5" />} onClick={clear}>
          Limpar
        </Button>
        {!empty && (
          <span className="text-xs text-brand inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Assinatura capturada
          </span>
        )}
      </div>
    </div>
  );
}
