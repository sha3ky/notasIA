

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const groqService = {
    async getApiKey() {
        // 1. Prioridad ABSOLUTA a variable de entorno (según solicitud usuario)
        const envKey = import.meta.env.VITE_GROQ_API_KEY;
        const isEnvKeyValid = envKey && /^gsk_/.test(envKey.trim());

        if (isEnvKeyValid) {
            return envKey;
        }

        // 2. DB Key deshabilitada temporalmente por solicitud
        /*
        const dbKey = await settingsDB.getItem('groqApiKey');
        const isDbKeyValid = dbKey && /^(gsk_|GSK_)/.test(dbKey.trim());
        console.log('[GroqService] DB Key found:', !!dbKey, isDbKeyValid ? `Prefix: ${dbKey.trim().substring(0,4)}` : 'Invalid Format');
        
        if (isDbKeyValid) {
            console.log('[GroqService] Using DB Key');
            return dbKey;
        }
        */

        console.warn('[GroqService] No valid API Key found in .env');
        return null;
    },

    async chat(messages, model = 'llama-3.3-70b-versatile') {
        const apiKey = await this.getApiKey();

        if (!apiKey) {
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
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(`Error Groq API: ${errorData.error?.message || response.statusText}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        return data.choices[0].message;
    }
};
