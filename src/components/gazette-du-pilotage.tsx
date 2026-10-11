"use client";

import { useState } from "react";
import { consignerLaGazetteAction, type GazetteState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { CoupureDePresse } from "@/components/coupure-de-presse";
import { Icone } from "@/components/icone";
import { bouton } from "@/components/bouton";
import {
  BORNES_DE_L_ARTICLE,
  articleAffiche,
  type ConsigneDeLEnseignant,
} from "@/config/gazette/edition";
import { NOM_DU_JOURNAL, type ArticleDeLaGazette } from "@/config/gazette/types";

const initial: GazetteState = { error: null, fait: null };

export interface TourDeLaGazette {
  tour: number;
  /** « Tour 3 », tel que la partie le nomme. */
  libelle: string;
  etat: "en-cours" | "a-paraitre";
  genere: ArticleDeLaGazette;
  consigne: ConsigneDeLEnseignant | null;
}

/**
 * LA GAZETTE DANS LE PILOTAGE (partie de classe).
 *
 * L'enseignant voit l'article d'un tour AVANT que la classe ne l'ouvre :
 * celui du tour suivant, en aperçu, et celui que la classe lit en ce moment.
 * Il peut le remplacer par le sien (un titre et trois ou quatre lignes) ou ne
 * rien publier, et rendre la main au journal. Contrôlé côté serveur.
 *
 * Un article d'enseignant n'est pas marqué pour les élèves : c'est la presse
 * du monde de la partie. Il l'est ici, pour lui.
 */
export function GazetteDuPilotage({ gameId, tours }: { gameId: string; tours: readonly TourDeLaGazette[] }) {
  if (tours.length === 0) return null;
  // Le tour à paraître d'abord : c'est lui qu'on prépare.
  const ordre = [...tours].sort((a, b) => (a.etat === b.etat ? 0 : a.etat === "a-paraitre" ? -1 : 1));
  return (
    <section className="carte p-4" data-gazette-du-pilotage="">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Icone nom="courrier" className="h-4 w-4 text-slate-400" />
        {NOM_DU_JOURNAL}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">
        Un article par tour, écrit à partir de ce que le marché réserve, pour toute la classe. Vous le
        lisez avant vos élèves ; vous pouvez le remplacer par le vôtre ou ne rien publier. Vos élèves
        ne voient pas qui l&apos;a écrit. Remplacé ou retiré, il ne raconte plus le marché : les
        circulaires « tout le marché » reviennent dans leur courrier.
      </p>
      <div className="mt-4 grid gap-6">
        {ordre.map((t) => (
          <TourDuPilotage key={t.tour} gameId={gameId} t={t} />
        ))}
      </div>
    </section>
  );
}

function TourDuPilotage({ gameId, t }: { gameId: string; t: TourDeLaGazette }) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    consignerLaGazetteAction.bind(null, gameId),
    initial,
    { label: "modification de la Gazette" },
  );
  const [ecrire, setEcrire] = useState(false);
  const [titre, setTitre] = useState(t.consigne?.mode === "remplace" ? (t.consigne.titre ?? "") : "");
  const [texte, setTexte] = useState(t.consigne?.mode === "remplace" ? (t.consigne.texte ?? "") : "");
  const { article } = articleAffiche(t.genere, t.consigne ?? undefined);
  const enCours = t.etat === "en-cours";
  const ouvert = ecrire && state.fait !== t.tour;
  const b = BORNES_DE_L_ARTICLE;

  return (
    <div data-gazette-tour={t.tour} data-etat={t.etat}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {enCours ? `En kiosque · ${t.libelle}, vos élèves le lisent` : `À paraître · ${t.libelle}, aperçu`}
      </p>
      <div className="mt-2 max-w-[40rem]">
        {article ? (
          <CoupureDePresse
            article={article}
            quand={t.libelle}
            niveauDuTitre={3}
            idDuTitre={`gazette-pilotage-${t.tour}`}
          />
        ) : (
          <p className="rounded-lg encadre-neutre px-3 py-2 text-sm text-slate-300">
            Rien ne paraîtra : vos élèves n&apos;auront pas d&apos;article ce tour.
          </p>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-400" data-consigne={t.consigne?.mode ?? "journal"}>
        {t.consigne === null
          ? enCours
            ? "L'article du journal, tel que vos élèves le lisent."
            : "L'article du journal, tel qu'il paraîtra. Il suit le marché jusqu'à l'ouverture du tour : un courrier de marché que vous distribuerez alors y entrera."
          : t.consigne.mode === "remplace"
            ? `Votre article remplace celui du journal (« ${t.genere.titre} »).`
            : `Vous avez retiré l'article du journal (« ${t.genere.titre} »).`}
      </p>

      <form ref={formRef} action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="tour" value={t.tour} />
        {ouvert ? (
          <div className="space-y-3">
            <div>
              <label htmlFor={`gazette-titre-${t.tour}`} className="text-xs font-semibold text-slate-400">
                Titre de votre article
              </label>
              <input
                id={`gazette-titre-${t.tour}`}
                name="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                minLength={b.titreMin}
                maxLength={b.titreMax}
                required
                className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
              />
              <p className="mt-1 text-xs text-slate-400 tabular-nums">
                {titre.length} / {b.titreMax} caractères
              </p>
            </div>
            <div>
              <label htmlFor={`gazette-texte-${t.tour}`} className="text-xs font-semibold text-slate-400">
                Texte, trois ou quatre lignes
              </label>
              <textarea
                id={`gazette-texte-${t.tour}`}
                name="texte"
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                minLength={b.texteMin}
                maxLength={b.texteMax}
                required
                rows={4}
                className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
              />
              <p className="mt-1 text-xs text-slate-400 tabular-nums">
                {texte.length} / {b.texteMax} caractères
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                name="mode"
                value="remplace"
                disabled={pending}
                className={bouton({ variante: "secondaire", taille: "m" })}
              >
                {pending ? "Publication…" : "Publier mon article"}
              </button>
              <button
                type="button"
                onClick={() => setEcrire(false)}
                className={bouton({ variante: "lien", taille: "m" })}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEcrire(true)}
              className={bouton({ variante: "secondaire", taille: "m" })}
            >
              Remplacer par mon article
            </button>
            {t.consigne?.mode !== "retire" ? (
              <button
                type="submit"
                name="mode"
                value="retire"
                formNoValidate
                disabled={pending}
                className={bouton({ variante: "secondaire", taille: "m" })}
              >
                Ne pas publier
              </button>
            ) : null}
            {t.consigne ? (
              <button
                type="submit"
                name="mode"
                value="retablir"
                formNoValidate
                disabled={pending}
                className={bouton({ variante: "lien", taille: "m" })}
              >
                Rétablir l&apos;article du journal
              </button>
            ) : null}
          </div>
        )}
      </form>
      {state.error ? (
        <p role="alert" className="mt-3 rounded-lg encadre-perte px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      {guardError ? (
        <div className="mt-3">
          <GuardError message={guardError} />
        </div>
      ) : null}
    </div>
  );
}
