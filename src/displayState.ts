import Phaser from "phaser"
import GameConfig from "./gameConfig"
import { GameState } from "./state"
import { Point } from "./types"
import { isEqual } from "lodash"

export interface SpriteMap {
    tile: Phaser.GameObjects.Sprite,
    key: Phaser.GameObjects.Sprite | null

    bomb: Phaser.GameObjects.Image | null
}

export enum grassTileFrameMapping {
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

export class DisplayState {
    heroSprite: Phaser.GameObjects.Sprite
    scoreDisplay: Phaser.GameObjects.Text
    tileSpriteMap: SpriteMap[][]
    livesDisplay: Phaser.GameObjects.Image[]

    constructor(scene: Phaser.Scene, gameState: GameState) {
        // init heroSprite
        this.heroSprite = new Phaser.GameObjects.Sprite(scene, gameState.hero.position.x + GameConfig.TILE_SIZE / 2, gameState.hero.position.y + GameConfig.TILE_SIZE / 2, "hero");
        this.heroSprite.setDepth(4)
        this.heroSprite.scale = 2

        // init scoreDisplay
        this.scoreDisplay = new Phaser.GameObjects.Text(scene, 3, 3, `${0}/${GameConfig.NUM_KEYS}`, { fontFamily: "arial", fontSize: `30px` })
        this.scoreDisplay.setDepth(100)
        this.scoreDisplay.setScrollFactor(0) // score is static on screen

        // init livesDisplay
        this.livesDisplay = []
        for (let i = 0; i < GameConfig.NUM_LIVES; i++) {
            const heartImage = new Phaser.GameObjects.Image(scene, GameConfig.SCREEN_WIDTH - ((1 + i) * GameConfig.TILE_SIZE) + GameConfig.TILE_SIZE / 2, GameConfig.TILE_SIZE / 2, "heart")
            heartImage.setDepth(99)
            heartImage.setScrollFactor(0)
            heartImage.setScale(0.5)
            this.livesDisplay.push(
                heartImage
            )

        }

        this.tileSpriteMap = []
        for (let y = 0; y < GameConfig.TILES_HIGH; y++) {
            const row: SpriteMap[] = []
            for (let x = 0; x < GameConfig.TILES_WIDE; x++) {
                const currPosition: Point = { x, y }
                const tileSprite = new Phaser.GameObjects.Sprite(scene, x * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2, y * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2, "grass", grassTileFrameMapping.TALL_GRASS)
                tileSprite.setScale(0.75)
                tileSprite.setDepth(1)

                let hasKey = false
                let keySprite: Phaser.GameObjects.Sprite | null = null
                gameState.keyLocations.forEach(loc => {
                    if (isEqual(loc, currPosition)) {
                        hasKey = true
                    }
                })

                let hasBomb = false
                let bombSprite: Phaser.GameObjects.Sprite | null = null
                gameState.bombLocations.forEach(loc => {
                    if (isEqual(loc, currPosition)) {
                        hasBomb = true
                    }
                })

                if (hasKey) {
                    keySprite = new Phaser.GameObjects.Sprite(scene, x * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2, y * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2, "key", 0)
                    // keySprite.setScale(1)
                    keySprite.setDepth(5)
                    keySprite.anims.play("spin")
                    keySprite.setVisible(false)
                }

                else if (hasBomb) {
                    bombSprite = new Phaser.GameObjects.Sprite(scene, x * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2, y * GameConfig.TILE_SIZE + GameConfig.TILE_SIZE / 2, "bomb")
                    bombSprite.setDepth(3)
                    bombSprite.setVisible(false)
                    bombSprite.setScale(0.3)
                }

                row.push({
                    tile: tileSprite,
                    key: keySprite,
                    bomb: bombSprite
                })
            }
            this.tileSpriteMap.push(row)
        }
    }

    addObjects() {
        this.heroSprite.addToDisplayList()
        this.scoreDisplay.addToDisplayList()
        this.livesDisplay.forEach(object => {
            object.addToDisplayList()
        })
        this.tileSpriteMap.forEach(row => {
            row.forEach(object => {
                object.bomb?.addToDisplayList()
                object.key?.addToDisplayList()
                object.tile.addToDisplayList()
            })
        })

    }
}