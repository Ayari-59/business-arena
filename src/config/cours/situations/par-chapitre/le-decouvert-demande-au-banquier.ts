import { arrondi2 as auCentime, eur, pct } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_BILAN, bilanDuChapitre } from "../../chapitres/le-bilan-et-le-bfr-de-la-boutique";
import { BANQUE_DE_LA_BOUTIQUE, MOIS_DE_CHARGES_A_GARDER, bilanDeLaBoutique, delaiDu } from "../../monde/comptes-de-la-boutique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE BILAN ET LE BFR DE LA BOUTIQUE » : LE DÉCOUVERT DEMANDÉ AU BANQUIER
 * (BTS MCO, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le bilan de MAILLE & CO au 31 décembre N − 1
 * (monde/comptes-de-la-boutique.ts, lu par `bilanDuChapitre`).
 *
 * Le gérant veut passer le réassort aux fins de série, payées comptant, et les associés veulent un gros
 * dividende. Il prépare un rendez-vous à la banque pour demander un découvert autorisé. L'élève refait
 * seul le BFR et la trésorerie au comptant, cherche au curseur le plus gros dividende qui garde la
 * trésorerie voulue sans découvert, lit l'autonomie financière, puis répond.
 *
 * Les pièges : croire qu'un découvert finance un BFR permanent ; oublier que le dividende baisse le fonds
 * de roulement, et le délai fournisseur le BFR.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : l'autonomie financière se donne à deux décimales, à un centième
 * près (au dixième, avant).
 */

/** Les bornes du curseur du dividende, en euros. */
export const DIVIDENDE_DU_CURSEUR = { min: 250_000, max: 350_000 } as const;


/** Les chiffres de la réponse. */
export function decouvertDemande(c: Pick<Cas, "code">) {
  const x = bilanDuChapitre(c);
  const delai = delaiDu(x.f, "fins-de-serie");
  const k = x.comptant;
  // Le plus gros dividende qui garde la trésorerie voulue, au comptant : la trésorerie sans dividende moins celle à garder, à l'euro.
  const dividendeMaximal = Math.min(Math.floor(k.tresorerieNette - x.aGarder + 1e-9), Math.floor(x.b.distribuable));
  const apres = bilanDeLaBoutique(x.f, { dividende: dividendeMaximal, delaiFournisseur: delai });
  return { ...x, delai, k, dividendeMaximal, apres };
}

const tableauDuBilanFonctionnel = (c: Pick<Cas, "code">) => {
  const x = bilanDuChapitre(c);
  const b = x.b;
  return {
    titre: `${x.f.entreprise} · le bilan au 31 décembre N − 1, en masses`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Emplois stables (valeur brute)", valeurs: [eur(b.emploisStables)] },
      { libelle: "Ressources stables", valeurs: [eur(b.ressourcesStables)] },
      { libelle: "Stock et créances des comités", valeurs: [eur(b.actifCirculant)] },
      { libelle: "Dettes fournisseurs, à 45 jours", valeurs: [eur(b.dettesFournisseurs)] },
      { libelle: "Dettes fiscales et sociales", valeurs: [eur(b.dettesFiscalesEtSociales)] },
      { libelle: "Total du passif", valeurs: [eur(b.totalDuPassif)] },
    ],
  };
};

