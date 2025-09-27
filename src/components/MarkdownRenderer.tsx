import React from 'react';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  const formatContent = (text: string): string => {
    if (!text) return '';

    let formatted = text.trim();
    
    // Preprocessing: If recipe starts directly with ingredients (badly formatted AI output)
    if (formatted.match(/^•\s*\d+/)) {
      // Add default structure for malformed recipes
      formatted = `**Recipe Name:** Recipe

## Ingredients:
${formatted}`;
    }
    
    // Step 1: Handle recipe name (multiple formats)
    // Format: **Recipe Name:** "Title" or **Recipe Name:** Title
    formatted = formatted.replace(/^\*\*Recipe Name:\*\*\s*[""]?([^"""\n*]+?)[""]?\*{0,2}\s*/i, '<h1 class="text-2xl font-bold text-green-600 mb-6 text-center border-b-2 border-green-200 pb-3">$1</h1>');
    
    // Format: **Recipe:** "Title" or **Recipe:** Title
    formatted = formatted.replace(/^\*\*Recipe:\*\*\s*[""]?([^"""\n*]+?)[""]?\*{0,2}\s*/i, '<h1 class="text-2xl font-bold text-green-600 mb-6 text-center border-b-2 border-green-200 pb-3">$1</h1>');
    
    // Format: Title surrounded by asterisks: **Title**
    formatted = formatted.replace(/^\*\*([^*\n]{3,50})\*\*\s*$/m, '<h1 class="text-2xl font-bold text-green-600 mb-6 text-center border-b-2 border-green-200 pb-3">$1</h1>');
    
    // Special handling for malformed recipes that start with ingredients
    if (!formatted.includes('<h1') && formatted.trim().startsWith('•')) {
      // Recipe starts with ingredients - add a default title
      formatted = '<h1 class="text-2xl font-bold text-green-600 mb-6 text-center border-b-2 border-green-200 pb-3">Recipe</h1>\n' + formatted;
    }
    
    // Format: Title at beginning of content (fallback) - handle first line as title
    if (!formatted.includes('<h1')) {
      const lines = formatted.split('\n');
      const firstLine = lines[0]?.trim();
      
      if (firstLine && 
          firstLine.length > 5 && 
          firstLine.length < 100 &&
          !firstLine.startsWith('##') &&
          !firstLine.startsWith('•') &&
          !firstLine.startsWith('-') &&
          !firstLine.match(/^\d+\./) &&
          !firstLine.includes('Save Recipe') &&
          !firstLine.includes('Ingredients')) {
        
        lines[0] = `<h1 class="text-2xl font-bold text-green-600 mb-6 text-center border-b-2 border-green-200 pb-3">${firstLine}</h1>`;
        formatted = lines.join('\n');
      } else {
        // Original fallback regex
        formatted = formatted.replace(/^([^*\n#•].{3,50}?)\n/m, '<h1 class="text-2xl font-bold text-green-600 mb-6 text-center border-b-2 border-green-200 pb-3">$1</h1>\n');
      }
    }
    
    // Step 2: Extract and format timing/serving info
    const timeFields: Array<{ label: string; value: string }> = [];
    formatted = formatted.replace(/\*\*(Prep Time|Cook Time|Total Time|Servings):\*\*\s*([^\n*]+)/gi, (_, label, value) => {
      timeFields.push({ label, value: value.trim() });
      return ''; // Remove from main text
    });
    
    // Step 3: Handle dietary requirements
    formatted = formatted.replace(/\*\*(Dietary Requirements?):\*\*\s*([^\n]+)/gi, (_, label, content) => {
      return `<div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-6"><div class="flex"><div class="ml-3"><p class="text-sm font-medium text-yellow-800">${label}</p><p class="mt-1 text-sm text-yellow-700">${content.trim()}</p></div></div></div>`;
    });
    
    // Step 4: Add timing card after title if we have timing info
    if (timeFields.length > 0) {
      const timeInfo = timeFields.map(field => 
        `<div class="text-center"><div class="text-sm font-medium text-gray-600">${field.label}</div><div class="text-lg font-bold text-blue-600">${field.value}</div></div>`
      ).join('');
      const timeCard = `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">${timeInfo}</div>`;
      formatted = formatted.replace(/(<h1[^>]*>.*?<\/h1>)/i, '$1' + timeCard);
    }
    
    // Step 5: Handle section headers and create containers
    let currentSection = '';
    const lines = formatted.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Check for section headers (both with ## and just bold text)
      const sectionMatch = line.match(/^##?\s*(Ingredients?)[\s:]*$/i) || 
                          line.match(/^\*\*(Ingredients?)[\s:]*\*\*$/i) ||
                          line.match(/^(Ingredients?)[\s:]*$/i);
      
      const instructionMatch = line.match(/^##?\s*(Instructions?)[\s:]*$/i) || 
                              line.match(/^\*\*(Instructions?)[\s:]*\*\*$/i) ||
                              line.match(/^(Instructions?)[\s:]*$/i);
      
      const tipsMatch = line.match(/^##?\s*(Assembly\/Cooking Tips?|Cooking Tips?|Tips?)[\s:]*$/i) || 
                       line.match(/^\*\*(Assembly\/Cooking Tips?|Cooking Tips?|Tips?)[\s:]*\*\*$/i) ||
                       line.match(/^(Assembly\/Cooking Tips?|Cooking Tips?|Tips?)[\s:]*$/i);

      const nutritionMatch = line.match(/^##?\s*(Nutrition Information)[\s:]*$/i) || 
                            line.match(/^\*\*(Nutrition Information)[\s:]*\*\*$/i) ||
                            line.match(/^(Nutrition Information)[\s:]*$/i);
      
      if (sectionMatch) {
        // Close previous section
        if (currentSection) processedLines.push('</div>');
        currentSection = 'ingredients';
        processedLines.push('<h2 class="text-xl font-bold text-green-700 mt-8 mb-4 flex items-center"><span class="w-3 h-6 bg-green-500 rounded mr-3"></span>Ingredients</h2><div class="bg-green-50 border border-green-200 p-4 rounded-lg">');
      } else if (instructionMatch) {
        // Close previous section
        if (currentSection) processedLines.push('</div>');
        currentSection = 'instructions';
        processedLines.push('<h2 class="text-xl font-bold text-blue-700 mt-8 mb-4 flex items-center"><span class="w-3 h-6 bg-blue-500 rounded mr-3"></span>Instructions</h2><div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">');
      } else if (nutritionMatch) {
        // Close previous section
        if (currentSection) processedLines.push('</div>');
        currentSection = 'nutrition';
        processedLines.push('<h2 class="text-xl font-bold text-orange-700 mt-8 mb-4 flex items-center"><span class="w-3 h-6 bg-orange-500 rounded mr-3"></span>Nutrition Information</h2><div class="bg-orange-50 border border-orange-200 p-4 rounded-lg">');
      } else if (tipsMatch) {
        // Close previous section
        if (currentSection) processedLines.push('</div>');
        currentSection = 'tips';
        processedLines.push('<h2 class="text-xl font-bold text-purple-700 mt-8 mb-4 flex items-center"><span class="w-3 h-6 bg-purple-500 rounded mr-3"></span>Tips</h2><div class="bg-purple-50 border border-purple-200 p-4 rounded-lg">');
      } else if (line.match(/^[-•*]\s+/) || line.match(/^•\s*/)) {
        // Handle different types of list items based on current section
        let content = line.replace(/^[-•*]\s+/, '').replace(/^•\s*/, '').trim();
        
        // Clean up malformed ingredient formatting like "400g [200g] shrimp" -> "400g shrimp"
        if (currentSection === 'ingredients') {
          content = content.replace(/\s*\[\d+g?\]\s*/g, ' ').replace(/\s+/g, ' ').trim();
        }
        
        if (currentSection === 'nutrition') {
          // Special formatting for nutrition items (e.g., "Calories: 250 kcal")
          processedLines.push(`<div class="flex justify-between items-center mb-2 py-1 border-b border-orange-200 last:border-b-0"><span class="font-medium text-orange-800">${content.split(':')[0]}:</span><span class="text-orange-700 font-semibold">${content.split(':')[1]?.trim() || ''}</span></div>`);
        } else {
          // Regular ingredient/tip items
          const color = currentSection === 'ingredients' ? 'green' : currentSection === 'tips' ? 'purple' : 'gray';
          processedLines.push(`<div class="flex items-start mb-2"><span class="text-${color}-600 mr-3 mt-1">•</span><span class="text-gray-700">${content}</span></div>`);
        }
      } else if (line.match(/^\d+\.\s*/)) {
        // Instruction item
        const content = line.replace(/^\d+\.\s*/, '').trim();
        const numberMatch = line.match(/^(\d+)\./);
        const number = numberMatch ? numberMatch[1] : '1';
        processedLines.push(`<div class="flex items-start mb-3"><span class="text-blue-600 font-bold mr-3 min-w-[2rem] text-right">${number}.</span><span class="text-gray-700">${content}</span></div>`);
      } else if (currentSection && line) {
        // Regular content within a section
        processedLines.push(`<p class="mb-2 text-gray-700">${line}</p>`);
      } else if (line && !line.match(/^</) && currentSection === '') {
        // Content outside sections (like dietary info already processed)
        if (!line.match(/^\*\*/) && !line.match(/^<div/)) {
          processedLines.push(`<p class="mb-3 text-gray-700 leading-relaxed">${line}</p>`);
        }
      }
    }
    
    // Close final section
    if (currentSection) processedLines.push('</div>');
    
    // Rebuild the formatted content
    formatted = processedLines.join('\n');
    
    // Step 6: Clean up any remaining bold text
    formatted = formatted.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>');
    
    return formatted;
  };

  const formattedContent = formatContent(content);

  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(formattedContent, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default MarkdownRenderer;