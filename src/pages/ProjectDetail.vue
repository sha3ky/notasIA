<template>
  <q-page class="q-pa-md">
    <div v-if="!project" class="text-center q-pa-lg">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <!-- Cabecera del Proyecto -->
      <div class="col-12">
        <q-card class="glass-card bg-gradient-primary">
          <q-card-section>
            <div class="row items-center justify-between">
              <div>
                <div class="text-h4 text-white text-weight-light">{{ project.nombre }}</div>
                <div class="text-subtitle1 text-grey-4">{{ project.descripcion }}</div>
              </div>
              <div class="row items-center q-gutter-sm">
                <q-chip :color="project.status === 'active' ? 'green-14' : 'grey'" text-color="black" class="glass-panel">
                  {{ project.status }}
                </q-chip>
                <q-btn flat round icon="delete" color="red-4" @click="confirmDeleteProject">
                    <q-tooltip>Eliminar Proyecto</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Tareas Pendientes -->
      <div class="col-12 col-md-6">
        <q-card class="glass-card full-height">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6 text-neon">Pendientes</div>
            <q-btn round flat icon="add" color="cyan-13" @click="showNewTaskDialog = true" />
          </q-card-section>
          
          <q-card-section>
            <div v-if="pendingTasks.length === 0" class="text-grey-5 text-center q-pa-md">
              ¡Todo al día! 🎉
            </div>
            <q-list v-else separator class="rounded-borders">
              <q-item 
                v-for="task in pendingTasks" 
                :key="task.id" 
                tag="label" 
                v-ripple
                class="q-py-md hover:bg-white-5 transition-all"
              >
                <q-item-section side top>
                  <q-checkbox v-model="task.completed" @update:model-value="toggleTaskStatus(task, true)" color="cyan-13" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body1">{{ task.descripcion }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Tareas Completadas -->
      <div class="col-12 col-md-6">
        <q-card class="glass-card full-height">
          <q-card-section>
            <div class="text-h6 text-grey-5">Completadas</div>
          </q-card-section>
          
          <q-card-section>
            <q-list separator class="rounded-borders opacity-60">
              <q-item v-for="task in completedTasks" :key="task.id" tag="label" v-ripple class="q-py-sm">
                <q-item-section side top>
                  <q-checkbox v-model="task.completed" :model-value="true" @update:model-value="toggleTaskStatus(task, false)" color="grey" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-strike text-grey">{{ task.descripcion }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialogo Nueva Tarea -->
    <q-dialog v-model="showNewTaskDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Nueva Tarea</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input dense v-model="newTaskDescription" autofocus @keyup.enter="createTask" label="Descripción" />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Crear" @click="createTask" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Botón Flotante Mentor -->
    <q-page-sticky position="bottom-right" :offset="[18, 80]">
      <q-btn fab icon="psychology" color="secondary" @click="askMentor" :loading="mentorLoading">
        <q-tooltip>Consultar a {{ currentMentor.name }}</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <!-- Dialogo Respuesta Mentor -->
    <q-dialog v-model="showMentorDialog">
      <q-card style="min-width: 350px; max-width: 80vw">
        <q-card-section class="row items-center">
          <q-avatar :icon="currentMentor.icon" color="primary" text-color="white" />
          <div class="text-h6 q-ml-md">{{ currentMentor.name }} dice:</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div style="white-space: pre-wrap;">{{ mentorResponse }}</div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from 'stores/projectStore';
import { useSettingsStore } from 'stores/settingsStore';
import { getMentorById } from '../constants/mentors';
import { useQuasar } from 'quasar';
import { useMentor } from 'src/composables/useMentor';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const settingsStore = useSettingsStore();
const $q = useQuasar();

const showNewTaskDialog = ref(false);
const newTaskDescription = ref('');
const { 
  showDialog: showMentorDialog, 
  response: mentorResponse, 
  loading: mentorLoading, 
  consultMentor 
} = useMentor();

const project = computed(() => projectStore.getProjectById(route.params.id));
const currentMentor = computed(() => getMentorById(settingsStore.activeMentorId));

const pendingTasks = computed(() => project?.value?.tasks.filter(t => t.status !== 'completed') || []);
const completedTasks = computed(() => project?.value?.tasks.filter(t => t.status === 'completed') || []);

async function createTask() {
  if (!newTaskDescription.value.trim()) return;
  
  try {
    await projectStore.addTask(project.value.id, { descripcion: newTaskDescription.value });
    showNewTaskDialog.value = false;
    newTaskDescription.value = '';
    $q.notify({ type: 'positive', message: 'Tarea añadida' });
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Error al añadir tarea' });
  }
}

async function toggleTaskStatus(task, isCompleted) {
  const newStatus = isCompleted ? 'completed' : 'pending';
  await projectStore.updateTask(project.value.id, task.id, { status: newStatus });
  
  if (isCompleted) {
    checkContextualSuggestions(task);
  }
}

function checkContextualSuggestions(completedTask) {
  // Lógica contextual simple
  const desc = completedTask.descripcion.toLowerCase();
  let suggestion = null;

  if (desc.includes('pintar') || desc.includes('pintura')) {
    suggestion = 'Limpiar herramientas de pintura';
  } else if (desc.includes('comprar')) {
    suggestion = 'Verificar presupuesto';
  }

  if (suggestion) {
    $q.notify({
      message: `Sugerencia: ${suggestion}`,
      color: 'info',
      actions: [
        { label: 'Añadir', color: 'white', handler: () => {
            projectStore.addTask(project.value.id, { descripcion: suggestion });
        }}
      ]
    });
  }
}

async function askMentor() {
  if (!project.value) return;
  
  const context = `
    Proyecto: ${project.value.nombre}
    Estado: ${project.value.status}
    Tareas pendientes:
    ${pendingTasks.value.map(t => '- ' + t.descripcion).join('\n')}
    Tareas completadas:
    ${completedTasks.value.map(t => '- ' + t.descripcion).join('\n')}
  `;

  await consultMentor(
    currentMentor.value.systemPrompt, 
    `Analiza este proyecto y dame consejos breves y accionables:\n${context}`
  );
}

function confirmDeleteProject() {
    $q.dialog({
        title: 'Eliminar Proyecto',
        message: '¿Estás seguro? Se borrarán todas las tareas asociadas.',
        persistent: true,
        ok: { label: 'Eliminar', color: 'red', flat: true },
        cancel: { label: 'Cancelar', color: 'white', flat: true }
    }).onOk(async () => {
        try {
            await projectStore.deleteProject(project.value.id);
            $q.notify({ type: 'positive', message: 'Proyecto eliminado' });
            // Volver al dashboard o lista de proyectos
            router.push('/');
        } catch (e) {
            console.error(e);
            $q.notify({ type: 'negative', message: 'Error al eliminar proyecto' });
        }
    });
}

onMounted(async () => {
  await settingsStore.loadSettings();
  if (projectStore.projects.length === 0) {
    await projectStore.loadProjects();
  }
});
</script>
