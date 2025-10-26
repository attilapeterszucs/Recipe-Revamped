import { useOutletContext } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import type { User } from 'firebase/auth';
import { MealPlannerCalendar } from '../components/MealPlannerCalendar';
import type { UserSettings } from '../types/userSettings';
import type { FeatureAccess } from '../hooks/useFeatureAccess';

// Outlet context type
interface AppOutletContext {
  user: User;
  userSettings: UserSettings | null;
  featureAccess: FeatureAccess;
  showUpgradeModal: () => void;
  updateRecipeCount: (count: number) => void;
}

export function MealPlanningPage() {
  // Get shared state from AppLayout via Outlet context
  const { user, userSettings, featureAccess, showUpgradeModal } = useOutletContext<AppOutletContext>();

  return (
    <>
      {featureAccess.canUseMealPlanning ? (
        <MealPlannerCalendar
          userId={user.uid}
          userSettings={userSettings || undefined}
          canUseNutritionAnalysis={featureAccess.canUseNutritionAnalysis}
          featureAccess={featureAccess}
          onShowUpgradeModal={showUpgradeModal}
        />
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 text-center">
          <Calendar className="h-16 w-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            Meal Planning Calendar - Chef Plan Required
          </h3>
          <p className="text-orange-700 mb-4">
            Organize your recipes with our advanced meal planning calendar. Available for Chef plan subscribers and higher.
          </p>
          <div className="space-y-2 text-sm text-orange-600 mb-6">
            <p>✓ Weekly meal planning</p>
            <p>✓ Drag-and-drop recipe organization</p>
            <p>✓ Automatic shopping list generation</p>
            <p>✓ Nutritional planning overview</p>
          </div>
          <button
            onClick={showUpgradeModal}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade to Chef Plan
          </button>
        </div>
      )}
    </>
  );
}
