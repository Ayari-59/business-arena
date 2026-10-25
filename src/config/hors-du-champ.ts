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
};

/** La raison pour laquelle l'entrée est hors du champ de l'arène, ou undefined. */
export function raisonHorsDuChamp(formation: string, entree: string): string | undefined {
  return HORS_DU_CHAMP[formation]?.[entree];
}
