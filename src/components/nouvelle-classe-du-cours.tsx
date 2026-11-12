"use client";

import { useEffect } from "react";
import { bouton } from "@/components/bouton";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { creerClasseAction, type EtatDeLaNouvelleClasse } from "@/app/teacher/cours/actions";

/**
 * LE FORMULAIRE DE CRÉATION D'UNE CLASSE DU COURS (/teacher/cours).
 *
 * Il était un formulaire serveur sans `noValidate` : un parcours oublié donnait la bulle du
 * navigateur, en anglais dans un navigateur anglais, et un refus du serveur rechargeait la page, la
 * saisie perdue (audit UX du 11 novembre 2026, P2-6). Les règles du site s'y appliquent désormais :
 * le serveur dit toutes les erreurs d'un coup, chacune sous son champ, le focus va au premier, et la
 * saisie revient dans les champs (`valeurs`), comme au devis.
 *
 * LA LISTE DES PARCOURS est rangée par diplôme, le cours du diplôme en premier, chaque entrée avec son
 * nombre de chapitres et les diplômes qu'elle sert (config/cours/parcours-a-choisir.ts,
 * `parcoursRangesParDiplome`) ; la page serveur la passe, avec les phrases d'aide, et le composant
 * n'importe pas le registre du cours.
 */

export interface GroupeDeLaNouvelleClasse {
  cle: string;
  libelle: string;
  parcours: readonly { code: string; libelle: string }[];
}

const ETAT_INITIAL: EtatDeLaNouvelleClasse = { erreurs: {}, valeurs: null };

