// --- STATE MANAGEMENT ---
let BD_RECETAS = {};
let PLANES_SEMANALES = {};
let userPrices = {};
let customPlans = [];
let portionMultiplier = 1;
let customPlan = {}; 
let currencySymbol = '₡';
let shoppingListState = { recipeIds: [], includeOptionals: false };

// --- INITIALIZATION ---
async function initializeApp() {
    try {
        const [recipesRes, plansRes] = await Promise.all([
            fetch('./data/BD_RECETAS.json'),
            fetch('./data/PLANES_SEMANALES.json')
        ]);
        BD_RECETAS = await recipesRes.json();
        PLANES_SEMANALES = await plansRes.json();
        
        const mainContentArea = document.getElementById('viewPlansView');
        
        loadUserData();
        setupCurrencySelector();

        setupViewSwitcher();
        
        const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        const today = new Date().getDay();
        const currentDayIndex = (today === 0) ? 6 : today - 1; 
        const currentDayKey = daysOfWeek[currentDayIndex];
        
        // Setup for all views
        createPlanSelector(); // Must run after loadUserData
        createDaySelector(daysOfWeek, currentDayKey);
        displayDay(currentDayKey);
        populateRecipeLibrary();
        createPlannerCalendar(daysOfWeek);
        renderCustomPlan();
        populatePriceCatalog();
        populateFullRecipeLibrary();
        
        // General setup
        setupModalListeners();
        setupActionButtons();
        setupPortionSelector();

    } catch (error) {
        console.error("Error loading data:", error);
        const mainContentArea = document.getElementById('viewPlansView');
        if (mainContentArea) mainContentArea.innerHTML = `<p style="text-align:center; color: #c0392b;">Error al cargar los datos.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

function loadUserData() {
    userPrices = JSON.parse(localStorage.getItem('userPrices')) || {};
    customPlans = JSON.parse(localStorage.getItem('savedCustomPlans')) || [];
    currencySymbol = localStorage.getItem('currencySymbol') || '₡';
    const savedPlan = localStorage.getItem('customMealPlan');
    if (savedPlan) {
        customPlan = JSON.parse(savedPlan);
    } else {
        const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        daysOfWeek.forEach(day => customPlan[day] = { almuerzo: null, cena: null });
    }
}

function setupViewSwitcher() {
    const buttons = document.querySelectorAll('.view-switcher button');
    const views = document.querySelectorAll('.view');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const viewId = button.id.replace('Btn', 'View');
            views.forEach(view => {
                view.classList.remove('active');
                if(view.id === viewId) {
                    view.classList.add('active');
                }
            });
        });
    });
}

function createDaySelector(days, currentDayKey) {
    const daySelector = document.getElementById('daySelector');
    daySelector.innerHTML = ''; // Clear previous buttons
    days.forEach(day => {
        const dayBtn = document.createElement('button');
        dayBtn.textContent = day.charAt(0).toUpperCase() + day.slice(1);
        dayBtn.dataset.day = day;
        if (day === currentDayKey) {
            dayBtn.classList.add('active');
        }
        dayBtn.addEventListener('click', () => {
            document.querySelector('.day-selector button.active').classList.remove('active');
            dayBtn.classList.add('active');
            displayDay(day);
        });
        daySelector.appendChild(dayBtn);
    });
}

// --- Price Catalog (View 3) ---
function populatePriceCatalog() {
    const catalogList = document.getElementById('priceCatalogList');
    const uniqueIngredients = {};
    BD_RECETAS.recetas.forEach(recipe => {
        [...recipe.ingredientes, ...(recipe.ingredientesOpcionales || [])].forEach(ing => {
            if (!uniqueIngredients[ing.nombre]) {
                uniqueIngredients[ing.nombre] = ing;
            }
        });
    });
    
    catalogList.innerHTML = Object.values(uniqueIngredients).sort((a,b) => a.nombre.localeCompare(b.nombre)).map(ing => {
        const savedPrice = userPrices[ing.nombre] || {};
        return `
            <div class="price-item">
                <label for="price-${ing.nombre.replace(/\s+/g, '')}">${ing.nombre}</label>
                <div class="price-inputs">
                    <input type="number" step="0.01" id="price-${ing.nombre.replace(/\s+/g, '')}" placeholder="Precio" data-name="${ing.nombre}" value="${savedPrice.precio || ''}">
                    <span>por</span>
                    <input type="number" step="0.01" id="qty-${ing.nombre.replace(/\s+/g, '')}" placeholder="Cant." data-name="${ing.nombre}" value="${savedPrice.cantidadBase || ''}">
                    <select id="unit-${ing.nombre.replace(/\s+/g, '')}" data-name="${ing.nombre}">
                        <option value="g" ${savedPrice.unidadBase === 'g' ? 'selected' : ''}>g</option>
                        <option value="kg" ${savedPrice.unidadBase === 'kg' ? 'selected' : ''}>kg</option>
                        <option value="ml" ${savedPrice.unidadBase === 'ml' ? 'selected' : ''}>ml</option>
                        <option value="l" ${savedPrice.unidadBase === 'l' ? 'selected' : ''}>l</option>
                        <option value="unidades" ${savedPrice.unidadBase === 'unidades' ? 'selected' : ''}>unidades</option>
                    </select>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('savePricesBtn').addEventListener('click', () => {
        const inputs = catalogList.querySelectorAll('input, select');
        inputs.forEach(input => {
            const name = input.dataset.name;
            if(!userPrices[name]) userPrices[name] = {};
            if(input.id.startsWith('price-')) userPrices[name].precio = parseFloat(input.value) || 0;
            if(input.id.startsWith('qty-')) userPrices[name].cantidadBase = parseFloat(input.value) || 0;
            if(input.id.startsWith('unit-')) userPrices[name].unidadBase = input.value;
        });
        localStorage.setItem('userPrices', JSON.stringify(userPrices));
        alert('¡Precios guardados!');
    });
}

function setupCurrencySelector() {
    const selectors = document.querySelectorAll('.currency-select');
    selectors.forEach(selector => {
        selector.value = currencySymbol; // Establecer el valor inicial
        selector.addEventListener('change', (e) => {
            currencySymbol = e.target.value;
            localStorage.setItem('currencySymbol', currencySymbol);
            // Sincronizar todos los selectores
            selectors.forEach(s => s.value = currencySymbol);
            // Refrescar la lista de compras si está abierta
            if (document.getElementById('shoppingListModal').classList.contains('show')) {
                const { categorized, totalCost } = generateShoppingList(shoppingListState.recipeIds, shoppingListState.includeOptionals);
                displayShoppingList(categorized, totalCost);
            }
        });
    });
}

// --- Full Recipe Library (View 4) ---
function populateFullRecipeLibrary() {
    const libraryContainer = document.getElementById('fullLibraryContent');
    libraryContainer.innerHTML = '';
    BD_RECETAS.recetas.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card-full';
        card.innerHTML = createFullRecipeCardHTML(recipe);
        libraryContainer.appendChild(card);
    });
    
    BD_RECETAS.recetas.forEach(recipe => {
        createMacroChart(`full-chart-${recipe.id}`, recipe.resumenNutricional, 1); // Multiplier is 1 for library view
    });

    document.getElementById('fullLibrarySearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        libraryContainer.querySelectorAll('.recipe-card-full').forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            card.style.display = name.includes(searchTerm) ? 'block' : 'none';
        });
    });
}

