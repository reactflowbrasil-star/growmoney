import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/brand';

type BrandLogoProps = {
  heightClass?: string;
  className?: string;
  linkTo?: string | false;
  compact?: boolean;
};

export function BrandLogo({
  heightClass = 'h-[84px]',
  className,
  linkTo = '/',
  compact = false,
}: BrandLogoProps) {
  const img = (
    <img
      src={BRAND.logo}
      alt={BRAND.name}
      className={cn(
        heightClass,
        'w-auto object-contain object-left select-none',
        compact ? 'max-w-[72px]' : 'max-w-[390px]',
        className
      )}
      decoding="async"
    />
  );

  if (linkTo === false) return img;

  return (
    <Link to={linkTo} className="inline-flex items-center shrink-0" aria-label={BRAND.name}>
      {img}
    </Link>
  );
}
