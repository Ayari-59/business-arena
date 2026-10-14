/**
 * ÉPISODE 17 — LE PRIX QUI NE PASSE PLUS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Malik montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de lui.
 *
 * Le tableau de bord montre ce qu'un responsable des prix voit vraiment : le
 * taux de marge, les remises dérogatoires, les volumes du gros œuvre — la
 * famille qui se compare — et l'écart entre la hausse affichée au tarif et
 * celle qui est réellement encaissée.
 */
import {
  BUDGET,
  D,
  HAUSSES,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_TAUX,
  PERTE_PAR_JOUR,
  PLAFOND_REMISES,
  REMISES_AN_DERNIER,
  SEMAINES,
  evenements,
  hasard,
  primeAcceptee,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/prix-qui-ne-passe-plus";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/prix-qui-ne-passe-plus";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const pourcent = (v: number) => taux(v, 1);
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Une hausse de prix, avec son signe : « +2,4 % », « −0,3 % ». */
const hausse = (v: number) => `${v >= 0 ? "+" : "−"}${taux(Math.abs(v), 1)}`;
/** Un écart au budget de marge : positif, la région a fait mieux. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget de marge` : `${kE(-v)} sous le budget de marge`;
/** Ce que la hausse des coûts pèse sur le chiffre d'affaires : la hausse à encaisser pour la couvrir. */
const HAUSSE_A_COUVRIR = 0.042;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient qui compare les prix et où fuient les remises",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    bloc: "Votre diagnostic de la semaine 1 était juste : la marge fuyait par des remises accordées là où personne ne compare, et une hausse uniforme aurait fait partir ceux qui comparent.",
    couts:
      "En semaine 1, vous avez vu la hausse des coûts : une vraie cause, mais pas un mode d'emploi. Le gros œuvre, dont le coût avait le plus monté, était aussi la seule famille que les clients comparent au centime.",
    concurrence:
      "En semaine 1, vous avez retenu une concurrence qui casse les prix ; Altinéo augmentait lui aussi, et il était plus cher que vous sur la technique.",
    volume:
      "En semaine 1, vous avez retenu une baisse des volumes ; ils étaient stables. C'était la marge par vente qui fondait.",
  };
  const justes = ["bloc", "couts"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 3, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 3, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 3, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "bloc" ? 1 : d === "couts" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais appliqué le même chiffre à tout le monde, ni cédé de peur de perdre : vous avez cherché, à chaque fois, qui était vraiment sensible au prix."
        : `Sous la pression, vous avez appliqué le même chiffre à tous ou cédé de peur de perdre ${n} fois sur ${ETAPES.length} décisions. Ceux qui comparent sont partis, ceux qui ne comparent pas ont obtenu des remises qu'ils ne demandaient pas.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.tauxMarge * 100,
    "de taux de marge en semaine 3",
    "%",
    { juste: 1, proche: 2.5 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const differenciee = p.chemin[D.hausse] === 1;
  const encadree = p.chemin[D.derogations] === 1;
  const regles = (differenciee ? 1 : 0) + (encadree ? 1 : 0);
  const politique: Constat = {
    score: regles === 2 ? 1 : regles === 1 ? 0.6 : 0,
    texte: `${
      differenciee
        ? "Vous avez différencié la hausse selon ce que les clients comparent : le gros œuvre aligné sur Altinéo, la technique et les services au prix de ce qu'ils valent."
        : p.chemin[D.hausse] === 2
          ? "Vous n'avez rien augmenté : la hausse des coûts est restée dans la marge."
          : p.chemin[D.hausse] === 3
            ? "Vous avez répercuté le coût famille par famille : le plus fort sur le gros œuvre, le seul que les clients comparent."
            : "Vous avez passé la même hausse partout : trop sur le gros œuvre, pas assez sur la technique et les services."
    } ${
      encadree
        ? "Vous avez encadré les dérogations : les justifiées sont restées, les autres ont disparu."
        : p.chemin[D.derogations] === 0
          ? "Vous avez interdit toute dérogation : les clients qui avaient un vrai devis concurrent sont partis."
          : `Les dérogations sont restées sans règle ; elles finissent le trimestre à ${pourcent(t.remisesFinales)} du chiffre d'affaires.`
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, politique];
}

