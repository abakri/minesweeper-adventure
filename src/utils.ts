import { isEqual} from "lodash"
import { mapIsConnected } from "./algo"
import { Tile } from "./models"
import { Point } from "./types"

export const surroundingEightVectors: Array<[integer, integer]> = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
]

export const surroundingFourVectors: Array<[integer, integer]> = [
    [-1, 0], [1, 0], [0, 1], [0, -1],
]

// TODO: complete
export function generateMap(width: integer, height: integer, heroStartPosition: Point, bombLocations: Array<Point>): Array<Array<Tile>> {
    const map = []
    for (let y = 0; y < height; y++) {
        const row = []
        for (let x = 0; x < width; x++) {
        }
    }
    return [[]]
}

export function createBombLocations(numBombs: integer, maxWidth: integer, maxHeight: integer, invalidPositions: Array<Point>): Array<Point> {
    let locations: Array<Point> = []
    do {
        locations = []
        while (locations.length < numBombs) {
            while (true) {
                const randomPoint = {
                    x: Math.floor(Math.random() * maxWidth),
                    y: Math.floor(Math.random() * maxHeight),
                }
                if (!invalidPositions.some(x => isEqual(x, randomPoint))) {
                    locations.push(randomPoint)
                    break
                }
            }
        }
    } while (mapIsConnected(maxWidth, maxHeight, locations))
    return locations
}

export function getSurroundingEightPoints(point: Point, maxY: integer, maxX: integer): Array<Point> {

    const result: Array<Point> = []

    surroundingEightVectors.forEach(dir => {
        const [y, x] = dir
        const newY = point.y + y
        const newX = point.x + x
        if (newY < 0 || newY > maxY || newX < 0 || newX > maxX) {
            return
        }
        result.push({ x: newX, y: newY })
    })

    return result
}

export function getSurroundingFourPoints(point: Point, maxY: integer, maxX: integer): Array<Point> {

    const result: Array<Point> = []

    surroundingFourVectors.forEach(dir => {
        const [y, x] = dir
        const newY = point.y + y
        const newX = point.x + x
        if (newY < 0 || newY > maxY || newX < 0 || newX > maxX) {
            return
        }
        result.push({ x: newX, y: newY })
    })

    return result
}


export function numSurroundingBombs(map: Tile[][], tileX: integer, tileY: integer): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 {
    let total: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 0
    const surroundingPoints = getSurroundingEightPoints({ x: tileX, y: tileY }, map.length - 1, map[0].length - 1)
    surroundingPoints.forEach(({ x, y }) => {
        const tile = map[y][x]
        if (tile.bomb) total += 1
    })
    return total
}

export function outOfBounds(x: integer, y: integer, xBounds: integer, yBounds: integer) {
    return x < 0 || x >= xBounds || y < 0 || y >= yBounds
}