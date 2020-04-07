<template>
  <div id="home">
    <Navbar />
    <div class="home container">
      <div class="card">
        <div style="display:none" >
          <a class="waves-effect waves-light btn-large" @click="dbreset">
            <i class="material-icons left">all_out</i>game_users
          </a>

          <a class="waves-effect waves-light btn-large" @click="game_rooms">game_rooms</a>
          <a class="waves-effect waves-light btn-large" @click="game_waits">game_Waits</a>
          <a class="waves-effect waves-light btn-large" @click="resetnotification">notificationCount</a>
          <a class="waves-effect waves-light btn-large" @click="requesetReset">
            <i class="material-icons left">all_out</i>istek sifirla
          </a>
        </div>

        <h4 class="heading center deep-purple-text">Online Kullanıcılar</h4>
        <div class="row center">
          <div class="col s12 m8 offset-m2 xl6 offset-xl3">
            <div v-if="onlineUsers.length<1">
              <div class="msg deep-purple white-text z-depth-2">
                <p>Online kullanıcı bulunmamaktadır.</p>
              </div>
            </div>
            <div class="scale-transition" :class="scaleCSS" :style="msgContainerHeight">
              <div class="msg z-depth-2" :class="msgTypeCSS">
                <p
                  v-if="!gameRequest.status"
                >{{ gameRequest.username }} kullanıcısına oyun isteği gönderildi</p>
                <p v-else>{{ gameRequest.username }} kullanıcına zaten oyun isteği gönderildi</p>
              </div>
            </div>

            <ul class="collection">
           <li class="collection-item" v-for="(user,index) in onlineUsers" :key="index">
                <div v-if="!user.is_play" class="collection-item-user">
                  <div class="collection-user">
                    <div class="online-status"></div>
                    <span>{{ user.username}}</span>
                  </div>
                  <button
                    :ref="user.username"
                    class="btn btn-game-request indigo accent-2"
                    @click="sendGameRequest(user)"
                  >İstek Gönder</button>
                  <span
                    class="icon-game-request"
                    :ref="user.username"
                    @click="sendGameRequest(user)"
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
      scaleCSS: "scale-out",
      msgTypeCSS: "msg-default",
      msgContainerHeight: "height:0",
      gameRequest: { status: false, username: null },
      timeoutHandle: null
    };
  },
  created() {
    this.currentUser = this.$session.get("user");
    this.addOnlineUser();
    this.getOnlineUsers();
  },

  methods: {
    getOnlineUsers() {
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
            if (doc.data().user_id !== this.currentUser.id) {
              let userIndex = this.getUserIndex(user.user_id);
              if (!this.isThereUser(userIndex)) {
                this.onlineUsers.push(user);
              }
            }
          } else if (change.type === "modified") {
            if (doc.data().user_id !== this.currentUser.id) {
              this.deleteUserFromOnlineUsers(user.user_id);
              let userIndex = this.getUserIndex(user.user_id);
              if (!this.isThereUser(userIndex)) {
                this.onlineUsers.push(user);
              }
            }
          } else if (change.type === "removed") {
            this.onlineUsers = this.onlineUsers.filter(element => {
              return element.user_id != user.user_id;
            });
          }
        });
      });
    },
    addOnlineUser() {
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
    sendGameRequest(user) {
      window.clearTimeout(this.timeoutHandle);
      this.buttonRequestAddCSS(user);

      db.collection("notifications")
        .where("statusCode", "==", 0)
        .where("sender", "==", this.currentUser.username)
        .where("receiver", "==", user.username)
        .get()
        .then(doc => {
          if (doc.docs.length > 0) {
            this.gameRequest = { username: user.username, status: true };
          } else {
            db.collection("notifications").add({
              sender: this.currentUser.username,
              senderEmail: this.currentUser.email,
              receiver: user.username,
              receiverEmail: user.email,
              statusCode: 0,
              seenStatus: false,
              timestamp: Date.now()
            });
            this.gameRequest = { username: user.username, status: false };
          }
        })
        .then(() => {
          this.msgContainerHeight = "height:auto";
          if (this.gameRequest.status) {
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
    getUserIndex(userId) {
      return this.onlineUsers.findIndex(user => user.user_id === userId);
    },
    isThereUser(userIndex) {
      if (userIndex === -1) {
        return false;
      } else {
        return true;
      }
    },
    deleteUserFromOnlineUsers(userId) {
      this.onlineUsers = this.onlineUsers.filter(user => {
        return user.user_id !== userId;
      });
    },

    // temporary methods
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

<style lang="css" scoped >
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
    width: auto!important;
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
    width: 100%;
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
@import "../assets/css/all.css";
</style>
