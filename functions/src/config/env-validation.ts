// Environment variable validation for Firebase Functions
// Supports both Firebase Functions config() and .env for local development

import * as functions from "firebase-functions/v1";

interface RequiredEnvironmentVars {
  OPENAI_API_KEY: string;
  PEXELS_API_KEY: string;
}

// API key format validation patterns
const API_KEY_PATTERNS = {
  OPENAI_API_KEY: /^sk-proj-[A-Za-z0-9\-_]{40,}$/,
  PEXELS_API_KEY: /^[A-Za-z0-9]{40,}$/,
} as const;

// Placeholder values that indicate missing configuration
const PLACEHOLDER_VALUES = [
  'your_openai_api_key_here',
  'your_pexels_api_key_here',
  'your_new_secure_pexels_api_key_here',
  'sk-proj-your_secure_openai_key_here',
  'sk-proj-your_actual_openai_key_here',
  'your_actual_pexels_key_here',
  'your_secure_openai_key_here',
  'your_secure_pexels_key_here',
];

export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

export function validateEnvironment(): RequiredEnvironmentVars {
  const errors: string[] = [];
  
  // Check for missing environment variables
  const openaiKey = process.env.OPENAI_API_KEY;
  const pexelsKey = process.env.PEXELS_API_KEY;
  
  if (!openaiKey) {
    errors.push('OPENAI_API_KEY is required but not set');
  } else if (PLACEHOLDER_VALUES.includes(openaiKey)) {
    errors.push('OPENAI_API_KEY is set to placeholder value - please add your actual API key');
  } else if (!API_KEY_PATTERNS.OPENAI_API_KEY.test(openaiKey)) {
    errors.push('OPENAI_API_KEY format is invalid (should start with sk-proj-)');
  }
  
  if (!pexelsKey) {
    errors.push('PEXELS_API_KEY is required but not set');
  } else if (PLACEHOLDER_VALUES.includes(pexelsKey)) {
    errors.push('PEXELS_API_KEY is set to placeholder value - please add your actual API key');
  } else if (!API_KEY_PATTERNS.PEXELS_API_KEY.test(pexelsKey)) {
    errors.push('PEXELS_API_KEY format is invalid (should be alphanumeric string)');
  }
  
  // Check for exposed/compromised keys
  if (pexelsKey === 'T0EdcwC29YbGKgAFR5vzUFoBDq9FoET49hV0YGnBH7jMzMbLN0Q7rWyZ') {
    errors.push('CRITICAL: PEXELS_API_KEY is using the EXPOSED/COMPROMISED key - MUST be replaced immediately!');
  }
  
  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.map(err => `  - ${err}`).join('\n')}\n\nPlease check functions/SECURITY_SETUP.md for setup instructions.`;
    throw new EnvironmentValidationError(errorMessage);
  }
  
  return {
    OPENAI_API_KEY: openaiKey,
    PEXELS_API_KEY: pexelsKey,
  };
}

// Get API keys from Firebase Functions config or environment variables
function getApiKeys() {
  // Try Firebase Functions config first (production)
  const config = functions.config();
  let openaiKey = config?.openai?.api_key;
  let pexelsKey = config?.pexels?.api_key;
  
  // Fallback to environment variables (local development)
  if (!openaiKey) {
    openaiKey = process.env.OPENAI_API_KEY;
  }
  if (!pexelsKey) {
    pexelsKey = process.env.PEXELS_API_KEY;
  }
  
  return { openaiKey, pexelsKey };
}

// Safe environment validation that doesn't prevent deployment
export function safeValidateEnvironment(): { valid: boolean; errors: string[]; keys?: { openaiKey: string; pexelsKey: string } } {
  const errors: string[] = [];
  const { openaiKey, pexelsKey } = getApiKeys();
  
  if (!openaiKey) {
    errors.push('OPENAI_API_KEY is required but not set in Firebase config or environment');
  } else if (PLACEHOLDER_VALUES.includes(openaiKey)) {
    errors.push('OPENAI_API_KEY is set to placeholder value - please configure with actual API key');
  } else if (!API_KEY_PATTERNS.OPENAI_API_KEY.test(openaiKey)) {
    errors.push('OPENAI_API_KEY format is invalid (should start with sk-proj-)');
  }
  
  if (!pexelsKey) {
    errors.push('PEXELS_API_KEY is required but not set in Firebase config or environment');
  } else if (PLACEHOLDER_VALUES.includes(pexelsKey)) {
    errors.push('PEXELS_API_KEY is set to placeholder value - please configure with actual API key');
  } else if (!API_KEY_PATTERNS.PEXELS_API_KEY.test(pexelsKey)) {
    errors.push('PEXELS_API_KEY format is invalid (should be alphanumeric string)');
  }
  
  // Check for exposed/compromised keys
  if (pexelsKey === 'T0EdcwC29YbGKgAFR5vzUFoBDq9FoET49hV0YGnBH7jMzMbLN0Q7rWyZ') {
    errors.push('CRITICAL: PEXELS_API_KEY is using the EXPOSED/COMPROMISED key - MUST be replaced immediately!');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    keys: errors.length === 0 ? { openaiKey, pexelsKey } : undefined
  };
}