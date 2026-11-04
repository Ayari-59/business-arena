import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_PROGRAMMATION } from "../../chapitres/programmer-la-production";
import { BANC_DE_MESURE, LA_ONE, LA_STUDIO, formeCanonique, programmeOptimal } from "../../monde/programmation-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PROGRAMMER LA PRODUCTION » : LE BANC PERD UNE JOURNÉE (contrôle de
 * gestion, palier 4).
 *
 * Le fabricant du banc de mesure doit le réviser au mois de pointe : une journée de 8 heures sans
 * mesure, 144 heures au lieu de 152. L'élève refait le programme sans cours : le croisement des
 * heures-machine et du banc demanderait plus de One que la demande, le sommet change (la demande
 * de One et le banc sont saturés, les heures-machine ne le sont plus), la marge baisse. Puis il dit
 * s'il faut payer à l'opérateur un samedi qui rendrait les 8 heures.
 *
 * HYPOTHÈSES DU CAS : la révision prend 8 heures de banc (JOURNEE_DE_REVISION) ; l'opérateur
 * accepte de travailler un samedi de 8 heures pour 600 €, cotisations comprises (SAMEDI_DE_L_OPERATEUR).
 */

/** La révision du banc : une journée de 8 heures. */
export const JOURNEE_DE_REVISION = 8;

