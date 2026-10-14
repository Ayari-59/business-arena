/**
 * LES FACTURES QUI DORMENT — le contenu de l'épisode.
 *
 * Évrard Valdenaire est responsable du crédit clients et de la facturation
 * d'Atlas Conseil, au siège de Nantes. En un an, le DSO est passé de 75 à
 * 96 jours, et la Banque de l'Erdre s'inquiète. Tout le monde attend de lui
 * qu'il relance les clients et qu'il obtienne plus de découvert ; l'argent,
 * lui, dort surtout avant la facture : jalons franchis que personne ne
 * déclenche, temps de régie non validés, factures publiques rejetées par le
 * portail faute de numéro d'engagement. Six décisions, d'octobre à décembre,
 * chacune précédée de ce qu'un responsable de la facturation reçoit vraiment.
 *
 * Les chiffres des sources viennent des constantes du modèle : ce que le
 * joueur lit est ce que le trimestre fera. Les sources portent leur NATURE —
 * décisive, utile, bruit, aide — que le joueur ne voit pas : c'est le bilan
 * qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  AUTORISATION,
  AUTORISATION_REDUITE,
  CA_ANNUEL,
  CA_JOUR,
  COMMISSION_AFFACTURAGE,
  COMMISSION_DECOUVERT,
  COMMISSION_FACILITE,
  CONTESTEES_0,
  CORRECTION_ACTIVE,
  CREANCES_0,
  DSO_0,
  DSO_AN_DERNIER,
  ECHUES_PRIVEES_0,
  EN_RETARD_0,
  FACTURE_FORFAITS,
  FACTURES_REJETEES_0,
  FRAIS_AFFACTURAGE,
  FRAIS_AVOCAT,
  FRAIS_ETUDE,
  JALONS_0,
  JOURS_REGIE_0,
  OLLIVRO,
  OLLIVRO_CONFORME,
  OLLIVRO_HORS_PERIMETRE,
  MAJORATION,
  MARGE_PHASE3,
  MISSIONS_FORFAIT,
  NOMBRE_JALONS,
  NON_ECHUES_PRIVEES_0,
  PUBLIQUES_ECHUES_0,
  PUBLIQUES_VALIDES_0,
  RALLONGE,
  RALLONGE_S1,
  REJETEES_0,
  SEUIL_CONFIANCE,
  SEUIL_DOUTE,
  TAUX_DECOUVERT,
  TAUX_REJET,
  TAUX_REJET_CONTROLE,
  TJM_REGIE,
  VALEUR_REALISEE,
  VRAIMENT_ECHUES_0,
} from "@/engine/episodes/factures-qui-dorment";
import { euros, kE, nombre, taux } from "./format";
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "avantFacture",
    t: "La trésorerie dort avant la facture : jalons franchis non déclenchés, régie non facturée, factures publiques rejetées. Il faut facturer juste et à temps avant de relancer",
  },
  {
    id: "rejets",
    t: "Les factures publiques rejetées par le portail bloquent les paiements des clients publics",
  },
  {
    id: "retards",
    t: "Les clients paient de plus en plus tard : il faut relancer plus tôt et plus fort",
  },
  {
    id: "financement",
    t: "Le cabinet grandit plus vite que ses financements : il lui faut une ligne de crédit plus large",
  },
] as const;

export const GUSTAVE = {
  de: "Gustave Herbelin",
  role: "Directeur administratif et financier",
} as const;
export const ASSITA = { de: "Assita Ouattara", role: "Chargée de facturation" } as const;
export const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
export const HERLE = {
  de: "Herlé Salaün",
  role: "Directeur de mission, practice Organisation et transformation",
} as const;
export const ELIANE = {
  de: "Éliane Vandaele",
  role: "Directrice de mission, practice Performance opérationnelle",
} as const;
export const VICTOIRE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" } as const;
export const PAOL = {
  de: "Paol Thomin",
  role: "Associé, practice Performance opérationnelle",
} as const;
export const KRISTEN = {
  de: "Kristen Cariou",
  role: "Chargé d'affaires entreprises, Banque de l'Erdre",
} as const;
export const NIKOLAI = {
  de: "Nikolaï Peschard",
  role: "Directeur administratif et financier, Ollivro Agroalimentaire",
} as const;
export const LOUISON = {
  de: "Louison Fradin",
  role: "Responsable du service facturier, centre hospitalier de Pornevaux",
} as const;
export const FELICITE = {
  de: "Félicité Arzel",
  role: "Chargée d'affaires, Erdre Affacturage",
} as const;

/** L'en-cours des forfaits : travaux réalisés moins factures émises. */
export const EN_COURS_FORFAITS = VALEUR_REALISEE - FACTURE_FORFAITS;
/** Les commissions de la banque, en euros. */
export const COUT_DECOUVERT = RALLONGE * COMMISSION_DECOUVERT;
export const COUT_FACILITE = RALLONGE * COMMISSION_FACILITE;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le DSO à 96 jours",
    jusqua: 2,
    messages: () => [
      {
        ...KRISTEN,
        heure: "08:10",
        alerte: true,
        texte: `Monsieur Valdenaire, votre DSO est passé de ${DSO_AN_DERNIER} à ${nombre(DSO_0, 0)} jours en un an, et votre découvert frôle l'autorisation de ${kE(AUTORISATION)}. Notre comité revoit votre ligne à son échéance, le 1er décembre. J'aimerais comprendre ce qui se passe.`,
      },
      {
        ...GUSTAVE,
        heure: "08:45",
        texte:
          "Évrard, la banque me met la pression, Victoire aussi. On a d'octobre à décembre pour montrer que la trésorerie revient, et décembre, avec la prime de fin d'année, est notre mois le plus lourd. Dis-moi vendredi par où tu commences.",
      },
      {
        ...VICTOIRE,
        heure: "09:30",
        texte:
          "Il faut relancer tout le monde, et fort. Et demander une rallonge à la banque, ça ne coûte rien de demander.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "encours",
        titre: "Extraire de Tempora l'en-cours des missions au 30 septembre",
        cout: 1,
        nature: "decisive",
        resultat: `${MISSIONS_FORFAIT} missions au forfait en cours : ${kE(VALEUR_REALISEE)} de travaux réalisés (avancement validé × prix), pour ${kE(FACTURE_FORFAITS)} facturés. Parmi ces travaux, ${NOMBRE_JALONS} jalons sont franchis, livrable validé en comité de pilotage, sans que le directeur de mission ait déclenché la facture : ${kE(JALONS_0)}. Le reste attend le prochain jalon. En régie, ${nombre(JOURS_REGIE_0, 0)} jours réalisés en août et en septembre ne sont pas facturés, faute de temps validés dans Tempora ; le TJM moyen des missions en régie est de ${euros(TJM_REGIE)}.`,
      },
      {
        id: "balance",
        titre: "Décomposer la balance âgée des clients",
        cout: 1,
        nature: "decisive",
        resultat: `${kE(CREANCES_0)} de créances hors taxes, pour ${nombre(CA_ANNUEL / 1e6, 0)} M€ de chiffre d'affaires hors taxes, soit ${kE(CA_JOUR)} par jour : ${nombre(DSO_0, 0)} jours. Non échues : ${kE(NON_ECHUES_PRIVEES_0)} chez les clients privés, ${kE(PUBLIQUES_VALIDES_0 - PUBLIQUES_ECHUES_0)} chez les clients publics. La liste des « clients en retard » additionne ${kE(EN_RETARD_0)} ; mais ${kE(REJETEES_0)} sont ${FACTURES_REJETEES_0} factures publiques rejetées par le portail, que l'acheteur n'a jamais reçues, et ${kE(CONTESTEES_0)} sont des factures contestées, livrable non validé ou avenant non signé. Restent ${kE(VRAIMENT_ECHUES_0)} vraiment échues et non contestées : ${kE(ECHUES_PRIVEES_0)} chez les privés, ${kE(PUBLIQUES_ECHUES_0)} chez les publics.`,
      },
      {
        id: "concurrents",
        titre: "Comparer avec le DSO des concurrents",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Halden Partners publie un DSO de 68 jours, Kéroual Consulting de 81. Les cabinets qui travaillent beaucoup avec le secteur public sont tous au-dessus de 80 jours.",
      },
      {
        id: "portail",
        titre: "Lire les motifs de rejet du portail public de facturation",
        cout: 0.5,
        nature: "utile",
        resultat: `Une facture publique sur cinq est rejetée, ${taux(TAUX_REJET, 0)} sur les six derniers mois : presque toujours un numéro d'engagement absent, parfois un code service erroné. Une facture rejetée n'est pas reçue : le délai de paiement, 30 jours pour une collectivité, 50 pour un hôpital, ne court qu'à compter d'un dépôt conforme.`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Gustave",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Gustave : « Avant de relancer qui que ce soit, regarde ce qu'on n'a pas encore facturé, et ce que nos clients ne peuvent pas payer en l'état. On ne relance pas une facture qui n'existe pas. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Par où commencez-vous ?",
    options: [
      {
        t: "Lancer une campagne de relance de tous les clients en retard",
        d: `Courriels, appels et lettres sur les ${kE(EN_RETARD_0)} de la liste. Les trois chargées de facturation y passent le mois.`,
      },
      {
        t: "Réunir chaque directeur de mission pour une revue des en-cours : déclencher les jalons franchis, faire valider les temps de régie, facturer",
        d: "Deux semaines de revues, practice par practice. Les premières factures partent en semaine 2.",
      },
      {
        t: "Poursuivre les relances habituelles des factures échues depuis plus de 60 jours",
        d: "Rien ne change dans l'organisation ; les relances suivent l'ancienneté de la balance.",
      },
      {
        t: `Demander à la Banque de l'Erdre un découvert supplémentaire de ${kE(RALLONGE)}`,
        d: `${euros(FRAIS_ETUDE)} de frais d'étude. La banque répond sous huit jours.`,
      },
    ],
    reactions: [
      [
        {
          ...ASSITA,
          texte:
            "La campagne est partie : 212 clients relancés. Les premiers rappels du centre hospitalier de Pornevaux disent qu'ils n'ont aucune facture valide de notre part.",
        },
      ],
      [
        {
          ...HERLE,
          texte:
            "J'avais six jalons validés en comité de pilotage que je n'avais pas déclenchés. Je ne savais pas que ça pesait autant. Les factures partent.",
        },
      ],
      [{ ...ASSITA, texte: "On continue comme d'habitude, par ancienneté." }],
      null,
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le portail rejette encore",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: "Portail public de facturation",
        role: "Notification de rejet",
        heure: "07:40",
        alerte: true,
        texte:
          "Facture n° AC-2410-0187 rejetée par le destinataire, centre hospitalier de Pornevaux. Motif : numéro d'engagement juridique absent.",
      },
      {
        ...ASSITA,
        heure: "09:15",
        texte: `Trois rejets de plus cette semaine. ${ctx.rejetees} de factures publiques sont rejetées et en attente. Personne n'a le temps de les reprendre.`,
      },
      {
        ...LOUISON,
        heure: "11:30",
        texte:
          "Nous ne pouvons mettre en paiement que des factures déposées avec le numéro d'engagement figurant sur notre bon de commande. Sans lui, la facture n'existe pas pour notre comptable public.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "rejets",
        titre: "Reprendre une à une les factures rejetées",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les numéros d'engagement figurent sur les bons de commande des acheteurs ; les directeurs de mission les ont souvent dans leur messagerie. Une personne à plein temps peut corriger et redéposer environ ${taux(CORRECTION_ACTIVE, 0)} du stock chaque semaine. Mais tant que Tempora laisse partir une facture publique sans numéro d'engagement, ${taux(TAUX_REJET, 0)} des nouvelles factures publiques reviendront ; avec le champ rendu obligatoire avant émission, les clients qui l'ont fait n'ont plus que ${taux(TAUX_REJET_CONTROLE, 0)} de rejets.`,
      },
      {
        id: "moratoires",
        titre: "Vérifier les droits d'Atlas en cas de retard public",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un acheteur public qui paie au-delà du délai légal doit de plein droit des intérêts moratoires, au taux de la Banque centrale européenne majoré de huit points, et une indemnité forfaitaire de 40 € par facture. Mais le délai ne court que pour une facture conforme reçue : une facture rejetée ne donne droit à rien.",
      },
    ],
    question: "Que faites-vous des factures publiques ?",
    options: [
      {
        t: "Mettre en demeure les acheteurs publics de payer les factures en retard",
        d: "Lettres recommandées signées de la direction financière, avec rappel des intérêts moratoires.",
      },
      {
        t: "Obtenir de chaque acheteur le numéro d'engagement manquant, corriger et redéposer, et rendre ce numéro obligatoire dans Tempora avant toute facture publique",
        d: "Assita s'y consacre à plein temps ; le paramétrage de Tempora prend deux jours.",
      },
      {
        t: "Corriger et redéposer une à une les factures rejetées",
        d: "Assita s'y consacre à plein temps ; rien ne change à l'émission.",
      },
      {
        t: "Laisser faire : les clients publics finissent toujours par payer",
        d: "Aucun coût. Les rejets sont repris quand quelqu'un a le temps.",
      },
    ],
    reactions: [
      [
        {
          ...LOUISON,
          texte:
            "Nous avons bien reçu votre mise en demeure. Je vous rappelle que nous n'avons reçu aucune facture conforme : il n'y a donc aucun retard de notre part.",
        },
      ],
      [
        {
          ...ASSITA,
          texte:
            "Tempora bloque désormais toute facture publique sans numéro d'engagement ni code service. Et j'ai déjà récupéré onze numéros auprès des acheteurs.",
        },
      ],
      [{ ...ASSITA, texte: "Je reprends les rejets un par un, en commençant par les plus gros." }],
      [
        {
          ...ASSITA,
          texte: "D'accord. Je les reprendrai quand la facturation de fin de mois sera passée.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les jalons glissent encore",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...PRUNE,
        heure: "08:30",
        alerte: true,
        texte: `Point des en-cours à fin octobre : ${ctx.jalons} de jalons franchis et non facturés, ${ctx.regie} de régie sans temps validés. Trois directeurs de mission n'ont rien déclenché depuis la rentrée.`,
      },
      {
        ...ELIANE,
        heure: "10:05",
        texte:
          "Je ne déclenche pas un jalon avant d'avoir le procès-verbal signé. Et je préfère facturer après le comité de pilotage suivant : envoyer une facture au milieu d'une mission tendue, c'est la braquer.",
      },
      {
        ...VICTOIRE,
        heure: "12:00",
        texte:
          "Le comité de direction veut une règle, mardi. Qu'est-ce que je propose aux associés ?",
      },
    ],
    sources: [
      {
        id: "jalons",
        titre: "Comprendre pourquoi les jalons ne partent pas",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Neuf directeurs de mission interrogés : ils attendent un procès-verbal formel que le client ne signe jamais, ils craignent de froisser avant le comité suivant, et rien dans leurs objectifs ne parle de facturation. Sur deux ans, les jalons déclenchés à la date du comité de pilotage qui valide le livrable ont été payés sans litige 97 fois sur 100. Ceux qu'on a facturés à la date du calendrier contractuel, livrable non validé, ont été contestés une fois sur quatre.",
      },
      {
        id: "note",
        titre: "Relire l'effet de la note de l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'an dernier, une note de la présidente sur le même sujet a fait baisser les jalons en attente pendant trois semaines. Ils étaient revenus à leur niveau un mois plus tard.",
      },
      {
        id: "halden",
        titre: "Regarder comment facture Halden Partners",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Halden Partners facture ses forfaits chaque mois à l'avancement, et ses clients l'acceptent : ce sont surtout de grands groupes privés.",
      },
    ],
    question: "Que proposez-vous au comité de direction ?",
    options: [
      {
        t: "Une note de la présidente qui rappelle aux directeurs de mission de déclencher leurs jalons",
        d: "Une note à toutes les practices. Aucun coût.",
      },
      {
        t: "Déclencher le jalon dans Tempora à la date du comité de pilotage qui valide le livrable, sauf opposition motivée ; valider les temps de régie chaque vendredi ; revoir chaque mois les en-cours avec chaque practice",
        d: "Une règle et une revue mensuelle ; les directeurs de mission perdent la main sur la date de facturation.",
      },
      {
        t: "Facturer d'office chaque jalon à la date prévue au contrat, livrable validé ou non",
        d: "Tempora émet les factures automatiquement selon le calendrier contractuel.",
      },
      {
        t: "Ne rien changer : les directeurs de mission savent que c'est important",
        d: "Aucun coût, aucune règle de plus.",
      },
    ],
    reactions: [
      [{ ...ELIANE, texte: "Bien reçu la note. On fera au mieux." }],
      [
        {
          ...HERLE,
          texte:
            "Au début, ça grince. Mais le jalon part le soir du comité de pilotage, et le client a validé le livrable le matin même : personne ne conteste.",
        },
      ],
      [
        {
          ...ELIANE,
          texte:
            "Deux de mes clients ont reçu une facture pour un livrable qu'ils n'ont pas encore vu. L'un d'eux m'a appelée, furieux.",
        },
      ],
      [{ ...VICTOIRE, texte: "Je dirai aux associés qu'on garde l'organisation actuelle." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Ollivro conteste 240 k€",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...NIKOLAI,
        heure: "09:00",
        alerte: true,
        texte: `Nous contestons votre facture de ${kE(OLLIVRO)} de la phase 2. Une partie des travaux porte sur notre second site, qui ne figurait pas au contrat. Nous ne réglerons rien tant que ce point n'est pas éclairci.${ctx.relance ? " Et je n'ai pas apprécié d'être relancé en octobre sur une facture que mon directeur industriel vous avait déjà signalée." : ""}`,
      },
      {
        ...PAOL,
        heure: "10:40",
        texte:
          "Le directeur industriel nous a demandé d'étendre le diagnostic au second site, oralement. On l'a fait sans avenant. Je ne veux pas perdre la phase 3.",
      },
      {
        ...GUSTAVE,
        heure: "11:15",
        texte: "Encore une facture qui ne rentrera pas. Il faut taper fort, non ?",
      },
    ],
    sources: [
      {
        id: "contrat",
        titre: "Relire le contrat, les comptes rendus et l'historique des litiges",
        cout: 0.5,
        nature: "decisive",
        resultat: `Sur les ${kE(OLLIVRO)}, ${kE(OLLIVRO_CONFORME)} correspondent exactement au périmètre du contrat, livrable présenté en comité de pilotage ; ${kE(OLLIVRO_HORS_PERIMETRE)} correspondent à l'extension au second site, demandée par courriel du directeur industriel, sans avenant. Sur les litiges de ce type, un comité de pilotage avec l'associé a fait signer l'avenant deux fois sur trois ; quand il échoue, le client met la suite de la mission en concurrence. Un client déjà relancé sur une facture qu'il conteste ne signe plus que trois fois sur dix.`,
      },
      {
        id: "phase3",
        titre: "Faire le point sur la phase 3 avec Paol",
        cout: 0.5,
        nature: "utile",
        resultat: `La phase 3, le déploiement sur les deux sites, représente 400 k€ d'honoraires et ${kE(MARGE_PHASE3)} de marge sur coûts directs. Kéroual Consulting a été reçu par le directeur industriel le mois dernier.`,
      },
      {
        id: "injonction",
        titre: "Demander à l'avocat ce que vaut une injonction de payer",
        cout: 0.5,
        nature: "utile",
        resultat: `L'ordonnance s'obtient en quelques semaines, mais le débiteur peut former opposition dans le mois : on repart alors pour une procédure au fond, douze à dix-huit mois. Honoraires : ${euros(FRAIS_AVOCAT)} pour commencer.`,
      },
    ],
    question: "Que faites-vous de la facture de Ollivro ?",
    options: [
      {
        t: "Mettre Ollivro en demeure de payer sous huit jours, puis demander une injonction de payer",
        d: `${euros(FRAIS_AVOCAT)} d'avocat. Le dossier part au tribunal de commerce.`,
      },
      {
        t: "Réunir avec Paol un comité de pilotage : faire valider le livrable, régulariser l'extension par un avenant, refacturer",
        d: `Une demi-journée chez Ollivro. Si l'avenant est signé, les ${kE(OLLIVRO)} sont dus.`,
      },
      {
        t: `Émettre un avoir de ${kE(OLLIVRO_HORS_PERIMETRE)} sur l'extension et refacturer les ${kE(OLLIVRO_CONFORME)} conformes`,
        d: `${kE(OLLIVRO_HORS_PERIMETRE)} abandonnés ; les ${kE(OLLIVRO_CONFORME)} sont payables tout de suite.`,
      },
      {
        t: "Attendre que Ollivro revienne vers nous",
        d: "Aucun coût. Le litige reste ouvert.",
      },
    ],
    reactions: [
      [
        {
          ...PAOL,
          texte:
            "Le directeur industriel m'a appelé : il a reçu la mise en demeure en pleine réunion avec Kéroual Consulting. Je te laisse imaginer.",
        },
      ],
      [
        {
          ...PAOL,
          texte:
            "Comité de pilotage fixé mardi chez Ollivro. Je présente le livrable et l'avenant.",
        },
      ],
      [
        {
          ...NIKOLAI,
          texte: `Merci pour l'avoir. La facture de ${kE(OLLIVRO_CONFORME)} sera réglée à l'échéance.`,
        },
      ],
      [{ ...PAOL, texte: "D'accord. Je laisse passer quelques semaines avant d'en reparler." }],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le comité de crédit de la banque",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...KRISTEN,
        heure: "08:20",
        alerte: true,
        texte: `Comme annoncé, notre comité ramène votre autorisation de ${kE(AUTORISATION)} à ${kE(AUTORISATION_REDUITE)} à son échéance du 1er décembre. Si vous avez besoin de plus pour décembre, il me faut votre demande lundi.`,
      },
      {
        ...PRUNE,
        heure: "09:45",
        texte: `Ma prévision de trésorerie : au pic de la semaine 12, prime de fin d'année et échéances sociales et fiscales, le solde descendrait à ${ctx.picPrevu}. Avec une ligne de ${kE(AUTORISATION_REDUITE)}, il manquerait ${ctx.besoin}.`,
      },
      {
        ...FELICITE,
        heure: "14:00",
        texte:
          "Erdre Affacturage peut reprendre votre poste clients privé en trois semaines : financement immédiat, sans dépendre du comité de crédit.",
      },
    ],
    sources: [
      {
        id: "prevision",
        titre: "Relire la prévision de trésorerie avec Prune",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Au pic, le solde descendrait à ${ctx.picPrevu} : au-delà de la ligne, la banque rejette les prélèvements, et les échéances de l'URSSAF et de la TVA payées en retard sont majorées de ${taux(MAJORATION, 0)}. Les intérêts du découvert courent à ${taux(TAUX_DECOUVERT)} l'an.`,
      },
      {
        id: "comite",
        titre: "Demander à Kristen ce que regarde son comité de crédit",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `« Nous prêtons sur un échéancier crédible : des factures émises, acceptées, non contestées. Je regarde ce qui dort encore sans facture valide : en-cours non facturé, factures rejetées, factures contestées. Chez vous, aujourd'hui : ${ctx.endormi}. Sous ${kE(SEUIL_CONFIANCE)}, une facilité de caisse appuyée sur l'échéancier passe plus de huit fois sur dix ; jusqu'à ${kE(SEUIL_DOUTE)}, une fois sur deux ; au-delà, une fois sur quatre. Un découvert supplémentaire demandé sans dossier, c'est une fois sur trois au mieux${ctx.dejaSollicitee ? ", et votre demande d'octobre pèse déjà dans le dossier" : ""}. »`,
      },
      {
        id: "factor",
        titre: "Étudier l'offre d'Erdre Affacturage",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Affacturage avec recours du poste clients privé, aujourd'hui ${ctx.prive}. ${kE(FRAIS_AFFACTURAGE)} de frais de mise en place, une commission d'affacturage de ${taux(COMMISSION_AFFACTURAGE)} des créances cédées, puis des nouvelles factures, et un financement un point au-dessus du découvert. Le factor avance 85 % des factures approuvées ; il ne finance ni les factures contestées ni les factures publiques. Les créances cédées avec recours restent au bilan : l'affacturage finance le creux, il n'encaisse rien.`,
      },
    ],
    question: "Comment passez-vous décembre ?",
    options: [
      {
        t: `Demander un découvert supplémentaire de ${kE(RALLONGE)} jusqu'à fin janvier`,
        d: `Commission d'engagement de ${taux(COMMISSION_DECOUVERT)}, ${kE(COUT_DECOUVERT)}, si la banque accepte.`,
      },
      {
        t: "Mettre en place l'affacturage du poste clients privé avec Erdre Affacturage",
        d: `${kE(FRAIS_AFFACTURAGE)} de frais, ${taux(COMMISSION_AFFACTURAGE)} des créances cédées, un financement un point plus cher. Opérationnel en semaine 11.`,
      },
      {
        t: `Présenter au comité l'échéancier de facturation et d'encaissement, et demander une facilité de caisse de ${kE(RALLONGE)} pour décembre`,
        d: `Commission de ${taux(COMMISSION_FACILITE)}, ${kE(COUT_FACILITE)}, si la banque accepte. Réponse en semaine 9.`,
      },
      {
        t: "Ne rien demander : passer décembre avec la ligne actuelle",
        d: "Aucuns frais.",
      },
    ],
    reactions: [
      [{ ...KRISTEN, texte: "Votre demande part au comité de mercredi. Je vous appelle jeudi." }],
      [
        {
          ...FELICITE,
          texte:
            "Contrat signé. Nous auditons votre poste clients et notifions vos clients privés : le financement sera disponible en semaine 11.",
        },
      ],
      [
        {
          ...KRISTEN,
          texte:
            "Merci pour l'échéancier, c'est exactement ce que le comité demande. Il se réunit mercredi.",
        },
      ],
      [{ ...GUSTAVE, texte: "J'espère que la prévision de Prune est pessimiste." }],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Avant la clôture de décembre",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...LOUISON,
        heure: "08:50",
        alerte: true,
        texte:
          "Pour mémoire : nos derniers mandatements de l'année partent le 12 décembre. Une facture déposée après sera payée fin janvier au plus tôt.",
      },
      {
        ...VICTOIRE,
        heure: "09:30",
        texte:
          "Avant les congés, tout le monde au téléphone : on relance tous les clients en retard. C'est maintenant ou en février.",
      },
      {
        ...PRUNE,
        heure: "10:15",
        texte: `Ce qui pourrait encore partir avant la clôture : ${ctx.jalons} de jalons franchis, ${ctx.regie} de régie réalisée. Factures publiques rejetées en attente : ${ctx.rejetees}.`,
      },
    ],
    sources: [
      {
        id: "cloture",
        titre: "Recenser ce qui peut être facturé et mandaté avant le 12 décembre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Les services financiers de la plupart de nos clients publics arrêtent leurs mandatements vers le 12 décembre ; une facture conforme déposée avant est payée en décembre, après, fin janvier ou février. Sont facturables tout de suite : ${ctx.jalons} de jalons franchis et ${ctx.regie} de régie dont les temps peuvent être validés. Les factures privées émises maintenant, payables à 60 jours, ne rentreront qu'en février.`,
      },
      {
        id: "retards",
        titre: "Trier la liste des clients en retard",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Factures privées échues et non contestées : ${ctx.echues} ; les vingt plus gros encours en font les trois quarts. Le reste de la liste, ce sont des factures contestées (${ctx.contestees}) et des factures publiques rejetées (${ctx.rejetees}) : les relancer ne fera rien rentrer.`,
      },
    ],
    question: "Que faites-vous avant la clôture ?",
    options: [
      {
        t: "Relancer tous les clients en retard avant les congés",
        d: "Dix jours d'appels et de courriels, toute l'équipe de facturation.",
      },
      {
        t: "Avant le 12 décembre, facturer les jalons franchis et la régie réalisée, déposer des factures publiques complètes, et relancer les seules factures échues et non contestées",
        d: "Une revue express avec les directeurs de mission ; Assita contrôle chaque dépôt.",
      },
      {
        t: "Relancer par téléphone les vingt plus gros encours échus",
        d: "Évrard et Gustave appellent eux-mêmes les directeurs financiers.",
      },
      {
        t: "Ne rien changer d'ici la clôture",
        d: "Les factures partent au rythme habituel.",
      },
    ],
    reactions: [
      [
        {
          ...ELIANE,
          texte:
            "Un de mes clients m'a transféré votre relance : la facture est échue le 31 décembre. Il me demande si le cabinet a des difficultés.",
        },
      ],
      [
        {
          ...ASSITA,
          texte:
            "Toutes les factures publiques sont parties avec leur numéro d'engagement avant le 12. Et les relances ne visent que des factures dues.",
        },
      ],
      [
        {
          ...GUSTAVE,
          texte:
            "Quinze directeurs financiers appelés. La plupart promettent un virement avant Noël.",
        },
      ],
      [
        {
          ...ASSITA,
          texte: "Rien de particulier : la facturation de décembre partira comme d'habitude.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Facturer juste avant de relancer", chemin: [1, 1, 1, 1, 2, 1] },
  { nom: "Relancer tout le monde, demander du découvert", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [2, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier, [décision, option] : relancer tous les clients
 * « en retard » (en semaine 1, aux acheteurs publics, à Ollivro, avant la
 * clôture), y compris ceux qui n'ont pas de facture valide ou qui la
 * contestent, et demander plus de découvert sans dossier. La note de la
 * présidente (D3) n'y figure pas : c'est une réponse faible, pas un réflexe
 * de pression.
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  rallongeOui: `Le comité accepte une facilité de ${kE(RALLONGE_S1)} jusqu'à fin novembre, pas au-delà. Pour décembre, il faudra revenir avec un dossier.`,
  rallongeNon:
    "Le comité n'accorde pas de découvert supplémentaire sans comprendre d'où vient la dégradation du DSO. Les frais d'étude restent dus.",
  avenantSigne: `Avenant signé en comité de pilotage : l'extension au second site est régularisée. Les ${kE(OLLIVRO_CONFORME)} sont payables tout de suite, les ${kE(OLLIVRO_HORS_PERIMETRE)} de l'avenant à 30 jours.`,
  avenantRefuse:
    "Le comité de pilotage s'est mal passé : Ollivro refuse l'avenant et maintient sa contestation. Le directeur industriel parle de mettre la phase 3 en concurrence.",
  ollivroPaye: `Ollivro a réglé les ${kE(OLLIVRO_CONFORME)} de la phase 2.`,
  phase3Perdue: "Ollivro confie la phase 3 du projet à Kéroual Consulting.",
  facilite: `Le comité accorde une facilité de caisse de ${kE(RALLONGE)} pour décembre, au vu de l'échéancier.`,
  decouvert: `Le comité accorde ${kE(RALLONGE)} de découvert supplémentaire jusqu'à fin janvier.`,
  refus:
    "Le comité n'accorde rien de plus pour décembre : il veut d'abord voir l'en-cours et les factures rejetées baisser.",
  factor:
    "Le poste clients privé est repris : nous finançons 85 % des factures approuvées. Vos clients privés paieront désormais sur notre compte.",
  missionPerdue:
    "Un client relancé sur une facture qu'il n'avait pas reçue, ou qu'il contestait, ne renouvelle pas sa mission : elle part chez Kéroual Consulting.",
} as const;
