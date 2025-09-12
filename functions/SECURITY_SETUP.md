# 🔒 CRITICAL SECURITY SETUP REQUIRED

## ⚠️ EXPOSED API KEY INCIDENT

**Compromised Key**: `T0EdcwC29YbGKgAFR5vzUFoBDq9FoET49hV0YGnBH7jMzMbLN0Q7rWyZ`

This Pexels API key was **EXPOSED IN SOURCE CODE** and is publicly visible. It must be replaced immediately.

## 🚨 IMMEDIATE ACTIONS REQUIRED

### Step 1: Secure Pexels API Key

1. **Create New Pexels Account**:
   - Go to https://www.pexels.com/
   - Sign up with a **different email address** than the compromised account
   - Verify the new account

2. **Generate New API Key**:
   - Visit https://www.pexels.com/api/new/
   - Fill in project details:
     - Project Name: "Recipe Revamp v2"
     - Category: "Web Application"
     - Description: "Recipe conversion app with image search"
     - Website: Your production URL
   - Accept terms and generate API key

3. **Update Environment File**:
   ```bash
   # Edit functions/.env
   PEXELS_API_KEY=your_new_secure_key_here
   ```

4. **Delete Old Account** (if possible):
   - Log into the compromised Pexels account
   - Delete or deactivate the account to prevent further misuse

### Step 2: Secure OpenAI API Key

1. **Get OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key for this project
   - Set usage limits and billing alerts

2. **Update Environment File**:
   ```bash
   # Edit functions/.env  
   OPENAI_API_KEY=sk-proj-your_secure_openai_key_here
   ```

## 🔐 ENVIRONMENT VARIABLES SETUP

Edit `functions/.env` with your secure API keys:

```bash
# PRODUCTION API KEYS - NEVER COMMIT TO VERSION CONTROL
OPENAI_API_KEY=sk-proj-your_actual_openai_key_here
PEXELS_API_KEY=your_actual_pexels_key_here
```

## ✅ VERIFICATION STEPS

After updating the API keys:

1. **Test Local Development**:
   ```bash
   cd functions
   npm run build
   firebase emulators:start --only functions
   ```

2. **Deploy to Production**:
   ```bash
   firebase deploy --only functions
   ```

3. **Verify Function Endpoints**:
   - Test recipe generation: `generateRecipe`
   - Test image search: `searchImages`
   - Test exchange rates: `getExchangeRates`

## 🛡️ SECURITY BEST PRACTICES

- ✅ Never commit `.env` files to version control
- ✅ Use different API keys for development/production
- ✅ Set up billing alerts for API usage
- ✅ Monitor API key usage regularly
- ✅ Rotate API keys periodically (every 90 days)

## 📊 MONITORING SETUP

### OpenAI Usage Monitoring:
- Set billing limits: $50/month maximum
- Enable usage alerts at 80% of limit
- Monitor token usage in OpenAI dashboard

### Pexels Usage Monitoring:
- Free tier: 200 requests/hour, 20,000/month
- Monitor usage to avoid rate limits
- Consider paid tier if needed

## 🚨 INCIDENT RESPONSE

If API keys are ever exposed again:

1. **Immediately rotate the keys**
2. **Check billing for unauthorized usage**
3. **Review access logs**
4. **Update all environments**
5. **Document the incident**

---

**Status**: ⚠️ **SETUP REQUIRED** - API keys need to be added before deployment
**Priority**: 🔴 **CRITICAL** - Must be completed before production deployment