
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob } from '@google/genai';
import { MENU_ITEMS } from './constants';

const MENU_DATA_STRING = JSON.stringify(MENU_ITEMS.map(i => ({ name: i.name, price: i.price, description: i.description })));

const addToCartFunctionDeclaration: FunctionDeclaration = {
  name: 'addToCart',
  parameters: {
    type: Type.OBJECT,
    description: 'Add or remove items from the shopping cart.',
    properties: {
      itemName: {
        type: Type.STRING,
        description: 'The exact name of the menu item.',
      },
      quantity: {
        type: Type.NUMBER,
        description: 'Number of items. Use negative numbers to remove.',
      },
    },
    required: ['itemName', 'quantity'],
  },
};

const checkoutFunctionDeclaration: FunctionDeclaration = {
  name: 'checkout',
  parameters: {
    type: Type.OBJECT,
    description: 'Initiate the checkout process once the user is done with their order.',
    properties: {
      orderType: {
        type: Type.STRING,
        enum: ['delivery', 'collection'],
        description: 'Preferred fulfillment method.',
      }
    }
  },
};

export const createGeminiSession = async (
  onAudio: (data: string) => void,
  onInterrupted: () => void,
  onAddToCart: (name: string, qty: number) => string,
  onCheckout: (type?: string) => string,
  onTranscription: (text: string, isUser: boolean) => void,
  onError: (err: any) => void,
  onClose: () => void
) => {
  const apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || "");

  if (!apiKey || apiKey === "undefined") {
    throw new Error("Missing Gemini API Key. Please set GEMINI_API_KEY in your Vercel/Environment settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.0-flash-exp',
    callbacks: {
      onopen: () => {
        console.log('Gemini Live session opened');
      },
      onmessage: async (message: LiveServerMessage) => {
        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioData) onAudio(audioData);

        if (message.serverContent?.interrupted) onInterrupted();

        if (message.toolCall) {
          const responses = [];
          for (const fc of message.toolCall.functionCalls) {
            if (fc.name === 'addToCart') {
              const { itemName, quantity } = fc.args as { itemName: string; quantity: number };
              const result = onAddToCart(itemName, quantity);
              responses.push({ id: fc.id, name: fc.name, response: { result } });
            } else if (fc.name === 'checkout') {
              const { orderType } = fc.args as { orderType?: string };
              const result = onCheckout(orderType);
              responses.push({ id: fc.id, name: fc.name, response: { result } });
            }
          }
          if (responses.length > 0) {
            sessionPromise.then(session => {
              session.sendToolResponse({ functionResponses: responses });
            });
          }
        }

        if (message.serverContent?.inputTranscription) {
          onTranscription(message.serverContent.inputTranscription.text, true);
        }
        if (message.serverContent?.outputTranscription) {
          onTranscription(message.serverContent.outputTranscription.text, false);
        }
      },
      onerror: (e) => {
        console.error('Gemini WebSocket error:', e);
        onError(e);
      },
      onclose: () => {
        console.log('Gemini session closed');
        onClose();
      },
    },
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: `You are a real-time voice ordering agent for 'Golden Dragon'.
      Available Menu Items: ${MENU_DATA_STRING}
      
      LANGUAGE & BEHAVIOR:
      1. YOU ARE FLUENT IN BOTH ARABIC AND ENGLISH.
      2. MATCH THE USER'S LANGUAGE EXACTLY. If they speak Arabic, you MUST respond in Arabic. If they speak English, respond in English.
      3. If the user starts the session, greet them in Arabic: "مرحباً بك في جولدن دراجون، كيف يمكنني مساعدتك اليوم؟"
      4. Stay in listening mode. Do not end conversation until checkout.
      5. When adding an item, use 'addToCart' and ALWAYS verbally confirm in the language being spoken.
      6. Answer menu questions concisely and instantly.
      7. If the user confirms their final order, use 'checkout'.
      
      TONE: Professional, fast, and helpful waiter. Respond with extreme speed.`,
      tools: [{ functionDeclarations: [addToCartFunctionDeclaration, checkoutFunctionDeclaration] }],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      }
    }
  });

  return sessionPromise;
};

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeUint8Array(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}
