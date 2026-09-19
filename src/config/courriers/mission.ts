import type { CourrierDef } from "./types";

/**
 * LA LETTRE DE MISSION : qui vous a demandé de décider.
 *
 * Constaté en relisant l'écran de décision : les leviers du niveau sont tous
 * ouverts dès le premier tour, et aucun n'a été réclamé par personne. Le
 * formulaire les range en étapes courtes — Vendre, Budgéter, Financer —, donc
 * l'élève ne se noie pas ; mais il remplit des champs qui sont là parce qu'ils
 * sont là. Un budget qualité qu'aucune voix n'a demandé est un exercice. Le
 * même budget, demandé par les associés qui viennent de vous confier la
 * maison, est une décision de gestion.
 *
 * UNE LETTRE, PAS DIX. La tentation était d'ouvrir chaque levier par son
 * propre courrier, au tour où il apparaît. Mais les leviers n'apparaissent
 * pas : le niveau de difficulté est fixé à la création de la partie et n'est
 * jamais réécrit ensuite. Les ouvrir tour par tour aurait demandé de rendre
 * la validation serveur consciente du tour, de trancher le cas des bots et de
 * recalibrer tous les scénarios. Pour un mandat, une seule note suffit.
 *
 * ELLE NOMME LES ÉTAPES DU FORMULAIRE, et c'est tout son intérêt : l'élève
 * lit « vous avez la main sur le financement et sur la couverture des
 * risques », puis retrouve exactement ces onglets. Elle ne cite jamais un
 * champ précis — un scénario sans flotte n'a pas d'investissement en
 * machines —, seulement le domaine de responsabilité, qui est vrai partout.
 *
 * Elle circule en pochette interne : un mandat vient de l'intérieur de la
 * maison, il ne s'affranchit pas. Et elle ne change aucun compte : ces six
 * textes ne correspondent à aucun événement du moteur, comme les courriers de
 * routine.
 */

const SIGNATURE = "Les associés";
const EXPEDITEUR = "Note interne · Les associés";
const EFFET = "Aucun effet sur les comptes";

