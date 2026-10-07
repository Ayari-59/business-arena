/**
 * LA PRACTICE DONT LE MARCHÉ S'ÉTEINT — le contenu de l'épisode.
 *
 * Abel Quintin dirige la practice Énergie et bâtiment d'Atlas Conseil :
 * dix-huit consultants, des audits énergétiques réglementaires et de
 * l'assistance à maîtrise d'ouvrage. L'obligation d'audit prend fin au
 * 31 décembre pour presque tous les clients ; la décarbonation des sites
 * industriels monte, et personne dans l'équipe n'en a encore fait. Six
 * décisions, de septembre à novembre, chacune précédée de ce qu'un directeur
 * de practice reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : le plan de charge, les jours libres par mois, le
 * coût d'un trimestre d'intercontrat, les honoraires et les certifications.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  AMO_SEMAINE,
  APPRENTISSAGE,
  ARRIVEE_EXPERTS,
  ARRIVEE_TARDIVE,
  AUDITS,
  COMMANDE_TARDIVE,
  CONSULTANTS,
  COUTS,
  COUT_JOUR,
  COUT_JOUR_EXPERT,
  FREELANCE,
  JOURS_STAFFABLES,
  JOURS_SUIVANT,
  MOIS,
  PRET_INTERNE,
  SEMAINES_SUIVANT,
  TJM,
} from "@/engine/episodes/practice-a-reorienter";
import { euros, nombre } from "./format";
import type { Contexte, Etape } from "./types";

const OLYMPE = {
  de: "Olympe Lavallière",
  role: "Associée, membre du comité de direction",
} as const;
const GUSTAVE = { de: "Gustave Herbelin", role: "Directeur administratif et financier" } as const;
const MYLENE = { de: "Mylène Berthomieu", role: "Manageuse, pôle audits" } as const;
const AYOUB = { de: "Ayoub Ferrec", role: "Consultant" } as const;
const MAODEZ = { de: "Maodez Peyrade", role: "Auditeur senior" } as const;
const GWENOLA = { de: "Gwenola Toullec", role: "Consultante senior" } as const;
const ADELAIDE = {
  de: "Adélaïde Fourcroy",
  role: "Directrice industrielle, Conserveries de l'Aulne",
} as const;
const TEMPORA = { de: "Tempora", role: "Point hebdomadaire de la practice" } as const;

/** Les jours staffables de l'équipe par semaine, et ce que les audits et l'AMO en laissent libre, mois par mois. */
export const CAPACITE_SEMAINE = CONSULTANTS * JOURS_STAFFABLES;
export const LIBRES_PAR_SEMAINE = Object.fromEntries(
  MOIS.map((m) => [m.mois, CAPACITE_SEMAINE - AUDITS[m.mois] / (m.a - m.de + 1) - AMO_SEMAINE]),
) as Record<(typeof MOIS)[number]["mois"], number>;
/** Ce que coûte un consultant sans mission pendant tout le trimestre suivant. */
export const TRIMESTRE_D_INTERCONTRAT = JOURS_SUIVANT * COUT_JOUR;

export const DIAGNOSTICS = [
  {
    id: "reconversion",
    t: "Le carnet d'audits s'éteint à une date connue et personne n'est encore vendable en décarbonation : il faut reconvertir l'équipe par étapes, sur de vraies missions, avant que l'intercontrat n'arrive",
  },
  {
    id: "ventes",
    t: "Il manque des missions : la practice doit d'abord vendre de la décarbonation à ses clients d'audit",
  },
  {
    id: "formation",
    t: "L'équipe n'est pas formée : une certification en décarbonation pour tous réglera la question",
  },
  {
    id: "creux",
    t: "C'est un creux passager : le nouveau régime ramènera des audits, il faut tenir les coûts en attendant",
  },
] as const;

