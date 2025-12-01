import { settingsDB } from './db';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const groqService = {
    async getApiKey() {
        const envKey = import.meta.env.VITE_GROQ_API_KEY;
        if (envKey) {
            // console.log('[GroqService] Usando API Key desde .env:', envKey.substring(0, 4) + '...');
            return envKey;
        }

        const dbKey = await settingsDB.getItem('groqApiKey');
        if (dbKey) {
            // console.log('[GroqService] Usando API Key desde DB:', dbKey.substring(0, 4) + '...');
            return dbKey;
        }

        return null;
    },

    async chat(messages, model = 'llama-3.3-70b-versatile') {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            console.error('[GroqService] No se encontró ninguna API Key.');
            throw new Error('API Key de Groq no configurada');
        }

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error Groq API: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message;
    }
};
