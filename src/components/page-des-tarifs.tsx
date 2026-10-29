import Link from "next/link";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { CarteDOffre, ListeInclus } from "@/components/carte-d-offre";
import { EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { Repliable } from "@/components/repliable";
import {
  ARGUMENTS_POUR_LES_ECOLES,
  CONDITIONS_DE_VENTE,
  LES_OFFRES_DE_L_ARENE,
  MENTION_TVA,
  questionsDesTarifs,
} from "@/config/tarifs";
import type { ColonneDEpisodes, VueDesTarifs } from "@/config/catalogue";
import { VENDEUR } from "@/config/editeur";
import { LIEN_CONTACT } from "@/config/navigation";

/**
 * LA PAGE DES TARIFS, RENDUE D'UN CATALOGUE (app/tarifs/page.tsx la remplit avec le
 * catalogue en base ; tests/architecture/tarifs.test.ts, avec le catalogue par défaut).
 *
 * Elle suit les pages publiques claires (`/fonctionnalites`) : l'en-tête commun, des
 * cartes blanches sur le papier, le pied de page commun. TOUT SE VEND SUR DEVIS : les prix
 * de référence restent affichés, chaque carte mène à la demande écrite, l'offre
 * pré-remplie. UN SEUL BOUTON PLEIN : celui de l'offre mise en avant (/admin/offres en
 * garde une, et une seule). Les mentions comparatives se calculent sur les prix du
 * catalogue. Les textes juridiques (franchise de TVA, vendeur, conditions) viennent de
 * config/tarifs.ts et config/editeur.ts, jamais de la base.
 */
export function PageDesTarifs({
  vue,
  bandeau,
  prixPublics,
  essai = { autorise: false, dureeMaxJours: 0 },
}: {
  vue: VueDesTarifs;
  /** Le réglage de l'essai d'établissement (/admin/offres) : la question de l'essai le suit. */
  essai?: { autorise: boolean; dureeMaxJours: number };
  bandeau: string | null;
  /**
   * Les prix de référence se lisent-ils ? (réglage de /admin/offres, éteint par défaut :
   * « les offres se font sur mesure et aboutissent à une demande de devis »). Éteint, la
   * vue n'a reçu aucun montant, et la page parle d'offres sur mesure.
   */
  prixPublics: boolean;
}) {
  return (
    <>
      <main id="main" className="relative overflow-hidden" data-prix-publics={prixPublics ? "oui" : "non"}>
        {prixPublics ? (
          <EnTeteDePage
            surtitre="Offres et tarifs"
            titre="Tarifs"
            chapeau="Gratuit pour découvrir. Sur devis pour faire cours ou former une équipe."
          >
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
              Le gratuit montre, le payant organise. L&apos;étudiant ne paie jamais. Toutes les offres
              se vendent sur devis, établi par {VENDEUR.nom}.{" "}
              <span data-mention-tva="">{MENTION_TVA}.</span>
            </p>
          </EnTeteDePage>
        ) : (
          <EnTeteDePage
            surtitre="Offres sur mesure"
            titre="Offres"
            chapeau="Construisons votre offre. Gratuit pour découvrir ; pour faire cours ou former une équipe, chaque offre se compose avec vous et aboutit à un devis."
          >
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
              Le gratuit montre, le payant organise. L&apos;étudiant ne paie jamais. Dites-nous pour
              qui, et ce dont vous avez besoin : le devis écrit est établi par {VENDEUR.nom}.
            </p>
          </EnTeteDePage>
        )}

        {/* LA PROMOTION AFFICHÉE (/admin/offres) : un bandeau sobre, daté, à l'encre ; aucun
            orange (l'orange reste à l'action). Une seule à la fois, retirée à sa date de fin. */}
        {bandeau ? (
          <div className="mx-auto max-w-7xl px-6 pt-6">
            <p
              data-bandeau-promotion=""
              role="note"
              className="rounded-lg border border-[var(--filet-carte)] bg-[var(--voile-neutre)] px-4 py-3 text-base font-semibold text-slate-100"
            >
              {bandeau}
            </p>
          </div>
        ) : null}

        {/* L'ARÈNE : quatre cartes côte à côte sur un grand écran, deux par deux sur une
            tablette, empilées sur un téléphone, de même hauteur (la rangée de la grille les
            étire, le bouton descend au pied de chaque carte). */}
        <section aria-labelledby="enseignement" className="mx-auto max-w-7xl px-6 pb-16 pt-6">
          <h2 id="enseignement" className="text-2xl font-bold text-slate-50">
            L&apos;arène, pour l&apos;enseignement : lycées, BTS, écoles de commerce, universités
          </h2>
          <div data-offres className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {vue.cartes.map((o) => (
              <CarteDOffre key={o.code} offre={o} />
            ))}
          </div>
          {vue.reseaux.map((r) => (
            <p key={r.code} className="mt-6 text-base leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-200">{r.nom}.</span> {r.texte}{" "}
              <Link href={r.bouton.href} className={LIEN_A_L_ENCRE}>
                {r.bouton.libelle}
              </Link>
            </p>
          ))}
          {/* CE QUI PARLE AUX ÉCOLES : l'accréditation, les séminaires et compétitions,
              Moodle (bientôt), les épisodes pour les MBA. Rien qui n'existe pas. */}
          <ul data-arguments-ecoles className="mt-10 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {ARGUMENTS_POUR_LES_ECOLES.map((a) => (
              <li key={a.titre} className="border-t border-white/10 pt-4">
                <h3 className="titre-carte text-slate-100">{a.titre}</h3>
                <p className="mt-1 text-base leading-relaxed text-slate-400">
                  {a.texte}
                  {a.lien ? (
                    <>
                      {" "}
                      <Link href={a.lien.href} className={LIEN_A_L_ENCRE}>
                        {a.lien.libelle}
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* LES ÉPISODES MANAGER : une offre à part, sur devis, sans prix affiché. */}
        <section aria-labelledby="episodes" className="mx-auto max-w-6xl px-6 pb-16">
          {vue.episodes ? (
            <div data-bande-episodes className="carte p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 id="episodes" className="text-2xl font-bold text-slate-50">
                  {vue.episodes.nom}
                </h2>
                <p className="text-lg font-semibold text-slate-200">{vue.episodes.tarif}</p>
              </div>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-400">
                Des trimestres joués dans la peau d&apos;un manager : en MBA, en cours de
                leadership, en formation continue (Executive Education), en classe ou en
                entreprise. Ils se proposent à part : {LES_OFFRES_DE_L_ARENE} ne les incluent pas.
              </p>
              <div
                className={`mt-8 grid gap-x-10 gap-y-8 ${vue.episodes.colonnes.length === 2 ? "lg:grid-cols-[1fr_3fr]" : ""}`}
              >
                {vue.episodes.colonnes.map((col) => (
                  <ColonneDesEpisodes key={col.code} colonne={col} />
                ))}
              </div>
            </div>
          ) : null}
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
            {vue.options.map((o) => (
              <li
                key={o.code}
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
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Le texte complet :{" "}
              <Link href="/cgv" className={LIEN_A_L_ENCRE}>
                les conditions générales de vente
              </Link>
              .
            </p>
          </Repliable>
        </section>

        <section aria-labelledby="questions" className="mx-auto max-w-6xl px-6 pb-16">
          <h2 id="questions" className="text-2xl font-bold text-slate-50">
            Les questions qu&apos;on nous pose
          </h2>
          <dl className="mt-5 grid gap-x-10 md:grid-cols-2">
            {questionsDesTarifs(essai).map((x) => (
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


/** Une colonne de la bande des épisodes : ses lignes, ou ses formules côte à côte. */
export function ColonneDesEpisodes({ colonne }: { colonne: ColonneDEpisodes }) {
  const entreprises = colonne.public === "entreprises";
  return (
    <div
      {...(entreprises ? { "data-formules-entreprises": "" } : { "data-formule-en-classe": "" })}
      className="border-t border-white/10 pt-4"
    >
      <h3 className="titre-carte text-slate-100">{colonne.titre}</h3>
      {colonne.inclus.length > 0 ? <ListeInclus elements={colonne.inclus} /> : null}
      {colonne.formules.length > 0 ? (
        <div className="mt-2 grid gap-x-8 gap-y-6 md:grid-cols-3">
          {colonne.formules.map((f) => (
            <div key={f.nom}>
              <h4 className="text-base font-semibold text-slate-200">{f.nom}</h4>
              <ListeInclus elements={f.inclus} />
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-6">
        <Link href={colonne.bouton.href} className={bouton({ variante: colonne.bouton.principal ? "principal" : "secondaire", taille: "l" })}>
          {colonne.bouton.libelle}
        </Link>
      </div>
    </div>
  );
}
