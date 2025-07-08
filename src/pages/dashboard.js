import { useSession } from 'next-auth/react';
import UserDashboard from './UserDashboard';

export default function Dashboard() {
  const { data: session, status } = useSession();
  if (status === 'loading') return <div>Loading...</div>;
  if (!session?.user) return <div className="p-8 text-center">Please log in to view your dashboard.</div>;
  return <UserDashboard user={session.user} />;
} 