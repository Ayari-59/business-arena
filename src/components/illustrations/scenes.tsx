import {
  ACCENT,
  ACCENT_TRAIT,
  BLANC,
  Buste,
  MARINE as M,
  OMBRE,
  OmbreAuSol,
  Piece,
  Tete,
} from "./trait";

/**
 * LES SCÈNES DES ENTREPRISES (lot 6B) : un lieu reconnaissable au premier coup
 * d'œil, une ou deux personnes au travail. Format 16:9, `viewBox` 480 × 270.
 * Ce qui compte se tient dans la bande du milieu (y de 60 à 215) : sur une
 * feuille large, la scène se recadre en bandeau et garde ses personnes.
 */

/** Deux jambes sous un buste, du bas du buste au sol. */
function Jambes({ x, haut, sol }: { x: number; haut: number; sol: number }) {
  return (
    <g fill={M.nuit}>
      <rect x={x - 10} y={haut - 2} width={8} height={sol - haut + 2} />
      <rect x={x + 2} y={haut - 2} width={8} height={sol - haut + 2} />
    </g>
  );
}

/** Une main, un rond de peau. */
function Main({ x, y, peau = BLANC }: { x: number; y: number; peau?: string }) {
  return <circle cx={x} cy={y} r={3.5} fill={peau} />;
}

/** NOVA : l'atelier d'enceintes, l'établi et la cabine d'écoute. */
export function SceneAtelier() {
  return (
    <>
      <Piece />
      <polygon points="332,108 442,108 470,270 300,270" fill={BLANC} opacity={0.05} />
      <rect x={326} y={26} width={122} height={86} fill={M.filet} />
      <g fill={M.champ}>
        <rect x={332} y={32} width={53} height={35} />
        <rect x={389} y={32} width={53} height={35} />
        <rect x={332} y={71} width={53} height={35} />
        <rect x={389} y={71} width={53} height={35} />
      </g>
      {/* les étagères d'enceintes finies */}
      <rect x={24} y={70} width={150} height={5} fill={M.filet} />
      <rect x={24} y={134} width={150} height={5} fill={M.filet} />
      <g style={ACCENT}>
        <rect x={34} y={24} width={34} height={46} rx={2} />
        <rect x={82} y={24} width={34} height={46} rx={2} />
        <rect x={130} y={34} width={34} height={36} rx={2} />
        <rect x={34} y={88} width={34} height={46} rx={2} />
        <rect x={82} y={98} width={34} height={36} rx={2} />
      </g>
      <g fill={M.fond}>
        <circle cx={51} cy={56} r={9} />
        <circle cx={51} cy={36} r={4} />
        <circle cx={99} cy={56} r={9} />
        <circle cx={99} cy={36} r={4} />
        <circle cx={147} cy={56} r={7} />
        <circle cx={51} cy={120} r={9} />
        <circle cx={51} cy={100} r={4} />
        <circle cx={99} cy={120} r={7} />
      </g>
      <rect x={130} y={100} width={34} height={34} rx={2} fill={M.filet} />
      <OmbreAuSol x={256} y={242} rx={104} ry={7} />
      <OmbreAuSol x={418} y={234} rx={52} />
      {/* l'assembleur, en blouse */}
      <Buste x={206} y={130} bas={176} couleur={M.filet} />
      <path d="M197 142L215 142L218 176L194 176Z" fill={BLANC} opacity={0.9} />
      <Tete x={206} y={130} coiffure="courte" sens={1} />
      {/* la monteuse, qui tend la main vers l'enceinte */}
      <Buste x={306} y={128} bas={176} couleur={M.champ} />
      <path d="M294 136L264 152L268 159L298 146Z" fill={M.champ} />
      <Main x={266} y={156} />
      <Tete x={306} y={128} coiffure="queue" sens={-1} />
      {/* l'établi et l'enceinte en montage */}
      <rect x={236} y={138} width={40} height={34} rx={2} style={ACCENT} />
      <circle cx={256} cy={158} r={9} fill={M.fond} />
      <rect x={164} y={172} width={180} height={10} fill={M.filet} />
      <rect x={164} y={172} width={180} height={2} fill={BLANC} opacity={0.18} />
      <rect x={174} y={182} width={8} height={58} fill={M.champ} />
      <rect x={326} y={182} width={8} height={58} fill={M.champ} />
      <rect x={292} y={165} width={22} height={7} rx={1} fill={BLANC} />
      {/* la cabine d'écoute, son voyant allumé */}
      <rect x={378} y={118} width={80} height={114} fill={M.champ} />
      <rect x={378} y={118} width={80} height={4} style={ACCENT} />
      <rect x={392} y={136} width={52} height={30} fill={M.fond} />
      <rect x={396} y={140} width={44} height={22} fill={BLANC} opacity={0.12} />
      <rect x={404} y={176} width={28} height={56} fill={M.mur} />
      <circle cx={427} cy={206} r={2.5} fill={BLANC} />
      <circle cx={418} cy={106} r={6} style={ACCENT} />
      <rect x={417} y={110} width={2} height={8} fill={M.filet} />
    </>
  );
}

/** Un pull sur son cintre, `x` au centre, `y` au haut des épaules. */
function Pull({
  x,
  y,
  fill,
  accent = false,
}: {
  x: number;
  y: number;
  fill?: string;
  accent?: boolean;
}) {
  return (
    <g>
      <path
        d={`M${x - 12} ${y + 2}L${x} ${y - 4}L${x + 12} ${y + 2}`}
        fill="none"
        stroke={OMBRE}
        strokeWidth={2}
      />
      <path
        d={`M${x - 12} ${y}L${x + 12} ${y}L${x + 19} ${y + 19}L${x + 14} ${y + 22}L${x + 12} ${y + 14}L${x + 12} ${y + 40}L${x - 12} ${y + 40}L${x - 12} ${y + 14}L${x - 14} ${y + 22}L${x - 19} ${y + 19}Z`}
        fill={fill}
        style={accent ? ACCENT : undefined}
      />
      <ellipse cx={x} cy={y} rx={5} ry={2.5} fill={M.fond} />
      <rect x={x - 12} y={y + 35} width={24} height={5} fill={M.nuit} opacity={0.25} />
    </g>
  );
}

