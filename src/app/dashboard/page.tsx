import { getAllCampaigns } from "@/app/actions";
import DashboardClient from "./DashboardClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
    const campaigns = await getAllCampaigns();
    // Pass plain objects to client
    return <DashboardClient campaigns={campaigns} />;
}
