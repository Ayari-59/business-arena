import Link from "next/link";
import { bouton } from "@/components/bouton";
import { euros, type CarteDeTarif } from "@/config/catalogue";

/**
 * UNE CARTE D'OFFRE DE /tarifs. Le prix en grand, dans le condensé des chiffres ; « par an »
 * en petit ; la liste « Inclus » ; un bouton au pied (plein pour la seule offre mise en
 * avant). Sans état ni import serveur : /tarifs la rend, et l'aperçu de /admin/offres
 * (composant client) montre la même carte avant l'enregistrement.
 */
export function ListeInclus({ elements }: { elements: readonly string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {elements.map((x, i) => (
        <li
          key={`${i}-${x}`}
          className="relative pl-4 text-base leading-relaxed text-slate-300 before:absolute before:left-0 before:top-[0.7em] before:h-1 before:w-1 before:rounded-full before:bg-slate-400"
        >
          {x}
        </li>
      ))}
    </ul>
  );
}

/**
 * « À PARTIR DE » (vitrine premium, lot 1, décision du propriétaire). Le prix de référence
 * est un plancher : la carte le dit « À partir de 290 € par an », sur une petite ligne au-dessus
 * du montant (une carte de /tarifs fait 212 px de large à quatre par rangée : « 1 990 € » en
 * grand n'a pas la place d'un mot de plus sur sa ligne), et « Prix de référence, sur devis »
 * reste dessous. Le montant vient du catalogue, jamais d'ici. `reserve` garde la même hauteur
 * aux cartes sans prix d'une grille chiffrée (l'essai gratuit), pour que les montants
 * s'alignent ; prix éteints, aucune carte n'a cette ligne et rien ne bouge.
 */
const LIBELLE_A_PARTIR_DE = "À partir de";

export function CarteDOffre({
  offre,
  apercu = false,
  reserve = false,
}: {
  offre: CarteDeTarif;
  apercu?: boolean;
  /** Prix publics allumés : la carte sans montant garde la place de « À partir de ». */
  reserve?: boolean;
}) {
  const principal = offre.bouton.principal;
  const idDuTitre = `${apercu ? "apercu-" : ""}offre-${offre.code}`;
  return (
    <article
      data-offre={apercu ? undefined : offre.code}
      data-apercu-offre={apercu ? offre.code : undefined}
      aria-labelledby={idDuTitre}
      className={`carte flex flex-col p-6 ${principal ? "ring-1 ring-slate-300" : ""}`}
    >
      <h3 id={idDuTitre} className="text-xl font-semibold text-slate-50">
        {offre.nom}
      </h3>
      <p className="mt-1 text-sm leading-snug text-slate-400 xl:min-h-[5rem]">{offre.pourQui}</p>

      <div data-prix className="mt-5">
        {offre.prixCents !== null ? (
          <>
            <p data-a-partir-de="" className="text-sm font-medium leading-5 text-slate-300">
              {LIBELLE_A_PARTIR_DE}
            </p>
            <p className="flex h-12 items-end gap-2">
              <span className="font-display text-5xl font-bold leading-none tabular-nums text-slate-50">
                {euros(offre.prixCents)}
              </span>
              <span className="pb-1 text-base font-medium text-slate-300">par an</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Prix de référence, sur devis</p>
          </>
        ) : offre.tarif === "gratuit" ? (
          <>
            {reserve ? <p aria-hidden className="h-5" /> : null}
            <p className="flex h-12 items-end">
              <span className="text-4xl font-bold leading-none text-slate-50">Gratuit</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Sans compte</p>
          </>
        ) : (
          <>
            {reserve ? <p aria-hidden className="h-5" /> : null}
            <p className="flex h-12 items-end">
              <span className="text-4xl font-bold leading-none text-slate-50">Sur devis</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Sur mesure, établie au devis</p>
          </>
        )}
      </div>

      {offre.mention ? (
        <p className="mt-4 self-start rounded-full border border-[var(--filet-carte)] bg-[var(--voile-neutre)] px-3 py-1 text-sm font-semibold text-slate-100">
          {offre.mention}
        </p>
      ) : null}

      <p className="libelle mt-6">Inclus</p>
      <ListeInclus elements={offre.inclus} />

      <ul className="mt-4 space-y-1">
        {offre.precisions.map((p, i) => (
          <li key={`${i}-${p}`} className="text-sm leading-relaxed text-slate-400">
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Link
          href={offre.bouton.href}
          className={`${bouton({ variante: principal ? "principal" : "secondaire", taille: "l" })} w-full`}
          {...(apercu ? { tabIndex: -1, "aria-disabled": true, onClick: (e: React.MouseEvent) => e.preventDefault() } : {})}
        >
          {offre.bouton.libelle}
        </Link>
      </div>
    </article>
  );
}
