import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Edit3, Filter, ChefHat, Clock, Users, Plus, Trash2, Heart, Lightbulb, Minus, Image, Upload } from 'lucide-react';
import type { SavedRecipe } from '../lib/validation';
import { updateRecipe } from '../lib/firestore';
import { useToast } from './ToastContainer';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface RecipeEditorProps {
  recipe: SavedRecipe;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedRecipe: SavedRecipe) => void;
}

interface ParsedRecipe {
  recipeName: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number | string;
  dietaryRequirements: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  tips: string | string[];
  isJsonFormat?: boolean;
}

// Helper function to parse time values (e.g., "15 minutes" -> {value: 15, unit: "minutes"})
const parseTimeValue = (timeStr: string): {value: number, unit: string} => {
  if (!timeStr) return {value: 0, unit: 'minutes'};
  
  const match = timeStr.match(/(\d+)\s*(minute|minutes|min|hour|hours|hr|h)/i);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    // Normalize unit
    const normalizedUnit = unit.includes('hour') || unit.includes('hr') || unit === 'h' ? 'hours' : 'minutes';
    return {value, unit: normalizedUnit};
  }
  
  // If no match, try to extract just the number
  const numberMatch = timeStr.match(/(\d+)/);
  if (numberMatch) {
    return {value: parseInt(numberMatch[1]), unit: 'minutes'};
  }
  
  return {value: 0, unit: 'minutes'};
};

// Helper function to format time values ({value: 15, unit: "minutes"} -> "15 minutes")
const formatTimeValue = (value: number, unit: string): string => {
  if (value === 0) return '';
  return `${value} ${unit}`;
};

