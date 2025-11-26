const OpenAI = require('openai');
const db = require('../database/db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Suggests a category for a transaction based on its description using OpenAI
 * @param {string} description - The transaction description
 * @returns {Promise<{categoryId: number, categoryName: string, confidence: string, reasoning: string}>}
 */
async function suggestCategory(description) {
  if (!description || description.trim() === '') {
    throw new Error('Description is required for AI categorization');
  }

  // Get all available expense categories from the database
  const categories = await new Promise((resolve, reject) => {
    db.all(
      'SELECT id, name, type FROM categories WHERE type = ? ORDER BY name',
      ['expense'],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  if (!categories || categories.length === 0) {
    throw new Error('No expense categories found in database');
  }

  // Create a list of category names for the AI
  const categoryNames = categories.map(c => c.name).join(', ');

  const prompt = `You are a financial assistant helping categorize expenses. 

Given the transaction description: "${description}"

Choose the most appropriate category from this list: ${categoryNames}

Respond in JSON format with:
{
  "category": "exact category name from the list",
  "confidence": "high/medium/low",
  "reasoning": "brief explanation (max 20 words)"
}

Rules:
- Use ONLY categories from the provided list
- Match the exact category name
- Be concise in your reasoning`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful financial categorization assistant. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content;
    const parsed = JSON.parse(response);

    // Find the matching category from our database
    const matchedCategory = categories.find(
      c => c.name.toLowerCase() === parsed.category.toLowerCase()
    );

    if (!matchedCategory) {
      // Fallback to first category if no match found
      return {
        categoryId: categories[0].id,
        categoryName: categories[0].name,
        confidence: 'low',
        reasoning: 'No exact match found, using default category',
      };
    }

    return {
      categoryId: matchedCategory.id,
      categoryName: matchedCategory.name,
      confidence: parsed.confidence || 'medium',
      reasoning: parsed.reasoning || 'AI suggested this category',
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`AI categorization failed: ${error.message}`);
  }
}

module.exports = {
  suggestCategory,
};
