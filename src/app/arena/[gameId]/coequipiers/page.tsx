import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuestUserId } from "@/lib/guest";
import { compter, formatDecimal } from "@/lib/format";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { BarresDesMoyennes } from "@/components/pairs/barres-des-moyennes";
import {
  COMMENTAIRE_MAX,
  ECHELLE_DES_PAIRS,
  NOMS_DES_MOMENTS,
  NOTE_MAX,
  NOTE_MIN,
  estUnMoment,
  type CritereDesPairs,
} from "@/config/pairs/criteres";
import { vueDeLEtudiant, type MaReponse } from "@/services/pairs.service";
import { enregistrerMesReponsesAction } from "./actions";

export const metadata: Metadata = { title: "Évaluation entre coéquipiers" };
export const dynamic = "force-dynamic";

/**
 * ÉVALUER SES COÉQUIPIERS, PUIS LIRE CE QU'ILS DISENT DE VOUS.
 *
 * Un formulaire court, téléphone d'abord : un bloc par coéquipier, une ligne de cinq
 * cases par critère, un mot facultatif pour l'enseignant. Il se modifie jusqu'à la
 * clôture. Après publication, la page montre ses moyennes, critère par critère, sans
 * jamais nommer qui a noté ; l'auto-évaluation, si elle est demandée, est montrée à part.
 */

const REFUS: Record<string, string> = {
  saisie: "Il manque une note : chaque coéquipier reçoit une note sur chaque critère.",
  ferme: "Cette évaluation n'est plus ouverte : votre enseignant l'a clôturée.",
  membre: "Vous ne faites partie d'aucune équipe de cette partie.",
};