/** MAILLE & CO : la boutique, son portant de pulls, sa vitrine et ses pelotes. */
export function SceneBoutique() {
  return (
    <>
      <Piece />
      {/* la vitrine sur la rue, et le store qu'on voit à travers */}
      <polygon points="28,188 132,188 170,270 0,270" fill={BLANC} opacity={0.05} />
      <rect x={20} y={30} width={120} height={166} fill={M.filet} />
      <rect x={28} y={38} width={104} height={150} fill={M.champ} />
      <polygon points="28,52 78,52 28,120" fill={BLANC} opacity={0.06} />
      <rect x={28} y={38} width={104} height={8} style={ACCENT} />
      <g style={ACCENT}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle key={i} cx={34.5 + i * 13} cy={46} r={6.5} />
        ))}
      </g>
      {/* le mannequin de vitrine */}
      <rect x={79} y={146} width={3} height={40} fill={M.nuit} />
      <ellipse cx={80.5} cy={187} rx={14} ry={3} fill={M.nuit} />
      <circle cx={80} cy={80} r={5} fill={OMBRE} />
      <path d="M63 92Q80 84 97 92L99 120Q93 130 95 148L65 148Q67 130 61 120Z" style={ACCENT} />
      <rect x={65} y={142} width={30} height={6} fill={M.nuit} opacity={0.25} />
      {/* le portant */}
      <rect x={166} y={68} width={124} height={4} fill={OMBRE} />
      <rect x={168} y={68} width={4} height={126} fill={OMBRE} />
      <rect x={284} y={68} width={4} height={126} fill={OMBRE} />
      <rect x={160} y={192} width={20} height={4} fill={OMBRE} />
      <rect x={276} y={192} width={20} height={4} fill={OMBRE} />
      <Pull x={192} y={82} accent />
      <Pull x={216} y={82} fill={BLANC} />
      <Pull x={240} y={82} fill={M.releve} />
      <Pull x={264} y={82} accent />
      {/* la cliente, qui décroche un pull */}
      <OmbreAuSol x={142} y={198} rx={22} ry={4} />
      <Jambes x={142} haut={170} sol={198} />
      <Buste x={142} y={120} bas={172} largeur={28} couleur={M.releve} />
      <path d="M152 126L172 104L177 108L158 134Z" fill={M.releve} />
      <Main x={175} y={104} />
      <Tete x={142} y={120} coiffure="chignon" sens={1} />
      {/* le panier de pelotes */}
      <g>
        <circle cx={304} cy={176} r={9} style={ACCENT} />
        <circle cx={320} cy={172} r={9} fill={BLANC} />
        <circle cx={334} cy={178} r={8} style={ACCENT} />
        <g fill="none" stroke={M.nuit} strokeWidth={1.5} opacity={0.3}>
          <path d="M297 172Q304 178 312 174" />
          <path d="M313 169Q320 175 328 170" />
          <path d="M328 176Q334 181 341 177" />
        </g>
        <path d="M294 180L344 180L338 198L300 198Z" fill={M.releve} />
        <rect x={294} y={180} width={50} height={3} fill={BLANC} opacity={0.15} />
      </g>
      {/* les étagères de mailles pliées */}
      <rect x={350} y={62} width={116} height={4} fill={M.filet} />
      {[
        { x: 356, c: [true, false, true] },
        { x: 392, c: [false, true, false, true] },
        { x: 428, c: [true, false] },
      ].map((pile) =>
        pile.c.map((accent, i) => (
          <g key={`${pile.x}-${i}`}>
            <rect
              x={pile.x}
              y={54 - i * 9}
              width={30}
              height={8}
              rx={2}
              fill={accent ? undefined : i % 2 ? OMBRE : BLANC}
              style={accent ? ACCENT : undefined}
            />
            <rect x={pile.x} y={58 - i * 9} width={30} height={1} fill={M.nuit} opacity={0.2} />
          </g>
        )),
      )}
      {/* la vendeuse, derrière son comptoir */}
      <Buste x={402} y={112} bas={150} largeur={28} couleur={M.fond} />
      <path d="M396 112L402 124L408 112Z" fill={BLANC} />
      <Tete x={402} y={112} coiffure="carre" sens={-1} />
      <rect x={372} y={136} width={30} height={9} rx={2} style={ACCENT} />
      <Main x={374} y={141} />
      <Main x={400} y={141} />
      <OmbreAuSol x={408} y={198} rx={66} ry={4} />
      <rect x={350} y={150} width={120} height={46} fill={M.champ} />
      <rect x={344} y={144} width={132} height={6} fill={M.filet} />
      <rect x={344} y={144} width={132} height={2} fill={BLANC} opacity={0.18} />
      <rect x={350} y={156} width={120} height={3} style={ACCENT} />
      <rect x={440} y={124} width={24} height={16} rx={1} fill={M.nuit} />
      <rect x={444} y={128} width={16} height={8} fill={BLANC} opacity={0.12} />
      <rect x={449} y={140} width={6} height={4} fill={M.nuit} />
    </>
  );
}

