import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { copieRetenueDuCandidat, examenParCode } from "@/services/examen.service";
import { normaliserCodeDExamen, phraseDuRecu } from "@/config/examen/textes";
import { NIVEAUX_DE_COMPETENCE, SEUIL_D_ATTEINTE_EN_POURCENT } from "@/config/examen/competences";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PrintButton } from "@/components/print-button";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { ReleveDesCompetences } from "@/components/examen/graphiques-de-l-examen";

export const metadata: Metadata = {
  title: "Ma copie d'examen",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LA COPIE DU CANDIDAT : le reçu, puis, quand l'enseignant a publié, la note décomposée
 * ligne par ligne et le relevé par compétence. Lue par l'identité de cet appareil (le
 * cookie invité, retrouvé au besoin par le code de reprise), jamais par un identifiant
 * d'adresse : personne ne lit la copie d'un autre.
 */
export default async function ResultatDuCandidatPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const propre = normaliserCodeDExamen(code);
  const examen = await examenParCode(propre);
  if (!examen) notFound();
  const copie = await copieRetenueDuCandidat(examen.code, await getGuestUserId());

  if (!copie || !copie.candidat.remisLe) {
    return (
      <main id="main" className="pb-16">
        <EnTeteDePage
          surtitre={examen.nom}
          titre="Aucune copie remise sur cet appareil"
          chapeau="Votre copie est sur un autre appareil ? Reprenez-la avec votre code de reprise : vous retrouverez votre reçu."
        >
          <p className="mt-4 text-sm">
            <Link href="/reprendre" className={LIEN_A_L_ENCRE}>
              Reprendre avec mon code de reprise
            </Link>
          </p>
        </EnTeteDePage>
      </main>
    );
  }

  const n = copie.notation;
  return (
    <main id="main" className="pb-16" data-copie-du-candidat="" data-publie={copie.publie ? "oui" : "non"}>
      <EnTeteDePage
        surtitre={examen.nom}
        titre={copie.publie && n?.etat === "notee" ? `Votre note : ${n.note.toLocaleString("fr-FR")} sur 100` : "Votre copie est remise"}
        chapeau={`${phraseDuRecu(copie.candidat.remisLe)}, au nom de ${copie.candidat.nom}.`}
      />
      <div className={`${COLONNE_DE_PAGE} space-y-6`}>
        {!copie.publie ? (
          <p className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300" data-recu="">
            Votre note paraîtra ici quand votre enseignant publiera les résultats.
          </p>
        ) : !n ? (
          <p className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300">Votre note est en cours de calcul. Revenez dans un instant.</p>
        ) : n.etat === "sans-note" ? (
          <p className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300">{n.message} Votre enseignant en est informé.</p>
        ) : (
          <>
            <section aria-labelledby="releve-titre" className="carte grid gap-4 p-4 sm:p-6">
              <h2 id="releve-titre" className="titre-carte text-slate-100">
                Votre relevé par compétence
              </h2>
              <p className="text-sm text-slate-400">
                Niveaux : {NIVEAUX_DE_COMPETENCE.map((x) => x.nom.toLowerCase()).join(", ")}. L&apos;objectif est atteint à
                partir de {SEUIL_D_ATTEINTE_EN_POURCENT} des points rattachés à la compétence.
              </p>
              <ReleveDesCompetences competences={n.competences} />
            </section>
            <section aria-labelledby="detail-titre" className="carte grid gap-3 p-4 sm:p-6">
              <h2 id="detail-titre" className="titre-carte text-slate-100">
                Le détail de la note
              </h2>
              <p className="text-sm text-slate-400">
                Grille « {n.grille.nom} », version {n.grille.version}. Vos décisions ont été rejouées sur {n.marches} marchés
                possibles, les mêmes pour tous les candidats.
              </p>
              <ul className="grid gap-1 text-sm" data-detail-de-la-note="">
                {n.lignes.map((l) => (
                  <li key={l.code} className="flex flex-wrap justify-between gap-x-4 border-t border-white/10 pt-1.5">
                    <span className="min-w-0 flex-1 basis-56 text-slate-200">
                      {l.libelle}
                      <span className="block text-xs text-slate-400">{l.detail}</span>
                    </span>
                    <span className="tabular-nums text-slate-100">
                      {l.points.toLocaleString("fr-FR")} / {l.max.toLocaleString("fr-FR")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <PrintButton label="Imprimer mon relevé" />
          </>
        )}
      </div>
    </main>
  );
}
