const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLastCampaign() {
    try {
        const lastCampaign = await prisma.campaign.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!lastCampaign) {
            console.log("❌ No se encontraron campañas.");
            return;
        }

        console.log("📊 ÚLTIMA CAMPAÑA CREADA:");
        console.log("--------------------------------");
        console.log(`Nombre: ${lastCampaign.productName}`);
        console.log(`Slug: ${lastCampaign.slug}`);
        console.log(`Creada: ${lastCampaign.createdAt}`);
        console.log(`Imagen Principal: ${lastCampaign.imageUrl ? '✅ SÍ' : '❌ NO'}`);
        console.log(`GalleryImages (Array):`, lastCampaign.galleryImages);
        console.log(`Longitud Galería: ${lastCampaign.galleryImages ? lastCampaign.galleryImages.length : 0}`);

        if (!lastCampaign.galleryImages || lastCampaign.galleryImages.length === 0) {
            console.log("\n⚠️ DIAGNÓSTICO: El campo galleryImages está VACÍO.");
            console.log("   Esto significa que la búsqueda falló al crear la campaña o no se guardó.");
        } else {
            console.log("\n✅ DIAGNÓSTICO: ¡Hay imágenes guardadas! Si no se ven, es fallo del frontend.");
        }

    } catch (error) {
        console.error("Error leyendo DB:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLastCampaign();
