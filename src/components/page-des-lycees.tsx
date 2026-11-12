import Link from "next/link";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { VENDEUR } from "@/config/editeur";
import { CONDITIONS, lienDuDevis, LIBELLE_DU_DEVIS } from "@/config/tarifs";
import { DELAIS_APRES_LE_DEVIS } from "@/config/conditions-legales";
import { lienDuDevisDuCours } from "@/config/parametrage-du-devis";
import { dureeDuChapitre, dureeEnClair } from "@/config/cours/duree";
import { ESSAIS_DES_LYCEES, type OffrePourLesLycees } from "@/config/lycees";

/**
 * LA PAGE DES LYCÉES, RENDUE (app/lycees/page.tsx la remplit avec le catalogue en base ;
 * tests/architecture/pages-de-l-offre.test.ts, avec le catalogue par défaut).
 *
 * Pour le proviseur et le directeur délégué aux formations : le bac STMG et les BTS, le chapitre libre
 * de chaque diplôme et son cas, ce que chaque offre ouvre comme le code l'applique, aucun compte élève,
 * la commande publique (bon de commande, mandat administratif, Chorus Pro). Les épisodes manager ne
 * s'y annoncent pas : ils sont pour l'enseignement supérieur (config/episodes/public-des-episodes.ts).
 * Les devis sont ceux de l'arène et du cours, jamais celui des épisodes.
 */
