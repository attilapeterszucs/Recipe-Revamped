import React, { useState } from 'react';
import { User, Activity, Clock, DollarSign, AlertTriangle, Pill, Scale, Ruler } from 'lucide-react';
import type { PersonalProfile } from '../types/userSettings';
import { DEFAULT_PERSONAL_PROFILE } from '../types/userSettings';

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
  }, [preferredUnits]);

  const updateProfile = (updates: Partial<PersonalProfile>) => {
    onUpdateProfile({
      ...personalProfile,
      ...updates,
      updatedAt: new Date()
    });
  };

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
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap gap-2 sm:gap-4 md:space-x-8 md:gap-0 px-4 sm:px-6 py-4 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              disabled={disabled}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap min-w-fit ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <section.icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Demographics Section */}
        {activeSection === 'demographics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Demographics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  min="13"
                  max="120"
                  value={personalProfile.age || ''}
                  onChange={(e) => updateProfile({ age: parseInt(e.target.value) || undefined })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={personalProfile.gender || ''}
                  onChange={(e) => updateProfile({ gender: e.target.value as PersonalProfile['gender'] || undefined })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Level
                </label>
                <select
                  value={personalProfile.activityLevel}
                  onChange={(e) => updateProfile({ activityLevel: e.target.value as PersonalProfile['activityLevel'] })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
                  <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
                  <option value="extremely_active">Extremely Active (very hard exercise, physical job)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Physical Section */}
        {activeSection === 'physical' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Scale className="w-5 h-5 mr-2" />
              Physical Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={personalProfile.height || ''}
                    onChange={(e) => updateProfile({ height: parseFloat(e.target.value) || undefined })}
                    disabled={disabled}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Height"
                  />
                  <select
                    value={personalProfile.heightUnit}
                    onChange={(e) => updateProfile({ heightUnit: e.target.value as PersonalProfile['heightUnit'] })}
                    disabled={disabled}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="cm">cm</option>
                    <option value="ft_in">ft/in</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={personalProfile.weight || ''}
                    onChange={(e) => updateProfile({ weight: parseFloat(e.target.value) || undefined })}
                    disabled={disabled}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Weight"
                  />
                  <select
                    value={personalProfile.weightUnit}
                    onChange={(e) => updateProfile({ weightUnit: e.target.value as PersonalProfile['weightUnit'] })}
                    disabled={disabled}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Privacy Note:</strong> Your physical metrics are used only to provide personalized nutrition recommendations. This data is stored securely and never shared.
              </p>
            </div>
          </div>
        )}

        {/* Health Info Section */}
        {activeSection === 'health' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Health Information
            </h3>

            {/* Allergies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Food Allergies & Intolerances
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('allergies', newAllergy)}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Add allergy or intolerance"
                />
                <button
                  onClick={() => addItem('allergies', newAllergy)}
                  disabled={disabled || !newAllergy.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(personalProfile.allergies || []).map((allergy, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {allergy}
                    <button
                      onClick={() => removeItem('allergies', allergy)}
                      disabled={disabled}
                      className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Conditions
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('medicalConditions', newCondition)}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Add medical condition"
                />
                <button
                  onClick={() => addItem('medicalConditions', newCondition)}
                  disabled={disabled || !newCondition.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(personalProfile.medicalConditions || []).map((condition, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                  >
                    {condition}
                    <button
                      onClick={() => removeItem('medicalConditions', condition)}
                      disabled={disabled}
                      className="ml-2 text-orange-600 hover:text-orange-800 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medications
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('medications', newMedication)}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Add medication"
                />
                <button
                  onClick={() => addItem('medications', newMedication)}
                  disabled={disabled || !newMedication.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(personalProfile.medications || []).map((medication, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {medication}
                    <button
                      onClick={() => removeItem('medications', medication)}
                      disabled={disabled}
                      className="ml-2 text-purple-600 hover:text-purple-800 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Medical Disclaimer:</strong> This information is used only for recipe personalization. Always consult your healthcare provider for medical advice and dietary restrictions.
              </p>
            </div>
          </div>
        )}

        {/* Lifestyle Section */}
        {activeSection === 'lifestyle' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Lifestyle Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cooking Skill Level
                </label>
                <select
                  value={personalProfile.cookingSkillLevel}
                  onChange={(e) => updateProfile({ cookingSkillLevel: e.target.value as PersonalProfile['cookingSkillLevel'] })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="beginner">Beginner (basic recipes)</option>
                  <option value="intermediate">Intermediate (moderate complexity)</option>
                  <option value="advanced">Advanced (complex techniques)</option>
                  <option value="professional">Professional (expert level)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Cooking Time
                </label>
                <select
                  value={personalProfile.timeAvailableForCooking}
                  onChange={(e) => updateProfile({ timeAvailableForCooking: e.target.value as PersonalProfile['timeAvailableForCooking'] })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="under_15_min">Under 15 minutes</option>
                  <option value="15_30_min">15-30 minutes</option>
                  <option value="30_60_min">30-60 minutes</option>
                  <option value="over_60_min">Over 60 minutes</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Preference
                </label>
                <select
                  value={personalProfile.budgetPreference}
                  onChange={(e) => updateProfile({ budgetPreference: e.target.value as PersonalProfile['budgetPreference'] })}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="budget_friendly">Budget Friendly (affordable ingredients)</option>
                  <option value="moderate">Moderate (balanced cost and quality)</option>
                  <option value="premium">Premium (high-quality ingredients)</option>
                </select>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">How This Helps</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• <strong>Cooking Level:</strong> Recipes matched to your skill and comfort level</li>
                <li>• <strong>Time Available:</strong> Meal suggestions that fit your schedule</li>
                <li>• <strong>Budget:</strong> Ingredient recommendations within your price range</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};