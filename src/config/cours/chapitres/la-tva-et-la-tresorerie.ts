import type { Cas } from "../cas";
import { JOURS_DE_L_ANNEE_BANCAIRE, JOURS_DE_L_ANNEE_CIVILE, type FicheDuBatiment } from "../monde/delais-et-tva";
import { fluxDeTvaDuTrimestre, tvaALaCloture, type LeviersDeLaTva } from "../monde/delais";
import { AGENCEMENTS_DORIAC, LOGISTIQUE_VARENNE, RELANCES, TAUX_DES_PENALITES, clientDefaillant, suivreUnMauvaisPayeur } from "../monde/mauvais-payeurs";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_TVA, FINS_DES_TRIMESTRES, POURQUOI_LA_TVA, entre, eur, ficheDe, jours, nomDuTrimestre, pct } from "./la-declaration-de-tva";

/**
 * CHAPITRE : LA TVA ET LA TRÉSORERIE : QUI FAIT CRÉDIT À QUI (fiscalité, palier 3 ; BTS CG, DCG UE4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : MARTEL & FILS,
 * l'entreprise de bâtiment du chapitre « La déclaration de TVA », a une fiche figée
 * (monde/delais-et-tva.ts), et la TVA de sa trésorerie se calcule par le modèle du cours
 * (monde/delais.ts : `tvaALaCloture`, `fluxDeTvaDuTrimestre`). Une évolution du moteur ne change rien
 * ici.
 *
 * L'objet : à une clôture, ce que la TVA laisse en trésorerie = dette envers l'État + TVA des dettes
 * au négoce − TVA des créances clients DÉJÀ DÉCLARÉE (la TVA avancée). C'est exactement l'écart de
 * trésorerie avec et sans TVA ; le résultat, lui, ne bouge pas. Qui finance la TVA des clients :
 * personne quand elle n'est pas encore due (le régime des encaissements, celui de MARTEL & FILS),
 * l'État, l'État et le négoce, ou l'entreprise elle-même (avec l'option pour les débits). Puis la TVA
 * dans les flux d'un trimestre (encaissée, payée, versée).
 *
 * Le piège central : croire qu'un délai client fait toujours avancer la TVA. Pour des travaux, la TVA
 * n'est due qu'à l'encaissement : MARTEL & FILS n'avance rien, à aucun délai. Avec l'option pour les
 * débits, au 30 juin, elle avancerait 5 600 € : la question se pose au régime des débits, et se
 * compare au régime réel.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, au-30-juin, qui-finance-au-regime-reel (la formule est au repère ou dans la
 *     question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-l-option puis
 *     le-delai-au-curseur (aux débits, le délai des entreprises : au-delà de 48 jours, MARTEL & FILS
 *     avance la TVA de ses clients) avant aux-debits et qui-fait-credit ; predire-le-negoce puis
 *     le-negoce-au-curseur (aux débits, le délai du négoce : à 57 jours, il couvre ce que l'État ne
 *     couvre pas) avant la-dette-au-negoce ;
 *   · autonome : aux-debits, qui-fait-credit, la-dette-au-negoce, sans-tva, l-ete (ni formule ni
 *     chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : l-ete-aux-debits (une variante chiffrée : les flux de l'été avec l'option),
 *     le-laboratoire-de-la-tresorerie (régime, délais des entreprises, des collectivités et du négoce ;
 *     le graphique de qui finance la TVA des créances, qui casse aux délais où l'État, puis le négoce,
 *     ne suffisent plus ; défi : opter pour les débits sans rien avancer, les entreprises restant à
 *     60 jours), a-rebours (retrouver les créances à partir de ce que la TVA laisse), l-argent-de-la-tva
 *     (la critique : cet argent n'est pas une ressource), le-client-en-retard et le-client-defaillant
 *     (les mauvais payeurs de monde/mauvais-payeurs.ts : un retard, puis une perte, aux encaissements) ;
 *     puis la synthèse.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : le bilan du moteur et ses créances TTC « au délai de la clientèle »,
 * « l'arène rejoue l'année sans TVA » (l'effet calculé EST l'écart de trésorerie avec et sans TVA, et
 * le résultat ne bouge pas : la TVA n'est pas une charge), le budget de trésorerie du moteur (ses
 * lignes sont maintenant celles du modèle), et le texte « l'arène fait comme si l'entreprise avait
 * opté pour les débits », qui s'inverse : le régime réel est celui des encaissements, l'option est la
 * variante. Le transport sort du chapitre.
 */

/** Le trimestre dont le chapitre lit la clôture : le deuxième, au 30 juin, celui du crédit de TVA. */
export const TRIMESTRE_DE_LA_CLOTURE = 2;

/** Le trimestre dont le chapitre lit les flux : le troisième, qui reçoit le crédit du printemps. */
export const TRIMESTRE_DES_FLUX = 3;

/** Les bornes du délai des entreprises au curseur et au laboratoire, en jours : jusqu'à un trimestre (au-delà de 60, un retard). */
export const DELAI_DES_ENTREPRISES = { min: 0, max: 90 } as const;

/** Les bornes du délai du négoce, en jours : jusqu'au délai maximal convenu entre professionnels. */
export const DELAI_DU_NEGOCE = { min: 0, max: 60 } as const;

/** Les bornes du délai des collectivités au laboratoire, en jours : au plus le délai de la commande publique. */
export const DELAI_DES_COLLECTIVITES = { min: 0, max: 30 } as const;

const auCentime = (x: number) => Math.round(x * 100) / 100;
const AUX_DEBITS: Partial<LeviersDeLaTva> = { regime: "debits" };

/** Au 30 juin, avec l'option pour les débits, les entreprises payant à j jours (le premier curseur). */
export const juinAuxDebitsAuDelai = (f: FicheDuBatiment, j: number) => tvaALaCloture(f, TRIMESTRE_DE_LA_CLOTURE, { regime: "debits", delais: { entreprises: j } });

/** Au 30 juin, avec l'option pour les débits, le négoce payé à d jours (le second curseur). */
export const juinAuxDebitsAuNegoce = (f: FicheDuBatiment, d: number) => tvaALaCloture(f, TRIMESTRE_DE_LA_CLOTURE, { regime: "debits", delaiFournisseur: d });

/** Les leviers du laboratoire, codés : régime (0 encaissements, 1 débits), délais des entreprises, des collectivités et du négoce. */
export interface PositionDeLaTresorerie {
  regime: number;
  entreprises: number;
  collectivites: number;
  negoce: number;
}

const leviersDe = (p: PositionDeLaTresorerie): Partial<LeviersDeLaTva> => ({
  regime: p.regime === 1 ? "debits" : "encaissements",
  delais: { entreprises: p.entreprises, collectivites: p.collectivites },
  delaiFournisseur: p.negoce,
});

/**
 * Qui finance la TVA des créances, en montants : celle qui n'est pas encore due ; celle déjà déclarée
 * que couvrent la dette envers l'État (si elle est positive) et la TVA due au négoce ; celle que
 * l'entreprise avance elle-même.
 */
export function partsDeLaTvaDesCreances(x: ReturnType<typeof tvaALaCloture>) {
  const pasEncoreDue = auCentime(x.tvaDesCreances - x.tvaAvancee);
  const couverture = auCentime(Math.max(0, x.detteEtat) + x.tvaDesDettes);
  const couverte = auCentime(Math.min(x.tvaAvancee, couverture));
  return { pasEncoreDue, couverte, avancee: auCentime(x.tvaAvancee - couverte) };
}