export function NouvelleClasseDuCours({
  groupes,
  impose,
  aide,
  ceQuEstUnParcours,
  entreprises,
  nomMax,
  initial = ETAT_INITIAL,
}: {
  groupes: readonly GroupeDeLaNouvelleClasse[];
  /** Le seul parcours de la licence Classe, quand il est fixé : la liste n'a que lui. */
  impose: string | null;
  /** Ce que le parcours ouvre selon l'offre (services/chapitres-de-la-classe.ts). */
  aide: string;
  ceQuEstUnParcours: string;
  entreprises: readonly { code: string; nom: string; tagline: string }[];
  nomMax: number;
  /** L'état de départ : vide ; un test y met un refus, pour lire ce que le formulaire en rend. */
  initial?: EtatDeLaNouvelleClasse;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(creerClasseAction, initial, {
    label: "création d'une classe du cours",
  });
  const v = state.valeurs;
  const e = state.erreurs;
  const premier = e.nom ? "nom" : e.parcours ? "parcours" : null;
  // L'ERREUR SOUS SON CHAMP, LE FOCUS DESSUS (comme au devis) : sur téléphone, un message ailleurs
  // obligeait à chercher le champ.
  useEffect(() => {
    if (!premier) return;
    const el = formRef.current?.elements.namedItem(premier);
    if (el && "focus" in el) (el as HTMLElement).focus();
  }, [state, premier, formRef]);
  const erreur = (nom: "nom" | "parcours") =>
    e[nom] ? (
      <span id={`erreur-${nom}`} role="alert" data-erreur-du-champ={nom} className="text-sm text-red-300">
        {e[nom]}
      </span>
    ) : null;
  const decrit = (...ids: (string | false)[]) => ids.filter(Boolean).join(" ") || undefined;
  const parcoursRendu = v?.parcours ?? impose ?? "";
  const champ = "champ w-full px-3 py-2 text-base";

  return (
    <form ref={formRef} action={formAction} noValidate className="mt-4 grid gap-5" data-nouvelle-classe="">
      <div className="grid gap-1">
        <label htmlFor="nom-de-la-classe" className="text-sm font-semibold text-slate-200">
          Nom de la classe
        </label>
        <input
          key={`nom:${v?.nom ?? ""}`}
          id="nom-de-la-classe"
          name="nom"
          required
          maxLength={nomMax}
          placeholder="BTS CG 1 · groupe A"
          defaultValue={v?.nom ?? ""}
          className={champ}
          aria-invalid={e.nom ? true : undefined}
          aria-describedby={decrit(Boolean(e.nom) && "erreur-nom")}
        />
        {erreur("nom")}
      </div>
      {/* LE PARCOURS DE LA CLASSE (décision du propriétaire, octobre 2026) : sous l'offre Classe ou
          Programme, il ouvre les chapitres de ce parcours ; Campus ouvre tout
          (services/cours.service.ts, coursOuvert). */}
      <div className="grid gap-1">
        <label htmlFor="parcours-de-la-classe" className="text-sm font-semibold text-slate-200">
          Parcours du cours
        </label>
        {/* La clé suit la valeur rendue : après un refus, React remet le formulaire à zéro sur la valeur
            par défaut de la liste, que seul un nouveau montage met à jour (voir le devis). */}
        <select
          key={`parcours:${parcoursRendu}`}
          id="parcours-de-la-classe"
          name="parcours"
          required
          defaultValue={parcoursRendu}
          className={champ}
          data-parcours-de-la-classe=""
          aria-invalid={e.parcours ? true : undefined}
          aria-describedby={decrit(Boolean(e.parcours) && "erreur-parcours", "parcours-de-la-classe-aide", "ce-qu-est-un-parcours")}
        >
          <option value="" disabled>
            Choisir un parcours
          </option>
          {/* Rangés par diplôme, le cours du diplôme en premier, puis les matières. */}
          {groupes.map((g) => (
            <optgroup key={g.cle} label={g.libelle} data-groupe-de-parcours={g.cle}>
              {g.parcours.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.libelle}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {erreur("parcours")}
        <span id="parcours-de-la-classe-aide" className="text-sm text-slate-400" data-un-parcours-par-licence={impose ?? undefined}>
          {aide}
        </span>
        <span id="ce-qu-est-un-parcours" className="text-sm text-slate-400" data-ce-qu-est-un-parcours="">
          {ceQuEstUnParcours}
        </span>
      </div>
      <div className="grid gap-1">
        <label htmlFor="entreprise-de-la-classe" className="text-sm font-semibold text-slate-200">
          Entreprise du cas
        </label>
        <select
          key={`entreprise:${v?.entreprise ?? ""}`}
          id="entreprise-de-la-classe"
          name="entreprise"
          defaultValue={v?.entreprise ?? ""}
          className={champ}
          aria-describedby="entreprise-de-la-classe-aide"
        >
          <option value="">Au choix de chaque élève</option>
          {entreprises.map((x) => (
            <option key={x.code} value={x.code}>
              {x.nom} · {x.tagline}
            </option>
          ))}
        </select>
        <span id="entreprise-de-la-classe-aide" className="text-sm text-slate-400">
          La même pour toute la classe, pour corriger ensemble ; ou au choix, pour comparer les métiers.
        </span>
      </div>
      {/* LA LIBÉRATION DES CHAPITRES (décision du propriétaire, novembre 2026 ; migration 0056). */}
      <fieldset key={`liberation:${v?.liberation ?? "tout"}`} className="grid gap-2" data-liberation-a-la-creation="">
        <legend className="text-sm font-semibold text-slate-200">Chapitres ouverts aux élèves</legend>
        <label className="flex items-start gap-2 text-sm text-slate-200">
          <input type="radio" name="liberation" value="tout" defaultChecked={(v?.liberation ?? "tout") === "tout"} className="mt-1" />
          <span>Tout ouvrir : les élèves voient tous les chapitres que votre offre permet.</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-200">
          <input type="radio" name="liberation" value="chapitre" defaultChecked={v?.liberation === "chapitre"} className="mt-1" />
          <span>Libérer chapitre par chapitre : vous ouvrez chaque chapitre quand la classe y arrive.</span>
        </label>
        <span className="text-sm text-slate-400">
          Les chapitres libres restent toujours ouverts. Vous pourrez changer d&apos;avis sur la page de la classe.
        </span>
      </fieldset>
      <GuardError message={guardError} />
      <div>
        <button type="submit" disabled={pending} aria-busy={pending} className={`${bouton()} disabled:cursor-progress disabled:opacity-70`}>
          {pending ? "Création de la classe…" : "Créer la classe"}
        </button>
      </div>
    </form>
  );
}
