(function(){
  var behaviorKey = "data-behaviors", namePrefix = "bh";

  function Behavior(name, executionUnit){
    if (!name)                   { throw "name is missing"; }
    if (name.indexOf(" ") !== -1) { throw "invalid name. Please use dash(-) instead of spaces"; }
    if (!executionUnit)          { throw "executionUnit is missing"; }

    this.$$className     = name;
    this.$$name          = namePrefix + "-" + name;
    this.$$executionUnit = executionUnit;
  }

  Behavior.prototype.$load = function(template, modules, selector){
    modules.$template = new window.stik.Injectable(
      this.$wrapTemplate(template, selector)
    );

    var dependencies = this.$resolveDependencies(modules);

    this.$$executionUnit.apply({}, dependencies);
    this.$markAsApplyed(template);
  };

  Behavior.prototype.$wrapTemplate = function(template, selector) {
    return (selector ? selector(template) : template);
  };

  Behavior.prototype.$resolveDependencies = function(modules){
    var injector = new window.stik.Injector(
      this.$$executionUnit, modules
    );

    return injector.$resolveDependencies();
  };

  Behavior.prototype.$markAsApplyed = function(template){
    var behaviors;

    behaviors = template.getAttribute(behaviorKey);
    behaviors = ((behaviors || "") + " " + this.$$name).trim();

    template.setAttribute(behaviorKey, behaviors);
  };

  window.stik.Behavior = Behavior;
})();
