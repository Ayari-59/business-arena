/**
 * ÉPISODE 39 — LOUER OU ACHETER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Salomé montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BUDGET,
  CONTRAT_SAISON,
  COUT_TOTAL_ACHAT_MP,
  D,
  JOURS_SANS_PERTE,
  MP,
  NEUTRE,
  PERTE_PAR_JOUR,
  SEUIL_JOURS_PAR_MOIS,
  contreAcceptee,
  evenements,
  hasard,
  secondLoueurDisponible,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/louer-ou-acheter";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/louer-ou-acheter";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un écart au budget de marge : positif, Arvel Location fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;
const machines = (n: number) => `${n} machine${n > 1 ? "s" : ""}`;

const ZOHRA = { de: "Zohra Kebaïli", role: "Gérante, Givors Matériel" } as const;
const MOURAD = { de: "Mourad Benarbia", role: "Directeur, Sorlin Terrassement" } as const;
const NILS = { de: "Nils Ferrando", role: "Chef d'atelier" } as const;

/** Ce que les décisions révèlent, dans l'ordre où une responsable de parc les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui donnaient le coût total de chaque formule et l'utilisation de chaque machine",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    utilisation:
      "Votre diagnostic de la semaine 1 était juste : une machine coûte un coût total, qui ne se justifie qu'au-delà de huit jours de location par mois environ. Le socle sûr se possède, la pointe se loue.",
    pannes:
      "En semaine 1, vous avez vu les pannes des anciennes : une vraie raison de renouveler, mais pas ce qui décidait combien de machines posséder, ni comment les financer.",
    tresorerie:
      "En semaine 1, vous avez retenu la trésorerie ; or la banque finançait l'achat à 100 %. La question n'était pas ce qui sort de la caisse, mais ce que chaque formule coûte en tout, sur la même durée.",
    tarifs:
      "En semaine 1, vous avez retenu les tarifs ; ils étaient dans la moyenne des loueurs. Ce qui pesait, c'était la manière d'avoir les machines, et combien.",
  };
  const justes = ["utilisation", "pannes"];
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
    score: d === "utilisation" ? 1 : d === "pannes" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const excedentaires = t.excedentairesMP + t.excedentairesNA;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais choisi sur la mensualité ou sur la trésorerie : ni acheter pour finir propriétaire, ni louer pour ne rien décaisser, ni réparer une machine parce qu'elle est amortie."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe du métier : acheter « parce qu'on finit propriétaire », louer « parce que ça ne sort pas de trésorerie », ou réparer une machine « qui ne coûte plus rien ».${
            t.valeurDuParc > 0
              ? ` En fin de trimestre, ${machines(excedentaires)} sans emploi ont coûté ${kE(t.valeurDuParc)} de valeur du parc.`
              : t.pannesVieille
                ? " La vieille nacelle réparée est retombée en panne."
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    COUT_TOTAL_ACHAT_MP / 1000,
    "de coût total sur trois ans pour une mini-pelle achetée à crédit, valeur de revente déduite",
    "k€",
    { juste: 1, proche: 3.5 },
    (e) => `${nombre(e, 1)} k€`,
  );

  // Les coûts figés sur une demande incertaine : la pointe des mini-pelles, un chantier sous réserve.
  const figes = [
    p.chemin[D.minipelles] === 0 || p.chemin[D.minipelles] === 2,
    p.chemin[D.ganivet] === 2,
    p.chemin[D.saison] === 1,
  ].filter(Boolean).length;
  const ganivet = [
    t.phase2Reportee
      ? "Pour Ganivet, vous avez acheté : le meilleur pari en moyenne, et le plus exposé à un report de la phase 2 — elle a été reportée."
      : "Pour Ganivet, vous avez acheté : le meilleur pari en moyenne, et le plus exposé à un report de la phase 2 ; cette fois, la phase 2 s'est faite.",
    "Pour Ganivet, vous avez loué au partenaire : un peu plus cher en moyenne, et à l'abri d'un report de la phase 2.",
    "Pour Ganivet, la location longue durée cumulait un loyer plus cher que l'achat et la rigidité d'un engagement de trois ans sur un chantier sous réserve.",
    "Vous avez décliné le chantier de Ganivet, et sa marge avec lui.",
  ][p.chemin[D.ganivet]!]!;
  const souplesse: Constat = {
    score: figes === 0 ? 1 : figes === 1 ? 0.6 : 0,
    texte: `${
      figes === 0
        ? "Vous n'avez engagé de coûts fixes que sur une demande sûre ou sur un pari chiffré ; la pointe est restée chez le partenaire, qui se rend."
        : `Vous avez engagé ${figes} fois des coûts fixes sur une demande incertaine : une machine achetée ou en LLD se paie qu'elle tourne ou non, et ne se rend pas.`
    } ${ganivet}`,
  };

  return [information, diagnostic, reflexe, calibrage, souplesse];
}

export function axe([information, diagnostic, reflexe, calibrage, souplesse]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer avant de signer",
      texte:
        "Rejouez l'épisode en lisant d'abord les offres ligne à ligne et le planning de l'an dernier : ils donnent le coût total de chaque formule et le nombre de jours où chaque machine tourne vraiment.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Comparer des coûts totaux, pas des mensualités",
      texte:
        "Une mensualité d'emprunt et un loyer ne se comparent pas : l'une vous laisse une machine à revendre, l'autre inclut l'entretien. Additionnez tout sur la même durée, valeur de revente déduite, et rapportez-le aux jours où la machine tournera.",
    };
  }
  if (souplesse!.score === 0) {
    return {
      titre: "Ne figer des coûts que sur une demande sûre",
      texte:
        "Une machine achetée ou en LLD se paie qu'elle tourne ou non ; une machine louée se rend. Possédez le socle sûr de la demande, louez la pointe, et regardez ce que chaque choix coûte dans le pire cas, pas seulement en moyenne.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Raisonner en taux d'utilisation",
      texte:
        "Avant de choisir comment financer une machine, demandez-vous combien de jours par mois elle tournera : en dessous de huit environ, la louer à la journée coûte moins que la posséder.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Notez vos calculs et comparez-les au résultat : prix, moins revente, plus intérêts, plus entretien. C'est le moyen le plus rapide de ne plus en oublier un terme.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_LOUER_ACHETER: Episode<Trimestre> = {
  code: "louer-ou-acheter",
  numero: 39,
  domaine: "Investissement et financement",
  titre: "Louer ou acheter",
  resume:
    "Un parc de location à renouveler avant la saison : acheter, crédit-bail, location longue durée ou location à la journée. Comparer des coûts totaux, pas des mensualités, et garder de la souplesse là où la demande est incertaine.",
  persona:
    "Vous êtes Salomé Cordier, responsable d'Arvel Location, l'activité de location de matériel d'Arvel Distribution, à Vénissieux. Vous louez aux artisans des mini-pelles, des nacelles, des échafaudages et des bétonnières, avec Nils Ferrando à l'atelier et Mélina Agostini au comptoir. Quand le parc ne suffit pas, vous sous-louez chez Sillon Location.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge au budget du trimestre, de janvier à mars" },
    { fort: "6 mini-pelles", texte: "dont 4 à renouveler avant la saison" },
    { fort: `${euros(MP.tarif)}`, texte: "la journée de mini-pelle facturée aux artisans" },
    { fort: "3 ans", texte: "l'horizon des investissements validés par le comité" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge d'Arvel Location, en écart à son budget, valeur du parc comprise : chaque machine y coûte son amortissement, ses intérêts ou ses loyers, et une machine sans emploi en fin de trimestre est ramenée à ce qu'elle vaut à la revente.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre activité de location",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des artisans qui voulaient réserver pour mars finissent par appeler un concurrent.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Mélina Agostini",
        role: "Responsable du comptoir",
        alerte: true,
        texte: `Pendant ce temps, faute de pouvoir confirmer leurs dates, des artisans ont réservé ailleurs : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle:
      "votre calcul du coût total sur trois ans d'une mini-pelle achetée à crédit, valeur de revente déduite, en milliers d'euros",
    unite: "k€",
    placeholder: "40",
    min: 0,
    max: 100,
    step: 0.1,
    reel: () => COUT_TOTAL_ACHAT_MP / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge à date",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.marge ?? 0) / BUDGET)),
              enRetard: (l.marge ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "utilisationMP",
      nom: "Utilisation des mini-pelles",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => "journées louées sur journées disponibles du parc",
    },
    {
      cle: "sousLocation",
      nom: "Sous-location à date",
      format: kE,
      sensBon: -1,
      aide: () => "payée à Sillon Location et aux autres loueurs",
    },
    {
      cle: "chargesParc",
      nom: "Coût du parc à date",
      format: kE,
      sensBon: -1,
      aide: () => "amortissements, intérêts, loyers et entretien",
    },
    {
      cle: "reparations",
      nom: "Pannes et réparations",
      format: kE,
      sensBon: -1,
      aide: (semaine) => (semaine ? `à date, fin de semaine ${semaine}` : "depuis janvier"),
    },
  ],
  contexte(l, decisions) {
    return {
      marge: kE(l.marge ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      utilisationMP: taux(l.utilisationMP ?? 0, 0),
      utilisationNA: taux(l.utilisationNA ?? 0, 0),
      reparations: kE(l.reparations ?? 0),
      partenaireMP: nombre(l.partenaireMP ?? 0, 0),
      flotteMP: nombre(l.flotteMP ?? 0, 0),
      grandParc: decisions[D.minipelles] === 0 || decisions[D.minipelles] === 2,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.marge, 0);
    const sous = semaines.reduce((x, w) => x + w.partenaireMP + w.partenaireNA, 0);
    return [
      ["Marge de la période", kE(marge)],
      [`Utilisation des mini-pelles, sem. ${a}`, taux(t.semaines[a]!.utilisationMP, 0)],
      ["Journées sous-louées", nombre(sous, 0)],
    ];
  },
  courbe: {
    titre: "Utilisation des mini-pelles, semaine par semaine",
    cle: "utilisationMP",
    cible: SEUIL_JOURS_PAR_MOIS / 21,
    libelleCible: "seuil : en dessous de 40 % environ, posséder coûte plus que louer",
    graduations: [0.25, 0.5, 0.75, 1],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${nombre(s.flotteMP!, 0)} mini-pelles au parc · ${nombre(s.demandeMP!, 0)} journées demandées, dont ${nombre(s.partenaireMP!, 0)} chez le partenaire`,
      `marge de la semaine ${kE(s.marge!)} · partenaire à ${euros(s.prixPartenaire!)} la journée`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.saison && choix === 3) {
      // Givors répond selon le hasard du trimestre : il lui reste des machines, ou non.
      return [
        {
          ...ZOHRA,
          texte: secondLoueurDisponible(graine) ? REPONSES.givorsOui : REPONSES.givorsNon,
        },
      ];
    }
    if (etape === D.cadre && choix === 1) {
      return [
        { ...MOURAD, texte: contreAcceptee(graine) ? REPONSES.sorlinOui : REPONSES.sorlinNon },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    for (const p of arrive.pannes) {
      lies.push({
        ...NILS,
        heure: `sem. ${p.semaine}`,
        alerte: true,
        texte:
          p.quoi === "ancienne"
            ? `Une des anciennes mini-pelles a lâché chez un client : ${euros(p.cout)} de réparation, et la machine à l'atelier.`
            : `La vieille nacelle est retombée en panne : ${euros(p.cout)}, et une semaine à l'atelier.`,
      });
    }
    if (arrive.clientParti) {
      lies.push({
        de: "Patxi Etcheverry",
        role: "Terrassier, client d'Arvel Location",
        heure: `sem. ${t.clientParti - 1}`,
        alerte: true,
        texte: REPONSES.client,
      });
    }
    if (arrive.report !== null) {
      lies.push({
        de: "Bérangère Maudet",
        role: "Conductrice de travaux, Ganivet Construction",
        heure: "sem. 9",
        alerte: arrive.report,
        texte: arrive.report ? REPONSES.report : REPONSES.phase2,
      });
    }
    if (arrive.minimum) {
      lies.push({
        de: "Joachim Daubigny",
        role: "Commercial, Sillon Location",
        heure: "sem. 13",
        texte: `Solde du contrat de saison : ${nombre(t.minimumNonPris, 0)} journées du minimum n'ont pas été prises, ${euros(t.minimumNonPris * CONTRAT_SAISON.prix)} facturés quand même.`,
      });
    }
    if (arrive.revue) {
      lies.push({
        de: "Lazare Brissac",
        role: "Directeur financier d'Arvel Distribution",
        heure: "sem. 13",
        alerte: true,
        texte: `Revue du parc de fin de trimestre : ${machines(t.excedentairesMP + t.excedentairesNA)} sans emploi, ramenées à leur valeur de revente ou à leur indemnité de restitution. ${kE(t.valeurDuParc)} en moins sur la marge.`,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.ralentissement) {
      imprevus.push({
        de: "Mélina Agostini",
        role: "Responsable du comptoir",
        heure: "sem. 11",
        texte: REPONSES.ralentissement,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `${ecartAuBudget(t.objectif)}, valeur du parc comprise`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de marge d'Arvel Location, valeur du parc comprise, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const excedentaires = t.excedentairesMP + t.excedentairesNA;
      return [
        {
          nom: "Marge du trimestre",
          valeur: kE(t.marge),
          aide: `budget ${kE(BUDGET)}, valeur du parc comprise`,
          tenu: t.objectif >= 0,
        },
        {
          nom: "Utilisation des mini-pelles",
          valeur: taux(t.utilisationMP, 0),
          aide: "en moyenne sur le trimestre ; objectif 60 %",
          tenu: t.utilisationMP >= 0.6,
        },
        {
          nom: "Valeur du parc",
          valeur: t.valeurDuParc ? `−${kE(t.valeurDuParc)}` : "intacte",
          aide: excedentaires
            ? `${machines(excedentaires)} sans emploi en fin de trimestre`
            : "toutes les machines ont un emploi",
          tenu: t.valeurDuParc === 0,
        },
        {
          nom: "Pannes",
          valeur: kE(t.reparations),
          aide: `${t.pannesAnciennes + t.pannesVieille} panne${t.pannesAnciennes + t.pannesVieille > 1 ? "s" : ""} sur le vieux matériel`,
          tenu: t.reparations <= 5000,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La saison",
          texte: `${
            t.ralentissement
              ? "Elle s'est retournée en semaine 11 : la demande de mini-pelles a chuté de moitié"
              : "Elle a tenu jusqu'à la fin mars"
          } ; en fin de trimestre, le marché de l'occasion était à ${taux(t.occasion, 0)} d'un marché normal.`,
        },
        {
          titre: "Les chantiers et le parc",
          texte: [
            t.phase2Reportee
              ? "Ganivet a reporté la phase 2 de son chantier"
              : "Ganivet a mené la phase 2 de son chantier",
            t.pannesAnciennes
              ? `les anciennes mini-pelles sont tombées ${t.pannesAnciennes} fois en panne`
              : null,
            t.clientParti ? "Patxi Etcheverry est parti chez un concurrent" : null,
            t.pannesVieille ? "la vieille nacelle a lâché de nouveau" : null,
          ]
            .filter(Boolean)
            .join(", ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
