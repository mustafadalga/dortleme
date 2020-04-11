<template>
  <div  >
    <div
  
      class="modal red animated bounceInDown"
    >
      <div class="modal-content center white-text">
        <h5>Lütfen cihazını çevirin!</h5>
      </div>
    </div>
    <div
      class="modal-overlay animated bounceInDown"
    ></div>
  </div>
</template>

<script>
export default {
  name: "MobileWarningModal",
  data() {
    return {
    };
  },
};
</script>
 <style>
 .modal{
height: 50%;
top:25%;
display: flex;
align-items: center;
justify-content: center;
}
.modal-overlay{
  opacity: .9;
}
 </style>