/** L'ESCALE : la réception, le tableau des clés, la sonnette et la valise. */
export function SceneHotel() {
  return (
    <>
      <Piece sol={200} />
      {/* le tableau des clés : les cases vides sont des chambres occupées */}
      <rect x={34} y={30} width={154} height={86} fill={M.filet} />
      <rect x={38} y={34} width={146} height={78} fill={M.champ} />
      {[0, 1, 2].map((ligne) =>
        [0, 1, 2, 3, 4, 5].map((col) => {
          const x = 41 + col * 24;
          const y = 37 + ligne * 25;
          const cle = (ligne * 6 + col) % 3 !== 1;
          return (
            <g key={`${ligne}-${col}`}>
              <rect x={x} y={y} width={20} height={22} fill={M.fond} />
              {cle ? (
                <>
                  <circle cx={x + 10} cy={y + 5} r={2} fill={OMBRE} />
                  <rect x={x + 7} y={y + 7} width={6} height={11} rx={2} style={ACCENT} />
                </>
              ) : null}
            </g>
          );
        }),
      )}
      {/* les appliques */}
      {[236, 410].map((x) => (
        <g key={x}>
          <polygon
            points={`${x - 8},70 ${x + 8},70 ${x + 30},200 ${x - 30},200`}
            fill={BLANC}
            opacity={0.04}
          />
          <rect x={x - 1} y={58} width={2} height={8} fill={M.filet} />
          <path d={`M${x - 9} 72L${x + 9} 72L${x + 5} 58L${x - 5} 58Z`} style={ACCENT} />
        </g>
      ))}
      {/* l'ascenseur */}
      <rect x={436} y={58} width={40} height={142} fill={M.filet} />
      <rect x={440} y={64} width={15} height={136} fill={M.champ} />
      <rect x={457} y={64} width={15} height={136} fill={M.champ} />
      <circle cx={456} cy={48} r={4} style={ACCENT} />
      {/* la réceptionniste */}
      <Buste x={124} y={102} bas={142} largeur={30} couleur={M.fond} />
      <path d="M118 102L124 115L130 102Z" fill={BLANC} />
      <Tete x={124} y={102} coiffure="chignon" sens={1} />
      {/* le comptoir de réception, l'écran et la sonnette */}
      <OmbreAuSol x={166} y={204} rx={140} ry={5} />
      <rect x={160} y={114} width={36} height={24} fill={M.nuit} />
      <rect x={175} y={138} width={6} height={4} fill={M.nuit} />
      <rect x={30} y={148} width={270} height={52} fill={M.releve} />
      <rect x={24} y={140} width={282} height={9} fill={M.filet} />
      <rect x={24} y={140} width={282} height={2} fill={BLANC} opacity={0.18} />
      <rect x={30} y={162} width={270} height={4} style={ACCENT} />
      <g fill={M.champ}>
        {[96, 165, 234].map((x) => (
          <rect key={x} x={x} y={170} width={2} height={30} />
        ))}
      </g>
      <rect x={238} y={136} width={24} height={4} rx={1} fill={OMBRE} />
      <path d="M240 136A10 10 0 0 1 260 136Z" fill={BLANC} />
      <rect x={249} y={122} width={2} height={5} fill={BLANC} />
      {/* le voyageur et sa valise */}
      <OmbreAuSol x={384} y={202} rx={42} ry={4} />
      <Jambes x={362} haut={170} sol={200} />
      <Buste x={362} y={112} bas={172} largeur={32} couleur={M.champ} />
      <Tete x={362} y={112} coiffure="boucles" sens={-1} />
      <path d="M372 122L402 124L402 131L372 132Z" fill={M.champ} />
      <rect x={398} y={152} width={34} height={46} rx={3} style={ACCENT} />
      <rect x={398} y={170} width={34} height={3} fill={M.nuit} opacity={0.25} />
      <rect x={407} y={128} width={2} height={24} fill={OMBRE} />
      <rect x={421} y={128} width={2} height={24} fill={OMBRE} />
      <rect x={405} y={124} width={20} height={4} rx={1} fill={OMBRE} />
      <Main x={404} y={127} />
      <circle cx={403} cy={199} r={3.5} fill={M.nuit} />
      <circle cx={427} cy={199} r={3.5} fill={M.nuit} />
    </>
  );
}

/** Une bouteille d'étagère, posée sur `y`. */
function Bouteille({
  x,
  y,
  h,
  fill,
  accent = false,
}: {
  x: number;
  y: number;
  h: number;
  fill?: string;
  accent?: boolean;
}) {
  return (
    <path
      d={`M${x - 5} ${y}L${x - 5} ${y - h + 8}Q${x - 5} ${y - h + 4} ${x - 2} ${y - h + 3}L${x - 2} ${y - h}L${x + 2} ${y - h}L${x + 2} ${y - h + 3}Q${x + 5} ${y - h + 4} ${x + 5} ${y - h + 8}L${x + 5} ${y}Z`}
      fill={fill}
      style={accent ? ACCENT : undefined}
    />
  );
}

/** Une chaise de bistrot vue de profil, le dossier du côté `sens`. */
function Chaise({ x, sens }: { x: number; sens: 1 | -1 }) {
  const dos = x + sens * 10;
  return (
    <g fill="none" stroke={M.nuit} strokeWidth={3} strokeLinecap="round">
      <path d={`M${x - 10} 174L${x + 10} 174`} />
      <path d={`M${dos} 174Q${dos + sens * 3} 156 ${dos - sens * 1} 144`} />
      <path d={`M${x - 9} 175L${x - 11} 198M${x + 9} 175L${x + 11} 198`} />
    </g>
  );
}

