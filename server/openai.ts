import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyzes an image of a Pokémon card using OpenAI's Vision API
 * @param base64Image - Base64 encoded image of the Pokémon card
 * @returns Information about the recognized card
 */
export async function recognizePokemonCard(base64Image: string): Promise<{
  cardName: string;
  setName?: string;
  cardNumber?: string;
  setSymbol?: string;
  rarity?: string;
}> {
  try {
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Pokémon TCG card recognition expert. Analyze the provided image of a Pokémon card with special attention to the bottom portion of the card where crucial identifying information is located.

          IMPORTANT: Most Pokémon cards have their set information and card number located at the bottom of the card. This is critical for proper identification!
          
          Extract the following information:
          1. The exact name of the Pokémon on the card (at the top of the card)
          2. The set name/symbol (usually at the bottom right or center)
          3. The card number (format like "123/456" at the bottom of the card)
          4. Any expansion icon or set symbol visible
          5. Rarity symbol (usually a circle, diamond, star, or other symbol at bottom)
          
          For modern cards: Look for the card number/set code at the bottom (e.g., "SV01" or "123/456")
          For vintage cards: Check bottom right for set symbol and card number
          
          Respond with JSON in this exact format: 
          {
            "cardName": "The full Pokémon name exactly as written on the card",
            "setName": "The set name or expansion if visible",
            "cardNumber": "The full card number format (e.g., 123/456)",
            "setSymbol": "Description of set symbol if visible (e.g., 'Scarlet & Violet', 'Base Set')",
            "rarity": "The rarity if visible (e.g., Common, Uncommon, Rare, Holo, etc.)"
          }
          
          If any field cannot be determined, omit it from the response.
          Be extremely accurate with card numbers and set information as they are crucial for identification.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please identify this Pokémon card and provide the information in the requested JSON format."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    // Parse the response
    const content = visionResponse.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    return {
      cardName: result.cardName || "Unknown card",
      setName: result.setName,
      cardNumber: result.cardNumber,
      setSymbol: result.setSymbol,
      rarity: result.rarity
    };
  } catch (error: any) {
    console.error("Error recognizing Pokémon card:", error);
    throw new Error(`Failed to analyze card image: ${error?.message || 'Unknown error'}`);
  }
}