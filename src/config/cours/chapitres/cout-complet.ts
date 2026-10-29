import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { accord } from "../accords";
import type { Cas } from "../cas";
import { coutCompletDuMois, coutCompletRationnel, imputationRationnelle, prestationsReciproques } from "../monde/couts-et-budgets";
import { GESTION_DU_COURS, type CentreAuxiliaire, type CentrePrincipal, type CodeDeCentre, type CodeDeCharge, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : COÛT COMPLET ET CENTRES D'ANALYSE (contrôle de gestion, palier 3 ; BTS CG, DCG UE11,
 * BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le mois de
 * janvier de NOVA, ses cinq centres d'analyse et leurs clés ont une fiche figée
 * (monde/nova-gestion.ts), et le coût complet se calcule par le modèle du cours
 * (monde/couts-et-budgets.ts : `prestationsReciproques`, `coutCompletDuMois`, `coutCompletRationnel`).
 * L'ancien tableau des clés du chapitre (centres.ts, quatre centres) n'est plus lu.
 *
 * L'objet : ce que coûte, tout compris, chacune des enceintes de janvier. Les charges directes vont au
 * produit ; les charges indirectes passent par cinq centres : deux centres auxiliaires qui se rendent
 * service l'un à l'autre (l'entretien et l'administration : des prestations réciproques, un système
 * de deux équations), puis trois centres principaux, dont les unités d'œuvre imputent les charges au
 * produit. L'élève remonte la chaîne des coûts jusqu'au résultat analytique, qui retrouve celui du
 * seuil de rentabilité. Puis il découvre que le coût complet d'une enceinte ne vaut qu'au volume où
 * il a été calculé, et l'imputation rationnelle, qui le rend indépendant des ventes du mois.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, directes-ou-indirectes, repartition-primaire, imputation-rationnelle (la formule
 *     est au repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) :
 *     predire-les-prestations puis le-point-fixe (un curseur sur le total de l'entretien, face à ce
 *     qu'il doit répartir une fois l'administration servie : les deux droites se croisent à la
 *     solution du système) avant prestations-reciproques ; predire-le-volume puis le-cout-fige (un
 *     curseur sur les enceintes du mois, le coût figé face au coût réel) avant imputation-rationnelle ;
 *   · autonome : repartition-secondaire, unites-d-oeuvre, chaine-des-couts, meme-resultat (ni
 *     formule ni chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · le laboratoire : le-laboratoire-du-cout (les enceintes du mois, et un levier à choix entre le
 *     coût complet réel et l'imputation rationnelle ; un graphique des deux coûts d'une enceinte), en
 *     expert, après cout-rationnel ;
 *   · expert : prestations-reciproques (le système de deux équations), oublier-la-reciprocite (une
 *     critique de méthode), cout-rationnel (l'imputation rationnelle jusqu'au résultat),
 *     tableau-complet (une variante chiffrée : refaire toute la répartition sans clé dictée),
 *     a-rebours (retrouver les ventes et le coût de la sous-activité à partir d'un coût de revient) ;
 *     puis commande et la synthèse.
 */

/** La commande supplémentaire de la dernière question : une part des ventes du mois. */
export const PART_DE_LA_COMMANDE = 0.1;

/**
 * LA VARIANTE DU TABLEAU COMPLET, hypothèse du cours : NOVA signe un contrat de maintenance de sa
 * ligne de montage, 980 € par mois, tout entier à la charge du centre entretien. Les autres charges et
 * toutes les clés restent celles de la fiche.
 */
export const CONTRAT_DE_MAINTENANCE = 980;

/** Le mois du calcul à rebours, dans le semestre de la fiche : avril (le quatrième mois). */
export const MOIS_A_REBOURS = 3;

/** Les bornes du curseur du point fixe, en euros, et celles des enceintes du mois. */
export const ENTRETIEN_DU_CURSEUR = { min: 1_600, max: 2_400 } as const;
export const ENCEINTES_DU_CURSEUR = { min: 1_000, max: 2_500 } as const;

/** Les méthodes du levier à choix du laboratoire. */
export const METHODES = { reel: 0, rationnel: 1 } as const;

/** Le coût complet se calcule sur le mois de janvier de NOVA, avec ses centres d'analyse. */
export const ENTREPRISES_DU_COUT_COMPLET: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number, d = 2) => `${qte(t * 100, d)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);

const CENTRES: readonly CodeDeCentre[] = ["entretien", "administration", "approvisionnement", "production", "distribution"];
const PRINCIPAUX: readonly CentrePrincipal[] = ["approvisionnement", "production", "distribution"];
const AUXILIAIRES: readonly CentreAuxiliaire[] = ["entretien", "administration"];
const CHARGES: readonly CodeDeCharge[] = ["loyer", "personnel", "amortissement"];

export const LIBELLES_DES_CENTRES: Readonly<Record<CodeDeCentre, string>> = {
  entretien: "Entretien",
  administration: "Administration",
  approvisionnement: "Approvisionnement",
  production: "Production",
  distribution: "Distribution",
};
const LIBELLES_DES_CHARGES: Readonly<Record<CodeDeCharge, string>> = { loyer: "Loyer", personnel: "Personnel", amortissement: "Usure de la ligne" };
const centre = (code: CodeDeCentre) => LIBELLES_DES_CENTRES[code].toLowerCase();

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

/** Le coût complet de janvier, de la répartition au résultat, et tout ce que le chapitre en demande. */
export function coutCompletDeJanvier(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = f.moisDeReference;
  const k = coutCompletDuMois(f);
  const r = k.centres;
  const ir = coutCompletRationnel(f);
  const cles = f.centres;
  const coutVariableUnitaire = m.coutVariable.composants + m.coutVariable.autres;
  const chargesVariables = auCentime(k.achats + k.autres);
  /** La part que l'administration cède à l'entretien (e), et celle que l'entretien cède à l'administration (a). */
  const e = cles.secondaire.administration.entretien;
  const a = cles.secondaire.entretien.administration;
  // Le point fixe : le plus petit total entier de l'entretien qui couvre ce qu'il doit répartir.
  const recalcul = (x: number) => r.primaire.entretien + e * (r.primaire.administration + a * x);
  const pointFixe = plafond((r.primaire.entretien + e * r.primaire.administration) / (1 - a * e));
  // L'erreur de méthode : l'entretien réparti d'abord, sans ce que l'administration lui rend.
  const administrationEnCascade = auCentime(r.primaire.administration + a * r.primaire.entretien);
  const perduEnCascade = auCentime(e * administrationEnCascade);
  // Les unités d'œuvre, arrondies au centime comme l'élève les écrit.
  const uo = Object.fromEntries(PRINCIPAUX.map((p) => [p, auCentime(k.coutDesUnitesDOeuvre[p])])) as Record<CentrePrincipal, number>;
  // Le coût figé : le coût de revient d'une enceinte de janvier, appliqué à d'autres volumes.
  const coutFige = auCentime(k.coutDeRevientUnitaire);
  const volumeDuCoutFige = plafond(r.total / (coutFige - coutVariableUnitaire));
  const coutALaNormale = auCentime(coutCompletDuMois(f, { quantite: cles.activiteNormale }).coutDeRevientUnitaire);
  // L'imputation rationnelle.
  const imputation = imputationRationnelle(r.total, m.quantite, cles.activiteNormale);
  const coutRationnel = auCentime(ir.coutDeRevientUnitaire);
  // La commande sous le coût complet : entre le coût variable et le coût de revient.
  const commande = Math.max(1, Math.round(m.quantite * PART_DE_LA_COMMANDE));
  const prixDeLaCommande = Math.round((coutVariableUnitaire + k.coutDeRevientUnitaire) / 2);
  // La variante : le contrat de maintenance, à la charge de l'entretien.
  const primaireVariante = { ...r.primaire, entretien: auCentime(r.primaire.entretien + CONTRAT_DE_MAINTENANCE) };
  const totauxVariante = prestationsReciproques(f, primaireVariante);
  const cessionVariante = (x: CentreAuxiliaire, vers: CodeDeCentre) => auCentime(totauxVariante[x] * cles.secondaire[x][vers]);
  const productionVariante = auCentime(primaireVariante.production + cessionVariante("entretien", "production") + cessionVariante("administration", "production"));
  const coutDeRevientVariante = auCentime(chargesVariables + r.total + CONTRAT_DE_MAINTENANCE);
  const variante = {
    entretienPrimaire: primaireVariante.entretien,
    entretien: totauxVariante.entretien,
    administration: totauxVariante.administration,
    production: productionVariante,
    cessionsALaProduction: [cessionVariante("entretien", "production"), cessionVariante("administration", "production")] as const,
    coutDeRevient: coutDeRevientVariante,
    unitaire: auCentime(coutDeRevientVariante / m.quantite),
  };
  // Le calcul à rebours : avril, dont on ne connaît que le coût de revient d'une enceinte.
  const ventesDuMois = (i: number) => f.semestre.clienteles.reduce((t, cl) => t + cl.quantites[i]!, 0);
  const ventesARebours = ventesDuMois(MOIS_A_REBOURS);
  const coutARebours = auCentime(coutCompletDuMois(f, { quantite: ventesARebours }).coutDeRevientUnitaire);
  const fixesParEnceinteARebours = auCentime(coutARebours - coutVariableUnitaire);
  const sousActiviteARebours = imputationRationnelle(r.total, ventesARebours, cles.activiteNormale).difference;
  return {
    f,
    m,
    k,
    r,
    ir,
    cles,
    coutVariableUnitaire,
    chargesVariables,
    e,
    a,
    recalcul,
    pointFixe,
    administrationEnCascade,
    perduEnCascade,
    uo,
    coutFige,
    volumeDuCoutFige,
    coutALaNormale,
    imputation,
    coutRationnel,
    commande,
    prixDeLaCommande,
    gainDeLaCommande: auCentime(commande * (prixDeLaCommande - coutVariableUnitaire)),
    variante,
    moisARebours: f.semestre.mois[MOIS_A_REBOURS]!.nom,
    ventesARebours,
    coutARebours,
    fixesParEnceinteARebours,
    sousActiviteARebours,
  };
}

export type CoutCompletDeJanvier = ReturnType<typeof coutCompletDeJanvier>;

/** Le laboratoire : le coût d'une enceinte et ce que chaque méthode incorpore, pour des ventes quelconques. */
export function laboratoireDuCout(f: FicheDeGestion, ventes: number, methode: number) {
  const reel = coutCompletDuMois(f, { quantite: ventes });
  const ir = coutCompletRationnel(f, { quantite: ventes });
  const rationnel = methode === METHODES.rationnel;
  const imputees = auCentime(PRINCIPAUX.reduce((t, p) => t + ir.parCentre[p].imputees, 0));
  return {
    reelUnitaire: reel.coutDeRevientUnitaire,
    rationnelUnitaire: ir.coutDeRevientUnitaire,
    unitaire: auCentime(rationnel ? ir.coutDeRevientUnitaire : reel.coutDeRevientUnitaire),
    incorporees: rationnel ? imputees : reel.centres.total,
    difference: rationnel ? ir.differences : 0,
    resultat: reel.resultat,
  };
}

/** Le mois de janvier : le document du chapitre. */
function tableauDuMois(x: CoutCompletDeJanvier): TableauDeDonnees {
  const { f, m } = x;
  return {
    titre: `Le mois de janvier de ${f.entreprise}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: `${f.unites.charAt(0).toUpperCase()}${f.unites.slice(1)} fabriquées et ${accord(f, "vendu")}s`, valeurs: [qte(m.quantite)] },
      { libelle: `Prix de vente d'une ${f.unite}, hors taxes`, valeurs: [eur(m.prix)] },
      { libelle: `Composants d'une ${f.unite}`, valeurs: [eur(m.coutVariable.composants)] },
      { libelle: `Autres coûts d'une ${f.unite} (${m.autresCoutsVariables})`, valeurs: [eur(m.coutVariable.autres)] },
      ...CHARGES.map((k) => ({ libelle: `${LIBELLES_DES_CHARGES[k]}, du mois`, valeurs: [eur(m.chargesFixes[k])] })),
      { libelle: `Activité normale, en ${f.unites} par mois`, valeurs: [qte(x.cles.activiteNormale)] },
    ],
  };
}

