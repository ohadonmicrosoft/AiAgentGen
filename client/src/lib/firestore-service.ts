import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  addDoc,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

// Generic type for Firestore documents
export interface FirestoreDocument {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// User profile type
export interface UserProfile extends FirestoreDocument {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: "user" | "admin";
}

// Agent type
export interface Agent extends FirestoreDocument {
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools?: any[];
}

// Convert Firestore document to typed object
const convertDoc = <T extends FirestoreDocument>(
  doc: QueryDocumentSnapshot<DocumentData>,
): T => {
  return {
    id: doc.id,
    ...doc.data(),
  } as T;
};

// User profiles collection
export const userProfilesCollection = collection(db, "userProfiles");

// Create or update user profile
export const setUserProfile = async (profile: Partial<UserProfile>) => {
  const { uid } = profile;
  if (!uid) throw new Error("User ID is required");

  const userRef = doc(db, "userProfiles", uid);
  const now = Timestamp.now();

  try {
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      // Update existing profile
      await updateDoc(userRef, {
        ...profile,
        updatedAt: now,
      });
    } else {
      // Create new profile
      await setDoc(userRef, {
        ...profile,
        createdAt: now,
        updatedAt: now,
      });
    }

    return uid;
  } catch (error) {
    console.error("Error setting user profile:", error);
    throw error;
  }
};

// Get user profile by ID
export const getUserProfile = async (
  uid: string,
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "userProfiles", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as UserProfile;
    }

    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Agents collection
export const agentsCollection = collection(db, "agents");

// Create a new agent
export const createAgent = async (
  agent: Omit<Agent, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(agentsCollection, {
      ...agent,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error;
  }
};

// Get agent by ID
export const getAgent = async (id: string): Promise<Agent | null> => {
  try {
    const agentRef = doc(db, "agents", id);
    const docSnap = await getDoc(agentRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Agent;
    }

    return null;
  } catch (error) {
    console.error("Error getting agent:", error);
    throw error;
  }
};

// Update agent
export const updateAgent = async (
  id: string,
  data: Partial<Agent>,
): Promise<void> => {
  try {
    const agentRef = doc(db, "agents", id);
    await updateDoc(agentRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating agent:", error);
    throw error;
  }
};

// Delete agent
export const deleteAgent = async (id: string): Promise<void> => {
  try {
    const agentRef = doc(db, "agents", id);
    await deleteDoc(agentRef);
  } catch (error) {
    console.error("Error deleting agent:", error);
    throw error;
  }
};

// Get user's agents
export const getUserAgents = async (userId: string): Promise<Agent[]> => {
  try {
    const q = query(
      agentsCollection,
      where("ownerId", "==", userId),
      orderBy("updatedAt", "desc"),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => convertDoc<Agent>(doc));
  } catch (error) {
    console.error("Error getting user agents:", error);
    throw error;
  }
};

// Get public agents
export const getPublicAgents = async (limitCount = 10): Promise<Agent[]> => {
  try {
    const q = query(
      agentsCollection,
      where("isPublic", "==", true),
      orderBy("updatedAt", "desc"),
      limit(limitCount),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => convertDoc<Agent>(doc));
  } catch (error) {
    console.error("Error getting public agents:", error);
    throw error;
  }
};

// Create a document with a specific ID
export const createDocument = async <T extends FirestoreDocument>(
  collectionName: string,
  data: T,
  id?: string,
): Promise<string> => {
  try {
    const timestamp = Timestamp.now();
    const documentData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (id) {
      // Create with specific ID
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, documentData);
      return id;
    } else {
      // Create with auto-generated ID
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, documentData);
      return docRef.id;
    }
  } catch (error: any) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw new Error(
      error.message || `Failed to create document in ${collectionName}`,
    );
  }
};

// Get a document by ID
export const getDocument = async <T>(
  collectionName: string,
  id: string,
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw new Error(
      error.message || `Failed to get document from ${collectionName}`,
    );
  }
};

// Update a document
export const updateDocument = async <T extends FirestoreDocument>(
  collectionName: string,
  id: string,
  data: Partial<T>,
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(docRef, updateData as DocumentData);
  } catch (error: any) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw new Error(
      error.message || `Failed to update document in ${collectionName}`,
    );
  }
};

// Delete a document
export const deleteDocument = async (
  collectionName: string,
  id: string,
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw new Error(
      error.message || `Failed to delete document from ${collectionName}`,
    );
  }
};

// Query documents
export const queryDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> => {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      return { id: doc.id, ...doc.data() } as T;
    });
  } catch (error: any) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw new Error(
      error.message || `Failed to query documents from ${collectionName}`,
    );
  }
};

// Get all documents from a collection
export const getAllDocuments = async <T>(
  collectionName: string,
): Promise<T[]> => {
  return queryDocuments<T>(collectionName);
};

// Helper function to create query constraints
export { where, orderBy, limit };
