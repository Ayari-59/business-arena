import { eur, nombreAuCentieme, qte } from "../../../pedagogy/cours/deux-decimales";
import { DELAI_DE_NOTIFICATION, ENTREPRISES_DES_DONNEES_STRATEGIQUES, INSCRITES, SAUVEGARDE, perteOuSauvegarde } from "../monde/donnees-strategiques-de-maille";
import { HAUT_VERDASSE } from "../monde/haut-verdasse";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : DONNÉES ET ALGORITHMES, LES RESPONSABILITÉS DU NUMÉRIQUE (Bac STMG, management, sciences de
 * gestion et numérique de terminale, enseignement commun, thème 3, question 3.3 : « Les transformations
 * numériques, de nouvelles responsabilités pour les organisations ? »).
 *
 * L'utilisation et la protection des données personnelles (les obligations du responsable du
 * traitement, la violation de données), les données stratégiques, patrimoine à protéger (la sauvegarde
 * chiffrée, face à ce que coûterait leur perte), la transparence des algorithmes quand une administration
 * décide pour une personne, et la chaîne de blocs, qui change la sécurisation des échanges et la
 * médiation des contrats. Le chapitre de première sur les données personnelles faisait appliquer les
 * règles ; celui-ci regarde les responsabilités.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez MAILLE & CO : monde/donnees-strategiques-de-maille.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la perte rapportée à la sauvegarde est une grandeur, à deux
 * décimales, à un centième près (au dixième, avant).
 */