/** Les clés de la répartition primaire : chaque charge, et la part de chaque centre. */
function tableauPrimaire(x: CoutCompletDeJanvier): TableauDeDonnees {
  return {
    titre: "Les clés de la répartition primaire",
    colonnes: CHARGES.map((k) => LIBELLES_DES_CHARGES[k]),
    lignes: [
      { libelle: "À répartir", valeurs: CHARGES.map((k) => eur(x.m.chargesFixes[k])) },
      ...CENTRES.map((cc) => ({ libelle: LIBELLES_DES_CENTRES[cc], valeurs: CHARGES.map((k) => pct(x.cles.primaire[k][cc], 0)) })),
    ],
  };
}

/** La répartition primaire et les clés de la répartition secondaire, centre par centre. */
function tableauSecondaire(x: CoutCompletDeJanvier): TableauDeDonnees {
  return {
    titre: "Les clés de la répartition secondaire",
    colonnes: CENTRES.map((cc) => LIBELLES_DES_CENTRES[cc]),
    lignes: [
      { libelle: "Répartition primaire", valeurs: CENTRES.map((cc) => eur(x.r.primaire[cc])) },
      ...AUXILIAIRES.map((au) => ({ libelle: `Ce que cède ${au === "entretien" ? "l'entretien" : "l'administration"}`, valeurs: CENTRES.map((cc) => pct(x.cles.secondaire[au][cc], 0)) })),
    ],
  };
}

/** Le tableau de répartition complet de janvier : la synthèse. */
function tableauComplet(x: CoutCompletDeJanvier): TableauDeDonnees {
  const { r, f } = x;
  const cession = (au: CentreAuxiliaire) => CENTRES.map((cc) => eur(cc === au ? -r.auxiliaires[au] : r.cessions[au][cc]));
  return {
    titre: `Le tableau de répartition de janvier · ${f.entreprise}`,
    colonnes: CENTRES.map((cc) => LIBELLES_DES_CENTRES[cc]),
    lignes: [
      { libelle: "Répartition primaire", valeurs: CENTRES.map((cc) => eur(r.primaire[cc])) },
      { libelle: "Cession de l'entretien", valeurs: cession("entretien") },
      { libelle: "Cession de l'administration", valeurs: cession("administration") },
      { libelle: "Total après répartition", valeurs: CENTRES.map((cc) => eur(cc === "entretien" || cc === "administration" ? 0 : r.principaux[cc])) },
      { libelle: "Unité d'œuvre", valeurs: CENTRES.map((cc) => (cc === "entretien" || cc === "administration" ? "" : x.cles.unitesDOeuvre[cc].libelle)) },
      { libelle: "Coût de l'unité d'œuvre", valeurs: CENTRES.map((cc) => (cc === "entretien" || cc === "administration" ? "" : eur(x.uo[cc]))) },
    ],
  };
}

