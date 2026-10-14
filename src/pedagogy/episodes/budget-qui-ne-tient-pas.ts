/**
 * ÉPISODE 4 — LE BUDGET QUI NE TIENT PAS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Samuel montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de lui.
 */
import {
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  POSTES,
  SEMAINES,
  evenements,
  hasard,
  ledCapitalise,
  reponseDuPrestataire,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/budget-qui-ne-tient-pas";
import {
  COUPES_AVEUGLES,
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REPONSES,
} from "@/config/episodes/budget-qui-ne-tient-pas";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const heures = (v: number) => `${nombre(v, 0)} h`;
/** Un écart au budget : positif, le service est resté en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget` : `${kE(-v)} au-delà du budget`;
const pluriel = (n: number, mot: string) => `${nombre(n, 0)} ${mot}${n >= 2 ? "s" : ""}`;
/** Les dépenses réalisées des trois premières semaines, en k€ : ce que la prévision vise. */
const realiseDebut = (t: Trimestre) =>
  [1, 2, 3].reduce((s, w) => s + t.semaines[w]!.realise, 0) / 1000;

const VALERIE = { de: "Valérie Kessler", role: "Directrice administrative et financière" } as const;
const TESSIER = { de: "Stéphane Morin", role: "Chargé d'affaires, Tessier Multiservices" } as const;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient l'engagé et le prix des pannes",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    engagements:
      "Votre diagnostic de la semaine 1 était juste : 40 k€ de commandes signées n'avaient pas encore de facture, et la projection ne les voyait pas.",
    energie:
      "En semaine 1, vous avez vu la dérive de l'énergie : une vraie cause, mais pas la plus grosse. 40 k€ de commandes signées n'avaient pas encore de facture.",
    partout:
      "En semaine 1, vous avez conclu que tous les postes dépensaient un peu trop ; la comparaison avec les autres régions les montrait normaux, et l'écart venait de trois postes précis.",
    maintenance:
      "En semaine 1, vous avez retenu le coût de la maintenance des chariots ; c'était la seule dépense qui en évitait d'autres.",
  };
  const justes = ["engagements", "energie"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 3, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 3, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 3, vous l'avez maintenu, alors que l'engagé non facturé s'affichait déjà.";
  }
  const diagnostic: Constat = {
    score: d === "engagements" ? 1 : d === "energie" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = COUPES_AVEUGLES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const coupes: Constat = {
    score: n === 0 ? 1 : n === 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu à la pression budgétaire par une coupe uniforme ou un gel : vous avez coupé poste par poste, en protégeant l'entretien."
        : `Face à la pression budgétaire, vous avez coupé partout ou gelé ${n} fois. Ce qui était économisé sur les factures revenait en pannes : ${pluriel(t.pannes, "panne")} sur le trimestre, ${heures(t.heuresArret)} d'arrêt.${
            t.niveleur ? " Le niveleur du quai 2 a lâché en semaine 8." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    realiseDebut(t),
    "de dépenses réalisées sur les semaines 1 à 3",
    "k€",
    { juste: 4, proche: 10 },
    (e) => `${nombre(e)} k€`,
  );

  const tot = p.chemin[D.reprevision] === 0;
  const cosmetique = p.chemin[D.cloture] === 0;
  const annonce = tot
    ? `Vous avez annoncé le dépassement complet dès la semaine 3, engagés compris${
        t.ledCapitalise
          ? " : le relamping est passé en investissement, 24 k€ de moins sur le budget."
          : ", mais le dossier du relamping est arrivé trop tard pour passer en investissement."
      }`
    : p.chemin[D.reprevision] === 2
      ? "En semaine 3, vous avez demandé une rallonge sans détail : la direction financière a répondu par 10 % de coupes partout, entretien compris."
      : `En semaine 3, vous avez ${
          p.chemin[D.reprevision] === 1
            ? "présenté la projection de l'outil, qui ignorait 40 k€ de commandes signées"
            : "confirmé un budget qui ne tenait pas"
        } ; la pré-clôture a découvert l'écart en semaine 10, et la direction financière a tout gelé en pleine saison.`;
  const domaine: Constat = {
    score: (tot ? 0.6 : 0) + (cosmetique ? 0 : 0.4),
    texte: `${annonce} ${
      cosmetique
        ? `En fin de trimestre, décaler les factures n'a rien changé : la comptabilité a passé ${kE(t.nonFacture)} de factures non parvenues.`
        : "Vous n'avez pas joué sur la date des factures : ce qui est réalisé est dû, facturé ou non."
    }`,
  };

  return [information, diagnostic, coupes, calibrage, domaine];
}

export function axe([information, diagnostic, coupes, calibrage, domaine]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder ce qui est déjà engagé",
      texte:
        "Rejouez l'épisode en rapprochant d'abord l'engagé et le facturé : 40 k€ de commandes signées manquaient à la projection, et c'est là que se jouait le trimestre.",
    };
  }
  if (coupes!.score === 0) {
    return {
      titre: "Couper poste par poste, pas partout",
      texte:
        "Une coupe uniforme ou un gel frappent d'abord l'entretien, la seule dépense qui en évite d'autres. Analysez chaque poste, protégez le préventif, et coupez ce qui ne casse rien.",
    };
  }
  if (domaine!.score < 0.5) {
    return {
      titre: "Prévenir tôt",
      texte:
        "Un dépassement annoncé en semaine 3 se discute ; découvert à la clôture, il se subit. Reprévoyez dès que l'engagé le montre, chiffres en main.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Lire l'engagé, pas seulement le facturé",
      texte:
        "Une facture arrive des semaines après la dépense. Pour savoir où va un budget, additionnez le facturé, ce qui est signé et ce qui est déjà consommé.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Notez vos prévisions chiffrées et comparez-les au réalisé : c'est le moyen le plus rapide d'affiner votre jugement.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_BUDGET: Episode<Trimestre> = {
  code: "budget-qui-ne-tient-pas",
  numero: 7,
  domaine: "Pilotage budgétaire",
  titre: "Le budget qui ne tient pas",
  resume:
    "Un budget de fonctionnement qui dérape dès la première semaine. Lire l'engagé avant de couper, et protéger ce qui évite les pannes.",
  persona:
    "Vous êtes Samuel Ortega, responsable des services généraux et de la maintenance des sites d'Arvel Distribution en région lyonnaise : le dépôt de Corbas et quatre agences. Votre équipe : deux techniciens, une assistante, et une dizaine de prestataires.",
  mandat: [
    { fort: kE(BUDGET), texte: "de budget de fonctionnement pour le trimestre" },
    { fort: kE(POSTES.energie * SEMAINES), texte: "d'énergie, le premier poste" },
    {
      fort: kE(POSTES.preventif * SEMAINES),
      texte: "d'entretien préventif des chariots et des quais",
    },
    { fort: kE(POSTES.travaux), texte: "de petits travaux sur les cinq sites" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget de fonctionnement, en comptant ce que coûtent les pannes et les heures d'arrêt des quais.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre budget",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les sites commandent sans attendre votre réponse.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Aurélie Cosson",
        role: "Cheffe d'agence, Vénissieux",
        alerte: true,
        texte: `Sans nouvelles de toi, j'ai commandé le mobilier du bureau d'accueil : ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "les dépenses réalisées des semaines 1 à 3, facturées ou non, en k€",
    unite: "k€",
    placeholder: "56",
    min: 0,
    max: 200,
    step: 1,
    reel: realiseDebut,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "facture",
      nom: "Dépenses facturées",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.facture ?? 0) / BUDGET),
              enRetard: (l.facture ?? 0) > l.budgetADate,
            }
          : null,
    },
    {
      cle: "engage",
      nom: "Engagé non facturé",
      format: kE,
      sensBon: -1,
      aide: () => "commandes signées, consommations et prestations sans facture",
    },
    {
      cle: "projection",
      nom: "Projection de la DAF",
      format: kE,
      sensBon: 1,
      aide: () => "écart au budget en fin de trimestre, sur les factures reçues",
    },
    {
      cle: "arrets",
      nom: "Heures d'arrêt",
      format: heures,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `chariots et quais ; ${pluriel(l.pannes ?? 0, "panne")} depuis janvier`
          : "chariots et quais, depuis janvier",
    },
    {
      cle: "energie",
      nom: "Énergie de la semaine",
      format: euros,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `budget : ${euros(POSTES.energie)} par semaine`
          : `en décembre ; budget : ${euros(POSTES.energie)} par semaine`,
    },
  ],
  contexte(l, decisions) {
    return {
      facture: kE(l.facture ?? 0),
      engage: kE(l.engage ?? 0),
      projection: ecartAuBudget(l.projection ?? 0),
      arrets: heures(l.arrets ?? 0),
      pannes: pluriel(l.pannes ?? 0, "panne"),
      factureEnergie: euros(l.factureEnergie ?? 0),
      facturePrestataire: euros(l.facturePrestataire ?? 0),
      analyse: decisions[D.economies] === 2,
      preventifEspace: decisions[D.economies] === 0 || decisions[D.reprevision] === 2,
      toutGele:
        decisions[D.economies] === 1 ||
        decisions[D.reprevision] === 1 ||
        decisions[D.reprevision] === 3,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      ["Réalisé de la période", kE(semaines.reduce((x, w) => x + w.realise, 0))],
      [`Facturé, sem. ${a}`, kE(t.semaines[a]!.facture)],
      ["Heures d'arrêt", heures(semaines.reduce((x, w) => x + w.heures, 0))],
    ];
  },
  courbe: {
    titre: "Ce que coûte chaque semaine, arrêts compris",
    cle: "depense",
    cible: BUDGET / SEMAINES,
    libelleCible: `budget : ${kE(BUDGET / SEMAINES)} par semaine`,
    graduations: [10000, 20000, 40000],
    format: kE,
    details: (s) => [
      `${kE(s.depense!)} · dont ${kE(s.depense! - s.realise!)} d'arrêts`,
      `${pluriel(s.pannes!, "panne")} · énergie ${euros(s.energie!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.prestataire && choix === 0) {
      const reponse = reponseDuPrestataire(graine);
      return [
        {
          ...TESSIER,
          alerte: reponse === "braque",
          texte:
            reponse === "accepte"
              ? REPONSES.prestataireAccepte
              : reponse === "partiel"
                ? REPONSES.prestatairePartiel
                : REPONSES.prestataireBraque,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.reponseDaf) {
      const oui = ledCapitalise(chemin, graine);
      lies.push({
        ...VALERIE,
        heure: "sem. 5",
        alerte: !oui,
        texte: oui ? REPONSES.ledCapitalise : REPONSES.ledRefuse,
      });
    }
    if (arrive.niveleur) {
      lies.push({
        de: "Bruno Ferrat",
        role: "Chef du dépôt de Corbas",
        heure: "sem. 8",
        alerte: true,
        texte: REPONSES.niveleur,
      });
    }
    if (arrive.surprise) {
      lies.push({ ...VALERIE, heure: "sem. 10", alerte: true, texte: REPONSES.surprise });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `${ecartAuBudget(t.objectif)}, arrêts compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de fonctionnement, dépenses réalisées et heures d'arrêt comprises, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Budget de fonctionnement",
          valeur: kE(BUDGET - t.depenses),
          aide: "écart au budget, hors arrêts ; facturé ou non",
          tenu: t.depenses <= BUDGET,
        },
        {
          nom: "Pannes et arrêts",
          valeur: heures(t.heuresArret),
          aide: `${pluriel(t.pannes, "panne")}, ${kE(t.coutArrets)} d'arrêts`,
          tenu: t.heuresArret <= 80,
        },
        {
          nom: "Énergie",
          valeur: euros(t.energieFin),
          aide: `par semaine en fin de trimestre ; budget ${euros(POSTES.energie)}`,
          tenu: t.energieFin <= POSTES.energie * 1.03,
        },
        {
          nom: "Reprévision",
          valeur:
            t.annonce === "tot"
              ? "semaine 3"
              : t.annonce === "rallonge"
                ? "rallonge refusée"
                : "semaine 10",
          aide:
            t.annonce === "surprise"
              ? "découverte à la pré-clôture"
              : "le dépassement annoncé à la direction financière",
          tenu: t.annonce === "tot",
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.annonce === "tot"
          ? [
              {
                titre: "La direction financière",
                texte: t.ledCapitalise
                  ? "a accepté de passer le relamping en investissement."
                  : "a refusé de passer le relamping en investissement : le dossier est arrivé trop tard.",
              },
            ]
          : []),
        ...(t.prestataire
          ? [
              {
                titre: "Tessier Multiservices",
                texte:
                  t.prestataire === "accepte"
                    ? `a reconnu le trop-perçu et adressé un avoir de ${euros(t.avoir)}.`
                    : t.prestataire === "partiel"
                      ? "a corrigé ses factures pour la suite, sans avoir sur le passé."
                      : "s'est braqué et n'est plus intervenu hors contrat jusqu'à la clôture.",
              },
            ]
          : []),
        {
          titre: "Le parc",
          texte: `${pluriel(t.pannes, "panne")}, ${heures(t.heuresArret)} d'arrêt${
            t.niveleur ? ", dont le niveleur du quai 2 en semaine 8" : ""
          }. À la clôture, ${kE(t.nonFacture)} de dépenses réalisées n'avaient pas encore de facture.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
