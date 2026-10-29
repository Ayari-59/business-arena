"use client";

import { useEffect, useState } from "react";
import { bouton } from "@/components/bouton";
import { envoyerDemandeDeDevisAction, type DevisFormState } from "@/app/devis/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { euros } from "@/config/catalogue";
import type { AteliersDeLaClasse } from "@/config/ateliers-de-la-classe";
import { parametrageRequisAuDevis } from "@/config/tarifs";

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
  entrepriseInitiale = "",
  niveauInitial = "",
  ateliers = {},
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
  /** Le réglage déjà choisi ailleurs (`?entreprise=…&niveau=…`, depuis l'orientation). */
  entrepriseInitiale?: string;
  niveauInitial?: string;
  /**
   * Les ateliers de chaque combinaison « entreprise:niveau » (config/ateliers-de-la-classe.ts) :
   * l'offre qui se paramètre à un niveau dit, au moment du choix, ce qu'elle ouvre.
   */
  ateliers?: Readonly<Record<string, AteliersDeLaClasse>>;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    envoyerDemandeDeDevisAction,
    initial,
    { label: "demande de devis" },
  );
  const v = state.values;
  const [offre, setOffre] = useState(v?.offre || offreInitiale);
  const choisie = offres.find((o) => o.code === offre) ?? offres[0]!;
  // « LE COURS SEUL » N'EST PLUS UN CHOIX (audit de l'offre, octobre 2026) : le cours vient
  // avec une offre de l'arène, Classe pour le parcours de la classe, Programme pour ceux de
  // ses classes, Campus pour tout (config/tarifs.ts, LE_COURS_PAR_OFFRE). Une offre qui se
  // paramètre demande donc toujours son entreprise et son niveau.
  // Exigés pour Classe seulement ; facultatifs pour Programme et Campus (audit UX, P1-7).
  const requis = parametrageRequisAuDevis(choisie);
  const [entrepriseChoisie, setEntreprise] = useState(v?.entreprise ?? entrepriseInitiale);
  const [niveauChoisi, setNiveau] = useState(v?.niveau ?? niveauInitial);
  const combinaison =
    choisie.entreprise && choisie.niveau && entrepriseChoisie && niveauChoisi
      ? ateliers[`${entrepriseChoisie}:${niveauChoisi}`]
      : undefined;

  // L'ERREUR SOUS SON CHAMP, LE FOCUS DESSUS (audit UX du 29 octobre 2026, P1-6) : sur
  // téléphone, un message en bas du formulaire obligeait à remonter chercher le champ.
  const champEnErreur = state.error ? (state.champ ?? null) : null;
  useEffect(() => {
    if (!champEnErreur) return;
    const el = formRef.current?.elements.namedItem(champEnErreur);
    if (el && "focus" in el) (el as HTMLElement).focus();
  }, [state, champEnErreur, formRef]);
  const erreur = (nom: string) =>
    champEnErreur === nom ? (
      <span id={`erreur-${nom}`} role="alert" data-erreur-du-champ={nom} className="mt-1 block text-sm text-red-300">
        {state.error}
      </span>
    ) : null;
  const invalide = (nom: string) =>
    champEnErreur === nom ? { "aria-invalid": true as const, "aria-describedby": `erreur-${nom}` } : {};

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
    <form ref={formRef} action={formAction} noValidate className="carte grid gap-4 p-6 sm:grid-cols-2" data-formulaire-devis="">
      <label className="block sm:col-span-2">
        <span className={etiquette}>L&apos;offre</span>
        <select
          name="offre"
          value={offre}
          onChange={(e) => setOffre(e.target.value)}
          className={champ}
          {...invalide("offre")}
        >
          {offres.map((o) => (
            <option key={o.code} value={o.code}>
              {o.offre}
            </option>
          ))}
        </select>
        {erreur("offre")}
      </label>
      <label className="block">
        <span className={etiquette}>Votre nom</span>
        <input name="nom" required maxLength={120} autoComplete="name" defaultValue={v?.nom ?? ""} className={champ} {...invalide("nom")} />
        {erreur("nom")}
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
          {...invalide("fonction")}
        />
        {erreur("fonction")}
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
          {...invalide("organisation")}
        />
        {erreur("organisation")}
      </label>
      <label className="block">
        <span className={etiquette}>{choisie.identifiant}</span>
        <input name="identifiant" maxLength={40} defaultValue={v?.identifiant ?? ""} className={champ} {...invalide("identifiant")} />
        {erreur("identifiant")}
      </label>
      {choisie.entreprise ? (
        <label className="block" data-champ-devis="entreprise">
          <span className={etiquette}>L&apos;entreprise souhaitée</span>
          {/* La clé suit la valeur rendue : après un refus (un code promo invalide…), React
              remet le formulaire à zéro sur la valeur PAR DÉFAUT de la liste, que seul un
              nouveau montage met à jour. Sans elle, la liste revenait à « Choisir » et
              bloquait le second envoi. */}
          <select
            key={v?.entreprise ?? entrepriseInitiale}
            name="entreprise"
            required={requis}
            onChange={(e) => setEntreprise(e.target.value)}
            defaultValue={v?.entreprise ?? entrepriseInitiale}
            className={champ}
            {...invalide("entreprise")}
          >
            <option value="" disabled={requis}>
              {requis ? "Choisir l'entreprise" : "À choisir plus tard par l'équipe"}
            </option>
            {entreprises.map((e) => (
              <option key={e.code} value={e.code}>
                {e.nom}
              </option>
            ))}
          </select>
          {requis ? null : (
            <span className="mt-1 block text-xs text-slate-400" data-facultatif="entreprise">
              Facultatif : un choix pédagogique que l&apos;équipe pourra faire.
            </span>
          )}
          {erreur("entreprise")}
        </label>
      ) : null}
      {choisie.niveau ? (
        <label className="block" data-champ-devis="niveau">
          <span className={etiquette}>Le niveau souhaité</span>
          <select
            key={v?.niveau ?? niveauInitial}
            name="niveau"
            required={requis}
            onChange={(e) => setNiveau(e.target.value)}
            defaultValue={v?.niveau ?? niveauInitial}
            className={champ}
            {...invalide("niveau")}
          >
            <option value="" disabled={requis}>
              {requis ? "Choisir le niveau" : "À choisir plus tard par l'équipe"}
            </option>
            {niveaux.map((n) => (
              <option key={n.niveau} value={n.niveau}>
                {n.niveau} · {n.nom}
              </option>
            ))}
          </select>
          {erreur("niveau")}
        </label>
      ) : null}
      {combinaison ? (
        // CE QUE CE CHOIX OUVRE EN ATELIERS, dit avant l'envoi (audit produit, P1-4) : près
        // d'une combinaison sur deux n'en a aucun, et la carte de l'offre ne le disait pas.
        <p className="encadre-neutre rounded-lg px-3 py-2 text-sm leading-relaxed text-slate-200 sm:col-span-2" data-ateliers-du-choix="" aria-live="polite">
          {combinaison.exacts.length + combinaison.adaptables.length === 0
            ? "Aucun atelier clé en main n'est écrit pour cette entreprise à ce niveau, ni à un niveau près. L'offre comprend alors le cours entier et les parties de l'arène à ce niveau, sans atelier : choisissez un autre niveau ou une autre entreprise pour en avoir un."
            : [
                combinaison.exacts.length
                  ? `Ateliers clés en main écrits pour ce choix : ${combinaison.exacts.map((a) => a.titre).join(", ")}.`
                  : "Aucun atelier n'est écrit pour ce niveau exact.",
                combinaison.adaptables.length
                  ? ` À adapter d'un niveau (section « Adapter le niveau » de la fiche) : ${combinaison.adaptables.map((a) => `${a.titre} (niveau ${a.niveau})`).join(", ")}.`
                  : "",
              ].join("")}
        </p>
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
            {...invalide("effectif")}
          />
          {erreur("effectif")}
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
          {...invalide("email")}
        />
        {erreur("email")}
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
          {...invalide("codePromo")}
        />
        <span className="mt-1 block text-xs text-slate-400">Facultatif.</span>
        {erreur("codePromo")}
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
          {...invalide("message")}
        />
        <span className="mt-1 block text-xs text-slate-400">Facultatif.</span>
        {erreur("message")}
      </label>
      {/* piège à robots : invisible, doit rester vide */}
      <label className="hidden" aria-hidden="true">
        Site web
        <input name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>

      {state.error && !champEnErreur ? (
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
