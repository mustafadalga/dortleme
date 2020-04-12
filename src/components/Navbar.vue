<template>
  <nav class="deep-purple darken-1">
    <div class="container">
      <router-link v-if="$route.name==='Game'" :to="{name:'Game'}" class="brand-logo left">
        <span class="brand-text">Dörtleme</span>
      </router-link>
      <router-link v-else-if="$route.name!=='Game'" :to="{name:'Home'}" class="brand-logo left">
        <font-awesome-icon :icon="['fas', 'home']" />
        <span class="brand-text">Dörtleme</span>
      </router-link>
      <ul class="right">
        <li v-if="!currentUser">
          <router-link :to="{name:'Signup'}">
            <font-awesome-icon :icon="['fas', 'user-plus']" />
          </router-link>
        </li>
        <li v-if="!currentUser">
          <router-link :to="{name:'Login'}" style="height:100%">
            <font-awesome-icon :icon="['fas', 'sign-in-alt']" />
          </router-link>
        </li>
        <li v-if="currentUser && $route.name=='Game'">
          <a @click="exitGame">
            <font-awesome-icon :icon="['fas', 'times-circle']" />
          </a>
        </li>
        <li v-if="currentUser && $route.name!=='Game'" class="rating-logo">
          <router-link :to="{name:'Ratings'}">
            <img src="../assets/img/rating.svg" />
          </router-link>
        </li>
        <li v-if="currentUser  && $route.name!=='Game'">
          <router-link
            :to="{name:'Notifications'}"
            style="position:relative;"
            @click.native="clearNotifications"
          >
            <font-awesome-icon
              :icon="['fas', 'bell']"
              :class="[notificationCount > 0 ? 'bell-on' : '',isAnimateAdded ? 'animated wobble' : '']"
            />
            <span v-if="notificationCount > 0" class="bell-badge">{{ notificationCount }}</span>
          </router-link>
        </li>

        <li v-if="currentUser  && $route.name!=='Game'">
          <a @click="logout">
            <font-awesome-icon :icon="['fas', 'sign-out-alt']" />
          </a>
        </li>
      </ul>

      <div v-if="connectionStatus===false">
        <InternetConnectionModal :connectionStatus="connectionStatus" />
      </div>
    </div>
  </nav>
</template>