export function axe([information, diagnostic, reflexe, calibrage, politique]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder qui compare avant de fixer un prix",
      texte:
        "Rejouez l'épisode en reprenant d'abord la dernière hausse famille par famille et les remises des trois derniers mois : sept devis comparés sur dix portaient sur quarante références, et plus de la moitié des remises sur des produits que personne ne compare.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Différencier plutôt qu'appliquer un seul chiffre",
      texte:
        "Un même pourcentage pour tous fait partir ceux qui comparent et laisse de la marge chez ceux qui ne comparent pas ; céder de peur de perdre la donne à ceux qui ne partiraient pas. Cherchez, famille par famille et client par client, qui est vraiment sensible au prix.",
    };
  }
  if (politique!.score === 0) {
    return {
      titre: "Encadrer les remises, pas les laisser filer ni les interdire",
      texte:
        "Une hausse qui fuit par les dérogations n'est pas passée. Une grille de délégation, un motif et un devis au-delà d'un seuil gardent les remises justifiées et coupent les autres.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où la marge fuit",
      texte:
        "Quand la marge fond, regardez l'écart entre le prix affiché et le prix encaissé avant de toucher au tarif : une bonne part de la hausse se perd souvent en remises que personne n'a décidées.",
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

const FLORIAN = { de: "Florian Duchêne", role: "Commercial grands comptes" } as const;
const GARON = {
  de: "Benjamin Albertini",
  role: "Responsable achats, Garon Bâtiment",
} as const;
const DIRECTION = { de: "Régis Lachaux", role: "Directeur régional" } as const;

export const EPISODE_PRIX: Episode<Trimestre> = {
  code: "prix-qui-ne-passe-plus",
  numero: 4,
  domaine: "Politique tarifaire",
  titre: "Le prix qui ne passe plus",
  resume:
    "Des coûts en hausse de 6 %, des remises qui grimpent, une direction qui veut +6 % partout. Différencier la hausse selon qui compare, et tenir les remises.",
  persona:
    "Vous êtes Malik Ziani, responsable de la politique de prix d'Arvel Distribution pour la région lyonnaise. Vous construisez le tarif de cinq agences et les règles qui disent ce qu'un commercial peut accorder ; vingt-deux commerciaux, itinérants et comptoir, l'appliquent chaque jour.",
  mandat: [
    { fort: "+6 %", texte: "sur les coûts d'achat en deux mois" },
    { fort: "28 %", texte: "de taux de marge visé, contre 24,2 % aujourd'hui" },
    {
      fort: "3,4 %",
      texte: "du chiffre d'affaires en remises dérogatoires, contre 1,5 % il y a un an",
    },
    { fort: kE(BUDGET), texte: "de marge commerciale au budget du trimestre" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge commerciale de la région — remises, gestes aux clients et frais de vos actions déduits — en écart au budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre région",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le nouveau tarif part plus tard pendant que les remises continuent.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...DIRECTION,
        alerte: true,
        texte: `Pendant ce temps, l'ancien tarif a continué de partir et les commerciaux ont accordé leurs remises habituelles : ${euros(perdu)} de marge en moins.`,
      };
    },
  },
  prevision: {
    libelle: "le taux de marge commerciale en semaine 3, en %",
    unite: "%",
    placeholder: "24,2",
    min: 10,
    max: 40,
    step: 0.1,
    reel: (t) => t.semaines[3]!.tauxMarge * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "tauxMarge",
      nom: "Taux de marge commerciale",
      format: pourcent,
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `en semaine ${semaine} ; visé : 28 %` : "la semaine dernière ; visé : 28 %",
    },
    {
      cle: "remises",
      nom: "Remises dérogatoires",
      format: pourcent,
      formatEcart: points,
      sensBon: -1,
      aide: () => `part du chiffre d'affaires ; il y a un an : ${pourcent(REMISES_AN_DERNIER)}`,
    },
    {
      cle: "volumeBase",
      nom: "Volumes du gros œuvre",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: () => "rapportés à leur niveau d'avant la hausse",
    },
    {
      cle: "hausseNette",
      nom: "Hausse réellement encaissée",
      format: hausse,
      formatEcart: points,
      sensBon: 1,
      aide: (_, l) =>
        l.hausseAffichee
          ? `remises comprises ; affichée au tarif : ${hausse(l.hausseAffichee)}`
          : "remises comprises ; rien n'a encore changé au tarif",
    },
    {
      cle: "cumul",
      nom: "Marge à date",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} au budget du trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.max(0, Math.min(1, (l.cumul ?? 0) / BUDGET)),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    const d1 = decisions[D.hausse] ?? NEUTRE[D.hausse];
    return {
      taux: pourcent(l.tauxMarge ?? 0),
      remises: pourcent(l.remises ?? 0),
      volumeBase: taux(l.volumeBase ?? 0, 0),
      hausseNette: hausse(l.hausseNette ?? 0),
      hausseAffichee: hausse(l.hausseAffichee ?? 0),
      sansHausse: d1 === 2,
      baseHaute: HAUSSES[d1]!.base >= 0.05,
      encadre: decisions[D.derogations] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.marge, 0);
    return [
      [`Taux de marge, sem. ${a}`, pourcent(t.semaines[a]!.tauxMarge)],
      [`Remises dérogatoires, sem. ${a}`, pourcent(t.semaines[a]!.remises)],
      ["Marge de la période", kE(marge)],
    ];
  },
  courbe: {
    titre: "Marge commerciale, semaine par semaine",
    cle: "marge",
    cible: BUDGET / SEMAINES,
    libelleCible: `budget : ${kE(BUDGET / SEMAINES)} par semaine`,
    graduations: [30000, 40000, 50000, 60000],
    format: kE,
    details: (s) => [
      `marge ${kE(s.marge!)} · taux ${pourcent(s.tauxMarge!)}`,
      `remises ${pourcent(s.remises!)} · gros œuvre à ${taux(s.volumeBase!, 0)} de ses volumes`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.derogations && choix === 3) {
      // Seule la proposition compte : la direction répond selon le hasard du trimestre.
      const oui = primeAcceptee([...NEUTRE.slice(0, D.derogations), 3], graine);
      return [{ ...DIRECTION, texte: oui ? REPONSES.primeAcceptee : REPONSES.primeRefusee }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (chemin[D.derogations] === 0 && dans(5)) {
      lies.push({
        ...FLORIAN,
        heure: "sem. 5",
        alerte: true,
        texte:
          "Les deux clients qui avaient un devis d'Altinéo sont partis chez lui pour leurs chantiers d'été. Sans marge de manœuvre, je n'avais rien à leur opposer.",
      });
    }
    if (arrive.operation || arrive.pasDOperation) {
      lies.push({
        ...FLORIAN,
        heure: "sem. 9",
        alerte: arrive.operation,
        texte: arrive.operation ? REPONSES.operation : REPONSES.pasDOperation,
      });
    }
    if (arrive.garon === "accord" || (arrive.garon === "partiel" && chemin[D.garon] === 1)) {
      lies.push({
        ...GARON,
        heure: "sem. 10",
        alerte: arrive.garon === "partiel",
        texte: arrive.garon === "accord" ? REPONSES.garonAccord : REPONSES.garonPartielRendezVous,
      });
    }
    if (arrive.garon === "garde" || (arrive.garon === "partiel" && chemin[D.garon] === 2)) {
      lies.push({
        ...GARON,
        heure: "sem. 10",
        alerte: arrive.garon === "partiel",
        texte: arrive.garon === "garde" ? REPONSES.garonGarde : REPONSES.garonPartielRefus,
      });
    }
    if (arrive.garonPart) {
      lies.push({
        ...FLORIAN,
        heure: "sem. 11",
        texte:
          "Garon a passé ses premières commandes de gros œuvre chez Altinéo. Je garde la technique, pour l'instant.",
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, frais compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de marge commerciale de la région — remises, gestes aux clients et frais des actions déduits — sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Taux de marge",
          valeur: pourcent(t.tauxMoyen),
          aide: "en moyenne ; visé 28 %",
          tenu: t.tauxMoyen >= OBJECTIF_TAUX,
        },
        {
          nom: "Remises dérogatoires",
          valeur: pourcent(t.remisesFinales),
          aide: "en semaine 13 ; plafond 2 %",
          tenu: t.remisesFinales <= PLAFOND_REMISES,
        },
        {
          nom: "Volumes du gros œuvre",
          valeur: taux(t.volumeBaseMoyen, 0),
          aide: "de leur niveau d'avant ; au moins 95 %",
          tenu: t.volumeBaseMoyen >= 0.95,
        },
        {
          nom: "Hausse encaissée",
          valeur: hausse(t.hausseNetteMoyenne),
          aide: `en moyenne ; ${hausse(HAUSSE_A_COUVRIR)} couvrent les coûts`,
          tenu: t.hausseNetteMoyenne >= HAUSSE_A_COUVRIR,
        },
      ];
    },
    hasard(t, graine) {
      const garon: Record<Trimestre["garon"], string> = {
        accord: "a accepté le prix ferme sur le gros œuvre, contre plus de volume.",
        partiel: "a mis une bonne partie de ses achats en concurrence en semaine 11.",
        garde: "a protesté, puis est resté au tarif.",
        cede: "a obtenu ce qu'il demandait, et les autres grands comptes l'ont su.",
        remise: "a obtenu 6 % sur tout de son commercial.",
      };
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Altinéo",
          texte: t.operation
            ? "a lancé son opération sur le gros œuvre en semaine 9."
            : "n'a finalement rien lancé sur le gros œuvre.",
        },
        ...(t.primeProposee
          ? [
              {
                titre: "La direction",
                texte: t.primeAcceptee
                  ? "a accepté de calculer la prime des commerciaux sur la marge dès la semaine 9."
                  : "a refusé de toucher à la prime des commerciaux ce trimestre.",
              },
            ]
          : []),
        { titre: "Garon Bâtiment", texte: garon[t.garon] },
      ];
    },
  },
  comportements,
  axe,
};
