import { type ReactNode, type CSSProperties } from 'react';

/**
 * Wraps an entire screen with a smooth fade entrance animation.
 * Uses opacity-only to avoid breaking position:fixed children (BottomNav, footers).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="page-enter">
      {children}
    </div>
  );
}

/**
 * Wraps content that should slide in from a direction.
 * Only use for sections that do NOT contain position:fixed elements.
 */
export function SlideTransition({
  children,
  direction = 'right',
  triggerKey,
}: {
  children: ReactNode;
  direction?: 'left' | 'right';
  triggerKey: string | number;
}) {
  return (
    <div
      key={triggerKey}
      className={direction === 'right' ? 'slide-in-right' : 'slide-in-left'}
    >
      {children}
    </div>
  );
}

/**
 * Renders children with staggered fade-in animation.
 * Caps delay so lists don't take forever to fully appear.
 */
export function AnimatedList({
  children,
  baseDelay = 0,
  stagger = 50,
  maxDelay = 400,
}: {
  children: ReactNode[];
  baseDelay?: number;
  stagger?: number;
  maxDelay?: number;
}) {
  return (
    <>
      {children.map((child, i) => {
        const delay = Math.min(baseDelay + i * stagger, maxDelay);
        return (
          <div
            key={i}
            style={{
              opacity: 0,
              animation: `staggerFadeIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards`,
              animationDelay: `${delay}ms`,
            }}
          >
            {child}
          </div>
        );
      })}
    </>
  );
}

/**
 * A card that pops in with a scale bounce effect.
 */
export function PopCard({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        opacity: 0,
        animation: `popIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards`,
        animationDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
