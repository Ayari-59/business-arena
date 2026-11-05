import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { CAS_DES_ENTREPRISES } from "../monde/cas-des-entreprises";
import {
  COMPTES_PUBLIES,
  CRITERES_DE_NOVA,
  DEPART_DES_PRINCIPES,
  FORMES,
  FORMES_DES_ENTREPRISES,
  ORDRE_DES_FORMES,
  SEUILS_DU_COMMISSAIRE_AUX_COMPTES,
  VEILLE_DE_N_PLUS_1,
  commissaireAuxComptes,
  resultatSelonLesPrincipes,
  type PositionDesPrincipes,
} from "../monde/cadre-de-la-comptabilite";
import { APPORT_EN_CAPITAL, SONORA } from "../monde/exercice-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE CADRE DE LA COMPTABILITÉ, FORMES D'ENTREPRISE, SOURCES DU DROIT ET PRINCIPES
 * (comptabilité générale, palier 3 ; BTS CG P1, 1.1.1 et 1.1.3 ; P2, 2.1.1).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA en N + 1, une SAS (décision du propriétaire,
 * novembre 2026), et les neuf entreprises du cours, chacune avec sa forme (monde/cadre-de-la-comptabilite.ts).
 * Le laboratoire refait la clôture de N (monde/cloture.ts sur la fiche figée, qui n'est que lue).
 *
 * L'objet : la forme de l'entreprise et ce qu'elle impose (capital, responsabilité, dirigeant,
 * commissaire aux comptes) ; la comptabilité privée et la comptabilité publique ; les métiers ; la
 * hiérarchie des sources (code de commerce, règlements de l'ANC, PCG ; IFRS et NEP évoquées) ; la
 * preuve et la déontologie ; l'image fidèle et les principes, remis en face des chapitres où ils ont
 * joué ; la veille et le rôle de l'annexe ; la forme qui convient à une entreprise qui se crée.
 *
 * MATIÈRE : le cours du propriétaire sur les sources du droit comptable (les principes du PCG, articles
 * 121-1 à 121-5, mis en face de propos de dirigeant ; la déontologie du commissaire aux comptes), adapté
 * à NOVA.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, les-cinq-formes, les-neuf-entreprises, ce-que-risquent-les-actionnaires,
 *     le-commissaire-aux-comptes, privee-ou-publique, les-metiers, les-sources, qui-ecrit-le-pcg,
 *     la-preuve, la-deontologie, l-image-fidele ;
 *   · l'expérience avant la formule : predire-la-prudence puis le-laboratoire-des-principes (la
 *     clôture de N, la prudence et l'indépendance des exercices appliquées ou oubliées) avant
 *     les-principes-en-acte ;
 *   · autonome et expert : les-principes-en-acte, la-veille, le-role-de-l-annexe, la-forme-qui-convient ;
 *     puis la synthèse.
 */

/** Le cadre se joue chez NOVA. */
export const ENTREPRISES_DU_CADRE: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const capital = (x: number | null) => (x === null ? "aucun" : x === 1 ? "libre, 1 € au moins" : eur(x));

/** « 5 SARL, 3 SAS et 1 entreprise individuelle » : la forme des neuf entreprises, comptée. */
export function repartitionDesFormes() {
  const n = (f: string) => Object.values(FORMES_DES_ENTREPRISES).filter((x) => x.forme === f).length;
  return `${n("SARL")} SARL, ${n("SAS")} SAS et ${n("EI")} entreprise individuelle`;
}

const position = (p: Readonly<Record<string, number>>): PositionDesPrincipes => ({ prudence: p.prudence ?? 0, independance: p.independance ?? 0 });

/** Tous les chiffres du chapitre. */
export function cadreDuChapitre(_c: { code: string }) {
  const publies = resultatSelonLesPrincipes(COMPTES_PUBLIES);
  return {
    cac: commissaireAuxComptes(CRITERES_DE_NOVA),
    publies,
    sansPrudence: resultatSelonLesPrincipes({ prudence: 0, independance: 1 }),
    sansIndependance: resultatSelonLesPrincipes({ prudence: 1, independance: 0 }),
    premierJet: resultatSelonLesPrincipes(DEPART_DES_PRINCIPES),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

function laFicheDeNova(): TableauDeDonnees {
  return {
    titre: "NOVA, la fiche juridique",
    colonnes: ["NOVA"],
    lignes: [
      { libelle: "Forme", valeurs: [FORMES.SAS.nom] },
      { libelle: "Capital", valeurs: [`${eur(APPORT_EN_CAPITAL.montant)}, en actions`] },
      { libelle: "Dirigeant", valeurs: ["un président, nommé par les actionnaires"] },
      { libelle: "Qui approuve les comptes", valeurs: ["l'assemblée générale des actionnaires"] },
      { libelle: "Impôt sur le bénéfice", valeurs: [FORMES.SAS.impot] },
    ],
  };
}

function lesCinqFormes(): TableauDeDonnees {
  return {
    titre: "Les cinq formes",
    colonnes: ["Qui la détient", "Capital minimal", "Dirigeant", "Titres"],
    lignes: ORDRE_DES_FORMES.map((k) => {
      const f = FORMES[k];
      return { libelle: `${f.code} · ${f.nom}`, valeurs: [f.associes, capital(f.capitalMinimal), f.dirigeant, f.titres ?? "aucun"] };
    }),
  };
}

function lesSeuils(): TableauDeDonnees {
  const s = SEUILS_DU_COMMISSAIRE_AUX_COMPTES;
  const n = CRITERES_DE_NOVA;
  return {
    titre: "Le commissaire aux comptes : deux seuils sur trois",
    colonnes: ["Seuil", "NOVA à la clôture de N"],
    lignes: [
      { libelle: "Total du bilan", valeurs: [eur(s.totalDuBilan), eur(n.totalDuBilan)] },
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(s.chiffreDAffaires), eur(n.chiffreDAffaires)] },
      { libelle: "Salariés", valeurs: [qte(s.effectif), qte(n.effectif)] },
    ],
  };
}

function lesPrincipes(): TableauDeDonnees {
  return {
    titre: "Les principes, et où ils ont joué chez NOVA",
    colonnes: ["Ce qu'il commande", "Où vous l'avez vu"],
    lignes: [
      { libelle: "Prudence", valeurs: ["constater une perte probable, jamais un gain probable", `la créance de ${SONORA.nom} dépréciée, le litige provisionné`] },
      { libelle: "Indépendance des exercices", valeurs: ["rattacher à l'exercice ses charges et ses produits, et eux seuls", "les factures non parvenues ou à établir, les charges et produits constatés d'avance"] },
      { libelle: "Permanence des méthodes", valeurs: ["garder ses méthodes d'un exercice à l'autre", "le coût moyen pondéré des stocks, l'amortissement linéaire"] },
      { libelle: "Continuité d'exploitation", valeurs: ["évaluer comme une entreprise qui continue, pas qui liquide", "la ligne de montage au coût, amortie sur sa durée"] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const LE_CADRE_DE_LA_COMPTABILITE: Chapitre = {
  code: "le-cadre-de-la-comptabilite",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: ["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales", "BTS CG P2 · Contrôle et production de l'information financière"],
  titre: "Le cadre de la comptabilité : formes d'entreprise, sources du droit et principes",
  accroche:
    "NOVA est une SAS, MAILLE & CO une SARL, MARTEL & FILS une entreprise individuelle : ce que la forme impose, d'où viennent les règles que le comptable applique, et ce que pèsent les principes sur un résultat.",
  objectifs: [
    "Caractériser les formes d'entreprise (EI, EURL, SARL, SA, SAS) et reconnaître celle d'une entreprise à ses mots",
    "Distinguer la comptabilité privée de la comptabilité publique, et situer les métiers de la comptabilité",
    "Situer les sources du droit comptable, du code de commerce au plan comptable général, et les règles de preuve et de déontologie",
    "Relier les principes comptables aux travaux où ils jouent, et mesurer leur effet sur le résultat",
    "Conduire une veille : repérer un texte nouveau, dire ce qu'il change, et le rôle de l'annexe",
  ],
  libre: false,
  prerequis: ["creation-premier-bilan"],
  ensuite: ["ventes-et-achats-au-complet"],
  entreprises: {
    codes: ENTREPRISES_DU_CADRE,
    pourquoi: "le cadre de la comptabilité se lit ici depuis NOVA en N + 1, dans la simulation du cours, avec la forme des neuf entreprises du cours ; il vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Avant le journal, le cadre",
      notions: ["balance_sheet"],
      tableau: laFicheDeNova,
      texte: () => [
        "Ce chapitre se joue dans la simulation du cours, chez NOVA, en N + 1. Vous y avez passé des écritures, arrêté un bilan, déprécié une créance. Ce chapitre remonte d'un cran : qui est NOVA aux yeux du droit, d'où viennent les règles que vous avez appliquées, et pourquoi elles existent.",
        `NOVA est une société par actions simplifiée, une SAS. Ses associés ont apporté ${eur(APPORT_EN_CAPITAL.montant)} : ce sont des actionnaires, et ce capital est divisé en actions. Un président la dirige ; chaque année, l'assemblée générale des actionnaires approuve les comptes et décide du sort du bénéfice.`,
        "La forme dit qui décide, qui risque quoi, et quelles obligations comptables s'imposent. Les sources du droit disent comment compter. Les principes disent dans quel esprit.",
      ],
      repere: () => "Trois questions, dans l'ordre : quelle entreprise (sa forme), quelles règles (les sources du droit comptable), quel esprit (les principes et l'image fidèle).",
    },
    {
      id: "les-cinq-formes",
      type: "lecture",
      titre: "Cinq formes d'entreprise",
      tableau: lesCinqFormes,
      texte: () => [
        "L'entreprise individuelle n'est pas une société : l'entrepreneur exploite seul, sans capital ni associé. Depuis 2022, ses biens personnels sont séparés de son patrimoine professionnel, qui seul répond des dettes de l'entreprise.",
        "Les sociétés ont une personne morale distincte de leurs associés. Dans l'EURL, la SARL, la SA et la SAS, chaque associé ne risque que ses apports. La SARL et l'EURL ont des parts sociales et un gérant ; la SA et la SAS ont des actions, la SA un conseil d'administration, la SAS un président et l'organisation que les statuts choisissent.",
        "Les mots trahissent la forme : un gérant et des parts sociales, c'est une SARL ou une EURL ; un président et des actionnaires, une SAS ; un conseil d'administration, une SA ; un entrepreneur seul, une entreprise individuelle.",
      ],
      repere: () => "Toute société commerciale tient une comptabilité complète (journal, grand livre, inventaire) et établit chaque année ses comptes annuels : bilan, compte de résultat, annexe.",
    },
    {
      id: "les-neuf-entreprises",
      objectifs: [0],
      type: "tri",
      titre: "La forme des neuf entreprises du cours",
      question: () => "Chaque entreprise du cours a ses mots, ceux de ses chapitres. Rangez chacune dans sa forme.",
      categories: [
        { code: "EI", libelle: "Entreprise individuelle" },
        { code: "SARL", libelle: "SARL" },
        { code: "SAS", libelle: "SAS" },
      ],
      elements: () =>
        Object.entries(FORMES_DES_ENTREPRISES).map(([code, f]) => ({
          libelle: `${CAS_DES_ENTREPRISES[code]!.entreprise} : ${f.indice}`,
          montant: 0,
          categorie: f.forme,
          pourquoi:
            f.forme === "EI"
              ? "Un entrepreneur seul, sans associé ni capital : c'est l'entreprise individuelle."
              : f.forme === "SARL"
                ? "Un gérant et des associés : c'est le vocabulaire de la SARL, dont le capital est fait de parts sociales."
                : "Des actions, des actionnaires, un président : c'est le vocabulaire de la SAS.",
        })),
      relance: "Cherchez le dirigeant (un gérant, un président, un entrepreneur seul) et ce que détiennent les associés (des parts ou des actions).",
      explication: () => [
        `${repartitionDesFormes()} dans le cours. Le choix ne tient ni à la taille ni au métier : il tient à ce que veulent ceux qui la créent (exploiter seul ou à plusieurs, des statuts souples, l'entrée d'investisseurs).`,
        "La forme se lit dans les statuts et au registre du commerce ; le comptable la connaît avant sa première écriture, parce qu'elle décide du compte de capital, de l'impôt et de qui approuve les comptes.",
      ],
    },
    {
      id: "ce-que-risquent-les-actionnaires",
      objectifs: [0],
      type: "choix",
      titre: "Ce que risquent les actionnaires",
      question: () =>
        `${SONORA.nom}, le client de N, a fini en liquidation : ses fournisseurs n'ont touché qu'une part de leurs créances. Supposez que NOVA connaisse un jour le même sort. Que perdraient ses actionnaires ?`,
      options: () => [
        {
          texte: `Leurs apports, ${eur(APPORT_EN_CAPITAL.montant)}`,
          juste: true,
          retour: "C'est cela. Dans une SAS, chaque actionnaire ne répond des dettes qu'à hauteur de ses apports : ses biens personnels sont à l'abri. Les créanciers de NOVA, eux, supporteraient le reste de la perte, comme NOVA l'a fait avec Sonora.",
        },
        {
          texte: "Toutes les dettes que NOVA ne pourrait pas payer, sur leurs biens personnels",
          juste: false,
          retour: "Non : c'est la responsabilité illimitée, que ne connaissent ni la SAS, ni la SARL, ni la SA. Même l'entrepreneur individuel protège désormais ses biens personnels.",
        },
        {
          texte: "Rien du tout, puisque la société seule est responsable de ses dettes",
          juste: false,
          retour: "Si : leurs apports sont perdus avec la société. La responsabilité est limitée, elle n'est pas nulle.",
        },
      ],
    },
    {
      id: "le-commissaire-aux-comptes",
      objectifs: [0],
      type: "choix",
      titre: "Un commissaire aux comptes ?",
      tableau: lesSeuils,
      question: () =>
        `Une société commerciale nomme un commissaire aux comptes, qui certifie ses comptes, quand elle dépasse ${qte(SEUILS_DU_COMMISSAIRE_AUX_COMPTES.criteresADepasser)} des 3 seuils du tableau à la clôture. NOVA doit-elle en nommer un ?`,
      options: (c) => {
        const x = cadreDuChapitre(c);
        return [
          {
            texte: `Non : elle ne dépasse aucun seuil`,
            juste: !x.cac.obligatoire && x.cac.depasses === 0,
            retour: "C'est cela. NOVA reste loin des trois seuils : la loi ne lui impose pas de commissaire aux comptes. Ses actionnaires peuvent en nommer un s'ils le veulent, par exemple pour rassurer une banque ou un investisseur.",
          },
          {
            texte: "Oui : toute SAS doit faire certifier ses comptes, quelle que soit sa taille",
            juste: false,
            retour: "Non : la SAS suit les mêmes seuils que la SARL et la SA ; en dessous, la certification n'est pas obligatoire.",
          },
          {
            texte: "Oui : son chiffre d'affaires dépasse le million d'euros",
            juste: false,
            retour: `Le seuil du chiffre d'affaires est de ${eur(SEUILS_DU_COMMISSAIRE_AUX_COMPTES.chiffreDAffaires)}, et il en faut deux sur trois.`,
          },
        ];
      },
    },
    {
      id: "privee-ou-publique",
      objectifs: [1],
      type: "choix",
      titre: "Comptabilité privée, comptabilité publique",
      question: () =>
        "À la rentrée, une université publique commande des enceintes pour ses amphithéâtres. Elle paie NOVA par son agent comptable, un comptable public. Qu'est-ce qui distingue sa comptabilité de celle de NOVA ?",
      options: () => [
        {
          texte: "Chez elle, celui qui décide la dépense n'est pas celui qui paie",
          juste: true,
          retour:
            "C'est le principe de la comptabilité publique : l'ordonnateur (le président de l'université) engage et ordonne la dépense, le comptable public la contrôle et la paie, et il en répond sur ses deniers. Elle suit un budget voté. NOVA tient une comptabilité privée, selon le code de commerce et le plan comptable général, pour mesurer son patrimoine et son résultat.",
        },
        {
          texte: "Il n'y a aucune différence : toutes les organisations appliquent le même plan comptable général",
          juste: false,
          retour: "Non : l'État, les collectivités et les établissements publics ont leurs propres règles, budgétaires d'abord. Le PCG est celui des entreprises.",
        },
        {
          texte: "L'université ne tient pas de comptabilité, puisqu'elle ne cherche pas de bénéfice",
          juste: false,
          retour: "Si, et une comptabilité très encadrée : ne pas chercher de bénéfice ne dispense pas de rendre compte de l'argent public.",
        },
      ],
    },
    {
      id: "les-metiers",
      objectifs: [1],
      type: "tri",
      titre: "Qui fait quoi",
      question: () => "Trois métiers touchent aux comptes de NOVA. Rangez chaque tâche chez celui qui la fait.",
      categories: [
        { code: "comptable", libelle: "Le comptable de NOVA, salarié" },
        { code: "expert", libelle: "L'expert-comptable, cabinet extérieur" },
        { code: "commissaire", libelle: "Le commissaire aux comptes" },
      ],
      elements: () => [
        { libelle: "Saisir les factures et lettrer les comptes clients au fil des jours", montant: 0, categorie: "comptable", pourquoi: "La tenue au quotidien se fait dans l'entreprise, par son service comptable." },
        { libelle: "Préparer le règlement des fournisseurs à l'échéance", montant: 0, categorie: "comptable", pourquoi: "C'est une tâche de gestion courante, au cœur du service comptable." },
        { libelle: "Établir les comptes annuels et la liasse fiscale pour le client qui le mandate", montant: 0, categorie: "expert", pourquoi: "L'expert-comptable, inscrit à l'Ordre, tient ou révise les comptes et les établit pour ses clients." },
        { libelle: "Conseiller le dirigeant sur la forme de sa société", montant: 0, categorie: "expert", pourquoi: "Le conseil fait partie des missions de l'expert-comptable." },
        { libelle: "Certifier que les comptes sont réguliers, sincères et donnent une image fidèle", montant: 0, categorie: "commissaire", pourquoi: "La certification est la mission légale du commissaire aux comptes, indépendant de l'entreprise." },
        { libelle: "Révéler au procureur de la République un fait délictueux découvert dans sa mission", montant: 0, categorie: "commissaire", pourquoi: "C'est une obligation propre au commissaire aux comptes, qui lève son secret professionnel." },
      ],
      relance: "Demandez-vous si la tâche se fait chaque jour dans l'entreprise, pour un client qui mandate un cabinet, ou pour certifier en toute indépendance.",
      explication: () => [
        "Le comptable salarié tient les comptes ; l'expert-comptable les tient, les révise ou les établit pour ses clients, et les conseille ; le commissaire aux comptes les certifie. Le même professionnel ne peut pas être l'expert-comptable et le commissaire aux comptes d'une même société : on ne certifie pas ce qu'on a fait soi-même.",
      ],
    },
    {
      id: "les-sources",
      objectifs: [2],
      type: "tri",
      titre: "D'où viennent les règles",
      question: () => "Le comptable de NOVA applique des règles qui viennent de plusieurs étages. Rangez chaque règle à son étage.",
      categories: [
        { code: "loi", libelle: "Le code de commerce (la loi)" },
        { code: "anc", libelle: "Les règlements de l'ANC (le PCG)" },
        { code: "international", libelle: "Les normes internationales (IFRS)" },
        { code: "profession", libelle: "Les normes de la profession (NEP, déontologie)" },
      ],
      elements: () => [
        { libelle: "Tout commerçant tient un journal, un grand livre et fait un inventaire chaque année", montant: 0, categorie: "loi", pourquoi: "C'est l'obligation comptable du commerçant, posée par le code de commerce." },
        { libelle: "Les comptes annuels sont réguliers, sincères et donnent une image fidèle", montant: 0, categorie: "loi", pourquoi: "Le code de commerce le pose ; le PCG le reprend dans ses premiers articles." },
        { libelle: "Le numéro et l'intitulé du compte 4191, clients avances et acomptes reçus", montant: 0, categorie: "anc", pourquoi: "La liste des comptes est dans le plan comptable général, un règlement de l'ANC homologué par arrêté." },
        { libelle: "Une méthode pour évaluer un stock : le coût moyen pondéré ou le premier entré, premier sorti", montant: 0, categorie: "anc", pourquoi: "Les règles d'évaluation sont dans le PCG." },
        { libelle: "Les comptes consolidés des groupes cotés en Bourse dans l'Union européenne", montant: 0, categorie: "international", pourquoi: "Les IFRS, adoptées par l'Union européenne, s'imposent aux comptes consolidés des sociétés cotées : le BTS les évoque seulement." },
        { libelle: "La démarche d'audit que suit le commissaire aux comptes", montant: 0, categorie: "profession", pourquoi: "Les normes d'exercice professionnel (NEP) encadrent sa mission." },
      ],
      relance: "La loi pose les obligations ; le PCG dit comment compter ; les IFRS valent pour les groupes cotés ; la profession règle sa propre conduite.",
      explication: () => [
        "En haut, la loi : le code de commerce. Puis les règlements de l'Autorité des normes comptables (ANC), dont le PCG, homologués par arrêté. Les IFRS ne s'imposent qu'aux comptes consolidés des sociétés cotées : une PME comme NOVA ne les applique pas. Les normes de la profession encadrent ceux qui tiennent, révisent et certifient les comptes.",
      ],
    },
    {
      id: "qui-ecrit-le-pcg",
      objectifs: [2],
      type: "choix",
      titre: "Qui écrit le plan comptable général",
      question: () => "Le comptable de NOVA se demande qui a écrit le plan comptable général qu'il ouvre chaque jour, et ce que vaut une règle qu'il y trouve.",
      options: () => [
        {
          texte: "L'ANC, par un règlement homologué par arrêté",
          juste: true,
          retour: "C'est cela. L'Autorité des normes comptables élabore les règlements, après consultation ; un arrêté ministériel les homologue, et ils s'imposent alors à toutes les entreprises qui y sont soumises. Le PCG est le règlement ANC n° 2014-03, mis à jour depuis par d'autres règlements.",
        },
        {
          texte: "L'ordre des experts-comptables, qui en fait une simple recommandation à ses membres",
          juste: false,
          retour: "Non : l'Ordre publie des recommandations, la doctrine, utiles quand le texte se tait ; le PCG, lui, s'impose.",
        },
        {
          texte: "Chaque entreprise, qui l'adapte comme elle veut à son activité",
          juste: false,
          retour: "Elle peut détailler son plan de comptes, ajouter des sous-comptes, mais pas changer les règles du PCG.",
        },
      ],
    },
    {
      id: "la-preuve",
      objectifs: [2],
      type: "choix",
      titre: "La comptabilité fait preuve",
      question: () =>
        "Un client conteste une facture de NOVA devant le tribunal de commerce. NOVA produit son journal, son grand livre et la facture. Qu'est-ce qui donne leur force à ces documents ?",
      options: () => [
        {
          texte: "Une comptabilité régulière, appuyée sur ses pièces",
          juste: true,
          retour:
            "C'est cela. Entre commerçants, une comptabilité régulièrement tenue peut faire preuve. Chaque écriture s'appuie sur une pièce justificative datée et numérotée ; les livres et les pièces se conservent 10 ans, et l'écriture validée ne se modifie plus : une erreur se corrige par une écriture nouvelle.",
        },
        {
          texte: "Le seul fait d'avoir été saisis dans le PGI, même sans pièce",
          juste: false,
          retour: "Non : une écriture sans pièce justificative ne prouve rien. Le PGI aide à tracer ; il ne remplace pas la pièce.",
        },
        {
          texte: "Rien : seul un acte signé devant notaire prouve une créance",
          juste: false,
          retour: "Entre commerçants, la preuve est libre, et la comptabilité régulière en est une.",
        },
      ],
    },
    {
      id: "la-deontologie",
      objectifs: [2],
      type: "choix",
      titre: "La déontologie",
      question: () =>
        "NOVA grandit ; ses actionnaires envisagent de nommer volontairement un commissaire aux comptes. Le président propose le cabinet qui tient déjà les comptes de NOVA : « il les connaît par cœur ». Que lui répondez-vous ?",
      options: () => [
        {
          texte: "Impossible : on ne certifie pas des comptes qu'on a tenus",
          juste: true,
          retour:
            "C'est cela. Le code de déontologie interdit au commissaire aux comptes de certifier une société dont il tient ou établit les comptes : il perdrait son indépendance. Il est aussi tenu au secret professionnel, et ses honoraires ne dépendent pas de son opinion.",
        },
        {
          texte: "Bonne idée : il connaît le dossier, la certification sera plus rapide et moins chère",
          juste: false,
          retour: "Plus rapide, peut-être ; mais il se contrôlerait lui-même. C'est exactement ce que la déontologie interdit.",
        },
        {
          texte: "C'est possible, s'il baisse ses honoraires de tenue pendant la mission",
          juste: false,
          retour: "Les honoraires n'y changent rien : c'est l'indépendance qui manque.",
        },
      ],
    },
    {
      id: "l-image-fidele",
      type: "lecture",
      titre: "L'image fidèle, et les principes qui la servent",
      notions: ["income_statement", "balance_sheet"],
      tableau: lesPrincipes,
      texte: () => [
        "Le code de commerce demande des comptes réguliers (conformes aux règles), sincères (appliqués de bonne foi, avec ce que l'entreprise sait) et qui donnent une image fidèle de son patrimoine, de sa situation financière et de son résultat.",
        "Les principes du PCG servent ce but. Vous les avez déjà appliqués sans les nommer : le tableau les remet en face des chapitres où ils ont joué.",
      ],
      repere: () => "Régularité, sincérité, image fidèle : le but. Prudence, indépendance des exercices, permanence des méthodes, continuité d'exploitation : les moyens.",
    },
    {
      id: "predire-la-prudence",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur la prudence",
      question: (c) => {
        const x = cadreDuChapitre(c);
        return `Les comptes de N publient un résultat net de ${eur(x.publies.resultatNet)}. Supposez que le comptable ait oublié la prudence : ni la dépréciation de la créance de ${SONORA.nom}, ni la provision du litige. Avant de manipuler, pariez : le résultat net serait…`;
      },
      options: () => {
        const voir = "Le laboratoire de l'étape suivante refait la clôture de N, principe par principe.";
        return [
          { texte: "Plus haut", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Plus bas", juste: false, retour: `Pari à vérifier : une dépréciation et une provision sont des charges. ${voir}` },
          { texte: "Le même : la prudence ne change que le bilan", juste: false, retour: `Pari à vérifier : la dépréciation et la provision passent par le compte de résultat. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-des-principes",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des principes",
      notions: ["income_statement"],
      question: () =>
        "Le premier jet de la clôture de N oubliait les travaux de deux principes. Appliquez ou oubliez la prudence (la dépréciation de Sonora, la provision du litige) et l'indépendance des exercices (les six travaux de rattachement). Le tableau refait la clôture : le résultat avant impôt, l'impôt, le résultat net. Relevez le défi.",
      leviers: () => [
        { code: "prudence", libelle: "Prudence", unite: "", min: 0, max: 1, pas: 1, depart: DEPART_DES_PRINCIPES.prudence, choix: [{ valeur: 0, libelle: "oubliée" }, { valeur: 1, libelle: "appliquée" }] },
        { code: "independance", libelle: "Indépendance des exercices", unite: "", min: 0, max: 1, pas: 1, depart: DEPART_DES_PRINCIPES.independance, choix: [{ valeur: 0, libelle: "oubliée" }, { valeur: 1, libelle: "appliquée" }] },
      ],
      lecture: (_c, p) => {
        const r = resultatSelonLesPrincipes(position(p));
        const d = resultatSelonLesPrincipes(DEPART_DES_PRINCIPES);
        return [
          { libelle: "Résultat avant impôt", montant: r.resultatAvantImpot, reference: d.resultatAvantImpot },
          { libelle: "Impôt sur les sociétés", montant: r.impot, reference: d.impot },
          { libelle: "Résultat net", montant: r.resultatNet, reference: d.resultatNet, fort: true },
          { libelle: "Écart avec les comptes publiés", montant: r.ecart, reference: d.ecart },
        ];
      },
      defi: (c) => {
        const x = cadreDuChapitre(c);
        return {
          consigne: `Retrouvez le résultat net que publient les comptes de N, ${eur(x.publies.resultatNet)} : celui qui donne une image fidèle.`,
          atteint: (p) => resultatSelonLesPrincipes(position(p)).ecart === 0,
          indice: (p) => {
            const r = resultatSelonLesPrincipes(position(p));
            return `Le résultat net est de ${eur(r.resultatNet)}, ${eur(r.ecart)} de plus que les comptes publiés. Quel principe reste oublié ?`;
          },
          solution: { ...COMPTES_PUBLIES },
        };
      },
      montrer: "Montrer les comptes publiés",
      explication: (c) => {
        const x = cadreDuChapitre(c);
        return [
          `Sans prudence, le résultat net serait de ${eur(x.sansPrudence.resultatNet)}, ${eur(x.sansPrudence.ecart)} de trop : NOVA afficherait un bénéfice qu'une perte probable menace déjà. Sans l'indépendance des exercices, ${eur(x.sansIndependance.resultatNet)}, ${eur(x.sansIndependance.ecart)} de trop : la facture non parvenue de décembre pèse plus que les produits à rattacher.`,
          `Le premier jet, sans les deux, surestimait le résultat de ${eur(x.premierJet.ecart)}, et l'impôt avec lui. Les principes ne sont pas des formalités : ils changent le résultat que l'assemblée approuve et sur lequel elle décide d'un dividende.`,
        ];
      },
    },
    {
      id: "les-principes-en-acte",
      objectifs: [3],
      type: "tri",
      titre: "Les principes, en acte",
      question: () => "En réunion, le président de NOVA fait ses propositions. Le comptable répond à chacune par un principe. Rangez chaque proposition sous le principe qui l'écarte.",
      categories: [
        { code: "prudence", libelle: "Prudence" },
        { code: "independance", libelle: "Indépendance des exercices" },
        { code: "permanence", libelle: "Permanence des méthodes" },
        { code: "continuite", libelle: "Continuité d'exploitation" },
      ],
      elements: () => [
        { libelle: "« Notre avocat est sûr de gagner le procès : comptons déjà le gain »", montant: 0, categorie: "prudence", pourquoi: "Un gain probable ne se constate pas ; une perte probable, si." },
        { libelle: "« Passons en janvier les factures de vente de fin décembre, pour payer moins d'impôt »", montant: 0, categorie: "independance", pourquoi: "Une vente livrée en décembre est un produit de l'exercice, quelle que soit la date de la facture." },
        { libelle: "« Cette année, amortissons la ligne en dégressif : le résultat sera plus bas »", montant: 0, categorie: "permanence", pourquoi: "Une méthode ne change pas au gré du résultat voulu ; un changement se justifie, et l'annexe l'explique." },
        { libelle: "« Évaluons nos stocks au premier entré, premier sorti cette année, au coût moyen l'an prochain »", montant: 0, categorie: "permanence", pourquoi: "Changer de méthode chaque année rendrait les exercices incomparables." },
        { libelle: "« Évaluons la ligne à ce qu'on en tirerait si on fermait demain »", montant: 0, categorie: "continuite", pourquoi: "Une entreprise qui continue évalue ses biens au coût, amortis sur leur durée d'usage, pas à leur valeur de liquidation." },
      ],
      relance: "Pour chaque proposition, demandez-vous ce qui serait faussé : un risque oublié, un exercice mal découpé, des années incomparables, ou une entreprise traitée comme si elle fermait.",
      explication: () => [
        "Chaque principe protège une lecture des comptes : la prudence, le créancier ; l'indépendance des exercices, la mesure du résultat de l'année ; la permanence, la comparaison d'une année sur l'autre ; la continuité, l'évaluation d'une entreprise qui vit.",
      ],
    },
    {
      id: "la-veille",
      objectifs: [4],
      type: "choix",
      titre: "La veille : un règlement nouveau",
      question: () => {
        const v = VEILLE_DE_N_PLUS_1.reglementDeLAnc;
        return `En faisant sa veille, le comptable de NOVA lit que le règlement ANC n° ${v.numero} change la présentation des comptes annuels pour les exercices ouverts à compter du ${v.applicableAuxExercicesOuverts}. Le résultat exceptionnel est redéfini, les comptes de transferts de charges disparaissent. L'exercice N + 1 de NOVA en est un. Que fait-il ?`;
      },
      options: () => [
        {
          texte: "Il trace le texte, adapte le PGI et prévient la direction",
          juste: true,
          retour:
            "C'est cela, une veille documentée : il note la source, la date et ce qui change, et met à jour le plan de comptes et les états du PGI avant la clôture de N + 1. Il informe la direction et l'expert-comptable de ce qui bougera dans les comptes. Le cours signale ce texte : ses chapitres restent écrits avec les modèles d'avant.",
        },
        {
          texte: "Rien avant que le commissaire aux comptes le lui demande : NOVA n'en a pas",
          juste: false,
          retour: "Un texte comptable s'applique à toute l'entreprise qui y est soumise, qu'elle ait ou non un commissaire aux comptes.",
        },
        {
          texte: "Il refait aussitôt les comptes de N, déjà approuvés, à la nouvelle présentation",
          juste: false,
          retour: "Non : les comptes de N sont arrêtés et approuvés. Le texte vaut pour les exercices ouverts après sa date ; il prépare N + 1.",
        },
      ],
    },
    {
      id: "le-role-de-l-annexe",
      objectifs: [4],
      type: "choix",
      titre: "Le rôle de l'annexe",
      question: () =>
        "En N + 1, NOVA change pour de bon de méthode d'évaluation de ses stocks, parce que la gamme Go, One, Studio a rendu l'ancienne moins juste. Où le lecteur des comptes l'apprendra-t-il ?",
      options: () => [
        {
          texte: "Dans l'annexe, qui le justifie et en chiffre l'effet",
          juste: true,
          retour:
            "C'est cela. L'annexe fait partie des comptes annuels : elle dit les méthodes suivies, justifie un changement et en donne l'effet, et ajoute ce que le bilan et le compte de résultat ne montrent pas (engagements, événements d'après la clôture). Sans elle, l'image ne serait pas fidèle.",
        },
        {
          texte: "Nulle part : le changement se voit déjà dans le montant du stock",
          juste: false,
          retour: "Le montant ne dit pas pourquoi il a changé, ni de combien à cause de la méthode. C'est ce que l'annexe explique.",
        },
        {
          texte: "Dans le seul procès-verbal de l'assemblée des actionnaires, qui reste interne",
          juste: false,
          retour: "Le procès-verbal ne fait pas partie des comptes annuels, que les tiers lisent : l'information doit être dans l'annexe.",
        },
      ],
    },
    {
      id: "la-forme-qui-convient",
      objectifs: [0],
      type: "choix",
      titre: "La forme qui convient",
      question: () =>
        "Une cliente de NOVA crée seule sa société de location de matériel de sonorisation. Elle apporte 3 000 € et veut protéger ses biens personnels, rester seule maître des décisions, et pouvoir faire entrer plus tard un investisseur sans changer de forme ni lui céder la direction. Quelle forme lui conseillez-vous ?",
      options: () => [
        {
          texte: "Une SAS à associé unique (SASU)",
          juste: true,
          retour:
            "C'est cela. Une SAS peut naître avec un seul associé ; son capital est libre ; les statuts organisent le pouvoir comme elle l'entend, et un investisseur pourra entrer plus tard en actionnaire, avec des actions qui ne lui donnent pas la direction. Elle paiera l'impôt sur les sociétés.",
        },
        {
          texte: "Une société anonyme, la forme des grandes entreprises, qui rassure les investisseurs",
          juste: false,
          retour: `Non : une SA demande ${eur(FORMES.SA.capitalMinimal!)} de capital au moins, 2 actionnaires et un conseil d'administration. C'est beaucoup trop lourd pour elle.`,
        },
        {
          texte: "Une entreprise individuelle, la plus simple, qui protège déjà ses biens personnels",
          juste: false,
          retour: "Elle protège bien ses biens personnels, mais un investisseur ne peut pas y entrer : il n'y a ni capital ni associé. Il faudrait changer de forme le jour venu.",
        },
        {
          texte: "Une EURL, dont elle serait la gérante, avec des parts sociales cédées librement",
          juste: false,
          retour: "L'EURL protège aussi ses biens, mais l'entrée d'un associé la fait devenir SARL, et les parts sociales ne se cèdent pas librement à un tiers : il faut l'accord des associés.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["balance_sheet", "income_statement"],
      texte: (c) => {
        const x = cadreDuChapitre(c);
        return [
          `Vous savez reconnaître une forme d'entreprise à ses mots et dire ce qu'elle impose : NOVA, SAS sous les seuils du commissaire aux comptes ; ${repartitionDesFormes()} dans le cours.`,
          `Vous savez situer une règle comptable, de la loi au PCG, et vous avez mesuré les principes : sans prudence ni indépendance des exercices, NOVA aurait affiché ${eur(x.premierJet.ecart)} de résultat de trop.`,
          "Au niveau de l'examen, vous savez conseiller une forme, dire si un commissaire aux comptes s'impose, relier une situation au principe qu'elle met en jeu. Vous savez conduire une veille qui trace le texte, en tire les conséquences et prévient ceux qu'il concerne.",
          "Dans l'arène, votre entreprise a sa forme elle aussi : retrouvez qui la dirige et qui approuve ses comptes.",
        ];
      },
      repere: () => "Forme : qui détient, qui risque quoi, qui dirige. Sources : code de commerce, puis règlements de l'ANC (le PCG). But : des comptes réguliers, sincères, fidèles. Moyens : prudence, indépendance des exercices, permanence des méthodes, continuité d'exploitation.",
    },
  ],
};
