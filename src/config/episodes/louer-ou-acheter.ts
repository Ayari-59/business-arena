/**
 * LOUER OU ACHETER — le contenu de l'épisode.
 *
 * Salomé Cordier est responsable d'Arvel Location, l'activité de location de
 * matériel aux artisans d'Arvel Distribution : mini-pelles, nacelles,
 * échafaudages, bétonnières. Le parc doit être renouvelé et agrandi avant la
 * saison, et chaque machine peut s'acheter à crédit, se prendre en
 * crédit-bail, en location longue durée, ou se louer à la journée chez un
 * loueur partenaire. Six décisions, chacune précédée de ce qu'une
 * responsable de parc reçoit vraiment.
 *
 * Le piège de l'épisode : comparer la mensualité d'emprunt au loyer et
 * acheter « parce qu'on finit propriétaire », ou louer « parce que ça ne
 * sort pas de trésorerie », sans calculer le coût total à durée égale ni
 * compter la souplesse face à une demande incertaine. Les sources donnent de
 * quoi faire le bon calcul ; aucune ne le fait à la place du joueur.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const LAZARE = {
  de: "Lazare Brissac",
  role: "Directeur financier d'Arvel Distribution",
} as const;
const NILS = { de: "Nils Ferrando", role: "Chef d'atelier" } as const;
const MELINA = { de: "Mélina Agostini", role: "Responsable du comptoir" } as const;
const UGO = { de: "Ugo Lebreton", role: "Commercial, Valtrac Équipements" } as const;
const OMBELINE = {
  de: "Ombeline Rocheteau",
  role: "Chargée d'affaires entreprises, banque",
} as const;
const JOSSELIN = { de: "Josselin Marsan", role: "Chargé d'affaires, Belvia Bail" } as const;
const JOACHIM = { de: "Joachim Daubigny", role: "Commercial, Sillon Location" } as const;
const TIMEO = {
  de: "Timéo Castelli",
  role: "Responsable des achats, Elvatec Maintenance",
} as const;
const BERANGERE = {
  de: "Bérangère Maudet",
  role: "Conductrice de travaux, Ganivet Construction",
} as const;
const MOURAD = { de: "Mourad Benarbia", role: "Directeur, Sorlin Terrassement" } as const;
const TABLEAU = { de: "Tableau de bord d'Arvel Location", role: "Point hebdomadaire" } as const;

export const DIAGNOSTICS = [
  {
    id: "utilisation",
    t: "Une machine coûte un coût total, qui ne se justifie qu'au-delà d'un certain taux d'utilisation : le socle sûr de la demande se possède, la pointe incertaine se loue",
  },
  {
    id: "pannes",
    t: "Les anciennes mini-pelles coûtent trop cher en pannes : c'est leur renouvellement qui presse",
  },
  {
    id: "tresorerie",
    t: "La trésorerie ne permet pas d'acheter : il faut louer pour ne rien décaisser",
  },
  {
    id: "tarifs",
    t: "Les tarifs de location aux artisans sont trop bas pour payer un parc neuf",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Renouveler les mini-pelles",
    jusqua: 2,
    messages: () => [
      {
        ...LAZARE,
        heure: "08:15",
        alerte: true,
        texte:
          "Salomé, le comité a validé le renouvellement des quatre mini-pelles, et deux de plus pour la saison si tu le juges utile. Valtrac attend ta commande vendredi pour livrer en semaine 3. Je veux un dossier chiffré : ces machines, on les paiera trois ans.",
      },
      {
        ...UGO,
        heure: "09:00",
        texte:
          "Bonjour Madame Cordier. Pour vos mini-pelles de 2,5 t, deux formules : l'achat, que votre banque finance à 100 % sur 36 mois, ou notre location longue durée à 1 290 € par mois, entretien compris. La mensualité d'emprunt est à peine plus haute que le loyer, et au bout de trois ans les machines sont à vous.",
      },
      {
        ...NILS,
        heure: "10:20",
        texte:
          "Les quatre vieilles, je les tiens à bout de bras. La numéro 3 est encore sur le pont : flexible hydraulique, deuxième fois depuis Noël.",
      },
      {
        ...MELINA,
        heure: "11:05",
        texte:
          "On a déjà des réservations pour mars. L'an dernier, on a sous-loué chez Sillon presque tout le printemps.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "offres",
        titre: "Lire les offres de Valtrac et de la banque, ligne à ligne",
        cout: 1,
        nature: "decisive",
        resultat:
          "Mini-pelle de 2,5 t : 45 000 € HT, livrée en semaine 3 ; Valtrac reprend les anciennes à leur cote. Emprunt bancaire de 45 000 € sur 36 mois à 4,8 % : mensualité de 1 345 €. Entretien d'une machine neuve, au contrat du constructeur : 2 400 € par an. Cote de revente à trois ans : 22 000 €, entre 18 000 et 26 000 € selon le marché de l'occasion. Location longue durée : 36 loyers de 1 290 €, entretien compris ; la machine est rendue au terme, et la rendre la première année coûte les loyers restant dus jusqu'au douzième mois.",
      },
      {
        id: "planning",
        titre: "Reprendre le planning de location de l'an dernier, machine par machine",
        cout: 1,
        nature: "decisive",
        resultat:
          "Les quatre mini-pelles du parc ont tourné de 14 à 18 jours par mois sur l'année. Les journées sous-louées chez Sillon Location auraient occupé une cinquième machine 7 jours par mois en moyenne (2 en janvier, 13 en avril), et une sixième 3 jours. Sillon facture la journée 115 € jusqu'à fin février, 165 € en saison, à partir de mars. Les artisans paient la journée 175 €, que la machine soit à nous ou à Sillon.",
      },
      {
        id: "carnet",
        titre: "Ouvrir le carnet d'entretien des quatre anciennes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Huit ans et 7 000 heures chacune, amorties depuis deux ans. Douze pannes l'an dernier sur les quatre, 4 800 € de réparation en moyenne, une à deux semaines d'immobilisation à chaque fois ; l'entretien courant coûte 4 500 € par an et par machine. En novembre, Patxi Etcheverry, un terrassier fidèle, a menacé de partir après une panne sur son chantier.",
      },
      {
        id: "concurrents",
        titre: "Comparer les tarifs des loueurs concurrents",
        cout: 1,
        nature: "bruit",
        resultat:
          "Les loueurs de la région facturent une mini-pelle de 2,5 t entre 165 et 190 € la journée ; Arvel est à 175 €. Rien d'anormal.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Lazare Brissac",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Lazare : « Ne compare pas des mensualités. Compare ce que chaque solution coûte en tout sur les trois mêmes années, et demande-toi combien de jours par mois chaque machine tournera vraiment. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que commandez-vous vendredi ?",
    options: [
      {
        t: "Acheter six mini-pelles neuves à crédit",
        d: "1 345 € de mensualité par machine, à peine plus que le loyer de LLD, et le parc est à vous au bout de trois ans. Livraison en semaine 3.",
      },
      {
        t: "Acheter quatre mini-pelles à crédit, et louer les pointes chez Sillon Location",
        d: "Le socle renouvelé, livré en semaine 3 ; au-delà de quatre machines, le partenaire, à la journée.",
      },
      {
        t: "Prendre six mini-pelles en location longue durée",
        d: "1 290 € par mois et par machine, entretien compris, aucun apport, rien qui sorte de la trésorerie. Livraison en semaine 3.",
      },
      {
        t: "Garder les quatre anciennes une saison de plus",
        d: "Aucun investissement cette année ; le partenaire pour le reste, comme l'an dernier.",
      },
    ],
    reactions: [
      [
        {
          ...UGO,
          texte:
            "Six mini-pelles, c'est noté : elles seront chez vous le lundi de la semaine 3. Vous ne le regretterez pas, dans trois ans elles sont à vous.",
        },
      ],
      [
        {
          ...NILS,
          texte:
            "Quatre neuves, et les vieilles reprises par Valtrac. Pour les pointes, j'ai prévenu Sillon qu'on les appellerait.",
        },
      ],
      [
        {
          ...LAZARE,
          texte:
            "Six machines en LLD : rien au bilan, rien en trésorerie. J'espère que les loyers suivront.",
        },
      ],
      [
        {
          ...NILS,
          texte:
            "On garde les quatre vieilles. Je commande des flexibles d'avance, on va en avoir besoin.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Trois nacelles pour Elvatec",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...TIMEO,
        heure: "09:10",
        alerte: true,
        texte:
          "Madame Cordier, nous avons gagné l'entretien des centres commerciaux de l'est lyonnais. Il nous faut trois nacelles à ciseaux de 12 m, à demeure sur nos sites, cinq jours sur cinq, dès la semaine 4 et pour deux ans. Nous vous les payons 125 € la journée. Pouvez-vous suivre ?",
      },
      {
        ...JOSSELIN,
        heure: "11:30",
        texte:
          "Bonjour Madame Cordier. Pour des nacelles, le crédit-bail est fait pour vous : aucun apport, 36 loyers de 830 €, et une option d'achat à 1 % au bout.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Utilisation des mini-pelles cette semaine : ${ctx.utilisationMP}. Marge à date : ${ctx.marge}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "offres-nacelles",
        titre: "Mettre les offres côte à côte",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Nacelle à ciseaux de 12 m : 28 000 € HT, cote à trois ans 11 200 €, entretien 1 200 € par an. Crédit-bail Belvia : 36 loyers de 830 €, option d'achat de 280 € (1 %), entretien à votre charge. Location longue durée Valtrac : 36 loyers de 920 €, entretien compris, nacelle rendue au terme. Sillon Location : 95 € la journée, 130 € en saison à partir de mars.",
      },
      {
        id: "contrat-elvatec",
        titre: "Relire le projet de contrat d'Elvatec",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le contrat est ferme pour deux ans, résiliable seulement pour faute. Elvatec paie à 30 jours et n'a jamais eu un retard de paiement chez Arvel Distribution. Les nacelles restent sur ses sites, marquées à son nom.",
      },
      {
        id: "bilan",
        titre: "Demander à la comptabilité comment chaque formule apparaît dans les comptes",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "En crédit-bail comme en location longue durée, la nacelle n'est pas inscrite au bilan d'Arvel : les loyers passent en charges. En achat, elle est immobilisée et amortie, et l'emprunt figure au passif.",
      },
    ],
    question: "Comment fournissez-vous les trois nacelles d'Elvatec ?",
    options: [
      {
        t: "Prendre trois nacelles neuves en crédit-bail sur 36 mois",
        d: "830 € par mois et par nacelle, aucun apport, option d'achat à 1 % ; l'entretien est pour vous. Livrées en semaine 4.",
      },
      {
        t: "Les louer chez Sillon Location, au fur et à mesure",
        d: "Aucun engagement, rien qui sorte de la trésorerie à l'avance : 95 € la journée, 130 € à partir de mars.",
      },
      {
        t: "Les prendre en location longue durée sur 36 mois",
        d: "920 € par mois et par nacelle, entretien compris ; les nacelles sont rendues au bout de trois ans.",
      },
      {
        t: "Décliner : le parc de nacelles tourne déjà",
        d: "Les trois nacelles d'Arvel sont prises tout l'hiver. Elvatec ira voir ailleurs.",
      },
    ],
    reactions: [
      [
        {
          ...JOSSELIN,
          texte:
            "Le contrat de crédit-bail est signé ; les trois nacelles partent de chez Valtrac lundi pour les sites d'Elvatec.",
        },
      ],
      [
        {
          ...JOACHIM,
          texte:
            "Trois nacelles à la journée pour Elvatec, c'est entendu. Je vous rappelle qu'on passe aux tarifs de saison en mars.",
        },
      ],
      [
        {
          ...UGO,
          texte:
            "Location longue durée signée : les nacelles sont livrées lundi, l'entretien est pour nous.",
        },
      ],
      [
        {
          ...TIMEO,
          texte: "Dommage. Nous allons consulter un autre loueur.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le chantier de Ganivet",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...BERANGERE,
        heure: "08:40",
        alerte: true,
        texte:
          "Bonjour Salomé. On démarre la résidence des Tilleuls à Brignais en semaine 6, sur un terrain pas encore stabilisé : il me faut trois nacelles tout-terrain de 12 m. La phase 1 est ferme jusqu'à la semaine 8 ; la phase 2 suivra si le permis modificatif passe et si les ventes tiennent. 170 € la journée, comme d'habitude.",
      },
      {
        ...UGO,
        heure: "10:05",
        texte:
          "J'ai trois tout-terrain en stock, livrables en semaine 6, si vous me confirmez lundi.",
      },
      {
        ...OMBELINE,
        heure: "12:10",
        texte:
          "Madame Cordier, si vous achetez ces nacelles, nous les financerons comme les mini-pelles : 100 % du prix hors taxes, sur 36 mois, à 4,8 %.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Marge à date : ${ctx.marge}, pour un budget à date de ${ctx.budgetADate}.`,
      },
    ],
    sources: [
      {
        id: "ganivet",
        titre: "Regarder l'historique des chantiers de Ganivet",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ces trois dernières années, Ganivet a reporté une phase de chantier sur sept, et deux sur cinq l'année où les ventes de logements ont calé. Phase 1 : semaines 6 à 8. Phase 2 : de la semaine 9 jusqu'à l'été. Un report se décide en semaine 9, et dure plusieurs mois.",
      },
      {
        id: "tout-terrain",
        titre: "Chiffrer une tout-terrain : achat, revente, location",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Tout-terrain de 12 m : 36 000 € HT, cote à trois ans 14 400 €, entretien 1 500 € par an. Au bout de trois mois, elle se revend 85 % de son prix neuf sur un marché normal, une dizaine de points de moins quand les loueurs revendent tous en même temps ; 900 € de frais de revente. Location longue durée Valtrac : 1 180 € par mois, entretien compris ; la rendre la première année coûte les loyers restant dus jusqu'au douzième mois. Sillon loue la tout-terrain 125 € la journée, 160 € en saison.",
      },
      {
        id: "parc-nacelles",
        titre: "Voir si le parc de nacelles peut servir",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les nacelles d'Arvel sont électriques, pour l'intérieur et les sols stabilisés : aucune ne peut rouler sur le terrain de Brignais. Arvel n'a jamais eu de tout-terrain, et ses artisans n'en demandent pas.",
      },
    ],
    question: "Comment servez-vous le chantier de Ganivet ?",
    options: [
      {
        t: "Acheter trois nacelles tout-terrain à crédit",
        d: "36 000 € pièce, financés sur 36 mois, livrées en semaine 6. Elles restent au parc après le chantier.",
      },
      {
        t: "Les louer chez Sillon Location, le temps du chantier",
        d: "125 € la journée, 160 € en saison. Rendues dès que Ganivet n'en a plus besoin.",
      },
      {
        t: "Les prendre en location longue durée sur 36 mois",
        d: "1 180 € par mois et par nacelle, entretien compris, aucun apport. Livrées en semaine 6.",
      },
      {
        t: "Décliner le chantier : la phase 2 est trop incertaine",
        d: "Ganivet trouvera un autre loueur.",
      },
    ],
    reactions: [
      [
        {
          ...UGO,
          texte: "Les trois tout-terrain partent pour Brignais le lundi de la semaine 6.",
        },
        { ...BERANGERE, texte: "Merci Salomé, on compte sur vous." },
      ],
      [
        {
          ...JOACHIM,
          texte:
            "Trois tout-terrain réservées à partir de la semaine 6. Vous les rendez quand vous voulez, avec une semaine de préavis.",
        },
      ],
      [
        {
          ...UGO,
          texte: "Location longue durée signée pour trois tout-terrain, livrées en semaine 6.",
        },
      ],
      [
        {
          ...BERANGERE,
          texte:
            "Je comprends. Je vais voir avec un autre loueur ; pour la suite, ce sera plus compliqué.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Sillon passe aux tarifs de saison",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...JOACHIM,
        heure: "10:15",
        alerte: true,
        texte:
          "Bonjour Salomé. Comme chaque année, nos tarifs de saison s'appliquent à partir de la semaine 9 : 165 € la journée de mini-pelle au lieu de 115. Pour nos clients réguliers, je peux bloquer 115 € jusqu'à fin mars, contre un engagement de 25 journées au moins, payées même si vous ne les prenez pas.",
      },
      {
        ...UGO,
        heure: "14:30",
        texte:
          "Plutôt que d'enrichir un loueur, achetez deux mini-pelles de plus : livrées en semaine 9, et au bout de trois ans elles sont à vous. Je vous garde les conditions de janvier.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Mini-pelles au parc : ${ctx.flotteMP}. Journées sous-louées chez Sillon cette semaine : ${ctx.partenaireMP}. Utilisation des mini-pelles : ${ctx.utilisationMP}.`,
      },
    ],
    sources: [
      {
        id: "besoins",
        titre: "Demander à Mélina combien de journées il faudra sous-louer d'ici fin mars",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.grandParc
            ? "Mélina : « Avec six machines au parc, on ne devrait presque rien sous-louer d'ici la semaine 13 : une dizaine de journées si la saison est belle, aucune si elle se retourne. »"
            : "Mélina : « Avec les réservations de mars et la saison de l'an dernier, on devrait sous-louer une quarantaine de journées de mini-pelles d'ici la semaine 13 : une quinzaine si la saison se retourne, près de soixante-dix si elle est belle. »",
      },
      {
        id: "givors",
        titre: "Appeler Givors Matériel, un petit loueur de la vallée du Gier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Zohra Kebaïli, la gérante : « En saison, je peux vous louer des mini-pelles à 130 € la journée, sans engagement. Mais je n'en ai que quatre, et mes clients passent d'abord : une saison sur deux, elles sont toutes prises dès mars. »",
      },
    ],
    question: "Comment passez-vous la saison avec le partenaire ?",
    options: [
      {
        t: "Signer le contrat de saison de Sillon",
        d: "115 € la journée jusqu'à la semaine 13, 25 journées au moins ; celles qui ne sont pas prises sont dues quand même.",
      },
      {
        t: "Acheter deux mini-pelles de plus pour ne plus dépendre de Sillon",
        d: "45 000 € pièce à crédit, livrées en semaine 9 ; au bout de trois ans, elles sont à vous.",
      },
      {
        t: "Payer le tarif de saison, au jour le jour",
        d: "165 € la journée à partir de la semaine 9, seulement les jours où il en faut, sans engagement.",
      },
      {
        t: "Passer par Givors Matériel pour la saison",
        d: "130 € la journée sans engagement, s'il lui reste des machines ; Sillon au tarif de saison sinon.",
      },
    ],
    reactions: [
      [
        {
          ...JOACHIM,
          texte: "C'est signé : 115 € la journée jusqu'à fin mars, 25 journées au moins.",
        },
      ],
      [
        {
          ...UGO,
          texte:
            "Deux mini-pelles de plus, livrées en semaine 9. Vous ne dépendrez plus de personne.",
        },
      ],
      [
        {
          ...JOACHIM,
          texte:
            "Entendu. Appelez-nous quand vous en avez besoin ; en pleine saison, on fera au mieux.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "La vieille nacelle lâche",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...NILS,
        heure: "07:50",
        alerte: true,
        texte:
          "La vieille nacelle est sur cales : pompe hydraulique et vérin de levée. Devis : 5 400 €. Elle a onze ans et 9 500 heures, c'est sa troisième panne depuis l'automne.",
      },
      {
        ...LAZARE,
        heure: "09:20",
        texte:
          "Celle-là est amortie depuis longtemps : elle ne nous coûte plus rien. Fais-la réparer, et n'en parlons plus.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Utilisation des nacelles du parc cette semaine : ${ctx.utilisationNA}. Réparations à date : ${ctx.reparations}.`,
      },
    ],
    sources: [
      {
        id: "atelier",
        titre: "Faire le point avec Nils sur l'état de la nacelle",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Nils : « Une fois la pompe changée, il restera les flexibles, le faisceau et le moteur de translation. À cet âge, je compte près d'une chance sur cinq par semaine de la revoir à l'atelier, à 2 800 € la panne. Une pompe d'occasion coûterait 2 200 €, mais je ne l'aurai pas avant la semaine 12. » Un négociant la reprendrait en l'état, à sa cote.",
      },
      {
        id: "demande-nacelles",
        titre: "Regarder ce que la nacelle a fait cet hiver, et ce qui vient",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Elle a peu tourné en janvier, deux jours par semaine depuis la mi-février, et la demande de nacelles monte encore d'un quart d'ici fin mars : le parc courant aura besoin d'elle trois à cinq jours par semaine. Valtrac a une nacelle à ciseaux de 12 m en stock, livrable lundi, finançable en crédit-bail aux conditions de Belvia. Sillon la loue 130 € la journée en saison.",
      },
    ],
    question: "Que faites-vous de la vieille nacelle ?",
    options: [
      {
        t: "La faire réparer : elle est amortie, elle ne coûte plus rien",
        d: "5 400 €, de retour au parc dès la semaine 9.",
      },
      {
        t: "La céder en l'état, et louer chez Sillon les jours où le parc ne suffit pas",
        d: "Reprise à sa cote par un négociant ; 130 € la journée au partenaire, seulement quand il en faut une.",
      },
      {
        t: "La remplacer par une nacelle neuve en crédit-bail",
        d: "Livrée lundi, aux conditions de Belvia : 830 € par mois, option d'achat à 1 %. La vieille est cédée à sa cote.",
      },
      {
        t: "La laisser à l'atelier en attendant une pompe d'occasion",
        d: "2 200 € au lieu de 5 400, mais pas avant la semaine 12.",
      },
    ],
    reactions: [
      [
        {
          ...NILS,
          texte: "Pompe et vérin changés, elle repart lundi. Pour le reste, je ne promets rien.",
        },
      ],
      [
        {
          ...NILS,
          texte: "Le négociant l'a enlevée ce matin. Sillon nous dépannera les jours de pointe.",
        },
      ],
      [
        {
          ...JOSSELIN,
          texte:
            "Contrat signé : la nacelle neuve est livrée lundi, la vieille part chez le négociant.",
        },
      ],
      [
        {
          ...NILS,
          texte: "La pompe d'occasion arrive en semaine 12. D'ici là, on fait sans elle.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La saison va-t-elle tenir ?",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...LAZARE,
        heure: "08:30",
        alerte: true,
        texte:
          "Salomé, la fédération régionale du bâtiment annonce un recul des mises en chantier, et deux promoteurs ont gelé des programmes. Le comité veut savoir ce que ça peut coûter à Arvel Location, et ce que tu fais.",
      },
      {
        ...MOURAD,
        heure: "11:00",
        texte:
          "Bonjour Madame Cordier. Je cherche deux mini-pelles à demeure pour douze mois, quatre jours garantis par semaine, à partir de la semaine 11. Je les paie 131 € la journée, 25 % sous votre tarif. Il me faut une réponse ce soir.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Marge à date : ${ctx.marge}, pour un budget à date de ${ctx.budgetADate}. Mini-pelles au parc : ${ctx.flotteMP}.`,
      },
    ],
    sources: [
      {
        id: "federation",
        titre: "Lire la note de conjoncture de la fédération",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le scénario de la fédération : une chance sur trois que la demande de terrassement chute de moitié dès la semaine 11, et qu'elle ne revienne pas avant l'été. Le marché de l'occasion le sentirait aussitôt, les loueurs revendant tous en même temps. Au bilan du trimestre, une machine qui n'aura pas tourné quatre jours sur dix sur les trois dernières semaines sera ramenée à sa valeur de revente.",
      },
      {
        id: "sorlin",
        titre: "Se renseigner sur Sorlin Terrassement",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sorlin paie à 45 jours, sans incident depuis dix ans. Mourad Benarbia a signé ce genre de contrat avec d'autres loueurs ; deux fois sur cinq, il a accepté de remonter son prix quand on le lui demandait, les autres fois il est allé ailleurs.",
      },
    ],
    question: "Que répondez-vous à Sorlin ?",
    options: [
      {
        t: "Signer le contrat de Sorlin à 131 € la journée",
        d: "Deux mini-pelles du parc à demeure chez Sorlin, quatre jours garantis par semaine, pendant douze mois.",
      },
      {
        t: "Contre-proposer 157 € la journée",
        d: "Le même contrat, à 10 % sous le tarif au lieu de 25 %. Sorlin acceptera, ou ira ailleurs.",
      },
      {
        t: "Refuser : au tarif public, nos machines rapportent plus",
        d: "175 € la journée, au jour le jour, comme aujourd'hui.",
      },
    ],
    reactions: [
      [
        {
          ...MOURAD,
          texte: "Marché conclu. Nos chauffeurs passent prendre les deux machines lundi.",
        },
      ],
      null,
      [
        {
          ...MOURAD,
          texte: "Dommage. Je vais voir ailleurs.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Coût total et souplesse", chemin: [1, 0, 0, 0, 2, 0] },
  { nom: "Mensualités et trésorerie", chemin: [0, 1, 2, 1, 0, 2] },
  { nom: "Attentiste", chemin: [3, 3, 3, 2, 3, 2] },
] as const;

/**
 * Les réflexes du métier, [décision, option] : acheter « parce qu'on finit
 * propriétaire » (six mini-pelles, deux de plus pour ne plus dépendre du
 * partenaire), louer « parce que ça ne sort pas de trésorerie » (six LLD, les
 * nacelles d'Elvatec à la journée, des tout-terrain en LLD pour un chantier
 * incertain), et réparer une machine « amortie, qui ne coûte plus rien ».
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 1],
  [2, 2],
  [3, 1],
  [4, 0],
] as const;

export const REPONSES = {
  givorsOui:
    "C'est bon pour cette saison : j'ai des machines, à 130 € la journée, sans engagement. Appelez-moi la veille.",
  givorsNon:
    "Désolée, mes quatre mini-pelles sont réservées jusqu'en avril. Il faudra voir avec Sillon, à leur tarif de saison.",
  sorlinOui: "157 €, d'accord. Nos chauffeurs passent prendre les deux machines lundi.",
  sorlinNon:
    "Non, 131 € c'était mon prix. J'ai trouvé deux machines chez un autre loueur ce matin.",
  client:
    "Deuxième fois que votre pelle me lâche sur un chantier. Je ne peux pas me le permettre : je loue ailleurs à partir de maintenant.",
  phase2: "La phase 2 démarre lundi comme prévu : on garde les trois tout-terrain jusqu'à l'été.",
  report:
    "Le permis modificatif est bloqué et les ventes ne suivent pas : la phase 2 est reportée à l'automne. Les trois tout-terrain peuvent repartir.",
  ralentissement:
    "Le recul annoncé est là : les terrassiers annulent leurs réservations les unes après les autres. La demande de mini-pelles a chuté de moitié.",
} as const;
