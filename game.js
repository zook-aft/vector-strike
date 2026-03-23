<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vector Movement Demo</title>
    <style>
        body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #111;
        }
        canvas {
            border: 2px solid #fff;
            background-color: #222;
        }
        .info {
            position: absolute;
            bottom: 20px;
            left: 20px;
            color: white;
            font-family: monospace;
            background: rgba(0,0,0,0.7);
            padding: 10px;
            border-radius: 5px;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <div class="info">
        Use arrow keys to accelerate<br>
        Position: <span id="posX">0</span>, <span id="posY">0</span><br>
        Velocity: <span id="velX">0</span>, <span id="velY">0</span>
    </div>

    <script>
        // ---------- Vector Class ----------
        class Vector {
            constructor(x, y) {
                this.x = x;
                this.y = y;
            }

            // Returns a new Vector that is the sum of this vector and another vector
            add(v) {
                return new Vector(this.x + v.x, this.y + v.y);
            }

            // Returns a new Vector that is the difference (this - v)
            subtract(v) {
                return new Vector(this.x - v.x, this.y - v.y);
            }

            // Calculates the magnitude (length) of the vector
            magnitude() {
                return Math.hypot(this.x, this.y);
            }

            // Returns a new normalized (unit) vector; if magnitude is zero, returns a zero vector
            normalize() {
                const mag = this.magnitude();
                if (mag === 0) return new Vector(0, 0);
                return new Vector(this.x / mag, this.y / mag);
            }

            // Optional: scale the vector by a scalar factor (returns new Vector)
            scale(scalar) {
                return new Vector(this.x * scalar, this.y * scalar);
            }
        }

        // ---------- Player Class ----------
        class Player {
            constructor(x, y) {
                this.position = new Vector(x, y);
                this.velocity = new Vector(0, 0);
                this.acceleration = new Vector(0, 0);
                this.maxSpeed = 5;
                this.damping = 0.98;   // optional: air resistance
            }

            // Apply a force (acceleration) to the player
            applyForce(force) {
                this.acceleration = this.acceleration.add(force);
            }

            // Update position based on velocity and acceleration
            update() {
                // Update velocity: v = v + a
                this.velocity = this.velocity.add(this.acceleration);
                
                // Optional: limit maximum speed
                if (this.velocity.magnitude() > this.maxSpeed) {
                    this.velocity = this.velocity.normalize().scale(this.maxSpeed);
                }
                
                // Optional: apply damping to simulate friction
                this.velocity = this.velocity.scale(this.damping);
                
                // Update position: p = p + v
                this.position = this.position.add(this.velocity);
                
                // Reset acceleration after applying forces (so forces don't accumulate over time)
                this.acceleration = new Vector(0, 0);
            }

            // Get current position (returns a new Vector for safety)
            getPosition() {
                return new Vector(this.position.x, this.position.y);
            }

            // Get current velocity (returns a new Vector)
            getVelocity() {
                return new Vector(this.velocity.x, this.velocity.y);
            }
        }

        // ---------- Setup Canvas and Game State ----------
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Create player at center of canvas
        const player = new Player(canvas.width / 2, canvas.height / 2);
        
        // Keyboard input handling
        const keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };
        
        // Acceleration strength (pixels per frame²)
        const ACC_FORCE = 0.5;
        
        // Event listeners
        window.addEventListener('keydown', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = true;
                e.preventDefault(); // prevent scrolling
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = false;
                e.preventDefault();
            }
        });
        
        // Function to apply acceleration based on pressed keys
        function handleInput() {
            let force = new Vector(0, 0);
            if (keys.ArrowUp) force = force.add(new Vector(0, -ACC_FORCE));
            if (keys.ArrowDown) force = force.add(new Vector(0, ACC_FORCE));
            if (keys.ArrowLeft) force = force.add(new Vector(-ACC_FORCE, 0));
            if (keys.ArrowRight) force = force.add(new Vector(ACC_FORCE, 0));
            player.applyForce(force);
        }
        
        // Simple boundary: keep player inside canvas
        function constrainPosition() {
            const pos = player.position;
            const radius = 15; // half player size
            if (pos.x - radius < 0) pos.x = radius;
            if (pos.x + radius > canvas.width) pos.x = canvas.width - radius;
            if (pos.y - radius < 0) pos.y = radius;
            if (pos.y + radius > canvas.height) pos.y = canvas.height - radius;
        }
        
        // Drawing function
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw player as a filled circle
            ctx.beginPath();
            ctx.arc(player.position.x, player.position.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#ff3366';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            
            // Draw a little "velocity" line to show direction
            const vel = player.velocity;
            const endX = player.position.x + vel.x * 5;
            const endY = player.position.y + vel.y * 5;
            ctx.beginPath();
            ctx.moveTo(player.position.x, player.position.y);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.lineWidth = 1;
            
            // Update info display
            document.getElementById('posX').innerText = player.position.x.toFixed(1);
            document.getElementById('posY').innerText = player.position.y.toFixed(1);
            document.getElementById('velX').innerText = player.velocity.x.toFixed(2);
            document.getElementById('velY').innerText = player.velocity.y.toFixed(2);
        }
        
        // Animation loop
        let lastTimestamp = 0;
        function gameLoop() {
            handleInput();          // apply forces based on current key states
            player.update();       // integrate motion
            constrainPosition();   // keep inside canvas
            draw();                // render everything
            requestAnimationFrame(gameLoop);
        }
        
        // Start the game
        gameLoop();
    </script>
</body>
</html>
