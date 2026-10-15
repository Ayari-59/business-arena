import { PREFIXE_DES_MODULES, type DecisionDeModule } from "@/config/modules-saisis";

/**
 * CHAQUE MODULE DU SCÉNARIO SE DÉCIDE DANS L'ÉTAPE DE SON THÈME.
 *
 * Les catalogues optionnels s'empilaient dans une étape à part, « Projets »,
 * sans ordre. Chaque module vit maintenant à la fin de l'étape dont il
 * prolonge les décisions : les démarches qualité et les programmes de R&D à
 * « Budgéter », à côté du budget qualité et du budget R&D.
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
export const ETAPE_DU_MODULE = {
  // Budgéter : ce qu'on dépense pour la qualité et la recherche.
  qualityActions: "budgets",
  startedRdActionIds: "budgets",
} as const satisfies Record<DecisionDeModule, EtapeDuFormulaire>;

/**
 * LES DÉCISIONS DU NIVEAU 7 « GROUPE », rangées de même par thème : faire
 * fabriquer (sous-traitance, import, synergies des filiales étrangères) avec
 * l'approvisionnement, la croissance externe (rachat, audit) avec le
 * financement et l'investissement. Ce ne sont pas des modules du scénario,
 * mais des leviers du niveau ; la feuille les pose à la fin de leur étape.
 */
export const ETAPE_DU_GROUPE = {
  approvisionnement: "approvisionner",
  croissance: "financer",
} as const satisfies Record<string, EtapeDuFormulaire>;

/** Les étapes qui portent au moins un module. */
export type EtapeDuModule = (typeof ETAPE_DU_MODULE)[DecisionDeModule];

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
 * une référence : « Vos références ».
 */
export function titreDeLEtape(etape: EtapeDuFormulaire, contexte: { gamme?: boolean } = {}): string {
  if (etape === "vendre" && contexte.gamme) return "Vos références";
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
export const CARTE_DES_MODULES: Record<EtapeDuModule, { nom: string; question: string }> = {
  budgets: { nom: "Programmes", question: "Quels programmes lancez-vous ?" },
};

/** Une étape porte-t-elle des modules ? (le type de `CARTE_DES_MODULES`). */
export function etapeDeModule(etape: EtapeDuFormulaire): etape is EtapeDuModule {
  return etape in CARTE_DES_MODULES;
}

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