/** LA TABLE D'AUGUSTIN : la salle, l'ardoise, le serveur et son plateau. */
export function SceneBistrot() {
  return (
    <>
      <Piece sol={200} />
      {/* la grande vitre et son brise-bise */}
      <polygon points="46,154 234,154 270,270 10,270" fill={BLANC} opacity={0.04} />
      <rect x={30} y={28} width={196} height={132} fill={M.filet} />
      <rect x={36} y={34} width={89} height={120} fill={M.champ} />
      <rect x={131} y={34} width={89} height={120} fill={M.champ} />
      <rect x={34} y={98} width={188} height={3} fill={OMBRE} />
      <rect x={36} y={101} width={184} height={53} fill={M.releve} />
      <g fill={M.fond} opacity={0.35}>
        {[54, 78, 102, 126, 150, 174, 198].map((x) => (
          <rect key={x} x={x} y={101} width={2} height={53} />
        ))}
      </g>
      {/* l'ardoise du jour : des lignes, pas de mots */}
      <rect x={244} y={36} width={74} height={96} fill={M.filet} />
      <rect x={248} y={40} width={66} height={88} fill={M.nuit} />
      <rect x={256} y={50} width={36} height={4} style={ACCENT} />
      <g fill={BLANC} opacity={0.5}>
        <rect x={256} y={64} width={50} height={2.5} />
        <rect x={256} y={74} width={40} height={2.5} />
        <rect x={256} y={84} width={46} height={2.5} />
        <rect x={256} y={100} width={34} height={2.5} />
        <rect x={256} y={110} width={48} height={2.5} />
      </g>
      {/* les suspensions */}
      {[96, 324].map((x) => (
        <g key={x}>
          <polygon
            points={`${x - 10},40 ${x + 10},40 ${x + 40},170 ${x - 40},170`}
            fill={BLANC}
            opacity={0.05}
          />
          <rect x={x - 0.75} y={0} width={1.5} height={30} fill={M.filet} />
          <path d={`M${x - 14} 42Q${x} 22 ${x + 14} 42Z`} style={ACCENT} />
        </g>
      ))}
      {/* le comptoir et ses bouteilles */}
      <rect x={360} y={84} width={112} height={4} fill={M.filet} />
      <Bouteille x={374} y={84} h={30} fill={M.champ} />
      <Bouteille x={390} y={84} h={24} accent />
      <Bouteille x={406} y={84} h={30} fill={OMBRE} />
      <Bouteille x={422} y={84} h={26} fill={M.champ} />
      <Bouteille x={438} y={84} h={30} accent />
      <Bouteille x={454} y={84} h={22} fill={M.releve} />
      <rect x={446} y={104} width={26} height={22} rx={2} fill={M.filet} />
      <circle cx={459} cy={113} r={3} style={ACCENT} />
      <rect x={366} y={132} width={104} height={68} fill={M.releve} />
      <rect x={360} y={126} width={116} height={7} fill={M.filet} />
      <rect x={360} y={126} width={116} height={2} fill={BLANC} opacity={0.18} />
      {/* la table du client */}
      <OmbreAuSol x={118} y={200} rx={56} ry={4} />
      <Chaise x={70} sens={-1} />
      <rect x={92} y={147} width={5} height={11} fill={BLANC} opacity={0.6} />
      <ellipse cx={120} cy={157} rx={10} ry={2} fill={BLANC} />
      <rect x={80} y={158} width={64} height={5} rx={2} fill={BLANC} />
      <rect x={110} y={163} width={4} height={33} fill={M.nuit} />
      <ellipse cx={112} cy={197} rx={12} ry={3} fill={M.nuit} />
      {/* la cliente attablée, cheveux gris */}
      <Chaise x={166} sens={1} />
      <rect x={138} y={166} width={30} height={8} fill={M.nuit} />
      <rect x={138} y={166} width={8} height={30} fill={M.nuit} />
      <Buste x={166} y={128} bas={172} largeur={28} couleur={M.filet} />
      <path d="M156 136L140 154L146 158L160 144Z" fill={M.filet} />
      <Main x={142} y={156} />
      <Tete x={166} y={128} coiffure="carre" sens={-1} cheveux={OMBRE} />
      {/* le serveur, tablier long, plateau levé */}
      <OmbreAuSol x={262} y={201} rx={22} ry={3} />
      <rect x={252} y={190} width={8} height={10} fill={M.nuit} />
      <rect x={264} y={190} width={8} height={10} fill={M.nuit} />
      <Buste x={262} y={114} bas={192} largeur={30} couleur={M.nuit} />
      <path d="M249 146L275 146L279 192L245 192Z" fill={BLANC} />
      <rect x={247} y={144} width={30} height={3} fill={OMBRE} />
      <path d="M254 120L232 112L230 118L252 128Z" fill={M.nuit} />
      <Main x={231} y={114} />
      <ellipse cx={226} cy={110} rx={17} ry={2.5} fill={OMBRE} />
      <rect x={214} y={97} width={5} height={12} fill={BLANC} opacity={0.8} />
      <rect x={225} y={92} width={6} height={17} rx={1} style={ACCENT} />
      <rect x={227} y={86} width={2} height={7} style={ACCENT} />
      <Tete x={262} y={114} coiffure="courte" sens={-1} />
    </>
  );
}

