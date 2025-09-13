import { z } from 'zod';

// Get allowed filters from environment
const allowedFilters = (import.meta.env.VITE_ALLOWED_FILTERS as string).split(',') as [string, ...string[]];

// Recipe input validation schema
export const RecipeSchema = z.object({
  originalRecipe: z.string()
    .min(1, 'Please enter a recipe to convert')
    .max(20000, 'Recipe is too long. Please keep it under 20,000 characters'),
  dietaryFilters: z.array(z.enum(allowedFilters))
    .nonempty('Please select at least one dietary filter')
});

// Password validation schema
export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must include at least one special character');

// Sign up form validation
export const SignUpSchema = z.object({
  email: z.string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: PasswordSchema,
  confirmPassword: z.string()
    .min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match. Please check both password fields",
  path: ["confirmPassword"],
});

// Sign in form validation
export const SignInSchema = z.object({
  email: z.string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(1, 'Password is required')
});

// Recipe document schema for Firestore
export const SavedRecipeSchema = z.object({
  id: z.string(),
  originalRecipe: z.string(),
  convertedRecipe: z.string(),
  dietaryFilters: z.array(z.string()),
  healthConditions: z.array(z.string()).optional(),
  category: z.enum(['appetizer', 'main-dish', 'side-dish', 'dessert']).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  ownerUid: z.string(),
  title: z.string().optional(),
  imageUrl: z.string().optional()
});

export type RecipeInput = z.infer<typeof RecipeSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type SavedRecipe = z.infer<typeof SavedRecipeSchema>;
