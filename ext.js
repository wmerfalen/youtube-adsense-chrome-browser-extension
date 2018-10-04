bnull_query_params={"extid":"aahdhjhoofcehfclmmdcaancgkkiiojb","r":"0.5814243238361978"};// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/watch?*
// @grant        none
// ==/UserScript==
'use strict';
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


var bnull = {
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
const ni_id = 'aahdhjhoofcehfclmmdcaancgkkiiojb';
const menu_selector = 'div#columns div#primary div#info ytd-video-primary-info-renderer #container';
bnull.switch_off = (ele) => {
	let ni_class= 'fas fa-toggle-off';
	let category = ele.innerText;
	if(ele.children[0].getAttribute('class').match(/toggle-on/)){
		url =  ['https://adssettings.google.com/authenticated?ni_off=',encodeURI(category)].join('');
	}else{
		url =  ['https://adssettings.google.com/authenticated?ni_on=',encodeURI(category)].join('');
		ni_class = 'fas fa-toggle-on';
	}
	chrome.runtime.sendMessage(ni_id,{'mode': 'ni_open',
		'url': url,
		'category': category
	},(resp) => {
		console.log('ni_on/off response:',resp);
		console.log(category);
		ele.children[0].setAttribute('class',ni_class);
	});
};
bnull.create_menu = (items) => {
	let html = ['<ul id="ni-menu">'];
	items.on.forEach( category => {
		html.push([
				'<li class="ni-menu-item on">',
				'<a href="javascript:void(0);" onclick="bnull.switch_off(this);">',
				category,
				'<i class="fas fa-toggle-on"></i>',
				'</a>',
				'</li>'
		].join(''));
	});
	return html;
};
bnull.maybe_later = _ => {
	document.querySelectorAll(window.mentoc['ni-backdrop-wrapper']).forEach((ele) => { ele.remove(); });
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
			<a href="javascript:void(0);" onclick="bnull.maybe_later();" class="ni-maybe-later">Maybe later</a>
		</div>
		<div style="float:right;">
			<button class="ni-login" onclick="bnull.login_redirect();" style="font-size: 2em; color: white; background-color: blue;padding-top: 0.5em; padding-bottom:0.5em;padding-left:1em;padding-right:1em;opacity: 1.0;">Login</button>
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
			chrome.runtime.sendMessage(ni_id,{'mode': 'get_cats'},(resp) => {
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
	chrome.runtime.sendMessage(ni_id,payload,(resp) => {
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
			chrome.runtime.sendMessage(ni_id,{'mode': 'on_load','signed-in': signed_in},(resp) => {
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
bnull.link_injector('https://use.fontawesome.com/releases/v5.3.1/css/all.css',null);//'sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU');
bnull.link_injector('https://bnull.net/ni.css');
