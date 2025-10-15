// DNS lookup test for Supabase hostname
import { promises as dns } from 'dns';

export default async function handler(req, res) {
  try {
    const hostname = 'db.xwyzhntzjgtlqejhtoux.supabase.co';
    
    const response = {
      status: 'DNS Lookup Test',
      timestamp: new Date().toISOString(),
      hostname: hostname,
      tests: {}
    };

    // Test 1: Try to resolve the hostname
    try {
      const addresses = await dns.lookup(hostname);
      response.tests.dnsLookup = {
        status: 'SUCCESS',
        address: addresses.address,
        family: addresses.family
      };
    } catch (error) {
      response.tests.dnsLookup = {
        status: 'ERROR',
        error: error.message,
        code: error.code
      };
    }

    // Test 2: Try resolve with different options
    try {
      const addresses = await dns.resolve4(hostname);
      response.tests.resolve4 = {
        status: 'SUCCESS',
        addresses: addresses
      };
    } catch (error) {
      response.tests.resolve4 = {
        status: 'ERROR',
        error: error.message,
        code: error.code
      };
    }

    // Test 3: Try resolve all records
    try {
      const addresses = await dns.resolveAny(hostname);
      response.tests.resolveAny = {
        status: 'SUCCESS',
        records: addresses
      };
    } catch (error) {
      response.tests.resolveAny = {
        status: 'ERROR',
        error: error.message,
        code: error.code
      };
    }

    // Test 4: Try alternative Supabase hosts
    const testHosts = [
      'supabase.com',
      'app.supabase.com',
      `${hostname.split('.')[1]}.supabase.co`  // xwyzhntzjgtlqejhtoux.supabase.co
    ];

    for (const testHost of testHosts) {
      try {
        const addr = await dns.lookup(testHost);
        response.tests[`alternative_${testHost.replace(/\./g, '_')}`] = {
          status: 'SUCCESS',
          address: addr.address
        };
      } catch (error) {
        response.tests[`alternative_${testHost.replace(/\./g, '_')}`] = {
          status: 'ERROR',
          error: error.message
        };
      }
    }

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}