import type { RoundDecisions } from "@/engine/types";
import type { CourrierDef } from "./types";

/**
 * LES COURRIERS EN RETOUR : une décision est adressée à quelqu'un.
 *
 * Jusqu'ici le courrier ne descendait que dans un sens. Le monde écrivait à
 * l'entreprise — un fournisseur, un contrôle, une panne —, l'entreprise
 * répondait par des chiffres dans un formulaire, et personne ne lui répondait
 * jamais. On licenciait sans qu'aucun avocat n'écrive, on doublait un prix
 * sans qu'aucun client ne s'en plaigne, on cessait d'entretenir l'outil sans
 * que l'atelier n'en dise rien.
 *
 * Ces lettres ferment la boucle. Chaque décision qui touche un interlocuteur
 * lui vaut une réponse au tour suivant, de sa main. L'élève apprend la chose
 * qu'un tableur n'enseigne pas : une décision de gestion est ADRESSÉE. Elle a
 * un destinataire, qui a un intérêt, et qui répond.
 *
 * AUCUN EFFET SUR LES COMPTES, et c'est délibéré. La conséquence chiffrée
 * appartient au moteur, qui l'a déjà calculée : la marge fond, le rebut monte,
 * l'échéance tombe. Ces courriers ne la doublent pas, ils la nomment et
 * disent qui la subit. Les faire peser sur la simulation aurait demandé de
 * recalibrer les neuf secteurs et de régénérer tous les instantanés dorés,
 * pour enseigner deux fois la même chose.
 *
 * Ils sont TRANSVERSES aux secteurs : leur texte ne parle jamais d'un métier
 * en particulier — « vos clients », « vos équipes », « votre matériel » —,
 * sans quoi il aurait fallu les réécrire neuf fois et ils auraient menti une
 * fois sur trois.
 */

/** Combien de réponses au plus, en un tour. Voir `reponsesAuxDecisions`. */
export const MAX_REPONSES = 3;

/** Un prix a bougé d'au moins ce rapport pour qu'on s'en plaigne ou s'en étonne. */
const SEUIL_PRIX = 0.1;

const EFFET = "Aucun effet sur les comptes";

/**
 * LE PRIX DU TOUR, gamme comprise. En mono c'est le scalaire ; en gamme, la
 * moyenne des références, parce que le scalaire n'est plus saisi. Comparer un
 * scalaire jamais renseigné à un autre aurait fait taire le client à chaque
 * fois qu'une gamme change ses prix.
 */
export function prixDuTour(d: RoundDecisions): number {
  const parProduit = Object.values(d.products ?? {});
  if (parProduit.length === 0) return d.price;
  return parProduit.reduce((s, p) => s + p.price, 0) / parProduit.length;
}

/** Le budget qualité du tour, gamme comprise : la somme des références. */
export function qualiteDuTour(d: RoundDecisions): number {
  const parProduit = Object.values(d.products ?? {});
  const somme = parProduit.reduce((s, p) => s + (p.qualityBudget ?? 0), 0);
  return somme > 0 ? somme : d.qualityBudget;
}

