/**
 * ÉPISODE 97 — LES NÉGOCIATIONS DU 1ER MARS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord du compte Celtis montre, ce que la
 * courbe trace, ce sur quoi le bilan juge Baptistin, et ce que ses décisions
 * révèlent de lui.
 */
import {
  BUDGET_MARGE,
  D,
  DEMANDE_CELTIS,
  DEREFERENCEMENT,
  FAIBLES,
  HAUSSE_CGV,
  HAUSSE_DU_PLAN,
  JOURS_SANS_PERTE,
  LEADERS,
  MARGE_PERDUE_DOUZE,
  MARQUE,
  MENACEES,
  NEUTRE,
  O,
  PART_AGRICOLE,
  PERTE_PAR_JOUR,
  PLAN,
  PRIX_LAIT,
  SEMAINES_DE_MEDIATION,
  SOMMEIL,
  caNouveautes,
  evenements,
  hasard,
  margeAnnuelle,
  prepare,
  simuler,
  tableauDeBord,
  type Issue,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/negociations-annuelles";
import {
  CYRIELLE,
  DIAGNOSTICS,
  ETAPES,
  GWENVAEL,
  KONOGAN,
  MEVENA,
  MORWENNA,
  NAIM,
  REFERENCES,
  REFLEXES,
  REPONSES,
  YSEE,
  enLettres,
  pct,
  points,
} from "@/config/episodes/negociations-annuelles";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const millions = (v: number) => `${nombre(v / 1_000_000, 1)} M€`;
const ecartEnPoints = (v: number) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${nombre(Math.abs(v * 100), 1)} pt`;
const agricoleLue = (v: number) => (v > 0 ? points(v) : "contestée");
/** Un titre en milieu de phrase : la majuscule initiale tombe, sauf sur un sigle (« DGCCRF »). */
const enMinuscule = (titre: string) =>
  /^[A-ZÉ]{2,}\b/.test(titre) ? titre : titre.charAt(0).toLowerCase() + titre.slice(1);

/** La prévision de la semaine 1, en k€ : la marge annuelle perdue si Celtis retirait les douze références. */
export const MARGE_PERDUE_DOUZE_KE = MARGE_PERDUE_DOUZE / 1000;

/** Ce que Celtis a répondu au 1er mars, en quelques mots. */
export const ISSUES: Record<Issue, string> = {
  accord: "Celtis a signé",
  cede: "vous avez signé le prix de Celtis à l'échéance",
  mediation: "le médiateur a été saisi",
  partiel: "Celtis a retiré les références faibles",
  rupture: "Celtis a retiré les douze références",
};

/** Ce que les décisions révèlent, dans l'ordre où un directeur commercial les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, la marge des références menacées, ce que font leurs acheteurs quand elles manquent, et les indicateurs du contrat avec l'OP",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    preparation: `Votre diagnostic de la semaine 1 était juste : la part agricole (${points(PART_AGRICOLE)}) se justifiait par les indicateurs du contrat avec l'OP et sortait de la négociation ; le reste s'échangeait contre des contreparties ; et Celtis ne pouvait pas retirer les leaders sans perdre ${nombre(LEADERS.report * 100, 0)} % de leurs acheteurs.`,
    contreparties:
      "En semaine 1, vous avez vu que Celtis voulait des contreparties : c'était vrai pour le reste de la hausse. Mais la part agricole ne s'échangeait pas, elle se justifiait, et la menace se chiffrait avant de se craindre.",
    dependance: `En semaine 1, vous avez jugé que la laiterie ne pouvait pas perdre douze références. Chiffrée, la menace pesait ${kE(MARGE_PERDUE_DOUZE)} de marge sur un an, pas les ${kE(LEADERS.mcv + FAIBLES.mcv)} des douze références : ${nombre(LEADERS.report * 100, 0)} % des acheteurs des leaders les auraient cherchées ailleurs, et Celtis les aurait perdus.`,
    loi: "En semaine 1, vous avez compté sur la loi pour tenir les CGV. Elle protège la part agricole, si on la justifie ; le reste de la hausse se négocie, et une menace de déréférencement se règle en mois de procédure, pas au 1er mars.",
  };
  const justes = ["preparation", "contreparties"];
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
    score: d === "preparation" ? 1 : d === "contreparties" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? `Vous n'avez jamais cédé pour garder les références, ni rompu par principe. Hausse obtenue : ${pct(t.hausse)}.`
        : `Vous avez cédé pour garder les références, ou rompu par principe, ${n} fois sur ${ETAPES.length} décisions. Hausse obtenue : ${pct(t.hausse)}. Chaque point cédé coûte ${kE(MARQUE.ca / 100)} de marge par an, et la part agricole cédée ne se rattrape pas : le lait reste payé ${PRIX_LAIT.nouveau} € aux producteurs. Exiger les CGV entières, de son côté, fait courir le risque d'un déréférencement que rien ne compense.`,
  };

  const calibrage = constatCalibrage(
    p,
    MARGE_PERDUE_DOUZE_KE,
    "de marge annuelle perdue si Celtis retirait les douze références",
    "k€",
    { juste: 25, proche: 120 },
    (e) => `${nombre(e)} k€`,
  );

  const leviers = [
    p.chemin[D.ouverture] === O.ouverture.preparer,
    p.chemin[D.partAgricole] === O.partAgricole.attester,
    p.chemin[D.contreparties] === O.contreparties.plan,
    p.chemin[D.pression] === O.pression.donnees,
    p.chemin[D.offre] === O.offre.echanger || p.chemin[D.offre] === O.offre.agricoleSeule,
    p.chemin[D.echeance] === O.echeance.mediation,
  ];
  const tenus = leviers.filter(Boolean).length;
  const preparation: Constat = {
    score: tenus >= 5 ? 1 : tenus >= 3 ? 0.6 : 0,
    texte: `${
      leviers[0]
        ? "Vous avez préparé le premier rendez-vous, référence par référence."
        : "Vous êtes allé au premier rendez-vous sans dossier."
    } ${
      leviers[1]
        ? "La part agricole a été attestée par un tiers indépendant."
        : p.chemin[D.partAgricole] === O.partAgricole.ramener
          ? "Vous avez cédé une part de la part agricole."
          : "La part agricole n'a pas été attestée."
    } ${
      leviers[2]
        ? "Le reste de la hausse s'est échangé contre un plan d'affaires chiffré."
        : "Le reste de la hausse n'a pas été échangé contre un plan d'affaires."
    } ${
      leviers[3]
        ? "Vous avez montré à l'acheteuse ce que Celtis perdait sans vos leaders."
        : "Vous n'avez pas montré à Celtis ce qu'elle perdait sans vos leaders."
    } ${
      leviers[5]
        ? "Votre position de repli était prête pour le 1er mars : la médiation, et Opaline."
        : "Rien n'était prêt pour le cas où Celtis ne signerait pas."
    } Au 1er mars, ${ISSUES[t.issue]} ; hausse de l'année : ${pct(t.hausse)}, dont ${points(t.agricole)} de part agricole.`,
  };

  return [information, diagnostic, reflexe, calibrage, preparation];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  preparation,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer sa position de repli avant le premier rendez-vous",
      texte: `Rejouez l'épisode en lisant d'abord la marge des références menacées et l'étude de report : douze références, mais ${kE(MARGE_PERDUE_DOUZE)} de marge réellement en jeu sur un an, parce que ${nombre(LEADERS.report * 100, 0)} % des acheteurs des leaders les cherchent ailleurs. Et relisez le contrat avec l'OP : les ${points(PART_AGRICOLE)} de part agricole se justifient par ses indicateurs.`,
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni céder ni rompre : justifier, puis échanger",
      texte:
        "Céder la hausse pour garder le référencement coûte la part agricole, qu'on ne rattrape pas ; exiger les CGV entières coûte un déréférencement. Entre les deux, la part agricole se justifie et sort de la négociation, et le reste s'échange contre des contreparties chiffrées, en connaissant sa position de repli.",
    };
  }
  if (preparation!.score === 0) {
    return {
      titre: "Préparer chaque temps de la négociation",
      texte:
        "Un dossier par référence avant le premier rendez-vous, une attestation de la part agricole, un plan d'affaires contre le reste, des données à montrer quand la pression monte, et une médiation prête pour le 1er mars : la négociation annuelle se gagne avant d'entrer dans le box.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Séparer ce qui se justifie de ce qui se négocie",
      texte:
        "La part agricole ne se négocie pas : elle se justifie par les indicateurs du contrat avec les producteurs. Le reste de la hausse se négocie, contre des contreparties. Et la menace se chiffre, référence par référence, avant de se craindre.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte: `Refaites le calcul de la semaine 1 : ${kE(LEADERS.mcv)} de marge sur les leaders, dont ${nombre(LEADERS.report * 100, 0)} % se retrouvent ailleurs, et ${kE(FAIBLES.mcv)} sur les neuf autres, dont ${nombre(FAIBLES.report * 100, 0)} % seulement. La marge perdue n'est pas la marge des douze références.`,
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions : une autre réponse de Celtis au 1er mars, une mise en sommeil en janvier ou non, d'autres imprévus. Si le résultat tient, votre méthode tient.",
  };
}

