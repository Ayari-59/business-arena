import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { CHANTIER_ARPEGE, COUTS_DU_LABORATOIRE, COUT_REESTIME, RESULTAT_CHERCHE, contratALAvancement } from "../monde/comptabilite-approfondie";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES CONTRATS À LONG TERME, LE RÉSULTAT À L'AVANCEMENT
 * (DCG UE10 · Comptabilité approfondie, palier 4 ; BUT GEA).
 *
 * NOVA pose la sonorisation de la salle Arpège, un chantier à cheval sur N + 1 et N + 2. L'élève
 * mesure l'avancement par les coûts engagés, constate le chiffre d'affaires et la marge de
 * l'exercice, passe ce qui reste à facturer, compare à la méthode à l'achèvement, et provisionne
 * une perte à terminaison. Le curseur cherche le coût total au-delà duquel le contrat perd ; le
 * laboratoire, l'avancement qui fait un résultat donné.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule (monde/comptabilite-approfondie.ts).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 10_000) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const k = CHANTIER_ARPEGE;

export const LES_CONTRATS_A_LONG_TERME: Chapitre = {
  code: "les-contrats-a-long-terme",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: ["DCG UE10 · Comptabilité approfondie", "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation"],
  titre: "Les contrats à long terme : le résultat à l'avancement",
  accroche:
    "Un chantier commencé en mars et livré l'année suivante : la part du chiffre d'affaires et de la marge qui revient à chaque exercice, et la perte qu'on ne peut pas attendre.",
  objectifs: [
    "Mesurer l'avancement d'un contrat par les coûts engagés",
    "Calculer et comptabiliser le chiffre d'affaires et le résultat à l'avancement",
    "Comparer la méthode à l'avancement et la méthode à l'achèvement",
    "Calculer la provision pour perte à terminaison",
  ],
  libre: false,
  prerequis: ["creation-premier-bilan", "les-stocks"],
  entreprises: {
    codes: ["nova"],
    pourquoi: "ce chapitre suit le chantier de sonorisation que NOVA mène pour la salle Arpège.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un chantier sur deux exercices",
      notions: ["revenue", "income_statement"],
      texte: (c) => [
        `Le 1er mars N + 1, ${k.client} confie à ${c.entreprise} la conception et la pose de sa sonorisation, livrée en mai N + 2 : ${eur(k.prix)} hors taxes, prix ferme, pour un coût total estimé à ${eur(k.coutTotalEstime)}. Au 31 décembre N + 1, ${c.entreprise} a engagé ${eur(k.coutsEngages)} de coûts et facturé deux situations de travaux, ${eur(k.facture)} hors taxes en tout.`,
        "Un contrat qui court sur plusieurs exercices pose une question : à quel exercice revient sa marge ? La méthode à l'avancement, préférentielle, la répartit au fil des travaux ; la méthode à l'achèvement l'attend jusqu'à la livraison. Une perte, elle, se constate dès qu'elle est connue.",
      ],
      repere: () => "Avancement = coûts engagés ÷ coût total estimé. Chiffre d'affaires de l'exercice = prix × avancement. Une perte à terminaison se provisionne en entier, sans attendre.",
    },
    {
      id: "l-avancement",
      objectifs: [0, 1],
      type: "montants",
      titre: "L'avancement et la marge de N + 1",
      notions: ["revenue"],
      question: () => "Calculez l'avancement du chantier au 31 décembre N + 1 (en pourcentage), le chiffre d'affaires à l'avancement, le résultat de l'exercice sur le contrat, et ce qui reste à facturer.",
      champs: () => {
        const a = contratALAvancement();
        return [
          { libelle: "Avancement (%)", attendu: a.avancementPct, calcul: `${eur(a.coutsEngages)} ÷ ${eur(a.coutTotal)} × 100 = ${pct(a.avancement)}`, tolerance: 0.01 },
          { libelle: "Chiffre d'affaires à l'avancement", attendu: a.produit, calcul: `${eur(a.prix)} × ${pct(a.avancement)} = ${eur(a.produit)}` },
          { libelle: "Résultat de N + 1 sur le contrat", attendu: a.resultatALAvancement, calcul: `${eur(a.produit)} − ${eur(a.coutsEngages)} = ${eur(a.resultatALAvancement)}` },
          { libelle: "Reste à facturer", attendu: a.aFacturer, calcul: `${eur(a.produit)} − ${eur(a.facture)} = ${eur(a.aFacturer)}` },
        ];
      },
      explication: () => {
        const a = contratALAvancement();
        return [`Les travaux sont faits à ${pct(a.avancement)} : l'exercice porte ${pct(a.avancement)} du prix et de la marge totale de ${eur(a.resultatTotal)}, soit ${eur(a.resultatALAvancement)}. Les situations facturées, ${eur(a.facture)}, ne disent pas ce qui est gagné : elles suivent un échéancier de paiement.`];
      },
    },
    {
      id: "a-facturer-au-journal",
      objectifs: [1],
      type: "ecriture",
      titre: "Le chiffre d'affaires à l'avancement, au journal",
      notions: ["revenue"],
      evenement: () => "Complétez le chiffre d'affaires du contrat au 31 décembre N + 1 : les situations sont déjà passées en travaux (704). La TVA de travaux est exigible à l'encaissement : passez le reste à facturer hors taxes.",
      ecriture: () => {
        const a = contratALAvancement();
        return {
          date: "31 décembre N + 1",
          libelle: `Chantier de ${k.client} : travaux à facturer`,
          lignes: [
            { role: "la créance sur le client, produit non encore facturé", compte: "418", sens: "debit", montant: a.aFacturer, indice: "le chiffre d'affaires à l'avancement, moins ce qui est facturé" },
            { role: "les travaux de l'exercice", compte: "704", sens: "credit", montant: a.aFacturer, indice: "le chiffre d'affaires à l'avancement, moins ce qui est facturé" },
          ],
        };
      },
      indices: () => [
        "Au crédit, le produit qui manque : les travaux (704).",
        "Au débit, une créance qui n'a pas encore de facture : clients, produits non encore facturés (418).",
      ],
      explication: () => {
        const a = contratALAvancement();
        return [`Le compte 704 porte désormais ${eur(a.produit)}, le chiffre d'affaires à l'avancement ; les ${eur(a.coutsEngages)} de coûts sont déjà en charges : la marge de l'exercice, ${eur(a.resultatALAvancement)}, est au compte de résultat.`];
      },
    },
    {
      id: "l-achevement",
      objectifs: [2],
      type: "choix",
      titre: "Et à l'achèvement ?",
      notions: ["revenue", "stock"],
      question: (c) => {
        const a = contratALAvancement();
        return `Si ${c.entreprise} retenait la méthode à l'achèvement, que montrerait son compte de résultat de N + 1 pour ce chantier, où elle a engagé ${eur(a.coutsEngages)} ?`;
      },
      options: () => {
        const a = contratALAvancement();
        return [
          {
            texte: "Une marge nulle : les coûts passent en travaux en cours",
            juste: true,
            retour: `Oui : à l'achèvement, les ${eur(a.coutsEngages)} de coûts se stockent en travaux en cours (335, par la variation 7133) et le chiffre d'affaires attend la livraison. N + 1 ne montre rien du contrat ; N + 2 en portera toute la marge, ${eur(a.resultatTotal)}.`,
          },
          {
            texte: `Une perte de ${eur(a.coutsEngages)}, celle des coûts engagés, sans chiffre d'affaires`,
            juste: false,
            retour: "Non : les coûts d'un contrat en cours ne sont pas perdus ; ils se stockent en travaux en cours jusqu'à la livraison.",
          },
          {
            texte: `La marge des situations facturées, ${eur(a.facture)} moins les coûts engagés`,
            juste: false,
            retour: "Non : à l'achèvement, rien ne se constate avant la livraison, et les situations sont des avances, pas un chiffre d'affaires acquis.",
          },
        ];
      },
    },
    {
      id: "la-perte-a-terminaison",
      objectifs: [3],
      type: "montants",
      titre: "Si le chantier dérapait",
      notions: ["income_statement"],
      question: () => `Supposez qu'au 31 décembre N + 1, le coût total soit réestimé à ${eur(COUT_REESTIME)}. Calculez la perte à terminaison, le résultat que l'avancement en constate déjà, et la provision pour perte à terminaison.`,
      champs: () => {
        const a = contratALAvancement(k.coutsEngages, COUT_REESTIME);
        return [
          { libelle: "Perte à terminaison", attendu: -a.resultatTotal, calcul: `${eur(COUT_REESTIME)} − ${eur(a.prix)} = ${eur(-a.resultatTotal)}` },
          { libelle: "Résultat à l'avancement", attendu: a.resultatALAvancement, calcul: `${eur(a.prix)} × ${eur(a.coutsEngages)} ÷ ${eur(COUT_REESTIME)} − ${eur(a.coutsEngages)} = ${eur(a.resultatALAvancement)}`, tolerance: 1 },
          { libelle: "Provision pour perte à terminaison", attendu: a.provisionPourPerte, calcul: `${eur(-a.resultatTotal)} − ${eur(-a.resultatALAvancement)} = ${eur(a.provisionPourPerte)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const a = contratALAvancement(k.coutsEngages, COUT_REESTIME);
        return [`L'avancement ne prend que ${eur(-a.resultatALAvancement)} de la perte ; la prudence en demande la totalité dès N + 1. La provision, ${eur(a.provisionPourPerte)}, porte le résultat de l'exercice sur le contrat à ${eur(a.resultatDeLExercice)}.`];
      },
    },
    {
      id: "le-cout-qui-fait-perdre",
      objectifs: [3],
      type: "curseur",
      titre: "Le coût au-delà duquel le contrat perd",
      notions: ["income_statement"],
      sens: "plus-grande",
      question: () =>
        "Faites varier le coût total estimé du chantier, en milliers d'euros : une droite donne le prix ferme, l'autre le coût total. Placez le curseur sur le plus haut coût total, au millier d'euros, qui ne fait pas de perte à terminaison.",
      grandeur: () => ({ libelle: "Coût total estimé, en milliers d'euros", unite: "k€" }),
      cible: () => ({ attendu: k.prix / 1_000, min: 150, max: 210 }),
      zones: ["Pas de perte à terminaison", "Perte à terminaison à provisionner"],
      rates: () => ({
        dessous: "À ce coût, le contrat gagne encore, et un coût plus élevé aussi : cherchez le plus haut.",
        dessus: "À ce coût, le contrat perd : la provision pour perte à terminaison s'impose.",
      }),
      montrer: "Montrer le coût",
      lecture: (_c, q) => {
        const a = contratALAvancement(k.coutsEngages, q * 1_000);
        return [
          { libelle: "Résultat total du contrat", montant: a.resultatTotal },
          { libelle: "Provision pour perte à terminaison", montant: a.provisionPourPerte, fort: true },
        ];
      },
      droites: () => ({ produit: () => k.prix / 1_000, cout: (q) => q, libelles: ["Prix ferme", "Coût total estimé"] }),
      explication: () => [
        `Jusqu'à ${eur(k.prix)} de coût total, le contrat gagne ou s'équilibre : sa marge se répartit à l'avancement. Au-delà, la perte entière se provisionne dès qu'on la connaît, même si le chantier n'est qu'au début.`,
      ],
    },
    {
      id: "le-laboratoire-de-l-avancement",
      objectifs: [1],
      type: "simulation",
      titre: "L'avancement et le résultat",
      notions: ["revenue"],
      question: () => "Faites varier les coûts engagés au 31 décembre N + 1 : regardez l'avancement, le chiffre d'affaires et le résultat de l'exercice suivre.",
      leviers: () => [{ code: "couts", libelle: "Coûts engagés au 31 décembre N + 1", unite: "€", ...COUTS_DU_LABORATOIRE, depart: k.coutsEngages }],
      lecture: (_c, p) => {
        const a = contratALAvancement(p.couts!);
        const ref = contratALAvancement();
        return [
          { libelle: "Avancement", montant: a.avancementPct, unite: "%", reference: ref.avancementPct },
          { libelle: "Chiffre d'affaires à l'avancement", montant: a.produit, reference: ref.produit },
          { libelle: "Résultat de l'exercice sur le contrat", montant: a.resultatDeLExercice, reference: ref.resultatDeLExercice, fort: true },
        ];
      },
      defi: () => ({
        consigne: `Trouvez les coûts engagés qui donnent un résultat de ${eur(RESULTAT_CHERCHE)} sur le contrat en N + 1.`,
        atteint: (p) => Math.abs(contratALAvancement(p.couts!).resultatDeLExercice - RESULTAT_CHERCHE) < 0.5,
        indice: (p) => {
          const r = contratALAvancement(p.couts!).resultatDeLExercice;
          return r < RESULTAT_CHERCHE ? `À ${eur(p.couts!)} engagés, le résultat n'est que de ${eur(r)} : le chantier est moins avancé.` : `À ${eur(p.couts!)} engagés, le résultat atteint ${eur(r)}, plus que demandé.`;
        },
        solution: { couts: (RESULTAT_CHERCHE / (k.prix - k.coutTotalEstime)) * k.coutTotalEstime },
      }),
      explication: (_c, p) => {
        const a = contratALAvancement(p.couts!);
        return [`Défi relevé : à ${eur(p.couts!)} engagés, le chantier est fait à ${pct(a.avancement)}, et l'exercice porte ${pct(a.avancement)} de la marge totale. À l'avancement, le résultat suit les travaux, pas les factures.`];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["revenue"],
      texte: () => {
        const a = contratALAvancement();
        return [
          `Fait à ${pct(a.avancement)} au 31 décembre N + 1, le chantier de ${k.client} donne ${eur(a.produit)} de chiffre d'affaires et ${eur(a.resultatALAvancement)} de marge à l'exercice, dont ${eur(a.aFacturer)} restent à facturer. Si son coût dérapait au-delà du prix, toute la perte serait provisionnée dès N + 1.`,
          "Dans l'arène, chaque vente est livrée dans le tour : aucun contrat ne court sur deux exercices.",
        ];
      },
      repere: () => "À l'avancement : chiffre d'affaires et marge au prorata des travaux, le reste à facturer au 418. À l'achèvement : les coûts en travaux en cours. Une perte à terminaison : provisionnée en entier, dès qu'elle est connue.",
    },
  ],
};
