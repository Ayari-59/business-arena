/**
 * LE BUDGET QUI NE TIENT PAS — le contenu de l'épisode.
 *
 * Samuel Ortega tient le budget de fonctionnement des sites lyonnais
 * d'Arvel Distribution : le dépôt de Corbas et quatre agences. Dès la
 * première semaine, la projection de la direction financière annonce un
 * dépassement, et on lui demande des économies. Six décisions, chacune
 * précédée de ce qu'un responsable des services généraux reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, prestataires, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "engagements",
    t: "Des commandes déjà signées n'ont pas encore de facture : le vrai dépassement est bien plus gros que la projection",
  },
  { id: "energie", t: "L'énergie dérive : le dépôt consomme trop depuis l'hiver" },
  { id: "partout", t: "Chaque poste dépense un peu trop : il faut serrer partout" },
  { id: "maintenance", t: "La maintenance des chariots coûte trop cher pour ce qu'elle apporte" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le budget ne tient pas",
    jusqua: 3,
    messages: (ctx) => [
      {
        de: "Suivi budgétaire",
        role: "Direction financière",
        heure: "07:30",
        alerte: true,
        texte: `Projection de fin de trimestre des services généraux : ${ctx.projection}. Les plus gros écarts : l'énergie et le prestataire multiservices.`,
      },
      {
        de: "Valérie Kessler",
        role: "Directrice administrative et financière",
        heure: "08:40",
        texte:
          "Samuel, le groupe demande à chaque région de tenir ses frais de fonctionnement. J'attends tes mesures vendredi. Le plus simple, c'est 10 % partout : tout le monde fait un effort, personne n'est lésé.",
      },
      {
        de: "Bruno Ferrat",
        role: "Chef du dépôt de Corbas",
        heure: "09:15",
        texte:
          "Le chariot 7 a encore lâché vendredi : deux heures de quai à l'arrêt, un camion reparti à moitié chargé. Ne touche pas à l'entretien, la saison démarre en mars.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "rapprochement",
        titre: "Rapprocher l'engagé et le facturé, poste par poste",
        cout: 1,
        nature: "decisive",
        resultat:
          "Avec Patrick, à la comptabilité fournisseurs : 40 k€ de bons de commande signés avant le trimestre n'ont encore aucune facture. Le relamping LED du dépôt (24 k€, pose en semaine 5), le marquage au sol des allées (9 k€, rien d'urgent), l'auvent du quai 3 (7 k€). Le poste petits travaux n'a que 30 k€ pour le trimestre, et l'outil de la direction financière le suppose tenu. Le vrai dépassement approche les 45 k€, avant la première panne.",
      },
      {
        id: "pannes",
        titre: "Relire l'historique des pannes avec le mainteneur des chariots",
        cout: 1,
        nature: "decisive",
        resultat:
          "Olivier Brun, de Manutention Bastide : « La dernière fois que vous avez espacé les visites, les pannes ont doublé cinq semaines plus tard. » Une panne coûte en moyenne 3 000 € de réparation et six à sept heures d'arrêt ; une sur cinq attend une pièce, un à deux jours. Une heure de quai à l'arrêt coûte 180 € (préparateurs, camions, retards), 260 € en pleine saison.",
      },
      {
        id: "ratio",
        titre: "Comparer les coûts au mètre carré avec les autres régions",
        cout: 1,
        nature: "bruit",
        resultat:
          "Lyon dépense 41 € par mètre carré et par trimestre, contre 39 € en moyenne dans le groupe : un écart de 5 %, dans la fourchette habituelle.",
      },
      {
        id: "compteurs",
        titre: "Relever les compteurs du dépôt la nuit et le week-end",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La nuit, le dépôt consomme encore 70 % de sa puissance de jour. Kévin : « Depuis la coupure de courant de décembre, j'ai l'impression que le chauffage ne baisse plus le soir. »",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Margaux, la contrôleuse de gestion",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Margaux : « Avant de couper quoi que ce soit, regarde ce qui est déjà signé. On ne coupe pas une commande engagée, et l'outil ne la voit pas. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous à la direction financière ?",
    options: [
      {
        t: "Appliquer 10 % d'économies sur chaque poste",
        d: "Chaque site réduit ses commandes, le nettoyage et les visites d'entretien. Environ 1 000 € d'économies visibles par semaine.",
      },
      {
        t: "Geler toute dépense non contractuelle jusqu'à la fin du trimestre",
        d: "Plus aucune commande ni réparation sans votre signature. Les petites dépenses s'arrêtent dès la semaine 2.",
      },
      {
        t: "Analyser chaque poste en engagé et en facturé, puis couper là où ça ne casse rien",
        d: "Deux jours avec la comptabilité et les chefs de site. Reporter ce qui n'est pas urgent, trier les demandes, garder l'entretien des chariots.",
      },
      {
        t: "Attendre les factures du mois pour y voir clair",
        d: "Rien ne change avant la fin janvier.",
      },
    ],
    reactions: [
      [
        {
          de: "Bruno Ferrat",
          role: "Chef du dépôt de Corbas",
          texte:
            "Le mainteneur passera toutes les cinq semaines au lieu de quatre. On fera avec, mais la moitié des chariots a plus de huit ans.",
        },
      ],
      [
        {
          de: "Aurélie Cosson",
          role: "Cheffe d'agence, Vénissieux",
          texte:
            "Même pour un tube grillé au showroom, il faut ta signature ? On va attendre trois jours pour tout.",
        },
      ],
      [
        {
          de: "Patrick Nguyen",
          role: "Comptable fournisseurs",
          texte:
            "Le fournisseur du marquage au sol accepte de passer en avril. J'ai la liste complète des engagements, poste par poste, si tu en as besoin.",
        },
      ],
      [
        {
          de: "Valérie Kessler",
          role: "Directrice administrative et financière",
          texte: "Vendredi est passé et je n'ai rien reçu. Le groupe me relance.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "La direction financière veut un chiffre",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Valérie Kessler",
        role: "Directrice administrative et financière",
        heure: "08:30",
        alerte: true,
        texte: `Comité de direction mardi. J'ai besoin de ta reprévision de fin de trimestre. L'outil me donne ${ctx.projection}. Je le présente tel quel ?`,
      },
      {
        de: "Patrick Nguyen",
        role: "Comptable fournisseurs",
        heure: "11:10",
        texte: "Pour info, la facture du relamping LED arrivera en semaine 6, à la fin de la pose.",
      },
      {
        de: "Tableau de bord",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Facturé depuis le début du trimestre : ${ctx.facture}. Engagé non facturé : ${ctx.engage}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "investissement",
        titre: "Demander à la comptabilité si le relamping peut passer en investissement",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Patrick : « Oui, au-delà de 15 k€, si la direction financière le valide avant l'arrivée de la facture, en semaine 6. Il faut le bon de commande, le devis détaillé et l'engagé du poste. » ${
            ctx.analyse
              ? "Votre rapprochement de la semaine 1 contient déjà tout ce qu'il faut."
              : "Sans le détail des engagements, le dossier prendra au moins deux semaines à monter."
          }`,
      },
      {
        id: "precedent",
        titre: "Demander à Margaux comment s'est passée la dernière clôture",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'an dernier, un dépassement découvert à la pré-clôture a valu à la logistique un gel total de trois semaines, réparations comprises : deux quais bloqués quatre jours faute de bon de commande signé.",
      },
    ],
    question: "Que présentez-vous au comité ?",
    options: [
      {
        t: "Annoncer le dépassement complet, engagés compris, avec des arbitrages",
        d: "Un chiffre plus mauvais que celui de l'outil, poste par poste, et une demande : passer le relamping en investissement.",
      },
      {
        t: "Présenter la projection de l'outil",
        d: "Le chiffre officiel, plus rassurant. Vous ajusterez en cours de route.",
      },
      {
        t: "Demander une rallonge budgétaire de 40 k€",
        d: "Sans entrer dans le détail : le budget était sous-estimé.",
      },
      {
        t: "Confirmer le budget : vous rattraperez d'ici la clôture",
        d: "Rien de plus à présenter au comité.",
      },
    ],
    reactions: [
      [
        {
          de: "Valérie Kessler",
          role: "Directrice administrative et financière",
          texte:
            "Le chiffre ne me fait pas plaisir, mais je préfère l'avoir aujourd'hui. Envoie-moi le dossier du relamping, je le regarde avec les commissaires aux comptes.",
        },
      ],
      [
        {
          de: "Valérie Kessler",
          role: "Directrice administrative et financière",
          texte: "Parfait, je présente ça. Le groupe sera content.",
        },
      ],
      [
        {
          de: "Valérie Kessler",
          role: "Directrice administrative et financière",
          alerte: true,
          texte:
            "Pas de rallonge sans détail. À partir de la semaine 6, tu appliques 10 % sur tout ce qui n'est pas engagé, entretien des chariots compris.",
        },
      ],
      [
        {
          de: "Valérie Kessler",
          role: "Directrice administrative et financière",
          texte: "Bien noté. Je compte sur toi pour la clôture.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "L'énergie dérive",
    jusqua: 7,
    messages: (ctx) => [
      {
        de: "Patrick Nguyen",
        role: "Comptable fournisseurs",
        heure: "09:00",
        alerte: true,
        texte: `Facture d'énergie de janvier reçue : ${ctx.factureEnergie}, pour 28 000 € au budget.`,
      },
      {
        de: "Kévin Da Silva",
        role: "Technicien de maintenance",
        heure: "17:30",
        texte:
          "Je suis passé au dépôt samedi chercher une pièce : tout était éclairé et les aérothermes tournaient. Il n'y avait personne.",
      },
    ],
    sources: [
      {
        id: "courbe",
        titre: "Lire la courbe de charge du dépôt, heure par heure",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La nuit et le week-end, le dépôt consomme 70 % de sa puissance de jour, contre 25 % l'hiver dernier. Depuis la coupure de courant de décembre, la gestion technique du bâtiment a perdu sa programmation horaire : chauffage et éclairage restent en mode jour. Un technicien la reprogramme en une demi-journée, pour 1 200 €.",
      },
      {
        id: "tarif",
        titre: "Demander au fournisseur d'électricité si ses prix ont bougé",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le prix du kilowattheure est fixé jusqu'en décembre par le contrat du groupe. La hausse vient de la consommation, pas du tarif.",
      },
    ],
    question: "Que faites-vous ?",
    options: [
      {
        t: "Faire reprogrammer la gestion technique du bâtiment",
        d: "Un technicien une demi-journée, 1 200 €. Les horaires de chauffage et d'éclairage du dépôt sont remis à plat.",
      },
      {
        t: "Baisser de trois degrés les consignes de chauffage de tous les sites",
        d: "Une note de service dès lundi. Ne coûte rien.",
      },
      {
        t: "Commander un audit énergétique des cinq sites",
        d: "Un bureau d'études, 4 500 €, des recommandations en semaine 10.",
      },
      {
        t: "Attendre la facture de février pour confirmer",
        d: "Janvier a été froid : une facture ne fait pas une tendance.",
      },
    ],
    reactions: [
      [
        {
          de: "Kévin Da Silva",
          role: "Technicien de maintenance",
          texte:
            "C'est reprogrammé : chauffage réduit à 22 h, éclairage coupé le week-end. Il manquait juste les horaires.",
        },
      ],
      [
        {
          de: "Aurélie Cosson",
          role: "Cheffe d'agence, Vénissieux",
          texte:
            "Les clients gardent leur manteau au showroom, et au dépôt les préparateurs ont ressorti les chauffages d'appoint.",
        },
      ],
      [
        {
          de: "Bureau d'études",
          role: "Audit énergétique",
          texte: "Nous commençons les relevés lundi. Rapport attendu en semaine 10.",
        },
      ],
      [
        {
          de: "Kévin Da Silva",
          role: "Technicien de maintenance",
          texte: "Ce samedi encore, le dépôt était éclairé comme en plein jour.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le prestataire facture plus que prévu",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Patrick Nguyen",
        role: "Comptable fournisseurs",
        heure: "09:20",
        alerte: true,
        texte: `Je mets en paiement la facture de janvier de Tessier Multiservices : ${ctx.facturePrestataire}, pour 12 000 € prévus au contrat. Près d'un cinquième en heures de régie.`,
      },
      {
        de: "Bruno Ferrat",
        role: "Chef du dépôt de Corbas",
        heure: "10:45",
        texte:
          "Les gars de Tessier passent souvent pour « une petite intervention ». Je signe le bon quand je suis là, ce qui n'arrive pas souvent.",
      },
    ],
    sources: [
      {
        id: "contrat",
        titre: "Relire le contrat et les bons d'intervention",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le contrat plafonne la révision annuelle des prix à 2 % ; Tessier l'applique à 7,4 % depuis octobre. Et six heures de régie sur dix n'ont aucun bon signé par un chef de site. Au total, près de 600 € par semaine facturés sans fondement.",
      },
      {
        id: "achats",
        titre: "Demander aux achats ce que donnerait un appel d'offres",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Quatre mois de procédure au moins, et trois mois de préavis : un nouveau prestataire ne serait pas là avant l'été. Hors indexation, les prix du marché sont proches de ceux de Tessier.",
      },
    ],
    question: "Que faites-vous avec Tessier ?",
    options: [
      {
        t: "Contester les factures, contrat en main, et exiger un avoir",
        d: "Le trop-perçu d'indexation depuis octobre, la régie sans bon signé. Et désormais, pas de régie sans bon.",
      },
      {
        t: "Résilier le contrat et lancer un appel d'offres",
        d: "Trois mois de préavis, 2 000 € d'accompagnement par les achats.",
      },
      {
        t: "Négocier une remise globale de 5 %",
        d: "Sans entrer dans le détail des factures. Tessier y est prêt.",
      },
      {
        t: "Payer, et en reparler au renouvellement",
        d: "Le contrat arrive à échéance en septembre.",
      },
    ],
    reactions: [
      null,
      [
        {
          de: "Stéphane Morin",
          role: "Chargé d'affaires, Tessier Multiservices",
          texte:
            "Nous prenons acte. Nous assurerons le préavis, au rythme du contrat. Pour les urgences, il faudra patienter.",
        },
      ],
      [
        {
          de: "Stéphane Morin",
          role: "Chargé d'affaires, Tessier Multiservices",
          texte: "Va pour 5 %, en signe de bonne volonté. On continue comme avant.",
        },
      ],
      [
        {
          de: "Patrick Nguyen",
          role: "Comptable fournisseurs",
          texte: "Facture payée. Celle de mars arrivera dans un mois.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Les chariots lâchent",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Bruno Ferrat",
        role: "Chef du dépôt de Corbas",
        heure: "07:50",
        alerte: true,
        texte: `${ctx.pannes} depuis janvier, ${ctx.arrets} de quai ou de chariot à l'arrêt. Et la saison démarre lundi : trente pour cent de commandes en plus jusqu'à fin mars.`,
      },
      {
        de: "Olivier Brun",
        role: "Technicien, Manutention Bastide",
        heure: "11:30",
        texte:
          "Les quatre plus vieux chariots arrivent au bout : galets, fourches, batteries. Je peux les réviser à fond la semaine prochaine.",
      },
    ],
    sources: [
      {
        id: "parc",
        titre: "Regarder l'âge et l'historique de chaque chariot",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Les quatre chariots de plus de huit ans font six pannes sur dix. ${
            ctx.preventifEspace
              ? "Depuis que les visites ont été espacées, le rythme des pannes a presque doublé."
              : "Les visites régulières les tiennent, mais leurs pièces d'usure sont à bout."
          } Le mainteneur estime qu'une révision complète des quatre, 2 500 €, diviserait par deux le risque de panne du parc en pleine saison.`,
      },
      {
        id: "location",
        titre: "Demander au loueur ses conditions pour des chariots de secours",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux chariots de secours, livrables en 24 heures : 800 € par semaine. Avec eux, une panne ne coûte plus que deux heures d'arrêt, le temps d'échanger les machines. Ils ne changent rien au nombre de pannes.",
      },
    ],
    question: "Comment abordez-vous la saison ?",
    options: [
      {
        t: "Faire réviser les quatre chariots les plus anciens",
        d: "2 500 €, et les visites d'entretien reprennent leur rythme normal.",
      },
      {
        t: "Louer deux chariots de secours jusqu'à la fin du trimestre",
        d: "800 € par semaine, pendant quatre semaines.",
      },
      {
        t: "Réparer au fil des pannes",
        d: "Comme d'habitude.",
      },
      {
        t: "Reporter au trimestre prochain les réparations qui ne bloquent pas",
        d: "On ne répare que ce qui arrête un chariot. La facture de réparations baisse tout de suite.",
      },
    ],
    reactions: [
      [
        {
          de: "Olivier Brun",
          role: "Technicien, Manutention Bastide",
          texte:
            "Révision faite : deux batteries changées, des galets, et une fourche fissurée qu'on n'aurait pas vue avant qu'elle casse.",
        },
      ],
      [
        {
          de: "Bruno Ferrat",
          role: "Chef du dépôt de Corbas",
          texte:
            "Les deux chariots de secours sont arrivés. Au moins, on ne bloquera plus un quai pour une panne.",
        },
      ],
      [
        {
          de: "Bruno Ferrat",
          role: "Chef du dépôt de Corbas",
          texte: "On verra bien. Je croise les doigts pour mars.",
        },
      ],
      [
        {
          de: "Kévin Da Silva",
          role: "Technicien de maintenance",
          texte:
            "J'ai une liste de petites réparations en attente. Un vérin qui fuit, ça finit toujours par casser.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Finir le trimestre",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Gilles Perrin",
        role: "Directeur régional",
        heure: "08:30",
        alerte: true,
        texte: `Samuel, l'outil annonce ${ctx.projection}. Demande aux fournisseurs de facturer en avril ce qui peut l'être : au moins, le trimestre sera propre.`,
      },
      {
        de: "Tableau de bord",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Facturé depuis janvier : ${ctx.facture}. Engagé non facturé : ${ctx.engage}.`,
      },
    ],
    sources: [
      {
        id: "fnp",
        titre: "Demander à la comptabilité comment elle traitera les factures non parvenues",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Patrick : « Tout ce qui est réalisé avant la clôture passe en charges, facturé ou non : ce sont les factures non parvenues. Décaler une facture ne change pas le résultat du trimestre ; ça le cache jusqu'à l'audit. »",
      },
      {
        id: "commandes",
        titre: "Lister les commandes signées qui n'ont pas démarré",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.toutGele
            ? "Aucune : le gel a tout arrêté, commandes comprises."
            : "Trois commandes signées en semaine 9 n'ont pas commencé : stores des bureaux, peinture du local social, signalétique. 4 200 € en tout, rien d'urgent.",
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Demander aux fournisseurs de facturer après la clôture",
        d: "Le facturé du trimestre baisse d'autant.",
      },
      {
        t: "Arrêter ce qui n'est ni engagé ni urgent, garder l'entretien et les réparations",
        d: "Les commandes non démarrées passent en avril, les petites dépenses s'arrêtent.",
      },
      {
        t: "Tout geler jusqu'à la clôture, entretien compris",
        d: "Plus une dépense, et les visites préventives suspendues deux semaines.",
      },
      {
        t: "Ne rien changer",
        d: "Le trimestre se finira où il doit.",
      },
    ],
    reactions: [
      [
        {
          de: "Patrick Nguyen",
          role: "Comptable fournisseurs",
          texte:
            "Les fournisseurs ont accepté. Je passerai quand même les travaux réalisés en factures non parvenues : c'est la règle.",
        },
      ],
      [
        {
          de: "Margaux Lenoir",
          role: "Contrôleuse de gestion",
          texte:
            "Trois commandes reportées en avril, et l'entretien continue. Le chiffre ne bougera plus d'ici la clôture.",
        },
      ],
      [
        {
          de: "Bruno Ferrat",
          role: "Chef du dépôt de Corbas",
          texte:
            "Plus de visite d'entretien en pleine saison ? Les chariots tournent seize heures par jour en ce moment.",
        },
      ],
      [
        {
          de: "Valérie Kessler",
          role: "Directrice administrative et financière",
          texte: "Le trimestre se termine. On fera le point à la clôture.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Analyser, protéger, reprévoir tôt", chemin: [2, 0, 0, 0, 0, 1] },
  { nom: "Couper partout, geler", chemin: [0, 1, 1, 1, 3, 2] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 2, 3] },
] as const;

/** Les options qui répondent à la pression budgétaire par une coupe uniforme ou un gel : [décision, option]. */
export const COUPES_AVEUGLES = [
  [0, 0],
  [0, 1],
  [2, 1],
  [4, 3],
  [5, 2],
] as const;

