import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { CROISSANCE_DES_VENTES, ENTREPRISES_DU_BILAN_FONCTIONNEL, PLACE_DE_MARCHE, bilanDeLExercice } from "../../chapitres/bilan-fonctionnel";
import { auCentime } from "../../monde/amortissement";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « BILAN FONCTIONNEL ET BFR » : VENDRE PLUS, FINANCER PLUS
 * (comptabilité générale, palier 4).
 *
 * Le directeur commercial vise 20 % de chiffre d'affaires en plus l'an prochain, en vendant aux
 * particuliers par une place de marché qui reverse les ventes à 30 jours. Le directeur financier
 * veut savoir, avant de valider le plan, de combien la croissance ferait grossir le besoin en fonds
 * de roulement, et si NOVA peut la financer sans toucher au compte à terme, qui garde la réserve de
 * la seconde ligne. L'élève refait seul le bilan fonctionnel du chapitre, fait grandir le besoin à
 * structure constante (le besoin normatif en jours), puis ajoute ce que la place de marché change à
 * la structure : les particuliers, qui payaient à la commande, deviennent une créance.
 *
 * LE CROISEMENT : la trésorerie nette reste positive, mais le compte courant passe à découvert, parce
 * que la trésorerie nette compte le compte à terme, bloqué jusqu'au 6 janvier. LE CALCUL À REBOURS :
 * un curseur cherche le délai de reversement le plus long que le compte courant supporte. La réponse
 * demande un jugement : le plan se finance si la place de marché reverse plus vite, pas tel quel.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde), chez NOVA
 * seule : ses chiffres sont ceux de `bilanDeLExercice`.
 *
 * CE QUE LE CAS SUPPOSE (dit à l'élève) : le directeur financier raisonne sur le bilan du
 * 31 décembre, comme si la croissance y était déjà, à fonds de roulement inchangé ; les ventes aux
 * particuliers grandissent comme le reste, de 20 %, et passent toutes par la place de marché
 * (reversées toutes taxes comprises, sans commission, étalées également sur 360 jours) ; le reste du
 * besoin d'exploitation suit le chiffre d'affaires ; le besoin hors exploitation ne bouge pas.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number, decimales = 2) => n.toLocaleString("fr-FR", { maximumFractionDigits: decimales }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t * 100)} %`;
/** Un nombre de jours, accordé : « 1 jour », « 24 jours ». */
const jours = (n: number) => `${qte(n)} jour${Math.abs(n) >= 2 ? "s" : ""}`;
/** Un montant retranché, sans « − − ». */
const moins = (x: number) => (x < 0 ? `+ ${eur(-x)}` : `− ${eur(x)}`);
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les bornes du curseur du délai de reversement, en jours. */
export const DELAI_DU_CURSEUR = { min: 0, max: 60 } as const;

export type Verdict = "reverser-plus-vite" | "financable";

/** Les chiffres du cas, et ce qu'ils disent du plan. */
export function vendrePlus(c: Pick<Cas, "code">) {
  const x = bilanDeLExercice(c);
  const g = 1 + CROISSANCE_DES_VENTES;
  // À structure constante : le besoin d'exploitation suit le chiffre d'affaires.
  const besoinDExploitationApres = x.besoinDExploitationApres;
  const supplement = x.supplementDeBesoin;
  // La place de marché : les ventes aux particuliers de l'an prochain, reversées à d jours.
  const particuliersApres = auCentime(x.ventesAuxParticuliersTtc * g);
  const creanceA = (delai: number) => auCentime((particuliersApres * delai) / 360);
  const creance = creanceA(PLACE_DE_MARCHE.delai);
  const besoinApres = auCentime(besoinDExploitationApres + x.besoinHorsExploitation + creance);
  const tresorerieNetteApres = auCentime(x.fondsDeRoulement - besoinApres);
  // Le compte courant : la trésorerie nette sans le compte à terme, que le plan ne touche pas.
  const compteCourantSansPlace = auCentime(x.postes.banque - supplement);
  const compteCourantApres = auCentime(tresorerieNetteApres - x.placement);
  const delaiSupportable = Math.floor((compteCourantSansPlace * 360) / particuliersApres + 1e-9);
  const verdict: Verdict = compteCourantApres >= 0 ? "financable" : "reverser-plus-vite";
  return {
    x,
    besoinDExploitationApres,
    supplement,
    particuliersApres,
    creanceA,
    creance,
    besoinApres,
    tresorerieNetteApres,
    compteCourantSansPlace,
    compteCourantApres,
    delaiSupportable,
    verdict,
    /** L'erreur de base : la créance de la place de marché comptée sur les ventes hors taxes. */
    compteCourantHorsTaxes: auCentime(compteCourantSansPlace - (particuliersApres / (1 + x.f.tauxDeTva)) * (PLACE_DE_MARCHE.delai / 360)),
  };
}

/** Le bilan du 31 décembre, en masses, et le projet : ce que l'élève a sous les yeux. */
function documents(c: Pick<Cas, "code">): TableauDeDonnees {
  const { x } = vendrePlus(c);
  const p = x.postes;
  const ligne = (libelle: string, valeur: string) => ({ libelle, valeurs: [valeur] });
  return {
    titre: `Le bilan ${dE(x.entreprise)} au 31 décembre, et le projet`,
    colonnes: ["Montant"],
    lignes: [
      ligne("Chiffre d'affaires hors taxes de l'exercice", eur(x.caHt)),
      ligne("Dont ventes aux particuliers, toutes taxes comprises", eur(x.ventesAuxParticuliersTtc)),
      ligne("Ligne de montage, valeur brute", eur(x.emploisStables)),
      ligne("Capitaux propres, résultat compris", eur(x.capitauxPropres)),
      ligne("Amortissements, dépréciations et provisions", eur(auCentime(x.amortissementsEtDepreciations + p.provision))),
      ligne("Emprunt, capital restant dû", eur(p.emprunt)),
      ligne("Actif d'exploitation, en valeurs brutes", eur(x.actifDExploitation)),
      ligne("Passif d'exploitation", eur(x.passifDExploitation)),
      ligne("Impôt dû et intérêts courus de l'emprunt", eur(auCentime(p.impot + p.interetsCourus))),
      ligne("Compte à terme et ses intérêts, bloqué jusqu'au 6 janvier", eur(x.placement)),
      ligne("Banque (le compte courant)", eur(p.banque)),
      ligne("Hausse du chiffre d'affaires visée", pct(CROISSANCE_DES_VENTES)),
      ligne("Délai de reversement de la place de marché", `${PLACE_DE_MARCHE.delai} jours`),
    ],
  };
}

export const VENDRE_PLUS_FINANCER_PLUS: Situation = {
  code: "vendre-plus-financer-plus",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["bilan-fonctionnel-et-bfr"],
  commanditaire: "Le directeur financier",
  titre: "Vendre plus, financer plus",
  accroche:
    "Le directeur commercial vise 20 % de chiffre d'affaires en plus, par une place de marché qui reverse les ventes à 30 jours. Avant de valider le plan, le directeur financier veut savoir ce qu'il fera au besoin en fonds de roulement, et si NOVA peut le financer sans toucher à sa réserve.",
  objectifs: [
    "Calculer le fonds de roulement net global, le besoin en fonds de roulement et la trésorerie nette",
    "Prévoir le besoin d'une croissance à structure constante, en jours de chiffre d'affaires",
    "Chiffrer ce qu'un changement de structure des ventes ajoute au besoin",
    "Distinguer la trésorerie nette du compte courant disponible, et retrouver le délai supportable",
    "Répondre au directeur financier, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BILAN_FONCTIONNEL,
    pourquoi: "ce cas reprend le chapitre « Bilan fonctionnel et BFR », qui se lit sur l'exercice de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur financier",
      tableau: documents,
      texte: (c) => {
        const { x } = vendrePlus(c);
        return [
          `« Le directeur commercial vise ${pct(CROISSANCE_DES_VENTES)} de chiffre d'affaires en plus l'an prochain. Pour y arriver, il veut vendre aux particuliers par une place de marché : elle leur ouvre un public bien plus large, mais ne nous reverse les ventes qu'à ${PLACE_DE_MARCHE.delai} jours, alors qu'ils paient aujourd'hui à la commande. Avant de valider son plan, je veux savoir de combien la croissance ferait grossir notre besoin en fonds de roulement, et si nous pouvons la financer sans toucher au compte à terme : il garde la réserve de la seconde ligne. »`,
          `« Raisonnez sur le bilan du 31 décembre, comme si la croissance y était déjà, à fonds de roulement inchangé. Les ventes aux particuliers grandissent comme le reste et passent toutes par la place de marché, qui les reverse toutes taxes comprises, sans commission ; comptez-les étalées également sur 360 jours. Le reste du besoin d'exploitation suit le chiffre d'affaires ; le hors exploitation ne bouge pas. »`,
          `Pas de cours cette fois : vous avez le bilan ${dE(x.entreprise)}, et la méthode est celle du chapitre. À vous de l'enchaîner.`,
        ];
      },
      repere: () =>
        "À rendre : le bilan fonctionnel du 31 décembre, ce qui suit les ventes, le besoin d'une croissance à structure constante, ce que la place de marché y ajoute, le délai qu'elle devrait accepter, et votre réponse.",
    },
    {
      id: "au-31-decembre",
      type: "montants",
      titre: "Le bilan fonctionnel du 31 décembre",
      notions: ["frng", "bfr", "net_treasury"],
      tableau: documents,
      question: () => "Commencez par le bilan fonctionnel du 31 décembre : le fonds de roulement net global, le besoin en fonds de roulement, puis la trésorerie nette.",
      champs: (c) => {
        const { x } = vendrePlus(c);
        const p = x.postes;
        return [
          {
            libelle: "Fonds de roulement net global",
            attendu: x.fondsDeRoulement,
            calcul: `${eur(x.capitauxPropres)} + ${eur(auCentime(x.amortissementsEtDepreciations + p.provision))} + ${eur(p.emprunt)} − ${eur(x.emploisStables)} = ${eur(x.fondsDeRoulement)}`,
          },
          {
            libelle: "Besoin en fonds de roulement",
            attendu: x.besoin,
            calcul: `${eur(x.actifDExploitation)} − ${eur(x.passifDExploitation)} − ${eur(auCentime(p.impot + p.interetsCourus))} = ${eur(x.besoin)}`,
          },
          { libelle: "Trésorerie nette", attendu: x.tresorerieNette, calcul: `${eur(x.fondsDeRoulement)} ${moins(x.besoin)} = ${eur(x.tresorerieNette)}, soit ${eur(x.placement)} + ${eur(p.banque)}` },
        ];
      },
      explication: (c) => {
        const { x } = vendrePlus(c);
        return [
          `Au 31 décembre, le fonds de roulement couvre largement le besoin : il reste ${eur(x.tresorerieNette)} de trésorerie nette. Mais ${eur(x.placement)} en sont sur le compte à terme, que le plan ne doit pas toucher : le compte courant n'a que ${eur(x.postes.banque)}.`,
        ];
      },
    },
    {
      id: "ce-qui-suit-les-ventes",
      type: "tri",
      titre: "Ce qui suit les ventes",
      notions: ["bfr", "frng"],
      question: () =>
        "Les ventes augmentent. Rangez chaque masse : elle grossit avec le chiffre d'affaires, ou elle n'en dépend pas.",
      categories: [
        { code: "suit", libelle: "Suit les ventes" },
        { code: "fixe", libelle: "N'en dépend pas" },
      ],
      elements: (c) => {
        const { x } = vendrePlus(c);
        const p = x.postes;
        return [
          { libelle: "Actif d'exploitation", montant: x.actifDExploitation, categorie: "suit", pourquoi: "Plus de ventes, ce sont plus de factures qui attendent d'être payées et plus de composants en stock." },
          { libelle: "Passif d'exploitation", montant: x.passifDExploitation, categorie: "suit", pourquoi: "Plus de ventes demandent plus d'achats, payés au même délai, et plus de TVA à reverser : la dette grossit avec elles." },
          { libelle: "Impôt dû et intérêts courus", montant: auCentime(p.impot + p.interetsCourus), categorie: "fixe", pourquoi: "Ils naissent du bénéfice de l'année et de l'emprunt, pas du volume des ventes au jour du bilan." },
          { libelle: "Emprunt", montant: p.emprunt, categorie: "fixe", pourquoi: "L'emprunt suit son échéancier : il ne grossit que si l'on emprunte à nouveau." },
          { libelle: "Ligne de montage, valeur brute", montant: x.emploisStables, categorie: "fixe", pourquoi: "Les équipements ne changent que si l'on investit : une décision, pas un effet des ventes." },
        ];
      },
      explication: () => [
        "Le besoin d'exploitation est fait de ce qui suit les ventes : il grandit avec l'activité. Le fonds de roulement est fait de ce qui n'en dépend pas : il ne bouge que par décision (un emprunt, un apport, un investissement) ou par les bénéfices gardés.",
      ],
    },
    {
      id: "a-structure-constante",
      type: "montants",
      titre: "La croissance, à structure constante",
      notions: ["bfr", "payment_terms"],
      question: () =>
        "D'abord sans la place de marché. Exprimez le besoin en fonds de roulement d'exploitation en jours de chiffre d'affaires hors taxes, au centième ; à structure constante, ces jours ne changent pas. Quel serait le besoin d'exploitation après la croissance, et de combien grossirait-il ?",
      champs: (c) => {
        const r = vendrePlus(c);
        const x = r.x;
        return [
          { libelle: "Besoin d'exploitation, en jours de chiffre d'affaires", attendu: x.besoinEnJours, calcul: `${eur(x.besoinDExploitation)} ÷ ${eur(x.caHt)} × 360 = ${qte(x.besoinEnJours)} jours`, tolerance: 0.01 },
          {
            libelle: "Besoin d'exploitation après la croissance",
            attendu: r.besoinDExploitationApres,
            calcul: `${eur(x.besoinDExploitation)} × ${qte(1 + CROISSANCE_DES_VENTES)} = ${eur(r.besoinDExploitationApres)}, les mêmes jours de ${eur(x.caApresCroissance)}`,
            tolerance: 1,
          },
          { libelle: "Supplément de besoin, à structure constante", attendu: r.supplement, calcul: `${eur(r.besoinDExploitationApres)} − ${eur(x.besoinDExploitation)} = ${eur(r.supplement)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = vendrePlus(c);
        return [
          `À structure constante, la croissance immobilise ${eur(r.supplement)} de plus : ${qte(r.x.besoinEnJours)} jours, c'est peu, parce que les particuliers paient à la commande. Le compte courant les porterait sans peine. Mais le plan change justement la structure : les particuliers ne paieront plus à la commande.`,
        ];
      },
    },
    {
      id: "avec-la-place-de-marche",
      type: "montants",
      titre: "Ce que la place de marché ajoute",
      notions: ["bfr", "payment_terms", "net_treasury", "receivables_financing"],
      question: () =>
        "Ajoutez la place de marché : ses reversements en attente au 31 décembre, sur les ventes aux particuliers de l'an prochain. Calculez sa créance, le besoin en fonds de roulement après la croissance (hors exploitation compris), la trésorerie nette, puis ce qui resterait sur le compte courant, le compte à terme mis à part.",
      champs: (c) => {
        const r = vendrePlus(c);
        const x = r.x;
        return [
          {
            libelle: "Créance sur la place de marché",
            attendu: r.creance,
            calcul: `${eur(x.ventesAuxParticuliersTtc)} × ${qte(1 + CROISSANCE_DES_VENTES)} × ${PLACE_DE_MARCHE.delai} ÷ 360 = ${eur(r.particuliersApres)} × ${PLACE_DE_MARCHE.delai} ÷ 360 = ${eur(r.creance)}`,
            tolerance: 1,
          },
          {
            libelle: "Besoin en fonds de roulement après la croissance",
            attendu: r.besoinApres,
            calcul: `${eur(r.besoinDExploitationApres)} ${moins(-x.besoinHorsExploitation)} + ${eur(r.creance)} = ${eur(r.besoinApres)}`,
            tolerance: 1,
          },
          { libelle: "Trésorerie nette après la croissance", attendu: r.tresorerieNetteApres, calcul: `${eur(x.fondsDeRoulement)} ${moins(r.besoinApres)} = ${eur(r.tresorerieNetteApres)}`, tolerance: 1 },
          { libelle: "Compte courant après la croissance", attendu: r.compteCourantApres, calcul: `${eur(r.tresorerieNetteApres)} − ${eur(x.placement)} de compte à terme = ${eur(r.compteCourantApres)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = vendrePlus(c);
        return [
          `La place de marché ajoute ${eur(r.creance)} au besoin, bien plus que la croissance elle-même (${eur(r.supplement)}) : des ventes encaissées à la commande deviennent une créance de ${PLACE_DE_MARCHE.delai} jours. Le besoin en jours ne vaut que si la structure des ventes reste la même.`,
          r.compteCourantApres < 0
            ? `La trésorerie nette resterait positive, ${eur(r.tresorerieNetteApres)}, et pourtant le compte courant serait à découvert de ${eur(-r.compteCourantApres)} : la trésorerie nette compte le compte à terme, que le plan ne doit pas toucher.`
            : `Le compte courant resterait positif, à ${eur(r.compteCourantApres)} : le plan se finance sans toucher au compte à terme.`,
        ];
      },
    },
    {
      id: "le-delai-a-negocier",
      type: "curseur",
      titre: "Le délai à négocier",
      notions: ["payment_terms", "net_treasury", "receivables_financing"],
      question: (c) => {
        const r = vendrePlus(c);
        return `La croissance à structure constante laisse ${eur(r.compteCourantSansPlace)} sur le compte courant. Faites varier le délai de reversement de la place de marché, de ${DELAI_DU_CURSEUR.min} à ${DELAI_DU_CURSEUR.max} jours : quel est le délai le plus long que le compte courant supporte sans passer à découvert ? Placez le curseur au jour près, puis validez.`;
      },
      grandeur: () => ({ libelle: "Délai de reversement de la place de marché", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: vendrePlus(c).delaiSupportable, min: DELAI_DU_CURSEUR.min, max: DELAI_DU_CURSEUR.max }),
      zones: ["Compte courant positif", "Compte courant à découvert"],
      rates: () => ({
        dessous: "Plus long, le compte courant reste positif : cherchez le délai le plus long.",
        dessus: "À ce délai, la créance de la place de marché dépasse ce que le compte courant peut avancer.",
      }),
      montrer: "Montrer le délai",
      lecture: (c, d) => {
        const r = vendrePlus(c);
        const creance = r.creanceA(d);
        const besoin = auCentime(r.besoinDExploitationApres + r.x.besoinHorsExploitation + creance);
        return [
          { libelle: "Créance sur la place de marché", montant: creance },
          { libelle: "Besoin en fonds de roulement", montant: besoin },
          { libelle: "Trésorerie nette", montant: auCentime(r.x.fondsDeRoulement - besoin) },
          { libelle: "Compte courant", montant: auCentime(r.compteCourantSansPlace - creance), fort: true },
        ];
      },
      droites: (c) => {
        const r = vendrePlus(c);
        return { produit: () => r.compteCourantSansPlace, cout: (d) => (r.particuliersApres * d) / 360, libelles: ["Compte courant, avant la place de marché", "Créance sur la place de marché"] };
      },
      explication: (c) => {
        const r = vendrePlus(c);
        return [
          `Chaque jour de reversement immobilise ${eur(auCentime(r.particuliersApres / 360))} de ventes aux particuliers. Au-delà de ${jours(r.delaiSupportable)}, la créance de la place de marché dépasse ce que le compte courant peut avancer : à ${PLACE_DE_MARCHE.delai} jours, il manque ${eur(-r.compteCourantApres)}. C'est le délai à négocier, ou le découvert à financer.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Quelle réponse envoyez-vous au directeur financier ?",
      options: (c) => {
        const r = vendrePlus(c);
        const x = r.x;
        return [
          {
            texte: `Pas à ${PLACE_DE_MARCHE.delai} jours : le compte courant passerait à ${eur(r.compteCourantApres)} ; il faut un reversement à ${jours(r.delaiSupportable)} au plus`,
            juste: r.verdict === "reverser-plus-vite",
            retour: `Oui : à structure constante, la croissance ne demande que ${eur(r.supplement)}, mais la place de marché transforme des ventes au comptant en une créance de ${eur(r.creance)}. La trésorerie nette resterait positive, à ${eur(r.tresorerieNetteApres)}, grâce au seul compte à terme, réservé à la seconde ligne. À ${jours(r.delaiSupportable)} au plus, le compte courant tient ; sinon, il faut un financement du besoin (un découvert autorisé, l'affacturage) ou toucher à la réserve.`,
          },
          {
            texte: `Oui : la trésorerie nette resterait positive, à ${eur(r.tresorerieNetteApres)}, la croissance se finance seule`,
            juste: r.verdict === "financable",
            retour: `Non : cette trésorerie nette compte les ${eur(x.placement)} du compte à terme, bloqués jusqu'au 6 janvier et réservés à la seconde ligne. Sans eux, le compte courant serait à ${eur(r.compteCourantApres)}.`,
          },
          {
            texte: `Oui : le besoin ne grossit que de ${eur(r.supplement)}, puisque ses ${qte(x.besoinEnJours)} jours de chiffre d'affaires suivent les ventes à structure constante`,
            juste: false,
            retour: `Non : c'est oublier que le plan change la structure. Les ${qte(x.besoinEnJours)} jours valent pour des particuliers qui paient à la commande ; par la place de marché, ils paient à ${PLACE_DE_MARCHE.delai} jours, et la créance ajoute ${eur(r.creance)}.`,
          },
          {
            texte: `De peu : le compte courant passerait à ${eur(r.compteCourantHorsTaxes)}, quelques jours de découvert sans enjeu`,
            juste: false,
            retour: `Non : c'est compter la créance sur les ventes hors taxes. La place de marché encaisse et reverse les ventes toutes taxes comprises : sa créance est de ${eur(r.creance)}, et le compte courant passerait à ${eur(r.compteCourantApres)}.`,
          },
        ];
      },
    },
  ],
};
