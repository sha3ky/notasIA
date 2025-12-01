<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4 text-neon">Proyectos</div>
      <q-btn round icon="add" class="bg-primary text-white" @click="showNewProjectDialog = true" />
    </div>
    
    <div class="row q-col-gutter-md">
      <div class="col-12" v-if="projectStore.loading">
        <q-spinner-dots size="40px" color="cyan-13" />
      </div>
      <div class="col-12" v-else-if="projectStore.projects.length === 0">
        <q-banner class="glass-panel text-white rounded-borders text-center">
          No hay proyectos creados. ¡Empieza uno nuevo!
        </q-banner>
      </div>
      <div class="col-12 col-md-6" v-for="project in projectStore.projects" :key="project.id">
        <q-card class="glass-card full-height">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-h6 text-white">{{ project.nombre }}</div>
              <q-badge :color="project.status === 'completed' ? 'green-14' : 'cyan-13'" text-color="black">
                {{ project.status === 'completed' ? 'Completado' : 'En Progreso' }}
              </q-badge>
            </div>
            <div class="text-subtitle2 text-grey-5 q-mt-sm">
              {{ project.tasks.length }} tareas
            </div>
          </q-card-section>
          
          <q-separator class="bg-white-1" />
          
          <q-card-actions align="right">
            <q-btn flat color="cyan-13" label="Ver Detalles" :to="'/projects/' + project.id" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Dialogo Nuevo Proyecto -->
    <q-dialog v-model="showNewProjectDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Nuevo Proyecto</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input dense v-model="newProjectName" autofocus @keyup.enter="createProject" label="Nombre del Proyecto" />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Crear" @click="createProject" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useProjectStore } from 'stores/projectStore';
import { useQuasar } from 'quasar';

const projectStore = useProjectStore();
const $q = useQuasar();

const showNewProjectDialog = ref(false);
const newProjectName = ref('');

async function createProject() {
  if (!newProjectName.value.trim()) return;
  
  try {
    await projectStore.addProject({ nombre: newProjectName.value });
    showNewProjectDialog.value = false;
    newProjectName.value = '';
    $q.notify({ type: 'positive', message: 'Proyecto creado' });
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Error al crear proyecto' });
  }
}

onMounted(() => {
  projectStore.loadProjects();
});
</script>
