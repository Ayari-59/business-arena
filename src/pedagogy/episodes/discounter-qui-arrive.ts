/**
 * ÉPISODE 41 — LE DISCOUNTER QUI ARRIVE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Faustine montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Une riposte se juge sur des années, l'épisode sur un trimestre : le tableau
 * de bord suit donc la VALEUR ESTIMÉE, en écart au plan d'avant Tarval — la
 * marge du trimestre, plus une année pleine au régime atteint —, recalculée
 * chaque semaine avec ce que le trimestre révèle : la réaction de Tarval, sa
 * stratégie, l'adoption de la livraison, les contrats signés. Dès la semaine
 * 1, elle dit ce que coûterait l'inaction.
 */
import {
  ALIGNEMENT_INUTILE,
  BAISSE_GENERALE,
  CAP,
  CLIENTS,
  COUT_BAISSE_GENERALE,
  D,
  ECART_TARVAL,
  ECART_VISE,
  FABRICANT,
  FRAIS,
  GROUPES,
  JOURS_SANS_PERTE,
  LIVRAISON,
  MARGE_PLAN,
  NEUTRE,
  OBJECTIF_VALEUR,
  PART_EXPOSEE,
  PERTE_PAR_JOUR,
  PROMO,
  SEMAINES_PAR_AN,
  TAUX_DE_MARQUE,
  ZONE,
  alignement,
  evenements,
  hasard,
  signataires,
  simuler,
  tableauDeBord,
  type Groupe,
  type Trimestre,
} from "@/engine/episodes/discounter-qui-arrive";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/discounter-qui-arrive";
import type {
  Constat,
  Contexte,
  Episode,
  Lecture,
  Message,
  PartieJouee,
} from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
/** Des millions d'euros au centième : « 3,43 M€ ». */
const mE = (v: number) =>
  `${(v / 1e6).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M€`;
const points = (v: number) => `${nombre(v * 100)} pt`;

const TANCREDE = { de: "Tancrède Treffort", role: "Président d'Arvel Distribution" } as const;
const FULVIO = { de: "Fulvio Ranieri", role: "Chef de l'agence de Vénissieux" } as const;
const MAHAUT = { de: "Mahaut Lescure", role: "Cheffe de l'agence de Villefranche" } as const;
const ZELIE = { de: "Zélie Fouquereau", role: "Responsable transport de la région" } as const;
const ISEULT = { de: "Iseult Castellan", role: "Juriste du groupe" } as const;

const groupeDe = (cle: Groupe["cle"]) => GROUPES.find((g) => g.cle === cle)!;
const annuel = (hebdo: number) => hebdo * SEMAINES_PAR_AN;

/** Les PME des trois agences du nord. */
export const PME_DU_NORD = Math.round(CLIENTS.pme.comptes * (1 - ZONE));

/** Ce que rapporterait par an la remise du fabricant, à volumes tenus. */
export const RFA_ANNUELLE =
  FABRICANT.rfa *
  FABRICANT.part *
  (1 - TAUX_DE_MARQUE.base) *
  annuel(
    GROUPES.reduce((s, g) => s + g.base, 0) + CLIENTS.entreprises.ca * CLIENTS.entreprises.base,
  );

/** Ce que coûte par semaine de suivre l'opération de Tarval partout, à volumes constants. */
export const COUT_SUIVRE = GROUPES.reduce(
  (s, g) =>
    s +
    PROMO.remise * (g.segment === "artisans" ? PROMO.artisans : PROMO.pme) * g.comparees * g.base,
  0,
);

/** La baisse que la riposte de la semaine 1 consent à un groupe : sur les références comparées, sur le reste. */
function baissesDeLaRiposte(d1: number, g: Groupe) {
  if (d1 === 0 || (d1 === 3 && g.zone)) return { c: BAISSE_GENERALE, r: BAISSE_GENERALE };
  if (d1 === 1 && g.zone) return { c: alignement(g.ecart), r: 0 };
  return { c: 0, r: 0 };
}

