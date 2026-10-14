/**
 * LES POSTES QU'ON NE POURVOIT PLUS — le contenu de l'épisode.
 *
 * Mounir Belghazi est directeur des ressources humaines du Groupe Escale, au
 * siège d'Annecy. De février à avril se signent les contrats de l'été :
 * soixante-quatre saisonniers à trouver pour les cuisines, les salles, les
 * réceptions et les étages des hôtels du lac et de la montagne, face aux
 * hôtels suisses qui paient davantage et aux loyers d'été du lac. Six
 * décisions, chacune précédée de ce qu'un DRH de groupe reçoit vraiment : une
 * directrice générale qui veut un plan, des directeurs d'hôtel qui veulent
 * payer plus, un chef qui perd des candidats au téléphone, une revenue
 * manager qui lit le pick-up, un élu du CSE qui rapporte ce que disent les
 * fidèles.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : le coût d'un cuisinier vacant, ce qu'un poste vide
 * coûte métier par métier, la masse salariale d'été et le coût du service
 * sans coupure, le coût du logement, les candidats qui finissent la saison,
 * le surcoût de l'intérim.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import {
  ABANDON,
  BESOIN,
  BUDGET_CAMPAGNE,
  CHARGES,
  DEJEUNER,
  FIDELES,
  HORAIRES,
  INTERIM,
  LOGEMENT,
  MASSE_ETE,
  METIERS,
  MONTANTS,
  ORGANISATION,
  ORGANISE,
  PERMANENTS,
  PLACES,
  REAFFECTATION,
  SAISON,
  SCENARIOS,
  SIGNES_DEPART,
  SURCOUT_INTERIM,
  VALEUR_POSTE,
  coutDeVacance,
  coutDuLogement,
  finissentSurCent,
  PERTE_MOYENNE,
  SALAIRE_MOYEN,
} from "@/engine/episodes/postes-introuvables";
import { euros, kE, nombre, taux } from "./format";
import type { Contexte, Etape } from "./types";

const ISALINE = { de: "Isaline Perraud", role: "Directrice générale du Groupe Escale" } as const;
const MARCEAU = { de: "Marceau Dupré", role: "Directeur administratif et financier" } as const;
const ROMY = { de: "Romy Castellane", role: "Directrice de L'Escale Lac" } as const;
const PROSPER = { de: "Prosper Okafor", role: "Chef de cuisine de L'Escale Lac" } as const;
const DRAGANA = { de: "Dragana Petković", role: "Gouvernante générale de L'Escale Lac" } as const;
const ANNABELLE = { de: "Annabelle Socquet", role: "Directrice de L'Escale Megève" } as const;
const MARWA = { de: "Marwa Selmi", role: "Chargée de recrutement, siège" } as const;
const LUCILE = { de: "Lucile Fabbri", role: "Responsable revenue management, siège" } as const;
const EULOGE = {
  de: "Euloge Nkounkou",
  role: "Valet de chambre à L'Escale Évian, élu du CSE",
} as const;
const ALPEA = { de: "Alpéa Intérim", role: "Agence d'Annecy" } as const;

/** Une somme brute par mois, au coût employeur. */
const charge = (brut: number) => brut * CHARGES;
const k1 = (v: number) => `${nombre(v / 1000, 1)} k€`;
const EN_LETTRES = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];

export const DIAGNOSTICS = [
  {
    id: "logement",
    t: "Le logement d'abord : six candidats sur dix viennent d'ailleurs, et sans toit ils refusent, se désistent avant juin ou partent en juillet ; le salaire d'embauche n'est pas le premier frein",
  },
  {
    id: "coupures",
    t: "Les conditions de travail font fuir : la coupure et des plannings connus la veille découragent les candidats et font partir en pleine saison",
  },
  {
    id: "salaire",
    t: "Les salaires d'embauche sont trop bas face à la Suisse : il faut les relever pour attirer",
  },
  {
    id: "visibilite",
    t: "Les offres ne sont pas assez vues : il faut plus d'annonces, sur plus de sites",
  },
] as const;

/** Le scénario de la saison, tel que les messages le lisent : −1 tant que le pick-up n'est pas connu. */
const saison = (ctx: Contexte) => Number(ctx.scenario ?? -1);

