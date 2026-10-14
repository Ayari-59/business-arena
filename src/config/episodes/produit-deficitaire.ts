/**
 * LE PRODUIT QUI PERD DE L'ARGENT — le contenu de l'épisode.
 *
 * Matthias Lemasson est responsable des gammes de l'agence Arvel de
 * Villefranche-sur-Saône : gros œuvre, outillage, plomberie-chauffage,
 * quincaillerie de finition. Le tableau de résultat de la direction, en coût
 * complet, montre la plomberie-chauffage en déficit, et le directeur régional
 * veut l'arrêter. Six décisions, chacune précédée de ce qu'un responsable de
 * gammes reçoit vraiment.
 *
 * Tous les chiffres des sources sont tirés des constantes du modèle
 * (src/engine/episodes/produit-deficitaire.ts) ; le test de l'épisode en
 * recalcule plusieurs.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const EDOUARD = { de: "Édouard Vassal", role: "Directeur régional" } as const;
const NINON = { de: "Ninon Ferracci", role: "Contrôleuse de gestion régionale" } as const;
const ARMELLE = { de: "Armelle Kieffer", role: "Directrice de l'agence" } as const;
const LILIAN = { de: "Lilian Guillaumin", role: "Vendeur-conseil plomberie-chauffage" } as const;
const AMARA = { de: "Amara Nogueira", role: "Vendeuse-conseil couleur" } as const;
const BOUBACAR = { de: "Boubacar Camara", role: "Chef de parc" } as const;
const RADU = { de: "Radu Ilescu", role: "Gérant d'Ilescu Chauffage" } as const;
const HELENA = { de: "Héléna Moretti", role: "Déléguée commerciale, Peintures Orvalis" } as const;
const FIRMIN = { de: "Firmin Lacour", role: "Directeur de l'agence de Mâcon" } as const;
const TABLEAU = { de: "Tableau de bord de l'agence", role: "Point hebdomadaire" } as const;

export const DIAGNOSTICS = [
  {
    id: "repartition",
    t: "Le déficit vient des charges communes réparties au prorata du chiffre d'affaires : la plomberie-chauffage couvre largement ses propres coûts",
  },
  {
    id: "liees",
    t: "La plomberie-chauffage fait venir les chauffagistes, qui achètent aussi dans les autres rayons : sa vraie marge est ailleurs",
  },
  {
    id: "prix",
    t: "La plomberie-chauffage vend trop bas : son taux de marge ne couvre pas ses frais",
  },
  {
    id: "structure",
    t: "L'agence porte trop de frais de structure pour son chiffre d'affaires",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La plomberie-chauffage dans le rouge",
    jusqua: 2,
    messages: () => [
      {
        ...NINON,
        heure: "07:50",
        alerte: true,
        texte:
          "Résultat du troisième trimestre de Villefranche, par gamme, en coût complet : gros œuvre +4 k€, outillage +24 k€, plomberie-chauffage −16 k€, quincaillerie de finition +8 k€. Agence : +20 k€. La plomberie-chauffage est dans le rouge pour le quatrième trimestre de suite.",
      },
      {
        ...EDOUARD,
        heure: "08:40",
        texte:
          "Matthias, la plomberie-chauffage perd 16 k€ par trimestre. Je propose qu'on l'arrête : on solde le stock, on rend le rayon, et l'agence gagne 16 k€. Ton budget du trimestre est de 12 k€ de résultat, ouverture de Calorive à Arnas comprise. Dis-moi vendredi au comité ce que tu décides.",
      },
      {
        ...LILIAN,
        heure: "09:15",
        texte:
          "La rumeur court déjà au comptoir : deux chauffagistes m'ont demandé ce matin si on arrêtait le chauffage. Ilescu fait trois chantiers de pompes à chaleur avec nous ce mois-ci.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "compte",
        titre: "Décomposer le compte de la plomberie-chauffage avec Ninon",
        cout: 1,
        nature: "decisive",
        resultat:
          "Au troisième trimestre : 500 k€ de chiffre d'affaires, 390 k€ de coûts variables (achats consommés, transport sur achats). Ses coûts spécifiques : le vendeur-conseil thermicien, 14 k€ ; un magasinier à mi-temps, 6 k€ ; le loyer du local annexe, 8 k€ ; le showroom chauffage, 7 k€ ; la détention du stock, 9 k€ ; la démarque, 5 k€ ; le SAV et les mises en service, 8 k€ ; la location du porteur à hayon, 9 k€. Le tableau lui impute en plus 60 k€ de charges communes.",
      },
      {
        id: "communes",
        titre: "Lister les charges communes, et ce qui partirait avec la gamme",
        cout: 1,
        nature: "decisive",
        resultat:
          "216 k€ de charges communes au trimestre : 62 k€ de bâtiment, 96 k€ de personnel commun (direction, comptoir général, caisse, cour), 34 k€ d'informatique et de frais de siège, 14 k€ d'énergie, 10 k€ d'assurances. Le tableau les répartit au prorata du chiffre d'affaires, soit 12 % des ventes de chaque gamme. Aucune ne baisserait sans la plomberie. Parmi ses coûts spécifiques, le bail du local annexe court jusqu'en juin, le porteur est loué pour deux ans, le SAV des appareils vendus continue, Lilian et le magasinier seraient reclassés : seuls le stock, sa démarque et le showroom disparaîtraient ce trimestre.",
      },
      {
        id: "tickets",
        titre: "Analyser les tickets de caisse des chauffagistes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les chauffagistes et les plombiers font entre 8 et 20 % des ventes d'outillage et de quincaillerie selon les mois, 14 % en moyenne. Sept sur dix passent d'abord au comptoir plomberie, puis font un tour dans les autres rayons.",
      },
      {
        id: "marche",
        titre: "Lire l'étude de marché du chauffage en Auvergne-Rhône-Alpes",
        cout: 1,
        nature: "bruit",
        resultat:
          "Les ventes de chaudières gaz reculent de 9 % sur un an, celles de pompes à chaleur progressent de 14 %. Le nombre de chauffagistes installés dans le Beaujolais est stable.",
      },
      {
        id: "conseil",
        titre: "Appeler Ambroisine Derrien, responsable des gammes à Bourg-en-Bresse",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Ambroisine : « Avant d'arrêter une gamme, demande-toi ce qui disparaît vraiment avec elle. Ses ventes, oui. Le loyer du bâtiment, non. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous à la direction ?",
    options: [
      {
        t: "Engager l'arrêt de la plomberie-chauffage",
        d: "Plus de réassort dès la semaine 2, soldes du stock, rayon rendu en semaine 11. Au tableau de la direction, 16 k€ de déficit en moins par trimestre.",
      },
      {
        t: "Garder la gamme, et présenter au comité le résultat en marge sur coûts spécifiques",
        d: "Un tableau refait avec Ninon : la marge de chaque gamme, ses coûts spécifiques, puis les charges communes, sans les répartir.",
      },
      {
        t: "Garder la gamme, mais relever ses prix de 5 % pour qu'elle couvre sa part de frais",
        d: "Nouveau tarif dès la semaine 2. Sur le papier, 25 k€ de marge en plus par trimestre.",
      },
      {
        t: "Demander à la direction un trimestre de plus avant de trancher",
        d: "Rien ne change ; vous ferez le point sur les chiffres de décembre.",
      },
    ],
    reactions: [
      [
        {
          ...LILIAN,
          texte:
            "J'ai prévenu les chauffagistes. Ilescu m'a demandé où il achèterait ses pompes à chaleur au printemps. Je n'ai pas su quoi lui répondre.",
        },
      ],
      [
        {
          ...EDOUARD,
          texte:
            "Ton tableau se lit bien : la gamme paie ses propres coûts et laisse de quoi contribuer aux charges communes. On la garde. Mais alors, montre-moi où l'agence perd vraiment de l'argent.",
        },
      ],
      [
        {
          ...RADU,
          texte:
            "Vos chaudières ont pris 5 % d'un coup ? Calorive est à dix minutes, je vais comparer avant de commander.",
        },
      ],
      [
        {
          ...EDOUARD,
          texte:
            "Un trimestre de plus, je veux bien l'entendre. Mais si je ne vois rien bouger d'ici trois semaines, je tranche moi-même.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le corner peinture",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...NINON,
        heure: "10:30",
        alerte: true,
        texte:
          "Matthias, j'ai sorti le détail du trimestre dernier par sous-famille. Regarde la quincaillerie de finition, pourtant dans le vert au tableau, et en particulier le corner peinture-décoration.",
      },
      {
        ...HELENA,
        heure: "14:00",
        texte:
          "Monsieur Lemasson, Orvalis vous propose de relancer votre corner : mobilier neuf financé en partie, −15 % de lancement sur nos gammes phares. Les agences qui l'ont fait ont vendu jusqu'à 60 % de plus.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Résultat de l'agence à date : ${ctx.resultat}, pour un budget à date de ${ctx.budgetADate}. Taux de marge sur coût variable : ${ctx.tauxMcv}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "sousfamilles",
        titre: "Refaire le calcul par sous-famille dans la quincaillerie de finition",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Visserie, fixation et serrurerie : 150 k€ de chiffre d'affaires, 60 k€ de marge sur coût variable, 14 k€ de coûts spécifiques. Corner peinture-décoration : 50 k€ de chiffre d'affaires à 24 % de taux de marge sur coût variable ; ses coûts spécifiques : Amara, vendeuse-conseil couleur, 11 k€ ; la machine à teinter louée, 4 k€ ; la détention du stock, 3 k€ ; la démarque (pots périmés, teintes refusées), 5 k€ ; l'animation, 2 k€ ; les présentoirs, 1 k€.",
      },
      {
        id: "references",
        titre: "Regarder ce qui se vend dans le corner",
        cout: 0.5,
        nature: "utile",
        resultat:
          "250 références font 80 % des ventes du corner ; les 650 autres font l'essentiel de la démarque. Les peintres achètent peu ailleurs : entre 2 et 6 % des ventes de visserie et de quincaillerie. Le comptoir général paie un intérimaire, 8 k€ par trimestre, faute de quelqu'un pour le tenir.",
      },
      {
        id: "orvalis",
        titre: "Lire le dossier de relance d'Orvalis",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Des photos d'agences rénovées, un nuancier de 2 000 teintes, « jusqu'à +60 % de ventes » et un témoignage de l'agence de Montélimar. Le dossier ne parle ni de marge ni de démarque.",
      },
    ],
    question: "Que faites-vous du corner peinture ?",
    options: [
      {
        t: "Le fermer : solder le stock, rendre la machine, mettre Amara au comptoir général",
        d: "Soldes à −20 % en semaines 3 et 4. Amara remplace l'intérimaire du comptoir ; la machine se rend avec un mois de préavis.",
      },
      {
        t: "Le réorganiser : 250 références, la machine gardée, Amara à mi-temps au comptoir plomberie",
        d: "Les références dormantes retournent au fournisseur. Un peu moins de choix pour les peintres.",
      },
      {
        t: "Le relancer avec Orvalis : mobilier neuf et −15 % de lancement",
        d: "4 000 € de mobilier, dont Orvalis financera peut-être la moitié, et 1 500 € d'animation. Objectif : +60 % de ventes.",
      },
      {
        t: "Le garder tel quel : la quincaillerie de finition est rentable",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...AMARA,
          texte:
            "Le comptoir général, d'accord. Je donnerai aux peintres l'adresse d'un confrère pour les teintes, ils ne m'en voudront pas.",
        },
      ],
      [
        {
          ...AMARA,
          texte:
            "Le comptoir plomberie le matin, je connais le sanitaire. Lilian va pouvoir chiffrer ses chaudières sans qu'on l'interrompe toutes les cinq minutes.",
        },
      ],
      null,
      [
        {
          ...HELENA,
          texte:
            "Dommage. Notre offre reste valable jusqu'à la fin du mois, si vous changez d'avis.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Calorive casse les prix",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...RADU,
        heure: "07:40",
        alerte: true,
        texte:
          "Calorive baisse ses chaudières et ses pompes à chaleur de 8 % à partir de lundi. Je vous fais trois chantiers par mois. Vous vous alignez, ou je vais chez eux ?",
      },
      {
        ...LILIAN,
        heure: "09:10",
        texte: ctx.arret
          ? "Même pendant les soldes, les chauffagistes comparent : sur les chaudières, Calorive est encore moins cher que nous."
          : "Trois chauffagistes m'ont déjà montré le tarif de Calorive ce matin. Sur les chaudières, ils comparent tout ; sur les raccords, personne ne regarde.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Résultat de l'agence à date : ${ctx.resultat}, pour un budget à date de ${ctx.budgetADate}. Plomberie-chauffage au tableau de la direction : ${ctx.pcComplet}.`,
      },
    ],
    sources: [
      {
        id: "comparatif",
        titre: "Comparer les prix de Calorive, référence par référence",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La baisse porte sur 40 références de chaudières, pompes à chaleur et ballons : 45 % du chiffre d'affaires de la gamme. Sur le reste (raccords, robinetterie, évacuation), Calorive est 3 % plus cher que vous. Une baisse de 8 % ramène le taux de marge sur coût variable de 22 % à 15,2 % sur ce qu'elle touche.",
      },
      {
        id: "chantiers",
        titre: "Appeler trois chauffagistes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Ils achètent tout un chantier au même endroit : s'ils prennent la chaudière chez Calorive, ils y prennent aussi les raccords, la fumisterie, et l'outillage qui va avec.",
      },
    ],
    question: "Comment répondez-vous à Calorive ?",
    options: [
      {
        t: "S'aligner sur les 40 références que les chauffagistes comparent",
        d: "−8 % sur les chaudières, pompes à chaleur et ballons dès la semaine 5. Le reste de la gamme ne bouge pas.",
      },
      {
        t: "S'aligner sur toute la gamme",
        d: "−8 % sur tout le rayon plomberie-chauffage : un message simple pour les chauffagistes.",
      },
      {
        t: "Ne pas s'aligner : une gamme déjà dans le rouge ne peut pas baisser ses prix",
        d: "Les prix ne bougent pas.",
      },
    ],
    reactions: [
      [
        {
          ...RADU,
          texte: "Bon. Au même prix, je reste chez vous : Lilian connaît mes chantiers.",
        },
      ],
      [
        {
          ...LILIAN,
          texte:
            "Les chauffagistes sont contents, y compris sur les raccords et la robinetterie qu'ils ne comparaient pas.",
        },
      ],
      [
        {
          ...LILIAN,
          texte:
            "Deux chauffagistes m'ont dit qu'ils chiffreraient leurs prochaines pompes à chaleur chez Calorive.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le compromis de la direction",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...EDOUARD,
        heure: "11:00",
        alerte: true,
        texte: ctx.arret
          ? "Matthias, puisque la plomberie-chauffage s'arrête, Firmin Lacour demande Lilian à Mâcon dès la semaine 8. Ton comptoir général fera la fin des soldes."
          : "Matthias, tu as gardé la plomberie-chauffage. Je te propose un compromis : on supprime le poste de vendeur dédié. Firmin Lacour prendrait Lilian à Mâcon dès la semaine 8, et ton comptoir général reprendrait la gamme. 14 k€ de coûts spécifiques en moins par trimestre.",
      },
      {
        ...LILIAN,
        heure: "14:30",
        texte:
          "Je ferai ce que vous déciderez. Mais les chauffagistes viennent pour les chiffrages de pompes à chaleur, et ça ne s'improvise pas au comptoir.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Résultat de l'agence à date : ${ctx.resultat}. Plomberie-chauffage : ${ctx.mcsPc} de marge sur coûts spécifiques à date, ${ctx.pcComplet} au tableau de la direction.`,
      },
    ],
    sources: [
      {
        id: "conges",
        titre: "Regarder les ventes de la gamme pendant les congés de Lilian en août",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Deux semaines sans Lilian : −27 % de chiffre d'affaires sur la gamme, surtout sur les chaudières et les pompes à chaleur, que le comptoir général ne sait pas chiffrer. Sur un trimestre, 27 % des ventes de la gamme à 22 % de taux de marge, c'est 30 k€ de marge sur coût variable, pour 14 k€ de salaire chargé.",
      },
      {
        id: "visites",
        titre: "Demander à Lilian ce qu'il ferait d'une journée par semaine sur les chantiers",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Lilian : « Je chiffrerais sur place les remplacements de chaudières, avant que Calorive passe. ${
            ctx.priscillaAuComptoir
              ? "Avec Amara au comptoir le matin, je peux sortir sans laisser les clients attendre. »"
              : "Mais tant que je suis seul au comptoir plomberie, chaque journée dehors, ce sont des clients qui attendent. »"
          }`,
      },
    ],
    question: "Que répondez-vous à Édouard ?",
    options: [
      {
        t: "Accepter : Lilian part à Mâcon, le comptoir général reprend la gamme",
        d: "14 k€ de coûts spécifiques en moins par trimestre, dès la semaine 8.",
      },
      {
        t: "Garder Lilian, et l'envoyer une journée par semaine sur les chantiers des chauffagistes",
        d: "Des visites pour chiffrer sur place ; 1 400 € de frais de déplacement d'ici la fin du trimestre.",
      },
      {
        t: "Le partager avec Mâcon, deux jours par semaine",
        d: "Mâcon paie 40 % de son salaire ; trois jours sur cinq au comptoir de Villefranche.",
      },
      {
        t: "Refuser, et garder le poste tel quel",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...LILIAN,
          texte: "J'irai à Mâcon. Je préviens mes chauffagistes ; certains me suivront là-bas.",
        },
      ],
      [
        {
          ...LILIAN,
          texte:
            "Premier rendez-vous mardi à Gleizé : une chaufferie de copropriété à remplacer avant l'hiver.",
        },
      ],
      [
        {
          ...FIRMIN,
          texte: "Merci. Mardi et jeudi chez nous, ça me va très bien.",
        },
      ],
      [
        {
          ...EDOUARD,
          texte: "Entendu. Alors montre-moi à la fin du trimestre ce que ce poste rapporte.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "L'opération de décembre",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...ARMELLE,
        heure: "09:00",
        alerte: true,
        texte:
          "Matthias, il reste 3 000 € de budget d'animation pour décembre. La tête de gondole de l'entrée et le prospectus sont à toi : quelle gamme mets-tu en avant ?",
      },
      {
        ...BOUBACAR,
        heure: "10:20",
        texte:
          "Le gros œuvre, c'est près de la moitié du chiffre d'affaires de l'agence. Un prospectus à −4 % sur le ciment et les parpaings, et le parc tourne à plein jusqu'à Noël.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Résultat de l'agence à date : ${ctx.resultat}, pour un budget à date de ${ctx.budgetADate}. Taux de marge sur coût variable : ${ctx.tauxMcv}.`,
      },
    ],
    sources: [
      {
        id: "operations",
        titre: "Relire le bilan des opérations de l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le prospectus gros œuvre à −4 % : +12 % de volume pendant trois semaines, sur une gamme à 20 % de taux de marge sur coût variable. La tête de gondole outillage, sans remise : +10 % de ventes pendant cinq semaines, à 32 %. La matinée chauffagistes de l'agence de Mâcon : entre une poignée et trente artisans selon les chantiers ; ceux qui viennent commandent le jour même, puis reviennent, dans tous les rayons.",
      },
      {
        id: "ardea",
        titre: "Demander à Ardéa Chauffage ce que le fabricant prend en charge",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Ardéa fournit les démonstrateurs de pompes à chaleur et un technicien. Restent à la charge de l'agence le petit-déjeuner et les invitations : 2 500 €.",
      },
    ],
    question: "Quelle gamme mettez-vous en avant ?",
    options: [
      {
        t: "Le gros œuvre : un prospectus à −4 % sur le ciment et les parpaings",
        d: "3 000 € de prospectus, trois semaines de promotion. Le plus gros chiffre d'affaires de l'agence.",
      },
      {
        t: "L'outillage en tête de gondole, sans remise",
        d: "2 500 € de présentoirs et d'affiches, cinq semaines.",
      },
      {
        t: "Une matinée chauffagistes avec Ardéa",
        d: "2 500 € d'invitations et de petit-déjeuner, en semaine 9. Personne ne sait combien viendront.",
      },
      {
        t: "Garder le budget",
        d: "Pas d'opération ce trimestre.",
      },
    ],
    reactions: [
      [
        {
          ...BOUBACAR,
          texte: "Le prospectus est parti chez 1 800 artisans. Le parc est plein de palettes.",
        },
      ],
      [
        {
          ...ARMELLE,
          texte:
            "La tête de gondole est montée : visseuses et perforateurs en vitrine dès l'entrée.",
        },
      ],
      [
        {
          ...ARMELLE,
          texte:
            "Les invitations sont parties. Ardéa réserve son technicien pour le jeudi de la semaine 9.",
        },
      ],
      [
        {
          ...ARMELLE,
          texte: "Entendu, le budget reste en caisse.",
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
        ...EDOUARD,
        heure: "08:30",
        alerte: true,
        texte: `Matthias, il manque du chiffre d'affaires à la région pour finir l'année. Résultat de ton agence à date : ${ctx.resultat}. Fais-moi du volume sur les deux dernières semaines.`,
      },
    ],
    sources: [
      {
        id: "devis",
        titre: "Lister les devis en attente et refaire le calcul d'une remise",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "38 devis de plus de 1 500 € attendent une réponse depuis plus de trois semaines, dont 22 de chauffagistes. Une remise de 8 % sur le gros œuvre ferait tomber son taux de marge sur coût variable de 20 % à 13 % : il faudrait vendre 67 % de volume en plus pour garder la même marge.",
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Une remise de 8 % sur le gros œuvre pour faire du volume",
        d: "Deux semaines de promotion, annoncée aux maçons par SMS.",
      },
      {
        t: "Relancer un par un les devis en attente, sans remise",
        d: "Le comptoir rappelle les artisans d'ici mardi.",
      },
      {
        t: "−10 % sur l'outillage et la quincaillerie : leurs taux de marge le permettent",
        d: "Deux semaines, affichées en caisse.",
      },
      {
        t: "Ne rien faire de plus",
        d: "Le trimestre finira où il doit.",
      },
    ],
    reactions: [
      [
        {
          ...BOUBACAR,
          texte: "Les maçons font le plein de ciment : le parc n'a jamais autant tourné.",
        },
      ],
      [
        {
          ...ARMELLE,
          texte:
            "Les premiers devis reviennent signés. Les artisans apprécient qu'on les rappelle.",
        },
      ],
      [
        {
          ...ARMELLE,
          texte: "Les caisses tournent, les paniers sont plus gros.",
        },
      ],
      [
        {
          ...EDOUARD,
          texte: "Bien reçu. On fera les comptes en janvier.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Raisonner en marge sur coûts spécifiques", chemin: [1, 1, 0, 1, 2, 1] },
  { nom: "Suivre le tableau en coût complet", chemin: [0, 2, 2, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 2, 3, 3, 3] },
] as const;

/**
 * Les réflexes du coût complet et du chiffre d'affaires : arrêter la gamme
 * « déficitaire », lui faire couvrir sa part de frais par les prix, relancer
 * par le volume ce qui ne couvre pas ses coûts, refuser de baisser une gamme
 * « dans le rouge », couper son vendeur, pousser la gamme qui fait le plus de
 * chiffre d'affaires. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 2],
  [2, 2],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  orvalisOui:
    "Bonne nouvelle : Orvalis prend en charge la moitié du mobilier. Il sera posé lundi, avec les affiches de lancement.",
  orvalisNon:
    "Nous ne pouvons pas cofinancer le mobilier ce trimestre, notre budget est épuisé. Il vous sera facturé en entier.",
  arretImpose:
    "Matthias, je n'ai rien vu bouger, et le tableau montre toujours la plomberie-chauffage dans le rouge. J'ai tranché : on l'arrête. Plus de réassort dès lundi, soldes à partir de la semaine 8, rayon rendu en semaine 12.",
  directionAttend:
    "J'ai regardé les chiffres du mois avec Ninon. Je te laisse jusqu'à la fin du trimestre, comme convenu.",
  annonce:
    "Les chauffagistes savent que la gamme s'arrête. Ils finissent leurs chantiers en cours avec nous ; les suivants, ils les chiffrent ailleurs.",
  fermeture:
    "Le rayon plomberie-chauffage est rendu. Le magasinier passe au parc ; le local annexe et le porteur restent loués jusqu'à leur échéance.",
  ilescuPart:
    "Je suis désolé, mais à 8 % d'écart sur les pompes à chaleur, je ne peux pas suivre. Je passe mes chantiers chez Calorive, et j'y prendrai le reste.",
  matineeAnnulee:
    "Ardéa annule la matinée : avec l'arrêt de la gamme, il n'y a plus rien à présenter. Le budget n'aura pas été dépensé.",
  lilianPart:
    "C'est mon dernier jour à Villefranche. Merci pour tout ; je pars à Mâcon lundi, et j'ai laissé mes chantiers en cours au comptoir.",
} as const;
