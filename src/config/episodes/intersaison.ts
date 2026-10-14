/**
 * L'INTERSAISON QUI ASSÈCHE LA CAISSE — le contenu de l'épisode.
 *
 * Bérenger Maréchal est responsable administratif et financier de L'Escale
 * Megève, l'hôtel 4 étoiles de 38 chambres du Groupe Escale, avec sa Table
 * d'Augustin. L'hôtel ouvre de mi-décembre à mi-avril et en juillet-août. Le
 * trimestre va de la dernière semaine de l'hiver à la réouverture d'été : six
 * décisions, chacune précédée de ce qu'un financier d'hôtel saisonnier reçoit
 * vraiment. Une saison record et 420 k€ en banque, des acomptes qu'on peut
 * monter, des travaux qu'on peut reporter, des fournisseurs qu'on peut faire
 * attendre, une mauvaise surprise sur le réseau d'eau chaude, et un
 * tour-opérateur qui propose de l'argent frais au plus creux.
 *
 * Le réflexe du métier est de passer le creux sans demander de financement :
 * reporter les travaux, étaler les fournisseurs « au feeling », monter les
 * acomptes, vendre l'hiver prochain au rabais. La méthode est de faire le
 * plan de trésorerie, de financer le creux saisonnier par une ligne
 * saisonnière négociée en avril, et de garder intact ce qui fera la saison
 * suivante.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Leurs chiffres sont ceux du
 * modèle (src/engine/episodes/intersaison.ts), et un test le vérifie.
 *
 * Entreprise, personnes et chiffres sont fictifs. Montants hors taxes.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "cycle",
    t: "La fermeture inverse le BFR : les dettes de l'hiver et les travaux tombent quand plus rien n'entre, un creux saisonnier et prévisible à financer comme tel",
  },
  {
    id: "travaux",
    t: "Le programme de travaux est trop lourd pour la trésorerie de cette année",
  },
  {
    id: "rentabilite",
    t: "L'hôtel ne gagne pas assez l'hiver pour tenir l'intersaison",
  },
  {
    id: "fixes",
    t: "Les charges fixes de l'hôtel fermé sont trop lourdes : c'est là qu'il faut couper",
  },
] as const;

export const ANNABELLE = {
  de: "Annabelle Socquet",
  role: "Directrice de L'Escale Megève",
} as const;
export const FLEURINE = { de: "Fleurine Rosset", role: "Comptable de l'hôtel" } as const;
export const ZEPHYRIN = { de: "Zéphyrin Chevallay", role: "Responsable technique" } as const;
export const YOUSRA = { de: "Yousra Benattia", role: "Responsable des réservations" } as const;
export const BANQUE = {
  de: "Selim Dardel",
  role: "Chargé d'affaires entreprises, Banque des Aravis",
} as const;
export const SIEGE = {
  de: "Marceau Dupré",
  role: "Directeur financier du Groupe Escale",
} as const;
export const VUARAND = {
  de: "Siméon Vuarand",
  role: "Maison Vuarand, vins et spiritueux",
} as const;
export const BLANCHISSERIE = { de: "Blanchisserie du Fier", role: "Service clients" } as const;
export const ALPINE = {
  de: "Arvid Sjöberg",
  role: "Responsable des contrats hôtels, Alpine Horizons",
} as const;
const TABLEAU = { de: "Point de trésorerie", role: "Tableau du vendredi" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La saison se termine",
    jusqua: 2,
    messages: (ctx) => [
      {
        de: "Banque des Aravis",
        role: "Relevé du matin",
        heure: "07:30",
        texte: `Solde du compte courant : +${ctx.tresorerie}. Facilité de caisse : ${ctx.disponible}, inutilisée.`,
      },
      {
        ...ANNABELLE,
        heure: "08:15",
        texte:
          "Bérenger, dernière semaine ! Saison record, la direction générale est ravie. Dimanche on ferme, les entreprises attaquent les travaux le 11 mai, et je veux rouvrir le jeudi 2 juillet avec des chambres impeccables. Avec 420 k€ en banque, on est tranquilles jusqu'à l'été, non ?",
      },
      {
        ...FLEURINE,
        heure: "09:30",
        texte:
          "Les soldes de tout compte des 42 saisonniers partent la semaine prochaine. J'ai toutes les échéances jusqu'à mi-juillet, si tu veux faire le plan de trésorerie de l'intersaison.",
      },
      {
        ...BANQUE,
        heure: "11:00",
        texte:
          "Monsieur Maréchal, notre comité de crédit se réunit vendredi de la semaine prochaine, puis pas avant fin mai. Si vous avez un besoin pour l'intersaison, c'est le moment de me l'apporter.",
      },
      {
        ...ZEPHYRIN,
        heure: "14:20",
        texte:
          "Les devis des travaux d'intersaison sont prêts : 220 k€. Il me faut ta confirmation fin avril pour que les entreprises démarrent le 11 mai.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "echeances",
        titre: "Lister avec Fleurine les échéances de l'intersaison",
        cout: 1,
        nature: "decisive",
        resultat:
          "Chaque semaine, 16 k€ de charges fixes : salaires des neuf permanents, crédit-bail des murs, assurances, énergie, abonnements. En plus : semaine 1, les cotisations sociales de mars, 92 k€ ; semaine 2, les soldes de tout compte et la paie d'avril des 42 saisonniers, 118 k€ ; semaine 3, la TVA de mars et la taxe de séjour de l'hiver, 52 k€ ; semaine 4, les commissions de Bookalia et Voyagio sur mars et avril, 34 k€ ; semaine 5, les cotisations sociales d'avril, 58 k€, et l'acompte de 30 % des travaux, 66 k€ ; semaine 7, 55 k€ de fournisseurs de l'hiver et 77 k€ de situation des travaux ; semaine 8, 50 k€ de fournisseurs ; semaine 9, 45 k€ ; semaine 10, le solde des travaux à la réception, 77 k€ ; semaine 12, la paie de juin des saisonniers d'été, 22 k€.",
      },
      {
        id: "encaissements",
        titre: "Relever ce qui rentrera d'ici la réouverture",
        cout: 1,
        nature: "decisive",
        resultat:
          "Au lundi 13 avril, la trésorerie nette est de +420 k€ : aucun concours bancaire, la facilité de caisse de 50 k€ est inutilisée. Le BFR est de −406 k€ : 454 k€ de dettes de l'hiver et 40 k€ d'acomptes reçus, pour 58 k€ de créances et 30 k€ de stocks. Le fonds de roulement net global n'est que de 14 k€. Ce qui rentrera : 64 k€ de recettes cette dernière semaine ; la facture de mars-avril d'Alpine Horizons, 58 k€, en semaine 4 ; chaque semaine, 20 % d'acompte sur environ 33 k€ de réservations directes pour l'été et l'hiver prochain, soit 6,6 k€ ; après la réouverture du jeudi 2 juillet, 34 k€ en semaine 12 et 46 k€ en semaine 13, acomptes déjà reçus déduits. Rien d'autre.",
      },
      {
        id: "travaux",
        titre: "Revoir le programme de travaux avec Zéphyrin",
        cout: 1,
        nature: "utile",
        resultat:
          "Les 220 k€ : 40 k€ de réglementaire (sécurité incendie, ascenseur, analyses de légionelle), 45 k€ de préventif (chaudières, centrale de traitement d'air), 40 k€ pour la cuisine de la Table d'Augustin (une chambre froide de quatorze ans, la hotte), 95 k€ pour rafraîchir douze chambres. « Ce qu'on ne fait pas au printemps se fait à l'automne, quand tous les chalets de la station refont leurs salles de bains : plus cher, et sans garantie de finir avant Noël. »",
      },
      {
        id: "saison",
        titre: "Relire le compte de résultat de la saison d'hiver",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Saison record : 2,05 M€ de chiffre d'affaires, un taux d'occupation de 84 % à 372 € de prix moyen, soit un RevPAR de 312 €, et un GOP de 41 %. La Table d'Augustin a fait 610 k€, à 29 % de ratio matière.",
      },
      {
        id: "conseil",
        titre: "Demander conseil au directeur financier du groupe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Marceau Dupré : « Une saison se finance comme une récolte : on emprunte au printemps ce que l'été et l'hiver rendront. Faites le plan semaine par semaine, et allez voir la banque avec, avant d'en avoir besoin. Ce qu'on n'emprunte pas à la banque, on finit par l'emprunter à ses fournisseurs ou à la saison suivante, et c'est toujours plus cher. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment passez-vous l'intersaison ?",
    options: [
      {
        t: "Présenter le plan de trésorerie à la Banque des Aravis et négocier une ligne saisonnière",
        d: "Un crédit de campagne de 250 k€ jusqu'au 30 septembre, au comité de la semaine 2 : 4,8 % l'an sur l'utilisé, 0,5 % l'an d'engagement, 1 500 € de frais de dossier.",
      },
      {
        t: "Ne rien demander : la trésorerie de l'hiver et quelques reports suffiront",
        d: "Aucun frais. On décalera ce qui peut l'être si la trésorerie se tend.",
      },
      {
        t: "Demander un prêt à moyen terme de 300 k€ pour ne plus avoir le souci",
        d: "Cinq ans à 4,4 %, versé en semaine 6 après la prise de garantie ; 2 000 € de frais de dossier.",
      },
      {
        t: "Demander par courriel de porter la facilité de caisse à 300 k€",
        d: "Une simple demande au comité de la semaine 2 : 8,5 % l'an sur l'utilisé, 1 000 € de commission si elle est accordée.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...ANNABELLE,
          texte:
            "Très bien, pas de frais bancaires cette année. On verra au fil de l'eau : on a toujours fini par passer.",
        },
      ],
      null,
      null,
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les acomptes de l'été et de l'hiver",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...YOUSRA,
        heure: "10:00",
        alerte: true,
        texte:
          "Bérenger, les réservations de l'été et de l'hiver prochain démarrent vraiment. Aujourd'hui on demande 20 % d'acompte. Pour aider la trésorerie, je peux passer à 50 % partout dès lundi : Hostéo le fait en un clic.",
      },
      {
        ...ANNABELLE,
        heure: "11:30",
        texte:
          "Attention à ne pas envoyer nos clients sur Bookalia. Mais si les acomptes nous évitent d'emprunter, je suis preneuse.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Les soldes de tout compte sont partis. Trésorerie nette : ${ctx.tresorerie}. Acomptes encaissés depuis le 13 avril : ${ctx.acomptes}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "reservations",
        titre: "Analyser les réservations directes par période",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Chaque semaine, 33 k€ de réservations directes : 15 k€ pour l'été, 8 k€ pour les fêtes de fin d'année, 6 k€ pour les vacances de février, 4 k€ pour les autres semaines d'hiver. Quand Évian a porté son acompte d'été de 20 % à 40 %, il a perdu 10 % de ses réservations directes : la moitié de ces clients ont réservé ailleurs, l'autre moitié chez nous par Bookalia ou Voyagio, à 17 % de commission ; un euro de réservation d'été perdue coûte ainsi 0,50 € de marge. Les semaines creuses de l'hiver sont plus sensibles encore : 20 points d'acompte de plus y font renoncer un client sur huit, et chaque euro perdu coûte 0,60 €. Pour les fêtes et février, la liste d'attente dépasse la moitié des chambres : 20 points de plus font renoncer 1 à 2 % des clients, aussitôt remplacés.",
      },
      {
        id: "annulations",
        titre: "Demander à Yousra ce que deviennent les annulations tardives",
        cout: 0.5,
        nature: "utile",
        resultat:
          "6 % des réservations s'annulent à moins de trente jours de l'arrivée ; l'acompte est alors conservé. À 50 % d'acompte, une annulation tardive laisse à l'hôtel 30 points de plus qu'à 20 %.",
      },
    ],
    question: "Quel acompte demandez-vous à partir de lundi ?",
    options: [
      {
        t: "Garder l'acompte à 20 % partout",
        d: "Rien ne change : environ 6,6 k€ d'acomptes par semaine.",
      },
      {
        t: "Passer l'acompte à 50 % sur toutes les réservations",
        d: "Environ 16 k€ d'acomptes par semaine au lieu de 6,6, si les clients suivent.",
      },
      {
        t: "Passer l'acompte à 30 % partout",
        d: "Environ 10 k€ d'acomptes par semaine.",
      },
      {
        t: "50 % pour les fêtes et les vacances de février, 20 % pour le reste",
        d: "Environ 10,8 k€ d'acomptes par semaine ; l'été et les semaines creuses de l'hiver ne changent pas.",
      },
    ],
    reactions: [
      [{ ...YOUSRA, texte: "On reste à 20 %. Les réservations de juillet rentrent bien." }],
      [
        {
          ...YOUSRA,
          texte:
            "C'est fait : 50 % d'acompte sur tout, dès lundi. Je préviens la réception pour les appels de clients surpris.",
        },
      ],
      [{ ...YOUSRA, texte: "30 % partout dès lundi. On verra si ça freine." }],
      [
        {
          ...YOUSRA,
          texte:
            "50 % pour Noël, le Nouvel An et février, 20 % pour le reste, dès lundi. Hostéo sait le faire période par période.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le programme de travaux",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...ZEPHYRIN,
        heure: "09:00",
        alerte: true,
        texte:
          "Les entreprises attendent ma confirmation pour lundi. Le programme complet, c'est 220 k€ : 66 k€ d'acompte à la commande, 77 k€ fin mai, 77 k€ à la réception mi-juin.",
      },
      {
        ...ANNABELLE,
        heure: "10:40",
        texte:
          "Si la trésorerie est juste, on peut reporter les chambres à l'automne, non ? Les clients d'été sont moins exigeants que ceux de Noël.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Trésorerie nette : ${ctx.tresorerie}. ${
          ctx.ligne
            ? "Ligne saisonnière de 250 k€ en place, inutilisée."
            : `Facilité de caisse : ${ctx.disponible}.`
        }${ctx.pret ? " Le prêt de 300 k€ sera versé en semaine 6." : ""}`,
      },
    ],
    sources: [
      {
        id: "reports",
        titre: "Demander à Zéphyrin ce que coûte un report",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "À l'automne, les entreprises de la station sont débordées : tout ce qu'on reporte coûtera 10 % de plus. La chambre froide n'a pas été révisée depuis quatorze ans : sans révision, une chance sur trois qu'elle lâche cet été, 9 k€ de denrées détruites et de service arrêté. Le préventif des chaudières et de la centrale d'air reporté, ce sont en moyenne 11 k€ de pannes et de gestes commerciaux l'hiver prochain. Les douze chambres non rafraîchies : à Évian, la note sur Bookalia a perdu 0,3 point l'année du report ; comptez 3 % de recettes en moins dès la réouverture, et 16 k€ sur l'été et l'hiver suivants.",
      },
      {
        id: "echeancier",
        titre: "Demander aux entreprises un échéancier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les trois entreprises acceptent de ne prendre que 30 % à la commande et le solde 60 jours après la réception, fin août, contre 2,5 % de plus sur le prix : 5,5 k€.",
      },
    ],
    question: "Que confirmez-vous aux entreprises ?",
    options: [
      {
        t: "Lancer tout le programme comme prévu",
        d: "220 k€ : 30 % à la commande, 35 % en semaine 7, le solde à la réception en semaine 10.",
      },
      {
        t: "Ne faire que le réglementaire, reporter le reste à l'automne",
        d: "40 k€ ce printemps ; 180 k€ de moins à sortir avant l'été.",
      },
      {
        t: "Faire la technique et la cuisine, reporter les chambres à l'automne",
        d: "125 k€ ce printemps ; 95 k€ de moins à sortir avant l'été.",
      },
      {
        t: "Tout lancer, en négociant le solde à 60 jours après la réception",
        d: "30 % à la commande, 70 % fin août ; les entreprises demandent 2,5 % de plus, 5,5 k€.",
      },
    ],
    reactions: [
      [
        {
          ...ZEPHYRIN,
          texte: "Je confirme tout le programme. Les peintres arrivent lundi au troisième étage.",
        },
      ],
      [
        {
          ...ZEPHYRIN,
          texte:
            "Je ne garde que le réglementaire. Pour la chambre froide, on croise les doigts ; pour le reste, je rappellerai les entreprises en septembre, si elles ont de la place.",
        },
      ],
      [
        {
          ...ZEPHYRIN,
          texte: "Technique et cuisine confirmées. Les chambres attendront l'automne.",
        },
      ],
      [
        {
          ...ZEPHYRIN,
          texte:
            "Les entreprises signent l'échéancier : 30 % maintenant, le solde fin août. Elles ont pris leurs 2,5 %.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les factures de l'hiver",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...FLEURINE,
        heure: "09:00",
        alerte: true,
        texte:
          "Les factures des fournisseurs de l'hiver tombent : 55 k€ la semaine prochaine, 50 k€ la suivante, 45 k€ début juin. La Blanchisserie du Fier, Maison Vuarand, le grossiste, l'épicerie fine…",
      },
      {
        ...VUARAND,
        heure: "11:15",
        texte:
          "Monsieur Maréchal, comme chaque année, notre remise de pré-saison : 4 % sur toute votre commande de vins de l'été, 62 k€, si elle est passée maintenant et réglée fin juin.",
      },
      {
        ...ANNABELLE,
        heure: "14:00",
        texte:
          "Nos fournisseurs nous connaissent depuis vingt ans. Ils peuvent bien attendre quelques semaines, non ?",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Trésorerie nette : ${ctx.tresorerie}. Financements utilisés : ${ctx.concours}, sur ${ctx.disponible} accordés.`,
      },
    ],
    sources: [
      {
        id: "conditions",
        titre: "Relire les conditions des fournisseurs",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les pénalités de retard : le taux de la BCE plus dix points, 12,15 % l'an, et 40 € d'indemnité forfaitaire par facture ; il y en a 34. La Blanchisserie du Fier suspend le service de tout client à plus de trente jours de retard, linge de la réouverture compris. Maison Vuarand ne verse sa ristourne de fin d'année, 3 % de 180 k€ d'achats, soit 5,4 k€, qu'aux clients à jour. Un échéancier signé d'avance évite les pénalités : les trois plus gros acceptent la moitié six semaines plus tard, contre 1 % de frais sur la part reportée.",
      },
      {
        id: "projection",
        titre: "Mettre à jour le plan de trésorerie",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `D'après le plan à jour, la trésorerie nette touchera ${ctx.pointBasPrevu} en semaine ${ctx.semainePointBas}, pour ${ctx.disponiblePrevu} de financement accordé. Avec la commande de vins de l'été payée fin juin : ${ctx.pointBasAvecVins}.`,
      },
    ],
    question: "Comment traitez-vous les fournisseurs ?",
    options: [
      {
        t: "Payer les fournisseurs à l'échéance",
        d: "150 k€ en semaines 7 à 9, comme prévu ; le vin de l'été commandé au fil de la saison.",
      },
      {
        t: "Payer d'abord les plus pressants, laisser glisser les autres",
        d: "Les factures qui peuvent attendre attendront quelques semaines. Aucun frais annoncé.",
      },
      {
        t: "Négocier un échéancier écrit avec les trois plus gros fournisseurs",
        d: "La moitié à l'échéance, l'autre six semaines plus tard ; 750 € de frais.",
      },
      {
        t: "Payer à l'échéance et prendre la remise de pré-saison de Maison Vuarand",
        d: "150 k€ en semaines 7 à 9 ; 62 k€ de vins payés fin juin, 2,5 k€ de remise.",
      },
    ],
    reactions: [
      [
        {
          ...FLEURINE,
          texte:
            "Je programme les virements aux échéances. Le vin de l'été sera commandé au fil de la saison, comme d'habitude.",
        },
      ],
      [
        {
          ...FLEURINE,
          texte:
            "Entendu : je paie d'abord ce qui ne peut pas attendre, le reste glissera. Je ne préviens personne ?",
        },
      ],
      [
        {
          ...FLEURINE,
          texte:
            "Les trois plus gros ont signé l'échéancier : la moitié à l'échéance, l'autre six semaines plus tard.",
        },
      ],
      [
        {
          ...VUARAND,
          texte:
            "Merci de votre confiance : la commande de l'été est enregistrée, livraison et règlement fin juin, remise de 4 % déduite.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "La légionelle",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...ZEPHYRIN,
        heure: "08:45",
        alerte: true,
        texte:
          "Mauvaise nouvelle : les analyses de légionelle de mai sont positives sur deux points du deuxième étage. La Plomberie Dénarié propose de remplacer le réseau d'eau chaude de l'étage, 46 k€, payés à la fin du chantier, fin juin. Sinon, un choc thermique et une chloration tout de suite, 6 k€, et le réseau à l'automne.",
      },
      {
        ...ANNABELLE,
        heure: "10:30",
        texte: ctx.ligne
          ? "On ne rouvrira pas avec de la légionelle. Mais on a la ligne de la banque : on passera, non ?"
          : "On ne rouvrira pas avec de la légionelle. Mais 46 k€ de plus, au plus creux…",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Trésorerie nette : ${ctx.tresorerie}. Financements utilisés : ${ctx.concours}, sur ${ctx.disponible} accordés.${
          ctx.incidents
            ? ` La banque a rejeté des paiements ${ctx.incidents} fois depuis avril.`
            : ""
        }`,
      },
    ],
    sources: [
      {
        id: "plan",
        titre: "Refaire le plan de trésorerie avec le remplacement du réseau",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Avec le remplacement du réseau, la trésorerie nette touchera ${ctx.pointBasPrevu} en semaine ${ctx.semainePointBas}, pour ${ctx.disponiblePrevu} de financement accordé${
            ctx.manque ? `, soit ${ctx.manque} de plus que ce qui est accordé` : ""
          }. Au-delà, la Banque des Aravis laisse passer 30 k€ au plus, à 16 % l'an, puis rejette les prélèvements et les virements. Selim Dardel : « ${
            ctx.ligne
              ? "Avec un plan à jour, je porte votre ligne à 400 k€ dès la semaine 9, pour 600 € de frais."
              : "Avec un plan à jour, le comité de juin peut vous ouvrir une ligne de 400 k€ en semaine 10, à 5,8 %, pour 1 500 € de frais."
          } »`,
      },
      {
        id: "analyses",
        titre: "Demander à Zéphyrin ce que vaut un simple traitement",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Après un simple choc thermique, sur un réseau entartré, les analyses de réouverture restent positives presque une fois sur deux : il faut alors fermer l'étage une semaine et déloger les clients, 17 k€. Remplacé à l'automne, le réseau coûtera 10 % de plus. Le siège, lui, peut avancer 100 k€ en compte courant à partir de la semaine 10 : 5 % l'an et 1 500 € de frais.",
      },
    ],
    question: "Que faites-vous du réseau d'eau chaude, et du financement ?",
    options: [
      {
        t: "Remplacer le réseau et faire porter la ligne à 400 k€, plan à jour à l'appui",
        d: "46 k€ fin juin. Si la ligne existe, 600 € de frais ; sinon, une ligne de 400 k€ en semaine 10, à 5,8 %, 1 500 € de frais.",
      },
      {
        t: "Remplacer le réseau sans rien changer au financement",
        d: "46 k€ fin juin. Aucun frais.",
      },
      {
        t: "Traiter tout de suite, et remplacer le réseau à l'automne",
        d: "6 k€ de choc thermique et de chloration en semaine 9 ; 46 k€ de moins avant l'été.",
      },
      {
        t: "Remplacer le réseau et demander au siège une avance de 100 k€",
        d: "46 k€ fin juin. L'avance arrive en semaine 10 : 5 % l'an, 1 500 € de frais.",
      },
    ],
    reactions: [
      [
        {
          ...BANQUE,
          texte:
            "Je reçois votre plan mis à jour, et je présente votre demande. Vous aurez la réponse dans les jours qui viennent.",
        },
      ],
      [{ ...ANNABELLE, texte: "Bien. On garde notre sang-froid, et on rouvre le 2 juillet." }],
      [
        {
          ...ZEPHYRIN,
          texte:
            "La Plomberie Dénarié fait le choc thermique lundi. On refera les analyses avant la réouverture.",
        },
      ],
      [
        {
          ...SIEGE,
          texte:
            "Le siège vous avance 100 k€ en compte courant à partir de la semaine 10, selon la convention de trésorerie du groupe. Remboursement en août.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Alpine Horizons et l'hiver prochain",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ALPINE,
        heure: "09:30",
        alerte: true,
        texte:
          "Cher Bérenger, pour l'hiver prochain, nous voulons six chambres chez vous toute la saison, dix-sept semaines, à 280 € la nuit, en engagement ferme : payées, que nos clients viennent ou non. Nous versons 30 % d'acompte à la signature, mi-juillet. Pouvez-vous répondre lundi ?",
      },
      {
        ...ANNABELLE,
        heure: "10:15",
        texte: "60 k€ d'acompte en juillet, au plus creux de la trésorerie : ça tombe à pic, non ?",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Réouverture jeudi prochain. Trésorerie nette : ${ctx.tresorerie}. Financements utilisés : ${ctx.concours}, sur ${ctx.disponible} accordés.`,
      },
    ],
    sources: [
      {
        id: "hiver",
        titre: "Relire l'occupation de l'hiver dernier, semaine par semaine",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur les six semaines des fêtes et de février : 98 % d'occupation, à 560 € de prix moyen. Sur les onze autres semaines : 60 %, à 300 €. Une nuitée occupée coûte 21 € de plus qu'une chambre vide : linge, produits d'accueil, énergie, ménage. Six chambres sur dix-sept semaines font 714 nuitées, dont 252 aux fêtes et en février.",
      },
      {
        id: "alpine",
        titre: "Se renseigner sur Alpine Horizons auprès du siège",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Marceau Dupré : « L'an dernier, Alpine Horizons a accepté trois contre-propositions sur quatre au prix qu'il demandait, quand on lui retirait les semaines de pointe. À 250 €, il signe toujours : c'est ce qu'il paie à vos concurrents de la vallée. »",
      },
    ],
    question: "Que répondez-vous à Alpine Horizons ?",
    options: [
      {
        t: "Signer : six chambres toute la saison à 280 €",
        d: "Un engagement ferme sur 714 nuitées ; 60 k€ d'acompte en semaine 13.",
      },
      {
        t: "Contre-proposer six chambres hors fêtes et février, à 280 €",
        d: "462 nuitées ; 39 k€ d'acompte en semaine 13, si Alpine Horizons accepte.",
      },
      {
        t: "Refuser : garder les chambres pour la clientèle directe",
        d: "Rien ne change.",
      },
      {
        t: "Contre-proposer six chambres hors fêtes et février, à 250 €",
        d: "462 nuitées ; 35 k€ d'acompte en semaine 13.",
      },
    ],
    reactions: [
      [
        {
          ...ALPINE,
          texte: "Wonderful ! Le contrat part ce soir, et l'acompte suivra la signature.",
        },
      ],
      null,
      [{ ...ALPINE, texte: "Dommage. Restons en contact pour l'été prochain." }],
      [
        {
          ...ALPINE,
          texte: "À 250 €, sans les semaines de pointe : marché conclu. Le contrat part ce soir.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  {
    nom: "Faire le plan, financer le creux, préserver la saison suivante",
    chemin: [0, 3, 0, 3, 0, 1],
  },
  { nom: "Passer le creux sans emprunter", chemin: [1, 1, 1, 1, 1, 0] },
  { nom: "Attentiste", chemin: [1, 0, 0, 0, 1, 2] },
] as const;

/**
 * Les réflexes du métier devant l'intersaison : ne rien demander à la banque,
 * et trouver l'argent ailleurs, chez les clients (des acomptes qui les font
 * fuir), dans les travaux (reportés), chez les fournisseurs (étalés « au
 * feeling ») et dans la saison suivante (vendue au rabais). [décision, option].
 */
