import { settingsDB } from './db';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const groqService = {
    async getApiKey() {
        return await settingsDB.getItem('groqApiKey');
    },

    async chat(messages, model = 'llama3-70b-8192') {
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
            const errorData = await response.json();
            throw new Error(`Error Groq API: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message;
    }
};
