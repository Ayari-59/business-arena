import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { COURS_DU_DOLLAR, COURS_DU_LABORATOIRE, DETTE_EN_DOLLARS, HARBOR_AUDIO, PROVISION_CHERCHEE, coursSansPerte, operationsEnDevises } from "../monde/comptabilite-approfondie";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES OPÉRATIONS EN DEVISES, ÉCARTS DE CONVERSION ET PERTE DE CHANGE
 * (DCG UE10 · Comptabilité approfondie, palier 4 ; BUT GEA).
 *
 * En novembre N + 1, NOVA vend 2 000 enceintes à Harbor Audio, à Boston, en dollars, et achète des
 * haut-parleurs en dollars, à la même échéance. L'élève enregistre la vente au cours du jour,
 * convertit la créance et la dette au cours de clôture, passe les écarts de conversion, et limite
 * la provision pour perte de change à la position globale. Le curseur cherche le cours où la créance
 * ne perd rien ; le laboratoire, le cours qui fait une provision donnée.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule (monde/comptabilite-approfondie.ts).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const usd = (x: number) => `${x.toLocaleString("fr-FR")} $`;
const cours = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export const LES_OPERATIONS_EN_DEVISES: Chapitre = {
  code: "les-operations-en-devises",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: ["DCG UE10 · Comptabilité approfondie", "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation"],
  titre: "Les opérations en devises : écarts de conversion et perte de change",
  accroche:
    "Une vente en dollars, payée après la clôture : ce que vaut la créance à la clôture quand le dollar a baissé, ce que la comptabilité constate, et ce qu'elle attend.",
  objectifs: [
    "Enregistrer une opération en devises au cours du jour",
    "Convertir une créance et une dette au cours de clôture et passer les écarts de conversion",
    "Calculer la provision pour perte de change, et la limiter à la position globale",
    "Distinguer une perte latente et une perte réalisée",
  ],
  libre: false,
  prerequis: ["creation-premier-bilan", "remises-et-reglements"],
  entreprises: {
    codes: ["nova"],
    pourquoi: "ce chapitre suit la première vente de NOVA hors d'Europe, et l'achat qu'elle paie dans la même devise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une vente en dollars",
      notions: ["currency_risk"],
      texte: (c) => {
        const d = operationsEnDevises();
        return [
          `Le 15 novembre N + 1, ${c.entreprise} vend ${HARBOR_AUDIO.enceintes.toLocaleString("fr-FR")} enceintes à ${HARBOR_AUDIO.nom}, un distributeur de Boston, ${usd(HARBOR_AUDIO.prixEnDollars)} pièce, soit ${usd(d.dollars)}, payables le ${HARBOR_AUDIO.echeance}. Ce jour-là, 1 $ vaut ${cours(COURS_DU_DOLLAR.facture)}. Une livraison hors de l'Union européenne est exonérée de TVA.`,
          `La comptabilité tient en euros : la vente s'enregistre au cours du jour. Mais la créance reste due en dollars ; si le dollar baisse d'ici le paiement, NOVA encaissera moins d'euros. Au 31 décembre, 1 $ ne vaut plus que ${cours(COURS_DU_DOLLAR.cloture)}.`,
        ];
      },
      repere: () => "L'opération : au cours du jour. La créance ou la dette à la clôture : au cours de clôture, l'écart au compte 476 (une perte latente) ou 477 (un gain latent). Seule la perte latente se provisionne.",
    },
    {
      id: "la-vente",
      objectifs: [0],
      type: "ecriture",
      titre: "La vente, au journal",
      notions: ["currency_risk", "revenue"],
      evenement: () => `Passez la vente à ${HARBOR_AUDIO.nom} du 15 novembre N + 1, au cours du jour.`,
      ecriture: () => {
        const d = operationsEnDevises();
        return {
          date: "15 novembre N + 1",
          libelle: `Vente à ${HARBOR_AUDIO.nom}, ${usd(d.dollars)}`,
          lignes: [
            { role: "la créance sur le client, en euros", compte: "411", sens: "debit", montant: d.creanceALaFacture, indice: "les dollars, au cours du jour" },
            { role: "la vente de produits finis", compte: "701", sens: "credit", montant: d.creanceALaFacture, indice: "les dollars, au cours du jour, sans TVA" },
          ],
        };
      },
      indices: () => [
        `${usd(operationsEnDevises().dollars)} au cours de ${cours(COURS_DU_DOLLAR.facture)} pour 1 $.`,
        "Une livraison hors de l'Union européenne est exonérée : ni TVA collectée, ni TTC.",
      ],
      explication: () => {
        const d = operationsEnDevises();
        return [`${usd(d.dollars)} × ${cours(COURS_DU_DOLLAR.facture)} = ${eur(d.creanceALaFacture)}. La vente est acquise à ce montant : ce que le dollar fera ensuite ne change pas le chiffre d'affaires.`];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "la-conversion",
      objectifs: [1],
      type: "montants",
      titre: "La créance au cours de clôture",
      notions: ["currency_risk"],
      question: () => `Au 31 décembre N + 1, 1 $ vaut ${cours(COURS_DU_DOLLAR.cloture)}. Calculez la créance convertie au cours de clôture, et l'écart de conversion.`,
      champs: () => {
        const d = operationsEnDevises();
        return [
          { libelle: "Créance au cours de clôture", attendu: d.creanceALaCloture, calcul: `${usd(d.dollars)} × ${cours(COURS_DU_DOLLAR.cloture)} = ${eur(d.creanceALaCloture)}` },
          { libelle: "Écart de conversion", attendu: d.ecartSurLaCreance, calcul: `${eur(d.creanceALaFacture)} − ${eur(d.creanceALaCloture)} = ${eur(d.ecartSurLaCreance)}` },
        ];
      },
      explication: () => {
        const d = operationsEnDevises();
        return [`Si le dollar en reste là, NOVA encaissera ${eur(d.creanceALaCloture)} : ${eur(d.ecartSurLaCreance)} de moins que la vente. C'est une perte latente : le paiement n'a pas eu lieu, le dollar peut encore remonter.`];
      },
    },
    {
      id: "l-ecart-au-journal",
      objectifs: [1],
      type: "ecriture",
      titre: "L'écart de conversion, au journal",
      notions: ["currency_risk"],
      evenement: () => "Ramenez la créance au cours de clôture.",
      ecriture: () => {
        const d = operationsEnDevises();
        return {
          date: "31 décembre N + 1",
          libelle: `Écart de conversion sur la créance de ${HARBOR_AUDIO.nom}`,
          lignes: [
            { role: "la différence de conversion, à l'actif", compte: "476", sens: "debit", montant: d.ecartSurLaCreance, indice: "l'écart de conversion" },
            { role: "la créance, ramenée au cours de clôture", compte: "411", sens: "credit", montant: d.ecartSurLaCreance, indice: "l'écart de conversion" },
          ],
        };
      },
      indices: () => [
        "La créance baisse : le 411 se crédite de l'écart.",
        "La contrepartie n'est pas une charge : la perte n'est pas réalisée. Elle attend à l'actif, en différence de conversion (476).",
      ],
      explication: () => [
        "La créance figure au bilan à ce qu'elle vaut au cours de clôture. Le résultat n'est pas touché par l'écart lui-même : c'est la prudence qui va le faire, par une provision.",
      ],
      vue: "bilan-et-resultat",
    },
    {
      id: "la-dette",
      objectifs: [1],
      type: "choix",
      titre: "Et la dette en dollars ?",
      notions: ["currency_risk"],
      question: () => {
        const d = operationsEnDevises();
        return `Le même 15 novembre, NOVA a acheté des haut-parleurs à ${DETTE_EN_DOLLARS.fournisseur} pour ${usd(DETTE_EN_DOLLARS.montantEnDollars)}, payables le ${HARBOR_AUDIO.echeance} : une dette de ${eur(d.detteALaFacture)}. Au cours de clôture, elle ne vaut plus que ${eur(d.detteALaCloture)}. Que constate le comptable ?`;
      },
      options: () => {
        const d = operationsEnDevises();
        return [
          {
            texte: `Un écart de ${eur(d.ecartSurLaDette)} au 477, sans produit`,
            juste: true,
            retour: "Oui : la dette se ramène au cours de clôture, et le gain latent attend au passif, en différence de conversion (477). La prudence interdit de compter un gain qui n'est pas réalisé.",
          },
          {
            texte: `Un gain de change de ${eur(d.ecartSurLaDette)} au compte de résultat, puisque la dette a baissé`,
            juste: false,
            retour: "Non : le gain n'est que latent. Le constater en produit, ce serait compter sur un dollar qui peut remonter d'ici février.",
          },
          {
            texte: "Rien : une dette se garde au cours du jour où elle est née, jusqu'à son paiement",
            juste: false,
            retour: "Non : à la clôture, toute créance et toute dette en devises se convertit au cours du jour de clôture ; l'écart va au 476 ou au 477.",
          },
        ];
      },
    },
    {
      id: "la-position-globale",
      objectifs: [2],
      type: "montants",
      titre: "La provision pour perte de change",
      notions: ["currency_risk"],
      question: () =>
        "La créance et la dette sont dans la même devise, à la même échéance : elles forment une position globale de change, et la provision peut se limiter à l'excédent des pertes latentes sur les gains latents. Calculez la provision qu'il faudrait pour la créance seule, puis celle de la position globale.",
      champs: () => {
        const d = operationsEnDevises();
        return [
          { libelle: "Provision pour la créance seule", attendu: d.provisionSeule, calcul: `la perte latente sur la créance : ${eur(d.provisionSeule)}` },
          { libelle: "Provision de la position globale", attendu: d.provision, calcul: `${eur(d.ecartSurLaCreance)} − ${eur(d.ecartSurLaDette)} = ${eur(d.provision)}` },
        ];
      },
      explication: () => {
        const d = operationsEnDevises();
        return [`Si le dollar en reste là, NOVA perdra ${eur(d.ecartSurLaCreance)} en encaissant, mais gagnera ${eur(d.ecartSurLaDette)} en payant, le même jour : son risque net est de ${eur(d.provision)}.`];
      },
    },
    {
      id: "la-provision-au-journal",
      objectifs: [2],
      type: "ecriture",
      titre: "La provision, au journal",
      notions: ["currency_risk"],
      evenement: () => "Passez la provision pour perte de change de la position globale.",
      ecriture: () => {
        const d = operationsEnDevises();
        return {
          date: "31 décembre N + 1",
          libelle: "Provision pour perte de change, position globale en dollars",
          lignes: [
            { role: "la dotation aux provisions financières", compte: "6865", acceptes: ["686"], sens: "debit", montant: d.provision, indice: "la provision de la position globale" },
            { role: "la provision pour perte de change", compte: "1515", acceptes: ["151"], sens: "credit", montant: d.provision, indice: "la provision de la position globale" },
          ],
        };
      },
      indices: () => ["Une charge financière : les dotations aux provisions financières (6865).", "Au passif, une provision pour risques : pour pertes de change (1515)."],
      explication: () => ["La perte de change est probable mais pas réalisée : elle se provisionne. Au paiement, les écarts de conversion s'annulent, la provision se reprend, et seul le cours du jour du paiement fixe la perte ou le gain réel."],
      vue: "resultat",
    },
    {
      id: "le-cours-sans-perte",
      objectifs: [1],
      type: "curseur",
      titre: "Le cours sous lequel la créance perd",
      notions: ["currency_risk"],
      question: () =>
        "Faites varier le cours de clôture, exprimé en euros pour 1 000 $ : une droite donne la créance au cours de clôture, l'autre la créance à la vente. Placez le curseur sur le cours le plus bas où la créance ne perd rien.",
      grandeur: () => ({ libelle: "Cours de clôture, en euros pour 1 000 $", unite: "€" }),
      cible: () => ({ attendu: coursSansPerte(), min: 850, max: 950 }),
      zones: ["La créance ne perd rien", "Perte latente à provisionner"],
      rates: () => ({
        dessous: "À ce cours, la créance vaut moins qu'à la vente : il y a une perte latente. Montez.",
        dessus: "À ce cours, la créance ne perd rien, mais un cours plus bas suffit encore : cherchez le plus bas.",
      }),
      montrer: "Montrer le cours",
      lecture: (_c, q) => {
        const d = operationsEnDevises(q / 1_000);
        return [
          { libelle: "Créance au cours de clôture", montant: d.creanceALaCloture },
          { libelle: "Créance à la vente", montant: d.creanceALaFacture },
          { libelle: "Perte latente sur la créance", montant: Math.max(0, d.ecartSurLaCreance), fort: true },
        ];
      },
      droites: () => {
        const d = operationsEnDevises();
        return { produit: (q) => (d.dollars * q) / 1_000, cout: () => d.creanceALaFacture, libelles: ["Créance au cours de clôture", "Créance à la vente"] };
      },
      explication: () => [
        `Tant que 1 000 $ valent au moins ${eur(coursSansPerte())}, le cours de la vente, la créance ne perd rien ; un gain latent, lui, ne se compte pas. Le risque de change ne joue que dans un sens pour le résultat : celui de la perte.`,
      ],
    },
    {
      id: "le-laboratoire-du-change",
      objectifs: [2],
      type: "simulation",
      titre: "Le dollar à la clôture",
      notions: ["currency_risk"],
      question: () => "Faites varier le cours du dollar au 31 décembre : regardez l'écart sur la créance, l'écart sur la dette et la provision de la position globale.",
      leviers: () => [{ code: "cours", libelle: "Cours de clôture, en euros pour 1 $", unite: "€", ...COURS_DU_LABORATOIRE, depart: COURS_DU_DOLLAR.cloture }],
      lecture: (_c, p) => {
        const d = operationsEnDevises(p.cours!);
        const ref = operationsEnDevises();
        return [
          { libelle: "Écart sur la créance", montant: d.ecartSurLaCreance, reference: ref.ecartSurLaCreance },
          { libelle: "Écart sur la dette", montant: d.ecartSurLaDette, reference: ref.ecartSurLaDette },
          { libelle: "Provision de la position globale", montant: d.provision, reference: ref.provision, fort: true },
        ];
      },
      graphique: () => ({ levier: "cours", courbes: [{ libelle: "Provision", valeur: (p) => operationsEnDevises(p.cours!).provision }] }),
      defi: () => ({
        consigne: `Trouvez le cours de clôture, au centime, qui fait une provision de ${eur(PROVISION_CHERCHEE)}.`,
        atteint: (p) => Math.abs(operationsEnDevises(p.cours!).provision - PROVISION_CHERCHEE) < 0.5,
        indice: (p) => {
          const v = operationsEnDevises(p.cours!).provision;
          return v < PROVISION_CHERCHEE ? `À ${cours(p.cours!)}, la provision n'est que de ${eur(v)}.` : `À ${cours(p.cours!)}, la provision atteint ${eur(v)}, plus que ce qui est demandé.`;
        },
        solution: { cours: Math.round((COURS_DU_DOLLAR.facture - PROVISION_CHERCHEE / (operationsEnDevises().dollars - DETTE_EN_DOLLARS.montantEnDollars)) * 100) / 100 },
      }),
      explication: (_c, p) => {
        const d = operationsEnDevises(p.cours!);
        return [
          `Défi relevé : à ${cours(p.cours!)}, la créance perd ${eur(d.ecartSurLaCreance)}, la dette gagne ${eur(d.ecartSurLaDette)}, et la provision couvre l'écart, ${eur(d.provision)}. Chaque centime de baisse coûte à NOVA sur les dollars qu'elle attend, moins ceux qu'elle doit.`,
        ];
      },
    },
    {
      id: "le-reglement",
      objectifs: [3],
      type: "choix",
      titre: "Le jour du paiement",
      notions: ["currency_risk"],
      question: () => {
        const d = operationsEnDevises();
        return `Le ${HARBOR_AUDIO.echeance}, ${HARBOR_AUDIO.nom} paie ses ${usd(d.dollars)} ; 1 $ vaut alors ${cours(COURS_DU_DOLLAR.reglement)}. NOVA encaisse ${eur(d.encaisse)}. Que constate-t-elle, par rapport à la vente ?`;
      },
      options: () => {
        const d = operationsEnDevises();
        return [
          {
            texte: `Un gain de change réalisé de ${eur(d.gainDeChange)}`,
            juste: true,
            retour: `Oui : ${eur(d.encaisse)} − ${eur(d.creanceALaFacture)} = ${eur(d.gainDeChange)}, au compte 766. La perte latente de la clôture ne s'est pas réalisée : les écarts de conversion ont été extournés à l'ouverture de N + 2, et la provision se reprend.`,
          },
          {
            texte: `Une perte de change de ${eur(d.ecartSurLaCreance)}, celle qui avait été provisionnée`,
            juste: false,
            retour: "Non : la provision couvrait une perte latente. Le dollar est remonté : la perte ne s'est pas réalisée, la provision se reprend.",
          },
          {
            texte: "Rien de plus : la vente est enregistrée, l'encaissement solde la créance",
            juste: false,
            retour: `Non : NOVA encaisse ${eur(d.encaisse)} pour une créance de ${eur(d.creanceALaFacture)}. L'écart est un gain de change, réalisé cette fois.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["currency_risk"],
      texte: () => {
        const d = operationsEnDevises();
        return [
          `La vente à ${HARBOR_AUDIO.nom} s'enregistre à ${eur(d.creanceALaFacture)}, au cours du jour. À la clôture, la créance perd ${eur(d.ecartSurLaCreance)} (476), la dette gagne ${eur(d.ecartSurLaDette)} (477) ; la position globale fait une provision de ${eur(d.provision)}. Au paiement, le cours du jour fixe le résultat réel : ${eur(d.gainDeChange)} de gain.`,
          "Dans l'arène, toutes les ventes se font en euros : le risque de change est celui qu'une entreprise prend en vendant hors de la zone euro.",
        ];
      },
      repere: () => "Perte latente : 476, et une provision (6865 / 1515). Gain latent : 477, sans produit. Au paiement, perte (666) ou gain (766) de change réalisé.",
    },
  ],
};
