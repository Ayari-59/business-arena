/**
 * ÉPISODE 100 — LES PRODUCTEURS QUI ARRÊTENT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de la collecte de Hoel montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  AGRANDIR,
  ARRETS_TRIMESTRE,
  BUDGET_TRIMESTRE,
  COUT_COLLECTE_AN_PASSE,
  COUT_COLLECTE_DEPART,
  D,
  GAEC,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PIC,
  PRIX_BUDGET,
  SANS_REPRENEUR,
  SEMAINE_INSTALLATIONS,
  SEMAINES,
  SPOT,
  TOURNEES,
  VOLUME_PROJET,
  chambreActive,
  connaissance,
  echangeAccepte,
  evenements,
  hasard,
  reponseDecembre,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/producteurs-qui-arretent";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/producteurs-qui-arretent";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Pour commencer une phrase : « Trois des huit projets ». */
const EN_LETTRES = [
  "Aucun",
  "Un",
  "Deux",
  "Trois",
  "Quatre",
  "Cinq",
  "Six",
  "Sept",
  "Huit",
] as const;
const millions = (v: number, d = 2) => `${nombre(v, d)} Ml`;
const parMille = (v: number) => `${nombre(v, 1)} €`;
/** Le repère des volumes sécurisés : trois millions de litres par an. */
export const REPERE_SECURISE = 3;

/** L'écart au budget lait du trimestre, ventes perdues comprises : positif, sous le budget. */
const ecartAuBudget = (t: Trimestre) => t.budget - t.coutLait - t.ventesPerdues;
const titre = (t: Trimestre) => {
  const e = ecartAuBudget(t);
  return `${kE(t.objectif)} au total : ${
    e >= 0 ? `${kE(e)} sous le budget lait` : `${kE(-e)} au-delà du budget lait`
  }, ventes perdues comprises, et ${kE(t.futur.total)} de volumes sécurisés`;
};

const SELMA = {
  de: "Selma Adjovi",
  role: "Conseillère installation, chambre d'agriculture",
} as const;
const ROZENWENN = {
  de: "Rozenwenn Goasdoué",
  role: "Responsable de la collecte, Laiterie de Trévallec",
} as const;
const SKLAERENN = { de: "Sklaerenn Le Saout", role: "Technicienne d'élevage" } as const;
const JORAN = { de: "Joran Kerneur", role: "Chef du parc de collecte" } as const;
const KONOGAN = {
  de: "Konogan Kerguéris",
  role: "Président de l'OP Lait du Méné, éleveur",
} as const;
const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const PADRIG = { de: "Padrig Guillouzic", role: "Associé du GAEC Guillouzic, à Trévé" } as const;

