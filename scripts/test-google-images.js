require('dotenv').config({ path: '.env' });
const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;

async function testSearch(query) {
    console.log("🔍 Probando búsqueda con:");
    console.log("   - API KEY:", GOOGLE_API_KEY ? "Configurada (OK)" : "FALTA");
    console.log("   - CX ID:", GOOGLE_CX ? GOOGLE_CX : "FALTA");
    console.log("   - Query:", query);

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
        console.error("❌ Error: Faltan claves en .env");
        return;
    }

    try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
            params: {
                key: GOOGLE_API_KEY,
                cx: GOOGLE_CX,
                q: query,
                searchType: 'image',
                num: 3,
                imgSize: 'large',
                safe: 'active'
            }
        });

        if (response.data.error) {
            console.error("❌ Error de API:", response.data.error);
        } else if (response.data.items) {
            console.log(`✅ ¡Éxito! Se encontraron ${response.data.items.length} imágenes:`);
            response.data.items.forEach((item, i) => console.log(`   ${i + 1}. ${item.link}`));
        } else {
            console.log("⚠️ La API respondió OK pero NO encontró imágenes (0 resultados).");
            console.log("   Consejo: Revisa la configuración 'Sitios en los que buscar' en el panel de Google.");
        }

    } catch (error) {
        if (error.response) {
            console.error("❌ Error HTTP:", error.response.status, error.response.statusText);
            console.error("   Detalle:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("❌ Error de red:", error.message);
        }
    }
}

// Ejecutar prueba
testSearch("Lotus Smartwatch Gold");
