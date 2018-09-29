'use strict';

chrome.runtime.onInstalled.addListener(function() {
	chrome.storage.sync.set({color: '#3aa757'}, function() {
		//console.log('The color is green.');
	});
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		chrome.declarativeContent.onPageChanged.addRules([{
			conditions: [new chrome.declarativeContent.PageStateMatcher({
				pageUrl: {hostEquals: 'developer.chrome.com'},
			})],
			actions: [new chrome.declarativeContent.ShowPageAction()]
		}]);
	});
});

const ads = 'https://adssettings.google.com/authenticated?ni_query=1';
let funcs = {
	'open_tab': (url,open_f) => {
		chrome.tabs.create({
			'url': url,
			'active': false,
			'selected': false
		},open_f);
	},
	'pc_requested' : null,
	'pc_got': null,
	'parsed_categories': {
		'on': [],
		'off': []
	},
	'storage': {
		'ni_open': (ni_opened) => {
			chrome.storage.local.set({'ni_open': ni_opened }, function() {});
		},
		'get_ni': (cb) => {
			chrome.storage.local.get('ni_open', (result) => {
				if(cb){
					cb(result.ni_open);
				}
			});
		},
		'set_cats': () => {
			chrome.storage.local.set({'parsed_categories': funcs.parsed_categories}, function() {});
		},
		'get_cats': (cb) => {
			chrome.storage.local.get('parsed_categories', (result) => {
				funcs.parsed_categories = result.parsed_categories;
				if(cb){
					cb(result);
				}
			});
		}
	}
};

let ads_tab = null;
let ads_window = null;
let ni_open = [];
let this_window = null;
let on_load = (request,sendResponse) => {
				funcs.storage.get_cats((result) => {
					if(result.parsed_categories &&
						result.parsed_categories.on &&
						result.parsed_categories.on.length){

					}else{
						chrome.tabs.create({
							'url': ads,
							'active': true,
							'selected': true,
							'pinned': true//,
						},(tab) => { ads_tab = tab; });
					
				}
				});
				*/
				sendResponse({'on_load':1});
};

chrome.runtime.onMessageExternal.addListener(
	(request,sender,sendResponse) => {
		switch(request.mode){
			case 'on_load':
				on_load(request,sendResponse);
				break;
			case 'close_ads':
				chrome.tabs.remove(ads_tab.id);
				break;
			case 'ni_close':
				let closed =[];
				for(let ni = 0;ni < ni_open.length;ni++){
					if(ni_open[ni].category === request.cat){
						chrome.tabs.remove(ni_open[ni].id);
						closed.push(ni_open[ni]);
					}
				}
				ni_open = [];
				sendResponse({'closed':closed,'request':request});
				break;
			case 'ni_open':
				chrome.tabs.create({
					'url': request.url,
					'active': true,
					'pinned': true
				},(tab) => { 
					ads_tab = tab;
				});
				let final_cats = [];
				for(let ni=0; ni < funcs.parsed_categories.on.length;ni++){
					if(funcs.parsed_categories.on[ni] === request.category){
						continue;
					}else{
						final_cats.push(funcs.parsed_categories.on[ni]);
					}
				}
				funcs.parsed_categories.on = final_cats;
				if(funcs.parsed_categories.off.indexOf(request.category) == -1){
					funcs.parsed_categories.off.push(request.category);
				}
				funcs.storage.set_cats();
				sendResponse({'ni_open':ni_open,'request':request});
				break;
			case 'open_ads':
				funcs.pc_requested = new Date().toISOString();
				funcs.pc_got = null;
				chrome.tabs.create({
					'url': ads,
					'active': false,
					'selected': false,
					'pinned': true
				},(tab) => { ads_tab = tab; });
				break;
			case 'submit_cats':
				funcs.storage.set_cats();
				sendResponse({'cats': []});
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
			default:
				sendResponse({'status':'defaulted'});
				break;
		}
		sendResponse({'status':'grab'});
	});
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch(request.mode){
			case 'on_load':
				on_load(request,sendResponse);
				break;

			case 'ni_close':
			case 'close_ads':	//Intentional fallthrough
				chrome.tabs.remove(ads_tab.id);
				break;
			case 'submit_cats':
				funcs['parsed_categories'] = request['cats'];
				sendResponse({'success':1,'stub':'got-it,thx','cats':request['cats']});
				funcs.pc_got = new Date().toISOString();
				funcs.storage.set_cats();
				break;
			default:
				sendResponse({'success': true,'stub': 'default'});
				break;
		}
	});

