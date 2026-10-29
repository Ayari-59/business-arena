import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import {
  FOND_DE_CAISSE as FOND_DU_MONDE,
  PART_EN_ESPECES as PART_DU_MONDE,
  PASSAGES_AU_COFFRE,
  PLAFOND_DU_TIROIR,
  clientsAvantLeCoffre,
  etiquettesDuRayon,
  journeeAvecLeCoffre,
  journeeEnCaisse,
  passagesNecessaires,
  ticketDuClient,
  tiroirApres,
} from "../monde/vente-et-caisse";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_MAGASIN } from "./le-prix-affiche";

/**
 * CHAPITRE : TENIR LA CAISSE, LE TICKET, LA MONNAIE ET LE FOND DE CAISSE (CAP Équipier
 * polyvalent du commerce, palier 1).
 *
 * La journée de l'équipier en caisse : il passe un ticket, rend la monnaie sur un billet, ouvre
 * la caisse le matin avec un fond de caisse, la compte le soir et constate un écart. Puis
 * l'expérience : un curseur (combien de clients payés en espèces avant que le tiroir dépasse son
 * plafond ?) et un laboratoire (combien de passages au coffre dans la journée, au moins).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la boutique MAILLE & CO (monde/maille-et-co.ts), ses
 * étiquettes, et son mois de janvier clientèle par clientèle. La journée moyenne, ce sont les
 * ventes réglées en caisse (les clientes fidèles et les passants ; les comités d'entreprise sont
 * facturés et paient à 45 jours) divisées par les 30 jours du mois commercial. Les calculs sont
 * dans monde/vente-et-caisse.ts.
 *
 * HYPOTHÈSES DU COURS, dites à l'élève : le panier du client (une écharpe et un bonnet), son billet
 * de 100 €, le fond de caisse de 150 €, la part de 25 % payée en espèces, l'erreur de la journée
 * (un billet de 10 € rendu en trop), le plafond de 500 € du tiroir.
 *
 * CE QUI A CHANGÉ. La journée moyenne venait du premier trimestre de l'arène (2 430,86 € hors taxes
 * par jour, 869,26 € comptés le soir) et le ticket de prix arrondis (74,40 €). Elle vient
 * maintenant de janvier : 2 575 € hors taxes par jour, 3 090 € TTC, 772,50 € en espèces, 922,50 €
 * attendus et 912,50 € comptés ; le ticket fait 72 € et la monnaie 28 €.
 */

/** Le fond de caisse du matin (le monde du cours). */
export const FOND_DE_CAISSE = FOND_DU_MONDE;

/** La part du chiffre d'affaires payée en espèces (le monde du cours). */
export const PART_EN_ESPECES = PART_DU_MONDE;

/** La course du curseur des clients avant le coffre : assez longue pour que le départ, au quart, ne tombe pas sur la réponse. */
export const CLIENTS_SUR_LE_CURSEUR = 15;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Le nom d'une coupure : « billet de 20 € », « pièce de 50 centimes ». */
export function nomDeLaCoupure(v: number, nombre: number): string {
  const s = nombre > 1 ? "s" : "";
  if (v >= 5) return `billet${s} de ${v} €`;
  if (v >= 1) return `pièce${s} de ${v} €`;
  const centimes = Math.round(v * 100);
  return `pièce${s} de ${centimes} centime${centimes > 1 ? "s" : ""}`;
}

/** « 1 billet de 20 €, 1 billet de 5 € et 1 pièce de 2 € ». */
export function ditLesCoupures(cs: readonly { valeur: number; nombre: number }[]): string {
  const morceaux = cs.map((x) => `${qte(x.nombre)} ${nomDeLaCoupure(x.valeur, x.nombre)}`);
  return morceaux.length > 1 ? `${morceaux.slice(0, -1).join(", ")} et ${morceaux.at(-1)}` : morceaux.join("");
}

