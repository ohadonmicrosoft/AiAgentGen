import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/animations';
import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: 'primary' | 'green' | 'purple' | string;
  animationDelay?: number;
}

// Create a motion version of our Card component
const MotionCard = motion(Card);

export default function StatsCard({
  title,
  value,
  icon,
  color,
  animationDelay = 0,
}: StatsCardProps) {
  const [ref, isVisible] = useScrollAnimation();

  // Map color to Tailwind classes
  const colorMap = {
    primary: 'bg-primary text-primary-foreground',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    gray: 'bg-gray-500 text-white',
  };

  const bgColorClass =
    colorMap[color as keyof typeof colorMap] || colorMap.primary;

  // Animation for counting up the number
  const countVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: animationDelay * 0.1 + 0.3,
      },
    },
  };

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
        scale: 1.02,
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        transition: { duration: 0.2 },
      }}
      className="p-6 bg-card"
    >
      <div className="flex items-center">
        <motion.div
          className={`p-3 rounded-lg ${bgColorClass}`}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: animationDelay * 0.1 + 0.2,
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          whileHover={{
            rotate: 5,
            scale: 1.1,
            transition: { duration: 0.2 },
          }}
        >
          {icon}
        </motion.div>
        <div className="ml-4">
          <motion.h3
            className="text-sm font-medium text-muted-foreground"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: animationDelay * 0.1 + 0.3 }}
          >
            {title}
          </motion.h3>
          <motion.p
            className="text-2xl font-semibold"
            variants={countVariants}
            initial="hidden"
            animate="visible"
          >
            <CountUp value={value} />
          </motion.p>
        </div>
      </div>
    </MotionCard>
  );
}

// Component to animate counting up to a value
function CountUp({ value }: { value: number }) {
  const [ref, isVisible] = useScrollAnimation();
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!isVisible) return;

    const start = 0;
    const end = value;
    const duration = 1500;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress === 1) {
        clearInterval(timer);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}
