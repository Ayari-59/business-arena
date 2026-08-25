/**
 * La marque seule (le podium dans l'arène ouverte) en monochrome :
 * héritée de currentColor, elle se pose sur n'importe quel fond —
 * dos de cartes, tampons, boutons. Version couleur : /brand/logo-mark.svg.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        d="M 69.72 12.92 A 42 42 0 1 1 30.28 12.92"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <rect x="22" y="43" width="16" height="30" rx="3" fill="currentColor" />
      <rect x="42" y="27" width="16" height="46" rx="3" fill="currentColor" />
      <rect x="62" y="51" width="16" height="22" rx="3" fill="currentColor" />
    </svg>
  );
}
