<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Dashboard</div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-h6">Proyectos Activos</div>
            <div class="text-subtitle2">Resumen de progreso</div>
          </q-card-section>
          <q-card-section>
            <div v-if="projectStore.loading">Cargando...</div>
            <div v-else-if="projectStore.activeProjects.length === 0">No hay proyectos activos</div>
            <q-list v-else dense>
              <q-item v-for="project in projectStore.activeProjects.slice(0, 5)" :key="project.id">
                <q-item-section>
                  <q-item-label>{{ project.nombre }}</q-item-label>
                  <q-linear-progress :value="calculateProgress(project)" color="primary" class="q-mt-xs" />
                </q-item-section>
                <q-item-section side>
                  {{ (calculateProgress(project) * 100).toFixed(0) }}%
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-h6">Próximos Vencimientos</div>
          </q-card-section>
          <q-card-section>
            <div v-if="projectStore.upcomingDeadlines.length === 0">No hay vencimientos cercanos.</div>
            <q-list v-else dense>
               <q-item v-for="project in projectStore.upcomingDeadlines.slice(0, 5)" :key="project.id">
                <q-item-section>
                  <q-item-label>{{ project.nombre }}</q-item-label>
                  <q-item-label caption>{{ formatDate(project.deadline) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
    
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <VoiceInput @text-captured="onTextCaptured" />
    </q-page-sticky>

    <ActionConfirmationModal
      v-model="showConfirmation"
      :initial-text="capturedText"
      @confirmed="onActionConfirmed"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useProjectStore } from 'stores/projectStore';
import { useQuasar } from 'quasar';
import VoiceInput from 'components/VoiceInput.vue';
import ActionConfirmationModal from 'components/ActionConfirmationModal.vue';

const projectStore = useProjectStore();
const $q = useQuasar();

const showConfirmation = ref(false);
const capturedText = ref('');

function calculateProgress(project) {
  if (!project.tasks || project.tasks.length === 0) return 0;
  const completed = project.tasks.filter(t => t.status === 'completed').length;
  return completed / project.tasks.length;
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

function onTextCaptured(text) {
  capturedText.value = text;
  showConfirmation.value = true;
}

async function onActionConfirmed(interpretation) {
  if (!interpretation) return;

  try {
    if (interpretation.intent === 'create_task') {
      // Lógica simplificada: añadir al primer proyecto activo o crear uno
      let project = projectStore.projects[0];
      if (!project) {
        project = await projectStore.addProject({ nombre: 'Bandeja de Entrada' });
      }
      await projectStore.addTask(project.id, interpretation.data);
      $q.notify({ type: 'positive', message: 'Tarea creada exitosamente' });
    } else if (interpretation.intent === 'add_inventory') {
      // Lógica simplificada: añadir proveedor/producto
      // Esto requeriría más lógica para buscar proveedor existente
      $q.notify({ type: 'info', message: 'Función de inventario en desarrollo' });
    } else {
      $q.notify({ type: 'warning', message: 'Intención no reconocida o no soportada aún' });
    }
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Error al ejecutar acción' });
  }
}

onMounted(() => {
  projectStore.loadProjects();
});
</script>
