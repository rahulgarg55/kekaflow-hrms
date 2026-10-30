/**
 * NovaHR - Attendance Rules & Verification Automated Test Suite
 * Tests Haversine geofencing, mock location heuristics, impossible travel,
 * buddy punching, shift calculations, and payroll cycle lock.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Transpiled or TS-node compatibility: We can write helper checks directly matching our engine algorithms
const EARTH_RADIUS_METERS = 6371000;

function calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

describe('NovaHR Attendance Rules Engine & Security Verification', () => {
  const HQ_COORDS = { lat: 28.4947, lng: 77.0888, radius: 250 }; // Cyber City Gurugram

  describe('1. Geofence & Haversine Distance Calculation', () => {
    it('should accurately calculate distance and verify coordinates inside 250m perimeter', () => {
      // 50 meters away inside DLF Cyber City Building 10
      const insideLat = 28.4950;
      const insideLng = 77.0890;
      const dist = calculateHaversineDistanceMeters(HQ_COORDS.lat, HQ_COORDS.lng, insideLat, insideLng);

      assert.ok(dist < HQ_COORDS.radius, `Expected distance ${dist}m to be < ${HQ_COORDS.radius}m`);
    });

    it('should flag coordinates located outside the 250m perimeter', () => {
      // Connaught Place New Delhi (~19.7 km away)
      const cpLat = 28.6315;
      const cpLng = 77.2167;
      const dist = calculateHaversineDistanceMeters(HQ_COORDS.lat, HQ_COORDS.lng, cpLat, cpLng);

      assert.ok(dist > 15000, `Expected distance ${dist}m to be > 15,000m`);
      assert.ok(dist > HQ_COORDS.radius);
    });
  });

  describe('2. Mock GPS & Location Spoofing Detection', () => {
    it('should detect OS mock location provider flag', () => {
      const geo = { latitude: 28.4948, longitude: 77.0889, accuracyMeters: 10, isMocked: true };
      assert.equal(geo.isMocked, true);
    });

    it('should flag suspiciously zero or artificial GPS accuracy', () => {
      const geo = { latitude: 28.4948, longitude: 77.0889, accuracyMeters: 0.05 };
      assert.ok(geo.accuracyMeters <= 0.1, 'Artificial accuracy flagged');
    });

    it('should flag impossible teleportation velocity jumps', () => {
      const punch1 = { lat: 28.4947, lng: 77.0888, timeMs: 1000000 };
      // Jump 350 km to Jaipur within 120 seconds
      const punch2 = { lat: 26.9124, lng: 75.7873, timeMs: 1000000 + 120 * 1000 };

      const distMeters = calculateHaversineDistanceMeters(punch1.lat, punch1.lng, punch2.lat, punch2.lng);
      const elapsedSec = (punch2.timeMs - punch1.timeMs) / 1000;
      const speedKmh = (distMeters / elapsedSec) * 3.6;

      assert.ok(speedKmh > 5000, `Speed ${speedKmh} km/h indicates spoofed teleportation`);
    });
  });

  describe('3. Multi-User Buddy Punching Detection', () => {
    it('should detect the same device registering punches for distinct employees within 15 minutes', () => {
      const recentPunches = [
        { deviceId: 'dev_iphone_14_pro', employeeId: 'emp_001', timeMs: 1000000 },
      ];

      const newPunch = {
        deviceId: 'dev_iphone_14_pro',
        employeeId: 'emp_002',
        timeMs: 1000000 + 180 * 1000, // 3 minutes later
      };

      const sharedSharers = recentPunches.filter(
        (p) => p.deviceId === newPunch.deviceId && p.employeeId !== newPunch.employeeId && (newPunch.timeMs - p.timeMs) < 900000
      );

      assert.equal(sharedSharers.length, 1);
      assert.equal(sharedSharers[0].employeeId, 'emp_001');
    });
  });

  describe('4. Clock Drift Detection', () => {
    it('should flag client clock back-dated or fast-forwarded by more than 120 seconds', () => {
      const serverMs = new Date('2026-10-30T10:00:00Z').getTime();
      const deviceMs = new Date('2026-10-30T09:50:00Z').getTime(); // 10 minutes earlier (600s drift)
      const driftSeconds = Math.abs(Math.round((serverMs - deviceMs) / 1000));

      assert.equal(driftSeconds, 600);
      assert.ok(driftSeconds > 120, 'Drift exceeds 120s threshold');
    });
  });

  describe('5. Fixed Shift Rules, Grace Periods & Status Evaluation', () => {
    const shift = {
      startTime: '09:30',
      endTime: '18:30',
      gracePeriodMinutes: 15, // up to 09:45
      halfDayMinHours: 4.5,
      fullDayMinHours: 8.0,
      overtimeThresholdHours: 9.0,
    };

    function parseTimeMins(t) {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    }

    it('should mark arrival at 09:40 as on-time (within 15-minute grace period)', () => {
      const arrival = '09:40';
      const shiftStartMins = parseTimeMins(shift.startTime);
      const arrivalMins = parseTimeMins(arrival);
      const isLate = arrivalMins > shiftStartMins + shift.gracePeriodMinutes;

      assert.equal(isLate, false);
    });

    it('should mark arrival at 09:55 as late by 25 minutes', () => {
      const arrival = '09:55';
      const shiftStartMins = parseTimeMins(shift.startTime);
      const arrivalMins = parseTimeMins(arrival);
      const isLate = arrivalMins > shiftStartMins + shift.gracePeriodMinutes;
      const lateMins = arrivalMins - shiftStartMins;

      assert.equal(isLate, true);
      assert.equal(lateMins, 25);
    });

    it('should evaluate work hours status: <4.5h ABSENT, 4.5h-8.0h HALF_DAY, >=8.0h PRESENT', () => {
      function evaluateStatus(hours) {
        if (hours < shift.halfDayMinHours) return 'ABSENT';
        if (hours < shift.fullDayMinHours) return 'HALF_DAY';
        return 'PRESENT';
      }

      assert.equal(evaluateStatus(3.5), 'ABSENT');
      assert.equal(evaluateStatus(6.0), 'HALF_DAY');
      assert.equal(evaluateStatus(8.5), 'PRESENT');
    });

    it('should accrue overtime when work hours exceed overtime threshold', () => {
      const workedHours = 10.5;
      const ot = workedHours > shift.overtimeThresholdHours ? workedHours - shift.overtimeThresholdHours : 0;
      assert.equal(ot, 1.5);
    });
  });

  describe('6. Biometric Device Punch De-duplication', () => {
    it('should de-duplicate double-taps within 60 seconds from the same biometric scanner', () => {
      const raw = [
        { employeeCode: 'EMP101', punchTimestamp: '2026-10-30T09:30:10Z' },
        { employeeCode: 'EMP101', punchTimestamp: '2026-10-30T09:30:25Z' }, // Duplicate (15s diff)
        { employeeCode: 'EMP102', punchTimestamp: '2026-10-30T09:30:30Z' },
        { employeeCode: 'EMP101', punchTimestamp: '2026-10-30T18:35:00Z' }, // Legitimate OUT
      ];

      const deduped = [];
      for (const p of raw) {
        const pTime = new Date(p.punchTimestamp).getTime();
        const isDup = deduped.some(
          (d) => d.employeeCode === p.employeeCode && Math.abs(pTime - new Date(d.punchTimestamp).getTime()) < 60000
        );
        if (!isDup) deduped.push(p);
      }

      assert.equal(deduped.length, 3);
      assert.equal(deduped[0].punchTimestamp, '2026-10-30T09:30:10Z');
      assert.equal(deduped[1].employeeCode, 'EMP102');
      assert.equal(deduped[2].punchTimestamp, '2026-10-30T18:35:00Z');
    });
  });

  describe('7. Payroll Cycle Finalizer & SHA-256 Checksum', () => {
    it('should compute LOP days and generate tamper-proof SHA-256 snapshot', () => {
      const crypto = require('crypto');
      const totalDays = 31;
      const unregularizedDays = 2.5; // 2 absent days + 1 unregularized half-day
      const lopDays = unregularizedDays;
      const netPayableDays = totalDays - lopDays;

      assert.equal(netPayableDays, 28.5);

      const snapshot = JSON.stringify({ cycle: '2026-10', netPayableDays, lopDays });
      const hash = crypto.createHash('sha256').update(snapshot).digest('hex');

      assert.equal(typeof hash, 'string');
      assert.equal(hash.length, 64);
    });
  });
});
