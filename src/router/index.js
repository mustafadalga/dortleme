import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Game from '../views/Game.vue'
import Login from '../views/auth/Login.vue'
import Signup from '../views/auth/Signup.vue'
import ResetPassword from '../views/auth/ResetPassword.vue'
import Notifications from '../views/Notifications.vue'
import NotFound from '../components/404.vue'
import Ratings from '../views/Ratings.vue'
import db from '@/firebase/init'

Vue.use(VueRouter)

const routes = [{
        path: '/',
        name: 'Home',
        component: Home,
        meta: {
            requiresAuth: true
        }
    }, {
        path: '/game',
        name: 'Game',
        component: Game,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/signup',
        name: 'Signup',
        component: Signup
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: ResetPassword
    },
    {
        path: '/notifications',
        name: 'Notifications',
        component: Notifications,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/ratings',
        name: 'Ratings',
        component: Ratings,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '*',
        name: 'NotFound',
        component: NotFound,

    },
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
})


router.beforeEach((to, from, next) => {
    if (to.matched.some(rec => rec.meta.requiresAuth)) {

        if (Vue.prototype.$session.exists('user')) {


            if (to.name == "Game") {
                let gameNo = Vue.prototype.$session.get('gameNo');

                if (gameNo) {
                    let ref = db.collection("game_rooms").doc(gameNo);
                    ref.get().then(doc => {
                        if (doc.id == gameNo) {
                            next()
                        }
                    })
                } else {
                    next({ name: 'Home' })
                }

            } else {
                next()
            }
        } else {
            next({ name: 'Login' })
        }
    } else {
        if (Vue.prototype.$session.exists('user')) {

            if (to.name == "Login" || to.name == "Signup") {
                next({ name: 'Home' })
            }
        }
        next()
    }
})

export default router