/**
 * LE MARCHÉ QUI S'OUVRE — le contenu de l'épisode.
 *
 * Geneviève Rivoallan dirige la stratégie d'Arvel Distribution : trente
 * agences en Auvergne-Rhône-Alpes, siège à Lyon. La rénovation énergétique
 * des maisons ouvre un marché nouveau pour le négoce : vendre aux
 * particuliers des bouquets de travaux clés en main, posés par les artisans
 * RGE du réseau. Un cabinet annonce 650 M€ ; le président veut les trente
 * agences ce trimestre ; un installateur intégré, Solvéane, cherche des
 * sous-traitants dans la région. Six décisions, chacune précédée de ce
 * qu'une directrice de la stratégie reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : le marché accessible, le seuil de rentabilité d'une
 * agence, les rythmes de chaque scénario, l'engagement de volume du
 * fabricant, le coût de la riposte par les prix.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import {
  AGENCES,
  ARTISANS,
  CABINET,
  ENVELOPPE,
  FABRICANT,
  FACTEUR,
  FERMETURE,
  FIXE,
  LANCEMENT,
  MARCHE,
  MARCHE_ACCESSIBLE,
  MARGE,
  OUVERTURE,
  PROTOCOLE,
  RIPOSTE,
  SCENARIOS,
  SEUIL,
  SEUIL_OUVERTURE,
  SOLVEANE,
} from "@/engine/episodes/marche-qui-s-ouvre";
import { kE, nombre, taux } from "./format";
import type { Contexte, Etape } from "./types";

const PRESIDENT = { de: "Théodore Montferrand", role: "Président d'Arvel Distribution" } as const;
const SOLANGE = { de: "Solange Videau", role: "Directrice administrative et financière" } as const;
const MARWAN = { de: "Marwan Oukacha", role: "Directeur du réseau des agences" } as const;
const NOLWENN = { de: "Nolwenn Penhoët", role: "Contrôleuse de gestion" } as const;
const ABDOULAYE = {
  de: "Abdoulaye Barry",
  role: "Chauffagiste RGE, client de l'agence de Bron",
} as const;
const LUKAS = { de: "Lukas Brenner", role: "Responsable grands comptes, Nordhalm" } as const;
const COME = { de: "Côme Vercoutre", role: "Associé, Varenge Conseil" } as const;

const M = (v: number) => `${nombre(v / 1e6, 1)} M€`;
const [PORTEUR, MOYEN, DIFFICILE] = SCENARIOS;
/** Les bouquets que signerait par an un ensemble d'agences, dans un scénario. */
const parAn = (bouquets: number, grandes: number, autres: number) =>
  bouquets * (grandes * FACTEUR.grande + autres * FACTEUR.autre);

/** Les chiffres de la semaine 1 : le marché par le bas, et ce qu'en dit le cabinet. */
export const CHIFFRES = {
  chantiers: MARCHE.maisons * MARCHE.renovation,
  bouquets: MARCHE.maisons * MARCHE.renovation * MARCHE.bouquet,
  accessible: MARCHE_ACCESSIBLE,
  cabinet: CABINET.marche * CABINET.part,
  /** Les bouquets d'une année dans les trente agences (porteur), les dix grandes (porteur, moyen). */
  reseauPorteur: parAn(PORTEUR!.bouquets, AGENCES.grandes, AGENCES.autres),
  grandesPorteur: parAn(PORTEUR!.bouquets, AGENCES.grandes, 0),
  grandesMoyen: parAn(MOYEN!.bouquets, AGENCES.grandes, 0),
  /** Les bouquets que garantit l'exclusivité des artisans, et ceux qu'exige celle du fabricant. */
  garantieArtisans: ARTISANS.exclusivite.nombre * ARTISANS.exclusivite.garantie,
  volumeFabricant: FABRICANT.exclusivite.volume / FABRICANT.partPAC,
} as const;

export const DIAGNOSTICS = [
  {
    id: "option",
    t: "Le marché existe, mais personne ne sait à quel rythme il achètera : il faut acheter de l'information au plus petit prix, garder le droit d'accélérer ou d'arrêter, et décider l'extension sur des faits",
  },
  {
    id: "artisans",
    t: "La ressource rare, ce sont les artisans RGE : il faut s'assurer les meilleurs avant qu'un concurrent ne les prenne",
  },
  {
    id: "vitesse",
    t: "Ce marché ira au premier entrant : il faut occuper tout le réseau avant Solvéane",
  },
  {
    id: "preuve",
    t: "Le marché n'est pas prouvé : il faut attendre que d'autres l'aient validé avant d'y engager l'entreprise",
  },
] as const;

