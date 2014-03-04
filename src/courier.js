(function(){
  function Courier(){
    this.$$subscriptions = {};
  }

  Courier.method("$receive", function(box, opener){
    var subscription = new Subscription(box, opener);

    this.$$subscriptions[box] = (this.$$subscriptions[box] || []);
    this.$$subscriptions[box].push(subscription);

    return this.$unsubscribe.bind(this, subscription);
  });

  Courier.method("$unsubscribe", function(subscription){
    this.$$subscriptions[subscription.$$box] =
    this.$$subscriptions[subscription.$$box].filter(function(subs){
      return subs.$$id !== subscription.$$id;
    });
  });

  Courier.method("$send", function(box, message){
    var openers, i;

    openers = this.$$subscriptions[box];

    if (!openers || openers.length === 0) {
      throw "Stik: No receiver registered for " + box;
    }

    i = openers.length;
    while (i--) {
      openers[i].$$opener(message);
    }
  });

  function Subscription(box, opener){
    this.$$id = '#' + Math.floor(
      Math.random()*16777215
    ).toString(16);

    this.$$box    = box;
    this.$$opener = opener;
  }

  window.stik.Courier = Courier;

  window.stik.boundary({
    as: "$courier",
    from: "controller|behavior",
    to: new Courier()
  });
})();
