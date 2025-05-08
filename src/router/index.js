import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/Home.vue'
import ProfilesPage from '../pages/Profiles.vue'
import IsolationPage from '../pages/Isolation.vue'
import Monitoring from '../pages/Monitoring.vue'


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
    path: '/monitoring',
    name: 'Monitoring',
    component: Monitoring,
    meta: { requiresAdmin: true } // Optional: Add admin check middleware
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
