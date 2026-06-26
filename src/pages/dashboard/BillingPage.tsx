import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRazorpay } from '@hooks/useRazorpay';
import { subscribeToPlan, verifyPayment } from '@api/billing';
import { PricingCard } from '@components/billing/PricingCard';
import { useToast } from '@hooks/useProtectedRoute';
import { useAppSelector, useAppDispatch } from '@store/index';
import { fetchMeThunk } from '@store/slices/authSlice';

const PLANS = [
  {
    tier: 'free',
    planId: '',
    name: 'Developer',
    price: '₹0',
    features: ['Up to 3 team members', '2 API Keys', '30-day log retention', '100 req/min API rate limit'],
  },
  {
    tier: 'pro',
    planId: 'plan_T4zbB9XeEJTgoC',
    name: 'Pro',
    price: '₹1,000',
    isPopular: true,
    features: ['Up to 25 team members', '10 API Keys', '90-day log retention', '500 req/min API rate limit'],
  },
  {
    tier: 'max',
    planId: 'plan_T4zcMPav36AW2v',
    name: 'Max',
    price: '₹2,000',
    features: ['Unlimited team members', 'Unlimited API Keys', '365-day log retention', '2,000 req/min API rate limit', 'Priority support'],
  }
];

export default function BillingPage() {
  const isRazorpayLoaded = useRazorpay();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.auth.user);
  const currentPlan = user?.tenant?.plan_tier || 'free';

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const getActionType = (currentTier: string, targetTier: string) => {
    if (targetTier === 'free' && currentTier !== 'free') return 'cancel';
    const weight: Record<string, number> = { free: 0, pro: 1, max: 2 };
    const currentWeight = weight[currentTier] ?? 0;
    const targetWeight = weight[targetTier] ?? 0;
    
    if (currentTier === 'free') return 'subscribe';
    if (targetWeight > currentWeight) return 'upgrade';
    if (targetWeight < currentWeight) return 'downgrade';
    return 'subscribe';
  };

  // Always fetch fresh user data from the server when this page mounts
  // so that plan_tier reflects the actual DB value, not a stale localStorage cache.
  useEffect(() => {
    dispatch(fetchMeThunk());
  }, [dispatch]);

  const handleSubscribe = async (tier: string, planId: string) => {
    if (!isRazorpayLoaded) {
      toast({ title: 'Error', description: 'Payment gateway is loading. Please try again.', type: 'error' });
      return;
    }

    try {
      setLoadingPlan(tier);
      
      // 1. Fetch Subscription ID or Scheduled Status from backend
      const response: any = await subscribeToPlan(planId, tier);

      if (response.status === 'scheduled') {
        toast({ 
          title: 'Update Scheduled', 
          description: response.message || 'Plan change scheduled for the end of the billing cycle.', 
          type: 'success' 
        });
        setLoadingPlan(null);
        return;
      }

      const { subscription_id, razorpay_key_id } = response;

      // 2. Initialize Razorpay Widget
      const options = {
        key: razorpay_key_id,
        subscription_id: subscription_id,
        name: 'NeuralOps',
        description: `${planId.toUpperCase()} Plan Subscription`,
        theme: {
          color: '#3b82f6', // Tailwind blue-500
        },
        handler: async function (response: any) {
          try {
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan_tier: tier,
            });
            
            toast({
              title: 'Success',
              description: `Successfully subscribed to the ${tier} plan. Refresh to see changes.`,
              type: 'success'
            });
            // Force reload to refresh user tenant state, or dispatch redux action
            window.location.reload();
          } catch (err: any) {
            console.error(err);
            toast({ title: 'Verification Failed', description: 'Your payment was successful but verification failed. Please contact support.', type: 'error' });
          }
        },
        modal: {
          ondismiss: function() {
            setLoadingPlan(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast({ title: 'Payment Failed', description: response.error.description, type: 'error' });
      });
      rzp.open();

    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.response?.data?.error || 'Failed to initiate subscription', type: 'error' });
      setLoadingPlan(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold text-slate-900 sm:text-5xl tracking-tight"
        >
          Simple, transparent pricing
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-xl text-slate-600 font-medium"
        >
          Choose the right AI debugging power for your team.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-3 gap-8 items-stretch"
      >
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <PricingCard
              id={plan.tier}
              name={plan.name}
              price={plan.price}
              features={plan.features}
              isPopular={plan.isPopular}
              isActive={currentPlan === plan.tier}
              isLoading={loadingPlan === plan.tier}
              actionType={getActionType(currentPlan, plan.tier) as any}
              onSubscribe={() => handleSubscribe(plan.tier, plan.planId)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
