<template>
  <div id="home">
    <Navbar />
    <div class="home container">
      <div class="card">
        <a class="waves-effect waves-light btn-large" @click="dbreset">
          <i class="material-icons left">all_out</i>game_users
        </a>

        <a class="waves-effect waves-light btn-large" @click="game_rooms">game_rooms</a>
        <a class="waves-effect waves-light btn-large" @click="resetnotification">notificationCount</a>
        <a class="waves-effect waves-light btn-large" @click="requesetReset">
          <i class="material-icons left">all_out</i>istek sifirla
        </a>

        <h3 class="heading center">Aktif Kullanıcılar</h3>
        <div class="row center">
          <div class="col s12 m6 offset-m3">
            <div v-if="activeUsers.length<1">
              <div class="msg msg-error z-depth-2">
                <p>Online kullanıcı bulunmamaktadır.</p>
              </div>
            </div>

            <div
              class="scale-transition"  
              :class="scaleCSS"
              :style="msgContainerHeight"
            >
              <div class="msg  z-depth-2" :class="msgTypeCSS">
                <p
                  v-if="!istekGonderildiMi.status"
                >{{ istekGonderildiMi.username }} kullanıcısına oyun isteği gönderildi</p>
                <p v-else>{{ istekGonderildiMi.username }} kullanıcına zaten oyun isteği gönderildi</p>
              </div>
            </div>

            <ul class="collection" v-for="(user,index) in activeUsers" :key="index">
              <li class="collection-item collection-item-user">
                <div class="collection-user">
                  <div class="online-status"></div>
                  <span>{{ user.username}}</span>
                </div>
                <button
                  :ref="user.username"
                  class="btn btn-game-request indigo accent-2"
                  @click="oyunIstekGonder(user)"
                >İstek Gönder</button>
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
  name: "Login",
  components: {
    Navbar
  },
  data() {
    return {
      activeUsers: [],
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
    this.getGameUsers();
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
            this.istekGonderildiMi = { username: user.username, status: false };
            return true;
          } else {
            let requestCode = Date.now();
            db.collection("notifications").add({
              sender: this.currentUser.username,
              senderEmail: this.currentUser.email,
              receiver: user.username,
              receiverEmail: user.email,
              requestCode: requestCode,
              statusCode: 0,
              seenStatus: false
            });
            this.istekGonderildiMi = { username: user.username, status: true };
          }
        })
        .then(() => {
          this.msgContainerHeight = "height:auto";
          if (this.istekGonderildiMi.status) {
            this.msgTypeCSS = "msg-info";
          } else {
            this.msgTypeCSS = "msg-error";
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
    updateGameUsers() {
      let ref = db.collection("game_users");
      ref.doc(this.currentUser.email).update({
        is_play: true
      });
      ref.doc(this.rakipOyuncu.email).update({
        is_play: true
      });
    },
    getGameUsers() {
      db.collection("game_users")
        .where("is_play", "==", false)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            let doc = change.doc;

            var user = {
              user_id: doc.data().user_id,
              username: doc.data().username,
              email: doc.id
            };

            if (change.type === "added") {
              if (doc.data().user_id != this.currentUser.id) {
                let userIndex = this.activeUsers.findIndex(
                  element => element.user_id == user.user_id
                );
                if (userIndex === -1) {
                  this.activeUsers.push(user);
                }
              }
            } else if (change.type === "removed") {
              this.activeUsers = this.activeUsers.filter(element => {
                return element.user_id != user.user_id;
              });
            }
          });
        });
    },
    senderYeniOyun(user) {
      db.collection("game_rooms")
        .get()
        .then(docs => {
          docs.forEach(doc => {
            let room = doc.data();
            let oyuncular = room.oyuncular;
            if (
              oyuncular.includes(this.currentUser.email) &&
              oyuncular.includes(user.receiverEmail)
            ) {
              this.oyunSessionTanimla(user, room.oyunNo);
              return true;
            }
          });
        })
        .then(() => {
          if (this.oyunTanimliMi()) {
            this.oyunaYonlendir();
          } else {
            this.oyunOdasiOlustur(user);
            this.oyunSessionTanimla(user, this.oyunNo);
            this.oyunaYonlendir();
          }
        });
    },
    receiveryeniOyun(user) {
      db.collection("game_rooms")
        .get()
        .then(docs => {
          docs.forEach(doc => {
            let room = doc.data();
            let oyuncular = room.oyuncular;
            if (
              oyuncular.includes(this.currentUser.email) &&
              oyuncular.includes(user.senderEmail)
            ) {
              this.oyunSessionTanimla(user, room.oyunNo);
              return true;
            }
          });
        })
        .then(() => {
          if (this.oyunTanimliMi()) {
            this.oyunaYonlendir();
          } else {
            this.oyunOdasiOlustur(user);
            this.oyunSessionTanimla(user, this.oyunNo);
            this.oyunaYonlendir();
          }
        });
    },
    oyunTanimliMi() {
      if (this.$session.exists("oyunNo")) {
        return true;
      } else {
        return false;
      }
    },
    oyunSessionTanimla(user, oyunNo) {
      this.$session.set("rakipOyuncu", user);
      this.$session.set("oyunNo", oyunNo);
    },
    oyunaYonlendir() {
      this.$router.push({ name: "Game" });
    },
    oyunOdasiOlustur(user) {
      this.oyunNo = Date.now().toString();
      let ref = db.collection("game_rooms").doc(this.oyunNo);
      ref.get().then(doc => {
        if (!doc.exists) {
          ref.set({
            oyunNo: this.oyunNo,
            oyuncular: [this.currentUser.email, user.senderEmail]
          });
        } else {
          this.oyunOdasiOlustur(user);
        }
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
    }
  }
};
</script>

<style lang="css" scoped>
:root {
  background: #fff !important;
}

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
.fa-dice-two {
  margin-right: 8px;
  font-size: 3em;
}
.btn-game-request {
  font-size: 0.5em;
}
.collection-item-user {
  justify-content: space-between;
}
.collection-user {
  display: flex;
  align-items: center;
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
    .btn-game-request{
        padding: 0 8px;

    }
}
</style>
