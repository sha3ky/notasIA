export const voiceService = {
    recognition: null,
    isSupported: false,

    init() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'es-ES';
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            this.isSupported = true;
            return true;
        }
        return false;
    },

    start(onResult, onError, onEnd) {
        if (!this.isSupported && !this.init()) {
            if (onError) onError('Reconocimiento de voz no soportado en este navegador.');
            return;
        }

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (onResult) onResult(transcript);
        };

        this.recognition.onerror = (event) => {
            if (onError) onError(event.error);
        };

        this.recognition.onend = () => {
            if (onEnd) onEnd();
        };

        try {
            this.recognition.start();
        } catch (e) {
            console.error('Error al iniciar reconocimiento:', e);
            if (onError) onError('No se pudo iniciar el micrófono.');
        }
    },

    stop() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
};