/** La TVA au 30 juin et sur les clôtures de l'année, pour une position des leviers du laboratoire. */
export function laboratoireDeLaTresorerie(f: FicheDuBatiment, p: PositionDeLaTresorerie) {
  const l = leviersDe(p);
  const juin = tvaALaCloture(f, TRIMESTRE_DE_LA_CLOTURE, l);
  const effets = [1, 2, 3, 4].map((r) => tvaALaCloture(f, r, l).effet);
  return { juin, parts: partsDeLaTvaDesCreances(juin), auPlusBas: Math.min(...effets) };
}

/** La position du laboratoire tirée de la fiche : son régime, ses délais. */
export function departDeLaTresorerie(f: FicheDuBatiment): PositionDeLaTresorerie {
  const delai = (code: string) => f.clienteles.find((g) => g.code === code)!.delai;
  return { regime: f.declaration.regime === "debits" ? 1 : 0, entreprises: delai("entreprises"), collectivites: delai("collectivites"), negoce: f.fournisseur.delai };
}

/** Les créances retrouvées à rebours : leur TVA = dette envers l'État + TVA due au fournisseur − ce que la TVA laisse ; puis HT et TTC. */
export function creancesARebours(detteEtat: number, tvaDesDettes: number, effet: number, taux: number) {
  const tva = auCentime(detteEtat + tvaDesDettes - effet);
  const ht = auCentime(tva / taux);
  return { tva, ht, ttc: auCentime(ht * (1 + taux)) };
}

/** Tout ce que le chapitre et son cas demandent de la TVA dans la trésorerie de MARTEL & FILS. */
export function tvaEtTresorerie(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = f.tauxDeTva;
  const clotures = [0, 1, 2, 3, 4].map((r) => tvaALaCloture(f, r));
  const cloturesAuxDebits = [0, 1, 2, 3, 4].map((r) => tvaALaCloture(f, r, AUX_DEBITS));
  const juin = clotures[TRIMESTRE_DE_LA_CLOTURE]!;
  const juinAuxDebits = cloturesAuxDebits[TRIMESTRE_DE_LA_CLOTURE]!;
  // Le premier curseur : le plus long délai des entreprises où, aux débits, la TVA ne retire rien au 30 juin.
  let delaiSansAvance = DELAI_DES_ENTREPRISES.min;
  for (let j = DELAI_DES_ENTREPRISES.min; j <= DELAI_DES_ENTREPRISES.max; j++) if (juinAuxDebitsAuDelai(f, j).effet >= 0) delaiSansAvance = j;
  // Le second : le plus court délai du négoce qui, aux débits, couvre la TVA des créances au 30 juin.
  let negoceQuiCouvre = DELAI_DU_NEGOCE.max;
  for (let d = DELAI_DU_NEGOCE.max; d >= DELAI_DU_NEGOCE.min; d--) if (juinAuxDebitsAuNegoce(f, d).effet >= 0) negoceQuiCouvre = d;
  const decembreAuxDebits = cloturesAuxDebits[4]!;
  return {
    f,
    t,
    clotures,
    cloturesAuxDebits,
    juin,
    juinAuxDebits,
    partsAuxDebits: partsDeLaTvaDesCreances(juinAuxDebits),
    delaiDesEntreprises: f.clienteles.find((g) => g.code === "entreprises")!.delai,
    delaiSansAvance,
    negoceQuiCouvre,
    juinAuNegoceQuiCouvre: juinAuxDebitsAuNegoce(f, negoceQuiCouvre),
    ete: fluxDeTvaDuTrimestre(f, TRIMESTRE_DES_FLUX),
    eteAuxDebits: fluxDeTvaDuTrimestre(f, TRIMESTRE_DES_FLUX, AUX_DEBITS),
    decembre: clotures[4]!,
    decembreAuxDebits,
    /** Le rebours : les créances, retrouvées à partir de ce que la TVA laisse au 31 décembre, aux débits. */
    creancesARebours: creancesARebours(decembreAuxDebits.detteEtat, decembreAuxDebits.tvaDesDettes, decembreAuxDebits.effet, t),
    depart: departDeLaTresorerie(f),
  };
}

export type TvaEtTresorerie = ReturnType<typeof tvaEtTresorerie>;

/**
 * LES MAUVAIS PAYEURS DE MARTEL & FILS (hypothèses du cours, monde/mauvais-payeurs.ts, qui ne
 * changent aucun chiffre de la fiche) : Logistique Varenne paie en retard, Agencements Doriac est en
 * redressement judiciaire. Le chapitre y lit ce que le régime des encaissements change à un retard,
 * puis à une perte.
 */
export function mauvaisPayeursDeMartel(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  return { f, v: suivreUnMauvaisPayeur(LOGISTIQUE_VARENNE), d: clientDefaillant(AGENCEMENTS_DORIAC), doriac: AGENCEMENTS_DORIAC };
}


const juinDit = FINS_DES_TRIMESTRES[TRIMESTRE_DE_LA_CLOTURE]!;
const septembreDit = FINS_DES_TRIMESTRES[TRIMESTRE_DES_FLUX]!;

/** Le bilan du 30 juin, ce qui touche à la TVA. */
function tableauDuBilan(k: TvaEtTresorerie, auxDebits: boolean): TableauDeDonnees {
  const j = auxDebits ? k.juinAuxDebits : k.juin;
  return {
    titre: `Le bilan de ${k.f.entreprise} au ${juinDit}, ${auxDebits ? "avec l'option pour les débits" : "au régime des encaissements"} (extrait)`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Créances clients (TTC)", valeurs: [eur(j.creancesTTC)] },
      { libelle: `Dettes au négoce (TTC)`, valeurs: [eur(j.dettesTTC)] },
      j.detteEtat < 0
        ? { libelle: "État, crédit de TVA à imputer (une créance)", valeurs: [eur(-j.detteEtat)] }
        : { libelle: "État, TVA à payer du trimestre", valeurs: [eur(j.detteEtat)] },
    ],
  };
}

