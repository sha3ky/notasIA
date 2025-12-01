<template>
  <q-layout view="lHh Lpr lFf" class="bg-dark">
    <q-header elevated class="glass-panel text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title class="text-weight-light text-h6">
          Ayudante <span class="text-neon text-weight-bold">IA</span>
        </q-toolbar-title>

        <q-btn-dropdown flat no-caps :label="currentMentor?.name || 'Mentor'" content-class="glass-panel">
          <template v-slot:icon>
            <q-avatar size="28px" class="q-mr-sm" style="border: 2px solid #00f3ff">
              {{ currentMentor?.icon }}
            </q-avatar>
          </template>
          
          <q-list class="bg-transparent text-white">
            <q-item 
              v-for="mentor in mentors" 
              :key="mentor.id" 
              clickable 
              v-close-popup 
              @click="setMentor(mentor.id)"
              :active="mentor.id === settingsStore.activeMentorId"
              active-class="text-neon bg-white-1"
            >
              <q-item-section avatar>
                <q-avatar size="sm" color="primary" text-color="white">{{ mentor.icon }}</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ mentor.name }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="glass-panel text-white"
      :width="240"
    >
      <q-list padding>
        <q-item-label header class="text-grey-5">
          Navegación
        </q-item-label>

        <q-item clickable to="/" exact active-class="text-neon bg-white-1" class="q-mb-sm" style="border-radius: 0 32px 32px 0">
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Dashboard</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/projects" active-class="text-neon bg-white-1" class="q-mb-sm" style="border-radius: 0 32px 32px 0">
          <q-item-section avatar>
            <q-icon name="folder" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Proyectos</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/inventory" active-class="text-neon bg-white-1" class="q-mb-sm" style="border-radius: 0 32px 32px 0">
          <q-item-section avatar>
            <q-icon name="inventory_2" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Inventario</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/calendar" active-class="text-neon bg-white-1" class="q-mb-sm" style="border-radius: 0 32px 32px 0">
          <q-item-section avatar>
            <q-icon name="calendar_month" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Calendario</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md bg-grey-8" />

        <q-item clickable to="/settings" active-class="text-neon bg-white-1" style="border-radius: 0 32px 32px 0">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Configuración</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from 'stores/settingsStore'
import { MENTORS, getMentorById } from '../constants/mentors'

const leftDrawerOpen = ref(false)
const settingsStore = useSettingsStore()

const mentors = MENTORS
const currentMentor = computed(() => getMentorById(settingsStore.activeMentorId))

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function setMentor(id) {
  settingsStore.setActiveMentor(id)
}

onMounted(() => {
  settingsStore.loadSettings()
})
</script>
