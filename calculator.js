// Constants
const NA_TABLE = 390; // mg sodium per gram table salt
const DEFAULT_FUELING = 1.0;   // g/kg/h (not used now)

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

function getGelTypeFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('gel') || 'precision';
}

function toggleInputMode() {
  const gelsInput = document.getElementById('gelsInput');
  const volumeInput = document.getElementById('volumeInput');
  const modeToggle = document.getElementById('modeToggle');
  
  if (gelsInput.style.display !== 'none') {
    // Switch to volume mode
    gelsInput.style.display = 'none';
    volumeInput.style.display = 'block';
    modeToggle.textContent = 'Switch to Gel Count';
    // Copy current gel count to volume estimate
    const numGels = parseFloat(document.getElementById('numGels').value) || 10;
    const gelType = getGelTypeFromURL();
    const recipe = RECIPES[gelType];
    const estimatedVolume = numGels * 100; // Rough estimate of 100ml per gel
    document.getElementById('totalVolume').value = estimatedVolume;
  } else {
    // Switch to gels mode
    volumeInput.style.display = 'none';
    gelsInput.style.display = 'block';
    modeToggle.textContent = 'Switch to Volume Input';
    // Copy current volume to gel estimate
    const totalVolume = parseFloat(document.getElementById('totalVolume').value) || 500;
    const estimatedGels = Math.round(totalVolume / 100); // Rough estimate
    document.getElementById('numGels').value = estimatedGels;
  }
  calculate();
}

function toggleRationale() {
  const rationale = document.getElementById('rationale');
  
  if (rationale.style.display === 'none') {
    // Show comprehensive rationale for all gels
    const contentDiv = rationale.querySelector('div');
    contentDiv.innerHTML = `
      <h4>DIY Fueling Calculator - Ingredient Rationale</h4>
      
      <h5>Precision Fuel PF30 (Baseline Recipe)</h5>
      <p><strong>Carbohydrates (2:1 glucose:fructose ratio - 30g carbs/gel)</strong></p>
      <p><strong>Maltodextrin (glucose source)</strong><br>
      Provides the glucose component of the 2:1 ratio, offering fast-absorbing, steady energy without being overly sweet.</p>
      <p><strong>Fructose</strong><br>
      Absorbed through a different pathway than glucose, allowing higher total carb intake without gut distress. The 2:1 ratio maximizes absorption efficiency.</p>
      
      <h5>Maurten GEL 100 (0.8:1 fructose:glucose ratio - 25g carbs/gel)</h5>
      <p><strong>Glucose Syrup</strong><br>
      Hydrolyzed starch providing glucose polymers. Maurten uses hydrogel technology to encapsulate carbohydrates for better stomach passage.</p>
      <p><strong>Fructose</strong><br>
      Higher proportion than glucose to optimize the dual-transport absorption pathway, allowing more carbs per hour.</p>
      
      <h5>SIS Beta Fuel (1:0.8 maltodextrin:fructose ratio - 40g carbs/gel)</h5>
      <p><strong>Maltodextrin</strong><br>
      Slightly higher proportion than fructose for sustained energy release during beta-oxidation focus.</p>
      <p><strong>Fructose</strong><br>
      Optimized ratio for the dual-fuel system, supporting higher carb intakes during intense efforts.</p>
      
      <h5>Common Ingredients</h5>
      <p><strong>Citric Acid</strong><br>
      Added in small amounts (0.4% of carbs) for tartness and palatability, helping balance the sweetness of carbohydrates.</p>
      <p><strong>Sodium (Table Salt)</strong><br>
      Critical for replacing sodium lost in sweat, maintaining fluid balance, and supporting muscle function. Targets ~300mg per 30g carbs.</p>
      
      <h5>Why These Ratios Matter</h5>
      <p>Different gel manufacturers use varying carbohydrate ratios to optimize absorption and performance for different types of efforts. The 2:1 glucose:fructose ratio (like Precision Fuel) is widely regarded as optimal for most endurance activities. Other ratios may be beneficial for specific scenarios or individual tolerances.</p>
    `;
    rationale.style.display = 'block';
  } else {
    rationale.style.display = 'none';
  }
}

