<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4 text-neon">Inventario</div>
      <q-btn round icon="add" class="bg-primary text-white" @click="showNewProviderDialog = true" />
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12" v-if="inventoryStore.loading">
        <q-spinner-dots size="40px" color="cyan-13" />
      </div>
      <div class="col-12" v-else-if="inventoryStore.providers.length === 0">
        <q-banner class="glass-panel text-white rounded-borders text-center">
          No hay proveedores registrados.
        </q-banner>
      </div>
      
      <div class="col-12 col-md-6" v-for="provider in inventoryStore.providers" :key="provider.id">
        <q-card class="glass-card full-height">
          <q-card-section>
            <div class="row items-center justify-between">
                <div>
                    <div class="text-h6 text-white">{{ provider.nombre }}</div>
                    <div class="text-subtitle2 text-grey-5">{{ provider.telefono }}</div>
                </div>
                <q-btn flat round icon="delete" color="red-4" @click="confirmDeleteProvider(provider)">
                    <q-tooltip>Eliminar Proveedor</q-tooltip>
                </q-btn>
            </div>
          </q-card-section>
          
          <q-separator class="bg-white-1" />
          
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
                <div class="text-subtitle2 text-neon-secondary">
                    Productos (Total: {{ calculateTotal(provider) }}€)
                </div>
                <div>
                    <q-btn flat round size="sm" icon="delete_sweep" color="red-4" @click="deleteAllProducts(provider)" v-if="provider.products?.length">
                        <q-tooltip>Borrar todos</q-tooltip>
                    </q-btn>
                    <q-btn flat round size="sm" icon="add" color="cyan-13" @click="openProductDialog(provider)" />
                </div>
            </div>
            
            <q-list separator dense class="rounded-borders bg-white-1 q-mt-sm">
              <q-item v-for="(prod, idx) in (provider.products || [])" :key="idx">
                <q-item-section>
                  <q-item-label class="text-white text-weight-medium">{{ prod.name }}</q-item-label>
                  <q-item-label caption class="text-grey-5">{{ prod.date }}</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-badge color="cyan-9" class="q-py-xs q-px-sm text-subtitle2">
                    {{ prod.price }}€
                  </q-badge>
                </q-item-section>

                <q-item-section side>
                  <q-btn flat round dense icon="close" color="red-4" size="sm" @click="deleteProduct(provider, idx)" />
                </q-item-section>
              </q-item>

              <!-- Retrocompatibilidad visual para datos antiguos -->
              <q-item v-for="(price, name) in (provider.precios_habituales || {})" :key="name">
                <q-item-section>
                  <q-item-label class="text-white">{{ name }}</q-item-label>
                  <q-item-label caption class="text-grey-6">Antiguo</q-item-label>
                </q-item-section>
                <q-item-section side>
                   <q-badge color="grey-8">{{ price }}€</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
            
            <div v-if="(!provider.products?.length)" class="text-grey-6 text-caption">
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
    <!-- Dialogo Nuevo Producto -->
    <q-dialog v-model="showProductDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Añadir Producto a {{ selectedProvider?.nombre }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input dense v-model="newProduct.name" label="Producto (ej: Cemento)" class="q-mb-sm" autofocus />
          <q-input dense v-model.number="newProduct.price" type="number" label="Precio (€)" class="q-mb-sm" />
          <q-input dense v-model="newProduct.date" type="date" label="Fecha" stack-label />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Añadir" @click="addProductToProvider" />
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
const showProductDialog = ref(false);
const selectedProvider = ref(null);

const newProvider = reactive({
  nombre: '',
  telefono: ''
});

const newProduct = reactive({
  name: '',
  price: '',
  date: ''
});

async function createProvider() {
  if (!newProvider.nombre.trim()) return;
  
  try {
    await inventoryStore.addProvider({ 
      nombre: newProvider.nombre,
      telefono: newProvider.telefono,
      products: [] // Inicializar array de productos
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

function openProductDialog(provider) {
  selectedProvider.value = provider;
  newProduct.name = '';
  newProduct.price = '';
  newProduct.date = new Date().toISOString().split('T')[0]; // Hoy por defecto
  showProductDialog.value = true;
}

async function addProductToProvider() {
  if (!newProduct.name || !selectedProvider.value) return;

  try {
    const provider = selectedProvider.value;
    const currentProducts = provider.products || [];
    
    const updatedProducts = [...currentProducts, {
      name: newProduct.name,
      price: Number(newProduct.price) || 0,
      date: newProduct.date || new Date().toISOString().split('T')[0]
    }];

    await inventoryStore.updateProvider(provider.id, { products: updatedProducts });
    
    showProductDialog.value = false;
    $q.notify({ type: 'positive', message: 'Producto añadido' });
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Error al añadir producto' });
  }
}

async function deleteProduct(provider, index) {
    try {
        const currentProducts = [...(provider.products || [])];
        currentProducts.splice(index, 1);
        await inventoryStore.updateProvider(provider.id, { products: currentProducts });
        $q.notify({ type: 'positive', message: 'Producto eliminado' });
    } catch (e) {
        console.error(e);
        $q.notify({ type: 'negative', message: 'Error al eliminar' });
    }
}

async function deleteAllProducts(provider) {
    try {
        await inventoryStore.updateProvider(provider.id, { products: [] });
        $q.notify({ type: 'positive', message: 'Todos los productos eliminados' });
    } catch (e) {
        console.error(e);
        $q.notify({ type: 'negative', message: 'Error al vaciar lista' });
    }
}

function confirmDeleteProvider(provider) {
    $q.dialog({
        title: 'Eliminar Proveedor',
        message: `¿Estás seguro de eliminar a ${provider.nombre} y todos sus productos?`,
        persistent: true,
        ok: { label: 'Eliminar', color: 'red', flat: true },
        cancel: { label: 'Cancelar', color: 'white', flat: true }
    }).onOk(async () => {
        try {
            await inventoryStore.deleteProvider(provider.id);
            $q.notify({ type: 'positive', message: 'Proveedor eliminado' });
        } catch (e) {
            console.error(e);
            $q.notify({ type: 'negative', message: 'Error al eliminar proveedor' });
        }
    });
}

function calculateTotal(provider) {
    if (!provider.products) return 0;
    return provider.products.reduce((sum, p) => sum + (Number(p.price) || 0), 0).toFixed(2);
}

onMounted(() => {
  inventoryStore.loadInventory();
});
</script>
