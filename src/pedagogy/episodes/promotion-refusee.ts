/**
 * ÉPISODE 72 — LA PROMOTION QU'IL FAUDRA REFUSER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Noé montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de lui.
 *
 * Une promotion se juge sur l'année qui suit, l'épisode sur un trimestre : le
 * tableau de bord suit donc la VALEUR DE L'ÉQUIPE ESTIMÉE, la contribution du
 * trimestre moins ce que les décisions ont engagé pour l'année suivante
 * (démissions, compensations, promesses, manager mal préparé), provisionné
 * dès que le trimestre le révèle.
 */
import {
  BUDGET_CONTRIBUTION,
  C,
  COUT_DEPART,
  D,
  EFFECTIF,
  JOURS_SANS_PERTE,
  NEUTRE,
  NOMS,
  NOMS_COMPLETS,
  OBJECTIF_VALEUR,
  OCCUPATION_CIBLE,
  PERTE_PAR_JOUR,
  SEMAINE,
  bathildeAccepte,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/promotion-refusee";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/promotion-refusee";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un engagement au baromètre : « 6,8 sur 10 ». */
const surDix = (v: number) => `${nombre(v)} sur 10`;
/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));

const EWA = { de: "Ewa Mazurier", role: "Associée, responsable du bureau de Paris" } as const;
const BATHILDE = {
  de: "Bathilde Sarrail",
  role: "Directrice, practice Data, bureau de Paris",
} as const;
const WASSILA = {
  de: "Wassila Mokrane",
  role: "Manager, practice Performance opérationnelle",
} as const;
const ROLES = ["Consultant senior", "Consultante senior", "Consultant senior"] as const;
const personne = (i: number) => ({ de: NOMS_COMPLETS[i]!, role: ROLES[i]! });

/** Le coût du départ d'un consultant senior, en k€ : ce que la prévision de la semaine 1 demande. */
export const COUT_DEPART_EN_KE = COUT_DEPART / 1000;

