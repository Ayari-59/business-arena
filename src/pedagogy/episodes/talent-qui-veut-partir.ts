/**
 * ÉPISODE 23 — LE TALENT QUI VEUT PARTIR, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Grégoire montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * Deux contournements du contrat `Episode`, comme dans les épisodes 3 à 7 :
 * les réponses qui dépendent d'un choix antérieur (celle d'Héloïse à Valdane,
 * qui dépend aussi de l'entretien de la semaine 1 ; celle de Kofi) passent
 * par `evenements().lies`, et `lire` renvoie des clés non affichées (qui est
 * parti, si une augmentation s'est sue) qui nourrissent les messages et les
 * sources.
 */
import {
  BUDGET,
  D,
  ENGAGEMENT_DEPART,
  JOURS_SANS_PERTE,
  NEUTRE,
  NOMS,
  P,
  PERTE_PAR_JOUR,
  SEUIL_ENGAGEMENT,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  vendeurRapide,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/talent-qui-veut-partir";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/talent-qui-veut-partir";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const sur100 = (v: number) => `${nombre(v, 0)} / 100`;
const surQuatre = (v: number) => `${nombre(v, 0)} sur 4`;
/** Un écart au budget de marge : positif, la région a fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;
const ENGAGEMENT_INITIAL =
  (100 * (ENGAGEMENT_DEPART[0] + ENGAGEMENT_DEPART[1] + ENGAGEMENT_DEPART[2])) / 3;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui disaient ce qui manquait à chacun",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    besoins:
      "Votre diagnostic de la semaine 1 était juste : chacun avait sa raison de partir, et aucune n'était d'abord le salaire. Des perspectives pour Héloïse, une charge tenable pour Habib, de la reconnaissance pour Mathilde.",
    charge:
      "En semaine 1, vous avez vu une région en sous-effectif : c'était vrai pour Habib, pas pour les autres. Héloïse cherchait un avenir, Mathilde de la reconnaissance.",
    salaire:
      "En semaine 1, vous avez retenu le salaire ; les trois étaient payés dans la médiane du marché, et aucun n'en parlait en premier.",
    marche:
      "En semaine 1, vous avez retenu l'air du temps ; les statistiques de départs rassuraient, mais chacune de ces trois personnes avait une raison précise de partir, qu'on pouvait traiter.",
  };
  const justes = ["besoins", "charge"];
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
    score: d === "besoins" ? 1 : d === "charge" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const partis = t.demissions.filter((x) => x !== null).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu par l'argent seul, ni laissé partir sans rien tenter : vous avez cherché ce qui manquait à chacun, et construit à partir de là."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions de surenchérir sur le salaire, ou de laisser partir en vous disant que personne n'est irremplaçable. L'argent fait monter l'engagement quelques semaines, puis il redescend : la raison de partir est restée.${
            partis ? ` ${partis} de vos quatre personnes clés ont démissionné.` : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[2]!.engagement,
    "d'engagement moyen de vos trois chefs d'agence clés en semaine 2",
    "sur 100",
    { juste: 3, proche: 7 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const promesse = t.promis !== null;
  const derogations = t.augmentations;
  const ecarts = (promesse ? 1 : 0) + (derogations ? 1 : 0);
  const parole: Constat = {
    score: t.promesseRompue || ecarts === 2 ? 0 : ecarts === 1 ? 0.6 : 1,
    texte: `${
      promesse
        ? t.promesseRompue
          ? `Vous avez promis le poste régional à ${NOMS[t.promis!]}, qui ne dépendait pas de vous ; le comité l'a gelé, et votre parole avec.`
          : `Vous avez promis le poste régional à ${NOMS[t.promis!]}, qui ne dépendait pas de vous ; le comité l'a créé, cette fois.`
        : "Vous n'avez rien promis qui ne dépendait pas de vous."
    } ${
      derogations
        ? `Vous avez accordé ${derogations} augmentation${derogations > 1 ? "s" : ""} hors politique${
            t.fuite !== null
              ? `, et cela s'est su en semaine ${t.fuite} : ceux qui n'en avaient pas eu se sont sentis floués.`
              : " ; cette fois, cela ne s'est pas su."
          }`
        : "Vous êtes resté juste entre les personnes : aucune augmentation hors politique."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, parole];
}

export function axe([information, diagnostic, reflexe, calibrage, parole]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Écouter avant la démission",
      texte:
        "Rejouez l'épisode en relisant d'abord les entretiens annuels et en déjeunant avec Héloïse : chacun disait déjà ce qui lui manquait, et aucun ne parlait de salaire en premier.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Retenir autrement que par l'argent",
      texte:
        "Une augmentation de dernière minute retient parfois, rarement longtemps, et finit par se savoir. Cherchez ce qui manque à chacun — perspectives, charge, reconnaissance — et répondez à cela.",
    };
  }
  if (parole!.score === 0) {
    return {
      titre: "Ne promettre que ce qu'on peut tenir",
      texte:
        "Un poste qui dépend d'un comité ne se promet pas : il se prépare, avec des critères écrits et ouverts à tous. Et une règle salariale vaut pour tous, ou ne vaut pour personne.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui manque à chacun",
      texte:
        "Les statistiques de départs et les grilles de salaires rassurent ; elles ne disent pas pourquoi une personne précise s'en va. Posez-lui la question, avant qu'elle ait décidé.",
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
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const HELOISE = { de: "Héloïse Kervella", role: "Cheffe de l'agence de Vénissieux" } as const;
const HABIB = { de: "Habib Amrani", role: "Chef de l'agence de Givors" } as const;
const MATHILDE = { de: "Mathilde Guérin", role: "Cheffe de l'agence de Tassin" } as const;
const KOFI = { de: "Kofi Mensah", role: "Adjoint de l'agence de Vénissieux" } as const;
const HENRI = { de: "Henri Dumoulin", role: "Directeur général délégué" } as const;
const SIDONIE = { de: "Sidonie Brisset", role: "Ressources humaines, région" } as const;

export const EPISODE_TALENTS: Episode<Trimestre> = {
  code: "talent-qui-veut-partir",
  numero: 23,
  domaine: "Fidélisation des talents",
  titre: "Le talent qui veut partir",
  resume:
    "La meilleure cheffe d'agence est approchée par un concurrent, deux autres se lassent, et la politique salariale ne laisse presque rien. Retenir autrement que par l'argent.",
  persona:
    "Vous êtes Grégoire Chevalier, directeur commercial d'Arvel Distribution pour la région lyonnaise. Vous managez six chefs d'agence, dont trois sur qui repose une bonne part de la marge : Héloïse à Vénissieux, Habib à Givors, Mathilde à Tassin.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge nette des trois agences sur le trimestre" },
    { fort: "2,5 %", texte: "d'enveloppe d'augmentation ; au-delà, une dérogation" },
    { fort: "4 personnes clés", texte: "à garder : trois chefs d'agence et un adjoint" },
    { fort: `${nombre(SEUIL_ENGAGEMENT * 100, 0)} / 100`, texte: "d'engagement au moins" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge nette des trois agences en écart au budget, en comptant le coût des mesures et ce que coûtent les départs : recrutement, intégration du successeur, agence sans chef, clients qui suivent.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre région",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, Valdane avance ses pions chez les clients de Vénissieux.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...KOFI,
        alerte: true,
        texte: `Pendant ce temps, Valdane a démarché nos clients : deux entreprises de Vénissieux ont passé commande chez eux. ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "l'engagement moyen d'Héloïse, de Habib et de Mathilde en semaine 2, sur 100",
    unite: "/ 100",
    placeholder: "47",
    min: 0,
    max: 100,
    step: 1,
    reel: (t) => t.semaines[2]!.engagement,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "cumul",
      nom: "Marge nette des trois agences",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.cumul ?? 0) / BUDGET)),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "engagement",
      nom: "Engagement des chefs clés",
      format: sur100,
      formatEcart: (v) => `${nombre(v, 0)} pt`,
      sensBon: 1,
      aide: () => "baromètre du vendredi ; il y a un an : 61",
    },
    {
      cle: "risque",
      nom: "Risque de départ le plus élevé",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: -1,
      aide: (_semaine, l) => `${NOMS[l.qui ?? 0]}, d'ici six mois`,
    },
    {
      cle: "postes",
      nom: "Personnes clés en poste",
      format: surQuatre,
      formatEcart: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => "Héloïse, Habib, Mathilde et Kofi",
    },
    {
      cle: "depenses",
      nom: "Coût des mesures",
      format: kE,
      sensBon: -1,
      aide: () => "augmentations, primes, renforts, formations",
    },
  ],
  contexte(l, decisions) {
    const heloisePartie = (l.heloisePartie ?? 0) > 0;
    return {
      engagement: nombre(l.engagement ?? 0, 0),
      risque: taux(l.risque ?? 0, 0),
      qui: NOMS[l.qui ?? 0] ?? "",
      postes: nombre(l.postes ?? 4, 0),
      heloisePartie,
      heloiseTot: (l.heloiseTot ?? 0) > 0,
      fuite: (l.fuite ?? 0) > 0,
      ecoute: decisions[D.ecoute] === 1,
      promesse: !heloisePartie && decisions[D.offre] === 1,
      mission: !heloisePartie && decisions[D.offre] === 2,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.contribution, 0);
    const fin = t.semaines[a]!;
    return [
      [`Engagement, sem. ${a}`, sur100(fin.engagement)],
      [`Personnes clés, sem. ${a}`, surQuatre(fin.postes)],
      ["Marge nette de la période", kE(marge)],
    ];
  },
  courbe: {
    titre: "Engagement des chefs d'agence clés, semaine par semaine",
    cle: "engagement",
    cible: SEUIL_ENGAGEMENT * 100,
    libelleCible: `seuil de vigilance : ${nombre(SEUIL_ENGAGEMENT * 100, 0)} / 100`,
    graduations: [20, 40, 60, 80],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `engagement ${sur100(s.engagement!)} · ${surQuatre(s.postes!)} en poste`,
      `risque le plus élevé ${taux(s.risque!, 0)} · marge ${kE(s.marge!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.habib && choix === 1) {
      // Seul le recrutement compte : le cabinet trouve vite ou non, selon le hasard du trimestre.
      return [
        {
          de: "Cabinet de recrutement",
          role: "Recrutement des vendeurs",
          texte: vendeurRapide(graine) ? REPONSES.cabinetRapide : REPONSES.cabinetLent,
        },
        { ...HABIB, texte: REPONSES.reportingSupprime },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const offre = chemin[D.offre] ?? NEUTRE[D.offre];
    const lies: Message[] = [];
    if (arrive.heloise === "reste") {
      lies.push({ ...HELOISE, heure: "sem. 3", texte: REPONSES.heloiseReste[offre]! });
    }
    if (arrive.heloise === "part") {
      lies.push({
        ...HELOISE,
        heure: "sem. 3",
        alerte: true,
        texte: REPONSES.heloisePart[offre]!,
      });
    }
    if (arrive.fuite) {
      lies.push({ ...SIDONIE, heure: `sem. ${t.fuite}`, alerte: true, texte: REPONSES.fuite });
    }
    if (arrive.heloiseQuitte) {
      lies.push({
        ...SIDONIE,
        heure: "sem. 6",
        texte:
          "Héloïse Kervella a quitté l'agence de Vénissieux vendredi. Kofi assure l'intérim ; le cabinet a lancé la recherche d'un successeur.",
      });
    }
    if (arrive.renfort !== null && chemin[D.habib] === 1) {
      lies.push({
        ...HABIB,
        heure: `sem. ${arrive.renfort}`,
        texte:
          arrive.renfort === 7
            ? "Corentin a pris son poste lundi. Deux de ses anciens clients sont déjà passés au comptoir, et j'ai eu mon premier samedi depuis Pâques."
            : "Corentin est enfin arrivé. Il était temps.",
      });
    }
    if (arrive.comite !== null) {
      lies.push({
        ...HENRI,
        heure: "sem. 10",
        texte: arrive.comite ? REPONSES.posteCree : REPONSES.posteGele,
      });
    }
    if (arrive.promesseRompue) {
      const publique = chemin[D.poste] === 0;
      lies.push({
        ...(t.promis === P.heloise ? HELOISE : HABIB),
        heure: "sem. 10",
        alerte: true,
        texte: REPONSES.promesseRompue[publique ? 1 : 0],
      });
    }
    if (arrive.habibPart) {
      lies.push({ ...HABIB, heure: "sem. 10", alerte: true, texte: REPONSES.habibPart });
    }
    if (arrive.mathildePart) {
      lies.push({ ...MATHILDE, heure: "sem. 11", alerte: true, texte: REPONSES.mathildePart });
    }
    if (arrive.heloiseRepart) {
      lies.push({
        ...HELOISE,
        heure: "sem. 11",
        alerte: true,
        texte: REPONSES.heloiseRepart[offre === 0 ? 0 : t.promesseRompue ? 1 : 2],
      });
    }
    if (arrive.kofi !== null) {
      const choix = chemin[D.kofi] ?? NEUTRE[D.kofi];
      lies.push({
        ...KOFI,
        heure: "sem. 12",
        ...(arrive.kofi === "part" ? { alerte: true } : {}),
        texte: arrive.kofi === "part" ? REPONSES.kofiPart[choix]! : REPONSES.kofiReste[choix]!,
      });
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
    titre: (t) => `Marge nette ${ecartAuBudget(t.objectif)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge nette des trois agences en écart au budget, mesures et départs compris, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const heloise = t.demissions[P.heloise];
      return [
        {
          nom: "Héloïse",
          valeur: heloise === null ? "restée" : "partie",
          aide:
            heloise === null
              ? "votre meilleure cheffe d'agence"
              : `démission en semaine ${heloise}, chez Valdane`,
          tenu: heloise === null,
        },
        {
          nom: "Personnes clés",
          valeur: surQuatre(t.postesFinal),
          aide: "en poste en fin de trimestre",
          tenu: t.postesFinal === 4,
        },
        {
          nom: "Engagement des chefs clés",
          valeur: sur100(t.engagementFinal),
          aide: `en semaine 13 ; au départ ${nombre(ENGAGEMENT_INITIAL, 0)}`,
          tenu: t.engagementFinal >= SEUIL_ENGAGEMENT * 100,
        },
        {
          nom: "Équité salariale",
          valeur: t.augmentations
            ? `${t.augmentations} dérogation${t.augmentations > 1 ? "s" : ""}`
            : "aucune dérogation",
          aide: "augmentations hors politique",
          tenu: t.augmentations === 0,
        },
      ];
    },
    hasard(t, graine) {
      const partis = [
        t.heloisePartieTot
          ? "Héloïse est partie chez Valdane dès la semaine 3"
          : t.demissions[P.heloise] !== null
            ? "Héloïse est partie en semaine 11"
            : null,
        t.demissions[P.habib] !== null ? "Habib a démissionné en semaine 10" : null,
        t.demissions[P.mathilde] !== null ? "Mathilde a démissionné en semaine 11" : null,
        t.demissions[P.kofi] !== null ? "Kofi a rejoint Valdane en semaine 12" : null,
      ].filter(Boolean);
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le comité de direction",
          texte: t.posteCree
            ? "a créé le poste de responsable régional en semaine 10."
            : "a gelé le poste de responsable régional en semaine 10.",
        },
        ...(t.renfortGivors !== null && t.renfortGivors !== 5
          ? [
              {
                titre: "Le cabinet",
                texte:
                  t.renfortGivors === 7
                    ? "a trouvé un vendeur pour Givors dès la semaine 7."
                    : "n'a trouvé personne pour Givors avant la semaine 11.",
              },
            ]
          : []),
        ...(t.fuite !== null
          ? [
              {
                titre: "Les augmentations hors politique",
                texte: `se sont sues en semaine ${t.fuite}.`,
              },
            ]
          : []),
        {
          titre: "L'équipe",
          texte: (partis.length ? partis.join(", ") : "Personne n'est parti").concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
