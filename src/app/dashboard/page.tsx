import { getAllCampaigns } from "@/app/actions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
    const campaigns = await getAllCampaigns();
    // Pass plain objects to client
    return <DashboardClient campaigns={campaigns} />;
}
