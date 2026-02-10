import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export function useFirestore(uid) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    // FETCH DATA
    const fetchData = useCallback(async () => {
        if (!uid) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setData(docSnap.data());
            } else {
                // Doc doesn't exist yet (first login?)
                setData(null);
            }
        } catch (err) {
            console.error("Error fetching firestore data:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [uid]);

    // SYNC DATA (Debouncing handled by consumer usually, but we can do direct sets here)
    const saveData = useCallback(async (newData) => {
        if (!uid) return;

        try {
            // We use merge: true to update fields without overwriting the whole doc
            // BUT for top-level keys like 'tasks', 'videos', we usually want to overwrite arrays.
            // setDoc with merge handles this well.
            const docRef = doc(db, "users", uid);
            await setDoc(docRef, newData, { merge: true });
        } catch (err) {
            console.error("Error saving firestore data:", err);
        }
    }, [uid]);

    // Initial Fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, saveData, refresh: fetchData };
}
