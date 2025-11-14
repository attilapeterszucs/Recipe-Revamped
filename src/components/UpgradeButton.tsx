import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Zap } from 'lucide-react';
import type { SubscriptionPlan } from '../types/subscription';

interface UpgradeButtonProps {
  targetPlan?: SubscriptionPlan;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
  source?: string;
}

export const UpgradeButton: React.FC<UpgradeButtonProps> = ({
  targetPlan = 'chef',
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  children,
  className = '',
  source = 'upgrade-button'
}) => {

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 shadow-md hover:shadow-lg',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
  };

  // Width classes
  const widthClass = fullWidth ? 'w-full' : 'inline-flex';

  // Default content based on target plan
  const defaultContent = children || (
    <>
      <Star className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
      Upgrade to {targetPlan === 'chef' ? 'Chef' : targetPlan === 'master-chef' ? 'Master Chef' : 'Pro'}
      <ArrowRight className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ml-2`} />
    </>
  );

  return (
    <Link
      to="/app/pricing"
      data-upgrade-plan={targetPlan}
      data-source={source}
      className={`
        ${widthClass}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        items-center justify-center
        font-medium rounded-lg
        transition-all duration-200
        transform hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      {defaultContent}
    </Link>
  );
};

// Quick upgrade components for common use cases
export const QuickUpgradeChef: React.FC<{ className?: string; source?: string }> = ({
  className = '',
  source = 'quick-chef'
}) => (
  <UpgradeButton
    targetPlan="chef"
    size="md"
    variant="primary"
    className={className}
    source={source}
  >
    <Zap className="w-4 h-4 mr-2" />
    Upgrade to Chef
  </UpgradeButton>
);

export const QuickUpgradeMasterChef: React.FC<{ className?: string; source?: string }> = ({
  className = '',
  source = 'quick-master-chef'
}) => (
  <UpgradeButton
    targetPlan="master-chef"
    size="md"
    variant="primary"
    className={className}
    source={source}
  >
    <Star className="w-4 h-4 mr-2" />
    Upgrade to Master Chef
  </UpgradeButton>
);

// Inline upgrade prompt for feature limitations
interface UpgradePromptProps {
  featureName: string;
  requiredPlan: SubscriptionPlan;
  className?: string;
  source?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  featureName,
  requiredPlan,
  className = '',
  source = 'feature-prompt'
}) => {
  const planName = requiredPlan === 'chef' ? 'Chef' :
                   requiredPlan === 'master-chef' ? 'Master Chef' :
                   'Pro';

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Star className="h-5 w-5 text-orange-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">
              {featureName} - {planName} Plan Required
            </h3>
            <p className="text-sm text-orange-700 mt-1">
              Upgrade to access {featureName} and unlock more powerful features.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <UpgradeButton
            targetPlan={requiredPlan}
            size="sm"
            variant="primary"
            source={source}
          >
            Upgrade Now
          </UpgradeButton>
        </div>
      </div>
    </div>
  );
};