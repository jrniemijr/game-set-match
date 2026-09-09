// ==========================================
// Rally - Single-Player Tennis / Wall Bounce
// ==========================================

// Set background color to green (court)
scene.setBackgroundColor(7)

// Show game start splash title
game.splash("RALLY", "Bounce the ball off the wall!")

// Set player lives and initial score
info.setScore(0)
info.setLife(3)

// ------------------------------------------
// Sprites Setup
// ------------------------------------------

// Create the player's racket sprite (4x24 white paddle)
let paddleImage = image.create(4, 24)
paddleImage.fill(1) // 1 = White
let paddle = sprites.create(paddleImage, SpriteKind.Player)
paddle.x = 10
paddle.y = 60
paddle.setStayInScreen(true)

// Allow the player to move up and down with D-pad / Arrow keys
controller.moveSprite(paddle, 0, 100)

// Create the tennis ball sprite (6x6 yellow ball)
let ballImage = image.create(6, 6)
ballImage.fill(5) // 5 = Yellow
let ball = sprites.create(ballImage, SpriteKind.Enemy)

// Function to launch/reset the ball towards the player
function launchBall() {
    ball.setPosition(80, 60)
    ball.setVelocity(-80, randint(-50, 50))
}

launchBall()

// ------------------------------------------
// Game Loop & Boundary Handling
// ------------------------------------------

game.onUpdate(function () {
    // Bounce off top wall
    if (ball.top <= 0) {
        ball.top = 0
        ball.vy = Math.abs(ball.vy)
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
    }

    // Bounce off bottom wall
    if (ball.bottom >= scene.screenHeight()) {
        ball.bottom = scene.screenHeight()
        ball.vy = -Math.abs(ball.vy)
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
    }

    // Bounce off right wall
    if (ball.right >= scene.screenWidth()) {
        ball.right = scene.screenWidth()
        ball.vx = -Math.abs(ball.vx)
        music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
    }

    // Missed the paddle on the left side
    if (ball.left <= 0) {
        music.play(music.melodyPlayable(music.wawawawaa), music.PlaybackMode.InBackground)
        scene.cameraShake(3, 300)
        info.changeLifeBy(-1)
        if (info.life() > 0) {
            launchBall()
        }
    }
})

// ------------------------------------------
// Paddle & Ball Collisions
// ------------------------------------------

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (playerSprite, enemyBall) {
    // Reverse horizontal direction and slightly increase speed
    enemyBall.vx = Math.abs(enemyBall.vx) + 5

    // Angle the rebound based on where the ball hit the paddle
    let offset = enemyBall.y - playerSprite.y
    enemyBall.vy = offset * 6

    // Prevent ball from getting stuck inside paddle
    enemyBall.left = playerSprite.right + 1

    // Add score, visual effect, and sound
    info.changeScoreBy(1)
    playerSprite.startEffect(effects.spray, 150)
    music.play(music.melodyPlayable(music.pewPew), music.PlaybackMode.InBackground)
})