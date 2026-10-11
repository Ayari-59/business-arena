"use client";

import { useState } from "react";
import { bouton } from "@/components/bouton";
import { envoyerDemandeDeDevisAction, type DevisFormState } from "@/app/devis/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { euros } from "@/config/catalogue";

/**
 * LE FORMULAIRE DE DEMANDE DE DEVIS.
 *
 * L'offre arrive pré-remplie de la carte de /tarifs (`?offre=…`) et se change dans la
 * liste ; les libellés suivent le public (une école, son UAI, ses enseignants et ses
 * intervenants ; une entreprise, son SIRET et ses managers). Classe et Programme se
 * paramètrent à l'achat : le formulaire demande l'entreprise souhaitée, et pour Classe le
 * niveau. Ce composant client ne lit pas la grille : la
 * page serveur lui passe les offres et leurs libellés (config/tarifs.ts).
 *
 * La confirmation DIT LA VÉRITÉ : l'accusé de réception n'est annoncé que s'il est parti.
 *
 * LE CODE PROMO, facultatif, est vérifié par le serveur ; un code refusé revient avec sa
 * phrase, la saisie gardée. Accepté : « Code RENTREE pris en compte : la remise sera
 * appliquée à votre devis. » Aucun montant tant que l'affichage des prix est éteint (le
 * réglage par défaut : offres sur mesure) ; allumé, le devis qu'il donne (prix catalogue,
 * remise, prix remisé, nets).
 */
export interface OffreDuFormulaire {
  code: string;
  offre: string;
  organisation: string;
  exempleOrganisation: string;
  identifiant: string;
  /** Absent : l'offre ne demande pas d'effectif (Classe, un enseignant). */
  effectif?: string;
  /** L'offre se paramètre à l'achat : l'entreprise souhaitée (Classe, Programme). */
  entreprise?: true;
  /** Et le niveau (Classe). */
  niveau?: true;
}

const ETAT_INITIAL: DevisFormState = { error: null, ok: null, values: null };

export function DevisForm({
  offres,
  offreInitiale,
  entreprises,
  niveaux,
  vendeur,
  mentionTva,
  contact,
  initial = ETAT_INITIAL,
}: {
  offres: readonly OffreDuFormulaire[];
  offreInitiale: string;
  /** Les entreprises de l'arène, pour les offres qui se paramètrent à l'achat. */
  entreprises: readonly { code: string; nom: string }[];
  /** Les niveaux de l'arène, pour l'offre Classe. */
  niveaux: readonly { niveau: number; nom: string }[];
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
        {state.ok.promo && !state.ok.promo.montants ? (
          <p
            data-devis-promo={state.ok.promo.code}
            className="rounded-lg border border-[var(--filet-carte)] px-4 py-3 text-sm leading-relaxed text-slate-200"
          >
            Code <strong className="font-semibold text-slate-50">{state.ok.promo.code}</strong> pris en compte : la
            remise sera appliquée à votre devis.
          </p>
        ) : state.ok.promo ? (
          <dl
            data-devis-promo={state.ok.promo.code}
            className="grid gap-x-6 gap-y-1 rounded-lg border border-[var(--filet-carte)] px-4 py-3 text-sm sm:grid-cols-[auto_1fr]"
          >
            <dt className="text-slate-400">Code promo</dt>
            <dd className="font-semibold text-slate-100">
              {state.ok.promo.code} · {state.ok.promo.remiseLibelle}
            </dd>
            {state.ok.promo.prixCatalogueCents !== null ? (
              <>
                <dt className="text-slate-400">Prix catalogue</dt>
                <dd className="tabular-nums text-slate-300" data-prix-catalogue="">
                  {euros(state.ok.promo.prixCatalogueCents)} par an
                </dd>
              </>
            ) : null}
            {state.ok.promo.remiseCents !== null ? (
              <>
                <dt className="text-slate-400">Remise</dt>
                <dd className="tabular-nums text-slate-300">{euros(state.ok.promo.remiseCents)}</dd>
              </>
            ) : null}
            <dt className="text-slate-400">Prix remisé</dt>
            <dd className="font-semibold tabular-nums text-slate-50" data-prix-remise="">
              {state.ok.promo.prixRemiseCents !== null
                ? `${euros(state.ok.promo.prixRemiseCents)} par an`
                : "établi au devis, remise comprise"}
            </dd>
          </dl>
        ) : null}
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
      {choisie.entreprise ? (
        <label className="block" data-champ-devis="entreprise">
          <span className={etiquette}>L&apos;entreprise souhaitée</span>
          {/* La clé suit la valeur rendue : après un refus (un code promo invalide…), React
              remet le formulaire à zéro sur la valeur PAR DÉFAUT de la liste, que seul un
              nouveau montage met à jour. Sans elle, la liste revenait à « Choisir » et
              bloquait le second envoi. */}
          <select key={v?.entreprise ?? ""} name="entreprise" required defaultValue={v?.entreprise ?? ""} className={champ}>
            <option value="" disabled>
              Choisir l&apos;entreprise
            </option>
            {entreprises.map((e) => (
              <option key={e.code} value={e.code}>
                {e.nom}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {choisie.niveau ? (
        <label className="block" data-champ-devis="niveau">
          <span className={etiquette}>Le niveau souhaité</span>
          <select key={v?.niveau ?? ""} name="niveau" required defaultValue={v?.niveau ?? ""} className={champ}>
            <option value="" disabled>
              Choisir le niveau
            </option>
            {niveaux.map((n) => (
              <option key={n.niveau} value={n.niveau}>
                {n.niveau} · {n.nom}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {choisie.effectif ? (
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
      ) : null}
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
      <label className="block">
        <span className={etiquette}>Code promo</span>
        <input
          name="codePromo"
          maxLength={40}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          defaultValue={v?.codePromo ?? ""}
          className={`${champ} font-mono`}
        />
        <span className="mt-1 block text-xs text-slate-400">Facultatif.</span>
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
