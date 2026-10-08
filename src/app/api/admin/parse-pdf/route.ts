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

    const arrayBuffer = await file.arrayBuffer();
    
    const prompt = `
      You are an expert educational content parser.
      Extract up to 25 multiple choice questions from this document. If the document has fewer than 25 questions, extract all of them.
      Return the output strictly as a valid JSON object.
      The JSON object MUST have a single key called "questions" which contains the array of objects.
      
      Format of each object inside the "questions" array must be:
      {
        "q": "The exact question text",
        "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
        "correct": "The exact text of the correct option. Try to infer the correct answer from the document. If an answer key is provided, use it. Otherwise, solve the question to provide the correct answer."
      }
    `;

    // 1. Extract text from PDF
    const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const pdfBuffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(pdfBuffer);
    const pdfText = data.text;
    
    // 2. Query Groq
    const groqPrompt = prompt + "\n\nHere is the document text:\n" + pdfText;
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: groqPrompt }],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      throw new Error("Groq API Error: " + errorText);
    }

    const groqData = await groqRes.json();
    const responseText = groqData.choices[0].message.content;
    
    // Sometimes it includes markdown blocks, we remove them
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsedJson = JSON.parse(cleaned);
    
    // Handle both cases: { questions: [...] } or just [...]
    const jsonResult = parsedJson.questions || parsedJson;

    return NextResponse.json({ questions: jsonResult });

  } catch (error: any) {
    console.error("PDF Parse Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to parse document' }, { status: 500 });
  }
}
