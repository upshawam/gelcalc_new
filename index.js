// Constants
const NA_TABLE = 390; // mg sodium per gram table salt
const DEFAULT_FUELING = 1.0;   // g/kg/h (not used now)

// Selected gel type
let selectedGelType = 'precision';

// Gel recipes
const RECIPES = {
  precision: { name: "Precision Fuel PF30", carbsPerGel: 30, maltRatio: 2/3, frucRatio: 1/3 },
  maurten: { name: "Maurten GEL 100", carbsPerGel: 25, maltRatio: 5/9, frucRatio: 4/9 }, // glucose:fruc 1:0.8 = 5:4
  sis: { name: "SIS Beta Fuel", carbsPerGel: 40, maltRatio: 1/1.8, frucRatio: 0.8/1.8 }
};

// Volume factors (ml per gram dissolved)
const VOL_PER_G_CARBS = 0.62;
const VOL_PER_G_SALT  = 0.35;
const VOL_PER_G_CITRIC= 0.8;

// Dilution + sodium targets
const ML_PER_G_CARBS = 100 / 65; // 65 g carbs per 100 ml
const NA_PER_30G = 300;          // mg sodium per 30 g carbs

function calculate() {
  const numGels = parseFloat(document.getElementById('numGels').value || 0);
  const recipe = RECIPES[selectedGelType];

  if (!recipe) return;

  if (numGels <= 0) {
    document.getElementById('out').innerHTML = '<p style="color: #FFC107; text-align: center;">Please enter a number of gels greater than 0.</p>';
    return;
  }

  const totalCarbs = recipe.carbsPerGel * numGels;
  const malt = totalCarbs * recipe.maltRatio;
  const fruc = totalCarbs * recipe.frucRatio;
  const citric = totalCarbs * 0.004;

  // Sodium
  const naTargetTotal = (totalCarbs / 30) * NA_PER_30G;
  const tableG = naTargetTotal / NA_TABLE;

  // Water + volume
  const waterMl = Math.round(totalCarbs * ML_PER_G_CARBS);
  const totalVolumeMl = Math.round(
    waterMl +
    (totalCarbs * VOL_PER_G_CARBS) +
    (tableG * VOL_PER_G_SALT) +
    (citric * VOL_PER_G_CITRIC)
  );

  // Build recipe card with aligned cart column
  let ratioText = '';
  let deviation = '';
  const pfRatio = 2; // malt/fruc for Precision Fuel
  let currentRatio = recipe.maltRatio / recipe.frucRatio;
  if (selectedGelType === 'precision') {
    ratioText = '2:1 glucose:fructose';
    deviation = 'Baseline recipe';
  } else if (selectedGelType === 'maurten') {
    ratioText = '0.8:1 fructose:glucose';
    deviation = `${((currentRatio - pfRatio) / pfRatio * 100).toFixed(1)}% deviation from Precision Fuel`;
  } else if (selectedGelType === 'sis') {
    ratioText = '1:0.8 maltodextrin:fructose';
    deviation = `${((currentRatio - pfRatio) / pfRatio * 100).toFixed(1)}% deviation from Precision Fuel`;
  }

  let html = `
    <div class="recipe-section">
      <h3>${recipe.name} Recipe for ${numGels} gels (${totalCarbs}g total carbs)</h3>
      <p>Carb ratio: ${ratioText}</p>
      <p>${deviation}</p>
      <table class="recipe-table">
        <tr><th>Ingredient</th><th>Amount</th><th></th></tr>
        <tr>
          <td>Maltodextrin${selectedGelType === 'maurten' ? ' (Glucose)' : ''}</td>
          <td>${malt.toFixed(0)} g</td>
          <td><a href="https://www.amazon.com/NOW-Nutrition-Maltodextrin-Absorption-Production/dp/B0013OUNRM" target="_blank" rel="noopener noreferrer" class="shop-link">🛒</a></td>
        </tr>
        <tr>
          <td>Fructose</td>
          <td>${fruc.toFixed(0)} g</td>
          <td><a href="https://www.iherb.com/pr/now-foods-fructose-sweetener-3-lbs-1-361-g/7762" target="_blank" rel="noopener noreferrer" class="shop-link">🛒</a></td>
        </tr>
        <tr>
          <td>Citric Acid</td>
          <td>${citric.toFixed(2)} g</td>
          <td><a href="https://www.amazon.com/Yerbero-Food-Grade-Versatile-Anhydrous-Preservative/dp/B0CWCCC8D3" target="_blank" rel="noopener noreferrer" class="shop-link">🛒</a></td>
        </tr>
        <tr><td>Table Salt</td><td>${tableG.toFixed(2)} g</td><td></td></tr>
        <tr><td>Water</td><td>${waterMl} ml</td><td></td></tr>
      </table>

      <!-- Why these ingredients link -->
      <p class="small" style="margin-top:8px; text-align:center;">
        <a href="ingredients.html" target="_blank" rel="noopener noreferrer">
          Why these ingredients?
        </a>
      </p>
    </div>
    <div class="pills-container">
      <div class="pill">Total carbs: <strong>${Math.round(totalCarbs)}</strong> g</div>
      <div class="pill">Sodium total: <strong>${Math.round(naTargetTotal)}</strong> mg</div>
      <div class="pill">Final gel volume: <strong>${totalVolumeMl}</strong> ml</div>
    </div>
  `;

  document.getElementById('out').innerHTML = html;
}

function setupGelSelection() {
  const gelOptions = document.querySelectorAll('.gel-option');
  gelOptions.forEach(option => {
    option.addEventListener('click', () => {
      const gelType = option.dataset.gel;
      // Navigate to ingredients page with gel type
      window.location.href = `ingredients.html?gel=${gelType}`;
    });
  });
  // Set default selection
  document.querySelector('.gel-option[data-gel="precision"]').classList.add('selected');
}

window.onload = () => {
  setupGelSelection();
  document.getElementById('numGels').value = 10;
  calculate();
};
