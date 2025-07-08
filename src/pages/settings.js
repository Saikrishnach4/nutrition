import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function Settings() {
  const { data: session, status } = useSession();
  const [name, setName] = useState(session?.user?.name || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  if (status === 'loading') return <div>Loading...</div>;
  if (!session?.user) return <div className="p-8 text-center">Please log in to view your settings.</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    // TODO: Implement backend update logic
    setMessage('Settings update not implemented yet.');
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block font-semibold mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Leave blank to keep current password"
          />
        </div>
        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded">Update Settings</button>
        {message && <div className="text-center text-sm text-gray-600 mt-2">{message}</div>}
      </form>
    </div>
  );
} 