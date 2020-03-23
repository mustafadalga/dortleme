import Vue from 'vue'
import App from './App.vue'
import VueSessionStorage from 'vue-sessionstorage'
import Notifications from 'vue-notification'
Vue.use(VueSessionStorage)
Vue.use(Notifications)

import router from './router'


import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false
Vue.prototype.notificationIdList = []
Vue.prototype.notificationCount = 0
Vue.prototype.currentUser = {}


new Vue({
    router,
    render: function(h) { return h(App) }
}).$mount('#app')