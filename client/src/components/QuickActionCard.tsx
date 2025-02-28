import { Card } from '@/components/ui/card';
import { useMicroInteractions, useScrollAnimation } from '@/hooks/animations';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: 'primary' | 'green' | 'purple' | 'gray' | string;
  onClick: () => void;
  animationDelay?: number;
}

// Create a motion version of our Card component
const MotionCard = motion(Card);

export default function QuickActionCard({
  title,
  description,
  icon,
  color,
  onClick,
  animationDelay = 0,
}: QuickActionCardProps) {
  const [ref, isVisible] = useScrollAnimation();
  const { buttonHover, buttonTap } = useMicroInteractions();

  // Map color to Tailwind classes
  const colorMap = {
    primary: 'bg-primary text-primary-foreground',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    gray: 'bg-gray-500 text-white',
  };

  const bgColorClass =
    colorMap[color as keyof typeof colorMap] || colorMap.primary;

  return (
    <MotionCard
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.4,
        delay: animationDelay * 0.1,
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
      whileHover={{
        y: -5,
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        transition: { duration: 0.2 },
      }}
      whileTap={buttonTap}
      className="flex flex-col items-center p-6 bg-card cursor-pointer"
      onClick={onClick}
    >
      <motion.div
        className={`p-3 mb-3 rounded-full ${bgColorClass}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: animationDelay * 0.1 + 0.2,
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        whileHover={{
          rotate: [0, -10, 10, -5, 0],
          transition: { duration: 0.5 },
        }}
      >
        {icon}
      </motion.div>
      <motion.h3
        className="font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animationDelay * 0.1 + 0.3 }}
      >
        {title}
      </motion.h3>
      <motion.p
        className="mt-1 text-sm text-muted-foreground text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: animationDelay * 0.1 + 0.4 }}
      >
        {description}
      </motion.p>
    </MotionCard>
  );
}
