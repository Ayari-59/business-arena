/**
 * L'ASSISTANT D'IA QUI CHANGE LE MÉTIER — le contenu de l'épisode.
 *
 * Anouchka Brisebois est associée chargée de l'innovation d'Atlas Conseil.
 * Le cabinet a acheté les licences d'un assistant d'IA générative, hébergé
 * dans un environnement maîtrisé ; il n'est pas encore ouvert. Un consultant
 * sur cinq se sert déjà d'outils grand public en cachette, un sur trois
 * refuse d'y toucher, et le comité de direction est partagé entre ceux qui
 * veulent tout interdire jusqu'à la politique de juin et ceux qui veulent
 * tout ouvrir « pour ne pas prendre de retard ». Six décisions, d'avril à
 * juin, chacune précédée de ce qu'une associée reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : les jours facturables et la part de la régie, le
 * temps des missions tâche par tâche et ce que l'assistant y gagne, les
 * douze contrats à renouveler, le gain contractuel du cabinet, la valeur des
 * propositions du second semestre.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import {
  ACCEPTATION,
  AVANT_VENTE,
  BUDGET,
  CACHETTE_DEPART,
  CONCESSION,
  CONSULTANTS,
  COUTS,
  FRAUDE,
  GAIN_POSSIBLE,
  HONORAIRES_PREVUS,
  JOURS_DU_TRIMESTRE,
  JOURS_FACTURES,
  MAL_CADRE,
  OCCUPATION,
  ORVANNE,
  PART_REGIE,
  PIPELINE,
  RELECTURE,
  RENOUVELLEMENTS,
  RENOUVELLEMENTS_TOTAL,
  REPLACEMENT,
  TACHES,
  TJM,
  TRANSFORMATION,
  TYPES_ORVANNE,
} from "@/engine/episodes/assistant-ia";
import type { Contexte, Etape } from "./types";

/* Les nombres, à la française, sans dépendre du format des épisodes. */
const fr = (v: number, d = 0) => v.toLocaleString("fr-FR", { maximumFractionDigits: d });
const pc = (v: number, d = 0) => `${fr(v * 100, d)} %`;
const ke = (v: number) => `${fr(Math.round(v / 1000))} k€`;
const me = (v: number) => `${fr(v / 1_000_000, 1)} M€`;

const VICTOIRE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" } as const;
const SOAZIG = {
  de: "Soazig Marchadier",
  role: "Associée, practice Organisation et transformation",
} as const;
const RUBEN = {
  de: "Ruben Esnault",
  role: "Directeur de la practice Data et systèmes d'information",
} as const;
const TEODORA = {
  de: "Teodora Vasconcelos",
  role: "Manager, practice Performance opérationnelle et supply chain",
} as const;
const YOUENN = { de: "Youenn Mével", role: "Analyste" } as const;
const AGNIESZKA = {
  de: "Agnieszka Tréhin",
  role: "Juriste et déléguée à la protection des données",
} as const;
const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const AISSATOU = { de: "Aïssatou Ndour", role: "Responsable du staffing" } as const;
const DRAGAN = {
  de: "Dragan Marinescu",
  role: "Responsable de la sécurité des systèmes d'information",
} as const;
const GWILHERM = { de: "Gwilherm Le Nevez", role: "Directeur des achats, groupe Orvanne" } as const;
const HOCINE = { de: "Hocine Cassagne", role: "Directeur de mission, compte Orvanne" } as const;
const FULGENCE = {
  de: "Fulgence Hamon",
  role: "Consultant senior, référent de la practice Énergie et bâtiment",
} as const;
const CHIAMAKA = {
  de: "Chiamaka Darrigade",
  role: "Associée fondatrice",
} as const;

const [SYNTHESE, ANALYSE, REDACTION, CONSEIL] = TACHES;
export const DIAGNOSTICS = [
  {
    id: "modele",
    t: "Le gain de temps est réel, mais il change la façon de gagner de l'argent : en régie, il part chez le client, et l'usage sans règle expose le cabinet. Il faut revoir la manière de vendre et encadrer les usages",
  },
  {
    id: "usages",
    t: "Le danger, c'est l'usage sauvage : des données client dans des outils grand public, des livrables que personne ne relit",
  },
  {
    id: "retard",
    t: "Le cabinet prend du retard sur Halden Partners et Kéroual Consulting : il faut équiper tout le monde au plus vite",
  },
  {
    id: "fiabilite",
    t: "L'outil n'est pas assez fiable pour le conseil : mieux vaut attendre une politique validée avant que quiconque s'en serve",
  },
] as const;

