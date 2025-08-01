const admin = require('firebase-admin');

// 環境変数からサービスアカウント情報を取得して初期化
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 削除対象の定義
const accessLogThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30日前
const rateLimitThreshold = new Date(Date.now() - 3 * 60 * 60 * 1000);       // 3時間前

async function deleteOldDocuments(collectionName, threshold) {
  const snapshot = await db.collection(collectionName)
    .where('expiresAt', '<=', threshold)
    .get();

  console.log(`${collectionName}: Found ${snapshot.size} documents to delete.`);

  const batchSize = 500;
  let deleted = 0;

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = db.batch();
    const chunk = snapshot.docs.slice(i, i + batchSize);
    chunk.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += chunk.length;
    console.log(`Deleted ${chunk.length} from ${collectionName} (total ${deleted})`);
  }
}

(async () => {
  try {
    await deleteOldDocuments('accessLogs', accessLogThreshold);
    await deleteOldDocuments('rateLimits', rateLimitThreshold);
    console.log('Cleanup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
})();
