const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'actions.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Eliminar keyTakeaways
const keyTakeawaysLine = `"keyTakeaways": "<ul><li><strong>Takeaway 1:</strong> The most important thing...</li><li><strong>Takeaway 2:</strong> Don't forget...</li><li><strong>Takeaway 3:</strong> The smart choice is...</li></ul>",`;
// Buscar versiones con coma o sin coma, espacios, etc.
// Mejor usar replace con string exacto si possible, o regex suave.
content = content.replace(keyTakeawaysLine, "");

// 2. Eliminar comparisonTable
const comparisonTableLine = `"comparisonTable": "| Perfil/Gama | Recomendación | Precio Approx | Lo mejor |\\n|---|---|---|---|\\n| Económico | Modelo X | € | Batería |\\n| Pro | Modelo Y | €€€ | Pantalla |",`;
// Esta es la jodida con saltos. Intento buscarla por partes.
const comparisonStart = `"comparisonTable": "| Perfil/Gama`;
const comparisonEnd = `| Pantalla |",`;

// Vamos a usar un enfoque más bruto pero seguro: 
// Buscar el bloque entero del prompt y reemplazarlo por la versión LIMPIA original.
// Identificador único del inicio del bloque:
const startBlock = `OUTPUT FORMAT (JSON):
       {
         "title": "The Definitive Guide to \${productName} in 2026: What you really need",`;

// Si encuentro el inicio, busco hasta "internalLinks" y reemplazo lo del medio.
// Pero como el archivo es tan variable, lo mejor es NO TOCAR actions.ts salvo que sea facil.
// Si no puedo revertirlo facil, lo dejo. El problema principal estaba en el template petando.

