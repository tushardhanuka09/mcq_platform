import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in .env.local file!' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    const mimeType = file.type || 'application/pdf'; 

    const prompt = `
      You are an expert educational content parser.
      Extract up to 25 multiple choice questions from this document. If the document has fewer than 25 questions, extract all of them.
      Return the output strictly as a valid JSON array of objects.
      Do NOT include any markdown formatting like \`\`\`json. Just output the raw JSON array.
      
      Format of each object must be:
      {
        "q": "The exact question text",
        "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
        "correct": "The exact text of the correct option. Try to infer the correct answer from the document. If an answer key is provided, use it. Otherwise, solve the question to provide the correct answer."
      }
    `;

    let jsonResult;
    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]);

      const responseText = result.response.text();
      // Clean up any markdown the LLM might have included
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonResult = JSON.parse(cleaned);
    } catch (e: any) {
      console.warn("Gemini Vision API Error, falling back to Gemini Text API:", e);
      try {
        const pdfParseModule = await import('pdf-parse');
        const uint8Array = new Uint8Array(arrayBuffer);
        const doc = new pdfParseModule.PDFParse(uint8Array);
        await doc.load();
        const pdfText = await doc.getText();

        // Fallback to Gemini Text-Only API (avoids 503 Vision API outages)
        const fallbackPrompt = prompt + "\n\nHere is the document text:\n" + pdfText;
        const fallbackResult = await model.generateContent(fallbackPrompt);
        const responseTextFallback = fallbackResult.response.text();
        const cleaned = responseTextFallback.replace(/```json/g, '').replace(/```/g, '').trim();
        jsonResult = JSON.parse(cleaned);
      } catch (fallbackErr: any) {
        console.error("Gemini Text Fallback Error:", fallbackErr);
        throw new Error("Both Gemini Vision and Gemini Text fallback failed. Original Error: " + e.message);
      }
    }

    return NextResponse.json({ questions: jsonResult });


  } catch (error: any) {
    console.error("PDF Parse Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to parse document' }, { status: 500 });
  }
}
