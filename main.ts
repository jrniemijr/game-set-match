// ========================================================
// Rally - Tennis Wall Bounce with Obstacles
// MakeCode Arcade (JavaScript / Static TypeScript)
// ========================================================

// Define custom sprite kind for obstacles
namespace SpriteKind {
    export const Obstacle = SpriteKind.create()
}

// Set court background color (green)
scene.setBackgroundColor(7)

// Show game start splash screen
game.splash("RALLY", "Dodge obstacles & bounce the ball!")

// Set player lives and initial score
info.setScore(0)
info.setLife(3)

// --------------------------------------------------------
// Racket / Paddle Setup
// --------------------------------------------------------

const INITIAL_PADDLE_HEIGHT = 36
const MIN_PADDLE_HEIGHT = Math.floor(INITIAL_PADDLE_HEIGHT * 0.20) // 20% limit
let currentPaddleHeight = INITIAL_PADDLE_HEIGHT

// Helper function to draw a paddle of given height
function createPaddleImage(height: number): Image {
    let img = image.create(4, height)
    img.fill(1) // 1 = White
    return img
}

// Create player paddle sprite on the left side
let paddle = sprites.create(createPaddleImage(currentPaddleHeight), SpriteKind.Player)
paddle.x = 10
paddle.y = 60
paddle.setStayInScreen(true)

// Move paddle up and down with D-pad / Arrow keys
controller.moveSprite(paddle, 0, 110)

// --------------------------------------------------------
// Obstacles Setup (4 Randomly Placed Bumpers)
// --------------------------------------------------------

// Create 8x8 orange bumper image
let obstacleImage = img`
    . . 4 4 4 4 . .
    . 4 4 e e 4 4 .
    4 4 e 1 1 e 4 4
    4 e 1 1 1 1 e 4
    4 e 1 1 1 1 e 4
    4 4 e 1 1 e 4 4
    . 4 4 e e 4 4 .
    . . 4 4 4 4 . .
`

// Spawn 4 obstacles distributed across the middle playfield
for (let i = 0; i < 4; i++) {
    let obstacle = sprites.create(obstacleImage, SpriteKind.Obstacle)
    // Keep obstacles between x: 35-140 and y: 15-105 so play is fair
    obstacle.x = randint(35 + i * 25, 55 + i * 25)
    obstacle.y = randint(20, 100)
    obstacle.setStayInScreen(true)
}

// --------------------------------------------------------
// Tennis Ball Setup
// --------------------------------------------------------

// 8x8 yellow tennis ball image
let ballImage = img`
    . . 5 5 5 5 . .
    . 5 5 1 5 5 5 .
    5 5 1 1 5 5 5 5
    5 1 1 5 5 1 1 5
    5 1 5 5 5 1 1 5
    5 5 5 5 1 1 5 5
    . 5 5 5 1 5 5 .
    . . 5 5 5 5 . .
`

let ball = sprites.create(ballImage, SpriteKind.Enemy)

// Function to reset and serve the ball
function launchBall() {
    ball.setPosition(80, 60)
    ball.setVelocity(-80, randint(-40, 40))
}

launchBall()

// --------------------------------------------------------
// Wall Bounces & Out-of-Bounds Detection
// --------------------------------------------------------

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

    // Missed paddle on the left side
    if (ball.left <= 0) {
        music.play(music.melodyPlayable(music.wawawawaa), music.PlaybackMode.InBackground)
        scene.cameraShake(3, 300)
        info.changeLifeBy(-1)

        if (info.life() > 0) {
            launchBall()
        }
    }
})

// --------------------------------------------------------
// Paddle & Ball Overlap
// --------------------------------------------------------

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (playerSprite, ballSprite) {
    // Send ball to the right and increase speed
    ballSprite.vx = Math.abs(ballSprite.vx) + 4

    // Angle return trajectory based on impact location
    let hitOffset = ballSprite.y - playerSprite.y
    ballSprite.vy = hitOffset * 6

    // Push ball outside paddle to avoid multi-collision glitch
    ballSprite.left = playerSprite.right + 1

    // Update score and hit feedback
    info.changeScoreBy(1)
    playerSprite.startEffect(effects.spray, 150)
    music.play(music.melodyPlayable(music.pewPew), music.PlaybackMode.InBackground)

    // Shrink racket by 15% of initial size, stopping at 20% minimum
    let shrinkAmount = Math.max(1, Math.round(INITIAL_PADDLE_HEIGHT * 0.15))
    if (currentPaddleHeight - shrinkAmount >= MIN_PADDLE_HEIGHT) {
        currentPaddleHeight -= shrinkAmount
        playerSprite.setImage(createPaddleImage(currentPaddleHeight))
    }
})

// --------------------------------------------------------
// Obstacle & Ball Overlap (Redirection)
// --------------------------------------------------------

sprites.onOverlap(SpriteKind.Obstacle, SpriteKind.Enemy, function (obstacleSprite, ballSprite) {
    // Determine collision direction (horizontal vs vertical impact)
    let dx = ballSprite.x - obstacleSprite.x
    let dy = ballSprite.y - obstacleSprite.y

    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal rebound with a random vertical shift
        ballSprite.vx = (dx > 0 ? 1 : -1) * Math.max(50, Math.abs(ballSprite.vx))
        ballSprite.vy += randint(-25, 25)
    } else {
        // Vertical rebound with a random horizontal shift
        ballSprite.vy = (dy > 0 ? 1 : -1) * Math.max(40, Math.abs(ballSprite.vy))
        ballSprite.vx += randint(-15, 15)
    }

    // Keep ball moving at a healthy minimum horizontal pace
    if (Math.abs(ballSprite.vx) < 50) {
        ballSprite.vx = ballSprite.vx >= 0 ? 50 : -50
    }

    // Visual pop effect and sound on hit
    obstacleSprite.startEffect(effects.warmRadial, 150)
    music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
})
