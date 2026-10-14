/**
 * LES PRODUCTEURS QUI ARRÊTENT — le contenu de l'épisode.
 *
 * Hoel Quiniou est responsable de la collecte et des relations avec les
 * producteurs de la Laiterie de Kerbrélan. La collecte a baissé de 4 % en un
 * an ; 61 des 310 exploitations ont un exploitant de plus de 58 ans sans
 * repreneur connu ; l'automne dernier, l'usine a acheté 8 % de son lait en
 * spot. Octobre commence : le creux de collecte, puis le pic des desserts de
 * Noël. Six décisions, chacune précédée de ce qu'un responsable de collecte
 * reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; un test les recalcule.
 *
 * Laiterie, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";
import {
  AGES,
  AGRANDIR,
  APPUI,
  ARRETENT_SANS_SUITE,
  AVANCE,
  AVEC_REPRENEUR,
  SANS_REPRENEUR,
  BAISSE_COLLECTE,
  CALENDRIER,
  CHERCHENT_REPRENEUR,
  COLLECTE_AN,
  COLLECTE_AN_PASSE,
  COLLECTE_FIXE,
  CONVENTION,
  COOPERATIVE,
  COUT_AVANCE,
  COUT_AVANCE_AGRANDIR,
  COUT_COLLECTE_AN_PASSE,
  COUT_COLLECTE_DEPART,
  COUT_KM,
  DESSERTS,
  DISPO,
  DUREE_PRIME,
  ECART_REMPLACEMENT,
  GAEC,
  HAUSSE,
  HORIZON,
  INSTALLATION,
  KM_SEMAINE,
  MARGE_DESSERTS,
  OUVERT,
  PERTE_RUPTURE,
  PLAN,
  PRIME_DECEMBRE,
  PRIX_PAYE,
  PRODUCTEURS,
  QUESTIONNAIRE,
  SPOT,
  TERME,
  TOURNEES,
  VALEUR_DESSERTS,
  VALEUR_ML,
  VALEUR_OUVERT,
  VOLUME_PROJET,
  BESOIN,
  PIC,
  COLLECTE_SEMAINE,
  surHorizon,
} from "@/engine/episodes/producteurs-qui-arretent";
import { euros, kE, nombre, taux } from "./format";

export const DIAGNOSTICS = [
  {
    id: "transmission",
    t: "La collecte baisse parce que des exploitations s'arrêtent sans repreneur : un problème de transmission, qui se prépare exploitation par exploitation, des années à l'avance ; le spot ne fait que boucher le trou",
  },
  {
    id: "tournees",
    t: "La collecte se disperse : des exploitations s'arrêtent, les tournées s'étirent, et le lait coûte de plus en plus cher à collecter",
  },
  {
    id: "prix",
    t: "Le prix de base de Kerbrélan ne retient plus les producteurs : ils réduisent ou partent faute d'un prix suffisant",
  },
  {
    id: "saison",
    t: "C'est le creux d'automne, aggravé par une année fourragère médiocre : la collecte reviendra au printemps",
  },
] as const;

const YANNIG = { de: "Yannig Le Goaziou", role: "Directeur général" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const MORWENNA = { de: "Morwenna Pellen", role: "Cheffe de marque" } as const;
const KONOGAN = {
  de: "Konogan Kerguéris",
  role: "Président de l'OP Lait du Méné, éleveur",
} as const;
const JORAN = { de: "Joran Kerneur", role: "Chef du parc de collecte" } as const;
const SKLAERENN = { de: "Sklaerenn Le Saout", role: "Technicienne d'élevage" } as const;
const SELMA = {
  de: "Selma Adjovi",
  role: "Conseillère installation, chambre d'agriculture",
} as const;
const MARTA = {
  de: "Marta Szulc",
  role: "Salariée agricole, candidate à l'installation",
} as const;
const GUENOLE = { de: "Guénolé Guillouzic", role: "Associé du GAEC Guillouzic, à Trévé" } as const;
const PADRIG = { de: "Padrig Guillouzic", role: "Associé du GAEC Guillouzic, à Trévé" } as const;
const MELAINE = { de: "Melaine Bodiou", role: "Courtier en lait" } as const;
const TABLEAU = "Tableau de la collecte";

/** Des millions de litres, comme les sources les écrivent : « 31,7 millions de litres ». */
const ml = (v: number, d = 1) => `${nombre(v, d)} million${v >= 2 ? "s" : ""} de litres`;
/** Des euros les 1 000 litres. */
const parMille = (v: number) => `${nombre(v, 1)} € les 1 000 litres`;
const pct = (x: number) => taux(x, 0);