/**
 * CE QUE LA RIPOSTE PAIE, par an, à volumes constants : en tout, et à ceux
 * qui ne partiraient pas — les références que personne ne compare, les
 * artisans du nord, les références alignées que les clients ne regardent pas.
 */
export function coutDeLaRiposte(d1: number) {
  let total = 0;
  let inutile = 0;
  for (const g of GROUPES) {
    const { c, r } = baissesDeLaRiposte(d1, g);
    const comparees = c * g.comparees * g.base;
    const reste = r * (1 - g.comparees) * g.base;
    total += comparees + reste;
    inutile += reste + (g.cle === "artisansNord" ? comparees : comparees * ALIGNEMENT_INUTILE);
  }
  return { total: annuel(total), inutile: annuel(inutile) };
}

/** Ce que coûte par mois le prix palette garanti aux PME de la zone, selon la riposte de la semaine 1. */
export function coutDeLaGarantie(d1: number) {
  const g = groupeDe("pmeZone");
  const enPromo = 1 - (1 - g.ecart) * (1 - PROMO.remise * PROMO.pme);
  const extra = Math.max(0, alignement(enPromo) - baissesDeLaRiposte(d1, g).c);
  return (extra * g.comparees * g.base * SEMAINES_PAR_AN) / 12;
}

/** La part des achats de base du plan que la région garde, d'après le tableau de bord. */
const volumesDe = (l: Lecture) => {
  const a = CLIENTS.artisans.ca * CLIENTS.artisans.base;
  const p = CLIENTS.pme.ca * CLIENTS.pme.base;
  const e = CLIENTS.entreprises.ca * CLIENTS.entreprises.base;
  return (a * (l.artisans ?? 1) + p * (l.pme ?? 1) + e) / (a + p + e);
};

/** Les achats des artisans du nord, déduits de ceux de tous les artisans et de ceux de la zone. */
const artisansDuNord = (l: Lecture) => {
  const z = groupeDe("artisansZone").base;
  const n = groupeDe("artisansNord").base;
  return ((l.artisans ?? 1) * (z + n) - (l.artisansZone ?? 1) * z) / n;
};

const ouiNon = (v: number | null | undefined) => (v === 1 ? "oui" : v === 0 ? "non" : "");

