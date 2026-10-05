/**
 * ÉPISODE 38 — LA CROISSANCE À FINANCER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Benoît montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de lui.
 */
import {
  AUTORISATION,
  BFR_ALTAIR,
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PRET,
  clairvalAccepteSous,
  evenements,
  hasard,
  pretAccorde,
  relevementAccorde,
  simuler,
  tableauDeBord,
  valcourtExigeSous,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/croissance-a-financer";
import {
  BANQUE,
  CLAIRVAL,
  DIAGNOSTICS,
  ETAPES,
  ODILON,
  REFERENCES,
  REFLEXES,
  REPONSES,
  SILVERE,
  VALCOURT,
} from "@/config/episodes/croissance-a-financer";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const pluriel = (n: number, mot: string) => `${n} ${mot}${n >= 2 ? "s" : ""}`;
/** Un écart au budget : positif, la filiale a fait mieux. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;

/** Ce que les décisions révèlent, dans l'ordre où un directeur financier les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de chiffrer le BFR du marché",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    structurel:
      "Votre diagnostic de la semaine 1 était juste : le marché Altaïr créait un besoin en fonds de roulement de 560 k€, durable tant que le marché tourne, et la filiale n'avait pas de quoi le financer. Le résultat montait, la trésorerie descendait : l'effet de ciseaux.",
    decalage:
      "En semaine 1, vous avez vu que le marché creuserait la trésorerie le temps qu'Altaïr paie : juste, mais le trou ne se referme pas. Chaque semaine payée est remplacée par une semaine de travaux à financer : le besoin est structurel.",
    rentabilite:
      "En semaine 1, vous avez douté de la rentabilité du marché ; il gagnait 14 k€ par semaine de travaux. Ce n'est pas la marge qui manquait, c'est l'argent pour attendre 77 jours.",
    decouvert:
      "En semaine 1, vous avez cru que l'autorisation de découvert était trop basse. Elle était faite pour les à-coups ; le marché créait un besoin permanent, qui demande des ressources stables.",
  };
  const justes = ["structurel", "decalage"];
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
    score: d === "structurel" ? 1 : d === "decalage" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const incidents = t.incidents.length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais pris la croissance sans la financer, ni refusé par peur : vous avez chiffré chaque besoin avant de dire oui."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} décisions le geste du réflexe : prendre la croissance et la laisser au découvert, la refuser par peur de la trésorerie, ou faire attendre les fournisseurs.${
            incidents
              ? ` La banque a rejeté des LCR pendant ${pluriel(incidents, "semaine")} ; l'incident a été déclaré à la Banque de France.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    BFR_ALTAIR / 1000,
    "de BFR créé par le marché Altaïr en régime",
    "k€",
    { juste: 20, proche: 75 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const stable = p.chemin[D.financement] === 1;
  const fondsPropres = p.chemin[D.dividende] === 1 || p.chemin[D.dividende] === 2;
  const conjoncturel = p.chemin[D.pic] === 1 || p.chemin[D.pic] === 2;
  const points = (stable ? 1 : 0) + (fondsPropres ? 1 : 0) + (conjoncturel ? 1 : 0);
  const nature: Constat = {
    score: points === 3 ? 1 : points === 2 ? 0.6 : 0,
    texte: `${
      stable
        ? "Vous avez financé le besoin durable du marché par un prêt à moyen terme, sur un dossier chiffré."
        : p.chemin[D.financement] === 2
          ? "Vous avez demandé du découvert pour un besoin permanent : la banque l'accorde rarement, et peut le reprendre."
          : "Le besoin durable du marché n'a pas eu de financement durable."
    } ${
      fondsPropres
        ? "Vous avez gardé dans la filiale l'argent du groupe dont elle avait besoin."
        : "Le dividende est sorti au moment où la filiale en avait le plus besoin."
    } ${
      conjoncturel
        ? "Et le pic des primes, un à-coup de deux semaines, est passé par un financement à court terme."
        : p.chemin[D.pic] === 3
          ? "Pour le pic des primes, un à-coup de deux semaines, vous avez demandé un prêt à cinq ans : trop lent et trop cher."
          : "Pour le pic des primes, vous avez fait attendre le fournisseur."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, nature];
}

export function axe([information, diagnostic, reflexe, calibrage, nature]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer le besoin avant de signer",
      texte:
        "Rejouez l'épisode en ouvrant d'abord les conditions du marché et le BFR normatif d'un chantier : 77 jours de délai client, 7 jours de stock, 28 jours de crédit fournisseur, soit 560 k€ à financer pour un marché rentable.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Prendre la croissance qu'on peut financer",
      texte:
        "Ni tout prendre au découvert, ni tout refuser : chiffrez le besoin que crée chaque croissance, trouvez le financement qui lui correspond, et dosez le rythme à ce que vous pouvez financer.",
    };
  }
  if (nature!.score === 0) {
    return {
      titre: "Un besoin durable, un financement durable",
      texte:
        "Un BFR qui dure tant que le marché tourne se finance par des ressources stables : un prêt à moyen terme, des fonds propres, un compte courant bloqué. Le découvert est fait pour les à-coups de quelques semaines.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Distinguer le structurel du conjoncturel",
      texte:
        "Quand un besoin de trésorerie apparaît, demandez-vous s'il disparaîtra seul. Celui d'un marché qui paie à 77 jours ne disparaît pas : chaque situation encaissée est remplacée par une autre.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Le BFR d'un marché se calcule en jours de chiffre d'affaires : délai client, plus stock, moins crédit fournisseur, multiplié par le chiffre d'affaires d'un jour. Refaites le calcul jusqu'à le tenir de tête.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_CROISSANCE: Episode<Trimestre> = {
  code: "croissance-a-financer",
  numero: 38,
  domaine: "Financement de la croissance",
  titre: "La croissance à financer",
  resume:
    "Une filiale qui gagne un gros marché et dont la trésorerie va fondre à mesure qu'elle grandit. Chiffrer le besoin, le financer selon sa nature, et doser le rythme.",
  persona:
    "Vous êtes Benoît Ollivier, directeur administratif et financier d'Arvel Rénovation, la filiale du groupe Arvel qui vend et pose des menuiseries et des isolations pour les particuliers et les bailleurs, autour de Lyon. Votre équipe : Paola Ricci, cheffe comptable, et Maëva Quintard, contrôleuse de gestion.",
  mandat: [
    { fort: kE(BUDGET), texte: "de résultat au budget du trimestre, marché Altaïr compris" },
    { fort: kE(AUTORISATION), texte: "d'autorisation de découvert, à ne pas dépasser" },
    { fort: "0", texte: "incident de paiement" },
    { fort: "3,65 M€", texte: "par an : le marché Altaïr, à tenir dans les délais" },
  ],
  jugement:
    "Votre direction juge le trimestre sur le résultat de la filiale après frais financiers et coûts des incidents de paiement, en écart au budget.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre filiale",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la commande de la deuxième tranche de menuiseries attend votre feu vert : Altaïr pénalise le retard.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ODILON,
        alerte: true,
        texte: `Pendant ce temps, la commande de la deuxième tranche a glissé : Altaïr applique ses pénalités de retard, ${euros(perdu)}.`,
      };
    },
  },
  prevision: {
    libelle:
      "le BFR supplémentaire que créera le marché Altaïr une fois en régime, en milliers d'euros",
    unite: "k€",
    placeholder: "400",
    min: 0,
    max: 3000,
    step: 5,
    reel: () => BFR_ALTAIR / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "decouvert",
      nom: "Découvert utilisé",
      format: kE,
      sensBon: -1,
      aide: (_, l) => `autorisation : ${kE(l.autorisation ?? AUTORISATION)}`,
      jauge: (l) => {
        if (l.decouvert == null || !l.autorisation) return null;
        return {
          part: Math.min(1, l.decouvert / l.autorisation),
          enRetard: l.decouvert > l.autorisation,
        };
      },
    },
    {
      cle: "frng",
      nom: "Fonds de roulement",
      format: kE,
      sensBon: 1,
      aide: () => "ressources stables − emplois stables",
    },
    {
      cle: "bfr",
      nom: "Besoin en fonds de roulement",
      format: kE,
      sensBon: -1,
      aide: () => "créances + stocks − fournisseurs − acomptes",
    },
    {
      cle: "ca",
      nom: "Chiffre d'affaires de la semaine",
      format: kE,
      sensBon: 1,
      aide: (semaine) => (semaine ? "particuliers et chantiers" : "une semaine ordinaire"),
    },
    {
      cle: "resultat",
      nom: "Résultat cumulé",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} au budget du trimestre`,
    },
  ],
  contexte(l, decisions) {
    return {
      decouvert: kE(l.decouvert ?? 0),
      autorisation: kE(l.autorisation ?? AUTORISATION),
      frng: kE(l.frng ?? 0),
      bfr: kE(l.bfr ?? 0),
      besoinPic: kE(l.besoinPic ?? 0),
      semainePic: l.semainePic ?? 13,
      premierDepassement: l.premierDepassement || 13,
      picDividende: kE(l.picDividende ?? 0),
      picCompteCourant: kE(l.picCompteCourant ?? 0),
      picComplet: kE(l.picComplet ?? 0),
      picMoitie: kE(l.picMoitie ?? 0),
      picSansLot: kE(l.picSansLot ?? 0),
      encours: kE(l.encours ?? 0),
      encoursMax: kE(l.encoursMax ?? 0),
      excesValcourt: kE(l.excesValcourt ?? 0),
      arrieres: l.arrieres ? kE(l.arrieres) : "",
      pret: l.pretAccorde === 1 && decisions[D.financement] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const frais = semaines.reduce((x, w) => x + w.frais, 0);
    return [
      [`Découvert, sem. ${a}`, kE(t.semaines[a]!.decouvert)],
      [`BFR, sem. ${a}`, kE(t.semaines[a]!.bfr)],
      ["Frais financiers et incidents", kE(frais)],
    ];
  },
  courbe: {
    titre: "Découvert utilisé, semaine par semaine",
    cle: "decouvert",
    cible: AUTORISATION,
    libelleCible: `autorisation : ${kE(AUTORISATION)}`,
    graduations: [100000, 200000, 300000, 400000],
    format: (v) => kE(v),
    details: (s) => [
      `découvert ${kE(s.decouvert!)} · autorisation ${kE(s.autorisation!)}${
        s.arrieres ? ` · ${kE(s.arrieres)} de factures impayées` : ""
      }`,
      `fonds de roulement ${kE(s.frng!)} · BFR ${kE(s.bfr!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    const h = hasard(graine);
    if (etape === D.financement && (choix === 1 || choix === 2)) {
      // Le comité de crédit de la semaine 2 répond selon le hasard du trimestre.
      const chemin = [choix];
      const texte =
        choix === 1
          ? pretAccorde(chemin, graine)
            ? REPONSES.pretAccorde
            : REPONSES.pretRefuse
          : relevementAccorde(chemin, graine)
            ? REPONSES.relevementAccorde
            : REPONSES.relevementRefuse;
      return [{ ...BANQUE, texte }];
    }
    if (etape === D.clairval && choix === 3) {
      const chemin = [...NEUTRE.slice(0, D.clairval), 3];
      return [
        {
          ...CLAIRVAL,
          texte: clairvalAccepteSous(chemin, h)
            ? REPONSES.clairvalAccepte
            : REPONSES.clairvalRefuse,
        },
      ];
    }
    if (etape === D.valcourt && choix === 0) {
      const chemin = [...NEUTRE.slice(0, D.valcourt), 0];
      return [
        {
          ...VALCOURT,
          texte: valcourtExigeSous(chemin, h) ? REPONSES.valcourtExige : REPONSES.valcourtTolere,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.pretVerse) {
      lies.push({
        ...BANQUE,
        heure: "sem. 3",
        texte: `Les ${kE(PRET)} du prêt à moyen terme sont versés sur votre compte.`,
      });
    }
    if (arrive.incidents.includes(t.incidents[0]!)) {
      lies.push({
        ...BANQUE,
        heure: `sem. ${t.incidents[0]}`,
        alerte: true,
        texte:
          "Votre compte étant au-delà de ce que nous pouvons laisser passer, nous avons rejeté une LCR de Menuiseries Valcourt. L'incident de paiement est déclaré à la Banque de France.",
      });
    }
    const autres = arrive.incidents.filter((w) => w !== t.incidents[0]);
    if (autres.length) {
      const derniere = autres.at(-1)!;
      const impayees = t.semaines[derniere]!.arrieres;
      lies.push({
        ...BANQUE,
        heure: `sem. ${derniere}`,
        alerte: true,
        texte: `Nous avons de nouveau rejeté des LCR faute de provision, ${
          autres.length > 1
            ? `en semaines ${autres.slice(0, -1).join(", ")} et ${derniere}`
            : `en semaine ${derniere}`
        }.${impayees > 0 ? ` ${kE(impayees)} de factures fournisseurs restent impayées.` : ""}`,
      });
    }
    if (arrive.raccourci !== null) {
      lies.push({
        ...VALCOURT,
        heure: `sem. ${arrive.raccourci}`,
        alerte: true,
        texte:
          "Votre LCR nous est revenue impayée. Notre assureur-crédit nous impose de passer vos paiements à 30 jours, au lieu de 56, pour toutes les livraisons à venir.",
      });
    }
    for (const w of arrive.arrets) {
      lies.push({
        ...SILVERE,
        heure: `sem. ${w}`,
        alerte: true,
        texte:
          "Valcourt a fait jouer sa réserve de propriété : ses camions ont repris les menuiseries non payées, et le chantier est arrêté toute la semaine. Altaïr applique ses pénalités de retard, 6 000 €.",
      });
    }
    if (arrive.report !== null) {
      lies.push({
        ...VALCOURT,
        heure: "sem. 12",
        alerte: !arrive.report,
        texte: arrive.report ? REPONSES.reportAccepte : REPONSES.reportRefuse,
      });
    }
    if (arrive.salon) {
      lies.push({
        de: "Rayan Belhadj",
        role: "Directeur commercial",
        heure: "sem. 10",
        texte: `Les poses du salon commencent. ${
          t.desistements > 0
            ? `Sur les quatre semaines, ${kE(t.desistements)} de commandes se sont désistées une fois les menuiseries fabriquées.`
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
    titre: (t) => `${ecartAuBudget(t.objectif)}, frais financiers et incidents compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Résultat de la filiale après frais financiers et coûts des incidents de paiement, en écart au budget, sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Découvert au plus haut",
          valeur: kE(t.decouvertMax),
          aide: t.semainesEnDepassement
            ? `${pluriel(t.semainesEnDepassement, "semaine")} au-delà de l'autorisation`
            : "jamais au-delà de l'autorisation",
          tenu: t.semainesEnDepassement === 0,
        },
        {
          nom: "Fonds de roulement",
          valeur: kE(t.frngFinal),
          aide: `en semaine 13, pour ${kE(BFR_ALTAIR)} de BFR créé par Altaïr`,
          tenu: t.frngFinal >= BFR_ALTAIR,
        },
        {
          nom: "Incidents de paiement",
          valeur: String(t.incidents.length),
          aide: t.incidents.length ? "déclarés à la Banque de France" : "aucune LCR rejetée",
          tenu: t.incidents.length === 0,
        },
        {
          nom: "Chantiers",
          valeur: t.arrets.length ? pluriel(t.arrets.length, "semaine") : "aucun arrêt",
          aide: t.arrets.length ? "d'arrêt, faute de menuiseries" : "Altaïr livré dans les délais",
          tenu: t.arrets.length === 0,
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
          titre: "La banque",
          texte: [
            t.pretAccorde ? "a accordé le prêt à moyen terme" : null,
            t.refusBanque ? "a refusé ce que vous lui demandiez en semaine 2" : null,
            t.relevementAccorde ? "a relevé le découvert à 700 k€" : null,
            t.incidents.length
              ? `a rejeté des LCR pendant ${pluriel(t.incidents.length, "semaine")}`
              : null,
          ]
            .filter(Boolean)
            .join(", ")
            .concat(".")
            .replace(/^\.$/, "n'a rien eu à trancher, et n'a rejeté aucune LCR."),
        },
        {
          titre: "Le salon de l'habitat",
          texte: `a attiré ${h.salon >= 1.05 ? "plus de monde que prévu" : h.salon <= 0.95 ? "moins de monde que prévu" : "le monde attendu"}.`,
        },
        ...(t.valcourtCourt || t.valcourtSuspend !== null
          ? [
              {
                titre: "Valcourt",
                texte: `${t.valcourtSuspend !== null ? `a retenu ses menuiseries en semaine ${t.valcourtSuspend}` : "a livré sans interruption"}${t.valcourtCourt ? ", puis n'a plus accepté que 30 jours de délai" : ""}.`,
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
