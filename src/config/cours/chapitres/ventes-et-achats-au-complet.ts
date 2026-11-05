import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  ACOMPTE_DU_CLIENT,
  COMMANDE_DE_JEUX,
  COMMANDE_DE_LA_RENTREE,
  ESCOMPTE_APRES_FACTURE,
  JOURS_D_AVANCE,
  JOURS_DU_LABORATOIRE,
  PALETTES,
  PORT_FACTURE,
  RABAIS_POUR_DEFAUT,
  TAUX_DU_LABORATOIRE,
  TAUX_DU_PLACEMENT,
  acompteQuiCouvreLesJeux,
  acompteRecu,
  acompteVerse,
  avoirDeRabais,
  composantsPayes,
  ecartDeLaFacture,
  escompteApresLaFacture,
  escompteDuCas,
  factureDeLaRentree,
  factureDesJeux,
  retourDesPalettes,
  soldeDeCampusTech,
  tauxLePlusFort,
  tvaDeLaCommande,
} from "../monde/ventes-et-achats-de-nova";
import { SONORA } from "../monde/exercice-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : VENTES ET ACHATS AU COMPLET, ACOMPTES, PORT, EMBALLAGES, AVOIRS ET ESCOMPTE APRÈS FACTURE
 * (comptabilité générale, palier 3 ; BTS CG P1, 1.2.1, 1.2.2, 1.3.1, 1.5.1 et 1.5.2 ; DCG UE9).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA en N + 1, la commande de la rentrée de CampusTech et
 * les jeux de composants qu'elle demande à Électro-Composants Lyon. Tous les chiffres se calculent dans
 * monde/ventes-et-achats-de-nova.ts.
 *
 * L'objet : ce que « Remises et règlements » laissait de côté. L'acompte reçu et l'acompte versé, avec
 * leur TVA ; le contrôle de la commande, du bon de livraison et de la facture d'achat, la facture avec
 * son port payé, l'avoir qui corrige l'écart ; la facture de vente qui impute l'acompte, avec le port
 * facturé et des palettes consignées ; l'escompte accordé après la facture (conditionnel), face à
 * l'escompte net de taxe ; le retour et la vente des palettes ; le rabais par avoir ; les mentions de la
 * facture, celles de la facture électronique comprises ; la clause de réserve de propriété.
 *
 * MATIÈRE : le cours du propriétaire (le cas de synthèse de la SARL ARISTIDE, son corrigé : la facture
 * avec port et consignation, l'acompte imputé, l'avoir des emballages, l'escompte accordé après coup au
 * 665 avec sa TVA ; le scénario des factures et des avoirs du manuel P1), adapté à NOVA.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, predire-la-tva-de-l-acompte, l-acompte-recu, l-acompte-verse,
 *     le-controle-des-trois-documents, la-facture-d-achat, l-avoir-du-fournisseur, la-facture-de-vente,
 *     la-vente-au-journal ;
 *   · l'expérience avant la formule : l-acompte-qui-couvre (un curseur sur le taux d'acompte, face à ce
 *     que NOVA paie pour les jeux) ; predire-l-escompte-conditionnel puis l-escompte-au-journal et
 *     le-laboratoire-de-l-escompte (le taux et les jours d'avance ; un graphique du coût de l'escompte
 *     face aux intérêts du placement) ;
 *   · autonome et expert : net-de-taxe-ou-conditionnel, le-retour-des-palettes, l-avoir-de-rabais,
 *     les-mentions, la-reserve-de-propriete ; puis la synthèse.
 */

/** Les ventes et achats au complet se jouent chez NOVA. */
export const ENTREPRISES_DES_VENTES_ET_ACHATS: readonly string[] = ["nova"];

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
/** Un taux du laboratoire, en points (0,5 pour 0,5 %). */
const points = (x: number) => `${qte(x)} %`;

const K = COMMANDE_DE_LA_RENTREE;
const J = COMMANDE_DE_JEUX;

/** Tous les chiffres du chapitre. */
export function ventesEtAchatsDuChapitre(_c: Pick<Cas, "code">) {
  return {
    acompteRecu: acompteRecu(),
    acompteVerse: acompteVerse(),
    achat: factureDesJeux(),
    ecart: ecartDeLaFacture(),
    composants: composantsPayes(),
    acompteQuiCouvre: acompteQuiCouvreLesJeux(),
    vente: factureDeLaRentree(),
    escompte: escompteDuCas(),
    tauxMax: tauxLePlusFort(JOURS_D_AVANCE),
    palettes: retourDesPalettes(),
    rabais: avoirDeRabais(),
    solde: soldeDeCampusTech(),
    tva: tvaDeLaCommande(),
  };
}

const position = (p: Readonly<Record<string, number>>) => ({ taux: p.taux ?? 0, jours: p.jours ?? JOURS_D_AVANCE });

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

function lesConditions(): TableauDeDonnees {
  return {
    titre: "La commande de la rentrée, et ses jeux",
    colonnes: ["Conditions"],
    lignes: [
      { libelle: `${K.client}, commande du ${K.commande}`, valeurs: [`${qte(K.enceintes)} NOVA One à ${eur(K.prix)} hors taxes, livrées et facturées le ${K.facture}`] },
      { libelle: "Acompte du client", valeurs: [`${pct(ACOMPTE_DU_CLIENT)} du montant toutes taxes comprises des enceintes, à la commande`] },
      { libelle: "Port facturé au client", valeurs: [`${eur(PORT_FACTURE)} hors taxes, la livraison express dans ses 16 magasins`] },
      { libelle: "Palettes", valeurs: [`${qte(PALETTES.nombre)}, consignées ${eur(PALETTES.consignation)} chacune, sans TVA`] },
      { libelle: `${J.fournisseur}, commande du ${J.commande}`, valeurs: [`${qte(J.jeux)} jeux à ${eur(J.prixConvenu)} hors taxes, ${pct(J.acompte)} d'acompte toutes taxes comprises à la commande`] },
      { libelle: "Port payé au fournisseur", valeurs: [`${eur(J.port)} hors taxes, sur sa facture du ${J.facture}`] },
    ],
  };
}

