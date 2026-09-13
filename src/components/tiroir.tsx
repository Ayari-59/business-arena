/**
 * Un tiroir : un titre, ce qu'il cache, et son contenu replié.
 *
 * Pourquoi un composant. La page comptait cinq replis écrits chacun à sa
 * manière — l'un avec le triangle du navigateur, l'autre avec le mot
 * « déplier », un troisième avec rien du tout. Un repli qu'on ne voit pas est
 * un contenu perdu : l'élève ne cherche pas ce qu'il ne soupçonne pas. Ils
 * partagent désormais trois signaux, et un seul endroit à corriger.
 *
 * Les trois signaux :
 *   1. le chevron, en ambre comme les autres commandes, qui PIVOTE à l'ouverture
 *      — c'est lui qui dit « ceci s'ouvre » ;
 *   2. le trait POINTILLÉ tant que le tiroir est fermé, plein une fois ouvert :
 *      visible du coin de l'œil, sans rien ajouter à lire ;
 *   3. `quoi`, qui annonce le CONTENU par son compte (« 5 clientèles »). Un
 *      titre seul dit le sujet, pas qu'il y a matière derrière. Compté depuis la
 *      donnée affichée, jamais écrit à la main : un nombre en dur mentirait dès
 *      qu'un scénario change.
 *
 * Le triangle natif est masqué (`list-none` et la règle WebKit) : on dessine le
 * nôtre, sinon les deux se superposent.
 */
export function Tiroir({
  titre,
  quoi,
  ouvert = false,
  children,
}: {
  titre: string;
  /** Ce qui attend derrière, en un mot compté : « 5 clientèles », « 3 tours ». */
  quoi?: string;
  ouvert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={ouvert}
      className="group rounded-lg border border-dashed border-white/15 bg-slate-950/60 open:border-solid open:bg-slate-950"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="text-xs text-amber-400/80 transition-transform group-open:rotate-90"
        >
          ▸
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          {titre}
        </span>
        {quoi ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-400">
            {quoi}
          </span>
        ) : null}
        <span className="ml-auto text-xs text-slate-500 group-open:hidden">déplier</span>
      </summary>
      <div className="border-t border-white/10 px-3 pb-2.5 pt-2 sm:px-3.5 sm:pb-3.5">{children}</div>
    </details>
  );
}