export const LE_DECOUVERT_DEMANDE_AU_BANQUIER: Situation = {
  code: "le-decouvert-demande-au-banquier",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["le-bilan-et-le-bfr-de-la-boutique"],
  commanditaire: "Le gérant",
  titre: "Le découvert demandé au banquier",
  accroche: "Le gérant veut payer son réassort comptant et les associés un gros dividende. Il compte demander un découvert à la banque : que lui répondra-t-elle, et que peut-il verser sans en avoir besoin ?",
  objectifs: [
    "Calculer le BFR et la trésorerie nette quand un délai fournisseur change",
    "Trouver le plus gros dividende qui garde la trésorerie voulue",
    "Lire l'autonomie financière après le dividende",
    "Préparer la réponse à la banque",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BILAN,
    pourquoi: "ce cas reprend le bilan du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      tableau: tableauDuBilanFonctionnel,
      texte: (c) => {
        const x = decouvertDemande(c);
        return [
          `« Je veux acheter tout le réassort de fin d'année aux fins de série : moins cher, mais payé comptant. Les associés, eux, veulent un gros dividende. J'irai demander un découvert autorisé à la banque pour faire la soudure. Combien pouvons-nous verser en gardant ${eur(x.aGarder)} de trésorerie, ${MOIS_DE_CHARGES_A_GARDER} mois de charges fixes, sans découvert ? Et que me dira le banquier ? »`,
          `Pas de cours cette fois : la méthode est celle du chapitre. À achats égaux, le réassort de fin d'année représente ${eur(auCentime(x.b.achatsParJour))} d'achats par jour de crédit fournisseur ; le découvert coûte ${pct(BANQUE_DE_LA_BOUTIQUE.decouvert.taux * 100)} l'an.`,
        ];
      },
      repere: () => "À rendre : le fonds de roulement, le BFR et la trésorerie au comptant, le dividende le plus fort qui garde la trésorerie voulue, l'autonomie financière après lui, et votre réponse.",
    },
    {
      id: "au-comptant",
      type: "montants",
      titre: "Le bilan au comptant",
      notions: ["frng", "bfr", "net_treasury"],
      tableau: tableauDuBilanFonctionnel,
      question: () => "Avant tout dividende, le réassort est payé comptant. Calculez le fonds de roulement, le BFR, puis la trésorerie nette.",
      champs: (c) => {
        const x = decouvertDemande(c);
        const k = x.k;
        return [
          { libelle: "Fonds de roulement net global", attendu: k.frng, calcul: `${eur(k.ressourcesStables)} − ${eur(k.emploisStables)} = ${eur(k.frng)}` },
          { libelle: "Besoin en fonds de roulement", attendu: k.bfr, calcul: `${eur(k.actifCirculant)} − (0 € + ${eur(k.dettesFiscalesEtSociales)}) = ${eur(k.bfr)}` },
          { libelle: "Trésorerie nette", attendu: k.tresorerieNette, calcul: `${eur(k.frng)} − ${eur(k.bfr)} = ${eur(k.tresorerieNette)}` },
        ];
      },
      explication: (c) => {
        const x = decouvertDemande(c);
        return [`Au comptant, le BFR devient un besoin, ${eur(x.k.bfr)}, et la trésorerie perd ${eur(x.b.dettesFournisseurs)} : le crédit du façonnier ne finance plus rien.`];
      },
    },
    {
      id: "le-dividende-au-curseur",
      type: "curseur",
      titre: "Le dividende qui garde la trésorerie",
      notions: ["net_treasury", "frng"],
      question: (c) => {
        const x = decouvertDemande(c);
        return `Faites varier le dividende, de ${eur(DIVIDENDE_DU_CURSEUR.min)} à ${eur(DIVIDENDE_DU_CURSEUR.max)}, réassort payé comptant. Une droite donne la trésorerie nette, l'autre la trésorerie à garder, ${eur(x.aGarder)}. Placez le curseur sur le plus gros dividende qui la garde, puis validez.`;
      },
      grandeur: () => ({ libelle: "Dividende versé", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: decouvertDemande(c).dividendeMaximal, min: DIVIDENDE_DU_CURSEUR.min, max: DIVIDENDE_DU_CURSEUR.max }),
      zones: ["La trésorerie voulue est gardée", "Il faudrait un découvert"],
      rates: () => ({
        dessous: "À ce dividende, la trésorerie garde encore plus que voulu : vous pouvez aller plus loin.",
        dessus: "À ce dividende, la trésorerie passe sous ce qu'il faut garder : cherchez plus bas.",
      }),
      montrer: "Montrer le plus gros dividende",
      lecture: (c, d) => {
        const x = decouvertDemande(c);
        const l = bilanDeLaBoutique(x.f, { dividende: d, delaiFournisseur: x.delai });
        return [
          { libelle: "Fonds de roulement", montant: l.frng },
          { libelle: "Trésorerie nette", montant: l.tresorerieNette },
          { libelle: "Trésorerie nette, moins celle à garder", montant: auCentime(l.tresorerieNette - x.aGarder), fort: true },
        ];
      },
      droites: (c) => {
        const x = decouvertDemande(c);
        return { produit: (d) => x.k.tresorerieNette - d, cout: () => x.aGarder, libelles: ["Trésorerie nette", "Trésorerie à garder"] };
      },
      explication: (c) => {
        const x = decouvertDemande(c);
        return [`Au comptant, la boutique peut verser au plus ${eur(x.dividendeMaximal)} sans passer sous ${eur(x.aGarder)} : chaque euro de dividende sort du fonds de roulement, et donc de la trésorerie, puisque le BFR ne bouge pas.`];
      },
    },
    {
      id: "l-autonomie",
      type: "montants",
      titre: "Ce que verra le banquier",
      notions: ["balance_sheet", "frng"],
      question: (c) => `Après ce dividende de ${eur(decouvertDemande(c).dividendeMaximal)}, réassort comptant, calculez les capitaux propres, le total du passif, puis l'autonomie financière (en %, à deux décimales).`,
      champs: (c) => {
        const x = decouvertDemande(c);
        const a = x.apres;
        return [
          { libelle: "Capitaux propres", attendu: a.capitauxPropres, calcul: `${eur(x.b.capitauxPropres)} − ${eur(x.dividendeMaximal)} = ${eur(a.capitauxPropres)}` },
          { libelle: "Total du passif", attendu: a.totalDuPassif, calcul: `${eur(a.capitauxPropres)} + ${eur(a.provision)} + ${eur(a.emprunt)} + ${eur(a.dettesFournisseurs)} + ${eur(a.dettesFiscalesEtSociales)} = ${eur(a.totalDuPassif)}` },
          { libelle: "Autonomie financière (%)", attendu: auCentime(a.autonomieFinanciere * 100), calcul: `${eur(a.capitauxPropres)} ÷ ${eur(a.totalDuPassif)} × 100 = ${pct(a.autonomieFinanciere * 100)}` },
        ];
      },
      explication: (c) => {
        const x = decouvertDemande(c);
        return [`Les associés financent encore ${pct(x.apres.autonomieFinanciere * 100)} du bilan : la boutique reste solide, et le fonds de roulement, ${eur(x.apres.frng)}, couvre le BFR de ${eur(x.apres.bfr)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant avant son rendez-vous ?",
      options: (c) => {
        const x = decouvertDemande(c);
        return [
          { texte: `Verser au plus ${eur(x.dividendeMaximal)} : le découvert ne finance pas le comptant`, juste: true, retour: `Oui. Au comptant, le BFR de ${eur(x.k.bfr)} revient à chaque réassort : c'est un besoin permanent, que le fonds de roulement doit couvrir. Le banquier accorde un découvert pour une pointe de saison, pas pour payer un dividende. À ${eur(x.dividendeMaximal)}, la trésorerie garde ${eur(x.aGarder)} sans lui.` },
          { texte: "Demander le découvert : la boutique est rentable, la banque suivra", juste: false, retour: "La rentabilité rassure, mais un besoin permanent financé à court terme dépend chaque mois du renouvellement du découvert, et coûte cher." },
          { texte: `Verser ${eur(x.b.distribuable)}, tout le distribuable, et emprunter le reste`, juste: false, retour: `Emprunter pour verser un dividende affaiblit la structure sans rien financer de productif : la trésorerie tomberait à ${eur(bilanDeLaBoutique(x.f, { dividende: x.b.distribuable, delaiFournisseur: x.delai }).tresorerieNette)}.` },
          { texte: `Rester au façonnier : le comptant est toujours une erreur`, juste: false, retour: "Pas toujours : les fins de série sont moins chères. Il faut seulement que la trésorerie immobilisée soit financée par des ressources stables, et non par un découvert." },
        ];
      },
    },
  ],
};
