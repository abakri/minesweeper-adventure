import Phaser from 'phaser'
import GameConfig from './gameConfig'
import { Direction } from './types'
import { outOfBounds } from './utils'
import { isEqual } from "lodash"
import { uncoverConnectedSafeTiles } from './algo'
import { GameState } from './state'
import { DisplayState, grassTileFrameMapping } from './displayState'

const playerDirectionFrameMapping = {
    [Direction.DOWN]: 0,
    [Direction.UP]: 4,
    [Direction.LEFT]: 8,
    [Direction.RIGHT]: 12,
}

export default class MainGame extends Phaser.Scene {
    gameState!: GameState
    displayState!: DisplayState


    constructor() {
        super("game")
    }

    preload() {
        this.load.spritesheet("hero", "static/character.png", {
            frameWidth: 48,
            frameHeight: 48,
        });
        this.load.spritesheet("grass", "static/grass.png", {
            frameWidth: 64,
            frameHeight: 64,
        })
        this.load.spritesheet("key", "static/key.png", {
            frameWidth: 32,
            frameHeight: 32,
        })
        this.load.image("heart", "static/heart.png")
        this.load.image("bomb", "static/bomb.png")
    }

    create() {
        // create a new GameState and DisplayState for each scene start
        this.gameState = new GameState()
        this.displayState = new DisplayState(this, this.gameState)
        this.displayState.addObjects()

        // init animations
        this.initAnimations()

        // setup camera
        this.cameras.main.startFollow(this.displayState.heroSprite)
        // use scrolling bounds so we dont pan off the edge of the map
        this.cameras.main.setBounds(0, 0, GameConfig.TILE_SIZE * GameConfig.TILES_WIDE, GameConfig.TILE_SIZE * GameConfig.TILES_HIGH)
        this.cameras.main.roundPixels = true;

        // draw the map
        this.drawMap()
    }

    update() {
        this.listenInput()
        this.moveHero()
        this.drawMap()
    }

    listenInput(): void {
        if (this.gameState.hero.isMoving || this.gameState.hero.isChangingDirections) return

        const cursors = this.input.keyboard.createCursorKeys();
        const iter = [
            { cursor: cursors.left, direction: Direction.LEFT },
            { cursor: cursors.right, direction: Direction.RIGHT },
            { cursor: cursors.down, direction: Direction.DOWN },
            { cursor: cursors.up, direction: Direction.UP },
        ]

        for (let i = 0; i < iter.length; i++) {
            const { cursor, direction } = iter[i]
            if (cursor.isDown) {
                const { x: dx, y: dy } = Direction.vector(this.gameState.hero.direction)
                const nextTilePosition = {
                    x: this.gameState.hero.tileX() + dx,
                    y: this.gameState.hero.tileY() + dy,
                }
                const nextOOB = outOfBounds(nextTilePosition.x, nextTilePosition.y, GameConfig.TILES_WIDE, GameConfig.TILES_HIGH)
                if (this.gameState.hero.direction === direction && !nextOOB) {
                    this.gameState.hero.beginMove()
                    this.displayState.heroSprite.anims.play(this.gameState.hero.direction.toString())
                    uncoverConnectedSafeTiles(this.gameState.map, this.gameState.hero.toTileX(), this.gameState.hero.toTileY())

                    // if there is a key in the next tile, remove it
                    const tile = this.gameState.map[this.gameState.hero.toTileY()][this.gameState.hero.toTileX()]
                    if (tile.key) {
                        tile.key = false
                        const spriteMap = this.displayState.tileSpriteMap[this.gameState.hero.toTileY()][this.gameState.hero.toTileX()]
                        const key = spriteMap.key
                        key?.destroy()
                        spriteMap.key = null
                        this.gameState.numKeysRetrieved += 1
                        this.displayState.scoreDisplay?.setText(`${this.gameState.numKeysRetrieved}/${GameConfig.NUM_KEYS}`)
                        if (this.gameState.numKeysRetrieved === GameConfig.NUM_KEYS) this.scene.start("winMenu")
                    }
                }
                else {
                    this.gameState.hero.isChangingDirections = true
                    this.time.delayedCall(150, () => { this.gameState.hero.isChangingDirections = false })
                    this.gameState.hero.direction = direction
                    this.displayState.heroSprite.setFrame(playerDirectionFrameMapping[this.gameState.hero.direction])
                }
                return
            }
        }
    }

