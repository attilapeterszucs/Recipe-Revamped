import type { PersonalProfile, HealthGoal, UserSettings } from '../types/userSettings';

/**
 * Profile Context Builder for AI Recipe Personalization
 *
 * This module creates comprehensive context from user profile data
 * to enable personalized recipe generation and meal planning.
 */

export interface ProfileContext {
  demographics: {
    age?: number;
    gender?: string;
    activityLevel: string;
  };
  physicalMetrics: {
    height?: number;
    weight?: number;
    heightUnit: string;
    weightUnit: string;
    bmi?: number;
  };
  healthInformation: {
    allergies: string[];
    medicalConditions: string[];
    medications: string[];
  };
  lifestylePreferences: {
    cookingSkillLevel: string;
    timeAvailableForCooking: string;
    budgetPreference: string;
  };
  activeHealthGoals: HealthGoal[];
  dietaryRestrictions: string[];
  religiousRequirements: string[];
  nutritionalTargets?: {
    dailyCalories?: number;
    proteinTarget?: number;
    carbTarget?: number;
    fatTarget?: number;
  };
}

/**
 * Build comprehensive profile context from user settings
 */
export const buildProfileContext = (userSettings: UserSettings): ProfileContext | null => {
  const personalProfile = userSettings.personalProfile;

  if (!personalProfile) {
    return null;
  }

  // Calculate BMI if height and weight are available
  let bmi: number | undefined;
  if (personalProfile.height && personalProfile.weight) {
    let heightInMeters = personalProfile.height;
    let weightInKg = personalProfile.weight;

    // Convert height to meters if needed
    if (personalProfile.heightUnit === 'ft_in') {
      heightInMeters = personalProfile.height * 0.3048; // feet to meters
    } else {
      heightInMeters = personalProfile.height / 100; // cm to meters
    }

    // Convert weight to kg if needed
    if (personalProfile.weightUnit === 'lbs') {
      weightInKg = personalProfile.weight * 0.453592; // lbs to kg
    }

    bmi = weightInKg / (heightInMeters * heightInMeters);
  }

  return {
    demographics: {
      age: personalProfile.age,
      gender: personalProfile.gender,
      activityLevel: personalProfile.activityLevel
    },
    physicalMetrics: {
      height: personalProfile.height,
      weight: personalProfile.weight,
      heightUnit: personalProfile.heightUnit,
      weightUnit: personalProfile.weightUnit,
      bmi
    },
    healthInformation: {
      allergies: personalProfile.allergies || [],
      medicalConditions: personalProfile.medicalConditions || [],
      medications: personalProfile.medications || []
    },
    lifestylePreferences: {
      cookingSkillLevel: personalProfile.cookingSkillLevel,
      timeAvailableForCooking: personalProfile.timeAvailableForCooking,
      budgetPreference: personalProfile.budgetPreference
    },
    activeHealthGoals: personalProfile.healthGoals?.filter(goal => goal.isActive) || [],
    dietaryRestrictions: userSettings.defaultDietaryFilters || [],
    religiousRequirements: userSettings.religiousRequirements || [],
    nutritionalTargets: calculateNutritionalTargets(personalProfile)
  };
};

/**
 * Calculate nutritional targets based on profile and goals
 */
