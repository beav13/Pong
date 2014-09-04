var renderTimer;
var speedIncreaseTimer;

function triggerRender(){
	var msg = {type: "render-request"};
	postMessage(JSON.stringify(msg));
}

function triggerSpeedIncrease(){
	var msg = {type: "speend-increase-request"};
	postMessage(JSON.stringify(msg));
}

self.addEventListener('message', function(e) {
  var msg = JSON.parse(e.data);
  
  switch (msg.type){
  
	case "start-render-request":
		renderTimer = setInterval(triggerRender, 20);
	break;
	
	case "stop-speed-increase-request":
		clearInterval(speedIncreaseTimer);
	break;
	
	case "start-speed-increase-request":
		clearInterval(speedIncreaseTimer);
		speedIncreaseTimer = setInterval(triggerSpeedIncrease, 10000);
	break;
  
  }
});
