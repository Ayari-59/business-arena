"use client";

import { useState } from "react";
import { bouton } from "@/components/bouton";
import { sansMolette } from "@/components/sans-molette";

/**
 * LE FORMULAIRE DE LICENCE DE /admin : l'offre, puis ce que l'offre demande.
 *
 * Trois offres scolaires (config/tarifs.ts) : Classe (une entreprise et un niveau,
 * choisis à l'achat), Programme (une entreprise, tous les niveaux, un plafond
 * d'enseignants et d'intervenants fixé au devis), Campus (rien à choisir). Le formulaire
 * ne montre que les champs de l'offre choisie, et chacun est requis tant qu'il est
 * montré ; le serveur refuse de toute façon un paramétrage incomplet
 * (`parametrageDeLOffre`). La case « Épisodes manager » reste indépendante.
 *
 * Ce composant client ne lit pas la grille : la page lui passe les offres, les
 * entreprises, les niveaux et les prix de référence.
 */
export interface OffreDuFormulaireDeLicence {
  code: string;
  libelle: string;
  /** Le prix de référence, en euros, en exemple du montant. */
  prix: number;
  entreprise: boolean;
  niveau: boolean;
  plafond: boolean;
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

export function FormulaireDeLicence({
  action,
  offres,
  entreprises,
  niveaux,
  episodes,
}: {
  action: (formData: FormData) => void | Promise<void>;
  offres: readonly OffreDuFormulaireDeLicence[];
  entreprises: readonly { code: string; nom: string }[];
  niveaux: readonly { niveau: number; nom: string }[];
  /** Le nom des épisodes manager, pour la case. */
  episodes: string;
}) {
  const [code, setCode] = useState(offres[0]?.code ?? "");
  const offre = offres.find((o) => o.code === code);

  return (
    <form
      action={action}
      data-formulaire-licence=""
      data-offre-choisie={code || "episodes"}
      className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      <label className="block">
        <span className={etiquette}>Offre de l&apos;arène</span>
        <select name="arene" value={code} onChange={(e) => setCode(e.target.value)} className={champ}>
          {offres.map((o) => (
            <option key={o.code} value={o.code}>
              {o.libelle}
            </option>
          ))}
          <option value="">Sans l&apos;arène (épisodes seuls)</option>
        </select>
      </label>
      <label className="flex items-end gap-2 pb-1.5 text-xs text-slate-300">
        <input type="checkbox" name="episodes" className="h-4 w-4 accent-amber-400" />
        {episodes} (sur devis)
      </label>
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
      <Champ name="label" label="Intitulé" placeholder="Année scolaire 2026-2027" required />
      <Champ name="startsAt" label="Début" type="date" required />
      <Champ name="endsAt" label="Fin" type="date" required />
      <Champ name="reference" label="Devis / bon de commande" placeholder="DEV-2026-114" />
      <Champ name="amount" label="Montant (€)" placeholder={offre ? String(offre.prix) : ""} />
      <button className={`${bouton({ taille: "s" })} col-span-2 sm:col-span-3`}>Enregistrer la licence</button>
    </form>
  );
}
