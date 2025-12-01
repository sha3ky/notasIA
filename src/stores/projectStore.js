import { defineStore } from 'pinia';
import { projectsDB } from '../services/db';
import { uid } from 'quasar';

export const useProjectStore = defineStore('projects', {
    state: () => ({
        projects: [],
        loading: false
    }),

    getters: {
        getProjectById: (state) => (id) => {
            return state.projects.find(p => p.id === id);
        },
        activeProjects: (state) => state.projects.filter(p => p.status !== 'completed'),
        upcomingDeadlines: (state) => {
            // Lógica simple para ordenar por fecha
            return [...state.projects]
                .filter(p => p.deadline)
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        }
    },

    actions: {
        async loadProjects() {
            this.loading = true;
            try {
                const keys = await projectsDB.keys();
                const loadedProjects = [];
                for (const key of keys) {
                    const project = await projectsDB.getItem(key);
                    loadedProjects.push(project);
                }
                this.projects = loadedProjects;
            } catch (error) {
                console.error('Error loading projects:', error);
            } finally {
                this.loading = false;
            }
        },

        async addProject(projectData) {
            const newProject = {
                id: uid(),
                status: 'in_progress',
                tasks: [],
                createdAt: new Date().toISOString(),
                ...projectData
            };

            this.projects.push(newProject);
            await projectsDB.setItem(newProject.id, newProject);
            return newProject;
        },

        async updateProject(id, updates) {
            const index = this.projects.findIndex(p => p.id === id);
            if (index !== -1) {
                this.projects[index] = { ...this.projects[index], ...updates };
                await projectsDB.setItem(id, this.projects[index]);
            }
        },

        async addTask(projectId, taskData) {
            const project = this.getProjectById(projectId);
            if (project) {
                const newTask = {
                    id: uid(),
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    ...taskData
                };
                project.tasks.push(newTask);
                await this.updateProject(projectId, { tasks: project.tasks });
            }
        },

        async updateTask(projectId, taskId, updates) {
            const project = this.getProjectById(projectId);
            if (project) {
                const taskIndex = project.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    project.tasks[taskIndex] = { ...project.tasks[taskIndex], ...updates };
                    await this.updateProject(projectId, { tasks: project.tasks });
                }
            }
        }
    }
});
