/**
 * ÉPISODE 64 — LES APPELS D'OFFRES EN RAFALE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Florimond montre, ce que la
 * courbe trace, ce sur quoi le bilan le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * La courbe suit la marge nette des marchés : elle descend chaque semaine du
 * coût des réponses, et ne remonte qu'aux attributions. C'est toute la leçon
 * du go / no-go : une réponse coûte à coup sûr, un marché ne rapporte que
 * s'il est gagné.
 */
import {
  AN_DERNIER,
  CAPACITE,
  COUT_D_UN_MARCHE_GAGNE,
  D,
  GLISSEMENT,
  JOURS,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF,
  PERTE_PAR_JOUR,
  SELECTIONS,
  critereElargi,
  evenements,
  haldenAgressif,
  hasard,
  marche,
  simuler,
  tableauDeBord,
  type ImprevuTire,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/appels-d-offres-en-rafale";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/appels-d-offres-en-rafale";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const STERENN = { de: "Sterenn Le Scao", role: "Responsable des propositions" } as const;
const KONAN = {
  de: "Konan Bodiguel",
  role: "Directeur général des services, Vilaine Métropole",
} as const;
const OANEZ = {
  de: "Oanez Le Floch",
  role: "Directrice générale des services, communauté de communes du Haut-Lié",
} as const;

/** Le coût d'avant-vente d'un marché gagné l'an dernier, en k€ : ce que la prévision de la semaine 1 demande. */
export const COUT_EN_KE = COUT_D_UN_MARCHE_GAGNE / 1000;
/** Le taux de transformation de l'an dernier. */
export const TRANSFORMATION_AN_DERNIER = AN_DERNIER.gagnes / AN_DERNIER.reponses;

const jours = (v: number) => `${nombre(v)} jour${Math.abs(v) >= 2 ? "s" : ""}`;
const points = (v: number) => `${nombre(v)} point${Math.abs(v) >= 2 ? "s" : ""}`;
/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const fois = (n: number) => (n === 0 ? "jamais" : n === 1 ? "une fois" : `${n} fois`);

/** Les réponses retenues en semaine 1 qui restent à remettre en semaine 11. */
const restantesDe = (d1: number) => SELECTIONS[d1]!.map(marche).filter((m) => m.remise === 11);

/** Ce que les décisions révèlent, dans l'ordre où un associé les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui disaient ce que vos réponses coûtaient et pourquoi elles perdaient",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    selection:
      "Votre diagnostic de la semaine 1 était juste : la practice répondait à trop d'appels d'offres avec trop peu de temps de seniors, et chaque réponse de plus diluait toutes les autres.",
    seniors:
      "En semaine 1, vous avez vu le manque de seniors : une vraie contrainte, mais pas la cause. Le temps des seniors ne manquait pas pour cinq bonnes réponses ; il manquait pour douze.",
    prix: "En semaine 1, vous avez retenu le prix ; les rapports d'analyse montraient l'inverse : l'attributaire était plus cher que nous neuf fois sur quinze, et nous perdions sur la note technique.",
    sortants:
      "En semaine 1, vous avez cru les marchés joués d'avance pour les sortants ; c'était vrai à la Métropole, pas ailleurs. Là où nous avions des références et avions vu le besoin en amont, nous gagnions.",
  };
  const justes = ["selection", "seniors"];
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
    score: d === "selection" ? 1 : d === "seniors" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé au réflexe du volume : ni répondre à tout à prix serrés, ni courir le plus gros marché, ni faire écrire les mémoires par l'intercontrat parce qu'il est déjà payé, ni baisser le prix ou la séniorité de l'équipe pour passer sous un concurrent."
        : `Vous avez choisi ${n} fois le réflexe du volume ou du prix : répondre à tout à prix serrés, courir le plus gros marché, confier les mémoires à l'intercontrat, baisser le prix ou la séniorité de l'équipe, baisser encore après des rejets. Quand la technique pèse 60 %, chacun de ces gestes coûte plus de marge qu'il ne rapporte de points.${
            t.glissement
              ? " Une mission facturable privée de ses gens a fini par glisser, et ses pénalités sont venues s'ajouter."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    COUT_EN_KE,
    "de coût d'avant-vente par marché gagné l'an dernier",
    "k€",
    { juste: 1, proche: 3 },
    (e) => `${nombre(e)} k€`,
  );

  const choisi = p.chemin[D.selection] === 1;
  const concentre = p.chemin[D.redaction] === 1;
  const parMarche = t.gagnes ? t.coutReponses / t.gagnes : null;
  const tauxTexte = t.resultats
    ? `${t.gagnes} marché${t.gagnes >= 2 ? "s" : ""} gagné${t.gagnes >= 2 ? "s" : ""} sur ${t.resultats} résultats, soit ${taux(t.transformation, 0)} de transformation (${taux(TRANSFORMATION_AN_DERNIER, 0)} l'an dernier)`
    : "aucun résultat connu";
  const coutTexte =
    parMarche !== null
      ? `chaque marché gagné a coûté ${kE(parMarche)} d'avant-vente, contre ${kE(COUT_D_UN_MARCHE_GAGNE)} l'an dernier`
      : `${kE(t.coutReponses)} de réponses, sans un marché gagné`;
  const concentration: Constat = {
    score: choisi && concentre ? 1 : choisi || concentre ? 0.6 : 0,
    texte:
      choisi && concentre
        ? `Vous avez choisi vos appels d'offres, puis mis vos seniors sur chacun : ${tauxTexte} ; ${coutTexte}.`
        : choisi
          ? `Vous avez choisi vos appels d'offres, mais sans y mettre vos seniors : un bon dossier mal écrit se perd sur la note technique. Bilan : ${tauxTexte} ; ${coutTexte}.`
          : concentre
            ? `Vous avez mis vos seniors au pilotage, mais sur trop de réponses : leur temps s'est dispersé, ou a été pris aux missions facturables. Bilan : ${tauxTexte} ; ${coutTexte}.`
            : `Vous n'avez ni choisi vos appels d'offres, ni mis vos seniors sur ceux qui comptaient : ${tauxTexte} ; ${coutTexte}.`,
  };

  return [information, diagnostic, reflexe, calibrage, concentration];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  concentration,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Regarder ce que coûtent vos réponses",
      texte:
        "Rejouez l'épisode en ouvrant d'abord le bilan de l'an dernier et les rapports d'analyse : chaque marché gagné avait coûté plus de 25 k€ d'avant-vente, et les marchés se perdaient sur la note technique, pas sur le prix.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Choisir ses appels d'offres plutôt que faire du volume",
      texte:
        "Une réponse coûte à coup sûr, un marché ne rapporte que s'il est gagné. Passez chaque consultation à la grille go / no-go (des références, un client qui vous connaît, un besoin vu en amont) et ne baissez pas un prix qui ne pèse que 40 % de la note.",
    };
  }
  if (concentration!.score === 0) {
    return {
      titre: "Mettre ses meilleures forces sur peu de réponses",
      texte:
        "Le temps des seniors est la ressource rare d'un cabinet. Peu de réponses, chacune pilotée par un manager ou un associé, gagnent plus que beaucoup de mémoires types : la note technique se fait avec une méthodologie écrite pour le client et une équipe nommée.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Voir la dilution derrière le volume",
      texte:
        "Quand le taux de transformation tombe, regardez ce que chaque réponse a reçu de temps de seniors avant d'accuser le prix ou les sortants : au-delà de six réponses de front, chaque mémoire de plus abîme tous les autres.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du coût d'un marché gagné",
      texte:
        "Valorisez les jours d'avant-vente à leur coût, seniors et consultants séparément, et divisez par les marchés gagnés, pas par les réponses : c'est ce que coûte vraiment un marché, et ce que la marge d'un marché doit couvrir.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

/** Le texte d'un imprévu, avec le marché qu'il vise. */
function texteDImprevu({ imprevu, marche: id }: ImprevuTire): string {
  if (imprevu.effet.sansSuite) {
    const m = id ? marche(id) : null;
    return m
      ? `${m.acheteur} déclare sa consultation sans suite : le besoin est redéfini, elle sera relancée à l'automne. Les candidats en sont pour leurs frais.`
      : "Un acheteur déclare sa consultation sans suite.";
  }
  if (imprevu.effet.rectificatif) {
    const m = id ? marche(id) : null;
    return m
      ? `${m.acheteur} publie un avis rectificatif : le cahier des charges ajoute une phase, la date de remise ne bouge pas. Si nous répondons, une partie du mémoire est à reprendre.`
      : "Un acheteur publie un avis rectificatif.";
  }
  return imprevu.texte;
}

/** Le message d'attribution d'un marché, tel que l'acheteur le notifie. */
function notification(x: Trimestre["issues"][number]): Message {
  const m = marche(x.id);
  const n = x.notation;
  const surT = Math.round(100 * m.technique);
  const surP = 100 - surT;
  const notes = `technique ${nombre(n.technique)} sur ${surT}, prix ${nombre(n.prix)} sur ${surP}`;
  const leurs = `${nombre(n.techniqueConcurrent)} et ${nombre(n.prixConcurrent)}`;
  return {
    ...STERENN,
    heure: `sem. ${m.attribution}`,
    alerte: x.etat === "perdu",
    texte:
      x.etat === "gagne"
        ? `${m.court} : marché attribué à Atlas Conseil. Nos notes : ${notes} ; ${m.concurrent}, deuxième : ${leurs}. Marge du marché sur sa durée : ${kE(x.marge)}.`
        : `${m.court} : marché attribué à ${m.concurrent}. Nos notes : ${notes} ; les siennes : ${leurs}.`,
  };
}

export const EPISODE_GO_NO_GO: Episode<Trimestre> = {
  code: "appels-d-offres-en-rafale",
  numero: 64,
  domaine: "Choisir où répondre",
  titre: "Les appels d'offres en rafale",
  resume:
    "Douze appels d'offres publics en six semaines, et une équipe qui ne peut pas tous les faire bien. Choisir où répondre, puis y mettre ses meilleures forces.",
  persona:
    "Vous êtes Florimond Vannier, associé d'Atlas Conseil, responsable de la practice Organisation et transformation au bureau de Rennes : des collectivités, des hôpitaux, des organismes publics, presque tous par marchés publics. Votre équipe : un directeur de mission, deux managers et quatorze consultants, dont sept en intercontrat. De janvier à mars, les budgets publics votés, les consultations tombent en rafale.",
  mandat: [
    { fort: kE(OBJECTIF), texte: "de marge nette attendue des marchés publics du trimestre" },
    { fort: "12", texte: "appels d'offres annoncés en six semaines" },
    {
      fort: `${CAPACITE.senior} jours`,
      texte: "de temps commercial pour les quatre seniors d'ici la semaine 11",
    },
    {
      fort: taux(TRANSFORMATION_AN_DERNIER, 0),
      texte: "de taux de transformation sur les marchés publics l'an dernier",
    },
  ],
  jugement:
    "Le comité de direction juge le trimestre sur la marge nette des marchés publics : la marge des marchés gagnés sur toute leur durée, au prix proposé, moins le coût des réponses (jours d'avant-vente, jours pris aux missions facturables, indépendants, pénalités).",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre practice",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les dossiers de consultation attendent sans pilote : la date des questions écrites passe, et le travail sera à reprendre.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...STERENN,
        alerte: true,
        texte: `Pendant que la liste attendait, deux dossiers sont restés sans pilote et la date limite des questions écrites est passée : ${euros(perdu)} de travail à reprendre.`,
      };
    },
  },
  prevision: {
    libelle:
      "ce qu'a coûté en avant-vente chaque marché gagné l'an dernier, en milliers d'euros (jours valorisés au coût journalier)",
    unite: "k€",
    placeholder: "10",
    min: 0,
    max: 200,
    step: 0.1,
    reel: () => COUT_EN_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge nette des marchés",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `marchés gagnés, moins le coût des réponses ; objectif ${kE(OBJECTIF)}`
          : `objectif ${kE(OBJECTIF)} sur le trimestre`,
    },
    {
      cle: "gagnes",
      nom: "Marchés gagnés",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `${nombre(l.resultats ?? 0, 0)} résultat${(l.resultats ?? 0) >= 2 ? "s" : ""} connu${(l.resultats ?? 0) >= 2 ? "s" : ""}, ${nombre(l.nbReponses ?? 0, 0)} réponses prévues`
          : "aucune réponse remise",
    },
    {
      cle: "transformation",
      nom: "Taux de transformation",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => `l'an dernier : ${taux(TRANSFORMATION_AN_DERNIER, 0)}`,
    },
    {
      cle: "seniors",
      nom: "Jours de seniors en avant-vente",
      format: (v) => `${nombre(v)} j`,
      sensBon: -1,
      aide: () => `temps commercial : ${CAPACITE.senior} jours d'ici la semaine 11`,
      jauge: (l) =>
        l.seniors !== null && l.resteSenior !== null
          ? {
              part: Math.min(1, (l.seniors ?? 0) / CAPACITE.senior),
              enRetard: (l.resteSenior ?? 0) < 0,
            }
          : null,
    },
    {
      cle: "facturables",
      nom: "Jours pris aux missions facturables",
      format: (v) => `${nombre(v)} j`,
      sensBon: -1,
      aide: () => "au-delà du temps commercial et de l'intercontrat",
    },
  ],
  contexte(l, decisions): Contexte {
    const d1 = decisions[D.selection] ?? NEUTRE[D.selection];
    const d2 = decisions[D.metropole];
    const retenues = SELECTIONS[d1]!.length;
    const restantes = restantesDe(d1);
    const perdus = l.perdus ?? 0;
    const resultats = l.resultats ?? 0;
    const gagnes = l.gagnes ?? 0;
    const engage = Math.max(0, (l.seniorsPrevus ?? 0) - (l.seniors ?? 0));
    const ecartT = l.ecartTechnique ?? 0;
    const ecartP = l.ecartPrix ?? 0;
    return {
      metropoleRetenue: d1 !== 1,
      nbRetenues: retenues,
      nbReponses: nombre(l.nbReponses ?? 0, 0),
      pilotage: retenues * JOURS.pilote.senior,
      metropole:
        d2 === 0
          ? `, plus ${JOURS.fond.senior} pour la Métropole`
          : d2 === 2
            ? `, plus ${JOURS.type.senior} pour le mémoire type de la Métropole`
            : "",
      resteSenior: jours(l.resteSenior ?? 0),
      engage: jours(engage),
      amont: d2 === 1,
      perdus,
      perdusTexte: `${perdus} marché${perdus >= 2 ? "s" : ""} perdu${perdus >= 2 ? "s" : ""}`,
      moinsChers: fois(l.moinsChers ?? 0),
      ecartTechnique:
        ecartT < 0 ? `inférieure de ${points(-ecartT)}` : `supérieure de ${points(ecartT)}`,
      ecartPrix:
        ecartP < 0 ? `inférieure de ${points(-ecartP)}` : `supérieure de ${points(ecartP)}`,
      bilanDesResultats: resultats
        ? `${gagnes} marché${gagnes >= 2 ? "s" : ""} gagné${gagnes >= 2 ? "s" : ""} sur ${resultats}`
        : "aucun résultat encore",
      nbRestantes: restantes.length,
      restantes: restantes.length
        ? `Il reste ${restantes.length} réponse${restantes.length >= 2 ? "s" : ""} à remettre en semaine 11 : ${restantes.map((m) => m.court).join(", ")}.`
        : "Il ne reste aucune réponse à remettre en semaine 11.",
      restantesDetail: restantes
        .map((m) => `${m.court} : ${kE(m.montant)}, ${m.concurrent} en face.`)
        .join(" "),
      marge: kE(l.marge ?? 0),
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const cout = semaines.reduce((x, w) => x + w.cout, 0);
    const avant = de > 1 ? t.semaines[de - 1]!.gagnes : 0;
    return [
      [`Marge nette, sem. ${a}`, kE(t.semaines[a]!.marge)],
      ["Marchés gagnés sur la période", nombre(t.semaines[a]!.gagnes - avant, 0)],
      ["Coût des réponses sur la période", kE(cout)],
    ];
  },
  courbe: {
    titre: "Marge nette des marchés, semaine par semaine",
    cle: "marge",
    cible: OBJECTIF,
    libelleCible: `objectif : ${kE(OBJECTIF)}`,
    graduations: [-100000, 0, 100000, 200000, 300000, 400000, 500000],
    format: kE,
    details: (s) => [
      `marge nette ${kE(s.marge!)} · ${kE(s.cout!)} de réponses dans la semaine`,
      `${nombre(s.gagnes!, 0)} gagné${s.gagnes! >= 2 ? "s" : ""} sur ${nombre(s.resultats!, 0)} résultat${s.resultats! >= 2 ? "s" : ""} · ${nombre(s.facturables!)} j pris aux missions`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.metropole && choix === 3) {
      // L'acheteur répond selon le hasard du trimestre, à tous les candidats.
      const elargi = critereElargi(graine);
      return [
        {
          de: "Vilaine Métropole",
          role: "Profil d'acheteur",
          texte: elargi ? REPONSES.elargi : REPONSES.maintenu,
        },
        {
          ...STERENN,
          texte: elargi
            ? "Le critère est élargi : nos mutualisations comptent. On répond à fond, Katell pilote."
            : "Rien ne change : on décline, comme prévu.",
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const dans = (w: number) => w >= de && w <= a;
    const lies: Message[] = [];
    if (chemin[D.metropole] === 1 && dans(4)) {
      lies.push({ ...KONAN, heure: "sem. 4", texte: REPONSES.rendezVous });
    }
    for (const x of arrive.attributions) {
      if (x.etat !== "sansSuite") lies.push(notification(x));
    }
    if (arrive.glissement) {
      lies.push({
        ...OANEZ,
        heure: `sem. ${GLISSEMENT.semaine}`,
        alerte: true,
        texte: REPONSES.glissement,
      });
    }
    if (t.refere && dans(12)) {
      lies.push({
        de: "Prune Lecoeur",
        role: "Contrôleuse de gestion",
        heure: "sem. 12",
        texte: REPONSES.refere,
      });
    }
    const imprevus = arrive.imprevus.map((i) => ({
      de: i.imprevu.de,
      role: i.imprevu.role,
      heure: `sem. ${i.semaine}`,
      texte: texteDImprevu(i),
    }));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de marge nette sur les marchés du trimestre`
        : `${kE(-t.objectif)} de pertes sur les marchés du trimestre`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge nette des marchés publics du trimestre : la marge des marchés gagnés sur leur durée, moins le coût des réponses, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const parMarche = t.gagnes ? t.coutReponses / t.gagnes : null;
      return [
        {
          nom: "Marge nette",
          valeur: kE(t.objectif),
          aide: `objectif ${kE(OBJECTIF)}`,
          tenu: t.objectif >= OBJECTIF,
        },
        {
          nom: "Taux de transformation",
          valeur: t.resultats ? taux(t.transformation, 0) : "aucun résultat",
          aide: `${t.gagnes} gagné${t.gagnes >= 2 ? "s" : ""} sur ${t.resultats} ; ${taux(TRANSFORMATION_AN_DERNIER, 0)} l'an dernier`,
          tenu: t.resultats > 0 && t.transformation >= 1 / 3,
        },
        {
          nom: "Avant-vente par marché gagné",
          valeur: parMarche !== null ? kE(parMarche) : "aucun marché",
          aide: `${kE(t.coutReponses)} de réponses ; ${kE(COUT_D_UN_MARCHE_GAGNE)} l'an dernier`,
          tenu: parMarche !== null && parMarche < COUT_D_UN_MARCHE_GAGNE,
        },
        {
          nom: "Missions facturables",
          valeur: `${nombre(t.joursFacturables)} j pris`,
          aide: t.glissement
            ? "une mission a glissé : pénalités de retard"
            : "au-delà du temps commercial et de l'intercontrat",
          tenu: t.joursFacturables < 1 && !t.glissement,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const niveau =
        h.niveau > 0.5
          ? "plus forte que d'habitude : les autres cabinets ont soigné leurs mémoires"
          : h.niveau < -0.5
            ? "moins forte que d'habitude : plusieurs cabinets ont répondu à la hâte"
            : "à son niveau habituel";
      const noms = (etat: string) =>
        t.issues
          .filter((x) => x.etat === etat)
          .map((x) => marche(x.id).court)
          .join(", ");
      const resultats = [
        noms("gagne") ? `gagnés : ${noms("gagne")}` : "aucun marché gagné",
        noms("perdu") ? `perdus : ${noms("perdu")}` : null,
        noms("sansSuite") ? `sans suite : ${noms("sansSuite")}` : null,
      ]
        .filter(Boolean)
        .join(" ; ");
      return [
        ...h.imprevus.map((i) => ({
          titre: `Semaine ${i.semaine}, ${i.imprevu.titre.toLowerCase()}`,
          texte: texteDImprevu(i),
        })),
        { titre: "La concurrence", texte: `Ce trimestre, elle a été ${niveau}.` },
        {
          titre: "Halden à Kermelin",
          texte: haldenAgressif(graine)
            ? "a cassé ses prix : 15 % sous les nôtres."
            : "est resté près de nos prix, à 3 % près.",
        },
        ...(t.chemin[D.metropole] === 3
          ? [
              {
                titre: "La question écrite à la Métropole",
                texte: t.elargi
                  ? "a fait élargir le critère des références."
                  : "n'a rien changé : le critère est resté taillé pour Kéroual.",
              },
            ]
          : []),
        { titre: "Vos réponses", texte: `${resultats}.` },
        {
          titre: "Les missions facturables",
          texte: t.glissement
            ? "Une mission privée de ses gens a glissé : 15 000 € de pénalités et de jours rattrapés."
            : t.joursFacturables >= 1
              ? `${nombre(t.joursFacturables)} jours pris aux missions, sans que l'une d'elles glisse cette fois.`
              : "Aucun jour pris aux missions facturables.",
        },
        {
          titre: "La marge du trimestre",
          texte: `${kE(t.margeGagnee)} de marge sur les marchés gagnés, ${kES(-t.coutReponses)} de réponses.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
