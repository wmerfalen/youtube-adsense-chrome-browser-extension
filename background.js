'use strict';


let ext_info = null;
const ads = 'https://adssettings.google.com/authenticated?ni_query=1';
let funcs = {
	'pc_requested' : null,
	'pc_got': null,
	'parsed_categories': {
		'on': [],
		'off': []
	},
	'storage': {
		'ni_open': (ni_opened) => {
			console.log('setting storage locally to: ',ni_opened);
			chrome.storage.local.set({'ni_open': ni_opened }, function() {});
		},
		'get_ni': (cb) => {
			chrome.storage.local.get('ni_open', (result) => {
				console.log('got local storage items:',result);
				if(cb){
					cb(result.ni_open);
				}
			});
		},
		'set_cats': () => {
				if(funcs.parsed_categories.on.length){
					funcs.parsed_categories.on = funcs.parsed_categories.on.sort();
				}
				if(funcs.parsed_categories.off.length){
					funcs.parsed_categories.off = funcs.parsed_categories.off.sort();
				}
			chrome.storage.local.set({'parsed_categories': funcs.parsed_categories}, function() {});
		},
		'get_cats': (cb) => {
			chrome.storage.local.get('parsed_categories', (result) => {
				funcs.parsed_categories = result.parsed_categories;
				if(funcs.parsed_categories.on.length){
					funcs.parsed_categories.on = funcs.parsed_categories.on.sort();
				}
				if(funcs.parsed_categories.off.length){
					funcs.parsed_categories.off = funcs.parsed_categories.off.sort();
				}
				if(cb){
					cb(result);
				}
			});
		}
	}
};


let ads_window = null;
let ads_tab = null;
let ni_open = [];
let win = (ads) => {
	/*
				chrome.tabs.create({
					'url': request.url,
					'active': true,
					'pinned': true
				},(tab) => { 
					ads_tab = tab;
				});
				*/
	chrome.windows.create({
		'url': ads,
		'left': -200,
		'top': -200,
		'width': 300,
		'height': 300,
		'focused': true,
		'type': 'normal',
	},(window_object) => {
		ads_window = window_object;
	}
	);
};
let on_load = (request,sendResponse) => {
	console.log('on_load');
	if(request['signed-in'] === true){
		funcs.storage.get_cats((result) => {
			if(result.parsed_categories &&
				result.parsed_categories.on &&
				result.parsed_categories.on.length){
			}else{
				win(ads);
			}//end else
		});//end get_cats
	}//end if signed-in
	sendResponse({'on_load':1});
};//end on_load lambda

chrome.runtime.onMessage.addListener(
	(request,sender,sendResponse) => {
		switch(request.mode){
			case 'on_load':
				on_load(request,sendResponse);
				break;
			case 'close_ads':
				if(ads_window !== null){
					chrome.windows.remove(ads_window.id);
				}
				break;
			case 'ni_close':
				if(ads_window !== null && typeof ads_window.id !== 'undefined'){
					chrome.windows.remove(ads_window.id,() => { ads_window = null; });
				}
				if(typeof request.tbo !== 'undefined'){
					let final_cats = [];
					for(let ni=0; ni < funcs.parsed_categories.off.length;ni++){
						if(funcs.parsed_categories.off[ni] === request.tbo){
							continue;
						}else{
							final_cats.push(funcs.parsed_categories.off[ni]);
						}
					}
					funcs.parsed_categories.off = final_cats.sort();
					if(funcs.parsed_categories.on.indexOf(request.tbo) == -1){
						funcs.parsed_categories.on.push(request.tbo);
					}
					funcs.parsed_categories.on = funcs.parsed_categories.on.sort();
					funcs.storage.set_cats();
				}
				sendResponse({'closed':closed,'request':request});
				break;
			case 'ni_open':
				win(request.url);
				let final_cats = [];
				for(let ni=0; ni < funcs.parsed_categories.on.length;ni++){
					if(funcs.parsed_categories.on[ni] === request.category){
						continue;
					}else{
						final_cats.push(funcs.parsed_categories.on[ni]);
					}
				}
				funcs.parsed_categories.on = final_cats.sort();
				if(funcs.parsed_categories.off.indexOf(request.category) == -1){
					funcs.parsed_categories.off.push(request.category);
				}
				funcs.parsed_categories.off = funcs.parsed_categories.off.sort();
				funcs.storage.set_cats();
				sendResponse({'ni_open':ni_open,'request':request});
				break;
			case 'open_ads':
				funcs.pc_requested = new Date().toISOString();
				funcs.pc_got = null;
				win(ads);
				break;
			case 'get_cats':
				if(funcs.parsed_categories &&
					funcs.parsed_categories.on &&
					funcs.parsed_categories.on.length){
					sendResponse(funcs.parsed_categories);
					return;
				}else{
					sendResponse(null);
				}
				break;
			case 'submit_cats':
				let m = {'on': [],'off':[]};
				if(typeof request['cats'].on === 'undefined' ||
					request['cats'].on === null){
					m['on'] = [];
				}else{
					m['on'] = request['cats'].on.sort();
				}
				if(typeof request['cats'].off === 'undefined' ||
					request['cats'].off === null){
					m['off'] = [];
				}else{
					m['off'] = request['cats'].off.sort();
				}
				funcs['parsed_categories'] = m;
				sendResponse({'success':1,'stub':'got-it,thx','cats':request['cats']});
				funcs.pc_got = new Date().toISOString();
				funcs.storage.set_cats();
				break;
			default:
				sendResponse({'success': true,'stub': 'default'});
				break;
		}
		sendResponse({'status':'grab'});
	});

chrome.runtime.onInstalled.addListener(function() {
	chrome.management.getSelf((extension_info) => {
		win(ads);
		ext_info = extension_info;
	});
});
