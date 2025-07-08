import { useSession } from 'next-auth/react';

export default function Subscription() {
  const { data: session, status } = useSession();
  if (status === 'loading') return <div>Loading...</div>;
  if (!session?.user) return <div className="p-8 text-center">Please log in to view your subscription.</div>;
  const { subscription, subscriptionStatus, trialEndsAt } = session.user;
  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Subscription</h1>
      <div className="bg-white rounded-xl shadow p-6 space-y-2">
        <div><b>Plan:</b> {subscription || 'Free'}</div>
        <div><b>Status:</b> {subscriptionStatus || 'Inactive'}</div>
        <div><b>Trial Ends At:</b> {trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : 'N/A'}</div>
      </div>
      {/* Add upgrade/downgrade/cancel buttons here if needed */}
    </div>
  );
} 