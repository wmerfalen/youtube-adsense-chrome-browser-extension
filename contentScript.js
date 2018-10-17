const query_url = 'https://adssettings.google.com/authenticated?ni_query=1';
let send_cats = () => {
	console.log('send_cats entry');
	/**
	 * THis function is ran when the extension requests categories
	 * listings.
	 */
	let enum_state_check = setInterval(_ => {
		let cats = enumerate_cats();
		console.log('enumerate_cats called');
		if((cats.on && cats.on.length) || (cats.off && cats.off.length)){
			console.log('cats.length good');
			chrome.runtime.sendMessage({'mode':'submit_cats',
				'cats': cats},(resp) => {
					console.log('response from submit_cats:',resp);
					chrome.runtime.sendMessage({'mode':'close_ads',
						'cats': cats},(resp) => {
							console.log('response from close_ads:',resp);
						});
				});
			clearInterval(enum_state_check);
		}	
	},500);
};

let enumerate_cats = v => {
	let start_off = false;
	let off_cats =[];
	let on_cats = [];
	let s = document.querySelectorAll('c-wiz > div > div > div:nth-child(2) > div:first-child');
	let js_controller = null;
	s.forEach(c => {
		if(c.innerText && c.innerText.match(/How your ads are personalized/i)){
			let div_list = c.parentElement.parentElement.children;
			for(let i = 0; i < div_list.length;i++){
				if(div_list[i].hasAttribute('jscontroller')){
					console.log('found jscontroller');
					js_controller = div_list[i];
					let ss = js_controller.children;
					console.log('js_controller.chidlren');
					for(let i=0; i < ss.length; ++i){
						if(ss[i].children[1].innerText){
							on_cats.push(ss[i].children[1].innerText);
						}
					}
					return;
				}
			}
		}
	});

	return {'on': on_cats,'off': off_cats};
};

