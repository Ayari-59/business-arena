import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_ECARTS, ecartDit } from "../../chapitres/le-cout-preetabli-et-les-budgets";
import { ecartsDirects, tableauDeLaProduction } from "../../chapitres/les-ecarts-sur-charges-directes";
import type { EtapeCurseur } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES ÉCARTS SUR CHARGES DIRECTES » : LE FOURNISSEUR OU L'ATELIER
 * (contrôle de gestion, palier 4).
 *
 * La responsable des achats pense que tout le surcoût matière du trimestre vient de la hausse du
 * fournisseur, et veut en changer. L'élève refait seul les calculs du chapitre : les kilos
 * préétablis de la production réelle et l'écart global sur matière, l'écart sur prix et l'écart sur
 * quantité, puis il croise les deux (l'écart mixte, la part de la hausse qui porte sur les kilos
 * gâchés) et calcule à rebours le prix du kilo qui effacerait l'écart global : il faudrait payer
 * moins que le standard pour couvrir le gaspillage. Il rend un jugement : quel levier, et qui
 * d'autre doit agir.
 *
 * Un curseur (« prix-au-curseur ») fait varier le prix du kilo avant le calcul à rebours : l'élève
 * voit que l'écart sur quantité ne bouge pas, quel que soit le prix obtenu.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : tous les chiffres viennent du
 * modèle du contrôle budgétaire, par `ecartsDirects`. La cause racontée par la responsable (une
 * hausse du fournisseur) est une hypothèse de l'histoire ; le modèle ne connaît que les écarts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Le dossier de la responsable des achats. */
export function fournisseurOuAtelier(c: Pick<Cas, "code">) {
  const d = ecartsDirects(c);
  const e = d.e;
  /** Le prix du kilo qui, sur les kilos réellement consommés, ramènerait le coût réel au coût préétabli. */
  const prixQuiEfface = auCentime(e.preetabliDuReel.matiere / d.r.matiere.kilos);
  return {
    ...d,
    partDuPrix: auDixieme((e.matiere.prix / e.matiere.global) * 100),
    prixQuiEfface,
    baisseNecessaire: auCentime(d.r.matiere.prixDuKilo - prixQuiEfface),
    /** Le prix seul n'explique pas tout l'écart : l'atelier a sa part. */
    lesDeux: e.matiere.prix > 0 && e.matiere.quantite > 0,
  };
}

/** Le prix du kilo en centimes : le curseur est entier, le coût réel affine dans ce prix. */
const enCentimes = (x: number) => Math.round(x * 100);

/** L'expérience du cas : le prix du kilo varie, les kilos consommés ne bougent pas. */
export function prixAuCurseur(c: Pick<Cas, "code">) {
  const x = fournisseurOuAtelier(c);
  const kilos = x.r.matiere.kilos;
  const reel = (centimes: number) => auCentime((kilos * centimes) / 100);
  return {
    x,
    reel,
    prix: (centimes: number) => auCentime(((centimes - enCentimes(x.f.prixStandardDuKilo)) * kilos) / 100),
    auPlus: Math.floor((x.e.preetabliDuReel.matiere * 100) / kilos + 1e-9),
    min: enCentimes(x.f.prixStandardDuKilo) - 100,
    max: enCentimes(x.r.matiere.prixDuKilo) + 20,
  };
}

