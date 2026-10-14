/**
 * L'ENSEIGNE QUI FRAPPE À LA PORTE — le contenu de l'épisode.
 *
 * Isaline Perraud est directrice générale du Groupe Escale : huit hôtels et
 * cinq restaurants en Savoie et Haute-Savoie, 24 M€ de chiffre d'affaires
 * hébergement. Orméa Hotels, chaîne internationale, propose d'affilier les
 * huit hôtels à sa marque ; le conseil de famille attend sa recommandation
 * fin mars. Six décisions, chacune précédée de ce qu'une directrice générale
 * reçoit vraiment : le développeur de la chaîne qui presse, le directeur
 * financier séduit par les conditions de groupe, les directeurs d'hôtel qui
 * défendent leur maison ou réclament une marque.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : le chiffre et les canaux de chaque hôtel, ce que la
 * marque a apporté ailleurs, les redevances, le programme de clientèle
 * directe, le programme de Bookalia, la baisse de prix, les travaux et
 * l'indemnité de sortie, la perte d'Annemasse si Orméa choisit un concurrent.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que la
 * joueuse ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const ALIETTE = { de: "Aliette Grospiron", role: "Présidente du conseil de famille" } as const;
const MARCEAU = {
  de: "Marceau Dupré",
  role: "Directeur administratif et financier",
} as const;
const LUCILE = {
  de: "Lucile Fabbri",
  role: "Directrice du revenue management et de la distribution",
} as const;
const LASZLO = {
  de: "László Szentes",
  role: "Directeur du développement Europe du Sud, Orméa Hotels",
} as const;
const ROMY = { de: "Romy Castellane", role: "Directrice de L'Escale Lac" } as const;
const ANNABELLE = { de: "Annabelle Socquet", role: "Directrice de L'Escale Megève" } as const;
const ROMUALD = { de: "Romuald Aubertin", role: "Directeur de L'Escale Annemasse" } as const;
const PERNELLE = {
  de: "Pernelle Lamy",
  role: "Responsable des partenaires hôteliers, Bookalia",
} as const;
const SIBYLLE = { de: "Sibylle Rouget", role: "Avocate du groupe" } as const;

export const DIAGNOSTICS = [
  {
    id: "portefeuille",
    t: "Une marque ne vaut pas la même chose partout : elle apporte des clients et rapatrie des réservations des plateformes dans les hôtels d'affaires, presque rien dans les maisons qui vivent de leur emplacement et de leurs habitués. Il faut chiffrer hôtel par hôtel, tester, et négocier un périmètre différencié avec des clauses de sortie",
  },
  {
    id: "commissions",
    t: "Les plateformes nous coûtent trop cher : l'affiliation se juge sur les commissions qu'elle permet d'économiser",
  },
  {
    id: "taille",
    t: "Huit hôtels indépendants pèsent peu face aux plateformes et aux chaînes : affilier tout le groupe, aux conditions de groupe, est la meilleure protection",
  },
  {
    id: "independance",
    t: "Notre force est l'indépendance : une marque nous ferait perdre notre identité et nous lierait à Orméa pour dix ans ; il faut décliner",
  },
] as const;

/** Les chiffres de l'essai, tels que la revenue manager les lit en fin de semaine 8. */
const chiffresEssai = (ctx: Contexte) =>
  ctx.essai === "affaires"
    ? `En six semaines à Annemasse et à Chambéry-Gare, le canal d'Orméa a rapatrié ${ctx.rapatrie} de chiffre des plateformes et ${ctx.effetChiffre} : ${ctx.nomScenario}, comme ${ctx.commeAilleurs} des hôtels d'affaires affiliés dans la région. À l'année, pour les deux hôtels : ${ctx.apportAffaires} de chiffre d'affaires, net du coût des nuitées, ${ctx.economieAffaires} de commissions économisées, ${ctx.redevancesAffaires} de redevances : ${ctx.netAffaires} par an. Avec la clause et le plafond, l'affiliation des deux hôtels vaudrait ${ctx.valeurAffaires}, travaux compris.`
    : ctx.essai === "caractere"
      ? "À L'Escale Lac, qui tourne au tiers de sa capacité en février, Orméa a apporté une poignée de réservations ; à Megève, complet, ses membres ont pris la place de nos habitués, et nous lui avons versé 15 % sur des clients que nous aurions eus en direct. Rien sur ce que la marque ferait pour une clientèle d'affaires : on ne le saura qu'en semaine 12, par l'Observatoire hôtelier des Alpes."
      : "Aucun chiffre : nous n'avons rien testé. Ce que la marque apporte à nos hôtels d'affaires ne sera connu qu'en semaine 12, quand l'Observatoire hôtelier des Alpes publiera ses chiffres. D'ici là, nous en sommes aux références : trois hôtels sur dix y ont perdu, cinq sur dix gagné un peu, deux ou trois beaucoup.";

