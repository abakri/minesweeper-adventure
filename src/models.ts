import { Direction, Point } from "./types";
import GameConfig from "./gameConfig";
import { createBombLocations } from "./utils";

export class Hero {
    position: Point
    moveTo: Point
    direction: Direction
    isMoving: boolean
    isChangingDirections: boolean

    constructor(position: Point) {
        this.position = Object.assign({}, position)
        this.direction = Direction.DOWN
        this.isMoving = false
        this.moveTo = Object.assign({}, this.position)
        this.isChangingDirections = false
    }

    tilePosition(): Point {
        return {
            x: this.position.x / GameConfig.TILE_SIZE,
            y: this.position.y / GameConfig.TILE_SIZE,
        }
    }

    realPosition(): Point {
        return {
            x: this.position.x,
            y: this.position.y
        }
    }

    tileX(): integer {
        return this.position.x / GameConfig.TILE_SIZE
    }

    tileY(): integer {
        return this.position.y / GameConfig.TILE_SIZE
    }

    toTileX(): integer {
        return this.moveTo.x / GameConfig.TILE_SIZE
    }

    toTileY(): integer {
        return this.moveTo.y / GameConfig.TILE_SIZE
    }

    beginMove(): void {
        const { x: dx, y: dy } = Direction.vector(this.direction)

        this.moveTo = {
            x: this.position.x + dx * GameConfig.TILE_SIZE,
            y: this.position.y + dy * GameConfig.TILE_SIZE,
        }
        this.isMoving = true
    }
}

export class Tile {
    uncovered: boolean
    position: Point
    bomb: boolean
    key: boolean
    numAdjBombs: null | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

    constructor(position: Point, bomb: boolean = false) {
        this.position = position
        this.bomb = bomb
        this.uncovered = false
        this.numAdjBombs = null
        this.key = false
    }
}