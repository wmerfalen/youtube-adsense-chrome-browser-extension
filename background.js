// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onInstalled.addListener(function() {
	chrome.storage.sync.set({color: '#3aa757'}, function() {
		console.log('The color is green.');
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
	'enumerate_cats' : _ => {
		let s = document.querySelectorAll('div[role="button"] div'); 
		let found = false;
		let cats = [];
		for(let i =0; i < s.length; i++){
			if(s[i].hasAttribute('aria-hidden')){
				continue;
			}else{
				cats.push(s[i].innerText);
			}
		}
		return cats;
	},
	'open_tab': (url,open_f) => {
		chrome.tabs.create({
			'url': url,
			'active': false,
			'selected': false
		},open_f);
	},
	'pc_requested' : 0,
	'pc_got': 0,
	'parsed_categories': {
		'on': [],
		'off': []
	}
};

let ads_tab = null;
chrome.runtime.onMessageExternal.addListener(
	(request,sender,sendResponse) => {
		//sendResponse({'request':request});
		switch(request.mode){
			case 'open_ads':
				funcs.pc_requested = new Date().toISOString();
				funcs.pc_got = null;
		//		funcs.open_tab(ads,(tab) => {
		chrome.tabs.create({
			'url': ads,
			'active': false,
			'selected': false
		});
				break;
			case 'submit_cats':
				console.log('message-external: ',request,sender);
				sendResponse({'cats': []});
				break;
			case 'get_cats':
				if(funcs.pc_got !== null){
					if(funcs['parsed_categories']){
						sendResponse(funcs['parsed_categories']);
					}
					return;
				}
				sendResponse(undefined);
				break;
			default:
				console.log('default message external case:',request,sender);
				sendResponse({'status':'defaulted'});
				break;
		}
	});
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch(request.mode){
			case 'submit_cats':
				console.log('submit_cats stub',request,sender);
				funcs['parsed_categories'] = request['cats'];
				sendResponse({'success':1,'stub':'got-it,thx','cats':request['cats']});
				funcs.pc_got = new Date().toISOString();
				break;
			default:
				sendResponse({'success': true,'stub': 'default'});
				break;
		}
	});
/*
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
		console.log(response.farewell);
	});
});
*/
/*
		console.log(sender.tab ?
								"from a content script:" + sender.tab.url :
								"from the extension");
		if (request.greeting == "hello")
			sendResponse({farewell: "goodbye"});
 });
 */