export const DONNEES_ET_ALGORITHMES: Chapitre = {
  code: "donnees-et-algorithmes",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Les organisations et la société"],
  titre: "Données et algorithmes : les responsabilités du numérique",
  accroche:
    "Un fichier de clientes perdu, un tarif négocié qui fuit chez un concurrent, une place refusée par un algorithme sans explication : ce que le numérique oblige les organisations à protéger, à expliquer et à sécuriser.",
  objectifs: [
    "Distinguer données personnelles et données stratégiques",
    "Appliquer les obligations de protection des données personnelles",
    "Chiffrer la protection des données stratégiques",
    "Expliquer l'exigence de transparence des algorithmes publics",
    "Reconnaître ce que change une chaîne de blocs",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_DONNEES_STRATEGIQUES,
    pourquoi: "ce chapitre suit les données de MAILLE & CO : son fichier de clientes, ses prix, ses modèles.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des données à protéger",
      texte: (c) => [
        `${c.entreprise} garde dans son système d'information le fichier de ses ${qte(INSCRITES)} clientes inscrites, les prix négociés avec ses façonniers et les modèles de sa collection d'hiver. Les transformations numériques lui donnent de nouvelles occasions de s'en servir, et de nouvelles responsabilités.`,
        "Les données personnelles appartiennent aux personnes : la loi en protège l'usage. Les données stratégiques appartiennent à l'organisation : c'est un patrimoine, qu'elle doit protéger elle-même.",
      ],
      repere: () => "Donnée personnelle : elle permet d'identifier une personne. Donnée stratégique : son vol ou sa perte nuirait à l'organisation.",
    },
    {
      id: "personnelle-ou-strategique",
      objectifs: [0],
      type: "tri",
      titre: "Personnelle ou stratégique",
      question: (c) => `Rangez chaque donnée de ${c.entreprise}.`,
      categories: [
        { code: "personnelle", libelle: "Donnée personnelle" },
        { code: "strategique", libelle: "Donnée stratégique" },
      ],
      elements: () => [
        { libelle: "L'adresse et la date de naissance d'une cliente", montant: 0, categorie: "personnelle", pourquoi: "Elles identifient une personne." },
        { libelle: "L'historique d'achats d'une cliente nommée", montant: 0, categorie: "personnelle", pourquoi: "Rattaché à une personne, c'est une donnée personnelle." },
        { libelle: "Les prix négociés avec les façonniers", montant: 0, categorie: "strategique", pourquoi: "Un concurrent qui les connaîtrait négocierait mieux : une donnée stratégique." },
        { libelle: "Les dessins de la collection d'hiver, avant sa sortie", montant: 0, categorie: "strategique", pourquoi: "Copiés avant la sortie, ils perdraient leur valeur." },
      ],
      relance: "La donnée identifie-t-elle une personne, ou sa fuite nuirait-elle d'abord à la boutique ?",
      explication: () => ["Le fichier des clientes est les deux à la fois : chaque fiche est une donnée personnelle, et le fichier entier une donnée stratégique."],
    },
    {
      id: "les-obligations",
      objectifs: [1],
      type: "tri",
      titre: "Ce que le règlement impose",
      question: () => "Rangez chaque pratique de la boutique : respecte-t-elle le règlement général sur la protection des données ?",
      categories: [
        { code: "respecte", libelle: "Respecte le règlement" },
        { code: "enfreint", libelle: "L'enfreint" },
      ],
      elements: () => [
        { libelle: "Ne demander que le nom, l'adresse électronique et la taille, pour la carte de fidélité", montant: 0, categorie: "respecte", pourquoi: "Ne collecter que le nécessaire : la minimisation." },
        { libelle: "Effacer la fiche d'une cliente qui n'a rien acheté depuis 3 ans", montant: 0, categorie: "respecte", pourquoi: "Une durée de conservation limitée." },
        { libelle: "Vendre le fichier à une marque de chaussures, sans prévenir les clientes", montant: 0, categorie: "enfreint", pourquoi: "Une autre finalité, sans information ni accord." },
        { libelle: "Laisser le fichier sur un ordinateur sans mot de passe, dans l'arrière-boutique", montant: 0, categorie: "enfreint", pourquoi: "Le responsable du traitement doit assurer la sécurité des données." },
      ],
      relance: "La pratique limite-t-elle et protège-t-elle les données, ou les utilise-t-elle sans accord, sans sécurité ?",
      explication: () => ["La boutique est responsable du traitement : elle doit pouvoir prouver qu'elle respecte ces règles. Les sanctions peuvent atteindre 4 % du chiffre d'affaires mondial, ou 20 millions d'euros."],
    },
    {
      id: "une-violation",
      objectifs: [1],
      type: "choix",
      titre: "Une violation de données",
      question: () => "Un matin, la boutique découvre qu'un pirate a copié le fichier des clientes. Que doit-elle faire ?",
      options: () => [
        {
          texte: `La signaler à la CNIL dans les ${qte(DELAI_DE_NOTIFICATION)} heures, et prévenir les clientes`,
          juste: true,
          retour: `Oui : une violation de données se signale à l'autorité de contrôle dans les ${qte(DELAI_DE_NOTIFICATION)} heures, et les personnes sont prévenues si le risque pour elles est élevé (des tentatives d'escroquerie avec leur adresse, par exemple).`,
        },
        {
          texte: "Ne rien dire, pour ne pas abîmer la réputation de la boutique",
          juste: false,
          retour: "Non : cacher une violation est une faute de plus. Les clientes doivent pouvoir se méfier des messages frauduleux.",
        },
        {
          texte: "Attendre de savoir qui est le pirate avant de faire quoi que ce soit",
          juste: false,
          retour: "Non : le délai court dès que la boutique sait. On signale d'abord, on enquête ensuite.",
        },
      ],
    },
    {
      id: "la-sauvegarde",
      objectifs: [2],
      type: "montants",
      titre: "Ce que vaut une sauvegarde",
      question: () => {
        const p = perteOuSauvegarde();
        return `Sans sauvegarde, une panne de l'ordinateur ferait perdre les données stratégiques : ${qte(p.heures)} heures de travail pour les reconstituer en partie, à ${eur(p.coutHoraire)} de l'heure, et la campagne de la collection, qui laisse ${eur(p.campagnePerdue)} de marge, ne partirait pas. Une sauvegarde externe et chiffrée coûte ${eur(SAUVEGARDE.parMois)} par mois. Calculez ce que coûterait la perte, le coût de la sauvegarde sur un an, puis combien de fois la perte dépasse ce coût (au centième).`;
      },
      champs: () => {
        const p = perteOuSauvegarde();
        return [
          { libelle: "Ce que coûterait la perte", attendu: p.perte, calcul: `${qte(p.heures)} × ${eur(p.coutHoraire)} + ${eur(p.campagnePerdue)} = ${eur(p.perte)}` },
          { libelle: "Coût de la sauvegarde sur un an", attendu: p.sauvegarde, calcul: `${eur(SAUVEGARDE.parMois)} × 12 = ${eur(p.sauvegarde)}` },
          { libelle: "La perte, en nombre d'années de sauvegarde", nature: "grandeur", attendu: p.rapport, calcul: `${eur(p.perte)} ÷ ${eur(p.sauvegarde)} = ${nombreAuCentieme(p.rapport)}` },
        ];
      },
      explication: () => {
        const p = perteOuSauvegarde();
        return [`Une seule perte coûterait ${qte(p.rapport)} années de sauvegarde. Protéger ses données stratégiques n'est pas une dépense de confort : c'est protéger son patrimoine.`];
      },
    },
    {
      id: "proteger",
      objectifs: [2],
      type: "tri",
      titre: "Empêcher l'accès, ou pouvoir retrouver",
      question: () => "Rangez chaque mesure de protection.",
      categories: [
        { code: "acces", libelle: "Empêcher qu'on y accède" },
        { code: "retrouver", libelle: "Pouvoir les retrouver" },
      ],
      elements: () => [
        { libelle: "Un mot de passe propre à chaque vendeuse", montant: 0, categorie: "acces", pourquoi: "Chacune n'accède qu'à ce dont elle a besoin." },
        { libelle: "Le chiffrement des ordinateurs portables", montant: 0, categorie: "acces", pourquoi: "Volé, l'ordinateur ne livre rien." },
        { libelle: "Une sauvegarde chaque nuit, gardée hors de la boutique", montant: 0, categorie: "retrouver", pourquoi: "Après une panne, un vol ou un incendie, les données reviennent." },
        { libelle: "Un essai de restauration de la sauvegarde chaque trimestre", montant: 0, categorie: "retrouver", pourquoi: "Une sauvegarde qu'on n'a jamais restaurée n'est pas sûre." },
      ],
      relance: "La mesure empêche-t-elle un intrus d'y accéder, ou permet-elle de récupérer les données perdues ?",
      explication: () => ["Une protection complète fait les deux : la confidentialité des données et leur disponibilité."],
    },
    {
      id: "les-algorithmes",
      type: "lecture",
      titre: "La transparence des algorithmes",
      texte: () => [
        `La ${HAUT_VERDASSE.nom} reçoit plus de demandes que de places pour ses stages de natation de l'été. Un algorithme les classe : âge, commune, demande déjà faite l'an dernier.`,
        "Quand une administration prend une décision individuelle à l'aide d'un algorithme, elle doit le dire, et expliquer à la personne qui le demande les règles appliquées et leur poids dans sa décision. Les citoyens doivent pouvoir comprendre, et contester.",
      ],
      repere: () => "Décision administrative fondée sur un algorithme : une mention explicite, et le droit d'en connaître les règles.",
    },
    {
      id: "expliquer-l-algorithme",
      objectifs: [3],
      type: "choix",
      titre: "Une place refusée",
      question: () => "Une famille voit sa demande de stage refusée et demande pourquoi. Que doit faire la communauté ?",
      options: () => [
        {
          texte: "Lui expliquer les critères appliqués à sa demande",
          juste: true,
          retour: "Oui : la transparence des algorithmes l'oblige à communiquer les règles et la façon dont elles ont joué pour cette famille. Elle peut ensuite contester, si une règle a été mal appliquée.",
        },
        {
          texte: "Répondre que l'algorithme est secret, comme ceux des entreprises",
          juste: false,
          retour: "Non : une administration qui décide pour un citoyen ne peut pas cacher ses règles derrière un logiciel.",
        },
        {
          texte: "Lui dire que la décision a été prise par l'ordinateur, sans personne derrière",
          juste: false,
          retour: "Non : la décision reste celle de l'administration, qui en répond. L'algorithme n'est qu'un outil.",
        },
      ],
    },
    {
      id: "la-chaine-de-blocs",
      type: "lecture",
      titre: "La chaîne de blocs",
      texte: (c) => [
        "Une chaîne de blocs (blockchain) est un registre partagé entre de nombreux ordinateurs : chaque échange y est inscrit, horodaté, lié au précédent, et ne peut plus être modifié sans que tous le voient. Elle sécurise des échanges sans passer par un tiers de confiance.",
        `${c.entreprise} pourrait y inscrire chaque étape de sa laine, de l'élevage à la boutique : la cliente vérifierait elle-même son origine. Des contrats peuvent aussi s'y exécuter seuls, à une condition donnée (un paiement libéré à la livraison) : la médiation des contrats change.`,
      ],
      repere: () => "Chaîne de blocs : un registre partagé, horodaté, infalsifiable, qui sécurise les échanges sans tiers de confiance.",
    },
    {
      id: "ce-que-change-la-chaine",
      objectifs: [4],
      type: "choix",
      titre: "Ce que change la chaîne de blocs",
      question: () => "Pourquoi la traçabilité de la laine sur une chaîne de blocs inspirerait-elle plus confiance qu'une étiquette « laine d'ici » ?",
      options: () => [
        {
          texte: "Personne ne peut modifier seul ce qui y est inscrit",
          juste: true,
          retour: "Oui : chaque étape est inscrite par celui qui la fait et partagée par tous ; la boutique ne pourrait pas la réécrire après coup. Encore faut-il que ce qui y est inscrit soit vrai au départ.",
        },
        {
          texte: "Elle rend la laine plus chaude et plus solide",
          juste: false,
          retour: "Non : elle ne change rien au produit, seulement à la confiance dans l'information sur le produit.",
        },
        {
          texte: "Elle est gérée par la boutique seule, qui la contrôle entièrement",
          juste: false,
          retour: "Non : c'est l'inverse. Sa force est d'être partagée, sans qu'un seul acteur la contrôle.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const p = perteOuSauvegarde();
        return [
          `${c.entreprise} est responsable des données de ses clientes : elle les limite, les sécurise et signale toute violation. Elle protège aussi ses données stratégiques : une perte coûterait ${eur(p.perte)}, ${qte(p.rapport)} années de sauvegarde. Une administration doit expliquer ses algorithmes ; une chaîne de blocs sécurise les échanges sans tiers.`,
          "Dans l'arène, les données de vos tours s'accumulent : elles disent beaucoup de votre stratégie, à ne montrer qu'à votre équipe.",
        ];
      },
      repere: () => "Protéger les données personnelles (règlement, sécurité, violation) · protéger les données stratégiques (accès, sauvegarde) · expliquer les algorithmes publics · chaîne de blocs.",
    },
  ],
};