    moveHero(): void {
        if (!this.gameState.hero.isMoving) return

        const { x: dx, y: dy } = Direction.vector(this.gameState.hero.direction)
        this.gameState.hero.position = {
            x: this.gameState.hero.position.x + dx * GameConfig.HERO_SPEED,
            y: this.gameState.hero.position.y + dy * GameConfig.HERO_SPEED,
        }

        if (isEqual(this.gameState.hero.position, this.gameState.hero.moveTo)) {
            this.gameState.hero.isMoving = false
            const standingFrame = this.displayState.heroSprite.anims.currentAnim.frames[1].frame.name || 0
            this.displayState.heroSprite.anims.stop()
            this.displayState.heroSprite.setFrame(standingFrame);
            const tile = this.gameState.map[this.gameState.hero.tileY()][this.gameState.hero.tileX()]
            if (tile.bomb) {
                this.cameras.main.shake(250, 0.006)
                this.gameState.livesRemaining -= 1
                const heartToRemove = this.displayState.livesDisplay.pop()
                heartToRemove?.destroy()

                if (this.gameState.livesRemaining === 0) {
                    this.scene.start("loseMenu")
                }
            }
        }

    }

    drawMap(): void {
        // draw map
        for (let y = 0; y < GameConfig.TILES_HIGH; y++) {
            for (let x = 0; x < GameConfig.TILES_WIDE; x++) {
                const tile = this.gameState.map[y][x]
                // remove the keySprite if the key is obtained
                const { tile: tileSprite, key: keySprite, bomb: bombSprite} = this.displayState.tileSpriteMap[y][x]
                if (tile.uncovered) {
                    if (tile.bomb || !tile.numAdjBombs || tile.key) {
                        tileSprite.setFrame(grassTileFrameMapping.NORMAL)
                        if(tile.key) keySprite?.setVisible(true)
                        if(tile.bomb) bombSprite?.setVisible(true)
                    }
                    else if (tile.numAdjBombs === 1) tileSprite.setFrame(grassTileFrameMapping.ONE)
                    else if (tile.numAdjBombs === 2) tileSprite.setFrame(grassTileFrameMapping.TWO)
                    else if (tile.numAdjBombs === 3) tileSprite.setFrame(grassTileFrameMapping.THREE)
                    else if (tile.numAdjBombs === 4) tileSprite.setFrame(grassTileFrameMapping.FOUR)
                    else if (tile.numAdjBombs === 5) tileSprite.setFrame(grassTileFrameMapping.FIVE)
                    else if (tile.numAdjBombs === 6) tileSprite.setFrame(grassTileFrameMapping.SIX)
                    else if (tile.numAdjBombs === 7) tileSprite.setFrame(grassTileFrameMapping.SEVEN)
                    else if (tile.numAdjBombs === 8) tileSprite.setFrame(grassTileFrameMapping.EIGHT)
                }
            }
        }

        // draw hero
        this.displayState.heroSprite.setPosition(this.gameState.hero.position.x + GameConfig.TILE_SIZE / 2, this.gameState.hero.position.y + GameConfig.TILE_SIZE / 2)

        // reduce the alpha of text if the hero is in position 0,0
        if(this.gameState.hero.moveTo.x === 0 && this.gameState.hero.moveTo.y === 0 && this.displayState.scoreDisplay) this.displayState.scoreDisplay.alpha = 0.7
        else if (this.displayState.scoreDisplay) this.displayState.scoreDisplay.alpha = 1

        // reduce the alpha of lives if the hero is in position 0,0
        if(this.gameState.hero.toTileY() === 0 && [GameConfig.TILES_WIDE - 1, GameConfig.TILES_WIDE -2].includes(this.gameState.hero.toTileX())){
            this.displayState.livesDisplay.forEach(heart => {
                heart.alpha = 0.6
            })
        }
        else{
            this.displayState.livesDisplay.forEach(heart => {
                heart.alpha = 1
            })
        }
    }

    initAnimations() {
        // init hero animations
        this.anims.create({
            key: Direction.DOWN.toString(),
            frames: this.anims.generateFrameNumbers("hero", {
                start: 0,
                end: 3,
            }),
            frameRate: 10,
            repeat: -1,
        })
        this.anims.create({
            key: Direction.UP.toString(),
            frames: this.anims.generateFrameNumbers("hero", {
                start: 4,
                end: 7,
            }),
            frameRate: 10,
            repeat: -1,
        })
        this.anims.create({
            key: Direction.LEFT.toString(),
            frames: this.anims.generateFrameNumbers("hero", {
                start: 8,
                end: 11,
            }),
            frameRate: 10,
            repeat: -1,
        })
        this.anims.create({
            key: Direction.RIGHT.toString(),
            frames: this.anims.generateFrameNumbers("hero", {
                start: 12,
                end: 15,
            }),
            frameRate: 10,
            repeat: -1,
        })

        // init key animation
        this.anims.create({
            key: "spin",
            frames: this.anims.generateFrameNumbers("key", {
                start: 0,
                end: 11,
            }),
            frameRate: 8,
            repeat: -1,
        })
    }
}