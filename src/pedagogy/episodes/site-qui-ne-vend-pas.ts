/**
 * ÉPISODE 22 — LE SITE QUI NE VEND PAS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Pauline montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Le tableau de bord montre ce qu'une responsable du commerce en ligne voit
 * vraiment : des visites, un taux de conversion, des paniers abandonnés, et
 * des agences qui recommandent le site ou non. L'entonnoir étape par étape,
 * lui, ne se voit que si on va le chercher.
 */
import {
  ADHESION_DEPART,
  AGENCES,
  BUDGET,
  COMMANDES_BUDGET,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_CONVERSION,
  PERTE_PAR_JOUR,
  comiteCoupe,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/site-qui-ne-vend-pas";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/site-qui-ne-vend-pas";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const pourcent = (v: number) => taux(v, 0);
const conversion = (v: number) => taux(v, 2);
const points = (v: number) => `${nombre(v * 100, 2)} pt`;
/** Le nombre d'agences qui recommandent le site, sur quatorze. */
const agences = (adhesion: number) => Math.round(adhesion * AGENCES);
/** Un écart au budget de contribution : positif, le site fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;
/** Plafond de publicité par commande au-delà duquel une commande achetée coûte trop. */
const PLAFOND_PUB_PAR_COMMANDE = 15;

/** Ce que les décisions révèlent, dans l'ordre où une responsable les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient où les artisans abandonnaient",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    entonnoir:
      "Votre diagnostic de la semaine 1 était juste : les artisans venaient, mais six sur dix renonçaient au compte, ne voyaient pas leurs prix pro ou butaient sur la disponibilité. Le site ne manquait pas de visiteurs, il les perdait.",
    agences:
      "En semaine 1, vous avez vu que les agences freinaient : une vraie cause, mais pas la première. Même les artisans qui venaient d'eux-mêmes renonçaient au compte et aux prix publics.",
    trafic:
      "En semaine 1, vous avez retenu le manque de visiteurs ; il y en avait 8 000 par semaine, et moins d'un sur cent commandait.",
    site: "En semaine 1, vous avez retenu un site à refaire ; deux blocages précis suffisaient à faire fuir les artisans, et se corrigeaient en une semaine.",
  };
  const justes = ["entonnoir", "agences"];
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
    score: d === "entonnoir" ? 1 : d === "agences" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais acheté de visites ou de commandes, ni tout refait, ni coupé : vous avez corrigé les étapes où les artisans abandonnaient, et mesuré avant de généraliser."
        : `Sous la pression des chiffres, vous avez acheté du trafic ou des commandes, tout refait, forcé la main des agences ou coupé ${n} fois. Chaque visite achetée arrivait dans un entonnoir qui fuyait ; publicité comprise, une commande a coûté ${euros(t.coutPubParCommande)} de publicité.`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[3]!.commandes,
    "en ligne en semaine 3",
    "commandes",
    { juste: 8, proche: 20 },
    (e) => `${nombre(e, 0)} commande${e >= 2 ? "s" : ""}`,
  );

  const attribue = p.chemin[D.agences] === 0;
  const retrait = p.chemin[D.printemps] === 1;
  const alignes = (attribue ? 1 : 0) + (retrait && attribue ? 1 : 0);
  const agencesConstat: Constat = {
    score: alignes === 2 ? 1 : alignes === 1 ? 0.6 : 0,
    texte: `${
      attribue
        ? "Vous avez attribué la vente en ligne à l'agence du client : les comptoirs ont gagné à recommander le site."
        : p.chemin[D.agences] === 1
          ? "Vous avez demandé aux agences de recommander le site par une note : rien dans leur prime n'avait changé, l'affiche est restée au comptoir."
          : p.chemin[D.agences] === 2
            ? `Vous avez contourné les agences par une remise : vous avez payé des commandes qu'elles auraient faites au comptoir${t.rebiffe ? ", et l'agence de Vaulx a fait payer le contournement" : ""}.`
            : "Vous avez laissé les agences de côté : elles ont continué à voir le site comme un concurrent."
    } ${
      retrait
        ? attribue
          ? "Le retrait en deux heures a ramené les artisans au comptoir, et leurs achats d'appoint avec eux."
          : `Le retrait en deux heures reposait sur des comptoirs qui n'y gagnaient rien${t.retraitRate ? " : les commandes sont restées au fond du dépôt" : ""}.`
        : "Rien, au printemps, n'a fait du site un allié des comptoirs."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, agencesConstat];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  agencesConstat,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer l'entonnoir avant d'agir",
      texte:
        "Rejouez l'épisode en reconstituant d'abord l'entonnoir et en regardant des artisans commander : six sur dix renonçaient au compte, et personne ne le voyait derrière 8 000 visites.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Réparer l'entonnoir plutôt que le remplir",
      texte:
        "Acheter des visites ou des commandes, tout refaire, couper : chaque réflexe traite le volume. Corriger l'étape où l'on perd les clients multiplie la valeur de toutes les visites, et un test dit si la correction marche avant de la généraliser.",
    };
  }
  if (agencesConstat!.score === 0) {
    return {
      titre: "Aligner les incitations de ceux qui freinent",
      texte:
        "Quand des équipes perdent à votre succès, elles le freinent, quoi que dise une note. Faites-les gagner avec vous : ici, attribuer la vente en ligne à l'agence du client.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher l'étape où l'on perd les clients",
      texte:
        "Un taux de conversion bas n'est pas un manque de visiteurs : décomposez-le en étapes, et regardez laquelle perd le plus de monde.",
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
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const AGENCE_WEB = { de: "Tristan Keller", role: "Chef de projet, agence web" } as const;
const ANALYSTE = { de: "Clémence Jaubert", role: "Analyste web" } as const;

export const EPISODE_NUMERIQUE: Episode<Trimestre> = {
  code: "site-qui-ne-vend-pas",
  numero: 6,
  domaine: "Commerce en ligne",
  titre: "Le site qui ne vend pas",
  resume:
    "Un site de commande pour artisans : beaucoup de visites, peu de commandes, des agences qui freinent. Réparer l'entonnoir avant de le remplir.",
  persona:
    "Vous êtes Pauline Duval, responsable du commerce en ligne d'Arvel Distribution, au siège de Villeurbanne. Votre équipe : un chef de projet web, une analyste et une agence web prestataire. Le site de commande pour les artisans est ouvert depuis six mois.",
  mandat: [
    {
      fort: `${COMMANDES_BUDGET}`,
      texte: "commandes en ligne par semaine : ce que prévoyait le plan",
    },
    { fort: "1,5 %", texte: "de taux de conversion visé" },
    { fort: "2 000 €", texte: "de publicité par semaine aujourd'hui" },
    { fort: kE(BUDGET), texte: "de contribution du site sur le trimestre, au budget" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la contribution du site — la marge des ventes en ligne et des achats qu'elles ramènent au comptoir, moins la publicité, le développement, les remises et les primes — en écart au budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre site",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, des artisans qui n'arrivent pas à commander passent chez un concurrent.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Baptiste Lantelme",
        role: "Directeur de l'agence de Vaulx-en-Velin",
        alerte: true,
        texte: `Pendant ce temps, deux plaquistes qui n'arrivaient pas à ouvrir leur compte ont commandé leur chantier sur le site d'un concurrent : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre de commandes en ligne en semaine 3",
    unite: "commandes",
    placeholder: "60",
    min: 0,
    max: 400,
    step: 1,
    reel: (t) => t.semaines[3]!.commandes,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "visites",
      nom: "Visites",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine, l) =>
        `dont ${nombre(l.payantes ?? 0, 0)} achetées en publicité${semaine ? "" : ", la semaine dernière"}`,
    },
    {
      cle: "conversion",
      nom: "Taux de conversion",
      format: conversion,
      formatEcart: points,
      sensBon: 1,
      aide: () => "commandes rapportées aux visites ; visé : 1,5 %",
    },
    {
      cle: "abandon",
      nom: "Paniers abandonnés",
      format: pourcent,
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => "paniers qui ne deviennent pas des commandes",
    },
    {
      cle: "adhesion",
      nom: "Agences qui recommandent le site",
      format: (v) => `${agences(v)} sur ${AGENCES}`,
      formatEcart: (v) => nombre(v * AGENCES, 0),
      sensBon: 1,
      aide: () => "selon les comptoirs interrogés",
    },
    {
      cle: "cumul",
      nom: "Contribution à date",
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
    const visites = l.visites ?? 0;
    return {
      visites: nombre(visites, 0),
      payantes: nombre(l.payantes ?? 0, 0),
      partPayantes: pourcent(visites ? (l.payantes ?? 0) / visites : 0),
      commandes: nombre(l.commandes ?? 0, 0),
      conversion: conversion(l.conversion ?? 0),
      abandon: pourcent(l.abandon ?? 0),
      agences: agences(l.adhesion ?? ADHESION_DEPART),
      cumul: kE(l.cumul ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      corrige: decisions[D.entonnoir] === 1,
      refonte: decisions[D.entonnoir] === 2,
      attribution: decisions[D.agences] === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    return [
      [`Commandes, sem. ${a}`, nombre(t.semaines[a]!.commandes, 0)],
      [`Conversion, sem. ${a}`, conversion(t.semaines[a]!.conversion)],
      ["Contribution de la période", kE(contribution)],
    ];
  },
  courbe: {
    titre: "Commandes en ligne, semaine par semaine",
    cle: "commandes",
    cible: COMMANDES_BUDGET,
    libelleCible: `plan : ${COMMANDES_BUDGET} commandes par semaine`,
    graduations: [50, 100, 150, 200],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `${nombre(s.commandes!, 0)} commandes · ${nombre(s.visites!, 0)} visites`,
      `conversion ${conversion(s.conversion!)} · paniers abandonnés ${pourcent(s.abandon!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.comite && choix === 3) {
      // Seule l'absence de dossier compte : le comité tranche selon le hasard du trimestre.
      const coupe = comiteCoupe([...NEUTRE.slice(0, D.comite), 3], graine);
      return [
        {
          de: "Étienne Rambert",
          role: "Directeur financier",
          texte: coupe ? REPONSES.comiteCoupe : REPONSES.comiteGarde,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.refonteRetard) {
      lies.push({
        ...AGENCE_WEB,
        heure: "sem. 9",
        alerte: true,
        texte:
          "Pauline, mauvaise nouvelle : la reprise des 12 000 fiches produits prend plus longtemps que prévu. La refonte ne sera pas livrée avant la fin du trimestre.",
      });
    }
    if (arrive.refonteLivree) {
      lies.push({
        ...AGENCE_WEB,
        heure: "sem. 10",
        texte:
          "La refonte est en ligne : compte ouvert avec le SIRET, prix pro à la connexion, nouveau design. Les habitués vont devoir retrouver leurs repères.",
      });
    }
    if (arrive.testGagne) {
      lies.push({
        ...ANALYSTE,
        heure: "sem. 7",
        texte:
          "Verdict du test : le nouveau tunnel fait valider nettement plus de paniers, sur téléphone comme sur ordinateur. On le généralise lundi.",
      });
    }
    if (arrive.testPerd) {
      lies.push({
        ...ANALYSTE,
        heure: "sem. 7",
        alerte: true,
        texte:
          "Verdict du test : sur téléphone, le nouveau tunnel fait chuter les commandes — le sélecteur de date ne s'ouvre pas sur certains appareils. On garde l'ancien tunnel, et on a perdu deux semaines sur la moitié des visiteurs seulement.",
      });
    }
    if (arrive.deploiementCasse) {
      lies.push({
        de: "Mickaël Blanchard",
        role: "Vendeur comptoir, agence de Bron",
        heure: "sem. 8",
        alerte: true,
        texte:
          "Trois clients m'ont appelé : ils n'arrivent plus à valider leur commande depuis leur téléphone. Les commandes en ligne baissent depuis deux semaines, et personne au siège ne sait si c'est le site ou la saison.",
      });
    }
    if (arrive.rebiffe) {
      lies.push({
        de: "Baptiste Lantelme",
        role: "Directeur de l'agence de Vaulx-en-Velin",
        heure: "sem. 6",
        alerte: true,
        texte:
          "Tu as écrit à mes clients avec une remise sans me prévenir. Mes vendeurs leur disent maintenant que le site n'a pas les bons prix. Et les Maçonneries Tardy, mon plus gros compte, sont parties chez un concurrent pour faire jouer la remise.",
      });
    }
    if (arrive.retraitRate) {
      lies.push({
        de: "Estelle Monnet",
        role: "Directrice de l'agence de Bron",
        heure: "sem. 10",
        alerte: true,
        texte:
          "Dans la moitié des agences, les commandes web ne sont pas prêtes quand les artisans arrivent : personne n'est chargé de les préparer. On a dû faire des avoirs, et des clients ne reviendront pas avant un moment.",
      });
    }
    if (arrive.coupe && chemin[D.comite] !== 3) {
      lies.push({
        de: "Baptiste Lantelme",
        role: "Directeur de l'agence de Vaulx-en-Velin",
        heure: "sem. 12",
        texte:
          "On a appris que le site est gelé. Mes vendeurs ne vont plus en parler aux clients : à quoi bon pousser un outil qui ferme ?",
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, coûts compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de contribution du site — marge des ventes en ligne et des achats d'appoint au comptoir, moins publicité, développement, remises et primes — sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const conversionFinale = t.semaines[13]!.conversion;
      return [
        {
          nom: "Taux de conversion",
          valeur: conversion(conversionFinale),
          aide: "en semaine 13 ; visé 1,5 %",
          tenu: conversionFinale >= OBJECTIF_CONVERSION,
        },
        {
          nom: "Commandes en ligne",
          valeur: nombre(t.commandesFinales, 0),
          aide: `par semaine en fin de trimestre ; plan ${COMMANDES_BUDGET}`,
          tenu: t.commandesFinales >= COMMANDES_BUDGET,
        },
        {
          nom: "Publicité par commande",
          valeur: euros(t.coutPubParCommande),
          aide: `sur le trimestre ; plafond ${PLAFOND_PUB_PAR_COMMANDE} €`,
          tenu: t.coutPubParCommande <= PLAFOND_PUB_PAR_COMMANDE,
        },
        {
          nom: "Agences",
          valeur: `${agences(t.adhesionFinale)} sur ${AGENCES}`,
          aide: "recommandent le site en fin de trimestre",
          tenu: agences(t.adhesionFinale) >= AGENCES / 2,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.comiteConsulte
          ? [
              {
                titre: "Le comité",
                texte: t.coupe
                  ? "a coupé la publicité et gelé le site en semaine 12."
                  : "a maintenu le budget jusqu'à la fin du trimestre.",
              },
            ]
          : []),
        {
          titre: "Le projet",
          texte: [
            t.refonteLancee
              ? t.refonteLivree
                ? "la refonte a été livrée en semaine 10"
                : "la refonte n'a pas été livrée dans le trimestre"
              : null,
            t.tunnel === "aucun"
              ? null
              : t.tunnelGagne
                ? "le nouveau tunnel faisait vendre plus"
                : "le nouveau tunnel cassait la commande sur téléphone",
            t.rebiffe ? "l'agence de Vaulx s'est rebiffée" : null,
            t.retraitLance
              ? t.retraitRate
                ? "le retrait en deux heures a raté dans la moitié des agences"
                : "le retrait en deux heures a tenu"
              : null,
          ]
            .filter(Boolean)
            .join(", ")
            .replace(/^./, (c) => c.toUpperCase())
            .concat(".")
            .replace(/^\.$/, "Rien de particulier : ni refonte, ni tunnel, ni retrait en agence."),
        },
      ];
    },
  },
  comportements,
  axe,
};
