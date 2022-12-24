export interface Point {
    x: integer,
    y: integer,
}

export interface Vector {
    x: -1 | 0 | 1,
    y: -1 | 0 | 1,
}

export enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT
}

export namespace Direction {
    export function vector(direction: Direction): Vector {
        switch (direction) {
            case Direction.UP:
                return { x: 0, y: -1 }
            case Direction.RIGHT:
                return { x: 1, y: 0 }
            case Direction.LEFT:
                return { x: -1, y: 0 }
            case Direction.DOWN:
                return { x: 0, y: 1 }
        }
    }
}