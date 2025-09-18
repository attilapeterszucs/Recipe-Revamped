// Set the existing admin token in localStorage
// Run this in your browser console on the RecipeRevamped site

const adminToken = '8e7e3e11b811f523729427233f9e8da408c27008f2aa47ccd82856a074044eb7';

// Store it in localStorage
localStorage.setItem('admin_token', adminToken);

console.log('✅ Admin token set in localStorage!');
console.log('🔑 Token:', adminToken);
console.log('📝 Now update your blog service by running this command:');
console.log('gcloud run services update reciperevamped-blog-assets --region=us-central1 --set-env-vars="ADMIN_TOKEN=' + adminToken + '"');
console.log('🔄 Then refresh this page to use blog management!');

// Test the token by making a request
fetch('https://reciperevamped-blog-assets-428797186446.us-central1.run.app/api/blog/posts', {
  headers: {
    'Authorization': 'Bearer ' + adminToken
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ Token authentication test successful!');
  } else {
    console.log('⚠️ Authentication failed - update the blog service with the token first');
  }
})
.catch(error => {
  console.log('⚠️ Connection test failed:', error.message);
});