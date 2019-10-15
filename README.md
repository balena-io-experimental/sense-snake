# SenseSnake

Snake for the raspberrypi sense-hat on balena!

## Configuration

Set the following env-vars to control the game:

### SNAKE_TICK_DELAY
Set this to change the delay between frames, smaller delay, faster gameplay
Default: 400 ms
Recommended: 400 for slower gameplay for newer players, 200 for a faster start for those who have played a bit more

### SNAKE_TICK_MODIFIER
Set this value to change how much the delay reduces by when eating a food
Default: 10ms
Recommended: 10ms with a higher tick delay (~400ms), 5ms with a lower tick delay (~200ms)