/** L'assistant n'est-il pas ouvert à tous ? */
const ferme = (ctx: Contexte) => ctx.interdit === true;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "L'assistant est déjà là",
    jusqua: 2,
    messages: () => [
      {
        ...VICTOIRE,
        heure: "08:10",
        alerte: true,
        texte: `Anouchka, les licences de l'assistant sont actives depuis vendredi : ${CONSULTANTS} consultants, hébergement maîtrisé, rien ne sort du cabinet. Le comité est coupé en deux. Soazig veut tout interdire jusqu'à la politique qu'on validera en juin ; Ruben veut tout ouvrir lundi « pour ne pas prendre de retard ». Je veux ta décision avant vendredi. Pour mémoire, le trimestre d'avril à juin est budgété à ${ke(BUDGET)} de marge, sans l'assistant.`,
      },
      {
        ...SOAZIG,
        heure: "08:45",
        texte:
          "Je ne laisserai pas une machine écrire des recommandations à des directeurs d'hôpital. Tant que le comité n'a pas validé une politique, on interdit. C'est ce que font les cabinets sérieux.",
      },
      {
        ...RUBEN,
        heure: "09:20",
        texte:
          "Halden Partners équipe ses consultants depuis janvier. Chaque semaine d'attente, c'est du retard qu'on ne rattrapera pas. Ouvrons à tout le monde, les gens apprendront en s'en servant.",
      },
      {
        ...DRAGAN,
        heure: "10:30",
        texte:
          "Les journaux du réseau montrent plus de 1 400 connexions par semaine vers des assistants grand public depuis les postes du cabinet. Ce qu'on y colle, je ne le vois pas.",
      },
      {
        ...YOUENN,
        heure: "11:05",
        texte:
          "Entre nous : la moitié des analystes s'en servent déjà, sur leur téléphone. On a des synthèses à rendre, et personne ne nous a dit ce qu'on avait le droit de faire.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "tempora",
        titre: "Sortir de Tempora la facturation prévue du trimestre",
        cout: 0.5,
        nature: "decisive",
        resultat: `${fr(JOURS_FACTURES)} jours facturables prévus d'avril à juin : ${CONSULTANTS} consultants, ${JOURS_DU_TRIMESTRE} jours ouvrés (ponts de mai compris), ${pc(OCCUPATION)} d'occupation. Au TJM moyen de ${fr(TJM)} €, ${me(HONORAIRES_PREVUS)} d'honoraires. ${pc(PART_REGIE)} de ces jours sont vendus en régie, au temps passé : le client paie les jours déclarés. Les ${pc(1 - PART_REGIE)} restants sont au forfait : le prix est fixé, quel que soit le temps passé. Les salaires et la structure, eux, ne bougent pas d'une semaine à l'autre. Au deuxième trimestre, le carnet est plein : sur dix jours qui se libèrent, le staffing en replace ${fr(REPLACEMENT * 10)} sur d'autres missions.`,
      },
      {
        id: "mesure",
        titre: "Faire mesurer par Teodora ce que l'outil change dans son équipe",
        cout: 1,
        nature: "decisive",
        resultat: `Teodora a suivi pendant six semaines les quatre consultants de son équipe qui s'en servent déjà. Les ${SYNTHESE.nom} (${pc(SYNTHESE.part)} du temps des missions du cabinet) vont deux fois plus vite : ${pc(SYNTHESE.gain)} de temps en moins. Les ${ANALYSE.nom} (${pc(ANALYSE.part)} du temps) : ${pc(ANALYSE.gain)} de moins. Les ${REDACTION.nom} (${pc(REDACTION.part)}) : ${pc(REDACTION.gain)} de moins. Le ${CONSEIL.nom}, ${pc(CONSEIL.part)} du temps : ${pc(CONSEIL.gain)}, presque rien. Pour quelqu'un qui maîtriserait l'outil partout, ${pc(GAIN_POSSIBLE, 1)} de son temps. Et la relecture par un pair, qu'elle a imposée après deux synthèses fausses, reprend ${RELECTURE === 0.25 ? "un quart" : pc(RELECTURE)} du gain hors conseil.`,
      },
      {
        id: "questionnaire",
        titre: "Lancer un questionnaire anonyme auprès des consultants",
        cout: 1,
        nature: "utile",
        resultat: `${pc(CACHETTE_DEPART)} des consultants se servent pour leur travail d'un assistant grand public, sur un compte personnel ; plus de la moitié d'entre eux y ont déjà collé des comptes rendus d'entretiens clients. 31 % refusent d'y toucher (« je ne sais pas ce qu'il invente »), et les autres attendent qu'on leur dise ce qui est permis.`,
      },
      {
        id: "etude",
        titre: "Lire l'étude d'un cabinet d'analyse sur l'IA dans le conseil",
        cout: 1,
        nature: "bruit",
        resultat:
          "« 40 % de productivité d'ici trois ans », « les cabinets qui n'adoptent pas l'IA disparaîtront ». Aucune mesure, aucune distinction entre les tâches, ni entre la régie et le forfait.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Chiamaka Darrigade",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Chiamaka : « Avant de choisir entre interdire et ouvrir, regarde comment on facture ce qu'on va gagner. Un jour gagné en régie, c'est un jour qu'on ne facture plus. Et l'interdiction n'a jamais empêché personne de faire en cachette. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous pour lundi prochain ?",
    options: [
      {
        t: "Interdire tout usage de l'IA générative jusqu'à la politique que le comité validera en juin",
        d: "Une note de la présidente à tous. Aucun coût, aucun risque d'erreur avec l'outil du cabinet.",
      },
      {
        t: "Ouvrir l'assistant du cabinet à tous dès lundi, sans attendre de règles",
        d: "Les licences sont payées : chacun s'en sert comme il l'entend. Aucun coût.",
      },
      {
        t: "Ouvrir l'assistant à tous avec trois règles immédiates : aucune donnée client hors de l'outil du cabinet, données sensibles anonymisées, relecture par un pair de tout ce qui part chez un client",
        d: "Une charte d'une page, révisée au comité de juin. La relecture prend du temps.",
      },
      {
        t: "L'ouvrir à vingt volontaires, et décider pour les autres au comité de juin",
        d: "Avec les trois règles. Les autres attendent.",
      },
    ],
    reactions: [
      [
        {
          ...TEODORA,
          texte:
            "La note est passée. Officiellement, plus personne ne s'en sert. Youenn m'a dit qu'il finirait ses synthèses chez lui, sur son téléphone.",
        },
      ],
      [
        {
          ...RUBEN,
          texte:
            "Ça part dans tous les sens : en trois jours, la moitié du cabinet a essayé. Chacun s'en sert pour ce qu'il veut, y compris pour rédiger des recommandations.",
        },
      ],
      [
        {
          ...AGNIESZKA,
          texte:
            "La charte d'une page est partie à tous. Les questions arrivent : « est-ce que je peux y mettre un compte rendu d'entretien anonymisé ? » Oui. C'est exactement le but.",
        },
      ],
      [
        {
          ...TEODORA,
          texte:
            "Les vingt volontaires sont ravis. Les autres demandent pourquoi eux et pas nous, et continuent comme avant.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les jours de régie qui disparaissent",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...PRUNE,
        heure: "09:30",
        alerte: true,
        texte: ferme(ctx)
          ? "Rien ne bouge dans Tempora : l'assistant n'est pas ouvert. Mais les associés me demandent tous la même chose : le jour où il le sera, que devient la régie ?"
          : `Premier effet dans Tempora : sur les missions en régie où l'assistant est utilisé, les jours déclarés baissent. ${ctx.regiePerdue} de chiffre d'affaires de régie en moins depuis avril, et la courbe monte.`,
      },
      {
        ...RUBEN,
        heure: "11:15",
        texte:
          "Mes chefs de mission me demandent s'ils doivent vraiment déclarer moins de jours. Certains disent que le client achète un résultat, pas un temps, et qu'on devrait facturer les jours prévus.",
      },
      {
        ...AISSATOU,
        heure: "14:40",
        texte: `Douze contrats en régie arrivent à renouvellement au 1er juillet. Les associés commencent les rendez-vous dans quinze jours.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "renouvellements",
        titre: "Étudier les douze renouvellements avec Prune",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Les douze contrats pèsent ${me(RENOUVELLEMENTS_TOTAL)} par an, de ${ke(RENOUVELLEMENTS.at(-1)!)} à ${ke(RENOUVELLEMENTS[0])}. Reconduits en régie, ils rendront au client tout le temps gagné. Proposés en forfait par livrable au budget de l'an passé moins ${pc(CONCESSION)}, le client a un prix garanti et le cabinet garde ce qu'il gagne au-delà de ${pc(CONCESSION)}. ${
            ferme(ctx)
              ? "Aujourd'hui, personne ne mesure ce gain : l'outil n'est pas ouvert."
              : `Aujourd'hui, un consultant qui s'en sert gagne ${ctx.gain} de son temps.`
          } Les clients sondés en accepteraient environ deux sur trois (${pc(ACCEPTATION)}). Préparer chaque forfait prend une demi-journée d'associé et une demi-journée de manager (${fr(AVANT_VENTE)} €) ; le cadrage est l'enjeu. Prune estime à ${MAL_CADRE.chance === 0.25 ? "une chance sur quatre" : pc(MAL_CADRE.chance)} qu'au moins un forfait de la vague se révèle mal cadré ; la dernière fois, le dépassement a coûté ${ke(MAL_CADRE.cout)} au cabinet.`,
      },
      {
        id: "juriste",
        titre: "Demander à Agnieszka ce que disent les contrats en régie",
        cout: 0.5,
        nature: "utile",
        resultat: `Agnieszka : « Une régie se facture au temps passé, sur les relevés de Tempora que le client peut demander. Facturer des jours qui n'ont pas été passés, c'est facturer une prestation non réalisée : chez un acheteur public, c'est la résiliation, le remboursement et l'exclusion possible de l'accord-cadre. Sur nos contrats, l'enjeu dépasse ${ke(FRAUDE.cout - 30000)}. »`,
      },
    ],
    question: "Que faites-vous de la régie ?",
    options: [
      {
        t: "Ne rien changer : la régie reste la régie, on verra au renouvellement suivant",
        d: "Les contrats sont reconduits tels quels au 1er juillet. Aucun coût.",
      },
      {
        t: "Demander aux chefs de mission de déclarer les jours prévus au contrat : le client achète un résultat, pas un temps",
        d: "Le chiffre d'affaires de la régie ne baisse plus. Aucun coût.",
      },
      {
        t: "Proposer aux douze clients qui renouvellent un forfait par livrable, au budget de l'an passé moins 3 %",
        d: `Une demi-journée d'associé et de manager par contrat : ${ke(AVANT_VENTE * RENOUVELLEMENTS.length)}. Chaque forfait se cadre avec le client.`,
      },
    ],
    reactions: [
      [
        {
          ...PRUNE,
          texte:
            "Entendu. Je continuerai de vous montrer chaque semaine ce que la régie ne facture plus.",
        },
      ],
      [
        {
          ...HOCINE,
          texte:
            "La consigne est passée. Deux chefs de mission sont venus me voir, mal à l'aise : sur une régie, le client peut demander les relevés.",
        },
      ],
      [
        {
          ...AISSATOU,
          texte:
            "Les rendez-vous sont pris avec les douze clients en semaines 4 et 5. Les associés partent avec un modèle de forfait par livrable et une grille de cadrage.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Ceux qui n'y touchent pas",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...SOAZIG,
        heure: "10:00",
        alerte: true,
        texte: ferme(ctx)
          ? "L'interdiction tient, du moins officiellement. Dans ma practice, personne ne s'en plaint : on a autre chose à faire que d'apprendre un outil."
          : `Dans ma practice, personne n'y touche, et je ne vais pas l'imposer. ${ctx.adoption} des consultants du cabinet s'en servent, dit-on. Ce ne sont pas les miens.`,
      },
      {
        ...PRUNE,
        heure: "12:30",
        texte: `Point de la semaine 4 : ${ctx.adoption} des consultants utilisent l'assistant du cabinet, ${ctx.cachette} se servent encore d'outils grand public. ${ctx.gagnes} gagnés depuis avril.`,
      },
      {
        ...RUBEN,
        heure: "16:45",
        texte:
          "Fixons à chaque practice un objectif de 15 % de jours gagnés, et rendons l'outil obligatoire pour les comptes rendus. Sans objectif, rien ne bouge.",
      },
    ],
    sources: [
      {
        id: "adoption",
        titre: "Regarder comment ceux qui s'en servent ont appris",
        cout: 0.5,
        nature: "decisive",
        resultat: `Sept utilisateurs sur dix ont appris auprès d'un collègue, en le regardant faire sur un vrai dossier. Ceux qui ont eu ce binôme gagnent environ 40 % de temps de plus que ceux qui ont appris seuls. Le module en ligne d'une heure de l'éditeur (${ke(COUTS.elearning)}) a été suivi par quarante consultants : aucune différence d'usage ensuite. Le premier frein cité par ceux qui n'y touchent pas : « je n'ai vu aucun exemple dans mon métier ». Huit référents, un par grande équipe, à une demi-journée par semaine, coûteraient ${fr(COUTS.referents)} € de jours facturables par semaine.`,
      },
      {
        id: "halden",
        titre: "Lire la tribune de l'associé gérant de Halden Partners",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "« Chez nous, chaque consultant a un objectif de productivité augmentée. » Aucun chiffre sur les résultats, ni sur la manière dont Halden facture le temps gagné.",
      },
    ],
    question: "Comment faites-vous venir les autres ?",
    options: [
      {
        t: "Fixer à chaque practice un objectif de 15 % de jours gagnés, et rendre l'outil obligatoire pour les comptes rendus",
        d: "Un suivi mensuel par practice dans Tempora. Aucun coût.",
      },
      {
        t: "Faire suivre à tous le module en ligne de l'éditeur",
        d: `Une heure par consultant, sur du temps non facturable. ${ke(COUTS.elearning)}.`,
      },
      {
        t: "Nommer huit référents, ouvrir une bibliothèque de cas d'usage relus et tenir une heure de pratiques partagées par semaine",
        d: `Une demi-journée par semaine pour chaque référent : ${fr(COUTS.referents)} € par semaine jusqu'en juin.`,
      },
      {
        t: "Laisser l'adoption se faire d'elle-même",
        d: "Les curieux s'y mettront, les autres suivront. Aucun coût.",
      },
    ],
    reactions: [
      [
        {
          ...SOAZIG,
          texte:
            "Mes consultants vont s'en servir pour cocher la case. Ils colleront dedans n'importe quoi pour atteindre vos 15 %.",
        },
      ],
      [
        {
          ...YOUENN,
          texte: "J'ai fait le module. On y apprend à écrire une question. Rien sur nos missions.",
        },
      ],
      [
        {
          ...FULGENCE,
          texte:
            "Première heure de pratiques partagées : on a montré comment on fait une synthèse d'audit énergétique à partir des notes de visite. Trois collègues de Soazig sont venus « pour voir ».",
        },
      ],
      [
        {
          ...PRUNE,
          texte:
            "Rien de particulier cette semaine. Les mêmes s'en servent, les mêmes s'en méfient.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Ce que les relectures disent",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...TEODORA,
        heure: "09:10",
        alerte: true,
        texte: ferme(ctx)
          ? "Les synthèses faites en cachette arrivent dans les livrables sans que personne sache d'où elles viennent. Hier, un chiffre de benchmark sans source a failli partir chez un client."
          : "J'ai compilé six semaines de relectures, tâche par tâche. Les synthèses tiennent. Mais les analyses chiffrées et surtout les recommandations rédigées par l'assistant nous coûtent cher en reprises.",
      },
      {
        ...RUBEN,
        heure: "11:30",
        texte:
          "Les relectures prennent trop de temps. Si on veut vraiment gagner, il faut les alléger : un consultant senior sait se relire.",
      },
    ],
    sources: [
      {
        id: "relectures",
        titre: "Lire le relevé des relectures, tâche par tâche",
        cout: 0.5,
        nature: "decisive",
        resultat: `Synthèses d'entretiens : 3 corrections sur 100, mineures. Analyses chiffrées : 18 sur 100, des chiffres sans source ou des calculs faux que l'assistant présente avec assurance. Recommandations : 35 sur 100 réécrites entièrement, ce qui prend plus de temps que de les écrire soi-même ; sur le conseil, l'assistant coûte au lieu de rapporter. Sur les analyses, vérifier chaque chiffre à sa source rend un quart du gain, mais supprime presque toutes les erreurs.`,
      },
      {
        id: "temps",
        titre: "Demander à Prune le temps gagné par practice",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ferme(ctx)
            ? "Rien à mesurer : l'outil n'est pas ouvert, et ce qui se fait en cachette ne se voit pas dans Tempora."
            : `Un utilisateur gagne aujourd'hui ${ctx.gain} de son temps, loin des ${pc(GAIN_POSSIBLE, 1)} possibles. Les practices qui font beaucoup d'entretiens gagnent le plus ; Organisation et transformation, faite d'ateliers et de comités, presque rien.`,
      },
    ],
    question: "Que faites-vous des usages ?",
    options: [
      {
        t: "Garder le cap : l'assistant sur toutes les tâches, c'est là qu'est le gain",
        d: "Rien ne change. Les relectures continuent.",
      },
      {
        t: "Recentrer les usages : synthèses et premières versions, analyses chiffrées vérifiées à la source, jamais les recommandations",
        d: "Une mise à jour de la charte et de la bibliothèque. Les analyses iront un peu moins vite.",
      },
      {
        t: "Alléger la relecture : un senior se relit seul",
        d: "Moins de temps de relecture, donc plus de temps gagné.",
      },
      {
        t: "Suspendre l'assistant deux semaines le temps d'un audit qualité",
        d: `Le juriste et le responsable de la sécurité auditent les usages. ${ke(COUTS.audit)}.`,
      },
    ],
    reactions: [
      [
        {
          ...TEODORA,
          texte:
            "On continue. Mes seniors passent leurs vendredis à réécrire des recommandations qu'ils auraient mieux faites eux-mêmes.",
        },
      ],
      [
        {
          ...TEODORA,
          texte:
            "La bibliothèque a une nouvelle rubrique « ce qui ne marche pas ». Les recommandations redeviennent notre travail, et les synthèses partent plus vite que jamais.",
        },
      ],
      [
        {
          ...RUBEN,
          texte: "Enfin. Les seniors ont repris une demi-journée par semaine.",
        },
      ],
      [
        {
          ...YOUENN,
          texte:
            "Deux semaines sans l'outil, avec les mêmes délais de rendu. Devinez ce que la moitié de l'équipe a fait.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Orvanne veut sa part",
    jusqua: 10,
    messages: () => [
      {
        ...GWILHERM,
        heure: "08:50",
        alerte: true,
        texte: `Madame Brisebois, votre contrat se renouvelle au 1er juillet. Vos consultants vont plus vite avec l'IA, tout le monde le sait : je demande ${pc(ORVANNE.baisse)} de baisse sur le TJM. Kéroual Consulting me propose −15 %. J'attends votre réponse sous quinze jours.`,
      },
      {
        ...HOCINE,
        heure: "10:20",
        texte: `Orvanne, c'est ${ke(ORVANNE.ca)} par an en régie, au TJM de ${fr(ORVANNE.tjm)} €, notre deuxième client privé. Je ne veux pas le perdre, mais je ne sais pas ce que l'assistant change vraiment sur cette mission.`,
      },
    ],
    sources: [
      {
        id: "mission",
        titre: "Demander à Hocine ce que sera la deuxième année d'Orvanne",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Hocine : « Ça dépend de ce que le comité d'Orvanne décidera en juin, et je dirais une chance sur deux. Soit un diagnostic terrain dans les trois usines, ${TYPES_ORVANNE[0].nom} : là, l'assistant fait environ ${fr(TYPES_ORVANNE[0].facteur, 1)} fois le gain moyen du cabinet. Soit un accompagnement des équipes, fait d'ateliers : environ ${fr(TYPES_ORVANNE[1].facteur, 1)} fois. ${
            ferme(ctx)
              ? "Et aujourd'hui, le cabinet ne gagne rien : l'outil n'est pas ouvert."
              : `Le gain qu'on peut promettre aujourd'hui sur une mission du cabinet, relecture comprise, est de ${ctx.gainContrat}.`
          } Une mesure sur nos six dernières semaines et le plan de l'an prochain, deux jours d'un manager (${fr(ORVANNE.mesure)} €), dirait lequel. »`,
      },
      {
        id: "historique",
        titre: "Relire l'historique du compte Orvanne",
        cout: 0.5,
        nature: "utile",
        resultat: `Gwilherm Le Nevez a changé deux fois de prestataire sur un prix, en logistique et en informatique ; une fois sur trois environ, il part quand on lui refuse tout. Il a toujours accepté un forfait quand le livrable était clair et le prix argumenté. En régie, il paie déjà moins de jours quand l'équipe va plus vite : il ne le sait pas.`,
      },
    ],
    question: "Que répondez-vous à Orvanne ?",
    options: [
      {
        t: `Accepter la baisse de ${pc(ORVANNE.baisse)} du TJM pour garder le client`,
        d: "La régie continue, au nouveau tarif. Le client reste.",
      },
      {
        t: "Refuser toute baisse : nos jours valent nos jours",
        d: "La régie continue au même tarif. Le client décidera.",
      },
      {
        t: "Mesurer d'abord le gain réel sur la mission, puis proposer un forfait par livrable qui partage ce gain à parts égales",
        d: `Deux jours d'un manager : ${fr(ORVANNE.mesure)} €. La réponse part en semaine 9.`,
      },
      {
        t: `Proposer tout de suite un forfait au budget moins ${pc(ORVANNE.baisse)} : le client a sa baisse, l'assistant fera le reste`,
        d: "Le prix est fixé pour un an. La réponse part lundi.",
      },
    ],
    reactions: [
      [
        {
          ...GWILHERM,
          texte:
            "Merci. Je savais que nous trouverions un terrain d'entente. Le bon de commande suivra.",
        },
      ],
      null,
      null,
      null,
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le comité de juin",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...VICTOIRE,
        heure: "09:00",
        alerte: true,
        texte: `Comité jeudi. On doit sortir avec une politique pour le second semestre. Où en est-on ? ${
          ferme(ctx)
            ? "L'outil est fermé depuis avril, et je reçois des questions de clients sur ce qu'on en fait."
            : `${ctx.adoption} d'utilisateurs, ${ctx.cachette} encore en cachette.`
        }`,
      },
      {
        ...AGNIESZKA,
        heure: "11:30",
        texte:
          "J'ai préparé avec nos avocats une politique complète : 38 pages, une liste fermée d'usages autorisés, toute nouvelle utilisation validée par le comité. Elle nous protège.",
      },
      {
        ...RUBEN,
        heure: "15:10",
        texte:
          "Au point où on en est, généralisons tout et supprimons la relecture obligatoire : c'est elle qui freine le gain.",
      },
    ],
    sources: [
      {
        id: "propositions",
        titre: "Regarder avec Aïssatou les propositions du second semestre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) => {
          const gain = typeof ctx.gainContratBrut === "number" ? ctx.gainContratBrut : 0;
          return `${me(PIPELINE)} de propositions prévues pour le second semestre partiraient en régie, par habitude. Le cabinet en gagne d'ordinaire ${pc(TRANSFORMATION)}. Faites par défaut en forfait par livrable, au budget moins ${pc(CONCESSION)}, et au gain qu'on peut promettre aujourd'hui (${pc(gain, 1)}), elles vaudraient ${ke(PIPELINE * TRANSFORMATION * (gain - CONCESSION))} sur leurs douze premiers mois : ${me(PIPELINE)} × ${pc(TRANSFORMATION)} × (${pc(gain, 1)} − ${pc(CONCESSION)}). Ce n'est vrai que si les équipes s'en servent bien : sous ${pc(CONCESSION)} de gain, le forfait perd de l'argent.`;
        },
      },
      {
        id: "bilan",
        titre: "Faire le bilan des usages avec Dragan et Agnieszka",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ferme(ctx)
            ? `L'outil du cabinet n'a servi à personne ; ${ctx.cachette} des consultants se servent d'outils grand public, sans règle et sans relecture. Les politiques fermées produisent toujours la même chose : on contourne.`
            : `${ctx.adoption} d'utilisateurs, ${ctx.cachette} en cachette, ${ctx.gagnes} gagnés depuis avril. Les règles qui ont tenu sont celles qu'on a pu expliquer en une page ; une politique de 38 pages se lit rarement, et chaque usage à faire valider renvoie vers les outils grand public.`,
      },
    ],
    question: "Que faites-vous valider au comité ?",
    options: [
      {
        t: "La politique complète du juridique : une liste fermée d'usages, toute nouvelle utilisation validée par le comité",
        d: `La relecture des avocats : ${ke(COUTS.avocats)}. Le cabinet est couvert.`,
      },
      {
        t: "La charte d'une page éprouvée au trimestre, la bibliothèque de cas d'usage, et le forfait par livrable par défaut dans les propositions",
        d: "Les équipes commerciales reprennent le modèle de forfait des renouvellements.",
      },
      {
        t: "Reporter la politique à l'automne : chaque practice fait comme elle l'entend d'ici là",
        d: "Le comité a d'autres sujets. Aucun coût.",
      },
      {
        t: "Généraliser l'assistant à tous et supprimer la relecture obligatoire",
        d: "Le temps de relecture redevient du temps gagné.",
      },
    ],
    reactions: [
      [
        {
          ...SOAZIG,
          texte:
            "Enfin un cadre sérieux. Il faudra une semaine pour faire valider le moindre usage, mais au moins on sait où on va.",
        },
      ],
      [
        {
          ...CHIAMAKA,
          texte:
            "Une page, des exemples, une façon de vendre : c'est la première politique de ce cabinet que les consultants ont lue jusqu'au bout.",
        },
      ],
      [
        {
          ...PRUNE,
          texte: "Le sujet est reporté à septembre. Les practices font chacune à leur manière.",
        },
      ],
      [
        {
          ...TEODORA,
          texte:
            "Plus de relecture obligatoire. Mes juniors envoient leurs premières versions directement aux clients. Je croise les doigts.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Encadrer, vendre autrement, apprendre entre pairs", chemin: [2, 2, 2, 1, 2, 1] },
  { nom: "Tout ouvrir pour ne pas prendre de retard", chemin: [1, 1, 0, 0, 0, 3] },
  { nom: "Interdire en attendant le comité", chemin: [0, 0, 3, 0, 1, 2] },
] as const;

/**
 * Les réflexes de l'associée sous pression, [décision, option] : interdire en attendant une
 * politique, ou ouvrir sans règle ; protéger la régie en facturant les jours prévus ; imposer un
 * objectif ; garder le cap malgré les relectures ou tout suspendre ; céder au client ou lui
 * répondre sans mesurer ; une politique fermée, ou plus de relecture du tout.
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [1, 1],
  [2, 0],
  [3, 0],
  [3, 3],
  [4, 0],
  [4, 3],
  [5, 0],
  [5, 3],
] as const;

export const REPONSES = {
  refusReste:
    "Je prends acte. Nous restons en régie au même tarif pour cette année ; je verrai à l'usage.",
  refusPart:
    "Dans ce cas, je lance une consultation. Kéroual Consulting reprendra la mission au 1er juillet.",
  mesureAccepte:
    "Un forfait par livrable, un prix argumenté par une mesure : c'est la première fois qu'un cabinet me montre ce qu'il gagne. J'accepte.",
  mesureRefuse:
    "Votre mesure est honnête, mais la baisse est trop faible pour mon comité. Nous restons en régie, au même tarif.",
  directAccepte: "Un forfait à moins 12 % : c'est exactement ce que je voulais. J'accepte.",
  directRefuse:
    "Un forfait sur un périmètre que mon comité n'a pas encore arrêté ? Non. Restons en régie.",
  directPart:
    "Un forfait sur un périmètre que mon comité n'a pas encore arrêté ? Non. Je lance une consultation : Kéroual Consulting reprendra la mission au 1er juillet.",
} as const;
