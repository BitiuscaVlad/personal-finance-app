require('dotenv').config();
const { suggestCategory } = require('./services/aiCategorizationService');

async function test() {
  try {
    console.log('Testing AI categorization service...\n');
    
    const testDescriptions = [
      'Coffee at Starbucks',
      'Grocery shopping at Walmart',
      'Netflix subscription',
      'Electric bill payment',
      'Uber ride to work'
    ];

    for (const description of testDescriptions) {
      console.log(`\nDescription: "${description}"`);
      try {
        const result = await suggestCategory(description);
        console.log(`Suggested Category: ${result.categoryName} (ID: ${result.categoryId})`);
        console.log(`Confidence: ${result.confidence}`);
        console.log(`Reasoning: ${result.reasoning}`);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
  process.exit(0);
}

test();
