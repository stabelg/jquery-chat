(function( $ ){
	$.fn.im = function( options ) {
	    var defaults = {
	    	contactClass: "chat-contact",
		    onlineClass : "online",
		    awayClass : "away",
		    offlineClass : "offline",
		    busyClass : "busy",
		    overColor: "#DEE8F0",
		    /* if div is hidden will show after load */
		    jid: "",
		    password: "",
		    url:"localhost",
		    resource:"Chat",
		    beforeConnect : undefined,
		    afterConnect: undefined,
		    errorFunction: undefined,
		    chatClass: "chat-container",
		    chatListClass: "chat-list",
		    loadClass : "loading-chat",
		    defaultStatus: null,
		    /* helps to debug some error's */
		    debug: false,
		    contactList: [],
		    contactNameIndex: "from",
		    title: "New message",
		    defaultTitle: document.title,
		    /* save the messages sent and received */
		    afterMessage : undefined,
		    afterIq : undefined,
		    soundPath: "",
		    soundName: "pop",
		    minimizeZone: undefined,
		    emotions: [
		    	{
		    		emotion: /:\)/g,
		    		emotionClass: "smile"
		    	},
		    	{
		    		emotion: /:D/ig,
		    		emotionClass: "happy"
		    	},
		    	{
		    		emotion: /:p/ig,
		    		emotionClass: "tongue"
		    	},
		    	{
		    		emotion: /:\(/g,
		    		emotionClass: "sad"
		    	},
		    	{
		    		emotion: /:o/ig,
		    		emotionClass: "surprised"
		    	},
				{
		    		emotion: /\(l\)/ig,
		    		emotionClass: "heart"
		    	},	    			    
		    	{
		    		emotion: /\(y\)/ig,
		    		emotionClass: "thumb_up"
		    	},
		    	{
		    		emotion: /;\)/g,
		    		emotionClass: "wink"
		    	},
		    	{
		    		emotion: /\(n\)/ig,
		    		emotionClass: "thumb_down"
		    	}
		    ],
		    addContact : undefined
	  	};

  		var settings = {},
		connection_options = {};

	  	settings = $.extend( {}, defaults, options );	  	

	  	var $container = this,
  		$parent = $(this).parent(),
  		$container_body = $("<div/>"),
  		statusClasses = settings.onlineClass + " " + settings.awayClass + " " + settings.busyClass + " " + settings.offlineClass,
		t = null,
		user = settings.jid.split("@")[0],
		contacts = [];

  		prepare($container, user);

		var $container_list = $container.find("ul").addClass(settings.chatListClass);

		generateContacts($container_list);

		$.contextMenu({
	        selector: '.chat-title.chat-me .chat-status.'+settings.onlineClass+
	        ",.chat-title.chat-me .chat-status."+settings.busyClass+
	        ",.chat-title.chat-me .chat-status."+settings.awayClass+
	        ",.chat-title.chat-me .chat-status."+settings.offlineClass,
	        className: 'chat-status-context-menu',
	        trigger: 'left',
	        autoHide: true,
	        items: {
	            "online": {name: "Online", icon: settings.onlineClass, callback: function(key, opt){ 
	            	$.xmpp.setPresence(null); 
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.onlineClass); 
	            }},
	            "busy": {name: "Busy", icon: settings.busyClass, callback: function(key, opt){ 
	            	$.xmpp.setPresence("dnd"); 
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.busyClass); 
	            }},
	            "away": {name: "Away", icon: settings.awayClass, callback: function(key, opt){
	            	$.xmpp.setPresence("away"); 
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.awayClass); 
	            }},
	            "offline": {name: "Offline", icon: settings.offlineClass, callback: function(key, opt){
	            	$.xmpp.setPresence("offline"); 
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.offlineClass); 
	            }},
	            "quit": {name: "Quit", icon: "quit", callback: function(key, opt){
	            	$.xmpp.disconnect();
	            	
	            }}
	        }
	    });

		$.contextMenu({
	        selector: '.'+settings.chatListClass+' .'+settings.contactClass,
	        className: 'chat-contact-context-menu',
	        autoHide: true,
	        items: {
	            "block": {name: "Block", icon: settings.onlineClass, callback: function(key, opt){ 
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.onlineClass); 
	            }},
	            "delete": {name: "Delete", icon: settings.onlineClass, callback: function(key, opt){ 
	            	$(opt.selector).removeClass(statusClasses).addClass(settings.onlineClass); 
	            }}
	        }
	    });

		if(settings.debug)
			debug("Executing beforeConnect()");
		/* if need to do something before connect */
		if(typeof(settings.beforeConnect) === "function")
			settings.beforeConnect();

		if(settings.debug)
			debug("Executed beforeConnect()");

		/* Conection with xmpp */
		if($.xmpp){
			if(settings.debug)
				debug("Connecting to xmpp");
			connection_options = {
				resource:settings.resource, jid:settings.jid, password:settings.password, url:settings.url,
				onDisconnect:function(){
					destroy($container_list,$container);
					if(settings.debug)
						debug("Disconnected");
				},
				onConnect: function(){
					if(settings.debug)
						debug("Connected to xmpp");

					$.xmpp.getRoster();
					$.xmpp.setPresence(settings.defaultStatus);
					//console.log($.xmpp.getMyPresence());

					$container.find("."+settings.loadClass).removeClass(settings.loadClass);
					

					var statusClass = 
						settings.defaultStatus ? 
							( settings.defaultStatus === "offline" ? 
								settings.offlineClass : (settings.defaultStatus === "dnd" ? 
									settings.busyClass : settings.awayClass)) 
						: settings.onlineClass;

					$(".chat-conversation-dialog textarea").removeAttr("disabled");
					$container.find(".chat-status").addClass(statusClass);

					/* if need to do something after connect */ 
					if(settings.debug)
						debug("Executing afterConnect()");
					if(typeof(settings.afterConnect) === "function")
						settings.afterConnect();
					if(settings.debug)
						debug("Executed afterConnect()");
				},
				onIq: function(iq){
					if(settings.debug)
						debug(iq);
					var from = $(iq).find("own-message").attr("to");
					var id = MD5.hexdigest(from);
					var conversation = $("#"+id+"_chat");
					if(conversation.length == 0){
						conversation = openChat({title: contacts[id], from:from, id: id+"_chat", md5_id:id});
						conversation.parent().find(".ui-dialog-titlebar").prepend($("#"+id).find(".chat-status").clone().removeClass("chatting"));
					}else{
						conversation.wijdialog("open");
					}
					var conversation_box = conversation.find(".chat-conversation-box");
					var date = "<span style='font-size:9px;'>("+(new Date().toString("HH:mm"))+")</span>";

					$("<div/>")
					.addClass("chat-conversation-box-me")
					.html(date+"<strong> Eu: </strong>"+formatters($(iq).find("div").html()))
					.appendTo(conversation_box);
					conversation_box.scrollTo("div:last");
					conversation_box.next().html("");
					if(settings.afterMessage)
						afterIq(iq);
				},
				onMessage: function(message){
					if(settings.debug)
						debug(message);
					var jid = message.from.split("/");
					var id = MD5.hexdigest(message.from);
					var conversation = $("#"+id+"_chat");
					if(message.body){
						if(conversation.length == 0){
							conversation = openChat({title: contacts[id], from:message.from, id: id+"_chat", md5_id:id});
							conversation.parent().find(".ui-dialog-titlebar").prepend($("#"+id).find(".chat-status").clone().removeClass("chatting"));
						}else{
							conversation.wijdialog("open");
						}
					}
					var conversation_box = conversation.find(".chat-conversation-box");
					var date = "<span style='font-size:9px;'>("+(new Date().toString("HH:mm"))+")</span>";

					if(message.body){
						$("<div/>")
						.addClass("chat-conversation-box-you")
						.html(date+"<strong> "+contacts[id]+": </strong>"+formatters(message.body))
						.appendTo(conversation_box);
						conversation_box.scrollTo("div:last");
						conversation.parent().find(".ui-dialog-titlebar").addClass("new");
						document.title = settings.title;
						document.getElementById("new_message_sound").play();
					}/*else{
						if(conversation_box.length){
							conversation_box.next().show();
							var showHideTipyng = function(){
								conversation_box.next().hide();
							}
							clearTimeout(t);
							t=setTimeout(function(){showHideTipyng()},5000);
						}
					}*/			
					if(settings.afterMessage)
						afterMessage(message);		
				},
				onPresence: function(presence){
					if(settings.debug)
						debug(presence);
					var md5_contact = MD5.hexdigest(presence.from);
					var select = $("#"+md5_contact);
					var statusClass = 
						presence['show'] !== "available" ? 
							( presence['show'] === "unavailable" ? 
								settings.offlineClass : (presence['show'] === "dnd" ? 
									settings.busyClass : (presence['show'] === "away"?
									settings.awayClass : settings.onlineClass))) 
						: settings.onlineClass;
					var from = presence.from.split("@")[0];
					var dialogs = $("#"+md5_contact+"_chat");
					if(!select.length){
						var contact = $("<li/>")
						.attr("title", "Clique para iniciar uma conversa com "+from)
						.attr("id", md5_contact)
						.addClass(settings.contactClass);
						
						var status = $("<div/>")
						.addClass("chat-status")
						.addClass(statusClass)
						.addClass(dialogs.length ? "chatting" : "").appendTo(contact);

						$("<span/>")
						.addClass("chat-contact-name")
						.html(from)
						.appendTo(contact);

						contact.click(function(){
							var id = md5_contact+"_chat";
							var conversation = $("#"+id);
							if(conversation.length == 0){
								conversationDialog = openChat({title:from, from: presence.from, id: id, md5_id:md5_contact});
								conversationDialog.parent().find(".ui-dialog-titlebar").prepend(status.clone().removeClass("chatting"));
							}
							else{
								conversation.wijdialog("open");
							}
						});
						$container_list.append(contact);
					}else{
						var onlines = $container_list.find("."+settings.onlineClass+":last");
						var busys = $container_list.find("."+settings.busyClass+":last");
						var aways = $container_list.find("."+settings.awayClass+":last");

						select.find('div.chat-contact-description')
						.html(presence['status'] ? "("+presence['status']+")" : "");

						select.find("div.chat-status")
						.removeClass(statusClasses)
						.addClass(statusClass);
						if(statusClass == settings.onlineClass){
							$container_list.prepend(select.detach());
						}else if(statusClass == settings.busyClass){
							onlines.length ? onlines.after(select.detach()) : $container_list.prepend(select.detach());
						}else if(statusClass == settings.awayClass){
							busys.length ? busys.after(select.detach()) : 
								( onlines.length ?  onlines.after(select.detach()) : $container_list.prepend(select.detach())) ;
						}else{
							$container_list.append(select.detach());
						}

						if(dialogs.length){
							$("#"+md5_contact).addClass("chatting");
							dialogs.parent().find("div.chat-status")
							.removeClass(statusClasses)
							.addClass(statusClass);
						}
					}
				},
				onError: function(error){
					if(settings.debug)
						debug(error);
					if(settings.errorFunction)
						settings.errorFunction(error);

					destroy($container_list,$container);
				},
   				onComposing: function(message)
   				{
					var id = MD5.hexdigest(message.from);
					var conversation = $("#"+id+"_chat");
					if(conversation.length){
						var conversation_box = conversation.find(".chat-conversation-box").next();
						var date = (new Date().toString("HH:mm"));
						switch(message.state){
							case 'active':
								conversation_box.html("").html("<span class='read-icon'></span>Seen "+date);
								break;
							case 'composing':
								conversation_box.html("").html("<span class='composing'></span>"+contacts[id]+" is typing...");
								break;
							case 'gone':
								conversation_box.html("").html("<span class='active'></span>Gone "+date);
								break;
							default:
								conversation_box.html("");
						}
					}
   					if(settings.debug)
						debug(message);
   				},
   				onRoster: function( roster)
   				{  			
   					if(settings.debug)
						debug(roster);		

   					var md5_contact = MD5.hexdigest(roster.jid);
					var select = $("#"+md5_contact);
					var from = roster['name'];

					contacts[md5_contact] = from;

					if(select.length){
						select.find(".chat-contact-name").html(from);
					}
   					var contact = $("<li/>")
					.attr("title", "Clique para iniciar uma conversa com "+from)
					.attr("id", md5_contact)
					.addClass(settings.contactClass);
					
					var status = $("<div/>")
					.addClass("chat-status")
					.addClass(settings.offlineClass)
					.appendTo(contact);

					$("<span/>")
					.addClass("chat-contact-name")
					.html(from)
					.appendTo(contact);

					$("<span/>")
					.addClass("chat-contact-description")
					//.html(from)
					.appendTo(contact);

					contact.click(function(){
						var id = md5_contact+"_chat";
						var conversation = $("#"+id);
						if(conversation.length == 0){
							conversationDialog = openChat({title:from, from: roster.jid, id: id, md5_id:md5_contact});
							conversationDialog.parent().find(".ui-dialog-titlebar").prepend(status.clone().removeClass("chatting"));
						}
						else{
							conversation.wijdialog("open");
						}
					});
					$container_list.append(contact);	
   				}
		    };

		  	$.xmpp.connect(connection_options);
		}else{
			if(settings.debug)
				debug("xmpp plugin not found");
		}

		/* if the list of the users are pre-defined */
	  	function prepare(container, user){
	  		if(settings.debug)
					debug("Preparing");

			var div = $("<div/>")
			.addClass("chat-title chat-me")
			.appendTo(container);

			$("<span/>")
			.addClass("chat-name")
			.html(user.length > 25 ? user.substr(0,25)+"..." : user)
			.appendTo(div);

			if(settings.addContact){
				$("<span/>")
				.addClass("chat-add")
				.appendTo(div)
				.attr("title", "Add Contact")
				.click(settings.addContact);		
			}

			var text = "";
			$("<input class='chat-description-input' type='text' placeholder='Your presentation message' readonly>")
			.dblclick(function(){
				if( $.xmpp.isConnected() ){
					text = $(this).val();
					$(this).removeAttr("readonly");
				}
			})
			.keydown(function(e){
				if(e.which == $.ui.keyCode.ENTER && !e.shiftKey){
					if($.trim($(this).val()) != ""){
						$.xmpp.setPresence({status: $(this).val()});
						text = $(this).val();
					}
					$(this).attr("readonly", "readonly");
				}else if(e.which == $.ui.keyCode.ESCAPE){
					$(this).val(text);					
					$(this).attr("readonly", "readonly");
				}
			})
			.focusout(function(){
				$(this).val(text);					
				$(this).attr("readonly", "readonly");		
			})
			.appendTo(div);

			$("<span/>")
			.addClass("chat-status")
			.addClass(settings.loadClass)
			.appendTo(div);		

			$("<div/>")
			.addClass("chat-list-title")
			.html("Contact list")
			.appendTo(container);

			$("<div/>")
			.addClass("chat-list")
			.addClass(settings.chatClass)
			.addClass(settings.loadClass)
			.append("<ul/>")
			.appendTo(container);

			if (!settings.minimizeZone) {
				$("<div/>")
				.addClass("footer-conversation-bar")
				.attr("id", "conversation-bar-container")
				.appendTo("body");
			}
			
	  		if(settings.debug)
					debug("Prepared");
	  	}

	  	function generateContacts(container_list){
	  		if(settings.contactList.length){
	  			for(var contact in settings.contactList)
					contactListChanges(contact,container_list);
	  		}
	  	}

	  	function contactListChanges(presence, selector){

	  		if(settings.debug)
				debug("Generating contact in the list");
			var md5_contact = MD5.hexdigest(presence[settings.contactNameIndex]);
			var select = $("#"+md5_contact);
			var statusClass = settings.offlineClass;
			var from = presence[settings.contactNameIndex].split("@")[0];

			if(!select.length){
				var contact = $("<li/>")
				.attr("title", "Clique para iniciar uma conversa com "+from)
				.attr("id", md5_contact)
				.addClass(settings.contactClass)
				
				$("<div/>")
				.addClass("chat-status")
				.addClass(statusClass).appendTo(contact);

				$("<span/>")
				.addClass("chat-contact-name")
				.html(from)
				.appendTo(contact);

				contact.click(function(){
					var id = md5_contact+"_chat";
					var conversation = $("#"+id);
					if(conversation.length == 0){
						conversationDialog = openChat({title:from, from: presence[settings.contactNameIndex], id: id, md5_id:md5_contact});
						conversationDialog.parent().find(".ui-dialog-titlebar").prepend(status.clone().removeClass("chatting"));
					}
					else{
						conversation.wijdialog("show");
					}
				});
				selector.append(contact);
			}
			if(settings.debug)
				debug("Generated contact in the list");
	  	}

	  	function openChat(options){
	  		if($.fn.wijdialog){
	  			if(settings.debug)
					debug("Generating Dialog to "+ options.title);
	  			var div = $("<div/>")
	  			.addClass("chat-conversation")
	  			.attr({"id" : options.id, title: options.title})
	  			.append("<div class='chat-conversation-box'/>")
	  			.append("<div class='chat-composing-box'/>");


	  			var pauseTimeOut;
	  			var composingTimeOut = true;

	  			var textarea = $("<textarea/>")
	  			.attr("placeholder", "Write your message here ...")
	  			.addClass("chat-conversation-textarea")
	  			.appendTo(div)
	  			.keydown(function(e){
	  				//set a timer
	  				$(this).parents(".chat-conversation-dialog").parent().find(".ui-dialog-titlebar").removeClass("new");
	  				if(composingTimeOut){
	  					$.xmpp.isWriting({isWriting : 'composing', from:options.from});
	  					composingTimeOut = false;
	  				}
	  				if(e.which == $.ui.keyCode.ENTER && !e.shiftKey){
	  					var message = textarea.val();
	  					textarea.val("");
	  					e.preventDefault();
	  					if(settings.debug)
							debug("Sending message: "+message+"\nfrom: "+options.from);
	  					$.xmpp.sendMessage({body: message, to:options.from, resource:"Chat", otherAttr:"value"},
	   						"<error>Ocorreu um erro ao enviar esta mensagem</error>",function(e){
	   							composingTimeOut = true;
	   							if(!$(e).find("own-message").length){
	   								var error = $("<div/>")
									.addClass("chat-conversation-box-error")
									.html("<strong>Problema ao entregar mensagem: </strong> "+message);

									$(div).find(".chat-conversation-box").append(error).scrollTo("div:last");
	   							}else{
		   							if(settings.debug)
										debug("message sent");
								}
							}
						);
	  				}
	  				clearTimeout(pauseTimeOut);
	  				pauseTimeOut = setTimeout(function(){
	  					$.xmpp.isWriting({isWriting : 'paused', from:options.from});
	  					composingTimeOut = true;
	  				},5000);

	  			}).focus(function(){
	  				$(this).parents(".chat-conversation-dialog").parent().find(".ui-dialog-titlebar").removeClass("new");
	  				$.xmpp.isWriting({isWriting : 'active', from:options.from});
	  			}).focusout(function(){
	  				$.xmpp.isWriting({isWriting : 'inactive', from:options.from});
	  			});

	  			$(div).append('<audio controls id="new_message_sound" style="display:none;"><source src="'+settings.soundPath+settings.soundName+'.mp3" type="audio/mpeg"/><source src="'+settings.soundPath+settings.soundName+'.ogg" type="audio/ogg"/></audio>');
	  			var status = $("#"+options.md5_id).find(".chat-status");

	  			if(settings.debug)
					debug("Generated Dialog to "+ options.title);

	  			return div.wijdialog({ 
	                autoOpen: true, 
	                captionButtons: { 
	                    refresh: { visible: false },
	                    maximize: {visible: false}
	                },
	                dialogClass: "chat-conversation-dialog",
	                resizable:false,
	                minimizeZoneElementId: (!settings.minimizeZone ? "conversation-bar-container" : settings.minimizeZone),
	                open: function (e) {
	                	status
	                	.addClass("chatting");
	                },
	                close: function (e) {
	                	status
	                	.removeClass("chatting");
	                	$.xmpp.isWriting({isWriting : 'gone', from:options.from});
	                },
	                focus: function(e){
	                	$(this).parent().find(".ui-dialog-titlebar").removeClass("new");
	                	$(this).find("textarea").focus().click();
	                	document.title = settings.defaultTitle;
	                	$.xmpp.isWriting({isWriting : 'active', from:options.from});
	                },
	                blur: function(e){
	                	$.xmpp.isWriting({isWriting : 'inactive', from:options.from});
	                }
	            }); 
	  		}else{
	  			if(settings.debug)
	  				debug("wijmo not found");
	  		}
	  	}

	  	function destroy(containerList, container){
	  		var reconnectButton = container.find(".chat-status");
	  		statusClasses = settings.onlineClass + " " + settings.awayClass + " " + settings.busyClass + " " + settings.offlineClass;
	  		containerList.empty();
	  		var reconnect = function(e){
	  			reconnectButton.unbind('click', reconnect).addClass("chat-status loading-chat");
	  			e.preventDefault();
	  			$.xmpp.connect(connection_options);
	  		}
	  		reconnectButton.removeClass(statusClasses).removeClass("chat-status loading-chat").addClass("retry").click(reconnect);
	  		$(".chat-conversation-dialog textarea").attr("disabled", "disabled");
	  	}

		function debug( $obj ) {
		    if ( window.console && window.console.log ) {
		      window.console.log( $obj );
		    }
	  	};

	  	function formatters(text){
	  		var copy=text;
	  		copy = linkify(copy,{callback: function(text,href){
	  			return href ? '<a style="color:blue;" href="' + href + '" title="' + href + '" target="_blank">' + text + '</a>' : text;
	  		}});
	  		if(settings.emotions){
		  		for(var i in settings.emotions){
		  			copy = copy.replace(settings.emotions[i].emotion, "<span class='emotion "+settings.emotions[i].emotionClass+"'/>");	
		  		}
	  		}
	  		return copy;
	  	}

	  	return this.each(function() {
			if(settings.debug)
				debug(this);
	  	});
  	};

  	

}( jQuery ));
