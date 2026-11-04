import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  CRITERE_DU_TYPE,
  GRILLE_DES_PRIX,
  LIBELLES_DES_TYPES,
  PART_DE_MARCHE_VISEE,
  SERVICES_DE_NOVA,
  chaineDeValeur,
  chargesDeLAtelierParNature,
  critereAuPrix,
  durabiliteDuSalaire,
  meilleurPrixPourNova,
  performanceDuMois,
  prixPlancher,
  prixQueChoisit,
  trimestreAuPrix,
  typeDuCentre,
  type CritereDuCommercial,
} from "../monde/organisation-du-controle";
import { tableauDeBord } from "../monde/couts-et-budgets";
import { GESTION_DU_COURS, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE CONTRÔLE DE GESTION DANS L'ORGANISATION (contrôle de gestion, palier 4 ; DCG UE11 2025,
 * § 1.1 et 1.2 ; BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA grandit, et son dirigeant décide comment organiser le
 * contrôle. Tous les chiffres viennent de la fiche de gestion (monde/nova-gestion.ts), de la répartition
 * du coût complet, de la droite de demande du trimestre et du tableau de bord du semestre, relus par
 * monde/organisation-du-controle.ts ; le salaire du marché vient de monde/nova-capacite.ts.
 *
 * L'objet, celui du § 1.1 et du § 1.2 du programme : les besoins en information et leurs sources, les
 * formes de contrôle (stratégique, de gestion, opérationnel ; contrôle interne et audit), la chaîne de
 * valeur, la structure, les centres de responsabilité et leur critère, le contrôle selon l'organisation,
 * les outils numériques et le rôle du contrôleur ; puis la performance (efficacité, efficience,
 * performance globale, durabilité), le pilotage et le rôle du tableau de bord. La matière vient du cours
 * du propriétaire (chapitre 1 : le contrôle comme vérification et maîtrise, le thermostat, les
 * configurations de Mintzberg, les distinctions avec l'audit et le contrôle interne ; chapitre 7 : les
 * centres de responsabilité, les effets pervers d'un objectif de chiffre d'affaires, les principes de
 * responsabilité et de contrôlabilité).
 *
 * LES TROIS TEMPS :
 *   · guidé : les-sources, les-formes-de-controle, la-chaine-de-valeur, le type de l'administration
 *     (la définition est au repère et dans la question) ;
 *   · autonome : le-poids-du-soutien, les-charges-maitrisables, efficacite-et-efficience, la-durabilite
 *     (l'élève prend les chiffres dans les tableaux) ;
 *   · l'expérience avant la formule : predire-le-prix (jugée sur son chiffre d'affaires, la responsable
 *     commerciale baisse-t-elle le prix ?), le-prix-plancher au curseur, puis le laboratoire des centres
 *     (le critère du centre et le prix), avec le graphique du chiffre d'affaires et de la marge ;
 *   · expert : la structure, le contrôle selon l'organisation, le rôle du contrôleur, la performance
 *     globale et le tableau de bord ; puis la synthèse.
 */

/** Le chapitre se calcule sur la fiche de gestion de NOVA. */
export const ENTREPRISES_DE_L_ORGANISATION: readonly string[] = ["nova"];

/** Les deux critères du laboratoire, codés pour le levier à choix. */
export const CRITERES_DU_LABORATOIRE: readonly { valeur: number; critere: CritereDuCommercial; libelle: string }[] = [
  { valeur: 0, critere: "chiffre-d-affaires", libelle: "Centre de chiffre d'affaires" },
  { valeur: 1, critere: "profit", libelle: "Centre de profit" },
];

const critereDe = (v: number): CritereDuCommercial => CRITERES_DU_LABORATOIRE.find((x) => x.valeur === v)!.critere;

/** Les mois que compare l'étape sur l'efficacité et l'efficience : janvier et juin. */
export const MOIS_COMPARES = [0, 5] as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, d = 1) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise (la fiche est figée). */
export function organisationDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const bord = tableauDeBord(f);
  const chaine = chaineDeValeur(f);
  const atelier = chargesDeLAtelierParNature(f);
  const actuel = trimestreAuPrix(f);
  const prixCA = prixQueChoisit(f, "chiffre-d-affaires");
  const prixMarge = prixQueChoisit(f, "profit");
  const meilleur = meilleurPrixPourNova(f);
  const plancher = prixPlancher(f)!;
  const [jan, juin] = MOIS_COMPARES.map((k) => performanceDuMois(f, k));
  return {
    f,
    bord,
    chaine,
    atelier,
    actuel,
    prixCA,
    prixMarge,
    meilleur,
    plancher,
    auCA: trimestreAuPrix(f, prixCA),
    auMeilleur: trimestreAuPrix(f, meilleur),
    auPlancher: trimestreAuPrix(f, plancher),
    sousLePlancher: trimestreAuPrix(f, plancher - GRILLE_DES_PRIX.pas),
    fixesDuTrimestre: f.decision.chargesFixes,
    jan: jan!,
    juin: juin!,
    salaire: durabiliteDuSalaire(),
    depart: { critere: CRITERES_DU_LABORATOIRE[0]!.valeur, prix: f.decision.prix },
  };
}

export type OrganisationDuChapitre = ReturnType<typeof organisationDuChapitre>;

/** Ce que montre le laboratoire pour une position : le trimestre au prix, et le prix que le critère ferait choisir. */
export function laboratoireDesCentres(f: FicheDeGestion, p: Readonly<Record<string, number>>) {
  const critere = critereDe(p.critere!);
  const t = trimestreAuPrix(f, p.prix!);
  return { ...t, critere, valeurDuCritere: critereAuPrix(f, critere, p.prix!), prixChoisi: prixQueChoisit(f, critere) };
}