function LigneDeNotes({
  nom,
  critere,
  valeur,
}: {
  nom: string;
  critere: CritereDesPairs;
  valeur: number | undefined;
}) {
  return (
    <fieldset className="grid gap-2" data-critere={critere.code}>
      <legend className="text-sm font-semibold text-slate-100">
        {critere.libelle}
        {critere.aide ? <span className="mt-0.5 block font-normal text-slate-400">{critere.aide}</span> : null}
      </legend>
      <div className="grid grid-cols-5 gap-1.5">
        {ECHELLE_DES_PAIRS.map((e) => (
          <label
            key={e.note}
            className="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-white/15 px-1 py-1.5 text-center transition hover:border-white/40 has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10"
          >
            <input
              type="radio"
              name={nom}
              value={e.note}
              required
              defaultChecked={valeur === e.note}
              className="h-4 w-4 accent-amber-400"
            />
            <span className="text-base font-semibold tabular-nums text-slate-100">{e.note}</span>
            <span className="sr-only text-sm leading-tight text-slate-300 sm:not-sr-only">{e.libelle}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function BlocDeNotes({
  titre,
  sousTitre,
  cible,
  criteres,
  reponse,
  commentaire,
}: {
  titre: string;
  sousTitre?: string;
  cible: string;
  criteres: readonly CritereDesPairs[];
  reponse: MaReponse | undefined;
  commentaire: boolean;
}) {
  return (
    <section className="panneau-info grid gap-5 p-4 sm:p-6" data-coequipier={titre} aria-label={titre}>
      <header>
        <h2 className="titre-carte text-slate-50">{titre}</h2>
        {sousTitre ? <p className="mt-0.5 text-sm text-slate-400">{sousTitre}</p> : null}
      </header>
      {criteres.map((c) => (
        <LigneDeNotes key={c.code} nom={`n:${cible}:${c.code}`} critere={c} valeur={reponse?.notes[c.code]} />
      ))}
      {commentaire ? (
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-100">Un mot pour votre enseignant (facultatif)</span>
          <span className="text-sm text-slate-400">Lui seul le lira : {titre} ne le verra pas.</span>
          <textarea
            name={`c:${cible}`}
            rows={3}
            maxLength={COMMENTAIRE_MAX}
            defaultValue={reponse?.commentaire ?? ""}
            className="champ w-full px-3 py-2 text-base text-slate-100"
          />
        </label>
      ) : null}
    </section>
  );
}

export default async function CoequipiersPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ moment?: string; fait?: string; refus?: string }>;
}) {
  const { gameId } = await params;
  const { moment: demande, fait, refus } = await searchParams;
  const userId = await getGuestUserId();
  if (!userId) notFound();
  const vue = await vueDeLEtudiant(gameId, userId);
  if (!vue) notFound();

  // Le moment montré : celui demandé, sinon l'ouvert, sinon le dernier publié.
  const ouvert = vue.archivee ? undefined : vue.moments.find((m) => m.etat === "ouvert");
  const choisi =
    (estUnMoment(demande) ? vue.moments.find((m) => m.moment === demande) : undefined) ??
    ouvert ??
    [...vue.moments].reverse().find((m) => m.etat === "publie");
  const retour = (
    <Link href={`/arena/${gameId}`} className={LIEN_A_L_ENCRE}>
      ← Retour à la partie
    </Link>
  );

  if (!choisi || vue.coequipiers.length === 0) {
    return (
      <main id="main" className="pb-16">
        <EnTeteDePage
          surtitre={`${vue.equipe} · évaluation entre coéquipiers`}
          titre="Rien à évaluer pour l'instant"
          chapeau={
            vue.coequipiers.length === 0
              ? "Personne d'autre n'est dans votre équipe : il n'y a rien à évaluer."
              : "Votre enseignant ouvrira l'évaluation au moment prévu. Une carte vous préviendra dans la partie."
          }
        >
          <p className="mt-6">{retour}</p>
        </EnTeteDePage>
      </main>
    );
  }

  const publie = choisi.etat === "publie";
  const modifiable = choisi.etat === "ouvert" && !vue.archivee;
  const autres = vue.moments.filter((m) => m.moment !== choisi.moment);

  return (
    <main id="main" className="pb-16" data-moment={choisi.moment} data-etat={choisi.etat}>
      <EnTeteDePage
        surtitre={`${vue.equipe} · ${NOMS_DES_MOMENTS[choisi.moment].toLowerCase()}`}
        titre={publie ? "Ce que vos coéquipiers disent de vous" : "Évaluez vos coéquipiers"}
        chapeau={
          publie
            ? "Vos moyennes, critère par critère. Personne ne voit qui a donné quoi : ni vous, ni vos coéquipiers."
            : `Pour chacun, une note de ${NOTE_MIN} à ${NOTE_MAX} par critère. Vos coéquipiers ne verront jamais ce que vous leur avez donné : votre enseignant lit les réponses, puis chacun ne reçoit que ses moyennes.`
        }
      >
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {retour}
          {autres.map((m) => (
            <Link key={m.moment} href={`/arena/${gameId}/coequipiers?moment=${m.moment}`} className={LIEN_A_L_ENCRE}>
              {NOMS_DES_MOMENTS[m.moment]}
            </Link>
          ))}
        </p>
      </EnTeteDePage>

      <div className={`${COLONNE_DE_PAGE} grid gap-6`}>
        {fait === "envoyee" && modifiable ? (
          <p role="status" className="rounded-xl encadre-gain px-3 py-2.5 text-sm text-slate-100 sm:px-4 sm:py-3">
            Votre évaluation est enregistrée. Vous pouvez la modifier jusqu&apos;à la clôture.
          </p>
        ) : null}
        {refus && REFUS[refus] ? (
          <p role="alert" className="rounded-xl encadre-perte px-3 py-2.5 text-sm text-slate-100 sm:px-4 sm:py-3">
            {REFUS[refus]}
          </p>
        ) : null}

        {publie ? (
          <section aria-labelledby="moyennes-titre" className="panneau-info grid gap-4 p-4 sm:p-6" data-resultats-publies="">
            <h2 id="moyennes-titre" className="titre-carte text-slate-50">
              {choisi.resultats && choisi.resultats.moyenne !== null
                ? `En moyenne, ${formatDecimal(choisi.resultats.moyenne, 1)} sur ${NOTE_MAX}`
                : "Aucune note reçue"}
            </h2>
            {choisi.resultats && choisi.resultats.evaluateurs > 0 ? (
              <>
                <p className="text-sm text-slate-300">
                  {choisi.resultats.evaluateurs > 1
                    ? `La moyenne de ${compter(choisi.resultats.evaluateurs, "coéquipier")}.`
                    : "La note d'un coéquipier."}
                  {choisi.resultats.auto ? " Le trait gris marque votre propre note, qui ne compte pas dans la moyenne." : ""}
                </p>
                <BarresDesMoyennes criteres={vue.criteres} moyennes={choisi.resultats.moyennes} auto={choisi.resultats.auto} />
              </>
            ) : (
              <p className="text-sm text-slate-300">Aucun coéquipier n&apos;a rendu son évaluation à temps.</p>
            )}
          </section>
        ) : null}

        {modifiable ? (
          <GuardedForm
            action={enregistrerMesReponsesAction.bind(null, gameId)}
            label="évaluation des coéquipiers"
            className="grid gap-6"
          >
            <input type="hidden" name="moment" value={choisi.moment} />
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300" aria-label="L'échelle des notes">
              {ECHELLE_DES_PAIRS.map((e) => (
                <div key={e.note} className="flex gap-1">
                  <dt className="font-semibold tabular-nums text-slate-100">{e.note}</dt>
                  <dd>{e.libelle.toLowerCase()}</dd>
                </div>
              ))}
            </dl>
            {vue.coequipiers.map((c) => (
              <BlocDeNotes
                key={c.userId}
                titre={c.nom}
                cible={c.userId}
                criteres={vue.criteres}
                reponse={choisi.mesReponses[c.userId]}
                commentaire={vue.commentaire}
              />
            ))}
            {vue.autoEvaluation ? (
              <BlocDeNotes
                titre="Et vous ?"
                sousTitre="Votre propre évaluation : votre enseignant la lit à côté de celle de vos pairs, elle ne compte pas dans leur moyenne."
                cible={vue.moi.userId}
                criteres={vue.criteres}
                reponse={choisi.mesReponses[vue.moi.userId]}
                commentaire={false}
              />
            ) : null}
            <div className="grid gap-2 sm:flex sm:items-center sm:gap-4">
              <SubmitButton pendingLabel="Envoi…" className={bouton({ taille: "l" })}>
                {choisi.envoyee ? "Mettre à jour mon évaluation" : "Envoyer mon évaluation"}
              </SubmitButton>
              <p className="text-sm text-slate-400">Modifiable jusqu&apos;à la clôture par votre enseignant.</p>
            </div>
          </GuardedForm>
        ) : !publie ? (
          <p className="rounded-xl encadre-neutre px-3 py-2.5 text-sm text-slate-200 sm:px-4 sm:py-3">
            Votre enseignant a rangé cette partie : l&apos;évaluation ne se modifie plus.
          </p>
        ) : null}
      </div>
    </main>
  );
}
