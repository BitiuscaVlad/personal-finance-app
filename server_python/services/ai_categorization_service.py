"""
AI Categorization Service using OpenAI
"""
import os
from openai import AsyncOpenAI
import json
import logfire

from database.db import execute_query

# Initialize OpenAI client (handle missing API key gracefully)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


async def suggest_category(description: str) -> dict:
    """
    Suggests a category for a transaction based on its description using OpenAI
    
    Args:
        description: The transaction description
        
    Returns:
        dict with categoryId, categoryName, confidence, and reasoning
    """
    logfire.info("AI category suggestion requested", description=description[:50])
    
    if not client:
        logfire.warn("OpenAI API key not configured")
        raise ValueError("OpenAI API key not configured. Set OPENAI_API_KEY in .env file")
    
    if not description or description.strip() == "":
        raise ValueError("Description is required for AI categorization")
    
    # Get all available expense categories from the database
    categories = execute_query(
        "SELECT id, name, type FROM categories WHERE type = ? ORDER BY name",
        ("expense",)
    )
    
    if not categories or len(categories) == 0:
        raise ValueError("No expense categories found in database")
    
    # Create a list of category names for the AI
    category_names = ", ".join([c["name"] for c in categories])
    
    prompt = f"""You are a financial assistant helping categorize expenses. 

Given the transaction description: "{description}"

Choose the most appropriate category from this list: {category_names}

Respond in JSON format with:
{{
  "category": "exact category name from the list",
  "confidence": "high/medium/low",
  "reasoning": "brief explanation (max 20 words)"
}}

Rules:
- Use ONLY categories from the provided list
- Match the exact category name
- Be concise in your reasoning"""
    
    try:
        with logfire.span("openai_categorization", description=description[:50]):
            completion = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful financial categorization assistant. Always respond with valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=150,
                response_format={"type": "json_object"}
            )
        
        response = completion.choices[0].message.content
        parsed = json.loads(response)
        
        # Find the matching category from our database
        matched_category = None
        for cat in categories:
            if cat["name"].lower() == parsed["category"].lower():
                matched_category = cat
                break
        
        if not matched_category:
            # Fallback to first category if no match found
            logfire.warn("No exact category match found, using fallback", 
                        suggested=parsed["category"], 
                        fallback=categories[0]["name"])
            return {
                "categoryId": categories[0]["id"],
                "categoryName": categories[0]["name"],
                "confidence": "low",
                "reasoning": "No exact match found, using default category"
            }
        
        logfire.info("AI category suggestion successful", 
                    category=matched_category["name"],
                    confidence=parsed.get("confidence", "medium"))
        return {
            "categoryId": matched_category["id"],
            "categoryName": matched_category["name"],
            "confidence": parsed.get("confidence", "medium"),
            "reasoning": parsed.get("reasoning", "AI suggested this category")
        }
        
    except Exception as error:
        logfire.error("OpenAI API error", error=str(error))
        raise Exception(f"AI categorization failed: {str(error)}")
