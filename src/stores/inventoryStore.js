import { defineStore } from 'pinia';
import { inventoryDB } from '../services/db';
import { uid } from 'quasar';

export const useInventoryStore = defineStore('inventory', {
    state: () => ({
        providers: [],
        loading: false
    }),

    actions: {
        async loadInventory() {
            this.loading = true;
            try {
                const keys = await inventoryDB.keys();
                const loadedProviders = [];
                for (const key of keys) {
                    const provider = await inventoryDB.getItem(key);
                    loadedProviders.push(provider);
                }
                this.providers = loadedProviders;
            } catch (error) {
                console.error('Error loading inventory:', error);
            } finally {
                this.loading = false;
            }
        },

        async addProvider(providerData) {
            const newProvider = {
                id: uid(),
                products: [],
                ...providerData
            };
            this.providers.push(newProvider);
            await inventoryDB.setItem(newProvider.id, newProvider);
        },

        async updateProvider(id, updates) {
            const index = this.providers.findIndex(p => p.id === id);
            if (index !== -1) {
                this.providers[index] = { ...this.providers[index], ...updates };
                await inventoryDB.setItem(id, this.providers[index]);
            }
        }
    }
});