<script>
import {
  faHome,
  faUserPlus,
  faSignOutAlt,
  faSignInAlt,
  faBell,
  faTimesCircle
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(
  faHome,
  faUserPlus,
  faSignOutAlt,
  faBell,
  faTimesCircle,
  faSignInAlt
);
import firebase from "firebase";
import db from "@/firebase/init";
import InternetConnectionModal from "@/components/InternetConnectionModal";

export default {
  name: "Navbar",
  components: {
    InternetConnectionModal
  },
  data() {
    return {
      isAnimateAdded: false,
      gameNo: null,
      connectionStatus: null,
      onLine: navigator.onLine
    };
  },
  mounted() {
    this.connectionStatus = navigator.onLine;
    this.addOnlineStatusEventListener();
  },
  beforeDestroy() {
    this.removeOnlineStatusEventListener();
  },
  created() {
    this.currentUser = this.$session.get("user");
    if (this.currentUser) {
      this.addOnlineUser();
      if (this.$session.exists("gameNo")) {
        this.gameNo = this.$session.get("gameNo");
      }
      if (this.$route.name === "Notifications") {
        this.updateNotificationsSeenStatus();
      } else {
        this.notificationCount = this.$session.get("notificationCount");
        if (this.$session.get("isNotificationReset")) {
          this.updateNotificationsStatus();
        }
        this.getNotifications();
        this.deleteRejectedRequest();
      }
    }
    this.addBeforeUnloadEventListener()
  },

  methods: {
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
    addBeforeUnloadEventListener() {
      window.addEventListener(
        "beforeunload",
        () => {
          this.deleteOnlineUser();
        },
        true
      );
    },
    addOnlineStatusEventListener() {
      window.addEventListener("online", this.updateOnlineStatus);
      window.addEventListener("offline", this.updateOnlineStatus);
    },
    removeOnlineStatusEventListener() {
      window.removeEventListener("online", this.updateOnlineStatus);
      window.removeEventListener("offline", this.updateOnlineStatus);
    },
    updateOnlineStatus(e) {
      const { type } = e;
      this.connectionStatus = type === "online";
    },
    clearNotifications() {
      this.$session.set("notificationCount", 0);
      this.notificationCount = this.$session.get("notificationCount");
    },
    updateNotificationsStatus() {
      this.$session.set("isNotificationReset", false);
      this.notificationIdList = [];
      this.clearNotifications();
    },
    addNotification(id) {
      let notificationIndex = this.notificationIdList.findIndex(
        notificationId => {
          return notificationId === id;
        }
      );
      if (notificationIndex === -1) {
        this.notificationIdList.push(id);
      }
      this.$session.set("notificationCount", this.notificationIdList.length);
      this.notificationCount = this.$session.get("notificationCount");
    },
    createNotificationAnimation() {
      this.isAnimateAdded = true;
      window.setTimeout(() => {
        this.isAnimateAdded = false;
      }, 2500);
    },
    updateNotificationsSeenStatus() {
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
          this.$session.set("notificationCount", 0);
          this.notificationIdList = [];
          this.getNotifications();
        });
    },
    deleteRejectedRequest() {
      db.collection("notifications")
        .where("receiverEmail", "==", this.currentUser.email)
        .where("seenStatus", "==", true)
        .where("statusCode", "==", 2)
        .get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            db.collection("notifications")
              .doc(doc.id)
              .delete();
          });
        });
    },
    getNotifications() {
      db.collection("notifications").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          let doc = change.doc;
          if (change.type == "added") {
            let receiverEmail = doc.data().receiverEmail;
            let seenStatus = doc.data().seenStatus;
            if (this.currentUser.email === receiverEmail && !seenStatus) {
              this.addNotification(doc.id);
              this.createNotificationAnimation();
              console.log("bildirim geldi");
            }
          }
        });
      });
    },
    logout() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.deleteOnlineUser();
          this.clearSession();
          this.$router.push({ name: "Login" });
        });
    },
    exitGame() {
      this.$emit("openExitGameConfirmModal");
    },
    deleteOnlineUser() {
      db.collection("game_users")
        .doc(this.currentUser.email)
        .delete();
    },
    clearSession() {
      this.$session.clear();
    }
  }
};
</script>
<style >
@import "../assets/css/animate.css";
@import "../assets/css/materialize.min.css";
.brand-logo {
  display: flex !important;
  align-items: center;
}
.brand-logo .material-icons {
  font-size: 1em;
}
.fa-home {
  font-size: 1em;
}
.fa-bell,
.fa-plus.fa-sign-in-alt,
.fa-sign-out-alt,
.fa-times-circle {
  font-size: 1.5em;
}
.bell-on {
  color: lime;
}
.bell-badge {
  position: absolute;
  top: 4px;
  right: -5px;
  padding: 0 6px;
  line-height: 22px;
  height: 22px;
  border-radius: 50%;
  background: red;
}
.brand-text {
  margin-left: 8px;
}

.rating-logo img {
  margin-top: 15px;
  width: 32px;
  height: 32px;
}
@media (max-width: 800px) {
  nav {
    height: 40px;
    line-height: 40px;
  }
  .rating-logo img {
    margin-top: 4px;
    width: 28px;
    height: 28px;
  }
  .brand-text {
    font-size: 0.7em;
  }
}
@media (max-width: 600px) {
  nav {
    height: 36px;
    line-height: 36px;
  }
  .rating-logo img {
    margin-top: 6px;
    width: 24px;
    height: 24px;
  }
  .brand-text {
    font-size: 0.5em;
  }
  .fa-home {
    font-size: 0.5em;
  }
  .fa-bell {
    font-size: 1em;
  }
  .fa-sign-out-alt {
    font-size: 1em;
  }
}
.vue-notification-group {
  margin-top: 64px;
}
</style>