/** Les services de NOVA et ce que chacun maîtrise. */
export function tableauDesServices(c: Pick<Cas, "code">): TableauDeDonnees {
  organisationDuChapitre(c);
  const oui = (b: boolean) => (b ? "oui" : "non");
  return {
    titre: "Les services de NOVA et ce que chaque responsable maîtrise",
    colonnes: ["Responsable", "Ses charges", "Ses produits", "Ses investissements", "Type de centre"],
    lignes: [
      ...SERVICES_DE_NOVA.map((s) => ({
        libelle: s.nom,
        valeurs: [s.responsable, oui(s.maitrise.charges), oui(s.maitrise.produits), oui(s.maitrise.investissements), LIBELLES_DES_TYPES[typeDuCentre(s.maitrise)]],
      })),
      { libelle: "Le service commercial", valeurs: ["la responsable commerciale", "à décider", "oui", "non", "à décider"] },
    ],
  };
}

/** Janvier et juin, côte à côte. */
export function tableauDeJanvierEtJuin(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = organisationDuChapitre(c);
  const mois = MOIS_COMPARES.map((k) => x.bord.mois[k]!);
  return {
    titre: `${x.f.entreprise} en janvier et en juin`,
    colonnes: mois.map((m) => majuscule(m.nom)),
    lignes: [
      { libelle: `Enceintes vendues par ${x.f.entreprise}`, valeurs: mois.map((m) => qte(m.quantite)) },
      { libelle: "Enceintes vendues par tout le marché", valeurs: MOIS_COMPARES.map((k) => qte(x.f.semestre.marche[k]!)) },
      { libelle: "Charges fixes du mois", valeurs: mois.map((m) => eur(m.chargesFixes)) },
      { libelle: "Résultat du mois", valeurs: mois.map((m) => eur(m.resultat)) },
    ],
  };
}

