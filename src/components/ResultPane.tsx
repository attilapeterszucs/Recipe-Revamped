import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChefHat } from 'lucide-react';

interface ResultPaneProps {
  result: string;
  loading?: boolean;
  onSave?: () => void;
  canSave?: boolean;
}

// Function to extract recipe name from the content
const extractRecipeName = (content: string): string => {
  if (!content) return 'Recipe';
  
  // Look for **Recipe Name:** pattern
  const recipeNameMatch = content.match(/^\*\*Recipe Name:\*\*\s*(.+)$/m);
  if (recipeNameMatch) {
    return recipeNameMatch[1].trim();
  }
  
  // Look for **Recipe:** pattern  
  const recipeMatch = content.match(/^\*\*Recipe:\*\*\s*(.+)$/m);
  if (recipeMatch) {
    return recipeMatch[1].trim();
  }
  
  // Look for first line that looks like a recipe title (not starting with ## or bullet points)
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && 
        !trimmed.startsWith('##') && 
        !trimmed.startsWith('•') && 
        !trimmed.startsWith('-') && 
        !trimmed.startsWith('**Prep Time') &&
        !trimmed.startsWith('**Cook Time') &&
        !trimmed.startsWith('**Servings') &&
        !trimmed.match(/^\d+\./) &&
        trimmed.length > 5 &&
        trimmed.length < 100) {
      return trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
    }
  }
  
  // Look for first H1-style title
  const h1Match = content.match(/^#\s*(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  
  return 'Recipe';
};

export const ResultPane: React.FC<ResultPaneProps> = ({ 
  result, 
  loading, 
  onSave, 
  canSave 
}) => {

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
        <p className="text-center text-gray-600 mt-4">Converting your recipe...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12">
        <div className="text-center">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <p className="mt-4 text-gray-600">
            Your converted recipe will appear here
          </p>
        </div>
      </div>
    );
  }

  const recipeName = extractRecipeName(result);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {canSave && onSave && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-gray-700">
            <ChefHat className="w-5 h-5 mr-2 text-green-600" />
            <span className="font-medium text-lg">{recipeName}</span>
          </div>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            Save Recipe
          </button>
        </div>
      )}
      <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
        <MarkdownRenderer content={result} />
      </div>
    </div>
  );
};