const binomesVoulus = (ctx: Contexte) => Number(ctx.binomesChoix ?? 3) !== 3;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le marché qui s'éteint",
    jusqua: 2,
    messages: () => [
      {
        ...OLYMPE,
        heure: "08:10",
        alerte: true,
        texte:
          "Abel, le comité de direction veut ton plan pour la practice vendredi prochain. L'obligation d'audit s'arrête au 31 décembre pour presque tous nos clients, et les audits faisaient 60 % de ton chiffre d'affaires l'an dernier. Nous sommes le 1er septembre : qu'est-ce qu'on fait de dix-huit consultants en janvier ?",
      },
      {
        ...MYLENE,
        heure: "09:00",
        texte:
          "Le plan de charge de septembre est plein. Et on a encore des clients en retard qui appellent pour caser leur audit avant l'échéance : si on les relance, on remplit octobre.",
      },
      {
        ...GUSTAVE,
        heure: "11:30",
        texte: `Pour mémoire : un jour de consultant sans mission coûte ${euros(COUT_JOUR)} au cabinet, charges comprises. Ta practice a fini l'an dernier à 75 % d'occupation, pile sur la cible.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "plan-de-charge",
        titre: "Extraire de Tempora le plan de charge jusqu'en février",
        cout: 1,
        nature: "decisive",
        resultat: `Audits signés, en jours à produire : septembre ${AUDITS.septembre}, octobre ${AUDITS.octobre}, novembre ${AUDITS.novembre}, décembre ${AUDITS.decembre}, janvier ${AUDITS.janvier}, février ${AUDITS.fevrier} : aucun client ne renouvelle après l'échéance. L'AMO tient ${AMO_SEMAINE} jours par semaine, toute l'année. L'équipe : ${CONSULTANTS} consultants à ${JOURS_STAFFABLES} jours staffables par semaine chacun (le cinquième va aux congés, à l'avant-vente et à la vie du cabinet). De décembre à février, ${SEMAINES_SUIVANT} semaines ouvrées une fois les congés de fin d'année déduits, soit ${JOURS_SUIVANT} jours staffables par consultant.`,
      },
      {
        id: "clients",
        titre: "Appeler trois clients industriels audités cette année",
        cout: 1,
        nature: "decisive",
        resultat:
          "Tous trois préparent un plan de décarbonation de leurs sites : récupération de chaleur, électrification des fours, contrats d'énergie. Ils connaissent vos auditeurs et les apprécient. Le responsable énergie des Fonderies du Blavet le dit net : « Qui chez vous en a déjà fait une ? Votre auditeur, je le prends volontiers, à côté de quelqu'un qui l'a déjà fait. Un certificat ne me suffit pas. » Halden Partners leur a déjà présenté trois références.",
      },
      {
        id: "entretiens",
        titre: "Relire les entretiens annuels de l'équipe",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Six consultants demandent à faire de la décarbonation, dont Ayoub Ferrec. Quatre ne veulent pas changer de métier : Maodez Peyrade, 61 ans, à la retraite dans dix-huit mois ; Gwenola Toullec, qui parle de monter son propre bureau d'études ; Esteban Calvez, ingénieur process, attiré par la practice Performance opérationnelle ; Baptistine Thépaut, « pas sûre d'y arriver ». Les huit autres attendent de voir.",
      },
      {
        id: "certification",
        titre: "Étudier l'offre de certification « référent décarbonation »",
        cout: 0.5,
        nature: "bruit",
        resultat: `Un organisme propose une certification de cinq jours, ${euros(COUTS.certification)} par personne, 92 % de réussite à l'examen et un logo à mettre sur les propositions. Il cite des cabinets certifiés ; il ne dit pas combien de leurs certifiés ont mené une mission.`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Olympe Lavallière",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Olympe : « Ne lâche pas les audits tant qu'ils paient, mais n'attends pas qu'ils soient finis pour préparer la suite. Fais le compte de ce que l'équipe aura à faire en janvier. Et souviens-toi qu'un client n'achète pas un diplôme : il achète quelqu'un qui l'a déjà fait. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au comité de direction vendredi ?",
    options: [
      {
        t: "Remplir l'automne avec les derniers audits, et préparer la décarbonation l'an prochain",
        d: `L'avant-vente relance les retardataires : cinq jours d'audit de plus par semaine dès la semaine 4, à ${euros(TJM.auditTardif)} remisés. Rien à engager.`,
      },
      {
        t: "Reconvertir par étapes : les auditeurs finissent le carnet, un premier noyau lance la décarbonation chez nos clients d'audit",
        d: "L'avant-vente se tourne vers les industriels audités dès la semaine 2. Les audits signés restent la priorité tant qu'il y en a.",
      },
      {
        t: "Annoncer la bascule de toute la practice vers la décarbonation dès octobre",
        d: "Cinq consultants retirés des audits pour se former et prospecter, de la semaine 3 à la semaine 8. Un signal fort, pour l'équipe comme pour le marché.",
      },
      {
        t: "Attendre le plan stratégique du cabinet, attendu en janvier",
        d: "Rien ne change d'ici là : l'équipe produit les audits signés.",
      },
    ],
    reactions: [
      [
        {
          ...MYLENE,
          texte:
            "Trois retardataires rappelés ce matin, deux signent. Octobre sera plein. Pour la suite, on verra en janvier.",
        },
      ],
      [
        {
          ...AYOUB,
          texte:
            "Les Fonderies du Blavet veulent bien nous recevoir pour parler de leur plan de décarbonation. Mylène garde la main sur les audits.",
        },
      ],
      [
        {
          ...MAODEZ,
          texte:
            "On apprend la bascule par un mail du comité ? Et les audits de novembre, qui les fait ? Deux clients m'ont déjà demandé si on arrêtait.",
        },
      ],
      [
        {
          ...OLYMPE,
          texte:
            "Le comité attendra janvier, si tu le dis. Mais il te reposera la même question, avec trois mois de moins.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Des experts, ou pas",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...OLYMPE,
        heure: "10:40",
        alerte: true,
        texte:
          "Deux candidates sérieuses en décarbonation industrielle, repérées par cooptation : Évelyne Galliot et Gaïane Moysan. Elles ont d'autres pistes : je veux ta position lundi.",
      },
      {
        ...TEMPORA,
        heure: "18:00",
        texte: `Semaine 3 : taux d'occupation ${ctx.occupation}, ${ctx.carnet} jours de décarbonation signés, ${ctx.intercontrat} jours d'intercontrat depuis le 1er septembre.`,
      },
      Number(ctx.cap) === 1 || Number(ctx.cap) === 2
        ? {
            ...AYOUB,
            heure: "16:15",
            texte:
              "Les Fonderies du Blavet veulent une proposition. Leur première question : « Qui la pilotera, et qu'a-t-il déjà fait ? »",
          }
        : {
            ...AYOUB,
            heure: "16:15",
            texte:
              "Un industriel que j'ai audité au printemps m'a demandé si on faisait de la décarbonation. Je n'ai pas su quoi répondre.",
          },
    ],
    reevaluation: true,
    sources: [
      {
        id: "candidates",
        titre: "Recevoir les deux candidates",
        cout: 0.5,
        nature: "decisive",
        resultat: `Évelyne Galliot a piloté dix ans la décarbonation des usines d'un groupe agroalimentaire ; Gaïane Moysan a mené une vingtaine de feuilles de route chez un concurrent. Chacune coûterait ${euros(COUT_JOUR_EXPERT)} par jour ouvré, charges comprises ; le cabinet de recrutement prend ${euros(COUTS.recrutementExpert)} par recrutement. Préavis négocié : arrivée en semaine ${ARRIVEE_EXPERTS}, une fois sur quatre en semaine ${ARRIVEE_TARDIVE}. Chacune encadre deux consultants en binôme sur ses missions, et apporte ses références : « Les clients signent quand ils voient un nom qui l'a déjà fait. »`,
      },
      {
        id: "propositions",
        titre: "Relire les propositions de décarbonation perdues",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          Number(ctx.cap) === 1 || Number(ctx.cap) === 2
            ? "Deux propositions perdues contre Halden Partners, avec la même phrase du client : « pas de référence, pas d'expert identifié ». Sans expert ni référence, nous signons à peine une proposition sur cinq ; les industriels audités, eux, nous recevraient volontiers avec quelqu'un qui l'a déjà fait. Côté marché, tout dépend des aides régionales votées en décembre : porteur une fois sur trois environ, lent une fois sur quatre."
            : "Aucune proposition de décarbonation n'est partie : l'avant-vente est sur les audits. Halden Partners a signé deux des industriels que nous avons audités au printemps. Côté marché, tout dépend des aides régionales votées en décembre : porteur une fois sur trois environ, lent une fois sur quatre.",
      },
      {
        id: "freelancia",
        titre: "Demander à Freelancia ce qu'ils ont",
        cout: 0.5,
        nature: "utile",
        resultat: `Deux indépendants spécialistes de la décarbonation, en régie, à ${euros(FREELANCE.expert)} par jour facturé seulement, disponibles dès la semaine 5, ou la semaine 7 si les profils se libèrent tard. Chacun peut prendre un consultant à côté de lui ; ils repartent à la fin de leurs missions, et leurs références restent un peu les leurs.`,
      },
      {
        id: "salaires",
        titre: "Comparer les salaires des experts à Paris et à Nantes",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Un expert de la décarbonation se paie 12 % de plus à Paris qu'à Nantes, selon l'étude annuelle d'un cabinet de recrutement. Les deux candidates vivent à Nantes.",
      },
    ],
    question: "Que décidez-vous pour les experts ?",
    options: [
      {
        t: "Recruter les deux expertes",
        d: `${euros(2 * COUTS.recrutementExpert)} d'honoraires, ${euros(COUT_JOUR_EXPERT)} par jour chacune dès leur arrivée, prévue en semaine ${ARRIVEE_EXPERTS}. Deux binômes chacune.`,
      },
      {
        t: "Recruter une seule experte, la plus expérimentée",
        d: `${euros(COUTS.recrutementExpert)} d'honoraires, ${euros(COUT_JOUR_EXPERT)} par jour dès son arrivée. Deux binômes.`,
      },
      {
        t: "Prendre deux indépendants de Freelancia en régie",
        d: `${euros(FREELANCE.expert)} par jour, seulement les jours facturés, dès la semaine 5. Un binôme chacun.`,
      },
      {
        t: "Ne recruter personne : nos ingénieurs thermiciens sauront s'y mettre",
        d: "Aucun coût. L'équipe apprend la décarbonation sur ses premières missions.",
      },
    ],
    reactions: [
      null,
      null,
      null,
      [
        {
          ...AYOUB,
          texte:
            "On va apprendre sur le dos des Fonderies ? Ils nous ont demandé qui avait déjà fait ça. Je ne sais toujours pas quoi leur répondre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · lundi",
    titre: "Qui part en binôme ?",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...MYLENE,
        heure: "08:45",
        alerte: true,
        texte: `Octobre : ${nombre(AUDITS.octobre / 5, 0)} jours d'audit par semaine, puis ${nombre(AUDITS.novembre / 4, 0)} en novembre. Il faut décider qui on met sur la décarbonation, et quand. ${
          Number(ctx.experts) > 0 || Number(ctx.expertsChoix) <= 1
            ? "Les expertes demandent qui elles encadreront."
            : "Personne ne sait encore qui encadrera qui."
        }`,
      },
      {
        ...OLYMPE,
        heure: "12:30",
        texte: `Le comité a vu passer un devis de certification pour toute l'équipe : ${euros(CONSULTANTS * COUTS.certification)}. C'est toi qui l'as demandé ? Certains trouvent l'idée excellente.`,
      },
      {
        ...TEMPORA,
        heure: "18:00",
        texte: `Semaine 4 : taux d'occupation ${ctx.occupation}, ${ctx.carnet} jours de décarbonation signés.`,
      },
    ],
    sources: [
      {
        id: "apprentissage",
        titre: "Demander à Atlas Formation comment on devient vendable",
        cout: 0.5,
        nature: "decisive",
        resultat: `Un consultant formé en salle connaît les méthodes, mais il n'est pas vendable : les clients veulent une mission à son actif. En binôme sur une première mission réelle, il est facturé à moitié pendant qu'il apprend, et vendable seul ${APPRENTISSAGE.expert} semaines plus tard. Avec un indépendant qui repart, comptez ${APPRENTISSAGE.independant} semaines ; sans personne qui sache, ${APPRENTISSAGE.seul}. Un expert encadre deux binômes : au-delà, chacun produit moins, apprend moins vite, et la première mission risque de rater.`,
      },
      {
        id: "charge",
        titre: "Regarder dans Tempora ce que les audits laissent libre",
        cout: 0.5,
        nature: "utile",
        resultat: `Une fois les audits et l'AMO staffés, il reste ${nombre(LIBRES_PAR_SEMAINE.octobre, 0)} jours libres par semaine en octobre et ${nombre(LIBRES_PAR_SEMAINE.novembre, 0)} en novembre. Un consultant en binôme y passe ${JOURS_STAFFABLES} jours par semaine : quatre binômes tiennent à peu près dans ce que les audits libèrent ; huit vident les audits de novembre.`,
      },
      {
        id: "devis",
        titre: "Lire le devis de certification",
        cout: 0.5,
        nature: "bruit",
        resultat: `Cinq jours de formation en salle pour chacun des ${CONSULTANTS} consultants, en octobre, ${euros(COUTS.certification)} par personne, soit ${euros(CONSULTANTS * COUTS.certification)}. Examen en ligne, certificat valable trois ans.`,
      },
    ],
    question: "Comment formez-vous l'équipe ?",
    options: [
      {
        t: "Certifier toute l'équipe en salle en octobre",
        d: `Cinq jours chacun, ${euros(CONSULTANTS * COUTS.certification)}. Tout le monde au même niveau, d'un coup.`,
      },
      {
        t: "Quatre volontaires en binôme sur les premières missions, les autres finissent les audits",
        d: "Dès que quelqu'un peut les encadrer. Facturés à moitié pendant qu'ils apprennent.",
      },
      {
        t: "Huit consultants en binôme d'un coup, pour aller plus vite",
        d: "Le double de binômes, avec le même encadrement. Moins de monde sur les audits.",
      },
      {
        t: "Pas de binôme cette année : les auditeurs finissent les audits",
        d: "La décarbonation se fera avec ceux qui savent déjà. On formera en janvier.",
      },
    ],
    reactions: [
      [
        {
          ...MYLENE,
          texte:
            "Cinq jours de salle pour chacun en octobre : je décale une vingtaine de visites d'audit par semaine. Les clients ne sont pas ravis.",
        },
      ],
      [
        {
          ...AYOUB,
          texte:
            "Je fais partie des quatre. On commence avec les Fonderies dès qu'on a quelqu'un pour nous montrer. Les autres finissent leurs audits, ça rassure tout le monde.",
        },
      ],
      [
        {
          ...MYLENE,
          texte:
            "Huit en binôme, c'est huit de moins sur les audits. Novembre va être tendu, et je ne sais pas qui encadre qui.",
        },
      ],
      [
        {
          ...AYOUB,
          texte:
            "Six d'entre nous avaient demandé à faire de la décarbonation. On attendra janvier, alors.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · jeudi",
    titre: "Ceux qui ne veulent pas changer",
    jusqua: 8,
    messages: () => [
      {
        ...MAODEZ,
        heure: "09:20",
        alerte: true,
        texte:
          "Abel, j'ai 61 ans. Je ne vais pas apprendre un nouveau métier pour dix-huit mois. Qu'est-ce que vous prévoyez pour moi ?",
      },
      {
        ...GWENOLA,
        heure: "13:05",
        texte:
          "Je préfère te le dire : Kéroual Consulting m'a appelée. Et j'ai un projet de bureau d'études à moi depuis longtemps. Je ne sais pas encore ce que je vais faire.",
      },
      {
        ...MYLENE,
        heure: "17:40",
        texte:
          "Esteban et Baptistine m'ont posé la même question cette semaine : « Et nous, on devient quoi en janvier ? » L'équipe attend une réponse.",
      },
    ],
    sources: [
      {
        id: "situations",
        titre: "Recevoir les quatre, un par un",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Maodez accepterait de finir les audits, puis de reprendre deux marchés d'AMO jusqu'à sa retraite : il en connaît tous les clients publics. Gwenola partirait volontiers pour monter son bureau d'études si on l'aide à démarrer ; sinon, elle écoutera Kéroual, et un de ses clients la suivrait. La practice Performance opérationnelle cherche un ingénieur process au 1er décembre : Esteban est partant. Baptistine essaiera la décarbonation si elle est encadrée, pas jetée dans le bain.",
      },
      {
        id: "couts",
        titre: "Demander aux ressources humaines ce que coûte chaque issue",
        cout: 0.5,
        nature: "decisive",
        resultat: `Une rupture conventionnelle accompagnée (indemnité, bilan de compétences, aide au projet) : ${euros(COUTS.departAccompagne)}. Un départ subi : ${euros(COUTS.departSubi)} en moyenne, entre les dossiers à reprendre, le client qui suit et le remplacement. Un plan de départs collectif, négocié avec le CSE : ${euros(COUTS.planDeDepart)} par personne. Un consultant sans mission de décembre à février : ${JOURS_SUIVANT} jours d'intercontrat, soit ${euros(TRIMESTRE_D_INTERCONTRAT)}.`,
      },
      {
        id: "rumeur",
        titre: "Écouter ce qui se dit à la machine à café",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "« La direction veut se débarrasser des vieux auditeurs », « Halden recrute à tour de bras », « Il paraît qu'on ferme le bureau de Rennes ». Rien de vérifiable.",
      },
    ],
    question: "Que faites-vous des quatre ?",
    options: [
      {
        t: "La même règle pour tous : tout le monde passe à la décarbonation en janvier",
        d: "Annoncé en réunion d'équipe. Pas d'exception, pas de coût.",
      },
      {
        t: "Au cas par cas : Maodez finit les audits puis reprend l'AMO, Gwenola part accompagnée, Esteban rejoint la Performance opérationnelle, Baptistine en binôme",
        d: `${euros(COUTS.departAccompagne)} pour Gwenola. Départ et mobilité au 1er décembre : chacun finit ses audits d'abord.`,
      },
      {
        t: "Les laisser sur les audits, et en reparler en janvier",
        d: "Aucun coût d'ici là. Les audits seront faits.",
      },
      {
        t: "Proposer un plan de départs aux quatre",
        d: `${euros(COUTS.planDeDepart)} chacun, départs en semaine 10.`,
      },
    ],
    reactions: [
      [
        {
          ...MAODEZ,
          texte:
            "La même règle pour tous, à dix-huit mois de la retraite. J'ai bien entendu. Je vais réfléchir à ce que je fais.",
        },
      ],
      [
        {
          ...MAODEZ,
          texte:
            "Finir les audits et transmettre les marchés d'AMO, ça, je sais faire. Merci de m'avoir demandé ce que je voulais.",
        },
        {
          ...GWENOLA,
          texte:
            "Je finis mes audits de novembre, et je pars le 1er décembre. Si mon bureau d'études a besoin d'un partenaire en décarbonation, je saurai où appeler.",
        },
      ],
      [
        {
          ...GWENOLA,
          texte: "D'accord. On en reparle en janvier, alors.",
        },
      ],
      [
        {
          ...AYOUB,
          texte:
            "Un plan de départs pour quatre personnes, en pleine reconversion. Certains se demandent à qui le tour, ensuite.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · mardi",
    titre: "Une commande d'audits tardive",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...ADELAIDE,
        heure: "08:30",
        alerte: true,
        texte: `Nous avons pris du retard : il nous faut l'audit réglementaire de nos quatre sites avant le 31 décembre. ${COMMANDE_TARDIVE.jours} jours, en novembre. Vous pouvez ? Nous vous connaissons, nous préférerions vous.`,
      },
      {
        ...MYLENE,
        heure: "09:10",
        texte: `On peut, mais il faut des bras : ${ctx.retard} jours d'audit déjà en retard, ${ctx.binomes} consultants en binôme.`,
      },
    ],
    sources: [
      {
        id: "novembre",
        titre: "Regarder la charge de novembre dans Tempora",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.binomes} consultants en binôme, ${ctx.retard} jours d'audit en retard. Les ${COMMANDE_TARDIVE.jours} jours se font en novembre avec ceux qui restent sur l'audit, quitte à finir quelques jours en décembre, avant l'échéance. Rappeler les binômes sur les audits les libérerait, mais leur apprentissage s'arrêterait quatre semaines${
            binomesVoulus(ctx) ? "" : " ; il n'y en a pas"
          }.`,
      },
      {
        id: "conserveries",
        titre: "Se renseigner sur les projets des Conserveries",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les Conserveries consomment beaucoup de vapeur et de froid ; leur directrice industrielle prépare un plan de décarbonation pour son conseil d'administration de mars. Une feuille de route de ${COMMANDE_TARDIVE.decarbonation} jours proposée avec l'audit a ses chances : à peu près six fois sur dix si nous avons des experts et des références à montrer, trois sinon.`,
      },
      {
        id: "independants",
        titre: "Demander à Freelancia des auditeurs indépendants",
        cout: 0.5,
        nature: "utile",
        resultat: `Des auditeurs énergétiques indépendants sont disponibles en novembre, à ${euros(FREELANCE.auditeur)} par jour. Nous facturerions ${euros(TJM.auditTardif)} aux Conserveries. Ils font l'audit, rien de plus.`,
      },
    ],
    question: "Que répondez-vous aux Conserveries ?",
    options: [
      {
        t: "Accepter, et rappeler les consultants en binôme sur les audits pendant quatre semaines",
        d: `L'audit paie tout de suite, ${euros(TJM.auditTardif)} par jour. Les binômes reprendront en décembre.`,
      },
      {
        t: "Accepter, faire les audits avec les auditeurs, et proposer la feuille de route de décarbonation des quatre sites",
        d: `Les binômes continuent ; quelques audits finiront en décembre. Une proposition de ${COMMANDE_TARDIVE.decarbonation} jours en plus.`,
      },
      {
        t: "Accepter, et confier les audits à des auditeurs indépendants de Freelancia",
        d: `${euros(FREELANCE.auditeur)} payés, ${euros(TJM.auditTardif)} facturés. Personne de l'équipe n'est déplacé.`,
      },
      {
        t: "Décliner : la practice ne fait plus d'audits",
        d: "Le message est clair, pour l'équipe comme pour le marché.",
      },
    ],
    reactions: [
      [
        {
          ...ADELAIDE,
          texte: "Parfait. Vos auditeurs sont chez nous lundi.",
        },
      ],
      [
        {
          ...ADELAIDE,
          texte:
            "Parfait pour les audits. Envoyez-moi la proposition de feuille de route : je la présente à notre directeur général dans quinze jours.",
        },
      ],
      [
        {
          ...ADELAIDE,
          texte: "Des indépendants ? Du moment que les rapports portent votre nom, cela me va.",
        },
      ],
      [
        {
          ...ADELAIDE,
          texte:
            "Dommage. Kéroual Consulting le fera. Je pensais que nous avions une relation, vous et nous.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le plan de décembre à février",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...OLYMPE,
        heure: "09:00",
        alerte: true,
        texte:
          "Le comité de direction de fin novembre veut ton plan pour décembre à février : qui fait quoi, et ce que ça coûte. Halden Partners vient d'annoncer quinze recrutements en décarbonation ; certains, ici, voudraient qu'on réponde fort.",
      },
      {
        ...GUSTAVE,
        heure: "11:15",
        texte: `Avec ce qui est signé aujourd'hui, Tempora annonce ${ctx.interSuivant} jours d'intercontrat de décembre à février. Chaque jour, c'est ${euros(COUT_JOUR)}.`,
      },
    ],
    sources: [
      {
        id: "carnet",
        titre: "Faire le bilan du carnet de décarbonation",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.carnet} jours de décarbonation signés restant à produire, ${ctx.signes} signés la semaine dernière. ${Number(ctx.experts) === 0 ? "Aucune experte" : Number(ctx.experts) === 1 ? "Une experte" : "Deux expertes"} en poste et ${ctx.binomes} consultants en binôme${
            ctx.vendablesEn ? `, vendables seuls vers la semaine ${ctx.vendablesEn}` : ""
          }. Les aides régionales se précisent : ${ctx.marche}. Une deuxième vague de binômes ne sert que si le carnet a de quoi l'occuper : un binôme par cent jours signés, dans la limite de ce que les expertes peuvent encadrer.`,
      },
      {
        id: "performance",
        titre: "Appeler le directeur de la practice Performance opérationnelle",
        cout: 0.5,
        nature: "utile",
        resultat: `Il peut prendre trois consultants six semaines en décembre-janvier sur des missions d'efficacité énergétique en usine : ${PRET_INTERNE.jours} jours, refacturés ${euros(PRET_INTERNE.prix)} par jour en cession interne. À condition de le savoir avant le 1er décembre pour les staffer.`,
      },
      {
        id: "halden",
        titre: "Lire l'annonce de Halden Partners",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Halden Partners annonce « quinze consultants en décarbonation d'ici l'été » et un partenariat avec une école d'ingénieurs. L'annonce ne dit ni où, ni pour quels clients.",
      },
    ],
    question: "Que présentez-vous au comité ?",
    options: [
      {
        t: "Tout basculer en janvier : les dix-huit en décarbonation, formation en salle pour tous",
        d: `Dix jours de formation chacun, ${euros(COUTS.certification)} par personne. L'AMO passe au second plan.`,
      },
      {
        t: "Planifier personne par personne : une deuxième vague de binômes à hauteur du carnet, des prêts à la Performance opérationnelle pour les autres",
        d: `Un binôme par cent jours signés, dans la limite de l'encadrement ; ${PRET_INTERNE.jours} jours prêtés à ${euros(PRET_INTERNE.prix)}.`,
      },
      {
        t: "Attendre le plan stratégique du cabinet en janvier",
        d: "Rien de nouveau d'ici là. Le comité tranchera.",
      },
      {
        t: "Recruter trois experts de plus pour prendre le marché avant Halden Partners",
        d: `${euros(3 * COUTS.recrutementExpert)} d'honoraires, en poste à la mi-janvier.`,
      },
    ],
    reactions: [
      [
        {
          ...MAODEZ,
          texte:
            "Dix jours de salle à dix-huit mois de la retraite. Et les marchés d'AMO, on les laisse à qui ?",
        },
      ],
      [
        {
          ...OLYMPE,
          texte:
            "Un plan où chacun sait ce qu'il fait le 1er décembre, avec des chiffres. Le comité l'a validé en vingt minutes.",
        },
      ],
      [
        {
          ...GUSTAVE,
          texte:
            "J'inscris l'intercontrat de décembre à février au prévisionnel, en attendant le plan du cabinet.",
        },
      ],
      [
        {
          ...GUSTAVE,
          texte:
            "Trois recrutements validés. J'espère que le carnet suivra : trois experts sans mission, ça se voit vite dans les comptes.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur. */
export const REFERENCES = [
  { nom: "Reconvertir par étapes", chemin: [1, 0, 1, 1, 1, 1] },
  { nom: "Tout basculer d'un coup", chemin: [2, 0, 2, 0, 3, 0] },
  { nom: "Les audits d'abord, on verra l'an prochain", chemin: [0, 3, 3, 2, 0, 2] },
] as const;

/**
 * Les réflexes d'une practice dont le marché s'éteint : vendre les derniers
 * audits « et on verra l'an prochain » (relancer les retardataires, ne
 * recruter personne, ne former personne, laisser les réticents sur les
 * audits, rappeler les binômes, attendre le plan), ou tout réorganiser d'un
 * coup par décision de direction (bascule annoncée, certification pour tous,
 * même règle pour tous, plus d'audits du tout, tout le monde en salle en
 * janvier). [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 3],
  [2, 0],
  [2, 3],
  [3, 0],
  [3, 2],
  [4, 0],
  [4, 3],
  [5, 0],
  [5, 2],
] as const;

export const REPONSES = {
  deuxALHeure: `Évelyne Galliot et Gaïane Moysan ont signé toutes les deux : arrivée en semaine ${ARRIVEE_EXPERTS}.`,
  uneEnRetard: `Évelyne Galliot a signé, arrivée en semaine ${ARRIVEE_EXPERTS}. L'employeur d'Gaïane Moysan ne la libère qu'en semaine ${ARRIVEE_TARDIVE}.`,
  deuxEnRetard: `Les deux ont signé, mais leurs préavis ont été durs à négocier : arrivée en semaine ${ARRIVEE_TARDIVE}.`,
  uneALHeure: `Évelyne Galliot a signé : arrivée en semaine ${ARRIVEE_EXPERTS}. Gaïane Moysan part chez Halden Partners.`,
  uneTard: `Évelyne Galliot a signé, mais son employeur ne la libère qu'en semaine ${ARRIVEE_TARDIVE}. Gaïane Moysan part chez Halden Partners.`,
  independantsTot:
    "Freelancia confirme deux indépendants pour la semaine 5. Ils commencent par les Fonderies du Blavet.",
  independantsTard:
    "Les profils de Freelancia se libèrent plus tard que prévu : les deux indépendants commencent en semaine 7.",
  clientOui: `Le directeur général a validé : nous signons la feuille de route de décarbonation de nos quatre sites, ${COMMANDE_TARDIVE.decarbonation} jours. Vos références ont compté.`,
  clientNon:
    "Nous avons comparé avec Halden Partners : ils ont déjà fait trois conserveries. Nous ne donnons pas suite à la feuille de route, mais merci pour les audits.",
} as const;
