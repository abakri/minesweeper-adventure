import Phaser from "phaser"
import GameConfig from "./gameConfig"
import loseMenu from "./loseMenu"
import MainGame from "./scene"
import startMenu from "./startMenu"
import winMenu from "./winMenu"

const config = {
    type: Phaser.AUTO,
    width: GameConfig.SCREEN_WIDTH,
    height: GameConfig.SCREEN_HEIGHT,
    autoCenter: true,
    backgroundColor: 0x000000,
    scene: [startMenu, MainGame, loseMenu, winMenu],
}

const game = new Phaser.Game(config)

export default game