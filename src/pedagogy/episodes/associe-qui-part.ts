/**
 * ÉPISODE 77 — L'ASSOCIÉ QUI VEUT VENDRE SES PARTS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le suivi de l'opération montre à Gustave, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * La sortie d'un associé se juge sur des années, l'épisode sur un trimestre :
 * le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE pour les associés
 * restants, recalculée chaque semaine avec ce que le trimestre apprend. Elle
 * bouge quand on décide, et quand le trimestre révèle : le marché, Halden,
 * Lavaudière, la trésorerie, la signature, la réponse de chaque client.
 */
import {
  ASSOCIES,
  CHANCE_FRAIS_BAS,
  COMPTES,
  CONFLIT,
  D,
  EMPRUNT,
  HALDEN,
  JOURS_SANS_PERTE,
  LAVAUDIERE,
  LAVAUDIERE_GEL,
  MARCHES,
  NEUTRE,
  OBJECTIF_VALEUR,
  OFFRES,
  PERTE_PAR_JOUR,
  PERTE_SANS_RIEN,
  PRIX_DEMANDE,
  PRIX_DU_PACTE,
  SEMAINE_MARCHE,
  TRESORERIE,
  VALEUR_DES_COMPTES,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/associe-qui-part";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/associe-qui-part";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const points = (v: number) => `${nombre(v * 100, 0)} pts`;

const WILFRID = {
  de: "Wilfrid Vasselot",
  role: "Associé fondateur, Performance opérationnelle",
} as const;
const VICTOIRE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" } as const;
const MAHALIA = {
  de: "Mahalia Mardirossian",
  role: "Associée, Performance opérationnelle",
} as const;
const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const IRIS = { de: "Iris Guéhenneuc", role: "Avocate en droit des sociétés" } as const;
const THEOBALD = {
  de: "Théobald Guéguen",
  role: "Chargé d'affaires entreprises, Banque de l'Erdre",
} as const;
const OSWALD = {
  de: "Oswald Bertrandias",
  role: "Associé, Data et systèmes d'information",
} as const;

/** Le prix des parts selon le pacte, en k€ : ce que la prévision de la semaine 1 demande. */
export const PRIX_DU_PACTE_KE = PRIX_DU_PACTE / 1000;

/** Le nom d'un compte en début de phrase. */
const Nom = (i: number) => {
  const n = COMPTES[i]!.nom;
  return n.charAt(0).toUpperCase() + n.slice(1);
};
const liste = (noms: readonly string[]) =>
  noms.length <= 1 ? (noms[0] ?? "") : `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}`;

/** Ce que la revue a dit, en clair, à partir du masque des comptes qui tiennent à Wilfrid. */
export function conclusionsDeLaRevue(masque: number): string {
  const indices = COMPTES.map((_, i) => i);
  const lui = indices.filter((i) => masque & (2 ** i));
  const equipe = indices.filter((i) => !(masque & (2 ** i)));
  const nomLui = lui.map((i, k) => (k === 0 ? Nom(i) : COMPTES[i]!.nom));
  const nomEquipe = equipe.map((i, k) => (k === 0 ? Nom(i) : COMPTES[i]!.nom));
  if (!lui.length) {
    return "Aucun des trois comptes ne tient à la seule personne de Wilfrid : les décideurs connaissent l'équipe et nos managers.";
  }
  if (!equipe.length) {
    return "Les trois comptes tiennent à la personne de Wilfrid : leurs directeurs généraux ne connaissent que lui.";
  }
  return `${liste(nomLui)} ${lui.length > 1 ? "tiennent" : "tient"} à la personne de Wilfrid : le directeur général ne connaît que lui. ${liste(nomEquipe)} ${equipe.length > 1 ? "tiennent" : "tient"} à l'équipe : nos managers y ont leurs entrées.`;
}

/** Les intérêts d'un emprunt amortissable sur cinq ans au taux de la banque. */
export function interetsDeLEmprunt(montant: number): number {
  const r = EMPRUNT.taux;
  const annuite = (montant * r) / (1 - (1 + r) ** -EMPRUNT.duree);
  return annuite * EMPRUNT.duree - montant;
}

/** Ce que les décisions révèlent, dans l'ordre où un directeur financier les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de recalculer le prix du pacte",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    montage:
      "Votre diagnostic de la semaine 1 était juste : la valeur de ses parts tient pour beaucoup à des comptes qui peuvent partir avec lui ; le prix se calcule sur l'EBE retraité, et le risque se partage par le montage.",
    prix: "En semaine 1, vous avez vu que son prix reposait sur un multiple et un EBE flatteurs : c'est vrai, mais ramener le prix au pacte ne retient aucun de ses clients.",
    conflit:
      "En semaine 1, vous avez cru que le risque était le conflit entre associés ; acheter la paix ne retient pas les clients, et paie d'avance ce qui peut partir.",
    financement:
      "En semaine 1, vous avez pris la question pour un problème de financement ; le financement change la trésorerie, pas la valeur de ce que l'on achète.",
  };
  const justes = ["montage", "prix"];
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
    score: d === "montage" ? 1 : d === "prix" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez cédé à aucun des réflexes devant un associé qui part : ni lui accorder son prix pour avoir la paix, ni le braquer d'un refus sec, ni négliger ce qui retient ses clients, ni payer d'avance ce qui peut partir, ni vider la trésorerie pour éviter des intérêts, ni signer un complément devenu injuste."
        : `Vous avez choisi ${n} fois le réflexe qui soulage : lui accorder son prix pour avoir la paix ou le braquer d'un refus sec, négliger ce qui retient ses clients, payer d'avance ce qui peut partir, ne pas protéger les comptes pour ne pas le froisser, vider la trésorerie pour éviter des intérêts, signer tel quel un complément devenu injuste.${
            t.halden ? " Wilfrid a rejoint Halden Partners." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    PRIX_DU_PACTE_KE,
    "pour ses parts selon la méthode du pacte",
    "k€",
    { juste: 15, proche: 60 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const d3 = p.chemin[D.offre]!;
  const d4 = p.chemin[D.clauses]!;
  const d6 = p.chemin[D.signature]!;
  const gardes = t.partis.filter((x) => !x).length;
  const issue = t.conflit
    ? "Wilfrid a refusé de signer : l'expert du pacte fixera le prix, et les clauses négociées sont tombées."
    : `${gardes} de ses trois comptes ${gardes > 1 ? "sont restés" : gardes === 1 ? "est resté" : "sont restés"}.`;
  let texte: string;
  let score: number;
  if (d3 === 0) {
    score = 0;
    texte = `Vous avez payé son prix comptant : le cabinet a payé d'avance, et au-dessus du pacte, ce qui pouvait partir avec lui, et Wilfrid n'avait plus aucune raison de transmettre ses comptes. ${issue}`;
  } else if (d3 === 1) {
    score = d4 >= 1 ? 0.6 : 0;
    texte = `Vous avez payé le prix du pacte comptant : un prix juste, mais tout le risque de ses comptes est resté au cabinet${
      d4 >= 1 ? ", que seules les clauses limitaient" : ""
    }. ${issue}`;
  } else if (d6 === 1) {
    score = 1;
    texte = `Vous avez partagé le risque avec lui : une part du prix payée seulement si ses comptes restent, réécrite sur leur maintien quand le plan d'économies de Lavaudière rendait le seuil d'honoraires injuste. ${issue}`;
  } else {
    score = 0.6;
    texte = `Vous avez proposé un montage qui partageait le risque${
      d6 === 2
        ? ", puis vous l'avez défait en payant le complément d'avance"
        : ", mais vous avez gardé, ou repris, un complément qui privait Wilfrid de sa part de Lavaudière pour une raison qu'il ne maîtrisait pas"
    }. ${issue}`;
  }
  const montage: Constat = { score, texte };

  return [information, diagnostic, reflexe, calibrage, montage];
}

export function axe([information, diagnostic, reflexe, calibrage, montage]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Faire le calcul du pacte avant de répondre",
      texte:
        "Rejouez l'épisode en reprenant d'abord les comptes et le pacte : l'EBE publié flatte, l'EBE retraité donne la base, et c'est elle que Wilfrid a signée.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Sécuriser la valeur par le montage, pas par la paix",
      texte:
        "Payer son prix comptant n'achète pas ses clients, un refus sec les lui donne. Partez du pacte, puis faites dépendre une part du prix du maintien de ses comptes, protégez-les par des clauses proportionnées et une passation organisée.",
    };
  }
  if (montage!.score === 0) {
    return {
      titre: "Partager le risque avec le cédant",
      texte:
        "Quand une part de la valeur part avec le cédant, payez-la seulement si elle reste : un paiement étalé, un complément de prix indexé sur ce qu'il maîtrise, le maintien de ses comptes.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Voir ce qui part avec lui",
      texte:
        "La valeur d'un cabinet tient aux personnes et aux clients. Discuter le multiple ne suffit pas : demandez-vous ce que le cédant emporte, et comment le retenir.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du pacte",
      texte:
        "Retraitez l'EBE (rémunération normative des associés, éléments non récurrents), multipliez, retirez la dette nette, prenez 18 %, puis la décote de minorité. C'est là que se glissent les écarts.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

export const EPISODE_SORTIE_ASSOCIE: Episode<Trimestre> = {
  code: "associe-qui-part",
  numero: 77,
  domaine: "Valoriser un cabinet",
  titre: "L'associé qui veut vendre ses parts",
  resume:
    "Un associé fondateur veut céder ses 18 % comptant, à huit fois l'EBE, et ses trois grands clients pourraient le suivre. Calculer le prix du pacte, puis sécuriser par le montage ce qui peut partir avec lui.",
  persona:
    "Vous êtes Gustave Herbelin, directeur administratif et financier d'Atlas Conseil : 240 collaborateurs, cinq practices, 34 M€ de chiffre d'affaires, siège à Nantes. Wilfrid Vasselot, associé fondateur, veut vendre ses parts d'ici l'été. La présidente vous confie l'opération, de janvier à mars.",
  mandat: [
    { fort: "18 %", texte: "du capital à racheter, et trois grands comptes portés par le cédant" },
    { fort: kE(PRIX_DEMANDE), texte: "réclamés comptant, à huit fois l'EBE, sans décote" },
    { fort: kE(VALEUR_DES_COMPTES), texte: "de valeur dans ses trois comptes, pour le cabinet" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins pour les associés restants" },
  ],
  jugement:
    "La présidente juge le trimestre sur la valeur créée pour les associés restants, estimée en semaine 13 : ce qu'ils détiendront après l'opération, comptes perdus déduits, moins ce qu'ils détenaient le jour de l'annonce, le prix payé et les coûts.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "L'opération",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'avocate et l'expert-comptable préparent la réponse de jeudi dans l'urgence.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...IRIS,
        alerte: true,
        texte: `Pour tenir le rendez-vous de jeudi, mon cabinet a travaillé tout le week-end : ${kE(perdu)} d'honoraires en plus.`,
      };
    },
  },
  prevision: {
    libelle: "la valeur des parts de Wilfrid selon la méthode du pacte, en milliers d'euros",
    unite: "k€",
    placeholder: "2000",
    min: 0,
    max: 6000,
    step: 1,
    reel: () => PRIX_DU_PACTE_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur créée estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "pour les associés restants, avec ce que le trimestre a appris"
          : "le jour de l'annonce : la référence",
    },
    {
      cle: "prix",
      nom: "Prix attendu des parts",
      format: kE,
      sensBon: -1,
      aide: () => `pacte : ${kE(PRIX_DU_PACTE)} ; demandé : ${kE(PRIX_DEMANDE)}`,
    },
    {
      cle: "exposee",
      nom: "Valeur des comptes perdue ou exposée",
      format: kE,
      sensBon: -1,
      aide: () => `départs attendus ou constatés, sur ${kE(VALEUR_DES_COMPTES)}`,
      jauge: (l) => ({
        part: Math.min(1, (l.exposee ?? 0) / VALEUR_DES_COMPTES),
        enRetard: (l.exposee ?? 0) > PERTE_SANS_RIEN,
      }),
    },
    {
      cle: "pointBas",
      nom: "Point bas de trésorerie de l'été",
      format: kE,
      sensBon: 1,
      aide: () => `fin août, rachat compris ; seuil de sécurité : ${kE(TRESORERIE.seuil)}`,
    },
    {
      cle: "halden",
      nom: "Risque que Wilfrid rejoigne Halden",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: -1,
      aide: (semaine, l) =>
        l.haldenConnu ? "c'est fait : il l'a annoncé" : semaine ? "vu de cette semaine" : "",
    },
  ],
  contexte(l, decisions): Contexte {
    const d3 = decisions[D.offre] ?? NEUTRE[D.offre];
    const offre = OFFRES[d3]!;
    const pointBasSans = l.pointBasSans ?? TRESORERIE.pointBas;
    return {
      reponse: decisions[D.reponse] ?? NEUTRE[D.reponse],
      revue: decisions[D.revue] === 0 && l.attachements != null,
      question: decisions[D.revue] === 1,
      attachements: l.attachements != null ? conclusionsDeLaRevue(l.attachements) : "",
      complement: offre.complement !== null,
      complementLavaudière: offre.complement
        ? kE(COMPTES[LAVAUDIERE]!.complement[offre.complement])
        : "",
      comptant: kE(offre.comptant),
      interets: kE(interetsDeLEmprunt(offre.comptant)),
      pointBasSans: kE(pointBasSans),
      apres: kE(pointBasSans - offre.comptant),
      halden: l.haldenConnu === 1,
      valeur: kE(l.valeur ?? 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Prix attendu des parts, sem. ${a}`, kE(s.prix)],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [100000, 250000, 500000, 750000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `prix attendu ${kE(s.prix!)} · comptes exposés ${kE(s.exposee!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    const h = hasard(graine);
    if (etape === D.financement && choix === 1) {
      // La banque répond selon le hasard du trimestre : avec ou sans nantissement.
      return [
        {
          ...THEOBALD,
          texte: h.uBanque < CHANCE_FRAIS_BAS ? REPONSES.banqueSimple : REPONSES.banqueGaranties,
        },
      ];
    }
    if (etape === D.financement && choix === 2) {
      return h.uDefaut < ASSOCIES.chanceDefaut
        ? [{ ...OSWALD, texte: REPONSES.associeDefaillant }]
        : [{ ...VICTOIRE, texte: REPONSES.associesSuivent }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    const d1 = chemin[D.reponse];
    const d3 = chemin[D.offre]!;
    if (dans(5)) {
      // La réponse de Wilfrid à l'offre écrite.
      const texte =
        d1 === 0 && d3 !== 0
          ? "Tu m'avais dit oui à 2 988 k€ comptant, Gustave. Ce n'est pas ce que je lis. Je m'en souviendrai."
          : d3 === 0
            ? "Merci. Je n'en attendais pas moins de mes associés."
            : d3 === 1
              ? "Le pacte, comptant, décote comprise. Je l'ai signé, je sais. Je réfléchis."
              : d3 === 2
                ? "Si mes clients restent, j'ai mon prix, ou presque. C'est honnête. Je veux relire les conditions du complément."
                : "Plus de la moitié de mon prix suspendue à mes clients ? Vous ne me faites pas confiance.";
      lies.push({ ...WILFRID, heure: "sem. 5", alerte: d3 === 3 || (d1 === 0 && d3 !== 0), texte });
    }
    if (arrive.halden) {
      lies.push({
        ...VICTOIRE,
        heure: `sem. ${t.semaineHalden}`,
        alerte: true,
        texte:
          t.semaineHalden === HALDEN.semaine
            ? "Wilfrid me l'a dit ce matin : il rejoint Halden Partners à Nantes à la rentrée, avec une part variable sur les clients qu'il apportera. Il nous vend quand même ses parts."
            : "La signature qui glisse a eu raison de sa patience : Wilfrid rejoint Halden Partners à la rentrée. Il nous vend quand même ses parts.",
      });
    }
    if (arrive.pointBas) {
      const bas = t.pointBas;
      lies.push({
        ...PRUNE,
        heure: `sem. ${TRESORERIE.semaine}`,
        alerte: bas < TRESORERIE.seuil,
        texte:
          bas < TRESORERIE.seuil
            ? `Prévision de l'été recalculée, rachat compris : point bas à ${kE(bas)} fin août, sous le seuil de ${kE(TRESORERIE.seuil)}. Il faudra céder des créances en urgence.`
            : `Prévision de l'été recalculée, rachat compris : point bas à ${kE(bas)} fin août, au-dessus du seuil de ${kE(TRESORERIE.seuil)}.`,
      });
    }
    if (arrive.signature) {
      const aSigner = t.conflit
        ? "Je ne signe pas. Je saisis l'expert du pacte : il appliquera l'article 9, et je reprends ma liberté au bout de douze mois."
        : "Signé. Je tiendrai parole, et je passerai la main proprement.";
      lies.push({
        ...WILFRID,
        heure: `sem. ${CONFLIT.semaine}`,
        alerte: t.conflit,
        texte: aSigner,
      });
    }
    COMPTES.forEach((c, i) => {
      if (!arrive.comptes[i]) return;
      const parti = t.partis[i]!;
      lies.push({
        ...MAHALIA,
        heure: `sem. ${c.semaine}`,
        alerte: parti,
        texte: parti
          ? `Tournée de présentation chez ${c.nom} : ils suivront Wilfrid${t.halden ? " chez Halden" : ""}. Nous perdons le compte à l'été.`
          : `Tournée de présentation chez ${c.nom} : ils restent chez nous, et me confient le prochain comité de pilotage.`,
      });
    });
    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.marche) {
      const m = MARCHES.find((x) => x.id === h.marche)!;
      imprevus.push({
        ...MAHALIA,
        heure: `sem. ${SEMAINE_MARCHE}`,
        texte:
          m.id === "reprise"
            ? "Les budgets 2027 de nos industriels sont tombés : ils repartent, une dizaine de pour cent de plus sur la performance opérationnelle."
            : m.id === "stable"
              ? "Les budgets 2027 de nos industriels sont tombés : stables, à peu de chose près."
              : "Les budgets 2027 de nos industriels sont tombés : en repli d'une douzaine de pour cent sur la performance opérationnelle.",
      });
    }
    if (arrive.lavaudiere && dans(LAVAUDIERE_GEL.semaine)) {
      imprevus.push({
        ...PRUNE,
        heure: `sem. ${LAVAUDIERE_GEL.semaine}`,
        texte:
          "Lavaudière annonce un plan d'économies : 30 % de son budget de conseil gelé en 2027 et 2028, chez tous ses cabinets.",
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée pour les associés restants, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite pour les associés restants, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée pour les associés restants : ce qu'ils détiendront après l'opération, comptes perdus déduits, moins ce qu'ils détenaient le jour de l'annonce, le prix et les coûts, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const gardes = t.partis.filter((x) => !x).length;
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Payé d'avance",
          valeur: kE(t.comptant),
          aide: `à la signature ; prix attendu ${kE(t.prix)}, pacte ${kE(PRIX_DU_PACTE)}`,
          tenu: t.comptant < PRIX_DU_PACTE,
        },
        {
          nom: "Comptes gardés",
          valeur: `${gardes} sur 3`,
          aide: t.halden ? "Wilfrid a rejoint Halden" : "Herlinval, Lavaudière, le Brivet",
          tenu: gardes === 3,
        },
        {
          nom: "Trésorerie de l'été",
          valeur: kE(t.pointBas),
          aide: `point bas fin août ; seuil ${kE(TRESORERIE.seuil)}`,
          tenu: t.pointBas >= TRESORERIE.seuil,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const m = MARCHES.find((x) => x.id === h.marche)!;
      const lui = COMPTES.filter((_, i) => h.personnel[i]).map((c) => c.nom);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le marché",
          texte: `Les budgets 2027 des industriels ont été ${
            m.id === "reprise" ? "en reprise" : m.id === "stable" ? "stables" : "en repli"
          } : une chance sur ${m.id === "reprise" ? "trois" : m.id === "stable" ? "deux" : "quatre"} environ.`,
        },
        {
          titre: "Ses comptes",
          texte: `${
            lui.length
              ? `${lui.length > 1 ? "Tenaient" : "Tenait"} à sa personne : ${liste(lui)}.`
              : "Aucun ne tenait à sa seule personne."
          } ${
            t.partis.some(Boolean)
              ? `Sont partis : ${liste(COMPTES.filter((_, i) => t.partis[i]).map((c) => c.nom))}.`
              : "Aucun n'est parti."
          }`,
        },
        {
          titre: "Wilfrid",
          texte: t.halden
            ? `a rejoint Halden Partners${t.conflit ? ", et refusé de signer le protocole" : ""}.`
            : t.conflit
              ? "a refusé de signer le protocole et saisi l'expert du pacte."
              : "a signé le protocole, et n'a pas rejoint Halden.",
        },
        {
          titre: "La trésorerie",
          texte: `Point bas de l'été à ${kE(t.pointBas)}${
            t.defaut ? " ; un associé n'a pas pu suivre le rachat à titre personnel" : ""
          }.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
