export class VictoryMenu {
    constructor(onMainMenu, onNextWorld) {
        this.onMainMenu = onMainMenu;
        this.onNextWorld = onNextWorld;
        this.isVisible = false;
        this.menuElement = null;
        this.init();
    }

    init() {
        this.createMenuElement();
        this.setupEventListeners();
    }

    createMenuElement() {
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'victory-menu';
        this.menuElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;

        const victoryContainer = document.createElement('div');
        victoryContainer.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 50px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
        `;

        const title = document.createElement('h1');
        title.textContent = '🎉 WORLD 1 COMPLETE! 🎉';
        title.style.cssText = `
            color: white;
            font-size: 2.5em;
            margin: 0 0 20px 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        `;

        const message = document.createElement('p');
        message.textContent = 'Congratulations! You\'ve conquered the Tower Climb!';
        message.style.cssText = `
            color: #f0f0f0;
            font-size: 1.2em;
            margin: 0 0 40px 0;
            line-height: 1.5;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        `;

        // Next World Button
        const nextWorldButton = document.createElement('button');
        nextWorldButton.textContent = 'Play World 2';
        nextWorldButton.id = 'next-world-btn';
        nextWorldButton.style.cssText = `
            background: linear-gradient(45deg, #ff6b6b, #feca57);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1.1em;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
            min-width: 150px;
        `;

        // Main Menu Button
        const mainMenuButton = document.createElement('button');
        mainMenuButton.textContent = 'Main Menu';
        mainMenuButton.id = 'main-menu-btn';
        mainMenuButton.style.cssText = `
            background: linear-gradient(45deg, #48cae4, #0077b6);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1.1em;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(72, 202, 228, 0.4);
            min-width: 150px;
        `;

        // Add hover effects
        nextWorldButton.addEventListener('mouseenter', () => {
            nextWorldButton.style.transform = 'translateY(-2px)';
            nextWorldButton.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.6)';
        });

        nextWorldButton.addEventListener('mouseleave', () => {
            nextWorldButton.style.transform = 'translateY(0)';
            nextWorldButton.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.4)';
        });

        mainMenuButton.addEventListener('mouseenter', () => {
            mainMenuButton.style.transform = 'translateY(-2px)';
            mainMenuButton.style.boxShadow = '0 6px 20px rgba(72, 202, 228, 0.6)';
        });

        mainMenuButton.addEventListener('mouseleave', () => {
            mainMenuButton.style.transform = 'translateY(0)';
            mainMenuButton.style.boxShadow = '0 4px 15px rgba(72, 202, 228, 0.4)';
        });

        buttonContainer.appendChild(nextWorldButton);
        buttonContainer.appendChild(mainMenuButton);

        victoryContainer.appendChild(title);
        victoryContainer.appendChild(message);
        victoryContainer.appendChild(buttonContainer);

        this.menuElement.appendChild(victoryContainer);
        document.body.appendChild(this.menuElement);
    }

    setupEventListeners() {
        const nextWorldButton = this.menuElement.querySelector('#next-world-btn');
        const mainMenuButton = this.menuElement.querySelector('#main-menu-btn');

        nextWorldButton.addEventListener('click', () => {
            this.hide();
            if (this.onNextWorld) {
                this.onNextWorld();
            }
        });

        mainMenuButton.addEventListener('click', () => {
            this.hide();
            if (this.onMainMenu) {
                this.onMainMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isVisible) {
                this.hide();
                if (this.onMainMenu) {
                    this.onMainMenu();
                }
            }
        });
    }

    show() {
        if (this.menuElement) {
            this.menuElement.style.display = 'flex';
            this.isVisible = true;
            
            // Disable pointer lock
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
    }

    hide() {
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
            this.isVisible = false;
        }
    }

    destroy() {
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
        }
        this.isVisible = false;
    }
} 