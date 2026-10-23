import { useLocation } from 'react-router-dom';

const canal360Logo = `${import.meta.env.BASE_URL}assets/canal360-logo.png`;

/** Shared attribution displayed on every application route. */
export function GlobalFooter() {
  const { pathname } = useLocation();
  // The public landing page has its own brand and legal footer.
  if (pathname === '/') return null;

  return (
    <footer className="relative z-10 mt-auto flex min-h-14 w-full items-center justify-center border-t border-border-color/70 bg-bg-primary/75 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] pl-4 pr-28 backdrop-blur-sm sm:pr-32">
      <div className="flex max-w-full items-center justify-center gap-2.5 text-xs font-medium text-text-secondary sm:text-sm">
        <span>Web/App by:</span>
        <span className="inline-flex h-8 max-w-[min(9rem,42vw)] items-center justify-center overflow-hidden rounded-md bg-[#06141a] px-2.5 py-1">
          <img
            src={canal360Logo}
            alt="Canal360°"
            className="block h-full max-h-6 w-auto max-w-full object-contain"
            loading="eager"
            decoding="async"
          />
        </span>
      </div>
    </footer>
  );
}

