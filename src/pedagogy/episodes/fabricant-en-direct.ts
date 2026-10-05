/**
 * ÉPISODE 44 — LE FABRICANT QUI VEND EN DIRECT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Séverin montre, ce que la
 * courbe trace, ce sur quoi le comité le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * Une riposte stratégique se juge sur des années, l'épisode sur un
 * trimestre : le tableau de bord suit donc la VALEUR ESTIMÉE, par rapport au
 * plan d'avant l'annonce — la marge du trimestre, plus deux ans de la marge
 * que la riposte installe, actualisés à 9 %, recalculée chaque semaine avec
 * ce que le trimestre révèle : le succès de la plateforme, la réaction de
 * Mérindal, ce que les artisans font de Solvane et de la marque propre.
 * La courbe suit ce que la plateforme prend, semaine après semaine.
 */
import {
  CORBIERE,
  COEF,
  D,
  HORIZON,
  JOURS_SANS_PERTE,
  MARGE_EXPOSEE,
  MARGE_MERINDAL,
  NEUTRE,
  OBJECTIF_VALEUR,
  PERTE_PAR_JOUR,
  PREMIERS_CHIFFRES,
  RFA,
  SCENARIOS,
  SEMAINE_REACTION,
  SEMAINE_REPONSE,
  TAUX,
  ACHATS_ARVEL,
  ACHATS_MERINDAL,
  annuelMarquePlaques,
  annuelSerie,
  evenements,
  hasard,
  margeSurMesure,
  reactionParCode,
  simuler,
  solvanePresente,
  surMesureDeploye,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/fabricant-en-direct";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/fabricant-en-direct";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const parAn = (v: number) => `${kE(v)}/an`;
const points = (v: number) => `${nombre(v * 100)} pt`;

const THIERNO = { de: "Thierno Bassolé", role: "Directeur commercial" } as const;
const KONRAD = { de: "Konrad Hornecker", role: "Directeur des ventes France, Mérindal" } as const;
const ISABEAU = { de: "Isabeau Lacassagne", role: "Directrice générale, Mérindal" } as const;
const NOAM = { de: "Noam Riboulet", role: "Chef de produit plâtrerie et menuiseries" } as const;
const EVARISTE = {
  de: "Évariste Ardisson",
  role: "Directeur des achats, Corbière Bâtiment",
} as const;
const ELOUAN = { de: "Elouan Quiviger", role: "Contrôleur de gestion" } as const;
const CLEMENTINE = { de: "Clémentine Royo", role: "Juriste" } as const;

/** Le plafond que le comité fixe à ce que la plateforme nous prend, au rythme annuel. */
export const PLAFOND_CAPTEE = 165000;

const remplir = (decisions: readonly number[]) => NEUTRE.map((n, i) => decisions[i] ?? n);

/** Ce que les décisions révèlent, dans l'ordre où un directeur des achats les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de chiffrer la marge exposée et la dépendance des deux côtés",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    exposition:
      "Votre diagnostic de la semaine 1 était juste : la plateforme ne pouvait prendre que les commandes complètes, et la dépendance se chiffrait des deux côtés. Défendre ce que le négoce apporte et négocier en découlait.",
    services:
      "En semaine 1, vous avez vu les services : un vrai levier, mais pas tout. Il restait à chiffrer ce que la plateforme pouvait prendre, et ce que Mérindal perdrait sans nous.",
    trahison:
      "En semaine 1, vous avez vu un concurrent à remplacer ; ses menuiseries sont demandées par les artisans, et le remplacer coûte plus que ce que sa plateforme peut prendre.",
    besoin:
      "En semaine 1, vous avez cru Mérindal trop dépendant de nous pour aller loin ; il pèse 10 % de nos achats et n'a besoin de nous que pour les artisans : rien ne l'empêchait de prendre les grands comptes.",
  };
  const justes = ["exposition", "services"];
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
    score: d === "exposition" ? 1 : d === "services" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez cédé à aucun réflexe du comité sous pression : ni punir Mérindal, ni l'ignorer, ni acheter la fidélité par une remise, ni déployer sans savoir, ni tenir le plan contre les chiffres, ni rompre."
        : `Vous avez choisi ${n} fois le réflexe d'un comité sous pression : punir le fabricant ou l'ignorer, acheter la fidélité par une remise, déployer sans savoir ce que feront les artisans, tenir le plan annoncé malgré les chiffres, rompre.${
            t.litige ? " Mérindal vous a en plus assigné pour rupture brutale." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    MARGE_EXPOSEE / 1000,
    "de marge annuelle exposée à la vente directe",
    "k€",
    { juste: 15, proche: 60 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const [p1, , , m, , d6] = p.chemin;
  const levier = solvanePresente(p.chemin) || m === 0 || m === 1;
  let relation: Constat;
  if (t.derefere) {
    relation = {
      score: 0,
      texte: `Vous avez rompu avec un fournisseur que sept artisans sur dix demandent par son nom : les artisans qui le veulent partiront avec leur panier, et la plateforme prendra toutes les commandes complètes.${
        t.litige ? " Mérindal vous assigne, en plus, pour rupture brutale." : ""
      }`,
    };
  } else if (p1 === 1 && d6 === 3) {
    relation = {
      score: 0,
      texte:
        "Vous avez laissé faire Mérindal du début à la fin, en comptant sur sa dépendance : il a besoin de nous pour les artisans, pas pour les grands comptes, et rien ne l'arrêtait.",
    };
  } else if ((d6 === 1 || d6 === 2) && levier) {
    const issue =
      t.accord === "complet"
        ? "Il a signé l'accord complet : le partage, la commission, et pas de vente aux artisans."
        : t.accord === "limite"
          ? "Il a signé le partage et la commission ; les artisans restent à sa portée."
          : "Il a refusé cette fois : la proposition était juste, le tirage ne l'a pas été.";
    relation = {
      score: 1,
      texte: `Vous avez négocié avec Mérindal depuis une position chiffrée, une alternative en rayon, sans rompre ni céder. ${issue}`,
    };
  } else {
    relation = {
      score: 0.6,
      texte:
        d6 === 1 || d6 === 2
          ? "Vous avez proposé un accord à Mérindal sans alternative en rayon : rien ne l'obligeait à vous écouter."
          : "Vous avez évité la rupture, mais rien signé : la plateforme garde les mains libres.",
    };
  }

  return [information, diagnostic, reflexe, calibrage, relation];
}

export function axe([information, diagnostic, reflexe, calibrage, relation]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer avant de riposter",
      texte:
        "Rejouez l'épisode en décomposant d'abord les ventes de Mérindal par type de client et de commande, et en chiffrant la dépendance des deux côtés : la menace et le pouvoir de négociation s'y lisent.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni punir, ni ignorer : peser la dépendance",
      texte:
        "Un fournisseur qui vend en direct ne se punit pas en le déréférençant, si les artisans le demandent, et ne s'ignore pas parce qu'il « a besoin de nous ». Chiffrez ce qu'il peut prendre, faites payer ce que vous apportez, et négociez avec une alternative en main.",
    };
  }
  if (relation!.score === 0) {
    return {
      titre: "Négocier plutôt que rompre",
      texte:
        "Un fournisseur dont on dépend se renégocie : une seconde marque crédible, des services qu'il ne sait pas rendre, et une proposition qui sert les deux, comme un partage des grands comptes. La rupture coûte les artisans, et parfois un procès.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Séparer ce qui est exposé de ce qui ne l'est pas",
      texte:
        "La vente directe ne menace que les clients qui n'ont pas besoin de ce que le négoce apporte : stock de proximité, livraison fractionnée, crédit, conseil. Le reste se défend, et la dépendance se mesure des deux côtés.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de l'exposition",
      texte:
        "Partez de la marge, pas du chiffre d'affaires, segment par segment, et ne gardez que la part faite sur des commandes que la plateforme sait servir : 60 % chez les grands comptes, 20 % chez les PME, rien chez les artisans.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** La fenêtre de semaines où chaque décision agit d'abord : ce qu'elle a changé à la valeur estimée. */
const FENETRES: readonly [number, number][] = [
  [1, 4],
  [3, 6],
  [5, 9],
  [7, 10],
  [10, 13],
  [12, 13],
];

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

const NOMS_ACCORD: Record<Trimestre["accord"], string> = {
  complet: "accord complet signé",
  limite: "accord limité signé",
  refuse: "accord refusé",
  rompu: "rupture",
  aucun: "rien de signé",
};

export const EPISODE_DESINTERMEDIATION: Episode<Trimestre> = {
  code: "fabricant-en-direct",
  numero: 44,
  domaine: "Pouvoir de négociation",
  titre: "Le fabricant qui vend en direct",
  resume:
    "Votre premier fournisseur ouvre une plateforme de vente directe aux grandes entreprises du bâtiment. Chiffrer ce qu'il peut prendre et ce qu'il perdrait sans vous, faire payer ce que le négoce apporte, et négocier sans rompre.",
  persona:
    "Vous êtes Séverin Chabrol, directeur de l'offre et des achats d'Arvel Distribution : 112 M€ d'achats par an, douze chefs de produit et acheteurs, l'assortiment des trente agences d'Auvergne-Rhône-Alpes. Mérindal, votre premier fournisseur de menuiseries et de plaques, vient d'annoncer qu'il vendra en direct aux grandes entreprises du bâtiment.",
  mandat: [
    {
      fort: kE(MARGE_MERINDAL),
      texte: "de marge par an sur les produits Mérindal, 14 M€ de ventes",
    },
    {
      fort: taux(ACHATS_MERINDAL / ACHATS_ARVEL, 0),
      texte: "de nos achats chez Mérindal, notre premier fournisseur",
    },
    {
      fort: `${nombre(COEF, 2)} an`,
      texte: `de marge : ce que vaut une position, ${HORIZON} ans actualisés à ${taux(TAUX, 0)}`,
    },
    { fort: kE(OBJECTIF_VALEUR), texte: "la perte de valeur que le comité accepte au plus" },
  ],
  jugement:
    "Le comité de direction juge le trimestre sur la valeur estimée en semaine 13, par rapport au plan d'avant l'annonce : la marge du trimestre, plus deux ans de la marge que votre riposte installe, actualisés à 9 %, recalculée avec ce que le trimestre a révélé, dépenses comprises.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre riposte",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les commerciaux de Mérindal font le tour de vos grands comptes sans que personne ne leur réponde.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...THIERNO,
        alerte: true,
        texte: `Pendant qu'on étudiait, Mérindal a fait passer des commandes d'essai à deux de nos grands comptes : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle:
      "la marge annuelle d'Arvel exposée à la vente directe de Mérindal, en milliers d'euros",
    unite: "k€",
    placeholder: "1000",
    min: 0,
    max: 3000,
    step: 5,
    reel: () => MARGE_EXPOSEE / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `par rapport au plan d'avant l'annonce ; seuil : ${kE(OBJECTIF_VALEUR)}`
          : "avant l'annonce de Mérindal",
    },
    {
      cle: "captee",
      nom: "Marge prise par la plateforme",
      format: parAn,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `au rythme annuel ; plafond fixé par le comité : ${parAn(PLAFOND_CAPTEE)}`
          : "la plateforme ouvre en semaine 3",
      jauge: (l) => ({
        part: Math.min(1, (l.captee ?? 0) / PLAFOND_CAPTEE),
        enRetard: (l.captee ?? 0) > PLAFOND_CAPTEE,
      }),
    },
    {
      cle: "ecart",
      nom: "Écart de marge du trimestre",
      format: kE,
      sensBon: 1,
      aide: () => "cumulé depuis la semaine 1, dépenses comprises",
    },
    {
      cle: "dependance",
      nom: "Poids de Mérindal dans nos achats",
      format: (v) => taux(v, 1),
      formatEcart: points,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `projeté sur l'an prochain ; ${taux(ACHATS_MERINDAL / ACHATS_ARVEL, 0)} avant l'annonce`
          : "notre premier fournisseur",
    },
    {
      cle: "rfa",
      nom: "Remise de fin d'année Mérindal",
      format: (v) => taux(v, 1),
      formatEcart: points,
      sensBon: 1,
      aide: () => `sur nos achats chez Mérindal ; ${taux(RFA.taux, 0)} au contrat`,
    },
  ],
  contexte(l, decisions): Contexte {
    const chemin = remplir(decisions);
    const sv = decisions[D.solvane];
    const prise = l.prise;
    const scenario = SCENARIOS.find((s) => s.prise === prise);
    return {
      derefere: decisions[D.posture] === 0,
      laisse: decisions[D.posture] === 1,
      reaction: reactionParCode(l.reaction) ?? "",
      solvane: sv === 0 ? "partout" : sv === 1 ? "test" : "aucun",
      solvaneEnRayon: solvanePresente(chemin),
      surMesureEnRayon: surMesureDeploye(chemin),
      serie: l.serie == null ? "" : taux(l.serie, 0),
      surMesure: l.surMesure == null ? "" : taux(l.surMesure, 0),
      serieAnnuel: l.serie == null ? "" : kE(annuelSerie(l.serie)),
      surMesureAnnuel: l.surMesure == null ? "" : kE(margeSurMesure(l.surMesure)),
      captee: kE(l.captee ?? 0),
      prise: prise == null ? "" : taux(prise, 0),
      scenario: scenario?.nom ?? "",
      valeur: kE(l.valeur ?? 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Prise par la plateforme, sem. ${a}`, parAn(s.captee)],
    ];
  },
  courbe: {
    titre: "Marge prise par la plateforme, semaine par semaine",
    cle: "captee",
    cible: PLAFOND_CAPTEE,
    libelleCible: `plafond fixé par le comité : ${parAn(PLAFOND_CAPTEE)}`,
    graduations: [100000, 200000, 300000, 400000, 500000],
    format: kE,
    details: (s) => [
      `${parAn(s.captee!)} prise par la plateforme · valeur estimée ${kE(s.valeur!)}`,
      `écart de marge du trimestre ${kE(s.ecart!)} · remise de fin d'année ${taux(s.rfa!, 1)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.offre && choix === 1) {
      // Corbière répond aux services facturés selon le hasard du trimestre.
      const part = hasard(graine).uCorbiere < CORBIERE.depart[1];
      return [{ ...EVARISTE, texte: part ? REPONSES.corbiereRefuse : REPONSES.corbiereAccepte }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.litige) {
      lies.push({ ...CLEMENTINE, heure: "sem. 4", alerte: true, texte: REPONSES.miseEnDemeure });
    }
    if (arrive.corbiere) {
      const part = t.corbiere !== "reste";
      lies.push({
        ...ELOUAN,
        heure: `sem. ${CORBIERE.semaine}`,
        alerte: part,
        texte: part ? REPONSES.corbierePart : REPONSES.corbiereReste,
      });
    }
    if (arrive.reaction) {
      lies.push({
        ...KONRAD,
        heure: `sem. ${SEMAINE_REACTION}`,
        alerte: t.reaction !== "accord",
        texte:
          t.reaction === "accord"
            ? REPONSES.reactionAccord
            : t.reaction === "conflit"
              ? REPONSES.reactionConflit
              : REPONSES.reactionExtension,
      });
    }
    if (arrive.retour) {
      lies.push({
        ...EVARISTE,
        heure: `sem. ${CORBIERE.semaineRetour}`,
        texte: REPONSES.corbiereRevient,
      });
    }
    if (arrive.marque) {
      const menuiseries =
        chemin[D.marque] === 0
          ? " En menuiseries, presque rien : les artisans veulent une marque qui répond en cas de souci."
          : "";
      lies.push({
        ...NOAM,
        heure: "sem. 11",
        texte: `Trois semaines de marque propre : ${taux(t.adoption, 0)} des plaques vendues aux artisans et aux PME. Au rythme annuel, ${kE(annuelMarquePlaques(t.adoption))} de marge en plus.${menuiseries}`,
      });
    }
    if (arrive.reponse) {
      const d6 = chemin[D.accord];
      if (d6 === 1 || d6 === 2) {
        const accepte = t.accord === "complet" || t.accord === "limite";
        lies.push({
          ...ISABEAU,
          heure: `sem. ${SEMAINE_REPONSE}`,
          alerte: !accepte,
          texte: accepte
            ? chemin[D.posture] === 0
              ? REPONSES.retourAccepte
              : d6 === 1
                ? REPONSES.accordComplet
                : REPONSES.accordLimite
            : d6 === 1 && t.reaction === "accord"
              ? REPONSES.refusComplet
              : REPONSES.refus,
        });
      }
      if (t.derefere) {
        lies.push({
          ...CLEMENTINE,
          heure: `sem. ${SEMAINE_REPONSE}`,
          alerte: t.litige,
          texte: t.litige ? REPONSES.assignation : REPONSES.pasDAssignation,
        });
      }
    }
    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.lancement) {
      imprevus.unshift({ ...KONRAD, heure: "sem. 3", texte: REPONSES.lancement });
    }
    if (arrive.chiffres) {
      imprevus.push({
        ...ELOUAN,
        heure: `sem. ${PREMIERS_CHIFFRES}`,
        texte: `Premiers chiffres de la plateforme : ${t.scenario.nom}. Elle s'installe vers ${taux(t.scenario.prise, 0)} des commandes complètes de la région.`,
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
        : `${kE(-t.objectif)} de valeur perdue, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur estimée en semaine 13, par rapport au plan d'avant l'annonce : la marge du trimestre, plus deux ans de la marge que la riposte installe, actualisés à 9 %, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const captee = t.semaines[13]!.captee;
      const dependance = t.semaines[13]!.dependance;
      return [
        {
          nom: "Valeur",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; seuil du comité : ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Plateforme",
          valeur: parAn(captee),
          aide: `prise en semaine 13 ; plafond : ${parAn(PLAFOND_CAPTEE)}`,
          tenu: captee <= PLAFOND_CAPTEE,
        },
        {
          nom: "Mérindal",
          valeur: NOMS_ACCORD[t.accord],
          aide:
            t.reaction === "accord"
              ? "il proposait un partage en semaine 8"
              : t.reaction === "conflit"
                ? "il avait retiré un point et demi de remise en semaine 8"
                : "il avait annoncé la vente aux artisans en semaine 8",
          tenu: t.accord === "complet" || t.accord === "limite",
        },
        {
          nom: "Dépendance",
          valeur: taux(dependance, 1),
          aide: `de nos achats l'an prochain ; ${taux(ACHATS_MERINDAL / ACHATS_ARVEL, 0)} avant l'annonce`,
          tenu: !t.derefere && dependance < ACHATS_MERINDAL / ACHATS_ARVEL - 0.01,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const c = t.chances;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La plateforme",
          texte: `a connu ${t.scenario.nom} : ${taux(t.scenario.prise, 0)} des commandes complètes à son rythme de croisière (une chance sur trois d'un succès limité, une sur deux d'un succès moyen, une sur cinq d'un franc succès).`,
        },
        {
          titre: "Mérindal",
          texte: `a choisi ${
            t.reaction === "accord"
              ? "de proposer un partage"
              : t.reaction === "conflit"
                ? "le conflit"
                : "d'ouvrir sa plateforme aux artisans"
          } en semaine 8. Avec vos choix, ses chances étaient : accord ${taux(c.accord, 0)}, conflit ${taux(c.conflit, 0)}, extension ${taux(c.extension, 0)}.`,
        },
        {
          titre: "Les artisans",
          texte: `auraient pris Solvane à ${taux(t.serie, 0)} sur la série et à ${taux(t.surMesure, 0)} sur le sur-mesure, et une marque propre à ${taux(t.adoption, 0)} sur les plaques.`,
        },
        {
          titre: "Corbière Bâtiment",
          texte:
            t.corbiere === "reste"
              ? "est resté chez nous."
              : t.corbiere === "revenu"
                ? "est parti en semaine 5, puis revenu en semaine 9 pour le réassort et les services."
                : "est parti en semaine 5, avec son réassort.",
        },
      ];
    },
    fenetre(t, d) {
      const [de, a] = FENETRES[d]!;
      return valeurA(t, a) - valeurA(t, de - 1);
    },
  },
  comportements,
  axe,
};
