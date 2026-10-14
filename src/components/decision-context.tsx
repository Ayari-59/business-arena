import { formatEuro, formatPercent, formatUnits } from "@/lib/format";
import { Signe } from "@/components/signe";
import { Jauge } from "@/components/jauge";
import { Tiroir } from "@/components/tiroir";
import type { GameView } from "@/services/game.service";

/**
 * Ce qu'il faut avoir sous les yeux pour décider, à TOUS les tours.
 *
 * Le tour 1 et les suivants montrent les mêmes panneaux, pour deux raisons :
 * les paramètres ne cessent pas d'être utiles une fois lus, et un élève qui
 * change de tour ne doit pas avoir à se souvenir de la taille des segments.
 * Seule la source de l'arbitrage change : écrit d'avance au tour 1, calculé
 * sur le tour écoulé ensuite.
 */

export interface Route {
  label: string;
  gain: string;
  risque: string;
}

/** L'arbitrage du tour : la question, et deux routes qui se défendent. */
export function DilemmaCard({
  title,
  question,
  routes,
}: {
  title: string;
  question: string;
  routes: readonly Route[];
}) {
  return (
    /*
      Un liseré ambre à gauche suffit à désigner la zone de décision. La carte
      entière teintée en ambre criait plus fort que la question qu'elle porte, et
      passait devant les panneaux qui servent à y répondre.
    */
    /*
      LOT 6E : l'arbitrage n'est pas un bouton. Son liseré et son titre étaient à
      l'orange de l'action ; ils passent à la teinte du métier, en tête d'un
      panneau sans cadre, comme les autres panneaux du cockpit.
    */
    <div className="panneau-info p-3 max-sm:p-4 sm:p-5">
      <h3 className="surtitre text-[color:var(--metier,var(--color-slate-300))]">
        {title}
      </h3>
      {/* La question est le point d'arrivée de l'écran : elle se lit avant tout
          le reste de la carte. */}
      <p className="mt-1.5 text-base font-semibold leading-snug text-slate-50">{question}</p>
      <div className={`mt-3 grid gap-2 ${routes.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {routes.map((route) => (
          <div key={route.label} className="rounded-lg bg-slate-950/50 p-3 sm:p-4">
            <p className="text-sm font-medium text-slate-100">{route.label}</p>
            {/*
              La COULEUR EST DANS LA FLÈCHE, pas dans la phrase. Deux blocs de
              texte, l'un vert l'autre rouge, se lisaient comme une alarme ; la
              flèche dit le sens d'un coup d'œil et laisse la phrase lisible.
              Elle ne dit pas seule : chaque ligne garde son intitulé pour les
              lecteurs d'écran et pour qui ne distingue pas les deux teintes.
            */}
            <p className="mt-2 flex gap-1.5 text-sm leading-snug text-slate-400">
              <Signe sens="gain" className="mt-0.5 text-emerald-400" />
              <span>
                <span className="sr-only">Ce que cela rapporte : </span>
                {route.gain}
              </span>
            </p>
            <p className="mt-1 flex gap-1.5 text-sm leading-snug text-slate-400">
              <Signe sens="cout" className="mt-0.5 text-rose-400" />
              <span>
                <span className="sr-only">Ce que cela coûte : </span>
                {route.risque}
              </span>
            </p>
          </div>
        ))}
      </div>
      {/* Le message essentiel tient en une ligne : il n'y a pas de bonne
          réponse à cocher. Le paragraphe qu'il remplace disait la même chose en
          trois fois plus de mots. */}
      <p className="mt-2.5 text-xs text-slate-400">
        Aucune n&apos;est la bonne réponse — le marché tranchera au tour suivant.
      </p>
    </div>
  );
}

/** Une valeur chiffrée de la fiche : son intitulé, son chiffre, et ce qu'il implique. */
function Chiffre({
  label,
  valeur,
  note,
  accent = false,
}: {
  label: string;
  valeur: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div>
      {/* Deux lignes réservées, comme dans le formulaire : « Trésorerie
          d'ouverture » se replie là où « Prix usuels » tient sur une ligne, et
          sans cette réserve les chiffres de la rangée ne s'alignaient plus. */}
      <p className="libelle min-h-8 leading-4">
        {label}
      </p>
      <p
        className={`tabular-nums text-base max-sm:font-display max-sm:text-2xl ${accent ? "font-bold text-slate-50" : "font-semibold text-slate-100"}`}
      >
        {valeur}
      </p>
      {note ? <p className="text-sm leading-snug text-slate-400">{note}</p> : null}
    </div>
  );
}

/**
 * LE GOULOT, EN DEUX BARRES SUR LA MÊME ÉCHELLE.
 *
 * Machine et main-d'œuvre partagent l'échelle de la plus haute des deux : la
 * plus courte est, littéralement, celle qui vous arrête. Chaque barre porte sa
 * valeur et l'unité (la couleur ne dit rien seule, charte) ; la barre du goulot
 * prend la teinte du métier — c'est la limite de VOTRE entreprise —, l'autre le
 * bleu donnée. « À l'équilibre » quand les deux se valent.
 */
function GoulotEnJauge({
  capacityFacts,
  vocabulary,
}: {
  capacityFacts: NonNullable<GameView["capacityFacts"]>;
  vocabulary: GameView["vocabulary"];
}) {
  const machine = capacityFacts.availableMachineCapacity;
  const labor = capacityFacts.laborCapacity;
  const echelle = Math.max(1, machine, labor);
  const unite = vocabulary.perRoundLabel;
  const machineGoulot = capacityFacts.bottleneck === "machine";
  const laborGoulot = capacityFacts.bottleneck === "labor";
  return (
    <div className="mt-3 space-y-2.5">
      <Jauge
        libelle={vocabulary.capacityLabel}
        valeur={formatUnits(machine)}
        borne={unite}
        fraction={machine / echelle}
        ton={machineGoulot ? "metier" : "donnee"}
        note={machineGoulot ? "le goulot : c'est elle qui plafonne" : undefined}
      />
      <Jauge
        libelle={vocabulary.laborLabel}
        valeur={formatUnits(labor)}
        borne={unite}
        fraction={labor / echelle}
        ton={laborGoulot ? "metier" : "donnee"}
        note={laborGoulot ? "le goulot : c'est elle qui plafonne" : undefined}
      />
    </div>
  );
}

/** Un panneau de paramètres : une carte à plat, ou un tiroir fermé sur téléphone. */
function Panneau({
  repliable,
  titre,
  resume,
  children,
}: {
  repliable: boolean;
  titre: string;
  resume: string;
  children: React.ReactNode;
}) {
  return repliable ? (
    <Tiroir titre={titre} quoi={resume}>
      {children}
    </Tiroir>
  ) : (
    <div className="panneau-info p-3 max-sm:p-4 sm:p-5">
      <h3 className="surtitre text-slate-300">
        {titre}
      </h3>
      {children}
    </div>
  );
}

/**
 * LE DÉTAIL PAR CLIENTÈLE, en tiroir. Sur téléphone il se pose au même niveau que la
 * saison du tour, de même forme : fermés tous deux, ils se replient l'un l'autre
 * (`groupe`) — on lit l'un OU l'autre, et la carte ne s'allonge pas de deux détails.
 */
export function DetailParClientele({
  intro,
  gamme = null,
  groupe,
  ferme = false,
}: {
  intro: GameView["intro"];
  gamme?: GameView["gamme"];
  groupe?: string;
  ferme?: boolean;
}) {
  const showShare = intro.segments.some((s) => s.yourShare !== null);
  // Le détail par clientèle est une donnée de travail, pas un élément de cadrage :
  // replié, il n'encombre pas l'écran de décision, et reste à un clic pour qui ajuste
  // son prix segment par segment.
  return (
        <Tiroir
          titre="Détail par clientèle"
          groupe={groupe}
          ferme={ferme}
          quoi={`${intro.segments.length} clientèle${intro.segments.length > 1 ? "s" : ""}`}
        >
          <div>
            {/*
              En portrait, un tableau à cinq colonnes force soit un défilement
              horizontal, soit des noms de clientèle repliés sur trois lignes. Sur
              petit écran on montre donc UNE CARTE PAR CLIENTÈLE (nom en tête, ses
              chiffres en grille) ; le tableau reprend dès `sm`.
            */}
            <ul className="mt-2 space-y-2 sm:hidden">
              {intro.segments.map((seg) => {
                // Les noms portent souvent un qualificatif entre parenthèses
                // (« Étudiants (sensibles au prix) »). Laissé d'un bloc, il s'enroule
                // sur le petit écran, parenthèse ouverte en haut, fermée en bas. On
                // le détache : nom en tête, qualificatif en sous-titre, sans
                // parenthèses.
                const m = seg.name.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
                const nom = m ? m[1] : seg.name;
                const qualif = m ? m[2] : null;
                return (
                  <li
                    key={seg.name}
                    className="rounded-lg bg-slate-950/50 p-3 sm:p-4"
                  >
                    <p className="text-sm font-semibold text-slate-100">{nom}</p>
                    {qualif ? <p className="mt-0.5 text-xs text-slate-400">{qualif}</p> : null}
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                      <div>
                        <dt className="libelle">Taille</dt>
                        <dd className="tabular-nums text-slate-300">{formatUnits(seg.size)}</dd>
                      </div>
                      <div>
                        <dt className="libelle">
                          Prix usuel
                        </dt>
                        <dd className="tabular-nums text-slate-300">{formatEuro(seg.refPrice)}</dd>
                      </div>
                      {showShare ? (
                        <div>
                          <dt className="libelle">
                            Votre part
                          </dt>
                          <dd className="tabular-nums text-slate-100">
                            {seg.yourShare === null ? "—" : formatPercent(seg.yourShare)}
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="libelle">
                          Règlement
                        </dt>
                        <dd className="text-slate-400">
                          {seg.paymentDelayDays > 0 ? `à ${seg.paymentDelayDays} j` : "comptant"}
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="libelle text-left">
                    <th className="pb-1 pr-3 font-medium">Clientèle</th>
                    <th className="pb-1 pr-3 text-right font-medium">Taille</th>
                    <th className="pb-1 pr-3 text-right font-medium">Prix usuel</th>
                    {showShare ? (
                      <th className="pb-1 pr-3 text-right font-medium">Votre part</th>
                    ) : null}
                    <th className="pb-1 font-medium">Règlement</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {intro.segments.map((seg) => (
                    <tr key={seg.name} className="border-t border-white/5">
                      <td className="py-1.5 pr-3">{seg.name}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">
                        {formatUnits(seg.size)}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">
                        {formatEuro(seg.refPrice)}
                      </td>
                      {showShare ? (
                        <td className="py-1.5 pr-3 text-right tabular-nums text-slate-100">
                          {seg.yourShare === null ? "—" : formatPercent(seg.yourShare)}
                        </td>
                      ) : null}
                      <td className="py-1.5 text-slate-400">
                        {seg.paymentDelayDays > 0 ? `à ${seg.paymentDelayDays} j` : "comptant"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Le prix usuel est celui auquel cette clientèle a l&apos;habitude d&apos;acheter, pas
              une consigne.{" "}
              {gamme
                ? "Vous fixez UN prix par référence, pour toutes ses clientèles."
                : "Vous fixez UN prix pour tout le monde."}
            </p>
          </div>
        </Tiroir>
  );
}

/** Les paramètres : ce que vaut l'entreprise, et le marché où elle vend. */
export function ParametersPanels({
  intro,
  vocabulary,
  capacityFacts,
  gamme = null,
  repliable = false,
  sansDetail = false,
}: {
  intro: GameView["intro"];
  vocabulary: GameView["vocabulary"];
  capacityFacts: GameView["capacityFacts"];
  /** Gamme du scénario joué : les coûts se lisent alors référence par référence. */
  gamme?: GameView["gamme"];
  /**
   * Sur téléphone, chaque panneau se range dans un tiroir fermé dont le résumé
   * garde le chiffre qui compte. Ce sont des chiffres qu'on CONSULTE, pas des
   * champs qu'on remplit : les ranger ne cache aucune décision, et ils pesaient
   * plus de la moitié de l'écran « Situation » (515 px sur 1 440).
   */
  repliable?: boolean;
  /** Le détail par clientèle se range ailleurs (téléphone : à côté de la saison, même forme). */
  sansDetail?: boolean;
}) {
  const showShare = intro.segments.some((s) => s.yourShare !== null);
  // Le marché en un chiffre : ce qui s'achète en tout, et dans quelle fourchette
  // de prix. C'est ce qu'il faut pour dimensionner un volume ; le détail par
  // clientèle vient juste après, à la demande.
  const marcheTotal = intro.segments.reduce((t, s) => t + s.size, 0);
  const prixUsuels = intro.segments.map((s) => s.refPrice);
  const prixMin = Math.min(...prixUsuels);
  const prixMax = Math.max(...prixUsuels);
  // Le plafond physique n'est pas toujours celui qui vous arrête : un cabinet a
  // des bureaux pour bien plus de consultants qu'il n'en emploie. Annoncer les
  // locaux sans dire que l'effectif plafonne bien plus bas induirait l'élève en
  // erreur dès le volume qu'il saisit.
  const mainDoeuvreLimite = capacityFacts?.bottleneck === "labor";
  /*
   * ET LE PLAFOND ANNONCÉ N'EST PAS CELUI D'UN ATELIER NEUF. Le moteur produit
   * sous `machineCapacity × availability`, et la disponibilité s'use dès que
   * l'entretien passe sous le budget de référence. Le panneau annonçait la
   * capacité nominale : une équipe descendue à 82 % lisait un plafond qu'elle
   * ne pouvait plus atteindre, sans que rien ne le dise. C'est le même défaut
   * que celui du goulot de main-d'œuvre, sur l'autre plafond.
   *
   * On multiplie `intro.capacity`, qui est la capacité EN SERVICE, et non celle
   * du panneau de décision, qui compte aussi l'équipement commandé et pas
   * encore livré : la note dirait sinon disponible ce qui n'est pas là.
   */
  const disponibilite = capacityFacts?.availability ?? 1;
  const usee = disponibilite < 0.995;

  // Le résumé d'un panneau replié : ce qu'il faut pour décider sans l'ouvrir.
  const capaciteEnService = mainDoeuvreLimite && capacityFacts
    ? capacityFacts.laborCapacity
    : intro.capacity * disponibilite;
  const resumeEntreprise = `${formatUnits(capaciteEnService)} ${vocabulary.perRoundLabel} · trésorerie ${formatEuro(intro.cash)}`;
  const resumeMarche = `${formatUnits(marcheTotal)} · ${
    prixMin === prixMax ? formatEuro(prixMin) : `${formatEuro(prixMin)} – ${formatEuro(prixMax)}`
  }`;
  return (
    <div className={repliable ? "space-y-3" : "grid gap-4 lg:grid-cols-2"}>
      <Panneau repliable={repliable} titre="Votre entreprise" resume={resumeEntreprise}>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Chiffre
            label={vocabulary.capacityLabel}
            valeur={`${formatUnits(
              mainDoeuvreLimite && capacityFacts
                ? capacityFacts.laborCapacity
                : intro.capacity * disponibilite,
            )}`}
            note={
              mainDoeuvreLimite
                ? `${vocabulary.laborLabel} : la vraie limite`
                : usee
                  ? `${Math.round(disponibilite * 100)} % de disponibilité, sur ${formatUnits(intro.capacity)} à l'état neuf`
                  : vocabulary.perRoundLabel
            }
            accent={mainDoeuvreLimite || usee}
          />
          <Chiffre
            label="Charges de structure"
            valeur={formatEuro(intro.fixedCostsPerRound)}
            note="par tour, que vous vendiez ou non"
          />
          {gamme ? null : (
            <Chiffre
              label="Coût variable"
              valeur={formatEuro(intro.variableCostPerUnit)}
              note={`par ${vocabulary.unit} vendu`}
            />
          )}
          <Chiffre label="Trésorerie d'ouverture" valeur={formatEuro(intro.cash)} />
        </div>
        {/* ── LE GOULOT, EN JAUGE ──
            Machine et main-d'œuvre sur la même échelle : la plus courte est
            celle qui vous arrête. La valeur et la borne restent écrites ; la
            barre ne fait que montrer laquelle plafonne (jauge.tsx). */}
        {capacityFacts ? (
          <GoulotEnJauge capacityFacts={capacityFacts} vocabulary={vocabulary} />
        ) : null}
        {/* Une gamme a un coût variable par référence : un seul chiffre mentirait. */}
        {gamme ? (
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            <span className="text-slate-400">Coût variable : </span>
            {gamme.map((p, i) => (
              <span key={p.code}>
                {i > 0 ? " · " : ""}
                {p.name}{" "}
                <span className="tabular-nums text-slate-200">
                  {formatEuro(p.materialCostPerUnit + p.otherVariableCostPerUnit)}
                </span>
              </span>
            ))}
          </p>
        ) : null}
        {intro.competitors.length > 0 ? (
          <p className="mt-2 text-xs text-slate-400">
            <span className="text-slate-400">Face à vous : </span>
            <span className="text-slate-300">{intro.competitors.join(", ")}</span>
          </p>
        ) : null}
      </Panneau>

      <Panneau repliable={repliable} titre="Le marché" resume={resumeMarche}>
        {/*
          « Le marché », et non « Le marché EN FACE DE VOUS ». Deux raisons.
          L'image servait déjà deux lignes plus haut, pour les concurrents
          (« Face à vous : … ») ; et elle rangeait le marché du mauvais côté. Ce
          qui est en face, ce sont les concurrents ; le marché, lui, est ce à qui
          l'on vend.

          « VOTRE marché » serait faux, et pas seulement maladroit : ce panneau
          montre « Marché total » et, juste à côté, « Votre part ». Le marché est
          commun à toutes les équipes de la classe, et ce qui est à vous n'en est
          qu'une part — c'est justement l'enjeu du tour. Le possessif de « Votre
          entreprise », en vis-à-vis, suffit à dire lequel des deux est à vous.
        */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Chiffre
            label="Marché total"
            valeur={formatUnits(marcheTotal)}
            note={`${intro.segments.length} clientèle${intro.segments.length > 1 ? "s" : ""}`}
          />
          <Chiffre
            label="Prix usuels"
            valeur={
              prixMin === prixMax
                ? formatEuro(prixMin)
                : `${formatEuro(prixMin)} – ${formatEuro(prixMax)}`
            }
            note="ce qu'elles ont l'habitude de payer"
          />
          {showShare ? (
            <Chiffre
              label="Votre part"
              valeur={(() => {
                const vendu = intro.segments.reduce(
                  (t, s) => t + (s.yourShare ?? 0) * s.size,
                  0,
                );
                return marcheTotal > 0 ? formatPercent(vendu / marcheTotal) : "—";
              })()}
              note="du marché total"
              accent
            />
          ) : null}
        </div>

        {sansDetail ? null : <DetailParClientele intro={intro} gamme={gamme} />}
      </Panneau>
    </div>
  );
}
