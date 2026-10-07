/**
 * ÉPISODE 92 — L'ASSOCIATION QUI DEMANDE À ÊTRE REPRISE, tel que l'interface
 * et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Ursule montre, ce que la courbe
 * trace, ce sur quoi le bilan la juge, et ce que ses décisions révèlent
 * d'elle.
 *
 * Une reprise se joue sur des années, l'épisode sur un trimestre : le tableau
 * de bord suit donc la VALEUR CRÉÉE ESTIMÉE, ce que la reprise apporte ou
 * coûte aux réserves de Solvanne sur les cinq ans du prochain CPOM, recalculée
 * chaque semaine avec ce que le trimestre apprend (l'audit, la réponse de
 * l'ARS, l'enveloppe régionale, les départs). Les décisions à venir y
 * comptent comme « ne rien changer » : la courbe part de bas, et monte à
 * mesure que la reprise se négocie.
 */
import {
  ANNONCES,
  D,
  DEFICIT_ESAT,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_VALEUR,
  PASSIF_SOCIAL,
  PERTE_PAR_JOUR,
  PRIMEVERES,
  PRUDHOMMES,
  RANCUNE,
  SCENARIOS,
  hasard,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/association-a-reprendre";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/association-a-reprendre";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const jours = (v: number) => `${nombre(v, 0)} jours`;

const ARS = {
  de: "Vivienne Tressard",
  role: "Directrice de l'offre médico-sociale, ARS",
} as const;
const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière, Solvanne",
} as const;
const NESTOR = {
  de: "Nestor Mongrenier",
  role: "Président du conseil d'administration, Solvanne",
} as const;
const IRMINE = { de: "Irmine Marsaudon", role: "Directrice de l'IME des Primevères" } as const;
const FODE = { de: "Fodé Pellerey", role: "Chef des ateliers de l'ESAT des Primevères" } as const;
const DAGMAR = { de: "Dagmar Brachet", role: "Associée, cabinet Collonges Audit" } as const;
const ROSALINDE = {
  de: "Rosalinde Charvolin",
  role: "Responsable des travaux, siège de Solvanne",
} as const;
const GREFFE = { de: "Conseil de prud'hommes de Dijon", role: "Greffe" } as const;

/** Le passif social des Primevères, en k€ : ce que la prévision de la semaine 1 demande. */
export const PASSIF_SOCIAL_KE = PASSIF_SOCIAL / 1000;

const enReprise = (t: Trimestre) => t.issue === "reprise";

/** Ce que les conclusions de l'audit disent, à la semaine où la décision du vote se prend. */
function conclusions(l: Record<string, number | null>, audit: number): string {
  if (l.enJeu !== 1) return "Il n'y a plus de reprise : l'audit s'est arrêté.";
  if (audit === 0) {
    return "Aucun audit n'a été fait : les comptes certifiés ne disent ni les contentieux en cours ni l'état des bâtiments. Ce que cachent les Primevères ne se saura qu'après le vote.";
  }
  if (audit === 3) {
    return "La revue du siège n'a rien trouvé d'anormal dans les comptes et les contrats ; elle n'a examiné ni les contentieux en cours, ni les bâtiments, ni l'accompagnement.";
  }
  const prud =
    (l.prudhommes ?? 0) > 0
      ? `Un contentieux prud'homal : un ancien chef de service réclame des heures supplémentaires et conteste son licenciement ; risque évalué à ${kE(l.prudhommes!)}, rien de provisionné.`
      : "Aucun contentieux en cours.";
  const social = `Le passif social se confirme : ${kE(PASSIF_SOCIAL)}.`;
  if (audit === 2) return `${prud} ${social} Les bâtiments n'ont pas été examinés.`;
  const trav =
    (l.travaux ?? 0) > 0
      ? `L'internat n'a jamais levé les prescriptions de 2019 : ${kE(l.travaux!)} de travaux de mise en sécurité (recoupement des circulations, désenfumage, alarme).`
      : "L'internat est en bon état : les prescriptions de 2019 ont été levées en 2021.";
  return `${prud} ${social} ${trav} L'accompagnement est de bonne qualité : projets personnalisés à jour aux deux tiers, équipe éducative stable, très attachée à sa directrice.`;
}

