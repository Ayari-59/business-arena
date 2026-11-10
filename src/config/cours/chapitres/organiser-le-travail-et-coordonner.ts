import { eur, qte } from "../../../pedagogy/cours/deux-decimales";
import {
  ABSENCES_DE_L_ANNEE,
  ENTREPRISES_DE_L_ORGANISATION_DU_TRAVAIL,
  FORMATION_POLYVALENTE,
  JOURS_COUVERTS_PAR_POLYVALENT,
  jourSansOperateur,
  polyvalence,
  polyvalentsQuiRapportentLePlus,
} from "../monde/organisation-du-travail-de-nova";
import { OPERATEURS } from "../monde/nova-capacite";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : ORGANISER LE TRAVAIL ET COORDONNER (Bac STMG, management, sciences de gestion et numérique
 * de terminale, enseignement commun, thème 1, question 1.5 : « Comment assurer un fonctionnement
 * cohérent des organisations ? »).
 *
 * L'organisation du travail souple ou rigide (flexibilité, réactivité, polyvalence, enrichissement des
 * tâches), la définition des postes et la spécialisation, le taylorisme et le toyotisme situés dans leur
 * temps, la polyvalence chiffrée au laboratoire (combien d'opérateurs former à tous les postes de la
 * ligne de NOVA), les quatre grands modes de coordination, la ligne hiérarchique, la centralisation et la
 * délégation avec son compte rendu (reporting), le lean management et la performance sociale.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/organisation-du-travail-de-nova.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les enceintes perdues sont une quantité ; la marge perdue au
 * centime.
 */


