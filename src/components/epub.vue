<template>
   <div id="epub">
    <div class="header">
        <a >Flipped Reader</a>
        <a  id="title">《{{title}}》</a>
        <div class="tool-box">
            <button id="showcatalog" @click="showCatalog">目录</button>
            <button id="fontsize" @click="fontSize--">字体变小</button>
            <button id="fontsize" @click="fontSize++">字体变大</button>
            <button id="changethemes" @click="changeTheme()">开关灯</button>
            <button id="changeMethod" @click="changeMethod">翻页/滚动</button>
        </div>
    </div>
    <main>
        <div id="left-slide" v-show="this.catalog" >
            <h4>目录</h4>
            <ul id="catalogs">
              <li class="chapter" v-for="(item,index) in catalogs" :hrefs="item.href" :key="index" @click="jumpTo">
              {{item.title}}
              </li>
              
            </ul>
        </div>
        <div id="main-content">
            <div id="bookHere">
              
              
              
              <div id="percentage" v-show="bookAvailable">{{(percentage*100).toFixed(2)}}%</div>
              <div id="book-leaf" @click="saveLeaf()">
                <div class="tria"></div>
              </div>
              <div id="pre" @click="prePage()"></div>
              <div id="next"></div>
            </div>
        </div>
    </main>

   </div>
</template>

<script>
import "jszip";
import ePub from 'epubjs'
export default {
    name:'EpubView',
    data(){
      return {
        location:{percentageFromCfi(){
          return '...'
        }},
        catalogs:[],
        catalog:false,
        title:'',
        book:{},
        flippedBD:{db:{},storeName:'bookArrayBuffer',dbName:'flippedDB'},
        rendition:{},
        percentage:0,
        id:0,
        themes:{fontSize(){return 0}},
        fontSize:16,
        day:true,
        method:"paginated",
        bookAvailable:false,
        cfi:null,
      }
    },
    computed:{
    
    
  },
    watch: {
      fontSize: function(n){
        
        this.themes.fontSize(n+'px');
        
      },
      
    },
    
    methods:{
      changeMethod(){
        this.method = this.method==='paginated'?'scrolled-doc':"paginated"
        localStorage.setItem(this.id,JSON.stringify({percentage:this.percentage,font:this.fontSize,method:this.method}))
        location.reload()
      },
      changeTheme(){
        var tria = document.querySelector('.tria')
        var bookHere = document.getElementById('bookHere')
        var maincontant = document.getElementById("main-content")
        
        if(this.day){
        
        this.themes.update('night')
        bookHere.style.backgroundColor='#0f1112'
        bookHere.style.color='#666'
        maincontant.style.backgroundColor='#0f1112'
        tria.style['border-left'] = '10px solid #0f1112'
        }
        else{
          
          this.themes.update('day')
          bookHere.style.backgroundColor='rgb(246, 241, 231)'
          bookHere.style.color='#262626'
          maincontant.style.backgroundColor='#ede7da'
          tria.style['border-left'] = '10px solid #ede7da'
        }
        this.day=!this.day
        
      },
     async jumpTo(e){
     await this.rendition.display(e.target.getAttribute("hrefs").replace("http://localhost:8080/",'')).then(()=>{
      this.percentage = this.location.percentageFromCfi(this.rendition.currentLocation().start.cfi)
     })
      
    },
      bindMove(){
        var that = this
       var box = document.getElementById('next')
       
       var y = 0
       
       var t = 0
       var isDown = false
        var ismove=false
        
       box.onmousedown = function(e){
        y = e.clientY;
        t = box.offsetTop
        isDown = true
        box.style.cursor = 'pointer'
        
       }
        box.onmousemove = function(e){
          
          if(isDown == false){
            return;
          }
          var ny = e.clientY;
          if(Math.abs(ny-y)>3)ismove=true
          box.style.top=t+ny-y+'px'
          
        }
        box.onmouseup = function(){
          isDown = false;
          box.style.cursor = 'default'
          if(ismove){ismove=false}
          else{
            that.nextPage()
            
          }
        }
      },
      async prePage(){
        if(this.rendition){
         await this.rendition.prev().then(()=>{
          this.percentage = this.location.percentageFromCfi(this.rendition.currentLocation().start.cfi)
         })
          
        }
      },
     async nextPage(){
        var that = this
        if(that.rendition){
         await that.rendition.next().then(()=>{
          that.percentage = that.location.percentageFromCfi(that.rendition.currentLocation().start.cfi)
         })
          
          
          // that.rendition.currentLocation().start.cfi
        }
      },
      saveLeaf(){
        if(this.bookAvailable)
         {localStorage.setItem(this.id,JSON.stringify({cfi:this.rendition.currentLocation().start.cfi,font:this.fontSize,method:this.method,percentage:this.percentage}))}
         else{
          return 0
         }
      },
      showCatalog(){
        this.catalog=!this.catalog
      },
      initBook(){
       
      },
      read(db){         //根据主键读取数据，将read改为delete则为删除数据
            var that = this
            var request = db.transaction([that.flippedBD.storeName],'readwrite').objectStore(that.flippedBD.storeName).get(that.id)
            
            
            request.onerror = function(){
                console.log('读取失败')
            }
            request.onsuccess = async  function(){
                
                if(request.result){
                  that.id = request.result.id
                  that.title = request.result.title
                  that.book = ePub(request.result.data)
                    
                   that.rendition = that.book.renderTo('bookHere',{
                    flow: that.method,
                      width:'100%',
                      height:'700px',

                    })
                    that.themes=that.rendition.themes
                    that.themes.register({"night":{body:{"background-color":"#0f1112","color":"#666"}},"day":{body:{"background-color":"rgb(246, 241, 231)","color":"#262626"}}})
                    that.themes.fontSize(that.fontSize+'px');
                    // that.cfi = that.rendition.currentLocation().start.cfi
                    if(localStorage.getItem(that.id)){
                  
                    that.rendition.display(that.cfi)
                   
                  }
                  else{
                    that.rendition.display()
                  }
                 await that.book.ready.then(()=>{
                    var catalog = that.book.navigation.toc
                    console.log(catalog)
                    for(let item of catalog){
                      that.catalogs.push({title:item.label,href:item.href})
                    }
                    return that.book.locations.generate()
                  }).then(()=>{
                    that.location = that.book.locations
                    that.bookAvailable = true
                    that.cfi = that.rendition.currentLocation().start.cfi
                  })
                  
              
                }
                else{
                    console.log('读取完毕')
                }
            }
        },
        init(){
          this.id = this.$route.query.uid
          if(localStorage.getItem(this.id)){
            this.method = JSON.parse(localStorage.getItem(this.id)).method
            this.cfi = JSON.parse(localStorage.getItem(this.id)).cfi
            this.fontSize = JSON.parse(localStorage.getItem(this.id)).font
          }
        },
      initDB(callback){
      var that = this
      var indexedDB = window.indexedDB
      // let db
      
      const request = indexedDB.open(that.flippedBD.dbName,1)
      request.onsuccess = function(e){
        that.flippedBD.db = e.target.result
        console.log('数据库打开成功')
        callback(that.flippedBD.db)
      }
      request.onerror = function(){
        console.log('数据库打开失败')
      }
      request.onupgradeneeded = function(e){
        
        that.flippedBD.db = e.target.result
        
        if(!that.flippedBD.db.objectStoreNames.contains(that.flippedBD.storeName)){
          that.flippedBD.db.createObjectStore(that.flippedBD.storeName,{keyPath:'id'})
        }
      }
    
    },
    },
    mounted(){
      this.init()
      this.initDB(this.read);
      this.bindMove()
    }
}

