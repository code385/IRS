import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../config/firebase';
import { UserRole } from '../store/userStore';

const functions = getFunctions(app);

export interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface CreateUserResult {
  success: boolean;
  uid: string;
  message: string;
}

/**
 * Calls Cloud Function createUserAndSendCredentials.
 * Admin must be logged in. Function creates Auth user, Firestore user, and queues email.
 */
export async function createUserAndSendCredentials(
  payload: CreateUserPayload
): Promise<CreateUserResult> {
  const fn = httpsCallable<
    CreateUserPayload,
    { data: CreateUserResult }
  >(functions, 'createUserAndSendCredentials');
  const res = await fn(payload);
  return res.data;
}