function createFullRecipeCardHTML(recipe) {
    const optionalIngredientsHTML = recipe.ingredientesOpcionales && recipe.ingredientesOpcionales.length > 0
        ? `<h6>Ingredientes Opcionales</h6><ul>${recipe.ingredientesOpcionales.map(ing => `<li><strong>${ing.nombre}:</strong> ${ing.cantidad}</li>`).join('')}</ul>`
        : '';

    return `
        <div class="recipe-card-full-header"><h3>${recipe.nombre}</h3></div>
        <div class="recipe-card-full-content">
            <div class="recipe-content">
                <div class="info-card"><h4>Información General</h4><p><strong>Tiempo:</strong> ${recipe.tiempoPreparacionAproximado}</p><p><strong>Dificultad:</strong> ${recipe.dificultad}</p><p><strong>Calorías:</strong> ${recipe.resumenNutricional.caloriasTotales.toFixed(0)} kcal</p></div>
                <div class="chart-card"><h4>Macros (P/G/C)</h4><div class="chart-container"><canvas id="full-chart-${recipe.id}"></canvas></div></div>
                <div class="details-section"><h4>Ingredientes</h4><ul>${recipe.ingredientes.map(ing => `<li><strong>${ing.nombre}:</strong> ${ing.cantidad}</li>`).join('')}</ul>${optionalIngredientsHTML}</div>
                <div class="details-section"><h4>Instrucciones</h4><ol>${recipe.instrucciones.map(step => `<li>${step}</li>`).join('')}</ol></div>
                <div class="details-section"><h4>Consejos del Chef ✨</h4><ul>${recipe.consejosDelChef.map(tip => `<li>${tip}</li>`).join('')}</ul></div>
            </div>
        </div>
    `;
}

