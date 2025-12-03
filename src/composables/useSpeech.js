import { ref, onMounted } from 'vue';
import { useSettingsStore } from 'stores/settingsStore';

export function useSpeech() {
    const settingsStore = useSettingsStore();
    const voices = ref([]);
    const isSupported = 'speechSynthesis' in window;

    function loadVoices() {
        if (!isSupported) return;

        const populate = () => {
            voices.value = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('es'));
            // Si no hay voces en español, cargar todas
            if (voices.value.length === 0) {
                voices.value = window.speechSynthesis.getVoices();
            }
        };

        populate();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populate;
        }
    }

    function speak(text) {
        if (!isSupported || !text) return;

        // Cancelar lecturas anteriores
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = settingsStore.voiceRate || 1.0;
        utterance.pitch = settingsStore.voicePitch || 1.0;

        // Seleccionar voz
        const allVoices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (settingsStore.voiceURI) {
            selectedVoice = allVoices.find(v => v.voiceURI === settingsStore.voiceURI);
        }

        // Fallback: Primera voz en español
        if (!selectedVoice) {
            selectedVoice = allVoices.find(v => v.lang.startsWith('es'));
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            // Asegurar idioma si la voz lo tiene
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = 'es-ES';
        }

        window.speechSynthesis.speak(utterance);
    }

    function stop() {
        if (isSupported) window.speechSynthesis.cancel();
    }

    onMounted(() => {
        loadVoices();
    });

    return {
        voices,
        speak,
        stop,
        isSupported
    };
}
