import { redirect } from "next/navigation";
import { AdminDashboard } from "../../components/admin/admin-dashboard";
import { getCurrentAdmin } from "../../lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminDashboard admin={admin} />;
}
