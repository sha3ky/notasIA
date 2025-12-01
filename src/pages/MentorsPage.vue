<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Lista de Mentores -->
      <div class="col-12 col-md-4">
        <q-list bordered separator class="bg-white rounded-borders">
          <q-item-label header>Selecciona un Mentor</q-item-label>
          <q-item
            v-for="mentor in mentors"
            :key="mentor.id"
            clickable
            :active="selectedMentor?.id === mentor.id"
            @click="selectMentor(mentor)"
            active-class="bg-blue-1 text-primary"
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">{{ mentor.icon }}</q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ mentor.name }}</q-item-label>
              <q-item-label caption>{{ mentor.expertise }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Área de Chat -->
      <div class="col-12 col-md-8">
        <q-card class="column" style="height: 70vh">
          <q-card-section class="bg-primary text-white q-py-sm">
            <div class="text-h6">{{ selectedMentor ? selectedMentor.name : 'Selecciona un mentor' }}</div>
          </q-card-section>

          <q-card-section class="col scroll q-pa-md">
            <div v-if="!selectedMentor" class="flex flex-center full-height text-grey">
              Selecciona un mentor para comenzar a chatear.
            </div>
            <div v-else>
              <div v-for="(msg, index) in chatHistory" :key="index" class="q-mb-md">
                <q-chat-message
                  :name="msg.role === 'user' ? 'Tú' : selectedMentor.name"
                  :text="[msg.content]"
                  :sent="msg.role === 'user'"
                  :bg-color="msg.role === 'user' ? 'blue-2' : 'grey-3'"
                />
              </div>
              <div v-if="loading" class="q-ml-md">
                <q-spinner-dots size="2em" />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions class="q-pa-md">
            <q-input
              v-model="userMessage"
              outlined
              dense
              class="full-width"
              placeholder="Escribe tu consulta..."
              @keyup.enter="sendMessage"
              :disable="!selectedMentor || loading"
            >
              <template v-slot:after>
                <q-btn round dense flat icon="send" color="primary" @click="sendMessage" :disable="!selectedMentor || loading || !userMessage.trim()" />
              </template>
            </q-input>
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { groqService } from '../services/groqService';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const mentors = [
  {
    id: 'kiyosaki',
    name: 'Robert Kiyosaki',
    icon: 'RK',
    expertise: 'Finanzas y Activos',
    systemPrompt: 'Eres Robert Kiyosaki. Responde enfocándote en activos vs pasivos, flujo de caja y libertad financiera. Sé directo y un poco provocador.'
  },
  {
    id: 'ferriss',
    name: 'Tim Ferriss',
    icon: 'TF',
    expertise: 'Productividad y Automatización',
    systemPrompt: 'Eres Tim Ferriss. Enfócate en la regla 80/20, automatización, delegación y eficiencia extrema. Pregunta si esto es esencial.'
  },
  {
    id: 'musk',
    name: 'Elon Musk',
    icon: 'EM',
    expertise: 'Innovación y Primeros Principios',
    systemPrompt: 'Eres Elon Musk. Piensa desde los primeros principios. Desafía las asunciones. Enfócate en la física de lo posible y la escala masiva.'
  },
  {
    id: 'corleone',
    name: 'Don Corleone',
    icon: 'DC',
    expertise: 'Estrategia y Negociación',
    systemPrompt: 'Eres Don Corleone. Habla con respeto, sabiduría y autoridad. Enfócate en la lealtad, la familia y hacer ofertas que no puedan rechazar.'
  }
];

const selectedMentor = ref(null);
const userMessage = ref('');
const chatHistory = ref([]);
const loading = ref(false);

function selectMentor(mentor) {
  selectedMentor.value = mentor;
  chatHistory.value = []; // Reiniciar chat al cambiar mentor (opcional)
}

async function sendMessage() {
  if (!userMessage.value.trim() || !selectedMentor.value) return;

  const message = userMessage.value;
  chatHistory.value.push({ role: 'user', content: message });
  userMessage.value = '';
  loading.value = true;

  try {
    const messages = [
      { role: 'system', content: selectedMentor.value.systemPrompt },
      ...chatHistory.value
    ];

    const response = await groqService.chat(messages);
    chatHistory.value.push({ role: 'assistant', content: response.content });
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Error al consultar al mentor. Verifica tu API Key.' });
    chatHistory.value.push({ role: 'assistant', content: 'Lo siento, no puedo responder en este momento.' });
  } finally {
    loading.value = false;
  }
}
</script>
