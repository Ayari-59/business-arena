/**
 * ÉPISODE 108 — L'OFFRE DE RACHAT, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le dossier de cession de Yannig montre, ce que la
 * courbe trace, ce sur quoi le conseil le juge, et ce que ses décisions
 * révèlent de lui.
 *
 * Une cession se juge sur ce que la famille obtient pour ses titres ; le
 * trimestre ne dure que treize semaines. Le tableau de bord suit donc la
 * VALEUR POUR LES ACTIONNAIRES, estimée chaque semaine : le prix de la vente
 * en cours, conditions et engagements compris, ou la valeur de la laiterie
 * indépendante, recalculée avec ce que le trimestre apprend (offres, audit,
 * marché laitier, vote des producteurs).
 */
import {
  D,
  DETTE_NETTE,
  EBE,
  EFFET,
  JOURS_SANS_PERTE,
  NEUTRE,
  NORDAL,
  OBJECTIF_VALEUR,
  OFFRE,
  OP,
  PERTE_PAR_JOUR,
  POINTS_FAIBLES,
  REVELE,
  SCENARIOS,
  STRUCTURE,
  SURCOUT_SPOT_ANNUEL,
  TITRES_INDEPENDANTE,
  VE_COMPARABLES,
  VE_INDEPENDANTE,
  complementEBEAttendu,
  derouler,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/offre-de-rachat";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/offre-de-rachat";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, nombre } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Des millions d'euros, au dixième : « 97,5 M€ », « −1,2 M€ ». */
export const mE = (v: number) =>
  `${v < -0.5e5 ? "−" : ""}${Math.abs(v / 1e6).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} M€`;
/** Un montant signé : « +1,2 M€ ». */
const mES = (v: number) => (v >= 0.5e5 ? `+${mE(v)}` : mE(v));
const fois = (m: number) => `${nombre(m, 2)} fois l'EBE`;

const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const SIEBE = { de: "Siebe Hoekstra", role: "Directeur des acquisitions, Groupe Nordal" } as const;
const NICODEME = {
  de: "Nicodème Trébaol",
  role: "Président de la coopérative laitière Kérouval",
} as const;
const KONOGAN = { de: "Konogan Kerguéris", role: "Président de l'OP Lait du Méné" } as const;
const ERMENGARDE = {
  de: "Maître Ermengarde Albiach",
  role: "Avocate d'affaires de la laiterie",
} as const;
const NAIM = { de: "Naïm Lefeuvre", role: "Directeur des grands comptes et des MDD" } as const;

const qui = (coop: boolean) => (coop ? NICODEME : SIEBE);
const nomDe = (coop: boolean) => (coop ? "la coopérative Kérouval" : "Nordal");
const majuscule = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const minuscule = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);

/** Ce que l'audit a trouvé, dit comme un rapport le dirait. */
function pointsTrouves(ligne: boolean, station: boolean): string {
  const p: string[] = [];
  if (ligne) {
    p.push(
      `le stérilisateur de la ligne UHT n°2 de Pontivy est à remplacer sous deux ans (${mE(POINTS_FAIBLES.ligne.cout)})`,
    );
  }
  if (station) {
    p.push(
      `la station d'épuration de Loudéac doit être mise aux normes (${mE(POINTS_FAIBLES.station.cout)})`,
    );
  }
  return p.join(" ; ");
}

/** La VE au multiple des comparables : ce que la prévision de la semaine 1 demande, en M€. */
export const PREVISION_COMPARABLES = VE_COMPARABLES / 1e6;