/** ATLAS CONSEIL : la salle de réunion, le tableau, la ville derrière la vitre. */
export function SceneConseil() {
  return (
    <>
      <Piece sol={204} />
      {/* la baie vitrée et la ville */}
      <polygon points="256,170 466,170 480,270 230,270" fill={BLANC} opacity={0.05} />
      <rect x={250} y={22} width={222} height={150} fill={M.filet} />
      <rect x={256} y={28} width={210} height={138} fill={M.champ} />
      <g fill={M.releve}>
        <rect x={262} y={100} width={30} height={66} />
        <rect x={296} y={76} width={22} height={90} />
        <rect x={322} y={110} width={34} height={56} />
        <rect x={360} y={64} width={26} height={102} />
        <rect x={390} y={94} width={38} height={72} />
        <rect x={432} y={82} width={30} height={84} />
      </g>
      <g fill={BLANC} opacity={0.22}>
        {[
          [268, 108],
          [280, 118],
          [302, 86],
          [308, 100],
          [366, 74],
          [376, 90],
          [366, 106],
          [398, 104],
          [414, 116],
          [440, 92],
          [450, 108],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={3} height={4} />
        ))}
      </g>
      <rect x={324} y={28} width={4} height={138} fill={M.filet} />
      <rect x={396} y={28} width={4} height={138} fill={M.filet} />
      {/* le tableau blanc : une courbe qui monte, des notes collées */}
      <rect x={30} y={36} width={172} height={110} fill={M.filet} />
      <rect x={34} y={40} width={164} height={102} fill={BLANC} />
      <rect x={52} y={126} width={92} height={2} fill={M.fond} />
      <rect x={52} y={58} width={2} height={70} fill={M.fond} />
      <g style={ACCENT}>
        <rect x={62} y={106} width={12} height={20} />
        <rect x={80} y={94} width={12} height={32} />
        <rect x={98} y={98} width={12} height={28} />
        <rect x={116} y={78} width={12} height={48} />
      </g>
      <path d="M60 100L86 86L104 90L132 66" fill="none" stroke={M.fond} strokeWidth={2} />
      <rect x={154} y={58} width={14} height={14} style={ACCENT} />
      <rect x={172} y={58} width={14} height={14} fill={M.releve} />
      <rect x={154} y={78} width={14} height={14} fill={M.releve} />
      <rect x={172} y={78} width={14} height={14} style={ACCENT} />
      <rect x={30} y={146} width={172} height={4} fill={M.filet} />
      {/* la consultante qui présente */}
      <OmbreAuSol x={218} y={206} rx={20} ry={3} />
      <Jambes x={218} haut={170} sol={204} />
      <Buste x={218} y={110} bas={172} largeur={28} couleur={M.fond} />
      <path d="M212 110L218 122L224 110Z" fill={BLANC} />
      <path d="M210 118L180 96L176 101L206 126Z" fill={M.fond} />
      <Main x={178} y={98} />
      <Tete x={218} y={110} coiffure="queue" sens={-1} />
      {/* la table de réunion, l'ordinateur, le café */}
      <OmbreAuSol x={344} y={206} rx={110} ry={4} />
      <Buste x={392} y={126} bas={162} largeur={30} couleur={M.fond} />
      <Tete x={392} y={126} coiffure="boucles" sens={-1} peau={OMBRE} />
      <path d="M380 136L360 152L364 157L384 144Z" fill={M.fond} />
      <Main x={362} y={155} peau={OMBRE} />
      <polygon points="334,160 338,160 330,137 326,137" fill={OMBRE} />
      <rect x={334} y={157} width={30} height={3} fill={OMBRE} />
      <rect x={280} y={150} width={8} height={11} rx={1} fill={BLANC} />
      <rect x={296} y={157} width={24} height={4} fill={BLANC} opacity={0.8} />
      <rect x={236} y={161} width={220} height={8} fill={M.filet} />
      <rect x={236} y={161} width={220} height={2} fill={BLANC} opacity={0.18} />
      <rect x={246} y={169} width={6} height={35} fill={M.champ} />
      <rect x={440} y={169} width={6} height={35} fill={M.champ} />
    </>
  );
}

