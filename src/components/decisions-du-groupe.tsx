"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Aide } from "@/components/aide-repliable";
import { Icone } from "@/components/icone";
import { sansMolette } from "@/components/sans-molette";
import {
  PREFIXE_FABRICATION_ETRANGERE,
  PREFIXE_RESEAU_ETRANGER,
  champDeSousTraitance,
  champDeSynergie,
  cibleLue,
  valeurDeCible,
} from "@/config/decisions-saisies";
import { idDuChamp } from "@/config/refus-de-decision";
import { coutAuBareme } from "@/engine/groupe/sous-traitance";
import type { RoundDecisions } from "@/engine/types";
import { formatEuro, formatEuroCents, formatUnits } from "@/lib/format";
import { eligibiliteDuRachat, prixDeLaCible } from "@/services/groupe-eligibilite";
import type { CibleVue, SousTraitanceVue, VueDuGroupe } from "@/services/groupe-view.service";

/**
 * LES DÉCISIONS DU NIVEAU 7 « GROUPE », SUR LA FEUILLE DE DÉCISION.
 *
 * Deux blocs, chacun dans l'étape de son thème (`config/etapes-des-modules`) :
 *
 *   · « S'approvisionner » : fabriquer ou faire fabriquer. Par référence, le
 *     barème du sous-traitant tranche par tranche, le coût de la commande
 *     saisie, et le seuil d'indifférence face à une ligne en propre ; puis le
 *     fournisseur import et ses risques ; puis ce que les filiales étrangères
 *     vendent ou fabriquent pour l'équipe.
 *   · « Financer & investir » : la croissance externe. Les cibles et ce qu'on
 *     en sait, l'audit d'un site, le rachat et son montage, et AVANT L'ENVOI
 *     ce que le moteur en dirait (`services/groupe-eligibilite`, des mêmes
 *     fonctions que le jour 1).
 *
 * Les champs suivent les conventions de la feuille : un nom lu par
 * `config/decisions-saisies`, le refus sous le champ (`idDuChamp`), rien de
 * coché ni de choisi d'office sauf un envoi déjà enregistré ce tour.
 */

type Erreurs = ReadonlyMap<string, string>;

/** Ce qu'il faut pour nommer une référence de la gamme. */
type References = readonly { code: string; name: string }[];

const nombreFr = (n: number, decimales = 0) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: decimales }).format(n);
const pourCent = (x: number) => `${nombreFr(x * 100, 1)} %`;

function MessageDeRefus({ nom, erreurs }: { nom: string; erreurs: Erreurs }) {
  const message = erreurs.get(nom);
  if (!message) return null;
  return (
    <span
      id={`${idDuChamp(nom)}-refus`}
      data-refus-du-champ=""
      className="mt-1.5 flex items-start gap-1.5 text-sm leading-snug text-red-300"
    >
      <Icone nom="alerte" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </span>
  );
}

const attributsDeRefus = (nom: string, erreurs: Erreurs) =>
  erreurs.has(nom) ? { "aria-invalid": true as const, "aria-describedby": `${idDuChamp(nom)}-refus` } : {};

/** Un nombre à saisir, au gabarit des champs de la feuille. */
function ChampNombre({
  name,
  label,
  defaultValue,
  suffixe,
  max,
  step = 1,
  aide,
  erreurs,
  onValeur,
  requis = false,
}: {
  name: string;
  label: string;
  defaultValue: number | "";
  suffixe: string;
  max?: number;
  step?: number;
  aide?: ReactNode;
  erreurs: Erreurs;
  onValeur?: (n: number) => void;
  requis?: boolean;
}) {
  return (
    <div>
      <label className="block">
        <span className="libelle block font-semibold leading-4 text-slate-300">{label}</span>
        <span className="mt-1 flex items-center gap-2 champ px-3 py-2">
          <input
            type="number"
            onWheel={sansMolette}
            inputMode="decimal"
            id={idDuChamp(name)}
            {...attributsDeRefus(name, erreurs)}
            name={name}
            defaultValue={defaultValue}
            min={0}
            {...(max !== undefined ? { max } : {})}
            step={step}
            required={requis}
            onChange={
              onValeur
                ? (e) => {
                    const v = Number(e.currentTarget.value.replace(",", "."));
                    onValeur(Number.isFinite(v) ? v : 0);
                  }
                : undefined
            }
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold tabular-nums text-slate-50 outline-none"
          />
          <span className="shrink-0 text-xs text-slate-300">{suffixe}</span>
        </span>
      </label>
      {aide ? <span className="mt-1 block text-sm text-slate-400">{aide}</span> : null}
      <MessageDeRefus nom={name} erreurs={erreurs} />
    </div>
  );
}

