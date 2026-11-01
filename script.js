
// ======================================
// FITTRACK - FITNESS & WELLNESS TRACKER
// ======================================

// FOOD CALORIE DATABASE
const foodCalories = {
    Banana: 105,
    Apple: 95,
    Rice: 200,
    Chapati: 120,
    Egg: 78,
    Milk: 150,
    Bread: 75,
    Dal: 180,
    Chicken: 165,
    Oats: 150
};

// EXERCISE CALORIE ESTIMATES PER MINUTE
// Illustrative estimates for a 70 kg adult
const exerciseRates = {
    Walking: 4,
    Running: 10,
    Cycling: 7,
    Gym: 5,
    Yoga: 3,
    Skipping: 10
};

const WATER_GOAL = 2000;

let currentDate = getToday();
let consumed = 0;
let burned = 0;
let water = 0;

let foods = [];
let exercises = [];
let dailyHistory = {};

let waterReminderInterval = null;
let chart = null;


// ======================================
// DATE FUNCTION
// ======================================

function getToday() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ======================================
// LOAD DATA
// ======================================

function loadDate(date) {
    currentDate = date;

    const allData = JSON.parse(
        localStorage.getItem("fittrackData") || "{}"
    );

    dailyHistory = allData;

    const dayData = allData[date] || {};

    // Correct invalid or negative saved values
    consumed = Math.max(0, Number(dayData.consumed) || 0);
    burned = Math.max(0, Number(dayData.burned) || 0);
    water = Math.max(0, Number(dayData.water) || 0);

    foods = Array.isArray(dayData.foods) ? dayData.foods : [];
    exercises = Array.isArray(dayData.exercises)
        ? dayData.exercises : [];

    // Remove invalid old records
    foods = foods.filter(item =>
        item &&
        Number(item.quantity) > 0 &&
        Number(item.calories) >= 0
    );

    exercises = exercises.filter(item =>
        item &&
        Number(item.duration) > 0 &&
        Number(item.calories) >= 0
    );

    consumed = foods.reduce(
        (total, item) => total + Number(item.calories), 0
    );

    burned = exercises.reduce(
        (total, item) => total + Number(item.calories), 0
    );

    if (allData.goals) {
        document.getElementById("calorieGoal").value =
            Math.max(0, Number(allData.goals.calorie) || 0) || "";

        document.getElementById("exerciseGoal").value =
            Math.max(0, Number(allData.goals.exercise) || 0) || "";
    }

    renderLists();
    updateDashboard();
    updateWater();
    updateStreak();
    updateGoalProgress();
    updateChart();

    saveData();
}


// ======================================
// SAVE DATA
// ======================================

function saveData() {
    // Keep all tracked values non-negative
    consumed = Math.max(0, consumed);
    burned = Math.max(0, burned);
    water = Math.max(0, water);

    const allData = JSON.parse(
        localStorage.getItem("fittrackData") || "{}"
    );

    allData[currentDate] = {
        consumed,
        burned,
        water,
        foods,
        exercises
    };

    allData.goals = {
        calorie: document.getElementById("calorieGoal").value,
        exercise: document.getElementById("exerciseGoal").value
    };

    localStorage.setItem(
        "fittrackData",
        JSON.stringify(allData)
    );

    dailyHistory = allData;
}


// ======================================
// DASHBOARD
// ======================================

function updateDashboard() {
    document.getElementById("consumedCalories").innerText =
        consumed + " kcal";

    document.getElementById("burnedCalories").innerText =
        burned + " kcal";

    // Net calories can legitimately be negative
    document.getElementById("netCalories").innerText =
        (consumed - burned) + " kcal";

    updateGoalProgress();
}


// ======================================
// DISPLAY FOOD AND EXERCISES
// ======================================

