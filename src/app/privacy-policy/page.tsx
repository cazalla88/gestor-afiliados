import Link from "next/link";

export const metadata = {
    title: 'Política de Privacidad - AffiliateNexus',
    description: 'Política de privacidad y términos de uso de AffiliateNexus.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans">
            <div className="container mx-auto max-w-4xl px-6 py-12">

                {/* Header */}
                <header className="mb-12 border-b pb-8">
                    <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Volver al Inicio</Link>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
                    <p className="text-gray-500">Última actualización: {new Date().toLocaleDateString()}</p>
                </header>

                {/* Content */}
                <article className="prose prose-lg max-w-none text-gray-600 space-y-8">

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introducción</h2>
                        <p>
                            En <strong>AffiliateNexus</strong> (en adelante, "el Sitio"), respetamos su privacidad y estamos comprometidos con la protección de sus datos personales.
                            Esta política explica cómo recopilamos, usamos y protegemos la información cuando usted visita nuestro sitio web.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Divulgación de Afiliados de Amazon (Amazon Associates Disclosure)</h2>
                        <p className="bg-yellow-50 p-4 border-l-4 border-yellow-400 text-yellow-800">
                            <strong>Importante:</strong> AffiliateNexus participa en el Programa de Afiliados de Amazon Services LLC, un programa de publicidad para afiliados diseñado para ofrecer a sitios web un modo de obtener comisiones por publicidad, publicitando e incluyendo enlaces a Amazon.com y sitios afiliados.
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>Como Afiliado de Amazon, obtenemos ingresos por las compras adscritas que cumplen los requisitos aplicables.</li>
                            <li>Amazon y el logotipo de Amazon son marcas comerciales de Amazon.com, Inc. o de sus sociedades de grupo.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Recopilación de Datos y Cookies</h2>
                        <p>
                            Al igual que muchos otros sitios web, utilizamos "cookies" para mejorar su experiencia. Una cookie es un pequeño archivo de texto que se almacena en su ordenador o dispositivo móvil.
                        </p>
                        <h3 className="text-xl font-bold mt-4 mb-2">Cookies de Terceros y Amazon</h3>
                        <p>
                            Terceros, incluyendo Amazon y otros anunciantes, pueden servir contenido y anuncios, recopilar información directamente de los visitantes y colocar o reconocer cookies en sus navegadores. Estas cookies permiten a Amazon rastrear las referencias desde nuestro sitio para asignar las comisiones correspondientes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Archivos de Registro (Log Files)</h2>
                        <p>
                            AffiliateNexus sigue un procedimiento estándar de uso de archivos de registro. Estos archivos registran a los visitantes cuando visitan sitios web. La información recopilada incluye direcciones de protocolo de internet (IP), tipo de navegador, proveedor de servicios de internet (ISP), fecha y hora, páginas de referencia/salida y posiblemente el número de clics. Estos datos no están vinculados a ninguna información que sea personalmente identificable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Enlaces a Terceros</h2>
                        <p>
                            Nuestro sitio contiene enlaces a otros sitios web (principalmente Amazon). No somos responsables de las prácticas de privacidad de dichos sitios. Le recomendamos que lea las declaraciones de privacidad de cada sitio web que visite.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Derechos GDPR</h2>
                        <p>
                            Si usted reside en el Espacio Económico Europeo (EEE), tiene ciertos derechos de protección de datos. Si desea ser informado sobre qué datos personales tenemos sobre usted (si los hubiera) y si desea que sean eliminados de nuestros sistemas, por favor contáctenos.
                        </p>
                    </section>

                    <section className="border-t pt-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Contacto</h2>
                        <p>
                            Si tiene preguntas sobre esta Política de Privacidad, puede contactarnos en: <br />
                            <span className="font-medium">privacy@affiliatenexus.com</span> (Correo de ejemplo)
                        </p>
                    </section>

                </article>
            </div>
        </div>
    );
}
