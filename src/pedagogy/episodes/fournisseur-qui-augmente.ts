/**
 * ÉPISODE 6 — LE FOURNISSEUR QUI AUGMENTE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Élodie montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent d'elle.
 */
import {
  ARRET,
  BUDGET,
  D,
  HAUSSE_ANNONCEE,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_CONFORMES,
  PERTE_PAR_JOUR,
  SEMAINES,
  concurrentTient,
  evenements,
  hasard,
  placovaBloque,
  prixCompromis,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/fournisseur-qui-augmente";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/fournisseur-qui-augmente";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Une hausse de prix d'achat, au-dessus de l'ancien tarif. */
const hausse = (v: number) => `${v < 0 ? "−" : "+"}${nombre(Math.abs(v) * 100)} %`;
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Un écart au budget de marge : positif, la famille fait mieux que le budget. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

/** Brévent a-t-il assez livré, avant l'arrêt de Placova, pour avoir calé ses tournées ? */
const breventRode = (decisions: readonly number[]) =>
  decisions[D.annonce] === 1 ||
  decisions[D.annonce] === 2 ||
  [0, 1, 3].includes(decisions[D.repartition] ?? NEUTRE[D.repartition]);

/** Ce que les décisions révèlent, dans l'ordre où un acheteur les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient de quoi était faite la hausse et ce que valait l'alternative",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    levier:
      "Votre diagnostic de la semaine 1 était juste : la hausse se décomposait, et seule une solution de repli visible permettait d'en discuter.",
    couts:
      "En semaine 1, vous avez vu des coûts qui montaient vraiment : une partie de la vérité. Le gaz, qui en faisait plus de la moitié, baissait déjà, et deux points ne correspondaient à rien.",
    abus: "En semaine 1, vous avez vu un fournisseur qui abusait. La hausse était en partie fondée, et le remplaçant ne pouvait pas livrer plus d'un tiers des volumes.",
    prix: "En semaine 1, vous avez retenu des prix de vente trop bas ; la plaque standard se comparait au centime, et c'est l'achat qu'il fallait négocier.",
  };
  const justes = ["levier", "couts"];
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
    score: d === "levier" ? 1 : d === "couts" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé pour ne pas fâcher, ni tout basculé d'un coup : vous avez négocié avec une alternative en main."
        : `Vous avez cédé pour ne pas fâcher, ou tout basculé d'un coup, ${n} fois sur ${ETAPES.length} décisions. Céder laissait la hausse entière ; basculer remplaçait un prix élevé par des retards plus chers encore.${
            t.valletPart ? " Constructions Vallet est parti chez Ferrat en semaine 9." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[6]!.hausse * 100,
    "de hausse du prix d'achat des plaques en semaine 6",
    "%",
    { juste: 1, proche: 2.5 },
    (e) => `${nombre(e)} point${e >= 2 ? "s" : ""}`,
  );

  const essai = p.chemin[D.annonce] === 1;
  const partage = p.chemin[D.repartition] === 0 || p.chemin[D.repartition] === 3;
  const repli = (essai ? 1 : 0) + (partage ? 1 : 0);
  const fournisseurs: Constat = {
    score: repli === 2 ? 1 : repli === 1 ? 0.6 : 0,
    texte: `${
      essai
        ? "Vous avez qualifié Brévent par un essai avant de négocier : Placova voyait l'alternative."
        : p.chemin[D.annonce] === 2
          ? "Vous avez basculé chez Brévent sans essai : l'alternative existait, mais elle coûtait ses retards."
          : "Vous avez négocié sans alternative visible : Placova n'avait pas de raison de céder."
    } ${
      partage
        ? "Vous avez ensuite confié à Brévent une part qu'il pouvait tenir, et gardé Placova pour le reste."
        : p.chemin[D.repartition] === 1
          ? `Vous lui avez ensuite confié tout le volume, au-delà de ce qu'il pouvait livrer : ${taux(t.conformesMoyen, 0)} de livraisons conformes sur le trimestre.`
          : "Vous êtes ensuite restée à un seul fournisseur, sans solution de repli pour la suite."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, fournisseurs];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  fournisseurs,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder de quoi est faite la hausse",
      texte:
        "Rejouez l'épisode en reconstituant d'abord le coût de revient d'une plaque, puis en appelant Brévent : sept des douze points tenaient au gaz, qui baissait, et une alternative existait pour un tiers des volumes.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni céder, ni tout basculer",
      texte:
        "Accepter pour ne pas fâcher laisse la hausse entière ; tout passer chez le moins cher remplace un prix par des retards. Entre les deux, il y a la négociation : décomposer, qualifier un second fournisseur sur une partie du volume, indexer.",
    };
  }
  if (fournisseurs!.score === 0) {
    return {
      titre: "Se donner une solution de repli",
      texte:
        "Un fournisseur ne concède que ce que votre alternative lui coûterait. Qualifiez un second fournisseur sur une part qu'il sait tenir avant de négocier, pas après.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Décomposer avant de répondre",
      texte:
        "Une hausse se discute ligne par ligne : ce qui suit un indice, ce qui tient aux matières, ce qui ne tient à rien. Chaque ligne appelle une réponse différente.",
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
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const PLACOVA = { de: "Bertrand Lemoine", role: "Directeur commercial, Placova" } as const;
const AGENCE = { de: "Julien Morel", role: "Chef d'agence, Vénissieux" } as const;

export const EPISODE_ACHATS: Episode<Trimestre> = {
  code: "fournisseur-qui-augmente",
  numero: 8,
  domaine: "Achats et négociation",
  titre: "Le fournisseur qui augmente",
  resume:
    "Le fournisseur principal annonce +12 %, les agences refusent d'augmenter. Décomposer la hausse et se donner une alternative avant de négocier.",
  persona:
    "Vous êtes Élodie Marchal, responsable des achats de la famille plâtrerie-isolation d'Arvel Distribution, à Saint-Priest : plaques de plâtre, doublages, isolants et accessoires pour les plaquistes de la région lyonnaise. Placova fournit 70 % de vos achats.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge sur le trimestre, budget révisé" },
    { fort: "95 %", texte: "de livraisons conformes et à l'heure" },
    { fort: "100", texte: "de volumes vendus : garder les plaquistes" },
    { fort: "+12 %", texte: "annoncés par Placova, à discuter" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge de la famille, en comptant ce que coûtent les livraisons non conformes, les dépannages et les ventes perdues.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre famille de produits",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les agences continuent de commander au nouveau tarif, sans consigne.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...AGENCE,
        alerte: true,
        texte: `Sans consigne, les agences ont commandé d'avance au nouveau tarif pour être tranquilles : ${euros(perdu)} de surcoût.`,
      };
    },
  },
  prevision: {
    libelle: "la hausse de votre prix d'achat moyen des plaques en semaine 6, en %",
    unite: "%",
    placeholder: "12",
    min: 0,
    max: 30,
    step: 0.5,
    reel: (t) => t.semaines[6]!.hausse * 100,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "hausse",
      nom: "Prix d'achat des plaques",
      format: hausse,
      formatEcart: points,
      sensBon: -1,
      aide: () => `au-dessus de l'ancien tarif ; annonce : ${hausse(HAUSSE_ANNONCEE)}`,
    },
    {
      cle: "marge",
      nom: "Marge de la famille",
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
      cle: "partBrevent",
      nom: "Part du second fournisseur",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: () => "Brévent ; sa capacité : un tiers des plaques",
    },
    {
      cle: "conformes",
      nom: "Livraisons conformes",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: () => `à l'heure et sans réserve ; objectif ${taux(OBJECTIF_CONFORMES, 0)}`,
    },
    {
      cle: "volumes",
      nom: "Volumes vendus",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine) =>
        semaine ? "100 = la moyenne du trimestre dernier" : "100 au trimestre dernier",
    },
  ],
  contexte(l, decisions) {
    return {
      hausse: hausse(l.hausse ?? 0),
      marge: kE(l.marge ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      conformes: taux(l.conformes ?? 0, 0),
      volumes: nombre(l.volumes ?? 0, 0),
      partBrevent: taux(l.partBrevent ?? 0, 0),
      reclamable: euros(Math.round((l.reclamable ?? 0) / 100) * 100),
      essai: decisions[D.annonce] === 1,
      bascule: decisions[D.annonce] === 2,
      signe: decisions[D.annonce] === 0,
      breventRode: breventRode(decisions),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.margeSemaine, 0);
    return [
      [`Prix d'achat, sem. ${a}`, hausse(t.semaines[a]!.hausse)],
      [`Volumes, sem. ${a}`, nombre(t.semaines[a]!.volumes, 0)],
      ["Marge de la période", kE(marge)],
    ];
  },
  courbe: {
    titre: "Marge de la famille, semaine par semaine",
    cle: "margeSemaine",
    cible: BUDGET / SEMAINES,
    libelleCible: `budget : ${kE(BUDGET / SEMAINES)} par semaine`,
    graduations: [10000, 20000, 30000, 40000],
    format: kE,
    details: (s) => [
      `marge ${kE(s.margeSemaine!)} · prix d'achat ${hausse(s.hausse!)}`,
      `livraisons conformes ${taux(s.conformes!, 0)} · volumes ${nombre(s.volumes!, 0)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.prixVente && choix <= 1) {
      // Le concurrent suit ou tient selon le hasard du trimestre, quoi qu'on ait décidé avant.
      const r = concurrentTient(graine) ? REPONSES.ferratTient : REPONSES.ferratSuit;
      return [{ ...AGENCE, texte: choix === 0 ? r.plein : r.partiel }];
    }
    if (etape === D.avoirs && choix === 3) {
      const bloque = placovaBloque([...NEUTRE.slice(0, D.avoirs), 3], graine);
      return [{ ...PLACOVA, alerte: bloque, texte: bloque ? REPONSES.bloque : REPONSES.accepte }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    const reponse: Record<string, string> = {
      compromis: REPONSES.compromis(taux(prixCompromis(chemin), 1)),
      indexe: REPONSES.indexe,
      refus: REPONSES.refus,
      cede: REPONSES.cede,
      rompu: REPONSES.rompu,
    };
    if (arrive.issue && reponse[arrive.issue]) {
      lies.push({
        ...PLACOVA,
        heure: "sem. 3",
        alerte: arrive.issue === "refus" || arrive.issue === "rompu",
        texte: reponse[arrive.issue]!,
      });
    }
    if (arrive.valletPart) {
      lies.push({
        de: "Patrick Vallet",
        role: "Gérant, Constructions Vallet",
        heure: "sem. 9",
        alerte: true,
        texte: REPONSES.vallet,
      });
    }
    if (de <= ARRET.de && a >= ARRET.de) {
      const s = simuler(chemin, graine).semaines[ARRET.de]!;
      lies.push({
        de: "Tableau de bord des achats",
        role: "Arrêt de Placova",
        heure: `sem. ${ARRET.de}`,
        alerte: s.conformes < 0.8,
        texte: `Pendant l'arrêt de Placova : ${taux(s.conformes, 0)} des plaques commandées livrées à l'heure et sans réserve ; volumes vendus : ${nombre(s.volumes, 0)}.`,
      });
    }
    if (arrive.remiseFinAnnee !== null) {
      lies.push({
        ...PLACOVA,
        heure: "sem. 13",
        alerte: arrive.remiseFinAnnee === 0,
        texte:
          arrive.remiseFinAnnee > 0
            ? `Comme convenu, la remise de fin d'année vous est versée : ${euros(arrive.remiseFinAnnee)}.`
            : "Brévent a eu plus de 10 % de vos plaques ce trimestre : la remise de fin d'année ne s'applique pas.",
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
    titre: (t) => `${kE(t.objectif)} de marge, ${ecartAuBudget(t.objectif - BUDGET)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge de la famille sur le trimestre, livraisons non conformes, dépannages et ventes perdues compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Marge de la famille",
          valeur: kE(t.objectif),
          aide: `budget révisé : ${kE(BUDGET)}`,
          tenu: t.objectif >= BUDGET,
        },
        {
          nom: "Prix d'achat des plaques",
          valeur: hausse(t.hausseMoyenne),
          aide: `en moyenne ; annonce : ${hausse(HAUSSE_ANNONCEE)}`,
          tenu: t.hausseMoyenne <= 0.09,
        },
        {
          nom: "Livraisons conformes",
          valeur: taux(t.conformesMoyen, 0),
          aide: `en moyenne ; objectif ${taux(OBJECTIF_CONFORMES, 0)}`,
          tenu: t.conformesMoyen >= OBJECTIF_CONFORMES,
        },
        {
          nom: "Volumes vendus",
          valeur: nombre(t.volumesMoyen, 0),
          aide: t.valletPart
            ? "Constructions Vallet est parti"
            : "en moyenne ; 100 = trimestre dernier",
          tenu: t.volumesMoyen >= 97 && !t.valletPart,
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
          titre: "Le gaz",
          texte: `a fini le trimestre à ${taux(t.gazFin, 0)} de son prix du jour de l'annonce.`,
        },
        {
          titre: "Les Comptoirs Ferrat",
          texte: t.concurrentTient
            ? "ont tenu leurs prix tout le trimestre."
            : "ont augmenté de 4 % en semaine 5.",
        },
        {
          titre: "Vos clients",
          texte: [
            t.valletPart
              ? "Constructions Vallet est parti chez Ferrat en semaine 9"
              : "Constructions Vallet est resté",
            t.placovaBloque
              ? "Placova a suspendu ses livraisons les deux dernières semaines"
              : null,
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
