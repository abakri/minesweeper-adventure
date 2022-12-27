import Phaser from 'phaser'
import GameConfig from './gameConfig'

export default class startMenu extends Phaser.Scene {
    clouds!: Phaser.GameObjects.Image[]

    constructor() {
        super("startmenu")
        //  Inject our CSS
        const element = document.createElement('style');
        document.head.appendChild(element);
        const sheet = element.sheet;
        const styles = '@font-face { font-family: "troika"; src: url("assets/fonts/ttf/troika.otf") format("opentype"); }\n';
        sheet?.insertRule(styles, 0);
    }

    preload() {
        this.load.spritesheet("hero", "static/character.png", {
            frameWidth: 48,
            frameHeight: 48,
        });
        this.load.image("cloud", "static/cloud.png")
        this.load.bitmapFont("titlefont", "static/arcade.png", "static/arcade.xml")
    }

    create() {
        const background = this.add.graphics()
        background.fillStyle(0xa7acd9)
        background.fillRect(0, 0, GameConfig.SCREEN_WIDTH, GameConfig.SCREEN_HEIGHT)

        // add clouds
        this.clouds = []
        for(let i = 0;i<12;i++) {
            const newCloud = this.add.image(Math.floor(Math.random()*GameConfig.SCREEN_WIDTH), Math.floor(Math.random()*GameConfig.SCREEN_HEIGHT), "cloud")
            newCloud.setScale(0.9)
            this.clouds.push(newCloud)
        }

        const menu = this.add.graphics()
        const menuWidth = GameConfig.SCREEN_WIDTH * 0.8
        const menuHeight = GameConfig.SCREEN_HEIGHT * 0.4
        menu.fillStyle(0x7dba8f)
        menu.fillRoundedRect((GameConfig.SCREEN_WIDTH / 2) - (menuWidth / 2), (GameConfig.SCREEN_HEIGHT / 2) - (menuHeight / 2) + 35, menuWidth, menuHeight, 50)
        menu.fillStyle(0x5DA271)
        menu.fillRoundedRect((GameConfig.SCREEN_WIDTH / 2) - (menuWidth / 2), (GameConfig.SCREEN_HEIGHT / 2) - (menuHeight / 2) + 50, menuWidth, menuHeight - 10, 50)
        menu.lineStyle(7, 0x061a0b)
        menu.strokeRoundedRect((GameConfig.SCREEN_WIDTH / 2) - (menuWidth / 2), (GameConfig.SCREEN_HEIGHT / 2) - (menuHeight / 2) + 35, menuWidth, menuHeight, 50)

        const title = this.add.bitmapText(0, 0, "titlefont", "Minesweeper\nAdventure", 50)
        title.setPosition((GameConfig.SCREEN_WIDTH / 2) - (title.width / 2), 120)
        title.setDropShadow(-5, 5, 0x000000, 1)
        title.setLetterSpacing()
        title.setCenterAlign()

        const paragraphStyle = { fontFamily: "arial", fontSize: "22px" }
        const paragraphContent = `We have lost the keys to the city in the wilderness,\nwhere the Americans have left hundreds of landmines!\nPlease help us find the keys! (；人；)`
        const paragraph = this.add.text(0, 0, paragraphContent, paragraphStyle)
        paragraph.setPosition((GameConfig.SCREEN_WIDTH / 2) - (paragraph.width / 2), 310)
        paragraph.setAlign("center")

        const playText = this.add.text(0, 0, "[press spacebar to continue]", paragraphStyle)
        playText.setPosition((GameConfig.SCREEN_WIDTH / 2) - (playText.width / 2), 550)
        playText.setAlign("center")

        const playerSprite = this.add.sprite(0, 0, "hero")
        playerSprite.setScale(5)
        playerSprite.setPosition((GameConfig.SCREEN_WIDTH / 2) - playerSprite.width/2 + 15, (GameConfig.SCREEN_HEIGHT / 2) - playerSprite.height/2 + 80)

        const charTextStyle = { fontFamily: "arial", fontSize: "12px" }
        const charText = this.add.text(0, 0, "(this is you, a blurry, ambiguous animal)", charTextStyle)
        charText.setPosition((GameConfig.SCREEN_WIDTH / 2) - charText.width/2 + 150, (GameConfig.SCREEN_HEIGHT / 2) - charText.height/2 + 50)
        charText.setRotation(0.1)

        const spacebar = this.input.keyboard.addKey("SPACE")
        spacebar.on("down", () => {this.scene.start("game")})
        
    }

    update() {
        this.clouds.forEach(cloud => {
            cloud.x += 0.09
            if (cloud.x - cloud.width / 2 > GameConfig.SCREEN_WIDTH) {
                cloud.setPosition(
                    cloud.width/2 * -1,
                    Math.floor(Math.random() * GameConfig.SCREEN_HEIGHT)
                )
            }
        })
    }
}