// ── FABRIQUER OU FAIRE FABRIQUER ───────────────────────────────────────────

/** Le barème, tranche par tranche, en toutes lettres. */
export function lignesDuBareme(ref: Pick<SousTraitanceVue, "tranches" | "plafond">): string[] {
  const out: string[] = [];
  let bas = 0;
  for (const t of ref.tranches) {
    if (t.jusqua === undefined) {
      out.push(`au-delà de ${formatUnits(bas)} unités : ${formatEuroCents(t.prix)} l'unité`);
    } else {
      out.push(
        bas === 0
          ? `jusqu'à ${formatUnits(t.jusqua)} unités : ${formatEuroCents(t.prix)} l'unité`
          : `de ${formatUnits(bas + 1)} à ${formatUnits(t.jusqua)} unités : ${formatEuroCents(t.prix)} l'unité`,
      );
      bas = t.jusqua;
    }
  }
  return out;
}

/** La phrase du seuil d'indifférence, ou ce qui en tient lieu. */
export function phraseDuSeuil(ref: SousTraitanceVue): string {
  const s = ref.seuil;
  if (!s) {
    return "Aucune ligne en propre ne fait mieux que le sous-traitant sur ce volume : son prix de première tranche ne dépasse pas votre coût variable, ou il faudrait plus que la capacité d'une ligne pour amortir son coût fixe.";
  }
  return `Au-dessus de ${formatUnits(s.unites)} unités par tour durablement, une ligne en propre coûte moins cher (${s.ligne.nom} : ${formatEuro(s.coutFixeParTour)} par tour d'amortissement et de salaires, puis ${formatEuroCents(ref.coutVariableInterne)} l'unité, contre ${formatEuroCents(ref.tranches[0]!.prix)} l'unité dès la première tranche chez le sous-traitant).`;
}

function UneReferenceSousTraitee({
  reference: r,
  initiale,
  erreurs,
}: {
  reference: SousTraitanceVue;
  initiale: number;
  erreurs: Erreurs;
}) {
  const [q, setQ] = useState(initiale);
  const cout = coutAuBareme(Math.min(q, r.plafond), r.tranches);
  const nom = champDeSousTraitance(r.code);
  return (
    <div className="panneau-info rounded-xl px-3 py-2.5" data-sous-traitance={r.code}>
      <p className="text-sm font-medium text-slate-200">{r.nom}</p>
      <ul className="mt-1 space-y-0.5 text-xs text-slate-300" data-bareme={r.code}>
        {lignesDuBareme(r).map((l) => (
          <li key={l} className="tabular-nums">
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </li>
        ))}
        <li className="text-slate-400">
          Au plus {formatUnits(r.plafond)} unités par tour. En propre, {formatEuroCents(r.coutVariableInterne)} de coût variable
          par unité.
        </li>
      </ul>
      <p className="mt-2 text-sm leading-snug text-[var(--donnee)]" data-seuil-d-indifference={r.code}>
        {phraseDuSeuil(r)}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <ChampNombre
          name={nom}
          label={`Commande de ${r.nom}`}
          defaultValue={initiale > 0 ? initiale : ""}
          suffixe="unités"
          max={r.plafond}
          erreurs={erreurs}
          onValeur={setQ}
        />
        <p className="self-end pb-2 text-sm tabular-nums text-slate-300" data-cout-de-la-commande={r.code}>
          {q > 0
            ? `Coût de la commande : ${formatEuro(cout)}, soit ${formatEuroCents(cout / Math.min(q, r.plafond))} l'unité en moyenne.`
            : "Rien de commandé : aucun coût."}
        </p>
      </div>
    </div>
  );
}

