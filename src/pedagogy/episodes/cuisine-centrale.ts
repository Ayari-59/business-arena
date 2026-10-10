/**
 * ÉPISODE 59 — LA CUISINE CENTRALE QU'ON N'ATTENDAIT PAS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de Théo montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de
 * lui.
 *
 * La courbe suit l'économie de chaque semaine face aux frais fixes du
 * laboratoire : tant qu'elle reste sous la ligne, le laboratoire coûte plus
 * qu'il ne rapporte, quoi que dise le dossier.
 */
import {
  D,
  ECONOMIE_PREVUE,
  FRAIS_FIXES_SEMAINE,
  JOURS_SANS_PERTE,
  NEUTRE,
  NOTE_DEPART,
  PERTE_PAR_JOUR,
  evenements,
  hasard,
  reportAccepte,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/cuisine-centrale";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/cuisine-centrale";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +5 k€ », « −83 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
/** Une note d'avis : « 4,46/5 ». */
const note = (v: number) => `${nombre(v, 2)}/5`;
/** L'économie annuelle prévue, en k€ : ce que la prévision de la semaine 1 demande. */
export const ECONOMIE_PREVUE_EN_KE = ECONOMIE_PREVUE / 1000;

const SERAPHIN = {
  de: "Séraphin Mermillod",
  role: "Chef de cuisine, La Table d'Augustin Annecy",
} as const;
const KADIATOU = { de: "Kadiatou Sidibé", role: "Contrôleuse de gestion restauration" } as const;
const ISALINE = {
  de: "Isaline Perraud",
  role: "Directrice générale du Groupe Escale",
} as const;

/** Ce que les décisions révèlent, dans l'ordre où un directeur de la restauration les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui disaient ce que le laboratoire rapporte et ce que les clients voient",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    identite:
      "Votre diagnostic de la semaine 1 était juste : le laboratoire ne rapportait que ce que les cuisines lui commandaient, et il fallait y mettre ce que les clients ne voient pas, pas ce qui fait chaque Table.",
    logistique:
      "En semaine 1, vous avez vu le risque logistique : une vraie partie du problème, que le pilote révélait, mais pas la principale. Un laboratoire qui livre à l'heure et au froid n'économise rien sur ce que les chefs refont.",
    resistance:
      "En semaine 1, vous avez vu des chefs qui résistent par principe ; ils acceptaient les fonds et les pâtes, et refusaient ce que leurs clients viennent chercher.",
    dossier:
      "En semaine 1, vous avez jugé le dossier trop optimiste ; ses chiffres tenaient, frais fixes déduits, pourvu que les cuisines commandent vraiment.",
  };
  const justes = ["identite", "logistique"];
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
    score: d === "identite" ? 1 : d === "logistique" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais imposé la bascule parce que le comité l'avait décidée : ni tout le périmètre d'un coup, ni la date fixe pour les cinq Tables, ni l'interdiction de refaire, ni les desserts signatures."
        : `Vous avez choisi ${n} fois d'imposer parce que la direction l'avait décidé : tout le périmètre, la date fixe, l'interdiction de refaire sur place, la suite sans correction, les desserts signatures. Ce qu'on impose aux cuisines, elles le refont à côté.${
            t.ignacePart ? " Séraphin Mermillod a fini par partir." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    ECONOMIE_PREVUE_EN_KE,
    "d'économie annuelle du laboratoire, tout le périmètre passé et frais fixes déduits",
    "k€",
    { juste: 5, proche: 20 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const perimetre = p.chemin[D.perimetre] === 1;
  const pilote = p.chemin[D.bascule] === 1;
  const relais = p.chemin[D.generalisation] === 1;
  const points = (perimetre ? 1 : 0) + (pilote ? 1 : 0) + (relais ? 1 : 0);
  const mutualisation: Constat = {
    score: points === 3 ? 1 : points === 2 ? 0.6 : 0,
    texte: [
      perimetre
        ? "Vous avez arrêté le périmètre avec les chefs : les bases au laboratoire, l'identité de chaque Table en cuisine."
        : p.chemin[D.perimetre] === 0
          ? `Vous avez mis au laboratoire ce que les clients viennent chercher : les desserts signatures${
              t.signaturesRendues
                ? ", jusqu'à ce que les dégustations les rendent aux cuisines"
                : ""
            }.`
          : "Vous n'avez pas arrêté de périmètre avec les chefs : le laboratoire a tourné bien en dessous de ce qu'il pouvait économiser.",
      pilote
        ? "Vous avez commencé par deux Tables proches, en basse saison, et leurs relevés ont dit quoi corriger."
        : "Vous n'avez pas commencé par un pilote là où il coûtait le moins.",
      relais
        ? "Les chefs déjà passés ont porté la suite dans les autres cuisines."
        : "La suite n'a pas été portée par des chefs qui l'avaient vécue.",
    ].join(" "),
  };

  return [information, diagnostic, reflexe, calibrage, mutualisation];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  mutualisation,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer ce que le laboratoire rapporte vraiment",
      texte:
        "Rejouez l'épisode en reprenant d'abord le dossier et les avis clients : l'économie ne tient que frais fixes déduits et sur ce que les cuisines commandent, et les clients ne voient que les desserts.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Conduire la mutualisation avec ceux qui la vivent",
      texte:
        "Une décision du comité ne fait pas commander une cuisine. Choisissez avec les chefs ce qui se mutualise, commencez là où le risque est faible, mesurez la qualité, et laissez ceux qui l'ont vécu porter la suite.",
    };
  }
  if (mutualisation!.score === 0) {
    return {
      titre: "Mutualiser ce qui ne se voit pas",
      texte:
        "Les fonds, les pâtes, les crèmes et le pain du midi se mutualisent sans que personne ne le remarque ; le dressage et les desserts signatures font la Table. C'est là que passe la frontière du laboratoire.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher ce qui fait commander une cuisine",
      texte:
        "Un laboratoire bien livré peut encore ne rien économiser : ce qui compte, c'est ce que les chefs utilisent. Demandez-vous ce qu'ils refuseront, et pourquoi.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du dossier",
      texte:
        "Posez-le famille par famille : ce qu'elle coûte en cuisine moins ce qu'elle coûte au laboratoire, puis retirez les frais fixes du laboratoire, que le chiffre présenté au comité oubliait.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_CUISINE_CENTRALE: Episode<Trimestre> = {
  code: "cuisine-centrale",
  numero: 61,
  domaine: "Mutualiser la production",
  titre: "La cuisine centrale qu'on n'attendait pas",
  resume:
    "Un laboratoire doit produire les fonds, les pains et la pâtisserie de cinq restaurants dont les chefs craignent de perdre leur cuisine. Mutualiser ce qui ne se voit pas, avec ceux qui le vivent.",
  persona:
    "Vous êtes Théo Garrigues, directeur de la restauration du Groupe Escale, à Annecy : cinq Tables d'Augustin (Annecy, Chambéry, Aix-les-Bains, Évian, Megève), leurs cinq chefs, et le nouveau laboratoire de production de Seynod, sa brigade de cinq personnes et son camion. De janvier à mars, la basse saison partout sauf à Megève, vous devez y faire passer la production avant le printemps.",
  mandat: [
    { fort: "264 k€", texte: "d'économie par an promis par le dossier, frais fixes déduits" },
    { fort: "5 Tables", texte: "à servir depuis Seynod, dont Megève en pleine saison" },
    { fort: "4,46/5", texte: "de note moyenne des avis, à ne pas perdre" },
    { fort: "1 000 €", texte: "de frais fixes du laboratoire par semaine, qu'il produise ou non" },
  ],
  jugement:
    "La direction juge le trimestre sur l'économie nette du laboratoire : achats, heures et pertes économisés, moins ses frais fixes, ce que coûtent les produits livrés puis refaits, les incidents de livraison, les couverts qu'une note en baisse fait perdre et le départ d'un chef.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre laboratoire",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps. Au-delà de deux jours d'enquête, la brigade du laboratoire produit des essais sans débouché, qui partent en repas du personnel ou à la poubelle.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Swann Joubertin",
        role: "Responsable du laboratoire de Seynod",
        alerte: true,
        texte: `Pendant ce temps, la brigade a produit pour personne : ${euros(perdu)} de matière et d'heures sans débouché.`,
      };
    },
  },
  prevision: {
    libelle:
      "l'économie annuelle du laboratoire si tout le périmètre prévu y passe, frais fixes déduits, en k€",
    unite: "k€",
    placeholder: "250",
    min: 0,
    max: 1000,
    step: 1,
    reel: () => ECONOMIE_PREVUE_EN_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "economie",
      nom: "Économie nette",
      format: kES,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "depuis janvier, frais fixes, incidents et qualité compris"
          : "le laboratoire coûte 1 000 € par semaine avant de rien livrer",
    },
    {
      cle: "couverture",
      nom: "Frais fixes couverts",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: 1,
      aide: () => "l'économie des cuisines rapportée aux frais fixes du laboratoire",
      jauge: (l) =>
        l.couverture === null || l.couverture === undefined
          ? null
          : { part: Math.min(1, Math.max(0, l.couverture)), enRetard: l.couverture < 1 },
    },
    {
      cle: "refaits",
      nom: "Produits refaits sur place",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: -1,
      aide: (_, l) =>
        (l.servis ?? 0) > 0
          ? `dans les ${l.servis} Table${(l.servis ?? 0) > 1 ? "s" : ""} servies par le laboratoire`
          : "aucune Table n'est encore servie",
    },
    {
      cle: "note",
      nom: "Note des avis",
      format: note,
      formatEcart: (v) => `${nombre(v, 2)} pt`,
      sensBon: 1,
      aide: () => `moyenne des cinq Tables ; ${note(NOTE_DEPART)} en janvier`,
    },
    {
      cle: "incidents",
      nom: "Incidents de livraison",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? "retards, ruptures, bacs hors température, depuis janvier"
          : "pas encore de livraison",
    },
  ],
  contexte(l, decisions) {
    const servis = l.servis ?? 0;
    return {
      economie: kES(l.economie ?? 0),
      couverture: taux(l.couverture ?? 0, 0),
      refaits: taux(l.refaits ?? 0, 0),
      note: note(l.note ?? NOTE_DEPART),
      incidents: nombre(l.incidents ?? 0, 0),
      servis,
      aucuneServie: servis === 0,
      toutesServies: servis >= 5,
      evianServie: decisions[D.bascule] === 0 || decisions[D.bascule] === 2,
      pilote: decisions[D.bascule] === 1 || decisions[D.bascule] === 2,
      piloteProche: decisions[D.bascule] === 1,
      signatures: decisions[D.perimetre] === 0 && decisions[D.qualite] !== 0,
      ignaceParti: l.ignaceParti === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const nette = semaines.reduce((x, w) => x + w.nette, 0);
    return [
      ["Économie nette de la période", kES(nette)],
      [`Produits refaits, sem. ${a}`, taux(t.semaines[a]!.refaits, 0)],
      [`Note des avis, sem. ${a}`, note(t.semaines[a]!.note)],
    ];
  },
  courbe: {
    titre: "Économie de la semaine, face aux frais fixes du laboratoire",
    cle: "brute",
    cible: FRAIS_FIXES_SEMAINE,
    libelleCible: `frais fixes du laboratoire : ${euros(FRAIS_FIXES_SEMAINE)} par semaine`,
    graduations: [-2000, 0, 2000, 4000, 6000, 8000],
    format: (v) => `${nombre(v / 1000, 0)} k€`,
    details: (s) => [
      `économie ${euros(s.brute!)} · ${s.servis} Table${s.servis! > 1 ? "s" : ""} servie${s.servis! > 1 ? "s" : ""}`,
      `refaits ${taux(s.refaits!, 0)} · note ${note(s.note!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.generalisation && choix === 3) {
      // Seul le choix de demander compte : le comité répond selon le hasard du trimestre.
      const accepte = reportAccepte([...NEUTRE.slice(0, D.generalisation), 3], graine);
      return [{ ...ISALINE, texte: accepte ? REPONSES.reportAccepte : REPONSES.reportRefuse }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.signaturesRendues) {
      lies.push({ ...KADIATOU, heure: "sem. 8", texte: REPONSES.signaturesRendues });
    }
    if (arrive.ignacePart && t.annonceIgnace !== null) {
      lies.push({
        ...SERAPHIN,
        heure: `sem. ${t.annonceIgnace}`,
        alerte: true,
        texte:
          t.annonceIgnace <= 9
            ? REPONSES.ignaceHiver
            : chemin[D.suite] === 0
              ? REPONSES.ignaceDesserts
              : REPONSES.ignaceTard,
      });
    }
    if (arrive.incidents > 0) {
      lies.push({
        de: "Teodor Ionescu",
        role: "Chauffeur-livreur, laboratoire de Seynod",
        heure: `sem. ${de}-${a}`,
        texte:
          arrive.incidents === 1
            ? "Un incident de livraison sur la période : un retard ou un bac hors température, refusé à réception."
            : `${arrive.incidents} incidents de livraison sur la période : retards, ruptures, bacs hors température refusés à réception.`,
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
      t.objectif >= 0
        ? `${kES(t.objectif)} d'économie nette : le laboratoire a payé ses frais fixes`
        : `${kE(t.objectif)} : le laboratoire a coûté plus qu'il n'a économisé`,
    formatObjectif: kES,
    noteDesBarres:
      "Économie nette du laboratoire sur le trimestre — achats, heures et pertes économisés, moins les frais fixes, les produits livrés puis refaits, les incidents, la qualité perdue et les départs —, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Économie nette",
          valeur: kES(t.objectif),
          aide: "sur le trimestre ; le laboratoire doit au moins payer ses frais fixes",
          tenu: t.objectif >= 0,
        },
        {
          nom: "Produits refaits sur place",
          valeur: taux(t.refaitsFinal, 0),
          aide: "en semaine 13 ; repère : 15 % au plus",
          tenu: t.servis > 0 && t.refaitsFinal <= 0.15,
        },
        {
          nom: "Note des avis",
          valeur: note(t.noteFinale),
          aide: `en semaine 13 ; ${note(t.noteDepart)} en janvier`,
          tenu: t.noteFinale >= t.noteDepart - 0.05,
        },
        {
          nom: "Les chefs",
          valeur: t.ignacePart ? "4 sur 5" : "5 sur 5",
          aide: t.ignacePart ? "Séraphin Mermillod est parti" : "les cinq chefs sont restés",
          tenu: !t.ignacePart,
        },
      ];
    },
    hasard(t, graine) {
      return [
        ...hasard(graine).imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Les livraisons",
          texte:
            t.incidents === 0
              ? "aucun incident de livraison."
              : `${t.incidents} incident${t.incidents > 1 ? "s" : ""} de livraison${
                  t.graves
                    ? `, dont ${t.graves} grave${t.graves > 1 ? "s" : ""} (un lot servi hors température, la Table fermée pour contrôle)`
                    : ""
                }.`,
        },
        ...(t.reportAccepte === null
          ? []
          : [
              {
                titre: "Le comité",
                texte: t.reportAccepte
                  ? "a accepté de reporter la suite après la saison."
                  : "a refusé le report : les Tables restantes ont basculé en semaine 9, commandes imposées.",
              },
            ]),
        {
          titre: "Les chefs",
          texte: t.ignacePart
            ? `Séraphin Mermillod a annoncé son départ en semaine ${t.annonceIgnace}.`
            : "les cinq chefs sont restés.",
        },
      ];
    },
  },
  comportements,
  axe,
};
