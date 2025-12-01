<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Confirmar Acción</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div v-if="loading">
          <q-spinner-dots size="2em" /> Procesando...
        </div>
        <div v-else>
          <q-input
            v-model="editableText"
            type="textarea"
            autogrow
            label="Texto reconocido"
            class="q-mb-md"
          />
          
          <q-card v-if="interpretation" flat bordered class="bg-grey-1">
            <q-card-section>
              <div class="text-subtitle2">Interpretación:</div>
              <div>{{ interpretation.confirmation_text }}</div>
              <div v-if="interpretation.data" class="text-caption text-grey">
                {{ JSON.stringify(interpretation.data) }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn flat label="Confirmar" @click="confirm" :disable="loading" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { intentService } from '../services/intentService';

const props = defineProps({
  modelValue: Boolean,
  initialText: String
});

const emit = defineEmits(['update:modelValue', 'confirmed']);

const isOpen = ref(props.modelValue);
const editableText = ref('');
const interpretation = ref(null);
const loading = ref(false);

watch(() => props.modelValue, (val) => {
  isOpen.value = val;
});

watch(() => isOpen.value, (val) => {
  emit('update:modelValue', val);
});

watch(() => props.initialText, async (val) => {
  if (val) {
    editableText.value = val;
    await processText(val);
  }
});

const debounceTimer = ref(null);

watch(() => editableText.value, (newVal) => {
  if (newVal === props.initialText) return; // Evitar doble proceso al inicio
  
  if (debounceTimer.value) clearTimeout(debounceTimer.value);
  
  debounceTimer.value = setTimeout(() => {
    processText(newVal);
  }, 1000); // Esperar 1s después de escribir
});

async function processText(text) {
  if (!text.trim()) return;
  loading.value = true;
  try {
    interpretation.value = await intentService.processText(text);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function confirm() {
  emit('confirmed', interpretation.value);
  isOpen.value = false;
}
</script>