export const COURRIERS_EN_RETOUR: CourrierDef[] = [
  {
    code: "retour_licenciement",
    expediteur: "Cabinet Lermite · Avocats, pour le compte de son client",
    objet: "Contestation du licenciement notifié le trimestre écoulé",
    corps:
      "Notre client conteste le motif énoncé dans la lettre que vous lui avez adressée et saisit le conseil de prud'hommes. Le préavis court à compter de la notification. Nous vous invitons à transmettre le dossier à votre assureur de protection juridique.",
    signataire: "L'avocat au barreau",
    effet: EFFET,
    enJeu:
      "Un licenciement n'est pas une ligne qu'on retire d'un tableau : il se motive, il se notifie, et il se conteste.",
    nature: "internal",
    pli: "recommande",
    emoji: "⚖️",
    scope: "team",
  },
  {
    code: "retour_embauche",
    expediteur: "Note interne · Encadrement",
    objet: "Accueil des personnes recrutées",
    corps:
      "Les recrutements que vous avez décidés sont en cours d'intégration. Ils ne seront pleinement opérationnels qu'au terme de leur prise de poste : d'ici là, ils mobilisent du temps d'encadrement sans produire à la cadence des anciens.",
    signataire: "Le responsable d'exploitation",
    effet: EFFET,
    enJeu:
      "Embaucher coûte tout de suite et rapporte plus tard. C'est pour cela que le moteur ne met les nouveaux au travail qu'au tour suivant.",
    nature: "internal",
    pli: "interne",
    emoji: "👥",
    scope: "team",
  },
  {
    code: "retour_hausse_prix",
    expediteur: "Association de clients professionnels",
    objet: "Votre augmentation tarifaire du trimestre écoulé",
    corps:
      "Les entreprises que nous représentons nous signalent une hausse sensible de vos tarifs, sans que la prestation ait changé. Plusieurs d'entre elles consultent la concurrence et nous demandent de vous en informer avant de reporter leurs commandes.",
    signataire: "La déléguée générale",
    effet: EFFET,
    enJeu:
      "Une hausse de prix se voit toujours. La question n'est pas si le client la remarque, mais s'il a ailleurs où aller.",
    nature: "market",
    pli: "simple",
    emoji: "📈",
    scope: "team",
  },
  {
    code: "retour_baisse_prix",
    expediteur: "Note interne · Commercial",
    objet: "Effet de votre baisse de tarif sur nos marges",
    corps:
      "La baisse décidée le trimestre écoulé a été bien reçue par la clientèle, et les volumes suivent. Mais chaque unité vendue rapporte moins : à volume égal, nous encaissons davantage et gagnons moins. Il faudra vendre sensiblement plus pour retrouver la marge d'avant.",
    signataire: "Le responsable commercial",
    effet: EFFET,
    enJeu:
      "Baisser le prix augmente presque toujours le volume. Cela n'augmente le résultat que si le volume gagné couvre la marge perdue.",
    nature: "internal",
    pli: "interne",
    emoji: "📉",
    scope: "team",
  },
  {
    code: "retour_maintenance_coupee",
    expediteur: "Maintenance · Rapport de visite périodique",
    objet: "Report de l'entretien — état constaté de votre matériel",
    corps:
      "Aucun entretien n'a été engagé sur la période écoulée. Nous relevons des jeux anormaux et une usure accélérée sur les organes les plus sollicités. En l'état, la prochaine avarie ne sera plus une réparation mais un remplacement.",
    signataire: "Le technicien de maintenance",
    effet: EFFET,
    enJeu:
      "L'entretien est la dépense la plus facile à supprimer et la plus chère à rattraper : elle ne se voit pas ce tour-ci, elle se paie au suivant.",
    nature: "internal",
    pli: "email",
    emoji: "🔧",
    scope: "team",
  },
  {
    code: "retour_qualite_coupee",
    expediteur: "Service clients · Synthèse des réclamations",
    objet: "Hausse des retours depuis la période écoulée",
    corps:
      "Les réclamations ont nettement progressé depuis que le budget qualité n'est plus doté. Les motifs se ressemblent et portent tous sur la finition. Nous traitons au cas par cas, mais nos clients réguliers commencent à le dire autour d'eux.",
    signataire: "La responsable du service clients",
    effet: EFFET,
    enJeu:
      "La qualité se coupe en un tour et se reconstruit en plusieurs : la réputation met plus de temps à remonter qu'à descendre.",
    nature: "market",
    pli: "email",
    emoji: "📮",
    scope: "team",
  },
  {
    code: "retour_emprunt",
    expediteur: "Votre banque · Service des engagements",
    objet: "Déblocage des fonds et échéancier de remboursement",
    corps:
      "Le financement que vous avez sollicité est débloqué sur votre compte. Les échéances seront prélevées automatiquement à chaque fin de trimestre, capital et intérêts compris, et ce quel que soit le niveau de votre activité.",
    signataire: "Le chargé d'affaires entreprises",
    effet: EFFET,
    enJeu:
      "Un emprunt soulage la trésorerie le jour où on le prend et la grève tous les trimestres suivants. L'échéance ne se négocie pas quand elle tombe.",
    nature: "internal",
    pli: "simple",
    emoji: "🏦",
    scope: "team",
  },
  {
    code: "retour_dividende",
    expediteur: "Note interne · Les associés",
    objet: "Réception de la distribution décidée",
    corps:
      "Nous avons bien reçu la distribution que vous avez proposée et nous vous en remercions. Nous notons qu'elle est prise sur les réserves constituées les trimestres passés, et donc qu'elle ne sera plus disponible pour financer ce que vous entreprendrez ensuite.",
    signataire: "Les associés",
    effet: EFFET,
    enJeu:
      "On ne distribue pas deux fois le même euro : ce qui part aux associés ne finance plus l'entreprise.",
    nature: "internal",
    pli: "interne",
    emoji: "💶",
    scope: "team",
  },
  {
    code: "retour_rse",
    expediteur: "Direction des achats responsables d'un client",
    objet: "Prise en compte de votre démarche dans notre référencement",
    corps:
      "Les engagements que vous avez pris sur la période écoulée ont été portés à notre connaissance. Ils sont pris en compte dans la notation de nos fournisseurs. Nous vous rappelons qu'un engagement interrompu pèse plus lourd, dans cette notation, qu'un engagement jamais pris.",
    signataire: "La direction des achats",
    effet: EFFET,
    enJeu:
      "Un engagement ne vaut que s'il tient dans la durée : celui qu'on abandonne coûte plus cher que celui qu'on n'a pas pris.",
    nature: "macro",
    pli: "simple",
    emoji: "🌱",
    scope: "team",
  },
];

