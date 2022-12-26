import Phaser from "phaser"
import GameConfig from "./gameConfig"
import MainGame from "./scene";


const config = {
    type: Phaser.AUTO,
    width: GameConfig.SCREEN_WIDTH,
    height: GameConfig.SCREEN_HEIGHT,
    autoCenter: true,
    backgroundColor: 0x000000,
    scene: [MainGame],
}

const game = new Phaser.Game(config)

export default game