function renderLists() {
    const foodList = document.getElementById("foodList");
    const exerciseList = document.getElementById("exerciseList");

    foodList.innerHTML = "";
    exerciseList.innerHTML = "";

    foods.forEach((food, index) => {
        const li = document.createElement("li");

        li.textContent =
            `${food.name} × ${food.quantity} = ${food.calories} kcal`;

        const button = document.createElement("button");
        button.textContent = "Remove";
        button.className = "secondary";

        button.onclick = () => removeFood(index);

        li.appendChild(button);
        foodList.appendChild(li);
    });

    exercises.forEach((exercise, index) => {
        const li = document.createElement("li");

        li.textContent =
            `${exercise.name} - ${exercise.duration} min - ${exercise.calories} kcal estimated`;

        const button = document.createElement("button");
        button.textContent = "Remove";
        button.className = "secondary";

        button.onclick = () => removeExercise(index);

        li.appendChild(button);
        exerciseList.appendChild(li);
    });
}


// ======================================
// FOOD TRACKER
// ======================================

function addFood() {
    const name = document.getElementById("foodName").value;

    const quantity = Number(
        document.getElementById("foodQuantity").value
    );

    if (
        !name ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !foodCalories[name]
    ) {
        alert("Please select food and enter a positive quantity!");
        return;
    }

    const calories = foodCalories[name] * quantity;

    foods.push({
        name,
        quantity,
        calories
    });

    consumed += calories;

    renderLists();
    updateDashboard();
    saveData();

    document.getElementById("foodName").value = "";
    document.getElementById("foodQuantity").value = 1;
}


// REMOVE FOOD

function removeFood(index) {
    if (!foods[index]) return;

    foods.splice(index, 1);

    consumed = foods.reduce(
        (total, item) => total + Number(item.calories), 0
    );

    renderLists();
    updateDashboard();
    saveData();
}


// ======================================
// EXERCISE TRACKER
// ======================================

function addExercise() {
    const name = document.getElementById("exerciseName").value;

    const duration = Number(
        document.getElementById("exerciseDuration").value
    );

    if (
        !name ||
        !Number.isFinite(duration) ||
        duration <= 0 ||
        !exerciseRates[name]
    ) {
        alert("Please select an exercise and enter positive minutes!");
        return;
    }

    const calories = Math.round(
        exerciseRates[name] * duration
    );

    exercises.push({
        name,
        duration,
        calories
    });

    burned += calories;

    renderLists();
    updateDashboard();
    updateStreak();
    updateChart();
    saveData();

    document.getElementById("exerciseName").value = "";
    document.getElementById("exerciseDuration").value = "";
}


// REMOVE EXERCISE

function removeExercise(index) {
    if (!exercises[index]) return;

    exercises.splice(index, 1);

    burned = exercises.reduce(
        (total, item) => total + Number(item.calories), 0
    );

    renderLists();
    updateDashboard();
    updateStreak();
    updateChart();
    saveData();
}


// ======================================
// DAILY FITNESS GOALS
// ======================================

function saveGoals() {
    const calorieGoal = Number(
        document.getElementById("calorieGoal").value
    );

    const exerciseGoal = Number(
        document.getElementById("exerciseGoal").value
    );

    if (
        !Number.isFinite(calorieGoal) ||
        !Number.isFinite(exerciseGoal) ||
        calorieGoal <= 0 ||
        exerciseGoal <= 0
    ) {
        alert("Please enter positive values for both goals!");
        return;
    }

    saveData();
    updateGoalProgress();

    alert("Your fitness goals have been saved!");
}


function updateGoalProgress() {
    const calorieGoal = Number(
        document.getElementById("calorieGoal").value
    );

    const exerciseGoal = Number(
        document.getElementById("exerciseGoal").value
    );

    const exerciseMinutes = exercises.reduce(
        (total, item) => total + Number(item.duration), 0
    );

    let message = "Set your goals to track progress.";

    if (calorieGoal > 0 && exerciseGoal > 0) {
        message =
            `Food: ${consumed} / ${calorieGoal} kcal | ` +
            `Exercise: ${exerciseMinutes} / ${exerciseGoal} minutes`;
    }

    document.getElementById("goalProgress").innerText = message;
}


