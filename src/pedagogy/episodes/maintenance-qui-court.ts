/**
 * ÉPISODE 104 — LA MAINTENANCE QUI COURT APRÈS LES PANNES, tel que l'interface
 * et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de la maintenance de Loudéac
 * montre, ce que la courbe trace, ce sur quoi le bilan juge Klervi, et ce que
 * ses décisions révèlent d'elle.
 */
import {
  ATTENTE_ASTREINTE,
  D,
  DECEMBRE,
  DECEMBRE_DEPART,
  HEURE_PERDUE,
  JOURS_SANS_PERTE,
  NEUTRE,
  PART_NUIT,
  PERTE_PAR_JOUR,
  REPERE_SEMAINE,
  REVISION,
  SEMAINES,
  arriveeTechnicienNuit,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/maintenance-qui-court";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/maintenance-qui-court";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const heures = (v: number) => `${nombre(v)} h`;
/** L'objectif des arrêts pour panne : dix heures par mois, au plus. */
export const OBJECTIF_MOIS = 10;
export const OBJECTIF_SEMAINE = (OBJECTIF_MOIS * 12) / 52;
/** La part des heures de maintenance que la direction industrielle veut voir en préventif. */
export const OBJECTIF_PREVENTIF = 0.3;
/** Le pic de décembre est tenu quand son coût attendu a au moins diminué de moitié. */
export const PLAFOND_DECEMBRE = DECEMBRE_DEPART / 2;

const coutTotal = (t: Trimestre) => -t.objectif;
const pannesDuMois = (t: Trimestre) =>
  ((t.semaines.slice(10, 14) as Semaine[]).reduce((s, w) => s + w.arrets, 0) / 4) * (52 / 12);

const SULIVAN = {
  de: "Sulivan Daoudal",
  role: "Technicien de maintenance, référent de la ligne des desserts",
} as const;
const FIACRE = {
  de: "Fiacre Pichavant",
  role: "Chef d'équipe de nuit, ligne des desserts",
} as const;
const AZENOR = { de: "Azenor Rioual", role: "Conductrice de ligne, élue au CSE" } as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const MAEWENN = { de: "Maëwenn Postec", role: "Directrice des ressources humaines" } as const;

/** Les organes, dits comme dans l'atelier. */
const PANNE_LONGUE: Record<string, string> = {
  doseurs: "un joint de doseur d'un format qu'on n'avait pas en stock",
  scelleuse: "une sonde de la scelleuse, absente du magasin",
  verins: "un vérin du transfert, absent du magasin",
  autres: "le motoréducteur du convoyeur de sortie, absent du magasin",
};

/** Ce que les décisions révèlent, dans l'ordre où une responsable maintenance les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, l'historique des pannes et l'emploi du temps des techniciens",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    pareto:
      "Votre diagnostic de la semaine 1 était juste : trois familles d'organes faisaient 86 % des heures d'arrêt, et leurs gammes préventives étaient en retard parce que l'équipe passait 70 % de son temps à dépanner.",
    pieces:
      "En semaine 1, vous avez vu les pièces qui manquaient : une vraie cause des pannes longues, quatre en six mois. Mais l'essentiel des heures venait de pannes nombreuses et courtes, sur trois familles d'organes que plus personne n'entretenait.",
    nuit: "En semaine 1, vous avez retenu la nuit sans technicien ; l'attente de l'astreinte pesait à peine plus de 2 heures par mois sur 19. Ce qui comptait, c'était le nombre de pannes, pas la vitesse à les réparer.",
    vetuste:
      "En semaine 1, vous avez retenu une ligne usée de partout ; l'historique montrait au contraire que 23 de ses organes ne faisaient que 14 % des heures d'arrêt. Trois familles d'organes faisaient le reste.",
  };
  const justes = ["pareto", "pieces"];
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
    score: d === "pareto" ? 1 : d === "pieces" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu aux pannes en ajoutant des dépanneurs ni en repoussant l'entretien après le pic : vous avez cherché à en avoir moins."
        : `Vous avez répondu ${n} fois en ajoutant des dépanneurs ou en repoussant l'entretien après le pic. Un dépanneur de plus répare un peu plus vite les pannes qu'on n'a pas évitées ; un entretien repoussé les fait revenir au pire moment.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.mtbfScelleuse,
    "de MTBF de la scelleuse sur les six derniers mois",
    "h",
    { juste: 3, proche: 10 },
    (e) => `${nombre(e)} h`,
  );

  // Le passage au préventif : le plan, le premier niveau, les pièces, l'entretien gardé avant le pic.
  const plan = p.chemin[D.reponse] === 1;
  const premierNiveau = p.chemin[D.premierNiveau] === 0;
  const pieces = p.chemin[D.pieces] === 0 || p.chemin[D.pieces] === 1;
  const garde = p.chemin[D.pic] === 0 && p.chemin[D.decembre] === 0;
  const leviers = [plan, premierNiveau, pieces, garde].filter(Boolean).length;
  const preventif: Constat = {
    score: leviers === 4 ? 1 : leviers >= 2 ? 0.6 : 0,
    texte: `${
      plan
        ? "Vous avez mis les organes critiques en préventif, à partir de leur historique."
        : "Les organes critiques sont restés au curatif : on les a réparés quand ils tombaient."
    } ${
      premierNiveau
        ? "Vous avez confié aux conducteurs les gestes de premier niveau, écrits avec eux."
        : "Les conducteurs n'ont pas pris en main les gestes de premier niveau qu'ils voyaient pourtant avant tout le monde."
    } ${
      pieces
        ? "Les pièces critiques étaient au magasin."
        : "Les pièces critiques manquaient toujours au magasin."
    } ${
      garde
        ? "Et l'entretien a tenu jusqu'au pic, calé dans les NEP et dans le plan de production."
        : "Mais l'entretien n'a pas été protégé jusqu'au pic de décembre."
    }${t.lotsBloques.length ? ` ${t.lotsBloques.length > 1 ? `${t.lotsBloques.length} lots ont été bloqués` : "Un lot a été bloqué"} pour un fragment de joint.` : ""}`,
  };

  return [information, diagnostic, reflexe, calibrage, preventif];
}

export function axe([information, diagnostic, reflexe, calibrage, preventif]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Compter les pannes avant de les combattre",
      texte:
        "Rejouez l'épisode en extrayant d'abord l'historique des pannes : trois familles d'organes faisaient 86 % des heures d'arrêt, et la nuit sans technicien à peine plus de 2 heures par mois sur 19. Lesquelles, combien de fois, combien de temps : c'est ce qui dit où mettre l'équipe.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Avoir moins de pannes plutôt que les réparer plus vite",
      texte:
        "Un technicien de plus raccourcit les pannes qu'on n'a pas évitées ; repousser l'entretien les fait revenir au pic, quand une heure coûte 3 800 € et que la DLC interdit de produire d'avance. Le préventif sur les organes critiques coûte des heures planifiées, et en rend beaucoup plus.",
    };
  }
  if (preventif!.score === 0) {
    return {
      titre: "Sortir du curatif",
      texte:
        "Mettre en préventif les organes que l'historique désigne, confier aux conducteurs le nettoyage, l'inspection et le serrage, tenir les pièces critiques en stock, et caler l'entretien dans les NEP : ce sont ces leviers qui font baisser le nombre de pannes.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Regarder le nombre de pannes, pas seulement leur durée",
      texte:
        "Les pannes longues frappent les esprits ; les pannes courtes et nombreuses font les heures. Classer les organes par heures d'arrêt montre où le préventif rapporte le plus.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du MTBF",
      texte:
        "Le MTBF d'un organe, c'est son temps de bon fonctionnement divisé par son nombre de pannes : pour la scelleuse, 2 704 heures moins 41 heures d'arrêt, divisées par 38 pannes, soit 70 heures. Une panne tous les trois jours de production.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_MAINTENANCE: Episode<Trimestre> = {
  code: "maintenance-qui-court",
  numero: 104,
  domaine: "Passer du curatif au préventif",
  titre: "La maintenance qui court après les pannes",
  resume:
    "Une ligne de desserts qui perd dix-neuf heures par mois en pannes, une équipe de maintenance qui ne fait plus que dépanner, et un directeur qui veut un technicien de nuit avant le pic de décembre. Analyser les pannes, prévenir, et outiller.",
  persona:
    "Vous êtes Klervi Nédélec, responsable maintenance de l'usine de Loudéac de la Laiterie de Kerbrélan : douze techniciens pour les six lignes de conditionnement. La ligne de remplissage des desserts, crèmes desserts et riz au lait, 18 000 pots à l'heure, tourne en 3×8 ; elle perd dix-neuf heures par mois en pannes. Le trimestre va de septembre à novembre, avant le pic des desserts de décembre.",
  mandat: [
    { fort: `${OBJECTIF_MOIS} h`, texte: "d'arrêt pour panne par mois au plus, contre 19 cet été" },
    { fort: taux(OBJECTIF_PREVENTIF, 0), texte: "des heures de maintenance en préventif au moins" },
    { fort: "décembre", texte: "abordé avec une ligne capable de tenir le pic" },
    { fort: "aucune", texte: "intervention sans consignation, aucun fragment dans un pot" },
  ],
  jugement:
    "Le directeur industriel juge le trimestre sur ce que coûtent les pannes et la maintenance de la ligne des desserts de septembre à novembre (arrêts rattrapés ou perdus, pénalités, lots bloqués, dépenses de maintenance), plus le coût attendu du pic de décembre dans l'état où le parc l'aborde.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre ligne",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la ligne continue de tomber pendant que vous cherchez : des heures à rattraper le samedi.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...FIACRE,
        alerte: true,
        texte: `Pendant ce temps, deux pannes de plus la nuit, à attendre l'astreinte : ${euros(perdu)} d'heures à rattraper.`,
      };
    },
  },
  prevision: {
    libelle:
      "le temps moyen entre deux pannes (MTBF) de la scelleuse sur les six derniers mois, en heures",
    unite: "h",
    placeholder: "50",
    min: 0,
    max: 2000,
    step: 0.5,
    reel: (t) => t.mtbfScelleuse,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "arrets",
      nom: "Arrêts pour panne",
      format: heures,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `en semaine ${semaine} ; objectif : ${nombre(OBJECTIF_SEMAINE)} h par semaine`
          : "par semaine, en moyenne sur six mois",
    },
    {
      cle: "mtbf",
      nom: "MTBF de la ligne",
      format: (v) => `${nombre(v, 0)} h`,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "temps moyen entre deux pannes, sur les quatre dernières semaines"
          : "temps moyen entre deux pannes, sur six mois",
    },
    {
      cle: "preventif",
      nom: "Part du préventif",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () =>
        `des heures de l'équipe de maintenance ; objectif : ${taux(OBJECTIF_PREVENTIF, 0)}`,
    },
    {
      cle: "coutCumule",
      nom: "Pannes et maintenance",
      format: kE,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `depuis septembre ; au rythme de l'été : ${kE(REPERE_SEMAINE * semaine)}`
          : `${kE(REPERE_SEMAINE * SEMAINES)} par trimestre au rythme de l'été, tout rattrapé`,
      jauge: (l) =>
        l.repereADate
          ? {
              part: Math.min(1, (l.coutCumule ?? 0) / (REPERE_SEMAINE * SEMAINES)),
              enRetard: (l.coutCumule ?? 0) > l.repereADate,
            }
          : null,
    },
    {
      cle: "decembre",
      nom: "Le pic de décembre",
      format: kE,
      sensBon: -1,
      aide: () => "coût attendu des pannes si le pic commençait maintenant",
    },
  ],
  contexte(l, decisions) {
    const pannesDecembre = (l.taux ?? 0) * DECEMBRE.charge * DECEMBRE.semaines;
    return {
      arrets: heures(l.arrets ?? 0),
      pannes: nombre(l.pannes ?? 0, 0),
      mtbf: `${nombre(l.mtbf ?? 0, 0)} h`,
      preventif: taux(l.preventif ?? 0, 0),
      cout: kE(l.coutCumule ?? 0),
      coutDecembre: kE(l.decembre ?? 0),
      heuresDecembre: heures((l.decembre ?? 0) / HEURE_PERDUE),
      pannesDecembre: nombre(pannesDecembre, 0),
      nuitDecembre: heures(pannesDecembre * PART_NUIT * ATTENTE_ASTREINTE),
      plan: decisions[D.reponse] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [`Arrêts, sem. ${de} à ${a}`, heures(semaines.reduce((x, w) => x + w.arrets, 0))],
      [
        "Pannes",
        nombre(
          semaines.reduce((x, w) => x + w.pannes, 0),
          0,
        ),
      ],
      ["Coût de la période", kE(semaines.reduce((x, w) => x + w.cout, 0))],
    ];
  },
  courbe: {
    titre: "Arrêts pour panne, semaine par semaine",
    cle: "arrets",
    cible: OBJECTIF_SEMAINE,
    libelleCible: `objectif : ${OBJECTIF_MOIS} h par mois, ${nombre(OBJECTIF_SEMAINE)} h par semaine`,
    graduations: [2, 5, 10, 15, 20, 25, 30],
    format: (v) => `${nombre(v, 0)} h`,
    details: (s) => [
      `${heures(s.arrets!)} d'arrêt · ${nombre(s.pannes!, 0)} panne${s.pannes! > 1 ? "s" : ""}${
        s.longues ? ` · ${nombre(s.longues, 0)} faute de pièce` : ""
      }`,
      `MTBF ${nombre(s.mtbf!, 0)} h · préventif ${taux(s.preventif!, 0)} · décembre estimé ${kE(s.decembre!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.reponse && choix === 0) {
      // Le cabinet trouve vite, ou non : le marché des techniciens, pas la décision.
      const rapide = arriveeTechnicienNuit(graine) < 10;
      return [{ ...MAEWENN, texte: rapide ? REPONSES.candidatRapide : REPONSES.candidatLent }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    const dans = (w: number) => w >= de && w <= a;
    if (chemin[D.reponse] === 2 && dans(REVISION.semaine)) {
      lies.push({
        de: "Hartmut Vogler",
        role: "Technicien du service après-vente, Ostrévan Process",
        heure: `sem. ${REVISION.semaine}`,
        texte:
          "La révision générale est terminée : joints, sondes, vérins, roulements, tout a été remplacé ou contrôlé. Votre ligne repart comme après sa dernière grande révision.",
      });
    }
    if (arrive.accord !== null) {
      lies.push({
        ...AZENOR,
        heure: "sem. 5",
        texte: arrive.accord ? REPONSES.accord : REPONSES.refus,
      });
    }
    if (chemin[D.premierNiveau] === 0 && arrive.accord === null && dans(9)) {
      const t = simuler(chemin, graine);
      if (t.accord === false)
        lies.push({ ...AZENOR, heure: "sem. 9", texte: REPONSES.repriseApresRefus });
    }
    if (arrive.arriveeNuit !== null) {
      lies.push({
        ...MAEWENN,
        heure: `sem. ${arrive.arriveeNuit}`,
        texte: "Edern Kermarrec a pris lundi son poste de technicien de maintenance de nuit.",
      });
    }
    for (const p of arrive.longues) {
      lies.push({
        ...FIACRE,
        heure: `sem. ${p.semaine}`,
        alerte: true,
        texte: `Panne longue : ${PANNE_LONGUE[p.organe]}. ${heures(p.heures)} d'arrêt.`,
      });
    }
    for (const w of arrive.lotsBloques) {
      lies.push({
        ...ANNAIG,
        heure: `sem. ${w}`,
        alerte: true,
        texte:
          "Un joint de doseur s'est déchiré pendant le remplissage : un fragment a été retrouvé dans un pot au contrôle. Tout le poste de production est bloqué, trié puis détruit, et la ligne repart après une NEP renforcée. Aucun pot n'a quitté l'usine.",
      });
    }
    if (arrive.accident) {
      lies.push({
        ...SULIVAN,
        heure: `sem. ${arrive.semaineAccident}`,
        alerte: true,
        texte:
          "Un conducteur s'est blessé à la main en resserrant un doseur sans l'avoir consigné : accident du travail, trois semaines d'arrêt. La ligne a été arrêtée pour l'analyse, et les contrôles de premier niveau sont suspendus.",
      });
    }
    if (chemin[D.pic] === 2 && dans(SEMAINES)) {
      lies.push({
        de: "Ysée Bescond",
        role: "Responsable supply chain",
        heure: `sem. ${SEMAINES}`,
        texte:
          "Une partie des desserts produits d'avance n'aura plus les deux tiers de sa DLC à la livraison : déclassés ou donnés aux associations, 4 000 €.",
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
    titre: (t) =>
      `${kE(coutTotal(t))} de pannes et de maintenance, dont ${kE(t.coutDecembre)} attendus au pic de décembre`,
    formatObjectif: kE,
    noteDesBarres:
      "Coût des pannes et de la maintenance de la ligne des desserts de septembre à novembre, plus le coût attendu du pic de décembre dans l'état du parc fin novembre, compté en négatif, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const mois = pannesDuMois(t);
      const incidents = t.lotsBloques.length + (t.accident ? 1 : 0);
      return [
        {
          nom: "Arrêts pour panne",
          valeur: `${nombre(mois, 0)} h par mois`,
          aide: `en novembre, semaines 10 à 13 ; objectif ${OBJECTIF_MOIS} h`,
          tenu: mois <= OBJECTIF_MOIS,
        },
        {
          nom: "Le pic de décembre",
          valeur: kE(t.coutDecembre),
          aide: `coût attendu ; ${kE(DECEMBRE_DEPART)} dans l'état de l'été`,
          tenu: t.coutDecembre <= PLAFOND_DECEMBRE,
        },
        {
          nom: "Part du préventif",
          valeur: taux(t.preventifFinal, 0),
          aide: `en fin de trimestre ; objectif ${taux(OBJECTIF_PREVENTIF, 0)}`,
          tenu: t.preventifFinal >= OBJECTIF_PREVENTIF,
        },
        {
          nom: "Aliments et personnes",
          valeur:
            incidents === 0
              ? "aucun incident"
              : [
                  t.lotsBloques.length
                    ? `${t.lotsBloques.length} lot${t.lotsBloques.length > 1 ? "s" : ""} bloqué${t.lotsBloques.length > 1 ? "s" : ""}`
                    : null,
                  t.accident ? "un accident" : null,
                ]
                  .filter(Boolean)
                  .join(", "),
          aide: "fragments de joint, interventions sans consignation",
          tenu: incidents === 0,
        },
      ];
    },
    hasard(t, graine) {
      const longues = t.pannesLongues;
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        ...(t.arriveeNuit !== null
          ? [
              {
                titre: "Le recrutement",
                texte: `Le technicien de nuit a pris son poste en semaine ${t.arriveeNuit}.`,
              },
            ]
          : []),
        ...(t.accord !== null
          ? [
              {
                titre: "Les conducteurs",
                texte: t.accord
                  ? "Le CSE a accepté les standards de premier niveau du premier coup."
                  : "Le CSE a demandé à revoir les standards : les gestes de premier niveau n'ont commencé qu'en semaine 10.",
              },
            ]
          : []),
        {
          titre: "La ligne",
          texte: [
            `${t.pannesTotal} pannes et ${nombre(t.arretsTotal, 0)} heures d'arrêt sur le trimestre`,
            longues > 1
              ? `${longues} pannes ont attendu une pièce`
              : "une seule panne a attendu une pièce, celle de la semaine 2",
            t.lotsBloques.length
              ? `${t.lotsBloques.length > 1 ? `${t.lotsBloques.length} lots bloqués` : "un lot bloqué"} pour un fragment de joint`
              : "aucun fragment de joint dans un pot",
            t.accident ? "un conducteur blessé en intervenant sans consignation" : null,
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
