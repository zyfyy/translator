let changeColor = document.querySelector('.content');

chrome.storage.sync.get(null, function (items) {
  var allKeys = Object.keys(items);
  console.log(allKeys);
});
