/**
 * ÉPISODE 95 — LES PALETTES QUI PÉRIMENT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de la supply chain d'Ysée montre,
 * ce que la courbe trace, ce sur quoi le bilan la juge, et ce que ses
 * décisions révèlent d'elle.
 */
import {
  BUDGET,
  CASSE_DEPART,
  CHANGEMENT,
  COMPENSATION,
  COMPENSATION_SEMAINE,
  D,
  DEREFERENCEMENT,
  DON,
  ERREUR_PROMO,
  JOURS_SANS_PERTE,
  LOT_ECONOMIQUE_REFERENCE,
  NEUTRE,
  OBJECTIF_CASSE,
  PARTENARIAT,
  PENALITES_PRINTEMPS,
  PERTE_PAR_JOUR,
  REFERENCE_PREVISION,
  SERVICE_ATTENDU,
  AUTOMNE,
  celtisAccepte,
  evenements,
  hasard,
  possession,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/dlc-qui-tombe";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/dlc-qui-tombe";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** La trajectoire du trimestre : 2 % de casse, en route vers l'objectif de 1,4 % de l'année. */
export const TRAJECTOIRE_CASSE = 0.02;
/** Un écart signé en k€ : « +20 k€ », « −35 k€ ». */
const signe = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const points = (v: number) => `${nombre(v * 100)} pt`;
const palettes = (milliers: number) => nombre(milliers / DON.potsParPalette, 0);
/** Le service à Celtis en septembre, semaines 10 à 13. */
export const serviceSeptembre = (t: Trimestre) => {
  const s = t.semaines.slice(10, 14) as Semaine[];
  return s.reduce((x, w) => x + w.serviceCeltis, 0) / s.length;
};

const NEDJMA = {
  de: "Nedjma Benhalima",
  role: "Responsable des approvisionnements frais, Celtis",
} as const;
const GLENMOR = {
  de: "Glenmor Le Corre",
  role: "Responsable logistique fournisseurs, Celtis",
} as const;
const ALWENA = { de: "Alwena Coquil", role: "Planificatrice de production, Loudéac" } as const;
const NAIM = {
  de: "Naïm Lefeuvre",
  role: "Directeur des grands comptes et des MDD",
} as const;
const ERWANN = {
  de: "Erwann Tromeur",
  role: "Chef de l'atelier de conditionnement, Loudéac",
} as const;

/** Ce que les décisions révèlent, dans l'ordre où une responsable supply chain les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, la casse par cause et le calcul du lot de la crème chocolat",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    plan: "Votre diagnostic de la semaine 1 était juste : la casse se fabriquait au plan de production, par des séries trop longues pour des produits qui ne se stockent pas, des promotions produites à l'aveugle et des faibles rotations produites sur des prévisions fausses.",
    promotions:
      "En semaine 1, vous avez vu les promotions : une vraie cause, le quart de la casse, mais pas la première. Près de la moitié venait des séries trop longues, et les faibles rotations faisaient la moitié de la casse avec 15 % des volumes.",
    entrepots:
      "En semaine 1, vous avez retenu la règle des deux tiers des entrepôts ; c'est la règle de toutes les centrales, et elle ne fait que révéler des pots trop vieux. Ce qui les faisait vieillir, c'était le plan : des séries trop longues et des prévisions fausses.",
    capacite:
      "En semaine 1, vous avez retenu un manque de capacité ; les lignes tournaient à 86 % de leurs heures. Ce qui manquait, ce n'était pas du stock, c'étaient les bons produits au bon moment.",
  };
  const justes = ["plan", "promotions"];
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
    score: d === "plan" ? 1 : d === "promotions" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cherché à baisser le coût unitaire par des séries plus longues, ni à tenir le service par du stock : vous avez produit au plus près de ce qui se vend."
        : `Sous la pression du coût et du service, vous avez ${n} fois allongé les séries, bradé les surplus ou ajouté du stock « pour ne pas manquer ». Un produit frais ne se stocke pas : chaque semaine de stock en plus se paie en casse, et le déstockage abîme le prix de la marque.${
            t.compensation
              ? " Opaline a obtenu une remise sur la marque après l'avoir vue chez un soldeur."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.lotEconomique,
    `pour la taille de lot économique de la ${REFERENCE_PREVISION.nom}`,
    "milliers de pots",
    { juste: 6, proche: 20 },
    (e) => `${nombre(e, 0)} milliers de pots`,
  );

  // Produire au plus près de la demande : la série, la prévision avec l'enseigne, le stock ciblé, la rentrée.
  const series = p.chemin[D.series] === 1;
  const prevoir = p.chemin[D.celtis] === 0 || p.chemin[D.celtis] === 1;
  const cible = p.chemin[D.service] === 1;
  const rentree = p.chemin[D.rentree] === 1;
  const bons = [series, prevoir, cible, rentree].filter(Boolean).length;
  const auPlusPres: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      series
        ? "Vous avez dimensionné chaque série en comparant le coût d'un changement à celui de la casse, dans la limite de la fenêtre de fraîcheur."
        : p.chemin[D.series] === 2
          ? "Vos petites séries ont saturé les lignes : des samedis, puis des ruptures."
          : "Les séries sont restées plus longues que ce que la fraîcheur permettait."
    } ${
      prevoir
        ? t.celtisAccepte
          ? "Celtis a partagé ses volumes promotionnels et ses commandes fermes."
          : "Vous avez demandé à Celtis ses volumes ; elle a refusé cette fois."
        : "Les promotions sont restées produites sur l'historique."
    } ${
      cible
        ? "Le stock de sécurité est allé aux fortes rotations, où il protège sans vieillir."
        : "Le stock de sécurité n'a pas été ciblé."
    } ${
      rentree
        ? "La rentrée a été produite en deux séries, la seconde ajustée sur les ventes."
        : "La rentrée a été produite d'un bloc, sur une prévision."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, auPlusPres];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  auPlusPres,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Décomposer la casse avant de toucher au plan",
      texte:
        "Rejouez l'épisode en décomposant d'abord la casse par cause : près de la moitié venait des séries trop longues, un quart des promotions produites à l'aveugle, un quart des faibles rotations. Trois causes, trois réponses.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Produire au plus près plutôt que stocker et brader",
      texte:
        "Une série plus longue baisse le coût unitaire et fabrique de la casse ; trois jours de stock partout remontent le service et vieillissent en chambre froide ; le déstockage rapporte un quart du prix et en coûte davantage à la marque. Comparez le coût d'un changement à celui de la casse, et prévoyez avec l'enseigne.",
    };
  }
  if (auPlusPres!.score === 0) {
    return {
      titre: "Prévoir avec l'enseigne",
      texte:
        "Les volumes promotionnels et les commandes fermes de l'enseigne valent plus que n'importe quel stock de sécurité : ils permettent de produire les promotions et les faibles rotations à la commande.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher où la casse se fabrique",
      texte:
        "La casse se voit à l'entrepôt et se fabrique au plan : regardez combien de jours de ventes couvre chaque série, et ce qui fait se tromper la prévision, avant d'accuser la règle des deux tiers ou la capacité des lignes.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du lot économique",
      texte: `Le lot économique égalise le coût des changements et celui du stock : la racine de deux fois la demande (${nombre(REFERENCE_PREVISION.demande, 0)} milliers de pots par semaine) fois le coût d'un changement (${euros(CHANGEMENT.cout)}), divisés par le coût de possession, casse comprise (${nombre(possession("A"), 2)} € par millier et par semaine) : ${nombre(LOT_ECONOMIQUE_REFERENCE, 0)} milliers de pots, moins d'une semaine de ventes. Puis vérifiez qu'il tient dans la fenêtre de fraîcheur.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_DLC: Episode<Trimestre> = {
  code: "dlc-qui-tombe",
  numero: 95,
  domaine: "Arbitrer entre taille de lot et fraîcheur",
  titre: "Les palettes qui périment",
  resume:
    "La casse à 2,8 % du chiffre d'affaires et le service à 96 % : un produit frais ne se stocke pas. Dimensionner les séries et prévoir avec l'enseigne plutôt que stocker et brader.",
  persona:
    "Vous êtes Ysée Bescond, responsable supply chain de la Laiterie de Kerbrélan, entreprise familiale de 520 salariés à Loudéac (Côtes-d'Armor). Vous établissez le plan de production des yaourts aromatisés et des desserts lactés de l'usine de Loudéac : trois lignes de conditionnement, quarante-six références vendues à Celtis, Opaline et Proxival, sous la marque Kerbrélan et sous leurs marques de distributeur. Le trimestre va de juillet à septembre : l'été, puis la rentrée.",
  mandat: [
    { fort: taux(OBJECTIF_CASSE), texte: "de casse, l'objectif de l'année ; 2 % dès ce trimestre" },
    { fort: taux(SERVICE_ATTENDU), texte: "de taux de service, ce qu'attendent les enseignes" },
    { fort: kE(BUDGET), texte: "de marge nette au budget du trimestre" },
    { fort: "8 jours", texte: "au plus entre la fabrication d'un pot et son départ de l'usine" },
  ],
  jugement:
    "La direction juge le trimestre en euros : la marge sur coût variable des ventes, moins la casse (au coût variable, nette de ce que rapportent les surplus vendus ou donnés), les pénalités logistiques, les changements de série et les samedis, plus l'effet que l'on peut attendre sur l'automne de ce que le trimestre a mis en place ou abîmé.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre plan de production",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les lignes continuent de tourner en grandes séries sans que rien ne change.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Gurvan Kerebel",
        role: "Responsable de production, Loudéac",
        alerte: true,
        texte: `Pendant ce temps, les séries de la semaine sont parties sur l'ancien plan : ${euros(perdu)} de casse en plus.`,
      };
    },
  },
  prevision: {
    libelle: `la taille de lot économique de la ${REFERENCE_PREVISION.nom}, en milliers de pots`,
    unite: "milliers de pots",
    placeholder: "200",
    min: 0,
    max: 2000,
    step: 1,
    reel: (t) => t.lotEconomique,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "casse",
      nom: "Casse",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `en part du chiffre d'affaires, semaine ${semaine} ; objectif : ${taux(OBJECTIF_CASSE)}`
          : `au printemps, en part du chiffre d'affaires ; objectif : ${taux(OBJECTIF_CASSE)}`,
    },
    {
      cle: "serviceCeltis",
      nom: "Service à Celtis",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: 1,
      aide: () => `attendu : ${taux(SERVICE_ATTENDU)}`,
    },
    {
      cle: "charge",
      nom: "Charge des lignes",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: -1,
      aide: () => "au-delà de 95 % des heures ouvertes : des samedis, puis des ruptures",
    },
    {
      cle: "penalites",
      nom: "Pénalités logistiques",
      format: kE,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "depuis juillet, les trois enseignes"
          : `au printemps : ${kE(PENALITES_PRINTEMPS)}`,
    },
    {
      cle: "resultat",
      nom: "Marge nette",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `depuis juillet ; budget à date : ${kE(l.budgetADate ?? 0)}`
          : `budget du trimestre : ${kE(BUDGET)}`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.resultat ?? 0) / BUDGET)),
              enRetard: (l.resultat ?? 0) < l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    return {
      casse: taux(l.casse ?? 0),
      service: taux(l.serviceCeltis ?? 0),
      charge: taux(l.charge ?? 0, 0),
      penalites: kE(l.penalites ?? 0),
      resultat: kE(l.resultat ?? 0),
      palettes: palettes(l.cassePots ?? 0),
      partenariat: l.partenariat === 1,
      petitesSeries: decisions[D.series] === 2,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const casse =
      semaines.reduce((x, w) => x + w.cassePots, 0) / semaines.reduce((x, w) => x + w.commandes, 0);
    const couts = semaines.reduce((x, w) => x + w.penalites + w.coutChangements + w.samedis, 0);
    return [
      [`Casse, sem. ${de} à ${a}`, taux(casse)],
      [`Service à Celtis, sem. ${a}`, taux(t.semaines[a]!.serviceCeltis)],
      ["Pénalités, changements et samedis", kE(couts)],
    ];
  },
  courbe: {
    titre: "Casse, semaine par semaine, en part du chiffre d'affaires",
    cle: "casse",
    cible: OBJECTIF_CASSE,
    libelleCible: `objectif : ${taux(OBJECTIF_CASSE)}`,
    graduations: [0.02, 0.05, 0.1, 0.15],
    format: (v) => taux(v, 0),
    details: (s) => [
      `casse ${taux(s.casse!)} · ${palettes(s.cassePots!)} palettes`,
      `service à Celtis ${taux(s.serviceCeltis!)} · lignes à ${taux(s.charge!, 0)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.celtis && (choix === 0 || choix === 1)) {
      // Celtis répond selon le hasard du trimestre, et selon ce qu'on lui propose.
      const oui = celtisAccepte([...NEUTRE.slice(0, D.celtis), choix], graine);
      const texte =
        choix === 0
          ? oui
            ? REPONSES.accepteContrepartie
            : REPONSES.refuseContrepartie
          : oui
            ? REPONSES.accepteSimple
            : REPONSES.refuseSimple;
      return [{ ...NEDJMA, texte }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.t;
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (chemin[D.series] === 2 && dans(3)) {
      lies.push({
        ...ERWANN,
        heure: "sem. 3",
        alerte: true,
        texte: `Avec les petites séries, les lignes passent un quart de leur temps à changer de recette. Il a fallu ouvrir le samedi, et certaines commandes partent incomplètes.`,
      });
    }
    if (arrive.partenariat) {
      lies.push({
        ...ALWENA,
        heure: `sem. ${PARTENARIAT.debut}`,
        texte:
          "Les premiers volumes promotionnels et les commandes fermes de Celtis sont arrivés : quatre semaines de visibilité sur ses promotions et ses faibles rotations.",
      });
    }
    if (arrive.compensation) {
      lies.push({
        ...NAIM,
        heure: "sem. 9",
        alerte: true,
        texte: `L'acheteur d'Opaline a trouvé nos crèmes desserts à 0,99 € les quatre chez un soldeur de Lamballe. Il exige ${taux(COMPENSATION.remise, 0)} de remise sur toute la marque pendant deux mois, à partir de la semaine 10 : ${euros(COMPENSATION_SEMAINE)} par semaine.`,
      });
    }
    if (arrive.dereferencement) {
      lies.push({
        ...GLENMOR,
        heure: "sem. 10",
        alerte: true,
        texte: `Vu votre taux de service de l'été, nous arrêterons ${DEREFERENCEMENT.references} de vos faibles rotations au 1er janvier. Le Groupe Nordal reprendra les linéaires.`,
      });
    }
    if (dans(12)) {
      lies.push({
        ...NEDJMA,
        heure: "sem. 12",
        texte: `L'opération de rentrée se termine : elle a fait ${taux(t.rentree, 0)} du volume annoncé.`,
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
      `${kE(t.trimestre)} de marge nette sur le trimestre, ${signe(t.suite)} attendus sur l'automne`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge sur coût variable du trimestre, moins la casse nette, les pénalités logistiques, les changements de série et les samedis, plus l'effet attendu sur l'automne, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const septembre = serviceSeptembre(t);
      return [
        {
          nom: "Casse du trimestre",
          valeur: taux(t.casseTaux),
          aide: `printemps : ${taux(CASSE_DEPART)} ; trajectoire du trimestre : ${taux(TRAJECTOIRE_CASSE, 0)}`,
          tenu: t.casseTaux <= TRAJECTOIRE_CASSE,
        },
        {
          nom: "Service à Celtis en septembre",
          valeur: taux(septembre),
          aide: `semaines 10 à 13 ; attendu : ${taux(SERVICE_ATTENDU)}`,
          tenu: septembre >= SERVICE_ATTENDU,
        },
        {
          nom: "Pénalités logistiques",
          valeur: kE(t.penalites),
          aide: `printemps : ${kE(PENALITES_PRINTEMPS)} ; objectif : −40 %`,
          tenu: t.penalites <= PENALITES_PRINTEMPS * 0.6,
        },
        {
          nom: "Effet sur l'automne",
          valeur: signe(t.suite),
          aide: "prévision partagée, prix de la marque, références, règle de pilotage",
          tenu: t.suite >= 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const lignes: { titre: string; texte: string }[] = h.imprevus.map(({ imprevu, semaine }) => ({
        titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
        texte: imprevu.texte,
      }));
      if (t.celtisAccepte) {
        lignes.push({
          titre: "Celtis",
          texte: `a accepté de partager ses volumes promotionnels et ses commandes fermes ; avec une contrepartie, elle accepte deux fois sur trois, sans, une fois sur cinq.`,
        });
      }
      lignes.push({
        titre: "L'opération de rentrée",
        texte: `a fait ${taux(t.rentree, 0)} du volume annoncé ; d'une opération à l'autre, l'écart est de ${taux(ERREUR_PROMO, 0)} en moyenne.`,
      });
      if (t.compensation) {
        lignes.push({
          titre: "Opaline",
          texte: `a vu la marque chez un soldeur et obtenu ${taux(COMPENSATION.remise, 0)} de remise pendant deux mois : plus on déstocke, plus c'est probable.`,
        });
      }
      if (t.dereferencement) {
        lignes.push({
          titre: "Celtis",
          texte: `déréférence ${DEREFERENCEMENT.references} faibles rotations au 1er janvier, après un été sous les ${taux(DEREFERENCEMENT.seuil)} de service : ${kE(DEREFERENCEMENT.cout)} de marge en moins sur le trimestre suivant.`,
        });
      }
      if (t.lotNonConforme) {
        lignes.push({
          titre: "La DLC à 35 jours",
          texte: `En octobre, un lot de desserts s'est révélé non conforme à 35 jours : retrait des magasins, ${kE(AUTOMNE.dlcRetrait)}. Sans étude de vieillissement, c'était un lot sur trois.`,
        });
      }
      lignes.push({
        titre: "Les surplus",
        texte: [
          t.donne > 0 ? `${palettes(t.donne)} palettes données aux associations` : null,
          t.destocke > 0 ? `${palettes(t.destocke)} palettes de marque vendues aux soldeurs` : null,
          `${nombre(t.casseTaux * 100)} % de casse sur le trimestre, contre ${nombre(CASSE_DEPART * 100)} % au printemps`,
        ]
          .filter(Boolean)
          .join(", ")
          .concat("."),
      });
      return lignes;
    },
  },
  comportements,
  axe,
};
