import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import {
  CENTRES_DE_RESPONSABILITE,
  LA_GO,
  MOIS_DE_L_EXTRACTION,
  MOIS_DES_CENTRES,
  PRIX_DE_MARCHE_DE_L_ENCEINTE,
  TABLES_DU_PGI,
  chargesDeLAtelier,
  coutCibleDeLaGo,
  coutReelDeLEnceinte,
  coutStandardDeLEnceinte,
  coutVariableDeLAtelier,
  extractionDuMois,
  fixesDesCentres,
  lesTroisMethodes,
  leviersDuMois,
  quantitesDuSemestre,
  reportingDuTrimestre,
  resultatsDesCentres,
  seuilDeLAtelier,
  type LeviersDesCentres,
} from "../monde/centres-de-nova";
import { GESTION_DU_COURS, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : PILOTER UN CENTRE (contrôle de gestion, palier 4 ; BTS CG P5 5.5.1, 5.5.3 et 5.2.1 ;
 * DCG UE11 2025, 4.4 et 4.2 ; BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : janvier, février et mars chez NOVA, découpée en deux centres
 * de responsabilité (monde/centres-de-nova.ts) : l'atelier, qui fabrique, cède ses enceintes au service
 * commercial, qui les vend. Tous les chiffres viennent de la fiche de gestion (monde/nova-gestion.ts) et
 * de la répartition du coût complet ; le résultat de chaque mois est celui du tableau de bord.
 *
 * L'objet : les outils de pilotage d'un centre, au sens du BTS CG (5.5.1 : critères de performance,
 * prix de cession internes, valeur cible) et du DCG (4.4 : prix de cession interne au prix de marché,
 * au coût standard, au coût réel ; 4.2 : le coût cible). Le prix de cession partage le résultat sans le
 * changer, mais il fait agir les responsables : au coût standard, l'atelier porte la sous-activité que
 * les ventes lui laissent ; au coût réel, il transmet ses dérives et pousse le service commercial vers le
 * sous-traitant, ce qui coûte à NOVA. Puis le coût cible d'un nouveau modèle, la NOVA Go, réparti par
 * fonction (analyse de la valeur). Puis l'information du centre : une requête simple dans le PGI, lue
 * sur son modèle relationnel (5.2.1), et le reporting mensuel des centres à la direction, cessions
 * internes éliminées (5.5.3).
 *
 * LES TROIS TEMPS :
 *   · guidé : les-trois-prix, les-resultats-au-prix-de-marche, le-cout-cible (la formule est dans la
 *     question, avec les chiffres) ;
 *   · l'expérience avant la formule : predire-le-partage avant les-trois-partages ; predire-le-seuil
 *     puis le curseur le-seuil-de-l-atelier, qui fait trouver le seuil d'un centre avant de l'écrire ;
 *     le laboratoire des cessions (prix de cession, volume, fournisseur), avec le graphique des trois
 *     résultats selon le prix de cession ;
 *   · autonome : les-trois-partages, le-cout-cible-par-fonction et le-reporting-de-mars sont des
 *     tableaux à compléter, sans formule ; l-extraction-de-fevrier part du résultat d'une requête ;
 *   · expert : acheter-au-sous-traitant (ce que coûte à NOVA un prix de cession mal choisi), puis la
 *     remontée des comptes et la synthèse.
 */

/** Le chapitre se calcule sur la fiche de gestion de NOVA. */
export const ENTREPRISES_DE_PILOTER_UN_CENTRE: readonly string[] = ["nova"];

/** Les bornes du curseur des enceintes cédées dans le mois. */
export const CESSIONS_DU_CURSEUR = { min: 1_400, max: 2_200 } as const;

/** Les leviers du laboratoire : le prix de cession (en euros) et les enceintes du mois. */
export const LEVIERS_DU_LABORATOIRE = {
  cession: { min: 38, max: 60, pas: 1 },
  quantite: { min: 1_400, max: 2_200, pas: 10 },
} as const;

/** Le prix de cession au départ du laboratoire : le coût réel de janvier, à l'euro supérieur. */
export const departDuPrixDeCession = (f: FicheDeGestion) => Math.ceil(coutReelDeLEnceinte(f, quantitesDuSemestre(f)[MOIS_DES_CENTRES]!) - 1e-9);

/** Le mois du reporting que l'élève remplit : mars, la fin du trimestre. */
export const MOIS_DU_REPORTING_REMPLI = 2;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
/** « (−1 208,15 €) » : un montant négatif entre parenthèses dans un calcul. */
const par = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise (la fiche est figée). */
export function centresDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = f.moisDeReference;
  const q = quantitesDuSemestre(f)[MOIS_DES_CENTRES]!;
  const fixes = fixesDesCentres(f);
  const cv = coutVariableDeLAtelier(f);
  const standard = coutStandardDeLEnceinte(f);
  const chargesDuMois = chargesDeLAtelier(f, q);
  const reel = coutReelDeLEnceinte(f, q);
  const trois = lesTroisMethodes(f);
  const marche = PRIX_DE_MARCHE_DE_L_ENCEINTE;
  const seuil = seuilDeLAtelier(f, marche)!;
  const dehors = resultatsDesCentres(f, { ...leviersDuMois(f), fournisseur: "sous-traitant" });
  const reporting = reportingDuTrimestre(f);
  const mars = reporting.mois[MOIS_DU_REPORTING_REMPLI]!;
  const fevrier = reporting.mois[MOIS_DE_L_EXTRACTION]!;
  const extraction = extractionDuMois(f, MOIS_DE_L_EXTRACTION);
  const cible = coutCibleDeLaGo();
  return {
    f,
    m,
    q,
    fixes,
    cv,
    standard,
    chargesDuMois,
    reel,
    trois,
    marche,
    seuil,
    dehors,
    reporting,
    mars,
    fevrier,
    extraction,
    cible,
    normale: f.centres.activiteNormale,
    /** Le taux d'activité de janvier : ses enceintes ÷ l'activité normale. */
    taux: q / f.centres.activiteNormale,
    /** Ce que NOVA perd quand le service commercial achète dehors : le résultat fabriqué moins le résultat sous-traité. */
    perteDehors: auCentime(trois.marche.nova - dehors.nova),
    nom: (i: number) => f.semestre.mois[i]!.nom,
  };
}

export type CentresDuChapitre = ReturnType<typeof centresDuChapitre>;

/** Les deux centres de janvier : ce que l'élève a sous les yeux. */
export function tableauDesCentres(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = centresDuChapitre(c);
  const A = CENTRES_DE_RESPONSABILITE;
  return {
    titre: `Les deux centres de ${x.f.entreprise}, en janvier`,
    colonnes: [A.atelier.nom, A.commercial.nom],
    lignes: [
      { libelle: "Ce que fait le centre", valeurs: ["Achète les composants, fabrique les enceintes", "Vend les enceintes aux clients"] },
      { libelle: "Responsable", valeurs: [majuscule(A.atelier.responsable), majuscule(A.commercial.responsable)] },
      { libelle: "Centres d'analyse regroupés", valeurs: ["Approvisionnement et production", "Distribution"] },
      { libelle: "Enceintes du mois", valeurs: [`${qte(x.q)} fabriquées et cédées`, `${qte(x.q)} vendues à ${eur(x.m.prix)} HT`] },
      { libelle: "Coût variable d'une enceinte", valeurs: [`${eur(x.cv)} (${eur(x.m.coutVariable.composants)} de composants, ${eur(x.m.coutVariable.autres)} d'autres coûts)`, "Aucun en dehors des achats à l'atelier"] },
      { libelle: "Charges fixes du mois", valeurs: [eur(x.fixes.atelier), eur(x.fixes.commercial)] },
    ],
  };
}

const donnee = (valeur: number, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, ...autres });
const VIDE: CelluleACompleter = { valeur: null };
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Une position du laboratoire, lue en leviers du modèle. */
function leviersDuLaboratoire(p: Readonly<Record<string, number>>): Partial<LeviersDesCentres> {
  return { quantite: p.quantite!, cession: p.cession!, fournisseur: p.fournisseur === 1 ? "sous-traitant" : "atelier" };
}

