import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import {
  CHARGES_DE_GESTION,
  CLES_DES_CHARGES,
  JEUX_REVENUS_SANS_BON,
  REMUNERATION_DE_LA_GERANTE,
  VARIANTE_DE_DECEMBRE,
  decembreDeGestion,
  seuilDuSousProduit,
  varianteDeDecembre,
  type ChargeDeGestion,
} from "../monde/comptabilite-de-gestion";
import { prestationsReciproques } from "../monde/couts-et-budgets";
import { GESTION_DU_COURS, type CentreAuxiliaire, type CentrePrincipal, type CodeDeCentre, type FicheDeGestion } from "../monde/nova-gestion";
import type { MethodeDeStock } from "../monde/stock";
import type { Chapitre, TableauDeDonnees } from "../types";
import { auCentime } from "../monde/amortissement";

/**
 * CHAPITRE : LE COÛT COMPLET PAS À PAS (contrôle de gestion, palier 4 ; BTS CG, DCG UE11, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : décembre N chez NOVA, le mois de la fiche de stock des
 * composants (monde/exercice-de-nova.ts), avec les centres d'analyse et les clés de janvier
 * (monde/nova-gestion.ts) et les choix de la comptabilité de gestion (monde/comptabilite-de-gestion.ts :
 * l'assurance, le travail du président, le bon de sortie du 24 décembre, la variante). Le modèle
 * calcule tout : `decembreDeGestion`, `varianteDeDecembre`, `seuilDuSousProduit`.
 *
 * L'objet : refaire, tableau après tableau, tout le chemin d'un coût complet avec un stock, comme à
 * l'examen. Le tableau de répartition en entier (primaire, prestations réciproques, secondaire,
 * nature et nombre des unités d'œuvre, leur coût), le coût d'achat des matières entrées, la fiche de
 * stock au coût moyen pondéré, le coût de production, le coût de revient et le résultat analytique ;
 * puis une variante où la fabrication laisse des restes (rebuts, déchets vendables, déchets à
 * évacuer, un sous-produit), jusqu'au résultat de chaque produit. Un curseur cherche le volume qui
 * rend le sous-produit rentable ; un laboratoire fait voir ce que la méthode de valorisation des
 * stocks change au résultat quand les prix montent.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui du DCG) :
 *   · guidé : repartition-primaire (les clés au tableau), prestations-reciproques (le système est
 *     dans la question), unites-d-oeuvre (la nature est donnée) ;
 *   · l'expérience avant la formule : les-rebuts (un pari) avant la variante, le-pari-de-la-methode
 *     puis le laboratoire du stock ; le-seuil-des-grilles (un curseur) avant de déduire le sous-produit ;
 *   · autonome : repartition-secondaire, cout-d-achat, fiche-de-stock, cout-de-production,
 *     cout-de-revient, variante-de-decembre, resultat-par-produit : des tableaux à compléter, sans
 *     formule ; le calcul de chaque case se lit une fois le tableau rempli.
 */

/** Le coût complet pas à pas se calcule sur le mois de décembre de NOVA. */
export const ENTREPRISES_DU_COUT_COMPLET_PAS_A_PAS: readonly string[] = ["nova"];

/** Les bornes du curseur des grilles grises vendues dans le mois. */
export const GRILLES_DU_CURSEUR = { min: 0, max: 1_500 } as const;

