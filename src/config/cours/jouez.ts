import type { Cas } from "./cas";
import { fournisseursDe } from "./chapitres/taux-de-marque";
import { ECART_DE_PRIX } from "./decision";
import { BUDGET_DE_FORMATION_EN_ECHELLES, ECART_D_INDICE, EMBAUCHES } from "./ressources-humaines";
import { formuleRetenue } from "./chapitres/s-assurer-contre-les-aleas";
import { ECART_SOUS_LE_MARCHE, TRIMESTRE_DE_LA_BAISSE, TRIMESTRE_DU_RECRUTEMENT } from "./chapitres/le-depart-d-un-salarie";
import { TRIMESTRE_SANS_ENTRETIEN } from "./chapitres/entretenir-l-outil";
import { TAUX_DE_CAPACITE_VISE } from "./chapitres/se-fixer-des-objectifs";
import { STRATEGIE_DE_COUTS, STRATEGIE_DE_DIFFERENCIATION } from "./chapitres/couts-ou-differenciation";
import { TRIMESTRE_DE_L_ACHAT, machineDuChapitre } from "./chapitres/croitre-en-investissant";
import { budgetRse } from "./chapitres/la-responsabilite-societale";
import { FACTEUR_DE_LA_VIRGULE, TRIMESTRE_DECIDE, TRIMESTRES_DE_L_EXTRAIT } from "./chapitres/une-donnee-fausse";
import { ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS, PART_DES_VENTES_RETROUVEES } from "./chapitres/ce-que-coute-un-outil-numerique";
import { BAISSE_EN_BASSE_SAISON, HAUSSE_EN_HAUTE_SAISON, saisonDuMarche } from "./chapitres/le-prix-selon-la-saison";
import { SEUILS_ABC } from "./negociation";
import { scenarioByCode, scenarioCodeForLevel } from "../scenarios/registry";
import { DIFFICULTY_PRESETS } from "../difficulty";
import { LES_OFFRES_DE_L_ARENE } from "../tarifs";
import { VITRINE_SOLO_PAR_DEFAUT } from "../vitrine-solo";

/**
 * « ET MAINTENANT, JOUEZ-LE » : LE CHAPITRE, REPRIS DANS L'ARÈNE.
 *
 * Le chapitre se termine sur une mission : lancer une partie chez la même entreprise, faire
 * un geste précis sur la feuille de décision, puis aller lire dans les comptes du tour ce que
 * le chapitre a appris à écrire. La notion quitte l'exercice et devient une conséquence.
 *
 * LES ÉCRANS SONT NOMMÉS, ET LEUR NOM EST VÉRIFIÉ. Une mission ne cite que des lieux de ce
 * registre ; chacun porte les textes qui le désignent à l'écran et le fichier où ils sont
 * écrits, et un test les y retrouve (`tests/cours/jouez.test.ts`). Un écran renommé fait
 * rougir le test au lieu d'envoyer l'élève chercher un onglet qui n'existe plus.
 *
 * LES NIVEAUX RESTENT OUVERTS. Sans licence, la vitrine s'arrête par défaut au niveau 3 : une
 * mission y tient, sauf quand la notion n'existe qu'au-delà (plusieurs références), et la page
 * le dit.
 *
 * L'ARÈNE NE FAIT PAS TOUT. Elle ne déprécie rien et ne régularise rien : les deux chapitres
 * concernés le disent à l'élève et lui font chiffrer ce que l'arène aurait écrit.
 */

/** Un texte qui désigne le lieu à l'écran, et le fichier où il est écrit. */
interface Repere {
  fichier: string;
  texte: string;
}

export const LIEUX_DE_L_ARENE = {
  "compte-de-resultat": {
    chemin: "Résultats › Finance › Compte de résultat",
    reperes: [
      { fichier: "src/app/arena/[gameId]/page.tsx", texte: 'label: "Résultats"' },
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Finance"' },
      { fichier: "src/components/financial-statements.tsx", texte: 'title="Compte de résultat"' },
    ],
  },
  bilan: {
    chemin: "Résultats › Finance › Bilan",
    reperes: [
      { fichier: "src/app/arena/[gameId]/page.tsx", texte: 'label: "Résultats"' },
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Finance"' },
      { fichier: "src/components/financial-statements.tsx", texte: 'title="Bilan"' },
    ],
  },
  "frng-bfr": {
    chemin: "Résultats › Finance › Bilan, la ligne sous les deux colonnes (FRNG − BFR = trésorerie nette)",
    reperes: [
      { fichier: "src/components/financial-statements.tsx", texte: 'title="Bilan"' },
      { fichier: "src/components/financial-statements.tsx", texte: "trésorerie nette {euro(result.functionalBalance.netTreasury)}" },
    ],
  },
  "analyse-des-couts": {
    chemin: "Résultats › Finance › Analyse des coûts",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Finance"' },
      { fichier: "src/components/financial-statements.tsx", texte: 'title="Analyse des coûts"' },
      { fichier: "src/components/financial-statements.tsx", texte: 'label="Seuil de rentabilité"' },
    ],
  },
  "budget-de-tresorerie": {
    chemin: "Résultats › Finance › Budget de trésorerie",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Finance"' },
      { fichier: "src/components/financial-statements.tsx", texte: 'title="Budget de trésorerie"' },
    ],
  },
  ratios: {
    chemin: "Résultats › Finance › Ratios financiers",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Finance"' },
      { fichier: "src/components/ratio-gauges.tsx", texte: 'titre="Ratios financiers"' },
    ],
  },
  synthese: {
    chemin: "Résultats › Synthèse",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Synthèse"' },
      { fichier: "src/components/period-dashboard.tsx", texte: 'label="Trésorerie nette"' },
    ],
  },
  references: {
    chemin: "Résultats › Marché › Vos références sur le tour écoulé",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Marché"' },
      { fichier: "src/components/tableau-des-references.tsx", texte: "Vos références sur le tour écoulé" },
      { fichier: "src/components/tableau-des-references.tsx", texte: 'entete: "Marge/u"' },
    ],
  },
  indicateurs: {
    chemin: "Résultats › Marché › Indicateurs du métier",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Marché"' },
      { fichier: "src/components/period-dashboard.tsx", texte: 'aria-label="Indicateurs du métier"' },
    ],
  },
  "marche-du-tour": {
    chemin: "Résultats › Marché › Marché du tour écoulé",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Marché"' },
      { fichier: "src/components/period-dashboard.tsx", texte: "Marché du tour écoulé" },
    ],
  },
  "plan-face-au-realise": {
    chemin: "Résultats › Marché › Votre plan face au réalisé",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Marché"' },
      { fichier: "src/components/period-dashboard.tsx", texte: "Votre plan face au réalisé" },
    ],
  },
  portefeuille: {
    chemin: "Résultats › Synthèse › Portefeuille d'adhérents",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Synthèse"' },
      { fichier: "src/components/period-dashboard.tsx", texte: 'data-testid="portefeuille-tour"' },
    ],
  },
  "rh-du-tour": {
    chemin: "Résultats › Finance › la ligne « RH · effectif », sous les états financiers",
    reperes: [
      { fichier: "src/components/dashboard-tabs.tsx", texte: 'label: "Finance"' },
      { fichier: "src/components/period-dashboard.tsx", texte: "RH · effectif {r.hr.headcount}" },
    ],
  },
  feuille: {
    chemin: "Décider › Votre feuille de décision",
    reperes: [{ fichier: "src/components/decision-form.tsx", texte: "Votre feuille de décision" }],
  },
} as const satisfies Record<string, { chemin: string; reperes: readonly Repere[] }>;

