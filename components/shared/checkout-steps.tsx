import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/utils';

interface Step {
  label: string;
  path: string;
}

const STEPS: Step[] = [
  { label: 'Check Cart Contents',       path: '/cart' },
  { label: 'Shipping Address', path: '/shipping-address' },
  { label: 'Payment Method',   path: '/payment-method' },
  { label: 'Place Order',      path: '/place-order' },
];

interface CheckoutStepsProps {
  current?: number;
}

const CheckoutSteps: React.FC<CheckoutStepsProps> = ({ current = 0 }) => {
  return (
    <nav className="flex-between flex-col md:flex-row space-x-2 space-y-2 mb-10">
      {STEPS.map((step, index) => {
        const isActive = index === current;
        const isDone = index < current;
        const clickable = isDone || isActive;

        const baseClasses = 'p-2 w-56 rounded-full text-center text-sm';
        const activeClasses = isActive ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-700';
        const interactiveClasses = clickable
          ? 'hover:bg-secondary/20 cursor-pointer'
          : 'opacity-50 cursor-not-allowed';

        return (
          <React.Fragment key={step.label}>
            {clickable ? (
              <Link href={step.path} className={cn(baseClasses, activeClasses, interactiveClasses)}>
                {step.label}
              </Link>
            ) : (
              <div className={cn(baseClasses, activeClasses, interactiveClasses)}>
                {step.label}
              </div>
            )}

            {index < STEPS.length - 1 && (
              <hr className="w-16 border-t border-gray-300 mx-2" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default CheckoutSteps;
