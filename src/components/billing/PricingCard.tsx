import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@components/common/Button';

interface PricingCardProps {
  id: string;
  name: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  actionType: 'subscribe' | 'upgrade' | 'downgrade' | 'cancel';
  onSubscribe: (planId: string) => void;
}

export function PricingCard({
  id,
  name,
  price,
  features,
  isPopular,
  isActive,
  isLoading,
  actionType,
  onSubscribe,
}: PricingCardProps) {
  const buttonLabel = isActive
    ? 'Current Plan'
    : isLoading
    ? 'Processing...'
    : actionType === 'cancel'
    ? 'Cancel plan to downgrade'
    : actionType === 'upgrade'
    ? 'Upgrade'
    : actionType === 'downgrade'
    ? 'Downgrade'
    : 'Subscribe';

  const isDisabled = isActive || isLoading || actionType === 'cancel';
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative rounded-3xl p-8 bg-card shadow-xl flex flex-col h-full transition-all duration-200
        ${isActive ? 'border-2 border-emerald-500 shadow-emerald-500/15 ring-2 ring-emerald-500/20' : (isPopular ? 'border-2 border-blue-500 shadow-blue-500/15' : 'border border-border shadow-slate-200/50 hover:shadow-slate-300')}`}
    >
      {isActive && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-xs font-bold text-white uppercase tracking-widest shadow-md">
          Current Plan
        </div>
      )}
      {!isActive && isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-xs font-bold text-white uppercase tracking-widest shadow-md">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-extrabold text-foreground tracking-tight">{name}</h3>
        <div className="mt-4 flex items-baseline text-foreground">
          <span className="text-5xl font-black tracking-tight">{price}</span>
          {price !== 'Custom' && <span className="ml-1 text-xl font-semibold text-muted-foreground">/mo</span>}
        </div>
      </div>

      <ul className="mb-8 space-y-4 flex-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center text-foreground">
            <div className={`flex-shrink-0 p-1 rounded-full mr-3 ${isPopular ? 'bg-primary/10' : 'bg-muted'}`}>
              <Check className={`h-4 w-4 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <span className="font-medium text-sm sm:text-base leading-tight">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={isActive ? "secondary" : (isPopular ? "default" : "outline")}
        disabled={isDisabled}
        onClick={() => onSubscribe(id)}
        className={`w-full mt-auto ${
          actionType === 'cancel' ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={actionType === 'cancel' ? 'You cannot subscribe to a lower plan directly. Cancel your current subscription first.' : undefined}
      >
        {buttonLabel}
      </Button>
    </motion.div>
  );
}