export const REFLEXES = [
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 1],
  [4, 1],
  [4, 2],
  [5, 0],
] as const;

export const REPONSES = {
  ligneAccordee:
    "Votre plan est clair : un besoin qui naît fin avril et se résorbe avec l'été. Le comité vous accorde une ligne saisonnière de 250 k€ jusqu'au 30 septembre, à 4,8 % sur l'utilisé. Avec votre facilité de caisse, elle couvre le point bas de votre plan. Elle est disponible dès la semaine 3.",
  ligneRefusee:
    "Le comité a examiné votre dossier et le reporte : il veut d'abord les comptes de l'exercice clos au 30 avril. D'ici là, votre facilité de caisse reste de 50 k€.",
  pretAccorde:
    "Le comité accepte le prêt de 300 k€ sur cinq ans à 4,4 %, contre un nantissement du fonds de commerce. Les fonds seront versés en semaine 6, une fois la garantie inscrite.",
  pretRefuse:
    "Le comité refuse : un prêt à cinq ans pour un besoin de quelques semaines, ce n'est pas l'usage. Votre facilité de caisse reste de 50 k€.",
  relevementAccorde:
    "Le comité accepte, du bout des lèvres, de porter votre facilité de caisse à 300 k€ jusqu'au 30 septembre, à 8,5 %. Il vous rappelle qu'une facilité de caisse se révise à tout moment.",
  relevementRefuse:
    "Le comité refuse de porter un découvert à 300 k€ sans plan de trésorerie. Votre facilité de caisse reste de 50 k€.",
  alpineAccepte:
    "Sans les fêtes ni février… C'est votre hôtel, après tout. D'accord pour 280 € sur les onze autres semaines : le contrat part ce soir.",
  alpineRefuse:
    "Sans les fêtes ni février, l'offre ne nous intéresse plus : nos clients veulent Noël à Megève. Nous irons voir ailleurs.",
} as const;