// --- Planner (View 2) ---
function populateRecipeLibrary() {
    const libraryContent = document.getElementById('recipeLibraryContent');
    libraryContent.innerHTML = '';
    BD_RECETAS.recetas.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card-lib';
        card.draggable = true;
        card.dataset.recipeId = recipe.id;
        card.innerHTML = `<h4>${recipe.nombre}</h4><p>${recipe.tipoDeComida} - ${recipe.dificultad}</p>`;
        libraryContent.appendChild(card);
        card.addEventListener('dragstart', handleDragStart);
    });

    document.getElementById('recipeSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        libraryContent.querySelectorAll('.recipe-card-lib').forEach(card => {
            const name = card.querySelector('h4').textContent.toLowerCase();
            card.style.display = name.includes(searchTerm) ? 'block' : 'none';
        });
    });
}

function createPlannerCalendar(days) {
    const calendar = document.getElementById('plannerCalendar');
    calendar.innerHTML = '';
    days.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.innerHTML = `<div class="calendar-day-header">${day.charAt(0).toUpperCase() + day.slice(1)}</div>`;
        ['almuerzo', 'cena'].forEach(meal => {
            const slot = document.createElement('div');
            slot.className = 'meal-slot';
            slot.dataset.day = day;
            slot.dataset.meal = meal;
            slot.innerHTML = `<h5>${meal.charAt(0).toUpperCase() + meal.slice(1)}</h5>`;
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', handleDrop);
            dayEl.appendChild(slot);
        });
        calendar.appendChild(dayEl);
    });
}

function renderCustomPlan() {
    const slots = document.querySelectorAll('.meal-slot');
    slots.forEach(slot => {
        const oldCard = slot.querySelector('.recipe-card-lib');
        if(oldCard) oldCard.remove();
        
        const day = slot.dataset.day;
        const meal = slot.dataset.meal;
        if(customPlan[day] && customPlan[day][meal]) {
            const recipeId = customPlan[day][meal];
            const recipe = BD_RECETAS.recetas.find(r => r.id === recipeId);
            if(recipe) {
                const card = document.createElement('div');
                card.className = 'recipe-card-lib';
                card.innerHTML = `<h4>${recipe.nombre}</h4><p>${recipe.tipoDeComida} - ${recipe.dificultad}</p>`;
                slot.appendChild(card);
            }
        }
    });
}

