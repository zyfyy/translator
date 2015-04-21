var send
var last_string
var wordPos_x
var wordPos_y

window.addEventListener('click', function(e) {
	var string = window.getSelection().toString()
	if (string) {
		clearTimeout(send)
		var param = {
			from: "en",
			to: "zh",
			q: string.trim().toLowerCase().split(" ")[0]
		}
		if (string.match(/[^\x00-\x80]/g)) {
			param.from = "zh"
			param.to = "en"
		}
		if (last_string !== param.q) {
			send = setTimeout(function() {sendMsg(param)}, 100)
			last_string = param.q
			// wordPos_x = e.clientX + window.scrollX
			// wordPos_y = e.clientY + window.scrollY
			wordPos_x = e.clientX
			wordPos_y = e.clientY
		}
	} else {
		last_string = ""
		if (document.getElementsByClassName("translate_pop").length) {
			document.getElementsByClassName("translate_pop")[0].remove()
		}	
	}
})

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.greeting == "hello") {
			handler(request.result)
			sendResponse({farewell: "bye"})
		} else if (request.greeting == "farewell") {
		}
	}
)

function sendMsg(param) {
	chrome.extension.sendMessage({greeting: "hello", param}, function(response) {
	})
}

function handler(result) {
	if (document.getElementsByClassName("translate_pop").length) {
		document.getElementsByClassName("translate_pop")[0].remove()
	}
	var win_height = window.innerHeight
	var win_width = window.innerWidth
	var x_direct = 0
	var y_direct = 0
	if (result.errno === 0 && !(typeof(result.data.word_name) === "undefined")) {
		var pop = document.createElement("div")
		var title = document.createElement("h3")
		pop.appendChild(title)

		for (var symbol in result.data.symbols) {
			var symbol_dom = document.createElement("div")
			symbol_dom.className = "translate_symbol"
			var symbol_ph = document.createElement("span")
			symbol_ph.innerText = result.data.symbols[symbol].ph_zh ||
					result.data.symbols[symbol].ph_am || result.data.symbols[symbol].ph_en
			symbol_ph.className = "translate_ph"
			symbol_dom.appendChild(symbol_ph)


			var parts = result.data.symbols[symbol].parts
			var symbol_parts = document.createElement("div")
			symbol_parts.className = "translate_parts"

			for (var part in parts) {
				var part_dom = document.createElement("i")
				part_dom.innerText = parts[part].part
				part_dom.className = "translate_part"
				symbol_parts.appendChild(part_dom)

				var means = parts[part].means
				var means_dom = document.createElement("ol")
				means_dom.className = "translate_means"
				for (var mean in means) {
					var mean_dom = document.createElement("li")
					mean_dom.innerText = means[mean]
					means_dom.appendChild(mean_dom)
				}
				symbol_parts.appendChild(means_dom)
			}
			symbol_dom.appendChild(symbol_parts)
			pop.appendChild(symbol_dom)
		}

		title.innerText = result.data.word_name
		pop.className = "translate_pop"
		pop.style.top = wordPos_y + "px"
		pop.style.left = wordPos_x + "px"

		document.getElementsByTagName("body")[0].appendChild(pop)
	}
}