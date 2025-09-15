
import AdminDashboard from './AdminDashboard';

export const metadata = {
  title: 'Admin Panel | Mota Bhai Automobiles',
};

export default function AdminPage() {
  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <AdminDashboard />
    </div>
  );
}