/** Les synergies d'une filiale étrangère : ce que son réseau écoule, ce que son usine fabrique. */
function SynergiesDUneFiliale({
  cible,
  cours,
  defaults,
  references,
  erreurs,
}: {
  cible: CibleVue;
  cours: number;
  defaults: RoundDecisions;
  references: References;
  erreurs: Erreurs;
}) {
  const e = cible.etranger!;
  const nomDe = (code: string) => references.find((r) => r.code === code)?.name ?? code;
  return (
    <div className="panneau-info rounded-xl px-3 py-2.5" data-filiale={cible.id}>
      <p className="text-sm font-medium text-slate-200">
        {cible.nom} <span className="text-xs font-normal text-slate-400">({e.pays}, 1 {e.devise} = {nombreFr(cours, 4)} €)</span>
      </p>
      {e.reseau ? (
        <div className="mt-2">
          <p className="text-xs text-slate-300">
            Son réseau écoule jusqu&apos;à {formatUnits(e.reseau.capacite)} unités par tour, prises sur votre stock ;
            frais fixes de {nombreFr(e.reseau.coutFixeParTour)} {e.devise} chaque tour où vous vous en servez, et{" "}
            {nombreFr(e.reseau.coutParUnite, 2)} {e.devise} de distribution par unité.
          </p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {Object.entries(e.reseau.prix).map(([code, prix]) => {
              const nom = champDeSynergie(PREFIXE_RESEAU_ETRANGER, cible.id, code);
              const initiale = defaults.reseauEtranger?.[cible.id]?.[code] ?? 0;
              return (
                <ChampNombre
                  key={nom}
                  name={nom}
                  label={`${nomDe(code)} vendues là-bas`}
                  defaultValue={initiale > 0 ? initiale : ""}
                  suffixe="unités"
                  max={e.reseau!.capacite}
                  erreurs={erreurs}
                  aide={`Prix local ${nombreFr(prix, 2)} ${e.devise}, soit ${formatEuroCents(prix * cours)} au dernier cours.`}
                />
              );
            })}
          </div>
        </div>
      ) : null}
      {e.fabrication ? (
        <div className="mt-2">
          <p className="text-xs text-slate-300">
            Son usine fabrique jusqu&apos;à {formatUnits(e.fabrication.capacite)} unités par tour, livrées finies ;
            frais fixes de {nombreFr(e.fabrication.coutFixeParTour)} {e.devise} chaque tour où vous vous en servez.
          </p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {Object.entries(e.fabrication.cout).map(([code, cout]) => {
              const nom = champDeSynergie(PREFIXE_FABRICATION_ETRANGERE, cible.id, code);
              const initiale = defaults.fabricationEtrangere?.[cible.id]?.[code] ?? 0;
              return (
                <ChampNombre
                  key={nom}
                  name={nom}
                  label={`${nomDe(code)} fabriquées là-bas`}
                  defaultValue={initiale > 0 ? initiale : ""}
                  suffixe="unités"
                  max={e.fabrication!.capacite}
                  erreurs={erreurs}
                  aide={`Coût local ${nombreFr(cout, 2)} ${e.devise}, soit ${formatEuroCents(cout * cours)} au dernier cours.`}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Ce que le repli de l'approvisionnement annonce. */
export function quoiDeLApprovisionnement(d: FormData): string {
  let commandes = 0;
  let synergies = 0;
  for (const [nom, brut] of d.entries()) {
    if (typeof brut !== "string" || !(Number(brut.replace(",", ".")) > 0)) continue;
    if (nom.startsWith("sousTraitance.")) commandes++;
    else if (nom.startsWith(PREFIXE_RESEAU_ETRANGER) || nom.startsWith(PREFIXE_FABRICATION_ETRANGERE)) synergies++;
  }
  const parties = [
    commandes > 0 ? `${commandes} commande${commandes > 1 ? "s" : ""}` : null,
    synergies > 0 ? `${synergies} synergie${synergies > 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  return parties.length > 0 ? parties.join(", ") : "Aucune commande";
}

export function ApprovisionnementDuGroupe({
  vue,
  defaults,
  references,
  fournisseurs,
  erreurs,
}: {
  vue: VueDuGroupe;
  defaults: RoundDecisions;
  references: References;
  /** Les fournisseurs de la gamme, pour nommer l'import. */
  fournisseurs: readonly { code: string; name: string }[];
  erreurs: Erreurs;
}) {
  const filialesEtrangeres = vue.filiales
    .filter((f) => f.type === "etranger")
    .flatMap((f) => {
      const c = vue.cibles.find((x) => x.type === "etranger" && x.id === f.id);
      return c?.etranger && (c.etranger.reseau || c.etranger.fabrication) ? [{ f, c }] : [];
    });
  const imp = vue.import;
  const nomDeLImport = imp ? (fournisseurs.find((s) => s.code === imp.code)?.name ?? imp.code) : null;
  return (
    <div className="space-y-3" data-approvisionnement-du-groupe="">
      {vue.sousTraitance && vue.sousTraitance.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-slate-400">
            Le sous-traitant livre des produits finis dans le tour, avant le marché : ni heures, ni machines, ni coût
            fixe. La commande est ferme : ce qui ne se vend pas reste en stock, payé.
          </p>
          {vue.sousTraitance.map((r) => (
            <UneReferenceSousTraitee
              key={r.code}
              reference={r}
              initiale={defaults.sousTraitance?.[r.code] ?? 0}
              erreurs={erreurs}
            />
          ))}
        </div>
      ) : null}
      {imp ? (
        <div className="panneau-info rounded-xl px-3 py-2.5" data-import-du-groupe="">
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
            <Icone nom="monde" className="h-4 w-4 text-slate-300" />
            {nomDeLImport} : un import en {imp.devise}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            Son prix suit le cours du {imp.devise}
            {imp.cours.length > 0
              ? ` (1 ${imp.devise} = ${nombreFr(imp.cours[imp.cours.length - 1]!, 4)} € à la dernière clôture)`
              : ""}
            . Risque de rupture : {pourCent(imp.probabilite)} par tour
            {imp.probabiliteAuxPics !== imp.probabilite ? `, ${pourCent(imp.probabiliteAuxPics)} aux pics de saison` : ""}.
            Il se choisit référence par référence, dans le tableau de vos ventes.
          </p>
        </div>
      ) : null}
      {filialesEtrangeres.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-slate-400">
            Vos filiales étrangères, au service du groupe. Leurs prix et leurs coûts sont en devise : le cours moyen du
            tour les convertit.
          </p>
          {filialesEtrangeres.map(({ f, c }) => (
            <SynergiesDUneFiliale
              key={f.id}
              cible={c}
              cours={f.cours}
              defaults={defaults}
              references={references}
              erreurs={erreurs}
            />
          ))}
        </div>
      ) : null}
      <Aide>
        <p className="text-sm leading-relaxed text-slate-400">
          Fabriquer en propre engage des coûts fixes (la ligne s&apos;amortit, ses opérateurs sont payés) : ils
          pèsent quand le volume baisse. Faire fabriquer les rend variables, plus chers à l&apos;unité. Le seuil
          d&apos;indifférence dit où les deux se valent.
        </p>
      </Aide>
    </div>
  );
}

// ── LA CROISSANCE EXTERNE ──────────────────────────────────────────────────

const NOMS_DES_TYPES: Record<CibleVue["type"], string> = {
  site_ferme: "Sites à l'arrêt",
  fournisseur: "Fournisseurs",
  etranger: "Entreprises étrangères",
};

/** L'état d'une cible, tel que l'équipe le voit. */
export function etatDeLaCible(c: CibleVue): { libelle: string; ton: "neutre" | "bon" | "mauvais" } {
  if (c.statut === "a_vous") return { libelle: "À vous", ton: "bon" };
  if (c.statut === "vendue") return { libelle: "Déjà rachetée", ton: "mauvais" };
  if (c.auditDemande) return { libelle: "Audit en cours", ton: "neutre" };
  const o = c.derniereOffre;
  if (o && o.statut === "refuse" && o.motif && /autre acquéreur|même offre/.test(o.motif)) {
    return { libelle: `Enchère perdue au tour ${o.tour}`, ton: "mauvais" };
  }
  if (c.audit) return { libelle: "Disponible, auditée", ton: "neutre" };
  return { libelle: "Disponible", ton: "neutre" };
}

const TONS = {
  neutre: "text-slate-300 border-white/15",
  bon: "text-emerald-300 border-emerald-400/40",
  mauvais: "text-red-300 border-red-400/40",
} as const;

function FicheDeCible({ c, typesDeLignes }: { c: CibleVue; typesDeLignes: readonly { code: string; name: string }[] }) {
  const etat = etatDeLaCible(c);
  const nomDeLigne = (code: string) => typesDeLignes.find((t) => t.code === code)?.name ?? code;
  const lignes = (l: { typeCode: string; count: number }[]) =>
    l.map((x) => `${x.count} × ${nomDeLigne(x.typeCode)}`).join(", ");
  return (
    <div className="panneau-info rounded-xl px-3 py-2.5" data-cible={valeurDeCible(c)}>
      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-200">
        {c.nom}
        <span className={`rounded-full border px-2 py-0.5 text-xs font-normal ${TONS[etat.ton]}`} data-etat-de-la-cible="">
          {etat.libelle}
        </span>
        {c.prixDemande !== null ? (
          <span className="text-xs font-normal tabular-nums text-slate-300">
            {c.type === "etranger" ? "100 % : " : ""}
            {formatEuro(c.prixDemande)} demandés
          </span>
        ) : null}
      </p>
      <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{c.recit}</p>
      {c.site ? (
        <ul className="mt-1 space-y-0.5 text-xs text-slate-300">
          <li>Lignes : {lignes(c.site.lignes)}.</li>
          <li>
            Avant audit : de {pourCent(c.site.remiseEnRoute.min)} à {pourCent(c.site.remiseEnRoute.max)} des lignes
            repartent, chacune pour {formatEuro(c.site.remiseEnEtatParLigne.min)} à{" "}
            {formatEuro(c.site.remiseEnEtatParLigne.max)} de remise en état ; un passif environnemental de{" "}
            {formatEuro(c.site.passifEnvironnemental.montant)} possible ({pourCent(c.site.passifEnvironnemental.probabilite)}).
          </li>
          <li>
            Mise en route : la moitié des lignes {c.site.delai} tour{c.site.delai > 1 ? "s" : ""} après le rachat, le reste
            au tour suivant. Charges du site : {formatEuro(c.site.chargesParTour)} par tour. Audit :{" "}
            {formatEuro(c.site.coutDeLAudit)}.
          </li>
          {c.audit ? (
            <li className="text-[var(--donnee)]" data-audit-du-site="">
              Audit : {c.audit.lignesRemisesEnRoute} ligne{c.audit.lignesRemisesEnRoute > 1 ? "s" : ""} repartent (
              {lignes(c.audit.lignes)}), {c.audit.lignesPerdues} perdue{c.audit.lignesPerdues > 1 ? "s" : ""} ;
              remise en état {formatEuro(c.audit.remiseEnEtat)} ;{" "}
              {c.audit.passifEnvironnemental > 0
                ? `passif environnemental ${formatEuro(c.audit.passifEnvironnemental)}`
                : "aucun passif environnemental"}
              .
            </li>
          ) : null}
        </ul>
      ) : null}
      {c.fournisseur ? (
        <p className="mt-1 text-xs text-slate-300">
          Capacité : {formatUnits(c.fournisseur.capacite)} unités par tour.
          {c.fournisseur.dernierChiffreDAffaires !== null
            ? ` Chiffre d'affaires du dernier tour : ${formatEuro(c.fournisseur.dernierChiffreDAffaires)}.`
            : ""}
        </p>
      ) : null}
      {c.etranger ? (
        <p className="mt-1 text-xs text-slate-300">
          {c.etranger.pays}, comptes en {c.etranger.devise} (1 {c.etranger.devise} = {nombreFr(c.etranger.cours, 4)} € à la
          dernière clôture).
          {c.etranger.prixDesParts.length > 0
            ? ` Parts proposées : ${c.etranger.prixDesParts.map((p) => `${pourCent(p.part)} pour ${formatEuro(p.prix)}`).join(", ")}.`
            : ""}
          {c.etranger.reseau ? " Un réseau de distribution." : ""}
          {c.etranger.fabrication ? " Une usine." : ""}
        </p>
      ) : null}
      {c.derniereOffre && c.derniereOffre.statut === "refuse" && c.derniereOffre.motif ? (
        <p className="mt-1 text-xs text-red-300">
          Votre offre du tour {c.derniereOffre.tour} : {c.derniereOffre.motif}
        </p>
      ) : null}
    </div>
  );
}

/** Ce que la feuille lit de l'offre en cours de saisie. */
interface OffreLue {
  cible: string;
  paiement: "numeraire" | "titres";
  prixMaximum: number;
  emprunt: number;
  augmentation: number;
  part: number | undefined;
}

function lireLOffre(racine: HTMLElement | null): OffreLue {
  const champ = (nom: string) =>
    racine?.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${nom}"]`) ?? null;
  const n = (nom: string) => {
    const t = String(champ(nom)?.value ?? "").trim().replace(",", ".");
    return t === "" ? NaN : Number(t);
  };
  const titres = racine?.querySelector<HTMLInputElement>('input[name="rachatPaiement"][value="titres"]')?.checked;
  const part = n("rachatPart");
  return {
    cible: String(champ("rachatCible")?.value ?? ""),
    paiement: titres ? "titres" : "numeraire",
    prixMaximum: n("rachatPrixMaximum"),
    emprunt: n("rachatEmprunt"),
    augmentation: n("rachatAugmentation"),
    part: Number.isFinite(part) ? part : undefined,
  };
}

/** Ce que le repli de la croissance externe annonce. */
export function quoiDeLaCroissance(d: FormData, vue: VueDuGroupe): string {
  const cible = cibleLue(d.get("rachatCible"));
  const audit = cibleLue(d.get("diligence"));
  const nom = (c: { type: string; id: string }) => vue.cibles.find((x) => x.type === c.type && x.id === c.id)?.nom ?? c.id;
  const parties = [cible ? `rachat de ${nom(cible)}` : null, audit ? `audit de ${nom(audit)}` : null].filter(Boolean);
  return parties.length > 0 ? parties.join(", ") : "Aucune opération";
}

export function CroissanceExterne({
  vue,
  defaults,
  alreadySubmitted,
  kind,
  typesDeLignes,
  erreurs,
}: {
  vue: VueDuGroupe;
  defaults: RoundDecisions;
  alreadySubmitted: boolean;
  kind: "solo" | "class";
  typesDeLignes: readonly { code: string; name: string }[];
  erreurs: Erreurs;
}) {
  const racine = useRef<HTMLDivElement>(null);
  // Rien de choisi d'office : seul un envoi déjà enregistré ce tour revient.
  const envoye = alreadySubmitted ? defaults.rachat : undefined;
  const auditEnvoye = alreadySubmitted ? defaults.diligence : undefined;
  const [offre, setOffre] = useState<OffreLue>(() => ({
    cible: envoye ? valeurDeCible(envoye.cible) : "",
    paiement: envoye?.paiement ?? "numeraire",
    prixMaximum: envoye?.prixMaximum ?? NaN,
    emprunt: envoye?.emprunt ?? NaN,
    augmentation: envoye?.augmentationDeCapital ?? NaN,
    part: envoye?.part,
  }));
  const relire = () => setOffre(lireLOffre(racine.current));
  // Le brouillon du navigateur restaure les champs après le montage, sans événement.
  useEffect(() => {
    const t = setTimeout(relire, 0);
    return () => clearTimeout(t);
  }, []);
  // Une autre cible (ou une autre part) remonte le montage, prix maximum
  // prérempli compris : on le relit une fois posé, sans attendre une frappe.
  useEffect(() => {
    const t = setTimeout(relire, 0);
    return () => clearTimeout(t);
  }, [offre.cible, offre.part]);

  const o = vue.ouverture;
  const regles = vue.regles;
  if (!regles || !o) return null;
  const disponibles = vue.cibles.filter((c) => c.statut === "disponible");
  const auditables = disponibles.filter((c) => c.type === "site_ferme" && !c.audit);
  const choisie = vue.cibles.find((c) => valeurDeCible(c) === offre.cible) ?? null;
  const parts = choisie?.etranger?.prixDesParts ?? [];
  const partRetenue = choisie?.type === "etranger" ? (offre.part ?? parts[parts.length - 1]?.part ?? 1) : undefined;
  const prixDemande = choisie ? prixDeLaCible(choisie, partRetenue) : null;
  const eligibilite = choisie
    ? eligibiliteDuRachat(vue, {
        cible: { type: choisie.type, id: choisie.id },
        paiement: offre.paiement,
        prixMaximum: offre.prixMaximum,
        ...(Number.isFinite(offre.emprunt) ? { emprunt: offre.emprunt } : {}),
        ...(Number.isFinite(offre.augmentation) ? { augmentationDeCapital: offre.augmentation } : {}),
        ...(partRetenue !== undefined ? { part: partRetenue } : {}),
      })
    : null;
  const titresOuverts = o.tour >= regles.tourMinTitres;
  const parType = (["site_ferme", "fournisseur", "etranger"] as const)
    .map((t) => ({ t, cibles: vue.cibles.filter((c) => c.type === t) }))
    .filter((x) => x.cibles.length > 0);

  return (
    <div ref={racine} className="space-y-3" data-croissance-externe="" onChange={relire} onInput={relire}>
      <p className="text-sm leading-relaxed text-slate-400" data-regles-du-rachat="">
        {o.tour < regles.tourMin
          ? `Les rachats s'ouvrent au tour ${regles.tourMin} ; un audit se fait dès maintenant.`
          : `Un rachat par tour, conclu au jour 1. Frais de transaction : ${pourCent(regles.fraisDeTransaction)} du prix.`}{" "}
        Le paiement en actions s&apos;ouvre au tour {regles.tourMinTitres}, quand la valeur de vos actions reflète des
        résultats réels. Valeur d&apos;ouverture de votre action : {formatEuroCents(o.valeurParAction)}.
      </p>

      {parType.map(({ t, cibles }) => (
        <div key={t} className="space-y-1.5">
          <p className="surtitre">{NOMS_DES_TYPES[t]}</p>
          {cibles.map((c) => (
            <FicheDeCible key={valeurDeCible(c)} c={c} typesDeLignes={typesDeLignes} />
          ))}
        </div>
      ))}

      {auditables.length > 0 || auditEnvoye ? (
        <div>
          <label className="block">
            <span className="libelle block font-semibold leading-4 text-slate-300">Auditer un site ce tour</span>
            <select
              name="diligence"
              id={idDuChamp("diligence")}
              {...attributsDeRefus("diligence", erreurs)}
              defaultValue={auditEnvoye ? valeurDeCible(auditEnvoye) : ""}
              className="mt-1 w-full champ px-3 py-2 text-sm text-slate-50"
            >
              <option value="">Aucun audit</option>
              {auditables.map((c) => (
                <option key={c.id} value={valeurDeCible(c)}>
                  {c.nom} ({formatEuro(c.site!.coutDeLAudit)})
                </option>
              ))}
            </select>
          </label>
          <span className="mt-1 block text-sm text-slate-400">
            L&apos;audit révèle l&apos;état réel du site au résultat du tour, pour décider en connaissance de cause au
            suivant.
          </span>
          <MessageDeRefus nom="diligence" erreurs={erreurs} />
        </div>
      ) : null}

      <div>
        <label className="block">
          <span className="libelle block font-semibold leading-4 text-slate-300">Racheter ce tour</span>
          <select
            name="rachatCible"
            id={idDuChamp("rachatCible")}
            {...attributsDeRefus("rachatCible", erreurs)}
            defaultValue={envoye ? valeurDeCible(envoye.cible) : ""}
            className="mt-1 w-full champ px-3 py-2 text-sm text-slate-50"
          >
            <option value="">Aucun rachat</option>
            {disponibles.map((c) => (
              <option key={valeurDeCible(c)} value={valeurDeCible(c)}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>
        <MessageDeRefus nom="rachatCible" erreurs={erreurs} />
      </div>

      {choisie ? (
        <div className="panneau-info space-y-3 rounded-xl px-3 py-3" data-montage-du-rachat="">
          {choisie.type === "etranger" && parts.length > 0 ? (
            <div>
              <label className="block">
                <span className="libelle block font-semibold leading-4 text-slate-300">Part achetée</span>
                <select
                  name="rachatPart"
                  id={idDuChamp("rachatPart")}
                  {...attributsDeRefus("rachatPart", erreurs)}
                  defaultValue={String(partRetenue ?? 1)}
                  className="mt-1 w-full champ px-3 py-2 text-sm text-slate-50"
                >
                  {parts.map((p) => (
                    <option key={p.part} value={String(p.part)}>
                      {pourCent(p.part)} pour {formatEuro(p.prix)}
                    </option>
                  ))}
                </select>
              </label>
              <span className="mt-1 block text-sm text-slate-400">
                Au-delà de la moitié, vous la contrôlez : elle est consolidée, et la part des autres associés se lit en
                intérêts minoritaires.
              </span>
              <MessageDeRefus nom="rachatPart" erreurs={erreurs} />
            </div>
          ) : null}

          <fieldset>
            <legend className="libelle block font-semibold leading-4 text-slate-300">Paiement</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              <label className="flex items-start gap-2 rounded-xl border border-white/10 px-3 py-2 has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10">
                <input
                  type="radio"
                  name="rachatPaiement"
                  value="numeraire"
                  defaultChecked={(envoye?.paiement ?? "numeraire") === "numeraire"}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                />
                <span className="text-sm text-slate-200">En numéraire : trésorerie, emprunt, investisseurs entrants</span>
              </label>
              <label
                className={`flex items-start gap-2 rounded-xl border border-white/10 px-3 py-2 has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10 ${
                  choisie.type === "site_ferme" || !titresOuverts ? "opacity-60" : ""
                }`}
              >
                <input
                  type="radio"
                  name="rachatPaiement"
                  value="titres"
                  defaultChecked={envoye?.paiement === "titres"}
                  disabled={choisie.type === "site_ferme" || !titresOuverts}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                />
                <span className="text-sm text-slate-200">
                  En actions (fusion)
                  <span className="mt-0.5 block text-xs text-slate-400" data-motif-des-titres="">
                    {choisie.type === "site_ferme"
                      ? "Un liquidateur ne prend pas d'actions : un site se paie en numéraire."
                      : !titresOuverts
                        ? `Fermé avant le tour ${regles.tourMinTitres} : la valeur de vos actions ne reflète pas encore de résultats réels.`
                        : "Les vendeurs reçoivent des actions nouvelles, à la valeur d'ouverture des vôtres."}
                  </span>
                </span>
              </label>
            </div>
            <MessageDeRefus nom="rachatPaiement" erreurs={erreurs} />
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-3">
            <ChampNombre
              key={`max-${offre.cible}-${partRetenue ?? 1}`}
              name="rachatPrixMaximum"
              label="Prix maximum"
              defaultValue={
                envoye && valeurDeCible(envoye.cible) === offre.cible
                  ? envoye.prixMaximum
                  : prixDemande !== null
                    ? Math.ceil(prixDemande)
                    : ""
              }
              suffixe="€"
              erreurs={erreurs}
              requis
              aide={prixDemande !== null ? `Le vendeur demande ${formatEuro(prixDemande)}.` : undefined}
            />
            {offre.paiement === "numeraire" ? (
              <>
                <ChampNombre
                  name="rachatEmprunt"
                  label="Emprunt d'acquisition"
                  defaultValue={envoye?.emprunt ?? ""}
                  suffixe="€"
                  erreurs={erreurs}
                />
                <ChampNombre
                  name="rachatAugmentation"
                  label="Apport d'investisseurs entrants"
                  defaultValue={envoye?.augmentationDeCapital ?? ""}
                  suffixe="€"
                  erreurs={erreurs}
                  aide={`Leurs actions s'émettent à la clôture, avec une décote de ${pourCent(regles.decoteDEmission)}.`}
                />
              </>
            ) : null}
          </div>

          {eligibilite ? (
            <div
              className={`rounded-xl border px-3 py-2 ${eligibilite.motif ? "border-red-400/40" : "border-emerald-400/40"}`}
              data-eligibilite-du-rachat={eligibilite.motif ? "refusee" : "recevable"}
              aria-live="polite"
            >
              <p className={`text-sm font-semibold ${eligibilite.motif ? "text-red-300" : "text-emerald-300"}`}>
                {eligibilite.motif ? `Le moteur refuserait cette offre : ${eligibilite.motif}` : "Offre recevable."}
              </p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {eligibilite.criteres.map((k) => (
                  <li key={k.cle} className={k.ok ? "text-slate-300" : "text-red-300"} data-critere={k.cle}>
                    <span aria-hidden>{k.ok ? "✓ " : "✗ "}</span>
                    {k.libelle} : {k.detail}
                  </li>
                ))}
              </ul>
              {kind === "class" ? (
                <p className="mt-1 text-xs text-slate-400">
                  En classe, si une autre équipe vise la même cible, la plus haute offre l&apos;emporte au prix demandé ;
                  à égalité, le vendeur ne cède à personne.
                </p>
              ) : null}
            </div>
          ) : null}

          {choisie.type === "site_ferme" ? (
            <p className="encadre-neutre flex items-start gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-100" data-rappel-du-plan="">
              <Icone nom="alerte" className="mt-0.5 h-4 w-4 shrink-0" />
              Pensez à relever votre plan de production pour faire tourner la capacité reprise, et à embaucher les
              opérateurs qu&apos;elle demande.
            </p>
          ) : null}
        </div>
      ) : null}
      <Aide>
        <p className="text-sm leading-relaxed text-slate-400">
          Un rachat crée de la valeur s&apos;il rapporte plus qu&apos;il ne coûte : prix, frais, remise en état,
          intérêts de l&apos;emprunt et dilution comprise. Un site reprend des machines, pas des clients : sans plan de
          production relevé, sa capacité dort et ses charges courent.
        </p>
      </Aide>
    </div>
  );
}
