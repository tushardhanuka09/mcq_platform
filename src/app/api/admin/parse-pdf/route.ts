import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is missing in environment variables!' }, { status: 500 });
    }

    // Initialize Groq instead of Gemini

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
      // We will parse the PDF to text first, then send to Groq
      const pdfParseModule = await import('pdf-parse');
      const uint8Array = new Uint8Array(arrayBuffer);
      const doc = new pdfParseModule.PDFParse(uint8Array);
      await doc.load();
      const pdfText = await doc.getText();
      
      const groqPrompt = prompt + "\n\nHere is the document text:\n" + pdfText;

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: groqPrompt }],
          temperature: 0.2
        })
      });

      if (!groqRes.ok) {
        const errorText = await groqRes.text();
        throw new Error("Groq API Error: " + errorText);
      }

      const groqData = await groqRes.json();
      const responseText = groqData.choices[0].message.content;
      
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonResult = JSON.parse(cleaned);
    } catch (e: any) {
      console.error("Parse Error:", e);
      throw new Error("Failed to parse MCQs using Groq AI. Error: " + e.message);
    }
    return NextResponse.json({ questions: jsonResult });

  } catch (error: any) {
    console.error("PDF Parse Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to parse document' }, { status: 500 });
  }
}
