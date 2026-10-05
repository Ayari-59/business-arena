/**
 * ÉPISODE 31 — LA COMMANDE À PRIX CASSÉ, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de l'atelier de Nadège montre, ce
 * que la courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BUDGET,
  CAPACITE,
  COMMANDE,
  COUT_COMPLET,
  D,
  JOURS_SANS_PERTE,
  MCV_COMMANDE,
  NEUTRE,
  PERTE_PAR_JOUR,
  RIOULT,
  contreAcceptee,
  evenements,
  hasard,
  lotAccepteSiDemande,
  risqueRioult,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/commande-a-prix-casse";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  centimes,
} from "@/config/episodes/commande-a-prix-casse";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const panneaux = (v: number) => `${nombre(v, 0)} panneaux`;
const unitaire = (v: number) => centimes(v);
/** Un écart au budget : positif, l'atelier fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

const THAIS = { de: "Thaïs Ventura", role: "Responsable des achats, Habitat Cévral" } as const;
const MARCEL = { de: "Marcel Rioult", role: "Gérant, Agencements Rioult" } as const;
const DRISS = { de: "Driss Ouakili", role: "Chef d'atelier" } as const;
const EDGAR = { de: "Edgar Lamarque", role: "Directeur commercial de la région" } as const;

/** La marge sur coût variable de la commande, telle que Cévral la propose, en k€. */
export const MCV_COMMANDE_KE = MCV_COMMANDE / 1000;

