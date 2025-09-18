// Quick setup script for admin token
// Run this in your browser console on the RecipeRevamped site

// Generate a secure admin token
const adminToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

// Store it in localStorage
localStorage.setItem('admin_token', adminToken);

console.log('✅ Admin token generated and stored!');
console.log('🔑 Token:', adminToken);
console.log('📝 Next steps:');
console.log('1. Update your blog service deployment with this token');
console.log('2. Run this command in your terminal:');
console.log(`gcloud run services update reciperevamped-blog-assets --region=us-central1 --set-env-vars="ADMIN_TOKEN=${adminToken}"`);
console.log('3. Refresh this page and try the blog management again');

// Copy to clipboard if available
if (navigator.clipboard) {
  navigator.clipboard.writeText(adminToken).then(() => {
    console.log('💾 Token copied to clipboard!');
  });
}