/** Le samedi que l'opérateur propose : 8 heures de banc rendues, pour 600 € cotisations comprises. */
export const SAMEDI_DE_L_OPERATEUR = { heures: 8, cout: 600 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");

/** Les chiffres du cas. */
export function bancReduit(_c?: Pick<Cas, "code">) {
  const heuresDuBanc = BANC_DE_MESURE.heuresParMois - JOURNEE_DE_REVISION;
  const fiche = programmeOptimal();
  const reduit = programmeOptimal({ heuresDuBanc });
  const f = formeCanonique({ heuresDuBanc });
  const hm = f.contraintes.find((k) => k.code === "heures-machine")!;
  const banc = f.contraintes.find((k) => k.code === "banc")!;
  // Le croisement des deux ressources : multiplier la contrainte du banc par hm.a ÷ banc.a élimine x.
  const m = hm.a / banc.a;
  const yCroisement = Math.round(((m * banc.c - hm.c) / (m * banc.b - hm.b)) * 1e6) / 1e6;
  const xCroisement = Math.round(((hm.c - hm.b * yCroisement) / hm.a) * 1e6) / 1e6;
  const perte = Math.round((fiche.optimal.marge - reduit.optimal.marge) * 100) / 100;
  return { heuresDuBanc, fiche, reduit, hm, banc, m, xCroisement, yCroisement, perte, samedi: SAMEDI_DE_L_OPERATEUR };
}

export const LE_BANC_PERD_UNE_JOURNEE: Situation = {
  code: "le-banc-perd-une-journee",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["programmer-la-production"],
  commanditaire: "Le responsable de la production",
  titre: "Le banc perd une journée",
  accroche: "Le banc de mesure part en révision une journée au mois de pointe : quel programme pour la One et la Studio, et faut-il payer un samedi à l'opérateur pour rattraper ses heures ?",
  objectifs: [
    "Réécrire une contrainte quand une ressource baisse",
    "Vérifier qu'un croisement de deux droites respecte toutes les contraintes",
    "Retrouver le programme optimal et chiffrer la marge perdue",
    "Décider si une ressource de plus vaut son prix",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_PROGRAMMATION,
    pourquoi: "ce cas reprend le chapitre « Programmer la production », qui se calcule sur la gamme de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La révision du banc",
      texte: () => {
        const x = bancReduit();
        return [
          `« Le fabricant révise le banc de mesure ce mois-ci : une journée sans mesure, ${qte(JOURNEE_DE_REVISION)} heures. Le banc tournera ${qte(x.heuresDuBanc)} heures au lieu de ${qte(BANC_DE_MESURE.heuresParMois)}. Quel programme pour la One et la Studio ? »`,
          `« L'opérateur propose de travailler un samedi pour rattraper ces ${qte(SAMEDI_DE_L_OPERATEUR.heures)} heures : ${eur(SAMEDI_DE_L_OPERATEUR.cout)}, cotisations comprises. Faut-il accepter ? » Pas de cours cette fois : vous avez la forme canonique du mois.`,
        ];
      },
      tableau: () => {
        const x = bancReduit();
        const f = formeCanonique({ heuresDuBanc: x.heuresDuBanc });
        return {
          titre: "Le programme du mois, la Go servie d'abord",
          colonnes: ["Contrainte ou objectif"],
          lignes: [
            { libelle: "Heures-machine", valeurs: [`${qte(x.hm.a)} x + ${qte(x.hm.b)} y ≤ ${qte(x.hm.c)}`] },
            { libelle: "Heures du banc, pendant la révision", valeurs: [`${qte(x.banc.a)} x + ${qte(x.banc.b)} y ≤ ${qte(x.banc.c)}`] },
            { libelle: "Demande", valeurs: [`x ≤ ${qte(LA_ONE.demandeDuMoisDePointe)} ; y ≤ ${qte(LA_STUDIO.demandeDuMoisDePointe)}`] },
            { libelle: "Marge sur coût variable à maximiser", valeurs: [`${qte(f.marge.x)} x + ${qte(f.marge.y)} y`] },
            { libelle: "Programme sans la révision", valeurs: [`${qte(x.fiche.optimal.x)} One et ${qte(x.fiche.optimal.y)} Studio, ${eur(x.fiche.optimal.marge)}`] },
          ],
        };
      },
      repere: () => "À rendre : le nouveau programme, la marge perdue, et votre réponse sur le samedi.",
    },
    {
      id: "le-nouveau-sommet",
      type: "montants",
      titre: "Le nouveau sommet",
      notions: ["capacity"],
      question: () =>
        "Calculez d'abord les One au croisement des heures-machine et du banc réduit. Ce croisement respecte-t-il la demande ? Déduisez-en le programme optimal du mois : ses One et ses Studio.",
      champs: () => {
        const x = bancReduit();
        const r = x.reduit.optimal;
        return [
          { libelle: "One au croisement des deux ressources", attendu: x.xCroisement, calcul: `y = (${qte(x.m)} × ${qte(x.banc.c)} − ${qte(x.hm.c)}) ÷ (${qte(x.m)} × ${qte(x.banc.b)} − ${qte(x.hm.b)}) = ${qte(x.yCroisement)}, puis x = (${qte(x.hm.c)} − ${qte(x.hm.b)} × ${qte(x.yCroisement)}) ÷ ${qte(x.hm.a)} = ${qte(x.xCroisement)}` },
          { libelle: "One du programme optimal", attendu: r.x, calcul: `le croisement demande ${qte(x.xCroisement)} One, plus que les ${qte(LA_ONE.demandeDuMoisDePointe)} demandées : la demande de la One est saturée, x = ${qte(r.x)}` },
          { libelle: "Studio du programme optimal", attendu: r.y, calcul: `sur la droite du banc, à x = ${qte(r.x)} : (${qte(x.banc.c)} − ${qte(x.banc.a)} × ${qte(r.x)}) ÷ ${qte(x.banc.b)} = ${qte(r.y)}` },
        ];
      },
      explication: () => {
        const x = bancReduit();
        const r = x.reduit.optimal;
        return [
          `Le sommet a changé de place : ${qte(r.x)} One et ${qte(r.y)} Studio. Les heures-machine ne sont plus saturées, il en reste ${qte(x.reduit.usages.find((u) => u.code === "heures-machine")!.reste)} ; ce sont le banc et la demande de la One qui bornent le mois.`,
        ];
      },
    },
    {
      id: "la-marge-perdue",
      type: "montants",
      titre: "La marge perdue",
      notions: ["contribution_margin"],
      question: () => "Calculez la marge sur coût variable de la One et de la Studio au nouveau programme, puis la marge que la révision fait perdre.",
      champs: () => {
        const x = bancReduit();
        const r = x.reduit.optimal;
        const f = x.reduit.forme;
        return [
          { libelle: "Marge de la One et de la Studio", attendu: r.marge, calcul: `${qte(f.marge.x)} × ${qte(r.x)} + ${qte(f.marge.y)} × ${qte(r.y)} = ${eur(r.marge)}` },
          { libelle: "Marge perdue", attendu: x.perte, calcul: `${eur(x.fiche.optimal.marge)} − ${eur(r.marge)} = ${eur(x.perte)}` },
        ];
      },
      explication: () => {
        const x = bancReduit();
        return [`La journée de révision coûte ${eur(x.perte)} de marge : ${qte(x.fiche.optimal.y - x.reduit.optimal.y)} Studio de moins, que ${qte(x.reduit.optimal.x - x.fiche.optimal.x)} One de plus ne compensent pas.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse sur le samedi",
      notions: ["capacity", "contribution_margin"],
      question: () => `L'opérateur rattrape les ${qte(SAMEDI_DE_L_OPERATEUR.heures)} heures un samedi, pour ${eur(SAMEDI_DE_L_OPERATEUR.cout)}. Que répondez-vous ?`,
      options: () => {
        const x = bancReduit();
        return [
          { texte: `Accepter : le samedi rend ${eur(x.perte)} pour ${eur(x.samedi.cout)}`, juste: true, retour: `Oui. Les ${qte(x.samedi.heures)} heures rendues ramènent le programme à ${qte(x.fiche.optimal.x)} One et ${qte(x.fiche.optimal.y)} Studio : ${eur(x.perte)} de marge pour ${eur(x.samedi.cout)} de salaire, soit ${eur(x.perte - x.samedi.cout)} de mieux. Une ressource saturée vaut ce qu'elle rapporte, pas ce qu'elle coûte d'habitude.` },
          { texte: "Refuser : un samedi payé alourdit les charges du mois", juste: false, retour: `Non : ${eur(x.samedi.cout)} de charges pour ${eur(x.perte)} de marge, le résultat y gagne. Ce qui compte, c'est la marge que l'heure rend.` },
          { texte: "Refuser : la One remplace la Studio, la marge ne bouge pas", juste: false, retour: `Non : le nouveau programme perd des Studio que des One de plus ne compensent pas. La révision fait perdre ${eur(x.perte)}.` },
          { texte: "Accepter seulement la moitié du samedi, la demande de la One étant servie", juste: false, retour: `Non : chaque heure de banc rendue sert à des Studio de plus, jusqu'au sommet des deux ressources. Les ${qte(x.samedi.heures)} heures servent toutes.` },
        ];
      },
    },
  ],
};
