import GameConfig from "./gameConfig"
import { Hero, Tile } from "./models"
import { Point } from "./types"
import { createBombLocations, getSurroundingEightPoints, numSurroundingBombs } from "./utils"
import { isEqual, sampleSize } from "lodash"
import { reachablePoints, uncoverConnectedSafeTiles } from "./algo"

export class GameState {
    numBombs: integer
    bombLocations: Point[]
    hero: Hero
    map: Tile[][]
    keyLocations: Point[]
    numKeysRetrieved: integer
    livesRemaining: integer

    constructor() {
        this.numKeysRetrieved = 0
        this.livesRemaining = GameConfig.NUM_LIVES

        this.numBombs = Math.floor(Math.random() * (GameConfig.MAX_BOMBS - GameConfig.MIN_BOMBS)) + GameConfig.MIN_BOMBS
        this.hero = new Hero({
            x: Math.floor(Math.random() * GameConfig.TILES_WIDE) * GameConfig.TILE_SIZE,
            y: Math.floor(Math.random() * GameConfig.TILES_HIGH) * GameConfig.TILE_SIZE,
        })
        this.bombLocations = createBombLocations(
            this.numBombs,
            GameConfig.TILES_WIDE,
            GameConfig.TILES_HIGH,
            [this.hero.tilePosition(), ...getSurroundingEightPoints(this.hero.tilePosition(), GameConfig.TILES_HIGH - 1, GameConfig.TILES_WIDE - 1)],
        )

        this.map = []
        for (let y = 0; y < GameConfig.TILES_HIGH; y++) {
            const row: Tile[] = []
            for (let x = 0; x < GameConfig.TILES_WIDE; x++) {
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

        this.keyLocations = sampleSize(reachablePoints(this.map, this.hero.tileX(), this.hero.tileY()), GameConfig.NUM_KEYS)
        this.keyLocations.forEach(({ x, y }) => { this.map[y][x].key = true }) // set the key for each tile that has one
        
        // set the tile numbers
        for (let y = 0; y < GameConfig.TILES_HIGH; y++) {
            for (let x = 0; x < GameConfig.TILES_WIDE; x++) {
                const tile = this.map[y][x]
                const numBombs = numSurroundingBombs(this.map, tile.position.x, tile.position.y)
                if (numBombs !== 0) tile.numAdjBombs = numBombs
            }
        }
        
        // uncover the tiles around where the hero is standing
        uncoverConnectedSafeTiles(this.map, this.hero.tileX(), this.hero.tileY())
    }
}