/** PIXEL & CO : la boutique en ligne à l'écran, les colis qu'on prépare. */
export function SceneEcommerce() {
  const cartes = [
    { x: 42, y: 60 },
    { x: 96, y: 60 },
    { x: 150, y: 60 },
    { x: 42, y: 100 },
    { x: 96, y: 100 },
    { x: 150, y: 100 },
  ];
  return (
    <>
      <Piece sol={200} />
      {/* l'écran : la vitrine du site, ses produits en cartes */}
      <rect x={28} y={36} width={180} height={110} rx={4} fill={M.nuit} />
      <rect x={34} y={42} width={168} height={98} fill={BLANC} />
      <rect x={34} y={42} width={168} height={12} fill={M.releve} />
      <g fill={OMBRE}>
        <circle cx={41} cy={48} r={2} />
        <circle cx={48} cy={48} r={2} />
        <circle cx={55} cy={48} r={2} />
      </g>
      <rect x={66} y={45} width={80} height={6} rx={3} fill={M.champ} />
      <rect x={182} y={45} width={14} height={6} rx={3} style={ACCENT} />
      {cartes.map(({ x, y }) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={46} height={34} fill={OMBRE} />
          <rect x={x + 4} y={y + 28} width={18} height={3} fill={M.fond} opacity={0.4} />
        </g>
      ))}
      {/* lampe, vase, chaise, coussin, miroir, plante */}
      <path d="M58 76L72 76L69 66L61 66Z" style={ACCENT} />
      <rect x={64} y={76} width={2} height={8} fill={M.fond} />
      <path d="M114 86Q109 76 116 70L116 66L122 66L122 70Q129 76 124 86Z" fill={M.releve} />
      <g fill={M.fond}>
        <rect x={164} y={66} width={3} height={18} />
        <rect x={164} y={77} width={16} height={3} />
        <rect x={177} y={80} width={2} height={6} />
        <rect x={164} y={80} width={2} height={6} />
      </g>
      <rect x={55} y={106} width={20} height={14} rx={5} style={ACCENT} />
      <circle cx={119} cy={114} r={9} fill={M.releve} />
      <circle cx={119} cy={114} r={6.5} fill={M.champ} />
      <path d="M166 124L178 124L176 116L168 116Z" fill={M.releve} />
      <ellipse cx={168} cy={110} rx={3} ry={6} fill={M.filet} transform="rotate(-20 168 110)" />
      <ellipse cx={176} cy={110} rx={3} ry={6} fill={M.filet} transform="rotate(20 176 110)" />
      <path d="M140 92L140 106L144 102L147 108L150 107L147 101L152 101Z" fill={M.nuit} />
      <rect x={110} y={146} width={16} height={10} fill={M.nuit} />
      <rect x={96} y={156} width={44} height={4} fill={M.nuit} />
      <rect x={16} y={160} width={220} height={6} fill={M.filet} />
      <rect x={24} y={166} width={6} height={34} fill={M.champ} />
      <rect x={222} y={166} width={6} height={34} fill={M.champ} />
      <rect x={150} y={156} width={44} height={4} rx={1} fill={OMBRE} />
      {/* la préparatrice et le carton ouvert */}
      <OmbreAuSol x={306} y={202} rx={70} ry={4} />
      <Buste x={306} y={116} bas={164} largeur={30} couleur={M.fond} />
      <Tete x={306} y={116} coiffure="chignon" sens={-1} />
      <rect x={294} y={124} width={24} height={16} rx={5} style={ACCENT} />
      <polygon points="276,138 264,127 292,127 298,138" fill={M.champ} />
      <polygon points="336,138 348,127 320,127 314,138" fill={M.champ} />
      <rect x={276} y={138} width={60} height={26} fill={M.releve} />
      <rect x={276} y={138} width={60} height={2} fill={BLANC} opacity={0.18} />
      <path d="M294 124L284 142L290 145L299 130Z" fill={M.fond} />
      <path d="M318 124L328 142L322 145L313 130Z" fill={M.fond} />
      <Main x={287} y={144} />
      <Main x={325} y={144} />
      <rect x={346} y={146} width={22} height={18} fill={M.releve} />
      <rect x={350} y={150} width={10} height={6} fill={BLANC} />
      <rect x={244} y={164} width={136} height={6} fill={M.filet} />
      <rect x={252} y={170} width={6} height={30} fill={M.champ} />
      <rect x={366} y={170} width={6} height={30} fill={M.champ} />
      <circle cx={256} cy={157} r={6} fill={OMBRE} />
      <circle cx={256} cy={157} r={3} fill={M.releve} />
      <rect x={270} y={182} width={30} height={18} fill={M.champ} />
      <rect x={284} y={182} width={2} height={18} fill={OMBRE} opacity={0.6} />
      <rect x={304} y={186} width={22} height={14} style={ACCENT} />
      {/* le rayonnage des colis */}
      <rect x={390} y={34} width={4} height={166} fill={M.filet} />
      <rect x={464} y={34} width={4} height={166} fill={M.filet} />
      {[76, 126, 176].map((y, i) => (
        <g key={y}>
          <rect x={390} y={y} width={78} height={4} fill={M.filet} />
          <rect x={398} y={y - 26} width={28} height={26} fill={i === 1 ? M.champ : M.releve} />
          <rect x={411} y={y - 26} width={2} height={26} fill={OMBRE} opacity={0.6} />
          <rect x={430} y={y - 18} width={28} height={18} fill={i === 1 ? M.releve : M.champ} />
          <rect
            x={436}
            y={y - 13}
            width={9}
            height={5}
            style={i === 0 ? ACCENT : undefined}
            fill={i === 0 ? undefined : BLANC}
          />
        </g>
      ))}
    </>
  );
}

/** Un haltère, posé ou tenu, centré sur `x`, `y`. */
function Haltere({ x, y, accent = false }: { x: number; y: number; accent?: boolean }) {
  return (
    <g>
      <rect x={x - 5} y={y - 1.5} width={10} height={3} fill={OMBRE} />
      <rect
        x={x - 11}
        y={y - 6}
        width={6}
        height={12}
        rx={2}
        fill={accent ? undefined : M.nuit}
        style={accent ? ACCENT : undefined}
      />
      <rect
        x={x + 5}
        y={y - 6}
        width={6}
        height={12}
        rx={2}
        fill={accent ? undefined : M.nuit}
        style={accent ? ACCENT : undefined}
      />
    </g>
  );
}

