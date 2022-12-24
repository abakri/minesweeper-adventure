import Phaser from "phaser"
import GameConfig from "./gameConfig"
import MainGame from "./scene";

const { WIDTH, HEIGHT } = GameConfig

const config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    autoCenter: true,
    backgroundColor: 0xa9a9a9,
    scene: MainGame,
}

const game = new Phaser.Game(config)

export default game