/** La réponse de Celtis au 1er mars, telle que le joueur la reçoit. */
function reponseDuPremierMars(t: Trimestre, chemin: readonly number[]): Message[] {
  const signe = chemin[D.offre] === O.offre.accepter;
  if (signe) {
    return [
      {
        ...NAIM,
        heure: "sem. 13",
        texte: `Le 1er mars arrive sans surprise : la convention signée en février s'applique, à ${pct(t.hausse)}. Les douze références restent en rayon.`,
      },
    ];
  }
  switch (t.issue) {
    case "accord":
      return [
        {
          ...CYRIELLE,
          heure: "sem. 13",
          texte: `Ma direction accepte votre proposition : la convention est signée à ${pct(t.hausse)}, dont ${points(t.agricole)} de part agricole. Les ${MARQUE.references} références restent en rayon.`,
        },
      ];
    case "cede":
      return [
        {
          ...CYRIELLE,
          heure: "sem. 13",
          texte: `Comme convenu, nous signons à notre prix : ${pct(t.hausse)}. Les douze références restent en rayon.`,
        },
      ];
    case "mediation":
      return [
        {
          ...MEVENA,
          heure: "sem. 13",
          alerte: true,
          texte: `Rien n'est signé au 1er mars : nous avons saisi le médiateur des relations commerciales agricoles. Pendant ${enLettres(SEMAINES_DE_MEDIATION)} semaines, Celtis sera livrée sans la hausse. Le médiateur retient ${points(t.agricole)} de part agricole ; sa recommandation sur l'ensemble : ${pct(t.hausse)}.`,
        },
      ];
    case "partiel":
      return [
        {
          ...CYRIELLE,
          heure: "sem. 13",
          alerte: true,
          texte: `Sans signature, Celtis retire les références faibles de la marque à compter du 1er mars. Les leaders restent. Nous en reparlerons dans ${enLettres(DEREFERENCEMENT.partiel)} semaines, sur la base de ${pct(t.hausse)}.`,
        },
      ];
    case "rupture":
      return [
        {
          ...CYRIELLE,
          heure: "sem. 13",
          alerte: true,
          texte: `Sans signature, Celtis retire les douze références de sa liste à compter du 1er mars, les leaders compris. Nous en reparlerons dans ${enLettres(DEREFERENCEMENT.rupture)} semaines, sur la base de ${pct(t.hausse)}.`,
        },
      ];
  }
}

