import Phaser from 'phaser'
import GameConfig from './gameConfig'
import { Hero, Tile } from './models'
import { Direction, Point } from './types'
import { createBombLocations, getSurroundingPoints, numSurroundingBombs, outOfBounds } from './utils'
import { isEqual } from "lodash"
import { uncoverConnectedSafeTiles } from './algo'

const {
    WIDTH,
    HEIGHT,
    TILE_SIZE,
    MAX_BOMBS,
    MIN_BOMBS,
    HERO_SPEED,
} = GameConfig

export default class MainGame extends Phaser.Scene {
    tileSize: integer = TILE_SIZE
    tilesWide: integer = WIDTH / TILE_SIZE
    tilesHigh: integer = HEIGHT / TILE_SIZE
    maxBombs: integer = MAX_BOMBS
    numBombs: integer = Math.floor(Math.random() * (MAX_BOMBS - MIN_BOMBS)) + MIN_BOMBS
    heroTileStartPosition: Point
    bombLocations: Array<Point>
    hero: Hero
    map: Tile[][]
    graphics: Phaser.GameObjects.Graphics | null = null
    textList: Phaser.GameObjects.Text[]


    constructor() {
        super("Main")
        this.textList = []
        this.heroTileStartPosition = {
            x: Math.floor(Math.random() * this.tilesWide),
            y: Math.floor(Math.random() * this.tilesHigh),
        }
        const surroundingHeroStart = getSurroundingPoints(this.heroTileStartPosition, this.tilesHigh - 1, this.tilesWide - 1)
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
                    if (isEqual(loc, position)){
                        isBomb = true
                    }
                })
                const tile = new Tile(
                    position,
                    isBomb
                )
                if (y === this.hero.tileY() && x === this.hero.tileX()) tile.uncovered = true
                surroundingHeroStart.forEach(pos => {
                    if (isEqual(pos, position)) {
                        tile.uncovered = true
                    }
                })
                row.push(tile)
            }
            this.map.push(row)
        }

        // set the tile numbers
        for (let y = 0; y < this.tilesHigh; y++) {
            for (let x = 0; x < this.tilesWide; x++) {
                const tile = this.map[y][x]
                const numBombs = numSurroundingBombs(this.map, tile.position.x, tile.position.y)
                if (numBombs !== 0) tile.numAdjBombs = numBombs
            }
        }
    }

    preload() {
    }

    create() {
        this.graphics = this.add.graphics()
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
                const {x: dx, y: dy} = Direction.vector(this.hero.direction)
                const nextTilePosition = {
                    x: this.hero.tileX() + dx,
                    y: this.hero.tileY() + dy,
                }
                const nextOOB = outOfBounds(nextTilePosition.x, nextTilePosition.y, this.tilesWide, this.tilesHigh)
                if (this.hero.direction === direction && !nextOOB) {
                    this.hero.beginMove()
                    uncoverConnectedSafeTiles(this.map, this.hero.toTileX(), this.hero.toTileY())
                }
                else {
                    this.hero.isChangingDirections = true
                    this.time.delayedCall(150, () => { this.hero.isChangingDirections = false })
                    this.hero.direction = direction
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
            const tile = this.map[this.hero.tileY()][this.hero.tileX()]
            if (tile.bomb){
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
                const tileColor = tile.uncovered ? 0xb5b5b5 : 0x8f8f8f
                graphics.fillStyle(tileColor)
                graphics.lineStyle(0.5, 0x000000)
                graphics.fillRect(
                    x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize,
                )
                graphics.strokeRect(
                    x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize
                )

                // draw the numbers
                if (tile.uncovered) {
                    const style = { font: "32px Arial", fill: "#0000ff", align: "center" }
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
        graphics.fillStyle(0xff0000)
        graphics.fillCircle(this.hero.position.x + this.tileSize / 2, this.hero.position.y + this.tileSize / 2, this.tileSize / 2)

        // draw hero direction
        graphics.fillStyle(0x00ff00)
        switch (this.hero.direction) {
            case Direction.UP:
                graphics.fillCircle(
                    this.hero.position.x + this.tileSize / 2,
                    this.hero.position.y + 2,
                    2,
                )
                break
            case Direction.DOWN:
                graphics.fillCircle(
                    this.hero.position.x + this.tileSize / 2,
                    this.hero.position.y + this.tileSize - 2,
                    2,
                )
                break
            case Direction.LEFT:
                graphics.fillCircle(
                    this.hero.position.x + 2,
                    this.hero.position.y + this.tileSize / 2,
                    2,
                )
                break
            case Direction.RIGHT:
                graphics.fillCircle(
                    this.hero.position.x + this.tileSize - 2,
                    this.hero.position.y + this.tileSize / 2,
                    2,
                )
                break
            default:
                graphics.fillCircle(
                    this.hero.position.x + this.tileSize / 2,
                    this.hero.position.y + 2,
                    2,
                )
        }

    }
}