// ======================================
// WATER TRACKER
// ======================================

function updateWater() {
    water = Math.max(0, Number(water) || 0);

    document.getElementById("waterProgress").innerText =
        `${water} / ${WATER_GOAL} ml`;

    document.getElementById("waterBar").value =
        Math.min(water, WATER_GOAL);

    document.getElementById("waterMessage").innerText =
        water >= WATER_GOAL
            ? "You reached your example daily water goal!"
            : "Keep hydrated throughout the day!";
}


function addWater() {
    water += 250;

    updateWater();
    saveData();
}


function resetWater() {
    if (!confirm("Reset today's water intake?")) return;

    water = 0;

    updateWater();
    saveData();
}


// ======================================
// WATER REMINDERS
// ======================================

async function enableWaterReminder() {
    if (!("Notification" in window)) {
        alert("Your browser does not support notifications.");
        return;
    }

    if (!window.isSecureContext) {
        alert("Open your website using localhost or HTTPS.");
        return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        alert("Please allow notifications in your browser.");
        return;
    }

    disableWaterReminder();

    new Notification("FitTrack 💧", {
        body: "Time to drink some water!"
    });

    waterReminderInterval = setInterval(() => {
        new Notification("FitTrack 💧", {
            body: "Take a water break and stay hydrated!"
        });
    }, 60 * 60 * 1000);

    document.getElementById("reminderStatus").innerText =
        "Hourly reminder enabled while the website is open.";
}


function disableWaterReminder() {
    if (waterReminderInterval) {
        clearInterval(waterReminderInterval);
        waterReminderInterval = null;
    }

    document.getElementById("reminderStatus").innerText =
        "Water reminder is off.";
}


// ======================================
// WORKOUT STREAK
// ======================================

function updateStreak() {
    const allData = JSON.parse(
        localStorage.getItem("fittrackData") || "{}"
    );

    let count = 0;
    let date = new Date();

    while (true) {
        const key = getDateString(date);
        const day = allData[key];

        if (!day || !day.exercises || day.exercises.length === 0) {
            break;
        }

        count++;

        date.setDate(date.getDate() - 1);
    }

    document.getElementById("streakCount").innerText =
        count + (count === 1 ? " Day" : " Days");
}


// ======================================
// WEEKLY FITNESS REPORT
// ======================================

function updateChart() {
    const canvas = document.getElementById("weeklyChart");

    if (!canvas || typeof Chart === "undefined") return;

    const labels = [];
    const consumedData = [];
    const burnedData = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate + "T12:00:00");

        date.setDate(date.getDate() - i);

        const key = getDateString(date);
        const day = dailyHistory[key] || {};

        labels.push(
            date.toLocaleDateString("en-IN", {
                weekday: "short"
            })
        );

        consumedData.push(Math.max(0, Number(day.consumed) || 0));
        burnedData.push(Math.max(0, Number(day.burned) || 0));
    }

    if (chart) chart.destroy();

    chart = new Chart(canvas, {
        type: "bar",

        data: {
            labels,

            datasets: [
                {
                    label: "Calories Consumed",
                    data: consumedData,
                    backgroundColor: "#38b878"
                },
                {
                    label: "Calories Burned",
                    data: burnedData,
                    backgroundColor: "#4299e1"
                }
            ]
        },

        options: {
            responsive: true,

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// ======================================
// DATE SELECTION
// ======================================

document.getElementById("trackingDate").value = currentDate;

document.getElementById("trackingDate").addEventListener(
    "change",
    function () {
        if (this.value) {
            loadDate(this.value);
        }
    }
);


// ======================================
// START APPLICATION
// ======================================

loadDate(currentDate);