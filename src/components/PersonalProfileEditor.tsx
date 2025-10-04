import React, { useState, useCallback } from 'react';
import { User, Activity, AlertTriangle, Scale } from 'lucide-react';
import type { PersonalProfile } from '../types/userSettings';
import { CustomDropdown } from './CustomDropdown';

interface PersonalProfileEditorProps {
  personalProfile: PersonalProfile;
  onUpdateProfile: (profile: PersonalProfile) => void;
  disabled?: boolean;
  preferredUnits?: 'metric' | 'imperial';
}

export const PersonalProfileEditor: React.FC<PersonalProfileEditorProps> = ({
  personalProfile,
  onUpdateProfile,
  disabled = false,
  preferredUnits = 'metric'
}) => {
  const [activeSection, setActiveSection] = useState('demographics');
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const updateProfile = useCallback((updates: Partial<PersonalProfile>) => {
    onUpdateProfile({
      ...personalProfile,
      ...updates,
      updatedAt: new Date()
    });
  }, [personalProfile, onUpdateProfile]);

  // Sync units with user's preferred measurement system
  React.useEffect(() => {
    const shouldUpdateUnits =
      (preferredUnits === 'metric' && (personalProfile.heightUnit !== 'cm' || personalProfile.weightUnit !== 'kg')) ||
      (preferredUnits === 'imperial' && (personalProfile.heightUnit !== 'ft_in' || personalProfile.weightUnit !== 'lbs'));

    if (shouldUpdateUnits) {
      updateProfile({
        heightUnit: preferredUnits === 'metric' ? 'cm' : 'ft_in',
        weightUnit: preferredUnits === 'metric' ? 'kg' : 'lbs'
      });
    }
  }, [preferredUnits, personalProfile.heightUnit, personalProfile.weightUnit, updateProfile]);

  const addItem = (field: 'allergies' | 'medicalConditions' | 'medications', value: string) => {
    if (!value.trim()) return;

    const currentItems = personalProfile[field] || [];
    if (!currentItems.includes(value.trim())) {
      updateProfile({
        [field]: [...currentItems, value.trim()]
      });
    }

    // Clear input
    if (field === 'allergies') setNewAllergy('');
    if (field === 'medicalConditions') setNewCondition('');
    if (field === 'medications') setNewMedication('');
  };

  const removeItem = (field: 'allergies' | 'medicalConditions' | 'medications', value: string) => {
    const currentItems = personalProfile[field] || [];
    updateProfile({
      [field]: currentItems.filter(item => item !== value)
    });
  };

  const sections = [
    { id: 'demographics', label: 'Demographics', icon: User },
    { id: 'physical', label: 'Physical', icon: Scale },
    { id: 'health', label: 'Health Info', icon: AlertTriangle },
    { id: 'lifestyle', label: 'Lifestyle', icon: Activity }
  ];

  return (
    <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl border-2 border-green-100 shadow-lg">
      {/* Section Navigation */}
      <div className="border-b-2 border-green-100">
        <nav className="flex flex-wrap gap-2 sm:gap-4 md:space-x-8 md:gap-0 px-4 sm:px-6 py-4 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 whitespace-nowrap min-w-fit ${
                activeSection === section.id
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 font-bold scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-green-50 border-2 border-gray-200 hover:border-green-200 font-semibold'
              }`}
            >
              <section.icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm sm:text-base">{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Demographics Section */}
        {activeSection === 'demographics' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Demographics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  min="13"
                  max="120"
                  value={personalProfile.age || ''}
                  onChange={(e) => updateProfile({ age: parseInt(e.target.value) || undefined })}
                  disabled={disabled}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Gender
                </label>
                <CustomDropdown
                  value={personalProfile.gender || ''}
                  onChange={(value) => updateProfile({ gender: value as PersonalProfile['gender'] || undefined })}
                  options={[
                    { value: '', label: 'Select gender', icon: '👤' },
                    { value: 'male', label: 'Male', icon: '👨' },
                    { value: 'female', label: 'Female', icon: '👩' },
                    { value: 'other', label: 'Other', icon: '🧑' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: '🤐' }
                  ]}
                  placeholder="Select gender"
                  icon={<User className="w-5 h-5 text-gray-400" />}
                  ariaLabel="Gender selection"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Activity Level
                </label>
                <CustomDropdown
                  value={personalProfile.activityLevel}
                  onChange={(value) => updateProfile({ activityLevel: value as PersonalProfile['activityLevel'] })}
                  options={[
                    { value: 'sedentary', label: 'Sedentary (little to no exercise)', icon: '🛋️' },
                    { value: 'lightly_active', label: 'Lightly Active (light exercise 1-3 days/week)', icon: '🚶' },
                    { value: 'moderately_active', label: 'Moderately Active (moderate exercise 3-5 days/week)', icon: '🏃' },
                    { value: 'very_active', label: 'Very Active (hard exercise 6-7 days/week)', icon: '🏋️' },
                    { value: 'extremely_active', label: 'Extremely Active (very hard exercise, physical job)', icon: '💪' }
                  ]}
                  placeholder="Select activity level"
                  icon={<Activity className="w-5 h-5 text-gray-400" />}
                  ariaLabel="Activity level selection"
                />
              </div>
            </div>
          </div>
        )}

        {/* Physical Section */}
        {activeSection === 'physical' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
              <Scale className="w-5 h-5 text-green-600" />
              Physical Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Height
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={personalProfile.height || ''}
                    onChange={(e) => updateProfile({ height: parseFloat(e.target.value) || undefined })}
                    disabled={disabled}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                    placeholder="Height"
                  />
                  <CustomDropdown
                    value={personalProfile.heightUnit}
                    onChange={(value) => updateProfile({ heightUnit: value as PersonalProfile['heightUnit'] })}
                    options={[
                      { value: 'cm', label: 'cm', icon: '📏' },
                      { value: 'ft_in', label: 'ft/in', icon: '📐' }
                    ]}
                    placeholder="Unit"
                    className="w-32"
                    ariaLabel="Height unit selection"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Weight
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={personalProfile.weight || ''}
                    onChange={(e) => updateProfile({ weight: parseFloat(e.target.value) || undefined })}
                    disabled={disabled}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                    placeholder="Weight"
                  />
                  <CustomDropdown
                    value={personalProfile.weightUnit}
                    onChange={(value) => updateProfile({ weightUnit: value as PersonalProfile['weightUnit'] })}
                    options={[
                      { value: 'kg', label: 'kg', icon: '⚖️' },
                      { value: 'lbs', label: 'lbs', icon: '📊' }
                    ]}
                    placeholder="Unit"
                    className="w-32"
                    ariaLabel="Weight unit selection"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-4 shadow-lg">
              <p className="text-sm text-gray-800">
                <strong className="text-green-700">Privacy Note:</strong> Your physical metrics are used only to provide personalized nutrition recommendations. This data is stored securely and never shared.
              </p>
            </div>
          </div>
        )}

        {/* Health Info Section */}
        {activeSection === 'health' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-green-600" />
              Health Information
            </h3>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Food Allergies & Intolerances
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('allergies', newAllergy)}
                  disabled={disabled}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                  placeholder="Add allergy or intolerance"
                />
                <button
                  onClick={() => addItem('allergies', newAllergy)}
                  disabled={disabled || !newAllergy.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(personalProfile.allergies || []).map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-semibold border-2 border-red-200"
                  >
                    {allergy}
                    <button
                      onClick={() => removeItem('allergies', allergy)}
                      disabled={disabled}
                      className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50 font-bold text-lg"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Medical Conditions
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('medicalConditions', newCondition)}
                  disabled={disabled}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                  placeholder="Add medical condition"
                />
                <button
                  onClick={() => addItem('medicalConditions', newCondition)}
                  disabled={disabled || !newCondition.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(personalProfile.medicalConditions || []).map((condition, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold border-2 border-orange-200"
                  >
                    {condition}
                    <button
                      onClick={() => removeItem('medicalConditions', condition)}
                      disabled={disabled}
                      className="ml-2 text-orange-600 hover:text-orange-800 disabled:opacity-50 font-bold text-lg"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Medications
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('medications', newMedication)}
                  disabled={disabled}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                  placeholder="Add medication"
                />
                <button
                  onClick={() => addItem('medications', newMedication)}
                  disabled={disabled || !newMedication.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(personalProfile.medications || []).map((medication, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold border-2 border-purple-200"
                  >
                    {medication}
                    <button
                      onClick={() => removeItem('medications', medication)}
                      disabled={disabled}
                      className="ml-2 text-purple-600 hover:text-purple-800 disabled:opacity-50 font-bold text-lg"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50/50 border-2 border-yellow-200 rounded-2xl p-4 shadow-lg">
              <p className="text-sm text-gray-800">
                <strong className="text-yellow-700">Medical Disclaimer:</strong> This information is used only for recipe personalization. Always consult your healthcare provider for medical advice and dietary restrictions.
              </p>
            </div>
          </div>
        )}

        {/* Lifestyle Section */}
        {activeSection === 'lifestyle' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Lifestyle Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Cooking Skill Level
                </label>
                <CustomDropdown
                  value={personalProfile.cookingSkillLevel}
                  onChange={(value) => updateProfile({ cookingSkillLevel: value as PersonalProfile['cookingSkillLevel'] })}
                  options={[
                    { value: 'beginner', label: 'Beginner (basic recipes)', icon: '🥄' },
                    { value: 'intermediate', label: 'Intermediate (moderate complexity)', icon: '👨‍🍳' },
                    { value: 'advanced', label: 'Advanced (complex techniques)', icon: '🔪' },
                    { value: 'professional', label: 'Professional (expert level)', icon: '⭐' }
                  ]}
                  placeholder="Select skill level"
                  icon={<Activity className="w-5 h-5 text-gray-400" />}
                  ariaLabel="Cooking skill level selection"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Available Cooking Time
                </label>
                <CustomDropdown
                  value={personalProfile.timeAvailableForCooking}
                  onChange={(value) => updateProfile({ timeAvailableForCooking: value as PersonalProfile['timeAvailableForCooking'] })}
                  options={[
                    { value: 'under_15_min', label: 'Under 15 minutes', icon: '⚡' },
                    { value: '15_30_min', label: '15-30 minutes', icon: '⏱️' },
                    { value: '30_60_min', label: '30-60 minutes', icon: '⏰' },
                    { value: 'over_60_min', label: 'Over 60 minutes', icon: '🕐' }
                  ]}
                  placeholder="Select cooking time"
                  icon={<Activity className="w-5 h-5 text-gray-400" />}
                  ariaLabel="Available cooking time selection"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Budget Preference
                </label>
                <CustomDropdown
                  value={personalProfile.budgetPreference}
                  onChange={(value) => updateProfile({ budgetPreference: value as PersonalProfile['budgetPreference'] })}
                  options={[
                    { value: 'budget_friendly', label: 'Budget Friendly (affordable ingredients)', icon: '💰' },
                    { value: 'moderate', label: 'Moderate (balanced cost and quality)', icon: '💵' },
                    { value: 'premium', label: 'Premium (high-quality ingredients)', icon: '💎' }
                  ]}
                  placeholder="Select budget preference"
                  icon={<Activity className="w-5 h-5 text-gray-400" />}
                  ariaLabel="Budget preference selection"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-4 shadow-lg">
              <h4 className="font-black text-green-800 mb-2">How This Helps</h4>
              <ul className="text-sm text-gray-800 space-y-1">
                <li>• <strong className="text-green-700">Cooking Level:</strong> Recipes matched to your skill and comfort level</li>
                <li>• <strong className="text-green-700">Time Available:</strong> Meal suggestions that fit your schedule</li>
                <li>• <strong className="text-green-700">Budget:</strong> Ingredient recommendations within your price range</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};