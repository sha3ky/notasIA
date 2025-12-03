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
            <div class="text-subtitle1 q-mb-sm">Voz del Asistente</div>
            
            <q-select
              v-model="selectedVoiceURI"
              :options="voiceOptions"
              label="Seleccionar Voz"
              outlined
              emit-value
              map-options
              class="q-mb-md"
              @update:model-value="previewVoice"
            >
              <template v-slot:prepend>
                <q-icon name="record_voice_over" />
              </template>
            </q-select>

            <div class="row q-col-gutter-sm">
                <div class="col-6">
                    <q-badge color="primary">Velocidad: {{ voiceRate }}</q-badge>
                    <q-slider v-model="voiceRate" :min="0.5" :max="2.0" :step="0.1" label />
                </div>
                <div class="col-6">
                    <q-badge color="secondary">Tono: {{ voicePitch }}</q-badge>
                    <q-slider v-model="voicePitch" :min="0.5" :max="2.0" :step="0.1" label />
                </div>
            </div>
          </q-card-section>

          <q-separator class="q-my-md" />

          <q-card-section>
            <q-input
              v-model="userName"
              label="Tu Nombre"
              hint="Cómo quieres que te llame el asistente"
              outlined
              class="q-mb-md"
            >
              <template v-slot:append>
                <q-icon name="badge" />
              </template>
            </q-input>

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
import { useSpeech } from 'src/composables/useSpeech';
import { computed } from 'vue';
import localforage from 'localforage';

const settingsStore = useSettingsStore();
const $q = useQuasar();
const { voices, speak } = useSpeech();

const apiKey = ref('');
const userName = ref('');
const selectedVoiceURI = ref(null);
const voiceRate = ref(1.0);
const voicePitch = ref(1.0);
const saving = ref(false);

const voiceOptions = computed(() => {
    return voices.value.map(v => ({
        label: v.name,
        value: v.voiceURI
    }));
});

onMounted(async () => {
  await settingsStore.loadSettings();
  apiKey.value = settingsStore.groqApiKey;
  userName.value = settingsStore.userName;
  selectedVoiceURI.value = settingsStore.voiceURI;
  voiceRate.value = settingsStore.voiceRate;
  voicePitch.value = settingsStore.voicePitch;
});

function previewVoice() {
    // Guardar temporalmente para probar
    settingsStore.setVoiceSettings(selectedVoiceURI.value, voiceRate.value, voicePitch.value);
    speak("Hola, así es como sueno.");
}

async function saveSettings() {
  saving.value = true;
  try {
    await settingsStore.setGroqApiKey(apiKey.value);
    await settingsStore.setUserName(userName.value);
    await settingsStore.setVoiceSettings(selectedVoiceURI.value, voiceRate.value, voicePitch.value);
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
    } catch (error) {
      console.error(error);
      $q.notify({ type: 'negative', message: 'Error al borrar datos' });
    }
  });
}
</script>
