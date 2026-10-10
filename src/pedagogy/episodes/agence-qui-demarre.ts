/**
 * ÉPISODE 12 — L'AGENCE QUI DÉMARRE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Manon montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  CA_POINT_MORT,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PLAN,
  PLAN_REGULIERS,
  POINT_MORT,
  REGULIERS_DEPART,
  TAUX_ARTISAN,
  evenements,
  forceDuReseau,
  hasard,
  morelAccepte,
  morelFragile,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/agence-qui-demarre";
import {
  ATTENTES,
  DIAGNOSTICS,
  ETAPES,
  PRIX,
  REFERENCES,
  REPONSES,
} from "@/config/episodes/agence-qui-demarre";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un écart au plan d'affaires : positif, l'agence fait mieux que prévu. */
const ecartAuPlan = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du plan d'affaires` : `${kE(-v)} sous le plan d'affaires`;
const artisans = (v: number) => {
  const n = Math.round(v);
  return `${n} artisan${n > 1 ? "s" : ""}`;
};
/** Le stock dormant que l'agence peut porter sans que cela se voie dans ses comptes. */
const DORMANT_ACCEPTABLE = 100000;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient qui sont les artisans et ce qui les retient chez Rivoire",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    service:
      "Votre diagnostic de la semaine 1 était juste : les artisans restaient chez Rivoire pour l'ouverture à 6 h 30 et la livraison sur chantier, pas pour le prix.",
    notoriete:
      "En semaine 1, vous avez vu que l'agence était mal connue : c'était vrai, mais les artisans qui l'avaient essayée ne revenaient pas. Ce qui leur manquait, c'était le service.",
    prix: "En semaine 1, vous avez retenu le prix ; le relevé montrait l'agence déjà un peu moins chère que Rivoire, et les artisans mettaient le prix en quatrième position.",
    equipe:
      "En semaine 1, vous avez retenu l'inexpérience de l'équipe ; les artisans ne se plaignaient pas du conseil, mais des horaires et de la livraison.",
  };
  const justes = ["service", "notoriete"];
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
    score: d === "service" ? 1 : d === "notoriete" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  // Les deux réflexes du métier : casser les prix, ou attendre que la clientèle vienne.
  const nPrix = PRIX.filter(([dec, o]) => p.chemin[dec] === o).length;
  const nAttente = ATTENTES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const n = nPrix + nAttente;
  const textePrix = `Pour faire venir du monde, vous avez baissé les prix ${nPrix} fois sur ${ETAPES.length} décisions. Les chasseurs de prix sont venus${
    t.chasseursMax >= 10 ? `, jusqu'à ${nombre(t.chasseursMax, 0)} à la fois,` : ""
  } et sont repartis avec la remise ; les artisans qui seraient venus de toute façon en ont profité. Taux de marge moyen : ${taux(t.tauxMoyen)}.`;
  const texteAttente = `Vous avez attendu que les artisans viennent d'eux-mêmes ${nAttente} fois sur ${ETAPES.length} décisions : ils n'avaient aucune raison de quitter Rivoire, et ${artisans(t.perdus)} ont cessé de venir en cours de trimestre.`;
  const prix: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cherché les clients par le prix, ni attendu qu'ils viennent : vous les avez gagnés par un service que Rivoire ne rendait pas."
        : // Le réflexe qui l'a emporté vient en premier : c'est lui que l'axe de travail vise.
          (nPrix >= nAttente
            ? [nPrix ? textePrix : null, nAttente ? texteAttente : null]
            : [texteAttente, nPrix ? textePrix : null]
          )
            .filter(Boolean)
            .join(" "),
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.ca / 1000,
    "de chiffre d'affaires en semaine 3",
    "k€",
    { juste: 2, proche: 5 },
    (e) => `${nombre(e)} k€`,
  );

  const stockAjuste = p.chemin[D.stock] === 0;
  const morelCadre = p.chemin[D.morel] !== 0;
  const prudence = (stockAjuste ? 1 : 0) + (morelCadre ? 1 : 0);
  const domaine: Constat = {
    score: prudence === 2 ? 1 : prudence === 1 ? 0.6 : 0,
    texte: `${
      stockAjuste
        ? "Vous avez ramené le stock à la demande réelle : moins de références dormantes, plus de ce que les artisans viennent chercher."
        : p.chemin[D.stock] === 2
          ? "Vous avez réduit le stock partout, sans regarder ce qui tournait : les ruptures ont frappé ce que les artisans venaient chercher."
          : p.chemin[D.stock] === 1
            ? "Vous avez soldé le stock dormant : de la trésorerie, mais vendue à perte, à des clients qui ne reviendront pas."
            : `Vous avez gardé un stock d'agence mature : ${kE(t.dormantFinal)} dormaient encore en fin de trimestre.`
    } ${
      morelCadre
        ? "Avec Morel Bâtiment, vous n'avez pas acheté du volume au prix de la marge et du risque."
        : `Vous avez accepté les conditions de Morel Bâtiment : du volume sans marge${
            t.morelImpaye > 0
              ? `, et ${kE(t.morelImpaye)} d'impayés quand il a été placé en redressement judiciaire`
              : ", et un risque d'impayé que le service crédit avait signalé"
          }.`
    }`,
  };

  return [information, diagnostic, prix, calibrage, domaine];
}

