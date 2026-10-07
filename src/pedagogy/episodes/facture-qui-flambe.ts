/**
 * ÉPISODE 25 — LA FACTURE QUI FLAMBE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le suivi énergie de Cyprien montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de
 * lui.
 */
import {
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  MARCHE,
  MARGE_OSTRAL,
  NEUTRE,
  OBJECTIF_INDICE,
  PERTE_PAR_JOUR,
  evenements,
  hasard,
  ostralAttend,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/facture-qui-flambe";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/facture-qui-flambe";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const mwh = (v: number) => `${nombre(v, 0)} €/MWh`;
const tonnes = (v: number) => `${nombre(v, 0)} t de CO₂`;
/** Un écart au budget : positif, l'énergie est restée en dessous. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} sous le budget` : `${kE(-v)} au-delà du budget`;

const INGRID = {
  de: "Astrid Solberg",
  role: "Responsable achats responsables, Ostral Construction",
} as const;

/** Ce que les décisions révèlent, dans l'ordre où un responsable énergie les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient quand l'énergie était consommée",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    horsHoraires:
      "Votre diagnostic de la semaine 1 était juste : près de la moitié de l'énergie partait sites fermés, dans des entrepôts chauffés et éclairés pour personne.",
    prix: "En semaine 1, vous avez vu le prix : une vraie cause de la hausse, mais pas le levier. Le prix se négocie une fois ; la consommation de nuit se coupe dès la semaine suivante, sans gêner personne.",
    gaspillage:
      "En semaine 1, vous avez retenu le gaspillage des équipes ; l'énergie partait surtout quand elles n'étaient pas là, la nuit et le week-end.",
    batiments:
      "En semaine 1, vous avez retenu la vétusté des bâtiments ; elle compte, mais les réglages et les horaires pesaient bien plus que l'isolation.",
  };
  const justes = ["horsHoraires", "prix"];
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
    score: d === "horsHoraires" ? 1 : d === "prix" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes de la facture qui flambe : ni couper partout, ni signer la première offre, ni afficher sans prouver."
        : `Sous la pression de la facture, vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe qui soulage tout de suite : couper partout, signer la première offre venue, afficher sans prouver.${
            t.alerteCse
              ? ` Le CSE a exercé son droit d'alerte en semaine ${t.alerteCse}.`
              : t.gel
                ? " La plateforme a gelé pendant les fêtes."
                : t.penaliteVolume > 0
                  ? ` La clause de volume de Volténa vous a fait payer ${kE(t.penaliteVolume)} d'énergie non consommée.`
                  : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.cout / 1000,
    "de coût de l'énergie sur le trimestre",
    "k€",
    { juste: 10, proche: 25 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const plan = p.chemin[D.ostral];
  const mesure = p.chemin[D.premier] === 1;
  const preuve: Constat = {
    score: plan === 0 ? (mesure ? 1 : 0.6) : plan === 3 ? 0.3 : 0,
    texte: `${
      plan === 0
        ? mesure
          ? "Vous avez remis à Ostral un plan fondé sur des mesures et des actions engagées : c'est ce que son auditeur sait lire."
          : "Vous avez remis à Ostral un plan chiffré, mais sans mesures fines : une partie du bilan était estimée."
        : plan === 3
          ? "Vous avez demandé un délai à Ostral plutôt que de lui remettre un plan."
          : "Vous avez répondu à Ostral par de l'affichage, sans mesure ni action chiffrée : c'est ce que son auditeur écarte en premier."
    } ${
      t.ostralRenouvelle
        ? t.ostralAttend
          ? "Le contrat a été prolongé d'un trimestre."
          : "Le contrat a été renouvelé."
        : `Le contrat n'a pas été renouvelé : ${kE(MARGE_OSTRAL)} de marge par trimestre.`
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, preuve];
}

export function axe([information, diagnostic, reflexe, calibrage, preuve]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Mesurer avant d'agir",
      texte:
        "Rejouez l'épisode en lisant d'abord la courbe de charge et en faisant le tour des sites fermés : près de la moitié de l'énergie partait la nuit et le week-end.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Cibler plutôt que couper partout",
      texte:
        "Couper le chauffage partout, signer la première offre ou afficher un engagement soulagent tout de suite et se paient ensuite : équipes qui contournent, clause de volume, client qui part. Cherchez où part l'énergie, et prouvez ce que vous faites.",
    };
  }
  if (preuve!.score === 0) {
    return {
      titre: "Prouver plutôt qu'afficher",
      texte:
        "Un client qui exige un plan carbone le fait lire par un auditeur. Des émissions mesurées et quelques actions engagées, chiffrées, convainquent ; une brochure ou un certificat, non.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher quand l'énergie est consommée",
      texte:
        "Avant de négocier le prix ou de demander des efforts, regardez à quelle heure part l'énergie : le talon de nuit et de week-end se coupe sans gêner personne.",
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

export const EPISODE_ENERGIE: Episode<Trimestre> = {
  code: "facture-qui-flambe",
  numero: 11,
  domaine: "Énergie et responsabilité environnementale",
  titre: "La facture qui flambe",
  resume:
    "Un contrat d'énergie à renouveler en plein hiver, une facture qui pourrait presque doubler, un grand client qui exige un plan carbone. Mesurer avant de couper, prouver plutôt qu'afficher.",
  persona:
    "Vous êtes Cyprien Lavergne, responsable RSE et énergie d'Arvel Distribution, au siège de Lyon. Vous avez la charge de l'énergie de la plateforme logistique de Saint-Priest et de sept agences, avec Killian Morisot, technicien de maintenance, et les chefs de site.",
  mandat: [
    { fort: kE(BUDGET), texte: "de budget énergie pour le trimestre, pas un euro de plus" },
    { fort: `${OBJECTIF_INDICE}`, texte: "d'indice de consommation au plus (100 : l'an dernier)" },
    { fort: "semaine 10", texte: "pour remettre à Ostral son bilan carbone et son plan" },
    { fort: "pas d'investissement lourd", texte: "sans l'accord du comité de direction" },
  ],
  jugement:
    "Votre direction juge le trimestre sur l'écart au budget énergie, en comptant la marge d'un trimestre d'Ostral Construction si son contrat n'est pas renouvelé.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre suivi énergie",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les sites continuent de chauffer et d'éclairer des entrepôts vides chaque nuit.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Killian Morisot",
        role: "Technicien de maintenance",
        alerte: true,
        texte: `Pendant ce temps, rien n'a changé dans les sites : des nuits de chauffage et d'éclairage pour personne, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle: "le coût de l'énergie du trimestre, en milliers d'euros",
    unite: "k€",
    placeholder: "150",
    min: 0,
    max: 400,
    step: 1,
    reel: (t) => t.cout / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "couts",
      nom: "Coût de l'énergie",
      format: kE,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, (l.couts ?? 0) / BUDGET),
              enRetard: (l.couts ?? 0) > l.budgetADate,
            }
          : null,
    },
    {
      cle: "indice",
      nom: "Consommation corrigée du climat",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `100 : l'an dernier ; objectif ${OBJECTIF_INDICE} au plus`,
    },
    {
      cle: "prixMarche",
      nom: "Électricité sur le marché",
      format: mwh,
      sensBon: -1,
      aide: () => `prix à terme à l'échéance : ${mwh(MARCHE.elec)}`,
    },
    {
      cle: "horsHoraires",
      nom: "Énergie consommée sites fermés",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: -1,
      aide: (_, l) =>
        l.horsHoraires === null ? "inconnue sans sous-compteurs" : "la nuit et le week-end",
    },
    {
      cle: "co2",
      nom: "Émissions du trimestre",
      format: tonnes,
      sensBon: -1,
      aide: (semaine, l) =>
        semaine ? `l'an dernier à date : ${tonnes(l.co2ADate ?? 0)}` : "électricité et gaz",
    },
  ],
  contexte(l, decisions) {
    return {
      couts: kE(l.couts ?? 0),
      budgetADate: kE(l.budgetADate ?? 0),
      indice: nombre(l.indice ?? 100, 0),
      prixMarche: mwh(l.prixMarche ?? MARCHE.elec),
      horsHoraires:
        l.horsHoraires === null || l.horsHoraires === undefined
          ? "inconnue, faute de sous-compteurs"
          : taux(l.horsHoraires, 0),
      co2: tonnes(l.co2 ?? 0),
      co2ADate: tonnes(l.co2ADate ?? 0),
      mesure: decisions[D.premier] === 1,
      coupe: decisions[D.premier] === 0,
      prixFixe: decisions[D.contrat] === 0 || decisions[D.contrat] === 2,
      pilotable: decisions[D.premier] === 1 || decisions[D.sobriete] === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    return [
      ["Coût de la période", kE(cout)],
      [`Indice de consommation, sem. ${a}`, nombre(t.semaines[a]!.indice, 0)],
      [`Électricité sur le marché, sem. ${a}`, mwh(t.semaines[a]!.prixMarche)],
    ];
  },
  courbe: {
    titre: "Consommation corrigée du climat, semaine par semaine",
    cle: "indice",
    cible: OBJECTIF_INDICE,
    libelleCible: `objectif : ${OBJECTIF_INDICE} au plus (100 : l'an dernier)`,
    graduations: [50, 75, 100],
    format: (v) => nombre(v, 0),
    details: (s) => [
      `indice ${nombre(s.indice!, 0)} · ${nombre(s.conso!, 0)} MWh, dont ${taux(s.horsHoraires!, 0)} sites fermés`,
      `électricité sur le marché ${mwh(s.prixMarche!)} · coût de la semaine ${kE(s.cout!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.ostral && choix === 3) {
      // Ostral répond à la demande de délai selon le hasard du trimestre.
      return [
        { ...INGRID, texte: ostralAttend(graine) ? REPONSES.delaiAccepte : REPONSES.delaiRefuse },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.alerteCse) {
      lies.push({
        de: "Steven Mallard",
        role: "Secrétaire du CSE",
        heure: `sem. ${t.alerteCse}`,
        alerte: true,
        texte: REPONSES.alerte,
      });
    }
    if (arrive.gel) {
      lies.push({
        de: "Hakim Boukhari",
        role: "Chef de la plateforme de Saint-Priest",
        heure: "sem. 12",
        alerte: true,
        texte: REPONSES.gel,
      });
    }
    if (arrive.ostral !== null) {
      const plan = chemin[D.ostral];
      const texte = t.ostralAttend
        ? REPONSES.ostralProlonge
        : arrive.ostral
          ? plan === 0
            ? REPONSES.ostralOui
            : REPONSES.ostralOuiQuandMeme
          : plan === 0
            ? REPONSES.ostralNonPlan
            : plan === 3
              ? REPONSES.ostralSansPlan
              : REPONSES.ostralNonAffichage;
      lies.push({ ...INGRID, heure: "sem. 12", alerte: !arrive.ostral, texte });
    }
    if (arrive.penalite) {
      const historique = chemin[D.contrat] === 0;
      lies.push({
        de: historique ? "Brigitte Collin" : "Tomás Herrera",
        role: historique
          ? "Chargée de clientèle entreprises, Volténa Énergies"
          : "Courtier en énergie",
        heure: "sem. 13",
        alerte: true,
        texte: `Votre consommation est passée sous le seuil de la clause de volume : l'énergie réservée et non consommée vous est facturée, ${euros(t.penaliteVolume)}.`,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.froid) {
      imprevus.push({
        de: "Tomás Herrera",
        role: "Courtier en énergie",
        heure: "sem. 11",
        texte: REPONSES.froid,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `${ecartAuBudget(t.objectif)}, marge d'Ostral comprise`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget énergie du trimestre, en comptant la marge d'Ostral Construction si son contrat n'est pas renouvelé, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const baisse = 1 - t.co2 / t.co2Reference;
      return [
        {
          nom: "Coût de l'énergie",
          valeur: kE(t.cout),
          aide: `budget ${kE(BUDGET)}${t.penaliteVolume ? ` ; ${kE(t.penaliteVolume)} de clause de volume` : ""}`,
          tenu: t.cout <= BUDGET,
        },
        {
          nom: "Consommation",
          valeur: `indice ${nombre(t.indiceMoyen, 0)}`,
          aide: `de la semaine 5 à la 13, corrigée du climat ; objectif ${OBJECTIF_INDICE}`,
          tenu: t.indiceMoyen <= OBJECTIF_INDICE,
        },
        {
          nom: "Émissions",
          valeur: tonnes(t.co2),
          aide:
            baisse > 0
              ? `${taux(baisse, 0)} de moins que l'an dernier à météo égale`
              : "autant que l'an dernier à météo égale",
          tenu: baisse >= 0.15,
        },
        {
          nom: "Ostral Construction",
          valeur: t.ostralRenouvelle
            ? t.ostralAttend
              ? "contrat prolongé"
              : "contrat renouvelé"
            : "contrat perdu",
          aide: t.ostralRenouvelle
            ? "le plus gros client du négoce"
            : `${kE(MARGE_OSTRAL)} de marge par trimestre`,
          tenu: t.ostralRenouvelle,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const fin = t.semaines[13]!.prixMarche;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le marché et la météo",
          texte: `${
            t.froid
              ? "Une vague de froid a frappé à partir de la semaine 11, et le marché a flambé avec elle"
              : "Pas de vague de froid cette année"
          } ; l'électricité a fini le trimestre à ${mwh(fin)}, pour ${mwh(MARCHE.elec)} à l'échéance du contrat.`,
        },
        {
          titre: "Les équipes et Ostral",
          texte: [
            t.alerteCse ? `le CSE a exercé son droit d'alerte en semaine ${t.alerteCse}` : null,
            t.gel ? "la plateforme a gelé pendant les fêtes" : null,
            t.ostralAttend
              ? "Ostral a accepté d'attendre le plan"
              : t.ostralRenouvelle
                ? "Ostral a renouvelé son contrat"
                : "Ostral n'a pas renouvelé son contrat",
          ]
            .filter(Boolean)
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
