export class LeaderboardManager {
    constructor() {
        this.storageKey = 'ballBlitzLeaderboards';
        this.categories = {
            fullRun: 'Full Pacman Run (Levels 1-10)',
            classicMode: 'Classic Mode',
            individualLevels: 'Individual Pacman Levels',
            battleTournament: 'Battle Tournament'
        };
        
        // Initialize leaderboards structure
        this.leaderboards = {
            fullRun: [],
            classicMode: [],
            individualLevels: {
                level1: [],
                level2: [],
                level3: [],
                level4: [],
                level5: [],
                level6: [],
                level7: [],
                level8: [],
                level9: [],
                level10: []
            },
            battleTournament: []
        };
        
        this.maxEntriesPerCategory = 10; // Top 10 for each category
        this.currentScoreEntry = null;
        this.scoreEntryCallback = null;
        
        // Load existing data
        this.loadLeaderboards();
        
        console.log('🏆 Leaderboard Manager initialized');
    }
    
    // Save leaderboards to localStorage
    saveLeaderboards() {
        try {
            const data = {
                version: '1.0',
                timestamp: Date.now(),
                leaderboards: this.leaderboards
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log('💾 Leaderboards saved to localStorage');
        } catch (error) {
            console.error('Failed to save leaderboards:', error);
        }
    }
    
    // Load leaderboards from localStorage
    loadLeaderboards() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.leaderboards) {
                    this.leaderboards = {
                        ...this.leaderboards,
                        ...parsed.leaderboards
                    };
                    console.log('📊 Leaderboards loaded from localStorage');
                }
            }
        } catch (error) {
            console.error('Failed to load leaderboards:', error);
            // Reset to default structure on error
            this.leaderboards = {
                fullRun: [],
                classicMode: [],
                individualLevels: {
                    level1: [],
                    level2: [],
                    level3: [],
                    level4: [],
                    level5: [],
                    level6: [],
                    level7: [],
                    level8: [],
                    level9: [],
                    level10: []
                },
                battleTournament: []
            };
        }
    }
    
    // Add a score to the appropriate leaderboard
    addScore(category, scoreData, callback = null) {
        const score = {
            id: Date.now() + Math.random(),
            initials: scoreData.initials || 'AAA',
            score: scoreData.score || 0,
            completionTime: scoreData.completionTime || 0,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString(),
            ...scoreData
        };
        
        // Validate score data
        if (!this.validateScoreData(category, score)) {
            console.error('Invalid score data for category:', category);
            return false;
        }
        
        // Add to appropriate leaderboard
        let targetBoard;
        if (category === 'individualLevel') {
            const levelKey = `level${scoreData.level}`;
            if (this.leaderboards.individualLevels[levelKey]) {
                targetBoard = this.leaderboards.individualLevels[levelKey];
            } else {
                console.error('Invalid level for individual leaderboard:', scoreData.level);
                return false;
            }
        } else if (this.leaderboards[category]) {
            targetBoard = this.leaderboards[category];
        } else {
            console.error('Invalid leaderboard category:', category);
            return false;
        }
        
        // Add score and sort
        targetBoard.push(score);
        this.sortLeaderboard(targetBoard, category);
        
        // Keep only top entries
        if (targetBoard.length > this.maxEntriesPerCategory) {
            targetBoard.splice(this.maxEntriesPerCategory);
        }
        
        // Save to localStorage
        this.saveLeaderboards();
        
        // Check if this is a new high score
        const isNewRecord = targetBoard.indexOf(score) === 0;
        
        console.log(`🏆 Score added to ${category}:`, score);
        
        if (callback) {
            callback(isNewRecord, targetBoard.indexOf(score) + 1);
        }
        
        return true;
    }
    
    // Sort leaderboard based on category type
    sortLeaderboard(board, category) {
        if (category === 'classicMode') {
            // Classic mode: higher score is better
            board.sort((a, b) => b.score - a.score);
        } else if (category === 'battleTournament') {
            // Battle tournament: higher score is better, then by completion time
            board.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.completionTime - b.completionTime;
            });
        } else {
            // Full run and individual levels: higher score is better, then by completion time
            board.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                
                // For pacman mode, higher completion time is better (more time remaining)
                if (a.gameMode === 'pacman' || b.gameMode === 'pacman') {
                    return b.completionTime - a.completionTime;
                }
                
                // For normal mode, lower completion time is better (faster completion)
                return a.completionTime - b.completionTime;
            });
        }
    }
    
    // Validate score data for a category
    validateScoreData(category, score) {
        if (!score.initials || score.initials.length !== 3) {
            return false;
        }
        
        if (typeof score.score !== 'number' || score.score < 0) {
            return false;
        }
        
        if (typeof score.completionTime !== 'number' || score.completionTime < 0) {
            return false;
        }
        
        // Category-specific validation
        if (category === 'individualLevel') {
            // Normal mode: levels 1-6, Pacman mode: levels 1-10
            const maxLevel = score.gameMode === 'pacman' ? 10 : 6;
            if (!score.level || score.level < 1 || score.level > maxLevel) {
                return false;
            }
        }
        
        return true;
    }
    
    // Get top scores for a category
    getTopScores(category, level = null, limit = 10) {
        if (category === 'individualLevel' && level) {
            const levelKey = `level${level}`;
            return this.leaderboards.individualLevels[levelKey]?.slice(0, limit) || [];
        } else if (this.leaderboards[category]) {
            return this.leaderboards[category].slice(0, limit);
        }
        return [];
    }
    
    // Check if a score qualifies for the leaderboard
    qualifiesForLeaderboard(category, score, level = null, completionTime = null, gameMode = null) {
        const topScores = this.getTopScores(category, level, this.maxEntriesPerCategory);
        
        if (topScores.length < this.maxEntriesPerCategory) {
            return true; // Board not full
        }
        
        const lowestScore = topScores[topScores.length - 1];
        
        // Compare based on category type
        if (category === 'classicMode') {
            return score > lowestScore.score;
        } else {
            // For other categories, higher score wins, then by time comparison
            if (score > lowestScore.score) {
                return true;
            }
            
            if (score === lowestScore.score && completionTime !== null) {
                // For pacman mode, higher completion time is better (more time remaining)
                if (gameMode === 'pacman') {
                    return completionTime > lowestScore.completionTime;
                }
                // For normal mode, lower completion time is better (faster completion)
                return completionTime < lowestScore.completionTime;
            }
            
            return false;
        }
    }
    
    // Get player's best score for a category
    getPlayerBestScore(category, initials, level = null) {
        const scores = this.getTopScores(category, level, this.maxEntriesPerCategory);
        const playerScores = scores.filter(s => s.initials === initials);
        return playerScores.length > 0 ? playerScores[0] : null;
    }
    
    // Get leaderboard statistics
    getStatistics() {
        const stats = {
            totalScores: 0,
            categories: {},
            topPlayer: null,
            newestScore: null
        };
        
        // Count scores in each category
        stats.categories.fullRun = this.leaderboards.fullRun.length;
        stats.categories.classicMode = this.leaderboards.classicMode.length;
        stats.categories.battleTournament = this.leaderboards.battleTournament.length;
        
        // Count individual level scores
        stats.categories.individualLevels = 0;
        for (let i = 1; i <= 6; i++) {
            stats.categories.individualLevels += this.leaderboards.individualLevels[`level${i}`].length;
        }
        
        stats.totalScores = stats.categories.fullRun + 
                           stats.categories.classicMode + 
                           stats.categories.battleTournament + 
                           stats.categories.individualLevels;
        
        // Find top player (most first place finishes)
        const playerStats = {};
        this.getAllScores().forEach(score => {
            if (!playerStats[score.initials]) {
                playerStats[score.initials] = { firstPlace: 0, totalScores: 0 };
            }
            playerStats[score.initials].totalScores++;
        });
        
        // Find most recent score
        const allScores = this.getAllScores();
        if (allScores.length > 0) {
            stats.newestScore = allScores.sort((a, b) => b.timestamp - a.timestamp)[0];
        }
        
        return stats;
    }
    
    // Get all scores across all categories
    getAllScores() {
        const allScores = [];
        
        // Add full run scores
        allScores.push(...this.leaderboards.fullRun);
        
        // Add classic mode scores
        allScores.push(...this.leaderboards.classicMode);
        
        // Add battle tournament scores
        allScores.push(...this.leaderboards.battleTournament);
        
        // Add individual level scores
        for (let i = 1; i <= 6; i++) {
            allScores.push(...this.leaderboards.individualLevels[`level${i}`]);
        }
        
        return allScores;
    }
    
    // Clear all leaderboards (for testing or reset)
    clearAllLeaderboards() {
        this.leaderboards = {
            fullRun: [],
            classicMode: [],
            individualLevels: {
                level1: [],
                level2: [],
                level3: [],
                level4: [],
                level5: [],
                level6: []
            },
            battleTournament: []
        };
        
        this.saveLeaderboards();
        console.log('🗑️ All leaderboards cleared');
    }
    
    // Format time for display
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Format score for display
    formatScore(score) {
        return score.toLocaleString();
    }
} 