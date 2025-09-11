import AdminDashboard from './AdminDashboard';

export const metadata = {
  title: 'Admin Panel | Mota Bhai Automobiles',
};

export default function AdminPage() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>
      <AdminDashboard />
    </div>
  );
}
