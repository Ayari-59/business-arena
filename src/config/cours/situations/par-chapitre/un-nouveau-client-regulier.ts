import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_COUT_COMPLET, coutCompletDeJanvier } from "../../chapitres/cout-complet";
import type { CentrePrincipal } from "../../monde/nova-gestion";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « COÛT COMPLET ET CENTRES D'ANALYSE » : UN NOUVEAU CLIENT RÉGULIER
 * (contrôle de gestion, palier 3).
 *
 * Une chaîne de magasins prendrait chaque mois des enceintes en plus, à un prix plus bas que celui des
 * clients d'aujourd'hui. Le local, l'équipe et la ligne suffisent : les charges indirectes ne bougent
 * pas. Le directeur commercial compte refuser, parce que le prix proposé est sous le coût de revient
 * de janvier. L'élève refait seul le chemin du chapitre au nouveau volume (les unités d'œuvre, la
 * chaîne des coûts, le coût de revient d'une enceinte), cherche au curseur le volume à partir duquel
 * le prix du client couvre le coût complet, puis croise les deux lectures : celle du coût de revient
 * de janvier, qui fait croire à une perte, et celle du résultat du mois, qui monte. La réponse
 * demande un jugement : accepter, et à quelle condition.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : les
 * centres d'analyse, après répartition, sont ceux de `coutCompletDeJanvier` ; leurs charges ne
 * bougent pas avec les ventes.
 */

/** Les ventes en plus qu'apporterait le client : 20 % des enceintes de janvier, chaque mois (hypothèse du cours). */
export const HAUSSE_DES_VENTES = 0.2;

/** Le prix hors taxes que propose la chaîne de magasins, par enceinte (hypothèse du cours). */
export const PRIX_DU_NOUVEAU_CLIENT = 55;

/** Les bornes du curseur du volume, en enceintes par mois. */
export const VOLUME_DU_CURSEUR = { min: 1_500, max: 2_200 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);
const PRINCIPAUX: readonly CentrePrincipal[] = ["approvisionnement", "production", "distribution"];

export type Verdict = "accepter" | "refuser";

/** Les chiffres de la réponse, calculés une fois sur la fiche. */
export function nouveauClientRegulier(c: Pick<Cas, "code">) {
  const x = coutCompletDeJanvier(c);
  const { m, k, r, cles, coutVariableUnitaire, coutFige } = x;
  const duClient = Math.round(m.quantite * HAUSSE_DES_VENTES);
  const quantite = m.quantite + duClient;
  const achats = auCentime(quantite * m.coutVariable.composants);
  const autres = auCentime(quantite * m.coutVariable.autres);
  const chiffreDAffaires = auCentime(k.chiffreDAffaires + duClient * PRIX_DU_NOUVEAU_CLIENT);
  // L'activité de chaque centre principal dans son unité d'œuvre, au nouveau volume.
  const valeur = { achats, quantite, chiffreDAffaires };
  const activite = Object.fromEntries(PRINCIPAUX.map((p) => [p, valeur[cles.unitesDOeuvre[p].nature] / cles.unitesDOeuvre[p].assiette])) as Record<CentrePrincipal, number>;
  const uo = Object.fromEntries(PRINCIPAUX.map((p) => [p, auCentime(r.principaux[p] / activite[p])])) as Record<CentrePrincipal, number>;
  const coutDAchat = auCentime(achats + r.principaux.approvisionnement);
  const coutDeProduction = auCentime(coutDAchat + autres + r.principaux.production);
  const coutDeRevient = auCentime(coutDeProduction + r.principaux.distribution);
  const unitaire = auCentime(coutDeRevient / quantite);
  const resultat = auCentime(chiffreDAffaires - coutDeRevient);
  const apport = auCentime(resultat - k.resultat);
  // L'erreur du directeur : chiffrer le client au coût de revient de janvier.
  const perteAuCoutFige = auCentime((PRIX_DU_NOUVEAU_CLIENT - coutFige) * duClient);
  // Le volume à partir duquel le prix du client couvre le coût complet d'une enceinte.
  const volumeQuiCouvre = plafond(r.total / (PRIX_DU_NOUVEAU_CLIENT - coutVariableUnitaire));
  // La condition : si le prix du client gagnait les clients d'aujourd'hui.
  const siLePrixSEtend = auCentime((m.prix - PRIX_DU_NOUVEAU_CLIENT) * m.quantite);
  const verdict: Verdict = apport > 0 ? "accepter" : "refuser";
  return {
    x,
    duClient,
    nouvelle: { quantite, achats, autres, chiffreDAffaires, activite, uo, coutDAchat, coutDeProduction, coutDeRevient, unitaire },
    resultat,
    apport,
    perteAuCoutFige,
    volumeQuiCouvre,
    siLePrixSEtend,
    verdict,
  };
}

