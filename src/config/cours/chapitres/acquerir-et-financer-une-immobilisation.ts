import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../monde/amortissement";
import {
  CABINE,
  CHARIOT,
  DATES_DE_LA_SUBVENTION,
  GRANDE_REVISION,
  HEURES_DU_LABORATOIRE,
  MODES_DE_LA_CABINE,
  cabine,
  chariot,
  creditBailDuBanc,
  dotationDeLaCabine,
  provisionPourGrosEntretien,
  subvention,
} from "../monde/acquisition-et-financement";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : ACQUÉRIR ET FINANCER UNE IMMOBILISATION (comptabilité générale, palier 4 ; BTS CG P1
 * 1.5.2 et 1.5.6, P2 2.3.2).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA, en N + 1 (monde/acquisition-et-financement.ts) :
 * l'acompte versé sur la commande d'un chariot élévateur, et la facture de N + 2 qui l'impute ; la
 * cabine d'écoute que l'atelier construit lui-même (production immobilisée), amortie selon ses heures
 * d'essai, puis son plan modifié ; la subvention des équipements d'efficacité énergétique, de l'octroi
 * à la reprise ; la redevance du banc de mesure en crédit-bail et l'engagement hors bilan ; la
 * provision pour la grande révision de la première ligne.
 *
 * LES TEMPS DU CHAPITRE (l'esprit du cours : le cas simulé pas à pas, l'expérience avant la formule) :
 *   · guidé : intro, l-acompte, la-tva-de-l-acompte, la-facture-du-chariot, le-cout-de-production ;
 *   · l'expérience avant la formule : predire-la-production puis la-production-immobilisee (le
 *     résultat ne bouge pas) ; predire-les-unites puis le-laboratoire-de-la-cabine (un levier à choix,
 *     linéaire ou unités d'œuvre, les heures d'essai, et le graphique des deux dotations), avant
 *     le-plan-en-unites ;
 *   · autonome : l-octroi-de-la-subvention, le-versement-de-la-subvention, la-quote-part,
 *     la-reprise-au-journal, la-redevance ;
 *   · expert : le-plan-modifie, l-engagement-hors-bilan, la-provision-pour-gros-entretien ; puis la
 *     synthèse.
 *
 * MATIÈRE : le cours du propriétaire sur les immobilisations (coût d'acquisition, coût de production,
 * amortissement) et sur les modes de financement (subvention, crédit-bail), adapté à NOVA.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");

