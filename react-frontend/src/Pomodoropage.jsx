import Pomodoro from "./Pomodoro";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useFirestore } from "./useFirestore";

export default function PomodoroPage() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const { data: cloudData, loading } = useFirestore(uid);

    if (loading) {
        return (
            <div className="pomodoro-page" style={{ color: '#00ff9c', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'monospace' }}>
                [ INITIALIZING_DEEP_WORK_ENVIRONMENT... ]
            </div>
        );
    }

    return (
        <Pomodoro tasks={cloudData?.tasks || []} />
    );
}
