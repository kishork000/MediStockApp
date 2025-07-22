
import { db } from '@/lib/firebase-config';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';

export interface Patient {
    id: string;
    name: string;
    age: number;
    gender: "Female" | "Male" | "Other";
    mobile: string;
    lastVisit: string;
    bp?: string;
    sugar?: string;
    address?: string;
    medicineHistory?: { date: string; medicine: string; dosage: string }[];
    reports?: { date: string; name: string; url: string }[];
}

const patientCollectionRef = collection(db, 'patients');

export async function getPatients(): Promise<Patient[]> {
    const data = await getDocs(patientCollectionRef);
    return data.docs.map(doc => ({ ...doc.data(), id: doc.id } as Patient));
}

export async function addPatient(patient: Omit<Patient, 'id'>) {
    return await addDoc(patientCollectionRef, {
        ...patient,
        createdAt: serverTimestamp(),
    });
}

export async function updatePatient(id: string, updatedPatient: Omit<Patient, 'id'>) {
    const patientDoc = doc(db, 'patients', id);
    return await updateDoc(patientDoc, {
        ...updatedPatient,
        updatedAt: serverTimestamp(),
    });
}

export async function deletePatient(id: string) {
    const patientDoc = doc(db, 'patients', id);
    return await deleteDoc(patientDoc);
}

export async function findPatientByMobile(mobile: string): Promise<Patient | null> {
    const q = query(patientCollectionRef, where("mobile", "==", mobile));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { ...doc.data(), id: doc.id } as Patient;
}
    
