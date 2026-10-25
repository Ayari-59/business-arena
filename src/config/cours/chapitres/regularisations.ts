import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime, type Ecriture } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { nomDuClient } from "../provisions";
import {
  MOIS_DANS_L_EXERCICE,
  MOIS_PAR_AN,
  PART_LIVREE_EN_JANVIER,
  assurance,
  factureAEtablir,
  factureNonParvenue,
  produitDAvance,
} from "../regularisations";
import type { Chapitre } from "../types";
import { balanceApresInventaire, cloture } from "./la-cloture";

/**
 * CHAPITRE : RÉGULARISATIONS DE FIN D'EXERCICE (comptabilité générale, palier 4).
 *
 * La suite de « La clôture » : l'année de l'arène en balance, amortissements et stock
 * passés. Le comptable rattache à l'année ce qui lui appartient, et à elle seulement : la
 * part d'une prime d'assurance payée d'avance qui couvre l'année suivante (charge constatée
 * d'avance), un achat livré dont la facture n'est pas arrivée (facture non parvenue), une
 * vente livrée pas encore facturée (facture à établir), une commande facturée mais livrée
 * pour moitié en janvier (produit constaté d'avance). Puis le résultat, et le 1er janvier :
 * l'extourne.
 *
 * Les montants sont ceux de l'arène, leur place à cheval sur deux années celle du cours
 * (`regularisations.ts`) : dans l'arène, tout se règle dans le trimestre.
 */

const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");

/** Le résultat de la balance d'ouverture, puis celui des régularisations faites. */
export function resultatsDesRegularisations(c: Cas) {
  const k = cloture(c);
  const a = assurance(c);
  const fnp = factureNonParvenue(c).ht;
  const fae = factureAEtablir(c).ht;
  const pca = produitDAvance(c).enJanvier;
  // La balance ne porte ni l'achat ni la vente livrés fin décembre, et porte la moitié livrée
  // en janvier : son résultat s'écarte de celui de l'arène d'autant.
  const balance = auCentime(k.resultatAvantImpot + fnp - fae + pca);
  const sans = auCentime(balance - a.annuelle);
  const apres = auCentime(k.resultatAvantImpot - a.chargeDeLAnnee);
  return { arene: k.resultatAvantImpot, balance, sans, apres, effet: auCentime(apres - sans) };
}

/**
 * Le journal en ouvrant le chapitre : la balance de « La clôture », amortissements et stock
 * passés, telle que le comptable l'a tenue sur les factures reçues et envoyées. L'achat et la
 * vente livrés fin décembre n'y sont pas ; la commande facturée le 15 décembre y est tout
 * entière.
 */
function ouverture(c: Cas): Ecriture {
  const fnp = factureNonParvenue(c);
  const fae = factureAEtablir(c);
  const pca = produitDAvance(c);
  const lignes = balanceApresInventaire(c)
    .filter((l) => l.compte !== "512")
    .map((l) =>
      l.compte === c.achat.compte && l.debit > 0
        ? { ...l, debit: auCentime(l.debit - fnp.ht) }
        : l.compte === c.venteComptant.compte && l.credit > 0
          ? { ...l, credit: auCentime(l.credit - fae.ht + pca.enJanvier) }
          : l,
    );
  const banque = auCentime(lignes.reduce((t, l) => t + l.credit - l.debit, 0));
  lignes.push({ compte: "512", debit: banque > 0 ? banque : 0, credit: banque < 0 ? -banque : 0 });
  return { date: "31 décembre", libelle: "Balance après amortissements et stock : les factures reçues et envoyées de l'année", lignes };
}

