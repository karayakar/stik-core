window.stik || (window.stik = {});

(function() {
  if (stik.$$manager)
    throw "Stik.js is already loaded. Check your requires ;)";

  stik.$$manager = new stik.Manager({
    $courier: new stik.Courier,
    $urlState: new stik.UrlState
  });

  stik.register = function(controller, action, executionUnit){
    stik.$$manager.$register(controller, action, executionUnit);
  };

  stik.bindLazy = function(){
    this.$$manager.$buildContexts();
  };
})();