const parCode = new Map(COURRIERS_EN_RETOUR.map((c) => [c.code, c]));

/**
 * LES RÉPONSES AUX DÉCISIONS DU TOUR ÉCOULÉ.
 *
 * Fonction pure, sans base ni moteur : deux jeux de décisions entrent, des
 * lettres sortent. C'est ce qui permet de l'éprouver règle par règle.
 *
 * L'ORDRE EST UNE PRIORITÉ. Une équipe qui licencie, emprunte, augmente ses
 * prix et coupe l'entretien dans le même tour mériterait quatre lettres, et
 * n'en lirait aucune. On garde les trois premières de cette liste, classée du
 * plus engageant au plus anodin : ce qui met en cause l'entreprise passe avant
 * ce qui la félicite.
 */
export function reponsesAuxDecisions(
  actuelles: RoundDecisions | null | undefined,
  precedentes?: RoundDecisions | null,
): CourrierDef[] {
  if (!actuelles) return [];
  const codes: string[] = [];

  // Ce qui met l'entreprise en cause, d'abord.
  if ((actuelles.hr?.fire ?? 0) > 0) codes.push("retour_licenciement");
  // Une coupe ne se lit que par rapport au tour d'avant : un budget à zéro
  // depuis toujours n'est pas une décision, c'est un niveau de difficulté.
  if (precedentes) {
    if (actuelles.maintenanceBudget === 0 && precedentes.maintenanceBudget > 0) {
      codes.push("retour_maintenance_coupee");
    }
    if (qualiteDuTour(actuelles) === 0 && qualiteDuTour(precedentes) > 0) {
      codes.push("retour_qualite_coupee");
    }
    const avant = prixDuTour(precedentes);
    const apres = prixDuTour(actuelles);
    if (avant > 0) {
      const variation = (apres - avant) / avant;
      if (variation >= SEUIL_PRIX) codes.push("retour_hausse_prix");
      else if (variation <= -SEUIL_PRIX) codes.push("retour_baisse_prix");
    }
  }
  // Ce qui engage l'avenir.
  if ((actuelles.finance?.newLoan ?? 0) > 0) codes.push("retour_emprunt");
  if ((actuelles.hr?.hire ?? 0) > 0) codes.push("retour_embauche");
  if ((actuelles.finance?.dividend ?? 0) > 0) codes.push("retour_dividende");
  if ((actuelles.rse?.budget ?? 0) > 0) codes.push("retour_rse");

  return codes.slice(0, MAX_REPONSES).map((code) => parCode.get(code)!);
}

/** Un courrier en retour : il répond à une décision, il ne se distribue pas. */
export function estUnCourrierEnRetour(code: string): boolean {
  return code.startsWith("retour_");
}
