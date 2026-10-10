/**
 * ÉPISODE 46 — LE RÉSEAU D'AGENCES À REDESSINER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord du réseau montre à Mathurin, ce
 * que la courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * Une carte de réseau se joue sur des années, l'épisode sur un trimestre :
 * le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, cinq ans de marge
 * incrémentale du réseau pour chaque position prise, moins les sommes
 * engagées et perdues, recalculée chaque semaine avec ce que le trimestre
 * révèle : le report des clients de Bron, la part nouvelle du point de
 * retrait, la décision de Talvère, le vote de la zone des Ormeaux.
 */
import {
  BRON,
  BRON_OPTIONS,
  CHANCE_TALVERE,
  D,
  ENVELOPPE,
  FORMATS,
  FORMAT_DE,
  JOURS_SANS_PERTE,
  LOCAL_REPRIS,
  MULTIPLE,
  NEUTRE,
  OBJECTIF_VALEUR,
  PERTE_PAR_JOUR,
  PRIMES,
  PROJET,
  TALVERE,
  TAUX,
  TAUX_MCV,
  TEST,
  VN,
  VN_OPTIONS,
  chanceTalvere,
  comptesSignes,
  dedit,
  evenements,
  hasard,
  margeIncrementale,
  simuler,
  tableauDeBord,
  type Format,
  type Trimestre,
} from "@/engine/episodes/reseau-a-redessiner";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/reseau-a-redessiner";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const points = (v: number) => `${nombre(v * 100, 0)} pts`;

const SOLVEIG = {
  de: "Solveig Arnaudon",
  role: "Directrice administrative et financière",
} as const;
const ANICET = { de: "Anicet Valloton", role: "Directeur de l'agence de Saint-Priest" } as const;
const ALBERTINE = { de: "Albertine Lepage", role: "Directrice de l'agence de Bron" } as const;
const HIND = {
  de: "Hind Belarbi",
  role: "Responsable du point de retrait de Villeurbanne-Nord",
} as const;
const EDMOND = {
  de: "Edmond Rouvière",
  role: "Gérant de la SCI propriétaire, Villeurbanne-Nord",
} as const;
const ALDRIC = {
  de: "Aldric Pons",
  role: "Directeur de l'aménageur de la zone des Ormeaux",
} as const;
const GAUVAIN = { de: "Gauvain Pecqueur", role: "Contrôleur de gestion du réseau" } as const;
const METROPOLE = {
  de: "Mélusine Barral",
  role: "Directrice de cabinet du vice-président à l'urbanisme",
} as const;

/**
 * La marge incrémentale annuelle d'une agence complète à Mions, cannibalisation
 * déduite, hors zone d'aménagement : ce que la prévision de la semaine 1 demande.
 */
export const MARGE_AGENCE_MIONS = margeIncrementale(FORMATS.agence);

/**
 * La part du chiffre de Bron qui doit suivre à Saint-Priest pour que la
 * fermeture ne détruise pas de valeur, sur cinq ans et frais de fermeture
 * compris : ce que la source du report affiche (45 %).
 */
export const SEUIL_FERMETURE =
  1 - (BRON.fixes - BRON.renfort - BRON.fermeture / MULTIPLE) / (TAUX_MCV * BRON.ca);

const formatDe = (decisions: readonly number[]): Format =>
  FORMAT_DE[decisions[D.mions] ?? NEUTRE[D.mions]]!;

const PRESENCE: Record<Format, string> = {
  agence: "une agence complète au printemps",
  tournee: "une tournée de livraison, sans site",
  comptoir: "un comptoir ouvert en semaine 7",
  aucun: "rien avant le vote",
};

const USAGE_TERRAIN: Record<Format, string> = {
  agence:
    "Mais notre agence du centre de Mions est à 3 km : une seconde agence sur le boulevard lui prendrait ses clients, et c'est elle qui captera la croissance de la zone. Le terrain ne nous servirait à rien.",
  comptoir:
    "Le comptoir de Mions y déménagerait avec ses clients : l'agence du boulevard partirait avec une clientèle déjà acquise.",
  tournee:
    "L'agence du boulevard partirait sans clientèle dans la zone : les clients de la tournée resteraient à Saint-Priest.",
  aucun: "L'agence du boulevard partirait de rien, et Talvère aurait pu s'installer avant elle.",
};