function handleDragStart(e) { e.dataTransfer.setData('text/plain', e.target.dataset.recipeId); }
function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const recipeId = e.dataTransfer.getData('text/plain');
    const day = e.currentTarget.dataset.day;
    const meal = e.currentTarget.dataset.meal;

    if (!customPlan[day]) customPlan[day] = {};
    customPlan[day][meal] = recipeId;
    
    saveCustomPlan();
    renderCustomPlan();
}

function saveCustomPlan() {
    localStorage.setItem('customMealPlan', JSON.stringify(customPlan));
}

// --- View Plans (View 1) ---
function createPlanSelector() {
    const planSelector = document.getElementById('planSelector');
    planSelector.innerHTML = ''; // Clear options
    
    // Add predefined plans
    PLANES_SEMANALES.planesSemanales.forEach((plan, index) => {
        const option = document.createElement('option');
        option.value = `predefined-${index}`;
        option.textContent = plan.nombrePlan;
        planSelector.appendChild(option);
    });

    // Add custom plans
    customPlans.forEach((plan, index) => {
        const option = document.createElement('option');
        option.value = `custom-${index}`;
        option.textContent = plan.nombrePlan;
        planSelector.appendChild(option);
    });

    planSelector.addEventListener('change', () => {
        const activeDay = document.querySelector('.day-selector button.active').dataset.day;
        displayDay(activeDay);
    });
}

function displayDay(day) {
    const weekGrid = document.getElementById('weekGrid');
    weekGrid.innerHTML = '';
    
    const planSelector = document.getElementById('planSelector');
    if (!planSelector.value) return; // Exit if no plan is selected
    const [type, index] = planSelector.value.split('-');
    
    let plan;
    if (type === 'predefined') {
        plan = PLANES_SEMANALES.planesSemanales[index].planSemanal;
    } else {
        plan = customPlans[index].planSemanal;
    }

    const dayKey = day.charAt(0).toUpperCase() + day.slice(1);
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    dayCard.innerHTML = `<div class="day-header">${dayKey}</div>`;
    ['almuerzo', 'cena'].forEach(mealType => {
        const recipeId = plan[day]?.[mealType];
        const recipe = BD_RECETAS.recetas.find(r => r.id === recipeId);
        if (recipe) {
            dayCard.appendChild(createMealElement(recipe, mealType));
        } else {
             const emptyMeal = document.createElement('div');
             emptyMeal.className = 'meal';
             emptyMeal.innerHTML = `<div class="meal-header"><h3>${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h3><span>No hay receta seleccionada.</span></div>`;
             dayCard.appendChild(emptyMeal);
        }
    });
    const shoppingListBtn = document.createElement('button');
    shoppingListBtn.className = 'shopping-list-btn';
    shoppingListBtn.textContent = '🛒 Generar Lista de Compras del Día';
    shoppingListBtn.onclick = () => showShoppingList({day: day});
    dayCard.appendChild(shoppingListBtn);
    weekGrid.appendChild(dayCard);
    addEventListeners();
}

// --- All other functions (shared logic, modals, etc.) ---
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function formatIngredientQuantity(ing, multiplier) {
    const quantityStr = ing.cantidad;
    const fractionMatch = quantityStr.match(/(\d+)\/(\d+)/);
    const numberMatch = quantityStr.match(/(\d*\.?\d+)/);
    if (fractionMatch) {
        let num = parseInt(fractionMatch[1], 10) * multiplier;
        let den = parseInt(fractionMatch[2], 10);
        if (num >= den) {
            const whole = Math.floor(num / den);
            num %= den;
            if (num === 0) return `${whole} ${quantityStr.split(' ').slice(1).join(' ')}`;
            const common_frac = gcd(num, den);
            return `${whole} ${num / common_frac}/${den / common_frac} ${quantityStr.split(' ').slice(1).join(' ')}`;
        }
        const common = gcd(num, den);
        if (den/common === 1) return `${num/common}  ${quantityStr.split(' ').slice(1).join(' ')}`;
        return `${num / common}/${den / common} ${quantityStr.split(' ').slice(1).join(' ')}`;
    } else if (numberMatch) {
        const newAmount = parseFloat(numberMatch[0]) * multiplier;
        return quantityStr.replace(numberMatch[0], newAmount % 1 === 0 ? newAmount : parseFloat(newAmount.toFixed(2)));
    }
    return quantityStr;
}

