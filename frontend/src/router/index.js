import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import LoginView from '../views/LoginView.vue'
import AddIngredient from '../views/AddIngredient.vue'
import AddMeal from '../views/AddMeal.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    component: LoginView
  },
  {
    path: '/add-ingredient',
    component: AddIngredient
  },
  {
    path: '/add-meal',
    component: AddMeal
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router