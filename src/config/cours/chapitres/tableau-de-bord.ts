import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { donneesDuMois, investissementDeLaFiche, leviersDeBase, tableauDeBord, type LeviersDuSemestre } from "../monde/couts-et-budgets";
import { DELAI_CONVENU_DE_CAMPUSTECH, GESTION_DU_COURS, type CodeDIndicateur, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE TABLEAU DE BORD (contrôle de gestion, palier 4 ; BTS CG, DCG UE11, BUT GEA et GACO).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : NOVA a une
 * fiche de gestion figée (monde/nova-gestion.ts) et le tableau de bord se calcule par le modèle du
 * cours (monde/couts-et-budgets.ts, `tableauDeBord`), sur le même semestre que le budget de
 * trésorerie. Une évolution du moteur ne change rien ici.
 *
 * L'objet : le tableau de bord mensuel de NOVA, de janvier à juin, et ses quatre voyants (l'indice
 * de sécurité, le résultat, la trésorerie de fin de mois, la part de marché), chacun avec son seuil
 * d'alerte. L'élève calcule les indicateurs d'un mois, lit le semestre, voit les indicateurs
 * diverger (le résultat monte de février à mars quand la trésorerie baisse), puis construit lui-même
 * un indicateur : sa cible et son seuil d'alerte, à rebours, en enceintes.
 *
 * Le piège central : un voyant éteint ne dit pas que tout va bien. Le résultat peut rester au vert
 * pendant que la trésorerie passe au rouge ; un tableau de bord suit plusieurs faces, et il constate
 * plus qu'il ne prévoit.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, les-indicateurs-de-fevrier (la formule est au repère, la question nomme les
 *     chiffres) ;
 *   · autonome : les-voyants, part-de-marche, resultat-et-tresorerie, choisir (l'élève lit le
 *     tableau du semestre et ses seuils d'alerte, sans chiffre désigné) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-l-alerte
 *     puis l-alerte-au-curseur (les ventes du mois, la marge de sécurité face à 5 % du chiffre
 *     d'affaires) avant construire-un-indicateur ; predire-la-divergence puis le laboratoire avant
 *     resultat-et-tresorerie et du-resultat-a-la-tresorerie ;
 *   · le laboratoire : le-laboratoire-des-voyants (prix, publicité, délai de CampusTech, achat du
 *     banc : allumer le voyant de trésorerie sans celui du résultat), avec un graphique du résultat
 *     et de la trésorerie selon le délai de CampusTech ;
 *   · expert : construire-un-indicateur (la cible et le seuil d'alerte, à rebours), la-cible-et-
 *     l-alerte (où placer un seuil d'alerte), du-resultat-a-la-tresorerie (le passage du résultat à
 *     la variation de trésorerie d'un mois), les-limites (ce que le tableau de bord ne voit pas) ;
 *     puis la synthèse.
 */

/** Le mois que l'élève calcule pas à pas : février, le mois court et calme, sous le seuil. */
export const MOIS_GUIDE = 1;

/**
 * LA CIBLE DE L'INDICE DE SÉCURITÉ, hypothèse du cours : le dirigeant vise un indice de 20 % chaque
 * mois, la marge qui laisse passer une mauvaise saison. Le seuil d'alerte, lui, est celui de la fiche.
 */
export const CIBLE_DE_L_INDICE = 0.2;

/** Les bornes du curseur des ventes du mois, en enceintes. */
export const VENTES_DU_CURSEUR = { min: 1_400, max: 1_700 } as const;

/** Le paiement de CampusTech que suppose le pari : 140 jours après la facture au lieu de 80, un retard bien plus long. */
export const DELAI_DU_PARI = 140;

/** Les leviers du laboratoire : bornes et pas du prix (€), de la publicité (€ par mois) et du délai de CampusTech (jours). */
export const LEVIERS_DES_VOYANTS = {
  prix: { min: 55, max: 63, pas: 0.1 },
  publicite: { min: 0, max: 5_000, pas: 100 },
  campustech: { min: 0, max: 180, pas: 10 },
} as const;

/** Le tableau de bord se calcule sur la fiche de gestion du cours : celle de NOVA. */
export const ENTREPRISES_DU_TABLEAU_DE_BORD: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
// « + 0 » : un arrondi à zéro ne s'écrit pas « −0,0 % ».
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Un taux en pourcentage, au dixième : « 35,6 % ». */
const pct = (t: number) => `${auDixieme(t * 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
/** Un niveau sans décimale inutile : « 20 % ». */
const niveau = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plafond = (x: number) => Math.ceil(x - 1e-9);

/** Le nom de chaque voyant, dans l'ordre de la fiche. */
export const NOMS_DES_VOYANTS: Readonly<Record<CodeDIndicateur, string>> = {
  indiceDeSecurite: "indice de sécurité",
  resultat: "résultat",
  tresorerie: "trésorerie",
  partDeMarche: "part de marché",
};

/** Le voyant d'un indicateur, avec son article : « le voyant de la trésorerie ». */
const DU_VOYANT: Readonly<Record<CodeDIndicateur, string>> = {
  indiceDeSecurite: "de l'indice de sécurité",
  resultat: "du résultat",
  tresorerie: "de la trésorerie",
  partDeMarche: "de la part de marché",
};

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** Une position du laboratoire, lue en leviers du modèle (banc : 0 pour ne pas l'acheter, sinon son mois). */
export function leviersDesVoyants(f: FicheDeGestion, p: Readonly<Record<string, number>>): Partial<LeviersDuSemestre> {
  return {
    prix: auCentime(p.prix!),
    budgetMarketing: p.publicite!,
    delais: { ...leviersDeBase(f).delais, campustech: p.campustech! },
    investissement: p.banc! > 0 ? { mois: p.banc!, montantHt: f.semestre.investissement.montantHt } : null,
  };
}

/** Le semestre d'une position du laboratoire. */
export const semestreDuLaboratoire = (f: FicheDeGestion, p: Readonly<Record<string, number>>) => tableauDeBord(f, leviersDesVoyants(f, p)).semestre;

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise (la fiche est figée). */
export function tableauDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = tableauDeBord(f);
  const mois = t.mois;
  const d = donneesDuMois(f);
  const alerte = f.seuilsDAlerte;
  const fev = mois[MOIS_GUIDE]!;
  const margeUnitaire = auCentime(d.prix - d.coutVariableUnitaire);
  const seuil = fev.seuil;
  /** Le seuil de rentabilité en quantité : sous lui, le résultat du mois est négatif. */
  const seuilEnQuantite = plafond(d.chargesFixes / margeUnitaire);
  // L'indicateur construit à rebours : le chiffre d'affaires qui donne l'indice d'alerte, puis la cible.
  const chiffreDAlerte = auCentime(seuil / (1 - alerte.indiceDeSecurite));
  const ventesDAlerte = plafond(seuil / (1 - alerte.indiceDeSecurite) / d.prix);
  const chiffreDeLaCible = auCentime(seuil / (1 - CIBLE_DE_L_INDICE));
  const ventesDeLaCible = plafond(seuil / (1 - CIBLE_DE_L_INDICE) / d.prix);
  const allumes = (k: number) => (Object.keys(mois[k]!.voyants) as CodeDIndicateur[]).filter((v) => mois[k]!.voyants[v]);
  const premierEnGagnant = mois.findIndex((m, k) => allumes(k).length > 0 && m.resultat >= 0);
  // Le premier passage d'un mois au suivant où le résultat et la trésorerie vont en sens contraires.
  const desaccord = mois.findIndex((m, k) => k > 0 && (m.resultat - mois[k - 1]!.resultat) * (m.tresorerie - mois[k - 1]!.tresorerie) < 0);
  const b = t.budget.mois;
  const k = desaccord;
  // Le passage du résultat à la variation de trésorerie du mois k.
  const usure = f.moisDeReference.chargesFixes.amortissement;
  const passage = {
    resultat: mois[k]!.resultat,
    avantLesDelais: auCentime(mois[k]!.resultat + usure),
    creances: auCentime(b[k]!.ventesTtc - b[k]!.encaissements.total),
    fournisseur: auCentime(b[k]!.achatsTtc - b[k]!.decaissements.fournisseur),
    tva: auCentime(b[k]!.tva.solde - b[k]!.decaissements.tva),
    sociales: auCentime(f.semestre.paie.cotisations - b[k]!.decaissements.cotisations),
    emprunt: b[k]!.decaissements.emprunt,
    variation: auCentime(b[k]!.tresorerieFin - b[k]!.tresorerieDebut),
  };
  // Le laboratoire : le départ, et ce qui allume le voyant de trésorerie sans celui du résultat.
  const depart = { prix: d.prix, publicite: 0, campustech: f.semestre.clienteles.find((x) => x.code === "campustech")!.delai, banc: 0 };
  const inv = investissementDeLaFiche(f);
  const L = LEVIERS_DES_VOYANTS;
  const grille = (g: { min: number; max: number; pas: number }) => Array.from({ length: Math.round((g.max - g.min) / g.pas) + 1 }, (_, i) => auCentime(g.min + i * g.pas));
  const allumeSansLeResultat = (p: Record<string, number>) => {
    const s = semestreDuLaboratoire(f, p);
    return s.voyants.tresorerie && !s.voyants.resultat;
  };
  const delaiQuiAllume = Math.min(...grille(L.campustech).filter((v) => allumeSansLeResultat({ ...depart, campustech: v })));
  const publiciteQuiAllume = Math.min(...grille(L.publicite).filter((v) => allumeSansLeResultat({ ...depart, publicite: v })));
  const avecLeBanc = semestreDuLaboratoire(f, { ...depart, banc: inv.mois });
  const auPari = tableauDeBord(f, { delais: { ...leviersDeBase(f).delais, campustech: DELAI_DU_PARI } }).semestre;
  return {
    f,
    t,
    mois,
    d,
    alerte,
    fev,
    margeUnitaire,
    seuil,
    seuilEnQuantite,
    chiffreDAlerte,
    ventesDAlerte,
    chiffreDeLaCible,
    ventesDeLaCible,
    allumes,
    premierEnGagnant,
    desaccord,
    passage,
    depart,
    inv,
    delaiQuiAllume,
    publiciteQuiAllume,
    avecLeBanc,
    auPari,
    sousLaCible: mois.filter((m) => m.indiceDeSecurite < CIBLE_DE_L_INDICE).map((m) => m.nom),
    tiennentLaCible: mois.filter((m) => m.quantite >= ventesDeLaCible).map((m) => m.nom),
    sousLAlerte: mois.filter((m) => m.quantite < ventesDAlerte).map((m) => m.nom),
    nom: (i: number) => mois[i]!.nom,
  };
}

/** « janvier, février et mars » : une liste de mois. */
const liste = (noms: readonly string[]) => (noms.length < 2 ? (noms[0] ?? "aucun") : `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}`);

/** Ce que l'élève a sous les yeux en ouvrant le chapitre : les ventes, le marché et la trésorerie. */
export function tableauDuSemestre(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = tableauDuChapitre(c);
  return {
    titre: `Le semestre ${dE(x.f.entreprise)}`,
    colonnes: x.mois.map((m) => majuscule(m.nom)),
    lignes: [
      { libelle: `Enceintes vendues par ${x.f.entreprise}`, valeurs: x.mois.map((m) => qte(m.quantite)) },
      { libelle: "Enceintes vendues par tout le marché", valeurs: x.f.semestre.marche.map(qte) },
      { libelle: "Trésorerie de fin de mois, au budget", valeurs: x.mois.map((m) => eur(m.tresorerie)) },
    ],
  };
}

/** Le tableau de bord du semestre, mois par mois ; avec ses voyants, une fois qu'on les a lus. */
export function tableauDeBordDuSemestre(c: Pick<Cas, "code">, avecLesVoyants = false): TableauDeDonnees {
  const x = tableauDuChapitre(c);
  const ligne = (libelle: string, v: (m: (typeof x.mois)[number]) => string) => ({ libelle, valeurs: x.mois.map(v) });
  return {
    titre: `Le tableau de bord ${dE(x.f.entreprise)}, mois par mois`,
    colonnes: x.mois.map((m) => majuscule(m.nom)),
    lignes: [
      ligne("Enceintes vendues", (m) => qte(m.quantite)),
      ligne("Chiffre d'affaires", (m) => eur(m.chiffreDAffaires)),
      ligne("Taux de marge sur coût variable", (m) => pct(m.tauxDeMarge)),
      ligne("Indice de sécurité", (m) => pct(m.indiceDeSecurite)),
      ligne("Résultat du mois", (m) => eur(m.resultat)),
      ligne("Trésorerie de fin de mois", (m) => eur(m.tresorerie)),
      ligne("Part de marché", (m) => pct(m.partDeMarche)),
      ...(avecLesVoyants ? [{ libelle: "Voyants allumés", valeurs: x.mois.map((_, k) => x.allumes(k).map((v) => NOMS_DES_VOYANTS[v]).join(", ") || "aucun") }] : []),
    ],
  };
}

export const TABLEAU_DE_BORD: Chapitre = {
  code: "tableau-de-bord",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
    "BTS MHR Bloc 4 · Pilotage de la production de services en hôtellerie restauration",
  ],
  titre: "Le tableau de bord",
  accroche:
    "Le semestre de NOVA en quelques indicateurs, chacun avec son voyant : les calculer, les lire, les voir diverger, puis construire soi-même un indicateur, sa cible et son seuil d'alerte, et dire ce qu'un tableau de bord ne voit pas.",
  objectifs: [
    "Calculer les indicateurs d'un mois : taux de marge, seuil de rentabilité, indice de sécurité, résultat",
    "Lire un tableau de bord dans le temps et repérer le voyant qui s'allume",
    "Expliquer pourquoi le résultat et la trésorerie divergent, et passer de l'un à l'autre",
    "Construire un indicateur à rebours : sa cible et son seuil d'alerte",
    "Choisir les indicateurs utiles au pilotage et dire les limites du tableau de bord",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_TABLEAU_DE_BORD,
    pourquoi: "le tableau de bord se lit ici sur le semestre de NOVA dans la simulation du cours, le même que son budget de trésorerie ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Peu d'indicateurs, suivis dans le temps",
      notions: ["dashboard", "safety_margin"],
      tableau: tableauDuSemestre,
      texte: (c) => {
        const x = tableauDuChapitre(c);
        const a = x.alerte;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}, de janvier à juin : le semestre de son budget de trésorerie. ${x.f.entreprise} vend une enceinte ${eur(x.d.prix)} HT, qui lui coûte ${eur(x.d.coutVariableUnitaire)} de coût variable ; ses charges fixes font ${eur(x.d.chargesFixes)} par mois, quoi qu'elle vende. La trésorerie de fin de mois est celle du budget ; le marché, ${x.f.entreprise} et ses concurrents réunis, grandit au printemps. La simulation suppose que les ventes ne répondent pas au prix.`,
          `Le dirigeant ne lira pas ${qte(x.mois.length)} comptes de résultat et ${qte(x.mois.length)} budgets : il lui faut une page, qu'il lit en deux minutes. Un tableau de bord retient peu d'indicateurs, ceux qui disent si l'entreprise va bien et où agir : la rentabilité, l'argent, la position face aux concurrents. Il les suit dans le temps : c'est l'évolution qui alerte, plus que le chiffre d'un mois.`,
          `Chaque indicateur a son voyant, qui s'allume quand il passe sous son seuil d'alerte : l'indice de sécurité sous ${niveau(a.indiceDeSecurite)}, le résultat du mois sous ${eur(a.resultat)}, la trésorerie de fin de mois sous ${eur(a.tresorerie)}, la part de marché sous ${niveau(a.partDeMarche)}.`,
        ];
      },
      repere: () =>
        "Taux de marge = marge sur coût variable ÷ chiffre d'affaires. Seuil de rentabilité = charges fixes ÷ taux de marge. Indice de sécurité = (chiffre d'affaires − seuil) ÷ chiffre d'affaires. Part de marché = ventes de l'entreprise ÷ ventes du marché.",
    },
    {
      id: "les-indicateurs-de-fevrier",
      type: "montants",
      titre: "Les indicateurs d'un mois",
      notions: ["margin_rates", "breakeven", "safety_margin"],
      question: (c) => {
        const x = tableauDuChapitre(c);
        const n = x.fev.nom;
        return `En ${n}, ${x.f.entreprise} vend ${qte(x.fev.quantite)} enceintes à ${eur(x.d.prix)} HT ; une enceinte lui coûte ${eur(x.d.coutVariableUnitaire)} de coût variable, et ses charges fixes du mois font ${eur(x.fev.chargesFixes)}. Calculez le taux de marge sur coût variable (en %, au dixième), le seuil de rentabilité du mois, l'indice de sécurité (en %, au dixième, négatif sous le seuil), puis le résultat du mois (négatif pour une perte).`;
      },
      champs: (c) => {
        const x = tableauDuChapitre(c);
        const m = x.fev;
        return [
          {
            libelle: "Taux de marge sur coût variable (%)",
            attendu: auDixieme(m.tauxDeMarge * 100),
            calcul: `${eur(m.marge)} ÷ ${eur(m.chiffreDAffaires)} = ${pct(m.tauxDeMarge)}, soit ${eur(x.margeUnitaire)} ÷ ${eur(x.d.prix)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Seuil de rentabilité du mois",
            attendu: m.seuil,
            calcul: `${eur(m.chargesFixes)} ÷ (${eur(m.marge)} ÷ ${eur(m.chiffreDAffaires)}) = ${eur(m.seuil)}, avec le taux exact ; avec ${pct(m.tauxDeMarge)}, on trouve à peu près le même seuil`,
            // Le taux arrondi au dixième que l'élève emploie déplace le seuil d'environ un millième.
            tolerance: Math.max(2, Math.round(m.seuil * 0.003)),
          },
          {
            libelle: "Indice de sécurité (%)",
            attendu: auDixieme(m.indiceDeSecurite * 100),
            calcul: `(${eur(m.chiffreDAffaires)} − ${eur(m.seuil)}) ÷ ${eur(m.chiffreDAffaires)} = ${pct(m.indiceDeSecurite)}`,
            tolerance: 0.2,
          },
          {
            libelle: "Résultat du mois",
            attendu: m.resultat,
            calcul: `${eur(m.marge)} − ${eur(m.chargesFixes)} = ${eur(m.resultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const x = tableauDuChapitre(c);
        const m = x.fev;
        return [
          m.indiceDeSecurite >= 0
            ? `${majuscule(m.nom)} est au-dessus du seuil : son chiffre d'affaires pourrait baisser de ${pct(m.indiceDeSecurite)} avant que ${x.f.entreprise} ne perde de l'argent.`
            : `${majuscule(m.nom)} est sous le seuil : il manque ${eur(auCentime(m.seuil - m.chiffreDAffaires))} de chiffre d'affaires pour ne pas perdre d'argent. ${x.allumes(MOIS_GUIDE).length} voyants s'allument, ${liste(x.allumes(MOIS_GUIDE).map((v) => NOMS_DES_VOYANTS[v]))}.`,
          `Le seuil, ${eur(m.seuil)}, est le même chaque mois du semestre : le prix, le coût variable et les charges fixes ne bougent pas. Ce sont les ventes qui font varier l'indice.`,
        ];
      },
    },
    {
      id: "les-voyants",
      type: "choix",
      titre: "Le voyant qui s'allume",
      notions: ["dashboard", "safety_margin", "net_treasury"],
      tableau: (c) => tableauDeBordDuSemestre(c),
      question: (c) => {
        const x = tableauDuChapitre(c);
        const a = x.alerte;
        return `Voici le tableau de bord du semestre. Les seuils d'alerte : indice de sécurité ${niveau(a.indiceDeSecurite)}, résultat ${eur(a.resultat)}, trésorerie ${eur(a.tresorerie)}, part de marché ${niveau(a.partDeMarche)}. Quel est le premier mois où un voyant s'allume alors que ${x.f.entreprise} gagne de l'argent ?`;
      },
      options: (c) => {
        const x = tableauDuChapitre(c);
        const p = x.premierEnGagnant;
        const dit = (k: number) => {
          const m = x.mois[k]!;
          const v = x.allumes(k);
          if (k === p) {
            const marche = v.includes("partDeMarche") ? ` Sa part de marché tombe à ${pct(m.partDeMarche)} : le chiffre d'affaires monte, mais le marché grandit plus vite que ${x.f.entreprise}.` : "";
            return `Oui : ${x.f.entreprise} y gagne ${eur(m.resultat)}, et pourtant le voyant ${v.map((y) => DU_VOYANT[y]).join(" et celui ")} s'allume.${marche}`;
          }
          if (m.resultat < 0) return `Non : en ${m.nom}, ${v.length} voyants s'allument, mais ${x.f.entreprise} y perd ${eur(-m.resultat)}.`;
          if (v.length === 0) return `Non : en ${m.nom}, aucun voyant ne s'allume. La trésorerie, ${eur(m.tresorerie)}, reste au-dessus de ${eur(x.alerte.tresorerie)}, et l'indice, ${pct(m.indiceDeSecurite)}, au-dessus de ${niveau(x.alerte.indiceDeSecurite)}.`;
          return `Non : le voyant y est allumé, mais il l'était déjà en ${x.nom(p)}.`;
        };
        const proposes = [1, 2, p, p + 1].filter((k, i, a) => k >= 0 && k < x.mois.length && a.indexOf(k) === i);
        return [
          ...proposes.map((k) => ({ texte: majuscule(x.nom(k)), juste: k === p, retour: dit(k) })),
          {
            texte: "Aucun mois",
            juste: p < 0,
            retour: p < 0 ? "Oui : aucun voyant ne s'allume sur un mois gagnant." : `Non : en ${x.nom(p)}, ${x.f.entreprise} gagne de l'argent et un voyant s'allume pourtant.`,
          },
        ];
      },
    },
    {
      id: "part-de-marche",
      type: "choix",
      titre: "La part de marché",
      notions: ["demand_market_share", "dashboard"],
      tableau: (c) => tableauDeBordDuSemestre(c),
      question: (c) => {
        const x = tableauDuChapitre(c);
        const [a, z] = [x.mois[0]!, x.mois.at(-1)!];
        return `La part de marché de ${x.f.entreprise} passe de ${pct(a.partDeMarche)} en ${a.nom} à ${pct(z.partDeMarche)} en ${z.nom}, alors que ses ventes passent de ${qte(a.quantite)} à ${qte(z.quantite)} enceintes. Que dit cet indicateur que le résultat ne dit pas ?`;
      },
      options: () => [
        {
          texte: "La position face aux concurrents : on peut gagner de l'argent sur un marché qui grandit tout en y perdant du terrain.",
          juste: true,
          retour:
            "C'est cela. Le résultat dit si l'entreprise gagne de l'argent ; la part de marché dit si elle tient sa place. La seconde annonce souvent le premier, quelques mois plus tôt : un marché qui grandit sans vous finit par se passer de vous.",
        },
        {
          texte: "Rien de plus : la part de marché suit toujours le chiffre d'affaires.",
          juste: false,
          retour: "Le chiffre d'affaires peut monter avec le marché pendant que la part baisse : les concurrents montent plus vite.",
        },
        {
          texte: "Le niveau de la trésorerie.",
          juste: false,
          retour: "La part de marché ne dit rien de l'argent en banque : elle compare les ventes à celles des concurrents.",
        },
      ],
    },
    {
      id: "predire-l-alerte",
      type: "choix",
      titre: "Pariez sur le voyant de l'indice",
      notions: ["safety_margin", "dashboard"],
      question: (c) => {
        const x = tableauDuChapitre(c);
        return `Avant de calculer, pariez. Le voyant du résultat s'allume dès que ${x.f.entreprise} perd de l'argent : sous ${qte(x.seuilEnQuantite)} enceintes par mois, son seuil de rentabilité en quantité. Celui de l'indice de sécurité s'allume sous ${niveau(x.alerte.indiceDeSecurite)}. À votre avis, il s'allume…`;
      },
      options: (c) => {
        const x = tableauDuChapitre(c);
        const voir = "Faites varier les ventes du mois à l'étape suivante : le curseur montre où le voyant de l'indice s'allume.";
        return [
          { texte: "Avant celui du résultat, quand NOVA gagne encore de l'argent", juste: x.ventesDAlerte > x.seuilEnQuantite, retour: `Bon pari. ${voir}` },
          { texte: "En même temps : sous ce seuil, NOVA perd déjà de l'argent", juste: x.ventesDAlerte === x.seuilEnQuantite, retour: `Pari à vérifier. ${voir}` },
          { texte: "Après : il faut perdre de l'argent pour descendre si bas", juste: x.ventesDAlerte < x.seuilEnQuantite, retour: `Pari à vérifier. ${voir}` },
        ].map((o) => ({ ...o, texte: o.texte.replace("NOVA", x.f.entreprise) }));
      },
    },
    {
      id: "l-alerte-au-curseur",
      type: "curseur",
      titre: "Le voyant de l'indice, au curseur",
      notions: ["safety_margin", "breakeven"],
      question: (c) => {
        const x = tableauDuChapitre(c);
        return `Faites varier les ventes du mois, de ${qte(VENTES_DU_CURSEUR.min)} à ${qte(VENTES_DU_CURSEUR.max)} enceintes. Une droite donne la marge de sécurité (le chiffre d'affaires moins le seuil, ${eur(x.seuil)}), l'autre ${niveau(x.alerte.indiceDeSecurite)} du chiffre d'affaires. Placez le curseur sur le plus petit nombre d'enceintes où le voyant de l'indice reste éteint, puis validez.`;
      },
      grandeur: () => ({ libelle: "Enceintes vendues dans le mois", unite: "enceintes" }),
      cible: (c) => {
        const x = tableauDuChapitre(c);
        return { attendu: x.ventesDAlerte, min: VENTES_DU_CURSEUR.min, max: VENTES_DU_CURSEUR.max };
      },
      zones: ["Voyant éteint", "Voyant allumé"],
      rates: () => ({
        dessous: "À cette position, l'indice de sécurité est sous son seuil d'alerte : le voyant est allumé.",
        dessus: "Avec moins d'enceintes, le voyant reste encore éteint : cherchez la plus petite quantité.",
      }),
      montrer: "Montrer le seuil d'alerte",
      lecture: (c, q) => {
        const x = tableauDuChapitre(c);
        const ca = auCentime(q * x.d.prix);
        return [
          { libelle: "Chiffre d'affaires du mois", montant: ca },
          { libelle: "Marge de sécurité", montant: auCentime(ca - x.seuil) },
          { libelle: `${niveau(x.alerte.indiceDeSecurite)} du chiffre d'affaires`, montant: auCentime(ca * x.alerte.indiceDeSecurite) },
          { libelle: "Résultat du mois", montant: auCentime(q * x.margeUnitaire - x.d.chargesFixes), fort: true },
        ];
      },
      droites: (c) => {
        const x = tableauDuChapitre(c);
        return {
          produit: (q) => q * x.d.prix - x.seuil,
          cout: (q) => q * x.d.prix * x.alerte.indiceDeSecurite,
          libelles: ["Marge de sécurité", `${niveau(x.alerte.indiceDeSecurite)} du chiffre d'affaires`],
        };
      },
      explication: (c) => {
        const x = tableauDuChapitre(c);
        const r = auCentime(x.ventesDAlerte * x.margeUnitaire - x.d.chargesFixes);
        return [
          `Le voyant de l'indice s'allume sous ${qte(x.ventesDAlerte)} enceintes, ${qte(x.ventesDAlerte - x.seuilEnQuantite)} de plus que le seuil de rentabilité (${qte(x.seuilEnQuantite)}). À ${qte(x.ventesDAlerte)}, ${x.f.entreprise} gagne encore ${eur(r)} : le voyant prévient avant la perte, c'est son rôle.`,
          "Un seuil d'alerte se place avant le seuil de la catastrophe, pour laisser le temps d'agir. L'étape suivante le construit à rebours, avec une cible.",
        ];
      },
    },
    {
      id: "construire-un-indicateur",
      type: "montants",
      titre: "Construire un indicateur, à rebours",
      notions: ["safety_margin", "dashboard"],
      question: (c) => {
        const x = tableauDuChapitre(c);
        return `Le dirigeant veut écrire l'indicateur en enceintes, plus parlant pour l'équipe, avec une cible, un indice de sécurité de ${niveau(CIBLE_DE_L_INDICE)}, et son seuil d'alerte, ${niveau(x.alerte.indiceDeSecurite)}. Sans formule : retrouvez le chiffre d'affaires mensuel qui donne un indice de ${niveau(x.alerte.indiceDeSecurite)}, les ventes du mois sous lesquelles le voyant s'allume, puis les ventes du mois qui tiennent la cible (à l'enceinte supérieure).`;
      },
      champs: (c) => {
        const x = tableauDuChapitre(c);
        const a = x.alerte.indiceDeSecurite;
        return [
          {
            libelle: "Chiffre d'affaires du mois au seuil d'alerte",
            attendu: x.chiffreDAlerte,
            calcul: `l'indice vaut 1 − seuil ÷ chiffre d'affaires : ${eur(x.seuil)} ÷ (1 − ${niveau(a)}) = ${eur(x.chiffreDAlerte)}`,
            tolerance: Math.max(2, Math.round(x.chiffreDAlerte * 0.003)),
          },
          {
            libelle: "Ventes du mois au seuil d'alerte",
            attendu: x.ventesDAlerte,
            calcul: `${eur(x.chiffreDAlerte)} ÷ ${eur(x.d.prix)} = ${qte(auCentime(x.seuil / (1 - a) / x.d.prix))}, soit ${qte(x.ventesDAlerte)} enceintes : le voyant s'allume en dessous`,
            // Un taux de marge arrondi au dixième peut faire perdre une enceinte.
            tolerance: 1,
          },
          {
            libelle: "Ventes du mois de la cible",
            attendu: x.ventesDeLaCible,
            calcul: `${eur(x.seuil)} ÷ (1 − ${niveau(CIBLE_DE_L_INDICE)}) ÷ ${eur(x.d.prix)} = ${eur(x.chiffreDeLaCible)} ÷ ${eur(x.d.prix)} = ${qte(auCentime(x.seuil / (1 - CIBLE_DE_L_INDICE) / x.d.prix))}, soit ${qte(x.ventesDeLaCible)} enceintes`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const x = tableauDuChapitre(c);
        return [
          `Le seuil d'alerte et la cible ne disent pas la même chose : sous ${qte(x.ventesDAlerte)} enceintes, le voyant demande d'agir ; à ${qte(x.ventesDeLaCible)}, l'objectif est tenu. Au semestre, ${x.f.entreprise} tient la cible en ${liste(x.tiennentLaCible)}, et passe sous l'alerte en ${liste(x.sousLAlerte)}.`,
          "L'indice se divise par (1 − le niveau), parce qu'il se rapporte au chiffre d'affaires et non au seuil : majorer le seuil du niveau voulu donnerait un chiffre trop bas.",
        ];
      },
    },
    {
      id: "la-cible-et-l-alerte",
      type: "choix",
      titre: "Où placer le seuil d'alerte",
      notions: ["dashboard", "safety_margin"],
      question: (c) => {
        const x = tableauDuChapitre(c);
        return `Le dirigeant hésite sur le seuil d'alerte de l'indice de sécurité : ${niveau(0)}, ${niveau(x.alerte.indiceDeSecurite)} ou ${niveau(CIBLE_DE_L_INDICE)}, sa cible. Que lui conseillez-vous ?`;
      },
      options: (c) => {
        const x = tableauDuChapitre(c);
        return [
          {
            texte: `${niveau(x.alerte.indiceDeSecurite)}, sous la cible : il s'allume avant la perte`,
            juste: true,
            retour: `Oui. Le voyant prévient entre ${qte(x.seuilEnQuantite)} et ${qte(x.ventesDAlerte - 1)} enceintes, quand ${x.f.entreprise} gagne encore de l'argent mais n'a plus de marge : il laisse le temps d'agir. La cible, elle, se suit à côté, comme un objectif.`,
          },
          {
            texte: `${niveau(0)} : un voyant ne s'allume que pour une perte`,
            juste: false,
            retour: "Non : un indice sous 0 %, c'est un résultat négatif. Le voyant s'allumerait en même temps que celui du résultat : il ne dirait rien de plus, et trop tard.",
          },
          {
            texte: `${niveau(CIBLE_DE_L_INDICE)}, la cible : tout mois sous la cible doit alerter`,
            juste: false,
            retour: `Non : il s'allumerait en ${liste(x.sousLaCible)}, ${x.sousLaCible.length} mois sur ${x.mois.length}. Un voyant toujours allumé ne signale plus rien : une cible se suit, un seuil d'alerte fait agir.`,
          },
        ];
      },
    },
    {
      id: "predire-la-divergence",
      type: "choix",
      titre: "Pariez sur le résultat et la trésorerie",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const x = tableauDuChapitre(c);
        return `Avant le laboratoire, pariez. Supposez que CampusTech, déjà en retard, paie ${DELAI_DU_PARI} jours après sa facture au lieu de ${x.depart.campustech}, très au-delà des ${DELAI_CONVENU_DE_CAMPUSTECH} jours convenus. Sur le semestre, le résultat de ${x.f.entreprise}…`;
      },
      options: (c) => {
        const x = tableauDuChapitre(c);
        const s = x.t.semestre;
        const p = x.auPari;
        const voir = "Faites payer CampusTech plus tard au laboratoire de l'étape suivante, et regardez chaque voyant.";
        return [
          { texte: "Ne bouge pas, mais la trésorerie baisse", juste: p.resultat === s.resultat && p.tresoreriePlusBasse < s.tresoreriePlusBasse, retour: `Bon pari. ${voir}` },
          { texte: "Baisse, avec la trésorerie", juste: p.resultat < s.resultat, retour: `Pari à vérifier. ${voir}` },
          { texte: "Monte : les mêmes ventes, payées plus tard", juste: p.resultat > s.resultat, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-voyants",
      type: "simulation",
      titre: "Le laboratoire des voyants",
      notions: ["dashboard", "net_treasury", "payment_terms"],
      question: (c) => {
        const x = tableauDuChapitre(c);
        return `Faites varier le prix de l'enceinte, une publicité payée chaque mois, le délai de CampusTech, et l'achat du banc de mesure (${eur(x.inv.montantHt)} HT, amorti sur ${qte(x.f.semestre.investissement.dureeDAmortissementMois)} mois). Le tableau suit le semestre et ses voyants ; les deux lignes en couleur sont vertes tant que leur voyant est éteint, rouges quand il s'allume. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = tableauDuChapitre(c);
        const L = LEVIERS_DES_VOYANTS;
        return [
          { code: "prix", libelle: "Prix de l'enceinte, HT", unite: "€", ...L.prix, depart: x.depart.prix },
          { code: "publicite", libelle: "Publicité, chaque mois, HT", unite: "€", ...L.publicite, depart: x.depart.publicite },
          { code: "campustech", libelle: "Délai de paiement de CampusTech", unite: "jours", ...L.campustech, depart: x.depart.campustech },
          {
            code: "banc",
            libelle: "Banc de mesure",
            unite: "",
            min: 0,
            max: x.inv.mois,
            pas: 1,
            depart: x.depart.banc,
            choix: [
              { valeur: 0, libelle: "pas d'achat" },
              { valeur: x.inv.mois, libelle: `acheté en ${x.nom(x.inv.mois)}` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = tableauDuChapitre(c);
        const s = semestreDuLaboratoire(x.f, p);
        const d = x.t.semestre;
        const nb = (v: typeof s.voyants) => Object.values(v).filter(Boolean).length;
        return [
          { libelle: "Chiffre d'affaires du semestre", montant: s.chiffreDAffaires, reference: d.chiffreDAffaires },
          { libelle: "Indice de sécurité du semestre", montant: auDixieme(s.indiceDeSecurite * 100), unite: "%", reference: auDixieme(d.indiceDeSecurite * 100) },
          { libelle: "Part de marché du semestre", montant: auDixieme(s.partDeMarche * 100), unite: "%", reference: auDixieme(d.partDeMarche * 100) },
          { libelle: "Trésorerie la plus basse du semestre", montant: s.tresoreriePlusBasse, reference: d.tresoreriePlusBasse },
          { libelle: "Résultat du semestre, face à son seuil d'alerte", montant: auCentime(s.resultat - x.alerte.resultat), reference: auCentime(d.resultat - x.alerte.resultat), effet: true },
          {
            libelle: "Trésorerie la plus basse, face à son seuil d'alerte",
            montant: auCentime(s.tresoreriePlusBasse - x.alerte.tresorerie),
            reference: auCentime(d.tresoreriePlusBasse - x.alerte.tresorerie),
            effet: true,
            fort: true,
          },
          { libelle: "Voyants allumés sur le semestre", montant: nb(s.voyants), unite: "sur 4", reference: nb(d.voyants) },
        ];
      },
      // Le résultat ne dépend pas du délai de CampusTech, la trésorerie la plus basse descend par marches.
      graphique: (c) => {
        const x = tableauDuChapitre(c);
        return {
          levier: "campustech",
          courbes: [
            { libelle: "Résultat du semestre", valeur: (p) => semestreDuLaboratoire(x.f, p).resultat },
            { libelle: "Trésorerie la plus basse du semestre", valeur: (p) => semestreDuLaboratoire(x.f, p).tresoreriePlusBasse },
          ],
        };
      },
      defi: (c) => {
        const x = tableauDuChapitre(c);
        return {
          consigne: "Allumez le voyant de trésorerie du semestre sans allumer celui du résultat.",
          atteint: (p) => {
            const s = semestreDuLaboratoire(x.f, p);
            return s.voyants.tresorerie && !s.voyants.resultat;
          },
          indice: (p) => {
            const s = semestreDuLaboratoire(x.f, p);
            return s.voyants.resultat
              ? `Le résultat du semestre est de ${eur(s.resultat)} : son voyant est allumé. Cherchez ce qui retire de l'argent à la banque sans en retirer autant au résultat.`
              : `La trésorerie la plus basse est de ${eur(s.tresoreriePlusBasse)}, au-dessus de ${eur(x.alerte.tresorerie)}. Cherchez ce qui retire de l'argent à la banque sans en retirer au résultat.`;
          },
          solution: { ...x.depart, banc: x.inv.mois },
        };
      },
      explication: (c, p) => {
        const x = tableauDuChapitre(c);
        const s = semestreDuLaboratoire(x.f, p);
        const usure = auCentime(x.inv.montantHt / x.f.semestre.investissement.dureeDAmortissementMois);
        return [
          `Défi relevé : la trésorerie la plus basse est de ${eur(s.tresoreriePlusBasse)}, et le résultat du semestre de ${eur(s.resultat)}. Le voyant de trésorerie s'allume, celui du résultat reste éteint.`,
          `Le banc ne coûte au résultat que son usure, ${eur(usure)} par mois dès ${x.nom(x.inv.mois)} ; il coûte ${eur(auCentime(x.inv.montantHt * (1 + x.f.semestre.tauxDeTva)))} TTC à la trésorerie, d'un coup. CampusTech payant ${x.delaiQuiAllume} jours après sa facture, très en retard, allume le même voyant sans toucher au résultat ; même une publicité de ${eur(x.publiciteQuiAllume)} par mois l'allume avant celui du résultat. Le résultat et la trésorerie ne mesurent pas la même chose : un tableau de bord suit les deux.`,
        ];
      },
    },
    {
      id: "resultat-et-tresorerie",
      type: "choix",
      titre: "Le résultat et la trésorerie",
      notions: ["net_treasury", "bfr"],
      tableau: (c) => tableauDeBordDuSemestre(c),
      question: (c) => {
        const x = tableauDuChapitre(c);
        const k = x.desaccord;
        const [a, b] = [x.mois[k - 1]!, x.mois[k]!];
        return `${majuscule(dE(a.nom))} à ${b.nom}, le résultat du mois passe de ${eur(a.resultat)} à ${eur(b.resultat)}, la trésorerie de fin de mois de ${eur(a.tresorerie)} à ${eur(b.tresorerie)} : l'un monte quand l'autre baisse. Comment est-ce possible ?`;
      },
      options: () => [
        {
          texte: "Le résultat compte les ventes et les charges quand elles naissent, la trésorerie quand elles se paient : délais, TVA et emprunt les séparent.",
          juste: true,
          retour:
            "C'est cela. C'est pourquoi un tableau de bord suit les deux : un mois bénéficiaire peut vider la banque (un client qui paie tard, une échéance d'emprunt), un mois de perte peut la remplir (des créances anciennes qui rentrent).",
        },
        {
          texte: "C'est impossible : le tableau de bord contient une erreur.",
          juste: false,
          retour: "Ce n'est pas une erreur : le résultat et la trésorerie ne mesurent pas la même chose, ni au même moment.",
        },
        {
          texte: "La trésorerie suit le résultat avec exactement un mois de retard.",
          juste: false,
          retour: "Il n'y a pas de règle aussi simple : chaque délai, la TVA et l'emprunt ont leur rythme.",
        },
      ],
    },
    {
      id: "du-resultat-a-la-tresorerie",
      type: "montants",
      titre: "Du résultat à la trésorerie",
      notions: ["net_treasury", "bfr", "depreciation"],
      question: (c) => {
        const x = tableauDuChapitre(c);
        const p = x.passage;
        const n = x.nom(x.desaccord);
        return `Retracez le passage ${dE(n)}, du résultat à la variation de la trésorerie. En ${n}, la dette fournisseur grandit de ${eur(p.fournisseur)} (les composants ${dE(n)}, payés le mois suivant, face à ceux du mois d'avant, payés ce mois-ci) et la TVA due de ${eur(p.tva)}. Sans formule : calculez ce que l'exploitation ${dE(n)} dégage avant les délais (le résultat, plus l'usure de la ligne, qui ne se paie pas), ce que la facture ${dE(n)} de CampusTech retient, l'échéance de l'emprunt, puis la variation de la trésorerie ${dE(n)} (négative pour une baisse).`;
      },
      champs: (c) => {
        const x = tableauDuChapitre(c);
        const p = x.passage;
        const n = x.nom(x.desaccord);
        const usure = x.f.moisDeReference.chargesFixes.amortissement;
        return [
          { libelle: "Ce que l'exploitation dégage avant les délais", attendu: p.avantLesDelais, calcul: `${eur(p.resultat)} de résultat + ${eur(usure)} d'usure = ${eur(p.avantLesDelais)}` },
          { libelle: `Créance ${dE(n)} sur CampusTech, non encaissée`, attendu: p.creances, calcul: `les ventes TTC du mois moins ses encaissements : ${eur(p.creances)}` },
          { libelle: "Échéance de l'emprunt", attendu: p.emprunt, calcul: `le capital et les intérêts du trimestre : ${eur(p.emprunt)}, hors du résultat d'exploitation` },
          {
            libelle: `Variation de la trésorerie ${dE(n)}`,
            attendu: p.variation,
            calcul: `${eur(p.avantLesDelais)} − ${eur(p.creances)} + ${eur(p.fournisseur)} + ${eur(p.tva)}${p.sociales ? ` + ${eur(p.sociales)}` : ""} − ${eur(p.emprunt)} = ${eur(p.variation)}`,
          },
        ];
      },
      explication: (c) => {
        const x = tableauDuChapitre(c);
        const p = x.passage;
        const k = x.desaccord;
        return [
          `Le passage retombe sur le budget : ${eur(x.mois[k - 1]!.tresorerie)} ${p.variation < 0 ? `− ${eur(-p.variation)}` : `+ ${eur(p.variation)}`} = ${eur(x.mois[k]!.tresorerie)}. Le résultat ${dE(x.nom(k))} est bien là, ${eur(p.resultat)} ; c'est la facture de CampusTech, qui ne rentrera que dans quelques mois, et l'échéance de l'emprunt qui le dépassent.`,
          "C'est la logique du tableau des flux : partir du résultat, retirer ce qui ne se paie pas, puis corriger des créances qui grandissent et des dettes qui grandissent. Les créances et les dettes qui grandissent, c'est la variation du besoin en fonds de roulement, mois par mois.",
        ];
      },
    },
    {
      id: "choisir",
      type: "choix",
      titre: "Ce qui n'a rien à faire au tableau de bord",
      notions: ["dashboard"],
      question: () => "Le dirigeant veut ajouter un indicateur de plus. Lequel n'a pas sa place dans son tableau de bord ?",
      options: () => [
        {
          texte: "Le nombre d'écritures passées dans le journal ce mois-ci.",
          juste: true,
          retour:
            "C'est cela : il ne dit rien de la santé de l'entreprise et n'appelle aucune décision. Un indicateur a sa place s'il alerte et s'il fait agir quelqu'un.",
        },
        {
          texte: "Le délai moyen de paiement des clients.",
          juste: false,
          retour: "Il a sa place : il annonce la trésorerie des mois suivants, et le commercial peut agir dessus. Le laboratoire l'a montré avec CampusTech.",
        },
        {
          texte: "Le taux de clients perdus d'un mois à l'autre.",
          juste: false,
          retour: "Il a sa place : il annonce le chiffre d'affaires de demain, avant que le résultat ne baisse.",
        },
      ],
    },
    {
      id: "les-limites",
      type: "choix",
      titre: "Les limites du tableau de bord",
      notions: ["dashboard", "cash_budget"],
      question: (c) => {
        const x = tableauDuChapitre(c);
        return `Le tableau de bord de ${x.f.entreprise} a ses ${Object.keys(x.alerte).length} voyants. Lequel de ces reproches est fondé ?`;
      },
      options: (c) => {
        const x = tableauDuChapitre(c);
        const n = x.nom(x.inv.mois);
        return [
          {
            texte: `Ses voyants constatent le mois écoulé : le budget voyait le découvert ${dE(n)} dès janvier`,
            juste: true,
            retour: `Oui. Un tableau de bord constate vite, il ne prévoit pas : le voyant de trésorerie s'allumerait fin ${dE(n)}, quand le budget de trésorerie annonçait le découvert dès janvier. Et un indicateur seul se manipule : payé sur le chiffre d'affaires, un commercial laisserait CampusTech payer ${DELAI_DU_PARI} jours après sa facture, sans la relancer, sans qu'aucun voyant du résultat ne bouge. On le lit avec les budgets, et plusieurs faces à la fois.`,
          },
          {
            texte: "Il garde trop peu d'indicateurs : il faudrait toutes les lignes du compte de résultat",
            juste: false,
            retour: "Non : un tableau de bord choisit. Une page que l'on lit en deux minutes vaut mieux que vingt lignes que personne ne regarde.",
          },
          {
            texte: "Ses seuils d'alerte sont des conventions, donc ses voyants ne prouvent rien",
            juste: false,
            retour: "Non : un seuil est une convention, mais c'est lui qui dit quand agir. Il se règle, comme on l'a fait pour l'indice de sécurité, sur ce que l'on veut voir venir.",
          },
          {
            texte: "Il ne sert à rien tant qu'aucun voyant n'est allumé",
            juste: false,
            retour: `Non : ses valeurs disent aussi la distance au seuil. Un indice de ${pct(x.mois[0]!.indiceDeSecurite)} en ${x.nom(0)}, c'est un voyant éteint, mais tout près de s'allumer.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["dashboard", "safety_margin", "net_treasury", "demand_market_share"],
      tableau: (c) => tableauDeBordDuSemestre(c, true),
      texte: (c) => {
        const x = tableauDuChapitre(c);
        return [
          `Vous avez calculé les indicateurs d'un mois et lu le tableau de bord du semestre de ${x.f.entreprise} : le résultat et l'indice qui s'allument en ${x.fev.nom}, la part de marché qui faiblit au printemps quand les ventes montent, la trésorerie qui baisse quand le résultat monte.`,
          `Vous avez construit un indicateur : une cible (${qte(x.ventesDeLaCible)} enceintes par mois pour un indice de ${niveau(CIBLE_DE_L_INDICE)}) et un seuil d'alerte (${qte(x.ventesDAlerte)} enceintes, l'indice de ${niveau(x.alerte.indiceDeSecurite)}), placé avant la perte pour laisser le temps d'agir.`,
          "Au niveau de l'examen, vous savez calculer et lire les indicateurs d'un tableau de bord, régler à rebours la cible et le seuil d'alerte d'un indicateur, expliquer et chiffrer le passage du résultat à la trésorerie, et dire ce que le tableau de bord ne voit pas : il constate plus qu'il ne prévoit, et un indicateur seul se manipule.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Peu d'indicateurs, suivis dans le temps ; pour chacun, une cible et un seuil d'alerte placé avant la catastrophe ; plusieurs faces à la fois (rentabilité, argent, position) ; et la question qui va avec : qui agit, et comment ?",
    },
  ],
};
