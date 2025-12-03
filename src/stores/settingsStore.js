import { defineStore } from 'pinia';
import { settingsDB } from '../services/db';

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        groqApiKey: '',
        userName: 'Usuario',
        theme: 'auto',
        activeMentorId: 'kiyosaki',
        voiceURI: null,
        voiceRate: 1.0,
        voicePitch: 1.0
    }),

    actions: {
        async loadSettings() {
            this.groqApiKey = (await settingsDB.getItem('groqApiKey')) || this.groqApiKey;
            this.userName = (await settingsDB.getItem('userName')) || 'Usuario';
            this.theme = (await settingsDB.getItem('theme')) || 'auto';
            this.activeMentorId = (await settingsDB.getItem('activeMentorId')) || 'kiyosaki';

            // Voice Settings
            this.voiceURI = (await settingsDB.getItem('voiceURI')) || null;
            this.voiceRate = (await settingsDB.getItem('voiceRate')) || 1.0;
            this.voicePitch = (await settingsDB.getItem('voicePitch')) || 1.0;
        },

        async setGroqApiKey(key) {
            this.groqApiKey = key;
            await settingsDB.setItem('groqApiKey', key);
        },

        async setUserName(name) {
            this.userName = name;
            await settingsDB.setItem('userName', name);
        },

        async setTheme(theme) {
            this.theme = theme;
            await settingsDB.setItem('theme', theme);
        },

        async setActiveMentor(id) {
            this.activeMentorId = id;
            await settingsDB.setItem('activeMentorId', id);
        },

        async setVoiceSettings(uri, rate, pitch) {
            this.voiceURI = uri;
            this.voiceRate = rate;
            this.voicePitch = pitch;
            await settingsDB.setItem('voiceURI', uri);
            await settingsDB.setItem('voiceRate', rate);
            await settingsDB.setItem('voicePitch', pitch);
        }
    }
});
