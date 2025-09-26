const admin = require('firebase-admin');

// Admin checking function for email service - matches frontend logic exactly
async function isUserAdmin(adminEmail, adminUid) {
  try {
    console.log(`[ADMIN_CHECK] Starting verification for: ${adminEmail} (${adminUid})`);

    if (!adminEmail || !adminUid) {
      console.log(`[ADMIN_CHECK] Missing email or UID - email: ${adminEmail}, uid: ${adminUid}`);
      return false;
    }

    // Check the admins collection - exactly like frontend
    const adminsRef = admin.firestore().collection('admins');
    console.log(`[ADMIN_CHECK] Querying admins collection with:`);
    console.log(`[ADMIN_CHECK] - email: ${adminEmail.toLowerCase()}`);
    console.log(`[ADMIN_CHECK] - uid: ${adminUid}`);
    console.log(`[ADMIN_CHECK] - isActive: true`);

    const query = adminsRef
      .where('email', '==', adminEmail.toLowerCase())
      .where('uid', '==', adminUid)
      .where('isActive', '==', true);

    const snapshot = await query.get();
    console.log(`[ADMIN_CHECK] Query returned ${snapshot.size} documents`);

    if (!snapshot.empty) {
      console.log(`[ADMIN_CHECK] ✅ Admin verified successfully: ${adminEmail}`);
      const doc = snapshot.docs[0];
      console.log(`[ADMIN_CHECK] Admin doc data:`, doc.data());
      return true;
    }

    // Let's also check what exists in the admins collection for debugging
    console.log(`[ADMIN_CHECK] ❌ No matching admin found. Checking all admins for debugging...`);
    const allAdminsSnapshot = await adminsRef.get();
    console.log(`[ADMIN_CHECK] Total admins in collection: ${allAdminsSnapshot.size}`);

    allAdminsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`[ADMIN_CHECK] Admin ${index + 1}:`, {
        id: doc.id,
        email: data.email,
        uid: data.uid,
        isActive: data.isActive,
        role: data.role
      });
    });

    console.log(`[ADMIN_CHECK] ❌ Admin verification failed for: ${adminEmail}`);
    return false;

  } catch (error) {
    console.error(`[ADMIN_CHECK] Error verifying admin ${adminEmail}:`, error);
    console.error(`[ADMIN_CHECK] Error stack:`, error.stack);
    return false;
  }
}

module.exports = {
  isUserAdmin
};