const { getLatestRates, convertCurrency } = require('./services/currencyService');

async function testCurrency() {
  console.log('Testing Currency Service...\n');

  // Wait for DB initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // Test 1: Get latest rates
    console.log('1. Fetching latest exchange rates...');
    const { rates, date, source } = await getLatestRates();
    console.log(`   ✓ Successfully fetched rates for ${date}`);
    console.log(`   ✓ Source: ${source}`);
    console.log(`   ✓ Number of currencies: ${Object.keys(rates).length}`);
    console.log(`   ✓ Sample rates:`);
    console.log(`     - 1 EUR = ${rates.EUR} RON`);
    console.log(`     - 1 USD = ${rates.USD} RON`);
    console.log(`     - 1 GBP = ${rates.GBP} RON`);

    // Test 2: Convert currency
    console.log('\n2. Testing currency conversion...');
    const amount = 100;
    const eurToRon = await convertCurrency(amount, 'EUR', 'RON', rates);
    const usdToEur = await convertCurrency(amount, 'USD', 'EUR', rates);
    const ronToUsd = await convertCurrency(amount, 'RON', 'USD', rates);
    
    console.log(`   ✓ ${amount} EUR = ${eurToRon} RON`);
    console.log(`   ✓ ${amount} USD = ${usdToEur} EUR`);
    console.log(`   ✓ ${amount} RON = ${ronToUsd} USD`);

    console.log('\n✓ All tests passed!\n');
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

// Initialize database first
require('./database/db');

testCurrency();