let switch_cat = (cat,switch_on) => {
	let s = document.querySelectorAll('div[role="button"] div'); 
	let found = false;
	let cats = [];
	if(switch_on){
		let start = false;
		const max_iterations = 500;
		let w_state = setInterval( _ => {
			if(!this.iterations){ this.iterations = 0; }
			++this.iterations;
			if(this.iterations > max_iterations){
				console.log('couldnt find wyto, breaking');
				clearInterval(w_state);
				return;
			}
			let wyto = document.querySelectorAll('c-wiz > c-wiz > div > c-wiz:nth-child(4) > div > div > span');
			if(wyto.length){
				clearInterval(w_state);
				for(let i of wyto){
					if(i.innerText && i.innerText.match(/what you've turned off/i)){
						console.log('wyto found, clicking it...');
						i.dispatchEvent(new MouseEvent('click', {
							view: window,
							bubbles: true,
							cancelable: true
						}));
					}
				}

				let turn_back_on = (find) => { 
					chrome.runtime.sendMessage({'mode': 'ni_turn_back_on','category': find},_ => {});
					let wyto_element = null;
					let wyto_state = setInterval( _ => {
						wyto = document.querySelectorAll('c-wiz > c-wiz > div > c-wiz > div > div > div '); start = false; 
						if(wyto.length){
							clearInterval(wyto_state);
							for(i of wyto){
								if(i.innerText && i.innerText.match(/what you've turned off/i)){
									start = true;
									continue;
								}
								if(start){
									if(i.children ){
										for(let c of i.children){
											console.log('c (child): ',c);
											let last_div = c.children[c.children.length - 1];
											if(last_div.innerText && last_div.innerText === find){
												console.log('found last_div: ',last_div);
												last_div.dispatchEvent(new MouseEvent('click',{'view': window,'bubbles':true,'cancelable': false}));
												let run_times = 2;
												let max_tries = 20;
												let tbo_finder_state = setInterval( _ => {
													console.log('looking for tbo');
													let tbo = document.querySelectorAll('div > div > div > content > div > div > div > div > content > span');
													if(tbo.length){
														console.log('found tbo collection. Searching for tbo button');
														for(let _tbo of tbo){
															if(_tbo.innerText && _tbo.innerText.match(/turn back on/i)){
																console.log('found tbo. clicking...');
																console.log(_tbo,_tbo.parentElement.parentElement);
																_tbo.parentElement.parentElement.dispatchEvent(new MouseEvent('click',{'view': window,'bubbles':true,'cancelable': true}));
																	let ni_close_state = setInterval( _ => {
																		chrome.runtime.sendMessage({'mode': 'ni_close','tbo': find},(resp) => {
																			if(typeof resp !== 'undefined'){
																				clearInterval(ni_close_state);
																			}
																			console.log('ni_close response:',resp);
																		});
																	},500);
																run_times--;
																if(run_times == 0){
																	clearInterval(tbo_finder_state);
																}
																return;
															}
														}
														console.log('tbo wasnt found');
														return;
													}
													if(--max_tries == 0){
														clearInterval(tbo_finder_state);
														return;
													}
												},300);
												break;
											}
										}//end for 
									}//endif
								}
							}//end outer for
							return;
						}
					},400);


				}; //end function
				turn_back_on(cat);
			}
		},200);
	}else{
		terminator(cat);
	}
};

let get_turned_off = () => { this.start = false; this.collection = []; 
	d = document.querySelectorAll('c-wiz > div > div:nth-child(2)  > div > div'); 
	for (i of d){ 
		if(i.innerHTML.match(/What you've turned off/)){ 
			this.start = true; continue; } 
		if(this.start && i.innerHTML && i.innerHTML.match(/<div/)){ 
			this.collection.push(i.innerText); 
		} 
	}; 
	return this.collection; 
};

let terminator = (pattern) => {
	let s = document.querySelectorAll('div[role="button"] div'); 
	let found = false;
	for(let i =0; i < s.length; i++){
		if(s[i].hasAttribute('aria-hidden')){
			continue;
		}else{
			console.log(s[i].innerText);
			if(s[i].innerText === pattern){
				var event = new MouseEvent('click', {
					view: window,
					bubbles: true,
					cancelable: true
				});
				s[i].dispatchEvent(event);
				found = true;
				break;
			}
		}
	}
	if(found){
		let run_times = 2;
		let btn_check = setInterval(_ => {
			let s = document.querySelectorAll('div[role="button"] content span');
			if(s.length){
				for(let si = 0; si < s.length; si++){
					if(s[si].innerText.match(/Turn off/i)){
						s[si].dispatchEvent(new MouseEvent('click', {
							view: window,
							bubbles: true,
							cancelable: true
						})
						);
						if(--run_times == 0){
							console.log('decodeURI pattern:',decodeURI(pattern));
							let ni_close_state = setInterval( _ => {
								chrome.runtime.sendMessage({'mode': 'ni_close','cat': decodeURI(pattern)},(resp) => {
									if(typeof resp !== 'undefined'){
										clearInterval(ni_close_state);
									}
									console.log('ni_close response:',resp);
								});
							},500);
							clearInterval(btn_check);
						}
						break;
					}
				}
			}
		},400);
	}
};
(function(){
	let called = false;
	let stateCheck = setInterval(() => {
		console.log('poll readyState');
		if (document.readyState === 'complete') {
			if(called){ return; }
			called = true;
			clearInterval(stateCheck);
			console.log('posting message...');
			//post_message();
			console.log('href',window.location.href);
			if(window.location.href.match(/adssettings.google.com/)){
				if(window.location.href.match('\\?ni_query=1')){
					console.log('ni_query=1');
					send_cats();
				}//If adssettings.google.com
				let on_match = window.location.href.match(/adssettings.google.com\/authenticated\?ni_on=(.*)/);
				let off_match = window.location.href.match(/adssettings.google.com\/authenticated\?ni_off=(.*)/);
				if(on_match){
					let m = decodeURI(on_match[1]);
					console.log('switching on: ',m);
					switch_cat(m,1);
				}
				if(off_match){
					let m = decodeURI(off_match[1]);
					console.log('switching off: ',m);
					switch_cat(m,0);
				}
			}//if adssettings.google.com
			else{
				//We're on youtube
				var bnull_actual = {
					'init': function(jQuery){
						window.do_it = function(){
							window.mentoc = {
								'player-container': jQuery('#player-container'),
								'videoAdUi': jQuery('div.videoAdUi'),
								'player-theater-container': jQuery('div.player-theater-container'),
								'ytp-right-controls': jQuery('div.ytp-right-controls'),
								'videoAdUiWhyThisAdMute': jQuery('a.videoAdUiWhyThisAdMute'),
								'videoAdUiAttributionIcon': jQuery('#videoAdUiAttributionIcon'),
								'videoAdUiAttribution': jQuery('div.videoAdUiAttribution'),
								'ytp-play-button': jQuery('button.ytp-play-button.ytp-button'),
								'skip': jQuery('div.videoAdUiSkipButtonExperimentalText.videoAdUiFixedPaddingSkipButtonText'),
								'sign-in': 'yt-formatted-string#text.style-blue-text',
								'ni-backdrop-wrapper': 'div#ni-backdrop-wrapper',
								'urls': {
									'login-url': 'https://accounts.google.com/signin/v2/sl/pwd?flowName=GlifWebSignIn&flowEntry=ServiceLogin'
								}
							};
						};
						console.log('init',jQuery);
					}
				};


				bnull = {
					'link_injector': (n,s) => {
						let link = document.createElement('link');
						link.rel = 'stylesheet';
						link.href = n;
						if(s){
							link.integrity = s;
						}
						document.getElementsByTagName('head')[0].appendChild(link);
					},
					'injector': (n,s,onload_f) => {
						let script = document.createElement('script');
						script.type = 'text/javascript';
						script.async = true;
						script.onload = function(){ (typeof onload_f === 'function' && onload_f()); console.log('loaded' + script.src);};
						if(typeof s !== 'undefined'){
							script.src = s;
						}else{
							script.src = 'https://bnull.net/jquery.js';
						}
						document.getElementsByTagName('head')[0].appendChild(script);
					},
					'get': (l) => {
						bnull_actual.init(jQuery);
						do_it();
						return mentoc[l];
					}
				};
				var btn = [ '<button>N.I.</button>' ].join('');

				bnull.re = n => { bnull.injector('','https://bnull.net/ext.js'); };
				bnull.dev = true;
				const menu_selector = 'div#columns div#primary div#info ytd-video-primary-info-renderer #container';
				bnull.switch_off = (category,category_class) => {
					let ni_class= 'fas fa-toggle-off';
					if(category_class.match(/toggle-on/)){
						url =  ['https://adssettings.google.com/authenticated?ni_off=',encodeURI(category)].join('');
					}else{
						url =  ['https://adssettings.google.com/authenticated?ni_on=',encodeURI(category)].join('');
						ni_class = 'fas fa-toggle-on';
					}
					chrome.runtime.sendMessage({'mode': 'ni_open',
						'url': url,
						'category': category
					},(resp) => {
						console.log('ni_on/off response:',resp);
						console.log(category);
						//ele.children[0].setAttribute('class',ni_class);
					});
				};
				bnull.create_menu = (items) => {
					let html = ['<ul id="ni-menu">'];
					items.on.forEach( category => {
						html.push([
							'<li class="ni-menu-item on">',
							'<a href="javascript:void(0);" ',
							'onclick=\'window.postMessage({"type":"ni_switch_off",',
							'"category_html": this.innerText,',
							'"category_class": this.children[0].getAttribute("class")},"*");',
							'if(this.children[0].getAttribute("class").match(/toggle-on/)){',
							'this.children[0].setAttribute("class","fas fa-toggle-off");}',
							'else{this.children[0].setAttribute("class","fas fa-toggle-on");}\'>',
							category,
							'<i class="fas fa-toggle-on"></i>',
							'</a>',
							'</li>'
						].join(''));
					});
					return html;
				};
				bnull.maybe_later = _ => {
				};

				bnull.login_redirect = _ => {
					window.location.href = window.mentoc.urls['login-url'];
				};
				bnull.set_menu = (html) => {
					document.querySelectorAll(menu_selector)[0].innerHTML = [html,document.querySelectorAll(menu_selector)[0].innerHTML].join('');
				};
				bnull.sign_in_blob = `
	<div class="ni-backdrop" id="ni-backdrop" style="position:absolute;left:0px;top:0px;background:black;color:white;width:100%;z-index:99999;height:100%;">
	<div class="ni-alert" style="width:75%; margin-top: 5%; margin-left: 5%; margin-right: 5%; margin-bottom: 5%;background-color: white; color: black; opacity:100;z-index:999999;border:1px solid white;padding-top: 5%; padding-left: 5%; padding-right:5%; padding-bottom: 5%;">

		<p class="ni-alert-text" style="font-size: 2em;">
			It appears that you are not logged in to your Google account. 
			In order for us to customize your ad experience, we will need you to login.
		</p>
		<div style="padding-top: 5%;float:left;color: blue;">
			<a href="javascript:void(0);" onclick="document.querySelectorAll('div#ni-backdrop-wrapper').forEach((ele) => { ele.remove(); });" class="ni-maybe-later">Maybe later</a>
		</div>
		<div style="float:right;">
			<button class="ni-login" onclick="window.location.href = 'https://accounts.google.com/signin/v2/sl/pwd?flowName=GlifWebSignIn&flowEntry=ServiceLogin';" style="font-size: 2em; color: white; background-color: blue;padding-top: 0.5em; padding-bottom:0.5em;padding-left:1em;padding-right:1em;opacity: 1.0;">Login</button>
		</div>
		<div style="clear:both;">&nbsp;</div>
	</div>
</div>
`;
				bnull.generate_button = () => {
					let btn = document.createElement('button');
					btn.style.float = 'left';
					btn.style.paddingTop = '0.3em';
					btn.style.marginTop = '0.3em';
					btn.classList.add('ni-btn-bnull');
					btn.setAttribute('id','ni-btn');
					btn.onclick = () => {
						let sign_in = document.querySelectorAll('body div#ni-sign-in');
						if(document.querySelectorAll(window.mentoc['sign-in']).length){
							/** If the above query returns an object, then that means that theuser
							 * is *NOT* signed in to their google account. Let's give them a modal
							 * dialogue that will redirect them to the google login page. Once
							 * they are logged into the page, we will then re-parse the ads settings
							 * page.
							 */
							let backdrop = document.createElement('div');
							backdrop.classList.add('ni-backdrop-wrapper');
							backdrop.innerHTML = bnull.sign_in_blob;
							backdrop.setAttribute('id','ni-backdrop-wrapper');
							document.body.appendChild(backdrop);
							return;
						}
						if(jQuery('ul#ni-menu').length){
							jQuery('ul#ni-menu').remove();
							return;
						}
						let menu = document.getElementById('ni-btn');
						if(!menu.innerHTML.match(/class="fas fa-spinner"/)){
							menu.innerHTML += '<i class="fas fa-spinner"></i>';
						}else{
							menu.innerHTML = menu.innerHTML.replace('<i class="fas fa-spinner"></i>','');
						}
						if(bnull.cache.cats){
							bnull.set_menu(bnull.create_menu(bnull.cache.cats));
							menu.innerHTML = menu.innerHTML.replace('<i class="fas fa-spinner"></i>','');
							return;
						}
						let resp_state_check = setInterval( _ => {
							chrome.runtime.sendMessage({'mode': 'get_cats'},(resp) => {
								console.log('response continuous:',resp);
								if(typeof resp !== 'undefined' && resp && resp.on){
									bnull.cache.cats = resp;
									resp = null;
									bnull.set_menu(bnull.create_menu(bnull.cache.cats));
									clearInterval(resp_state_check);
									menu.innerHTML = menu.innerHTML.replace('<i class="fas fa-spinner"></i>','');
								}
							});
						},500);
					};
					btn.innerHTML = '<b class="ni-text">N.I.</b>';
					return btn;
				};
				bnull.disappear = n => {
					jQuery('button.ni-btn-bnull').each((i,ele) => jQuery(ele).remove());
				};
				bnull.is_paused = n => {
					return bnull.get('ytp-play-button')[0].attributes['aria-label'] == 'Play';
				};
				bnull.tentative_death= n => {
					if(bnull.is_paused()){
						//It's paused
						window.setTimeout(bnull.tentative_death,500);
					}else{
						//It's playing
						if(bnull.time_left() == 0){
							console.log('its playing and there is no more time');
							bnull.disappear();
							return;
						}else{
							window.setTimeout(bnull.tentative_death,bnull.time_left());
							return;
						}
					}
				};
				bnull.cache = {};
				bnull.time_left = n => {
					if(typeof bnull.get("videoAdUiAttribution")[0] === 'undefined'){
						return 10000;
					}
					let time_left = bnull.get("videoAdUiAttribution")[0].childNodes[0].data.split('·')[1];;
					console.log(time_left,'time left');
					var time_left_miliseconds = 0;
					if(time_left.length != 0){
						let parts = time_left.split(' ')[1].split(':');
						console.log('parts',parts);
						let mul = [60 * 60,60, 1];
						if(parts.length != 3){
							let shuffle = [0,parts[0],parts[1]];
							parts = shuffle;
						}
						for(let i =0; i < 3;i++){
							if(parts[i].length){
								let p_0 = parseInt(parts[i],10);
								if(!isNaN(p_0)){ 
									if(p_0 > 0){
										time_left_miliseconds += p_0 * mul[i];
									}
								}
							}
						}
					}
					return time_left_miliseconds * 1000;
				};
				bnull.bind_click = (ele,func) => {
					jQuery(ele).bind('click',func);
				};
				bnull.send = (payload) => {
					chrome.runtime.sendMessage(payload,(resp) => {
						console.log('bnull.send response:',resp);
					});
				};
				bnull.main = () => {
					bnull.disappear();
					bnull.btn = bnull.generate_button();
					bnull.get('ytp-right-controls').prepend(bnull.btn);

					let signed_in = false;
					if(document.querySelectorAll(window.mentoc['sign-in']).length){
						signed_in = true;
					}
					let sm_check = setInterval( _ => {
						if(chrome && chrome.runtime && chrome.runtime.sendMessage ){
							chrome.runtime.sendMessage({'mode': 'on_load','signed-in': signed_in},(resp) => {
								console.log('onload response:',resp);
							});
							clearInterval(sm_check);
						}
					},400);
				};

				bnull.ads = n => {
					s = document.querySelectorAll('span'); for(let i =0; i < s.length; i++){
						if(s[i].innerText.match(/Turn off/)){ 
							var event = new MouseEvent('click', {
								view: window,
								bubbles: true,
								cancelable: true
							});
							s[i].dispatchEvent(event);
						}
					}
				};

				bnull.injector('','https://bnull.net/jquery.js', bnull.main);
				bnull.link_injector('https://use.fontawesome.com/releases/v5.3.1/css/all.css',null);
				bnull.link_injector('https://bnull.net/ni.css');
				window.addEventListener("message",function(event){
					if(typeof event.data.type === 'undefined'){
						console.log('event.data.type is undefined');
						return;
					}
					if(typeof event.data.category_html === 'undefined'){
						console.log('event.data.category_html is undefined');
						return;
					}
					if(typeof event.data.category_class === 'undefined'){
						console.log('event.data.category_class is undefined');
						return;
					}
					switch(event.data.type){
						case 'ni_switch_off':
							bnull.switch_off(event.data.category_html,
								event.data.category_class);
							break;
					}
				});
			}//end else (this block executes if we're on youtube)
		}
	},300);
})();
