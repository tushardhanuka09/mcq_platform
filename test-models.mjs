import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
  const genAI = new GoogleGenerativeAI("AQ.Ab8RN6IfagulmZI8WIGWDocAoJzMulLiRxgHy2nv_M5DUp5dow");
  // Try to use gemini-1.5-pro
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent("Hello");
    console.log("PRO WORKS!", result.response.text());
  } catch (e) {
    console.log("PRO FAILED", e.message);
  }

  // Try gemini-1.5-flash
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("FLASH WORKS!", result.response.text());
  } catch (e) {
    console.log("FLASH FAILED", e.message);
  }

  // Try gemini-pro
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello");
    console.log("GEMINI-PRO WORKS!", result.response.text());
  } catch (e) {
    console.log("GEMINI-PRO FAILED", e.message);
  }
}

run();
