import type { Metadata } from "next";
import Link from "next/link";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { Repliable } from "@/components/repliable";
import {
  BOUTON_ENTREPRISES,
  CONDITIONS_DE_VENTE,
  FORMULES_ENTREPRISES,
  OFFRES_ENSEIGNEMENT,
  OPTIONS,
  PRIX_HT,
  QUESTIONS_TARIFS,
  RESEAUX,
  TVA_AFFICHEE,
  prixAffiche,
  prixTTC,
  type OffreEnseignement,
} from "@/config/tarifs";

export const metadata: Metadata = {
  alternates: { canonical: "/tarifs" },
  title: "Tarifs",
  description: `Gratuit pour découvrir le simulateur en solo. L'offre Enseignant à ${prixAffiche(PRIX_HT.enseignant)} HT par an, l'offre Établissement à ${prixAffiche(PRIX_HT.etablissement)} HT par an, et des formules sur devis pour les entreprises. L'élève ne paie jamais.`,
};

/**
 * LES TARIFS.
 *
 * La page publie la grille validée par le propriétaire, et elle seule : tous
 * les prix, taux et délais se lisent dans `config/tarifs.ts`. Elle suit les
 * pages publiques claires (`/fonctionnalites`) : l'en-tête commun, des cartes
 * blanches sur le papier, le pied de page commun.
 *
 * UN SEUL BOUTON PLEIN. Il est sur l'offre Établissement, celle qu'on veut
 * vendre ; les deux autres cartes et la bande des entreprises portent un
 * bouton secondaire. Aucune mention « le plus choisi » : rien ne la mesure.
 *
 * AUCUN PAIEMENT EN LIGNE. « Commander » et « Demander un bon de commande »
 * mènent à la prise de rendez-vous : le site n'encaisse rien.
 */