export type LieuDeLArene = keyof typeof LIEUX_DE_L_ARENE;

/** Le dernier niveau qu'un élève joue sans licence, tel que la vitrine l'ouvre par défaut. */
export const NIVEAU_SANS_LICENCE = VITRINE_SOLO_PAR_DEFAUT.niveauMaxAutres;

/** Le premier niveau où la feuille de décision propose une décision (config/difficulty.ts). */
const niveauDeLaDecision = (d: keyof (typeof DIFFICULTY_PRESETS)[number]["decisions"]) =>
  DIFFICULTY_PRESETS.find((p) => p.decisions[d])!.level as MissionDansLArene["niveau"];
export const NIVEAU_DE_L_ASSURANCE = niveauDeLaDecision("insurance");
export const NIVEAU_DE_L_INVESTISSEMENT = niveauDeLaDecision("investment");
export const NIVEAU_DE_LA_RSE = niveauDeLaDecision("rse");

/**
 * LES MISSIONS QUI SE JOUENT AU-DELÀ DE CE QU'UN ÉLÈVE JOUE SANS LICENCE, parce que leur
 * décision ne s'ouvre qu'au-delà : chacune au niveau qui l'ouvre, et la mission affichée le
 * dit (`reservee`). La gamme, elle, a son propre niveau par entreprise (`niveauDeLaGamme`).
 */
export const MISSIONS_AU_NIVEAU_DE_LEUR_DECISION: Readonly<Record<string, MissionDansLArene["niveau"]>> = {
  "s-assurer-contre-les-aleas": NIVEAU_DE_L_ASSURANCE,
  "croitre-en-investissant": NIVEAU_DE_L_INVESTISSEMENT,
  "la-responsabilite-societale": NIVEAU_DE_LA_RSE,
};

export interface MissionDansLArene {
  niveau: 1 | 2 | 3 | 4 | 5 | 6;
  /** Le geste à faire dans l'arène. */
  faire: string;
  /** Où lire ce que le geste a produit. */
  lieux: readonly LieuDeLArene[];
  /** Ce que l'élève y cherche, la question qu'il rapporte au cours. */
  chercher: string;
}

/** Les mots de la feuille de décision de l'entreprise, au niveau où elle se joue. */
function feuilleDe(c: Cas, niveau: number) {
  const v = scenarioByCode(scenarioCodeForLevel(c.code, niveau)).vocabulary;
  return { prix: v.priceLabel, volume: v.productionPlanLabel };
}

/** Le premier niveau où l'entreprise vend plusieurs références, s'il existe. */
export function niveauDeLaGamme(code: string): 2 | 3 | 4 | 5 | 6 | null {
  const seule = scenarioCodeForLevel(code, 1);
  for (const n of [2, 3, 4, 5, 6] as const) if (scenarioCodeForLevel(code, n) !== seule) return n;
  return null;
}

const partie = (c: Cas, niveau: number) => `Lancez une partie chez ${c.entreprise}, au niveau ${niveau}.`;

