angular.module('myApp.directives', [])
.directive('spriteSheetRunner', [ '$rootScope', '$timeout', function ($rootScope, $timeout) {
       "use strict";
       return {
           restrict : 'EAC',
           replace : true,
           scope : {
            'frame' : '=',
            'id' : '=',
            'stage' : '='
           },
           template: "<canvas width='800' height='600' style='margin-top:100px;'></canvas>",
           link: function (scope, element, attribute) {
               var w, h, loader, manifest, background, character1, ground, text, text1, text2, update, character2, txt;
               drawFrame();
               $rootScope.$on('rerender-canvas', function(event, idx){
                  if(idx && idx!=scope.id) return;
                  drawFrame();
               });
               function drawFrame() {
                  //drawing the game canvas from scratch here
                  //In future we can pass stages as param and load indexes from arrays of background elements etc
                  if (scope.stage) {
                     scope.stage.autoClear = true;
                     scope.stage.removeAllChildren();
                     scope.stage.update();
                  } else {
                     scope.stage = new createjs.Stage(element[0]);
                  }
                  w = scope.stage.canvas.width;
                  h = scope.stage.canvas.height;
                  createjs.Touch.enable(scope.stage);
                  manifest = [
                      {src: scope.frame.character1, id: "character1"},
                      {src: scope.frame.background, id: "background"},
                      {src: scope.frame.character2, id: "character2"}
                  ];
                  loader = new createjs.LoadQueue(false);
                  loader.addEventListener("complete", handleComplete);
                  loader.loadManifest(manifest, true, "/");

                  scope.stage.enableMouseOver(10);
                  scope.stage.mouseMoveOutside = true;
                  scope.stage.on("stagemousemove", function(evt) {});
                  createjs.Ticker.addEventListener("tick", tick);                    
               }
               function handleComplete() {
                  var back = new createjs.Shape();
                  back.x = 0;back.y = 0;
                  back.graphics.beginBitmapFill(loader.getResult("background"),'repeat').drawRect(0,0,w,h)

                  character1 = new createjs.Bitmap(loader.getResult("character1"))
                  character1.x = scope.frame.character1Loc[0]; character1.y = scope.frame.character1Loc[1];
                  character1.name = "character1"
                  attachDragDropEvents(character1, character1.name)

                  character2 = new createjs.Bitmap(loader.getResult("character2"))
                  character2.x = scope.frame.character2Loc[0]; character2.y = scope.frame.character2Loc[1];
                  character2.name = "character2"
                  attachDragDropEvents(character2, character2.name)

                  var dragger  = addTextBubble("text1", scope.frame.text1, scope.frame.text1Loc[0], scope.frame.text1Loc[1]);
                  var dragger2 = addTextBubble("text2", scope.frame.text2, scope.frame.text2Loc[0], scope.frame.text2Loc[1]);

                  shadofy(character1)
                  shadofy(character2)

                  scope.stage.addChild(back, character1, character2, dragger, dragger2);
                  scope.stage.update();

                  $(scope.frame.id).attr('src',scope.stage.toDataURL());
               }
               function shadofy(obj){
                  var shadow = new createjs.Shadow("#000000", 5, 5, 10);
                  obj.shadow = shadow;
               }
               function addTextBubble(name, text, x, y) {
                  var bubble, txt;
                  bubble = new createjs.Shape();
                  bubble.graphics.beginFill('#fff');
                  bubble.graphics.drawRoundRect(0,0, 250,120, 20);
                  bubble.name = name; 
                  shadofy(bubble)

                  txt = new createjs.Text( text, "21px Arial", "#000" );
                  txt.regY = (( txt.getMeasuredHeight() ) * txt.scaleY -20) / 2;
                  txt.textAlign = 'center' 
                  txt.lineWidth = 240;
                  txt.mask = bubble;
                  txt.x = bubble.x + 125;
                  txt.y = 10;
                  txt.color = 'black';

                  var dragger = new createjs.Container();
                  dragger.x = x;
                  dragger.y = y;
                  dragger.addChild(bubble, txt);
                  attachDragDropEvents(dragger,name)  
                  return dragger;
               }
                var promise = false;
                scope.callup = function(name, x, y) {
                  if(promise){
                    $timeout.cancel(promise);
                  }
                  promise = $timeout(function() {
                    console.log('moved')
                    $rootScope.$broadcast('object-moved',{name:name,x:x, y:y});
                  },100);
                };
               function attachDragDropEvents(obj, name) {
                  obj.on("mousedown", function (evt) {
                    this.parent.addChild(this);
                    this.offset = {x: this.x - evt.stageX, y: this.y - evt.stageY};
                  });
                  // the pressmove event is dispatched when the mouse moves after a mousedown on the target until the mouse is released.
                  obj.on("pressmove", function (evt) {
                    this.x = evt.stageX + this.offset.x;
                    this.y = evt.stageY + this.offset.y;
                    // indicate that the stage should be updated on the next tick:
                    scope.callup(evt.target.name, this.x, this.y );
                    update = true;
                  });

                  obj.on("rollover", function (evt) {
                    this.scaleX = this.scaleY = this.scale * 1.5;
                    update = true;
                  });

                  obj.on("rollout", function (evt) {
                    this.scaleX = this.scaleY = this.scale;
                    update = true;
                  });

                  obj.on("click", function (evt) {
                    if(evt.target.name)
                      $rootScope.$broadcast('canvas-select',evt.target.name);
                  });

               }
               function handleJumpStart() {
                   character1.gotoAndPlay("jump");
               }
               function tick (event) {
                 // this set makes it so the stage only re-renders when an event handler indicates a change has happened.
                 if (update) {
                   update = false; // only update once
                   scope.stage.update(event);
                 }
               }
           }
       }
   }
]);
