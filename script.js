//
let gameState = {
    target: 200,
    homeName: 'HOME',
    visitorName: 'VISITOR',
    rounds: [],
    homeTotal: 0,
    visitorTotal: 0
};

// Load game state from memory storage
function loadGameState() {
    const savedState = {
        target: parseInt(sessionStorage.getItem('domino_target')) || 200,
        homeName: sessionStorage.getItem('domino_homeName') || 'HOME',
        visitorName: sessionStorage.getItem('domino_visitorName') || 'VISITOR',
        rounds: JSON.parse(sessionStorage.getItem('domino_rounds') || '[]'),
        homeTotal: 0,
        visitorTotal: 0
    };
    
    gameState = savedState;
    calculateTotals();
}

// Save game state to memory storage
function saveGameState() {
    sessionStorage.setItem('domino_target', gameState.target);
    sessionStorage.setItem('domino_homeName', gameState.homeName);
    sessionStorage.setItem('domino_visitorName', gameState.visitorName);
    sessionStorage.setItem('domino_rounds', JSON.stringify(gameState.rounds));
}

// Initialize game
function initGame() {
    loadGameState();
    updateDisplay();
}

// Update all display elements
function updateDisplay() {
    document.getElementById('targetValue').textContent = gameState.target;
    document.getElementById('homeScore').textContent = gameState.homeTotal;
    document.getElementById('visitorScore').textContent = gameState.visitorTotal;
    document.getElementById('homeLabel').textContent = gameState.homeName;
    document.getElementById('visitorLabel').textContent = gameState.visitorName;
    document.getElementById('homeHeaderLabel').textContent = gameState.homeName;
    document.getElementById('visitorHeaderLabel').textContent = gameState.visitorName;
    
    // Update winner highlight
    const homeBox = document.getElementById('homeBox');
    const visitorBox = document.getElementById('visitorBox');
    homeBox.classList.remove('winner');
    visitorBox.classList.remove('winner');
    
    if (gameState.homeTotal >= gameState.target) {
        homeBox.classList.add('winner');
    }
    if (gameState.visitorTotal >= gameState.target) {
        visitorBox.classList.add('winner');
    }
    
    // Update rounds list
    const roundsList = document.getElementById('roundsList');
    roundsList.innerHTML = '';
    
    if (gameState.rounds.length === 0) {
        // Mostrar estado vacío
        roundsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Sin rounds agregados</p>
            </div>
        `;
    } else {
        gameState.rounds.forEach((round, index) => {
            const roundRow = document.createElement('div');
            roundRow.className = 'round-row';
            roundRow.innerHTML = `
                <div class="round-number">
                    <button class="delete-round" onclick="deleteRound(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="round-score">${round.home}</div>
                <div class="round-score">${round.visitor}</div>
            `;
            roundsList.appendChild(roundRow);
        });
    }
}

// Calculate totals
function calculateTotals() {
    gameState.homeTotal = gameState.rounds.reduce((sum, round) => sum + round.home, 0);
    gameState.visitorTotal = gameState.rounds.reduce((sum, round) => sum + round.visitor, 0);
}

// Check for winner
async function checkWinner() {
    let winner = null;
    let winnerName = '';

    if (gameState.homeTotal >= gameState.target && gameState.visitorTotal >= gameState.target) {
        // Ambos llegaron, gana el que tenga más puntos
        if (gameState.homeTotal > gameState.visitorTotal) {
            winner = 'home';
            winnerName = gameState.homeName;
        } else if (gameState.visitorTotal > gameState.homeTotal) {
            winner = 'visitor';
            winnerName = gameState.visitorName;
        } else {
            winnerName = 'EMPATE';
        }
    } else if (gameState.homeTotal >= gameState.target) {
        winner = 'home';
        winnerName = gameState.homeName;
    } else if (gameState.visitorTotal >= gameState.target) {
        winner = 'visitor';
        winnerName = gameState.visitorName;
    }

    if (winner || winnerName === 'EMPATE') {
        const result = await Swal.fire({
            title: winnerName === 'EMPATE' ? '🤝 EMPATE!' : `🏆 ${winnerName} GANA!`,
            html: winnerName === 'EMPATE' 
                ? `<p style="font-size: 24px; margin: 20px 0;">Ambos equipos: ${gameState.target} puntos</p>`
                : `<p style="font-size: 24px; margin: 20px 0;">Score final: ${winner === 'home' ? gameState.homeTotal : gameState.visitorTotal} puntos</p>`,
            icon: 'success',
            confirmButtonText: '<i class="fas fa-redo"></i> Nueva Partida',
            allowOutsideClick: false,
            allowEscapeKey: false
        });

        if (result.isConfirmed) {
            gameState.rounds = [];
            gameState.homeTotal = 0;
            gameState.visitorTotal = 0;
            saveGameState();
            updateDisplay();
        }
    }
}

// Open add round modal
async function openAddRound() {
    const { value: formValues } = await Swal.fire({
        title: '<i class="fas fa-plus-circle"></i> Add Round',
        html:
            `<label style="display: block; margin-bottom: 10px; color: #ccc;">${gameState.homeName} Score</label>` +
            '<input id="swal-input1" class="swal2-input" type="tel" min="0" style="margin-top: 0;">' +
            `<label style="display: block; margin-bottom: 10px; margin-top: 20px; color: #ccc;">${gameState.visitorName} Score</label>` +
            '<input id="swal-input2" class="swal2-input" type="tel" min="0" style="margin-top: 0;">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Save',
        cancelButtonText: '<i class="fas fa-times"></i> Cancel',
        didOpen: () => {
            // Remover el autofocus de todos los inputs
            document.getElementById('swal-input1').blur();
            document.getElementById('swal-input2').blur();
        },
        preConfirm: () => {
            const home = parseInt(document.getElementById('swal-input1').value) || 0;
            const visitor = parseInt(document.getElementById('swal-input2').value) || 0;
            
            if (home === 0 && visitor === 0) {
                Swal.showValidationMessage('Debes agregar puntos a al menos un equipo');
                return false;
            }
            
            return [home, visitor];
        }
    });

    if (formValues) {
        gameState.rounds.push({
            home: formValues[0],
            visitor: formValues[1]
        });
        
        calculateTotals();
        saveGameState();
        updateDisplay();

        // Verificar ganador después de actualizar
        await checkWinner();
    }
}

// Delete round
async function deleteRound(index) {
    const result = await Swal.fire({
        title: '¿Eliminar este round?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-trash"></i> Eliminar',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: '#ff4444',
        cancelButtonColor: '#444'
    });

    if (result.isConfirmed) {
        gameState.rounds.splice(index, 1);
        calculateTotals();
        saveGameState();
        updateDisplay();
    }
}

// Open settings
async function openSettings() {
    const { value: formValues } = await Swal.fire({
        title: '<i class="fas fa-cog"></i> Configuración',
        html:
            '<label style="display: block; margin-bottom: 10px; color: #ccc;">Nombre Equipo 1</label>' +
            `<input id="swal-home-name" class="swal2-input" type="text" value="${gameState.homeName}" style="margin-top: 0;">` +
            '<label style="display: block; margin-bottom: 10px; margin-top: 20px; color: #ccc;">Nombre Equipo 2</label>' +
            `<input id="swal-visitor-name" class="swal2-input" type="text" value="${gameState.visitorName}" style="margin-top: 0;">` +
            '<label style="display: block; margin-bottom: 10px; margin-top: 20px; color: #ccc;">Target Score</label>' +
            `<input id="swal-target" class="swal2-input" type="number" value="${gameState.target}" min="50" step="50" style="margin-top: 0;">`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Guardar',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        didOpen: () => {
            // Remover el autofocus de todos los inputs
            document.getElementById('swal-home-name').blur();
            document.getElementById('swal-visitor-name').blur();
            document.getElementById('swal-target').blur();
        },
        preConfirm: () => {
            const homeName = document.getElementById('swal-home-name').value.trim();
            const visitorName = document.getElementById('swal-visitor-name').value.trim();
            const target = parseInt(document.getElementById('swal-target').value) || 200;
            
            if (!homeName || !visitorName) {
                Swal.showValidationMessage('Los nombres de los equipos no pueden estar vacíos');
                return false;
            }
            
            return {
                homeName: homeName,
                visitorName: visitorName,
                target: target
            };
        }
    });

    if (formValues) {
        gameState.homeName = formValues.homeName;
        gameState.visitorName = formValues.visitorName;
        gameState.target = formValues.target;
        saveGameState();
        updateDisplay();
    }
}

// Reset game
async function resetGame() {
    const result = await Swal.fire({
        title: '¿Reiniciar la partida?',
        text: "Se perderán todos los rounds guardados",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-redo"></i> Reiniciar',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: '#ff4444',
        cancelButtonColor: '#444'
    });

    if (result.isConfirmed) {
        gameState.rounds = [];
        gameState.homeTotal = 0;
        gameState.visitorTotal = 0;
        saveGameState();
        updateDisplay();
    }
}

// Initialize on load
initGame();