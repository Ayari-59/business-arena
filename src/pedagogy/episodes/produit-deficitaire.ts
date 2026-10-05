/**
 * ÉPISODE 32 — LE PRODUIT QUI PERD DE L'ARGENT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Matthias montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  MCS_PEINTURE,
  NEUTRE,
  PERTE_PAR_JOUR,
  REFERENCE,
  SEMAINES,
  TOTAL_COMMUNES,
  evenements,
  hasard,
  orvalisCofinance,
  resultatCoutComplet,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/produit-deficitaire";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/produit-deficitaire";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un écart au budget : positif, l'agence fait mieux. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

const EDOUARD = { de: "Édouard Vassal", role: "Directeur régional" } as const;
const LILIAN = { de: "Lilian Guillaumin", role: "Vendeur-conseil plomberie-chauffage" } as const;
const HELENA = { de: "Héléna Moretti", role: "Déléguée commerciale, Peintures Orvalis" } as const;

/** Les charges fixes du trimestre : coûts spécifiques des gammes et charges communes. */
const CHARGES_FIXES =
  REFERENCE.go.cs + REFERENCE.out.cs + REFERENCE.pc.cs + REFERENCE.qf.cs + TOTAL_COMMUNES;

/** Ce que les décisions révèlent, dans l'ordre où un responsable de gammes les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient ce qui disparaîtrait vraiment avec la gamme",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    repartition:
      "Votre diagnostic de la semaine 1 était juste : le déficit de la plomberie-chauffage était fabriqué par la clé de répartition. Sa marge couvrait ses coûts spécifiques, et les charges communes qu'on lui imputait seraient restées sans elle.",
    liees:
      "En semaine 1, vous avez vu les ventes liées : une vraie raison de garder la gamme, mais pas la principale. Même sans les achats des chauffagistes dans les autres rayons, sa marge sur coûts spécifiques était positive : le déficit venait de la répartition des charges communes.",
    prix: "En semaine 1, vous avez retenu des prix trop bas ; son taux de marge sur coût variable était normal pour la gamme, et c'était la part de charges communes qu'on lui imputait qui la mettait dans le rouge.",
    structure:
      "En semaine 1, vous avez retenu les frais de structure de l'agence ; ils pèsent, mais aucune décision du trimestre ne les faisait baisser. La question était ce que chaque gamme rapporte au-delà de ses propres coûts.",
  };
  const justes = ["repartition", "liees"];
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
    score: d === "repartition" ? 1 : d === "liees" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais décidé sur le tableau en coût complet ni sur le seul chiffre d'affaires : vous avez regardé, à chaque fois, la marge qui changeait vraiment."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions l'option que dicte le coût complet ou le chiffre d'affaires : arrêter ou faire payer la gamme « déficitaire », couper son vendeur, faire du volume à prix cassé.${
            t.arret
              ? ` La plomberie-chauffage a été arrêtée ; les charges communes qu'elle portait sont restées, et sa marge est partie.`
              : t.ilescuPart
                ? " Ilescu Chauffage est parti chez Calorive, avec les achats qu'il faisait dans les autres rayons."
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.mcsPcReference / 1000,
    "de marge sur coûts spécifiques pour la plomberie-chauffage au trimestre dernier",
    "k€",
    { juste: 2, proche: 8 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const gardee = !t.arret;
  const corner = p.chemin[D.peinture] === 0 || p.chemin[D.peinture] === 1;
  const arbitrage: Constat = {
    score: gardee && corner ? 1 : gardee || corner ? 0.6 : 0,
    texte: `${
      gardee
        ? `Vous avez gardé la plomberie-chauffage : ${kE(t.mcsPc)} de marge sur coûts spécifiques ce trimestre, que le tableau de la direction montrait à ${kE(t.pcComplet)}.`
        : t.arret?.impose
          ? "La plomberie-chauffage a été arrêtée par la direction, faute d'avoir montré ce qu'elle rapportait."
          : "Vous avez arrêté la plomberie-chauffage : une gamme qui couvrait ses propres coûts."
    } ${
      corner
        ? `Vous avez traité le corner peinture, la seule sous-famille qui ne couvrait pas ses coûts spécifiques (${kE(MCS_PEINTURE)} au trimestre précédent, ${kE(t.mcsPeinture)} ce trimestre).`
        : `Le corner peinture, qui ne couvrait pas ses coûts spécifiques, est resté en l'état ou a été relancé : ${kE(t.mcsPeinture)} ce trimestre.`
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, arbitrage];
}

export function axe([information, diagnostic, reflexe, calibrage, arbitrage]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher ce qui disparaît avec la gamme",
      texte:
        "Rejouez l'épisode en décomposant d'abord le compte de la plomberie-chauffage et les charges communes : une fois la gamme arrêtée, sa marge part, le loyer du bâtiment reste.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Raisonner en marge, pas en coût complet",
      texte:
        "Un résultat en coût complet dépend de la clé de répartition. Pour arrêter, garder ou pousser une gamme, comparez la marge sur coût variable qu'elle apporte aux coûts spécifiques qu'on éviterait vraiment, et regardez ce qu'elle fait vendre ailleurs.",
    };
  }
  if (arbitrage!.score === 0) {
    return {
      titre: "Arrêter ce qui ne couvre pas ses propres coûts",
      texte:
        "La gamme à arrêter ou à réorganiser n'est pas celle que le tableau en coût complet montre en rouge : c'est celle dont la marge sur coût variable ne paie pas ses coûts spécifiques. Descendez jusqu'aux sous-familles pour la trouver.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Lire la clé de répartition",
      texte:
        "Quand une gamme est « déficitaire » en coût complet, demandez d'abord comment les charges communes lui sont réparties, et lesquelles disparaîtraient sans elle.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le calcul de la marge sur coûts spécifiques ligne par ligne : chiffre d'affaires, moins coûts variables, moins chaque coût spécifique, sans les charges communes.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_PRODUIT_DEFICITAIRE: Episode<Trimestre> = {
  code: "produit-deficitaire",
  numero: 32,
  domaine: "Contrôle de gestion",
  titre: "Le produit qui perd de l'argent",
  resume:
    "Le tableau de la direction, en coût complet, montre une gamme en déficit, et on vous demande de l'arrêter. Raisonner en marge sur coûts spécifiques, et trouver ce qui perd vraiment de l'argent.",
  persona:
    "Vous êtes Matthias Lemasson, responsable des gammes de l'agence Arvel de Villefranche-sur-Saône : gros œuvre, outillage, plomberie-chauffage et quincaillerie de finition. Vous travaillez avec Armelle Kieffer, directrice de l'agence, et rendez compte au directeur régional, Édouard Vassal.",
  mandat: [
    { fort: kE(BUDGET), texte: "de résultat pour l'agence sur le trimestre" },
    { fort: "quatre gammes", texte: "à garder, à réorganiser ou à arrêter" },
    { fort: "vendredi", texte: "pour répondre au comité sur la plomberie-chauffage" },
    {
      fort: kE(-resultatCoutComplet("pc")),
      texte: "de déficit pour la plomberie-chauffage, selon le tableau",
    },
  ],
  jugement:
    "Votre direction juge le trimestre sur le résultat de l'agence, toutes gammes et charges communes comprises, en écart à son budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre agence",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la rumeur d'un arrêt de la plomberie-chauffage fait le tour des chauffagistes.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...LILIAN,
        alerte: true,
        texte: `Pendant ce temps, la rumeur d'un arrêt a fait le tour des chauffagistes : des chantiers sont partis chez Calorive, ${euros(perdu)} de marge.`,
      };
    },
  },
  prevision: {
    libelle:
      "la marge sur coûts spécifiques de la plomberie-chauffage au trimestre dernier, en milliers d'euros",
    unite: "k€",
    placeholder: "0",
    min: -200,
    max: 300,
    step: 1,
    reel: (t) => t.mcsPcReference / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "resultat",
      nom: "Résultat de l'agence",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `à date ; budget à date : ${kE(l.budgetADate ?? 0)}`
          : `budget : ${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.resultat == null || !l.budgetADate
          ? null
          : {
              part: Math.min(1, Math.max(0, l.resultat / BUDGET)),
              enRetard: l.resultat < l.budgetADate,
            },
    },
    {
      cle: "tauxMcv",
      nom: "Taux de marge sur coût variable",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) => (semaine ? "de l'agence, à date" : "de l'agence, au trimestre dernier"),
    },
    {
      cle: "mcsPc",
      nom: "Plomberie-chauffage : marge sur coûts spécifiques",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "à date, avant charges communes"
          : "ce que la gamme dégage après ses propres coûts",
    },
    {
      cle: "pcComplet",
      nom: "Plomberie-chauffage au tableau de la direction",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "en coût complet, à date"
          : `en coût complet : ${kE(resultatCoutComplet("pc"))} au trimestre dernier`,
    },
    {
      cle: "liees",
      nom: "Achats des chauffagistes dans les autres rayons",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `outillage et quincaillerie, semaine ${semaine}`
          : "outillage et quincaillerie, par semaine",
    },
  ],
  contexte(l, decisions) {
    return {
      resultat: kE(l.resultat ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      tauxMcv: taux(l.tauxMcv ?? 0),
      mcsPc: kE(l.mcsPc ?? 0),
      pcComplet: kE(l.pcComplet ?? 0),
      liees: kE(l.liees ?? 0),
      arret: l.arret === 1 || decisions[D.gamme] === 0,
      priscillaAuComptoir: decisions[D.peinture] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      ["Marge sur coût variable de la période", kE(semaines.reduce((x, w) => x + w.mcv, 0))],
      ["Résultat de la période", kE(semaines.reduce((x, w) => x + w.resultat, 0))],
      [`Plomberie-chauffage, marge sur coûts spécifiques à date`, kE(t.semaines[a]!.mcsPc)],
    ];
  },
  courbe: {
    titre: "Marge sur coût variable de l'agence, semaine par semaine",
    cle: "mcv",
    cible: (CHARGES_FIXES + BUDGET) / SEMAINES,
    libelleCible: "ce qu'il faut pour payer les charges fixes et tenir le budget",
    graduations: [15000, 25000, 35000, 45000],
    format: kE,
    details: (s) => [
      `marge ${kE(s.mcv!)} · chiffre d'affaires ${kE(s.ca!)}`,
      `résultat de la semaine ${kE(s.resultat!)} · plomberie-chauffage ${kE(s.caPc!)} de ventes`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.peinture && choix === 2) {
      // Orvalis répond selon le hasard du trimestre.
      return [
        {
          ...HELENA,
          texte: orvalisCofinance(graine) ? REPONSES.orvalisOui : REPONSES.orvalisNon,
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
    if (arrive.arretImpose) {
      lies.push({ ...EDOUARD, heure: "sem. 5", alerte: true, texte: REPONSES.arretImpose });
    }
    if (arrive.directionAttend) {
      lies.push({ ...EDOUARD, heure: "sem. 5", texte: REPONSES.directionAttend });
    }
    if (t.arret && de <= t.arret.annonce && a >= t.arret.annonce) {
      lies.push({ ...LILIAN, heure: `sem. ${t.arret.annonce}`, texte: REPONSES.annonce });
    }
    if (arrive.ilescuPart) {
      lies.push({
        de: "Radu Ilescu",
        role: "Gérant d'Ilescu Chauffage",
        heure: "sem. 7",
        alerte: true,
        texte: REPONSES.ilescuPart,
      });
    }
    if (arrive.lilianPart) {
      lies.push({ ...LILIAN, heure: "sem. 8", texte: REPONSES.lilianPart });
    }
    if (chemin[D.operation] === 2 && de <= 9 && a >= 9) {
      if (t.matinee) {
        const venus = Math.round(5 + 25 * h.affluence);
        lies.push({
          de: "Armelle Kieffer",
          role: "Directrice de l'agence",
          heure: "sem. 9",
          texte: `${venus} chauffagistes sont venus à la matinée Ardéa. ${
            venus >= 18
              ? "Le technicien n'a pas arrêté, et le comptoir a pris des commandes jusqu'à midi."
              : venus >= 10
                ? "Quelques commandes sur place, et des rendez-vous de chiffrage."
                : "Une matinée calme : les chantiers d'avant Noël ont retenu les autres."
          }`,
        });
      } else {
        lies.push({ ...LILIAN, heure: "sem. 9", texte: REPONSES.matineeAnnulee });
      }
    }
    if (arrive.fermeture && t.arret) {
      lies.push({
        de: "Armelle Kieffer",
        role: "Directrice de l'agence",
        heure: `sem. ${t.arret.fermeture}`,
        texte: REPONSES.fermeture,
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, toutes gammes comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Résultat de l'agence en écart à son budget, toutes gammes et charges communes comprises, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Résultat de l'agence",
          valeur: kE(t.resultat),
          aide: `budget ${kE(BUDGET)} ; taux de marge sur coût variable ${taux(t.tauxMcv)}`,
          tenu: t.resultat >= BUDGET,
        },
        {
          nom: "Plomberie-chauffage",
          valeur: t.arret ? "arrêtée" : "gardée",
          aide: `${kE(t.mcsPc)} de marge sur coûts spécifiques ; ${kE(t.pcComplet)} en coût complet`,
          tenu: !t.arret && t.mcsPc > 0,
        },
        {
          nom: "Corner peinture",
          valeur: kE(t.mcsPeinture),
          aide: `marge sur coûts spécifiques ; ${kE(MCS_PEINTURE)} au trimestre précédent`,
          tenu: t.mcsPeinture > MCS_PEINTURE / 2,
        },
        {
          nom: "Chauffagistes",
          valeur: taux(t.lieesRapport, 0),
          aide: "de leurs achats habituels en outillage et quincaillerie",
          tenu: t.lieesRapport >= 0.95,
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
          titre: "Les chauffagistes",
          texte: `Ils faisaient ce trimestre ${taux(h.lie, 0)} des ventes d'outillage et de quincaillerie${
            t.ilescuPart ? " ; Ilescu Chauffage est parti chez Calorive en semaine 7" : ""
          }${t.matinee ? ` ; ${Math.round(5 + 25 * h.affluence)} sont venus à la matinée Ardéa` : ""}.`,
        },
        ...(t.arret?.impose
          ? [
              {
                titre: "La direction",
                texte: "a tranché en semaine 5 : la plomberie-chauffage a été arrêtée.",
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
