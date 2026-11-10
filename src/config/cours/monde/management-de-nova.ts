import { auCentime } from "./amortissement";
import { coutEmployeurMensuel } from "./capacite";
import { ENTREPRISES_DE_LA_DIRECTION, FICHE_DE_DIRECTION } from "./direction-de-nova";
import { TAUX_DE_CAPACITE_VISE, suiviDesObjectifs } from "./gestion-et-information";
import { HAUT_VERDASSE } from "./haut-verdasse";

/**
 * LE MONDE DU COURS : LE MANAGEMENT DE NOVA, FONCTIONS ET DÉCISIONS (management de première STMG,
 * question 1.3, lot B).
 *
 * Le président de NOVA conduit l'action collective : il fixe des objectifs, organise et anime,
 * mobilise et contrôle, évalue (les quatre fonctions du programme). Ses décisions sont stratégiques
 * ou opérationnelles. Le chapitre les range, puis évalue l'efficacité du management sur l'année N :
 * l'objectif de ventes (gestion-et-information.ts) face aux ventes, et le coût du personnel de montage
 * par enceinte (nova-capacite.ts, capacite.ts). Il compare enfin le management de NOVA à celui de la
 * Communauté de communes du Haut-Verdasse (haut-verdasse.ts), une organisation publique.
 *
 * Aucun chiffre nouveau : les décisions et les gestes à ranger sont des exemples rédigés pour le cours,
 * sans montant.
 */

export const ENTREPRISES_DU_MANAGEMENT = ENTREPRISES_DE_LA_DIRECTION;

export type FonctionDuManagement = "fixer" | "organiser" | "mobiliser" | "evaluer";
export type NiveauDeDecision = "strategique" | "operationnel";

/** Les gestes du président, chacun dans l'une des quatre fonctions du management. */
export const GESTES_DU_PRESIDENT: readonly { libelle: string; fonction: FonctionDuManagement; pourquoi: string }[] = [
  { libelle: `Viser ${Math.round(TAUX_DE_CAPACITE_VISE * 100)} % de la capacité de la ligne chaque trimestre`, fonction: "fixer", pourquoi: "C'est un objectif chiffré : la première fonction du management." },
  { libelle: "Répartir les opérateurs sur les postes de la ligne", fonction: "organiser", pourquoi: "Il répartit le travail : il organise." },
  { libelle: "Réunir l'équipe le lundi pour présenter la semaine", fonction: "organiser", pourquoi: "Il anime l'équipe et coordonne : organiser et animer." },
  { libelle: "Promettre une prime si l'objectif du trimestre est tenu", fonction: "mobiliser", pourquoi: "Il donne envie d'atteindre l'objectif : il mobilise." },
  { libelle: "Lire chaque mois les ventes face à l'objectif", fonction: "mobiliser", pourquoi: "Il suit le réalisé en cours de route pour réagir à temps : il contrôle." },
  { libelle: "Faire le bilan de l'année et en tirer les leçons", fonction: "evaluer", pourquoi: "Il mesure ce qui a été atteint, avec quels moyens : il évalue." },
];

/** Des décisions de NOVA, stratégiques (elles engagent son avenir, prises au sommet) ou opérationnelles. */
export const DECISIONS_DE_NOVA: readonly { libelle: string; niveau: NiveauDeDecision; pourquoi: string }[] = [
  { libelle: "Lancer la gamme Go, One et Studio", niveau: "strategique", pourquoi: "Elle change ce que NOVA vend, pour des années : une décision stratégique." },
  { libelle: "Acheter une seconde ligne de montage", niveau: "strategique", pourquoi: "Un investissement lourd qui engage l'avenir : une décision stratégique." },
  { libelle: "Créer une filiale de distribution", niveau: "strategique", pourquoi: "Elle change la façon dont NOVA atteint ses clients : une décision stratégique." },
  { libelle: "Commander les composants de la semaine", niveau: "operationnel", pourquoi: "Une décision courante, à court terme, qui se répète : opérationnelle." },
  { libelle: "Fixer le planning des opérateurs du mois", niveau: "operationnel", pourquoi: "Elle organise le travail au quotidien : opérationnelle." },
  { libelle: "Choisir le transporteur d'une livraison", niveau: "operationnel", pourquoi: "Elle n'engage que cette livraison : opérationnelle." },
];

export type CoteDuManagement = "prive" | "public" | "les-deux";

/** Ce qui distingue le management de NOVA de celui de la communauté de communes, ou ce qu'ils partagent. */
export function traitsDuManagement() {
  const h = HAUT_VERDASSE;
  return [
    { libelle: "Ses dirigeants rendent compte aux associés, qui ont apporté le capital", cote: "prive" as CoteDuManagement, pourquoi: "C'est NOVA : le président rend compte à l'assemblée des associés." },
    { libelle: "Il cherche un bénéfice, qui rémunère les associés", cote: "prive" as CoteDuManagement, pourquoi: "C'est la finalité lucrative d'une entreprise privée comme NOVA." },
    { libelle: `Ses dirigeants sont des élus : ${h.elus.conseillersCommunautaires} conseillers communautaires`, cote: "public" as CoteDuManagement, pourquoi: "C'est la communauté : ses dirigeants sont élus et rendent compte aux électeurs." },
    { libelle: "Il rend un service à tous les usagers, quels que soient leurs revenus", cote: "public" as CoteDuManagement, pourquoi: "C'est le service public de la communauté : l'intérêt général, l'égalité des usagers." },
    { libelle: "Il se finance surtout par l'impôt et les dotations de l'État", cote: "public" as CoteDuManagement, pourquoi: "C'est la communauté : les usagers ne paient qu'une part de ses recettes." },
    { libelle: "Il fixe des objectifs, organise, contrôle et évalue", cote: "les-deux" as CoteDuManagement, pourquoi: "Les quatre fonctions du management valent pour toute organisation, privée ou publique." },
  ];
}

/** L'efficacité du management sur l'année N : l'objectif tenu, et ce qu'a coûté le personnel de montage par enceinte. */
export function efficaciteDeLAnnee() {
  const f = FICHE_DE_DIRECTION;
  const o = suiviDesObjectifs(f, undefined, "N");
  const coutDuPersonnel = auCentime(f.operateurs.nombre * coutEmployeurMensuel(f) * 12);
  return {
    objectifDeLAnnee: o.objectifDeLAnnee,
    ventes: o.ventesDeLAnnee,
    realisation: o.realisation,
    operateurs: f.operateurs.nombre,
    coutDuPersonnel,
    /** Le coût du personnel de montage par enceinte vendue, au centime. */
    coutParEnceinte: auCentime(coutDuPersonnel / o.ventesDeLAnnee),
  };
}

export const HAUT_VERDASSE_DU_MANAGEMENT = HAUT_VERDASSE;
