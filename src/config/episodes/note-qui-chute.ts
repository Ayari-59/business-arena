/**
 * LA NOTE QUI CHUTE — le contenu de l'épisode.
 *
 * Hadrien Morlot est responsable qualité et expérience client du Groupe
 * Escale, au siège d'Annecy. La direction l'envoie à L'Escale Chambéry-Gare,
 * dont la note sur Bookalia et Voyagio est passée de 8,7 à 8,1 en trois mois,
 * au moment où l'été commence. Six décisions, de juin à fin août, chacune
 * précédée de ce qu'un responsable qualité reçoit vraiment : des alertes, une
 * directrice inquiète, une revenue manager pressée, une agence qui promet.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Chaque chiffre qu'une source
 * donne est tiré des constantes du modèle, et le test le vérifie.
 *
 * Groupe, hôtel, plateformes, prestataires, personnes et chiffres sont fictifs.
 */
import {
  AFFAIRES,
  AVIS,
  COTE_COUR,
  COTE_RUE,
  COUTS,
  LOISIRS,
  NOTE_REFERENCE,
  NUITEES_PAR_DIXIEME,
  NUITEES_PREVUES,
  PERTE_FILTRE,
  PRIX_GRILLE,
  PRIX_PAR_DIXIEME,
  SEUIL_FILTRE,
  THEMES,
} from "@/engine/episodes/note-qui-chute";
import type { Etape } from "./types";

/** Un montant tel que les sources l'écrivent : « 8 400 € ». */
const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;
/** Une part en pourcentage entier : « 47 % ». */
const pct = (v: number) => `${Math.round(v * 100)} %`;
/** Une note sur dix, toujours avec sa décimale : « 8,0 ». */
const note = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** La part des clients de loisirs une semaine donnée, dans la demande prévue. */
export const partLoisirs = (w: number) => LOISIRS[w - 1]! / (AFFAIRES[w - 1]! + LOISIRS[w - 1]!);

export const DIAGNOSTICS = [
  {
    id: "climatisation",
    t: "Les climatiseurs des chambres côté gare ne tiennent pas la chaleur : les clients ouvrent sur le chantier, et notent la chaleur et le bruit",
  },
  {
    id: "petitDejeuner",
    t: "Le petit-déjeuner en rupture après 8 h 30 : les clients de loisirs de l'été trouvent le buffet vide",
  },
  {
    id: "accueil",
    t: "L'accueil s'est dégradé à la réception : les avis les plus durs le racontent",
  },
  {
    id: "travaux",
    t: "Le chantier de voirie devant la gare : le bruit fait la note, et l'hôtel n'y peut rien",
  },
] as const;

