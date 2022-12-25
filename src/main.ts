import Phaser from "phaser"
import GameConfig from "./gameConfig"
import MainGame from "./scene";

const { WIDTH, HEIGHT } = GameConfig

const config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    autoCenter: true,
    backgroundColor: 0xe1f6ff,
    scene: MainGame,
}

const game = new Phaser.Game(config)

export default game