/** Ce que les décisions révèlent, dans l'ordre où une directrice régionale les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui disaient qui achète quoi, et ce que fait Tarval quand on le suit",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    exposition:
      "Votre diagnostic de la semaine 1 était juste : Tarval ne prend que ce qui se compare et s'enlève ; la riposte protège ceux qui comparent, sur ce qu'ils comparent, et renforce ce qu'il ne sait pas faire.",
    service:
      "En semaine 1, vous avez vu ce que Tarval ne sait pas faire, mais vous lui laissiez le prix : les clients exposés partent sur les références qu'ils comparent, et le service seul ne les retient pas.",
    prix: "En semaine 1, vous avez cru qu'il fallait s'aligner partout pour ne perdre personne ; la plupart des clients ne seraient pas partis, et un concurrent qui a huit points de frais de moins suit une baisse large.",
    fidelite:
      "En semaine 1, vous avez compté sur la fidélité des clients ; elle tient chez ceux qu'on livre, pas chez ceux qui enlèvent et comparent.",
  };
  const justes = ["exposition", "service"];
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
    score: d === "exposition" ? 1 : d === "service" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes d'une direction sous pression : ni baisser partout, ni attendre, ni répondre sur le terrain du prix, ni s'engager sans tester, ni peser sur un fournisseur, ni suivre chaque promotion du concurrent."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : baisser partout ou ne rien faire, répondre sur le terrain du prix, s'engager sans tester, peser sur un fournisseur, rester sur le segment qu'on croyait visé, suivre ou garantir le prix du concurrent.${
            t.guerre
              ? " Tarval a suivi nos baisses : l'écart est revenu, et les baisses sont restées."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    COUT_BAISSE_GENERALE / 1000,
    "de marge par an pour la baisse générale de 8 %",
    "k€",
    { juste: 10, proche: 40 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const ciblee = p.chemin[D.riposte] === 1;
  const nord = p.chemin[D.nord] === 1;
  const segment: Constat = {
    score: ciblee && nord ? 1 : ciblee || nord ? 0.6 : 0,
    texte:
      ciblee && nord
        ? "Vous avez protégé le segment qui compte : les références comparées là où l'on compare, puis les PME du nord quand les chiffres ont montré qu'elles partaient pour les palettes."
        : ciblee
          ? "Vous avez aligné ce qui se compare dans la zone, mais pas suivi les PME du nord quand les chiffres ont montré qu'elles partaient : le segment touché n'était pas tout à fait celui qu'on croyait."
          : nord
            ? "Vous avez su aller chercher les PME du nord quand les chiffres l'ont montré, mais votre riposte de la semaine 1 ne visait pas ce que les clients comparent, là où ils comparent."
            : "Vous n'avez protégé ni les références comparées dans la zone, ni les PME du nord qui partaient pour les palettes : la riposte a payé ceux qui restaient, ou personne.",
  };

  return [information, diagnostic, reflexe, calibrage, segment];
}

export function axe([information, diagnostic, reflexe, calibrage, segment]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Savoir qui achète quoi, et où, avant de riposter",
      texte:
        "Rejouez l'épisode en commençant par les ventes par type de client et par le relevé de Tarval : un client livré ne va pas chez un discounter, et un concurrent qui a huit points de frais de moins suit une baisse large.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ne pas payer ceux qui ne partiraient pas",
      texte:
        "Une baisse générale rend de la marge à tous les clients pour en retenir quelques-uns, et invite le concurrent à suivre. Alignez ce qui se compare, là où l'on compare, et renforcez ce qu'il ne sait pas faire.",
    };
  }
  if (segment!.score === 0) {
    return {
      titre: "Suivre le segment qui part vraiment",
      texte:
        "Les premiers chiffres disent qui part : regardez-les par agence et par type de client, et déplacez l'effort quand ils contredisent le plan.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui est exposé",
      texte:
        "Un discounter ne prend pas toute la clientèle : il prend ce qui se compare et s'enlève près de ses dépôts. Commencez par mesurer cette part avant de choisir l'ampleur de la riposte.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Chiffrer une baisse de prix",
      texte:
        "Une baisse de 8 % du prix enlève 8 % du chiffre d'affaires concerné à la marge, à volumes constants, pas 8 % de la marge : sur des produits à 21 % de taux de marque, c'est plus du tiers de la marge.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions : un Tarval qui vise la part de marché, ou qui suit vos baisses, met une riposte à l'épreuve.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? t.depart : t.semaines[w]!.valeur);

export const EPISODE_DISCOUNTER: Episode<Trimestre> = {
  code: "discounter-qui-arrive",
  numero: 41,
  domaine: "Riposte concurrentielle",
  titre: "Le discounter qui arrive",
  resume:
    "Une enseigne à bas prix ouvre deux dépôts aux portes de vos agences. Riposter là où l'on compare, sans déclencher une guerre des prix, et renforcer ce qu'elle ne sait pas faire.",
  persona:
    "Vous êtes Faustine Montagnac, directrice régionale Rhône d'Arvel Distribution : huit agences autour de Lyon, 36 M€ de chiffre d'affaires, des artisans au comptoir, des PME qui enlèvent leurs palettes, des entreprises livrées sur chantier. Dans quinze jours, Tarval ouvre deux dépôts en libre-service à Vénissieux et à Saint-Priest.",
  mandat: [
    { fort: "8 agences", texte: "autour de Lyon, 36 M€ de chiffre d'affaires par an" },
    { fort: `${kE(MARGE_PLAN)}`, texte: "de marge commerciale par semaine au plan" },
    { fort: "10 à 15 %", texte: "l'écart de prix de Tarval sur les produits de base" },
    {
      fort: kE(-OBJECTIF_VALEUR),
      texte: "de valeur au plus, ce que la direction accepte de perdre face à Tarval",
    },
  ],
  jugement:
    "Votre direction juge le trimestre sur la valeur estimée en semaine 13, en écart au plan d'avant Tarval : la marge du trimestre, coûts des actions compris, plus une année pleine au régime atteint, recalculée avec ce que le trimestre a révélé.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre région",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la riposte ne sera pas prête le jour où Tarval ouvre.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...TANCREDE,
        alerte: true,
        texte: `Le comité a dû attendre ta riposte : les étiquettes et les argumentaires partiront en retard sur l'ouverture de Tarval. On estime le manque à ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "ce que coûterait par an, à volumes constants, la baisse de 8 % de toute la gamme de base à l'enlèvement, en milliers d'euros de marge",
    unite: "k€",
    placeholder: "300",
    min: 0,
    max: 3000,
    step: 1,
    reel: () => COUT_BAISSE_GENERALE / 1000,
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
          ? "en écart au plan : le trimestre, et un an au régime atteint"
          : "en écart au plan, si l'on ne fait rien",
    },
    {
      cle: "marge",
      nom: "Marge de la semaine",
      format: kE,
      sensBon: 1,
      aide: () => `plan : ${kE(MARGE_PLAN)} par semaine`,
      jauge: (l) => ({
        part: Math.min(1, (l.marge ?? MARGE_PLAN) / MARGE_PLAN),
        enRetard: (l.marge ?? MARGE_PLAN) < 0.97 * MARGE_PLAN,
      }),
    },
    {
      cle: "ecart",
      nom: "Écart de prix avec Tarval",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: -1,
      aide: () => `au comptoir, dans la zone ; ${taux(ECART_TARVAL.comptoir, 0)} à l'ouverture`,
    },
    {
      cle: "pme",
      nom: "Achats de base des PME",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `du plan ; zone ${taux(l.pmeZone ?? 1, 0)}, nord ${taux(l.pmeNord ?? 1, 0)}`
          : "rapportés à avant Tarval",
    },
    {
      cle: "artisans",
      nom: "Achats de base des artisans",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `du plan ; zone ${taux(l.artisansZone ?? 1, 0)}, nord ${taux(artisansDuNord(l), 0)}`
          : "rapportés à avant Tarval",
    },
  ],
  contexte(l, decisions): Contexte {
    const d1 = decisions[D.riposte] ?? NEUTRE[D.riposte];
    const riposte = coutDeLaRiposte(d1);
    const a = CLIENTS.artisans;
    const p = CLIENTS.pme;
    const e = CLIENTS.entreprises;
    return {
      // Semaine 1 : la clientèle et Tarval.
      comptesArtisans: nombre(a.comptes, 0),
      caArtisans: mE(annuel(a.ca)),
      baseArtisans: mE(annuel(a.ca * a.base)),
      comptesPme: nombre(p.comptes, 0),
      caPme: mE(annuel(p.ca)),
      basePme: mE(annuel(p.ca * p.base)),
      comptesLivres: nombre(e.comptes, 0),
      caLivres: mE(annuel(e.ca)),
      baseLivres: mE(annuel(e.ca * e.base)),
      zone: taux(ZONE, 0),
      margeBase: taux(TAUX_DE_MARQUE.base, 0),
      margeTechnique: taux(TAUX_DE_MARQUE.technique, 0),
      exposee: taux(PART_EXPOSEE),
      ecartComptoir: taux(ECART_TARVAL.comptoir, 0),
      ecartPalette: taux(ECART_TARVAL.palette, 0),
      fraisTarval: taux(FRAIS.tarval, 0),
      fraisArvel: taux(FRAIS.arvel, 0),
      alignComptoir: taux(alignement(ECART_TARVAL.comptoir, ECART_VISE)),
      alignPalette: taux(alignement(ECART_TARVAL.palette, ECART_VISE)),
      // Semaine 2 : la livraison.
      gainForte: taux(LIVRAISON.forte.entreprises),
      gainFaible: taux(LIVRAISON.faible.entreprises, 0),
      coutLivraison: kE(LIVRAISON.coutAnnuel),
      coutTest: euros(LIVRAISON.test.hebdo),
      miseEnPlace: kE(LIVRAISON.test.miseEnPlace),
      // Semaine 4 : le fabricant.
      tauxRfa: taux(FABRICANT.rfa, 0),
      seuilPlein: taux(FABRICANT.plein, 0),
      seuilNul: taux(FABRICANT.nul, 0),
      rfaAnnuelle: kE(RFA_ANNUELLE),
      volumes: taux(volumesDe(l)),
      provision: kE(FABRICANT.provision),
      cooperation: kE(FABRICANT.cooperation),
      // Semaine 6 : les premiers chiffres.
      suivi: ouiNon(l.guerre),
      pme: taux(l.pme ?? 1, 0),
      artisans: taux(l.artisans ?? 1, 0),
      artisansZone: taux(l.artisansZone ?? 1, 0),
      artisansNord: taux(artisansDuNord(l), 0),
      pmeZone: taux(l.pmeZone ?? 1, 0),
      pmeNord: taux(l.pmeNord ?? 1, 0),
      pmeNordComptes: PME_DU_NORD,
      basePmeNord: mE(annuel(groupeDe("pmeNord").base)),
      // Semaine 8 : l'opération d'hiver.
      promoPalette: taux(PROMO.pme, 0),
      coutSuivre: kE(COUT_SUIVRE),
      coutGarantie: kE(coutDeLaGarantie(d1)),
      // Semaine 11 : le cap.
      conquete: ouiNon(l.conquete),
      forte: ouiNon(l.forte),
      recentrage:
        riposte.total > 0
          ? `Votre riposte de la semaine 1 coûte ${kE(riposte.total)} de marge par an, à volumes constants ; ${kE(riposte.inutile)} vont à des références que personne ne compare ou à des clients qui ne partent pas : sur les 150 références alignées, 60 font l'essentiel des comparaisons.`
          : "Vous n'avez baissé aucun prix en semaine 1 : rien à retirer de ce côté.",
      depotOuverture: kE(CAP.depot.ouverture),
      depotHebdo: kE(CAP.depot.hebdo),
      repriseBasse: taux(CAP.depot.reprise[1]!, 0),
      repriseHaute: taux(CAP.depot.reprise[0]!, 0),
      margeDepot: taux(CAP.depot.margeReprise, 0),
      cannibalisation: taux(CAP.depot.cannibalisation, 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Achats de base des PME, sem. ${a}`, taux(s.pme, 0)],
    ];
  },
  courbe: {
    titre: "Marge commerciale, semaine par semaine",
    cle: "marge",
    cible: MARGE_PLAN,
    libelleCible: `plan : ${kE(MARGE_PLAN)} par semaine`,
    graduations: [50000, 100000, 150000],
    format: kE,
    details: (s) => [
      `marge ${kE(s.marge!)} · contribution ${kE(s.contribution!)}`,
      `valeur estimée ${kE(s.valeur!)} · PME ${taux(s.pme!, 0)} · artisans ${taux(s.artisans!, 0)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.nord && choix === 1) {
      // L'accueil des PME du nord dépend du hasard du trimestre.
      const h = hasard(graine);
      return [
        {
          ...MAHAUT,
          texte:
            h.adhesion >= 0.68
              ? "Les PME du nord accueillent bien le contrat : Kossi Agbodjan a signé le premier, et la plupart des autres suivront."
              : "Accueil prudent : plusieurs PME du nord veulent d'abord comparer avec Tarval sur un mois. Les commerciaux insistent.",
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
    if (arrive.ouverture) {
      lies.push({
        ...FULVIO,
        heure: "sem. 3",
        texte:
          "Tarval a ouvert lundi : le parking était plein à 6 h, surtout des plateaux et des camionnettes de PME.",
      });
    }
    if (arrive.suivi) {
      lies.push({
        ...FULVIO,
        heure: "sem. 5",
        alerte: t.semaines[5]!.guerre === 1,
        texte: t.semaines[5]!.guerre === 1 ? REPONSES.suiviOui : REPONSES.suiviNon,
      });
    }
    if (arrive.contrats) {
      const n = Math.round(signataires(chemin, h) * PME_DU_NORD);
      lies.push({
        ...MAHAUT,
        heure: "sem. 8",
        texte: `${n} PME du nord sur ${PME_DU_NORD} ont signé le contrat d'un an.`,
      });
    }
    if (arrive.test) {
      lies.push({
        ...ZELIE,
        heure: "sem. 10",
        alerte: !h.forte,
        texte:
          chemin[D.livraison] === 2
            ? h.forte
              ? REPONSES.testFort
              : REPONSES.testFaible
            : h.forte
              ? REPONSES.livraisonForte
              : REPONSES.livraisonFaible,
      });
    }
    if (arrive.plainte) {
      lies.push({
        ...ISEULT,
        heure: "sem. 10",
        alerte: t.plainte,
        texte: t.plainte ? REPONSES.plainte : REPONSES.pasDePlainte,
      });
    }
    if (arrive.escalade) {
      lies.push({
        ...FULVIO,
        heure: "sem. 11",
        alerte: t.escalade,
        texte: t.escalade
          ? REPONSES.escalade
          : t.semaines[5]!.guerre === 1
            ? REPONSES.enGuerre
            : REPONSES.pasDEscalade,
      });
    }
    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.annonce) {
      imprevus.push({
        ...TANCREDE,
        heure: "sem. 10",
        texte: h.conquete
          ? "Tarval a déposé un permis de construire pour un troisième dépôt, à Villefranche, et recrute six commerciaux terrain : il vise la part de marché."
          : "Tarval annonce une hausse de 3 % de ses prix au 1er janvier et ferme désormais le samedi après-midi : il veut rentabiliser ses dépôts.",
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur gagnée sur le plan, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur perdue sur le plan, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur estimée en semaine 13, en écart au plan d'avant Tarval : la marge du trimestre, coûts des actions compris, plus une année pleine au régime atteint, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const s = t.semaines[13]!;
      return [
        {
          nom: "Valeur estimée",
          valeur: kE(t.objectif),
          aide: `en écart au plan ; perte acceptée : ${kE(-OBJECTIF_VALEUR)} au plus`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Guerre des prix",
          valeur: t.guerre ? "déclenchée" : "évitée",
          aide: t.guerre ? "Tarval a suivi nos baisses" : "Tarval n'a pas suivi nos baisses",
          tenu: !t.guerre,
        },
        {
          nom: "Achats de base des PME",
          valeur: taux(s.pme, 0),
          aide: "du plan en semaine 13 ; 75 % au moins",
          tenu: s.pme >= 0.75,
        },
        {
          nom: "Achats de base des artisans",
          valeur: taux(s.artisans, 0),
          aide: "du plan en semaine 13 ; 90 % au moins",
          tenu: s.artisans >= 0.9,
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
          titre: "Tarval",
          texte: t.conquete
            ? "visait la part de marché à tout prix : un troisième dépôt, et des prix d'opération devenus ses prix."
            : "visait la rentabilité de ses dépôts : son opération d'hiver s'est arrêtée, et ses prix remontent en janvier.",
        },
        {
          titre: "Sa réaction",
          texte: t.guerre
            ? "Il a suivi nos baisses : l'écart est revenu, et la guerre des prix a rogné la marge de toute la gamme enlevée."
            : "Il n'a pas suivi nos baisses : l'écart que nous avons choisi a tenu.",
        },
        {
          titre: "La livraison du lendemain",
          texte: t.forte
            ? "était de celles que les clients adoptent : là où elle a été proposée, ils en ont pris l'habitude."
            : "n'était pas de celles que les clients adoptent : une fois sur deux à peine, ils en prennent l'habitude.",
        },
        {
          titre: "Les PME du nord",
          texte:
            t.signataires !== null
              ? `${Math.round(t.signataires * PME_DU_NORD)} sur ${PME_DU_NORD} ont signé le contrat d'un an.`
              : `${taux(h.adhesion, 0)} auraient signé un contrat d'un an s'il leur avait été proposé.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
