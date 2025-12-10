import { google } from 'googleapis';

/**
 * Notifies Google Indexing API about a new or updated URL.
 * Requires GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY env vars.
 */
export async function requestIndexing(url: string) {
    console.log(`📡 Sending Indexing Request for: ${url}`);

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Fix common env var newline issue

    if (!clientEmail || !privateKey) {
        console.warn("⚠️ Google Indexing skipped: Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY");
        return { error: "Missing Indexing Credentials" };
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        const authClient = await auth.getClient();

        // Use 'any' type cast to bypass TS errors if 'indexing' isn't explicitly typed in this version of googleapis yet,
        // although usually it is. Safe keeping.
        const indexing = google.indexing({ version: 'v3', auth: authClient as any });

        const result = await indexing.urlNotifications.publish({
            requestBody: {
                url: url,
                type: 'URL_UPDATED',
            },
        });

        console.log(`✅ Indexing Request Successful: ${result.status} - ${result.statusText}`);
        return { success: true, data: result.data };

    } catch (error: any) {
        console.error("❌ Indexing API Failed:", error.message);
        return { error: error.message };
    }
}
