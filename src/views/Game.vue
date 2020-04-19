<template>
  <div id="game">
    <Navbar @openExitGameConfirmModal="openExitGameConfirmModal" />
    <div class="container pano center">
      <div class="row">
        <div class="col s6 m3">
          <div
            class="z-depth-1 white-text bg-red card-red-team"
            :class="moveOrder==startingPlayer ? 'aktif-takim-border' : ''"
          >
            <font-awesome-icon :icon="['fas', 'user']" />
            <span
              class="player-name"
            >{{ startingPlayer==currentUser.email ? currentUser.username : opponent.username }}</span>

            <span
              class="btn-floating waves-effect waves-light skor skor-bg-red"
            >{{ startingPlayer==currentUser.email ? currentUserSkor : opponentScore }}</span>
          </div>
        </div>

        <div class="col s6 m3 offset-m6">
          <div
            class="z-depth-1 white-text bg-green card-green-team"
            :class="moveOrder!=startingPlayer ? 'aktif-takim-border' : ''"
          >
            <font-awesome-icon :icon="['fas', 'user']" />
            <span
              class="player-name"
            >{{ startingPlayer==currentUser.email ? opponent.username : currentUser.username }}</span>
            <span
              class="btn-floating waves-effect waves-light bg-green skor"
            >{{ startingPlayer==currentUser.email ? opponentScore: currentUserSkor }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="dortleme-container">
      <div class="dortleme">
        <div v-for="row in 6" :key="row" class="row-container">
          <div v-for="col in 8" :key="col" :style="zIndexStyle ? 'z-index:-2' : null">
            <div @click="makeMove" :class="setColor(row,col)" class="hucre" :row="row" :col="col"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="alert-bottom-container">
      <div class="alert-bottom scale-transition" :class="gameStartScaleCSS">
        <div class="msg msg-info z-depth-2" v-if="isOpenGameStartCountDownAlert">
          <span v-if="!isOpponentStopwatchExpired">Rakip oyuncu bekleniliyor...</span>
          <span>{{ gameStartCountDown && !isOpponentStopwatchExpired ? gameStartCountDown : gameStartCountDown==null ? "": "Süre Doldu!" }}</span>
        </div>
      </div>
    </div>

    <div class="alert-bottom-container">
      <div class="alert-bottom scale-transition" :class="moveScaleCSS">
        <div class="msg msg-info z-depth-2" v-if="isOpenMoveCountDownAlert">
          <span
            v-if="!isMoveStopwatchExpired"
          >{{ moveCountDown ? "Hamle yapmak için kalan süre:"+moveCountDown : "Süre Doldu!"}}</span>
          <span
            v-else-if="moveOrderChangeStatus===false"
          >Hamle sırası gelen oyuncu:{{ moveOrder==currentUser.email ? currentUser.username : opponent.username }}</span>
        </div>
      </div>
    </div>

    <notifications position="top right" group="alert" />

    <div v-if="gameStatusNo===1 || gameStatusNo===2">
      <ExitGameConfirmModal
        @exitGame="exitGame"
        :gameStatusNo="gameStatusNo"
        @modalClose="modalClose"
      />
    </div>
    <div v-else-if="gameStatusNo>2 && gameStatusNo<9">
      <GameOverModal
        @newGame="newGame"
        @exitGame="exitGame"
        :winnerPlayer="winnerPlayer"
        :currentUserSkor="currentUserSkor"
        :opponentScore="opponentScore"
        :gameStatusNo="gameStatusNo"
      />
    </div>
    <MobileWarningModal class="mobile-warning" />
  </div>
</template>


<script>
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
library.add(faUser);

import db from "@/firebase/init";
import Navbar from "@/components/Navbar";
import GameOverModal from "@/components/GameOverModal";
import ExitGameConfirmModal from "@/components/ExitGameConfirmModal";
import MobileWarningModal from "@/components/MobileWarningModal";
import MovementSoundFile from "@/assets/sound/movement.mp3";
import WinnerSoundFile from "@/assets/sound/winner.mp3";

export default {
  name: "Game",
  components: {
    Navbar,
    GameOverModal,
    ExitGameConfirmModal,
    MobileWarningModal
  },
  data() {
    return {
      activePlayer: null,
      playerNo: null,
      movements: [],
      greenMoveCount: 0,
      redMoveCount: 0,
      row: null,
      col: null,
      color: null,
      opponent: null,
      gameNo: null,
      gameStartScaleCSS: "scale-out",
      moveScaleCSS: "scale-out",
      startingPlayer: null,
      moveOrder: null,
      winnerPlayer: null,
      opponentScore: null,
      currentUserSkor: null,
      isOpenGameStartCountDownAlert: true,
      isOpenMoveCountDownAlert: false,
      isPlayersCompleted: false,
      isGameOver: false,
      timeoutHandleGameStart: null,
      timeoutHandleMove: null,
      gameStartCountDown: null,
      moveCountDown: null,
      moveOrderChangeStatus: null,
      gameStatusNo: null,
      moveDueDate: 0,
      isOpponentStopwatchExpired: false,
      isMoveStopwatchExpired: false,
      zIndexStyle: false,
      quadPositions: [],
      redWaitingCount: 0,
      greenWaitingCount: 0
    };
  },
  created() {
    this.currentUser = this.$session.get("user");
    this.opponent = this.$session.get("opponentUser");
    this.gameNo = this.$session.get("gameNo");
    this.whichPlayerStart();
    this.getMovesList();
    this.getWinnerPlayer();
    this.getScore();
    this.checkPlayersCompletionStatus();
    this.getOpponentWaitStopWatch();
    this.getMovementWaitStopWatch();
    this.checkGameRoom();
    this.getWaitingCount();
  },
  mounted() {
    setTimeout(() => {
      this.updatePlayersPlayingStatus(true);
    }, 1500);
  },
  methods: {
    updatePlayersPlayingStatus(status) {
      let ref = db.collection("game_users");
      ref.doc(this.currentUser.email).update({
        is_play: status
      });
    },
    whichPlayerStart() {
      let ref = db.collection("game_rooms").doc(this.gameNo);
      ref
        .get()
        .then(doc => {
          this.startingPlayer = doc.data().whichPlayerStart;
          this.moveOrder = doc.data().whichPlayerStart;
        })
        .then(() => {
          if (this.moveOrder == this.currentUser.email) {
            this.activePlayer = 1;
          } else {
            this.activePlayer = 2;
          }
        })
        .then(() => {
          this.getMoveOrder();
        });
    },
    getWinnerPlayer() {
      db.collection("game_rooms").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.id == this.gameNo &&
            change.doc.data().winnerPlayer &&
            (change.doc.data().gameStatusNo === 5 ||
              change.doc.data().gameStatusNo === 8)
          ) {
            this.winnerPlayer = change.doc.data().winnerPlayer;

            if (change.doc.data().isPlayersCompleted) {
              this.isGameOver = true;
              this.isOpenMoveCountDownAlert = false;
            }
          } else if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.id == this.gameNo &&
            change.doc.data().winnerPlayer === null &&
            change.doc.data().gameStatusNo === 0 &&
            this.isGameOver
          ) {
            this.winnerPlayer = null;
            this.notificationAlert(
              "success",
              "Yeni Oyun",
              "Yeni oyun başladı."
            );
            this.resetGameData();
            this.whichPlayerStart();
          } else {
            this.winnerPlayer = change.doc.data().winnerPlayer;
          }
        });
      });
    },
    getScore() {
      db.collection("scores").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "added" || change.type == "modified") &&
            change.doc.data().email == this.currentUser.email
          ) {
            this.currentUserSkor = change.doc.data().score;
          } else if (
            (change.type == "added" || change.type == "modified") &&
            change.doc.data().email == this.opponent.email
          ) {
            this.opponentScore = change.doc.data().score;
          }
        });
      });
    },
    checkPlayersCompletionStatus() {
      db.collection("game_rooms")
        .where("gameNo", "==", this.gameNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (
              (change.type == "modified" || change.type == "added") &&
              change.doc.data().isPlayersCompleted &&
              change.doc.data().winnerPlayer === null
            ) {
              this.PlayersCompletionStatusAlert();
              this.gameStatusNo = 0;
              window.clearTimeout(this.timeoutHandleGameStart);
              if (!this.isPlayersCompleted) {
                this.isOpenGameStartCountDownAlert = false;
                this.isOpenMoveCountDownAlert = true;
                this.isPlayersCompleted = true;
                this.$session.set("isPlayersCompleted", true);
                if (
                  change.doc.data().whichPlayerStart === this.currentUser.email
                ) {
                  this.checkOpponentWaitStopWatch().then(opponentStatus => {
                    if (opponentStatus === true) {
                      this.deleteOpponentWaitStopWatch().then(() => {
                        this.createMovementWaitStopWatch();
                      });
                    } else if (opponentStatus === false) {
                      this.checkMovementWaitStopWatch().then(movementStatus => {
                        if (movementStatus === false) {
                          this.createMovementWaitStopWatch();
                        }
                      });
                    }
                  });
                }
              }

              if (!this.$session.get("isPlayersCompleted")) {
                window.setTimeout(() => {
                  this.gameStartScaleCSS = "scale-out";
                }, 2000);
              }
            } else if (
              (change.type === "added" || change.type === "modified") &&
              change.doc.data().isPlayersCompleted === false &&
              change.doc.data().gameStatusNo === 0
            ) {
              if (this.gameStatusNo !== 0) {
                this.gameStartScaleCSS = "scale-in";
                this.$session.set("isPlayersCompleted", false);
              }
            } else if (
              (change.type === "added" || change.type === "modified") &&
              change.doc.data().gameStatusNo == 1
            ) {
              this.gameStatusNo = 3;
            } else if (
              (change.type === "added" || change.type === "modified") &&
              change.doc.data().gameStatusNo > 4 &&
              change.doc.data().gameStatusNo < 9
            ) {
              if (change.doc.data().gameStatusNo === 5) {
                setTimeout(() => {
                  this.gameStatusNo = change.doc.data().gameStatusNo;
                  this.winnerSoundEffect();
                }, 3000);
              } else {
                this.gameStatusNo = change.doc.data().gameStatusNo;
              }
            }
          });
        });
    },
    getOpponentWaitStopWatch() {
      db.collection("game_waits")
        .where("gameNo", "==", this.gameNo)
        .where("waitingPlayer", "==", this.currentUser.email)
        .get()
        .then(docs => {
          docs.forEach(doc => {
            let dueSeconds = doc.data().due.seconds;
            this.calcOpponentRemainingTime(dueSeconds);
          });
        });
    },
    deleteOpponentWaitStopWatch() {
      return new Promise((resolve, reject) => {
        db.collection("game_waits")
          .where("gameNo", "==", this.gameNo)
          .where("waitingPlayer", "in", [
            this.currentUser.email,
            this.opponent.email
          ])
          .get()
          .then(docs => {
            docs.forEach(doc => {
              db.collection("game_waits")
                .doc(doc.id)
                .delete();
            });
          })
          .then(() => resolve(true))
          .catch(() => reject(false));
      });
    },
    createMovementWaitStopWatch() {
      return new Promise((resolve, reject) => {
        let now = new Date();
        let waitingTime = 120 * 1000;
        let due = new Date(now.getTime() + waitingTime);
        db.collection("game_waits")
          .add({
            gameNo: this.gameNo,
            movingPlayer: this.currentUser.email,
            due: due
          })
          .then(() => resolve(true))
          .catch(() => reject(false));
      });
    },
    getMovementWaitStopWatch() {
      db.collection("game_waits").onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (
            (change.type == "modified" || change.type == "added") &&
            change.doc.data().gameNo == this.gameNo &&
            change.doc.data().movingPlayer
          ) {
            let dueSeconds = change.doc.data().due.seconds;
            this.moveDueDate = change.doc.data().due.seconds;
            this.calcMovementRemainingTime(dueSeconds);
            this.moveOrderChangeStatus = true;
            if (this.moveOrder === this.currentUser.email) {
              console.log("hamle sırası:" + this.currentUser.email);
              this.$session.set("isMakeMove", true);
            }
          } else if (
            change.type === "removed" &&
            change.doc.data().gameNo == this.gameNo &&
            change.doc.data().movingPlayer
          ) {
            this.isMoveStopwatchExpired = true;
            this.moveOrderChangeStatus = false;
            this.moveOrder =
              this.moveOrder === this.currentUser.email
                ? this.opponent.email
                : this.currentUser.email;
          }
        });
      });
    },

    deleteMovementWaitStopWatch() {
      return new Promise((resolve, reject) => {
        db.collection("game_waits")
          .where("gameNo", "==", this.gameNo)
          .where("movingPlayer", "in", [
            this.currentUser.email,
            this.opponent.email
          ])
          .get()
          .then(docs => {
            docs.forEach(doc => {
              db.collection("game_waits")
                .doc(doc.id)
                .delete();
            });
          })
          .then(() => resolve(true))
          .catch(() => reject(false));
      });
    },
    checkOpponentWaitStopWatch() {
      return new Promise((resolve, reject) => {
        db.collection("game_waits")
          .where("gameNo", "==", this.gameNo)
          .where("waitingPlayer", "==", this.currentUser.email)
          .get()
          .then(doc => {
            if (doc.size > 0) {
              return true;
            } else {
              return false;
            }
          })
          .then(status => resolve(status))
          .catch(error => reject(error));
      });
    },
    checkMovementWaitStopWatch() {
      return new Promise((resolve, reject) => {
        db.collection("game_waits")
          .where("gameNo", "==", this.gameNo)
          .where("movingPlayer", "in", [
            this.currentUser.email,
            this.opponent.email
          ])
          .get()
          .then(doc => {
            if (doc.size > 0) {
              return true;
            } else {
              return false;
            }
          })
          .then(status => resolve(status))
          .catch(error => reject(error));
      });
    },
    calcMovementRemainingTime(dueSeconds) {
      if (!this.isGameOver) {
        window.clearTimeout(this.timeoutHandleMove);
        let remainingTime = this.calcDateDifference(dueSeconds);
        this.moveScaleCSS = "scale-in";
        this.isMoveStopwatchExpired = false;
        if (remainingTime > 0) {
          var date = new Date(remainingTime);

          this.moveCountDown = this.createRemainingTimeFormat(date);
          this.timeoutHandleMove = setTimeout(() => {
            this.calcMovementRemainingTime(dueSeconds);
          }, 1000);
        } else {
          window.clearTimeout(this.timeoutHandleMove);
          if (!this.isMoveStopwatchExpired) {
            this.moveScaleCSS = "scale-out";
            this.isMoveStopwatchExpired = true;
            this.changePlayer();
            setTimeout(() => {
              this.moveScaleCSS = "scale-in";
            }, 1000);
            if (this.moveOrder === this.currentUser.email) {
              this.increaseWaitingCount();
              this.updatePlayerGameTime();
              this.deleteMovementWaitStopWatch().then(() => {
                setTimeout(() => {
                  if (this.winnerPlayer === null) {
                    this.changeMoveOrder();
                    this.createMovementWaitStopWatch();
                  }
                }, 2000);
              });
            }
          }
        }
      }
    },
    increaseWaitingCount() {
      if (this.startingPlayer === this.currentUser.email) {
        db.collection("game_rooms")
          .doc(this.gameNo)
          .get()
          .then(doc => {
            db.collection("game_rooms")
              .doc(doc.id)
              .update({
                redWaitingCount: doc.data().redWaitingCount + 1
              });
          });
      } else {
        db.collection("game_rooms")
          .doc(this.gameNo)
          .get()
          .then(doc => {
            db.collection("game_rooms")
              .doc(doc.id)
              .update({
                greenWaitingCount: doc.data().greenWaitingCount + 1
              });
          });
      }
    },
    getWaitingCount() {
      db.collection("game_rooms")
        .where("gameNo", "==", this.gameNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            this.redWaitingCount = change.doc.data().redWaitingCount;
            this.greenWaitingCount = change.doc.data().greenWaitingCount;
          });
          if (this.winnerPlayer === null) {
            this.checkWaitingCount();
          }
        });
    },
    getWaitingCountStatus() {
      let waitingCountStatus = null;
      if (this.redWaitingCount > 2) {
        this.gameStatusNo = 8;
        waitingCountStatus = 1;
      } else if (this.greenWaitingCount > 2) {
        this.gameStatusNo = 8;
        waitingCountStatus = 2;
      }
      return waitingCountStatus;
    },
    checkWaitingCount() {
      if (this.getWaitingCountStatus() == 1) {
        if (
          this.currentUser.email !== this.startingPlayer &&
          this.winnerPlayer === null
        ) {
          this.gameCompleted();
        }
      } else if (this.getWaitingCountStatus() === 2) {
        if (
          this.currentUser.email === this.startingPlayer &&
          this.winnerPlayer === null
        ) {
          this.gameCompleted();
        }
      }
    },
    calcOpponentRemainingTime(dueSeconds) {
      window.clearTimeout(this.timeoutHandleGameStart);
      let remainingTime = this.calcDateDifference(dueSeconds);
      if (remainingTime > 0) {
        var date = new Date(remainingTime);
        this.gameStartCountDown = this.createRemainingTimeFormat(date);
        this.timeoutHandleGameStart = setTimeout(() => {
          this.calcOpponentRemainingTime(dueSeconds);
        }, 1000);
      } else {
        this.isOpponentStopwatchExpired = true;
        window.clearTimeout(this.timeoutHandleGameStart);
        this.deleteOpponentWaitStopWatch();
        this.increaseScore(this.currentUser.email);
        this.deleteGame();
        this.deleteNotifications();
        this.updatePlayersPlayingStatus(false);
        this.winnerPlayer = this.currentUser.email;
        this.gameStatusNo = 4;
      }
    },
    createRemainingTimeFormat(date) {
      let minutes =
        date.getMinutes() > 9 ? date.getMinutes() : "0" + date.getMinutes();
      let seconds =
        date.getSeconds() > 9 ? date.getSeconds() : "0" + date.getSeconds();
      return "00:" + minutes + ":" + seconds;
    },
    calcDateDifference(dueSeconds) {
      let due = new Date(dueSeconds * 1000).getTime();
      let now = new Date().getTime();
      return due - now;
    },
    getMovesList() {
      db.collection("movements")
        .where("gameNo", "==", this.gameNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === "added" || change.type === "modified") {
              let doc = change.doc.data();
              let movementIndex = this.getMoveIndex(doc.row, doc.col);
              if (!this.checkMovementIndex(movementIndex)) {
                if (doc.color.includes("animated")) {
                  this.movements.push({
                    row: doc.row,
                    col: doc.col,
                    color: doc.color
                  });
                  this.activePlayer = doc.activePlayer;
                  this.playerNo = doc.playerNo;
                  this.increasePlayerMoves();
                }
              } else {
                console.log(doc.row,doc.col,doc.color)
                this.movements[movementIndex].color = doc.color;
              }
            }
          });
        });
    },
    checkGameRoom() {
      db.collection("game_rooms")
        .doc(this.gameNo)
        .get()
        .then(doc => {
          if (!doc.exists) {
            this.updatePlayersPlayingStatus(false);
            this.deleteGameSession();
            this.$router.push({ name: "Home" });
          }
        });
    },
    PlayersCompletionStatusAlert() {
      if (
        this.$session.get("isPlayersCompleted") === undefined ||
        this.$session.get("isPlayersCompleted") === false
      ) {
        this.notificationAlert(
          "success",
          "Kadro Tamamlandı",
          "Rakip oyuncu oyuna dahil oldu.Oyun başladı."
        );
      }
    },

    notificationAlert(messageType, title, text) {
      this.$notify({
        group: "alert",
        title: title,
        text: text,
        type: messageType
      });
    },
    openExitGameConfirmModal() {
      if (this.isPlayersCompleted) {
        this.gameStatusNo = 1;
      } else {
        this.gameStatusNo = 2;
      }
    },
    modalClose() {
      this.gameStatusNo = null;
    },
    exitGame() {
      this.updatePlayersPlayingStatus(false);
      if (this.gameStatusNo == 1) {
        this.changePlayersCompletionStatus(false);
        this.deleteMovementWaitStopWatch();
        this.changeGameStatusNo(1);
        this.deleteNotifications();
        this.addWinnerPlayer(this.opponent.email);
        this.increaseScore(this.opponent.email);
      } else if (this.gameStatusNo === 2) {
        this.gameStatusNo = 0;
        this.deleteNotifications();
        this.deleteGame();
        this.deleteOpponentWaitStopWatch();
      } else if (this.gameStatusNo === 3) {
        this.deleteGameMoves();
        this.deleteGame();
      } else if (this.gameStatusNo === 4) {
        this.deleteNotifications();
        this.deleteGame();
      } else if (
        this.gameStatusNo === 5 ||
        this.gameStatusNo === 6 ||
        this.gameStatusNo === 8
      ) {
        this.changePlayersCompletionStatus(false);
        this.changeGameStatusNo(7);
        this.deleteNotifications();
      } else if (this.gameStatusNo === 7) {
        this.deleteGameMoves();
        this.deleteNotifications();
        this.deleteGame();
      }

      window.clearTimeout(this.timeoutHandleMove);
      window.clearTimeout(this.timeoutHandleGameStart);
      this.deleteGameSession();
      this.$router.push({ name: "Home" });
    },
    deleteNotifications() {
      db.collection("notifications")
        .where("receiverEmail", "==", this.currentUser.email)
        .where("senderEmail", "==", this.opponent.email)
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
            .where("receiverEmail", "==", this.opponent.email)
            .where("senderEmail", "==", this.currentUser.email)
            .get()
            .then(notifications => {
              notifications.forEach(notification => {
                db.collection("notifications")
                  .doc(notification.id)
                  .delete();
              });
            });
        });
    },
    changePlayersCompletionStatus(status) {
      db.collection("game_rooms")
        .doc(this.gameNo)
        .update({
          isPlayersCompleted: status
        });
    },
    changeGameStatusNo(no) {
      return new Promise((resolve, reject) => {
        db.collection("game_rooms")
          .doc(this.gameNo)
          .update({
            gameStatusNo: no
          })
          .then(() => resolve(true))
          .catch(() => reject(false));
      });
    },
    deleteGame() {
      db.collection("game_rooms")
        .doc(this.gameNo)
        .delete();
    },
    deleteGameSession() {
      this.$session.remove("opponentUser");
      this.$session.remove("gameNo");
      this.$session.remove("isPlayersCompleted");
    },
    newGame() {
      this.deleteGameMoves().then(() => {
        this.resetGameRoomData();
      });
      setTimeout(() => {
        this.createMovementWaitStopWatch();
      }, 1500);
    },
    deleteGameMoves() {
      return new Promise((resolve, reject) => {
        db.collection("movements")
          .where("gameNo", "==", this.gameNo)
          .get()
          .then(movements => {
            movements.forEach(doc => {
              db.collection("movements")
                .doc(doc.id)
                .delete();
            });
          })
          .then(status => resolve(status))
          .catch(error => reject(error));
      });
    },
    resetGameRoomData() {
      return new Promise((resolve, reject) => {
        if (this.winnerPlayer) {
          db.collection("game_rooms")
            .doc(this.gameNo)
            .update({
              winnerPlayer: null,
              moveOrder: this.currentUser.email,
              gameStatusNo: 0,
              redWaitingCount: 0,
              greenWaitingCount: 0,
              redPlayerGameTime: 0,
              greenPlayerGameTime: 0
            })
            .then(() => resolve(true))
            .catch(() => reject(false));
        }
      });
    },
    resetGameData() {
      this.moveCountDown = null;
      this.isMoveStopwatchExpired = false;
      this.isOpenMoveCountDownAlert = true;
      this.isGameOver = false;
      this.gameStatusNo = null;
      this.quadPositions = [];
      this.movements = [];
    },
    isItMyTurn() {
      if (
        this.moveOrder === this.currentUser.email &&
        this.$session.get("isMakeMove") === true
      ) {
        return true;
      } else {
        return false;
      }
    },
    isGameStarted() {
      if (this.isPlayersCompleted) {
        return true;
      } else {
        return false;
      }
    },

    makeMove(event) {
      if (this.isMakeMove()) {
        this.zIndexStyle = true;
        this.moveScaleCSS = "scale-out";
        setTimeout(() => {
          this.moveScaleCSS = "scale-in";
        }, 1000);
        setTimeout(() => {
          this.zIndexStyle = false;
        }, 1500);
        this.movementSoundEffect();
        const col = parseInt(event.target.attributes.col.value);
        let bottomRow = this.findBottomRow(col);
        if (bottomRow) {
          this.row = bottomRow;
          this.col = col;
          this.color = this.getPlayerColor();
          this.playerNo = this.activePlayer;
          this.changePlayer();
          this.saveMove();
          this.updatePlayerGameTime();
          this.$session.set("isMakeMove", false);
          window.clearTimeout(this.timeoutHandleMove);
          if (!this.isMoveStopwatchExpired && this.winnerPlayer === null) {
            this.isMoveStopwatchExpired = true;
            this.deleteMovementWaitStopWatch().then(() => {
              setTimeout(() => {
                this.changeMoveOrder();
                this.createMovementWaitStopWatch();
              }, 10);
            });
          }
        } else {
          this.notificationAlert(
            "error",
            "Uyarı",
            "Hamle yapmak istediğiniz satır dolu."
          );
        }
      }
    },
    isMakeMove() {
      if (this.isGameStarted()) {
        if (this.isItMyTurn()) {
          return true;
        } else {
          this.notificationAlert(
            "error",
            "Hamle Sırası",
            "Hamle sırası rakip oyuncuda.Hamle yapamazsınız!"
          );
          return false;
        }
      } else {
        this.notificationAlert(
          "error",
          "Rakip Bekleniliyor...",
          "Rakip oyuncu " + this.opponent.username + " oyuna dahil olmadı."
        );
        return false;
      }
    },
    findBottomRow(col) {
      for (let row = 6; row > 0; row--) {
        let cellUsageStatus = this.isCellUsed(row, col);
        if (!cellUsageStatus) {
          return row;
        }
      }
      return false;
    },
    movementSoundEffect() {
      var sound = new Audio(MovementSoundFile);
      sound.play();
    },
    getPlayerColor() {
      if (this.currentUser.email === this.startingPlayer) {
        return "bg-red animated bounceInDown";
      } else {
        return "bg-green  animated bounceInDown";
      }
    },
    changePlayer() {
      if (this.activePlayer == 1) {
        this.activePlayer = 2;
      } else if (this.activePlayer == 2) {
        this.activePlayer = 1;
      }
    },
    saveMove() {
      let movementIndex = this.getMoveIndex(this.row, this.col);
      if (!this.checkMovementIndex(movementIndex)) {
        db.collection("movements")
          .add({
            row: this.row,
            col: this.col,
            color: this.color,
            activePlayer: this.activePlayer,
            playerNo: this.playerNo,
            gameNo: this.gameNo,
            timestamp: Date.now()
          })
          .then(() => {
            this.getLastMovement();
          });
      }
    },
    updatePlayerGameTime() {
      let passingTime = this.calcDateDifference(this.moveDueDate);
      passingTime = 120 - Math.round(passingTime / 1000);
      if (this.startingPlayer === this.currentUser.email) {
        db.collection("game_rooms")
          .doc(this.gameNo)
          .get()
          .then(doc => {
            db.collection("game_rooms")
              .doc(this.gameNo)
              .update({
                redPlayerGameTime: doc.data().redPlayerGameTime + passingTime
              });
          });
      } else {
        db.collection("game_rooms")
          .doc(this.gameNo)
          .get()
          .then(doc => {
            db.collection("game_rooms")
              .doc(this.gameNo)
              .update({
                greenPlayerGameTime:
                  doc.data().greenPlayerGameTime + passingTime
              });
          });
      }
    },
    getPlayerGameTime(winnerPlayer) {
      return new Promise((resolve, reject) => {
        db.collection("game_rooms")
          .doc(this.gameNo)
          .get()
          .then(doc => {
            if (winnerPlayer === this.startingPlayer) {
              return doc.data().redPlayerGameTime;
            } else {
              return doc.data().greenPlayerGameTime;
            }
          })
          .then(val => resolve(val))
          .catch(error => reject(error));
      });
    },
    changeMoveOrder() {
      var ref = db.collection("game_rooms").doc(this.gameNo);
      ref.update({
        moveOrder: this.opponent.email
      });
    },
    winnerSoundEffect() {
      var sound = new Audio(WinnerSoundFile);
      sound.play();
    },

    getMoveOrder() {
      db.collection("game_rooms")
        .where("gameNo", "==", this.gameNo)
        .onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type == "modified" || change.type == "added") {
              this.moveOrder = change.doc.data().moveOrder;
            }
          });
        });
    },
    getLastMovement() {
      db.collection("movements")
        .orderBy("timestamp")
        .limitToLast(1)
        .get()
        .then(() => {
          this.isGameWinned(this.row, this.col);
        });
    },
    getMoveIndex(row, col) {
      return this.movements.findIndex(movement => {
        return movement.row === row && movement.col === col;
      });
    },
    checkMovementIndex(movementIndex) {
      if (movementIndex === -1) {
        return false;
      } else {
        return true;
      }
    },

    checkCross(rowNo, colNo) {
      this.quadPositions = [];
      let cellCount = 0;
      cellCount = this.checkCrossDownLeft(rowNo, colNo, cellCount);
      if (this.isConnectionFourCompleted(cellCount)) {
        this.gameCompleted();
      }

      cellCount = this.checkCrossUpRight(rowNo, colNo, cellCount);
      if (this.isConnectionFourCompleted(cellCount)) {
        this.gameCompleted();
      }
      cellCount = 0;
      this.quadPositions = [];
      cellCount = this.checkCrossDownRight(rowNo, colNo, cellCount);
      if (this.isConnectionFourCompleted(cellCount)) {
        this.gameCompleted();
      }
      cellCount = this.checkCrossUpLeft(rowNo, colNo, cellCount);
      if (this.isConnectionFourCompleted(cellCount)) {
        this.gameCompleted();
      }
    },
    checkCrossUpLeft(rowNo, colNo, cellCount) {
      let colorNo = 0;
      rowNo--;
      for (let col = colNo - 1; col > 0; col--) {
        colorNo = this.getCellColor(rowNo, col);
        if (colorNo == this.playerNo) {
          this.quadPositions.push({ row: rowNo, col: col });
          cellCount++;
          if (this.isConnectionFourCompleted(cellCount)) {
            return 4;
          }
        } else {
          return cellCount;
        }
        rowNo--;
      }
      return cellCount;
    },
    checkCrossDownRight(rowNo, colNo, cellCount) {
      let colorNo = 0;
      for (let col = colNo; col < 9; col++) {
        colorNo = this.getCellColor(rowNo, col);
        if (colorNo == this.playerNo) {
          this.quadPositions.push({ row: rowNo, col: col });
          cellCount++;
          if (this.isConnectionFourCompleted(cellCount)) {
            return 4;
          }
        } else {
          return cellCount;
        }
        if (rowNo < 7) {
          rowNo++;
        }
      }
      return cellCount;
    },
    checkCrossDownLeft(rowNo, colNo, cellCount) {
      let colorNo = 0;
      for (let col = colNo; col > 0; col--) {
        colorNo = this.getCellColor(rowNo, col);
        if (colorNo == this.playerNo) {
          this.quadPositions.push({ row: rowNo, col: col });
          cellCount++;
          if (this.isConnectionFourCompleted(cellCount)) {
            return 4;
          }
        } else {
          return cellCount;
        }
        if (rowNo < 7) {
          rowNo++;
        }
      }
      return cellCount;
    },
    checkCrossUpRight(rowNo, colNo, cellCount) {
      let colorNo = 0;
      rowNo--;
      for (let col = colNo + 1; col < 9; col++) {
        colorNo = this.getCellColor(rowNo, col);
        if (colorNo == this.playerNo) {
          this.quadPositions.push({ row: rowNo, col: col });
          cellCount++;
          if (this.isConnectionFourCompleted(cellCount)) {
            return 4;
          }
        } else {
          return cellCount;
        }
        if (rowNo > 0) {
          rowNo--;
        }
      }
      return cellCount;
    },
    checkVertical(rowNo, colNo) {
      let cellCount = this.checkVerticalUp(rowNo, colNo);
      if (this.isConnectionFourCompleted(cellCount)) {
        this.gameCompleted();
      }
    },
    checkVerticalUp(rowNo, colNo) {
      let cellCount = 0,
        colorNo = 0;
      for (let row = rowNo; row < 7; row++) {
        colorNo = this.getCellColor(row, colNo);
        if (colorNo == this.playerNo) {
          this.quadPositions.push({
            row: row,
            col: colNo
          });
          cellCount++;
          if (this.isConnectionFourCompleted(cellCount)) {
            return 4;
          }
        } else {
          return cellCount;
        }
      }
      return cellCount;
    },
    checkHorizontal(rowNo, colNo) {
      this.quadPositions = [];
      let cellCount = this.checkHorizontalLeft(rowNo, colNo);
      if (this.isConnectionFourCompleted(cellCount)) {
        this.gameCompleted();
      } else {
        cellCount = this.checkHorizontalRight(cellCount, rowNo, colNo);
        if (this.isConnectionFourCompleted(cellCount)) {
          this.gameCompleted();
        }
      }
    },

    checkHorizontalRight(cellCount, rowNo, colNo) {
      let colorNo = 0;
      for (let col = colNo + 1; col < 9; col++) {
        colorNo = this.getCellColor(rowNo, col);
        if (colorNo == this.playerNo) {
          this.quadPositions.push({
            row: rowNo,
            col: col
          });
          cellCount++;
          if (this.isConnectionFourCompleted(cellCount)) {
            return 4;
          }
        } else {
          return cellCount;
        }
      }
    },
    checkHorizontalLeft(rowNo, colNo) {
      let cellCount = 0,
        colorNo = 0;
      for (let col = colNo; col > 0; col--) {
        colorNo = this.getCellColor(rowNo, col);
        if (colorNo == this.playerNo) {
          this.quadPositions.push({
            row: rowNo,
            col: col
          });
          cellCount++;
          if (this.isConnectionFourCompleted(cellCount)) {
            return 4;
          }
        } else {
          return cellCount;
        }
      }
      return cellCount;
    },

    isConnectionFourCompleted(cellCount) {
      if (cellCount == 4) {
        return true;
      } else {
        return false;
      }
    },

    isCellUsed(row, col) {
      if (this.getCellColor(row, col) > 0) {
        return true;
      } else {
        return false;
      }
    },
    getCellColor(row, col) {
      const cell = this.movements.find(
        movement => movement.row == row && movement.col == col
      );
      if (cell) {
        if (cell.color.includes("bg-red")) {
          return 1;
        } else if (cell.color.includes("bg-green")) {
          return 2;
        } else {
          return 0;
        }
      }
    },
    setColor(row, col) {
      const cell = this.movements.find(
        movement => movement.row == row && movement.col == col
      );
      if (cell) {
        return cell.color;
      }
      return "";
    },

    increasePlayerMoves() {
      if (this.playerNo == 1) {
        this.redMoveCount++;
      } else if (this.playerNo == 2) {
        this.greenMoveCount++;
      }
    },
    gameCompleted() {
      this.startQuadAnimation();
      console.log("uzunluk:"+this.quadPositions.length)
      this.isGameOver = true;
      this.isMoveStopwatchExpired = true;
      this.isOpenMoveCountDownAlert = false;
      this.greenMoveCount = 0;
      this.redMoveCount = 0;
      this.activePlayer = null;
      this.playerNo = null;
      this.moveOrder = null;
      this.moveCountDown = null;
      if (this.gameStatusNo === 8) {
        this.changeGameStatusNo(8);
      } else {
        this.changeGameStatusNo(5);
      }
      this.addWinnerPlayer(this.currentUser.email);
      this.increaseScore(this.currentUser.email);
      this.deleteMovementWaitStopWatch();
    },
    startQuadAnimation() {
      console.log(this.quadPositions.length);
      this.quadPositions.forEach(cell => {
        console.log(cell.row, cell.col);
        db.collection("movements")
          .where("gameNo", "==", this.gameNo)
          .where("row", "==", cell.row)
          .where("col", "==", cell.col)
          .get()
          .then(querySnapshot =>
            querySnapshot.forEach(doc => {
              db.collection("movements")
                .doc(doc.id)
                .update({
                  color: "dortluAnimasyon"
                });
            })
          );
      });
    },
    addWinnerPlayer(player) {
      this.checkWinnerPlayer().then(status => {
        if (status === true) {
          db.collection("game_rooms")
            .doc(this.gameNo)
            .update({
              winnerPlayer: player
            });
        }
      });
    },
    calcScore(value) {
      value = 24 - Math.round(value / 60);
      return value > 1 ? value : 1;
    },
    checkWinnerPlayer() {
      return new Promise((resolve, reject) => {
        db.collection("game_rooms")
          .doc(this.gameNo)
          .get()
          .then(doc => {
            if (doc.data().winnerPlayer === null) {
              return true;
            } else {
              return false;
            }
          })
          .then(val => resolve(val))
          .catch(error => reject(error));
      });
    },
    increaseScore(playerEmail) {
      if (this.isPlayersCompleted) {
        this.checkWinnerPlayer().then(status => {
          if (status === true) {
            this.getPlayerGameTime(playerEmail).then(value => {
              let score = this.calcScore(value);
              db.collection("scores")
                .where("email", "==", playerEmail)
                .get()
                .then(querySnapshot => {
                  querySnapshot.forEach(doc => {
                    db.collection("scores")
                      .doc(doc.id)
                      .update({
                        score: doc.data().score + score
                      });
                  });
                });
            });
          }
        });
      } else {
        db.collection("scores")
          .where("email", "==", playerEmail)
          .get()
          .then(querySnapshot => {
            querySnapshot.forEach(doc => {
              db.collection("scores")
                .doc(doc.id)
                .update({
                  score: doc.data().score + 24
                });
            });
          });
      }
    },
    isGameWinned(row, col) {
      var isCheck = false;
      if (this.playerNo == 1) {
        if (this.redMoveCount >= 4) {
          isCheck = true;
        }
      } else if (this.playerNo == 2) {
        if (this.greenMoveCount >= 4) {
          isCheck = true;
        }
      }
      if (isCheck) {
        this.checkVertical(row, col);
        if (!this.isGameOver) this.checkHorizontal(row, col);
        if (!this.isGameOver) this.checkCross(row, col);
      }
      if (this.winnerPlayer === null && this.movements.length === 48) {
        this.addWinnerPlayer(false);
        this.isGameOver = true;
        this.changeGameStatusNo(6);
      }
    }
  }
};
</script>
<style lang="css" scoped >
@import "../assets/css/dortleme.css";
@import "../assets/css/all.css";
</style>