/** Ce que les décisions révèlent, dans l'ordre où un directeur des opérations les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, l'étude de zone et les adresses de livraison qui permettaient de déduire la cannibalisation",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    reseau:
      "Votre diagnostic de la semaine 1 était juste : un site se juge sur la marge qu'il ajoute au réseau, cannibalisation et report de clientèle compris, et l'engagement se proportionne à une demande incertaine.",
    incertitude:
      "En semaine 1, vous avez vu que la demande de Mions était incertaine : c'est vrai, mais l'essentiel était ailleurs. Même votée, la zone ne rend pas nouveau le chiffre qu'une agence reprend à Saint-Priest et à Vénissieux.",
    terrain:
      "En semaine 1, vous avez retenu qu'il fallait être à Mions avant Talvère, et en grand. Un comptoir suffit à la dissuader deux fois sur trois ; une agence complète y prendrait surtout nos propres clients.",
    papier:
      "En semaine 1, vous avez retenu le classement des agences. Une agence en perte après frais de siège peut rapporter au réseau : ces frais restent quand elle ferme, et ses clients ne suivent pas tous.",
  };
  const justes = ["reseau", "incertitude"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 2, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 2, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 2, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "reseau" ? 1 : d === "incertitude" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes du comité : ni ouvrir en grand là où le concurrent arrive, ni fermer la dernière du classement, ni riposter par les prix, ni poursuivre un plan démenti, ni acheter pour bloquer, ni laisser chaque directeur défendre son compte."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe qui rassure le comité : occuper le terrain en grand, fermer sur le compte d'exploitation, riposter par les prix, suivre le plan malgré les chiffres, acheter pour bloquer, juger chaque agence seule.${
            t.localRepris ? " Un concurrent a en plus repris le local de Bron." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    MARGE_AGENCE_MIONS / 1000,
    "de marge incrémentale annuelle pour une agence complète à Mions",
    "k€",
    { juste: 8, proche: 25 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const d2 = p.chemin[D.bron];
  const d4 = p.chemin[D.villeurbanne];
  const suivi = taux(t.report, 0);
  const sBron = d2 === BRON_OPTIONS.tester ? 1 : d2 === BRON_OPTIONS.garder ? 0.6 : 0;
  const sVN = d4 === VN_OPTIONS.garderPR ? 1 : d4 === VN_OPTIONS.renoncer ? 0.6 : 0;
  const bron =
    d2 === BRON_OPTIONS.tester
      ? `Pour Bron, vous avez mesuré le report avant de trancher : ${suivi} du chiffre suivait à Saint-Priest, ${
          t.bronFerme ? "assez pour fermer." : "pas assez pour fermer."
        }`
      : d2 === BRON_OPTIONS.garder
        ? `Pour Bron, vous avez gardé l'agence sans savoir combien de clients auraient suivi (${suivi}, on le sait maintenant) : prudent, mais sans la mesure, la question reviendra l'an prochain.`
        : `Pour Bron, vous avez fermé sur le compte d'exploitation : les 180 k€ de frais communs restent au réseau, et ${taux(t.report - (t.localRepris ? LOCAL_REPRIS.perte : 0), 0)} seulement du chiffre a suivi${
            t.localRepris ? ", un concurrent ayant repris le local" : ""
          }.`;
  const vn =
    d4 === VN_OPTIONS.garderPR
      ? ` À Villeurbanne-Nord, vous avez changé de cap au vu des premiers chiffres : ${taux(1 - t.partNouvelle, 0)} du chiffre du point de retrait venait de clients déjà acquis.`
      : d4 === VN_OPTIONS.renoncer
        ? " À Villeurbanne-Nord, vous avez renoncé à l'agence, et au point de retrait avec : il apportait pourtant un peu de chiffre nouveau pour peu de coûts fixes."
        : ` À Villeurbanne-Nord, vous avez suivi le plan de juin alors que ${taux(1 - t.partNouvelle, 0)} du chiffre du point de retrait venait de nos propres clients : une agence qui déplace des clients plus qu'elle n'en crée.`;
  const carte: Constat = { score: (sBron + sVN) / 2, texte: bron + vn };

  return [information, diagnostic, reflexe, calibrage, carte];
}

export function axe([information, diagnostic, reflexe, calibrage, carte]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher d'où viennent les clients",
      texte:
        "Rejouez l'épisode en croisant d'abord l'étude de zone avec les adresses de livraison : une agence à Mions reprend aux voisines la plus grande part de ce qu'elle vend, et c'est ce qui la départage.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Compter en marge du réseau, pas en compte d'agence",
      texte:
        "Le compte d'exploitation d'une agence compte comme nouveau ce qu'elle prend aux voisines, et comme perdu ce que ses clients iront acheter ailleurs chez Arvel. Jugez chaque ouverture et chaque fermeture sur ce qu'elle change à la marge de tout le réseau.",
    };
  }
  if (carte!.score < 0.5) {
    return {
      titre: "Mesurer avant de couper, réviser quand les chiffres parlent",
      texte:
        "Avant de fermer, mesurez la part des clients qui suivront : un test limité coûte peu à côté d'une erreur sur cinq ans. Et quand un test démentit le plan, changez de cap : le plan a été fait sans ces chiffres.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Juger un site sur ce qu'il ajoute au réseau",
      texte:
        "Un site neuf prend d'abord ses clients aux voisins ; une agence fermée laisse ses frais communs aux autres et n'emporte pas tous ses clients. La marge incrémentale du réseau dit ce qu'un site vaut vraiment.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la marge incrémentale",
      texte:
        "Du chiffre de l'étude, retirez ce que l'agence reprendrait aux voisines ; appliquez le taux de marge sur coûts variables au chiffre vraiment nouveau, puis retirez les coûts fixes propres du site.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions : un vote repoussé ou une Talvère installée peuvent faire perdre une bonne carte, sans la rendre mauvaise.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

export const EPISODE_RESEAU: Episode<Trimestre> = {
  code: "reseau-a-redessiner",
  numero: 46,
  domaine: "Stratégie de réseau",
  titre: "Le réseau d'agences à redessiner",
  resume:
    "Un concurrent qui cherche un terrain, une agence dernière du classement, un plan d'ouverture que les premiers chiffres démentent. Juger chaque site sur ce qu'il ajoute au réseau, cannibalisation et report de clientèle compris.",
  persona:
    "Vous êtes Mathurin Escoffier, directeur des opérations du réseau d'Arvel Distribution : trente et une agences de négoce de matériaux en Auvergne-Rhône-Alpes. Vous proposez au comité de direction où le réseau ouvre, ferme et se transforme ; ce trimestre, la carte de l'Est lyonnais se redessine.",
  mandat: [
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins par les décisions du trimestre" },
    {
      fort: kE(ENVELOPPE),
      texte: "d'investissements au plan de réseau de l'an prochain, terrains compris",
    },
    {
      fort: taux(TAUX, 0),
      texte: "le taux du groupe ; une position se valorise sur cinq ans de marge",
    },
    {
      fort: "5 agences",
      texte: "dans l'Est lyonnais : Saint-Priest, Vénissieux, Bron, Villeurbanne, Vaulx-en-Velin",
    },
  ],
  jugement:
    "Le comité juge le trimestre sur la valeur créée : cinq ans de marge incrémentale du réseau, au taux du groupe, pour chaque position prise, recalculés en semaine 13 avec ce que le trimestre a révélé, moins les sommes engagées et perdues.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre réseau",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la note au comité se boucle dans l'urgence, avec un cabinet payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...SOLVEIG,
        alerte: true,
        texte: `Pour tenir la date du comité, j'ai fait boucler ta note par le cabinet d'études : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle:
      "la marge incrémentale annuelle d'une agence complète à Mions, cannibalisation déduite, hors zone d'aménagement, en milliers d'euros",
    unite: "k€",
    placeholder: "100",
    min: -500,
    max: 1000,
    step: 1,
    reel: () => MARGE_AGENCE_MIONS / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur créée estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `cinq ans de marge à ${taux(l.taux ?? TAUX, 0)}, avec ce que le trimestre a révélé`
          : "rien n'est encore engagé",
    },
    {
      cle: "marge",
      nom: "Marge incrémentale du réseau",
      format: (v) => `${kE(v)}/an`,
      sensBon: 1,
      aide: () => "par an, positions prises, cannibalisation déduite",
    },
    {
      cle: "engage",
      nom: "Sommes engagées",
      format: kE,
      sensBon: -1,
      aide: () => `sur ${kE(ENVELOPPE)} au plan de réseau`,
      jauge: (l) => ({
        part: Math.min(1, (l.engage ?? 0) / ENVELOPPE),
        enRetard: (l.engage ?? 0) > ENVELOPPE,
      }),
    },
    {
      cle: "ca",
      nom: "Chiffre d'affaires de l'Est lyonnais",
      format: (v) => `${kE(v)}/sem.`,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `semaine ${semaine} ; Saint-Priest, Vénissieux, Bron, Villeurbanne-Nord`
          : "moyenne de l'an dernier",
    },
    {
      cle: "risque",
      nom: "Risque que Talvère ouvre à Mions",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: -1,
      aide: (semaine) =>
        semaine >= TALVERE.semaine
          ? "Talvère a décidé"
          : "estimé d'après ce qu'elle a fait ailleurs",
    },
  ],
  contexte(l, decisions): Contexte {
    const f = formatDe(decisions);
    const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
    const s = l.partNouvelle ?? VN.partNouvelle.moyenne;
    const hebdo = l.hebdoPR ?? VN.pr.ca / 52;
    const dispute = l.dispute ?? 0;
    return {
      format: f,
      mionsOuvert: f === "agence" || f === "comptoir",
      presence: PRESENCE[f],
      chanceTalvere: taux(chanceTalvere(chemin), 0),
      seuilFermeture: taux(SEUIL_FERMETURE, 0),
      hebdoPR: kE(hebdo),
      depassement: taux(hebdo / VN.planHebdo - 1, 0),
      partNouvelle: taux(s, 0),
      partReprise: taux(1 - s, 0),
      caNouveauAgence: kE(VN.agence.ca * Math.min(1, s + VN.bonusAgence)),
      usageTerrain: USAGE_TERRAIN[f],
      dispute,
      vnDispute: (decisions[D.villeurbanne] ?? NEUTRE[D.villeurbanne]) !== VN_OPTIONS.renoncer,
      disputeKE: kE(dispute),
      coutChacun: kE(PRIMES.chacun * dispute),
      coutNeutraliser: kE(PRIMES.neutraliser * dispute),
      coutBassin: kE(PRIMES.bassin * dispute),
      valeur: kE(l.valeur ?? 0),
      taux: taux(l.taux ?? TAUX, 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Marge incrémentale, sem. ${a}`, `${kE(s.marge)}/an`],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [200000, 400000, 600000, 800000, 1000000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `marge incrémentale ${kE(s.marge!)}/an · engagé ${kE(s.engage!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.talvere && choix === 0) {
      // Les gros comptes signent, ou attendent de voir, selon le hasard du trimestre.
      return [{ ...ANICET, texte: REPONSES.contrats(comptesSignes(graine)) }];
    }
    if (etape === D.villeurbanne && choix !== VN_OPTIONS.lancer) {
      // Le bailleur exige son dédit entier, ou en accepte la moitié.
      return [
        {
          ...EDMOND,
          texte: dedit(graine) === VN.dedit ? REPONSES.deditEntier : REPONSES.deditMoitie,
        },
        {
          ...HIND,
          texte: choix === VN_OPTIONS.garderPR ? REPONSES.prGarde : REPONSES.prFerme,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const lies: Message[] = [];
    if (arrive.comptoir) {
      lies.push({ ...ANICET, heure: "sem. 7", texte: REPONSES.comptoir });
    }
    if (arrive.test) {
      lies.push({
        ...ALBERTINE,
        heure: `sem. ${TEST.resultat}`,
        alerte: t.bronFerme,
        texte: t.bronFerme
          ? REPONSES.testFerme(taux(h.report, 0))
          : REPONSES.testGarde(taux(h.report, 0)),
      });
    }
    if (arrive.report) {
      lies.push({
        ...GAUVAIN,
        heure: "sem. 9",
        alerte: h.report < SEUIL_FERMETURE,
        texte: REPONSES.reportMesure(taux(h.report, 0)),
      });
    }
    if (arrive.local) {
      lies.push({
        ...ALBERTINE,
        heure: "sem. 10",
        alerte: t.localRepris,
        texte: t.localRepris ? REPONSES.localRepris : REPONSES.localLibre,
      });
    }
    if (arrive.talvere) {
      lies.push({
        ...GAUVAIN,
        heure: `sem. ${TALVERE.semaine}`,
        alerte: t.talvere,
        texte: t.talvere ? REPONSES.talvereOuvre : REPONSES.talvereRenonce,
      });
    }
    if (arrive.projet && t.final === "zac") {
      lies.push({
        ...ALDRIC,
        heure: `sem. ${PROJET.semaine}`,
        texte:
          chemin[D.terrain] === 2
            ? "La zone est votée : le lot du boulevard est parti. Je vous propose un terrain en second rang, pour une ouverture un an plus tard."
            : "La zone est votée : votre terrain du boulevard est prêt. L'agence de la zone peut se lancer au printemps.",
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.projet) {
      imprevus.push({
        ...METROPOLE,
        heure: `sem. ${PROJET.semaine}`,
        texte: t.projet ? REPONSES.projetVote : REPONSES.projetRepousse,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée par les décisions du trimestre : cinq ans de marge incrémentale du réseau, au taux du groupe, pour chaque position prise, moins les sommes engagées et perdues, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Marge incrémentale",
          valeur: `${kE(t.marge)}/an`,
          aide: "ce que vos positions ajoutent au réseau, chaque année",
          tenu: t.marge > 0,
        },
        {
          nom: "Talvère à Mions",
          valeur: t.talvere ? "installée" : "pas venue",
          aide: `${taux(t.chanceTalvere, 0)} de risque vu vos choix ; ${taux(CHANCE_TALVERE.aucun, 0)} sans site Arvel`,
          tenu: !t.talvere,
        },
        {
          nom: "Sommes engagées",
          valeur: kE(t.engage),
          aide: `sur ${kE(ENVELOPPE)} au plan de réseau`,
          tenu: t.engage <= ENVELOPPE,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La zone des Ormeaux",
          texte: t.projet
            ? "a été votée en semaine 12 : la croissance de Mions est là pour dix ans."
            : "a été repoussée en semaine 12 : rien avant deux ou trois ans.",
        },
        {
          titre: "Talvère",
          texte: `${t.talvere ? "s'est installée à Mions" : "a renoncé à Mions"} ; vu vos choix, elle avait ${taux(t.chanceTalvere, 0)} de chances d'y ouvrir (${taux(CHANCE_TALVERE.aucun, 0)} sans site Arvel).`,
        },
        {
          titre: "Les clients de Bron",
          texte: `${taux(t.report, 0)} de son chiffre ${t.bronFerme ? "a suivi" : "aurait suivi"} à Saint-Priest${
            t.localRepris ? ", moins ceux qu'a gardés le concurrent installé dans le local" : ""
          } ; il en fallait ${taux(SEUIL_FERMETURE, 0)} pour que la fermeture paie.`,
        },
        {
          titre: "Le point de retrait de Villeurbanne-Nord",
          texte: `${taux(t.partNouvelle, 0)} de son chiffre venait de clients nouveaux ; le reste, de clients déjà acquis à Villeurbanne et à Vaulx.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
