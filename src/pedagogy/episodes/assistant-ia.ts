/**
 * ÉPISODE 76 — L'ASSISTANT D'IA QUI CHANGE LE MÉTIER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Anouchka montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Le comité juge le trimestre sur la marge du cabinet, incidents déduits,
 * plus la valeur des contrats repensés pour leurs douze premiers mois : un
 * gain de temps ne vaut que ce que la manière de vendre en garde, et ce que
 * les usages n'en reperdent pas en incidents.
 */
import {
  BAISSE_REGIE_SYNTHESES,
  BUDGET,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  RENOUVELLEMENTS,
  TYPES_ORVANNE,
  evenements,
  gainOrvanne,
  hasard,
  reponseOrvanne,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/assistant-ia";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/assistant-ia";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const jours = (v: number) => `${nombre(v, 0)} jour${Math.round(v) >= 2 ? "s" : ""}`;
/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));

const VICTOIRE = { de: "Victoire Lanoë", role: "Présidente d'Atlas Conseil" } as const;
const GWILHERM = { de: "Gwilherm Le Nevez", role: "Directeur des achats, groupe Orvanne" } as const;
const AGNIESZKA = {
  de: "Agnieszka Tréhin",
  role: "Juriste et déléguée à la protection des données",
} as const;
const HOCINE = { de: "Hocine Cassagne", role: "Directeur de mission, compte Orvanne" } as const;
const AISSATOU = { de: "Aïssatou Ndour", role: "Responsable du staffing" } as const;
const TEODORA = {
  de: "Teodora Vasconcelos",
  role: "Manager, practice Performance opérationnelle et supply chain",
} as const;

/** La baisse de chiffre d'affaires de régie que la prévision de la semaine 1 demande, en k€. */
export const PREVISION_EN_KE = BAISSE_REGIE_SYNTHESES / 1000;

/** Ce que les décisions révèlent, dans l'ordre où une associée les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient à qui allait le temps gagné",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    modele:
      "Votre diagnostic de la semaine 1 était juste : le temps gagné était réel, mais en régie il partait chez le client, et l'usage sans règle exposait le cabinet. Il fallait changer la manière de vendre autant que les usages.",
    usages:
      "En semaine 1, vous avez vu le danger de l'usage sauvage : une vraie cause, mais pas la principale. Encadrer les usages protégeait le cabinet ; cela ne disait pas à qui irait le temps gagné, et en régie il allait au client.",
    retard:
      "En semaine 1, vous avez vu un retard à rattraper ; le gain le plus fort était sur les synthèses, presque nul sur le conseil, et sans règle ni nouvelle manière de vendre, aller vite exposait le cabinet sans l'enrichir.",
    fiabilite:
      "En semaine 1, vous avez vu un outil trop peu fiable pour le conseil ; il l'était sur les synthèses, moins sur les chiffres, pas sur les recommandations. Attendre une politique ne faisait qu'envoyer l'usage dans des outils qu'on ne maîtrisait pas.",
  };
  const justes = ["modele", "usages"];
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
    score: d === "modele" ? 1 : d === "usages" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes de l'outil nouveau : ni interdire en attendant une politique, ni ouvrir sans règle, ni protéger la régie en facturant des jours non passés, ni imposer un objectif, ni garder le cap malgré les relectures, ni répondre au client sans mesurer."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : interdire en attendant le comité ou tout ouvrir sans règle, facturer les jours prévus, fixer un objectif, garder le cap ou tout suspendre, céder au client ou lui répondre sans mesurer, une politique fermée ou plus de relecture du tout.${
            t.fraude !== null
              ? ` En semaine ${t.fraude}, un client a demandé les relevés de Tempora.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    PREVISION_EN_KE,
    "de chiffre d'affaires de régie perdu au trimestre si les synthèses allaient deux fois plus vite",
    "k€",
    { juste: 5, proche: 15 },
    (e) => `${nombre(e, 0)} k€`,
  );

  // Le constat du métier : vendre autrement le temps gagné.
  const forfaits = p.chemin[D.regie] === 2;
  const mesure = p.chemin[D.orvanne] === 2;
  const parDefaut = p.chemin[D.comite] === 1;
  const vendus = (forfaits ? 1 : 0) + (mesure ? 1 : 0) + (parDefaut ? 1 : 0);
  const morceaux = [
    forfaits
      ? `Vous avez proposé le forfait par livrable aux douze clients qui renouvelaient ; ${t.acceptes} l'ont accepté${t.malCadre ? ", dont un mal cadré qui a coûté cher" : ""}.`
      : p.chemin[D.regie] === 1
        ? "Vous avez gardé la régie en facturant les jours prévus : le chiffre tenait tant que personne ne regardait les relevés."
        : "Vous avez reconduit la régie telle quelle : le temps gagné est parti chez les clients.",
    mesure
      ? "Face à Orvanne, vous avez mesuré avant de proposer."
      : "Face à Orvanne, vous avez répondu sans mesurer ce que l'assistant changeait à la mission.",
    parDefaut
      ? "En juin, le forfait est devenu la règle des propositions."
      : "En juin, la manière de vendre n'a pas changé.",
  ];
  const vente: Constat = {
    score: vendus === 3 ? 1 : vendus >= 1 ? 0.6 : 0,
    texte: `${morceaux.join(" ")} Valeur des contrats repensés : ${kES(t.repenses)}.`,
  };

  return [information, diagnostic, reflexe, calibrage, vente];
}

export function axe([information, diagnostic, reflexe, calibrage, vente]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer à qui va le temps gagné",
      texte:
        "Rejouez l'épisode en ouvrant d'abord la facturation du trimestre et la mesure de Teodora : 40 % des jours sont en régie, et un jour gagné en régie est un jour qu'on ne facture plus.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni interdire, ni ouvrir sans règle",
      texte:
        "Interdire cache l'usage dans des outils qu'on ne maîtrise pas ; ouvrir sans règle l'expose. Trois règles simples, une relecture et des pratiques partagées font le gain sans l'incident.",
    };
  }
  if (vente!.score === 0) {
    return {
      titre: "Vendre autrement ce qu'on fait plus vite",
      texte:
        "En régie, le temps gagné va au client. Un forfait par livrable, chiffré sur un gain mesuré et bien cadré, le transforme en marge.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Voir ce que l'outil change au modèle",
      texte:
        "Un outil qui fait gagner du temps ne pose pas qu'une question de risque ou de retard : il change ce que le cabinet facture. Regardez la régie et le forfait avant de regarder l'outil.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Notez vos prévisions chiffrées et comparez-les au réalisé : 3 420 jours de régie, 12 % de synthèses, deux fois plus vite, 900 € le jour.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** La réponse d'Orvanne : elle ne dépend que de l'option et du tirage. */