const EN_LETTRES = [
  "aucune",
  "une",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
] as const;
/** Les chances d'aboutir d'un projet d'installation, sur dix, telles que la chambre les donne. */
export const chanceSurDix = (k: number, chambre: boolean) => {
  const i = INSTALLATION[k]!;
  return Math.round((i.base + (chambre ? i.chambre : 0)) * 10);
};
const chance = (k: number, chambre: boolean) => EN_LETTRES[chanceSurDix(k, chambre)]!;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le lait qui part",
    jusqua: 2,
    messages: () => [
      {
        de: TABLEAU,
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte: `Collecte des douze derniers mois : ${ml(COLLECTE_AN, 0)}, contre ${nombre(COLLECTE_AN_PASSE, 0)} l'année d'avant (−${pct(BAISSE_COLLECTE)}). Fin septembre : ${ml(COLLECTE_SEMAINE, 2)} par semaine, pour ${nombre(BESOIN[1]!, 2)} à transformer. L'automne dernier, l'usine a acheté 8 % de son lait en spot.`,
      },
      {
        ...YANNIG,
        heure: "08:45",
        texte:
          "Hoel, le comité de direction de mercredi veut ton plan pour l'approvisionnement en lait. Octobre commence, Noël arrive, et on achète déjà du spot. Que proposes-tu ?",
      },
      {
        ...KONOGAN,
        heure: "10:10",
        texte: `Hoel, l'assemblée de l'OP est dans six semaines. Des producteurs demandent ${HAUSSE.euros} € de plus sur le prix de base : Nordal paierait mieux, disent-ils. Si on n'a rien à leur dire, d'autres partiront.`,
      },
      {
        ...IWAN,
        heure: "11:30",
        texte: `Une hausse de ${HAUSSE.euros} € sur le prix de base, c'est ${nombre((HAUSSE.euros * COLLECTE_AN * 1000) / 1e6, 1)} M€ par an sur toute la collecte, et un prix de base ne se reprend pas. Je veux voir ce qu'elle rapporterait avant d'en parler au comité.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "fichier",
        titre: "Extraire du fichier des producteurs l'âge des exploitants et les volumes livrés",
        cout: 0.5,
        nature: "decisive",
        resultat: `Sur ${PRODUCTEURS} exploitations, ${AGES.exploitations} ont un exploitant de plus de 58 ans sans repreneur connu ; elles livrent ${ml(AGES.volume)} par an, ${pct(AGES.volume / COLLECTE_AN)} de la collecte, ${nombre((AGES.volume / AGES.exploitations) * 1000, 0)} 000 litres chacune en moyenne contre ${nombre((COLLECTE_AN / PRODUCTEURS) * 1000, 0)} 000 pour l'ensemble. À saison égale, la collecte est de ${pct(BAISSE_COLLECTE)} sous celle de l'an dernier, chaque semaine depuis le printemps : les ${nombre(COLLECTE_AN_PASSE - COLLECTE_AN, 0)} millions de litres perdus viennent pour l'essentiel de seize exploitations qui ont cessé l'an dernier, toutes tenues par des exploitants de plus de 58 ans, aucune reprise.`,
      },
      {
        id: "visites",
        titre: "Envoyer les deux techniciens voir les exploitants de plus de 58 ans",
        cout: 1.5,
        nature: "decisive",
        resultat: `En trois jours, Sklaerenn Le Saout et Kélig Doaré ont vu ou appelé les ${AGES.exploitations} exploitants. Parmi eux, ${AVEC_REPRENEUR.exploitations} ont en fait un repreneur en vue (un enfant, un salarié, un associé) : ${ml(AVEC_REPRENEUR.volume)} par an. Les ${SANS_REPRENEUR.exploitations} autres n'en ont pas : ${CHERCHENT_REPRENEUR} en cherchent un et transmettraient à un jeune, ${ARRETENT_SANS_SUITE} arrêteront sans suite, en vendant le troupeau ; ${CALENDRIER.trimestre} dans le trimestre, ${CALENDRIER.anProchain} l'an prochain, les autres d'ici trois ans. Aucun ne cite le prix du lait : l'âge, la santé, l'astreinte de la traite, une mise aux normes qu'ils ne feront plus. Enfin, ${PLAN.hesitants} exploitations plus jeunes, voisines de celles qui s'arrêtent, hésitent à reprendre des terres et des vaches : il leur faudrait un bâtiment, et la garantie qu'on collectera le lait en plus.`,
      },
      {
        id: "prix",
        titre: "Comparer le prix payé par Kerbrélan à celui des laiteries voisines",
        cout: 1,
        nature: "bruit",
        resultat: `Sur les douze derniers mois, Kerbrélan a payé ${euros(PRIX_PAYE)} les 1 000 litres en moyenne, primes de qualité comprises ; Nordal ${euros(PRIX_PAYE + 3)}, la Laiterie de Trévallec ${euros(PRIX_PAYE - 3)}, la moyenne nationale ${euros(PRIX_PAYE - 1)}. Nordal communique sur une prime de bienvenue pour les nouveaux producteurs. Les écarts sont de quelques euros, et changent de sens d'une année à l'autre.`,
      },
      {
        id: "collecte",
        titre: "Demander au parc de collecte ce que coûtent les tournées",
        cout: 0.5,
        nature: "utile",
        resultat: `Quatorze camions-citernes font ${nombre(KM_SEMAINE, 0)} km par semaine, à ${nombre(COUT_KM, 2)} € le kilomètre (camion, chauffeur, gazole) : ${euros(COLLECTE_FIXE)} par semaine, ${parMille(COUT_COLLECTE_DEPART)} collectés en septembre, contre ${nombre(COUT_COLLECTE_AN_PASSE, 1)} € il y a un an. Les kilomètres n'ont pas baissé avec la collecte : quand une exploitation s'arrête, le camion passe quand même devant pour aller chercher la suivante.`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Visant Kerdiles, votre prédécesseur à la collecte, retraité",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Visant : « Le lait ne se perd pas en octobre, il se perd trois ans avant, quand personne n'est allé voir l'exploitant de 57 ans. Le spot, j'en ai acheté toute ma carrière : ça bouche le trou de la semaine, et la semaine d'après le trou est toujours là. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au comité de direction mercredi ?",
    options: [
      {
        t: "Couvrir le manque en spot au fil des besoins, comme chaque automne, et rouvrir le sujet avec l'OP à la négociation de janvier",
        d: "Ysée achète chaque semaine ce qui manque, au prix du marché. Rien d'autre ne change d'ici janvier.",
      },
      {
        t: `Proposer à l'OP une hausse générale du prix de base de ${HAUSSE.euros} € les 1 000 litres dès novembre, pour retenir les producteurs`,
        d: `Sur toute la collecte : environ ${kE(HAUSSE.euros * COLLECTE_SEMAINE * 1000)} par semaine.`,
      },
      {
        t: "Lancer un plan de transmission : un technicien référent pour chaque exploitation sans repreneur, la carte des départs, et la chambre d'agriculture associée",
        d: `Les deux techniciens y passent six semaines, remplacés au suivi qualité par un CDD : ${euros(PLAN.coutSemaine * (PLAN.fin - PLAN.debut + 1))}.`,
      },
      {
        t: "Envoyer un questionnaire à tous les producteurs sur leurs projets, et transmettre les réponses à la chambre d'agriculture",
        d: `Courrier, relance et saisie : ${euros(QUESTIONNAIRE.cout)}. Les réponses arrivent en trois semaines.`,
      },
    ],
    reactions: [
      [
        {
          ...YSEE,
          texte:
            "Entendu. Le courtier a de quoi couvrir octobre et novembre ; pour la semaine de Noël, il ne promet rien.",
        },
      ],
      [
        {
          ...KONOGAN,
          texte:
            "L'OP prend, et l'assemblée sera calme. Mais ceux qui partent à la retraite partiront quand même : ils me l'ont dit.",
        },
      ],
      [
        {
          ...SKLAERENN,
          texte:
            "On commence lundi par celles qui cherchent un repreneur. Selma Adjovi, à la chambre, a déjà des candidats à nous présenter.",
        },
      ],
      [
        {
          ...IWAN,
          texte:
            "Le questionnaire part demain. D'expérience, ceux qui vont arrêter répondent rarement.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les tournées s'étirent",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...JORAN,
        heure: "07:50",
        alerte: true,
        texte: `Hoel, le coût de collecte est à ${ctx.coutCollecte} les 1 000 litres. Fin octobre, trois exploitations vendent leur troupeau : mes camions passeront devant des fermes vides. On recalcule les tournées, ou on attend l'été comme d'habitude ?`,
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : ${ctx.collecte} collectés, contre ${ctx.collecteAnPasse} l'an dernier à la même semaine ; ${ctx.partAchete} du lait transformé acheté hors collecte, au spot à ${ctx.prixSpot} les 1 000 litres.`,
      },
      {
        ...SKLAERENN,
        heure: "18:20",
        texte:
          "Les cinq exploitations qui arrêtent ce trimestre n'ont trouvé personne ; trois exploitants ont plus de 63 ans. Aucun ne m'a parlé du prix du lait.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "carte",
        titre: "Reprendre avec Joran les kilomètres des tournées, exploitation par exploitation",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Recalculer les tournées dès la semaine ${TOURNEES.debutRecalcul} retire ${pct(TOURNEES.recalcul)} des kilomètres ; ${pct(TOURNEES.recalculCarte)} si l'on sait quelles exploitations vont s'arrêter d'ici l'été, pour ne pas refaire les tournées deux fois. ${ctx.carte ? "La carte des départs des techniciens le dit." : "Cette information, aujourd'hui, personne ne l'a."} Chaque point de kilomètres en moins vaut ${euros(COLLECTE_FIXE / 100)} par semaine.`,
      },
      {
        id: "trevallec",
        titre: "Appeler la Laiterie de Trévallec, qui collecte aux franges de notre zone",
        cout: 0.5,
        nature: "utile",
        resultat: `Rozenwenn Goasdoué, à la collecte de Trévallec : échanger les producteurs situés aux franges des deux zones, à volumes égaux, retirerait ${pct(TOURNEES.echange)} de nos kilomètres, à partir de la semaine ${TOURNEES.debutEchange}, le temps que les producteurs signent. Son comité de direction a refusé un échange semblable il y a deux ans ; elle pense avoir un peu plus d'une chance sur deux. L'étude coûte ${euros(TOURNEES.etude)}.`,
      },
      {
        id: "nordal",
        titre: "Écouter la proposition du responsable de collecte de Nordal",
        cout: 0.5,
        nature: "utile",
        resultat: `Nordal reprendrait volontiers la collecte des ${TOURNEES.exploitationsCedees} exploitations isolées du sud de notre zone, proches de ses tournées : ${pct(TOURNEES.cession)} de kilomètres en moins pour nous dès la semaine ${TOURNEES.debutCession}. Elles livrent ${ml(TOURNEES.volumeCede)} par an, qu'il faudrait remplacer : au spot, ${ECART_REMPLACEMENT} € les 1 000 litres de plus que notre lait collecté, collecte comprise.`,
      },
    ],
    question: "Que faites-vous des tournées ?",
    options: [
      {
        t: "Ne pas toucher aux tournées avant l'été, comme d'habitude",
        d: "Les camions continuent de passer devant les fermes qui s'arrêtent.",
      },
      {
        t: "Recalculer toutes les tournées maintenant, en tenant compte des arrêts connus",
        d: `Joran et les chauffeurs y passent trois semaines ; nouvelles tournées en semaine ${TOURNEES.debutRecalcul}.`,
      },
      {
        t: "Proposer à la Laiterie de Trévallec d'échanger les producteurs situés aux franges des deux zones",
        d: `Une étude à ${euros(TOURNEES.etude)}, puis des tournées plus courtes en semaine ${TOURNEES.debutEchange}, si Trévallec accepte.`,
      },
      {
        t: `Céder à Nordal la collecte des ${TOURNEES.exploitationsCedees} exploitations isolées du sud de la zone`,
        d: `Moins de kilomètres dès la semaine ${TOURNEES.debutCession} ; ${ml(TOURNEES.volumeCede)} par an qui partent chez Nordal.`,
      },
    ],
    reactions: [
      [
        {
          ...JORAN,
          texte: "Entendu. On garde les tournées d'été, et on fera avec.",
        },
      ],
      [
        {
          ...JORAN,
          texte:
            "On s'y met lundi avec les chauffeurs : ce sont eux qui connaissent les cours de ferme où un camion ne tourne pas.",
        },
      ],
      null,
      [
        {
          ...KONOGAN,
          texte:
            "Six de nos adhérents qui changent de laiterie sans l'avoir demandé ? L'OP l'acceptera, mais elle s'en souviendra.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le dispositif d'installation",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...SELMA,
        heure: "09:30",
        texte: `Monsieur Quiniou, ${ctx.projets} projets de reprise laitière sont prêts à démarrer dans votre secteur, avec des candidats du répertoire départ-installation. Ce qui les arrête : la mise aux normes des bâtiments, et une banque qui veut un contrat de collecte assez long pour prêter. Qu'est-ce que la laiterie peut leur proposer ?`,
      },
      {
        ...MARTA,
        heure: "12:10",
        texte:
          "Je suis salariée dans un GAEC de Merdrignac depuis six ans. Une exploitation de 500 000 litres se libère à côté : la banque me demande un contrat de collecte de dix ans, et la stabulation est à refaire.",
      },
      {
        ...IWAN,
        heure: "14:00",
        texte:
          "Une prime au litre pendant cinq ans, c'est un engagement. Combien d'installations, pour combien de lait, et ce que ça nous évite d'acheter en spot : je veux le calcul.",
      },
    ],
    sources: [
      {
        id: "chambre",
        titre: "Demander à la chambre d'agriculture ce qui fait aboutir une installation",
        cout: 0.5,
        nature: "decisive",
        resultat: `Dans le département, un projet de reprise laitière accompagné par la laiterie (contrat long, appui technique, financement de la mise aux normes) aboutit ${chance(1, false)} fois sur dix, ${chance(1, true)} quand la chambre peut détacher une conseillère pour le suivre. Avec une prime seule, sans accompagnement : ${chance(2, false)} fois sur dix (${chance(2, true)} avec la chambre). Sans rien : ${chance(0, false)} (${chance(0, true)}). Ce qui fait échouer : le financement de la mise aux normes, un contrat de collecte trop court pour la banque, un cédant et un repreneur qui ne s'entendent pas. Cette année, la chambre n'est pas sûre d'avoir une conseillère disponible : trois chances sur cinq.`,
      },
      {
        id: "valeur",
        titre: "Chiffrer avec Iwan ce que vaut un litre gardé",
        cout: 0.5,
        nature: "decisive",
        resultat: `Sur les trois dernières années, le lait spot acheté pour combler un manque a coûté en moyenne ${ECART_REMPLACEMENT} € les 1 000 litres de plus que le lait collecté, collecte comprise. Une reprise de ${nombre(VOLUME_PROJET * 1000, 0)} 000 litres par an gardée trois ans, la durée du plan de collecte, évite donc ${euros(VALEUR_ML * VOLUME_PROJET)} de spot. Sur ces trois ans, une prime de ${INSTALLATION[1]!.prime} € les 1 000 litres en coûte ${euros(surHorizon(INSTALLATION[1]!.prime, VOLUME_PROJET))}, une prime de ${INSTALLATION[2]!.prime} € ${euros(surHorizon(INSTALLATION[2]!.prime, VOLUME_PROJET))}, et une avance de ${euros(AVANCE.montant)} pour la mise aux normes ${euros(COUT_AVANCE)} (intérêts et risque de non-remboursement). La prime est versée à toutes les installations qui aboutissent, y compris celles qui se seraient faites sans elle.`,
      },
      {
        id: "nordal",
        titre: "Regarder ce que Nordal propose aux jeunes installés",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Nordal affiche une « prime jeune installé » de 25 € les 1 000 litres pendant trois ans. Sa plaquette est très bien faite ; son responsable de collecte ne connaît pas le nombre d'installations qu'elle a permises.",
      },
    ],
    question: "Que proposez-vous aux candidats à l'installation ?",
    options: [
      {
        t: "Pas de dispositif propre : orienter les candidats vers la chambre d'agriculture",
        d: "Ne coûte rien. La chambre les suit si elle le peut.",
      },
      {
        t: `Un dispositif complet : contrat de collecte de dix ans, prime de ${INSTALLATION[1]!.prime} € les 1 000 litres pendant ${DUREE_PRIME} ans, un technicien référent, et une avance remboursable pour la mise aux normes`,
        d: `Une convention avec la chambre (${euros(CONVENTION)}), ${euros(APPUI)} d'appui technique par projet, jusqu'à ${euros(AVANCE.montant)} d'avance par installation.`,
      },
      {
        t: `Une prime plus forte, ${INSTALLATION[2]!.prime} € les 1 000 litres pendant ${DUREE_PRIME} ans, sans accompagnement`,
        d: "Ne coûte que si l'installation se fait. Le reste, les candidats le règlent avec leur banque.",
      },
    ],
    reactions: [null, null, null],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Nordal chez les Guillouzic",
    jusqua: 8,
    messages: () => [
      {
        ...GUENOLE,
        heure: "08:15",
        alerte: true,
        texte: `Hoel, je vais être franc. Nordal est passé chez nous : ${GAEC.primeNordal} € de plus que vous, et ils prendraient tout notre lait au 1er janvier, quand notre contrat arrive à terme. Moi, je pars à la retraite dans un an. C'est Padrig qui décidera.`,
      },
      {
        ...PADRIG,
        heure: "09:40",
        texte: `Ce n'est pas le prix qui me fait hésiter. Pour reprendre les parts de mon père, il me faut un robot de traite : ${euros(GAEC.avance)} d'apport, et une banque qui veut un contrat de collecte de dix ans. Nordal ne m'a parlé que du prix.`,
      },
      {
        ...KONOGAN,
        heure: "11:00",
        texte:
          "Si vous payez le GAEC Guillouzic plus cher que les autres, je le saurai, et toute l'OP le saura. L'accord-cadre prévoit le même prix de base pour tous.",
      },
    ],
    sources: [
      {
        id: "gaec",
        titre: "Faire le point sur le GAEC Guillouzic avec son technicien",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le GAEC livre ${ml(GAEC.volume)} par an, 160 vaches, deux associés : Guénolé, 61 ans, et son fils Padrig, 29 ans. Le contrat arrive à terme le 31 décembre. Garder ce lait trois ans évite ${euros(VALEUR_ML * GAEC.volume)} de spot. Le projet de Padrig tient si le robot est financé : ${ctx.dispositif ? `il entre dans le dispositif d'installation décidé en semaine 4 (contrat de dix ans, prime de ${INSTALLATION[1]!.prime} €, avance), ce que la banque attend` : "la laiterie n'a pas de dispositif d'installation complet : une promesse faite pour lui seul pèsera peu devant la banque"}.`,
      },
      {
        id: "accord",
        titre: "Relire l'accord-cadre avec l'OP",
        cout: 0.5,
        nature: "utile",
        resultat: `L'accord-cadre fixe le même prix de base pour tous les adhérents de l'OP ; les primes de qualité et de saisonnalité sont publiques. Une prime individuelle n'est pas interdite, mais l'OP négocie au nom de tous : si elle l'apprend, elle demandera la même chose pour tous. ${GAEC.hausseFuite} € de plus pour tous de décembre à la fin de l'année coûteraient environ ${kE(GAEC.hausseFuite * COLLECTE_SEMAINE * 1000 * (13 - GAEC.debutFuite + 1))}.`,
      },
    ],
    question: "Que proposez-vous au GAEC Guillouzic ?",
    options: [
      {
        t: `Lui proposer une prime individuelle de ${GAEC.primeNordal} € les 1 000 litres, pour s'aligner sur Nordal`,
        d: `Hors accord-cadre : ${euros(GAEC.primeNordal * GAEC.volume * 1000)} par an.`,
      },
      {
        t: "Proposer à Padrig d'entrer dans le dispositif d'installation : contrat de dix ans, et une avance pour le robot de traite",
        d: `Le prix reste celui de l'accord-cadre ; l'avance de ${euros(GAEC.avance)} est remboursable sur sept ans.`,
      },
      {
        t: "Laisser le GAEC choisir : on ne retient pas un producteur de force",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [{ ...GUENOLE, texte: "Merci. Padrig réfléchit ; on vous dit début décembre." }],
      [
        {
          ...PADRIG,
          texte: "Je vais voir la banque avec votre proposition lundi. On vous dit début décembre.",
        },
      ],
      [{ ...GUENOLE, texte: "Bien compris. On vous dit début décembre." }],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le pic de Noël",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...YSEE,
        heure: "08:30",
        alerte: true,
        texte: `Hoel, le plan de production de décembre est calé : ${ml(BESOIN[PIC.debut]!, 2)} par semaine en semaines ${PIC.debut} à ${PIC.fin}, pour les crèmes desserts et le riz au lait de Noël. Avec la collecte prévue, il manquera ${ctx.manque} par semaine. L'an dernier, le spot de Noël était rare et cher.`,
      },
      {
        ...MORWENNA,
        heure: "10:00",
        texte:
          "Les crèmes desserts de Noël, c'est notre meilleur mois. Une rupture chez Celtis la semaine de Noël, je ne veux pas en entendre parler.",
      },
      {
        ...MELAINE,
        heure: "15:00",
        texte: `Je peux vous garantir le manque de décembre à prix ferme, ${euros(TERME.prix)} les 1 000 litres, livré. Sinon, ce sera le spot de la semaine, s'il y en a.`,
      },
    ],
    sources: [
      {
        id: "noel",
        titre: "Reprendre avec Ysée et le courtier les trois derniers Noëls",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Au spot de cette semaine, ${ctx.prixSpot} les 1 000 litres, ajoutez environ ${SPOT.noel} € à Noël. Quand le spot est cher, c'est que le lait manque partout : les années chères, le courtier n'a trouvé que ${nombre((DISPO.haut - DISPO.pente) * 1000, 0)} 000 litres par semaine au pic, contre plus d'un million les années calmes. Son prix ferme : ${euros(TERME.prix)}, sur le manque prévu ; ce qui serait de trop se revend en lait de report, ${TERME.decote} € sous le spot. Une prime de ${PRIME_DECEMBRE.euros} € les 1 000 litres sur les litres livrés en plus de décembre dernier a fait livrer entre ${nombre(PRIME_DECEMBRE.reponseMin * 1000, 0)} 000 et ${nombre(PRIME_DECEMBRE.reponseMax * 1000, 0)} 000 litres de plus par semaine, selon les fourrages, dans une laiterie voisine ; elle est aussi payée à ceux qui auraient livré plus de toute façon, environ ${nombre(PRIME_DECEMBRE.aubaine * 1000, 0)} 000 litres par semaine.`,
      },
      {
        id: "desserts",
        titre: "Demander au contrôle de gestion ce que coûtent 1 000 litres qui manquent au pic",
        cout: 0.5,
        nature: "utile",
        resultat: `1 000 litres de lait font ${nombre(DESSERTS.kilos, 0)} kg de crèmes desserts, vendus ${DESSERTS.prixKilo.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € le kilo net aux enseignes : ${euros(VALEUR_DESSERTS)}. Sucre, amidon, cacao, emballages et énergie en coûtent ${euros(DESSERTS.autresCouts)} : ${euros(MARGE_DESSERTS)} de marge sur coûts variables hors lait. Les enseignes facturent ${pct(DESSERTS.penalites)} de pénalités logistiques sur ce qui n'est pas livré : ${euros(DESSERTS.penalites * VALEUR_DESSERTS)}. Chaque millier de litres qui manque coûte ${euros(PERTE_RUPTURE)}, deux fois le prix du spot le plus cher.`,
      },
    ],
    question: "Comment couvrez-vous le pic de décembre ?",
    options: [
      {
        t: "Acheter en spot au fil des besoins, comme chaque Noël",
        d: "Ysée achète chaque semaine ce qui manque, au prix du marché.",
      },
      {
        t: "Acheter dès maintenant à terme tout le manque prévu de décembre, à prix ferme",
        d: `${euros(TERME.prix)} les 1 000 litres livrés ; le surplus éventuel revendu en lait de report.`,
      },
      {
        t: `Proposer aux producteurs une prime de décembre de ${PRIME_DECEMBRE.euros} € les 1 000 litres sur les litres livrés en plus, et acheter le reste en spot`,
        d: "La prime est payée sur les litres livrés en plus de décembre dernier, exploitation par exploitation.",
      },
    ],
    reactions: [
      [
        {
          ...YSEE,
          texte: "Entendu. Le courtier me prévient qu'il ne garantit rien la semaine de Noël.",
        },
      ],
      [
        {
          ...MELAINE,
          texte: `C'est signé : votre manque de décembre, à ${euros(TERME.prix)} les 1 000 litres, livré en semaines ${PIC.debut} à ${PIC.fin}.`,
        },
      ],
      [
        {
          ...KONOGAN,
          texte:
            "La prime est annoncée avec la paie de novembre. Plusieurs producteurs vont garder leurs vaches de réforme un mois de plus et soigner la ration.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Les terres qui se libèrent",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...SKLAERENN,
        heure: "09:00",
        texte: `Dix-sept exploitations s'arrêtent l'an prochain : leurs terres et une partie de leurs vaches vont se libérer. Parmi leurs voisins, ${ctx.hesitants} m'ont dit qu'ils reprendraient, si on leur garantit de collecter le lait en plus.`,
      },
      {
        ...IWAN,
        heure: "11:40",
        texte: `La Coopérative laitière de Kerhoren nous propose un contrat d'approvisionnement : ${ml(COOPERATIVE.volume, 0)} par an pendant trois ans, livrés à l'usine. C'est du lait sûr.`,
      },
      {
        ...KONOGAN,
        heure: "16:30",
        texte:
          "À l'assemblée, des producteurs ont demandé qu'on ouvre du volume à tous ceux qui veulent produire plus. Je leur ai dit que je vous poserais la question.",
      },
    ],
    sources: [
      {
        id: "voisins",
        titre: "Faire avec Sklaerenn la liste des voisins prêts à s'agrandir",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.carte ? "La carte des départs le montre" : "Ce que l'on sait aujourd'hui"} : ${ctx.hesitants} exploitations voisines de celles qui s'arrêtent hésitent à reprendre des terres et des vaches, ${nombre(AGRANDIR.volume * 1000, 0)} 000 litres de plus par an chacune. Elles demandent un volume garanti sous contrat de sept ans et une avance de ${euros(AGRANDIR.avance)} pour agrandir le bâtiment (${euros(COUT_AVANCE_AGRANDIR)} d'intérêts et de risque). Une sur deux, à peu près, ira au bout. Ce lait-là remplace, au même endroit et à la même saison, celui des exploitations qui s'arrêtent : il garde les tournées pleines.${ctx.carte ? "" : " Les autres voisins, personne n'est allé les voir."}`,
      },
      {
        id: "saisons",
        titre: "Regarder quand arriverait le lait d'un volume ouvert à tous",
        cout: 0.5,
        nature: "decisive",
        resultat: `Ceux qui demandent du volume sont surtout de grandes exploitations à l'herbe, loin des arrêts : ${pct(OUVERT.printemps)} du lait en plus arriverait d'avril à juin, quand l'usine revend déjà ses excédents en spot à ${euros(OUVERT.spotPrintemps)} les 1 000 litres, ${euros(PRIX_PAYE - OUVERT.spotPrintemps)} de moins qu'elle ne les paie ; l'autre moitié épargnerait du spot d'automne, ${ECART_REMPLACEMENT} € les 1 000 litres. En moyenne, chaque millier de litres ouvert ferait perdre ${euros(-VALEUR_OUVERT)} par an : ${kE(-OUVERT.volume * 1000 * VALEUR_OUVERT * HORIZON)} sur trois ans pour ${ml(OUVERT.volume, 0)} par an.`,
      },
      {
        id: "kerhoren",
        titre: "Étudier l'offre de la Coopérative de Kerhoren",
        cout: 0.5,
        nature: "utile",
        resultat: `${ml(COOPERATIVE.volume, 0)} par an pendant trois ans, livrés à l'usine d'octobre à mars, ${COOPERATIVE.surcout} € les 1 000 litres au-dessus de ce que coûte notre lait collecté, collecte comprise. Le spot qu'il remplacerait coûte ${ECART_REMPLACEMENT} € de plus que notre lait : il en épargne ${ECART_REMPLACEMENT - COOPERATIVE.surcout} par millier de litres, soit ${kE(surHorizon(ECART_REMPLACEMENT - COOPERATIVE.surcout, COOPERATIVE.volume))} sur trois ans. Un lait sûr, mais acheté à d'autres.`,
      },
    ],
    question: "Que faites-vous du lait des exploitations qui s'arrêtent ?",
    options: [
      {
        t: "Laisser faire : chacun s'organise",
        d: "Les terres iront à qui les prendra ; le lait, à qui le collectera.",
      },
      {
        t: "Proposer aux voisins qui hésitent un volume garanti sous contrat de sept ans, avec une avance pour agrandir le bâtiment",
        d: `${nombre(AGRANDIR.volume * 1000, 0)} 000 litres de plus par an chacun ; ${euros(AGRANDIR.avance)} d'avance par projet. Ils répondent avant la fin de l'année.`,
      },
      {
        t: "Ouvrir un volume supplémentaire à tous les producteurs qui le demandent, au prix de base",
        d: `${ml(OUVERT.volume, 0)} par an, à qui veut produire plus.`,
      },
      {
        t: "Signer le contrat d'approvisionnement de la Coopérative de Kerhoren",
        d: `${ml(COOPERATIVE.volume, 0)} par an pendant trois ans, livrés à l'usine, à ${COOPERATIVE.surcout} € au-dessus de notre lait collecté.`,
      },
    ],
    reactions: [
      [{ ...SKLAERENN, texte: "Entendu. Je leur dirai que rien n'est prévu pour l'instant." }],
      [
        {
          ...SKLAERENN,
          texte:
            "Les propositions sont parties, une par une, avec leur technicien. Ils répondent d'ici Noël.",
        },
      ],
      [
        {
          ...KONOGAN,
          texte:
            "L'OP fera passer le message. Les demandes arrivent déjà, surtout des grandes exploitations du nord de la zone.",
        },
      ],
      [{ ...IWAN, texte: "Le contrat est signé : premières livraisons en janvier." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Sécuriser le lait en amont", chemin: [2, 1, 1, 1, 2, 1] },
  { nom: "Acheter le lait qui manque et payer plus cher", chemin: [1, 0, 2, 0, 0, 2] },
  { nom: "Attentiste", chemin: [0, 0, 0, 2, 0, 0] },
] as const;

/**
 * Les réflexes d'un responsable de collecte sous la pression du lait qui manque,
 * [décision, option] : acheter le manque en spot au fil des besoins (en semaine 1, puis au
 * pic de Noël), ou augmenter le prix de base pour tous. La prime individuelle au GAEC n'y
 * figure pas : elle cible un producteur, elle ne paie pas tout le monde.
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [4, 0],
] as const;

export const REPONSES = {
  echangeAccepte: `Notre comité de direction accepte l'échange : les producteurs des franges signent d'ici la semaine ${TOURNEES.debutEchange}, et vos tournées raccourcissent de ${pct(TOURNEES.echange)}.`,
  echangeRefuse:
    "Notre comité de direction refuse l'échange : il ne veut pas toucher à ses tournées cette année. Je suis désolée.",
  chambreActive:
    "La chambre m'a détachée à mi-temps sur vos projets jusqu'en mars : je suivrai chaque candidat avec son technicien.",
  chambreAbsente:
    "La chambre ne peut pas me détacher cette année : je suivrai vos candidats entre deux autres dossiers, quand je le pourrai.",
} as const;
