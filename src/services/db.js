import localforage from 'localforage';

localforage.config({
    driver: localforage.INDEXEDDB,
    name: 'AyudanteIA',
    version: 1.0,
    storeName: 'keyvaluepairs',
    description: 'Base de datos local para AyudanteIA'
});

export const projectsDB = localforage.createInstance({
    name: 'AyudanteIA',
    storeName: 'projects'
});

export const inventoryDB = localforage.createInstance({
    name: 'AyudanteIA',
    storeName: 'inventory'
});

export const settingsDB = localforage.createInstance({
    name: 'AyudanteIA',
    storeName: 'settings'
});

export default localforage;
