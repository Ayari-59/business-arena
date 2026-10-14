import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestDisplayName } from "@/lib/guest";
import { identiteReconnue } from "@/lib/identite-du-candidat";
import { copiesDuCandidat, examenParCode } from "@/services/examen.service";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { presetByLevel } from "@/config/difficulty";
import {
  IDENTIFICATIONS,
  NOM_DU_CANDIDAT_MAX,
  NUMERO_ETUDIANT_MAX,
  REFUS_AU_CANDIDAT,
  estUnRefusAuCandidat,
  normaliserCodeDExamen,
  phraseDuRecu,
} from "@/config/examen/textes";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { ConnexionEtablissement } from "@/components/connexion-etablissement";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { commencerExamenAction } from "../actions";

export const metadata: Metadata = {
  title: "Examen individuel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LA PAGE D'UN EXAMEN, AVANT DE COMMENCER : ce qui va se passer, puis l'identification.
 *
 * Le candidat lit les règles (seul, contre des concurrents pilotés ; le temps d'un tour ;
 * une seule tentative ; pas de résultat avant la publication), puis s'identifie : son
 * compte, son établissement (RENATER) ou sa plateforme de cours (LTI) s'ils sont reconnus,
 * sinon son nom et son numéro d'étudiant, jamais une adresse électronique. Une copie en
 * cours sur cet appareil se reprend ; une copie remise mène à son reçu.
 */

const heure = (d: Date) =>
  d.toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export default async function ExamenDuCandidatPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ refus?: string }>;
}) {
  const { code } = await params;
  const { refus } = await searchParams;
  const propre = normaliserCodeDExamen(code);
  const examen = await examenParCode(propre);
  if (!examen) notFound();
  const [reconnue, prenom] = await Promise.all([identiteReconnue(), getGuestDisplayName()]);
  const copies = await copiesDuCandidat(examen.id, reconnue.userId);
  const enCours = copies.find((c) => !c.remisLe && c.gameId);
  const remise = copies.find((c) => c.remisLe);
  const raison = estUnRefusAuCandidat(refus) ? refus : null;
  const def = SCENARIO_CHOICES.find((d) => d.code === examen.scenarioCode);
  const niveau = presetByLevel.get(examen.niveau as 1 | 2 | 3 | 4 | 5 | 6);
  const peutCommencer = examen.etat === "ouvert" && !enCours && copies.length < examen.tentatives;

  return (
    <main id="main" className="pb-16" data-examen-candidat={examen.code}>
      <EnTeteDePage
        surtitre="Examen individuel"
        titre={examen.nom}
        chapeau={`${def?.title ?? examen.scenarioCode}, niveau ${examen.niveau}${niveau ? ` (${niveau.name})` : ""}. Vous dirigez seul votre entreprise pendant ${examen.tours} tours, face à des concurrents pilotés par l'ordinateur.`}
      />
      <div className={`${COLONNE_DE_PAGE} space-y-6`}>
        {raison ? (
          <p role="alert" data-refus-candidat={raison} className="rounded-xl encadre-perte px-3 py-2.5 text-sm text-slate-100 sm:px-4">
            {REFUS_AU_CANDIDAT[raison]}
          </p>
        ) : null}

        <section aria-labelledby="regles-titre" className="carte grid gap-2 p-4 sm:p-6">
          <h2 id="regles-titre" className="titre-carte text-slate-100">
            Les règles
          </h2>
          <ul className="grid gap-1.5 text-sm leading-relaxed text-slate-300">
            <li>
              Vous jouez seul, sans aide au-delà de ce que le niveau propose. Tous les candidats ont la même entreprise et le
              même niveau.
            </li>
            <li>
              {examen.dureeTourMinutes
                ? `Chaque tour dure au plus ${examen.dureeTourMinutes} minutes : passé ce temps, il se clôt avec vos décisions du tour précédent.`
                : "Les tours n'ont pas de limite de temps."}
              {examen.fermeture ? ` L'examen ferme le ${heure(examen.fermeture)} : une copie en cours est alors remise telle quelle.` : ""}
            </li>
            <li>
              {examen.tentatives > 1
                ? `Vous avez ${examen.tentatives} tentatives ; la dernière copie remise compte.`
                : "Une seule tentative. Une coupure ne vous fait rien perdre : notez votre code de reprise, il vous rend votre copie au tour où vous l'avez laissée, sans pouvoir rejouer un tour."}
            </li>
            <li>
              Votre note juge vos décisions, rejouées sur les mêmes marchés pour tous les candidats, et non le hasard de votre
              partie. Elle paraît quand votre enseignant publie les résultats.
            </li>
            {examen.questions ? <li>Les questions des situations sont posées, et notées.</li> : null}
          </ul>
        </section>

        {enCours ? (
          <section className="carte grid gap-3 p-4 sm:p-6" data-copie-en-cours="">
            <p className="text-sm text-slate-200">
              Une copie est en cours sur cet appareil{prenom ? ` au nom de ${prenom}` : ""}.
            </p>
            <Link href={`/arena/${enCours.gameId}`} className={bouton()}>
              Reprendre ma copie
            </Link>
          </section>
        ) : remise ? (
          <section className="carte grid gap-3 p-4 sm:p-6" data-copie-remise="">
            <p className="text-sm text-slate-200">{phraseDuRecu(remise.remisLe!)}.</p>
            <Link href={`/examen/${examen.code}/resultat`} className={bouton({ variante: copies.length < examen.tentatives && peutCommencer ? "secondaire" : "principal" })}>
              {examen.publie ? "Voir ma note et mon relevé" : "Voir mon reçu"}
            </Link>
          </section>
        ) : null}

        {examen.etat === "a-venir" ? (
          <p className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300">
            L&apos;examen ouvre {examen.ouverture ? `le ${heure(examen.ouverture)}` : "bientôt"}. Revenez à cette page à ce moment-là.
          </p>
        ) : examen.etat === "ferme" && !enCours && !remise ? (
          <p className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300">{REFUS_AU_CANDIDAT.ferme}</p>
        ) : null}

        {peutCommencer ? (
          <section aria-labelledby="identification-titre" className="carte grid gap-4 p-4 sm:p-6">
            <h2 id="identification-titre" className="titre-carte text-slate-100">
              {remise ? "Une nouvelle tentative" : "Vous identifier"}
            </h2>
            {reconnue.identification ? (
              <p className="text-sm text-slate-300" data-identification={reconnue.identification}>
                Vous êtes reconnu par : {IDENTIFICATIONS[reconnue.identification]}. Indiquez le nom sous lequel votre
                enseignant vous retrouvera.
              </p>
            ) : (
              <p className="text-sm text-slate-300" data-identification="saisie">
                Votre nom et votre numéro d&apos;étudiant suffisent : ni adresse électronique, ni compte.
              </p>
            )}
            <GuardedForm action={commencerExamenAction.bind(null, examen.code)} label="début de l'examen" className="grid gap-4" timeoutMs={60_000}>
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-200">Nom et prénom</span>
                <input
                  name="nom"
                  required
                  maxLength={NOM_DU_CANDIDAT_MAX}
                  autoComplete="name"
                  defaultValue={reconnue.identification ? (prenom ?? "") : ""}
                  className="champ px-3 py-2 text-base"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-200">
                  Numéro d&apos;étudiant{reconnue.identification ? " (facultatif)" : ""}
                </span>
                <input
                  name="numeroEtudiant"
                  required={!reconnue.identification}
                  maxLength={NUMERO_ETUDIANT_MAX}
                  autoComplete="off"
                  inputMode="text"
                  className="champ px-3 py-2 font-mono text-base"
                />
              </label>
              <SubmitButton pendingLabel="Préparation de votre partie…" className={bouton({ taille: "l" })}>
                Commencer l&apos;examen
              </SubmitButton>
            </GuardedForm>
            {!reconnue.identification ? (
              <ConnexionEtablissement retour={`/examen/${examen.code}`} />
            ) : null}
          </section>
        ) : null}

        <p className="text-sm text-slate-400">
          Vous avez changé d&apos;appareil ?{" "}
          <Link href="/reprendre" className={LIEN_A_L_ENCRE}>
            Reprendre avec mon code de reprise
          </Link>
        </p>
      </div>
    </main>
  );
}
