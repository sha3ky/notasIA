<template>
  <q-btn
    fab
    icon="mic"
    color="primary"
    :loading="listening"
    @click="toggleListening"
    class="voice-input-btn"
  >
    <template v-slot:loading>
      <q-spinner-audio color="white" />
    </template>
  </q-btn>
</template>

<script setup>
import { ref } from 'vue';
import { voiceService } from '../services/voiceService';
import { useQuasar } from 'quasar';

const emit = defineEmits(['text-captured', 'error']);
const $q = useQuasar();
const listening = ref(false);

function toggleListening() {
  if (listening.value) {
    voiceService.stop();
    listening.value = false;
  } else {
    listening.value = true;
    voiceService.start(
      (text) => {
        listening.value = false;
        emit('text-captured', text);
      },
      (error) => {
        listening.value = false;
        $q.notify({
          color: 'negative',
          message: error,
          icon: 'error'
        });
        emit('error', error);
      },
      () => {
        listening.value = false;
      }
    );
  }
}
</script>

<style scoped>
.voice-input-btn {
  /* Estilos adicionales si necesarios */
}
</style>
