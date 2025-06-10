import Vue from 'vue'
import VueRouter from 'vue-router'
import TrackerPage from '../views/TrackerPage.vue'
import OverviewPage from '../views/OverviewPage.vue'
import AddPlantPage from '../views/AddPlantPage.vue' // <<< ADD THIS LINE
import AddSupplementPage from '../views/AddSupplementPage.vue' // <<< ADD THIS LINE

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Tracker',
    component: TrackerPage
  },
  {
    path: '/overview',
    name: 'Overview',
    component: OverviewPage
  },
  { // <<< ADD THIS ROUTE
    path: '/add-plant',
    name: 'AddPlant',
    component: AddPlantPage
  },
  { // <<< ADD THIS ROUTE
    path: '/add-supplement',
    name: 'AddSupplement',
    component: AddSupplementPage
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router