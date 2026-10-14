/**
 * ÉPISODE 98 — LA PROMOTION QUI REMPLIT LES CADDIES, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Morwenna montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BASE_TOTALE,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  SERVICE_EXIGE,
  SEUIL_HABITUDE,
  SEUIL_ROTATION,
  evenements,
  hasard,
  nordalProlonge,
  prospectusChange,
  simuler,
  tableauDeBord,
  type BilanOperation,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/promotion-qui-coute";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/promotion-qui-coute";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const BESCOND = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const LEFEUVRE = { de: "Naïm Lefeuvre", role: "Directeur des grands comptes et des MDD" } as const;
const MAINGUENE = {
  de: "Cyrielle Mainguené",
  role: "Acheteuse produits laitiers frais, centrale d'achat de Celtis",
} as const;
const GOURVENNEC = { de: "Arzhela Gourvennec", role: "Cheffe de secteur, Celtis" } as const;

const NOM_ENSEIGNE = { celtis: "Celtis", opaline: "Opaline", proxival: "Proxival" } as const;
const packs = (v: number) => `${nombre(v, 0)} packs`;
/** Une marge avec son signe : « +3 k€ », « −27 k€ ». */
const signe = (v: number) => `${v >= 0 ? "+" : ""}${kE(v)}`;

/** Ce que les décisions révèlent, dans l'ordre où une cheffe de marque les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui décomposaient le pic de mars et chiffraient l'opération",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    decomposition:
      "Votre diagnostic de la semaine 1 était juste : le pic de ventes n'était pas un gain. Sur cent packs de plus, trente étaient pris aux autres yaourts de la marque et quarante-cinq manquaient les semaines suivantes, et la remise portait sur tout ce qui se serait vendu sans elle.",
    remise:
      "En semaine 1, vous avez vu que la remise du « 2+1 » était trop profonde : c'est vrai, mais même à −20 %, une opération sur les fruits perdait de l'argent. Ce qui la condamnait, c'est d'où venaient les packs de plus : des autres références et des semaines suivantes.",
    frequence:
      "En semaine 1, vous avez retenu le diagnostic du directeur commercial : pas assez d'opérations. Or chaque « 2+1 » sur les fruits perdait 27 k€, et le plafond légal était presque atteint.",
    execution:
      "En semaine 1, vous avez retenu la casse et les ruptures. Elles coûtaient quelques milliers d'euros par opération ; le « 2+1 » en perdait 27 000 avant même la première palette déclassée.",
  };
  const justes = ["decomposition", "remise"];
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
    score: d === "decomposition" ? 1 : d === "remise" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais jugé une promotion à son volume : ni doublement, ni mesure avant-après, ni « 2+1 » confirmé, ni annulation en bloc, ni riposte en prix, ni −34 % accepté."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions une réponse qui juge la promotion à son volume : doubler les opérations, la mesurer avant-après, confirmer le « 2+1 », tout annuler d'un coup, riposter en prix, accepter les −34 %.${
            t.plafondDepasse
              ? " Le plafond légal a fait réduire ou refuser une partie de vos opérations."
              : ""
          }${
            t.partPromo > SEUIL_HABITUDE
              ? ` Sur l'année, ${taux(t.partPromo, 0)} des volumes partent en promotion : les acheteurs apprennent à attendre la suivante.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.operationType / 1000,
    "pour la marge incrémentale du « 2+1 » de Celtis en semaines 3 et 4",
    "k€",
    { juste: 3, proche: 8 },
    (e) => `${nombre(e)} k€`,
  );

  const mesure = p.chemin[D.mesure] === 0 || p.chemin[D.mesure] === 2;
  const cible = p.chemin[D.plan] === 2;
  const sansPrix = (p.chemin[D.nordal] === 1 || p.chemin[D.nordal] === 2) && p.chemin[D.fin] === 2;
  const tenus = [mesure, cible, sansPrix].filter(Boolean).length;
  const ciblage: Constat = {
    score: tenus === 3 ? 1 : tenus === 2 ? 0.6 : 0,
    texte: `${
      mesure
        ? "Vous avez mesuré les nouveaux acheteurs avant de décider juillet."
        : "Vous avez décidé juillet sur l'avant-après, qui ne distingue pas un nouvel acheteur d'un achat avancé."
    } ${
      cible
        ? "Vous avez porté la remise sur la référence qui pouvait recruter, le Brassé."
        : "La remise est restée sur les packs que vos habitués achètent de toute façon."
    } ${
      sansPrix
        ? "Face à Nordal puis à Celtis, vous avez défendu le rayon sans baisser le prix de vos habitués."
        : "Face à Nordal ou à Celtis, vous avez répondu par le prix, ou pas du tout."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, ciblage];
}

export function axe([information, diagnostic, reflexe, calibrage, ciblage]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Décomposer le pic avant de le juger",
      texte:
        "Rejouez l'épisode en faisant décomposer d'abord l'opération de mars : d'où vient chaque pack de plus, et ce que la remise coûte sur ceux qui se seraient vendus sans elle. Le volume ne dit rien de la marge.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Juger une promotion sur sa marge, pas sur son volume",
      texte:
        "Une opération se juge à sa marge incrémentale : ce qu'elle rapporte de plus qu'un trimestre sans elle, une fois retirés les packs pris aux autres références, le creux des semaines suivantes, la remise, la logistique et la casse. Doubler, riposter en prix ou accepter le maximum légal multiplie surtout ce qui coûte.",
    };
  }
  if (ciblage!.score === 0) {
    return {
      titre: "Mesurer, puis cibler",
      texte:
        "Une promotion qui rapporte se choisit : la référence qui recrute, l'enseigne où l'on est challenger, une remise juste assez forte. Un test avec des magasins témoins dit, avant de généraliser, si elle trouve de nouveaux acheteurs.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher d'où vient chaque pack de plus",
      texte:
        "Quand les ventes bondissent pendant une promotion, demandez qui achète en plus : un client de la marque qui change de référence, un habitué qui stocke, ou un nouvel acheteur. Seul le dernier ajoute de la marge.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le compte de l'opération de mars : la marge des packs vendus en « 2+1 », moins celle qu'auraient faite sans elle la base, les packs pris aux autres références et les achats avancés, moins le prospectus.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** Les semaines d'une opération : « semaines 9 et 10 », « semaines 10 à 12 ». */
