const senseJoystick = require('sense-joystick');
const senseLeds = require('sense-hat-led');
const _ = require('lodash');
const lodash = _;

// The delay between calling our tick function. This also handles the snake
// moving so it should not be too quick
const tickDelayStart = process.env.SNAKE_TICK_DELAY || 400;
const tickDelayModifier = process.env.SNAKE_TICK_MODIFIER || 10;
var tickDelay = tickDelayStart;

const WIDTH = 8;
const HEIGHT = 8;

// const snakeColour = [0, 255, 0];
const snakeColour = [0, 255, 255];
//const headColour = [137, 172, 163];
const headColour = [0, 172, 163];
const black = [0, 0, 0];
const red = [255, 0, 0];
const foodColour = [255, 127, 0];
const mazeColour = [255, 0, 0];

const snake = {
	// Our snake starts small
	size: 2,
	// snakes are mostly green
	colour: snakeColour,
	// start in the middle
	positions: [[4, 3], [4, 4]]
};

var nextDirection;
var lastDirection;
var foodPos;
var currentMaze = 0;

var pixelBuffer;

const { mazes, mazePoints, cross } = (() => {
	const _ = black;
	const X = red;
	const mazes = {
		none: [
			_, _, _, _, _, _, _, _,
			_, _, _, _, _, _, _, _,
			_, _, _, _, _, _, _, _,
			_, _, _, _, _, _, _, _,
			_, _, _, _, _, _, _, _,
			_, _, _, _, _, _, _, _,
			_, _, _, _, _, _, _, _,
			_, _, _, _, _, _, _, _
		],
		corner: [
			_, _, _, _, _, _, _, _,
			_, X, X, _, _, X, X, _,
			_, X, _, _, _, _, X, _,
			_, _, _, _, _, _, _, _,
			_, _, _, _, _, _, _, _,
			_, X, _, _, _, _, X, _,
			_, X, X, _, _, X, X, _,
			_, _, _, _, _, _, _, _
		],
		thing: [
			_, _, _, _, _, _, _, _,
			_, X, _, _, _, _, X, _,
			_, _, X, _, _, X, _, _,
			_, _, X, _, _, X, _, _,
			_, _, X, _, _, X, _, _,
			_, _, X, _, _, X, _, _,
			_, X, _, _, _, _, X, _,
			_, _, _, _, _, _, _, _
		]
	};

	const mazePoints = lodash.map(mazes, (maze) => {
		return lodash.flatMap(maze, (pixel, pos) => {
			if(pixel === X) {
				return [[ pos % WIDTH, Math.floor(pos / WIDTH) ]];
			}
			return [];
		});
	});
	const cross = [
		X, _, _, _, _, _, _, X,
		_, X, _, _, _, _, X, _,
		_, _, X, _, _, X, _, _,
		_, _, _, X, X, _, _, _,
		_, _, _, X, X, _, _, _,
		_, _, X, _, _, X, _, _,
		_, X, _, _, _, _, X, _,
		X, _, _, _, _, _, _, X
	];

	return { mazes, mazePoints, cross }
})();
const mazeOptions = _.keys(mazes);

const clearScreen = () => {
	pixelBuffer = _.clone(mazes.none);
};

const positionToIdx = ([ x, y ]) => {
	if (x < 0 || x >= WIDTH) {
		throw new Error(`x is out of bounds: ${x}`);
	}
	if (y < 0 || y >= HEIGHT) {
		throw new Error(`y is out of bounds: ${y}`);
	}
	return x + WIDTH * y;
};


const setPixel = (pos, colour) => {
	pixelBuffer[positionToIdx(pos)] = colour;
};

const drawSnake = () => {
	setPixel(snake.positions[0], headColour);
	_.each(snake.positions.slice(1), (pos) => {
		setPixel(pos, snake.colour);
	});
};

