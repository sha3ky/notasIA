<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4">Inventario Inteligente</div>
      <q-btn color="primary" icon="add" label="Nuevo Proveedor" @click="showNewProviderDialog = true" />
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12" v-if="inventoryStore.loading">
        <q-spinner size="3em" />
      </div>
      <div class="col-12" v-else-if="inventoryStore.providers.length === 0">
        <q-banner class="bg-grey-3 rounded-borders">
          No hay proveedores registrados.
        </q-banner>
      </div>
      
      <div class="col-12 col-md-6" v-for="provider in inventoryStore.providers" :key="provider.id">
        <q-card>
          <q-card-section>
            <div class="text-h6">{{ provider.nombre }}</div>
            <div class="text-subtitle2 text-grey">{{ provider.telefono }}</div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">Productos Habituales:</div>
            <q-chip v-for="(price, product) in provider.precios_habituales" :key="product" outline color="primary">
              {{ product }}: {{ price }}€
            </q-chip>
            <div v-if="!provider.precios_habituales || Object.keys(provider.precios_habituales).length === 0" class="text-grey text-caption">
              Sin productos registrados
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialogo Nuevo Proveedor -->
    <q-dialog v-model="showNewProviderDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Nuevo Proveedor</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input dense v-model="newProvider.nombre" label="Nombre" class="q-mb-sm" />
          <q-input dense v-model="newProvider.telefono" label="Teléfono" />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Crear" @click="createProvider" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useInventoryStore } from 'stores/inventoryStore';
import { useQuasar } from 'quasar';

const inventoryStore = useInventoryStore();
const $q = useQuasar();

const showNewProviderDialog = ref(false);
const newProvider = reactive({
  nombre: '',
  telefono: ''
});

async function createProvider() {
  if (!newProvider.nombre.trim()) return;
  
  try {
    await inventoryStore.addProvider({ 
      nombre: newProvider.nombre,
      telefono: newProvider.telefono,
      precios_habituales: {}
    });
    showNewProviderDialog.value = false;
    newProvider.nombre = '';
    newProvider.telefono = '';
    $q.notify({ type: 'positive', message: 'Proveedor creado' });
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Error al crear proveedor' });
  }
}

onMounted(() => {
  inventoryStore.loadInventory();
});
</script>
