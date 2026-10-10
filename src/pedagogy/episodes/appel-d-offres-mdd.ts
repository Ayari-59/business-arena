/**
 * ÉPISODE 99 — LA MARQUE DU DISTRIBUTEUR, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord du dossier de Naïm montre, ce que
 * la courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 */
import {
  CONTRAT,
  D,
  DEFENSES,
  JOURS_SANS_PERTE,
  LIGNE,
  MCV_CIBLE_CENTIMES,
  NEUTRE,
  OBJECTIF_VALEUR,
  PERTE_PAR_JOUR,
  PRIX_MARQUE,
  REPORT,
  RUPTURE,
  SCENARIOS_LAIT,
  VENTES_SEMAINE,
  celtisAccepte,
  evenements,
  hasard,
  repriseAcceptee,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/appel-d-offres-mdd";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  prixKg,
} from "@/config/episodes/appel-d-offres-mdd";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const tonnes = (v: number) => `${nombre(v, 0)} t`;
/** Un écart signé, en milliers d'euros. */
const kES = (v: number) => (v > 0 ? `+${kE(v)}` : kE(v));
/** La valeur du dossier : positive, il crée de la valeur pour la laiterie. */
const valeurDite = (v: number) =>
  v >= 0 ? `${kE(v)} de valeur créée` : `${kE(-v)} de valeur détruite`;

