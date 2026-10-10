/**
 * ÉPISODE 43 — LE MARCHÉ QUI S'OUVRE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Geneviève montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Une entrée sur un marché se joue sur des années, l'épisode sur un
 * trimestre : le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, le
 * résultat du trimestre plus la valeur sur trois ans du plan engagé pour
 * l'an prochain, recalculée chaque semaine avec ce que le trimestre apprend.
 * Avant l'annonce du budget et les chiffres du test, elle est estimée en
 * espérance sur les trois scénarios ; elle bouge quand on décide, et quand
 * le trimestre révèle : les aides, le rythme du marché, Solvéane.
 */
import {
  ARTISANS,
  CALENDRIER,
  D,
  EFFET,
  ENVELOPPE,
  FABRICANT,
  JOURS_SANS_PERTE,
  MARCHE_ACCESSIBLE,
  NEUTRE,
  OBJECTIF_VALEUR,
  OUVERTURE,
  PERTE_PAR_JOUR,
  PLAN_ANNONCE,
  RIPOSTE,
  SEMAINES,
  TAUX,
  evenements,
  hasard,
  referencementAccepte,
  scenario,
  simuler,
  tableauDeBord,
  total,
  type Parc,
  type Trimestre,
} from "@/engine/episodes/marche-qui-s-ouvre";
import {
  ETAPES,
  DIAGNOSTICS,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/marche-qui-s-ouvre";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));

const SOLANGE = { de: "Solange Videau", role: "Directrice administrative et financière" } as const;
const MARWAN = { de: "Marwan Oukacha", role: "Directeur du réseau des agences" } as const;
const NOLWENN = { de: "Nolwenn Penhoët", role: "Contrôleuse de gestion" } as const;
const ABDOULAYE = {
  de: "Abdoulaye Barry",
  role: "Chauffagiste RGE, client de l'agence de Bron",
} as const;
const LUKAS = { de: "Lukas Brenner", role: "Responsable grands comptes, Nordhalm" } as const;
const COME = { de: "Côme Vercoutre", role: "Associé, Varenge Conseil" } as const;

/** Le chiffre d'affaires accessible, en millions d'euros : ce que la prévision de la semaine 1 demande. */
export const MARCHE_EN_MILLIONS = MARCHE_ACCESSIBLE / 1e6;

/** Un ensemble d'agences, dit en français. */
const LETTRES = [
  "zéro",
  "une",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
];
const enLettres = (n: number, feminin = true) =>
  n === 1 && !feminin ? "un" : (LETTRES[n] ?? String(n));

/** Un ensemble d'agences, dit en français. */
export function decrire(p: Parc): string {
  const n = total(p);
  if (n === 0) return "aucune agence";
  if (p.grandes === 10 && p.autres === 20) return "les trente agences";
  if (p.autres === 0) {
    return p.grandes === 10 ? "les dix grandes agences" : `${enLettres(p.grandes)} grandes agences`;
  }
  const dont =
    p.grandes === 0 ? "aucune grande" : `${enLettres(p.grandes)} grande${p.grandes > 1 ? "s" : ""}`;
  return `${enLettres(n)} agences, dont ${dont}`;
}
/** « aucune fermeture », « une ouverture », « 27 ouvertures ». */
const compte = (n: number, mot: string) =>
  n === 0 ? `aucune ${mot}` : n === 1 ? `une ${mot}` : `${n} ${mot}s`;
const memeParc = (a: Parc, b: Parc) => a.grandes === b.grandes && a.autres === b.autres;

/** Ce que les décisions révèlent, dans l'ordre où une directrice de la stratégie les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de compter le marché par le bas",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    option:
      "Votre diagnostic de la semaine 1 était juste : le marché existait, son rythme non ; il fallait acheter l'information au plus petit prix et garder le droit d'accélérer ou d'arrêter.",
    artisans:
      "En semaine 1, vous avez vu la ressource rare : les artisans RGE. C'est vrai, et cela se protège à peu de frais ; mais le vrai inconnu était le rythme du marché, et lui seul décidait de l'ampleur.",
    vitesse:
      "En semaine 1, vous avez cru que le marché irait au premier entrant. Être premier ne vaut que si le marché est là : deux fois sur trois, il ne l'était pas au rythme du cabinet.",
    preuve:
      "En semaine 1, vous avez voulu attendre que le marché soit prouvé. Attendre n'apprend rien à Arvel, et laisse les artisans à qui viendra les chercher.",
  };
  const justes = ["option", "artisans"];
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
    score: d === "option" ? 1 : d === "artisans" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes du marché qui s'ouvre : ni tout miser sur le scénario du cabinet, ni attendre qu'un autre l'ait prouvé, ni tester là où l'on est sûr de réussir, ni signer des volumes garantis, ni tenir le plan contre les chiffres, ni riposter par les prix."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe qui rassure : être les premiers partout, ou attendre la preuve ; tester en vitrine ; occuper le terrain par des volumes garantis ; tenir ou accélérer le plan contre les chiffres ; casser les prix.${
            t.position.penalites < -1000
              ? ` Les engagements de volume vous coûtent ${kE(-t.position.penalites)} de pénalités.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    MARCHE_EN_MILLIONS,
    "de chiffre d'affaires accessible aux agences",
    "M€",
    { juste: 4, proche: 12 },
    (e) => `${nombre(e, 1)} M€`,
  );

  const d1 = p.chemin[D.entree];
  const d2 = p.chemin[D.test];
  const d5 = p.chemin[D.extension];
  const voulu = `le marché justifiait ${decrire(t.justifie)}`;
  let revision: Constat;
  if (d1 === 3) {
    revision = {
      score: 0,
      texte: `Vous n'avez rien testé : en semaine 8, il n'y avait aucun chiffre pour décider, et Arvel n'a pris aucune position, quand ${voulu}.`,
    };
  } else if (d5 === 1 && d2 === 1) {
    const sens =
      total(t.plan) > total(PLAN_ANNONCE[d1!]!)
        ? "à la hausse"
        : total(t.plan) < total(PLAN_ANNONCE[d1!]!)
          ? "à la baisse"
          : "sans changer le plan";
    revision = {
      score: 1,
      texte: `Vous avez testé sur des agences représentatives, jugées une par une contre le seuil de rentabilité, puis révisé le plan sur leurs chiffres, ${sens} : ${decrire(t.plan)} en janvier, ce que le marché justifiait.`,
    };
  } else if (d5 === 1) {
    revision = {
      score: 0.6,
      texte: memeParc(t.plan, t.justifie)
        ? "Vous avez révisé le plan sur les chiffres du test, et cette fois ils disaient vrai. Mais un test mené dans les plus grosses agences, ou jugé sur une moyenne, fait passer un marché moyen pour porteur : il aurait pu vous tromper."
        : `Vous avez révisé le plan sur les chiffres du test, mais le test, mené dans les plus grosses agences ou jugé sur une moyenne, a flatté le marché : vous engagez ${decrire(t.plan)} quand ${voulu}.`,
    };
  } else if (d5 === 2) {
    revision = {
      score: 0,
      texte: `Vous avez prolongé le test six mois plutôt que de trancher : l'extension perd près de la moitié de sa valeur à attendre, quand ${voulu}.`,
    };
  } else {
    revision = {
      score: 0,
      texte: `Vous avez ${d5 === 3 ? "accéléré" : "tenu le plan validé en semaine 1"} sans tenir compte des chiffres : vous engagez ${decrire(t.plan)} en janvier, quand ${voulu}.`,
    };
  }

  return [information, diagnostic, reflexe, calibrage, revision];
}

export function axe([information, diagnostic, reflexe, calibrage, revision]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Compter le marché avant d'y entrer",
      texte:
        "Rejouez l'épisode en commençant par les données de logement et les artisans : un marché se compte par le bas, et le chiffre d'un cabinet n'est pas celui de vos agences. Lisez ensuite les chiffres du test avant de décider de l'extension.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Tester avant d'engager",
      texte:
        "Quand personne ne sait à quel rythme un marché achètera, achetez l'information au plus petit prix : un test bien conçu, puis une extension décidée sur ses chiffres. Tout miser sur un scénario, ou attendre qu'un autre l'ait prouvé, coûte plus cher en moyenne.",
    };
  }
  if (revision!.score === 0) {
    return {
      titre: "Réviser l'ambition sur les faits",
      texte:
        "Un plan validé n'est qu'une hypothèse. Quand les chiffres d'un test bien mené arrivent, le plan les suit, à la hausse comme à la baisse ; le tenir, l'accélérer ou le reporter pour ne pas trancher détruit de la valeur.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Voir l'option derrière le test",
      texte:
        "Un test ne sert pas à prouver que l'on a raison : il achète le droit d'étendre si le marché est là, et de s'arrêter s'il ne l'est pas. Sa valeur tient à ce qu'il mesure, et à ce qu'on fait de ses chiffres.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Compter un marché par le bas",
      texte:
        "Maisons de la zone, part qui rénove chaque année, part vendue en bouquet, prix d'un bouquet : c'est ce calcul, pas l'étude d'un cabinet, qui dit ce que les agences peuvent vendre.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

/** Les agences ouvertes au trimestre, dites par le directeur du réseau. */
function ouverture(chemin: readonly number[], t: Trimestre): string {
  const [d1, d2] = chemin;
  if (d1 === 0) {
    return "Les trente agences proposent l'offre depuis lundi : dix conseillers rénovation, une campagne régionale, le stock en place.";
  }
  if (d1 === 1) {
    return `Les dix grandes agences proposent l'offre depuis lundi${
      d2 === 1 ? ", et deux agences plus petites, Meximieux et Tarare, pour le suivi" : ""
    }. Campagne lancée, stock en place.`;
  }
  return `Le test démarre dans ${decrire(t.implantation)} : ${
    d2 === 0
      ? "Villeurbanne, Écully et Bron"
      : d2 === 1
        ? "Villeurbanne, Meximieux et Tarare"
        : t.implantation.grandes === 2
          ? "Villeurbanne, Écully et Tarare"
          : "Villeurbanne, Meximieux et Tarare"
  }. Pas de stock : on commande au chantier.`;
}

export const EPISODE_NOUVEAU_MARCHE: Episode<Trimestre> = {
  code: "marche-qui-s-ouvre",
  numero: 43,
  domaine: "Entrée sur un marché",
  titre: "Le marché qui s'ouvre",
  resume:
    "Un cabinet annonce 650 M€, le président veut les trente agences, un installateur intégré regarde la région. Compter le marché par le bas, tester avant d'engager, et étendre sur les chiffres.",
  persona:
    "Vous êtes Geneviève Rivoallan, directrice de la stratégie d'Arvel Distribution : trente agences en Auvergne-Rhône-Alpes, siège à Lyon. La rénovation énergétique des maisons ouvre au négoce un marché nouveau : vendre aux particuliers des bouquets de travaux clés en main, posés par les artisans RGE du réseau. Le président veut y aller vite ; c'est à vous de proposer comment.",
  mandat: [
    {
      fort: kE(ENVELOPPE),
      texte: "réservés par le comité au lancement : un plafond, pas un objectif",
    },
    { fort: "30 agences", texte: "dix grandes, urbaines et périurbaines, et vingt autres" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins par les décisions du trimestre" },
    {
      fort: `semaine ${CALENDRIER.solveane}`,
      texte: "Solvéane dira s'il s'implante dans la région",
    },
  ],
  jugement:
    "Le comité juge le trimestre sur la valeur créée : le résultat du trimestre, plus la valeur sur trois ans, au taux de 10 %, du plan engagé pour l'an prochain, recalculée en semaine 13 avec ce que le trimestre a révélé — les aides, le rythme du marché, Solvéane —, pénalités et pertes comprises.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre lancement",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps. Au-delà de deux jours d'enquête, le comité de direction glisse, et le cabinet facture chaque journée de présence en plus.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...COME,
        alerte: true,
        texte: `Le comité ayant été décalé, nous avons dû prolonger notre accompagnement : ${euros(perdu)} d'honoraires supplémentaires.`,
      };
    },
  },
  prevision: {
    libelle:
      "le chiffre d'affaires annuel accessible aux agences d'Arvel en bouquets de travaux, en millions d'euros",
    unite: "M€",
    placeholder: "100",
    min: 0,
    max: 1000,
    step: 0.5,
    reel: () => MARCHE_EN_MILLIONS,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur créée estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "résultat du trimestre et valeur du plan engagé, avec ce que le trimestre a appris"
          : "rien n'est encore engagé",
    },
    {
      cle: "engage",
      nom: "Sommes engagées",
      format: kE,
      sensBon: -1,
      aide: () => `sur ${kE(ENVELOPPE)} réservés au lancement`,
      jauge: (l) => ({
        part: Math.min(1, (l.engage ?? 0) / ENVELOPPE),
        enRetard: (l.engage ?? 0) > ENVELOPPE,
      }),
    },
    {
      cle: "agences",
      nom: "Agences équipées",
      format: (v) => `${nombre(v, 0)} sur 30`,
      sensBon: 1,
      aide: (_, l) =>
        l.planGrandes !== null && l.planGrandes !== undefined
          ? `plan de janvier : ${nombre((l.planGrandes ?? 0) + (l.planAutres ?? 0), 0)} agences`
          : "dix grandes, vingt autres",
    },
    {
      cle: "bouquets",
      nom: "Bouquets signés",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => "depuis l'ouverture de l'offre",
    },
    {
      cle: "artisans",
      nom: "Artisans partenaires",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => "sous charte ou sous contrat avec Arvel",
    },
  ],
  contexte(l, decisions): Contexte {
    const d3 = decisions[D.artisans] ?? NEUTRE[D.artisans];
    const art = d3 === 0 ? ARTISANS.exclusivite : d3 === 1 ? ARTISANS.charte : ARTISANS.aucun;
    const g = l.testGrandes ?? 0;
    const a = l.testAutres ?? 0;
    const rG = l.rythmeGrande ?? 0;
    const rA = l.rythmeAutre ?? 0;
    const bouquetsPlan = l.bouquetsPlan ?? 0;
    return {
      d1: decisions[D.entree] ?? -1,
      d2: decisions[D.test] ?? -1,
      aides: l.aides ?? -1,
      agences: l.agences ?? 0,
      bouquets: nombre(l.bouquets ?? 0, 0),
      rythmeGrande: nombre(rG, 1),
      rythmeAutre: nombre(rA, 1),
      rythmeMoyen: nombre(g + a > 0 ? (g * rG + a * rA) / (g + a) : 0, 1),
      bouquetsPlan,
      coutPrix: RIPOSTE.annonce + (RIPOSTE.prix * bouquetsPlan) / (1 + TAUX),
      perte: taux(art.perte, 0),
      negoce: kE(art.negoce),
      valeur: kE(l.valeur ?? 0),
      engage: kE(l.engage ?? 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Sommes engagées, sem. ${a}`, `${kE(s.engage)} sur ${kE(ENVELOPPE)}`],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [200000, 400000, 600000, 800000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `résultat du trimestre ${kE(s.resultat!)} · ${nombre(s.agences!, 0)} agences · ${nombre(s.bouquets!, 0)} bouquets signés`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.test && choix === 2) {
      // Les agences volontaires : deux grandes sur trois, ou une seule.
      return [
        {
          ...MARWAN,
          texte:
            hasard(graine).uVolontaires < 0.5
              ? REPONSES.volontairesGrandes
              : REPONSES.volontairesAutres,
        },
      ];
    }
    if (etape === D.fabricant && choix === 1) {
      return [
        {
          ...LUKAS,
          texte: referencementAccepte(graine)
            ? REPONSES.referencementAccepte
            : REPONSES.referencementRefuse,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.ouverture) {
      lies.push({
        ...MARWAN,
        heure: `sem. ${CALENDRIER.ouverture}`,
        texte: ouverture(chemin, t),
      });
    }
    if (arrive.remboursement) {
      const part =
        chemin[D.fabricant] === 0
          ? FABRICANT.exclusivite.cofinancement
          : FABRICANT.partage.cofinancement;
      lies.push({
        ...SOLANGE,
        heure: "sem. 7",
        texte: `Nordhalm a remboursé ${taux(part, 0)} des ouvertures du trimestre : ${kE(part * total(t.implantation) * OUVERTURE)}.`,
      });
    }
    if (arrive.resultats) {
      lies.push({
        ...NOLWENN,
        heure: `sem. ${CALENDRIER.resultats}`,
        texte: `Six semaines d'offre : ${nombre(t.semaines[CALENDRIER.resultats]!.bouquets, 0)} bouquets signés dans ${decrire(t.implantation)}. Les chiffres détaillés sont dans le dossier du comité.`,
      });
    }
    if (arrive.plan) {
      const d5 = chemin[D.extension];
      const ici = t.implantation;
      const ouvrir =
        Math.max(0, t.plan.grandes - ici.grandes) + Math.max(0, t.plan.autres - ici.autres);
      const fermer =
        Math.max(0, ici.grandes - t.plan.grandes) + Math.max(0, ici.autres - t.plan.autres);
      const texte =
        d5 === 2 && total(ici) > 0
          ? `${chemin[D.entree] === 2 ? "Le test est prolongé" : "Le lancement reste en l'état"} jusqu'en juin (${decrire(ici)}) ; l'extension se décidera alors.`
          : total(t.plan) === 0
            ? total(ici) > 0
              ? `Pas d'extension en janvier : l'offre s'arrête, et les agences équipées (${decrire(ici)}) referment leur espace conseil.`
              : "Pas de lancement en janvier : Arvel reste à l'écart du marché."
            : `Plan de janvier validé : ${decrire(t.plan)}${
                total(ici) > 0 && !memeParc(ici, t.plan)
                  ? `, soit ${compte(ouvrir, "ouverture")} et ${compte(fermer, "fermeture")}`
                  : ""
              }.`;
      lies.push({ ...SOLANGE, heure: `sem. ${EFFET[D.extension]}`, texte });
    }
    if (arrive.solveane) {
      lies.push({
        ...ABDOULAYE,
        heure: `sem. ${CALENDRIER.solveane}`,
        alerte: t.solveane,
        texte: t.solveane ? REPONSES.solveaneEntre : REPONSES.solveaneRenonce,
      });
      if (t.solveane && chemin[D.riposte] === 1) {
        lies.push({
          ...MARWAN,
          heure: `sem. ${CALENDRIER.solveane}`,
          texte: REPONSES.ripostePartie,
        });
      }
    }
    if (arrive.bilan && t.position.penalites < -1000) {
      lies.push({
        ...NOLWENN,
        heure: `sem. ${SEMAINES}`,
        alerte: true,
        texte: `Au rythme du plan engagé, ${t.position.bouquets < 0.5 ? "aucun bouquet" : `${nombre(t.position.bouquets, 0)} bouquets`} par an : les volumes garantis ne seront pas tenus. Pénalités à prévoir, en valeur actuelle : ${kE(-t.position.penalites)}.`,
      });
    }
    if (arrive.bilan && t.position.stock < -1000) {
      lies.push({
        ...SOLANGE,
        heure: `sem. ${SEMAINES}`,
        texte: `Le stock acheté au lancement dépasse ce que le plan vendra : le surplus se revendra avec une décote, ${kE(-t.position.stock)} de perte.`,
      });
    }
    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.aides) {
      imprevus.push({
        ...SOLANGE,
        heure: `sem. ${CALENDRIER.aides}`,
        alerte: !scenario(t.scenario).aides,
        texte: scenario(t.scenario).aides ? REPONSES.aidesMaintenues : REPONSES.aidesReduites,
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
        : `${kE(-t.objectif)} de valeur détruite, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée par les décisions du trimestre : le résultat du trimestre et la valeur sur trois ans du plan engagé, recalculée avec ce que le trimestre a révélé, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Enveloppe",
          valeur: `${kE(t.engage)} engagés`,
          aide: `sur ${kE(ENVELOPPE)} réservés au lancement`,
          tenu: t.engage <= ENVELOPPE,
        },
        {
          nom: "Plan de janvier",
          valeur: `${nombre(total(t.plan), 0)} agence${total(t.plan) > 1 ? "s" : ""}`,
          aide: `le marché en justifiait ${nombre(total(t.justifie), 0)}`,
          tenu: memeParc(t.plan, t.justifie),
        },
        {
          nom: "Solvéane",
          valeur: t.solveane ? "implanté" : "pas venu",
          aide: `${taux(t.probaSolveane, 0)} de chances au vu de vos décisions`,
          tenu: !t.solveane,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const s = scenario(t.scenario);
      const chance = {
        porteur: "une chance sur trois",
        moyen: "un peu moins d'une sur deux",
        difficile: "une sur quatre",
      };
      const lignes = [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le marché",
          texte: `a suivi le scénario ${s.nom} (${chance[s.id]}) : aides ${
            s.aides ? "maintenues" : "réduites d'un tiers"
          }, ${s.bouquets} bouquets par agence moyenne et par an. Il justifiait ${decrire(t.justifie)}.`,
        },
        {
          titre: "Solvéane",
          texte: t.solveane
            ? `s'est implanté dans la région ; au vu de vos décisions, il avait ${taux(t.probaSolveane, 0)} de chances de le faire.`
            : `a renoncé à la région ; au vu de vos décisions, il avait ${taux(t.probaSolveane, 0)} de chances de venir.`,
        },
      ];
      if (t.referencement !== null) {
        lignes.push({
          titre: "Nordhalm",
          texte: t.referencement
            ? "a accepté le référencement sans volume : six fois sur dix."
            : "a refusé le référencement sans volume : quatre fois sur dix.",
        });
      }
      return lignes;
    },
  },
  comportements,
  axe,
};