function messageOrvanne(choix: number, graine: number): Message[] | null {
  if (choix === 0) return null;
  const o = reponseOrvanne(choix, graine, 0.05);
  const texte =
    choix === 1
      ? o.issue === "part"
        ? REPONSES.refusPart
        : REPONSES.refusReste
      : choix === 2
        ? o.issue === "accepte"
          ? REPONSES.mesureAccepte
          : REPONSES.mesureRefuse
        : o.issue === "accepte"
          ? REPONSES.directAccepte
          : o.issue === "part"
            ? REPONSES.directPart
            : REPONSES.directRefuse;
  return [{ ...GWILHERM, texte }];
}

export const EPISODE_IA: Episode<Trimestre> = {
  code: "assistant-ia",
  numero: 76,
  domaine: "Intégrer l'IA dans un cabinet",
  titre: "L'assistant d'IA qui change le métier",
  resume:
    "Un assistant d'IA que certains utilisent en cachette et que d'autres refusent. Encadrer les usages, apprendre entre pairs, et vendre autrement le temps gagné.",
  persona:
    "Vous êtes Anouchka Brisebois, associée chargée de l'innovation d'Atlas Conseil, à Nantes : 240 collaborateurs, dont 190 consultants facturables, cinq practices, des bureaux à Rennes, Bordeaux et Paris. Le comité de direction vous confie le déploiement de l'assistant d'IA générative que le cabinet vient d'acheter, d'avril à juin.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge au trimestre, budgétée sans l'assistant" },
    { fort: "0", texte: "incident de confidentialité, aucun livrable faux chez un client" },
    { fort: `${RENOUVELLEMENTS.length} contrats`, texte: "en régie à renouveler au 1er juillet" },
    { fort: "juin", texte: "le comité qui validera la politique du cabinet" },
  ],
  jugement:
    "Le comité de direction juge le trimestre en euros : la marge du cabinet, moins ce que coûtent les incidents, plus la valeur des contrats repensés pour leurs douze premiers mois.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre cabinet",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les équipes sans consigne bricolent et les propositions commerciales attendent.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...VICTOIRE,
        alerte: true,
        texte: `Pendant ces jours sans consigne, deux propositions sont parties en retard et une soutenance a été décalée : ${euros(perdu)} d'avant-vente refaite et de chances perdues.`,
      };
    },
  },
  prevision: {
    libelle:
      "la baisse de chiffre d'affaires en régie sur le trimestre si toutes les synthèses des missions en régie allaient deux fois plus vite, facturation inchangée, en k€",
    unite: "k€",
    placeholder: "150",
    min: 0,
    max: 3000,
    step: 1,
    reel: () => PREVISION_EN_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "adoption",
      nom: "Consultants qui utilisent l'assistant",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => "l'outil du cabinet, hébergement maîtrisé",
    },
    {
      cle: "cachette",
      nom: "Usage d'outils grand public",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: -1,
      aide: (semaine) => (semaine ? "estimé, en cachette" : "déclaré au questionnaire"),
    },
    {
      cle: "gagnes",
      nom: "Jours gagnés depuis avril",
      format: jours,
      sensBon: 1,
      aide: () => "temps de production que l'assistant a libéré",
    },
    {
      cle: "regiePerdue",
      nom: "Régie non facturée",
      format: kE,
      sensBon: -1,
      aide: () => "jours gagnés en régie : le gain va au client",
    },
    {
      cle: "marge",
      nom: "Marge à date",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)}, incidents déduits`
          : `${kE(BUDGET)} pour le trimestre`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.marge ?? 0) / BUDGET)),
              enRetard: (l.marge ?? 0) < l.budgetADate,
            }
          : null,
    },
  ],
  contexte(l, decisions) {
    return {
      adoption: taux(l.adoption ?? 0, 0),
      cachette: taux(l.cachette ?? 0, 0),
      gagnes: jours(l.gagnes ?? 0),
      regiePerdue: kE(l.regiePerdue ?? 0),
      marge: kE(l.marge ?? 0),
      gain: taux(l.gain ?? 0),
      gainContrat: taux(l.gainContrat ?? 0),
      gainContratBrut: l.gainContrat ?? 0,
      interdit: (decisions[D.ouverture] ?? NEUTRE[D.ouverture]) === 0,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const gagnes = semaines.reduce((x, w) => x + w.gagnes, 0);
    const avant = de > 1 ? t.semaines[de - 1]! : null;
    const regie = t.semaines[a]!.regiePerdue - (avant?.regiePerdue ?? 0);
    const marge = t.semaines[a]!.marge - (avant?.marge ?? 0);
    return [
      ["Jours gagnés sur la période", jours(gagnes)],
      ["Régie non facturée", kE(regie)],
      ["Marge de la période, incidents déduits", kE(marge)],
    ];
  },
  courbe: {
    titre: "Jours gagnés par l'assistant, semaine par semaine",
    cle: "gagnes",
    cible: 30,
    libelleCible: "repère : 30 jours par semaine, 5 % du temps facturable",
    graduations: [0, 10, 20, 30, 40],
    format: (v) => `${nombre(v, 0)} j`,
    details: (s) => [
      `${jours(s.gagnes!)} gagnés · ${taux(s.adoption!, 0)} d'utilisateurs`,
      `en cachette ${taux(s.cachette!, 0)} · marge à date ${kE(s.marge!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.orvanne) return messageOrvanne(choix, graine);
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.forfaits) {
      lies.push({
        ...AISSATOU,
        heure: "sem. 6",
        texte: `Les rendez-vous sont faits : ${t.acceptes} clients sur ${RENOUVELLEMENTS.length} passent au forfait par livrable au 1er juillet, ${kE(t.caAcceptes)} de chiffre annuel. Les autres restent en régie.`,
      });
    }
    if (arrive.confidentialite) {
      lies.push({
        ...AGNIESZKA,
        heure: `sem. ${t.confidentialite}`,
        alerte: true,
        texte:
          "Incident : des comptes rendus d'entretiens d'un client hospitalier, avec des noms de patients et de soignants, ont été versés dans un outil que nous ne maîtrisons pas. Le client suspend la mission et demande un audit. Je dois notifier.",
      });
    }
    if (arrive.erreur) {
      lies.push({
        ...TEODORA,
        heure: `sem. ${t.erreur}`,
        alerte: true,
        texte:
          "Un livrable est parti chez un client avec un benchmark dont trois chiffres n'existent nulle part. Le client l'a vu en comité de pilotage. On reprend le livrable à nos frais, et l'associé est allé s'excuser.",
      });
    }
    if (arrive.fraude) {
      lies.push({
        ...AGNIESZKA,
        heure: `sem. ${t.fraude}`,
        alerte: true,
        texte:
          "Un acheteur public a rapproché nos relevés de Tempora des dates de remise des livrables : des jours facturés n'ont pas été passés. Il exige le remboursement, résilie la mission et saisit sa direction juridique.",
      });
    }
    if (arrive.malCadre) {
      lies.push({
        ...HOCINE,
        heure: "sem. 9",
        alerte: true,
        texte:
          "Réunion de cadrage d'un des nouveaux forfaits : le client attend trois sites, pas un. Le prix est signé. Le dépassement sera pour nous.",
      });
    }
    if (chemin[D.orvanne] === 2 && de <= 9 && a >= 9) {
      const g = gainOrvanne(chemin, graine, simuler(chemin, graine).semaines[8]!.adoption);
      lies.push({
        ...HOCINE,
        heure: "sem. 9",
        texte: `La mesure est faite : la deuxième année sera ${TYPES_ORVANNE[hasard(graine).typeOrvanne]!.nom}, et l'assistant y fera gagner ${taux(g)} des jours. Le forfait proposé partage ce gain à parts égales.`,
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
      `${kE(t.objectif)} : marge du trimestre, incidents déduits, contrats repensés compris`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge du trimestre, moins les incidents, plus la valeur des contrats repensés pour leurs douze premiers mois, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Marge du trimestre",
          valeur: kE(t.marge),
          aide: `avant incidents ; budget ${kE(BUDGET)}`,
          tenu: t.marge >= BUDGET,
        },
        {
          nom: "Incidents",
          valeur: t.incidents > 0 ? kE(t.incidents) : "aucun",
          aide:
            [
              t.confidentialite !== null ? "confidentialité" : null,
              t.erreur !== null ? `${t.erreurs} livrable${t.erreurs >= 2 ? "s" : ""} faux` : null,
              t.fraude !== null ? "jours facturés non passés" : null,
            ]
              .filter(Boolean)
              .join(", ") || "ni fuite, ni livrable faux",
          tenu: t.incidents === 0,
        },
        {
          nom: "Adoption",
          valeur: taux(t.adoptionFinale, 0),
          aide: `des consultants en semaine 13 ; en cachette : ${taux(t.cachetteFinale, 0)}`,
          tenu: t.adoptionFinale >= 0.4 && t.cachetteFinale <= 0.05,
        },
        {
          nom: "Contrats repensés",
          valeur: kES(t.repenses),
          aide: "forfaits du 1er juillet, Orvanne, propositions du semestre",
          tenu: t.repenses > 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const orvanne = {
        accepte: "a accepté la proposition",
        reste: "est resté en régie, au même tarif",
        part: "est parti chez Kéroual Consulting",
        baisse: "a obtenu sa baisse",
      }[t.orvanne.issue];
      const incidents = [
        t.confidentialite !== null
          ? `des données client dans un outil non maîtrisé en semaine ${t.confidentialite}`
          : null,
        t.erreur !== null
          ? `${t.erreurs >= 2 ? `${t.erreurs} livrables faux, le premier` : "un livrable faux"} en semaine ${t.erreur}`
          : null,
        t.fraude !== null
          ? `des jours facturés non passés découverts en semaine ${t.fraude}`
          : null,
      ].filter((x): x is string => x !== null);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Orvanne",
          texte: `La deuxième année a été ${TYPES_ORVANNE[h.typeOrvanne]!.nom}. Le client ${orvanne}.`,
        },
        ...(t.acceptes > 0
          ? [
              {
                titre: "Les forfaits",
                texte: `${t.acceptes} clients sur ${RENOUVELLEMENTS.length} ont accepté le forfait${
                  t.malCadre ? " ; l'un d'eux était mal cadré" : ", tous bien cadrés"
                }.`,
              },
            ]
          : []),
        {
          titre: "Les incidents",
          texte: incidents.length
            ? `${incidents.join(", ").replace(/^./, (c) => c.toUpperCase())}.`
            : "Aucun incident ce trimestre.",
        },
      ];
    },
  },
  comportements,
  axe,
};
