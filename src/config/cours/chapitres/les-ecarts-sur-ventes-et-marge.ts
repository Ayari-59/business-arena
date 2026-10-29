import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { controleBudgetaire, coutPreetabli } from "../monde/ecarts";
import { USINES_DU_COURS, type FicheDeLUsine, type ModeleDeNova } from "../monde/nova-usine";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES ÉCARTS SUR CHIFFRE D'AFFAIRES ET SUR MARGE (contrôle de gestion, palier 4 ;
 * BTS CG, DCG UE11, BUT GEA et GACO).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : l'usine de NOVA
 * a une fiche figée (monde/nova-usine.ts) et le contrôle budgétaire se calcule par le modèle du cours
 * (monde/ecarts.ts, `controleBudgetaire`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : les ventes du trimestre, deux enceintes vendues à d'autres prix et en d'autres quantités
 * que prévu. L'écart sur chiffre d'affaires se partage en écart sur prix (sur les quantités réelles)
 * et écart sur quantités (au prix prévu). Puis l'écart sur marge, à la marge préétablie (prix de vente
 * moins coût préétabli) : l'écart sur prix de vente, et l'écart sur volume, qui se lit de deux façons
 * qui concordent, modèle par modèle, ou en écart sur quantité globale (à la marge moyenne prévue) plus
 * écart sur composition des ventes (le mix).
 *
 * Le piège central : un chiffre d'affaires presque tenu (−400 €) cache 13 400 € de marge en moins ;
 * un écart sur volume presque nul (−600 €) cache 12 500 € perdus sur la quantité globale, que le
 * glissement vers la Salon, plus margée, compense presque.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DCG) :
 *   · guidé : intro, chiffre-d-affaires, prix-et-quantites, le-chiffre-presque-tenu,
 *     la-marge-preetablie, quantite-globale (la formule est au repère, la question nomme les
 *     chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : le-prix-de-la-nomade
 *     (un curseur sur le prix de la Nomade, la marge du trimestre face à la marge prévue) avant
 *     ecart-sur-marge ; predire-le-mix puis le-mix-au-curseur (le nombre de Salon sur le total vendu,
 *     la marge des ventes face à la marge prévue) avant quantite-globale et composition ;
 *   · le laboratoire : le-laboratoire-des-ventes (quantités et prix des deux modèles ; retrouver la
 *     marge prévue en vendant moins d'enceintes que prévu), en expert, après le-mix-qui-masque ;
 *   · autonome : ecart-sur-marge, volume-par-modele, le-volume-au-prix, composition (ni formule ni
 *     chiffres donnés ; le calcul de la correction montre le chemin) ;
 *   · expert : les-deux-lectures (la décomposition modèle par modèle et la concordance des deux
 *     lectures du volume), le-mix-qui-masque (un mix favorable sur un volume en baisse),
 *     une-autre-composition (une variante de la composition prévue), a-rebours (retrouver un prix
 *     de vente réel à partir de l'écart sur prix) ; puis qui-doit-agir et la synthèse.
 */

/**
 * LA VARIANTE DE COMPOSITION, hypothèse du cours : un budget qui aurait prévu le même total
 * d'enceintes, mais 60 % de Nomade et 40 % de Salon au lieu de la composition de la fiche. Les ventes
 * réelles, les prix et les coûts préétablis ne changent pas.
 */
export const COMPOSITION_PREVUE_VARIANTE: Readonly<Record<ModeleDeNova["code"], number>> = { nomade: 0.6, salon: 0.4 };

/**
 * LE CALCUL À REBOURS, hypothèse du cours : au trimestre suivant, avec les mêmes quantités vendues,
 * le commercial ne remonte que l'écart sur prix total, −4 100 €, et le prix de la Nomade, 58 €. Les
 * prix prévus sont ceux de la fiche.
 */
export const PRIX_DE_LA_NOMADE_A_REBOURS = 58;
export const ECART_SUR_PRIX_A_REBOURS = -4_100;

/** Les bornes des curseurs : le prix de la Nomade, en euros ; le nombre de Salon parmi les enceintes vendues. */
export const PRIX_DU_CURSEUR = { min: 50, max: 65 } as const;
export const SALON_DU_CURSEUR = { min: 3_000, max: 6_000 } as const;

/** Les leviers du laboratoire des ventes : bornes et pas des quantités (enceintes) et des prix (euros). */
export const LEVIERS_DES_VENTES: {
  quantite: Readonly<Record<ModeleDeNova["code"], { min: number; max: number; pas: number }>>;
  prix: Readonly<Record<ModeleDeNova["code"], { min: number; max: number; pas: number }>>;
} = {
  quantite: { nomade: { min: 8_000, max: 14_000, pas: 100 }, salon: { min: 2_000, max: 7_000, pas: 100 } },
  prix: { nomade: { min: 50, max: 65, pas: 0.5 }, salon: { min: 110, max: 130, pas: 0.5 } },
};

/**
 * Une solution du défi du laboratoire, hypothèse du cours : les prix du trimestre, 700 enceintes
 * passées de la Nomade à la Salon. 15 600 enceintes, et 501 300 € de marge au coût préétabli.
 */
export const SOLUTION_DU_LABORATOIRE = { qa: 10_300, pa: 57, qb: 5_300, pb: 121 } as const;

/** Le contrôle budgétaire se calcule sur une production : l'usine de NOVA. */
export const ENTREPRISES_DES_VENTES: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const auCentime = (x: number) => Math.round(x * 100) / 100;
/** Le sens d'un écart sur un produit ou une marge : positif, favorable. */
const sens = (x: number) => (x > 0 ? "favorable" : x < 0 ? "défavorable" : "nul");
const ecartDit = (x: number) => `${eur(x)} ${sens(x)}`;

/** La fiche de l'usine du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLUsine => USINES_DU_COURS[c.code]!;

/** La fiche de la variante : le même total prévu, réparti selon `COMPOSITION_PREVUE_VARIANTE`. */
export function ficheAUneAutreComposition(f: FicheDeLUsine): FicheDeLUsine {
  const total = f.modeles.reduce((t, m) => t + m.quantitePrevue, 0);
  return { ...f, modeles: f.modeles.map((m) => ({ ...m, quantitePrevue: Math.round(total * COMPOSITION_PREVUE_VARIANTE[m.code]) })) };
}

/** Les écarts sur ventes et sur marge : tout ce que le chapitre et son cas demandent. */
export function ventesEtMarge(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const e = controleBudgetaire(f);
  const v = e.ventes;
  const r = f.realise;
  const parModele = f.modeles.map((m) => {
    const cout = coutPreetabli(f, m);
    const qp = m.quantitePrevue;
    const qr = r.ventes[m.code].quantite;
    const pp = m.prixPrevu;
    const pr = r.ventes[m.code].prix;
    const auMixPrevu = v.auMixPrevu[m.code];
    return {
      code: m.code,
      nom: m.nom,
      qp,
      qr,
      pp,
      pr,
      part: auCentime(qp / v.qTotalePrevue),
      coutPreetabli: cout.total,
      margePreetablie: cout.marge,
      margeReelleUnitaire: auCentime(pr - cout.total),
      caPrevu: auCentime(qp * pp),
      caReel: auCentime(qr * pr),
      prix: auCentime((pr - pp) * qr),
      quantitesSurCa: auCentime((qr - qp) * pp),
      margePrevue: auCentime(qp * cout.marge),
      margeReelle: auCentime(qr * (pr - cout.total)),
      volume: auCentime((qr - qp) * cout.marge),
      auMixPrevu,
      quantiteGlobale: auCentime((auMixPrevu - qp) * cout.marge),
      composition: auCentime((qr - auMixPrevu) * cout.marge),
    };
  });
  const margeReelle = auCentime(parModele.reduce((t, m) => t + m.margeReelle, 0));
  const ecartSurMarge = auCentime(margeReelle - v.margePrevue);
  // La variante de composition.
  const fv = ficheAUneAutreComposition(f);
  const ev = controleBudgetaire(fv).ventes;
  const variante = {
    quantitesPrevues: Object.fromEntries(fv.modeles.map((m) => [m.code, m.quantitePrevue])) as Record<ModeleDeNova["code"], number>,
    margePrevue: ev.margePrevue,
    margeMoyennePrevue: ev.margeMoyennePrevue,
    quantiteGlobale: ev.quantiteGlobale,
    composition: ev.composition,
    volume: ev.volume,
    auMixPrevu: ev.auMixPrevu,
  };
  // Le calcul à rebours : le prix de la Salon qui donne l'écart sur prix total remonté.
  const [a, b] = parModele;
  const partDeLaNomadeARebours = auCentime((PRIX_DE_LA_NOMADE_A_REBOURS - a!.pp) * a!.qr);
  const partDeLaSalonARebours = auCentime(ECART_SUR_PRIX_A_REBOURS - partDeLaNomadeARebours);
  const prixDeLaSalonARebours = auCentime(b!.pp + partDeLaSalonARebours / b!.qr);
  // Les curseurs : le plus petit prix de la Nomade qui tient la marge prévue, puis le chiffre d'affaires
  // prévu ; le plus petit nombre de Salon, sur le total vendu, qui tient la marge prévue.
  const prixQuiTientLaMarge = Math.ceil((v.margePrevue - b!.margeReelle) / a!.qr + a!.coutPreetabli - 1e-9);
  const prixQuiTientLeChiffre = Math.ceil((v.chiffreDAffairesPrevu - b!.caReel) / a!.qr - 1e-9);
  const salonsQuiTiennentLaMarge = Math.ceil((v.margePrevue - v.qTotaleReelle * a!.margePreetablie) / (b!.margePreetablie - a!.margePreetablie) - 1e-9);
  return {
    f,
    parModele,
    prixQuiTientLaMarge,
    prixQuiTientLeChiffre,
    salonsQuiTiennentLaMarge,
    qTotalePrevue: v.qTotalePrevue,
    qTotaleReelle: v.qTotaleReelle,
    ecartDeQuantiteTotale: v.qTotaleReelle - v.qTotalePrevue,
    caPrevu: v.chiffreDAffairesPrevu,
    caReel: v.chiffreDAffairesReel,
    ecartDeCa: v.ecartDeChiffreDAffaires,
    prix: v.prix,
    quantitesSurCa: v.quantiteSurChiffreDAffaires,
    margePrevue: v.margePrevue,
    margeMoyennePrevue: v.margeMoyennePrevue,
    margeReelle,
    ecartSurMarge,
    volume: v.volume,
    quantiteGlobale: v.quantiteGlobale,
    composition: v.composition,
    variante,
    partDeLaNomadeARebours,
    partDeLaSalonARebours,
    prixDeLaSalonARebours,
  };
}

export type VentesEtMarge = ReturnType<typeof ventesEtMarge>;

/** Le chiffre d'affaires, la marge et les écarts sur marge pour des quantités et des prix quelconques. */
export function laboratoireDesVentes(x: VentesEtMarge, p: Readonly<Record<string, number>>) {
  const [a, b] = x.parModele;
  const ventes = [
    { m: a!, q: p.qa!, prix: p.pa! },
    { m: b!, q: p.qb!, prix: p.pb! },
  ];
  const total = ventes.reduce((t, v) => t + v.q, 0);
  const somme = (g: (v: (typeof ventes)[number]) => number) => auCentime(ventes.reduce((t, v) => t + g(v), 0));
  const marge = somme((v) => v.q * (v.prix - v.m.coutPreetabli));
  return {
    total,
    chiffreDAffaires: somme((v) => v.q * v.prix),
    marge,
    prix: somme((v) => (v.prix - v.m.pp) * v.q),
    quantiteGlobale: auCentime((total - x.qTotalePrevue) * x.margeMoyennePrevue),
    composition: somme((v) => (v.q - (total * v.m.qp) / x.qTotalePrevue) * v.m.margePreetablie),
    ecartSurMarge: auCentime(marge - x.margePrevue),
  };
}

/** Les ventes prévues et réelles, et la fiche de coût préétabli : le document de départ. */
export function tableauDesVentes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = ventesEtMarge(c);
  return {
    titre: `Les ventes du trimestre à l'usine ${dE(x.f.entreprise)}`,
    colonnes: ["Prévu", "Réel"],
    lignes: x.parModele.flatMap((m) => [
      { libelle: `${m.nom} vendues`, valeurs: [qte(m.qp), qte(m.qr)] },
      { libelle: `Prix de vente d'une ${m.nom}`, valeurs: [eur(m.pp), eur(m.pr)] },
      { libelle: `Coût préétabli d'une ${m.nom}`, valeurs: [eur(m.coutPreetabli), ""] },
    ]),
  };
}

/** La décomposition complète de l'écart sur marge, modèle par modèle. */
function tableauDeLaMarge(x: VentesEtMarge): TableauDeDonnees {
  const total = (g: (m: VentesEtMarge["parModele"][number]) => number) => auCentime(x.parModele.reduce((t, m) => t + g(m), 0));
  const ligne = (libelle: string, g: (m: VentesEtMarge["parModele"][number]) => number) => ({ libelle, valeurs: [...x.parModele.map((m) => eur(g(m))), eur(total(g))] });
  return {
    titre: `L'écart sur marge à l'usine ${dE(x.f.entreprise)}, modèle par modèle`,
    colonnes: [...x.parModele.map((m) => m.nom), "Total"],
    lignes: [
      ligne("Écart sur prix de vente", (m) => m.prix),
      ligne("Écart sur quantité globale", (m) => m.quantiteGlobale),
      ligne("Écart sur composition des ventes", (m) => m.composition),
      ligne("Écart sur volume", (m) => m.volume),
      ligne("Écart sur marge", (m) => auCentime(m.margeReelle - m.margePrevue)),
    ],
  };
}

const CONVENTION =
  "Une convention pour tout le chapitre : un écart est le réel moins le prévu. Sur un chiffre d'affaires ou une marge, un écart positif est favorable, un écart négatif défavorable : l'inverse d'une charge.";

export const LES_ECARTS_SUR_VENTES_ET_MARGE: Chapitre = {
  code: "les-ecarts-sur-ventes-et-marge",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  titre: "Les écarts sur chiffre d'affaires et sur marge",
  accroche:
    "Le chiffre d'affaires du trimestre est presque celui du budget. La marge, elle, ne l'est pas. Décomposer l'écart sur chiffre d'affaires, puis l'écart sur marge en écart sur prix, sur quantité globale et sur composition des ventes, modèle par modèle.",
  objectifs: [
    "Décomposer l'écart sur chiffre d'affaires en écart sur prix et écart sur quantités",
    "Calculer l'écart sur marge à la marge préétablie, et le partager en écart sur prix et écart sur volume",
    "Décomposer l'écart sur volume en écart sur quantité globale et écart sur composition des ventes, et vérifier que les deux lectures concordent",
    "Refaire l'analyse pour une autre composition prévue, et retrouver un prix de vente réel à rebours",
    "Dire ce qu'un mix favorable peut cacher, et qui doit répondre de chaque écart",
  ],
  libre: false,
  prerequis: ["le-cout-preetabli-et-les-budgets"],
  entreprises: {
    codes: ENTREPRISES_DES_VENTES,
    pourquoi: "les écarts sur marge se calculent à la marge préétablie, celle des coûts préétablis de l'usine du cours, qui fabrique la Nomade et la Salon.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Les ventes du trimestre",
      notions: ["volume_price_variance", "standard_costing"],
      tableau: tableauDesVentes,
      texte: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return [
          `Ce chapitre se joue dans la simulation du cours, à l'usine ${dE(x.f.entreprise)}, sur un trimestre. L'usine vend la ${a!.nom} et la ${b!.nom} ; toute la production du trimestre est vendue, sans stock. Le budget prévoyait ${qte(a!.qp)} ${a!.nom} à ${eur(a!.pp)} et ${qte(b!.qp)} ${b!.nom} à ${eur(b!.pp)}.`,
          `Le trimestre a vendu ${qte(a!.qr)} ${a!.nom} à ${eur(a!.pr)} et ${qte(b!.qr)} ${b!.nom} à ${eur(b!.pr)}. Le coût préétabli d'une enceinte (matière, main-d'œuvre directe, centre de montage) est celui de sa fiche ; la distribution, hors production, n'entre pas dans ce chapitre.`,
          "Ici, on ne juge pas les coûts de production : leurs écarts ont leurs propres chapitres. On juge les ventes, et c'est pourquoi la marge se calcule au coût préétabli : la marge préétablie d'une enceinte est son prix de vente moins son coût préétabli.",
          CONVENTION,
        ];
      },
      repere: () => "Un écart = réel − prévu ; sur un chiffre d'affaires ou une marge, positif est favorable. Marge préétablie = prix de vente − coût préétabli.",
    },
    {
      id: "chiffre-d-affaires",
      type: "montants",
      titre: "L'écart sur chiffre d'affaires",
      notions: ["volume_price_variance", "revenue"],
      question: (c) => {
        const x = ventesEtMarge(c);
        return `Calculez le chiffre d'affaires prévu (${x.parModele.map((m) => `${qte(m.qp)} ${m.nom} à ${eur(m.pp)}`).join(", ")}), le chiffre d'affaires réel (${x.parModele.map((m) => `${qte(m.qr)} à ${eur(m.pr)}`).join(", ")}), puis l'écart, réel moins prévu. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = ventesEtMarge(c);
        return [
          { libelle: "Chiffre d'affaires prévu", attendu: x.caPrevu, calcul: `${x.parModele.map((m) => `${qte(m.qp)} × ${eur(m.pp)}`).join(" + ")} = ${eur(x.caPrevu)}` },
          { libelle: "Chiffre d'affaires réel", attendu: x.caReel, calcul: `${x.parModele.map((m) => `${qte(m.qr)} × ${eur(m.pr)}`).join(" + ")} = ${eur(x.caReel)}` },
          { libelle: "Écart sur chiffre d'affaires", attendu: x.ecartDeCa, calcul: `${eur(x.caReel)} − ${eur(x.caPrevu)} = ${eur(x.ecartDeCa)}` },
        ];
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        return [`L'écart sur chiffre d'affaires est de ${ecartDit(x.ecartDeCa)}, soit ${pct(Math.abs(x.ecartDeCa) / x.caPrevu)} du chiffre prévu. À première vue, le budget est tenu.`];
      },
    },
    {
      id: "prix-et-quantites",
      type: "montants",
      titre: "L'écart sur prix et l'écart sur quantités",
      notions: ["volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return `L'écart sur prix se calcule sur les quantités réelles : (prix réel − prix prévu) × quantité réelle, modèle par modèle. L'écart sur quantités se calcule au prix prévu : (quantité réelle − quantité prévue) × prix prévu. Calculez l'écart sur prix de la ${a!.nom}, celui de la ${b!.nom}, puis l'écart sur quantités des deux modèles ensemble. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = ventesEtMarge(c);
        return [
          ...x.parModele.map((m) => ({
            libelle: `Écart sur prix de la ${m.nom}`,
            attendu: m.prix,
            calcul: `(${eur(m.pr)} − ${eur(m.pp)}) × ${qte(m.qr)} = ${eur(m.prix)}`,
          })),
          {
            libelle: "Écart sur quantités",
            attendu: x.quantitesSurCa,
            calcul: `${x.parModele.map((m) => `(${qte(m.qr)} − ${qte(m.qp)}) × ${eur(m.pp)}`).join(" + ")} = ${x.parModele.map((m) => entre(m.quantitesSurCa)).join(" + ")} = ${eur(x.quantitesSurCa)}`,
          },
        ];
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        return [
          `L'écart sur prix, ${x.parModele.map((m) => entre(m.prix)).join(" + ")} = ${ecartDit(x.prix)}, et l'écart sur quantités, ${ecartDit(x.quantitesSurCa)}, font ensemble l'écart sur chiffre d'affaires : ${eur(x.prix)} + ${entre(x.quantitesSurCa)} = ${eur(x.ecartDeCa)}.`,
        ];
      },
    },
    {
      id: "le-chiffre-presque-tenu",
      type: "choix",
      titre: "Un chiffre d'affaires presque tenu",
      notions: ["volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        return `L'écart sur chiffre d'affaires n'est que de ${eur(x.ecartDeCa)}. Que concluez-vous ?`;
      },
      options: (c) => {
        const x = ventesEtMarge(c);
        return [
          {
            texte: "Rien encore : deux gros écarts de sens contraire se compensent, et la marge reste à voir",
            juste: true,
            retour: `Oui. L'écart sur prix (${eur(x.prix)}) et l'écart sur quantités (${eur(x.quantitesSurCa)}) se compensent presque. Un écart global faible ne veut pas dire que tout va bien, et le chiffre d'affaires ne dit pas ce que les ventes ont rapporté.`,
          },
          {
            texte: "Les ventes ont tenu leur budget : l'écart est négligeable",
            juste: false,
            retour: `Non : un écart global faible peut cacher deux écarts forts. Ici, ${eur(x.prix)} sur les prix et ${eur(x.quantitesSurCa)} sur les quantités.`,
          },
          {
            texte: "Les prix ont baissé, mais les quantités ont compensé : la marge est tenue aussi",
            juste: false,
            retour: "Non : c'est juger la marge au chiffre d'affaires. Une enceinte vendue en plus apporte sa marge, pas son prix ; il faut refaire le calcul à la marge préétablie.",
          },
        ];
      },
    },
    {
      id: "la-marge-preetablie",
      type: "montants",
      titre: "La marge préétablie",
      notions: ["contribution_margin", "standard_costing"],
      question: (c) => {
        const x = ventesEtMarge(c);
        return `La marge préétablie d'une enceinte est son prix prévu moins son coût préétabli (${x.parModele.map((m) => `${eur(m.coutPreetabli)} pour une ${m.nom}`).join(", ")}). Calculez celle de chaque modèle, puis la marge préétablie prévue du trimestre, sur les quantités prévues.`;
      },
      champs: (c) => {
        const x = ventesEtMarge(c);
        return [
          ...x.parModele.map((m) => ({
            libelle: `Marge préétablie d'une ${m.nom}`,
            attendu: m.margePreetablie,
            calcul: `${eur(m.pp)} − ${eur(m.coutPreetabli)} = ${eur(m.margePreetablie)}`,
          })),
          {
            libelle: "Marge préétablie prévue du trimestre",
            attendu: x.margePrevue,
            calcul: `${x.parModele.map((m) => `${qte(m.qp)} × ${eur(m.margePreetablie)}`).join(" + ")} = ${eur(x.margePrevue)}`,
          },
        ];
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return [
          `Une ${b!.nom} rapporte ${eur(b!.margePreetablie)}, une ${a!.nom} ${eur(a!.margePreetablie)} : le prix ne dit pas tout, la marge de chaque modèle compte. Le budget attendait ${eur(x.margePrevue)} de marge préétablie.`,
        ];
      },
    },
    {
      id: "le-prix-de-la-nomade",
      type: "curseur",
      titre: "Le prix de la Nomade, au curseur",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        const [a] = x.parModele;
        return `Les quantités vendues sont celles du trimestre. Faites varier le prix réel de la ${a!.nom}, de ${eur(PRIX_DU_CURSEUR.min)} à ${eur(PRIX_DU_CURSEUR.max)}, et regardez la marge au coût préétabli face à la marge prévue (${eur(x.margePrevue)}). Placez le curseur sur le plus petit prix qui tient la marge prévue, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Prix de la ${ventesEtMarge(c).parModele[0]!.nom}`, unite: "€" }),
      cible: (c) => {
        const x = ventesEtMarge(c);
        return { attendu: x.prixQuiTientLaMarge, min: PRIX_DU_CURSEUR.min, max: PRIX_DU_CURSEUR.max };
      },
      zones: ["Marge prévue tenue", "Marge prévue manquée"],
      rates: () => ({
        dessous: "À ce prix, la marge du trimestre reste sous la marge prévue.",
        dessus: "Un prix plus bas tient encore la marge prévue : cherchez le plus petit.",
      }),
      montrer: "Montrer le prix",
      lecture: (c, p) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        const marge = auCentime(a!.qr * (p - a!.coutPreetabli) + b!.margeReelle);
        return [
          { libelle: `Écart sur prix de la ${a!.nom}`, montant: auCentime((p - a!.pp) * a!.qr) },
          { libelle: "Écart sur chiffre d'affaires", montant: auCentime(a!.qr * p + b!.caReel - x.caPrevu) },
          { libelle: "Marge au coût préétabli", montant: marge },
          { libelle: "Écart sur marge", montant: auCentime(marge - x.margePrevue), fort: true },
        ];
      },
      droites: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return {
          produit: (p) => a!.qr * (p - a!.coutPreetabli) + b!.margeReelle,
          cout: () => x.margePrevue,
          libelles: ["Marge du trimestre, au coût préétabli", "Marge prévue"],
        };
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        const [a] = x.parModele;
        return [
          `Il fallait vendre la ${a!.nom} au moins ${eur(x.prixQuiTientLaMarge)} pour tenir la marge prévue. Chaque euro cédé sur son prix retire ${eur(a!.qr)} à la marge, un euro sur chacune des ${qte(a!.qr)} ${a!.nom} vendues : au coût préétabli, le coût d'une enceinte ne bouge pas, et l'écart sur prix passe tout entier dans la marge.`,
          `Le chiffre d'affaires, lui, tient le budget dès ${eur(x.prixQuiTientLeChiffre)} : la ligne du chiffre d'affaires et celle de la marge ne disent pas la même chose. L'étape suivante fait calculer l'écart sur marge du trimestre.`,
        ];
      },
    },
    {
      id: "ecart-sur-marge",
      type: "montants",
      titre: "L'écart sur marge",
      notions: ["contribution_margin", "volume_price_variance"],
      question: () =>
        "Sans formule cette fois. Calculez la marge réelle du trimestre au coût préétabli, l'écart sur marge, puis la part de cet écart qui ne vient pas des prix de vente : l'écart sur volume. Négatif pour un écart défavorable.",
      champs: (c) => {
        const x = ventesEtMarge(c);
        return [
          {
            libelle: "Marge réelle au coût préétabli",
            attendu: x.margeReelle,
            calcul: `${x.parModele.map((m) => `${qte(m.qr)} × (${eur(m.pr)} − ${eur(m.coutPreetabli)})`).join(" + ")} = ${eur(x.margeReelle)}`,
          },
          { libelle: "Écart sur marge", attendu: x.ecartSurMarge, calcul: `${eur(x.margeReelle)} − ${eur(x.margePrevue)} = ${eur(x.ecartSurMarge)}` },
          {
            libelle: "Écart sur volume",
            attendu: x.volume,
            calcul: `écart sur marge − écart sur prix : ${eur(x.ecartSurMarge)} − ${entre(x.prix)} = ${eur(x.volume)}`,
          },
        ];
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        return [
          `L'écart sur marge, ${ecartDit(x.ecartSurMarge)}, pèse bien plus que l'écart sur chiffre d'affaires, ${eur(x.ecartDeCa)}. Au coût préétabli, le coût d'une enceinte ne bouge pas : tout l'écart sur prix de vente, ${eur(x.prix)}, passe dans la marge. Le reste, ${eur(x.volume)}, vient des quantités : c'est l'écart sur volume, valorisé à la marge préétablie.`,
        ];
      },
    },
    {
      id: "volume-par-modele",
      type: "montants",
      titre: "L'écart sur volume, modèle par modèle",
      notions: ["contribution_margin", "volume_price_variance"],
      question: () => "Retrouvez l'écart sur volume modèle par modèle, puis vérifiez qu'il retombe sur celui de l'étape précédente. Négatif pour un écart défavorable.",
      champs: (c) => {
        const x = ventesEtMarge(c);
        return x.parModele.map((m) => ({
          libelle: `Écart sur volume de la ${m.nom}`,
          attendu: m.volume,
          calcul: `(${qte(m.qr)} − ${qte(m.qp)}) × ${eur(m.margePreetablie)} = ${eur(m.volume)}`,
        }));
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        return [`${x.parModele.map((m) => entre(m.volume)).join(" + ")} = ${eur(x.volume)} : la même chose, par l'autre chemin. Les quantités, qui rapportaient ${eur(x.quantitesSurCa)} au chiffre d'affaires, ne rapportent que ${eur(x.volume)} à la marge.`];
      },
    },
    {
      id: "le-volume-au-prix",
      type: "choix",
      titre: "Le volume, au prix ou à la marge",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        return `Les quantités font ${eur(x.quantitesSurCa)} sur le chiffre d'affaires, mais ${eur(x.volume)} sur la marge. Pourquoi l'écart sur volume se valorise-t-il à la marge préétablie, et l'écart sur prix sur les quantités réelles ?`;
      },
      options: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return [
          {
            texte: "Une enceinte de plus ou de moins change le résultat de sa marge, et la baisse de prix porte sur ce qui a été vendu",
            juste: true,
            retour: `Oui. Une ${a!.nom} perdue emporte ${eur(a!.margePreetablie)} de marge, pas ${eur(a!.pp)} : son coût part avec elle. Une ${b!.nom} gagnée apporte ${eur(b!.margePreetablie)}. Et l'écart de prix ne s'applique qu'aux enceintes réellement vendues, d'où les quantités réelles.`,
          },
          {
            texte: "Par simple convention : on pourrait aussi bien valoriser le volume au prix de vente",
            juste: false,
            retour: `Non : valoriser le volume au prix, c'est compter le coût des enceintes vendues en plus comme un gain. Le résultat ne bouge que de la marge : ${eur(x.volume)}, pas ${eur(x.quantitesSurCa)}.`,
          },
          {
            texte: "Parce que l'écart sur prix se calcule sur les quantités prévues, et le volume au prix réel",
            juste: false,
            retour: "Non : c'est l'inverse, et c'est l'erreur de base la plus fréquente. L'écart sur prix porte sur les quantités réelles ; l'écart sur volume se valorise au prévu (ici la marge préétablie), sinon les deux écarts ne retombent plus sur le total.",
          },
        ];
      },
    },
    {
      id: "predire-le-mix",
      type: "choix",
      titre: "Pariez sur une Salon de plus",
      notions: ["contribution_margin"],
      question: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return `Avant de calculer, pariez. Sur les ${qte(x.qTotaleReelle)} enceintes vendues, l'usine vend une ${b!.nom} de plus et une ${a!.nom} de moins, aux prix du budget. La marge préétablie du trimestre…`;
      },
      options: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        const voir = "Déplacez le curseur à l'étape suivante : la marge des ventes réagit à chaque enceinte qui change de modèle.";
        const ecart = auCentime(b!.margePreetablie - a!.margePreetablie);
        return [
          { texte: `Gagne ${eur(ecart)}, l'écart entre les deux marges`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Gagne ${eur(auCentime(b!.pp - a!.pp))}, l'écart entre les deux prix`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Ne bouge pas : le total vendu est le même", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-mix-au-curseur",
      type: "curseur",
      titre: "Le mix, au curseur",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return `Gardez les ${qte(x.qTotaleReelle)} enceintes vendues, ${qte(x.ecartDeQuantiteTotale < 0 ? -x.ecartDeQuantiteTotale : x.ecartDeQuantiteTotale)} ${x.ecartDeQuantiteTotale < 0 ? "de moins" : "de plus"} que prévu, et changez leur partage : déplacez le nombre de ${b!.nom}, les autres sont des ${a!.nom}. Placez le curseur sur le plus petit nombre de ${b!.nom} qui tient la marge préétablie prévue (${eur(x.margePrevue)}), puis validez.`;
      },
      grandeur: (c) => ({ libelle: `${ventesEtMarge(c).parModele[1]!.nom} vendues`, unite: "enceintes" }),
      cible: (c) => {
        const x = ventesEtMarge(c);
        return { attendu: x.salonsQuiTiennentLaMarge, min: SALON_DU_CURSEUR.min, max: SALON_DU_CURSEUR.max };
      },
      zones: ["Écart sur volume favorable", "Écart sur volume défavorable"],
      rates: () => ({
        dessous: "Avec ce partage, la marge des ventes reste sous la marge prévue.",
        dessus: "Moins de Salon tiendrait encore la marge prévue : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le partage",
      lecture: (c, s) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        const marge = auCentime((x.qTotaleReelle - s) * a!.margePreetablie + s * b!.margePreetablie);
        return [
          { libelle: "Marge préétablie des ventes", montant: marge },
          { libelle: "Écart sur quantité globale", montant: x.quantiteGlobale },
          { libelle: "Écart sur composition des ventes", montant: auCentime((x.qTotaleReelle - s - a!.auMixPrevu) * a!.margePreetablie + (s - b!.auMixPrevu) * b!.margePreetablie) },
          { libelle: "Écart sur volume", montant: auCentime(marge - x.margePrevue), fort: true },
        ];
      },
      droites: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return {
          produit: (s) => (x.qTotaleReelle - s) * a!.margePreetablie + s * b!.margePreetablie,
          cout: () => x.margePrevue,
          libelles: ["Marge préétablie des ventes", "Marge préétablie prévue"],
        };
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        const [, b] = x.parModele;
        return [
          `Pendant que le curseur bouge, une ligne ne change pas : l'écart sur quantité globale, ${eur(x.quantiteGlobale)}. Il ne dépend que du total vendu. Tout le reste passe par la composition : chaque ${b!.nom} vendue à la place d'une ${x.parModele[0]!.nom} apporte ${eur(auCentime(b!.margePreetablie - x.parModele[0]!.margePreetablie))}.`,
          `Il fallait ${qte(x.salonsQuiTiennentLaMarge)} ${b!.nom} pour un écart sur volume nul ; l'usine en a vendu ${qte(b!.qr)}. Le mix a presque rattrapé la quantité globale perdue, sans y parvenir. Les deux étapes suivantes font calculer ces deux écarts.`,
        ];
      },
    },
    {
      id: "quantite-globale",
      type: "montants",
      titre: "L'écart sur quantité globale",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        return `L'écart sur volume se partage en deux. D'abord l'écart sur quantité globale : (quantité totale réelle − quantité totale prévue) × marge préétablie moyenne prévue. Calculez la marge moyenne prévue (${eur(x.margePrevue)} ÷ ${qte(x.qTotalePrevue)} enceintes), puis l'écart sur quantité globale (${qte(x.qTotaleReelle)} enceintes vendues). Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = ventesEtMarge(c);
        return [
          { libelle: "Marge préétablie moyenne prévue", attendu: x.margeMoyennePrevue, calcul: `${eur(x.margePrevue)} ÷ ${qte(x.qTotalePrevue)} = ${eur(x.margeMoyennePrevue)}` },
          {
            libelle: "Écart sur quantité globale",
            attendu: x.quantiteGlobale,
            calcul: `(${qte(x.qTotaleReelle)} − ${qte(x.qTotalePrevue)}) × ${eur(x.margeMoyennePrevue)} = ${eur(x.quantiteGlobale)}`,
          },
        ];
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        return [
          `L'usine a vendu ${qte(Math.abs(x.ecartDeQuantiteTotale))} enceintes ${x.ecartDeQuantiteTotale < 0 ? "de moins" : "de plus"} que prévu. Si elles avaient gardé la composition du budget, la marge aurait bougé de ${eur(x.quantiteGlobale)}. C'est bien plus que l'écart sur volume : quelque chose a compensé.`,
        ];
      },
    },
    {
      id: "composition",
      type: "montants",
      titre: "L'écart sur composition des ventes",
      notions: ["contribution_margin", "volume_price_variance"],
      question: () =>
        "Ensuite l'écart sur composition des ventes, le mix. Sans formule : calculez les ventes de chaque modèle si les enceintes réellement vendues avaient gardé la composition prévue, puis l'écart sur composition. Négatif pour un écart défavorable.",
      champs: (c) => {
        const x = ventesEtMarge(c);
        return [
          ...x.parModele.map((m) => ({
            libelle: `${m.nom} à la composition prévue`,
            attendu: m.auMixPrevu,
            calcul: `${qte(x.qTotaleReelle)} × ${qte(m.qp)} ÷ ${qte(x.qTotalePrevue)} = ${qte(m.auMixPrevu)}`,
          })),
          {
            libelle: "Écart sur composition des ventes",
            attendu: x.composition,
            calcul: `${x.parModele.map((m) => `(${qte(m.qr)} − ${qte(m.auMixPrevu)}) × ${eur(m.margePreetablie)}`).join(" + ")} = ${eur(x.composition)}`,
          },
        ];
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return [
          `La composition prévue était de ${pct(a!.part)} de ${a!.nom} et ${pct(b!.part)} de ${b!.nom}. Les ventes ont glissé vers la ${b!.nom}, plus margée : l'écart sur composition est de ${ecartDit(x.composition)}.`,
          `Les deux font l'écart sur volume : ${eur(x.quantiteGlobale)} + ${entre(x.composition)} = ${eur(x.volume)}.`,
        ];
      },
    },
    {
      id: "les-deux-lectures",
      type: "montants",
      titre: "Les deux lectures du volume",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return `Décomposez l'écart sur volume de chaque modèle : sa part d'écart sur quantité globale (ventes à la composition prévue moins ventes prévues, à sa marge préétablie) et sa part d'écart sur composition (ventes réelles moins ventes à la composition prévue, à sa marge préétablie), pour la ${a!.nom} puis la ${b!.nom}. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = ventesEtMarge(c);
        return x.parModele.flatMap((m) => [
          {
            libelle: `Écart sur quantité globale de la ${m.nom}`,
            attendu: m.quantiteGlobale,
            calcul: `(${qte(m.auMixPrevu)} − ${qte(m.qp)}) × ${eur(m.margePreetablie)} = ${eur(m.quantiteGlobale)}`,
          },
          {
            libelle: `Écart sur composition de la ${m.nom}`,
            attendu: m.composition,
            calcul: `(${qte(m.qr)} − ${qte(m.auMixPrevu)}) × ${eur(m.margePreetablie)} = ${eur(m.composition)}`,
          },
        ]);
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        return [
          `En ligne, chaque modèle retrouve son écart sur volume : ${x.parModele.map((m) => `${m.nom}, ${eur(m.quantiteGlobale)} + ${entre(m.composition)} = ${eur(m.volume)}`).join(" ; ")}.`,
          `En colonne, on retrouve les écarts du trimestre : quantité globale ${x.parModele.map((m) => entre(m.quantiteGlobale)).join(" + ")} = ${eur(x.quantiteGlobale)}, composition ${x.parModele.map((m) => entre(m.composition)).join(" + ")} = ${eur(x.composition)}. Les deux lectures concordent : c'est la vérification à faire avant de commenter.`,
        ];
      },
    },
    {
      id: "le-mix-qui-masque",
      type: "choix",
      titre: "Un mix favorable",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        return `L'écart sur composition est ${sens(x.composition)} de ${eur(Math.abs(x.composition))}, l'écart sur volume n'est que de ${eur(x.volume)}. Le directeur commercial conclut que ses volumes sont bons. Que lui répondez-vous ?`;
      },
      options: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return [
          {
            texte: `Le volume total a baissé : ${qte(Math.abs(x.ecartDeQuantiteTotale))} enceintes de moins coûtent ${eur(Math.abs(x.quantiteGlobale))}, que le mix compense sans les effacer`,
            juste: true,
            retour: `Oui. L'écart sur quantité globale, ${eur(x.quantiteGlobale)}, dit que l'usine a vendu moins d'enceintes que prévu ; le glissement vers la ${b!.nom} (${eur(x.composition)}) le masque. Un mix favorable sur un volume en baisse reste une baisse : si la ${a!.nom} continue de reculer, le mix ne suffira plus.`,
          },
          {
            texte: `Il a raison : l'écart sur volume, ${eur(x.volume)}, est négligeable`,
            juste: false,
            retour: `Non : c'est croire qu'un écart sur volume presque nul veut dire que le volume a tenu. Il cache ${eur(x.quantiteGlobale)} de quantité globale et ${eur(x.composition)} de composition.`,
          },
          {
            texte: `Il a raison : le mix a fait gagner ${eur(Math.abs(x.composition))} à la marge`,
            juste: false,
            retour: `Non : le mix ne se lit pas seul. Il compense une perte de ${eur(Math.abs(x.quantiteGlobale))} sur la quantité totale vendue ; additionnés avec leur signe, les deux ne font que ${eur(x.volume)}.`,
          },
          {
            texte: `Les quantités ont rapporté ${eur(x.quantitesSurCa)} : le volume est même favorable`,
            juste: false,
            retour: `Non : c'est valoriser le volume au prix de vente. À la marge préétablie, les quantités font ${eur(x.volume)}.`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-des-ventes",
      type: "simulation",
      titre: "Le laboratoire des ventes",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return `Les coûts préétablis ne bougent pas. Faites varier les quantités et les prix de la ${a!.nom} et de la ${b!.nom} : le tableau suit le chiffre d'affaires, la marge et chaque écart sur marge, en effet sur le résultat. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        const L = LEVIERS_DES_VENTES;
        return [
          { code: "qa", libelle: `${a!.nom} vendues`, unite: "enceintes", ...L.quantite[a!.code], depart: a!.qr },
          { code: "pa", libelle: `Prix de la ${a!.nom}`, unite: "€", ...L.prix[a!.code], depart: a!.pr },
          { code: "qb", libelle: `${b!.nom} vendues`, unite: "enceintes", ...L.quantite[b!.code], depart: b!.qr },
          { code: "pb", libelle: `Prix de la ${b!.nom}`, unite: "€", ...L.prix[b!.code], depart: b!.pr },
        ];
      },
      lecture: (c, p) => {
        const x = ventesEtMarge(c);
        const l = laboratoireDesVentes(x, p);
        const d = laboratoireDesVentes(x, { qa: x.parModele[0]!.qr, pa: x.parModele[0]!.pr, qb: x.parModele[1]!.qr, pb: x.parModele[1]!.pr });
        return [
          { libelle: "Chiffre d'affaires", montant: l.chiffreDAffaires, reference: d.chiffreDAffaires },
          { libelle: "Marge au coût préétabli", montant: l.marge, reference: d.marge },
          { libelle: "Écart sur prix de vente", montant: l.prix, reference: d.prix, effet: true },
          { libelle: "Écart sur quantité globale", montant: l.quantiteGlobale, reference: d.quantiteGlobale, effet: true },
          { libelle: "Écart sur composition des ventes", montant: l.composition, reference: d.composition, effet: true },
          { libelle: "Écart sur marge", montant: l.ecartSurMarge, reference: d.ecartSurMarge, effet: true, fort: true },
        ];
      },
      defi: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return {
          consigne: `Retrouvez au moins la marge préétablie prévue, ${eur(x.margePrevue)}, en vendant moins de ${qte(x.qTotalePrevue)} enceintes.`,
          atteint: (p) => {
            const l = laboratoireDesVentes(x, p);
            return l.total < x.qTotalePrevue && l.marge >= x.margePrevue;
          },
          indice: (p) => {
            const l = laboratoireDesVentes(x, p);
            return l.total >= x.qTotalePrevue
              ? `Vous vendez ${qte(l.total)} enceintes : le défi en demande moins de ${qte(x.qTotalePrevue)}.`
              : `La marge est de ${eur(l.marge)}, ${eur(auCentime(x.margePrevue - l.marge))} sous la marge prévue. Une ${b!.nom} à ${eur(p.pb!)} marge ${eur(auCentime(p.pb! - b!.coutPreetabli))}, une ${a!.nom} à ${eur(p.pa!)}, ${eur(auCentime(p.pa! - a!.coutPreetabli))} : jouez sur le partage ou sur les prix.`;
          },
          solution: SOLUTION_DU_LABORATOIRE,
        };
      },
      explication: (c, p) => {
        const x = ventesEtMarge(c);
        const l = laboratoireDesVentes(x, p);
        return [
          `Avec ${qte(l.total)} enceintes, moins que les ${qte(x.qTotalePrevue)} prévues, la marge atteint ${eur(l.marge)} : écart sur quantité globale ${eur(l.quantiteGlobale)}, sur composition ${eur(l.composition)}, sur prix ${eur(l.prix)}. Le volume total peut baisser sans que la marge baisse, si le mix ou les prix compensent.`,
          "C'est aussi pourquoi un mix favorable ne dit rien du marché : le même écart sur marge peut cacher une quantité globale en recul. On lit les trois écarts, jamais le seul total.",
        ];
      },
    },
    {
      id: "une-autre-composition",
      type: "montants",
      titre: "Variante : une autre composition prévue",
      notions: ["contribution_margin", "volume_price_variance"],
      tableau: (c) => {
        const x = ventesEtMarge(c);
        return {
          titre: "Le budget de la variante",
          colonnes: ["Ventes prévues", "Composition prévue", "Ventes réelles"],
          lignes: x.parModele.map((m) => ({
            libelle: m.nom,
            valeurs: [qte(x.variante.quantitesPrevues[m.code]), pct(COMPOSITION_PREVUE_VARIANTE[m.code]), qte(m.qr)],
          })),
        };
      },
      question: (c) => {
        const x = ventesEtMarge(c);
        return `Supposez un budget qui aurait prévu le même total, ${qte(x.qTotalePrevue)} enceintes, mais avec la composition du tableau. Les ventes réelles, les prix et les coûts préétablis ne changent pas. Calculez la marge préétablie moyenne prévue, l'écart sur quantité globale et l'écart sur composition des ventes. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = ventesEtMarge(c);
        const v = x.variante;
        return [
          {
            libelle: "Marge préétablie moyenne prévue de la variante",
            attendu: v.margeMoyennePrevue,
            calcul: `(${x.parModele.map((m) => `${qte(v.quantitesPrevues[m.code])} × ${eur(m.margePreetablie)}`).join(" + ")}) ÷ ${qte(x.qTotalePrevue)} = ${eur(v.margePrevue)} ÷ ${qte(x.qTotalePrevue)} = ${eur(v.margeMoyennePrevue)}`,
          },
          {
            libelle: "Écart sur quantité globale de la variante",
            attendu: v.quantiteGlobale,
            calcul: `(${qte(x.qTotaleReelle)} − ${qte(x.qTotalePrevue)}) × ${eur(v.margeMoyennePrevue)} = ${eur(v.quantiteGlobale)}`,
          },
          {
            libelle: "Écart sur composition de la variante",
            attendu: v.composition,
            calcul: `${x.parModele.map((m) => `(${qte(m.qr)} − ${qte(v.auMixPrevu[m.code])}) × ${eur(m.margePreetablie)}`).join(" + ")} = ${eur(v.composition)}`,
          },
        ];
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        const v = x.variante;
        const [, b] = x.parModele;
        return [
          `Les mêmes ventes réelles donnent cette fois un écart sur composition ${sens(v.composition)} de ${eur(Math.abs(v.composition))} : face à un budget qui attendait plus de ${b!.nom}, les ventes réelles en ont moins. Un mix n'est pas bon ou mauvais en soi, il l'est face au budget.`,
          `L'écart sur volume de la variante, ${eur(v.quantiteGlobale)} + ${entre(v.composition)} = ${eur(v.volume)}, se retrouve aussi modèle par modèle, sur les ventes prévues de la variante. Refaire l'analyse, ce n'est pas reprendre la recette : la marge moyenne prévue et les ventes à la composition prévue changent avec le budget.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver un prix de vente à rebours",
      notions: ["volume_price_variance"],
      question: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return `Au trimestre suivant, avec les mêmes quantités vendues (${qte(a!.qr)} ${a!.nom}, ${qte(b!.qr)} ${b!.nom}), le commercial ne remonte que l'écart sur prix total, ${eur(ECART_SUR_PRIX_A_REBOURS)}, et le prix de la ${a!.nom}, ${eur(PRIX_DE_LA_NOMADE_A_REBOURS)}. Les prix prévus sont ceux du budget. Retrouvez l'écart sur prix de la ${a!.nom}, celui de la ${b!.nom}, puis le prix réel de la ${b!.nom}. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = ventesEtMarge(c);
        const [a, b] = x.parModele;
        return [
          {
            libelle: `Écart sur prix de la ${a!.nom}, au trimestre suivant`,
            attendu: x.partDeLaNomadeARebours,
            calcul: `(${eur(PRIX_DE_LA_NOMADE_A_REBOURS)} − ${eur(a!.pp)}) × ${qte(a!.qr)} = ${eur(x.partDeLaNomadeARebours)}`,
          },
          {
            libelle: `Écart sur prix de la ${b!.nom}, au trimestre suivant`,
            attendu: x.partDeLaSalonARebours,
            calcul: `${eur(ECART_SUR_PRIX_A_REBOURS)} − ${entre(x.partDeLaNomadeARebours)} = ${eur(x.partDeLaSalonARebours)}`,
          },
          {
            libelle: `Prix réel de la ${b!.nom}, au trimestre suivant`,
            attendu: x.prixDeLaSalonARebours,
            calcul: `${eur(b!.pp)} + ${entre(x.partDeLaSalonARebours)} ÷ ${qte(b!.qr)} = ${eur(x.prixDeLaSalonARebours)}`,
          },
        ];
      },
      explication: (c) => {
        const x = ventesEtMarge(c);
        const [, b] = x.parModele;
        return [
          `L'écart sur prix total est la somme des écarts de chaque modèle : celui de la ${b!.nom} s'obtient par différence, et son prix réel en divisant par les quantités réelles, puisque c'est sur elles que l'écart sur prix se calcule. Diviser par les quantités prévues donnerait un autre prix, faux.`,
        ];
      },
    },
    {
      id: "qui-doit-agir",
      type: "tri",
      titre: "Qui doit agir",
      notions: ["volume_price_variance"],
      question: () =>
        "Rangez chaque écart sur marge chez celui qui peut agir dessus. Le modèle ne connaît pas les causes, seulement les écarts : on désigne qui doit expliquer, pas un coupable.",
      categories: [
        { code: "commercial", libelle: "Le commercial" },
        { code: "direction", libelle: "La direction" },
      ],
      elements: (c) => {
        const x = ventesEtMarge(c);
        return [
          ...x.parModele.map((m) => ({
            libelle: `Écart sur prix de la ${m.nom}`,
            montant: m.prix,
            categorie: "commercial",
            pourquoi: "Le prix consenti au client : remises, négociation, politique tarifaire appliquée.",
          })),
          {
            libelle: "Écart sur composition des ventes",
            montant: x.composition,
            categorie: "commercial",
            pourquoi: "Ce que l'on pousse à la vente, modèle par modèle : l'effort commercial se lit dans le mix.",
          },
          {
            libelle: "Écart sur quantité globale",
            montant: x.quantiteGlobale,
            categorie: "direction",
            pourquoi: "Le volume total vendu : le marché, la capacité, le niveau du budget lui-même, que la direction a fixé.",
          },
        ];
      },
      explication: () => [
        "Le commercial répond des prix et de la composition ; la quantité globale dépend aussi du marché et du budget que la direction a fixé. Un écart ne dit jamais sa cause : il désigne qui doit l'expliquer.",
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["contribution_margin", "volume_price_variance"],
      tableau: (c) => tableauDeLaMarge(ventesEtMarge(c)),
      texte: (c) => {
        const x = ventesEtMarge(c);
        return [
          `Le chiffre d'affaires du trimestre est à ${eur(x.ecartDeCa)} du budget ; la marge, à ${eur(x.ecartSurMarge)}. L'écart sur marge se partage en écart sur prix de vente (${eur(x.prix)}), écart sur quantité globale (${eur(x.quantiteGlobale)}) et écart sur composition des ventes (${eur(x.composition)}), et le tableau le montre modèle par modèle.`,
          "Trois pièges. Un écart global faible peut cacher deux écarts forts de sens contraire. Le volume se juge à la marge préétablie, jamais au prix. Et un mix favorable peut masquer une baisse du volume total, comme un mix défavorable peut venir d'un budget qui attendait autre chose.",
          "Au niveau de l'examen, vous savez décomposer l'écart sur marge en écart sur prix, sur quantité globale et sur composition, modèle par modèle, vérifier que les deux lectures du volume concordent, refaire l'analyse pour un autre budget, et remonter d'un écart à un prix réel.",
          "Dans l'arène, les chiffres de votre usine seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Écart sur prix = Σ (prix réel − prix prévu) × quantité réelle. Écart sur volume = Σ (quantité réelle − quantité prévue) × marge préétablie = écart sur quantité globale + écart sur composition. Quantité globale = (Q totale réelle − Q totale prévue) × marge moyenne prévue. Composition = Σ (Q réelle − Q totale réelle × part prévue) × marge préétablie.",
    },
  ],
};