/** Ce que le pick-up dit, scénario par scénario. */
export const PICKUP = [
  {
    to: 71,
    texte:
      "Le pick-up de l'été est très au-dessus de l'an dernier : juillet-août à 71 % d'occupation sur les livres, contre 58 % à la même date. Le Lac et Évian sont presque complets en août, les mariages d'Escale Événements aussi ; Aix-les-Bains et Albertville restent calmes.",
  },
  {
    to: 59,
    texte:
      "Le pick-up de l'été est au niveau de l'an dernier : 59 % d'occupation sur les livres pour juillet-août, contre 58 % à la même date. Évian tient grâce aux mariages, le Lac est bien parti ; Megève et Aix-les-Bains sont en retrait.",
  },
  {
    to: 49,
    texte:
      "Le pick-up de l'été est en dessous de l'an dernier : 49 % d'occupation sur les livres pour juillet-août, contre 58 % à la même date. Sur Bookalia et Voyagio, les clients réservent tard ; Megève et Aix-les-Bains sont très en retrait, seul le Lac résiste.",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Soixante-quatre postes pour l'été",
    jusqua: 2,
    messages: () => [
      {
        ...ISALINE,
        heure: "08:15",
        alerte: true,
        texte: `Mounir, le plan d'été est validé : ${BESOIN} saisonniers à trouver dans les cuisines, les salles, les réceptions et les étages, en plus des ${FIDELES} fidèles qui reviennent. L'an dernier, 17 postes sont restés vides et L'Escale Lac a fermé des déjeuners tout le mois d'août. C'est de février à avril que tout se joue : en mai, les bons sont pris. Je veux ton plan de campagne vendredi ; tu as ${kE(BUDGET_CAMPAGNE)}.`,
      },
      {
        ...ROMY,
        heure: "09:10",
        texte:
          "Les hôtels de Lausanne et de Montreux recrutent déjà, et ils paient en francs. Il faut payer plus à l'embauche, Mounir, sinon on n'aura personne.",
      },
      {
        ...MARWA,
        heure: "10:30",
        texte: `${SIGNES_DEPART} contrats d'été signés en janvier, une dizaine de candidatures sérieuses la semaine dernière. La moitié des candidats que j'appelle me demandent d'abord s'il y a un logement.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "refus",
        titre: "Relire les refus et les désistements de la campagne de l'an dernier",
        cout: 1,
        nature: "decisive",
        resultat: `L'an dernier, 17 des 52 postes saisonniers sont restés vides tout l'été. Sur les 88 candidats qui ont refusé une offre ou se sont désistés, 51 ont cité le logement (58 %), 19 la coupure ou des plannings connus trop tard (22 %), 11 le salaire (13 %), 7 autre chose. Six candidats sur dix viennent d'ailleurs que du bassin annécien. Sur cent candidats venus d'ailleurs, ${nombre(finissentSurCent(false), 0)} ont fini la saison quand ils devaient se loger seuls ; ${nombre(finissentSurCent(true), 0)} quand le groupe avait pu les loger.`,
      },
      {
        id: "cuisine",
        titre: "Demander à Prosper Okafor ce que coûte un cuisinier qui manque",
        cout: 1,
        nature: "decisive",
        resultat: `Prosper Okafor : « Ma brigade d'été, c'est six cuisiniers. À cinq, je ne tiens pas les deux services sept jours sur sept : je ferme le déjeuner ${EN_LETTRES[DEJEUNER.servicesFermes]} jours par semaine, le lundi et le mardi. L'été, le déjeuner, c'est ${DEJEUNER.couverts} couverts à ${DEJEUNER.ticket} € de ticket moyen hors taxes, et mon ratio matière est à ${taux(DEJEUNER.ratioMatiere, 0)}. La salle est en place de toute façon : elle reste payée. Un cuisinier saisonnier coûte ${euros(METIERS[0].salaire)} par semaine, charges comprises, et la saison dure ${SAISON} semaines, de mi-juin à début septembre. »`,
      },
      {
        id: "suisse",
        titre: "Comparer les salaires avec ceux des hôtels suisses voisins",
        cout: 1,
        nature: "bruit",
        resultat:
          "À Lausanne ou à Genève, un commis de cuisine gagne autour de 4 300 francs suisses brut par mois, un réceptionniste 4 100, une femme de chambre 3 900 : plus du double d'un salaire de la convention collective HCR. Mais la vie y coûte en proportion, et un saisonnier qui travaille en Suisse doit s'y loger. Aucune prime d'embauche française ne comblera l'écart.",
      },
      {
        id: "loyers",
        titre: "Faire le point sur le logement des saisonniers autour du lac et à Megève",
        cout: 0.5,
        nature: "utile",
        resultat: `Un studio meublé se loue 950 € par mois à Annecy l'été, quand un saisonnier gagne environ 1 750 € net. L'ancienne colonie de vacances de Sévrier est à louer : 14 appartements, ${LOGEMENT.lits} lits, ${euros(LOGEMENT.loyer)} par mois charges comprises ; son propriétaire, la SCI du Laudon, préfère louer d'avril à octobre et n'acceptera peut-être pas cinq mois. La résidence Les Rhodos, à Megève, accepterait une convention : ${LOGEMENT.megevePlaces} places à ${euros(LOGEMENT.megeveLoyer)} par mois pendant ${EN_LETTRES[LOGEMENT.megeveMois]} mois. Le groupe peut retenir ${euros(LOGEMENT.retenue)} par mois au saisonnier logé.`,
      },
      {
        id: "conseil",
        titre: "Appeler Ansgar Bouchet, ancien DRH d'un groupe hôtelier de stations",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Ansgar Bouchet : « Avant de parler salaire, demande-toi où tes saisonniers vont dormir, et à quelle heure ils finiront le soir. Et ne paie jamais un nouveau plus qu'un ancien : dans une brigade, ça se sait en trois jours. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Sur quoi bâtissez-vous la campagne de l'été ?",
    options: [
      {
        t: "Relever de 150 € brut par mois le salaire d'embauche des saisonniers, et doubler les annonces",
        d: `Pour les nouveaux contrats de l'été. ${euros(MONTANTS.annoncesDoublees)} d'annonces, et ${euros(charge(MONTANTS.salaireEntree))} par mois et par recrue, charges comprises.`,
      },
      {
        t: "Loger : louer l'immeuble de Sévrier, conventionner la résidence de Megève, et l'écrire dans les offres",
        d: `${PLACES} lits. ${k1(coutDuLogement(true))} de loyers sur cinq mois, moins ${euros(LOGEMENT.retenue)} par mois retenus aux saisonniers logés. Le propriétaire de Sévrier doit accepter un bail de cinq mois.`,
      },
      {
        t: "Verser une indemnité de logement de 200 € brut par mois aux saisonniers venus d'ailleurs",
        d: `${euros(charge(MONTANTS.indemnite))} par mois et par saisonnier, charges comprises. À chacun de trouver où se loger.`,
      },
      {
        t: "Relancer la campagne de l'an dernier",
        d: "Les mêmes annonces, sur les mêmes sites, en ligne dès lundi. Rien de plus à payer.",
      },
    ],
    reactions: [
      [
        {
          ...MARWA,
          texte:
            "Les annonces sont en ligne, avec le nouveau salaire. Les candidatures montent un peu ; la première question reste : « Vous logez ? »",
        },
      ],
      null,
      [
        {
          ...ANNABELLE,
          texte:
            "200 € par mois, c'est un geste. Mais à Megève, l'été, il n'y a rien à louer à moins de 900 €, et presque rien du tout.",
        },
      ],
      [
        {
          ...ROMY,
          texte:
            "Comme l'an dernier, alors. L'an dernier, il m'a manqué cinq personnes en juillet.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les directeurs veulent une prime",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...ROMY,
        heure: "09:20",
        alerte: true,
        texte:
          "Un hôtel de Montreux offre 1 500 francs à la signature. Si on ne met pas une prime d'embauche, on perd les meilleurs : 600 € pour les nouveaux, Mounir, et on n'en parle plus.",
      },
      {
        ...MARWA,
        heure: "17:30",
        texte: `Point de la semaine : ${ctx.pourvus} contrats d'été signés sur ${BESOIN}, ${ctx.candidatures} candidatures sérieuses.${
          ctx.loge
            ? " Depuis qu'on écrit « logé » dans les offres, des candidats de Lyon et de Grenoble rappellent."
            : ""
        }`,
      },
      ...(ctx.salaireNouveaux
        ? [
            {
              ...EULOGE,
              heure: "18:10",
              texte:
                "Les fidèles ont appris que les nouveaux seront payés 150 € de plus qu'eux. Trois m'ont demandé s'ils devaient vraiment revenir cet été.",
            },
          ]
        : []),
    ],
    reevaluation: true,
    sources: [
      {
        id: "fideles",
        titre:
          "Comparer ce que gagnent les fidèles et les permanents avec ce qu'on offrirait aux nouveaux",
        cout: 0.5,
        nature: "decisive",
        resultat: `Un commis fidèle, à sa cinquième saison, est payé 1 880 € brut par mois ; une recrue avec la prime d'embauche toucherait l'équivalent de ${euros(1880 + MONTANTS.primeEmbauche / 3)} sur ses trois mois. ${FIDELES} fidèles ont déjà re-signé, ${PERMANENTS} permanents travaillent dans les mêmes métiers. À L'Escale Évian, il y a deux ans, une prime d'arrivée réservée aux nouveaux s'est sue en une semaine : quatre fidèles sur onze ne sont pas revenus. Léopold Vittoz, second de cuisine du Lac depuis onze ans, gagne moins que ce qu'on promettrait à un chef de partie qui arrive.`,
      },
      {
        id: "sortie",
        titre: "Relire les départs en cours de saison de l'été dernier",
        cout: 0.5,
        nature: "utile",
        resultat: `L'été dernier, à peu près un saisonnier sur sept est parti avant la fin de son contrat, la moitié en juillet, au plus fort de la saison ; un sur quatre parmi ceux qui se logeaient seuls. Un contrat saisonnier n'ouvre pas droit à l'indemnité de fin de contrat de 10 % : rien ne retient jusqu'au dernier jour. Les groupes qui versent une prime de fin de saison à ceux qui finissent leur contrat voient ces départs divisés par plus de deux, et les désistements d'avant saison reculer.`,
      },
    ],
    question: "Que répondez-vous aux directeurs ?",
    options: [
      {
        t: "Une prime d'embauche de 600 € brut pour les nouvelles recrues",
        d: `${euros(charge(MONTANTS.primeEmbauche))} par recrue, charges comprises, versés moitié à la signature, moitié fin juillet.`,
      },
      {
        t: "Pas de prime à l'embauche : une prime de fin de saison de 350 € brut pour tous ceux qui finissent leur contrat, fidèles compris",
        d: `${euros(charge(MONTANTS.primeFin))} par saisonnier qui va au bout, charges comprises ; rien pour qui part avant.`,
      },
      {
        t: "Revaloriser de 50 € brut par mois tous les salaires des métiers en tension, permanents compris",
        d: `Pour les ${PERMANENTS} permanents dès mars, ${k1(charge(MONTANTS.revalorisation) * PERMANENTS * MONTANTS.moisPermanents)} d'ici septembre ; et pour tous les saisonniers de l'été.`,
      },
      {
        t: "Ne rien changer aux rémunérations",
        d: "La grille de la convention collective et les usages du groupe.",
      },
    ],
    reactions: [
      [
        {
          ...EULOGE,
          texte:
            "Les fidèles l'ont su dès le lendemain. « On revient chaque été, et c'est le nouveau qui a la prime ? » Je n'ai pas su quoi leur répondre.",
        },
      ],
      [
        {
          ...ROMY,
          texte:
            "Une prime pour ceux qui vont au bout de la saison… Les fidèles aiment bien, et ça me protège du mois de juillet.",
        },
      ],
      [
        {
          ...MARCEAU,
          texte:
            "50 € pour tout le monde, c'est cher et ce n'est pas réversible : je l'inscris dans le budget de l'année.",
        },
      ],
      [
        {
          ...ROMY,
          texte: "On verra bien qui vient. Je te préviens : Montreux, lui, paie à la signature.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "La coupure",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...PROSPER,
        heure: "15:40",
        alerte: true,
        texte:
          "Trois candidats cuisiniers ont raccroché cette semaine quand je leur ai décrit les horaires : 10 h – 14 h 30, puis 18 h 30 – 23 h. L'un m'a dit : « En Suisse, c'est en continu. »",
      },
      {
        ...DRAGANA,
        heure: "16:05",
        texte:
          "Aux étages, c'est pareil : les candidates veulent finir à 15 heures et connaître leur planning avant le dimanche soir. Chez nous, il sort le vendredi.",
      },
      {
        ...MARWA,
        heure: "17:30",
        texte: `Point de la semaine : ${ctx.pourvus} contrats valables sur ${BESOIN} ; depuis février, ${ctx.desistementsTexte}.`,
      },
    ],
    sources: [
      {
        id: "evian",
        titre: "Demander ce qu'a donné le service sans coupure à L'Escale Évian l'été dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: `L'Escale Évian est passée l'été dernier à deux équipes décalées (7 h – 15 h et 15 h – 23 h) en salle et aux étages, et à la semaine de quatre jours pour les cuisiniers volontaires. À offre égale, elle a signé environ ${nombre((HORAIRES.continu / HORAIRES.coupure - 1) * 100, 0)} % de candidats de plus qu'avec la coupure, et les départs en cours de saison ont baissé de 40 %. Ce que ça coûte : les heures où les deux équipes se chevauchent, environ ${taux(ORGANISATION.tient, 0)} de la masse salariale d'été. Mais c'est le chef qui fait tenir les équipes décalées : à Chambéry, le chef n'y a pas cru et l'essai s'est défait en trois semaines. Ici, deux chefs sur cinq sont réticents ; une généralisation tiendrait à peu près deux fois sur trois. Là où elle tient mal, elle coûte ${taux(ORGANISATION.malTenu, 1)} de la masse salariale et ne rapporte qu'une partie. Publier les plannings trois semaines à l'avance, sans toucher à la coupure, a fait gagner environ ${nombre((HORAIRES.planning / HORAIRES.coupure - 1) * 100, 0)} % de signatures à Aix-les-Bains.`,
      },
      {
        id: "masse",
        titre: "Demander à Marceau Dupré la masse salariale d'été des équipes concernées",
        cout: 0.5,
        nature: "utile",
        resultat: `Marceau Dupré : « L'été, ces métiers comptent ${PERMANENTS + FIDELES + BESOIN} personnes : ${PERMANENTS} permanents, ${FIDELES} fidèles et ${BESOIN} saisonniers. Leur masse salariale sur les ${SAISON} semaines de la saison, charges comprises : ${nombre(MASSE_ETE / 1e6, 2)} M€. ${taux(ORGANISATION.tient, 0)}, c'est ${kE(MASSE_ETE * ORGANISATION.tient)} ; ${taux(ORGANISATION.malTenu, 1)}, ${kE(MASSE_ETE * ORGANISATION.malTenu)}. »`,
      },
    ],
    question: "Que faites-vous de la coupure ?",
    options: [
      {
        t: "Supprimer la coupure dès cet été dans tous les hôtels : deux équipes décalées, et la semaine de quatre jours pour les cuisiniers volontaires",
        d: "Écrit dans les offres dès la semaine 5. Environ 2 % de masse salariale d'été en chevauchements.",
      },
      {
        t: "Tester d'abord un mois à L'Escale Lac et à la Table d'Augustin d'Annecy, puis généraliser si ça tient",
        d: `${euros(MONTANTS.test)} pour l'essai. Les offres « sans coupure » partiraient en semaine 9.`,
      },
      {
        t: "Garder la coupure, mais publier les plannings trois semaines à l'avance et garantir deux jours de repos consécutifs",
        d: `${euros(MONTANTS.planning)} pour le module de planification d'Hostéo et le temps des chefs.`,
      },
      {
        t: "Garder l'organisation actuelle : la coupure fait partie du métier",
        d: "Rien ne change en cuisine, en salle ni aux étages.",
      },
    ],
    reactions: [
      [
        {
          ...PROSPER,
          texte:
            "D'accord. Je refais le planning de la brigade en deux équipes. Il faudra que tous les chefs jouent le jeu, pas seulement moi.",
        },
      ],
      [
        {
          ...PROSPER,
          texte: "On essaie chez moi et à Annecy. Rendez-vous dans un mois.",
        },
      ],
      [
        {
          ...DRAGANA,
          texte:
            "Les plannings à trois semaines, les filles vont apprécier. La coupure, elles la gardent.",
        },
      ],
      [
        {
          ...PROSPER,
          texte:
            "Je continuerai à expliquer les horaires aux candidats. À ceux qui restent au téléphone, en tout cas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le vivier se tarit",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...ISALINE,
        heure: "08:40",
        alerte: true,
        texte: `${ctx.pourvus} contrats valables sur ${BESOIN}, à six semaines de la fin avril. Les annonces ne rapportent plus grand-chose : où vas-tu chercher les autres ?`,
      },
      {
        ...MARWA,
        heure: "11:15",
        texte: `${ctx.candidatures} candidatures sérieuses cette semaine. Le forum des saisonniers de Lyon a lieu en semaine 8 ; deux lycées hôteliers cherchent des contrats d'été pour leurs élèves.`,
      },
      ...(ctx.iniquite
        ? [
            {
              ...EULOGE,
              heure: "14:30",
              texte:
                "Depuis l'histoire des nouveaux mieux payés, l'ambiance n'est pas à faire venir des copains. Deux fidèles ont annulé leur contrat d'été.",
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "equipes",
        titre: "Demander aux équipes en place qui elles pourraient faire venir",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Sur les ${PERMANENTS + FIDELES} permanents et fidèles, une quarantaine connaissent quelqu'un du métier prêt à venir l'été. Dans les groupes qui la pratiquent, la cooptation apporte, pour des équipes de cette taille, une à deux candidatures sérieuses par semaine, qui signent deux fois plus souvent que les autres, se désistent deux fois moins et partent deux fois moins en cours de saison (${taux(ABANDON.coopte, 0)}, contre ${taux(ABANDON.loge, 0)} à ${taux(ABANDON.local, 0)}). Une prime de ${euros(MONTANTS.cooptation)} brut au parrain, quand le filleul finit sa saison, suffit. La moitié des filleuls viennent d'ailleurs : il faudra les loger.${
            ctx.iniquite
              ? " Mais depuis que les nouveaux sont mieux payés qu'eux, beaucoup répondent : « Qu'ils se débrouillent. » Il faut compter sur plus de deux fois moins de noms."
              : ""
          }`,
      },
      {
        id: "forum",
        titre: "Se renseigner sur le forum de Lyon et les lycées hôteliers",
        cout: 0.5,
        nature: "utile",
        resultat: `Le stand, les déplacements et les conventions avec les lycées coûtent ${euros(MONTANTS.forum)}. On en tire environ quatre candidatures sérieuses par semaine jusqu'en juin. Plus de huit sur dix viennent de loin, et beaucoup sont des étudiants qui comparent les offres : ils signent moins que les autres, et presque seulement s'ils sont logés.`,
      },
    ],
    question: "Comment élargissez-vous le vivier ?",
    options: [
      {
        t: "Lancer la cooptation : 300 € brut au salarié dont le filleul finit la saison, filleuls logés en priorité",
        d: `${euros(charge(MONTANTS.cooptation))} par filleul qui va au bout, charges comprises.`,
      },
      {
        t: "Tenir un stand au forum des saisonniers de Lyon et signer avec deux lycées hôteliers",
        d: `${euros(MONTANTS.forum)}. Premières candidatures en semaine 8.`,
      },
      {
        t: "Multiplier les annonces : trois sites d'emploi de plus et des publicités sur les réseaux sociaux",
        d: `${euros(MONTANTS.annoncesMultipliees)}. Davantage de candidatures dès la semaine 7.`,
      },
      {
        t: "S'en tenir aux annonces en cours",
        d: "Rien de plus à payer.",
      },
    ],
    reactions: [
      [
        {
          ...MARWA,
          texte:
            "Le message est parti à toutes les équipes, avec le règlement de la prime. Les premiers noms arrivent.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Stand réservé à Lyon. Les deux lycées nous enverront la liste de leurs élèves intéressés en avril.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Les nouvelles annonces sont en ligne. Beaucoup de candidatures, beaucoup de profils sans expérience, et toujours la même question : « Vous logez ? »",
        },
      ],
      [{ ...MARWA, texte: "On continue comme ça." }],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le pick-up de l'été",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...LUCILE,
        heure: "09:00",
        alerte: true,
        texte: PICKUP[Math.max(0, saison(ctx))]!.texte,
      },
      {
        ...ANNABELLE,
        heure: "11:20",
        texte:
          "Le plan de février m'attribue neuf saisonniers pour l'été. Je compte sur tous les neuf, évidemment.",
      },
      {
        ...MARWA,
        heure: "17:30",
        texte: `Point de la semaine : ${ctx.pourvus} contrats valables, il en manque ${ctx.manque} pour couvrir le plan et les remplacements.`,
      },
    ],
    sources: [
      {
        id: "pickup",
        titre: "Demander à Lucile Fabbri ce que le pick-up dit de chaque hôtel",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) => {
          const s = SCENARIOS[Math.max(0, saison(ctx))]!;
          const plus =
            s.besoin > 0
              ? `Une saison comme celle-là demandera environ ${EN_LETTRES[s.besoin]} saisonniers de plus que le plan.`
              : s.besoin < 0
                ? `Une saison comme celle-là demandera environ ${EN_LETTRES[-s.besoin]} saisonniers de moins que le plan.`
                : "Une saison comme celle-là demandera ce que le plan prévoit.";
          return `Lucile Fabbri : « Les hôtels ne se remplissent pas pareil, et un poste vide coûte d'autant moins que l'hôtel ou le service est calme. Si l'on envoie les recrues d'abord là où les réservations sont les plus fortes, les postes qu'on ne pourvoira pas iront là où ils coûtent le moins : sur la dizaine de postes qui risquent de rester vides, environ ${taux(s.ecart, 0)} de moins. Servir d'abord les restaurants, sans regarder les réservations, ne gagnerait que ${taux(REAFFECTATION.restaurants, 0)}. Attendre fin mai, quand la moitié des recrues seront déjà affectées, n'en gagnerait que les deux cinquièmes. ${plus} »`;
        },
      },
      {
        id: "repartition",
        titre: "Relire la répartition du plan de février",
        cout: 0.5,
        nature: "utile",
        resultat: `Le plan de février répartit les ${BESOIN} postes au prorata de l'été dernier : 22 au Lac, 14 à Évian, 9 à Megève, 8 à Annecy (l'hôtel et la Table d'Augustin), 11 entre Aix-les-Bains, Chambéry, Annemasse et Albertville. Chaque directeur connaît sa part depuis janvier.`,
      },
    ],
    question: "Que faites-vous de la répartition des recrues ?",
    options: [
      {
        t: "Tenir la répartition du plan de février",
        d: "Chaque hôtel reçoit la part prévue ; les directeurs la connaissent depuis janvier.",
      },
      {
        t: "Réaffecter les recrues selon le pick-up de chaque hôtel, et l'expliquer aux directeurs",
        d: "Les recrues vont d'abord là où les réservations sont les plus fortes ; les postes vides, là où l'été s'annonce calme.",
      },
      {
        t: "Servir d'abord les restaurants, qui rapportent le plus par poste",
        d: "Les cuisiniers et les serveurs avant les étages et la réception, dans tous les hôtels.",
      },
      {
        t: "Attendre fin mai pour répartir, quand le pick-up sera plus sûr",
        d: "D'ici là, les recrues sont affectées comme prévu en février.",
      },
    ],
    reactions: [
      [
        {
          ...ANNABELLE,
          texte: "Merci, Mounir. Megève aura ses neuf saisonniers, s'ils viennent.",
        },
      ],
      [
        {
          ...ANNABELLE,
          texte:
            "Je comprends. Si Megève est calme cet été, je ferai avec moins, et le restaurant ouvrira cinq jours sur sept.",
        },
      ],
      [
        {
          ...PROSPER,
          texte: "Mes cuisiniers d'abord, très bien. Dragana va moins rire.",
        },
      ],
      [{ ...LUCILE, texte: "Je vous redonne le pick-up fin mai." }],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les postes qui resteront vides",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ISALINE,
        heure: "08:30",
        alerte: true,
        texte: `Fin avril approche : ${ctx.pourvus} contrats valables, pour ${ctx.cible} postes à pourvoir avec les remplacements. Il en manque ${ctx.manque}, et mai ne fera pas de miracle. Que fais-tu pour les postes qui resteront vides ?`,
      },
      {
        ...ROMY,
        heure: "10:05",
        texte:
          "Les derniers candidats demandent 200 € de plus par mois. Donne-moi le feu vert et je boucle ma brigade cette semaine.",
      },
      {
        ...ALPEA,
        heure: "14:00",
        texte: `Nous prenons les réservations pour l'été : coefficient ${nombre(INTERIM.coefficient, 1)}, ${euros(INTERIM.frais)} de frais par poste réservé. En juillet-août, nous ne garantissons qu'une partie des missions.`,
      },
    ],
    sources: [
      {
        id: "metiers",
        titre: "Demander au contrôle de gestion ce que coûte un poste vide, métier par métier",
        cout: 0.5,
        nature: "decisive",
        resultat: `Une semaine de poste vide l'été, salaire non versé déduit : un cuisinier ${euros(coutDeVacance(METIERS[0].perte, METIERS[0].salaire))} (deux déjeuners fermés), un serveur ${euros(coutDeVacance(METIERS[1].perte, METIERS[1].salaire))} (un rang de terrasse fermé le soir, 50 couverts à 30 € de marge), un réceptionniste ${euros(coutDeVacance(METIERS[2].perte, METIERS[2].salaire))} (heures supplémentaires majorées, un veilleur de nuit en intérim), une femme ou un valet de chambre ${euros(coutDeVacance(METIERS[3].perte, METIERS[3].salaire))} (vingt chambres par semaine fermées à la vente, à 120 € de marge). En moyenne ${euros(coutDeVacance(PERTE_MOYENNE, SALAIRE_MOYEN))} par semaine, ${kE(VALEUR_POSTE)} par poste sur la saison. Quand on sait d'avance qu'un poste restera vide, on perd environ ${taux(1 - ORGANISE.prevu, 0)} de moins : on ferme les services les moins rentables plutôt que de les assurer à moitié, on ferme des chambres à la vente au lieu de surréserver puis de déloger, on fait tourner des polyvalents entre hôtels voisins.`,
      },
      {
        id: "interim",
        titre: "Appeler Alpéa Intérim",
        cout: 0.5,
        nature: "utile",
        resultat: `L'agence facture au coefficient ${nombre(INTERIM.coefficient, 1)} sur le salaire chargé : un intérimaire coûte environ ${euros(SURCOUT_INTERIM)} de plus par semaine que le saisonnier qu'il remplace. En juillet-août, elle ne garantit qu'environ ${taux(INTERIM.couverture, 0)} des missions, et facture ${euros(INTERIM.frais)} de frais par poste réservé, pourvu ou non.`,
      },
    ],
    question: "Que faites-vous pour les postes qui resteront vides ?",
    options: [
      {
        t: "Relever de 200 € brut par mois le salaire des dernières recrues pour boucler les équipes",
        d: `${euros(charge(MONTANTS.surenchere) * 3)} par recrue sur la saison, charges comprises. Davantage de candidats disent oui.`,
      },
      {
        t: "Réserver dès maintenant de l'intérim pour l'été sur tous les postes encore ouverts",
        d: `${euros(INTERIM.frais)} de frais par poste réservé, puis le coefficient de l'agence sur chaque semaine couverte.`,
      },
      {
        t: "Organiser l'été avec l'effectif qu'on aura : fermetures programmées, ventes ajustées, polyvalents entre hôtels voisins",
        d: `${euros(MONTANTS.organiser)} de primes de déplacement et de préparation. Les directeurs ferment d'avance ce qu'ils ne pourront pas servir.`,
      },
      {
        t: "Continuer à recruter, et aviser en juin",
        d: "Rien de plus à payer d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...EULOGE,
          texte:
            "Les saisonniers signés en mars ont appris que les derniers arrivés gagneront 200 € de plus par mois. Ils me demandent s'ils peuvent renégocier, ou s'ils doivent chercher ailleurs.",
        },
      ],
      [
        {
          ...ALPEA,
          texte:
            "Réservation enregistrée pour l'été. Nous ferons au mieux, mais en août, toute la Haute-Savoie nous demande des cuisiniers.",
        },
      ],
      [
        {
          ...ROMY,
          texte:
            "On ferme le déjeuner du lundi et du mardi en juillet, et j'ai retiré de la vente les chambres qu'on ne pourra pas faire. Au moins, on ne délogera personne.",
        },
      ],
      [{ ...ISALINE, texte: "D'accord. Mais en juin, il sera tard." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Faire venir et faire rester", chemin: [1, 1, 0, 0, 1, 2] },
  { nom: "Le salaire des nouveaux et les annonces", chemin: [0, 0, 3, 2, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 0, 3] },
] as const;

/**
 * Les réflexes du recrutement en tension : [décision, option]. Payer davantage
 * les seuls nouveaux (salaire d'embauche, prime d'embauche, surenchère de fin
 * de campagne), multiplier les annonces, et tenir la répartition de février
 * quand le pick-up dit autre chose.
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [3, 2],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  bailCourt: `La SCI du Laudon accepte un bail de cinq mois, de mai à septembre : ${euros(LOGEMENT.loyer)} par mois. Les clés le 2 mai.`,
  bailLong: `La SCI du Laudon ne loue pas pour cinq mois : elle exige un bail de ${LOGEMENT.moisLong} mois, d'avril à octobre, soit ${k1(LOGEMENT.loyer * (LOGEMENT.moisLong - LOGEMENT.mois))} de plus. Il n'y a pas d'autre immeuble à louer autour du lac.`,
  secondPart:
    "Mounir, je préfère vous le dire moi-même : j'ai accepté un poste de second dans un hôtel de Lausanne. Onze ans au Lac, et on paie mieux un chef de partie qui arrive que moi. Je pars fin mai.",
  continuTient:
    "Les deux équipes tiennent dans les cinq restaurants et aux étages. Les offres « sans coupure » font rappeler des candidats qui avaient raccroché.",
  continuMalTenu:
    "À Chambéry et à Aix-les-Bains, les chefs n'y croient pas : les équipes décalées se défont, on reviendra à la coupure en juillet là-bas. Ailleurs, ça tient.",
  testTient:
    "L'essai tient au Lac et à Annecy : on généralise, et les offres « sans coupure » partent la semaine prochaine.",
  testMalTenu:
    "L'essai ne tient pas : à Annecy, la brigade est revenue d'elle-même à la coupure. On en reste là pour cet été.",
} as const;
