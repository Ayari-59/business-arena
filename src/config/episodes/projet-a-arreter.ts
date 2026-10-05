/**
 * LE PROJET QU'ON N'OSE PAS ARRÊTER — le contenu de l'épisode.
 *
 * Malika Duplantier est directrice générale adjointe d'Arvel Distribution.
 * Elle hérite d'Arvel Maison, trois showrooms pour particuliers lancés il y
 * a dix-huit mois par son prédécesseur et présentés à la presse par le
 * président comme « la deuxième jambe du groupe ». Les visites montent, les
 * ventes ne suivent pas, le compte analytique affiche une lourde perte, et
 * l'équipe du projet demande une relance. Six décisions, chacune précédée de
 * ce qu'une directrice générale adjointe reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : le compte des showrooms et la perte qu'ils font
 * vraiment perdre, le loyer dû jusqu'à l'échéance, la valeur des flux futurs
 * de chaque option pour chaque site, les offres de Brémond.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  AGRANDIR,
  AMORTISSEMENT,
  ARTISANS,
  AUTOMNE,
  DEJA_DEPENSE,
  ECHEANCE,
  ECULLY,
  INFORMATION,
  MARGE,
  OFFRES,
  PRINTEMPS,
  QUOTE_PART_SIEGE,
  REDUIRE,
  RELANCE,
  RESULTAT_ANALYTIQUE,
  RILLIEUX,
  SAINT_PRIEST,
  SALON,
  type Site,
} from "@/engine/episodes/projet-a-arreter";
import { kE, nombre, taux } from "./format";
import type { Etape } from "./types";

const HIPPOLYTE = { de: "Hippolyte Darnaud", role: "Président d'Arvel Distribution" } as const;
const ACHILLE = { de: "Achille Montreuil", role: "Directeur d'Arvel Maison" } as const;
const PHILOMENE = {
  de: "Philomène Kassab",
  role: "Directrice administrative et financière",
} as const;
const SOUKAINA = { de: "Soukaïna Mernissi", role: "Contrôleuse de gestion" } as const;
const JUN = { de: "Jun Takeda", role: "Consultant, cabinet Silvacane" } as const;
const OTTAVIA = { de: "Ottavia Brémond", role: "Gérante des Faïenceries Brémond" } as const;
const YAELLE = { de: "Yaëlle Brochard", role: "Responsable du showroom de Rillieux" } as const;
const NATHAN = { de: "Nathan Bouvreuil", role: "Responsable du showroom de Saint-Priest" } as const;
const ELIOTT = {
  de: "Wenceslas Grandjean",
  role: "Directeur de l'agence de Saint-Priest",
} as const;
const BETTINA = { de: "Bettina Laforgue", role: "Responsable du showroom d'Écully" } as const;
const AUGUSTIN = {
  de: "Pacôme Sorel",
  role: "Gestionnaire, Foncière Ravenel (bailleur d'Écully)",
} as const;

/** Les sommes déjà dépensées, en millions d'euros. */
const M_EUROS = `${nombre(DEJA_DEPENSE / 1e6, 1)} M€`;

/** Le compte d'un site, tel que la contrôleuse de gestion le présente. */
const compte = (s: Site) =>
  `${s.nom} : ${kE(s.ventes)} de ventes aux particuliers ; loyer ${kE(s.loyer)}, personnel ${kE(s.personnel)}, autres frais ${kE(s.autres)}`;

