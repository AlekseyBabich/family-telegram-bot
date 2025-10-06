import { createShoppingService } from '../pages/shopping/firestore';
import { db } from './firebase';

let seeded = false;

export const ensureDevShoppingData = async () => {
  if (!import.meta.env.DEV || seeded) {
    return;
  }

  seeded = true;

  try {
    const service = createShoppingService(db);
    await service.ensureDevData();
  } catch (error) {
    console.error('[shopping] Failed to seed development data', error);
  }
};