/** VOLT FITNESS : le tapis de course, la barre levée, le râtelier d'haltères. */
export function SceneFitness() {
  return (
    <>
      <Piece />
      {/* les miroirs et les rampes de lumière */}
      <rect x={20} y={36} width={200} height={118} fill={M.champ} />
      <rect x={232} y={36} width={228} height={118} fill={M.champ} />
      <polygon points="40,36 90,36 30,154 20,154 20,96" fill={BLANC} opacity={0.05} />
      <polygon points="300,36 340,36 270,154 240,154" fill={BLANC} opacity={0.05} />
      <g fill={BLANC} opacity={0.25}>
        <rect x={60} y={14} width={80} height={4} />
        <rect x={200} y={14} width={80} height={4} />
        <rect x={340} y={14} width={80} height={4} />
      </g>
      {/* le tapis de course et la coureuse */}
      <OmbreAuSol x={116} y={198} rx={78} ry={5} />
      <rect x={40} y={182} width={146} height={11} rx={4} fill={M.nuit} />
      <rect x={46} y={182} width={134} height={2} fill={M.filet} />
      <polygon points="168,184 175,184 184,110 178,110" fill={M.releve} />
      <rect x={128} y={124} width={54} height={4} rx={2} fill={M.releve} />
      <rect x={172} y={100} width={28} height={13} rx={2} fill={M.releve} />
      <rect x={176} y={103} width={14} height={6} style={ACCENT} />
      <g transform="rotate(7 112 150)">
        <polygon points="104,146 114,148 94,180 86,176" fill={M.nuit} />
        <polygon points="112,146 122,146 138,160 130,166" fill={M.nuit} />
        <polygon points="130,166 138,160 138,182 130,182" fill={M.nuit} />
        <Buste x={112} y={104} bas={150} largeur={26} couleur={M.releve} />
        <polygon points="104,112 110,116 98,134 92,130" fill={M.releve} />
        <polygon points="116,114 122,112 132,126 126,130" fill={M.releve} />
        <polygon points="126,130 132,126 138,116 134,112" fill={M.releve} />
        <Tete x={112} y={104} coiffure="queue" sens={1} />
      </g>
      {/* la barre levée au-dessus de la tête */}
      <OmbreAuSol x={252} y={198} rx={26} ry={4} />
      <Jambes x={252} haut={162} sol={196} />
      <Buste x={252} y={112} bas={164} largeur={32} couleur={M.fond} />
      <polygon points="238,118 244,120 236,76 230,76" fill={M.fond} />
      <polygon points="260,120 266,118 274,76 268,76" fill={M.fond} />
      <Main x={233} y={74} />
      <Main x={271} y={74} />
      <rect x={206} y={71} width={92} height={3} fill={OMBRE} />
      <rect x={210} y={60} width={8} height={26} rx={2} style={ACCENT} />
      <rect x={286} y={60} width={8} height={26} rx={2} style={ACCENT} />
      <rect x={219} y={64} width={5} height={18} rx={1} fill={M.releve} />
      <rect x={280} y={64} width={5} height={18} rx={1} fill={M.releve} />
      <Tete x={252} y={112} coiffure="rase" sens={1} />
      {/* le râtelier d'haltères */}
      <OmbreAuSol x={384} y={198} rx={74} ry={4} />
      <rect x={318} y={152} width={134} height={4} fill={M.filet} />
      <rect x={318} y={178} width={134} height={4} fill={M.filet} />
      <rect x={322} y={152} width={4} height={44} fill={M.filet} />
      <rect x={444} y={152} width={4} height={44} fill={M.filet} />
      {[338, 366, 394, 422].map((x, i) => (
        <g key={x}>
          <Haltere x={x} y={146} accent={i % 2 === 0} />
          <Haltere x={x} y={172} accent={i % 2 === 1} />
        </g>
      ))}
      {/* les kettlebells au sol */}
      <path d="M290 186Q296 170 302 186" fill="none" stroke={M.filet} strokeWidth={3} />
      <circle cx={296} cy={190} r={8} style={ACCENT} />
      <path d="M306 190Q311 177 316 190" fill="none" stroke={M.filet} strokeWidth={3} />
      <circle cx={311} cy={193} r={6} fill={M.nuit} />
    </>
  );
}

/** MARTEL & FILS : la façade en rénovation, l'échafaudage, la brouette. */
export function SceneBatiment() {
  return (
    <>
      <Piece sol={200} />
      <g fill={M.champ} opacity={0.6}>
        <rect x={-40} y={150} width={100} height={50} />
        <polygon points="-40,150 10,124 60,150" />
        <rect x={420} y={160} width={100} height={40} />
        <polygon points="430,160 470,136 510,160" />
      </g>
      {/* la façade et son toit */}
      <OmbreAuSol x={276} y={202} rx={150} ry={5} />
      <polygon points="136,84 275,24 414,84" fill={M.releve} />
      <rect x={340} y={34} width={18} height={34} fill={M.releve} />
      <rect x={150} y={82} width={250} height={118} fill={M.champ} />
      <rect x={150} y={82} width={250} height={3} fill={BLANC} opacity={0.12} />
      {/* les briques mises à nu */}
      <g fill={M.releve}>
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect
              key={`${r}-${c}`}
              x={226 + c * 18 + (r % 2) * 9}
              y={94 + r * 9}
              width={15}
              height={6}
            />
          )),
        )}
      </g>
      {/* fenêtres, porte, et la fenêtre neuve qu'on pose */}
      <g fill={M.fond}>
        <rect x={176} y={96} width={34} height={34} />
        <rect x={176} y={146} width={34} height={42} />
        <rect x={258} y={136} width={36} height={64} />
        <rect x={330} y={146} width={34} height={42} />
      </g>
      <circle cx={287} cy={170} r={2} fill={OMBRE} />
      <rect x={330} y={96} width={34} height={34} fill={M.fond} />
      <rect
        x={332}
        y={98}
        width={30}
        height={30}
        fill="none"
        strokeWidth={4}
        style={ACCENT_TRAIT}
      />
      <rect x={346} y={98} width={2} height={30} style={ACCENT} />
      {/* l'échafaudage */}
      <g fill={OMBRE}>
        <rect x={312} y={70} width={3} height={130} />
        <rect x={362} y={70} width={3} height={130} />
        <rect x={412} y={70} width={3} height={130} />
        <rect x={310} y={80} width={107} height={2} />
      </g>
      <g stroke={OMBRE} strokeWidth={2} opacity={0.7}>
        <path d="M315 198L362 132" />
        <path d="M365 198L412 132" />
      </g>
      <rect x={306} y={132} width={114} height={5} fill={BLANC} opacity={0.85} />
      {/* le compagnon sur l'échafaudage, casque à la teinte de la maison */}
      <Buste x={390} y={92} bas={132} largeur={28} couleur={M.releve} />
      <rect x={377} y={110} width={26} height={3} fill={BLANC} opacity={0.8} />
      <path d="M380 100L366 114L370 118L384 106Z" fill={M.releve} />
      <Main x={367} y={116} />
      <Tete x={390} y={92} coiffure="aucune" />
      <path d="M377 80A13 12 0 0 1 403 80Z" style={ACCENT} />
      <rect x={374} y={79} width={32} height={3} rx={1.5} style={ACCENT} />
      {/* l'échelle */}
      <g stroke={OMBRE} strokeWidth={2.5}>
        <path d="M128 200L150 92" />
        <path d="M142 200L164 92" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path
            key={i}
            d={`M${131 - i * -3.1} ${186 - i * 15}L${145 - i * -3.1} ${186 - i * 15}`}
          />
        ))}
      </g>
      {/* le compagnon au sol, une planche sur l'épaule */}
      <Jambes x={84} haut={164} sol={200} />
      <Buste x={84} y={118} bas={166} largeur={30} couleur={M.filet} />
      <rect x={71} y={138} width={26} height={3} fill={BLANC} opacity={0.8} />
      <Tete x={84} y={118} coiffure="aucune" peau={OMBRE} />
      <path d="M71 106A13 12 0 0 1 97 106Z" style={ACCENT} />
      <rect x={68} y={105} width={32} height={3} rx={1.5} style={ACCENT} />
      <rect x={34} y={117} width={108} height={6} fill={OMBRE} transform="rotate(-7 84 120)" />
      <Main x={98} y={124} peau={OMBRE} />
      {/* la brouette */}
      <polygon points="196,174 246,174 238,190 204,190" style={ACCENT} />
      <rect x={196} y={174} width={50} height={2} fill={BLANC} opacity={0.2} />
      <circle cx={248} cy={194} r={6} fill={M.nuit} />
      <path d="M206 188L184 180M210 190L206 200" stroke={M.nuit} strokeWidth={3} />
    </>
  );
}

