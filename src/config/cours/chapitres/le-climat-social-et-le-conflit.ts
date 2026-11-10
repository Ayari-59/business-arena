import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_CLIMAT_SOCIAL, JOURNEE, coutDeLaGreve, joursQuiCoutentLaHausse, journeeDeGreve, revendication } from "../monde/climat-social-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE CLIMAT SOCIAL ET LE CONFLIT (Bac STMG, enseignement spécifique de ressources humaines et
 * communication de terminale, thème 3, question 3.1 : « Les tensions professionnelles peuvent-elles
 * renforcer la cohésion ? »).
 *
 * Les relations professionnelles et le climat social, ses signaux (absentéisme, rotation, réclamations,
 * pétition), les sources et les formes du conflit (individuel ou collectif ; pétition, débrayage, grève),
 * le droit de grève, ce que coûte un conflit à chacun (le curseur), les modes de résolution
 * (négociation, conciliation, médiation, arbitrage), le compromis, et le dépassement du conflit. La
 * demande d'augmentation de l'équipe est celle du cas « L'équipe demande une augmentation ».
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/climat-social-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR")} %`;

export const LE_CLIMAT_SOCIAL_ET_LE_CONFLIT: Chapitre = {
  code: "le-climat-social-et-le-conflit",
  parcours: "stmg-rh",
  palier: 1,
  blocs: ["STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social"],
  titre: "Le climat social et le conflit",
  accroche:
    "Le président refuse la hausse que demande l'équipe, et la ligne s'arrête. Lire le climat social avant le conflit, ce que dit le droit de grève, ce que coûte un conflit à chacun, et comment en sortir plus soudés.",
  objectifs: [
    "Lire les signaux du climat social",
    "Distinguer les formes du conflit et connaître le droit de grève",
    "Chiffrer ce que coûte un conflit",
    "Reconnaître les modes de résolution d'un conflit",
    "Comprendre comment une tension dépassée renforce la cohésion",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CLIMAT_SOCIAL,
    pourquoi: "ce chapitre suit le conflit entre les opérateurs de NOVA et leur président.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une hausse refusée",
      texte: (c) => {
        const r = revendication();
        return [
          `En janvier de N + 1, les opérateurs de ${c.entreprise} ont demandé ${pct(r.taux)} de hausse de leur salaire brut. Le président a refusé. Au fil des mois, l'ambiance s'est dégradée ; en décembre, la ligne s'arrête.`,
          "Les relations professionnelles sont les relations entre la direction, les salariés et leurs représentants. Le climat social est la façon dont les salariés les vivent : la confiance, le sentiment d'être écoutés, la qualité des relations de travail.",
        ];
      },
      repere: () => "Relations professionnelles : direction, salariés, représentants. Climat social : la façon dont l'équipe les vit.",
    },
    {
      id: "les-signaux",
      objectifs: [0],
      type: "tri",
      titre: "Les signaux du climat social",
      question: () => "Rangez chaque observation du président, au printemps.",
      categories: [
        { code: "signal", libelle: "Un signal du climat social" },
        { code: "autre", libelle: "Un indicateur d'une autre nature" },
      ],
      elements: () => [
        { libelle: "L'absentéisme, qui monte depuis 3 mois", montant: 0, categorie: "signal", pourquoi: "Une équipe qui se démotive s'absente plus : un signal." },
        { libelle: "Une pétition signée par toute l'équipe", montant: 0, categorie: "signal", pourquoi: "Une revendication collective, écrite : un signal fort." },
        { libelle: "Les réclamations sur les plannings, chaque semaine", montant: 0, categorie: "signal", pourquoi: "Les plaintes répétées disent un malaise." },
        { libelle: "Le chiffre d'affaires du trimestre", montant: 0, categorie: "autre", pourquoi: "Un indicateur commercial : il ne dit rien, à lui seul, du climat de l'équipe." },
      ],
      relance: "L'observation dit-elle quelque chose de la façon dont l'équipe vit son travail ?",
      explication: () => ["Le climat social se lit par des indicateurs (absentéisme, rotation du personnel, réclamations, conflits) et s'écoute : une enquête de satisfaction ou un entretien disent ce que les chiffres annoncent."],
    },
    {
      id: "les-conflits",
      type: "lecture",
      titre: "Les sources et les formes du conflit",
      texte: () => [
        "Un conflit naît d'une divergence : la rémunération, les conditions de travail, l'organisation, les relations avec un responsable. Il est individuel quand il oppose un salarié à son employeur, collectif quand il porte une revendication commune.",
        "Le conflit collectif prend des formes graduées : la pétition, le débrayage (un arrêt de travail de courte durée), la grève. La grève est un droit constitutionnel : l'arrêt collectif et concerté du travail pour appuyer des revendications professionnelles. Le salarié gréviste n'est pas payé pour le temps d'arrêt ; il ne peut être ni sanctionné, sauf faute lourde, ni remplacé par un salarié en CDD ou en intérim.",
      ],
      repere: () => "Conflit individuel ou collectif · pétition, débrayage, grève · la grève : un droit, sans salaire pour le temps d'arrêt.",
    },
    {
      id: "individuel-ou-collectif",
      objectifs: [1],
      type: "tri",
      titre: "Individuel ou collectif",
      question: () => "Rangez chaque conflit.",
      categories: [
        { code: "individuel", libelle: "Conflit individuel" },
        { code: "collectif", libelle: "Conflit collectif" },
      ],
      elements: () => [
        { libelle: "Un opérateur conteste un avertissement qu'il juge injuste", montant: 0, categorie: "individuel", pourquoi: "Un salarié face à son employeur, sur sa situation : un conflit individuel." },
        { libelle: "Un opérateur réclame le paiement de ses heures supplémentaires", montant: 0, categorie: "individuel", pourquoi: "Sa propre paie : un conflit individuel, qui peut aller aux prud'hommes." },
        { libelle: "L'équipe arrête la ligne pour obtenir une hausse de salaire", montant: 0, categorie: "collectif", pourquoi: "Une revendication commune, portée ensemble : un conflit collectif." },
      ],
      relance: "La revendication concerne-t-elle un seul salarié, ou toute l'équipe ?",
      explication: () => ["Le conflit individuel se règle souvent par le dialogue, sinon devant le conseil de prud'hommes ; le conflit collectif, par la négociation."],
    },
    {
      id: "remplacer-les-grevistes",
      objectifs: [1],
      type: "choix",
      titre: "Pendant la grève",
      question: () => "Pour faire tourner la ligne, le président veut appeler une agence d'intérim pendant la grève. Le peut-il ?",
      options: () => [
        {
          texte: "Non, c'est interdit",
          juste: true,
          retour: "Oui, c'est interdit : le Code du travail défend de recourir à un CDD ou à l'intérim pour remplacer des grévistes. Le droit de grève serait vidé de son sens.",
        },
        {
          texte: "Oui, s'il paie l'agence avec les salaires qu'il retient aux grévistes",
          juste: false,
          retour: "Non : la retenue sur salaire est permise, mais le remplacement des grévistes par des intérimaires est interdit.",
        },
        {
          texte: "Oui, et il peut aussi licencier les grévistes pour abandon de poste",
          juste: false,
          retour: "Non : faire grève n'est pas abandonner son poste. Seule une faute lourde peut justifier une sanction.",
        },
      ],
    },
    {
      id: "le-curseur-du-conflit",
      objectifs: [2],
      type: "curseur",
      titre: "Ce que coûte la grève",
      question: (c) => {
        const g = journeeDeGreve();
        const r = revendication();
        return `En décembre, la ligne de ${c.entreprise} est pleine : chaque enceinte non montée est une vente perdue. Une journée de ${qte(JOURNEE.heures)} heures sans les ${qte(g.operateurs)} opérateurs, c'est ${qte(g.enceintes)} enceintes de moins, à ${eur(g.margeUnitaire)} de marge chacune ; NOVA ne verse pas les salaires de la journée, ${eur(g.salaires)} charges comprises. La hausse refusée aurait coûté ${eur(r.coutDeLAnnee)} sur l'année. Faites varier les jours de grève : une droite donne ce qu'ils coûtent à NOVA, l'autre la hausse refusée. Placez le curseur sur le premier nombre de jours où la grève coûte autant.`;
      },
      cible: () => ({ attendu: joursQuiCoutentLaHausse(), max: 15 }),
      grandeur: () => ({ libelle: "Jours de grève", unite: "jours" }),
      rates: () => ({ dessous: "Pas encore : la grève coûte moins que la hausse.", dessus: "La grève coûte déjà plus, mais un jour de moins suffisait-il ?" }),
      zones: ["La grève coûte plus", "La hausse coûte plus"],
      montrer: "Montrer le nombre de jours",
      lecture: (_c, n) => [
        { libelle: "Coût de la grève pour NOVA", montant: coutDeLaGreve(n), fort: true },
        { libelle: "Coût de la hausse refusée", montant: revendication().coutDeLAnnee },
      ],
      droites: () => ({ produit: (n) => n * journeeDeGreve().cout, cout: () => revendication().coutDeLAnnee, libelles: ["Coût de la grève", "Hausse refusée"] }),
      explication: () => {
        const n = joursQuiCoutentLaHausse();
        const g = journeeDeGreve();
        return [`Une journée coûte ${eur(g.cout)} à NOVA : ${eur(g.marge)} de marge perdue, moins ${eur(g.salaires)} de salaires non versés. Dès ${qte(n)} jours, la grève coûte plus que la hausse refusée. Les opérateurs, eux, perdent leur salaire. Un conflit qui dure appauvrit les deux camps : il faut en sortir.`];
      },
    },
    {
      id: "en-sortir",
      type: "lecture",
      titre: "Comment sortir d'un conflit",
      texte: () => [
        "Le plus souvent, les parties négocient directement : chacune cède sur un point pour obtenir un compromis. Quand elles n'y arrivent pas, un tiers peut les aider.",
        "En conciliation, le tiers les rapproche pour qu'elles trouvent elles-mêmes un accord. En médiation, il propose une solution, qu'elles restent libres d'accepter. En arbitrage, il décide, et les parties se sont engagées d'avance à suivre sa décision.",
      ],
      repere: () => "Négociation · conciliation (rapprocher) · médiation (proposer) · arbitrage (décider).",
    },
    {
      id: "les-modes-de-resolution",
      objectifs: [3],
      type: "tri",
      titre: "Les modes de résolution",
      question: () => "Rangez chaque façon de régler le conflit de NOVA.",
      categories: [
        { code: "negociation", libelle: "Négociation" },
        { code: "conciliation", libelle: "Conciliation" },
        { code: "mediation", libelle: "Médiation" },
        { code: "arbitrage", libelle: "Arbitrage" },
      ],
      elements: () => [
        { libelle: "Le président et l'équipe discutent seuls, et chacun fait un pas", montant: 0, categorie: "negociation", pourquoi: "Sans tiers, les parties cherchent un compromis : la négociation." },
        { libelle: "Un conciliateur les réunit et les aide à renouer le dialogue", montant: 0, categorie: "conciliation", pourquoi: "Le tiers rapproche, sans proposer : la conciliation." },
        { libelle: "Un médiateur rédige une proposition, que chacun peut refuser", montant: 0, categorie: "mediation", pourquoi: "Le tiers propose une solution : la médiation." },
        { libelle: "Un arbitre tranche, et les deux parties s'y étaient engagées", montant: 0, categorie: "arbitrage", pourquoi: "Le tiers décide : l'arbitrage." },
      ],
      relance: "Y a-t-il un tiers ? S'il y en a un, rapproche-t-il, propose-t-il, ou décide-t-il ?",
      explication: () => ["Plus le tiers a de pouvoir, moins les parties gardent la main : on commence par négocier, et l'arbitrage reste rare."],
    },
    {
      id: "le-compromis",
      objectifs: [3],
      type: "choix",
      titre: "La sortie du conflit",
      question: () => "Quelle proposition du président a le plus de chances d'arrêter la grève et de garder l'équipe ?",
      options: () => [
        {
          texte: "Une hausse en partie, et un intéressement aux résultats",
          juste: true,
          retour: "Oui : un compromis fait un pas vers la revendication, et associe l'équipe aux résultats. Chacun peut s'y retrouver, et la discussion reprend sur d'autres sujets.",
        },
        {
          texte: "Rien, et attendre : les opérateurs finiront par reprendre faute de salaire, comme toujours",
          juste: false,
          retour: "Non : la ligne reste arrêtée, et même si l'équipe reprend, la défiance restera. Le conflit reviendra, ou les départs.",
        },
        {
          texte: "La hausse entière, sans rien discuter d'autre",
          juste: false,
          retour: "Non : céder sans négocier règle la crise, mais ne construit rien. La négociation porte sur un ensemble : les salaires, l'organisation, la reconnaissance.",
        },
      ],
    },
    {
      id: "renforcer-la-cohesion",
      objectifs: [4],
      type: "choix",
      titre: "Une tension peut-elle renforcer la cohésion ?",
      question: () => "Après la grève, l'équipe et le président ont signé un accord. Le conflit a-t-il pu renforcer la cohésion de NOVA ?",
      options: () => [
        {
          texte: "Oui, s'il est dépassé par le dialogue",
          juste: true,
          retour: "Oui : le conflit a révélé un problème que l'on ne voyait pas, et l'accord a fixé des règles nouvelles, discutées ensemble. Une tension exprimée et dépassée fait progresser ; une tension niée finit par exploser.",
        },
        {
          texte: "Non : un conflit laisse toujours des traces, l'équipe ne retrouvera jamais sa confiance",
          juste: false,
          retour: "Non : un conflit mal réglé laisse des traces, mais un conflit négocié peut au contraire rétablir la confiance.",
        },
        {
          texte: "Oui, et il faudrait en provoquer régulièrement",
          juste: false,
          retour: "Non : un conflit coûte à tous. Il vaut mieux écouter les signaux du climat social avant qu'il n'éclate.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const g = journeeDeGreve();
        return [
          `Le climat social de ${c.entreprise} se lisait dans ses signaux bien avant la grève. La grève est un droit : l'arrêt du travail n'est pas payé, et les grévistes ne se remplacent pas. Chaque journée coûte ${eur(g.cout)} à NOVA, et dès ${qte(joursQuiCoutentLaHausse())} jours plus que la hausse refusée. La négociation, avec ou sans tiers, mène au compromis ; un conflit dépassé peut renforcer la cohésion.`,
          "Dans l'arène, un salaire trop bas fait partir l'équipe : le conflit qui ne s'exprime pas se lit dans les démissions.",
        ];
      },
      repere: () => "Relations professionnelles · climat social et ses signaux · conflit individuel et collectif · grève · négociation, conciliation, médiation, arbitrage · compromis.",
    },
  ],
};