/** Ce que les décisions révèlent, dans l'ordre où une directrice d'atelier les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, la fiche de coût et le plan de charge",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    marginal:
      "Votre diagnostic de la semaine 1 était juste : l'atelier avait de la place jusqu'à la pleine saison, et ses charges fixes étaient payées quoi qu'il façonne. Ce qui comptait, c'était ce que la commande ajoutait aux coûts, et les semaines qu'elle occupait.",
    saison:
      "En semaine 1, vous avez vu la pleine saison : un vrai risque, mais pas la question du moment. Jusqu'en semaine 8, l'atelier avait plus de 300 panneaux de capacité libre chaque semaine.",
    perte:
      "En semaine 1, vous avez jugé la commande à perte ; elle ne l'était qu'en coût complet. Les 20 € de charges fixes du coût complet étaient payés avec ou sans elle : chaque panneau à 39 € en rapportait 13 de plus.",
    couts:
      "En semaine 1, vous avez retenu le coût de l'atelier ; il était dans la norme. Ce qui le faisait paraître cher, c'étaient des semaines creuses qui répartissaient les mêmes charges fixes sur moins de panneaux.",
  };
  const justes = ["marginal", "saison"];
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
    score: d === "marginal" ? 1 : d === "saison" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais jugé une décision au mauvais coût : ni le coût complet quand l'atelier avait de la place, ni le seul coût variable quand il était plein."
        : `Vous avez jugé ${n} décision${n > 1 ? "s" : ""} sur ${ETAPES.length} au mauvais coût : le coût complet quand l'atelier avait de la place, ou le seul coût variable quand il était plein ou que le volume serait venu de toute façon.${
            t.prixCommande === null && p.chemin[D.commande] !== 3
              ? ` Sans la commande de Cévral, l'atelier a laissé ${kE(MCV_COMMANDE)} de marge sur coût variable sur la table.`
              : t.perdus >= 150
                ? ` En pleine saison, ${panneaux(t.perdus)} d'habitués sont partis chez un concurrent faute de capacité.`
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    MCV_COMMANDE_KE,
    "de marge sur coût variable pour la commande de Cévral",
    "k€",
    { juste: 0.5, proche: 3 },
    (e) => `${nombre(e)} k€`,
  );

  // Le prix de chantier est-il resté un prix de chantier ?
  const protege =
    (p.chemin[D.commande] !== 3 ? 1 : 0) +
    (p.chemin[D.rioult] !== 0 ? 1 : 0) +
    (p.chemin[D.tarif] === 1 || p.chemin[D.tarif] === 2 ? 1 : 0);
  const prix: Constat = {
    score: protege === 3 ? 1 : protege === 2 ? 0.6 : 0,
    texte: `${
      p.chemin[D.commande] === 3
        ? `Le prix de ${COMMANDE.prix} € est parti chez Cévral sur le tarif catalogue, sans conditions qui le distinguent${t.prixEbruite ? " ; d'autres clients l'ont vu et ont obtenu des remises" : ""}.`
        : p.chemin[D.commande] === 2
          ? "Vous avez attaché le prix de Cévral à des conditions — camions complets, référence de chantier — qui en font un prix de chantier, pas un prix catalogue."
          : "Vous n'avez pas fait circuler de prix de chantier."
    } ${
      p.chemin[D.rioult] === 0
        ? `Vous avez donné ${RIOULT.prix} € à Rioult sur du volume qui serait venu de toute façon : ce n'était pas un prix marginal, mais une remise.`
        : t.rioultParti
          ? "Rioult a confié plus de la moitié de ses débits à un autre atelier."
          : "Rioult est resté sans obtenir le prix de chantier sur ce qu'il commande d'habitude."
    } ${
      p.chemin[D.tarif] === 0
        ? "En fin de trimestre, vous avez répercuté dans le tarif un coût complet qui ne bougeait qu'avec le volume."
        : p.chemin[D.tarif] === 3
          ? "En fin de trimestre, vous avez baissé le prix des plus gros clients sans leur demander de volume en échange."
          : "En fin de trimestre, vous avez gardé le tarif."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, prix];
}

export function axe([information, diagnostic, reflexe, calibrage, prix]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chercher ce que la commande ajoute aux coûts",
      texte:
        "Rejouez l'épisode en décomposant d'abord la fiche de coût et en regardant le plan de charge : 20 des 46 € du coût complet sont des charges fixes, payées avec ou sans la commande, et l'atelier avait plus de 300 panneaux de capacité libre par semaine.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Raisonner à la marge, capacité comprise",
      texte:
        "Quand l'atelier a de la place, un panneau de plus ne coûte que son coût variable : tout prix au-dessus rapporte. Quand il est plein, le même panneau coûte des heures supplémentaires et des clients qui partent. Demandez-vous chaque fois ce que la décision change aux coûts, cette semaine-là.",
    };
  }
  if (prix!.score === 0) {
    return {
      titre: "Garder un prix de chantier pour le chantier",
      texte:
        "Un prix marginal ne vaut que pour du volume qui n'existerait pas sans lui. Attachez-le à des conditions qui le distinguent — camions complets, référence à part, semaines creuses — et ne le donnez jamais sur ce que vos clients commanderaient de toute façon.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Séparer le coût complet du coût d'un panneau de plus",
      texte:
        "Le coût complet répartit des charges fixes sur un volume normal : il sert à fixer un tarif sur l'année, pas à juger une commande de plus quand l'atelier a de la place.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le calcul de la semaine 1 : prix moins coût variable, multiplié par la quantité. Notez vos prévisions chiffrées et comparez-les au réalisé : c'est le moyen le plus rapide d'affiner votre jugement.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_COMMANDE_SPECIALE: Episode<Trimestre> = {
  code: "commande-a-prix-casse",
  numero: 31,
  domaine: "Contrôle de gestion",
  titre: "La commande à prix cassé",
  resume:
    "Un promoteur demande 1 600 panneaux sous le coût complet, à un atelier qui tourne aux deux tiers avant sa pleine saison. Raisonner au coût marginal, sans oublier la capacité.",
  persona:
    "Vous êtes Nadège Pujol, directrice du centre de découpe et de façonnage de panneaux d'Arvel Distribution, à Vénissieux. Votre atelier débite et usine des panneaux bois, plâtre et composite pour les artisans et les agences : une scie à panneaux, un centre d'usinage, neuf opérateurs et Driss Ouakili, chef d'atelier.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge de l'atelier sur le trimestre, charges fixes déduites" },
    { fort: `${nombre(CAPACITE)} panneaux`, texte: "par semaine en heures normales" },
    { fort: "pleine saison", texte: "des semaines 9 à 11 : les habitués d'abord" },
    { fort: `${COUT_COMPLET} €`, texte: "de coût complet par panneau, selon la fiche de coût" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge de l'atelier — marge sur coût variable, moins les charges fixes et les surcoûts de capacité — en écart à son budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre atelier",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les devis des agenceurs qui attendent une réponse partent chez les concurrents.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...EDGAR,
        alerte: true,
        texte: `Pendant ce temps, deux agenceurs qui attendaient un devis de l'atelier ont commandé ailleurs : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle:
      "la marge sur coût variable de la commande de Cévral, telle qu'elle est proposée, en milliers d'euros",
    unite: "k€",
    placeholder: "15",
    min: -50,
    max: 100,
    step: 0.1,
    reel: () => MCV_COMMANDE_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge de l'atelier",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} de budget pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.marge ?? 0) / BUDGET)),
              enRetard: (l.marge ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "volume",
      nom: "Panneaux façonnés",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine) =>
        `${semaine ? `en semaine ${semaine}` : "la semaine dernière"} ; capacité ${nombre(CAPACITE)} en heures normales`,
    },
    {
      cle: "coutComplet",
      nom: "Coût complet d'un panneau",
      format: unitaire,
      sensBon: -1,
      aide: () => "charges variables et fixes de la semaine, divisées par le volume",
    },
    {
      cle: "surcouts",
      nom: "Surcoûts de capacité",
      format: kE,
      sensBon: -1,
      aide: () => "heures sup, sous-traitance, équipe, stockage, maintenance ; cumul",
    },
    {
      cle: "retard",
      nom: "Panneaux d'habitués en retard",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) => (semaine ? `fin de semaine ${semaine}` : "ce matin"),
    },
  ],
  contexte(l, decisions) {
    const cc = l.coutCompletRecalcule ?? null;
    return {
      volume: nombre(l.volume ?? 0, 0),
      coutComplet: unitaire(l.coutComplet ?? 0),
      chargePointe: nombre(l.chargePointe ?? 0, 0),
      signee: l.signee === 1,
      prixChantier: l.signee === 1 && l.prixCommande === COMMANDE.prix,
      fractionne: l.signee === 1 && decisions[D.commande] === 3,
      volumeMoyen: nombre(l.volumeMoyen ?? 0, 0),
      coutCompletRecalcule: cc === null ? "" : unitaire(cc),
      tarifRecalcule: l.tarifRecalcule == null ? "" : unitaire(l.tarifRecalcule),
      coutEnBaisse: cc !== null && cc < COUT_COMPLET,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    return [
      ["Marge de la période", kE(semaines.reduce((x, w) => x + w.marge, 0))],
      [`Panneaux façonnés, sem. ${a}`, nombre(t.semaines[a]!.volume, 0)],
      ["Surcoûts de la période", kE(semaines.reduce((x, w) => x + w.surcout, 0))],
    ];
  },
  courbe: {
    titre: "Marge de l'atelier, semaine par semaine",
    cle: "marge",
    cible: BUDGET / 13,
    libelleCible: `cadence du budget : ${kE(BUDGET / 13)} par semaine`,
    graduations: [-10000, 0, 10000, 20000, 30000],
    format: kE,
    details: (s) => [
      `${panneaux(s.volume!)} pour ${nombre(s.capacite!, 0)} de capacité · coût complet ${unitaire(s.coutComplet!)}`,
      `marge sur coût variable ${kE(s.mcv!)} · surcoûts ${kE(s.surcout!)}${
        s.retard! >= 1 ? ` · ${panneaux(s.retard!)} en retard` : ""
      }`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.commande && choix === 1) {
      // Le promoteur répond au coût complet selon le hasard du trimestre.
      return [
        { ...THAIS, texte: contreAcceptee(graine) ? REPONSES.contreOui : REPONSES.contreNon },
      ];
    }
    if (etape === D.lot && (choix === 1 || choix === 2)) {
      const oui = lotAccepteSiDemande(choix, graine);
      const texte =
        choix === 1
          ? oui
            ? REPONSES.apresOui
            : REPONSES.apresNon
          : oui
            ? REPONSES.pointeOui
            : REPONSES.pointeNon;
      return [{ ...THAIS, texte }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.ebruite) {
      lies.push({ ...EDGAR, heure: "sem. 6", alerte: true, texte: REPONSES.ebruite });
    }
    if (arrive.rioultPart) {
      lies.push({
        ...MARCEL,
        heure: `sem. ${RIOULT.des}`,
        alerte: true,
        texte: REPONSES.rioultPart,
      });
    } else if (arrive.rioultReste && risqueRioult(chemin) > 0) {
      lies.push({ ...MARCEL, heure: `sem. ${RIOULT.des}`, texte: REPONSES.rioultReste });
    }
    if (arrive.panne) {
      lies.push({ ...DRISS, heure: `sem. ${t.semainePanne}`, alerte: true, texte: REPONSES.panne });
    }
    if (arrive.retards) {
      lies.push({
        ...DRISS,
        heure: `sem. ${arrive.retards.semaine}`,
        alerte: true,
        texte: `L'atelier ne suit plus : ${panneaux(arrive.retards.perdus)} d'habitués sont partis chez un concurrent ces dernières semaines, faute de pouvoir les servir à temps.`,
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, charges fixes et surcoûts déduits`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge de l'atelier en écart au budget, charges fixes et surcoûts de capacité déduits, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Marge de l'atelier",
          valeur: kE(t.marge),
          aide: `budget ${kE(BUDGET)}`,
          tenu: t.objectif >= 0,
        },
        {
          nom: "Habitat Cévral",
          valeur: t.prixCommande === null ? "pas de commande" : `commande à ${t.prixCommande} €`,
          aide:
            t.prixCommande === null
              ? "la capacité libre des semaines creuses est restée libre"
              : `${kE(t.mcvPromoteur)} de marge sur coût variable, second lot compris`,
          tenu: t.prixCommande !== null,
        },
        {
          nom: "Clients habituels",
          valeur: `${panneaux(t.perdus)} perdus`,
          aide: t.rioultParti
            ? "faute de capacité ; et Rioult est parti avec plus de la moitié de son volume"
            : "partis chez un concurrent faute de capacité",
          tenu: t.perdus < 200 && !t.rioultParti,
        },
        {
          nom: "Surcoûts de capacité",
          valeur: kE(t.surcouts),
          aide: "heures sup, sous-traitance, équipe, stockage, maintenance ; repère 12 k€",
          tenu: t.surcouts <= 12000,
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
          titre: "Habitat Cévral",
          texte: `${
            t.prixCommande === null
              ? "La première commande est partie chez un autre atelier"
              : `La première commande a été signée à ${t.prixCommande} €`
          } ; ${
            t.lot === "pointe"
              ? "la seconde tranche a été livrée en pleine saison"
              : t.lot === "apres"
                ? "la seconde tranche a été livrée après la pleine saison"
                : "la seconde tranche est allée ailleurs"
          }.`,
        },
        {
          titre: "Les clients et la scie",
          texte: [
            t.rioultParti
              ? "Rioult est parti avec plus de la moitié de son volume"
              : "Rioult est resté",
            t.prixEbruite ? "le prix de Cévral a circulé chez d'autres clients" : null,
            t.panne
              ? `la scie est tombée en panne en semaine ${t.semainePanne}`
              : "la scie a tenu le trimestre",
          ]
            .filter(Boolean)
            .join(", ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