/** ROUTE & CIE : le camion à quai, le transpalette, la porte du dépôt. */
export function SceneTransport() {
  return (
    <>
      <Piece sol={186} />
      {/* le dépôt, une porte ouverte, une porte fermée */}
      <rect x={256} y={66} width={88} height={108} fill={M.filet} />
      <rect x={262} y={72} width={76} height={102} fill={M.nuit} />
      <rect x={366} y={66} width={88} height={108} fill={M.filet} />
      <rect x={372} y={72} width={76} height={102} fill={M.champ} />
      <g fill={M.filet}>
        {[84, 96, 108, 120, 132, 144, 156].map((y) => (
          <rect key={y} x={372} y={y} width={76} height={2} />
        ))}
      </g>
      <rect x={240} y={174} width={1240} height={14} fill={M.releve} />
      <rect x={240} y={174} width={1240} height={2} fill={BLANC} opacity={0.18} />
      <g fill={M.nuit}>
        <rect x={350} y={176} width={10} height={10} />
        <rect x={460} y={176} width={10} height={10} />
      </g>
      {/* la cour et son marquage */}
      <g fill={BLANC} opacity={0.25}>
        {[-380, -300, -220, -140, -60, 20, 100, 180, 260, 340, 420, 500, 580, 660, 740, 820].map(
          (x) => (
            <rect key={x} x={x} y={244} width={40} height={4} />
          ),
        )}
      </g>
      {/* le cariste et sa palette */}
      <Jambes x={318} haut={160} sol={174} />
      <Buste x={318} y={118} bas={162} largeur={30} couleur={M.releve} />
      <rect x={305} y={136} width={26} height={3} fill={BLANC} opacity={0.8} />
      <rect x={305} y={146} width={26} height={3} fill={BLANC} opacity={0.8} />
      <path d="M306 126L290 140L294 145L310 134Z" fill={M.releve} />
      <Tete x={318} y={118} coiffure="courte" sens={-1} peau={OMBRE} />
      <path d="M291 142L281 166" stroke={OMBRE} strokeWidth={3} />
      <Main x={291} y={142} peau={OMBRE} />
      <rect x={248} y={166} width={36} height={5} fill={M.nuit} />
      <rect x={248} y={161} width={32} height={5} fill={OMBRE} />
      <rect x={250} y={137} width={14} height={24} fill={M.champ} />
      <rect x={265} y={137} width={14} height={24} style={ACCENT} />
      <rect x={252} y={119} width={14} height={18} fill={M.champ} />
      <rect x={256} y={137} width={2} height={24} fill={OMBRE} opacity={0.6} />
      {/* le camion, la remorque aux couleurs de la maison */}
      <OmbreAuSol x={130} y={214} rx={128} ry={5} />
      <rect x={66} y={92} width={172} height={98} rx={2} style={ACCENT} />
      <rect x={66} y={92} width={172} height={3} fill={BLANC} opacity={0.25} />
      <rect x={92} y={146} width={80} height={8} fill={BLANC} opacity={0.85} />
      <rect x={92} y={158} width={50} height={4} fill={BLANC} opacity={0.6} />
      <rect x={60} y={190} width={182} height={8} fill={M.nuit} />
      <path d="M10 198L10 130Q10 108 30 106L62 106L62 198Z" fill={M.releve} />
      <polygon points="30,106 62,96 62,106" fill={M.releve} />
      <path d="M15 132L15 120Q16 114 26 114L48 114L48 132Z" fill={M.fond} />
      <circle cx={34} cy={126} r={6} fill={BLANC} />
      <path d="M28 124Q34 116 40 124Z" fill={M.nuit} />
      <rect x={52} y={136} width={2} height={50} fill={M.champ} />
      <rect x={6} y={186} width={22} height={8} fill={M.nuit} />
      <rect x={10} y={176} width={7} height={5} fill={OMBRE} />
      {[36, 192, 220].map((x) => (
        <g key={x}>
          <circle cx={x} cy={200} r={13} fill={M.nuit} />
          <circle cx={x} cy={200} r={5} fill={M.filet} />
        </g>
      ))}
    </>
  );
}
