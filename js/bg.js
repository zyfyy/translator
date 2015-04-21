chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.greeting == "hello") {
			var req = new XMLHttpRequest()
			req.open(
				"GET",
				"http://openapi.baidu.com/public/2.0/translate/dict/simple?client_id=e2fjm1o0sb4uTTa1WnNgmmGV" +
				"&from=" + request.param.from +  "&to=" + request.param.to + "&q=" + request.param.q,
				true)
			req.onload = function() {
				sendMsg(JSON.parse(req.response))
			}
			req.send(null)
			sendResponse({farewell: "bye"})
		} else if (request.greeting == "farewell") {
		}
	}
)

function sendMsg(msg) {
	chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendMessage(tab.id, {greeting: "hello", result: msg}, function(response) {
		})
	})	
}