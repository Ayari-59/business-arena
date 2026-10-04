/**
 * ÉPISODE 7 — LE POSTE QUI RESTE VIDE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Marion montre, ce que la
 * courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BUDGET,
  D,
  DEVELOPPEMENT,
  GRANDS,
  JOURS_SANS_PERTE,
  MARGE_PLEINE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PETITS,
  cabinetRapide,
  codeCandidat,
  evenements,
  hasard,
  semaineDeReponse,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/poste-qui-reste-vide";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  nomDuCandidat,
  pronomDuCandidat,
  type IdDiagnostic,
} from "@/config/episodes/poste-qui-reste-vide";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const CLIENTS = GRANDS + PETITS;
/** La charge que l'équipe peut tenir sans s'user. */
const CHARGE_TENABLE = 1.2;
/** Le plafond de clients perdus que la direction tolère sur le trimestre. */
const PERTES_TOLEREES = 8;
/** La cadence de la courbe : la marge d'un portefeuille suivi, affaires nouvelles comprises. */
const CADENCE = MARGE_PLEINE + DEVELOPPEMENT;

const semainesDe = (v: number) => `${nombre(v, 0)} sem.`;
/** Un écart au budget : positif, le portefeuille a rapporté plus que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} en dessous du budget`;

const JUSTES: readonly IdDiagnostic[] = ["annonce", "marche"];

/** Ce que les décisions révèlent, dans l'ordre où un manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui montraient pourquoi l'annonce n'attirait personne",
  );

  const d = p.diagnostic as IdDiagnostic;
  const lecture: Record<IdDiagnostic, string> = {
    annonce:
      "Votre diagnostic de la semaine 1 était juste : l'annonce recopiée décrivait un poste de comptoir, et taisait le secteur, la rémunération et le véhicule.",
    marche:
      "En semaine 1, vous avez vu la rareté des bons profils : une vraie difficulté, mais pas celle que vous pouviez corriger. L'annonce elle-même les faisait fuir.",
    salaire:
      "En semaine 1, vous avez retenu la rémunération ; elle était dans la moyenne du marché, mais l'annonce ne la disait pas.",
    visibilite:
      "En semaine 1, vous avez retenu un manque de diffusion ; l'annonce était vue, mais elle n'attirait que des vendeurs de comptoir.",
  };
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (JUSTES.includes(r.principal as IdDiagnostic) && !JUSTES.includes(d)) {
      suite = " En semaine 2, vous l'avez corrigé à bon escient.";
    } else if (!JUSTES.includes(r.principal as IdDiagnostic) && JUSTES.includes(d)) {
      suite = " En semaine 2, vous avez abandonné une bonne piste.";
    }
  } else if (!JUSTES.includes(d)) {
    suite = " En semaine 2, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "annonce" ? 1 : d === "marche" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const noms = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).map(([dec, o]) =>
    ETAPES[dec]!.options[o]!.t.toLowerCase(),
  );
  const reflexe: Constat = {
    score: n === 0 ? 1 : n === 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez cédé à aucun des réflexes du recrutement sous pression : ni le coup de cœur sans vérification, ni l'attente du candidat parfait, ni la recrue laissée seule."
        : `Vous avez cédé ${n} fois aux réflexes du recrutement sous pression : ${noms.join(" ; ")}.${
            t.arrivee !== null && !t.recrutement.bon
              ? " Le recrutement s'est révélé une erreur, qu'il faudra payer."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    t.semaines[4]!.candidatures,
    "de candidatures reçues d'ici la fin de la semaine 4",
    "candidatures",
    { juste: 3, proche: 8 },
    (e) => `${nombre(e, 0)} candidature${e >= 1.5 ? "s" : ""}`,
  );

  const vite = p.chemin[D.offre] === 0 || p.chemin[D.offre] === 3;
  const integre = p.chemin[D.integration] === 0 || p.chemin[D.integration] === 3;
  const fait = (vite ? 1 : 0) + (integre ? 1 : 0);
  const integration: Constat = {
    score: fait === 2 ? 1 : fait === 1 ? 0.6 : 0,
    texte: `${
      vite
        ? "Une fois votre choix fait, vous avez répondu vite, avec une offre claire."
        : p.chemin[D.offre] === 1
          ? "Une fois votre choix fait, la procédure habituelle a fait attendre le candidat dix jours."
          : "Une fois votre choix fait, vous avez fait une offre basse, et le candidat a dû négocier."
    }${t.recrutement.refus ? " Le candidat retenu a préféré une autre offre." : ""} ${
      integre
        ? "Vous avez organisé les premières semaines de la recrue au lieu de la laisser se débrouiller."
        : p.chemin[D.integration] === 2
          ? "La formation au siège a appris les produits à la recrue, pas les clients."
          : "La recrue a appris seule, avec le fichier clients."
    }${t.recruePart && !t.rupture ? " Elle est partie avant la fin de sa période d'essai." : ""}`,
  };

  return [information, diagnostic, reflexe, calibrage, integration];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  integration,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder pourquoi le poste n'attire pas",
      texte:
        "Rejouez l'épisode en relisant d'abord l'annonce et en rappelant les candidats reçus : l'annonce décrivait un poste de comptoir, et taisait ce qu'un technico-commercial veut savoir.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Vérifier avant de choisir, décider vite ensuite",
      texte:
        "Le coup de cœur n'est un bon choix qu'une fois sur trois, et le candidat parfait signe ailleurs pendant qu'on l'attend. Un entretien structuré trie ; une offre ferme et rapide garde le bon candidat ; un parrain le rend productif.",
    };
  }
  if (integration!.score === 0) {
    return {
      titre: "Intégrer la recrue",
      texte:
        "Une recrue laissée seule met trois mois à être productive, perd des clients au passage de relais et part plus souvent. Un parrain et un plan pour les premières semaines coûtent moins qu'un recrutement à refaire.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui fait fuir les candidats",
      texte:
        "Quand un poste ne trouve personne, lisez l'annonce comme le candidat que vous cherchez : dit-elle le métier, le secteur, ce qu'il gagnera ? Diffuser plus une annonce qui n'attire pas ne fait qu'attirer plus de mauvais profils.",
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

/** La fenêtre de semaines où chaque décision agit d'abord : ce qu'elle a rapporté là. */
const FENETRES: readonly [number, number][] = [
  [2, 5],
  [3, 7],
  [5, 10],
  [6, 10],
  [8, 13],
  [11, 13],
];

