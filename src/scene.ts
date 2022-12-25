import Phaser from 'phaser'
import GameConfig from './gameConfig'
import { Hero, Tile } from './models'
import { Direction, Point } from './types'
import { createBombLocations, getSurroundingEightPoints, numSurroundingBombs, outOfBounds } from './utils'
import { isEqual, sampleSize } from "lodash"
import { reachablePoints, uncoverConnectedSafeTiles } from './algo'

const {
    TILES_WIDE,
    TILES_HIGH,
    TILE_SIZE,
    MAX_BOMBS,
    MIN_BOMBS,
    HERO_SPEED,
} = GameConfig

enum grassTileFrameMapping {
    TALL_GRASS = 0,
    NORMAL = 1,
    ONE = 2,
    TWO = 3,
    THREE = 4,
    FOUR = 5,
    FIVE = 6,
    SIX = 7,
    SEVEN = 8,
    EIGHT = 9,
}

const playerDirectionFrameMapping = {
    [Direction.DOWN]: 0,
    [Direction.UP]: 4,
    [Direction.LEFT]: 8,
    [Direction.RIGHT]: 12,
}

interface SpriteMap {
    tile: Phaser.GameObjects.Sprite,
    key: Phaser.GameObjects.Sprite | null
}

export default class MainGame extends Phaser.Scene {
    tileSize: integer = TILE_SIZE
    tilesWide: integer = TILES_WIDE
    tilesHigh: integer = TILES_HIGH
    maxBombs: integer = MAX_BOMBS
    numBombs: integer = Math.floor(Math.random() * (MAX_BOMBS - MIN_BOMBS)) + MIN_BOMBS
    heroTileStartPosition: Point
    bombLocations: Point[]
    hero: Hero
    map: Tile[][]
    graphics: Phaser.GameObjects.Graphics | null = null
    heroSprite: Phaser.GameObjects.Sprite | null = null
    tileSpriteMap: SpriteMap[][] = []
    keyLocations: Point[]


    constructor() {
        super("Main")
        this.heroTileStartPosition = {
            x: Math.floor(Math.random() * this.tilesWide),
            y: Math.floor(Math.random() * this.tilesHigh),
        }
        const surroundingHeroStart = getSurroundingEightPoints(this.heroTileStartPosition, this.tilesHigh - 1, this.tilesWide - 1)
        this.bombLocations = createBombLocations(
            this.numBombs,
            this.tilesWide,
            this.tilesWide,
            [this.heroTileStartPosition, ...surroundingHeroStart],
        )
        this.hero = new Hero({
            x: this.heroTileStartPosition.x * this.tileSize,
            y: this.heroTileStartPosition.y * this.tileSize,
        })

        // create map
        this.map = []
        for (let y = 0; y < this.tilesHigh; y++) {
            const row: Tile[] = []
            for (let x = 0; x < this.tilesWide; x++) {
                const position = { x, y }
                let isBomb = false
                this.bombLocations.forEach(loc => {
                    if (isEqual(loc, position)) {
                        isBomb = true
                    }
                })
                const tile = new Tile(
                    position,
                    isBomb
                )
                row.push(tile)
            }
            this.map.push(row)
        }

        // get the reachable points for hero
        this.keyLocations = sampleSize(reachablePoints(this.map, this.hero.tileX(), this.hero.tileY()), GameConfig.NUM_KEYS)

        // set the tile numbers
        for (let y = 0; y < this.tilesHigh; y++) {
            for (let x = 0; x < this.tilesWide; x++) {
                const tile = this.map[y][x]
                const numBombs = numSurroundingBombs(this.map, tile.position.x, tile.position.y)
                if (numBombs !== 0) tile.numAdjBombs = numBombs
            }
        }

        // uncover hero surrounding tiles
        const numUncoveredTiles = uncoverConnectedSafeTiles(this.map, this.heroTileStartPosition.x, this.heroTileStartPosition.y)
    }

    preload() {
        this.load.spritesheet("hero", "character.png", {
            frameWidth: 48,
            frameHeight: 48,
        });
        this.load.spritesheet("grass", "grass.png", {
            frameWidth: 64,
            frameHeight: 64,
        })
        this.load.spritesheet("key", "key.png", {
            frameWidth: 32,
            frameHeight: 32,
        })
    }

