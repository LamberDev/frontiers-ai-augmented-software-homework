import { createRouter, createWebHistory } from 'vue-router'
import { RegisterUserPage } from '@/pages/register-user'
import { InviteReviewerPage } from '@/pages/invite-reviewer'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/register' },
    { path: '/register', name: 'register-user', component: RegisterUserPage },
    { path: '/invite', name: 'invite-reviewer', component: InviteReviewerPage },
  ],
})
