  <template>
  <div id="notifications">
    <Navbar />
    <div class="home container">
      <div class="card">
        <div class="row">
          <div class="col s12">
            <div
              class="msg msg-info z-depth-2 scale-transition center"
              v-if="notifications.length<1"
            >
              <p>Bildirim bulunmamaktadır</p>
            </div>
          </div>
        </div>

        <ul class="collection" style="width:80%;margin:auto">
          <li
            class="collection-item"
            v-for="(notification,index) in sortedNotifications"
            :key="index"
          >
            <div v-if="notification.statusCode==0">
              <div v-if="acceptedRequests.includes(notification)" class="collection-item-flex">
                <font-awesome-icon
                  :icon="['fas', 'user-check']"
                  class="deep-purple-text text-darken-1 notification-icon"
                />
                <p class="notification-text">
                  {{ notification.sender}} tarafından gönderilen oyun isteğini kabul ettiniz.
                  Oyuna başlamak için
                  <a
                    class="indigo-text notify-link"
                    @click="newGame(notification)"
                  >Tıklayınız</a>
                </p>
              </div>
              <div v-else-if="rejectedRequests.includes(notification)" class="collection-item-flex">
                <font-awesome-icon
                  :icon="['fas', 'user-minus']"
                  class="deep-purple-text text-darken-1 notification-icon"
                />
                <p
                  class="notification-text"
                >{{ notification.sender}} tarafından gönderilen oyun isteğini iptal ettiniz.</p>
              </div>
              <div v-else class="collection-item-flex">
                <font-awesome-icon
                  :icon="['fas', 'user-plus']"
                  class="deep-purple-text text-darken-1 notification-icon"
                />
                <p class="notification-text">
                  {{ notification.sender }} kullanıcısından bir oyun isteği geldi.
                  <button
                    @click="istekKabulEt(notification)"
                    class="button-confirm deep-purple white-text"
                  >Kabul Et</button>
                  <button
                    @click="istekReddet(notification)"
                    class="button-confirm red white-text"
                  >Reddet</button>
                </p>
              </div>
              <span class="notification-datetime">{{ timestampFormat(notification.timestamp) }}</span>
            </div>
            <div v-if="notification.statusCode==1" class="collection-item-flex">
              <font-awesome-icon
                :icon="['fas', 'user-check']"
                class="light-green-text text-accent-4 notification-icon"
              />
              <p class="notification-text">
                {{ notification.sender }} kullanıcısına yapılan oyun isteği kabul edildi.Oyuna başlamak için
                <span
                  class="indigo-text notify-link"
                  @click="newGame(notification)"
                >tıklayınız.</span>
              </p>
              <span class="notification-datetime">{{ timestampFormat(notification.timestamp) }}</span>
            </div>
            <div v-if="notification.statusCode==2" class="collection-item-flex">
              <font-awesome-icon
                :icon="['fas', 'user-minus']"
                class="red-text text-accent-4 notification-icon"
              />
              <p
                class="notification-text"
              >{{ notification.sender }} kullanıcısı isteğinizi reddetti.</p>
              <span class="notification-datetime">{{ timestampFormat(notification.timestamp) }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import {
  faUserPlus,
  faUserCheck,
  faUserMinus
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faUserPlus, faUserCheck, faUserMinus);
import db from "@/firebase/init";
//import firebase from "firebase";
import Navbar from "@/components/Navbar";
import { format } from "timeago.js";

export default {
  name: "Login",
  components: {
    Navbar
  },
  data() {
    return {
      activeUsers: [],
      acceptedRequests: [],
      rejectedRequests: [],
      rakipOyuncu: null,
      feedback: null,
      scale: "scale-out",
      notifications: []
    };
  },
  computed: {
    sortedNotifications: function() {
      return this.notifications.slice().sort(function(a, b) {
        return a.timestamp < b.timestamp ? 1 : -1;
      });
    }
  },
  created() {
    window.addEventListener("beforeunload", event => {
      // Cancel the event as stated by the standard.
      event.preventDefault();
      alert("kapatıldı");
      // Chrome requires returnValue to be set.
      //  event.returnValue = "";
    });
    this.currentUser = this.$session.get("user");
    // this.updateNotificationsSeenStatus();
    this.addGameUsers();
    this.getGameUsers();
    this.getNotifications();
  },

  beforeRouteLeave(to, from, next) {
    this.$session.set("isNotificationReset", true);
    db.collection("notifications")
      .where("receiverEmail", "==", this.currentUser.email)
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          db.collection("notifications")
            .doc(doc.id)
            .update({
              seenStatus: true
            });
        });
      })
      .then(() => {
        next();
      });
  },
  methods: {
    timestampFormat(timestamp) {
      let time = format(timestamp);
      time = time.replace("just now", "şimdi");
      time = time.replace("ago", "önce");
      time = time.replace("seconds", "saniye");
      time = time.replace("second", "saniye");
      time = time.replace("minutes", "dakika");
      time = time.replace("minute", "dakika");
      time = time.replace("hours", "saat");
      time = time.replace("hour", "saat");
      time = time.replace("days", "gün");
      time = time.replace("day", "gün");
      time = time.replace("weeks", "hafta");
      time = time.replace("week", "hafta");
      time = time.replace("years", "yıl");
      time = time.replace("year", "yıl");
      return time;
    },
    istekKabulEt(user) {
      db.collection("notifications").add({
        sender: this.currentUser.username,
        senderEmail: this.currentUser.email,
        receiver: user.sender,
        receiverEmail: user.senderEmail,
        statusCode: 1,
        seenStatus: false,
        timestamp: Date.now()
      });
      this.acceptedRequests.push(user);
      this.deleteRequest(user.requestCode);
    },
    istekReddet(user) {
      db.collection("notifications").add({
        sender: this.currentUser.username,
        senderEmail: this.currentUser.email,
        receiver: user.sender,
        receiverEmail: user.senderEmail,
        statusCode: 2,
        seenStatus: false,
        timestamp: Date.now()
      });
      this.rejectedRequests.push(user);
      this.deleteRequest(user.requestCode);
    },
    deleteRequest(requestCode) {
      db.collection("notifications")
        .get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            if (doc.data().requestCode === requestCode) {
              db.collection("notifications")
                .doc(doc.id)
                .delete();
            }
          });
        });
    },
    getNotifications() {
      db.collection("notifications").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type == "added") {
            let doc = change.doc.data();
            if (this.currentUser.email == doc.receiverEmail) {
              this.notifications.push({
                sender: doc.sender,
                senderEmail: doc.senderEmail,
                receiver: doc.receiver,
                receiverEmail: doc.receiverEmail,
                statusCode: doc.statusCode,
                requestCode: doc.requestCode,
                timestamp: doc.timestamp
              });
            }
          }
        });
      });
    },
    newGame(user) {
      let opponent = {
        username: user.sender,
        email: user.senderEmail
      };
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
              this.oyunSessionTanimla(opponent, room.oyunNo);
              return true;
            }
          });
        })
        .then(() => {
          if (this.oyunTanimliMi()) {
            this.oyuncuKadroTamamla();
            this.oyunaYonlendir();
          } else {
            this.oyunOdasiOlustur(opponent);
            this.oyunSessionTanimla(opponent, this.oyunNo);
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
    oyuncuKadroTamamla() {
      db.collection("game_rooms")
        .doc(this.oyunNo)
        .update({
          oyuncuKadroTamamMi: true
        });
    },
    oyunSessionTanimla(opponent, oyunNo) {
      this.$session.set("rakipOyuncu", opponent);
      this.$session.set("oyunNo", oyunNo);
      this.oyunNo = oyunNo;
    },
    oyunaYonlendir() {
      this.$router.push({ name: "Game" });
    },
    oyunOdasiOlustur(opponent) {
      this.oyunNo = Date.now().toString();
      let currentEmail = this.currentUser.email;
      let skor = [];
      skor.push({
        username: this.currentUser.username,
        puan: 0
      });
      skor.push({
        username: opponent.username,
        puan: 0
      });
      let ref = db.collection("game_rooms").doc(this.oyunNo);
      ref.get().then(doc => {
        if (!doc.exists) {
          ref.set({
            oyunNo: this.oyunNo,
            oyuncular: [currentEmail, opponent.email],
            oyunuBaslatanEmail: currentEmail,
            hamleSirasi: currentEmail,
            kazananOyuncu: null,
            skor: skor,
            oyuncuKadroTamamMi: false
          });
        } else {
          this.oyunOdasiOlustur(opponent);
        }
      });
    },

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
.btn {
  display: flex;
  width: 8em;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 1em;
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

.notification-icon {
  margin-right: 1em;
}
.notification-datetime {
  position: absolute;
  right: 1em;
  bottom: 0.5em;
  font-size: 13px;
}
.notification-text {
  margin-bottom: 1em;
  font-size: 14px;
}
.collection-item {
  position: relative;
}
.collection-item-flex {
  display: flex;
  align-items: center;
}
.button-confirm {
  padding: 0.5em;
  cursor: pointer;
  -webkit-box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2);
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
    0 3px 1px -2px rgba(0, 0, 0, 0.12), 0 1px 5px 0 rgba(0, 0, 0, 0.2);
  outline: none;
  border: none;
  margin-left: 1em;
  margin-bottom: 1em;
  font-size: 14px;
}
.notify-link {
  cursor: pointer;
}
</style>