function calculate() {
  const gelType = getGelTypeFromURL();
  const recipe = RECIPES[gelType];

  if (!recipe) {
    document.getElementById('out').innerHTML = '<p style="color: #FFC107; text-align: center;">Invalid gel type selected.</p>';
    return;
  }

  let numGels, totalCarbs, inputDescription;
  
  const gelsInput = document.getElementById('gelsInput');
  
  if (gelsInput.style.display !== 'none') {
    // Calculate from number of gels
    numGels = parseFloat(document.getElementById('numGels').value || 0);
    if (numGels <= 0) {
      document.getElementById('out').innerHTML = '<p style="color: #FFC107; text-align: center;">Please enter a number of gels greater than 0.</p>';
      return;
    }
    totalCarbs = recipe.carbsPerGel * numGels;
    inputDescription = `${numGels} gels`;
  } else {
    // Calculate from total volume
    const totalVolume = parseFloat(document.getElementById('totalVolume').value || 0);
    if (totalVolume <= 0) {
      document.getElementById('out').innerHTML = '<p style="color: #FFC107; text-align: center;">Please enter a volume greater than 0.</p>';
      return;
    }
    
    // Estimate volume per gel (rough calculation based on typical gel volumes)
    const volumePerGel = 100; // ml per gel estimate
    numGels = Math.ceil(totalVolume / volumePerGel);
    totalCarbs = recipe.carbsPerGel * numGels;
    inputDescription = `${totalVolume}ml volume (${numGels} gels)`;
  }
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
  if (gelType === 'precision') {
    ratioText = '2:1 glucose:fructose';
    deviation = 'Baseline recipe';
  } else if (gelType === 'maurten') {
    ratioText = '0.8:1 fructose:glucose';
    deviation = `${((currentRatio - pfRatio) / pfRatio * 100).toFixed(1)}% deviation from Precision Fuel`;
  } else if (gelType === 'sis') {
    ratioText = '1:0.8 maltodextrin:fructose';
    deviation = `${((currentRatio - pfRatio) / pfRatio * 100).toFixed(1)}% deviation from Precision Fuel`;
  }

  let html = `
    <div class="recipe-section">
      <h3>${recipe.name} Recipe for ${inputDescription} (${totalCarbs}g total carbs)</h3>
      <p>Carb ratio: ${ratioText}</p>
      <p>${deviation}</p>
      <table class="recipe-table">
        <tr><th>Ingredient</th><th>Amount</th><th></th></tr>
        <tr>
          <td>Maltodextrin${gelType === 'maurten' ? ' (Glucose)' : ''}</td>
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
        <button class="btn" style="background: #666 !important; font-size: 0.8rem !important; padding: 4px 8px !important;" onclick="toggleRationale()">Why these ingredients?</button>
        <div id="rationale" style="display: none; margin-top: 10px; text-align: left;">
          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; color: #f0f0f0;">
            <h4>Ingredient Rationale</h4>
            <p><strong>Carbohydrates (2:1 ratio)</strong></p>
            <p><strong>Maltodextrin (2 parts)</strong><br>
            Fast-absorbing glucose source that provides steady energy without being overly sweet. Forms the bulk of the fuel to keep the gel easy on the stomach.</p>
            
            <p><strong>Fructose (1 part)</strong><br>
            Absorbed through a different pathway than glucose, which allows your body to take in more total carbs per hour without gut distress. The 2:1 maltodextrin:fructose ratio is widely used in endurance fueling to maximize absorption.</p>
            
            <p><strong>Citric Acid</strong><br>
            Added in a very small amount for tartness and palatability. Helps balance acidity so the gel tastes better over long hours.</p>
            
            <p><strong>Sodium (Table Salt)</strong><br>
            Critical for replacing sodium lost in sweat, maintaining fluid balance, and supporting muscle function. The calculator targets ~300 mg sodium per 30 g carbs, a common endurance guideline.</p>
            
            <p><strong>Why this setup?</strong><br>
            Efficient absorption: 2:1 carb ratio lets you fuel at higher rates without GI issues. Balanced electrolytes: Sodium is tied to carb load, keeping hydration and fueling aligned. Palatable: Citric acid improves taste without overwhelming the stomach. Cost-effective: DIY gels deliver the same fueling principles as commercial products at a fraction of the price.</p>
          </div>
        </div>
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

window.onload = () => {
  const gelType = getGelTypeFromURL();
  const recipe = RECIPES[gelType];
  if (recipe) {
    document.getElementById('gelTitle').textContent = `${recipe.name} - Ingredients Calculator`;
  }
  document.getElementById('numGels').value = 10;
  calculate();
};