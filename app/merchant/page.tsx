import { redirect } from "next/navigation";
import { MerchantDashboard } from "../../components/merchant/merchant-dashboard";
import { getCurrentMerchant } from "../../lib/merchant";

export const dynamic = "force-dynamic";

export default async function MerchantPage() {
  const context = await getCurrentMerchant();
  if (!context) redirect("/");
  return <MerchantDashboard user={context.user} merchant={context.merchant} />;
}
