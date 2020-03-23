<template>
  <div id="home">
    <Navbar />
    <div class="home container">
      <div class="card">
        <a class="waves-effect waves-light btn-large" @click="dbreset">
          <i class="material-icons left">all_out</i>game_users
        </a>

        <a class="waves-effect waves-light btn-large" @click="game_rooms">game_rooms</a>
        <a class="waves-effect waves-light btn-large" @click="game_waits">game_Waits</a>
        <a class="waves-effect waves-light btn-large" @click="resetnotification">notificationCount</a>
        <a class="waves-effect waves-light btn-large" @click="requesetReset">
          <i class="material-icons left">all_out</i>istek sifirla
        </a>

        <h3 class="heading center">Aktif Kullanıcılar</h3>
        <div class="row center">
          <div class="col s12 m8 offset-m2 xl6 offset-xl3">
            <div v-if="onlineUsers.length<1">
              <div class="msg msg-error z-depth-2">
                <p>Online kullanıcı bulunmamaktadır.</p>
              </div>
            </div>

            <div class="scale-transition" :class="scaleCSS" :style="msgContainerHeight">
              <div class="msg z-depth-2" :class="msgTypeCSS">
                <p
                  v-if="!istekGonderildiMi.status"
                >{{ istekGonderildiMi.username }} kullanıcısına oyun isteği gönderildi</p>
                <p v-else>{{ istekGonderildiMi.username }} kullanıcına zaten oyun isteği gönderildi</p>
              </div>
            </div>

            <ul class="collection">
              <li
                class="collection-item"
                v-for="(user,index) in onlineUsers"
                :key="index"
              >
                <div v-if="!user.is_play" class=" collection-item-user">
                  <div class="collection-user">
                    <div class="online-status"></div>
                    <span>{{ user.username}}</span>
                  </div>
                  <button
                    :ref="user.username"
                    class="btn btn-game-request indigo accent-2"
                    @click="oyunIstekGonder(user)"
                  >İstek Gönder</button>
                  <span
                    class="icon-game-request"
                    :ref="user.username"
                    @click="oyunIstekGonder(user)"
                  >
                    <img src="../assets/img/right-arrow.png" />
                  </span>
                </div>
                <div v-else>
                  <div class="collection-user">
                    <div class="offline-status"></div>
                    <span>{{ user.username}}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { faDiceTwo } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
library.add(faDiceTwo);

