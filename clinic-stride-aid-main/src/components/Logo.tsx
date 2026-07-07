import { motion, useReducedMotion } from 'framer-motion';

const Logo = ({ size = 'md', variant = 'default' }: { size?: 'sm' | 'md' | 'lg'; variant?: 'default' | 'white' }) => {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-4xl' };
  const isWhite = variant === 'white';
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="flex items-center gap-2 group cursor-pointer select-none"
      initial={reduce ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Logomark */}
      <motion.div
        whileHover={reduce ? undefined : { rotate: -6, scale: 1.06 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className={`relative flex items-center justify-center rounded-xl font-black overflow-hidden ${
          size === 'lg' ? 'w-12 h-12 text-xl' : size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'
        } ${
          isWhite
            ? 'bg-white/15 text-white border border-white/20 shadow-[0_0_25px_rgba(255,255,255,0.2)]'
            : 'bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.35)]'
        }`}
      >
        <span className="relative z-10">C</span>
        {!reduce && (
          <span
            aria-hidden
            className="absolute inset-y-0 -left-1/2 w-1/2 translate-x-0 skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-[transform,opacity] duration-700 ease-out group-hover:translate-x-[420%] group-hover:opacity-100"
          />
        )}
        <div
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ${
            size === 'lg' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2'
          } ${isWhite ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-accent shadow-[0_0_10px_hsl(var(--accent)/0.5)]'} transition-transform duration-500 ease-out group-hover:scale-110`}
        />
      </motion.div>
      {/* Wordmark */}
      <span
        className={`${sizes[size]} font-extrabold tracking-tight ${
          isWhite ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-foreground'
        }`}
      >
        Clinic
        <span className={`${isWhite ? 'text-white/80' : 'text-primary'} font-black inline-block transition-transform duration-300 group-hover:translate-x-0.5`}>
          OS
        </span>
      </span>
    </motion.div>
  );
};

export default Logo;