const LE_PRIX_AU_CURSEUR: EtapeCurseur = {
  id: "prix-au-curseur",
  type: "curseur",
  titre: "Faites varier le prix du kilo",
  notions: ["material_price_variance"],
  question: (c) => {
    const p = prixAuCurseur(c);
    return `Rejouez le trimestre avec un autre prix du kilo, pour les mêmes ${qte(p.x.r.matiere.kilos)} kilos consommés. Le curseur donne le prix en centimes. Placez-le sur le prix le plus haut qui garde le coût réel de la matière sous son coût préétabli de ${eur(p.x.e.preetabliDuReel.matiere)}.`;
  },
  grandeur: () => ({ libelle: "Prix du kilo", unite: "centimes" }),
  sens: "plus-grande",
  cible: (c) => {
    const p = prixAuCurseur(c);
    return { attendu: p.auPlus, min: p.min, max: p.max };
  },
  lecture: (c, centimes) => {
    const p = prixAuCurseur(c);
    const e = p.x.e;
    return [
      { libelle: "Coût réel de la matière", montant: p.reel(centimes) },
      { libelle: "Coût préétabli de la matière", montant: e.preetabliDuReel.matiere },
      { libelle: "Écart sur prix", montant: p.prix(centimes) },
      { libelle: "Écart sur quantité", montant: e.matiere.quantite },
      { libelle: "Écart global sur matière", montant: auCentime(p.reel(centimes) - e.preetabliDuReel.matiere), fort: true },
    ];
  },
  droites: (c) => {
    const p = prixAuCurseur(c);
    return { produit: () => p.x.e.preetabliDuReel.matiere, cout: (centimes) => p.reel(centimes), libelles: ["Coût préétabli de la matière", "Coût réel de la matière"] };
  },
  zones: ["Le coût préétabli tient", "Le coût préétabli est dépassé"],
  rates: () => ({
    dessous: "À ce prix, le coût préétabli tient encore : cherchez le prix le plus haut.",
    dessus: "À ce prix, le coût réel dépasse encore le coût préétabli.",
  }),
  montrer: "Montrer le prix",
  explication: (c) => {
    const p = prixAuCurseur(c);
    return [
      `Le coût préétabli ne tient qu'à ${qte(p.auPlus)} centimes le kilo au plus, soit ${eur(p.auPlus / 100)}. Même au prix standard de ${eur(p.x.f.prixStandardDuKilo)}, l'écart sur quantité de ${eur(p.x.e.matiere.quantite)} reste : cette ligne de la lecture ne bouge pas quand le prix bouge.`,
    ];
  },
};

