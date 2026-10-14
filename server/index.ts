import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`[EnglishIQ Server] Running on http://localhost:${config.port}`);
  console.log(`[Groq AI] Configured Model: ${config.groqTextModel}`);
  console.log(`[Curriculum Isolation] Strict class_id filtering active`);
  console.log(`====================================================`);
});

export default app;
