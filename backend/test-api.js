const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let authToken = '';

// Test authentication
async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@festival.com',
      password: 'admin123'
    });
    authToken = response.data.token;
    console.log('✅ Authentication successful');
    console.log('User:', response.data.user);
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

// Test festival creation
async function testFestivalCreation() {
  console.log('\n🎪 Testing Festival Creation...');
  try {
    const response = await axios.post(`${BASE_URL}/festivals`, {
      name: 'Test Festival 2024',
      year: 2024,
      start_date: '2024-06-01',
      end_date: '2024-06-03',
      location: 'Test Location',
      description: 'Test Description',
      budget_total: 10000
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Festival creation successful');
    console.log('Festival:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Festival creation failed:', error.response?.data || error.message);
    console.error('Full error:', error.message);
    return null;
  }
}

// Test festivals list
async function testFestivalsList() {
  console.log('\n📋 Testing Festivals List...');
  try {
    const response = await axios.get(`${BASE_URL}/festivals`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Festivals list successful');
    console.log('Festivals found:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('❌ Festivals list failed:', error.response?.data || error.message);
    return null;
  }
}

// Test artists endpoints
async function testArtists(festivalId) {
  console.log('\n🎤 Testing Artists Endpoints...');
  try {
    // Get artists
    const getResponse = await axios.get(`${BASE_URL}/artists`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get artists successful, found:', getResponse.data.length);

    // Create artist
    const createResponse = await axios.post(`${BASE_URL}/artists`, {
      festival_id: festivalId,
      name: 'Test Artist',
      genre: 'Folk',
      contact_email: 'test@artist.com',
      fee: 500,
      status: 'inquired'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Create artist successful');
    return createResponse.data;
  } catch (error) {
    console.error('❌ Artists test failed:', error.response?.data || error.message);
    return null;
  }
}

// Test venues endpoints
async function testVenues(festivalId) {
  console.log('\n🏟️ Testing Venues Endpoints...');
  try {
    // Get venues
    const getResponse = await axios.get(`${BASE_URL}/venues`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get venues successful, found:', getResponse.data.length);

    // Create venue
    const createResponse = await axios.post(`${BASE_URL}/venues`, {
      festival_id: festivalId,
      name: 'Test Stage ' + Date.now(), // Unique name to avoid conflicts
      type: 'stage',
      capacity: 500
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Create venue successful');
    return createResponse.data;
  } catch (error) {
    console.error('❌ Venues test failed:', error.response?.data || error.message);
    return null;
  }
}

// Test volunteers endpoints  
async function testVolunteers(festivalId) {
  console.log('\n👥 Testing Volunteers Endpoints...');
  try {
    // Get volunteers
    const getResponse = await axios.get(`${BASE_URL}/volunteers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get volunteers successful, found:', getResponse.data.length);

    // Create volunteer
    const createResponse = await axios.post(`${BASE_URL}/volunteers`, {
      festival_id: festivalId,
      first_name: 'Test',
      last_name: 'Volunteer',
      email: 'test@volunteer.com',
      skills: 'General helper',
      volunteer_status: 'applied'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Create volunteer successful');
    return createResponse.data;
  } catch (error) {
    console.error('❌ Volunteers test failed:', error.response?.data || error.message);
    return null;
  }
}

// Test vendors endpoints
async function testVendors(festivalId) {
  console.log('\n🏪 Testing Vendors Endpoints...');
  try {
    // Get vendors
    const getResponse = await axios.get(`${BASE_URL}/vendors`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get vendors successful, found:', getResponse.data.length);

    // Create vendor
    const createResponse = await axios.post(`${BASE_URL}/vendors`, {
      festival_id: festivalId,
      name: 'Test Vendor',
      type: 'Food',
      contact_name: 'Test Contact',
      contact_email: 'test@vendor.com',
      status: 'inquiry'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Create vendor successful');
    return createResponse.data;
  } catch (error) {
    console.error('❌ Vendors test failed:', error.response?.data || error.message);
    return null;
  }
}

// Test budget endpoints
async function testBudget(festivalId) {
  console.log('\n💰 Testing Budget Endpoints...');
  try {
    // Get budget items
    const getResponse = await axios.get(`${BASE_URL}/budget`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get budget items successful, found:', getResponse.data.length);

    // Create budget item
    const createResponse = await axios.post(`${BASE_URL}/budget`, {
      festival_id: festivalId,
      name: 'Test Income',
      category: 'Tickets',
      type: 'income',
      amount: 1000,
      payment_status: 'pending'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Create budget item successful');
    return createResponse.data;
  } catch (error) {
    console.error('❌ Budget test failed:', error.response?.data || error.message);
    return null;
  }
}

// Test users endpoints
async function testUsers() {
  console.log('\n👤 Testing Users Endpoints...');
  try {
    // Get users
    const getResponse = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get users successful, found:', getResponse.data.length);
    return getResponse.data;
  } catch (error) {
    console.error('❌ Users test failed:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Platform Tests...');
  
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('❌ Cannot continue without authentication');
    return;
  }

  const festivals = await testFestivalsList();
  let festival = null;
  
  if (festivals && festivals.length > 0) {
    festival = festivals[0];
    console.log('Using existing festival:', festival.name);
  } else {
    festival = await testFestivalCreation();
  }

  if (!festival) {
    console.log('❌ Cannot continue without a festival');
    return;
  }

  // Test all endpoints
  await testArtists(festival.id);
  await testVenues(festival.id);
  await testVolunteers(festival.id);
  await testVendors(festival.id);
  await testBudget(festival.id);
  await testUsers();

  console.log('\n✅ Platform testing completed!');
}

runTests().catch(console.error);