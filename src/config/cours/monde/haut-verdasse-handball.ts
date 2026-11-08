import { SOUTIEN_AU_HANDBALL, VALEUR_DE_LA_MISE_A_DISPOSITION, type LigneDuBudget } from "./haut-verdasse";

/**
 * LE MONDE DU COURS : LE HANDBALL CLUB DU HAUT-VERDASSE, L'ASSOCIATION DU COURS.
 *
 * Le programme du bac STMG demande une association à côté des entreprises et de l'organisation
 * publique (voir haut-verdasse.ts). Le club est une association déclarée (loi du 1er juillet 1901) :
 * des adhérents qui mettent en commun leur activité dans un but autre que le partage de bénéfices.
 * Il joue au gymnase intercommunal du Haut-Verdasse, que la communauté de communes lui prête
 * gratuitement, et reçoit d'elle une subvention : les deux fiches lisent ces chiffres au même
 * endroit (SOUTIEN_AU_HANDBALL), pour qu'ils ne divergent pas.
 *
 * QUI DÉCIDE. L'assemblée générale réunit chaque année les adhérents : elle approuve les comptes de
 * la saison, vote le budget et les cotisations, et élit le conseil d'administration, qui choisit en
 * son sein le bureau (la présidente, le trésorier, la secrétaire). Les dirigeants sont bénévoles ;
 * le club emploie deux salariés.
 *
 * LE BUDGET DE LA SAISON N est en argent. Il dégage un petit excédent, mis en réserve pour l'achat
 * de matériel : une association peut faire un excédent, elle ne le partage pas entre ses membres.
 * Le prêt du gymnase et le temps des bénévoles ne coûtent rien en argent ; ils sont valorisés à
 * part, en contributions volontaires en nature. Les chiffres sont des hypothèses du cours ; la garde
 * tests/cours/organisations-du-territoire.test.ts refait chaque total.
 */

/** Une catégorie d'adhérents et sa cotisation annuelle (licence de la fédération comprise). */
export interface CategorieDAdherents {
  code: string;
  nom: string;
  adherents: number;
  cotisation: number;
}

export const HAUT_VERDASSE_HANDBALL = {
  code: "haut-verdasse-handball",
  nom: "Handball Club du Haut-Verdasse",
  court: "le club",
  /** L'organisation associative, à but non lucratif. */
  categorie: "associative",
  forme: "Association déclarée (loi du 1er juillet 1901), affiliée à la fédération de handball",
  presentation:
    "Un club de handball de 240 adhérents, des moins de 9 ans aux seniors, qui s'entraîne et joue ses matchs au gymnase intercommunal.",
  creation: 1987,
  categories: [
    { code: "jeunes", nom: "Jeunes (moins de 18 ans)", adherents: 160, cotisation: 110 },
    { code: "seniors", nom: "Seniors en compétition", adherents: 60, cotisation: 160 },
    { code: "loisirs", nom: "Handball loisir", adherents: 20, cotisation: 140 },
  ] satisfies readonly CategorieDAdherents[],
  benevoles: 35,
  /** Les heures que donnent les bénévoles dans la saison : entraînements, arbitrage, buvette, déplacements. */
  heuresDeBenevolat: 3_500,
  salaries: [
    { poste: "Entraîneur et coordinateur sportif", temps: "temps plein" },
    { poste: "Animateur pour l'école de handball", temps: "mi-temps" },
  ],
  /** Le bureau, élu par le conseil d'administration parmi ses membres. */
  bureau: [
    { role: "présidente", nom: "Nadia Ferrand", mission: "représente le club et signe les contrats, dont ceux des salariés" },
    { role: "trésorier", nom: "Julien Marchal", mission: "tient les comptes et présente le bilan financier à l'assemblée générale" },
    { role: "secrétaire", nom: "Sophie Lenoir", mission: "convoque les réunions, rédige les comptes rendus et tient le registre des adhérents" },
  ],
  conseilDAdministration: 12,
  assembleeGenerale: {
    mois: "juin",
    /** Les adhérents de 16 ans et plus votent ; les plus jeunes sont représentés par un parent. */
    votants: "les adhérents de 16 ans et plus, et un parent pour chaque adhérent plus jeune",
    ordreDuJour: [
      "le rapport moral de la présidente",
      "le rapport financier du trésorier et l'approbation des comptes",
      "le vote du budget et des cotisations de la saison suivante",
      "l'élection d'un tiers du conseil d'administration",
    ],
  },
  /** Le budget en argent de la saison N. */
  budget: {
    recettes: [
      { code: "cotisations", libelle: "Cotisations des adhérents", montant: 30_000 },
      { code: "subvention", libelle: "Subvention de la communauté de communes", montant: SOUTIEN_AU_HANDBALL.subvention },
      { code: "sponsors", libelle: "Partenaires et sponsors locaux", montant: 12_000 },
      { code: "buvette", libelle: "Buvette et tournoi de printemps", montant: 8_000 },
    ],
    depenses: [
      { code: "salaires", libelle: "Salaires et cotisations sociales", montant: 42_000 },
      { code: "federation", libelle: "Licences et engagements en championnat", montant: 11_000 },
      { code: "deplacements", libelle: "Déplacements et arbitrage", montant: 9_000 },
      { code: "materiel", libelle: "Matériel, buvette et frais de fonctionnement", montant: 4_000 },
    ],
  } satisfies { recettes: readonly LigneDuBudget[]; depenses: readonly LigneDuBudget[] },
  /** L'excédent de la saison, mis en réserve pour renouveler les ballons et les maillots. */
  affectationDeLExcedent: "mis en réserve pour renouveler le matériel",
  /** Ce qui ne passe pas par la caisse, valorisé à part. */
  contributionsEnNature: [
    { code: "gymnase", libelle: "Mise à disposition gratuite du gymnase par la communauté de communes", montant: VALEUR_DE_LA_MISE_A_DISPOSITION },
  ] satisfies readonly LigneDuBudget[],
} as const;
