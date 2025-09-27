import React from 'react';
import { AlertTriangle, Shield, BookOpen } from 'lucide-react';

interface OpenAIConsentProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const OpenAIConsent: React.FC<OpenAIConsentProps> = ({ isOpen, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Recipe Generation Consent</h2>
                <p className="text-sm text-gray-600">Data sharing with OpenAI</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    To provide AI-powered recipe generation, we use OpenAI's ChatGPT-4o-mini service. 
                    Please read the following information carefully before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">What data is shared with OpenAI?</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                <li>Your recipe input text (ingredients lists, dish names, cooking instructions)</li>
                <li>Your dietary preferences and restrictions</li>
                <li>Recipe conversion requests and modifications</li>
                <li>No personal information, email addresses, or account details</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">How does OpenAI use this data?</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                <li>To generate personalized recipe responses for your requests</li>
                <li>To improve their AI models and services (if sharing is enabled)</li>
                <li>For research, development, evaluation, and testing purposes</li>
                <li>OpenAI processes this data as an independent Data Controller</li>
              </ul>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Your Rights & Choices</h3>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1">
                    <li>• You can change your consent settings at any time</li>
                    <li>• Only content shared after consent is used for training</li>
                    <li>• You control what recipe information you share</li>
                    <li>• No sensitive or personal data should be included in recipes</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Important Restrictions</h3>
              <p className="text-sm text-gray-700">
                By using this service, you confirm that you will NOT include in your recipe inputs:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Sensitive, confidential, or proprietary information</li>
                <li>Protected Health Information (PHI) under HIPAA</li>
                <li>Personal data of children under 13</li>
                <li>Any information you don't want used for AI model training</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-gray-600">
                For full details, see OpenAI's{' '}
                <a 
                  href="https://openai.com/policies/business-terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Business Terms
                </a>{' '}
                and our{' '}
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={onAccept}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              I Understand & Accept
            </button>
            <button
              onClick={onDecline}
              className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Decline & Continue Without AI
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            You must accept to use AI-powered recipe generation features
          </p>
        </div>
      </div>
    </div>
  );
};

export default OpenAIConsent;