export const ACQUERIR_ET_FINANCER_UNE_IMMOBILISATION: Chapitre = {
  code: "acquerir-et-financer-une-immobilisation",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales", "BTS CG P2 · Contrôle et production de l'information financière"],
  titre: "Acquérir et financer une immobilisation",
  accroche:
    "Un acompte sur une commande, une cabine que l'atelier construit lui-même, une subvention, un banc en crédit-bail, une grande révision à venir : ce que chaque façon d'obtenir et de financer un équipement écrit dans les comptes.",
  objectifs: [
    "Enregistrer un acompte versé sur une immobilisation, puis la facture qui l'impute",
    "Calculer un coût de production et enregistrer une production immobilisée",
    "Amortir selon les unités d'œuvre, et modifier le plan quand la consommation prévue change",
    "Enregistrer une subvention d'investissement, de son octroi à sa reprise au résultat",
    "Enregistrer une redevance de crédit-bail, son engagement hors bilan, et une provision pour gros entretien",
  ],
  libre: false,
  prerequis: ["immobilisations"],
  ensuite: ["les-composants-et-l-amortissement-derogatoire", "emprunt-ou-credit-bail"],
  entreprises: {
    codes: ["nova"],
    pourquoi: "ce chapitre suit les équipements que NOVA commande, construit, finance et loue en N + 1, l'année de sa gamme.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Cinq façons d'obtenir un équipement",
      notions: ["depreciation"],
      tableau: () => {
        const s = subvention();
        const b = creditBailDuBanc();
        return {
          titre: "Les équipements de NOVA en N + 1",
          colonnes: ["Ce qui se passe", "Montant"],
          lignes: [
            { libelle: CHARIOT.designation, valeurs: [`commandé le ${CHARIOT.commande}, livré en N + 2`, eur(CHARIOT.ht)] },
            { libelle: CABINE.designation, valeurs: ["construite par l'atelier", eur(cabine().cout)] },
            { libelle: "Équipements d'efficacité énergétique", valeurs: [`subventionnés à ${pct(s.taux)}`, eur(s.equipements)] },
            { libelle: "Banc de mesure", valeurs: ["en crédit-bail, redevance annuelle", eur(b.redevance)] },
            { libelle: "Grande révision de la première ligne", valeurs: [`prévue en ${GRANDE_REVISION.date}`, eur(GRANDE_REVISION.devis)] },
          ],
        };
      },
      texte: (c) => [
        `En N + 1, ${c.entreprise} lance sa gamme. Elle ne se contente pas d'acheter et de payer. Elle commande un chariot élévateur et verse un acompte, construit elle-même une cabine d'écoute, reçoit une subvention pour ses équipements d'efficacité énergétique. Elle prend aussi son banc de mesure en crédit-bail, et prépare la grande révision de sa première ligne.`,
        "Chacune de ces opérations a son écriture et sa règle. Un acompte n'est pas encore un équipement ; un équipement fabriqué n'est pas une charge ; une subvention n'est pas un produit de l'année ; un bien loué n'est pas à l'actif ; une dépense future peut déjà peser sur le résultat.",
      ],
      repere: () =>
        "Le coût d'entrée d'une immobilisation : son coût d'acquisition (achetée) ou son coût de production (fabriquée). Le financement ne change pas ce coût : il s'écrit à part, au passif ou hors bilan.",
    },
    {
      id: "l-acompte",
      objectifs: [0],
      type: "ecriture",
      titre: "L'acompte sur la commande",
      notions: ["depreciation"],
      evenement: () => {
        const k = chariot();
        return `Le ${CHARIOT.commande}, NOVA commande un chariot élévateur électrique, ${eur(CHARIOT.ht)} hors taxes, livrable le ${CHARIOT.livraison}. Elle verse par virement un acompte de ${pct(CHARIOT.tauxDAcompte)} du prix hors taxes, ${eur(k.acompte)}, sans TVA.`;
      },
      ecriture: () => {
        const k = chariot();
        return {
          date: CHARIOT.commande,
          libelle: "Acompte sur la commande du chariot élévateur",
          lignes: [
            { role: "l'acompte versé sur une commande d'immobilisation", compte: "238", sens: "debit", montant: k.acompte, indice: "le montant versé à la commande" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: k.acompte, indice: "le montant versé à la commande" },
          ],
        };
      },
      indices: () => [
        "Le chariot n'est pas encore livré : il n'est pas à l'actif comme équipement. Ce qui est à l'actif, c'est l'avance faite au fournisseur.",
        "Un acompte sur une immobilisation se range avec les immobilisations, au compte 238, et non avec les avances aux fournisseurs d'exploitation (4091).",
      ],
      explication: () => [
        `Au 31 décembre N + 1, le bilan de NOVA porte ${eur(chariot().acompte)} d'avances et acomptes sur immobilisations : une créance sur le fournisseur, qui deviendra une part du chariot à la livraison.`,
      ],
      vue: "grand-livre",
    },
    {
      id: "la-tva-de-l-acompte",
      objectifs: [0],
      type: "choix",
      titre: "Pourquoi pas de TVA sur l'acompte ?",
      notions: ["vat_payable"],
      question: () => "L'acompte du chariot ne porte pas de TVA. Pourquoi ?",
      options: () => [
        {
          texte: "Pour un bien, la TVA est due à la livraison",
          juste: true,
          retour: "Oui : pour une livraison de biens, la TVA devient exigible à la livraison ; un acompte versé avant n'en porte pas. Pour une prestation de services, elle est exigible à l'encaissement : un acompte sur une prestation porte sa TVA.",
        },
        {
          texte: "Parce qu'un acompte sur une immobilisation est toujours exonéré de TVA, quelle qu'elle soit",
          juste: false,
          retour: "Non : ce n'est pas l'immobilisation qui décide, c'est la nature de l'opération. Un acompte sur une prestation de services, une installation par exemple, porterait sa TVA.",
        },
        {
          texte: "Parce que la TVA d'une immobilisation ne se déduit jamais l'année où l'on commande",
          juste: false,
          retour: "Non : la TVA d'une immobilisation se déduit comme une autre, quand elle est exigible. Ici, elle le sera à la livraison du chariot.",
        },
      ],
    },
    {
      id: "la-facture-du-chariot",
      objectifs: [0],
      type: "ecriture",
      titre: "La facture qui impute l'acompte",
      notions: ["depreciation", "vat_payable"],
      evenement: () => {
        const k = chariot();
        return `Le ${CHARIOT.livraison}, le chariot est livré et facturé : ${eur(CHARIOT.ht)} hors taxes, ${eur(k.tva)} de TVA, ${eur(k.ttc)} toutes taxes comprises ; la facture déduit l'acompte de ${eur(k.acompte)} et laisse ${eur(k.resteDu)} à payer à 30 jours.`;
      },
      ecriture: () => {
        const k = chariot();
        return {
          date: CHARIOT.livraison,
          libelle: "Facture du chariot élévateur, acompte imputé",
          lignes: [
            { role: "le chariot, au prix hors taxes", compte: "2154", acceptes: ["215"], sens: "debit", montant: CHARIOT.ht, indice: "le prix hors taxes de la facture" },
            { role: "la TVA déductible sur immobilisations", compte: "44562", sens: "debit", montant: k.tva, indice: "la TVA de toute la facture, exigible à la livraison" },
            { role: "l'acompte, qui s'impute", compte: "238", sens: "credit", montant: k.acompte, indice: "l'acompte versé en novembre" },
            { role: "la dette envers le fournisseur d'immobilisations", compte: "404", sens: "credit", montant: k.resteDu, indice: "le toutes taxes comprises, moins l'acompte" },
          ],
        };
      },
      indices: () => [
        "Le chariot entre à l'actif pour son prix entier hors taxes : l'acompte en fait partie.",
        "Le 238 se solde ; la dette envers un fournisseur d'immobilisations va au 404, pour ce qui reste à payer.",
      ],
      explication: () => {
        const k = chariot();
        return [
          `${eur(CHARIOT.ht)} + ${eur(k.tva)} = ${eur(k.acompte)} + ${eur(k.resteDu)} : l'écriture s'équilibre. Toute la TVA se déduit sur la déclaration de janvier N + 2, puisqu'elle n'est exigible qu'à la livraison.`,
        ];
      },
      vue: "grand-livre",
    },
    {
      id: "le-cout-de-production",
      objectifs: [1],
      type: "montants",
      titre: "Le coût de production de la cabine",
      notions: ["full_unit_cost"],
      tableau: () => ({
        titre: "Ce que la cabine a consommé, de juillet à septembre N + 1",
        colonnes: ["Donnée"],
        lignes: [
          { libelle: "Matières : panneaux, mousses, porte isolante", valeurs: [eur(CABINE.matieres)] },
          { libelle: "Heures d'opérateur", valeurs: [`${qte(CABINE.heures)} h`] },
          { libelle: "Coût de l'heure d'opérateur, charges comprises", valeurs: [eur(CABINE.coutHoraire)] },
          { libelle: "Charges indirectes de l'atelier", valeurs: [eur(CABINE.chargesIndirectes)] },
        ],
      }),
      question: () => "L'atelier de NOVA a construit lui-même une cabine d'écoute, pour le contrôle final des enceintes. Calculez la main-d'œuvre, puis son coût de production.",
      champs: () => {
        const k = cabine();
        return [
          { libelle: "Main-d'œuvre", attendu: k.mainDOeuvre, calcul: `${qte(CABINE.heures)} h × ${eur(CABINE.coutHoraire)} = ${eur(k.mainDOeuvre)}` },
          { libelle: "Coût de production", attendu: k.cout, calcul: `${eur(CABINE.matieres)} + ${eur(k.mainDOeuvre)} + ${eur(CABINE.chargesIndirectes)} = ${eur(k.cout)}` },
        ];
      },
      explication: () => [
        `Une immobilisation produite par l'entreprise entre à l'actif à son coût de production : les matières, la main-d'œuvre et les charges indirectes de sa fabrication, ${eur(cabine().cout)}. Ni marge, ni frais de vente : NOVA ne se vend rien à elle-même.`,
      ],
    },
    {
      id: "predire-la-production",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le résultat",
      notions: ["income_statement"],
      question: () =>
        "Avant d'écrire, pariez. Les matières, les heures et les charges de la cabine sont déjà passées en charges, par nature, au fil des mois. Le jour où la cabine entre à l'actif, le résultat de N + 1…",
      options: () => {
        const voir = "L'écriture de l'étape suivante le montre.";
        return [
          { texte: "Retrouve ce qu'il serait sans la cabine", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Baisse du coût de la cabine, puisque ses charges sont passées", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Monte d'une marge, comme si NOVA vendait la cabine", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-production-immobilisee",
      objectifs: [1],
      type: "ecriture",
      titre: "La production immobilisée",
      notions: ["depreciation"],
      evenement: () => `Le ${CABINE.miseEnService}, la cabine est achevée et mise en service. Faites-la entrer à l'actif, à son coût de production.`,
      ecriture: () => ({
        date: CABINE.miseEnService,
        libelle: `Production immobilisée : ${CABINE.designation.toLowerCase()}`,
        lignes: [
          { role: "la cabine, à l'actif", compte: "2181", acceptes: ["218"], sens: "debit", montant: cabine().cout, indice: "le coût de production" },
          { role: "la production immobilisée, en produit", compte: "722", acceptes: ["72"], sens: "credit", montant: cabine().cout, indice: "le coût de production" },
        ],
      }),
      indices: () => [
        "Une cabine qui servira plusieurs années : une immobilisation corporelle, une installation (2181).",
        "La contrepartie n'est ni la banque ni un fournisseur : c'est un produit, la production immobilisée (722), qui annule l'effet des charges déjà passées.",
      ],
      explication: () => {
        const k = cabine();
        return [
          `Les ${eur(k.cout)} de charges restent au compte de résultat, par nature ; les ${eur(k.cout)} de production immobilisée les compensent. Le résultat de N + 1 est celui qu'il aurait été sans la cabine : la dépense est devenue un actif, qui passera en charges par l'amortissement.`,
        ];
      },
      vue: "grand-livre",
    },
    {
      id: "predire-les-unites",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la dotation",
      notions: ["depreciation"],
      question: () =>
        `Pariez encore. La cabine est prévue pour ${qte(CABINE.heuresPrevues)} heures d'essai sur sa vie ; elle en fait ${qte(CABINE.heuresDeNPlus1)} d'octobre à décembre N + 1. Amortie selon ses heures plutôt qu'en linéaire sur ${CABINE.dureeLineaireAns} ans, sa dotation de N + 1 serait…`,
      options: () => {
        const voir = "Le laboratoire de l'étape suivante compare les deux plans, heure par heure.";
        return [
          { texte: "Plus forte, car elle a beaucoup servi", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Plus faible : 400 heures, c'est peu sur une vie", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "La même : le coût à amortir ne change pas", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-cabine",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de la cabine",
      notions: ["depreciation"],
      question: () =>
        "Choisissez le mode d'amortissement de la cabine et les heures d'essai de N + 1 : le tableau suit la dotation et la valeur nette au 31 décembre ; le graphique trace les deux dotations selon les heures.",
      leviers: () => [
        {
          code: "mode",
          libelle: "Le mode d'amortissement",
          unite: "",
          min: MODES_DE_LA_CABINE.lineaire,
          max: MODES_DE_LA_CABINE.unites,
          pas: 1,
          depart: MODES_DE_LA_CABINE.unites,
          choix: [
            { valeur: MODES_DE_LA_CABINE.lineaire, libelle: `Linéaire sur ${CABINE.dureeLineaireAns} ans` },
            { valeur: MODES_DE_LA_CABINE.unites, libelle: "Unités d'œuvre : les heures d'essai" },
          ],
        },
        { code: "heures", libelle: "Heures d'essai de N + 1", unite: "h", ...HEURES_DU_LABORATOIRE, depart: CABINE.heuresDeNPlus1 },
      ],
      lecture: (_c, p) => {
        const d = dotationDeLaCabine(p.mode!, p.heures!);
        const ref = cabine().dotationEnUnites;
        const cout = cabine().cout;
        return [
          { libelle: "Dotation de N + 1", montant: d, reference: ref, fort: true },
          { libelle: "Valeur nette au 31 décembre N + 1", montant: auCentime(cout - d), reference: auCentime(cout - ref) },
          { libelle: "Dotation en linéaire, quelles que soient les heures", montant: cabine().dotationLineaire },
        ];
      },
      graphique: () => ({
        levier: "heures",
        courbes: [
          { libelle: "Dotation en unités d'œuvre", valeur: (p) => dotationDeLaCabine(MODES_DE_LA_CABINE.unites, p.heures!) },
          { libelle: "Dotation en linéaire", valeur: (p) => dotationDeLaCabine(MODES_DE_LA_CABINE.lineaire, p.heures!) },
        ],
      }),
      defi: () => {
        const cible = cabine().dotationLineaire;
        const heures = Math.round((cible * CABINE.heuresPrevues) / cabine().cout);
        return {
          consigne: `En unités d'œuvre, trouvez les heures d'essai de N + 1 qui donnent la même dotation que le linéaire, ${eur(cible)}.`,
          atteint: (p) => p.mode === MODES_DE_LA_CABINE.unites && Math.abs(dotationDeLaCabine(p.mode, p.heures!) - cible) < 0.005,
          indice: (p) => {
            if (p.mode !== MODES_DE_LA_CABINE.unites) return "En linéaire, la dotation ne dépend pas des heures : passez en unités d'œuvre.";
            const d = dotationDeLaCabine(p.mode, p.heures!);
            return d > cible ? `À ${qte(p.heures!)} heures, la dotation vaut ${eur(d)} : plus que le linéaire.` : `À ${qte(p.heures!)} heures, la dotation ne vaut que ${eur(d)}.`;
          },
          solution: { mode: MODES_DE_LA_CABINE.unites, heures },
        };
      },
      explication: (_c, p) => [
        `Défi relevé : à ${qte(p.heures!)} heures, les unités d'œuvre font ${eur(cabine().dotationLineaire)}, comme le linéaire. Au-delà, la cabine s'use plus vite que le temps qui passe, et le linéaire sous-estime sa charge ; en deçà, il la surestime.`,
        "Le linéaire répartit le coût sur le temps ; les unités d'œuvre, sur l'usage. Pour un équipement dont l'usure suit l'activité, c'est l'usage qui dit sa consommation d'avantages économiques.",
      ],
    },
    {
      id: "le-plan-en-unites",
      objectifs: [2],
      type: "montants",
      titre: "La dotation de N + 1, en unités d'œuvre",
      notions: ["depreciation"],
      question: () =>
        `NOVA amortit la cabine selon ses heures d'essai : ${qte(CABINE.heuresPrevues)} heures prévues, ${qte(CABINE.heuresDeNPlus1)} en N + 1. Calculez la dotation de N + 1, la valeur nette au 31 décembre, et les heures qui restent prévues.`,
      champs: () => {
        const k = cabine();
        return [
          { libelle: "Dotation de N + 1", attendu: k.dotationEnUnites, calcul: `${eur(k.cout)} × ${qte(CABINE.heuresDeNPlus1)} ÷ ${qte(CABINE.heuresPrevues)} = ${eur(k.dotationEnUnites)}` },
          { libelle: "Valeur nette au 31 décembre N + 1", attendu: k.valeurNette, calcul: `${eur(k.cout)} − ${eur(k.dotationEnUnites)} = ${eur(k.valeurNette)}` },
          { libelle: "Heures restant prévues", attendu: k.heuresRestantesPrevues, calcul: `${qte(CABINE.heuresPrevues)} − ${qte(CABINE.heuresDeNPlus1)} = ${qte(k.heuresRestantesPrevues)} heures` },
        ];
      },
      explication: () => [
        `En unités d'œuvre, pas de prorata de temps : la cabine a servi ${qte(CABINE.heuresDeNPlus1)} heures, elle s'amortit de ${eur(cabine().dotationEnUnites)}, au débit du 6811 et au crédit du 28181.`,
      ],
    },
    {
      id: "le-plan-modifie",
      objectifs: [2],
      type: "montants",
      titre: "Le plan modifié",
      notions: ["depreciation"],
      question: () =>
        `À la clôture de N + 1, le lancement de Studio, dont les essais sont plus longs, change la consommation prévue : il reste ${qte(CABINE.heuresRestantesRevisees)} heures d'essai à faire, et non plus ${qte(cabine().heuresRestantesPrevues)}. ${qte(CABINE.heuresDeNPlus2)} heures sont prévues en N + 2. Calculez la dotation de N + 2 dans le plan modifié, puis celle qu'aurait donnée l'ancien plan.`,
      champs: () => {
        const k = cabine();
        return [
          { libelle: "Dotation de N + 2, plan modifié", attendu: k.dotationDeNPlus2, calcul: `${eur(k.valeurNette)} × ${qte(CABINE.heuresDeNPlus2)} ÷ ${qte(CABINE.heuresRestantesRevisees)} = ${eur(k.dotationDeNPlus2)}` },
          { libelle: "Dotation de N + 2, ancien plan", attendu: k.dotationDeNPlus2SansRevision, calcul: `${eur(k.valeurNette)} × ${qte(CABINE.heuresDeNPlus2)} ÷ ${qte(k.heuresRestantesPrevues)} = ${eur(k.dotationDeNPlus2SansRevision)}` },
          { libelle: "Écart sur N + 2", attendu: auCentime(k.dotationDeNPlus2SansRevision - k.dotationDeNPlus2), calcul: `${eur(k.dotationDeNPlus2SansRevision)} − ${eur(k.dotationDeNPlus2)} = ${eur(auCentime(k.dotationDeNPlus2SansRevision - k.dotationDeNPlus2))}` },
        ];
      },
      explication: () => [
        `La modification ne touche pas le passé : la dotation de N + 1 reste ${eur(cabine().dotationEnUnites)}. C'est la valeur nette, ${eur(cabine().valeurNette)}, qui se répartit sur les heures restantes nouvellement prévues. Plus d'heures à venir, une dotation plus faible chaque heure ; l'annexe le dit.`,
      ],
    },
    {
      id: "l-octroi-de-la-subvention",
      objectifs: [3],
      type: "ecriture",
      titre: "La subvention, accordée",
      notions: ["depreciation"],
      evenement: () => {
        const s = subvention();
        return `Le ${DATES_DE_LA_SUBVENTION.octroi}, l'aide publique à l'efficacité énergétique notifie à NOVA une subvention de ${pct(s.taux)} des équipements d'efficacité de la seconde ligne, ${eur(s.equipements)} : ${eur(s.montant)}, à verser en mars.`;
      },
      ecriture: () => {
        const s = subvention();
        return {
          date: DATES_DE_LA_SUBVENTION.octroi,
          libelle: "Subvention d'équipement accordée",
          lignes: [
            { role: "la créance sur l'organisme qui subventionne", compte: "441", sens: "debit", montant: s.montant, indice: "le montant notifié" },
            { role: "la subvention d'équipement, au passif", compte: "131", sens: "credit", montant: s.montant, indice: "le montant notifié" },
          ],
        };
      },
      indices: () => [
        "Une subvention accordée mais pas encore versée : une créance sur l'État ou la collectivité, au 441.",
        "Elle finance un équipement qui durera : elle ne va pas au résultat de l'année, mais au passif, avec les capitaux propres (131).",
      ],
      explication: () => [
        "La subvention d'investissement est une ressource durable : au bilan, elle se range avec les capitaux propres. Elle passera au résultat peu à peu, au rythme où les équipements qu'elle finance passent en charges.",
      ],
      vue: "grand-livre",
    },
    {
      id: "le-versement-de-la-subvention",
      objectifs: [3],
      type: "ecriture",
      titre: "La subvention, versée",
      notions: ["depreciation"],
      evenement: () => `Le ${DATES_DE_LA_SUBVENTION.versement}, la subvention de ${eur(subvention().montant)} arrive sur le compte bancaire de NOVA.`,
      ecriture: () => ({
        date: DATES_DE_LA_SUBVENTION.versement,
        libelle: "Versement de la subvention d'équipement",
        lignes: [
          { role: "l'encaissement", compte: "512", sens: "debit", montant: subvention().montant, indice: "le montant versé" },
          { role: "la créance sur l'organisme, soldée", compte: "441", sens: "credit", montant: subvention().montant, indice: "le montant versé" },
        ],
      }),
      indices: () => ["La banque reçoit ; la créance du 2 janvier se solde."],
      explication: () => ["Le versement ne touche ni le résultat ni le compte 131 : il transforme une créance en trésorerie."],
      vue: "grand-livre",
    },
    {
      id: "la-quote-part",
      objectifs: [3],
      type: "montants",
      titre: "La quote-part de N + 1",
      notions: ["depreciation"],
      question: () => {
        const s = subvention();
        return `Les équipements d'efficacité, ${eur(s.equipements)}, s'amortissent en linéaire sur ${s.duree} ans depuis le 2 janvier N + 1 : ${s.jours} jours en N + 1, sur 360. La subvention se reprend au même rythme. Calculez la quote-part annuelle, la quote-part de N + 1, ce qui reste de la subvention au bilan au 31 décembre, et la charge nette des équipements en N + 1.`;
      },
      champs: () => {
        const s = subvention();
        return [
          { libelle: "Quote-part annuelle", attendu: s.quotePartAnnuelle, calcul: `${eur(s.montant)} ÷ ${s.duree} = ${eur(s.quotePartAnnuelle)}` },
          { libelle: "Quote-part de N + 1", attendu: s.quotePart, calcul: `${eur(s.quotePartAnnuelle)} × ${s.jours} ÷ 360 = ${eur(s.quotePart)}` },
          { libelle: "Subvention restant au bilan", attendu: s.resteAuBilan, calcul: `${eur(s.montant)} − ${eur(s.quotePart)} = ${eur(s.resteAuBilan)}` },
          { libelle: "Charge nette des équipements en N + 1", attendu: s.chargeNette, calcul: `dotation ${eur(s.dotation)} − quote-part ${eur(s.quotePart)} = ${eur(s.chargeNette)}` },
        ];
      },
      explication: () => {
        const s = subvention();
        return [
          `La subvention ne finance pas l'année d'achat, mais toute la vie des équipements : chaque année, la part de subvention virée au résultat compense une part de la dotation. En N + 1, les équipements ne coûtent à NOVA que ${eur(s.chargeNette)}, et non ${eur(s.dotation)}.`,
        ];
      },
    },
    {
      id: "la-reprise-au-journal",
      objectifs: [3],
      type: "ecriture",
      titre: "La quote-part, au journal",
      notions: ["depreciation"],
      evenement: () => "Au 31 décembre N + 1, virez au résultat la quote-part de la subvention de l'exercice.",
      ecriture: () => ({
        date: "31 décembre N + 1",
        // À VÉRIFIER : la place du compte 777 après le règlement ANC 2022-06 (exercices ouverts depuis le 1er janvier 2025).
        libelle: "Quote-part de la subvention d'équipement virée au résultat",
        lignes: [
          { role: "la subvention inscrite au compte de résultat", compte: "139", sens: "debit", montant: subvention().quotePart, indice: "la quote-part de N + 1" },
          { role: "le produit de l'exercice", compte: "777", sens: "credit", montant: subvention().quotePart, indice: "la quote-part de N + 1" },
        ],
      }),
      indices: () => [
        "Le compte 131 garde la subvention reçue ; ce qui en passe au résultat se cumule à part, au débit du 139, comme un amortissement de la subvention.",
        "Le produit : la quote-part des subventions d'investissement virée au résultat (777).",
      ],
      explication: () => {
        const s = subvention();
        return [
          `Au bilan, la subvention vaut désormais ${eur(s.montant)} − ${eur(s.quotePart)} = ${eur(s.resteAuBilan)} (131 moins 139). Au compte de résultat, ${eur(s.quotePart)} de produit, que l'impôt taxe comme le reste du bénéfice.`,
        ];
      },
      vue: "grand-livre",
    },
    {
      id: "la-redevance",
      objectifs: [4],
      type: "ecriture",
      titre: "La redevance du crédit-bail",
      notions: ["depreciation"],
      evenement: () => {
        const b = creditBailDuBanc();
        return `NOVA a pris son banc de mesure en crédit-bail, aux conditions du fabricant : ${b.dureeAns} redevances annuelles de ${eur(b.redevance)} hors taxes, payées à terme échu, et une option d'achat de ${eur(b.option)}. Le 31 décembre N + 1, elle paie la première par prélèvement : ${eur(b.redevance)} et ${eur(b.tva)} de TVA.`;
      },
      ecriture: () => {
        const b = creditBailDuBanc();
        return {
          date: "31 décembre N + 1",
          libelle: "Redevance de crédit-bail du banc de mesure",
          lignes: [
            { role: "la redevance, en charge", compte: "6122", acceptes: ["612"], sens: "debit", montant: b.redevance, indice: "la redevance hors taxes" },
            { role: "la TVA déductible sur services", compte: "44566", sens: "debit", montant: b.tva, indice: "la TVA de la redevance" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: b.ttc, indice: "la redevance, taxes comprises" },
          ],
        };
      },
      indices: () => [
        "NOVA n'est pas propriétaire du banc tant qu'elle n'a pas levé l'option : rien à l'actif, rien à amortir.",
        "La redevance est une charge de l'année : crédit-bail mobilier (6122). Sa TVA, celle d'un service, se déduit au 44566.",
      ],
      explication: () => {
        const b = creditBailDuBanc();
        return [
          `Le banc de ${eur(b.valeur)} sert à NOVA sans figurer à son actif ni à son passif : seule la redevance de ${eur(b.redevance)} paraît, en charge. C'est ce qui distingue, dans les comptes individuels, le crédit-bail d'un achat financé par emprunt.`,
        ];
      },
      vue: "grand-livre",
    },
    {
      id: "l-engagement-hors-bilan",
      objectifs: [4],
      type: "montants",
      titre: "L'engagement hors bilan",
      notions: ["depreciation"],
      question: () => {
        const b = creditBailDuBanc();
        return `Au 31 décembre N + 1, ${b.redevancesRestantes} redevances de ${eur(b.redevance)} restent à payer, et l'option de ${eur(b.option)} à lever à la fin du contrat. Le banc n'est pas au bilan : l'annexe doit dire ce que NOVA s'est engagée à payer. Calculez les redevances restant à payer, puis l'engagement, option comprise.`;
      },
      champs: () => {
        const b = creditBailDuBanc();
        return [
          { libelle: "Redevances restant à payer", attendu: b.restantDu, calcul: `${b.redevancesRestantes} × ${eur(b.redevance)} = ${eur(b.restantDu)}` },
          { libelle: "Engagement de crédit-bail, option comprise", attendu: b.engagement, calcul: `${eur(b.restantDu)} + ${eur(b.option)} = ${eur(b.engagement)}` },
        ];
      },
      explication: () => [
        `Un lecteur du bilan ne voit ni le banc ni ce qu'il reste à payer : l'annexe des comptes annuels lui donne les ${eur(creditBailDuBanc().engagement)} d'engagement. Le chapitre « Emprunt ou crédit-bail » compare ce que coûte chaque financement après impôt.`,
      ],
    },
    {
      id: "la-provision-pour-gros-entretien",
      objectifs: [4],
      type: "ecriture",
      titre: "La provision pour gros entretien",
      notions: ["depreciation"],
      evenement: () =>
        `La première ligne doit subir une grande révision en ${GRANDE_REVISION.date}, imposée par son fabricant : devis de ${eur(GRANDE_REVISION.devis)} hors taxes. NOVA arrête son programme de gros entretien en N + 1 et répartit la dépense sur les ${GRANDE_REVISION.exercices} exercices qui la précèdent. Passez la provision du 31 décembre N + 1.`,
      ecriture: () => ({
        date: "31 décembre N + 1",
        libelle: "Provision pour la grande révision de la première ligne",
        lignes: [
          { role: "la dotation aux provisions d'exploitation", compte: "6815", acceptes: ["681"], sens: "debit", montant: provisionPourGrosEntretien(), indice: "le devis, réparti sur les exercices qui précèdent la révision" },
          { role: "la provision pour gros entretien", compte: "1572", sens: "credit", montant: provisionPourGrosEntretien(), indice: "le devis, réparti sur les exercices qui précèdent la révision" },
        ],
      }),
      indices: () => [
        `${eur(GRANDE_REVISION.devis)} sur ${GRANDE_REVISION.exercices} exercices : la part de N + 1.`,
        "Au passif, une provision pour charges : pour gros entretien ou grandes révisions (1572).",
      ],
      explication: () => [
        `La révision se paiera en N + 3, mais l'usure qu'elle répare se fait dès maintenant : chaque exercice porte sa part, ${eur(provisionPourGrosEntretien())}. En N + 3, la facture passera en charge et la provision se reprendra (7815) : le résultat de N + 3 ne portera pas seul la dépense. L'autre voie que le plan comptable admet est d'amortir la révision comme un composant de la ligne.`,
      ],
      vue: "grand-livre",
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["depreciation"],
      texte: () => {
        const s = subvention();
        const b = creditBailDuBanc();
        return [
          `En N + 1, NOVA a versé ${eur(chariot().acompte)} d'acompte sur un chariot (238), et construit une cabine de ${eur(cabine().cout)} (2181 et 722), amortie de ${eur(cabine().dotationEnUnites)} selon ses heures. Elle a reçu ${eur(s.montant)} de subvention dont ${eur(s.quotePart)} reviennent au résultat de l'année (131, 139, 777). Elle a payé ${eur(b.redevance)} de redevance avec ${eur(b.engagement)} d'engagement hors bilan, et provisionné ${eur(provisionPourGrosEntretien())} pour la grande révision (1572).`,
          "Dans l'arène, un investissement se paie le jour où vous le décidez : demandez-vous comment vous l'auriez financé, et ce qu'en auraient dit vos comptes.",
        ];
      },
      repere: () =>
        "Acompte sur immobilisation : 238. Production immobilisée : actif contre 72, au coût de production. Unités d'œuvre : coût × unités de l'année ÷ unités prévues ; un plan modifié répartit la valeur nette sur les unités restantes. Subvention : 131, reprise au 139 et au 777 au rythme de l'amortissement. Crédit-bail : redevance en 612, engagement en annexe. Gros entretien : 6815 et 1572.",
    },
  ],
};
