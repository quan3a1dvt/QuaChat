import RoomLayout from '../layouts/RoomLayout.vue'
import LoginLayout from '../layouts/LoginLayout.vue'
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      
      { path: '', component: () => import('pages/IndexPage.vue') }
      
    ]
  },
  {
    path: '/:id',
    name: 'RoomLayout',
    props: true,
    component: RoomLayout
  },
  // {
  //   path: '/room',
  //   name: 'RoomLayout',
  //   props: true,
  //   component: RoomLayout
  // },
  {
    path: '/login',
    name: 'LoginLayout',
    props: true,
    component: LoginLayout
  },
  // Always leave this as last one,
  // but you can also remove it
  // {
  //   path: '/:catchAll(.*)*',
  //   component: () => import('pages/ErrorNotFound.vue')
  // }
]

export default routes
