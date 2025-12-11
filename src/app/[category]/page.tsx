
import { getCampaignsByCategory } from "@/app/actions";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton"; // Assuming it exists or I can make a simple back link

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata({ params }: { params: any }) {
    const { category } = await params;
    const capitalized = category.charAt(0).toUpperCase() + category.slice(1);

    return {
        title: `Best ${capitalized} Products & Reviews - Top Picks`,
        description: `Explore our expert reviews and analysis for the best ${category} products. Unbiased comparisons and buying guides.`,
        alternates: {
            canonical: `https://gestor-afiliados-web.vercel.app/${category}`
        }
    };
}

export default async function CategoryPage({ params }: { params: any }) {
    const { category } = await params;
    const products = await getCampaignsByCategory(category, 50); // Get up to 50 products

    if (!products || products.length === 0) {
        return (
            <div className="min-h-screen p-8 text-center flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
                <p className="text-gray-400 mb-6">We couldn't find any products in "{category}".</p>
                <Link href="/" className="bg-[#2a2a2a] px-6 py-2 rounded-lg hover:bg-[#3a3a3a] transition-colors">
                    Return Home
                </Link>
            </div>
        );
    }

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    return (
        <div className="min-h-screen bg-[#111] text-gray-100 font-sans">
            {/* HEADER */}
            <header className="border-b border-gray-800 bg-[#161616]">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 mb-4 inline-block">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                        {categoryName} <span className="text-blue-500">Reviews</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl">
                        Deep dives, honest comparisons, and expert verdicts on the latest {categoryName} gear.
                    </p>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <Link
                            key={product.slug}
                            href={`/${category}/${product.slug}`}
                            className="group bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300"
                        >
                            {/* IMAGE CONTAINER */}
                            <div className="relative h-56 w-full bg-[#222] overflow-hidden">
                                {product.imageUrl ? (
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.productName}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                        No Image
                                    </div>
                                )}
                                {product.type === 'blog' ? (
                                    (product.content?.length || 0) > 4000 ? (
                                        <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg shadow-purple-900/40 flex items-center gap-1">
                                            ⚡ DEEP DIVE
                                        </div>
                                    ) : (
                                        <div className="absolute top-3 right-3 bg-blue-600/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10 flex items-center gap-1">
                                            📝 REVIEW
                                        </div>
                                    )
                                ) : (
                                    <div className="absolute top-3 right-3 bg-gray-600/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                                        🛒 PRODUCT
                                    </div>
                                )}
                            </div>

                            {/* TEXT CONTENT */}
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {product.title || product.productName}
                                </h2>
                                <p className="text-gray-400 text-sm line-clamp-3 mb-6 leading-relaxed">
                                    {product.description || "Check out our full analysis of this product..."}
                                </p>

                                <span className="inline-block w-full text-center bg-[#252525] hover:bg-blue-600 text-gray-300 hover:text-white py-3 rounded-lg font-medium transition-colors">
                                    Read Full Review
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