function createMealElement(recipe, mealType) {
    const mealElement = document.createElement('div');
    mealElement.className = 'meal';
    mealElement.dataset.recipeId = recipe.id;
    const optionalIngredientsHTML = recipe.ingredientesOpcionales && recipe.ingredientesOpcionales.length > 0
        ? `<h6>Ingredientes Opcionales</h6><ul>${recipe.ingredientesOpcionales.map(ing => `<li><strong>${ing.nombre}:</strong> ${formatIngredientQuantity(ing, portionMultiplier)}</li>`).join('')}</ul>`
        : '';
    mealElement.innerHTML = `
        <div class="meal-header">
            <div><h3>${mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h3><span>${recipe.nombre}</span></div>
            <span class="toggle-icon">▼</span>
        </div>
        <div class="recipe-details">
            <div class="recipe-content">
                <div class="info-card"><h4>Información General</h4><p><strong>Tiempo:</strong> ${recipe.tiempoPreparacionAproximado}</p><p><strong>Dificultad:</strong> ${recipe.dificultad}</p><p><strong>Calorías:</strong> ${(recipe.resumenNutricional.caloriasTotales * portionMultiplier).toFixed(0)} kcal</p></div>
                <div class="chart-card"><h4>Macros (P/G/C)</h4><div class="chart-container"><canvas id="chart-${recipe.id}-${mealType}"></canvas></div></div>
                <div class="details-section"><h4>Ingredientes</h4><ul>${recipe.ingredientes.map(ing => `<li><strong>${ing.nombre}:</strong> ${formatIngredientQuantity(ing, portionMultiplier)}</li>`).join('')}</ul>${optionalIngredientsHTML}</div>
                <div class="details-section"><h4>Instrucciones</h4><ol>${recipe.instrucciones.map(step => `<li>${step}</li>`).join('')}</ol></div>
                <div class="details-section"><h4>Consejos del Chef ✨</h4><ul>${recipe.consejosDelChef.map(tip => `<li>${tip}</li>`).join('')}</ul></div>
            </div>
        </div>`;
    return mealElement;
}

function createMacroChart(canvasId, macros, multiplier = portionMultiplier) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (window.chartInstances && window.chartInstances[canvasId]) {
        window.chartInstances[canvasId].destroy();
    }
    if(!window.chartInstances) window.chartInstances = {};
    window.chartInstances[canvasId] = new Chart(ctx.getContext('2d'), { type: 'doughnut', data: { labels: ['Proteínas (g)', 'Grasas (g)', 'Carbohidratos (g)'], datasets: [{ label: 'Macronutrientes', data: [ (macros.proteinasTotales * multiplier), (macros.grasasTotales * multiplier), (macros.carbohidratosTotales * multiplier) ], backgroundColor: ['rgba(46, 204, 113, 0.8)','rgba(241, 196, 15, 0.8)','rgba(52, 152, 219, 0.8)'], borderColor: ['rgba(46, 204, 113, 1)','rgba(241, 196, 15, 1)','rgba(52, 152, 219, 1)'], borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } } } });
}

