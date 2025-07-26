const admin = require('firebase-admin');

const key = JSON.parse(
  Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
);
admin.initializeApp({
  credential: admin.credential.cert(key)
});

const db = admin.firestore();

(async () => {
  const now = new Date();
  const threshold = new Date(now.getTime() - 10 * 60 * 1000); // 10分前の Date オブジェクト

  const expiredRooms = await db.collection('rooms')
    .where('expiresAt', '<=', threshold)
    .get();
  
  const batch = db.batch();
  for (const doc of expiredRooms.docs) {
    const roomRef = doc.ref;

    const members = await roomRef.collection('members').get();
    members.forEach(m => batch.delete(m.ref));

    const locations = await roomRef.collection('locations').get();
    locations.forEach(l => batch.delete(l.ref));

    batch.delete(roomRef);
  }

  await batch.commit();
  console.log(`[Cleanup] ${expiredRooms.size} rooms deleted at ${new Date().toISOString()}`);
})();
