# AI-Powered Expense Categorization Feature

## Overview
This feature uses OpenAI's GPT-3.5-turbo model to automatically suggest expense categories based on transaction descriptions. When adding a new transaction, the AI analyzes the description and recommends the most appropriate category from your existing expense categories.

## How It Works

### User Experience
1. **Add New Transaction**: Click "Add Transaction" button on the Transactions page
2. **Enter Description**: Type a description for your expense (e.g., "Coffee at Starbucks")
3. **AI Suggestion**: After 800ms of inactivity, the AI automatically analyzes the description
4. **Review Suggestion**: A purple suggestion box appears showing:
   - The suggested category name
   - Confidence level (high/medium/low)
   - Brief reasoning for the suggestion
5. **Accept or Ignore**: 
   - Click "Accept Suggestion" to use the AI's recommendation
   - Or manually select a different category from the dropdown

### Backend Implementation

#### AI Categorization Service (`server/services/aiCategorizationService.js`)
- Fetches all expense categories from the database
- Sends the transaction description and available categories to OpenAI
- Uses GPT-3.5-turbo with temperature 0.3 for consistent results
- Returns structured JSON with category, confidence, and reasoning

#### API Endpoint (`POST /api/transactions/suggest-category`)
- Route: `POST /api/transactions/suggest-category`
- Request body: `{ "description": "transaction description" }`
- Response:
  ```json
  {
    "categoryId": 98,
    "categoryName": "Dining Out",
    "confidence": "high",
    "reasoning": "Transaction indicates purchase of food or drink outside the home."
  }
  ```

### Frontend Implementation

#### Updated Components
1. **API Service** (`client/src/services/api.js`)
   - Added `suggestCategory(description)` function

2. **Transactions Page** (`client/src/pages/Transactions.js`)
   - Added debounced AI suggestion call (800ms delay)
   - Added suggestion state management
   - Added `acceptAiSuggestion()` function
   - Only triggers for new transactions (not edits)
   - Clears suggestion when category is manually selected

3. **UI Components**
   - Loading indicator while AI processes
   - Gradient purple suggestion card
   - Confidence badge with color coding
   - Accept button to apply suggestion

### Styling
- Modern gradient design (purple theme)
- Smooth slide-down animation
- Responsive layout
- Color-coded confidence levels:
  - 🟢 High: Green tint
  - 🟡 Medium: Yellow tint
  - 🔴 Low: Red tint

## Configuration

### Environment Variables
Required in `server/.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### Dependencies
- **Server**: `openai` npm package (v4.x)
- **OpenAI Model**: gpt-3.5-turbo (can be upgraded to gpt-4 for better accuracy)

## Testing

### Manual Testing
1. Start the server: `npm start` in `server/` directory
2. Start the client: `npm start` in `client/` directory
3. Navigate to Transactions page
4. Click "Add Transaction"
5. Type a description like "Coffee at Starbucks"
6. Wait for AI suggestion to appear
7. Click "Accept Suggestion" or choose manually

### Automated Test Script
Run: `node server/test-ai-suggestion.js`

Tests various descriptions:
- Coffee at Starbucks → Dining Out
- Grocery shopping at Walmart → Groceries
- Netflix subscription → Entertainment
- Electric bill payment → Utilities
- Uber ride to work → Transportation

## Performance Considerations

1. **Debouncing**: 800ms delay prevents excessive API calls while typing
2. **API Costs**: Each suggestion costs ~$0.0002 (GPT-3.5-turbo pricing)
3. **Response Time**: Typically 1-2 seconds for AI response
4. **Error Handling**: Gracefully handles API failures without blocking user

## Future Enhancements

1. **Learning from User Choices**: Track when users override suggestions to improve accuracy
2. **Multi-language Support**: Extend to support descriptions in other languages
3. **Batch Categorization**: Suggest categories for imported bank transactions
4. **Custom Prompts**: Allow users to customize the AI's categorization logic
5. **Offline Mode**: Cache common patterns for instant suggestions
6. **Category Creation**: Suggest new categories if existing ones don't fit well

## Limitations

1. Only works for expense categories (income categorization not implemented)
2. Requires internet connection for OpenAI API
3. Minimum description length: 3 characters
4. Only available when adding new transactions (not for editing)
5. Requires valid OpenAI API key with sufficient credits

## Cost Estimation

Using GPT-3.5-turbo:
- Input: ~100 tokens per request
- Output: ~50 tokens per response
- Cost: ~$0.0002 per suggestion
- 1000 suggestions ≈ $0.20

For high-volume usage, consider:
- Implementing caching for common descriptions
- Using a cheaper model for initial suggestions
- Batch processing for imported transactions
