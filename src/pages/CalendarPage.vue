<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h4 text-neon">Calendario</div>
      <q-space />
      <q-btn flat round icon="chevron_left" @click="prevMonth" color="cyan-13" />
      <div class="text-h6 q-mx-md text-white">{{ currentMonthName }} {{ currentYear }}</div>
      <q-btn flat round icon="chevron_right" @click="nextMonth" color="cyan-13" />
      <q-btn flat round icon="today" @click="goToToday" color="white" class="q-ml-sm" />
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid glass-panel">
      <!-- Weekday Headers -->
      <div v-for="day in weekDays" :key="day" class="calendar-header text-center text-grey-5 q-py-sm">
        {{ day }}
      </div>

      <!-- Days -->
      <div 
        v-for="(date, index) in calendarDays" 
        :key="index"
        class="calendar-day q-pa-xs relative-position"
        :class="{ 
          'is-today': isToday(date.date),
          'is-other-month': !date.isCurrentMonth
        }"
      >
        <div class="text-right text-caption q-mr-xs" :class="isToday(date.date) ? 'text-neon text-weight-bold' : 'text-grey-5'">
          {{ date.day }}
        </div>

        <!-- Tasks for this day -->
        <!-- Tasks for this day -->
        <div class="tasks-container" @click.stop="openDayDetail(date.date)">
            <div 
                v-for="item in getTasksForDate(date.date).slice(0, 3)" 
                :key="item.id"
                class="task-chip q-mb-xs"
                :class="item.status === 'completed' ? 'bg-green-9' : (item.type === 'project' ? 'bg-purple-9' : 'bg-cyan-9')"
                @click.stop="openTaskDetail(item)"
            >
                {{ item.displayName }} {{ item.status === 'completed' ? '*' : '' }}
            </div>
            
            <!-- Indicador de más items -->
            <div v-if="getTasksForDate(date.date).length > 3" class="text-caption text-grey-5 text-center" style="font-size: 0.7em">
                +{{ getTasksForDate(date.date).length - 3 }} más
            </div>
        </div>
      </div>
    </div>

    <!-- Dialogo Detalle Día -->
    <q-dialog v-model="showDayDialog">
      <q-card class="glass-card" style="min-width: 350px">
        <q-card-section>
          <div class="text-h6 text-white">Tareas del {{ selectedDateStr }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list separator>
            <q-item 
                v-for="item in selectedDayItems" 
                :key="item.id" 
                clickable 
                v-ripple
                @click="openTaskDetail(item)"
            >
                <q-item-section>
                    <q-item-label :class="item.status === 'completed' ? 'text-green-4' : 'text-white'">
                        {{ item.displayName }}
                    </q-item-label>
                    <q-item-label caption class="text-grey-5">
                        {{ item.type === 'project' ? 'Proyecto' : 'Tarea' }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-icon name="chevron_right" color="grey" />
                </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="white" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProjectStore } from 'stores/projectStore';
import { date } from 'quasar';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const router = useRouter();

const currentDate = ref(new Date());
const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleString('es-ES', { month: 'long' });
});

const currentYear = computed(() => {
  return currentDate.value.getFullYear();
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days = [];
  
  // Previous month padding
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ day: d.getDate(), date: d, isCurrentMonth: false });
  }
  
  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({ day: i, date: d, isCurrentMonth: true });
  }
  
  // Next month padding (to fill 6 rows of 7 = 42 cells grid usually)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ day: i, date: d, isCurrentMonth: false });
  }
  
  return days;
});

function isToday(d) {
  const today = new Date();
  return d.getDate() === today.getDate() && 
         d.getMonth() === today.getMonth() && 
         d.getFullYear() === today.getFullYear();
}

function prevMonth() {
  currentDate.value = date.addToDate(currentDate.value, { month: -1 });
}

function nextMonth() {
  currentDate.value = date.addToDate(currentDate.value, { month: 1 });
}

function goToToday() {
  currentDate.value = new Date();
}

function getTasksForDate(d) {
  const dateStr = date.formatDate(d, 'YYYY-MM-DD');
  const items = [];
  
  projectStore.projects.forEach(p => {
    // 1. Añadir Tareas
    p.tasks.forEach(t => {
      if (t.deadline === dateStr) {
        items.push({ 
            ...t, 
            projectId: p.id,
            type: 'task',
            displayName: t.descripcion 
        });
      }
    });

    // 2. Añadir Proyecto (si vence hoy o se creó hoy y no tiene vencimiento)
    const projectDate = p.deadline || (p.createdAt ? p.createdAt.split('T')[0] : null);
    
    if (projectDate === dateStr) {
        items.push({
            ...p,
            type: 'project',
            displayName: `[P] ${p.nombre}`, // Prefijo [P] para distinguir
            status: p.status // 'completed' o 'in_progress'
        });
    }
  });
  
  return items;
}

const showDayDialog = ref(false);
const selectedDateStr = ref('');
const selectedDayItems = ref([]);

function openDayDetail(d) {
    const items = getTasksForDate(d);
    if (items.length > 0) {
        selectedDateStr.value = date.formatDate(d, 'DD/MM/YYYY');
        selectedDayItems.value = items;
        showDayDialog.value = true;
    }
}

function openTaskDetail(task) {
    // Si es proyecto, ir a su detalle
    if (task.type === 'project') {
        router.push(`/projects/${task.id}`);
    } else {
        // Si es tarea, ir al proyecto padre
        router.push(`/projects/${task.projectId}`);
    }
}

onMounted(() => {
    projectStore.loadProjects();
});
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.calendar-header {
  background: rgba(0, 0, 0, 0.3);
  font-weight: bold;
}

.calendar-day {
  background: rgba(18, 18, 18, 0.8); /* Dark background for cells */
  min-height: 100px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.3s;
}

.calendar-day:hover {
  background: rgba(255, 255, 255, 0.05);
}

.is-other-month {
  opacity: 0.3;
  background: rgba(0, 0, 0, 0.5);
}

.is-today {
  background: rgba(0, 243, 255, 0.05);
  border: 1px solid rgba(0, 243, 255, 0.3);
}

.task-chip {
  font-size: 0.7rem;
  padding: 2px 4px;
  border-radius: 4px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
</style>
