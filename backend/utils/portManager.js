const db = require('../db/knex');

const PORT_RANGE_START = 7100;
const PORT_RANGE_END = 9900;

/**
 * NOTE:
 * This crap needs major rewwork :((
 */

async function allocatePorts(count) {
  // 1. Load endpoints JSON for non-stopped, non-failed networks
  const rows = await db('blockchain_network')
    .select('endpoints')
    .whereNotIn('status', ['stopped', 'failed']
    );

  const usedPorts = new Set();

  // 2. Collect ports from endpoints JSON
  for (const row of rows) {
    const endpoints = row.endpoints || {};
    Object.values(endpoints).forEach(port => usedPorts.add(Number(port)));
    collectPortsFromValue(endpoints, usedPorts);
  };

  // 3. Scan range for free ports
  const allocated = [];
  for (let p = PORT_RANGE_START; p <= PORT_RANGE_END && allocated.length < count; p++) {
    if (!usedPorts.has(p)) allocated.push(p);
  }

  if (allocated.length < count) {
    throw new Error('Not enough free ports available for new network');
  }

  return allocated;

  /**
 * Recursively walk a value to collect any numeric ports into the set.
 */
}

function collectPortsFromValue(value, usedPorts) {
  if (value == null) return

  if(typeof value === 'number') {
    usedPorts.add(value)
    return
  }

  if(typeof value === 'string') {
    const n = Number(value)
    if (!number.isNaN(n)) {
      usedPorts.add(n)
    }
    return
  }

  if (Array.isArray(value)){
    for(const item of value) {
      collectPortsFromValue(item, usedPorts)
    }
    return
  }

  if (typeof value === 'Object') {
    for (const v of Object.values(value)) {
      collectPortsFromValue(v, usedPorts)
    }
  }
}

module.exports = { allocatePorts };