/** Les méthodes du levier à choix du laboratoire, et les prix du grossiste qu'il essaie. */
export const METHODES_DU_LABORATOIRE: readonly { valeur: number; methode: MethodeDeStock; libelle: string }[] = [
  { valeur: 0, methode: "cmup-periode", libelle: "Coût moyen de la période" },
  { valeur: 1, methode: "cmup-apres-chaque-entree", libelle: "Coût moyen après chaque entrée" },
  { valeur: 2, methode: "peps", libelle: "Premier entré, premier sorti" },
];
export const PRIX_DU_GROSSISTE = { min: 22, max: 25, pas: 0.5 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t * 100, 0)} %`;

const CENTRES: readonly CodeDeCentre[] = ["entretien", "administration", "approvisionnement", "production", "distribution"];
const PRINCIPAUX: readonly CentrePrincipal[] = ["approvisionnement", "production", "distribution"];
const AUXILIAIRES: readonly CentreAuxiliaire[] = ["entretien", "administration"];
const LIBELLES_DES_CENTRES: Readonly<Record<CodeDeCentre, string>> = {
  entretien: "Entretien",
  administration: "Administration",
  approvisionnement: "Approvisionnement",
  production: "Production",
  distribution: "Distribution",
};
export const LIBELLES_DES_CHARGES: Readonly<Record<ChargeDeGestion, string>> = {
  loyer: "Loyer",
  personnel: "Personnel",
  amortissement: "Usure de la ligne",
  assurance: "Assurance",
  gerante: "Travail du président",
};

const donnee = (valeur: number, unite?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}) });
const texte = (t: string): CelluleACompleter => ({ valeur: null, texte: t });
const VIDE: CelluleACompleter = { valeur: null };
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** Décembre et tout ce que le chapitre en demande, calculés une fois sur le modèle. */
export function coutCompletDeDecembre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const d = decembreDeGestion();
  const r = d.repartition;
  const s = d.stock!;
  const v = varianteDeDecembre();
  const e = f.centres.secondaire.administration.entretien;
  const a = f.centres.secondaire.entretien.administration;
  const sortie24 = s.lignesDeSortie.find((x) => x.jour === 24)!;
  const sortie15 = s.lignesDeSortie.find((x) => x.jour === 15)!;
  const lot10 = d.lots.find((x) => x.jour === 10)!;
  const lot18 = d.lots.find((x) => x.jour === 18)!;
  return { f, d, r, s, v, e, a, sortie15, sortie24, lot10, lot18, seuil: seuilDuSousProduit() };
}

export type CoutCompletDeDecembre = ReturnType<typeof coutCompletDeDecembre>;

/** Le laboratoire : décembre avec une méthode de stock et un prix du grossiste. */
export function laboratoireDuStock(valeurDeLaMethode: number, prixDuGrossiste: number) {
  const m = METHODES_DU_LABORATOIRE.find((x) => x.valeur === valeurDeLaMethode)!;
  const d = decembreDeGestion({ methode: m.methode, prixDuGrossiste });
  return { methode: m, matieres: d.matieres, stockFinal: d.stock!.final.valeur, unitaire: auCentime(d.coutDeRevientUnitaire), resultat: d.resultat };
}

/** La méthode qui laisse le meilleur résultat à un prix du grossiste donné. */
export const meilleureMethode = (prixDuGrossiste: number) =>
  METHODES_DU_LABORATOIRE.map((m) => laboratoireDuStock(m.valeur, prixDuGrossiste)).reduce((x, y) => (y.resultat > x.resultat ? y : x)).methode;

/** Le mois de décembre : le document du chapitre. */
function tableauDuMois(x: CoutCompletDeDecembre): TableauDeDonnees {
  const { f, d, lot10, lot18, sortie15, sortie24, r } = x;
  return {
    titre: `Le mois de décembre de ${f.entreprise}`,
    colonnes: ["Donnée"],
    lignes: [
      { libelle: "Enceintes fabriquées et livrées", valeurs: [qte(d.livrees)] },
      { libelle: "Prix de vente d'une enceinte, hors taxes", valeurs: [eur(f.moisDeReference.prix)] },
      { libelle: "Chiffre d'affaires du mois", valeurs: [eur(d.chiffreDAffaires)] },
      { libelle: `Livraison du 10 décembre (${lot10.libelle.replace(/^livraison d['e] ?/, "")})`, valeurs: [`${qte(lot10.quantite)} jeux à ${eur(lot10.prix)}`] },
      { libelle: `Livraison du 18 décembre (${lot18.libelle.replace(/^livraison d['e] ?/, "")})`, valeurs: [`${qte(lot18.quantite)} jeux à ${eur(lot18.prix)}`] },
      { libelle: "Bon de sortie du 15 décembre", valeurs: [`${qte(sortie15.quantite)} jeux`] },
      { libelle: "Bon de sortie du 24 décembre", valeurs: [`${qte(sortie24.quantite)} jeux`] },
      { libelle: `Autres charges directes d'une enceinte (${f.moisDeReference.autresCoutsVariables})`, valeurs: [eur(f.moisDeReference.coutVariable.autres)] },
      ...CHARGES_DE_GESTION.map((k) => ({ libelle: `${LIBELLES_DES_CHARGES[k]}, du mois`, valeurs: [eur(r.charges[k])] })),
    ],
  };
}

/** Les clés de la répartition primaire, charge par charge. */
function tableauDesCles(x: CoutCompletDeDecembre): TableauDeDonnees {
  return {
    titre: "Les clés de la répartition primaire",
    colonnes: CENTRES.map((cc) => LIBELLES_DES_CENTRES[cc]),
    lignes: CHARGES_DE_GESTION.map((k) => ({ libelle: `${LIBELLES_DES_CHARGES[k]} (${eur(x.r.charges[k])})`, valeurs: CENTRES.map((cc) => pct(CLES_DES_CHARGES[k][cc])) })),
  };
}

/** Les clés de la répartition secondaire : ce que chaque centre auxiliaire cède. */
function tableauSecondaire(x: CoutCompletDeDecembre): TableauDeDonnees {
  const s = x.f.centres.secondaire;
  return {
    titre: "Les clés de la répartition secondaire",
    colonnes: CENTRES.map((cc) => LIBELLES_DES_CENTRES[cc]),
    lignes: AUXILIAIRES.map((au) => ({ libelle: `Ce que cède ${au === "entretien" ? "l'entretien" : "l'administration"}`, valeurs: CENTRES.map((cc) => pct(s[au][cc])) })),
  };
}

const COLONNES_DE_REPARTITION = ["Total", ...CENTRES.map((cc) => LIBELLES_DES_CENTRES[cc])];

/** La répartition primaire, à remplir : chaque charge entre les cinq centres, et leur total. */
function grillePrimaire(x: CoutCompletDeDecembre): TableauACompleter {
  const { r } = x;
  const lignes = CHARGES_DE_GESTION.map((k) => ({
    libelle: LIBELLES_DES_CHARGES[k],
    cellules: [
      donnee(r.charges[k]),
      ...CENTRES.map((cc) =>
        CLES_DES_CHARGES[k][cc] === 0
          ? donnee(0)
          : aSaisir(r.parCharge[k][cc], `${eur(r.charges[k])} × ${pct(CLES_DES_CHARGES[k][cc])} = ${eur(r.parCharge[k][cc])}`, { indice: "le montant de la charge multiplié par la clé du centre" }),
      ),
    ],
  }));
  return {
    titre: `La répartition primaire de décembre · ${x.f.entreprise}`,
    colonnes: COLONNES_DE_REPARTITION,
    colonneDeTotal: 0,
    lignes: [
      ...lignes,
      {
        libelle: "Total de la répartition primaire",
        fort: true,
        totalDe: { plus: CHARGES_DE_GESTION.map((_, i) => i) },
        cellules: [
          aSaisir(r.total, `${CHARGES_DE_GESTION.map((k) => eur(r.charges[k])).join(" + ")} = ${eur(r.total)}`),
          ...CENTRES.map((cc) => aSaisir(r.primaire[cc], `${CHARGES_DE_GESTION.map((k) => eur(r.parCharge[k][cc])).join(" + ")} = ${eur(r.primaire[cc])}`)),
        ],
      },
    ],
  };
}

/** La répartition secondaire, à remplir : les deux cessions, et le total de chaque centre. */
function grilleSecondaire(x: CoutCompletDeDecembre): TableauACompleter {
  const { r, f } = x;
  const s = f.centres.secondaire;
  const cession = (au: CentreAuxiliaire) => [
    donnee(0),
    ...CENTRES.map((cc) => {
      if (cc === au) return aSaisir(-r.auxiliaires[au], `${au === "entretien" ? "l'entretien" : "l'administration"} cède tout son total : −${eur(r.auxiliaires[au])}`, { indice: "le total du centre, qu'il cède en entier" });
      if (s[au][cc] === 0) return donnee(0);
      return aSaisir(r.cessions[au][cc], `${pct(s[au][cc])} × ${eur(r.auxiliaires[au])} = ${eur(r.cessions[au][cc])}`, { indice: "la clé du centre multipliée par le total du centre qui cède" });
    }),
  ];
  return {
    titre: `La répartition secondaire de décembre · ${f.entreprise}`,
    colonnes: COLONNES_DE_REPARTITION,
    colonneDeTotal: 0,
    lignes: [
      { libelle: "Répartition primaire", cellules: [donnee(r.total), ...CENTRES.map((cc) => donnee(r.primaire[cc]))] },
      { libelle: "Cession de l'entretien", cellules: cession("entretien") },
      { libelle: "Cession de l'administration", cellules: cession("administration") },
      {
        libelle: "Total après la répartition secondaire",
        fort: true,
        totalDe: { plus: [0, 1, 2] },
        cellules: [
          aSaisir(r.total, `les cessions ne créent ni ne retirent rien : ${eur(r.total)}`),
          ...CENTRES.map((cc) =>
            aSaisir(cc === "entretien" || cc === "administration" ? 0 : r.principaux[cc], `${eur(r.primaire[cc])} + ${eur(cc === "entretien" ? -r.auxiliaires.entretien : r.cessions.entretien[cc])} + ${eur(cc === "administration" ? -r.auxiliaires.administration : r.cessions.administration[cc])} = ${eur(cc === "entretien" || cc === "administration" ? 0 : r.principaux[cc])}`),
          ),
        ],
      },
    ],
  };
}

/** Les unités d'œuvre de décembre, à remplir : leur nombre et leur coût. */
function grilleDesUnites(x: CoutCompletDeDecembre): TableauACompleter {
  const { f, d, r } = x;
  const u = f.centres.unitesDOeuvre;
  const nombre = (p: CentrePrincipal) =>
    u[p].nature === "achats"
      ? `${eur(d.achats)} d'achats ÷ ${qte(u[p].assiette)} = ${qte(d.nombre[p])} unités`
      : u[p].nature === "chiffreDAffaires"
        ? `${eur(d.chiffreDAffaires)} ÷ ${qte(u[p].assiette)} = ${qte(d.nombre[p])} unités`
        : `${qte(d.livrees)} enceintes produites`;
  return {
    titre: `Les unités d'œuvre de décembre · ${f.entreprise}`,
    colonnes: PRINCIPAUX.map((p) => LIBELLES_DES_CENTRES[p]),
    lignes: [
      { libelle: "Total du centre", cellules: PRINCIPAUX.map((p) => donnee(r.principaux[p])) },
      { libelle: "Nature de l'unité d'œuvre", cellules: PRINCIPAUX.map((p) => texte(u[p].libelle)) },
      { libelle: "Nombre d'unités d'œuvre", cellules: PRINCIPAUX.map((p) => aSaisir(d.nombre[p], nombre(p), { unite: "UO", indice: "ce que le centre a fait dans le mois, mesuré dans son unité" })) },
      {
        libelle: "Coût de l'unité d'œuvre",
        cellules: PRINCIPAUX.map((p) => aSaisir(d.cout[p], `${eur(r.principaux[p])} ÷ ${qte(d.nombre[p])} = ${qte(r.principaux[p] / d.nombre[p], 4)} €, arrondi au centime : ${eur(d.cout[p])}`, { indice: "le total du centre divisé par son nombre d'unités d'œuvre, au centime" })),
      },
    ],
  };
}

/** Le coût d'achat des deux livraisons, à remplir. */
function grilleDuCoutDAchat(x: CoutCompletDeDecembre): TableauACompleter {
  const { d, lot10, lot18 } = x;
  const lots = [lot10, lot18];
  const uo = d.cout.approvisionnement;
  return {
    titre: "Le coût d'achat des jeux entrés en décembre",
    colonnes: ["Livraison du 10 décembre", "Livraison du 18 décembre", "Total"],
    colonneDeTotal: 2,
    lignes: [
      { libelle: "Jeux livrés", cellules: [...lots.map((l) => donnee(l.quantite, "jeux")), aSaisir(lot10.quantite + lot18.quantite, `${qte(lot10.quantite)} + ${qte(lot18.quantite)} = ${qte(lot10.quantite + lot18.quantite)} jeux`, { unite: "jeux" })] },
      { libelle: "Prix d'achat", cellules: [...lots.map((l) => aSaisir(l.achats, `${qte(l.quantite)} × ${eur(l.prix)} = ${eur(l.achats)}`, { indice: "les jeux livrés multipliés par leur prix" })), aSaisir(d.achats, `${eur(lot10.achats)} + ${eur(lot18.achats)} = ${eur(d.achats)}`)] },
      {
        libelle: "Centre approvisionnement imputé",
        cellules: [
          ...lots.map((l) => aSaisir(l.approvisionnement, `${qte(l.unites)} unités (${eur(l.achats)} ÷ 100) × ${eur(uo)} = ${eur(l.approvisionnement)}`, { indice: "les unités d'œuvre de la livraison multipliées par leur coût" })),
          aSaisir(d.imputees.approvisionnement, `${eur(lot10.approvisionnement)} + ${eur(lot18.approvisionnement)} = ${eur(d.imputees.approvisionnement)}`),
        ],
      },
      {
        libelle: "Coût d'achat",
        fort: true,
        totalDe: { plus: [1, 2] },
        cellules: [...lots.map((l) => aSaisir(l.coutDAchat, `${eur(l.achats)} + ${eur(l.approvisionnement)} = ${eur(l.coutDAchat)}`)), aSaisir(d.coutDAchat, `${eur(lot10.coutDAchat)} + ${eur(lot18.coutDAchat)} = ${eur(d.coutDAchat)}`)],
      },
      {
        libelle: "Coût d'achat d'un jeu",
        cellules: [...lots.map((l) => aSaisir(l.coutUnitaire, `${eur(l.coutDAchat)} ÷ ${qte(l.quantite)} = ${qte(l.coutUnitaire, 4)} €`, { indice: "le coût d'achat de la livraison divisé par ses jeux" })), VIDE],
      },
    ],
  };
}

/** La fiche de stock de décembre au coût moyen pondéré de la période, à remplir. */
function grilleDeLaFiche(x: CoutCompletDeDecembre): TableauACompleter {
  const { s, lot10, lot18, sortie15, sortie24 } = x;
  const cmup = s.cmup;
  const q = s.entrees.quantite;
  return {
    titre: "La fiche de stock des jeux de composants, décembre",
    colonnes: ["Quantité", "Coût unitaire", "Montant"],
    lignes: [
      { libelle: "Stock au 1er décembre", cellules: [donnee(s.fiche.initial.quantite, "jeux"), VIDE, donnee(s.fiche.initial.valeur)] },
      { libelle: "Entrée du 10 décembre", cellules: [donnee(lot10.quantite, "jeux"), donnee(lot10.coutUnitaire), donnee(lot10.coutDAchat)] },
      { libelle: "Entrée du 18 décembre", cellules: [donnee(lot18.quantite, "jeux"), donnee(lot18.coutUnitaire), donnee(lot18.coutDAchat)] },
      {
        libelle: "Total disponible",
        fort: true,
        totalDe: { plus: [0, 1, 2] },
        cellules: [
          aSaisir(q, `${qte(lot10.quantite)} + ${qte(lot18.quantite)} = ${qte(q)} jeux`, { unite: "jeux" }),
          aSaisir(cmup, `${eur(s.disponible)} ÷ ${qte(q)} = ${qte(s.disponible / q, 5)} €, arrondi au centime : ${eur(cmup)}`, { horsTotal: true, indice: "le montant disponible divisé par les jeux disponibles, au centime" }),
          aSaisir(s.disponible, `${eur(lot10.coutDAchat)} + ${eur(lot18.coutDAchat)} = ${eur(s.disponible)}`),
        ],
      },
      { libelle: "Sortie du 15 décembre", cellules: [donnee(sortie15.quantite, "jeux"), aSaisir(cmup, `le coût moyen de la période : ${eur(cmup)}`, { indice: "le coût moyen de la période" }), aSaisir(sortie15.valeur, `${qte(sortie15.quantite)} × ${eur(cmup)} = ${eur(sortie15.valeur)}`)] },
      { libelle: "Sortie du 24 décembre", cellules: [donnee(sortie24.quantite, "jeux"), aSaisir(cmup, `le coût moyen de la période : ${eur(cmup)}`, { indice: "le coût moyen de la période" }), aSaisir(sortie24.valeur, `${qte(sortie24.quantite)} × ${eur(cmup)} = ${eur(sortie24.valeur)}`)] },
      {
        libelle: "Total des sorties",
        fort: true,
        totalDe: { plus: [4, 5] },
        cellules: [aSaisir(s.quantiteSortie, `${qte(sortie15.quantite)} + ${qte(sortie24.quantite)} = ${qte(s.quantiteSortie)} jeux`, { unite: "jeux" }), VIDE, aSaisir(s.sorties, `${eur(sortie15.valeur)} + ${eur(sortie24.valeur)} = ${eur(s.sorties)}`)],
      },
      {
        libelle: "Écart d'arrondi du coût moyen",
        cellules: [VIDE, VIDE, aSaisir(s.arrondi, `${eur(s.disponible)} − ${eur(s.sorties)} − ${eur(s.final.valeur)} = ${eur(s.arrondi)} : ce que le coût arrondi laisse du disponible`, { indice: "le disponible moins les sorties et le stock final, chacun au coût arrondi" })],
      },
      {
        libelle: "Stock théorique au 31 décembre",
        fort: true,
        totalDe: { plus: [3], moins: [6, 7] },
        cellules: [
          aSaisir(s.final.quantite, `${qte(q)} − ${qte(s.quantiteSortie)} = ${qte(s.final.quantite)} jeux`, { unite: "jeux" }),
          aSaisir(cmup, `le coût moyen de la période : ${eur(cmup)}`, { horsTotal: true }),
          aSaisir(s.final.valeur, `${qte(s.final.quantite)} × ${eur(cmup)} = ${eur(s.final.valeur)}`),
        ],
      },
    ],
  };
}

/** Le coût de production de décembre, à remplir. */
function grilleDeProduction(x: CoutCompletDeDecembre): TableauACompleter {
  const { d, s, f } = x;
  const cv = f.moisDeReference.coutVariable.autres;
  return {
    titre: `Le coût de production de décembre · ${f.entreprise}`,
    colonnes: ["Quantité", "Coût unitaire", "Montant"],
    lignes: [
      { libelle: "Jeux de composants consommés", cellules: [donnee(s.quantiteSortie, "jeux"), donnee(s.cmup), aSaisir(d.matieres, `les sorties de la fiche de stock : ${eur(d.matieres)}`, { indice: "le total des sorties de la fiche de stock" })] },
      { libelle: "Autres charges directes", cellules: [donnee(d.livrees, "enceintes"), donnee(cv), aSaisir(d.autres, `${qte(d.livrees)} × ${eur(cv)} = ${eur(d.autres)}`)] },
      { libelle: "Centre production", cellules: [donnee(d.nombre.production, "UO"), donnee(d.cout.production), aSaisir(d.imputees.production, `${qte(d.nombre.production)} × ${eur(d.cout.production)} = ${eur(d.imputees.production)}`, { indice: "les unités d'œuvre du centre multipliées par leur coût arrondi" })] },
      {
        libelle: "Coût de production",
        fort: true,
        totalDe: { plus: [0, 1, 2] },
        cellules: [
          { ...donnee(d.livrees, "enceintes"), horsTotal: true },
          aSaisir(d.coutDeProductionUnitaire, `${eur(d.coutDeProduction)} ÷ ${qte(d.livrees)} = ${qte(d.coutDeProductionUnitaire, 4)} €`, { horsTotal: true, indice: "le coût de production divisé par les enceintes produites" }),
          aSaisir(d.coutDeProduction, `${eur(d.matieres)} + ${eur(d.autres)} + ${eur(d.imputees.production)} = ${eur(d.coutDeProduction)}`),
        ],
      },
    ],
  };
}

/** Le coût de revient et le résultat analytique de décembre, à remplir. */
function grilleDeRevient(x: CoutCompletDeDecembre): TableauACompleter {
  const { d, f } = x;
  const unitaire = (v: number) => v / d.livrees;
  return {
    titre: `Le coût de revient et le résultat de décembre · ${f.entreprise}`,
    colonnes: ["Quantité", "Coût unitaire", "Montant"],
    lignes: [
      { libelle: "Coût de production des enceintes livrées", cellules: [donnee(d.livrees, "enceintes"), donnee(d.coutDeProductionUnitaire), donnee(d.coutDeProduction)] },
      { libelle: "Centre distribution", cellules: [donnee(d.nombre.distribution, "UO"), donnee(d.cout.distribution), aSaisir(d.imputees.distribution, `${qte(d.nombre.distribution)} × ${eur(d.cout.distribution)} = ${eur(d.imputees.distribution)}`, { indice: "les unités d'œuvre du centre multipliées par leur coût arrondi" })] },
      {
        libelle: "Coût de revient",
        fort: true,
        totalDe: { plus: [0, 1] },
        cellules: [
          { ...donnee(d.livrees, "enceintes"), horsTotal: true },
          aSaisir(unitaire(d.coutDeRevient), `${eur(d.coutDeRevient)} ÷ ${qte(d.livrees)} = ${qte(unitaire(d.coutDeRevient), 4)} €`, { horsTotal: true, indice: "le coût de revient divisé par les enceintes livrées" }),
          aSaisir(d.coutDeRevient, `${eur(d.coutDeProduction)} + ${eur(d.imputees.distribution)} = ${eur(d.coutDeRevient)}`),
        ],
      },
      { libelle: "Chiffre d'affaires", cellules: [donnee(d.livrees, "enceintes"), donnee(f.moisDeReference.prix), aSaisir(d.chiffreDAffaires, `${qte(d.livrees)} × ${eur(f.moisDeReference.prix)} = ${eur(d.chiffreDAffaires)}`)] },
      {
        libelle: "Résultat analytique",
        fort: true,
        totalDe: { plus: [3], moins: [2] },
        cellules: [
          { ...donnee(d.livrees, "enceintes"), horsTotal: true },
          aSaisir(unitaire(d.resultat), `${eur(d.resultat)} ÷ ${qte(d.livrees)} = ${qte(unitaire(d.resultat), 4)} €`, { horsTotal: true, indice: "le résultat divisé par les enceintes livrées" }),
          aSaisir(d.resultat, `${eur(d.chiffreDAffaires)} − ${eur(d.coutDeRevient)} = ${eur(d.resultat)}`, { indice: "le chiffre d'affaires moins le coût de revient" }),
        ],
      },
    ],
  };
}

/** La variante : le coût de production des bonnes enceintes avec les rebuts, les déchets et le sous-produit. */
function grilleDeLaVariante(x: CoutCompletDeDecembre): TableauACompleter {
  const { v, s, d } = x;
  const V = VARIANTE_DE_DECEMBRE;
  return {
    titre: "La variante de décembre : le coût de production des bonnes enceintes",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Coût de production de décembre, sans la variante", cellules: [donnee(d.coutDeProduction)] },
      { libelle: "Composants des enceintes rebutées", cellules: [aSaisir(v.rebuts, `${qte(V.rebuts)} jeux × ${eur(s.cmup)} = ${eur(v.rebuts)} : les bonnes enceintes les portent`, { indice: "un jeu par enceinte rebutée, au coût moyen du mois" })] },
      { libelle: "Évacuation des déchets", cellules: [aSaisir(v.evacuation, `${qte(V.evacuation.bennes)} bennes × ${eur(V.evacuation.prixDeLaBenne)} = ${eur(v.evacuation)}, qui s'ajoutent`, { indice: "le prix des bennes, qui s'ajoute au coût" })] },
      { libelle: "Chutes de cuivre vendues", cellules: [aSaisir(-v.dechetsVendables, `${qte(V.dechetsVendables.kilos)} kg × ${eur(V.dechetsVendables.prixDuKilo)} = ${eur(v.dechetsVendables)}, qui se retranchent : −${eur(v.dechetsVendables)}`, { indice: "le prix des chutes, qui se retranche du coût" })] },
      { libelle: "Valeur de réalisation des grilles grises", cellules: [aSaisir(-v.valeurDeRealisation, `${eur(v.ventesDuSousProduit)} − ${eur(v.fraisDuSousProduit)} = ${eur(v.valeurDeRealisation)}, qui se retranchent : −${eur(v.valeurDeRealisation)}`, { indice: "le prix de vente des grilles moins leurs frais, qui se retranche du coût" })] },
      {
        libelle: "Coût de production des bonnes enceintes",
        fort: true,
        totalDe: { plus: [0, 1, 2, 3, 4] },
        cellules: [aSaisir(v.coutDeProduction, `${eur(d.coutDeProduction)} + ${eur(v.rebuts)} + ${eur(v.evacuation)} − ${eur(v.dechetsVendables)} − ${eur(v.valeurDeRealisation)} = ${eur(v.coutDeProduction)}`)],
      },
      { libelle: "Coût de production d'une bonne enceinte", cellules: [aSaisir(v.coutDeProductionUnitaire, `${eur(v.coutDeProduction)} ÷ ${qte(d.livrees)} = ${qte(v.coutDeProductionUnitaire, 4)} €`, { indice: "le coût de production des bonnes enceintes divisé par leur nombre" })] },
    ],
  };
}

