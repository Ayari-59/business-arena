/**
 * ÉPISODE 9 — LE QUAI DANGEREUX, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Agathe montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent d'elle.
 *
 * Deux contournements du contrat `Episode`, comme dans le budget et le projet :
 * `lire` renvoie des clés que le tableau de bord n'affiche pas (le retard,
 * les fiches sur les camions) pour nourrir les messages et les sources ; et ce
 * qui suit une décision selon un choix antérieur (l'analyse des fiches, qui ne
 * trouve que ce qui a été déclaré) passe par `evenements().lies`.
 */
import {
  BUDGET,
  CADENCE_NOMINALE,
  D,
  ENVELOPPE,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_RISQUE,
  PERTE_PAR_JOUR,
  evenements,
  hasard,
  lissageAccepte,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/quai-dangereux";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/quai-dangereux";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const palettes = (v: number) => `${nombre(v, 0)} pal./h`;
const indice = (v: number) => nombre(v, 0);
/** Un écart au budget de marge : positif, la plateforme a fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget de marge` : `${kE(-v)} sous le budget de marge`;
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le registre des presque-accidents et l'observation des quais",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    signaux:
      "Votre diagnostic de la semaine 1 était juste : les presque-accidents signalaient un danger que personne ne traitait, et la plupart ne remontaient pas.",
    habilitation:
      "En semaine 1, vous avez vu l'habilitation de Dylan : un vrai danger, mais pas celui qui produisait quatre à cinq presque-accidents par semaine. Ceux-là venaient des croisements de l'allée centrale.",
    imprudence:
      "En semaine 1, vous avez retenu l'imprudence d'un cariste ; le même incident arrivait toutes les semaines, avec d'autres caristes, au même endroit.",
    chauffeurs:
      "En semaine 1, vous avez retenu la discipline des chauffeurs ; ils traversaient la zone des chariots parce que l'accueil était de l'autre côté.",
  };
  const justes = ["signaux", "habilitation"];
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
    score: d === "signaux" ? 1 : d === "habilitation" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cherché de coupable ni forcé la cadence : vous avez traité le danger plutôt que le comportement."
        : `Sous la pression, vous avez choisi ${n} fois sur ${ETAPES.length} la sanction, la consigne ou la cadence. Le tableau de bord s'améliorait parfois ; le danger, lui, restait là.${
            t.semaineGrave ? ` L'accident grave est arrivé en semaine ${t.semaineGrave}.` : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[4]!.declaresCumul,
    "déclarés d'ici la fin de la semaine 4",
    "presque-accidents",
    { juste: 2, proche: 4 },
    (e) => pluriel(Math.round(e), "déclaration"),
  );

  const source = p.chemin[D.flux] === 0;
  const ecoute =
    p.chemin[D.presque] !== 0 &&
    p.chemin[D.retour] !== 0 &&
    (p.chemin[D.presque] === 2 || p.chemin[D.retour] === 1);
  const points = (source ? 1 : 0) + (ecoute ? 1 : 0);
  const prevention: Constat = {
    score: points === 2 ? 1 : points === 1 ? 0.6 : 0,
    texte: `${
      ecoute
        ? "Vous avez fait des presque-accidents une information à analyser, et les déclarations ont suivi."
        : p.chemin[D.presque] === 0 || p.chemin[D.retour] === 0
          ? "Une sanction ou une prime « zéro accident » ont fait taire les déclarations : le danger n'a pas baissé, on ne le voyait plus."
          : "Les presque-accidents déclarés ont été classés sans être analysés."
    } ${
      source
        ? "Et vous avez retiré le danger à la source, en séparant les piétons des chariots."
        : "Le danger des croisements, lui, n'a jamais été retiré à la source : une consigne s'use en quelques semaines."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, prevention];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  prevention,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Compter les presque-accidents",
      texte:
        "Rejouez l'épisode en relisant d'abord le registre et en observant les quais : quatre à cinq presque-accidents par semaine, presque tous au même endroit, et une déclaration sur quatre.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Traiter le danger, pas le coupable",
      texte:
        "Sanctionner celui qui déclare fait taire les signaux ; rappeler la consigne ou pousser la cadence laisse le danger en place. Cherchez ce qui rend l'incident possible, et retirez-le.",
    };
  }
  if (prevention!.score === 0) {
    return {
      titre: "Retirer le danger à la source",
      texte:
        "Une consigne s'use en un mois, une barrière reste. Et l'analyse des presque-accidents ne vaut que ce que valent les déclarations qui la nourrissent.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Lire les signaux faibles",
      texte:
        "Un presque-accident n'est pas un incident clos parce que personne n'est blessé : c'est le même danger qu'un accident grave, avec plus de chance. Comptez-les, et regardez où ils se produisent.",
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
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Un trimestre sans accident grave peut être de la chance : si le résultat tient, votre méthode tient.",
  };
}

const THIERRY = { de: "Thierry Gomez", role: "Chef d'équipe quais" } as const;

export const EPISODE_SECURITE: Episode<Trimestre> = {
  code: "quai-dangereux",
  numero: 15,
  domaine: "Santé et sécurité au travail",
  titre: "Le quai dangereux",
  resume:
    "Une plateforme logistique où les presque-accidents se répètent sans être déclarés, avant une saison chargée. Écouter les signaux faibles et traiter le danger à la source.",
  persona:
    "Vous êtes Agathe Bonnefoy, responsable d'exploitation de la plateforme logistique d'Arvel Distribution à Saint-Quentin-Fallavier. Votre équipe : quatorze caristes, une trentaine de préparateurs de commandes, et les chauffeurs des transporteurs sous-traitants qui chargent à vos quais.",
  mandat: [
    { fort: "Zéro", texte: "accident avec arrêt" },
    { fort: `${CADENCE_NOMINALE} palettes`, texte: "chargées par heure de quai" },
    { fort: kE(BUDGET), texte: "de marge d'exploitation sur le trimestre" },
    { fort: `${OBJECTIF_RISQUE}`, texte: "d'indice de risque aux quais, au plus" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget de marge d'exploitation de la plateforme, en comptant ce que coûtent les retards de chargement, la casse, les accidents et les arrêts d'activité.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre plateforme",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les créneaux de chargement non replanifiés font attendre les camions.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Léo Chaumet",
        role: "Planificateur transport",
        alerte: true,
        texte: `Pendant ce temps, les créneaux de la semaine n'ont pas été replanifiés : des camions ont attendu, et les transporteurs facturent l'attente. ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre de presque-accidents déclarés d'ici la fin de la semaine 4",
    unite: "",
    placeholder: "6",
    min: 0,
    max: 60,
    step: 1,
    reel: (t) => t.semaines[4]!.declaresCumul,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "declares",
      nom: "Presque-accidents déclarés",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine) => (semaine ? "depuis le début du trimestre" : "six au trimestre dernier"),
    },
    {
      cle: "accidents",
      nom: "Accidents avec arrêt",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "depuis le début du trimestre ; objectif : zéro",
    },
    {
      cle: "cadence",
      nom: "Cadence de chargement",
      format: palettes,
      sensBon: 1,
      aide: () => `nominale : ${CADENCE_NOMINALE} palettes par heure`,
    },
    {
      cle: "risque",
      nom: "Indice de risque aux quais",
      format: indice,
      sensBon: -1,
      aide: () => `objectif QHSE : ${OBJECTIF_RISQUE} au plus`,
    },
    {
      cle: "securite",
      nom: "Dépenses de prévention",
      format: euros,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `engagées ; enveloppe à date : ${kE(l.enveloppeADate ?? 0)}`
          : `${kE(ENVELOPPE)} d'enveloppe pour le trimestre`,
      jauge: (l) =>
        l.enveloppeADate
          ? {
              part: Math.min(1, (l.securite ?? 0) / ENVELOPPE),
              enRetard: (l.securite ?? 0) > ENVELOPPE,
            }
          : null,
    },
  ],
  contexte(l) {
    return {
      declares: nombre(l.declares ?? 0, 0),
      declaresN: l.declares ?? 0,
      accidents: l.accidents
        ? `${pluriel(l.accidents, "accident")} avec arrêt`
        : "aucun accident avec arrêt",
      cadence: nombre(l.cadence ?? 0, 0),
      risque: indice(l.risque ?? 0),
      retard: nombre(Math.round((l.retard ?? 0) / 10) * 10, 0),
      camions: nombre(l.camions ?? 0, 0),
      camionsN: l.camions ?? 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const marge = semaines.reduce((x, w) => x + w.contribution, 0);
    const accidents = t.semaines[a]!.accidents - (de > 1 ? t.semaines[de - 1]!.accidents : 0);
    return [
      [`Indice de risque, sem. ${a}`, indice(t.semaines[a]!.risque)],
      ["Accidents avec arrêt", nombre(accidents, 0)],
      ["Marge de la période", kE(marge)],
    ];
  },
  courbe: {
    titre: "Indice de risque aux quais, semaine par semaine",
    cle: "risque",
    cible: OBJECTIF_RISQUE,
    libelleCible: `objectif QHSE : ${OBJECTIF_RISQUE} au plus`,
    graduations: [30, 100, 200, 300],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `indice ${indice(s.risque!)} · ${pluriel(s.declares!, "presque-accident")} déclaré${s.declares! > 1 ? "s" : ""}`,
      `cadence ${palettes(s.cadence!)} · ${nombre(s.retard!, 0)} palettes en attente`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.saison && choix === 2) {
      // Seul le choix de demander compte : les agences répondent selon le hasard du trimestre.
      const accepte = lissageAccepte([...NEUTRE.slice(0, D.saison), 2], graine);
      return [
        {
          de: "Arnaud Lefebvre",
          role: "Directeur logistique",
          texte: accepte ? REPONSES.lissageAccepte : REPONSES.lissageRefuse,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    const dans = (w: number) => w >= de && w <= a;
    if (chemin[D.dylan] === 0 && dans(4)) {
      lies.push({
        de: "Dylan Fournier",
        role: "Cariste intérimaire",
        heure: "sem. 4",
        texte:
          "Recyclage validé. Je reprends mon chariot lundi, avec une autorisation de conduite en règle.",
      });
    }
    if (chemin[D.dylan] === 2 && dans(5)) {
      lies.push({
        ...THIERRY,
        heure: "sem. 5",
        texte:
          "Samir est arrivé. Bon cariste, mais il cherche encore ses quais et ses allées : je l'ai mis en binôme pour deux semaines.",
      });
    }
    for (const w of arrive.accidents) {
      lies.push({
        ...THIERRY,
        heure: `sem. ${w}`,
        alerte: true,
        texte:
          "Accident avec arrêt au quai : un préparateur s'est fait coincer le pied entre une palette et un chariot. Dix jours d'arrêt. La déclaration est partie à la CPAM.",
      });
    }
    if (chemin[D.retour] === 1 && dans(9)) {
      lies.push({
        ...THIERRY,
        heure: "sem. 9",
        texte:
          t.camionsTraites >= 0.6
            ? "Les fiches reprises une à une ont tout montré : des camions qui avancent pendant le chargement. Cales de roue et feux de quai sont posés sur tous les quais depuis lundi."
            : "On a repris les fiches, mais il y en a trop peu pour voir ce qui se passe avec les camions. On a posé des cales sur deux quais, au jugé.",
      });
    }
    if (chemin[D.retour] === 2 && dans(10)) {
      lies.push({
        de: "Cabinet d'audit",
        role: "Auditeur sécurité",
        heure: "sem. 10",
        texte:
          "Rapport remis : des camions avancent pendant le chargement, faute de cales et de feux de quai. Recommandations appliquées dans la semaine.",
      });
    }
    if (arrive.grave) {
      lies.push({
        de: "Arnaud Lefebvre",
        role: "Directeur logistique",
        heure: `sem. ${arrive.grave}`,
        alerte: true,
        texte: `Accident grave au quai 4 : un préparateur percuté par un chariot en marche arrière, hospitalisé avec une fracture du bassin. Les quais 3 à 6 sont arrêtés deux jours pour l'enquête ; l'inspection du travail et la CARSAT sont informées.${
          arrive.faute
            ? " Le cariste était Dylan, sans habilitation à jour : l'assureur évoque déjà la faute inexcusable."
            : ""
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
    titre: (t) => ecartAuBudget(t.objectif),
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de marge d'exploitation de la plateforme, retards, casse, accidents et arrêts compris, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const legers = t.accidentsLegers.length;
      return [
        {
          nom: "Accident grave",
          valeur: t.semaineGrave ? `semaine ${t.semaineGrave}` : "aucun",
          aide: t.faute ? "cariste sans habilitation" : "sur le trimestre",
          tenu: !t.semaineGrave,
        },
        {
          nom: "Accidents avec arrêt",
          valeur: nombre(legers, 0),
          aide: "hors accident grave ; plafond 1",
          tenu: legers <= 1,
        },
        {
          nom: "Indice de risque",
          valeur: indice(t.risqueFinal),
          aide: `en semaine 13 ; objectif ${OBJECTIF_RISQUE}`,
          tenu: t.risqueFinal <= OBJECTIF_RISQUE,
        },
        {
          nom: "Marge d'exploitation",
          valeur: kE(t.marge),
          aide: `budget ${kE(BUDGET)}`,
          tenu: t.marge >= BUDGET,
        },
      ];
    },
    hasard(t, graine) {
      const legers = t.accidentsLegers.length;
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        ...(t.lissageAccepte
          ? [{ titre: "Les agences", texte: "ont accepté de lisser leurs commandes de saison." }]
          : []),
        {
          titre: "Les quais",
          texte: [
            t.semaineGrave
              ? `un accident grave en semaine ${t.semaineGrave}${t.faute ? ", avec un cariste sans habilitation" : ""}`
              : "aucun accident grave",
            legers ? pluriel(legers, "accident") + " avec arrêt" : "aucun accident avec arrêt",
            `${pluriel(t.declaresTotal, "presque-accident")} déclaré${t.declaresTotal > 1 ? "s" : ""}`,
          ]
            .join(", ")
            .replace(/^./, (c) => c.toUpperCase())
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
