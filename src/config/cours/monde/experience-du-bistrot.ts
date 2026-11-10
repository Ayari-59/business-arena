import { LA_TABLE_D_AUGUSTIN } from "./la-table-d-augustin";

/**
 * LE MONDE DU COURS : L'EXPÉRIENCE CLIENT À LA TABLE D'AUGUSTIN (le chapitre « L'expérience client et
 * la valeur perçue », mercatique de terminale, question 1.2 : « Toute consommation crée-t-elle de
 * l'expérience ? »).
 *
 * CE QUI VIENT DE LA FICHE DU BISTROT (la-table-d-augustin.ts) : le ticket moyen d'un couvert, ses
 * denrées et ses autres coûts variables, les couverts que la salle sert par jour, les trois clientèles
 * et leur demande du premier trimestre.
 *
 * LES HYPOTHÈSES DU CHAPITRE, dites ici :
 *   · L'ENQUÊTE DE SATISFACTION : 120 clients ont noté, sur 10, ce qu'ils attendaient et ce qu'ils ont
 *     perçu, critère par critère ; 90 se disent satisfaits de leur repas ;
 *   · LES JEUDIS DU CHEF : un dîner en cuisine ouverte, où le chef présente ses plats, avec un musicien.
 *     Le couvert se vend 52 € hors taxes, ses denrées coûtent 16 € (plus les autres coûts variables
 *     d'un couvert) ; l'animation coûte 600 € par soirée. Un jeudi soir ordinaire, la salle sert 40
 *     dîners ;
 *   · LE CAS « UNE SOIRÉE LE MARDI ? » : un mardi soir ordinaire sert 25 dîners, et 38 clients ont déjà
 *     réservé la soirée du chef si elle a lieu.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Un critère de l'enquête : la note attendue et la note perçue, sur 10. */
export interface CritereDeSatisfaction {
  code: string;
  libelle: string;
  attendu: number;
  percu: number;
}

export const ENQUETE_DU_BISTROT = {
  repondants: 120,
  satisfaits: 90,
  criteres: [
    { code: "accueil", libelle: "L'accueil", attendu: 8, percu: 8.5 },
    { code: "rapidite", libelle: "La rapidité du service", attendu: 8, percu: 6.2 },
    { code: "cuisine", libelle: "La cuisine", attendu: 8.5, percu: 8.8 },
    { code: "cadre", libelle: "Le cadre", attendu: 6.5, percu: 7 },
    { code: "prix", libelle: "Le rapport entre la qualité et le prix", attendu: 7.5, percu: 7.4 },
  ] as readonly CritereDeSatisfaction[],
} as const;

/** Les jeudis du chef (hypothèses du chapitre), et le mardi du cas. */
export const SOIREE_DU_CHEF = {
  prix: 52,
  denrees: 16,
  animation: 600,
  dinersDUnJeudiOrdinaire: 40,
  dinersDUnMardiOrdinaire: 25,
  reservationsDuMardi: 38,
} as const;

export type CodeDeDimension = "sensorielle" | "affective" | "sociale";

/** Ce que vit le client d'un jeudi du chef, rangé par dimension de l'expérience (hypothèse du chapitre). */
export const MOMENTS_DE_LA_SOIREE: readonly { libelle: string; dimension: CodeDeDimension; pourquoi: string }[] = [
  { libelle: "La vue sur la cuisine ouverte et l'odeur du pain qui sort du four", dimension: "sensorielle", pourquoi: "La vue et l'odorat : l'expérience passe par les sens." },
  { libelle: "La musique jouée pendant le dîner", dimension: "sensorielle", pourquoi: "L'ouïe : une ambiance sonore choisie fait partie du repas." },
  { libelle: "Le chef qui raconte d'où vient la recette de sa grand-mère", dimension: "affective", pourquoi: "Une histoire touche le client : l'expérience crée une émotion, un souvenir." },
  { libelle: "Être accueilli par son prénom par la serveuse", dimension: "affective", pourquoi: "Se sentir reconnu fait plaisir : c'est une émotion, pas une prestation de plus." },
  { libelle: "La grande table partagée avec d'autres convives", dimension: "sociale", pourquoi: "Le repas se vit avec les autres : la dimension sociale, ou relationnelle." },
  { libelle: "La photo de la soirée partagée par les clients en ligne", dimension: "sociale", pourquoi: "Le client montre l'expérience à son entourage : elle crée du lien, et elle se raconte." },
];

/** L'enquête : l'écart de chaque critère (perçu − attendu), le critère le plus en retard, le taux de satisfaits. */
export function satisfactionDuBistrot() {
  const criteres = ENQUETE_DU_BISTROT.criteres.map((k) => ({ ...k, ecart: auDixieme(k.percu - k.attendu) }));
  const pire = criteres.reduce((a, b) => (b.ecart < a.ecart ? b : a));
  const meilleur = criteres.reduce((a, b) => (b.ecart > a.ecart ? b : a));
  return {
    criteres,
    pire,
    meilleur,
    repondants: ENQUETE_DU_BISTROT.repondants,
    satisfaits: ENQUETE_DU_BISTROT.satisfaits,
    tauxDeSatisfaits: auDixieme((ENQUETE_DU_BISTROT.satisfaits / ENQUETE_DU_BISTROT.repondants) * 100),
  };
}

/** La marge d'un couvert ordinaire : le ticket moyen moins les denrées et les autres coûts variables. */
export const margeDUnCouvert = () => auCentime(LA_TABLE_D_AUGUSTIN.prixDeLAnnee - LA_TABLE_D_AUGUSTIN.coutMatiereParCouvert - LA_TABLE_D_AUGUSTIN.autresCoutsParCouvert);

/** La marge d'un couvert de la soirée du chef. */
export const margeDUnCouvertDeLaSoiree = () => auCentime(SOIREE_DU_CHEF.prix - SOIREE_DU_CHEF.denrees - LA_TABLE_D_AUGUSTIN.autresCoutsParCouvert);

/** La marge d'un soir ordinaire, que la soirée du chef remplace. */
export const margeDUnSoirOrdinaire = (diners: number) => auCentime(diners * margeDUnCouvert());

/** Une soirée du chef de q couverts, face au soir ordinaire qu'elle remplace : ce qu'elle laisse, ce qu'elle doit couvrir, et l'écart. */
export function soireeDuChef(q: number, dinersOrdinaires: number = SOIREE_DU_CHEF.dinersDUnJeudiOrdinaire) {
  const marge = auCentime(q * margeDUnCouvertDeLaSoiree());
  const aCouvrir = auCentime(SOIREE_DU_CHEF.animation + margeDUnSoirOrdinaire(dinersOrdinaires));
  return { couverts: q, marge, aCouvrir, gain: auCentime(marge - aCouvrir) };
}

/** Le plus petit nombre de couverts pour que la soirée rapporte plus que le soir ordinaire et son animation. */
export const couvertsQuiPaient = (dinersOrdinaires: number = SOIREE_DU_CHEF.dinersDUnJeudiOrdinaire) =>
  Math.ceil(soireeDuChef(0, dinersOrdinaires).aCouvrir / margeDUnCouvertDeLaSoiree() - 1e-9);

/** Les couverts que la salle sert en une soirée : la borne du curseur. */
export const couvertsDeLaSalle = () => LA_TABLE_D_AUGUSTIN.couvertsParJour;
