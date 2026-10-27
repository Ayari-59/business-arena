import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import { METIERS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_MAGASIN, etiquettesDuRayon } from "./le-prix-affiche";

/**
 * CHAPITRE : TENIR LA CAISSE, LE TICKET, LA MONNAIE ET LE FOND DE CAISSE (CAP Équipier
 * polyvalent du commerce, palier 1).
 *
 * La journée de l'équipier en caisse : il passe un ticket, rend la monnaie sur un billet, ouvre
 * la caisse le matin avec un fond de caisse, la compte le soir et constate un écart.
 *
 * CE QUI VIENT DE L'ARÈNE. Les prix affichés (le prix hors taxes de l'arène, avec la TVA du
 * métier que le cours applique : « Le prix affiché ») ; les ventes d'une journée moyenne, ventes
 * du trimestre réglées en caisse ÷ jours du trimestre (`anneeJouee`, segments sans délai de
 * paiement : les comités d'entreprise et les cadeaux d'affaires sont facturés, ils ne passent
 * pas en caisse) ; le chiffre d'affaires du jour, de la même façon. L'arène joue hors taxes.
 *
 * CE QUI N'EN VIENT PAS. L'arène ne simule ni ticket ni caisse. Le panier du client, le billet
 * qu'il donne, le fond de caisse, la part payée en espèces et l'erreur de la journée sont des
 * hypothèses du cours, nommées ci-dessous, et le texte le dit.
 *
 * La boutique seule, comme « Le prix affiché » : le commerce en ligne n'a pas de caisse, et un
 * restaurant n'est pas un magasin.
 */

/** Le trimestre de la journée moyenne : le premier, celui du cas du cours. */
export const TRIMESTRE_DE_LA_CAISSE = 1;

/** Le panier du client (hypothèse du cours) : des articles de la boutique, et combien. */
export const PANIER_DU_CLIENT: readonly { article: string; quantite: number }[] = [
  { article: "echarpe", quantite: 1 },
  { article: "bonnet", quantite: 1 },
];

/** Le billet que le client donne pour payer (hypothèse du cours). */
export const BILLET_DU_CLIENT = 100;

/** Le fond de caisse du matin : la monnaie mise dans le tiroir avant la première vente (hypothèse du cours). */
export const FOND_DE_CAISSE = 150;

/** La part du chiffre d'affaires du jour payée en espèces, le reste par carte (hypothèse du cours). */
export const PART_EN_ESPECES = 0.25;

/** L'erreur de la journée (hypothèse du cours) : un billet de 10 € rendu en trop à un client. */
export const ERREUR_DE_LA_JOURNEE = -10;

/** Les billets et les pièces d'un tiroir-caisse, du plus grand au plus petit. */
export const COUPURES = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01] as const;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** Le nom d'une coupure : « billet de 20 € », « pièce de 50 centimes ». */
export function nomDeLaCoupure(v: number, nombre: number): string {
  const s = nombre > 1 ? "s" : "";
  if (v >= 5) return `billet${s} de ${v} €`;
  if (v >= 1) return `pièce${s} de ${v} €`;
  const centimes = Math.round(v * 100);
  return `pièce${s} de ${centimes} centime${centimes > 1 ? "s" : ""}`;
}

/** Un montant en billets et en pièces, en prenant toujours la plus grande coupure possible. */
export function enCoupures(montant: number): { valeur: number; nombre: number }[] {
  let reste = Math.round(montant * 100);
  const out: { valeur: number; nombre: number }[] = [];
  for (const v of COUPURES) {
    const c = Math.round(v * 100);
    const n = Math.floor(reste / c);
    if (n > 0) out.push({ valeur: v, nombre: n });
    reste -= n * c;
  }
  return out;
}

/** « 1 billet de 20 €, 1 billet de 5 € et 1 pièce de 10 centimes ». */
export function ditLesCoupures(cs: readonly { valeur: number; nombre: number }[]): string {
  const morceaux = cs.map((x) => `${qte(x.nombre)} ${nomDeLaCoupure(x.valeur, x.nombre)}`);
  return morceaux.length > 1 ? `${morceaux.slice(0, -1).join(", ")} et ${morceaux.at(-1)}` : morceaux.join("");
}