const moveHead = (head) => {
	lastDirection = nextDirection.shift() || lastDirection;
	switch(lastDirection) {
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

const oppositeDirection = (direction) => {
	switch(direction) {
		case 'up':
			return 'down';
		case 'down':
				return 'up';
		case 'left':
				return 'right';
		case 'right':
				return 'left';
		case 'stop':
			return 'stop';
	}
};

const offScreen = (pos) => {
	if (pos[0] < 0 || pos[0] >= WIDTH) return true;
	if (pos[1] < 0 || pos[1] >= HEIGHT) return true;
	return false;
};

const displayCross = () => {
	senseLeds.setPixels(cross);
};


const pointEquals = (a, b) => {
	return a[0] == b[0] && a[1] == b[1];
};

const drawFood = (pos) => {
	setPixel(pos, foodColour);
};

const drawMaze = () => {
	pixelBuffer = _.clone(mazes[mazeOptions[currentMaze]]);
};

const isIntersecting = (head, body) => {
	const checkCell = (cell) => {
		return pointEquals(head, cell);
	};
	// Check if the body intersects
	if (_.some(body, checkCell)) return true;

	// Check if the maze intersects
	if (_.some(mazePoints[currentMaze], checkCell)) return true;

	return false;
};

const randomFoodPos = () => {
	return [_.random(0, 7), _.random(0, 7)];
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
			if (lastDirection === 'stop') {
				currentMaze = (currentMaze + 1) % mazeOptions.length;
				restartGame();
			}
			else {
				pauseGame();
				snake.colour = [_.random(40, 255), _.random(40, 255), _.random(40, 255)];
			}
		} else {
			unpauseGame()
			let currentDir = _.last(nextDirection) || lastDirection;
			if (val !== currentDir && val !== oppositeDirection(currentDir)) {
				nextDirection.push(val);
			}
		}
	});
});

// This function is the brains of our snake game. It will be called periodically
// and update the internal models of the snake and the game, and also will update
// the screen.
const tick = () => {

	// first draw the maze
	drawMaze();

	if ((nextDirection[0] || lastDirection) !== 'stop') {
		let newHead = moveHead(snake.positions[0]);
		snake.positions = [newHead].concat(snake.positions);

		if (pointEquals(newHead, foodPos)) {
			snake.size += 1;
			tickDelay -= tickDelayModifier;
			startGameLoop()
			setNewFoodPos();
		} else {
			// If we're not eating
			snake.positions.pop();
		}

		// Check that the snake hasn't went off the end of the screen
		if (offScreen(newHead) || isIntersecting(newHead, snake.positions.slice(1))) {
			// Set the snake back to it's starting position, display a
			// cross and then set a timer to restart the game
			stopGameLoop();

			displayCross();

			setTimeout(() => {
				clearScreen();
				senseLeds.showMessage(` ${snake.size - 2} ${snake.size - 2}`, () => {
					setTimeout(restartGame, 500);
				});
			}, 800);

			return;
		}
	}

	drawFood(foodPos);
	drawSnake();
	senseLeds.setPixels(pixelBuffer);
};

const restartGame = () => {
	snake.size = 2;
	snake.positions = [[4, 4], [4, 5]];
	nextDirection = [];
	lastDirection = 'stop';
	tickDelay = tickDelayStart;
	setNewFoodPos();

	startGameLoop();
};

let timerHandle;
const STOPPED = 0;
const PAUSED = 1;
const RUNNING = 2;
let state = STOPPED;
const pauseGame = () => {
	if (state === STOPPED) return;
	state = PAUSED;
	clearInterval(timerHandle);
}
const unpauseGame = () => {
	if (state === PAUSED) {
		startGameLoop();
	}
}
const startGameLoop = () => {
	clearInterval(timerHandle);
	timerHandle = setInterval(tick, tickDelay);
	state = RUNNING;
}
const stopGameLoop = () => {
	state = STOPPED;
	clearInterval(timerHandle);
}

restartGame();
