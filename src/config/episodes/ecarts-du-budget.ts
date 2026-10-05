/**
 * LES ÉCARTS DU BUDGET — le contenu de l'épisode.
 *
 * Léna Delmotte dirige l'atelier de préfabrication béton d'Arvel à
 * Saint-Priest : des linteaux, des bordures et des regards, une vibro-presse,
 * dix opérateurs. La clôture du mois annonce 18 k€ de dépassement, le ciment
 * a augmenté, et tout le monde a déjà son coupable. Six décisions, chacune
 * précédée de ce qu'une responsable d'atelier reçoit vraiment.
 *
 * La notion est l'ANALYSE DES ÉCARTS sur coûts de production, avec le budget
 * flexible : l'écart au budget statique mêle un écart sur volume et des écarts
 * sur coûts ; ceux-ci se décomposent en écarts sur prix et sur quantités pour
 * les matières, sur taux et sur temps pour la main-d'œuvre. Les chiffres que
 * les sources donnent sont ceux du modèle : un test le vérifie.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const GWENDOLINE = { de: "Gwendoline Vauquelin", role: "Contrôleuse de gestion" } as const;
const XAVIER = { de: "Xavier Bouchardon", role: "Directeur du site de Saint-Priest" } as const;
const ADRIEN = { de: "Adrien Kowalski", role: "Acheteur" } as const;
const DJAMEL = { de: "Djamel Amrouche", role: "Chef d'équipe" } as const;
const ARMEL = { de: "Armel Viallon", role: "Régleur de la presse" } as const;
const YOLANDE = { de: "Yolande Perrichon", role: "Chargée de clientèle, cimenterie" } as const;
const ANATOLE = { de: "Anatole Brugère", role: "Chargé d'opérations, ZAC des Tuileries" } as const;

export const DIAGNOSTICS = [
  {
    id: "presse",
    t: "La presse compacte mal : on surdose le ciment et on rebute, l'écart est dans les quantités et les heures",
  },
  { id: "moules", t: "Les moules usés font partir des pièces au rebut" },
  { id: "prix", t: "Le ciment coûte trop cher depuis la hausse de la cimenterie" },
  { id: "depassement", t: "L'atelier dépense trop : 18 k€ au-delà du budget en un mois" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Dix-huit mille euros de dépassement",
    jusqua: 3,
    messages: () => [
      {
        ...GWENDOLINE,
        heure: "07:50",
        alerte: true,
        texte:
          "Clôture du mois dernier, atelier béton : 129,1 k€ de coûts de production pour un budget de 111,0 k€, soit 18,1 k€ de dépassement (+16 %). Le ciment à lui seul : 27,8 k€ pour 22,5 k€ budgétés.",
      },
      {
        ...XAVIER,
        heure: "08:40",
        texte:
          "Léna, 18 k€ au-delà du budget en un mois : à ce rythme, plus de 50 k€ sur le trimestre. J'attends ton plan vendredi. Et regarde ce ciment.",
      },
      {
        ...ADRIEN,
        heure: "09:15",
        texte:
          "La cimenterie a passé 4 % de hausse au 1er du mois. Je peux faire jouer la concurrence si tu veux, mais n'attends pas de miracle.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "flexible",
        titre: "Refaire le budget à la production réelle avec Gwendoline",
        cout: 1,
        nature: "decisive",
        resultat:
          "La fiche de coût préétabli, par tonne bonne (2 % de rebuts normaux compris) : 150 kg de ciment à 150 €/t, 800 kg de granulats à 20 €/t, 25 kg d'acier à 1 000 €/t, 1,25 heure de main-d'œuvre à 38 €/h, soit 111 € la tonne. Le budget du mois portait sur 1 000 t ; l'atelier en a produit 1 040, soit un budget flexible de 115,4 k€. Consommé réel : 178 t de ciment payées 156 €/t, 876 t de granulats à 20 €/t, 27,4 t d'acier à 1 000 €/t, et 1 470 heures payées 38,40 €/h en moyenne, heures supplémentaires comprises.",
      },
      {
        id: "presse",
        titre: "Passer une matinée au poste de la presse",
        cout: 1,
        nature: "decisive",
        resultat:
          "Les bordures sortent de la presse avec des arêtes qui s'effritent. Djamel : « Depuis l'entretien de l'automne, la vibration tourne à 42 Hz au lieu de 50, et personne n'a refait le réglage. Pour que ça tienne au démoulage, on met un demi-sac de ciment de plus par gâchée : 8 % de plus que la formule. » Chaque pièce rebutée, il faut la casser, l'évacuer, nettoyer le moule et la refaire.",
      },
      {
        id: "prix",
        titre: "Demander à Adrien où en est le prix du ciment",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Le ciment est passé de 150 à 156 €/t au 1er du mois, chez tous les préfabricateurs de la région. En faisant jouer la concurrence, Adrien pense obtenir un geste de 2 €/t. La cimenterie laisse entendre qu'une autre hausse suivra au printemps.",
      },
      {
        id: "rebuts",
        titre: "Faire le relevé des rebuts par produit",
        cout: 0.5,
        nature: "utile",
        resultat:
          "7 % du tonnage coulé est parti au rebut le mois dernier, contre 2 % prévus par la fiche. Bordures, plus de la moitié du tonnage : 10 %, arêtes épaufrées et densité trop faible. Regards : 4 %, deux moules sur six sont usés aux angles. Linteaux : 3 %.",
      },
      {
        id: "odette",
        titre: "Appeler Odette Granjon, qui a tenu l'atelier avant vous",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Odette : « Un dépassement ne dit rien tant que tu n'as pas refait le budget à la production réelle. Ensuite, sépare ce qui tient aux prix de ce qui tient aux quantités et aux heures : l'acheteur ne peut rien sur les secondes. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Confier le dossier à Adrien : renégocier le prix du ciment",
        d: "Mettre la cimenterie en concurrence. Rien à payer ; l'atelier continue comme avant.",
      },
      {
        t: "Faire régler la vibration de la presse par le technicien du fabricant",
        d: "Une journée de presse arrêtée en semaine 2. 2 800 €.",
      },
      {
        t: "Faire rechemiser les deux moules de regards usés",
        d: "Chez le chaudronnier, retour en semaine 3. 2 500 €.",
      },
      {
        t: "Recadrer l'équipe sur le budget : dosage au plus juste, heures supplémentaires au strict minimum",
        d: "Une note de service lundi, et l'écart affiché à l'atelier chaque semaine. Rien à payer.",
      },
    ],
    reactions: [
      [
        {
          ...ADRIEN,
          texte:
            "La cimenterie concède 2 €/t à partir de la semaine 3, pour garder le client. Je ne pourrai pas faire mieux.",
        },
      ],
      null,
      [
        {
          ...DJAMEL,
          texte:
            "Les moules sont partis chez le chaudronnier. Les regards sortiront propres à leur retour ; les bordures, elles, s'effritent toujours.",
        },
      ],
      [
        {
          ...DJAMEL,
          texte:
            "La note est affichée. Les gars ont retiré le demi-sac… et les bordures cassent au démoulage. Avec quinze heures sup par semaine, on rattrape comment ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Le demi-sac de trop",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...GWENDOLINE,
        heure: "09:10",
        alerte: true,
        texte: `Trois semaines du trimestre. Écart au budget flexible : ${ctx.ecartFlexible} ; au budget statique : ${ctx.ecartStatique}. La semaine dernière : ${ctx.cimentKg} de ciment par tonne bonne, ${ctx.rebut} de rebuts.`,
      },
      {
        ...XAVIER,
        heure: "11:30",
        texte: `La main-d'œuvre de l'atelier, en trois semaines : ${ctx.ecartMO}. Coupe les heures supplémentaires, c'est là que part l'argent.`,
      },
      {
        ...DJAMEL,
        heure: "14:05",
        texte: ctx.dosageStrict
          ? "Depuis la note, on dose à la formule. Les bordures cassent à la sortie de la presse et on n'a plus d'heures pour les refaire."
          : ctx.presseReglee
            ? "Depuis le réglage, les bordures sortent nettes. Mais les gars mettent toujours leur demi-sac : l'habitude."
            : "Les bordures s'effritent toujours. Le demi-sac, c'est encore ce qui les tient.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "gachees",
        titre: "Peser le ciment des gâchées et faire écraser des éprouvettes",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.dosageStrict
            ? `Les gâchées sont à la formule depuis la note de service, et les éprouvettes tiennent la résistance : elles sont vibrées au laboratoire, pas sous la presse. À la sortie de la presse, ${ctx.rebut} des pièces partent au rebut.`
            : ctx.presseReglee
              ? "Les gâchées contiennent toujours 8 % de ciment de plus que la formule : le demi-sac. Depuis le réglage, les éprouvettes au dosage de la formule tiennent largement la résistance au démoulage."
              : "Les gâchées contiennent 8 % de ciment de plus que la formule. Les éprouvettes au dosage de la formule tiennent la résistance : elles sont vibrées au laboratoire, pas sous la presse. Sous la presse, sans le demi-sac, les bordures s'effritent.",
      },
      {
        id: "mainOeuvre",
        titre: "Décomposer l'écart de main-d'œuvre avec Gwendoline",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Sur trois semaines : écart sur taux ${ctx.ecartTaux}, écart sur temps ${ctx.ecartTemps}. Le temps perdu vient des rebuts : chaque tonne rebutée coûte 1,3 heure pour la casser, l'évacuer et refaire le moule, en plus des heures pour la couler.`,
      },
    ],
    question: "Que faites-vous du dosage et des heures ?",
    options: [
      {
        t: "Revenir au dosage de la formule, essais de résistance à l'appui",
        d: "Des éprouvettes écrasées devant l'équipe, puis la formule, rien que la formule, dès la semaine 4. 900 €.",
      },
      {
        t: "Installer un doseur automatique verrouillé",
        d: "Plus de demi-sac à la main. 5 000 €, posé en semaine 6.",
      },
      {
        t: "Laisser l'équipe doser à sa main",
        d: "Ils connaissent leur béton. Rien ne change.",
      },
      {
        t: "Supprimer les heures supplémentaires pour ramener le taux horaire à 38 €",
        d: "Plus d'heures majorées dès lundi. Les commandes attendront s'il le faut.",
      },
    ],
    reactions: [
      [
        {
          ...DJAMEL,
          texte:
            "Les éprouvettes ont tenu devant tout le monde. On repasse à la formule lundi ; on verra ce que ça donne à la sortie de la presse.",
        },
      ],
      [
        {
          ...ADRIEN,
          texte: "Le doseur est commandé. Le fournisseur le pose en semaine 6.",
        },
      ],
      [{ ...DJAMEL, texte: "D'accord. On garde nos habitudes." }],
      [
        {
          ...DJAMEL,
          texte:
            "Plus d'heures sup : quand une série prend du retard, elle attendra la semaine suivante. Je préviens les agences.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "La cimenterie augmente encore",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...YOLANDE,
        heure: "10:00",
        alerte: true,
        texte:
          "Nous vous informons d'une nouvelle hausse de nos tarifs : 168 €/t au lieu de 156, à compter de votre livraison de la semaine 7.",
      },
      {
        ...ADRIEN,
        heure: "10:40",
        texte:
          "J'ai une offre d'une cimenterie concurrente : un ciment composé à 146 €/t, 22 € de moins que le nouveau tarif. Même classe de résistance à 28 jours. On signe ?",
      },
      {
        ...GWENDOLINE,
        heure: "16:20",
        texte: `Depuis le début du trimestre, écart sur prix du ciment : ${ctx.ecartPrixCiment} ; écart sur quantité de ciment : ${ctx.ecartQuantiteCiment}.`,
      },
    ],
    sources: [
      {
        id: "fiche",
        titre: "Demander au laboratoire la fiche technique du ciment composé",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Résistance à 28 jours : identique. Mais au jeune âge, celle qui compte pour démouler le lendemain, elle est nettement plus faible : le fournisseur recommande 18 % de ciment en plus pour les pièces démoulées à 16 heures, et prévient que les rebuts monteront le temps de régler la presse.",
      },
      {
        id: "historique",
        titre: "Demander à Adrien comment se négocient les hausses",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le ciment a pris 12 % en dix-huit mois dans toute la région. Les hausses passent chez tous les préfabricateurs ; ceux qui s'engagent sur un volume obtiennent souvent d'en laisser une partie, mais pas toujours.",
      },
      {
        id: "groupe",
        titre: "Comparer avec les prix des autres ateliers du groupe",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Les deux autres ateliers du groupe paient le même ciment au même prix, à 1 € près. Eux aussi ont reçu la lettre de hausse.",
      },
    ],
    question: "Que faites-vous du ciment ?",
    options: [
      {
        t: "Passer au ciment composé de la cimenterie concurrente",
        d: "146 €/t au lieu de 168, livré dès la semaine 7.",
      },
      {
        t: "Négocier avec la cimenterie : un engagement de volume contre une hausse réduite",
        d: "S'engager sur 600 t pour six mois. Elle acceptera, ou pas.",
      },
      {
        t: "Accepter la hausse",
        d: "168 €/t à partir de la semaine 7, comme tout le monde.",
      },
    ],
    reactions: [
      [
        {
          ...DJAMEL,
          texte:
            "Premières gâchées au ciment composé : à 16 heures, les bordures ne sont pas prêtes à démouler. On rajoute du ciment.",
        },
      ],
      null,
      [{ ...ADRIEN, texte: "C'est noté : 168 €/t à partir de la semaine 7." }],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "La commande de la ZAC",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...ANATOLE,
        heure: "09:20",
        alerte: true,
        texte:
          "Nous avons besoin de 360 t de bordures, livrées des semaines 8 à 11, 90 t par semaine, à 170 € la tonne. Pénalités de retard prévues au marché. Vous suivez ?",
      },
      {
        ...XAVIER,
        heure: "11:00",
        texte: `L'atelier est déjà à ${ctx.depassement}. Avec 360 t de plus, il va exploser. Je préfère qu'on refuse.`,
      },
      {
        ...DJAMEL,
        heure: "13:45",
        texte:
          "Avec l'équipe actuelle, on a 350 heures par semaine, plus une quarantaine d'heures sup. Pour 90 t de plus, il en faudrait plus de cent de plus.",
      },
    ],
    sources: [
      {
        id: "commande",
        titre: "Calculer ce que la commande coûte et rapporte",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Au coût préétabli de 111 €/t, les 360 t ajoutent 40,0 k€ au budget flexible : le budget suit la production, ce n'est pas un dépassement. Vendues 170 €/t, elles laissent une marge sur coût variable de 59 €/t, soit 21,2 k€. Ce qui coûte en plus, ce sont les heures au-delà de la capacité : 47,50 €/h en heures supplémentaires, majorées de 25 %, ou 40 €/h en intérim.",
      },
      {
        id: "interim",
        titre: "Appeler l'agence d'intérim",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux intérimaires disponibles quatre semaines, 40 €/h tout compris, 500 € de frais. L'agence ne promet rien sur l'expérience : un peu plus d'une fois sur deux, ses intérimaires ont déjà travaillé dans le béton.",
      },
    ],
    question: "Que répondez-vous à l'aménageur ?",
    options: [
      {
        t: "Refuser la commande pour ne pas creuser le dépassement",
        d: "L'atelier reste sur ses volumes. L'aménageur ira voir ailleurs.",
      },
      {
        t: "Accepter, et produire en heures supplémentaires et le samedi",
        d: "Jusqu'à 110 heures majorées par semaine, des semaines 8 à 11.",
      },
      {
        t: "Accepter, avec deux intérimaires pendant quatre semaines",
        d: "70 heures de plus par semaine à 40 €/h, 500 € de frais d'agence. Le reste en heures supplémentaires.",
      },
      {
        t: "Accepter, sans rien changer à l'organisation",
        d: "On fera au mieux avec les heures habituelles.",
      },
    ],
    reactions: [
      [
        {
          ...ANATOLE,
          texte: "Dommage. Nous passerons commande chez un confrère de Vénissieux.",
        },
      ],
      [
        {
          ...DJAMEL,
          texte: "Les samedis sont au planning. Les gars sont d'accord, pour quatre semaines.",
        },
      ],
      null,
      [
        {
          ...ANATOLE,
          texte: "Parfait. Nous comptons sur vous pour tenir les 90 t par semaine.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Armel part en retraite",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...ARMEL,
        heure: "07:30",
        alerte: true,
        texte:
          "Léna, je te rappelle que je pars à la fin de la semaine 10. Trente et un ans sur cette presse. Je ne sais pas qui réglera les changements de moule après moi.",
      },
      {
        ...DJAMEL,
        heure: "08:15",
        texte: `D'ici la clôture, la presse change de moule six fois. Personne d'autre qu'Armel ne sait régler la vibration et la hauteur de remplissage. Rebuts de la semaine : ${ctx.rebut}.`,
      },
    ],
    sources: [
      {
        id: "changements",
        titre: "Regarder les rebuts après les changements de moule",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Quand Armel est en congé, les séries qui suivent un changement de moule rebutent 4 % de plus, le temps de trouver le bon réglage. Chaque point de rebut coûte de la matière et 1,3 heure par tonne rebutée.",
      },
      {
        id: "formation",
        titre: "Demander au fabricant ce que coûte une formation",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Deux jours sur site en semaine 10, deux opérateurs formés au réglage et au diagnostic des vibreurs : 2 600 €.${
            ctx.presseReglee
              ? ""
              : " Le formateur remettra la vibration à 50 Hz au passage s'il la trouve déréglée."
          }`,
      },
    ],
    question: "Comment préparez-vous le départ d'Armel ?",
    options: [
      {
        t: "Faire former deux opérateurs au réglage par le fabricant",
        d: "Deux jours en semaine 10, avec Armel encore là. 2 600 €.",
      },
      {
        t: "Faire écrire par Armel une fiche de réglage, en binôme avec un opérateur",
        d: "Ses deux dernières semaines en doublon. 1 200 € d'heures.",
      },
      {
        t: "Compter sur le technicien du fabricant en cas de besoin",
        d: "On l'appellera si les rebuts montent.",
      },
    ],
    reactions: [
      [
        {
          ...ARMEL,
          texte:
            "Le formateur est passé : Ange et Kenza règlent seuls, maintenant. Je pars tranquille.",
        },
      ],
      [
        {
          ...ARMEL,
          texte:
            "La fiche fait quatre pages. J'ai mis tout ce que je sais… enfin, tout ce dont je me souviens.",
        },
      ],
      [
        {
          ...ARMEL,
          texte: "Comme tu veux. Le technicien du fabricant, il vient sous dix jours.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "La revue trimestrielle",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...XAVIER,
        heure: "08:30",
        alerte: true,
        texte:
          "Revue trimestrielle dans deux semaines. Je veux y montrer un écart favorable sur le ciment. Qu'est-ce que tu proposes ?",
      },
      {
        ...GWENDOLINE,
        heure: "10:15",
        texte: `À date, écart au budget flexible : ${ctx.ecartFlexible}, dont ${ctx.ecartQuantiteCiment} sur la quantité de ciment et ${ctx.ecartPrixCiment} sur son prix.`,
      },
      {
        ...DJAMEL,
        heure: "15:40",
        texte:
          "La saison commence : les commandes de bordures prennent 10 % sur les deux dernières semaines. Et les vibreurs de la presse chauffent en fin de poste.",
      },
    ],
    sources: [
      {
        id: "carnet",
        titre: "Lire le carnet d'entretien de la presse",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Dernier entretien préventif il y a cinq mois ; le fabricant le recommande tous les trois mois, et avant chaque saison. Vibreurs à 70 °C en fin de poste.${
            ctx.presseReglee
              ? ""
              : " La vibration n'a toujours pas été remise à 50 Hz depuis l'automne."
          } Une presse qui lâche en pleine saison, c'est deux jours d'arrêt, la réparation, et des livraisons en retard.`,
      },
      {
        id: "norme",
        titre: "Relire la norme des bordures",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Chaque lot livré passe un essai de gel-dégel chez le client. Un béton dosé sous la formule le passe mal. Un lot non conforme est refusé et remplacé, pénalité comprise : environ 12 k€ pour 80 t.",
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Baisser le dosage de 5 % sous la formule jusqu'à la clôture",
        d: "L'écart sur quantité de ciment repasse favorable pour la revue. Rien à payer.",
      },
      {
        t: "Faire l'entretien préventif de la presse avant le pic, et présenter les écarts décomposés",
        d: "Une journée de maintenance en semaine 12. 1 800 €.",
      },
      {
        t: "Ne rien changer jusqu'à la clôture",
        d: "La presse a tenu jusqu'ici.",
      },
    ],
    reactions: [
      [
        {
          ...DJAMEL,
          texte:
            "Moins 5 % de ciment… Les bordures sortent. On verra ce qu'en dit l'essai du client.",
        },
      ],
      [
        {
          ...XAVIER,
          texte:
            "Ta décomposition est claire : le volume n'est pas un dépassement, et je vois ce qui reste à gagner. Va pour l'entretien.",
        },
      ],
      [
        {
          ...DJAMEL,
          texte: "On continue comme ça. On croise les doigts pour les vibreurs.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Décomposer, puis traiter la cause", chemin: [1, 0, 1, 2, 0, 1] },
  { nom: "Réagir à l'écart visible", chemin: [0, 3, 0, 0, 2, 0] },
  { nom: "Attentiste", chemin: [0, 2, 2, 3, 2, 2] },
] as const;

/**
 * Les réflexes du métier devant un écart : poursuivre le prix parce qu'il se
 * voit, accuser l'atelier d'un dépassement qui tient au volume, corriger le
 * taux horaire au lieu du temps, acheter un écart favorable sur prix avec un
 * écart défavorable sur quantité, fabriquer un écart favorable pour la revue.
 * [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 3],
  [2, 0],
  [3, 0],
  [5, 0],
] as const;

export const REPONSES = {
  roulementUse:
    "J'ai remis la vibration à 50 Hz, mais le roulement du vibreur est usé : le réglage ne tiendra qu'à moitié jusqu'à la pièce neuve, en semaine 5. 1 900 € de plus.",
  vibreurSain:
    "Vibration remise à 50 Hz, vibreur sain. Les bordures devraient sortir nettes dès cette semaine.",
  roulementPose: "Le roulement neuf est posé : la vibration tient ses 50 Hz.",
  sansDemiSac:
    "Sans le demi-sac, les bordures cassent au démoulage : la presse ne les compacte pas assez. Les rebuts ont bondi cette semaine.",
  noteDeService:
    "Depuis la note, les bordures cassent à la sortie de la presse, et on n'a pas les heures pour les refaire. Les livraisons prennent du retard.",
  cimenterieAccepte:
    "Contre votre engagement de 600 t, nous limitons la hausse : 158 €/t à partir de la semaine 7.",
  cimenterieRefuse:
    "Nous ne pouvons pas faire d'exception : 168 €/t à partir de la semaine 7, engagement ou pas.",
  interimExperimente:
    "Nos deux intérimaires ont déjà travaillé en préfabrication. Ils commencent lundi, en semaine 8.",
  interimDebutant:
    "Vos deux intérimaires commencent lundi. Ils n'ont jamais travaillé le béton, il faudra les guider.",
  ficheIncomplete:
    "La fiche d'Armel ne dit rien des moules de regards. On a tâtonné deux jours à chaque changement : ça s'est vu aux rebuts.",
  lotRefuse:
    "L'essai de gel-dégel du dernier lot de bordures n'est pas conforme. Nous refusons le lot : 80 t à remplacer, et la pénalité du marché.",
  panne:
    "Le vibreur de la presse a lâché lundi, en pleine saison. Deux jours d'arrêt, le temps de la pièce : les livraisons glissent.",
} as const;
