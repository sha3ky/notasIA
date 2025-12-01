import { defineStore } from 'pinia';
import { settingsDB } from '../services/db';

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        groqApiKey: '',
        userName: 'Usuario',
        theme: 'auto'
    }),

    actions: {
        async loadSettings() {
            this.groqApiKey = (await settingsDB.getItem('groqApiKey')) || '';
            this.userName = (await settingsDB.getItem('userName')) || 'Usuario';
            this.theme = (await settingsDB.getItem('theme')) || 'auto';
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
        }
    }
});