/** Une lettre par niveau de difficulté, dans l'ordre. */
export const LETTRES_DE_MISSION: CourrierDef[] = [
  {
    code: "mission_niveau_1",
    expediteur: EXPEDITEUR,
    objet: "Votre mandat — direction de l'entreprise",
    corps:
      "Nous vous confions la conduite de la maison à compter de ce tour. Votre mandat porte sur ce qui fait vivre une entreprise au jour le jour : le prix auquel vous vendez, le volume que vous engagez, et ce que vous dépensez pour vous faire connaître. Le reste — les financements, les couvertures, les effectifs — demeure de notre ressort pour cette fois. Rendez-nous compte à chaque clôture.",
    signataire: SIGNATURE,
    effet: EFFET,
    enJeu:
      "Trois leviers seulement, et ils suffisent à gagner ou à perdre : le prix fait la marge, le volume fait le risque, le marketing fait la demande.",
    nature: "internal",
    pli: "interne",
    emoji: "📜",
    scope: "team",
  },
  {
    code: "mission_niveau_2",
    expediteur: EXPEDITEUR,
    objet: "Votre mandat — direction et moyens de production",
    corps:
      "Nous vous confions la conduite de la maison à compter de ce tour. Outre le prix, le volume et la communication, vous avez désormais la main sur ce que nous mettons dans le produit et sur l'entretien de l'outil : la qualité se budgète, la maintenance aussi. Ce sont deux dépenses qui ne se voient pas ce tour-ci et qui se paient au suivant. Rendez-nous compte à chaque clôture.",
    signataire: SIGNATURE,
    effet: EFFET,
    enJeu:
      "Qualité et maintenance sont les deux premières dépenses qu'on sacrifie quand la trésorerie serre, et les deux premières qui se rappellent à vous.",
    nature: "internal",
    pli: "interne",
    emoji: "📜",
    scope: "team",
  },
  {
    code: "mission_niveau_3",
    expediteur: EXPEDITEUR,
    objet: "Votre mandat — direction, production et finances",
    corps:
      "Nous vous confions la conduite de la maison à compter de ce tour. Vous tenez l'offre et l'outil, et nous y ajoutons les finances : c'est vous qui décidez désormais comment l'entreprise se finance et comment elle se couvre contre les coups durs. Notre banque et notre assureur s'adresseront directement à vous. Rendez-nous compte à chaque clôture.",
    signataire: SIGNATURE,
    effet: EFFET,
    enJeu:
      "Une entreprise ne meurt pas de perdre de l'argent, elle meurt de ne plus en avoir en caisse. Le financement se décide avant d'en avoir besoin.",
    nature: "internal",
    pli: "interne",
    emoji: "📜",
    scope: "team",
  },
  {
    code: "mission_niveau_4",
    expediteur: EXPEDITEUR,
    objet: "Votre mandat — direction générale",
    corps:
      "Nous vous confions la direction générale de la maison à compter de ce tour. Tout ce qui l'engage relève de vous : l'offre, l'outil, les finances, mais aussi les femmes et les hommes que nous employons, les investissements qui nous porteront demain et les engagements que nous prenons vis-à-vis de notre environnement. Attendez-vous à des tours agités. Rendez-nous compte à chaque clôture.",
    signataire: SIGNATURE,
    effet: EFFET,
    enJeu:
      "Embaucher, investir, s'engager : trois décisions qui coûtent maintenant et ne rapportent que plus tard. C'est l'arbitrage du temps.",
    nature: "internal",
    pli: "interne",
    emoji: "📜",
    scope: "team",
  },
  {
    code: "mission_niveau_5",
    expediteur: EXPEDITEUR,
    objet: "Votre mandat — direction générale et gestion de trésorerie",
    corps:
      "Nous vous confions la direction générale de la maison à compter de ce tour, y compris l'emploi de nos excédents : une trésorerie qui dort ne rapporte rien, une trésorerie placée ne se dépense plus. L'arbitrage vous revient. Le marché que vous trouverez est nerveux et nous vous laisserons peu d'indications. Rendez-nous compte à chaque clôture.",
    signataire: SIGNATURE,
    effet: EFFET,
    enJeu:
      "Placer trop, c'est payer un découvert à 9 % en détenant un placement à 2 %. L'excédent d'aujourd'hui est le besoin de demain.",
    nature: "internal",
    pli: "interne",
    emoji: "📜",
    scope: "team",
  },
  {
    code: "mission_niveau_6",
    expediteur: EXPEDITEUR,
    objet: "Votre mandat — direction générale et affectation du résultat",
    corps:
      "Nous vous confions la direction générale de la maison à compter de ce tour, et cette fois vous nous répondrez aussi sur nos parts : c'est vous qui proposerez ce qui nous est distribué et ce qui reste dans l'entreprise pour l'armer. Vous ne recevrez aucune indication de notre part. Nous jugerons sur les comptes. Rendez-nous compte à chaque clôture.",
    signataire: SIGNATURE,
    effet: EFFET,
    enJeu:
      "Distribuer, c'est récompenser les associés ; mettre en réserve, c'est financer la suite sans emprunter. On ne peut pas faire les deux avec le même euro.",
    nature: "internal",
    pli: "interne",
    emoji: "📜",
    scope: "team",
  },
];

const parNiveau = new Map(LETTRES_DE_MISSION.map((c, i) => [i + 1, c]));

/**
 * La lettre du niveau. Un niveau inconnu retombe sur la première : mieux vaut
 * un mandat plus étroit que la promesse de leviers que l'élève n'a pas.
 */
export function lettreDeMission(niveau: number): CourrierDef {
  return parNiveau.get(niveau) ?? LETTRES_DE_MISSION[0]!;
}

/** Un mandat, pas un événement : il ne se distribue pas et ne se joue pas. */
export function estUneLettreDeMission(code: string): boolean {
  return code.startsWith("mission_");
}
