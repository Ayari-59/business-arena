/**
 * EMBAUCHER OU LOUER DES FREELANCES — le contenu de l'épisode.
 *
 * Ruben Esnault dirige la practice Data et systèmes d'information d'Atlas
 * Conseil : trente consultants en CDI, trente-huit ETP de missions à staffer,
 * et une présidente qui veut son plan d'effectif avant le comité de mars.
 * Six décisions, de janvier à mars, chacune précédée de ce qu'un directeur de
 * practice reçoit vraiment.
 *
 * Tous les chiffres que donnent les messages et les sources sont tirés des
 * constantes du modèle : le joueur peut refaire chaque calcul (coût de revient
 * d'une journée, seuil d'intercontrat, part durable de la demande), et le test
 * de l'épisode vérifie qu'ils tombent juste.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, clients, personnes et chiffres sont fictifs.
 */
import {
  ACCORD,
  CDI,
  CONTRATS,
  CONVERSION,
  COOPTATION,
  COUT_CDI_AN,
  COUT_REVIENT_JOUR,
  DEMANDE,
  DEPART,
  DURABLE,
  EQUIPE,
  EXTENSION,
  FREELANCE,
  INDEMNITE_ACCORD,
  JOURS_MISSION,
  JOURS_OUVRES,
  KEROUAL,
  OCCUPATION_CIBLE,
  OUVERTS_KERVALIS,
  PASSATION,
  RECRUTEMENT,
  REVENU_ETP,
  SCENARIOS,
  SONDAGE,
  SOUS_TRAITANCE,
  TJM,
  TJM_ACHAT,
  VAGUE,
  COUT_CDI_SEMAINE,
} from "@/engine/episodes/freelances-ou-embauches";
import type { Etape } from "./types";
import { euros, nombre, taux } from "./format";

const VICTOIRE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" } as const;
const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const MAIMOUNA = { de: "Maïmouna Riou", role: "Manager, practice Data" } as const;
const AMANDIN = { de: "Amandin Paquereau", role: "Responsable du recrutement" } as const;
const MARTHE = { de: "Marthe Kerjégu", role: "Directrice des données, Banque Kervalis" } as const;
const GALAAD = { de: "Galaad Tavernier", role: "Responsable grands comptes, Freelancia" } as const;
const DOMNIN = { de: "Domnin Ploquin", role: "Directeur commercial, Datamaris" } as const;
const AURELIO = {
  de: "Aurélio Henaff",
  role: "Consultant data senior, Kéroual Consulting",
} as const;
const YAEL = { de: "Yaël Dosseh", role: "Freelance data, en mission chez Atlas" } as const;
const ZELIA = {
  de: "Zélia Brizard",
  role: "Freelance data, en mission chez Atlas",
} as const;

/** La marge par semaine d'un ETP en mission : un CDI, un freelance, et ce qui les sépare (1 095 €). */
export const MARGE_CDI = REVENU_ETP - COUT_CDI_SEMAINE;
export const MARGE_FREELANCE = JOURS_MISSION * (TJM - TJM_ACHAT);
export const ECART_CDI_FREELANCE = MARGE_CDI - MARGE_FREELANCE;
/** Ce qu'un consultant de Kéroual coûterait par an, chargé (93 350 €). */
export const COUT_KEROUAL_AN = KEROUAL.brut * (1 + CDI.charges) + CDI.frais;
/** L'économie de l'accord-cadre si six freelances restent jusqu'à fin septembre (environ 11 000 €). */
export const ECONOMIE_ACCORD =
  6 * JOURS_MISSION * (TJM_ACHAT - ACCORD.tjm) * (ACCORD.jusqua - ACCORD.debut + 1);