function calculateNutritionalTargets(profile: PersonalProfile): { dailyCalories?: number; proteinTarget?: number; carbTarget?: number; fatTarget?: number } | undefined {
  if (!profile.age || !profile.weight || !profile.height) {
    return undefined;
  }

  // Basic BMR calculation using Mifflin-St Jeor Equation
  let weightInKg = profile.weight;
  let heightInCm = profile.height;

  // Convert units if needed
  if (profile.weightUnit === 'lbs') {
    weightInKg = profile.weight * 0.453592;
  }
  if (profile.heightUnit === 'ft_in') {
    heightInCm = profile.height * 30.48; // feet to cm
  }

  let bmr: number;
  if (profile.gender === 'male') {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * profile.age + 5;
  } else if (profile.gender === 'female') {
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * profile.age - 161;
  } else {
    // Use average for other genders
    bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * profile.age - 78;
  }

  // Apply activity level multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };

  const multiplier = activityMultipliers[profile.activityLevel] || 1.55;
  let dailyCalories = Math.round(bmr * multiplier);

  // Adjust calories based on health goals
  const weightGoals = profile.healthGoals?.filter(goal =>
    goal.isActive && (goal.type === 'weight_loss' || goal.type === 'weight_gain')
  ) || [];

  if (weightGoals.length > 0) {
    const weightLossGoals = weightGoals.filter(goal => goal.type === 'weight_loss');
    const weightGainGoals = weightGoals.filter(goal => goal.type === 'weight_gain');

    if (weightLossGoals.length > 0) {
      dailyCalories -= 300; // Moderate deficit for weight loss
    } else if (weightGainGoals.length > 0) {
      dailyCalories += 300; // Moderate surplus for weight gain
    }
  }

  // Calculate macro targets
  const proteinTarget = Math.round(weightInKg * 1.6); // 1.6g per kg body weight
  const fatTarget = Math.round((dailyCalories * 0.25) / 9); // 25% of calories from fat
  const carbTarget = Math.round((dailyCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4); // Remaining calories from carbs

  return {
    dailyCalories,
    proteinTarget,
    carbTarget,
    fatTarget
  };
}

/**
 * Generate goal-specific prompts for AI recipe generation
 */
export const getGoalSpecificPrompts = (activeGoals: HealthGoal[]): string[] => {
  const prompts: string[] = [];

  activeGoals.forEach(goal => {
    switch (goal.type) {
      case 'weight_loss':
        prompts.push(`Focus on lower calorie options, high fiber ingredients, and portion control to support weight loss goals. Target: ${goal.targetValue || 'gradual weight loss'}${goal.unit || ''}.`);
        break;

      case 'weight_gain':
        prompts.push(`Include calorie-dense, nutrient-rich ingredients to support healthy weight gain. Target: ${goal.targetValue || 'gradual weight gain'}${goal.unit || ''}.`);
        break;

      case 'muscle_gain':
        prompts.push(`Emphasize high-protein ingredients (aim for 25-30g protein per meal) and post-workout nutrition to support muscle building.`);
        break;

      case 'performance':
        prompts.push(`Optimize for athletic performance with focus on complex carbohydrates, lean proteins, and recovery nutrients.`);
        break;

      case 'lifestyle':
        prompts.push(`Maintain consistency with ${goal.description} lifestyle requirements.`);
        break;

      case 'custom':
        prompts.push(`Custom goal: ${goal.description}`);
        break;
    }
  });

  return prompts;
};

/**
 * Generate allergy and medical condition warnings for recipes
 */
export const generateHealthWarnings = (profileContext: ProfileContext): string[] => {
  const warnings: string[] = [];

  // Allergy warnings
  if (profileContext.healthInformation.allergies.length > 0) {
    warnings.push(`ALLERGY ALERT: Avoid all ingredients containing or derived from: ${profileContext.healthInformation.allergies.join(', ')}.`);
  }

  // Medical condition considerations
  if (profileContext.healthInformation.medicalConditions.length > 0) {
    const conditions = profileContext.healthInformation.medicalConditions;

    if (conditions.some(c => c.toLowerCase().includes('diabetes'))) {
      warnings.push('DIABETES CONSIDERATION: Monitor carbohydrate content and glycemic index of ingredients.');
    }

    if (conditions.some(c => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('high blood pressure'))) {
      warnings.push('HYPERTENSION CONSIDERATION: Keep sodium content low (under 600mg per serving).');
    }

    if (conditions.some(c => c.toLowerCase().includes('heart') || c.toLowerCase().includes('cardiovascular'))) {
      warnings.push('HEART HEALTH CONSIDERATION: Emphasize heart-healthy fats and limit saturated fats.');
    }
  }

  // Medication interactions
  if (profileContext.healthInformation.medications.length > 0) {
    warnings.push('MEDICATION CONSIDERATION: Be aware of potential food-drug interactions. Consult healthcare provider if unsure.');
  }

  return warnings;
};

/**
 * Create cooking complexity guidance based on skill level and time
 */
export const getCookingGuidance = (profileContext: ProfileContext): string => {
  const { cookingSkillLevel, timeAvailableForCooking } = profileContext.lifestylePreferences;

  let guidance = '';

  // Skill level guidance
  switch (cookingSkillLevel) {
    case 'beginner':
      guidance += 'Keep techniques simple with clear, step-by-step instructions. Avoid complex knife work or advanced cooking methods. ';
      break;
    case 'intermediate':
      guidance += 'Include moderate complexity techniques but provide helpful tips. Some advanced methods are okay with guidance. ';
      break;
    case 'advanced':
      guidance += 'Feel free to include sophisticated techniques and complex flavor combinations. ';
      break;
    case 'professional':
      guidance += 'Can include professional-level techniques, equipment, and complex preparations. ';
      break;
  }

  // Time guidance
  switch (timeAvailableForCooking) {
    case 'under_15_min':
      guidance += 'Total cooking time must be under 15 minutes. Focus on quick-cooking methods, pre-cooked ingredients, or no-cook options.';
      break;
    case '15_30_min':
      guidance += 'Keep total cooking time between 15-30 minutes. One-pot meals and quick-cooking techniques preferred.';
      break;
    case '30_60_min':
      guidance += 'Cooking time can be 30-60 minutes. Allow for some prep work and moderate cooking techniques.';
      break;
    case 'over_60_min':
      guidance += 'Can include longer cooking times over 60 minutes. Slow-cooking, braising, and complex preparations are fine.';
      break;
  }

  return guidance;
};

/**
 * Generate budget-conscious ingredient suggestions
 */
export const getBudgetGuidance = (profileContext: ProfileContext): string => {
  switch (profileContext.lifestylePreferences.budgetPreference) {
    case 'budget_friendly':
      return 'Prioritize affordable, versatile ingredients. Suggest budget-friendly alternatives for expensive ingredients. Focus on seasonal and bulk ingredients.';
    case 'moderate':
      return 'Balance cost and quality. Include some premium ingredients but keep overall cost reasonable.';
    case 'premium':
      return 'Can include high-quality, artisanal, or specialty ingredients for optimal flavor and nutrition.';
    default:
      return '';
  }
};