/** Le résultat de chaque produit dans la variante : les enceintes et les grilles. */
function grilleParProduit(x: CoutCompletDeDecembre): TableauACompleter {
  const { v, d, f } = x;
  const total = (a: number, b: number) => auCentime(a + b);
  return {
    titre: "La variante de décembre : le résultat analytique de chaque produit",
    colonnes: ["NOVA One", "Grilles grises", "Total"],
    colonneDeTotal: 2,
    lignes: [
      {
        libelle: "Chiffre d'affaires",
        cellules: [
          aSaisir(d.chiffreDAffaires, `${qte(d.livrees)} × ${eur(f.moisDeReference.prix)} = ${eur(d.chiffreDAffaires)}`),
          aSaisir(v.ventesDuSousProduit, `${qte(v.grilles)} × ${eur(VARIANTE_DE_DECEMBRE.sousProduit.prix)} = ${eur(v.ventesDuSousProduit)}`),
          aSaisir(total(d.chiffreDAffaires, v.ventesDuSousProduit), `${eur(d.chiffreDAffaires)} + ${eur(v.ventesDuSousProduit)}`),
        ],
      },
      {
        libelle: "Coût de production",
        cellules: [
          aSaisir(v.coutDeProduction, `le coût des bonnes enceintes, variante comprise : ${eur(v.coutDeProduction)}`, { indice: "le coût de production des bonnes enceintes de la variante" }),
          aSaisir(v.valeurDeRealisation, `les grilles reprennent leur valeur de réalisation, ôtée des enceintes : ${eur(v.valeurDeRealisation)}`, { indice: "ce que le coût des enceintes a cédé aux grilles" }),
          aSaisir(total(v.coutDeProduction, v.valeurDeRealisation), `${eur(v.coutDeProduction)} + ${eur(v.valeurDeRealisation)}`),
        ],
      },
      {
        libelle: "Distribution et frais propres",
        cellules: [
          aSaisir(d.imputees.distribution, `le centre distribution, comme sans la variante : ${eur(d.imputees.distribution)}`),
          aSaisir(v.fraisDuSousProduit, `${qte(v.grilles)} × ${eur(VARIANTE_DE_DECEMBRE.sousProduit.fraisParGrille)} + ${eur(VARIANTE_DE_DECEMBRE.sousProduit.fraisDuMois)} = ${eur(v.fraisDuSousProduit)}`, { indice: "les frais de conditionnement et d'expédition, et ceux du mois" }),
          aSaisir(total(d.imputees.distribution, v.fraisDuSousProduit), `${eur(d.imputees.distribution)} + ${eur(v.fraisDuSousProduit)}`),
        ],
      },
      {
        libelle: "Coût de revient",
        fort: true,
        totalDe: { plus: [1, 2] },
        cellules: [
          aSaisir(v.coutDeRevient, `${eur(v.coutDeProduction)} + ${eur(d.imputees.distribution)} = ${eur(v.coutDeRevient)}`),
          aSaisir(v.sousProduit.cout, `${eur(v.valeurDeRealisation)} + ${eur(v.fraisDuSousProduit)} = ${eur(v.sousProduit.cout)}`),
          aSaisir(total(v.coutDeRevient, v.sousProduit.cout), `${eur(v.coutDeRevient)} + ${eur(v.sousProduit.cout)}`),
        ],
      },
      {
        libelle: "Résultat analytique",
        fort: true,
        totalDe: { plus: [0], moins: [3] },
        cellules: [
          aSaisir(v.resultat, `${eur(d.chiffreDAffaires)} − ${eur(v.coutDeRevient)} = ${eur(v.resultat)}`, { indice: "le chiffre d'affaires moins le coût de revient" }),
          aSaisir(v.sousProduit.resultat, `${eur(v.ventesDuSousProduit)} − ${eur(v.sousProduit.cout)} = ${eur(v.sousProduit.resultat)}`, { indice: "les ventes des grilles moins leur coût de revient" }),
          aSaisir(total(v.resultat, v.sousProduit.resultat), `${eur(v.resultat)} + ${eur(v.sousProduit.resultat)}`),
        ],
      },
    ],
  };
}