/** Ce que les décisions révèlent, dans l'ordre où un directeur les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui disaient qui était prêt à encadrer et ce que coûte un départ",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    criteres:
      "Votre diagnostic de la semaine 1 était juste : sans critères écrits ni faits de l'année, le comité suit les soutiens, et la décision ne se défend devant personne.",
    annonce:
      "En semaine 1, vous avez vu le risque de perdre les non-retenus : une vraie partie du problème, mais pas la principale. Une annonce soignée ne rattrape pas une décision prise sans critères.",
    elric:
      "En semaine 1, vous avez vu d'abord le risque de perdre Elric ; les faits de l'année montraient qu'il n'était pas prêt à encadrer, et un manager mal préparé coûte autant qu'un départ.",
    places:
      "En semaine 1, vous avez vu une pyramide trop étroite ; la place était unique, et la question était de savoir qui était prêt, faits à l'appui.",
  };
  const justes = ["criteres", "annonce"];
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
    score: d === "criteres" ? 1 : d === "annonce" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé au réflexe de garder le plus apprécié : ni le porter contre les faits, ni lui promettre la promotion de l'an prochain, ni compenser hors de la grille."
        : `Vous avez choisi ${n} fois le réflexe de garder le plus apprécié : le porter contre les faits, lui promettre l'an prochain, ou compenser hors de la grille.${
            t.decouverte
              ? " La compensation a été découverte, et d'autres ont demandé un rattrapage."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    COUT_DEPART_EN_KE,
    "de coût du départ d'un consultant senior",
    "k€",
    { juste: 3, proche: 8 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const criteres = p.chemin[D.dossier] === 1 && p.chemin[D.comite] === 1;
  const enFace = p.chemin[D.annonce] === 1;
  const equite = t.promis === null && t.decouverte === null;
  const points = (criteres ? 1 : 0) + (enFace ? 1 : 0) + (equite ? 1 : 0);
  const promu = NOMS[t.promu]!;
  const decision: Constat = {
    score: points === 3 ? 1 : points === 2 ? 0.6 : points === 1 ? 0.3 : 0,
    texte: `${
      criteres
        ? "Vous avez porté au comité des critères écrits et les faits de l'année."
        : "Vous êtes arrivé au comité sans critères écrits ni faits pour les départager."
    } Le comité a retenu ${promu}. ${
      enFace
        ? "Vous avez annoncé la décision en face, avec un plan de progression et une date de réexamen."
        : "Les non-retenus n'ont pas été reçus avec un plan et une date de réexamen."
    } ${
      equite
        ? "Et vous n'avez rien négocié hors des critères."
        : t.promis !== null
          ? `Et vous avez promis à ${NOMS[t.promis]!} une promotion que le comité de l'an prochain ne tiendra pas forcément.`
          : "Et vous avez compensé hors de la grille."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, decision];
}

export function axe([information, diagnostic, reflexe, calibrage, decision]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Recueillir les faits avant le comité",
      texte:
        "Rejouez l'épisode en relisant d'abord les évaluations de fin de mission : elles disaient qui avait déjà piloté une mission et encadré une équipe, et qui ne l'avait jamais fait.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Décider sur les critères, pas pour ne pas perdre",
      texte:
        "Promouvoir le plus apprécié pour le garder, lui promettre l'an prochain ou compenser hors de la grille coûte plus cher qu'un départ : un manager mal préparé, une promesse rompue, des rattrapages. Les critères protègent aussi celui qu'on refuse.",
    };
  }
  if (decision!.score < 0.6) {
    return {
      titre: "Annoncer en face, avec un plan",
      texte:
        "Un refus se prépare comme une promotion : des critères écrits, des faits recueillis toute l'année, puis une annonce en face avec ce qui a manqué, un plan de progression concret et une date de réexamen.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Écrire les critères avant de choisir",
      texte:
        "Le risque de départ est réel, mais il découle d'une décision qu'on ne peut pas expliquer. Écrivez d'abord ce qu'on attend d'un manager, puis regardez qui l'a démontré.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Chiffrer ce que coûte un départ",
      texte:
        "Posez-le ligne par ligne : les honoraires du recrutement, la contribution perdue pendant la vacance (le facturé moins le salaire chargé), et les jours que le remplaçant ne facture pas pendant son intégration.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);
const nomOuRien = (i: number | null | undefined) => (i != null && i >= 0 ? NOMS_COMPLETS[i]! : "");

export const EPISODE_EVALUATION: Episode<Trimestre> = {
  code: "promotion-refusee",
  numero: 72,
  domaine: "Évaluer et dire les choses",
  titre: "La promotion qu'il faudra refuser",
  resume:
    "Trois seniors pour une place de manager, et le plus apprécié n'est pas prêt à encadrer. Décider sur des critères et des faits, puis le dire en face, avec un plan.",
  persona:
    "Vous êtes Noé Akintola, directeur de la practice Performance opérationnelle au bureau de Paris d'Atlas Conseil. Vous encadrez douze consultants, d'analyste à consultant senior. D'octobre à décembre : les entretiens annuels, puis le comité de promotion du bureau, où trois de vos seniors visent le grade de manager.",
  mandat: [
    { fort: "1 place", texte: "de manager pour trois candidats" },
    { fort: taux(OCCUPATION_CIBLE, 0), texte: "d'occupation cible de l'équipe" },
    { fort: kE(BUDGET_CONTRIBUTION), texte: "de contribution attendue de l'équipe ce trimestre" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur de l'équipe au moins, estimée en semaine 13" },
  ],
  jugement:
    "Votre associée juge le trimestre sur la valeur de l'équipe : la contribution du trimestre, moins ce que vos décisions engagent pour l'année suivante, démissions, compensations, promesses et manager mal préparé compris.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre équipe",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, ce sont des jours que vous ne facturez plus sur votre mission.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...WASSILA,
        alerte: true,
        texte: `Le client de Brévallon a demandé où tu étais cette semaine : tes jours sur la mission n'ont pas été faits, ${euros(perdu)} de moins facturés.`,
      };
    },
  },
  prevision: {
    libelle:
      "le coût du départ d'un consultant senior : recrutement, vacance du poste et intégration du remplaçant, en milliers d'euros",
    unite: "k€",
    placeholder: "30",
    min: 0,
    max: 300,
    step: 0.1,
    reel: () => COUT_DEPART_EN_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur de l'équipe estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "contribution à date, moins ce qui est engagé pour l'an prochain"
          : "rien n'est encore engagé",
    },
    {
      cle: "occupation",
      nom: "Occupation de l'équipe",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `dans la semaine ; cible ${taux(OCCUPATION_CIBLE, 0)}` : "la semaine dernière",
    },
    {
      cle: "contribution",
      nom: "Contribution du trimestre",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `facturé moins salaires ; à date : ${kE(l.budgetADate ?? 0)} attendus`
          : `${kE(BUDGET_CONTRIBUTION)} attendus sur le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.contribution ?? 0) / BUDGET_CONTRIBUTION)),
              enRetard: (l.contribution ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "engagement",
      nom: "Engagement des trois candidats",
      format: surDix,
      sensBon: 1,
      aide: () => "baromètre mensuel, moyenne de Tahina, Vasco et Elric",
    },
    {
      cle: "departs",
      nom: "Démissions remises",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `sur ${EFFECTIF} consultants ; ${kE(COUT_DEPART)} chacune`,
    },
  ],
  contexte(l, decisions): Contexte {
    const premier = l.premier ?? -1;
    const second = l.second ?? -1;
    const e = [l.eElric ?? 0, l.eTahina ?? 0, l.eVasco ?? 0];
    return {
      faits: decisions[D.dossier] === 1,
      promuNom: nomOuRien(l.promu),
      premierNom: nomOuRien(premier),
      premierRole: premier >= 0 ? ROLES[premier]! : "",
      secondNom: nomOuRien(second),
      promis: l.accord === 1 || (l.promis ?? -1) >= 0,
      valeur: kE(l.valeur ?? 0),
      occupation: taux(l.occupation ?? 0, 0),
      engagement: surDix(l.engagement ?? 0),
      engagementPremier: premier >= 0 ? surDix(e[premier]!) : "",
      engagementSecond: second >= 0 ? surDix(e[second]!) : "",
      departs: nombre(l.departs ?? 0, 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur de l'équipe, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Engagement des candidats, sem. ${a}`, surDix(s.engagement)],
    ];
  },
  courbe: {
    titre: "Valeur de l'équipe estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [0, 100000, 200000, 300000],
    format: kE,
    details: (s) => [
      `valeur ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `occupation ${taux(s.occupation!, 0)} · engagement ${surDix(s.engagement!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.comite && choix === 2) {
      // Bathilde répond à l'échange selon le hasard du trimestre.
      return [
        {
          ...BATHILDE,
          texte: bathildeAccepte(graine) ? REPONSES.accordAccepte : REPONSES.accordRefuse,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.comite) {
      lies.push({
        ...EWA,
        heure: `sem. ${SEMAINE.comite}`,
        alerte: t.promu !== C.tahina,
        texte: t.accord ? REPONSES.comiteAccord : REPONSES.comite[t.promu]!,
      });
    }
    if (arrive.premierPart) {
      lies.push({
        ...personne(t.premier),
        heure: `sem. ${SEMAINE.premierDepart}`,
        alerte: true,
        texte: REPONSES.departs[t.premier]!,
      });
    }
    if (arrive.premierReste) {
      lies.push({
        ...personne(t.premier),
        heure: `sem. ${SEMAINE.premierDepart}`,
        texte: REPONSES.reste,
      });
    }
    if (arrive.decouverte) {
      lies.push({
        ...WASSILA,
        heure: `sem. ${SEMAINE.rumeur}`,
        alerte: true,
        texte: REPONSES.decouverte,
      });
    }
    if (arrive.secondPart) {
      lies.push({
        ...personne(t.second),
        heure: `sem. ${SEMAINE.secondDepart}`,
        alerte: true,
        texte: REPONSES.departs[t.second]!,
      });
    }
    if (arrive.cadrage) {
      lies.push({
        ...WASSILA,
        heure: `sem. ${SEMAINE.cadrage}`,
        alerte: t.cadrageRate,
        texte: t.cadrageRate ? REPONSES.cadrageRate : REPONSES.cadrageReussi,
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
      `${kE(t.objectif)} de valeur de l'équipe, estimée en semaine 13${
        t.partis.length ? `, ${t.partis.length} démission${t.partis.length > 1 ? "s" : ""}` : ""
      }`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur de l'équipe : la contribution du trimestre, moins ce que les décisions engagent pour l'année suivante (démissions, compensations, promesses, manager mal préparé), sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const compense = t.decouverte !== null;
      return [
        {
          nom: "Valeur de l'équipe",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Le promu",
          valeur: NOMS[t.promu]!,
          aide:
            t.promu === C.tahina
              ? "la seule à avoir déjà piloté deux missions"
              : t.promu === C.elric
                ? "n'a jamais piloté de mission ni de budget"
                : "a co-piloté une mission, sans le budget",
          tenu: t.promu === C.tahina,
        },
        {
          nom: "Démissions",
          valeur: nombre(t.partis.length, 0),
          aide: t.partis.length
            ? t.partis.map((i) => NOMS[i]!).join(" et ") + ` ; ${kE(COUT_DEPART)} chacune`
            : "les deux non-retenus sont restés",
          tenu: t.partis.length === 0,
        },
        {
          nom: "Équité",
          valeur: t.promis !== null ? "une promesse" : compense ? "une compensation" : "la grille",
          aide:
            t.promis !== null
              ? "promotion promise sans critère"
              : compense
                ? t.decouverte
                  ? "hors grille, et découverte"
                  : "hors grille, pas encore découverte"
                : "rien de négocié hors des critères",
          tenu: t.promis === null && !compense,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const comite = t.accord
        ? "Bathilde a accepté l'échange : le comité a retenu Vasco sans discuter les autres dossiers."
        : `${t.accord === false ? "Bathilde a refusé l'échange. " : ""}Le comité a retenu ${NOMS_COMPLETS[t.promu]!}.`;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        { titre: "Le comité de promotion", texte: comite },
        ...(t.decouverte !== null
          ? [
              {
                titre: "La compensation",
                texte: t.decouverte
                  ? "a été découverte en semaine 10 : deux seniors ont demandé un rattrapage."
                  : "n'a pas été découverte ce trimestre ; elle le sera sans doute au prochain.",
              },
            ]
          : []),
        {
          titre: "Les non-retenus",
          texte: [t.premier, t.second]
            .map((i) =>
              t.partis.includes(i)
                ? `${NOMS[i]!} a démissionné en semaine ${i === t.premier ? SEMAINE.premierDepart : SEMAINE.secondDepart}`
                : `${NOMS[i]!} est resté${i === C.tahina ? "e" : ""}`,
            )
            .join(", ")
            .concat("."),
        },
        ...(t.chemin[D.priseDePoste] !== 2
          ? [
              {
                titre: "Le premier cadrage",
                texte: t.cadrageRate
                  ? "s'est mal passé : le client a réduit le périmètre de 30 k€."
                  : "s'est bien passé.",
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
