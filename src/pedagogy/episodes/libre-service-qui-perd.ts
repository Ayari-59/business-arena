/**
 * LE LIBRE-SERVICE QUI PERD, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Camille montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent de sa manière de travailler.
 *
 * C'est le seul épisode où l'on joue un équipier et non un responsable : le
 * tableau de bord ne montre que des indicateurs d'équipier (la démarque, les
 * références vides, les commandes prêtes à l'heure, la satisfaction au
 * comptoir), et le bilan parle de gestes, pas de stratégie.
 */
import {
  D,
  DEMARQUE_TRIMESTRE_DERNIER,
  DEMARQUE_TRIMESTRE_DERNIER_TOTAL,
  JOURS_SANS_PERTE,
  NEUTRE,
  O,
  OBJECTIF_A_L_HEURE,
  OBJECTIF_DEMARQUE,
  OBJECTIF_RUPTURES,
  OBJECTIF_SATISFACTION,
  PERTE_PAR_JOUR,
  PLAFOND_DE_PERTES,
  SEMAINES,
  SEMAINE_ACCIDENT,
  SEMAINE_DECOLLE,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/libre-service-qui-perd";
import {
  DIAGNOSTICS,
  ETAPES,
  PREVISION,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/libre-service-qui-perd";
import type {
  Constat,
  Episode,
  Message,
  PartieJouee,
} from "@/config/episodes/types";
import { euros, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const pc = (v: number) => taux(v, 0);
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Des milliers d'euros au dixième : les pertes d'un rayon se comptent en milliers, pas en millions. */
export const kE1 = (v: number) =>
  `${v < 0 ? "−" : ""}${(Math.abs(v) / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k€`;
/** Un écart au plafond de pertes : positif, l'agence a perdu moins que le plafond. */
const ecartAuPlafond = (v: number) =>
  v >= 0
    ? `${kE1(v)} sous le plafond de pertes`
    : `${kE1(-v)} au-delà du plafond de pertes`;

/** La part de la démarque du trimestre dernier venue de la réception : « 49 % ». */
const PART_RECEPTION = pc(
  DEMARQUE_TRIMESTRE_DERNIER.reception / DEMARQUE_TRIMESTRE_DERNIER_TOTAL,
);

/** Les seuils de la prévision des commandes de la semaine 3 : juste, et proche. */
export const SEUILS_PREVISION = { juste: 3, proche: 8 } as const;

/** Ce que les décisions révèlent, dans l'ordre où un équipier les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient d'où venaient les pertes",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    reception: `Votre diagnostic de la semaine 1 était juste : ${PART_RECEPTION} de la démarque venait de colis abîmés ou manquants, signés sans réserve.`,
    dates: `En semaine 1, vous avez vu les produits périmés au fond du rayon : une vraie cause, mais pas la plus grosse. ${PART_RECEPTION} de la démarque venait de la réception.`,
    vol: "En semaine 1, vous avez retenu le vol ; la feuille de démarque le montrait petit.",
    clients:
      "En semaine 1, vous avez accusé les clients ; la casse en rayon ne pesait qu'une petite part de la démarque.",
  };
  const justes = ["reception", "dates"];
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
    score: d === "reception" ? 1 : d === "dates" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  // Les gestes réflexes, comptés par décision : aller vite, faire beau, cacher.
  const decisionsReflexes = new Set(
    REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).map(([dec]) => dec),
  );
  const n = decisionsReflexes.size;
  const vitesse: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais choisi d'aller vite au lieu de bien faire : vous avez contrôlé, rangé et déclaré, même quand c'était plus long."
        : `Vous avez choisi d'aller vite, de faire beau ou de cacher ${n} fois sur ${ETAPES.length} décisions. Le temps gagné revenait plus tard en démarque, en références vides ou en clients mécontents.${
            t.demarqueCachee > 0
              ? " Les produits abîmés cachés en réserve sont tous revenus dans la démarque à l'inventaire."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.commandes,
    "à préparer en semaine 3",
    "commandes",
    SEUILS_PREVISION,
    (e) => `${nombre(e, 0)} commande${e >= 2 ? "s" : ""}`,
  );

  const conseil = p.chemin[D.conseil] === O.conseil.decouverte;
  const reclamation = p.chemin[D.reclamation] === O.reclamation.ecouter;
  const bienRecus = (conseil ? 1 : 0) + (reclamation ? 1 : 0);
  const client: Constat = {
    score: bienRecus === 2 ? 1 : bienRecus === 1 ? 0.6 : 0,
    texte: `${
      conseil
        ? "Vous avez posé des questions au particulier avant de le conseiller, et proposé seulement ce qui lui serait utile."
        : p.chemin[D.conseil] === O.conseil.forcer
          ? "Vous avez poussé le particulier à acheter tout le rayon : le panier était gros, et les retours aussi."
          : "Le particulier n'a pas reçu de vraies questions avant d'être servi."
    } ${
      reclamation
        ? "Vous avez écouté la cliente du site, vérifié, et réglé sa réclamation tout de suite."
        : "La réclamation de la cliente du site n'a pas été réglée sur place, après vérification."
    }`,
  };

  return [information, diagnostic, vitesse, calibrage, client];
}

export function axe([
  information,
  diagnostic,
  vitesse,
  calibrage,
  client,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder où part l'argent",
      texte: `Rejouez l'épisode en lisant d'abord les bons de livraison et la feuille de démarque : ${PART_RECEPTION} de la démarque venait de colis signés sans réserve.`,
    };
  }
  if (vitesse!.score === 0) {
    return {
      titre: "Bien faire avant de faire vite",
      texte:
        "Signer sans regarder, ranger les cartons neufs devant, cacher un produit abîmé : chaque geste rapide fait gagner quelques minutes, et coûte plus tard en démarque ou en rayon vide.",
    };
  }
  if (client!.score === 0) {
    return {
      titre: "Prendre le temps du client",
      texte:
        "Un client bien reçu revient : des questions avant de conseiller, une réclamation réglée sur place. Le renvoyer ailleurs ou le forcer à acheter fait partir des clients.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher d'où viennent les pertes",
      texte:
        "Avant d'accuser le vol ou les clients, regardez la feuille de démarque : elle dit quelle part vient de la réception, des dates, de la casse et du vol.",
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

const SAMIA = { de: "Samia Haddou", role: "Cheffe d'équipe" } as const;

export const EPISODE_LIBRE_SERVICE: Episode<Trimestre> = {
  code: "libre-service-qui-perd",
  numero: 49,
  domaine: "Le métier d'équipier de commerce",
  titre: "Le libre-service qui perd",
  resume:
    "Un trimestre dans la peau d'un équipier de commerce : recevoir, ranger, réassortir, étiqueter, conseiller. Les pertes se jouent dans les gestes de tous les jours.",
  persona:
    "Vous êtes Camille Royer, en CAP Équipier polyvalent du commerce, en apprentissage à l'agence Arvel Distribution de Bourgoin-Jallieu. Vous travaillez au comptoir et au libre-service, avec Samia Haddou, votre cheffe d'équipe, et Kevin Lopes, vendeur au comptoir. Les clients : des artisans tôt le matin, et beaucoup de particuliers.",
  mandat: [
    {
      fort: euros(OBJECTIF_DEMARQUE),
      texte: "de démarque par semaine, au plus",
    },
    {
      fort: `${OBJECTIF_RUPTURES}`,
      texte: "références vides à l'ouverture, au plus",
    },
    {
      fort: pc(OBJECTIF_A_L_HEURE),
      texte: "des commandes clients prêtes à l'heure, au moins",
    },
    {
      fort: pc(OBJECTIF_SATISFACTION),
      texte: "de clients satisfaits au comptoir, au moins",
    },
  ],
  jugement: `Samia fait le compte en euros de ce que le trimestre a coûté à l'agence : la démarque, les ventes manquées par les références vides, les commandes en retard, les clients perdus ou gagnés. Elle le compare au plafond de pertes fixé par la directrice, ${kE1(PLAFOND_DE_PERTES)}.`,
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre rayon",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps sur le rayon. Au-delà de deux jours, des références restent vides, et des ventes se perdent.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...SAMIA,
        alerte: true,
        texte: `Pendant que tu cherchais, le rayon n'a pas été réassorti : des références sont restées vides. Environ ${euros(perdu)} de ventes manquées.`,
      };
    },
  },
  prevision: {
    libelle: `le nombre de commandes clients à préparer en semaine 3. Repère : environ ${PREVISION.parJour} commandes par jour d'ouverture, et ${PREVISION.jours} jours d'ouverture par semaine`,
    unite: "commandes",
    placeholder: "30",
    min: 0,
    max: 300,
    step: 1,
    reel: (t) => t.semaines[3]!.commandes,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({
    ...tableauDeBord(decisions, graine, j, semaine),
  }),
  indicateurs: [
    {
      cle: "demarque",
      nom: "Démarque de la semaine",
      format: euros,
      sensBon: -1,
      aide: () => `objectif : ${euros(OBJECTIF_DEMARQUE)} au plus`,
    },
    {
      cle: "ruptures",
      nom: "Références vides à l'ouverture",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `objectif : ${OBJECTIF_RUPTURES} au plus`,
    },
    {
      cle: "aLHeure",
      nom: "Commandes prêtes à l'heure",
      format: pc,
      formatEcart: points,
      sensBon: 1,
      aide: () => `objectif : ${pc(OBJECTIF_A_L_HEURE)} au moins`,
    },
    {
      cle: "satisfaction",
      nom: "Clients satisfaits au comptoir",
      format: pc,
      formatEcart: points,
      sensBon: 1,
      aide: () => `objectif : ${pc(OBJECTIF_SATISFACTION)} au moins`,
    },
    {
      cle: "pertes",
      nom: "Pertes du trimestre",
      format: kE1,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `à date : ${kE1(l.plafondADate ?? 0)} de plafond sur ${kE1(PLAFOND_DE_PERTES)}`
          : `plafond : ${kE1(PLAFOND_DE_PERTES)} pour le trimestre`,
      jauge: (l) =>
        l.plafondADate
          ? {
              part: Math.min(
                1,
                Math.max(0, (l.pertes ?? 0) / PLAFOND_DE_PERTES),
              ),
              enRetard: (l.pertes ?? 0) > l.plafondADate,
            }
          : null,
    },
  ],
  contexte(l) {
    return {
      demarque: euros(l.demarque ?? 0),
      ruptures: nombre(l.ruptures ?? 0, 0),
      aLHeure: pc(l.aLHeure ?? 0),
      satisfaction: pc(l.satisfaction ?? 0),
      pertes: kE1(l.pertes ?? 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [
        `Démarque, sem. ${de} à ${a}`,
        euros(semaines.reduce((x, w) => x + w.demarque, 0)),
      ],
      [`Références vides, sem. ${a}`, nombre(t.semaines[a]!.ruptures, 0)],
      ["Pertes de la période", kE1(semaines.reduce((x, w) => x + w.cout, 0))],
    ];
  },
  courbe: {
    titre: "Démarque, semaine par semaine",
    cle: "demarque",
    cible: OBJECTIF_DEMARQUE,
    libelleCible: `objectif : ${euros(OBJECTIF_DEMARQUE)} au plus`,
    graduations: [250, 500, 1000, 1500],
    format: (v) => euros(v),
    details: (s) => [
      `démarque ${euros(s.demarque!)} · ${nombre(s.ruptures!, 0)} références vides`,
      `commandes à l'heure ${pc(s.aLHeure!)} · satisfaction ${pc(s.satisfaction!)}`,
    ],
  },
  reactions: () => null,
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.litigePerdu) {
      lies.push({
        ...SAMIA,
        heure: `sem. ${arrive.semaineDuLitige}`,
        alerte: true,
        texte: REPONSES.litigePerdu,
      });
    }
    if (arrive.trebuche) {
      lies.push({
        ...SAMIA,
        heure: `sem. ${SEMAINE_ACCIDENT}`,
        alerte: true,
        texte: REPONSES.trebuche,
      });
    }
    if (arrive.decolle) {
      lies.push({
        ...SAMIA,
        heure: `sem. ${SEMAINE_DECOLLE}`,
        alerte: true,
        texte: REPONSES.decolle,
      });
    }
    if (arrive.cacheeRetrouvee) {
      lies.push({
        ...SAMIA,
        heure: `sem. ${SEMAINES}`,
        alerte: true,
        texte: `${REPONSES.cacheeRetrouvee} ${euros(arrive.demarqueCachee)} en une semaine.`,
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
    hasard(graine).imprevus.map((x) => ({
      semaine: x.semaine,
      titre: x.imprevu.titre,
    })),

  bilan: {
    titre: (t) => ecartAuPlafond(t.objectif),
    formatObjectif: kE1,
    noteDesBarres:
      "Écart au plafond de pertes du libre-service, démarque, ventes manquées, retards et clients compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Démarque du trimestre",
          valeur: euros(t.demarque),
          aide: `objectif ${euros(OBJECTIF_DEMARQUE * SEMAINES)} au plus`,
          tenu: t.demarque <= OBJECTIF_DEMARQUE * SEMAINES,
        },
        {
          nom: "Références vides",
          valeur: nombre(t.rupturesMoyennes),
          aide: `en moyenne à l'ouverture ; objectif ${OBJECTIF_RUPTURES} au plus`,
          tenu: t.rupturesMoyennes <= OBJECTIF_RUPTURES,
        },
        {
          nom: "Commandes prêtes à l'heure",
          valeur: pc(t.aLHeureMoyen),
          aide: `en moyenne ; objectif ${pc(OBJECTIF_A_L_HEURE)}`,
          tenu: t.aLHeureMoyen >= OBJECTIF_A_L_HEURE,
        },
        {
          nom: "Clients satisfaits",
          valeur: pc(t.satisfactionMoyenne),
          aide: `en moyenne ; objectif ${pc(OBJECTIF_SATISFACTION)}`,
          tenu: t.satisfactionMoyenne >= OBJECTIF_SATISFACTION,
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
          titre: "Les livraisons",
          texte: `${t.incidents} colis abîmés ou manquants sur le trimestre ; ${euros(t.incidentsPerdus)} sont restés à la charge de l'agence.`,
        },
        ...(t.carrelageDecolle
          ? [
              {
                titre: "M. Bertin",
                texte: `est revenu en semaine ${SEMAINE_DECOLLE} : ses carreaux se décollaient.`,
              },
            ]
          : []),
        ...(t.clientTrebuche
          ? [
              {
                titre: "L'allée 3",
                texte: `un client a trébuché sur une palette en semaine ${SEMAINE_ACCIDENT}.`,
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