export function axe([information, diagnostic, prix, calibrage, domaine]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  // Le constat des réflexes commence par celui qui l'a emporté : le prix, ou l'attente.
  const parLePrix = prix!.texte.startsWith("Pour faire venir du monde");
  if (information!.score < 0.5) {
    return {
      titre: "Aller voir les clients avant d'agir",
      texte:
        "Rejouez l'épisode en interrogeant d'abord les artisans sur leurs chantiers : ce qui les retenait chez Rivoire n'était pas le prix, et une matinée suffisait pour l'apprendre.",
    };
  }
  if (prix!.score === 0 && !parLePrix) {
    return {
      titre: "Aller chercher les clients plutôt que les attendre",
      texte:
        "Une agence neuve n'a pas d'habitués : ceux du concurrent ne viendront pas seuls. Allez sur les chantiers, trouvez ce qui manque aux artisans, et offrez-le.",
    };
  }
  if (prix!.score === 0) {
    return {
      titre: "Gagner les clients par le service, pas par le prix",
      texte:
        "Une remise fait venir ceux qui cherchent une remise, et repartir ceux-là dès qu'elle s'arrête. Cherchez ce que le concurrent ne fait pas, et faites-le.",
    };
  }
  if (domaine!.score === 0) {
    return {
      titre: "Proportionner le stock et le risque à l'agence",
      texte:
        "Une agence qui démarre n'a ni le stock ni l'encours d'une agence mature. Adaptez l'assortiment à ce qui se vend, et faites des conditions qui protègent votre marge et votre trésorerie.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui retient les clients ailleurs",
      texte:
        "Quand les clients ne viennent pas, demandez-leur pourquoi ils vont ailleurs avant de chercher à vous faire connaître : on ne quitte pas un fournisseur qu'on ne connaît pas, mais on ne quitte pas non plus un fournisseur qui sert bien.",
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

const KEVIN = { de: "Kevin Lopes", role: "Vendeur comptoir" } as const;
const MOREL = { de: "Didier Morel", role: "Gérant, Morel Bâtiment" } as const;
const CREDIT = { de: "Service crédit", role: "Siège" } as const;

export const EPISODE_LANCEMENT: Episode<Trimestre> = {
  code: "agence-qui-demarre",
  numero: 2,
  domaine: "Développement d'activité",
  titre: "L'agence qui démarre",
  resume:
    "Une agence neuve dont les artisans restent fidèles au négoce d'en face. Connaître ses clients avant de baisser ses prix.",
  persona:
    "Vous êtes Manon Pellerin, directrice de l'agence Arvel Distribution de Bourgoin-Jallieu, ouverte il y a un mois. Votre équipe, toute neuve : Kevin Lopes au comptoir, Samia Haddou au dépôt et Bastien Morin, commercial terrain.",
  mandat: [
    { fort: kE(POINT_MORT), texte: "de marge brute par semaine : le point mort" },
    { fort: `${PLAN_REGULIERS} artisans`, texte: "réguliers en semaine 13, au plan d'affaires" },
    { fort: kE(PLAN), texte: "de contribution sur le trimestre, acquisition et stock déduits" },
    { fort: taux(TAUX_ARTISAN, 0), texte: "de taux de marge sur les artisans" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au plan d'affaires : la marge de l'agence, moins ce qu'ont coûté les promotions, la prospection, le service et le stock.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre agence",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des chantiers démarrent sans vous : les artisans qui hésitaient commandent chez Rivoire.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...KEVIN,
        alerte: true,
        texte: `Pendant ce temps, deux artisans qui avaient demandé un devis l'ont passé chez Rivoire : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "le chiffre d'affaires de la semaine 3, en k€",
    unite: "k€",
    placeholder: "24",
    min: 0,
    max: 100,
    step: 0.5,
    reel: (t) => t.semaines[3]!.ca / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "clients",
      nom: "Clients professionnels actifs",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `dont ${artisans(l.reguliers ?? 0)} réguliers ; plan : ${PLAN_REGULIERS} en semaine 13`
          : `dont ${artisans(l.reguliers ?? 0)} réguliers, après un mois`,
    },
    {
      cle: "ca",
      nom: "Chiffre d'affaires de la semaine",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `plan : ${kE(l.planCA ?? 0)} ; point mort : ${kE(CA_POINT_MORT)}`
          : `la semaine dernière ; plan : ${kE(30000)}`,
      jauge: (l) =>
        l.ca === null
          ? null
          : {
              part: Math.min(1, (l.ca ?? 0) / CA_POINT_MORT),
              enRetard: (l.ca ?? 0) < (l.planCA ?? 0),
            },
    },
    {
      cle: "taux",
      nom: "Taux de marge",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => `plan : ${taux(TAUX_ARTISAN, 0)} sur les artisans`,
    },
    {
      cle: "retour",
      nom: "Clients revenus",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "clients pros de la semaine précédente, revenus cette semaine"
          : "clients pros revenus d'une semaine sur l'autre",
    },
    {
      cle: "stockDormant",
      nom: "Stock dormant",
      format: kE,
      sensBon: -1,
      aide: (_semaine, l) =>
        `sans une vente depuis l'ouverture ; stock total : ${kE(l.stock ?? 0)}`,
    },
  ],
  contexte(l, decisions) {
    return {
      ca: kE(l.ca ?? 0),
      reguliers: nombre(l.reguliers ?? 0, 0),
      taux: taux(l.taux ?? 0),
      stock: kE(l.stock ?? 0),
      dormant: kE(l.stockDormant ?? 0),
      perdus: nombre(l.perdus ?? 0, 0),
      service: decisions[D.frequentation] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [`Artisans réguliers, sem. ${a}`, nombre(t.semaines[a]!.reguliers, 0)],
      [`Taux de marge, sem. ${a}`, taux(t.semaines[a]!.taux)],
      ["Contribution de la période", kE(semaines.reduce((x, w) => x + w.contribution, 0))],
    ];
  },
  courbe: {
    titre: "Marge brute, semaine par semaine",
    cle: "margeBrute",
    cible: POINT_MORT,
    libelleCible: `point mort : ${kE(POINT_MORT)} par semaine`,
    graduations: [5000, 11000, 15000, 20000, 25000],
    format: kE,
    details: (s) => [
      `marge ${kE(s.margeBrute!)} · CA ${kE(s.ca!)} · taux ${taux(s.taux!)}`,
      `${artisans(s.reguliers!)} réguliers · ${nombre(s.chasseurs!, 0)} chasseurs de prix`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.morel && choix === 1) {
      // Seul le choix de proposer compte : Morel répond selon le hasard du trimestre.
      return [
        { ...MOREL, texte: morelAccepte(graine) ? REPONSES.morelAccepte : REPONSES.morelRefuse },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.trimestre;
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (arrive.promoFinie) {
      lies.push({
        ...KEVIN,
        heure: "sem. 5",
        texte:
          "La promotion est finie depuis lundi. Les clients du flyer ne reviennent pas ; les artisans habitués, eux, ont eu −15 % sur ce qu'ils auraient acheté de toute façon.",
      });
    }
    if (arrive.morelRecommande) {
      lies.push({
        ...MOREL,
        heure: "sem. 10",
        texte:
          "Trois livraisons à l'heure sur mes chantiers. J'ai dit à mes sous-traitants de passer chez vous.",
      });
    }
    if (arrive.morelBloque) {
      lies.push({
        ...CREDIT,
        heure: "sem. 11",
        alerte: true,
        texte: `Morel Bâtiment a manqué son échéance : le compte est bloqué à l'encours plafonné. Il est placé en redressement judiciaire ; la perte s'arrête à ${euros(t.morelImpaye)}.`,
      });
    }
    if (arrive.morelImpaye) {
      lies.push({
        ...CREDIT,
        heure: "sem. 12",
        alerte: true,
        texte: `Morel Bâtiment est placé en redressement judiciaire. Ses achats depuis la semaine 8, payables à 60 jours, n'ont jamais été réglés : ${euros(t.morelImpaye)} de créance que nous ne reverrons pas.`,
      });
    }
    if (chemin[D.morel] === 2 && morelFragile(graine) && dans(12)) {
      lies.push({
        de: "Gérald Perrin",
        role: "Directeur régional",
        heure: "sem. 12",
        texte:
          "Tu as vu ? Morel Bâtiment est en redressement judiciaire. Rivoire y laisse une belle créance.",
      });
    }
    if (arrive.parrainage) {
      lies.push({
        ...KEVIN,
        heure: "sem. 12",
        texte:
          t.filleuls >= 3
            ? `Depuis le petit-déjeuner, ${artisans(t.filleuls)} sont venus envoyés par un confrère. Julien Caron en a amené quatre à lui seul.`
            : `Depuis le petit-déjeuner, ${artisans(t.filleuls)} seulement sont venus envoyés par un confrère. Les maçons et les plaquistes ne se parlent pas comme les plombiers.`,
      });
    }
    if (arrive.relance) {
      lies.push({
        ...KEVIN,
        heure: "sem. 13",
        texte: `Sur les ${artisans(t.perdus)} qui ne venaient plus, ${nombre(t.recuperes, 0)} sont revenus après notre appel. Plusieurs avaient des commandes en attente.`,
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
    titre: (t) => `${ecartAuPlan(t.objectif)}, acquisition et stock compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au plan d'affaires de l'agence, marge moins coûts d'acquisition, de service et de stock, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Point mort",
          valeur: kE(t.margeFinale),
          aide: `de marge brute en semaine 13 ; point mort ${kE(POINT_MORT)}`,
          tenu: t.margeFinale >= POINT_MORT,
        },
        {
          nom: "Artisans réguliers",
          valeur: nombre(t.reguliersFinal, 0),
          aide: `en semaine 13, contre ${REGULIERS_DEPART} au départ ; plan ${PLAN_REGULIERS}`,
          tenu: t.reguliersFinal >= PLAN_REGULIERS,
        },
        {
          nom: "Taux de marge",
          valeur: taux(t.tauxMoyen),
          aide: `sur le trimestre ; plan ${taux(TAUX_ARTISAN, 0)}`,
          tenu: t.tauxMoyen >= TAUX_ARTISAN - 0.01,
        },
        {
          nom: "Stock dormant",
          valeur: kE(t.dormantFinal),
          aide: `en fin de trimestre ; plafond ${kE(DORMANT_ACCEPTABLE)}`,
          tenu: t.dormantFinal <= DORMANT_ACCEPTABLE,
        },
      ];
    },
    hasard(t, graine) {
      const reseau = forceDuReseau(graine);
      const morel = morelFragile(graine)
        ? t.morelImpaye > 0
          ? `était fragile : redressement judiciaire en semaine ${t.morelBloque ? 11 : 12}, ${kE(t.morelImpaye)} d'impayés pour l'agence.`
          : "était fragile : redressement judiciaire en semaine 12, sans perte pour l'agence."
        : "était solide : il paie tard, mais il paie.";
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le bouche-à-oreille",
          texte:
            reseau === "fort"
              ? "a été fort ce trimestre : les artisans du secteur se parlaient beaucoup."
              : reseau === "moyen"
                ? "a été moyen ce trimestre."
                : "a été faible ce trimestre : les artisans du secteur se parlaient peu.",
        },
        {
          titre: "Morel Bâtiment",
          texte: t.morelRefuse ? `a refusé vos conditions de professionnel ; il ${morel}` : morel,
        },
        {
          titre: "Les artisans",
          texte: `${nombre(t.perdus, 0)} ont cessé de venir en cours de trimestre${
            t.recuperes > 0 ? `, ${nombre(t.recuperes, 0)} sont revenus après la relance` : ""
          }${t.filleuls >= 1 ? ` ; ${nombre(t.filleuls, 0)} sont venus par parrainage` : ""}.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
