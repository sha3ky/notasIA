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
        <div class="tasks-container">
            <div 
                v-for="task in getTasksForDate(date.date)" 
                :key="task.id"
                class="task-chip q-mb-xs"
                :class="task.status === 'completed' ? 'bg-green-9' : 'bg-cyan-9'"
                @click="openTaskDetail(task)"
            >
                {{ task.descripcion }}
            </div>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProjectStore } from 'stores/projectStore';
import { date } from 'quasar';

const projectStore = useProjectStore();

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
  const tasks = [];
  
  projectStore.projects.forEach(p => {
    p.tasks.forEach(t => {
      if (t.deadline === dateStr) {
        tasks.push({ ...t, projectId: p.id });
      }
    });
  });
  
  return tasks;
}

function openTaskDetail(task) {
    // TODO: Implementar modal de detalle o navegación
    console.log('Task clicked:', task);
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
