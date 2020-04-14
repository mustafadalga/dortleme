  <template>
  <div id="notifications">
    <Navbar />
    <div class="notifications container">
      <div class="card">
        <div class="row" v-if="notifications.length<1">
          <div class="col s12 deep-purple white-text z-depth-2 scale-transition center p1">
            <p>Bildirim bulunmamaktadır</p>
          </div>
        </div>

        <ul class="notification-collection collection">
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
                <div>
                  <p
                    class="notification-text"
                  >{{ notification.sender }} kullanıcısından bir oyun isteği geldi.</p>

                  <p>
                    <button
                      @click="acceptRequest(notification)"
                      class="button-confirm deep-purple white-text"
                    >Kabul Et</button>
                    <button
                      @click="rejectRequest(notification)"
                      class="button-confirm red white-text"
                    >Reddet</button>
                  </p>
                </div>
              </div>
              <span class="notification-datetime">{{ timestampFormat(notification.timestamp) }}</span>
            </div>
            <div v-else-if="notification.statusCode==1" class="collection-item-flex">
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
            <div v-else-if="notification.statusCode==2" class="collection-item-flex">
              <font-awesome-icon
                :icon="['fas', 'user-minus']"
                class="red-text text-accent-4 notification-icon"
              />
              <p
                class="notification-text"
              >{{ notification.sender }} kullanıcısı isteğinizi reddetti.</p>
              <span class="notification-datetime">{{ timestampFormat(notification.timestamp) }}</span>
            </div>
            <div v-else-if="notification.statusCode==3" class="collection-item-flex">
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
import Navbar from "@/components/Navbar";
import { format } from "timeago.js";

export default {
  name: "Notifications",
  components: {
    Navbar
  },
  data() {
    return {
      acceptedRequests: [],
      rejectedRequests: [],
      notifications: [],
      gameNo: null
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
    this.currentUser = this.$session.get("user");
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
    getNotifications() {
      db.collection("notifications").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === "added") {
            let doc = change.doc.data();
            if (this.currentUser.email === doc.receiverEmail) {
              this.notifications.push({
                sender: doc.sender,
                senderEmail: doc.senderEmail,
                receiver: doc.receiver,
                receiverEmail: doc.receiverEmail,
                statusCode: doc.statusCode,
                timestamp: doc.timestamp
              });
            }
          }
        });
      });
    },
    acceptRequest(user) {
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
      this.updateAcceptedRequestStatus(user);
    },
    updateAcceptedRequestStatus(user) {
      db.collection("notifications")
        .where("receiverEmail", "==", this.currentUser.email)
        .where("senderEmail", "==", user.senderEmail)
        .where("timestamp", "==", user.timestamp)
        .get()
        .then(notifications => {
          notifications.forEach(notification => {
            db.collection("notifications")
              .doc(notification.id)
              .update({
                statusCode: 3
              });
          });
        });
    },
    rejectRequest(user) {
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
      this.deleteRejectedRequest(user);
    },
    deleteRejectedRequest(user) {
      db.collection("notifications")
        .where("receiverEmail", "==", this.currentUser.email)
        .where("senderEmail", "==", user.senderEmail)
        .where("timestamp", "==", user.timestamp)
        .get()
        .then(notifications => {
          notifications.forEach(notification => {
            db.collection("notifications")
              .doc(notification.id)
              .delete();
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
            let players = room.players;
            if (
              players.includes(this.currentUser.email) &&
              players.includes(user.senderEmail)
            ) {
              this.defineGameSession(opponent, room.gameNo);
            }
          });
        })
        .then(() => {
          if (this.isGameDefined()) {
            this.playersCompletionStatus();
            this.deleteNotifications();
          } else {
            this.createGameRoom(opponent);
            this.defineGameSession(opponent, this.gameNo);
            this.createOpponentWaitStopWatch();
            this.redirectToGame();
          }
        });
    },
    defineGameSession(opponent, gameNo) {
      this.$session.set("opponentUser", opponent);
      this.$session.set("gameNo", gameNo);
      this.gameNo = gameNo;
    },
    isGameDefined() {
      if (this.$session.exists("gameNo")) {
        return true;
      } else {
        return false;
      }
    },
    playersCompletionStatus() {
      db.collection("game_rooms")
        .doc(this.gameNo)
        .update({
          isPlayersCompleted: true
        });
    },
    deleteNotifications() {
      let opponent = this.$session.get("opponentUser");
      db.collection("notifications")
        .where("receiverEmail", "==", this.currentUser.email)
        .where("senderEmail", "==", opponent.email)
        .get()
        .then(notifications => {
          notifications.forEach(notification => {
            db.collection("notifications")
              .doc(notification.id)
              .delete();
          });
        })
        .then(() => {
          db.collection("notifications")
            .where("receiverEmail", "==", opponent.email)
            .where("senderEmail", "==", this.currentUser.email)
            .get()
            .then(notifications => {
              notifications.forEach(notification => {
                db.collection("notifications")
                  .doc(notification.id)
                  .delete();
              });
            });
        })
        .then(() => {
          this.redirectToGame();
        });
    },
    createGameRoom(opponent) {
      this.gameNo = Date.now().toString();
      let currentEmail = this.currentUser.email;
      let ref = db.collection("game_rooms").doc(this.gameNo);
      ref.get().then(doc => {
        if (!doc.exists) {
          ref.set({
            gameNo: this.gameNo,
            players: [currentEmail, opponent.email],
            whichPlayerStart: currentEmail,
            moveOrder: currentEmail,
            winnerPlayer: null,
            isPlayersCompleted: false,
            gameStatusNo: 0,
            redWaitingCount: 0,
            greenWaitingCount: 0,
            redPlayerGameTime: 0,
            greenPlayerGameTime: 0
          });
        } else {
          this.createGameRoom(opponent);
        }
      });
    },
    createOpponentWaitStopWatch() {
      let opponent = this.$session.get("opponentUser");
      let now = new Date();
      let waitingTime = 60 * 1000;
      let due = new Date(now.getTime() + waitingTime);
      db.collection("game_waits").add({
        gameNo: this.gameNo,
        expectedPlayer: opponent.email,
        waitingPlayer: this.currentUser.email,
        due: due
      });
    },
    redirectToGame() {
      this.$router.push({ name: "Game" });
    },
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
    }
  }
};
</script>
<style lang="css" scoped>
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
.p1 {
  padding: 1em !important;
}
.notification-collection {
  width: 80%;
  margin: auto;
}
</style>