export const DIAGNOSTICS = [
  {
    id: "avenir",
    t: "Le projet est jugé sur ce qu'il a coûté et sur des visites flatteuses : il faut juger chaque site sur ses flux à venir, avec des critères fixés avant de lire les chiffres",
  },
  {
    id: "sites",
    t: "Deux des trois showrooms n'atteindront jamais l'équilibre : seul Écully mérite qu'on continue",
  },
  {
    id: "notoriete",
    t: "Dix-huit mois, c'est trop tôt : les showrooms manquent de notoriété, il faut leur donner les moyens de décoller",
  },
  {
    id: "echec",
    t: "Le projet perd près de 400 k€ par an : c'est un échec, il faut fermer les trois showrooms au plus vite",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Arvel Maison, dix-huit mois après",
    jusqua: 2,
    messages: () => [
      {
        ...HIPPOLYTE,
        heure: "08:10",
        alerte: true,
        texte:
          "Malika, bienvenue dans le dossier Arvel Maison. J'ai annoncé ces showrooms à la convention et dans la presse : c'est la deuxième jambe du groupe. L'équipe d'Achille demande une relance pour l'automne. Le comité se réunit vendredi prochain ; je compte sur toi.",
      },
      {
        ...ACHILLE,
        heure: "09:00",
        texte: `Les visites ont pris 30 % en un an, les devis aussi. Il nous manque de la notoriété : ${kE(RELANCE.campagne)} de campagne et l'ouverture le dimanche, et on est à l'équilibre dans dix-huit mois. Avec ${M_EUROS} déjà investis, s'arrêter au milieu du gué serait un gâchis.`,
      },
      {
        ...PHILOMENE,
        heure: "10:30",
        texte: `Le compte analytique d'Arvel Maison est à ${kE(RESULTAT_ANALYTIQUE)} sur douze mois. Je ne te dis pas quoi faire, mais je ne financerai pas une rallonge sur des visites.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "comptes",
        titre: "Reprendre le compte d'exploitation des trois showrooms, site par site",
        cout: 1,
        nature: "decisive",
        resultat: `Sur les douze derniers mois. ${compte(ECULLY)}. ${compte(SAINT_PRIEST)}. ${compte(RILLIEUX)}. Les ventes aux particuliers dégagent ${taux(MARGE, 0)} de marge sur coût variable. Le compte analytique du projet affiche ${kE(RESULTAT_ANALYTIQUE)} : il comprend ${kE(AMORTISSEMENT)} d'amortissement des ${M_EUROS} de travaux, d'agencement et de lancement déjà payés (sur dix ans), et ${kE(QUOTE_PART_SIEGE)} de quote-part des frais du siège, qui resteraient aux agences si les showrooms fermaient.`,
      },
      {
        id: "baux",
        titre: "Relire les trois baux et leur calendrier",
        cout: 0.5,
        nature: "decisive",
        resultat: `Trois baux commerciaux 3-6-9. Leur échéance triennale tombe en semaine ${ECHEANCE} : le congé se donne six mois avant, donc avant la fin du trimestre. Sans congé, chaque bail repart pour trois ans. Après un congé, le loyer reste dû jusqu'à l'échéance, six mois. Les baux sont cessibles : un repreneur peut prendre le bail et l'agencement, et il ne reste alors plus rien à payer.`,
      },
      {
        id: "panel",
        titre: "Interroger la fédération du négoce sur les showrooms comparables",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La fédération a suivi une quinzaine de showrooms ouverts aux particuliers par des négoces depuis dix ans. Au bout de trois ans, un sur quatre a trouvé son public ; près de la moitié plafonnent sous l'équilibre ; trois sur dix ont reculé une fois l'effet de nouveauté passé. Dans tous les cas, les visites et les devis ont monté les deux premières années : ce qui distinguait ceux qui ont réussi, c'est le taux de transformation des devis et la part des clients qui reviennent.",
      },
      {
        id: "plan",
        titre: "Recevoir l'équipe d'Arvel Maison et son plan de relance",
        cout: 1,
        nature: "bruit",
        resultat:
          "Achille Montreuil présente un plan soigné : avec la campagne et l'ouverture le dimanche, 25 % de visites en plus et l'équilibre dans dix-huit mois. Les projections partent des visites, et supposent que le taux de transformation des devis remonte à 32 %, celui de l'ouverture.",
      },
      {
        id: "conseil",
        titre: "Appeler Armance Vidalenc, ancienne directrice de la stratégie d'un distributeur",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Armance Vidalenc : « Ce qui est dépensé ne reviendra pas, quoi que tu décides. Avant de regarder les chiffres du trimestre, écris avec le président ce que chaque site doit montrer, et à quelle date. Sinon, chacun lira les chiffres qui l'arrangent, toi comprise. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au comité de vendredi ?",
    options: [
      {
        t: "Voter la relance demandée, pour donner sa chance à un projet que le président a annoncé",
        d: `${kE(RELANCE.campagne)} de campagne sur six semaines, et l'ouverture le dimanche : ${kE(RELANCE.dimanche)} de personnel par site et par an.`,
      },
      {
        t: "Geler toute dépense nouvelle et faire valider par le président des critères chiffrés et datés, site par site",
        d: "La campagne d'automne de l'équipe est suspendue. Les critères seront revus au comité de la semaine 10.",
      },
      {
        t: "Proposer l'arrêt des trois showrooms : le projet a déjà perdu trop d'argent",
        d: "Les baux seraient dénoncés à l'échéance ; le comité devra trancher.",
      },
      {
        t: "Laisser tourner sans rien changer, et juger au bilan annuel",
        d: `La campagne d'automne déjà engagée par l'équipe continue : ${kE(AUTOMNE.campagne)}. Rien de neuf à voter.`,
      },
    ],
    reactions: [
      [
        {
          ...HIPPOLYTE,
          texte:
            "Le comité vote la relance. Merci, Malika : c'est le signal que l'équipe attendait.",
        },
      ],
      [
        {
          ...HIPPOLYTE,
          texte:
            "D'accord pour des critères, s'ils sont justes pour le projet. On les écrit ensemble mardi, et je les signe.",
        },
        {
          ...ACHILLE,
          texte: "On suspend la campagne d'automne. J'espère qu'on ne le regrettera pas.",
        },
      ],
      [
        {
          ...HIPPOLYTE,
          texte:
            "Non. Je ne lâche pas un projet annoncé à la presse sur une impression. Et l'équipe d'Achille l'a appris dans le couloir.",
        },
      ],
      [{ ...ACHILLE, texte: "On continue. La campagne d'automne démarre lundi." }],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les visites montent",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...ACHILLE,
        heure: "09:20",
        alerte: true,
        texte: `Les visites ont pris 30 % en un an ; depuis la rentrée, elles sont encore ${ctx.visitesHausse}, et les devis suivent. Ça décolle, comme je le disais.`,
      },
      {
        ...SOUKAINA,
        heure: "14:00",
        texte: `Les ventes aux particuliers sont ${ctx.ventesHausse} sur la même période, et le taux de transformation des devis est à ${ctx.transformation}. Je ne sais pas qui signe et qui ne signe pas : nos caisses ne le disent pas.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "entonnoir",
        titre: "Mettre côte à côte visites, devis et ventes depuis l'ouverture",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Depuis l'ouverture, les visites ont pris 30 %, les devis 26 %, les ventes aux particuliers 4 %. Le taux de transformation des devis est passé de 32 % à 22 %. À Saint-Priest, les vendeurs notent qu'une part croissante des clients viennent avec leur artisan, choisissent, puis l'artisan commande à son comptoir habituel : ces ventes ne figurent pas dans les comptes du showroom. Personne ne les a comptées.",
      },
      {
        id: "silvacane",
        titre: "Demander au cabinet Silvacane ce qu'une analyse permettrait de trancher",
        cout: 0.5,
        nature: "utile",
        resultat: `Jun Takeda : « Pour ${kE(INFORMATION.analyse)}, en trois semaines, nous rapprochons les devis, les ventes et les comptes clients des agences : qui achète, qui revient, et quels artisans amènent leurs clients, avec leurs noms. Une étude auprès de 800 ménages coûterait ${kE(INFORMATION.etude)}, résultats en semaine 12 : elle dirait si le marché existe, pas qui achète chez vous. Une enquête de satisfaction dira que les visiteurs aiment vos showrooms : ils les aiment toujours. »`,
      },
    ],
    question: "Que lancez-vous pour y voir clair ?",
    options: [
      {
        t: "Faire analyser les ventes et les devis client par client : qui achète, qui revient, quels artisans amènent leurs clients",
        d: `${kE(INFORMATION.analyse)} ; résultats en semaine ${INFORMATION.resultats}.`,
      },
      {
        t: "Commander une étude de marché auprès de 800 ménages de l'agglomération",
        d: `${kE(INFORMATION.etude)} ; résultats en semaine 12.`,
      },
      {
        t: "Rien de plus : le tableau de bord du projet suffit, les visites parlent d'elles-mêmes",
        d: "Rien à payer. Visites, devis et ventes chaque lundi.",
      },
      {
        t: "Faire une enquête de satisfaction auprès des visiteurs des trois showrooms",
        d: `${kE(INFORMATION.satisfaction)} ; résultats en semaine 5.`,
      },
    ],
    reactions: [
      [{ ...JUN, texte: "Nous commençons lundi. Premiers résultats en semaine 6." }],
      [
        {
          ...SOUKAINA,
          texte: "Commande passée. Les résultats tomberont après le comité de la semaine 10.",
        },
      ],
      [{ ...ACHILLE, texte: "Merci de votre confiance. Les chiffres parlent d'eux-mêmes." }],
      [{ ...ACHILLE, texte: "Bonne idée : nos clients nous adorent, vous allez voir." }],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Brémond s'intéresse à Rillieux",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...OTTAVIA,
        heure: "10:15",
        alerte: true,
        texte:
          "Madame Duplantier, nous cherchons un emplacement au nord de Lyon pour nos salles de bains. Votre showroom de Rillieux nous intéresserait, bail et agencement, si vous envisagiez de le céder. Rien d'officiel, bien sûr.",
      },
      {
        ...HIPPOLYTE,
        heure: "12:30",
        texte:
          "On me dit que Brémond tourne autour de Rillieux. Arvel Maison, c'est trois showrooms : c'est ce que j'ai dit à la presse.",
      },
      {
        ...YAELLE,
        heure: "17:40",
        texte: `${ctx.visitesRillieux} visites cette semaine, et neuf devis signés. Les gens viennent voir, et ils achètent en grande surface de bricolage.`,
      },
    ],
    sources: [
      {
        id: "rillieux",
        titre: "Chiffrer chaque option pour Rillieux sur trois ans",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Au taux du groupe, flux à venir seulement, selon que le marché des particuliers décolle, plafonne ou recule. Garder Rillieux tel quel : ${ctx.rGarder}. Réduire la voilure : ${ctx.rReduire}. Fermer : le loyer jusqu'à l'échéance, ${ctx.rLoyer} actualisés, et ${kE(RILLIEUX.fermeture)} de déstockage et de démontage, soit ${ctx.rFermer} dans tous les cas. Céder le bail et l'agencement à un repreneur : plus de loyer ni de déstockage, et le prix qu'il paiera. Les ${kE(RILLIEUX.travaux)} de travaux de Rillieux ne reviendront dans aucun cas.`,
      },
      {
        id: "bremond",
        titre: "Se renseigner sur les Faïenceries Brémond",
        cout: 0.5,
        nature: "utile",
        resultat: `Une entreprise familiale, neuf showrooms en Rhône-Alpes. En cinq ans, elle a repris deux sites de concurrents, chaque fois négociés discrètement, avant toute annonce : ${kE(OFFRES.haute)} pour le droit au bail et l'agencement quand le marché des particuliers était bon, ${kE(OFFRES.basse)} sinon, le stock repris au prix d'achat. Une fois sur cinq, elle a renoncé, tard, après des semaines de discussion. Quand une fermeture était déjà annoncée, elle a attendu la fin du bail pour louer le local au propriétaire, sans rien payer.`,
      },
    ],
    question: "Que faites-vous de Rillieux ?",
    options: [
      {
        t: "Négocier discrètement avec Brémond la reprise du bail, de l'agencement et du stock",
        d: "La cession passera au comité de la semaine 10. Brémond fera une offre, ou renoncera.",
      },
      {
        t: "Fermer Rillieux et donner congé pour l'échéance",
        d: `Le loyer reste dû jusqu'à l'échéance ; ${kE(RILLIEUX.fermeture)} de déstockage. Le comité de la semaine 10 doit valider.`,
      },
      {
        t: "Garder Rillieux : dix-huit mois, c'est trop tôt pour juger, et le président y tient",
        d: "Rien ne change ; sans congé, le bail repart pour trois ans.",
      },
      {
        t: "Réduire la voilure à Rillieux : horaires réduits, un poste en moins, plus de publicité",
        d: `${kE(REDUIRE.fixes)} de charges en moins par an ; moins de visites et de ventes.`,
      },
    ],
    reactions: [
      null,
      [
        {
          ...YAELLE,
          texte:
            "Je préviens l'équipe ce soir. Les deux vendeurs seront reclassés en agence, à Caluire et à Neuville.",
        },
      ],
      [{ ...HIPPOLYTE, texte: "Bien. On ne recule pas au premier coup de vent." }],
      [
        {
          ...YAELLE,
          texte:
            "On ferme le lundi et le samedi après-midi. Ruben part à l'agence de Caluire. La publicité s'arrête à la fin du mois.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Saint-Priest : tenir le cap ?",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...ACHILLE,
        heure: "09:00",
        alerte: true,
        texte: `Les visites sont ${ctx.visitesHausse} depuis la rentrée. Pour le salon de l'habitat de la semaine ${SALON.semaine}, le stand de Saint-Priest est réservé (${kE(SALON.stand)}). J'y ajouterais une campagne et un vendeur : ${kE(SALON.renfort)} de plus. C'est maintenant que ça se joue.`,
      },
      ctx.analyse
        ? {
            ...JUN,
            heure: "11:30",
            texte:
              "Premiers résultats. À Saint-Priest, 46 % des montants signés depuis janvier viennent de clients venus avec leur artisan, et la part monte chaque mois ; les particuliers seuls achètent moins à chaque visite. Trente-huit artisans amènent quatre de ces clients sur cinq : vous avez leurs noms.",
          }
        : {
            ...SOUKAINA,
            heure: "11:30",
            texte:
              "Je n'ai toujours que les visites, les devis et les ventes du showroom. Ce que les artisans commandent ensuite au comptoir de l'agence, je ne le vois pas.",
          },
      {
        ...ELIOTT,
        heure: "16:20",
        texte:
          "Mes artisans amènent leurs clients au showroom pour choisir le carrelage et la douche, puis ils commandent chez moi. Si vous fermez, je perds ça. Si vous en faisiez leur showroom, je vous en amène le double.",
      },
    ],
    sources: [
      {
        id: "options",
        titre: "Chiffrer chaque option pour Saint-Priest sur trois ans",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Au taux du groupe, flux à venir seulement, selon que le marché des particuliers décolle, plafonne ou recule. Garder Saint-Priest au format particuliers : ${ctx.sTenir}. En faire le showroom des artisans et de leurs clients, ${kE(ARTISANS.travaux)} d'aménagement compris : ${ctx.sArtisans}${
            ctx.analyse
              ? ", avec la liste des artisans qui amènent déjà leurs clients"
              : " ; sans la liste des artisans qui amènent déjà leurs clients, le démarrage sera plus lent"
          }. Le fermer : ${ctx.sFermer} dans tous les cas, loyer jusqu'à l'échéance et déstockage. Les ${kE(SAINT_PRIEST.travaux)} de travaux ne reviendront dans aucun cas.`,
      },
      {
        id: "salon",
        titre: "Relire les chiffres des quatre derniers salons de l'habitat",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Chaque année, un record de visites sur les stands, dans tous les showrooms de la région, bons et mauvais ; trois semaines plus tard, des ventes qui n'ont pas bougé. Le salon dit que les gens aiment regarder, pas qu'ils achètent : ce n'est pas un test.",
      },
      {
        id: "avis",
        titre: "Lire les avis en ligne sur Saint-Priest",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "4,7 sur 5, 212 avis. « Très beau showroom », « conseillère adorable », « on a eu plein d'idées pour notre salle de bains ». Rien sur ce que les clients ont acheté, ni où.",
      },
    ],
    question: "Que faites-vous de Saint-Priest ?",
    options: [
      {
        t: "Attendre les chiffres du salon de l'habitat pour décider",
        d: `Le stand réservé est tenu (${kE(SALON.stand)}) ; décision au comité de la semaine 10.`,
      },
      {
        t: "Tenir le cap : les visites montent, renforcer Saint-Priest pour le salon",
        d: `Le stand, une campagne et un vendeur de plus : ${kE(SALON.stand + SALON.renfort)} en semaine 8.`,
      },
      {
        t: "Changer de cap : en faire le showroom des artisans et de leurs clients",
        d: `${kE(ARTISANS.travaux)} d'aménagement ; un poste et demi redéployé en agence ; plus de publicité grand public. Nouveau format en semaine ${ARTISANS.debut}.`,
      },
      {
        t: "Fermer Saint-Priest et donner congé pour l'échéance",
        d: "Le loyer reste dû jusqu'à l'échéance ; le comité de la semaine 10 doit valider.",
      },
    ],
    reactions: [
      [{ ...ACHILLE, texte: "On tient le stand. Vous verrez les chiffres du salon." }],
      [{ ...ACHILLE, texte: "Merci. On va faire un salon record." }],
      [
        {
          ...ELIOTT,
          texte:
            "Je fais la liste des artisans avec Nathan dès lundi. On ouvre le nouveau format dans deux semaines.",
        },
      ],
      [
        {
          ...NATHAN,
          texte:
            "Je l'annonce à l'équipe. Wenceslas n'est pas content : ses artisans y amenaient leurs clients.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Le comité de mardi",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...HIPPOLYTE,
        heure: "08:30",
        alerte: true,
        texte:
          "Malika, le comité, c'est mardi. Je veux savoir ce qu'on fait d'Arvel Maison. Et je ne veux pas lire dans la presse qu'on a jeté 2,4 M€ par la fenêtre.",
      },
      {
        ...ACHILLE,
        heure: "10:00",
        texte: `Salon de l'habitat : ${ctx.visites} visites cette semaine sur les showrooms, un record. Donnez-nous un an, avec une campagne de printemps.`,
      },
      {
        ...PHILOMENE,
        heure: "15:00",
        texte:
          "Je soutiendrai ce qui est chiffré site par site, flux à venir seulement. Les 2,4 M€, personne ne les récupérera.",
      },
    ],
    sources: [
      {
        id: "criteres",
        titre: "Mettre chaque site face aux critères",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.criteres
              ? "Les critères signés avec le président en semaine 2 : chaque site doit montrer une marge qui couvre ses charges fixes dans les dix-huit mois, ou un autre usage qui vaut plus. Le président les a signés ; ils jugent le projet, pas son auteur."
              : "Aucun critère n'a été fixé à l'avance : ceux que vous proposerez mardi pourront passer pour taillés sur mesure."
          } Ce qui dépend du comité : ${ctx.enJeu}. Si le recentrage est gelé jusqu'au bilan annuel, les congés ne partent pas avant l'échéance : six mois de pertes de plus pour chaque site à fermer ou à céder, et un repreneur qui n'attendra pas.`,
      },
      {
        id: "president",
        titre: "Demander à Philomène Kassab comment le président a pris les arrêts passés",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Philomène Kassab : « Quand on a fermé le dépôt de Vaulx, il y a quatre ans, il a accepté, parce que le dossier montrait les critères fixés à l'avance et ce qu'on gardait. L'an dernier, il a refusé net un arrêt présenté comme l'erreur de l'ancien directeur commercial. Il a besoin de pouvoir dire que le groupe pilote, pas qu'il s'est trompé. Avec des critères qu'il a signés, je dirais neuf fois sur dix ; sans, sept ; si on lui parle d'erreur, quatre. Et moins encore s'il a déjà dû refuser un arrêt. »",
      },
    ],
    question: "Comment présentez-vous Arvel Maison au comité ?",
    options: [
      {
        t: "Présenter chaque site face aux critères : ce qu'on garde, ce qu'on transforme, ce qu'on arrête, et la prochaine revue datée",
        d: "Les chiffres de chaque site, flux à venir seulement ; la prochaine revue en juin.",
      },
      {
        t: "Demander un an de plus pour les trois showrooms, avec une campagne de printemps",
        d: `${kE(PRINTEMPS.campagne)} de campagne ; aucune fermeture ni cession avant l'an prochain.`,
      },
      {
        t: "Présenter le recentrage comme la correction des erreurs du plan de départ",
        d: "Le plan de départ face aux chiffres réels, ligne à ligne.",
      },
      {
        t: "Ne rien présenter ce trimestre : attendre le bilan annuel",
        d: "Les congés ne partent pas ; on en reparlera en mars.",
      },
    ],
    reactions: [
      [{ ...PHILOMENE, texte: "Dossier solide. Je le soutiens mardi." }],
      [
        {
          ...HIPPOLYTE,
          texte: "Voilà ce que je voulais entendre. Un an, pas un jour de plus.",
        },
      ],
      [
        {
          ...ACHILLE,
          texte:
            "Vous présentez ça comme ça ? Le président a signé ce plan avec Pierre-Yves Morlet, votre prédécesseur.",
        },
      ],
      [{ ...PHILOMENE, texte: "Comme tu veux. Les congés ne partiront pas ce trimestre." }],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Écully, la vitrine",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...AUGUSTIN,
        heure: "09:45",
        alerte: true,
        texte:
          "Madame Duplantier, l'échéance triennale du bail d'Écully approche : sans congé avant la fin du mois, il repart pour trois ans. La cellule voisine se libère, 150 m² : votre président nous en a parlé pour vos cuisines.",
      },
      {
        ...HIPPOLYTE,
        heure: "11:00",
        texte:
          "Écully, c'est la vitrine. Avec la cellule voisine, on y montrerait enfin les cuisines, comme le prévoyait le plan.",
      },
      {
        ...BETTINA,
        heure: "18:10",
        texte: ctx.lecture
          ? "Silvacane a mis à jour son analyse d'Écully, client par client : elle est dans votre dossier. Les visites, elles, n'ont jamais été aussi hautes."
          : "Visites en hausse, salon record. Les devis signés, je les compte à la main : je dirais que ça stagne, mais je n'en suis pas sûre.",
      },
    ],
    sources: [
      {
        id: "ecully",
        titre: "Chiffrer chaque option pour Écully sur trois ans",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Au taux du groupe, flux à venir seulement, selon que le marché des particuliers décolle, plafonne ou recule. Continuer tel quel : ${ctx.eTelQuel}. Passer au format artisans dès maintenant, aménagement compris : ${ctx.eArtisans}. Continuer à l'essai jusqu'en juin : ${ctx.eEssai}${
            ctx.lisible
              ? ", parce que le critère se lira sur les ventes, client par client : Écully basculera si le marché ne décolle pas"
              : " : le seul critère que vous pouvez suivre chaque mois, ce sont les visites et les devis, qui montent dans tous les scénarios ; il ne se déclenchera jamais"
          }. Prendre la cellule voisine, ${kE(AGRANDIR.travaux)} de travaux compris : ${ctx.eAgrandir}. Le million d'euros de travaux d'Écully ne reviendra dans aucun cas.`,
      },
      {
        id: "signaux",
        titre: "Relire les signaux de l'automne à Écully",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.analyse
            ? `L'analyse client par client, mise à jour : ${ctx.tendance}`
            : `Les visites des showrooms sont ${ctx.visitesHausse} depuis la rentrée, salon passé, et les devis suivent. Sans l'analyse client par client, personne ne sait qui achète, ni si les clients reviennent.`,
      },
    ],
    question: "Que décidez-vous pour Écully ?",
    options: [
      {
        t: "Ne rien changer : laisser le bail se renouveler et continuer",
        d: "Rien à payer ; trois ans de bail de plus.",
      },
      {
        t: "Transformer Écully dès maintenant en showroom des artisans et de leurs clients",
        d: `${kE(ARTISANS.travaux)} d'aménagement en semaine 12 ; un poste et demi redéployé.`,
      },
      {
        t: "Continuer à l'essai jusqu'en juin, avec un critère écrit : s'il n'est pas atteint, Écully passe au format artisans",
        d: `Rien à payer maintenant ; ${kE(ARTISANS.travaux)} d'aménagement en juin si le critère n'est pas atteint.`,
      },
      {
        t: "Reconduire le bail et prendre la cellule voisine pour y montrer les cuisines",
        d: `${kE(AGRANDIR.travaux)} de travaux, ${kE(AGRANDIR.loyer)} de loyer de plus par an ; ouverture au printemps.`,
      },
    ],
    reactions: [
      [{ ...BETTINA, texte: "On continue comme avant. Le bail repart pour trois ans." }],
      [
        {
          ...BETTINA,
          texte:
            "On prépare le nouveau format avec l'agence de Tassin : ses artisans viendront avec leurs clients dès janvier.",
        },
      ],
      [
        {
          ...HIPPOLYTE,
          texte:
            "Un critère écrit, une date. D'accord : je veux le voir en juin, et je le lirai avec toi.",
        },
      ],
      [{ ...HIPPOLYTE, texte: "Enfin une bonne nouvelle pour Arvel Maison." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Le critère avant l'histoire", chemin: [1, 0, 0, 2, 0, 2] },
  { nom: "Sauver le projet du président", chemin: [0, 2, 2, 1, 1, 3] },
  { nom: "Attentiste", chemin: [3, 2, 2, 0, 3, 0] },
] as const;

/**
 * Les réflexes de l'escalade d'engagement : remettre de l'argent pour ne
 * pas avoir dépensé pour rien et parce que le président l'a annoncé, lire les
 * visites qui montent plutôt que les ventes qui ne suivent pas, garder un
 * site perdu, tenir le cap au salon, demander un an de plus, agrandir la
 * vitrine. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 2],
  [2, 2],
  [3, 1],
  [4, 1],
  [5, 3],
] as const;

export const REPONSES = {
  offreHaute: `Après visite : ${kE(OFFRES.haute)} pour le droit au bail et l'agencement, le stock repris au prix d'achat. Sous réserve de l'accord de votre comité, bien sûr.`,
  offreBasse: `Après visite : ${kE(OFFRES.basse)} pour le droit au bail et l'agencement, le stock repris au prix d'achat. Le marché des particuliers n'est pas brillant ; c'est notre prix.`,
  enAttente:
    "Nous regardons sérieusement. Laissez-nous quelques semaines pour revenir vers vous avec un chiffre.",
  renonce:
    "Après réflexion, nous renonçons à Rillieux : l'emplacement ne nous convainc pas. Désolée de vous avoir fait attendre.",
  accord:
    "Le comité valide le recentrage. Le président l'a présenté lui-même : « Arvel Maison se recentre sur ce qui marche, selon les critères que nous nous étions fixés. »",
  accordCorrection:
    "Le comité valide le recentrage, du bout des lèvres. Le président n'a pas pris la parole ; Achille non plus.",
  gel: "Le président gèle le recentrage jusqu'au bilan annuel : « On ne défait pas en un trimestre ce qu'on a annoncé il y a dix-huit mois. » Les congés ne partiront pas avant l'échéance.",
  rallonge:
    "Le comité accorde un an de plus aux trois showrooms. Aucune fermeture, aucune cession avant l'an prochain ; la campagne de printemps est votée.",
  rienPresente:
    "Arvel Maison n'était pas à l'ordre du jour. Les congés ne sont pas partis : les fermetures attendront le bilan annuel.",
  priseDActe: "Le comité prend acte de la nouvelle organisation d'Arvel Maison.",
  salonGarde:
    "Le salon a battu son record de visites : faute d'autre chiffre, le comité garde Saint-Priest tel quel, comme Achille le demandait.",
} as const;

/** Ce que l'analyse client par client dit des ventes d'Écully, selon ce que le trimestre révèle. */
export const LECTURES_ECULLY = [
  "à clientèle comparable, les ventes aux particuliers d'Écully progressent de 20 % sur un an, et un client sur quatre revient : la trajectoire des showrooms qui ont trouvé leur public.",
  "à clientèle comparable, les ventes aux particuliers d'Écully sont stables sur un an, et peu de clients reviennent : la trajectoire des showrooms qui plafonnent.",
  "à clientèle comparable, les ventes aux particuliers d'Écully reculent de 12 % sur un an, et presque aucun client ne revient : l'effet de nouveauté est passé.",
] as const;
