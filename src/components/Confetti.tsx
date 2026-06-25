import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#C8A96A', '#D9A6A0', '#EBD3CF', '#A8884B', '#9CAE9C', '#FBF8F4'];

interface Piece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  size: number;
  drift: number;
  rounded: boolean;
}

/**
 * A lightweight, dependency-free confetti burst used when an invoice is paid.
 * Pieces fall from the top with a little horizontal drift and spin.
 */
export function Confetti({ count = 110 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.6,
        rotate: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
        drift: Math.random() * 120 - 60,
        rounded: Math.random() > 0.5,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-[-5%]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            borderRadius: p.rounded ? '999px' : '2px',
          }}
          initial={{ y: '-10vh', opacity: 0, rotate: 0 }}
          animate={{
            y: '110vh',
            x: p.drift,
            opacity: [0, 1, 1, 0.9, 0],
            rotate: p.rotate,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}