export const COUT_COMPLET: Chapitre = {
  code: "cout-complet",
  parcours: "controle-de-gestion",
  palier: 3,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Coût complet et centres d'analyse",
  accroche:
    "Le même mois que le seuil de rentabilité, par l'autre méthode : chaque charge suivie jusqu'au produit, par cinq centres d'analyse qui se rendent service, jusqu'au coût de revient et à l'imputation rationnelle.",
  objectifs: [
    "Distinguer les charges directes et indirectes, et répartir les charges indirectes entre les centres",
    "Résoudre les prestations réciproques de deux centres auxiliaires par un système de deux équations",
    "Calculer le coût des unités d'œuvre et remonter la chaîne des coûts jusqu'au résultat analytique",
    "Chiffrer l'imputation rationnelle des charges fixes et le coût de la sous-activité",
    "Refaire un tableau de répartition complet, et remonter d'un coût de revient aux ventes",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_COUT_COMPLET,
    pourquoi:
      "le coût complet se calcule ici sur le mois de janvier de NOVA, dans la simulation du cours, avec cinq centres d'analyse et des clés que le cours pose ; la méthode est celle que vous appliquerez à votre entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une autre façon de compter",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauDuMois(coutCompletDeJanvier(c)),
      texte: (c) => {
        const { f, m, cles } = coutCompletDeJanvier(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, au même mois de janvier que « Le seuil de rentabilité ». Les charges s'y rangeaient en variables et fixes, pour savoir combien vendre. Cette fois, on veut savoir ce que coûte, tout compris, chacune des ${qte(m.quantite)} ${f.unites} ${accord(f, "vendu")}s.`,
          "La méthode des coûts complets range les charges autrement. Les charges directes se rattachent au produit sans calcul : les composants qu'il consomme. Les charges indirectes servent à toute l'entreprise : il faut les répartir, par des centres d'analyse, avant d'être imputées aux produits.",
          `La simulation suppose que ${f.entreprise} fabrique ce qu'elle vend, sans stock, et que toutes ses charges indirectes sont fixes. Elle les découpe en cinq centres, avec des clés que le cours pose : le loyer selon les surfaces, le personnel selon le temps passé, l'usure selon l'emploi de la ligne. Son activité normale est de ${qte(cles.activiteNormale)} ${f.unites} par mois.`,
        ];
      },
      repere: () =>
        "Coût d'achat (composants et approvisionnement), coût de production (coût d'achat, autres charges directes et production), coût de revient (coût de production et distribution) : chaque étage ajoute ses charges.",
    },
    {
      id: "directes-ou-indirectes",
      objectifs: [0],
      type: "tri",
      titre: "Directes ou indirectes",
      notions: ["full_unit_cost"],
      question: () => "Rangez les charges du mois : directes, ou indirectes ?",
      categories: [
        { code: "directe", libelle: "Directe" },
        { code: "indirecte", libelle: "Indirecte" },
      ],
      elements: (c) => {
        const { f, m, k } = coutCompletDeJanvier(c);
        return [
          { libelle: "Composants consommés", montant: k.achats, categorie: "directe", pourquoi: `${eur(m.coutVariable.composants)} par ${f.unite} : ils se rattachent au produit sans calcul.` },
          { libelle: "Loyer", montant: m.chargesFixes.loyer, categorie: "indirecte", pourquoi: "Le local sert à toute l'entreprise : il faut le répartir." },
          { libelle: `Autres coûts par ${f.unite} (${m.autresCoutsVariables})`, montant: k.autres, categorie: "directe", pourquoi: "Ils se comptent unité par unité : directs." },
          {
            libelle: "Personnel",
            montant: m.chargesFixes.personnel,
            categorie: "indirecte",
            pourquoi: "Ici, l'équipe travaille pour toute l'entreprise : on la répartit par centre. Un ouvrier attaché à un seul produit serait une charge directe (la main-d'œuvre directe).",
          },
          { libelle: "Usure de la ligne de montage", montant: m.chargesFixes.amortissement, categorie: "indirecte", pourquoi: "La ligne sert à toute la production : elle se répartit." },
        ];
      },
      explication: (c) => {
        const { r } = coutCompletDeJanvier(c);
        return [
          `${eur(r.total)} de charges indirectes à répartir. Ici, les charges directes sont aussi les variables, et les indirectes les fixes ; ce n'est pas une règle. Un local réservé à un seul produit serait une charge directe, et fixe.`,
        ];
      },
    },
    {
      id: "repartition-primaire",
      objectifs: [0],
      type: "montants",
      titre: "La répartition primaire",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauPrimaire(coutCompletDeJanvier(c)),
      question: () =>
        "Répartissez les charges indirectes entre les cinq centres : chaque centre reçoit chaque charge multipliée par sa clé (tableau), et ses trois parts s'additionnent.",
      champs: (c) => {
        const x = coutCompletDeJanvier(c);
        return CENTRES.map((cc) => ({
          libelle: `Centre ${centre(cc)}`,
          attendu: x.r.primaire[cc],
          tolerance: 0.05,
          calcul: `${CHARGES.map((k) => `${eur(x.m.chargesFixes[k])} × ${pct(x.cles.primaire[k][cc], 0)}`).join(" + ")} = ${eur(x.r.primaire[cc])}`,
        }));
      },
      explication: (c) => {
        const { r } = coutCompletDeJanvier(c);
        return [
          `Les cinq centres réunis font ${eur(r.total)} : rien ne se perd, tout est rangé. L'entretien et l'administration ne produisent rien que l'on vende : ce sont des centres auxiliaires, qui servent les autres et se répartissent à leur tour. Mais ils se servent aussi l'un l'autre.`,
        ];
      },
    },
    {
      id: "predire-les-prestations",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur l'entretien",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauSecondaire(coutCompletDeJanvier(c)),
      question: (c) => {
        const { e, a } = coutCompletDeJanvier(c);
        return `Avant de calculer, pariez. L'entretien cède ${pct(a, 0)} de son total à l'administration, et l'administration lui en cède ${pct(e, 0)} du sien (tableau). Le total que l'entretien doit répartir sera…`;
      },
      options: (c) => {
        const { r } = coutCompletDeJanvier(c);
        const voir = "Faites varier le total de l'entretien à l'étape suivante : le curseur montre le seul total qui tient.";
        return [
          { texte: `Plus que ses ${eur(r.primaire.entretien)} : il reçoit une part de l'administration`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Ses ${eur(r.primaire.entretien)} : un centre ne répartit que ses propres charges`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Moins que sa répartition primaire : il en cède une part à l'administration", juste: false, retour: `Pari à vérifier : ce qu'il cède sort de son total, cela ne le réduit pas. ${voir}` },
        ];
      },
    },
    {
      id: "le-point-fixe",
      objectifs: [1],
      type: "curseur",
      titre: "Le total qui se retrouve lui-même",
      notions: ["full_unit_cost"],
      question: (c) => {
        const { r, e, a } = coutCompletDeJanvier(c);
        return `Supposez un total de l'entretien, de ${eur(ENTRETIEN_DU_CURSEUR.min)} à ${eur(ENTRETIEN_DU_CURSEUR.max)}. L'administration en reçoit ${pct(a, 0)}, puis en rend ${pct(e, 0)} de son propre total à l'entretien. Une droite donne le total supposé, l'autre l'entretien recalculé : ses ${eur(r.primaire.entretien)}, plus ce que l'administration lui rend. Placez le curseur sur le plus petit total qui couvre son recalcul, puis validez.`;
      },
      grandeur: () => ({ libelle: "Total supposé de l'entretien", unite: "€" }),
      cible: (c) => ({ attendu: coutCompletDeJanvier(c).pointFixe, min: ENTRETIEN_DU_CURSEUR.min, max: ENTRETIEN_DU_CURSEUR.max }),
      zones: ["Le total supposé couvre son recalcul", "Le total supposé est trop court"],
      rates: () => ({
        dessous: "À cette position, l'entretien recalculé dépasse le total supposé : il manque ce que l'administration lui rend.",
        dessus: "Plus bas, le total supposé couvre encore son recalcul : cherchez le plus petit.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, t) => {
        const { r, e, a, recalcul } = coutCompletDeJanvier(c);
        const administration = auCentime(r.primaire.administration + a * t);
        return [
          { libelle: "Total supposé de l'entretien", montant: t },
          { libelle: "Administration, avec sa part de cet entretien", montant: administration },
          { libelle: "Ce que l'administration rend à l'entretien", montant: auCentime(e * administration) },
          { libelle: "Entretien recalculé", montant: auCentime(recalcul(t)) },
          { libelle: "Différence", montant: auCentime(t - recalcul(t)), fort: true },
        ];
      },
      droites: (c) => {
        const { recalcul } = coutCompletDeJanvier(c);
        return { produit: (t) => t, cout: (t) => recalcul(t), libelles: ["Total supposé de l'entretien", "Entretien recalculé"] };
      },
      explication: (c) => {
        const { r, e, a } = coutCompletDeJanvier(c);
        return [
          `Les deux droites se croisent à ${eur(r.auxiliaires.entretien)} : c'est le seul total qui se retrouve lui-même, une fois l'administration servie. Le curseur, à l'euro, s'arrête juste au-dessus.`,
          `La droite du recalcul est presque plate : chaque euro supposé en plus ne revient à l'entretien que pour ${pct(a * e, 0)} (${pct(a, 0)} × ${pct(e, 0)}). Le croisement est la solution d'un système de deux équations : c'est ce que l'étape suivante fait poser.`,
        ];
      },
    },
    {
      id: "prestations-reciproques",
      objectifs: [1],
      type: "montants",
      titre: "Les prestations réciproques",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauSecondaire(coutCompletDeJanvier(c)),
      question: () =>
        "Chaque centre auxiliaire se répartit pour son total : ses charges de la répartition primaire, plus ce que l'autre lui cède. Posez les deux équations, l'entretien et l'administration, résolvez le système, puis calculez ce que l'administration cède à l'entretien.",
      champs: (c) => {
        const { r, e, a } = coutCompletDeJanvier(c);
        const E0 = r.primaire.entretien;
        const A0 = r.primaire.administration;
        return [
          {
            libelle: "Total de l'entretien",
            attendu: r.auxiliaires.entretien,
            calcul: `E = ${eur(E0)} + ${pct(e, 0)} × A et A = ${eur(A0)} + ${pct(a, 0)} × E, d'où E = (${eur(E0)} + ${pct(e, 0)} × ${eur(A0)}) ÷ (1 − ${pct(e, 0)} × ${pct(a, 0)}) = ${qte(E0 + e * A0, 3)} € ÷ ${qte(1 - a * e)} = ${eur(r.auxiliaires.entretien)}`,
          },
          {
            libelle: "Total de l'administration",
            attendu: r.auxiliaires.administration,
            calcul: `A = ${eur(A0)} + ${pct(a, 0)} × ${eur(r.auxiliaires.entretien)} = ${eur(r.auxiliaires.administration)}`,
          },
          {
            libelle: "Part de l'administration cédée à l'entretien",
            attendu: r.cessions.administration.entretien,
            calcul: `${pct(e, 0)} × ${eur(r.auxiliaires.administration)} = ${eur(r.cessions.administration.entretien)}, et ${eur(E0)} + ${eur(r.cessions.administration.entretien)} = ${eur(r.auxiliaires.entretien)} : la première équation est satisfaite`,
          },
        ];
      },
      explication: (c) => {
        const { r } = coutCompletDeJanvier(c);
        return [
          `L'entretien répartit ${eur(r.auxiliaires.entretien)}, et non ses ${eur(r.primaire.entretien)} : il porte aussi ce que l'administration a fait pour lui. Les deux totaux réunis, ${eur(auCentime(r.auxiliaires.entretien + r.auxiliaires.administration))}, dépassent leurs ${eur(auCentime(r.primaire.entretien + r.primaire.administration))} de charges primaires : ce qu'ils s'échangent est compté chez l'un puis chez l'autre, et ressort en cessions.`,
        ];
      },
    },
    {
      id: "repartition-secondaire",
      objectifs: [1],
      type: "montants",
      titre: "La répartition secondaire",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauSecondaire(coutCompletDeJanvier(c)),
      question: () =>
        "Répartissez maintenant les deux centres auxiliaires, chacun pour son total, selon les clés du tableau. Quel est le total de chaque centre principal ?",
      champs: (c) => {
        const { r, cles } = coutCompletDeJanvier(c);
        return PRINCIPAUX.map((p) => {
          const parts = AUXILIAIRES.filter((au) => cles.secondaire[au][p] > 0);
          return {
            libelle: `Total du centre ${centre(p)}`,
            attendu: r.principaux[p],
            tolerance: 0.05,
            calcul: `${eur(r.primaire[p])} + ${parts.map((au) => `${pct(cles.secondaire[au][p], 0)} × ${eur(r.auxiliaires[au])}`).join(" + ")} = ${eur(r.primaire[p])} + ${parts.map((au) => eur(r.cessions[au][p])).join(" + ")} = ${eur(r.principaux[p])}`,
          };
        });
      },
      explication: (c) => {
        const { r } = coutCompletDeJanvier(c);
        return [
          `Les trois centres principaux réunis font ${eur(r.total)} : toutes les charges indirectes sont maintenant là où l'on achète, produit et vend. Chaque centre auxiliaire a cédé tout son total, ce qu'il a reçu de l'autre compris : il finit vide.`,
        ];
      },
    },
    {
      id: "oublier-la-reciprocite",
      objectifs: [1],
      type: "choix",
      titre: "Une répartition en cascade",
      notions: ["full_unit_cost"],
      question: (c) => {
        const { r, administrationEnCascade } = coutCompletDeJanvier(c);
        return `Un stagiaire répartit l'entretien d'abord, pour ses ${eur(r.primaire.entretien)}, puis l'administration, pour ${eur(administrationEnCascade)}, selon les mêmes clés ; mais l'entretien étant déjà réparti, il ne sait plus où mettre la part que l'administration lui rend. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const { r, perduEnCascade } = coutCompletDeJanvier(c);
        return [
          {
            texte: `Son tableau perd ${eur(perduEnCascade)} : les centres principaux ne retrouvent plus toutes les charges`,
            juste: true,
            retour: `Oui. Ses centres principaux ne totalisent que ${eur(auCentime(r.total - perduEnCascade))}, pour ${eur(r.total)} de charges. Quand deux centres se rendent service, aucun ordre ne marche : il faut résoudre le système, ou l'on perd ce que chacun doit à l'autre.`,
          },
          { texte: "Rien ne change : l'ordre des centres ne déplace pas les charges", juste: false, retour: `Non : en cascade, la prestation de l'administration à l'entretien n'a plus de place. ${eur(perduEnCascade)} restent dans un centre déjà réparti.` },
          { texte: `Il compte ${eur(perduEnCascade)} deux fois, une fois dans chaque centre`, juste: false, retour: "Non : c'est l'inverse. La part rendue à l'entretien n'est comptée nulle part dans les centres principaux : elle manque." },
        ];
      },
    },
    {
      id: "unites-d-oeuvre",
      objectifs: [2],
      type: "montants",
      titre: "Le coût des unités d'œuvre",
      notions: ["full_unit_cost"],
      question: (c) => {
        const { cles } = coutCompletDeJanvier(c);
        return `Chaque centre principal a son unité d'œuvre, qui mesure son activité : ${PRINCIPAUX.map((p) => `${centre(p)}, ${cles.unitesDOeuvre[p].libelle}`).join(" ; ")}. Calculez le coût de chaque unité d'œuvre en janvier, au centime.`;
      },
      champs: (c) => {
        const { k, r, uo, cles } = coutCompletDeJanvier(c);
        const nombre = (p: CentrePrincipal) =>
          cles.unitesDOeuvre[p].nature === "achats"
            ? `(${eur(k.achats)} ÷ ${qte(cles.unitesDOeuvre[p].assiette)})`
            : cles.unitesDOeuvre[p].nature === "chiffreDAffaires"
              ? `(${eur(k.chiffreDAffaires)} ÷ ${qte(cles.unitesDOeuvre[p].assiette)})`
              : qte(k.activite[p]);
        return PRINCIPAUX.map((p) => ({
          libelle: `${LIBELLES_DES_CENTRES[p]} : coût de l'unité d'œuvre`,
          attendu: uo[p],
          tolerance: 0.01,
          calcul: cles.unitesDOeuvre[p].nature === "quantite" ? `${eur(r.principaux[p])} ÷ ${nombre(p)} = ${eur(uo[p])}` : `${eur(r.principaux[p])} ÷ ${nombre(p)} = ${eur(r.principaux[p])} ÷ ${qte(k.activite[p])} = ${eur(uo[p])}`,
        }));
      },
      explication: () => [
        "Le coût de l'unité d'œuvre est le prix d'un peu d'activité du centre. Il sert à imputer à chaque produit ce qu'il a consommé : à une seule référence comme ici, tout ; à une gamme, sa part.",
      ],
    },
    {
      id: "chaine-des-couts",
      objectifs: [2],
      type: "montants",
      titre: "La chaîne des coûts",
      notions: ["full_unit_cost"],
      question: (c) => {
        const { f } = coutCompletDeJanvier(c);
        return `Remontez la chaîne des coûts de janvier, du coût d'achat des composants au coût de revient, puis le coût de revient d'une ${f.unite} et le résultat analytique du mois.`;
      },
      champs: (c) => {
        const { m, k, r } = coutCompletDeJanvier(c);
        return [
          { libelle: "Coût d'achat", attendu: k.coutDAchat, tolerance: 0.05, calcul: `${qte(m.quantite)} × ${eur(m.coutVariable.composants)} + ${eur(r.principaux.approvisionnement)} = ${eur(k.achats)} + ${eur(r.principaux.approvisionnement)} = ${eur(k.coutDAchat)}` },
          {
            libelle: "Coût de production",
            attendu: k.coutDeProduction,
            tolerance: 0.05,
            calcul: `${eur(k.coutDAchat)} + ${qte(m.quantite)} × ${eur(m.coutVariable.autres)} + ${eur(r.principaux.production)} = ${eur(k.coutDAchat)} + ${eur(k.autres)} + ${eur(r.principaux.production)} = ${eur(k.coutDeProduction)}`,
          },
          { libelle: "Coût de revient", attendu: k.coutDeRevient, tolerance: 0.05, calcul: `${eur(k.coutDeProduction)} + ${eur(r.principaux.distribution)} = ${eur(k.coutDeRevient)}` },
          { libelle: "Coût de revient d'une unité", attendu: auCentime(k.coutDeRevientUnitaire), tolerance: 0.01, calcul: `${eur(k.coutDeRevient)} ÷ ${qte(m.quantite)} = ${eur(auCentime(k.coutDeRevientUnitaire))}` },
          { libelle: "Résultat analytique du mois", attendu: k.resultat, tolerance: 0.05, calcul: `${eur(k.chiffreDAffaires)} − ${eur(k.coutDeRevient)} = ${eur(k.resultat)}` },
        ];
      },
      explication: (c) => {
        const { f, m, k } = coutCompletDeJanvier(c);
        return [
          `Chaque ${f.unite} ${accord(f, "vendu")} coûte ${eur(auCentime(k.coutDeRevientUnitaire))} tout compris, pour un prix de ${eur(m.prix)}. ${m.prix >= k.coutDeRevientUnitaire ? "Le prix couvre le coût complet" : "Le prix ne couvre pas le coût complet"}, et le mois laisse ${eur(k.resultat)}.`,
        ];
      },
    },
    {
      id: "meme-resultat",
      objectifs: [2],
      type: "choix",
      titre: "Deux méthodes, un résultat",
      notions: ["full_unit_cost", "breakeven"],
      question: (c) => {
        const { k } = coutCompletDeJanvier(c);
        return `Dans « Le seuil de rentabilité », le compte de résultat différentiel du même mois donnait ${eur(k.resultat)}. Le coût complet donne le même chiffre. Pourquoi ?`;
      },
      options: () => [
        {
          texte: "Parce que les deux méthodes rangent les mêmes charges autrement : le total ne change pas.",
          juste: true,
          retour:
            "C'est cela. Variables et fixes, ou directes et indirectes : ce sont deux lectures des mêmes charges. Le résultat est le même ; ce qui change, c'est ce que chaque méthode permet de voir : le seuil d'un côté, le coût de chaque étage de l'autre.",
        },
        { texte: "C'est une coïncidence de ce mois-ci.", juste: false, retour: "Ce n'est pas un hasard : quand toutes les charges sont incorporées, les deux méthodes retrouvent le même résultat, tous les mois." },
        { texte: "Parce que les clés de répartition ont été choisies pour.", juste: false, retour: "Changez les clés : les coûts de chaque centre bougent, le résultat non. Les clés déplacent les charges entre les centres, elles ne les font pas disparaître." },
      ],
    },
    {
      id: "predire-le-volume",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le volume",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const { f, m, coutFige, cles } = coutCompletDeJanvier(c);
        return `Avant d'aller plus loin, pariez. Le coût de revient d'une ${f.unite}, ${eur(coutFige)}, a été calculé sur les ${qte(m.quantite)} ${f.unites} de janvier. Si ${f.entreprise} en vendait ${qte(cles.activiteNormale)}, son activité normale, le coût de revient d'une ${f.unite} serait…`;
      },
      options: () => {
        const voir = "Faites varier le volume à l'étape suivante : le curseur montre ce que vaut un coût complet figé.";
        return [
          { texte: "Plus bas : les charges fixes se partageraient sur plus d'unités", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le même : c'est le coût du produit, pas celui du mois", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus haut : plus de ventes, c'est plus de charges", juste: false, retour: `Pari à vérifier : seules les charges variables suivent les ventes. ${voir}` },
        ];
      },
    },
    {
      id: "le-cout-fige",
      objectifs: [3],
      type: "curseur",
      titre: "Un coût complet figé",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const { f, coutFige, coutVariableUnitaire, r } = coutCompletDeJanvier(c);
        return `Le coût de revient d'une ${f.unite} est figé à ${eur(coutFige)}, celui de janvier. Faites varier les ${f.unites} du mois : une droite donne ce que coûterait le mois au coût figé, l'autre son coût réel (${eur(coutVariableUnitaire)} par ${f.unite}, plus ${eur(r.total)} de charges fixes). Placez le curseur sur le plus petit nombre d'${f.unites} où le coût figé couvre le coût réel, puis validez.`;
      },
      grandeur: (c) => {
        const { f } = coutCompletDeJanvier(c);
        return { libelle: `${f.unites.charAt(0).toUpperCase()}${f.unites.slice(1)} du mois`, unite: f.unites };
      },
      cible: (c) => ({ attendu: coutCompletDeJanvier(c).volumeDuCoutFige, min: ENCEINTES_DU_CURSEUR.min, max: ENCEINTES_DU_CURSEUR.max }),
      zones: ["Le coût figé surestime le coût réel", "Le coût figé sous-estime le coût réel"],
      rates: () => ({
        dessous: "À cette position, le coût figé ne couvre pas le coût réel : des charges fixes restent sans unités pour les porter.",
        dessus: "Plus bas, le coût figé couvre encore le coût réel : cherchez le plus petit volume.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, q) => {
        const { f, coutFige, coutVariableUnitaire, r } = coutCompletDeJanvier(c);
        const reel = auCentime(coutVariableUnitaire * q + r.total);
        return [
          { libelle: "Coût du mois au coût figé", montant: auCentime(coutFige * q) },
          { libelle: "Coût réel du mois", montant: reel },
          { libelle: `Coût réel d'une ${f.unite}`, montant: auCentime(reel / q) },
          { libelle: "Coût figé moins coût réel", montant: auCentime(coutFige * q - reel), fort: true },
        ];
      },
      droites: (c) => {
        const { coutFige, coutVariableUnitaire, r } = coutCompletDeJanvier(c);
        return { produit: (q) => coutFige * q, cout: (q) => coutVariableUnitaire * q + r.total, libelles: ["Coût du mois au coût figé", "Coût réel du mois"] };
      },
      explication: (c) => {
        const { f, m, cles, coutALaNormale } = coutCompletDeJanvier(c);
        return [
          `Les droites se croisent au volume du calcul, ${qte(m.quantite)} ${f.unites} (le centime d'arrondi du coût figé décale la réponse d'une unité) : le coût complet d'une ${f.unite} ne vaut qu'au volume où on l'a calculé. En dessous, il oublie des charges fixes ; au-dessus, il en compte trop.`,
          `À ${qte(cles.activiteNormale)} ${f.unites}, le coût réel d'une ${f.unite} n'est que de ${eur(coutALaNormale)}. Un devis chiffré au coût de janvier dépend donc du hasard des ventes du mois : c'est ce que l'imputation rationnelle corrige.`,
        ];
      },
    },
    {
      id: "imputation-rationnelle",
      objectifs: [3],
      type: "montants",
      titre: "L'imputation rationnelle",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const { f, cles } = coutCompletDeJanvier(c);
        return `L'imputation rationnelle n'incorpore aux coûts que la part des charges fixes que l'activité justifie : les charges fixes multipliées par le coefficient activité réelle ÷ activité normale. L'activité normale de ${f.entreprise} est de ${qte(cles.activiteNormale)} ${f.unites} par mois. Calculez le coefficient de janvier, les charges fixes imputées, puis le coût de la sous-activité (charges fixes moins charges imputées).`;
      },
      champs: (c) => {
        const { m, r, cles, imputation } = coutCompletDeJanvier(c);
        return [
          { libelle: "Coefficient d'imputation rationnelle", attendu: auCentime(imputation.coefficient), calcul: `${qte(m.quantite)} ÷ ${qte(cles.activiteNormale)} = ${qte(imputation.coefficient)}` },
          { libelle: "Charges fixes imputées", attendu: imputation.imputees, calcul: `${eur(r.total)} × ${qte(imputation.coefficient)} = ${eur(imputation.imputees)}` },
          { libelle: "Coût de la sous-activité", attendu: imputation.difference, calcul: `${eur(r.total)} − ${eur(imputation.imputees)} = ${eur(imputation.difference)}` },
        ];
      },
      explication: (c) => {
        const { f, imputation } = coutCompletDeJanvier(c);
        return [
          `En janvier, ${f.entreprise} ne tourne qu'à ${pct(imputation.coefficient, 0)} de son activité normale. Les ${eur(imputation.difference)} de charges fixes que cette activité ne justifie pas ne chargent plus le coût des ${f.unites} : ils forment le coût de la sous-activité, une charge de la période, qui va directement au résultat.`,
          "Au-dessus de l'activité normale, le coefficient dépasse 1 : on impute plus de charges fixes qu'il n'y en a, et la différence devient un boni de suractivité.",
        ];
      },
    },
    {
      id: "cout-rationnel",
      objectifs: [3],
      type: "montants",
      titre: "Le coût de revient rationnel",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const { f } = coutCompletDeJanvier(c);
        return `Sans formule : le coût de revient rationnel de janvier, celui d'une ${f.unite}, puis le résultat analytique avant et après le coût de la sous-activité.`;
      },
      champs: (c) => {
        const { m, k, ir, chargesVariables, imputation, coutRationnel } = coutCompletDeJanvier(c);
        return [
          { libelle: "Coût de revient rationnel du mois", attendu: ir.coutDeRevient, tolerance: 0.05, calcul: `${eur(chargesVariables)} de charges directes + ${eur(imputation.imputees)} de charges fixes imputées = ${eur(ir.coutDeRevient)}` },
          { libelle: "Coût de revient rationnel d'une unité", attendu: coutRationnel, tolerance: 0.01, calcul: `${eur(ir.coutDeRevient)} ÷ ${qte(m.quantite)} = ${eur(coutRationnel)}` },
          { libelle: "Résultat avant le coût de la sous-activité", attendu: ir.resultatAvantDifferences, tolerance: 0.05, calcul: `${eur(k.chiffreDAffaires)} − ${eur(ir.coutDeRevient)} = ${eur(ir.resultatAvantDifferences)}` },
          { libelle: "Résultat analytique après la sous-activité", attendu: ir.resultat, tolerance: 0.05, calcul: `${eur(ir.resultatAvantDifferences)} − ${eur(ir.differences)} = ${eur(ir.resultat)}` },
        ];
      },
      explication: (c) => {
        const { f, cles, coutRationnel, ir } = coutCompletDeJanvier(c);
        return [
          `Le coût rationnel d'une ${f.unite}, ${eur(coutRationnel)}, est son coût réel à l'activité normale de ${qte(cles.activiteNormale)} ${f.unites} : il ne dépend plus des ventes du mois, et c'est lui qui sert à fixer un prix durable. Le résultat final est le même qu'en coût complet réel, ${eur(ir.resultat)} : l'imputation rationnelle déplace la sous-activité du coût du produit vers le résultat, elle ne la fait pas disparaître.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-cout",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du coût complet",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const { f } = coutCompletDeJanvier(c);
        return `Faites varier les ${f.unites} du mois, et choisissez la méthode : le coût complet réel, ou l'imputation rationnelle. Le tableau suit le coût d'une ${f.unite}, les charges fixes incorporées et le résultat ; le graphique montre les deux coûts d'une ${f.unite} selon le volume. Relevez le défi.`;
      },
      leviers: (c) => {
        const { f, m } = coutCompletDeJanvier(c);
        return [
          { code: "ventes", libelle: `${f.unites.charAt(0).toUpperCase()}${f.unites.slice(1)} du mois`, unite: f.unites, min: ENCEINTES_DU_CURSEUR.min, max: ENCEINTES_DU_CURSEUR.max, pas: 10, depart: m.quantite },
          {
            code: "methode",
            libelle: "Méthode",
            unite: "",
            min: METHODES.reel,
            max: METHODES.rationnel,
            pas: 1,
            depart: METHODES.reel,
            choix: [
              { valeur: METHODES.reel, libelle: "Coût complet réel" },
              { valeur: METHODES.rationnel, libelle: "Imputation rationnelle" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const { f, m } = coutCompletDeJanvier(c);
        const l = laboratoireDuCout(f, p.ventes!, p.methode!);
        const d = laboratoireDuCout(f, m.quantite, METHODES.reel);
        return [
          { libelle: `Coût de revient d'une ${f.unite}`, montant: l.unitaire, reference: d.unitaire },
          { libelle: "Charges fixes incorporées aux coûts", montant: l.incorporees, reference: d.incorporees },
          { libelle: "Différence d'incorporation", montant: l.difference, reference: d.difference },
          { libelle: "Résultat analytique du mois", montant: l.resultat, reference: d.resultat, effet: true, fort: true },
        ];
      },
      // Le coût réel d'une enceinte selon le volume n'est pas une droite : les fixes se partagent sur plus d'unités.
      graphique: (c) => {
        const { f } = coutCompletDeJanvier(c);
        return {
          levier: "ventes",
          courbes: [
            { libelle: `Coût complet réel d'une ${f.unite}`, valeur: (p) => auCentime(laboratoireDuCout(f, p.ventes!, METHODES.reel).reelUnitaire) },
            { libelle: `Coût rationnel d'une ${f.unite}`, valeur: (p) => auCentime(laboratoireDuCout(f, p.ventes!, METHODES.rationnel).rationnelUnitaire) },
          ],
        };
      },
      defi: (c) => {
        const { f, coutRationnel, cles } = coutCompletDeJanvier(c);
        return {
          consigne: `Faites tomber le coût de revient d'une ${f.unite} à ${eur(coutRationnel)}, le coût rationnel de janvier, au centime : deux chemins y mènent.`,
          atteint: (p) => laboratoireDuCout(f, p.ventes!, p.methode!).unitaire === coutRationnel,
          indice: (p) => {
            const l = laboratoireDuCout(f, p.ventes!, p.methode!);
            return `À ${qte(p.ventes!)} ${f.unites}, une ${f.unite} coûte ${eur(l.unitaire)} : les charges fixes s'y partagent sur ${qte(p.ventes!)} unités. Cherchez le volume où elles pèsent comme à l'activité normale, ou changez de méthode.`;
          },
          solution: { ventes: cles.activiteNormale, methode: METHODES.reel },
        };
      },
      explication: (c, p) => {
        const { f, cles, coutRationnel } = coutCompletDeJanvier(c);
        const l = laboratoireDuCout(f, p.ventes!, p.methode!);
        return p.methode === METHODES.rationnel
          ? [
              `L'imputation rationnelle donne ${eur(coutRationnel)} à tout volume : elle n'incorpore que la part des charges fixes que l'activité justifie. Le reste devient la différence d'incorporation, ${eur(l.difference)} ici. Sur le graphique, sa courbe est plate ; celle du coût réel la croise à l'activité normale.`,
              "Le résultat analytique ne change pas d'une méthode à l'autre : seul le coût d'une unité change.",
            ]
          : [
              `En coût complet réel, il faut vendre exactement l'activité normale, ${qte(cles.activiteNormale)} ${f.unites}, pour retrouver ${eur(coutRationnel)} : les deux méthodes ne se rejoignent qu'à ce volume. Sur le graphique, la courbe du coût réel descend de moins en moins vite à mesure que le volume monte.`,
              "Passez à l'imputation rationnelle : le coût d'une unité reste le même à tout volume, et le résultat analytique, lui, ne change pas.",
            ];
      },
    },
    {
      id: "tableau-complet",
      objectifs: [4],
      type: "montants",
      titre: "Variante : le tableau complet",
      notions: ["full_unit_cost"],
      tableau: (c) => tableauSecondaire(coutCompletDeJanvier(c)),
      question: (c) => {
        const { f } = coutCompletDeJanvier(c);
        return `Variante : ${f.entreprise} signe un contrat de maintenance de sa ligne, ${eur(CONTRAT_DE_MAINTENANCE)} par mois, tout entier à la charge du centre entretien. Les autres charges et toutes les clés ne changent pas. Refaites la répartition : le total des deux centres auxiliaires, celui du centre production, puis le nouveau coût de revient d'une ${f.unite}.`;
      },
      champs: (c) => {
        const { f, m, r, e, a, chargesVariables, variante } = coutCompletDeJanvier(c);
        const A0 = r.primaire.administration;
        return [
          {
            libelle: "Total de l'entretien, avec le contrat",
            attendu: variante.entretien,
            tolerance: 0.05,
            calcul: `(${eur(r.primaire.entretien)} + ${eur(CONTRAT_DE_MAINTENANCE)} + ${pct(e, 0)} × ${eur(A0)}) ÷ (1 − ${pct(e, 0)} × ${pct(a, 0)}) = ${qte(variante.entretienPrimaire + e * A0, 3)} € ÷ ${qte(1 - a * e)} = ${eur(variante.entretien)}`,
          },
          { libelle: "Total de l'administration, avec le contrat", attendu: variante.administration, tolerance: 0.05, calcul: `${eur(A0)} + ${pct(a, 0)} × ${eur(variante.entretien)} = ${eur(variante.administration)}` },
          {
            libelle: "Total du centre production, avec le contrat",
            attendu: variante.production,
            tolerance: 0.1,
            calcul: `${eur(r.primaire.production)} + ${eur(variante.cessionsALaProduction[0])} de l'entretien + ${eur(variante.cessionsALaProduction[1])} de l'administration = ${eur(variante.production)}`,
          },
          {
            libelle: `Coût de revient d'une ${f.unite}, avec le contrat`,
            attendu: variante.unitaire,
            tolerance: 0.01,
            calcul: `(${eur(chargesVariables)} + ${eur(r.total)} + ${eur(CONTRAT_DE_MAINTENANCE)}) ÷ ${qte(m.quantite)} = ${eur(variante.coutDeRevient)} ÷ ${qte(m.quantite)} = ${eur(variante.unitaire)}`,
          },
        ];
      },
      explication: (c) => {
        const { f, k, r, variante } = coutCompletDeJanvier(c);
        return [
          `Le contrat ne reste pas à l'entretien : par les prestations réciproques, il se répand sur les trois centres principaux. L'entretien répartit ${eur(auCentime(variante.entretien - r.auxiliaires.entretien))} de plus, un peu plus que le contrat, parce qu'une part lui revient par l'administration.`,
          `Chaque ${f.unite} coûte ${eur(variante.unitaire)} tout compris, ${eur(auCentime(variante.unitaire - auCentime(k.coutDeRevientUnitaire)))} de plus qu'en janvier. Le coût de revient total monte exactement du contrat : les clés déplacent les charges, elles ne les créent pas.`,
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Retrouver les ventes à rebours",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const { f, moisARebours, coutARebours } = coutCompletDeJanvier(c);
        return `En ${moisARebours}, le contrôleur ne retrouve qu'un chiffre : le coût de revient d'une ${f.unite}, ${eur(coutARebours)}. Les coûts variables et les charges fixes sont ceux de janvier. Retrouvez les charges fixes portées par une ${f.unite}, les ventes du mois (à l'unité), puis le coût de la sous-activité du mois en imputation rationnelle.`;
      },
      champs: (c) => {
        const { f, r, cles, coutVariableUnitaire, coutARebours, fixesParEnceinteARebours, ventesARebours, sousActiviteARebours } = coutCompletDeJanvier(c);
        return [
          { libelle: `Charges fixes portées par une ${f.unite}`, attendu: fixesParEnceinteARebours, calcul: `${eur(coutARebours)} − ${eur(coutVariableUnitaire)} de coût variable = ${eur(fixesParEnceinteARebours)}` },
          { libelle: "Ventes du mois", attendu: ventesARebours, tolerance: 1, calcul: `${eur(r.total)} ÷ ${eur(fixesParEnceinteARebours)} = ${qte(r.total / fixesParEnceinteARebours)}, soit ${qte(ventesARebours)} ${f.unites}` },
          {
            libelle: "Coût de la sous-activité du mois",
            attendu: sousActiviteARebours,
            tolerance: 0.05,
            calcul: `${eur(r.total)} × (1 − ${qte(ventesARebours)} ÷ ${qte(cles.activiteNormale)}) = ${eur(r.total)} − ${eur(auCentime(r.total - sousActiviteARebours))} = ${eur(sousActiviteARebours)}`,
          },
        ];
      },
      explication: (c) => {
        const { f, moisARebours, ventesARebours, cles, sousActiviteARebours, imputation } = coutCompletDeJanvier(c);
        return [
          `Un coût de revient d'une ${f.unite} porte en lui le volume du mois : ôtez le coût variable, il reste les charges fixes divisées par les ventes. En ${moisARebours}, ${qte(ventesARebours)} ${f.unites}, encore sous les ${qte(cles.activiteNormale)} de l'activité normale : ${eur(sousActiviteARebours)} de sous-activité, contre ${eur(imputation.difference)} en janvier.`,
        ];
      },
    },
    {
      id: "commande",
      objectifs: [3],
      type: "choix",
      titre: "Une commande sous le coût complet",
      notions: ["full_unit_cost", "contribution_margin"],
      question: (c) => {
        const { f, k, commande, prixDeLaCommande, coutVariableUnitaire } = coutCompletDeJanvier(c);
        return `Un client propose d'acheter ${qte(commande)} ${f.unites} de plus ce mois-ci, à ${eur(prixDeLaCommande)} l'unité : moins que le coût de revient (${eur(auCentime(k.coutDeRevientUnitaire))}), plus que le coût variable (${eur(coutVariableUnitaire)}). ${f.entreprise} peut les servir sans rien ajouter à ses charges fixes. Faut-il accepter ?`;
      },
      options: (c) => {
        const { commande, prixDeLaCommande, coutVariableUnitaire, gainDeLaCommande } = coutCompletDeJanvier(c);
        const marge = auCentime(prixDeLaCommande - coutVariableUnitaire);
        return [
          {
            texte: "Non : vendre sous le coût de revient fait perdre de l'argent.",
            juste: false,
            retour: `C'est le piège du coût complet. Le coût de revient unitaire contient une part de charges fixes, que l'entreprise paie de toute façon. La commande ne coûte que ses charges variables : elle rapporte ${eur(gainDeLaCommande)}.`,
          },
          {
            texte: `Oui : chaque unité rapporte sa marge sur coût variable, ${eur(marge)}, et les charges fixes ne bougent pas.`,
            juste: true,
            retour: `Oui : ${qte(commande)} × ${eur(marge)} = ${eur(gainDeLaCommande)} de résultat en plus. À une condition : que ce prix ne devienne pas celui de tous les clients, sans quoi les charges fixes ne seraient plus couvertes.`,
          },
          { texte: "Seulement si le client paie comptant.", juste: false, retour: "Le délai de paiement compte pour la trésorerie, pas pour le résultat de la commande : c'est la marge sur coût variable qui décide." },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["full_unit_cost", "fixed_costs"],
      tableau: (c) => tableauComplet(coutCompletDeJanvier(c)),
      texte: (c) => {
        const { f, k, r, coutRationnel, imputation } = coutCompletDeJanvier(c);
        return [
          `En janvier, une ${f.unite} ${f.entreprise} coûte ${eur(auCentime(k.coutDeRevientUnitaire))} tout compris : les ${eur(r.total)} de charges indirectes, passés par cinq centres, l'entretien et l'administration réglés par un système de deux équations, puis imputés par les unités d'œuvre. En imputation rationnelle, elle coûte ${eur(coutRationnel)}, et ${eur(imputation.difference)} de sous-activité vont au résultat.`,
          "Trois pièges. Deux centres qui se rendent service ne se répartissent pas en cascade : il faut résoudre le système. Le coût complet d'une unité ne vaut qu'au volume où on l'a calculé. Et une commande sous le coût complet peut rapporter : c'est la marge sur coût variable qui décide d'une vente de plus.",
          "Au niveau de l'examen, vous savez dresser un tableau de répartition complet, prestations réciproques comprises, calculer le coût des unités d'œuvre et la chaîne des coûts, chiffrer l'imputation rationnelle et le coût de la sous-activité, et remonter d'un coût de revient aux ventes.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Prestations réciproques : E = E₀ + e × A et A = A₀ + a × E. Coût de l'unité d'œuvre = total du centre ÷ nombre d'unités d'œuvre. Coefficient d'imputation rationnelle = activité réelle ÷ activité normale ; coût de la sous-activité = charges fixes × (1 − coefficient).",
    },
  ],
};
