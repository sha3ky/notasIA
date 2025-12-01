import { groqService } from './groqService';

export const intentService = {
    async processText(text) {
        // Intentar usar Groq primero si hay API Key
        try {
            const apiKey = await groqService.getApiKey();
            if (apiKey) {
                return await this.processWithGroq(text);
            }
        } catch (e) {
            console.warn('Groq no disponible, usando fallback local', e);
        }

        // Fallback: Procesamiento local básico
        return this.processLocally(text);
    },

    async processWithGroq(text) {
        const systemPrompt = `
      Eres un asistente de productividad. Analiza el texto del usuario y extrae la intención estructurada en JSON.
      Las intenciones posibles son: 'create_task', 'update_task', 'add_inventory', 'query'.
      
      Formato de respuesta JSON esperado:
      {
        "intent": "create_task",
        "data": {
          "description": "Comprar pintura",
          "project": "Renovación Cocina", // Si se menciona o infiere
          "metadata": { "price": 25, "place": "Leroy Merlin" }
        },
        "confirmation_text": "Confirmar tarea: Comprar pintura por 25€ en Leroy Merlin"
      }
    `;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
        ];

        const response = await groqService.chat(messages);
        try {
            return JSON.parse(response.content);
        } catch (e) {
            console.error('Error parseando respuesta de Groq', e);
            return { intent: 'unknown', original_text: text };
        }
    },

    processLocally(text) {
        // Heurísticas muy básicas para demostración
        const lower = text.toLowerCase();

        if (lower.includes('compr') || lower.includes('gast')) {
            // Posible gasto / inventario
            return {
                intent: 'add_inventory',
                data: {
                    description: text,
                    price: this.extractPrice(text)
                },
                confirmation_text: `Registrar compra: ${text}`
            };
        } else if (lower.includes('tarea') || lower.includes('tengo que')) {
            return {
                intent: 'create_task',
                data: {
                    description: text
                },
                confirmation_text: `Crear tarea: ${text}`
            };
        }

        return {
            intent: 'unknown',
            original_text: text,
            confirmation_text: `No entendí bien: "${text}"`
        };
    },

    extractPrice(text) {
        const match = text.match(/(\d+([.,]\d{1,2})?)\s*(€|euros?)/i);
        return match ? parseFloat(match[1].replace(',', '.')) : null;
    }
};
