import * as admin from 'firebase-admin';

// Firebase Admin初期化
admin.initializeApp();

// API関数のエクスポート
export { createRoom } from './createRoom';
export { exitRoom } from './exitRoom';
export { joinRoom } from './joinRoom';
export { checkRoom } from "./checkRoom";
