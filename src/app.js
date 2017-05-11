const senseJoystick = require('sense-joystick');
const senseLeds = require('sense-hat-led');
const _ = require('lodash');

// The delay between calling our tick function. This also handles the snake
// moving so it should not be too quick
const tickDelayStart = process.env.SNAKE_TICK_DELAY || 400;
var tickDelay = tickDelayStart;

const snakeColour = [0, 255, 0];
const black = [0, 0, 0];
const foodColour = [255, 127, 0];

const snake = {
	// Our snake starts small
	size: 2,
	// snakes are mostly green
	colour: snakeColour,
	// start in the middle
	positions: [[4, 4], [4, 3]]
};

// Start by going right
var nextDirection = 'stop';
var timerHandle;

const randomFoodPos = () => {
	return [_.random(0, 7), _.random(0, 7)];
};

var foodPos = randomFoodPos();

const clearScreen = () => {
	pixels = [
		black, black, black, black, black, black, black, black,
		black, black, black, black, black, black, black, black,
		black, black, black, black, black, black, black, black,
		black, black, black, black, black, black, black, black,
		black, black, black, black, black, black, black, black,
		black, black, black, black, black, black, black, black,
		black, black, black, black, black, black, black, black,
		black, black, black, black, black, black, black, black
	];

	senseLeds.setPixels(pixels);
};

const drawSnake = () => {
	_.each(snake.positions, (pos) => {
		senseLeds.setPixel(pos[0], pos[1], snake.colour);
	});
};

const moveHead = (head) => {
	switch(nextDirection) {
		case 'up':
			return [head[0], head[1] - 1];
		case 'down':
			return [head[0], head[1] + 1];
		case 'left':
			return [head[0] - 1, head[1]];
		case 'right':
			return [head[0] + 1, head[1]];
		case 'stop':
			return head;
	}
};

const offScreen = (pos) => {
	if (pos[0] < 0 || pos[0] >= 8) return true;
	if (pos[1] < 0 || pos[1] >= 8) return true;
	return false;
};

const displayCross = () => {
	const red = [255, 0, 0];

	senseLeds.setPixels([
			red, black, black, black, black, black, black, red,
			black, red, black, black, black, black, red, black,
			black, black, red, black, black, red, black, black,
			black, black, black, red, red, black, black, black,
			black, black, red, black, black, red, black, black,
			black, red, black, black, black, black, red, black,
			red, black, black, black, black, black, black, red,
			black, black, black, black, black, black, black, black,
	]);

};

const restartGame = () => {
	snake.size = 2;
	snake.positions = [[4, 4], [4, 5]];
	nextDirection = 'stop';
	tickDelay = tickDelayStart;

	timerHandle = setInterval(tick, tickDelay);
};

const pointEquals = (a, b) => {
	return a[0] == b[0] && a[1] == b[1];
};

const drawFood = (pos) => {
	senseLeds.setPixel(pos[0], pos[1], foodColour);
};

const isIntersecting = (head, body) => {
	const point = _.find(body, (cell) => {
		return pointEquals(head, cell);
	});

	return point !== undefined;
};

const setNewFoodPos = () => {
	foodPos = randomFoodPos();

	while (isIntersecting(foodPos, snake.positions)) {
		foodPos = randomFoodPos();
	}
};

// Setup input callbacks
senseJoystick.getJoystick()
.then((joystick) => {
	joystick.on('press', (val) => {
		if (val === 'click') {
			snake.colour = [_.random(40, 255), _.random(40, 255), _.random(40, 255)];
		} else {
			nextDirection = val;
		}
	});
});

// This function is the brains of our snake game. It will be called periodically
// and update the internal models of the snake and the game, and also will update
// the screen.
const tick = () => {

	// first clear the screen
	clearScreen();

	if (nextDirection !== 'stop') {
		let eating = false;
		if (pointEquals(snake.positions[0], foodPos)) {
			snake.size += 1;
			tickDelay -= 10;
			clearInterval(timerHandle);
			timerHandle = setInterval(tick, tickDelay);
			setNewFoodPos();
			eating = true;
		}

		// Pop the last element, the tail, and insert another at the start
		// which uses the correct direction
		let end;
		if (eating) {
			end = snake.positions[snake.positions.length - 1];
		} else {
			end = snake.positions.pop();
		}

		const newHead = moveHead(snake.positions[0]);
		snake.positions = [newHead].concat(snake.positions);


		// Check that the snake hasn't went off the end of the screen
		if (offScreen(newHead) || isIntersecting(newHead, snake.positions.slice(1))) {
			// Set the snake back to it's starting position, display a
			// cross and then set a timer to restart the game
			clearInterval(timerHandle);

			displayCross();

			setTimeout(restartGame, 3000);

			return;
		}
	}

	drawFood(foodPos);
	drawSnake();

};

timerHandle = setInterval(tick, tickDelay);