/** Un petit nombre de personnes, en toutes lettres en début de phrase. */
const EN_LETTRES = ["Aucun", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit"];
const enLettres = (n: number) => EN_LETTRES[n] ?? String(n);

/** Une probabilité de scénario, en pourcentage rond : « 45 % ». */
const pct = (v: number) => taux(v, 0);

export const DIAGNOSTICS = [
  {
    id: "durable",
    t: "La demande mêle une part durable, portée par des contrats-cadres, et une vague réglementaire qui peut retomber : le noyau permanent se dimensionne sur la première, la seconde se couvre en flexibilité",
  },
  {
    id: "delai",
    t: "Un recrutement prend deux à trois mois : sans freelances tout de suite, les missions partiront chez les concurrents",
  },
  {
    id: "effectif",
    t: "La practice est sous-dimensionnée de huit consultants : il faut les recruter avant que Halden Partners ne prenne le marché",
  },
  {
    id: "tjm",
    t: "Les freelances coûtent trop cher : la marge de la practice ne tient qu'avec des consultants salariés",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Huit consultants de moins que la demande",
    jusqua: 2,
    messages: () => [
      {
        ...VICTOIRE,
        heure: "08:05",
        alerte: true,
        texte: `Ruben, bonne année. La practice a ${DEMANDE} consultants équivalents temps plein de missions à staffer pour ${EQUIPE} en poste : les demandes ont doublé depuis l'été. Je veux ton plan d'effectif avant le comité de mars, et d'ici là, pas une mission chez Halden Partners faute de monde.`,
      },
      {
        ...MARTHE,
        heure: "09:20",
        texte: `Monsieur Esnault, nos ${OUVERTS_KERVALIS} postes supplémentaires sur la plateforme de données sont ouverts depuis le 2 janvier. Je compte sur Atlas d'ici trois semaines.`,
      },
      {
        ...AMANDIN,
        heure: "11:00",
        texte:
          "Le cabinet de recrutement peut ouvrir huit postes dès cette semaine. Compte deux à trois mois avant qu'un consultant soit chez le client : les bons profils data sont en préavis.",
      },
      {
        ...GALAAD,
        heure: "14:30",
        texte: `Monsieur Esnault, nous avons une vingtaine de profils data disponibles sous dix jours, à ${euros(FREELANCE.tjm)} de TJM. Notre commission reste de ${taux(FREELANCE.commission, 0)}, et un freelance s'arrête sous cinq jours ouvrés.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "carnet",
        titre: "Reprendre le carnet de missions, ligne à ligne, avec Maïmouna",
        cout: 1,
        nature: "decisive",
        resultat: `En ETP à staffer cette semaine : Banque Kervalis, ${CONTRATS.kervalis + VAGUE.kervalis} ETP, dont ${CONTRATS.kervalis} sur la plateforme de données (contrat-cadre jusqu'en 2028, ${OUVERTS_KERVALIS} postes encore ouverts) et ${VAGUE.kervalis} sur un bon de commande de mise en conformité qui s'arrête au 30 juin ; GHT Estuaire-Vendée, entrepôt de données de santé, ${CONTRATS.ght} ETP (marché public notifié jusqu'en 2027) ; Pellerau Industries, tierce maintenance applicative de la BI, ${CONTRATS.pellerau} ETP (contrat annuel, renouvelé depuis six ans) ; Mutuelle du Lay, gouvernance des données, ${CONTRATS.mutuelle} ETP (contrat-cadre de deux ans) ; six clients récurrents, ${CONTRATS.recurrents} ETP ; missions de mise en conformité chez quatre ETI, ${VAGUE.eti} ETP, des forfaits de huit à seize semaines. Total : ${DEMANDE} ETP. Toutes les missions de mise en conformité tiennent à l'échéance réglementaire du 30 juin.`,
      },
      {
        id: "veille",
        titre: "Lire la note de veille réglementaire du cabinet d'avocats",
        cout: 1,
        nature: "decisive",
        resultat: `Maître Ruth Vauchelet : « Bruxelles vote le 26 mars le paquet de simplification. Trois issues pour l'échéance du 30 juin : un report de deux ans pour les ETI, le plus probable (environ ${pct(SCENARIOS.reportee.chance)}), et les missions de mise en conformité s'arrêteraient dès avril ; un maintien (environ ${pct(SCENARIOS.maintenue.chance)}), et elles iraient jusqu'au 30 juin, puis s'éteindraient ; un élargissement aux ETI de plus de 250 salariés (environ ${pct(SCENARIOS.elargie.chance)}), et la demande tiendrait toute l'année. Personne ne peut vous dire aujourd'hui laquelle. »`,
      },
      {
        id: "couts",
        titre: "Comparer un CDI et un freelance avec Prune, au contrôle de gestion",
        cout: 0.5,
        nature: "decisive",
        resultat: `Un consultant data en CDI : ${euros(CDI.brut)} de brut annuel moyen, ${taux(CDI.charges, 0)} de charges patronales, ${euros(CDI.frais)} de formation et de poste de travail, soit ${euros(COUT_CDI_AN)} par an, qu'il soit en mission ou en intercontrat. À l'occupation cible de ${taux(OCCUPATION_CIBLE, 0)}, ${nombre(JOURS_OUVRES * OCCUPATION_CIBLE)} jours facturés sur ${JOURS_OUVRES} jours ouvrés, sa journée facturée revient à ${euros(COUT_REVIENT_JOUR)}. Un freelance de Freelancia : ${euros(FREELANCE.tjm)} de TJM et ${taux(FREELANCE.commission, 0)} de commission, ${euros(TJM_ACHAT)} par jour facturé, rien entre deux missions. Notre TJM de vente moyen en data : ${euros(TJM)}. Recruter par le cabinet : ${taux(RECRUTEMENT.honoraires / CDI.brut, 0)} du brut annuel, ${euros(RECRUTEMENT.honoraires)}, et ${RECRUTEMENT.delaiMin} à ${RECRUTEMENT.delaiMax} semaines, préavis compris.`,
      },
      {
        id: "concurrents",
        titre: "Comparer la part de freelances chez les concurrents",
        cout: 1,
        nature: "bruit",
        resultat:
          "Halden Partners affiche 25 % de freelances dans sa practice data, Kéroual Consulting 8 %. Selon une étude de la fédération, la moyenne du secteur tourne autour de 15 %.",
      },
      {
        id: "conseil",
        titre: "Appeler Fantine Pennec, ancienne associée d'Atlas",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Fantine : « Avant de compter les gens, compte les contrats. Ce que tu es sûr de vendre dans un an, tu l'embauches ; le reste, tu le loues, même si ça te coûte de la marge. Et ne mets pas un freelance là où le client ne peut pas se passer de lui. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous à Victoire ?",
    options: [
      {
        t: "Lancer huit recrutements en CDI dès cette semaine",
        d: `${euros(RECRUTEMENT.honoraires)} d'honoraires par embauche ; les premières arrivées vers la semaine 9, plus tard pour les derniers postes. Des freelances en attendant.`,
      },
      {
        t: "Recruter trois CDI pour les postes durables, et couvrir le reste par des freelances",
        d: "Trois postes au cabinet ; Freelancia couvre l'écart en attendant les arrivées, puis la vague réglementaire, arrêtable sous cinq jours.",
      },
      {
        t: "Ne recruter personne : couvrir tout l'écart avec des freelances",
        d: `Huit freelances dès la semaine 3, à ${euros(TJM_ACHAT)} la journée ; aucun engagement.`,
      },
      {
        t: "Ne recruter personne, et ne prendre que ce que l'équipe peut tenir",
        d: "Aucun coût nouveau : les missions qu'on ne peut pas staffer sont déclinées ou repoussées.",
      },
    ],
    reactions: [
      [
        {
          ...AMANDIN,
          texte:
            "Huit postes ouverts chez le cabinet. Il m'a prévenu : au-delà de trois postes à la fois, ses délais s'allongent.",
        },
        { ...VICTOIRE, texte: "Enfin une practice qui se donne les moyens de sa croissance." },
      ],
      [
        {
          ...AMANDIN,
          texte:
            "Trois postes ouverts. Galaad Tavernier attend ta liste de profils pour les freelances.",
        },
      ],
      [
        {
          ...GALAAD,
          texte: "Huit profils vous seront présentés d'ici jeudi. Démarrage possible en semaine 3.",
        },
      ],
      [
        {
          ...MARTHE,
          texte:
            "Je note qu'Atlas ne peut pas tenir la plateforme pour l'instant. Si cela dure, je verrai avec d'autres cabinets.",
        },
        { ...VICTOIRE, texte: "Tu laisses des missions sur la table, Ruben." },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Qui va chez Kervalis ?",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...MAIMOUNA,
        heure: "09:10",
        alerte: true,
        texte: ctx.libre
          ? `Les freelances peuvent démarrer lundi, en semaine 3. Reste à savoir où on les met : les ${OUVERTS_KERVALIS} postes de Kervalis sont ouverts, et ce sont eux qui pressent le plus.`
          : `Sans freelances, il faut choisir qui attend. Les ${OUVERTS_KERVALIS} postes de Kervalis sont ouverts, et ce sont eux qui pressent le plus.`,
      },
      {
        ...MARTHE,
        heure: "11:40",
        texte:
          "Pour la plateforme, il me faut des gens qui connaissent notre architecture, pas des CV qui tournent.",
      },
      {
        ...DOMNIN,
        heure: "15:00",
        texte: `Monsieur Esnault, nous pouvons reprendre au forfait vos missions de mise en conformité du trimestre : ${euros(SOUS_TRAITANCE.tjm)} la journée, remplacements à notre charge, livrables garantis.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "kervalis",
        titre: "Demander à Maïmouna comment Kervalis traite les freelances",
        cout: 0.5,
        nature: "decisive",
        resultat: `Maïmouna : « Sur la plateforme passent les données de 400 000 clients : un nouvel arrivant met trois semaines à être autonome. L'an dernier, Halden Partners y avait placé deux freelances ; la banque en a recruté un en direct au bout de deux mois, et le poste est sorti du contrat. La clause de non-sollicitation de Freelancia se rachète, pour une banque c'est peu. Faire passer ${OUVERTS_KERVALIS} de nos consultants de Pellerau chez Kervalis, c'est deux jours de passation chacun : ${euros(PASSATION)} de facturation perdue. Chez Pellerau, la tierce maintenance est documentée : un freelance s'y met en une semaine. »`,
      },
      {
        id: "turnover",
        titre: "Demander à Galaad combien de freelances vont au bout de leur mission",
        cout: 0.5,
        nature: "utile",
        resultat: `Galaad : « Sur une mission de six mois, quatre freelances sur dix partent avant la fin, pour un meilleur TJM. Nous en présentons un autre sous dix jours, mais une reprise vous coûte en moyenne ${euros(DEPART.cout)} : le poste vide, et les jours repris au forfait. »`,
      },
    ],
    question: "Comment staffez-vous les postes ouverts ?",
    options: [
      {
        t: "Mettre les freelances là où ça presse : trois chez Kervalis, les autres sur la vague",
        d: "Démarrage en semaine 3, sans toucher aux équipes en place.",
      },
      {
        t: "Faire passer trois consultants d'Atlas chez Kervalis, et mettre les freelances sur des missions moins sensibles",
        d: `Deux jours de passation par consultant, ${euros(PASSATION)} de facturation perdue ; les freelances reprennent la TMA de Pellerau et la vague.`,
      },
      {
        t: "Les mêmes trois consultants chez Kervalis, et les missions de mise en conformité au forfait chez Datamaris",
        d: `${euros(SOUS_TRAITANCE.tjm)} la journée au lieu de ${euros(TJM_ACHAT)} jusqu'à fin mars ; Datamaris remplace à sa charge.`,
      },
      {
        t: "Faire patienter Kervalis jusqu'à l'arrivée de nos propres consultants",
        d: "Les postes de Kervalis attendent nos embauches ; le reste se staffe comme prévu.",
      },
    ],
    reactions: [
      [{ ...MARTHE, texte: "Trois nouveaux visages lundi. J'espère qu'ils resteront." }],
      [
        {
          ...MAIMOUNA,
          texte:
            "Je préviens Pellerau : passation mercredi et jeudi, les remplaçants arrivent lundi.",
        },
        {
          ...MARTHE,
          texte: "Merci. Des gens qui connaissent la maison, c'est ce que je demandais.",
        },
      ],
      [
        {
          ...DOMNIN,
          texte:
            "Nous démarrons vos missions de mise en conformité en semaine 3, au forfait jusqu'à la fin du trimestre.",
        },
      ],
      [
        {
          ...MARTHE,
          texte:
            "Combien de temps, exactement ? Ma direction ne me laissera pas attendre longtemps.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Freelancia propose un accord-cadre",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...GALAAD,
        heure: "10:00",
        alerte: true,
        texte: `Monsieur Esnault, vous êtes devenu un client important : je vous propose un accord-cadre. Votre TJM d'achat passe de ${euros(TJM_ACHAT)} à ${euros(ACCORD.tjm)}, contre l'engagement de garder six freelances jusqu'à fin septembre. Chaque freelance arrêté avant coûte ${ACCORD.preavis} semaines de mission.`,
      },
      {
        ...PRUNE,
        heure: "14:15",
        texte: `${euros(TJM_ACHAT - ACCORD.tjm)} par jour sur six freelances, ça se voit dans le compte de la practice. Mais regarde bien ce que tu signes.`,
      },
      {
        ...MAIMOUNA,
        heure: "16:30",
        texte: `Pour mémoire : ${ctx.freelances} freelances en mission cette semaine, ${ctx.recrutements} recrutements en cours au cabinet.`,
      },
    ],
    sources: [
      {
        id: "accord",
        titre: "Chiffrer l'accord avec Prune",
        cout: 0.5,
        nature: "decisive",
        resultat: `Prune : « Six freelances à ${euros(ACCORD.tjm)} au lieu de ${euros(TJM_ACHAT)}, c'est ${euros(TJM_ACHAT - ACCORD.tjm)} × ${nombre(JOURS_MISSION)} jours × 6, ${euros(6 * JOURS_MISSION * (TJM_ACHAT - ACCORD.tjm))} par semaine : environ ${euros(Math.round(ECONOMIE_ACCORD / 1000) * 1000)} d'ici fin septembre, si les six restent en mission tout ce temps. Arrêter un freelance engagé avant : ${ACCORD.preavis} semaines × ${nombre(JOURS_MISSION)} jours × ${euros(ACCORD.tjm)}, ${euros(INDEMNITE_ACCORD)}. Un seul arrêt efface l'économie. »`,
      },
      {
        id: "besoins",
        titre: "Reprendre les besoins en freelances d'ici septembre",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Les freelances tiennent aujourd'hui ce que nos consultants ne couvrent pas : ${ctx.freelances} postes. ${
            Number(ctx.recrutements) > 0
              ? `Les ${ctx.recrutements} recrutements en cours en reprendront autant à leur arrivée. `
              : "Aucun recrutement n'est en cours : les postes des contrats-cadres resteront en freelance. "
          }La vague de mise en conformité, ${VAGUE.kervalis + VAGUE.eti} ETP, dépend du vote du 26 mars : en cas de report, elle s'arrête en avril ; maintenue, fin juin.`,
      },
    ],
    question: "Que répondez-vous à Freelancia ?",
    options: [
      {
        t: "Signer l'accord-cadre sur six freelances",
        d: `${euros(ACCORD.tjm)} au lieu de ${euros(TJM_ACHAT)} la journée ; six freelances jusqu'à fin septembre, ou ${euros(INDEMNITE_ACCORD)} par freelance arrêté avant.`,
      },
      {
        t: "Rester au contrat standard",
        d: `${euros(TJM_ACHAT)} la journée, arrêt sous cinq jours ouvrés, sans indemnité.`,
      },
      {
        t: "Signer sur trois freelances seulement",
        d: `${euros(ACCORD.tjm)} pour trois freelances engagés jusqu'à fin septembre ; les autres au contrat standard.`,
      },
    ],
    reactions: [
      [
        {
          ...GALAAD,
          texte: "Accord signé. Vos six freelances vous sont réservés jusqu'au 30 septembre.",
        },
      ],
      [{ ...GALAAD, texte: "Comme vous voudrez. L'offre reste ouverte." }],
      [{ ...GALAAD, texte: "Va pour trois. Nous pourrons élargir l'accord plus tard." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Kervalis étend son contrat-cadre",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...MARTHE,
        heure: "08:45",
        alerte: true,
        texte: ctx.lotPerdu
          ? `Monsieur Esnault, faute de consultants, j'ai confié le lot de la plateforme à Halden Partners jusqu'à fin juin. Notre comité vient de valider l'extension, ${EXTENSION.etp} consultants de plus pour trois ans : elle partira chez eux aussi d'ici là.`
          : `Monsieur Esnault, notre comité a validé l'extension de la plateforme : ${EXTENSION.etp} consultants de plus à partir de la semaine ${EXTENSION.semaine}, pour trois ans. Le bon de commande est signé.`,
      },
      {
        ...GALAAD,
        heure: "10:30",
        texte: `Deux de nos freelances, Yaël Dosseh et Zélia Brizard, m'ont demandé si Atlas recrutait : ils en ont assez de chercher leur prochaine mission. Nos frais de conversion sont de ${taux(CONVERSION.frais / CDI.brut, 0)} du brut annuel.`,
      },
      {
        ...VICTOIRE,
        heure: "12:00",
        texte: "Tu m'as dit : des freelances pour ce qui est incertain. Et ça, c'est certain ?",
      },
    ],
    sources: [
      {
        id: "commande",
        titre: "Lire l'avenant au contrat-cadre de Kervalis",
        cout: 0.5,
        nature: "decisive",
        resultat: `Avenant n° 3 : ${EXTENSION.etp} ETP supplémentaires sur la plateforme de données, de la semaine ${EXTENSION.semaine} à décembre 2028, fermes, révisables seulement à la hausse. La demande durable de la practice passe de ${DURABLE} à ${DURABLE + EXTENSION.etp} ETP. Un consultant en CDI sur ce poste y serait en mission toute l'année.`,
      },
      {
        id: "voies",
        titre: "Demander à Galaad et à Amandin ce que coûte chaque voie",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Convertir un freelance : ${euros(CONVERSION.frais)} de frais, en poste dès la semaine ${CONVERSION.semaine}, s'il accepte ; Galaad pense que sept sur dix acceptent. Passer par le cabinet : ${euros(RECRUTEMENT.honoraires)}, ${RECRUTEMENT.delaiMin} à ${RECRUTEMENT.delaiMax} semaines, ${RECRUTEMENT.retard} de plus au-delà de ${RECRUTEMENT.auDela} postes ouverts à la fois (${ctx.ouverts} en cours). Garder des freelances : ${euros(TJM_ACHAT)} la journée, soit ${euros(ECART_CDI_FREELANCE)} de marge de moins par semaine qu'un CDI en mission.`,
      },
    ],
    question: "Comment staffez-vous l'extension ?",
    options: [
      {
        t: "Avec deux freelances de plus, comme le reste",
        d: `Démarrage en semaine ${EXTENSION.semaine}, à ${euros(TJM_ACHAT)} la journée, sans engagement.`,
      },
      {
        t: "Proposer un CDI à Yaël Dosseh et à Zélia Brizard",
        d: `${euros(CONVERSION.frais)} de frais de conversion chacun ; en poste dès la semaine ${CONVERSION.semaine} s'ils acceptent, sinon le poste part au cabinet.`,
      },
      {
        t: "Lancer deux recrutements de plus par le cabinet",
        d: `${euros(RECRUTEMENT.honoraires)} chacun ; des freelances en attendant les arrivées.`,
      },
      {
        t: "Décliner l'extension : l'équipe est pleine",
        d: "Aucun coût ; Kervalis cherchera ailleurs.",
      },
    ],
    reactions: [
      [{ ...GALAAD, texte: "Deux profils vous attendent pour la semaine 9." }],
      null,
      [{ ...AMANDIN, texte: "Deux postes de plus ouverts chez le cabinet." }],
      [{ ...MARTHE, texte: "Dommage. Halden Partners, lui, n'a pas dit non." }],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Quatre consultants de Kéroual",
    jusqua: 10,
    messages: () => [
      {
        ...AURELIO,
        heure: "09:00",
        alerte: true,
        texte: `Monsieur Esnault, Kéroual Consulting ferme son agence de Rennes fin mars. Nous sommes ${KEROUAL.nombre} consultants data seniors, libres début avril, sans préavis à faire. Nous aimerions rester ensemble.`,
      },
      {
        ...VICTOIRE,
        heure: "09:40",
        texte:
          "Quatre seniors, sans frais de cabinet, avec la demande qu'on a : je ne vois pas ce qu'il y a à réfléchir.",
      },
      {
        ...MAIMOUNA,
        heure: "14:00",
        texte:
          "Les clients de la mise en conformité commencent à parler de l'après-30 juin. Certains ont déjà budgété la suite, d'autres attendent le vote.",
      },
    ],
    sources: [
      {
        id: "occupation",
        titre: "Calculer ce que ferait un consultant de plus, d'avril à décembre",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les contrats-cadres sont couverts par l'équipe et les recrutements en cours : un consultant de plus irait sur la vague. Reportée (environ ${pct(SCENARIOS.reportee.chance)}), elle s'arrête en avril : 0 semaine de mission sur 39. Maintenue (environ ${pct(SCENARIOS.maintenue.chance)}) : 13 semaines, jusqu'au 30 juin. Élargie (environ ${pct(SCENARIOS.elargie.chance)}) : 39 semaines. Les quatre de Kéroual demandent ${euros(KEROUAL.brut)} de brut : ${euros(COUT_KEROUAL_AN)} par an chargés, en mission ou non.`,
      },
      {
        id: "appels",
        titre: "Demander à Maïmouna ce que coûterait d'appeler les clients de la vague",
        cout: 0.5,
        nature: "utile",
        resultat: `Maïmouna : « Douze clients, deux jours pour deux managers : ${euros(SONDAGE.cout)} de facturation perdue. L'an dernier, sur une autre échéance, les clients qui avaient budgété la suite avant le vote ne s'étaient trompés qu'une fois sur dix. »`,
      },
    ],
    question: "Que répondez-vous à Aurélio Henaff ?",
    options: [
      {
        t: "Les embaucher tous les quatre : disponibles en avril, sans frais de cabinet",
        d: `Quatre CDI à ${euros(KEROUAL.brut)} de brut, en poste le 1er avril.`,
      },
      {
        t: "En embaucher deux, les plus expérimentés",
        d: "Deux CDI le 1er avril ; les deux autres iront ailleurs.",
      },
      {
        t: "Appeler d'abord les clients de la vague, et n'en embaucher deux que s'ils ont budgété l'année",
        d: `Deux jours de deux managers, ${euros(SONDAGE.cout)} de facturation perdue ; réponse à Aurélio sous dix jours.`,
      },
      {
        t: "Ne pas donner suite",
        d: "Aucun coût ; la vague reste couverte par des freelances.",
      },
    ],
    reactions: [
      [
        {
          ...AURELIO,
          texte: "Merci de votre confiance : nous arrivons tous les quatre le 1er avril.",
        },
      ],
      [
        {
          ...AURELIO,
          texte: "Deux d'entre nous, donc. Les deux autres iront chez Halden Partners.",
        },
      ],
      null,
      [{ ...AURELIO, texte: "Je comprends. Nous irons sans doute chez Halden Partners." }],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le comité de mars",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...VICTOIRE,
        heure: "08:30",
        alerte: true,
        texte:
          "Le comité, c'est mardi. Halden Partners annonce quarante recrutements data cette année, et nous ? Je veux ton plan d'avril à décembre.",
      },
      {
        ...AMANDIN,
        heure: "10:00",
        texte:
          "Pour ton plan : la practice perd en moyenne un consultant par trimestre. Les trois derniers départs ont mis trois à quatre mois à être remplacés.",
      },
      {
        ...PRUNE,
        heure: "15:20",
        texte: `Ta marge depuis janvier : ${ctx.marge}. Jours d'intercontrat : ${ctx.intercontrat}.`,
      },
    ],
    sources: [
      {
        id: "departs",
        titre: "Reprendre les départs de la practice avec Amandin",
        cout: 0.5,
        nature: "decisive",
        resultat: `Quinze pour cent de départs par an : un par trimestre en moyenne, avec trois mois de préavis. Lancé dès l'annonce d'un départ, un remplacement par cooptation (prime de ${euros(COOPTATION.prime)}) arrive avant que le poste soit vide. Sans remplacement, chaque poste durable laissé vide se tient en freelance : ${euros(ECART_CDI_FREELANCE)} de marge de moins par semaine. Le vote de Bruxelles est attendu le 26 mars, après le comité.`,
      },
      {
        id: "halden",
        titre: "Lire l'annonce de Halden Partners",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Halden Partners annonce quarante recrutements data en France cette année, « pour accompagner la vague réglementaire ». L'an dernier, il en annonçait trente-cinq ; son effectif data a augmenté de douze.",
      },
    ],
    question: "Quel plan présentez-vous au comité ?",
    options: [
      {
        t: "Un plan de croissance : cinq recrutements de plus dès avril, la demande le justifie",
        d: `Cinq postes au cabinet, ${euros(RECRUTEMENT.honoraires)} chacun ; arrivées à partir de juin.`,
      },
      {
        t: "Le noyau et la flexibilité : remplacer chaque départ par cooptation, des freelances sur la vague",
        d: `${euros(COOPTATION.prime)} de prime par remplacement ; les freelances suivent la vague, vote après vote.`,
      },
      {
        t: "La prudence : ne plus prendre de missions de la vague après avril",
        d: "Les missions en cours se terminent ; aucune nouvelle mission de mise en conformité.",
      },
      {
        t: "Pas de nouveau plan : on verra au fil de l'eau",
        d: "Rien ne change ; les départs seront traités quand ils arriveront.",
      },
    ],
    reactions: [
      [{ ...VICTOIRE, texte: "Le comité va aimer. Amandin ouvre les cinq postes lundi." }],
      [
        {
          ...VICTOIRE,
          texte: "Pas très spectaculaire. Mais je n'ai rien à opposer à tes chiffres.",
        },
      ],
      [
        {
          ...MAIMOUNA,
          texte:
            "Je préviens les clients de la vague : nous finissons les missions en cours, rien de plus.",
        },
      ],
      [{ ...VICTOIRE, texte: "Le comité attendait mieux de toi, Ruben." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Dimensionner le noyau sur la demande sûre", chemin: [1, 1, 1, 1, 2, 1] },
  { nom: "Embaucher parce que la demande est là", chemin: [0, 0, 1, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 1, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier : dimensionner l'équipe permanente sur la demande du
 * moment plutôt que sur la demande sûre. [décision, option]
 *
 *   · huit CDI d'un coup « parce que la demande est là » ;
 *   · l'inverse, quand la demande est devenue sûre : la laisser en freelance
 *     par habitude, et payer la marge chaque semaine ;
 *   · quatre seniors disponibles pour une vague qui peut retomber ;
 *   · un plan de croissance présenté au comité, avant le vote.
 */
export const REFLEXES = [
  [0, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  conversion: {
    deux: [
      { ...YAEL, texte: "J'accepte avec plaisir. Je commence lundi en CDI, sur la plateforme." },
      {
        ...ZELIA,
        texte: "Oui. Ne plus avoir à chercher ma prochaine mission, c'est ce que je voulais.",
      },
    ],
    yael: [
      { ...YAEL, texte: "J'accepte avec plaisir. Je commence lundi en CDI, sur la plateforme." },
      {
        ...ZELIA,
        texte: "Merci, mais je préfère rester indépendante. Je reste en mission jusqu'à la relève.",
      },
    ],
    zelia: [
      {
        ...YAEL,
        texte:
          "Merci, mais une autre société m'a fait une offre la semaine dernière. Je la prends.",
      },
      {
        ...ZELIA,
        texte: "Oui. Ne plus avoir à chercher ma prochaine mission, c'est ce que je voulais.",
      },
    ],
    aucun: [
      {
        ...YAEL,
        texte:
          "Merci, mais une autre société m'a fait une offre la semaine dernière. Je la prends.",
      },
      {
        ...ZELIA,
        texte: "Merci, mais je préfère rester indépendante. Je reste en mission jusqu'à la relève.",
      },
    ],
  },
  sondageFavorable: {
    ...MAIMOUNA,
    texte:
      "Huit clients sur douze ont budgété la suite jusqu'en décembre, quel que soit le vote. J'appelle Aurélio Henaff : nous en prenons deux.",
  },
  sondageDefavorable: {
    ...MAIMOUNA,
    texte:
      "Neuf clients sur douze attendent le vote avant de signer quoi que ce soit après juin. Je dis à Aurélio Henaff que nous ne recrutons pas.",
  },
  demarche: (n: number) => ({
    ...MARTHE,
    alerte: true,
    texte:
      n > 1
        ? `Monsieur Esnault, je vous informe que nous avons recruté en direct ${n} des freelances que vous nous aviez placés. Leurs postes sortent de votre contrat.`
        : "Monsieur Esnault, je vous informe que nous avons recruté en direct l'un des freelances que vous nous aviez placés. Son poste sort de votre contrat.",
  }),
  depart: (n: number) => ({
    ...GALAAD,
    texte:
      n > 1
        ? `${enLettres(n)} de vos freelances arrêtent leur mission : une offre mieux payée. Nous vous présentons des remplaçants sous dix jours.`
        : "Un de vos freelances arrête sa mission : une offre mieux payée. Nous vous présentons un remplaçant sous dix jours.",
  }),
  lot: {
    ...MARTHE,
    alerte: true,
    texte:
      "Monsieur Esnault, nos postes sont vides depuis un mois. J'ai confié le lot à Halden Partners jusqu'à fin juin.",
  },
  arrivee: (n: number) => ({
    ...AMANDIN,
    texte:
      n > 1
        ? `${enLettres(n)} nouveaux consultants arrivent lundi. Une semaine d'intégration, puis en mission.`
        : "Un nouveau consultant arrive lundi. Une semaine d'intégration, puis en mission.",
  }),
  indemnite: (montant: string) => ({
    ...GALAAD,
    texte: `Vous arrêtez des freelances engagés par l'accord-cadre : ${montant} d'indemnité, comme prévu au contrat.`,
  }),
  vote: {
    reportee:
      "Bruxelles a voté : l'échéance du 30 juin est reportée de deux ans pour les ETI. Les clients de la mise en conformité suspendent leurs missions dès avril.",
    maintenue:
      "Bruxelles a voté : l'échéance du 30 juin est maintenue. Les missions de mise en conformité iront jusqu'à l'été, puis s'éteindront.",
    elargie:
      "Bruxelles a voté : l'obligation est élargie aux ETI de plus de 250 salariés. La demande de mise en conformité tiendra toute l'année.",
  },
} as const;

export const ACTEURS = { VICTOIRE, MAIMOUNA, PRUNE, GALAAD, MARTHE, AMANDIN } as const;