/** La chaîne de décembre, de la répartition au résultat : la synthèse. */
function tableauDeLaChaine(x: CoutCompletDeDecembre): TableauDeDonnees {
  const { d, s, v } = x;
  return {
    titre: `Décembre, de la répartition au résultat · ${x.f.entreprise}`,
    colonnes: ["Sans la variante", "Avec la variante"],
    lignes: [
      { libelle: "Coût moyen pondéré d'un jeu", valeurs: [eur(s.cmup), eur(s.cmup)] },
      { libelle: "Coût d'achat des jeux consommés", valeurs: [eur(d.matieres), eur(auCentime(d.matieres + v.rebuts))] },
      { libelle: "Coût de production", valeurs: [eur(d.coutDeProduction), eur(v.coutDeProduction)] },
      { libelle: "Coût de revient", valeurs: [eur(d.coutDeRevient), eur(v.coutDeRevient)] },
      { libelle: "Coût de revient d'une enceinte", valeurs: [eur(auCentime(d.coutDeRevientUnitaire)), eur(auCentime(v.coutDeRevient / d.livrees))] },
      { libelle: "Résultat analytique des enceintes", valeurs: [eur(d.resultat), eur(v.resultat)] },
    ],
  };
}

export const LE_COUT_COMPLET_PAS_A_PAS: Chapitre = {
  code: "le-cout-complet-pas-a-pas",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Le coût complet pas à pas",
  accroche:
    "Décembre chez NOVA, tableau après tableau : la répartition en entier, la fiche de stock au coût moyen pondéré, le coût de production et le résultat ; puis les rebuts, les déchets et un sous-produit.",
  objectifs: [
    "Dresser le tableau de répartition des charges indirectes, prestations réciproques comprises, jusqu'au coût des unités d'œuvre",
    "Tenir la fiche de stock des matières au coût moyen pondéré et calculer le coût d'achat des matières consommées",
    "Traiter les déchets, les rebuts et un sous-produit dans le coût de production",
    "Remonter la chaîne des coûts jusqu'au résultat analytique de chaque produit",
    "Mesurer ce que la méthode de valorisation des stocks change au coût et au résultat",
  ],
  libre: false,
  prerequis: ["cout-complet", "les-stocks"],
  entreprises: {
    codes: ENTREPRISES_DU_COUT_COMPLET_PAS_A_PAS,
    pourquoi:
      "le coût complet pas à pas se calcule ici sur le mois de décembre de NOVA, dans la simulation du cours, avec sa fiche de stock et ses centres d'analyse ; la méthode est celle que vous appliquerez à votre entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Décembre, tableau après tableau",
      notions: ["full_unit_cost", "weighted_average_cost"],
      tableau: (c) => tableauDuMois(coutCompletDeDecembre(c)),
      texte: (c) => {
        const { f, d, sortie24 } = coutCompletDeDecembre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, en décembre. « Coût complet et centres d'analyse » calculait janvier, un mois sans stock ; décembre en a un : ${f.entreprise} a reçu deux livraisons de composants à deux prix, et il lui reste des jeux au 31 décembre. Le coût des jeux consommés passe donc par une fiche de stock.`,
          `Les centres d'analyse, leurs clés et leurs unités d'œuvre sont ceux de janvier. Deux charges s'y ajoutent : l'assurance, souscrite en octobre, et le travail du président, qui ne se verse rien. La comptabilité de gestion le compte quand même, ${eur(REMUNERATION_DE_LA_GERANTE)} par mois, ce que coûterait un dirigeant salarié : c'est une charge supplétive, que « La concordance des résultats » reprendra.`,
          `Les sorties de la fiche suivent les bons du magasin : ${qte(sortie24.quantite)} jeux le 24 décembre. ${qte(d.livrees)} enceintes ont été fabriquées et livrées dans le mois. Chaque étape est un tableau à compléter : remplissez les cases, vérifiez, et chaque case fausse vous dira pourquoi.`,
        ];
      },
      repere: () =>
        "Répartition primaire, puis secondaire ; coût des unités d'œuvre ; coût d'achat des matières entrées ; fiche de stock et coût d'achat des matières consommées ; coût de production ; coût de revient ; résultat analytique.",
    },
    {
      id: "repartition-primaire",
      objectifs: [0],
      type: "a-completer",
      titre: "La répartition primaire",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauDesCles(coutCompletDeDecembre(c)),
      question: () =>
        "Répartissez chaque charge indirecte entre les cinq centres selon ses clés (tableau), puis faites les totaux : celui de chaque centre, et celui de la ligne, qui retrouve toutes les charges.",
      grille: (c) => grillePrimaire(coutCompletDeDecembre(c)),
      explication: (c) => {
        const { r } = coutCompletDeDecembre(c);
        return [
          `Les ${eur(r.total)} de charges indirectes sont tous rangés : la colonne du total le vérifie, ligne par ligne, et la dernière ligne, centre par centre. Le travail du président va pour ${pct(CLES_DES_CHARGES.gerante.administration)} à l'administration : il passera par les prestations réciproques, comme tout ce que porte un centre auxiliaire.`,
        ];
      },
    },
    {
      id: "prestations-reciproques",
      objectifs: [0],
      type: "montants",
      titre: "Les prestations réciproques",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauSecondaire(coutCompletDeDecembre(c)),
      question: (c) => {
        const { r, e, a } = coutCompletDeDecembre(c);
        return `L'entretien répartit ${eur(r.primaire.entretien)} plus ${pct(e)} du total de l'administration ; l'administration, ${eur(r.primaire.administration)} plus ${pct(a)} du total de l'entretien. Résolvez le système : le total de chaque centre auxiliaire.`;
      },
      champs: (c) => {
        const { r, e, a } = coutCompletDeDecembre(c);
        const E0 = r.primaire.entretien;
        const A0 = r.primaire.administration;
        return [
          {
            libelle: "Total de l'entretien",
            attendu: r.auxiliaires.entretien,
            calcul: `E = ${eur(E0)} + ${pct(e)} × A et A = ${eur(A0)} + ${pct(a)} × E, d'où E = (${eur(E0)} + ${pct(e)} × ${eur(A0)}) ÷ (1 − ${pct(e)} × ${pct(a)}) = ${qte(E0 + e * A0, 3)} € ÷ ${qte(1 - a * e)} = ${eur(r.auxiliaires.entretien)}`,
          },
          { libelle: "Total de l'administration", attendu: r.auxiliaires.administration, calcul: `A = ${eur(A0)} + ${pct(a)} × ${eur(r.auxiliaires.entretien)} = ${eur(r.auxiliaires.administration)}` },
        ];
      },
      explication: (c) => {
        const { r, f } = coutCompletDeDecembre(c);
        return [
          `En janvier, sans l'assurance ni le président, l'entretien répartissait ${eur(prestationsReciproques(f).entretien)} ; en décembre, ${eur(r.auxiliaires.entretien)}. L'assurance n'y est pour rien, elle ne touche pas les centres auxiliaires : c'est la part du président posée à l'administration qui revient en partie à l'entretien.`,
        ];
      },
    },
    {
      id: "repartition-secondaire",
      objectifs: [0],
      type: "a-completer",
      titre: "La répartition secondaire",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauSecondaire(coutCompletDeDecembre(c)),
      question: () =>
        "Chaque centre auxiliaire cède tout son total, selon ses clés : une cession négative dans sa propre colonne, positive chez les autres. Remplissez les deux cessions, puis le total de chaque centre après la répartition.",
      grille: (c) => grilleSecondaire(coutCompletDeDecembre(c)),
      explication: (c) => {
        const { r } = coutCompletDeDecembre(c);
        return [
          `Chaque ligne de cession fait zéro : ce qu'un centre cède, les autres le reçoivent. Les centres auxiliaires finissent vides, et les trois centres principaux portent les ${eur(r.total)} de charges indirectes.`,
        ];
      },
    },
    {
      id: "unites-d-oeuvre",
      objectifs: [0],
      type: "a-completer",
      titre: "Les unités d'œuvre",
      notions: ["full_unit_cost"],
      question: () =>
        "Chaque centre principal mesure son activité dans son unité d'œuvre (deuxième ligne). Comptez les unités d'œuvre de décembre, puis le coût de chacune, arrondi au centime.",
      grille: (c) => grilleDesUnites(coutCompletDeDecembre(c)),
      explication: (c) => {
        const { d } = coutCompletDeDecembre(c);
        return [
          `L'approvisionnement compte en euros d'achats, comme en janvier : un lot plus cher en porte une plus grande part. Ses ${qte(d.nombre.approvisionnement)} unités viennent des deux livraisons, et son coût va se partager entre elles.`,
          "Les coûts arrondis au centime n'imputeront pas exactement le total de chaque centre : l'écart, quelques euros, est une différence d'arrondi.",
        ];
      },
    },
    {
      id: "cout-d-achat",
      objectifs: [1],
      type: "a-completer",
      titre: "Le coût d'achat des jeux entrés",
      notions: ["full_unit_cost", "stock"],
      question: () =>
        "Les jeux entrent en stock à leur coût d'achat : leur prix et la part du centre approvisionnement, imputée à chaque livraison selon ses unités d'œuvre. Remplissez le coût d'achat de chaque livraison, et celui d'un jeu.",
      grille: (c) => grilleDuCoutDAchat(coutCompletDeDecembre(c)),
      explication: (c) => {
        const { lot10, lot18 } = coutCompletDeDecembre(c);
        return [
          `Un jeu du 10 décembre coûte ${eur(lot10.coutUnitaire)}, un jeu du 18 décembre, ${eur(lot18.coutUnitaire)} : les deux lots sont sur la même étagère, et la fiche de stock doit dire à quel coût ils en sortent.`,
        ];
      },
    },
    {
      id: "fiche-de-stock",
      objectifs: [1],
      type: "a-completer",
      titre: "La fiche de stock au coût moyen pondéré",
      notions: ["weighted_average_cost", "stock"],
      question: () =>
        "Tenez la fiche de stock au coût moyen unitaire pondéré de la période, arrondi au centime : toutes les sorties et le stock final partent à ce coût. Le coût arrondi laisse un petit écart : notez-le sur sa ligne.",
      grille: (c) => grilleDeLaFiche(coutCompletDeDecembre(c)),
      explication: (c) => {
        const { s } = coutCompletDeDecembre(c);
        return [
          `Le coût d'achat des jeux consommés est le total des sorties, ${eur(s.sorties)} ; ${qte(s.final.quantite)} jeux restent en stock pour ${eur(s.final.valeur)}. Les ${eur(s.arrondi)} d'écart ne sont ni dans les sorties ni dans le stock : ils viennent du coût moyen arrondi au centime.`,
        ];
      },
    },
    {
      id: "les-bons-de-sortie",
      objectifs: [1],
      type: "choix",
      titre: "Les jeux en trop sur la fiche",
      notions: ["stock"],
      question: (c) => {
        const { d, s } = coutCompletDeDecembre(c);
        return `La fiche sort ${qte(s.quantiteSortie)} jeux, et la ligne a fabriqué ${qte(d.livrees)} enceintes, d'un jeu chacune. Que fait le contrôleur de sa fiche ?`;
      },
      options: (c) => [
        {
          texte: "Il la garde : l'inventaire physique tranchera",
          juste: true,
          retour: `Oui. L'inventaire permanent suit les bons, et seul l'inventaire du 31 décembre dit ce qui reste vraiment. Si l'on trouve plus ou moins que les ${qte(coutCompletDeDecembre(c).s.final.quantite)} jeux attendus, c'est une différence d'inventaire : « La concordance des résultats » la retrouvera.`,
        },
        {
          texte: "Il corrige la sortie : une enceinte livrée, un jeu",
          juste: false,
          retour: `Non : sans bon de retour, rien ne dit où sont passés les ${qte(JEUX_REVENUS_SANS_BON)} jeux. On ne corrige pas une fiche à la main : on la compare à l'inventaire physique.`,
        },
        {
          texte: "Il compte les jeux en trop parmi les rebuts du mois",
          juste: false,
          retour: "Non : un rebut est une enceinte montée puis jetée, et aucune ne l'a été en décembre. Des jeux sortis sans être montés ne sont pas des rebuts.",
        },
      ],
    },
    {
      id: "cout-de-production",
      objectifs: [3],
      type: "a-completer",
      titre: "Le coût de production",
      notions: ["full_unit_cost"],
      question: () =>
        "Le coût de production réunit les jeux consommés (les sorties de la fiche), les autres charges directes et le centre production, imputé par ses unités d'œuvre. Remplissez-le, puis le coût de production d'une enceinte.",
      grille: (c) => grilleDeProduction(coutCompletDeDecembre(c)),
      explication: (c) => {
        const { d } = coutCompletDeDecembre(c);
        return [
          `Une enceinte de décembre a coûté ${eur(auCentime(d.coutDeProductionUnitaire))} à produire. Rien n'est resté en enceintes finies : ${qte(d.livrees)} produites, ${qte(d.livrees)} livrées, et le coût de production passe tout entier dans le coût de revient.`,
        ];
      },
    },
    {
      id: "cout-de-revient",
      objectifs: [3],
      type: "a-completer",
      titre: "Le coût de revient et le résultat",
      notions: ["full_unit_cost"],
      question: () =>
        "Ajoutez la distribution au coût de production : c'est le coût de revient. Puis le chiffre d'affaires du mois, et le résultat analytique, au total et par enceinte.",
      grille: (c) => grilleDeRevient(coutCompletDeDecembre(c)),
      explication: (c) => {
        const { d, f } = coutCompletDeDecembre(c);
        return [
          `Chaque enceinte de décembre revient à ${eur(auCentime(d.coutDeRevientUnitaire))} et se vend ${eur(f.moisDeReference.prix)} : décembre laisse ${eur(d.resultat)} de résultat analytique, travail du président compris.`,
        ];
      },
    },
    {
      id: "les-rebuts",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur les rebuts",
      notions: ["full_unit_cost"],
      question: () =>
        `Une variante, sur les chiffres de décembre : ${qte(VARIANTE_DE_DECEMBRE.rebuts)} enceintes échouent au test acoustique et partent au rebut, sans valeur. Avant de calculer, pariez : leurs jeux de composants…`,
      options: () => [
        { texte: "Restent dans le coût des bonnes enceintes", juste: true, retour: "Bon pari. Un rebut ne se vend pas : ce qu'il a consommé, les bonnes enceintes le portent, et leur coût monte d'autant. Le centre production, lui, garde ses charges, que les bonnes se partagent seules." },
        { texte: "Sortent du coût, puisqu'ils ne se vendent pas", juste: false, retour: "Non : ils ont été achetés et consommés. Les sortir du coût, ce serait faire comme si les rebuts n'avaient rien coûté ; ils coûtent, et ce sont les bonnes enceintes qui paient." },
        { texte: "Se retranchent du coût, comme des déchets vendus", juste: false, retour: "Non : un déchet vendu rapporte, et son prix diminue le coût. Un rebut sans valeur ne rapporte rien : il augmente le coût des bonnes." },
      ],
    },
    {
      id: "valeur-de-realisation",
      objectifs: [2],
      type: "montants",
      titre: "La valeur de réalisation du sous-produit",
      notions: ["full_unit_cost"],
      question: (c) => {
        const { v } = coutCompletDeDecembre(c);
        const sp = VARIANTE_DE_DECEMBRE.sousProduit;
        return `Chaque jeu livre deux grilles de façade ; ${coutCompletDeDecembre(c).f.entreprise} ne monte que la noire. Les ${qte(v.grilles)} grilles grises de la variante se vendent ${eur(sp.prix)} pièce, avec ${eur(sp.fraisParGrille)} de conditionnement et d'expédition par grille et ${eur(sp.fraisDuMois)} de frais dans le mois. Calculez leurs ventes, leurs frais propres, puis leur valeur de réalisation : le prix de vente moins ces frais.`;
      },
      champs: (c) => {
        const { v } = coutCompletDeDecembre(c);
        const sp = VARIANTE_DE_DECEMBRE.sousProduit;
        return [
          { libelle: "Ventes des grilles grises", attendu: v.ventesDuSousProduit, calcul: `${qte(v.grilles)} × ${eur(sp.prix)} = ${eur(v.ventesDuSousProduit)}` },
          { libelle: "Frais propres des grilles", attendu: v.fraisDuSousProduit, calcul: `${qte(v.grilles)} × ${eur(sp.fraisParGrille)} + ${eur(sp.fraisDuMois)} = ${eur(v.fraisDuSousProduit)}` },
          { libelle: "Valeur de réalisation des grilles", attendu: v.valeurDeRealisation, calcul: `${eur(v.ventesDuSousProduit)} − ${eur(v.fraisDuSousProduit)} = ${eur(v.valeurDeRealisation)}` },
        ];
      },
      explication: (c) => {
        const { v } = coutCompletDeDecembre(c);
        return [
          `Les grilles naissent de la fabrication des enceintes, sans coût propre jusqu'à la séparation : leur valeur de réalisation, ${eur(v.valeurDeRealisation)}, se retranche du coût de production des enceintes. Le sous-produit ne fait alors ni perte ni bénéfice : ce qu'il rapporte de plus que ses frais revient au produit principal.`,
        ];
      },
    },
    {
      id: "le-seuil-des-grilles",
      objectifs: [2],
      type: "curseur",
      titre: "Vendre les grilles, ou les évacuer",
      notions: ["full_unit_cost", "fixed_costs"],
      question: () => {
        const sp = VARIANTE_DE_DECEMBRE.sousProduit;
        return `Une grille vendue rapporte ${eur(sp.prix)} et n'a plus à être évacuée (${eur(sp.evacuationParGrille)} pièce) ; la vente coûte ${eur(sp.fraisParGrille)} par grille et ${eur(sp.fraisDuMois)} par mois, quel que soit le nombre. Faites varier les grilles vendues dans le mois : placez le curseur sur le plus petit nombre où la vente vaut mieux que l'évacuation, puis validez.`;
      },
      grandeur: () => ({ libelle: "Grilles grises vendues dans le mois", unite: "grilles" }),
      cible: () => ({ attendu: seuilDuSousProduit().grilles, min: GRILLES_DU_CURSEUR.min, max: GRILLES_DU_CURSEUR.max }),
      zones: ["Vendre les grilles vaut mieux", "Évacuer les grilles vaut mieux"],
      rates: () => ({
        dessous: "À cette position, les frais du mois l'emportent encore : évacuer les grilles coûterait moins que les vendre.",
        dessus: "Plus bas, la vente vaut encore mieux que l'évacuation : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le croisement",
      lecture: (_, q) => {
        const sp = VARIANTE_DE_DECEMBRE.sousProduit;
        return [
          { libelle: "Ventes des grilles", montant: auCentime(sp.prix * q) },
          { libelle: "Évacuation évitée", montant: auCentime(sp.evacuationParGrille * q) },
          { libelle: "Frais de la vente", montant: auCentime(sp.fraisDuMois + sp.fraisParGrille * q) },
          { libelle: "Ce que la vente rapporte de plus que l'évacuation", montant: auCentime((sp.prix + sp.evacuationParGrille - sp.fraisParGrille) * q - sp.fraisDuMois), fort: true },
        ];
      },
      droites: () => {
        const sp = VARIANTE_DE_DECEMBRE.sousProduit;
        return {
          produit: (q) => (sp.prix + sp.evacuationParGrille) * q,
          cout: (q) => sp.fraisDuMois + sp.fraisParGrille * q,
          libelles: ["Ce que la vente rapporte, évacuation évitée comprise", "Ce que la vente coûte"],
        };
      },
      explication: (c) => {
        const { v } = coutCompletDeDecembre(c);
        const s = seuilDuSousProduit();
        const sp = VARIANTE_DE_DECEMBRE.sousProduit;
        return [
          `Chaque grille vendue gagne ${eur(s.gainParGrille)} sur l'évacuation (${eur(sp.prix)} + ${eur(sp.evacuationParGrille)} − ${eur(sp.fraisParGrille)}) : il en faut ${qte(s.grilles)} pour couvrir les ${eur(sp.fraisDuMois)} du mois. Avec ${qte(v.grilles)} grilles par mois, ${coutCompletDeDecembre(c).f.entreprise} est bien au-dessus : le sous-produit vaut la peine d'être vendu.`,
        ];
      },
    },
    {
      id: "variante-de-decembre",
      objectifs: [2],
      type: "a-completer",
      titre: "Rebuts, déchets et sous-produit",
      notions: ["full_unit_cost"],
      question: () => {
        const V = VARIANTE_DE_DECEMBRE;
        return `Dans la variante, ${qte(V.rebuts)} enceintes partent au rebut (un jeu chacune, au coût moyen du mois), ${qte(V.evacuation.bennes)} bennes à ${eur(V.evacuation.prixDeLaBenne)} évacuent les cartons, les mousses et les rebuts, ${qte(V.dechetsVendables.kilos)} kg de chutes de cuivre se vendent ${eur(V.dechetsVendables.prixDuKilo)} le kilo, et les grilles grises se vendent. Remplissez le coût de production des bonnes enceintes, signes compris.`;
      },
      grille: (c) => grilleDeLaVariante(coutCompletDeDecembre(c)),
      explication: (c) => {
        const { v, d } = coutCompletDeDecembre(c);
        return [
          `Les rebuts et l'évacuation alourdissent le coût, les chutes et les grilles l'allègent : une bonne enceinte coûte ${eur(auCentime(v.coutDeProductionUnitaire))} à produire, contre ${eur(auCentime(d.coutDeProductionUnitaire))} sans la variante. Ce qui sort de la fabrication sans être le produit change son coût, dans un sens ou dans l'autre.`,
        ];
      },
    },
    {
      id: "resultat-par-produit",
      objectifs: [3],
      type: "a-completer",
      titre: "Le résultat de chaque produit",
      notions: ["full_unit_cost"],
      question: () =>
        "Dans la variante, la comptabilité de gestion suit deux produits : les enceintes et les grilles grises. Remplissez leur chiffre d'affaires, leur coût de production, leurs frais de distribution, leur coût de revient et leur résultat, et la colonne du total.",
      grille: (c) => grilleParProduit(coutCompletDeDecembre(c)),
      explication: (c) => {
        const { v, d } = coutCompletDeDecembre(c);
        return [
          `Les enceintes laissent ${eur(v.resultat)}, ${eur(auCentime(v.resultat - d.resultat))} de plus que sans la variante ; les grilles, ${eur(v.sousProduit.resultat)}. C'est la règle de la valeur de réalisation : le sous-produit ne garde aucun résultat, tout ce qu'il apporte va au produit principal.`,
        ];
      },
    },
    {
      id: "le-pari-de-la-methode",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur la méthode",
      notions: ["weighted_average_cost", "stock"],
      question: () =>
        `Supposez que le grossiste ait vendu ses jeux ${eur(PRIX_DU_GROSSISTE.max)} pièce. La méthode de valorisation du stock change-t-elle le résultat de décembre ? Pariez : la meilleure serait…`,
      options: () => {
        const voir = "Le laboratoire suivant fait essayer les trois méthodes.";
        return [
          { texte: "Le premier entré, premier sorti", juste: true, retour: `Bon pari : les jeux les moins chers sortent d'abord, les plus chers restent en stock. ${voir}` },
          { texte: "Le coût moyen, qui lisse les deux prix", juste: false, retour: `Pari à vérifier : lisser les prix fait sortir une part des jeux chers. ${voir}` },
          { texte: "Aucune : la méthode ne touche que le stock", juste: false, retour: `Pari à vérifier : ce que le stock garde, les sorties ne le coûtent pas. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-stock",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du stock",
      notions: ["weighted_average_cost", "stock"],
      question: () =>
        "Choisissez la méthode de valorisation du stock, et faites varier le prix d'un jeu chez le grossiste. Le tableau suit le coût des jeux consommés, le stock du 31 décembre, le coût de revient d'une enceinte et le résultat ; le graphique montre le résultat de chaque méthode selon le prix. Relevez le défi.",
      leviers: (c) => [
        {
          code: "methode",
          libelle: "Méthode de valorisation du stock",
          unite: "",
          min: 0,
          max: METHODES_DU_LABORATOIRE.length - 1,
          pas: 1,
          depart: 0,
          choix: METHODES_DU_LABORATOIRE.map((m) => ({ valeur: m.valeur, libelle: m.libelle })),
        },
        { code: "prix", libelle: "Prix d'un jeu chez le grossiste", unite: "€", min: PRIX_DU_GROSSISTE.min, max: PRIX_DU_GROSSISTE.max, pas: PRIX_DU_GROSSISTE.pas, depart: coutCompletDeDecembre(c).lot18.prix },
      ],
      lecture: (c, p) => {
        const depart = laboratoireDuStock(0, coutCompletDeDecembre(c).lot18.prix);
        const l = laboratoireDuStock(p.methode!, p.prix!);
        return [
          { libelle: "Coût d'achat des jeux consommés", montant: l.matieres, reference: depart.matieres },
          { libelle: "Stock théorique au 31 décembre", montant: l.stockFinal, reference: depart.stockFinal },
          { libelle: "Coût de revient d'une enceinte", montant: l.unitaire, reference: depart.unitaire },
          { libelle: "Résultat analytique de décembre", montant: l.resultat, reference: depart.resultat, effet: true, fort: true },
        ];
      },
      graphique: () => ({
        levier: "prix",
        courbes: METHODES_DU_LABORATOIRE.map((m) => ({ libelle: m.libelle, valeur: (p) => laboratoireDuStock(m.valeur, p.prix!).resultat })),
      }),
      defi: () => {
        const prix = PRIX_DU_GROSSISTE.max;
        const meilleure = meilleureMethode(prix);
        return {
          consigne: `Le grossiste vend ses jeux ${eur(prix)} : trouvez la méthode qui laisse à décembre son meilleur résultat analytique.`,
          atteint: (p) => p.prix === prix && p.methode === meilleure.valeur,
          indice: (p) => {
            const l = laboratoireDuStock(p.methode!, p.prix!);
            return p.prix !== prix
              ? `À ${eur(p.prix!)} le jeu, décembre laisse ${eur(l.resultat)}. Placez d'abord le prix du grossiste à ${eur(prix)}.`
              : `${l.methode.libelle} : décembre laisse ${eur(l.resultat)}. Essayez les autres méthodes : laquelle fait sortir d'abord les jeux les moins chers ?`;
          },
          solution: { methode: meilleure.valeur, prix },
        };
      },
      explication: (_, p) => {
        const resultats = METHODES_DU_LABORATOIRE.map((m) => laboratoireDuStock(m.valeur, p.prix!));
        const [periode, apres, peps] = resultats as [ReturnType<typeof laboratoireDuStock>, ReturnType<typeof laboratoireDuStock>, ReturnType<typeof laboratoireDuStock>];
        return [
          `À ${eur(p.prix!)} le jeu chez le grossiste, décembre laisse ${eur(peps.resultat)} au premier entré, premier sorti, ${eur(apres.resultat)} au coût moyen après chaque entrée, ${eur(periode.resultat)} au coût moyen de la période. Quand les prix montent, le premier entré, premier sorti consomme d'abord les jeux anciens, les moins chers, et garde en stock les plus chers : ${eur(peps.stockFinal)} au 31 décembre.`,
          "Le résultat de décembre monte, mais le stock en porte la contrepartie : ce que décembre n'a pas coûté, janvier le coûtera en consommant ce stock. Sur le graphique, les trois courbes partent presque du même point, quand les deux livraisons ont le même prix, et s'écartent à mesure que le grossiste est plus cher.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["full_unit_cost", "weighted_average_cost"],
      tableau: (c) => tableauDeLaChaine(coutCompletDeDecembre(c)),
      texte: (c) => {
        const { f, d, s } = coutCompletDeDecembre(c);
        return [
          `En décembre, une enceinte ${f.entreprise} revient à ${eur(auCentime(d.coutDeRevientUnitaire))} : les charges indirectes passées par cinq centres et les prestations réciproques, les jeux entrés à leur coût d'achat puis sortis au coût moyen pondéré de ${eur(s.cmup)}, le coût de production, puis la distribution.`,
          "Trois règles pour les restes de la fabrication. Un déchet vendu diminue le coût de production, un déchet à évacuer l'augmente, et un rebut sans valeur reste à la charge des bonnes unités. Un sous-produit se déduit pour sa valeur de réalisation, et ne garde aucun résultat.",
          "Au niveau de l'examen, vous savez dresser un tableau de répartition complet, tenir une fiche de stock au coût moyen pondéré, chiffrer le coût de production et le coût de revient, traiter déchets, rebuts et sous-produits, et dire ce que la méthode de valorisation change au résultat.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la méthode, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût de l'unité d'œuvre = total du centre ÷ nombre d'unités d'œuvre, au centime. Coût moyen pondéré = (stock initial + entrées, au coût d'achat) ÷ (quantités). Coût de production = matières consommées + autres charges directes + centre production + déchets à évacuer − déchets vendus − valeur de réalisation du sous-produit.",
    },
  ],
};