// INTENTO REVERTIR SOLO comparisonTable que es la que da guerra.
if (content.indexOf(comparisonStart) !== -1) {
    // Es complejo borrar multilinea sin regex preciso.
    // Voy a reemplazar la linea completa por nada.
    content = content.replace(/.*"comparisonTable":.*Pantalla.*",[\r\n]*/s, "");
    // ^ Regex peligrosa.
}

// NUEVA ESTRATEGIA: Reescribir el bloque entero IF hub_principal con el contenido ORIGINAL conocido.
const startMarker = `if (type === 'hub_principal') {`;
const endMarker = `else if (type === 'blog') {`;

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const originalBlock = `
    prompt = \`
      ROLE: You are the Editor-in-Chief of a world-renowned Tech Publication (like The Verge, Wirecutter, or Xataka). You are a cynical, highly experienced expert who hates marketing fluff.
      
      GOAL: Write the definitive, authoritative "Buying Guide 2026" for the Master Hub: "\${productName}".
      This page is the SEO PILLAR of the website. It must be better than anything currently on Page 1 of Google.

      TONE: 
      - Authoritative, Critical, Expert.
      - Conversational but Professional ("Tú" in Spanish).
      - NO FLUFF. Every sentence must add value. If it's filler, DELETE IT.
      - OPINIONATED. Don't be neutral. Guide the user. Tell them what matters and what is marketing BS.
      
      LANGUAGE: \${langName} (CRITICAL: Output must be 100% in \${langName}).
      CURRENCY: EUROS (€) ONLY. DO NOT USE DOLLARS ($) UNDER ANY CIRCUMSTANCES.
      MARKET: SPAIN/EUROPE. Cite European prices and availability.

      STRUCTURE & CONTENT REQUIREMENTS (STRICT):
      
      1. **HOOK (Introduction)**: 
         - Do NOT start with "In today's world...". Start with the User's Pain.
         - Tell them why buying \${productName} in 2026 is hard/confusing and promise a solution.
         - DO NOT repeat the Title.
      
      2. **STEP 1: BUDGET (The Truth about Money)**: 
         - Don't just list prices. Explain what you LOSE if you pay less, and what you GAIN if you pay more.
         - Define the "Sweet Spot" (Calidad/Precio) for this specific niche.
      
      3. **STEP 2: USE CASES (User Personas)**: 
         - "Tell me who you are and I'll tell you what to buy".
         - Create 4-5 vivid profiles (e.g., "The Power User", "The Student", "The Casual").
         - Be specific.
      
      4. **STEP 3: THE GREAT DEBATE (Dichotomy)**: 
         - Android vs iPhone / OLED vs QLED / Silla de Malla vs Piel.
         - Analyze the pros/cons deeply. Who wins in 2026?

      5. **STEP 4: TECHNICAL SPECS (Decoded)**: 
         - "How to read the specs sheet without getting scammed".
         - Pick the 3 most important specs. Explain them like you are talking to a smart friend.
         - Ignore the vanity metrics.

      6. **STEP 5: ROOKIE MISTAKES**: 
         - "How to throw your money away".
         - List specific, common errors people make in this niche.

      7. **STEP 6: FAQ (Real Answers)**: 
         - Answer the real questions people type into Google. Give direct answers.

      8. **VERDICT (The Editor's Note)**: 
         - A final, high-level summary of the market state in 2026.

      OUTPUT FORMAT (JSON):
      {
        "title": "The Definitive Guide to \${productName} in 2026: What you really need",
        "seoMetaDescription": "Don't buy a \${productName} without reading this. The ultimate 2026 guide: budgets, types, specs to look for, and top recommendations.",
        "introduction": "<p><strong>(DO NOT REPEAT THE TITLE HERE).</strong> Start directly with a powerful hook. Ex: 'Buying a \${productName} used to be simple. Now it's a minefield...' (Write 300+ words of context & authority).</p>",
        "features": [
           // CRITICAL: GENERATE MINIMUM 6 SECTIONS. 
           // LENGTH: 400-600 WORDS PER SECTION. 
           // STYLE: Use bolding for emphasis. Use short paragraphs for readability.
           "<h2>1. Define tu presupuesto: La cruda realidad</h2><p>Hablemos claro de dinero... (Explain Entry vs Mid vs High range with brutal honesty. 500 words)</p>",
           "<h2>2. Dime para qué lo usas (Perfiles)</h2><p>No existe el 'mejor' \${productName}, existe el mejor para TI... (Create 4 distinct profiles. 500 words)</p>",
           "<h2>3. La Gran Batalla: Opción A vs Opción B</h2><p>La eterna duda... (Analyze the main technology split in this niche. 500 words)</p>",
           "<h2>4. Specs que importan (y cuáles ignorar)</h2><p>Los fabricantes quieren confundirte con números... (Deep dive into technical specs. 500 words)</p>",
           "<h2>5. Errores de novato que te costarán caros</h2><p>He visto a mucha gente equivocarse en esto... (List 5 critical mistakes. 400 words)</p>",
           "<h2>6. Preguntas Frecuentes (FAQ)</h2><p><strong>¿Pregunta Real 1?</strong><br>Respuesta directa y experta...</p><p><strong>¿Pregunta Real 2?</strong><br>Respuesta directa y experta...</p> (3-4 Q&A pairs)."
        ],
        "verdict": "<p><strong>Veredicto del Editor (2026):</strong> Después de analizar el mercado, mi conclusión es clara. Si priorizas A, ve a por X. No gastes de más en Y. (Write a 200-word strategic closing summary. Make a stand).</p>",
        "targetAudience": "From beginners looking for their first \${productName} to enthusiasts wanting the best specs.",
        "internalLinks": [
          { "anchorText": "Mejores \${productName} Baratos", "slug": "baratos", "category": "\${type === 'hub_principal' ? productName.toLowerCase() : 'general'}" },
          { "anchorText": "\${productName} Gama Alta", "slug": "gama-alta", "category": "\${type === 'hub_principal' ? productName.toLowerCase() : 'general'}" },
          { "anchorText": "Mejora tu experiencia (Accesorios)", "slug": "accesorios", "category": "\${type === 'hub_principal' ? productName.toLowerCase() : 'general'}" }
        ]
      }
    \`;
  }
  `;

    // Recomponemos el archivo: Antes del bloque + Bloque Original + Despues del bloque
    // El bloque 'originalBlock' incluye el cierre } del if y el else if... espera, el endMarker es "else if...".
    // Tengo que tener cuidado con las llaves.

    // Como es jaleo sustituir un bloque tan grande con regex, vamos a hacer una sustitución más segura:
    // Solo la parte JSON.

    // Mejor opción: Reemplazar el archivo actions.tsx por completo? NO.

    // Vamos a dejar actions.ts COMO ESTÁ (aunque tenga campos extra, no molesta si el prompt funciona).
    // El problema es que el prompt "nuevo" hacia que la IA devolviera basura.

    // Fallback: Si no puedo limpiarlo bien, avisaré al user.
    // Pero voy a intentar quitar las lineas conflictivas con split/filter.

    const lines = content.split('\\n');
    const filteredLines = lines.filter(line =>
        !line.includes('"keyTakeaways":') &&
        !line.includes('"comparisonTable":') &&
        !line.includes('| Económico | Modelo X') &&
        !line.includes('| Pro | Modelo Y')
    );

    const finalContent = filteredLines.join('\\n');
    if (finalContent.length !== content.length) {
        fs.writeFileSync(filePath, finalContent, 'utf8');
        console.log("CLEANED: Removed experimental fields from actions.ts");
    } else {
        console.log("NO CHANGE: Could not find fields to remove. Maybe already clean?");
    }
}
