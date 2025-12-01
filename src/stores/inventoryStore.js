import { defineStore } from 'pinia';
import { inventoryDB } from '../services/db';
import { uid } from 'quasar';
import { toRaw } from 'vue';

export const useInventoryStore = defineStore('inventory', {
    state: () => ({
        providers: [],
        loading: false
    }),

    actions: {
        async loadInventory() {
            this.loading = true;
            // console.log('[Inventory] Cargando proveedores...');
            try {
                const keys = await inventoryDB.keys();
                const loadedProviders = [];
                for (const key of keys) {
                    const provider = await inventoryDB.getItem(key);
                    loadedProviders.push(provider);
                }
                this.providers = loadedProviders;
                // console.log(`[Inventory] ${loadedProviders.length} proveedores cargados.`);
            } catch (error) {
                console.error('[Inventory] Error loading inventory:', error);
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

            // Sanitizar: toRaw para quitar Proxy + JSON para copia profunda limpia
            const rawProvider = toRaw(newProvider);
            const plainProvider = JSON.parse(JSON.stringify(rawProvider));

            // console.log('[Inventory] Guardando nuevo proveedor:', plainProvider);

            try {
                await inventoryDB.setItem(plainProvider.id, plainProvider);
            } catch (e) {
                console.error('[Inventory] Error al guardar en DB:', e);
                throw e;
            }
        },

        async updateProvider(id, updates) {
            const index = this.providers.findIndex(p => p.id === id);
            if (index !== -1) {
                this.providers[index] = { ...this.providers[index], ...updates };

                // Sanitizar: toRaw para quitar Proxy + JSON para copia profunda limpia
                const rawProvider = toRaw(this.providers[index]);
                const plainProvider = JSON.parse(JSON.stringify(rawProvider));

                // console.log('[Inventory] Actualizando proveedor:', plainProvider);

                try {
                    await inventoryDB.setItem(id, plainProvider);
                } catch (e) {
                    console.error('[Inventory] Error al actualizar en DB:', e);
                    throw e;
                }
            }
        }
    }
});
