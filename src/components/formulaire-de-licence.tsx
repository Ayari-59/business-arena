"use client";

import { useState } from "react";
import { bouton } from "@/components/bouton";
import { sansMolette } from "@/components/sans-molette";
import { euros, montantDeLaRemise, type NatureDeLicence, type TypeDeRemise } from "@/config/catalogue";

/**
 * LE FORMULAIRE DE LICENCE DE /admin : une offre du catalogue, puis ce qu'elle demande.
 *
 * Demande du propriétaire : attribuer une licence DEPUIS UNE OFFRE (/admin/offres). Choisir
 * l'offre pré-remplit son périmètre (l'arène et son paramétrage, les épisodes), ses limites
 * et son prix catalogue ; on ajuste ce que l'offre laisse au choix (l'entreprise, le
 * niveau, le nombre d'enseignants fixé au devis), on applique une remise commerciale
 * (% ou €, avec son motif), et le MONTANT FACTURÉ se calcule sous les yeux, comme le serveur
 * le recalcule (services/vente.service.ts). Une licence peut aussi être OFFERTE (0 €, un
 * motif obligatoire) ou, si l'essai d'établissement est activé, D'ESSAI (0 €, datée dans
 * sa durée maximale). Prix nets : franchise de TVA.
 *
 * Ce composant client ne lit pas le catalogue : la page lui passe les offres, les
 * entreprises, les niveaux, les motifs et le réglage de l'essai.
 */
export interface OffreDuFormulaireDeLicence {
  code: string;
  libelle: string;
  /** Le prix catalogue en centimes ; null : sur devis, le prix du devis se saisit. */
  prixCents: number | null;
  entreprise: boolean;
  niveau: boolean;
  plafond: boolean;
  /** L'offre ouvre-t-elle l'arène ? les épisodes ? */
  arene: boolean;
  episodes: boolean;
}

const champ = "mt-1 w-full champ px-2 py-1.5 text-xs text-slate-100 outline-none";
const etiquette = "text-xs uppercase tracking-wide text-slate-400";

function Champ({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className={etiquette}>{label}</span>
      <input name={name} type={type} placeholder={placeholder} required={required} className={champ} />
    </label>
  );
}