/** Ce qu'Orméa peut accepter, selon sa réponse, et ce que coûte chaque issue. */
function cequElleAccepte(ctx: Contexte): string {
  const arcadelle = ` Sans Annemasse, Orméa peut s'affilier l'Arcadelle : ${ctx.risqueConcurrent} de risque avec ce que nous savons de la marque, et 143 k€ de chiffre net perdus par an à Annemasse s'il se réalise.`;
  if (ctx.reponse === "accepte") {
    return `Orméa accepte ${ctx.perimetre}. Signer en semaine 12 : l'affiliation vaudrait ${ctx.valeurProposee}, travaux et droits d'entrée compris. Ne rien signer laisserait Annemasse à découvert.${arcadelle}`;
  }
  if (ctx.reponse === "contre") {
    return `Orméa exige Évian et Megève en « Orméa Collection », sous son contrat type, sans clause de sortie : ${ctx.coutExiges} de valeur détruite sur cinq ans. Lui offrir Annecy-Centre et Aix-les-Bains à la place, elle l'accepterait neuf fois sur dix, pour ${ctx.coutContrepartie}. Tenir notre périmètre : ses deux dernières contre-propositions étaient des tests, elle a signé deux fois sur trois sans rien de plus. Notre périmètre seul vaut ${ctx.valeurProposee}.${arcadelle}`;
  }
  if (ctx.reponse === "refuse") {
    return `Orméa veut les huit hôtels ou rien. Les huit, aux conditions de groupe, vaudraient ${ctx.valeurHuit}. Lui offrir Annecy-Centre et Aix-les-Bains en plus de notre périmètre, elle l'accepterait un peu plus d'une fois sur trois, pour ${ctx.coutContrepartie} ; tenir, une fois sur sept. Notre périmètre seul vaut ${ctx.valeurProposee}.${arcadelle}`;
  }
  if (ctx.proposition === "reporter") {
    return `Orméa a accepté d'attendre l'automne : ${ctx.patience}. Rien ne se signe ce trimestre ; à l'automne, nous déciderons avec les chiffres de l'Observatoire.${arcadelle}`;
  }
  return `Nous n'avons rien proposé à Orméa : rien à signer. Elle a pris acte, et rencontre d'autres hôtels de la région.${arcadelle}`;
}

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Orméa frappe à la porte",
    jusqua: 2,
    messages: () => [
      {
        ...LASZLO,
        heure: "08:15",
        texte:
          "Madame Perraud, comme convenu, notre offre écrite : l'affiliation de vos huit hôtels à la marque Orméa, aux conditions de groupe. Redevance de marque à 3 % au lieu de 4 %, 600 k€ de participation à vos travaux, votre accès à notre système de réservation et aux trente millions de membres d'Orméa Privilège. L'offre court jusqu'au 31 mars.",
      },
      {
        ...ALIETTE,
        heure: "09:00",
        alerte: true,
        texte:
          "Isaline, le conseil de famille se réunit le 30 mars. Ton grand-père a ouvert L'Escale en 1987 sans enseigne ; je ne suis pas fermée pour autant. Je veux ta recommandation, chiffrée, hôtel par hôtel s'il le faut.",
      },
      {
        ...MARCEAU,
        heure: "10:20",
        texte:
          "Un point de redevance en moins sur 24 M€, c'est 240 k€ par an, et 600 k€ pour les travaux. Et Orméa promet de faire baisser nos commissions de plateformes. Je signerais pour les huit.",
      },
      {
        ...ROMY,
        heure: "11:40",
        texte:
          "Si L'Escale Lac devient un Orméa, je change de métier. Nos clients reviennent pour la maison, le ponton et le restaurant, pas pour des points de fidélité.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "canaux",
        titre: "Décomposer le chiffre hébergement et les canaux, hôtel par hôtel",
        cout: 1,
        nature: "decisive",
        resultat:
          "Hébergement : 24 M€ l'an dernier, 498 chambres. Hôtels d'affaires : Annemasse 3,4 M€, dont 42 % réservés par Bookalia et Voyagio ; Chambéry-Gare 2,2 M€, dont 40 %. Ils paient 392 k€ de commissions par an. Hôtels mixtes : Annecy-Centre 2,8 M€ (38 % par les plateformes), Aix-les-Bains 1,8 M€ (30 %), Albertville 1 M€ (40 %). Hôtels de caractère : L'Escale Lac 5 M€ (28 %), Évian 4,4 M€ (24 %), Megève 3,4 M€ (22 %) ; 12,8 M€ à eux trois, dont 65 % réservés en direct par des habitués, des mariés, des séminaires. Bookalia prend 18 % sur deux réservations de plateforme sur trois, Voyagio 15 % sur la troisième : 17 % en moyenne.",
      },
      {
        id: "references",
        titre: "Interroger les hôteliers indépendants qu'Orméa a affiliés",
        cout: 1,
        nature: "decisive",
        resultat:
          "Orméa a affilié dix hôtels indépendants en Rhône-Alpes et en Suisse romande en cinq ans. Dans les hôtels d'affaires, trois sur dix n'ont rapatrié que 10 points de chiffre des plateformes vers le canal de la marque, et perdu 3 % de chiffre : les contrats entreprises d'Orméa sont moins chers que les leurs. Quatre ou cinq sur dix ont rapatrié 20 points et gagné 12 % de chiffre ; deux ou trois sur dix, 24 points et 17 %. Dans les hôtels de loisirs et de caractère : 3 points rapatriés, et 1 % de prix moyen perdu. Les redevances : 4 % de marque et 2 % de marketing sur tout le chiffre hébergement, plus 4 % du chiffre des séjours des membres d'Orméa Privilège, trois séjours sur dix dans un hôtel d'affaires, un et demi ailleurs.",
      },
      {
        id: "plaquette",
        titre: "Lire la présentation d'Orméa aux hôteliers indépendants",
        cout: 1,
        nature: "bruit",
        resultat:
          "« +15 % de RevPAR en moyenne la première année, jusqu'à 25 points de commissions de plateformes en moins. » Les chiffres sont des moyennes sur les hôtels d'affaires des grandes villes européennes de la marque ; la plaquette ne dit rien des hôtels de loisirs, de montagne ou de caractère.",
      },
      {
        id: "directeurs",
        titre: "Faire le tour des directeurs d'hôtel",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Romuald Aubertin, à Annemasse : « Les multinationales genevoises ont des politiques voyage qui exigent une chaîne référencée dans les systèmes de réservation des agences d'affaires : je perds des appels d'offres faute de marque. » Ana Sousa, à Chambéry-Gare, dit la même chose des grands comptes ferroviaires. Annabelle Socquet, à Megève : « De Noël à Pâques, je suis complet sans personne. » Romy Castellane, à L'Escale Lac : un client sur trois est un habitué.",
      },
      {
        id: "conseil",
        titre:
          "Appeler Hilaire Tissandier, ancien directeur général d'un groupe hôtelier indépendant",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Hilaire Tissandier : « J'ai vécu ça avec six hôtels au Pays basque. Ne raisonne pas en groupe, raisonne hôtel par hôtel : une marque vaut ce qu'elle apporte à un client qui ne te connaît pas encore. Là où tes clients te connaissent, tu paieras des redevances sur tes propres habitués. Et ne signe rien sans pouvoir en sortir. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle ligne proposez-vous au conseil de famille ?",
    options: [
      {
        t: "Accepter le principe des huit hôtels, pour obtenir les conditions de groupe",
        d: "20 k€ de frais de dossier pour l'audit de pré-affiliation des huit hôtels. 3 % de redevance de marque au lieu de 4 %, 600 k€ de participation d'Orméa aux travaux.",
      },
      {
        t: "Décliner : le Groupe Escale reste indépendant",
        d: "Rien à engager. Orméa est prévenue cette semaine.",
      },
      {
        t: "Chiffrer hôtel par hôtel ce que la marque apporterait, et négocier un périmètre différencié",
        d: "15 k€ d'étude, cabinet et revenue management. Orméa est prévenue que tous les hôtels ne sont pas concernés.",
      },
      {
        t: "Demander à Orméa six mois de réflexion",
        d: "Rien à engager. L'offre court jusqu'au 31 mars.",
      },
    ],
    reactions: [
      [
        {
          ...LASZLO,
          texte:
            "Excellente nouvelle. Nos équipes préparent le contrat pour les huit hôtels, aux conditions de groupe.",
        },
        {
          ...ROMY,
          texte: "Je prends note. Je ne suis pas sûre que nos habitués suivront.",
        },
      ],
      [
        {
          ...LASZLO,
          texte:
            "Nous regrettons. Notre développement dans le Genevois se poursuivra, avec vous ou sans vous.",
        },
      ],
      [
        {
          ...ALIETTE,
          texte: "C'est la bonne méthode. Le conseil veut voir chaque hôtel, pas une moyenne.",
        },
        {
          ...LASZLO,
          texte: "Entendu. Nous préférons les huit, mais nous écouterons.",
        },
      ],
      [
        {
          ...LASZLO,
          texte:
            "Six mois, c'est long. Notre offre court jusqu'au 31 mars, et d'autres hôtels du Genevois nous sollicitent.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Un essai avant de signer",
    jusqua: 4,
    messages: () => [
      {
        ...LASZLO,
        heure: "09:10",
        alerte: true,
        texte:
          "Pour vous convaincre, nous vous proposons un essai : deux de vos hôtels connectés à notre système de réservation et à Orméa Privilège pendant six semaines, sans changer d'enseigne. Nous prenons 15 % sur les réservations que nous apportons, rien d'autre.",
      },
      {
        ...MARCEAU,
        heure: "10:30",
        texte:
          "Si on teste, testons là où il y a du chiffre : L'Escale Lac et Megève, nos deux plus gros. Sinon, ne perdons pas six semaines.",
      },
      {
        ...LUCILE,
        heure: "14:45",
        texte:
          "Attention au calendrier : de janvier à mars, chaque hôtel raconte une histoire différente. Un essai ne dira quelque chose que là où la saison est normale.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "saison",
        titre: "Regarder ce que chaque hôtel peut montrer de janvier à mars",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'Escale Lac fait 10 % de son chiffre annuel de janvier à mars, à un tiers d'occupation, Évian 12 % : peu de clients, rien à mesurer. Megève en fait 48 %, complet de Noël à Pâques : Orméa n'y apporterait aucun client, ses membres y prendraient la place de nos habitués, et nous lui verserions 15 % sur des réservations que nous aurions eues en direct. Annemasse et Chambéry-Gare vivent leur saison d'affaires normale, 25 % de leur chiffre : six semaines y montreraient ce que la marque apporte à une clientèle d'affaires. Les résultats seraient connus en fin de semaine 8, avant de faire une proposition à Orméa ; sans essai, l'effet de la marque ne sera connu qu'en semaine 12, quand l'Observatoire hôtelier des Alpes publiera ses chiffres, après la négociation.",
      },
      {
        id: "modalites",
        titre: "Lire les conditions de l'essai",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une interface entre Hostéo et le système de réservation d'Orméa : 8 k€. Orméa prend 15 % sur les réservations qu'elle apporte, moins que les 17 % des plateformes sur celles qu'elle leur reprend. Aucun engagement de signer. Orméa verra les chiffres de l'essai comme nous.",
      },
    ],
    question: "Où faites-vous l'essai ?",
    options: [
      {
        t: "Pas d'essai : les références d'Orméa suffisent",
        d: "Rien à engager.",
      },
      {
        t: "Un essai de six semaines à Annemasse et à Chambéry-Gare, nos deux hôtels d'affaires",
        d: "8 k€ d'interface Hostéo ; 15 % à Orméa sur les réservations qu'elle apporte. Résultats en fin de semaine 8.",
      },
      {
        t: "Un essai de six semaines à L'Escale Lac et à Megève, nos deux plus gros chiffres d'affaires",
        d: "8 k€ d'interface Hostéo ; 15 % à Orméa sur les réservations qu'elle apporte. Résultats en fin de semaine 8.",
      },
    ],
    reactions: [
      [{ ...LASZLO, texte: "Comme vous voudrez. Nos références parlent pour nous." }],
      [
        {
          ...ROMUALD,
          texte:
            "Enfin ! Je préviens mes grands comptes genevois : dans trois semaines, ils nous trouvent dans leurs outils de réservation.",
        },
      ],
      [
        {
          ...ANNABELLE,
          texte:
            "Megève est complet jusqu'à Pâques. Je vais devoir ouvrir des chambres à Orméa : mes habitués ne vont pas comprendre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les maisons de caractère",
    jusqua: 6,
    messages: () => [
      {
        ...PERNELLE,
        heure: "09:30",
        alerte: true,
        texte:
          "Madame Perraud, nous savons que vous réfléchissez à une enseigne. Avant cela, notre programme Partenaire Privilégié pour L'Escale Lac, Évian et Megève : la première page de nos résultats, contre trois points de commission.",
      },
      {
        ...ROMY,
        heure: "11:00",
        texte:
          "Plutôt que de payer quelqu'un pour nos propres clients, parlons-leur nous-mêmes : un vrai moteur de réservation, un fichier clients, un tarif réservé aux habitués.",
      },
      {
        ...MARCEAU,
        heure: "15:20",
        texte:
          "Le plus simple : 5 % de moins sur notre site, pour tout le monde. Le client ira au moins cher, et ce sera chez nous.",
      },
    ],
    sources: [
      {
        id: "direct",
        titre: "Chiffrer un programme de clientèle directe pour les trois hôtels de caractère",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les hôtels de caractère indépendants qui ont lancé un moteur de réservation, un fichier clients et un tarif membre à 5 % sous le prix public ont rapatrié de deux à dix points de chiffre des plateformes vers le direct la première année, six et demi en moyenne. Chez nous, chaque point rapatrié sur les 12,8 M€ des trois hôtels rapporte 12 % : 17 % de commission évitée, moins 5 % de tarif membre, soit 15,4 k€ par an. À six points et demi, 100 k€ par an, moins 20 k€ de fonctionnement : 80 k€ par an, pour 90 k€ d'investissement. Les premières inscriptions se liront en semaine 11.",
      },
      {
        id: "bookalia",
        titre: "Lire les conditions du programme Partenaire Privilégié",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Trois points de commission de plus sur les réservations Bookalia, 2,1 M€ par an dans nos trois hôtels de caractère : 64 k€. En échange, 8 % de réservations Bookalia en plus, dont la moitié de clients qui réservaient déjà chez nous en direct et paieront désormais 21 % de commission. Au total, 28 k€ de moins par an ; mais le planning se remplit plus vite, et cela se voit dès février.",
      },
      {
        id: "site",
        titre: "Chiffrer une baisse de 5 % sur notre site",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un quart du chiffre de nos hôtels de caractère se réserve déjà sur notre site : 5 % de moins pour tous coûte 160 k€ par an. Les hôtels qui l'ont fait ont rapatrié trois points des plateformes, 46 k€ par an une fois la remise déduite : 114 k€ de moins par an.",
      },
    ],
    question: "Que faites-vous pour L'Escale Lac, Évian et Megève ?",
    options: [
      {
        t: "Rejoindre le programme Partenaire Privilégié de Bookalia pour les trois hôtels",
        d: "Trois points de commission de plus sur les réservations Bookalia ; plus de visibilité dès la semaine 5.",
      },
      {
        t: "Lancer un programme de clientèle directe : moteur de réservation, fichier clients dans Hostéo, tarif membre « Cercle Escale »",
        d: "90 k€ d'investissement, 20 k€ par an de fonctionnement ; un tarif membre à 5 % sous le prix public.",
      },
      {
        t: "Baisser de 5 % les prix sur notre site, pour tous les clients",
        d: "Rien à investir ; effet dès la semaine 5.",
      },
      {
        t: "Ne rien changer pour eux",
        d: "Rien à engager.",
      },
    ],
    reactions: [
      [
        {
          ...PERNELLE,
          texte: "Bienvenue dans le programme : vos trois hôtels remontent en première page lundi.",
        },
      ],
      null,
      [
        {
          ...LUCILE,
          texte:
            "Les nouveaux prix sont en ligne. Bookalia et Voyagio nous demandent déjà pourquoi nous sommes moins chers chez nous.",
        },
      ],
      [{ ...ROMY, texte: "Dommage. Nos habitués, eux, ne bougent pas : pour l'instant." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le projet de contrat",
    jusqua: 8,
    messages: () => [
      {
        ...LASZLO,
        heure: "08:50",
        alerte: true,
        texte:
          "Voici notre contrat type : dix ans, les normes de la marque appliquées sous dix-huit mois, une sortie anticipée possible moyennant une indemnité de trois ans de redevances. Signé tel quel, il est signé vite.",
      },
      {
        ...SIBYLLE,
        heure: "11:15",
        texte:
          "Ce contrat lie chaque hôtel pour dix ans, et ses normes peuvent imposer des travaux importants. Je peux négocier, mais cela prendra deux semaines et quelques honoraires.",
      },
      {
        ...MARCEAU,
        heure: "14:00",
        texte:
          "Ne compliquons pas tout : Orméa n'aime pas qu'on lui envoie des avocats. Signons le modèle, on verra plus tard.",
      },
    ],
    sources: [
      {
        id: "contrat",
        titre: "Faire analyser le contrat type par l'avocate",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sortir avant dix ans coûte trois années de redevances : pour Annemasse et Chambéry, environ 1,3 M€. Si l'affiliation déçoit, on reste et l'on perd, ou l'on paie pour partir. Les normes imposent 5 000 € de travaux par chambre dans un hôtel d'affaires (literie, salles de bains, petit-déjeuner, signalétique), 4 000 € dans un hôtel mixte, 7 000 € dans un hôtel de caractère : 750 k€ pour Annemasse et Chambéry. Une clause de sortie à trois ans si l'hôtel n'atteint pas les objectifs de contribution du canal Orméa, et un plafond de 2 500 € par chambre : Orméa a accepté les deux dans la plupart de ses contrats récents, avec parfois une contre-proposition de plus. Tout renégocier à la fois, sortie libre et un point de redevance en moins compris, l'a fait refuser bien plus souvent.",
      },
      {
        id: "travaux",
        titre: "Faire chiffrer les travaux par l'architecte du groupe",
        cout: 0.5,
        nature: "utile",
        resultat:
          "À Annemasse et à Chambéry, la literie a sept ans et le petit-déjeuner est servi à l'assiette : la norme d'Orméa demande un buffet, des têtes de lit et une signalétique à sa charte. Dans les maisons de caractère, ses normes de salles de bains et de chambres effaceraient ce qui fait leur charme : boiseries, mobilier ancien, chambres toutes différentes.",
      },
    ],
    question: "Que faites-vous du contrat type ?",
    options: [
      {
        t: "Signer le contrat type tel quel, pour aller vite",
        d: "Ni avocat ni délai. Dix ans, les normes de la marque, trois ans de redevances pour sortir.",
      },
      {
        t: "Négocier une clause de sortie à trois ans et un plafond de travaux de 2 500 € par chambre",
        d: "10 k€ d'avocat.",
      },
      {
        t: "Négocier la seule clause de sortie à trois ans",
        d: "10 k€ d'avocat.",
      },
      {
        t: "Tout renégocier : sortie libre, un point de redevance en moins, travaux plafonnés",
        d: "10 k€ d'avocat.",
      },
    ],
    reactions: [
      [{ ...LASZLO, texte: "Parfait : le contrat sera prêt dès que le périmètre sera arrêté." }],
      [
        {
          ...SIBYLLE,
          texte:
            "Je leur envoie nos deux demandes lundi : la clause de sortie et le plafond. Elles sont classiques, ils les connaissent.",
        },
      ],
      [
        {
          ...SIBYLLE,
          texte: "Une seule demande, la clause de sortie : ils ne devraient pas tiquer.",
        },
      ],
      [
        {
          ...LASZLO,
          texte:
            "Je transmets à notre direction juridique. Je ne vous cache pas qu'elle sera surprise.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Les chiffres de l'essai",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...LUCILE,
        heure: "08:30",
        alerte: true,
        texte:
          ctx.essai === "affaires"
            ? `Les six semaines d'essai à Annemasse et à Chambéry-Gare sont terminées : ${ctx.rapatrie} de chiffre rapatriés des plateformes, ${ctx.hausse} de chiffre d'affaires, soit ${ctx.nomScenario}.`
            : ctx.essai === "caractere"
              ? "Les six semaines d'essai à L'Escale Lac et à Megève sont terminées : presque rien au Lac, et des habitués mécontents à Megève. Sur nos hôtels d'affaires, nous ne savons rien de plus."
              : "Pas d'essai : nous n'avons que les références d'Orméa.",
      },
      {
        ...LASZLO,
        heure: "10:00",
        texte:
          "Madame Perraud, il nous faut votre périmètre la semaine prochaine pour vous répondre avant le 31 mars.",
      },
      {
        ...ALIETTE,
        heure: "12:30",
        texte: `Isaline, en janvier tu as annoncé au conseil ${ctx.ligneAnnoncee}. Ne nous fais pas changer d'avis tous les quinze jours.`,
      },
    ],
    sources: [
      {
        id: "essai",
        titre: "Lire les chiffres de l'essai, hôtel par hôtel",
        cout: 0.5,
        nature: "decisive",
        resultat: chiffresEssai,
      },
      {
        id: "ormea",
        titre: "Sonder ce qu'Orméa acceptera",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `D'après deux hôteliers qui ont négocié avec elle, Orméa accepte un périmètre partiel un peu plus d'une fois sur deux quand il comprend un hôtel d'affaires aux portes d'une grande ville, comme Annemasse ; elle contre-propose une fois sur trois en réclamant ses adresses de prestige ; elle refuse le reste du temps. Elle accepte moins quand on lui a d'abord promis tout le parc, ou qu'on l'a fait attendre.${ctx.essai === "affaires" && ctx.scenario !== "faible" ? " L'essai l'a convaincue de ce qu'elle gagnerait à Annemasse." : ""}${ctx.essai === "caractere" ? " L'essai lui a montré Megève complet : elle le voudra." : ""} Reporter à l'automne : elle attendrait sept fois sur dix.`,
      },
    ],
    question: "Quel périmètre proposez-vous à Orméa ?",
    options: [
      {
        t: "S'en tenir à la ligne annoncée au conseil en janvier",
        d: "Rien de nouveau à expliquer au conseil.",
      },
      {
        t: "Revoir le périmètre sur les chiffres de l'essai : Annemasse et Chambéry-Gare s'ils ont gagné, aucun hôtel sinon",
        d: "Sans essai sur les hôtels d'affaires, on propose les deux.",
      },
      {
        t: "Proposer Annemasse seule, notre hôtel le plus proche de Genève",
        d: "Le plus petit engagement possible.",
      },
      {
        t: "Demander à Orméa de reporter la décision à l'automne",
        d: "Rien ne se signe ce trimestre ; Orméa attendra, ou non.",
      },
    ],
    reactions: [
      [{ ...ALIETTE, texte: "Bien. Le conseil aime qu'on tienne ce qu'on annonce." }],
      [
        {
          ...LUCILE,
          texte: "Je prépare la note au conseil : les chiffres de l'essai, hôtel par hôtel.",
        },
      ],
      [{ ...ROMUALD, texte: "Annemasse seule ? Chambéry-Gare va se sentir oublié." }],
      [{ ...LASZLO, texte: "Je transmets. Je ne promets rien." }],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La réponse d'Orméa",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...LASZLO,
        heure: "09:00",
        alerte: true,
        texte:
          ctx.reponse === "accepte"
            ? `Madame Perraud, notre direction accepte ${ctx.perimetre}. Le contrat peut être signé la semaine prochaine.`
            : ctx.reponse === "contre"
              ? "Madame Perraud, notre direction accepte votre périmètre si vous y ajoutez Évian et Megève, sous notre label « Orméa Collection » : ils garderaient leur nom. C'est notre condition."
              : ctx.reponse === "refuse"
                ? "Madame Perraud, notre direction ne retient pas un périmètre partiel : les huit hôtels, aux conditions de groupe, ou rien."
                : ctx.proposition === "reporter"
                  ? `Madame Perraud, nous avons pris note de votre demande de report. ${ctx.patience === "oui" ? "Nous attendrons l'automne." : "Nous ne pouvons pas attendre : nous regardons d'autres hôtels à Annemasse."}`
                  : "Madame Perraud, nous prenons acte. Nous poursuivrons notre développement dans le Genevois.",
      },
      {
        ...MARCEAU,
        heure: "10:40",
        texte: ctx.reponse
          ? "Signons ce qu'ils demandent, et vite : le 31 mars, c'est dans trois semaines, et nous aurons au moins une marque."
          : "Nous laissons passer la marque. J'espère que nous ne le regretterons pas à Annemasse.",
      },
      {
        ...ROMUALD,
        heure: "16:10",
        texte:
          "L'Arcadelle, le 4 étoiles ouvert l'an dernier à Annemasse, a reçu Orméa la semaine dernière. Si nous ne signons pas, ce sont eux qui auront la marque.",
      },
    ],
    sources: [
      {
        id: "position",
        titre: "Peser ce qu'Orméa peut accepter, et ce que chaque issue coûte",
        cout: 0.5,
        nature: "decisive",
        resultat: cequElleAccepte,
      },
      {
        id: "arcadelle",
        titre: "Chiffrer ce que l'Arcadelle sous enseigne Orméa coûterait à Annemasse",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les entreprises genevoises qui exigent une marque font 5 % du chiffre d'Annemasse : 170 k€ par an, 143 k€ une fois le coût des nuitées déduit. Orméa ne s'affiliera l'Arcadelle que si la marque vaut la peine dans le Genevois : une chance sur dix si elle y pèse peu, près d'une sur deux si elle pèse moyennement, deux sur trois si elle pèse beaucoup ; un peu plus si on l'a éconduite ou fait attendre.",
      },
    ],
    question: "Que répondez-vous à Orméa ?",
    options: [
      {
        t: "Conclure aux conditions d'Orméa : lui accorder ce qu'elle demande",
        d: "Signature en semaine 12.",
      },
      {
        t: "Lui offrir une contrepartie : Annecy-Centre et Aix-les-Bains, à la place de ce qu'elle exige",
        d: "Si elle accepte déjà notre périmètre, on signe tel quel.",
      },
      {
        t: "Tenir notre périmètre : signer s'il lui convient, rester indépendants sinon",
        d: "Rien de plus à céder.",
      },
      {
        t: "Ne rien signer cette année",
        d: "Orméa reste libre de chercher un autre partenaire à Annemasse.",
      },
    ],
    reactions: [
      [{ ...MARCEAU, texte: "Sage décision. Le conseil aura sa marque." }],
      [
        {
          ...LASZLO,
          texte:
            "Je transmets à notre direction. Si votre périmètre lui convient déjà, nous signons la semaine prochaine.",
        },
      ],
      [{ ...LASZLO, texte: "Je transmets votre position. Réponse la semaine prochaine." }],
      [{ ...LASZLO, texte: "C'est votre choix. Le nôtre se fera ailleurs, s'il le faut." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare la joueuse, sous son hasard. */
export const REFERENCES = [
  { nom: "Chiffrer, tester, négocier hôtel par hôtel", chemin: [2, 1, 1, 1, 1, 2] },
  { nom: "Tout affilier pour les conditions de groupe", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 0, 3, 0, 0, 3] },
] as const;

/**
 * Les réflexes d'une direction sous pression devant une chaîne qui propose
 * son enseigne : tout affilier pour les meilleures conditions, ou tout
 * refuser par attachement ; signer sans tester ; acheter de la visibilité à
 * une plateforme ; signer le contrat type ; tenir la ligne annoncée malgré
 * les chiffres ; céder ce que la chaîne exige pour conclure. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  essaiAffaires:
    "L'essai démarre : Annemasse et Chambéry-Gare apparaissent dans le système de réservation d'Orméa et chez les agences d'affaires.",
  essaiCaractere:
    "L'essai démarre : L'Escale Lac et Megève apparaissent dans le système de réservation d'Orméa.",
  habitues:
    "Pendant les vacances de février, six chambres ont été vendues à des membres d'Orméa : j'ai dû déloger deux familles qui viennent depuis quinze ans. Gestes commerciaux, chambres offertes ailleurs : 20 k€, et deux habitués qui ne reviendront pas.",
  directBien:
    "Les premiers retours sont bons : nos habitués s'inscrivent au Cercle Escale dès qu'on leur en parle à la réception.",
  directLent:
    "Les inscriptions démarrent lentement : nos habitués nous appellent, ils ne vont pas sur le site.",
  accepte: "Notre direction accepte votre périmètre. Le contrat peut être signé.",
  contre:
    "Notre direction accepte votre périmètre si vous y ajoutez Évian et Megève, sous notre label « Orméa Collection ».",
  refuse: "Notre direction ne retient pas un périmètre partiel : les huit hôtels, ou rien.",
  aucun: "Nous prenons acte. Nous poursuivrons notre développement dans le Genevois.",
  patiente: "Nous attendrons l'automne. Notre offre reste ouverte jusque-là.",
  impatiente:
    "Nous ne pouvons pas attendre l'automne : nous regardons d'autres hôtels à Annemasse.",
  rienSigne:
    "Rien n'est signé avec Orméa ce trimestre. Le Groupe Escale reste indépendant pour ses huit hôtels.",
} as const;
