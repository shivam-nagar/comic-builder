var selectedFrame = null;
var selectedFrameIndex = 0;
var app = angular.module("ComicBuilderApp",['myApp.directives']);
app.controller("LayoutController", [ '$scope', '$rootScope', function($scope, $rootScope) {
    $scope.showPane = 1;
    $scope.selectedTab = 'overview';
    $rootScope.$on('switch-layout-tab', function(e, tab){
      console.log(tab)
      $scope.$apply(function(){
        $scope.selectedTab = tab;
      })
    })
}]);
app.controller("OverviewController", [ '$scope', '$rootScope', '$location', function($scope, $rootScope, $location) {
    $scope.selectedPanel = 0;
    $scope.$watch('selectedPanel', function(newVal){
      $('.carousel').carousel(newVal);
      $rootScope.$broadcast('selected-panel-changed', newVal);
    });
    $('.carousel').on('slide.bs.carousel', function (e) {
      var slideFrom = $(this).find('.active').index();
      var slideTo = $(e.relatedTarget).index();
      $scope.selectedPanel = slideTo;
      $rootScope.$broadcast('selected-panel-changed', slideTo);
    });

    $scope.generatePapaCanvas = function(){
      var stage = new createjs.Stage("papaCanvas")
      var bmp1 = new createjs.Bitmap($('#frame1').attr('src'))
      var bmp2 = new createjs.Bitmap($('#frame2').attr('src'))
      var bmp3 = new createjs.Bitmap($('#frame3').attr('src'))
      bmp1.x = 10;  bmp1.y = 10; bmp1.scaleX = 0.5; bmp1.scaleY = 0.5;
      bmp2.x = 420; bmp2.y = 10; bmp2.scaleX = 0.5; bmp2.scaleY = 0.5;
      bmp3.x = 830; bmp3.y = 10; bmp3.scaleX = 0.5; bmp3.scaleY = 0.5;

      stage.addChild(bmp1, bmp2, bmp3);
      stage.update();

      return stage.toDataURL();
    }
    $scope.uploading = false;
    $scope.saveComic = function(){
      $scope.uploading = true;
      var dataURL = $scope.generatePapaCanvas();
      $.ajax({
        type: "POST",
        url: "/add/",
        data: { 
           imgBase64: dataURL,
           title: $scope.title || "Untitled",
           subtitle: $scope.author || "Anonymous"
        }
      }).done(function(o) {
        $scope.$applyAsync( function(){
          $scope.uploading = false;
          console.log('saved'); 
          if(o.data && o.data.url){
            window.location.assign(o.data.url)
          }
        });
      });    
    }

}]);
app.controller("ComicStripController", [ '$scope', '$rootScope', '$timeout', '$location', '$anchorScroll',
  function($scope, $rootScope, $timeout, $location, $anchorScroll) {
    $scope.selectedObj = null;
    $scope.strip = [{
      background : '/static/img/backgrounds/1.png',
      character1 : '/static/img/characters/kids/2.png',
      character1Loc: [50, 300],
      character2 : '/static/img/characters/kids/14.png',
      character2Loc : [450, 300],
      text1 : "Hi there, I can tell you a story in 3 panels. All you need is a scene, characters and dialogs.",
      text1Loc: [50, 50],
      text2 : "And a title perhaps! Why dont you start by giving a title to your story and see us in next panel.",
      text2Loc : [500, 50],
      id : "#frame1",
      stage : null,
      reloading : false
    },{
      background : '/static/img/backgrounds/2.png',
      character1 : '/static/img/characters/kids/1.png',
      character1Loc: [50, 300],
      character2 : '/static/img/characters/kids/13.png',
      character2Loc : [450, 300],
      text1 : "Now that we have a title, let's pick characters for your story. \n Did you notice I changed my partner & location?",
      text1Loc: [50, 50],
      text2 : "Woah, where am I? I hope it's an intresting story I find myself in.",
      text2Loc : [500, 50],
      id : "#frame2",
      stage : null,
      reloading : false
    },{
      background : '/static/img/backgrounds/8.png',
      character1 : '/static/img/characters/kids/1.png',
      character1Loc: [50, 300],
      character2 : '/static/img/characters/kids/12.png',
      character2Loc : [450, 300],
      text1 : "Great to see you following through so far. Let's make a story worth sharing.",
      text1Loc: [50, 50],
      text2 : "Use the options below to modify this strip. Publish and Share your comic strip with us all. ",
      text2Loc : [500, 50],
      id : "#frame3",
      stage : null,
      reloading : false
    }];
    var timeoutObj = null;
    $rootScope.$on('update-scene', function(e, val){
      if($scope.strip[val].reloading) return;
      $scope.strip[val].reloading = true; 
      $timeout.cancel(timeoutObj);
      timeoutObj = $timeout(function(){
          $rootScope.$broadcast("rerender-canvas", selectedFrameIndex)
          $scope.strip[val].reloading = false;
      },250);

    });

    $rootScope.$on('object-moved', function(e, val){
      console.log('got move',val)
      switch(val.name){
        case 'character1':
          $scope.strip[selectedFrameIndex].character1Loc = [val.x, val.y];
          break;
        case 'character2':
          $scope.strip[selectedFrameIndex].character2Loc = [val.x, val.y];
          break;
        case 'text1':
          selectedFrame.text1Loc = [val.x, val.y];
          break;
        case 'text2':
          selectedFrame.text2Loc = [val.x, val.y];
          break;
      }
      $rootScope.$broadcast("rerender-canvas", selectedFrameIndex);
    })

    $scope.frameEvents = [];
    selectedFrame = $scope.strip[0];
    selectedFrameIndex = 0;
    $scope.idx = 0;

    $rootScope.$on('selected-panel-changed', function(e, val){
      $scope.detachEvents();
      selectedFrame = $scope.strip[val];
      selectedFrameIndex = val;
      $scope.$applyAsync(function(){ $scope.idx = val; });
      $scope.attachEvents(selectedFrame)
      $rootScope.$broadcast('switch-layout-tab-text','text')
    })

    $scope.attachEvents = function(){
      var handler1 = $rootScope.$on('canvas-select', function(e,val){
          if(val) 
            $scope.selectedObj = val
          else
            $scope.selectedObj = "background"

          switch(val) {
            case "character1":
            case "character2":
              $rootScope.$broadcast('switch-layout-tab','character')
              break;
            case "text1":
            case "text2":
              $rootScope.$broadcast('switch-layout-tab','text')
              $rootScope.$broadcast('switch-layout-tab-text','text')

              break;
          }
      });
      var handler2 = $rootScope.$on('background-changed', function(event, value){
        selectedFrame.background = value.img;
        $rootScope.$broadcast('rerender-canvas', selectedFrameIndex );
      })
      var handler3 = $rootScope.$on('character-changed', function(event, value){
        if($scope.selectedObj == "character2"){
          selectedFrame.character2 = value.img;
        } else {
          selectedFrame.character1 = value.img;
        }
        $rootScope.$broadcast('rerender-canvas', selectedFrameIndex );
      })
      var handler4 = $rootScope.$on('text-changed', function(event, value){
        if(value.index == 'text1')
          selectedFrame.text1 = value.text;
        if(value.index == 'text2')
          selectedFrame.text2 = value.text;
        $rootScope.$broadcast('rerender-canvas', selectedFrameIndex );
      })
      $scope.frameEvents.push(handler1, handler2, handler3, handler4);
    }
    $scope.detachEvents = function(){
      $scope.frameEvents.forEach(function(handler){
        handler();
      })
    }
  }
]);