/** Ce que les décisions révèlent, dans l'ordre où un responsable de collecte les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le fichier des producteurs et les visites des techniciens",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    transmission:
      "Votre diagnostic de la semaine 1 était juste : la collecte baissait parce que des exploitations s'arrêtaient sans repreneur, et cela se préparait exploitation par exploitation, bien avant le creux d'automne.",
    tournees:
      "En semaine 1, vous avez vu les tournées qui s'étirent : un vrai coût, mais une conséquence. Ce qui vidait les tournées, c'étaient des exploitations qui s'arrêtaient sans repreneur.",
    prix: "En semaine 1, vous avez retenu le prix de base ; Kerbrélan payait dans la moyenne, et aucun des exploitants qui arrêtaient ne citait le prix.",
    saison:
      "En semaine 1, vous avez retenu le creux d'automne ; la collecte était sous celle de l'an dernier à saison égale, chaque semaine depuis le printemps.",
  };
  const justes = ["transmission", "tournees"];
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
    score: d === "transmission" ? 1 : d === "tournees" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais répondu au lait qui manque en l'achetant au fil des besoins ou en payant plus cher tout le monde : vous l'avez sécurisé en amont."
        : `Sous la pression du lait qui manque, vous avez ${n} fois sur ${ETAPES.length} décisions acheté le manque en spot au fil des besoins ou augmenté le prix de base pour tous. Le spot comble le trou de la semaine au prix du moment ; une hausse générale paie tous les producteurs pour en retenir quelques-uns.${
            t.rupture > 0.005
              ? ` Au pic de Noël, ${nombre(t.rupture * 1000, 0)} 000 litres ont manqué : ${kE(t.ventesPerdues)} de ventes de desserts perdues.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.volumeQuiDisparait,
    "de lait qui disparaît si les exploitations sans repreneur arrêtent",
    "Ml/an",
    { juste: 1, proche: 3 },
    (e) => `${nombre(e)} Ml/an`,
  );

  // Sécuriser en amont : voir, accompagner, garder, remplacer au même endroit.
  const plan = p.chemin[D.plan] === 2;
  const dispositif = p.chemin[D.installation] === 1;
  const gaec = p.chemin[D.gaec] === 1;
  const voisins = p.chemin[D.agrandir] === 1;
  const bons = [plan, dispositif, gaec, voisins].filter(Boolean).length;
  const amont: Constat = {
    score: bons === 4 ? 1 : bons >= 2 ? 0.6 : 0,
    texte: `${
      plan
        ? "Vous avez fait voir chaque exploitation sans repreneur par un technicien."
        : "Personne n'est allé voir, une par une, les exploitations sans repreneur."
    } ${
      dispositif
        ? `Vous avez accompagné les installations : ${t.futur.installations} projet${t.futur.installations > 1 ? "s ont" : " a"} abouti.`
        : p.chemin[D.installation] === 2
          ? "Votre prime forte, sans accompagnement, payait surtout ceux qui s'installaient de toute façon."
          : "Les candidats à l'installation sont restés sans dispositif de la laiterie."
    } ${
      gaec
        ? "Au GAEC Guillouzic, vous avez répondu au projet de Padrig plutôt qu'au prix de Nordal."
        : p.chemin[D.gaec] === 0
          ? "Au GAEC Guillouzic, vous avez répondu par le prix, hors accord-cadre."
          : "Vous avez laissé le GAEC Guillouzic choisir seul."
    } ${
      voisins
        ? "Vous avez proposé aux voisins de reprendre le lait de ceux qui s'arrêtent."
        : "Le lait des exploitations qui s'arrêtent n'a pas été repris par leurs voisins."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, amont];
}

export function axe([information, diagnostic, reflexe, calibrage, amont]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Aller voir les exploitations avant de décider",
      texte: `Rejouez l'épisode en envoyant d'abord les techniciens chez les exploitants de plus de 58 ans : le fichier en compte 61 sans repreneur connu, mais douze en ont un, et seules les visites disent qui cherche un repreneur, qui arrêtera sans suite, et quels voisins hésitent à s'agrandir.`,
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Sécuriser le lait en amont plutôt que l'acheter au prix du jour",
      texte:
        "Le spot comble le trou de la semaine au prix du moment, et au pic de Noël il manque. Une hausse générale paie tous les producteurs pour en retenir quelques-uns, qui partent pour d'autres raisons. Le lait se garde exploitation par exploitation : une installation accompagnée, un voisin qui reprend, un contrat long.",
    };
  }
  if (amont!.score === 0) {
    return {
      titre: "Préparer la relève exploitation par exploitation",
      texte:
        "Une exploitation qui s'arrête se voit trois ans à l'avance. Un technicien référent, un candidat présenté par la chambre, un contrat assez long pour la banque et une avance pour la mise aux normes gardent plus de lait que n'importe quelle mesure générale.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher pourquoi le lait part",
      texte:
        "Avant de juger un prix, une saison ou des tournées, demandez qui arrête, et pourquoi. Ici, les exploitants partaient à la retraite sans repreneur : la réponse était la transmission, pas le prix de base.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du lait qui part",
      texte: `61 exploitations sans repreneur connu livrent 31,7 millions de litres par an ; les visites en trouvent douze qui ont un repreneur en vue, pour 7,2 millions. Ce qui disparaît si les autres arrêtent : ${nombre(SANS_REPRENEUR.volume)} millions de litres par an, un dixième de la collecte. C'est l'ordre de grandeur de ce qu'il faut sécuriser.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_COLLECTE: Episode<Trimestre> = {
  code: "producteurs-qui-arretent",
  numero: 100,
  domaine: "Sécuriser son approvisionnement agricole",
  titre: "Les producteurs qui arrêtent",
  resume:
    "La collecte baisse de 4 %, 61 exploitants de plus de 58 ans n'ont pas de repreneur connu, et Noël approche. Le lait se sécurise en amont, exploitation par exploitation.",
  persona:
    "Vous êtes Hoel Quiniou, responsable de la collecte et des relations avec les producteurs de la Laiterie de Kerbrélan, à Loudéac : 240 millions de litres par an, 310 exploitations dans un rayon de 70 km, regroupées dans l'OP Lait du Méné. Avec vous : deux techniciens d'élevage et le parc de collecte, quatorze camions-citernes ; la supply chain achète pour vous le lait spot qui manque. Le trimestre va d'octobre à décembre : le creux de collecte, puis le pic des desserts de Noël.",
  mandat: [
    { fort: kE(BUDGET_TRIMESTRE), texte: "de budget lait pour le trimestre, collecte comprise" },
    { fort: "aucune rupture", texte: "de desserts au pic de Noël" },
    { fort: "61 exploitations", texte: "sans repreneur connu, à suivre" },
    {
      fort: `${nombre(COUT_COLLECTE_DEPART, 1)} €`,
      texte: "de coût de collecte les 1 000 litres, à ne pas dépasser",
    },
  ],
  jugement: `La direction juge le trimestre sur le coût du lait (prix de base, primes, spot, achats à terme, collecte) comparé au budget, les ventes de desserts perdues faute de lait, et la valeur des volumes sécurisés pour les trois années suivantes : chaque litre gardé évite d'acheter du spot, plus cher que le lait collecté, moins ce qui a été promis pour le garder.`,
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre collecte",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la supply chain achète le lait spot de la semaine dans l'urgence, sans négocier.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...YSEE,
        alerte: true,
        texte: `Pendant ce temps, j'ai pris le spot de la semaine sans pouvoir négocier : ${euros(perdu)} de plus.`,
      };
    },
  },
  prevision: {
    libelle:
      "le volume de lait qui disparaît si les exploitations sans repreneur arrêtent dans les trois ans, en millions de litres par an",
    unite: "Ml/an",
    placeholder: "20",
    min: 0,
    max: 240,
    step: 0.1,
    reel: (t) => t.volumeQuiDisparait,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "collecte",
      nom: "Collecte de la semaine",
      format: (v) => millions(v),
      sensBon: 1,
      aide: (semaine, l) =>
        `${semaine ? `semaine ${semaine}` : "fin septembre"} ; l'an dernier : ${millions(l.collecteAnPasse ?? 0)}`,
    },
    {
      cle: "partAchete",
      nom: "Lait acheté hors collecte",
      format: (v) => taux(v),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: -1,
      aide: () => "spot et à terme, en part du lait transformé ; 8 % l'automne dernier",
    },
    {
      cle: "coutCollecte",
      nom: "Coût de collecte",
      format: (v) => `${parMille(v)} / 1 000 l`,
      formatEcart: (v) => parMille(v),
      sensBon: -1,
      aide: () => `il y a un an : ${parMille(COUT_COLLECTE_AN_PASSE)} les 1 000 litres`,
    },
    {
      cle: "coutCumule",
      nom: "Coût du lait depuis octobre",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)}`
          : `budget du trimestre : ${kE(BUDGET_TRIMESTRE)}`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.coutCumule ?? 0) / BUDGET_TRIMESTRE)),
              enRetard: (l.coutCumule ?? 0) > l.budgetADate,
            }
          : null,
    },
    {
      cle: "securise",
      nom: "Lait sécurisé",
      format: (v) => `${nombre(v, 1)} Ml/an`,
      sensBon: 1,
      aide: () => `pour les trois ans à venir : installations, agrandissements, contrats`,
    },
  ],
  contexte(l, decisions) {
    const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
    const k = connaissance(chemin);
    return {
      collecte: `${nombre(l.collecte ?? 0, 2)} millions de litres`,
      collecteAnPasse: nombre(l.collecteAnPasse ?? 0, 2),
      partAchete: taux(l.partAchete ?? 0),
      prixSpot: euros(l.prixSpot ?? 0),
      coutCollecte: `${nombre(l.coutCollecte ?? 0, 1)} €`,
      manque: `${nombre((l.manquePrevu ?? 0) * 1000, 0)} 000 litres`,
      projets: k.projets,
      hesitants: k.hesitants,
      carte: k.carte,
      dispositif: decisions[D.installation] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const ecart = semaines.reduce((x, w) => x + w.ecart, 0);
    return [
      ["Écart au budget de la période", kE(ecart)],
      [`Lait acheté, sem. ${a}`, taux(t.semaines[a]!.partAchete)],
      [`Coût de collecte, sem. ${a}`, `${parMille(t.semaines[a]!.coutCollecte)}`],
    ];
  },
  courbe: {
    titre: "Prix de revient du lait, semaine par semaine",
    cle: "prixRevient",
    cible: PRIX_BUDGET,
    libelleCible: `budget : ${PRIX_BUDGET} € les 1 000 litres transformés`,
    graduations: [470, 480, 490, 500, 510, 520],
    format: (v) => `${nombre(v, 0)} €`,
    details: (s) => [
      `${nombre(s.prixRevient!, 0)} € les 1 000 l · spot ${nombre(s.prixSpot!, 0)} €`,
      `collecte ${millions(s.collecte!)} · acheté ${taux(s.partAchete!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.tournees && choix === 2) {
      // Trévallec répond selon le hasard du trimestre.
      return [
        {
          ...ROZENWENN,
          texte: echangeAccepte(graine) ? REPONSES.echangeAccepte : REPONSES.echangeRefuse,
        },
      ];
    }
    if (etape === D.installation) {
      // La chambre détache, ou non, une conseillère : c'est le hasard du trimestre.
      return [
        {
          ...SELMA,
          texte: chambreActive(graine) ? REPONSES.chambreActive : REPONSES.chambreAbsente,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = arrive.t;
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    for (const arret of ARRETS_TRIMESTRE) {
      if (!dans(arret.semaine)) continue;
      lies.push({
        ...SKLAERENN,
        heure: `sem. ${arret.semaine}`,
        texte: `${EN_LETTRES[arret.exploitations]} exploitations ont vendu leur troupeau cette semaine, sans repreneur : ${nombre(arret.volume * 1000, 0)} 000 litres par an de moins.`,
      });
    }
    if (chemin[D.tournees] === 3 && dans(TOURNEES.debutCession)) {
      lies.push({
        ...JORAN,
        heure: `sem. ${TOURNEES.debutCession}`,
        texte:
          "Depuis lundi, Nordal collecte les six exploitations du sud. Nos camions font moins de route ; leur lait part à Nordal.",
      });
    }
    if (chemin[D.tournees] === 2 && echangeAccepte(graine) && dans(TOURNEES.debutEchange)) {
      lies.push({
        ...JORAN,
        heure: `sem. ${TOURNEES.debutEchange}`,
        texte: "Les tournées d'échange avec Trévallec démarrent lundi : 13 % de route en moins.",
      });
    }
    if (chemin[D.decembre] === 2 && dans(PIC.debut)) {
      lies.push({
        ...KONOGAN,
        heure: `sem. ${PIC.debut}`,
        texte: `Avec la prime de décembre, les producteurs livrent environ ${nombre(reponseDecembre(graine) * 1000, 0)} 000 litres de plus par semaine.`,
      });
    }
    if (t.fuite && dans(GAEC.debutFuite)) {
      lies.push({
        ...KONOGAN,
        heure: `sem. ${GAEC.debutFuite}`,
        alerte: true,
        texte: `Je l'ai appris : vous payez le GAEC Guillouzic ${GAEC.primeNordal} € de plus que les autres. L'OP exige ${GAEC.hausseFuite} € de plus pour tous jusqu'à la fin de l'année, faute de quoi elle dénonce l'accord-cadre. Le conseil d'administration a voté hier soir.`,
      });
    }
    for (const r of arrive.ruptures) {
      lies.push({
        ...YSEE,
        heure: `sem. ${r.semaine}`,
        alerte: true,
        texte: `Le courtier n'a pas trouvé tout le lait de la semaine : ${nombre(r.volume * 1000, 0)} 000 litres ont manqué. On a coupé des crèmes desserts, et Celtis applique ses pénalités logistiques.`,
      });
    }
    if (dans(SEMAINE_INSTALLATIONS)) {
      const n = connaissance(chemin).projets;
      const ok = t.futur.installations;
      lies.push({
        ...SELMA,
        heure: `sem. ${SEMAINE_INSTALLATIONS}`,
        texte:
          ok === 0
            ? `Aucun des ${n} projets d'installation n'a abouti ce trimestre : financement, bâtiments, cédants et repreneurs qui ne se sont pas entendus.`
            : `${EN_LETTRES[ok]} des ${n} projets d'installation ${ok > 1 ? "ont" : "a"} abouti : compromis signé, prêt accordé, contrat de collecte signé. ${nombre(ok * VOLUME_PROJET * 1000, 0)} 000 litres par an gardés.`,
      });
      lies.push({
        ...(t.futur.gaecReste
          ? PADRIG
          : { de: "Guénolé Guillouzic", role: "Associé du GAEC Guillouzic, à Trévé" }),
        heure: `sem. ${GAEC.semaine}`,
        alerte: !t.futur.gaecReste,
        texte: t.futur.gaecReste
          ? "C'est décidé : on reste chez Kerbrélan. Je reprends les parts de mon père au printemps."
          : "On a signé avec Nordal pour le 1er janvier. Rien contre vous, Hoel : c'est eux qui ont fait l'offre qui tenait.",
      });
    }
    if (chemin[D.agrandir] === 1 && dans(SEMAINES)) {
      const n = connaissance(chemin).hesitants;
      const ok = t.futur.agrandissements;
      lies.push({
        ...SKLAERENN,
        heure: `sem. ${SEMAINES}`,
        texte:
          ok === 0
            ? `Aucun des ${n} voisins n'a signé : ils attendront de voir.`
            : `${EN_LETTRES[ok]} des ${n} voisins ${ok > 1 ? "ont" : "a"} signé : ${nombre(ok * AGRANDIR.volume * 1000, 0)} 000 litres de plus par an, là où les exploitations s'arrêtent.`,
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
    titre,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget lait du trimestre, ventes de desserts perdues comprises, plus la valeur des volumes sécurisés pour les trois années suivantes, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Coût du lait",
          valeur: kE(t.coutLait),
          aide: `budget du trimestre : ${kE(t.budget)}`,
          tenu: t.coutLait <= t.budget,
        },
        {
          nom: "Ruptures au pic de Noël",
          valeur: t.rupture > 0.005 ? `${nombre(t.rupture * 1000, 0)} 000 l` : "aucune",
          aide:
            t.rupture > 0.005
              ? `${kE(t.ventesPerdues)} de ventes de desserts perdues`
              : "tous les desserts de Noël livrés",
          tenu: t.rupture <= 0.005,
        },
        {
          nom: "Lait sécurisé",
          valeur: `${nombre(t.futur.volume, 1)} Ml/an`,
          aide: `pour les trois ans à venir ; repère : ${REPERE_SECURISE} Ml/an`,
          tenu: t.futur.volume >= REPERE_SECURISE,
        },
        {
          nom: "Coût de collecte",
          valeur: `${parMille(t.coutCollecteMoyen)}`,
          aide: `les 1 000 litres, en moyenne ; ${parMille(COUT_COLLECTE_DEPART)} en septembre`,
          tenu: t.coutCollecteMoyen <= COUT_COLLECTE_DEPART,
        },
      ];
    },
    hasard(t, graine) {
      const niveau = SPOT.min + t.niveauSpot * (SPOT.max - SPOT.min);
      const qualif = t.niveauSpot > 2 / 3 ? "haut" : t.niveauSpot < 1 / 3 ? "bas" : "moyen";
      const f = t.futur;
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le spot",
          texte: `a été ${qualif} cet automne : ${euros(niveau)} les 1 000 litres en moyenne, ${SPOT.noel} € de plus à Noël. Il se tire entre ${euros(SPOT.min)} et ${euros(SPOT.max)} ; quand il est haut, le lait manque au pic.`,
        },
        {
          titre: "La chambre d'agriculture",
          texte: chambreActive(graine)
            ? "a pu détacher une conseillère pour suivre les projets : trois fois sur cinq, elle le peut."
            : "n'a pas pu détacher de conseillère : deux fois sur cinq, elle ne le peut pas.",
        },
        ...(t.echange
          ? [{ titre: "La Laiterie de Trévallec", texte: "a accepté l'échange des franges." }]
          : []),
        {
          titre: "Les producteurs",
          texte: [
            `${f.installations} installation${f.installations > 1 ? "s" : ""} abouti${f.installations > 1 ? "es" : "e"}`,
            f.gaecReste
              ? "le GAEC Guillouzic est resté"
              : "le GAEC Guillouzic est parti chez Nordal",
            `${f.agrandissements} voisin${f.agrandissements > 1 ? "s" : ""} prêt${f.agrandissements > 1 ? "s" : ""} à s'agrandir`,
          ]
            .join(", ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
