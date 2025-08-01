const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  const now = new Date();

  // accessLogs の削除（30日経過したもの）
  const accessLogs = await db.collection('accessLogs')
    .where('expiresAt', '<=', now)
    .get();

  const batch = db.batch();
  accessLogs.forEach(doc => batch.delete(doc.ref));

  // rateLimits の削除（3時間以上経過したもの）
  const rateLimits = await db.collection('rateLimits')
    .where('expiresAt', '<=', now)
    .get();

  rateLimits.forEach(doc => batch.delete(doc.ref));

  await batch.commit();

  console.log(`[Cleanup] Deleted ${accessLogs.size} accessLogs and ${rateLimits.size} rateLimits at ${now.toISOString()}`);
})();