// Parse recipe content from JSON or markdown format
const parseRecipe = (content: string): ParsedRecipe => {
  // Try to parse as JSON first
  try {
    const jsonData = JSON.parse(content);
    return {
      recipeName: jsonData.recipeName || '',
      prepTime: jsonData.prepTime || '',
      cookTime: jsonData.cookTime || '',
      totalTime: jsonData.totalTime || '',
      servings: jsonData.servings || 4,
      dietaryRequirements: jsonData.dietaryRequirements || '',
      ingredients: jsonData.ingredients || [],
      instructions: jsonData.instructions || [],
      nutrition: jsonData.nutrition || {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sodium: 0
      },
      tips: jsonData.tips || [],
      isJsonFormat: true
    };
  } catch {
    // Fall back to markdown parsing
  }

  const lines = content.split('\n');
  const parsed: ParsedRecipe = {
    recipeName: '',
    prepTime: '',
    cookTime: '',
    totalTime: '',
    servings: '',
    dietaryRequirements: '',
    ingredients: [],
    instructions: [],
    tips: '',
    isJsonFormat: false
  };

  let currentSection = '';
  let ingredientsStarted = false;
  let instructionsStarted = false;
  let tipsStarted = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Parse recipe name
    const recipeNameMatch = trimmedLine.match(/^\*\*Recipe Name:\*\*\s*[""]?([^"""\n]+)[""]?/i);
    if (recipeNameMatch) {
      parsed.recipeName = recipeNameMatch[1].trim();
      continue;
    }

    // Parse timing info
    const prepTimeMatch = trimmedLine.match(/^\*\*Prep Time:\*\*\s*(.+)/i);
    if (prepTimeMatch) {
      parsed.prepTime = prepTimeMatch[1].trim();
      continue;
    }

    const cookTimeMatch = trimmedLine.match(/^\*\*Cook Time:\*\*\s*(.+)/i);
    if (cookTimeMatch) {
      parsed.cookTime = cookTimeMatch[1].trim();
      continue;
    }

    const totalTimeMatch = trimmedLine.match(/^\*\*Total Time:\*\*\s*(.+)/i);
    if (totalTimeMatch) {
      parsed.totalTime = totalTimeMatch[1].trim();
      continue;
    }

    const servingsMatch = trimmedLine.match(/^\*\*Servings:\*\*\s*(.+)/i);
    if (servingsMatch) {
      parsed.servings = servingsMatch[1].trim();
      continue;
    }

    // Parse dietary requirements
    const dietaryMatch = trimmedLine.match(/^\*\*Dietary Requirements:\*\*\s*(.+)/i);
    if (dietaryMatch) {
      parsed.dietaryRequirements = dietaryMatch[1].trim();
      continue;
    }

    // Section headers
    if (trimmedLine.match(/^## Ingredients?:/i)) {
      currentSection = 'ingredients';
      ingredientsStarted = true;
      continue;
    }
    
    if (trimmedLine.match(/^## Instructions?:/i)) {
      currentSection = 'instructions';
      instructionsStarted = true;
      continue;
    }
    
    if (trimmedLine.match(/^## (Assembly\/Cooking Tips?|Tips?):/i)) {
      currentSection = 'tips';
      tipsStarted = true;
      continue;
    }

    // Parse content based on current section
    if (currentSection === 'ingredients' && ingredientsStarted) {
      if (trimmedLine.match(/^[-•*]\s+/)) {
        parsed.ingredients.push(trimmedLine.replace(/^[-•*]\s+/, '').trim());
      }
    } else if (currentSection === 'instructions' && instructionsStarted) {
      if (trimmedLine.match(/^\d+\.\s+/)) {
        parsed.instructions.push(trimmedLine.replace(/^\d+\.\s+/, '').trim());
      }
    } else if (currentSection === 'tips' && tipsStarted) {
      if (trimmedLine.match(/^[-•*]\s+/)) {
        parsed.tips += (parsed.tips ? '\n' : '') + trimmedLine.replace(/^[-•*]\s+/, '').trim();
      } else if (!trimmedLine.match(/^##/)) {
        parsed.tips += (parsed.tips ? '\n' : '') + trimmedLine;
      }
    }
  }

  return parsed;
};

// Build output format (JSON or markdown) from parsed recipe
const buildRecipeOutput = (parsed: ParsedRecipe, dietaryFilters: string[]): string => {
  if (parsed.isJsonFormat) {
    // Build JSON format
    const jsonOutput = {
      recipeName: parsed.recipeName,
      prepTime: parsed.prepTime,
      cookTime: parsed.cookTime,
      totalTime: parsed.totalTime,
      servings: typeof parsed.servings === 'string' ? (isNaN(parseInt(parsed.servings)) ? parsed.servings : parseInt(parsed.servings)) : parsed.servings,
      dietaryRequirements: dietaryFilters.length > 0 ? dietaryFilters.join(', ') : parsed.dietaryRequirements,
      ingredients: parsed.ingredients.filter(ing => ing.trim()),
      instructions: parsed.instructions.filter(inst => inst.trim()),
      nutrition: parsed.nutrition || {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sodium: 0
      },
      tips: Array.isArray(parsed.tips) ? parsed.tips.filter(tip => tip && tip.trim()) : 
            parsed.tips && parsed.tips.trim() ? [parsed.tips.trim()] : []
    };
    
    return JSON.stringify(jsonOutput, null, 2);
  } else {
    // Build markdown format (legacy)
    let markdown = `**Recipe Name:** "${parsed.recipeName}"\n\n`;
    
    if (parsed.prepTime) markdown += `**Prep Time:** ${parsed.prepTime}\n`;
    if (parsed.cookTime) markdown += `**Cook Time:** ${parsed.cookTime}\n`;
    if (parsed.totalTime) markdown += `**Total Time:** ${parsed.totalTime}\n`;
    if (parsed.servings) markdown += `**Servings:** ${parsed.servings}\n\n`;
    
    if (dietaryFilters.length > 0) {
      markdown += `**Dietary Requirements:** ${dietaryFilters.join(', ')}\n\n`;
    }
    
    if (parsed.ingredients.length > 0) {
      markdown += `## Ingredients:\n`;
      parsed.ingredients.forEach(ingredient => {
        markdown += `- ${ingredient}\n`;
      });
      markdown += '\n';
    }
    
    if (parsed.instructions.length > 0) {
      markdown += `## Instructions:\n`;
      parsed.instructions.forEach((instruction, index) => {
        markdown += `${index + 1}. ${instruction}\n`;
      });
      markdown += '\n';
    }
    
    if (parsed.tips && (Array.isArray(parsed.tips) ? parsed.tips.length > 0 && parsed.tips.some(tip => tip.trim()) : parsed.tips.trim())) {
      const tipsText = Array.isArray(parsed.tips) ? parsed.tips.filter(tip => tip.trim()).join('\n') : parsed.tips;
      markdown += `## Assembly/Cooking Tips:\n${tipsText}\n`;
    }
    
    return markdown.trim();
  }
};

export const RecipeEditor: React.FC<RecipeEditorProps> = ({ 
  recipe, 
  isOpen, 
  onClose, 
  onUpdate 
}) => {
  const [title, setTitle] = useState(recipe.title);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe>(() => parseRecipe(recipe.convertedRecipe));
  const [dietaryFilters, setDietaryFilters] = useState<string[]>(recipe.dietaryFilters);
  const [category, setCategory] = useState<string>(recipe.category || 'main-dish');
  const [imageUrl, setImageUrl] = useState<string>(recipe.imageUrl || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Time state with structured values
  const [prepTime, setPrepTime] = useState(() => parseTimeValue(parseRecipe(recipe.convertedRecipe).prepTime));
  const [cookTime, setCookTime] = useState(() => parseTimeValue(parseRecipe(recipe.convertedRecipe).cookTime));
  const [totalTime, setTotalTime] = useState(() => parseTimeValue(parseRecipe(recipe.convertedRecipe).totalTime));

  const { showSuccess, showError } = useToast();

  // Lock body scroll when editor is open
  useBodyScrollLock(isOpen);

  // Get available dietary filters from environment
  const availableFilters = (import.meta.env.VITE_ALLOWED_FILTERS as string).split(',');

  useEffect(() => {
    if (isOpen && recipe) {
      const parsed = parseRecipe(recipe.convertedRecipe);
      setTitle(recipe.title);
      setParsedRecipe(parsed);
      setDietaryFilters([...recipe.dietaryFilters]);
      setCategory(recipe.category || 'main-dish');
      setImageUrl(recipe.imageUrl || '');
      setImageFile(null);
      
      // Reset time states
      setPrepTime(parseTimeValue(parsed.prepTime));
      setCookTime(parseTimeValue(parsed.cookTime));
      setTotalTime(parseTimeValue(parsed.totalTime));
    }
  }, [isOpen, recipe]);

  // Helper functions for managing ingredients
  const addIngredient = () => {
    setParsedRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setParsedRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => 
        i === index ? value : ingredient
      )
    }));
  };

  const removeIngredient = (index: number) => {
    setParsedRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Helper functions for managing instructions
  const addInstruction = () => {
    setParsedRecipe(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setParsedRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.map((instruction, i) => 
        i === index ? value : instruction
      )
    }));
  };

  const removeInstruction = (index: number) => {
    setParsedRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  // Helper functions for managing tips (array format for JSON recipes)
  const addTip = () => {
    setParsedRecipe(prev => {
      const currentTips = Array.isArray(prev.tips) ? prev.tips : (prev.tips ? [prev.tips] : []);
      return {
        ...prev,
        tips: [...currentTips, '']
      };
    });
  };

  const updateTip = (index: number, value: string) => {
    setParsedRecipe(prev => {
      const currentTips = Array.isArray(prev.tips) ? prev.tips : (prev.tips ? [prev.tips] : []);
      return {
        ...prev,
        tips: currentTips.map((tip, i) => i === index ? value : tip)
      };
    });
  };

  const removeTip = (index: number) => {
    setParsedRecipe(prev => {
      const currentTips = Array.isArray(prev.tips) ? prev.tips : (prev.tips ? [prev.tips] : []);
      return {
        ...prev,
        tips: currentTips.filter((_, i) => i !== index)
      };
    });
  };

  // Helper functions for managing nutrition
  const updateNutritionField = (field: keyof NonNullable<ParsedRecipe['nutrition']>, value: number) => {
    setParsedRecipe(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition!,
        [field]: value
      }
    }));
  };

  // Update recipe field
  const updateRecipeField = (field: keyof ParsedRecipe, value: string) => {
    setParsedRecipe(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle image file selection
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('File Too Large', 'Please select an image smaller than 5MB.', 'upload');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        showError('Invalid File Type', 'Please select a valid image file.', 'upload');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImageUrl('');
    setImageFile(null);
    // Reset file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFilterToggle = (filter: string) => {
    setDietaryFilters(prev => 
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!title.trim()) {
        showError('Validation Error', 'Recipe title is required.', 'save');
        return;
      }
      
      if (parsedRecipe.ingredients.length === 0 || !parsedRecipe.ingredients.some(ing => ing.trim())) {
        showError('Validation Error', 'At least one ingredient is required.', 'save');
        return;
      }
      
      if (parsedRecipe.instructions.length === 0 || !parsedRecipe.instructions.some(inst => inst.trim())) {
        showError('Validation Error', 'At least one instruction is required.', 'save');
        return;
      }
      
      // Update parsedRecipe with current time values before building output
      const updatedParsedRecipe = {
        ...parsedRecipe,
        prepTime: formatTimeValue(prepTime.value, prepTime.unit),
        cookTime: formatTimeValue(cookTime.value, cookTime.unit),
        totalTime: formatTimeValue(totalTime.value, totalTime.unit)
      };
      
      // Build the output format (JSON or markdown) from the parsed recipe
      const rebuiltContent = buildRecipeOutput(updatedParsedRecipe, dietaryFilters);
      
      // Debug logging to help identify issues
      
      // Handle image upload first if there's a new image
      let finalImageUrl = imageUrl; // Always use the current imageUrl state
      
      if (imageFile) {
        setUploadingImage(true);
        try {
          // For now, we'll use a simple base64 encoding approach
          // In a real app, you'd upload to a service like Firebase Storage, AWS S3, etc.
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(imageFile);
          });
          finalImageUrl = await base64Promise;
        } catch (error) {
          console.error('Error uploading image:', error);
          showError('Image Upload Failed', 'Could not upload the image. The recipe will be saved without the image.', 'upload');
          // Continue with current imageUrl
          finalImageUrl = imageUrl;
        } finally {
          setUploadingImage(false);
        }
      }

      // Update the recipe in Firestore
      const updateData = {
        title: title.trim(),
        convertedRecipe: rebuiltContent,
        dietaryFilters,
        category,
        imageUrl: finalImageUrl
      };
      
      await updateRecipe(recipe.id, updateData);

      // Create updated recipe object for parent component
      const updatedRecipe: SavedRecipe = {
        ...recipe,
        title: title.trim(),
        convertedRecipe: rebuiltContent,
        dietaryFilters,
        category: category as "appetizer" | "main-dish" | "side-dish" | "dessert",
        imageUrl: finalImageUrl,
        updatedAt: new Date() // This will be set by Firestore, but we set it here for immediate UI update
      };

      onUpdate(updatedRecipe);
      showSuccess('Recipe Updated', 'Your recipe has been successfully updated', 'save');
      onClose();
    } catch (error) {
      console.error('Failed to update recipe:', error);
      showError('Update Failed', 'Could not update the recipe. Please try again.', 'save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    const parsed = parseRecipe(recipe.convertedRecipe);
    setTitle(recipe.title);
    setParsedRecipe(parsed);
    setDietaryFilters([...recipe.dietaryFilters]);
    setCategory(recipe.category || 'main-dish');
    setImageUrl(recipe.imageUrl || '');
    setImageFile(null);
    
    // Reset time states
    setPrepTime(parseTimeValue(parsed.prepTime));
    setCookTime(parseTimeValue(parsed.cookTime));
    setTotalTime(parseTimeValue(parsed.totalTime));
    
    // Reset file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 flex items-center justify-between relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          <div className="flex items-center space-x-3 relative z-10">
            <div className="text-white bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Edit3 className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Edit Recipe</h2>
          </div>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="text-white/90 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm relative z-10 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-8">
            {/* Recipe Title */}
            <div>
              <label htmlFor="recipe-title" className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Name
              </label>
              <div className="relative">
                <ChefHat className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="recipe-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter recipe name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Recipe Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Image className="inline w-4 h-4 mr-2" />
                  Recipe Image
                </label>
                
                <div className="space-y-4">
                  {/* Current Image Preview */}
                  {imageUrl && (
                    <div className="relative inline-block">
                      <img 
                        src={imageUrl} 
                        alt="Recipe preview" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={saving}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={saving || uploadingImage}
                        className="hidden"
                      />
                      <label
                        htmlFor="image-upload"
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                          saving || uploadingImage
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {imageUrl ? 'Change Image' : 'Upload Image'}
                      </label>
                    </div>
                    
                    <p className="text-sm text-gray-500">
                      JPG, PNG up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Recipe Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Prep Time
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={prepTime.value || ''}
                      onChange={(e) => setPrepTime(prev => ({...prev, value: parseInt(e.target.value) || 0}))}
                      placeholder="15"
                      min="0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      disabled={saving}
                    />
                    <select
                      value={prepTime.unit}
                      onChange={(e) => setPrepTime(prev => ({...prev, unit: e.target.value}))}
                      className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                      disabled={saving}
                    >
                      <option value="minutes">min</option>
                      <option value="hours">hrs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Cook Time
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={cookTime.value || ''}
                      onChange={(e) => setCookTime(prev => ({...prev, value: parseInt(e.target.value) || 0}))}
                      placeholder="30"
                      min="0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      disabled={saving}
                    />
                    <select
                      value={cookTime.unit}
                      onChange={(e) => setCookTime(prev => ({...prev, unit: e.target.value}))}
                      className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                      disabled={saving}
                    >
                      <option value="minutes">min</option>
                      <option value="hours">hrs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Total Time
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={totalTime.value || ''}
                      onChange={(e) => setTotalTime(prev => ({...prev, value: parseInt(e.target.value) || 0}))}
                      placeholder="45"
                      min="0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      disabled={saving}
                    />
                    <select
                      value={totalTime.unit}
                      onChange={(e) => setTotalTime(prev => ({...prev, unit: e.target.value}))}
                      className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                      disabled={saving}
                    >
                      <option value="minutes">min</option>
                      <option value="hours">hrs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="inline w-4 h-4 mr-1" />
                    Servings
                  </label>
                  <input
                    type="text"
                    value={parsedRecipe.servings}
                    onChange={(e) => updateRecipeField('servings', e.target.value)}
                    placeholder="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Dietary Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Filter className="inline w-4 h-4 mr-2" />
                  Dietary Filters
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableFilters.map(filter => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => handleFilterToggle(filter)}
                      disabled={saving}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        dietaryFilters.includes(filter)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipe Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <ChefHat className="inline w-4 h-4 mr-2" />
                  Recipe Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="appetizer">🍤 Appetizer</option>
                  <option value="main-dish">🍽️ Main Dish</option>
                  <option value="side-dish">🥔 Side Dish</option>
                  <option value="dessert">🍰 Dessert</option>
                </select>
              </div>

              {/* Ingredients Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Ingredients
                  </label>
                  <button
                    type="button"
                    onClick={addIngredient}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Ingredient
                  </button>
                </div>
                <div className="space-y-2">
                  {parsedRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        placeholder="e.g., 2 cups flour"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        disabled={saving}
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        disabled={saving}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {parsedRecipe.ingredients.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No ingredients added yet.</p>
                  )}
                </div>
              </div>

              {/* Instructions Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Instructions
                  </label>
                  <button
                    type="button"
                    onClick={addInstruction}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </button>
                </div>
                <div className="space-y-3">
                  {parsedRecipe.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mt-1">
                        {index + 1}
                      </div>
                      <textarea
                        value={instruction}
                        onChange={(e) => updateInstruction(index, e.target.value)}
                        placeholder="Describe this step..."
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                        disabled={saving}
                      />
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        disabled={saving}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {parsedRecipe.instructions.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No instructions added yet.</p>
                  )}
                </div>
              </div>

              {/* Nutrition Section (JSON format only) */}
              {parsedRecipe.isJsonFormat && parsedRecipe.nutrition && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Heart className="inline w-4 h-4 mr-2 text-green-600" />
                    Nutrition Information (per serving)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-green-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Calories</label>
                      <input
                        type="number"
                        value={parsedRecipe.nutrition.calories}
                        onChange={(e) => updateNutritionField('calories', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                        min="0"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={parsedRecipe.nutrition.protein}
                        onChange={(e) => updateNutritionField('protein', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                        min="0"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        value={parsedRecipe.nutrition.carbohydrates}
                        onChange={(e) => updateNutritionField('carbohydrates', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                        min="0"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fat (g)</label>
                      <input
                        type="number"
                        value={parsedRecipe.nutrition.fat}
                        onChange={(e) => updateNutritionField('fat', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                        min="0"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fiber (g)</label>
                      <input
                        type="number"
                        value={parsedRecipe.nutrition.fiber}
                        onChange={(e) => updateNutritionField('fiber', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                        min="0"
                        disabled={saving}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sodium (mg)</label>
                      <input
                        type="number"
                        value={parsedRecipe.nutrition.sodium}
                        onChange={(e) => updateNutritionField('sodium', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                        min="0"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tips Section */}
              <div>
                {parsedRecipe.isJsonFormat ? (
                  // Array-based tips for JSON format
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        <Lightbulb className="inline w-4 h-4 mr-2 text-orange-600" />
                        Chef's Tips (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={addTip}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-1 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Tip
                      </button>
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(parsedRecipe.tips) && parsedRecipe.tips.map((tip, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={tip}
                            onChange={(e) => updateTip(index, e.target.value)}
                            placeholder="Enter a helpful cooking tip..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                            disabled={saving}
                          />
                          <button
                            type="button"
                            onClick={() => removeTip(index)}
                            disabled={saving}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!Array.isArray(parsedRecipe.tips) || parsedRecipe.tips.length === 0) && (
                        <p className="text-gray-500 text-sm italic">No tips added yet.</p>
                      )}
                    </div>
                  </>
                ) : (
                  // Text-based tips for markdown format
                  <>
                    <label htmlFor="recipe-tips" className="block text-sm font-medium text-gray-700 mb-2">
                      Cooking Tips & Notes (Optional)
                    </label>
                    <textarea
                      id="recipe-tips"
                      value={typeof parsedRecipe.tips === 'string' ? parsedRecipe.tips : ''}
                      onChange={(e) => updateRecipeField('tips', e.target.value)}
                      placeholder="Add any helpful cooking tips, serving suggestions, or notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                      disabled={saving}
                    />
                  </>
                )}
              </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gradient-to-br from-gray-50 to-green-50/30 px-6 py-4 flex justify-between items-center border-t-2 border-gray-100">
          <div className="text-sm text-gray-500">
            <div className="flex items-center">
              Last updated: {recipe.updatedAt?.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                saving ||
                uploadingImage ||
                !title.trim() ||
                parsedRecipe.ingredients.length === 0 ||
                !parsedRecipe.ingredients.some(ing => ing.trim()) ||
                parsedRecipe.instructions.length === 0 ||
                !parsedRecipe.instructions.some(inst => inst.trim())
              }
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {(saving || uploadingImage) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  {uploadingImage ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecipeEditor;