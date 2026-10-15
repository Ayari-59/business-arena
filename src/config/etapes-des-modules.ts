import { PREFIXE_DES_MODULES, type DecisionDeModule } from "@/config/modules-saisis";

/**
 * CHAQUE MODULE DU SCÉNARIO SE DÉCIDE DANS L'ÉTAPE DE SON THÈME.
 *
 * Les dix-huit catalogues optionnels (stratégie de prix, politiques RH, plans
 * de crise…) s'empilaient dans une étape à part, « Projets », sans ordre : le
 * joueur réglait son prix à « Vendre », puis retrouvait la stratégie de prix
 * six écrans plus loin, entre une démarche qualité et un partenariat. Chaque
 * module vit maintenant à la fin de l'étape dont il prolonge les décisions.
 *
 * CETTE TABLE EST LA SEULE SOURCE DU CLASSEMENT. Le formulaire de décision y
 * lit où poser chaque module, et le récapitulatif d'un tour clos sous quel
 * thème le ranger. Son type exige une étape pour CHAQUE décision de module :
 * un catalogue ajouté sans thème ne compile pas.
 *
 * C'est un pur rangement d'écran. Les noms des champs, le format envoyé au
 * serveur et les brouillons ne changent pas (`config/modules-saisis.ts`).
 */

/** Les étapes du formulaire de décision, dans l'ordre où le joueur les parcourt. */
export const ETAPES_DU_FORMULAIRE = [
  "vendre",
  "approvisionner",
  "budgets",
  "equipe",
  "financer",
  "tresorerie",
  "assurance",
  "prevoir",
] as const;

export type EtapeDuFormulaire = (typeof ETAPES_DU_FORMULAIRE)[number];

/** L'étape de chaque module : là où le joueur prend les décisions du même thème. */
export const ETAPE_DU_MODULE: Record<DecisionDeModule, EtapeDuFormulaire> = {
  // Vendre : le prix, les clients, la marque, les marchés.
  activePricingStrategyIds: "vendre",
  activeCommercialActionIds: "vendre",
  activeBrandActionIds: "vendre",
  enteredMarketIds: "vendre",
  // S'approvisionner : ce qu'on achète, et l'outil qui produit.
  activeContractIds: "approvisionner",
  activeCapacityOptionIds: "approvisionner",
  maintenanceDecisions: "approvisionner",
  // Budgéter : ce qu'on dépense pour l'offre, la qualité, la recherche.
  qualityActions: "budgets",
  hsActions: "budgets",
  startedRdActionIds: "budgets",
  startedInnovationIds: "budgets",
  // Équipe & RSE : les salariés et l'engagement de l'entreprise.
  trainingEnrollments: "equipe",
  activeHRPolicyIds: "equipe",
  activeRseActionIds: "equipe",
  // Financer & investir : d'où vient l'argent, où il va sur la durée.
  financingDraws: "financer",
  activatePartnershipIds: "financer",
  startDigitalProjectIds: "financer",
  // Assurance & risques : se préparer à ce qui peut arriver.
  activeCrisisPlanIds: "assurance",
};

/** Les titres des étapes, tels que la barre d'étapes les affiche. */
const TITRES: Record<EtapeDuFormulaire, string> = {
  vendre: "Vendre",
  approvisionner: "S'approvisionner",
  budgets: "Budgéter",
  equipe: "Équipe & RSE",
  financer: "Financer & investir",
  tresorerie: "Trésorerie",
  assurance: "Assurance",
  prevoir: "S'informer & prévoir",
};

/**
 * Le titre d'une étape. En gamme, la première porte tout ce qui se décide sur
 * une référence : « Vos références ». L'assurance devient « Assurance &
 * risques » quand les plans de crise y sont offerts.
 */
export function titreDeLEtape(
  etape: EtapeDuFormulaire,
  contexte: { gamme?: boolean; risques?: boolean } = {},
): string {
  if (etape === "vendre" && contexte.gamme) return "Vos références";
  if (etape === "assurance" && contexte.risques) return "Assurance & risques";
  return TITRES[etape];
}

/** Les modules d'une offre qui se décident à cette étape, dans l'ordre de l'offre. */
export function modulesDeLEtape<M extends { decision: DecisionDeModule }>(
  offre: readonly M[] | null | undefined,
  etape: EtapeDuFormulaire,
): M[] {
  return (offre ?? []).filter((m) => ETAPE_DU_MODULE[m.decision] === etape);
}

/**
 * LES ÉTAPES À AFFICHER : celles qui portent des champs au niveau joué, et
 * celles qui portent au moins un module offert, même quand leurs champs sont
 * fermés à ce niveau (elles ne montrent alors que les modules). Une étape sans
 * l'un ni l'autre n'apparaît pas : pas d'écran vide.
 */
export function etapesAffichees(
  natives: Partial<Record<EtapeDuFormulaire, boolean>>,
  offre: readonly { decision: DecisionDeModule }[] | null | undefined,
): EtapeDuFormulaire[] {
  return ETAPES_DU_FORMULAIRE.filter(
    (etape) => natives[etape] === true || modulesDeLEtape(offre, etape).length > 0,
  );
}

/**
 * La carte des modules d'une étape, dans le parcours du téléphone : son nom au
 * récapitulatif, et la question posée en tête d'écran.
 */
export const CARTE_DES_MODULES: Record<EtapeDuFormulaire, { nom: string; question: string }> = {
  vendre: { nom: "Engagements commerciaux", question: "Quels engagements commerciaux ?" },
  approvisionner: { nom: "Achats et production", question: "Qu'engagez-vous pour produire ?" },
  budgets: { nom: "Programmes", question: "Quels programmes lancez-vous ?" },
  equipe: { nom: "Engagements RH et RSE", question: "Qu'engagez-vous pour l'équipe ?" },
  financer: { nom: "Financements et projets", question: "Quels financements et projets ?" },
  tresorerie: { nom: "Engagements de trésorerie", question: "Qu'engagez-vous pour la trésorerie ?" },
  assurance: { nom: "Plans de crise", question: "Quels plans de crise préparez-vous ?" },
  prevoir: { nom: "Engagements d'information", question: "Qu'engagez-vous pour vous informer ?" },
};

/** Ce que `moduleDuRefus` lit d'un module offert. */
interface ModuleRepere {
  decision: DecisionDeModule;
  titre: string;
  enCours: readonly { id?: string; arret?: unknown }[];
}

const PREFIXE_DE_CHAMP = PREFIXE_DES_MODULES;
/** Le début du nom d'une case « Arrêter » : `module.arret.<décision>.<id>` (`arretDeModule`). */
export const PREFIXE_D_ARRET = `${PREFIXE_DES_MODULES}arret.`;

/** La décision nommée par un champ de module (`module.<décision>.<id>` ou `module.arret.<décision>.<id>`). */
function decisionDuChamp(nom: string): { decision: string; id: string } | null {
  const reste = nom.startsWith(PREFIXE_D_ARRET)
    ? nom.slice(PREFIXE_D_ARRET.length)
    : nom.startsWith(PREFIXE_DE_CHAMP)
      ? nom.slice(PREFIXE_DE_CHAMP.length)
      : null;
  if (reste === null) return null;
  const point = reste.indexOf(".");
  return point > 0 ? { decision: reste.slice(0, point), id: reste.slice(point + 1) } : null;
}

/**
 * LE MODULE QU'UN REFUS VISE, pour mener le joueur à son étape et le déplier.
 *
 * Un refus qui vise un champ le dit par son nom. Les autres le disent autrement :
 * par le titre du module en tête du message (« Politiques RH : un même choix ne
 * se coche qu'une fois. »), ou, pour un arrêt, par la case « Arrêter » cochée
 * dans la saisie envoyée (celle qui ne vise rien de ce qui tourne, à défaut la
 * première). `null` quand le refus ne vise aucun module affiché : il ne se lit
 * alors qu'au récapitulatif des refus.
 */
export function moduleDuRefus(
  erreur: { champ: string | null; message: string },
  offre: readonly ModuleRepere[] | null | undefined,
  saisie: Iterable<[string, FormDataEntryValue]> | null | undefined,
): DecisionDeModule | null {
  if (!offre || offre.length === 0) return null;
  const offert = (d: string | undefined) => offre.find((m) => m.decision === d) ?? null;
  if (erreur.champ) return offert(decisionDuChamp(erreur.champ)?.decision)?.decision ?? null;
  const parTitre = offre.find((m) => erreur.message.startsWith(`${m.titre} :`));
  if (parTitre) return parTitre.decision;
  if (!/\barrêt\b/i.test(erreur.message)) return null;
  const arrets = [...(saisie ?? [])]
    .map(([nom]) => (nom.startsWith(PREFIXE_D_ARRET) ? decisionDuChamp(nom) : null))
    .filter((x): x is { decision: string; id: string } => x !== null && offert(x.decision) !== null);
  const fautif =
    arrets.find((a) => !offert(a.decision)!.enCours.some((x) => x.id === a.id && x.arret)) ?? arrets[0];
  return fautif ? offert(fautif.decision)!.decision : null;
}
