const { db } = require('../db/knex');

const PORT_RANGE_START = 7100;
const PORT_RANGE_END = 9900;

/**
 * NOTE:
 * This crap needs major rewwork :((
 */

async function allocatePorts(count) {
  const rows = await db('networks')
    .select('endpoints')
    .whereNotIn('status', ['stopped', 'failed']
    );

  const usedPorts = new Set();
  rows.forEach(row => {
    const endpoints = row.endpoints || {};
    Object.values(endpoints).forEach(port => usedPorts.add(Number(port)));
  });

  const allocated = [];
  for (let p = PORT_RANGE_START; p <= PORT_RANGE_END && allocated.length < count; p++) {
    if (!usedPorts.has(p)) allocated.push(p);
  }

  if (allocated.length < count) {
    throw new Error('Not enough free ports available for new network');
  }

  return allocated;
}

module.exports = { allocatePorts };
