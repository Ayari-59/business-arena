/**
 * CE QUE L'ARÈNE NE TRAVAILLERA PAS, ET POURQUOI.
 *
 * Le tableau de couverture dit « non travaillé » d'une entrée que rien ne
 * travaille encore : c'est une promesse en creux, celle d'un chapitre, d'un
 * épisode ou d'une séance à venir. Pour quelques entrées, cette promesse
 * serait fausse. La seconde SES est un enseignement commun : ses questions
 * d'économie touchent la gestion, ses questions de sociologie et de science
 * politique non. Une situation d'entreprise écrite pour « cocher » la
 * socialisation ou la vie politique serait une tricherie, et le relevé des
 * épisodes l'a écarté pour cette raison.
 *
 * Ces entrées restent au tableau, dans l'ordre du texte, avec la raison écrite :
 * l'enseignant voit ce que l'arène laisse aux autres outils, au lieu de croire
 * qu'il manque quelque chose. La garde vérifie que chaque entrée désigne bien
 * une entrée du texte, et qu'aucune n'est à la fois travaillée et déclarée hors
 * du champ.
 */
export const HORS_DU_CHAMP: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "seconde-ses": {
    "Comment les économistes, les sociologues et les politistes raisonnent-ils et travaillent-ils ?":
      "La question porte sur la démarche de trois disciplines. Les épisodes font pratiquer une part de celle de l'économiste, l'hypothèse et le groupe témoin, mais rien de la sociologie ni de la science politique : ils peuvent servir d'exercice, pas couvrir la question.",
    "Comment devenons-nous des acteurs sociaux ?":
      "La socialisation relève de la sociologie : aucune situation d'entreprise ne la travaille sans la déformer.",
    "Comment s'organise la vie politique ?":
      "La vie politique relève de la science politique : un dialogue social dans une entreprise n'en est pas une.",
  },
  // Audit pédagogique (P1-3) : les unités du DCG et du DSCG que le cours ne travaille pas, et ne
  // travaillera pas, sont dites hors de son champ au lieu de paraître comme des manques. L'UE10 du
  // DCG (comptabilité approfondie) n'y est pas : elle est dans le champ, et le parcours « DCG ·
  // Comptabilité approfondie » la travaille (config/cours/registre.ts).
  dcg: {
    "UE1 · Fondamentaux du droit": "Le droit se travaille sur des textes, des contrats et de la jurisprudence ; la simulation chiffre des décisions de gestion, elle ne fait pas raisonner en droit.",
    "UE2 · Droit des affaires": "Le droit des sociétés et des contrats commerciaux sort du champ d'une simulation de gestion : le cours n'en prépare pas les épreuves.",
    "UE3 · Droit social": "Le cours chiffre la paie et ses cotisations ; le droit du travail lui-même (contrat, licenciement, représentation) n'y est pas travaillé.",
    "UE5 · Économie contemporaine": "L'économie contemporaine porte sur la croissance, la monnaie et les politiques publiques, à l'échelle d'un pays : la simulation ne montre que des marchés d'entreprises.",
    "UE8 · Système d'information de gestion": "Les bases de données, les processus et l'architecture des systèmes d'information demandent un environnement informatique que le cours ne fournit pas.",
    "UE12 · Anglais des affaires": "Le cours est écrit en français : il ne prépare pas une épreuve de langue.",
  },
  dscg: {
    "UE1 · Gestion juridique, fiscale et sociale": "Le montage juridique et fiscal des groupes se travaille sur des dossiers de droit, hors du champ d'une simulation de gestion.",
    "UE4 · Comptabilité et audit": "La consolidation et l'audit légal supposent des groupes et des dossiers de révision que la simulation du cours ne modélise pas.",
    "UE5 · Management des systèmes d'information": "La gouvernance et l'audit des systèmes d'information demandent un environnement informatique que le cours ne fournit pas.",
    "UE6 · Anglais des affaires": "Le cours est écrit en français : il ne prépare pas une épreuve de langue.",
    "UE7 · Mémoire professionnel": "Le mémoire se rédige sur l'expérience professionnelle du candidat : aucun contenu de cours ne le remplace.",
  },
};

/** La raison pour laquelle l'entrée est hors du champ de l'arène, ou undefined. */
export function raisonHorsDuChamp(formation: string, entree: string): string | undefined {
  return HORS_DU_CHAMP[formation]?.[entree];
}
