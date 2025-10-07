import { describe, expect, it, beforeEach } from 'vitest';

describe('Industrial IoT Data Marketplace', () => {
  
  describe('Provider Registration', () => {
    it('should allow new provider registration', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Acme Industrial IoT"'],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should prevent duplicate provider registration', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Acme Industrial IoT"'],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );
      
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Acme Industrial IoT 2"'],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );
      expect(response.result).toBe('(err u202)');
    });

    it('should initialize provider with correct defaults', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Test Company"'],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      const providerData = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-provider',
        ["'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      const expected = '(some {company-name: u"Test Company", verified: false, total-datasets: u0, total-revenue: u0, reputation-score: u50, active: true})';
      expect(providerData.result).toContain('Test Company');
      expect(providerData.result).toContain('verified: false');
      expect(providerData.result).toContain('total-datasets: u0');
      expect(providerData.result).toContain('reputation-score: u50');
    });
  });

  describe('Data Listing', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );
    });

    it('should allow registered provider to list sensor data', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"CNC Machine"',
          'u"Temperature Sensor"',
          '"QmX7Y8Z9...hash"',
          'u"Temperature readings from CNC machine over 24h"',
          'u50000',
          '"JSON"',
          'u10',
          'u86400',
          'u144',
          'u95',
          'u"Manufacturing"'
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );
      expect(response.result).toBe('(ok u1)');
    });

    it('should reject listing from unregistered provider', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"CNC Machine"',
          'u"Temperature Sensor"',
          '"QmX7Y8Z9...hash"',
          'u"Test data"',
          'u50000',
          '"JSON"',
          'u10',
          'u86400',
          'u144',
          'u95',
          'u"Manufacturing"'
        ],
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
      );
      expect(response.result).toBe('(err u201)');
    });

    it('should reject listing with price below minimum', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"CNC Machine"',
          'u"Temperature Sensor"',
          '"QmX7Y8Z9...hash"',
          'u"Test data"',
          'u5000',
          '"JSON"',
          'u10',
          'u86400',
          'u144',
          'u95',
          'u"Manufacturing"'
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );
      expect(response.result).toBe('(err u206)');
    });

    it('should reject invalid quality score', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"CNC Machine"',
          'u"Temperature Sensor"',
          '"QmX7Y8Z9...hash"',
          'u"Test data"',
          'u50000',
          '"JSON"',
          'u10',
          'u86400',
          'u144',
          'u150',
          'u"Manufacturing"'
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );
      expect(response.result).toBe('(err u209)');
    });

    it('should increment data-id counter', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Machine A"',
          'u"Sensor A"',
          '"hash1"',
          'u"Data 1"',
          'u50000',
          '"JSON"',
          'u10',
          'u86400',
          'u144',
          'u90',
          'u"Category A"'
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Machine B"',
          'u"Sensor B"',
          '"hash2"',
          'u"Data 2"',
          'u60000',
          '"CSV"',
          'u5',
          'u43200',
          'u100',
          'u85',
          'u"Category B"'
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      expect(response.result).toBe('(ok u2)');
    });

    it('should update provider total-datasets count', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Machine A"',
          'u"Sensor A"',
          '"hash1"',
          'u"Data 1"',
          'u50000',
          '"JSON"',
          'u10',
          'u86400',
          'u144',
          'u90',
          'u"Category A"'
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      const providerData = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-provider',
        ["'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      expect(providerData.result).toContain('total-datasets: u1');
    });
  });

  describe('Data Purchase', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const buyer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"CNC Machine"',
          'u"Vibration Sensor"',
          '"QmABC123"',
          'u"Vibration data from CNC machine"',
          'u100000',
          '"JSON"',
          'u100',
          'u3600',
          'u1000',
          'u92',
          'u"Manufacturing"'
        ],
        provider
      );
    });

    it('should allow buyer to purchase sensor data', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should prevent duplicate purchases', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );
      expect(response.result).toBe('(err u208)');
    });

    it('should reject purchase of non-existent data', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u999'],
        buyer
      );
      expect(response.result).toBe('(err u201)');
    });

    it('should update listing purchase count', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );

      const listing = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-sensor-data-listing',
        ['u1'],
        buyer
      );

      expect(listing.result).toContain('total-purchases: u1');
    });

    it('should record purchase with correct details', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );

      const purchase = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-purchase',
        ['u1', `'${buyer}`],
        buyer
      );

      expect(purchase.result).toContain('price-paid: u100000');
      expect(purchase.result).toContain('access-granted: true');
    });

    it('should confirm data access after purchase', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );

      const accessCheck = simnet.callReadOnlyFn(
        'iot-marketplace',
        'check-data-access',
        ['u1', `'${buyer}`],
        buyer
      );

      expect(accessCheck.result).toBe('(ok true)');
    });
  });

  describe('Access Key Management', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const buyer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine"',
          'u"Test Sensor"',
          '"QmTest123"',
          'u"Test data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );
    });

    it('should allow provider to grant access key', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'grant-access-key',
        ['u1', `'${buyer}`, '"encrypted-key-hash-abc123"', 'u500'],
        provider
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should reject access key grant from non-provider', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'grant-access-key',
        ['u1', `'${buyer}`, '"encrypted-key-hash-abc123"', 'u500'],
        'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
      );
      expect(response.result).toBe('(err u203)');
    });

    it('should store access key with expiry', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'grant-access-key',
        ['u1', `'${buyer}`, '"encrypted-key-hash-abc123"', 'u500'],
        provider
      );

      const accessKey = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-access-key',
        ['u1', `'${buyer}`],
        buyer
      );

      expect(accessKey.result).toContain('key-hash: "encrypted-key-hash-abc123"');
      expect(accessKey.result).toContain('expires-block:');
    });
  });

  describe('Rating and Reviews', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const buyer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine"',
          'u"Test Sensor"',
          '"QmTest123"',
          'u"Test data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );
    });

    it('should allow buyer to rate purchased data', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'rate-data',
        ['u1', 'u5', 'u"Excellent data quality!"'],
        buyer
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should reject rating without purchase', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'rate-data',
        ['u1', 'u5', 'u"Great data"'],
        'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
      );
      expect(response.result).toBe('(err u201)');
    });

    it('should reject invalid rating value', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'rate-data',
        ['u1', 'u10', 'u"Invalid rating"'],
        buyer
      );
      expect(response.result).toBe('(err u206)');
    });

    it('should store rating and review', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'rate-data',
        ['u1', 'u4', 'u"Good quality data"'],
        buyer
      );

      const purchase = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-purchase',
        ['u1', `'${buyer}`],
        buyer
      );

      expect(purchase.result).toContain('rating: (some u4)');
      expect(purchase.result).toContain('review: (some u"Good quality data")');
    });
  });

  describe('Subscription Management', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const subscriber = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );
    });

    it('should allow provider to create subscription', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'create-subscription',
        [`'${subscriber}`, 'u"Manufacturing"', 'u50000', 'u144', 'u10'],
        provider
      );
      expect(response.result).toBe('(ok u1)');
    });

    it('should reject subscription with low price', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'create-subscription',
        [`'${subscriber}`, 'u"Manufacturing"', 'u5000', 'u144', 'u10'],
        provider
      );
      expect(response.result).toBe('(err u206)');
    });

    it('should allow subscriber to pay for subscription', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'create-subscription',
        [`'${subscriber}`, 'u"Manufacturing"', 'u50000', 'u144', 'u10'],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'pay-subscription',
        ['u1'],
        subscriber
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should reject payment from non-subscriber', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'create-subscription',
        [`'${subscriber}`, 'u"Manufacturing"', 'u50000', 'u144', 'u10'],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'pay-subscription',
        ['u1'],
        'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
      );
      expect(response.result).toBe('(err u203)');
    });

    it('should allow cancellation by subscriber', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'create-subscription',
        [`'${subscriber}`, 'u"Manufacturing"', 'u50000', 'u144', 'u10'],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'cancel-subscription',
        ['u1'],
        subscriber
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should allow cancellation by provider', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'create-subscription',
        [`'${subscriber}`, 'u"Manufacturing"', 'u50000', 'u144', 'u10'],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'cancel-subscription',
        ['u1'],
        provider
      );
      expect(response.result).toBe('(ok true)');
    });
  });

  describe('Price and Status Management', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine"',
          'u"Test Sensor"',
          '"QmTest123"',
          'u"Test data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );
    });

    it('should allow provider to update price', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'update-data-price',
        ['u1', 'u150000'],
        provider
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should reject price update below minimum', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'update-data-price',
        ['u1', 'u5000'],
        provider
      );
      expect(response.result).toBe('(err u206)');
    });

    it('should reject price update from non-provider', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'update-data-price',
        ['u1', 'u150000'],
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
      );
      expect(response.result).toBe('(err u203)');
    });

    it('should allow provider to toggle data status', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'toggle-data-status',
        ['u1'],
        provider
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should allow provider to toggle their status', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'toggle-provider-status',
        [],
        provider
      );
      expect(response.result).toBe('(ok true)');
    });
  });

  describe('Admin Functions', () => {
    const deployer = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const provider = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );
    });

    it('should allow owner to verify provider', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'verify-provider',
        [`'${provider}`],
        deployer
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should reject verification from non-owner', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'verify-provider',
        [`'${provider}`],
        'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
      );
      expect(response.result).toBe('(err u200)');
    });

    it('should allow owner to update reputation score', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'update-reputation',
        [`'${provider}`, 'u85'],
        deployer
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should reject invalid reputation score', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'update-reputation',
        [`'${provider}`, 'u150'],
        deployer
      );
      expect(response.result).toBe('(err u206)');
    });

    it('should allow owner to update platform fee', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'update-platform-fee',
        ['u5'],
        deployer
      );
      expect(response.result).toBe('(ok true)');
    });

    it('should reject platform fee above 15%', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'update-platform-fee',
        ['u20'],
        deployer
      );
      expect(response.result).toBe('(err u206)');
    });

    it('should allow owner to update minimum price', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'update-min-price',
        ['u20000'],
        deployer
      );
      expect(response.result).toBe('(ok true)');
    });
  });

  describe('Read-Only Functions', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

    it('should return platform fee percentage', () => {
      const response = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-platform-fee-percentage',
        [],
        provider
      );
      expect(response.result).toBe('(ok u3)');
    });

    it('should return minimum data price', () => {
      const response = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-min-data-price',
        [],
        provider
      );
      expect(response.result).toBe('(ok u10000)');
    });

    it('should calculate purchase amounts correctly', () => {
      const response = simnet.callReadOnlyFn(
        'iot-marketplace',
        'calculate-purchase-amounts',
        ['u100000'],
        provider
      );
      expect(response.result).toContain('total: u100000');
      expect(response.result).toContain('platform-fee: u3000');
      expect(response.result).toContain('provider-amount: u97000');
    });
  });

  describe('Bulk Purchase', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const buyer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );

      for (let i = 0; i < 3; i++) {
        simnet.callPublicFn(
          'iot-marketplace',
          'list-sensor-data',
          [
            'u"Test Machine"',
            'u"Test Sensor"',
            `"QmTest${i}"`,
            'u"Test data"',
            'u100000',
            '"JSON"',
            'u10',
            'u3600',
            'u1000',
            'u90',
            'u"Testing"'
          ],
          provider
        );
      }
    });

    it('should allow bulk purchase of multiple datasets', () => {
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'bulk-purchase-data',
        ['(list u1 u2 u3)'],
        buyer
      );
      expect(response.result).toContain('true');
    });

    it('should handle partial failures in bulk purchase', () => {
      // First purchase one dataset
      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );

      // Try to bulk purchase including already purchased item
      const response = simnet.callPublicFn(
        'iot-marketplace',
        'bulk-purchase-data',
        ['(list u1 u2 u3)'],
        buyer
      );
      
      // Should contain both true and false (failure for u1, success for u2 and u3)
      expect(response.result).toContain('false');
      expect(response.result).toContain('true');
    });
  });

  describe('Data Expiry', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const buyer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );
    });

    it('should reject purchase of expired data', () => {
      // List data with very short expiry
      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine"',
          'u"Test Sensor"',
          '"QmTest123"',
          'u"Test data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1', // expires in 1 block
          'u90',
          'u"Testing"'
        ],
        provider
      );

      // Mine some blocks to expire the data
      simnet.mineEmptyBlocks(5);

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );
      expect(response.result).toBe('(err u205)');
    });

    it('should allow purchase of non-expired data', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine"',
          'u"Test Sensor"',
          '"QmTest123"',
          'u"Test data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000', // expires in 1000 blocks
          'u90',
          'u"Testing"'
        ],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );
      expect(response.result).toBe('(ok true)');
    });
  });

  describe('Inactive Data and Providers', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const buyer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine"',
          'u"Test Sensor"',
          '"QmTest123"',
          'u"Test data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );
    });

    it('should reject purchase of inactive data', () => {
      // Toggle data to inactive
      simnet.callPublicFn(
        'iot-marketplace',
        'toggle-data-status',
        ['u1'],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );
      expect(response.result).toBe('(err u207)');
    });

    it('should reject listing from inactive provider', () => {
      // Toggle provider to inactive
      simnet.callPublicFn(
        'iot-marketplace',
        'toggle-provider-status',
        [],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"New Machine"',
          'u"New Sensor"',
          '"QmNew456"',
          'u"New data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );
      expect(response.result).toBe('(err u203)');
    });

    it('should allow purchase after reactivating data', () => {
      // Deactivate then reactivate
      simnet.callPublicFn(
        'iot-marketplace',
        'toggle-data-status',
        ['u1'],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'toggle-data-status',
        ['u1'],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );
      expect(response.result).toBe('(ok true)');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const buyer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';

    it('should return none for non-existent provider', () => {
      const response = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-provider',
        ["'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC"],
        buyer
      );
      expect(response.result).toBe('none');
    });

    it('should return none for non-existent data listing', () => {
      const response = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-sensor-data-listing',
        ['u999'],
        buyer
      );
      expect(response.result).toBe('none');
    });

    it('should return none for non-existent purchase', () => {
      const response = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-purchase',
        ['u1', `'${buyer}`],
        buyer
      );
      expect(response.result).toBe('none');
    });

    it('should return false for data access without purchase', () => {
      const response = simnet.callReadOnlyFn(
        'iot-marketplace',
        'check-data-access',
        ['u1', `'${buyer}`],
        buyer
      );
      expect(response.result).toBe('(ok false)');
    });

    it('should handle zero-duration subscription creation', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'create-subscription',
        [`'${buyer}`, 'u"Manufacturing"', 'u50000', 'u144', 'u0'],
        provider
      );
      // Should still succeed but end immediately
      expect(response.result).toBe('(ok u1)');
    });

    it('should reject grant access key for non-existent purchase', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine"',
          'u"Test Sensor"',
          '"QmTest123"',
          'u"Test data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );

      const response = simnet.callPublicFn(
        'iot-marketplace',
        'grant-access-key',
        ['u1', `'${buyer}`, '"key-hash"', 'u500'],
        provider
      );
      expect(response.result).toBe('(err u201)');
    });
  });

  describe('Revenue and Statistics Tracking', () => {
    const provider = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const buyer1 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const buyer2 = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';

    beforeEach(() => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"IoT Provider"'],
        provider
      );
    });

    it('should track provider revenue correctly', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine"',
          'u"Test Sensor"',
          '"QmTest123"',
          'u"Test data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer1
      );

      const providerData = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-provider',
        [`'${provider}`],
        provider
      );

      // Revenue should be price minus 3% platform fee = 97000
      expect(providerData.result).toContain('total-revenue: u97000');
    });

    it('should accumulate revenue from multiple sales', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine 1"',
          'u"Test Sensor 1"',
          '"QmTest1"',
          'u"Test data 1"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine 2"',
          'u"Test Sensor 2"',
          '"QmTest2"',
          'u"Test data 2"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer1
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u2'],
        buyer2
      );

      const providerData = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-provider',
        [`'${provider}`],
        provider
      );

      // Total revenue should be 194000 (97000 * 2)
      expect(providerData.result).toContain('total-revenue: u194000');
    });

    it('should track total purchases per listing', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Test Machine"',
          'u"Test Sensor"',
          '"QmTest123"',
          'u"Test data"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Testing"'
        ],
        provider
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer1
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer2
      );

      const listing = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-sensor-data-listing',
        ['u1'],
        provider
      );

      expect(listing.result).toContain('total-purchases: u2');
    });
  });

  describe('Multiple Providers', () => {
    const provider1 = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const provider2 = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const buyer = 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC';

    it('should allow multiple providers to register', () => {
      const response1 = simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Provider One"'],
        provider1
      );

      const response2 = simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Provider Two"'],
        provider2
      );

      expect(response1.result).toBe('(ok true)');
      expect(response2.result).toBe('(ok true)');
    });

    it('should track datasets separately for each provider', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Provider One"'],
        provider1
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Provider Two"'],
        provider2
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Machine A"',
          'u"Sensor A"',
          '"QmA"',
          'u"Data A"',
          'u50000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Cat A"'
        ],
        provider1
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Machine B"',
          'u"Sensor B"',
          '"QmB"',
          'u"Data B"',
          'u60000',
          '"CSV"',
          'u5',
          'u3600',
          'u1000',
          'u85',
          'u"Cat B"'
        ],
        provider2
      );

      const provider1Data = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-provider',
        [`'${provider1}`],
        buyer
      );

      const provider2Data = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-provider',
        [`'${provider2}`],
        buyer
      );

      expect(provider1Data.result).toContain('total-datasets: u1');
      expect(provider2Data.result).toContain('total-datasets: u1');
    });

    it('should track revenue separately for each provider', () => {
      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Provider One"'],
        provider1
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'register-provider',
        ['u"Provider Two"'],
        provider2
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Machine A"',
          'u"Sensor A"',
          '"QmA"',
          'u"Data A"',
          'u100000',
          '"JSON"',
          'u10',
          'u3600',
          'u1000',
          'u90',
          'u"Cat A"'
        ],
        provider1
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'list-sensor-data',
        [
          'u"Machine B"',
          'u"Sensor B"',
          '"QmB"',
          'u"Data B"',
          'u200000',
          '"CSV"',
          'u5',
          'u3600',
          'u1000',
          'u85',
          'u"Cat B"'
        ],
        provider2
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u1'],
        buyer
      );

      simnet.callPublicFn(
        'iot-marketplace',
        'buy-sensor-data',
        ['u2'],
        buyer
      );

      const provider1Data = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-provider',
        [`'${provider1}`],
        buyer
      );

      const provider2Data = simnet.callReadOnlyFn(
        'iot-marketplace',
        'get-data-provider',
        [`'${provider2}`],
        buyer
      );

      expect(provider1Data.result).toContain('total-revenue: u97000');
      expect(provider2Data.result).toContain('total-revenue: u194000');
    });
  });
});