export const LA_TVA_ET_LA_TRESORERIE: Chapitre = {
  code: "la-tva-et-la-tresorerie",
  parcours: "fiscalite",
  palier: 3,
  blocs: ["BTS CG P3 · Gestion des obligations fiscales", "DCG UE4 · Droit fiscal"],
  titre: "La TVA et la trésorerie : qui fait crédit à qui",
  accroche:
    "La TVA ne coûte rien à MARTEL & FILS, mais elle passe par sa caisse : les clients la paient avec leurs factures, le négoce attend la sienne, l'État la reçoit au trimestre suivant. Ce qu'elle laisse en trésorerie, ce qu'elle y retirerait avec l'option pour les débits, et qui fait crédit à qui.",
  objectifs: [
    "Retrouver la TVA contenue dans les créances clients et les dettes fournisseurs",
    "Calculer ce que la TVA laisse ou retire en trésorerie à une clôture, selon le régime d'exigibilité",
    "Dire qui finance la TVA des clients : personne, l'État, le fournisseur ou l'entreprise",
    "Lire la TVA encaissée, payée et versée dans les flux d'un trimestre",
    "Distinguer l'effet de la TVA sur le résultat et sur la trésorerie, et retrouver des créances à rebours",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_TVA, pourquoi: POURQUOI_LA_TVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois délais pour une même taxe",
      notions: ["vat_payable", "payment_terms"],
      tableau: (c) => {
        const k = tvaEtTresorerie(c);
        return {
          titre: `Les délais autour de ${k.f.entreprise}`,
          colonnes: ["Délai de paiement"],
          lignes: [
            ...k.f.clienteles.map((g) => ({ libelle: `Clients : ${g.nom.toLowerCase()}`, valeurs: [jours(g.delai)] })),
            { libelle: `Fournisseur : ${k.f.fournisseur.nom}`, valeurs: [jours(k.f.fournisseur.delai)] },
            { libelle: "État : la TVA à payer du trimestre", valeurs: ["au trimestre suivant"] },
          ],
        };
      },
      texte: (c) => {
        const k = tvaEtTresorerie(c);
        const f = k.f;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, l'entreprise de bâtiment du chapitre « La déclaration de TVA ». La TVA ne lui coûte rien : elle n'est ni une charge ni un produit, et le compte de résultat reste hors taxes. Mais elle passe par sa caisse, à trois rythmes : les clients paient leurs factures toutes taxes comprises, chacun à son délai ; le négoce de matériaux est payé toutes taxes comprises à ${f.fournisseur.delai} jours ; l'État reçoit la TVA à payer d'un trimestre au trimestre suivant.`,
          `Tant que la TVA d'une créance n'est pas due à l'État, l'attendre ne coûte rien. ${f.entreprise} fait des travaux et n'a pas opté pour les débits : la TVA de ses factures n'est due qu'à leur encaissement. Avec l'option, elle serait due à la facture : ${f.entreprise} la déclarerait et la verserait à l'État avant de l'avoir reçue de ses clients. Elle l'avancerait.`,
          `La simulation suppose des flux réguliers : à une clôture, une clientèle doit encore ses travaux du trimestre × délai ÷ 90, et ${f.entreprise} doit au négoce ses matériaux du trimestre × ${f.fournisseur.delai} ÷ 90 ; un seul taux, ${pct(k.t)} ; la TVA des matériaux et du matériel neuf se déduit à la livraison ; un crédit de TVA s'impute sur la déclaration suivante.`,
        ];
      },
      repere: () =>
        "Dans un montant TTC, la TVA vaut TTC × taux ÷ (1 + taux). Ce que la TVA laisse en trésorerie = dette envers l'État + TVA des dettes au négoce − TVA des créances déjà déclarée (la TVA avancée : aucune aux encaissements, toute celle des créances aux débits). Négatif, elle en retire.",
    },
    {
      id: "au-30-juin",
      objectifs: [0, 1],
      type: "montants",
      titre: "Au 30 juin, la TVA qui attend",
      notions: ["vat_payable", "bfr"],
      tableau: (c) => tableauDuBilan(tvaEtTresorerie(c), false),
      question: (c) => {
        const k = tvaEtTresorerie(c);
        const facteur = `${Math.round(k.t * 100)} ÷ ${Math.round((1 + k.t) * 100)}`;
        return `Au ${juinDit}, calculez la TVA contenue dans les créances clients et dans les dettes au négoce (TTC × ${facteur}), puis ce que la TVA laisse en trésorerie : la dette envers l'État (ici un crédit de TVA, à compter en négatif), plus la TVA due au négoce, moins la TVA des créances déjà déclarée (aucune aux encaissements). Négatif si la TVA retire de l'argent de la trésorerie.`;
      },
      champs: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juin;
        const facteur = `× ${Math.round(k.t * 100)} ÷ ${Math.round((1 + k.t) * 100)}`;
        return [
          { libelle: "TVA des créances clients", attendu: j.tvaDesCreances, calcul: `${eur(j.creancesTTC)} ${facteur} = ${eur(j.tvaDesCreances)}` },
          { libelle: "TVA des dettes au négoce", attendu: j.tvaDesDettes, calcul: `${eur(j.dettesTTC)} ${facteur} = ${eur(j.tvaDesDettes)}` },
          {
            libelle: "Ce que la TVA laisse en trésorerie au 30 juin",
            attendu: j.effet,
            calcul: `${entre(j.detteEtat)} + ${eur(j.tvaDesDettes)} − ${eur(j.tvaAvancee)} = ${eur(j.effet)}`,
          },
        ];
      },
      explication: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juin;
        return [
          `Les clients doivent encore ${eur(j.tvaDesCreances)} de TVA, mais elle n'est pas due : ${k.f.entreprise} la déclarera quand ils paieront. Elle garde ${eur(j.tvaDesDettes)} de TVA qu'elle doit au négoce, et l'État lui doit ${eur(-j.detteEtat)} : la TVA laisse ${eur(j.effet)} dans sa trésorerie.`,
          "C'est exactement l'écart avec une trésorerie sans TVA : de l'argent qui n'est pas à l'entreprise, et qui partira.",
        ];
      },
    },
    {
      id: "qui-finance-au-regime-reel",
      objectifs: [2],
      type: "choix",
      titre: "Qui finance la TVA des clients, au régime réel",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Au ${juinDit}, les clients doivent ${eur(k.juin.tvaDesCreances)} de TVA à ${k.f.entreprise}. Qui finance cette TVA en attendant qu'ils paient ?`;
      },
      options: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juin;
        return [
          {
            texte: "Personne : elle n'est pas encore due à l'État",
            juste: j.quiFaitCredit === "personne",
            retour: `Oui : aux encaissements, la TVA d'une facture n'est due qu'à son paiement. ${k.f.entreprise} ne l'a ni déclarée ni versée : attendre ses clients ne lui coûte que le hors taxes de leurs factures.`,
          },
          {
            texte: "L'État, qui attend la TVA du trimestre",
            juste: j.quiFaitCredit === "l-etat",
            retour: `Non : au ${juinDit}, l'État n'attend rien, c'est lui qui doit ${eur(-j.detteEtat)} à ${k.f.entreprise}. Et la TVA des clients n'est pas encore due.`,
          },
          {
            texte: "Le négoce, que l'entreprise n'a pas encore payé",
            juste: j.quiFaitCredit === "le-fournisseur",
            retour: "Non : le négoce fait bien crédit de sa TVA, mais il n'y a pas de TVA des clients à financer : elle n'est pas encore due à l'État.",
          },
          {
            texte: `${k.f.entreprise} elle-même, sur sa trésorerie`,
            juste: j.quiFaitCredit === "l-entreprise",
            retour: `Non : la TVA laisse ${eur(j.effet)} dans sa trésorerie. Elle n'avance rien.`,
          },
        ];
      },
    },
    {
      id: "predire-l-option",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur l'option pour les débits",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Supposez que ${k.f.entreprise} ait opté pour les débits. Au ${juinDit}, la TVA de ses créances (${eur(k.juin.tvaDesCreances)}) serait déjà déclarée, et il n'y aurait plus de crédit de TVA. Pariez : ce que la TVA laisse en trésorerie…`;
      },
      options: (c) => {
        const k = tvaEtTresorerie(c);
        const voir = "Faites varier le délai des entreprises à l'étape suivante : le curseur montre quand la TVA bascule.";
        return [
          { texte: `Deviendrait négatif : ${k.f.entreprise} avancerait de la TVA`, juste: k.juinAuxDebits.effet < 0, retour: `Bon pari. ${voir}` },
          { texte: "Resterait le même : l'option ne change que la date des factures", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Augmenterait : l'option efface le crédit de TVA", juste: k.juinAuxDebits.effet >= 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-delai-au-curseur",
      objectifs: [1],
      type: "curseur",
      titre: "Le délai qui fait avancer la TVA",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juinAuxDebits;
        return `Avec l'option pour les débits, au ${juinDit}, ${k.f.entreprise} doit ${eur(j.detteEtat)} à l'État et ${eur(j.tvaDesDettes)} de TVA au négoce ; ses créances contiennent une TVA déjà déclarée, qui grossit avec le délai des entreprises. Faites varier ce délai de ${DELAI_DES_ENTREPRISES.min} à ${DELAI_DES_ENTREPRISES.max} jours, et placez le curseur sur le plus long délai où la TVA due à l'État et au négoce couvre encore la TVA des créances, puis validez.`;
      },
      grandeur: () => ({ libelle: "Délai des entreprises", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: tvaEtTresorerie(c).delaiSansAvance, min: DELAI_DES_ENTREPRISES.min, max: DELAI_DES_ENTREPRISES.max }),
      zones: ["L'État et le négoce couvrent", "L'entreprise avance"],
      rates: () => ({
        dessous: "Plus loin, l'État et le négoce couvrent encore la TVA des créances : cherchez le plus long délai.",
        dessus: "À cette position, la TVA des créances dépasse déjà ce que l'entreprise doit à l'État et au négoce : elle avance la différence.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, j) => {
        const x = juinAuxDebitsAuDelai(tvaEtTresorerie(c).f, j);
        return [
          { libelle: "TVA des créances, déjà déclarée", montant: x.tvaAvancee },
          { libelle: "Dette envers l'État", montant: x.detteEtat },
          { libelle: "TVA due au négoce", montant: x.tvaDesDettes },
          { libelle: "Ce que la TVA laisse en trésorerie", montant: x.effet, fort: true },
        ];
      },
      droites: (c) => {
        const f = tvaEtTresorerie(c).f;
        return {
          produit: (j) => {
            const x = juinAuxDebitsAuDelai(f, j);
            return x.detteEtat + x.tvaDesDettes;
          },
          cout: (j) => juinAuxDebitsAuDelai(f, j).tvaAvancee,
          libelles: ["TVA due à l'État et au négoce", "TVA des créances, déjà déclarée"],
        };
      },
      explication: (c) => {
        const k = tvaEtTresorerie(c);
        const limite = juinAuxDebitsAuDelai(k.f, k.delaiSansAvance);
        const enRetard = tvaALaCloture(k.f, TRIMESTRE_DE_LA_CLOTURE, { delais: { entreprises: DELAI_DES_ENTREPRISES.max } });
        return [
          `À ${k.delaiSansAvance} jours, la TVA des créances (${eur(limite.tvaAvancee)}) égale ce que ${k.f.entreprise} doit à l'État et au négoce. Au-delà, elle avance la différence : à ${k.delaiDesEntreprises} jours, le délai des entreprises, ${eur(-k.juinAuxDebits.effet)}. L'État ne change rien à sa demande quand le délai s'allonge : aux débits, il attend la TVA des factures, payées ou non.`,
          `Au régime réel, le même délai ne fait rien avancer : la TVA des créances n'est pas due, et la TVA laisse ${eur(k.juin.effet)} en trésorerie à ${k.delaiDesEntreprises} jours, et encore ${eur(enRetard.effet)} si les entreprises payaient à ${DELAI_DES_ENTREPRISES.max} jours, en retard.`,
        ];
      },
    },
    {
      id: "aux-debits",
      objectifs: [1],
      type: "montants",
      titre: "Le 30 juin, avec l'option",
      notions: ["vat_payable", "bfr"],
      tableau: (c) => tableauDuBilan(tvaEtTresorerie(c), true),
      question: () =>
        "Avec l'option pour les débits, refaites le 30 juin : la TVA des créances déjà déclarée, la dette envers l'État, puis ce que la TVA laisse en trésorerie (négatif si elle en retire).",
      champs: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juinAuxDebits;
        return [
          { libelle: "TVA avancée pour les clients", attendu: j.tvaAvancee, calcul: `toute la TVA des créances, ${eur(j.creancesTTC)} × ${Math.round(k.t * 100)} ÷ ${Math.round((1 + k.t) * 100)} = ${eur(j.tvaAvancee)}` },
          { libelle: "Dette envers l'État, aux débits", attendu: j.detteEtat, calcul: `la TVA à payer du ${nomDuTrimestre(TRIMESTRE_DE_LA_CLOTURE)} aux débits : ${eur(j.detteEtat)}` },
          { libelle: "Ce que la TVA laisse en trésorerie, aux débits", attendu: j.effet, calcul: `${eur(j.detteEtat)} + ${eur(j.tvaDesDettes)} − ${eur(j.tvaAvancee)} = ${eur(j.effet)}` },
        ];
      },
      explication: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juinAuxDebits;
        return [
          `L'option ne change ni les clients ni le négoce. Elle change deux choses : la TVA des créances, ${eur(j.tvaAvancee)}, est déjà déclarée ; et la dette envers l'État passe d'un crédit de ${eur(-k.juin.detteEtat)} à ${eur(j.detteEtat)} à payer. ${j.effet < 0 ? `La TVA retire ${eur(-j.effet)} de la trésorerie` : `La TVA laisse ${eur(j.effet)} en trésorerie`} au lieu d'y laisser ${eur(k.juin.effet)} : ${eur(auCentime(k.juin.effet - j.effet))} d'écart, que le régime réel épargne à ${k.f.entreprise}.`,
        ];
      },
    },
    {
      id: "qui-fait-credit",
      objectifs: [2],
      type: "choix",
      titre: "Qui fait crédit à qui, avec l'option",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juinAuxDebits;
        return `Avec l'option, au ${juinDit} : la TVA déjà déclarée des créances vaut ${eur(j.tvaAvancee)}, ${k.f.entreprise} doit ${eur(j.detteEtat)} à l'État et ${eur(j.tvaDesDettes)} de TVA au négoce. Qui finance la TVA de ses clients ?`;
      },
      options: (c) => {
        const k = tvaEtTresorerie(c);
        const j = k.juinAuxDebits;
        const q = j.quiFaitCredit;
        const decembre = k.decembreAuxDebits;
        return [
          {
            texte: "Personne : elle n'est pas encore due",
            juste: q === "personne",
            retour: `Non : c'est le régime réel de ${k.f.entreprise}. Avec l'option, la TVA des créances est déclarée à la facture, payée ou non.`,
          },
          {
            texte: "L'État seul, avec la TVA qui lui est due",
            juste: q === "l-etat",
            retour: q === "l-etat" ? "Oui." : `Non : les ${eur(j.detteEtat)} dus à l'État ne couvrent pas les ${eur(j.tvaAvancee)} de TVA des créances.`,
          },
          {
            texte: "L'État et le négoce ensemble",
            juste: q === "le-fournisseur",
            retour: q === "le-fournisseur" ? "Oui." : `Non : même ensemble, ils ne couvrent que ${eur(auCentime(j.detteEtat + j.tvaDesDettes))} des ${eur(j.tvaAvancee)}.`,
          },
          {
            texte: `${k.f.entreprise} elle-même, en partie`,
            juste: q === "l-entreprise",
            retour: `Oui : l'État (${eur(j.detteEtat)}) et le négoce (${eur(j.tvaDesDettes)}) ne couvrent que ${eur(auCentime(j.detteEtat + j.tvaDesDettes))} des ${eur(j.tvaAvancee)} : ${k.f.entreprise} avance ${eur(-j.effet)}. Aux autres clôtures, avec l'option, l'État suffit : au ${FINS_DES_TRIMESTRES[4]}, il attend ${eur(decembre.detteEtat)} pour ${eur(decembre.tvaAvancee)} de TVA des créances. Au régime réel, personne n'a rien à financer.`,
          },
        ];
      },
    },
    {
      id: "predire-le-negoce",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le délai du négoce",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Avec l'option, ${k.f.entreprise} avance ${eur(-k.juinAuxDebits.effet)} de TVA au ${juinDit}. Sans toucher au délai de ses clients, elle pourrait ne plus rien avancer en payant le négoce…`;
      },
      options: (c) => {
        const k = tvaEtTresorerie(c);
        const voir = "Faites varier le délai du négoce à l'étape suivante : le curseur montre où il couvre ce que l'État ne couvre pas.";
        return [
          { texte: "Plus tard, sans sortir du délai légal", juste: k.juinAuNegoceQuiCouvre.effet >= 0, retour: `Bon pari. ${voir}` },
          { texte: "Plus tard, mais au-delà du délai légal", juste: k.juinAuNegoceQuiCouvre.effet < 0, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus tôt, pour déduire sa TVA plus vite", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-negoce-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Le négoce qui fait crédit",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Avec l'option pour les débits, les entreprises à ${k.delaiDesEntreprises} jours : faites varier le délai de paiement du négoce, de ${DELAI_DU_NEGOCE.min} à ${DELAI_DU_NEGOCE.max} jours, le maximum entre professionnels. Placez le curseur sur le plus court délai où la TVA due à l'État et au négoce couvre la TVA des créances, puis validez.`;
      },
      grandeur: () => ({ libelle: "Délai de paiement du négoce", unite: "jours" }),
      cible: (c) => ({ attendu: tvaEtTresorerie(c).negoceQuiCouvre, min: DELAI_DU_NEGOCE.min, max: DELAI_DU_NEGOCE.max }),
      zones: ["L'État et le négoce couvrent", "L'entreprise avance"],
      rates: () => ({
        dessous: "À cette position, l'entreprise avance encore de la TVA : le négoce ne fait pas assez crédit.",
        dessus: "Plus court, le négoce couvre encore la TVA des créances : cherchez le plus court délai.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, d) => {
        const x = juinAuxDebitsAuNegoce(tvaEtTresorerie(c).f, d);
        return [
          { libelle: "Dette au négoce (TTC)", montant: x.dettesTTC },
          { libelle: "TVA due au négoce", montant: x.tvaDesDettes },
          { libelle: "Dette envers l'État", montant: x.detteEtat },
          { libelle: "TVA des créances, déjà déclarée", montant: x.tvaAvancee },
          { libelle: "Ce que la TVA laisse en trésorerie", montant: x.effet, fort: true },
        ];
      },
      droites: (c) => {
        const f = tvaEtTresorerie(c).f;
        return {
          produit: (d) => {
            const x = juinAuxDebitsAuNegoce(f, d);
            return x.detteEtat + x.tvaDesDettes;
          },
          cout: (d) => juinAuxDebitsAuNegoce(f, d).tvaAvancee,
          libelles: ["TVA due à l'État et au négoce", "TVA des créances, déjà déclarée"],
        };
      },
      explication: (c) => {
        const k = tvaEtTresorerie(c);
        const x = k.juinAuNegoceQuiCouvre;
        return [
          `À ${k.negoceQuiCouvre} jours, le négoce ferait crédit de ${eur(x.tvaDesDettes)} de TVA : avec les ${eur(x.detteEtat)} dus à l'État, de quoi couvrir les ${eur(x.tvaAvancee)} de TVA des créances. Ce serait négocier ${k.negoceQuiCouvre - k.f.fournisseur.delai} jours de plus avec ${k.f.fournisseur.nom}, sous le plafond de ${DELAI_DU_NEGOCE.max} jours.`,
          "Payer le négoce plus tôt n'y aiderait pas : la TVA des matériaux se déduit à la livraison, quel que soit le jour du paiement. Le payer plus tard garde sa TVA plus longtemps en caisse.",
        ];
      },
    },
    {
      id: "la-dette-au-negoce",
      objectifs: [0],
      type: "montants",
      titre: "Le négoce à la limite",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Avec l'option pour les débits, le négoce payé à ${k.negoceQuiCouvre} jours : calculez ce que ${k.f.entreprise} lui devrait au ${juinDit}, toutes taxes comprises, la TVA de cette dette, puis ce que la TVA laisserait en trésorerie.`;
      },
      champs: (c) => {
        const k = tvaEtTresorerie(c);
        const x = k.juinAuNegoceQuiCouvre;
        const achats = k.f.achatsHT[TRIMESTRE_DE_LA_CLOTURE + 1]!;
        return [
          {
            libelle: `Dette au négoce à ${k.negoceQuiCouvre} jours (TTC)`,
            attendu: x.dettesTTC,
            calcul: `${eur(achats)} × ${k.negoceQuiCouvre} ÷ 90 × ${(1 + k.t).toLocaleString("fr-FR")} = ${eur(x.dettesHT)} × ${(1 + k.t).toLocaleString("fr-FR")} = ${eur(x.dettesTTC)}`,
          },
          { libelle: `TVA due au négoce à ${k.negoceQuiCouvre} jours`, attendu: x.tvaDesDettes, calcul: `${eur(x.dettesHT)} × ${pct(k.t)} = ${eur(x.tvaDesDettes)}` },
          {
            libelle: `Ce que la TVA laisse en trésorerie, négoce à ${k.negoceQuiCouvre} jours`,
            attendu: x.effet,
            calcul: `${eur(x.detteEtat)} + ${eur(x.tvaDesDettes)} − ${eur(x.tvaAvancee)} = ${eur(x.effet)}`,
          },
        ];
      },
      explication: (c) => {
        const k = tvaEtTresorerie(c);
        return [
          `Le négoce finance alors ce que l'État ne couvre pas. Un fournisseur payé tard fait crédit de son hors taxes et de sa TVA, déjà déduite : c'est le même mécanisme, dans l'autre sens, que la TVA que ${k.f.entreprise} avancerait pour ses clients avec l'option.`,
        ];
      },
    },
    {
      id: "sans-tva",
      objectifs: [4],
      type: "choix",
      titre: "Le résultat et la trésorerie",
      notions: ["net_treasury", "income_statement"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Imaginez la même année sans TVA : mêmes chantiers, mêmes délais, mêmes matériaux, mais aucune taxe sur les factures. Au ${juinDit}, au régime réel, que montrerait ${k.f.entreprise} face à son année avec TVA ?`;
      },
      options: (c) => {
        const k = tvaEtTresorerie(c);
        const e = eur(k.juin.effet);
        return [
          {
            texte: `Le même résultat, et ${e} de moins en trésorerie`,
            juste: true,
            retour: `Oui : ce que la TVA laisse en trésorerie est exactement l'écart avec une année sans TVA, ${e} au ${juinDit}. Le résultat ne bouge pas : la TVA n'est ni une charge ni un produit.`,
          },
          {
            texte: `Un résultat meilleur de ${e}, et la même trésorerie`,
            juste: false,
            retour: "Non : le compte de résultat est hors taxes. La TVA n'y entre jamais ; c'est la trésorerie qui bouge.",
          },
          {
            texte: "Le même résultat, et la même trésorerie : la TVA ne fait que passer",
            juste: false,
            retour: `Non : elle passe, mais à des dates différentes. Au ${juinDit}, ${k.f.entreprise} garde ${eur(k.juin.tvaDesDettes)} de TVA due au négoce, et attend ${eur(-k.juin.detteEtat)} de l'État : ${e} de plus en caisse.`,
          },
          {
            texte: `Le même résultat, et ${eur(-k.juinAuxDebits.effet)} de plus en trésorerie`,
            juste: false,
            retour: `Non : c'est ce que la TVA retirerait avec l'option pour les débits. Au régime réel, elle laisse ${e}.`,
          },
        ];
      },
    },
    {
      id: "l-ete",
      objectifs: [3],
      type: "montants",
      titre: "La TVA dans les flux de l'été",
      notions: ["cash_budget", "vat_payable"],
      tableau: (c) => {
        const k = tvaEtTresorerie(c);
        return {
          titre: `Les flux de ${k.f.entreprise} au ${nomDuTrimestre(TRIMESTRE_DES_FLUX)} (extrait)`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Encaissements des clients (TTC)", valeurs: [eur(k.ete.encaissementsTTC)] },
            { libelle: "Paiements au négoce (TTC)", valeurs: [eur(-k.ete.paiementsTTC)] },
          ],
        };
      },
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Au ${nomDuTrimestre(TRIMESTRE_DES_FLUX)}, la TVA est cachée dans les encaissements et les paiements, qui sont toutes taxes comprises. Calculez la TVA encaissée des clients, la TVA payée au négoce, ce que ${k.f.entreprise} verse à l'État pendant le trimestre, puis le solde de TVA du trimestre (encaissée − payée − versée ; négatif si la TVA pèse sur la trésorerie).`;
      },
      champs: (c) => {
        const k = tvaEtTresorerie(c);
        const e = k.ete;
        const facteur = `× ${Math.round(k.t * 100)} ÷ ${Math.round((1 + k.t) * 100)}`;
        return [
          { libelle: "TVA encaissée des clients", attendu: e.tvaEncaissee, calcul: `${eur(e.encaissementsTTC)} ${facteur} = ${eur(e.tvaEncaissee)}` },
          { libelle: "TVA payée au négoce", attendu: e.tvaPayee, calcul: `${eur(e.paiementsTTC)} ${facteur} = ${eur(e.tvaPayee)}` },
          { libelle: "TVA versée à l'État pendant le trimestre", attendu: e.tvaVersee, calcul: `la TVA à payer du ${nomDuTrimestre(TRIMESTRE_DES_FLUX - 1)} : un crédit, rien à verser, ${eur(e.tvaVersee)}` },
          { libelle: "Solde de TVA du trimestre", attendu: e.solde, calcul: `${eur(e.tvaEncaissee)} − ${eur(e.tvaPayee)} − ${eur(e.tvaVersee)} = ${eur(e.solde)}` },
        ];
      },
      explication: (c) => {
        const k = tvaEtTresorerie(c);
        const e = k.ete;
        return [
          `L'été, la TVA soulage la trésorerie de ${eur(e.solde)} : les clients paient les gros chantiers du printemps, et le crédit dispense ${k.f.entreprise} de tout versement. C'est ce qui fait passer ce que la TVA laisse en trésorerie de ${eur(e.avant)} au ${juinDit} à ${eur(e.apres)} au ${septembreDit} : ${eur(e.avant)} + ${eur(e.solde)} = ${eur(e.apres)}.`,
          "D'un trimestre à l'autre, selon les chantiers, les achats et les délais, la TVA soulage la trésorerie ou pèse sur elle : un budget de trésorerie doit prévoir chaque versement.",
        ];
      },
    },
    {
      id: "l-ete-aux-debits",
      objectifs: [3],
      type: "montants",
      titre: "L'été, avec l'option",
      notions: ["cash_budget", "vat_payable"],
      question: (c) =>
        `Expert, une variante. Avec l'option pour les débits, les encaissements et les paiements de l'été ne changent pas. Calculez ce que ${tvaEtTresorerie(c).f.entreprise} verserait à l'État pendant le ${nomDuTrimestre(TRIMESTRE_DES_FLUX)}, le solde de TVA du trimestre, puis ce que la TVA laisserait en trésorerie au ${septembreDit} (négatif si elle en retire).`,
      champs: (c) => {
        const k = tvaEtTresorerie(c);
        const e = k.eteAuxDebits;
        return [
          { libelle: "TVA versée à l'État pendant l'été, aux débits", attendu: e.tvaVersee, calcul: `la TVA à payer du ${nomDuTrimestre(TRIMESTRE_DES_FLUX - 1)} aux débits : ${eur(e.tvaVersee)}` },
          { libelle: "Solde de TVA de l'été, aux débits", attendu: e.solde, calcul: `${eur(e.tvaEncaissee)} − ${eur(e.tvaPayee)} − ${eur(e.tvaVersee)} = ${eur(e.solde)}` },
          { libelle: "Ce que la TVA laisse en trésorerie au 30 septembre, aux débits", attendu: e.apres, calcul: `${entre(e.avant)} + ${eur(e.solde)} = ${eur(e.apres)}` },
        ];
      },
      explication: (c) => {
        const k = tvaEtTresorerie(c);
        const e = k.eteAuxDebits;
        const septembre = k.cloturesAuxDebits[TRIMESTRE_DES_FLUX]!;
        return [
          `Les flux d'argent des clients et du négoce sont les mêmes aux deux régimes : seul le versement à l'État change (${eur(e.tvaVersee)} au lieu de ${eur(k.ete.tvaVersee)}). Au ${septembreDit}, la TVA laisse ${eur(e.apres)} avec l'option, ${eur(k.ete.apres)} au régime réel : ${eur(auCentime(k.ete.apres - e.apres))} d'écart, la TVA des créances déjà déclarée avec l'option (${eur(septembre.tvaAvancee)}), et ${eur(auCentime(k.clotures[TRIMESTRE_DES_FLUX]!.detteEtat - septembre.detteEtat))} dus à l'État en plus au régime réel.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-tresorerie",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire de la trésorerie",
      notions: ["vat_payable", "payment_terms", "bfr"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Le gérant de ${k.f.entreprise} envisage l'option pour les débits. Faites varier le régime, le délai des entreprises, celui des collectivités et celui du négoce : le tableau suit la TVA au ${juinDit}, et la clôture la plus basse de l'année. Le graphique fait glisser le délai des entreprises et montre qui finance la TVA des créances.`;
      },
      leviers: (c) => {
        const d = tvaEtTresorerie(c).depart;
        return [
          {
            code: "regime",
            libelle: "Régime de la TVA",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: d.regime,
            choix: [
              { valeur: 0, libelle: "Encaissements, son régime" },
              { valeur: 1, libelle: "Débits, sur option" },
            ],
          },
          { code: "entreprises", libelle: "Délai des entreprises", unite: "jours", min: DELAI_DES_ENTREPRISES.min, max: DELAI_DES_ENTREPRISES.max, pas: 1, depart: d.entreprises },
          { code: "collectivites", libelle: "Délai des collectivités", unite: "jours", min: DELAI_DES_COLLECTIVITES.min, max: DELAI_DES_COLLECTIVITES.max, pas: 1, depart: d.collectivites },
          { code: "negoce", libelle: "Délai du négoce", unite: "jours", min: DELAI_DU_NEGOCE.min, max: DELAI_DU_NEGOCE.max, pas: 1, depart: d.negoce },
        ];
      },
      lecture: (c, p) => {
        const k = tvaEtTresorerie(c);
        const l = laboratoireDeLaTresorerie(k.f, p as unknown as PositionDeLaTresorerie);
        const d = laboratoireDeLaTresorerie(k.f, k.depart);
        return [
          { libelle: "TVA des créances clients", montant: l.juin.tvaDesCreances, reference: d.juin.tvaDesCreances },
          { libelle: "dont TVA déjà déclarée, avancée", montant: l.juin.tvaAvancee, reference: d.juin.tvaAvancee },
          { libelle: "Dette envers l'État (négative : un crédit)", montant: l.juin.detteEtat, reference: d.juin.detteEtat },
          { libelle: "TVA due au négoce", montant: l.juin.tvaDesDettes, reference: d.juin.tvaDesDettes },
          { libelle: "Ce que la TVA laisse en trésorerie au 30 juin", montant: l.juin.effet, reference: d.juin.effet, fort: true },
          { libelle: "Au plus bas, sur les clôtures de l'année", montant: l.auPlusBas, reference: d.auPlusBas },
        ];
      },
      // Qui finance la TVA des créances, selon le délai des entreprises : chaque part casse au délai où
      // l'État, puis le négoce, ne suffisent plus. Ce ne sont pas des droites.
      graphique: (c) => {
        const f = tvaEtTresorerie(c).f;
        const parts = (p: Readonly<Record<string, number>>) => laboratoireDeLaTresorerie(f, p as unknown as PositionDeLaTresorerie).parts;
        return {
          levier: "entreprises",
          courbes: [
            { libelle: "TVA des créances, pas encore due", valeur: (p) => parts(p).pasEncoreDue },
            { libelle: "TVA avancée, couverte par l'État et le négoce", valeur: (p) => parts(p).couverte },
            { libelle: "TVA avancée par l'entreprise elle-même", valeur: (p) => parts(p).avancee },
          ],
        };
      },
      defi: (c) => {
        const k = tvaEtTresorerie(c);
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDeLaTresorerie(k.f, p as unknown as PositionDeLaTresorerie);
        const delai = k.delaiDesEntreprises;
        return {
          consigne: `Optez pour les débits sans raccourcir le délai des entreprises (au moins ${delai} jours), et trouvez des délais où ${k.f.entreprise} n'avance la TVA de ses clients à aucune clôture de l'année.`,
          atteint: (p) => p.regime === 1 && p.entreprises! >= delai && lire(p).auPlusBas >= 0,
          indice: (p) => {
            if (p.regime !== 1) return `Au régime réel, les encaissements, ${k.f.entreprise} n'avance jamais la TVA de ses clients : le défi pose la question avec l'option pour les débits.`;
            if (p.entreprises! < delai) return `Le défi garde les entreprises à ${delai} jours au moins : c'est le délai qu'elles ont négocié.`;
            return `À la clôture la plus basse, la TVA retire encore ${eur(-lire(p).auPlusBas)} : qui d'autre pourrait faire crédit à ${k.f.entreprise}, ou quels clients pourraient payer plus vite ?`;
          },
          solution: { regime: 1, entreprises: delai, collectivites: k.depart.collectivites, negoce: DELAI_DU_NEGOCE.max },
        };
      },
      explication: (c, p) => {
        const k = tvaEtTresorerie(c);
        const l = laboratoireDeLaTresorerie(k.f, p as unknown as PositionDeLaTresorerie);
        const moyens = [
          ...(p.negoce! > k.depart.negoce ? [`payer le négoce à ${p.negoce} jours au lieu de ${k.depart.negoce}`] : []),
          ...(p.collectivites! < k.depart.collectivites ? [`faire payer les collectivités à ${p.collectivites} jours au lieu de ${k.depart.collectivites}`] : []),
        ];
        return [
          `Avec l'option, ${k.f.entreprise} n'avance plus rien${moyens.length > 0 ? ` : il a fallu ${moyens.join(" et ")}` : ""}. Au ${juinDit}, la TVA laisse ${eur(l.juin.effet)} en trésorerie, et ${eur(l.auPlusBas)} à la clôture la plus basse.`,
          "Au régime réel, aucune de ces concessions n'est nécessaire : la TVA des créances n'est due qu'à leur encaissement. L'option se paie en trésorerie, et se négocie avec le fournisseur ou avec les clients.",
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Retrouver les créances à rebours",
      notions: ["vat_payable", "bfr"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        const d = k.decembreAuxDebits;
        return `Expert, à rebours. Avec l'option pour les débits, l'expert-comptable lit au ${FINS_DES_TRIMESTRES[4]} : la TVA laisse ${eur(d.effet)} en trésorerie ; ${k.f.entreprise} doit ${eur(d.detteEtat)} à l'État et ${eur(d.tvaDesDettes)} de TVA au négoce. Retrouvez la TVA des créances déjà déclarée, les créances clients hors taxes, puis toutes taxes comprises.`;
      },
      champs: (c) => {
        const k = tvaEtTresorerie(c);
        const d = k.decembreAuxDebits;
        const r = k.creancesARebours;
        return [
          { libelle: "TVA des créances déjà déclarée", attendu: r.tva, calcul: `${eur(d.detteEtat)} + ${eur(d.tvaDesDettes)} − ${eur(d.effet)} = ${eur(r.tva)}` },
          { libelle: "Créances clients (HT)", attendu: r.ht, calcul: `${eur(r.tva)} ÷ ${pct(k.t)} = ${eur(r.ht)}` },
          { libelle: "Créances clients (TTC)", attendu: r.ttc, calcul: `${eur(r.ht)} × ${(1 + k.t).toLocaleString("fr-FR")} = ${eur(r.ttc)}` },
        ];
      },
      explication: (c) => {
        const k = tvaEtTresorerie(c);
        const r = k.creancesARebours;
        return [
          `Les créances du ${FINS_DES_TRIMESTRES[4]} valent ${eur(r.ttc)} TTC, autant qu'au ${juinDit}. Mais au ${FINS_DES_TRIMESTRES[4]}, l'État attend ${eur(k.decembreAuxDebits.detteEtat)} : de quoi couvrir seul leur TVA, quand au ${juinDit} il n'attendait que ${eur(k.juinAuxDebits.detteEtat)}. La même créance ne pèse pas pareil selon ce que l'entreprise doit à côté.`,
        ];
      },
    },
    {
      id: "l-argent-de-la-tva",
      objectifs: [4],
      type: "choix",
      titre: "L'argent de la TVA",
      notions: ["vat_payable", "net_treasury"],
      question: (c) => {
        const k = tvaEtTresorerie(c);
        return `Au ${FINS_DES_TRIMESTRES[4]}, au régime réel, la TVA laisse ${eur(k.decembre.effet)} dans la trésorerie de ${k.f.entreprise}. Le gérant veut s'en servir pour acheter une nouvelle mini-pelle en janvier. Qu'en dites-vous ?`;
      },
      options: (c) => {
        const k = tvaEtTresorerie(c);
        const d = k.decembre;
        return [
          {
            texte: `Cet argent part au trimestre suivant : ${eur(d.detteEtat)} à l'État, la TVA du négoce avec ses factures`,
            juste: true,
            retour: `Oui : ${eur(d.detteEtat)} de TVA à payer du ${nomDuTrimestre(4)}, versés au premier trimestre de N + 1, et ${eur(d.tvaDesDettes)} de TVA due au négoce. La TVA se renouvelle tant que les chantiers tournent, mais elle varie : ${eur(k.juin.effet)} seulement au ${juinDit}. S'en servir pour investir, ce serait la retirer au pire moment.`,
          },
          {
            texte: "C'est une ressource stable : la TVA reste dans l'entreprise tant que l'activité dure",
            juste: false,
            retour: `Non : elle se renouvelle, mais elle varie avec les chantiers, les achats et les délais : ${eur(k.juin.effet)} au ${juinDit}, ${eur(d.effet)} au ${FINS_DES_TRIMESTRES[4]}. Un investissement se finance par des ressources durables.`,
          },
          {
            texte: "C'est un gain de l'année, à reprendre au compte de résultat",
            juste: false,
            retour: "Non : la TVA n'est ni une charge ni un produit. Rien n'entre au compte de résultat.",
          },
          {
            texte: "Rien ne s'y oppose : aux encaissements, la TVA n'est due qu'une fois les clients payés",
            juste: false,
            retour: `Non : la TVA des sommes déjà encaissées au ${nomDuTrimestre(4)} est due, ${eur(d.detteEtat)} une fois la TVA déductible retirée. Seule la TVA des créances attend.`,
          },
        ];
      },
    },
    {
      id: "le-client-en-retard",
      objectifs: [1],
      type: "montants",
      titre: "Un client en retard, aux encaissements",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const { f, v } = mauvaisPayeursDeMartel(c);
        return `Hypothèse du cours : ${v.client}, un client de la clientèle « entreprises », reçoit une facture de ${eur(v.ht)} HT pour ${v.objet}, payable à ${jours(v.delaiConvenu)}. Relancé le ${v.relanceAmiable}e jour, mis en demeure le ${v.miseEnDemeure}e, il paie ${jours(v.retard)} après l'échéance. Calculez la TVA de la facture, le jour (après la facture) où elle devient due à l'État, ce que le retard coûte à ${f.entreprise} sur son découvert à ${pct(v.tauxDeFinancement)}, puis les pénalités de retard à ${pct(TAUX_DES_PENALITES)} l'an.`;
      },
      champs: (c) => {
        const { v } = mauvaisPayeursDeMartel(c);
        return [
          { libelle: "TVA de la facture", attendu: v.tva, calcul: `${eur(v.ht)} × ${pct(v.tauxDeTva)} = ${eur(v.tva)}` },
          { libelle: "Jour où la TVA devient due (après la facture)", attendu: v.paiement, calcul: `des travaux : la TVA est due à l'encaissement, ${v.delaiConvenu} + ${v.retard} = ${v.paiement}` },
          { libelle: "Coût du retard", attendu: v.coutDuRetard, calcul: `le hors taxes seul : ${eur(v.finance)} × ${pct(v.tauxDeFinancement)} × ${v.retard} ÷ ${JOURS_DE_L_ANNEE_BANCAIRE} = ${eur(v.coutDuRetard)}` },
          { libelle: "Pénalités de retard", attendu: v.penalites, calcul: `${eur(v.ttc)} × ${pct(TAUX_DES_PENALITES)} × ${v.retard} ÷ ${JOURS_DE_L_ANNEE_CIVILE} = ${eur(v.penalites)}` },
        ];
      },
      explication: (c) => {
        const { f, v } = mauvaisPayeursDeMartel(c);
        return [
          `Au régime des encaissements, le retard décale la TVA avec le paiement : ${f.entreprise} ne déclare les ${eur(v.tva)} qu'au ${v.paiement}e jour, au lieu du ${v.echeance}e. Elle n'en avance rien : le retard ne lui coûte que le hors taxes, ${eur(v.coutDuRetard)}. Avec l'option pour les débits, elle aurait déclaré cette TVA dès la facture, et financé ${eur(v.ttc)}.`,
          `Les pénalités, elles, se comptent sur le TTC, ${eur(v.penalites)}, plus l'indemnité forfaitaire de ${eur(v.indemnite)}. La relance amiable (${RELANCES.relanceAmiable} jours après l'échéance) et la mise en demeure (${RELANCES.miseEnDemeure} jours après) ne les font pas courir : elles sont dues de plein droit. ${v.client} est solvable, sa créance reste au compte 411.`,
        ];
      },
    },
    {
      id: "le-client-defaillant",
      objectifs: [4],
      type: "montants",
      titre: "Un client en redressement judiciaire",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const { f, doriac } = mauvaisPayeursDeMartel(c);
        return `Hypothèse du cours : ${doriac.client}, un autre client « entreprises », doit une facture de travaux de ${eur(doriac.ht)} HT, échue et impayée malgré la mise en demeure. Le tribunal ouvre contre lui un redressement judiciaire ; le mandataire laisse craindre une perte de ${pct(doriac.tauxDePerteProbable)}. À l'inventaire, calculez la créance douteuse à porter au compte 416, la dotation à la dépréciation, puis la créance nette au bilan de ${f.entreprise}. Enfin, si la perte se confirme, la TVA que ${f.entreprise} récupérera de l'État.`;
      },
      champs: (c) => {
        const { d, doriac } = mauvaisPayeursDeMartel(c);
        return [
          { libelle: "Créance douteuse au 416 (TTC)", attendu: d.reclassement.montant, calcul: `toute la créance passe du 411 au 416, TVA comprise : ${eur(doriac.ht)} + ${eur(d.tva)} = ${eur(d.ttc)}` },
          { libelle: "Dotation à la dépréciation (6817, au crédit du 491)", attendu: d.depreciation.montant, calcul: `sur le hors taxes : ${eur(doriac.ht)} × ${pct(doriac.tauxDePerteProbable)} = ${eur(d.depreciation.montant)}` },
          { libelle: "Créance nette au bilan", attendu: d.valeurNetteAuBilan, calcul: `${eur(d.ttc)} − ${eur(d.depreciation.montant)} = ${eur(d.valeurNetteAuBilan)}` },
          {
            libelle: "TVA à récupérer de l'État si la perte se confirme",
            attendu: d.irrecouvrable.tvaARecupererDeLEtat,
            calcul: `des travaux, aux encaissements : la TVA n'a jamais été reversée, il n'y a rien à récupérer ; les ${eur(d.irrecouvrable.tvaEnAttenteAnnulee)} en attente s'annulent`,
          },
        ];
      },
      explication: (c) => {
        const { f, d } = mauvaisPayeursDeMartel(c);
        return [
          `Une procédure collective rend la créance douteuse : elle passe au 416 pour ${eur(d.ttc)}, et se déprécie sur son hors taxes, ${eur(d.depreciation.montant)}. La TVA n'est pas une perte : elle n'entre jamais dans la dépréciation.`,
          `Aux encaissements, ${f.entreprise} n'a jamais déclaré les ${eur(d.tva)} de TVA de cette facture : si la perte se confirme, la TVA de la part perdue, ${eur(d.irrecouvrable.tvaEnAttenteAnnulee)}, s'annule, sans rien à demander à l'État. Une entreprise qui vend des biens, elle, l'aurait reversée à la livraison, et ne la récupérerait qu'une fois la créance irrécouvrable.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["vat_payable", "bfr"],
      tableau: (c) => {
        const k = tvaEtTresorerie(c);
        return {
          titre: `Ce que la TVA laisse dans la trésorerie de ${k.f.entreprise}, à chaque clôture`,
          colonnes: [...FINS_DES_TRIMESTRES],
          lignes: [
            { libelle: "Aux encaissements, son régime", valeurs: k.clotures.map((x) => eur(x.effet)) },
            { libelle: "Aux débits, sur option", valeurs: k.cloturesAuxDebits.map((x) => eur(x.effet)) },
          ],
        };
      },
      texte: (c) => {
        const k = tvaEtTresorerie(c);
        return [
          `La TVA n'est pas une charge, mais elle fait partie du besoin en fonds de roulement : une TVA dans les créances clients, une dette de TVA envers le négoce et envers l'État. Ce qu'elle laisse en trésorerie est l'écart avec une année sans TVA ; le résultat, lui, ne bouge pas.`,
          `Tout tient à l'exigibilité. Pour des travaux, au régime réel, la TVA des créances n'est pas encore due : personne n'a à la financer, et ${k.f.entreprise} ne paie un délai client qu'en hors taxes. Avec l'option pour les débits, la TVA des créances est déjà déclarée : l'État la couvre quand ce qui lui est dû suffit, le négoce prend le relais, et au-delà, l'entreprise l'avance (${eur(-k.juinAuxDebits.effet)} au ${juinDit}). Un délai client plus long, un fournisseur payé vite, une option pour les débits : la TVA pèse. L'inverse : elle soulage.`,
          "Au niveau de l'examen, vous savez retrouver la TVA d'une créance ou d'une dette, calculer ce que la TVA laisse en trésorerie à une clôture aux deux régimes, dire qui fait crédit à qui, lire la TVA dans les flux d'un trimestre, et remonter à rebours de la trésorerie aux créances.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Ce que la TVA laisse en trésorerie = dette envers l'État + TVA des dettes fournisseurs − TVA avancée pour les clients. La TVA avancée : aucune aux encaissements ; aux débits, toute la TVA des créances. Dans un montant TTC, la TVA = TTC × taux ÷ (1 + taux).",
    },
  ],
};