/** Les agences du test, telles que les directeurs régionaux les nomment. */
const AGENCES_DU_TEST = {
  vitrine: "Villeurbanne, Écully et Bron",
  representatives: "Villeurbanne (urbaine), Meximieux (périurbaine) et Tarare (rurale)",
} as const;

/** Ce que les résultats du test disent, selon ce qu'on a choisi de mesurer, et où. */
function resultatsDuTest(ctx: Contexte): string {
  if (ctx.d1 === 3) {
    return "Il n'y a pas eu de test : rien à lire. Le marché, lui, a avancé sans Arvel : les artisans le disent au comptoir.";
  }
  if (ctx.d2 === 1) {
    return `Six semaines de suivi agence par agence. Au rythme atteint en fin de période, une fois l'offre installée, et rapporté à l'année : la grande agence signe ${ctx.rythmeGrande} bouquets par an ; les agences périurbaine et rurale, ${ctx.rythmeAutre} chacune. La marge après coordination tient : ${MARGE.toLocaleString("fr-FR")} € par bouquet. Les artisans interviennent en cinq semaines.`;
  }
  if (ctx.d2 === 0) {
    return `Six semaines dans les trois plus grosses agences. Au rythme atteint en fin de période, rapporté à l'année : ${ctx.rythmeGrande} bouquets par agence et par an. Aucune agence périurbaine ni rurale n'a été suivie.`;
  }
  return `Le chiffre d'affaires signé des agences ${ctx.d1 === 2 ? "volontaires" : "ouvertes"} équivaut, au rythme atteint en fin de période et rapporté à l'année, à ${ctx.rythmeMoyen} bouquets par agence et par an, en moyenne. Pas de détail par agence : rien n'avait été prévu pour le suivre.`;
}

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Un marché de 650 millions ?",
    jusqua: 2,
    messages: () => [
      {
        ...PRESIDENT,
        heure: "08:10",
        alerte: true,
        texte: `Geneviève, j'ai lu l'étude de Varenge Conseil ce week-end : ${M(CABINET.marche)} de rénovation énergétique dans la région, et personne d'organisé pour la vendre aux particuliers. Si nous ne le faisons pas, Solvéane le fera. Je veux votre proposition au comité de direction de la semaine prochaine. Moi, je penche pour les trente agences dès ce trimestre.`,
      },
      {
        ...SOLANGE,
        heure: "09:30",
        texte: `Avant de recruter dix conseillers et d'acheter ${kE(LANCEMENT[0]!.stock)} de pompes à chaleur et de menuiseries, j'aimerais savoir sur quoi repose le chiffre du cabinet. Le comité a réservé ${kE(ENVELOPPE)} pour le lancement : c'est un plafond, pas un objectif de dépense.`,
      },
      {
        ...MARWAN,
        heure: "11:00",
        texte:
          "Les chefs d'agence sont partants, surtout ceux des grandes. Les artisans RGE, eux, sont débordés : ce qu'ils veulent, ce sont des chantiers bien préparés et des aides montées sans eux.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "etude",
        titre: "Lire l'étude de Varenge Conseil",
        cout: 0.5,
        nature: "bruit",
        resultat: `${M(CABINET.marche)} par an : la rénovation énergétique de tous les logements d'Auvergne-Rhône-Alpes, maisons et immeubles, dans le scénario où les aides augmentent encore. Le cabinet en déduit qu'Arvel « peut viser ${taux(CABINET.part, 0)} », soit ${M(CHIFFRES.cabinet)}. Ni nombre de chantiers, ni part de ce qui se vend en bouquet ; un seul scénario.`,
      },
      {
        id: "logements",
        titre: "Extraire les données de logement de la zone des agences",
        cout: 1,
        nature: "decisive",
        resultat: `${MARCHE.maisons.toLocaleString("fr-FR")} maisons individuelles dans la zone de chalandise des trente agences. Chaque année, ${taux(MARCHE.renovation, 0)} d'entre elles engagent des travaux de rénovation énergétique aidés : ${CHIFFRES.chantiers.toLocaleString("fr-FR")} chantiers. Les immeubles, et le reste de la région, qui font l'essentiel du chiffre du cabinet, ne sont pas à la portée des agences. Les dix grandes agences, urbaines et périurbaines, ont ${nombre(FACTEUR.grande / FACTEUR.autre, 2)} fois plus de maisons à moins de vingt minutes que les vingt autres.`,
      },
      {
        id: "artisans",
        titre: "Interroger trente artisans RGE clients",
        cout: 1,
        nature: "decisive",
        resultat: `${nombre(MARCHE.bouquet * 10, 0)} chantiers de rénovation sur 10 se vendent en bouquet : plusieurs lots, un seul interlocuteur, les aides montées pour le client ; les autres, l'artisan les vend seul, lot par lot. Un bouquet coûte en moyenne ${kE(MARCHE.panier)} hors taxes, pose comprise ; il laisserait à Arvel ${MARGE.toLocaleString("fr-FR")} € de marge sur coût variable, matériaux et commission de coordination. Les artisans ont six mois de carnet : ils travailleront avec le premier qui le leur demandera sérieusement.`,
      },
      {
        id: "economiste",
        titre: "Appeler Gersende Lhuillier, économiste de la fédération du bâtiment",
        cout: 0.5,
        nature: "utile",
        resultat: `Gersende Lhuillier : « Trois avenirs pour l'an prochain. Aides maintenues et particuliers qui s'y mettent vraiment : une chance sur trois ; une agence moyenne signerait ${PORTEUR!.bouquets} bouquets par an. Aides maintenues mais adoption lente, faute d'artisans et de confiance : un peu moins d'une chance sur deux ; plutôt ${MOYEN!.bouquets}. Aides réduites au budget de l'automne : une sur quatre ; ${DIFFICILE!.bouquets}, pas plus. Le budget sera présenté dans six semaines. »`,
      },
      {
        id: "conseil",
        titre:
          "Appeler Esther Kalfon, ancienne directrice de la stratégie d'un groupe de distribution",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Esther Kalfon : « Un marché se compte par le bas : combien de clients possibles, combien achètent chaque année, combien achètent ce que tu vends, à quel prix. Ce que tu ne sais pas, achète-le au plus petit prix possible, et n'engage le réseau qu'une fois que tu sais ce qu'il vendra. Mais attendre n'est jamais gratuit : regarde qui d'autre lorgne le marché. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au comité de direction ?",
    options: [
      {
        t: "Lancer l'offre dans les trente agences dès la semaine 3 : être les premiers",
        d: `Dix conseillers recrutés, ${kE(LANCEMENT[0]!.stock)} de stock, ${kE(LANCEMENT[0]!.campagne)} de campagne régionale, ${kE(30 * OUVERTURE)} d'ouvertures.`,
      },
      {
        t: "Lancer dans les dix grandes agences, là où sont les maisons",
        d: `${kE(LANCEMENT[1]!.stock)} de stock, ${kE(LANCEMENT[1]!.campagne)} de campagne, ${kE(10 * OUVERTURE)} d'ouvertures ; les vingt autres en janvier.`,
      },
      {
        t: "Tester l'offre dans trois agences ce trimestre, et décider de l'extension sur ses résultats",
        d: `${kE(3 * OUVERTURE)} d'ouvertures, pas de stock : on commande au chantier. Le plan présenté au comité prévoit les dix grandes agences en janvier.`,
      },
      {
        t: "Attendre un an que le marché fasse ses preuves",
        d: "Rien n'est engagé ; le cabinet refera le point l'an prochain.",
      },
    ],
    reactions: [
      [
        {
          ...PRESIDENT,
          texte:
            "Voilà qui me plaît. Nous serons les premiers : je l'annonce aux chefs d'agence jeudi, et à la presse régionale dans la foulée.",
        },
        {
          ...SOLANGE,
          texte: `${kE(LANCEMENT[0]!.stock + LANCEMENT[0]!.campagne + 30 * OUVERTURE)} engagés avant le premier bouquet signé, plus que l'enveloppe. J'ai noté.`,
        },
      ],
      [
        {
          ...PRESIDENT,
          texte:
            "Dix agences, c'est un bon début. Le comité valide ; je veux les vingt autres en janvier.",
        },
      ],
      [
        {
          ...PRESIDENT,
          texte:
            "Trois agences… Je vous laisse le trimestre, Geneviève. Mais en janvier, je veux les dix grandes agences, au minimum : c'est le plan que le comité valide.",
        },
      ],
      [
        {
          ...PRESIDENT,
          texte:
            "Attendre ? Solvéane, lui, n'attendra pas. Le comité vous suit, mais on en reparlera.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Ce que le test doit dire",
    jusqua: 4,
    messages: (ctx) => [
      ctx.d1 === 3
        ? {
            ...MARWAN,
            heure: "10:00",
            alerte: true,
            texte:
              "Rien ne se lance ce trimestre, mais le président veut savoir ce que vous suivriez le jour où l'on testera : sur quelles agences, avec quels chiffres.",
          }
        : {
            ...MARWAN,
            heure: "10:00",
            alerte: true,
            texte:
              ctx.d1 === 2
                ? `Les agences ouvrent lundi. Les directeurs régionaux proposent nos trois plus grosses, ${AGENCES_DU_TEST.vitrine} : les maisons, les meilleurs artisans, des chefs d'agence motivés. Si on veut que ça marche, c'est là.`
                : "Les agences ouvrent lundi. Le comité veut un point de mesure : sur quelles agences, et sur quels chiffres, jugera-t-on le lancement en semaine 8 ?",
          },
      {
        ...NOLWENN,
        heure: "14:30",
        texte:
          "Pour juger un test, il faut fixer le critère avant de voir les chiffres. Sinon, on trouve toujours une bonne raison de continuer.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "representativite",
        titre: "Comparer ce que vendent les agences du réseau",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les dix grandes agences vendent aux propriétaires de maisons ${nombre(FACTEUR.grande, 1)} fois la moyenne du réseau, les vingt autres ${nombre(FACTEUR.autre, 1)} fois. Trois grandes agences testées donneraient un rythme ${taux(FACTEUR.grande - 1, 0)} au-dessus de celui du réseau ; une grande et deux autres, le rythme moyen, et ce que vaut chaque type d'agence.`,
      },
      {
        id: "mesures",
        titre: "Demander à Nolwenn Penhoët comment juger le test",
        cout: 0.5,
        nature: "utile",
        resultat: `Nolwenn Penhoët : « Le chiffre d'affaires signé ne suffit pas. Il faut les bouquets signés par agence, rapportés à l'année, la marge après coordination et le délai des artisans, agence par agence, à comparer au seuil de rentabilité d'une agence. Le protocole de suivi coûte ${kE(PROTOCOLE)}. »`,
      },
    ],
    question: "Sur quelles agences, et sur quels chiffres, jugerez-vous le test ?",
    options: [
      {
        t: "Sur les trois plus grosses agences, avec les artisans les plus motivés : mettre toutes les chances de notre côté",
        d: "Pas de frais de suivi. Les meilleurs chiffres possibles en semaine 8.",
      },
      {
        t: "Sur trois agences représentatives, une urbaine, une périurbaine, une rurale, jugées une par une sur des critères fixés d'avance",
        d: `${kE(PROTOCOLE)} de protocole : bouquets signés par agence, marge après coordination, délai des artisans.`,
      },
      {
        t: "Laisser les directeurs régionaux proposer des agences volontaires, et suivre le chiffre d'affaires signé",
        d: "Pas de frais. On fera le point en semaine 8.",
      },
    ],
    reactions: [
      [
        {
          ...MARWAN,
          texte: `${AGENCES_DU_TEST.vitrine} : c'est noté. Les chefs d'agence et leurs artisans sont ravis d'être en vitrine.`,
        },
      ],
      [
        {
          ...NOLWENN,
          texte: `${AGENCES_DU_TEST.representatives} : chaque vendredi, elles remonteront leurs devis, leurs bouquets signés, leur marge et les délais des artisans.`,
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les artisans",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...ABDOULAYE,
        heure: "08:40",
        alerte: true,
        texte:
          "Madame Rivoallan, je vous préviens parce qu'on travaille ensemble depuis quinze ans : Solvéane m'a appelé hier. Ils cherchent des sous-traitants RGE dans la région, à l'année. Ils appellent tous les bons.",
      },
      {
        ...PRESIDENT,
        heure: "10:15",
        texte: `Prenons-les tous avant eux : l'exclusivité, avec des chantiers garantis. ${ARTISANS.exclusivite.nombre} artisans sous contrat, et Solvéane n'aura personne.`,
      },
      ...(Number(ctx.agences) > 0
        ? [
            {
              ...NOLWENN,
              heure: "17:30",
              texte: `Point du vendredi : ${ctx.bouquets} bouquets signés depuis l'ouverture, ${ctx.agences} agence${Number(ctx.agences) > 1 ? "s" : ""} équipée${Number(ctx.agences) > 1 ? "s" : ""}. Trop tôt pour conclure.`,
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "solveane",
        titre: "Étudier ce que Solvéane a fait dans les autres régions",
        cout: 0.5,
        nature: "decisive",
        resultat: `Solvéane vend et pose des bouquets clés en main, avec ses équipes et des artisans sous-traitants qui achètent par sa centrale. En Bourgogne, il est arrivé quatre mois après la campagne d'un négociant qui avait ouvert trente points de vente d'un coup, et y a pris soixante artisans. En Savoie, où un négociant avait signé une charte avec les meilleurs artisans RGE, il a renoncé : sans poseurs, pas d'implantation. Notre service études estime ses chances de venir à ${nombre(SOLVEANE.base[0] * 4, 0)} sur 4 après un lancement à grand bruit, ${nombre(SOLVEANE.base[1] * 10, 0)} sur 10 après un lancement dans les grandes agences, ${nombre(SOLVEANE.base[2] * 10, 0)} sur 10 si nous testons discrètement, un peu plus d'une sur deux si nous ne faisons rien. S'il vient, il nous prend le quart de nos bouquets et l'équivalent de ${kE(ARTISANS.aucun.negoce)} de marge de négoce, quand nos artisans ne sont engagés nulle part.`,
      },
      {
        id: "contrats",
        titre: "Chiffrer les deux formules d'engagement des artisans",
        cout: 0.5,
        nature: "decisive",
        resultat: `L'exclusivité : ${ARTISANS.exclusivite.nombre} artisans, ${kE(ARTISANS.exclusivite.frais)} de signature et de formation, ${ARTISANS.exclusivite.garantie} chantiers garantis à chacun par an pendant ${ARTISANS.exclusivite.annees} ans, soit ${CHIFFRES.garantieArtisans} bouquets par an, et ${ARTISANS.exclusivite.penalite} € de pénalité par chantier manquant ; elle retire à Solvéane une chance sur cinq, et ne lui laisse presque rien s'il vient. La charte : ${ARTISANS.charte.nombre} artisans des zones visées, ${kE(ARTISANS.charte.frais)} de formation et d'outils de devis, une priorité sur les chantiers de leur zone, ni exclusivité ni volume ; elle lui retire une chance sur huit, et s'il vient, il ne prend qu'un dixième de nos bouquets et ${kE(ARTISANS.charte.negoce)} de marge de négoce. Repères : les dix grandes agences signeraient ${CHIFFRES.grandesMoyen} bouquets par an dans le scénario moyen, les trente ${CHIFFRES.reseauPorteur} dans le scénario porteur.`,
      },
    ],
    question: "Comment vous assurez-vous des artisans ?",
    options: [
      {
        t: `Signer l'exclusivité de ${ARTISANS.exclusivite.nombre} artisans RGE dans tout le réseau, avec des chantiers garantis : occuper le terrain avant Solvéane`,
        d: `${kE(ARTISANS.exclusivite.frais)} de frais ; ${ARTISANS.exclusivite.garantie} chantiers garantis à chacun par an pendant ${ARTISANS.exclusivite.annees} ans, ${ARTISANS.exclusivite.penalite} € par chantier manquant.`,
      },
      {
        t: `Signer une charte de partenariat avec les ${ARTISANS.charte.nombre} meilleurs artisans des zones visées : formation, outils de devis, priorité sur les chantiers`,
        d: `${kE(ARTISANS.charte.frais)} ; ni exclusivité, ni volume garanti.`,
      },
      {
        t: "Ne rien signer pour l'instant : on recrutera les artisans au moment d'étendre",
        d: "Rien à payer.",
      },
    ],
    reactions: [
      [
        {
          ...ABDOULAYE,
          texte:
            "Deux chantiers garantis par an et l'exclusivité ? Je signe, et les copains aussi. Solvéane peut toujours appeler.",
        },
      ],
      [
        {
          ...ABDOULAYE,
          texte:
            "Une formation, un outil de devis, et la priorité sur les chantiers de mon secteur : je signe. Je dirai à Solvéane que je suis pris.",
        },
      ],
      [
        {
          ...ABDOULAYE,
          texte: "Comme vous voudrez. Mais Solvéane rappellera, et tout le monde ne dira pas non.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le fabricant",
    jusqua: 7,
    messages: () => [
      {
        ...LUKAS,
        heure: "10:15",
        alerte: true,
        texte: `Madame Rivoallan, Nordhalm croit à votre projet. Notre proposition : l'exclusivité de nos pompes à chaleur dans vos agences pendant trois ans, ${taux(FABRICANT.exclusivite.taux, 0)} de remise sur leur prix net, et ${taux(FABRICANT.exclusivite.cofinancement, 0)} de vos frais d'ouverture pris en charge. En contrepartie, ${FABRICANT.exclusivite.volume} pompes à chaleur par an, calées sur l'étude de Varenge ; ${FABRICANT.exclusivite.penalite} € par pompe manquante.`,
      },
      {
        ...SOLANGE,
        heure: "11:40",
        texte: `${taux(FABRICANT.exclusivite.cofinancement, 0)} des ouvertures payés par le fabricant, c'est tentant. Mais ${FABRICANT.exclusivite.volume} pompes à chaleur, ça fait combien de bouquets ?`,
      },
    ],
    sources: [
      {
        id: "volumes",
        titre: "Rapporter l'engagement de volume aux bouquets",
        cout: 0.5,
        nature: "decisive",
        resultat: `Une pompe à chaleur entre dans ${nombre(FABRICANT.partPAC * 10, 0)} bouquets sur 10 : ${FABRICANT.exclusivite.volume} pompes, c'est ${CHIFFRES.volumeFabricant} bouquets par an. Les trente agences en signeraient ${CHIFFRES.reseauPorteur} dans le scénario porteur ; les dix grandes, ${CHIFFRES.grandesPorteur} dans le porteur et ${CHIFFRES.grandesMoyen} dans le moyen. Sa remise de ${taux(FABRICANT.exclusivite.taux, 0)} sur une pompe à ${FABRICANT.prixPAC.toLocaleString("fr-FR")} € net, c'est ${nombre(FABRICANT.prixPAC * FABRICANT.exclusivite.taux, 0)} € par pompe, ${nombre(FABRICANT.exclusivite.remise, 0)} € de marge en plus par bouquet ; chaque pompe manquante coûte ${FABRICANT.exclusivite.penalite} €, chaque année, trois ans durant.`,
      },
      {
        id: "formules",
        titre: "Sonder Nordhalm sur d'autres formules",
        cout: 0.5,
        nature: "utile",
        resultat: `Lukas Brenner a deux autres formules en réserve. Un référencement préférentiel, sans exclusivité ni volume : ${taux(FABRICANT.referencement.taux, 0)} de remise, ${nombre(FABRICANT.referencement.remise, 0)} € de marge en plus par bouquet ; sa direction l'accepte à peu près six fois sur dix. Un partage du risque : Nordhalm prend en charge ${taux(FABRICANT.partage.cofinancement, 0)} des frais d'ouverture, ceux du trimestre et ceux de janvier, et se rembourse par ${FABRICANT.partage.redevance} € sur chaque pompe posée pendant trois ans, soit ${nombre(FABRICANT.partage.redevance * FABRICANT.partPAC, 0)} € par bouquet.`,
      },
    ],
    question: "Que répondez-vous à Nordhalm ?",
    options: [
      {
        t: "Signer l'exclusivité : les ouvertures financées, la meilleure remise",
        d: `Trois ans, ${FABRICANT.exclusivite.volume} pompes à chaleur par an ; ${FABRICANT.exclusivite.penalite} € par pompe manquante.`,
      },
      {
        t: "Demander un référencement préférentiel, sans exclusivité ni volume",
        d: `${taux(FABRICANT.referencement.taux, 0)} de remise si Nordhalm accepte ; Arvel reste libre de ses fournisseurs.`,
      },
      {
        t: "Rester multimarque, au tarif habituel",
        d: "Rien à signer, rien de remisé.",
      },
      {
        t: "Partager le risque : Nordhalm finance la moitié des ouvertures, contre une redevance sur chaque pompe posée",
        d: `La moitié des ouvertures remboursée ; ${FABRICANT.partage.redevance} € par pompe posée pendant trois ans.`,
      },
    ],
    reactions: [
      [
        {
          ...LUKAS,
          texte:
            "Parfait. Le contrat d'exclusivité part à la signature ; nous vous remboursons dès maintenant 40 % des ouvertures déjà faites, et nous prendrons 40 % de celles de janvier.",
        },
      ],
      null,
      [
        {
          ...LUKAS,
          texte: "Dommage. Nos tarifs restent à votre disposition, comme ceux de nos concurrents.",
        },
      ],
      [
        {
          ...LUKAS,
          texte:
            "Entendu : nous vous remboursons la moitié des ouvertures déjà faites, et la redevance courra sur chaque pompe posée à partir de janvier.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Les chiffres du test",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...SOLANGE,
        heure: "08:30",
        texte:
          ctx.aides === 0
            ? "Le budget est présenté : les aides à la rénovation baissent d'un tiers en mars. Les particuliers qui hésitaient vont attendre, ou renoncer."
            : "Le budget est présenté : les aides à la rénovation sont maintenues à l'identique l'an prochain.",
      },
      {
        ...PRESIDENT,
        heure: "10:00",
        alerte: true,
        texte:
          ctx.d1 === 3
            ? "Le budget est voté, Solvéane recrute, et nous n'avons rien testé. Le comité veut savoir ce que nous faisons en janvier."
            : ctx.d1 === 2
              ? "Les chiffres du test sont là. Le plan validé, ce sont les dix grandes agences en janvier ; Varenge me dit d'aller plus vite. Qu'est-ce que je présente au comité ?"
              : "Les agences tournent depuis six semaines. Le comité veut le plan de janvier : on tient le cap ?",
      },
      {
        ...COME,
        heure: "15:00",
        texte:
          "Madame Rivoallan, le marché est là, vos premiers chiffres le confirment. Le risque, maintenant, c'est d'être trop prudents : tout le réseau en janvier, avant Solvéane.",
      },
    ],
    sources: [
      {
        id: "resultats",
        titre: "Lire les résultats du test, agence par agence",
        cout: 0.5,
        nature: "decisive",
        resultat: resultatsDuTest,
      },
      {
        id: "seuil",
        titre: "Poser le seuil de rentabilité d'une agence",
        cout: 0.5,
        nature: "decisive",
        resultat: `Une agence équipée coûte ${kE(FIXE)} de charges fixes par an ; à ${MARGE.toLocaleString("fr-FR")} € de marge par bouquet, elle les couvre à partir de ${nombre(SEUIL, 1)} bouquets par an. Avec l'ouverture (${kE(OUVERTURE)}), amortie sur trois ans au taux de 10 %, il en faut ${nombre(SEUIL_OUVERTURE, 1)}. Sous ce seuil, une agence perd de l'argent chaque année qu'on la garde, et sa fermeture coûte ${kE(FERMETURE)}. Au-dessus, elle en rapporte trois ans durant.`,
      },
      {
        id: "budget",
        titre: "Lire ce que le budget change pour l'an prochain",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.aides === 0
            ? `Aides réduites d'un tiers à partir de mars. Gersende Lhuillier s'attend désormais au scénario difficile : ${DIFFICILE!.bouquets} bouquets par agence moyenne et par an, pas plus.`
            : `Aides maintenues : le scénario difficile est écarté. Reste à savoir si les particuliers suivent vraiment (${PORTEUR!.bouquets} bouquets par agence moyenne et par an) ou lentement (${MOYEN!.bouquets}) : c'est ce que le test dit.`,
      },
    ],
    question: "Quel plan présentez-vous pour janvier ?",
    options: [
      {
        t: "Tenir le plan validé par le comité en semaine 1",
        d: "Ce que le comité a validé part en janvier, sans retouche.",
      },
      {
        t: "Réviser l'ambition sur les chiffres du test : tout le réseau si chaque type d'agence passe le seuil, les grandes seules si elles sont les seules à le passer, l'arrêt sinon",
        d: "Le plan de janvier suit ce que le test a mesuré, à la hausse comme à la baisse.",
      },
      {
        t: "Prolonger le test six mois avant d'engager quoi que ce soit",
        d: "Les agences équipées continuent ; l'extension se décidera en juin.",
      },
      {
        t: "Accélérer : ouvrir tout le réseau en janvier, avant que Solvéane n'arrive",
        d: "Toutes les ouvertures restantes en janvier, recrutements lancés dès maintenant.",
      },
    ],
    reactions: [
      [{ ...PRESIDENT, texte: "Le plan, c'est le plan. On y va." }],
      [
        {
          ...SOLANGE,
          texte:
            "Le comité valide un plan qui suit les chiffres du test, agence par agence. Les recrutements partiront en conséquence.",
        },
      ],
      [
        {
          ...PRESIDENT,
          texte:
            "Six mois de plus… Soit. Mais en juin, je veux une réponse, et Solvéane n'attendra pas.",
        },
      ],
      [
        {
          ...PRESIDENT,
          texte: "Enfin ! Tout le réseau en janvier. Je l'annonce lundi aux chefs d'agence.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Solvéane",
    jusqua: 13,
    messages: () => [
      {
        ...ABDOULAYE,
        heure: "08:20",
        alerte: true,
        texte:
          "Solvéane a réuni une trentaine d'artisans de l'Est lyonnais mardi soir, buffet compris. Ils diront début janvier s'ils s'installent dans la région.",
      },
      {
        ...PRESIDENT,
        heure: "09:45",
        texte:
          "Coupons-leur l'herbe sous le pied : on baisse notre commission d'un tiers dès janvier. S'ils voient qu'on casse les prix, ils ne viendront pas.",
      },
      {
        ...MARWAN,
        heure: "11:30",
        texte:
          "Autre idée : on prépare une riposte, une prime de fidélité pour nos artisans partenaires et le montage des aides offert aux clients, et on ne la déclenche que s'ils arrivent.",
      },
    ],
    sources: [
      {
        id: "riposte",
        titre: "Chiffrer les deux ripostes",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Baisser la commission d'un tiers, c'est ${nombre(RIPOSTE.prix, 0)} € de marge en moins sur chaque bouquet de la première année, que Solvéane vienne ou non, et une campagne de ${kE(RIPOSTE.annonce)} pour l'annoncer : ${
            Number(ctx.bouquetsPlan) > 0
              ? `${kE(Number(ctx.coutPrix))} en valeur actuelle avec le plan engagé, ${nombre(Number(ctx.bouquetsPlan), 0)} bouquets par an`
              : "sans bouquet prévu l'an prochain, la campagne seule"
          }. Notre service études estime qu'elle lui retirerait une chance sur dix de venir. La riposte ciblée coûte ${kE(RIPOSTE.ciblee.cout)}, et seulement s'il arrive : elle divise par deux ce qu'il nous prendrait si nos artisans sont engagés avec nous, d'un quart seulement sinon. Avec nos engagements actuels, s'il vient, il nous prendrait ${ctx.perte} de nos bouquets et l'équivalent de ${ctx.negoce} de marge de négoce.`,
      },
      {
        id: "darrieux",
        titre:
          "Croiser Romaric Darrieux, directeur du développement de Solvéane, au salon de l'habitat",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Romaric Darrieux : « Nous regardons Lyon comme les autres régions : un marché qui se vend, des poseurs disponibles. Les prix des négociants ne nous font pas changer d'avis : nous ne vendons pas au même client, nous vendons une maison rénovée. »",
      },
    ],
    question: "Comment vous préparez-vous à Solvéane ?",
    options: [
      {
        t: "Baisser la commission d'un tiers dès janvier, pour dissuader Solvéane",
        d: `${nombre(RIPOSTE.prix, 0)} € de marge en moins sur chaque bouquet de l'an prochain, dans toutes les agences.`,
      },
      {
        t: "Préparer une riposte ciblée, déclenchée seulement si Solvéane s'implante",
        d: `Prime de fidélité aux artisans partenaires, montage des aides offert : ${kE(RIPOSTE.ciblee.cout)} s'il vient, rien sinon.`,
      },
      {
        t: "Ne rien prévoir : on verra en janvier",
        d: "Rien à payer.",
      },
    ],
    reactions: [
      [{ ...PRESIDENT, texte: "Voilà qui va les faire réfléchir." }],
      [
        {
          ...MARWAN,
          texte:
            "Tout est prêt : si Solvéane annonce son arrivée, nos artisans partenaires reçoivent l'offre le lendemain matin.",
        },
      ],
      [{ ...MARWAN, texte: "Entendu. On verra bien." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Tester, puis décider sur les chiffres", chemin: [2, 1, 1, 1, 1, 1] },
  { nom: "Être les premiers partout", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attendre que le marché soit prouvé", chemin: [3, 2, 2, 2, 0, 2] },
] as const;

/**
 * Les réflexes du métier devant un marché qui s'ouvre : tout miser sur le
 * scénario du cabinet pour être le premier, ou attendre qu'il soit prouvé ;
 * tester là où l'on est sûr de réussir ; occuper le terrain par des contrats
 * à volume garanti ; tenir le plan, ou l'accélérer, quand les chiffres disent
 * le contraire ; riposter par les prix. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [4, 3],
  [5, 0],
] as const;

export const REPONSES = {
  volontairesGrandes:
    "Les volontaires : Villeurbanne, Écully et Tarare. Deux grandes agences et une rurale.",
  volontairesAutres:
    "Les volontaires : Villeurbanne, Meximieux et Tarare. Une grande agence, une périurbaine, une rurale.",
  referencementAccepte: `Ma direction accepte : référencement préférentiel, ${taux(FABRICANT.referencement.taux, 0)} de remise sur nos pompes à chaleur, sans exclusivité ni volume.`,
  referencementRefuse:
    "Ma direction refuse un référencement sans engagement : vous restez au tarif habituel. L'offre d'exclusivité tient toujours.",
  aidesMaintenues:
    "Le budget est présenté : les aides à la rénovation des logements sont maintenues à l'identique l'an prochain.",
  aidesReduites:
    "Le budget est présenté : les aides à la rénovation des logements baissent d'un tiers à partir de mars.",
  solveaneEntre:
    "Solvéane annonce son implantation : une agence à Lyon en mars, et une campagne pour recruter des artisans sous-traitants.",
  solveaneRenonce:
    "Solvéane renonce à la région pour l'instant : « pas assez de poseurs disponibles », dit son communiqué.",
  ripostePartie:
    "La riposte part ce matin : prime de fidélité à nos artisans partenaires, montage des aides offert à leurs clients.",
} as const;
