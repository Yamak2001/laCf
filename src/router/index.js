// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/Home.vue'
import ProfilesPage from '../pages/Profiles.vue'
import IsolationPage from '../pages/Isolation.vue'
import ModelsPage from '../pages/Models.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/profiles',
    name: 'Profiles',
    component: ProfilesPage
  },
  {
    path: '/isolation',
    name: 'Isolation',
    component: IsolationPage
  },
  {
    path: '/models',
    name: 'Models',
    component: ModelsPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router