/** Le tableau d'un tiroir compté, coupure par coupure. */
export function tableauDUnTiroir(titre: string, tiroir: readonly { valeur: number; nombre: number }[]): TableauDeDonnees {
  return {
    titre,
    colonnes: ["Nombre"],
    lignes: tiroir.map((x) => {
      const nom = nomDeLaCoupure(x.valeur, 2);
      return { libelle: nom.charAt(0).toUpperCase() + nom.slice(1), valeurs: [qte(x.nombre)] };
    }),
  };
}

/** Le ticket du client, la monnaie, puis la journée de janvier en caisse. */
export function caisseDuJour(c: Cas) {
  const f = ficheDe(c);
  return { ...ticketDuClient(f), jour: journeeEnCaisse(f) };
}

export function tableauDesPrix(c: Cas): TableauDeDonnees {
  return {
    titre: "Les prix affichés en rayon",
    colonnes: ["Prix affiché"],
    lignes: etiquettesDuRayon(ficheDe(c)).map((e) => ({ libelle: e.nom, valeurs: [eur(e.affiche)] })),
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

const tableauDuTiroir = (c: Cas) => tableauDUnTiroir("Ce que l'équipier compte dans le tiroir, le soir", caisseDuJour(c).jour.tiroir);

export const TENIR_LA_CAISSE: Chapitre = {
  code: "tenir-la-caisse",
  parcours: "cap-epc",
  palier: 1,
  blocs: ["CAP EPC · Bloc 3 · Conseiller et accompagner le client dans son parcours d'achat"],
  titre: "Tenir la caisse : le ticket, la monnaie et le fond de caisse",
  accroche:
    "Passer les articles, annoncer le total, rendre la monnaie sans se tromper. Ouvrir la caisse le matin, la compter le soir, trouver l'écart, et ne jamais laisser trop d'espèces dans le tiroir.",
  objectifs: [
    "Faire le total d'un ticket de caisse",
    "Rendre la monnaie sur un billet",
    "Calculer les espèces attendues le soir, avec le fond de caisse",
    "Compter la caisse et trouver l'écart",
    "Savoir quand vider le tiroir au coffre",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_MAGASIN,
    pourquoi: "ce chapitre tient la caisse de la boutique du cours, MAILLE & CO, où le client paie ses articles en partant.",
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
        "Les prix et les ventes sont ceux de la boutique en janvier. Le panier du client, son billet, le fond de caisse, la part payée en espèces et l'erreur de la journée sont des exemples du cours.",
      ],
      repere: () => "Monnaie à rendre = somme donnée − total du ticket.",
    },
    {
      id: "le-ticket",
      objectifs: [0],
      type: "montants",
      titre: "Le total du ticket",
      notions: ["average_basket"],
      tableau: tableauDuTicket,
      question: () => "Un client pose ses articles sur le comptoir. Calculez le montant de chaque ligne, puis le total du ticket.",
      champs: (c) => {
        const k = caisseDuJour(c);
        return [
          ...k.lignes.map((l) => ({ libelle: `Ligne « ${l.nom} »`, attendu: l.montant, calcul: `${qte(l.quantite)} × ${eur(l.prix)} = ${eur(l.montant)}` })),
          { libelle: "Total du ticket", attendu: k.total, calcul: `${k.lignes.map((l) => eur(l.montant)).join(" + ")} = ${eur(k.total)}` },
        ];
      },
      explication: (c) => [`Vous annoncez le total au client : ${eur(caisseDuJour(c).total)}. La TVA est déjà dans les prix affichés.`],
    },
    {
      id: "la-monnaie",
      objectifs: [1],
      type: "montants",
      titre: "La monnaie à rendre",
      notions: ["average_basket"],
      question: (c) => `Le client paie avec un billet de ${eur(caisseDuJour(c).billet)}. Calculez la monnaie à lui rendre.`,
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
      objectifs: [1],
      type: "choix",
      titre: "Les billets et les pièces à rendre",
      notions: ["average_basket"],
      question: (c) => `Vous devez rendre ${eur(caisseDuJour(c).rendu)}, avec le moins de pièces possible. Que donnez-vous au client ?`,
      options: (c) => {
        const k = caisseDuJour(c);
        return [
          { texte: ditLesCoupures(k.monnaie), juste: true, retour: `Oui : cela fait ${eur(k.rendu)}, le compte juste.` },
          { texte: ditLesCoupures(k.plus.coupures), juste: false, retour: `Non : cela fait ${eur(k.plus.montant)}. Vous rendez 10 € de trop, et il manquera 10 € dans la caisse ce soir.` },
          { texte: ditLesCoupures(k.moins.coupures), juste: false, retour: `Non : cela fait ${eur(k.moins.montant)}. Il manque ${eur(k.moins.oubli)} au client.` },
        ];
      },
    },
    {
      id: "la-journee",
      objectifs: [2],
      type: "montants",
      titre: "Le chiffre d'affaires du jour",
      notions: ["revenue"],
      question: (c) => {
        const j = caisseDuJour(c).jour;
        return `En ${j.mois}, la boutique vend en caisse ${qte(j.articlesDuMois)} articles, pour ${eur(j.chiffreDuMois)} hors taxes, en ${qte(j.jours)} jours. Calculez les articles vendus en un jour (à l'unité), puis le chiffre d'affaires hors taxes d'un jour (au centime).`;
      },
      champs: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          { libelle: "Articles vendus en un jour", attendu: j.articlesParJour, calcul: `${qte(j.articlesDuMois)} ÷ ${qte(j.jours)} = ${qte(j.articlesParJour)}, à l'unité`, tolerance: 1 },
          { libelle: "Chiffre d'affaires hors taxes d'un jour", attendu: j.htDuJour, calcul: `${eur(j.chiffreDuMois)} ÷ ${qte(j.jours)} = ${eur(j.htDuJour)}` },
        ];
      },
      explication: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          `Un jour moyen, la caisse voit passer ${qte(j.articlesParJour)} articles. Les commandes des comités d'entreprise (${eur(j.chiffreFacture)} hors taxes dans le mois) ne passent pas en caisse : elles sont facturées et payées plus tard.`,
        ];
      },
    },
    {
      id: "les-especes",
      objectifs: [2],
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
        return [`Les clients ont payé ${eur(j.ttcDuJour)} dans la journée, dont ${eur(j.especes)} en billets et en pièces. Ces espèces sont dans le tiroir.`];
      },
    },
    {
      id: "le-fond-de-caisse",
      objectifs: [2],
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
      explication: (c) => [`Le soir, le tiroir doit contenir ${eur(caisseDuJour(c).jour.attendu)}. Le fond de caisse n'est pas une vente : il était là avant le premier client.`],
    },
    {
      id: "le-comptage",
      objectifs: [3],
      type: "montants",
      titre: "Le comptage du soir",
      notions: ["net_treasury"],
      tableau: tableauDuTiroir,
      question: (c) => `Le soir, vous comptez le tiroir, billet par billet, pièce par pièce. Calculez le total compté, puis l'écart avec les ${eur(caisseDuJour(c).jour.attendu)} attendus (négatif s'il manque de l'argent).`,
      champs: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          { libelle: "Total compté dans le tiroir", attendu: j.compte, calcul: `${j.tiroir.map((x) => `${qte(x.nombre)} × ${eur(x.valeur)}`).join(" + ")} = ${eur(j.compte)}` },
          { libelle: "Écart de caisse", attendu: j.ecart, calcul: `${eur(j.compte)} − ${eur(j.attendu)} = ${eur(j.ecart)}` },
        ];
      },
      explication: (c) => {
        const j = caisseDuJour(c).jour;
        return [j.ecart < 0 ? `Il manque ${eur(-j.ecart)} dans la caisse. Dans le cas du cours, c'est un billet de 10 € rendu en trop à un client.` : `Il y a ${eur(j.ecart)} de trop dans la caisse.`];
      },
    },
    {
      id: "que-faire-de-l-ecart",
      objectifs: [3],
      type: "choix",
      titre: "Ce que l'équipier fait de l'écart",
      question: (c) => {
        const j = caisseDuJour(c).jour;
        return `Le tiroir compte ${eur(j.compte)} au lieu de ${eur(j.attendu)}. Que faites-vous ?`;
      },
      options: (c) => {
        const j = caisseDuJour(c).jour;
        return [
          { texte: "Noter l'écart et prévenir le responsable", juste: true, retour: `Oui : l'écart de ${eur(j.ecart)} s'écrit sur la feuille de caisse, et le responsable le sait. Une caisse ne se corrige pas en cachette.` },
          { texte: "Remettre l'argent qui manque de sa poche", juste: false, retour: "Non : l'écart disparaît, mais personne ne saura qu'une erreur a eu lieu. Elle se reproduira." },
          { texte: "Prendre l'écart sur le fond de caisse", juste: false, retour: `Non : le fond de caisse doit rester de ${eur(FOND_DE_CAISSE)} pour le lendemain. L'écart s'écrit, il ne se cache pas.` },
        ];
      },
    },
    {
      id: "avant-le-coffre",
      objectifs: [4],
      type: "curseur",
      titre: "Avant de vider le tiroir",
      notions: ["net_treasury"],
      question: (c) => {
        const j = caisseDuJour(c).jour;
        return `Par sécurité, le tiroir ne doit jamais garder plus de ${eur(PLAFOND_DU_TIROIR)}. Il part le matin avec ${eur(FOND_DE_CAISSE)}, et un client qui paie en espèces laisse en moyenne ${eur(j.ticketMoyenTtc)} TTC. Faites varier les clients payés en espèces depuis l'ouverture, et placez le curseur sur le plus grand nombre de clients que le tiroir accepte sans dépasser son plafond.`;
      },
      grandeur: () => ({ libelle: "Clients payés en espèces depuis l'ouverture", unite: "clients" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: clientsAvantLeCoffre(ficheDe(c)), min: 0, max: CLIENTS_SUR_LE_CURSEUR }),
      zones: ["Le tiroir reste sous son plafond", "Le tiroir dépasse son plafond"],
      rates: () => ({
        dessous: "Le tiroir accepte encore un client : cherchez le plus grand nombre.",
        dessus: "Avec autant de clients, le tiroir dépasse déjà son plafond : il fallait passer au coffre avant.",
      }),
      montrer: "Montrer le nombre de clients",
      lecture: (c, q) => [
        { libelle: "Fond de caisse", montant: FOND_DE_CAISSE },
        { libelle: "Espèces encaissées", montant: Math.round((tiroirApres(ficheDe(c), q) - FOND_DE_CAISSE) * 100) / 100 },
        { libelle: "Espèces dans le tiroir", montant: tiroirApres(ficheDe(c), q), fort: true },
        { libelle: "Plafond du tiroir", montant: PLAFOND_DU_TIROIR },
      ],
      droites: (c) => ({ produit: () => PLAFOND_DU_TIROIR, cout: (q) => tiroirApres(ficheDe(c), q), libelles: ["Plafond du tiroir", "Espèces dans le tiroir"] }),
      explication: (c) => {
        const q = clientsAvantLeCoffre(ficheDe(c));
        return [
          `Après ${qte(q)} clients payés en espèces, le tiroir contient ${eur(tiroirApres(ficheDe(c), q))} ; un client de plus, et il passerait à ${eur(tiroirApres(ficheDe(c), q + 1))}, au-dessus des ${eur(PLAFOND_DU_TIROIR)}. Le responsable passe alors prendre l'excédent pour le coffre, et laisse le fond de caisse.`,
          "Moins il y a d'espèces dans le tiroir, moins une erreur ou un vol coûte cher.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-coffre",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire des passages au coffre",
      notions: ["net_treasury"],
      question: (c) => {
        const j = caisseDuJour(c).jour;
        return `Dans la journée, la caisse encaisse ${eur(j.especes)} en espèces, régulièrement. À chaque passage au coffre, le responsable prend tout ce qui dépasse le fond de caisse. Faites varier le nombre de passages répartis dans la journée, et relevez le défi.`;
      },
      leviers: () => [{ code: "passages", libelle: "Passages au coffre dans la journée", unite: "passages", min: PASSAGES_AU_COFFRE.min, max: PASSAGES_AU_COFFRE.max, pas: 1, depart: 0 }],
      lecture: (c, p) => {
        const x = journeeAvecLeCoffre(ficheDe(c), p.passages!);
        return [
          { libelle: "Espèces encaissées dans la journée", montant: x.especes },
          { libelle: "Espèces encaissées d'un passage au coffre au suivant", montant: x.parPeriode },
          { libelle: "Le tiroir au plus plein", montant: x.plusPlein, reference: journeeAvecLeCoffre(ficheDe(c), 0).plusPlein, fort: true },
          { libelle: "Plafond du tiroir", montant: PLAFOND_DU_TIROIR },
        ];
      },
      graphique: (c) => ({
        levier: "passages",
        courbes: [
          { libelle: "Le tiroir au plus plein", valeur: (p) => journeeAvecLeCoffre(ficheDe(c), p.passages!).plusPlein },
          { libelle: "Plafond du tiroir", valeur: () => PLAFOND_DU_TIROIR },
        ],
      }),
      defi: (c) => {
        const f = ficheDe(c);
        const juste = passagesNecessaires(f);
        return {
          consigne: `Trouvez le plus petit nombre de passages au coffre qui garde le tiroir sous ${eur(PLAFOND_DU_TIROIR)} toute la journée : chaque passage ferme la caisse quelques minutes.`,
          atteint: (p) => p.passages === juste,
          indice: (p) => {
            const x = journeeAvecLeCoffre(f, p.passages!);
            return x.sousLePlafond
              ? `Le tiroir reste sous le plafond (${eur(x.plusPlein)} au plus), mais un passage de moins suffirait-il ? Chaque passage ferme la caisse.`
              : `Le tiroir monte jusqu'à ${eur(x.plusPlein)}, au-dessus des ${eur(PLAFOND_DU_TIROIR)} : il faut passer au coffre plus souvent.`;
          },
          solution: { passages: juste },
        };
      },
      explication: (c, p) => {
        const f = ficheDe(c);
        const x = journeeAvecLeCoffre(f, p.passages!);
        const moins = journeeAvecLeCoffre(f, Math.max(0, p.passages! - 1));
        return [
          `Défi relevé : avec ${qte(x.passages)} passages, le tiroir ne dépasse jamais ${eur(x.plusPlein)}. Avec un passage de moins, il monterait à ${eur(moins.plusPlein)}, au-dessus du plafond.`,
          "Le fond de caisse reste toujours dans le tiroir : c'est l'excédent qui part au coffre, jamais la monnaie dont l'équipier a besoin pour rendre.",
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
          `Le soir, vous gardez le fond de caisse de ${eur(FOND_DE_CAISSE)} pour le lendemain. Le reste, ${eur(k.jour.auCoffre)}, va au responsable, avec la feuille de caisse et l'écart noté. Dans l'arène, les chiffres de votre entreprise seront différents : les gestes de la caisse seront les mêmes.`,
        ];
      },
      repere: () => "Espèces attendues le soir = fond de caisse + espèces encaissées. Écart = compté − attendu.",
    },
  ],
};
