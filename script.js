// 问题数组
let questions = [];

// 从JSON文件加载问题
async function loadQuestions() {
    try {
        const response = await fetch('../questions.json');
        const data = await response.json();
        questions = data.mcqs.map(mcq => ({
            question: mcq.question_en,
            options: mcq.options,
            correctAnswer: mcq.options[mcq.answer_index]
        }));
        initGame();
    } catch (error) {
        console.error('Error loading questions:', error);
        // 使用默认问题作为后备
        questions = [
            {
                question: "What is the capital of France?",
                options: ["London", "Paris", "Berlin", "Madrid"],
                correctAnswer: "Paris"
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: ["Earth", "Mars", "Jupiter", "Venus"],
                correctAnswer: "Mars"
            },
            {
                question: "What is the largest ocean on Earth?",
                options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                correctAnswer: "Pacific Ocean"
            },
            {
                question: "Who wrote 'Romeo and Juliet'?",
                options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                correctAnswer: "William Shakespeare"
            },
            {
                question: "What is the chemical symbol for gold?",
                options: ["Au", "Ag", "Cu", "Fe"],
                correctAnswer: "Au"
            }
        ];
        initGame();
    }
}

let currentQuestionIndex = 0;

// DOM元素
const questionElement = document.getElementById('question');
const bubbleContainer = document.getElementById('bubbleContainer');
const popup = document.getElementById('popup');
const popupMessage = document.getElementById('popupMessage');
const nextButton = document.getElementById('nextButton');
const gameOver = document.getElementById('gameOver');

// 初始化游戏
function initGame() {
    currentQuestionIndex = 0;
    loadQuestion(currentQuestionIndex);
    gameOver.style.display = 'none';
}

// 加载问题
function loadQuestion(index) {
    const question = questions[index];
    questionElement.textContent = question.question;
    generateBubbles(question.options);
}

// 动画循环ID
let animationInterval = null;

// 生成泡泡
function generateBubbles(options) {
    bubbleContainer.innerHTML = '';
    
    // 清除之前的动画循环
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    
    const containerWidth = bubbleContainer.offsetWidth;
    const containerHeight = bubbleContainer.offsetHeight;
    const bubbleSize = 80; // 泡泡的宽度和高度
    
    options.forEach((option, index) => {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = option;
        bubble.addEventListener('click', () => handleBubbleClick(option));
        
        // 设置不同的初始位置
        let posX, posY;
        let attempts = 0;
        const maxAttempts = 100;
        let validPosition = false;
        
        // 尝试找到一个不与其他泡泡重叠的位置
        while (!validPosition && attempts < maxAttempts) {
            posX = Math.random() * (containerWidth - bubbleSize);
            posY = Math.random() * (containerHeight - bubbleSize);
            
            // 检查是否与已添加的泡泡重叠
            validPosition = true;
            const existingBubbles = bubbleContainer.querySelectorAll('.bubble');
            for (const existingBubble of existingBubbles) {
                const existingX = parseFloat(existingBubble.style.left);
                const existingY = parseFloat(existingBubble.style.top);
                
                // 计算距离
                const distance = Math.sqrt(
                    Math.pow(posX - existingX, 2) + Math.pow(posY - existingY, 2)
                );
                
                // 如果距离小于泡泡直径，则重叠
                if (distance < bubbleSize) {
                    validPosition = false;
                    break;
                }
            }
            
            attempts++;
        }
        
        bubble.style.left = `${posX}px`;
        bubble.style.top = `${posY}px`;
        
        // 添加移动属性
        bubble.dataset.speedX = (Math.random() - 0.5) * 4; // 随机水平速度（增加）
        bubble.dataset.speedY = (Math.random() - 0.5) * 4; // 随机垂直速度（增加）
        
        bubbleContainer.appendChild(bubble);
    });
    
    // 开始移动泡泡
    startBubbleMovement();
}