/** Le chiffre d'affaires et les ventes d'une journée moyenne du trimestre, réglés en caisse. */
export function journeeMoyenne(c: Cas, trimestre: number, erreur: number = ERREUR_DE_LA_JOURNEE) {
  const def = scenarioByCode(c.code);
  const s = def.scenario;
  const segments = [...s.market.segments, ...(s.products ?? []).flatMap((p) => p.market?.segments ?? [])];
  const delais = new Map(segments.map((g) => [g.code, g.paymentDelayDays ?? 0]));
  const r = anneeJouee(c.code).partie.rounds[trimestre - 1]!.results["joueur"]!;
  const enCaisse = Object.entries(r.market.bySegment).filter(([seg]) => (delais.get(seg) ?? 0) === 0);
  const ventes = Math.round(enCaisse.reduce((t, [, v]) => t + v.sold, 0));
  const chiffre = Math.round(enCaisse.reduce((t, [, v]) => t + v.revenue, 0));
  const jours = s.roundDays;
  const taux = METIERS[c.code]!.vente.tauxTva;
  const htDuJour = auCentime(chiffre / jours);
  const tvaDuJour = auCentime(htDuJour * taux);
  const ttcDuJour = auCentime(htDuJour + tvaDuJour);
  const especes = auCentime(ttcDuJour * PART_EN_ESPECES);
  const attendu = auCentime(FOND_DE_CAISSE + especes);
  const compte = auCentime(attendu + erreur);
  return {
    trimestre,
    ventesDuTrimestre: ventes,
    chiffreDuTrimestre: chiffre,
    jours,
    taux,
    articlesParJour: Math.round(ventes / jours),
    htDuJour,
    tvaDuJour,
    ttcDuJour,
    especes,
    attendu,
    compte,
    tiroir: enCoupures(compte),
    ecart: auCentime(compte - attendu),
    auCoffre: auCentime(compte - FOND_DE_CAISSE),
    /** Les segments facturés existent bien : tout le chiffre d'affaires ne passe pas en caisse. */
    chiffreFacture: Math.round(r.incomeStatement.revenue - chiffre),
  };
}

/** Le ticket du client, la monnaie, puis la journée en caisse. */
export function caisseDuJour(c: Cas) {
  const etiquettes = etiquettesDuRayon(c, TRIMESTRE_DE_LA_CAISSE);
  const lignes = PANIER_DU_CLIENT.map((l) => {
    const e = etiquettes.find((x) => x.code === l.article);
    if (!e) throw new Error(`Pas d'article ${l.article} chez ${c.code}`);
    return { nom: e.nom, quantite: l.quantite, prix: e.affiche, montant: auCentime(l.quantite * e.affiche) };
  });
  const total = auCentime(lignes.reduce((t, l) => t + l.montant, 0));
  if (total > BILLET_DU_CLIENT) throw new Error(`Le billet de ${BILLET_DU_CLIENT} € ne paie pas le ticket de ${total} €`);
  const rendu = auCentime(BILLET_DU_CLIENT - total);
  const monnaie = enCoupures(rendu);
  // Deux erreurs de caissier : un billet de 10 € en trop, la plus petite pièce oubliée.
  const plus = enCoupures(auCentime(rendu + 10));
  const petite = monnaie.at(-1)!.valeur;
  const moins = enCoupures(auCentime(rendu - petite));
  return {
    lignes,
    total,
    billet: BILLET_DU_CLIENT,
    rendu,
    monnaie,
    plus: { coupures: plus, montant: auCentime(rendu + 10) },
    moins: { coupures: moins, montant: auCentime(rendu - petite), oubli: petite },
    jour: journeeMoyenne(c, TRIMESTRE_DE_LA_CAISSE),
  };
}

export function tableauDesPrix(c: Cas): TableauDeDonnees {
  return {
    titre: "Les prix affichés en rayon",
    colonnes: ["Prix affiché"],
    lignes: etiquettesDuRayon(c, TRIMESTRE_DE_LA_CAISSE).map((e) => ({ libelle: e.nom, valeurs: [eur(e.affiche)] })),
  };
}