export const EPISODE_NEGOCIATIONS: Episode<Trimestre> = {
  code: "negociations-annuelles",
  numero: 97,
  domaine: "Négocier avec une centrale d'achat",
  titre: "Les négociations du 1er mars",
  resume:
    "Une centrale d'achat qui pèse 30 % du chiffre d'affaires répond à +5,8 % par −2 % et la menace de retirer douze références. La part agricole se justifie, le reste s'échange, et la menace se chiffre.",
  persona: `Vous êtes Baptistin Haddadi, directeur commercial de la Laiterie de Kerbrélan, entreprise familiale de 520 salariés à Loudéac et Pontivy : yaourts, fromages blancs, desserts lactés et crème fraîche, sous la marque Kerbrélan et sous marque de distributeur. Naïm Lefeuvre suit les grands comptes, Morwenna Pellen la marque ; Iwan Szymanski dirige les finances, Hoel Quiniou les relations avec les 310 producteurs de l'OP Lait du Méné. En face : Cyrielle Mainguené, acheteuse à la centrale de Celtis. Votre trimestre : décembre à février, les négociations annuelles, jusqu'au 1er mars.`,
  mandat: [
    {
      fort: pct(HAUSSE_CGV),
      texte: `dans vos CGV, dont ${points(PART_AGRICOLE)} de matière première agricole`,
    },
    { fort: "30 %", texte: "du chiffre d'affaires de la laiterie chez Celtis" },
    {
      fort: kE(BUDGET_MARGE),
      texte: "de marge annuelle sur Celtis dans le plan : la part agricole et un point de plus",
    },
    { fort: "1er mars", texte: "la date limite de signature de la convention" },
  ],
  jugement:
    "La direction générale juge le trimestre sur la marge annuelle attendue sur la marque Kerbrélan chez Celtis, au prix signé et avec les contreparties du plan d'affaires, moins la marge perdue pendant les déréférencements et les frais engagés pour négocier.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre compte Celtis",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps ; au-delà de deux jours, l'acheteuse cale le calendrier promotionnel de mars sans vous.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...MORWENNA,
        alerte: true,
        texte: `Pendant ce temps, Celtis a calé ses opérations de mars avec Nordal : nos deux meilleures semaines de prospectus sont parties. ${euros(perdu)} de marge en moins sur l'année.`,
      };
    },
  },
  prevision: {
    libelle:
      "la marge annuelle que la laiterie perdrait si Celtis retirait les douze références pendant un an, en milliers d'euros",
    unite: "k€",
    placeholder: "1 500",
    min: 0,
    max: 7000,
    step: 1,
    reel: () => MARGE_PERDUE_DOUZE_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge annuelle attendue",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `sur Celtis, au prix sur la table, pertes et frais déduits ; plan ${kE(BUDGET_MARGE)}`
          : `sur Celtis, si elle obtenait ${pct(DEMANDE_CELTIS)} ; plan ${kE(BUDGET_MARGE)}`,
      jauge: (l) => {
        const m = l.marge;
        if (m === null || m === undefined) return null;
        return { part: Math.max(0, Math.min(1, m / BUDGET_MARGE)), enRetard: m < BUDGET_MARGE };
      },
    },
    {
      cle: "offre",
      nom: "Hausse sur la table",
      format: (v) => pct(v),
      formatEcart: ecartEnPoints,
      sensBon: 1,
      aide: (semaine, l) =>
        l.signe
          ? "signée avec Celtis"
          : semaine === 13
            ? "pour l'année du contrat"
            : `l'offre de Celtis ; vos CGV : ${pct(HAUSSE_CGV)}`,
    },
    {
      cle: "agricole",
      nom: "Part agricole reconnue",
      format: agricoleLue,
      formatEcart: ecartEnPoints,
      sensBon: 1,
      aide: () => `par Celtis, sur ${points(PART_AGRICOLE)} justifiés par les indicateurs`,
    },
    {
      cle: "ventes",
      nom: "Ventes chez Celtis",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `marque Kerbrélan, semaine ${semaine}` : "par semaine, en moyenne",
    },
    {
      cle: "references",
      nom: "Références en rayon",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => `sur ${MARQUE.references} chez Celtis, dont ${MENACEES} menacées`,
    },
  ],
  contexte(l, decisions) {
    const finale = l.offreFinale ?? 0;
    return {
      offre: pct(l.offre ?? DEMANDE_CELTIS),
      offreFinale: pct(finale),
      marge: kE(l.marge ?? 0),
      margeOffre: kE(margeAnnuelle(finale)),
      ventes: kE(l.ventes ?? 0),
      references: nombre(l.references ?? MARQUE.references, 0),
      agricole: agricoleLue(l.agricole ?? 0),
      sommeil: (l.sommeil ?? 0) > 0,
      signe: (l.signe ?? 0) > 0,
      prepare: prepare(decisions),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      [`Hausse sur la table, sem. ${a}`, pct(t.semaines[a]!.offre)],
      [`Ventes chez Celtis, sem. ${de} à ${a}`, kE(semaines.reduce((x, w) => x + w.ventes, 0))],
      [`Marge annuelle attendue, sem. ${a}`, kE(t.semaines[a]!.marge)],
    ];
  },
  courbe: {
    titre: "Marge annuelle attendue sur Celtis, semaine par semaine",
    cle: "marge",
    cible: BUDGET_MARGE,
    libelleCible: `plan : ${kE(BUDGET_MARGE)}`,
    graduations: [4_200_000, 4_600_000, 5_000_000, 5_400_000, 5_800_000, 6_200_000],
    format: millions,
    details: (s) => [
      `hausse sur la table ${pct(s.offre!)} · part agricole ${agricoleLue(s.agricole!)}`,
      `ventes de la semaine ${kE(s.ventes!)} · ${nombre(s.references!, 0)} références en rayon`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.contreparties && choix === O.contreparties.plan) {
      // Celtis choisit les nouveautés qu'elle référence, selon le hasard du trimestre.
      const deux = caNouveautes(graine) === PLAN.nouveautes.ca;
      return [{ ...CYRIELLE, texte: deux ? REPONSES.deuxNouveautes : REPONSES.uneNouveaute }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    // L'attestation part chez Celtis en semaine 5 si le dossier était prêt, en semaine 9 sinon.
    const attestation = prepare(chemin) ? 5 : 9;
    if (chemin[D.partAgricole] === O.partAgricole.attester && dans(attestation)) {
      lies.push({
        ...GWENVAEL,
        heure: `sem. ${attestation}`,
        texte: `L'attestation est transmise à Celtis : la part agricole de ${points(PART_AGRICOLE)} correspond aux indicateurs du contrat avec l'OP Lait du Méné et à la part du lait dans vos tarifs.`,
      });
    }
    if (arrive.sommeil) {
      lies.push({
        ...YSEE,
        heure: `sem. ${SOMMEIL.debut}`,
        alerte: true,
        texte: `Celtis ne commande plus quatre de nos références depuis lundi : le seau de fromage blanc d'un kilo et trois yaourts aromatisés. Officiellement, « une revue d'assortiment ».`,
      });
    }
    const finSommeil =
      chemin[D.pression] === O.pression.president ? SOMMEIL.debut + 1 : SOMMEIL.fin;
    if (t.sommeil && dans(finSommeil + 1)) {
      lies.push({
        ...NAIM,
        heure: `sem. ${finSommeil + 1}`,
        texte:
          "Les quatre références sont de retour en rayon. Le seau de fromage blanc a retrouvé ses ventes en une semaine ; les trois yaourts aromatisés, pas tout à fait : Nordal a gardé une partie de leurs facings.",
      });
    }
    if (arrive.issue) {
      lies.push(...reponseDuPremierMars(t, chemin));
      if (t.agricole < PART_AGRICOLE - 1e-9) {
        lies.push({
          ...KONOGAN,
          heure: "sem. 13",
          texte: `${
            t.issue === "partiel" || t.issue === "rupture"
              ? "Le bureau de l'OP a appris sur quelle base vous reprendrez la discussion avec Celtis"
              : "Le bureau de l'OP a lu la convention avec Celtis"
          } : ${points(t.agricole)} de part agricole, quand nos indicateurs en justifiaient ${points(PART_AGRICOLE)}. Vous nous paierez ${PRIX_LAIT.nouveau} €, le contrat est clair. Mais ne venez pas nous dire l'an prochain que le marché ne suit pas.`,
        });
      }
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
      `${kE(t.objectif)} de marge annuelle attendue sur Celtis : ${ISSUES[t.issue]}, à ${pct(t.hausse)}`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge annuelle attendue sur la marque Kerbrélan chez Celtis, au prix obtenu et avec les contreparties, moins la marge perdue pendant les déréférencements et les frais de la négociation, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Part agricole",
          valeur: points(t.agricole),
          aide: `dans le prix de l'année ; ${points(PART_AGRICOLE)} justifiés par les indicateurs du contrat avec l'OP`,
          tenu: t.agricole >= PART_AGRICOLE - 1e-9,
        },
        {
          nom: "Hausse de l'année",
          valeur: pct(t.hausse),
          aide: `CGV ${pct(HAUSSE_CGV)}, demande de Celtis ${pct(DEMANDE_CELTIS)} ; plan ${pct(HAUSSE_DU_PLAN)}`,
          tenu: t.hausse >= HAUSSE_DU_PLAN - 1e-9,
        },
        {
          nom: "Références en rayon",
          valeur: `${nombre(t.referencesFin, 0)} sur ${MARQUE.references}`,
          aide: "au 1er mars, chez Celtis",
          tenu: t.referencesFin >= MARQUE.references,
        },
        {
          nom: "Marge annuelle attendue",
          valeur: kE(t.objectif),
          aide: `sur Celtis, pertes et frais déduits ; plan ${kE(BUDGET_MARGE)}`,
          tenu: t.objectif >= BUDGET_MARGE,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${enMinuscule(imprevu.titre)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Janvier",
          texte: t.sommeil
            ? `Celtis a mis quatre références en sommeil pendant quelques semaines ; les yaourts aromatisés n'ont pas retrouvé toutes leurs ventes.`
            : "Celtis n'a mis aucune référence en sommeil.",
        },
        {
          titre: "La réponse de Celtis au 1er mars",
          texte:
            t.risque > 0
              ? `${ISSUES[t.issue].replace(/^./, (c) => c.toUpperCase())}. Avec vos choix, le risque qu'elle ne signe pas était de ${nombre(t.risque * 100, 0)} %.`
              : `Vous aviez signé sa dernière offre en semaine 9 : aucun risque de refus, et ${points(Math.max(0, PART_AGRICOLE - t.agricole))} de part agricole cédés.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