export const LE_FOURNISSEUR_OU_L_ATELIER: Situation = {
  code: "le-fournisseur-ou-l-atelier",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["les-ecarts-sur-charges-directes"],
  commanditaire: "La responsable des achats",
  titre: "Le fournisseur ou l'atelier",
  accroche:
    "La responsable des achats est sûre que tout le surcoût matière vient de la hausse du fournisseur, et veut en changer. Décomposez l'écart, croisez prix et quantité, et dites-lui quel levier actionner.",
  objectifs: [
    "Calculer l'écart global sur matière de la production réelle",
    "Le décomposer en écart sur prix et écart sur quantité, et isoler l'écart mixte",
    "Retrouver à rebours le prix du kilo qui effacerait l'écart",
    "Répondre à la responsable des achats, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_ECARTS,
    pourquoi: "ce cas reprend le chapitre « Les écarts sur charges directes », qui se joue à l'usine de NOVA.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La responsable des achats et son fournisseur",
      tableau: tableauDeLaProduction,
      texte: (c) => {
        const x = fournisseurOuAtelier(c);
        return [
          `« Le fournisseur a monté son kilo de ${eur(x.f.prixStandardDuKilo)}, notre prix standard, à ${eur(x.r.matiere.prixDuKilo)}. Le surcoût matière du trimestre vient tout entier de là : je veux renégocier, ou changer de fournisseur. Vérifiez avant que j'appelle, et dites-moi combien il faudrait obtenir du fournisseur pour effacer ce surcoût. »`,
          `L'atelier a consommé ${qte(x.r.matiere.kilos)} kilos de matière, tous achetés à ${eur(x.r.matiere.prixDuKilo)}, pour la production du tableau. Pas de cours cette fois : les calculs sont ceux du chapitre. Les écarts se donnent réel moins prévu, négatifs quand ils sont favorables.`,
        ];
      },
      repere: () => "À rendre : l'écart global sur matière, sa décomposition en prix et quantité, l'écart mixte, le prix du kilo qui effacerait l'écart, et votre réponse.",
    },
    {
      id: "global",
      type: "montants",
      titre: "L'écart global sur matière",
      notions: ["cost_variance"],
      tableau: tableauDeLaProduction,
      question: () => "Calculez les kilos préétablis de la production réelle, son coût préétabli de matière, puis l'écart global sur matière.",
      champs: (c) => {
        const x = fournisseurOuAtelier(c);
        const e = x.e;
        return [
          {
            libelle: "Kilos préétablis de la production réelle",
            attendu: e.preetabliDuReel.kilos,
            calcul: `${x.modeles.map((m) => `${qte(m.reelle)} × ${qte(m.m.matiereParUnite)}`).join(" + ")} = ${qte(e.preetabliDuReel.kilos)} kg`,
          },
          { libelle: "Coût préétabli de la matière", attendu: e.preetabliDuReel.matiere, calcul: `${qte(e.preetabliDuReel.kilos)} × ${eur(x.f.prixStandardDuKilo)} = ${eur(e.preetabliDuReel.matiere)}` },
          {
            libelle: "Écart global sur matière",
            attendu: e.matiere.global,
            calcul: `${qte(x.r.matiere.kilos)} × ${eur(x.r.matiere.prixDuKilo)} − ${eur(e.preetabliDuReel.matiere)} = ${eur(e.reel.matiere)} − ${eur(e.preetabliDuReel.matiere)} = ${eur(e.matiere.global)}`,
          },
        ];
      },
      explication: (c) => {
        const x = fournisseurOuAtelier(c);
        return [`Le surcoût matière est de ${ecartDit(x.e.matiere.global)}. Reste à savoir ce qui revient au prix du kilo.`];
      },
    },
    {
      id: "decomposition",
      type: "montants",
      titre: "Le prix et la quantité",
      notions: ["material_price_variance", "efficiency_variance"],
      question: () => "Décomposez l'écart global en écart sur prix et écart sur quantité, puis calculez, au dixième, la part de l'écart sur prix dans l'écart global.",
      champs: (c) => {
        const x = fournisseurOuAtelier(c);
        const e = x.e;
        return [
          { libelle: "Écart sur prix de la matière", attendu: e.matiere.prix, calcul: `(${eur(x.r.matiere.prixDuKilo)} − ${eur(x.f.prixStandardDuKilo)}) × ${qte(x.r.matiere.kilos)} = ${eur(e.matiere.prix)}` },
          {
            libelle: "Écart sur quantité de matière",
            attendu: e.matiere.quantite,
            calcul: `(${qte(x.r.matiere.kilos)} − ${qte(e.preetabliDuReel.kilos)}) × ${eur(x.f.prixStandardDuKilo)} = ${eur(e.matiere.quantite)}`,
          },
          { libelle: "Part de l'écart sur prix (%)", attendu: x.partDuPrix, calcul: `${eur(e.matiere.prix)} ÷ ${eur(e.matiere.global)} × 100 = ${pct(x.partDuPrix)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const x = fournisseurOuAtelier(c);
        return [
          `Le prix du kilo explique ${pct(x.partDuPrix)} de l'écart, les ${qte(x.dKilos)} kilos consommés en trop le reste, ${ecartDit(x.e.matiere.quantite)}.`,
        ];
      },
    },
    {
      id: "mixte",
      type: "montants",
      titre: "La hausse sur les kilos gâchés",
      notions: ["material_price_variance"],
      question: (c) => {
        const x = fournisseurOuAtelier(c);
        return `La responsable objecte : « Votre écart sur prix compte aussi la hausse sur les ${qte(x.dKilos)} kilos que l'atelier a gâchés. » Séparez l'écart sur prix pur, sur les seuls kilos préétablis, et l'écart mixte, puis dites ce que la hausse aurait coûté si l'atelier avait tenu son standard.`;
      },
      champs: (c) => {
        const x = fournisseurOuAtelier(c);
        const e = x.e;
        return [
          { libelle: "Écart sur prix pur", attendu: x.prixPur, calcul: `${eur(x.dPrix)} × ${qte(e.preetabliDuReel.kilos)} = ${eur(x.prixPur)}` },
          { libelle: "Écart mixte", attendu: x.mixte, calcul: `${eur(x.dPrix)} × ${qte(x.dKilos)} = ${eur(x.mixte)}` },
          {
            libelle: "Surcoût matière si l'atelier avait tenu son standard",
            attendu: x.prixPur,
            calcul: `${qte(e.preetabliDuReel.kilos)} × ${eur(x.r.matiere.prixDuKilo)} − ${eur(e.preetabliDuReel.matiere)} = ${eur(x.prixPur)}`,
          },
        ];
      },
      explication: (c) => {
        const x = fournisseurOuAtelier(c);
        return [
          `L'objection est juste sur ${eur(x.mixte)} seulement : c'est l'écart mixte, que le plan comptable laisse dans l'écart sur prix, au compte des achats. Même en le retirant, l'atelier reste comptable de ${eur(x.e.matiere.quantite)} au prix standard.`,
        ];
      },
    },
    LE_PRIX_AU_CURSEUR,
    {
      id: "a-rebours",
      type: "montants",
      titre: "Ce qu'il faudrait obtenir du fournisseur",
      notions: ["material_price_variance", "efficiency_variance"],
      question: () =>
        "Avec les mêmes kilos consommés, à quel prix du kilo le coût réel de la matière retomberait-il sur son coût préétabli ? Donnez ce prix au centime, puis la baisse à obtenir sur le prix payé.",
      champs: (c) => {
        const x = fournisseurOuAtelier(c);
        return [
          { libelle: "Prix du kilo qui effacerait l'écart global", attendu: x.prixQuiEfface, calcul: `${eur(x.e.preetabliDuReel.matiere)} ÷ ${qte(x.r.matiere.kilos)} ≈ ${eur(x.prixQuiEfface)}, au centime` },
          { libelle: "Baisse à obtenir sur le prix payé", attendu: x.baisseNecessaire, calcul: `${eur(x.r.matiere.prixDuKilo)} − ${eur(x.prixQuiEfface)} = ${eur(x.baisseNecessaire)}` },
        ];
      },
      explication: (c) => {
        const x = fournisseurOuAtelier(c);
        return [
          `Pour effacer l'écart par le seul prix, il faudrait payer le kilo ${eur(x.prixQuiEfface)}, ${eur(auCentime(x.f.prixStandardDuKilo - x.prixQuiEfface))} sous le standard de ${eur(x.f.prixStandardDuKilo)} : le fournisseur paierait alors le gaspillage de l'atelier, qui ne se verrait plus.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable des achats",
      notions: ["material_price_variance", "efficiency_variance"],
      question: () => "Quelle réponse rendez-vous à la responsable des achats ?",
      options: (c) => {
        const x = fournisseurOuAtelier(c);
        const e = x.e;
        const chiffres = `Sur ${ecartDit(e.matiere.global)}, l'écart sur prix pèse ${eur(e.matiere.prix)} (${pct(x.partDuPrix)}), dont ${eur(x.mixte)} d'écart mixte, et l'écart sur quantité ${eur(e.matiere.quantite)}.`;
        return [
          {
            texte: "Renégociez, mais l'atelier doit agir aussi : ses kilos en trop pèsent autant",
            juste: x.lesDeux,
            retour: x.lesDeux
              ? `Oui. ${chiffres} Le prix relève des achats, les kilos consommés relèvent de l'atelier : changer de fournisseur ne réglera pas les ${qte(x.dKilos)} kilos en trop.`
              : `Non. ${chiffres}`,
          },
          {
            texte: "Changez de fournisseur : tout le surcoût matière vient de sa hausse du kilo",
            juste: e.matiere.quantite <= 0,
            retour: e.matiere.quantite <= 0 ? `Oui. ${chiffres}` : `Non : c'est oublier les kilos consommés en trop. ${chiffres}`,
          },
          {
            texte: "N'appelez pas : l'écart sur prix vient lui aussi des kilos gâchés par l'atelier",
            juste: false,
            retour: `Non : seul l'écart mixte, ${eur(x.mixte)}, porte sur les kilos gâchés ; la hausse sur les kilos préétablis, ${eur(x.prixPur)}, est bien celle du fournisseur. ${chiffres}`,
          },
          {
            texte: `Obtenez ${eur(x.baisseNecessaire)} de baisse du kilo : le prix effacera tout l'écart, sans toucher l'atelier`,
            juste: false,
            retour: `Non : ce serait un prix de ${eur(x.prixQuiEfface)}, sous le standard, qui ferait payer au fournisseur le gaspillage de l'atelier et le cacherait au contrôle. ${chiffres}`,
          },
        ];
      },
    },
  ],
};