app.controller("TextSetterController", [ '$scope', '$rootScope', function($scope, $rootScope) {
  $scope.initialize = function(){
    $scope.text1 = angular.copy(selectedFrame.text1);
    $scope.text2 = angular.copy(selectedFrame.text2);
  }
  $scope.initialize();
  $rootScope.$on('switch-layout-tab-text', function(e, tab){
    if(selectedFrame)
      $scope.$applyAsync(function(){
        $scope.initialize();
      });
  });

  $scope.$watch('text1', function(newVal){
    selectedFrame.text1 = newVal
    $scope.setBubbleText('newVal',0)
  })
  $scope.$watch('text2', function(newVal){
    selectedFrame.text2 = newVal
    $scope.setBubbleText('newVal',1)
  })
  $scope.setBubbleText = function(text, idx) {
    $scope.$applyAsync(function(){
      $rootScope.$emit('text-changed', { text: text, index: idx });
    })
  }
}]);
app.controller("BackgroundSelectController", [ '$scope', '$rootScope', 
  function($scope, $rootScope) {
    $scope.backgrounds = [
      { img:'/static/img/backgrounds/1.png' },
      { img:'/static/img/backgrounds/2.png' },
      { img:'/static/img/backgrounds/3.png' },
      { img:'/static/img/backgrounds/4.png' },
      { img:'/static/img/backgrounds/5.png' },
      { img:'/static/img/backgrounds/6.png' },
      { img:'/static/img/backgrounds/7.png' },
      { img:'/static/img/backgrounds/8.png' }
    ];
    $scope.setBackground = function(str){
      $rootScope.$emit('background-changed', str);
    }
  }
]);
app.controller("CharacterSelectController", ['$scope', '$rootScope', function($scope, $rootScope) {
    $scope.selectedCharacterIndex = 0;
    $scope.setCharacter = function(str){
      $rootScope.$emit('character-changed', str);
    }

    $scope.characters = [
    {
      name : 'Niku',
      postures : [
        { img:'/static/img/characters/niku/1.png' },
        { img:'/static/img/characters/niku/2.png' },
        { img:'/static/img/characters/niku/3.png' },
        { img:'/static/img/characters/niku/4.png' },
        { img:'/static/img/characters/niku/5.png' },
        { img:'/static/img/characters/niku/6.png' },
        { img:'/static/img/characters/niku/7.png' },
        { img:'/static/img/characters/niku/8.png' },
        { img:'/static/img/characters/niku/9.png' },
        { img:'/static/img/characters/niku/10.png' }
      ]
    },{
      name : 'Kids',
      postures : [
        { img:'/static/img/characters/kids/1.png' },
        { img:'/static/img/characters/kids/2.png' },
        { img:'/static/img/characters/kids/3.png' },
        { img:'/static/img/characters/kids/4.png' },
        { img:'/static/img/characters/kids/5.png' },
        { img:'/static/img/characters/kids/6.png' },
        { img:'/static/img/characters/kids/7.png' },
        { img:'/static/img/characters/kids/8.png' },
        { img:'/static/img/characters/kids/9.png' },
        { img:'/static/img/characters/kids/10.png' },
        { img:'/static/img/characters/kids/11.png' },
        { img:'/static/img/characters/kids/12.png' },
        { img:'/static/img/characters/kids/13.png' },
        { img:'/static/img/characters/kids/14.png' }
      ]
    },{
      name : 'Alto',
      postures : [
        { img:'/static/img/characters/stick/1.png' },
        { img:'/static/img/characters/stick/2.png' },
        { img:'/static/img/characters/stick/3.png' },
        { img:'/static/img/characters/stick/4.png' },
        { img:'/static/img/characters/stick/5.png' },
        { img:'/static/img/characters/stick/6.png' },
        { img:'/static/img/characters/stick/7.png' },
        { img:'/static/img/characters/stick/8.png' },
        { img:'/static/img/characters/stick/9.png' },
        { img:'/static/img/characters/stick/10.png' },
        { img:'/static/img/characters/stick/11.png' },
        { img:'/static/img/characters/stick/12.png' },
        { img:'/static/img/characters/stick/13.png' },
        { img:'/static/img/characters/stick/14.png' },
        { img:'/static/img/characters/stick/15.png' },
        { img:'/static/img/characters/stick/16.png' },
        { img:'/static/img/characters/stick/17.png' },
        { img:'/static/img/characters/stick/18.png' },
        { img:'/static/img/characters/stick/19.png' },
        { img:'/static/img/characters/stick/20.png' },
        { img:'/static/img/characters/stick/21.png' },
        { img:'/static/img/characters/stick/22.png' }]
    },{
      name : 'Others',
      postures : [
        { img:'/static/img/characters/others/1.png' },
        { img:'/static/img/characters/others/2.png' },
        { img:'/static/img/characters/others/3.png' },
        { img:'/static/img/characters/others/4.png' },
        { img:'/static/img/characters/others/5.png' },
        { img:'/static/img/characters/others/6.png' },
        { img:'/static/img/characters/others/7.png' },
        { img:'/static/img/characters/others/8.png' },
        { img:'/static/img/characters/others/9.png' },
        { img:'/static/img/characters/others/10.png' }
      ]
    }]
  }
]);
