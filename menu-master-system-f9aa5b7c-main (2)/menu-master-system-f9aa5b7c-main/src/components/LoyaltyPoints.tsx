
import React from 'react';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoyaltyPointsProps {
  points: number;
  className?: string;
}

const LoyaltyPoints = ({ points, className }: LoyaltyPointsProps) => {
  return (
    <div className={cn("flex items-center px-3 py-1 rounded-full bg-restaurant-light text-restaurant-dark", className)}>
      <Coins className="h-4 w-4 mr-1 text-restaurant-secondary" />
      <span className="text-sm font-medium">{points} pontos</span>
    </div>
  );
};

export default LoyaltyPoints;