function addEventListeners() {
    document.querySelectorAll('.meal').forEach(mealEl => {
        mealEl.addEventListener('click', (e) => {
            mealEl.classList.toggle('active');
            const details = mealEl.querySelector('.recipe-details');
            details.classList.toggle('show');
            const recipeId = mealEl.dataset.recipeId;
            const mealType = mealEl.querySelector('h3').textContent.toLowerCase();
            const canvasId = `chart-${recipeId}-${mealType}`;
            if (details.classList.contains('show')) {
                const recipe = BD_RECETAS.recetas.find(r => r.id === recipeId);
                setTimeout(() => createMacroChart(canvasId, recipe.resumenNutricional), 50);
            } else {
                if (window.chartInstances && window.chartInstances[canvasId]) {
                    window.chartInstances[canvasId].destroy();
                    delete window.chartInstances[canvasId];
                }
            }
        });
    });
}

function setupActionButtons() {
    document.getElementById('weeklyShopBtn').addEventListener('click', () => {
        const [type, index] = document.getElementById('planSelector').value.split('-');
        const planSource = type === 'predefined'
            ? PLANES_SEMANALES.planesSemanales[index].planSemanal
            : customPlans[index].planSemanal;
        showShoppingList({ isWeekly: true, planSource: planSource });
    });
    
    document.getElementById('plannerWeeklyShopBtn').addEventListener('click', () => {
        showShoppingList({ isWeekly: true, planSource: customPlan });
    });
    
    document.getElementById('mealPrepBtn').addEventListener('click', showMealPrepPlan);

    document.getElementById('savePlanBtn').addEventListener('click', () => {
        const planName = prompt("Dale un nombre a tu plan:", "Mi Plan Personalizado");
        if (planName) {
            const newPlan = {
                idPlan: `custom-${Date.now()}`,
                nombrePlan: planName,
                descripcion: "Un plan personalizado creado por mí.",
                planSemanal: JSON.parse(JSON.stringify(customPlan)) // Deep copy
            };
            customPlans.push(newPlan);
            localStorage.setItem('savedCustomPlans', JSON.stringify(customPlans));
            alert(`¡Plan "${planName}" guardado!`);
            createPlanSelector(); // Refresh the selector
        }
    });

    document.getElementById('clearPlanBtn').addEventListener('click', () => {
        if (confirm("¿Estás seguro de que quieres limpiar el planificador?")) {
            const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            daysOfWeek.forEach(day => customPlan[day] = { almuerzo: null, cena: null });
            saveCustomPlan();
            renderCustomPlan();
        }
    });
}

function setupPortionSelector() {
    const portionInput = document.getElementById('portionSelectorInput');
    portionInput.addEventListener('change', () => {
        const value = parseInt(portionInput.value, 10);
        if (value >= 1) {
            portionMultiplier = value;
            const activeDay = document.querySelector('.day-selector button.active').dataset.day;
            displayDay(activeDay);
        } else {
            portionInput.value = 1;
        }
    });
}

