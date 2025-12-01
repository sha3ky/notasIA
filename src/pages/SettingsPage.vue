<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Configuración</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">IA y Servicios</div>
          </q-card-section>

          <q-card-section>
            <q-input
              v-model="apiKey"
              label="Groq API Key"
              type="password"
              hint="Tu clave se guarda localmente en este navegador"
              outlined
            >
              <template v-slot:append>
                <q-icon name="vpn_key" />
              </template>
            </q-input>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn color="primary" label="Guardar" @click="saveSettings" :loading="saving" />
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Datos</div>
          </q-card-section>
          <q-card-section>
            <p>Tus datos se almacenan localmente en tu dispositivo.</p>
            <q-btn outline color="negative" label="Borrar todos los datos" @click="confirmClearData" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSettingsStore } from 'stores/settingsStore';
import { useQuasar } from 'quasar';
import localforage from 'localforage';

const settingsStore = useSettingsStore();
const $q = useQuasar();

const apiKey = ref('');
const saving = ref(false);

onMounted(async () => {
  await settingsStore.loadSettings();
  apiKey.value = settingsStore.groqApiKey;
});

async function saveSettings() {
  saving.value = true;
  try {
    await settingsStore.setGroqApiKey(apiKey.value);
    $q.notify({ type: 'positive', message: 'Configuración guardada' });
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Error al guardar' });
  } finally {
    saving.value = false;
  }
}

function confirmClearData() {
  $q.dialog({
    title: '¿Borrar todo?',
    message: 'Esta acción eliminará todos tus proyectos, tareas e inventario. No se puede deshacer.',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await localforage.clear();
      window.location.reload();
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Error al borrar datos' });
    }
  });
}
</script>
