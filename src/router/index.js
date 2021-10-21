import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [{
    path: "/",
    name: "Home",
    component: () => {
        return import ("../views/Home.vue");
    },
}, ];

const router = new VueRouter({
    routes,
});

export default router;