![Stik.js Logo](https://raw.github.com/lukelex/stik.js/master/stik.js.png)

[![Build Status](https://travis-ci.org/stikjs/stik.js.png?branch=master)](https://travis-ci.org/stikjs/stik.js)
[![Code Climate](https://codeclimate.com/github/lukelex/stik.js.png)](https://codeclimate.com/github/lukelex/stik.js)
[![Coverage Status](https://coveralls.io/repos/lukelex/stik.js/badge.png)](https://coveralls.io/r/lukelex/stik.js)

An opinionated JS library that wires your JavaScript execution to your HTML templates by creating pseudo closures of execution and scoping. Allowing you to manage, in a more consistant way, your events `binding/unbind` and your DOM scope manipulation.

By splitting your logic into small specialized responsible actions, Stik.js will help you avoid both the gigantism and namespace hell on your JavaScripts.

##Controllers
With Stik.js you can define in your HTML which templates should be bound to a specific controller and action.

The `controller` function accepts three arguments:

* `ControllerName` (String) -> Could be either the name of the page or the section in which the template will reside;
* `ActionName` (String) -> The component name. Usually maps to the component's responsibility;
* `ExecutionUnit` (Function) -> The script where your component data interactions shall live;

```javascript
stik.controller("CharactesCtrl", "List", function($template){
  var supported, character;

  character = $template.getElementsByClassName('character');

  function clickHandler(event){
    supported = event.target.getAttribute('hero');
    alert("I'll support " + supported + "!!");
  };

  for (var i = 0; i < character.length; i++) {
    character[i].addEventListener('click', clickHandler);
  };
});
```

```html
<div id="characters-list" data-controller="CharactesCtrl" data-action="List">
  <h3>Sub Characters</h3>
  <ul>
    <li class="character" hero="Mario">Luigi</li>
    <li class="character" hero="Link">Zelda</li>
    <li class="character" hero="Samus">Baby Metroid</li>
  </ul>
</div>
```

You can even have multiple templates using the same controller and action.

```html
<div id="heroes-list" data-controller="BattleCtrl" data-action="List">
  <ul>
    <li>Mario</li>
    <li>Samus</li>
    <li>Link</li>
  </ul>
</div>

<div id="villains-list" data-controller="BattleCtrl" data-action="List">
  <ul>
    <li>Bowser</li>
    <li>Metroid</li>
    <li>Ganondorf</li>
  </ul>
</div>
```

```javascript
stik.controller("BattleCtrl", "List", function($template){
  var heroes = $template.getElementsByClassName('hero');

  function clickHandler(event){
    alert("It's me, " + event.target.textContent + "!! And I'm ready to fight!");
  };

  for (var i = 0; i < heroes.length; i++) {
    heroes[i].addEventListener('click', clickHandler);
  };
});
```

##Behaviors
With the `behavior` method you can create reusable behaviors that can be applyed in multiple components throughout you application. Or, you can add multiple behaviors to a same component. Those behaviors should only have the responsibility of adding visual interactions instead of doing data manipulations (which is the controller responsibility).

```javascript
stik.behavior("sparkle-input", function($template){
  $template.addEventListener("focus", function(){
    // apply some fancy visual behavior
  });
  $template.addEventListener("blur", function(){
    // remove some fancy visual behavior
  });
});

stik.behavior("some-other-behavior", function($template){
  // ...
});
```

The bind of a behavior to its component is achieved using css classes. Stik.js will prepend a `bh-` on the behavior's name. So it needs to be added in your css selector.

```html
  <input class="bh-sparkle-input bh-some-other-behavior" />
```

After a template is bound to any behavior it will get a new attribute signalling behaviors were successfully applied, like so:

```html
  <input class="bh-sparkle-input bh-some-other-behavior" data-behaviors="bh-sparkle-input bh-some-other-behavior" />
```

**important** the only modules that can't be injected in a behavior are $context and $viewBag.

##Dependency Injection
With Dependency Injection (DI), your dependencies are given to your object instead of your object creating or explicitly referencing them. This means the dependency injector can provide a different dependency based on the context of the situation. For example, in your tests it might pass a fake version of your services API that doesn't make requests but returns static objects instead, while in production it provides the actual services API.

Stik.js comes with a built-in DI engine that allows you to specify which modules your code cares about. These modules can be required in any order you want:

```javascript
// just one

stik.controller("BattleCtrl", "List", function($template){
  // ...
});

stik.controller("BattleCtrl", "List", function($context){
  // ...
});

// two

stik.controller("BattleCtrl", "List", function($context, $template){
  // ...
});

// three

stik.controller("BattleCtrl", "List", function($courier, $template, $context){
  // ...
});

// or nothing at all (why would you do that?!)

stik.controller("BattleCtrl", "List", function(){
  // ...
});
```

##Modules
Stik.js comes with a couple modules to help you organize your code, by separating their responsibilities. These modules can be injected in each controller, as needed.

###$template
Contains the HTML template (HTMLElement) that was bound to the current controller. This shall be used as the scope of **ALL** your DOM manipulation. Everything you need to access in the DOM to fullfill the role of the current controller action needs to be inside it. Using any HTML that doesn't reside in it is a violation of the Law of Demeter.

####Using it
```javascript
stik.controller("YourCtrl", "YourAction", function($template){
  // you can use plain JS to access the DOM
  $template.getElementsByClassName("my-elm");

  // and do your stuff
  ...
});
```

###$courier
Enables a controller to send and receive messages from another controller.

####Using it
```javascript
stik.controller("MessageCtrl", "Sender", function($courier){
  // delegate a new message to the controller responsible for it
  // can be either a String or a JS Object (POJO)
  $courier.$send("new-message", {
    your: "delegation"
  });
});

stik.controller("MessageCtrl", "Receiver", function($courier){
  // specify what messages this controller should expect
  $courier.$receive("new-message", function(msg){
    // do something with the message
    ...
  });
  // a message can be delivered to any number of controllers that
  // defines an expectation for it
});

stik.controller("MessageCtrl", "OneTimeReceiver", function($courier){
  // sometimes a controller needs to receive a message just once
  // the $receive method returns another method that can be called
  // to `unsubscribe` to further messages
  var unsubscribe = $courier.$receive("new-message", function(msg){
    ...
    unsubscribe();
    // this receiver will never again be called
  });
});
```

###$viewBag
Enables a controller to `$push` and `$pull` data in and out of its template. While pushing, `$viewBag` will only care about the values within the object passed.

####Using it
```javascript
stik.controller("MessageCtrl", "Revelation", function($viewBag){
  // the $push method receives an object
  // with the values that it will use
  $viewBag.$push({
    senderName: "Darth Vader",
    receiverName: "Luke Skywalker",
    message: "I'm your father!",
    customNOOO: "NOOOOOO!!!"
  });

  // use $pull to get bound data out of the template
  var dataset = $viewBag.$pull();
  // this will return an object with the following structure
  // {
  //   senderName: "Darth Vader",
  //   receiverName: "Luke Skywalker",
  //   message: "I'm your father!",
  //   customNOOO: "NOOOOOO!!!"
  // }
});
```
```html
<div data-controller="MessageCtrl" data-action="Revelation">
  <span data-bind="senderName"></span>
  <span data-bind="receiverName"></span>
  <span data-bind="message"></span>
  <input data-bind="customNOOO"/>
</div>
```

###$context
Each controller can be bound to 1 or more templates and vice-versa. For each bind that Stik.js is able to perform, a `context` object will be created holding some basic information about the current execution. For day-to-day development you don't need this module. But it's there if you want to spy on some low level stuff.

####Using it
```javascript
stik.controller("YourCtrl", "YourAction", function($context){
  ...
});
```

##Boundaries
External libraries, objects and functions can be added as injectable modules to Stik.js. With that you will be able to avoid referencing global defined variables within controllers or behaviors. This will make your code more testable, since you will be able to inject mocks that quacks like the original libraries.

###Object Boundaries:

```javascript
stik.boundary({
  as: "MyDataLibrary",
  from: "controller",
  to: {
    // your awesome data related object
    someAwesomeData: "Awesome!!",
    doSomeDataManipulation: function(){ return "Yay!"; }
  }
});

stik.boundary({
  as: "MyEffectsLibrary",
  from: "behavior",
  to: {
    // your awesome visual related obj
    fadeIn: function(elm){},
    fadeOut: function(elm){}
  }
});

stik.controller("AppCtrl", "List", function(MyDataLibrary){
  // here you can manipulate your data
  // using your external dependency
  MyDataLibrary.doSomeDataManipulation(); // "Yay!"
  MyDataLibrary.someAwesomeData; // "Awesome!!"
});

stik.behavior("fade-input", function($template, MyEffectsLibrary){
  // here you can attach your visual effects
  // using your external dependency

  MyEffectsLibrary.fadeIn($template);
  MyEffectsLibrary.fadeOut($template);
});
```

###Function Boundaries:

```javascript
stik.boundary({
  as: "GetTwitterFeed",
  from: "controller",
  to: function(){
    return ajaxLib.get("https://twitter.com/twitterapi");
  }
});

stik.boundary({
  as: "fadeIn",
  from: "behavior",
  to: function(elm){
    return applyFadeIn(elm);
  }
});

stik.controller("AppCtrl", "List", function(GetTwitterFeed, $viewBag){
  var feed = GetTwitterFeed();

  $viewBag.$push(feed);
});

stik.behavior("fade-input", function($template, fadeIn){
  fadeIn($template);
});
```

###Callable Boundaries
Callable Boundaries are functions that might depend Stik modules or other boundaries. They will be called with the required dependencies and their returned value will be passed on to whichever controller or behavior requiring it.

```javascript
stik.boundary({
  as: "SomeFunkyFunc",
  from: "controller",
  call: true,
  to: function($template){
    return doSomethingFunky($template);
  }
});

stik.controller("AppCtrl", "List", function(SomeFunkyFunc){
  SomeFunkyFunc // some funky value returned from the boundary
});
```

###Instantiable Boundaries:
Instantiable boundaries can be used when you might have dependencies on Stik modules or other boundaries and you need to maintain separate states between your controllers and/or behaviors.

```javascript
stik.boundary({
  as: "TwoWayDataBinding",
  from: "controller",
  inst: true,
  to: function($template, $viewBag, GetTwitterFeed){
    // this should be the obj constructor
    // that will receive whichever dependency you declare
    this.template = template;

    this.bindTo = function(myDataObj){
      // do your binding stuff
    };
  }
});

stik.controller("AppCtrl", "List", function(TwoWayDataBinding){
  // this will be a new instance of the TwoWayDataBinding class
  // that will have the $template as an instance variable
  TwoWayDataBinding.bindTo(SomeData);
});
```

##Helping Stik.js
###I found a bug!
If you found a repeatable bug then file an issue on [issues page](https://github.com/lukelex/stik.js/issues), preferably with a working example or repo.

###I have a new sugestion!
For Feature requests or followup on current tasks and development status check our [Trello Board](https://trello.com/b/KKddbfdU/stik-js). Feel free to comment there or file issues.

##Development
###Testing
```shell
$ grunt test
```

###Packing
```shell
$ grunt pack
```