/** « 290 » ou « 290,5 » : des centimes en euros pour un champ. */
const enEuros = (cents: number | null) => (cents === null ? "" : String(cents / 100).replace(".", ","));
/** Un montant saisi en euros, en centimes ; null si vide ou illisible. */
const enCentimes = (texte: string): number | null => {
  const n = Number(texte.replace(/\s/g, "").replace(",", "."));
  return texte.trim() !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

export function FormulaireDeLicence({
  action,
  offres,
  entreprises,
  niveaux,
  episodes,
  motifsDeRemise,
  motifsDeGratuite,
  essai,
}: {
  action: (formData: FormData) => void | Promise<void>;
  offres: readonly OffreDuFormulaireDeLicence[];
  entreprises: readonly { code: string; nom: string }[];
  niveaux: readonly { niveau: number; nom: string }[];
  /** Le nom des épisodes manager, pour la case. */
  episodes: string;
  motifsDeRemise: readonly { code: string; libelle: string }[];
  motifsDeGratuite: readonly { code: string; libelle: string }[];
  /** L'essai d'établissement : permis ou non, et sa durée maximale. */
  essai: { autorise: boolean; dureeMaxJours: number };
}) {
  const [code, setCode] = useState(offres[0]?.code ?? "");
  const offre = offres.find((o) => o.code === code);
  const [nature, setNature] = useState<NatureDeLicence>("vendue");
  const [prix, setPrix] = useState(enEuros(offre?.prixCents ?? null));
  const [typeRemise, setTypeRemise] = useState<TypeDeRemise | "">("");
  const [valeurRemise, setValeurRemise] = useState("");

  const choisir = (c: string) => {
    setCode(c);
    setPrix(enEuros(offres.find((o) => o.code === c)?.prixCents ?? null));
  };

  // Le montant facturé, calculé comme le serveur le calcule.
  const base = offre?.prixCents ?? enCentimes(prix);
  const valeur =
    typeRemise === "pourcentage" ? Math.floor(Number(valeurRemise.replace(",", "."))) : (enCentimes(valeurRemise) ?? 0);
  const remise =
    nature === "vendue" && base !== null && typeRemise && valeur > 0
      ? montantDeLaRemise(base, { type: typeRemise, valeur })
      : 0;
  const montant = nature !== "vendue" ? 0 : base === null ? null : base - remise;

  return (
    <form
      action={action}
      data-formulaire-licence=""
      data-offre-choisie={code}
      className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      <label className="col-span-2 block">
        <span className={etiquette}>Offre du catalogue</span>
        <select name="offre" value={code} onChange={(e) => choisir(e.target.value)} className={champ}>
          {offres.map((o) => (
            <option key={o.code} value={o.code}>
              {o.libelle}
            </option>
          ))}
        </select>
      </label>
      {offre && !offre.episodes ? (
        <label className="flex items-end gap-2 pb-1.5 text-xs text-slate-300">
          <input type="checkbox" name="episodes" className="h-4 w-4 accent-amber-400" />+ {episodes} (sur devis)
        </label>
      ) : (
        <p className="flex items-end pb-1.5 text-xs text-slate-400">
          {offre?.arene ? `Arène et ${episodes}` : `${episodes} seuls`}
        </p>
      )}
      {offre?.entreprise ? (
        <label className="block" data-champ-licence="entreprise">
          <span className={etiquette}>Entreprise</span>
          <select name="entreprise" required defaultValue="" className={champ}>
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
      {offre?.niveau ? (
        <label className="block" data-champ-licence="niveau">
          <span className={etiquette}>Niveau</span>
          <select name="niveau" required defaultValue="" className={champ}>
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
      {offre?.plafond ? (
        <label className="block" data-champ-licence="plafond">
          <span className={etiquette}>Enseignants et intervenants (devis)</span>
          <input
            name="maxTeachers"
            type="number"
            onWheel={sansMolette}
            min={1}
            step={1}
            required
            placeholder="5"
            className={champ}
          />
        </label>
      ) : null}

      <fieldset className="col-span-2 flex flex-wrap gap-x-5 gap-y-1 sm:col-span-3" data-nature-licence={nature}>
        <legend className={etiquette}>Nature</legend>
        {(
          [
            ["vendue", "Vendue"],
            ["offerte", "Offerte (0 €)"],
            ...(essai.autorise ? [["essai", `Essai (${essai.dureeMaxJours} jours au plus)`]] : []),
          ] as [NatureDeLicence, string][]
        ).map(([n, libelle]) => (
          <label key={n} className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="radio"
              name="nature"
              value={n}
              checked={nature === n}
              onChange={() => setNature(n)}
              className="h-4 w-4 accent-amber-400"
            />
            {libelle}
          </label>
        ))}
      </fieldset>

      {nature === "vendue" ? (
        <>
          <label className="block" data-champ-licence-vente="prix">
            <span className={etiquette}>Prix catalogue (€)</span>
            <input
              name="prixCatalogue"
              inputMode="decimal"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              readOnly={offre?.prixCents !== null}
              placeholder={offre?.prixCents === null ? "Prix du devis" : undefined}
              className={champ}
            />
          </label>
          <label className="block" data-champ-licence-vente="remise">
            <span className={etiquette}>Remise commerciale</span>
            <span className="mt-1 flex gap-1">
              <select
                name="typeRemise"
                aria-label="Type de remise"
                value={typeRemise}
                onChange={(e) => setTypeRemise(e.target.value as TypeDeRemise | "")}
                className="champ px-2 py-1.5 text-xs text-slate-100 outline-none"
              >
                <option value="">Aucune</option>
                <option value="pourcentage">%</option>
                <option value="montant">€</option>
              </select>
              {typeRemise ? (
                <input
                  name="valeurRemise"
                  aria-label="Valeur de la remise"
                  inputMode="decimal"
                  required
                  value={valeurRemise}
                  onChange={(e) => setValeurRemise(e.target.value)}
                  placeholder={typeRemise === "pourcentage" ? "10" : "100"}
                  className="min-w-0 flex-1 champ px-2 py-1.5 text-xs text-slate-100 outline-none"
                />
              ) : null}
            </span>
          </label>
          {typeRemise ? (
            <label className="block" data-champ-licence-vente="motif">
              <span className={etiquette}>Motif de la remise</span>
              <select name="motifRemise" required defaultValue="" className={champ}>
                <option value="" disabled>
                  Choisir le motif
                </option>
                {motifsDeRemise.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.libelle}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </>
      ) : nature === "offerte" ? (
        <label className="block" data-champ-licence-vente="motif-gratuite">
          <span className={etiquette}>Motif de la gratuité</span>
          <select name="motifGratuite" required defaultValue="" className={champ}>
            <option value="" disabled>
              Choisir le motif
            </option>
            {motifsDeGratuite.map((m) => (
              <option key={m.code} value={m.code}>
                {m.libelle}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="col-span-2 self-end pb-1.5 text-xs text-slate-300 sm:col-span-1" data-montant-facture="">
        Montant facturé :{" "}
        <strong className="font-semibold tabular-nums text-slate-100">
          {montant === null ? "au prix du devis" : euros(montant)}
        </strong>
        {remise > 0 ? <span className="text-slate-400"> (remise {euros(remise)})</span> : null}
      </p>

      <Champ name="label" label="Intitulé" placeholder="Année scolaire 2026-2027" required />
      <Champ name="startsAt" label="Début" type="date" required />
      <Champ name="endsAt" label="Fin" type="date" required />
      <Champ name="reference" label="Devis / bon de commande" placeholder="DEV-2026-114" />
      <button className={`${bouton({ taille: "s" })} col-span-2 sm:col-span-3`}>Enregistrer la licence</button>
    </form>
  );
}
