

<template>
  <div class="exit-game-modal">
    <div id="modal1" class="modal">
      <div class="modal-content">
        <h4>Oyun Çıkış</h4>
        <p>rakip oyuncu Mustafa oyundan çıktı</p>
        <p>Puanınız:34</p>
        <p>Oyundan çıkmak için Evet butonuna tıklayınız</p>
      </div>
      <div class="modal-footer">
        <button class="btn red btn-red" @click="oyundanCik">Evet</button>
      </div>
    </div>
    <div class="modal-overlay"></div>
  </div>
</template>

<script>
export default {
  name:'ExitGameOverModal',
  data() {
    return {
      
    };
  },
  methods: {
    oyundanCik() {
      this.$emit("oyunCikis",this.$options.name);
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
.modal-footer {
  text-align: center !important;
}
</style>