    create() {
        this.graphics = this.add.graphics()
        this.graphics.setDepth(3)

        // init hero sprite
        this.heroSprite = this.add.sprite(0, 0, "hero");
        this.heroSprite.setDepth(4)
        this.heroSprite.scale = 2

        // init animations
        this.initAnimations()

        // create tileSprites
        for (let y = 0; y < this.tilesHigh; y++) {
            const row: SpriteMap[] = []
            for (let x = 0; x < this.tilesWide; x++) {
                const currPosition: Point = { x, y }
                const tileSprite = this.add.sprite(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, "grass", grassTileFrameMapping.TALL_GRASS)
                tileSprite.setScale(0.75)
                tileSprite.setDepth(1)

                let hasKey = false
                let keySprite: Phaser.GameObjects.Sprite | null = null
                this.keyLocations.forEach(loc => {
                    if (isEqual(loc, currPosition)) {
                        hasKey = true
                    }
                })

                if (hasKey) {
                    // keySprite = this.add.sprite(x * this.tileSize + this.tileSize / 2, y * this.tileSize + this.tileSize / 2, "key", 0)
                    // keySprite.setScale(1.5)
                    // keySprite.setDepth(1)
                }

                row.push({
                    tile: tileSprite,
                    key: keySprite,
                })
            }
            this.tileSpriteMap.push(row)
        }

        this.cameras.main.startFollow(this.heroSprite)
        // uncomment to set bounds to scrolling
        this.cameras.main.setBounds(0, 0, this.tileSize * this.tilesWide, this.tileSize * this.tilesHigh)
        this.cameras.main.roundPixels = true;
        this.drawMap(this.graphics)
    }

    update() {
        this.graphics?.clear()
        this.listenInput()
        this.moveHero()
        this.drawMap(this.graphics)
    }

    listenInput(): void {
        if (this.hero.isMoving || this.hero.isChangingDirections) return

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
                const { x: dx, y: dy } = Direction.vector(this.hero.direction)
                const nextTilePosition = {
                    x: this.hero.tileX() + dx,
                    y: this.hero.tileY() + dy,
                }
                const nextOOB = outOfBounds(nextTilePosition.x, nextTilePosition.y, this.tilesWide, this.tilesHigh)
                if (this.hero.direction === direction && !nextOOB) {
                    this.hero.beginMove()
                    this.heroSprite?.anims.play(this.hero.direction.toString())
                    const numUncoveredTiles = uncoverConnectedSafeTiles(this.map, this.hero.toTileX(), this.hero.toTileY())
                }
                else {
                    this.hero.isChangingDirections = true
                    this.time.delayedCall(150, () => { this.hero.isChangingDirections = false })
                    this.hero.direction = direction
                    this.heroSprite?.setFrame(playerDirectionFrameMapping[this.hero.direction])
                }
                return
            }
        }
    }

    moveHero(): void {
        if (!this.hero.isMoving) return

        const { x: dx, y: dy } = Direction.vector(this.hero.direction)
        this.hero.position = {
            x: this.hero.position.x + dx * HERO_SPEED,
            y: this.hero.position.y + dy * HERO_SPEED,
        }

        if (isEqual(this.hero.position, this.hero.moveTo)) {
            this.hero.isMoving = false
            const standingFrame = this.heroSprite?.anims.currentAnim.frames[1].frame.name || 0
            this.heroSprite?.anims.stop()
            this.heroSprite?.setFrame(standingFrame);
            const tile = this.map[this.hero.tileY()][this.hero.tileX()]
            if (tile.bomb) {
                this.cameras.main.shake(250, 0.006)
                console.log("GAME OVER!")
            }
        }

    }

    drawMap(graphics: Phaser.GameObjects.Graphics | null): void {
        if (!graphics) return
        // draw map
        for (let y = 0; y < this.tilesHigh; y++) {
            for (let x = 0; x < this.tilesWide; x++) {
                const tile = this.map[y][x]
                const {tile: tileSprite, key: keySprite} = this.tileSpriteMap[y][x]
                if (tile.uncovered) {
                    if (tile.bomb || !tile.numAdjBombs) tileSprite.setFrame(grassTileFrameMapping.NORMAL)
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

        // draw bombs
        this.bombLocations.forEach(point => {
            const tile = this.map[point.y][point.x]
            if (!tile.uncovered) return
            graphics.fillStyle(0x000000)
            graphics.fillCircle(point.x * this.tileSize + this.tileSize / 2, point.y * this.tileSize + this.tileSize / 2, this.tileSize / 2)
        })

        // draw hero
        this.heroSprite?.setPosition(this.hero.position.x + this.tileSize / 2, this.hero.position.y + this.tileSize / 2)
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
    }
}