const ZINEB = {
  de: "Zineb Hascoët",
  role: "Acheteuse MDD produits laitiers frais, centrale d'achat d'Opaline",
} as const;
const BAPTISTIN = { de: "Baptistin Haddadi", role: "Directeur commercial" } as const;
const HOEL = {
  de: "Hoel Quiniou",
  role: "Responsable de la collecte et des relations avec les producteurs",
} as const;
const MORWENNA = { de: "Morwenna Pellen", role: "Cheffe de marque Kerbrélan" } as const;
const IFEOMA = { de: "Ifeoma Bozec", role: "Chargée d'études, panéliste Rayon Témoin" } as const;
const AODREN = { de: "Aodren Kerbiriou", role: "Acheteur MDD crèmerie, Celtis" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;

/** Ce que les décisions révèlent, dans l'ordre où un directeur des MDD les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, la fiche de coût, la capacité réelle de Pontivy et la clause du lait",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    marge:
      "Votre diagnostic de la semaine 1 était juste : au prix cible, chaque kilo laissait 10 centimes de marge sur coût variable, et tout se jouait sur ce qui pouvait les reprendre — le lait, décembre, les frais que le contrat ajoutait —, la MDD sortant de toute façon.",
    capacite:
      "En semaine 1, vous avez vu la capacité de décembre : un vrai risque, mais pas le seul. Le prix du lait pouvait reprendre toute la marge du contrat, et la MDD allait sortir, fabriquée par nous ou par Nordal.",
    perte:
      "En semaine 1, vous avez jugé le contrat à perte ; il ne l'était qu'en coût complet. Les 25 centimes de frais fixes de Pontivy étaient payés avec ou sans lui : chaque kilo à 1,56 € en rapportait 10 de plus.",
    marque:
      "En semaine 1, vous avez vu le danger pour Kerbrélan ; mais Opaline lançait sa MDD de toute façon. Ne pas la fabriquer ne retenait aucun acheteur de Kerbrélan : cela laissait seulement la marge du contrat à Nordal.",
  };
  const justes = ["marge", "capacite"];
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
    score: d === "marge" ? 1 : d === "capacite" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais décidé au volume ni au principe : ni remplir Pontivy à n'importe quelles conditions, ni refuser pour protéger la marque, ni défendre Kerbrélan sans mesurer le report."
        : `Vous avez suivi ${n} fois sur ${ETAPES.length} décisions un réflexe du métier : remplir l'usine aux conditions du client, ou refuser par principe, ou défendre la marque sans mesurer le report.${
            !t.offre.repondu
              ? " Sans offre, la MDD est sortie quand même, fabriquée par Nordal, et Kerbrélan a perdu ses ventes sans que la laiterie gagne la marge du contrat."
              : t.gagne && !t.offre.clause && t.lait === 2
                ? " Sans clause indexée, la hausse du lait a repris toute la marge du contrat."
                : t.gagne && t.manque >= 50
                  ? ` En décembre, il manquera ${tonnes(t.manque)} par mois à Pontivy.`
                  : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    MCV_CIBLE_CENTIMES,
    "de marge sur coût variable par kilo de fromage blanc MDD au prix cible",
    "centimes",
    { juste: 1, proche: 3 },
    (e) => `${nombre(e)} centime${e >= 2 ? "s" : ""}`,
  );

  // Le contrat écrit pour ce qui peut mal tourner : le lait, décembre, les emballages.
  const clause = t.offre.clause;
  const decembre = p.chemin[D.decembre] === 2 || p.chemin[D.decembre] === 3;
  const reprise = p.chemin[D.emballages] === 2;
  const protections = t.offre.repondu
    ? (clause ? 1 : 0) + (decembre ? 1 : 0) + (reprise ? 1 : 0)
    : 0;
  const contrat: Constat = {
    score: protections === 3 ? 1 : protections === 2 ? 0.6 : 0,
    texte: !t.offre.repondu
      ? "Vous n'avez pas déposé d'offre : aucune clause à écrire, et aucune marge à protéger. La MDD d'Opaline est sortie quand même."
      : `${
          clause
            ? "Votre offre portait une clause de révision indexée sur le prix du lait."
            : "Votre offre est partie sans clause indexée sur le prix du lait : la laiterie gardait toute hausse sous 8 %, et l'essentiel des autres."
        } ${
          decembre
            ? "Vous avez prévu la capacité de décembre au TRS réel, pas à celui du planning."
            : p.chemin[D.decembre] === 1
              ? "Vous avez voulu produire décembre d'avance : la DLC et la règle des deux tiers n'en laissaient partir que la moitié."
              : "Vous avez laissé décembre au planning, calculé à 75 % de TRS."
        } ${
          reprise
            ? "Vous avez demandé que la charte d'Opaline ne se paie pas sur votre stock d'emballages."
            : "Vos emballages imprimés restaient à votre charge si Opaline changeait de charte."
        }`,
  };

  return [information, diagnostic, reflexe, calibrage, contrat];
}

export function axe([information, diagnostic, reflexe, calibrage, contrat]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer ce que la MDD ajoute vraiment",
      texte:
        "Rejouez l'épisode en décomposant d'abord le coût d'un kilo, la capacité réelle de Pontivy et la clause du lait : 10 centimes de marge sur coût variable par kilo, 220 tonnes libres en décembre pour 420 demandées, et un contrat type qui laisse à la laiterie presque toute une hausse du lait.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Décider sur la marge des volumes ajoutés",
      texte:
        "Ni le remplissage de l'usine ni le coût complet ne disent ce que vaut une MDD : seulement la marge sur coût variable de ce qu'elle ajoute, moins les frais fixes qu'elle ajoute vraiment (une cellule, un renfort, une équipe de nuit), moins ce que le lait et décembre peuvent reprendre. Et la MDD sortira, que vous la fabriquiez ou non.",
    };
  }
  if (contrat!.score === 0) {
    return {
      titre: "Écrire le contrat comme si le lait allait monter",
      texte:
        "Une marge de 10 centimes par kilo ne résiste pas à une hausse du lait de 10 % sans clause indexée, ni à un mois de décembre où il manque 200 tonnes. Les clauses — révision du prix, volumes de pointe, reprise des emballages — sont la marge du contrat.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Séparer le coût complet de la marge d'un kilo de plus",
      texte:
        "Le coût de revient complet répartit les frais fixes de Pontivy sur son volume : il sert à juger un tarif sur l'année, pas un contrat qui n'ajoute qu'une cellule MDD. Et une MDD ne se refuse pas pour protéger la marque : elle sort de toute façon.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le calcul de la semaine 1 : 1,56 € moins le lait, les ferments, l'emballage, l'énergie et le transport. Notez vos prévisions chiffrées et comparez-les au réalisé : c'est le moyen le plus rapide d'affiner votre jugement.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_MDD: Episode<Trimestre> = {
  code: "appel-d-offres-mdd",
  numero: 99,
  domaine: "Répondre à un appel d'offres MDD",
  titre: "La marque du distributeur",
  resume:
    "Opaline lance l'appel d'offres de son fromage blanc à marque propre, 22 % sous le prix de Kerbrélan, et le directeur général veut remplir Pontivy. Juger une MDD sur la marge de ce qu'elle ajoute, la capacité réelle et ses clauses.",
  persona:
    "Vous êtes Naïm Lefeuvre, directeur des grands comptes et des MDD de la Laiterie de Kerbrélan, à Loudéac. Vous portez les offres de la laiterie aux centrales d'achat des enseignes, avec Fanchon Lozac'h, directrice de l'usine de Pontivy, Iwan Szymanski, directeur financier, et Morwenna Pellen, cheffe de marque Kerbrélan. Le trimestre va de septembre à novembre.",
  mandat: [
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur attendue du dossier sur les deux ans" },
    {
      fort: `${nombre(CONTRAT.volume)} t`,
      texte: "de fromage blanc par an, si Opaline vous retient",
    },
    { fort: "décembre", texte: "le pic de Kerbrélan : la marque d'abord servie" },
    { fort: "Kerbrélan", texte: "55 % du chiffre d'affaires de la laiterie, à défendre" },
  ],
  jugement:
    "Le comité de direction juge le trimestre sur la valeur du dossier estimée en semaine 13, sur les deux ans du contrat : marge sur coût variable, moins ce que le lait, décembre et les emballages en reprennent, moins la marge que Kerbrélan perd chez Opaline, plus ou moins Celtis, dépenses du trimestre déduites.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre dossier",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le dossier de réponse se monte dans l'urgence : analyses et échantillons en express.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...IWAN,
        alerte: true,
        texte: `Pendant ce temps, le dossier de réponse a pris du retard : analyses et échantillons envoyés en express au laboratoire, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "la marge sur coût variable d'un kilo de fromage blanc MDD livré au prix cible, en centimes d'euro",
    unite: "centimes",
    placeholder: "5",
    min: -50,
    max: 60,
    step: 0.5,
    reel: () => MCV_CIBLE_CENTIMES,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur estimée du dossier",
      format: kE,
      sensBon: 1,
      aide: () => `sur les deux ans ; attendu : ${kE(OBJECTIF_VALEUR)}`,
      jauge: (l) =>
        l.valeur === null
          ? null
          : {
              part: Math.min(1, Math.max(0, (l.valeur ?? 0) / OBJECTIF_VALEUR)),
              enRetard: (l.valeur ?? 0) < OBJECTIF_VALEUR,
            },
    },
    {
      cle: "chance",
      nom: "Contrat Opaline",
      format: (v) => (v >= 1 ? "gagné" : v <= 0 ? "pas pour nous" : `${taux(v, 0)} de chances`),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: (semaine) =>
        semaine >= 6 ? "attribué en semaine 6" : "chance estimée de passer sous Nordal",
    },
    {
      cle: "mcvKg",
      nom: "Marge par kilo, lait compris",
      format: (v) => `${nombre(v)} c`,
      formatEcart: (v) => `${nombre(v)} c`,
      sensBon: 1,
      aide: () => "centimes par kilo : prix offert moins coût variable et lait non répercuté",
    },
    {
      cle: "manque",
      nom: "Capacité manquante en décembre",
      format: tonnes,
      sensBon: -1,
      aide: (semaine) =>
        semaine >= 5 ? "par mois, au TRS des essais" : "par mois, selon le planning (TRS 75 %)",
    },
    {
      cle: "kerbrelan",
      nom: "Kerbrélan chez Opaline",
      format: (v) => `${nombre(v, 1)} t`,
      sensBon: 1,
      aide: (semaine) =>
        semaine >= REPORT.lancement
          ? "ventes de la semaine, MDD en rayon"
          : `ventes de la semaine ; d'habitude ${nombre(VENTES_SEMAINE, 0)} t`,
    },
  ],
  contexte(l) {
    const trs = l.trsDecembre ?? LIGNE.trsDecembre;
    const capacite = LIGNE.theorique * trs;
    const libre = l.libreDecembre ?? 0;
    const besoin = l.besoinDecembre ?? 0;
    const manque = Math.max(0, Math.round(besoin - libre));
    const prixMdd = l.prixMdd ?? 1.6;
    return {
      repondu: l.repondu === 1,
      variante: l.clause === 1,
      prix: prixKg(l.prixOffre ?? 0),
      gagne: l.gagne === 1,
      trs: taux(trs, 0),
      capacite: nombre(capacite, 0),
      libre: nombre(libre, 0),
      besoin: nombre(besoin, 0),
      manque: nombre(manque, 0),
      ruptures: kE(manque * RUPTURE),
      ecart: taux(1 - prixMdd / PRIX_MARQUE, 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const avant = de > 1 ? t.semaines[de - 1]!.depenses : 0;
    return [
      [`Valeur estimée, sem. ${a}`, kE(t.semaines[a]!.valeur)],
      ["Variation de la période", kES(semaines.reduce((x, w) => x + w.variation, 0))],
      ["Dépenses de la période", kE(t.semaines[a]!.depenses - avant)],
    ];
  },
  courbe: {
    titre: "Valeur estimée du dossier, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `attendu : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [-2000000, -1000000, 0, 1000000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `marge ${nombre(s.mcvKg!)} c par kilo · Kerbrélan ${nombre(s.kerbrelan!, 1)} t chez Opaline`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.celtis && choix === 2) {
      // Celtis répond à la contre-proposition selon le hasard du trimestre.
      return [
        { ...AODREN, texte: celtisAccepte(graine) ? REPONSES.celtisOui : REPONSES.celtisNon },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.attribution === "gagne") {
      lies.push({
        ...ZINEB,
        heure: "sem. 6",
        alerte: true,
        texte: REPONSES.gagne(prixKg(t.offre.prix), t.offre.clause),
      });
    } else if (arrive.attribution === "perdu") {
      lies.push({ ...ZINEB, heure: "sem. 6", alerte: true, texte: REPONSES.perdu });
    } else if (arrive.attributionSansNous) {
      lies.push({ ...BAPTISTIN, heure: "sem. 6", texte: REPONSES.sansNous });
    }
    if (arrive.reprise) {
      lies.push({
        ...ZINEB,
        heure: "sem. 8",
        texte: repriseAcceptee(graine) ? REPONSES.repriseOui : REPONSES.repriseNon,
      });
    }
    if (arrive.lait) {
      lies.push({
        ...HOEL,
        heure: "sem. 10",
        alerte: t.lait === 2,
        texte: `${REPONSES.lait[t.lait]!}${
          t.gagne && t.lait === 2 && !t.offre.clause
            ? " Avec le contrat type, la laiterie en gardera presque tout."
            : ""
        }`,
      });
    }
    if (arrive.etude) {
      const s = t.sensibilite;
      lies.push({
        ...IFEOMA,
        heure: "sem. 12",
        texte: `Résultats de l'étude : la clientèle de Kerbrélan chez Opaline est ${REPONSES.profils[s]} (${nombre(REPORT.sensibilites[s]!)} point d'acheteurs perdu par point d'écart de prix). ${REPONSES.defenses[t.defense]!}`,
      });
    }
    if (arrive.charte) {
      lies.push({
        ...ZINEB,
        heure: "sem. 12",
        alerte: t.charteChange,
        texte: t.charteChange ? REPONSES.charteChange : REPONSES.charteGardee,
      });
    }
    if (arrive.premiersChiffres) {
      lies.push({
        ...MORWENNA,
        heure: "sem. 13",
        alerte: t.report >= 0.15,
        texte: `Premières sorties de caisse, deux semaines après la mise en rayon de la MDD : Kerbrélan perd ${taux(t.report, 0)} de ses ventes chez Opaline${
          t.defense === 2 ? ", sans défense en magasin" : ", défense comprise"
        }.`,
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
    titre: (t) => `${valeurDite(t.objectif)} sur les deux ans, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur du dossier estimée en semaine 13 sur les deux ans du contrat — marge du contrat, lait, décembre, emballages, marge perdue par Kerbrélan, Celtis, dépenses du trimestre —, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Contrat Opaline",
          valeur: !t.offre.repondu
            ? "pas d'offre"
            : t.gagne
              ? `gagné à ${prixKg(t.offre.prix)}`
              : "perdu",
          aide: t.gagne
            ? `${kE(t.contrat)} de valeur sur les deux ans`
            : "la MDD sort quand même, fabriquée par Nordal",
          tenu: t.gagne && t.contrat > 0,
        },
        {
          nom: "Marge par kilo, lait compris",
          valeur: t.gagne ? `${nombre(t.mcvKg)} centimes` : "—",
          aide: t.gagne
            ? t.offre.clause
              ? "clause trimestrielle indexée sur le lait"
              : "contrat type : le lait reste à votre charge"
            : "pas de contrat",
          tenu: t.gagne && t.mcvKg >= 5,
        },
        {
          nom: "Décembre à Pontivy",
          valeur: t.gagne ? (t.manque > 0 ? `${tonnes(t.manque)} manquantes` : "couvert") : "—",
          aide: t.gagne ? "par mois de décembre, au TRS réel" : "pas de MDD à produire",
          tenu: !t.gagne || t.manque <= 10,
        },
        {
          nom: "Kerbrélan chez Opaline",
          valeur: `${taux(t.report, 0)} de ventes perdues`,
          aide: `${kE(-t.marque)} de marge et de défense sur les deux ans`,
          tenu: t.report <= 0.12,
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
          titre: "Le Groupe Nordal",
          texte: `a offert ${prixKg(t.nordal)} le kilo ; ${
            !t.offre.repondu
              ? "seul en lice, il a eu le contrat."
              : t.gagne
                ? "votre offre est passée dessous."
                : "il est passé sous votre offre."
          }`,
        },
        {
          titre: "Le prix du lait",
          texte: `L'OP a annoncé une tendance à la ${SCENARIOS_LAIT[t.lait]!.nom.toLowerCase()} sur les deux ans (${t.lait === 0 ? "−" : "+"}${taux(Math.abs(SCENARIOS_LAIT[t.lait]!.variation), 0)}).`,
        },
        {
          titre: "Pontivy et Opaline",
          texte: [
            `TRS de ${taux(t.trsDecembre, 0)} aux essais de décembre`,
            t.gagne
              ? t.charteChange
                ? "Opaline change sa charte MDD au printemps"
                : "Opaline garde sa charte MDD"
              : null,
            t.gagne && t.chemin[D.emballages] === 2
              ? t.repriseAcceptee
                ? "elle a accepté la clause de reprise des emballages"
                : "elle a refusé la clause de reprise des emballages"
              : null,
          ]
            .filter(Boolean)
            .join(", ")
            .concat("."),
        },
        {
          titre: "Les acheteurs et Celtis",
          texte: `La clientèle de Kerbrélan s'est montrée ${REPONSES.profils[t.sensibilite]} : ${taux(t.report, 0)} de ses ventes chez Opaline sont passées à la MDD${
            t.defense === 2 ? "" : `, malgré ${kE(DEFENSES[t.defense]!.cout)} de défense par an`
          }. ${
            t.chemin[D.celtis] === 2
              ? celtisAccepte(graine)
                ? "Celtis a accepté votre contre-proposition."
                : "Celtis a refusé votre contre-proposition."
              : t.chemin[D.celtis] === 0
                ? "Celtis a signé à son prix."
                : "Celtis est allé chez un autre fabricant."
          }`,
        },
      ];
    },
  },
  comportements,
  axe,
};
