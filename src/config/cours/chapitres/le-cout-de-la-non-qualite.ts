import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { anneeDeProduction, courbeDeLaQualite, coutMoyenDUnDefaut, coutsDeLaQualite, demarcheQualite, margeUnitaire, type LeviersDeLaQualite } from "../monde/capacite";
import { CAPACITES_DU_COURS, type FicheDeLaCapacite } from "../monde/nova-capacite";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE COÛT DE LA NON-QUALITÉ (BTS GPME, gestion des risques, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : NOVA a une fiche
 * figée (monde/nova-capacite.ts), et les coûts de la qualité se calculent par le modèle du cours
 * (monde/capacite.ts, partie 5) sur les 26 000 enceintes du plan de N + 1. Une évolution du moteur ne
 * change rien ici. Le chapitre se jouait au bistrot de l'arène, où le moteur ne comptait aucun retour
 * de client : la défaillance externe y valait toujours 0. Il se joue désormais chez NOVA seule, où elle
 * pèse plus que la défaillance interne à chaque budget.
 *
 * L'objet : les quatre familles de coûts de la qualité, la prévention (un budget de l'année), la
 * détection (le contrôle final), la défaillance interne (un défaut trouvé se retouche) et la défaillance
 * externe (un défaut livré revient sous garantie) ; le coût total en U selon le budget de prévention,
 * le plus bas au budget actuel ; LE PIÈGE : le coût le plus bas n'est pas le meilleur résultat, parce
 * que chaque défaut livré fait aussi perdre des ventes, que le coût de la qualité ne compte pas ; enfin
 * une démarche qualité, payée une fois, et son délai de récupération.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, les-defauts, cout-total (la formule est au repère ou dans la question, qui nomme
 *     les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-double puis
 *     le-cout-d-un-retour (un curseur sur le coût d'un retour : le coût total au budget actuel face à
 *     celui du double, qui se croisent à 126 €) avant le-u et par-le-cout ; predire-le-resultat puis
 *     la-qualite-percue (un curseur sur les ventes perdues pour 100 défauts livrés : le résultat au
 *     double face au résultat actuel, qui se croisent à 120) avant le-resultat-de-la-qualite et
 *     par-le-resultat ; le-laboratoire-de-la-qualite (prévention, détection, ventes perdues, coût d'un
 *     retour, avec le graphique des deux U) ;
 *   · autonome : le-u, le-resultat-de-la-qualite, la-standardisation (ni formule ni chiffres à prendre ;
 *     le calcul de la correction montre le chemin) ;
 *   · expert : l-euro-de-prevention (ce qu'un euro de plus évite et fait regagner, du budget actuel au
 *     double), a-rebours (retrouver les défauts, le taux et le budget de prévention à partir de la seule
 *     défaillance externe), la-critique (une critique de la méthode : des ventes perdues comptées sur
 *     l'année alors que l'outil refuse déjà de la demande) ; puis la synthèse.
 */

/** Les entreprises où le chapitre se joue : NOVA, la seule fiche de capacité du monde du cours. */
export const ENTREPRISES_DE_LA_QUALITE: readonly string[] = ["nova"];

/** Les quatre budgets de prévention du chapitre : les points de la courbe de la fiche, nommés. */
export const NOMS_DES_BUDGETS = ["Aucun", "La moitié", "Le budget actuel", "Le double"] as const;

/** Les bornes du curseur du coût d'un retour sous garantie, en euros. */
export const RETOUR_DU_CURSEUR = { min: 50, max: 200 } as const;

/** Les bornes du curseur des ventes perdues, pour 100 enceintes défectueuses livrées. */
export const VENTES_PERDUES_DU_CURSEUR = { min: 0, max: 400 } as const;

/**
 * LE CALCUL À REBOURS, hypothèse du cours : une autre année, le service après-vente a remboursé
 * 22 100 € de retours sous garantie. Le contrôle, les coûts d'un défaut et le volume sont ceux de la
 * fiche.
 */
export const DEFAILLANCE_EXTERNE_A_REBOURS = 22_100;

/** Les leviers du laboratoire, leurs bornes et leur pas. */
export const LABORATOIRE_DE_LA_QUALITE = {
  prevention: { min: 0, max: 40_000, pas: 1_000 },
  detection: { min: 50, max: 95, pas: 5 },
  ventes: { min: 0, max: 6, pas: 0.5 },
  retour: { min: 50, max: 200, pas: 10 },
} as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(Math.round(t * 10_000) / 100)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const ans = (x: number) => `${qte(x)} an${x >= 2 ? "s" : ""}`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La fiche de capacité de l'entreprise du cas. */
export function ficheDe(c: Pick<Cas, "code">): FicheDeLaCapacite {
  const f = CAPACITES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de fiche de capacité pour ${c.code}`);
  return f;
}

/**
 * Le budget de prévention qu'un taux de défaut suppose, sur la courbe de la fiche : la réciproque de
 * `tauxDeDefaut` (monde/capacite.ts), interpolée entre deux points. Null si le taux sort de la courbe.
 * Elle manque au modèle ; le chapitre l'écrit pour son calcul à rebours.
 */
export function budgetDuTaux(f: FicheDeLaCapacite, taux: number): number | null {
  const c = f.qualite.courbe;
  for (let i = 1; i < c.length; i++) {
    const a = c[i - 1]!;
    const b = c[i]!;
    if (taux <= a.tauxDeDefaut + 1e-12 && taux >= b.tauxDeDefaut - 1e-12) return auCentime(a.budget + ((a.tauxDeDefaut - taux) / (a.tauxDeDefaut - b.tauxDeDefaut)) * (b.budget - a.budget));
  }
  return null;
}

/** La qualité de NOVA : tout ce que le chapitre et son cas demandent, lu sur la fiche par le modèle du cours. */
export function qualiteDeNova(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const q = f.qualite;
  const m = margeUnitaire(f);
  const volume = anneeDeProduction(f).production;
  const actuel = coutsDeLaQualite(f, { volume });
  const courbe = courbeDeLaQualite(f, undefined, { volume });
  const points = courbe.points.map((p, i) => ({ ...p, nom: NOMS_DES_BUDGETS[i]! }));
  const indexDe = (b: number) => points.findIndex((p) => p.prevention === b);
  const leMoinsCher = points[indexDe(courbe.leMoinsCher)]!;
  const leMeilleur = points[indexDe(courbe.leMeilleur)]!;
  const double = points.at(-1)!;
  const sansLaQualitePercue = courbeDeLaQualite(f, undefined, { volume, ventesPerduesParDefautLivre: 0 });
  // Le curseur du coût d'un retour : le coût total sans les retours, plus livrés × coût d'un retour.
  const sansRetour = (b: number) => coutsDeLaQualite(f, { volume, prevention: b, coutDUnDefautLivre: 0 }).total;
  const retourQuiFaitDoubler = Math.ceil((sansRetour(double.prevention) - sansRetour(actuel.prevention)) / (actuel.livres - double.livres) - 1e-9);
  // Le curseur des ventes perdues : le double rattrape le budget actuel en résultat quand livrés évités × v × marge couvrent le coût total en plus.
  const ventesQuiFontDoubler = Math.ceil(((double.total - actuel.total) / ((actuel.livres - double.livres) * m)) * 100 - 1e-9);
  // L'euro de prévention, du budget actuel au double.
  const ajoutee = auCentime(double.prevention - actuel.prevention);
  const evitee = auCentime(actuel.nonQualite - double.nonQualite);
  const regagnee = auCentime(actuel.margePerdue - double.margePerdue);
  // Le calcul à rebours.
  const detection = q.controleFinal.tauxDeDetection;
  const livresARebours = auCentime(DEFAILLANCE_EXTERNE_A_REBOURS / q.coutDUnDefautLivre);
  const defautsARebours = auCentime(livresARebours / (1 - detection));
  const tauxARebours = defautsARebours / volume;
  const budgetARebours = budgetDuTaux(f, tauxARebours)!;
  // La démarche du chapitre : la standardisation des postes.
  const standardisation = demarcheQualite(f, "standardisation", { volume });
  return {
    f,
    q,
    m,
    volume,
    actuel,
    points,
    leMoinsCher,
    leMeilleur,
    double,
    sansLaQualitePercue: { leMoinsCher: sansLaQualitePercue.leMoinsCher, leMeilleur: sansLaQualitePercue.leMeilleur },
    coutMoyenDUnDefaut: coutMoyenDUnDefaut(f),
    /** Combien de fois un défaut livré coûte plus qu'un défaut trouvé. */
    rapportDesCouts: auCentime(q.coutDUnDefautLivre / q.coutDUnDefautDetecte),
    retourQuiFaitDoubler,
    ventesQuiFontDoubler,
    ajoutee,
    evitee,
    regagnee,
    /** Le budget au-delà du double : le taux de défaut ne baisse plus. */
    auDelaDuDouble: coutsDeLaQualite(f, { volume, prevention: double.prevention + LABORATOIRE_DE_LA_QUALITE.prevention.pas * 4 }),
    livresARebours,
    defautsARebours,
    tauxARebours,
    budgetARebours,
    standardisation,
    delaiDeLaStandardisation: auCentime(standardisation.delaiSurLesCouts!),
  };
}

export type QualiteDeNova = ReturnType<typeof qualiteDeNova>;

/** Une position du laboratoire : la prévention en euros, la détection en %, les ventes perdues par défaut livré, le coût d'un retour. */
export interface PositionDeLaQualite {
  prevention: number;
  detection: number;
  ventes: number;
  retour: number;
}

/** Les leviers du modèle pour une position du laboratoire. */
const leviersDe = (volume: number, p: Omit<PositionDeLaQualite, "prevention">): Partial<LeviersDeLaQualite> => ({
  volume,
  tauxDeDetection: p.detection / 100,
  ventesPerduesParDefautLivre: p.ventes,
  coutDUnDefautLivre: p.retour,
});

/** Les budgets de prévention que le laboratoire peut prendre, sur son pas. */
const budgetsDuLaboratoire = () => {
  const l = LABORATOIRE_DE_LA_QUALITE.prevention;
  return Array.from({ length: Math.round((l.max - l.min) / l.pas) + 1 }, (_, i) => l.min + i * l.pas);
};

/**
 * Le laboratoire : les coûts de la qualité à une position des leviers, et, sur tous les budgets du
 * laboratoire (les autres leviers restant où ils sont), celui au coût total le plus bas et celui au
 * meilleur résultat.
 */
export function laboratoireDeLaQualite(f: FicheDeLaCapacite, volume: number, p: PositionDeLaQualite) {
  const leviers = leviersDe(volume, p);
  const ici = coutsDeLaQualite(f, { ...leviers, prevention: p.prevention });
  const tous = budgetsDuLaboratoire().map((b) => coutsDeLaQualite(f, { ...leviers, prevention: b }));
  const leMoinsCher = tous.reduce((m, x) => (x.total < m.total ? x : m));
  const leMeilleur = tous.reduce((m, x) => (x.resultat > m.resultat ? x : m));
  return { ...ici, budgetLeMoinsCher: leMoinsCher.prevention, budgetLeMeilleur: leMeilleur.prevention, meilleurResultat: leMeilleur.resultat };
}

/** Les quatre budgets de la courbe : ce que chacun dépense et les défauts qu'il laisse. */
function tableauDesBudgets(x: QualiteDeNova): TableauDeDonnees {
  return {
    titre: `La qualité ${dE(x.f.entreprise)} à quatre budgets de prévention, sur ${qte(x.volume)} enceintes`,
    colonnes: x.points.map((p) => p.nom),
    lignes: [
      { libelle: "Prévention de l'année", valeurs: x.points.map((p) => eur(p.prevention)) },
      { libelle: "Contrôle final", valeurs: x.points.map((p) => eur(p.detection)) },
      { libelle: "Taux de défaut", valeurs: x.points.map((p) => pct(p.tauxDeDefaut)) },
      { libelle: "Défauts trouvés au contrôle", valeurs: x.points.map((p) => qte(p.detectes)) },
      { libelle: "Défauts livrés aux clients", valeurs: x.points.map((p) => qte(p.livres)) },
    ],
  };
}

/** Le budget d'un point, dans une phrase : « sans prévention », « au budget actuel ». */
const ouEst = (p: { nom: string; prevention: number }) => (p.prevention === 0 ? "sans prévention" : `à ${eur(p.prevention)} (${p.nom.toLowerCase()})`);

export const LE_COUT_DE_LA_NON_QUALITE: Chapitre = {
  code: "le-cout-de-la-non-qualite",
  parcours: "gpme",
  palier: 3,
  blocs: ["BTS GPME Bloc 2 · Participer à la gestion des risques de la PME"],
  titre: "Le coût de la non-qualité",
  accroche:
    "Prévenir coûte, contrôler aussi, et un défaut coûte plus cher chez le client qu'à l'atelier. Chiffrer les coûts de la qualité de NOVA, trouver le budget de prévention au coût le plus bas, puis voir pourquoi ce n'est pas celui qui donne le meilleur résultat.",
  objectifs: [
    "Distinguer prévention, détection, défaillance interne et défaillance externe, et calculer le coût total de la qualité",
    "Tracer le coût total selon le budget de prévention, et trouver son point le plus bas",
    "Juger un budget de qualité sur le résultat, ventes perdues comprises, et non sur le seul coût",
    "Retrouver à rebours les défauts et le budget de prévention à partir d'une défaillance",
    "Calculer le gain et le délai de récupération d'une démarche qualité",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_QUALITE,
    pourquoi:
      "ce chapitre se joue dans la simulation du cours chez NOVA, la PME industrielle de la comptabilité et du contrôle de gestion : ses enceintes ont des défauts que l'on retouche à l'atelier, ou qui reviennent des clients.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Prévenir, contrôler, réparer",
      notions: ["variable_costs", "fixed_costs"],
      tableau: (c) => {
        const x = qualiteDeNova(c);
        return {
          titre: `La qualité ${dE(x.f.entreprise)}, au plan de N + 1`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Enceintes produites et vendues", valeurs: [qte(x.volume)] },
            { libelle: "Prévention : budget de l'année", valeurs: [eur(x.actuel.prevention)] },
            { libelle: "Taux de défaut à ce budget", valeurs: [pct(x.actuel.tauxDeDefaut)] },
            { libelle: "Détection : contrôle final de l'année", valeurs: [eur(x.actuel.detection)] },
            { libelle: "Part des défauts que le contrôle trouve", valeurs: [pct(x.actuel.tauxDeDetection)] },
            { libelle: "Retouche d'un défaut trouvé", valeurs: [eur(x.q.coutDUnDefautDetecte)] },
            { libelle: "Retour sous garantie d'un défaut livré", valeurs: [eur(x.q.coutDUnDefautLivre)] },
          ],
        };
      },
      texte: (c) => {
        const x = qualiteDeNova(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}, sur les ${qte(x.volume)} enceintes du plan de N + 1. La qualité y a quatre familles de coûts. Deux qu'on choisit : la prévention (former les opérateurs, essayer les composants, régler les postes), un budget de l'année ; la détection, le contrôle final de chaque enceinte. Deux qu'on subit, la non-qualité : la défaillance interne, un défaut trouvé au contrôle et retouché à l'atelier ; la défaillance externe, un défaut parti chez le client, qui revient sous garantie.`,
          `La simulation suppose que le taux de défaut suit le budget de prévention sur une courbe à ${x.points.length} points (${x.points.map((p) => p.nom.toLowerCase()).join(", ")}), droite entre deux points et plate au-delà du double ; que le contrôle trouve ${pct(x.actuel.tauxDeDetection)} des défauts ; et que chaque défaut livré fait perdre ${qte(x.q.ventesPerduesParDefautLivre)} ventes, à ${eur(x.m)} de marge l'une : le client ne rachète pas, et ses avis en détournent d'autres. Les défauts sont des défauts attendus, en moyenne : ils ne s'arrondissent pas.`,
        ];
      },
      repere: () => "Coût total de la qualité = prévention + détection + défaillance interne + défaillance externe.",
    },
    {
      id: "les-defauts",
      type: "montants",
      titre: "Les défauts de l'année",
      notions: ["variable_costs"],
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Calculez les défauts de l'année (${qte(x.volume)} enceintes × ${pct(x.actuel.tauxDeDefaut)}), ceux que le contrôle trouve (${pct(x.actuel.tauxDeDetection)} des défauts), puis ceux qui partent chez les clients.`;
      },
      champs: (c) => {
        const a = qualiteDeNova(c).actuel;
        return [
          { libelle: "Défauts de l'année", attendu: a.defauts, calcul: `${qte(a.volume)} × ${pct(a.tauxDeDefaut)} = ${qte(a.defauts)}` },
          { libelle: "Défauts trouvés au contrôle", attendu: a.detectes, calcul: `${qte(a.defauts)} × ${pct(a.tauxDeDetection)} = ${qte(a.detectes)}` },
          { libelle: "Défauts livrés aux clients", attendu: a.livres, calcul: `${qte(a.defauts)} − ${qte(a.detectes)} = ${qte(a.livres)}` },
        ];
      },
      explication: (c) => {
        const x = qualiteDeNova(c);
        return [
          `Sur ${qte(x.actuel.defauts)} défauts, le contrôle en arrête ${qte(x.actuel.detectes)} ; ${qte(x.actuel.livres)} enceintes défectueuses partent chez les clients. Le contrôle ne supprime pas les défauts : il choisit où on les paie, à l'atelier ou chez le client.`,
        ];
      },
    },
    {
      id: "cout-total",
      type: "montants",
      titre: "Le coût total de la qualité",
      notions: ["variable_costs", "income_statement"],
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Calculez la défaillance interne (les défauts trouvés × ${eur(x.q.coutDUnDefautDetecte)}), la défaillance externe (les défauts livrés × ${eur(x.q.coutDUnDefautLivre)}), puis le coût total de la qualité de l'année, prévention et contrôle compris.`;
      },
      champs: (c) => {
        const x = qualiteDeNova(c);
        const a = x.actuel;
        return [
          { libelle: "Défaillance interne", attendu: a.interne, calcul: `${qte(a.detectes)} × ${eur(x.q.coutDUnDefautDetecte)} = ${eur(a.interne)}` },
          { libelle: "Défaillance externe", attendu: a.externe, calcul: `${qte(a.livres)} × ${eur(x.q.coutDUnDefautLivre)} = ${eur(a.externe)}` },
          { libelle: "Coût total de la qualité", attendu: a.total, calcul: `${eur(a.prevention)} + ${eur(a.detection)} + ${eur(a.interne)} + ${eur(a.externe)} = ${eur(a.total)}` },
        ];
      },
      explication: (c) => {
        const x = qualiteDeNova(c);
        const a = x.actuel;
        return [
          `La qualité coûte ${eur(a.total)} à ${x.f.entreprise} sur l'année, dont ${eur(a.nonQualite)} de non-qualité. Les défauts livrés sont ${qte(auCentime(a.detectes / a.livres))} fois moins nombreux que les défauts trouvés, mais coûtent plus : ${eur(a.externe)} contre ${eur(a.interne)}. Un défaut coûte en moyenne ${eur(x.coutMoyenDUnDefaut)}, et ${qte(x.rapportDesCouts)} fois plus cher chez le client qu'à l'atelier.`,
        ];
      },
    },
    {
      id: "predire-le-double",
      type: "choix",
      titre: "Pariez sur le double",
      notions: ["variable_costs", "fixed_costs"],
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Avant de calculer, pariez. ${x.f.entreprise} double sa prévention : ${eur(x.double.prevention)} au lieu de ${eur(x.actuel.prevention)}. Les défauts passent de ${qte(x.actuel.defauts)} à ${qte(x.double.defauts)}. Le coût total de la qualité…`;
      },
      options: (c) => {
        const x = qualiteDeNova(c);
        const voir = "Le curseur de l'étape suivante compare les deux budgets selon ce que coûte un retour.";
        const monte = x.double.total > x.actuel.total;
        const baisse = x.double.total < x.actuel.total;
        const dit = (j: boolean) => `${j ? "Bon pari." : "Pari à vérifier."} ${voir}`;
        return [
          { texte: "Baisse : moins de défauts, c'est moins de retouches et de retours", juste: baisse, retour: dit(baisse) },
          { texte: "Monte : la prévention ajoutée coûte plus que les défaillances évitées", juste: monte, retour: dit(monte) },
          { texte: "Ne bouge pas : ce que la prévention coûte, les défauts évités le rendent", juste: !monte && !baisse, retour: dit(!monte && !baisse) },
        ];
      },
    },
    {
      id: "le-cout-d-un-retour",
      type: "curseur",
      titre: "Le prix d'un retour",
      notions: ["variable_costs"],
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Faites varier le coût d'un retour sous garantie de ${eur(RETOUR_DU_CURSEUR.min)} à ${eur(RETOUR_DU_CURSEUR.max)}, tout le reste comme sur la fiche. Une droite donne le coût total de la qualité au budget actuel (${eur(x.actuel.prevention)}), l'autre au double. Placez le curseur sur le plus petit coût d'un retour où doubler la prévention coûte moins, puis validez.`;
      },
      grandeur: () => ({ libelle: "Coût d'un retour sous garantie", unite: "€" }),
      cible: (c) => ({ attendu: qualiteDeNova(c).retourQuiFaitDoubler, min: RETOUR_DU_CURSEUR.min, max: RETOUR_DU_CURSEUR.max }),
      zones: ["Doubler la prévention coûte moins", "Doubler la prévention coûte plus"],
      rates: () => ({
        dessous: "À ce coût d'un retour, doubler la prévention coûte encore plus que les défaillances qu'elle évite.",
        dessus: "Plus bas, doubler la prévention coûte encore moins : cherchez le plus petit coût d'un retour.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, r) => {
        const x = qualiteDeNova(c);
        const a = coutsDeLaQualite(x.f, { volume: x.volume, prevention: x.actuel.prevention, coutDUnDefautLivre: r });
        const d = coutsDeLaQualite(x.f, { volume: x.volume, prevention: x.double.prevention, coutDUnDefautLivre: r });
        return [
          { libelle: "Défaillance externe au budget actuel", montant: a.externe },
          { libelle: "Coût total au budget actuel", montant: a.total },
          { libelle: "Coût total au double", montant: d.total },
          { libelle: "Ce que doubler fait gagner sur le coût total", montant: auCentime(a.total - d.total), fort: true },
        ];
      },
      droites: (c) => {
        const x = qualiteDeNova(c);
        const fixe = (b: number) => coutsDeLaQualite(x.f, { volume: x.volume, prevention: b, coutDUnDefautLivre: 0 }).total;
        return {
          produit: (r) => fixe(x.actuel.prevention) + x.actuel.livres * r,
          cout: (r) => fixe(x.double.prevention) + x.double.livres * r,
          libelles: ["Coût total au budget actuel", "Coût total au double"],
        };
      },
      explication: (c) => {
        const x = qualiteDeNova(c);
        return [
          `À ${eur(x.q.coutDUnDefautLivre)} le retour, doubler la prévention coûte ${eur(auCentime(x.double.total - x.actuel.total))} de plus qu'elle n'évite. Il faudrait qu'un retour coûte ${eur(x.retourQuiFaitDoubler)} pour que le double devienne le moins cher : chaque défaut livré évité vaudrait alors assez pour payer la prévention en plus.`,
          "Plus la défaillance externe coûte cher, plus il vaut la peine de prévenir. Le budget au coût total le plus bas n'est pas une constante : il dépend de ce que coûte un défaut. L'étape suivante dessine la courbe entière, à la fiche.",
        ];
      },
    },
    {
      id: "le-u",
      type: "montants",
      titre: "La courbe en U",
      notions: ["variable_costs", "fixed_costs"],
      tableau: (c) => tableauDesBudgets(qualiteDeNova(c)),
      question: () => "Sans formule cette fois. Calculez le coût total de la qualité sans prévention, à la moitié du budget actuel, puis au double.",
      champs: (c) => {
        const x = qualiteDeNova(c);
        const [aucun, moitie] = x.points;
        const ligne = (p: (typeof x.points)[number]) =>
          `${eur(p.prevention)} + ${eur(p.detection)} + ${qte(p.detectes)} × ${eur(x.q.coutDUnDefautDetecte)} + ${qte(p.livres)} × ${eur(x.q.coutDUnDefautLivre)} = ${eur(p.total)}`;
        return [
          { libelle: "Coût total sans prévention", attendu: aucun!.total, calcul: ligne(aucun!) },
          { libelle: "Coût total à la moitié", attendu: moitie!.total, calcul: ligne(moitie!) },
          { libelle: "Coût total au double", attendu: x.double.total, calcul: ligne(x.double) },
        ];
      },
      explication: (c) => {
        const x = qualiteDeNova(c);
        const [aucun, moitie] = x.points;
        return [
          `Le coût total descend de ${eur(aucun!.total)} sans prévention à ${eur(moitie!.total)} à la moitié, puis ${eur(x.actuel.total)} au budget actuel, et remonte à ${eur(x.double.total)} au double : une courbe en U. Les premiers euros de prévention évitent beaucoup de défauts ; les suivants, de moins en moins. Tant qu'un euro de plus évite plus d'un euro de défaillances, le coût total baisse ; au-delà, il monte.`,
        ];
      },
    },
    {
      id: "par-le-cout",
      type: "choix",
      titre: "Le budget au coût le plus bas",
      notions: ["variable_costs"],
      tableau: (c) => {
        const x = qualiteDeNova(c);
        return {
          titre: "Le coût total de la qualité, aux quatre budgets",
          colonnes: x.points.map((p) => p.nom),
          lignes: [
            { libelle: "Prévention de l'année", valeurs: x.points.map((p) => eur(p.prevention)) },
            { libelle: "Coût total de la qualité", valeurs: x.points.map((p) => eur(p.total)) },
          ],
        };
      },
      question: () => "À quel budget de prévention le coût total de la qualité est-il le plus bas ?",
      options: (c) => {
        const x = qualiteDeNova(c);
        const min = x.leMoinsCher;
        const textes = ["Sans aucun budget de prévention", "À la moitié du budget actuel", "Au budget actuel", "Au double du budget actuel"];
        return x.points.map((p, i) => ({
          texte: textes[i]!,
          juste: p.prevention === min.prevention,
          retour:
            p.prevention === min.prevention
              ? `Oui : ${eur(p.total)}, le plus bas des quatre. En dessous, les défauts coûtent plus que la prévention économisée ; au-dessus, la prévention ajoutée coûte plus que les défaillances évitées.`
              : `Non : ${eur(p.total)}, contre ${eur(min.total)} ${ouEst(min)}.`,
        }));
      },
    },
    {
      id: "predire-le-resultat",
      type: "choix",
      titre: "Pariez sur le résultat",
      notions: ["demand_market_share", "income_statement"],
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Avant de calculer, pariez. Chaque enceinte défectueuse livrée fait perdre ${qte(x.q.ventesPerduesParDefautLivre)} ventes, et le coût de la qualité ne les compte pas. Au double de la prévention, ${qte(x.double.livres)} défauts sont livrés au lieu de ${qte(x.actuel.livres)}. Le résultat de la qualité (la marge des ventes moins le coût total) sera, au double…`;
      },
      options: (c) => {
        const x = qualiteDeNova(c);
        const voir = "Le curseur de l'étape suivante fait varier les ventes que perd un défaut livré.";
        const plus = x.double.resultat > x.actuel.resultat;
        const moins = x.double.resultat < x.actuel.resultat;
        const dit = (j: boolean) => `${j ? "Bon pari." : "Pari à vérifier."} ${voir}`;
        return [
          { texte: "Plus bas qu'au budget actuel : le coût total y est plus haut", juste: moins, retour: dit(moins) },
          { texte: "Plus haut qu'au budget actuel : les ventes gardées paient la prévention en plus", juste: plus, retour: dit(plus) },
          { texte: "Le même : les ventes ne dépendent pas de la qualité", juste: !plus && !moins, retour: dit(!plus && !moins) },
        ];
      },
    },
    {
      id: "la-qualite-percue",
      type: "curseur",
      titre: "Les ventes que perd un défaut",
      notions: ["demand_market_share", "income_statement"],
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Faites varier les ventes perdues pour 100 enceintes défectueuses livrées, de ${qte(VENTES_PERDUES_DU_CURSEUR.min)} à ${qte(VENTES_PERDUES_DU_CURSEUR.max)} (la fiche en compte ${qte(x.q.ventesPerduesParDefautLivre * 100)}). Une droite donne le résultat de la qualité au double de la prévention, l'autre au budget actuel. Placez le curseur sur le plus petit nombre de ventes perdues où le double fait au moins aussi bien, puis validez.`;
      },
      grandeur: () => ({ libelle: "Ventes perdues pour 100 défauts livrés", unite: "ventes" }),
      cible: (c) => ({ attendu: qualiteDeNova(c).ventesQuiFontDoubler, min: VENTES_PERDUES_DU_CURSEUR.min, max: VENTES_PERDUES_DU_CURSEUR.max }),
      zones: ["Le double fait le meilleur résultat", "Le budget actuel fait le meilleur résultat"],
      rates: () => ({
        dessous: "À cette position, les ventes gardées ne paient pas encore la prévention en plus : le budget actuel fait mieux.",
        dessus: "Plus bas, le double fait encore au moins aussi bien : cherchez le plus petit nombre de ventes perdues.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, v) => {
        const x = qualiteDeNova(c);
        const a = coutsDeLaQualite(x.f, { volume: x.volume, prevention: x.actuel.prevention, ventesPerduesParDefautLivre: v / 100 });
        const d = coutsDeLaQualite(x.f, { volume: x.volume, prevention: x.double.prevention, ventesPerduesParDefautLivre: v / 100 });
        return [
          { libelle: "Ventes perdues au budget actuel", montant: a.ventesPerdues },
          { libelle: "Résultat de la qualité au budget actuel", montant: a.resultat },
          { libelle: "Résultat de la qualité au double", montant: d.resultat },
          { libelle: "Ce que doubler fait gagner au résultat", montant: auCentime(d.resultat - a.resultat), fort: true },
        ];
      },
      droites: (c) => {
        const x = qualiteDeNova(c);
        const r = (p: typeof x.actuel) => (v: number) => (x.volume - (p.livres * v) / 100) * x.m - p.total;
        return { produit: r(x.double), cout: r(x.actuel), libelles: ["Résultat de la qualité au double", "Résultat de la qualité au budget actuel"] };
      },
      explication: (c) => {
        const x = qualiteDeNova(c);
        return [
          `Dès ${qte(x.ventesQuiFontDoubler)} ventes perdues pour 100 défauts livrés, le double fait au moins aussi bien que le budget actuel ; la fiche en compte ${qte(x.q.ventesPerduesParDefautLivre * 100)}. Sans aucune vente perdue, le coût total et le résultat désigneraient le même budget, ${eur(x.sansLaQualitePercue.leMeilleur)}.`,
          "Ce qui sépare les deux lectures, ce sont les ventes que la qualité perçue fait perdre : le coût de la qualité ne les voit pas, le résultat si. Les étapes suivantes chiffrent les deux.",
        ];
      },
    },
    {
      id: "le-resultat-de-la-qualite",
      type: "montants",
      titre: "Le résultat de la qualité",
      notions: ["income_statement", "demand_market_share"],
      tableau: (c) => {
        const x = qualiteDeNova(c);
        return {
          titre: "Les quatre budgets, ventes perdues comprises",
          colonnes: x.points.map((p) => p.nom),
          lignes: [
            { libelle: "Coût total de la qualité", valeurs: x.points.map((p) => eur(p.total)) },
            { libelle: "Défauts livrés aux clients", valeurs: x.points.map((p) => qte(p.livres)) },
          ],
        };
      },
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Sans formule. Le résultat de la qualité est la marge des enceintes vendues (${qte(x.volume)} moins les ventes perdues, à ${eur(x.m)}) moins le coût total de la qualité. Calculez les ventes perdues au budget actuel, puis le résultat de la qualité au budget actuel et au double.`;
      },
      champs: (c) => {
        const x = qualiteDeNova(c);
        const a = x.actuel;
        const d = x.double;
        return [
          { libelle: "Ventes perdues au budget actuel", attendu: a.ventesPerdues, calcul: `${qte(a.livres)} × ${qte(x.q.ventesPerduesParDefautLivre)} = ${qte(a.ventesPerdues)}` },
          { libelle: "Résultat de la qualité au budget actuel", attendu: a.resultat, calcul: `(${qte(x.volume)} − ${qte(a.ventesPerdues)}) × ${eur(x.m)} − ${eur(a.total)} = ${eur(a.resultat)}` },
          {
            libelle: "Résultat de la qualité au double",
            attendu: d.resultat,
            calcul: `(${qte(x.volume)} − ${qte(d.livres)} × ${qte(x.q.ventesPerduesParDefautLivre)}) × ${eur(x.m)} − ${eur(d.total)} = (${qte(x.volume)} − ${qte(d.ventesPerdues)}) × ${eur(x.m)} − ${eur(d.total)} = ${eur(d.resultat)}`,
          },
        ];
      },
      explication: (c) => {
        const x = qualiteDeNova(c);
        return [
          `Au double, le coût total est plus haut de ${eur(auCentime(x.double.total - x.actuel.total))}, mais ${x.f.entreprise} ne perd que ${qte(x.double.ventesPerdues)} ventes au lieu de ${qte(x.actuel.ventesPerdues)} : le résultat de la qualité y est plus haut de ${eur(auCentime(x.double.resultat - x.actuel.resultat))}.`,
        ];
      },
    },
    {
      id: "par-le-resultat",
      type: "choix",
      titre: "Ce que le coût de la qualité ne compte pas",
      notions: ["demand_market_share", "income_statement"],
      tableau: (c) => {
        const x = qualiteDeNova(c);
        return {
          titre: "Les quatre budgets, coût et résultat",
          colonnes: x.points.map((p) => p.nom),
          lignes: [
            { libelle: "Coût total de la qualité", valeurs: x.points.map((p) => eur(p.total)) },
            { libelle: "Ventes perdues par la qualité perçue", valeurs: x.points.map((p) => qte(p.ventesPerdues)) },
            { libelle: "Résultat de la qualité", valeurs: x.points.map((p) => eur(p.resultat)) },
          ],
        };
      },
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Le coût total est le plus bas ${ouEst(x.leMoinsCher)}, le résultat le plus haut ${ouEst(x.leMeilleur)}. Quel budget conseillez-vous à ${x.f.entreprise}, et pourquoi ?`;
      },
      options: (c) => {
        const x = qualiteDeNova(c);
        const b = x.leMeilleur;
        const memes = b.prevention === x.leMoinsCher.prevention;
        return [
          {
            texte: "Le budget au meilleur résultat : les ventes gardées comptent autant que les coûts",
            juste: !memes,
            retour: `Oui : ${eur(b.resultat)} de résultat ${ouEst(b)}, contre ${eur(x.leMoinsCher.resultat)} ${ouEst(x.leMoinsCher)}. Le budget au coût le plus bas oublie ${qte(auCentime(x.leMoinsCher.ventesPerdues - b.ventesPerdues))} ventes que la qualité perçue fait perdre de plus.`,
          },
          {
            texte: "Le budget au coût le plus bas : c'est lui qui coûte le moins",
            juste: memes,
            retour: memes
              ? "Oui : ici, le coût le plus bas donne aussi le meilleur résultat."
              : `Non : c'est le piège. Le coût de la qualité ne compte pas les ventes que perd un client déçu ; ${ouEst(x.leMoinsCher)}, le résultat est plus bas de ${eur(auCentime(b.resultat - x.leMoinsCher.resultat))}.`,
          },
          {
            texte: "Aucun budget : la prévention est une charge qu'on peut couper",
            juste: false,
            retour: `Non : sans prévention, le coût total monte à ${eur(x.points[0]!.total)} et le résultat tombe à ${eur(x.points[0]!.resultat)}. Couper la prévention, c'est payer plus de défauts.`,
          },
          {
            texte: "Le plus gros budget possible : plus de qualité donne toujours plus de résultat",
            juste: false,
            retour: `Non : au-delà du double, le taux de défaut ne baisse plus. À ${eur(x.auDelaDuDouble.prevention)}, le résultat retombe à ${eur(x.auDelaDuDouble.resultat)} : la prévention en plus ne rapporte plus rien.`,
          },
        ];
      },
    },
    {
      id: "l-euro-de-prevention",
      type: "montants",
      titre: "Ce que rapporte un euro de prévention",
      notions: ["variable_costs", "income_statement"],
      tableau: (c) => tableauDesBudgets(qualiteDeNova(c)),
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Du budget actuel au double, ${x.f.entreprise} ajoute ${eur(x.ajoutee)} de prévention. Calculez la non-qualité qu'elle évite (défaillances interne et externe), la marge qu'elle regagne sur les ventes perdues, puis ce que rapporte un euro de prévention ajouté, ventes comprises, au centime.`;
      },
      champs: (c) => {
        const x = qualiteDeNova(c);
        const a = x.actuel;
        const d = x.double;
        return [
          {
            libelle: "Non-qualité évitée",
            attendu: x.evitee,
            calcul: `(${eur(a.interne)} + ${eur(a.externe)}) − (${eur(d.interne)} + ${eur(d.externe)}) = ${eur(a.nonQualite)} − ${eur(d.nonQualite)} = ${eur(x.evitee)}`,
          },
          { libelle: "Marge regagnée sur les ventes perdues", attendu: x.regagnee, calcul: `(${qte(a.ventesPerdues)} − ${qte(d.ventesPerdues)}) × ${eur(x.m)} = ${eur(x.regagnee)}` },
          {
            libelle: "Ce que rapporte un euro de prévention ajouté",
            attendu: auCentime((x.evitee + x.regagnee) / x.ajoutee),
            calcul: `(${eur(x.evitee)} + ${eur(x.regagnee)}) ÷ ${eur(x.ajoutee)} = ${eur(auCentime((x.evitee + x.regagnee) / x.ajoutee))}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const x = qualiteDeNova(c);
        const parEuroSurLesCouts = auCentime(x.evitee / x.ajoutee);
        return [
          `Sur les seuls coûts, un euro de prévention ajouté n'évite que ${eur(parEuroSurLesCouts)} de défaillances : il coûte plus qu'il n'évite, et le coût total monte. Ventes comprises, il rapporte ${eur(auCentime((x.evitee + x.regagnee) / x.ajoutee))} : il se paie, et le résultat monte.`,
          "On augmente la prévention tant qu'un euro de plus évite plus d'un euro de défaillances et de marge perdue réunies. C'est le raisonnement à la marge qui fixe le bon niveau, pas le zéro défaut.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-qualite",
      type: "simulation",
      titre: "Le laboratoire de la qualité",
      notions: ["variable_costs", "demand_market_share", "income_statement"],
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Faites varier la prévention, la part des défauts que le contrôle trouve (à coût du contrôle inchangé), les ventes que perd un défaut livré et le coût d'un retour. Le tableau suit les défauts, les coûts et le résultat de la qualité sur les ${qte(x.volume)} enceintes ; le graphique trace, selon la prévention, le coût total de la qualité et le même coût, marge des ventes perdues comprise.`;
      },
      leviers: (c) => {
        const x = qualiteDeNova(c);
        const l = LABORATOIRE_DE_LA_QUALITE;
        return [
          { code: "prevention", libelle: "Prévention de l'année", unite: "€", min: l.prevention.min, max: l.prevention.max, pas: l.prevention.pas, depart: x.actuel.prevention },
          { code: "detection", libelle: "Défauts trouvés au contrôle", unite: "%", min: l.detection.min, max: l.detection.max, pas: l.detection.pas, depart: Math.round(x.actuel.tauxDeDetection * 100) },
          { code: "ventes", libelle: "Ventes perdues par défaut livré", unite: "ventes", min: l.ventes.min, max: l.ventes.max, pas: l.ventes.pas, depart: x.q.ventesPerduesParDefautLivre },
          { code: "retour", libelle: "Coût d'un retour sous garantie", unite: "€", min: l.retour.min, max: l.retour.max, pas: l.retour.pas, depart: x.q.coutDUnDefautLivre },
        ];
      },
      lecture: (c, p) => {
        const x = qualiteDeNova(c);
        const r = laboratoireDeLaQualite(x.f, x.volume, p as unknown as PositionDeLaQualite);
        const d = x.actuel;
        return [
          { libelle: "Défauts de l'année", montant: r.defauts, reference: d.defauts, unite: "enceintes" },
          { libelle: "Défauts livrés aux clients", montant: r.livres, reference: d.livres, unite: "enceintes" },
          { libelle: "Coût total de la qualité", montant: r.total, reference: d.total },
          { libelle: "Marge des ventes perdues", montant: r.margePerdue, reference: d.margePerdue },
          { libelle: "Résultat de la qualité", montant: r.resultat, reference: d.resultat },
          { libelle: "Écart de résultat face au départ", montant: auCentime(r.resultat - d.resultat), reference: 0, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const x = qualiteDeNova(c);
        return {
          levier: "prevention",
          courbes: [
            { libelle: "Coût total de la qualité", valeur: (p) => laboratoireDeLaQualite(x.f, x.volume, p as unknown as PositionDeLaQualite).total },
            { libelle: "Coût total, ventes perdues comprises", valeur: (p) => laboratoireDeLaQualite(x.f, x.volume, p as unknown as PositionDeLaQualite).totalAvecLesVentesPerdues },
          ],
        };
      },
      defi: (c) => {
        const x = qualiteDeNova(c);
        return {
          consigne: "Placez la prévention sur le budget qui donne le meilleur résultat de la qualité, les autres leviers là où vous les avez mis.",
          atteint: (p) => {
            const r = laboratoireDeLaQualite(x.f, x.volume, p as unknown as PositionDeLaQualite);
            return r.resultat >= r.meilleurResultat - 0.005;
          },
          indice: (p) => {
            const r = laboratoireDeLaQualite(x.f, x.volume, p as unknown as PositionDeLaQualite);
            return `À ${eur(p.prevention!)} de prévention, le résultat de la qualité vaut ${eur(r.resultat)} : un autre budget fait mieux. Cherchez le point le plus bas de la courbe « ventes perdues comprises », pas celui du coût total.`;
          },
          solution: { prevention: x.leMeilleur.prevention, detection: Math.round(x.actuel.tauxDeDetection * 100), ventes: x.q.ventesPerduesParDefautLivre, retour: x.q.coutDUnDefautLivre },
        };
      },
      explication: (c, p) => {
        const x = qualiteDeNova(c);
        const r = laboratoireDeLaQualite(x.f, x.volume, p as unknown as PositionDeLaQualite);
        return [
          r.budgetLeMeilleur === r.budgetLeMoinsCher
            ? `À ces réglages, le meilleur résultat et le coût total le plus bas tombent au même budget, ${eur(r.budgetLeMeilleur)} : les ventes perdues pèsent trop peu pour déplacer le fond de la courbe.`
            : `À ces réglages, le meilleur résultat est à ${eur(r.budgetLeMeilleur)} de prévention, quand le coût total est le plus bas à ${eur(r.budgetLeMoinsCher)}. Les deux fonds de courbe sont séparés par les ventes que la qualité perçue fait perdre.`,
          `Mettez les ventes perdues à 0 : les deux courbes se confondent. Montez le coût d'un retour, ou baissez la part des défauts trouvés au contrôle : chaque défaut évité vaut plus, et le fond du coût total glisse vers une prévention plus forte. Détecter plus tôt revient moins cher qu'un retour client.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver le budget à rebours",
      notions: ["variable_costs"],
      tableau: (c) => tableauDesBudgets(qualiteDeNova(c)),
      question: (c) => {
        const x = qualiteDeNova(c);
        return `Une autre année, ${x.f.entreprise} a remboursé ${eur(DEFAILLANCE_EXTERNE_A_REBOURS)} de retours sous garantie, sur le même volume, avec le même contrôle et les mêmes coûts. Retrouvez les défauts de l'année, le taux de défaut en %, puis le budget de prévention que ce taux suppose sur la courbe.`;
      },
      champs: (c) => {
        const x = qualiteDeNova(c);
        const [, moitie, actuel] = x.points;
        return [
          {
            libelle: "Défauts de cette année",
            attendu: x.defautsARebours,
            calcul: `${eur(DEFAILLANCE_EXTERNE_A_REBOURS)} ÷ ${eur(x.q.coutDUnDefautLivre)} = ${qte(x.livresARebours)} défauts livrés, soit ${pct(1 - x.q.controleFinal.tauxDeDetection)} des défauts : ${qte(x.livresARebours)} ÷ ${qte(1 - x.q.controleFinal.tauxDeDetection)} = ${qte(x.defautsARebours)}`,
          },
          {
            libelle: "Taux de défaut, en %",
            attendu: auCentime(x.tauxARebours * 100),
            calcul: `${qte(x.defautsARebours)} ÷ ${qte(x.volume)} = ${pct(x.tauxARebours)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Budget de prévention que ce taux suppose",
            attendu: x.budgetARebours,
            calcul: `entre ${eur(moitie!.prevention)} (${pct(moitie!.tauxDeDefaut)}) et ${eur(actuel!.prevention)} (${pct(actuel!.tauxDeDefaut)}) : ${eur(moitie!.prevention)} + (${pct(moitie!.tauxDeDefaut)} − ${pct(x.tauxARebours)}) ÷ (${pct(moitie!.tauxDeDefaut)} − ${pct(actuel!.tauxDeDefaut)}) × ${eur(actuel!.prevention - moitie!.prevention)} = ${eur(x.budgetARebours)}`,
          },
        ];
      },
      explication: (c) => {
        const x = qualiteDeNova(c);
        return [
          `La seule défaillance externe suffit à remonter la chaîne : les défauts livrés, puis tous les défauts (le contrôle en laisse passer ${pct(1 - x.q.controleFinal.tauxDeDetection)}), puis le taux, puis le budget de prévention sur la courbe, ${eur(x.budgetARebours)}. Remonter oblige à savoir ce que chaque coût compte.`,
          "La lecture suppose que la courbe et le contrôle n'ont pas changé : un retour plus nombreux peut aussi venir d'un contrôle moins efficace, que la défaillance externe seule ne distingue pas.",
        ];
      },
    },
    {
      id: "la-standardisation",
      type: "montants",
      titre: "Une démarche qualité, payée une fois",
      notions: ["irr_payback"],
      question: (c) => {
        const x = qualiteDeNova(c);
        const s = x.standardisation;
        return `La ${s.nom.toLowerCase()} coûte ${eur(s.cout)}, payés une fois, et retire ${qte(s.baisseDuTauxDeDefaut * 100)} point au taux de défaut, chaque année. Calculez les défauts qu'elle évite sur l'année, ce qu'elle fait gagner sur le coût total de la qualité, puis son délai de récupération sur les coûts, en années, au centième.`;
      },
      champs: (c) => {
        const x = qualiteDeNova(c);
        const s = x.standardisation;
        return [
          { libelle: "Défauts évités sur l'année", attendu: s.defautsEvites, calcul: `${qte(x.volume)} × ${pct(s.baisseDuTauxDeDefaut)} = ${qte(s.defautsEvites)}` },
          {
            libelle: "Gain de l'année sur le coût total",
            attendu: s.gainDesCouts,
            calcul: `${qte(s.defautsEvites)} × ${eur(x.coutMoyenDUnDefaut)} (le coût moyen d'un défaut : ${pct(x.q.controleFinal.tauxDeDetection)} × ${eur(x.q.coutDUnDefautDetecte)} + ${pct(1 - x.q.controleFinal.tauxDeDetection)} × ${eur(x.q.coutDUnDefautLivre)}) = ${eur(s.gainDesCouts)}`,
          },
          { libelle: "Délai de récupération sur les coûts", attendu: x.delaiDeLaStandardisation, calcul: `${eur(s.cout)} ÷ ${eur(s.gainDesCouts)} = ${ans(x.delaiDeLaStandardisation)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const x = qualiteDeNova(c);
        const s = x.standardisation;
        return [
          `La démarche coûte ${eur(s.cout)} une fois et fait gagner ${eur(s.gainDesCouts)} par an sur les coûts : elle se rembourse en ${ans(x.delaiDeLaStandardisation)}. Ventes comprises (${eur(s.gainDesVentes)} de marge regagnée), ${eur(s.gain)} par an. C'est un investissement : il se juge sur plusieurs années, en supposant, hypothèse du cours, qu'elle garde ses effets et gagne chaque année autant que la première.`,
        ];
      },
    },
    {
      id: "la-critique",
      type: "choix",
      titre: "Ce que vaut une vente perdue",
      notions: ["capacity", "demand_market_share"],
      question: (c) => {
        const x = qualiteDeNova(c);
        const plan = anneeDeProduction(x.f);
        return `Le modèle compte ${qte(x.actuel.ventesPerdues)} ventes perdues par la qualité perçue sur l'année, à ${eur(x.m)} l'une. Or aux trimestres 2 et 4, l'outil est le goulot : ${x.f.entreprise} refuse déjà ${qte(plan.refusees)} enceintes demandées. Que vaut ce chiffre ?`;
      },
      options: (c) => {
        const x = qualiteDeNova(c);
        return [
          {
            texte: "Il peut exagérer la perte : au trimestre 2 ou 4, un client perdu peut être remplacé par une demande refusée",
            juste: true,
            retour: `Oui. Le modèle compte les ventes perdues sur l'année entière, sans regarder la capacité. Là où l'outil est le goulot, la ligne aurait de toute façon tourné à plein : un client déçu y laisse sa place à un client refusé, et la marge perdue est moindre. Le résultat de la qualité est donc une borne haute de ce que la qualité perçue coûte ; ${x.f.entreprise} doit la lire trimestre par trimestre avant de décider.`,
          },
          {
            texte: `Il est exact : chaque vente perdue coûte ${eur(x.m)}, quel que soit le trimestre`,
            juste: false,
            retour: "Non : une vente perdue ne coûte sa marge que si l'entreprise pouvait la servir. Quand l'outil est le goulot, la vente perdue peut être remplacée par une demande qui, sans elle, aurait été refusée.",
          },
          {
            texte: "Il est trop bas : les demandes refusées s'ajoutent aux ventes perdues par la qualité",
            juste: false,
            retour: "Non : les demandes refusées viennent de la capacité de la ligne, pas de la qualité. Les additionner compterait deux fois le même manque à gagner.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["variable_costs", "income_statement"],
      tableau: (c) => {
        const x = qualiteDeNova(c);
        return {
          titre: `Les coûts de la qualité ${dE(x.f.entreprise)}, aux quatre budgets`,
          colonnes: x.points.map((p) => p.nom),
          lignes: [
            { libelle: "Prévention", valeurs: x.points.map((p) => eur(p.prevention)) },
            { libelle: "Détection", valeurs: x.points.map((p) => eur(p.detection)) },
            { libelle: "Défaillance interne", valeurs: x.points.map((p) => eur(p.interne)) },
            { libelle: "Défaillance externe", valeurs: x.points.map((p) => eur(p.externe)) },
            { libelle: "Coût total de la qualité", valeurs: x.points.map((p) => eur(p.total)) },
            { libelle: "Résultat de la qualité", valeurs: x.points.map((p) => eur(p.resultat)) },
          ],
        };
      },
      texte: (c) => {
        const x = qualiteDeNova(c);
        return [
          `Chez ${x.f.entreprise}, la qualité coûte ${eur(x.actuel.total)} au budget actuel, dont ${eur(x.actuel.externe)} de défaillance externe, plus que l'interne : un défaut coûte ${qte(x.rapportDesCouts)} fois plus cher chez le client qu'à l'atelier. Le coût total dessine un U, le plus bas ${ouEst(x.leMoinsCher)} ; le résultat de la qualité est le plus haut ${ouEst(x.leMeilleur)}, parce que la qualité perçue fait perdre des ventes que le coût de la qualité ne compte pas.`,
          "Le bon niveau de qualité n'est pas le zéro défaut, ni le coût le plus bas : c'est celui où un euro de prévention de plus évite moins d'un euro de défaillances et de marge perdue réunies. Détecter plus tôt coûte moins qu'un retour client. Une démarche qualité, payée une fois, se juge comme un investissement, par son délai de récupération.",
          "Au niveau de l'examen, vous savez classer et chiffrer les quatre familles de coûts de la qualité, tracer le coût total selon la prévention et en trouver le minimum, raisonner à la marge, juger un budget sur le résultat, remonter d'une défaillance au budget de prévention, chiffrer le délai de récupération d'une démarche, et dire ce que le modèle exagère.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Coût total de la qualité = prévention + détection + défaillance interne + défaillance externe. Résultat de la qualité = marge des ventes, ventes perdues déduites, − coût total. On prévient tant qu'un euro de plus évite plus d'un euro de défaillances et de marge perdue.",
    },
  ],
};
