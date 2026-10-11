"use client";

import { useState } from "react";
import { bouton } from "@/components/bouton";
import { envoyerDemandeDeDevisAction, type DevisFormState } from "@/app/devis/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

/**
 * LE FORMULAIRE DE DEMANDE DE DEVIS.
 *
 * L'offre arrive pré-remplie de la carte de /tarifs (`?offre=…`) et se change dans la
 * liste ; les libellés suivent le public (un lycée, son UAI et ses enseignants ; une
 * entreprise, son SIRET et ses managers). Ce composant client ne lit pas la grille : la
 * page serveur lui passe les offres et leurs libellés (config/tarifs.ts).
 *
 * La confirmation DIT LA VÉRITÉ : l'accusé de réception n'est annoncé que s'il est parti.
 */
export interface OffreDuFormulaire {
  code: string;
  offre: string;
  organisation: string;
  exempleOrganisation: string;
  identifiant: string;
  effectif: string;
}

const ETAT_INITIAL: DevisFormState = { error: null, ok: null, values: null };

export function DevisForm({
  offres,
  offreInitiale,
  vendeur,
  mentionTva,
  contact,
  initial = ETAT_INITIAL,
}: {
  offres: readonly OffreDuFormulaire[];
  offreInitiale: string;
  /** Qui établit le devis (config/editeur.ts). */
  vendeur: string;
  mentionTva: string;
  contact: string;
  initial?: DevisFormState;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    envoyerDemandeDeDevisAction,
    initial,
    { label: "demande de devis" },
  );
  const v = state.values;
  const [offre, setOffre] = useState(v?.offre || offreInitiale);
  const choisie = offres.find((o) => o.code === offre) ?? offres[0]!;

  const champ = "mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none";
  const etiquette = "text-xs font-medium uppercase tracking-wide text-slate-400";

  if (state.ok) {
    const demandee = offres.find((o) => o.code === state.ok!.offre) ?? choisie;
    return (
      <div className="carte space-y-4 p-6" data-devis-confirme="">
        <p
          role="status"
          className="rounded-lg encadre-neutre px-3 py-3 text-base leading-relaxed text-slate-100"
        >
          ✓ Votre demande de devis est enregistrée : {demandee.offre}. Le devis vous sera
          adressé par écrit, établi par {vendeur}.
        </p>
        <p className="text-sm leading-relaxed text-slate-300" data-accuse={state.ok.accuseEnvoye ? "envoye" : "non-envoye"}>
          {state.ok.accuseEnvoye
            ? `Un accusé de réception est parti à ${state.ok.email}.`
            : `Aucun courriel d'accusé de réception n'a pu partir à ${state.ok.email} : la demande est bien enregistrée, et nous vous répondons à cette adresse.`}
        </p>
        <p className="text-sm text-slate-400">{mentionTva}.</p>
        <p className="text-sm text-slate-400">
          Une question : <span className="select-all font-semibold text-slate-200">{contact}</span>
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="carte grid gap-4 p-6 sm:grid-cols-2" data-formulaire-devis="">
      <label className="block sm:col-span-2">
        <span className={etiquette}>L&apos;offre</span>
        <select
          name="offre"
          value={offre}
          onChange={(e) => setOffre(e.target.value)}
          className={champ}
        >
          {offres.map((o) => (
            <option key={o.code} value={o.code}>
              {o.offre}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={etiquette}>Votre nom</span>
        <input name="nom" required maxLength={120} autoComplete="name" defaultValue={v?.nom ?? ""} className={champ} />
      </label>
      <label className="block">
        <span className={etiquette}>Votre fonction</span>
        <input
          name="fonction"
          required
          maxLength={120}
          autoComplete="organization-title"
          defaultValue={v?.fonction ?? ""}
          placeholder="Enseignant, proviseur adjoint, responsable formation…"
          className={champ}
        />
      </label>
      <label className="block">
        <span className={etiquette}>{choisie.organisation}</span>
        <input
          name="organisation"
          required
          maxLength={160}
          autoComplete="organization"
          defaultValue={v?.organisation ?? ""}
          placeholder={choisie.exempleOrganisation}
          className={champ}
        />
      </label>
      <label className="block">
        <span className={etiquette}>{choisie.identifiant}</span>
        <input name="identifiant" maxLength={40} defaultValue={v?.identifiant ?? ""} className={champ} />
      </label>
      <label className="block">
        <span className={etiquette}>{choisie.effectif}</span>
        <input
          name="effectif"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          defaultValue={v?.effectif ?? ""}
          className={champ}
        />
      </label>
      <label className="block">
        <span className={etiquette}>Votre e-mail, pour recevoir le devis</span>
        <input
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          defaultValue={v?.email ?? ""}
          className={champ}
        />
      </label>
      <label className="block sm:col-span-2">
        <span className={etiquette}>Votre message</span>
        <textarea
          name="message"
          rows={4}
          maxLength={1200}
          defaultValue={v?.message ?? ""}
          placeholder="La durée souhaitée, la date de démarrage, le service à qui adresser la facture, un numéro d'engagement Chorus Pro…"
          className={champ}
        />
        <span className="mt-1 block text-xs text-slate-400">Facultatif.</span>
      </label>
      {/* piège à robots : invisible, doit rester vide */}
      <label className="hidden" aria-hidden="true">
        Site web
        <input name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>

      {state.error ? (
        <p role="alert" className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300 sm:col-span-2">
          {state.error}
        </p>
      ) : null}
      {guardError ? (
        <div className="sm:col-span-2">
          <GuardError message={guardError} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2 sm:col-span-2">
        <button type="submit" disabled={pending} className={bouton()}>
          {pending ? "Envoi…" : "Envoyer la demande de devis"}
        </button>
        <span className="text-xs text-slate-400">
          Vos coordonnées servent à établir et à suivre ce devis.
        </span>
      </div>
    </form>
  );
}