export default function TarifsPage() {
  return (
    <>
      <main id="main" className="relative overflow-hidden">
        <EnTeteDePage
          surtitre="Offres et tarifs"
          titre="Tarifs"
          chapeau="Gratuit pour découvrir. Payant pour faire cours ou former une équipe."
        >
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
            Le gratuit montre, le payant organise. L&apos;élève ne paie jamais. Prix hors taxes,
            TVA {TVA_AFFICHEE}.
          </p>
        </EnTeteDePage>

        {/* LES TROIS OFFRES DE L'ENSEIGNEMENT : côte à côte sur un ordinateur,
            empilées sur un téléphone, de même hauteur (la rangée de la grille
            les étire, le bouton descend au pied de chaque carte). */}
        <section aria-labelledby="enseignement" className="mx-auto max-w-6xl px-6 pb-16 pt-6">
          <h2 id="enseignement" className="text-2xl font-bold text-slate-50">
            Pour l&apos;enseignement
          </h2>
          <div data-offres className="mt-6 grid gap-6 lg:grid-cols-3">
            {OFFRES_ENSEIGNEMENT.map((o) => (
              <CarteDOffre key={o.code} offre={o} />
            ))}
          </div>
          <p className="mt-6 text-base leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-200">Réseaux.</span> {RESEAUX.texte}{" "}
            <Link href="/rendez-vous" className={LIEN_A_L_ENCRE}>
              Nous en parler
            </Link>
          </p>
        </section>

        {/* LES ENTREPRISES : trois formules en colonnes, sans prix affiché. */}
        <section aria-labelledby="entreprises" className="mx-auto max-w-6xl px-6 pb-16">
          <div data-bande-entreprises className="carte p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 id="entreprises" className="text-2xl font-bold text-slate-50">
                Entreprises et organismes de formation
              </h2>
              <p className="text-lg font-semibold text-slate-200">Sur devis</p>
            </div>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-400">
              Les épisodes manager, en autonomie ou en cohorte, pour vos managers ou vos stagiaires.
            </p>
            <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-3">
              {FORMULES_ENTREPRISES.map((f) => (
                <div key={f.nom} className="border-t border-white/10 pt-4">
                  <h3 className="titre-carte text-slate-100">{f.nom}</h3>
                  <ListeInclus elements={f.inclus} />
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href={BOUTON_ENTREPRISES.href}
                className={bouton({ variante: "secondaire", taille: "l" })}
              >
                {BOUTON_ENTREPRISES.libelle}
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="options" className="mx-auto max-w-6xl px-6 pb-12">
          <h2 id="options" className="text-2xl font-bold text-slate-50">
            Options
          </h2>
          <ul className="mt-5 grid gap-x-10 sm:grid-cols-2">
            {OPTIONS.map((o) => (
              <li
                key={o.nom}
                className="flex items-baseline justify-between gap-4 border-t border-white/10 py-3"
              >
                <span className="text-base leading-snug text-slate-200">{o.nom}</span>
                <span className="shrink-0 text-sm font-semibold text-slate-300">{o.prix}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="conditions" className="mx-auto max-w-6xl px-6 pb-12">
          <h2 id="conditions" className="sr-only">
            Conditions de vente
          </h2>
          <Repliable
            resume="Conditions de vente"
            className="carte px-5 py-4"
            classeResume="text-base font-semibold text-slate-100"
          >
            <ul className="mt-3 space-y-2 pl-6">
              {CONDITIONS_DE_VENTE.map((c) => (
                <li key={c} className="text-sm leading-relaxed text-slate-300">
                  {c}
                </li>
              ))}
            </ul>
          </Repliable>
        </section>

        <section aria-labelledby="questions" className="mx-auto max-w-6xl px-6 pb-16">
          <h2 id="questions" className="text-2xl font-bold text-slate-50">
            Les questions qu&apos;on nous pose
          </h2>
          <dl className="mt-5 grid gap-x-10 md:grid-cols-3">
            {QUESTIONS_TARIFS.map((x) => (
              <div key={x.q} className="border-t border-white/10 py-4">
                <dt className="titre-carte text-slate-100">{x.q}</dt>
                <dd className="mt-1 text-base leading-relaxed text-slate-400">{x.r}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <PiedDePage />
    </>
  );
}

function ListeInclus({ elements }: { elements: readonly string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {elements.map((x) => (
        <li
          key={x}
          className="relative pl-4 text-base leading-relaxed text-slate-300 before:absolute before:left-0 before:top-[0.7em] before:h-1 before:w-1 before:rounded-full before:bg-slate-400"
        >
          {x}
        </li>
      ))}
    </ul>
  );
}

/**
 * UNE CARTE D'OFFRE. Le prix en grand, dans le condensé des chiffres ; « HT /
 * an » et le prix TTC en petit ; la liste « Inclus » ; un bouton au pied.
 */
function CarteDOffre({ offre }: { offre: OffreEnseignement }) {
  const principal = offre.bouton.principal === true;
  return (
    <article
      data-offre={offre.code}
      aria-labelledby={`offre-${offre.code}`}
      className={`carte flex flex-col p-6 ${principal ? "ring-1 ring-slate-300" : ""}`}
    >
      <h3 id={`offre-${offre.code}`} className="text-xl font-semibold text-slate-50">
        {offre.nom}
      </h3>
      <p className="mt-1 text-sm leading-snug text-slate-400 lg:min-h-[2.5rem]">{offre.pourQui}</p>

      <div data-prix className="mt-5">
        {offre.prixHT !== undefined ? (
          <>
            <p className="flex h-12 items-end gap-2">
              <span className="font-display text-5xl font-bold leading-none tabular-nums text-slate-50">
                {prixAffiche(offre.prixHT)}
              </span>
              <span className="pb-1 text-base font-medium text-slate-300">HT / an</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">
              soit {prixAffiche(prixTTC(offre.prixHT))} TTC
            </p>
          </>
        ) : (
          <>
            <p className="flex h-12 items-end">
              <span className="text-4xl font-bold leading-none text-slate-50">Gratuit</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Sans compte</p>
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
        {offre.precisions.map((p) => (
          <li key={p} className="text-sm leading-relaxed text-slate-400">
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Link
          href={offre.bouton.href}
          className={`${bouton({ variante: principal ? "principal" : "secondaire", taille: "l" })} w-full`}
        >
          {offre.bouton.libelle}
        </Link>
      </div>
    </article>
  );
}
