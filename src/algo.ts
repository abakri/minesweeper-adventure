import { getSurroundingPoints } from "./utils"
import { Tile } from "./models";

function serializePositionTuple(x: integer, y: integer) : string {
    return `${x},${y}`
}

export function uncoverConnectedSafeTiles(map: Tile[][], x: integer, y: integer): void {
    const targetTile = map[y][x]
    if (targetTile.uncovered) return // if already uncovered, do nothing
    if (targetTile.bomb || targetTile.numAdjBombs != null) {
        targetTile.uncovered = true
        return
    }
    const visited = new Set<string>()
    uncoverConnectedHelper(visited, map, x, y)
}

function uncoverConnectedHelper(visited: Set<string>, map: Tile[][], x: integer, y: integer): void {
    const tile = map[y][x]
    // out of bounds
    if (x < 0 || y < 0 || x >= map[0].length || y >= map.length) return
    if (tile.bomb) return
    if (visited.has(serializePositionTuple(x, y))) return

    visited.add(serializePositionTuple(x, y))
    tile.uncovered = true

    if (tile.numAdjBombs != null) return // return after uncovering for the numbered ones

    const surrounding = getSurroundingPoints({x, y}, map.length - 1, map[0].length - 1)
    surrounding.forEach(({x: newX, y: newY}) => {
        uncoverConnectedHelper(visited, map, newX, newY)
    })
}