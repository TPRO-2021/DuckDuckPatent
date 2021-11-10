import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Search from '@/views/Search.vue';
const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Search',
        component: Search,
    },
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
    },
    {
        path: '/search',
        name: 'Result',
        component: () => import(/* webpackChunkName: "search" */ '@/views/Results.vue'),
        props: true,
    },
    {
        path: '/saved',
        name: 'Saved',
        component: () => import(/* webpackChunkName: "saved" */ '@/views/SavedResult.vue'),
        props: true,
    },
    {
        path: '/document',
        name: 'Document',
        component: () => import(/* webpackChunkName: "document" */ '@/views/Document.vue'),
        props: true,
    },
    {
        path: '/explore',
        name: 'Exploration',
        component: () => import(/* webpackChunkName: "explore" */ '@/views/Exploration.vue'),
        props: true,
    },
    {
        path: '/patent',
        name: 'Patent',
        component: () => import(/* webpackChunkName: "patent" */ '@/views/Patent.vue'),
        props: true,
    },
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

export default router;