export const REGULARISATIONS: Chapitre = {
  code: "regularisations-de-fin-d-exercice",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "Régularisations de fin d'exercice",
  accroche:
    "Une assurance payée pour un an, un achat livré sans facture, une vente faite et pas encore facturée : au 31 décembre, chaque année ne garde que ce qui lui appartient.",
  objectifs: [
    "Appliquer le principe d'indépendance des exercices",
    "Constater une charge payée d'avance et un produit facturé d'avance",
    "Rattacher à l'année un achat dont la facture n'est pas arrivée, une vente pas encore facturée",
    "Mesurer l'effet des régularisations sur le résultat",
    "Extourner les régularisations au 1er janvier",
  ],
  libre: false,
  ouverture,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Chaque année ce qui lui appartient",
      notions: ["income_statement"],
      texte: (c) => [
        `Vous retrouvez l'année de ${c.entreprise} là où « La clôture » l'a laissée, amortissements et stock passés. Le comptable a tenu le journal sur les pièces : les factures reçues, les factures envoyées, les paiements.`,
        "Or une pièce ne tombe pas toujours dans l'année de ce qu'elle concerne. Une facture arrive en janvier pour un achat livré en décembre ; une prime se paie en octobre pour douze mois. La règle est l'indépendance des exercices : chaque année porte les charges et les produits qui la concernent, ni plus ni moins, quelle que soit la date de la pièce.",
        "Dans l'arène, tout se paie et se facture dans le trimestre : les montants de ce chapitre sont ceux de l'arène, leur place à cheval sur deux années est celle du cours.",
      ],
      repere: () =>
        "Une charge ou un produit payé ou facturé d'avance se retire de l'année (constaté d'avance) ; une charge ou un produit né dans l'année sans pièce s'y ajoute (à payer, à recevoir).",
    },
    {
      id: "assurance",
      type: "ecriture",
      titre: "La prime d'assurance",
      notions: ["income_statement"],
      evenement: (c) => {
        const a = assurance(c);
        return `Le 1er octobre, ${c.entreprise} a souscrit la formule « ${a.formule} », celle que l'arène propose, à son prix : ${eur(a.parTrimestre)} par trimestre. L'assureur demande l'année d'avance : ${eur(a.annuelle)}, prélevés le jour même. Passez le paiement.`;
      },
      ecriture: (c) => {
        const a = assurance(c);
        return {
          date: "1er octobre",
          libelle: `Prime d'assurance annuelle, formule « ${a.formule} »`,
          lignes: [
            { role: "la prime d'assurance", compte: "616", sens: "debit", montant: a.annuelle, indice: "la prime de l'année" },
            { role: "le paiement", compte: "512", sens: "credit", montant: a.annuelle, indice: "la prime de l'année" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : les primes d'assurances, 616. La banque au crédit.",
        "Pas de TVA : les assurances en sont exonérées. Deux lignes suffisent.",
      ],
      explication: (c) => [
        `Toute la prime est passée en charge. Elle couvre pourtant ${MOIS_PAR_AN} mois, du 1er octobre au 30 septembre de l'année suivante : ${c.entreprise} n'en a consommé que ${MOIS_DANS_L_EXERCICE} au 31 décembre.`,
      ],
      vue: "resultat",
    },
    {
      id: "part-d-avance",
      type: "montants",
      titre: "La part de l'année suivante",
      notions: ["income_statement"],
      question: (c) => {
        const a = assurance(c);
        return `La prime de ${eur(a.annuelle)} couvre ${MOIS_PAR_AN} mois à partir du 1er octobre. Combien de mois tombent dans l'année suivante, et quelle part de la prime leur revient ?`;
      },
      champs: (c) => {
        const a = assurance(c);
        return [
          { libelle: "Mois de l'année suivante", attendu: a.moisSuivants, calcul: `de janvier à septembre : ${a.moisSuivants} mois`, tolerance: 0 },
          { libelle: "Charge constatée d'avance", attendu: a.davance, calcul: `${eur(a.annuelle)} × ${a.moisSuivants} ÷ ${MOIS_PAR_AN} = ${eur(a.davance)}` },
        ];
      },
      explication: (c) => {
        const a = assurance(c);
        return [`Il reste à l'année qui se clôt ${eur(a.chargeDeLAnnee)} : trois mois, exactement la prime d'un trimestre de l'arène.`];
      },
    },
    {
      id: "charge-d-avance",
      type: "ecriture",
      titre: "La charge constatée d'avance",
      notions: ["income_statement"],
      evenement: (c) => `Retirez de l'année la part de la prime qui couvre l'année suivante : ${eur(assurance(c).davance)}.`,
      ecriture: (c) => {
        const a = assurance(c);
        return {
          date: "31 décembre",
          libelle: "Charge constatée d'avance : assurance",
          lignes: [
            { role: "la charge constatée d'avance", compte: "486", sens: "debit", montant: a.davance, indice: "la part de la prime de l'année suivante" },
            { role: "la prime d'assurance, diminuée", compte: "616", sens: "credit", montant: a.davance, indice: "la part de la prime de l'année suivante" },
          ],
        };
      },
      indices: () => [
        "La charge diminue : le compte 616 passe au crédit.",
        "En face, un actif : ce qui a été payé et n'est pas encore consommé, les charges constatées d'avance, 486.",
      ],
      explication: (c) => {
        const a = assurance(c);
        return [`L'année ne garde que ${eur(a.chargeDeLAnnee)} d'assurance. Les ${eur(a.davance)} restent à l'actif, comme une avance que l'assureur rendra en couverture l'an prochain.`];
      },
      vue: "resultat",
    },
    {
      id: "facture-non-parvenue",
      type: "ecriture",
      titre: "Un achat sans facture",
      notions: ["income_statement", "vat_payable"],
      evenement: (c) => {
        const f = factureNonParvenue(c);
        return `Le 28 décembre, ${f.fournisseur} a livré ${f.designation.charAt(0).toLowerCase()}${f.designation.slice(1)} : ${eur(f.ht)} hors taxes, TVA à ${pct(f.tauxTva)}. La facture arrivera le 6 janvier. Rattachez l'achat à l'année.`;
      },
      ecriture: (c) => {
        const f = factureNonParvenue(c);
        return {
          date: "31 décembre",
          libelle: `Facture non parvenue, ${f.fournisseur}`,
          lignes: [
            { role: "l'achat de l'année", compte: f.compte, acceptes: f.acceptes, sens: "debit", montant: f.ht, indice: "le montant hors taxes de la livraison" },
            { role: "la TVA à récupérer quand la facture arrivera", compte: "44586", sens: "debit", montant: f.tva, indice: "la TVA de la livraison" },
            { role: "la dette envers le fournisseur, sans facture", compte: "408", sens: "credit", montant: f.ttc, indice: "le montant TVA comprise de la livraison" },
          ],
        };
      },
      indices: () => [
        "L'achat au débit, comme s'il était facturé ; la TVA aussi, mais sur le compte des factures non parvenues (44586) : elle ne se déduira qu'avec la facture.",
        "Au crédit, pas le compte 401 : une dette sans facture va au 408, fournisseurs, factures non parvenues.",
      ],
      explication: (c) => {
        const f = factureNonParvenue(c);
        return [`Les ${eur(f.ht)} d'achat sont des charges de l'année : la livraison de décembre a servi à l'activité de décembre, la facture n'y change rien.`];
      },
      vue: "resultat",
    },
    {
      id: "facture-a-etablir",
      type: "ecriture",
      titre: "Une vente pas encore facturée",
      notions: ["income_statement", "vat_payable"],
      evenement: (c) => {
        const f = factureAEtablir(c);
        return `Le 30 décembre, ${c.entreprise} a terminé pour ${nomDuClient(f.client)} une commande de ${qte(f.quantite)} ${c.unites} : ${eur(f.ht)} hors taxes, TVA à ${pct(f.tauxTva)}. La facture partira le 4 janvier. Rattachez la vente à l'année.`;
      },
      ecriture: (c) => {
        const f = factureAEtablir(c);
        return {
          date: "31 décembre",
          libelle: `Facture à établir, ${nomDuClient(f.client)}`,
          lignes: [
            { role: "la créance sur le client, pas encore facturée", compte: "418", sens: "debit", montant: f.ttc, indice: "le montant TVA comprise de la commande" },
            { role: "la vente de l'année", compte: f.compte, acceptes: f.acceptes, sens: "credit", montant: f.ht, indice: "le montant hors taxes de la commande" },
            { role: "la TVA à collecter quand la facture partira", compte: "44587", sens: "credit", montant: f.tva, indice: "la TVA de la commande" },
          ],
        };
      },
      indices: () => [
        "Le miroir de la facture non parvenue : la vente au crédit, et sa TVA sur le compte des factures à établir (44587).",
        "Au débit, pas le compte 411 : une créance sans facture va au 418, clients, factures à établir.",
      ],
      explication: (c) => [`La vente est de l'année : c'est en décembre que ${c.entreprise} a servi son client. La date de la facture n'y change rien.`],
      vue: "resultat",
    },
    {
      id: "facture-d-avance",
      type: "choix",
      titre: "Une facture trop tôt",
      notions: ["income_statement"],
      question: (c) => {
        const f = factureAEtablir(c);
        const p = produitDAvance(c);
        return `Le 15 décembre, à sa demande, ${nomDuClient(f.client)} a reçu et réglé la facture d'une autre commande de ${qte(f.quantite)} ${c.unites} : ${eur(p.facture)} hors taxes, passés en ventes. La moitié a été servie le 18 décembre ; l'autre le sera le 12 janvier. Que fait le comptable au 31 décembre ?`;
      },
      options: (c) => {
        const p = produitDAvance(c);
        return [
          {
            texte: `Il retire de l'année la part servie en janvier, ${eur(p.enJanvier)} : un produit constaté d'avance.`,
            juste: true,
            retour: `C'est cela : ${eur(p.facture)} × ${pct(PART_LIVREE_EN_JANVIER)} = ${eur(p.enJanvier)}. Une vente appartient à l'année où l'on livre ou l'on sert le client, pas à celle de la facture. Le client a payé, mais ${c.entreprise} lui doit encore la moitié de la commande : c'est une dette, au passif.`,
          },
          {
            texte: "Rien : la facture est envoyée et payée, la vente est faite.",
            juste: false,
            retour: "Facturer n'est pas vendre. La moitié servie en janvier est une vente de l'année suivante : la garder ici gonfle le résultat de l'année qui se clôt.",
          },
          {
            texte: "Il annule toute la facture, et la repassera en janvier.",
            juste: false,
            retour: "La moitié servie le 18 décembre est bien une vente de l'année. On ne retire que ce qui sera servi en janvier.",
          },
        ];
      },
    },
    {
      id: "produit-d-avance",
      type: "ecriture",
      titre: "Le produit constaté d'avance",
      notions: ["income_statement"],
      evenement: (c) => `Retirez de l'année la part de la commande servie en janvier : ${eur(produitDAvance(c).enJanvier)}.`,
      ecriture: (c) => {
        const f = factureAEtablir(c);
        const p = produitDAvance(c);
        return {
          date: "31 décembre",
          libelle: `Produit constaté d'avance, ${nomDuClient(f.client)}`,
          lignes: [
            { role: "la vente, diminuée", compte: f.compte, acceptes: f.acceptes, sens: "debit", montant: p.enJanvier, indice: "la part servie en janvier, hors taxes" },
            { role: "le produit constaté d'avance", compte: "487", sens: "credit", montant: p.enJanvier, indice: "la part servie en janvier, hors taxes" },
          ],
        };
      },
      indices: () => [
        "Le miroir de la charge constatée d'avance : la vente diminue, au débit.",
        "En face, au passif, les produits constatés d'avance, 487. Hors taxes : la TVA de la facture reste due.",
      ],
      explication: () => [`L'année ne garde que la moitié servie en décembre. La part de janvier reviendra en ventes le 1er janvier, quand l'écriture s'extournera.`],
      vue: "resultat",
    },
    {
      id: "resultat",
      type: "montants",
      titre: "Ce que les régularisations changent",
      notions: ["income_statement"],
      question: (c) => {
        const r = resultatsDesRegularisations(c);
        return `Sur les seules pièces, prime d'assurance comprise, le résultat avant impôt de l'année était de ${eur(r.sans)}. Vous avez passé quatre régularisations. Que valent-elles ensemble, et quel est le résultat avant impôt ?`;
      },
      champs: (c) => {
        const r = resultatsDesRegularisations(c);
        const a = assurance(c);
        const fnp = factureNonParvenue(c).ht;
        const fae = factureAEtablir(c).ht;
        const pca = produitDAvance(c).enJanvier;
        const signe = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);
        return [
          {
            libelle: "Effet des régularisations",
            attendu: r.effet,
            calcul: `+ ${eur(a.davance)} d'assurance d'avance − ${eur(fnp)} d'achat + ${eur(fae)} de vente − ${eur(pca)} de vente d'avance = ${signe(r.effet)}`,
          },
          { libelle: "Résultat avant impôt", attendu: r.apres, calcul: `${eur(r.sans)} ${signe(r.effet)} = ${eur(r.apres)}` },
        ];
      },
      explication: (c) => {
        const r = resultatsDesRegularisations(c);
        const a = assurance(c);
        return [
          `C'est le résultat de l'arène pour l'année, ${eur(r.arene)}, moins le trimestre d'assurance que ${c.entreprise} doit porter, ${eur(a.chargeDeLAnnee)}. Les pièces faisaient dire à l'année autre chose que ce qu'elle a fait ; les régularisations lui rendent son résultat.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "extourne",
      type: "choix",
      titre: "Le 1er janvier",
      notions: ["income_statement"],
      question: (c) => `Le 6 janvier, la facture de ${factureNonParvenue(c).fournisseur} arrive ; le comptable la passe comme toute facture, au 401. Que doit-il avoir fait le 1er janvier pour ne pas compter l'achat deux fois ?`,
      options: () => [
        {
          texte: "Extourner les régularisations : passer, le 1er janvier, l'écriture inverse de chacune.",
          juste: true,
          retour:
            "C'est cela. L'extourne annule dans l'année nouvelle ce que le 31 décembre a rattaché à l'ancienne : l'achat sort, la facture du 6 janvier le remet, et l'année nouvelle n'en porte rien. La charge et le produit constatés d'avance, eux, reviennent dans l'année qu'ils concernent.",
        },
        {
          texte: "Rien : l'achat et la facture se compensent d'eux-mêmes.",
          juste: false,
          retour: "Sans extourne, l'année nouvelle porterait l'achat une seconde fois, avec la facture, et le compte 408 ne se solderait jamais.",
        },
        {
          texte: "Ne pas passer la facture du 6 janvier.",
          juste: false,
          retour: "La facture est la pièce : elle se passe toujours. C'est la régularisation qui s'efface, par l'extourne.",
        },
      ],
    },
    {
      id: "extourne-assurance",
      type: "ecriture",
      titre: "L'assurance revient",
      notions: ["income_statement"],
      evenement: (c) => `Le 1er janvier de l'année suivante, extournez la charge constatée d'avance de l'assurance, ${eur(assurance(c).davance)}.`,
      ecriture: (c) => {
        const a = assurance(c);
        return {
          date: "1er janvier N+1",
          libelle: "Extourne : charge constatée d'avance, assurance",
          lignes: [
            { role: "la prime de l'année nouvelle", compte: "616", sens: "debit", montant: a.davance, indice: "la charge constatée d'avance" },
            { role: "la charge constatée d'avance, soldée", compte: "486", sens: "credit", montant: a.davance, indice: "la charge constatée d'avance" },
          ],
        };
      },
      indices: () => ["L'écriture du 31 décembre, retournée : 616 au débit, 486 au crédit."],
      explication: (c) => {
        const a = assurance(c);
        return [`L'année nouvelle porte ses ${a.moisSuivants} mois d'assurance, ${eur(a.davance)}, sans rien payer : la prime l'a été en octobre.`];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement"],
      texte: (c) => {
        const r = resultatsDesRegularisations(c);
        return [
          `Vous avez rendu à l'année de ${c.entreprise} ce qui lui appartient : ${eur(r.sans)} sur les pièces, ${eur(r.apres)} une fois régularisée.`,
          "Les intérêts courus du chapitre « La clôture » sont une régularisation du même genre : une charge à payer, née dans l'année, réglée l'année suivante.",
          "Dans l'arène, rien n'est à cheval : l'assurance se paie trimestre par trimestre, et chaque trimestre ne porte que le sien. C'est ce que vos écritures ont reconstruit.",
        ];
      },
      repere: () =>
        "Constaté d'avance : payé ou facturé, pas encore consommé ni servi, on le retire (486, 487). À payer, à recevoir : consommé ou servi, pas encore facturé, on l'ajoute (408, 418). Le 1er janvier, tout s'extourne.",
    },
  ],
};
