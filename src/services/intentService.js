import { groqService } from './groqService';

export const intentService = {
    async processText(text) {
        console.log('[Voice] Texto capturado:', text);

        try {
            const apiKey = await groqService.getApiKey();

            if (apiKey) {
                try {
                    const today = new Date().toISOString().split('T')[0];
                    const systemPrompt = `
                    Current Date: ${today}
                    JSON output only.
                    Intents: 
                    - create_task: new actions, to-dos, shopping items.
                    - query: questions about data (how much, how many, list, status).
                    - update_task: modify existing.
                    - delete_task: remove existing.
                    - complete_task: mark existing task as done/completed.

                    Fields:
                    - intent: detected intent.
                    - description: main content/query.
                    - target_search: text to find existing task (for update/delete/complete).
                    - date: YYYY-MM-DD or null.
                    - cost: number or null.
                    - tags: array of strings.
                    
                    Ex: "Borrar la nota de pan" -> {"intent": "delete_task", "target_search": "pan"}
                    Ex: "Cambiar cita dentista a mañana" -> {"intent": "update_task", "target_search": "dentista", "date": "2023-10-28"}
                    Ex: "Ya llamé al vecino" -> {"intent": "complete_task", "target_search": "vecino"}
                    Ex: "¿Cuánto he gastado hoy?" -> {"intent": "query", "description": "Cuánto he gastado hoy"}
                    Ex: "¿Cuántas tareas tengo?" -> {"intent": "query", "description": "Cuántas tareas tengo"}
                    `;

                    const response = await groqService.chat([
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: text }
                    ]);

                    console.log('[Intent] Respuesta Raw IA:', response.content);

                    let jsonResponse;
                    try {
                        // Intentar limpiar bloques de código si la IA los añade
                        const cleanContent = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
                        jsonResponse = JSON.parse(cleanContent);
                    } catch (e) {
                        console.warn('[Intent] Fallo al parsear JSON, usando fallback manual', e);
                        // Fallback básico si falla el JSON
                        return {
                            intent: 'create_task',
                            data: { descripcion: text },
                            confidence: 0.5
                        };
                    }

                    console.log('[Intent] JSON Estructurado:', jsonResponse);

                    return {
                        intent: jsonResponse.intent || 'create_task',
                        data: {
                            descripcion: jsonResponse.description || text,
                            target_search: jsonResponse.target_search,
                            deadline: jsonResponse.date,
                            cost: jsonResponse.cost,
                            tags: jsonResponse.tags,
                            project_hint: jsonResponse.project_hint
                        },
                        confidence: 0.9
                    };

                } catch (error) {
                    console.error('[Intent] Error en procesamiento IA:', error);
                    // Continuar al fallback local
                }
            }
        } catch (e) {
            console.warn('Error accediendo a API Key o servicio', e);
        }

        // Fallback: Procesamiento local básico
        return this.processLocally(text);
    },

    processLocally(text) {
        const lower = text.toLowerCase();

        if (lower.includes('compr') || lower.includes('gast')) {
            return {
                intent: 'create_task', // Unificamos todo a create_task con metadatos
                data: {
                    descripcion: text,
                    cost: this.extractPrice(text),
                    tags: ['gasto']
                },
                confidence: 0.6
            };
        }

        return {
            intent: 'create_task',
            data: {
                descripcion: text
            },
            confidence: 0.5
        };
    },

    extractPrice(text) {
        const match = text.match(/(\d+([.,]\d{1,2})?)\s*(€|euros?)/i);
        return match ? parseFloat(match[1].replace(',', '.')) : null;
    }
};