function lesTroisDocuments(): TableauDeDonnees {
  return {
    titre: `Les trois documents d'${J.fournisseur}`,
    colonnes: ["Commande", "Bon de livraison", "Facture"],
    lignes: [
      { libelle: "Jeux", valeurs: [qte(J.jeux), qte(J.jeux), qte(J.jeux)] },
      { libelle: "Prix d'un jeu, hors taxes", valeurs: [eur(J.prixConvenu), "non chiffré", eur(J.prixFacture)] },
      { libelle: "Port, hors taxes", valeurs: [eur(J.port), "non chiffré", eur(J.port)] },
      { libelle: "Acompte déduit, toutes taxes comprises", valeurs: [eur(acompteVerse().ttc), "non chiffré", eur(acompteVerse().ttc)] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const VENTES_ET_ACHATS_AU_COMPLET: Chapitre = {
  code: "ventes-et-achats-au-complet",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: ["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales", "DCG UE9 · Comptabilité"],
  titre: "Ventes et achats au complet : acomptes, port, emballages, avoirs et escompte après facture",
  accroche:
    "Une grosse commande de CampusTech pour la rentrée : l'acompte et sa TVA, le port, les palettes consignées puis rendues, le rabais, l'escompte accordé après la facture ; et côté fournisseur, la facture contrôlée avant d'être payée.",
  objectifs: [
    "Enregistrer une avance ou un acompte reçu et versé, avec sa TVA",
    "Établir et passer une facture qui impute l'acompte, avec le port facturé et des emballages consignés, puis passer les avoirs du retour des emballages et du rabais",
    "Contrôler une facture d'achat face à la commande et au bon de livraison, et passer la facture, son port et l'avoir qui corrige l'écart",
    "Passer un escompte accordé après la facture, le distinguer de l'escompte net de taxe, et juger s'il vaut ce qu'il coûte",
    "Vérifier les mentions d'une facture, dont celles de la facture électronique, et la clause de réserve de propriété",
  ],
  libre: false,
  prerequis: ["remises-et-reglements"],
  entreprises: {
    codes: ENTREPRISES_DES_VENTES_ET_ACHATS,
    pourquoi: "les ventes et les achats au complet se jouent ici sur NOVA en N + 1, dans la simulation du cours, avec CampusTech et Électro-Composants Lyon ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La commande de la rentrée",
      notions: ["payment_terms", "vat_payable"],
      tableau: lesConditions,
      texte: () => [
        `Ce chapitre se joue dans la simulation du cours, chez NOVA, en N + 1. Le ${K.commande}, ${K.client} commande ${qte(K.enceintes)} NOVA One pour la rentrée de ses magasins. La commande fait partie de la demande de NOVA One de N + 1 ; ce qui est neuf, c'est tout ce qui l'entoure.`,
        `Après ${SONORA.nom}, NOVA ne lance plus une grosse commande sans acompte. Les enceintes partent en express, avec un port facturé, sur des palettes consignées que le client rendra. Côté achats, ${J.fournisseur} demande lui aussi un acompte pour les jeux de composants de cette commande.`,
        "Dans « Remises et règlements », la facture allait droit au règlement. Ici, chaque document compte : la commande, l'acompte, le bon de livraison, la facture, les avoirs.",
      ],
      repere: () =>
        "Un acompte est une avance sur une commande : il se range dans un compte de tiers (4191 pour l'acompte reçu, 4091 pour l'acompte versé) jusqu'à la facture, qui l'impute. Une consignation n'est pas une vente : elle se range au 4196, sans TVA.",
    },
    {
      id: "predire-la-tva-de-l-acompte",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur la TVA de l'acompte",
      notions: ["vat_payable"],
      question: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return `Le ${K.commande}, ${K.client} vire ${eur(x.acompteRecu.ttc)}, ${pct(ACOMPTE_DU_CLIENT)} du montant toutes taxes comprises des enceintes. NOVA n'a encore rien livré. Doit-elle déjà la TVA sur cet acompte ?`;
      },
      options: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [
          {
            texte: `Oui, ${eur(x.acompteRecu.tva)}, dès l'encaissement`,
            juste: true,
            retour: `Oui. Depuis 2023, l'acompte encaissé sur une livraison de biens rend la TVA exigible, comme pour un service : ${eur(x.acompteRecu.ttc)} contiennent ${eur(x.acompteRecu.ht)} hors taxes et ${eur(x.acompteRecu.tva)} de TVA, que NOVA déclare avec le mois de juillet.`,
          },
          {
            texte: "Non : la TVA d'une vente de biens n'est due qu'au jour de la livraison",
            juste: false,
            retour: "C'était la règle pour les biens jusqu'à fin 2022. Depuis 2023, l'acompte rend la TVA exigible dès son encaissement, pour un bien comme pour un service.",
          },
          {
            texte: "Non : un acompte n'est pas encore une vente, il n'y a donc jamais de TVA à payer dessus",
            juste: false,
            retour: "L'acompte n'est pas encore une vente, c'est vrai ; mais il est le paiement d'une vente à venir, et la TVA suit l'argent encaissé.",
          },
        ];
      },
    },
    {
      id: "l-acompte-recu",
      objectifs: [0],
      type: "ecriture",
      titre: "L'acompte reçu, au journal",
      notions: ["vat_payable", "payment_terms"],
      evenement: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return `Le ${K.commande}, ${K.client} vire ${eur(x.acompteRecu.ttc)} d'acompte. NOVA lui envoie une facture d'acompte : ${eur(x.acompteRecu.ht)} hors taxes, ${eur(x.acompteRecu.tva)} de TVA.`;
      },
      ecriture: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return {
          date: K.commande,
          libelle: `Acompte de ${K.client}`,
          lignes: [
            { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: x.acompteRecu.ttc, indice: "le montant viré, toutes taxes comprises" },
            { role: "l'acompte reçu du client", compte: "4191", acceptes: ["419"], sens: "credit", montant: x.acompteRecu.ht, indice: "l'acompte hors taxes" },
            { role: "la TVA collectée sur l'acompte", compte: "44571", sens: "credit", montant: x.acompteRecu.tva, indice: "la TVA contenue dans l'acompte" },
          ],
        };
      },
      indices: () => [
        "La banque reçoit l'argent. Ce n'est pas encore une vente : rien au 701.",
        "L'acompte est une dette de NOVA envers son client tant qu'elle n'a pas livré : 4191, au crédit, pour le hors taxes. La TVA collectée, au crédit, pour le reste.",
      ],
      explication: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [`Le 4191 dit que NOVA doit ${eur(x.acompteRecu.ht)} de marchandises à ${K.client} : si la commande était annulée, elle lui rendrait l'argent. La vente, elle, attend la livraison du ${K.facture}.`];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "l-acompte-verse",
      objectifs: [0],
      type: "ecriture",
      titre: "L'acompte versé au fournisseur",
      notions: ["vat_payable", "payment_terms"],
      evenement: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return `Le ${J.commande}, NOVA commande ${qte(J.jeux)} jeux à ${J.fournisseur}, ${eur(x.acompteVerse.ttcDeLaCommande)} toutes taxes comprises, et lui vire ${pct(J.acompte)} d'acompte : ${eur(x.acompteVerse.ttc)}, dont ${eur(x.acompteVerse.tva)} de TVA, sur sa facture d'acompte.`;
      },
      ecriture: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return {
          date: J.commande,
          libelle: `Acompte à ${J.fournisseur}`,
          lignes: [
            { role: "l'acompte versé au fournisseur", compte: "4091", acceptes: ["409"], sens: "debit", montant: x.acompteVerse.ht, indice: "l'acompte hors taxes" },
            { role: "la TVA déductible sur l'acompte", compte: "44566", sens: "debit", montant: x.acompteVerse.tva, indice: "la TVA de la facture d'acompte" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: x.acompteVerse.ttc, indice: "le montant viré, toutes taxes comprises" },
          ],
        };
      },
      indices: () => [
        "C'est le miroir de l'acompte reçu : la banque paie, et ce n'est pas encore un achat.",
        "L'acompte versé est une créance sur le fournisseur : 4091, au débit. La TVA de la facture d'acompte se déduit déjà.",
      ],
      explication: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [`Le 4091 est une créance : ${J.fournisseur} doit ${eur(x.acompteVerse.ht)} de jeux à NOVA. La facture des jeux l'éteindra en l'imputant.`];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "le-controle-des-trois-documents",
      objectifs: [2],
      type: "montants",
      titre: "Commande, bon de livraison, facture",
      notions: ["payment_terms"],
      tableau: lesTroisDocuments,
      question: () =>
        `Le ${J.facture}, les jeux arrivent avec leur bon de livraison, puis la facture. Avant de la passer, le comptable rapproche les trois documents. Calculez l'écart par jeu, l'écart hors taxes sur la facture, sa TVA et le montant de l'avoir à demander, toutes taxes comprises.`,
      champs: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [
          { libelle: "Écart par jeu", attendu: x.ecart.unitaire, calcul: `${eur(J.prixFacture)} − ${eur(J.prixConvenu)} = ${eur(x.ecart.unitaire)}` },
          { libelle: "Écart hors taxes", attendu: x.ecart.ht, calcul: `${eur(x.ecart.unitaire)} × ${qte(J.jeux)} = ${eur(x.ecart.ht)}` },
          { libelle: "TVA de l'écart", attendu: x.ecart.tva, calcul: `${eur(x.ecart.ht)} × 20 % = ${eur(x.ecart.tva)}` },
          { libelle: "Avoir à demander, toutes taxes comprises", attendu: x.ecart.ttc, calcul: `${eur(x.ecart.ht)} + ${eur(x.ecart.tva)} = ${eur(x.ecart.ttc)}` },
        ];
      },
      explication: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [
          `Les quantités concordent, le port et l'acompte aussi ; le prix, non : la facture applique ${eur(J.prixFacture)} au lieu des ${eur(J.prixConvenu)} de la commande. Le comptable ne bloque pas la facture, il la signale : le fournisseur reconnaît l'erreur et envoie un avoir de ${eur(x.ecart.ttc)}.`,
          "C'est le contrôle de toute facture d'achat avant son règlement : ce qui a été commandé (la commande), ce qui a été reçu (le bon de livraison), ce qui est facturé (la facture).",
        ];
      },
    },
    {
      id: "la-facture-d-achat",
      objectifs: [2],
      type: "ecriture",
      titre: "La facture d'achat, acompte déduit",
      notions: ["vat_payable", "payment_terms"],
      evenement: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return `Passez la facture du ${J.facture} telle qu'elle est arrivée : ${eur(x.achat.jeux)} de jeux, ${eur(x.achat.port)} de port, ${eur(x.achat.tva)} de TVA, soit ${eur(x.achat.ttc)} ; l'acompte de ${eur(x.achat.acompte.ttc)} déduit, ${eur(x.achat.netAPayer)} restent à payer. L'avoir corrigera l'écart.`;
      },
      ecriture: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return {
          date: J.facture,
          libelle: `Facture ${J.fournisseur}`,
          lignes: [
            { role: "l'achat des jeux", compte: "601", acceptes: ["602"], sens: "debit", montant: x.achat.jeux, indice: "les jeux, au prix facturé" },
            { role: "le port payé sur l'achat", compte: "6241", acceptes: ["624"], sens: "debit", montant: x.achat.port, indice: "le port hors taxes" },
            { role: "la TVA déductible qui reste", compte: "44566", sens: "debit", montant: x.achat.tvaRestante, indice: "la TVA de la facture, moins celle déjà déduite sur l'acompte" },
            { role: "l'acompte qui s'impute", compte: "4091", acceptes: ["409"], sens: "credit", montant: x.achat.acompte.ht, indice: "l'acompte hors taxes, versé en juillet" },
            { role: "la dette fournisseur", compte: "401", sens: "credit", montant: x.achat.netAPayer, indice: "ce qui reste à payer, acompte déduit" },
          ],
        };
      },
      indices: () => [
        "Au débit : l'achat, le port (un frais accessoire d'achat), la TVA. Mais une part de la TVA a déjà été déduite sur l'acompte.",
        "Au crédit : l'acompte s'éteint pour son hors taxes, et la dette fournisseur porte ce qui reste à payer.",
      ],
      explication: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [
          `L'achat porte tout le prix des jeux ; l'acompte ne réduit pas l'achat, il réduit ce qui reste à payer. La TVA de la facture, ${eur(x.achat.tva)}, se déduit en deux fois : ${eur(x.achat.acompte.tva)} en juillet sur l'acompte, ${eur(x.achat.tvaRestante)} maintenant.`,
          "Le port payé est un frais accessoire d'achat : il se range au 6241, transports sur achats, ou avec l'achat lui-même au 601, selon le plan de comptes de l'entreprise.",
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "l-avoir-du-fournisseur",
      objectifs: [2],
      type: "ecriture",
      titre: "L'avoir du fournisseur",
      notions: ["vat_payable"],
      evenement: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return `${J.fournisseur} envoie l'avoir de l'écart de prix : ${eur(x.ecart.ht)} hors taxes, ${eur(x.ecart.tva)} de TVA, ${eur(x.ecart.ttc)} en tout.`;
      },
      ecriture: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return {
          date: J.facture,
          libelle: `Avoir ${J.fournisseur}`,
          lignes: [
            { role: "la dette fournisseur qui baisse", compte: "401", sens: "debit", montant: x.ecart.ttc, indice: "l'avoir, toutes taxes comprises" },
            { role: "l'achat corrigé", compte: "601", acceptes: ["609"], sens: "credit", montant: x.ecart.ht, indice: "l'écart hors taxes" },
            { role: "la TVA déductible corrigée", compte: "44566", sens: "credit", montant: x.ecart.tva, indice: "la TVA de l'écart" },
          ],
        };
      },
      indices: () => ["Un avoir défait une part de la facture : chaque ligne de la facture s'inverse, pour l'écart.", "La dette baisse (au débit), l'achat et la TVA déductible aussi (au crédit)."],
      explication: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [
          `NOVA ne devra plus que ${eur(x.achat.netAPayer - x.ecart.ttc)} le ${J.reglement}. Un avoir qui corrige une erreur de facturation annule une part de l'achat : il se passe au 601. Un rabais, une remise ou une ristourne obtenus après la facture iraient au 609, en moins des achats.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "l-acompte-qui-couvre",
      objectifs: [0],
      type: "curseur",
      titre: "Combien d'acompte demander ?",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return `Pour les jeux de la commande, NOVA paie ${eur(x.composants)} à ${J.fournisseur} avant que ${K.client} ne règle son solde : l'acompte versé en juillet et le solde du ${J.reglement}, avoir déduit. Faites varier l'acompte demandé au client, en pourcentage du montant toutes taxes comprises des enceintes, ${eur(x.acompteRecu.ttcDesEnceintes)}. Quel est le plus petit acompte, en points entiers, qui couvre ce que NOVA paie pour les jeux ?`;
      },
      grandeur: () => ({ libelle: "Acompte demandé au client", unite: "%" }),
      sens: "plus-petite",
      cible: (c) => ({ attendu: ventesEtAchatsDuChapitre(c).acompteQuiCouvre, max: 60 }),
      zones: ["L'acompte couvre les jeux", "NOVA avance l'argent des jeux"],
      rates: () => ({
        dessous: "À ce taux, l'acompte ne couvre pas encore ce que NOVA paie pour les jeux.",
        dessus: "Cet acompte couvre les jeux, mais un taux plus bas les couvrirait encore : cherchez le plus petit.",
      }),
      montrer: "Montrer le plus petit acompte",
      lecture: (c, q) => {
        const x = ventesEtAchatsDuChapitre(c);
        const acompte = Math.round(x.acompteRecu.ttcDesEnceintes * q) / 100;
        return [
          { libelle: "Acompte reçu du client", montant: acompte },
          { libelle: "Payé pour les jeux", montant: x.composants },
          { libelle: "Argent que NOVA avance", montant: Math.max(0, Math.round((x.composants - acompte) * 100) / 100), fort: true },
        ];
      },
      droites: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return { produit: (q) => (x.acompteRecu.ttcDesEnceintes * q) / 100, cout: () => x.composants, libelles: ["Acompte reçu du client", "Payé pour les jeux"] };
      },
      explication: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [
          `Il faudrait ${qte(x.acompteQuiCouvre)} % d'acompte pour que le client finance les jeux de sa commande. Avec ${pct(ACOMPTE_DU_CLIENT)}, NOVA reçoit ${eur(x.acompteRecu.ttc)} et avance ${eur(x.composants - x.acompteRecu.ttc)} jusqu'au règlement du solde.`,
          `L'acompte n'est pas qu'une sécurité contre un client qui ferait défaut, comme ${SONORA.nom} : il finance la commande. Son taux se négocie, entre ce que le client accepte et ce que la commande coûte à préparer.`,
        ];
      },
    },
    {
      id: "la-facture-de-vente",
      objectifs: [1],
      type: "montants",
      titre: "La facture du client",
      notions: ["payment_terms", "vat_payable"],
      question: () =>
        `Le ${K.facture}, NOVA livre et facture : ${qte(K.enceintes)} enceintes à ${eur(K.prix)} hors taxes, ${eur(PORT_FACTURE)} de port, ${qte(PALETTES.nombre)} palettes consignées à ${eur(PALETTES.consignation)}, TVA à 20 %, l'acompte toutes taxes comprises déduit. Établissez la facture.`,
      champs: (c) => {
        const v = ventesEtAchatsDuChapitre(c).vente;
        return [
          { libelle: "Enceintes, hors taxes", attendu: v.enceintes, calcul: `${qte(K.enceintes)} × ${eur(K.prix)} = ${eur(v.enceintes)}` },
          { libelle: "Base de la TVA", attendu: v.baseDeTva, calcul: `${eur(v.enceintes)} + ${eur(v.port)} de port = ${eur(v.baseDeTva)}` },
          { libelle: "TVA", attendu: v.tva, calcul: `${eur(v.baseDeTva)} × 20 % = ${eur(v.tva)}` },
          { libelle: "Consignation des palettes", attendu: v.consignation, calcul: `${qte(PALETTES.nombre)} × ${eur(PALETTES.consignation)} = ${eur(v.consignation)}, sans TVA` },
          { libelle: "Total de la facture", attendu: v.total, calcul: `${eur(v.baseDeTva)} + ${eur(v.tva)} + ${eur(v.consignation)} = ${eur(v.total)}` },
          { libelle: "Net à payer, acompte déduit", attendu: v.netAPayer, calcul: `${eur(v.total)} − ${eur(v.acompte.ttc)} = ${eur(v.netAPayer)}` },
        ];
      },
      explication: (c) => {
        const v = ventesEtAchatsDuChapitre(c).vente;
        return [
          "Le port facturé s'ajoute au prix : il entre dans la base de la TVA. La consignation, elle, n'est pas une vente : c'est un dépôt que NOVA rendra si les palettes reviennent, sans TVA.",
          `L'acompte se déduit pour son montant toutes taxes comprises, ${eur(v.acompte.ttc)} : sa TVA, ${eur(v.acompte.tva)}, a déjà été collectée en juillet.`,
        ];
      },
    },
    {
      id: "la-vente-au-journal",
      objectifs: [1],
      type: "ecriture",
      titre: "La facture qui impute l'acompte",
      notions: ["vat_payable", "revenue"],
      evenement: (c) => {
        const v = ventesEtAchatsDuChapitre(c).vente;
        return `Passez la facture du ${K.facture} : ${eur(v.netAPayer)} restent à payer par ${K.client}, acompte déduit.`;
      },
      ecriture: (c) => {
        const v = ventesEtAchatsDuChapitre(c).vente;
        return {
          date: K.facture,
          libelle: `Facture ${K.client}, commande de la rentrée`,
          lignes: [
            { role: "la créance sur le client", compte: "411", sens: "debit", montant: v.netAPayer, indice: "le net à payer, acompte déduit" },
            { role: "l'acompte qui s'impute", compte: "4191", acceptes: ["419"], sens: "debit", montant: v.acompte.ht, indice: "l'acompte hors taxes, reçu en juillet" },
            { role: "la vente des enceintes", compte: "701", sens: "credit", montant: v.enceintes, indice: "les enceintes, hors taxes" },
            { role: "le port facturé", compte: "7085", acceptes: ["708"], sens: "credit", montant: v.port, indice: "le port hors taxes" },
            { role: "la consignation des palettes", compte: "4196", acceptes: ["419"], sens: "credit", montant: v.consignation, indice: "les palettes consignées, sans TVA" },
            { role: "la TVA collectée qui reste", compte: "44571", sens: "credit", montant: v.tvaRestante, indice: "la TVA de la facture, moins celle collectée sur l'acompte" },
          ],
        };
      },
      indices: () => [
        "Au crédit : la vente, le port facturé (un produit des activités annexes), la consignation (une dette envers le client, pas un produit), la TVA qui n'a pas déjà été collectée.",
        "Au débit : le client pour ce qui reste à payer, et l'acompte qui s'éteint pour son hors taxes.",
      ],
      explication: (c) => {
        const v = ventesEtAchatsDuChapitre(c).vente;
        return [
          `La vente porte ${eur(v.enceintes)}, tout le prix des enceintes : l'acompte n'en retire rien. La TVA de la facture, ${eur(v.tva)}, est collectée en deux fois : ${eur(v.acompte.tva)} en juillet, ${eur(v.tvaRestante)} maintenant.`,
          `Le 4196 garde ${eur(v.consignation)} : NOVA les doit à ${K.client} jusqu'au retour des palettes.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "predire-l-escompte-conditionnel",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur l'escompte après la facture",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const e = ventesEtAchatsDuChapitre(c).escompte;
        return `${K.client} paie d'ordinaire en retard, à ${qte(K.delaiHabituel)} jours. Pour une fois, NOVA lui propose ${pct(ESCOMPTE_APRES_FACTURE.taux)} d'escompte sur le solde hors taxes des enceintes, ${eur(e.base)}, s'il règle sous ${qte(ESCOMPTE_APRES_FACTURE.joursPourEnProfiter)} jours. La facture est déjà passée, TVA comprise. S'il prend l'escompte, que devient la TVA collectée ?`;
      },
      options: () => [
        { texte: "Elle baisse, par une facture d'avoir", juste: true, retour: "Bon pari : l'escompte réduit le prix payé, donc la base de la TVA. Comme il vient après la facture, c'est un avoir qui le constate, avec sa TVA." },
        { texte: "Rien ne change : la TVA de la facture du 20 août reste due en entier", juste: false, retour: "Non : la TVA porte sur ce que le client paie vraiment. Un escompte accordé après coup la réduit, par un avoir." },
        { texte: "Elle disparaît toute : la facture est annulée et refaite", juste: false, retour: "Non : on n'annule pas une facture émise. Un avoir en corrige une part, celle de l'escompte." },
      ],
    },
    {
      id: "l-escompte-au-journal",
      objectifs: [3],
      type: "ecriture",
      titre: "L'escompte accordé après la facture",
      notions: ["payment_terms", "vat_payable"],
      evenement: (c) => {
        const e = ventesEtAchatsDuChapitre(c).escompte;
        return `Le ${ESCOMPTE_APRES_FACTURE.reglement}, ${K.client} règle dans le délai et prend l'escompte. NOVA lui envoie un avoir de ${eur(e.ht)} hors taxes et ${eur(e.tva)} de TVA ; il vire ${eur(e.regle)}. Passez l'avoir.`;
      },
      ecriture: (c) => {
        const e = ventesEtAchatsDuChapitre(c).escompte;
        return {
          date: ESCOMPTE_APRES_FACTURE.reglement,
          libelle: `Avoir ${K.client}, escompte de règlement`,
          lignes: [
            { role: "l'escompte accordé", compte: "665", sens: "debit", montant: e.ht, indice: "l'escompte hors taxes" },
            { role: "la TVA collectée qui baisse", compte: "44571", sens: "debit", montant: e.tva, indice: "la TVA de l'escompte" },
            { role: "la créance sur le client qui baisse", compte: "411", sens: "credit", montant: e.ttc, indice: "l'avoir, toutes taxes comprises" },
          ],
        };
      },
      indices: () => [
        "L'escompte est une charge financière de NOVA, au débit, pour son hors taxes.",
        "La TVA collectée baisse : 44571 au débit. Le client doit d'autant moins : 411 au crédit, pour le montant toutes taxes comprises.",
      ],
      explication: (c) => {
        const e = ventesEtAchatsDuChapitre(c).escompte;
        return [
          `NOVA encaisse ${eur(e.regle)} le ${ESCOMPTE_APRES_FACTURE.reglement}, ${qte(e.jours)} jours plus tôt que d'habitude. L'escompte lui coûte ${eur(e.ht)} : la TVA de l'avoir, ${eur(e.tva)}, ne lui coûte rien, elle la reverse en moins à l'État.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "le-laboratoire-de-l-escompte",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de l'escompte après facture",
      notions: ["payment_terms", "net_treasury"],
      question: () =>
        `En été, NOVA a de l'argent à placer : l'argent reçu plus tôt rapporte le taux de son compte à terme, ${pct(TAUX_DU_PLACEMENT)} l'an. Faites varier le taux d'escompte et les jours dont le règlement est avancé. Le tableau suit l'avoir, ce que le client règle, les intérêts du placement que le règlement rapide rapporte et ce que l'escompte coûte vraiment ; le graphique, le coût de l'escompte et les intérêts selon le taux. Relevez le défi.`,
      leviers: () => [
        { code: "taux", libelle: "Taux d'escompte", unite: "%", ...TAUX_DU_LABORATOIRE, depart: ESCOMPTE_APRES_FACTURE.taux * 100 },
        { code: "jours", libelle: "Jours de règlement avancés", unite: "jours", ...JOURS_DU_LABORATOIRE, depart: JOURS_D_AVANCE },
      ],
      lecture: (_c, p) => {
        const q = position(p);
        const e = escompteApresLaFacture(q.taux / 100, q.jours);
        const d = escompteDuCas();
        return [
          { libelle: "Escompte, hors taxes", montant: e.ht, reference: d.ht },
          { libelle: "TVA de l'avoir", montant: e.tva, reference: d.tva },
          { libelle: "Réglé par le client", montant: e.regle, reference: d.regle },
          { libelle: "Intérêts du placement gagnés", montant: e.interets, reference: d.interets },
          { libelle: "Gain du règlement rapide, escompte déduit", montant: e.gain, reference: d.gain, effet: true, fort: true },
        ];
      },
      graphique: () => ({
        levier: "taux",
        courbes: [
          { libelle: "Coût de l'escompte, hors taxes", valeur: (p) => escompteApresLaFacture(position(p).taux / 100, position(p).jours).ht },
          { libelle: "Intérêts du placement gagnés", valeur: (p) => escompteApresLaFacture(position(p).taux / 100, position(p).jours).interets },
        ],
      }),
      defi: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return {
          consigne: `Pour un règlement avancé de ${qte(JOURS_D_AVANCE)} jours, trouvez le taux d'escompte le plus fort, au quart de point, qui ne coûte pas plus que les intérêts du placement.`,
          atteint: (p) => {
            const q = position(p);
            return q.jours === JOURS_D_AVANCE && q.taux === x.tauxMax;
          },
          indice: (p) => {
            const q = position(p);
            if (q.jours !== JOURS_D_AVANCE) return `Placez d'abord les jours sur ceux de ${K.client} : ${qte(JOURS_D_AVANCE)}.`;
            const e = escompteApresLaFacture(q.taux / 100, q.jours);
            return e.gain < 0
              ? `À ${points(q.taux)}, l'escompte coûte ${eur(e.ht)}, plus que les ${eur(e.interets)} du placement : baissez-le.`
              : `À ${points(q.taux)}, l'escompte coûte ${eur(e.ht)}, moins que les ${eur(e.interets)} du placement : vous pouvez encore le monter.`;
          },
          solution: { taux: x.tauxMax, jours: JOURS_D_AVANCE },
        };
      },
      explication: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        const m = escompteApresLaFacture(x.tauxMax / 100, JOURS_D_AVANCE);
        return [
          `À ${points(x.tauxMax)}, l'escompte coûte ${eur(m.ht)} et le placement rapporte ${eur(m.interets)} : c'est le plus fort qui se paie par la trésorerie seule. Les ${pct(ESCOMPTE_APRES_FACTURE.taux)} proposés coûtent ${eur(x.escompte.ht)} pour ${eur(x.escompte.interets)} d'intérêts : ${eur(-x.escompte.gain)} de perte.`,
          `Ce que l'escompte achète en plus, c'est la certitude d'être payé par un client qui paie en retard. Après ${SONORA.nom}, NOVA peut juger que cela vaut l'écart ; mais elle doit le savoir chiffré, pas le croire gratuit.`,
        ];
      },
    },
    {
      id: "net-de-taxe-ou-conditionnel",
      objectifs: [3],
      type: "choix",
      titre: "Escompte net de taxe ou conditionnel",
      notions: ["payment_terms", "vat_payable"],
      question: () =>
        `En septembre N, ${SONORA.nom} avait eu son escompte déduit sur la facture même : la TVA portait déjà sur le net financier (l'escompte net de taxe). Ici, la facture de ${K.client} porte le plein, et l'escompte vient après, par un avoir (l'escompte conditionnel). Qu'est-ce qui les distingue ?`,
      options: () => [
        {
          texte: "Le moment où la TVA baisse",
          juste: true,
          retour:
            "C'est cela. Si le client paie tôt, la TVA finale est la même : elle porte sur ce qu'il a payé. L'escompte net de taxe la réduit dès la facture, en pariant sur le paiement rapide ; l'escompte conditionnel attend le paiement, et seul un avoir la réduit, s'il a lieu.",
        },
        {
          texte: "Avec l'avoir, NOVA récupère auprès de l'État toute la TVA collectée sur la facture",
          juste: false,
          retour: "Non : l'avoir ne reprend que la TVA de l'escompte, pas celle de toute la facture.",
        },
        {
          texte: "L'escompte conditionnel ne réduit jamais la TVA : il reste hors du champ de la taxe",
          juste: false,
          retour: "Si, il la réduit : l'escompte baisse le prix payé, donc la base de la TVA. L'avoir porte cette TVA.",
        },
      ],
    },
    {
      id: "le-retour-des-palettes",
      objectifs: [1],
      type: "ecriture",
      titre: "Les palettes rendues, et celles qu'on garde",
      notions: ["vat_payable"],
      evenement: (c) => {
        const p = ventesEtAchatsDuChapitre(c).palettes;
        return `Le ${PALETTES.retour}, ${K.client} rend ${qte(PALETTES.rendues)} palettes et garde les ${qte(p.gardees)} autres. NOVA lui envoie un avoir de ${eur(p.rendu)} pour les palettes rendues ; les palettes gardées lui sont vendues au prix de la consignation, ${eur(p.garde)} toutes taxes comprises.`;
      },
      ecriture: (c) => {
        const p = ventesEtAchatsDuChapitre(c).palettes;
        return {
          date: PALETTES.retour,
          libelle: `Palettes de ${K.client}`,
          lignes: [
            { role: "la consignation qui s'éteint", compte: "4196", acceptes: ["419"], sens: "debit", montant: p.total, indice: "toutes les palettes consignées" },
            { role: "les palettes rendues, en moins de la créance", compte: "411", sens: "credit", montant: p.rendu, indice: "les palettes rendues, au prix de la consignation" },
            { role: "la vente des palettes gardées", compte: "7088", acceptes: ["708"], sens: "credit", montant: p.ht, indice: "le prix des palettes gardées, hors taxes" },
            { role: "la TVA sur les palettes gardées", compte: "44571", sens: "credit", montant: p.tva, indice: "la TVA contenue dans le prix des palettes gardées" },
          ],
        };
      },
      indices: () => [
        "Toute la consignation s'éteint : le 4196 se débite de son total.",
        "Les palettes rendues : le client doit d'autant moins (411 au crédit). Les palettes gardées deviennent une vente, toutes taxes comprises : un produit des activités annexes et sa TVA.",
      ],
      explication: (c) => {
        const p = ventesEtAchatsDuChapitre(c).palettes;
        return [
          `Les ${qte(PALETTES.rendues)} palettes rendues annulent ${eur(p.rendu)} de consignation, sans TVA : elles n'ont jamais été vendues. Les ${qte(p.gardees)} gardées sont vendues ${eur(p.garde)}, dont ${eur(p.tva)} de TVA : la consignation devient un prix.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "l-avoir-de-rabais",
      objectifs: [1],
      type: "ecriture",
      titre: "Le rabais, par une facture d'avoir",
      notions: ["vat_payable", "revenue"],
      evenement: (c) => {
        const r = ventesEtAchatsDuChapitre(c).rabais;
        return `Le ${RABAIS_POUR_DEFAUT.date}, ${K.client} signale ${qte(RABAIS_POUR_DEFAUT.enceintes)} enceintes à la grille rayée, qu'il garde. NOVA accorde ${pct(RABAIS_POUR_DEFAUT.taux)} de rabais sur elles : un avoir de ${eur(r.ht)} hors taxes, ${eur(r.tva)} de TVA.`;
      },
      ecriture: (c) => {
        const r = ventesEtAchatsDuChapitre(c).rabais;
        return {
          date: RABAIS_POUR_DEFAUT.date,
          libelle: `Avoir ${K.client}, rabais`,
          lignes: [
            { role: "le rabais accordé, en moins des ventes", compte: "709", sens: "debit", montant: r.ht, indice: "le rabais hors taxes" },
            { role: "la TVA collectée qui baisse", compte: "44571", sens: "debit", montant: r.tva, indice: "la TVA du rabais" },
            { role: "la créance sur le client qui baisse", compte: "411", sens: "credit", montant: r.ttc, indice: "l'avoir, toutes taxes comprises" },
          ],
        };
      },
      indices: () => [
        "Sur la facture, un rabais ne s'écrit pas : la vente se passe au net. Après la facture, il faut un avoir, et un compte qui vient en moins des ventes.",
        "Le 709 au débit, la TVA collectée qui baisse au débit, le client au crédit.",
      ],
      explication: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [
          `Le compte de ${K.client} est maintenant créditeur de ${eur(-x.solde)} : NOVA lui doit les palettes rendues et le rabais, qu'elle déduira de sa facture du mois. Un rabais, une remise ou une ristourne accordés après la facture vont au 709 ; un escompte, au 665.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "les-mentions",
      objectifs: [4],
      type: "tri",
      titre: "Les mentions de la facture",
      question: () =>
        "La facture du 20 août doit porter certaines mentions. Depuis le 1er septembre 2026, NOVA doit pouvoir recevoir des factures électroniques ; elle en émettra à partir du 1er septembre 2027, comme toutes les PME, avec des mentions nouvelles. Rangez chaque mention.",
      categories: [
        { code: "toujours", libelle: "Obligatoire sur toute facture" },
        { code: "nouvelle", libelle: "Nouvelle, avec la facture électronique" },
        { code: "non", libelle: "Pas une mention obligatoire" },
      ],
      // Les mentions nouvelles de la réforme de la facture électronique et son calendrier : À VÉRIFIER
      // à la date de l'écriture (loi de finances pour 2024 et textes d'application).
      elements: () => [
        { libelle: "Un numéro unique, dans une série continue", montant: 0, categorie: "toujours", pourquoi: "Il interdit la facture qui disparaît ou qu'on refait." },
        { libelle: "Le taux et le montant de la TVA", montant: 0, categorie: "toujours", pourquoi: "Le client ne déduit que la TVA que sa facture porte." },
        { libelle: "La date de paiement, les pénalités de retard et l'indemnité forfaitaire de 40 € pour frais de recouvrement", montant: 0, categorie: "toujours", pourquoi: "Le code de commerce les impose sur toute facture entre professionnels." },
        { libelle: "Les conditions d'escompte pour un paiement anticipé, ou l'absence d'escompte", montant: 0, categorie: "toujours", pourquoi: "Elles sont obligatoires, même pour dire qu'il n'y en a pas." },
        { libelle: "Le numéro SIREN du client", montant: 0, categorie: "nouvelle", pourquoi: "Il permet d'adresser la facture électronique au bon destinataire." },
        { libelle: "La nature de l'opération : livraison de biens, prestation de services, ou les deux", montant: 0, categorie: "nouvelle", pourquoi: "Elle dit quand la TVA est exigible." },
        { libelle: "L'adresse de livraison, quand elle diffère de celle du client", montant: 0, categorie: "nouvelle", pourquoi: "Ici, les 16 magasins de CampusTech : la mention devient obligatoire." },
        { libelle: "Le nom du commercial qui a pris la commande", montant: 0, categorie: "non", pourquoi: "Utile en interne, aucun texte ne l'impose." },
      ],
      relance: "Demandez-vous si la mention protège le client et l'État depuis toujours, si elle sert la transmission électronique, ou si elle n'est qu'une commodité.",
      explication: () => [
        "Une facture incomplète expose à une amende, et le client peut perdre son droit à déduire la TVA. La facture électronique ne change pas ce qu'est une facture : elle passe par une plateforme agréée, sous une forme que les logiciels lisent, et porte quelques mentions de plus. Le PGI de NOVA devra les gérer avant septembre 2027.",
      ],
    },
    {
      id: "la-reserve-de-propriete",
      objectifs: [4],
      type: "choix",
      titre: "La clause de réserve de propriété",
      notions: ["payment_terms"],
      question: () =>
        `Une chaîne cliente, livrée et pas encore payée, est mise en redressement judiciaire comme ${SONORA.nom}. Une partie des enceintes est encore dans ses réserves, intacte. Qu'est-ce qui permettrait à NOVA de les reprendre ?`,
      options: () => [
        {
          texte: "Une clause de réserve de propriété, écrite avant la livraison",
          juste: true,
          retour:
            "C'est cela. La clause, convenue par écrit au plus tard à la livraison (dans les conditions générales de vente acceptées, sur le bon de commande), retarde le transfert de propriété jusqu'au paiement complet. NOVA peut alors revendiquer les enceintes encore en nature, dans les 3 mois qui suivent le jugement d'ouverture. Sans elle, NOVA n'est qu'un créancier parmi d'autres.",
        },
        {
          texte: "L'escompte conditionnel prévu sur la facture, que le client n'a pas pris dans le délai",
          juste: false,
          retour: "Non : l'escompte ne touche qu'au prix. Il ne dit rien de la propriété des enceintes.",
        },
        {
          texte: "Rien : une fois livrées, les enceintes appartiennent au client, quelles que soient les conditions",
          juste: false,
          retour: "C'est la règle par défaut : la propriété passe à l'accord sur la chose et le prix. Mais une clause convenue avant la livraison peut la retarder jusqu'au paiement.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["payment_terms", "vat_payable"],
      texte: (c) => {
        const x = ventesEtAchatsDuChapitre(c);
        return [
          `Vous avez suivi une commande de bout en bout : l'acompte reçu et l'acompte versé, avec leur TVA, puis la facture d'achat contrôlée, son port et l'avoir de l'écart. Côté vente, la facture qui impute l'acompte, avec le port et les palettes, l'escompte accordé après coup, le retour des palettes, le rabais.`,
          `Sur cette commande, NOVA a collecté ${eur(x.tva)} de TVA d'un bout à l'autre, et le compte de ${K.client} finit créditeur de ${eur(-x.solde)}. Le curseur l'a montré : il aurait fallu ${qte(x.acompteQuiCouvre)} % d'acompte pour que le client finance les jeux ; le laboratoire : au-delà de ${points(x.tauxMax)}, l'escompte coûte plus que l'argent ne rapporte.`,
          "Au niveau de l'examen, vous savez passer un acompte et l'imputer, distinguer une consignation d'une vente, passer un avoir de rabais, de retour ou d'escompte, contrôler une facture d'achat sur ses trois documents, et vérifier les mentions d'une facture.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Acompte reçu : 4191 (hors taxes) et TVA collectée dès l'encaissement ; acompte versé : 4091. Port facturé : 7085 ; port payé : 6241. Consignation : 4196, sans TVA ; palette gardée : 7088 et sa TVA. Après la facture : rabais, remise, ristourne au 709 ; escompte au 665 ; chacun par un avoir, TVA comprise.",
    },
  ],
};
