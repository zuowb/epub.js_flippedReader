<template>
    <div id="index">
        <div class="header">
      <a >Flipped Reader</a>
    </div>
    <main>
      <div class="book-roof">
        <img src="../assets/book.png" alt="book">
        <span>书架</span>
      </div>
      <ul class="book-list" >
        <li class="book-item" v-for="(value,key) in books" :key=key>
          <h5>{{value.percentage}}</h5> 
          
            <div class="book-main">
              <div id="deletebook"  @click="deleteBook(key)">X</div>
              <a href="#read" style="display:block;" @click.prevent="readHere(key)">
              <img class="book-main" :src="value.cover"> 
              </a>
            </div>
          
        
          <h4 id="title" >{{value.title}}</h4>
          
          
          
        </li>
        
        <li class="book-item">
          <h4>点击添加书籍</h4>
           <div class="book-add-main">
            <input type="file" id="addBook" accept=".epub" @change="getBook()">
              <label class="book-add" for="addBook">
                </label>
          </div>
          
          <p>书籍将被保存在浏览器缓存中</p>
        </li>
        
      </ul>
    </main>
    </div>
</template>

<script>
import {nanoid} from 'nanoid'
import ePub from 'epubjs'

export default{
    name:'IndexView',
    data(){
    return {
        books:{},
        flippedBD:{db:{},storeName:'bookArrayBuffer',dbName:'flippedDB'},
    }
  },
  mounted(){
    this.initDB(this.readAll);
    
    
  },
  methods:{
   
    readHere(key){
    
    this.$router.push('/read?uid='+key)
    },
    initDB(callback){
      
      var that = this
      var indexedDB = window.indexedDB
      // let db
      
      const request = indexedDB.open(that.flippedBD.dbName,1)
      request.onsuccess = function(e){
        that.flippedBD.db = e.target.result
        console.log('本地数据库打开成功')
        callback(that.flippedBD.db)
      }
      
      request.onerror = function(){
        console.log('本地数据库打开失败')
      }
      request.onupgradeneeded = function(e){
        
        that.flippedBD.db = e.target.result
        
        if(!that.flippedBD.db.objectStoreNames.contains(that.flippedBD.storeName)){
          that.flippedBD.db.createObjectStore(that.flippedBD.storeName,{keyPath:'id'})
        }
      }
    },
    add(id,title,data){              //根据主键添加数据，不允许重复，将add改为put则是添加数据
            var request = this.flippedBD.db.transaction([this.flippedBD.storeName],'readwrite')
            .objectStore(this.flippedBD.storeName)
            .add({id:id,title:title,data:data})
            request.onsuccess = function(){
                console.log('数据写入成功')
            }
            request.onerror = function(){
                console.log('数据写入失败')
            }
        },
      read(index){         //根据主键读取数据，将read改为delete则为删除数据
            var request = this.flippedBD.db.transaction([this.flippedBD.storeName],'readwrite').objectStore(this.flippedBD.storeName).get(index)
            
            request.onerror = function(){
                console.log('读取失败')
            }
            request.onsuccess = function(){
                
                if(request.result){
                    console.log('data: '+request.result.data)
                }
                else{
                    console.log('未获得数据记录')
                }
            }
        },
        readAll(db){
            var that = this
            var objectStore = db.transaction(this.flippedBD.storeName).objectStore(this.flippedBD.storeName);
            objectStore.openCursor().onsuccess = function(event){
                
                var cursor = event.target.result;
                if(cursor){
                    
                    that.$set(that.books,cursor.key,{})
                    if(localStorage.getItem(cursor.key)){
                      
                      that.$set(that.books[cursor.key],'percentage',(JSON.parse(localStorage.getItem(cursor.key)).percentage*100).toFixed(2)+'%')
                    }
                    else{
                      
                      that.$set(that.books[cursor.key],'percentage','新添加')
                    }
                    that.initBook(cursor.value.data,cursor.key)
                    cursor.continue();
                }
                else{
                    console.log('读取完毕')
                }
            }
        },
        deleteBook(uid){
          localStorage.removeItem(uid)
          var request = this.flippedBD.db.transaction([this.flippedBD.storeName],'readwrite').objectStore(this.flippedBD.storeName).delete(uid)
            var that = this
            request.onerror = function(){
                console.log('删除失败')
            }
            request.onsuccess = function(){
              console.log('删除成功')
              that.$delete(that.books,uid)
            }
        },
     getBook(){
      
      let uid = nanoid()
      
      let that = this
      that.$set(that.books,uid,{})
      
      var target = document.getElementById('addBook').files[0]
      
      var reader = new FileReader()
      reader.onloadend = async function(e){

        var obj = {}
       await that.initBook(e.target.result,uid).then(e=>{
        obj = e
       })
        
        that.add(uid,obj.title,e.target.result)
      }
      reader.readAsArrayBuffer(target)
      
      that.$set(that.books[uid],'percentage','新添加')
    },
    
   async initBook(bookObject,id){
      var that = this
      //生成Book对象
      var obj = {title:'',coverUrl:''}
     var book = ePub(bookObject)
      
      //生成书籍信息
     await book.loaded.metadata.then(metadata=>{
        
        
        that.$set(that.books[id],'title',metadata.title)
        obj.title=metadata.title
      })
      //获取封面信息
     await book.loaded.cover.then(async function(cover){
        await book.archive.createUrl(cover).then(url=>{
          
          that.$set(that.books[id],'cover',url)
          
          
        })
      })
      return obj
    }
  },
}



</script>


<style scoped>
#read{
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
}
.header{
  height: 64px;
  padding:12px;
  box-sizing: border-box;
  border-bottom: 1px solid #ccc;
  background-color: #fff;
}
.header>a{
  line-height: 40px;
  color: #42b983;
  font-weight: 700;
  margin-left: 30px;
}
main{
  margin: 0 100px;
  padding:24px 0;
  box-sizing: border-box;
  
}

main .book-roof{
  border-bottom:1px solid #ccc;
  padding-bottom: 3px;
}
main .book-roof>img{
  float: left;
  max-width: 32px;
}

main .book-roof>span{
  font-size: 32px;
  line-height: 32px;
  
}
main .book-list{

display: flex;
flex-wrap: wrap;
width: 100%;
}
main .book-list .book-item{
  min-width: 250px;
  
}
#title{
  
  width: 140px;
}
#deletebook{
  content: '';
  display: none;
  position: absolute;
  width: 20px;
  height: 20px;
  border: 5px solid white;
  border-radius: 15px;
  background-color: #ccc;
  z-index: 10;
  margin-top:-15px;
  margin-left: 125px;
  cursor: pointer;
  text-align: center;
  vertical-align: center;
}
main .book-item .book-main{
  width: 140px;
  height:200px;
  box-shadow: 0 0px 5px rgba(0, 0, 0, 33%);
  position: relative;
}
main .book-item .book-main:hover{
  box-shadow: 0 2px 10px rgba(0, 0, 0, 33%);
  transition:all .5s;
}
main .book-item .book-main:hover #deletebook{
  display: block;
}
main .book-list .book-item .book-add-main{
  max-width: 140px;
  height:200px;
  position: relative;
  border:1px solid #ccc;
  box-sizing: border-box;
}
main .book-list .book-item .book-add-main .book-add{
 position: absolute;
 top: 0;
 bottom:0;
 left: 0;
 right:0;
 max-width: 32px;
 max-height: 32px;
 margin: auto;
 background-image: url(../assets/add.png);
}
.book-add:hover{
  scale: 1.2;
  cursor: pointer;
}
.book-add-main>input{
  visibility: hidden;
}

</style>