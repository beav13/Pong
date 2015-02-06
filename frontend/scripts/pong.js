// JavaScript Document

function pong(){
	
	var self = this;
	
	var socket;
	var worker;
	
	this.gameMode = "single";
	this.started = false;
	
	var score = {
					playerOne:0,
					playerTwo:0
				};
	
	this.canvasWidth = 700;
	this.canvasHeight = 500;
	
	var playerWidth = 10;
	var playerHeight = 80;
	var playerSpeed = 5;
	
	var topRecentlyColided = false;
	var botRecentlyColided = false;
		
	var keys = [];
	
	var playerOneDefaults = function(){		
		return {					
					width:playerWidth,
					height:playerHeight,
					x:25,
					y:self.canvasHeight / 2 - playerHeight / 2,
					recentlyColided: false,
				};
	}
	
	var playerOne = new playerOneDefaults();
				
	var playerTwoDefaults = function(){		
		return {					
					width:playerWidth,
					height:playerHeight,
					x:self.canvasWidth - playerWidth - 25,
					y:self.canvasHeight / 2 - playerHeight / 2,
					recentlyColided: false
				};
	}
				
	var playerTwo = new playerTwoDefaults();
				
	var ballDefaults = function(){
		return {
					x:self.canvasWidth / 2,
					y:self.canvasHeight / 2,
					radius:10,
					startAngle:0,
					endAngle:Math.PI * 2,
					antiClockWise:false,
					speedIncreaseOnCollision:false,
					speedX:0,
					speedY:0,
				};
	}
				
	var ball = new ballDefaults();
	
	//create dom elements and add them to the dom
	this.initialize = function(container, gameMode, meId, opponentId){
		
		if(gameMode)this.gameMode = gameMode;
		
		if(this.gameMode === "single"){
			this.setUpSingleGame();
		}else if(this.gameMode === "internet"){
			this.setUpInternetGame(meId, opponentId);			
		}
		
		this.initializeDOM(container);
		
		this.addListeners();
		
		worker = new Worker('scripts/worker.js');
		worker.onmessage = function (event) {
			var msg = JSON.parse(event.data);
			
			switch(msg.type){
				
				case "render-request":
					self.draw();
				break;
				
				case "speend-increase-request":
					self.updateSpeed();
				break;
				
			}
		};
		var startMsg = {type:"start-render-request"};
		worker.postMessage(JSON.stringify(startMsg));
		
	}
	
	this.initializeDOM = function(container){
		var innerContainer = document.createElement("div");
		innerContainer.id = 'pong';
		innerContainer.style.width = (this.canvasWidth + 213)+"px";
		innerContainer.style.height = this.canvasHeight+"px";
		
		this.canvas = document.createElement("canvas");
		this.canvas.setAttribute("style","float:left");
		this.canvas.setAttribute("tabindex","1");
		this.canvas.setAttribute("id","cvs");
		this.canvas.width = this.canvasWidth;
		this.canvas.height = this.canvasHeight;
		
		innerContainer.appendChild(this.canvas);
		
		if(self.gameMode === "internet"){
			this.initializeInternetDOM(innerContainer);
		}
		
		container.appendChild(innerContainer);
	}
	
	this.initializeInternetDOM = function(container){
		var rightContainer = document.createElement("div");
		rightContainer.id = 'rightContainer';
		rightContainer.setAttribute("style","height:100%");
		
		var findOtherHandler = function(){
			var com = {
						type:"find-other-request"
						};
			socket.send(JSON.stringify(com));
			self.appendMessage("\nRestart request sent.");
			self.appendMessage("\nWaiting for opponent.");
			self.findOtherButton.disabled = true;
		}
		
		this.findOtherButton = document.createElement("input");
		this.findOtherButton.type = 'button';
		this.findOtherButton.id = 'findOtherButton';
		this.findOtherButton.value = 'Find opponent';
		this.findOtherButton.setAttribute("style","float:left");
		this.findOtherButton.disabled = true;
		this.findOtherButton.addEventListener("click", findOtherHandler);
		
		var sendMessageHandler = function(){
		var com = {
							type:"communication-message",
							message:encodeURIComponent(self.currentPlayer + ": " +self.sendMessageInput.value),
							pairId:self.pairId,
						};
				socket.send(JSON.stringify(com));
				self.sendMessageInput.value = "";
		}
		
		this.sendMessageButton = document.createElement("input");
		this.sendMessageButton.type = 'button';
		this.sendMessageButton.id = 'sendMessageButton';
		this.sendMessageButton.value = 'Send';
		this.sendMessageButton.setAttribute("style","float:left");
		this.sendMessageButton.disabled = true;
		this.sendMessageButton.addEventListener("click", sendMessageHandler);
		
		var inputChangeHandler = function(e){
			if(e.which == 13){
				e.preventDefault();
				e.stopPropagation();
				sendMessageHandler();
			}
		}
		
		this.sendMessageInput = document.createElement("input");
		this.sendMessageInput.id = 'sendMessageInput';
		this.sendMessageInput.setAttribute("style","float:left;");
		this.sendMessageInput.setAttribute("readonly","true");
		this.sendMessageInput.addEventListener("keypress", inputChangeHandler);
				
		this.messages = document.createElement("textarea");
		this.messages.setAttribute("style","float:left; resize:none; height:80%;");
		this.messages.setAttribute("readonly","true");
		
		container.appendChild(rightContainer);		
		
		rightContainer.appendChild(this.findOtherButton);
		
		rightContainer.appendChild(this.messages);
		rightContainer.appendChild(this.sendMessageInput);
		rightContainer.appendChild(this.sendMessageButton);
	}
	
	this.addListeners = function(){
		self.canvas.addEventListener("keydown", this.keyDownHandler,true);
		self.canvas.addEventListener("keyup", this.keyUpHandler,true);
		self.canvas.addEventListener("click", this.clickHandler);
	}
	
	this.removeListeners = function(){
		self.canvas.removeEventListener("keydown", this.keyDownHandler,true);
		self.canvas.removeEventListener("keyup", this.keyUpHandler,true);
		self.canvas.removeEventListener('click', self.clickHandler);
	}
	
	this.clickHandler = function(e){		
		if((e.clientX > self.canvasWidth / 2 - 50) && 
			(e.clientX < self.canvasWidth / 2 + 50) && 
			(e.clientY > 50) &&
			(e.clientY < 100) &&
			!self.started){				
				self.started = true;
				if(self.gameMode != 'internet'){
					self.nudgeBall();
					var startSpeedMsg = {type:"start-speed-increase-request"};
					worker.postMessage(JSON.stringify(startSpeedMsg));
				}else {
					self.sendStartRequest();
				}
		}		
	}
	
	this.keyDownHandler = function(e){		
		keys[e.which] = true;		
	}
	
	this.keyUpHandler = function(e){
		keys[e.which] = false;
	}
	
	this.handleKeys = function(){
		
		if(self.gameMode === "single" || self.gameMode === "double")
		{
			if(keys[87]){//w
				self.handleUp(playerOne);
			}		
			if(keys[83]){//s
				self.handleDown(playerOne);
			}
		}
		
		if(self.gameMode === "double")
		{
			if(keys[38]){//up
				self.handleUp(playerTwo);
			}			
			if(keys[40]){//down
				self.handleDown(playerTwo);
			}
		}
		
		if(self.gameMode === "internet")
		{
			if(self.currentPlayer === "left"){
				if(keys[87]){//w
					self.handleUp(playerOne);
				}			
				if(keys[83]){//s
					self.handleDown(playerOne);
				}
			}else if(self.currentPlayer === "right"){
				if(keys[38]){//up
					self.handleUp(playerTwo);
				}			
				if(keys[40]){//down
					self.handleDown(playerTwo);
				}
			}
			self.sendPlayerPosition();
		}		
		
	}
	
	this.handleUp = function(player){
		if(player.y - playerSpeed > 0){
			player.y -= playerSpeed;
		}		
	}
	
	this.handleDown = function(player){
		if((player.y + player.height + playerSpeed) < self.canvasHeight){
			player.y += playerSpeed;
		}		
	}
	
	this.draw = function(){		
		self.drawBoard();
		self.drawScore();
		self.handleKeys();
		self.drawPlayer(playerOne);
		self.drawPlayer(playerTwo);
		self.drawBall();
		if((self.gameMode != 'internet') || (self.gameMode == 'internet' && self.currentPlayer == 'left')){
			self.checkBallCollision(ball, playerOne, playerTwo);		
		}		
		self.moveBall(ball);
		if(!self.started && self.gameMode != 'internet'){
			self.drawStartButton();
		}else if(!self.started && self.connected && self.haveOponent){
			self.drawStartButton();
		}
	}
	
	this.drawBoard = function(){
		var context = self.canvas.getContext("2d");
		
		context.clearRect(0, 0, self.canvasWidth, self.canvasHeight);

		context.fillStyle = "rgb(0,0,0)";
  		context.fillRect (0, 0, self.canvasWidth, self.canvasHeight);
		
		context.fillStyle = "rgb(255,255,255)";
  		context.fillRect (self.canvasWidth / 2 - 1, 0, 3, self.canvasHeight);
	}
	
	this.drawScore = function(){
		var context = self.canvas.getContext("2d");
		context.font = "20pt Arial";
		context.fillStyle = "rgb(255, 255, 255)";
		context.fillText(score.playerOne, self.canvasWidth * 1/4, self.canvasHeight - 10);
		context.fillText(score.playerTwo, self.canvasWidth * 3/4, self.canvasHeight - 10);
	}
	
	this.drawPlayer = function(player){
		
		var context = self.canvas.getContext("2d");
		
		context.fillStyle = "rgb(255,255,255)";
  		context.fillRect (player.x, player.y, player.width, player.height);
		
	}
	
	this.drawBall = function(){
		
		var context = self.canvas.getContext("2d");
		
		context.strokeStyle = 'white';
		
		context.beginPath();
		context.arc(ball.x,ball.y,ball.radius,ball.startAngle,ball.endAngle,ball.antiClockWise);
		context.closePath();
		context.fill();		
		
	}
	
	this.moveBall = function(ball){
		ball.x += ball.speedX;
	    ball.y += ball.speedY;
		
		if(self.currentPlayer === 'left'){
			self.sendBallPosition(ball);
		}
	}
	
	this.drawStartButton = function(){
		var context = self.canvas.getContext("2d");
		
		context.beginPath();
		context.rect(self.canvasWidth / 2 - 50, 50, 100, 50);
      	context.fillStyle = 'black';
      	context.fill();
      	context.lineWidth = 3;
      	context.strokeStyle = 'white';
      	context.stroke();
		
		context.fillStyle = 'white';
		context.fillText("Start!", self.canvasWidth / 2 - 32, 83);
	}
	
	this.checkBallCollision = function(ball, playerOne, playerTwo){
		//check left and right side
		if ((ball.x + (ball.radius / 2) + ball.speedX) >= self.canvasWidth) {
			score.playerOne++;
			self.restartGame();			
      	}else if((ball.x - (ball.radius / 2) - ball.speedX) <= 0 ){
			score.playerTwo++;
			self.restartGame();
		}
		
		//check bottom side
		if (((ball.y  + (ball.radius / 2) + ball.speedY) >= self.canvasHeight) && !botRecentlyColided){
			botRecentlyColided = true;
			topRecentlyColided = false;
			ball.speedY *= -1;
      	}
		
		//check top side
		if(((ball.y  - (ball.radius / 2) + ball.speedY) <= 0) && !topRecentlyColided){
			botRecentlyColided = false;
			topRecentlyColided = true;
			ball.speedY *= -1;
		}
		
		//check paddle collision
		if((ball.x - (ball.radius / 2) <= 60) 
			&& (ball.x - (ball.radius / 2) >= 15) 
			&& !(playerOne.recentlyColided)){
			var collision = self.checkCollision(playerOne, ball);
			if(collision){
				playerOne.recentlyColided = true;
				playerTwo.recentlyColided = false;
				botRecentlyColided = false;
				topRecentlyColided = false;
				ball.speedIncreaseOnCollision?self.increaseSpeed(ball):undefined;
				ball.speedX *= -1;
			}
		}
		
		//check paddle collision
		if((ball.x + (ball.radius / 2) >= self.canvasWidth - 60 ) 
			&& (ball.x + (ball.radius / 2) <= self.canvasWidth - 15 ) 
			&& !(playerTwo.recentlyColided)){
			var collision = self.checkCollision(playerTwo, ball);
			if(collision){
				playerOne.recentlyColided = false;
				playerTwo.recentlyColided = true;
				botRecentlyColided = false;
				topRecentlyColided = false;
				ball.speedIncreaseOnCollision?self.increaseSpeed(ball):undefined;
				ball.speedX *= -1;
			}
		}
	}
	
	this.checkCollision = function(player, ball){
		
		var closestX, closestY;
		var collision = false;
		var distance;
		
		if (ball.x  < player.x)
			closestX = player.x;
		else if (ball.x  > player.x + player.width)
			closestX = player.x + player.width;
		else
			closestX = ball.x
		
		if (ball.y < player.y)
			closestY = player.y;
		else if (ball.y > player.y + player.height)
			closestY = player.y + player.height;
		else
			closestY = ball.y;
			
		distance = self.findDistance(ball.x, ball.y, closestX, closestY);
		
		if (distance < ball.radius)
			return true;
		else
			return false;
	}
	
	this.findDistance = function(fromX, fromY, toX, toY){
		var a = Math.abs(fromX - toX);
		var b = Math.abs(fromY - toY);
	 
		return Math.sqrt((a * a) + (b * b));	
	}
	
	this.restartGame = function(){
		topRecentlyColided = false;
		botRecentlyColided = false;
		playerOne = new playerOneDefaults();					
		playerTwo = new playerTwoDefaults();
		ball = new ballDefaults();
		self.nudgeBall();
		var restartSpeedMsg = {type:"start-speed-increase-request"};
		worker.postMessage(JSON.stringify(restartSpeedMsg));
		if(self.gameMode == 'internet' && self.currentPlayer == 'left')
		{
			self.sendScores();
		}
	}
	
	this.updateSpeed = function(){
		console.log("update received");
		ball.speedIncreaseOnCollision = true;
	}
	
	this.increaseSpeed = function(ball){
		if((self.gameMode != 'internet') || (self.gameMode == 'internet' && self.currentPlayer == 'left')){
			ball.speedX>0?ball.speedX++:ball.speedX--;
			ball.speedY>0?ball.speedY++:ball.speedY--;
			ball.speedIncreaseOnCollision = false;
		}
	}
	
	this.setUpSingleGame = function(){
		setInterval(this.handleAIMovement, 20);
	}
	
	this.handleAIMovement = function(){
		if(ball.y < playerTwo.y){
			self.handleUp(playerTwo);
		}
		if(ball.y > playerTwo.y + playerTwo.height){
			self.handleDown(playerTwo);
		}
	}
	
	this.setUpInternetGame = function(meId, opponentId){
		
		ball.speedX = 0;
		ball.speedY = 0;
		
		var socketPath = "ws://" + window.location.hostname + ":1339";
		socket = new WebSocket(socketPath, "echo-protocol");
			
		socket.addEventListener("open", function(event) {
			self.appendMessage("Connected.");
			self.appendMessage("\nWaiting for opponent.");
			self.connected = true;
			var sendData = {"type":"setup",
						"id": meId,
						"opponent": opponentId
						};
			 socket.send(JSON.stringify(sendData));
		});
	
		// Display messages received from the server
		socket.addEventListener("message", function(event) {
			var comm;
			  
			try
			{
				com = JSON.parse(event.data);
				  
				switch(com.type) {
					  
					case "pair-setup":
						self.pairId = com.message.pairId;
						self.id = com.message.id;
						self.currentPlayer = com.message.currentPlayer;
						self.appendMessage("\nopponent connected.");
						self.appendMessage("\nYou are on the "+self.currentPlayer);
						
						self.sendMessageInput.removeAttribute("readonly");
						self.sendMessageButton.disabled = false;
						
						self.haveOponent = true;
						self.connected = true;
						
						break;
						
					case "update-player-position-message":
						if(com.id != self.id){
							if(self.currentPlayer === 'left'){
								playerTwo.y = com.y;
							}else if(self.currentPlayer === 'right'){
								playerOne.y = com.y;
							}
						}
						break;
						
					case "update-ball-position-message":
						if(com.id != self.id){
							ball.x = com.ballX;
							ball.y = com.ballY;
						}
						break;
						
					case "update-score-message":
						if(com.id != self.id){
							score.playerOne = com.playerOne;
							score.playerTwo = com.playerTwo;
							
							playerTwo = new playerTwoDefaults();
						}
						break;
						
					case "communication-message":
						self.appendMessage("\n" + decodeURIComponent(com.message));
						break;	
						
					case "start-request":
						if(com.id != self.id){
							self.appendMessage("\nYour opponent wants to start the game.");
						}
						break;
					
					case "start":
						if(self.currentPlayer === 'left'){
							self.nudgeBall();	
							var startSpeedMsg = {type:"start-speed-increase-request"};
							worker.postMessage(JSON.stringify(startMsg));
						}
						break;
						
					case "player-disconected":
						self.connected = false;
						self.findOtherButton.disabled = false;
						
						self.started = false;
					
						self.appendMessage("\nYour opponent has left the game.");
						
						self.sendMessageInput.setAttribute("readonly","true");
						self.sendMessageButton.disabled = true;
						
						ball = new ballDefaults();
						
						score.playerOne = 0;
						score.playerTwo = 0;
					
						break;					  
				  }
			  }
			  catch(ex)
			  {
				  self.appendMessage("\nComm err.");
			  }
			  
			});
	
			// Display any errors that occur
			socket.addEventListener("error", function(event) {
			  self.appendMessage("\nError: " + event);
			});
	
			socket.addEventListener("close", function(event) {
			  self.appendMessage("\nDisconected from server.");
			});
	}
	
	this.nudgeBall = function(){
		ball.speedX = 4 * ((Math.round(Math.random()) == 0)?1:-1);
		ball.speedY = 4 * ((Math.round(Math.random()) == 0)?1:-1);
	}
	
	this.sendPlayerPosition = function(){
		if(self.connected){
			var sendData = {"type":"update-player-position-message",
							"id": self.id,
							"pairId": self.pairId,
							"y": (self.currentPlayer === 'left')?playerOne.y:playerTwo.y,
						};
			socket.send(JSON.stringify(sendData));
		}		
	}
	
	this.sendBallPosition = function(){
		if(self.connected){
			var sendData = {"type":"update-ball-position-message",
							"id": self.id,
							"pairId": self.pairId,
							"ballX": ball.x,
							"ballY": ball.y,
						};
			socket.send(JSON.stringify(sendData));
		}		
	}
	
	this.sendScores = function(){
		if(self.connected){
			var sendData = {"type":"update-score-message",
							"id": self.id,
							"pairId": self.pairId,
							"playerOne": score.playerOne,
							"playerTwo": score.playerTwo,
						};
			socket.send(JSON.stringify(sendData));
		}
	}
	
	this.sendStartRequest = function(){
		if(self.connected && self.haveOponent){
			var sendData = {"type":"start-request",
							"id": self.id,
							"pairId": self.pairId
						};
			socket.send(JSON.stringify(sendData));
			self.appendMessage("\nStart game request sent.");
		}
	}
	
	this.appendMessage = function(message){
		self.messages.value += message;
		self.messages.scrollTop = self.messages.scrollHeight;
	}
	
	return {
		initialize: function() {
			self.initialize.apply(self, arguments);
		}
	}
}