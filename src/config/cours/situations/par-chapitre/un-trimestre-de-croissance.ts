import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_BUDGET, budgetAuDecalage, delaiLePlusLong, ficheDe } from "../../chapitres/budget-de-tresorerie";
import { budgetDeTresorerie, investissementDeLaFiche, moisDeDecalage, tableauDeBord } from "../../monde/couts-et-budgets";
import { DELAI_CONVENU_DE_CAMPUSTECH, type FicheDeGestion } from "../../monde/nova-gestion";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE BUDGET DE TRÉSORERIE » : UN TRIMESTRE DE CROISSANCE
 * (contrôle de gestion, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le semestre de NOVA (monde/nova-gestion.ts)
 * et le budget du modèle du cours (monde/couts-et-budgets.ts).
 *
 * CampusTech veut commander plus d'enceintes au deuxième trimestre, aux mêmes conditions : facturées
 * le 20, dues à 60 jours ; et, mauvais payeur, elle les paiera comme les autres, en retard, au 80e jour. Le dirigeant demande si plus de ventes, c'est plus d'argent en banque, et
 * s'il pourra toujours acheter le banc de mesure en avril. L'élève refait seul le chemin du chapitre
 * avec la commande : ce que coûte un mois de commande, la trésorerie de chaque mois, puis le
 * croisement du résultat et de la trésorerie (le résultat monte, la trésorerie baisse : le besoin en
 * fonds de roulement de la croissance), et à rebours le retard que CampusTech ne devrait pas dépasser pour que
 * le banc passe sans découvert. La réponse demande un jugement : accepter la commande, mais financer
 * le banc.
 */

/** La commande en plus de CampusTech, hypothèse du cours : 300 enceintes par mois, d'avril à juin. */
export const COMMANDE_EN_PLUS = 300;

/** Le premier mois de la commande : avril (0 pour janvier), le début du deuxième trimestre. */
export const MOIS_DE_LA_COMMANDE = 3;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const enBanque = (t: number) => (t >= 0 ? `${eur(t)} en banque` : `un découvert de ${eur(-t)}`);

/** La fiche où CampusTech commande `enPlus` enceintes de plus chaque mois, dès le mois de la commande. */
export function ficheAvecLaCommande(f: FicheDeGestion, enPlus = COMMANDE_EN_PLUS): FicheDeGestion {
  return {
    ...f,
    semestre: {
      ...f.semestre,
      clienteles: f.semestre.clienteles.map((c) => (c.code === "campustech" ? { ...c, quantites: c.quantites.map((q, k) => (k >= MOIS_DE_LA_COMMANDE ? q + enPlus : q)) } : c)),
    },
  };
}

/** Les chiffres de la réponse, calculés une fois du cas. */
export function trimestreDeCroissance(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = f.semestre;
  const m = f.moisDeReference;
  const tva = s.tauxDeTva;
  const k = MOIS_DE_LA_COMMANDE;
  const g = ficheAvecLaCommande(f);
  const base = budgetDeTresorerie(f);
  const avec = budgetDeTresorerie(g);
  const ct = s.clienteles.find((x) => x.code === "campustech")!;
  const n = COMMANDE_EN_PLUS;
  const facture = auCentime(n * m.prix * (1 + tva));
  const autres = auCentime(n * m.coutVariable.autres * (1 + tva));
  const composants = auCentime(n * m.coutVariable.composants * (1 + tva));
  const tvaDuMois = auCentime(n * (m.prix - m.coutVariable.composants - m.coutVariable.autres) * tva);
  const mois = [k, k + 1, k + 2].map((i) => ({ i, nom: s.mois[i]!.nom, budget: base.mois[i]!.tresorerieFin, avec: avec.mois[i]!.tresorerieFin }));
  const resultatEnPlus = auCentime(tableauDeBord(g).semestre.resultat - tableauDeBord(f).semestre.resultat);
  const creancesEnPlus = auCentime(avec.fin.creancesClients - base.fin.creancesClients);
  const dettesEnPlus = auCentime(avec.fin.dettesFournisseurs - base.fin.dettesFournisseurs + avec.fin.tvaDue - base.fin.tvaDue);
  const variation = auCentime(avec.tresorerieFin - base.tresorerieFin);
  // Le banc en avril, avec la commande ; puis le plus long décalage de CampusTech qui le laisse passer.
  const inv = investissementDeLaFiche(f);
  const avecLeBanc = budgetDeTresorerie(g, { investissement: inv });
  const decalage = moisDeDecalage(ct.jourDeFacturation, ct.delai, s.joursDuMoisCommercial);
  const decalages = Array.from({ length: decalage + 1 }, (_, i) => i).filter((d) => budgetAuDecalage(g, d, { investissement: inv }).plusBas.tresorerie >= 0);
  const decalageMax = decalages.length ? Math.max(...decalages) : 0;
  const delaiMax = delaiLePlusLong(ct.jourDeFacturation, decalageMax, s.joursDuMoisCommercial);
  const auDelai = budgetAuDecalage(g, decalageMax, { investissement: inv });
  const quantiteDuTrimestre = [k, k + 1, k + 2].reduce((t, i) => t + avec.mois[i]!.quantite, 0);
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
    /** Ce que CampusTech paie en plus en avril quand elle paie un mois plus tôt : la facture d'un mois de plus. */
    factureAvancee: auCentime(ct.quantites[k - decalageMax]! * m.prix * (1 + tva)),
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
    "CampusTech veut commander plus d'enceintes au deuxième trimestre, dues à 60 jours, et qu'elle paiera en retard, comme toujours. Le dirigeant veut savoir ce qu'il aura en banque, et s'il pourra toujours acheter son banc de mesure : plus de ventes, est-ce autant d'argent en plus ?",
  objectifs: [
    "Chiffrer ce qu'une commande payée en retard fait entrer et sortir, mois par mois",
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
        return [
          `« CampusTech veut nous commander ${qte(COMMANDE_EN_PLUS)} enceintes de plus chaque mois, ${dE(n0)} à juin, aux mêmes conditions : facturées le ${x.ct.jourDeFacturation}, dues à ${DELAI_CONVENU_DE_CAMPUSTECH} jours. Et elle les paiera comme les autres, en retard, ${x.ct.delai} jours après la facture. La ligne peut les fabriquer : ${qte(x.quantiteDuTrimestre)} enceintes au trimestre, pour ${qte(x.f.decision.capacite)} de capacité. Plus de ventes, c'est plus d'argent en banque au 30 juin ? Et pourrai-je toujours acheter le banc de mesure en ${n0} ? »`,
          `Les conditions sont celles du budget : une enceinte se vend ${eur(x.m.prix)} HT et demande ${eur(x.m.coutVariable.composants)} HT de composants, payés le mois suivant, et ${eur(x.m.coutVariable.autres)} HT d'autres coûts variables, payés dans le mois. La TVA est de ${(x.tva * 100).toLocaleString("fr-FR")} %, et la TVA du mois se paie le mois suivant. Le banc coûte ${eur(x.inv.montantHt)} HT, payé en ${n0} ; sa TVA se récupère sur la déclaration ${dE(n0)}, payée en ${x.nomDuMois(MOIS_DE_LA_COMMANDE + 1)}.`,
          "Pas de cours cette fois : vous avez le budget du deuxième trimestre, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const x = trimestreDeCroissance(c);
        const part = x.s.clienteles.find((y) => y.code === "particuliers")!;
        return {
          titre: `Le deuxième trimestre au budget · ${x.f.entreprise}`,
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
        return [
          `À ${x.ct.delai} jours, la facture ${dE(n0)} ne rentre que ${x.decalage} mois plus tard, après le 30 juin : dans le trimestre, aucune facture de la commande n'est encaissée, alors que ses coûts se paient chaque mois, et sa TVA aussi.`,
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
        return `Avec la commande, et sans le banc, calculez la trésorerie de fin ${dE(x.mois[0]!.nom)}, de fin ${dE(x.mois[1]!.nom)} et du 30 juin (négative pour un découvert), puis ce que CampusTech devra au 30 juin.`;
      },
      champs: (c) => {
        const x = trimestreDeCroissance(c);
        const sorties = (j: number) => [`${j + 1} × ${eur(x.autres)}`, ...(j > 0 ? [`${j} × (${eur(x.composants)} + ${eur(x.tvaDuMois)})`] : [])].join(" − ");
        const dues = Math.min(x.decalage, x.s.mois.length);
        return [
          ...x.mois.map((y, j) => ({
            libelle: y.i === x.s.mois.length - 1 ? "Trésorerie au 30 juin" : `Trésorerie de fin ${dE(y.nom)}`,
            attendu: y.avec,
            calcul: `${eur(y.budget)} − ${sorties(j)} = ${eur(y.avec)}`,
          })),
          {
            libelle: "Créances sur CampusTech au 30 juin",
            attendu: x.avec.fin.creancesClients,
            calcul: `les ${dues} dernières factures, ${dE(x.mois[0]!.nom)} à juin : ${dues} × (${qte(x.ct.quantites[x.mois[0]!.i]!)} + ${qte(COMMANDE_EN_PLUS)}) × ${eur(auCentime(x.m.prix * (1 + x.tva)))} = ${eur(x.avec.fin.creancesClients)}`,
          },
        ];
      },
      explication: (c) => {
        const x = trimestreDeCroissance(c);
        return [
          `Le trimestre vend ${qte(3 * COMMANDE_EN_PLUS)} enceintes de plus, et le 30 juin finit avec ${eur(-x.variation)} de moins qu'au budget : ${eur(x.avec.tresorerieFin)} au lieu de ${eur(x.base.tresorerieFin)}. Plus de ventes, ici, c'est moins d'argent en banque.`,
        ];
      },
    },
    {
      id: "le-croisement",
      type: "montants",
      titre: "Le résultat monte, la trésorerie baisse",
      notions: ["bfr", "net_treasury", "contribution_margin"],
      question: () =>
        "Le résultat du trimestre monte avec la commande, la trésorerie baisse. Retrouvez le passage de l'un à l'autre : le résultat en plus (la marge sur coût variable des enceintes en plus ; les charges fixes ne bougent pas), les créances en plus au 30 juin, les dettes en plus au 30 juin (les composants et la TVA de juin), puis la variation de la trésorerie du 30 juin (négative pour une baisse).",
      champs: (c) => {
        const x = trimestreDeCroissance(c);
        const enPlus = 3 * COMMANDE_EN_PLUS;
        return [
          {
            libelle: "Résultat en plus sur le trimestre",
            attendu: x.resultatEnPlus,
            calcul: `${qte(enPlus)} × (${eur(x.m.prix)} − ${eur(x.m.coutVariable.composants + x.m.coutVariable.autres)}) = ${eur(x.resultatEnPlus)}`,
          },
          { libelle: "Créances en plus au 30 juin", attendu: x.creancesEnPlus, calcul: `${x.decalage} factures de la commande non encaissées : ${x.decalage} × ${eur(x.facture)} = ${eur(x.creancesEnPlus)}` },
          {
            libelle: "Dettes en plus au 30 juin",
            attendu: x.dettesEnPlus,
            calcul: `les composants et la TVA de juin, à payer en juillet : ${eur(x.composants)} + ${eur(x.tvaDuMois)} = ${eur(x.dettesEnPlus)}`,
          },
          {
            libelle: "Variation de la trésorerie du 30 juin",
            attendu: x.variation,
            calcul: `${eur(x.resultatEnPlus)} − ${eur(x.creancesEnPlus)} + ${eur(x.dettesEnPlus)} = ${eur(x.variation)}, soit ${eur(x.avec.tresorerieFin)} − ${eur(x.base.tresorerieFin)}`,
          },
        ];
      },
      explication: (c) => {
        const x = trimestreDeCroissance(c);
        return [
          `C'est le besoin en fonds de roulement de la croissance : chaque enceinte vendue à CampusTech attend ${x.ct.delai} jours pour rentrer, alors que ses coûts se paient dans le mois ou le suivant. Les ${eur(x.creancesEnPlus)} de créances en plus, moins les ${eur(x.dettesEnPlus)} de dettes en plus, font ${eur(auCentime(x.creancesEnPlus - x.dettesEnPlus))} à financer : plus que le résultat ne rapporte.`,
          "Une croissance rentable consomme de la trésorerie avant d'en rapporter. Le résultat en plus arrivera, mais après le 30 juin.",
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
        const n0 = x.nomDuMois(MOIS_DE_LA_COMMANDE);
        return `Le dirigeant voudrait aussi le banc en ${n0}. Avec la commande, calculez la trésorerie de fin ${dE(n0)}, banc compris (négative pour un découvert). Puis retrouvez le délai de paiement le plus long que CampusTech devrait accepter, sur toutes ses factures, pour qu'aucun mois ne finisse à découvert (factures du ${x.ct.jourDeFacturation}, mois de ${x.s.joursDuMoisCommercial} jours), et la trésorerie de fin ${dE(n0)} à ce délai.`;
      },
      champs: (c) => {
        const x = trimestreDeCroissance(c);
        const k = MOIS_DE_LA_COMMANDE;
        const n0 = x.nomDuMois(k);
        const avril = x.avecLeBanc.mois[k]!.tresorerieFin;
        return [
          {
            libelle: `Trésorerie de fin ${dE(n0)}, banc compris`,
            attendu: avril,
            calcul: `${eur(x.mois[0]!.avec)} − ${eur(x.invTtc)} = ${eur(avril)}`,
          },
          {
            libelle: "Délai le plus long de CampusTech, en jours",
            attendu: x.delaiMax,
            calcul: `une facture de plus doit rentrer avant la fin ${dE(n0)} (${eur(x.factureAvancee)} pour ${eur(-avril)} de découvert) : un paiement ${x.decalageMax} mois après la facture, ${x.ct.jourDeFacturation} + d ≤ ${x.decalageMax + 1} × ${x.s.joursDuMoisCommercial}, d ≤ ${x.delaiMax}`,
          },
          {
            libelle: `Trésorerie de fin ${dE(n0)}, à ce délai`,
            attendu: x.auDelai.mois[k]!.tresorerieFin,
            calcul: `${eur(avril)} + ${eur(x.factureAvancee)} = ${eur(x.auDelai.mois[k]!.tresorerieFin)}`,
          },
        ];
      },
      explication: (c) => {
        const x = trimestreDeCroissance(c);
        const k = MOIS_DE_LA_COMMANDE;
        const b = x.avecLeBanc.mois;
        return [
          `Sans changer de délai, le banc mettrait ${x.f.entreprise} à découvert tout le trimestre : ${b
            .slice(k)
            .map((y) => `${eur(y.tresorerieFin)} fin ${dE(y.nom)}`)
            .join(", ")}. À ${x.delaiMax} jours, chaque facture de CampusTech rentre un mois plus tôt, et aucun mois ne finit à découvert : le point bas est ${x.auDelai.plusBas.nom}, ${eur(x.auDelai.plusBas.tresorerie)}.`,
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
        const k = MOIS_DE_LA_COMMANDE;
        const n0 = x.nomDuMois(k);
        const avril = x.avecLeBanc.mois[k]!.tresorerieFin;
        return [
          {
            texte: `Oui à la commande, mais le banc ${dE(n0)} demande un financement, ou CampusTech en retard de ${x.delaiMax - DELAI_CONVENU_DE_CAMPUSTECH} jours au plus`,
            juste: true,
            retour: `Oui : la commande rapporte ${eur(x.resultatEnPlus)} de résultat, mais elle retient ${eur(x.creancesEnPlus)} de créances au 30 juin. Avec le banc, ${n0} finirait avec ${enBanque(avril)}, et le 30 juin avec ${enBanque(x.avecLeBanc.tresorerieFin)}. Il faut négocier le financement du banc maintenant, ou obtenir de CampusTech qu'elle réduise son retard : un paiement au plus ${x.delaiMax} jours après la facture.`,
          },
          {
            texte: `Oui aux deux : la commande rapporte ${eur(x.resultatEnPlus)} de résultat, de quoi payer le banc`,
            juste: false,
            retour: `Non : le résultat n'est pas de l'argent en banque. Les ${eur(x.resultatEnPlus)} de résultat en plus rentreront après le 30 juin ; avec le banc, ${n0} finirait avec ${enBanque(avril)}.`,
          },
          {
            texte: `Non à la commande : elle fait baisser la trésorerie de ${eur(-x.variation)}, c'est donc qu'elle fait perdre de l'argent`,
            juste: false,
            retour: `Non : la commande est rentable, ${eur(x.resultatEnPlus)} de résultat en plus. Elle consomme de la trésorerie parce que CampusTech paie en retard, ${x.ct.delai} jours après la facture : c'est un besoin de financement, pas une perte.`,
          },
          {
            texte: `Oui aux deux : au 30 juin, il nous restera ${eur(x.avec.tresorerieFin)} en banque`,
            juste: false,
            retour: `Non : le 30 juin ne dit pas ${n0}, et ce chiffre oublie le banc. Avec lui, ${n0} finirait avec ${enBanque(avril)}, et le 30 juin avec ${enBanque(x.avecLeBanc.tresorerieFin)}.`,
          },
        ];
      },
    },
  ],
};
