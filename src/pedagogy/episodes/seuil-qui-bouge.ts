/**
 * ÉPISODE 34 — LE SEUIL QUI BOUGE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord du drive montre, ce que la courbe
 * trace, ce sur quoi le bilan juge Rachid, et ce que ses décisions révèlent
 * de lui.
 */
import {
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  LOYER,
  NEUTRE,
  PERTE_PAR_JOUR,
  PLAN,
  SEMAINES,
  SEUIL_DEPART,
  TAUX_MCV_DEPART,
  VOLUME_BUDGET,
  contreAcceptee,
  evenements,
  hasard,
  margeDUnRetraitBatir,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/seuil-qui-bouge";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/seuil-qui-bouge";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Des euros au centime près quand il y en a : « 2,50 € », « 8 € ». */
const eurosFins = (v: number) =>
  `${v.toLocaleString("fr-FR", {
    minimumFractionDigits: Number.isInteger(Math.round(v * 100) / 100) ? 0 : 2,
    maximumFractionDigits: 2,
  })} €`;
const retraits = (v: number) => nombre(v, 0);
/** Un écart au budget : positif, le drive fait mieux que son budget. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;
/** Le budget du trimestre, au dixième de k€ : « 31,5 k€ ». */
const BUDGET_TEXTE = `${nombre(BUDGET / 1000)} k€`;

const PERRINE = { de: "Perrine Gaudry", role: "Vendeuse au comptoir" } as const;
const BOGDAN = { de: "Bogdan Ilić", role: "Chef d'équipe préparation" } as const;
const INAYA = { de: "Inaya Fofana", role: "Contrôleuse de gestion régionale" } as const;
const ADAMA = { de: "Adama Sissoko", role: "Conducteur de travaux, Bâtir Nord-Isère" } as const;

/** Ce que coûte de plus un retrait de Bâtir, poste par poste, dit comme Inaya le dirait. */
function detailBatir(decisions: readonly number[]): string {
  const m = margeDUnRetraitBatir(decisions);
  const prep =
    m.prep === 0
      ? "rien de préparation tant que vos trois préparateurs en CDI ont du temps libre"
      : `${eurosFins(m.prep)} de préparation (${
          decisions[D.preparation] === 3
            ? "l'intérim au coup par coup"
            : "l'intérim en contrat-cadre"
        })`;
  const chariot =
    m.chariot === 0
      ? "rien de chariot : les deux sont à vous"
      : decisions[D.chariots] === 1
        ? `${eurosFins(m.chariot)} de second chariot loué aux heures de pointe`
        : `${eurosFins(m.chariot)} de chariot loué à l'heure`;
  const loyer =
    m.loyer === 0
      ? "rien de loyer : il est fixe"
      : `${eurosFins(m.loyer)} de loyer (${nombre(
          100 * (decisions[D.bail] === 1 ? LOYER.part : LOYER.variable),
        )} % du chiffre d'affaires)`;
  return `${prep}, ${chariot}, ${loyer}`;
}

/** Ce que les décisions révèlent, dans l'ordre où un directeur de site les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le compte du premier mois et l'histoire des autres drives",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    structure:
      "Votre diagnostic de la semaine 1 était juste : avec 13 % de marge de sécurité et une demande qui pouvait aussi baisser, chaque charge fixe ajoutée rapprochait le seuil du chiffre d'affaires.",
    volume:
      "En semaine 1, vous avez vu le manque de volume : c'était vrai, mais le volume ne se commandait pas, et personne ne savait s'il viendrait. Ce qui se décidait, c'était la structure.",
    prix: "En semaine 1, vous avez retenu les prix ; avec un taux de marge sur coût variable de 20 %, chaque point de prix retirait 5 % de la marge et faisait monter le seuil.",
    variables:
      "En semaine 1, vous avez retenu le coût de l'intérim et de la location à l'heure ; plus chers à l'unité, ils ne coûtaient rien quand le volume baissait.",
  };
  const justes = ["structure", "volume"];
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
    score: d === "structure" ? 1 : d === "volume" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes du seuil : ni figer la structure la moins chère au volume du plan, ni baisser les prix pour faire du volume, ni juger en coût complet ce qui se décidait à la marge."
        : `Sous la pression du seuil, vous avez choisi ${n} fois le réflexe : la structure la moins chère au volume du plan, la baisse de prix qui fait du volume, ou le coût complet là où seul comptait le coût marginal.${
            t.guerre
              ? " Brenaz a répondu à votre baisse de prix par une baisse plus forte."
              : t.regime === "bas"
                ? " La demande a décroché, et les charges fixes sont restées."
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    SEUIL_DEPART / 1000,
    "de seuil de rentabilité mensuel au départ",
    "k€",
    { juste: 5, proche: 15 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const s = t.structure;
  const marge: Constat = {
    score: s.seuil <= 220000 ? 1 : s.seuil <= SEUIL_DEPART ? 0.6 : 0,
    texte: `La structure que vous laissez a un seuil de rentabilité de ${kE(s.seuil)} par mois, pour ${kE(
      SEUIL_DEPART,
    )} au départ. Au rythme du premier mois, ${
      s.securite > 0 && s.levier !== null
        ? `sa marge de sécurité est de ${taux(s.securite, 0)} et son levier opérationnel de ${nombre(s.levier, 1)} : une baisse de 10 % du chiffre d'affaires retirerait ${taux(Math.min(1, s.levier * 0.1), 0)} du résultat.`
        : "le drive serait sous son seuil : chaque mois à ce rythme serait une perte."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, marge];
}

export function axe([information, diagnostic, reflexe, calibrage, marge]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire la structure avant de décider",
      texte:
        "Rejouez l'épisode en reprenant d'abord le compte du premier mois, charges fixes et variables séparées, et l'histoire des autres drives du groupe : le seuil, la marge de sécurité et le scénario bas y sont.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Regarder le scénario bas avant de figer une charge",
      texte:
        "La structure la moins chère au volume du plan est la plus chère quand la demande baisse, et une baisse de prix fait monter le seuil. Avant d'engager une charge fixe, refaites le compte à 40 % sous le rythme d'aujourd'hui ; avant de baisser un prix, comptez les retraits qu'il faudrait en plus pour garder la même marge.",
    };
  }
  if (marge!.score === 0) {
    return {
      titre: "Garder une marge de sécurité",
      texte:
        "Un seuil de rentabilité se déplace à chaque décision : une charge fixe le monte, une charge variable le baisse et réduit le taux de marge. Gardez des charges fixes que le scénario bas couvre encore.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui fait bouger le seuil",
      texte:
        "Le volume ne se décide pas ; la structure, si. Regardez quelles charges sont fixes, lesquelles suivent l'activité, et ce que chacune fait au seuil et à la marge de sécurité.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Le seuil de rentabilité se calcule : les charges fixes divisées par le taux de marge sur coût variable. Notez votre calcul, comparez-le au réel : c'est le moyen le plus rapide d'affiner votre jugement.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const TRAJECTOIRE: Record<Trimestre["regime"], string> = {
  haut: "La demande est montée vers le plan : deux lotissements ont démarré à Ruy et à Nivolas.",
  plateau:
    "La demande a plafonné autour de 260 retraits par semaine, comme deux drives du groupe sur quatre.",
  bas: "La demande a décroché : la deuxième tranche de la ZAC de la Maladière a été suspendue.",
};

export const EPISODE_SEUIL: Episode<Trimestre> = {
  code: "seuil-qui-bouge",
  numero: 34,
  domaine: "Contrôle de gestion",
  titre: "Le seuil qui bouge",
  resume:
    "Un drive matériaux ouvert depuis un mois, sous son plan, et une demande qui peut monter comme décrocher. Choisir la structure de coûts qui tient dans le scénario bas, sans baisser les prix pour passer le seuil.",
  persona:
    "Vous êtes Rachid Brossard, directeur du drive matériaux d'Arvel Distribution à Bourgoin-Jallieu, ouvert depuis un mois : les artisans commandent en ligne ou par téléphone et chargent en dix minutes. Votre équipe : Bogdan Ilić, chef d'équipe préparation, Perrine Gaudry et un second vendeur au comptoir, un magasinier-cariste, et des intérimaires.",
  mandat: [
    { fort: BUDGET_TEXTE, texte: "de résultat budgété pour le trimestre" },
    {
      fort: `${PLAN} retraits`,
      texte: "par semaine en rythme de croisière, selon le plan d'affaires",
    },
    {
      fort: `${VOLUME_BUDGET} retraits`,
      texte: "par semaine : le volume sur lequel le budget est bâti",
    },
    { fort: "la structure", texte: "du drive à engager : préparation, bail, chariots" },
  ],
  jugement: "Votre direction juge le trimestre sur le résultat du drive, en écart à son budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre drive",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'intérim au coup par coup et les décisions en suspens continuent de coûter.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...BOGDAN,
        alerte: true,
        texte: `Pendant ce temps, rien n'est décidé : l'intérim au coup par coup a coûté ${euros(perdu)} de plus que prévu.`,
      };
    },
  },
  prevision: {
    libelle: "votre seuil de rentabilité mensuel, en milliers d'euros de chiffre d'affaires",
    unite: "k€",
    placeholder: "250",
    min: 0,
    max: 1000,
    step: 1,
    reel: () => SEUIL_DEPART / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "cumul",
      nom: "Résultat du trimestre",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${BUDGET_TEXTE}`
          : `budget du trimestre : ${BUDGET_TEXTE}`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.cumul ?? 0) / BUDGET)),
              enRetard: (l.cumul ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "retraits",
      nom: "Retraits de la semaine",
      format: retraits,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `plan : ${PLAN} par semaine` : `moyenne du premier mois ; plan : ${PLAN}`,
    },
    {
      cle: "tauxMcv",
      nom: "Taux de marge sur coût variable",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => `au départ : ${taux(TAUX_MCV_DEPART, 0)}`,
    },
    {
      cle: "seuil",
      nom: "Seuil de rentabilité mensuel",
      format: kE,
      sensBon: -1,
      aide: () => "en chiffre d'affaires, pour la structure de la semaine",
    },
    {
      cle: "securite",
      nom: "Marge de sécurité",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => "part du chiffre d'affaires au-dessus du seuil",
    },
  ],
  contexte(l, decisions) {
    const marge = margeDUnRetraitBatir(decisions);
    return {
      cumul: kE(l.cumul ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      retraits: retraits(l.retraits ?? 0),
      tauxMcv: taux(l.tauxMcv ?? TAUX_MCV_DEPART),
      seuil: kE(l.seuil ?? SEUIL_DEPART),
      securite: taux(l.securite ?? 0, 0),
      perdus: retraits(l.perdus ?? 0),
      troisCdi: decisions[D.preparation] === 0,
      detailBatir: detailBatir(decisions),
      margeBatir: eurosFins(marge.marge),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const resultat = semaines.reduce((x, w) => x + w.resultat, 0);
    return [
      [`Retraits, sem. ${a}`, retraits(t.semaines[a]!.retraits)],
      ["Résultat de la période", kE(resultat)],
      [`Seuil mensuel, sem. ${a}`, kE(t.semaines[a]!.seuil)],
    ];
  },
  courbe: {
    titre: "Retraits, semaine par semaine",
    cle: "retraits",
    cible: PLAN,
    libelleCible: `plan d'affaires : ${PLAN} retraits par semaine`,
    graduations: [100, 200, 400],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${retraits(s.retraits!)} retraits · ${kE(s.ca!)} de chiffre d'affaires`,
      `résultat ${kE(s.resultat!)} · seuil ${kE(s.seuil!)} par mois`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.contrat && choix === 1) {
      // Bâtir Nord-Isère répond à la contre-proposition selon le hasard du trimestre.
      return [
        {
          ...ADAMA,
          texte: contreAcceptee(graine) ? REPONSES.contreAcceptee : REPONSES.contreRefusee,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const h = hasard(graine);
    const lies: Message[] = [];
    if (arrive.cdi) lies.push({ ...BOGDAN, heure: "sem. 3", texte: REPONSES.cdi });
    if (arrive.brenaz) {
      lies.push({ ...PERRINE, heure: "sem. 6", texte: REPONSES.brenaz });
      if (chemin[D.concurrent] === 2 && chemin[D.preparation] === 0) {
        lies.push({ ...BOGDAN, heure: "sem. 6", texte: REPONSES.sansRenfort });
      }
    }
    if (arrive.guerre) {
      lies.push({ ...PERRINE, heure: "sem. 8", alerte: true, texte: REPONSES.guerre });
    }
    if (arrive.glissement) {
      lies.push({ ...ADAMA, heure: "sem. 11", alerte: true, texte: REPONSES.glissement });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (de <= 4 && a >= 4 && h.regime !== "plateau") {
      imprevus.push({
        ...(h.regime === "haut" ? PERRINE : INAYA),
        heure: "sem. 4",
        texte: h.regime === "haut" ? REPONSES.haut : REPONSES.bas,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `${ecartAuBudget(t.objectif)}, pour ${kE(t.resultat)} de résultat`,
    formatObjectif: kE,
    noteDesBarres:
      "Résultat du drive sur le trimestre, en écart à son budget, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const s = t.structure;
      const parSemaine = t.retraits / SEMAINES;
      return [
        {
          nom: "Résultat du drive",
          valeur: kE(t.resultat),
          aide: `budget ${BUDGET_TEXTE}`,
          tenu: t.objectif >= 0,
        },
        {
          nom: "Seuil de rentabilité",
          valeur: `${kE(s.seuil)} par mois`,
          aide: `structure de fin de trimestre ; ${kE(SEUIL_DEPART)} au départ`,
          tenu: s.seuil <= SEUIL_DEPART,
        },
        {
          nom: "Marge de sécurité",
          valeur: taux(s.securite, 0),
          aide: "au rythme du premier mois ; 15 % au moins",
          tenu: s.securite >= 0.15,
        },
        {
          nom: "Retraits",
          valeur: `${retraits(parSemaine)} par semaine`,
          aide: `en moyenne ; budget bâti sur ${VOLUME_BUDGET}`,
          tenu: parSemaine >= VOLUME_BUDGET,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        { titre: "La demande", texte: TRAJECTOIRE[t.regime] },
        {
          titre: "Brenaz et Bâtir Nord-Isère",
          texte: [
            t.guerre
              ? "Brenaz a répondu à votre baisse de prix par une baisse plus forte"
              : "Brenaz a ouvert son drive en semaine 6",
            t.contrat === null
              ? "Bâtir Nord-Isère est allé ailleurs"
              : `Bâtir Nord-Isère a chargé chez vous à −${nombre(t.contrat * 100, 0)} %${
                  t.glissement
                    ? ", la moitié de ce qui était prévu après le glissement de son chantier"
                    : ""
                }`,
          ]
            .join(" ; ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
