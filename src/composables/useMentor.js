import { ref } from 'vue';
import { groqService } from '../services/groqService';
import { useQuasar } from 'quasar';

export function useMentor() {
    const $q = useQuasar();
    const showDialog = ref(false);
    const response = ref('');
    const loading = ref(false);

    async function consultMentor(systemPrompt, userPrompt) {
        loading.value = true;
        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const result = await groqService.chat(messages);
            response.value = result.content;
            showDialog.value = true;
            return result.content;
        } catch (error) {
            console.error('Error consulting mentor:', error);
            $q.notify({
                type: 'negative',
                message: 'No pude contactar con el mentor.',
                icon: 'error'
            });
            throw error;
        } finally {
            loading.value = false;
        }
    }

    function openDialogWithResponse(text) {
        response.value = text;
        showDialog.value = true;
    }

    return {
        showDialog,
        response,
        loading,
        consultMentor,
        openDialogWithResponse
    };
}