/** Le nom de la recrue de ce trimestre. */
const recrueDe = (t: Trimestre) =>
  nomDuCandidat(codeCandidat(t.recrutement.candidat, t.recrutement.bon));

export const EPISODE_RECRUTEMENT: Episode<Trimestre> = {
  code: "poste-qui-reste-vide",
  numero: 7,
  domaine: "Recrutement et intégration",
  titre: "Le poste qui reste vide",
  resume:
    "Un technico-commercial à remplacer, une équipe qui porte son portefeuille, un candidat recommandé. Vérifier avant de choisir, décider vite, intégrer.",
  persona:
    "Vous êtes Marion Dubreuil, responsable de l'agence Arvel Distribution de Villefranche-sur-Saône. Votre équipe : cinq technico-commerciaux qui visitent les artisans du Beaujolais et du Val de Saône, et un comptoir. Julien, l'un des cinq, est parti il y a trois semaines.",
  mandat: [
    { fort: `${CLIENTS} clients`, texte: "dans le portefeuille de Julien, à garder" },
    { fort: kE(BUDGET), texte: "de contribution du portefeuille sur le trimestre" },
    { fort: `${taux(CHARGE_TENABLE, 0)}`, texte: "de charge pour l'équipe, au plus" },
    { fort: "1 recrue", texte: "autonome avant la fin de sa période d'essai" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la contribution du portefeuille de Julien, rapportée au budget : la marge, moins le salaire et les coûts de recrutement, en comptant les clients perdus, la surcharge de l'équipe et ce que coûte un recrutement raté.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre agence",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les clients de Julien qu'on ne voit pas reçoivent la visite des concurrents.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Nicolas Perrin",
        role: "Technico-commercial senior",
        alerte: true,
        texte: `Pendant ce temps, un client de Julien a passé sa commande de chantier chez un concurrent : ${euros(perdu)} de marge envolée.`,
      };
    },
  },
  prevision: {
    libelle: "le nombre de candidatures reçues d'ici la fin de la semaine 4",
    unite: "candidatures",
    placeholder: "8",
    min: 0,
    max: 100,
    step: 1,
    reel: (t) => t.semaines[4]!.candidatures,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "candidatures",
      nom: "Candidatures reçues",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `depuis le début du trimestre, dont ${nombre(l.qualifiees ?? 0, 0)} profils terrain`
          : "9 avant le trimestre, dont 1 profil terrain",
    },
    {
      cle: "vacance",
      nom: "Vacance du poste",
      format: semainesDe,
      sensBon: -1,
      aide: () => "semaines sans commercial sur le portefeuille, depuis le départ de Julien",
    },
    {
      cle: "clientsPerdus",
      nom: "Clients perdus",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => `sur les ${CLIENTS} du portefeuille de Julien, depuis le début du trimestre`,
    },
    {
      cle: "charge",
      nom: "Charge de l'équipe",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: -1,
      aide: () => `100 % : chacun son portefeuille ; tenable : ${taux(CHARGE_TENABLE, 0)}`,
    },
    {
      cle: "montee",
      nom: "Montée en charge de la recrue",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: (_semaine, l) =>
        l.semainesEnPoste
          ? `après ${l.semainesEnPoste} semaine${l.semainesEnPoste > 1 ? "s" : ""} en poste ; autonome en cinq`
          : "pas encore de recrue en poste",
      jauge: (l) =>
        l.montee == null || !l.semainesEnPoste
          ? null
          : {
              part: Math.min(1, l.montee),
              enRetard: l.montee < Math.min(1, 0.2 * l.semainesEnPoste) - 1e-9,
            },
    },
  ],
  contexte(l, decisions) {
    const retenu = l.retenu ?? null;
    const recrue = l.recrue ?? null;
    return {
      candidatures: nombre(l.candidatures ?? 0, 0),
      profils: `${nombre(l.qualifiees ?? 0, 0)} profil${Math.round(l.qualifiees ?? 0) > 1 ? "s" : ""} terrain`,
      charge: taux(l.charge ?? 0, 0),
      clientsPerdus: nombre(l.clientsPerdus ?? 0, 0),
      montee: l.montee == null ? "pas de recrue en poste" : taux(l.montee, 0),
      coeurBon: l.coeurBon === 1,
      retenu: retenu === null ? "" : nomDuCandidat(retenu),
      pronom: pronomDuCandidat(retenu),
      relance: retenu === 3,
      attente: decisions[D.selection] === 3,
      cabinetLent: decisions[D.annonce] === 2 && l.cabinetRapide === 0,
      enPoste: l.semainesEnPoste != null,
      semainesEnPoste: l.semainesEnPoste ?? 0,
      recrue:
        recrue !== null
          ? nomDuCandidat(recrue)
          : retenu !== null
            ? nomDuCandidat(retenu)
            : "La recrue",
      arrivee: l.arrivee ?? 0,
      recrueBonne: l.recrueBonne === 1 ? "bonne" : l.recrueBonne === 0 ? "mauvaise" : "aucune",
      equipePoussee: decisions[D.portefeuille] === 2,
      surLaRoute: decisions[D.portefeuille] === 3,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const contribution = semaines.reduce((x, w) => x + w.contribution, 0);
    return [
      [`Clients perdus, sem. ${a}`, nombre(t.semaines[a]!.clientsPerdus, 0)],
      [`Charge de l'équipe, sem. ${a}`, taux(t.semaines[a]!.charge, 0)],
      ["Contribution de la période", kE(contribution)],
    ];
  },
  courbe: {
    titre: "Marge du portefeuille de Julien, semaine par semaine",
    cle: "marge",
    cible: CADENCE,
    libelleCible: `portefeuille suivi : ${euros(CADENCE)} par semaine`,
    graduations: [3000, 6000, 9000, 12000],
    format: (v) => kE(v),
    details: (s) => [
      `marge ${euros(s.marge!)} · ${nombre(s.clientsPerdus!, 0)} clients perdus`,
      `charge de l'équipe ${taux(s.charge!, 0)} · ${
        s.presente ? `recrue à ${taux(s.montee!, 0)}` : "poste vide"
      }`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.annonce && choix === 2) {
      // Le cabinet a, ou n'a pas, un candidat dans son vivier : c'est le hasard du trimestre.
      return [
        {
          de: "Cabinet de recrutement",
          role: "Chargé de mission",
          texte: cabinetRapide(graine) ? REPONSES.cabinetRapide : REPONSES.cabinetLent,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const rec = t.recrutement;
    const retenu = nomDuCandidat(codeCandidat(rec.retenu, rec.retenuBon));
    const recrue = recrueDe(t);
    const lies: Message[] = [];
    const sem = (w: number) => `sem. ${w}`;
    if (arrive.coeurParti) {
      lies.push({
        de: "Gilles Peyrot",
        role: "Plombier-chauffagiste, client",
        heure: sem(6),
        texte: "Jordan a accepté un poste dans une grande surface de bricolage. Dommage pour vous.",
      });
    }
    if (arrive.selection) {
      const s = chemin[D.selection];
      let texte: string;
      if (rec.retenu === "relance") {
        texte =
          s === 3
            ? "Le profil idéal ne s'est pas présenté, et les meilleurs candidats ont signé ailleurs. On relance l'annonce."
            : "Personne n'atteint la note minimale de la grille, Jordan compris : sa mise en situation a tourné court, et ses références sont mitigées. On relance l'annonce.";
      } else if (s === 1) {
        texte =
          rec.retenu === "coeur"
            ? "Jordan a fait la meilleure mise en situation, et ses références sont bonnes. La grille le place en tête."
            : `Jordan a brillé en entretien mais raté la mise en situation : son devis était faux, et ses références sont mitigées. La grille place ${retenu} en tête.`;
      } else if (s === 2) {
        texte =
          rec.retenu === "coeur"
            ? "Au terme des entretiens, votre préférence va à Jordan : le courant est passé tout de suite."
            : `Au terme des entretiens, votre préférence va à ${retenu}, qui a fait la meilleure impression.`;
      } else {
        texte = `Deux semaines de plus ont fait venir de nouveaux profils : ${retenu} se détache.`;
      }
      lies.push({
        de: s === 1 ? "Nicolas Perrin" : "Aurélie Chassagne",
        role: s === 1 ? "Technico-commercial senior" : "Chargée de recrutement, siège",
        heure: sem(rec.entretiens),
        texte,
      });
    }
    const reponse = semaineDeReponse(chemin, graine);
    if (arrive.refus) {
      lies.push({
        de: "Aurélie Chassagne",
        role: "Chargée de recrutement, siège",
        heure: sem(reponse),
        alerte: true,
        texte: `${retenu} a accepté l'offre d'un concurrent. ${
          chemin[D.selection] === 0
            ? "Personne d'autre n'avait été reçu : il faut tout reprendre. "
            : ""
        }${
          t.arrivee !== null
            ? `${chemin[D.selection] === 0 ? "La nouvelle annonce a fait venir" : "On se rabat sur"} ${recrue}, qui pourra arriver en semaine ${t.arrivee}.`
            : "Personne n'arrivera avant le trimestre prochain."
        }`,
      });
    }
    if (arrive.accepte) {
      lies.push({
        de: "Aurélie Chassagne",
        role: "Chargée de recrutement, siège",
        heure: sem(reponse),
        texte: `${retenu} a accepté votre offre. Prise de poste en semaine ${rec.arrivee}.`,
      });
    }
    if (arrive.arrivee) {
      lies.push({
        de: "Sylvie Bernard",
        role: "Responsable du comptoir",
        heure: sem(t.arrivee!),
        texte: `${recrue} a pris son poste ce lundi : badge, véhicule, fichier clients. Le café d'accueil a eu lieu au comptoir.`,
      });
    }
    if (arrive.reclamation) {
      lies.push({
        de: "Patrick Mounier",
        role: "Menuisier, client",
        heure: sem(t.arrivee! + 3),
        alerte: true,
        texte: `${recrue} m'a envoyé un devis avec les mauvaises références, et ne m'a jamais rappelé. Julien, lui, rappelait.`,
      });
    }
    if (arrive.bastienPart) {
      lies.push({
        de: "Bastien Roux",
        role: "Technico-commercial",
        heure: sem(8),
        alerte: true,
        texte:
          "Marion, je démissionne. Deux mois à porter deux portefeuilles, je n'en peux plus. Un concurrent m'a fait une offre.",
      });
    }
    if (arrive.recruePart) {
      lies.push({
        de: recrue,
        role:
          pronomDuCandidat(codeCandidat(rec.candidat, rec.bon)) === "Elle"
            ? "Technico-commerciale en période d'essai"
            : "Technico-commercial en période d'essai",
        heure: sem(12),
        alerte: true,
        texte: rec.bon
          ? "Je préfère arrêter là. Je ne sais pas ce qu'on attend de moi, et je ne me sens pas à ma place. Je pars à la fin de la semaine."
          : "Ce poste ne me correspond pas : je préfère arrêter avant la fin de ma période d'essai.",
      });
    }
    if (arrive.rupture) {
      lies.push({
        de: "Ressources humaines",
        role: "Siège",
        heure: sem(11),
        texte: `La période d'essai de ${recrue} a pris fin. Le portefeuille de Julien repasse à l'équipe.`,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: sem(semaine),
      texte: imprevu.texte,
    }));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) => `${ecartAuBudget(t.objectif)}, pertes comprises`,
    formatObjectif: kE,
    noteDesBarres:
      "Écart au budget de contribution du portefeuille de Julien — marge, moins salaire et coûts de recrutement, clients perdus, surcharge de l'équipe et recrutements ratés compris — sous le hasard que vous avez joué : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Poste pourvu",
          valeur: t.arrivee !== null ? `semaine ${t.arrivee}` : "non",
          aide: `${nombre(t.vacanceTotale, 0)} semaines de vacance au total ; objectif : arrivée en semaine 8`,
          tenu: t.arrivee !== null && t.arrivee <= 8,
        },
        {
          nom: "Clients gardés",
          valeur: `${nombre(CLIENTS - t.clientsPerdus, 0)} sur ${CLIENTS}`,
          aide: `${nombre(t.clientsPerdus, 0)} perdus ; plafond : ${PERTES_TOLEREES}`,
          tenu: t.clientsPerdus <= PERTES_TOLEREES,
        },
        {
          nom: "Charge de l'équipe",
          valeur: taux(t.chargeMoyenne, 0),
          aide: `en moyenne ; tenable : ${taux(CHARGE_TENABLE, 0)}${
            t.bastienPart ? " ; Bastien a démissionné" : ""
          }`,
          tenu: t.chargeMoyenne <= CHARGE_TENABLE && !t.bastienPart,
        },
        {
          nom: "Recrue",
          valeur: t.arrivee !== null && !t.recruePart ? taux(t.monteeFinale, 0) : "—",
          aide:
            t.arrivee === null
              ? "pas de recrue dans le trimestre"
              : t.rupture
                ? "période d'essai rompue"
                : t.recruePart
                  ? "partie en période d'essai"
                  : t.recrutement.bon
                    ? "montée en charge en semaine 13"
                    : "une erreur de recrutement",
          tenu: t.arrivee !== null && !t.recruePart && t.recrutement.bon && t.monteeFinale >= 0.6,
        },
      ];
    },
    hasard(t, graine) {
      const rec = t.recrutement;
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Jordan, le coup de cœur",
          texte: rec.coeurBon
            ? "était un bon commercial : ses références le disaient."
            : "était un beau parleur qui ne relançait pas ses devis : ses références le disaient.",
        },
        {
          titre: "Le recrutement",
          texte: [
            rec.refus
              ? `${nomDuCandidat(codeCandidat(rec.retenu, rec.retenuBon))} a préféré une autre offre`
              : null,
            t.arrivee !== null
              ? `${recrueDe(t)} est arrivé${pronomDuCandidat(codeCandidat(rec.candidat, rec.bon)) === "Elle" ? "e" : ""} en semaine ${t.arrivee}, ${rec.bon ? "un bon recrutement" : "une erreur de recrutement"}`
              : "personne n'est arrivé dans le trimestre",
            t.rupture
              ? "la période d'essai a été rompue en semaine 11"
              : t.recruePart
                ? "la recrue est partie en semaine 12"
                : null,
          ]
            .filter(Boolean)
            .join(", ")
            .concat("."),
        },
        {
          titre: "L'équipe",
          texte: t.bastienPart
            ? "Bastien a démissionné en semaine 8, à bout."
            : "Personne n'est parti, malgré la charge.",
        },
      ];
    },
    fenetre(t, d) {
      const [de, a] = FENETRES[d]!;
      let c = 0;
      for (let w = de; w <= a; w += 1) c += t.semaines[w]!.contribution;
      return c;
    },
  },
  comportements,
  axe,
};