function generateShoppingList(recipeIds, includeOptionals) {
    const ingredientsToProcess = [];
    recipeIds.forEach(id => {
        if (!id) return;
        const recipe = BD_RECETAS.recetas.find(r => r.id === id);
        if (recipe) {
            ingredientsToProcess.push(...recipe.ingredientes);
            if (includeOptionals && recipe.ingredientesOpcionales) {
                ingredientsToProcess.push(...recipe.ingredientesOpcionales);
            }
        }
    });
    const consolidated = {};
    ingredientsToProcess.forEach(ing => {
        const key = `${ing.nombre}_${ing.unidadMetrica}`;
        if (!consolidated[key]) {
            consolidated[key] = { nombre: ing.nombre, cantidad: 0, unidad: ing.unidadMetrica, categoria: ing.categoria || 'Otros' };
        }
        consolidated[key].cantidad += (ing.cantidadMetrica * portionMultiplier);
    });

    const categorized = {};
    let totalCost = 0;
    for (const key in consolidated) {
        const item = consolidated[key];
        // Cost calculation
        const priceInfo = userPrices[item.nombre];
        if (priceInfo && priceInfo.precio > 0 && priceInfo.cantidadBase > 0) {
            let itemAmountInBaseUnit = item.cantidad;
            // Convert kg to g and l to ml for calculation
            if (item.unidad === 'kg') itemAmountInBaseUnit *= 1000;
            if (item.unidad === 'l') itemAmountInBaseUnit *= 1000;

            let priceAmountInBaseUnit = priceInfo.cantidadBase;
            if (priceInfo.unidadBase === 'kg') priceAmountInBaseUnit *= 1000;
            if (priceInfo.unidadBase === 'l') priceAmountInBaseUnit *= 1000;

            if ((priceInfo.unidadBase.startsWith('k') || priceInfo.unidadBase.startsWith('g')) && (item.unidad.startsWith('k') || item.unidad.startsWith('g')) ||
                (priceInfo.unidadBase.startsWith('m') || priceInfo.unidadBase.startsWith('l')) && (item.unidad.startsWith('m') || item.unidad.startsWith('l')) ||
                (priceInfo.unidadBase === 'unidades' && item.unidad === 'unidades')) {
                item.costo = (itemAmountInBaseUnit / priceAmountInBaseUnit) * priceInfo.precio;
                totalCost += item.costo;
            }
        }

        if (!categorized[item.categoria]) categorized[item.categoria] = [];
        categorized[item.categoria].push(item);
    }
    return { categorized, totalCost };
}

function displayShoppingList(categorizedList, totalCost) {
    const contentDiv = document.getElementById('shoppingListContent');
    contentDiv.innerHTML = '';
    const sortedCategories = Object.keys(categorizedList).sort();

    if (sortedCategories.length === 0) {
        contentDiv.innerHTML = '<p>No hay ingredientes para mostrar. Arrastra recetas a tu plan para empezar.</p>';
        return;
    }

    sortedCategories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'shopping-list-category';
        const title = document.createElement('h3');
        title.textContent = category;
        categoryDiv.appendChild(title);
        const ul = document.createElement('ul');
        categorizedList[category].forEach(item => {
            const li = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            const checkboxId = `item-${category}-${item.nombre.replace(/\s+/g, '-')}`;
            checkbox.id = checkboxId;
            const label = document.createElement('label');
            label.htmlFor = checkboxId;
            label.textContent = `${item.nombre} - ${item.cantidad % 1 === 0 ? item.cantidad : item.cantidad.toFixed(2)} ${item.unidad}`;
            const costSpan = document.createElement('span');
            costSpan.className = 'list-item-cost';
            costSpan.textContent = item.costo ? `${currencySymbol}${item.costo.toFixed(2)}` : '';

            checkbox.onchange = () => label.classList.toggle('checked', checkbox.checked);
            li.appendChild(checkbox);
            li.appendChild(label);
            li.appendChild(costSpan);
            ul.appendChild(li);
        });
        categoryDiv.appendChild(ul);
        contentDiv.appendChild(categoryDiv);
    });

    if (totalCost > 0) {
        const totalDiv = document.createElement('div');
        totalDiv.className = 'shopping-list-total';
        totalDiv.textContent = `Costo Estimado Total: ${currencySymbol}${totalCost.toFixed(2)}`;
        contentDiv.appendChild(totalDiv);
    }
}