</script>


<style>
::-webkit-scrollbar{
  display:none;
}
#title{
  color: #262626;
}
.header{
  height: 64px;
  padding:12px;
  box-sizing: border-box;
  border-bottom: 1px solid #ccc;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
}
.header a{
  line-height: 40px;
  color: #42b983;
  font-weight: 700;
  margin-left: 30px;
}
.header .tool-box{
  display: flex;
}
.header .tool-box > button {
  display:inline-block;
  border: none;
  padding: 10px;
  color:#42b983;
  background-color: #fff;
  margin-left: 20px;
  font-size:16px;
  font-weight: 700;
  cursor: pointer;
}


#left-slide{
    width: 250px;
    float: left;
    box-sizing: border-box;
    border-right: 1px solid #d8d8d8;
    height: 791px;
    overflow: hidden;
}
#left-slide>h4{
  background-color: #42b983;
  margin: 0;
  line-height: 50px;
  padding-left: 20px;
}
#left-slide #catalogs{
  height: 791px;
  color: #262626;
  padding: 0 10px;
  overflow-y:auto;
  overflow-x:hidden;
  background-color: rgb(246, 241, 231);
  
}
#left-slide #catalogs .chapter:hover{
  color: #42b983;
  opacity: .7;
  transition: all .3s;
}
#left-slide #catalogs .chapter{
  height: 40px;
  line-height: 40px;
  border-bottom: 1px solid #e1e6f0;
  background-color: rgb(246, 241, 231);
 text-overflow: ellipsis;
 white-space: nowrap;
 cursor: pointer;
 font-weight: 400;
 font-size: 14px;
}
#main-content{
    overflow: hidden;
    background-color: #ede7da;
}

#bookHere{
    position: relative;
    width: 980px;
    margin: 0 auto;
    background-color: rgb(246, 241, 231);
    height: 710px;
    border-left: 1px solid #d8d8d8;
    border-right: 1px solid #d8d8d8;
    border-bottom: 1px solid #d8d8d8;
    margin-bottom: 30px;
    margin-top: 50px;
    user-select: none;
    font-size: 18px;
    
}

#bookHere #pre{
  left:0;
  
  width: 128px;
  height:128px;
  position: absolute;
  left:-138px;
  bottom:0px;
  background-image:url(../assets/pre.png) ;
  cursor: pointer;
  
}

#bookHere #next{
  position: absolute;
  right:-138px;
  width: 128px;
  height: 128px;
  top:50%;
  background-image: url(../assets/next.png);
  
}
#bookHere #next:hover{
  cursor: pointer;
}
#bookHere #percentage{
  position: absolute;
  bottom: 0;
  right: 0;
  transform: translateX(100%);
  z-index: 2;
  
}
#bookHere #book-leaf{
  height: 20px;
  width: 80px;
  transform: translate(-100%,100%);
  background-color: #42b983;
}
#bookHere #book-leaf .tria{
  float: left;
  height: 0;
  width:0;
  border: 10px solid transparent;
  border-left:10px solid #ede7da;
}

#bookHere #book-leaf:hover{
  cursor: pointer;
  transform: translate(-80%,100%);
}
</style>