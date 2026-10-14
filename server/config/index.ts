import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqTextModel: process.env.GROQ_TEXT_MODEL || 'qwen/qwen3.8-27b',
  groqVisionModel: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};