const MISSIONS: Record<string, (c: Cas) => MissionDansLArene> = {
  "creation-premier-bilan": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un premier tour sans toucher à la feuille de décision proposée.`,
    lieux: ["bilan"],
    chercher:
      "Retrouvez au bilan les capitaux propres, les dettes financières et les disponibilités : lequel vient des apports, lequel de l'emprunt ? Vérifiez que le total de l'actif égale celui du passif.",
  }),
  "les-flux-de-l-entreprise": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour.`,
    lieux: ["compte-de-resultat", "budget-de-tresorerie"],
    chercher:
      "Le résultat net du tour est-il égal à l'écart entre la trésorerie d'ouverture et celle de clôture ? Trouvez une ligne du compte de résultat qui ne fait sortir aucun argent, puis une ligne du budget de trésorerie qui ne touche pas le résultat.",
  }),
  "charges-produits-encaissements": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour.`,
    lieux: ["compte-de-resultat", "budget-de-tresorerie", "bilan"],
    chercher:
      "Comparez le chiffre d'affaires du compte de résultat aux encaissements clients du budget de trésorerie : pourquoi ne sont-ils pas égaux ? Retrouvez ce qui manque dans les créances clients du bilan.",
  }),
  "la-paie": (c) => ({
    niveau: 3,
    faire: `${partie(c, 3)} Dans « Ressources humaines », embauchez une personne, ou portez les salaires à 105 (marché = 100).`,
    lieux: ["compte-de-resultat", "budget-de-tresorerie"],
    chercher:
      "Dans l'arène, la paie est fondue dans les charges de structure, avec le loyer. De combien ont-elles monté par rapport au tour précédent ? Retrouvez la même hausse dans les charges de structure décaissées du budget de trésorerie.",
  }),
  "l-emprunt": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez deux tours. Au niveau 4, inclus dans ${LES_OFFRES_DE_L_ARENE}, vous décidez vous-même d'emprunter ou de rembourser.`,
    lieux: ["compte-de-resultat", "budget-de-tresorerie", "bilan"],
    chercher:
      "Retrouvez les charges financières au compte de résultat, le remboursement d'emprunt dans le budget de trésorerie, et les dettes financières au bilan, d'un tour à l'autre. Les intérêts sont une charge ; le capital remboursé n'en est pas une : de combien la dette a-t-elle baissé ?",
  }),
  immobilisations: (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez deux tours.`,
    lieux: ["compte-de-resultat", "bilan"],
    chercher:
      "Retrouvez les dotations aux amortissements au compte de résultat, et les immobilisations nettes au bilan. De combien les immobilisations nettes baissent-elles d'un tour à l'autre ? Est-ce le montant des dotations ?",
  }),
  "les-stocks": (c) => {
    const { volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Dans « ${volume} », mettez nettement plus que les ventes estimées, puis jouez le tour.`,
      lieux: ["compte-de-resultat", "bilan", "budget-de-tresorerie"],
      chercher:
        "Retrouvez la production stockée au compte de résultat et les stocks de produits finis au bilan. Les invendus ont-ils pesé autant sur le résultat que sur la trésorerie ? Pourquoi ?",
    };
  },
  "la-cloture": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez la partie jusqu'à la clôture de l'exercice.`,
    lieux: ["compte-de-resultat", "bilan"],
    chercher:
      "Au dernier tour, retrouvez l'impôt sur les sociétés et le résultat net, puis les capitaux propres au bilan. De combien ont-ils grandi depuis le premier tour ? Est-ce la somme des résultats nets ?",
  }),
  "remises-et-reglements": (c) => ({
    niveau: 3,
    faire: `${partie(c, 3)} Dans « Trésorerie · mobiliser le poste clients », escomptez une partie de vos créances.`,
    lieux: ["budget-de-tresorerie", "compte-de-resultat", "bilan"],
    chercher:
      "Retrouvez l'escompte de créances dans le budget de trésorerie, et son coût dans les charges financières. Combien a coûté l'argent reçu plus tôt ? Les créances clients du bilan ont-elles baissé d'autant ?",
  }),
  "depreciations-et-provisions": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour.`,
    lieux: ["bilan", "compte-de-resultat"],
    chercher:
      "L'arène garde les créances clients et les stocks à leur valeur : elle ne déprécie rien. Supposez qu'un dixième des créances clients ne sera jamais payé : de combien la dépréciation ferait-elle baisser le résultat net du tour, et le bilan ?",
  }),
  "regularisations-de-fin-d-exercice": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez la partie jusqu'à la clôture de l'exercice.`,
    lieux: ["compte-de-resultat", "bilan"],
    chercher:
      "L'arène arrête ses comptes au dernier jour, sans charge constatée d'avance ni charge à payer. Si le dernier tour avait payé d'avance un mois de charges de structure du tour suivant, quelle part retireriez-vous des charges, et où la placeriez-vous au bilan ?",
  }),
  "soldes-intermediaires-de-gestion": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Engagez un budget qualité et un budget maintenance, puis jouez le tour.`,
    lieux: ["compte-de-resultat"],
    chercher:
      "Le compte de résultat de l'arène descend par étages : marge sur coût variable, excédent brut d'exploitation, résultat d'exploitation, résultat net. Recalculez l'EBE à partir des lignes au-dessus, puis la CAF : le résultat net plus les dotations aux amortissements.",
  }),
  "bilan-fonctionnel-et-bfr": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez deux tours.`,
    lieux: ["frng-bfr", "bilan"],
    chercher:
      "Sous le bilan, l'arène écrit FRNG − BFR = trésorerie nette. Recalculez le BFR à partir des stocks, des créances clients et des dettes fournisseurs. Quel poste l'a fait bouger d'un tour à l'autre ?",
  }),
  "prix-cout-et-marge": (c) => {
    const { prix } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour, puis un second en changeant le « ${prix} » d'environ 5 %.`,
      lieux: ["analyse-des-couts"],
      chercher:
        "Comparez d'un tour à l'autre la marge sur coût variable par unité et le coût complet unitaire. Lequel a suivi le prix ? Lequel a suivi les quantités vendues ?",
    };
  },
  "seuil-de-rentabilite": (c) => {
    const { prix } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour, puis un second avec un « ${prix} » plus bas.`,
      lieux: ["analyse-des-couts"],
      chercher:
        "Retrouvez le seuil de rentabilité, la marge de sécurité et l'indice de sécurité. Le seuil a-t-il monté quand le prix a baissé ? Recalculez-le : les charges de structure divisées par la marge sur coût variable par unité.",
    };
  },
  "cout-complet": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Engagez un budget qualité et un budget maintenance plus élevés qu'au tour précédent.`,
    lieux: ["analyse-des-couts", "compte-de-resultat"],
    chercher:
      "Ces budgets entrent dans les charges de structure de l'analyse des coûts. De combien ont-ils relevé le coût complet unitaire ? Retrouvez-le en divisant les charges de structure par les unités vendues, puis en ajoutant le coût variable unitaire.",
  }),
  "cout-par-produit": (c) => {
    const gamme = niveauDeLaGamme(c.code);
    if (gamme === null) {
      return {
        niveau: 1,
        faire: `${partie(c, 1)} Dans l'arène, ${c.entreprise} ne vend qu'une seule offre : jouez un tour.`,
        lieux: ["analyse-des-couts"],
        chercher:
          "Avec une seule offre, toutes les charges de structure lui reviennent. Si elles se partageaient entre deux offres selon leurs ventes, laquelle des lignes de l'analyse des coûts changerait ?",
      };
    }
    return {
      niveau: gamme,
      faire: `${partie(c, gamme)} À ce niveau, ${c.entreprise} vend plusieurs références : changez le prix d'une seule, puis jouez le tour.`,
      lieux: ["references", "analyse-des-couts"],
      chercher:
        "Le tableau des références donne, pour chacune, la marge par unité et le volume vendu. Calculez la marge sur coût variable de chaque référence : laquelle couvre le plus de charges de structure ? Celle que vous avez touchée a-t-elle gagné ou perdu de la marge ?",
    };
  },
  "budget-de-tresorerie": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Avant de valider le tour, estimez sur papier la trésorerie de clôture à partir de votre feuille de décision : ce qui entrera, ce qui sortira.`,
    lieux: ["feuille", "budget-de-tresorerie"],
    chercher: "Comparez votre estimation au budget de trésorerie du tour, ligne à ligne. Laquelle vous a le plus trompé, et pourquoi ?",
  }),
  "analyse-des-ecarts": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Remplissez les ventes estimées de la feuille de décision, puis jouez le tour.`,
    lieux: ["plan-face-au-realise"],
    chercher:
      "Votre plan face au réalisé donne, poste par poste, le prévu, le réalisé et l'écart. Pour l'écart sur le chiffre d'affaires, séparez ce qui vient du prix et ce qui vient des quantités vendues.",
  }),
  "tableau-de-bord": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Jouez trois tours.`,
    lieux: ["synthese", "ratios"],
    chercher:
      "Choisissez trois indicateurs, dans la synthèse et les ratios financiers, pour suivre l'entreprise. Notez-les à chaque tour : lequel vous a alerté le premier ?",
  }),
  "decider-prix-fabriquer-acheter": (c) => {
    const { prix, volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour à votre prix, puis un second avec un « ${prix} » plus bas et plus de « ${volume} ».`,
      lieux: ["analyse-des-couts", "compte-de-resultat"],
      chercher:
        "La marge sur coût variable totale a-t-elle grandi ? C'est elle, et non le chiffre d'affaires, qui dit si la baisse de prix valait la peine.",
    };
  },
  "taux-de-marque-et-coefficient": (c) => {
    // Les fournisseurs du scénario que le niveau 1 fait jouer : leurs noms peuvent différer de ceux du chapitre.
    const f = fournisseursDe(scenarioCodeForLevel(c.code, 1));
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour avec « ${f.reference.name} », puis un second où, dans « S'approvisionner », vous choisissez « ${f.moinsCher.name} » sans changer votre prix de vente.`,
      lieux: ["analyse-des-couts", "budget-de-tresorerie"],
      chercher:
        "Dans l'analyse des coûts, retrouvez le coût d'achat d'une unité à chaque tour, et calculez votre taux de marque avec votre prix de vente. De combien a-t-il monté ? Dans le budget de trésorerie, les paiements fournisseurs sont-ils arrivés plus tôt ?",
    };
  },
  "indicateurs-du-point-de-vente": (c) => {
    const { prix, volume } = feuilleDe(c, 1);
    // Le geste qui fait bouger l'indicateur du métier : le rayon, le trafic, ou la salle.
    const geste =
      c.code === "boutique"
        ? `mettez nettement plus dans « ${volume} »`
        : c.code === "ecommerce"
          ? "doublez le « Budget marketing »"
          : `baissez le « ${prix} » d'environ 5 %`;
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour, puis un second où vous ${geste}.`,
      lieux: ["indicateurs"],
      chercher:
        "Comparez les indicateurs du métier d'un tour à l'autre : lequel a bougé avec votre geste, et de combien ? Recalculez-le à la main à partir des ventes du tour, comme dans le chapitre.",
    };
  },
  "stock-du-point-de-vente": (c) => {
    const { volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour, puis un second où vous mettez dans « ${volume} » nettement moins que les ventes estimées.`,
      lieux: ["bilan", "compte-de-resultat"],
      chercher:
        "Au bilan, retrouvez les stocks de produits finis à la fin de chaque tour. Calculez le stock moyen du second tour, puis sa rotation avec le coût variable des ventes du compte de résultat. Le stock a-t-il tourné plus vite ? Et les ventes, ont-elles souffert ?",
    };
  },
  "prevoir-les-ventes": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} À chaque tour, notez la demande de chaque clientèle. Avant le quatrième tour, saisissez votre prévision dans « Ventes estimées », bâtie sur la demande des trois premiers tours et la saison.`,
    lieux: ["marche-du-tour", "plan-face-au-realise"],
    chercher:
      "Au quatrième tour, comparez votre prévision à la demande réelle, puis aux ventes. De combien vous êtes-vous trompé ? Les ventes ont-elles été plafonnées par votre stock ou votre capacité ?",
  }),
  "budget-du-point-de-vente": (c) => {
    const { volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Avant de valider un tour, écrivez votre budget : les ventes estimées, et ce que vous mettez dans « ${volume} ». Saisissez les mêmes ventes dans « Ventes estimées », puis jouez le tour.`,
      lieux: ["plan-face-au-realise", "budget-de-tresorerie", "bilan"],
      chercher:
        "Comparez votre budget au réalisé, poste par poste. Puis retrouvez, dans le budget de trésorerie, les paiements fournisseurs du tour, et au bilan les dettes fournisseurs : la moitié environ des achats y est-elle restée due ?",
    };
  },
  "seuil-du-point-de-vente": (c) => {
    const { prix } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour, puis un second avec un « ${prix} » plus bas d'environ 10 %.`,
      lieux: ["analyse-des-couts", "indicateurs"],
      chercher:
        "Dans l'analyse des coûts, retrouvez le seuil de rentabilité et l'indice de sécurité à chaque tour. De combien le seuil a-t-il monté avec le prix plus bas ? Le panier moyen est-il passé sous le panier plancher que vous aviez calculé ?",
    };
  },
  "promotion-qui-paie": (c) => {
    const { prix, volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour avec un « ${prix} » 10 % plus bas, sans rien changer d'autre ; puis un second, toujours en promotion, où vous mettez plus dans « ${volume} ».`,
      lieux: ["marche-du-tour", "analyse-des-couts"],
      chercher:
        "Au premier tour, les ventes manquées ont-elles grimpé ? Au second, avec de quoi servir, la promotion a-t-elle vendu le volume nécessaire ? Comparez la marge sur coût variable des deux tours.",
    };
  },
  assortiment: (c) => {
    // L'assortiment n'existe dans l'arène qu'au niveau où le commerce passe en gamme.
    const niveau = niveauDeLaGamme(c.code) ?? 1;
    return {
      niveau,
      faire: `${partie(c, niveau)} À ce niveau, ${c.entreprise} vend plusieurs références : jouez un tour sans rien changer, puis un second où vous mettez moins en rayon de la référence qui marge le moins.`,
      lieux: ["references", "analyse-des-couts"],
      chercher:
        "Dans le tableau des références, calculez la marge de chacune aux deux tours. La référence réduite a-t-elle laissé partir des clients vers les autres, ou la marge totale a-t-elle simplement baissé ?",
    };
  },
  "equipe-et-planning": (c) => ({
    niveau: 3,
    faire: `${partie(c, 3)} Dans « Ressources humaines », embauchez une personne, puis jouez le tour sans rien changer d'autre.`,
    lieux: ["compte-de-resultat", "marche-du-tour"],
    chercher:
      "Les charges de structure ont-elles monté du coût d'un salarié ? Les ventes, elles, ont-elles bougé ? Si l'équipe n'était pas ce qui limitait les ventes, l'embauche n'a fait qu'ajouter une charge.",
  }),
  "tableau-de-bord-du-manager": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Jouez quatre tours. À chaque tour, relevez les indicateurs de votre tableau de bord : chiffre d'affaires, panier, indicateur du métier, taux de marque, seuil, part du personnel.`,
    lieux: ["synthese", "indicateurs", "analyse-des-couts"],
    chercher:
      "Quel indicateur a bougé le premier, et dans quel sens ? Quelle décision avez-vous prise en le voyant, et l'a-t-elle remis dans le vert au tour suivant ?",
  }),
  "negocier-le-prix": (c) => {
    const { prix } = feuilleDe(c, 2);
    return {
      niveau: 2,
      faire: `${partie(c, 2)} Jouez un premier tour sans rien changer, puis un second en baissant « ${prix} » de ${Math.round(ECART_DE_PRIX * 100)} %.`,
      lieux: ["analyse-des-couts", "marche-du-tour"],
      chercher:
        "Votre prix baissé reste-t-il au-dessus du coût complet unitaire de l'analyse des coûts ? Les ventes ont-elles monté assez pour compenser la marge cédée sur chaque unité ?",
    };
  },
  "remises-et-conditions": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Jouez un tour, puis comparez ce que vos clients vous doivent à ce que vous avez vendu.`,
    lieux: ["compte-de-resultat", "bilan", "budget-de-tresorerie"],
    chercher:
      "Le chiffre d'affaires du compte de résultat est-il entré en caisse ? Retrouvez au bilan les créances clients : combien de jours de ventes représentent-elles, et que coûterait leur financement au taux de votre emprunt ?",
  }),
  "valeur-d-un-client": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Jouez quatre tours. À chaque tour, relevez le portefeuille d'adhérents (partis, nouveaux, occupation), puis le taux d'attrition et la valeur vie client.`,
    lieux: ["portefeuille", "indicateurs"],
    chercher: `Au tour où l'occupation dépasse ${Math.round((scenarioByCode(c.code).scenario.subscription?.crowdingThreshold ?? 0) * 100)} %, l'attrition monte-t-elle ? De combien la valeur vie client baisse-t-elle alors ? Quelle décision la ferait redescendre : moins d'inscriptions, plus d'encadrement, ou plus de place ?`,
  }),
  "cout-d-acquisition": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Jouez un premier tour sans rien changer, puis un second en augmentant « Budget marketing » de moitié.`,
    lieux: ["indicateurs", "marche-du-tour", "compte-de-resultat"],
    chercher:
      "Combien de nouveaux clients le budget en plus a-t-il amenés, et que coûte chacun d'eux ? La marge gagnée a-t-elle payé le budget ajouté ? Comparez le coût d'acquisition affiché dans les indicateurs aux deux tours.",
  }),
  "commissions-des-partenaires": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Jouez un tour, puis relevez les ventes de chaque clientèle et la ligne des commissions des canaux partenaires.`,
    lieux: ["marche-du-tour", "compte-de-resultat", "indicateurs"],
    chercher:
      "Quelle part de vos commandes vient de la place de marché, et quelle part de votre marge, une fois la commission payée ? La commission par commande est-elle plus basse ou plus haute que le coût d'acquisition des indicateurs ?",
  }),
  "portefeuille-abc": (c) => {
    const niveau = niveauDeLaGamme(c.code)!;
    return {
      niveau,
      faire: `${partie(c, niveau)} Jouez un tour, puis relevez les ventes de chaque clientèle, référence par référence.`,
      lieux: ["marche-du-tour", "references"],
      chercher: `Classez vos clientèles par chiffre d'affaires : combien en faut-il pour faire ${SEUILS_ABC.a} % des ventes ? La référence qui laisse la meilleure marge par unité est-elle celle de votre plus gros compte ?`,
    };
  },
  "marche-et-part-de-marche": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez deux tours sans rien changer, puis relevez votre part de marché et celle de vos concurrents.`,
    lieux: ["marche-du-tour"],
    chercher:
      "Qui est le leader de votre marché ? Votre part de marché a-t-elle monté ou baissé d'un tour à l'autre, et vos ventes ont-elles suivi le marché ?",
  }),
  "segmenter-et-cibler": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour, puis relevez les ventes de chaque clientèle et la demande qu'elle vous a adressée.`,
    lieux: ["marche-du-tour"],
    chercher:
      "Quelle clientèle vous rapporte le plus ? Dans laquelle avez-vous laissé le plus de demande sans la servir ? Si vous baissiez votre prix au tour suivant, laquelle réagirait le plus ?",
  }),
  "prix-psychologique": (c) => {
    const { prix } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour sans rien changer, puis un second en fixant « ${prix} » juste au-dessus d'un prix rond.`,
      lieux: ["marche-du-tour"],
      chercher:
        "La demande adressée a-t-elle baissé plus que la petite hausse de prix ne le laissait prévoir ? Quelle clientèle a le plus réagi ?",
    };
  },
  "demande-et-prix": (c) => {
    const { prix } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour sans rien changer, puis un second en montant « ${prix} » de ${Math.round(ECART_DE_PRIX * 100)} %.`,
      lieux: ["marche-du-tour", "compte-de-resultat"],
      chercher:
        "De combien la demande adressée a-t-elle baissé ? Calculez votre élasticité : est-elle proche de celle du chapitre ? Votre chiffre d'affaires a-t-il monté ou baissé ?",
    };
  },
  "ce-que-rapporte-la-communication": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour sans rien changer, puis un second en doublant « Budget marketing ».`,
    lieux: ["marche-du-tour", "compte-de-resultat"],
    chercher:
      "Combien de ventes le budget en plus a-t-il apportées, et que coûte chacune ? La marge gagnée a-t-elle payé la publicité ajoutée, ou votre offre ne pouvait-elle plus suivre ?",
  }),
  "canaux-de-distribution": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez quatre tours, puis relevez à chaque tour les ventes de chaque clientèle, intermédiaire compris.`,
    lieux: ["marche-du-tour", "compte-de-resultat", "bilan"],
    chercher:
      "Quelle part de vos ventes passe par l'intermédiaire, et à quel tour ? Retrouvez au compte de résultat ce qu'il prélève, et au bilan ce qu'il vous doit encore.",
  }),
  "lire-le-compte-de-resultat": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour, puis ouvrez le compte de résultat.`,
    lieux: ["compte-de-resultat"],
    chercher:
      "Retrouvez les produits, les charges de l'activité, les intérêts et le résultat du tour. L'activité seule a-t-elle gagné de l'argent, avant les intérêts et l'impôt ?",
  }),
  "lire-le-bilan": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour, puis ouvrez le bilan.`,
    lieux: ["bilan"],
    chercher:
      "Retrouvez ce que l'entreprise possède et ce qu'elle doit à la fin du tour. Les deux côtés sont-ils égaux ? Quelle part de l'argent vient des associés ?",
  }),
  "valeur-ajoutee-et-partage": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour, puis ouvrez le compte de résultat.`,
    lieux: ["compte-de-resultat"],
    chercher:
      "Retrouvez ce que l'entreprise a acheté à d'autres et ce qu'elle a vendu. Combien de valeur a-t-elle créée elle-même, et qui en reçoit la plus grande part : le personnel, la banque, l'État ou l'entreprise ?",
  }),
  rentabilite: (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour, puis ouvrez le compte de résultat et le bilan.`,
    lieux: ["compte-de-resultat", "bilan"],
    chercher:
      "Rapportez le résultat du tour aux capitaux propres du bilan : pour 100 € laissés par les associés, combien l'entreprise a-t-elle gagné ? Est-ce plus ou moins que le taux de son emprunt ?",
  }),
  "fonds-de-roulement-et-tresorerie": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez deux tours, puis ouvrez le bilan.`,
    lieux: ["bilan"],
    chercher:
      "Calculez le fonds de roulement et le besoin en fonds de roulement du bilan, puis la trésorerie. Lequel des deux a le plus bougé d'un tour à l'autre, et qu'est-ce qui l'a fait bouger ?",
  }),
  "financer-l-entreprise": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour, puis ouvrez le compte de résultat et le bilan.`,
    lieux: ["compte-de-resultat", "bilan"],
    chercher:
      "Ajoutez au résultat du tour la dotation aux amortissements : c'est l'argent que l'activité a dégagé. Suffirait-il à payer un nouvel équipement ? Sinon, que pèsent les emprunts face aux capitaux propres ?",
  }),
  "effectif-et-masse-salariale": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour, puis ouvrez le compte de résultat.`,
    lieux: ["compte-de-resultat"],
    chercher:
      "Retrouvez ce que le personnel a coûté dans le tour. Quelle part des ventes du tour lui a été consacrée, et ce chiffre bougerait-il si les ventes baissaient ?",
  }),
  "salaire-brut-net-cout": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour, puis ouvrez le compte de résultat.`,
    lieux: ["compte-de-resultat"],
    chercher:
      "Retrouvez ce que le personnel a coûté dans le tour, et divisez-le par l'effectif : c'est le coût d'un salarié, cotisations patronales comprises. Combien ce salarié reçoit-il en net, à peu près ?",
  }),
  // Les décisions de l'équipe (embauches, budget de formation, salaires) s'ouvrent au niveau 3 :
  // les missions des chapitres qui les font jouer s'y placent, comme l'année que l'arène rejoue.
  recruter: (c) => ({
    niveau: 3,
    faire: `${partie(c, 3)} Au premier tour, mettez ${EMBAUCHES} dans « Embauches » de la feuille de décision, puis jouez deux tours.`,
    lieux: ["feuille", "rh-du-tour"],
    chercher:
      "Suivez la ligne « RH · effectif » tour après tour : quand la personne embauchée arrive-t-elle, et de combien le coût RH du tour monte-t-il ? Les ventes ont-elles monté assez pour le payer ?",
  }),
  "remuneration-et-motivation": (c) => ({
    niveau: 3,
    faire: `${partie(c, 3)} Au premier tour, mettez ${Math.round((1 - ECART_D_INDICE) * 100)} dans « Salaires (marché = 100) », puis jouez deux tours sans y retoucher.`,
    lieux: ["feuille", "rh-du-tour"],
    chercher:
      "La ligne « RH · effectif » annonce-t-elle une démission ? Comparez l'effectif et le coût RH du tour à ceux du premier tour : l'économie vaut-elle ce que l'équipe a perdu ?",
  }),
  former: (c) => ({
    niveau: 3,
    faire: `${partie(c, 3)} Au premier tour, mettez ${(scenarioByCode(c.code).scenario.hr!.trainingScale * BUDGET_DE_FORMATION_EN_ECHELLES).toLocaleString("fr-FR")} € dans « Budget formation », puis jouez deux tours.`,
    lieux: ["feuille", "rh-du-tour"],
    chercher:
      "Retrouvez la formation dans la ligne « RH · effectif » du premier tour, et ce qu'elle a coûté. Au tour suivant, l'équipe a-t-elle produit davantage avec le même effectif ?",
  }),
  "indicateurs-sociaux": (c) => ({
    niveau: 3,
    faire: `${partie(c, 3)} Au premier tour, mettez ${Math.round((1 - ECART_D_INDICE) * 100)} dans « Salaires (marché = 100) », puis jouez trois tours.`,
    lieux: ["feuille", "rh-du-tour"],
    chercher:
      "Notez à chaque tour l'effectif et les démissions de la ligne « RH · effectif » : calculez le taux de rotation de l'année jouée, départs divisés par l'effectif moyen.",
  }),
  // BTS GPME. Chaque mission se joue au niveau où sa décision s'ouvre (config/difficulty.ts) :
  // l'assurance au niveau 4, au-delà de ce qu'un élève joue sans licence, comme la gamme.
  "choisir-son-fournisseur": (c) => {
    const f = fournisseursDe(scenarioCodeForLevel(c.code, 1));
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour avec « ${f.reference.name} », puis un second où, dans « S'approvisionner », vous choisissez « ${f.moinsCher.name} » sans rien changer d'autre.`,
      lieux: ["analyse-des-couts", "bilan"],
      chercher:
        "Dans l'analyse des coûts, de combien le coût d'achat d'une unité a-t-il baissé ? Au bilan, les dettes fournisseurs ont-elles monté ou baissé, et pourquoi, au regard du délai de paiement de chaque offre ?",
    };
  },
  "le-client-qui-paie-tard": (c) => ({
    niveau: 3,
    faire: `${partie(c, 3)} Jouez un premier tour sans mobiliser vos créances. Au tour suivant, dans « Trésorerie · mobiliser le poste clients », escomptez une partie de vos créances, sans dépasser le plafond indiqué, puis jouez le tour.`,
    lieux: ["bilan", "budget-de-tresorerie"],
    chercher:
      "Au bilan, de combien les créances clients ont-elles baissé ? Dans le budget de trésorerie, combien l'escompte a-t-il fait entrer en caisse, et que vous a-t-il coûté en charges financières ?",
  }),
  "s-assurer-contre-les-aleas": (c) => ({
    niveau: NIVEAU_DE_L_ASSURANCE,
    faire: `${partie(c, NIVEAU_DE_L_ASSURANCE)} Au premier tour, souscrivez dans « Assurance » la formule ${formuleRetenue(c.code).formule.name}, puis jouez quatre tours.`,
    lieux: ["feuille", "compte-de-resultat"],
    chercher:
      "Retrouvez la prime dans les charges fixes du compte de résultat, à chaque tour, et la ligne « Assurance souscrite » sous les états financiers : un aléa couvert est-il tombé ? Comparez la prime de l'année à ce qu'il aurait coûté.",
  }),
  "le-cout-de-la-non-qualite": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Au premier tour, mettez 0 € dans « Budget qualité », puis jouez deux tours.`,
    lieux: ["feuille", "compte-de-resultat"],
    chercher:
      "Sous les états financiers, la ligne « Coûts de la non-qualité » donne les rebuts du tour et leur coût, face à la prévention : combien la prévention économisée a-t-elle coûté en rebuts ? Le résultat du tour a-t-il monté ?",
  }),
  "le-depart-d-un-salarie": (c) => ({
    niveau: 3,
    faire: `${partie(c, 3)} Au tour ${TRIMESTRE_DE_LA_BAISSE}, mettez ${Math.round((1 - ECART_SOUS_LE_MARCHE) * 100)} dans « Salaires (marché = 100) ». Au tour ${TRIMESTRE_DU_RECRUTEMENT}, remettez 100 et mettez 1 dans « Embauches », puis jouez un tour de plus.`,
    lieux: ["feuille", "rh-du-tour", "compte-de-resultat"],
    chercher:
      "Au tour où le poste est vide, la ligne « RH · effectif » compte-t-elle un salarié de moins ? Comparez les ventes et la marge sur coût variable de ce tour à celles du tour précédent : que coûte le départ, recrutement compris et salaire non versé déduit ?",
  }),
  "entretenir-l-outil": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Au tour ${TRIMESTRE_SANS_ENTRETIEN}, mettez 0 dans « Budget maintenance », puis jouez trois tours avec le budget proposé.`,
    lieux: ["feuille", "compte-de-resultat"],
    chercher:
      "Sur la feuille de décision des tours suivants, de combien la disponibilité de l'outil a-t-elle baissé, et quand revient-elle à 100 % ? Comparez la maintenance économisée au premier tour à la marge sur coût variable perdue ensuite.",
  }),
  // Stratégie et management. L'investissement et la RSE se jouent au niveau qui les ouvre.
  "le-diagnostic-strategique": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez deux tours sans rien changer, puis dressez le diagnostic de votre entreprise : une force, une faiblesse, une opportunité, une menace.`,
    lieux: ["synthese", "compte-de-resultat", "marche-du-tour"],
    chercher:
      "Votre résultat et votre trésorerie nette sont-ils des forces ou des faiblesses ? Avez-vous manqué des ventes ? La demande du marché a-t-elle monté, et vos concurrents vendent-ils moins cher que vous ? Lesquels de ces constats dépendent de vos décisions ?",
  }),
  "se-fixer-des-objectifs": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Avant le premier tour, notez votre objectif : vendre chaque trimestre ${Math.round(TAUX_DE_CAPACITE_VISE * 100)} % de ce que vous pouvez produire. Jouez deux tours en réglant « ${feuilleDe(c, 1).volume} » sur la demande que vous prévoyez.`,
    lieux: ["plan-face-au-realise", "marche-du-tour"],
    chercher:
      "De combien vos ventes s'écartent-elles de votre objectif à chaque tour ? L'écart vient-il de la demande, ou de ventes manquées faute d'avoir produit assez ?",
  }),
  "couts-ou-differenciation": (c) => {
    const { prix, volume } = feuilleDe(c, 2);
    return {
      niveau: 2,
      faire: `${partie(c, 2)} Jouez un tour sans rien changer. Au tour suivant, choisissez une stratégie et tenez-la : pour les coûts, baissez « ${prix} » de ${Math.round((1 - STRATEGIE_DE_COUTS.prix) * 100)} %, divisez par deux « Budget qualité » et « Budget marketing », et montez « ${volume} » ; pour la différenciation, montez « ${prix} » de ${Math.round((STRATEGIE_DE_DIFFERENCIATION.prix - 1) * 100)} %, doublez « Budget qualité » et montez « Budget marketing » de moitié.`,
      lieux: ["marche-du-tour", "compte-de-resultat"],
      chercher:
        "Votre part de marché a-t-elle monté ou baissé ? Et la marge sur coût variable par unité vendue, puis le résultat du tour ? Votre stratégie paie-t-elle face au concurrent qui tient déjà ce côté du marché ?",
    };
  },
  "lire-la-strategie-des-concurrents": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez deux tours sans rien changer : le caractère de chaque concurrent ne paraît qu'après deux tours clos.`,
    lieux: ["marche-du-tour"],
    chercher:
      "Sous le marché du tour écoulé, le benchmark concurrentiel donne le prix moyen et la part de marché de chaque entreprise, et le caractère de chaque concurrent. Calculez l'indice de prix de chacun (son prix ÷ la moyenne du marché × 100) : l'arène affiche l'inverse pour vous, son indice de compétitivité-prix. Le caractère lu dit-il la même stratégie que votre indice ?",
  }),
  "croitre-en-investissant": (c) => {
    const m = machineDuChapitre(c.code);
    return {
      niveau: NIVEAU_DE_L_INVESTISSEMENT,
      faire: `${partie(c, NIVEAU_DE_L_INVESTISSEMENT)} Au tour ${TRIMESTRE_DE_L_ACHAT}, dans « Parc machines · investir ou céder », achetez un équipement de plus, ${m.name}, et dans « Nouvel emprunt », empruntez ${m.costPerUnit.toLocaleString("fr-FR")} €. Puis jouez quatre tours.`,
      lieux: ["feuille", "compte-de-resultat", "bilan"],
      chercher:
        "Au tour suivant, la capacité en service a-t-elle monté sur la feuille de décision ? Au compte de résultat, retrouvez les dotations aux amortissements et les charges financières en plus, et comparez-les à la marge sur coût variable gagnée : la croissance a-t-elle payé ?",
    };
  },
  "la-responsabilite-societale": (c) => ({
    niveau: NIVEAU_DE_LA_RSE,
    faire: `${partie(c, NIVEAU_DE_LA_RSE)} À chaque tour, dans « Engagement RSE », mettez ${budgetRse(c.code).toLocaleString("fr-FR")} € dans « Budget RSE », puis jouez quatre tours.`,
    lieux: ["feuille", "compte-de-resultat", "marche-du-tour"],
    chercher:
      "Au compte de résultat, retrouvez l'engagement RSE de chaque tour. Dans le marché du tour écoulé, la demande adressée monte-t-elle à partir du deuxième tour, et vos ventes avec elle ? Comparez la marge sur coût variable gagnée à ce que l'engagement a coûté.",
  }),
  // Seconde, management et gestion : tout se joue au niveau 1.
  "le-projet-d-entreprise": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un premier tour sans toucher à la feuille de décision proposée.`,
    lieux: ["bilan", "budget-de-tresorerie"],
    chercher:
      "Au bilan, quelle part des ressources vient des associés, quelle part de la banque ? Dans le budget de trésorerie, la trésorerie d'ouverture a-t-elle suffi à payer les charges de structure du tour, ou les encaissements des clients ont-ils pris le relais ?",
  }),
  "organiser-l-activite": (c) => {
    const { volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Calculez d'abord la capacité de l'entreprise, la plus petite de celle des équipements et de celle de l'équipe, comme au chapitre. Mettez-la dans « ${volume} », puis jouez le tour.`,
      lieux: ["feuille", "plan-face-au-realise", "marche-du-tour"],
      chercher:
        "Avez-vous produit tout ce que vous aviez prévu, et vendu tout ce que vous avez produit ? Des clients sont-ils repartis sans être servis ? Qu'est-ce qui a limité l'activité : l'outil, l'équipe ou les clients ?",
    };
  },
  "decider-avec-des-chiffres": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Avant de jouer, calculez les ventes que votre publicité doit faire gagner pour se payer. Jouez un tour avec le budget proposé dans « Budget marketing », puis un second avec 0 €, sans rien changer d'autre.`,
    lieux: ["compte-de-resultat", "marche-du-tour"],
    chercher:
      "Comparez les ventes et le résultat des deux tours : la publicité a-t-elle fait gagner les ventes qui la paient ? Votre prévision avait-elle vu juste ?",
  }),
  "evaluer-son-activite": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez quatre tours. À chaque tour, relevez le chiffre d'affaires, les ventes, le résultat et la trésorerie.`,
    lieux: ["synthese", "compte-de-resultat"],
    chercher:
      "De combien le chiffre d'affaires a-t-il évolué, en pourcentage, du premier au dernier tour ? Le résultat et la trésorerie ont-ils suivi ? Quel a été votre meilleur tour ?",
  }),
  // Bac STMG, systèmes d'information de gestion : des données de l'arène, au niveau 1.
  "des-donnees-a-l-information": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez quatre tours sans rien changer. À chaque tour, notez une ligne par entreprise : le tour, son nom, son chiffre d'affaires.`,
    lieux: ["marche-du-tour"],
    chercher:
      "Sous le marché du tour écoulé, le benchmark concurrentiel donne le chiffre d'affaires de chaque entreprise. Vos notes forment une table de données : regroupez-la par entreprise, puis filtrez les tours 3 et 4. Votre part du chiffre d'affaires des entreprises a-t-elle monté du premier semestre au second ? Un concurrent a-t-il cessé de vendre ?",
  }),
  "construire-un-indicateur-juste": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour sans rien changer.`,
    lieux: ["marche-du-tour"],
    chercher:
      "Sous le marché du tour écoulé, le benchmark concurrentiel donne le prix moyen et le chiffre d'affaires de chaque entreprise, et une ligne « Moyenne du marché ». Vérifiez qu'elle est la moyenne simple des prix moyens. Calculez ensuite le prix pondéré : les ventes de chaque entreprise sont son chiffre d'affaires ÷ son prix moyen ; divisez le chiffre d'affaires total par les ventes totales. Lequel est le plus haut ? Votre indice de compétitivité-prix changerait-il de zone ?",
  }),
  "une-donnee-fausse": (c) => {
    const { prix, volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez ${TRIMESTRES_DE_L_EXTRAIT.length} tours sans rien changer. Après chacun, notez dans un tableur les ventes du tour, votre « ${prix} » et le chiffre d'affaires du compte de résultat, puis vérifiez que le chiffre d'affaires vaut les ventes multipliées par le prix. Au tour ${TRIMESTRE_DECIDE}, mettez dans « ${volume} » la moyenne des ventes des tours joués, puis jouez-le.`,
      lieux: ["marche-du-tour", "compte-de-resultat", "plan-face-au-realise"],
      chercher: `Chaque ligne de votre tableur retombe-t-elle ? Divisez par ${FACTEUR_DE_LA_VIRGULE} les ventes d'un tour, comme une virgule déplacée : de combien la moyenne baisse-t-elle ? Au tour ${TRIMESTRE_DECIDE}, la demande a-t-elle dépassé votre plan, et combien de ventes un plan calé sur la moyenne fausse aurait-il laissé partir ?`,
    };
  },
  "ce-que-coute-un-outil-numerique": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez ${TRIMESTRES_DE_L_EXTRAIT.length} tours sans rien changer à la feuille de décision proposée.`,
    lieux: ["marche-du-tour", "plan-face-au-realise", "compte-de-resultat"],
    chercher: `À chaque tour, combien de clients sont repartis sans être servis alors que votre production n'atteignait pas votre capacité ? Si un outil numérique vous en faisait retrouver ${Math.round(PART_DES_VENTES_RETROUVEES * 100)} %, combien rapporteraient-ils, à la marge sur coût variable du compte de résultat divisée par vos ventes ? Cela paierait-il un abonnement de ${ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS} € par mois pour chacun de vos salariés ?`,
  }),
  "le-cout-matiere": (c) => {
    const { volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour, puis un second où vous mettez dans « ${volume} » nettement plus que les couverts servis au premier tour, sans changer votre prix.`,
      lieux: ["indicateurs", "compte-de-resultat"],
      chercher:
        "Comparez le ratio matières des deux tours dans les indicateurs du métier : de combien de points a-t-il monté, au même ticket ? Au compte de résultat, le coût variable des ventes a-t-il suivi les couverts servis, ou les couverts préparés ?",
    };
  },
  "occupation-et-revenu-par-chambre": (c) => {
    const { prix, volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour, puis un second où vous baissez le « ${prix} » d'environ 10 %, en mettant plus de nuitées dans « ${volume} ».`,
      lieux: ["indicateurs"],
      chercher:
        "Comparez le taux d'occupation, le PMC et le RevPAR des deux tours dans les indicateurs du métier : l'occupation a-t-elle monté ? Et le RevPAR ? Vérifiez que le RevPAR est égal au taux d'occupation multiplié par le PMC.",
    };
  },
  "la-productivite-du-service": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez quatre tours, et relevez à chaque tour vos ventes dans le marché du tour écoulé.`,
    lieux: ["marche-du-tour", "compte-de-resultat"],
    chercher: `À quel tour chaque salarié a-t-il servi le plus de ${c.unites}, et le moins ? Avec le coût d'un salarié du chapitre, calculez le coût du personnel par ${c.unite} à ces deux tours : de combien a-t-il monté au tour le plus creux, si l'équipe n'a pas changé ?`,
  }),
  "le-prix-selon-la-saison": (c) => {
    const { prix } = feuilleDe(c, 1);
    const { haute, basse } = saisonDuMarche(c);
    const aux = (ks: readonly number[]) => ks.map((k) => `au ${k === 1 ? "1er" : `${k}e`}`).join(" et ");
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez quatre tours : ${aux(haute)} tour, la haute saison, montez le « ${prix} » de ${Math.round(HAUSSE_EN_HAUTE_SAISON * 100)} % ; ${aux(basse)}, la basse saison, baissez-le de ${Math.round(BAISSE_EN_BASSE_SAISON * 100)} %.`,
      lieux: ["indicateurs", "plan-face-au-realise", "compte-de-resultat"],
      chercher:
        "Relevez à chaque tour le taux d'occupation, le PMC et le RevPAR. Au tour où vous avez monté le prix, restait-il des nuitées mises en vente invendues ? Au tour où vous l'avez baissé, des clients sont-ils repartis sans chambre ? Votre prix suivait-il la saison, ou le remplissage ?",
    };
  },
  // Fiscalité de l'entreprise : la TVA de l'arène, là où le scénario la compte, au niveau 1.
  "la-declaration-de-tva": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez deux tours sans rien changer à la feuille de décision proposée.`,
    lieux: ["bilan", "budget-de-tresorerie", "compte-de-resultat"],
    chercher:
      "Au bilan du premier tour, relevez la TVA à décaisser, au passif. Retrouvez-la au deuxième tour, à la ligne TVA décaissée du budget de trésorerie : est-ce le même montant ? Est-elle passée par le compte de résultat ? Au bilan du deuxième tour, la nouvelle TVA à décaisser est-elle plus forte ou plus faible, et le chiffre d'affaires a-t-il suivi ?",
  }),
  "la-tva-et-la-tresorerie": (c) => {
    const taux = Math.round((scenarioByCode(c.code).scenario.finance.vatRate ?? 0) * 100);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez trois tours sans rien changer à la feuille de décision proposée.`,
      lieux: ["budget-de-tresorerie", "bilan"],
      chercher: `Au troisième tour, dans le budget de trésorerie, multipliez les encaissements clients et les paiements fournisseurs par ${taux} ÷ ${100 + taux} : c'est la TVA qu'ils contiennent. TVA encaissée, moins TVA payée, moins TVA décaissée : la TVA a-t-elle soulagé votre trésorerie ce tour, ou pesé sur elle ? Au bilan, la TVA à décaisser et la TVA des dettes fournisseurs couvrent-elles la TVA des créances clients ?`,
    };
  },
  "l-impot-sur-les-societes": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez quatre tours : l'exercice entier.`,
    lieux: ["compte-de-resultat", "budget-de-tresorerie"],
    chercher:
      "À chaque tour, relevez la ligne « Impôt sur les sociétés » du compte de résultat, ou « Impôt rendu » après un tour de perte. Additionnez les quatre tours : retrouvez-vous le taux de l'impôt appliqué au résultat avant impôt de l'année ? Le budget de trésorerie fait-il sortir la même somme ?",
  }),
  "le-deficit-reporte": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez la partie au-delà du quatrième tour, dans le second exercice.`,
    lieux: ["compte-de-resultat"],
    chercher:
      "Si les quatre premiers tours finissent en perte, regardez au cinquième la ligne « dont déficit antérieur imputé (report) » du compte de résultat : l'impôt du tour se calcule-t-il sur le résultat diminué de ce déficit ? Sinon, l'impôt du cinquième tour est-il le taux de l'impôt appliqué à son résultat avant impôt ?",
  }),
  "le-stock-de-securite": (c) => {
    const { volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour et notez la demande des clients. Au tour suivant, mettez dans « ${volume} » la demande du tour, plus le stock de sécurité du chapitre, moins le stock qui reste, puis jouez le tour.`,
      lieux: ["marche-du-tour", "plan-face-au-realise", "bilan"],
      chercher:
        "Des clients sont-ils repartis sans être servis ? Combien reste-t-il en stock à la fin du tour, et combien d'argent ce stock immobilise-t-il au bilan ?",
    };
  },
  "ce-que-coute-une-livraison": (c) => ({
    niveau: 1,
    faire: `${partie(c, 1)} Jouez un tour sans toucher à la feuille de décision proposée.`,
    lieux: ["analyse-des-couts", "compte-de-resultat"],
    chercher:
      "Dans l'analyse des coûts, retrouvez le coût variable d'une palette : est-ce la route du chapitre ? Au compte de résultat, divisez les dotations aux amortissements par les palettes livrées : combien chaque palette porte-t-elle d'usure des camions ?",
  }),
  "le-taux-de-remplissage": (c) => {
    const { volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Jouez un tour avec la feuille proposée, puis un second où vous mettez environ 20 % de plus dans « ${volume} ».`,
      lieux: ["indicateurs", "compte-de-resultat"],
      chercher:
        "Comparez le taux de remplissage des deux tours dans les indicateurs du métier. Les charges de structure et les dotations aux amortissements ont-elles bougé au compte de résultat ? Divisez-les par les palettes transportées : de combien la charge fixe d'une palette a-t-elle baissé, et toutes les palettes chargées ont-elles trouvé un client ?",
    };
  },
  "livrer-a-temps": (c) => {
    const { volume } = feuilleDe(c, 1);
    return {
      niveau: 1,
      faire: `${partie(c, 1)} Au premier tour, mettez toute la capacité de votre flotte dans « ${volume} » ; au second tour, gardez le chargement proposé.`,
      lieux: ["plan-face-au-realise", "marche-du-tour"],
      chercher:
        "Au premier tour, combien de palettes chargées n'ont pas trouvé de client, et combien de clients ont été refusés ? Calculez votre taux de service : palettes livrées ÷ palettes demandées. Au second tour, la demande de vos clients a-t-elle baissé après une flotte chargée au-dessus de 95 % de sa capacité ?",
    };
  },
  "tableau-de-bord-commercial": (c) => ({
    niveau: 2,
    faire: `${partie(c, 2)} Jouez quatre tours. À chaque tour, relevez la demande adressée, vos ventes, votre part de marché et votre marge.`,
    lieux: ["marche-du-tour", "plan-face-au-realise", "compte-de-resultat"],
    chercher:
      "À quel tour vos ventes ont-elles servi la plus petite part de la demande ? Le chiffre d'affaires a-t-il baissé parce que les clients manquaient, ou parce que vous ne pouviez pas les servir ? Quelle décision avez-vous prise ensuite ?",
  }),
};

/** La mission du chapitre, chez cette entreprise ; aucune pour un chapitre inconnu. */
export function missionDuChapitre(code: string, c: Cas): MissionDansLArene | null {
  return MISSIONS[code]?.(c) ?? null;
}

/** L'adresse qui ouvre la partie : l'entreprise et le niveau déjà choisis. */
export const adresseDeLaMission = (c: Cas, m: MissionDansLArene) => `/jouer?secteur=${c.code}&niveau=${m.niveau}`;

/** La mission telle que la page la montre : des textes, prêts à passer au navigateur. */
export interface MissionAffichee {
  niveau: number;
  faire: string;
  chercher: string;
  /** Les chemins des écrans à ouvrir, dans l'ordre de la lecture. */
  ou: string[];
  adresse: string;
  /** Quand le niveau dépasse ce qu'un élève joue sans licence : ce qui l'ouvre, en une phrase. */
  reservee: string | null;
}

export function missionAffichee(code: string, c: Cas): MissionAffichee | null {
  const m = missionDuChapitre(code, c);
  if (!m) return null;
  return {
    niveau: m.niveau,
    faire: m.faire,
    chercher: m.chercher,
    ou: m.lieux.map((l) => LIEUX_DE_L_ARENE[l].chemin),
    adresse: adresseDeLaMission(c, m),
    reservee: m.niveau > NIVEAU_SANS_LICENCE ? `Le niveau ${m.niveau} est inclus dans ${LES_OFFRES_DE_L_ARENE}.` : null,
  };
}
