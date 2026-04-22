// =====================================================
// FitLife Pro - Complete JavaScript Application
// Mobile-First Progressive Web App
// =====================================================

(function() {
    'use strict';

    // =====================================================
    // Constants & Configuration
    // =====================================================
    const STORAGE_KEY = 'fitlife_health_records';
    const THEME_KEY = 'fitlife_theme';
    
    const WORKOUT_ICONS = {
        running: '🏃',
        cycling: '🚴',
        swimming: '🏊',
        weightlifting: '🏋️',
        yoga: '🧘',
        hiit: '⚡',
        walking: '🚶',
        other: '📋'
    };

    const BP_CATEGORIES = {
        normal: { label: 'Normal', class: 'normal', maxSys: 120, maxDia: 80 },
        elevated: { label: 'Elevated', class: 'elevated', maxSys: 129, maxDia: 80 },
        high1: { label: 'High Stage 1', class: 'warning', maxSys: 139, maxDia: 89 },
        high2: { label: 'High Stage 2', class: 'high', maxSys: 180, maxDia: 120 },
        crisis: { label: 'Crisis', class: 'high', maxSys: Infinity, maxDia: Infinity }
    };

    // =====================================================
    // State Management
    // =====================================================
    let healthRecords = [];
    let currentChart = null;
    let currentChartType = 'heartRate';

    // =====================================================
    // DOM Elements
    // =====================================================
    const elements = {
        // Screens
        screens: document.querySelectorAll('.screen'),
        dashboard: document.getElementById('dashboard'),
        addData: document.getElementById('addData'),
        history: document.getElementById('history'),
        
        // Navigation
        navItems: document.querySelectorAll('.nav-item'),
        
        // Header
        themeToggle: document.getElementById('themeToggle'),
        greeting: document.getElementById('greeting'),
        
        // Dashboard Stats
        currentBpm: document.getElementById('currentBpm'),
        bpmStatus: document.getElementById('bpmStatus'),
        currentBp: document.getElementById('currentBp'),
        bpStatus: document.getElementById('bpStatus'),
        currentStress: document.getElementById('currentStress'),
        stressStatus: document.getElementById('stressStatus'),
        currentCalories: document.getElementById('currentCalories'),
        todayWorkouts: document.getElementById('todayWorkouts'),
        todaySleep: document.getElementById('todaySleep'),
        todayActive: document.getElementById('todayActive'),
        insightsList: document.getElementById('insightsList'),
        
        // Charts
        chartTabs: document.querySelectorAll('.chart-tab'),
        mainChart: document.getElementById('mainChart'),
        
        // Form
        healthForm: document.getElementById('healthForm'),
        workoutType: document.getElementById('workoutType'),
        duration: document.getElementById('duration'),
        calories: document.getElementById('calories'),
        heartRate: document.getElementById('heartRate'),
        bpSystolic: document.getElementById('bpSystolic'),
        bpDiastolic: document.getElementById('bpDiastolic'),
        sleepHours: document.getElementById('sleepHours'),
        heartRateHint: document.getElementById('heartRateHint'),
        bpHint: document.getElementById('bpHint'),
        stressIndicator: document.getElementById('stressIndicator'),
        stressBadge: document.getElementById('stressBadge'),
        stressFill: document.getElementById('stressFill'),
        stressExplanation: document.getElementById('stressExplanation'),
        
        // History
        historyList: document.getElementById('historyList'),
        filterBtns: document.querySelectorAll('.filter-btn'),
        
        // Notifications
        toast: document.getElementById('toast'),
        alertOverlay: document.getElementById('alertOverlay'),
        alertIcon: document.getElementById('alertIcon'),
        alertTitle: document.getElementById('alertTitle'),
        alertMessage: document.getElementById('alertMessage'),
        alertBtn: document.getElementById('alertBtn')
    };

    // =====================================================
    // Initialization
    // =====================================================
    function init() {
        loadTheme();
        loadHealthRecords();
        updateGreeting();
        updateDashboard();
        renderChart();
        renderHistory();
        setupEventListeners();
        registerServiceWorker();
    }

    // =====================================================
    // Theme Management
    // =====================================================
    function loadTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        
        // Update chart colors
        if (currentChart) {
            updateChartTheme();
        }
    }

    function updateChartTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        
        if (currentChart) {
            currentChart.options.scales.x.ticks.color = textColor;
            currentChart.options.scales.y.ticks.color = textColor;
            currentChart.options.scales.x.grid.color = gridColor;
            currentChart.options.scales.y.grid.color = gridColor;
            currentChart.update();
        }
    }

    // =====================================================
    // Data Management
    // =====================================================
    function loadHealthRecords() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            healthRecords = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading health records:', e);
            healthRecords = [];
        }
    }

    function saveHealthRecords() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(healthRecords));
        } catch (e) {
            console.error('Error saving health records:', e);
            showToast('Failed to save data', 'error');
        }
    }

    function addHealthRecord(record) {
        record.id = Date.now();
        record.timestamp = new Date().toISOString();
        healthRecords.unshift(record);
        saveHealthRecords();
    }

    // =====================================================
    // Greeting & Time
    // =====================================================
    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting;
        
        if (hour < 12) {
            greeting = 'Good morning! ☀️';
        } else if (hour < 17) {
            greeting = 'Good afternoon! 🌤️';
        } else if (hour < 21) {
            greeting = 'Good evening! 🌅';
        } else {
            greeting = 'Good night! 🌙';
        }
        
        elements.greeting.textContent = greeting;
    }

    // =====================================================
    // Dashboard Updates
    // =====================================================
    function updateDashboard() {
        const today = new Date().toDateString();
        const todayRecords = healthRecords.filter(r => 
            new Date(r.timestamp).toDateString() === today
        );
        
        // Get latest record
        const latest = healthRecords[0];
        
        // Update Heart Rate
        if (latest?.heartRate) {
            elements.currentBpm.textContent = latest.heartRate;
            const hrStatus = getHeartRateStatus(latest.heartRate);
            elements.bpmStatus.textContent = hrStatus.label;
            elements.bpmStatus.className = `stat-status ${hrStatus.class}`;
        } else {
            elements.currentBpm.textContent = '--';
            elements.bpmStatus.textContent = 'No data';
            elements.bpmStatus.className = 'stat-status';
        }
        
        // Update Blood Pressure
        if (latest?.bpSystolic && latest?.bpDiastolic) {
            elements.currentBp.textContent = `${latest.bpSystolic}/${latest.bpDiastolic}`;
            const bpStatus = getBloodPressureCategory(latest.bpSystolic, latest.bpDiastolic);
            elements.bpStatus.textContent = bpStatus.label;
            elements.bpStatus.className = `stat-status ${bpStatus.class}`;
        } else {
            elements.currentBp.textContent = '--/--';
            elements.bpStatus.textContent = 'No data';
            elements.bpStatus.className = 'stat-status';
        }
        
        // Update Stress Level
        if (latest) {
            const stress = calculateStressLevel(latest);
            elements.currentStress.textContent = stress.label;
            elements.stressStatus.textContent = stress.description;
            elements.stressStatus.className = `stat-status ${stress.class}`;
        } else {
            elements.currentStress.textContent = '--';
            elements.stressStatus.textContent = 'No data';
            elements.stressStatus.className = 'stat-status';
        }
        
        // Update Calories (today's total)
        const todayCalories = todayRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
        elements.currentCalories.textContent = todayCalories || '--';
        
        // Update Today's Summary
        elements.todayWorkouts.textContent = todayRecords.filter(r => r.workoutType).length;
        
        const latestSleep = todayRecords.find(r => r.sleepHours);
        elements.todaySleep.textContent = latestSleep ? `${latestSleep.sleepHours} hrs` : '-- hrs';
        
        const totalActive = todayRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
        elements.todayActive.textContent = `${totalActive} min`;
        
        // Update Insights
        updateInsights(todayRecords, latest);
    }

    function getHeartRateStatus(bpm) {
        if (bpm < 60) {
            return { label: 'Low', class: 'low' };
        } else if (bpm <= 100) {
            return { label: 'Normal', class: 'normal' };
        } else {
            return { label: 'High', class: 'high' };
        }
    }

    function getBloodPressureCategory(systolic, diastolic) {
        if (systolic < 120 && diastolic < 80) {
            return BP_CATEGORIES.normal;
        } else if (systolic <= 129 && diastolic < 80) {
            return BP_CATEGORIES.elevated;
        } else if (systolic <= 139 || diastolic <= 89) {
            return BP_CATEGORIES.high1;
        } else if (systolic <= 180 || diastolic <= 120) {
            return BP_CATEGORIES.high2;
        } else {
            return BP_CATEGORIES.crisis;
        }
    }

    function calculateStressLevel(record) {
        let stressScore = 0;
        const factors = [];
        
        // Heart rate factor
        if (record.heartRate) {
            if (record.heartRate > 100) {
                stressScore += 2;
                factors.push('elevated heart rate');
            } else if (record.heartRate > 85) {
                stressScore += 1;
            }
        }
        
        // Sleep factor
        if (record.sleepHours !== undefined && record.sleepHours !== null) {
            if (record.sleepHours < 5) {
                stressScore += 2;
                factors.push('very low sleep');
            } else if (record.sleepHours < 6) {
                stressScore += 1;
                factors.push('low sleep');
            }
        }
        
        // Mood factor
        if (record.mood === 'stressed') {
            stressScore += 2;
            factors.push('reported stress');
        } else if (record.mood === 'relaxed') {
            stressScore -= 1;
        }
        
        // Blood pressure factor
        if (record.bpSystolic > 140 || record.bpDiastolic > 90) {
            stressScore += 1;
            factors.push('high blood pressure');
        }
        
        // Determine level
        if (stressScore <= 1) {
            return { 
                label: 'Low', 
                class: 'low', 
                score: stressScore,
                description: 'Relaxed',
                factors 
            };
        } else if (stressScore <= 3) {
            return { 
                label: 'Medium', 
                class: 'medium', 
                score: stressScore,
                description: 'Moderate',
                factors 
            };
        } else {
            return { 
                label: 'High', 
                class: 'high', 
                score: stressScore,
                description: 'Elevated',
                factors 
            };
        }
    }

    function updateInsights(todayRecords, latest) {
        const insights = [];
        
        if (!latest) {
            insights.push({
                icon: '💡',
                text: 'Add your first health record to get personalized insights!',
                type: 'info'
            });
        } else {
            // Check heart rate
            if (latest.heartRate > 100) {
                insights.push({
                    icon: '❤️',
                    text: 'Your heart rate is elevated. Consider some relaxation exercises.',
                    type: 'warning'
                });
            }
            
            // Check blood pressure
            if (latest.bpSystolic > 140 || latest.bpDiastolic > 90) {
                insights.push({
                    icon: '🩺',
                    text: 'Your blood pressure is high. Monitor it closely and consult a doctor if persistent.',
                    type: 'danger'
                });
            }
            
            // Check sleep
            if (latest.sleepHours && latest.sleepHours < 6) {
                insights.push({
                    icon: '😴',
                    text: 'You\'re not getting enough sleep. Aim for 7-9 hours for optimal health.',
                    type: 'warning'
                });
            } else if (latest.sleepHours >= 7) {
                insights.push({
                    icon: '✨',
                    text: 'Great job on getting enough sleep! Keep up the good habits.',
                    type: 'success'
                });
            }
            
            // Check workout
            const workoutCount = todayRecords.filter(r => r.workoutType).length;
            if (workoutCount > 0) {
                insights.push({
                    icon: '💪',
                    text: `You've completed ${workoutCount} workout${workoutCount > 1 ? 's' : ''} today. Keep moving!`,
                    type: 'success'
                });
            } else {
                insights.push({
                    icon: '🏃',
                    text: 'No workout logged today. Even a short walk can boost your mood!',
                    type: 'info'
                });
            }
            
            // Stress insight
            const stress = calculateStressLevel(latest);
            if (stress.class === 'high') {
                insights.push({
                    icon: '🧘',
                    text: 'Your stress level is high. Try deep breathing or meditation.',
                    type: 'warning'
                });
            }
        }
        
        // Render insights
        elements.insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <span class="insight-icon">${insight.icon}</span>
                <p>${insight.text}</p>
            </div>
        `).join('');
    }

    // =====================================================
    // Charts
    // =====================================================
    function renderChart() {
        const ctx = elements.mainChart.getContext('2d');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        
        // Get last 7 days of data
        const last7Days = getLast7DaysData();
        
        // Destroy existing chart
        if (currentChart) {
            currentChart.destroy();
        }
        
        let chartConfig;
        
        switch (currentChartType) {
            case 'heartRate':
                chartConfig = {
                    type: 'line',
                    data: {
                        labels: last7Days.labels,
                        datasets: [{
                            label: 'Heart Rate (BPM)',
                            data: last7Days.heartRate,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#ef4444',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4
                        }]
                    }
                };
                break;
                
            case 'bloodPressure':
                chartConfig = {
                    type: 'line',
                    data: {
                        labels: last7Days.labels,
                        datasets: [
                            {
                                label: 'Systolic',
                                data: last7Days.systolic,
                                borderColor: '#6366f1',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                tension: 0.4,
                                fill: false,
                                pointBackgroundColor: '#6366f1',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointRadius: 4
                            },
                            {
                                label: 'Diastolic',
                                data: last7Days.diastolic,
                                borderColor: '#8b5cf6',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                tension: 0.4,
                                fill: false,
                                pointBackgroundColor: '#8b5cf6',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2,
                                pointRadius: 4
                            }
                        ]
                    }
                };
                break;
                
            case 'stress':
                chartConfig = {
                    type: 'bar',
                    data: {
                        labels: last7Days.labels,
                        datasets: [{
                            label: 'Stress Level',
                            data: last7Days.stress,
                            backgroundColor: last7Days.stress.map(val => {
                                if (val <= 1) return '#22c55e';
                                if (val <= 3) return '#f59e0b';
                                return '#ef4444';
                            }),
                            borderRadius: 8,
                            borderSkipped: false
                        }]
                    }
                };
                break;
        }
        
        // Common options
        chartConfig.options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: currentChartType === 'bloodPressure',
                    position: 'top',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: isDark ? '#94a3b8' : '#64748b',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 11 }
                    }
                },
                y: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 11 }
                    },
                    beginAtZero: currentChartType === 'stress'
                }
            }
        };
        
        currentChart = new Chart(ctx, chartConfig);
    }

    function getLast7DaysData() {
        const labels = [];
        const heartRate = [];
        const systolic = [];
        const diastolic = [];
        const stress = [];
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = days[date.getDay()];
            labels.push(dayName);
            
            const dateStr = date.toDateString();
            const dayRecords = healthRecords.filter(r => 
                new Date(r.timestamp).toDateString() === dateStr
            );
            
            // Get average values for the day
            const hrValues = dayRecords.filter(r => r.heartRate).map(r => r.heartRate);
            const sysValues = dayRecords.filter(r => r.bpSystolic).map(r => r.bpSystolic);
            const diaValues = dayRecords.filter(r => r.bpDiastolic).map(r => r.bpDiastolic);
            
            heartRate.push(hrValues.length ? Math.round(average(hrValues)) : null);
            systolic.push(sysValues.length ? Math.round(average(sysValues)) : null);
            diastolic.push(diaValues.length ? Math.round(average(diaValues)) : null);
            
            // Calculate average stress
            if (dayRecords.length) {
                const stressScores = dayRecords.map(r => calculateStressLevel(r).score);
                stress.push(Math.round(average(stressScores)));
            } else {
                stress.push(null);
            }
        }
        
        return { labels, heartRate, systolic, diastolic, stress };
    }

    function average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    // =====================================================
    // Form Handling
    // =====================================================
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate
        const errors = validateForm();
        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }
        
        // Collect data
        const record = {
            workoutType: elements.workoutType.value || null,
            duration: elements.duration.value ? parseInt(elements.duration.value) : null,
            calories: elements.calories.value ? parseInt(elements.calories.value) : null,
            heartRate: elements.heartRate.value ? parseInt(elements.heartRate.value) : null,
            bpSystolic: elements.bpSystolic.value ? parseInt(elements.bpSystolic.value) : null,
            bpDiastolic: elements.bpDiastolic.value ? parseInt(elements.bpDiastolic.value) : null,
            sleepHours: elements.sleepHours.value ? parseFloat(elements.sleepHours.value) : null,
            mood: document.querySelector('input[name="mood"]:checked')?.value || 'normal'
        };
        
        // Check for health alerts
        const alerts = checkHealthAlerts(record);
        if (alerts.length > 0) {
            showHealthAlert(alerts[0]);
        }
        
        // Save record
        addHealthRecord(record);
        
        // Update UI
        updateDashboard();
        renderChart();
        renderHistory();
        
        // Reset form
        elements.healthForm.reset();
        updateStressIndicator();
        
        // Show success
        showToast('Health data saved successfully!', 'success');
        
        // Navigate to dashboard
        switchScreen('dashboard');
    }

    function validateForm() {
        const errors = [];
        
        // Check if at least one field is filled
        const hasData = elements.workoutType.value ||
                        elements.duration.value ||
                        elements.calories.value ||
                        elements.heartRate.value ||
                        elements.bpSystolic.value ||
                        elements.bpDiastolic.value ||
                        elements.sleepHours.value;
        
        if (!hasData) {
            errors.push('Please fill in at least one field');
        }
        
        // Validate heart rate range
        if (elements.heartRate.value) {
            const hr = parseInt(elements.heartRate.value);
            if (hr < 30 || hr > 220) {
                errors.push('Heart rate should be between 30-220 BPM');
            }
        }
        
        // Validate BP
        if (elements.bpSystolic.value || elements.bpDiastolic.value) {
            if (!elements.bpSystolic.value || !elements.bpDiastolic.value) {
                errors.push('Please enter both systolic and diastolic values');
            }
        }
        
        // Validate sleep
        if (elements.sleepHours.value) {
            const sleep = parseFloat(elements.sleepHours.value);
            if (sleep < 0 || sleep > 24) {
                errors.push('Sleep hours should be between 0-24');
            }
        }
        
        return errors;
    }

    function checkHealthAlerts(record) {
        const alerts = [];
        
        if (record.bpSystolic > 180 || record.bpDiastolic > 120) {
            alerts.push({
                icon: '🚨',
                title: 'Hypertensive Crisis',
                message: 'Your blood pressure reading indicates a hypertensive crisis. Please seek immediate medical attention or call emergency services.'
            });
        } else if (record.bpSystolic > 140 || record.bpDiastolic > 90) {
            alerts.push({
                icon: '⚠️',
                title: 'High Blood Pressure',
                message: 'Your blood pressure is elevated. Consider monitoring it more frequently and consult with your healthcare provider.'
            });
        }
        
        if (record.heartRate > 120) {
            alerts.push({
                icon: '❤️',
                title: 'Elevated Heart Rate',
                message: 'Your resting heart rate is unusually high. If you\'re not exercising, consider resting and monitoring it. Consult a doctor if it persists.'
            });
        }
        
        const stress = calculateStressLevel(record);
        if (stress.class === 'high' && stress.factors.length >= 2) {
            alerts.push({
                icon: '🧘',
                title: 'High Stress Detected',
                message: `Multiple stress indicators detected: ${stress.factors.join(', ')}. Consider taking a break, practicing relaxation techniques, or speaking with someone.`
            });
        }
        
        return alerts;
    }

    function updateStressIndicator() {
        const heartRate = parseInt(elements.heartRate.value) || null;
        const sleepHours = parseFloat(elements.sleepHours.value);
        const mood = document.querySelector('input[name="mood"]:checked')?.value || 'normal';
        const bpSystolic = parseInt(elements.bpSystolic.value) || null;
        const bpDiastolic = parseInt(elements.bpDiastolic.value) || null;
        
        const record = {
            heartRate,
            sleepHours: isNaN(sleepHours) ? null : sleepHours,
            mood,
            bpSystolic,
            bpDiastolic
        };
        
        const hasData = heartRate || !isNaN(sleepHours) || mood !== 'normal';
        
        if (!hasData) {
            elements.stressBadge.textContent = '--';
            elements.stressBadge.className = 'stress-badge';
            elements.stressFill.className = 'stress-fill';
            elements.stressExplanation.textContent = 'Fill in your vitals to calculate stress level';
            return;
        }
        
        const stress = calculateStressLevel(record);
        
        elements.stressBadge.textContent = stress.label;
        elements.stressBadge.className = `stress-badge ${stress.class}`;
        elements.stressFill.className = `stress-fill ${stress.class}`;
        
        if (stress.factors.length > 0) {
            elements.stressExplanation.textContent = `Contributing factors: ${stress.factors.join(', ')}`;
        } else {
            elements.stressExplanation.textContent = 'Your stress indicators look good!';
        }
    }

    function updateInputHints() {
        // Heart rate hint
        const hr = parseInt(elements.heartRate.value);
        if (hr) {
            const status = getHeartRateStatus(hr);
            elements.heartRateHint.textContent = `Status: ${status.label}`;
            elements.heartRateHint.className = `input-hint ${status.class === 'high' ? 'danger' : status.class === 'low' ? 'warning' : ''}`;
        } else {
            elements.heartRateHint.textContent = '';
        }
        
        // Blood pressure hint
        const sys = parseInt(elements.bpSystolic.value);
        const dia = parseInt(elements.bpDiastolic.value);
        if (sys && dia) {
            const status = getBloodPressureCategory(sys, dia);
            elements.bpHint.textContent = `Category: ${status.label}`;
            elements.bpHint.className = `input-hint ${status.class === 'high' || status.class === 'crisis' ? 'danger' : status.class === 'warning' || status.class === 'elevated' ? 'warning' : ''}`;
        } else {
            elements.bpHint.textContent = '';
        }
    }

    // =====================================================
    // History
    // =====================================================
    function renderHistory(filter = 'all') {
        const today = new Date();
        const todayStr = today.toDateString();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        let filtered = [...healthRecords];
        
        switch (filter) {
            case 'today':
                filtered = filtered.filter(r => 
                    new Date(r.timestamp).toDateString() === todayStr
                );
                break;
            case 'week':
                filtered = filtered.filter(r => 
                    new Date(r.timestamp) >= weekAgo
                );
                break;
        }
        
        if (filtered.length === 0) {
            elements.historyList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📋</span>
                    <h3>No Records ${filter !== 'all' ? 'for ' + filter : 'Yet'}</h3>
                    <p>Start tracking your health to see your history here</p>
                </div>
            `;
            return;
        }
        
        elements.historyList.innerHTML = filtered.map(record => {
            const date = new Date(record.timestamp);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            const formattedTime = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
            });
            
            const workoutIcon = record.workoutType ? WORKOUT_ICONS[record.workoutType] : '📊';
            const workoutName = record.workoutType ? 
                record.workoutType.charAt(0).toUpperCase() + record.workoutType.slice(1) : 
                'Health Check';
            
            return `
                <div class="history-card">
                    <div class="history-header">
                        <div>
                            <div class="history-date">${formattedDate}</div>
                            <div class="history-time">${formattedTime}</div>
                        </div>
                        <div class="history-workout">
                            <span class="history-workout-icon">${workoutIcon}</span>
                            <span class="history-workout-name">${workoutName}</span>
                        </div>
                    </div>
                    <div class="history-stats">
                        ${record.heartRate ? `
                            <div class="history-stat">
                                <span class="history-stat-icon">❤️</span>
                                <div class="history-stat-info">
                                    <span class="history-stat-label">Heart Rate</span>
                                    <span class="history-stat-value">${record.heartRate} BPM</span>
                                </div>
                            </div>
                        ` : ''}
                        ${record.bpSystolic && record.bpDiastolic ? `
                            <div class="history-stat">
                                <span class="history-stat-icon">🩺</span>
                                <div class="history-stat-info">
                                    <span class="history-stat-label">Blood Pressure</span>
                                    <span class="history-stat-value">${record.bpSystolic}/${record.bpDiastolic}</span>
                                </div>
                            </div>
                        ` : ''}
                        ${record.calories ? `
                            <div class="history-stat">
                                <span class="history-stat-icon">🔥</span>
                                <div class="history-stat-info">
                                    <span class="history-stat-label">Calories</span>
                                    <span class="history-stat-value">${record.calories} kcal</span>
                                </div>
                            </div>
                        ` : ''}
                        ${record.duration ? `
                            <div class="history-stat">
                                <span class="history-stat-icon">⏱️</span>
                                <div class="history-stat-info">
                                    <span class="history-stat-label">Duration</span>
                                    <span class="history-stat-value">${record.duration} min</span>
                                </div>
                            </div>
                        ` : ''}
                        ${record.sleepHours ? `
                            <div class="history-stat">
                                <span class="history-stat-icon">😴</span>
                                <div class="history-stat-info">
                                    <span class="history-stat-label">Sleep</span>
                                    <span class="history-stat-value">${record.sleepHours} hrs</span>
                                </div>
                            </div>
                        ` : ''}
                        ${record.mood ? `
                            <div class="history-stat">
                                <span class="history-stat-icon">${record.mood === 'relaxed' ? '😌' : record.mood === 'stressed' ? '😰' : '😊'}</span>
                                <div class="history-stat-info">
                                    <span class="history-stat-label">Mood</span>
                                    <span class="history-stat-value">${record.mood.charAt(0).toUpperCase() + record.mood.slice(1)}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // =====================================================
    // Navigation
    // =====================================================
    function switchScreen(screenId) {
        elements.screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        document.getElementById(screenId).classList.add('active');
        
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.screen === screenId);
        });
        
        // Scroll to top
        document.querySelector('.main-content').scrollTop = 0;
    }

    // =====================================================
    // Notifications
    // =====================================================
    function showToast(message, type = 'info') {
        const toast = elements.toast;
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.querySelector('.toast-icon').textContent = icons[type];
        toast.querySelector('.toast-message').textContent = message;
        toast.className = `toast ${type}`;
        
        // Show toast
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function showHealthAlert(alert) {
        elements.alertIcon.textContent = alert.icon;
        elements.alertTitle.textContent = alert.title;
        elements.alertMessage.textContent = alert.message;
        elements.alertOverlay.classList.add('show');
    }

    function hideHealthAlert() {
        elements.alertOverlay.classList.remove('show');
    }

    // =====================================================
    // Service Worker
    // =====================================================
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => {
                    console.log('Service Worker registered:', reg.scope);
                })
                .catch(err => {
                    console.log('Service Worker registration failed:', err);
                });
        }
    }

    // =====================================================
    // Event Listeners
    // =====================================================
    function setupEventListeners() {
        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);
        
        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                switchScreen(item.dataset.screen);
            });
        });
        
        // Chart tabs
        elements.chartTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.chartTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentChartType = tab.dataset.chart;
                renderChart();
            });
        });
        
        // Form submission
        elements.healthForm.addEventListener('submit', handleFormSubmit);
        
        // Form input changes for real-time feedback
        const formInputs = [
            elements.heartRate, 
            elements.bpSystolic, 
            elements.bpDiastolic, 
            elements.sleepHours
        ];
        
        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                updateStressIndicator();
                updateInputHints();
            });
        });
        
        // Mood selector
        document.querySelectorAll('input[name="mood"]').forEach(radio => {
            radio.addEventListener('change', updateStressIndicator);
        });
        
        // History filters
        elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderHistory(btn.dataset.filter);
            });
        });
        
        // Alert modal
        elements.alertBtn.addEventListener('click', hideHealthAlert);
        elements.alertOverlay.addEventListener('click', (e) => {
            if (e.target === elements.alertOverlay) {
                hideHealthAlert();
            }
        });
        
        // Handle visibility change (update greeting when app becomes visible)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                updateGreeting();
            }
        });
    }

    // =====================================================
    // Initialize App
    // =====================================================
    document.addEventListener('DOMContentLoaded', init);
})();
