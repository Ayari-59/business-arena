import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_BUDGET, budgetAuDecalage, delaiLePlusLong, ficheDe } from "../../chapitres/budget-de-tresorerie";
import { budgetDeTresorerie, investissementDeLaFiche, moisDeDecalage, tableauDeBord } from "../../monde/couts-et-budgets";
import type { FicheDeGestion } from "../../monde/nova-gestion";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE BUDGET DE TRÉSORERIE » : UN TRIMESTRE DE CROISSANCE
 * (contrôle de gestion, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le semestre de NOVA (monde/nova-gestion.ts)
 * et le budget du modèle du cours (monde/couts-et-budgets.ts).
 *
 * CampusTech veut commander plus d'enceintes au premier trimestre, aux mêmes conditions : facturées
 * le 20, payées à 60 jours. Le dirigeant demande si plus de ventes, c'est plus d'argent en banque à la
 * fin du trimestre, et s'il pourra toujours acheter le banc de mesure en février. L'élève refait seul
 * le chemin du chapitre avec la commande : ce que coûte un mois de commande, la trésorerie de chaque
 * mois, puis le croisement du résultat et de la trésorerie (le résultat monte, la trésorerie baisse :
 * le besoin en fonds de roulement de la croissance), et à rebours le délai que CampusTech devrait
 * accepter pour que le banc passe sans découvert. La réponse demande un jugement : accepter la
 * commande, mais financer le banc.
 *
 * RECALIBRÉ (CampusTech à 60 jours, octobre 2026) : la commande passait d'avril à juin, avec le banc
 * d'avril. Le banc est désormais en février (nova-gestion.ts) ; une commande du deuxième trimestre ne
 * le touchait plus, et à 60 jours le banc d'avril passait même avec elle. La commande passe donc au
 * premier trimestre, de janvier à mars, et le croisement se lit à la fin du trimestre, le 31 mars :
 * deux factures de la commande y attendent encore. Le 30 juin, toutes sont payées.
 */

/** La commande en plus de CampusTech, hypothèse du cours : 300 enceintes par mois, de janvier à mars. */
export const COMMANDE_EN_PLUS = 300;

/** Le premier mois de la commande : janvier (0 pour janvier), le début du premier trimestre. */
export const MOIS_DE_LA_COMMANDE = 0;

/** La commande dure un trimestre : trois mois, de janvier à mars. */
export const MOIS_DE_COMMANDE = 3;

/** Le dernier mois du trimestre de la commande (mars), où se lit le croisement. */
const FIN_DU_TRIMESTRE = MOIS_DE_LA_COMMANDE + MOIS_DE_COMMANDE - 1;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const enBanque = (t: number) => (t >= 0 ? `${eur(t)} en banque` : `un découvert de ${eur(-t)}`);

/** La fiche où CampusTech commande `enPlus` enceintes de plus chaque mois du trimestre de la commande. */
export function ficheAvecLaCommande(f: FicheDeGestion, enPlus = COMMANDE_EN_PLUS): FicheDeGestion {
  return {
    ...f,
    semestre: {
      ...f.semestre,
      clienteles: f.semestre.clienteles.map((c) => (c.code === "campustech" ? { ...c, quantites: c.quantites.map((q, k) => (k >= MOIS_DE_LA_COMMANDE && k <= FIN_DU_TRIMESTRE ? q + enPlus : q)) } : c)),
    },
  };
}

/**
 * Ce que CampusTech doit encore à la fin du mois `i` : ses factures TTC des mois déjà facturés dont
 * l'échéance tombe après ce mois (le modèle ne donne les créances qu'au 30 juin).
 */
export function creancesSurCampusTech(f: FicheDeGestion, i: number) {
  const s = f.semestre;
  const ct = s.clienteles.find((x) => x.code === "campustech")!;
  const d = moisDeDecalage(ct.jourDeFacturation, ct.delai, s.joursDuMoisCommercial);
  const ttc = f.moisDeReference.prix * (1 + s.tauxDeTva);
  return auCentime(ct.quantites.reduce((t, q, j) => (j <= i && j + d > i ? t + q * ttc : t), 0));
}

/** Les chiffres de la réponse, calculés une fois du cas. */
export function trimestreDeCroissance(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = f.semestre;
  const m = f.moisDeReference;
  const tva = s.tauxDeTva;
  const k = MOIS_DE_LA_COMMANDE;
  const z = FIN_DU_TRIMESTRE;
  const g = ficheAvecLaCommande(f);
  const base = budgetDeTresorerie(f);
  const avec = budgetDeTresorerie(g);
  const ct = s.clienteles.find((x) => x.code === "campustech")!;
  const n = COMMANDE_EN_PLUS;
  const facture = auCentime(n * m.prix * (1 + tva));
  const autres = auCentime(n * m.coutVariable.autres * (1 + tva));
  const composants = auCentime(n * m.coutVariable.composants * (1 + tva));
  const tvaDuMois = auCentime(n * (m.prix - m.coutVariable.composants - m.coutVariable.autres) * tva);
  const trimestre = Array.from({ length: MOIS_DE_COMMANDE }, (_, j) => k + j);
  const mois = trimestre.map((i) => ({ i, nom: s.mois[i]!.nom, budget: base.mois[i]!.tresorerieFin, avec: avec.mois[i]!.tresorerieFin }));
  const decalage = moisDeDecalage(ct.jourDeFacturation, ct.delai, s.joursDuMoisCommercial);
  // Le croisement, à la fin du trimestre : le résultat en plus, les créances et les dettes en plus.
  const resultatDuTrimestre = (x: FicheDeGestion) => tableauDeBord(x).mois.slice(k, z + 1).reduce((t, y) => t + y.resultat, 0);
  const resultatEnPlus = auCentime(resultatDuTrimestre(g) - resultatDuTrimestre(f));
  const creancesALaFin = creancesSurCampusTech(g, z);
  const creancesEnPlus = auCentime(creancesALaFin - creancesSurCampusTech(f, z));
  // Les dettes de la fin du trimestre : ce qui se paie le mois suivant, les composants et la TVA du dernier mois.
  const apres = (b: typeof base) => b.mois[z + 1]!.decaissements;
  const dettesEnPlus = auCentime(apres(avec).fournisseur - apres(base).fournisseur + apres(avec).tva - apres(base).tva);
  const variation = auCentime(avec.mois[z]!.tresorerieFin - base.mois[z]!.tresorerieFin);
  // Le banc de la fiche (février), avec la commande ; puis le plus long décalage de CampusTech qui le laisse passer.
  const inv = investissementDeLaFiche(f);
  const avecLeBanc = budgetDeTresorerie(g, { investissement: inv });
  const decalages = Array.from({ length: decalage + 1 }, (_, i) => i).filter((d) => budgetAuDecalage(g, d, { investissement: inv }).plusBas.tresorerie >= 0);
  const decalageMax = decalages.length ? Math.max(...decalages) : 0;
  const delaiMax = delaiLePlusLong(ct.jourDeFacturation, decalageMax, s.joursDuMoisCommercial);
  const auDelai = budgetAuDecalage(g, decalageMax, { investissement: inv });
  const quantiteDuTrimestre = trimestre.reduce((t, i) => t + avec.mois[i]!.quantite, 0);
  return {
    f,
    s,
    m,
    tva,
    ct,
    base,
    avec,
    facture,
    autres,
    composants,
    tvaDuMois,
    mois,
    fin: mois.at(-1)!,
    creancesALaFin,
    resultatEnPlus,
    creancesEnPlus,
    dettesEnPlus,
    variation,
    inv,
    invTtc: auCentime(inv.montantHt * (1 + tva)),
    avecLeBanc,
    decalage,
    decalageMax,
    delaiMax,
    auDelai,
    quantiteDuTrimestre,
    /** Ce que CampusTech paie en plus le mois du banc quand elle paie un mois plus tôt : la facture d'un mois de plus. */
    factureAvancee: auCentime(g.semestre.clienteles.find((x) => x.code === "campustech")!.quantites[inv.mois - decalageMax]! * m.prix * (1 + tva)),
    /** Le banc sans la commande : le découvert du chapitre. */
    sansLaCommande: budgetDeTresorerie(f, { investissement: inv }).mois[inv.mois]!.tresorerieFin,
    juin: { base: base.tresorerieFin, avec: avec.tresorerieFin },
    nomDuMois: (i: number) => s.mois[i]!.nom,
  };
}

export const UN_TRIMESTRE_DE_CROISSANCE: Situation = {
  code: "un-trimestre-de-croissance",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["budget-de-tresorerie"],
  commanditaire: "Le dirigeant",
  titre: "Un trimestre de croissance",
  accroche:
    "CampusTech veut commander plus d'enceintes au premier trimestre, payées à 60 jours. Le dirigeant veut savoir ce qu'il aura en banque, et s'il pourra toujours acheter son banc de mesure : plus de ventes, est-ce autant d'argent en plus ?",
  objectifs: [
    "Chiffrer ce qu'une commande payée à 60 jours fait entrer et sortir, mois par mois",
    "Calculer la trésorerie de fin de mois du trimestre avec la commande",
    "Expliquer pourquoi le résultat monte quand la trésorerie baisse, par les créances et les dettes",
    "Retrouver à rebours le délai de paiement qui laisse passer un investissement, et rendre un avis",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_BUDGET,
    pourquoi: "ce cas reprend le chapitre « Le budget de trésorerie », qui se bâtit sur le semestre de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      texte: (c) => {
        const x = trimestreDeCroissance(c);
        const n0 = x.nomDuMois(MOIS_DE_LA_COMMANDE);
        const nb = x.nomDuMois(x.inv.mois);
        return [
          `« CampusTech veut nous commander ${qte(COMMANDE_EN_PLUS)} enceintes de plus chaque mois, ${dE(n0)} à ${x.fin.nom}, aux mêmes conditions : facturées le ${x.ct.jourDeFacturation}, payées à ${x.ct.delai} jours. La ligne peut les fabriquer : ${qte(x.quantiteDuTrimestre)} enceintes au trimestre, pour ${qte(x.f.decision.capacite)} de capacité. Plus de ventes, c'est plus d'argent en banque à la fin ${dE(x.fin.nom)} ? Et pourrai-je toujours acheter le banc de mesure en ${nb} ? »`,
          `Les conditions sont celles du budget : une enceinte se vend ${eur(x.m.prix)} HT et demande ${eur(x.m.coutVariable.composants)} HT de composants, payés le mois suivant, et ${eur(x.m.coutVariable.autres)} HT d'autres coûts variables, payés dans le mois. La TVA est de ${(x.tva * 100).toLocaleString("fr-FR")} %, et la TVA du mois se paie le mois suivant. Le banc coûte ${eur(x.inv.montantHt)} HT, payé en ${nb} ; sa TVA se récupère sur la déclaration ${dE(nb)}, payée en ${x.nomDuMois(x.inv.mois + 1)}.`,
          "Pas de cours cette fois : vous avez le budget du premier trimestre, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const x = trimestreDeCroissance(c);
        const part = x.s.clienteles.find((y) => y.code === "particuliers")!;
        return {
          titre: `Le premier trimestre au budget · ${x.f.entreprise}`,
          colonnes: x.mois.map((y) => majuscule(y.nom)),
          lignes: [
            { libelle: "Enceintes vendues aux particuliers", valeurs: x.mois.map((y) => qte(part.quantites[y.i]!)) },
            { libelle: "Enceintes vendues à CampusTech, au budget", valeurs: x.mois.map((y) => qte(x.ct.quantites[y.i]!)) },
            { libelle: "Commande en plus de CampusTech", valeurs: x.mois.map(() => qte(COMMANDE_EN_PLUS)) },
            { libelle: "Trésorerie de fin de mois, au budget", valeurs: x.mois.map((y) => eur(y.budget)) },
          ],
        };
      },
      repere: () =>
        "À rendre : ce que coûte un mois de commande, la trésorerie de chaque mois, le passage du résultat à la trésorerie, le délai qui laisserait passer le banc, et votre réponse.",
    },
    {
      id: "un-mois-de-commande",
      type: "montants",
      titre: "Un mois de commande",
      notions: ["cash_budget", "payment_terms", "vat_payable"],
      question: () =>
        `Pour un mois de commande en plus (${qte(COMMANDE_EN_PLUS)} enceintes), calculez la facture TTC envoyée à CampusTech, les autres coûts variables TTC payés dans le mois, les composants TTC payés le mois suivant, et la TVA à décaisser le mois suivant.`,
      champs: (c) => {
        const x = trimestreDeCroissance(c);
        const n = qte(COMMANDE_EN_PLUS);
        const k = qte(1 + x.tva);
        return [
          { libelle: "Facture TTC du mois à CampusTech", attendu: x.facture, calcul: `${n} × ${eur(x.m.prix)} × ${k} = ${eur(x.facture)}` },
          { libelle: "Autres coûts variables TTC, payés dans le mois", attendu: x.autres, calcul: `${n} × ${eur(x.m.coutVariable.autres)} × ${k} = ${eur(x.autres)}` },
          { libelle: "Composants TTC, payés le mois suivant", attendu: x.composants, calcul: `${n} × ${eur(x.m.coutVariable.composants)} × ${k} = ${eur(x.composants)}` },
          {
            libelle: "TVA à décaisser le mois suivant",
            attendu: x.tvaDuMois,
            calcul: `${n} × (${eur(x.m.prix)} − ${eur(x.m.coutVariable.composants)} − ${eur(x.m.coutVariable.autres)}) × ${(x.tva * 100).toLocaleString("fr-FR")} % = ${eur(x.tvaDuMois)}`,
          },
        ];
      },
      explication: (c) => {
        const x = trimestreDeCroissance(c);
        const n0 = x.nomDuMois(MOIS_DE_LA_COMMANDE);
        const rentrees = x.mois.filter((y) => y.i + x.decalage <= x.fin.i).length;
        return [
          `À ${x.ct.delai} jours, la facture ${dE(n0)} ne rentre que ${x.decalage} mois plus tard, en ${x.nomDuMois(MOIS_DE_LA_COMMANDE + x.decalage)} : dans le trimestre, ${rentrees} facture${rentrees > 1 ? "s" : ""} de la commande sur ${x.mois.length} rentre${rentrees > 1 ? "nt" : ""}, alors que ses coûts se paient chaque mois, et sa TVA aussi.`,
        ];
      },
    },
    {
      id: "la-tresorerie-du-trimestre",
      type: "montants",
      titre: "La trésorerie du trimestre",
      notions: ["cash_budget", "receivables_financing"],
      question: (c) => {
        const x = trimestreDeCroissance(c);
        return `Avec la commande, et sans le banc, calculez la trésorerie de fin ${dE(x.mois[0]!.nom)}, de fin ${dE(x.mois[1]!.nom)} et de fin ${dE(x.mois[2]!.nom)} (négative pour un découvert), puis ce que CampusTech devra à la fin ${dE(x.fin.nom)}.`;
      },
      champs: (c) => {
        const x = trimestreDeCroissance(c);
        // Au mois j du trimestre : j + 1 mois d'autres coûts, j mois de composants et de TVA, et les factures de la commande déjà rentrées.
        const mouvements = (j: number) => {
          const rentrees = x.mois.filter((y) => y.i + x.decalage <= x.mois[j]!.i).length;
          return [`− ${j + 1} × ${eur(x.autres)}`, ...(j > 0 ? [`− ${j} × (${eur(x.composants)} + ${eur(x.tvaDuMois)})`] : []), ...(rentrees > 0 ? [`+ ${rentrees} × ${eur(x.facture)}`] : [])].join(" ");
        };
        const dues = x.mois.filter((y) => y.i + x.decalage > x.fin.i);
        return [
          ...x.mois.map((y, j) => ({
            libelle: `Trésorerie de fin ${dE(y.nom)}`,
            attendu: y.avec,
            calcul: `${eur(y.budget)} ${mouvements(j)} = ${eur(y.avec)}`,
          })),
          {
            libelle: `Créances sur CampusTech à la fin ${dE(x.fin.nom)}`,
            attendu: x.creancesALaFin,
            calcul: `les ${dues.length} dernières factures, ${dE(dues[0]!.nom)} à ${x.fin.nom} : ${dues.length} × (${qte(x.ct.quantites[dues[0]!.i]!)} + ${qte(COMMANDE_EN_PLUS)}) × ${eur(auCentime(x.m.prix * (1 + x.tva)))} = ${eur(x.creancesALaFin)}`,
          },
        ];
      },
      explication: (c) => {
        const x = trimestreDeCroissance(c);
        return [
          `Le trimestre vend ${qte(3 * COMMANDE_EN_PLUS)} enceintes de plus, et ${x.fin.nom} finit avec ${eur(-x.variation)} de moins qu'au budget : ${eur(x.fin.avec)} au lieu de ${eur(x.fin.budget)}. Plus de ventes, ici, c'est moins d'argent en banque.`,
        ];
      },
    },
    {
      id: "le-croisement",
      type: "montants",
      titre: "Le résultat monte, la trésorerie baisse",
      notions: ["bfr", "net_treasury", "contribution_margin"],
      question: (c) => {
        const x = trimestreDeCroissance(c);
        const n = x.fin.nom;
        return `Le résultat du trimestre monte avec la commande, la trésorerie baisse. Retrouvez le passage de l'un à l'autre, à la fin ${dE(n)} : le résultat en plus (la marge sur coût variable des enceintes en plus ; les charges fixes ne bougent pas), les créances en plus, les dettes en plus (les composants et la TVA ${dE(n)}), puis la variation de la trésorerie de fin ${dE(n)} (négative pour une baisse).`;
      },
      champs: (c) => {
        const x = trimestreDeCroissance(c);
        const n = x.fin.nom;
        const enPlus = 3 * COMMANDE_EN_PLUS;
        const dues = x.mois.filter((y) => y.i + x.decalage > x.fin.i).length;
        return [
          {
            libelle: "Résultat en plus sur le trimestre",
            attendu: x.resultatEnPlus,
            calcul: `${qte(enPlus)} × (${eur(x.m.prix)} − ${eur(x.m.coutVariable.composants + x.m.coutVariable.autres)}) = ${eur(x.resultatEnPlus)}`,
          },
          { libelle: `Créances en plus à la fin ${dE(n)}`, attendu: x.creancesEnPlus, calcul: `${dues} factures de la commande non encaissées : ${dues} × ${eur(x.facture)} = ${eur(x.creancesEnPlus)}` },
          {
            libelle: `Dettes en plus à la fin ${dE(n)}`,
            attendu: x.dettesEnPlus,
            calcul: `les composants et la TVA ${dE(n)}, à payer en ${x.nomDuMois(x.fin.i + 1)} : ${eur(x.composants)} + ${eur(x.tvaDuMois)} = ${eur(x.dettesEnPlus)}`,
          },
          {
            libelle: `Variation de la trésorerie de fin ${dE(n)}`,
            attendu: x.variation,
            calcul: `${eur(x.resultatEnPlus)} − ${eur(x.creancesEnPlus)} + ${eur(x.dettesEnPlus)} = ${eur(x.variation)}, soit ${eur(x.fin.avec)} − ${eur(x.fin.budget)}`,
          },
        ];
      },
      explication: (c) => {
        const x = trimestreDeCroissance(c);
        return [
          `C'est le besoin en fonds de roulement de la croissance : chaque enceinte vendue à CampusTech attend ${x.ct.delai} jours pour rentrer, alors que ses coûts se paient dans le mois ou le suivant. Les ${eur(x.creancesEnPlus)} de créances en plus, moins les ${eur(x.dettesEnPlus)} de dettes en plus, font ${eur(auCentime(x.creancesEnPlus - x.dettesEnPlus))} à financer : plus que le résultat ne rapporte.`,
          `Une croissance rentable consomme de la trésorerie avant d'en rapporter. Le résultat en plus arrive ensuite : au 30 juin, toutes les factures de la commande sont payées, et la trésorerie a ${eur(auCentime(x.juin.avec - x.juin.base))} de plus qu'au budget.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Le banc, à rebours",
      notions: ["payment_terms", "cash_budget"],
      question: (c) => {
        const x = trimestreDeCroissance(c);
        const nb = x.nomDuMois(x.inv.mois);
        return `Le dirigeant voudrait aussi le banc en ${nb}. Avec la commande, calculez la trésorerie de fin ${dE(nb)}, banc compris (négative pour un découvert). Puis retrouvez le délai de paiement le plus long que CampusTech devrait accepter, sur toutes ses factures, pour qu'aucun mois ne finisse à découvert (factures du ${x.ct.jourDeFacturation}, mois de ${x.s.joursDuMoisCommercial} jours), et la trésorerie de fin ${dE(nb)} à ce délai.`;
      },
      champs: (c) => {
        const x = trimestreDeCroissance(c);
        const b = x.inv.mois;
        const nb = x.nomDuMois(b);
        const fin = x.avecLeBanc.mois[b]!.tresorerieFin;
        const sansBanc = x.avec.mois[b]!.tresorerieFin;
        return [
          {
            libelle: `Trésorerie de fin ${dE(nb)}, banc compris`,
            attendu: fin,
            calcul: `${eur(sansBanc)} − ${eur(x.invTtc)} = ${eur(fin)}`,
          },
          {
            libelle: "Délai le plus long de CampusTech, en jours",
            attendu: x.delaiMax,
            calcul: `une facture de plus doit rentrer avant la fin ${dE(nb)} (${eur(x.factureAvancee)} pour ${eur(-fin)} de découvert) : un paiement ${x.decalageMax} mois après la facture, ${x.ct.jourDeFacturation} + d ≤ ${x.decalageMax + 1} × ${x.s.joursDuMoisCommercial}, d ≤ ${x.delaiMax}`,
          },
          {
            libelle: `Trésorerie de fin ${dE(nb)}, à ce délai`,
            attendu: x.auDelai.mois[b]!.tresorerieFin,
            calcul: `${eur(fin)} + ${eur(x.factureAvancee)} = ${eur(x.auDelai.mois[b]!.tresorerieFin)}`,
          },
        ];
      },
      explication: (c) => {
        const x = trimestreDeCroissance(c);
        const decouverts = x.avecLeBanc.mois.filter((y) => y.tresorerieFin < 0);
        return [
          `Sans changer de délai, le banc mettrait ${x.f.entreprise} à découvert : ${decouverts.map((y) => `${eur(y.tresorerieFin)} fin ${dE(y.nom)}`).join(", ")}. Sans la commande, il ne laissait que ${eur(-x.sansLaCommande)} de découvert : c'est la croissance qui creuse le trou. À ${x.delaiMax} jours, chaque facture de CampusTech rentre un mois plus tôt, et aucun mois ne finit à découvert : le point bas est ${x.auDelai.plusBas.nom}, ${eur(x.auDelai.plusBas.tresorerie)}.`,
          "Mais un délai se négocie avec le client, qui n'a aucune raison de payer plus tôt quand il commande plus. À défaut, le banc demande un financement : un découvert autorisé, un emprunt, ou un report de l'achat.",
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      question: () => "Quelle phrase envoyez-vous au dirigeant ?",
      options: (c) => {
        const x = trimestreDeCroissance(c);
        const nb = x.nomDuMois(x.inv.mois);
        const n = x.fin.nom;
        const auBanc = x.avecLeBanc.mois[x.inv.mois]!.tresorerieFin;
        const aLaFin = x.avecLeBanc.mois[x.fin.i]!.tresorerieFin;
        return [
          {
            texte: `Oui à la commande, mais le banc ${dE(nb)} demande un financement, ou CampusTech à ${x.delaiMax} jours`,
            juste: true,
            retour: `Oui : la commande rapporte ${eur(x.resultatEnPlus)} de résultat, mais elle retient ${eur(x.creancesEnPlus)} de créances à la fin ${dE(n)}. Avec le banc, ${nb} finirait avec ${enBanque(auBanc)}, et ${n} avec ${enBanque(aLaFin)}. Il faut négocier le financement du banc maintenant, ou obtenir de CampusTech qu'elle paie à ${x.delaiMax} jours au plus.`,
          },
          {
            texte: `Oui aux deux : la commande rapporte ${eur(x.resultatEnPlus)} de résultat, de quoi payer le banc`,
            juste: false,
            retour: `Non : le résultat n'est pas de l'argent en banque. Les ${eur(x.resultatEnPlus)} de résultat en plus ne seront en banque qu'en ${x.nomDuMois(x.fin.i + x.decalage)}, quand la dernière facture de la commande rentrera ; avec le banc, ${nb} finirait avec ${enBanque(auBanc)}.`,
          },
          {
            texte: `Non à la commande : elle fait baisser la trésorerie de ${eur(-x.variation)}, c'est donc qu'elle fait perdre de l'argent`,
            juste: false,
            retour: `Non : la commande est rentable, ${eur(x.resultatEnPlus)} de résultat en plus. Elle consomme de la trésorerie parce que CampusTech paie à ${x.ct.delai} jours : c'est un besoin de financement, pas une perte.`,
          },
          {
            texte: `Oui aux deux : à la fin ${dE(n)}, il nous restera ${eur(x.fin.avec)} en banque`,
            juste: false,
            retour: `Non : la fin ${dE(n)} ne dit pas ${nb}, et ce chiffre oublie le banc. Avec lui, ${nb} finirait avec ${enBanque(auBanc)}, et ${n} avec ${enBanque(aLaFin)}.`,
          },
        ];
      },
    },
  ],
};
