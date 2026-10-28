import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_ASSURANCE, assuranceDeNova } from "../../chapitres/s-assurer-contre-les-aleas";
import { choisirUneAssurance, primePlafond } from "../../monde/capacite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « S'ASSURER CONTRE LES ALÉAS » : L'ASSUREUR AUGMENTE LA PRIME (BTS GPME,
 * gestion des risques, palier 3).
 *
 * Au renouvellement du 1er octobre, l'assureur augmente de 20 % la prime de la Basique, la formule de
 * NOVA. La gérante demande s'il faut renouveler à ce prix. L'élève refait la règle du chapitre sur la
 * prime augmentée (le pire reste à charge s'encaisse-t-il toujours ? la Basique reste-t-elle la moins
 * chère en moyenne des options qui s'encaissent ?), cherche À REBOURS la prime au-delà de laquelle
 * l'Étendue passerait devant, et rend une réponse qui demande un jugement : la hausse dépasse
 * l'espérance, comme la prime d'avant, et ce n'est pas ce qui décide. Un curseur sur la prime d'un
 * trimestre montre, avant le calcul, où le coût moyen de la Basique rattrape celui de l'Étendue.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux d'`assuranceDeNova` et de `primePlafond`, sur la fiche de NOVA. La hausse est une
 * hypothèse de l'histoire. L'ancienne règle (« une année de prime sous le pire sinistre ») a disparu :
 * elle disait oui à toutes les formules.
 */

/** La hausse annoncée au renouvellement : un cinquième de la prime. Une hypothèse du cours. */
export const HAUSSE_DE_LA_PRIME = 0.2;

/** Les bornes du curseur de la prime d'un trimestre, en euros. */
export const PRIME_DU_CURSEUR = { min: 1_500, max: 3_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(Math.round(t * 10_000) / 100)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "renouveler" | "changer" | "ne-plus-s-assurer";

/** La prime augmentée, la règle refaite à ce prix, la prime plafond et la réponse. */
export function primeAugmentee(c: Pick<Cas, "code">) {
  const a = assuranceDeNova(c);
  const b = a.basique;
  const nouvellePrime = auCentime(b.primeParTrimestre * (1 + HAUSSE_DE_LA_PRIME));
  const nouvellePrimeDeLAnnee = auCentime(nouvellePrime * 4);
  const choix = choisirUneAssurance(a.f, { primes: { basique: nouvellePrime } });
  const renouvelee = choix.options.find((o) => o.choix === "basique")!;
  const plafond = primePlafond(a.f, "basique");
  const rivale = choix.options.find((o) => o.choix === plafond.rivale)!;
  const verdict: Verdict = choix.retenue === "basique" ? "renouveler" : choix.retenue === "sans-assurance" ? "ne-plus-s-assurer" : "changer";
  // Le curseur : la plus grande prime d'un trimestre (à l'euro) où la Basique coûte en moyenne au plus autant que sa rivale.
  const primeAuCurseur = Math.floor((rivale.coutMoyen - b.resteEspere) / 4 + 1e-9);
  return {
    a,
    nouvellePrime,
    nouvellePrimeDeLAnnee,
    hausseDeLAnnee: auCentime(nouvellePrimeDeLAnnee - b.prime),
    coutMoyenRenouvele: renouvelee.coutMoyen,
    chargementRenouvele: renouvelee.chargement,
    seEncaisseToujours: renouvelee.seEncaisse,
    resteApresLePire: auCentime(a.absorption.capacite - renouvelee.pireResteACharge),
    rivale,
    primeDeLAnneePlafond: plafond.primeDeLAnnee!,
    primeParTrimestrePlafond: plafond.primeParTrimestre!,
    /** La hausse de la prime d'un trimestre que la Basique supporte encore, en % de la prime actuelle. */
    hausseSupportable: auCentime((plafond.primeParTrimestre! / b.primeParTrimestre - 1) * 100),
    primeAuCurseur,
    retenue: choix.retenue,
    verdict,
  };
}

export const L_ASSUREUR_AUGMENTE_LA_PRIME: Situation = {
  code: "l-assureur-augmente-la-prime",
  parcours: "gpme",
  palier: 3,
  blocs: [],
  reprend: ["s-assurer-contre-les-aleas"],
  commanditaire: "La gérante",
  titre: "L'assureur augmente la prime",
  accroche:
    "Au renouvellement, l'assureur augmente la prime de la Basique. La gérante veut savoir s'il faut renouveler à ce prix : ce que la hausse coûte, jusqu'où la prime peut monter avant qu'une autre formule passe devant, et la réponse à lui rendre.",
  objectifs: [
    "Calculer une prime augmentée et le coût moyen de l'année qu'elle donne",
    "Vérifier que le pire reste à charge s'encaisse toujours",
    "Retrouver à rebours la prime au-delà de laquelle une autre formule devient la meilleure",
    "Répondre à la gérante, chiffres à l'appui, sans juger sur la moyenne seule",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ASSURANCE,
    pourquoi: "ce cas reprend le chapitre « S'assurer contre les aléas », qui se joue dans la simulation du cours chez NOVA.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      tableau: (c) => {
        const p = primeAugmentee(c);
        const a = p.a;
        return {
          titre: `L'assurance ${dE(a.f.entreprise)}, au renouvellement du 1er octobre`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Prime actuelle d'un trimestre, ${a.basique.nom}`, valeurs: [eur(a.basique.primeParTrimestre)] },
            { libelle: "Hausse annoncée", valeurs: [pct(HAUSSE_DE_LA_PRIME)] },
            { libelle: "Espérance des sinistres de l'année", valeurs: [eur(a.esperance)] },
            { libelle: `Remboursé en moyenne par la ${a.basique.nom} : sa prime pure`, valeurs: [eur(a.basique.primePure)] },
            { libelle: `Pire reste à charge avec la ${a.basique.nom}`, valeurs: [eur(a.basique.pireResteACharge)] },
            { libelle: `Coût moyen de l'année avec l'${a.etendue.nom}`, valeurs: [eur(a.etendue.coutMoyen)] },
            { libelle: `Coût moyen de l'année sans assurance (pire : ${eur(a.sans.pireResteACharge)})`, valeurs: [eur(a.sans.coutMoyen)] },
            { libelle: "Capacité d'absorption", valeurs: [eur(a.absorption.capacite)] },
          ],
        };
      },
      texte: (c) => {
        const p = primeAugmentee(c);
        const a = p.a;
        return [
          `« L'assureur nous écrit : au renouvellement, la prime de la ${a.basique.nom} augmente de ${pct(HAUSSE_DE_LA_PRIME)}. Avant de signer, dites-moi ce que cette hausse change pour ${a.f.entreprise}, jusqu'où la prime pourrait monter avant qu'une autre formule devienne la meilleure, et s'il faut renouveler. »`,
          "Pas de cours cette fois : vous avez le contrat et les chiffres que le chapitre a calculés, à vous d'en trouver l'ordre. La hausse ne change ni les aléas, ni les franchises, ni ce que l'entreprise peut encaisser.",
        ];
      },
      repere: () =>
        "À rendre : la prime renouvelée et le coût moyen qu'elle donne, ce que la hausse change au pire reste à charge, la prime au-delà de laquelle une autre formule passe devant, et votre réponse.",
    },
    {
      id: "prime",
      type: "montants",
      titre: "La prime renouvelée",
      notions: ["fixed_costs"],
      question: () => "Calculez la prime d'un trimestre après la hausse, la prime de l'année à ce prix, puis le coût moyen de l'année avec la formule renouvelée.",
      champs: (c) => {
        const p = primeAugmentee(c);
        const b = p.a.basique;
        return [
          { libelle: "Prime d'un trimestre après la hausse", attendu: p.nouvellePrime, calcul: `${eur(b.primeParTrimestre)} × (1 + ${pct(HAUSSE_DE_LA_PRIME)}) = ${eur(p.nouvellePrime)}` },
          { libelle: "Prime de l'année après la hausse", attendu: p.nouvellePrimeDeLAnnee, calcul: `${eur(p.nouvellePrime)} × 4 = ${eur(p.nouvellePrimeDeLAnnee)}` },
          {
            libelle: "Coût moyen de l'année, prime augmentée",
            attendu: p.coutMoyenRenouvele,
            calcul: `${eur(p.nouvellePrimeDeLAnnee)} + (${eur(p.a.esperance)} − ${eur(b.primePure)}) = ${eur(p.nouvellePrimeDeLAnnee)} + ${eur(b.resteEspere)} = ${eur(p.coutMoyenRenouvele)}`,
          },
        ];
      },
      explication: (c) => {
        const p = primeAugmentee(c);
        return [
          `Renouvelée, la formule coûterait ${eur(p.nouvellePrimeDeLAnnee)} de prime par an, ${eur(p.hausseDeLAnnee)} de plus, et ${eur(p.coutMoyenRenouvele)} en moyenne. La hausse ne passe que dans le chargement : la formule rembourse toujours ${eur(p.a.basique.primePure)} en moyenne, et l'espérance des sinistres ne bouge pas.`,
        ];
      },
    },
    {
      id: "le-pire-ne-bouge-pas",
      type: "montants",
      titre: "Ce que la hausse ne change pas",
      notions: ["net_treasury"],
      question: (c) => {
        const p = primeAugmentee(c);
        return `La hausse change-t-elle le pire que la formule laisse à ${p.a.f.entreprise} ? Donnez le pire reste à charge avec la formule renouvelée, puis la capacité d'absorption qui resterait après ce sinistre.`;
      },
      champs: (c) => {
        const p = primeAugmentee(c);
        const a = p.a;
        return [
          { libelle: "Pire reste à charge, formule renouvelée", attendu: a.basique.pireResteACharge, calcul: `la ${a.pireDeLaBasique}, que la formule ne couvre pas : ${eur(a.basique.pireResteACharge)}, comme avant la hausse` },
          { libelle: "Capacité qui reste après ce sinistre", attendu: p.resteApresLePire, calcul: `${eur(a.absorption.capacite)} − ${eur(a.basique.pireResteACharge)} = ${eur(p.resteApresLePire)}` },
        ];
      },
      explication: (c) => {
        const p = primeAugmentee(c);
        return [
          `Une prime plus chère ne protège ni plus ni moins : le pire reste ${eur(p.a.basique.pireResteACharge)}, et il s'encaisse encore, avec ${eur(p.resteApresLePire)} de marge. Le premier test de la règle tient ; reste le second, le coût moyen face aux autres options qui s'encaissent.`,
        ];
      },
    },
    {
      id: "le-plafond-au-curseur",
      type: "curseur",
      titre: "Jusqu'où la prime peut monter",
      notions: ["fixed_costs"],
      question: (c) => {
        const p = primeAugmentee(c);
        return `Faites monter la prime d'un trimestre de la ${p.a.basique.nom} de ${eur(PRIME_DU_CURSEUR.min)} à ${eur(PRIME_DU_CURSEUR.max)}. Une droite donne son coût moyen de l'année, l'autre celui de l'${p.rivale.nom}, la moins chère des autres options qui s'encaissent. Placez le curseur sur la plus haute prime où la ${p.a.basique.nom} ne coûte pas plus en moyenne, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prime d'un trimestre", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: primeAugmentee(c).primeAuCurseur, min: PRIME_DU_CURSEUR.min, max: PRIME_DU_CURSEUR.max }),
      zones: ["La Basique reste la meilleure", "L'Étendue passe devant"],
      rates: () => ({
        dessous: "La prime peut encore monter sans que la formule cesse d'être la meilleure : cherchez la plus haute.",
        dessus: "À cette prime, la formule coûte en moyenne plus que sa rivale.",
      }),
      montrer: "Montrer le plafond",
      lecture: (c, q) => {
        const p = primeAugmentee(c);
        const cout = auCentime(q * 4 + p.a.basique.resteEspere);
        return [
          { libelle: "Prime de l'année", montant: q * 4 },
          { libelle: "Coût moyen de l'année avec la Basique", montant: cout },
          { libelle: "Coût moyen de l'année avec l'Étendue", montant: p.rivale.coutMoyen },
          { libelle: "Avance de la Basique sur l'Étendue", montant: auCentime(p.rivale.coutMoyen - cout), fort: true },
        ];
      },
      droites: (c) => {
        const p = primeAugmentee(c);
        return {
          produit: () => p.rivale.coutMoyen,
          cout: (q) => q * 4 + p.a.basique.resteEspere,
          libelles: ["Coût moyen avec l'Étendue", "Coût moyen avec la Basique"],
        };
      },
      explication: (c) => {
        const p = primeAugmentee(c);
        return [
          `Jusqu'à ${eur(p.primeAuCurseur)} par trimestre, la ${p.a.basique.nom} reste la moins chère des options qui s'encaissent. La prime augmentée, ${eur(p.nouvellePrime)}, en est loin. L'étape suivante retrouve ce plafond au centime, par le calcul.`,
        ];
      },
    },
    {
      id: "plafond",
      type: "montants",
      titre: "La prime plafond, à rebours",
      notions: ["fixed_costs"],
      question: (c) => {
        const p = primeAugmentee(c);
        return `Retrouvez à rebours la prime de l'année au-delà de laquelle l'${p.rivale.nom} deviendrait la meilleure option, puis la prime d'un trimestre correspondante, et la hausse que la ${p.a.basique.nom} pourrait encore supporter, en % de sa prime actuelle, à 0,1 point près.`;
      },
      champs: (c) => {
        const p = primeAugmentee(c);
        const b = p.a.basique;
        return [
          {
            libelle: "Prime plafond de l'année",
            attendu: p.primeDeLAnneePlafond,
            calcul: `coût moyen de l'${p.rivale.nom} − reste à charge espéré de la ${b.nom} = ${eur(p.rivale.coutMoyen)} − ${eur(b.resteEspere)} = ${eur(p.primeDeLAnneePlafond)}`,
          },
          { libelle: "Prime plafond d'un trimestre", attendu: p.primeParTrimestrePlafond, calcul: `${eur(p.primeDeLAnneePlafond)} ÷ 4 = ${eur(p.primeParTrimestrePlafond)}` },
          {
            libelle: "Hausse que la formule supporte encore, en %",
            attendu: p.hausseSupportable,
            calcul: `(${eur(p.primeParTrimestrePlafond)} ÷ ${eur(b.primeParTrimestre)} − 1) × 100 = ${qte(p.hausseSupportable)} %`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const p = primeAugmentee(c);
        return [
          `Tant que la prime de l'année reste sous ${eur(p.primeDeLAnneePlafond)}, soit ${eur(p.primeParTrimestrePlafond)} par trimestre (${qte(p.hausseSupportable)} % de hausse), la ${p.a.basique.nom} reste la meilleure option ; un euro au-dessus, l'${p.rivale.nom} passe devant. La hausse annoncée, ${pct(HAUSSE_DE_LA_PRIME)}, laisse de la marge.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const p = primeAugmentee(c);
        const a = p.a;
        const b = a.basique;
        return [
          {
            texte: `Renouveler : même augmentée, la ${b.nom} reste la meilleure option qui s'encaisse`,
            juste: p.verdict === "renouveler",
            retour:
              p.verdict === "renouveler"
                ? `Oui : son pire reste à charge (${eur(b.pireResteACharge)}) s'encaisse toujours, et elle coûte ${eur(p.coutMoyenRenouvele)} en moyenne, contre ${eur(p.rivale.coutMoyen)} pour l'${p.rivale.nom}. La hausse coûte ${eur(p.hausseDeLAnnee)} par an ; la prime pourrait monter jusqu'à ${eur(p.primeParTrimestrePlafond)} par trimestre avant que l'${p.rivale.nom} passe devant.`
                : `Non : à ce prix, la ${b.nom} coûte en moyenne ${eur(p.coutMoyenRenouvele)}, plus que l'${p.rivale.nom} (${eur(p.rivale.coutMoyen)}).`,
          },
          {
            texte: `Passer à l'${a.etendue.nom} : la ${b.nom} augmente, l'${a.etendue.nom} non`,
            juste: p.verdict === "changer",
            retour:
              p.verdict === "changer"
                ? `Oui : à ce prix, l'${a.etendue.nom} coûte moins en moyenne.`
                : `Non : l'${a.etendue.nom} coûte en moyenne ${eur(a.etendue.coutMoyen)}, toujours plus que la ${b.nom} augmentée (${eur(p.coutMoyenRenouvele)}). Une hausse ne se juge pas seule : elle se compare aux autres options.`,
          },
          {
            texte: "Ne plus s'assurer : garder tous les risques coûte le moins en moyenne",
            juste: p.verdict === "ne-plus-s-assurer",
            retour: `Non : garder les risques coûte en moyenne ${eur(a.sans.coutMoyen)}, mais un incendie coûterait ${eur(a.sans.pireResteACharge)} d'un coup, plus que les ${eur(a.absorption.capacite)} que ${a.f.entreprise} peut encaisser.`,
          },
          {
            texte: "Ne pas renouveler : la prime augmentée dépasse de loin ce que la formule rembourse en moyenne",
            juste: false,
            retour: `Non : c'était déjà vrai avant la hausse (${eur(b.primePure)} remboursés en moyenne pour ${eur(b.prime)} de prime). Une assurance coûte presque toujours plus qu'elle ne rembourse : on la prend contre un sinistre qu'on ne pourrait pas encaisser, pas pour gagner en moyenne.`,
          },
        ];
      },
    },
  ],
};