import db from "@/firebase/init";
import Navbar from "@/components/Navbar";
export default {
  name: "Home",
  components: {
    Navbar
  },
  data() {
    return {
      onlineUsers: [],
      rakipOyuncu: null,
      scaleCSS: "scale-out",
      msgTypeCSS: "msg-default",
      msgContainerHeight: "height:0",
      gameRequests: [],
      istekGonderildiMi: { status: false, username: null },
      oyunNo: false,
      timeoutHandle: null
    };
  },
  created() {
    window.addEventListener("beforeunload", event => {
      // Cancel the event as stated by the standard.
      event.preventDefault();
      alert("kapatıldı");
      // Chrome requires returnValue to be set.
      //  event.returnValue = "";
    });
    this.$session.remove("oyunNo");
    this.currentUser = this.$session.get("user");
    this.addGameUsers();
    this.getOnlineUser();
  },

  methods: {
    oyunIstekGonder(user) {
      window.clearTimeout(this.timeoutHandle);
      this.buttonRequestAddCSS(user);

      db.collection("notifications")
        .where("statusCode", "==", 0)
        .where("sender", "==", this.currentUser.username)
        .where("receiver", "==", user.username)
        .get()
        .then(doc => {
          if (doc.docs.length > 0) {
            this.istekGonderildiMi = { username: user.username, status: true };


          } else {
            db.collection("notifications").add({
              sender: this.currentUser.username,
              senderEmail: this.currentUser.email,
              receiver: user.username,
              receiverEmail: user.email,
              statusCode: 0,
              seenStatus: false
            });
            this.istekGonderildiMi = { username: user.username, status: false };
          }
        })
        .then(() => {
          this.msgContainerHeight = "height:auto";
          if (this.istekGonderildiMi.status) {
            this.msgTypeCSS = "msg-error";
          } else {
            this.msgTypeCSS = "msg-info";
          }
          this.scaleCSS = "scale-in";
          this.timeoutHandle = window.setTimeout(() => {
            this.scaleCSS = "scale-out";
          }, 4000);
          this.timeoutHandle = window.setTimeout(() => {
            this.msgContainerHeight = "height:0";
          }, 4300);
        });
    },
    buttonRequestAddCSS(user) {
      let buttonRef = this.$refs[user.username][0];
      buttonRef.innerText = "İstek Gönderildi";
      buttonRef.style.border = "1px solid rgb(83, 109, 254)";
      buttonRef.disabled = true;
    },
    addGameUsers() {
      let ref = db.collection("game_users").doc(this.currentUser.email);
      ref.get().then(doc => {
        if (!doc.exists) {
          ref.set({
            user_id: this.currentUser.id,
            username: this.currentUser.username,
            is_play: false
          });
        }
      });
    },

    getOnlineUser() {
      db.collection("game_users").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          let doc = change.doc;
          var user = {
            user_id: doc.data().user_id,
            username: doc.data().username,
            email: doc.id,
            is_play: doc.data().is_play
          };

          if (change.type === "added") {
            if (doc.data().user_id != this.currentUser.id) {
              let userIndex = this.onlineUsers.findIndex(
                element => element.user_id == user.user_id
              );
              if (userIndex === -1) {
                this.onlineUsers.push(user);
              }
            }
          } else if (change.type == "modified") {
            this.onlineUsers = this.onlineUsers.filter(element => {
              return element.user_id != user.user_id;
            });
            this.onlineUsers.push(user);
          } else if (change.type === "removed") {
            this.onlineUsers = this.onlineUsers.filter(element => {
              return element.user_id != user.user_id;
            });
          }
        });
      });
    },

    dbreset() {
      var jobskill_query = db.collection("game_users");
      jobskill_query.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          doc.ref.delete();
        });
      });
    },
    resetnotification() {
      this.$session.set("notificationCount", 0);
      this.notificationCount = 0;
    },
    requesetReset() {
      var jobskill_query = db.collection("notifications");
      jobskill_query.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          doc.ref.delete();
        });
      });
    },
    game_rooms() {
      var jobskill_query = db.collection("game_rooms");
      jobskill_query.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          doc.ref.delete();
        });
      });
    },
    game_waits() {
      var jobskill_query = db.collection("game_waits");
      jobskill_query.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          doc.ref.delete();
        });
      });
    }
  }
};
</script>

<style lang="css" scoped>
.home {
  margin-top: 60px;
}
.card {
  padding: 1em;
}
.collection-item {
  font-size: 1.5em;
  display: flex !important;
  align-items: center;
}
.online-status {
  background: limegreen;
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
  margin-right: 1em;
}
.offline-status {
  background: crimson;
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
  margin-right: 1em;
}
.fa-dice-two {
  margin-right: 8px;
  font-size: 3em;
}
.btn-game-request {
  font-size: 0.5em;
}
.icon-game-request {
  display: none;
  cursor: pointer;
}
.icon-game-request img {
  width: 32px;
  height: 32px;
}
.collection-item-user {
  display: flex;
  justify-content: space-between; 
  width:100%;
}
.collection-user {
  display: flex;
  align-items: center;
}
.collection-user .user-score {
  font-size: 15px;
  margin-left: 1em;
  border-radius: 50%;
  padding: 6px 3px;
  font-weight: bold;
}

.msg {
  width: 100%;
  border: 1px solid;
  padding: 10px;
  color: grey;
}
.msg-error {
  border-color: #d32f2f;
  background-color: #ef5350;
  color: white;
}
.msg-alert {
  border-color: #ef6c00;
  background-color: #ff9800;
  color: white;
}
.msg-info {
  border-color: #0288d1;
  background-color: #29b6f6;
  color: white;
}
@media (max-width: 500px) {
  .btn-game-request {
    display: none;
  }
  .icon-game-request {
    display: block;
  }
  .collection-user {
    font-size: 0.75em;
  }
}
</style>
