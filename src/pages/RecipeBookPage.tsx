import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { SavedRecipes } from '../components/SavedRecipes';
import { RecipeViewer } from '../components/RecipeViewer';
import { RecipeEditor } from '../components/RecipeEditor';
import type { SavedRecipe } from '../lib/validation';
import type { UserSettings } from '../types/userSettings';
import type { FeatureAccess } from '../hooks/useFeatureAccess';

// Outlet context type
interface AppOutletContext {
  user: User;
  userSettings: UserSettings | null;
  featureAccess: FeatureAccess;
  updateRecipeCount: (count: number) => void;
}

export function RecipeBookPage() {
  // Get shared state from AppLayout via Outlet context
  const { user, userSettings, featureAccess, updateRecipeCount } = useOutletContext<AppOutletContext>();

  const [viewingRecipe, setViewingRecipe] = useState<SavedRecipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<SavedRecipe | null>(null);

  const handleSelectSavedRecipe = (recipe: SavedRecipe) => {
    // Navigate to convert page and set the selected recipe
    // For now, just view the recipe
    setViewingRecipe(recipe);
  };

  const handleViewRecipe = (recipe: SavedRecipe) => {
    setViewingRecipe(recipe);
  };

  return (
    <>
      {/* Decorative Background Elements for Recipe Book Page */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '5s' }} />
      <div className="absolute top-40 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '7s', animationDelay: '1.5s' }} />
      <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '3s' }} />

      {/* Recipe Book Content */}
      <SavedRecipes
        userId={user.uid}
        onSelect={handleSelectSavedRecipe}
        onViewRecipe={handleViewRecipe}
        onRecipeCountChange={updateRecipeCount}
        userSettings={userSettings || undefined}
        featureAccess={{
          recipeLimit: featureAccess.recipeLimit,
          currentRecipeCount: featureAccess.currentRecipeCount,
          currentPlan: featureAccess.currentPlan,
          canSaveRecipes: featureAccess.canSaveRecipes,
          canUseAdvancedFilters: featureAccess.canUseAdvancedFilters,
          canUseHealthConditions: featureAccess.canUseHealthConditions
        }}
      />

      {/* Recipe Viewer Modal */}
      {viewingRecipe && (
        <RecipeViewer
          recipe={viewingRecipe}
          isOpen={!!viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onEdit={(recipe) => {
            setEditingRecipe(recipe);
            setViewingRecipe(null);
          }}
        />
      )}

      {/* Recipe Editor Modal */}
      {editingRecipe && (
        <RecipeEditor
          recipe={editingRecipe}
          isOpen={!!editingRecipe}
          onClose={() => setEditingRecipe(null)}
          onUpdate={(updatedRecipe) => {
            setEditingRecipe(null);
          }}
        />
      )}
    </>
  );
}