export function PageDesLycees({ offres }: { offres: readonly OffrePourLesLycees[] }) {
  const lienDuChapitre = (code: string, diplome: string) => `/cours/${code}?diplome=${diplome}`;
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Pour les lycées"
          titre="Le bac STMG et les BTS, en cours et en simulation"
          chapeau="Pour le proviseur et le directeur délégué aux formations : le cours de gestion par la simulation et l'arène, pour vos classes du bac STMG et vos sections de BTS. Vos élèves n'ont aucun compte ; la commande passe par un devis, puis votre bon de commande."
        >
          <p className="mt-6 flex flex-wrap gap-3">
            <Link href={lienDuDevis("campus")} className={bouton({ taille: "l" })}>
              {LIBELLE_DU_DEVIS}
            </Link>
            <Link href="/tarifs" className={bouton({ variante: "secondaire", taille: "l" })}>
              Voir les offres
            </Link>
          </p>
        </EnTeteDePage>
        <div className={`${COLONNE_DE_PAGE} space-y-8 pb-12`}>
          <section className="carte p-6 sm:p-8" aria-labelledby="diplomes" data-diplomes-du-lycee="">
            <h2 id="diplomes" className="text-xl font-bold text-slate-50">
              Le bac STMG et les BTS
            </h2>
            <p className="mt-2 text-base leading-relaxed text-slate-300">
              Chaque diplôme a son cours, bloc par bloc, et son chapitre libre avec son cas pratique : ils s&apos;ouvrent sans
              compte, pour essayer avant de commander.
            </p>
            <ul className="mt-5 grid gap-5">
              {ESSAIS_DES_LYCEES.map(({ diplome, chapitre, cas }) => (
                <li key={diplome.code} data-diplome-du-lycee={diplome.code} className="border-t border-white/10 pt-4">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="titre-carte text-slate-100">{diplome.sigle}</span>
                    <span className="text-sm text-slate-400">{diplome.nom}</span>
                    <Link href={`/cours?diplome=${diplome.code}`} className={`${LIEN_A_L_ENCRE} text-sm`}>
                      Le cours du diplôme
                    </Link>
                  </p>
                  <p className="mt-1.5 text-base leading-relaxed text-slate-300">
                    Chapitre libre :{" "}
                    <Link href={lienDuChapitre(chapitre.code, diplome.code)} data-chapitre-libre={chapitre.code} className={LIEN_A_L_ENCRE}>
                      {chapitre.titre}
                    </Link>{" "}
                    <span className="whitespace-nowrap text-sm tabular-nums text-slate-400">{dureeEnClair(dureeDuChapitre(chapitre))}</span>
                    {cas ? (
                      <>
                        {" "}
                        · son cas pratique :{" "}
                        <Link href={lienDuChapitre(cas.code, diplome.code)} data-cas-libre={cas.code} className={LIEN_A_L_ENCRE}>
                          {cas.titre}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="carte p-6 sm:p-8" aria-labelledby="offres" data-offres-du-lycee="">
            <h2 id="offres" className="text-xl font-bold text-slate-50">
              Ce que chaque offre ouvre
            </h2>
            <p className="mt-2 text-base leading-relaxed text-slate-300">
              Toutes se vendent sur devis. Voici ce que l&apos;application ouvre avec chacune, et ce qu&apos;elle tient.
            </p>
            <ul className="mt-5 grid gap-6">
              {offres.map((o) => (
                <li key={o.code} data-offre-du-lycee={o.code} className="border-t border-white/10 pt-4">
                  <h3 className="titre-carte text-slate-100">{o.nom}</h3>
                  <p className="mt-1 text-base font-semibold leading-relaxed text-slate-200">{o.pourQui}</p>
                  <ul className="mt-2 space-y-1.5">
                    {o.lignes.map((l) => (
                      <li
                        key={l}
                        className="relative pl-4 text-base leading-relaxed text-slate-300 before:absolute before:left-0 before:top-[0.7em] before:h-1 before:w-1 before:rounded-full before:bg-amber-400/70"
                      >
                        {l}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3">
                    <Link href={o.devis} className={`${LIEN_A_L_ENCRE} text-sm`}>
                      {LIBELLE_DU_DEVIS} : {o.nom}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="carte grid gap-3 p-6 sm:p-8" aria-labelledby="eleves">
            <h2 id="eleves" className="text-xl font-bold text-slate-50">
              Aucun compte élève
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              Vos élèves entrent par le code de leur partie ou de leur classe, avec un prénom ou un pseudonyme : ni compte, ni
              adresse électronique, ni mot de passe. Ils ne paient jamais. Seule la classe du cours garde le nom que l&apos;élève
              donne en la rejoignant, et l&apos;examen individuel le nom et le numéro d&apos;étudiant du candidat.
            </p>
          </section>

          <section className="carte grid gap-3 p-6 sm:p-8" aria-labelledby="commande" data-commande-publique="">
            <h2 id="commande" className="text-xl font-bold text-slate-50">
              La commande : bon de commande, mandat administratif, Chorus Pro
            </h2>
            <ol className="list-decimal space-y-2 pl-6 text-base leading-relaxed text-slate-300">
              <li>Demandez un devis écrit : l&apos;offre, l&apos;UAI de votre lycée, et, pour l&apos;offre Classe, le parcours du cours.</li>
              <li>Retournez-le signé, ou émettez un bon de commande qui le reprend.</li>
              <li>
                La facture, payable à {CONDITIONS.delaiFactureJours} jours par virement ou par mandat administratif, est déposée sur
                Chorus Pro, où {VENDEUR.nom} s&apos;identifie par son SIRET, {VENDEUR.siret}.
              </li>
            </ol>
            <p className="text-base font-semibold leading-relaxed text-slate-100" data-delais-du-devis="">
              {DELAIS_APRES_LE_DEVIS}
            </p>
            <p className="text-sm leading-relaxed text-slate-400">
              <Link href="/devis#fiche-fournisseur" className={LIEN_A_L_ENCRE}>
                La fiche fournisseur
              </Link>{" "}
              (SIRET, adresse de facturation, RIB sur demande) est sur la page du devis ; la commande suit les{" "}
              <Link href="/cgv" className={LIEN_A_L_ENCRE}>
                conditions générales de vente
              </Link>
              .
            </p>
            <p className="flex flex-wrap gap-3 pt-2">
              <Link href={lienDuDevis("campus")} className={bouton({ taille: "m" })}>
                {LIBELLE_DU_DEVIS}
              </Link>
              <Link href={lienDuDevisDuCours()} className={bouton({ variante: "secondaire", taille: "m" })}>
                Le cours pour une classe : demander un devis
              </Link>
            </p>
          </section>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
