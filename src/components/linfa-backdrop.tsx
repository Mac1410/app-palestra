import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { Linfa } from '@/constants/theme';

/** Punto sulla circonferenza, con 0° in alto e angoli in senso orario. */
function pointOnCircle(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const a = pointOnCircle(cx, cy, r, from);
  const b = pointOnCircle(cx, cy, r, to);
  const largeArc = to - from <= 180 ? 0 : 1;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${largeArc} 1 ${b.x} ${b.y}`;
}

type Props = {
  width: number;
  /** Altezza del riquadro disegnato; il resto della schermata resta nero. */
  height?: number;
};

/**
 * Il fondale della schermata Oggi: la nube di brace in alto e l'anello che
 * incornicia il numero. Niente filtri di sfocatura (costosi e non uniformi tra
 * piattaforme): il bagliore è costruito con tracciati sovrapposti a opacità
 * calanti, che su schermo restituiscono lo stesso alone.
 */
export function LinfaBackdrop({ width, height = 470 }: Props) {
  const cx = width / 2;
  const cy = 218;
  const r = Math.min(width * 0.38, 148);

  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <RadialGradient id="hot" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={Linfa.glowHot} stopOpacity={0.62} />
          <Stop offset="1" stopColor={Linfa.glowHot} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="warm" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={Linfa.glowWarm} stopOpacity={0.5} />
          <Stop offset="1" stopColor={Linfa.glowWarm} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="deep" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={Linfa.glowDeep} stopOpacity={0.55} />
          <Stop offset="1" stopColor={Linfa.glowDeep} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="arc" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={Linfa.ring[0]} />
          <Stop offset="0.5" stopColor={Linfa.ring[1]} />
          <Stop offset="1" stopColor={Linfa.ring[2]} />
        </LinearGradient>
      </Defs>

      {/* nube di brace lungo il bordo superiore */}
      <Ellipse cx={cx} cy={70} rx={width * 0.62} ry={112} fill="url(#hot)" />
      <Ellipse cx={width * 0.28} cy={54} rx={width * 0.34} ry={74} fill="url(#warm)" />
      <Ellipse cx={width * 0.74} cy={44} rx={width * 0.36} ry={68} fill="url(#deep)" />

      {/* anello: cerchio spento più arco acceso in basso */}
      <Circle cx={cx} cy={cy} r={r} stroke="#33543F" strokeWidth={2} fill="none" />
      <Path d={arcPath(cx, cy, r, 118, 298)} stroke="url(#arc)" strokeWidth={34} strokeOpacity={0.2} fill="none" strokeLinecap="round" />
      <Path d={arcPath(cx, cy, r, 122, 294)} stroke="url(#arc)" strokeWidth={18} strokeOpacity={0.38} fill="none" strokeLinecap="round" />
      <Path d={arcPath(cx, cy, r, 128, 288)} stroke="url(#arc)" strokeWidth={8} strokeOpacity={0.85} fill="none" strokeLinecap="round" />
      <Path d={arcPath(cx, cy, r, 138, 278)} stroke="url(#arc)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
