import { compteDuPlan, intituleDe } from "./plan-comptable";

/**
 * DU JOURNAL AUX ÉTATS : LE GRAND LIVRE, LE COMPTE DE RÉSULTAT, LE BILAN.
 *
 * Tout part des écritures passées. Le solde d'un compte est son total débit
 * moins son total crédit ; les charges et les produits forment le compte de
 * résultat, les autres comptes le bilan, où le résultat vient s'ajouter aux
 * capitaux. Rien n'est saisi deux fois : si le journal est juste, le bilan
 * s'équilibre de lui-même, et c'est ce que le cours fait constater.
 */

export interface Ligne {
  compte: string;
  debit: number;
  credit: number;
}

export interface Ecriture {
  date: string;
  libelle: string;
  lignes: readonly Ligne[];
}

/** Au centime. */
export const auCentime = (x: number) => Math.round(x * 100) / 100;

export const totalDebit = (e: Pick<Ecriture, "lignes">) => auCentime(e.lignes.reduce((s, l) => s + l.debit, 0));
export const totalCredit = (e: Pick<Ecriture, "lignes">) => auCentime(e.lignes.reduce((s, l) => s + l.credit, 0));
export const equilibree = (e: Pick<Ecriture, "lignes">) => totalDebit(e) === totalCredit(e);

/** Le solde de chaque compte mouvementé : débit moins crédit. */
export function soldes(ecritures: readonly Pick<Ecriture, "lignes">[]): Record<string, number> {
  const s: Record<string, number> = {};
  for (const e of ecritures) {
    for (const l of e.lignes) s[l.compte] = auCentime((s[l.compte] ?? 0) + l.debit - l.credit);
  }
  return s;
}

/** Les mouvements d'un compte, pour le dessiner en T. */
export function mouvements(ecritures: readonly Ecriture[], compte: string) {
  return ecritures.flatMap((e) =>
    e.lignes.filter((l) => l.compte === compte).map((l) => ({ date: e.date, libelle: e.libelle, debit: l.debit, credit: l.credit })),
  );
}

export interface LigneDEtat {
  libelle: string;
  montant: number;
  comptes: string[];
}

export interface CompteDeResultat {
  charges: LigneDEtat[];
  produits: LigneDEtat[];
  totalCharges: number;
  totalProduits: number;
  resultat: number;
}

const nature = (compte: string) => compteDuPlan(compte)?.nature;

export function compteDeResultat(s: Record<string, number>): CompteDeResultat {
  const ligne = (c: string, montant: number): LigneDEtat => ({ libelle: intituleDe(c), montant, comptes: [c] });
  const charges = Object.keys(s)
    .filter((c) => nature(c) === "charge" && s[c] !== 0)
    .sort()
    .map((c) => ligne(c, s[c]!));
  const produits = Object.keys(s)
    .filter((c) => nature(c) === "produit" && s[c] !== 0)
    .sort()
    .map((c) => ligne(c, -s[c]!));
  const totalCharges = auCentime(charges.reduce((t, l) => t + l.montant, 0));
  const totalProduits = auCentime(produits.reduce((t, l) => t + l.montant, 0));
  return { charges, produits, totalCharges, totalProduits, resultat: auCentime(totalProduits - totalCharges) };
}

/** La TVA nette : collectée moins déductible. Positive, l'entreprise la doit ; négative, l'État la lui doit. */
export function tvaNette(s: Record<string, number>): number {
  return auCentime(-Object.entries(s).reduce((t, [c, v]) => (nature(c) === "tva" ? t + v : t), 0));
}

export interface Bilan {
  actif: LigneDEtat[];
  passif: LigneDEtat[];
  totalActif: number;
  totalPassif: number;
  resultat: number;
}

/**
 * Le bilan en grandes masses : ce que l'entreprise possède et ce qu'on lui doit (actif),
 * d'où viennent ses ressources (passif). Un compte de trésorerie débiteur est à l'actif,
 * créditeur au passif (un découvert) ; la TVA nette, selon son signe.
 */
export function bilan(s: Record<string, number>): Bilan {
  const somme = (filtre: (c: string) => boolean) => {
    const comptes = Object.keys(s).filter((c) => filtre(c) && s[c] !== 0).sort();
    return { comptes, montant: auCentime(comptes.reduce((t, c) => t + s[c]!, 0)) };
  };
  const actif: LigneDEtat[] = [];
  const passif: LigneDEtat[] = [];
  const poser = (cote: LigneDEtat[], libelle: string, m: { comptes: string[]; montant: number }, signe: 1 | -1) => {
    if (m.montant !== 0) cote.push({ libelle, montant: auCentime(signe * m.montant), comptes: m.comptes });
  };
  const resultat = compteDeResultat(s).resultat;

  poser(actif, "Immobilisations", somme((c) => c.startsWith("2")), 1);
  poser(actif, "Stocks", somme((c) => c.startsWith("3")), 1);
  poser(actif, "Clients", somme((c) => c.startsWith("411")), 1);
  poser(actif, "Avances au personnel", somme((c) => c.startsWith("425")), 1);
  const tva = tvaNette(s);
  const comptesTva = Object.keys(s).filter((c) => nature(c) === "tva" && s[c] !== 0).sort();
  if (tva < 0) actif.push({ libelle: "Créance de TVA sur l'État", montant: -tva, comptes: comptesTva });
  const tresorerie = somme((c) => nature(c) === "tresorerie");
  if (tresorerie.montant > 0) poser(actif, "Banque", tresorerie, 1);

  poser(passif, "Capital", somme((c) => c.startsWith("10")), -1);
  if (resultat !== 0) passif.push({ libelle: "Résultat de l'exercice", montant: resultat, comptes: [] });
  poser(passif, "Emprunts", somme((c) => c.startsWith("16")), -1);
  poser(passif, "Fournisseurs", somme((c) => c.startsWith("40")), -1);
  poser(passif, "Dettes sociales", somme((c) => (c.startsWith("42") || c.startsWith("43")) && nature(c) === "passif"), -1);
  poser(passif, "Dettes fiscales", somme((c) => c.startsWith("44") && nature(c) === "passif"), -1);
  if (tva > 0) passif.push({ libelle: "TVA due à l'État", montant: tva, comptes: comptesTva });
  if (tresorerie.montant < 0) poser(passif, "Découvert bancaire", tresorerie, -1);

  const total = (l: LigneDEtat[]) => auCentime(l.reduce((t, x) => t + x.montant, 0));
  return { actif, passif, totalActif: total(actif), totalPassif: total(passif), resultat };
}
