'use client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { MasterDashboard } from '@/components/dashboards/MasterDashboard';
import { FranqueadoDashboard } from '@/components/dashboards/FranqueadoDashboard';
import { FloatingChat } from '@/components/FloatingChat';

export default function DashboardPage() {
    const { userType, isAuthenticated } = useAuth();

    if (!isAuthenticated || !userType) {
        return null; // or loading spinner, auth context handles redirect
    }

    return (
        <>
            {(userType === 'admin' || userType === 'superadmin') && <AdminDashboard />}
            {userType === 'master' && <MasterDashboard />}
            {userType === 'franqueado' && <FranqueadoDashboard />}

            {/* Floating Chat Global */}
            <FloatingChat userType={userType} userName={userType === 'master' ? 'Master' : 'Franqueado'} />
        </>
    );
}