// 开始泡泡移动
function startBubbleMovement() {
    const containerWidth = bubbleContainer.offsetWidth;
    const containerHeight = bubbleContainer.offsetHeight;
    const bubbleSize = 80;
    
    // 清除之前的动画循环
    if (animationInterval) {
        clearInterval(animationInterval);
    }
    
    animationInterval = setInterval(() => {
        const bubbles = document.querySelectorAll('.bubble');
        
        // 保存所有泡泡的位置和速度
        const bubbleStates = [];
        bubbles.forEach(bubble => {
            bubbleStates.push({
                element: bubble,
                x: parseFloat(bubble.style.left) || 0,
                y: parseFloat(bubble.style.top) || 0,
                speedX: parseFloat(bubble.dataset.speedX),
                speedY: parseFloat(bubble.dataset.speedY)
            });
        });
        
        // 更新每个泡泡的位置
        bubbleStates.forEach((state, index) => {
            let { element, x, y, speedX, speedY } = state;
            
            // 更新位置
            x += speedX;
            y += speedY;
            
            // 边界检测和反弹
            if (x < 0 || x > containerWidth - bubbleSize) {
                speedX = -speedX;
                element.dataset.speedX = speedX;
            }
            
            if (y < 0 || y > containerHeight - bubbleSize) {
                speedY = -speedY;
                element.dataset.speedY = speedY;
            }
            
            // 泡泡之间的碰撞检测
            for (let i = 0; i < bubbleStates.length; i++) {
                if (i !== index) {
                    const otherState = bubbleStates[i];
                    const dx = x + bubbleSize/2 - (otherState.x + bubbleSize/2);
                    const dy = y + bubbleSize/2 - (otherState.y + bubbleSize/2);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 如果泡泡碰撞
                    if (distance < bubbleSize) {
                        // 计算碰撞后的速度
                        const angle = Math.atan2(dy, dx);
                        const sin = Math.sin(angle);
                        const cos = Math.cos(angle);
                        
                        // 旋转速度向量
                        const vx1 = speedX * cos + speedY * sin;
                        const vy1 = speedY * cos - speedX * sin;
                        const vx2 = otherState.speedX * cos + otherState.speedY * sin;
                        const vy2 = otherState.speedY * cos - otherState.speedX * sin;
                        
                        // 交换速度
                        element.dataset.speedX = (vx2 * cos - vy1 * sin);
                        element.dataset.speedY = (vy1 * cos + vx2 * sin);
                        otherState.element.dataset.speedX = (vx1 * cos - vy2 * sin);
                        otherState.element.dataset.speedY = (vy2 * cos + vx1 * sin);
                        
                        // 分离泡泡
                        const overlap = (bubbleSize - distance) / 2;
                        const moveX = overlap * cos;
                        const moveY = overlap * sin;
                        x += moveX;
                        y += moveY;
                        otherState.x -= moveX;
                        otherState.y -= moveY;
                    }
                }
            }
            
            // 确保泡泡在容器内
            x = Math.max(0, Math.min(x, containerWidth - bubbleSize));
            y = Math.max(0, Math.min(y, containerHeight - bubbleSize));
            
            // 更新泡泡的位置
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        });
    }, 16); // 每16毫秒更新一次（接近60fps）
}

// 处理泡泡点击
function handleBubbleClick(selectedOption) {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    
    // 显示弹出窗口
    showPopup(isCorrect);
    
    // 标记泡泡为正确或错误
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach(bubble => {
        if (bubble.textContent === selectedOption) {
            bubble.classList.add(isCorrect ? 'correct' : 'wrong');
        }
    });
}

// 显示弹出窗口
function showPopup(isCorrect) {
    popupMessage.textContent = isCorrect ? 'Correct!' : 'Wrong!';
    popupMessage.style.color = isCorrect ? '#4caf50' : '#f44336';
    popup.style.display = 'flex';
}

// 隐藏弹出窗口
function hidePopup() {
    popup.style.display = 'none';
}

// 下一个问题
function nextQuestion() {
    hidePopup();
    currentQuestionIndex++;
    
    if (currentQuestionIndex < questions.length) {
        loadQuestion(currentQuestionIndex);
    } else {
        showGameOver();
    }
}

// 显示游戏结束
function showGameOver() {
    // Hide bubble container
    bubbleContainer.style.display = 'none';
    
    // Update question element to show game over
    questionElement.innerHTML = '<h2>Game Over!</h2><p>Thank you for participation!</p>';
    
    // Create restart button
    const gameContainer = document.querySelector('.game-container');
    
    // Remove any existing restart button
    const existingRestartButton = document.getElementById('restartButton');
    if (existingRestartButton) {
        existingRestartButton.remove();
    }
    
    // Create new restart button
    const restartButton = document.createElement('button');
    restartButton.id = 'restartButton';
    restartButton.textContent = 'Play Again';
    restartButton.onclick = restartGame;
    
    // Add the button to the game container
    gameContainer.appendChild(restartButton);
    
    // Hide the old game over popup
    gameOver.style.display = 'none';
}

// 重新开始游戏
function restartGame() {
    // Show bubble container again
    bubbleContainer.style.display = 'grid';
    
    // Remove restart button if it exists
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.remove();
    }
    
    initGame();
}

// 事件监听器
nextButton.addEventListener('click', nextQuestion);

// 初始化游戏
loadQuestions();