function showShoppingList(options) {
    const { day, isWeekly = false } = options;
    const isPredefinedView = document.getElementById('viewPlansBtn').classList.contains('active');
    
    let planSource;
    if (isPredefinedView) {
        const planSelectorValue = document.getElementById('planSelector').value;
        if (!planSelectorValue) return; // Handle case where nothing is selected
        const [type, index] = planSelectorValue.split('-');
        planSource = type === 'predefined'
            ? PLANES_SEMANALES.planesSemanales[index].planSemanal
            : customPlans[index].planSemanal;
    } else {
        planSource = customPlan;
    }

    if (!planSource) return; // Exit if no valid plan source

    const recipeIds = isWeekly 
        ? Object.values(planSource).flatMap(d => Object.values(d))
        : [planSource[day]?.almuerzo, planSource[day]?.cena];
    
    const modal = document.getElementById('shoppingListModal');
    const includeOptionalsCheckbox = document.getElementById('includeOptionals');
    
    function updateList() {
        shoppingListState.recipeIds = recipeIds;
        shoppingListState.includeOptionals = includeOptionalsCheckbox.checked;
        const { categorized, totalCost } = generateShoppingList(recipeIds, includeOptionalsCheckbox.checked);
        displayShoppingList(categorized, totalCost);
    }

    updateList();
    includeOptionalsCheckbox.onchange = updateList;
    
    document.getElementById('modalTitle').textContent = isWeekly ? 'Lista de Compras Semanal' : `Lista de Compras - ${day.charAt(0).toUpperCase() + day.slice(1)}`;
    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function showMealPrepPlan() {
    const isPredefinedView = document.getElementById('viewPlansBtn').classList.contains('active');
    let planData;

    if (isPredefinedView) {
        const planSelectorValue = document.getElementById('planSelector').value;
        if (!planSelectorValue) return;
        const [type, index] = planSelectorValue.split('-');
        planData = type === 'predefined'
            ? PLANES_SEMANALES.planesSemanales[index]
            : null; // Custom plans don't have meal prep info
    } else {
        planData = null; // Custom plan view
    }
        
    const mealPrepPlan = planData?.planDePreparacionSemanal;
    const modal = document.getElementById('mealPrepModal');
    const contentDiv = document.getElementById('mealPrepContent');
    contentDiv.innerHTML = '';

    if (mealPrepPlan && mealPrepPlan.pasosDePrepa) {
        mealPrepPlan.pasosDePrepa.forEach(step => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'prep-step';
            const recipeNames = step.recetasRelacionadas[0] === 'todas'
                ? "Todas las recetas de la semana"
                : step.recetasRelacionadas.map(id => BD_RECETAS.recetas.find(r => r.id === id)?.nombre).filter(Boolean).join(', ');
            stepDiv.innerHTML = `<h3>${step.descripcion}</h3><p><strong>Componente:</strong> ${step.componente}</p><p><strong>Recetas:</strong> ${recipeNames || 'N/A'}</p><p><strong>Almacenamiento:</strong> ${step.instruccionesAlmacenamiento}</p>`;
            contentDiv.appendChild(stepDiv);
        });
    } else {
        contentDiv.innerHTML = '<p>La guía de preparación solo está disponible para planes predefinidos. Puedes verla en la pestaña "Ver Planes".</p>';
    }
    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function setupModalListeners() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        const closeModalBtn = modal.querySelector('.close-modal');
        const modalId = closeModalBtn.dataset.modalId;
        function closeModal() { document.getElementById(modalId).classList.remove('show'); document.body.classList.remove('modal-open'); }
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    });
    document.getElementById('printBtn').addEventListener('click', () => window.print());
    document.getElementById('copyBtn').addEventListener('click', copyShoppingListToClipboard);
}

function copyShoppingListToClipboard() {
    const contentDiv = document.getElementById('shoppingListContent');
    let textToCopy = `${document.getElementById('modalTitle').textContent}\n\n`;
    contentDiv.querySelectorAll('.shopping-list-category').forEach(category => {
        const title = category.querySelector('h3').textContent;
        textToCopy += `--- ${title.toUpperCase()} ---\n`;
        category.querySelectorAll('li label').forEach(label => { textToCopy += `- ${label.textContent}\n`; });
        textToCopy += '\n';
    });
    const totalCostEl = contentDiv.querySelector('.shopping-list-total');
    if (totalCostEl) {
        textToCopy += `${totalCostEl.textContent}\n`;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '¡Copiado!';
        setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
    }).catch(err => {
        console.error('Error al copiar la lista: ', err);
        alert('No se pudo copiar la lista.');
    });
}