const ANA = { de: "Ana Sousa", role: "Directrice de L'Escale Chambéry-Gare" } as const;
const LUCILE = { de: "Lucile Fabbri", role: "Revenue manager, siège" } as const;
const ILIAS = { de: "Ilias Benchekroun", role: "Chef de réception" } as const;
const ROSALBA = { de: "Rosalba Mendoza", role: "Gouvernante générale" } as const;
const ZACHARIE = { de: "Zacharie Ouvrard", role: "Responsable du petit-déjeuner" } as const;
const SVEN = { de: "Sven Laffargue", role: "Gérant, Réputea Conseil" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La note qui chute",
    jusqua: 2,
    messages: (ctx) => [
      {
        de: "Veille des avis",
        role: "Alerte automatique, Hostéo",
        heure: "07:40",
        alerte: true,
        texte: `L'Escale Chambéry-Gare : note moyenne sur Bookalia et Voyagio ${ctx.note} sur 10, contre ${note(NOTE_REFERENCE)} il y a trois mois. ${THEMES.avisNegatifsMai} avis négatifs en mai. Occupation de mai : ${ctx.occupation}.`,
      },
      {
        de: "Aymar Mollaret",
        role: "Directeur des opérations, Groupe Escale",
        heure: "08:15",
        texte:
          "Hadrien, Chambéry-Gare a perdu six dixièmes en un trimestre, et l'été commence. Allez-y cette semaine. Je veux savoir ce qui se passe et ce que vous faites, pas un plan de communication.",
      },
      {
        ...ANA,
        heure: "09:05",
        texte:
          "Vous avez vu l'avis de dimanche sur Bookalia ? Deux cents lignes sur Saturnin, notre réceptionniste de nuit, et des dizaines de lecteurs qui l'ont trouvé utile. Je propose de répondre à chaque avis négatif avec un geste, et de relancer tous nos clients pour qu'ils notent : il faut noyer les mauvais avis.",
      },
      {
        ...LUCILE,
        heure: "11:30",
        texte:
          "Le pick-up de juillet est en retard sur l'an dernier. Si la note continue de baisser, il faudra parler des prix de l'été.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "themes",
        titre: "Classer les avis négatifs de mai par thème",
        cout: 1,
        nature: "decisive",
        resultat: `Sur les ${THEMES.avisNegatifsMai} avis négatifs de mai, ${pct(THEMES.chaleur)} citent la chaleur dans la chambre, ${pct(THEMES.bruit)} le bruit, ${pct(THEMES.petitDejeuner)} le petit-déjeuner, ${pct(THEMES.prix)} le prix et ${pct(THEMES.accueil)} l'accueil. ${pct(THEMES.bruitAvecChaleur)} des avis qui parlent de bruit parlent aussi de fenêtre ouverte ou de chaleur. Presque tous viennent des ${COTE_RUE} chambres côté place de la gare ; les ${COTE_COUR} chambres côté cour sont notées 8,8. Les avis sur le petit-déjeuner viennent surtout de clients de loisirs, le week-end.`,
      },
      {
        id: "valeur",
        titre: "Demander au revenue management ce que vaut un dixième de note",
        cout: 0.5,
        nature: "decisive",
        resultat: `Lucile Fabbri : « À note égale, nos voisins de la gare vendent au même prix que nous. Un dixième de point de note vaut environ ${euros(PRIX_PAR_DIXIEME)} de prix moyen à occupation égale, et le classement des plateformes nous en retire environ ${NUITEES_PAR_DIXIEME} nuitées par trimestre. Sous ${note(SEUIL_FILTRE)}, on sort en plus du filtre « 8 et plus », que beaucoup de voyageurs cochent : ${pct(PERTE_FILTRE)} de réservations en moins. Le budget de l'été prévoyait ${NUITEES_PREVUES.toLocaleString("fr-FR")} nuitées à ${euros(PRIX_GRILLE)} de prix moyen. »`,
      },
      {
        id: "durs",
        titre: "Lire les avis les plus durs",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Les trois avis les plus longs et les plus lus racontent l'accueil : un réceptionniste de nuit jugé sec, une facture contestée, vingt minutes d'attente un soir d'arrivées en masse. « Plus jamais », « personnel désagréable » : ce sont eux que les voyageurs voient en premier sur la fiche de l'hôtel.",
      },
      {
        id: "nuit",
        titre: "Dormir une nuit dans une chambre côté gare",
        cout: 1,
        nature: "utile",
        resultat:
          "Chambre 214, côté place de la gare : 28 °C à 23 heures, le climatiseur souffle sans refroidir. Fenêtre ouverte, il fait 25 °C, et le chantier de voirie reprend à 6 h 45. Nuno Pessoa, le technicien : « Ils ont quatorze ans, je les recharge un par un. Côté cour, ils sont à l'ombre, ils tiennent. » Le lendemain, à 8 h 40, il n'y a plus ni pain ni viennoiseries au buffet.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Aymar Mollaret",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Aymar Mollaret : « Une note, c'est une moyenne de nuits passées chez nous. Cherchez ce qui fait les mauvaises nuits avant de chercher ce qu'on répond. Et ne jouez pas avec les règles des plateformes : à Annemasse, on a vu ce que ça coûte. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que lancez-vous cette semaine ?",
    options: [
      {
        t: "Répondre à chaque avis négatif avec un geste commercial, et relancer tous les clients pour qu'ils notent",
        d: `Un avoir de ${euros(COUTS.gesteAvis)} par avis négatif, un e-mail aux clients des trois derniers mois et à chaque client au départ. Quelques centaines d'euros par semaine.`,
      },
      {
        t: "Faire remettre en état les climatiseurs des chambres côté gare",
        d: `Le frigoriste revoit les ${COTE_RUE} appareils : fluide, compresseurs, cartes. ${euros(COUTS.climatisation)}, une à deux semaines de travaux.`,
      },
      {
        t: "Reprendre l'accueil : former la réception et renforcer l'équipe du soir",
        d: `Deux jours de formation, et un réceptionniste de plus le soir pendant l'été. ${euros(COUTS.reception)}.`,
      },
      {
        t: "Attendre la fin du chantier de voirie",
        d: "Il s'arrête à la mi-août. Ne rien engager d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...ANA,
          texte:
            "Les gestes sont partis, et les relances aussi. Trois clients ont répondu merci ; aucun n'a modifié son avis. Les relances, elles, font écrire : des dizaines de nouveaux avis cette semaine, et pas tous tendres.",
        },
      ],
      null,
      [
        {
          ...ILIAS,
          texte:
            "La formation est calée la semaine prochaine, l'équipe le prend bien. Mais au comptoir, ce qu'on nous reproche, ce sont les chambres côté gare.",
        },
      ],
      [
        {
          ...ANA,
          texte:
            "Je dis à l'équipe de patienter. Ce matin, les clients de la 208 et de la 311 ont demandé à changer de chambre à cause de la chaleur.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le buffet vide de 8 h 40",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...ZACHARIE,
        heure: "10:10",
        alerte: true,
        texte:
          "Ce matin encore, plus de pain ni de viennoiseries à 8 h 40, et une douzaine de personnes devant le buffet. Je suis seul pour réassortir, débarrasser et faire le café. Le week-end, c'est pire.",
      },
      {
        de: "Veille des avis",
        role: "Point hebdomadaire, Hostéo",
        heure: "18:00",
        texte: `Note en fin de semaine 2 : ${ctx.note}. Avis publiés cette semaine : ${ctx.noteSemaine} en moyenne.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "buffet",
        titre: "Observer le petit-déjeuner de 7 h à 10 h",
        cout: 0.5,
        nature: "decisive",
        resultat: `Jusqu'à 8 h 15, tout va bien : les clients d'affaires mangent vite et partent. Après 8 h 30 arrivent les familles et les touristes, qui prennent leur temps ; à 8 h 40, pain et viennoiseries sont épuisés, la boulangerie ne livre qu'une fois, à 6 h 30. En juin, ${pct(partLoisirs(1))} des clients sont des clients de loisirs ; à la mi-août, ils seront ${pct(partLoisirs(10))}.`,
      },
      {
        id: "avisSemaine",
        titre: "Relire les avis négatifs de la semaine",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.climReparee
            ? "La chaleur reste citée, mais moins souvent depuis le passage du frigoriste ; le petit-déjeuner monte : « buffet vide à 9 h », « pas un croissant le dimanche ». L'accueil n'apparaît que deux fois."
            : "La chaleur et le bruit restent en tête, de loin : « 29 °C dans la chambre », « fenêtre ouverte sur un marteau-piqueur à 6 h 45 ». Le petit-déjeuner vient ensuite ; l'accueil n'apparaît que deux fois.",
      },
    ],
    question: "Que faites-vous pour le petit-déjeuner ?",
    options: [
      {
        t: "Ajouter un extra de 7 h 30 à 10 h 30, et une seconde livraison de la boulangerie",
        d: `Un extra pour réassortir et débarrasser, une livraison à 8 h 15. ${euros(COUTS.extraPdj)} par semaine.`,
      },
      {
        t: "Offrir le petit-déjeuner aux clients qui se plaignent",
        d: "Un geste au comptoir, au cas par cas. Quelques centaines d'euros par semaine.",
      },
      {
        t: "Passer au petit-déjeuner servi à table",
        d: `Deux serveurs de plus, une carte, plus de buffet. ${euros(COUTS.pdjServi)} par semaine.`,
      },
      {
        t: "Ne rien changer : le petit-déjeuner pèse peu dans la note",
        d: "Zacharie fera au mieux.",
      },
    ],
    reactions: [
      [
        {
          ...ZACHARIE,
          texte:
            "L'extra commence lundi, et la boulangerie livre à 8 h 15. À 9 h 30, il reste du pain : c'est la première fois depuis mai.",
        },
      ],
      [
        {
          ...ILIAS,
          texte:
            "On offre des petits-déjeuners au comptoir. Les clients remercient, et le lendemain le buffet est toujours vide à 8 h 40.",
        },
      ],
      [
        {
          ...ZACHARIE,
          texte:
            "On sert à table depuis lundi. Les familles apprécient ; les clients d'affaires trouvent le service long avant leur train.",
        },
      ],
      [
        {
          ...ZACHARIE,
          texte:
            "D'accord. Je ferai ce que je peux, mais le dimanche, je ne peux pas être partout.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Baisser les prix de l'été ?",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...LUCILE,
        heure: "11:20",
        alerte: true,
        texte: `Le pick-up de juillet et d'août reste en retard sur l'an dernier, et la note est à ${ctx.note}. Je propose de baisser tous les tarifs de 10 € pour l'été, sur Bookalia, Voyagio et notre site, pour remplir.`,
      },
      {
        de: "Hostéo",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 4 : occupation ${ctx.occupation}, prix moyen ${ctx.prixMoyen}, RevPAR ${ctx.revpar}.`,
      },
    ],
    sources: [
      {
        id: "voisins",
        titre: "Comparer nos prix et nos notes à ceux des hôtels voisins de la gare",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Les quatre 3 étoiles de la gare vendent entre 96 et 106 €, et l'écart de prix suit l'écart de note : environ ${euros(PRIX_PAR_DIXIEME)} par dixième. À ${ctx.note}, le prix que notre note permet de tenir est d'environ ${ctx.tenable} ; à ${note(NOTE_REFERENCE)}, nous étions au bon prix à ${euros(PRIX_GRILLE)}. Au-dessus de ce prix, les clients vont chez le voisin ; en dessous, la gare n'a pas beaucoup plus de clients à nous donner.`,
      },
      {
        id: "pickup",
        titre: "Regarder le pick-up de juillet date par date",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le retard porte sur les nuits de semaine, quand les clients d'affaires se font rares ; les week-ends se remplissent normalement. Les annulations n'ont pas augmenté : les clients ne partent pas, ils réservent ailleurs.",
      },
    ],
    question: "Que décidez-vous pour les prix de juillet et d'août ?",
    options: [
      {
        t: "Baisser tous les tarifs de 10 €",
        d: "Sur toutes les nuits et tous les canaux, de juillet à fin août.",
      },
      {
        t: `Tenir la grille d'été à ${euros(PRIX_GRILLE)}`,
        d: "Ne rien toucher : la note remontera.",
      },
      {
        t: "Faire suivre au prix la note, semaine après semaine",
        d: "Lucile recale les tarifs chaque lundi sur le prix que la note permet de tenir, au vu du pick-up. Aucun coût.",
      },
      {
        t: "Baisser de 6 € pour tout l'été",
        d: "Ce que la note a fait perdre depuis le printemps, une fois pour toutes.",
      },
    ],
    reactions: [
      [
        {
          ...LUCILE,
          texte:
            "C'est en ligne. Le pick-up repart un peu, surtout le week-end, où l'on se remplissait déjà.",
        },
      ],
      [
        {
          ...LUCILE,
          texte:
            "On tient. Je vous préviens : à cette note, on est plus cher que des voisins mieux notés.",
        },
      ],
      [
        {
          ...LUCILE,
          texte:
            "D'accord : je recale chaque lundi, au plus près de ce que la note nous laisse tenir, et je vous envoie l'écart.",
        },
      ],
      [
        {
          ...LUCILE,
          texte:
            "Moins 6 € partout jusqu'à fin août. Si la note bouge, nos prix, eux, ne bougeront plus.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Une agence promet de remonter la note",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...SVEN,
        heure: "09:30",
        alerte: true,
        texte: `Monsieur Morlot, nous remontons une note de cinq dixièmes en six semaines. Deux formules : vos clients reçoivent 10 % sur leur prochain séjour pour chaque avis laissé, ou nous répondons pour vous à tous les avis, avec un geste sur chaque avis négatif. ${euros(COUTS.agence)} de mise en place.`,
      },
      {
        ...ANA,
        heure: "12:05",
        texte: `La note n'est qu'à ${ctx.note}. Ils promettent des résultats rapides, et une chaîne comme Orméa Hotels travaillerait avec eux. On signe ?`,
      },
    ],
    sources: [
      {
        id: "regles",
        titre: "Relire les règles de Bookalia et Voyagio sur les avis",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Offrir un avantage en échange d'un avis, même sans demander qu'il soit positif, est interdit. Quand une plateforme le détecte, elle retire les avis concernés, déclasse l'hôtel dans ses résultats et peut afficher un avertissement sur sa fiche. Demander un avis à tous les clients, sans contrepartie, est autorisé. Les deux plateformes font près de six réservations sur dix de l'hôtel.",
      },
      {
        id: "reponses",
        titre: "Lire ce que l'on sait des réponses aux avis",
        cout: 0.5,
        nature: "utile",
        resultat: `Un avis publié n'est presque jamais modifié, geste ou pas. Une réponse courte, qui reconnaît le problème et dit ce qui a été réparé, rassure ceux qui lisent : les hôtels qui répondent ainsi font environ ${pct(AVIS.conversionReponse)} de réservations de plus. Une réponse type, copiée d'un avis à l'autre, deux fois moins.`,
      },
      {
        id: "annemasse",
        titre: "Appeler la directrice de L'Escale Annemasse",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Noélie Marchetto : « L'an dernier, un prestataire nous a fait offrir une remise contre un avis. La note a gagné quatre dixièmes en un mois. Puis Voyagio a retiré une soixantaine d'avis et nous a déclassés : des semaines de réservations en chute. Une fois sur deux, ça passe, paraît-il. Chez nous, ça n'est pas passé. »",
      },
    ],
    question: "Que répondez-vous ?",
    options: [
      {
        t: "Signer la formule « avis récompensés » : 10 % sur le prochain séjour contre un avis",
        d: `${euros(COUTS.agence)} de mise en place, et les remises accordées. L'agence promet cinq dixièmes.`,
      },
      {
        t: "Répondre vous-mêmes aux avis négatifs : reconnaître, dire ce qui est réparé, sans geste",
        d: "Ana et vous, une demi-heure par jour. Aucun coût.",
      },
      {
        t: "Confier à l'agence les réponses à tous les avis, avec un geste sur chaque avis négatif",
        d: `${euros(COUTS.agence)} de mise en place, ${euros(COUTS.agenceSemaine)} par semaine, et ${euros(COUTS.gesteAvis)} par avis négatif.`,
      },
      {
        t: "Ne pas répondre aux avis",
        d: "Les avis parlent d'eux-mêmes ; on se concentre sur l'hôtel.",
      },
    ],
    reactions: [
      [
        {
          ...SVEN,
          texte:
            "Parfait. Les cartes « 10 % sur votre prochain séjour contre votre avis » seront à la réception lundi.",
        },
      ],
      [
        {
          ...ANA,
          texte:
            "Nous avons répondu aux douze derniers avis négatifs, sans formule toute faite. Un lecteur a laissé un « merci pour la franchise ».",
        },
      ],
      [
        {
          ...SVEN,
          texte:
            "Nous prenons la main sur les réponses lundi. Chaque avis négatif recevra un geste.",
        },
      ],
      [{ ...ANA, texte: "Entendu. Les avis restent sans réponse." }],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "La canicule arrive",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Bulletin de vigilance canicule",
        role: "Météo, Savoie",
        heure: "11:00",
        alerte: true,
        texte:
          "Épisode caniculaire attendu à partir de lundi, pour deux semaines : 33 à 38 °C l'après-midi, nuits au-dessus de 22 °C. Son intensité reste incertaine.",
      },
      {
        ...ROSALBA,
        heure: "15:30",
        texte: ctx.climReparee
          ? "Les climatiseurs côté gare tiennent depuis juin. Mais à 38 °C, Nuno n'est pas sûr qu'ils suivent."
          : "Côté gare, on monte déjà des ventilateurs dans les chambres. À 38 °C, les climatiseurs ne refroidiront plus rien.",
      },
      {
        ...ILIAS,
        heure: "17:45",
        texte: `Nous sommes à ${ctx.occupation} d'occupation cette semaine. Sans consigne, on attribue les chambres par étage, côté gare et côté cour mêlés.`,
      },
    ],
    sources: [
      {
        id: "tenue",
        titre: "Demander au frigoriste si les climatiseurs tiendront",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.climReparee
            ? "Givrelle Climatisation : « Remis en état, ils tiennent une chaleur d'été. Au-delà de 35 °C plusieurs jours de suite, ce sont des appareils de quatorze ans : si la canicule est forte, près d'une fois sur deux une partie décrochera ; si elle est modérée, ils passeront presque sûrement. La météo donne une chance sur deux qu'elle soit forte. »"
            : "Givrelle Climatisation : « Sans remise en état, à 35 °C, ils ne refroidiront pas : vos chambres côté gare dépasseront 30 °C la nuit, forte canicule ou pas. »",
      },
      {
        id: "location",
        titre: "Demander un devis de location de climatiseurs mobiles",
        cout: 0.5,
        nature: "utile",
        resultat: `Frimas Location : ${COTE_RUE} climatiseurs mobiles pour les chambres côté gare, livrés lundi et repris au bout de deux semaines : ${euros(COUTS.climMobiles)}. Ils refroidissent bien, mais font du bruit, et la gaine passe par la fenêtre entrouverte.`,
      },
      {
        id: "delogements",
        titre: "Demander à la réception ce qu'a coûté la chaleur de mai",
        cout: 0.5,
        nature: "utile",
        resultat: `Ilias Benchekroun : « Pendant les trois jours à 33 °C de fin mai, on a délogé des clients dans un hôtel voisin : ${euros(COUTS.delogement)} la nuit avec le taxi. Quand l'hôtel est plein, on ne peut pas les passer côté cour : il n'y a que ${COTE_COUR} chambres. »`,
      },
    ],
    question: "Comment préparez-vous la canicule ?",
    options: [
      {
        t: `Louer des climatiseurs mobiles pour les ${COTE_RUE} chambres côté gare`,
        d: `Deux semaines, ${euros(COUTS.climMobiles)}. Un peu de bruit dans les chambres.`,
      },
      {
        t: "Donner d'abord les chambres côté cour pendant la canicule",
        d: "La réception attribue la cour en premier, la gouvernante revoit ses étages. Aucun coût.",
      },
      {
        t: "Offrir le petit-déjeuner à tous les clients côté gare pendant la canicule",
        d: `Un geste pour faire passer la chaleur : ${euros(COUTS.petitDejeuner)} par nuitée côté gare.`,
      },
      {
        t: "Ne rien prévoir de plus",
        d: "On verra la semaine prochaine.",
      },
    ],
    reactions: [
      [
        {
          ...ROSALBA,
          texte:
            "Les mobiles sont montés dans les quarante chambres. Ils soufflent fort, mais les chambres sont à 23 °C.",
        },
      ],
      [
        {
          ...ILIAS,
          texte:
            "On attribue la cour d'abord. Rosalba a revu le planning des femmes de chambre : les recouches et les départs côté cour passent en premier.",
        },
      ],
      [
        {
          ...ILIAS,
          texte:
            "Les petits-déjeuners offerts sont appréciés. Mais la nuit, la 214 est toujours à 29 °C.",
        },
      ],
      [{ ...ROSALBA, texte: "Bien. On sort les ventilateurs de la réserve, au cas où." }],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "La note remonte trop lentement",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ANA,
        heure: "09:15",
        alerte: true,
        texte: `Note à ${ctx.note}. ${
          ctx.climReparee
            ? "On a tout réparé en juin, et elle bouge à peine."
            : "Elle ne remonte pas."
        } Je propose de relancer tous nos clients de l'été pour qu'ils laissent enfin un avis, ou une promotion de fin d'été pour remplir.`,
      },
      {
        ...LUCILE,
        heure: "14:00",
        texte: `Le chantier s'arrête la semaine prochaine, et les dernières semaines d'août se réservent maintenant. Occupation de la semaine : ${ctx.occupation}, prix moyen ${ctx.prixMoyen}.`,
      },
    ],
    sources: [
      {
        id: "recents",
        titre: "Comparer la note affichée à la moyenne des avis récents",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Moyenne des avis des quatre dernières semaines : ${ctx.noteRecente}. Note affichée : ${ctx.note}. La note moyenne les avis des derniers mois, les plus récents comptant davantage : ceux de juin pèsent encore. ${
            ctx.recenteAuDessus
              ? "Tant que les nouveaux avis restent à ce niveau, elle continuera de monter, d'autant plus vite qu'ils seront nombreux."
              : "Les nouveaux avis sont au niveau de la note, ou en dessous : elle ne remontera pas d'elle-même."
          }`,
      },
      {
        id: "aix",
        titre: "Demander ce qu'a donné une relance tardive à L'Escale Aix-les-Bains",
        cout: 0.5,
        nature: "utile",
        resultat: `À Aix-les-Bains, une relance envoyée à tous les clients de l'hiver a fait écrire ${AVIS.relanceTardive} avis en deux semaines, plus durs que la moyenne : ceux qui avaient quelque chose à reprocher ont répondu les premiers. Demander un avis au départ, le lendemain du séjour, fait écrire aussi les clients contents.`,
      },
    ],
    question: "Comment finissez-vous l'été ?",
    options: [
      {
        t: "Relancer tous les clients de l'été pour qu'ils laissent un avis",
        d: `Un e-mail à chaque client depuis juin. ${euros(COUTS.relance)}.`,
      },
      {
        t: "Demander un avis à chaque client au départ, à partir de maintenant",
        d: "Un mot à la réception et un e-mail le lendemain du séjour, sans contrepartie. Aucun coût.",
      },
      {
        t: "Lancer une promotion de fin d'été : 10 % sur toutes les nuits jusqu'à fin août",
        d: "Sur Bookalia, Voyagio et le site, pour remplir et faire venir des avis.",
      },
      {
        t: "Ne rien changer : la note finira par suivre",
        d: "Tenir le cap jusqu'à la fin du trimestre.",
      },
    ],
    reactions: [
      [
        {
          ...ANA,
          texte:
            "Les relances sont parties. Les avis arrivent par dizaines, et beaucoup racontent des nuits de juin.",
        },
      ],
      [
        {
          ...ILIAS,
          texte:
            "À chaque départ, on demande un avis, et l'e-mail part le lendemain. Les clients côté cour sont ravis de le donner.",
        },
      ],
      [
        {
          ...LUCILE,
          texte:
            "La promotion est en ligne. Le remplissage monte un peu ; le prix moyen, lui, descend.",
        },
      ],
      [{ ...ANA, texte: "D'accord. On tient le cap jusqu'à fin août." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Réparer la cause, tenir le prix", chemin: [1, 0, 2, 1, 1, 1] },
  { nom: "Soigner l'image", chemin: [0, 1, 0, 2, 2, 0] },
  { nom: "Attentiste", chemin: [3, 3, 1, 3, 3, 3] },
] as const;

/**
 * Les options qui soignent l'image au lieu de l'hôtel : [décision, option]. Gestes
 * commerciaux, relances de tous les clients, avis récompensés, baisse de prix générale.
 */
export const REFLEXES = [
  [0, 0],
  [1, 1],
  [2, 0],
  [3, 0],
  [3, 2],
  [4, 2],
  [5, 0],
] as const;

export const REPONSES = {
  frigoristeRapide:
    "Deux techniciens sont libres dès mercredi : les quarante appareils côté gare seront revus d'ici la fin de la semaine prochaine.",
  frigoristeLent:
    "Pas de technicien libre avant lundi prochain : comptez deux semaines pour revoir les quarante appareils côté gare.",
  climFinie:
    "Les quarante climatiseurs côté gare sont revus : 21 °C dans la 214 à 23 heures, fenêtre fermée.",
  climLache:
    "Avec 37 °C l'après-midi, une partie des climatiseurs côté gare a décroché : 29 °C dans les chambres la nuit, et des clients à déloger.",
  detection:
    "Des avis sur votre établissement ont été obtenus en échange d'un avantage, ce que nos conditions interdisent. Nous les avons retirés, et votre établissement est déclassé dans nos résultats jusqu'à nouvel ordre.",
  sousFiltre: `La note est passée sous ${note(SEUIL_FILTRE)} : nous sortons du filtre « 8 et plus ». Les réservations de la semaine le montrent déjà.`,
} as const;