const quand = (b: BilanOperation) =>
  b.op.duree === 2
    ? `semaines ${b.op.debut} et ${b.op.debut + 1}`
    : `semaines ${b.op.debut} à ${b.op.debut + b.op.duree - 1}`;

/** Ce que l'usine dit d'une opération qui a laissé de la casse ou manqué de produits. */
function messageUsine(b: BilanOperation): string {
  const ou = `de ${NOM_ENSEIGNE[b.op.enseigne]}, ${quand(b)},`;
  return b.rupture > b.casse
    ? `L'opération ${ou} a manqué de produits : ${packs(b.rupture)} commandés n'ont pas pu être livrés. Pénalités logistiques à la clé${b.op.recrutement ? ", et autant de clients qui n'ont pas goûté le Brassé" : ""}.`
    : `L'opération ${ou} est finie : ${packs(b.casse)} produits en trop n'ont pas trouvé preneur dans les délais de DLC. Déclassés, une partie donnée à la banque alimentaire.`;
}

function messageReduite(b: BilanOperation): string {
  const ou = `${NOM_ENSEIGNE[b.op.enseigne]} (${quand(b)})`;
  return b.acceptee === 0
    ? `${ou} refuse l'opération : elle dépasserait le plafond légal de 25 % du volume annuel vendu en promotion. Rien n'est signé.`
    : `${ou} ne signe l'opération que pour ${taux(b.acceptee, 0)} du volume prévu : au-delà, le plafond légal de 25 % serait dépassé.`;
}