/** Ce que les décisions révèlent, dans l'ordre où un directeur général les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de situer l'offre : les comparables et le plan réaliste",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    "trois-reperes":
      "Votre diagnostic de la semaine 1 était juste : une offre se juge contre la valeur de la laiterie indépendante, contre ce que d'autres paieraient, et sur ses conditions.",
    "sous-le-marche":
      "En semaine 1, vous avez vu que l'offre était sous le marché : c'est un repère, pas le seul. Le prix se juge aussi contre la valeur de la laiterie indépendante, et il ne vaut que par ses conditions.",
    fenetre:
      "En semaine 1, vous avez vu une fenêtre à saisir : l'urgence était celle de l'acquéreur. L'offre était au-dessus de la valeur indépendante, mais sous ce que le marché payait.",
    independance:
      "En semaine 1, vous avez vu une indépendance à préserver : l'attachement a un prix, que seul le calcul de la valeur indépendante permet de connaître.",
  };
  const justes = ["trois-reperes", "sous-le-marche"];
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
    score: d === "trois-reperes" ? 1 : d === "sous-le-marche" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez cédé à aucun réflexe du vendeur pressé ou attaché : ni signer avant l'expiration, ni refuser par principe, ni tout ouvrir à un concurrent, ni accepter la baisse pour ne pas perdre l'acquéreur, ni croire au prix affiché, ni signer sans rouvrir ce qui devait l'être."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : signer avant l'expiration ou refuser par principe, tout ouvrir pour aller vite, renoncer au second tour, accepter la baisse demandée, croire au prix affiché, ne rien rouvrir.${
            t.producteursPartent
              ? " Les producteurs du Méné n'ont pas renouvelé, et la clause d'approvisionnement a joué."
              : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    PREVISION_COMPARABLES,
    "de valeur d'entreprise au multiple des transactions comparables",
    "M€",
    { juste: 2, proche: 5 },
    (e) => `${nombre(e, 1)} M€`,
  );

  const d5 = p.chemin[D.structure];
  const d6 = p.chemin[D.producteurs];
  const issue =
    t.voie === 0
      ? " La laiterie est restée indépendante : ces conditions n'ont pas eu à jouer."
      : t.voie === 2
        ? " La coopérative, qui reprenait les contrats des producteurs, a acheté."
        : "";
  let texte: string;
  if (d5 === 0 && d6 === 0) {
    texte = `Vous avez pris le prix affiché pour le prix : un complément indexé sur l'EBE 2027, que le marché laitier et les frais de groupe de l'acquéreur décident, une garantie sans plafond, et aucune garantie écrite pour les producteurs.${
      t.producteursPartent
        ? " Ils sont partis : la clause d'approvisionnement a fait baisser le prix."
        : ""
    }`;
  } else if ((d5 === 1 || d5 === 2) && d6 === 1) {
    texte =
      "Vous avez jugé le prix avec ses conditions : un prix ferme, ou un complément limité sur ce que la laiterie maîtrise, une garantie plafonnée, et les engagements envers les producteurs et les salariés écrits dans l'acte, même au prix d'un peu de valeur.";
  } else if (d6 === 1) {
    texte =
      "Vous avez écrit les garanties des producteurs quand leur menace est apparue, mais accepté un complément de prix sur l'EBE : c'est le vendeur qui porte alors le risque du marché laitier.";
  } else if (d5 === 1 || d5 === 2) {
    texte =
      "Vous avez obtenu un prix solide, mais sans écrire les garanties des producteurs quand leur vote l'a rendu nécessaire : le lait sous contrat fait la valeur d'une laiterie.";
  } else {
    texte =
      "Vous avez négocié une partie des conditions seulement : le prix d'une cession tient autant à sa structure et à ses engagements qu'au multiple.";
  }
  const conditions: Constat = {
    score: d5 === 0 && d6 === 0 ? 0 : (d5 === 1 || d5 === 2) && d6 === 1 ? 1 : 0.6,
    texte: texte + issue,
  };

  return [information, diagnostic, reflexe, calibrage, conditions];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  conditions,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Établir la valeur avant de répondre",
      texte:
        "Rejouez l'épisode en commençant par les transactions comparables et le plan réaliste : sans eux, rien ne dit si 97,5 M€ est un bon prix, ni si garder la laiterie vaut mieux.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni signer dans l'urgence, ni refuser par principe",
      texte:
        "Le délai d'une offre est l'arme de l'acquéreur. Calculez la valeur de la laiterie indépendante, faites exister un second acquéreur sans exclusivité, et ne cédez sur le prix que ce que l'audit chiffre vraiment.",
    };
  }
  if (conditions!.score === 0) {
    return {
      titre: "Juger le prix avec ses conditions",
      texte:
        "Un complément de prix indexé sur ce que l'acquéreur et le marché décident transfère le risque au vendeur ; une garantie sans plafond aussi. Et une laiterie ne vaut que par son lait : les engagements envers les producteurs se négocient avant la signature.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Juger une offre contre trois repères",
      texte:
        "La valeur de l'entreprise indépendante, sur un plan réaliste et actualisé ; ce que d'autres acquéreurs paieraient ; les conditions du prix. Aucun des trois ne suffit seul.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul des comparables",
      texte:
        "Prenez la médiane des multiples, qu'un cas hors norme ne déplace pas, et appliquez-la à l'EBE de la laiterie : c'est le repère que les acquéreurs ont en tête.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? TITRES_INDEPENDANTE : t.semaines[w]!.valeur);

export const EPISODE_OFFRE_RACHAT: Episode<Trimestre> = {
  code: "offre-de-rachat",
  numero: 108,
  domaine: "Évaluer une offre sur l'entreprise",
  titre: "L'offre de rachat",
  resume:
    "Le premier concurrent offre 7,5 fois l'EBE pour toute la laiterie, valable six semaines ; la famille est divisée. Juger l'offre contre la valeur indépendante, le marché et ses conditions.",
  persona:
    "Vous êtes Yannig Le Goaziou, directeur général salarié de la Laiterie de Kerbrélan, entreprise familiale de 520 salariés à Loudéac et Pontivy : 185 M€ de chiffre d'affaires, 240 millions de litres de lait collectés auprès des 310 exploitations de l'OP Lait du Méné. De septembre à novembre, vous conduisez pour le conseil d'administration de la famille Guivarc'h la réponse à l'offre du Groupe Nordal.",
  mandat: [
    { fort: mE(OFFRE), texte: "de valeur d'entreprise offerts par Nordal, 7,5 fois l'EBE" },
    { fort: "6 semaines", texte: "la durée de validité de l'offre" },
    { fort: mE(DETTE_NETTE), texte: "de dette financière nette, reprise par l'acquéreur" },
    {
      fort: mE(OBJECTIF_VALEUR),
      texte: "pour les titres de la famille : ce que le conseil attend au moins",
    },
  ],
  jugement:
    "Le conseil juge votre recommandation sur la valeur obtenue pour les titres de la famille, estimée en semaine 13 : le prix de cession, conditions et engagements compris, ou la valeur de la laiterie si elle reste indépendante, frais engagés déduits.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Le dossier de cession",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le conseil se prépare dans l'urgence : avocats et conseils facturent les nuits.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...IWAN,
        alerte: true,
        texte: `Pour tenir la date du conseil, les avocats et le cabinet ont travaillé de nuit : ${euros(perdu)} d'honoraires en plus.`,
      };
    },
  },
  prevision: {
    libelle:
      "la valeur d'entreprise de la laiterie au multiple d'EBE des transactions comparables, en millions d'euros",
    unite: "M€",
    placeholder: "100",
    min: 0,
    max: 250,
    step: 0.1,
    reel: () => PREVISION_COMPARABLES,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur pour les actionnaires",
      format: mE,
      formatEcart: mES,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? "les titres de la famille, conditions et frais compris"
          : "les titres, si la famille garde la laiterie",
      jauge: (l) => ({
        part: Math.min(1, Math.max(0, (l.valeur ?? 0) / OBJECTIF_VALEUR)),
        enRetard: (l.valeur ?? 0) < OBJECTIF_VALEUR,
      }),
    },
    {
      cle: "offre",
      nom: "Meilleure offre en lice",
      format: mE,
      formatEcart: mES,
      sensBon: 1,
      aide: (_, l) =>
        l.offre ? `valeur d'entreprise ; ${fois(l.offre / EBE)}` : "aucune offre en lice",
    },
    {
      cle: "independante",
      nom: "Valeur de la laiterie indépendante",
      format: mE,
      formatEcart: mES,
      sensBon: 1,
      aide: () => "valeur d'entreprise, plan réaliste actualisé",
    },
    {
      cle: "acquereurs",
      nom: "Acquéreurs en lice",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: () => "Nordal, et un second s'il existe",
    },
    {
      cle: "lait",
      nom: "Lait sous contrat l'an prochain",
      format: (v) => `${nombre(v, 0)} M de litres`,
      sensBon: 1,
      aide: () => "OP Lait du Méné",
    },
  ],
  contexte(l, decisions): Contexte {
    const [d1, d2] = decisions;
    const coop = l.coop ?? null;
    const acquereurCoop = (l.finaleCoop ?? l.retenueCoop) === 1;
    const cout = l.cout ?? 0;
    const demande = l.demande ?? 0;
    const offre = l.offre ?? 0;
    return {
      nordal: l.nordal != null,
      exclusivite: d1 === 0,
      rejet: d1 === 1,
      enchere: d1 === 3,
      sondee: d1 === 2 || d1 === 3,
      auditVendeur: d2 === 1,
      auditRefuse: d2 === 3,
      retraitAudit: l.retraitAudit === 1,
      coop: coop !== null,
      coopMultiple: coop !== null ? nombre(coop, 2) : "",
      coopVE: coop !== null ? mE(coop * EBE) : "",
      nordalSiSuit:
        coop !== null
          ? `${fois(Math.min(NORDAL.plafond, coop + NORDAL.surenchere))}, ${mE(Math.min(NORDAL.plafond, coop + NORDAL.surenchere) * EBE)}`
          : "",
      cout: mE(cout),
      aucunPoint: l.cout != null && cout === 0,
      points: pointsTrouves(l.ligne === 1, l.station === 1),
      vente: l.retenue != null,
      acquereurCoop,
      demande: mE(demande),
      facteurDemande: cout > 0 ? nombre(demande / cout, 1) : "",
      venteFinale: l.finale != null,
      affiche: mE(offre + STRUCTURE.complementEBE - STRUCTURE.abandonEBE),
      ferme4: mE(offre - STRUCTURE.abandonEBE),
      fraisDeGroupe: mE(STRUCTURE.fraisDeGroupe[acquereurCoop ? "coop" : "nordal"]),
      complementAttendu: mE(complementEBEAttendu(acquereurCoop ? "coop" : "nordal")),
      surcoutSpot: mE(SURCOUT_SPOT_ANNUEL),
      independante: mE(l.independante ?? VE_INDEPENDANTE),
      titresIndependante: mE((l.independante ?? VE_INDEPENDANTE) - DETTE_NETTE),
      valeur: mE(l.valeur ?? 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur pour les actionnaires, sem. ${a}`, mE(s.valeur)],
      ["Variation sur la période", mES(s.valeur - valeurA(t, de - 1))],
      [`Meilleure offre en lice, sem. ${a}`, s.offre > 0 ? mE(s.offre) : "aucune"],
    ];
  },
  courbe: {
    titre: "Valeur pour les actionnaires, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${mE(OBJECTIF_VALEUR)} au moins`,
    graduations: [60e6, 70e6, 80e6, 90e6],
    format: mE,
    details: (s) => [
      `valeur ${mE(s.valeur!)} · ${mES(s.variation!)} dans la semaine`,
      `${s.offre ? `meilleure offre ${mE(s.offre)}` : "aucune offre en lice"} · laiterie indépendante ${mE(s.independante!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    const h = hasard(graine);
    if (etape === D.reponse && choix === 3) {
      // Nordal répond à la mise aux enchères selon le hasard du trimestre.
      const part = h.uEnchere < NORDAL.chances.retraitEnchere;
      return [
        {
          ...ERMENGARDE,
          texte: "Le mandat est signé : le dossier part lundi à quinze acquéreurs.",
        },
        { ...SIEBE, texte: part ? REPONSES.enchereRetrait : REPONSES.enchereReste },
      ];
    }
    if (etape === D.producteurs && choix === 2) {
      return [
        {
          ...KONOGAN,
          texte: h.uOP < OP.chancePrime ? REPONSES.primeRefusee : REPONSES.primeAcceptee,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const dr = derouler(chemin, graine);
    const lies: Message[] = [];
    const sem = (w: number) => `sem. ${w}`;

    if (arrive.reponseD3 && chemin[D.reponse] !== 1) {
      const w = sem(EFFET[D.concurrence]);
      const r = dr.retenue;
      switch (dr.reponseD3) {
        case "surenchere":
          lies.push({
            ...SIEBE,
            heure: w,
            alerte: true,
            texte: `Nordal porte son offre à ${fois(r && r.qui === "nordal" ? r.multiple : NORDAL.relance)}, ${mE((r && r.qui === "nordal" ? r.multiple : NORDAL.relance) * EBE)} de valeur d'entreprise, sous réserve de l'audit.`,
          });
          break;
        case "maintien":
          lies.push({
            ...SIEBE,
            heure: w,
            texte: "Nordal maintient son offre à 7,5 fois l'EBE. Nous n'irons pas plus loin.",
          });
          break;
        case "retrait":
          lies.push({
            ...SIEBE,
            heure: w,
            alerte: true,
            texte: "Nous ne participons pas à un processus concurrentiel. Nordal retire son offre.",
          });
          break;
        case "exclusivite":
          lies.push({
            ...SIEBE,
            heure: w,
            texte:
              "Nous avons l'exclusivité : notre offre reste à 7,5 fois l'EBE, sous réserve de l'audit. Il n'y a rien à améliorer.",
          });
          break;
        case "prolonge":
          lies.push({
            ...SIEBE,
            heure: w,
            texte: "Nous prolongeons notre offre de six semaines, au même prix.",
          });
          break;
        case "caduque":
          lies.push({
            ...SIEBE,
            heure: w,
            alerte: true,
            texte: "Notre comité ne prolonge pas : notre offre expire vendredi.",
          });
          break;
        case "expiree":
          lies.push({ ...SIEBE, heure: w, texte: "Notre offre a expiré. Nous en prenons acte." });
          break;
        case "seule-coop":
          lies.push({
            ...NICODEME,
            heure: w,
            texte: "La coopérative confirme son offre, sous réserve d'un audit léger.",
          });
          break;
        default:
          break;
      }
      if (r && (dr.reponseD3 !== "acceptee" || r.qui === "coop")) {
        lies.push({
          ...ERMENGARDE,
          heure: w,
          texte: `Acquéreur pressenti : ${nomDe(r.qui === "coop")}, à ${fois(r.multiple)}, ${mE(r.multiple * EBE)}.${
            dr.rival
              ? ` ${majuscule(nomDe(dr.rival.qui === "coop"))} reste en lice derrière, à ${fois(dr.rival.multiple)}.`
              : ""
          }`,
        });
      } else if (!r && dr.reponseD3 !== "expiree") {
        lies.push({
          ...IWAN,
          heure: w,
          texte: "Plus aucune offre en lice : la laiterie reste indépendante.",
        });
      }
    }

    if (arrive.reponseD4 && dr.retenue && dr.cout > 0) {
      const w = sem(EFFET[D.retrade]);
      const coop = dr.retenue.qui === "coop";
      const prix = (m: number, b: number) => mE(m * EBE - b);
      switch (dr.reponseD4) {
        case "accepte":
          lies.push({
            ...qui(coop),
            heure: w,
            texte: `Merci. Notre offre ferme : ${prix(dr.retenue.multiple, dr.baisse)} de valeur d'entreprise.`,
          });
          break;
        case "tient":
          lies.push({
            ...qui(coop),
            heure: w,
            texte: `Nous maintenons notre prix sans baisse : ${prix(dr.retenue.multiple, 0)}. Nous prendrons les travaux à notre charge.`,
          });
          break;
        case "part":
          lies.push({
            ...qui(coop),
            heure: w,
            alerte: true,
            texte: "Nous ne pouvons pas ignorer ce que notre audit a trouvé. Nous nous retirons.",
          });
          lies.push(
            dr.finale
              ? {
                  ...ERMENGARDE,
                  heure: w,
                  texte: `${majuscule(nomDe(dr.finale.qui === "coop"))} reprend la main, à ${prix(dr.finale.multiple, dr.baisse)}, après une baisse de ${mE(dr.baisse)} pour les mêmes points.`,
                }
              : {
                  ...IWAN,
                  heure: w,
                  alerte: true,
                  texte:
                    "Plus d'acquéreur : la laiterie reste indépendante, et nous savons maintenant ce que coûtent ses points faibles.",
                },
          );
          break;
        case "chiffre":
          lies.push({
            ...qui(coop),
            heure: w,
            texte: `Vos chiffres sont solides. Nous ne retirons que le coût des travaux, ${mE(dr.cout)} : offre ferme à ${prix(dr.retenue.multiple, dr.baisse)}.`,
          });
          break;
        case "refuse-chiffre":
          lies.push({
            ...qui(coop),
            heure: w,
            texte: `Nous maintenons notre demande : ${mE(dr.demande)}. Offre ferme à ${prix(dr.retenue.multiple, dr.baisse)}.`,
          });
          break;
        default:
          break;
      }
    }

    if (arrive.vote && t.voie === 1 && chemin[D.producteurs] !== 1) {
      lies.push({
        ...KONOGAN,
        heure: sem(REVELE.vote),
        alerte: t.producteursPartent,
        texte: t.producteursPartent
          ? `Les producteurs qui livrent ${OP.menace} millions de litres ont signé avec le collecteur de la Manche. La clause d'approvisionnement joue : le prix baisse de ${mE(OP.clause)}.`
          : "Les producteurs ont renouvelé leurs contrats-cadres, à contrecœur. Rien n'est écrit : ils resteront vigilants.",
      });
    } else if (arrive.vote && t.voie === 1) {
      lies.push({
        ...KONOGAN,
        heure: sem(REVELE.vote),
        texte:
          "Avec les garanties écrites dans l'acte, l'assemblée a voté le renouvellement des contrats-cadres. Le lait du Méné reste à Loudéac.",
      });
    }

    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: sem(semaine),
      texte: imprevu.texte,
    }));
    if (arrive.marche) {
      const s = SCENARIOS[h.scenario];
      imprevus.push({
        ...IWAN,
        heure: sem(REVELE.marche),
        texte: `La note de conjoncture de mi-novembre est tombée : marché laitier ${s.nom} pour les trois ans qui viennent. Le plan réaliste en tire ${mE(s.ve)} de valeur d'entreprise et ${mE(s.ebe2027)} d'EBE en 2027.`,
      });
      imprevus.push({
        ...NAIM,
        heure: sem(REVELE.celtis),
        texte: h.celtis
          ? "Celtis reconduit nos MDD de yaourts pour 2027 : les volumes tiennent."
          : "Celtis attribue ses MDD de yaourts 2027 à un concurrent : 8 % de nos volumes s'en vont l'an prochain.",
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.voie === 0
        ? `${mE(t.objectif)} pour les titres : la laiterie reste indépendante`
        : `${mE(t.objectif)} pour les titres : la laiterie est vendue à ${nomDe(t.voie === 2)}`,
    formatObjectif: mE,
    noteDesBarres:
      "Valeur obtenue pour les titres de la famille, estimée en semaine 13 : le prix de cession, conditions et engagements compris, ou la valeur de la laiterie indépendante, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const d = t.deroule;
      const multiple = t.voie !== 0 ? t.prix / EBE : null;
      return [
        {
          nom: "Valeur pour les actionnaires",
          valeur: mE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${mE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Prix obtenu",
          valeur: multiple !== null ? fois(multiple) : "laiterie gardée",
          aide:
            multiple !== null
              ? `${mE(t.prix)} de valeur d'entreprise, baisse comprise ; offre de départ : 7,5`
              : `valeur indépendante : ${mE(t.independante)}`,
          tenu: multiple !== null && t.prix > OFFRE,
        },
        {
          nom: "Lait sous contrat",
          valeur: `${t.producteursPartent ? OP.volume - OP.menace : OP.volume} M de litres`,
          aide: "pour l'an prochain, OP Lait du Méné",
          tenu: !t.producteursPartent,
        },
        {
          nom: "Baisse après audit",
          valeur: t.voie !== 0 ? mE(d.baisse) : "aucune vente",
          aide:
            d.cout > 0
              ? `coût réel des points trouvés : ${mE(d.cout)}`
              : "aucun point faible à chiffrer",
          tenu: t.voie !== 0 && d.baisse <= d.cout + 1,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const d = t.deroule;
      const s = SCENARIOS[h.scenario];
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${minuscule(imprevu.titre)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le marché laitier",
          texte: `s'est révélé ${s.nom} : ${mE(s.ve)} de valeur d'entreprise pour la laiterie indépendante (trois chances sur dix d'être porteur, une sur quatre d'être dégradé). Celtis ${h.celtis ? "a reconduit" : "n'a pas reconduit"} ses MDD.`,
        },
        {
          titre: "Les points faibles",
          texte:
            d.cout > 0
              ? `${pointsTrouves(h.ligne, h.station)}.`.replace(/^./, (c) => c.toUpperCase())
              : "Ni le stérilisateur de Pontivy ni la station de Loudéac ne demandaient de travaux : trois trimestres sur dix.",
        },
        {
          titre: "La coopérative Kérouval",
          texte:
            d.chanceCoop === 0
              ? "n'a pas été approchée."
              : d.coop !== null
                ? `a fait une offre à ${fois(d.coop)} (${Math.round(d.chanceCoop * 100)} chances sur cent, au vu de la préparation du dossier).`
                : `n'a pas fait d'offre (elle en faisait une ${Math.round(d.chanceCoop * 100)} fois sur cent, au vu de la préparation du dossier).`,
        },
        {
          titre: "Nordal",
          texte:
            d.reponseD1 === "rejet"
              ? "a pris acte du refus."
              : d.reponseD1 === "retrait-enchere" || d.retraitAudit
                ? "s'est retiré."
                : d.reponseD3 === "surenchere"
                  ? "a relevé son offre face à la concurrence."
                  : d.reponseD3 === "retrait" || d.reponseD3 === "caduque"
                    ? "s'est retiré, ou a laissé expirer son offre."
                    : "a maintenu son offre de départ.",
        },
        ...(t.voie === 1
          ? [
              {
                titre: "Les producteurs du Méné",
                texte: t.producteursPartent
                  ? "n'ont pas renouvelé : la clause d'approvisionnement a joué."
                  : "ont renouvelé leurs contrats.",
              },
            ]
          : []),
      ];
    },
  },
  comportements,
  axe,
};