export function tableauDuTicket(c: Cas): TableauDeDonnees {
  const k = caisseDuJour(c);
  return {
    titre: "Le panier du client",
    colonnes: ["Quantité", "Prix affiché"],
    lignes: k.lignes.map((l) => ({ libelle: l.nom, valeurs: [qte(l.quantite), eur(l.prix)] })),
  };
}

export function tableauDuTiroir(c: Cas): TableauDeDonnees {
  const k = caisseDuJour(c);
  return {
    titre: "Ce que l'équipier compte dans le tiroir, le soir",
    colonnes: ["Nombre"],
    lignes: k.jour.tiroir.map((x) => {
      const nom = nomDeLaCoupure(x.valeur, 2);
      return { libelle: nom.charAt(0).toUpperCase() + nom.slice(1), valeurs: [qte(x.nombre)] };
    }),
  };
}

export const TENIR_LA_CAISSE: Chapitre = {
  code: "tenir-la-caisse",
  parcours: "cap-epc",
  palier: 1,
  blocs: ["CAP EPC · Bloc 3 · Conseiller et accompagner le client dans son parcours d'achat"],
  titre: "Tenir la caisse : le ticket, la monnaie et le fond de caisse",
  accroche:
    "Passer les articles, annoncer le total, rendre la monnaie sans se tromper. Ouvrir la caisse le matin, la compter le soir, et trouver l'écart.",
  objectifs: [
    "Faire le total d'un ticket de caisse",
    "Rendre la monnaie sur un billet",
    "Calculer les espèces attendues le soir, avec le fond de caisse",
    "Compter la caisse et trouver l'écart",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_MAGASIN,
    pourquoi: "ce chapitre tient la caisse d'un magasin, où le client paie ses articles en partant.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une journée en caisse",
      notions: ["revenue"],
      tableau: tableauDesPrix,
      texte: (c) => [
        `Aujourd'hui, vous tenez la caisse de ${c.entreprise}. Le client paie le prix affiché, toutes taxes comprises.`,
        "Les prix viennent de l'arène, avec la TVA. Les ventes de la journée aussi. Mais l'arène ne simule ni ticket ni caisse : le panier du client, son billet, le fond de caisse et l'erreur de la journée sont des exemples du cours.",
      ],
      repere: () => "Monnaie à rendre = somme donnée − total du ticket.",
    },
    {
      id: "le-ticket",
      type: "montants",
      titre: "Le total du ticket",
      notions: ["average_basket"],
      tableau: tableauDuTicket,
      question: () => "Un client pose ses articles sur le comptoir. Calculez le montant de chaque ligne, puis le total du ticket.",
      champs: (c) => {
        const k = caisseDuJour(c);
        return [
          ...k.lignes.map((l) => ({
            libelle: `Ligne « ${l.nom} »`,
            attendu: l.montant,
            calcul: `${qte(l.quantite)} × ${eur(l.prix)} = ${eur(l.montant)}`,
          })),
          { libelle: "Total du ticket", attendu: k.total, calcul: `${k.lignes.map((l) => eur(l.montant)).join(" + ")} = ${eur(k.total)}` },
        ];
      },
      explication: (c) => {
        const k = caisseDuJour(c);
        return [`Vous annoncez le total au client : ${eur(k.total)}. La TVA est déjà dans les prix affichés.`];
      },
    },
    {
      id: "la-monnaie",
      type: "montants",
      titre: "La monnaie à rendre",
      notions: ["average_basket"],
      question: (c) => {
        const k = caisseDuJour(c);
        return `Le client paie avec un billet de ${eur(k.billet)}. Calculez la monnaie à lui rendre.`;
      },
      champs: (c) => {
        const k = caisseDuJour(c);
        return [{ libelle: "Monnaie à rendre", attendu: k.rendu, calcul: `${eur(k.billet)} − ${eur(k.total)} = ${eur(k.rendu)}` }];
      },
      explication: (c) => {
        const k = caisseDuJour(c);
        return [
          `Vous rendez ${eur(k.rendu)}. Pour éviter l'erreur, comptez à voix haute en partant du total : ${eur(k.total)}, puis ajoutez les pièces et les billets jusqu'à ${eur(k.billet)}.`,
          "Laissez le billet du client sur la caisse jusqu'à la fin : s'il conteste, vous le montrez.",
        ];
      },
    },
    {
      id: "rendre-juste",
      type: "choix",
      titre: "Les billets et les pièces à rendre",
      notions: ["average_basket"],
      question: (c) => {
        const k = caisseDuJour(c);
        return `Vous devez rendre ${eur(k.rendu)}, avec le moins de pièces possible. Que donnez-vous au client ?`;
      },
      options: (c) => {
        const k = caisseDuJour(c);
        return [
          {
            texte: ditLesCoupures(k.monnaie),
            juste: true,
            retour: `Oui : cela fait ${eur(k.rendu)}, le compte juste.`,
          },
          {
            texte: ditLesCoupures(k.plus.coupures),
            juste: false,
            retour: `Non : cela fait ${eur(k.plus.montant)}. Vous rendez 10 € de trop, et il manquera 10 € dans la caisse ce soir.`,
          },
          {
            texte: ditLesCoupures(k.moins.coupures),
            juste: false,
            retour: `Non : cela fait ${eur(k.moins.montant)}. Il manque ${eur(k.moins.oubli)} au client.`,
          },
        ];
      },
    },
    {
      id: "la-journee",
      type: "montants",
      titre: "Le chiffre d'affaires du jour",
      notions: ["revenue"],
      question: (c) => {
        const j = caisseDuJour(c).jour;
        return `Au trimestre ${j.trimestre}, l'arène compte ${qte(j.ventesDuTrimestre)} articles vendus en caisse, pour ${eur(j.chiffreDuTrimestre)} hors taxes, en ${qte(j.jours)} jours. Calculez les articles vendus en un jour (à l'unité), puis le chiffre d'affaires hors taxes d'un jour (au centime).`;
      },
      champs: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          { libelle: "Articles vendus en un jour", attendu: j.articlesParJour, calcul: `${qte(j.ventesDuTrimestre)} ÷ ${qte(j.jours)} = ${qte(j.articlesParJour)}`, tolerance: 1 },
          { libelle: "Chiffre d'affaires hors taxes d'un jour", attendu: j.htDuJour, calcul: `${eur(j.chiffreDuTrimestre)} ÷ ${qte(j.jours)} = ${eur(j.htDuJour)}` },
        ];
      },
      explication: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          `Un jour moyen, la caisse voit passer ${qte(j.articlesParJour)} articles. Les ventes aux comités d'entreprise et les cadeaux d'affaires ne passent pas en caisse : elles sont facturées et payées plus tard.`,
        ];
      },
    },
    {
      id: "les-especes",
      type: "montants",
      titre: "Les espèces de la journée",
      notions: ["revenue", "vat_payable"],
      question: (c) => {
        const j = caisseDuJour(c).jour;
        return `En caisse, le client paie toutes taxes. Calculez le chiffre d'affaires TTC du jour (${eur(j.htDuJour)} + ${pct(j.taux)} de TVA). Dans le cas du cours, ${pct(PART_EN_ESPECES)} de cette somme est payée en espèces, le reste par carte. Calculez les espèces encaissées.`;
      },
      champs: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          { libelle: "Chiffre d'affaires TTC du jour", attendu: j.ttcDuJour, calcul: `${eur(j.htDuJour)} + ${eur(j.tvaDuJour)} = ${eur(j.ttcDuJour)}` },
          { libelle: "Espèces encaissées dans la journée", attendu: j.especes, calcul: `${eur(j.ttcDuJour)} × ${pct(PART_EN_ESPECES)} = ${eur(j.especes)}` },
        ];
      },
      explication: (c) => {
        const j = caisseDuJour(c).jour;
        return [`Le client a payé ${eur(j.ttcDuJour)} dans la journée, dont ${eur(j.especes)} en billets et en pièces. Ces espèces sont dans le tiroir.`];
      },
    },
    {
      id: "le-fond-de-caisse",
      type: "montants",
      titre: "Le fond de caisse du matin",
      notions: ["net_treasury"],
      question: (c) => {
        const j = caisseDuJour(c).jour;
        return `Le matin, avant la première vente, le tiroir reçoit un fond de caisse de ${eur(FOND_DE_CAISSE)} : la monnaie pour rendre aux premiers clients. Calculez les espèces qu'il doit y avoir dans le tiroir le soir, avec les ${eur(j.especes)} encaissés.`;
      },
      champs: (c) => {
        const j = caisseDuJour(c).jour;
        return [{ libelle: "Espèces attendues le soir", attendu: j.attendu, calcul: `${eur(FOND_DE_CAISSE)} + ${eur(j.especes)} = ${eur(j.attendu)}` }];
      },
      explication: (c) => {
        const j = caisseDuJour(c).jour;
        return [`Le soir, le tiroir doit contenir ${eur(j.attendu)}. Le fond de caisse n'est pas une vente : il était là avant le premier client.`];
      },
    },
    {
      id: "le-comptage",
      type: "montants",
      titre: "Le comptage du soir",
      notions: ["net_treasury"],
      tableau: tableauDuTiroir,
      question: (c) => {
        const j = caisseDuJour(c).jour;
        return `Le soir, vous comptez le tiroir, billet par billet, pièce par pièce. Calculez le total compté, puis l'écart avec les ${eur(j.attendu)} attendus (négatif s'il manque de l'argent).`;
      },
      champs: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          { libelle: "Total compté dans le tiroir", attendu: j.compte, calcul: `${j.tiroir.map((x) => `${qte(x.nombre)} × ${eur(x.valeur)}`).join(" + ")} = ${eur(j.compte)}` },
          { libelle: "Écart de caisse", attendu: j.ecart, calcul: `${eur(j.compte)} − ${eur(j.attendu)} = ${eur(j.ecart)}` },
        ];
      },
      explication: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          j.ecart < 0
            ? `Il manque ${eur(-j.ecart)} dans la caisse. Dans le cas du cours, c'est un billet de 10 € rendu en trop à un client.`
            : `Il y a ${eur(j.ecart)} de trop dans la caisse.`,
        ];
      },
    },
    {
      id: "que-faire-de-l-ecart",
      type: "choix",
      titre: "Ce que l'équipier fait de l'écart",
      question: (c) => {
        const j = caisseDuJour(c).jour;
        return `Le tiroir compte ${eur(j.compte)} au lieu de ${eur(j.attendu)}. Que faites-vous ?`;
      },
      options: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          {
            texte: "Noter l'écart et prévenir le responsable",
            juste: true,
            retour: `Oui : l'écart de ${eur(j.ecart)} s'écrit sur la feuille de caisse, et le responsable le sait. Une caisse ne se corrige pas en cachette.`,
          },
          {
            texte: "Remettre l'argent qui manque de sa poche",
            juste: false,
            retour: "Non : l'écart disparaît, mais personne ne saura qu'une erreur a eu lieu. Elle se reproduira.",
          },
          {
            texte: "Prendre l'écart sur le fond de caisse",
            juste: false,
            retour: `Non : le fond de caisse doit rester de ${eur(FOND_DE_CAISSE)} pour le lendemain. L'écart s'écrit, il ne se cache pas.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["revenue", "net_treasury"],
      texte: (c) => {
        const k = caisseDuJour(c);
        return [
          `Le client paie ${eur(k.total)} avec un billet de ${eur(k.billet)} : vous rendez ${eur(k.rendu)}.`,
          `Le soir, vous gardez le fond de caisse de ${eur(FOND_DE_CAISSE)} pour le lendemain. Le reste, ${eur(k.jour.auCoffre)}, va au responsable, avec la feuille de caisse et l'écart noté.`,
        ];
      },
      repere: () => "Espèces attendues le soir = fond de caisse + espèces encaissées. Écart = compté − attendu.",
    },
  ],
};
