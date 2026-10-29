import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { AUGMENTATION_DE_CAPITAL, BESOIN_DE_FONDS, PARITES_DU_LABORATOIRE, RESERVE_LEGALE, augmentationDeCapital, pariteJuste } from "../monde/comptabilite-approfondie";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : L'AUGMENTATION DE CAPITAL, PRIME D'ÉMISSION ET DROIT DE SOUSCRIPTION
 * (DCG UE10 · Comptabilité approfondie, palier 4 ; BUT GEA).
 *
 * En juin N + 1, l'assemblée de NOVA affecte le bénéfice de N, puis NOVA lève des fonds pour sa
 * seconde ligne : 1 action nouvelle pour 3 anciennes, à 12 €. L'élève affecte le résultat, calcule la
 * valeur mathématique de l'action, la prime d'émission et le droit préférentiel de souscription, et
 * passe la souscription. Le curseur cherche le prix d'émission le plus haut qui ne dépasse pas la
 * valeur de l'action ; le laboratoire, la parité qui lève le besoin en diluant le moins.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : le capital de 150 000 € et le bénéfice
 * de N (exercice-de-nova.ts), et l'opération de monde/comptabilite-approfondie.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(Math.round(t * 10_000) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

export const L_AUGMENTATION_DE_CAPITAL: Chapitre = {
  code: "l-augmentation-de-capital",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: ["DCG UE10 · Comptabilité approfondie", "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation"],
  titre: "L'augmentation de capital : prime d'émission et droit de souscription",
  accroche:
    "Des actions nouvelles émises sous la valeur des anciennes : ce que l'opération apporte, ce que la prime d'émission range au passif, et ce que le droit de souscription rend aux anciens associés.",
  objectifs: [
    "Affecter le résultat et doter la réserve légale",
    "Calculer la valeur mathématique de l'action avant et après l'opération",
    "Calculer et comptabiliser l'augmentation de capital et la prime d'émission",
    "Calculer le droit préférentiel de souscription et en expliquer le rôle",
  ],
  libre: false,
  prerequis: ["creation-premier-bilan", "la-cloture"],
  entreprises: {
    codes: ["nova"],
    pourquoi: "ce chapitre suit l'assemblée de NOVA qui affecte son premier bénéfice et lève des fonds pour sa seconde ligne.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Lever des fonds sans s'endetter",
      notions: ["dilution_issuance", "balance_sheet"],
      texte: (c) => {
        const a = augmentationDeCapital();
        return [
          `Le capital de ${c.entreprise}, ${eur(a.capital)}, est fait de ${qte(a.actions)} actions de ${eur(a.nominal)} de nominal. En juin N + 1, l'assemblée affecte le bénéfice de N, ${eur(a.benefice)}, sans verser de dividende : ${c.entreprise} garde ses moyens pour sa seconde ligne.`,
          `Puis ${c.entreprise} augmente son capital : 1 action nouvelle pour ${AUGMENTATION_DE_CAPITAL.parite} anciennes, émise à ${eur(AUGMENTATION_DE_CAPITAL.prixDEmission)}, libérée en entier à la souscription. Le prix dépasse le nominal : l'excédent est une prime d'émission. Il reste sous la valeur des actions anciennes : les anciens associés y perdraient, sans le droit préférentiel de souscription.`,
        ];
      },
      repere: () => "Prix d'émission = nominal + prime d'émission. Le capital ne retient que le nominal ; la prime va au 1041. Le droit de souscription compense la baisse de valeur des actions anciennes.",
    },
    {
      id: "l-affectation",
      objectifs: [0],
      type: "montants",
      titre: "L'affectation du bénéfice de N",
      notions: ["balance_sheet"],
      question: () => `La réserve légale reçoit ${pct(RESERVE_LEGALE)} du bénéfice ; le reste va aux autres réserves. Calculez la dotation à la réserve légale, les autres réserves, puis les capitaux propres après l'affectation.`,
      champs: () => {
        const a = augmentationDeCapital();
        return [
          { libelle: "Réserve légale", attendu: a.reserveLegale, calcul: `${eur(a.benefice)} × ${pct(RESERVE_LEGALE)} = ${eur(a.reserveLegale)}` },
          { libelle: "Autres réserves", attendu: a.autresReserves, calcul: `${eur(a.benefice)} − ${eur(a.reserveLegale)} = ${eur(a.autresReserves)}` },
          { libelle: "Capitaux propres", attendu: a.capitauxPropres, calcul: `${eur(a.capital)} + ${eur(a.reserveLegale)} + ${eur(a.autresReserves)} = ${eur(a.capitauxPropres)}` },
        ];
      },
      explication: () => {
        const a = augmentationDeCapital();
        return [`Sans dividende, l'affectation ne change pas les capitaux propres, ${eur(a.capitauxPropres)} : le résultat devient des réserves (1061 et 1068), l'argent reste dans l'entreprise.`];
      },
    },
    {
      id: "les-valeurs",
      objectifs: [1, 2, 3],
      type: "montants",
      titre: "La prime et le droit de souscription",
      notions: ["dilution_issuance"],
      question: () => "Calculez la valeur mathématique de l'action avant l'opération (les capitaux propres par action, au centime), le nombre d'actions nouvelles, la prime d'émission, la valeur de l'action après, et le droit préférentiel de souscription.",
      champs: () => {
        const a = augmentationDeCapital();
        return [
          { libelle: "Valeur de l'action avant", attendu: a.valeurAvant, calcul: `${eur(a.capitauxPropres)} ÷ ${qte(a.actions)} = ${eur(a.valeurAvant)}` },
          { libelle: "Actions nouvelles", attendu: a.nouvelles, calcul: `${qte(a.actions)} ÷ ${a.parite} = ${qte(a.nouvelles)}`, tolerance: 0 },
          { libelle: "Prime d'émission", attendu: a.prime, calcul: `${qte(a.nouvelles)} × (${eur(a.prix)} − ${eur(a.nominal)}) = ${eur(a.prime)}` },
          { libelle: "Valeur de l'action après", attendu: a.valeurApres, calcul: `(${eur(a.capitauxPropres)} + ${eur(a.fonds)}) ÷ ${qte(a.actions + a.nouvelles)} = ${eur(a.valeurApres)}` },
          { libelle: "Droit de souscription", attendu: a.droit, calcul: `${eur(a.valeurAvant)} − ${eur(a.valeurApres)} = ${eur(a.droit)}, ou (${eur(a.valeurAvant)} − ${eur(a.prix)}) × 1 ÷ ${a.parite + 1}`, tolerance: 0.01 },
        ];
      },
      explication: () => {
        const a = augmentationDeCapital();
        return [
          `Chaque action ancienne passe de ${eur(a.valeurAvant)} à ${eur(a.valeurApres)} : ${eur(a.droit)} de perte, que le droit de souscription rend à son porteur. Il souscrit, ou il vend son droit à celui qui veut souscrire à sa place.`,
        ];
      },
    },
    {
      id: "la-souscription",
      objectifs: [2],
      type: "ecriture",
      titre: "La souscription, au journal",
      notions: ["dilution_issuance"],
      evenement: () => `Le ${AUGMENTATION_DE_CAPITAL.date}, les actions nouvelles sont souscrites et libérées en entier par virement. Passez l'augmentation de capital.`,
      ecriture: () => {
        const a = augmentationDeCapital();
        return {
          date: AUGMENTATION_DE_CAPITAL.date.replace(" N + 1", ""),
          libelle: "Augmentation de capital, libérée en entier",
          lignes: [
            { role: "l'argent reçu des souscripteurs", compte: "512", sens: "debit", montant: a.fonds, indice: "les actions nouvelles au prix d'émission" },
            { role: "le capital, pour le nominal des actions nouvelles", compte: "1013", acceptes: ["101"], sens: "credit", montant: a.augmentationDuCapital, indice: "les actions nouvelles au nominal" },
            { role: "la prime d'émission", compte: "1041", sens: "credit", montant: a.prime, indice: "l'excédent du prix sur le nominal" },
          ],
        };
      },
      indices: () => [
        "Au débit, la banque, pour tout ce que les souscripteurs versent.",
        "Au crédit, le capital ne prend que le nominal (1013, capital souscrit, appelé, versé) ; l'excédent est la prime d'émission (1041).",
      ],
      explication: () => {
        const a = augmentationDeCapital();
        return [`Le capital passe à ${eur(a.capitalApres)}, les capitaux propres à ${eur(a.capitauxPropresApres)}. La prime n'est pas du capital : elle appartient à tous les associés, anciens et nouveaux, comme les réserves.`];
      },
      vue: "bilan",
    },
    {
      id: "le-role-du-droit",
      objectifs: [3],
      type: "choix",
      titre: "À quoi sert le droit de souscription ?",
      notions: ["dilution_issuance"],
      question: () => {
        const a = augmentationDeCapital();
        return `Un associé détient ${qte(a.parite * 100)} actions anciennes et ne veut pas souscrire. Que fait-il de ses droits ?`;
      },
      options: () => {
        const a = augmentationDeCapital();
        return [
          {
            texte: `Il les vend, ${eur(a.droit)} pièce`,
            juste: true,
            retour: `Oui : ${qte(a.parite * 100)} droits à ${eur(a.droit)} lui rapportent ${eur(Math.round(a.parite * 100 * a.droit * 100) / 100)}, ce que ses actions perdent en valeur. Sans souscrire, il est dilué en part du capital, mais pas appauvri.`,
          },
          {
            texte: "Rien : sans souscrire, il garde la même part du capital qu'avant l'opération",
            juste: false,
            retour: `Non : le nombre d'actions passe de ${qte(a.actions)} à ${qte(a.actions + a.nouvelles)}. Sans souscrire, sa part baisse ; ce sont ses droits qui compensent la baisse de valeur.`,
          },
          {
            texte: "Il demande à NOVA leur remboursement au nominal, à la clôture",
            juste: false,
            retour: "Non : le droit de souscription se négocie entre associés et souscripteurs ; NOVA ne le rachète pas.",
          },
        ];
      },
    },
    {
      id: "le-prix-le-plus-haut",
      objectifs: [1],
      type: "curseur",
      titre: "Le prix d'émission le plus haut",
      notions: ["dilution_issuance"],
      sens: "plus-grande",
      question: () =>
        "Une émission au-dessus de la valeur de l'action ferait payer aux nouveaux plus que ce qu'ils reçoivent. Faites varier le prix d'émission, à l'euro : une droite donne la valeur mathématique de l'action avant l'opération, l'autre le prix. Placez le curseur sur le plus haut prix qui ne la dépasse pas.",
      grandeur: () => ({ libelle: "Prix d'émission d'une action", unite: "€" }),
      cible: () => ({ attendu: Math.floor(augmentationDeCapital().valeurAvant), min: 10, max: 20 }),
      zones: ["Le prix ne dépasse pas la valeur", "Le prix dépasse la valeur"],
      rates: () => ({
        dessous: "À ce prix, l'action vaut encore plus que son prix d'émission, et un prix plus élevé aussi : cherchez le plus haut.",
        dessus: "À ce prix, le souscripteur paierait l'action plus qu'elle ne vaut.",
      }),
      montrer: "Montrer le prix",
      lecture: (_c, q) => {
        const a = augmentationDeCapital(AUGMENTATION_DE_CAPITAL.parite, q);
        return [
          { libelle: "Valeur de l'action avant", montant: a.valeurAvant },
          { libelle: "Prime d'émission", montant: a.prime },
          { libelle: "Droit de souscription", montant: a.droit, fort: true },
        ];
      },
      droites: () => {
        const v = augmentationDeCapital().valeurAvant;
        return { produit: () => v, cout: (q) => q, libelles: ["Valeur de l'action", "Prix d'émission"] };
      },
      explication: () => {
        const a = augmentationDeCapital();
        return [`Au plus ${eur(Math.floor(a.valeurAvant))}, sous les ${eur(a.valeurAvant)} de l'action : plus le prix approche la valeur, plus le droit de souscription est faible, et plus l'opération lève d'argent pour le même nombre d'actions.`];
      },
    },
    {
      id: "le-laboratoire-de-la-parite",
      objectifs: [2, 3],
      type: "simulation",
      titre: "La parité de l'émission",
      notions: ["dilution_issuance"],
      question: () => `Au prix de ${eur(AUGMENTATION_DE_CAPITAL.prixDEmission)}, faites varier la parité, 1 action nouvelle pour un nombre d'actions anciennes : regardez les fonds levés, la part des anciens et le droit de souscription.`,
      leviers: () => [
        {
          code: "parite",
          libelle: "Actions anciennes pour 1 nouvelle",
          unite: "actions",
          min: PARITES_DU_LABORATOIRE[0],
          max: PARITES_DU_LABORATOIRE[PARITES_DU_LABORATOIRE.length - 1]!,
          pas: 1,
          depart: PARITES_DU_LABORATOIRE.find((k) => k > AUGMENTATION_DE_CAPITAL.parite)!,
          choix: PARITES_DU_LABORATOIRE.map((k) => ({ valeur: k, libelle: `1 pour ${k}` })),
        },
      ],
      lecture: (_c, p) => {
        const a = augmentationDeCapital(p.parite!);
        return [
          { libelle: "Fonds levés", montant: a.fonds, fort: true },
          { libelle: "Actions nouvelles", montant: a.nouvelles, unite: "actions" },
          { libelle: "Part du capital gardée par les anciens", montant: Math.round((a.actions / (a.actions + a.nouvelles)) * 1_000) / 10, unite: "%" },
          { libelle: "Droit de souscription", montant: a.droit },
        ];
      },
      defi: () => {
        const juste = pariteJuste();
        return {
          consigne: `Levez au moins ${eur(BESOIN_DE_FONDS)} en émettant le moins d'actions nouvelles possible.`,
          atteint: (p) => p.parite === juste,
          indice: (p) => {
            const a = augmentationDeCapital(p.parite!);
            return a.fonds < BESOIN_DE_FONDS ? `En 1 pour ${p.parite}, ${eur(a.fonds)} ne suffisent pas.` : `En 1 pour ${p.parite}, ${eur(a.fonds)} suffisent, mais une parité plus large y suffirait-elle aussi ?`;
          },
          solution: { parite: juste },
        };
      },
      explication: (_c, p) => {
        const a = augmentationDeCapital(p.parite!);
        return [`Défi relevé : en 1 pour ${p.parite}, ${qte(a.nouvelles)} actions nouvelles lèvent ${eur(a.fonds)}, et chaque droit vaut ${eur(a.droit)}. Plus la parité est serrée, plus l'opération lève, et plus elle dilue.`];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dilution_issuance"],
      texte: () => {
        const a = augmentationDeCapital();
        return [
          `${qte(a.nouvelles)} actions à ${eur(a.prix)} lèvent ${eur(a.fonds)} : ${eur(a.augmentationDuCapital)} de capital, ${eur(a.prime)} de prime d'émission. L'action passe de ${eur(a.valeurAvant)} à ${eur(a.valeurApres)}, et le droit de souscription, ${eur(a.droit)}, en rend la différence aux anciens associés.`,
          "Dans l'arène, les apports se décident à la création : comparez ce que coûte une augmentation de capital et ce que coûte un emprunt.",
        ];
      },
      repere: () => "Capital au nominal (1013), prime d'émission (1041). Valeur avant − valeur après = droit de souscription = (valeur avant − prix) × nouvelles ÷ (anciennes + nouvelles).",
    },
  ],
};