export const UN_NOUVEAU_CLIENT_REGULIER: Situation = {
  code: "un-nouveau-client-regulier",
  parcours: "controle-de-gestion",
  palier: 3,
  blocs: [],
  reprend: ["cout-complet"],
  commanditaire: "Le directeur commercial",
  titre: "Un nouveau client régulier",
  accroche:
    "Une chaîne de magasins prendrait des enceintes chaque mois, à un prix sous le coût de revient de janvier. Le directeur commercial veut refuser : a-t-il raison ?",
  objectifs: [
    "Calculer le coût des unités d'œuvre et la chaîne des coûts à un nouveau volume d'activité",
    "Voir comment le coût de revient d'une unité dépend des quantités",
    "Croiser le coût de revient et le résultat du mois pour juger une commande",
    "Rendre au directeur commercial une réponse chiffrée, et sa condition",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_COUT_COMPLET,
    pourquoi: "ce cas reprend le chapitre « Coût complet et centres d'analyse », qui se calcule sur le mois de janvier de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur commercial",
      texte: (c) => {
        const n = nouveauClientRegulier(c);
        const { f, coutFige } = n.x;
        return [
          `« Une chaîne de magasins nous prendrait ${qte(n.duClient)} ${f.unites} par mois, chaque mois, à ${eur(PRIX_DU_NOUVEAU_CLIENT)} hors taxes. Le local, l'équipe et la ligne suffisent : les charges indirectes ne bougeront pas. Mais notre coût de revient est de ${eur(coutFige)} : à ${eur(PRIX_DU_NOUVEAU_CLIENT)}, nous vendrions à perte, et je compte refuser. Montrez-moi si j'ai tort. »`,
          "Pas de cours cette fois : vous avez les chiffres du mois et les centres déjà répartis, et la méthode est celle du chapitre. À vous d'en trouver l'ordre.",
        ];
      },
      tableau: (c) => {
        const n = nouveauClientRegulier(c);
        const { f, m, r, cles } = n.x;
        return {
          titre: `Les chiffres du mois · ${f.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Prix de vente aux clients d'aujourd'hui, hors taxes", valeurs: [eur(m.prix)] },
            { libelle: `${f.unites.charAt(0).toUpperCase()}${f.unites.slice(1)} vendues aux clients d'aujourd'hui`, valeurs: [qte(m.quantite)] },
            { libelle: `Composants d'une ${f.unite}`, valeurs: [eur(m.coutVariable.composants)] },
            { libelle: `Autres charges directes d'une ${f.unite} (${m.autresCoutsVariables})`, valeurs: [eur(m.coutVariable.autres)] },
            ...PRINCIPAUX.map((p) => ({ libelle: `Centre ${p}, après répartition (unité d'œuvre : ${cles.unitesDOeuvre[p].libelle})`, valeurs: [eur(r.principaux[p])] })),
            { libelle: `${f.unites.charAt(0).toUpperCase()}${f.unites.slice(1)} du nouveau client, par mois`, valeurs: [qte(n.duClient)] },
            { libelle: "Prix proposé par le nouveau client, hors taxes", valeurs: [eur(PRIX_DU_NOUVEAU_CLIENT)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le coût des unités d'œuvre au nouveau volume, la chaîne des coûts, le coût de revient d'une enceinte, ce que le client change au résultat du mois, et votre réponse.",
    },
    {
      id: "unites-d-oeuvre",
      type: "montants",
      titre: "Les unités d'œuvre au nouveau volume",
      notions: ["full_unit_cost"],
      question: () =>
        "Avec le nouveau client, combien d'unités le mois compte-t-il ? Calculez ensuite le coût de chaque unité d'œuvre à ce volume, au centime : les centres gardent les mêmes charges, mais pas la même activité.",
      champs: (c) => {
        const n = nouveauClientRegulier(c);
        const { m, r } = n.x;
        const v = n.nouvelle;
        return [
          { libelle: "Unités vendues avec le nouveau client", attendu: v.quantite, calcul: `${qte(m.quantite)} + ${qte(n.duClient)} = ${qte(v.quantite)}` },
          {
            libelle: "Approvisionnement : coût pour 100 € d'achats",
            attendu: v.uo.approvisionnement,
            tolerance: 0.01,
            calcul: `${eur(r.principaux.approvisionnement)} ÷ (${qte(v.quantite)} × ${eur(m.coutVariable.composants)} ÷ 100) = ${eur(r.principaux.approvisionnement)} ÷ ${qte(v.activite.approvisionnement)} = ${eur(v.uo.approvisionnement)}`,
          },
          { libelle: "Production : coût d'une unité", attendu: v.uo.production, tolerance: 0.01, calcul: `${eur(r.principaux.production)} ÷ ${qte(v.quantite)} = ${eur(v.uo.production)}` },
          {
            libelle: "Distribution : coût pour 100 € de chiffre d'affaires",
            attendu: v.uo.distribution,
            tolerance: 0.01,
            calcul: `${eur(r.principaux.distribution)} ÷ ((${qte(m.quantite)} × ${eur(m.prix)} + ${qte(n.duClient)} × ${eur(PRIX_DU_NOUVEAU_CLIENT)}) ÷ 100) = ${eur(r.principaux.distribution)} ÷ ${qte(v.activite.distribution)} = ${eur(v.uo.distribution)}`,
          },
        ];
      },
      explication: (c) => {
        const n = nouveauClientRegulier(c);
        return [
          `Les charges des centres ne bougent pas, mais elles se partagent sur plus d'activité : l'unité d'œuvre de production passe de ${eur(n.x.uo.production)} à ${eur(n.nouvelle.uo.production)}. La distribution baisse un peu moins que les autres : le client paie moins cher, son chiffre d'affaires pèse moins que ses unités.`,
        ];
      },
    },
    {
      id: "chaine-des-couts",
      type: "montants",
      titre: "La chaîne des coûts au nouveau volume",
      notions: ["full_unit_cost"],
      question: () =>
        "Remontez la chaîne des coûts du mois avec le nouveau client : le coût d'achat, le coût de production, le coût de revient, puis le coût de revient d'une unité.",
      champs: (c) => {
        const n = nouveauClientRegulier(c);
        const { m, r } = n.x;
        const v = n.nouvelle;
        return [
          { libelle: "Coût d'achat", attendu: v.coutDAchat, tolerance: 0.05, calcul: `${qte(v.quantite)} × ${eur(m.coutVariable.composants)} + ${eur(r.principaux.approvisionnement)} = ${eur(v.achats)} + ${eur(r.principaux.approvisionnement)} = ${eur(v.coutDAchat)}` },
          {
            libelle: "Coût de production",
            attendu: v.coutDeProduction,
            tolerance: 0.05,
            calcul: `${eur(v.coutDAchat)} + ${qte(v.quantite)} × ${eur(m.coutVariable.autres)} + ${eur(r.principaux.production)} = ${eur(v.coutDAchat)} + ${eur(v.autres)} + ${eur(r.principaux.production)} = ${eur(v.coutDeProduction)}`,
          },
          { libelle: "Coût de revient", attendu: v.coutDeRevient, tolerance: 0.05, calcul: `${eur(v.coutDeProduction)} + ${eur(r.principaux.distribution)} = ${eur(v.coutDeRevient)}` },
          { libelle: "Coût de revient d'une unité", attendu: v.unitaire, tolerance: 0.01, calcul: `${eur(v.coutDeRevient)} ÷ ${qte(v.quantite)} = ${eur(v.unitaire)}` },
        ];
      },
      explication: (c) => {
        const n = nouveauClientRegulier(c);
        return [
          `Le coût de revient du mois monte, de ${eur(n.x.k.coutDeRevient)} à ${eur(n.nouvelle.coutDeRevient)}, mais celui d'une unité baisse de ${eur(n.x.coutFige)} à ${eur(n.nouvelle.unitaire)} : les charges directes suivent les ventes, les charges indirectes se partagent sur plus d'unités. À ce volume, ${eur(PRIX_DU_NOUVEAU_CLIENT)} ${n.nouvelle.unitaire <= PRIX_DU_NOUVEAU_CLIENT ? "couvre" : "ne couvre pas"} le coût complet d'une ${n.x.f.unite}.`,
        ];
      },
    },
    {
      id: "le-volume-au-curseur",
      type: "curseur",
      titre: "Le volume qui couvre le prix du client",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const n = nouveauClientRegulier(c);
        const { f, coutVariableUnitaire, r } = n.x;
        return `Faites varier les ${f.unites} du mois. Une droite donne ce que vaudraient ces ${f.unites} à ${eur(PRIX_DU_NOUVEAU_CLIENT)} l'une, l'autre le coût de revient du mois (${eur(coutVariableUnitaire)} par ${f.unite}, plus ${eur(r.total)} de charges indirectes). Placez le curseur sur le plus petit volume où ${eur(PRIX_DU_NOUVEAU_CLIENT)} couvre le coût complet d'une ${f.unite}, puis validez.`;
      },
      grandeur: (c) => {
        const { f } = nouveauClientRegulier(c).x;
        return { libelle: `${f.unites.charAt(0).toUpperCase()}${f.unites.slice(1)} du mois`, unite: f.unites };
      },
      cible: (c) => ({ attendu: nouveauClientRegulier(c).volumeQuiCouvre, min: VOLUME_DU_CURSEUR.min, max: VOLUME_DU_CURSEUR.max }),
      zones: [`Le prix du client couvre le coût complet`, "Le prix du client ne couvre pas le coût complet"],
      rates: () => ({
        dessous: "À ce volume, le coût complet d'une unité dépasse encore le prix du client : les charges indirectes se partagent sur trop peu d'unités.",
        dessus: "Plus bas, le prix du client couvre encore le coût complet : cherchez le plus petit volume.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, q) => {
        const { f, coutVariableUnitaire, r } = nouveauClientRegulier(c).x;
        const cout = auCentime(coutVariableUnitaire * q + r.total);
        return [
          { libelle: `Ces ${f.unites} à ${eur(PRIX_DU_NOUVEAU_CLIENT)}`, montant: auCentime(PRIX_DU_NOUVEAU_CLIENT * q) },
          { libelle: "Coût de revient du mois", montant: cout },
          { libelle: `Coût complet d'une ${f.unite}`, montant: auCentime(cout / q), fort: true },
        ];
      },
      droites: (c) => {
        const { coutVariableUnitaire, r, f } = nouveauClientRegulier(c).x;
        return { produit: (q) => PRIX_DU_NOUVEAU_CLIENT * q, cout: (q) => coutVariableUnitaire * q + r.total, libelles: [`Ces ${f.unites} à ${eur(PRIX_DU_NOUVEAU_CLIENT)}`, "Coût de revient du mois"] };
      },
      explication: (c) => {
        const n = nouveauClientRegulier(c);
        const { f } = n.x;
        return [
          `Dès ${qte(n.volumeQuiCouvre)} ${f.unites} par mois, le coût complet d'une ${f.unite} passe sous ${eur(PRIX_DU_NOUVEAU_CLIENT)} ; avec le client, ${f.entreprise} en vendrait ${qte(n.nouvelle.quantite)}. Le prix que le directeur juge trop bas couvre le coût complet au volume que le client apporte.`,
        ];
      },
    },
    {
      id: "ce-que-change-le-client",
      type: "montants",
      titre: "Ce que le client change au résultat",
      notions: ["full_unit_cost", "contribution_margin"],
      question: (c) => {
        const { f } = nouveauClientRegulier(c).x;
        return `Croisez les deux lectures. Calculez le résultat analytique du mois avec le client, ce que le client ajoute au résultat de janvier, puis la perte que le directeur croit voir en chiffrant les ${f.unites} du client au coût de revient de janvier (un montant négatif).`;
      },
      champs: (c) => {
        const n = nouveauClientRegulier(c);
        const { k, coutFige, coutVariableUnitaire } = n.x;
        return [
          { libelle: "Résultat du mois avec le client", attendu: n.resultat, calcul: `${eur(n.nouvelle.chiffreDAffaires)} − ${eur(n.nouvelle.coutDeRevient)} = ${eur(n.resultat)}` },
          {
            libelle: "Ce que le client ajoute au résultat",
            attendu: n.apport,
            calcul: `${eur(n.resultat)} − ${eur(k.resultat)} = ${eur(n.apport)}, soit ${qte(n.duClient)} × (${eur(PRIX_DU_NOUVEAU_CLIENT)} − ${eur(coutVariableUnitaire)})`,
          },
          { libelle: "Perte que fait croire le coût de janvier", attendu: n.perteAuCoutFige, calcul: `${qte(n.duClient)} × (${eur(PRIX_DU_NOUVEAU_CLIENT)} − ${eur(coutFige)}) = ${eur(n.perteAuCoutFige)}` },
        ];
      },
      explication: (c) => {
        const n = nouveauClientRegulier(c);
        return [
          `Les deux lectures se contredisent : le coût de janvier annonce une perte de ${eur(-n.perteAuCoutFige)}, le résultat monte de ${eur(n.apport)}. C'est le résultat qui dit vrai : le coût de revient de janvier contient une part de charges fixes que le client ne fait pas dépenser ; il ne coûte que ses charges variables.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur commercial",
      notions: ["full_unit_cost", "contribution_margin"],
      question: () => "Le directeur doit-il refuser le client ? Quelle réponse lui rendez-vous ?",
      options: (c) => {
        const n = nouveauClientRegulier(c);
        const { f, m, coutFige } = n.x;
        return [
          {
            texte: `Accepter : le client ajoute ${eur(n.apport)} par mois au résultat`,
            juste: n.verdict === "accepter",
            retour: `Oui. À ${qte(n.nouvelle.quantite)} ${f.unites}, une ${f.unite} ne coûte plus que ${eur(n.nouvelle.unitaire)}, et le résultat passe de ${eur(n.x.k.resultat)} à ${eur(n.resultat)}. À une condition : que ce prix reste celui du client. Accordé aux clients d'aujourd'hui, il coûterait ${eur(n.siLePrixSEtend)} par mois sur leurs ${qte(m.quantite)} ${f.unites}, plus que le client n'apporte.`,
          },
          {
            texte: `Refuser : à ${eur(PRIX_DU_NOUVEAU_CLIENT)}, chaque ${f.unite} perd ${eur(auCentime(coutFige - PRIX_DU_NOUVEAU_CLIENT))} sur le coût de revient de ${eur(coutFige)}`,
            juste: false,
            retour: `Non : ${eur(coutFige)} est le coût d'une ${f.unite} à ${qte(m.quantite)} ${f.unites}. Le client ne fait pas dépenser un euro de charges fixes de plus : il ne coûte que ses charges variables, et le coût complet baisse avec lui.`,
          },
          {
            texte: `Accepter, mais au coût de revient d'aujourd'hui, ${eur(coutFige)} au moins`,
            juste: false,
            retour: `Non : c'est fixer le prix d'une commande sur un coût complet qui ne vaut qu'au volume de janvier. Le client propose ${eur(PRIX_DU_NOUVEAU_CLIENT)}, et ce prix rapporte déjà ${eur(n.apport)} par mois.`,
          },
          {
            texte: `Refuser : sur ${qte(n.duClient)} ${f.unites}, la perte serait de ${eur(-n.perteAuCoutFige)} par mois`,
            juste: false,
            retour: `Non : c'est la perte que fait croire le coût de janvier, part de charges fixes comprise. Le résultat réel du mois monte de ${eur(n.apport)}.`,
          },
        ];
      },
    },
  ],
};