export const ORGANISER_LE_TRAVAIL_ET_COORDONNER: Chapitre = {
  code: "organiser-le-travail-et-coordonner",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · Les organisations et l'activité de production de biens et de services"],
  titre: "Organiser le travail et coordonner : spécialisation, polyvalence, délégation",
  accroche:
    "Chacun à son poste, ou chacun capable de tenir tous les postes ? Un chef qui décide de tout, ou une équipe qui s'ajuste ? Les choix qui rendent une organisation rigide ou souple, et ce qu'ils rapportent.",
  objectifs: [
    "Distinguer une organisation du travail rigide et une organisation souple",
    "Chiffrer l'intérêt de la polyvalence",
    "Reconnaître les modes de coordination du travail",
    "Situer le pouvoir de décision : centralisation, délégation, contrôle",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ORGANISATION_DU_TRAVAIL,
    pourquoi: "ce chapitre suit l'équipe de montage de NOVA et sa ligne de postes en série.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un mode de production, une organisation du travail",
      texte: (c) => [
        `Sur la ligne de ${c.entreprise}, ${qte(OPERATEURS.nombre)} opérateurs tiennent chacun un poste. Les postes sont en série : quand l'un manque et que personne ne sait le tenir, toute la ligne s'arrête.`,
        "Chaque mode de production demande une organisation du travail adaptée : comment définir les postes, répartir les tâches, coordonner les personnes. Une organisation qui vit dans un environnement incertain doit être flexible et réactive.",
      ],
      repere: () => "Organisation rigide : postes spécialisés, règles stables, hiérarchie forte. Organisation souple : polyvalence, autonomie, ajustement rapide.",
    },
    {
      id: "rigide-ou-souple",
      objectifs: [0],
      type: "tri",
      titre: "Rigide ou souple",
      question: () => "Rangez chaque pratique de travail.",
      categories: [
        { code: "rigide", libelle: "Organisation rigide" },
        { code: "souple", libelle: "Organisation souple" },
      ],
      elements: () => [
        { libelle: "Chaque opérateur ne tient qu'un seul poste, toute l'année", montant: 0, categorie: "rigide", pourquoi: "La spécialisation stricte : efficace, mais fragile quand quelqu'un manque." },
        { libelle: "Toute modification du réglage d'un poste attend l'accord écrit du président", montant: 0, categorie: "rigide", pourquoi: "Des règles et une hiérarchie qui ralentissent la réaction." },
        { libelle: "Les opérateurs changent de poste chaque semaine", montant: 0, categorie: "souple", pourquoi: "La rotation rend chacun polyvalent." },
        { libelle: "L'opérateur de fin de ligne règle aussi lui-même le contrôle du son", montant: 0, categorie: "souple", pourquoi: "On lui confie une tâche plus riche et plus autonome : l'enrichissement des tâches." },
      ],
      relance: "La pratique fige-t-elle chacun dans une tâche et une règle, ou donne-t-elle de la marge pour s'adapter ?",
      explication: () => ["Une organisation rigide est efficace dans un environnement stable ; une organisation souple réagit mieux quand la demande ou l'équipe change. La plupart des organisations combinent les deux."],
    },
    {
      id: "taylor-et-ono",
      type: "lecture",
      titre: "Taylor et Ōno, deux époques",
      texte: () => [
        "Au début du XXe siècle, l'ingénieur américain Frederick Taylor découpe le travail en tâches simples, chronométrées, chacune confiée à un ouvrier spécialisé : c'est l'organisation scientifique du travail, qui fait grimper la productivité des usines.",
        "Après 1950, chez Toyota, Taiichi Ōno organise une production en petites séries, à la demande, avec des ouvriers polyvalents, qui arrêtent la ligne au premier défaut et proposent des améliorations : c'est le toyotisme, d'où vient le lean management. Deux réponses à deux époques et deux marchés.",
      ],
      repere: () => "Taylorisme : spécialisation et parcellisation des tâches. Toyotisme : polyvalence, juste à temps, amélioration continue.",
    },
    {
      id: "taylorisme-ou-toyotisme",
      objectifs: [0],
      type: "tri",
      titre: "Taylorisme ou toyotisme",
      question: () => "Rangez chaque principe selon le modèle d'où il vient.",
      categories: [
        { code: "taylorisme", libelle: "Taylorisme" },
        { code: "toyotisme", libelle: "Toyotisme" },
      ],
      elements: () => [
        { libelle: "Séparer ceux qui conçoivent le travail de ceux qui l'exécutent", montant: 0, categorie: "taylorisme", pourquoi: "Le bureau des méthodes pense, l'ouvrier exécute : le taylorisme." },
        { libelle: "Chronométrer chaque geste pour trouver la seule bonne façon de faire", montant: 0, categorie: "taylorisme", pourquoi: "La recherche de la « meilleure façon » : le taylorisme." },
        { libelle: "Former chaque ouvrier à plusieurs postes", montant: 0, categorie: "toyotisme", pourquoi: "La polyvalence : le toyotisme." },
        { libelle: "Ne produire que ce que le client a commandé, sans stock", montant: 0, categorie: "toyotisme", pourquoi: "Le juste à temps, en flux tendus : le toyotisme." },
      ],
      relance: "Le principe découpe-t-il et spécialise-t-il le travail, ou rend-il l'ouvrier polyvalent et la production plus réactive ?",
      explication: () => ["La spécialisation reste parfois nécessaire ; elle semble devoir être dépassée quand l'environnement devient complexe et changeant."],
    },
    {
      id: "un-jour-sans-operateur",
      objectifs: [1],
      type: "montants",
      titre: "Un jour sans opérateur",
      question: () => {
        const j = jourSansOperateur();
        return `Un poste monte ${qte(j.parJour)} enceintes par jour, à ${eur(j.marge)} de marge chacune. Quand un opérateur manque et que personne ne sait tenir son poste, les ${qte(j.postes)} postes s'arrêtent. Calculez les enceintes perdues dans la journée, puis la marge perdue.`;
      },
      champs: () => {
        const j = jourSansOperateur();
        return [
          { libelle: "Enceintes perdues dans la journée", nature: "quantite", attendu: j.enceintesPerdues, calcul: `${qte(j.parJour)} × ${qte(j.postes)} = ${qte(j.enceintesPerdues)}` },
          { libelle: "Marge perdue dans la journée", attendu: j.margePerdue, calcul: `${qte(j.enceintesPerdues)} × ${eur(j.marge)} = ${eur(j.margePerdue)}` },
        ];
      },
      explication: () => [`Chaque absence non remplacée coûte ${eur(jourSansOperateur().margePerdue)}. Dans l'année, l'équipe compte ${qte(ABSENCES_DE_L_ANNEE)} jours d'absence imprévue.`],
    },
    {
      id: "le-laboratoire-de-la-polyvalence",
      objectifs: [1],
      type: "simulation",
      titre: "Combien de polyvalents ?",
      question: () => {
        const [a, b, d] = JOURS_COUVERTS_PAR_POLYVALENT.map(qte);
        return `Un opérateur formé à tous les postes remplace celui qui manque. Les absences se chevauchent, et un polyvalent peut lui-même manquer : le premier couvre ${a} jours, le deuxième ${b} de plus, le troisième les ${d} qui restent. Former un opérateur coûte ${eur(FORMATION_POLYVALENTE)}. Faites varier le nombre d'opérateurs formés.`;
      },
      leviers: () => [{ code: "polyvalents", libelle: "Opérateurs formés à tous les postes", unite: "opérateurs", min: 0, max: OPERATEURS.nombre, pas: 1, depart: 0 }],
      lecture: (_c, p) => {
        const k = polyvalence(p.polyvalents!);
        return [
          { libelle: "Jours d'absence couverts", montant: k.couverts, unite: "jours" },
          { libelle: "Marge sauvée", montant: k.marge },
          { libelle: "Coût des formations", montant: k.cout },
          { libelle: "Ce que la polyvalence rapporte", montant: k.gain, effet: true, fort: true },
        ];
      },
      defi: () => {
        const juste = polyvalentsQuiRapportentLePlus();
        return {
          consigne: "Trouvez le nombre d'opérateurs à former qui rapporte le plus dans l'année.",
          atteint: (p) => p.polyvalents === juste,
          indice: (p) => `À ${qte(p.polyvalents!)} opérateurs formés, la polyvalence laisse ${eur(polyvalence(p.polyvalents!).gain)}. Un de plus, ou un de moins, ferait-il mieux ?`,
          solution: { polyvalents: juste },
        };
      },
      explication: (_c, p) => {
        const k = polyvalence(p.polyvalents!);
        return [
          `Défi relevé : ${qte(k.k)} opérateurs polyvalents couvrent les ${qte(k.couverts)} jours d'absence et laissent ${eur(k.gain)}. Un de plus ne couvrirait rien de plus et coûterait sa formation.`,
          "La polyvalence rend l'organisation plus flexible, et le travail plus varié : elle sert aussi la performance sociale.",
        ];
      },
    },
    {
      id: "coordonner",
      type: "lecture",
      titre: "Quatre façons de coordonner",
      texte: () => [
        "Plus une organisation grandit, plus ses services se différencient, et plus il faut coordonner leur travail. Le chercheur Henry Mintzberg en distingue plusieurs mécanismes, que l'on peut regrouper en quatre grands modes.",
        "La communication informelle entre ceux qui travaillent ensemble (l'ajustement mutuel) ; un responsable qui donne des ordres et contrôle (la supervision directe) ; des résultats, des normes, des procédures ou des qualifications fixés à l'avance (la standardisation) ; enfin des procédures automatisées.",
      ],
      repere: () => "Ajustement mutuel · supervision directe · standardisation (résultats, procédés, qualifications) · automatisation.",
    },
    {
      id: "les-modes-de-coordination",
      objectifs: [2],
      type: "tri",
      titre: "Reconnaître la coordination",
      question: () => "Rangez chaque situation de NOVA selon son mode de coordination.",
      categories: [
        { code: "ajustement", libelle: "Communication informelle" },
        { code: "supervision", libelle: "Supervision directe" },
        { code: "standardisation", libelle: "Résultats, normes, procédures" },
        { code: "automatisation", libelle: "Procédure automatisée" },
      ],
      elements: () => [
        { libelle: "Deux opérateurs se mettent d'accord d'un mot pour échanger leurs postes", montant: 0, categorie: "ajustement", pourquoi: "Ils se coordonnent entre eux, sans chef ni règle." },
        { libelle: "Le chef d'équipe répartit les tâches du matin et vérifie leur avancement", montant: 0, categorie: "supervision", pourquoi: "Une personne ordonne et contrôle." },
        { libelle: "Une fiche décrit pas à pas le montage d'une enceinte", montant: 0, categorie: "standardisation", pourquoi: "La procédure est fixée à l'avance : la standardisation des procédés." },
        { libelle: `Chaque opérateur doit monter ${qte(OPERATEURS.heuresParMois / OPERATEURS.heuresParEnceinte)} enceintes conformes par mois`, montant: 0, categorie: "standardisation", pourquoi: "On fixe le résultat attendu, pas la façon d'y arriver : la standardisation des résultats." },
        { libelle: "Le PGI lance l'ordre de montage dès que la commande est saisie", montant: 0, categorie: "automatisation", pourquoi: "La coordination passe par une procédure automatique." },
      ],
      relance: "Qui coordonne : les personnes entre elles, un chef, une règle fixée d'avance, ou un système automatique ?",
      explication: () => ["Une petite équipe s'ajuste d'un mot ; une organisation qui grandit ajoute des procédures, des objectifs et des outils. Le mode de coordination suit la taille et la complexité."],
    },
    {
      id: "quand-nova-grandit",
      objectifs: [2],
      type: "choix",
      titre: "Quand NOVA grandit",
      question: () => `NOVA passe de ${qte(OPERATEURS.nombre)} à 12 salariés, avec une deuxième ligne et un service commercial. Comment sa coordination doit-elle évoluer ?`,
      options: () => [
        {
          texte: "Ajouter des procédures et des objectifs à l'ajustement direct",
          juste: true,
          retour: "Oui : à 12, chacun ne peut plus parler à tous. Des procédures communes, des objectifs par équipe et des outils partagés prennent le relais, sans supprimer les échanges directs.",
        },
        {
          texte: "Rien ne change : à 12, chacun peut encore tout régler d'un mot",
          juste: false,
          retour: "Non : plus l'organisation grandit et se différencie, plus la coordination informelle seule s'essouffle.",
        },
        {
          texte: "Le président doit désormais contrôler lui-même chaque tâche",
          juste: false,
          retour: "Non : un seul homme ne peut pas superviser à lui seul les lignes et un service commercial. Il faut d'autres modes de coordination, et déléguer.",
        },
      ],
    },
    {
      id: "centraliser-ou-deleguer",
      objectifs: [3],
      type: "tri",
      titre: "Centraliser ou déléguer",
      question: () => "Rangez chaque organisation du pouvoir de décision.",
      categories: [
        { code: "centralise", libelle: "Pouvoir centralisé" },
        { code: "decentralise", libelle: "Pouvoir décentralisé" },
      ],
      elements: () => [
        { libelle: "Toutes les commandes, même petites, sont acceptées par le président", montant: 0, categorie: "centralise", pourquoi: "Le pouvoir reste au sommet de la ligne hiérarchique." },
        { libelle: "Seul le président peut changer le planning de la ligne", montant: 0, categorie: "centralise", pourquoi: "Aucune autonomie en bas de la hiérarchie." },
        { libelle: "Le chef d'équipe accepte seul les commandes urgentes, et en rend compte chaque semaine", montant: 0, categorie: "decentralise", pourquoi: "Une délégation, contrôlée par un compte rendu (reporting)." },
        { libelle: "Chaque équipe choisit l'ordre de ses tâches pour tenir son objectif", montant: 0, categorie: "decentralise", pourquoi: "Une autonomie accordée tout au long de la ligne hiérarchique." },
      ],
      relance: "La décision se prend-elle au sommet, ou est-elle confiée plus bas, avec un contrôle ?",
      explication: () => ["Décentraliser rend plus réactif et responsabilise ; il faut alors un système de contrôle, le reporting. À côté de ce pouvoir formel, des phénomènes informels existent toujours."],
    },
    {
      id: "le-lean",
      objectifs: [3],
      type: "choix",
      titre: "Le lean management",
      question: () => "NOVA veut adopter le lean management. Qu'est-ce que c'est, et à quoi faut-il veiller ?",
      options: () => [
        {
          texte: "Chasser les gaspillages, sans épuiser l'équipe",
          juste: true,
          retour: "Oui : le lean supprime les gaspillages (attentes, stocks inutiles, défauts, gestes inutiles) avec la participation des salariés. Poussé trop loin, il intensifie le travail : la performance sociale en souffre.",
        },
        {
          texte: "Supprimer des postes pour réduire la masse salariale",
          juste: false,
          retour: "Non : le lean vise les gaspillages, pas les personnes. Ses défenseurs comptent justement sur les salariés pour les trouver.",
        },
        {
          texte: "Revenir à un opérateur par tâche, chronométrée",
          juste: false,
          retour: "Non : c'est le taylorisme. Le lean vient du toyotisme : polyvalence, flux tirés, amélioration continue.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const n = polyvalentsQuiRapportentLePlus();
        return [
          `Chez ${c.entreprise}, une ligne de postes spécialisés s'arrête à chaque absence : former ${qte(n)} opérateurs à tous les postes rapporte ${eur(polyvalence(n).gain)} dans l'année. En grandissant, l'entreprise ajoute des procédures et des objectifs à l'ajustement direct, et délègue avec un compte rendu.`,
          "Dans l'arène, l'effectif et l'organisation se règlent à chaque tour : une équipe plus souple supporte mieux un trimestre difficile.",
        ];
      },
      repere: () => "Spécialisation ou polyvalence · quatre modes de coordination · centralisation ou délégation, avec reporting · lean et performance sociale.",
    },
  ],
};
