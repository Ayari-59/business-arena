import type { Metadata } from "next";
import Link from "next/link";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { Repliable } from "@/components/repliable";
import {
  BOUTON_EN_CLASSE,
  BOUTON_ENTREPRISES,
  CONDITIONS_DE_VENTE,
  FORMULE_EN_CLASSE,
  FORMULES_ENTREPRISES,
  LES_OFFRES_DE_L_ARENE,
  MENTION_TVA,
  OFFRES,
  OFFRES_ENSEIGNEMENT,
  OPTIONS,
  PRIX,
  QUESTIONS_TARIFS,
  RESEAUX,
  nomDOffre,
  prixAffiche,
  prixParAn,
  type OffreEnseignement,
} from "@/config/tarifs";
import { VENDEUR } from "@/config/editeur";
import { LIEN_CONTACT } from "@/config/navigation";

export const metadata: Metadata = {
  alternates: { canonical: "/tarifs" },
  title: "Tarifs",
  description: `Gratuit pour découvrir le simulateur en solo. ${nomDOffre("classe")} à ${prixParAn(PRIX.classe)}, ${nomDOffre("campus").toLowerCase()} à ${prixParAn(PRIX.campus)}, épisodes manager à part : tout se vend sur devis. ${MENTION_TVA}. L'élève ne paie jamais.`,
};

/**
 * LES TARIFS.
 *
 * La page publie la grille validée par le propriétaire, et elle seule : les noms, les
 * prix, les délais et les phrases se lisent dans `config/tarifs.ts`. Elle suit les
 * pages publiques claires (`/fonctionnalites`) : l'en-tête commun, des cartes
 * blanches sur le papier, le pied de page commun.
 *
 * TOUT SE VEND SUR DEVIS. Les prix de Classe et de Campus restent affichés, comme
 * prix de référence ; chaque carte porte « Demander un devis », qui mène à la demande
 * écrite avec l'offre pré-remplie (`/devis?offre=…`). Le rendez-vous téléphonique
 * reste proposé à côté, en lien. Le site n'encaisse rien.
 *
 * UN SEUL BOUTON PLEIN. Il est sur l'offre Campus, celle qu'on veut vendre ; les
 * autres cartes et la bande des épisodes portent un bouton secondaire. Aucune
 * mention « le plus choisi » : rien ne la mesure.
 *
 * LES ÉPISODES MANAGER SONT UNE OFFRE À PART, sur devis : les cartes de l'arène le
 * disent, et la bande des épisodes aussi.
 */
export default function TarifsPage() {
  return (
    <>
      <main id="main" className="relative overflow-hidden">
        <EnTeteDePage
          surtitre="Offres et tarifs"
          titre="Tarifs"
          chapeau="Gratuit pour découvrir. Sur devis pour faire cours ou former une équipe."
        >
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
            Le gratuit montre, le payant organise. L&apos;élève ne paie jamais. Toutes les offres
            se vendent sur devis, établi par {VENDEUR.nom}.{" "}
            <span data-mention-tva="">{MENTION_TVA}.</span>
          </p>
        </EnTeteDePage>

        {/* L'ARÈNE : trois cartes côte à côte sur un ordinateur, empilées sur un
            téléphone, de même hauteur (la rangée de la grille les étire, le bouton
            descend au pied de chaque carte). */}
        <section aria-labelledby="enseignement" className="mx-auto max-w-6xl px-6 pb-16 pt-6">
          <h2 id="enseignement" className="text-2xl font-bold text-slate-50">
            L&apos;arène, pour l&apos;enseignement
          </h2>
          <div data-offres className="mt-6 grid gap-6 lg:grid-cols-3">
            {OFFRES_ENSEIGNEMENT.map((o) => (
              <CarteDOffre key={o.code} offre={o} />
            ))}
          </div>
          <p className="mt-6 text-base leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-200">{OFFRES.reseau.nom}.</span>{" "}
            {RESEAUX.texte}{" "}
            <Link href={RESEAUX.bouton.href} className={LIEN_A_L_ENCRE}>
              {RESEAUX.bouton.libelle}
            </Link>
          </p>
        </section>

        {/* LES ÉPISODES MANAGER : une offre à part, sur devis, sans prix affiché. */}
        <section aria-labelledby="episodes" className="mx-auto max-w-6xl px-6 pb-16">
          <div data-bande-episodes className="carte p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 id="episodes" className="text-2xl font-bold text-slate-50">
                {OFFRES.episodes.nom}
              </h2>
              <p className="text-lg font-semibold text-slate-200">Sur devis</p>
            </div>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-400">
              Des trimestres joués dans la peau d&apos;un manager, en classe, en école ou en
              entreprise. Ils se proposent à part : {LES_OFFRES_DE_L_ARENE} ne les incluent pas.
            </p>
            <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-[1fr_3fr]">
              <div data-formule-en-classe className="border-t border-white/10 pt-4">
                <h3 className="titre-carte text-slate-100">{FORMULE_EN_CLASSE.nom}</h3>
                <ListeInclus elements={FORMULE_EN_CLASSE.inclus} />
                <div className="mt-6">
                  <Link
                    href={BOUTON_EN_CLASSE.href}
                    className={bouton({ variante: "secondaire", taille: "l" })}
                  >
                    {BOUTON_EN_CLASSE.libelle}
                  </Link>
                </div>
              </div>
              <div data-formules-entreprises className="border-t border-white/10 pt-4">
                <h3 className="titre-carte text-slate-100">
                  Entreprises et organismes de formation
                </h3>
                <div className="mt-2 grid gap-x-8 gap-y-6 md:grid-cols-3">
                  {FORMULES_ENTREPRISES.map((f) => (
                    <div key={f.nom}>
                      <h4 className="text-base font-semibold text-slate-200">{f.nom}</h4>
                      <ListeInclus elements={f.inclus} />
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link
                    href={BOUTON_ENTREPRISES.href}
                    className={bouton({ variante: "secondaire", taille: "l" })}
                  >
                    {BOUTON_ENTREPRISES.libelle}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* LE CONTACT, À CÔTÉ DES DEVIS : l'adresse en texte (elle se sélectionne et se
              recopie), et le rendez-vous téléphonique, en second. */}
          <p data-contact className="mt-6 text-base leading-relaxed text-slate-400">
            Une question avant de demander un devis ? Écrivez à{" "}
            <span className="select-all font-semibold text-slate-200">{VENDEUR.contact}</span>
            , ou{" "}
            <Link href={LIEN_CONTACT.href} className={LIEN_A_L_ENCRE}>
              prenez un rendez-vous téléphonique
            </Link>
            .
          </p>
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
          <dl className="mt-5 grid gap-x-10 md:grid-cols-2">
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
 * UNE CARTE D'OFFRE. Le prix en grand, dans le condensé des chiffres ; « par an » en
 * petit ; la liste « Inclus » ; un bouton au pied.
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
        {offre.prix !== undefined ? (
          <>
            <p className="flex h-12 items-end gap-2">
              <span className="font-display text-5xl font-bold leading-none tabular-nums text-slate-50">
                {prixAffiche(offre.prix)}
              </span>
              <span className="pb-1 text-base font-medium text-slate-300">par an</span>
            </p>
            <p className="mt-1 text-sm text-slate-400">Prix de référence, sur devis</p>
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