export const EPISODE_PROMOTION: Episode<Trimestre> = {
  code: "promotion-qui-coute",
  numero: 98,
  domaine: "Mesurer le vrai gain d'une promotion",
  titre: "La promotion qui remplit les caddies",
  resume:
    "Les « 2 achetés, le 3e offert » font bondir les ventes de 180 %, et le directeur commercial veut en doubler le nombre. Mesurer ce que chaque opération rapporte vraiment, puis cibler.",
  persona:
    "Vous êtes Morwenna Pellen, cheffe de marque des yaourts Kerbrélan à la Laiterie de Kerbrélan, à Loudéac. Vous rendez compte à Herveline Daniélou, directrice marketing et innovation, et vous travaillez avec Baptistin Haddadi, directeur commercial, Naïm Lefeuvre, directeur des grands comptes, et Ysée Bescond, responsable supply chain. Le trimestre va de mai à juillet.",
  mandat: [
    { fort: "+180 %", texte: "de ventes pendant les « 2 achetés, le 3e offert » de mars" },
    {
      fort: "6 opérations",
      texte: "au plan signé avec Celtis, Opaline et Proxival, de mai à juillet",
    },
    { fort: "25 %", texte: "du volume annuel en promotion : le plafond légal, presque atteint" },
    { fort: "2 points", texte: "de part de marché pris par Nordal depuis janvier" },
  ],
  jugement:
    "La direction juge le trimestre sur la marge incrémentale des promotions : ce qu'elles rapportent de plus qu'un trimestre sans promotion, remise, logistique, casse, creux et ventes prises aux autres références comprises, avec l'effet durable sur la marque qu'on peut en estimer fin juillet.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Les yaourts Kerbrélan",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, Baptistin confirme de lui-même aux centrales des mises en avant qu'il faudra décommander à vos frais.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...LEFEUVRE,
        alerte: true,
        texte: `Pendant ces jours d'enquête, Baptistin a confirmé aux centrales des mises en avant que nous avons dû décommander : ${euros(perdu)} de frais dus aux enseignes.`,
      };
    },
  },
  prevision: {
    libelle:
      "la marge incrémentale du « 2 achetés, le 3e offert » de deux semaines sur les fruits chez Celtis (semaines 3 et 4), en milliers d'euros",
    unite: "k€",
    placeholder: "0",
    min: -100,
    max: 100,
    step: 0.5,
    reel: (t) => t.operationType / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "ventes",
      nom: "Ventes de la gamme",
      format: packs,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `semaine ${semaine}, dont ${packs(l.promo ?? 0)} en promotion`
          : "par semaine, hors promotion, en mai",
    },
    {
      cle: "marge",
      nom: "Marge incrémentale",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "cumulée depuis mai, par rapport à un trimestre sans promotion"
          : "par rapport à un trimestre sans promotion",
    },
    {
      cle: "plafond",
      nom: "Plafond légal chez Celtis",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => "part des 25 % du volume annuel engagée, plan d'août à décembre compris",
      jauge: (l) =>
        l.plafond == null ? null : { part: Math.min(1, l.plafond), enRetard: l.plafond > 0.95 },
    },
    {
      cle: "service",
      nom: "Taux de service",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: () => `exigé par les enseignes : ${taux(SERVICE_EXIGE)}`,
    },
    {
      cle: "casse",
      nom: "Casse",
      format: packs,
      sensBon: -1,
      aide: (semaine) => (semaine ? "packs déclassés ou détruits depuis mai" : "depuis mai"),
    },
  ],
  contexte(l, decisions) {
    return {
      ventes: packs(l.ventes ?? 0),
      marge: kE(l.marge ?? 0),
      plafond: taux(l.plafond ?? 0, 0),
      service: taux(l.service ?? 0),
      casseC1: nombre(l.casseC1 ?? 0, 0),
      ruptureC1: nombre(l.ruptureC1 ?? 0, 0),
      brasseC1: l.brasseC1 === 1,
      annonceC1: nombre(l.annonceC1 ?? 0, 0),
      liftC1: nombre(l.liftC1 ?? 0, 0),
      mesure: decisions[D.mesure] === 0 || decisions[D.mesure] === 2,
      test: decisions[D.mesure] === 0,
      recrute: l.recrute === 1,
      double: decisions[D.plan] === 0,
      placeCeltis: nombre(l.placeCeltis ?? 0, 0),
      placeOpaline: nombre(l.placeOpaline ?? 0, 0),
      rotation: nombre(l.rotation ?? 0, 0),
      partPromo: taux(l.partPromo ?? 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const ventes = semaines.reduce((x, w) => x + w.ventes, 0);
    const promo = semaines.reduce((x, w) => x + w.promo, 0);
    return [
      ["Ventes de la période", packs(ventes)],
      ["Dont en promotion", taux(promo / Math.max(1, ventes), 0)],
      ["Marge incrémentale de la période", kE(semaines.reduce((x, w) => x + w.marge, 0))],
    ];
  },
  courbe: {
    titre: "Ventes de la gamme, semaine par semaine",
    cle: "ventes",
    cible: BASE_TOTALE,
    libelleCible: `${nombre(BASE_TOTALE, 0)} packs par semaine : les ventes de mai sans promotion`,
    graduations: [25000, 50000, 75000, 100000, 125000],
    format: (v) => `${nombre(v / 1000, 0)} k`,
    details: (s) => [
      `${packs(s.ventes!)} · dont ${packs(s.promo!)} en promotion`,
      `marge de la semaine ${signe(s.marge!)} · service ${taux(s.service!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.plan && choix === 2) {
      // Celtis accepte ou non de changer un prospectus déjà en maquette : le hasard du trimestre.
      return [
        {
          ...MAINGUENE,
          texte: prospectusChange(graine) ? REPONSES.prospectusOui : REPONSES.prospectusNon,
        },
      ];
    }
    if (etape === D.nordal && choix === 0) {
      // Nordal répond à la riposte selon le hasard du trimestre.
      const prolonge = nordalProlonge([...NEUTRE.slice(0, D.nordal), 0], graine);
      return [
        {
          ...GOURVENNEC,
          alerte: prolonge,
          texte: prolonge ? REPONSES.nordalProlonge : REPONSES.nordalArrete,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.t;
    const lies: Message[] = [];
    for (const b of arrive.reduites) {
      lies.push({
        ...LEFEUVRE,
        heure: `sem. ${Math.max(2, b.op.debut - 1)}`,
        alerte: true,
        texte: messageReduite(b),
      });
    }
    for (const b of arrive.usine) {
      lies.push({
        ...BESCOND,
        heure: `sem. ${b.op.debut + b.op.duree}`,
        alerte: b.rupture > b.casse,
        texte: messageUsine(b),
      });
    }
    if (arrive.emplacements) {
      lies.push({ ...LEFEUVRE, heure: "sem. 9", alerte: true, texte: REPONSES.emplacements });
    }
    if (arrive.capture) {
      lies.push({ ...GOURVENNEC, heure: "sem. 11", texte: REPONSES.capture });
    }
    if (arrive.prolonge && chemin[D.nordal] !== 0) {
      lies.push({ ...GOURVENNEC, heure: "sem. 13", alerte: true, texte: REPONSES.prolonge });
    }
    if (arrive.revue) {
      lies.push({
        ...MAINGUENE,
        heure: "sem. 13",
        alerte: t.dereference,
        texte: `Revue de gamme : le Brassé fermier a vendu ${packs(t.rotation)} par semaine en moyenne depuis la semaine 8, pour un seuil de ${nombre(SEUIL_ROTATION, 0)}. ${
          t.dereference
            ? "Il quittera la moitié de nos magasins en septembre, jusqu'à la revue de janvier."
            : "Il garde tous ses magasins."
        }`,
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
    titre: (t) => {
      const neutre = simuler(NEUTRE, t.graine).objectif;
      return `${signe(t.objectif)} de marge incrémentale, effets durables compris${
        t.objectif > neutre ? ` ; le plan signé, tenu tel quel, aurait fait ${signe(neutre)}` : ""
      }`;
    },
    formatObjectif: kE,
    noteDesBarres:
      "Marge incrémentale du trimestre par rapport à un trimestre sans promotion, effets durables estimés compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const faites = t.ops.filter((b) => b.acceptee > 0);
      const rentables = faites.filter((b) => b.marge + b.recrues >= 0).length;
      return [
        {
          nom: "Opérations rentables",
          valeur: `${rentables} sur ${faites.length}`,
          aide: "marge incrémentale positive, acheteurs recrutés compris",
          tenu: faites.length > 0 && rentables * 2 >= faites.length,
        },
        {
          nom: "Volume vendu en promotion",
          valeur: taux(t.partPromo, 0),
          aide: "sur l'année ; au-delà de 20 %, les clients attendent la promotion",
          tenu: t.partPromo <= SEUIL_HABITUDE,
        },
        {
          nom: "Taux de service",
          valeur: taux(t.serviceMoyen),
          aide: `en moyenne ; exigé ${taux(SERVICE_EXIGE)} ; ${packs(t.casse)} de casse`,
          tenu: t.serviceMoyen >= SERVICE_EXIGE,
        },
        {
          nom: "Le Brassé chez Celtis",
          valeur: t.dereference ? "déréférencé à moitié" : "maintenu",
          aide: `${packs(t.rotation)} par semaine à la revue ; seuil ${nombre(SEUIL_ROTATION, 0)}`,
          tenu: !t.dereference,
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
          titre: "Le Brassé fermier",
          texte: t.recrute
            ? "recrutait vraiment : sept packs de plus sur dix venaient de nouveaux acheteurs, qui ont racheté au prix normal."
            : "déplaçait surtout vos acheteurs : un pack de plus sur dix seulement venait d'un nouvel acheteur.",
        },
        ...(t.prospectusRefuse
          ? [
              {
                titre: "Celtis",
                texte:
                  "a refusé de changer le prospectus de la semaine 3, déjà à l'impression : le « 2+1 » sur les fruits a eu lieu.",
              },
            ]
          : []),
        {
          titre: "Nordal",
          texte: `a pris jusqu'à ${taux(t.volNordal, 0)} de vos ventes chez Celtis et Opaline${
            t.nordalRompt ? ", a manqué de produits en semaines 11 et 12" : ""
          }${t.nordalProlonge ? ", et a prolongé son opération jusqu'à la mi-août" : ""}.`,
        },
        {
          titre: "La revue de gamme",
          texte: `${packs(t.rotation)} de Brassé par semaine chez Celtis, pour un seuil de ${nombre(SEUIL_ROTATION, 0)} : ${
            t.dereference ? "déréférencé dans la moitié des magasins" : "maintenu partout"
          }.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
