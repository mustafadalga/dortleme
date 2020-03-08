

<template>
  <div id="game-modal">
    <div
      id="modal1"
      class="modal"
      :class="animatedCSS ? 'animated bounceInDown': 'animated bounceOutUp'"
      tabindex="0"
    >
      <div class="modal-content">
        <h4 class="center">Oyun Durumu</h4>
        <p>Kazanan Oyuncu</p>
      </div>
      <div class="modal-footer">
        <button class="btn purple darken-3 waves-green" @click="yeniOyun">Yeni Oyun</button>
        <button class="btn red btn-red" @click="oyundanCik">Oyundan Çık</button>
      </div>
    </div>
    <div
      class="modal-overlay"
      :class="animatedCSS ? 'animated bounceInDown': 'animated bounceOutUp'"
    ></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      animatedCSS: true
    };
  },
  methods: {
    yeniOyun() {
      this.$emit("yeniOyun");
    },
    oyundanCik() {
      this.animatedCSS = false;
      setTimeout(() => {
        this.$emit("modalClose", false);
      }, 500);
      //
    }
  }
};
</script>

<style>
.modal {
  z-index: 1003;
  display: block;
  opacity: 1;
  top: 10%;
  transform: scaleX(1) scaleY(1);
}
.modal-overlay {
  z-index: 1002;
  display: block;
  opacity: 0.5;
}
.btn-red{
  margin-left:.3em
}
</style>