export const LE_CONTROLE_DE_GESTION_DANS_L_ORGANISATION: Chapitre = {
  code: "le-controle-de-gestion-dans-l-organisation",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "Le contrôle de gestion dans l'organisation",
  accroche:
    "NOVA grandit, et son dirigeant ne peut plus tout voir lui-même. Avec lui, organisez le contrôle : les informations, la chaîne de valeur, les centres de responsabilité et le critère de chacun, puis la performance à suivre, globale et durable.",
  objectifs: [
    "Situer le contrôle de gestion parmi les formes de contrôle, et repérer les informations dont il a besoin",
    "Délimiter le périmètre du contrôle par la chaîne de valeur et la structure de l'organisation",
    "Distinguer les centres de responsabilité, et juger un responsable sur ce qu'il maîtrise",
    "Mesurer ce que le critère d'un centre fait faire à son responsable",
    "Distinguer efficacité, efficience, performance globale et durabilité, et dire ce que le tableau de bord apporte au pilotage",
  ],
  libre: false,
  prerequis: ["seuil-de-rentabilite", "cout-complet"],
  ensuite: ["piloter-un-centre", "la-demarche-budgetaire"],
  entreprises: {
    codes: ENTREPRISES_DE_L_ORGANISATION,
    pourquoi: "l'organisation du contrôle se décide ici avec le dirigeant de NOVA, sur ses centres d'analyse, sa droite de demande et son tableau de bord ; la démarche vaut pour toute organisation.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Garder la maîtrise",
      notions: ["dashboard"],
      texte: (c) => {
        const x = organisationDuChapitre(c);
        return [
          `${x.f.entreprise} grandit. Au premier semestre, elle vend ${qte(x.bord.semestre.quantite)} enceintes, et elle lancera bientôt la Go et la Studio à côté de la One. Le dirigeant délègue : l'atelier à un chef d'atelier, les ventes à une responsable commerciale. Comment garder la maîtrise de ce qu'il ne fait plus lui-même ?`,
          "C'est l'objet du contrôle de gestion. Le mot contrôle a deux sens. Vérifier, comme le contre-rôle qu'on rapprochait autrefois du rôle des soldats pour ne pas payer de soldats fantômes. Et maîtriser, comme on a le contrôle de son véhicule.",
          "Le contrôle de gestion fait les deux : il fixe des objectifs, il vérifie qu'ils sont atteints, il aide à corriger. Il marche comme un thermostat : prévoir (les budgets), mesurer (la comptabilité de gestion), comparer et réagir (les écarts, le tableau de bord).",
          "Mais c'est le responsable qui pilote, pas le contrôleur : le contrôleur entretient les instruments de bord. Dans ce chapitre, vous organisez le contrôle de NOVA avec son dirigeant.",
        ];
      },
      repere: () =>
        "Le contrôle de gestion : les procédures qui permettent à la direction de fixer des objectifs, de vérifier qu'ils sont atteints avec efficacité et efficience, et d'aider à corriger. Il éclaire ceux qui décident ; il ne décide pas.",
    },
    {
      id: "les-sources",
      objectifs: [0],
      type: "choix",
      titre: "L'information qu'il faut",
      notions: ["demand_market_share"],
      question: (c) => {
        const x = organisationDuChapitre(c);
        return `Le dirigeant veut comprendre pourquoi la part de marché de ${x.f.entreprise} baisse au printemps : ${pct(x.jan.partDeMarche)} en janvier, ${pct(x.juin.partDeMarche)} en juin. Quelle information doit-il aller chercher hors de ${x.f.entreprise} ?`;
      },
      options: (c) => {
        const x = organisationDuChapitre(c);
        return [
          {
            texte: "Les ventes de tout le marché",
            juste: true,
            retour: `Oui. La part de marché rapporte les ventes de ${x.f.entreprise}, une donnée interne, à celles du marché, ${qte(x.f.semestre.marche[5]!)} enceintes en juin, une donnée externe (une étude, une fédération professionnelle). Les ventes de ${x.f.entreprise} montent ; le marché monte plus vite.`,
          },
          {
            texte: "Le coût de revient d'une enceinte, que donne la comptabilité de gestion",
            juste: false,
            retour: "Non : c'est une source interne, et elle ne dit rien du marché. La comptabilité de gestion répond à la question du coût, pas à celle de la part de marché.",
          },
          {
            texte: "Le relevé des commandes de la boutique en ligne, dans le PGI",
            juste: false,
            retour: "Non : le PGI est une source interne. Il donne les ventes de NOVA, la moitié du calcul seulement.",
          },
        ];
      },
    },
    {
      id: "les-formes-de-controle",
      objectifs: [0],
      type: "choix",
      titre: "Trois contrôles, un seul de gestion",
      notions: ["productivity", "dashboard"],
      question: () =>
        "Trois contrôles se font chez NOVA. La direction se demande si lancer la Go et la Studio créera de la valeur. Le dirigeant compare chaque mois le résultat de chaque service à son budget. Le chef d'atelier suit chaque jour les enceintes montées par heure. Lequel relève du contrôle de gestion ?",
      options: () => [
        {
          texte: "Le résultat comparé au budget, chaque mois",
          juste: true,
          retour:
            "Oui. Le contrôle de gestion se place entre les deux autres : il traduit la stratégie en objectifs annuels et mensuels, et vérifie qu'on les tient. La gamme relève du contrôle stratégique, sur plusieurs années ; les enceintes par heure, du contrôle opérationnel, au jour le jour.",
        },
        {
          texte: "Le lancement de la gamme, parce qu'il engage l'argent de NOVA",
          juste: false,
          retour: "Non : c'est le contrôle stratégique, celui de la direction, sur plusieurs années. Le contrôle de gestion lui fournit des chiffres, il ne le remplace pas.",
        },
        {
          texte: "Les enceintes montées par heure, parce qu'elles se mesurent",
          juste: false,
          retour: "Non : c'est le contrôle opérationnel, au jour le jour, dans l'atelier. Le contrôle de gestion en reprend la synthèse, chaque mois.",
        },
        {
          texte: "Aucun : le contrôle interne et l'audit vérifient déjà tout cela",
          juste: false,
          retour:
            "Non. Le contrôle interne protège le patrimoine et fiabilise les comptes : celui qui vend n'encaisse pas. L'audit vérifie que les procédures sont suivies et que les comptes sont fiables. Ni l'un ni l'autre ne pilote la performance.",
        },
      ],
    },
    {
      id: "la-chaine-de-valeur",
      objectifs: [1],
      type: "tri",
      titre: "La chaîne de valeur de NOVA",
      notions: ["fixed_costs", "full_unit_cost"],
      question: () =>
        "Le dirigeant relit les 5 centres d'analyse du coût complet comme une chaîne de valeur. Rangez chaque activité : principale, si elle fait l'enceinte que le client paie ; de soutien, si elle rend les autres possibles. Le montant est sa part des charges fixes de janvier.",
      categories: [
        { code: "principale", libelle: "Activité principale" },
        { code: "soutien", libelle: "Activité de soutien" },
      ],
      elements: (c) => organisationDuChapitre(c).chaine.activites.map((a) => ({ libelle: a.libelle, montant: a.charges, categorie: a.rang, pourquoi: majuscule(a.pourquoi) + "." })),
      relance: "Le client paierait-il pour cette activité si on la lui montrait seule ?",
      explication: () => [
        "Les activités de soutien sont les centres auxiliaires du coût complet : elles se répartissent ensuite sur les activités principales. La chaîne de valeur délimite ainsi le périmètre du contrôle : chaque activité a un coût, et il lui faut un responsable qui le maîtrise.",
      ],
    },
    {
      id: "le-poids-du-soutien",
      objectifs: [1],
      type: "montants",
      titre: "Ce que pèse le soutien",
      notions: ["fixed_costs"],
      question: (c) => {
        const x = organisationDuChapitre(c);
        return `Sans formule cette fois : reprenez les montants que vous venez de ranger. Calculez les charges fixes de janvier des activités de soutien, celles des activités principales, puis la part du soutien dans les ${eur(x.chaine.total)} de charges fixes, en % au dixième.`;
      },
      champs: (c) => {
        const x = organisationDuChapitre(c);
        const s = x.chaine.activites.filter((a) => a.rang === "soutien");
        const p = x.chaine.activites.filter((a) => a.rang === "principale");
        return [
          { libelle: "Charges des activités de soutien", attendu: x.chaine.soutien, calcul: `${s.map((a) => eur(a.charges)).join(" + ")} = ${eur(x.chaine.soutien)}` },
          { libelle: "Charges des activités principales", attendu: x.chaine.principales, calcul: `${p.map((a) => eur(a.charges)).join(" + ")} = ${eur(x.chaine.principales)}` },
          {
            libelle: "Part du soutien dans les charges fixes, en %",
            attendu: auDixieme(x.chaine.partDuSoutien * 100),
            tolerance: 0.1,
            calcul: `${eur(x.chaine.soutien)} ÷ ${eur(x.chaine.total)} = ${pct(x.chaine.partDuSoutien)}`,
          },
        ];
      },
      explication: (c) => {
        const x = organisationDuChapitre(c);
        return [
          `${pct(x.chaine.partDuSoutien)} des charges fixes ne se voient pas du client. Ce sont souvent des coûts discrétionnaires : rien ne mesure ce que l'administration produit, si bien que son budget se reconduit d'une année à l'autre si personne ne le questionne.`,
        ];
      },
    },
    {
      id: "les-centres",
      type: "lecture",
      titre: "Les centres de responsabilité",
      notions: ["fixed_costs", "revenue"],
      tableau: tableauDesServices,
      texte: () => [
        "Un centre de responsabilité est une partie de l'organisation confiée à un responsable, qui a des moyens et une autonomie pour atteindre un objectif. Son type se lit sur ce que le responsable maîtrise.",
        `Un centre de coûts maîtrise ses charges, et ses charges suivent une production qu'on mesure : on le juge sur ${CRITERE_DU_TYPE.couts}. Un centre de dépenses discrétionnaires engage des charges sans production mesurable : on le juge sur ${CRITERE_DU_TYPE["depenses-discretionnaires"]}.`,
        `Un centre de chiffre d'affaires est jugé sur ${CRITERE_DU_TYPE["chiffre-d-affaires"]} ; un centre de profit sur ${CRITERE_DU_TYPE.profit}, ses produits et ses charges ensemble ; un centre d'investissement sur ${CRITERE_DU_TYPE.investissement}.`,
        "Les centres s'emboîtent : l'atelier rend compte au dirigeant, qui rend compte aux associés. Chaque responsable est à la fois contrôleur et contrôlé.",
      ],
      repere: () =>
        "Principe de responsabilité : un responsable porte toutes les conséquences de ses décisions. Principe de contrôlabilité : on ne le juge que sur ce qu'il maîtrise.",
    },
    {
      id: "le-type-de-l-administration",
      objectifs: [2],
      type: "choix",
      titre: "Quel centre pour l'administration",
      notions: ["fixed_costs"],
      question: () =>
        "L'administration de NOVA tient la comptabilité, la paie et le courrier. Elle engage ses dépenses, mais rien ne mesure ce qu'elle produit, et aucun client ne lui paie rien. Quel centre en faire ?",
      options: () => [
        {
          texte: "Un centre de dépenses discrétionnaires",
          juste: true,
          retour:
            "Oui. Ses charges ne suivent aucun volume : elles sont à la discrétion de la direction. On la juge sur le respect de son budget et sur la qualité du service rendu. Le danger : un budget reconduit chaque année sans que personne le justifie.",
        },
        {
          texte: "Un centre de coûts, jugé sur le coût d'une enceinte",
          juste: false,
          retour: "Non : le coût d'une enceinte ne dépend presque pas de l'administration. Sans production à mesurer, un coût unitaire n'a pas de sens pour elle.",
        },
        {
          texte: "Un centre de profit, qui facturerait ses services aux autres",
          juste: false,
          retour: "On pourrait, avec des prix de cession internes, mais ses clients seraient forcés : un profit ainsi obtenu ne mesurerait rien. Pour un petit service, c'est beaucoup de calcul pour peu d'information.",
        },
      ],
    },
    {
      id: "les-charges-maitrisables",
      objectifs: [2],
      type: "tri",
      titre: "Ce que le chef d'atelier maîtrise",
      notions: ["variable_costs", "fixed_costs"],
      question: (c) => {
        const x = organisationDuChapitre(c);
        return `L'atelier sera un centre de coûts. Pour juger le chef d'atelier, le dirigeant range les ${eur(x.atelier.total)} de charges de l'atelier en janvier, pour ${qte(x.atelier.quantite)} enceintes : celles qu'il maîtrise, et celles qui se décident ailleurs.`;
      },
      categories: [
        { code: "maitrisable", libelle: "Il la maîtrise" },
        { code: "non-maitrisable", libelle: "Elle se décide ailleurs" },
      ],
      elements: (c) => {
        const POURQUOI: Readonly<Record<string, string>> = {
          composants: "Il engage chaque jeu consommé : un jeu abîmé au montage, c'est lui.",
          autres: "L'emballage et l'énergie de la chaîne suivent son organisation, enceinte par enceinte.",
          loyer: "Le bail a été signé par la direction : l'atelier n'y peut rien.",
          personnel: "L'effectif et les salaires se décident à la direction, pas à l'atelier.",
          usure: "La ligne a été achetée par la direction : son usure suit l'investissement.",
          services: "Elle lui arrive par des clés de répartition qu'il ne choisit pas.",
        };
        return organisationDuChapitre(c).atelier.lignes.map((l) => ({ libelle: l.libelle, montant: l.montant, categorie: l.maitrisable ? "maitrisable" : "non-maitrisable", pourquoi: POURQUOI[l.code]! }));
      },
      relance: "Le chef d'atelier pourrait-il faire baisser cette charge demain, par ses propres décisions ?",
      explication: (c) => {
        const x = organisationDuChapitre(c);
        return [
          `Il maîtrise ${eur(x.atelier.maitrisables)} sur ${eur(x.atelier.total)} : ses consommations. Les ${eur(x.atelier.nonMaitrisables)} de charges fixes se décident ailleurs. C'est le principe de contrôlabilité : le juger sur le coût complet d'une enceinte, ce serait le juger aussi sur le loyer et sur les ventes du mois.`,
        ];
      },
    },
    {
      id: "predire-le-prix",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le prix",
      notions: ["revenue", "contribution_margin"],
      question: (c) => {
        const x = organisationDuChapitre(c);
        return `Reste le service commercial. Centre de chiffre d'affaires : la responsable est jugée et primée sur ses ventes. Centre de profit : sur sa marge. Elle fixe le prix du trimestre, ${eur(x.actuel.prix)} aujourd'hui. Pariez : jugée sur son chiffre d'affaires, quel prix choisira-t-elle ?`;
      },
      options: () => {
        const voir = "Faites varier le prix aux étapes suivantes : vous verrez où le chiffre d'affaires est le plus haut, et ce que gagne NOVA.";
        return [
          { texte: "Un prix plus bas", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le même : le critère ne change pas le prix", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Un prix plus haut, pour vendre plus cher", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-prix-plancher",
      objectifs: [3],
      type: "curseur",
      titre: "Le prix plancher",
      notions: ["price_floor", "breakeven", "contribution_margin"],
      question: (c) => {
        const x = organisationDuChapitre(c);
        return `Plus le prix baisse, plus les clients achètent, dans la limite de ${qte(x.f.decision.capacite)} enceintes que la ligne fait au trimestre. Le dirigeant veut fixer à la responsable un prix plancher : le plus bas prix où la marge du trimestre couvre les ${eur(x.fixesDuTrimestre)} de charges fixes. Faites varier le prix de ${eur(GRILLE_DES_PRIX.min)} à ${eur(GRILLE_DES_PRIX.max)} ; une courbe donne la marge sur coût variable, une droite les charges fixes. Placez le curseur sur le prix plancher, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix d'une enceinte, hors taxes", unite: "€" }),
      sens: "plus-petite",
      cible: (c) => ({ attendu: organisationDuChapitre(c).plancher, min: GRILLE_DES_PRIX.min, max: GRILLE_DES_PRIX.max }),
      zones: ["La marge couvre les charges fixes", "NOVA perd de l'argent"],
      rates: () => ({
        dessous: "À ce prix, la marge du trimestre ne couvre pas les charges fixes : NOVA perd de l'argent.",
        dessus: "La marge couvre déjà les charges fixes : un prix plus bas les couvrirait encore.",
      }),
      montrer: "Montrer le prix plancher",
      lecture: (c, p) => {
        const t = trimestreAuPrix(ficheDe(c), p);
        return [
          { libelle: "Chiffre d'affaires du trimestre", montant: t.chiffreDAffaires },
          { libelle: "Marge sur coût variable", montant: t.marge },
          { libelle: "Charges fixes du trimestre", montant: t.chargesFixes },
          { libelle: "Résultat de NOVA", montant: t.resultat, fort: true },
        ];
      },
      droites: (c) => {
        const f = ficheDe(c);
        return { produit: (p) => trimestreAuPrix(f, p).marge, cout: () => f.decision.chargesFixes, libelles: ["Marge sur coût variable", "Charges fixes du trimestre"] };
      },
      explication: (c) => {
        const x = organisationDuChapitre(c);
        return [
          `À ${eur(x.plancher)}, ${x.f.entreprise} vend ${qte(x.auPlancher.ventes)} enceintes, et leur marge, ${eur(x.auPlancher.marge)}, couvre les charges fixes. À ${eur(x.plancher - GRILLE_DES_PRIX.pas)}, elle ne les couvre plus : ${eur(x.sousLePlancher.resultat)}.`,
          `Sous ce prix, chaque baisse fait vendre plus et gagner du chiffre d'affaires à la responsable, mais fait perdre de l'argent à ${x.f.entreprise}. Un objectif de chiffre d'affaires appelle donc une limite.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-centres",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des centres",
      notions: ["revenue", "contribution_margin", "price_floor"],
      question: () =>
        "Choisissez le type de centre du service commercial, puis faites varier le prix du trimestre : le tableau suit les ventes, le chiffre d'affaires, la marge, le résultat de NOVA, et le prix que la responsable choisirait d'elle-même. Relevez le défi.",
      leviers: (c) => {
        const x = organisationDuChapitre(c);
        return [
          { code: "critere", libelle: "Le service commercial est", unite: "", min: 0, max: 1, pas: 1, depart: x.depart.critere, choix: CRITERES_DU_LABORATOIRE.map((k) => ({ valeur: k.valeur, libelle: k.libelle })) },
          { code: "prix", libelle: "Prix d'une enceinte, hors taxes", unite: "€", min: GRILLE_DES_PRIX.min, max: GRILLE_DES_PRIX.max, pas: GRILLE_DES_PRIX.pas, depart: x.depart.prix },
        ];
      },
      lecture: (c, p) => {
        const x = organisationDuChapitre(c);
        const l = laboratoireDesCentres(x.f, p);
        const d = laboratoireDesCentres(x.f, x.depart);
        return [
          { libelle: "Enceintes vendues dans le trimestre", montant: l.ventes, unite: "enceintes", reference: d.ventes },
          { libelle: "Chiffre d'affaires du trimestre", montant: l.chiffreDAffaires, reference: d.chiffreDAffaires },
          { libelle: "Marge sur coût variable", montant: l.marge, reference: d.marge },
          { libelle: "Prix que la responsable choisirait d'elle-même", montant: l.prixChoisi, reference: d.prixChoisi },
          { libelle: "Résultat de NOVA", montant: l.resultat, reference: d.resultat, fort: true },
        ];
      },
      graphique: (c) => {
        const f = ficheDe(c);
        return {
          levier: "prix",
          courbes: [
            { libelle: "Chiffre d'affaires", valeur: (p) => trimestreAuPrix(f, p.prix!).chiffreDAffaires },
            { libelle: "Marge sur coût variable", valeur: (p) => trimestreAuPrix(f, p.prix!).marge },
            { libelle: "Charges fixes du trimestre", valeur: () => f.decision.chargesFixes },
          ],
        };
      },
      defi: (c) => {
        const x = organisationDuChapitre(c);
        return {
          consigne: "Trouvez le type de centre et le prix tels que le prix que la responsable choisit d'elle-même soit aussi celui qui donne à NOVA son meilleur résultat.",
          atteint: (p) => {
            const l = laboratoireDesCentres(x.f, p);
            return p.prix === l.prixChoisi && p.prix === x.meilleur;
          },
          indice: (p) => {
            const l = laboratoireDesCentres(x.f, p);
            if (p.prix !== l.prixChoisi) return `Avec ce critère, la responsable ne garderait pas ce prix : elle choisirait ${eur(l.prixChoisi)}. Placez le prix là où son critère est le plus haut.`;
            return `Jugée sur son chiffre d'affaires, elle choisit ${eur(l.prixChoisi)}, et NOVA y fait ${eur(l.resultat)}. Changez le type de centre.`;
          },
          solution: { critere: CRITERES_DU_LABORATOIRE[1]!.valeur, prix: x.meilleur },
        };
      },
      explication: (c) => {
        const x = organisationDuChapitre(c);
        return [
          `Défi relevé. Jugée sur sa marge, la responsable choisit ${eur(x.prixMarge)} : c'est le meilleur résultat de ${x.f.entreprise}, ${eur(x.auMeilleur.resultat)}. Jugée sur son chiffre d'affaires, elle aurait choisi ${eur(x.prixCA)}, la ligne à plein, et ${x.f.entreprise} aurait fait ${eur(x.auCA.resultat)}.`,
          "C'est la convergence des buts : le critère d'un centre doit pousser son responsable vers l'intérêt de l'entreprise. Un centre de chiffre d'affaires pousse à casser les prix ; un centre de profit fait peser chaque vente avec son coût.",
          "Les charges fixes ne bougent pas avec le prix : la marge suffit pour juger la responsable, sans lui imputer un loyer qu'elle ne maîtrise pas.",
        ];
      },
    },
    {
      id: "la-structure",
      objectifs: [1],
      type: "choix",
      titre: "Quelle structure pour la gamme",
      question: (c) => {
        const x = organisationDuChapitre(c);
        return `Aujourd'hui, ${x.f.entreprise} compte ${qte(durabiliteDuSalaire().operateurs)} opérateurs et un dirigeant qui voit tout : une structure simple, contrôlée par la supervision directe. Demain, la gamme aura 3 références, dans le même local, avec la même équipe. Quelle organisation le dirigeant doit-il prévoir ?`;
      },
      options: () => [
        {
          texte: "Des fonctions, et un coût par produit",
          juste: true,
          retour:
            "Oui. Une PME se structure par fonction : la production, la vente, l'administration. La comptabilité de gestion y calcule le coût de chaque référence, et le tableau de bord suit chaque fonction. C'est le stade où le contrôle de gestion se formalise.",
        },
        {
          texte: "Une division par produit, chacune centre de profit",
          juste: false,
          retour:
            "Pas encore. Les 3 références partagent le local, la ligne et l'équipe : chaque division devrait acheter aux autres, à des prix de cession partout. La structure divisionnelle sert les grandes entreprises diversifiées.",
        },
        {
          texte: "Rester simple : le dirigeant supervisera tout",
          juste: false,
          retour: "Non : la supervision directe tient tant qu'un seul homme voit tout. Avec 3 références, il ne verra plus d'où vient la marge, ni laquelle en perd.",
        },
      ],
    },
    {
      id: "selon-l-organisation",
      objectifs: [0],
      type: "choix",
      titre: "Le contrôle selon l'organisation",
      question: () =>
        "Le contrôleur de NOVA part pour une association qui gère des logements étudiants, financée par des subventions et des loyers modérés. Que change le contrôle de gestion pour lui ?",
      options: () => [
        {
          texte: "Son objectif, pas ses outils",
          juste: true,
          retour:
            "Oui. L'association ne cherche pas le plus grand résultat : elle rend un service, et doit équilibrer ses comptes pour durer. Les coûts, les budgets et les indicateurs restent ; ils mesurent le service rendu pour chaque euro. Il en va de même dans le secteur public, ou chez une TPE que suit son expert-comptable.",
        },
        {
          texte: "Rien : le résultat reste le seul critère de la performance",
          juste: false,
          retour: "Non : une association qui maximiserait son résultat trahirait sa mission. Le résultat y est une contrainte (ne pas perdre), pas un but.",
        },
        {
          texte: "Tout : une association n'a ni coûts à calculer ni budget",
          juste: false,
          retour: "Non : elle a des charges, des financeurs à qui rendre compte et un budget à tenir. Un service se contrôle aussi : le coût d'un logement occupé, le taux d'occupation.",
        },
      ],
    },
    {
      id: "le-role-du-controleur",
      objectifs: [0],
      type: "choix",
      titre: "Le contrôleur et ses outils",
      notions: ["dashboard"],
      question: (c) => {
        const x = organisationDuChapitre(c);
        const fevrier = x.bord.mois[1]!;
        return `${x.f.entreprise} recrute un contrôleur de gestion. Le PGI lui donne les ventes du jour, le tableur ses budgets, un outil de visualisation ses tableaux de bord. Dès le début de mars, il voit le résultat de février : ${eur(fevrier.resultat)}. Que fait-il ?`;
      },
      options: () => [
        {
          texte: "Il cherche la cause et alerte le dirigeant",
          juste: true,
          retour:
            "Oui. Le contrôleur est un fonctionnel : il analyse (février est court, et ses ventes passent sous le seuil), il explique et il conseille. C'est le dirigeant, ou le responsable du centre, qui décide. On attend de lui de la rigueur, de l'indépendance et le sens du dialogue avec les opérationnels.",
        },
        {
          texte: "Il baisse lui-même le prix pour relancer les ventes de mars",
          juste: false,
          retour: "Non : le prix est une décision du service commercial et du dirigeant. Le contrôleur n'est pas un opérationnel ; il éclaire la décision.",
        },
        {
          texte: "Il attend la clôture : seuls les comptes annuels sont fiables",
          juste: false,
          retour: "Non : les outils numériques lui donnent l'information à temps, et c'est tout leur intérêt. Une alerte qui arrive à la clôture n'aide plus à piloter.",
        },
      ],
    },
    {
      id: "efficacite-et-efficience",
      objectifs: [4],
      type: "montants",
      titre: "Efficace, efficient",
      notions: ["demand_market_share", "productivity", "fixed_costs"],
      tableau: tableauDeJanvierEtJuin,
      question: (c) => {
        const x = organisationDuChapitre(c);
        return `Le dirigeant vise ${pct(PART_DE_MARCHE_VISEE)} de part de marché. Calculez, en janvier puis en juin, la part de marché de ${x.f.entreprise} en % au dixième, et les charges fixes que porte chaque enceinte vendue.`;
      },
      champs: (c) => {
        const x = organisationDuChapitre(c);
        const fixes = (k: number) => x.bord.mois[k]!.chargesFixes;
        return [
          { libelle: "Part de marché de janvier, en %", attendu: auDixieme(x.jan.partDeMarche * 100), tolerance: 0.1, calcul: `${qte(x.jan.quantite)} ÷ ${qte(x.f.semestre.marche[0]!)} = ${pct(x.jan.partDeMarche)}` },
          { libelle: "Part de marché de juin, en %", attendu: auDixieme(x.juin.partDeMarche * 100), tolerance: 0.1, calcul: `${qte(x.juin.quantite)} ÷ ${qte(x.f.semestre.marche[5]!)} = ${pct(x.juin.partDeMarche)}` },
          { libelle: "Charges fixes par enceinte en janvier", attendu: x.jan.chargesFixesParEnceinte, calcul: `${eur(fixes(0))} ÷ ${qte(x.jan.quantite)} = ${eur(x.jan.chargesFixesParEnceinte)}` },
          { libelle: "Charges fixes par enceinte en juin", attendu: x.juin.chargesFixesParEnceinte, calcul: `${eur(fixes(5))} ÷ ${qte(x.juin.quantite)} = ${eur(x.juin.chargesFixesParEnceinte)}` },
        ];
      },
      explication: (c) => {
        const x = organisationDuChapitre(c);
        return [
          `En juin, ${x.f.entreprise} est plus efficiente : chaque enceinte porte ${eur(x.juin.chargesFixesParEnceinte)} de charges fixes au lieu de ${eur(x.jan.chargesFixesParEnceinte)}, et le résultat passe de ${eur(x.jan.resultat)} à ${eur(x.juin.resultat)}. Mais elle est moins efficace : l'objectif de part de marché n'est plus atteint.`,
          "Efficacité : atteindre l'objectif. Efficience : l'atteindre avec le moins de moyens. La performance demande les deux, et un seul indicateur ne les montre pas ensemble.",
        ];
      },
    },
    {
      id: "la-performance-globale",
      objectifs: [4],
      type: "choix",
      titre: "Une performance globale",
      notions: ["csr_index", "dashboard"],
      question: (c) => {
        const x = organisationDuChapitre(c);
        return `Juin est le meilleur mois du semestre, avec ${eur(x.juin.resultat)} de résultat. Le dirigeant peut-il en conclure que ${x.f.entreprise} est performante ?`;
      },
      options: () => [
        {
          texte: "Pas encore : il manque le social et l'environnement",
          juste: true,
          retour:
            "Oui. La performance globale ajoute à la performance économique (le résultat, la part de marché) la performance sociale (les salariés, leur salaire, leurs conditions de travail) et la performance environnementale (l'emballage, le transport, l'énergie). Une entreprise qui gagne en usant ses salariés reporte ses coûts sur d'autres.",
        },
        {
          texte: "Oui : le résultat est la mesure de toute la performance",
          juste: false,
          retour: "Non : le résultat ne dit rien de la part de marché, qui baisse, ni des salariés, ni de l'environnement. C'est une mesure, pas toute la performance.",
        },
        {
          texte: "Non : la part de marché baisse, c'est donc un mauvais mois pour NOVA",
          juste: false,
          retour: "Non plus : un indicateur seul ne juge pas un mois. Juin gagne en efficience ce qu'il perd en efficacité ; il faut lire les dimensions ensemble.",
        },
      ],
    },
    {
      id: "la-durabilite",
      objectifs: [4],
      type: "montants",
      titre: "Une performance qui dure",
      notions: ["staff_turnover", "payroll"],
      question: () => {
        const s = durabiliteDuSalaire();
        return `Les opérateurs gagnent ${eur(s.salaire)} bruts par mois. Le marché paie ${eur(s.salaire / s.rapportN)} en N et ${eur(s.salaire / s.rapportNPlus1)} en N + 1. Sous ${pct(s.seuil, 0)} du marché, un opérateur démissionne. Calculez le rapport au marché en N puis en N + 1, en % au centième, le salaire qui garde le seuil en N + 1, puis ce qu'il coûterait de plus par mois pour les ${qte(s.operateurs)} opérateurs, avec ${pct(s.tauxPatronal, 0)} de cotisations patronales.`;
      },
      champs: () => {
        const s = durabiliteDuSalaire();
        const marcheN = s.salaire / s.rapportN;
        const marcheN1 = s.salaire / s.rapportNPlus1;
        return [
          { libelle: "Rapport au marché en N, en %", attendu: auCentieme(s.rapportN * 100), tolerance: 0.01, calcul: `${eur(s.salaire)} ÷ ${eur(marcheN)} = ${pct(s.rapportN, 2)}` },
          { libelle: "Rapport au marché en N + 1, en %", attendu: auCentieme(s.rapportNPlus1 * 100), tolerance: 0.01, calcul: `${eur(s.salaire)} ÷ ${eur(marcheN1)} = ${pct(s.rapportNPlus1, 2)}` },
          { libelle: "Salaire qui garde le seuil en N + 1", attendu: s.salaireAuSeuil, calcul: `${eur(marcheN1)} × ${pct(s.seuil, 0)} = ${eur(s.salaireAuSeuil)}` },
          {
            libelle: "Coût en plus par mois pour NOVA",
            attendu: s.enPlusParMois,
            calcul: `(${eur(s.salaireAuSeuil)} − ${eur(s.salaire)}) × ${qte(s.operateurs)} × ${qte(1 + s.tauxPatronal)} = ${eur(s.enPlusParMois)}`,
          },
        ];
      },
      explication: () => {
        const s = durabiliteDuSalaire();
        return [
          `En N, payer sous le marché est une économie. En N + 1, elle ne dure plus : sous le seuil, un opérateur part, et son seul recrutement coûte ${eur(s.coutDUnRecrutement)}, plus que les ${eur(s.enPlusParAn)} par an qui l'auraient retenu. Le chapitre « Le départ d'un salarié » raconte ce départ.`,
          "Une performance durable se maintient dans le temps : elle ménage les salariés, les clients et l'environnement dont l'entreprise dépend. Le contrôle de gestion la suit avec des indicateurs non financiers, à côté du résultat.",
        ];
      },
    },
    {
      id: "piloter-avec-le-tableau-de-bord",
      objectifs: [4],
      type: "choix",
      titre: "Piloter avec un tableau de bord",
      notions: ["dashboard"],
      question: () => "Le dirigeant veut un tableau de bord : une page, chaque mois, avec quelques indicateurs et leurs voyants. À quoi lui servira-t-il d'abord ?",
      options: () => [
        {
          texte: "À voir tôt ce qui dérive, pour agir",
          juste: true,
          retour:
            "Oui. Piloter, c'est anticiper et corriger avant la clôture. Le tableau de bord sert à cela d'abord ; il sert aussi à communiquer les objectifs et à évaluer les responsables. Ses indicateurs suivent les facteurs clés de succès de la stratégie, financiers ou non.",
        },
        {
          texte: "À remplacer les comptes annuels, qui arrivent trop tard",
          juste: false,
          retour: "Non : il ne les remplace pas. Les comptes annuels rendent compte aux associés et à l'État ; le tableau de bord sert à piloter en cours de route.",
        },
        {
          texte: "À tout mesurer, pour ne rien oublier",
          juste: false,
          retour: "Non : un tableau de bord qui suit des dizaines d'indicateurs ne se lit plus. Il en garde quelques-uns, ceux des facteurs clés de succès, avec un seuil d'alerte.",
        },
        {
          texte: "À noter chaque salarié et à calculer sa prime",
          juste: false,
          retour: "C'est un usage possible, pas le premier. Un indicateur qui fait la prime est vite manipulé : le chiffre d'affaires du laboratoire l'a montré.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["dashboard", "contribution_margin"],
      tableau: tableauDesServices,
      texte: (c) => {
        const x = organisationDuChapitre(c);
        return [
          `Vous avez organisé le contrôle de ${x.f.entreprise}. Vous avez situé le contrôle de gestion entre le contrôle stratégique et le contrôle opérationnel, et cherché chaque information à sa source. La chaîne de valeur a délimité son périmètre : ${pct(x.chaine.partDuSoutien)} des charges fixes vont aux activités de soutien.`,
          `Vous avez donné à chaque service son centre. L'atelier, un centre de coûts jugé sur les ${eur(x.atelier.maitrisables)} qu'il maîtrise ; l'administration, un centre de dépenses discrétionnaires. Le service commercial, un centre de profit : il choisit ${eur(x.prixMarge)}, quand un centre de chiffre d'affaires choisirait ${eur(x.prixCA)}.`,
          "Puis vous avez lu la performance : efficace et efficiente, globale, durable, et suivie par un tableau de bord qui sert d'abord à piloter.",
          "Au niveau de l'examen, vous savez rédiger une analyse du rôle et de la place du contrôle de gestion dans une organisation donnée. Dans l'arène, découpez votre entreprise de la même façon.",
        ];
      },
      repere: () =>
        "Centre de coûts : ses charges. Centre de chiffre d'affaires : ses ventes. Centre de profit : sa marge. Centre d'investissement : la rentabilité de ses capitaux. Efficacité : l'objectif atteint ; efficience : avec le moins de moyens.",
    },
  ],
};