/** Les résultats d'une position du laboratoire. */
export const laboratoireDesCessions = (f: FicheDeGestion, p: Readonly<Record<string, number>>) => resultatsDesCentres(f, leviersDuLaboratoire(p));

/** Le défi du laboratoire : l'atelier fournit, sans dépasser le prix du sous-traitant, et les deux centres gagnent. */
export function defiDesCessionsAtteint(f: FicheDeGestion, p: Readonly<Record<string, number>>) {
  const r = laboratoireDesCessions(f, p);
  return p.fournisseur === 0 && p.cession! <= PRIX_DE_MARCHE_DE_L_ENCEINTE && r.atelier.resultat > 0 && r.commercial.resultat > 0;
}

export const PILOTER_UN_CENTRE: Chapitre = {
  code: "piloter-un-centre",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Piloter un centre",
  accroche:
    "NOVA se découpe en deux centres : l'atelier cède ses enceintes au service commercial. À quel prix ? Prix de marché, coût standard ou coût réel partagent autrement le même résultat, et ne font pas agir les responsables de la même façon. Puis le coût cible d'un nouveau modèle, une requête dans le PGI et le reporting du mois.",
  objectifs: [
    "Calculer le résultat de chaque centre selon le prix de cession interne retenu : prix de marché, coût standard ou coût réel",
    "Choisir un prix de cession interne en mesurant ses effets sur le comportement des responsables et sur le résultat de l'entreprise",
    "Calculer un coût cible et le répartir entre les fonctions d'un produit pour savoir où réduire le coût",
    "Extraire d'un PGI les données d'un centre par une requête simple, lue sur le modèle relationnel",
    "Compléter le reporting mensuel des centres et le regrouper en éliminant les cessions internes",
  ],
  libre: false,
  prerequis: ["cout-complet", "tableau-de-bord"],
  ensuite: ["les-ecarts-et-leurs-responsables"],
  entreprises: {
    codes: ENTREPRISES_DE_PILOTER_UN_CENTRE,
    pourquoi:
      "le pilotage des centres se calcule ici sur NOVA dans la simulation du cours, découpée en un atelier et un service commercial ; la méthode vaut pour toute entreprise organisée en centres.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux centres, un résultat",
      notions: ["full_unit_cost", "fixed_costs", "variable_costs"],
      tableau: tableauDesCentres,
      texte: (c) => {
        const x = centresDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}, en janvier. Jusqu'ici, ${x.f.entreprise} avait un seul résultat. La direction la découpe en deux centres de responsabilité : l'atelier achète les composants et fabrique les enceintes ; le service commercial les vend aux particuliers et à CampusTech, ${eur(x.m.prix)} HT l'une.`,
          `L'atelier regroupe les centres d'analyse approvisionnement et production de « Coût complet et centres d'analyse » ; le service commercial, le centre distribution. Les charges fixes du mois s'y partagent comme dans ce chapitre, prestations réciproques comprises : ${eur(x.fixes.atelier)} à l'atelier, ${eur(x.fixes.commercial)} au service commercial.`,
          `L'atelier cède chaque enceinte au service commercial à un prix de cession interne. Trois prix sont en discussion : le prix de marché, ce que le sous-traitant facture une enceinte finie, ${eur(x.marche)} ; le coût standard, celui de l'activité normale de ${qte(x.normale)} enceintes ; le coût réel du mois.`,
          "Une fois le prix choisi, vous fixerez le coût cible d'un nouveau modèle, extrairez du PGI les ventes d'un mois, et remonterez les comptes des centres à la direction.",
        ];
      },
      repere: () =>
        "Résultat d'un centre = ses produits − ses charges. Une cession interne est un produit pour le centre qui cède et une charge du même montant pour celui qui reçoit : elle partage le résultat de l'entreprise sans le changer.",
    },
    {
      id: "les-trois-prix",
      objectifs: [0],
      type: "montants",
      titre: "Trois prix de cession",
      notions: ["standard_costing", "full_unit_cost"],
      question: (c) => {
        const x = centresDuChapitre(c);
        return `Le prix de marché est connu : ${eur(x.marche)}. Calculez les deux autres prix d'une enceinte, au centime. Le coût standard : le coût variable de l'atelier (${eur(x.cv)}) plus ses charges fixes (${eur(x.fixes.atelier)}) réparties sur l'activité normale (${qte(x.normale)} enceintes). Puis les charges réelles de l'atelier en janvier (${qte(x.q)} enceintes), et le coût réel d'une enceinte.`;
      },
      champs: (c) => {
        const x = centresDuChapitre(c);
        return [
          { libelle: "Coût standard d'une enceinte", attendu: x.standard, calcul: `${eur(x.cv)} + ${eur(x.fixes.atelier)} ÷ ${qte(x.normale)} = ${eur(x.cv)} + ${qte(x.fixes.atelier / x.normale, 4)} € = ${eur(x.standard)}` },
          { libelle: "Charges réelles de l'atelier en janvier", attendu: x.chargesDuMois.total, calcul: `${qte(x.q)} × ${eur(x.cv)} + ${eur(x.fixes.atelier)} = ${eur(x.chargesDuMois.variables)} + ${eur(x.fixes.atelier)} = ${eur(x.chargesDuMois.total)}` },
          { libelle: "Coût réel d'une enceinte en janvier", attendu: x.reel, calcul: `${eur(x.chargesDuMois.total)} ÷ ${qte(x.q)} = ${qte(x.chargesDuMois.total / x.q, 4)} €, au centime ${eur(x.reel)}` },
        ];
      },
      explication: (c) => {
        const x = centresDuChapitre(c);
        return [
          `Le coût réel dépasse le coût standard de ${eur(auCentime(x.reel - x.standard))} : janvier tourne à ${pct(x.taux)} de l'activité normale, et chaque enceinte porte une plus grosse part des charges fixes. Il dépasse même le prix de marché, ${eur(x.marche)}.`,
          "Le coût standard ne dépend pas des ventes du mois : c'est le coût de production en imputation rationnelle. Le coût réel, lui, change chaque mois avec le volume.",
        ];
      },
    },
    {
      id: "les-resultats-au-prix-de-marche",
      objectifs: [0],
      type: "montants",
      titre: "Le résultat de chaque centre",
      notions: ["full_unit_cost", "contribution_margin"],
      question: (c) => {
        const x = centresDuChapitre(c);
        return `La direction retient d'abord le prix de marché, ${eur(x.marche)}. Calculez les cessions de l'atelier en janvier (${qte(x.q)} enceintes) et son résultat (cessions − ses charges réelles, ${eur(x.chargesDuMois.total)}). Puis le résultat du service commercial (ventes à ${eur(x.m.prix)} − achats à l'atelier − ses charges fixes, ${eur(x.fixes.commercial)}), et celui de ${x.f.entreprise}.`;
      },
      champs: (c) => {
        const x = centresDuChapitre(c);
        const r = x.trois.marche;
        return [
          { libelle: "Cessions de l'atelier", attendu: r.atelier.cessions, calcul: `${qte(x.q)} × ${eur(x.marche)} = ${eur(r.atelier.cessions)}` },
          { libelle: "Résultat de l'atelier", attendu: r.atelier.resultat, calcul: `${eur(r.atelier.cessions)} − ${eur(x.chargesDuMois.total)} = ${eur(r.atelier.resultat)}` },
          { libelle: "Résultat du service commercial", attendu: r.commercial.resultat, calcul: `${qte(x.q)} × ${eur(x.m.prix)} − ${eur(r.commercial.achats)} − ${eur(x.fixes.commercial)} = ${eur(r.commercial.ventes)} − ${eur(r.commercial.achats)} − ${eur(x.fixes.commercial)} = ${eur(r.commercial.resultat)}` },
          { libelle: `Résultat de ${x.f.entreprise}`, attendu: r.nova, calcul: `${par(r.atelier.resultat)} + ${eur(r.commercial.resultat)} = ${eur(r.nova)}` },
        ];
      },
      explication: (c) => {
        const x = centresDuChapitre(c);
        const r = x.trois.marche;
        return [
          `${x.f.entreprise} gagne ${eur(r.nova)} en janvier, le résultat du tableau de bord : découper l'entreprise en centres ne change pas ce qu'elle gagne. L'atelier perd ${eur(-r.atelier.resultat)}, le service commercial gagne ${eur(r.commercial.resultat)}.`,
          `Les ${eur(r.atelier.cessions)} de cessions ne sont ni un produit ni une charge de ${x.f.entreprise} : ce qui entre chez l'un sort chez l'autre.`,
        ];
      },
    },
    {
      id: "predire-le-partage",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur le prix de cession",
      notions: ["full_unit_cost"],
      question: (c) => {
        const x = centresDuChapitre(c);
        return `Avant de calculer, pariez. Si la direction cédait les enceintes de janvier au coût réel, ${eur(x.reel)}, au lieu du prix de marché, ${eur(x.marche)}, le résultat de ${x.f.entreprise} en janvier…`;
      },
      options: (c) => {
        const x = centresDuChapitre(c);
        const t = x.trois;
        const voir = "Remplissez le tableau de l'étape suivante : il met côte à côte les trois prix de cession.";
        return [
          { texte: "Ne changerait pas", juste: t.reel.nova === t.marche.nova, retour: `Bon pari. ${voir}` },
          { texte: "Augmenterait : l'atelier ne perdrait plus rien", juste: t.reel.nova > t.marche.nova, retour: `Pari à vérifier. ${voir}` },
          { texte: "Baisserait : le service commercial paierait plus cher", juste: t.reel.nova < t.marche.nova, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-trois-partages",
      objectifs: [0],
      type: "a-completer",
      titre: "Les trois partages",
      notions: ["standard_costing", "full_unit_cost"],
      question: () =>
        "À vous, sans formule : remplissez, pour janvier, les cessions et le résultat de chaque centre selon les trois prix de cession, puis le résultat de NOVA. Au coût réel, l'atelier facture au service commercial ses charges réelles du mois, au centime.",
      grille: (c) => {
        const x = centresDuChapitre(c);
        const t = x.trois;
        const cols = [t.marche, t.standard, t.reel] as const;
        const prix = [x.marche, x.standard, x.reel];
        return {
          titre: `Le résultat des centres selon le prix de cession, janvier · ${x.f.entreprise}`,
          colonnes: ["Prix de marché", "Coût standard", "Coût réel"],
          lignes: [
            { libelle: "Prix de cession d'une enceinte", cellules: prix.map((p, i) => donnee(p, i === 2 ? { texte: `${eur(p)} (au centime)` } : {})) },
            {
              libelle: "Cessions de l'atelier",
              cellules: cols.map((r, i) =>
                aSaisir(r.atelier.cessions, i === 2 ? `les charges réelles de l'atelier : ${eur(r.atelier.cessions)}` : `${qte(x.q)} × ${eur(prix[i]!)} = ${eur(r.atelier.cessions)}`, { indice: "les enceintes du mois au prix de cession" }),
              ),
            },
            {
              libelle: "Résultat de l'atelier",
              cellules: cols.map((r) => aSaisir(r.atelier.resultat, `${eur(r.atelier.cessions)} − ${eur(x.chargesDuMois.total)} = ${eur(r.atelier.resultat)}`, { indice: "ses cessions moins ses charges réelles du mois" })),
            },
            {
              libelle: "Résultat du service commercial",
              cellules: cols.map((r) => aSaisir(r.commercial.resultat, `${eur(r.commercial.ventes)} − ${eur(r.commercial.achats)} − ${eur(x.fixes.commercial)} = ${eur(r.commercial.resultat)}`, { indice: "ses ventes moins ses achats à l'atelier et ses charges fixes" })),
            },
            {
              libelle: `Résultat de ${x.f.entreprise}`,
              fort: true,
              totalDe: { plus: [2, 3] },
              cellules: cols.map((r) => aSaisir(r.nova, `${par(r.atelier.resultat)} + ${eur(r.commercial.resultat)} = ${eur(r.nova)}`)),
            },
          ],
        };
      },
      explication: (c) => {
        const x = centresDuChapitre(c);
        const t = x.trois;
        return [
          `${x.f.entreprise} gagne ${eur(t.marche.nova)} dans les trois colonnes. Le prix de cession ne crée ni ne détruit rien : il dit qui porte quoi. Au prix de marché, l'atelier perd ${eur(-t.marche.atelier.resultat)} ; au coût standard, ${eur(-t.standard.atelier.resultat)} ; au coût réel, il est à ${eur(0)} et le service commercial porte tout.`,
          "Un résultat de centre ne se lit donc jamais seul : il faut savoir à quel prix le centre a cédé ou acheté.",
        ];
      },
    },
    {
      id: "la-sous-activite",
      objectifs: [1],
      type: "choix",
      titre: "Ce que le coût standard laisse à l'atelier",
      notions: ["standard_costing", "fixed_costs"],
      question: (c) => {
        const x = centresDuChapitre(c);
        return `Au coût standard, l'atelier perd ${eur(-x.trois.standard.atelier.resultat)} en janvier, alors qu'il a fabriqué chaque enceinte au coût prévu par enceinte. D'où vient cette perte ?`;
      },
      options: (c) => {
        const x = centresDuChapitre(c);
        const manquantes = x.normale - x.q;
        return [
          {
            texte: `Des ventes : ${pct(x.taux)} de l'activité normale`,
            juste: true,
            retour: `Oui. Le coût standard répartit les charges fixes de l'atelier sur ${qte(x.normale)} enceintes ; janvier n'en fait que ${qte(x.q)}. Les charges fixes des ${qte(manquantes)} enceintes non fabriquées ne sont facturées à personne : c'est le coût de la sous-activité, que l'atelier porte. Or le volume, c'est le service commercial qui le fait : le chef d'atelier répond d'une perte qu'il ne maîtrise pas.`,
          },
          {
            texte: "D'un gaspillage de composants à l'atelier",
            juste: false,
            retour: `Non : chaque enceinte a coûté ${eur(x.cv)} de coûts variables, ce que prévoit le standard. Rien n'a été gaspillé.`,
          },
          {
            texte: "D'un prix de vente trop bas, fixé par le service commercial",
            juste: false,
            retour: `Non : le prix de vente ne joue pas sur le résultat de l'atelier, qui ne vend qu'au service commercial, au coût standard de ${eur(x.standard)}.`,
          },
        ];
      },
    },
    {
      id: "le-cout-reel-et-les-comportements",
      objectifs: [1],
      type: "choix",
      titre: "Ce que le coût réel fait faire",
      notions: ["full_unit_cost", "make_or_buy"],
      question: (c) => {
        const x = centresDuChapitre(c);
        return `La direction hésite à céder au coût réel : l'atelier ne perdrait jamais rien, et le service commercial paierait ${eur(x.reel)} en janvier. Quel défaut ce prix a-t-il pour piloter les deux centres ?`;
      },
      options: (c) => {
        const x = centresDuChapitre(c);
        return [
          {
            texte: "L'atelier transmet ses dérives à l'autre centre",
            juste: true,
            retour: `Oui. Au coût réel, chaque euro gaspillé à l'atelier passe dans le prix que paie le service commercial : le chef d'atelier n'a aucune raison de maîtriser ses coûts, et sa performance ne se mesure plus. Et à ${eur(x.reel)}, plus que le sous-traitant (${eur(x.marche)}), la responsable commerciale est tentée d'acheter dehors.`,
          },
          {
            texte: "Aucun : chaque centre paie enfin le vrai coût de ce qu'il reçoit",
            juste: false,
            retour: "Non : le vrai coût de l'atelier comprend ses inefficacités. Les facturer au service commercial, c'est lui faire payer ce qu'il ne maîtrise pas.",
          },
          {
            texte: "Il change le résultat de NOVA selon les enceintes du mois",
            juste: false,
            retour: `Non : le tableau l'a montré, ${x.f.entreprise} gagne ${eur(x.trois.reel.nova)} quel que soit le prix de cession. C'est le partage qui change, et ce qu'il fait faire aux responsables.`,
          },
        ];
      },
    },
    {
      id: "predire-le-seuil",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur le seuil de l'atelier",
      notions: ["breakeven", "contribution_margin"],
      question: (c) => {
        const x = centresDuChapitre(c);
        return `Avant de calculer, pariez. Au prix de marché, ${eur(x.marche)}, l'atelier perd en janvier avec ${qte(x.q)} enceintes. Combien d'enceintes doit-il céder dans le mois pour ne plus perdre ?`;
      },
      options: (c) => {
        const x = centresDuChapitre(c);
        const voir = "Faites varier les enceintes cédées à l'étape suivante : le curseur montre les cessions et les charges de l'atelier.";
        return [
          { texte: `Entre ${qte(x.q)} et ${qte(x.normale)}`, juste: x.seuil > x.q && x.seuil <= x.normale, retour: `Bon pari. ${voir}` },
          { texte: `Plus de ${qte(x.normale)}, au-delà de l'activité normale`, juste: x.seuil > x.normale, retour: `Pari à vérifier. ${voir}` },
          { texte: `Aucun volume : à ${eur(x.marche)}, l'atelier perd toujours`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-seuil-de-l-atelier",
      objectifs: [0],
      type: "curseur",
      titre: "Le seuil de l'atelier, au curseur",
      notions: ["breakeven", "contribution_margin", "fixed_costs"],
      question: (c) => {
        const x = centresDuChapitre(c);
        return `Faites varier les enceintes que l'atelier cède dans le mois, de ${qte(CESSIONS_DU_CURSEUR.min)} à ${qte(CESSIONS_DU_CURSEUR.max)}, au prix de marché de ${eur(x.marche)}. Une droite donne ses cessions, l'autre ses charges : ${eur(x.cv)} par enceinte et ${eur(x.fixes.atelier)} de charges fixes. Placez le curseur sur le plus petit nombre d'enceintes où l'atelier couvre ses charges, puis validez.`;
      },
      grandeur: () => ({ libelle: "Enceintes cédées au service commercial dans le mois", unite: "enceintes" }),
      cible: (c) => ({ attendu: centresDuChapitre(c).seuil, min: CESSIONS_DU_CURSEUR.min, max: CESSIONS_DU_CURSEUR.max }),
      zones: ["L'atelier couvre ses charges", "L'atelier perd"],
      rates: () => ({
        dessous: "À ce volume, l'atelier perd encore de l'argent.",
        dessus: "Avec moins d'enceintes, l'atelier couvre encore ses charges : cherchez le plus petit volume.",
      }),
      montrer: "Montrer le seuil de l'atelier",
      lecture: (c, q) => {
        const x = centresDuChapitre(c);
        const r = resultatsDesCentres(x.f, { quantite: q, cession: x.marche });
        return [
          { libelle: "Cessions de l'atelier", montant: r.atelier.cessions },
          { libelle: "Charges de l'atelier", montant: auCentime(r.atelier.variables + r.atelier.fixes) },
          { libelle: "Résultat de l'atelier", montant: r.atelier.resultat, fort: true },
        ];
      },
      droites: (c) => {
        const x = centresDuChapitre(c);
        return { produit: (q) => auCentime(q * x.marche), cout: (q) => chargesDeLAtelier(x.f, q).total, libelles: ["Cessions de l'atelier", "Charges de l'atelier"] };
      },
      explication: (c) => {
        const x = centresDuChapitre(c);
        const marge = auCentime(x.marche - x.cv);
        const mars = x.reporting.mois[MOIS_DU_REPORTING_REMPLI]!;
        return [
          `L'atelier couvre ses charges à partir de ${qte(x.seuil)} enceintes : chacune lui laisse ${eur(x.marche)} − ${eur(x.cv)} = ${eur(marge)}, et ${eur(x.fixes.atelier)} ÷ ${eur(marge)} = ${qte(x.fixes.atelier / marge)}, soit ${qte(x.seuil)} à l'unité supérieure.`,
          `C'est le seuil de rentabilité, appliqué à un centre : charges fixes du centre ÷ (prix de cession − coût variable). Janvier, ${qte(x.q)} enceintes, est en dessous ; ${mars.nom}, ${qte(mars.leviers.quantite)}, au-dessus. Le résultat de l'atelier dépend d'abord du volume que vend le service commercial.`,
        ];
      },
    },
    {
      id: "acheter-au-sous-traitant",
      objectifs: [1],
      type: "montants",
      titre: "Si le service commercial achetait dehors",
      notions: ["make_or_buy", "variable_costs", "fixed_costs"],
      question: (c) => {
        const x = centresDuChapitre(c);
        return `Au coût réel de janvier, ${eur(x.reel)}, l'enceinte de l'atelier coûte plus cher au service commercial que celle du sous-traitant, ${eur(x.marche)}. Supposez qu'il achète dehors les ${qte(x.q)} enceintes de janvier. Sans formule : calculez le résultat du service commercial, celui de l'atelier (qui garde ses charges fixes), celui de ${x.f.entreprise}, puis ce que ${x.f.entreprise} y perd.`;
      },
      champs: (c) => {
        const x = centresDuChapitre(c);
        const d = x.dehors;
        return [
          { libelle: "Résultat du service commercial, achats au sous-traitant", attendu: d.commercial.resultat, calcul: `${eur(d.commercial.ventes)} − ${qte(x.q)} × ${eur(x.marche)} − ${eur(x.fixes.commercial)} = ${eur(d.commercial.resultat)}` },
          { libelle: "Résultat de l'atelier, sans rien céder", attendu: d.atelier.resultat, calcul: `ses charges fixes restent : ${eur(d.atelier.resultat)}` },
          { libelle: `Résultat de ${x.f.entreprise}, achats au sous-traitant`, attendu: d.nova, calcul: `${eur(d.commercial.resultat)} + ${par(d.atelier.resultat)} = ${eur(d.nova)}` },
          { libelle: `Ce que ${x.f.entreprise} perd`, attendu: x.perteDehors, calcul: `${eur(x.trois.marche.nova)} − ${par(d.nova)} = ${eur(x.perteDehors)}, soit ${qte(x.q)} × (${eur(x.marche)} − ${eur(x.cv)})` },
        ];
      },
      explication: (c) => {
        const x = centresDuChapitre(c);
        const gain = auCentime(x.dehors.commercial.resultat - x.trois.reel.commercial.resultat);
        return [
          `Le service commercial y gagne ${eur(gain)} (${eur(x.dehors.commercial.resultat)} au lieu de ${eur(x.trois.reel.commercial.resultat)} au coût réel) ; ${x.f.entreprise} y perd ${eur(x.perteDehors)}. Les charges fixes de l'atelier ne disparaissent pas : chaque enceinte achetée dehors coûte à ${x.f.entreprise} ${eur(x.marche)} au lieu de ${eur(x.cv)}.`,
          `Un prix de cession au-dessus du marché pousse donc un responsable vers une décision bonne pour son centre et mauvaise pour l'entreprise. Tant que l'atelier a de la capacité, le prix de cession se tient entre le coût variable (${eur(x.cv)}), sous lequel l'atelier perd à chaque enceinte, et le prix de marché (${eur(x.marche)}), au-dessus duquel le service commercial achète dehors.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-cessions",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire des cessions",
      notions: ["make_or_buy", "breakeven", "full_unit_cost"],
      question: () =>
        "Faites varier le prix de cession, les enceintes vendues dans le mois et le fournisseur du service commercial : le tableau suit le résultat de chaque centre et celui de NOVA. Relevez le défi, puis cherchez ce que chaque levier change, et ce qu'il ne change pas.",
      leviers: (c) => {
        const x = centresDuChapitre(c);
        const L = LEVIERS_DU_LABORATOIRE;
        return [
          { code: "cession", libelle: "Prix de cession d'une enceinte", unite: "€", ...L.cession, depart: departDuPrixDeCession(x.f) },
          { code: "quantite", libelle: "Enceintes vendues dans le mois", unite: "enceintes", ...L.quantite, depart: x.q },
          {
            code: "fournisseur",
            libelle: "Qui fournit le service commercial",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: 0,
            choix: [
              { valeur: 0, libelle: "l'atelier" },
              { valeur: 1, libelle: `le sous-traitant, à ${eur(x.marche)}` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = centresDuChapitre(c);
        const r = laboratoireDesCessions(x.f, p);
        const d = laboratoireDesCessions(x.f, { cession: departDuPrixDeCession(x.f), quantite: x.q, fournisseur: 0 });
        return [
          { libelle: "Prix payé par le service commercial pour une enceinte", montant: auCentime(r.prixUnitaire), reference: auCentime(d.prixUnitaire) },
          { libelle: "Résultat de l'atelier", montant: r.atelier.resultat, reference: d.atelier.resultat },
          { libelle: "Résultat du service commercial", montant: r.commercial.resultat, reference: d.commercial.resultat },
          { libelle: "Résultat de NOVA", montant: r.nova, reference: d.nova, fort: true },
        ];
      },
      // Les deux résultats des centres se croisent quand le prix de cession monte ; celui de NOVA reste plat.
      graphique: (c) => {
        const x = centresDuChapitre(c);
        return {
          levier: "cession",
          courbes: [
            { libelle: "Résultat de l'atelier", valeur: (p) => laboratoireDesCessions(x.f, p).atelier.resultat },
            { libelle: "Résultat du service commercial", valeur: (p) => laboratoireDesCessions(x.f, p).commercial.resultat },
            { libelle: "Résultat de NOVA", valeur: (p) => laboratoireDesCessions(x.f, p).nova },
          ],
        };
      },
      defi: (c) => {
        const x = centresDuChapitre(c);
        const pasQ = LEVIERS_DU_LABORATOIRE.quantite.pas;
        return {
          consigne: `Faites gagner de l'argent aux deux centres, l'atelier fournissant les enceintes à un prix qui ne dépasse pas celui du sous-traitant, ${eur(x.marche)}.`,
          atteint: (p) => defiDesCessionsAtteint(x.f, p),
          indice: (p) => {
            const r = laboratoireDesCessions(x.f, p);
            if (p.fournisseur === 1) return `Le sous-traitant fournit : l'atelier garde ses charges fixes et perd ${eur(-r.atelier.resultat)}. Rendez-lui les enceintes.`;
            if (p.cession! > x.marche) return `À ${eur(p.cession!)}, l'atelier facture plus cher que le sous-traitant : le service commercial irait acheter dehors.`;
            if (r.atelier.resultat <= 0) {
              const s = seuilDeLAtelier(x.f, p.cession!);
              return s === null
                ? `À ${eur(p.cession!)}, l'atelier ne couvre même pas son coût variable de ${eur(x.cv)} : il perd ${eur(-r.atelier.resultat)}.`
                : `L'atelier perd ${eur(-r.atelier.resultat)} : à ${eur(p.cession!)}, il lui faut au moins ${qte(s)} enceintes dans le mois.`;
            }
            return `Le service commercial perd ${eur(-r.commercial.resultat)} : il paie trop cher l'enceinte, ou en vend trop peu.`;
          },
          solution: { cession: x.marche, quantite: Math.ceil(x.seuil / pasQ - 1e-9) * pasQ, fournisseur: 0 },
        };
      },
      explication: (c, p) => {
        const x = centresDuChapitre(c);
        const r = laboratoireDesCessions(x.f, p);
        return [
          `Défi relevé : à ${eur(p.cession!)} et ${qte(p.quantite!)} enceintes, l'atelier gagne ${eur(r.atelier.resultat)}, le service commercial ${eur(r.commercial.resultat)}, ${x.f.entreprise} ${eur(r.nova)}.`,
          `Au volume de janvier, aucun prix ne le permettait : l'atelier ne couvre ses charges qu'à ${eur(x.reel)} au moins, son coût réel, et le sous-traitant en demande ${eur(x.marche)}. La perte de l'atelier en janvier tient au volume, pas à son efficacité.`,
          `Glissez le prix de cession : le résultat de ${x.f.entreprise} ne bouge pas, seul le partage change. Faites fournir le sous-traitant : à ${eur(x.marche)}, le service commercial ne voit aucune différence, mais ${x.f.entreprise} perd ${eur(auCentime(x.marche - x.cv))} par enceinte.`,
        ];
      },
    },
    {
      id: "le-cout-cible",
      objectifs: [2],
      type: "montants",
      titre: "Le coût cible d'un nouveau modèle",
      notions: ["contribution_margin", "variable_costs", "price_floor"],
      question: (c) => {
        const x = centresDuChapitre(c);
        const k = x.cible;
        return `Le bureau d'études prépare la ${LA_GO.nom}, une petite enceinte nomade. Le marché accepte ${eur(k.prix)} pour ce produit ; la direction veut que chaque Go laisse ${eur(k.marge)} de marge sur coût variable. Le premier projet coûte ${eur(k.coutEstime)} par enceinte. Calculez le coût cible d'une Go (prix du marché − marge visée), l'écart à combler, puis la marge que laisserait le premier projet.`;
      },
      champs: (c) => {
        const k = centresDuChapitre(c).cible;
        return [
          { libelle: "Coût cible d'une Go", attendu: k.coutCible, calcul: `${eur(k.prix)} − ${eur(k.marge)} = ${eur(k.coutCible)}` },
          { libelle: "Écart à combler", attendu: k.ecart, calcul: `${eur(k.coutEstime)} − ${eur(k.coutCible)} = ${eur(k.ecart)}` },
          { libelle: "Marge du premier projet", attendu: k.margeDuProjet, calcul: `${eur(k.prix)} − ${eur(k.coutEstime)} = ${eur(k.margeDuProjet)}` },
        ];
      },
      explication: (c) => {
        const k = centresDuChapitre(c).cible;
        return [
          `Le coût cible renverse le raisonnement : on ne part pas du coût pour fixer le prix (coût + marge). On part du prix que le marché accepte et de la marge voulue, et on en déduit le coût à ne pas dépasser, ${eur(k.coutCible)}. Monter le prix n'est pas permis : le marché l'a fixé.`,
          `C'est une valeur cible : le résultat voulu d'abord, le coût trouvé à rebours, comme le fait l'outil « valeur cible » d'un tableur. Le projet doit perdre ${eur(k.ecart)} avant d'être lancé ; reste à savoir où.`,
        ];
      },
    },
    {
      id: "le-cout-cible-par-fonction",
      objectifs: [2],
      type: "a-completer",
      titre: "Le coût cible, fonction par fonction",
      notions: ["variable_costs", "full_unit_cost"],
      question: (c) => {
        const k = centresDuChapitre(c).cible;
        return `Une enquête auprès des clients donne le poids de chaque fonction de la Go dans la valeur qu'ils lui voient ; le bureau d'études a chiffré chaque fonction de son projet. Répartissez le coût cible de ${eur(k.coutCible)} selon les poids, puis calculez l'écart de chaque fonction, coût estimé moins coût cible.`;
      },
      grille: (c) => {
        const k = centresDuChapitre(c).cible;
        const n = k.parFonction.length;
        return {
          titre: `Le coût cible de la ${LA_GO.nom}, par fonction`,
          colonnes: ["Poids pour les clients", "Coût estimé", "Coût cible", "Écart"],
          lignes: [
            ...k.parFonction.map((x) => ({
              libelle: x.libelle,
              cellules: [
                donnee(x.poids, { texte: pct(x.poids), horsTotal: true }),
                donnee(x.coutEstime),
                aSaisir(x.cible, `${eur(k.coutCible)} × ${pct(x.poids)} = ${eur(x.cible)}`, { indice: "le coût cible de la Go × le poids de la fonction" }),
                aSaisir(x.ecart, `${eur(x.coutEstime)} − ${eur(x.cible)} = ${eur(x.ecart)}`, { indice: "le coût estimé moins le coût cible : négatif sous la cible" }),
              ],
            })),
            {
              libelle: `La ${LA_GO.nom} entière`,
              fort: true,
              totalDe: { plus: Array.from({ length: n }, (_, i) => i) },
              cellules: [
                donnee(1, { texte: pct(1), horsTotal: true }),
                donnee(k.coutEstime),
                aSaisir(k.coutCible, `${k.parFonction.map((x) => eur(x.cible)).join(" + ")} = ${eur(k.coutCible)}`),
                aSaisir(k.ecart, `${eur(k.coutEstime)} − ${eur(k.coutCible)} = ${eur(k.ecart)}`),
              ],
            },
          ],
        };
      },
      explication: (c) => {
        const k = centresDuChapitre(c).cible;
        const trop = k.parFonction.filter((x) => x.ecart > 0).sort((a, b) => b.ecart - a.ecart);
        const sous = k.parFonction.filter((x) => x.ecart < 0);
        return [
          `Les écarts refont celui de la Go, ${eur(k.ecart)}. ${trop.map((x, i) => (i === 0 ? `« ${x.libelle} » dépasse sa cible de ${eur(x.ecart)}` : `« ${x.libelle} » de ${eur(x.ecart)}`)).join(", ")} : c'est là que le projet coûte plus que ce que les clients y voient.`,
          `${sous.map((x) => `« ${x.libelle} » coûte ${eur(-x.ecart)} de moins que sa cible`).join(", ")} : les clients en attendent plus que le projet ne lui donne.`,
        ];
      },
    },
    {
      id: "ou-chercher-l-economie",
      objectifs: [2],
      type: "choix",
      titre: "Où chercher l'économie",
      notions: ["variable_costs"],
      question: (c) => {
        const k = centresDuChapitre(c).cible;
        return `Le bureau d'études doit retirer ${eur(k.ecart)} à la Go. Où cherche-t-il d'abord, et que fait-il de la fonction qui coûte moins que sa cible ?`;
      },
      options: (c) => {
        const k = centresDuChapitre(c).cible;
        const [son, autonomie, robustesse, connexion] = ["son", "autonomie", "robustesse", "connexion"].map((code) => k.parFonction.find((x) => x.code === code)!);
        const rabot = auCentime(k.ecart / k.coutEstime);
        return [
          {
            texte: "Batterie et connexion d'abord ; le son peut recevoir plus",
            juste: true,
            retour: `Oui. L'analyse de la valeur cherche l'économie là où le coût dépasse ce que le client attend. Elle trouve ici une batterie d'une journée au lieu de deux (${eur(autonomie!.coutEstime)} ramenés à ${eur(autonomie!.coutRetenu)}), un module sans fil standard (${eur(connexion!.coutRetenu)}), une coque plus simple (${eur(robustesse!.coutRetenu)}). Le son, que les clients mettent en premier, reçoit ce qui lui manquait : ${eur(son!.coutRetenu)}. La Go lancée coûte ${eur(k.coutRetenu)}, son coût cible.`,
          },
          {
            texte: `Raboter chaque fonction de ${pct(rabot)} pour tomber juste sur le coût cible`,
            juste: false,
            retour: `Non : un rabot égal enlèverait au son, que les clients mettent en premier et qui coûte déjà moins que sa cible, et laisserait la batterie au-dessus de la sienne.`,
          },
          {
            texte: `Monter le prix pour garder ${eur(k.marge)} de marge`,
            juste: false,
            retour: `Non : le prix de ${eur(k.prix)} est celui que le marché accepte. Le coût cible part de lui ; c'est le coût qui doit s'y plier.`,
          },
        ];
      },
    },
    {
      id: "la-requete-du-pgi",
      objectifs: [3],
      type: "choix",
      titre: "La requête dans le PGI",
      notions: ["dashboard", "revenue"],
      tableau: () => ({
        titre: "Le modèle relationnel du module des ventes du PGI",
        colonnes: ["Colonnes (la clé primaire en premier, # : clé étrangère)"],
        lignes: TABLES_DU_PGI.map((t) => ({ libelle: t.nom, valeurs: [t.colonnes.join(", ")] })),
      }),
      question: (c) => {
        const x = centresDuChapitre(c);
        return `Le contrôleur prépare le reporting de ${x.nom(MOIS_DE_L_EXTRACTION)}. Les ventes sont dans le PGI, dont voici le modèle relationnel. Quelle requête donne, client par client, le chiffre d'affaires hors taxes de ${x.nom(MOIS_DE_L_EXTRACTION)} ?`;
      },
      options: (c) => {
        const x = centresDuChapitre(c);
        const n = MOIS_DE_L_EXTRACTION + 1;
        return [
          {
            texte: `SELECT code_client, SUM(quantite * prix_ht) FROM VENTES WHERE mois = ${n} GROUP BY code_client`,
            juste: true,
            retour: `Oui. SUM additionne quantite × prix_ht ligne par ligne, WHERE ne garde que ${x.nom(MOIS_DE_L_EXTRACTION)} (mois = ${n}), GROUP BY rend une ligne par client. La clé étrangère code_client relie chaque vente à son client de la table CLIENTS : une jointure sur elle donnerait aussi son nom.`,
          },
          {
            texte: "SELECT code_client, SUM(quantite * prix_ht) FROM VENTES GROUP BY code_client",
            juste: false,
            retour: "Non : sans WHERE, la requête additionne les ventes de tous les mois enregistrés. Une extraction doit être juste, mais aussi bornée à la période demandée.",
          },
          {
            texte: `SELECT code_client, SUM(quantite) FROM VENTES WHERE mois = ${n} GROUP BY code_client`,
            juste: false,
            retour: "Non : elle additionne les enceintes, pas le chiffre d'affaires. Il faut multiplier chaque quantité par son prix hors taxes avant de sommer.",
          },
          {
            texte: `SELECT nom, SUM(quantite * prix_ht) FROM CLIENTS WHERE mois = ${n} AND code_client = 'CAMP' GROUP BY nom`,
            juste: false,
            retour: "Non : la table CLIENTS ne porte ni le mois, ni les quantités, ni les prix ; ils sont dans VENTES. Et le filtre sur CAMP ne garderait qu'un client.",
          },
        ];
      },
    },
    {
      id: "l-extraction-de-fevrier",
      objectifs: [3],
      type: "montants",
      titre: "Du résultat de la requête au résultat du centre",
      notions: ["revenue", "contribution_margin"],
      tableau: (c) => {
        const x = centresDuChapitre(c);
        return {
          titre: `Ce que rend la requête, ${x.nom(MOIS_DE_L_EXTRACTION)}`,
          colonnes: ["Enceintes", "Chiffre d'affaires HT"],
          lignes: x.extraction.lignes.map((l) => ({ libelle: `${l.code} (${l.nom})`, valeurs: [qte(l.quantite), eur(l.chiffreDAffaires)] })),
        };
      },
      question: (c) => {
        const x = centresDuChapitre(c);
        return `Voici ce que la requête a rendu. Pour le reporting du service commercial en ${x.nom(MOIS_DE_L_EXTRACTION)}, calculez son chiffre d'affaires, ses achats à l'atelier au prix de marché (chaque enceinte vendue a été cédée par l'atelier), puis son résultat (charges fixes : ${eur(x.fixes.commercial)}).`;
      },
      champs: (c) => {
        const x = centresDuChapitre(c);
        const e = x.extraction;
        const r = x.fevrier;
        return [
          { libelle: `Chiffre d'affaires du service commercial en ${e.mois}`, attendu: e.chiffreDAffaires, calcul: `${e.lignes.map((l) => eur(l.chiffreDAffaires)).join(" + ")} = ${eur(e.chiffreDAffaires)}` },
          { libelle: "Achats à l'atelier", attendu: r.commercial.achats, calcul: `(${e.lignes.map((l) => qte(l.quantite)).join(" + ")}) × ${eur(x.marche)} = ${qte(e.quantite)} × ${eur(x.marche)} = ${eur(r.commercial.achats)}` },
          { libelle: `Résultat du service commercial en ${e.mois}`, attendu: r.commercial.resultat, calcul: `${eur(e.chiffreDAffaires)} − ${eur(r.commercial.achats)} − ${eur(x.fixes.commercial)} = ${eur(r.commercial.resultat)}` },
        ];
      },
      explication: (c) => {
        const x = centresDuChapitre(c);
        const r = x.fevrier;
        return [
          `Avant de s'en servir, le contrôleur vérifie l'extraction : exhaustive (chaque client du PGI, ${qte(x.extraction.quantite)} enceintes, les ventes du mois au tableau de bord) et juste (le prix de ${eur(x.m.prix)} HT de chaque vente).`,
          `En ${r.nom}, le service commercial gagne ${eur(r.commercial.resultat)} ; l'atelier perd ${eur(-r.atelier.resultat)}, et ${x.f.entreprise} ${eur(-r.nova)} : le mois est sous le seuil.`,
        ];
      },
    },
    {
      id: "le-reporting-de-mars",
      objectifs: [4],
      type: "a-completer",
      titre: "Le reporting du mois",
      notions: ["dashboard", "full_unit_cost"],
      question: (c) => {
        const x = centresDuChapitre(c);
        const m = x.mars;
        return `Fin ${m.nom}, chaque centre remonte ses comptes du mois à la direction, au prix de marché : ${qte(m.leviers.quantite)} enceintes vendues à ${eur(x.m.prix)}, fabriquées et cédées par l'atelier. Remplissez le reporting : chaque centre, les cessions que la direction élimine en regroupant les deux, et ${x.f.entreprise}.`;
      },
      grille: (c) => {
        const x = centresDuChapitre(c);
        const m = x.mars;
        const q = m.leviers.quantite;
        const cession = m.atelier.cessions;
        return {
          titre: `Le reporting de ${m.nom} · ${x.f.entreprise}`,
          colonnes: ["L'atelier", "Le service commercial", "Cessions éliminées", x.f.entreprise],
          colonneDeTotal: 3,
          lignes: [
            { libelle: "Ventes aux clients", cellules: [VIDE, aSaisir(m.commercial.ventes, `${qte(q)} × ${eur(x.m.prix)} = ${eur(m.commercial.ventes)}`), VIDE, aSaisir(m.commercial.ventes, `les ventes du service commercial : ${eur(m.commercial.ventes)}`)] },
            {
              libelle: "Cessions internes, produit",
              cellules: [aSaisir(cession, `${qte(q)} × ${eur(x.marche)} = ${eur(cession)}`), VIDE, aSaisir(-cession, `le produit de l'atelier s'élimine : ${eur(-cession)}`, { indice: "ce que l'atelier a cédé, retranché" }), donnee(0)],
            },
            {
              libelle: "Achats à l'autre centre, charge",
              cellules: [VIDE, aSaisir(cession, `les cessions de l'atelier : ${eur(cession)}`), aSaisir(-cession, `la charge du service commercial s'élimine : ${eur(-cession)}`, { indice: "ce que le service commercial a acheté, retranché" }), donnee(0)],
            },
            { libelle: "Charges variables", cellules: [aSaisir(m.atelier.variables, `${qte(q)} × ${eur(x.cv)} = ${eur(m.atelier.variables)}`), VIDE, VIDE, aSaisir(m.atelier.variables, `celles de l'atelier : ${eur(m.atelier.variables)}`)] },
            { libelle: "Charges fixes", cellules: [donnee(m.atelier.fixes), donnee(m.commercial.fixes), VIDE, donnee(auCentime(m.atelier.fixes + m.commercial.fixes))] },
            {
              libelle: "Résultat du mois",
              fort: true,
              totalDe: { plus: [0, 1], moins: [2, 3, 4] },
              cellules: [
                aSaisir(m.atelier.resultat, `${eur(cession)} − ${eur(m.atelier.variables)} − ${eur(m.atelier.fixes)} = ${eur(m.atelier.resultat)}`),
                aSaisir(m.commercial.resultat, `${eur(m.commercial.ventes)} − ${eur(cession)} − ${eur(m.commercial.fixes)} = ${eur(m.commercial.resultat)}`),
                donnee(0),
                aSaisir(m.nova, `${eur(m.atelier.resultat)} + ${eur(m.commercial.resultat)} = ${eur(m.nova)}`),
              ],
            },
          ],
        };
      },
      explication: (c) => {
        const x = centresDuChapitre(c);
        const m = x.mars;
        const t = x.reporting.trimestre;
        return [
          `${x.f.entreprise} gagne ${eur(m.nova)} en ${m.nom}, le résultat du tableau de bord. Additionner les produits des deux centres compterait deux fois les mêmes enceintes : les ${eur(m.atelier.cessions)} de cessions ne sont ni un produit ni une charge de ${x.f.entreprise}. La direction les élimine, et la somme des résultats des centres refait celui de l'entreprise.`,
          `Sur le trimestre, l'atelier cumule ${eur(t.atelier)}, le service commercial ${eur(t.commercial)}, ${x.f.entreprise} ${eur(t.nova)}.`,
        ];
      },
    },
    {
      id: "la-remontee-des-comptes",
      objectifs: [4],
      type: "choix",
      titre: "La remontée des comptes",
      notions: ["dashboard"],
      question: (c) => {
        const x = centresDuChapitre(c);
        return `Début ${x.nom(MOIS_DU_REPORTING_REMPLI + 1)}, le service commercial a remonté son résultat de ${x.mars.nom}. L'atelier n'a encore rien envoyé, et propose de remonter le sien au coût réel, « c'est plus simple ». Que lui demande le contrôleur de gestion ?`;
      },
      options: () => [
        {
          texte: "Les mêmes règles et la même date que l'autre centre",
          juste: true,
          retour:
            "Oui. Le reporting remonte du centre à la direction selon une procédure : une périodicité (chaque mois), une date limite, un même format et les mêmes règles, dont le prix de cession que la direction a fixé. Sans cela, les centres ne se comparent pas d'un mois à l'autre, et leurs résultats ne refont plus celui de l'entreprise.",
        },
        {
          texte: "Rien : chaque centre remonte comme il veut, seul le total compte",
          juste: false,
          retour: "Non : au coût réel pour l'un et au prix de marché pour l'autre, la même cession serait comptée à deux montants, et le total des centres ne referait plus le résultat de l'entreprise.",
        },
        {
          texte: "D'attendre la clôture de l'exercice, quand les comptes seront sûrs",
          juste: false,
          retour: "Non : un reporting sert à piloter pendant l'année. Une fois par an, il arriverait trop tard pour corriger quoi que ce soit.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["full_unit_cost", "make_or_buy", "dashboard"],
      texte: (c) => {
        const x = centresDuChapitre(c);
        return [
          `Vous avez découpé ${x.f.entreprise} en deux centres et fixé le prix de cession de l'atelier. Au prix de marché (${eur(x.marche)}), au coût standard (${eur(x.standard)}) ou au coût réel (${eur(x.reel)} en janvier), le résultat de ${x.f.entreprise} reste ${eur(x.trois.marche.nova)}. Seul le partage change. Le coût standard laisse à l'atelier la sous-activité, le coût réel lui laisse ses dérives et pousse le service commercial vers le sous-traitant, ce qui coûterait ${eur(x.perteDehors)} à ${x.f.entreprise}.`,
          `Vous avez fixé le coût cible de la ${LA_GO.nom}, ${eur(x.cible.coutCible)}, et l'avez réparti par fonction pour savoir où retirer ${eur(x.cible.ecart)}. Vous avez lu le modèle relationnel du PGI, choisi la requête qui extrait les ventes d'un mois, et rempli le reporting des centres en éliminant les cessions internes.`,
          "Au niveau de l'examen, vous savez calculer le résultat d'un centre à chacun des trois prix de cession, et dire ce que chacun fait faire aux responsables. Vous savez borner un prix de cession entre le coût variable et le prix de marché, calculer un coût cible et ses écarts par fonction, et compléter un reporting.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Résultat de l'entreprise = somme des résultats des centres, cessions internes éliminées. Coût standard = coût variable + charges fixes ÷ activité normale. Seuil d'un centre = charges fixes ÷ (prix de cession − coût variable). Coût cible = prix accepté par le marché − marge visée.",
    },
  ],
};
