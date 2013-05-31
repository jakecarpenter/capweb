//capture web


      var capture = (function(){

        //what are we looking at?
        var activeEvent;

        //the events 
        var events = [];

        //the cards
        var cards = {};

        //the users for this event
        var authors = {};

        //parse app key
        var parseAppId = 'JfuHcRkELk91tbejwxCllYPRyauk3s4jCnTKQjah';

        //parse rest key
        var parseRestKey = 'LO8kGXmk83QlC2vQI1QGcEkt3cNDeIC2RHNogfpn';

        //parse server
        var parseServer = 'api.parse.com';

        //put it together 
        var parseHost = "https://" +  parseServer;

        //number of card columns
        var numCardCol = 3;

        window.numCardCol = numCardCol;
        window.currentCardCol = 1;

        //update the events list
        var updateEventsList = function () {
          $.each(events, function(key){
            console.log(events[key]);
            var item = '<li><a data-capture-event-id="'+ events[key].objectId +'">' + events[key].fullName + '</a></li>';
            $("#events-menu").append(item);
            $("#events-menu-container").show();
          });
        }

        //add a card to the current card list. 
        var addCard = function(card){
          //make sure this card isn't already there.
          if($("div[data-capture-card-id='"+ card.objectId +"']").length > 0){
            return;
          }

          //get our user
          var user = authors[card.user.objectId];
          //find the type of card
          if(card.type == "capture"){
                      var cardHTML = ' <div class="card image-card" '+
                      'data-capture-type="'+ card.type +
                      '" data-capture-user="' + user.objectId +
                      '" data-capture-card-id="' + card.objectId + '"> '+
                         ' <img src="' + card.image.url + '" class="img-polaroid image-card-image">'+
                          //'<h6>' + card.caption + '</h6>'+
                          
                          '<div class="card-author">'+
                              '<img class="source-thumb" src="' + user.profilePictureMedium.url + '" />'+
                              '<span class="source-name">'+ user.displayName +'</span><br>'+
                              '<span class="source-service">Capture<span>'+
                          '</div>'+

                        '</div>';
          }



           $("#card-col-"+ window.currentCardCol).prepend(cardHTML);
           window.currentCardCol = (window.currentCardCol < window.numCardCol)? window.currentCardCol + 1 : 1;
          
        };


        var emptyColumns = function(){
          $.each($('[id^=card-col-]'), function(item, el){  
            $(el).html('');
            cards = {};
          });

          //reset the counter
          window.currentCardCol = 1;
        };

        //some error handling 
        var requestError = function(error){
          console.log(error);
          //return error;
        };

        // stuff for the header building
        var buildHeader = function(xhr) {
          xhr.setRequestHeader("X-Parse-Application-Id", parseAppId);
          xhr.setRequestHeader("X-Parse-REST-API-Key", parseRestKey);
        };
        //
        var updateCardView = function(){

            $.each(cards, function(key){
              try{
                addCard(cards[key]);
              }
              catch(e){

              }
            })
          }

        //grab the user info
        var fetchAuthor = function(userId){

            var params = {
                            'where':{ 
                              'objectId':  userId
                            }
                          };

             $.ajax({
                beforeSend : buildHeader,
                type: 'get',
                url: parseHost + '/1/users',
                data: params,
                success: function(data){
                    authors[data.results[0].objectId] = data.results[0];
              
                },
                error: requestError,
              });
          };


          var newCards = function(data){
            //go through the results and add any that are new
            $.each(data.results, function(item){
              if(!(data.results[item].objectId in cards)){
                fetchAuthor(data.results[item].user.objectId);
                cards[data.results[item].objectId] = data.results[item];
              }
            });
            updateCardView();
          }

        //EVENT HANDLERS

        //fsetup interface events.
        $('#events-menu').on('click','a',function(el) {
         eventView(el.target.dataset.captureEventId);
        });

        //login form submit
          $(document).on('submit', "#login-form", function(el) {
            doLogin($("#login-email").val(), $("#login-password").val());
            el.preventDefault();
          });

        //setup a handler for url hashtag changes
        $(window).on( "hashchange", hashChangeHandler);

        //handler functions
        var hashChangeHandler = function(hashEvent) {
          var hash = window.location.hash.split("/");

          var hashData = hash[1];
          var hashCommand = hash[2];

          switch(hashCommand.trim()){
            case "event":
              eventView(hashData);

              break;
            case "card":
              cardView(hashData);
              break;
            case "user":
              userView(hashData);
              break;
            case "login":
              loginView(hashData);
              break;
            default:
              console.log(hashData);
              welcomeView(hashData);
              break;
          }
        };

        //view functions
        var eventView = function(event){
          window.location.hash = "#event/" + event;
          $('#app-container').load('pages/cards.html');
          cards = {};
          activeEvent = event;
          emptyColumns();
          currentView = "event";
        };

        var cardView = function(card){
        	//load the html
          currentView = "card";
          $('#app-container').load('pages/card.html');
        };

        var loginView = function(){
          //current view 
          currentView = "login";

          $('#app-container').load('pages/login.html');
        };

        var userView = function(user){
        	//keep track of where we are
          currentView = "user";

          //get the user object. if not there, redirect to welcome controller.
           var params = {
                            'where':{ 
                              'objectId':  user
                            }
                          };

             $.ajax({
                beforeSend : buildHeader,
                type: 'get',
                url: parseHost + '/1/users',
                data: params,
                success: function(data){
                  $('#app-container').load('pages/user.html');
                  console.log(data);
                },
                error: requestError,
              });
        };

        var welcomeView = function(data){
        	//load the html
          currentView = "welcome";
          $('#app-container').load('pages/welcome.html');
        };



        //run the hash handler once to check current url
        hashChangeHandler();

        //view specific functions
        var doLogin = function(user, password){
           var params = { 'username':  user,
                          'password': password };

             $.ajax({
                beforeSend : buildHeader,
                type: 'get',
                url: parseHost + '/1/login',
                data: params,
                success: function(data){
                  console.log(data);
                  $.cookie('capture-user', data.objectId);
                  $.cookie('capture-session', data.sessionToken);

                },
                error: requestError,
              });
        };

        //setup our polling
        (function poll(){

              var params = {
                            'where':{ 'event':
                              { '__type':'Pointer',
                              'className':'Event',
                              'objectId':  activeEvent
                            }}, "order":"-createdAt"
                          };

             $.ajax({
                beforeSend : buildHeader,
                type: 'get',
                url: parseHost + '/1/classes/Photo',
                data: params,
                success: newCards,
                error: requestError,
                complete: function(){
                  setTimeout(poll, 4000);
                }, 
                
              });

        })();  

        var fetchEvents = function(){
            $.ajax({
                beforeSend : buildHeader,
                type: 'get',
                url: parseHost + '/1/classes/Event',
                success: function(data){
                  events = [];
                  $.each(data.results, function(item){
                    events.push(data.results[item]);
                  })
                },
                complete: function(){
                  updateEventsList();
                },
                error: requestError,
              });
          }

        fetchEvents();
      })();