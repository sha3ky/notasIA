<template>
  <q-page class="q-pa-md">
    <div v-if="project">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h4">{{ project.nombre }}</div>
        <q-btn color="primary" icon="add" label="Nueva Tarea" @click="showNewTaskDialog = true" />
      </div>
      
      <q-list bordered separator class="bg-white rounded-borders">
        <q-item-label header>Tareas Pendientes</q-item-label>
        <q-item v-for="task in pendingTasks" :key="task.id" v-ripple>
          <q-item-section avatar>
            <q-checkbox :model-value="task.status === 'completed'" @update:model-value="val => toggleTaskStatus(task, val)" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ task.descripcion }}</q-item-label>
            <q-item-label caption v-if="task.metadata">
              {{ formatMetadata(task.metadata) }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-if="pendingTasks.length === 0" class="q-pa-md text-grey text-center">
          No hay tareas pendientes.
        </div>

        <q-separator />
        
        <q-expansion-item label="Tareas Completadas" header-class="text-grey">
           <q-item v-for="task in completedTasks" :key="task.id" class="bg-grey-1">
            <q-item-section avatar>
              <q-checkbox :model-value="task.status === 'completed'" @update:model-value="val => toggleTaskStatus(task, val)" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-strike">{{ task.descripcion }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-expansion-item>
      </q-list>
    </div>
    <div v-else class="flex flex-center q-pa-xl">
      <q-spinner size="3em" color="primary" />
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
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from 'stores/projectStore';
import { useQuasar } from 'quasar';

const route = useRoute();
const projectStore = useProjectStore();
const $q = useQuasar();

const showNewTaskDialog = ref(false);
const newTaskDescription = ref('');

const project = computed(() => projectStore.getProjectById(route.params.id));

const pendingTasks = computed(() => project?.value?.tasks.filter(t => t.status !== 'completed') || []);
const completedTasks = computed(() => project?.value?.tasks.filter(t => t.status === 'completed') || []);

function formatMetadata(metadata) {
  return Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(', ');
}

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

onMounted(async () => {
  if (projectStore.projects.length === 0) {
    await projectStore.loadProjects();
  }
});
</script>
