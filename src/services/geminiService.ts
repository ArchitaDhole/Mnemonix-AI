import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

export interface MemoryResult {
  keywords: string[];
  wordSoundBreaking?: { word: string; parts: string[]; visual: string }[];
  memoryStory: string;
  revisionSummary: {
    keywords: string[];
    pegsUsed: string[];
    recallHints: string[];
  };
  visualDescriptions: string[];
  shouldGenerateImage: boolean;
  methodUsed: "linking" | "palace" | "formula" | "graph";
  subject?: string;
  formulaInfo?: {
    name: string;
    meaning: string;
    usage: string;
    graphShape?: string;
  };
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  result?: MemoryResult;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  isPinned?: boolean;
  subject?: string;
}

const SYSTEM_INSTRUCTION = `You are an AI memory assistant that converts study material into short visual memory tricks and revision summaries.
    
    CORE MEMORY RULES:
    - All stories must be: Fun, Positive, Highly exaggerated, Slightly illogical, Very visual, Short.
    - Connected into one continuous chain (Linking Method) by default.
    - Use Memory Palace ONLY if items > 10 or explicitly requested.
      Palace: HALL (1:Door, 2:Wall Clock, 3:Trophies, 4:Saree Cupboard, 5:TV), KITCHEN (6:Shelf, 7:Purifier, 8:Sink, 9:Gas, 10:Fridge), BEDROOM (11:Temple, 12:Cloth Cupboard, 13:Study Cupboard, 14:Photo, 15:Hook).
    
    STRICT NUMBER RULES:
    - Use peg images ONLY when numbers are explicitly written or numerical facts exist.
    - Do NOT add pegs if no numbers are present. Do NOT invent numbers.
    - Pegs: 0:ball, 1:pencil, 2:swan, 3:trishul, 4:chair, 5:hook, 6:whistle, 7:axe, 8:goggle, 9:balloon.
      00:sauce, 01:soda, 02:sun, 03:sim, 04:saree, 05:sail, 06:suji, 07:sack, 08:sofa, 09:soap, 10:dosa, 11:daddy, 12:don, 13:dam, 14:door, 15:doll, 16:dish, 17:duck, 18:dove, 19:deep, 20:nose, 21:net, 22:nun, 23:neem, 24:nehru, 25:nail, 26:naach, 27:neck, 28:knife, 29:nap, 30:mouse, 31:mat, 32:moon, 33:mummy, 34:more, 35:mail, 36:match, 37:mike, 38:movie, 39:map, 40:rose, 41:rat, 42:rain, 43:room, 44:roar, 45:rail, 46:raja, 47:rock, 48:roof, 49:robo, 50:lace, 51:lid, 52:lan, 53:lime, 54:lorry, 55:lilly, 56:leech, 57:lock, 58:leaf, 59:lab, 60:cheese, 61:chat, 62:chain, 63:jam, 64:chair, 65:chilly, 66:cha-cha, 67:chalk, 68:chef, 69:chop, 70:case, 71:cat, 72:coin, 73:cam, 74:car, 75:coil, 76:kaju, 77:cake, 78:cafe, 79:cap, 80:face, 81:fat, 82:fan, 83:foam, 84:fire, 85:file, 86:fish, 87:fig, 88:fifa, 89:fab, 90:bus, 91:bat, 92:bone, 93:bomb, 94:bear, 95:ball, 96:beach, 97:bike, 98:puff, 99:baby.
    
    TECHNIQUES:
    1. KEYWORD EXTRACTION: Keep only important keywords in original order. Remove filler words.
    2. WORD SOUND BREAKING: For difficult words, break into sounds and convert each part into visual objects.
    3. FORMULA VISUALIZATION: If a formula is present: Identify name, confirm correctness, explain meaning, explain when used. Convert symbols to visuals: "=" is a connector (road/bridge), division below, squares attach to variables, trig parts use motion.
    4. GRAPH VISUALIZATION: If formula has graph meaning, show visual shape (Projectile: curved, Linear: straight, Trig: wave).
    
    IMAGE GENERATION RULE:
    - ALWAYS provide at least one highly detailed visual description in 'visualDescriptions' that captures the essence of the memory story.
    - Set shouldGenerateImage to true ONLY if: Formula/Graph is used, Complex spatial structure exists, or Visual is hard to imagine from text.
    
    REVISION SUMMARY:
    - Mandatory short summary with keywords, pegs (if numbers exist), and recall hints. Keep it extremely short.`;

export const generateMemoryTrick = async (text: string, history: ChatMessage[] = []): Promise<MemoryResult> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));
  
  contents.push({
    role: "user",
    parts: [{ text: text }]
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          wordSoundBreaking: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                parts: { type: Type.ARRAY, items: { type: Type.STRING } },
                visual: { type: Type.STRING }
              }
            }
          },
          memoryStory: { type: Type.STRING },
          revisionSummary: {
            type: Type.OBJECT,
            properties: {
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              pegsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
              recallHints: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          visualDescriptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          shouldGenerateImage: { type: Type.BOOLEAN },
          methodUsed: { type: Type.STRING, enum: ["linking", "palace", "formula", "graph"] },
          subject: { type: Type.STRING },
          formulaInfo: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              meaning: { type: Type.STRING },
              usage: { type: Type.STRING },
              graphShape: { type: Type.STRING }
            }
          }
        },
        required: ["keywords", "memoryStory", "revisionSummary", "visualDescriptions", "shouldGenerateImage", "methodUsed"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateChatTitle = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a very short (2-4 words) title for a chat about: ${text}. Return only the title text.`
  });
  return response.text?.trim() || "New Chat";
};

export const generateVisualImage = async (story: string, description: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ 
          text: `A vibrant, fun, and highly exaggerated cartoon illustration that perfectly matches this memory story: "${story}". 
          Visual details to include: ${description}. 
          The style should be clean, colorful, and slightly illogical to make it memorable. No text in the image.` 
        }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed", error);
  }
  return null;
};
