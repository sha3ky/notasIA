<template>
  <q-page class="q-pa-md q-pb-xl"> <!-- Added padding bottom for footer -->
    <div class="row q-col-gutter-md">
      <!-- Tarjeta de Bienvenida -->
      <div class="col-12">
        <q-card class="glass-card bg-gradient-primary text-white">
          <q-card-section>
            <div class="text-h4 text-weight-light">Hola, <span class="text-weight-bold">{{ settingsStore.userName }}</span></div>
            <div class="text-subtitle1 opacity-80">¿Qué vamos a lograr hoy?</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Proyectos Activos -->
      <div class="col-12 col-md-6">
        <q-card class="glass-card full-height">
          <q-card-section>
            <div class="text-h6 text-neon">Proyectos Activos</div>
            <div class="text-caption text-grey-4">Tu progreso actual</div>
          </q-card-section>
          <q-card-section>
            <div v-if="projectStore.loading">Cargando...</div>
            <div v-else-if="projectStore.activeProjects.length === 0" class="text-grey-5">No hay proyectos activos</div>
            <q-list v-else dense separator class="rounded-borders">
              <q-item v-for="project in projectStore.activeProjects.slice(0, 5)" :key="project.id" class="q-py-md">
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ project.nombre }}</q-item-label>
                  <div class="row q-gutter-x-md q-mt-sm text-caption">
                    <span class="text-orange-4">
                      <q-icon name="pending" size="xs" /> {{ project.tasks.filter(t => t.status !== 'completed').length }} Pendientes
                    </span>
                    <span class="text-green-4">
                      <q-icon name="check_circle" size="xs" /> {{ project.tasks.filter(t => t.status === 'completed').length }} Completadas
                    </span>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- Próximos Vencimientos -->
      <div class="col-12 col-md-6">
        <q-card class="glass-card full-height">
          <q-card-section>
            <div class="text-h6 text-neon-secondary">Próximos Vencimientos</div>
            <div class="text-caption text-grey-4">Atención requerida</div>
          </q-card-section>
          <q-card-section>
            <div v-if="projectStore.upcomingDeadlines.length === 0" class="text-grey-5">Todo al día.</div>
            <q-list v-else dense separator class="rounded-borders">
               <q-item v-for="project in projectStore.upcomingDeadlines.slice(0, 5)" :key="project.id" class="q-py-md">
                <q-item-section avatar>
                  <q-icon name="event" color="purple-13" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ project.nombre }}</q-item-label>
                  <q-item-label caption class="text-grey-5">{{ formatDate(project.deadline) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Spacer para evitar que el footer tape el contenido -->
    <div style="height: 120px; width: 100%;"></div>

    <!-- Footer de Entrada (Voz/Texto) -->
    <div class="fixed-bottom q-mb-lg glass-panel" style="width: 90%; max-width: 600px; left: 50%; transform: translateX(-50%); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); z-index: 2000;">
      <div class="row items-center justify-around q-col-gutter-md q-pa-sm">
        
        <!-- Switch Modo -->
       <div class="col-auto q-mr-md">
        <q-btn-toggle
          v-model="inputMode"
          push
          glossy
          spread 
          toggle-color="primary"
          :options="[
            { icon: 'mic', value: 'voice' },
            { icon: 'keyboard', value: 'text' }
          ]"
          style="gap: 25px;" 
        />
      </div>

        <!-- Input Voz -->
        <div class="col-auto" v-if="inputMode === 'voice'">
           <VoiceInput @text-captured="onTextCaptured" />
        </div>

        <!-- Input Texto -->
        <div class="col" v-else>
          <q-input 
            v-model="manualInput" 
            dark 
            dense 
            outlined 
            placeholder="Escribe tu nota o pregunta..." 
            @keyup.enter="sendManualInput"
            class="neon-input"
          >
            <template v-slot:append>
              <q-btn round dense flat icon="send" color="cyan-13" @click="sendManualInput" />
            </template>
          </q-input>
        </div>

      </div>
    </div>

    <!-- Modal de Confirmación de Acción -->
    <ActionConfirmationModal
      v-model="showConfirmation"
      :initial-text="capturedText"
      @confirmed="onActionConfirmed"
    />

    <!-- Modal de Respuesta del Mentor -->
    <q-dialog v-model="showMentorDialog" backdrop-filter="blur(4px)">
      <q-card class="glass-card q-pa-md" style="min-width: 350px; max-width: 90vw; border: 1px solid #00f3ff">
        <q-card-section class="row items-center">
          <q-avatar size="md" class="q-mr-sm" style="border: 2px solid #00f3ff">
            {{ getMentorById(settingsStore.activeMentorId).icon }}
          </q-avatar>
          <div class="text-h6 text-neon">{{ getMentorById(settingsStore.activeMentorId).name }} dice:</div>
          <q-space />
          <q-btn icon="volume_up" flat round dense color="cyan-13" @click="speakText(mentorResponseText)" class="q-mr-sm" />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body1 text-white" style="line-height: 1.6; font-size: 1.1rem">
            {{ mentorResponseText }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Entendido" color="cyan-13" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useProjectStore } from 'stores/projectStore';
import { useSettingsStore } from 'stores/settingsStore';
import { useQuasar } from 'quasar';
import VoiceInput from 'components/VoiceInput.vue';
import ActionConfirmationModal from 'components/ActionConfirmationModal.vue';
import { getMentorById } from 'src/constants/mentors';

import { useSpeech } from 'src/composables/useSpeech';
import { useMentor } from 'src/composables/useMentor';

const projectStore = useProjectStore();
const settingsStore = useSettingsStore();
const $q = useQuasar();
const { speak: speakText } = useSpeech(); 
const { 
    showDialog: showMentorDialog, 
    response: mentorResponseText, 
    consultMentor
} = useMentor();

const showConfirmation = ref(false);
const capturedText = ref('');

// UI States
const inputMode = ref('voice');
const manualInput = ref('');

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
}

function onTextCaptured(text) {
  capturedText.value = text;
  showConfirmation.value = true;
}

async function sendManualInput() {
  if (!manualInput.value.trim()) return;
  
  const text = manualInput.value;
  manualInput.value = ''; // Limpiar input
  capturedText.value = text;
  showConfirmation.value = true;
}

const pendingAction = ref(null);
const lastQueryResults = ref([]);

function resolveTaskFromContext(searchTerm) {
    // Si no hay contexto previo, intentamos cargarlo con las tareas actuales (Fallback implícito)
    if (!lastQueryResults.value.length) {
        const allPending = [];
        const projectStore = useProjectStore(); // Necesitamos acceso al store aquí si no está disponible globalmente en este scope
        projectStore.projects.forEach(p => {
             p.tasks.filter(t => t.status !== 'completed').forEach(t => {
                 allPending.push({
                    id: t.id,
                    projectId: p.id,
                    desc: t.descripcion,
                    status: t.status,
                    cost: t.cost || 0,
                    date: t.createdAt
                 });
             });
             
        });
        // Ordenamos por fecha (o como se muestren en la UI) para consistencia
        // Asumimos orden de inserción o ID por ahora
        lastQueryResults.value = allPending.slice(0, 10);
        console.log('[Dashboard] Contexto vacío. Rellenado con tareas actuales:', lastQueryResults.value);
    }

    if (!lastQueryResults.value.length || !searchTerm) return null;
    const lower = searchTerm.toLowerCase();
    let index = -1;
    
    if (lower.includes('primera') || lower === '1' || lower === '1º' || lower === 'uno') index = 0;
    else if (lower.includes('segunda') || lower === '2' || lower === '2º' || lower === 'dos') index = 1;
    else if (lower.includes('tercera') || lower === '3' || lower === '3º' || lower === 'tres') index = 2;
    else if (lower.includes('cuarta') || lower === '4' || lower === '4º' || lower === 'cuatro') index = 3;
    else if (lower.includes('quinta') || lower === '5' || lower === '5º' || lower === 'cinco') index = 4;
    else if (lower.includes('sexta') || lower === '6' || lower === '6º' || lower === 'seis') index = 5;
    else if (lower.includes('septima') || lower.includes('séptima') || lower === '7' || lower === '7º' || lower === 'siete') index = 6;
    else if (lower.includes('octava') || lower === '8' || lower === '8º' || lower === 'ocho') index = 7;
    else if (lower.includes('novena') || lower === '9' || lower === '9º' || lower === 'nueve') index = 8;
    else if (lower.includes('decima') || lower.includes('décima') || lower === '10' || lower === '10º' || lower === 'diez') index = 9;
    else if (lower.includes('ultimo') || lower.includes('último') || lower.includes('ultima') || lower.includes('última')) {
        index = lastQueryResults.value.length - 1;
    }
    
    if (index >= 0 && index < lastQueryResults.value.length) {
        return lastQueryResults.value[index];
    }
    return null;
}

async function onActionConfirmed(interpretation) {
  if (!interpretation) return;

  try {
    // 0. Verificar si estamos resolviendo una ambigüedad pendiente
    if (pendingAction.value) {
        const text = interpretation.data.descripcion.toLowerCase();
        const candidates = pendingAction.value.candidates;
        let selectedTask = null;

        // Lógica heurística para seleccionar
        if (text.includes('primera') || text.includes('uno') || text.includes('1')) selectedTask = candidates[0];
        else if (text.includes('segunda') || text.includes('dos') || text.includes('2')) selectedTask = candidates[1];
        else if (text.includes('tercera') || text.includes('tres') || text.includes('3')) selectedTask = candidates[2];
        else {
            // Intentar buscar por contenido
            const matches = candidates.filter(c => c.task.descripcion.toLowerCase().includes(text));
            if (matches.length === 1) selectedTask = matches[0];
        }

        if (selectedTask) {
            // Ejecutar la acción pendiente con la tarea seleccionada
            const { intent, data } = pendingAction.value;
            const { task, projectId } = selectedTask;
            
            if (intent === 'delete_task') {
                await projectStore.deleteTask(projectId, task.id);
                $q.notify({ type: 'positive', message: 'Tarea eliminada.', icon: 'delete' });
                speakText(`Hecho. He borrado: ${task.descripcion}`);
            } else if (intent === 'complete_task') {
                await projectStore.updateTask(projectId, task.id, { status: 'completed' });
                $q.notify({ type: 'positive', message: 'Tarea completada.', icon: 'check_circle' });
                speakText(`Listo. Completada: ${task.descripcion}`);
            } else if (intent === 'update_task') {
                const updates = {};
                if (data.descripcion && data.descripcion !== data.target_search) updates.descripcion = data.descripcion;
                if (data.cost) updates.cost = data.cost;
                if (data.deadline) updates.deadline = data.deadline;
                await projectStore.updateTask(projectId, task.id, updates);
                $q.notify({ type: 'positive', message: 'Tarea actualizada.', icon: 'edit' });
                speakText(`Actualizada: ${task.descripcion}`);
            }

            // Limpiar estado
            pendingAction.value = null;
            return; // Salir, ya procesamos
        } else {
            // Si el usuario dice algo que no entendemos como selección, asumimos que quiere cancelar o cambiar de tema
            // Pero avisamos por si acaso
            if (text.includes('cancelar') || text.includes('olvida')) {
                pendingAction.value = null;
                speakText("Vale, operación cancelada.");
                return;
            }
            // Si no, dejamos que fluya al procesamiento normal, PERO limpiamos el pendingAction para no bloquear
            // O podríamos insistir... "No te entendí, ¿cuál de las opciones?". 
            // Para no frustrar, si no matchea, asumimos nuevo comando y limpiamos.
            pendingAction.value = null; 
        }
    }

    if (interpretation.intent === 'create_task') {
      // 1. Crear la nota/tarea
      let project = projectStore.projects[0];
      if (!project) {
        project = await projectStore.addProject({ nombre: 'Bandeja de Entrada' });
      }
      
      // Añadir metadatos extra a la tarea
      const taskData = {
        ...interpretation.data,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      await projectStore.addTask(project.id, taskData);
      
      // Obtener datos del mentor activo
      const activeMentor = getMentorById(settingsStore.activeMentorId);

      // 2. Feedback Automático del Mentor
      $q.notify({ 
        type: 'ongoing', 
        message: `${activeMentor.name} está analizando tu nota...`,
        timeout: 2000
      });

      // Consultar al mentor sobre esta nota específica
      const mentorPrompt = `
        El usuario acaba de registrar esta nota: "${taskData.descripcion}".
        Datos extraídos: Costo=${taskData.cost || 'N/A'}, Fecha=${taskData.deadline || 'N/A'}, Etiquetas=${taskData.tags?.join(',') || 'N/A'}.
        
        Dame un consejo muy breve (máximo 2 frases) y directo sobre esto.
        Si es un gasto, cuestiona si es activo o pasivo.
        Si es una tarea, sugiere cómo hacerla más eficiente.
      `;
      
      // console.log('[Mentor] Prompt enviado:', mentorPrompt);

      try {
        const responseText = await consultMentor(activeMentor.systemPrompt, mentorPrompt);
        // console.log('[Mentor] Respuesta recibida:', responseText);
        
        if (inputMode.value === 'voice') {
            speakText(responseText);
        }
        
      } catch (mentorError) {
        console.error('Error obteniendo consejo del mentor:', mentorError);
        $q.notify({ 
          type: 'positive', 
          message: 'Nota guardada (Mentor no disponible).',
          icon: 'check_circle'
        });
      }

    } else if (interpretation.intent === 'update_task' || interpretation.intent === 'delete_task') {
      // Lógica de Modificación / Borrado
      const searchTerm = interpretation.data.target_search || interpretation.data.descripcion;
      if (!searchTerm) {
         $q.notify({ type: 'warning', message: 'No sé qué tarea modificar.' });
         return;
      }

      // 1. Intentar resolver por contexto (ordinales)
      const contextTask = resolveTaskFromContext(searchTerm);
      
      if (contextTask) {
          if (interpretation.intent === 'delete_task') {
              await projectStore.deleteTask(contextTask.projectId, contextTask.id);
              $q.notify({ type: 'positive', message: 'Tarea eliminada (por contexto).', icon: 'delete' });
              speakText(`Hecho. He borrado: ${contextTask.desc}`);
              return;
          } else {
              // Update por contexto
              const updates = {};
              if (interpretation.data.descripcion && interpretation.data.descripcion !== searchTerm) updates.descripcion = interpretation.data.descripcion;
              if (interpretation.data.cost) updates.cost = interpretation.data.cost;
              if (interpretation.data.deadline) updates.deadline = interpretation.data.deadline;
              
              await projectStore.updateTask(contextTask.projectId, contextTask.id, updates);
              $q.notify({ type: 'positive', message: 'Tarea actualizada (por contexto).', icon: 'edit' });
              speakText(`Actualizada: ${contextTask.desc}`);
              return;
          }
      }

      if (interpretation.intent === 'delete_task') {
        let deletedCount = 0;
        const lowerSearch = searchTerm.toLowerCase();
        const isDeleteAll = lowerSearch.includes('todas') || lowerSearch.includes('todo') || lowerSearch.includes('all');
        const onlyPending = lowerSearch.includes('pendientes') || lowerSearch.includes('pending');
        const onlyCompleted = lowerSearch.includes('completadas') || lowerSearch.includes('completed') || lowerSearch.includes('hechas') || lowerSearch.includes('listas');
        
        // Iterar sobre todos los proyectos y buscar coincidencias
        for (const p of projectStore.projects) {
            let tasksToDelete = [];
            
            if (isDeleteAll || onlyCompleted) {
                if (onlyPending) {
                    // Borrar todas las pendientes
                    tasksToDelete = p.tasks.filter(t => t.status !== 'completed');
                } else if (onlyCompleted) {
                    // Borrar todas las completadas
                    tasksToDelete = p.tasks.filter(t => t.status === 'completed');
                } else {
                    // Borrar ABSOLUTAMENTE todas
                    tasksToDelete = [...p.tasks];
                }
            } else {
                // Búsqueda normal por coincidencia
                tasksToDelete = p.tasks.filter(t => t.descripcion.toLowerCase().includes(lowerSearch));
            }
            
            for (const task of tasksToDelete) {
                await projectStore.deleteTask(p.id, task.id);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            $q.notify({ type: 'positive', message: `Eliminadas ${deletedCount} tareas.`, icon: 'delete' });
            speakText(`He borrado ${deletedCount} notas relacionadas con ${searchTerm}`);
        } else {
            $q.notify({ type: 'warning', message: `No encontré nada sobre "${searchTerm}" para borrar.` });
        }

      } else {
        // Update task: Manejo de Ambigüedad
        let allMatches = [];

        for (const p of projectStore.projects) {
            const matchesInProject = p.tasks.filter(t => t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
            matchesInProject.forEach(m => allMatches.push({ task: m, projectId: p.id }));
        }

        if (allMatches.length === 0) {
             $q.notify({ type: 'warning', message: `No encontré ninguna tarea sobre "${searchTerm}" para actualizar.` });
             return;
        }

        if (allMatches.length > 1) {
            // Ambigüedad detectada -> Guardar contexto
            pendingAction.value = {
                intent: interpretation.intent, // update_task o delete_task
                data: interpretation.data,
                candidates: allMatches
            };

            const options = allMatches.map((m, i) => `${i + 1}. ${m.task.descripcion}`).slice(0, 3).join(', ');
            const msg = `He encontrado varias: ${options}. ¿Cuál quieres ${interpretation.intent === 'delete_task' ? 'borrar' : 'actualizar'}? (Di "la primera", "la segunda"...)`;
            
            $q.notify({ type: 'warning', message: '¿Cuál de estas?', caption: options, icon: 'help', timeout: 10000 });
            speakText(msg);
            return;
        }

        // Solo una coincidencia: Proceder
        const { task: foundTask, projectId: foundProject } = allMatches[0];
        
        if (interpretation.intent === 'delete_task') {
             await projectStore.deleteTask(foundProject, foundTask.id);
             $q.notify({ type: 'positive', message: 'Tarea eliminada.', icon: 'delete' });
             speakText(`He borrado la tarea: ${foundTask.descripcion}`);
        } else {
             const updates = {};
             if (interpretation.data.descripcion && interpretation.data.descripcion !== searchTerm) updates.descripcion = interpretation.data.descripcion;
             if (interpretation.data.cost) updates.cost = interpretation.data.cost;
             if (interpretation.data.deadline) updates.deadline = interpretation.data.deadline;
             
             await projectStore.updateTask(foundProject, foundTask.id, updates);
             $q.notify({ type: 'positive', message: 'Tarea actualizada.', icon: 'edit' });
             speakText(`He actualizado la tarea.`);
        }
      }

    } else if (interpretation.intent === 'complete_task') {
        // Lógica de Completar Tarea
        const searchTerm = interpretation.data.target_search || interpretation.data.descripcion;
        console.log('[Dashboard] Intentando completar tarea. Búsqueda:', searchTerm);
        
        // 1. Intentar resolver por contexto (ordinales)
        const contextTask = resolveTaskFromContext(searchTerm);
        if (contextTask) {
             await projectStore.updateTask(contextTask.projectId, contextTask.id, { status: 'completed' });
             $q.notify({ type: 'positive', message: 'Tarea completada (por contexto).', icon: 'check_circle' });
             speakText(`Genial. He marcado como completada: ${contextTask.desc}`);
             return;
        }

        let allMatches = [];
        const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'y', 'o', 'en', 'con', 'por', 'para', 'que', 'qué', 'he', 'ya', 'mi', 'mis', 'tu', 'tus'];
        const searchWords = searchTerm.toLowerCase()
            .split(' ')
            .filter(w => w.length > 1 && !stopWords.includes(w));
            
        console.log('[Dashboard] Palabras clave depuradas:', searchWords);

        for (const p of projectStore.projects) {
            // Buscar solo tareas pendientes
            const matchesInProject = p.tasks.filter(t => {
                if (t.status === 'completed') return false;
                const descLower = t.descripcion.toLowerCase();
                
                // 1. Coincidencia exacta (substring)
                if (descLower.includes(searchTerm.toLowerCase())) return true;

                // 2. Coincidencia por palabras clave (Fuzzy simple)
                // Si todas las palabras significativas de la búsqueda están en la descripción
                const allWordsFound = searchWords.every(word => descLower.includes(word));
                return allWordsFound;
            });
            matchesInProject.forEach(m => allMatches.push({ task: m, projectId: p.id }));
        }
        
        console.log('[Dashboard] Coincidencias encontradas:', allMatches.length, allMatches);

        if (allMatches.length === 0) {
             $q.notify({ type: 'warning', message: `No encontré ninguna tarea pendiente sobre "${searchTerm}".` });
             return;
        }

        if (allMatches.length > 1) {
            pendingAction.value = {
                intent: 'complete_task',
                data: interpretation.data,
                candidates: allMatches
            };

            const options = allMatches.map((m, i) => `${i + 1}. ${m.task.descripcion}`).slice(0, 3).join(', ');
            const msg = `Hay varias opciones: ${options}. ¿Cuál has terminado? (Di "la primera", "la segunda"...)`;
            
            $q.notify({ type: 'warning', message: '¿Cuál completaste?', caption: options, icon: 'help', timeout: 10000 });
            speakText(msg);
            return;
        }

        const { task: foundTask, projectId: foundProject } = allMatches[0];
        await projectStore.updateTask(foundProject, foundTask.id, { status: 'completed' });
        
        $q.notify({ type: 'positive', message: '¡Tarea completada!', icon: 'check_circle' });
        speakText(`Genial. He marcado como completada la tarea: ${foundTask.descripcion}`);

    } else if (interpretation.intent === 'query') {
      // 1. Recopilar Contexto de Datos (SOLO PENDIENTES para ahorrar tokens)
      const allTasks = [];
      projectStore.projects.forEach(p => {
        // Incluimos TODAS las tareas (pendientes y completadas) para que la IA sepa lo gastado
        const projectTasks = p.tasks;
        
        projectTasks.forEach(t => {
            allTasks.push({
                id: t.id,
                projectId: p.id,
                desc: t.descripcion,
                status: t.status,
                cost: t.cost || 0,
                date: t.createdAt,
                deadline: t.deadline
            });
        });
      });

      // Guardar contexto para futuras referencias (ej: "borra la primera")
      lastQueryResults.value = allTasks.slice(0, 10);
      const contextSummary = JSON.stringify(allTasks.map(t => ({ desc: t.desc, status: t.status, cost: t.cost, date: t.date })));

      // 2. Preguntar a la IA con el contexto
      $q.notify({ type: 'ongoing', message: 'Consultando tus datos...', timeout: 1500 });

      const activeMentor = getMentorById(settingsStore.activeMentorId);
      
      const queryPrompt = `
        Datos del usuario (JSON): ${contextSummary}
        
        Pregunta del usuario: "${interpretation.data.descripcion}"
        
        Instrucción: Responde a la pregunta basándote ESTRICTAMENTE en los datos proporcionados. 
        - Si preguntan "¿Qué tareas...?" o "Dime las tareas...", LISTA las tareas resumidamente (máximo 10).
        - Si preguntan "¿Cuántas...?", entonces solo da el número total.
        - Si preguntan por gastos, suma los costos.
        Responde con la personalidad de ${activeMentor.name}. Sé breve pero útil.
      `;

      try {
        const responseText = await consultMentor('Eres un asistente analítico que responde preguntas sobre los datos del usuario.', queryPrompt);
        console.log('[Mentor] 💡 Respuesta Final:', responseText);
        
        if (inputMode.value === 'voice') {
            speakText(responseText);
        }

      } catch (e) {
        console.error(e);
        $q.notify({ type: 'negative', message: 'No pude analizar los datos.' });
      }

    } else {
      $q.notify({ type: 'warning', message: 'Intención no reconocida' });
    }
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Error al guardar nota' });
  }
}

onMounted(async () => {
  await projectStore.loadProjects();
});
</script>