/** Ce que les décisions révèlent, dans l'ordre où une directrice générale les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les comptes et le registre du personnel, qui chiffraient ce que Solvanne prendrait",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    conditions:
      "Votre diagnostic de la semaine 1 était juste : la reprise pouvait créer de la valeur, à condition d'être diagnostiquée, négociée avec l'autorité de tarification et préparée avec les équipes.",
    passifs:
      "En semaine 1, vous avez vu les passifs cachés : un vrai danger, mais la moitié du sujet. L'audit ne vaut que si l'on présente ensuite ce qu'il trouve à l'ARS, avant de voter.",
    ars: "En semaine 1, vous avez fait de la relation avec l'ARS l'enjeu : un oui donné pour lui plaire lui ôte toute raison de financer la reprise.",
    prudence:
      "En semaine 1, vous avez vu une association en déficit à fuir ; ses déficits tenaient surtout à sa taille, que la fusion corrigeait, et un refus a son prix au prochain CPOM.",
  };
  const justes = ["conditions", "passifs"];
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
    score: d === "conditions" ? 1 : d === "passifs" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes d'une direction pressée par son autorité de tarification : ni oui pour plaire, ni non par principe, ni comptes certifiés pris pour un audit, ni déficit commercial glissé sur le budget social, ni vote maintenu malgré l'audit, ni silence aux équipes."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : dire oui pour ne pas fâcher l'ARS ou non par prudence, se contenter des comptes certifiés, ne rien chiffrer, glisser le déficit commercial de l'ESAT sur le budget social, voter comme annoncé, ne rien dire aux équipes.${
            enReprise(t) && t.nonCouverts > 100000
              ? ` ${kE(t.nonCouverts)} de passifs restent à la charge de Solvanne.`
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    PASSIF_SOCIAL_KE,
    "de passif social aux Primevères",
    "k€",
    { juste: 10, proche: 40 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const [d1, , d3, , d5] = p.chemin;
  let negociation: Constat;
  if (d1 === 2) {
    negociation = {
      score: 0,
      texte: `Vous avez décliné avant d'avoir chiffré quoi que ce soit. ${
        t.rancune
          ? "L'ARS s'en est souvenue au dialogue de gestion du CPOM."
          : "Cette fois, l'ARS ne vous en a pas tenu rigueur ; six fois sur dix, elle l'aurait fait."
      }`,
    };
  } else if (d1 === 0) {
    negociation = {
      score: 0,
      texte:
        "Vous avez dit oui avant de négocier : l'ARS n'avait plus de raison de financer la transition, l'avenant et les passifs que vous lui demandiez ensuite.",
    };
  } else if (t.issue === "perdu") {
    negociation = {
      score: 0,
      texte:
        "Vous avez différé la réponse : l'ARS a confié les Primevères à Héliandre, et Solvanne n'a rien négocié du tout.",
    };
  } else {
    const chiffre = d3 === 1;
    const rouvert = d5 === 1 || d5 === 3;
    negociation = {
      score: (chiffre ? 0.5 : 0) + (rouvert ? 0.5 : 0),
      texte: `${
        chiffre
          ? "Vous avez chiffré pour l'ARS tout ce qu'elle pouvait financer, et seulement cela"
          : "Votre dossier ne demandait pas à l'ARS ce qu'elle pouvait financer, ou lui demandait ce qu'elle ne peut pas"
      } ; ${
        rouvert
          ? "puis vous êtes revenue vers elle avec ce que l'audit et sa première réponse laissaient à découvert, avant de voter."
          : d5 === 2
            ? "puis vous vous êtes retirée, au prix d'un retrait tardif."
            : "puis vous avez fait voter la fusion sans revenir vers elle sur ce qui restait à découvert."
      }`,
    };
  }

  return [information, diagnostic, reflexe, calibrage, negociation];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  negociation,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer avant de répondre",
      texte:
        "Rejouez l'épisode en lisant d'abord les comptes des Primevères et leur registre du personnel : le passif social, le déficit de chaque budget et les économies de la fusion se calculaient avant la première réponse à l'ARS.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni oui pour plaire, ni non par principe",
      texte:
        "Une reprise se décide sur un diagnostic, se négocie avec l'autorité de tarification avant le vote, et se prépare avec les équipes. Dire oui d'avance ôte à l'ARS toute raison de payer ; dire non d'emblée se paie au CPOM suivant.",
    };
  }
  if (negociation!.score === 0) {
    return {
      titre: "Négocier avant de voter",
      texte:
        "L'ARS finance ce qu'on lui présente chiffré, et seulement ce qu'elle a le droit de financer : la transition, un avenant au CPOM, la reprise des passifs. Ce que l'audit révèle se présente avant le vote, pas après.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Voir toute la reprise",
      texte:
        "Les passifs cachés comptent, mais une reprise se joue aussi sur ce que l'autorité de tarification accepte de financer, sur le budget commercial de l'ESAT, et sur les équipes qui restent.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le compte du passif social",
      texte:
        "Les indemnités de départ à la retraite des salariés qui partent dans les cinq ans, et les jours épargnés sur les comptes épargne-temps, au coût chargé : c'est ce que le repreneur prend, provisionné ou non.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

const capitale = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const EPISODE_REPRISE: Episode<Trimestre> = {
  code: "association-a-reprendre",
  numero: 92,
  domaine: "Reprendre un établissement en difficulté",
  titre: "L'association qui demande à être reprise",
  resume:
    "L'ARS demande à Solvanne de reprendre une association voisine au bord de la cessation de paiements. Ni oui pour plaire, ni non par prudence : diagnostiquer, négocier avec l'autorité de tarification, préparer les équipes.",
  persona:
    "Vous êtes Ursule Mauvernay, directrice générale de l'Association Solvanne : une clinique de soins médicaux et de réadaptation, six EHPAD, un pôle domicile et un pôle handicap en Côte-d'Or et en Saône-et-Loire, 1 150 salariés, 68 M€ de produits. L'association voisine des Primevères, à Nuits-Saint-Georges (un IME de 45 enfants, un ESAT de 60 travailleurs), est au bord de la cessation de paiements. De janvier à mars, l'ARS attend votre réponse.",
  mandat: [
    { fort: "fusion-absorption", texte: "demandée par l'ARS avant l'été" },
    {
      fort: `${PRIMEVERES.enfants} enfants`,
      texte: `à l'IME des Primevères, ${PRIMEVERES.travailleurs} travailleurs à l'ESAT`,
    },
    {
      fort: `${PRIMEVERES.tresorerie} jours`,
      texte: "de trésorerie aux Primevères au 1er janvier",
    },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins pour Solvanne, sur le CPOM" },
  ],
  jugement:
    "Votre conseil d'administration juge le trimestre sur la valeur créée pour Solvanne : ce que la reprise apporte ou coûte à ses réserves sur les cinq ans du prochain CPOM, financements de l'ARS, passifs et crédit au prochain CPOM compris, estimée en semaine 13 avec ce que le trimestre a révélé.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "La reprise des Primevères",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, l'avocat prépare la réponse à l'ARS dans l'urgence, au tarif de l'urgence.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...EUDOXIE,
        alerte: true,
        texte: `L'ARS voulait sa réponse : le cabinet d'avocats a préparé le courrier dans l'urgence. ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle:
      "le passif social des Primevères (indemnités de départ à la retraite et comptes épargne-temps non provisionnés), en milliers d'euros",
    unite: "k€",
    placeholder: "200",
    min: 0,
    max: 2000,
    step: 1,
    reel: () => PASSIF_SOCIAL_KE,
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
          ? "sur les cinq ans du CPOM ; les décisions à venir comptées comme « ne rien changer »"
          : "rien n'est encore décidé",
    },
    {
      cle: "passifs",
      nom: "Passifs connus des Primevères",
      format: kE,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "passif social, et ce que l'audit ou le trimestre a révélé"
          : "à chiffrer : rien n'est provisionné",
    },
    {
      cle: "couverture",
      nom: "Engagements obtenus de l'ARS",
      format: kE,
      sensBon: 1,
      aide: (_, l) =>
        l.besoin != null
          ? `sur ${kE(l.besoin)} à couvrir sur le CPOM`
          : "rien n'est encore demandé",
      jauge: (l) =>
        l.besoin
          ? {
              part: Math.min(1, (l.couverture ?? 0) / l.besoin),
              enRetard: (l.reponse ?? -1) > 0 && (l.couverture ?? 0) < 0.6 * l.besoin,
            }
          : null,
    },
    {
      cle: "deficitEsat",
      nom: "Déficit commercial de l'ESAT",
      format: (v) => `${kE(v)}/an`,
      sensBon: -1,
      aide: () => `prévu en régime ; ${kE(DEFICIT_ESAT)} par an aujourd'hui`,
    },
    {
      cle: "tresorerie",
      nom: "Trésorerie des Primevères",
      format: jours,
      sensBon: 1,
      aide: (semaine) =>
        semaine >= ANNONCES.ars
          ? "en jours de charges, avance de l'ARS comprise"
          : "en jours de charges",
    },
  ],
  contexte(l, decisions): Contexte {
    const n = l.reponse ?? -1;
    return {
      enJeu: l.enJeu === 1,
      perdu: l.perdu === 1,
      reponseTexte: n > 0 ? REPONSES.reponse[n]! : "elle n'a pas encore répondu",
      couverture: kE(l.couverture ?? 0),
      nonCouverts: kE(l.nonCouverts ?? PASSIF_SOCIAL),
      passifs: kE(l.passifs ?? PASSIF_SOCIAL),
      valeur: kE(l.valeur ?? 0),
      conclusions: conclusions(l, decisions[D.audit] ?? NEUTRE[D.audit]),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Engagements de l'ARS, sem. ${a}`, `${kE(s.couverture)} ; passifs ${kE(s.passifs)}`],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [-1200000, -900000, -600000, -300000, 0, 300000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `ARS ${kE(s.couverture!)} · passifs connus ${kE(s.passifs!)} · trésorerie ${jours(s.tresorerie!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.reponse && choix === 2) {
      // Le ton de l'ARS laisse deviner ce qu'elle fera au prochain CPOM.
      const sec = hasard(graine).uRancune < RANCUNE.refus.chance;
      return [{ ...ARS, texte: sec ? REPONSES.refusSec : REPONSES.refusCompris }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    const audite = t.issue === "reprise" || t.issue === "retrait";
    const [d1, d2, , d4, d5] = chemin;
    if (d1 === 3 && dans(ANNONCES.perte)) {
      lies.push({
        ...ARS,
        heure: `sem. ${ANNONCES.perte}`,
        alerte: t.issue === "perdu",
        texte: t.issue === "perdu" ? REPONSES.perdu : REPONSES.pasPerdu,
      });
    }
    if (audite && dans(ANNONCES.auditSocial)) {
      if (d2 === 1 || d2 === 2) {
        lies.push({
          ...DAGMAR,
          heure: `sem. ${ANNONCES.auditSocial}`,
          alerte: h.prudhommes,
          texte: h.prudhommes
            ? `Premières conclusions : un ancien chef de service réclame des heures supplémentaires et conteste son licenciement devant les prud'hommes. Risque évalué à ${kE(PRUDHOMMES.montant)}, rien de provisionné. Le passif social se confirme : ${kE(PASSIF_SOCIAL)}.`
            : `Premières conclusions : aucun contentieux en cours. Le passif social se confirme : ${kE(PASSIF_SOCIAL)}.`,
        });
      } else if (d2 === 3) {
        lies.push({
          ...EUDOXIE,
          heure: `sem. ${ANNONCES.auditSocial}`,
          texte:
            "Mes équipes ont relu les comptes et les contrats des Primevères : rien d'anormal. Pour les contentieux et les bâtiments, il aurait fallu des spécialistes.",
        });
      }
    }
    if (audite && d2 === 1 && dans(ANNONCES.auditBatiments)) {
      lies.push({
        ...DAGMAR,
        heure: `sem. ${ANNONCES.auditBatiments}`,
        alerte: h.travaux > 0,
        texte:
          h.travaux > 0
            ? `Notre ingénieur a visité l'internat : les prescriptions de 2019 n'ont jamais été levées. Recoupement des circulations, désenfumage, alarme : ${kE(h.travaux)} de travaux de mise en sécurité avant la prochaine commission.`
            : "Notre ingénieur a visité l'internat : les prescriptions de 2019 ont été levées en 2021. Pas de travaux de mise en sécurité à prévoir. L'accompagnement est de bonne qualité.",
      });
    }
    if (audite && t.reponse > 0 && dans(ANNONCES.ars)) {
      lies.push({
        ...ARS,
        heure: `sem. ${ANNONCES.ars}`,
        alerte: t.reponse < 3,
        texte: `Le comité régional a statué sur votre dossier : ${REPONSES.reponse[t.reponse]}.`,
      });
    }
    if (audite && d4 === 2 && dans(ANNONCES.controle)) {
      lies.push({
        ...ARS,
        heure: `sem. ${ANNONCES.controle}`,
        alerte: true,
        texte: REPONSES.controle,
      });
    }
    if (enReprise(t) && d5 === 0 && dans(10)) {
      lies.push({ ...NESTOR, heure: "sem. 10", texte: REPONSES.vote });
    }
    if (audite && t.seconde !== null && dans(ANNONCES.reponse2)) {
      lies.push({
        ...ARS,
        heure: `sem. ${ANNONCES.reponse2}`,
        alerte: !t.seconde,
        texte: t.seconde
          ? REPONSES.secondeOui
          : `${REPONSES.secondeNon}${d5 === 3 ? " Je prends acte de votre retrait, que vous m'aviez annoncé." : ""}`,
      });
    }
    if (enReprise(t) && t.seconde !== null && dans(12)) {
      lies.push({ ...NESTOR, heure: "sem. 12", texte: REPONSES.vote });
    }
    if (t.issue !== "perdu" || d1 === 3) {
      if (dans(ANNONCES.cpom)) {
        lies.push({
          ...ARS,
          heure: `sem. ${ANNONCES.cpom}`,
          alerte: t.rancune === true,
          texte: enReprise(t)
            ? REPONSES.credit
            : t.rancune
              ? REPONSES.rancune
              : REPONSES.pasDeRancune,
        });
      }
    }
    if (enReprise(t) && dans(ANNONCES.departs)) {
      lies.push({
        ...IRMINE,
        heure: `sem. ${ANNONCES.departs}`,
        alerte: t.departDirectrice,
        texte: t.departDirectrice
          ? "J'ai accepté la direction de l'IME de Haute-Saône. Je pars à la fin du trimestre ; il faudra un intérim de direction."
          : "C'est décidé, je reste : j'ai envie de construire la suite de l'IME avec Solvanne.",
      });
      lies.push({
        ...FODE,
        heure: `sem. ${ANNONCES.departs}`,
        alerte: t.departChef,
        texte: t.departChef
          ? "Je quitte l'ESAT : une entreprise adaptée de Beaune m'a fait une offre. Les clients des ateliers vont devoir s'habituer à quelqu'un d'autre."
          : "Je reste aux ateliers. On a du travail pour remettre le budget commercial à flot.",
      });
    }
    if (enReprise(t) && t.appel !== null && dans(ANNONCES.appel)) {
      lies.push({
        ...FODE,
        heure: `sem. ${ANNONCES.appel}`,
        alerte: !t.appel,
        texte: t.appel
          ? "Nous avons remporté le marché des espaces verts de la communauté de communes : quatre ans de travail pour les équipes."
          : "Le marché des espaces verts est allé au paysagiste, moins cher de 8 %. Le matériel servira aux clients actuels, ou se revendra.",
      });
    }
    if (enReprise(t) && h.prudhommes && !t.revele.prudhommes && dans(ANNONCES.prudhommes)) {
      lies.push({
        ...GREFFE,
        heure: `sem. ${ANNONCES.prudhommes}`,
        alerte: true,
        texte: `Convocation devant le bureau de jugement : un ancien chef de service des Primevères réclame ${kE(PRUDHOMMES.montant)} (heures supplémentaires, licenciement sans cause réelle et sérieuse). Le repreneur en répondra.`,
      });
    }
    if (enReprise(t) && h.travaux > 0 && !t.revele.travaux && dans(ANNONCES.commission)) {
      lies.push({
        ...ROSALINDE,
        heure: `sem. ${ANNONCES.commission}`,
        alerte: true,
        texte: `La commission de sécurité a visité l'internat des Primevères : avis défavorable, les prescriptions de 2019 n'ont jamais été levées. ${kE(h.travaux)} de travaux de mise en sécurité, que la fusion fait passer à Solvanne.`,
      });
    }
    const imprevus: Message[] = h.imprevus
      .filter((i) => dans(i.semaine))
      .map(({ imprevu, semaine }) => ({
        de: imprevu.de,
        role: imprevu.role,
        heure: `sem. ${semaine}`,
        texte: imprevu.texte,
      }));
    if (dans(ANNONCES.ars)) {
      const s = SCENARIOS[h.scenario]!;
      imprevus.push({
        ...EUDOXIE,
        heure: `sem. ${ANNONCES.ars}`,
        texte: `La campagne budgétaire est lancée : l'enveloppe régionale de crédits non reconductibles est ${s.nom} cette année${
          h.scenario === 2 ? ", et l'ARS devra choisir entre les dossiers" : ""
        }.`,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée pour Solvanne, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite pour Solvanne, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée pour Solvanne : ce que la reprise apporte ou coûte à ses réserves sur les cinq ans du CPOM, financements de l'ARS, passifs et crédit au prochain CPOM compris, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const reprise = enReprise(t);
      const departs = (t.departDirectrice ? 1 : 0) + (t.departChef ? 1 : 0);
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Passifs à la charge de Solvanne",
          valeur: reprise ? kE(t.nonCouverts) : "aucun",
          aide: reprise
            ? `sur ${kE(t.passifs)} de passifs connus en fin de trimestre`
            : "pas de reprise",
          tenu: !reprise || t.nonCouverts <= 50000,
        },
        {
          nom: "Budget commercial de l'ESAT",
          valeur: reprise ? `${kE(t.deficitEsat)}/an` : "sans objet",
          aide: reprise
            ? `déficit prévu en régime ; ${kE(DEFICIT_ESAT)} au départ`
            : "pas de reprise",
          tenu: reprise && t.deficitEsat <= 10000,
        },
        {
          nom: "Cadres des Primevères",
          valeur: reprise
            ? departs
              ? `${departs} départ${departs > 1 ? "s" : ""}`
              : "tous restés"
            : "sans objet",
          aide: "la directrice de l'IME et le chef des ateliers de l'ESAT",
          tenu: reprise && departs === 0,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const s = SCENARIOS[h.scenario]!;
      const lignes = [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "L'enveloppe régionale",
          texte: `de crédits non reconductibles a été ${s.nom} : une chance sur ${
            h.scenario === 0 ? "quatre" : h.scenario === 1 ? "deux à peu près" : "trois à peu près"
          }.`,
        },
        {
          titre: "L'ARS",
          texte:
            t.reponse > 0
              ? `${capitale(REPONSES.reponse[t.reponse]!)}${
                  t.seconde === null
                    ? "."
                    : t.seconde
                      ? ", puis a accepté la seconde demande."
                      : ", puis a refusé la seconde demande."
                }`
              : "n'a pas eu à statuer sur un dossier de Solvanne.",
        },
        {
          titre: "Ce que cachaient les Primevères",
          texte: `${
            h.prudhommes
              ? `Un contentieux prud'homal de ${kE(PRUDHOMMES.montant)}${t.revele.prudhommes ? ", révélé par l'audit" : ""}`
              : "Aucun contentieux"
          } ; ${
            h.travaux > 0
              ? `${kE(h.travaux)} de travaux de mise en sécurité à l'internat${t.revele.travaux ? ", révélés par l'audit" : ""}`
              : "un internat en bon état"
          }.`,
        },
        {
          titre: "Le prochain CPOM",
          texte: enReprise(t)
            ? "L'ARS soutient l'extension du FAM : la reprise lui a rendu service."
            : t.rancune
              ? `L'ARS a fait payer le ${t.issue === "retrait" ? "retrait" : "refus"} : ${kE(t.coutRefus)} sur cinq ans.`
              : "L'ARS n'a pas tenu rigueur du refus, au-delà de quelques crédits.",
        },
      ];
      if (enReprise(t)) {
        lignes.push({
          titre: "Les équipes",
          texte: `La directrice de l'IME ${t.departDirectrice ? "est partie" : "est restée"}, le chef des ateliers ${t.departChef ? "est parti" : "est resté"}${
            t.appel === null
              ? ""
              : t.appel
                ? " ; l'ESAT a remporté le marché des espaces verts"
                : " ; l'ESAT a perdu le marché des espaces verts"
          }.`,
        });
      }
      return lignes;
    },
  },
  comportements,
  axe,
};
