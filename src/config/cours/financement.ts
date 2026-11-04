/**
 * LES CONDITIONS DU FINANCEMENT : CE QUE LE COURS SUPPOSE, ET POURQUOI.
 *
 * Les chapitres de gestion et finance prennent leurs chiffres dans l'arène : les comptes de
 * l'année, le bilan, le taux de l'emprunt. Ce que l'arène ne joue pas, l'avis d'un banquier sur
 * une demande de prêt, est posé ici, une fois, avec sa raison.
 */

/**
 * L'endettement que le cours juge raisonnable : des emprunts au plus égaux aux capitaux propres.
 * C'est la règle de prudence que la plupart des banques appliquent à une petite entreprise (un
 * euro prêté pour un euro apporté par les associés) ; au-delà, elles demandent d'abord un apport.
 * Les chapitres s'en servent pour juger un endettement et départager l'emprunt et l'apport, pas
 * pour dire ce qu'une banque accordera à une entreprise donnée.
 */
export const ENDETTEMENT_MAXIMAL = 1;

/**
 * LA CAPACITÉ DE REMBOURSEMENT QUE LE COURS JUGE RAISONNABLE : des dettes financières au plus égales
 * à quatre années de capacité d'autofinancement. C'est la règle que les banques appliquent le plus
 * souvent à une petite entreprise (les analystes la placent entre trois et quatre ans) : en
 * consacrant tout ce que son activité dégage, l'entreprise rembourserait ses emprunts en quatre ans
 * au plus. Au-delà, la banque hésite à prêter davantage.
 */
export const CAPACITE_DE_REMBOURSEMENT_MAXIMALE = 4;

/**
 * L'INDÉPENDANCE FINANCIÈRE MINIMALE : des capitaux propres qui font au moins la moitié des
 * ressources durables. En dessous, l'entreprise doit plus à ses prêteurs qu'à ses associés sur le
 * long terme, et les banques demandent d'abord un apport. Les ressources durables sont celles du
 * fonds de roulement (monde/comptes-du-lycee.ts) : capitaux propres, amortissements et
 * dépréciations, provisions, emprunts.
 */
export const INDEPENDANCE_MINIMALE = 0.5;
