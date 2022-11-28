import VueRouter from 'vue-router'
import IndexView from '../components/index.vue'
import EpubView from '../components/epub.vue'

export default new VueRouter({
    
    routes:[
        {
            path:'/',
            component:IndexView
        },
        {
            path:'/read',
            component:EpubView
        }
    ]
})