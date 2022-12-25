import { getSurroundingEightPoints, getSurroundingFourPoints } from "./utils"
import { Tile } from "./models";
import { Point } from "./types";

interface Counter {
    count: integer
}

function serializePositionTuple(x: integer, y: integer): string {
    return `${x},${y}`
}

function deserializePositionTuple(serializedPositionTuple: string): [integer, integer] {
    const splitString = serializedPositionTuple.split(",")
    return [parseInt(splitString[0]), parseInt(splitString[1])]
}

export function uncoverConnectedSafeTiles(map: Tile[][], x: integer, y: integer): integer {
    const targetTile = map[y][x]
    if (targetTile.uncovered) return 0// if already uncovered, do nothing
    if (targetTile.bomb) {
        targetTile.uncovered = true
        return 0
    }
    const visited = new Set<string>()
    const counter: Counter = { count: 0 } // create a counter to keep track of the uncovered tiles
    uncoverConnectedHelper(visited, map, x, y, counter)
    return counter.count
}

function uncoverConnectedHelper(visited: Set<string>, map: Tile[][], x: integer, y: integer, counter: Counter): void {
    // out of bounds
    if (x < 0 || y < 0 || x >= map[0].length || y >= map.length) return

    const tile = map[y][x]
    if (tile.bomb) return
    if (visited.has(serializePositionTuple(x, y))) return

    visited.add(serializePositionTuple(x, y))
    if(!tile.uncovered){ // don't want to double count the counter
        tile.uncovered = true
        counter.count += 1
    }

    if (tile.numAdjBombs != null) return // return after uncovering for the numbered ones

    const surrounding = getSurroundingEightPoints({ x, y }, map.length - 1, map[0].length - 1)
    surrounding.forEach(({ x: newX, y: newY }) => {
        uncoverConnectedHelper(visited, map, newX, newY, counter)
    })
}

export function reachablePoints(map: Tile[][], x: integer, y: integer): Point[] {
    const visited = new Set<string>()
    reachablePointsHelper(visited, map, x, y)

    const points: Point[] = []
    visited.forEach(stringPoint => {
        const [vx, vy] = deserializePositionTuple(stringPoint)
        if(vx === x && vy === y) return
        points.push({
            x: vx,
            y: vy,
        })
    })
    return points
}

function reachablePointsHelper(visited: Set<string>, map: Tile[][], x: integer, y: integer): void {
    // out of bounds
    if (x < 0 || y < 0 || x >= map[0].length || y >= map.length) return

    const tile = map[y][x]
    if (tile.bomb) return
    if (visited.has(serializePositionTuple(x, y))) return

    visited.add(serializePositionTuple(x, y))
    const surrounding = getSurroundingFourPoints({ x, y }, map.length - 1, map[0].length - 1)
    surrounding.forEach(({ x: newX, y: newY }) => {
        reachablePointsHelper(visited, map, newX, newY)
    })
}


/* I DONT ACTUALLY THINK THIS WORKS :SKULL: INVESTIGATE */

// ------------------- UNUSED ---------------------------------------------------------------------------
export function mapIsConnected(mapWidth: integer, mapHeight: integer, bombLocations: Point[]): boolean {

    // create a set of bombLocations for constant time lookup
    const bombLocationSet = new Set<string>()
    bombLocations.forEach(({ x, y }) => bombLocationSet.add(serializePositionTuple(x, y)))

    let startX = 0
    let startY = 0


    // create a map where 1 is bomb and 0 is empty
    const map: number[][] = []
    for (let y = 0; y < mapHeight; y++) {
        const row: integer[] = []
        for (let x = 0; x < mapWidth; x++) {
            if (bombLocationSet.has(serializePositionTuple(x, y))) row.push(1)
            else {
                row.push(0)

                // set startX and startY to be any empty tile
                // we don't mind setting this each time
                startX = x
                startY = y
            }
        }
        map.push(row)
    }

    const visited = new Set<string>()
    mapIsConnectedHelper(visited, map, startX, startY)

    // map is connected if the number if visited tiles in the dfs is the total number of non-bomb tiles
    return visited.size === mapWidth * mapHeight - bombLocations.length

}

function mapIsConnectedHelper(visited: Set<string>, map: integer[][], x: integer, y: integer): void {
    const tile = map[y][x]
    // out of bounds
    if (x < 0 || y < 0 || x >= map[0].length || y >= map.length) return
    if (tile === 1) return
    if (visited.has(serializePositionTuple(x, y))) return

    visited.add(serializePositionTuple(x, y))
    const surrounding = getSurroundingFourPoints({ x, y }, map.length - 1, map[0].length - 1)
    surrounding.forEach(({ x: newX, y: newY }) => {
        mapIsConnectedHelper(visited, map, newX, newY)
    })
}
// ----------------------------------------------------------------------------------------------------