export const REPONSES = {
  ledCapitalise:
    "Dossier validé avec les commissaires aux comptes : le relamping passe en investissement. Ce sont 24 k€ qui sortent de ton budget de fonctionnement.",
  ledRefuse:
    "Le dossier est arrivé après la fin de la pose, sans le détail des engagements : les commissaires aux comptes refusent. Le relamping reste dans ton budget.",
  prestataireAccepte:
    "Vous avez raison sur l'indexation comme sur la régie. Nous vous adressons un avoir pour tout le trop-perçu depuis octobre, et plus aucune régie ne sera facturée sans bon signé.",
  prestatairePartiel:
    "Nous corrigeons l'indexation et ne facturerons plus de régie sans bon signé, à partir de mars. Pour le passé, nos factures ont été réglées : pas d'avoir.",
  prestataireBraque:
    "Nous contestons votre lecture du contrat. En attendant, nous nous en tiendrons strictement au forfait : plus aucune intervention hors contrat, portes de quai comprises.",
  niveleur:
    "Le niveleur du quai 2 a lâché ce matin : vérin hydraulique. Trois jours sans ce quai, et 9 000 € de réparation.",
  surprise:
    "Pré-clôture : ton dépassement est bien plus gros que ce que j'ai présenté au comité. Je gèle toute dépense non contractuelle jusqu'à la clôture, et chaque réparation passe désormais par moi.",
} as const;
